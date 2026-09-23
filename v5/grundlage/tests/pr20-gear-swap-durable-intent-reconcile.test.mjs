import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  erstellePr207GearSwapOneShotAuthority,
  persistierePr207GearSwapDurableIntent,
  pruefePr207GearSwapVorbereitung,
  reconcilePr207GearSwapNachMoeglichemSend,
} from "../../erzeugt/index.js";

class JournalFake {
  constructor({ corruptAck = false } = {}) {
    this.eintraege = [];
    this.corruptAck = corruptAck;
  }
  async haengeDurableAn(eintrag) {
    this.eintraege.push(eintrag);
    return {
      durable: true,
      bestaetigungsId: "ACK-" + eintrag.journalId,
      journalId: this.corruptAck ? "wrong-journal" : eintrag.journalId,
      transaktionsId: eintrag.transaktionsId,
      sequenz: eintrag.sequenz,
    };
  }
  async liesTransaktion(transaktionsId) {
    return this.eintraege.filter(x => x.transaktionsId === transaktionsId);
  }
}

function bindung(overrides = {}) {
  return {
    schemaVersion: 1,
    accountId: "account-1",
    characterId: "My_Merchant",
    sessionId: "merchant-session-1",
    serverRegion: "EU",
    serverIdentifier: "I",
    rosterEpoche: 12,
    rosterFingerprint: "roster-fp-12",
    ...overrides,
  };
}

function item(id, overrides = {}) {
  return {
    name: id,
    level: 1,
    physischeKennung: "physical:" + id,
    beobachtungsFingerprint: "fp:" + id,
    physisch: true,
    gesperrt: false,
    virtuellB: false,
    ...overrides,
  };
}

function plan() {
  const prep = pruefePr207GearSwapVorbereitung({
    schemaVersion: 1,
    evidenceId: "gear-swap-evidence-2",
    recipient: bindung(),
    merchantAccountId: "account-1",
    slot: "helmet",
    kandidatIndex: 7,
    kandidat: item("wcap"),
    vorherigesSlotItem: item("partyhat"),
    kompatibel: true,
    contentVerifiziert: true,
    dispositionErlaubt: true,
    beobachtetAmMs: 1_000,
    gueltigBisMs: 2_500,
    maximalesEvidenceAlterMs: 2_000,
    restInventarFingerprint: "rest-inv",
    restEquipmentFingerprint: "rest-equip",
    evidenceFingerprint: "evidence-fp-2",
  }, 1_100);
  assert.ok(prep.plan);
  return prep.plan;
}

function authority() {
  return erstellePr207GearSwapOneShotAuthority({
    schemaVersion: 1,
    aktivierungsId: "pr20-7-one-shot-2",
    transaktionsId: "pr20-7-swap-tx-2",
    plan: plan(),
    ausgestelltAmMs: 1_200,
    gueltigBisMs: 2_200,
    equipmentFenceEpoche: 51,
    inventoryFenceEpoche: 81,
  });
}

function observation(p, overrides = {}) {
  return {
    schemaVersion: 1,
    recipient: p.recipient,
    slot: p.slot,
    kandidatIndex: p.kandidatIndex,
    slotFingerprint: p.expectedPostcondition.slotFingerprint,
    indexFingerprint: p.expectedPostcondition.indexFingerprint,
    restInventarFingerprint: p.expectedPostcondition.restInventarFingerprint,
    restEquipmentFingerprint: p.expectedPostcondition.restEquipmentFingerprint,
    beobachtetAmMs: 1_600,
    ...overrides,
  };
}

test("PR20.7 persistiert Durable Intent vor jeder moeglichen Wirkung und bleibt NO-WRITE", async () => {
  const journal = new JournalFake();
  const p = plan();
  const a = authority();
  const result = await persistierePr207GearSwapDurableIntent({
    schemaVersion: 1,
    transaktionsId: "pr20-7-swap-tx-2",
    auftragId: "auftrag-2",
    ablaufId: "ablauf-2",
    plan: p,
    authority: a,
    jetztMs: 1_500,
    equipmentFenceEpoche: 51,
    inventoryFenceEpoche: 81,
  }, journal);

  assert.equal(result.status, "INTENT_DURABLE_NO_WRITE");
  assert.equal(result.durable, true);
  assert.equal(result.sendBoundaryState, "NICHT_GESENDET");
  assert.equal(result.sameIntentRetry, false);
  assert.equal(result.gameplayWrites, 0);
  assert.equal(result.publicFunctionCalls, 0);
  assert.equal(result.rawWriteCalls, 0);
  assert.equal(result.gameplayAutoritaet, false);
  assert.equal(result.rawWriteAutoritaet, false);
  assert.equal(result.swapWriteRatification, false);
  assert.equal(a.verbraucht(), true);
  assert.equal(journal.eintraege.length, 1);
  const intent = journal.eintraege[0];
  assert.equal(intent.art, "INTENT");
  assert.equal(intent.inhalt.send_boundary_state, "NICHT_GESENDET");
  assert.equal(intent.inhalt.same_intent_retry, false);
  assert.equal(intent.inhalt.slot, "helmet");
  assert.equal(intent.inhalt.kandidat_index, 7);
  assert.equal(intent.inhalt.resource_claims_and_fencing.length, 2);
});

test("PR20.7 Durable Intent failt closed wenn Journal-Durability nicht exakt bestaetigt wird", async () => {
  const journal = new JournalFake({ corruptAck: true });
  await assert.rejects(
    () => persistierePr207GearSwapDurableIntent({
      schemaVersion: 1,
      transaktionsId: "pr20-7-swap-tx-2",
      auftragId: "auftrag-2",
      ablaufId: "ablauf-2",
      plan: plan(),
      authority: authority(),
      jetztMs: 1_500,
      equipmentFenceEpoche: 51,
      inventoryFenceEpoche: 81,
    }, journal),
    /JOURNAL_DURABILITY_NICHT_BESTAETIGT/,
  );
});

test("PR20.7 Durable Intent blockiert Fence-Drift vor Persistenz", async () => {
  const journal = new JournalFake();
  await assert.rejects(
    () => persistierePr207GearSwapDurableIntent({
      schemaVersion: 1,
      transaktionsId: "pr20-7-swap-tx-2",
      auftragId: "auftrag-2",
      ablaufId: "ablauf-2",
      plan: plan(),
      authority: authority(),
      jetztMs: 1_500,
      equipmentFenceEpoche: 52,
      inventoryFenceEpoche: 81,
    }, journal),
    /PR20_7_GEAR_ONE_SHOT_BINDUNG_ODER_FENCE_DRIFT/,
  );
  assert.equal(journal.eintraege.length, 0);
});

test("PR20.7 Reconcile bestaetigt exakte Zwei-Ort-Postcondition ohne Retry", () => {
  const p = plan();
  const r = reconcilePr207GearSwapNachMoeglichemSend(p, observation(p));
  assert.equal(r.status, "COMMITTED");
  assert.equal(r.settlement, "BESTAETIGT");
  assert.equal(r.sameIntentRetry, false);
  assert.equal(r.neuerIntentAutomatischErlaubt, false);
});

test("PR20.7 Reconcile unterscheidet NOT_APPLIED, PARTIAL und UNKNOWN fail-closed", () => {
  const p = plan();
  const notApplied = reconcilePr207GearSwapNachMoeglichemSend(
    p,
    observation(p, {
      slotFingerprint: p.prestate.slotFingerprint,
      indexFingerprint: p.prestate.indexFingerprint,
    }),
  );
  assert.equal(notApplied.status, "NOT_APPLIED");
  assert.equal(notApplied.sameIntentRetry, false);

  const partial = reconcilePr207GearSwapNachMoeglichemSend(
    p,
    observation(p, {
      indexFingerprint: p.prestate.indexFingerprint,
    }),
  );
  assert.equal(partial.status, "PARTIAL_OPERATOR_REQUIRED");
  assert.equal(partial.sameIntentRetry, false);

  const unknown = reconcilePr207GearSwapNachMoeglichemSend(
    p,
    observation(p, {
      recipient: bindung({ sessionId: "other-session" }),
      restInventarFingerprint: "drift",
    }),
  );
  assert.equal(unknown.status, "UNKNOWN_OPERATOR_REQUIRED");
  assert.equal(unknown.sameIntentRetry, false);
  assert.equal(unknown.neuerIntentAutomatischErlaubt, false);
});

test("PR20.7 Durable/Reconcile-Foundation enthaelt keinen Gameplay-Write-Pfad", () => {
  const source = fs.readFileSync(
    "grundlage/quelle/equipment/pr20-7-gear-swap-durable-intent-reconcile.ts",
    "utf8",
  );
  for (const forbidden of [
    ".equip(",
    "unequip(",
    "socket.emit(",
    ".socket.emit(",
    "api_call(",
    "use_skill(",
    "send_item(",
  ]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
  assert.ok(source.includes("sendBoundaryState: \"NICHT_GESENDET\""));
  assert.ok(source.includes("sameIntentRetry: false"));
  assert.ok(source.includes("gameplayAutoritaet: false"));
});
