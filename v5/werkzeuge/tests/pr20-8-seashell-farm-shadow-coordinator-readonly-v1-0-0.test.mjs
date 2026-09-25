import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source=fs.readFileSync(
  "werkzeuge/pr20-8-seashell-farm-shadow-coordinator-readonly-v1-0-0.js",
  "utf8",
);
const coordinatorContract=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/pr20-8-exchange-seashell-farm-shadow-coordinator.json",
  "utf8",
));
const roadmap=JSON.parse(fs.readFileSync("roadmap/post-r19-roadmap.json","utf8"));
const manifest=JSON.parse(fs.readFileSync("roadmap/v5-autonomous-test-manifest.json","utf8"));

function farmer(name,ctype,seashells=0,overrides={}){
  const items=seashells>0
    ? [{name:"seashell",q:seashells},null]
    : [null,null];
  return {
    name,ctype,level:70,map:"main",
    hp:1000,max_hp:1000,rip:false,dead:false,isize:42,items,
    ...overrides,
  };
}

function sandbox({
  rows=null,
  xRows=null,
  active=["My_Ranger1","My_Priest","My_Mage"],
  character={name:"My_Merchant",ctype:"merchant"},
  root={},
  G={},
}={}){
  const defaultRows=rows||[
    farmer("My_Ranger1","ranger",2),
    farmer("My_Priest","priest",5),
    farmer("My_Mage","mage",0),
  ];
  const box={
    console,Date,Promise,Object,Array,String,Number,Boolean,JSON,Math,Set,
    setTimeout:fn=>setImmediate(fn),
    clearTimeout:()=>{},
    performance_trick(){},
    sounds:{empty:{cplaying:true,playing:()=>true}},
    character,
    server_region:"EU",
    server_identifier:"I",
    get_characters:()=>defaultRows,
    get_active_characters:()=>active,
    G:{
      items:{seashell:{type:"quest",g:800,e:20,s:true,quest:"seashell"}},
      monsters:{croc:{name:"Croc"}},
      ...G,
    },
    AIO_V3:{
      operations:{
        status:()=>({schemaVersion:1,mode:"V5_AUTONOMOUS_TEST"}),
        hostHeartbeat:()=>({schemaVersion:1,alive:true}),
      },
    },
    ...root,
  };
  if(xRows) box.X={characters:xRows};
  box.parent=box;
  box.globalThis=box;
  return box;
}

async function execute(options={}){
  const box=sandbox(options);
  vm.createContext(box);
  vm.runInContext(source,box,{
    filename:"pr20-8-seashell-farm-shadow-coordinator-readonly-v1-0-0.js",
  });
  for(let i=0;i<300;i+=1){
    await new Promise(resolve=>setImmediate(resolve));
    const status=box.V5PR208SeashellFarmShadowCoordinatorReadonly?.status?.();
    if(status?.terminal) return {status,box};
  }
  throw new Error("coordinator did not terminate");
}

test("coordinator selects safe active farmer with most existing Seashells read-only",async()=>{
  const {status}=await execute();
  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.rosterSource,"get_characters");
  assert.deepEqual(Array.from(status.activeCharacters),["My_Mage","My_Priest","My_Ranger1"]);
  assert.equal(status.observations.length,3);
  assert.equal(status.selectedWorker.name,"My_Priest");
  assert.equal(status.selectedWorker.currentSeashellQuantity,5);
  assert.equal(status.selectedWorker.remainingQuantity,15);
  assert.equal(
    status.selectedWorker.selectionReason,
    "MINIMIZE_REMAINING_SEASHELLS_THEN_STABLE_FARMER_ORDER",
  );
  assert.equal(
    status.nextAction,
    "PREPARE_SEASHELL_FARM_SHADOW_WORKER_DISTRIBUTION_NO_WRITE",
  );
  assert.equal(status.gameplayWrites,0);
  assert.equal(status.publicFunctionCalls,0);
  assert.equal(status.rawWriteCalls,0);
  assert.equal(status.startCalls,0);
  assert.equal(status.disconnectCalls,0);
  assert.equal(status.commandCharacterCalls,0);
  assert.equal(status.farmerWorkersInstalled,0);
  assert.equal(status.authority.authorityIssued,false);
  assert.equal(status.authority.farmAuthority,false);
  assert.equal(status.authority.handoffAuthority,false);
  assert.equal(status.authority.exchangeAuthority,false);
  assert.equal(status.normalRuntimeAllowed,false);
});

test("farmer already holding twenty Seashells takes handoff path before farming",async()=>{
  const {status}=await execute({
    rows:[
      farmer("My_Ranger1","ranger",1),
      farmer("My_Priest","priest",20,{hp:100,max_hp:1000}),
      farmer("My_Mage","mage",25),
    ],
  });
  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.selectedWorker.name,"My_Mage");
  assert.equal(status.selectedWorker.handoffReady,true);
  assert.equal(status.selectedWorker.selectionReason,"SEASHELL_TARGET_ALREADY_SATISFIED");
  assert.equal(status.nextAction,"PREPARE_SEASHELL_HANDOFF_SHADOW_NO_WRITE");
  assert.equal(status.authority.handoffAuthority,false);
});

test("rich X.characters snapshot is preferred over metadata-only get_characters",async()=>{
  const metadata=[
    {name:"My_Ranger1",ctype:"ranger",level:70},
    {name:"My_Priest",ctype:"priest",level:70},
    {name:"My_Mage",ctype:"mage",level:70},
  ];
  const rich=[
    farmer("My_Ranger1","ranger",3),
    farmer("My_Priest","priest",4),
    farmer("My_Mage","mage",7),
  ];
  const {status}=await execute({rows:metadata,xRows:rich});
  assert.equal(status.status,"BESTANDEN");
  assert.equal(status.rosterSource,"X.characters");
  assert.equal(status.selectedWorker.name,"My_Mage");
  const meta=status.rosterSourceCandidates.find(x=>x.source==="get_characters");
  const x=status.rosterSourceCandidates.find(x=>x.source==="X.characters");
  assert.equal(meta.richFarmerRows,0);
  assert.equal(x.richFarmerRows,3);
  assert.ok(x.score>meta.score);
});

test("no safe active farmer fails closed without lifecycle mutation",async()=>{
  const {status}=await execute({
    rows:[
      farmer("My_Ranger1","ranger",0,{hp:700,max_hp:1000}),
      farmer("My_Priest","priest",0,{isize:2,items:[{name:"hpot0"},{name:"mpot0"}]}),
      farmer("My_Mage","mage",0,{rip:true}),
    ],
  });
  assert.equal(status.status,"BLOCKIERT");
  assert.ok(status.blocker.includes("PR20_8_SEASHELL_COORDINATOR_KEIN_SICHERER_AKTIVER_FARMER"));
  assert.equal(status.nextAction,"REMAIN_BLOCKED");
  assert.equal(status.startCalls,0);
  assert.equal(status.commandCharacterCalls,0);
  assert.equal(status.farmerWorkersInstalled,0);
});

test("incomplete roster, wrong context, server drift and game-data drift fail closed",async()=>{
  const incomplete=await execute({
    rows:[
      farmer("My_Ranger1","ranger"),
      farmer("My_Priest","priest"),
    ],
  });
  assert.equal(incomplete.status.status,"BLOCKIERT");
  assert.ok(incomplete.status.blocker.includes("PR20_8_SEASHELL_COORDINATOR_ROSTER_INCOMPLETE"));

  const wrong=await execute({character:{name:"My_Ranger1",ctype:"ranger"}});
  assert.equal(wrong.status.status,"BLOCKIERT");
  assert.ok(wrong.status.blocker.includes("PR20_8_SEASHELL_COORDINATOR_MERCHANT_CONTEXT_REQUIRED"));

  const server=await execute({root:{server_identifier:"II"}});
  assert.equal(server.status.status,"BLOCKIERT");
  assert.ok(server.status.blocker.includes("PR20_8_SEASHELL_COORDINATOR_SERVER_DRIFT"));

  const data=await execute({
    G:{items:{seashell:{g:800,e:20,quest:true}},monsters:{croc:{name:"Croc"}}},
  });
  assert.equal(data.status.status,"BLOCKIERT");
  assert.ok(data.status.blocker.includes("PR20_8_SEASHELL_COORDINATOR_GAME_DATA_DRIFT"));
});

test("coordinator facade preserves autonomous observational bridge contract",async()=>{
  const {status,box}=await execute();
  assert.equal(status.status,"BESTANDEN");
  const ops=box.AIO_V3.operations;
  assert.equal(typeof ops.status,"function");
  assert.equal(typeof ops.hostHeartbeat,"function");
  assert.equal(typeof ops.reconciliationStatus,"function");
  assert.equal(typeof ops.peekTelemetry,"function");
  const bridge=ops.status();
  assert.equal(bridge.mode,"V5_AUTONOMOUS_TEST");
  assert.equal(
    bridge.v5AutonomousTest.testId,
    "pr20-8-seashell-farm-shadow-coordinator-readonly",
  );
  assert.equal(bridge.v5AutonomousTest.version,"1.0.0");
  assert.equal(bridge.v5AutonomousTest.terminal,true);
  assert.equal(ops.reconciliationStatus().sameIntentRetry,false);
  assert.deepEqual(Array.from(ops.peekTelemetry()),[]);
});

test("coordinator source contains no farmer lifecycle, gameplay or raw mutation path",()=>{
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
  assert.ok(source.includes("gameplayWrites:0"));
  assert.ok(source.includes("publicFunctionCalls:0"));
  assert.ok(source.includes("rawWriteCalls:0"));
  assert.ok(source.includes("farmerWorkersInstalled:0"));
  assert.ok(source.includes("normalRuntimeAllowed:false"));
});

test("coordinator contract and current roadmap remain undeployed and zero-authority",()=>{
  assert.equal(coordinatorContract.status,"COORDINATOR_PREPARED_READ_ONLY");
  assert.equal(
    coordinatorContract.coordinator.testId,
    "pr20-8-seashell-farm-shadow-coordinator-readonly",
  );
  assert.equal(coordinatorContract.coordinator.controllerVersion,"1.0.0");
  assert.equal(
    coordinatorContract.coordinator.expectedGlobal,
    "V5PR208SeashellFarmShadowCoordinatorReadonly",
  );
  assert.equal(coordinatorContract.coordinator.coordinatorCharacter,"My_Merchant");
  assert.equal(coordinatorContract.coordinator.packagePinDeferredUntilManifestCutover,true);
  assert.equal(coordinatorContract.noWriteBoundary.movementAuthority,false);
  assert.equal(coordinatorContract.noWriteBoundary.combatAuthority,false);
  assert.equal(coordinatorContract.noWriteBoundary.skillAuthority,false);
  assert.equal(coordinatorContract.noWriteBoundary.lootAuthority,false);
  assert.equal(coordinatorContract.noWriteBoundary.farmAuthority,false);
  assert.equal(coordinatorContract.noWriteBoundary.handoffAuthority,false);
  assert.equal(coordinatorContract.noWriteBoundary.exchangeAuthority,false);
  assert.equal(coordinatorContract.noWriteBoundary.startCharacterAllowed,false);
  assert.equal(coordinatorContract.noWriteBoundary.commandCharacterAllowed,false);
  assert.equal(coordinatorContract.noWriteBoundary.workerInstallAllowed,false);
  assert.equal(coordinatorContract.deployment.autonomousManifestChanged,false);
  assert.equal(coordinatorContract.deployment.manifestCutoverPrepared,false);
  assert.equal(coordinatorContract.deployment.deployed,false);
  assert.equal(coordinatorContract.nextAction,"PREPARE_SEASHELL_FARM_SHADOW_COORDINATOR_MANIFEST_CUTOVER");

  assert.equal(
    roadmap.pr20_8.status,
    "EXCHANGE_ANNIVERSARYGIFT_LIVE_5M_MANIFEST_CUTOVER_PREPARED",
  );
  assert.equal(
    roadmap.pr20_8.nextAction,
    "DEPLOY_AND_OBSERVE_ANNIVERSARYGIFT_EXCHANGE_LIVE_5M",
  );
  const shadow=roadmap.pr20_8.exchangeCandidateAcquisition.seashellFarmShadow;
  assert.equal(shadow.coordinatorPrepared,true);
  assert.equal(shadow.manifestCutoverPrepared,false);
  assert.equal(shadow.deployed,false);
  assert.equal(shadow.liveEvidenceObserved,false);
});

test("autonomous manifest is cut over to the anniversarygift Exchange service mount",()=>{
  assert.equal(manifest.testId,"pr20-8-exchange-anniversarygift-productive-one-write-live");
  assert.equal(manifest.controllerVersion,"1.0.0");
  assert.equal(manifest.sourceCommit,"5c43c182e2cd2b9ef4361ce1699af00748ad0d95");
  assert.equal(
    manifest.packagePath,
    "v5/werkzeuge/pr20-8-exchange-anniversarygift-productive-one-write-live.js",
  );
  assert.equal(manifest.packageSha256,"eb7cc9760966ddf7026cdc200e373c8716c80126ce6b2651aba8fd4e0420ef74");
  assert.equal(manifest.expectedGlobal,"V5PR208ExchangeAnniversarygiftProductiveOneWriteLive");
  assert.equal(manifest.normalRuntimeAllowed,false);
});
