import fs from "node:fs";

const lies = pfad => JSON.parse(fs.readFileSync(pfad, "utf8"));
const gate = lies("roadmap/pr20-3-market-exit-gate-status.json");
const buy = lies("roadmap/pr20-3-market-buy-gold-evidence.json");
const sell = lies("roadmap/pr20-3-market-sell-evidence.json");
const trade = lies("roadmap/pr20-3-trade-operator-acceptance.json");
const roadmap = lies("roadmap/post-r19-roadmap.json");
const market = lies("grundlage/vertraege/runtime/market-production-preparation.json");
const logistics = lies("grundlage/vertraege/runtime/logistics-transfer-production-preparation.json");

const fehler = [];
const fail = x => fehler.push(x);

if (gate.status !== "ROADMAP_ABGESCHLOSSEN_MIT_TRADE_EVIDENCE_AUSNAHMEN"
    || gate.transitionPolicy?.pr20_3RoadmapMilestoneClosed !== true
    || gate.transitionPolicy?.pr20_4RepoAndNoWritePreparationAllowed !== true
    || gate.transitionPolicy?.pr20_4ProductiveMutationAutomaticallyAllowed !== false) {
  fail("PR20_3_EXIT_GATE_STATUS_UNGUELTIG");
}

for (const [name, evidence] of [["BUY", buy], ["SELL", sell]]) {
  if (evidence.status !== "BESTANDEN_REAL_INGAME_2_OF_2_PLUS_5M"
      || evidence.aggregate?.allSevenStepsPassed !== true
      || evidence.aggregate?.exactSettlements !== 2
      || evidence.aggregate?.unresolvedSettlements !== 0
      || evidence.aggregate?.sameIntentRetry !== false
      || evidence.liveBudget?.consumed !== 2
      || evidence.liveBudget?.max !== 2
      || evidence.liveBudget?.additionalTrueFunctionalTestAllowed !== false
      || evidence.noWrite5m?.status !== "BESTANDEN"
      || evidence.noWrite5m?.samples !== 21
      || evidence.noWrite5m?.sampleGaps !== 0
      || evidence.noWrite5m?.blockerSamples !== 0
      || evidence.noWrite5m?.gameplayWrites !== 0
      || evidence.noWrite5m?.mutatingPublicFunctionCalls !== 0) {
    fail("PR20_3_"+name+"_EVIDENCE_UNGUELTIG");
  }
}

if (sell.reconstruction?.rawGuiReportAvailable !== false
    || sell.reconstruction?.onlyOperatorConfirmedFactsStored !== true
    || sell.privacy?.accountIdStored !== false
    || sell.privacy?.identifyingTokensStored !== false) {
  fail("PR20_3_SELL_REKONSTRUKTION_ODER_PRIVACY_UNGUELTIG");
}

for (const key of ["trade_buy", "trade_sell"]) {
  const p = trade.paths?.[key];
  if (p?.countsAsPassedForRoadmap !== true
      || p?.countsAsPassedEvidence !== false
      || p?.liveTestPerformed !== false
      || p?.productiveMutationAutomaticallyAllowed !== false
      || p?.localCapabilityGateRequired !== true) {
    fail("PR20_3_TRADE_OPERATOR_ACCEPTANCE_UNGUELTIG:"+key);
  }
}
if (trade.transitionPolicy?.blocksPr20_3Sequencing !== false
    || trade.transitionPolicy?.requiresDedicatedTradeLiveTestsForRoadmap !== false
    || trade.transitionPolicy?.grantsProductiveTradeAuthority !== false
    || trade.transitionPolicy?.grantsRawWriteAuthority !== false
    || trade.transitionPolicy?.rewritesHistoricalEvidence !== false) {
  fail("PR20_3_TRADE_TRANSITION_UNGUELTIG");
}

if (!["PR20.4_LOGISTIK_TRANSFER_PRODUKTIVIERUNG", "PR20.5_MERCHANT_STABILITAET"].includes(roadmap.currentGate)
    || roadmap.pr20_3?.status !== "ROADMAP_ABGESCHLOSSEN_MIT_TRADE_EVIDENCE_AUSNAHMEN"
    || roadmap.pr20_3?.productiveTradeAuthority !== false
    || !["VORBEREITUNG_FREIGEGEBEN_NO_WRITE", "INGAME_GESAMTSTUFENTEST_BEREIT", "ROADMAP_ABGESCHLOSSEN_REAL_INGAME"].includes(roadmap.pr20_4?.status)
    || roadmap.pr20_4?.productiveMutationAllowed !== false) {
  fail("PR20_3_ROADMAP_TRANSITION_UNGUELTIG");
}

if (market.status !== "ROADMAP_ABGESCHLOSSEN_MIT_TRADE_EVIDENCE_AUSNAHMEN"
    || market.authorityGrenze?.produktiveRegistrierungErlaubt !== false
    || market.authorityGrenze?.gameplayAutoritaet !== false
    || market.authorityGrenze?.rawWriteAutoritaet !== false
    || market.transaktionsRegeln?.sameIntentRetry !== false) {
  fail("PR20_3_MARKET_AUTHORITY_GRENZE_UNGUELTIG");
}

if (!["PR20_4_VORBEREITUNG_FREIGEGEBEN_NO_WRITE", "BEREIT_FUER_INGAME_GESAMTSTUFENTEST", "ROADMAP_ABGESCHLOSSEN_REAL_INGAME"].includes(logistics.status)
    || logistics.authorityGrenze?.produktiveRegistrierungErlaubt !== false
    || logistics.authorityGrenze?.gameplayAutoritaet !== false
    || logistics.authorityGrenze?.rawWriteAutoritaet !== false
    || logistics.transaktionsRegeln?.sameIntentRetry !== false) {
  fail("PR20_4_TRANSITION_GRENZE_UNGUELTIG");
}

if (fehler.length) {
  for (const x of fehler) console.error("PR20_3_MARKET_EXIT_GATE_FEHLER:", x);
  process.exit(1);
}
console.log(JSON.stringify({
  status: gate.status,
  nextGate: gate.nextGate,
  buyEvidence: buy.status,
  sellEvidence: sell.status,
  tradeRoadmapAccepted: true,
  tradeLiveEvidenceClaimed: false,
  productiveTradeAuthority: false,
  pr20_4RepoAndNoWritePreparationAllowed: true,
  sameIntentRetry: false
}, null, 2));
