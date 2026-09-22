import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const evidence = JSON.parse(fs.readFileSync("roadmap/pr20-5-merchant-stability-evidence.json", "utf8"));
const gate = JSON.parse(fs.readFileSync("roadmap/pr20-5-merchant-stability-exit-gate-status.json", "utf8"));
const roadmap = JSON.parse(fs.readFileSync("roadmap/post-r19-roadmap.json", "utf8"));

test("PR20.5 real ingame evidence closes the 4-character 15m gate", () => {
  assert.equal(evidence.status, "BESTANDEN_REAL_INGAME_4CHAR_15M");
  assert.equal(evidence.run.terminalStatus, "BESTANDEN");
  assert.ok(evidence.run.durationMs >= 15 * 60 * 1000);
  assert.ok(evidence.run.samples >= evidence.run.minimumSamples);
  assert.equal(evidence.roster.ready, true);
  assert.deepEqual(evidence.roster.observedClasses, ["merchant","ranger","priest","mage"]);
  assert.equal(evidence.deterministic.scenariosPassed, 9);
  assert.equal(evidence.deterministic.scenariosPassed, evidence.deterministic.scenariosTotal);
  assert.equal(evidence.safety.gameplayWrites, 0);
  assert.equal(evidence.safety.rawWriteCalls, 0);
  assert.equal(evidence.safety.sameIntentRetry, false);
  assert.equal(evidence.notification.completionEmail, "SENT");
});

test("PR20.5 closeout advances only to PR20.6 and never normal runtime", () => {
  assert.equal(gate.status, "ROADMAP_ABGESCHLOSSEN_REAL_INGAME");
  assert.equal(gate.nextGate, "PR20.6_MLUCK");
  assert.equal(gate.transitionPolicy.pr20_6MLuckAllowed, true);
  assert.equal(gate.transitionPolicy.normalRuntimeAutomaticallyAllowed, false);
  assert.equal(roadmap.currentGate, "PR20.6_MLUCK");
  assert.equal(roadmap.pr20_5.status, "ROADMAP_ABGESCHLOSSEN_REAL_INGAME");
  assert.equal(roadmap.pr20_5.normalRuntimeAfterAllTestsOnly, true);
});
