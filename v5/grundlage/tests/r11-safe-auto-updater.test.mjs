import test from "node:test";
import assert from "node:assert/strict";

import {
  PersistenterSafeAutoUpdater,
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

const ALT_SHA = "a".repeat(40);
const NEU_SHA = "b".repeat(40);

function releaseEvidence(overrides = {}) {
  return {
    schemaVersion: 1,
    basisSha: ALT_SHA,
    candidateSha: NEU_SHA,
    bundleSha256: "1".repeat(64),
    dependencyLockSha256: "2".repeat(64),
    laufzeitKonfigurationSha256: "3".repeat(64),
    releaseEvidenceId: "release-evidence-1",
    provenienzEvidenceId: "provenienz-evidence-1",
    beobachtetAmMs: 100,
    gueltigBisMs: 1_000,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
    ...overrides,
  };
}

function quiesceEvidence(overrides = {}) {
  return {
    schemaVersion: 1,
    prozessLaeuft: false,
    aktiveGameplayAutoritaeten: 0,
    offeneMutationen: 0,
    offeneTransfers: 0,
    recoveryPending: 0,
    bootFingerprint: "boot-alt",
    evidenceId: "quiesce-1",
    beobachtetAmMs: 200,
    gueltigBisMs: 400,
    ...overrides,
  };
}

function candidateHandshake(overrides = {}) {
  return {
    schemaVersion: 1,
    gitSha: NEU_SHA,
    runtimeKennung: "V5",
    prozessLaeuft: true,
    bereit: true,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
    bootFingerprint: "boot-neu",
    handshakeEvidenceId: "handshake-neu-1",
    gestartetAmMs: 310,
    beobachtetAmMs: 320,
    gueltigBisMs: 450,
    ...overrides,
  };
}

function rollbackHandshake(overrides = {}) {
  return candidateHandshake({
    gitSha: ALT_SHA,
    bootFingerprint: "boot-rollback",
    handshakeEvidenceId: "handshake-rollback-1",
    gestartetAmMs: 360,
    beobachtetAmMs: 370,
    gueltigBisMs: 500,
    ...overrides,
  });
}

async function bisApply(updater) {
  await updater.plane(
    "update-1",
    ALT_SHA,
    "boot-alt",
    releaseEvidence(),
    150,
  );
  await updater.beginneQuiesce("update-1", 180);
  await updater.bestaetigeQuiesce(
    "update-1",
    quiesceEvidence(),
    200,
  );
  return updater.bereiteApplyVor("update-1", 300);
}

test("CAP-043 bindet Kandidat exact an Basis-SHA und frische Provenienz-Evidence", async () => {
  const updater = new PersistenterSafeAutoUpdater(new MemorySpeicher());

  await assert.rejects(
    () => updater.plane(
      "update-basis-drift",
      ALT_SHA,
      "boot-alt",
      releaseEvidence({ basisSha: "c".repeat(40) }),
      150,
    ),
    /SAFE_UPDATE_RELEASE_BASIS_DRIFT/,
  );

  await assert.rejects(
    () => updater.plane(
      "update-stale",
      ALT_SHA,
      "boot-alt",
      releaseEvidence({ gueltigBisMs: 120 }),
      150,
    ),
    /SAFE_UPDATE_RELEASE_EVIDENCE_NICHT_FRISCH/,
  );
});

test("CAP-043 persistiert Apply-Intent vor Adapter-Operation und traegt keine ExecutionAuthority", async () => {
  const updater = new PersistenterSafeAutoUpdater(new MemorySpeicher());
  const intent = await bisApply(updater);

  assert.equal(intent.adapterOperation, "RELEASE_AKTIVIEREN");
  assert.equal(intent.basisSha, ALT_SHA);
  assert.equal(intent.candidateSha, NEU_SHA);
  assert.equal(intent.durableIntentPersistiert, true);
  assert.equal(intent.sameCandidateErneutAnwenden, false);
  assert.equal(intent.executionAuthority, false);
  assert.equal(intent.gameplayAutoritaet, false);
  assert.equal(intent.rawWriteAutoritaet, false);

  const sicht = updater.finde("update-1");
  assert.equal(sicht.zustand, "APPLY_AUSSTEHEND");
  assert.equal(sicht.applyIntentAmMs, 300);
  assert.equal(sicht.automatischerRetry, false);
});

test("CAP-043 committed nur neuen V5-Boot mit exact Candidate-SHA", async () => {
  const updater = new PersistenterSafeAutoUpdater(new MemorySpeicher());
  await bisApply(updater);

  const committed = await updater.verifiziereCandidateHandshake(
    "update-1",
    candidateHandshake(),
    320,
  );
  assert.equal(committed.zustand, "COMMITTED");
  assert.equal(committed.letzteEvidenceId, "handshake-neu-1");
});

test("CAP-043 false handshake oder alte Boot-Identitaet gilt niemals als Erfolg", async () => {
  const updater = new PersistenterSafeAutoUpdater(new MemorySpeicher());
  await bisApply(updater);

  await assert.rejects(
    () => updater.verifiziereCandidateHandshake(
      "update-1",
      candidateHandshake({ gitSha: ALT_SHA }),
      320,
    ),
    /SAFE_UPDATE_HANDSHAKE_CANDIDATE_MISMATCH/,
  );
  assert.equal(updater.finde("update-1").zustand, "APPLY_AUSSTEHEND");

  await assert.rejects(
    () => updater.verifiziereCandidateHandshake(
      "update-1",
      candidateHandshake({ bootFingerprint: "boot-alt" }),
      320,
    ),
    /SAFE_UPDATE_HANDSHAKE_ALTE_BOOT_IDENTITAET/,
  );
  assert.equal(updater.finde("update-1").zustand, "APPLY_AUSSTEHEND");
});

test("CAP-043 unsicheres Quiesce blockiert Apply", async () => {
  const updater = new PersistenterSafeAutoUpdater(new MemorySpeicher());
  await updater.plane(
    "update-1",
    ALT_SHA,
    "boot-alt",
    releaseEvidence(),
    150,
  );
  await updater.beginneQuiesce("update-1", 180);

  await assert.rejects(
    () => updater.bestaetigeQuiesce(
      "update-1",
      quiesceEvidence({ offeneTransfers: 1 }),
      200,
    ),
    /SAFE_UPDATE_QUIESCE_NICHT_SICHER/,
  );
  assert.equal(updater.finde("update-1").zustand, "QUIESCE_AUSSTEHEND");
});

test("CAP-043 Restart nach Apply-Intent erlaubt kein Blind-Reapply", async () => {
  const speicher = new MemorySpeicher();
  const updater = new PersistenterSafeAutoUpdater(speicher);
  await bisApply(updater);

  const neu = new PersistenterSafeAutoUpdater(speicher);
  const geladen = await neu.lade(330);
  assert.equal(geladen.geladen, true);
  assert.equal(geladen.recoveryPending, 1);

  const recovery = neu.finde("update-1");
  assert.equal(recovery.zustand, "RECOVERY_PENDING");
  assert.equal(recovery.recoveryVorZustand, "APPLY_AUSSTEHEND");
  assert.equal(recovery.sameCandidateErneutAnwenden, false);
  assert.equal(recovery.automatischerRetry, false);

  await assert.rejects(
    () => neu.bereiteApplyVor("update-1", 340),
    /SAFE_UPDATE_APPLY_ZUSTAND_UNGUELTIG/,
  );

  const committed = await neu.verifiziereCandidateHandshake(
    "update-1",
    candidateHandshake({ beobachtetAmMs: 350, gueltigBisMs: 500 }),
    350,
  );
  assert.equal(committed.zustand, "COMMITTED");
});

test("CAP-043 unbekanntes Apply-Ergebnis kann nur Rollback statt Reapply waehlen", async () => {
  const speicher = new MemorySpeicher();
  const updater = new PersistenterSafeAutoUpdater(speicher);
  await bisApply(updater);

  const neu = new PersistenterSafeAutoUpdater(speicher);
  await neu.lade(330);

  const rollback = await neu.beginneRollback("update-1", 350);
  assert.equal(rollback.adapterOperation, "RELEASE_ROLLBACK");
  assert.equal(rollback.zielSha, ALT_SHA);
  assert.equal(rollback.durableIntentPersistiert, true);
  assert.equal(rollback.executionAuthority, false);

  const rolledBack = await neu.verifiziereRollbackHandshake(
    "update-1",
    rollbackHandshake(),
    370,
  );
  assert.equal(rolledBack.zustand, "ROLLED_BACK_SAFE");
});

test("CAP-043 Restart vor Apply verlangt erneut sicheren Quiesce-Nachweis", async () => {
  const speicher = new MemorySpeicher();
  const updater = new PersistenterSafeAutoUpdater(speicher);
  await updater.plane(
    "update-1",
    ALT_SHA,
    "boot-alt",
    releaseEvidence(),
    150,
  );
  await updater.beginneQuiesce("update-1", 180);
  await updater.bestaetigeQuiesce(
    "update-1",
    quiesceEvidence(),
    200,
  );

  const neu = new PersistenterSafeAutoUpdater(speicher);
  await neu.lade(220);
  assert.equal(neu.finde("update-1").recoveryVorZustand, "QUIESCED");

  await assert.rejects(
    () => neu.bereiteApplyVor("update-1", 230),
    /SAFE_UPDATE_APPLY_ZUSTAND_UNGUELTIG/,
  );

  await neu.beginneQuiesce("update-1", 230);
  await neu.bestaetigeQuiesce(
    "update-1",
    quiesceEvidence({
      evidenceId: "quiesce-after-restart",
      beobachtetAmMs: 240,
      gueltigBisMs: 400,
    }),
    240,
  );
  const intent = await neu.bereiteApplyVor("update-1", 250);
  assert.equal(intent.durableIntentPersistiert, true);
});

test("CAP-043 blockiert parallele Update-Stuerme", async () => {
  const updater = new PersistenterSafeAutoUpdater(new MemorySpeicher());
  await updater.plane(
    "update-1",
    ALT_SHA,
    "boot-alt",
    releaseEvidence(),
    150,
  );

  await assert.rejects(
    () => updater.plane(
      "update-2",
      ALT_SHA,
      "boot-alt",
      releaseEvidence({
        candidateSha: "c".repeat(40),
        releaseEvidenceId: "release-evidence-2",
      }),
      160,
    ),
    /SAFE_UPDATE_BEREITS_AKTIV/,
  );
});
