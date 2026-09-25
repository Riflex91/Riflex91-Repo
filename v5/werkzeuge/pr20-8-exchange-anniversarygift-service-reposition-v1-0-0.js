(() => {
  "use strict";

  const TEST_ID = "pr20-8-exchange-anniversarygift-service-reposition";
  const VERSION = "1.0.0";
  const API_NAME = "V5PR208ExchangeAnniversarygiftServiceReposition";
  const EXPECTED_CHARACTER = "My_Merchant";
  const EXPECTED_CLASS = "merchant";
  const EXPECTED_SERVER_REGION = "EU";
  const EXPECTED_SERVER_IDENTIFIER = "I";

  const OFFICIAL_SOURCE_REPOSITORY = "kaansoral/adventureland_mongodb";
  const OFFICIAL_SOURCE_COMMIT = "90052162eb3ebda36c893e1eb4af643913c8f984";
  const RUNNER_FUNCTIONS_BLOB = "8b40ac9931a48995cd179fa4cb6b3057df677b02";
  const MAPS_BLOB = "78350dac1a18c4eb0e7c6f545ebf08bb3d6729e4";

  const SMART_MOVE_TARGET = "exchange";
  const SMART_MOVE_RESOLVED_TARGET = Object.freeze({map:"main",x:-26,y:-432});
  const EXCHANGE_NPC = Object.freeze({map:"main",x:-25,y:-478});
  const SOURCE_PINNED_SELL_DISTANCE = 400;
  const CONSERVATIVE_SERVICE_DISTANCE = 300;
  const POLL_MS = 250;
  const MOVE_TIMEOUT_MS = 120000;

  let state = {
    schemaVersion:1,
    testId:TEST_ID,
    version:VERSION,
    phase:"PR20_8_EXCHANGE_ANNIVERSARYGIFT_SERVICE_REPOSITION",
    status:"BOOT",
    terminal:false,
    blocker:[],
    startedAtMs:Date.now(),
    updatedAtMs:Date.now(),
    recipient:null,
    sourceProof:{
      repository:OFFICIAL_SOURCE_REPOSITORY,
      commit:OFFICIAL_SOURCE_COMMIT,
      runnerFunctionsBlob:RUNNER_FUNCTIONS_BLOB,
      mapsBlob:MAPS_BLOB,
      smartMoveTarget:SMART_MOVE_TARGET,
      smartMoveResolvedTarget:{...SMART_MOVE_RESOLVED_TARGET},
      exchangeNpc:{...EXCHANGE_NPC},
      sourcePinnedSellDistance:SOURCE_PINNED_SELL_DISTANCE,
      conservativeServiceDistance:CONSERVATIVE_SERVICE_DISTANCE
    },
    before:null,
    after:null,
    movementIssued:false,
    movementCompleted:false,
    movementError:null,
    gameplayWrites:0,
    publicFunctionCalls:0,
    rawWriteCalls:0,
    sameIntentRetry:false,
    exchangeAuthority:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
    normalExchangeWriteRatification:false,
    normalRuntimeAllowed:false,
    nextAction:null
  };

  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const text=(v,max=192)=>String(v==null?"":v).trim().slice(0,max);

  function roots(){
    const out=[];
    try{out.push(globalThis)}catch{}
    try{
      if(globalThis.parent&&globalThis.parent!==globalThis&&!out.includes(globalThis.parent)){
        out.push(globalThis.parent);
      }
    }catch{}
    return out;
  }

  function root(){
    for(const r of roots()){
      try{
        if(r?.character&&Array.isArray(r.character.items)&&r.G?.items) return r;
      }catch{}
    }
    throw new Error("PR20_8_EXCHANGE_SERVICE_REPOSITION_SPIELKONTEXT_FEHLT");
  }

  function serverBinding(r){
    let p=null;
    try{if(r.parent&&r.parent!==r)p=r.parent}catch{}
    return {
      region:[r.server_region,r.server?.region,p?.server_region,p?.server?.region]
        .map(v=>text(v,32)).find(Boolean)||"",
      identifier:[r.server_identifier,r.server?.id,p?.server_identifier,p?.server?.id]
        .map(v=>text(v,32)).find(Boolean)||""
    };
  }

  function runtimeConflict(r){
    try{
      const v3=r.AIO_V3?.__runtime;
      const s=v3&&typeof v3.status==="function"?v3.status():null;
      if(v3&&(v3.timer||s?.running===true)) return "AIO_V3_RUNTIME_ACTIVE";
    }catch{return "AIO_V3_RUNTIME_UNREADABLE"}
    try{
      const v4=r.AIO_V4||r.V4Runtime;
      const s=v4&&typeof v4.status==="function"?v4.status():null;
      if(s?.running===true||s?.aktivFreigegeben===true) return "V4_RUNTIME_ACTIVE";
    }catch{return "V4_RUNTIME_UNREADABLE"}
    return null;
  }

  function hostileAggro(r){
    let hostile=0;
    for(const entity of Object.values(r.entities||{})){
      if(entity
        && entity.type==="monster"
        && !entity.dead
        && !entity.rip
        && text(entity.target,192)===EXPECTED_CHARACTER){
        hostile+=1;
      }
    }
    return hostile;
  }

  async function ensurePerformanceTrick(){
    let available=false;
    let called=false;
    let lastError=null;
    for(const candidate of roots()){
      try{
        if(typeof candidate?.performance_trick!=="function") continue;
        available=true;
        candidate.performance_trick();
        called=true;
        break;
      }catch(error){
        lastError=text(error?.message||error,160);
      }
    }
    if(called) await sleep(350);
    let audioFound=false;
    let playing=false;
    let cplaying=false;
    for(const candidate of roots()){
      try{
        const empty=candidate?.sounds?.empty;
        if(!empty) continue;
        audioFound=true;
        if(empty.cplaying===true) cplaying=true;
        if(typeof empty.playing==="function"&&empty.playing()===true) playing=true;
        else if(empty.playing===true) playing=true;
      }catch{}
    }
    return {
      available,called,audioFound,playing,cplaying,
      active:available&&called&&audioFound&&playing,
      verification:"HOWLER_PLAYING_TRUE",
      error:lastError
    };
  }

  function snapshot(r){
    const c=r.character;
    const map=text(c.map,96);
    const x=Number(c.real_x??c.x);
    const y=Number(c.real_y??c.y);
    const distanceToExchangeNpc=map===EXCHANGE_NPC.map&&Number.isFinite(x)&&Number.isFinite(y)
      ? Math.hypot(x-EXCHANGE_NPC.x,y-EXCHANGE_NPC.y)
      : null;
    const distanceToSmartMoveTarget=map===SMART_MOVE_RESOLVED_TARGET.map&&Number.isFinite(x)&&Number.isFinite(y)
      ? Math.hypot(x-SMART_MOVE_RESOLVED_TARGET.x,y-SMART_MOVE_RESOLVED_TARGET.y)
      : null;
    return {
      observedAtMs:Date.now(),
      map,
      x:Number.isFinite(x)?x:null,
      y:Number.isFinite(y)?y:null,
      computer:c.computer===true,
      moving:c.moving===true,
      qKeys:c.q&&typeof c.q==="object"?Object.keys(c.q).sort():[],
      esize:Number.isFinite(Number(c.esize))?Number(c.esize):null,
      distanceToExchangeNpc,
      distanceToSmartMoveTarget,
      serviceReachable:c.computer===true
        || (map===EXCHANGE_NPC.map
          && Number.isFinite(distanceToExchangeNpc)
          && distanceToExchangeNpc<=CONSERVATIVE_SERVICE_DISTANCE)
    };
  }

  function installTelemetry(owner){
    if(!owner) return;
    owner.AIO_V3=owner.AIO_V3||{};
    const existing=owner.AIO_V3.operations&&typeof owner.AIO_V3.operations==="object"
      ? owner.AIO_V3.operations:{};
    owner.AIO_V3.operations={
      ...existing,
      status:()=>{
        let base={};
        try{base=typeof existing.status==="function"?existing.status()||{}:{}}catch{}
        return {...base,v5AutonomousTest:state};
      },
      telemetry:()=>[],
      peekTelemetry:()=>[]
    };
  }

  function publish(){
    state.updatedAtMs=Date.now();
    for(const owner of roots()){
      try{installTelemetry(owner)}catch{}
    }
  }

  function finish(status,blocker,patch={}){
    state={
      ...state,
      ...patch,
      status,
      terminal:true,
      blocker:[...new Set(blocker||[])],
      updatedAtMs:Date.now(),
      exchangeAuthority:false,
      gameplayAuthority:false,
      rawWriteAuthority:false,
      normalExchangeWriteRatification:false,
      normalRuntimeAllowed:false
    };
    publish();
    return state;
  }

  async function run(){
    try{
      publish();
      const r=root();
      const c=r.character;
      const server=serverBinding(r);
      const recipient={
        characterName:text(c.name,192),
        sessionId:text(c.id,192),
        ctype:text(c.ctype||c.type,32).toLowerCase(),
        serverRegion:server.region,
        serverIdentifier:server.identifier
      };
      state={...state,recipient}; publish();

      if(recipient.characterName!==EXPECTED_CHARACTER){
        return finish("BLOCKIERT",["PR20_8_EXCHANGE_SERVICE_REPOSITION_EXAKTER_MERCHANT_ERFORDERLICH"]);
      }
      if(recipient.sessionId!==EXPECTED_CHARACTER){
        return finish("BLOCKIERT",["PR20_8_EXCHANGE_SERVICE_REPOSITION_SESSION_DRIFT"]);
      }
      if(recipient.ctype!==EXPECTED_CLASS){
        return finish("BLOCKIERT",["PR20_8_EXCHANGE_SERVICE_REPOSITION_MERCHANT_KLASSE_ERFORDERLICH"]);
      }
      if(server.region!==EXPECTED_SERVER_REGION||server.identifier!==EXPECTED_SERVER_IDENTIFIER){
        return finish("BLOCKIERT",["PR20_8_EXCHANGE_SERVICE_REPOSITION_SERVER_BINDUNG_DRIFT"]);
      }
      if(c.rip===true||c.dead===true){
        return finish("BLOCKIERT",["PR20_8_EXCHANGE_SERVICE_REPOSITION_CHARACTER_TOT"]);
      }
      if(c.moving===true){
        return finish("BLOCKIERT",["PR20_8_EXCHANGE_SERVICE_REPOSITION_CHARACTER_BEWEGT_SICH"]);
      }
      if(c.target!==null&&c.target!==undefined&&text(c.target,192)){
        return finish("BLOCKIERT",["PR20_8_EXCHANGE_SERVICE_REPOSITION_CHARACTER_HAT_ZIEL"]);
      }
      if(c.q&&typeof c.q==="object"&&Object.keys(c.q).length){
        return finish("BLOCKIERT",["PR20_8_EXCHANGE_SERVICE_REPOSITION_Q_NICHT_FREI"]);
      }
      const conflict=runtimeConflict(r);
      if(conflict){
        return finish("BLOCKIERT",["PR20_8_EXCHANGE_SERVICE_REPOSITION_ALTERNATIVE_RUNTIME_AKTIV:"+conflict]);
      }
      if(hostileAggro(r)!==0){
        return finish("BLOCKIERT",["PR20_8_EXCHANGE_SERVICE_REPOSITION_CHARACTER_UNTER_ANGRIFF"]);
      }

      const performance=await ensurePerformanceTrick();
      if(!performance.active){
        return finish("BLOCKIERT",["PR20_8_EXCHANGE_SERVICE_REPOSITION_PERFORMANCE_TRICK_BLOCKED"],{performanceTrick:performance});
      }
      state={...state,performanceTrick:performance}; publish();

      const before=snapshot(r);
      state={...state,before}; publish();
      if(before.serviceReachable){
        return finish("BESTANDEN",[],{
          after:before,
          movementIssued:false,
          movementCompleted:true,
          nextAction:"RESTORE_ANNIVERSARYGIFT_PRODUCTIVE_ONE_WRITE_V1_0_1"
        });
      }

      let smartMove=null;
      for(const owner of roots()){
        try{
          if(typeof owner?.smart_move==="function"){
            smartMove=owner.smart_move.bind(owner);
            break;
          }
        }catch{}
      }
      if(!smartMove){
        return finish("BLOCKIERT",["PR20_8_EXCHANGE_SERVICE_REPOSITION_SMART_MOVE_FEHLT"],{
          nextAction:"REMAIN_BLOCKED_NO_MOVEMENT_CALL"
        });
      }

      state={
        ...state,
        movementIssued:true,
        gameplayWrites:1,
        publicFunctionCalls:1
      };
      publish();

      let movementError=null;
      let movementResolved=false;
      try{
        const result=smartMove(SMART_MOVE_TARGET);
        if(result&&typeof result.then==="function"){
          result.then(
            ()=>{movementResolved=true},
            error=>{movementError=text(error?.message||error,500)||"MOVE_REJECTED"}
          );
        }else{
          movementResolved=true;
        }
      }catch(error){
        movementError=text(error?.message||error,500)||"MOVE_CALL_FAILED";
      }

      const started=Date.now();
      let last=before;
      while(Date.now()-started<=MOVE_TIMEOUT_MS){
        last=snapshot(r);
        state={...state,after:last,movementError}; publish();

        if(last.serviceReachable && !last.moving){
          return finish("BESTANDEN",[],{
            after:last,
            movementCompleted:true,
            movementPromiseResolved:movementResolved,
            nextAction:"RESTORE_ANNIVERSARYGIFT_PRODUCTIVE_ONE_WRITE_V1_0_1"
          });
        }
        if(movementError){
          return finish("FEHLER",["PR20_8_EXCHANGE_SERVICE_REPOSITION_MOVE_FEHLER_NO_RETRY"],{
            after:last,
            movementError,
            movementPromiseResolved:movementResolved,
            nextAction:"RECONCILE_MOVEMENT_OUTCOME_NO_RETRY"
          });
        }
        await sleep(POLL_MS);
      }

      return finish("BLOCKIERT",["PR20_8_EXCHANGE_SERVICE_REPOSITION_MOVE_TIMEOUT_NO_RETRY"],{
        after:last,
        movementError,
        movementPromiseResolved:movementResolved,
        nextAction:"RECONCILE_MOVEMENT_OUTCOME_NO_RETRY"
      });
    }catch(error){
      return finish("FEHLER",[
        text(error?.message||error,500)||"PR20_8_EXCHANGE_SERVICE_REPOSITION_UNBEKANNTER_FEHLER"
      ],{
        nextAction:"REMAIN_BLOCKED_NO_RETRY"
      });
    }
  }

  let runPromise=null;
  function start(){
    if(runPromise===null) runPromise=run();
    return runPromise;
  }

  publish();
  const api=Object.freeze({
    testId:TEST_ID,
    version:VERSION,
    status:()=>state,
    start
  });
  globalThis[API_NAME]=api;
  try{
    const r=root();
    if(r!==globalThis) r[API_NAME]=api;
  }catch{}
  try{
    if(globalThis.parent&&globalThis.parent!==globalThis){
      globalThis.parent[API_NAME]=api;
    }
  }catch{}
  Promise.resolve().then(start).catch(()=>{});
})();
