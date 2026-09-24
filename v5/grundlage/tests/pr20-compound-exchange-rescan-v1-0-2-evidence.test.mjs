import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const evidence=JSON.parse(fs.readFileSync(
  "roadmap/pr20-8-compound-exchange-rescan-v1-0-2-evidence.json",
  "utf8",
));

test("PR20.8 v1.0.2 live rescan is zero-write but invalid for the target-family gate", () => {
  assert.equal(evidence.status,"INVALID_TARGET_SUCCESS_ZERO_WRITE");
  assert.equal(evidence.ratified,false);
  assert.equal(evidence.testId,"pr20-8-wertmutation-live-candidate-readonly");
  assert.equal(evidence.controllerVersion,"1.0.2");
  assert.equal(evidence.observed.status,"BESTANDEN");
  assert.equal(evidence.observed.phase,"COMPLETE");
  assert.equal(evidence.observed.terminal,true);
  assert.equal(evidence.observed.bridgeState,"ALREADY_PRESENT");
  assert.equal(evidence.observed.bridgeError,null);
  assert.deepEqual(evidence.observed.upgradeCandidate,{name:"gloves",level:0});
  assert.equal(evidence.observed.compoundCandidate,null);
  assert.equal(evidence.observed.exchangeCandidate,null);
  assert.equal(evidence.observed.gameplayWrites,0);
  assert.equal(evidence.observed.publicFunctionCalls,0);
  assert.equal(evidence.observed.rawWriteCalls,0);

  assert.deepEqual(evidence.interpretation.targetFamilies,["COMPOUND","EXCHANGE"]);
  assert.equal(evidence.interpretation.upgradeInformationalOnly,true);
  assert.equal(evidence.interpretation.targetCandidateObserved,false);
  assert.equal(evidence.interpretation.reportedSuccessIsFalsePositiveForTargetGate,true);
  assert.equal(evidence.interpretation.mayAdvanceCompoundOrExchangeGate,false);
  assert.equal(evidence.interpretation.compoundRatified,false);
  assert.equal(evidence.interpretation.exchangeRatified,false);
});

test("PR20.8 v1.0.3 recovery is pinned to target-family-only success semantics", () => {
  const r=evidence.recovery;
  assert.equal(r.controllerVersion,"1.0.3");
  assert.equal(r.packagePath,"v5/werkzeuge/pr20-8-wertmutation-live-candidate-readonly-v1-0-3.js");
  assert.equal(r.sourceCommit,"a0625dd9611b1006dc6f09ef7222ce5b67361ca6");
  assert.equal(r.packageSha256,"f633b5ed877120aa9c76c2c788b64b8efb20eef155a0d38612fb5fca7c20da25");
  assert.equal(r.packageBytes,21343);
  assert.equal(r.successCriterion,"COMPOUND_OR_EXCHANGE_CANDIDATE_REQUIRED");
  assert.equal(r.upgradeCanSatisfySuccess,false);
  assert.equal(r.readOnly,true);
  assert.equal(r.gameplayWrites,0);
  assert.equal(r.publicFunctionCalls,0);
  assert.equal(r.rawWriteCalls,0);
  assert.equal(r.normalRuntimeAllowed,false);
  assert.equal(evidence.nextGate,"PR20_8_COMPOUND_EXCHANGE_TARGET_FAMILY_RESCAN_V1_0_3_REAL_BROWSER_RUN");
});
