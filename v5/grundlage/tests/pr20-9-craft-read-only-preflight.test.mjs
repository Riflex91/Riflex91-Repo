import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { pruefePr20_9CraftReadOnlyPreflight } from "../../erzeugt/index.js";

const contract=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/pr20-9-craft-read-only-preflight.json",
  "utf8",
));
const roadmap=JSON.parse(fs.readFileSync(
  "roadmap/post-r19-roadmap.json",
  "utf8",
));
const prep=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/merchant-remaining-production-preparation.json",
  "utf8",
));

const SOURCE_COMMIT="ddcf7222c3264f1404382e1ff5dea8e73f6cb4b4";

function recipe(overrides={}) {
  return {
    schemaVersion:1,
    craftPath:"NORMAL",
    recipeKey:"iron-sword",
    outputName:"sword",
    outputLevel:0,
    outputMenge:1,
    goldKosten:1000,
    inputs:[
      {name:"iron",level:0,menge:2},
      {name:"wood",level:0,menge:1},
    ],
    beobachtetAmMs:100,
    gueltigBisMs:1000,
    sourceSnapshotCommit:SOURCE_COMMIT,
    fingerprint:"recipe-fp",
    ...overrides,
  };
}

function reachability(overrides={}) {
  return {
    schemaVersion:1,
    erreichbar:true,
    gateRequired:false,
    gateFresh:true,
    beobachtetAmMs:100,
    gueltigBisMs:1000,
    fingerprint:"reachability-fp",
    ...overrides,
  };
}

function item(index,name,menge,overrides={}) {
  return {
    index,
    name,
    level:0,
    menge,
    locked:false,
    blocked:false,
    valueProtected:false,
    fingerprint:`${name}-${index}-fp`,
    ...overrides,
  };
}

function request(overrides={}) {
  return {
    schemaVersion:1,
    recipe:recipe(),
    inventory:[
      item(4,"iron",2),
      item(7,"wood",1),
    ],
    gold:5000,
    freieSlots:0,
    workspaceNachweisFingerprint:"workspace-fp",
    reachability:reachability(),
    maximalesEvidenceAlterMs:1000,
    ...overrides,
  };
}

test("PR20.9 normal Craft preflight is ready with exact physical inputs and freed outputspace",()=>{
  const result=pruefePr20_9CraftReadOnlyPreflight(request(),200);
  assert.equal(result.status,"BEREIT_NO_WRITE");
  assert.deepEqual(result.blocker,[]);
  assert.deepEqual(
    result.selectedInputs.map(x=>[x.name,x.inventoryIndex,x.verbrauchMenge,x.vollstaendigVerbraucht]),
    [["iron",4,2,true],["wood",7,1,true]],
  );
  assert.equal(result.serverEquivalentOutputspaceSatisfied,true);
  assert.equal(result.actionContractId,"AL-ACTION-CRAFT");
  assert.equal(result.recoveryContractId,"AL-RECOVERY-CRAFT");
  assert.equal(result.verifierId,"AL-VERIFIER-CRAFT");
  assert.equal(result.gameplayWrites,0);
  assert.equal(result.publicFunctionCalls,0);
  assert.equal(result.rawWriteCalls,0);
  assert.equal(result.craftAuthority,false);
  assert.equal(result.gameplayAuthority,false);
  assert.equal(result.rawWriteAuthority,false);
  assert.equal(result.sameIntentRetry,false);
  assert.equal(result.sendBoundaryState,"NICHT_GESENDET");
  assert.equal(result.normalRuntimeAllowed,false);
});

test("PR20.9 Craft preflight blocks stale recipe, missing reachability and insufficient gold without authority",()=>{
  const result=pruefePr20_9CraftReadOnlyPreflight(request({
    recipe:recipe({gueltigBisMs:150,goldKosten:9000}),
    reachability:reachability({erreichbar:false}),
  }),200);
  assert.equal(result.status,"BLOCKIERT");
  assert.ok(result.blocker.includes("PR20_9_CRAFT_RECIPE_EVIDENCE_STALE"));
  assert.ok(result.blocker.includes("PR20_9_CRAFT_SERVICE_NICHT_ERREICHBAR"));
  assert.ok(result.blocker.includes("PR20_9_CRAFT_GOLD_UNZUREICHEND"));
  assert.equal(result.gameplayWrites,0);
  assert.equal(result.craftAuthority,false);
});

test("PR20.9 Craft preflight conservatively rejects split-stack normal Craft",()=>{
  const result=pruefePr20_9CraftReadOnlyPreflight(request({
    inventory:[
      item(1,"iron",1),
      item(2,"iron",1),
      item(7,"wood",1),
    ],
  }),200);
  assert.equal(result.status,"BLOCKIERT");
  assert.ok(result.blocker.includes(
    "PR20_9_CRAFT_INPUT_FEHLT_ODER_SPLIT_STACK_ERFORDERLICH:iron@0",
  ));
  assert.equal(result.publicFunctionCalls,0);
});

test("PR20.9 Craft preflight denies protected physical inputs and missing outputspace",()=>{
  const protectedResult=pruefePr20_9CraftReadOnlyPreflight(request({
    inventory:[
      item(4,"iron",2,{valueProtected:true}),
      item(7,"wood",1),
    ],
  }),200);
  assert.equal(protectedResult.status,"BLOCKIERT");
  assert.ok(protectedResult.blocker.includes(
    "PR20_9_CRAFT_INPUT_FEHLT_ODER_SPLIT_STACK_ERFORDERLICH:iron@0",
  ));

  const outputspaceResult=pruefePr20_9CraftReadOnlyPreflight(request({
    inventory:[
      item(4,"iron",3),
      item(7,"wood",2),
    ],
    freieSlots:0,
  }),200);
  assert.equal(outputspaceResult.status,"BLOCKIERT");
  assert.ok(outputspaceResult.blocker.includes("PR20_9_CRAFT_OUTPUTSPACE_UNZUREICHEND"));
  assert.equal(outputspaceResult.serverEquivalentOutputspaceSatisfied,false);
});

test("PR20.9 Craft preflight blocks stale required gate",()=>{
  const result=pruefePr20_9CraftReadOnlyPreflight(request({
    reachability:reachability({gateRequired:true,gateFresh:false}),
  }),200);
  assert.equal(result.status,"BLOCKIERT");
  assert.ok(result.blocker.includes("PR20_9_CRAFT_GATE_NICHT_FRISCH"));
});

test("PR20.9 Craft contract keeps special paths and all write authority disabled",()=>{
  assert.equal(contract.status,"BEREIT_NO_WRITE");
  assert.equal(contract.scope,"NORMAL_CRAFT_ONLY");
  assert.equal(contract.actionContractId,"AL-ACTION-CRAFT");
  assert.equal(contract.conservativeBoundaries.splitStackNormalCraftAllowed,false);
  assert.equal(contract.conservativeBoundaries.anniversaryCraftAllowed,false);
  assert.equal(contract.conservativeBoundaries.autoCraftAllowed,false);
  assert.equal(contract.conservativeBoundaries.broadGraphExecutionAuthority,false);
  assert.equal(contract.authority.craftAuthority,false);
  assert.equal(contract.authority.gameplayAuthority,false);
  assert.equal(contract.authority.rawWriteAuthority,false);
  assert.equal(contract.authority.normalRuntimeAllowed,false);
  assert.equal(contract.writes.maximumGameplayWrites,0);
  assert.equal(contract.writes.maximumPublicFunctionCalls,0);
  assert.equal(contract.writes.maximumRawWriteCalls,0);
  assert.equal(contract.writes.sameIntentRetry,false);
  assert.equal(contract.nextGate,"PR20_9_CRAFT_DURABLE_SHADOW_NO_WRITE_PREPARATION");
});

test("PR20.9 roadmap and merchant preparation retain the authority-free Craft preflight after gate advancement",()=>{
  assert.equal(roadmap.pr20_9.craftReadOnlyPreflight.status,"BEREIT_NO_WRITE");
  assert.equal(prep.pr20_9.craftReadOnlyPreflight.status,"BEREIT_NO_WRITE");
  assert.equal(
    prep.pr20_9.craftReadOnlyPreflight.scope,
    roadmap.pr20_9.craftReadOnlyPreflight.scope,
  );
  assert.equal(roadmap.pr20_9.craftReadOnlyPreflight.craftAuthority,false);
  assert.equal(roadmap.pr20_9.craftReadOnlyPreflight.gameplayAuthority,false);
  assert.equal(roadmap.pr20_9.craftReadOnlyPreflight.rawWriteAuthority,false);
  assert.equal(roadmap.pr20_9.craftReadOnlyPreflight.normalRuntimeAllowed,false);
  assert.equal(prep.pr20_9.craftReadOnlyPreflight.craftAuthority,false);
  assert.equal(prep.pr20_9.craftReadOnlyPreflight.gameplayAuthority,false);
  assert.equal(prep.pr20_9.craftReadOnlyPreflight.rawWriteAuthority,false);
  assert.equal(prep.pr20_9.craftReadOnlyPreflight.normalRuntimeAllowed,false);

  const parallel=roadmap.parallelPreparations.find(x=>x?.id==="PR20.9_PRODUCTION");
  assert.ok(parallel);
  assert.equal(parallel.liveExecutionAllowed,false);
  assert.deepEqual(parallel.blockedBy,[]);
  assert.ok(parallel.artifacts.includes(
    "v5/grundlage/quelle/produktion/pr20-9-craft-read-only-preflight.ts",
  ));
});
