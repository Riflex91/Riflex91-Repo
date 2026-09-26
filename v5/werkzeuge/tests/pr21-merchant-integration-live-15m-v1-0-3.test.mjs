import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('werkzeuge/pr21-merchant-integration-live-15m-v1-0-3.js','utf8');
const authorization=JSON.parse(fs.readFileSync('roadmap/pr21-merchant-live-execution-authorization-v4.json','utf8'));

function buildNative(clockRef,counters){
  const runtime={
    timer:null,
    startedAt:null,
    lastHeartbeat:clockRef.value,
    lastSnapshot:{observedAt:clockRef.value,character:{name:'MerchantA',ctype:'merchant'}},
    status(){return {running:!!this.timer};},
    start(){
      counters.startCalls+=1;
      if(this.timer)return false;
      this.timer={};
      this.startedAt=clockRef.value;
      this.lastHeartbeat=clockRef.value;
      this.lastSnapshot={observedAt:clockRef.value,character:{name:'MerchantA',ctype:'merchant'}};
      return true;
    },
    stop(){
      counters.stopCalls+=1;
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
      captureErrors:0,
      telemetry:{dropped:0,queued:0},
      control:{allowElevated:false},
      health:{state:'HEALTHY',snapshotAgeMs:1000,heartbeatAgeMs:1000},
      reliability:{actionAuthority:false,rawGameplayActionAuthority:false}
    }),
    hostHeartbeat:()=>({type:'AIO_V3_HOST_HEARTBEAT',observedAt:clockRef.value}),
    peekTelemetry:()=>[]
  };
  const operations={
    status:nativeOperations.status,
    hostHeartbeat:nativeOperations.hostHeartbeat,
    reconciliationStatus:()=>({status:'TERMINAL_NO_MUTATION'}),
    peekTelemetry:nativeOperations.peekTelemetry
  };
  return {
    version:'3.0.0-alpha.20.147',
    __runtime:runtime,
    __operations:nativeOperations,
    operations,
    start:()=>runtime.start(),
    stop:()=>runtime.stop(),
    status:()=>runtime.status()
  };
}

function sandbox({preNative=false,bootstrapFails=false}={}){
  const clockRef={value:0};
  const counters={startCalls:0,stopCalls:0,evalCalls:0,autostartAtEval:null};
  class FakeDate extends Date {
    static now(){return clockRef.value;}
    constructor(value){super(value===undefined?clockRef.value:value);}
  }
  const legacyOperations={
    status:()=>({mode:'V5_AUTONOMOUS_TEST',v5AutonomousTest:{testId:'legacy-pr20'},telemetry:{dropped:0}}),
    hostHeartbeat:()=>({type:'legacy'}),
    reconciliationStatus:()=>({status:'TERMINAL_NO_MUTATION'}),
    peekTelemetry:()=>[]
  };
  const box={
    character:{name:'MerchantA',ctype:'merchant',id:'m1'},
    AIO_V3:preNative?null:{operations:legacyOperations},
    performance_trick:()=>true,
    Date:FakeDate,Promise,Object,Array,JSON,Number,String,Math,Set,console,
    setTimeout(fn,ms){
      clockRef.value+=Math.max(0,Number(ms)||0);
      const runtime=box.AIO_V3&&box.AIO_V3.__runtime;
      if(runtime&&runtime.timer){
        runtime.lastHeartbeat=clockRef.value;
        runtime.lastSnapshot={observedAt:clockRef.value,character:{name:'MerchantA',ctype:'merchant'}};
      }
      queueMicrotask(fn);
      return 1;
    },
    clearTimeout(){},
    queueMicrotask
  };
  if(preNative) box.AIO_V3=buildNative(clockRef,counters);
  box.eval=(code)=>{
    counters.evalCalls+=1;
    counters.autostartAtEval=box.AIO_V3_AUTOSTART;
    assert.match(String(code),/cloudflare-bootstrap-loader-v1/);
    if(bootstrapFails){
      box.AIO_V3_BOOTSTRAP={lastError:{reason:'TEST_BOOTSTRAP_FAIL'}};
      return null;
    }
    box.AIO_V3=buildNative(clockRef,counters);
    return null;
  };
  box.globalThis=box;
  box.parent=box;
  box.__counts=()=>({...counters});
  return box;
}

async function execute(box){
  vm.runInNewContext(source,box,{filename:'pr21-merchant-integration-live-15m-v1-0-3.js'});
  const api=box.V5PR21MerchantIntegrationLive15mV103;
  await api.start();
  return {api,status:api.status(),counts:box.__counts()};
}

test('v4 authorization binds verified native bootstrap and one-shot runtime start',()=>{
  assert.equal(authorization.status,'AUTHORIZED_ONE_SHOT_NATIVE_BOOTSTRAP_RUNTIME_START_AND_OBSERVER');
  assert.equal(authorization.scope.testId,'pr21-merchant-integration-live-15m-v1-0-3');
  assert.equal(authorization.scope.maximumUses,1);
  assert.equal(authorization.nativeBootstrap.bootstrapNativeV3,true);
  assert.equal(authorization.nativeBootstrap.bootstrapAutostartForcedOff,true);
  assert.equal(authorization.externalRuntime.maximumStartCalls,1);
  assert.equal(authorization.safety.normalRuntimeAllowedByObserver,false);
});

test('facade-only Merchant bootstraps native V3 with autostart off and completes clean 15m',async()=>{
  const {status,counts}=await execute(sandbox());
  assert.equal(status.status,'BESTANDEN');
  assert.equal(status.terminal,true);
  assert.equal(status.sampleCount,181);
  assert.equal(status.durationMs,900000);
  assert.equal(status.nativeBootstrapCalls,1);
  assert.equal(status.nativeBootstrapReady,true);
  assert.equal(status.nativeBootstrapVersion,'3.0.0-alpha.20.147');
  assert.equal(status.externalRuntimeStartCalls,1);
  assert.equal(status.externalRuntimeStopCalls,1);
  assert.equal(counts.evalCalls,1);
  assert.equal(counts.autostartAtEval,false);
  assert.equal(counts.startCalls,1);
  assert.equal(counts.stopCalls,1);
  assert.equal(status.gameplayWrites,0);
  assert.equal(status.rawWriteCalls,0);
});

test('already-native Merchant skips bootstrap and still uses one-shot runtime start',async()=>{
  const {status,counts}=await execute(sandbox({preNative:true}));
  assert.equal(status.status,'BESTANDEN');
  assert.equal(status.nativeBootstrapCalls,0);
  assert.equal(status.nativeBootstrapReady,true);
  assert.equal(counts.evalCalls,0);
  assert.equal(counts.startCalls,1);
  assert.equal(counts.stopCalls,1);
});

test('bootstrap failure remains fail-closed before runtime start',async()=>{
  const box=sandbox({bootstrapFails:true});
  vm.runInNewContext(source,box,{filename:'pr21-merchant-integration-live-15m-v1-0-3.js'});
  const api=box.V5PR21MerchantIntegrationLive15mV103;
  await assert.rejects(api.start(),/PR21_NATIVE_V3_BOOTSTRAP_TIMEOUT:TEST_BOOTSTRAP_FAIL/);
  await new Promise(resolve=>setImmediate(resolve));
  const status=api.status();
  const counts=box.__counts();
  assert.equal(status.status,'FEHLER');
  assert.equal(status.terminal,true);
  assert.equal(counts.evalCalls,1);
  assert.equal(counts.autostartAtEval,false);
  assert.equal(counts.startCalls,0);
  assert.equal(counts.stopCalls,0);
  assert.equal(status.gameplayWrites,0);
  assert.equal(status.rawWriteCalls,0);
});

test('v1.0.3 embeds the official bootstrap and keeps direct gameplay/raw-write surfaces closed',()=>{
  assert.ok(source.includes("const VERSION = '1.0.3'"));
  assert.ok(source.includes("const TEST_ID = 'pr21-merchant-integration-live-15m-v1-0-3'"));
  assert.ok(source.includes("const API_NAME = 'V5PR21MerchantIntegrationLive15mV103'"));
  assert.ok(source.includes("owner.AIO_V3_AUTOSTART = false"));
  assert.ok(source.includes('cloudflare-bootstrap-loader-v1'));
  assert.ok(source.includes("bootstrapNativeV3: true"));
  for(const marker of [
    'socket.emit(','.socket.emit(','api_call(','attack(','smart_move(',
    'use_skill(','loot(','respawn(','change_server(','craft(','exchange(',
    'upgrade(','compound(','buy(','sell(','send_item(','send_gold(',
    'start_character(','command_character('
  ]) assert.equal(source.includes(marker),false,marker);
});
