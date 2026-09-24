import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";

const contract=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/pr20-8-compound-durable-shadow-preparation.json",
  "utf8",
));
const bytes=fs.readFileSync("werkzeuge/pr20-8-compound-durable-shadow-no-write.js");
const source=bytes.toString("utf8");

test("PR20.8 Compound durable shadow contract pins exact hpamulet x3 + cscroll0",()=>{
  assert.equal(contract.status,"PACKAGE_BEREIT_NO_WRITE");
  assert.equal(contract.testId,"pr20-8-compound-durable-shadow-no-write");
  assert.equal(contract.controllerVersion,"1.0.0");
  assert.equal(contract.family,"COMPOUND");
  assert.equal(contract.ratifiedCandidateEvidenceCommit,"5974e293e973493241e3d659ea30d3cae85ebc35");
  assert.equal(contract.ratifiedCandidateEvidence,
    "roadmap/pr20-8-compound-exchange-target-family-rescan-v1-0-4-evidence.json");
  assert.deepEqual(contract.exactCandidate.observedIndexesFromEvidence,[1,22,23]);
  assert.equal(contract.exactCandidate.name,"hpamulet");
  assert.equal(contract.exactCandidate.level,0);
  assert.equal(contract.exactCandidate.baseGold,20000);
  assert.equal(contract.exactCandidate.physicalQuantity,3);
  assert.equal(contract.exactCandidate.observedIndexesCarryAuthority,false);
  assert.equal(contract.exactCandidate.currentIndexesMustBeReresolved,true);
  assert.equal(contract.exactCandidate.exactThreeDistinctPhysicalItemsRequired,true);
  assert.equal(contract.exactScroll.name,"cscroll0");
  assert.equal(contract.exactScroll.type,"cscroll");
  assert.equal(contract.exactScroll.grade,0);
  assert.equal(contract.exactScroll.baseGold,6400);
  assert.equal(contract.exactScroll.observedQuantityFromEvidence,20);
  assert.equal(contract.offering,null);
  assert.equal(contract.normalPathOnly,true);
});

test("PR20.8 Compound durable shadow package pin and no-write boundary are exact",()=>{
  assert.equal(contract.package.sourceCommit,"5577a45443db03a8cc0617ce61e0ec4b427d4aea");
  assert.equal(contract.package.sha256,
    "94685bc0d439eb86b3a31763ffa0a06854c06572d875f55584a7558c9c368547");
  assert.equal(contract.package.bytes,34995);
  assert.equal(contract.package.expectedGlobal,"V5PR208CompoundDurableShadowNoWrite");
  assert.equal(bytes.length,34995);
  assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"),contract.package.sha256);

  assert.deepEqual(contract.resourceClaims,[
    "character:My_Merchant:inventory",
    "character:My_Merchant:q",
    "character:My_Merchant:action_channel:compound",
    "character:My_Merchant:socket_call_budget",
  ]);
  assert.equal(contract.preflight.serviceReference,"G.maps.main.ref.c_mid");
  assert.equal(contract.preflight.sourcePinnedSellDistance,400);
  assert.equal(contract.preflight.conservativeLiveSafetyDistanceMax,300);
  assert.equal(contract.preflight.threeInputMaterialsFingerprintRequired,true);
  assert.equal(contract.preflight.compoundEffectDomainFingerprintRequired,true);
  assert.equal(contract.durableShadow.journalTerminalArt,"ABBRUCH");
  assert.equal(contract.durableShadow.sendBoundaryState,"NICHT_GESENDET");
  assert.equal(contract.durableShadow.reconciliationClassification,"NOT_APPLIED");
  assert.equal(contract.durableShadow.sameIntentRetry,false);
  assert.equal(contract.durableShadow.freshReresolutionRequiredBeforeFutureSend,true);
  assert.equal(contract.oneShotPreparation.maximumUses,1);
  assert.equal(contract.oneShotPreparation.compoundAuthorityIssued,false);

  for(const [key,value] of Object.entries({
    productionDurableIntentCreated:false,
    authorityIssued:false,
    compoundAuthority:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
    normalCompoundWriteRatification:false,
    gameplayWrites:0,
    publicFunctionCalls:0,
    rawWriteCalls:0,
    normalRuntimeAllowed:false,
  })) assert.equal(contract.authorityBoundary[key],value,key);

  for(const marker of [
    "compound(","socket.emit(",".socket.emit(","api_call(","send_item(","send_gold(",
  ]) assert.equal(source.includes(marker),false,marker);
  assert.equal(contract.nextGate,"PR20_8_COMPOUND_DURABLE_SHADOW_MANIFEST_CUTOVER");
});
