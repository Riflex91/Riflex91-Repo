import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('werkzeuge/pr21-merchant-integration-live-15m-v1-0-1.js','utf8');
const authorization=JSON.parse(fs.readFileSync('roadmap/pr21-merchant-live-execution-authorization-v2.json','utf8'));

function sandbox({nativeHealth='HEALTHY',nativeDropped=0,captureErrors=0,preRunning=false}={}){
  let clock=0;
  let startCalls=0;
  let stopCalls=0;
  class FakeDate extends Date {
    static now(){return clock;}
    constructor(value){super(value===undefined?clock:value);}
  }
  const runtime={
    timer:preRunning?{}:null,
    startedAt:preRunning?0:null,
    lastHeartbeat:0,
    lastSnapshot:{observedAt:0,character:{name:'MerchantA',ctype:'merchant'}},
    status(){return {running:!!this.timer};},
    start(){
      startCalls+=1;
      if(this.timer)return false;
      this.timer={};
      this.startedAt=clock;
      this.lastHeartbeat=clock;
      this.lastSnapshot={observedAt:clock,character:{name:'MerchantA',ctype:'merchant'}};
      return true;
    },
    stop(){
      stopCalls+=1;
      if(!this.timer)return false;
      this.timer=null;
      return true;
    },
    transactionEngine:{status:()=>({active:0,recovering:0})},
    bankExpansionTransactions:{status:()=>({active:0,recovering:0})},
    merchantSpaceRecoveryJournal:{status:()=>({active:0,recovering:0,states:{RECOVERING:0}})},
    controlledMerchantSpaceRecovery:{status:()=>({busy:false})},
    controlledBankConsolidation:{status:()=>({busy:false})},
    controlledMerchantService:{status:()=>({busy:false,activeOperation:null})},
    controlledPartyLifecycle:{status:()=>({busy:false,operation:null})},
    alpha20LiveGateStatus:()=>({running:false,phase:'IDLE'})
  };
  const nativeOperations={
    recovery:{status:()=>({enabled:false,degradedSince:null})},
    status:()=>({
      contractVersion:3,
      captureErrors,
      telemetry:{dropped:nativeDropped,queued:0},
      control:{allowElevated:false},
      health:{
        state:nativeHealth,
        snapshotAgeMs:1000,
        heartbeatAgeMs:1000
      },
      reliability:{
        actionAuthority:false,
        rawGameplayActionAuthority:false
      }
    }),
    hostHeartbeat:()=>({type:'AIO_V3_HOST_HEARTBEAT',observedAt:clock}),
    peekTelemetry:()=>[]
  };
  // Deliberately stale/legacy facade: PR21 must not use this for health.
  const operations={
    status:()=>({mode:'V5_AUTONOMOUS_TEST',telemetry:{dropped:0},v5AutonomousTest:{testId:'legacy-pr20'}}),
    hostHeartbeat:()=>({type:'legacy'}),
    reconciliationStatus:()=>({status:'TERMINAL_NO_MUTATION'}),
    peekTelemetry:()=>[]
  };
  const box={
    character:{name:'MerchantA',ctype:'merchant',id:'m1'},
    AIO_V3:{__runtime:runtime,__operations:nativeOperations,operations},
    performance_trick:()=>true,
    Date:FakeDate,Promise,Object,Array,JSON,Number,String,Math,Set,console,
    setTimeout(fn,ms){
      clock+=Math.max(0,Number(ms)||0);
      if(runtime.timer){
        runtime.lastHeartbeat=clock;
        runtime.lastSnapshot={observedAt:clock,character:{name:'MerchantA',ctype:'merchant'}};
      }
      queueMicrotask(fn);
      return 1;
    },
    clearTimeout(){},
    queueMicrotask
  };
  box.globalThis=box;
  box.parent=box;
  box.__counts=()=>({startCalls,stopCalls});
  return box;
}

async function execute(box){
  vm.runInNewContext(source,box,{filename:'pr21-merchant-integration-live-15m-v1-0-1.js'});
  const api=box.V5PR21MerchantIntegrationLive15mV101;
  await api.start();
  return {api,status:api.status(),counts:box.__counts()};
}

test('v2 authorization binds exact one-shot Merchant runtime start and native observation',()=>{
  assert.equal(authorization.status,'AUTHORIZED_ONE_SHOT_EXTERNAL_RUNTIME_START_AND_OBSERVER');
  assert.equal(authorization.checkpointId,'PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT');
  assert.equal(authorization.scope.testId,'pr21-merchant-integration-live-15m-v1-0-1');
  assert.equal(authorization.scope.maximumUses,1);
  assert.equal(authorization.externalRuntime.requiredAuthorityId,'runtime:merchant');
  assert.equal(authorization.externalRuntime.maximumStartCalls,1);
  assert.equal(authorization.externalRuntime.stopOnlyIfStartedByCheckpoint,true);
  assert.equal(authorization.observation.nativeOperationsSource,'AIO_V3.__operations');
  assert.equal(authorization.safety.observerGameplayWrites,0);
  assert.equal(authorization.safety.observerRawWriteCalls,0);
});

test('recovery runner starts stopped Merchant runtime once, observes native operations and stops after clean 15m',async()=>{
  const {status,counts}=await execute(sandbox());
  assert.equal(status.status,'BESTANDEN');
  assert.equal(status.terminal,true);
  assert.equal(status.sampleCount,181);
  assert.equal(status.durationMs,900000);
  assert.equal(status.evidence.status,'EVIDENCE_READY_TARGET_REACHED');
  assert.equal(status.evidence.activeAuthorityIds[0],'runtime:merchant');
  assert.equal(status.observationSource,'AIO_V3.__operations');
  assert.equal(status.externalRuntimeStartCalls,1);
  assert.equal(status.externalRuntimeStopCalls,1);
  assert.equal(status.runtimeStartedByCheckpoint,true);
  assert.equal(status.runtimeWasRunningBeforeCheckpoint,false);
  assert.deepEqual(counts,{startCalls:1,stopCalls:1});
  assert.equal(status.gameplayWrites,0);
  assert.equal(status.rawWriteCalls,0);
  assert.equal(status.sameIntentRetry,false);
});

test('pre-running Merchant runtime is observed without restart and is not stopped by checkpoint',async()=>{
  const {status,counts}=await execute(sandbox({preRunning:true}));
  assert.equal(status.status,'BESTANDEN');
  assert.equal(status.runtimeWasRunningBeforeCheckpoint,true);
  assert.equal(status.runtimeStartedByCheckpoint,false);
  assert.equal(status.externalRuntimeStartCalls,0);
  assert.equal(status.externalRuntimeStopCalls,0);
  assert.deepEqual(counts,{startCalls:0,stopCalls:0});
});

test('native unhealthy state fails closed even when legacy facade looks harmless',async()=>{
  const box=sandbox({nativeHealth:'DEGRADED'});
  vm.runInNewContext(source,box,{filename:'pr21-merchant-integration-live-15m-v1-0-1.js'});
  const api=box.V5PR21MerchantIntegrationLive15mV101;
  await assert.rejects(
    api.start(),
    /PR21_MERCHANT_RUNTIME_READINESS_TIMEOUT:RUNNING:DEGRADED:CURRENT/,
  );
  await new Promise(resolve=>setImmediate(resolve));
  const status=api.status();
  const counts=box.__counts();
  assert.equal(status.status,'FEHLER');
  assert.equal(status.terminal,true);
  assert.ok(status.blocker.some(x=>String(x).includes('PR21_MERCHANT_RUNTIME_READINESS_TIMEOUT')));
  assert.equal(counts.startCalls,1);
  assert.equal(counts.stopCalls,1);
  assert.equal(status.gameplayWrites,0);
  assert.equal(status.rawWriteCalls,0);
});

test('runtime start is one-shot and package contains no direct gameplay/raw-write surface',()=>{
  assert.ok(source.includes("const VERSION = '1.0.1'"));
  assert.ok(source.includes("const TEST_ID = 'pr21-merchant-integration-live-15m-v1-0-1'"));
  assert.ok(source.includes("observationSource: 'AIO_V3.__operations'"));
  assert.ok(source.includes('startAuthorizedExternalRuntime(binding)'));
  assert.ok(source.includes('if (runPromise === null) runPromise = run()'));
  for(const marker of [
    'socket.emit(','.socket.emit(','api_call(','attack(','smart_move(',
    'use_skill(','loot(','respawn(','change_server(','craft(','exchange(',
    'upgrade(','compound(','buy(','sell(','send_item(','send_gold(',
    'start_character(','command_character('
  ]) assert.equal(source.includes(marker),false,marker);
});
