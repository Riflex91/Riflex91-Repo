import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const contract=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/pr20-8-exchange-anniversarygift-exception-rescan.json",
  "utf8",
));
const manifest=JSON.parse(fs.readFileSync("roadmap/v5-autonomous-test-manifest.json","utf8"));
const roadmap=JSON.parse(fs.readFileSync("roadmap/post-r19-roadmap.json","utf8"));
const prior=JSON.parse(fs.readFileSync(
  "roadmap/pr20-8-exchange-readonly-rescan-v1-0-6-evidence.json",
  "utf8",
));

test("anniversarygift exception is scanner-only and does not relax generic exclusive policy",()=>{
  assert.equal(contract.status,"MANIFEST_CUTOVER_PREPARATION");
  assert.equal(contract.decision.exactItem,"anniversarygift");
  assert.equal(contract.decision.exceptionScope,"EXCHANGE_CANDIDATE_SCANNER_ONLY");
  assert.equal(contract.decision.genericExclusivePolicyRelaxed,false);
  assert.equal(contract.decision.otherExclusiveItemsRemainBlocked,true);
  assert.equal(contract.decision.acquisitionPolicyChanged,false);
  assert.equal(contract.decision.bankPolicyChanged,false);
  assert.equal(contract.decision.marketPolicyChanged,false);
  assert.equal(contract.decision.seashellFarmActivePath,false);
  assert.equal(contract.itemDefinition.exchangeQuantity,1);
  assert.equal(contract.itemDefinition.baseGold,100);
  assert.equal(contract.itemDefinition.exclusive,true);
});

test("v1.0.7 exception rescan remains fully zero-write and authority closed",()=>{
  assert.equal(contract.package.testId,"pr20-8-wertmutation-live-candidate-readonly");
  assert.equal(contract.package.controllerVersion,"1.0.7");
  assert.equal(contract.package.path,
    "v5/werkzeuge/pr20-8-wertmutation-live-candidate-readonly-v1-0-7.js");
  assert.equal(contract.package.sha256,
    "00e2f5ed379f27a489af1c1a87f142cd7efe7fb7617d1e814d3033563137dbf9");
  assert.equal(contract.package.bytes,22004);
  assert.equal(contract.safety.readOnly,true);
  assert.equal(contract.safety.gameplayWrites,0);
  assert.equal(contract.safety.publicFunctionCalls,0);
  assert.equal(contract.safety.rawWriteCalls,0);
  assert.equal(contract.safety.sameIntentRetry,false);
  assert.equal(contract.safety.authorityIssued,false);
  assert.equal(contract.safety.exchangeAuthority,false);
  assert.equal(contract.safety.normalRuntimeAllowed,false);
});

test("active manifest has advanced from the ratified scanner to the anniversarygift Exchange service mount",()=>{
  assert.equal(manifest.testId,
    "pr20-8-exchange-anniversarygift-live-5m");
  assert.equal(manifest.controllerVersion,"1.0.0");
  assert.equal(manifest.sourceCommit,
    "859c5be1067fbd5360c17ccfe0d912a98537bfc9");
  assert.equal(manifest.packagePath,
    "v5/werkzeuge/pr20-8-exchange-anniversarygift-live-5m-v1-0-0.js");
  assert.equal(manifest.packageSha256,
    "455593d7691dc5436af27a5b89afb5fc208f2ebca4253aa87d0726821abcda94");
  assert.equal(manifest.expectedGlobal,
    "V5PR208ExchangeAnniversarygiftLive5m");
  assert.equal(manifest.normalRuntimeAllowed,false);
});

test("Seashell work stays prepared but inactive while anniversarygift path is current",()=>{
  const a=roadmap.pr20_8.exchangeCandidateAcquisition;
  assert.equal(roadmap.pr20_8.status,
    "EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_ROUTE_SHADOW_PACKAGE_PREPARED_NO_WRITE");
  assert.equal(roadmap.pr20_8.nextAction,"PREPARE_ANNIVERSARYGIFT_EXCHANGE_AUTONOMY_ROUTE_SHADOW_MANIFEST_CUTOVER");
  assert.equal(a.seashellFarmShadow.activePath,false);
  assert.equal(a.seashellFarmShadow.supersededBy,"ANNIVERSARYGIFT_TEST_EXCEPTION_RESCAN");
  assert.equal(a.seashellFarmShadow.farmAuthority,false);
  assert.equal(a.anniversaryGiftExceptionRescan.scannerOnlyException,true);
  assert.equal(a.anniversaryGiftExceptionRescan.exchangeAuthority,false);
  assert.equal(a.anniversaryGiftExceptionRescan.normalRuntimeAllowed,false);
});

test("ratified v1.0.6 no-candidate evidence remains unchanged historical evidence",()=>{
  assert.equal(prior.status,"RATIFIED_FRESH_NO_CANDIDATE_ZERO_WRITE");
  assert.equal(prior.package.controllerVersion,"1.0.6");
  assert.equal(prior.package.sourceCommit,
    "a5fd67cc9c587b2a20b163915936717c7b4e8321");
  assert.equal(prior.observations.exchange.status,"KEIN_KANDIDAT");
  assert.deepEqual(prior.observations.exchange.rejected,[
    {name:"anniversarygift",index:4,reason:"UNSAFE_PHYSICAL_ITEM"},
  ]);
});
