import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const evidence = JSON.parse(fs.readFileSync(
  "roadmap/pr20-2-bank-no-write-5m-evidence.json",
  "utf8",
));
const closeout = JSON.parse(fs.readFileSync(
  "roadmap/pr20-2-bank-blocker-closeout.json",
  "utf8",
));
const gate = JSON.parse(fs.readFileSync(
  "roadmap/pr20-2-bank-exit-gate-status.json",
  "utf8",
));
const standard = JSON.parse(fs.readFileSync(
  "roadmap/testzeit-standard.json",
  "utf8",
));

test("Reale PR20.2 Bank NO-WRITE 5M Evidence ist vollstaendig bestanden", () => {
  assert.equal(evidence.status, "BESTANDEN");
  assert.equal(evidence.testedSourceSha, "bb3d1d9108457acae36d30a896549f91598621aa");
  assert.equal(evidence.controllerVersion, "1.0.1");
  assert.equal(evidence.preflight.status, "BESTANDEN");
  assert.equal(evidence.preflight.serverRegion, "EU");
  assert.equal(evidence.preflight.serverKennung, "I");
  assert.equal(evidence.preflight.serverBindungQuelle, "SERVER_OBJECT");
  assert.equal(evidence.preflight.performanceTrick.aktiv, true);
  assert.equal(evidence.preflight.performanceTrick.playing, true);
  assert.equal(evidence.preflight.performanceTrick.verification, "HOWLER_PLAYING_TRUE");
  assert.equal(evidence.result.dauerMs, 300017);
  assert.equal(evidence.result.sampleAnzahl, 21);
  assert.equal(evidence.result.sampleGaps, 0);
  assert.equal(evidence.result.driftSamples, 0);
  assert.equal(evidence.result.evidenceKetteGueltig, true);
  assert.equal(evidence.result.performanceTrickFehler, 0);
  assert.equal(evidence.result.alternativeRuntimeSamples, 0);
  assert.deepEqual(evidence.result.blocker, []);
  assert.equal(evidence.safety.gameplayWrites, 0);
  assert.equal(evidence.safety.mutatingPublicFunctionCalls, 0);
  assert.equal(evidence.safety.functionalTestBudgetConsumed, false);
  assert.equal(evidence.safety.withdrawTestbudgetVerbraucht, false);
  assert.equal(evidence.safety.sameIntentRetry, false);
});

test("5m Evidence bleibt historisch gate-neutral; spaetere Operator-Freigabe ist separat", () => {
  assert.equal(evidence.gateEffect.pr20_2ExitGateBleibt, "BLOCKIERT_FAIL_CLOSED");
  assert.equal(evidence.gateEffect.schliesstWithdrawNicht, true);
  assert.equal(evidence.gateEffect.schliesstOpenPackLiveNicht, true);
  assert.equal(evidence.gateEffect.pr20_3MarktStartErlaubt, false);
  assert.equal(
    gate.status,
    "VOLL_FREIGEGEBEN_MIT_DOKUMENTIERTEN_EVIDENCE_AUSNAHMEN",
  );
  assert.equal(gate.policy.breiteBankAktivierungErlaubt, true);
  assert.equal(gate.policy.pr20_3MarktStartErlaubt, true);
});

test("Operator-Closeout fordert keinen weiteren PR20.2-Soak oder dritten Withdraw-Test", () => {
  assert.equal(closeout.status, "CLOSED_AS_ACCEPTED_EVIDENCE_EXCEPTIONS");
  assert.equal(closeout.testStrategy.function5mCompleted, true);
  assert.equal(closeout.testStrategy.integration15mRequiredNow, false);
  assert.equal(closeout.testStrategy.operatorReleaseOverridesAdditionalPr20_2Soak, true);
  assert.equal(closeout.testStrategy.additionalReadOnlySoakValueNow, "KEIN_GATE_NUTZEN");
  assert.equal(closeout.policy.withdrawTest3Erlaubt, false);
  assert.equal(closeout.policy.openPackLiveErlaubt, false);
  assert.equal(closeout.policy.weitereIngameTestsJetztErforderlich, false);
  assert.equal(closeout.policy.breiteBankAktivierungErlaubt, true);
  assert.equal(closeout.policy.pr20_3MarktStartErlaubt, true);
  assert.equal(standard.funktion.testdauerMs, 300000);
  assert.equal(standard.integrationRelease.testdauerMs, 900000);
});

test("Reopen-Trigger fuer Open-Pack verlangt zuerst neue read-only Admission", () => {
  const open = closeout.historischeBlocker.find((x) => x.id === "OPEN_BANK_PACK_RESOURCE_BLOCKED_NO_LIVE");
  assert.ok(open);
  assert.equal(open.nextIngameTestAllowedNow, false);
  assert.match(open.reopenCondition, /zuerst neue read-only Admission/);
  assert.equal(open.characterGold, 15993820);
  assert.equal(open.goldKosten, 75000000);
  assert.equal(open.characterShells, 0);
  assert.equal(open.shellKosten, 600);
});
