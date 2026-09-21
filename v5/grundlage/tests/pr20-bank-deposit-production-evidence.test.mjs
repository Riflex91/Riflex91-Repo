import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const evidence = JSON.parse(
  fs.readFileSync(
    "roadmap/pr20-2-bank-deposit-production-evidence.json",
    "utf8",
  ),
);

const gate = JSON.parse(
  fs.readFileSync(
    "grundlage/vertraege/runtime/bank-deposit-production-live-gate.json",
    "utf8",
  ),
);

test("PR20.2 bank_deposit(1)-Live-Evidence ist exakt einmal committed", () => {
  assert.equal(evidence.schemaVersion, 1);
  assert.equal(evidence.status, "BESTANDEN");
  assert.equal(
    evidence.evidenceArt,
    "V5_PRODUCTION_BANK_DEPOSIT_ONE_GOLD_ONE_SHOT_LIVE",
  );
  assert.equal(
    evidence.testedSourceSha,
    "a540d4107343a87b9d8ef5f3f301b3bbad819c4c",
  );
  assert.equal(evidence.betragGold, 1);
  assert.equal(evidence.result.status, "COMMITTED");
  assert.equal(evidence.result.transportArt, "SERVER_ERGEBNIS");
  assert.equal(evidence.result.recovery.art, "COMMITTED");
  assert.equal(evidence.result.recovery.klassifikation, "BESTAETIGT");
  assert.equal(evidence.result.recovery.beobachtungen, 1);
  assert.deepEqual(evidence.result.recovery.restDomaenen, []);
  assert.equal(evidence.result.recovery.neuerIntentErforderlich, false);
  assert.equal(evidence.result.recovery.sameIntentErneutSenden, false);
  assert.equal(evidence.result.journalTerminalArt, "COMMIT");
  assert.equal(evidence.result.sameIntentErneutSenden, false);
  assert.equal(evidence.result.adapterAufrufeErwartetMaximal, 1);
  assert.equal(evidence.result.betrag, 1);
  assert.equal(evidence.adapterAufrufe, 1);
  assert.equal(evidence.gameWrites, 1);
  assert.equal(evidence.sameIntentRetry, false);
});

test("PR20.2 bank_deposit(1)-Live-Evidence endet released und ohne Restauthority", () => {
  assert.equal(evidence.startAusserhalbBank, true);
  assert.equal(evidence.manualMountTransition, true);
  assert.equal(evidence.manualExitRequired, true);
  assert.equal(evidence.bankStartNachherBereit, true);
  assert.deepEqual(
    evidence.leaseStatus,
    [{ epoche: 3, zustand: "RELEASED" }],
  );
  assert.equal(evidence.hostNachher.zustand, "LAEUFT");
  assert.equal(evidence.hostNachher.bankDepositEinmalAuthorityOffen, false);
  assert.equal(evidence.hostNachher.gameplayAutoritaet, false);
  assert.equal(evidence.hostNachher.rawWriteAutoritaet, false);
  assert.equal(evidence.hostNachher.actionAuthority, false);
  assert.equal(evidence.breiteRuntimeFreigabeDurchDiesenTest, false);
  assert.equal(evidence.rawWriteBypass, false);
});

test("PR20.2 Live-Evidence beweist nur One-Shot-Deposit und oeffnet Restbank nicht automatisch", () => {
  for (const [key, value] of Object.entries(evidence.exitGate)) {
    assert.equal(value, true, key);
  }
  assert.deepEqual(
    evidence.scope.proven,
    ["BANK_DEPOSIT_GOLD_ONE_SHOT"],
  );
  for (const offen of [
    "BANK_WITHDRAW_GOLD",
    "BANK_STORE_ITEM",
    "BANK_RETRIEVE_ITEM",
    "BANK_SWAP",
    "OPEN_BANK_PACK",
    "AUTONOMOUS_MULTI_OPERATION_BANK_LOOP",
    "FIVE_MINUTE_BANK_FUNCTION_EVIDENCE",
  ]) {
    assert.ok(evidence.scope.notYetProven.includes(offen), offen);
  }
  assert.equal(
    evidence.nextGate,
    "PR20.2_BANK_AUTONOMY_REST_CAPABILITIES_AND_5M_FUNCTION_EVIDENCE",
  );
});

test("Live-Gate-Vertrag zeigt den bestandenen One-Gold-Nachweis und behaelt enge Grenzen", () => {
  assert.equal(gate.status, "LIVE_EVIDENCE_BESTANDEN");
  assert.equal(gate.amountGold, 1);
  assert.equal(gate.sendBoundary.maximumAdapterCalls, 1);
  assert.equal(gate.sendBoundary.maximumGameplayWrites, 1);
  assert.equal(gate.sendBoundary.rawSocketEmitAllowed, false);
  assert.equal(gate.sendBoundary.otherBankWritesAllowed, false);
  assert.equal(gate.recovery.sameIntentRetry, false);
  assert.equal(gate.recovery.possibleSendNeverBlindRetry, true);
  assert.equal(gate.liveRunner.automaticExecution, false);
  assert.equal(gate.liveRunner.liveEvidenceStatus, "BESTANDEN");
  assert.equal(
    gate.liveRunner.liveEvidencePath,
    "roadmap/pr20-2-bank-deposit-production-evidence.json",
  );
  assert.equal(gate.currentEvidence.gameplayWritesPerformedByThisGate, 1);
  assert.equal(gate.currentEvidence.adapterCalls, 1);
  assert.equal(gate.currentEvidence.realLiveWritePerformed, true);
  assert.equal(gate.currentEvidence.status, "COMMITTED");
  assert.equal(gate.currentEvidence.recovery, "COMMITTED");
  assert.equal(gate.currentEvidence.recoveryKlassifikation, "BESTAETIGT");
  assert.equal(gate.currentEvidence.journalTerminalArt, "COMMIT");
  assert.equal(gate.currentEvidence.sameIntentRetry, false);
  assert.equal(gate.currentEvidence.leaseEpoche, 3);
  assert.equal(gate.currentEvidence.leaseTerminalStatus, "RELEASED");
});
