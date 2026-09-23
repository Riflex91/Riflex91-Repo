import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const evidence = JSON.parse(fs.readFileSync("roadmap/pr20-6-mluck-evidence.json", "utf8"));
const gate = JSON.parse(fs.readFileSync("roadmap/pr20-6-mluck-exit-gate-status.json", "utf8"));
const roadmap = JSON.parse(fs.readFileSync("roadmap/post-r19-roadmap.json", "utf8"));

test("PR20.6 real ingame evidence closes the four-character MLuck 5m gate", () => {
  assert.equal(evidence.status, "BESTANDEN_REAL_INGAME_4CHAR_5M");
  assert.equal(evidence.run.terminalStatus, "BESTANDEN");
  assert.equal(evidence.run.phase, "COMPLETE");
  assert.equal(evidence.roster.ready, true);
  assert.deepEqual(evidence.roster.observedClasses, ["merchant","ranger","priest","mage"]);
  assert.equal(evidence.roster.sameAccount, true);
  assert.equal(evidence.roster.sameServer, true);
  assert.equal(evidence.deterministic.scenariosPassed, 8);
  assert.equal(evidence.deterministic.scenariosPassed, evidence.deterministic.scenariosTotal);
  assert.equal(evidence.preflight.status, "BESTANDEN");
  assert.equal(evidence.liveWrite.status, "COMMITTED");
  assert.equal(evidence.liveWrite.settlement, "BESTAETIGT");
  assert.equal(evidence.liveWrite.publicFunction, "use_skill");
  assert.equal(evidence.liveWrite.skill, "mluck");
  assert.equal(evidence.liveWrite.publicFunctionCalls, 1);
  assert.equal(evidence.safety.gameplayWrites, 1);
  assert.equal(evidence.safety.rawWriteCalls, 0);
  assert.equal(evidence.safety.sameIntentRetry, false);
  assert.equal(evidence.safety.secondIntentCreated, false);
  assert.equal(evidence.soak.status, "BESTANDEN");
  assert.ok(evidence.soak.durationMs >= 5 * 60 * 1000);
  assert.ok(evidence.soak.samples >= evidence.soak.minimumSamples);
  assert.equal(evidence.lifecycle.startCallsDuringAcceptedRun, 0);
  assert.equal(evidence.lifecycle.disconnectCallsDuringAcceptedRun, 0);
  assert.equal(evidence.lifecycle.persistedRangerUncertainBoundaryRetried, false);
});

test("PR20.6 closeout advances only to PR20.7 without granting new gear or normal-runtime authority", () => {
  assert.equal(gate.status, "ROADMAP_ABGESCHLOSSEN_REAL_INGAME");
  assert.equal(gate.nextGate, "PR20.7_GEAR");
  assert.equal(gate.transitionPolicy.pr20_7GearPreparationAllowed, true);
  assert.equal(gate.transitionPolicy.newGearMutationAuthorityAutomaticallyAllowed, false);
  assert.equal(gate.transitionPolicy.normalRuntimeAutomaticallyAllowed, false);
  assert.equal(roadmap.currentGate, "PR20.7_GEAR");
  assert.equal(roadmap.pr20_6.status, "ROADMAP_ABGESCHLOSSEN_REAL_INGAME");
  assert.equal(roadmap.pr20_6.normalRuntimeAfterAllTestsOnly, true);
});
