import test from "node:test";
import assert from "node:assert/strict";

import {
  PersistenterRemoteConfigRegister,
  PersistentesCloudRequestBudget,
} from "../../erzeugt/index.js";

class MemorySpeicher {
  constructor() {
    this.map = new Map();
  }

  async schreibe(anfrage) {
    this.map.set(anfrage.relativerPfad, anfrage.inhalt);
  }

  async lies(pfad) {
    return this.map.get(pfad);
  }
}

function remotePolicy(overrides = {}) {
  return {
    schemaVersion: 1,
    policyId: "cloud-config-policy-v1",
    policyFingerprint: "policy-fp-1",
    vertrauensQuelleId: "control-plane-prod",
    vertrauensQuelleFingerprint: "control-plane-key-fp",
    maximaleEvidenceAlterMs: 60_000,
    regeln: [
      {
        schluessel: "telemetrie.intervallMs",
        art: "NUMBER",
        minimum: 5_000,
        maximum: 60_000,
        ganzzahlig: true,
        authorityNeutral: true,
        safetyNeutral: true,
        secretFrei: true,
      },
      {
        schluessel: "dashboard.kompakt",
        art: "BOOLEAN",
        authorityNeutral: true,
        safetyNeutral: true,
        secretFrei: true,
      },
      {
        schluessel: "wissen.syncProfil",
        art: "ENUM",
        erlaubteWerte: ["SPARSAM", "NORMAL"],
        authorityNeutral: true,
        safetyNeutral: true,
        secretFrei: true,
      },
    ],
    ...overrides,
  };
}

function remoteEvidence(overrides = {}) {
  return {
    schemaVersion: 1,
    evidenceId: "remote-config-evidence-1",
    quelleId: "control-plane-prod",
    quelleFingerprint: "control-plane-key-fp",
    policyFingerprint: "policy-fp-1",
    revision: 1,
    beobachtetAmMs: 100,
    gueltigBisMs: 10_000,
    configFingerprint: "config-fp-1",
    transportVerifiziert: true,
    quelleAuthentifiziert: true,
    secretFrei: true,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
    werte: [
      { schluessel: "telemetrie.intervallMs", wert: 15_000 },
      { schluessel: "dashboard.kompakt", wert: true },
      { schluessel: "wissen.syncProfil", wert: "SPARSAM" },
    ],
    ...overrides,
  };
}

function budgetPolicy(overrides = {}) {
  return {
    schemaVersion: 1,
    policyId: "cloud-budget-v1",
    policyFingerprint: "budget-fp-1",
    fensterDauerMs: 60_000,
    anbieterLimit: 20,
    sicherheitsReserve: 5,
    systemLimit: 12,
    maximaleReservierungen: 20,
    zweckLimits: [
      { zweck: "REMOTE_CONFIG", limit: 3 },
      { zweck: "RUNTIME_TELEMETRIE", limit: 4 },
      { zweck: "KNOWLEDGE_SYNC", limit: 3 },
      { zweck: "UPDATE_CHECK", limit: 2 },
      { zweck: "SONSTIGES_READONLY", limit: 2 },
    ],
    ...overrides,
  };
}

test("CAP-044 RemoteConfig akzeptiert nur lokale authority-neutrale Allowlist", async () => {
  const speicher = new MemorySpeicher();
  const register = new PersistenterRemoteConfigRegister(
    remotePolicy(),
    speicher,
  );

  const snapshot = await register.uebernehme(remoteEvidence(), 200);
  assert.equal(snapshot.revision, 1);
  assert.equal(snapshot.planningEvidence, true);
  assert.equal(snapshot.executionAuthority, false);
  assert.equal(snapshot.gameplayAutoritaet, false);
  assert.equal(snapshot.rawWriteAutoritaet, false);
  assert.deepEqual(
    snapshot.werte.map(x => x.schluessel),
    [
      "telemetrie.intervallMs",
      "dashboard.kompakt",
      "wissen.syncProfil",
    ],
  );
});

test("CAP-044 RemoteConfig blockiert Authority-/Safety-/Secret-Bypass bereits in Policy", () => {
  const speicher = new MemorySpeicher();
  for (const schluessel of [
    "authority.bank",
    "operator.deny",
    "admission.skip",
    "secret.token",
    "hostCommand.shell",
    "update.channel",
  ]) {
    assert.throws(
      () => new PersistenterRemoteConfigRegister(
        remotePolicy({
          regeln: [
            {
              schluessel,
              art: "BOOLEAN",
              authorityNeutral: true,
              safetyNeutral: true,
              secretFrei: true,
            },
          ],
        }),
        speicher,
      ),
      /REMOTE_CONFIG_POLICY_SCHLUESSEL_SICHERHEITSKRITISCH/,
    );
  }
});

test("CAP-044 RemoteConfig blockiert unbekannte Keys, falsche Quelle, Range-Drift und Replay", async () => {
  const register = new PersistenterRemoteConfigRegister(
    remotePolicy(),
    new MemorySpeicher(),
  );

  await assert.rejects(
    () => register.uebernehme(remoteEvidence({
      quelleFingerprint: "falsche-quelle",
    }), 200),
    /REMOTE_CONFIG_QUELLE_NICHT_VERTRAUT/,
  );

  await assert.rejects(
    () => register.uebernehme(remoteEvidence({
      werte: [{ schluessel: "nicht.erlaubt", wert: true }],
    }), 200),
    /REMOTE_CONFIG_SCHLUESSEL_NICHT_ERLAUBT/,
  );

  await assert.rejects(
    () => register.uebernehme(remoteEvidence({
      werte: [{ schluessel: "telemetrie.intervallMs", wert: 1 }],
    }), 200),
    /REMOTE_CONFIG_WERT_NUMBER_UNGUELTIG/,
  );

  await register.uebernehme(remoteEvidence(), 200);
  await assert.rejects(
    () => register.uebernehme(remoteEvidence({
      evidenceId: "replay-evidence",
      configFingerprint: "config-fp-replay",
      revision: 1,
    }), 210),
    /REMOTE_CONFIG_REVISION_REPLAY_ODER_STALE/,
  );
});

test("CAP-044 RemoteConfig Restart behaelt Revision, stale Snapshot bleibt ohne Authority", async () => {
  const speicher = new MemorySpeicher();
  const register = new PersistenterRemoteConfigRegister(
    remotePolicy({ maximaleEvidenceAlterMs: 500 }),
    speicher,
  );
  await register.uebernehme(remoteEvidence({
    gueltigBisMs: 5_000,
  }), 200);

  const neu = new PersistenterRemoteConfigRegister(
    remotePolicy({ maximaleEvidenceAlterMs: 500 }),
    speicher,
  );
  const status = await neu.lade(1_000);
  assert.equal(status.geladen, true);
  assert.equal(status.verwendbar, false);
  assert.equal(status.revision, 1);
  assert.equal(status.executionAuthority, false);
  assert.throws(
    () => neu.pinne(1_000),
    /REMOTE_CONFIG_SNAPSHOT_NICHT_FRISCH/,
  );

  await assert.rejects(
    () => neu.uebernehme(remoteEvidence({
      evidenceId: "old-revision",
      configFingerprint: "old-fp",
      revision: 1,
      beobachtetAmMs: 1_000,
      gueltigBisMs: 2_000,
    }), 1_000),
    /REMOTE_CONFIG_REVISION_REPLAY_ODER_STALE/,
  );
});

test("CAP-044 RequestBudget reserviert durable vor Request und konservativ ohne Refund", async () => {
  const speicher = new MemorySpeicher();
  const budget = new PersistentesCloudRequestBudget(
    budgetPolicy(),
    speicher,
  );
  await budget.lade(1_000);

  const permit = await budget.reserviere(
    "req-1",
    "REMOTE_CONFIG",
    1,
    1_010,
  );
  assert.equal(permit.durableReserviert, true);
  assert.equal(permit.refundBeiUnbekanntemAusgang, false);
  assert.equal(permit.automatischerRetry, false);
  assert.equal(permit.executionAuthority, false);
  assert.equal(permit.gameplayAutoritaet, false);
  assert.equal(permit.rawWriteAutoritaet, false);
  assert.equal(permit.verbleibendGesamt, 11);
  assert.equal(permit.verbleibendZweck, 2);

  const persistiert = JSON.parse(
    speicher.map.get("control/cloud-request-budget-v1.json"),
  );
  assert.equal(persistiert.verbrauchtGesamt, 1);
  assert.equal(persistiert.reservierungen[0].requestId, "req-1");
});

test("CAP-044 RequestBudget blockiert Quota-Storm pro Zweck und gesamt", async () => {
  const budget = new PersistentesCloudRequestBudget(
    budgetPolicy(),
    new MemorySpeicher(),
  );
  await budget.lade(1_000);

  await budget.reserviere("rc-1", "REMOTE_CONFIG", 1, 1_001);
  await budget.reserviere("rc-2", "REMOTE_CONFIG", 1, 1_002);
  await budget.reserviere("rc-3", "REMOTE_CONFIG", 1, 1_003);
  await assert.rejects(
    () => budget.reserviere("rc-4", "REMOTE_CONFIG", 1, 1_004),
    /REQUEST_BUDGET_ZWECK_LIMIT_ERSCHOEPFT:REMOTE_CONFIG/,
  );

  await budget.reserviere("rt-1", "RUNTIME_TELEMETRIE", 4, 1_005);
  await budget.reserviere("kn-1", "KNOWLEDGE_SYNC", 3, 1_006);
  await budget.reserviere("up-1", "UPDATE_CHECK", 2, 1_007);
  assert.equal(budget.sicht(1_008).verbrauchtGesamt, 12);
  await assert.rejects(
    () => budget.reserviere(
      "other-1",
      "SONSTIGES_READONLY",
      1,
      1_008,
    ),
    /REQUEST_BUDGET_SYSTEM_LIMIT_ERSCHOEPFT/,
  );
});

test("CAP-044 RequestBudget Restart zaehlt unbekannten Ausgang weiter als verbraucht", async () => {
  const speicher = new MemorySpeicher();
  const budget = new PersistentesCloudRequestBudget(
    budgetPolicy(),
    speicher,
  );
  await budget.lade(1_000);
  await budget.reserviere("unknown-1", "UPDATE_CHECK", 2, 1_010);

  const neu = new PersistentesCloudRequestBudget(
    budgetPolicy(),
    speicher,
  );
  const sicht = await neu.lade(1_020);
  assert.equal(sicht.verbrauchtGesamt, 2);
  assert.equal(
    sicht.zweckVerbrauch.find(x => x.zweck === "UPDATE_CHECK").verbraucht,
    2,
  );

  await assert.rejects(
    () => neu.reserviere("unknown-1", "UPDATE_CHECK", 1, 1_021),
    /REQUEST_BUDGET_REQUEST_ID_DOPPELT/,
  );
  await assert.rejects(
    () => neu.reserviere("unknown-2", "UPDATE_CHECK", 1, 1_022),
    /REQUEST_BUDGET_ZWECK_LIMIT_ERSCHOEPFT:UPDATE_CHECK/,
  );
});

test("CAP-044 RequestBudget rollt nur an harter Fenstergrenze und blockiert Zeitregression", async () => {
  const speicher = new MemorySpeicher();
  const budget = new PersistentesCloudRequestBudget(
    budgetPolicy(),
    speicher,
  );
  await budget.lade(1_000);
  await budget.reserviere("req-1", "REMOTE_CONFIG", 1, 1_010);

  const permit = await budget.reserviere(
    "req-new-window",
    "REMOTE_CONFIG",
    1,
    60_001,
  );
  assert.equal(permit.fensterStartMs, 60_000);
  assert.equal(permit.verbleibendGesamt, 11);

  await assert.rejects(
    () => budget.reserviere(
      "time-regression",
      "REMOTE_CONFIG",
      1,
      59_999,
    ),
    /REQUEST_BUDGET_ZEITREGRESSION/,
  );
});

test("CAP-044 korrupte Budget-Persistenz wird fail-closed abgelehnt", async () => {
  const speicher = new MemorySpeicher();
  speicher.map.set(
    "control/cloud-request-budget-v1.json",
    JSON.stringify({
      schemaVersion: 1,
      policyId: "cloud-budget-v1",
      policyFingerprint: "budget-fp-1",
      gespeichertAmMs: 1_000,
      fensterStartMs: 0,
      verbrauchtGesamt: 0,
      zweckVerbrauch: [
        { zweck: "REMOTE_CONFIG", verbraucht: 0 },
        { zweck: "RUNTIME_TELEMETRIE", verbraucht: 0 },
        { zweck: "KNOWLEDGE_SYNC", verbraucht: 0 },
        { zweck: "UPDATE_CHECK", verbraucht: 0 },
        { zweck: "SONSTIGES_READONLY", verbraucht: 0 },
      ],
      reservierungen: [
        {
          requestId: "ghost",
          zweck: "REMOTE_CONFIG",
          kosten: 1,
          reserviertAmMs: 500,
        },
      ],
    }),
  );
  const budget = new PersistentesCloudRequestBudget(
    budgetPolicy(),
    speicher,
  );
  await assert.rejects(
    () => budget.lade(1_100),
    /REQUEST_BUDGET_PERSISTENZ_GESAMT_DRIFT/,
  );
});
