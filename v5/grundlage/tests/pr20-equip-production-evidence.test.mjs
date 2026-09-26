import test from "node:test";
import { roadmapIstMindestens } from "../../werkzeuge/roadmap-gate-rang.mjs";
import assert from "node:assert/strict";
import fs from "node:fs";

const lies = pfad => JSON.parse(fs.readFileSync(pfad, "utf8"));

const evidence = lies("roadmap/pr20-1-equip-production-evidence.json");
const roadmap = lies("roadmap/post-r19-roadmap.json");

test("PR20.1 Equip-Produktionsnachweis ist exakt einmal committed und verifiziert", () => {
  assert.equal(evidence.schemaVersion, 1);
  assert.equal(evidence.status, "BESTANDEN");
  assert.equal(evidence.testedSourceSha, "04dbc2cf5ab70992ec0dac9c7952cafb1ca4a0db");
  assert.equal(evidence.liveReport.status, "BESTANDEN");
  assert.equal(evidence.liveReport.result.status, "COMMITTED");
  assert.equal(evidence.liveReport.result.transportArt, "SERVER_ERGEBNIS");
  assert.equal(evidence.liveReport.result.journalTerminalArt, "COMMIT");
  assert.equal(evidence.liveReport.result.recovery.art, "COMMITTED");
  assert.equal(evidence.liveReport.result.recovery.klassifikation, "BESTAETIGT");
  assert.deepEqual(evidence.liveReport.result.recovery.restDomaenen, []);
  assert.equal(evidence.liveReport.adapterAufrufe, 1);
  assert.equal(evidence.liveReport.gameWrites, 1);
  assert.equal(evidence.liveReport.sameIntentRetry, false);
  assert.equal(evidence.liveReport.result.sameIntentErneutSenden, false);
});

test("PR20.1 vorheriger Bestätigungsfehler blieb vor Transaction/Authority/Write", () => {
  const b = evidence.vorherigerBlockierterVersuch;
  assert.equal(b.sameIntentRetry, false);
  assert.equal(b.vorTransaktionsIdErzeugungBlockiert, true);
  assert.equal(b.vorAdapterErzeugungBlockiert, true);
  assert.equal(b.vorTransaktionsOrchestrierungBlockiert, true);
  assert.equal(b.lokaleRecoveryPruefung.currentExists, false);
  assert.equal(b.lokaleRecoveryPruefung.authorityDirExists, false);
  assert.equal(b.lokaleRecoveryPruefung.liveReportExists, false);
});

test("PR20.1 Exit-Gate öffnet nur PR20.2 und keine breite Gameplay-Authority", () => {
  assert.equal(evidence.exitGate.preflightSauber, true);
  assert.equal(evidence.exitGate.exaktEinErwarteterWrite, true);
  assert.equal(evidence.exitGate.sameIntentRetryFalse, true);
  assert.equal(evidence.exitGate.fachlichePostconditionBestaetigt, true);
  assert.equal(evidence.exitGate.offeneTransaktionNachErgebnis, false);
  assert.equal(evidence.exitGate.offeneEquipAuthorityNachErgebnis, false);
  assert.equal(evidence.liveReport.hostNachher.gameplayAutoritaet, false);
  assert.equal(evidence.liveReport.hostNachher.rawWriteAutoritaet, false);
  assert.equal(evidence.liveReport.hostNachher.actionAuthority, false);
  assert.equal(evidence.liveReport.breiteRuntimeFreigabeDurchDiesenTest, false);
  assert.equal(evidence.liveReport.rawWriteBypass, false);
  assert.equal(roadmap.currentStage, "PR21");
  assert.equal(roadmapIstMindestens(roadmap.currentGate, "PR20.2_BANK_PRODUKTIVIERUNG"), true);
  assert.equal(roadmap.pr20_1.status, "BESTANDEN");
  assert.equal(roadmap.pr20_1.evidence, "v5/roadmap/pr20-1-equip-production-evidence.json");
});
