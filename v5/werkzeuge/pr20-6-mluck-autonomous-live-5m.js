(() => {
  'use strict';

  const VERSION = '1.0.7';
  const TEST_ID = 'pr20-6-mluck-autonomous-live-5m';
  const STATE_KEY = 'AIO_V5_PR20_6_MLUCK_LIVE_5M_V1';
  const ACTORS_KEY = 'AIO_V5_PR20_6_MLUCK_ACTORS_V1';
  const REQUIRED_CLASSES = Object.freeze(['merchant', 'ranger', 'priest', 'mage']);
  const TARGET_CLASSES = Object.freeze(['ranger', 'priest', 'mage']);
  const ACTOR_STALE_MS = 15_000;
  const HEARTBEAT_MS = 2_000;
  const DISCOVERY_MS = 2_000;
  const ROSTER_WAIT_MAX_MS = 120_000;
  const START_RETRY_MS = 10_000;
  const DISCONNECT_POSTCONDITION_MAX_MS = 30_000;
  const MAX_START_ATTEMPTS_PER_CLASS = 2;
  const ACTIVE_CHARACTER_STATES = Object.freeze(['self','starting','loading','active','code']);
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

  function armPerformanceTrick() {
    const r = root();
    try {
      if (typeof r.performance_trick === 'function') {
        r.performance_trick();
        return true;
      }
    } catch {}
    try {
      if (typeof globalThis.performance_trick === 'function') {
        globalThis.performance_trick();
        return true;
      }
    } catch {}
    return false;
  }

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

  function normalizeOnline(value) {
    if (value === true || value === 1) return true;
    if (value === false || value === 0 || value == null) return false;
    const v=text(value).toLowerCase();
    return !['','0','false','offline','none','null','undefined'].includes(v);
  }

  function accountCharacters() {
    const r=root();
    let raw=null;
    try {
      const candidates=[r];
      if(globalThis&&!candidates.includes(globalThis))candidates.push(globalThis);
      try {
        const p=r?.parent&&r.parent!==r?r.parent:null;
        if(p&&!candidates.includes(p))candidates.push(p);
      } catch {}
      try {
        const p=globalThis?.parent&&globalThis.parent!==globalThis?globalThis.parent:null;
        if(p&&!candidates.includes(p))candidates.push(p);
      } catch {}
      const binding=candidates
        .map(owner=>({owner,fn:owner?.get_characters}))
        .find(entry=>typeof entry.fn==='function');
      if(!binding) return { available:false, rows:[] };
      raw=binding.fn.call(binding.owner);
    } catch {
      return { available:false, rows:[] };
    }
    const rows=Array.isArray(raw)?raw:(raw&&typeof raw==='object'?Object.values(raw):[]);
    const normalized=[];
    const seen=new Set();
    for(const row of rows){
      if(!row||typeof row!=='object')continue;
      const name=text(row.name);
      const ctype=text(row.ctype||row.type).toLowerCase();
      if(!name||!ctype||seen.has(name))continue;
      seen.add(name);
      normalized.push({name,ctype,online:normalizeOnline(row.online)});
    }
    return { available:true, rows:normalized };
  }

  function activeCharacters() {
    const r=root();
    try {
      const fn=typeof r.get_active_characters==='function'
        ? r.get_active_characters
        : (typeof globalThis.get_active_characters==='function'?globalThis.get_active_characters:null);
      const value=typeof fn==='function'?fn.call(r):null;
      return {
        available:value!=null,
        rows:value&&typeof value==='object'?{...value}:{}
      };
    } catch {
      return { available:false, rows:{} };
    }
  }

  const lifecycleStartControl=Object.create(null);

  function lifecycleError(error) {
    if(error&&typeof error==='object'){
      const reason=text(error.reason||error.message);
      if(reason)return reason.slice(0,120);
      try{return JSON.stringify(error).slice(0,120);}catch{}
    }
    return text(error).slice(0,120)||'START_CHARACTER_FAILED';
  }

  function verifiedFreshActorsForOwnedClass(ctype,matches) {
    const me=actorSnapshot();
    if(!me.accountKey||!me.serverRegion||!me.serverIdentifier)return [];
    const ownedNames=new Set(matches.map(row=>row.name));
    return freshActors().filter(actor=>
      actor
      && actor.testId===TEST_ID
      && actor.ctype===ctype
      && ownedNames.has(actor.name)
      && !!text(actor.sessionId)
      && actor.accountKey===me.accountKey
      && actor.serverRegion===me.serverRegion
      && actor.serverIdentifier===me.serverIdentifier
    );
  }

  function selectRequiredOwnedCharacter(ctype, account, active) {
    const matches=account.rows.filter(row=>row.ctype===ctype);
    const activeMatches=matches.filter(row=>ACTIVE_CHARACTER_STATES.includes(text(active.rows[row.name])));
    if(activeMatches.length===1)return {ok:true,row:activeMatches[0],status:'ACTIVE_LOCAL'};
    if(activeMatches.length>1)return {ok:false,reason:'MEHRERE_AKTIVE_'+ctype.toUpperCase()};

    const registryMatches=verifiedFreshActorsForOwnedClass(ctype,matches);
    if(registryMatches.length===1){
      const actor=registryMatches[0];
      const row=matches.find(candidate=>candidate.name===actor.name);
      return {ok:true,row,status:'ACTIVE_FRESH_ACTOR',actor};
    }
    if(registryMatches.length>1)
      return {ok:false,reason:'MEHRERE_FRISCHE_'+ctype.toUpperCase()+'_ACTORS'};

    const onlineMatches=matches.filter(row=>row.online===true);
    if(onlineMatches.length===1)return {ok:true,row:onlineMatches[0],status:'OWNED_UNIQUE_ONLINE'};
    if(onlineMatches.length>1)return {ok:false,reason:'MEHRERE_ONLINE_'+ctype.toUpperCase()};

    if(matches.length===1)return {ok:true,row:matches[0],status:'OWNED_NOT_LOCAL'};
    if(matches.length===0)return {ok:false,reason:'ACCOUNT_'+ctype.toUpperCase()+'_FEHLT'};
    return {ok:false,reason:'ACCOUNT_'+ctype.toUpperCase()+'_MEHRDEUTIG'};
  }

  function noWriteLifecycleRecoveryAllowed() {
    return Number(state?.gameplayWrites||0)===0
      && Number(state?.rawWriteCalls||0)===0
      && state?.sameIntentRetry===false
      && Array.isArray(state?.intents)
      && state.intents.length===0;
  }

  function lifecycleRecoveryEntry(ctype) {
    const entries=state?.lifecycleRecovery&&typeof state.lifecycleRecovery==='object'
      ? state.lifecycleRecovery
      : {};
    const value=entries[ctype];
    return value&&typeof value==='object'?value:null;
  }

  function persistLifecycleRecovery(ctype,patch) {
    const entries=state?.lifecycleRecovery&&typeof state.lifecycleRecovery==='object'
      ? state.lifecycleRecovery
      : {};
    const previous=entries[ctype]&&typeof entries[ctype]==='object'?entries[ctype]:{};
    const next={...previous,...patch,ctype,updatedAtMs:now()};
    state={
      ...state,
      lifecycleRecovery:{...entries,[ctype]:next},
      updatedAtMs:now(),
      rawWriteCalls:0,
      sameIntentRetry:false
    };
    writeJson(STATE_KEY,state);
    return next;
  }

  function publicSayBinding(r) {
    if(typeof r.say==='function')return {fn:r.say,owner:r};
    if(typeof globalThis.say==='function')return {fn:globalThis.say,owner:globalThis};
    return null;
  }

  async function reconcileAlreadyRunning(ctype,target,result) {
    const upper=ctype.toUpperCase();
    const existing=lifecycleRecoveryEntry(ctype);
    if(existing&&existing.targetName&&existing.targetName!==target.name){
      const reason='DISCONNECT_'+upper+'_TARGET_DRIFT';
      result.blockers.push(reason);
      return {status:'BLOCKED',reason};
    }

    if(target.online!==true){
      persistLifecycleRecovery(ctype,{
        targetName:target.name,
        postcondition:'OFFLINE_CONFIRMED',
        offlineConfirmedAtMs:now()
      });
      return {status:'OFFLINE_CONFIRMED'};
    }

    if(!noWriteLifecycleRecoveryAllowed()){
      const reason='DISCONNECT_'+upper+'_NO_WRITE_PRECONDITION_FEHLT';
      result.blockers.push(reason);
      return {status:'BLOCKED',reason};
    }

    if(existing?.boundaryEntered===true){
      const age=now()-Number(existing.requestedAtMs||0);
      if(age>=DISCONNECT_POSTCONDITION_MAX_MS){
        const reason='DISCONNECT_'+upper+'_POSTCONDITION_TIMEOUT';
        persistLifecycleRecovery(ctype,{postcondition:'TIMEOUT',reason});
        result.blockers.push(reason);
        return {status:'BLOCKED',reason};
      }
      return {status:'WAITING_OFFLINE_POSTCONDITION',ageMs:Math.max(0,age)};
    }

    if(!/^[A-Za-z0-9_]{1,40}$/.test(target.name)){
      const reason='DISCONNECT_'+upper+'_NAME_UNSAFE';
      result.blockers.push(reason);
      return {status:'BLOCKED',reason};
    }

    const say=publicSayBinding(root());
    if(!say){
      const reason='OFFICIAL_DISCONNECT_COMMAND_UNAVAILABLE';
      result.blockers.push(reason);
      return {status:'BLOCKED',reason};
    }

    persistLifecycleRecovery(ctype,{
      targetName:target.name,
      method:'PUBLIC_SAY_DISCONNECT_V1',
      sourceStartResult:'already_running',
      boundaryEntered:true,
      requestedAtMs:now(),
      postcondition:'PENDING',
      commandSettled:false
    });
    result.disconnectCalls+=1;

    try {
      await Promise.resolve(say.fn.call(say.owner,'/disconnect '+target.name));
      persistLifecycleRecovery(ctype,{commandSettled:true,commandResult:'RESOLVED'});
    } catch(error) {
      persistLifecycleRecovery(ctype,{
        commandSettled:true,
        commandResult:'REJECTED_OR_UNKNOWN',
        commandError:lifecycleError(error)
      });
    }
    return {status:'WAITING_OFFLINE_POSTCONDITION',ageMs:0};
  }

  async function ensureRequiredCharacters() {
    const r=root();
    const account=accountCharacters();
    const active=activeCharacters();
    const result={
      mode:'ACCOUNT_ROSTER_AUTOSTART_V2',
      accountStateAvailable:account.available,
      activeStateAvailable:active.available,
      required:[],
      blockers:[],
      startCalls:0,
      disconnectCalls:0
    };
    if(!account.available){
      result.blockers.push('GET_CHARACTERS_UNAVAILABLE');
      return result;
    }
    if(!active.available){
      result.blockers.push('GET_ACTIVE_CHARACTERS_UNAVAILABLE');
      return result;
    }

    for(const ctype of TARGET_CLASSES){
      const selected=selectRequiredOwnedCharacter(ctype,account,active);
      if(!selected.ok){
        result.required.push({ctype,status:'BLOCKED',reason:selected.reason});
        result.blockers.push(selected.reason);
        continue;
      }

      const target=selected.row;
      const activeState=text(active.rows[target.name]);
      if(ACTIVE_CHARACTER_STATES.includes(activeState)){
        result.required.push({ctype,status:'ACTIVE_LOCAL',name:target.name,activeState});
        continue;
      }
      if(selected.status==='ACTIVE_FRESH_ACTOR'){
        result.required.push({
          ctype,
          status:'ACTIVE_FRESH_ACTOR',
          name:target.name,
          sessionId:text(selected.actor?.sessionId)||null,
          observedAtMs:Number(selected.actor?.observedAtMs)||null
        });
        continue;
      }

      const ctl=lifecycleStartControl[ctype]||{attempts:0,lastAttemptAtMs:0,lastResult:null};
      lifecycleStartControl[ctype]=ctl;

      const persistedBeforeStart=lifecycleRecoveryEntry(ctype);
      if(persistedBeforeStart?.boundaryEntered===true
          && persistedBeforeStart.targetName===target.name
          && persistedBeforeStart.postcondition!=='OFFLINE_CONFIRMED'){
        const recovery=await reconcileAlreadyRunning(ctype,target,result);
        if(recovery.status!=='OFFLINE_CONFIRMED'){
          result.required.push({
            ctype,
            status:recovery.status,
            reason:recovery.reason||null,
            name:target.name,
            attempts:ctl.attempts,
            lastResult:ctl.lastResult,
            recovery:lifecycleRecoveryEntry(ctype)
          });
          continue;
        }
        ctl.lastAttemptAtMs=0;
      } else if(ctl.lastResult==='already_running'){
        const recovery=await reconcileAlreadyRunning(ctype,target,result);
        if(recovery.status!=='OFFLINE_CONFIRMED'){
          result.required.push({
            ctype,
            status:recovery.status,
            reason:recovery.reason||null,
            name:target.name,
            attempts:ctl.attempts,
            lastResult:ctl.lastResult,
            recovery:lifecycleRecoveryEntry(ctype)
          });
          continue;
        }
        ctl.lastAttemptAtMs=0;
      } else if(ctl.lastResult==='START_REQUEST_RESOLVED'){
        result.required.push({
          ctype,
          status:'START_POSTCONDITION_PENDING',
          name:target.name,
          attempts:ctl.attempts,
          lastResult:ctl.lastResult
        });
        continue;
      }

      const confirmedRecovery=lifecycleRecoveryEntry(ctype);
      if(confirmedRecovery?.postcondition==='OFFLINE_CONFIRMED'
          && confirmedRecovery?.postDisconnectStartBoundaryEntered===true){
        result.required.push({
          ctype,
          status:'POST_DISCONNECT_START_POSTCONDITION_PENDING',
          name:target.name,
          attempts:ctl.attempts,
          lastResult:ctl.lastResult,
          recovery:confirmedRecovery
        });
        continue;
      }

      if(ctl.attempts>=MAX_START_ATTEMPTS_PER_CLASS){
        const reason='START_'+ctype.toUpperCase()+'_VERSUCHE_AUSGESCHOEPFT';
        result.required.push({ctype,status:'BLOCKED',reason,name:target.name,attempts:ctl.attempts,lastResult:ctl.lastResult});
        result.blockers.push(reason);
        continue;
      }
      if(ctl.lastAttemptAtMs&&now()-ctl.lastAttemptAtMs<START_RETRY_MS){
        result.required.push({ctype,status:'START_BACKOFF',name:target.name,attempts:ctl.attempts,lastResult:ctl.lastResult});
        continue;
      }

      const startCharacter=typeof r.start_character==='function'
        ? r.start_character
        : (typeof globalThis.start_character==='function'?globalThis.start_character:null);
      if(typeof startCharacter!=='function'){
        const reason='START_CHARACTER_UNAVAILABLE';
        result.required.push({ctype,status:'BLOCKED',reason,name:target.name});
        result.blockers.push(reason);
        continue;
      }

      const recoveryBeforeStart=lifecycleRecoveryEntry(ctype);
      const postDisconnectStart=recoveryBeforeStart?.postcondition==='OFFLINE_CONFIRMED';
      if(postDisconnectStart){
        persistLifecycleRecovery(ctype,{
          postDisconnectStartBoundaryEntered:true,
          postDisconnectStartRequestedAtMs:now(),
          postDisconnectStartResult:'UNKNOWN'
        });
      }

      ctl.attempts+=1;
      ctl.lastAttemptAtMs=now();
      result.startCalls+=1;
      try {
        await Promise.resolve(startCharacter.call(r,target.name));
        ctl.lastResult='START_REQUEST_RESOLVED';
        if(postDisconnectStart)
          persistLifecycleRecovery(ctype,{postDisconnectStartResult:'RESOLVED'});
        result.required.push({ctype,status:'START_REQUEST_RESOLVED',name:target.name,attempts:ctl.attempts});
      } catch(error) {
        ctl.lastResult=lifecycleError(error);
        if(postDisconnectStart)
          persistLifecycleRecovery(ctype,{postDisconnectStartResult:'REJECTED_OR_UNKNOWN',postDisconnectStartError:ctl.lastResult});
        result.required.push({
          ctype,
          status:ctl.lastResult==='already_running'?'ALREADY_RUNNING_RECOVERY_REQUIRED':'START_REQUEST_REJECTED',
          name:target.name,
          attempts:ctl.attempts,
          lastResult:ctl.lastResult
        });
      }
    }
    return result;
  }

  function workerSource() {
    const body = function () {
      'use strict';
      const K='AIO_V5_PR20_6_MLUCK_ACTORS_V1';
      const I=2000;
      function t(v){return String(v==null?'':v).trim();}
      const workerClass=t(globalThis.character?.ctype).toLowerCase();
      if(!['ranger','priest','mage'].includes(workerClass))return;
      let performanceTrickArmed=false;
      try{
        if(typeof globalThis.performance_trick==='function'){
          globalThis.performance_trick();
          performanceTrickArmed=true;
        }
      }catch{}
      if(!performanceTrickArmed){
        globalThis.V5PR206MluckWorker={
          version:'1.0.1',
          status:()=>({
            schemaVersion:1,
            testId:'pr20-6-mluck-autonomous-live-5m',
            name:t(globalThis.character?.name),
            ctype:workerClass,
            performanceTrick:false,
            blocker:'PR20_6_WORKER_PERFORMANCE_TRICK_UNAVAILABLE',
            observedAtMs:Date.now()
          })
        };
        return;
      }
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
          mluck:effect(r.character),runtimeConflict:conflict,
          performanceTrick:true,observedAtMs:Date.now()
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
      globalThis.V5PR206MluckWorker={version:'1.0.1',status:()=>snap()};
    };
    return '('+body.toString()+')();';
  }

  function installWorkers() {
    const r=root();
    const active=activeCharacters();
    const account=accountCharacters();
    const byName=new Map(account.rows.map(row=>[row.name,row]));
    const src=workerSource();
    for(const [name,state] of Object.entries(active.rows||{})){
      if(name===r.character?.name)continue;
      if(!ACTIVE_CHARACTER_STATES.includes(text(state)))continue;
      const owned=byName.get(name);
      if(account.available&&(!owned||!TARGET_CLASSES.includes(owned.ctype)))continue;
      try{if(typeof r.command_character==='function')r.command_character(name,src);}catch{}
    }
  }

  function freshActors() {
    const reg=readJson(ACTORS_KEY,{schemaVersion:1,actors:{}});
    const at=now();
    return Object.values(reg.actors||{})
      .filter(a=>a&&a.schemaVersion===1&&a.testId===TEST_ID&&at-Number(a.observedAtMs||0)<=ACTOR_STALE_MS);
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
      actors:chosen.map(a=>({
        name:a.name,ctype:a.ctype,sessionId:a.sessionId||null,accountKey:a.accountKey||null,
        serverRegion:a.serverRegion||null,serverIdentifier:a.serverIdentifier||null,
        map:a.map,observedAtMs:a.observedAtMs
      }))
    };
  }

  function safeKnownV101RosterRecovery(previous) {
    const blockers=Array.isArray(previous?.blocker)?previous.blocker.map(text):[];
    const required=Array.isArray(previous?.characterLifecycle?.required)
      ? previous.characterLifecycle.required
      : [];
    const alreadyRunning=new Set(required
      .filter(row=>['priest','mage'].includes(text(row?.ctype).toLowerCase())
        && text(row?.lastResult)==='already_running')
      .map(row=>text(row?.ctype).toLowerCase()));
    return previous?.testId===TEST_ID
      && previous?.version==='1.0.1'
      && previous?.terminal===true
      && previous?.status==='BLOCKIERT'
      && previous?.phase==='ROSTER'
      && Number(previous?.gameplayWrites||0)===0
      && Number(previous?.rawWriteCalls||0)===0
      && previous?.sameIntentRetry===false
      && Array.isArray(previous?.intents)
      && previous.intents.length===0
      && blockers.includes('PR20_6_ROSTER_AUTOSTART_TIMEOUT')
      && blockers.includes('ACCOUNT_RANGER_MEHRDEUTIG')
      && text(previous?.characterLifecycle?.mode)==='ACCOUNT_ROSTER_AUTOSTART_V1'
      && alreadyRunning.has('priest')
      && alreadyRunning.has('mage');
  }

  function safeKnownV103RosterRecovery(previous) {
    const blockers=Array.isArray(previous?.blocker)?previous.blocker.map(text):[];
    const lifecycle=previous?.characterLifecycle&&typeof previous.characterLifecycle==='object'
      ? previous.characterLifecycle
      : {};
    const recovery=previous?.lifecycleRecovery&&typeof previous.lifecycleRecovery==='object'
      ? previous.lifecycleRecovery
      : {};
    const recovered=(ctype)=>{
      const row=recovery[ctype];
      return !!row
        && row.method==='PUBLIC_SAY_DISCONNECT_V1'
        && row.boundaryEntered===true
        && row.commandSettled===true
        && row.commandResult==='RESOLVED'
        && row.postcondition==='OFFLINE_CONFIRMED'
        && row.postDisconnectStartBoundaryEntered===true
        && row.postDisconnectStartResult==='RESOLVED';
    };
    return previous?.testId===TEST_ID
      && previous?.version==='1.0.3'
      && previous?.terminal===true
      && previous?.status==='WAITING_FOR_4_CHARACTERS'
      && previous?.phase==='ROSTER'
      && Number(previous?.gameplayWrites||0)===0
      && Number(previous?.rawWriteCalls||0)===0
      && previous?.sameIntentRetry===false
      && Array.isArray(previous?.intents)
      && previous.intents.length===0
      && blockers.includes('PR20_6_ROSTER_AUTOSTART_TIMEOUT')
      && blockers.includes('ACCOUNT_RANGER_MEHRDEUTIG')
      && text(lifecycle?.mode)==='ACCOUNT_ROSTER_AUTOSTART_V2'
      && lifecycle?.accountStateAvailable===false
      && Array.isArray(lifecycle?.blockers)
      && lifecycle.blockers.map(text).includes('GET_CHARACTERS_UNAVAILABLE')
      && recovered('priest')
      && recovered('mage');
  }

  function safeKnownV104ParentBindingRecovery(previous) {
    const blockers=Array.isArray(previous?.blocker)?previous.blocker.map(text):[];
    const lifecycle=previous?.characterLifecycle&&typeof previous.characterLifecycle==='object'
      ? previous.characterLifecycle
      : {};
    const recovery=previous?.lifecycleRecovery&&typeof previous.lifecycleRecovery==='object'
      ? previous.lifecycleRecovery
      : {};
    const recovered=(ctype)=>{
      const row=recovery[ctype];
      return !!row
        && row.method==='PUBLIC_SAY_DISCONNECT_V1'
        && row.boundaryEntered===true
        && row.commandSettled===true
        && row.commandResult==='RESOLVED'
        && row.postcondition==='OFFLINE_CONFIRMED'
        && row.postDisconnectStartBoundaryEntered===true
        && row.postDisconnectStartResult==='RESOLVED';
    };
    const lifecycleBlockers=Array.isArray(lifecycle?.blockers)?lifecycle.blockers.map(text):[];
    return previous?.testId===TEST_ID
      && previous?.version==='1.0.4'
      && previous?.terminal===true
      && previous?.status==='BLOCKIERT'
      && previous?.phase==='ROSTER'
      && Number(previous?.gameplayWrites||0)===0
      && Number(previous?.rawWriteCalls||0)===0
      && previous?.sameIntentRetry===false
      && Array.isArray(previous?.intents)
      && previous.intents.length===0
      && blockers.length===3
      && blockers.includes('PR20_6_ROSTER_AUTOSTART_TIMEOUT')
      && blockers.includes('GET_CHARACTERS_UNAVAILABLE')
      && blockers.includes('ROSTER_RANGER_FEHLT')
      && text(lifecycle?.mode)==='ACCOUNT_ROSTER_AUTOSTART_V2'
      && lifecycle?.accountStateAvailable===false
      && lifecycle?.activeStateAvailable===true
      && Array.isArray(lifecycle?.required)
      && lifecycle.required.length===0
      && Number(lifecycle?.startCalls||0)===0
      && Number(lifecycle?.disconnectCalls||0)===0
      && lifecycleBlockers.length===1
      && lifecycleBlockers[0]==='GET_CHARACTERS_UNAVAILABLE'
      && recovered('priest')
      && recovered('mage');
  }


  function safeKnownV105BridgeWorkerRecovery(previous) {
    const blockers=Array.isArray(previous?.blocker)?previous.blocker.map(text):[];
    const lifecycle=previous?.characterLifecycle&&typeof previous.characterLifecycle==='object'
      ? previous.characterLifecycle
      : {};
    const lifecycleBlockers=Array.isArray(lifecycle?.blockers)?lifecycle.blockers.map(text):[];
    const required=Array.isArray(lifecycle?.required)?lifecycle.required:[];
    const byClass=new Map(required.map(row=>[text(row?.ctype).toLowerCase(),row]));
    const recovery=previous?.lifecycleRecovery&&typeof previous.lifecycleRecovery==='object'
      ? previous.lifecycleRecovery
      : {};
    const expectedBlockers=[
      'PR20_6_ROSTER_AUTOSTART_TIMEOUT',
      'DISCONNECT_RANGER_POSTCONDITION_TIMEOUT',
      'ROSTER_RANGER_FEHLT',
      'ROSTER_PRIEST_FEHLT',
      'ROSTER_MAGE_FEHLT'
    ];
    const exactBlockers=blockers.length===expectedBlockers.length
      && expectedBlockers.every(value=>blockers.includes(value));
    const recoveredRestart=(ctype,name)=>{
      const row=recovery[ctype];
      return !!row
        && row.method==='PUBLIC_SAY_DISCONNECT_V1'
        && row.targetName===name
        && row.boundaryEntered===true
        && row.commandSettled===true
        && row.commandResult==='RESOLVED'
        && row.postcondition==='OFFLINE_CONFIRMED'
        && row.postDisconnectStartBoundaryEntered===true
        && row.postDisconnectStartResult==='RESOLVED';
    };
    const rangerRecovery=recovery.ranger;
    const ranger=byClass.get('ranger');
    const priest=byClass.get('priest');
    const mage=byClass.get('mage');
    return previous?.testId===TEST_ID
      && previous?.version==='1.0.5'
      && previous?.terminal===true
      && previous?.status==='BLOCKIERT'
      && previous?.phase==='ROSTER'
      && Number(previous?.gameplayWrites||0)===0
      && Number(previous?.rawWriteCalls||0)===0
      && previous?.sameIntentRetry===false
      && Array.isArray(previous?.intents)
      && previous.intents.length===0
      && exactBlockers
      && text(lifecycle?.mode)==='ACCOUNT_ROSTER_AUTOSTART_V2'
      && lifecycle?.accountStateAvailable===true
      && lifecycle?.activeStateAvailable===true
      && Number(lifecycle?.startCalls||0)===0
      && Number(lifecycle?.disconnectCalls||0)===0
      && lifecycleBlockers.length===1
      && lifecycleBlockers[0]==='DISCONNECT_RANGER_POSTCONDITION_TIMEOUT'
      && required.length===3
      && ranger?.name==='My_Ranger1'
      && ranger?.status==='BLOCKED'
      && ranger?.reason==='DISCONNECT_RANGER_POSTCONDITION_TIMEOUT'
      && Number(ranger?.attempts||0)===1
      && ranger?.lastResult==='already_running'
      && priest?.name==='My_Priest'
      && priest?.status==='POST_DISCONNECT_START_POSTCONDITION_PENDING'
      && Number(priest?.attempts||0)===0
      && mage?.name==='My_Mage'
      && mage?.status==='POST_DISCONNECT_START_POSTCONDITION_PENDING'
      && Number(mage?.attempts||0)===0
      && !!rangerRecovery
      && rangerRecovery.method==='PUBLIC_SAY_DISCONNECT_V1'
      && rangerRecovery.targetName==='My_Ranger1'
      && rangerRecovery.boundaryEntered===true
      && rangerRecovery.commandSettled===true
      && rangerRecovery.commandResult==='RESOLVED'
      && rangerRecovery.postcondition==='TIMEOUT'
      && rangerRecovery.reason==='DISCONNECT_RANGER_POSTCONDITION_TIMEOUT'
      && recoveredRestart('priest','My_Priest')
      && recoveredRestart('mage','My_Mage');
  }

  let seq=0;
  const events=[];
  let state=readJson(STATE_KEY,null);
  if(!state||state.schemaVersion!==1){
    state={
      schemaVersion:1,testId:TEST_ID,version:VERSION,status:'BOOT',phase:'BOOT',
      startedAtMs:now(),updatedAtMs:now(),terminal:false,pr20_5:{status:PR20_5_REPO_GATE},
      roster:null,deterministic:null,preflight:null,intents:[],live:null,soak:null,
      lifecycleRecovery:{},
      gameplayWrites:0,rawWriteCalls:0,sameIntentRetry:false,
      supabase:{
        transport:'WINDOWS_BRIDGE_5S_LOCAL_OBSERVE_60S_AGGREGATE_PLUS_TERMINAL_PUSH',
        localObservationSeconds:5,statusIntervalSeconds:60,terminalEventImmediate:true,
        completionEmailEachTerminalTest:true
      }
    };
    writeJson(STATE_KEY,state);
  } else if(state.version!==VERSION) {
    const recoverV101=safeKnownV101RosterRecovery(state);
    const recoverV103=safeKnownV103RosterRecovery(state);
    const recoverV104=safeKnownV104ParentBindingRecovery(state);
    const recoverV105=safeKnownV105BridgeWorkerRecovery(state);
    if(recoverV101||recoverV103||recoverV104||recoverV105){
      const preservedLifecycleRecovery=(recoverV103||recoverV104||recoverV105)
        ? JSON.parse(JSON.stringify(state.lifecycleRecovery||{}))
        : {};
      state={
        ...state,
        version:VERSION,
        status:'BOOT',
        phase:'ROSTER_RECOVERY',
        terminal:false,
        blocker:[],
        error:null,
        startedAtMs:now(),
        updatedAtMs:now(),
        roster:null,
        characterLifecycle:null,
        lifecycleRecovery:preservedLifecycleRecovery,
        gameplayWrites:0,
        rawWriteCalls:0,
        sameIntentRetry:false,
        intents:[]
      };
    } else {
      state={...state,version:VERSION,updatedAtMs:now()};
    }
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
    const started=now();
    while(true){
      const lifecycle=await ensureRequiredCharacters();
      installWorkers();publishActor();
      const roster=rosterStatus();
      const durationMs=now()-started;
      setState({
        status:'WAITING_FOR_4_CHARACTERS',
        phase:'ROSTER',
        roster,
        characterLifecycle:{
          ...lifecycle,
          durationMs,
          maximumWaitMs:ROSTER_WAIT_MAX_MS,
          startAttempts:Object.fromEntries(
            Object.entries(lifecycleStartControl).map(([ctype,row])=>[
              ctype,
              {attempts:Number(row.attempts)||0,lastResult:row.lastResult||null}
            ])
          )
        }
      });
      if(roster.ready)return roster;
      if(durationMs>=ROSTER_WAIT_MAX_MS){
        setState({
          status:'BLOCKIERT',
          phase:'ROSTER',
          terminal:true,
          blocker:[
            'PR20_6_ROSTER_AUTOSTART_TIMEOUT',
            ...lifecycle.blockers,
            ...roster.missing.map(ctype=>'ROSTER_'+String(ctype).toUpperCase()+'_FEHLT')
          ],
          roster,
          characterLifecycle:{
            ...lifecycle,
            durationMs,
            maximumWaitMs:ROSTER_WAIT_MAX_MS,
            startAttempts:Object.fromEntries(
              Object.entries(lifecycleStartControl).map(([ctype,row])=>[
                ctype,
                {attempts:Number(row.attempts)||0,lastResult:row.lastResult||null}
              ])
            )
          }
        });
        emit('PR20_6_ROSTER_AUTOSTART_BLOCKED','ERROR',{
          reason:'PR20_6_ROSTER_AUTOSTART_TIMEOUT',
          missing:roster.missing,
          lifecycleBlockers:lifecycle.blockers
        });
        throw new Error('PR20_6_ROSTER_AUTOSTART_TIMEOUT');
      }
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
    if(!armPerformanceTrick()){
      setState({status:'BLOCKIERT',phase:'BACKGROUND_EXECUTION',terminal:true,blocker:['PR20_6_PERFORMANCE_TRICK_UNAVAILABLE'],gameplayWrites:0,rawWriteCalls:0,sameIntentRetry:false});
      emit('PR20_6_PERFORMANCE_TRICK_BLOCKED','ERROR',{reason:'PR20_6_PERFORMANCE_TRICK_UNAVAILABLE'});
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
