import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source=fs.readFileSync(
  "werkzeuge/pr20-8-seashell-farm-shadow-readonly-v1-0-0.js",
  "utf8",
);
const runnerContract=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/pr20-8-exchange-seashell-farm-shadow-runner.json",
  "utf8",
));
const roadmap=JSON.parse(fs.readFileSync("roadmap/post-r19-roadmap.json","utf8"));
const manifest=JSON.parse(fs.readFileSync("roadmap/v5-autonomous-test-manifest.json","utf8"));

function sandbox(overrides={}){
  const character={
    name:"My_Ranger1",
    ctype:"ranger",
    level:70,
    map:"main",
    hp:1000,
    max_hp:1000,
    rip:false,
    dead:false,
    isize:42,
    items:[null,null,null],
    ...(overrides.character||{}),
  };
  const box={
    console,
    Date,
    Promise,
    Object,
    Array,
    String,
    Number,
    Boolean,
    JSON,
    Math,
    Set,
    setTimeout:fn=>setImmediate(fn),
    clearTimeout:()=>{},
    performance_trick(){},
    sounds:{empty:{cplaying:true,playing:()=>true}},
    character,
    server_region:"EU",
    server_identifier:"I",
    G:{
      items:{
        seashell:{
          type:"quest",
          g:800,
          e:20,
          s:true,
          quest:"seashell",
        },
      },
      monsters:{croc:{name:"Croc"}},
      ...(overrides.G||{}),
    },
    entities:{},
    ...(overrides.root||{}),
  };
  box.parent=box;
  box.globalThis=box;
  return box;
}

async function execute(overrides={}){
  const box=sandbox(overrides);
  vm.createContext(box);
  vm.runInContext(source,box,{filename:"pr20-8-seashell-farm-shadow-readonly-v1-0-0.js"});
  for(let i=0;i<200;i+=1){
    await new Promise(resolve=>setImmediate(resolve));
    const status=box.V5PR208SeashellFarmShadowReadonly?.status?.();
    if(status?.terminal) return {status,box};
  }
  throw new Error("shadow runner did not terminate");
}

test("safe local Ranger is read-only shadow ready with zero authority",async()=>{
  const {status}=await execute();
  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.terminal,true);
  assert.equal(status.worker.name,"My_Ranger1");
  assert.equal(status.worker.ctype,"ranger");
  assert.equal(status.inventory.currentSeashellQuantity,0);
  assert.equal(status.inventory.remainingQuantity,20);
  assert.equal(status.inventory.capacityAvailable,true);
  assert.equal(status.gameData.exchangeQuantity,20);
  assert.equal(status.gameData.baseGold,800);
  assert.equal(status.gameData.questMarker,"seashell");
  assert.equal(status.gameData.crocPresent,true);
  assert.equal(status.hostileTargetCount,0);
  assert.equal(status.authority.authorityIssued,false);
  assert.equal(status.authority.movementAuthority,false);
  assert.equal(status.authority.combatAuthority,false);
  assert.equal(status.authority.skillAuthority,false);
  assert.equal(status.authority.lootAuthority,false);
  assert.equal(status.authority.farmAuthority,false);
  assert.equal(status.authority.exchangeAuthority,false);
  assert.equal(status.authority.gameplayAuthority,false);
  assert.equal(status.authority.rawWriteAuthority,false);
  assert.equal(status.gameplayWrites,0);
  assert.equal(status.publicFunctionCalls,0);
  assert.equal(status.rawWriteCalls,0);
  assert.equal(status.startCalls,0);
  assert.equal(status.disconnectCalls,0);
  assert.equal(status.commandCharacterCalls,0);
  assert.equal(status.farmerWorkersInstalled,0);
  assert.equal(status.sameIntentRetry,false);
  assert.equal(status.normalRuntimeAllowed,false);
  assert.equal(status.nextAction,"PREPARE_SEASHELL_FARM_SHADOW_COORDINATOR_READ_ONLY");
});

test("Priest and Mage are accepted but Merchant is not a farm worker",async()=>{
  for(const [name,ctype] of [["My_Priest","priest"],["My_Mage","mage"]]){
    const {status}=await execute({character:{name,ctype}});
    assert.equal(status.status,"BESTANDEN");
    assert.equal(status.worker.name,name);
  }
  const {status}=await execute({character:{name:"My_Merchant",ctype:"merchant"}});
  assert.equal(status.status,"BLOCKIERT");
  assert.deepEqual(Array.from(status.blocker),["PR20_8_SEASHELL_SHADOW_FARMER_CONTEXT_REQUIRED"]);
});

test("twenty existing Seashells route to Merchant handoff shadow, not Exchange scanner",async()=>{
  const {status}=await execute({
    character:{
      items:[{name:"seashell",q:20}],
      hp:1,
      max_hp:1000,
      isize:1,
    },
    root:{
      entities:{
        croc1:{id:"croc1",type:"monster",target:"My_Ranger1"},
      },
    },
  });
  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.inventory.currentSeashellQuantity,20);
  assert.equal(status.inventory.remainingQuantity,0);
  assert.equal(status.nextAction,"PREPARE_SEASHELL_HANDOFF_SHADOW_NO_WRITE");
  assert.equal(status.authority.farmAuthority,false);
  assert.equal(status.authority.exchangeAuthority,false);
});

test("low HP, full inventory, hostile target and dead state fail closed",async()=>{
  const {status}=await execute({
    character:{
      hp:700,
      max_hp:1000,
      rip:true,
      isize:2,
      items:[{name:"hpot0",q:1},{name:"mpot0",q:1}],
    },
    root:{
      entities:{
        hostile:{id:"hostile",type:"monster",target:"My_Ranger1"},
      },
    },
  });
  assert.equal(status.status,"BLOCKIERT");
  assert.ok(status.blocker.includes("PR20_8_SEASHELL_SHADOW_LIFECYCLE_NICHT_AKTIV"));
  assert.ok(status.blocker.includes("PR20_8_SEASHELL_SHADOW_HP_HARD_CAP"));
  assert.ok(status.blocker.includes("PR20_8_SEASHELL_SHADOW_INVENTORY_CAPACITY_FEHLT"));
  assert.ok(status.blocker.includes("PR20_8_SEASHELL_SHADOW_CHARACTER_UNTER_ANGRIFF"));
  assert.equal(status.nextAction,"REMAIN_BLOCKED");
});

test("server and game-data drift block before any authority",async()=>{
  const server=await execute({root:{server_region:"US"}});
  assert.equal(server.status.status,"BLOCKIERT");
  assert.ok(server.status.blocker.includes("PR20_8_SEASHELL_SHADOW_SERVER_DRIFT"));

  const data=await execute({
    G:{
      items:{seashell:{g:800,e:20,quest:true}},
      monsters:{croc:{name:"Croc"}},
    },
  });
  assert.equal(data.status.status,"BLOCKIERT");
  assert.ok(data.status.blocker.includes("PR20_8_SEASHELL_SHADOW_GAME_DATA_DRIFT"));
});

test("performance trick must be active for unattended read-only observation",async()=>{
  const {status}=await execute({
    root:{
      performance_trick:undefined,
      sounds:undefined,
    },
  });
  assert.equal(status.status,"BLOCKIERT");
  assert.ok(status.blocker.includes("PR20_8_SEASHELL_SHADOW_PERFORMANCE_TRICK_BLOCKED"));
});

test("runner source contains no gameplay, lifecycle or raw transport mutation path",()=>{
  for(const marker of [
    "smart_move(",
    "move(",
    "attack(",
    "use_skill(",
    "loot(",
    "exchange(",
    "buy(",
    "trade_buy(",
    "send_item(",
    "send_gold(",
    "start_character(",
    "command_character(",
    "/disconnect ",
    "api_call(",
    "socket.emit(",
    ".socket.emit(",
  ]) assert.equal(source.includes(marker),false,marker);
  assert.ok(source.includes("gameplayWrites: 0"));
  assert.ok(source.includes("publicFunctionCalls: 0"));
  assert.ok(source.includes("rawWriteCalls: 0"));
  assert.ok(source.includes("farmerWorkersInstalled: 0"));
  assert.ok(source.includes("normalRuntimeAllowed: false"));
});

test("runner contract and current roadmap remain read-only and undeployed",()=>{
  assert.equal(runnerContract.status,"RUNNER_PREPARED_READ_ONLY");
  assert.equal(runnerContract.runner.testId,"pr20-8-seashell-farm-shadow-readonly");
  assert.equal(runnerContract.runner.controllerVersion,"1.0.0");
  assert.equal(runnerContract.runner.expectedGlobal,"V5PR208SeashellFarmShadowReadonly");
  assert.equal(runnerContract.runner.localFarmerOnly,true);
  assert.equal(runnerContract.runner.packagePinDeferredUntilManifestCutover,true);
  assert.equal(runnerContract.noWriteBoundary.movementAuthority,false);
  assert.equal(runnerContract.noWriteBoundary.combatAuthority,false);
  assert.equal(runnerContract.noWriteBoundary.skillAuthority,false);
  assert.equal(runnerContract.noWriteBoundary.lootAuthority,false);
  assert.equal(runnerContract.noWriteBoundary.farmAuthority,false);
  assert.equal(runnerContract.noWriteBoundary.exchangeAuthority,false);
  assert.equal(runnerContract.noWriteBoundary.startCharacterAllowed,false);
  assert.equal(runnerContract.noWriteBoundary.commandCharacterAllowed,false);
  assert.equal(runnerContract.noWriteBoundary.workerInstallAllowed,false);
  assert.equal(runnerContract.deployment.autonomousManifestChanged,false);
  assert.equal(runnerContract.deployment.manifestCutoverPrepared,false);
  assert.equal(runnerContract.deployment.deployed,false);
  assert.equal(runnerContract.nextAction,"PREPARE_SEASHELL_FARM_SHADOW_COORDINATOR_READ_ONLY");

  assert.equal(roadmap.pr20_8.status,"EXCHANGE_ANNIVERSARYGIFT_EXCEPTION_RESCAN_MANIFEST_CUTOVER_PREPARED");
  assert.equal(roadmap.pr20_8.nextAction,"DEPLOY_ANNIVERSARYGIFT_EXCEPTION_RESCAN");
  const shadow=roadmap.pr20_8.exchangeCandidateAcquisition.seashellFarmShadow;
  assert.equal(shadow.runnerPrepared,true);
  assert.equal(shadow.manifestCutoverPrepared,false);
  assert.equal(shadow.deployed,false);
  assert.equal(shadow.liveEvidenceObserved,false);
  assert.equal(shadow.alreadySatisfiedNextAction,"PREPARE_SEASHELL_HANDOFF_SHADOW_NO_WRITE");
});

test("autonomous manifest is cut over to the anniversarygift exception rescan",()=>{
  assert.equal(manifest.testId,"pr20-8-wertmutation-live-candidate-readonly");
  assert.equal(manifest.controllerVersion,"1.0.7");
  assert.equal(manifest.sourceCommit,"5ae7e2699ca38381df4e90ea385732241cfbcd55");
  assert.equal(
    manifest.packagePath,
    "v5/werkzeuge/pr20-8-wertmutation-live-candidate-readonly-v1-0-7.js",
  );
  assert.equal(manifest.packageSha256,"00e2f5ed379f27a489af1c1a87f142cd7efe7fb7617d1e814d3033563137dbf9");
  assert.equal(manifest.expectedGlobal,"V5PR208ValueMutationLiveCandidateReadonly");
  assert.equal(manifest.normalRuntimeAllowed,false);
});
