import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const controller = fs.readFileSync("werkzeuge/cap045-production-live-test-gui.js", "utf8");
const paket = fs.readFileSync("werkzeuge/cap045-production-live-test-paket.js", "utf8");

test("CAP-045 Live-Paket bildet drei klar getrennte Stages und die geforderten Evidence-Klassen ab", () => {
  for (const marker of [
    "STAGE_1","STAGE_2","STAGE_3",
    "FULLY_RESOLVED","DEFERRED_EVENT_INAKTIV",
    "BLOCKIERT_QUEST_NICHT_ERFUELLT","STRUCTURAL_GAP",
    "evidenceKlasse: 'LIVE'","evidenceKlasse: 'SYNTHETISCH'",
    "synthetischeEvidenceZaehltAlsLive: false",
    "liveBeweisBestanden","breiteRuntimeFreigabe: false"
  ]) assert.ok(controller.includes(marker), marker);
});

test("CAP-045 Zertifizierer bleibt read-only und Controlled-Proof besitzt exakt einen Write-Pfad", () => {
  assert.ok(controller.includes("zertifiziererGameplayWrites: 0"));
  assert.ok(controller.includes("controlledProofDriverGameplayWrites: 1"));
  assert.equal((controller.match(/\.upgrade\s*\(/g) ?? []).length, 1);
  for (const verboten of [
    ".attack(", ".move(", ".smart_move(", ".use_skill(",
    ".buy(", ".sell(", ".send_item(", ".send_gold(",
    ".craft(", ".exchange(", ".compound("
  ]) assert.equal(controller.includes(verboten), false, verboten);
});

test("CAP-045 Controlled-Proof ist durable-intent-, admission-, contract- und no-retry-gebunden", () => {
  for (const marker of [
    "CAP045-PRODUCTION-LIVE-PROOF-UPGRADE-ONE-SHOT-AKZEPTIERT",
    "CAP045-STAGE2-LIVE-SOAK-START",
    "AL-ACTION-UPGRADE","AL-RECOVERY-UPGRADE","AL-VERIFIER-UPGRADE",
    "status: 'INTENT_DURABLE'","status: 'ADMITTED'","status: 'OUTCOME_PENDING'",
    "sameIntentErneutSenden: false","RECOVERY_PENDING","COMMITTED",
    "maximalerSendCount: 1","sendCount: 1"
  ]) assert.ok(controller.includes(marker), marker);
  const durable = controller.indexOf("schreibeJournal(intent)");
  const admission = controller.indexOf("status: 'ADMITTED'", durable);
  const sendPending = controller.indexOf("status: 'OUTCOME_PENDING'", admission);
  const send = controller.indexOf("await rufeUpgrade(rootFenster(), kandidat, false)", sendPending);
  assert.ok(durable >= 0 && admission > durable && sendPending > admission && send > sendPending);
});

test("CAP-045 Bericht enthaelt die verlangten Live-Abnahmefelder", () => {
  for (const marker of [
    "testkennung","guiVersion","gesamtstatus","startzeit","endzeit","stageStatus",
    "coverageAudit","soakDauerMs","sampleAnzahl","sampleGaps","fingerprintFehler",
    "duplicateIrreversibleEffects","unverifiedIrreversibleEffects",
    "invariantViolations","recipientSettlementErgebnis",
    "syntheticRegressionStatus","liveBeweisStatus","blocker"
  ]) assert.ok(controller.includes(marker), marker);
});

test("CAP-045 Paket ist source-locked und enthaelt keinen Fremdnetzwerk-Lader", () => {
  assert.ok(paket.indexOf("const API_NAME = 'V5TestGui'") >= 0);
  assert.ok(
    paket.indexOf("const API_NAME = 'V5Cap045ProductionLiveTest'")
      > paket.indexOf("const API_NAME = 'V5TestGui'")
  );
  assert.equal(paket.includes("fetch("), false);
  assert.equal(paket.includes("XMLHttpRequest"), false);
});
