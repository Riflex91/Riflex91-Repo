import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { roadmapIstMindestens } from "../../werkzeuge/roadmap-gate-rang.mjs";

const evidence = JSON.parse(fs.readFileSync("roadmap/pr20-6-mluck-evidence.json", "utf8"));
const gate = JSON.parse(fs.readFileSync("roadmap/pr20-6-mluck-exit-gate-status.json", "utf8"));
const roadmap = JSON.parse(fs.readFileSync("roadmap/post-r19-roadmap.json", "utf8"));

test("PR20.6 real ingame evidence closes the 4-character 5m one-write gate", () => {
  assert.equal(evidence.status, "BESTANDEN_REAL_INGAME_4CHAR_5M_ONE_WRITE");
  assert.equal(evidence.run.terminalStatus, "BESTANDEN");
  assert.equal(evidence.roster.ready, true);
  assert.deepEqual(evidence.roster.observedClasses, ["merchant","ranger","priest","mage"]);
  assert.equal(evidence.deterministic.scenariosPassed, 8);
  assert.equal(evidence.deterministic.scenariosPassed, evidence.deterministic.scenariosTotal);
  assert.equal(evidence.preflight.status, "BESTANDEN");
  assert.equal(evidence.live.publicFunction, "use_skill");
  assert.equal(evidence.live.skill, "mluck");
  assert.equal(evidence.live.targetName, "My_Ranger1");
  assert.equal(evidence.live.intentStatus, "COMMITTED");
  assert.equal(evidence.live.settlement, "BESTAETIGT");
  assert.equal(evidence.safety.gameplayWrites, 1);
  assert.equal(evidence.safety.rawWriteCalls, 0);
  assert.equal(evidence.safety.sameIntentRetry, false);
  assert.equal(evidence.safety.intents, 1);
  assert.equal(evidence.lifecycleSafety.startCalls, 0);
  assert.equal(evidence.lifecycleSafety.disconnectCalls, 0);
  assert.equal(evidence.soak.status, "BESTANDEN");
  assert.ok(evidence.soak.durationMs >= 5 * 60 * 1000);
  assert.ok(evidence.soak.samples >= evidence.soak.minimumSamples);
});

test("PR20.6 closeout remains satisfied after later PR20 gates and never opens normal runtime", () => {
  assert.equal(gate.status, "ROADMAP_ABGESCHLOSSEN_REAL_INGAME");
  assert.equal(gate.nextGate, "PR20.7_GEAR");
  assert.equal(gate.transitionPolicy.pr20_7GearAllowed, true);
  assert.equal(gate.transitionPolicy.normalRuntimeAutomaticallyAllowed, false);
  assert.equal(roadmapIstMindestens(roadmap.currentGate, "PR20.7_GEAR"), true);
  assert.equal(roadmapIstMindestens(roadmap.safePreparationBoundary.activeLiveGate, "PR20.7_GEAR"), true);
  assert.equal(roadmap.pr20_6.status, "ROADMAP_ABGESCHLOSSEN_REAL_INGAME");
  assert.equal(roadmap.pr20_6.normalRuntimeAfterAllTestsOnly, true);
  assert.equal(roadmap.pr20_7.gameplayAuthority, false);
  assert.equal(roadmap.pr20_7.normalRuntimeAllowed, false);
});
