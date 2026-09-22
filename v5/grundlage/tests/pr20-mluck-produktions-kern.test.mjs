import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";

import {
  MLUCK_EINMAL_BESTAETIGUNG,
  MERCHANT_MLUCK_CORE_MODUL_ID,
  MERCHANT_MLUCK_FAEHIGKEIT_ID,
  ProduktiveMluckTransaktion,
  bewerteProduktiveMluckAdmission,
  erteileProduktiveMluckEinmalAuthority,
  merchantMluckCoreModulDefinition,
  merchantMluckMutationsFaehigkeitDefinition,
} from "../../erzeugt/index.js";
import {
  NodeMluckEinmalAuthorityProtokoll,
} from "../adapter/persistenz/node-mluck-einmal-authority-protokoll.mjs";
import {
  NodeMluckTransaktionsJournal,
} from "../adapter/persistenz/node-mluck-transaktionsjournal.mjs";
import {
  NodeProduktionsDateisystem,
} from "../adapter/persistenz/node-produktions-dateisystem.mjs";

function live(overrides = {}) {
  return Object.freeze({
    schemaVersion: 1,
    merchantId: "merchant-test",
    merchantSessionId: "merchant-session",
    targetId: "ranger-test",
    targetSessionId: "ranger-session",
    sameAccount: true,
    sameServer: true,
    sameInstance: true,
    senderCtype: "merchant",
    senderLevel: 80,
    senderMp: 500,
    senderDisabled: false,
    skillCooldownAktiv: false,
    distance: 100,
    targetMluckActive: false,
    targetMluckSource: null,
    targetMluckStrong: false,
    criticalMerchantWorkActive: false,
    beobachtetAmMs: 10_000,
    fingerprint: "mluck-prestate-test",
    ...overrides,
  });
}

function health(now = 10_000) {
  return Object.freeze([Object.freeze({
    healthId: "produktiver-speicher",
    zustand: "GESUND",
    beobachtetAmMs: now,
    gueltigBisMs: now + 10_000,
    evidenceId: "storage-health-test",
  })]);
}

test("PR20.6 MLuck provider is separate, mutating, single-owner and default-off", () => {
  const modul = merchantMluckCoreModulDefinition();
  const cap = merchantMluckMutationsFaehigkeitDefinition();
  assert.equal(modul.modulId, MERCHANT_MLUCK_CORE_MODUL_ID);
  assert.deepEqual(modul.bereitgestellteFaehigkeiten, [MERCHANT_MLUCK_FAEHIGKEIT_ID]);
  assert.equal(modul.standardAktiv, false);
  assert.equal(cap.modus, "MUTIEREN");
  assert.equal(cap.standardAktiv, false);
  assert.equal(cap.anbieterModulId, MERCHANT_MLUCK_CORE_MODUL_ID);
});

test("PR20.6 MLuck live admission is fail-closed on priority, freshness and foreign strong buff", () => {
  assert.equal(bewerteProduktiveMluckAdmission(live(), 10_000).bereit, true);

  const critical = bewerteProduktiveMluckAdmission(
    live({ criticalMerchantWorkActive: true }),
    10_000,
  );
  assert.equal(critical.bereit, false);
  assert.ok(critical.blocker.includes("KRITISCHE_MERCHANT_ARBEIT_HAT_VORRANG"));

  const stale = bewerteProduktiveMluckAdmission(
    live({ beobachtetAmMs: 8_000 }),
    10_000,
  );
  assert.equal(stale.bereit, false);
  assert.ok(stale.blocker.includes("EVIDENCE_STALE"));

  const foreign = bewerteProduktiveMluckAdmission(live({
    targetMluckActive: true,
    targetMluckStrong: true,
    targetMluckSource: "anderer-merchant",
  }), 10_000);
  assert.equal(foreign.bereit, false);
  assert.ok(foreign.blocker.includes(
    "FREMDES_STARKES_MLUCK_DARF_NICHT_UEBERSCHRIEBEN_WERDEN",
  ));
});

test("PR20.6 MLuck authority is durable, short-lived and exactly once", async () => {
  let durable = 0;
  const authority = await erteileProduktiveMluckEinmalAuthority({
    schemaVersion: 1,
    aktivierungsId: "mluck-auth-1",
    transaktionsId: "mluck-tx-1",
    bestaetigungText: MLUCK_EINMAL_BESTAETIGUNG,
    healthEvidence: health(),
    liveEvidence: live(),
    jetztMs: 10_000,
    gueltigBisMs: 12_000,
    faehigkeitsGeneration: 3,
  }, {
    async schreibeDurable(intent) {
      durable += 1;
      assert.equal(intent.art, "MLUCK_EINMAL_AUTHORITY_VOR_WIRKUNG");
      return {
        durable: true,
        bestaetigungsId: "ack-1",
        aktivierungsId: intent.aktivierungsId,
        transaktionsId: intent.transaktionsId,
      };
    },
  });
  assert.equal(durable, 1);
  assert.equal(authority.gueltigFuer(10_001), true);
  assert.equal(authority.pruefe(
    MERCHANT_MLUCK_FAEHIGKEIT_ID,
    MERCHANT_MLUCK_CORE_MODUL_ID,
  ).erlaubt, true);
  assert.equal(authority.pruefe(
    MERCHANT_MLUCK_FAEHIGKEIT_ID,
    MERCHANT_MLUCK_CORE_MODUL_ID,
  ).erlaubt, false);
});

test("PR20.6 committed transaction sends at most once and verifies exact target settlement", async () => {
  const authority = await erteileProduktiveMluckEinmalAuthority({
    schemaVersion: 1,
    aktivierungsId: "mluck-auth-commit",
    transaktionsId: "mluck-tx-commit",
    bestaetigungText: MLUCK_EINMAL_BESTAETIGUNG,
    healthEvidence: health(),
    liveEvidence: live(),
    jetztMs: 10_000,
    gueltigBisMs: 12_000,
    faehigkeitsGeneration: 1,
  }, {
    async schreibeDurable(intent) {
      return {
        durable: true,
        bestaetigungsId: "ack-commit",
        aktivierungsId: intent.aktivierungsId,
        transaktionsId: intent.transaktionsId,
      };
    },
  });

  const entries = [];
  let calls = 0;
  const result = await new ProduktiveMluckTransaktion().fuehreEinmalAus({
    schemaVersion: 1,
    transaktionsId: "mluck-tx-commit",
    targetId: "ranger-test",
    targetSessionId: "ranger-session",
    liveEvidence: live(),
    authority,
    jetztMs: () => 10_001,
  }, {
    async haengeDurableAn(entry) {
      entries.push(entry);
      return {
        durable: true,
        bestaetigungsId: "j-" + entry.sequenz,
        journalId: entry.journalId,
        transaktionsId: entry.transaktionsId,
        sequenz: entry.sequenz,
      };
    },
    async liesTransaktion() { return entries; },
  }, {
    adapterId: "test",
    actionContractId: "AL-ACTION-MLUCK-SAME-ACCOUNT",
    recoveryContractId: "AL-RECOVERY-MLUCK-SAME-ACCOUNT",
    verifierId: "AL-VERIFIER-MLUCK-SAME-ACCOUNT",
    async sende(targetId) {
      calls += 1;
      assert.equal(targetId, "ranger-test");
      return { art: "SERVER_ERGEBNIS", korrelationId: "mluck-1" };
    },
  }, {
    async beobachte() {
      return {
        klassifikation: "BESTAETIGT",
        beobachtetAmMs: 10_100,
        targetSessionId: "ranger-session",
        targetMluckActive: true,
        targetMluckSource: "merchant-test",
        targetMluckStrong: true,
        senderMpNachher: 490,
        cooldownAktivNachher: true,
        senderExecutionEvidenceConsistent: true,
        fingerprint: "post-1",
      };
    },
  });

  assert.equal(calls, 1);
  assert.equal(result.status, "COMMITTED");
  assert.equal(result.journalTerminalArt, "COMMIT");
  assert.equal(result.sameIntentErneutSenden, false);
  assert.deepEqual(entries.map(x => x.art), [
    "INTENT", "SERVER_ERGEBNIS", "POSTCONDITION", "COMMIT",
  ]);
});

test("PR20.6 UNKNOWN never resends same intent and fails closed when unresolved", async () => {
  const authority = await erteileProduktiveMluckEinmalAuthority({
    schemaVersion: 1,
    aktivierungsId: "mluck-auth-unknown",
    transaktionsId: "mluck-tx-unknown",
    bestaetigungText: MLUCK_EINMAL_BESTAETIGUNG,
    healthEvidence: health(),
    liveEvidence: live(),
    jetztMs: 10_000,
    gueltigBisMs: 12_000,
    faehigkeitsGeneration: 1,
  }, {
    async schreibeDurable(intent) {
      return {
        durable: true,
        bestaetigungsId: "ack-unknown",
        aktivierungsId: intent.aktivierungsId,
        transaktionsId: intent.transaktionsId,
      };
    },
  });
  const entries = [];
  let calls = 0;
  let observations = 0;
  const result = await new ProduktiveMluckTransaktion().fuehreEinmalAus({
    schemaVersion: 1,
    transaktionsId: "mluck-tx-unknown",
    targetId: "ranger-test",
    targetSessionId: "ranger-session",
    liveEvidence: live(),
    authority,
    jetztMs: () => 10_001,
  }, {
    async haengeDurableAn(entry) {
      entries.push(entry);
      return {
        durable: true,
        bestaetigungsId: "j-" + entry.sequenz,
        journalId: entry.journalId,
        transaktionsId: entry.transaktionsId,
        sequenz: entry.sequenz,
      };
    },
    async liesTransaktion() { return entries; },
  }, {
    adapterId: "test",
    actionContractId: "AL-ACTION-MLUCK-SAME-ACCOUNT",
    recoveryContractId: "AL-RECOVERY-MLUCK-SAME-ACCOUNT",
    verifierId: "AL-VERIFIER-MLUCK-SAME-ACCOUNT",
    async sende() {
      calls += 1;
      return { art: "UNBEKANNT", grund: "DISCONNECT_NACH_MOEGLICHEM_SEND" };
    },
  }, {
    async beobachte(versuch) {
      observations += 1;
      return {
        klassifikation: versuch < 4 ? "NOCH_AUSSTEHEND" : "UNGEKLAERT",
        beobachtetAmMs: 10_100 + versuch,
        targetSessionId: "ranger-session",
        targetMluckActive: false,
        targetMluckSource: null,
        targetMluckStrong: false,
        senderMpNachher: 490,
        cooldownAktivNachher: true,
        senderExecutionEvidenceConsistent: true,
        fingerprint: "unknown-" + versuch,
      };
    },
  });
  assert.equal(calls, 1);
  assert.equal(observations, 4);
  assert.equal(result.status, "OPERATOR_REQUIRED");
  assert.equal(result.sameIntentErneutSenden, false);
  assert.equal(entries.at(-1).art, "SICHER_FEHLGESCHLAGEN");
});

test("PR20.6 Node persistence keeps authority and transaction state durable", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "v5-mluck-"));
  try {
    const ds = new NodeProduktionsDateisystem({ wurzel: root, testmodus: true });
    const auth = new NodeMluckEinmalAuthorityProtokoll(ds);
    const ack = await auth.schreibeDurable({
      schemaVersion: 1,
      art: "MLUCK_EINMAL_AUTHORITY_VOR_WIRKUNG",
      aktivierungsId: "auth-file",
      transaktionsId: "tx-file",
      faehigkeitId: "merchant.mluck.same_account",
      ownerId: "merchant-mluck-core",
      ownerVersion: "1",
      actionContractId: "AL-ACTION-MLUCK-SAME-ACCOUNT",
      recoveryContractId: "AL-RECOVERY-MLUCK-SAME-ACCOUNT",
      verifierId: "AL-VERIFIER-MLUCK-SAME-ACCOUNT",
      policyId: "MERCHANT-MLUCK-SAME-ACCOUNT-EINMAL-V1",
      evidenceIds: ["e-1"],
      liveEvidenceFingerprint: "fp-1",
      ausgestelltAmMs: 100,
      gueltigBisMs: 2000,
      maximaleVerwendungen: 1,
      rawWriteAutoritaet: false,
      breiteRuntimeFreigabe: false,
    });
    assert.equal(ack.durable, true);

    const journal = new NodeMluckTransaktionsJournal(ds);
    await journal.haengeDurableAn({
      schemaVersion: 1,
      journalId: "tx-file:1",
      transaktionsId: "tx-file",
      sequenz: 1,
      art: "INTENT",
      zeitMs: 100,
      inhalt: { same_intent_retry: false },
    });
    assert.equal((await journal.pruefeStartBereit()).bereit, false);
    await journal.haengeDurableAn({
      schemaVersion: 1,
      journalId: "tx-file:2",
      transaktionsId: "tx-file",
      sequenz: 2,
      art: "ABBRUCH",
      zeitMs: 101,
      inhalt: { same_intent_retry: false },
    });
    assert.equal((await journal.pruefeStartBereit()).bereit, true);
    assert.equal((await journal.liesTransaktion("tx-file")).length, 2);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
