import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const evidence = JSON.parse(fs.readFileSync(
  "roadmap/pr20-2-bank-open-pack-admission-evidence.json",
  "utf8",
));
const candidate = JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/bank-open-pack-production-candidate.json",
  "utf8",
));
const roadmap = JSON.parse(fs.readFileSync(
  "roadmap/post-r19-roadmap.json",
  "utf8",
));

test("Open-Pack Admission Evidence bildet den echten read-only Ressourcenblock exakt ab", () => {
  assert.equal(evidence.schemaVersion, 1);
  assert.equal(evidence.status, "BESTANDEN");
  assert.equal(evidence.sicherheitspruefung, "BESTANDEN");
  assert.equal(evidence.fachstatus, "RESOURCE_BLOCKED_NO_LIVE");
  assert.equal(evidence.testedSourceSha, "a92b94e0c6edf6aa1df1c0713a8233631d1fdd64");

  const r = evidence.admissionResult;
  assert.equal(r.status, "BLOCKIERT");
  assert.equal(r.art, "OPEN_BANK_PACK");
  assert.equal(r.testArt, "ADMISSION_READ_ONLY");
  assert.equal(r.kandidat.pack, "items2");
  assert.equal(r.kandidat.map, "bank");
  assert.equal(r.kandidat.goldKosten, 75000000);
  assert.equal(r.kandidat.shellKosten, 600);
  assert.equal(r.performanceTrick.aktiv, true);
  assert.equal(r.performanceTrick.playing, true);
  assert.equal(r.performanceTrick.howlState, "loaded");
  assert.equal(r.performanceTrick.verifikation, "HOWLER_PLAYING_TRUE");

  assert.equal(r.pfade.gold.status, "BLOCKIERT");
  assert.deepEqual(r.pfade.gold.blocker, ["BANK_OPEN_PACK_GOLD_ZU_NIEDRIG"]);
  assert.equal(r.pfade.gold.kosten, 75000000);
  assert.equal(r.pfade.gold.verfuegbar, 15993820);
  assert.equal(r.pfade.gold.korrelation, "FIFO_DEFERRED_BANK");

  assert.equal(r.pfade.shells.status, "BLOCKIERT");
  assert.deepEqual(r.pfade.shells.blocker, ["BANK_OPEN_PACK_SHELLS_ZU_NIEDRIG"]);
  assert.equal(r.pfade.shells.kosten, 600);
  assert.equal(r.pfade.shells.verfuegbar, 0);
  assert.equal(r.pfade.shells.korrelation, "REQUEST_ID_ASYNC_BACKEND_TX");
  assert.equal(r.pfade.shells.inProgressPolicy, "WAIT_AND_REOBSERVE_NO_SEND");

  assert.equal(r.selectedPath, null);
  assert.equal(r.durableIntentErzeugt, false);
  assert.equal(r.authorityAusgestellt, false);
  assert.equal(r.sameIntentErneutSenden, false);
  assert.equal(r.gameplayWrites, 0);
  assert.equal(r.mutatingPublicFunctionCalls, 0);
  assert.equal(r.liveMutationFreigegeben, false);
  assert.equal(r.naechsterSchritt, "RESSOURCEN_BLOCKIERT_KEIN_LIVE");
  assert.equal(evidence.liveTestErlaubt, false);
  assert.equal(evidence.produktionsweiteAktivierungErlaubt, false);
});

test("Open-Pack Kandidatenvertrag bleibt nach Admission fail-closed", () => {
  assert.equal(candidate.status, "SHADOW_AND_ADMISSION_READ_ONLY_BESTANDEN_RESOURCE_BLOCKED_NO_LIVE");
  assert.equal(candidate.candidate.pack, evidence.admissionResult.kandidat.pack);
  assert.equal(candidate.candidate.goldKosten, evidence.admissionResult.kandidat.goldKosten);
  assert.equal(candidate.candidate.shellKosten, evidence.admissionResult.kandidat.shellKosten);
  assert.equal(candidate.admissionEvidence, "v5/roadmap/pr20-2-bank-open-pack-admission-evidence.json");
  assert.equal(candidate.admissionSafetyCheck, "BESTANDEN");
  assert.equal(candidate.admissionFunctionalResult, "RESOURCE_BLOCKED_NO_LIVE");
  assert.equal(candidate.liveMutationFreigegeben, false);
  assert.equal(candidate.sameIntentRetry, false);
  assert.equal(candidate.productionWideActivationAllowed, false);
});

test("Roadmap behandelt Open-Pack Admission als bestandene Sicherheitspruefung, nicht als Live-Freigabe", () => {
  const c = roadmap.parallelPreparation.openBankPackCandidate;
  assert.equal(c.status, "SHADOW_AND_ADMISSION_READ_ONLY_BESTANDEN_RESOURCE_BLOCKED_NO_LIVE");
  assert.equal(c.admissionReadOnlySafetyCheck, "BESTANDEN");
  assert.equal(c.admissionFunctionalResult, "RESOURCE_BLOCKED_NO_LIVE");
  assert.equal(c.admissionEvidence, "v5/roadmap/pr20-2-bank-open-pack-admission-evidence.json");
  assert.equal(c.characterGold, 15993820);
  assert.equal(c.characterShells, 0);
  assert.equal(c.goldBezahlbar, false);
  assert.equal(c.shellsBezahlbar, false);
  assert.equal(c.liveMutationFreigegeben, false);
  assert.equal(c.sameIntentRetry, false);
});
