import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  RecoveryKernel,
  friereTransaktionsSnapshot,
} from "../../erzeugt/index.js";

const COMMIT = "1".repeat(40);
const HASH = "a".repeat(64);

function snapshot(overrides = {}) {
  return {
    schemaVersion: 1,
    wissensSnapshot: {
      gitCommit: COMMIT,
      quellenSha256: [HASH],
    },
    configFingerprint: "cfg:v1",
    prestateFingerprint: "pre:v1",
    actionContractId: "AL-ACTION-BANK-DEPOSIT",
    recoveryContractId: "AL-RECOVERY-BANK-DEPOSIT",
    verifierId: "AL-VERIFIER-BANK-DEPOSIT",
    ...overrides,
  };
}

function differenz({
  erwartet = ["bank", "character"],
  angewendet = [],
  offen = [],
  widerspruch = [],
} = {}) {
  return {
    schemaVersion: 1,
    erwarteteDomaenen: erwartet,
    angewendeteDomaenen: angewendet,
    offeneDomaenen: offen,
    widerspruechlicheDomaenen: widerspruch,
  };
}

function evidence(klassifikation, snap, diff = differenz()) {
  return {
    schemaVersion: 1,
    klassifikation,
    beobachtetAmMs: 200,
    snapshot: snap,
    differenz: diff,
    evidenceFingerprints: ["evidence:1"],
  };
}

function vertraege({ produktivErlaubt = true, max = 3 } = {}) {
  return {
    pruefe(actionContractId, recoveryContractId) {
      return {
        actionContractId,
        recoveryContractId,
        produktivErlaubt,
        sameIntentAfterPossibleSend: "NEVER",
        maximaleBeobachtungen: max,
        fehlerDomaeneId: "bank",
      };
    },
  };
}

function anfrage(transportErgebnis, snap = snapshot()) {
  return {
    schemaVersion: 1,
    transaktionsId: "T-1",
    actionContractId: snap.actionContractId,
    recoveryContractId: snap.recoveryContractId,
    transportErgebnis,
    snapshot: snap,
  };
}

test("Server-Ergebnis allein ist kein Commit; Postcondition-Evidence entscheidet", async () => {
  let beobachtungen = 0;
  const snap = snapshot();
  const kernel = new RecoveryKernel(vertraege(), {
    async beobachte() {
      beobachtungen += 1;
      return evidence("UNGEKLAERT", snap, differenz({
        offen: ["bank", "character"],
      }));
    },
  });

  const result = await kernel.gleicheAb(anfrage({
    art: "SERVER_ERGEBNIS",
    korrelationId: "K-1",
    ergebnis: { ok: true },
  }, snap));

  assert.equal(beobachtungen, 1);
  assert.equal(result.art, "OPERATOR_REQUIRED");
  assert.equal(result.sameIntentErneutSenden, false);
});

test("UNKNOWN fuehrt zu Abgleich und niemals zu Same-Intent-Send", async () => {
  const snap = snapshot();
  const kernel = new RecoveryKernel(vertraege(), {
    async beobachte() {
      return evidence("NICHT_AUSGEFUEHRT", snap, differenz({
        offen: ["bank", "character"],
      }));
    },
  });

  const result = await kernel.gleicheAb(anfrage({
    art: "UNBEKANNT",
    grund: "DISCONNECT_NACH_MOEGLICHEM_SEND",
    korrelationId: null,
  }, snap));

  assert.equal(result.art, "REPLAN_ALLOWED");
  assert.equal(result.neuerIntentErforderlich, true);
  assert.equal(result.sameIntentErneutSenden, false);
});

test("Partial Completion wird diff-basiert in einen Restplan ueberfuehrt", async () => {
  const snap = snapshot();
  const kernel = new RecoveryKernel(vertraege(), {
    async beobachte() {
      return evidence("TEILWEISE", snap, differenz({
        angewendet: ["bank"],
        offen: ["character"],
      }));
    },
  });

  const result = await kernel.gleicheAb(anfrage({
    art: "UNBEKANNT",
    grund: "TIMEOUT_NACH_MOEGLICHEM_SEND",
    korrelationId: "K-2",
  }, snap));

  assert.equal(result.art, "REPLAN_ALLOWED");
  assert.deepEqual(result.restDomaenen, ["character"]);
  assert.equal(result.neuerIntentErforderlich, true);
  assert.equal(result.sameIntentErneutSenden, false);
});

test("NOCH_AUSSTEHEND ist bounded und endet fail-safe ohne Send", async () => {
  const snap = snapshot();
  let beobachtungen = 0;
  const kernel = new RecoveryKernel(vertraege({ max: 3 }), {
    async beobachte() {
      beobachtungen += 1;
      return evidence("NOCH_AUSSTEHEND", snap, differenz({
        offen: ["bank", "character"],
      }));
    },
  });

  const result = await kernel.gleicheAb(anfrage({
    art: "UNBEKANNT",
    grund: "TRANSPORT_UNKLAR",
    korrelationId: null,
  }, snap));

  assert.equal(beobachtungen, 3);
  assert.equal(result.art, "FAILED_SAFE");
  assert.equal(result.beobachtungen, 3);
  assert.equal(result.sameIntentErneutSenden, false);
});

test("NICHT_GESENDET benoetigt keinen Reconcile und ist ABORTED", async () => {
  let beobachtungen = 0;
  const kernel = new RecoveryKernel(vertraege(), {
    async beobachte() {
      beobachtungen += 1;
      throw new Error("DARF_NICHT_BEOBACHTEN");
    },
  });

  const result = await kernel.gleicheAb(anfrage({
    art: "NICHT_GESENDET",
    grund: "ADMISSION_BLOCKIERT",
  }));

  assert.equal(result.art, "ABORTED");
  assert.equal(result.beobachtungen, 0);
  assert.equal(beobachtungen, 0);
});

test("In-Flight-Snapshot darf durch Knowledge-/Config-Drift nicht umgedeutet werden", async () => {
  const snap = snapshot();
  const drift = snapshot({
    wissensSnapshot: {
      gitCommit: "2".repeat(40),
      quellenSha256: [HASH],
    },
  });
  const kernel = new RecoveryKernel(vertraege(), {
    async beobachte() {
      return evidence("BESTAETIGT", drift, differenz({
        angewendet: ["bank", "character"],
      }));
    },
  });

  await assert.rejects(
    () => kernel.gleicheAb(anfrage({
      art: "SERVER_ERGEBNIS",
      korrelationId: "K-3",
      ergebnis: { ok: true },
    }, snap)),
    /RECOVERY_INFLIGHT_SNAPSHOT_UMGEDEUTET/,
  );
});

test("Snapshot-Pin ist immutable gegen nachtraegliche Quellarray-Aenderung", () => {
  const hashes = [HASH];
  const frozen = friereTransaktionsSnapshot(snapshot({
    wissensSnapshot: {
      gitCommit: COMMIT,
      quellenSha256: hashes,
    },
  }));

  hashes[0] = "b".repeat(64);
  assert.deepEqual(frozen.wissensSnapshot.quellenSha256, [HASH]);
});

test("Disconnect-Fault fuer alle 60 produktiven Action-Bindungen erzeugt keinen Duplicate-Send", async () => {
  const katalog = JSON.parse(fs.readFileSync(
    "grundlage/vertraege/r9/action-bindungen.json",
    "utf8",
  ));
  const produktiv = katalog.bindungen.filter(x => x.status === "R9_ADMISSION_GEBUNDEN");
  assert.equal(produktiv.length, 59);

  let sendAufrufe = 0;
  for (const bindung of produktiv) {
    const snap = snapshot({
      actionContractId: bindung.actionContractId,
      recoveryContractId: bindung.recoveryContractId,
      verifierId: bindung.verifierId,
    });
    const kernel = new RecoveryKernel({
      pruefe(actionContractId, recoveryContractId) {
        return {
          actionContractId,
          recoveryContractId,
          produktivErlaubt: true,
          sameIntentAfterPossibleSend: "NEVER",
          maximaleBeobachtungen: 1,
          fehlerDomaeneId: "fault:" + bindung.publicFunction,
        };
      },
    }, {
      async beobachte() {
        return evidence("NICHT_AUSGEFUEHRT", snap, differenz({
          erwartet: ["effect"],
          offen: ["effect"],
        }));
      },
    });

    const result = await kernel.gleicheAb({
      schemaVersion: 1,
      transaktionsId: "T:" + bindung.publicFunction,
      actionContractId: bindung.actionContractId,
      recoveryContractId: bindung.recoveryContractId,
      transportErgebnis: {
        art: "UNBEKANNT",
        grund: "DISCONNECT_NACH_MOEGLICHEM_SEND",
        korrelationId: null,
      },
      snapshot: snap,
    });

    assert.equal(result.sameIntentErneutSenden, false);
    assert.equal(result.neuerIntentErforderlich, true);
    assert.equal(result.art, "REPLAN_ALLOWED");
  }
  assert.equal(sendAufrufe, 0);
});
