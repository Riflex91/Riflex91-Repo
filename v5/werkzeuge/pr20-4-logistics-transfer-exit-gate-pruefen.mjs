import fs from "node:fs";

const lies = pfad => JSON.parse(fs.readFileSync(pfad, "utf8"));
const evidence = lies("roadmap/pr20-4-logistics-transfer-evidence.json");
const gate = lies("roadmap/pr20-4-logistics-transfer-exit-gate-status.json");
const roadmap = lies("roadmap/post-r19-roadmap.json");
const prep = lies("grundlage/vertraege/runtime/logistics-transfer-production-preparation.json");

const fehler = [];
const fail = x => fehler.push(x);

if (evidence.status !== "BESTANDEN_REAL_INGAME_16_OF_16_ITEM_GOLD_2_OF_2_PLUS_5M"
    || evidence.aggregate?.allSixteenStepsPassed !== true
    || evidence.aggregate?.stepsPassed !== 16
    || evidence.aggregate?.stepsTotal !== 16
    || evidence.aggregate?.gameplayWritesTotal !== 4
    || evidence.aggregate?.sameIntentRetry !== false
    || evidence.aggregate?.duplicateTransferObserved !== false) {
  fail("PR20_4_AGGREGAT_EVIDENCE_UNGUELTIG");
}

for (const [name, transfer] of [
  ["ITEM", evidence.itemTransfer],
  ["GOLD", evidence.goldTransfer],
]) {
  if (transfer?.liveBudget?.consumed !== 2
      || transfer?.liveBudget?.max !== 2
      || transfer?.liveBudget?.additionalTrueFunctionalTestAllowed !== false
      || transfer?.allCommitted !== true
      || transfer?.exactRecipientSettlements !== 2
      || transfer?.roundtripRestored !== true
      || transfer?.noWrite5m?.status !== "BESTANDEN"
      || transfer?.noWrite5m?.durationMs < 300000
      || transfer?.noWrite5m?.samples !== 21
      || transfer?.noWrite5m?.sampleGaps !== 0
      || transfer?.noWrite5m?.blockerSamples !== 0
      || transfer?.noWrite5m?.performanceTrickErrors !== 0
      || transfer?.noWrite5m?.gameplayWrites !== 0
      || transfer?.noWrite5m?.mutatingPublicFunctionCalls !== 0) {
    fail("PR20_4_"+name+"_EVIDENCE_UNGUELTIG");
  }
}

if (evidence.evidenceSource?.accountIdStored !== false
    || evidence.evidenceSource?.sessionIdStored !== false
    || evidence.evidenceSource?.identifyingTokensStored !== false
    || evidence.exactSourceShaClaimed !== false) {
  fail("PR20_4_PRIVACY_ODER_SOURCE_SHA_CLAIM_UNGUELTIG");
}

if (gate.status !== "ROADMAP_ABGESCHLOSSEN_REAL_INGAME"
    || gate.transitionPolicy?.pr20_4RoadmapMilestoneClosed !== true
    || gate.transitionPolicy?.pr20_5MerchantStabilityAllowed !== true
    || gate.transitionPolicy?.pr20_4ProductiveMutationAutomaticallyAllowed !== false
    || gate.transitionPolicy?.transferProductiveAuthorityAutomaticallyGranted !== false
    || gate.safetyRetained?.productiveTransferAuthorityGranted !== false
    || gate.safetyRetained?.rawWriteAuthorityGranted !== false
    || gate.safetyRetained?.sameIntentRetry !== false) {
  fail("PR20_4_EXIT_GATE_UNGUELTIG");
}

if (roadmap.currentGate !== "PR20.5_MERCHANT_STABILITAET"
    || roadmap.pr20_4?.status !== "ROADMAP_ABGESCHLOSSEN_REAL_INGAME"
    || roadmap.pr20_4?.productiveMutationAllowed !== false
    || roadmap.pr20_4?.gameplayAuthority !== false
    || roadmap.pr20_4?.rawWriteAuthority !== false
    || roadmap.pr20_5?.status !== "FREIGEGEBEN_FUER_PRODUKTIVIERUNG"
    || roadmap.pr20_5?.gameplayAuthority !== false
    || roadmap.pr20_5?.integration15mRequired !== true) {
  fail("PR20_4_ROADMAP_TRANSITION_UNGUELTIG");
}

if (prep.status !== "ROADMAP_ABGESCHLOSSEN_REAL_INGAME"
    || prep.authorityGrenze?.produktiveRegistrierungErlaubt !== false
    || prep.authorityGrenze?.gameplayAutoritaet !== false
    || prep.authorityGrenze?.rawWriteAutoritaet !== false
    || prep.transaktionsRegeln?.sameIntentRetry !== false
    || prep.testHarness?.productiveTransferAuthority !== false) {
  fail("PR20_4_AUTHORITY_GRENZE_UNGUELTIG");
}

if (fehler.length) {
  for (const x of fehler) console.error("PR20_4_LOGISTICS_EXIT_GATE_FEHLER:", x);
  process.exit(1);
}

console.log(JSON.stringify({
  status: gate.status,
  nextGate: gate.nextGate,
  evidence: evidence.status,
  itemLiveTests: "2/2",
  goldLiveTests: "2/2",
  itemNoWrite5m: evidence.itemTransfer.noWrite5m.status,
  goldNoWrite5m: evidence.goldTransfer.noWrite5m.status,
  productiveTransferAuthority: false,
  sameIntentRetry: false
}, null, 2));
