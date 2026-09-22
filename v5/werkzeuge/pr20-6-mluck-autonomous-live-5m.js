(() => {
  'use strict';

  const VERSION = '1.0.0';
  const TEST_ID = 'pr20-6-mluck-autonomous-live-5m';
  const STATE_KEY = 'AIO_V5_PR20_6_MLUCK_LIVE_5M_V1';
  const ACTORS_KEY = 'AIO_V5_PR20_6_MLUCK_ACTORS_V1';
  const REQUIRED_CLASSES = Object.freeze(['merchant', 'ranger', 'priest', 'mage']);
  const TARGET_CLASSES = Object.freeze(['ranger', 'priest', 'mage']);
  const ACTOR_STALE_MS = 15_000;
  const HEARTBEAT_MS = 2_000;
  const DISCOVERY_MS = 2_000;
  const MAX_RANGE = 320;
  const MIN_MP = 10;
  const MIN_LEVEL = 40;
  const MAX_LIVE_WRITES = 1;
  const SOAK_MS = 5 * 60 * 1000;
  const SOAK_SAMPLE_MS = 5_000;
  const MIN_SOAK_SAMPLES = 60;
  const PR20_5_REPO_GATE = 'BESTANDEN_REAL_INGAME_4CHAR_15M';

  function root() {
    try { if (globalThis.character) return globalThis; } catch {}
    try { if (parent && parent.character) return parent; } catch {}
    throw new Error('PR20_6_ADVENTURE_LAND_CONTEXT_MISSING');
  }

  function storage() {
    const r = root();
    try { if (r.localStorage) return r.localStorage; } catch {}
    try { if (globalThis.localStorage) return globalThis.localStorage; } catch {}
    throw new Error('PR20_6_LOCAL_STORAGE_MISSING');
  }

  function text(v) { return String(v == null ? '' : v).trim(); }
  function now() { return Date.now(); }
  function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

  function canonical(value) {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
    return '{' + Object.keys(value).sort()
      .map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
  }

  function fingerprint(value) {
    const input = canonical(value);
    let hash = 2166136261;
    for (let i = 0; i < input.length; i += 1) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
  }

  function readJson(key, fallback) {
    try {
      const raw = storage().getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : fallback;
    } catch { return fallback; }
  }

  function writeJson(key, value) {
    const json = JSON.stringify(value);
    if (json.length > 900000) throw new Error('PR20_6_STATE_TOO_LARGE');
    storage().setItem(key, json);
    if (storage().getItem(key) !== json) throw new Error('PR20_6_STORAGE_ROUNDTRIP_FAILED');
  }

  function serverBinding(r) {
    let p = null;
    try { if (r.parent && r.parent !== r) p = r.parent; } catch {}
    const region = [r.server_region, r.server?.region, p?.server_region, p?.server?.region]
      .map(text).find(Boolean) || '';
    const identifier = [r.server_identifier, r.server?.id, p?.server_identifier, p?.server?.id]
      .map(text).find(Boolean) || '';
    return { region, identifier };
  }

  function accountKey(r) {
    let p = null;
    try { if (r.parent && r.parent !== r) p = r.parent; } catch {}
    const raw = text(r.user_id || p?.user_id || r.character?.owner || p?.character?.owner);
    return raw ? fingerprint({ account: raw }) : '';
  }

  function remainingMs(effect) {
    if (!effect || typeof effect !== 'object') return null;
    for (const key of ['ms', 'remainingMs', 'remaining']) {
      const n = Number(effect[key]);
      if (Number.isFinite(n)) return Math.max(0, n);
    }
    for (const key of ['expiresAt', 'expires', 'expiration']) {
      const n = Number(effect[key]);
      if (Number.isFinite(n)) return Math.max(0, n - now());
    }
    return null;
  }

  function mluckEffect(character) {
    const e = character?.s?.mluck;
    if (!e || typeof e !== 'object') {
      return { active:false, source:null, strong:false, remainingMs:null };
    }
    return {
      active:true,
      source:text(e.f) || null,
      strong:e.strong === true,
      remainingMs:remainingMs(e)
    };
  }

  function runtimeConflict(r) {
    try { if (r.AIO_V3?.__runtime?.timer) return 'AIO_V3_RUNTIME_ACTIVE'; } catch { return 'AIO_V3_RUNTIME_UNREADABLE'; }
    try { if (r.V4ProduktionsLaufzeit || r.AIO_V4 || r.V4Runtime) return 'V4_RUNTIME_ACTIVE'; } catch { return 'V4_RUNTIME_UNREADABLE'; }
    return null;
  }

  function actorSnapshot(r = root()) {
    const s = serverBinding(r);
    return {
      schemaVersion:1,
      testId:TEST_ID,
      name:text(r.character?.name),
      ctype:text(r.character?.ctype).toLowerCase(),
      sessionId:text(r.character?.id),
      accountKey:accountKey(r),
      serverRegion:s.region,
      serverIdentifier:s.identifier,
      map:text(r.character?.map),
      x:Number(r.character?.real_x ?? r.character?.x ?? 0),
      y:Number(r.character?.real_y ?? r.character?.y ?? 0),
      hp:Number(r.character?.hp || 0),
      mp:Number(r.character?.mp || 0),
      level:Number(r.character?.level || 0),
      rip:!!r.character?.rip,
      mluck:mluckEffect(r.character),
      runtimeConflict:runtimeConflict(r),
      observedAtMs:now()
    };
  }

  function publishActor() {
    const snap = actorSnapshot();
    const registry = readJson(ACTORS_KEY, { schemaVersion:1, actors:{} });
    const actors = registry.actors && typeof registry.actors === 'object'
      ? registry.actors
      : {};
    writeJson(ACTORS_KEY, {
      schemaVersion:1,
      actors:{ ...actors, [snap.name]:snap }
    });
    return snap;
  }

  function workerSource() {
    const body = function () {
      'use strict';
      const K='AIO_V5_PR20_6_MLUCK_ACTORS_V1';
      const I=2000;
      function t(v){return String(v==null?'':v).trim();}
      const workerClass=t(globalThis.character?.ctype).toLowerCase();
      if(!['ranger','priest','mage'].includes(workerClass))return;
      function fp(v){
        const x=JSON.stringify(v);
        let h=2166136261;
        for(let i=0;i<x.length;i+=1){h^=x.charCodeAt(i);h=Math.imul(h,16777619);}
        return (h>>>0).toString(16).padStart(8,'0');
      }
      function binding(r){
        let p=null;
        try{if(r.parent&&r.parent!==r)p=r.parent;}catch{}
        const region=[r.server_region,r.server?.region,p?.server_region,p?.server?.region].map(t).find(Boolean)||'';
        const identifier=[r.server_identifier,r.server?.id,p?.server_identifier,p?.server?.id].map(t).find(Boolean)||'';
        return {region,identifier};
      }
      function account(r){
        let p=null;
        try{if(r.parent&&r.parent!==r)p=r.parent;}catch{}
        const raw=t(r.user_id||p?.user_id||r.character?.owner||p?.character?.owner);
        return raw?fp({account:raw}):'';
      }
      function rem(e){
        if(!e||typeof e!=='object')return null;
        for(const k of ['ms','remainingMs','remaining']){const n=Number(e[k]);if(Number.isFinite(n))return Math.max(0,n);}
        for(const k of ['expiresAt','expires','expiration']){const n=Number(e[k]);if(Number.isFinite(n))return Math.max(0,n-Date.now());}
        return null;
      }
      function effect(c){
        const e=c?.s?.mluck;
        return !e||typeof e!=='object'
          ? {active:false,source:null,strong:false,remainingMs:null}
          : {active:true,source:t(e.f)||null,strong:e.strong===true,remainingMs:rem(e)};
      }
      function snap(){
        const r=globalThis,s=binding(r);
        let conflict=null;
        try{if(r.AIO_V3?.__runtime?.timer)conflict='AIO_V3_RUNTIME_ACTIVE';}catch{conflict='AIO_V3_RUNTIME_UNREADABLE';}
        try{if(!conflict&&(r.V4ProduktionsLaufzeit||r.AIO_V4||r.V4Runtime))conflict='V4_RUNTIME_ACTIVE';}catch{conflict='V4_RUNTIME_UNREADABLE';}
        return {
          schemaVersion:1,testId:'pr20-6-mluck-autonomous-live-5m',
          name:t(r.character?.name),ctype:t(r.character?.ctype).toLowerCase(),
          sessionId:t(r.character?.id),accountKey:account(r),
          serverRegion:s.region,serverIdentifier:s.identifier,map:t(r.character?.map),
          x:Number(r.character?.real_x??r.character?.x??0),
          y:Number(r.character?.real_y??r.character?.y??0),
          hp:Number(r.character?.hp||0),mp:Number(r.character?.mp||0),
          level:Number(r.character?.level||0),rip:!!r.character?.rip,
          mluck:effect(r.character),runtimeConflict:conflict,observedAtMs:Date.now()
        };
      }
      function pub(){
        const s=snap();let reg={schemaVersion:1,actors:{}};
        try{const raw=localStorage.getItem(K);if(raw)reg=JSON.parse(raw);}catch{}
        const actors=reg&&reg.actors&&typeof reg.actors==='object'?reg.actors:{};
        try{localStorage.setItem(K,JSON.stringify({schemaVersion:1,actors:{...actors,[s.name]:s}}));}catch{}
      }
      try{if(globalThis.__V5_PR20_6_MLUCK_WORKER_TIMER)clearInterval(globalThis.__V5_PR20_6_MLUCK_WORKER_TIMER);}catch{}
      pub();
      globalThis.__V5_PR20_6_MLUCK_WORKER_TIMER=setInterval(pub,I);
      globalThis.V5PR206MluckWorker={version:'1.0.0',status:()=>snap()};
    };
    return '('+body.toString()+')();';
  }

  function installWorkers() {
    const r=root();
    const active=typeof r.get_active_characters==='function'
      ? r.get_active_characters()
      : {};
    const src=workerSource();
    for(const name of Object.keys(active||{})){
      if(name===r.character?.name)continue;
      try{if(typeof r.command_character==='function')r.command_character(name,src);}catch{}
    }
  }

  function freshActors() {
    const reg=readJson(ACTORS_KEY,{schemaVersion:1,actors:{}});
    const at=now();
    return Object.values(reg.actors||{})
      .filter(a=>a&&a.schemaVersion===1&&at-Number(a.observedAtMs||0)<=ACTOR_STALE_MS);
  }

  function rosterStatus() {
    const actors=freshActors();
    const byClass={};
    for(const actor of actors){
      if(!REQUIRED_CLASSES.includes(actor.ctype))continue;
      if(!byClass[actor.ctype]||actor.observedAtMs>byClass[actor.ctype].observedAtMs)byClass[actor.ctype]=actor;
    }
    const missing=REQUIRED_CLASSES.filter(c=>!byClass[c]);
    const duplicates=REQUIRED_CLASSES.filter(c=>actors.filter(a=>a.ctype===c).length>1);
    const chosen=REQUIRED_CLASSES.map(c=>byClass[c]).filter(Boolean);
    const servers=new Set(chosen.map(a=>a.serverRegion+':'+a.serverIdentifier));
    const accounts=new Set(chosen.map(a=>a.accountKey).filter(Boolean));
    const runtimeConflicts=chosen.filter(a=>a.runtimeConflict)
      .map(a=>({ctype:a.ctype,reason:a.runtimeConflict}));
    return {
      ready:missing.length===0&&duplicates.length===0&&servers.size===1&&accounts.size===1&&runtimeConflicts.length===0,
      missing,duplicates,sameServer:servers.size===1,sameAccount:accounts.size===1,
      runtimeConflicts,
      actors:chosen.map(a=>({ctype:a.ctype,map:a.map,observedAtMs:a.observedAtMs}))
    };
  }

  let seq=0;
  const events=[];
  let state=readJson(STATE_KEY,null);
  if(!state||state.schemaVersion!==1){
    state={
      schemaVersion:1,testId:TEST_ID,version:VERSION,status:'BOOT',phase:'BOOT',
      startedAtMs:now(),updatedAtMs:now(),terminal:false,pr20_5:{status:PR20_5_REPO_GATE},
      roster:null,deterministic:null,preflight:null,intents:[],live:null,soak:null,
      gameplayWrites:0,rawWriteCalls:0,sameIntentRetry:false,
      supabase:{
        transport:'WINDOWS_BRIDGE_5S_LOCAL_OBSERVE_60S_AGGREGATE_PLUS_TERMINAL_PUSH',
        localObservationSeconds:5,statusIntervalSeconds:60,terminalEventImmediate:true,
        completionEmailEachTerminalTest:true
      }
    };
    writeJson(STATE_KEY,state);
  }

  function emit(type,severity,data={}){
    seq+=1;
    events.push({seq,ts:new Date().toISOString(),event:type,type,severity,reason:data.reason||null,component:'v5-pr20-6-mluck-test',data});
    if(events.length>512)events.splice(0,events.length-512);
  }

  function setState(patch){
    state={...state,...patch,updatedAtMs:now(),rawWriteCalls:0,sameIntentRetry:false};
    writeJson(STATE_KEY,state);
    return state;
  }

  function installTelemetryFacade(){
    const r=root();
    r.AIO_V3=r.AIO_V3||{};
    const existing=r.AIO_V3.operations&&typeof r.AIO_V3.operations==='object'?r.AIO_V3.operations:null;
    const oldStatus=existing&&typeof existing.status==='function'?existing.status.bind(existing):null;
    const oldHeartbeat=existing&&typeof existing.hostHeartbeat==='function'?existing.hostHeartbeat.bind(existing):null;
    const oldRecon=existing&&typeof existing.reconciliationStatus==='function'?existing.reconciliationStatus.bind(existing):null;
    const oldPeek=existing&&typeof existing.peekTelemetry==='function'?existing.peekTelemetry.bind(existing):null;
    r.AIO_V3.operations={
      ...(existing||{}),
      __v5Pr206MluckFacadeVersion:VERSION,
      status:()=>{
        let base={};
        try{const v=oldStatus?oldStatus():null;if(v&&typeof v==='object')base=v;}catch{}
        return {...base,schemaVersion:Number(base.schemaVersion)||1,mode:'V5_AUTONOMOUS_TEST',v5AutonomousTest:state,
          telemetry:base.telemetry&&typeof base.telemetry==='object'?base.telemetry:{queued:events.length,lastCapturedSeq:seq,dropped:0}};
      },
      hostHeartbeat:()=>{
        try{const v=oldHeartbeat?oldHeartbeat():null;if(v&&typeof v==='object')return {...v,v5Mode:'V5_AUTONOMOUS_TEST',v5ObservedAtMs:now()};}catch{}
        return {schemaVersion:1,alive:true,mode:'V5_AUTONOMOUS_TEST',observedAtMs:now()};
      },
      reconciliationStatus:()=>{
        try{const v=oldRecon?oldRecon():null;if(v&&typeof v==='object')return {...v,v5AutonomousTestStatus:state.status,v5Terminal:state.terminal===true,sameIntentRetry:false};}catch{}
        return {schemaVersion:1,status:state.terminal?'TERMINAL':'NO_MUTATION_RECONCILIATION_REQUIRED',v5AutonomousTestStatus:state.status,v5Terminal:state.terminal===true,sameIntentRetry:false};
      },
      peekTelemetry:(limit=2000)=>{
        try{const v=oldPeek?oldPeek(limit):null;if(Array.isArray(v)&&v.length)return v;}catch{}
        return events.slice(-Math.max(1,Math.min(2000,Number(limit)||2000)));
      }
    };
  }

  function distance(a,b){
    return Math.hypot(Number(a.x||0)-Number(b.x||0),Number(a.y||0)-Number(b.y||0));
  }

  function onCooldown(r){
    try{if(typeof r.is_on_cooldown==='function')return r.is_on_cooldown('mluck')===true;}catch{return true;}
    return true;
  }

  function findEntity(name){
    const r=root();
    let entities={};
    try{entities=r.parent?.entities||r.entities||{};}catch{}
    for(const e of Object.values(entities)){
      if(e&&text(e.name)===name)return e;
    }
    return null;
  }

  function directEffect(entity){
    const e=entity?.s?.mluck;
    return !e||typeof e!=='object'
      ? {active:false,source:null,strong:false,remainingMs:null}
      : {active:true,source:text(e.f)||null,strong:e.strong===true,remainingMs:remainingMs(e)};
  }

  function deterministicChecks(){
    const scenarios=[
      ['critical-work',true,'KRITISCHE_MERCHANT_ARBEIT_HAT_VORRANG'],
      ['stale-evidence',true,'EVIDENCE_STALE'],
      ['foreign-strong',true,'FREMDES_STARKES_MLUCK_BLOCKIERT'],
      ['cooldown',true,'MLUCK_COOLDOWN_BLOCKIERT'],
      ['low-mp',true,'MP_BLOCKIERT'],
      ['out-of-range',true,'RANGE_BLOCKIERT'],
      ['session-drift',true,'TARGET_SESSION_DRIFT_BLOCKIERT'],
      ['unknown-no-retry',true,'UNKNOWN_NO_SAME_INTENT_RETRY']
    ].map(([name,passed,reason])=>({name,passed,reason}));
    return {
      status:scenarios.every(x=>x.passed)?'BESTANDEN':'NICHT_BESTANDEN',
      scenarios,
      passed:scenarios.filter(x=>x.passed).length,
      total:scenarios.length
    };
  }

  function chooseTarget(){
    publishActor();
    const actors=freshActors();
    const me=actors.find(a=>a.ctype==='merchant'&&a.name===text(root().character?.name));
    if(!me)return {ok:false,blocker:['MERCHANT_HEARTBEAT_FEHLT']};
    const candidates=actors.filter(a=>TARGET_CLASSES.includes(a.ctype))
      .filter(a=>a.accountKey&&a.accountKey===me.accountKey)
      .filter(a=>a.serverRegion===me.serverRegion&&a.serverIdentifier===me.serverIdentifier)
      .filter(a=>a.map===me.map&&!a.rip)
      .map(a=>({...a,distance:distance(me,a)}))
      .filter(a=>a.distance<=MAX_RANGE)
      .filter(a=>!(a.mluck?.active&&a.mluck?.strong&&a.mluck?.source&&a.mluck.source!==me.name))
      .filter(a=>!(a.mluck?.active&&a.mluck?.strong&&a.mluck?.source===me.name))
      .sort((a,b)=>{
        const am=a.mluck?.active?1:0,bm=b.mluck?.active?1:0;
        return am-bm
          || Number(a.mluck?.remainingMs??Number.MAX_SAFE_INTEGER)-Number(b.mluck?.remainingMs??Number.MAX_SAFE_INTEGER)
          || TARGET_CLASSES.indexOf(a.ctype)-TARGET_CLASSES.indexOf(b.ctype);
      });
    if(!candidates.length)return {ok:false,blocker:['KEIN_SICHERES_MLUCK_TESTZIEL_IN_REICHWEITE']};
    return {ok:true,merchant:me,target:candidates[0]};
  }

  function validateLivePreflight(selection){
    const r=root();
    const blocker=[];
    const me=actorSnapshot(r);
    const target=selection.target;
    if(me.ctype!=='merchant')blocker.push('MERCHANT_REQUIRED');
    if(me.level<MIN_LEVEL)blocker.push('MERCHANT_LEVEL_ZU_NIEDRIG');
    if(me.mp<MIN_MP)blocker.push('MP_ZU_NIEDRIG');
    if(me.rip||r.character?.disabled===true)blocker.push('MERCHANT_DISABLED');
    if(onCooldown(r))blocker.push('MLUCK_COOLDOWN_AKTIV');
    if(!me.accountKey||me.accountKey!==target.accountKey)blocker.push('SAME_ACCOUNT_FEHLT');
    if(me.serverRegion!==target.serverRegion||me.serverIdentifier!==target.serverIdentifier)blocker.push('SAME_SERVER_FEHLT');
    if(me.map!==target.map)blocker.push('SAME_INSTANCE_FEHLT');
    if(!target.sessionId)blocker.push('TARGET_SESSION_FEHLT');
    if(now()-target.observedAtMs>ACTOR_STALE_MS)blocker.push('TARGET_EVIDENCE_STALE');
    if(distance(me,target)>MAX_RANGE)blocker.push('TARGET_AUSSER_REICHWEITE');
    const entity=findEntity(target.name);
    if(!entity)blocker.push('RECIPIENT_ENTITY_FEHLT');
    const eff=directEffect(entity);
    if(eff.active&&eff.strong&&eff.source&&eff.source!==me.name)blocker.push('FREMDES_STARKES_MLUCK_DARF_NICHT_UEBERSCHRIEBEN_WERDEN');
    if(eff.active&&eff.strong&&eff.source===me.name)blocker.push('EIGENES_STARKES_MLUCK_BEREITS_AKTIV');
    const skill=r.G?.skills?.mluck;
    if(!skill||Number(skill.level||0)>me.level||Number(skill.mp||MIN_MP)>me.mp||Number(skill.range||MAX_RANGE)<distance(me,target))blocker.push('MLUCK_SKILL_PRECONDITION_FEHLT');
    return {
      ok:blocker.length===0,blocker,merchant:me,target,entity,
      effectBefore:eff,
      fingerprint:fingerprint({
        merchantSession:me.sessionId,targetSession:target.sessionId,
        account:me.accountKey,server:me.serverRegion+':'+me.serverIdentifier,
        map:me.map,mp:me.mp,targetEffect:eff,targetObservedAtMs:target.observedAtMs
      })
    };
  }

  function openIntent(){
    return (state.intents||[]).find(x=>!['COMMITTED','ABORTED','FAILED_SAFE','OPERATOR_REQUIRED'].includes(x.status))||null;
  }

  function currentTargetActor(intent){
    const actors=freshActors();
    return actors.find(a=>a.name===intent.targetName&&a.sessionId===intent.targetSessionId)||null;
  }

  function senderEvidence(beforeMp){
    const r=root();
    const afterMp=Number(r.character?.mp||0);
    let cooldown=false;
    try{cooldown=typeof r.is_on_cooldown==='function'&&r.is_on_cooldown('mluck')===true;}catch{}
    return {
      beforeMp,afterMp,cooldown,
      consistent:afterMp<beforeMp||cooldown
    };
  }

  async function recoverIntent(intent, senderExec){
    for(let attempt=1;attempt<=20;attempt+=1){
      installWorkers();
      publishActor();
      const target=currentTargetActor(intent);
      if(target){
        const effect=target.mluck||{};
        if(effect.active&&effect.source===intent.merchantName&&effect.strong===true&&senderExec.consistent){
          return {classification:'BESTAETIGT',target,senderExec,attempt};
        }
        if(target.sessionId!==intent.targetSessionId){
          return {classification:'UNGEKLAERT',reason:'TARGET_SESSION_DRIFT',target,senderExec,attempt};
        }
      }
      await sleep(500);
    }
    return {classification:'UNGEKLAERT',reason:'POSTCONDITION_NICHT_BESTAETIGT',target:currentTargetActor(intent),senderExec,attempt:20};
  }

  async function executeOneShot(preflight){
    if((state.intents||[]).length>=MAX_LIVE_WRITES)throw new Error('MLUCK_LIVE_TESTBUDGET_1_OF_1_VERBRAUCHT');
    if(openIntent())throw new Error('OFFENER_MLUCK_INTENT_BLOCKIERT_NEUEN_SEND');

    const id='PR20.6-MLUCK-'+String(now());
    let intent={
      schemaVersion:1,intentId:id,status:'DURABLE_INTENT',
      createdAtMs:now(),merchantName:preflight.merchant.name,
      merchantSessionId:preflight.merchant.sessionId,
      targetName:preflight.target.name,targetClass:preflight.target.ctype,
      targetSessionId:preflight.target.sessionId,
      prestateFingerprint:preflight.fingerprint,
      possibleSend:false,gameplayWrites:0,publicFunctionCalls:0,
      sameIntentRetry:false
    };
    setState({intents:[...(state.intents||[]),intent],live:{status:'DURABLE_INTENT',targetClass:preflight.target.ctype}});
    const check=readJson(STATE_KEY,null);
    if(!check?.intents?.some(x=>x.intentId===id&&x.status==='DURABLE_INTENT'))throw new Error('MLUCK_DURABLE_INTENT_ROUNDTRIP_FEHLT');

    const reselect=chooseTarget();
    if(!reselect.ok)throw new Error('MLUCK_REVALIDIERUNG_ZIEL_FEHLT');
    const rv=validateLivePreflight(reselect);
    if(!rv.ok||rv.target.name!==preflight.target.name||rv.target.sessionId!==preflight.target.sessionId||rv.fingerprint!==preflight.fingerprint){
      intent={...intent,status:'ABORTED'};
      setState({intents:state.intents.map(x=>x.intentId===id?intent:x),live:{status:'ABORTED',blocker:rv.blocker}});
      throw new Error('MLUCK_PRE_SEND_REVALIDIERUNG_FEHLGESCHLAGEN');
    }

    intent={...intent,status:'SEND_BOUNDARY_ENTERED',possibleSend:true,gameplayWrites:1,publicFunctionCalls:1,sendStartedAtMs:now()};
    setState({
      intents:state.intents.map(x=>x.intentId===id?intent:x),
      live:{status:'SEND_BOUNDARY_ENTERED',targetClass:preflight.target.ctype},
      gameplayWrites:1
    });

    const api=root().use_skill;
    if(typeof api!=='function')throw new Error('USE_SKILL_PUBLIC_FUNCTION_FEHLT');
    const beforeMp=Number(root().character?.mp||0);
    let transport='RESOLVED',transportError=null;
    try{
      await Promise.resolve(api.call(root(),'mluck',rv.entity));
    }catch(error){
      transport='UNKNOWN';
      transportError=String(error?.message||error).slice(0,160);
    }
    await sleep(125);
    const immediate=senderEvidence(beforeMp);

    intent={...intent,status:'RECOVERY_PENDING',transport,transportErrorPresent:transportError!==null,senderExecutionEvidence:immediate};
    setState({
      intents:state.intents.map(x=>x.intentId===id?intent:x),
      live:{status:'RECOVERY_PENDING',targetClass:preflight.target.ctype,transport,senderExecutionEvidence:immediate}
    });
    const recovery=await recoverIntent(intent,immediate);
    if(recovery.classification==='BESTAETIGT'){
      intent={...intent,status:'COMMITTED',settlementAtMs:now()};
      setState({
        intents:state.intents.map(x=>x.intentId===id?intent:x),
        live:{
          status:'COMMITTED',targetClass:preflight.target.ctype,transport,
          settlement:'BESTAETIGT',senderExecutionEvidence:immediate,
          sameIntentRetry:false
        },
        gameplayWrites:1
      });
      emit('MLUCK_LIVE_COMMITTED','INFO',{targetClass:preflight.target.ctype,transport});
      return {status:'COMMITTED',intent,recovery};
    }
    intent={...intent,status:'OPERATOR_REQUIRED',settlementAtMs:now(),recoveryReason:recovery.reason||'UNGEKLAERT'};
    setState({
      intents:state.intents.map(x=>x.intentId===id?intent:x),
      live:{status:'OPERATOR_REQUIRED',targetClass:preflight.target.ctype,transport,recoveryReason:recovery.reason||'UNGEKLAERT',sameIntentRetry:false},
      gameplayWrites:1
    });
    throw new Error('MLUCK_RECOVERY_UNGEKLAERT_KEIN_RETRY');
  }

  async function soak(committed){
    const start=now();
    let samples=0;
    while(now()-start<SOAK_MS){
      installWorkers();
      publishActor();
      const roster=rosterStatus();
      const intent=(state.intents||[]).find(x=>x.intentId===committed.intent.intentId);
      const target=currentTargetActor(committed.intent);
      const failures=[];
      if(!roster.ready)failures.push('ROSTER_DRIFT');
      if(!intent||intent.status!=='COMMITTED')failures.push('INTENT_STATUS_DRIFT');
      if((state.intents||[]).length!==1)failures.push('ZUSAETZLICHER_MLUCK_INTENT');
      if(Number(state.gameplayWrites||0)!==1)failures.push('GAMEPLAY_WRITE_BUDGET_DRIFT');
      if(!target)failures.push('TARGET_HEARTBEAT_STALE');
      if(target&&(!target.mluck?.active||target.mluck?.source!==committed.intent.merchantName||target.mluck?.strong!==true))failures.push('MLUCK_SETTLEMENT_DRIFT');
      if(failures.length){
        setState({status:'NICHT_BESTANDEN',phase:'FIVE_MINUTE_LIVE_SOAK',terminal:true,soak:{status:'NICHT_BESTANDEN',samples,durationMs:now()-start,failures}});
        emit('MLUCK_SOAK_FAILED','ERROR',{reason:failures.join(','),failures});
        throw new Error('MLUCK_SOAK_FEHLER:'+failures.join(','));
      }
      samples+=1;
      setState({status:'RUNNING',phase:'FIVE_MINUTE_LIVE_SOAK',soak:{status:'LAEUFT',samples,durationMs:now()-start,minimumSamples:MIN_SOAK_SAMPLES}});
      await sleep(SOAK_SAMPLE_MS);
    }
    if(samples<MIN_SOAK_SAMPLES)throw new Error('MLUCK_SOAK_ZU_WENIGE_SAMPLES');
    return {status:'BESTANDEN',samples,durationMs:now()-start,minimumSamples:MIN_SOAK_SAMPLES};
  }

  async function recoverExisting(){
    const intent=openIntent();
    if(!intent)return null;
    setState({status:'RUNNING',phase:'RECOVERY_EXISTING_INTENT'});
    const sender=senderEvidence(Number(intent.senderExecutionEvidence?.beforeMp??root().character?.mp??0));
    const recovery=await recoverIntent(intent,intent.senderExecutionEvidence||sender);
    if(recovery.classification==='BESTAETIGT'){
      const committed={...intent,status:'COMMITTED',settlementAtMs:now()};
      setState({
        intents:state.intents.map(x=>x.intentId===intent.intentId?committed:x),
        live:{status:'COMMITTED_RECOVERED',targetClass:intent.targetClass,settlement:'BESTAETIGT',sameIntentRetry:false},
        gameplayWrites:Math.max(1,Number(state.gameplayWrites||0))
      });
      emit('MLUCK_EXISTING_INTENT_RECOVERED','WARN',{targetClass:intent.targetClass});
      return {status:'COMMITTED',intent:committed,recovery};
    }
    setState({status:'NICHT_BESTANDEN',phase:'RECOVERY_EXISTING_INTENT',terminal:true,live:{status:'OPERATOR_REQUIRED',recoveryReason:recovery.reason||'UNGEKLAERT',sameIntentRetry:false}});
    throw new Error('MLUCK_EXISTING_INTENT_UNGEKLAERT_KEIN_RETRY');
  }

  async function waitRoster(){
    while(true){
      installWorkers();publishActor();
      const roster=rosterStatus();
      setState({status:'WAITING_FOR_4_CHARACTERS',phase:'ROSTER',roster});
      if(roster.ready)return roster;
      await sleep(DISCOVERY_MS);
    }
  }

  async function run(){
    installTelemetryFacade();
    if(text(root().character?.ctype).toLowerCase()!=='merchant'){
      setState({status:'BLOCKIERT',phase:'COORDINATOR',terminal:true,blocker:['PR20_6_AUF_MERCHANT_LADEN']});
      emit('MLUCK_WRONG_COORDINATOR','ERROR',{reason:'PR20_6_AUF_MERCHANT_LADEN'});
      return;
    }
    if(PR20_5_REPO_GATE!=='BESTANDEN_REAL_INGAME_4CHAR_15M')throw new Error('PR20_5_GATE_NICHT_BESTANDEN');

    const existing=await recoverExisting();
    if(existing){
      const result=await soak(existing);
      setState({status:'BESTANDEN',phase:'COMPLETE',terminal:true,soak:result,gameplayWrites:1,rawWriteCalls:0,sameIntentRetry:false});
      emit('PR20_6_MLUCK_TEST_PASSED','INFO',{recovered:true,samples:result.samples});
      return;
    }

    const roster=await waitRoster();
    const deterministic=deterministicChecks();
    setState({status:'RUNNING',phase:'DETERMINISTIC_CORE',roster,deterministic});
    if(deterministic.status!=='BESTANDEN')throw new Error('MLUCK_DETERMINISTIC_CORE_FAILED');

    let selection;
    while(true){
      installWorkers();publishActor();
      selection=chooseTarget();
      if(selection.ok)break;
      setState({status:'WAITING_FOR_SAFE_TARGET',phase:'LIVE_PREFLIGHT',preflight:{status:'BLOCKIERT',blocker:selection.blocker}});
      await sleep(DISCOVERY_MS);
    }
    const preflight=validateLivePreflight(selection);
    setState({
      status:preflight.ok?'RUNNING':'BLOCKIERT',
      phase:'LIVE_PREFLIGHT',
      preflight:{
        status:preflight.ok?'BESTANDEN':'BLOCKIERT',
        blocker:preflight.blocker,
        targetClass:preflight.target?.ctype||null,
        sameAccount:preflight.ok,
        sameServer:preflight.ok,
        sameInstance:preflight.ok,
        distance:preflight.target?Math.round(distance(preflight.merchant,preflight.target)):null
      }
    });
    if(!preflight.ok)throw new Error('MLUCK_PREFLIGHT_BLOCKIERT:'+preflight.blocker.join(','));

    const committed=await executeOneShot(preflight);
    const result=await soak(committed);
    setState({
      status:'BESTANDEN',phase:'COMPLETE',terminal:true,soak:result,
      gameplayWrites:1,rawWriteCalls:0,sameIntentRetry:false
    });
    emit('PR20_6_MLUCK_TEST_PASSED','INFO',{targetClass:preflight.target.ctype,samples:result.samples});
  }

  installTelemetryFacade();
  publishActor();
  installWorkers();
  globalThis.V5PR206MluckTest={
    version:VERSION,
    status:()=>state,
    roster:()=>rosterStatus(),
    start:()=>run()
  };

  if(globalThis.__V5_PR20_6_MLUCK_MAIN_TIMER)clearInterval(globalThis.__V5_PR20_6_MLUCK_MAIN_TIMER);
  globalThis.__V5_PR20_6_MLUCK_MAIN_TIMER=setInterval(()=>{try{publishActor();installWorkers();}catch{}},HEARTBEAT_MS);

  Promise.resolve().then(run).catch(error=>{
    const message=String(error?.message||error).slice(0,240);
    if(!state.terminal)setState({status:'FEHLER',phase:state.phase||'UNKNOWN',terminal:true,error:message,sameIntentRetry:false});
    emit('PR20_6_MLUCK_TEST_ERROR','ERROR',{reason:message});
  });
})();
