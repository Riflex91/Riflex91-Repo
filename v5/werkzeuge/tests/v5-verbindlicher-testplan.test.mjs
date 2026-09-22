import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const plan = JSON.parse(fs.readFileSync("v5/roadmap/v5-verbindlicher-testplan.json", "utf8"));
const roadmap = JSON.parse(fs.readFileSync("v5/roadmap/post-r19-roadmap.json", "utf8"));

test("V5 mandatory test plan has the exact binding gate order", () => {
  assert.equal(plan.status, "AKTIV_VERBINDLICH");
  assert.equal(plan.sourceOfTruth, true);
  assert.deepEqual(
    plan.gates.map((gate) => gate.id),
    ["PR20.5", "PR20.6", "PR20.7", "PR20.8", "PR20.9", "PR20.10", "PR20.11", "PR21"],
  );
});

test("V5 test execution auto-continues only after pass and stops on failure", () => {
  assert.equal(plan.executionPolicy.verbindlicheReihenfolge, true);
  assert.equal(plan.executionPolicy.automatischFortsetzenNachBestanden, true);
  assert.equal(plan.executionPolicy.beiFehlerSofortStoppen, true);
  assert.equal(plan.executionPolicy.beiFehlerUrsacheBehebenUndBetroffenesGateWiederholen, true);
  assert.equal(plan.executionPolicy.keineGateUeberspringung, true);
  assert.equal(plan.executionPolicy.normalbetriebVorGesamtabnahmeVerboten, true);
});

test("Supabase stays monitoring-only dependency and outage simulation is excluded", () => {
  assert.equal(plan.executionPolicy.supabaseAlsMonitoringUndEvidenceErforderlich, true);
  assert.equal(plan.executionPolicy.supabaseAusfalltestExplizitAusgeschlossen, true);
  assert.equal(plan.executionPolicy.supabaseAusfallNichtSimulieren, true);
  const reliability = plan.gates.find((gate) => gate.id === "PR20.11");
  assert.equal(reliability.supabaseOutageTest, "AUSGESCHLOSSEN");
});

test("PR20.10 requires class skill and Farmer-Merchant logistics coverage", () => {
  const gate = plan.gates.find((entry) => entry.id === "PR20.10");
  assert.ok(gate);
  const joined = gate.requiredChecks.join("\n");
  for (const needle of [
    "Ranger",
    "Priest",
    "Mage",
    "Items",
    "Gold",
    "HP-Potion",
    "MP-Potion",
    "End-to-End",
  ]) {
    assert.match(joined, new RegExp(needle, "i"));
  }
});

test("PR20.11 includes 24/7 recovery classes except Supabase outage", () => {
  const gate = plan.gates.find((entry) => entry.id === "PR20.11");
  const joined = gate.requiredChecks.join("\n");
  for (const needle of [
    "Crash-Recovery",
    "Netzwerk",
    "Race",
    "Idempotenz",
    "Restart",
    "RAM",
    "Scheduler-Liveness",
    "Movement-Recovery",
    "Auto-Update",
    "Clock",
    "Alerting",
  ]) {
    assert.match(joined, new RegExp(needle, "i"));
  }
});

test("final acceptance is 24 hours with all four actors and no manual intervention", () => {
  assert.equal(plan.finalAcceptance.durationHours, 24);
  assert.deepEqual(plan.finalAcceptance.actors, ["merchant", "ranger", "priest", "mage"]);
  assert.equal(plan.finalAcceptance.manualInterventionAllowed, false);
});

test("post-R19 roadmap points to the mandatory test master plan", () => {
  assert.equal(roadmap.mandatoryTestMasterPlan, "v5/roadmap/v5-verbindlicher-testplan.json");
  assert.equal(roadmap.testExecutionDirective?.status, "VERBINDLICH");
  assert.equal(roadmap.testExecutionDirective?.autoContinueAfterPass, true);
  assert.equal(roadmap.testExecutionDirective?.supabaseOutageTestExcluded, true);
});
