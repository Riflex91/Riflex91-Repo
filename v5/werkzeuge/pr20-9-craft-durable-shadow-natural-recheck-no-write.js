(() => {
  'use strict';

  const TEST_ID='pr20-9-craft-durable-shadow-natural-recheck-no-write';
  const VERSION='1.1.0';
  const EXPECTED_GLOBAL='V5PR209CraftDurableShadowNaturalRecheckNoWrite';
  const EXPECTED_CHARACTER='My_Merchant';
  const EXPECTED_CLASS='merchant';
  const EXPECTED_SERVER_REGION='EU';
  const EXPECTED_SERVER_IDENTIFIER='I';
  const SOURCE_SNAPSHOT_COMMIT='ddcf7222c3264f1404382e1ff5dea8e73f6cb4b4';
  const SOURCE_PINNED_SELL_DISTANCE=400;
  const SERVICE_REACHABILITY_SAFETY_MAX=300;
  const CRAFTSMAN_POINT=Object.freeze({map:'main',x:92,y:670});
  const DOUBLE_OBSERVE_DELAY_MS=350;
  const NATURAL_CANDIDATE_RECHECK_MS=60_000;
  const INTENT_PREFIX='v5:'+TEST_ID+':intent:';

  const events=[];
  let seq=0;
  let running=null;
  let recheckTimer=null;
  let state={
    schemaVersion:1,
    testId:TEST_ID,
    version:VERSION,
    phase:'PR20_9_CRAFT_DURABLE_SHADOW',
    status:'BOOT',
    terminal:false,
    blocker:[],
    startedAtMs:Date.now(),
    updatedAtMs:Date.now(),
    evidence:null,
    recheckCount:0,
    nextRecheckAtMs:null,
    gameplayWrites:0,
    publicFunctionCalls:0,
    rawWriteCalls:0,
    sameIntentRetry:false,
    normalRuntimeAllowed:false,
    authority:{
      authorityIssued:false,
      durableIntentCreated:false,
      craftAuthority:false,
      gameplayAuthority:false,
      rawWriteAuthority:false,
      broadGraphExecutionAuthority:false
    }
  };

  function text(value,max=240) {
    return String(value==null?'':value).trim().slice(0,max);
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function roots() {
    const out=[];
    try { out.push(globalThis); } catch {}
    try {
      if(globalThis.parent
          && globalThis.parent!==globalThis
          && !out.includes(globalThis.parent)) out.push(globalThis.parent);
    } catch {}
    return out;
  }

  function root() {
    for(const candidate of roots()) {
      try {
        if(candidate?.character
            && Array.isArray(candidate.character.items)
            && candidate.G?.items
            && candidate.G?.craft) return candidate;
      } catch {}
    }
    throw new Error('PR20_9_CRAFT_SHADOW_SPIELKONTEXT_FEHLT');
  }

  function sleep(ms) {
    return new Promise(resolve=>setTimeout(resolve,ms));
  }

  function canonical(value) {
    if(value===null || typeof value!=='object') return JSON.stringify(value);
    if(Array.isArray(value)) return '['+value.map(canonical).join(',')+']';
    return '{'+Object.keys(value).sort()
      .map(key=>JSON.stringify(key)+':'+canonical(value[key])).join(',')+'}';
  }

  async function sha256(value) {
    const r=root();
    const cryptoApi=globalThis.crypto||r.crypto;
    if(!cryptoApi?.subtle?.digest) {
      throw new Error('PR20_9_CRAFT_SHADOW_WEB_CRYPTO_UNAVAILABLE');
    }
    const bytes=new TextEncoder().encode(String(value));
    const digest=await cryptoApi.subtle.digest('SHA-256',bytes);
    return Array.from(new Uint8Array(digest),byte=>
      byte.toString(16).padStart(2,'0')).join('');
  }

  function storage() {
    for(const candidate of roots()) {
      try {
        if(candidate?.localStorage
            && typeof candidate.localStorage.setItem==='function'
            && typeof candidate.localStorage.getItem==='function') {
          return candidate.localStorage;
        }
      } catch {}
    }
    throw new Error('PR20_9_CRAFT_SHADOW_DURABLE_STORAGE_UNAVAILABLE');
  }

  function stableScalarObject(value,maxKeys=64) {
    if(!value || typeof value!=='object' || Array.isArray(value)) return {};
    const out={};
    for(const key of Object.keys(value).sort().slice(0,maxKeys)) {
      const v=value[key];
      if(v===null || ['string','number','boolean'].includes(typeof v)) out[key]=v;
    }
    return out;
  }

  function stableItemMaterial(item) {
    return item && typeof item==='object'
      ? canonical(stableScalarObject(item,64))
      : null;
  }

  function serverBinding(r) {
    let parentRoot=null;
    try { if(r.parent && r.parent!==r) parentRoot=r.parent; } catch {}
    return {
      region:[r.server_region,r.server?.region,parentRoot?.server_region,parentRoot?.server?.region]
        .map(v=>text(v,32)).find(Boolean)||'',
      identifier:[r.server_identifier,r.server?.id,parentRoot?.server_identifier,parentRoot?.server?.id]
        .map(v=>text(v,32)).find(Boolean)||''
    };
  }

  function runtimeConflict(r) {
    try {
      const v3=r.AIO_V3?.__runtime;
      const status=v3&&typeof v3.status==='function'?v3.status():null;
      if(v3&&(v3.timer||status?.running===true)) return 'AIO_V3_RUNTIME_ACTIVE';
    } catch { return 'AIO_V3_RUNTIME_UNREADABLE'; }
    try {
      const v4=r.AIO_V4||r.V4Runtime;
      const status=v4&&typeof v4.status==='function'?v4.status():null;
      if(status?.running===true||status?.aktivFreigegeben===true) return 'V4_RUNTIME_ACTIVE';
    } catch { return 'V4_RUNTIME_UNREADABLE'; }
    return null;
  }

  async function ensurePerformanceTrick() {
    let available=false;
    let called=false;
    let error=null;
    for(const candidate of roots()) {
      try {
        if(typeof candidate?.performance_trick!=='function') continue;
        available=true;
        candidate.performance_trick();
        called=true;
        break;
      } catch(e) {
        error=text(e?.message||e,160);
      }
    }
    if(called) await sleep(350);
    let audioFound=false;
    let playing=false;
    for(const candidate of roots()) {
      try {
        const empty=candidate?.sounds?.empty;
        if(!empty) continue;
        audioFound=true;
        if(typeof empty.playing==='function' && empty.playing()===true) playing=true;
        else if(empty.playing===true) playing=true;
      } catch {}
    }
    return {
      available,called,audioFound,playing,
      active:available&&called&&audioFound&&playing,
      verification:'HOWLER_PLAYING_TRUE',
      error
    };
  }

  function sellDistanceEvidence(r) {
    let observed=null;
    for(const candidate of roots()) {
      try {
        const value=Number(candidate?.B?.sell_dist);
        if(Number.isFinite(value)&&value>0) { observed=value; break; }
      } catch {}
    }
    if(Number.isFinite(observed) && observed!==SOURCE_PINNED_SELL_DISTANCE) {
      throw new Error('PR20_9_CRAFT_SHADOW_SELL_DIST_DRIFT');
    }
    return {
      value:Number.isFinite(observed)?observed:SOURCE_PINNED_SELL_DISTANCE,
      source:Number.isFinite(observed)?'LIVE_BROWSER_B':'OFFICIAL_SERVER_SOURCE_PIN',
      browserObserved:Number.isFinite(observed)
    };
  }

  function serviceReachability(r,c) {
    const sellDistance=sellDistanceEvidence(r);
    if(c.computer===true) {
      return {
        reachable:true,
        viaComputer:true,
        distance:null,
        serverLimit:sellDistance.value,
        safetyLimit:SERVICE_REACHABILITY_SAFETY_MAX,
        servicePoint:CRAFTSMAN_POINT,
        sellDistanceSource:sellDistance.source,
        browserObserved:sellDistance.browserObserved
      };
    }
    if(text(c.map,96)!==CRAFTSMAN_POINT.map) {
      throw new Error('PR20_9_CRAFT_SHADOW_SERVICE_MAP_DRIFT');
    }
    const px=Number(c.real_x??c.x);
    const py=Number(c.real_y??c.y);
    if(![px,py].every(Number.isFinite)) {
      throw new Error('PR20_9_CRAFT_SHADOW_SERVICE_POSITION_UNLESBAR');
    }
    const distance=Math.hypot(px-CRAFTSMAN_POINT.x,py-CRAFTSMAN_POINT.y);
    const limit=Math.min(sellDistance.value,SERVICE_REACHABILITY_SAFETY_MAX);
    if(!Number.isFinite(distance)||distance>limit) {
      throw new Error('PR20_9_CRAFT_SHADOW_SERVICE_NICHT_ERREICHBAR');
    }
    return {
      reachable:true,
      viaComputer:false,
      distance,
      serverLimit:sellDistance.value,
      safetyLimit:limit,
      servicePoint:CRAFTSMAN_POINT,
      sellDistanceSource:sellDistance.source,
      browserObserved:sellDistance.browserObserved
    };
  }

  function itemBlocked(item,def) {
    return !item
      || !def
      || item.l===true
      || item.locked===true
      || item.lock===true
      || item.b===true
      || item.blocked===true
      || item.giveaway===true
      || item.list===true
      || item.expires!=null
      || item.acl!=null
      || item.rid!=null
      || item.p!=null
      || item.gift!=null
      || def.cash===true
      || def.event===true
      || def.quest===true
      || def.exclusive===true;
  }

  function recipeInputs(recipe) {
    if(!recipe || !Array.isArray(recipe.items)
        || recipe.items.length<2 || recipe.items.length>9) return null;
    if(recipe.quest!=null || recipe.output!=null) return null;
    const out=[];
    const names=new Set();
    for(const raw of recipe.items) {
      if(!Array.isArray(raw)||raw.length<2) return null;
      const quantity=Number(raw[0]);
      const name=text(raw[1],96);
      const level=Number(raw[2]||0);
      if(!Number.isSafeInteger(quantity)||quantity<1
          || !name || !Number.isSafeInteger(level)||level<0||level>99) return null;
      if(names.has(name)) return null;
      names.add(name);
      out.push({quantity,name,level});
    }
    return out;
  }

  function selectInputs(items,G,requirements) {
    const selected=[];
    const used=new Set();
    for(const requirement of requirements) {
      let match=null;
      for(let index=0;index<items.length&&index<256;index+=1) {
        if(used.has(index)) continue;
        const item=items[index];
        if(!item || text(item.name,96)!==requirement.name
            || Number(item.level||0)!==requirement.level) continue;
        const def=G.items?.[item.name];
        if(itemBlocked(item,def)) continue;
        const q=Number(item.q==null?1:item.q);
        if(!Number.isSafeInteger(q)||q<requirement.quantity) continue;
        match={
          index,
          name:requirement.name,
          level:requirement.level,
          observedQuantity:q,
          consumeQuantity:requirement.quantity,
          fullyConsumed:q===requirement.quantity,
          material:stableItemMaterial(item)
        };
        break;
      }
      if(!match) return null;
      used.add(match.index);
      selected.push(match);
    }
    return selected;
  }

  function scanCandidate(r,c) {
    const names=Object.keys(r.G.craft||{}).sort();
    const rejected=[];
    for(const recipeName of names) {
      const recipe=r.G.craft[recipeName];
      const requirements=recipeInputs(recipe);
      if(!requirements) {
        rejected.push({recipeName,reason:'UNSAFE_OR_SPECIAL_RECIPE'});
        continue;
      }
      const cost=Number(recipe.cost||0);
      if(!Number.isSafeInteger(cost)||cost<0||Number(c.gold||0)<cost) {
        rejected.push({recipeName,reason:'INSUFFICIENT_OR_INVALID_GOLD'});
        continue;
      }
      const selected=selectInputs(c.items,r.G,requirements);
      if(!selected) {
        rejected.push({recipeName,reason:'NO_SAFE_EXACT_SINGLE_STACK_INPUTS'});
        continue;
      }
      const freeSlots=Number.isFinite(Number(c.esize))?Number(c.esize):0;
      const outputspace=freeSlots>0||selected.some(x=>x.fullyConsumed);
      if(!outputspace) {
        rejected.push({recipeName,reason:'NO_CONSERVATIVE_OUTPUTSPACE'});
        continue;
      }
      const outputDef=r.G.items?.[recipeName];
      if(!outputDef) {
        rejected.push({recipeName,reason:'OUTPUT_DEFINITION_MISSING'});
        continue;
      }
      return {
        selected:{
          recipeName,
          recipeKey:requirements
            .map(x=>x.name+(x.level?'+'+x.level:'')).sort().join(','),
          outputName:recipeName,
          outputLevel:0,
          outputQuantity:1,
          goldCost:cost,
          requirements,
          inputs:selected,
          freeSlots,
          outputspaceSatisfied:true,
          recipeMaterial:canonical({
            recipeName,
            cost,
            items:requirements.map(x=>[x.quantity,x.name,x.level]),
            quest:recipe.quest??null,
            output:recipe.output??null
          }),
          outputDefinitionMaterial:canonical(stableScalarObject(outputDef,64))
        },
        rejectedCount:rejected.length,
        rejected:rejected.slice(0,32)
      };
    }
    return {selected:null,rejectedCount:rejected.length,rejected:rejected.slice(0,32)};
  }

  function observation() {
    const r=root();
    const c=r.character;
    if(text(c.name,192)!==EXPECTED_CHARACTER) throw new Error('PR20_9_CRAFT_SHADOW_RECIPIENT_DRIFT');
    if(!text(c.id,192)) throw new Error('PR20_9_CRAFT_SHADOW_SESSION_FEHLT');
    if(text(c.ctype||c.type,32).toLowerCase()!==EXPECTED_CLASS) throw new Error('PR20_9_CRAFT_SHADOW_MERCHANT_ERFORDERLICH');
    const server=serverBinding(r);
    if(server.region!==EXPECTED_SERVER_REGION||server.identifier!==EXPECTED_SERVER_IDENTIFIER) {
      throw new Error('PR20_9_CRAFT_SHADOW_SERVER_BINDUNG_DRIFT');
    }
    if(c.rip===true||c.dead===true) throw new Error('PR20_9_CRAFT_SHADOW_CHARACTER_TOT');
    if(c.moving===true) throw new Error('PR20_9_CRAFT_SHADOW_CHARACTER_BEWEGT_SICH');
    if(c.target!==null&&c.target!==undefined&&text(c.target,192)) {
      throw new Error('PR20_9_CRAFT_SHADOW_CHARACTER_HAT_ZIEL');
    }
    if(c.q&&typeof c.q==='object'&&Object.keys(c.q).length) {
      throw new Error('PR20_9_CRAFT_SHADOW_Q_NICHT_FREI');
    }
    const conflict=runtimeConflict(r);
    if(conflict) throw new Error('PR20_9_CRAFT_SHADOW_ALTERNATIVE_RUNTIME_AKTIV:'+conflict);
    let hostile=0;
    try {
      for(const entity of Object.values(r.entities||{})) {
        if(entity&&entity.type==='monster'&&!entity.dead&&!entity.rip
            &&text(entity.target,192)===EXPECTED_CHARACTER) hostile+=1;
      }
    } catch { throw new Error('PR20_9_CRAFT_SHADOW_AGGRO_UNLESBAR'); }
    if(hostile!==0) throw new Error('PR20_9_CRAFT_SHADOW_CHARACTER_UNTER_ANGRIFF');

    const service=serviceReachability(r,c);
    const scan=scanCandidate(r,c);
    const inventoryMaterial=canonical(c.items.map((item,index)=>[index,stableItemMaterial(item)]));
    const qMaterial=canonical(stableScalarObject(c.q||{},32));
    return {
      characterName:text(c.name,192),
      sessionId:text(c.id,192),
      ctype:EXPECTED_CLASS,
      level:Number(c.level||0),
      map:text(c.map,96),
      serverRegion:server.region,
      serverIdentifier:server.identifier,
      gold:Number(c.gold||0),
      freeSlots:Number(c.esize||0),
      service,
      scan,
      inventoryMaterial,
      qMaterial
    };
  }

  function stableIdentity(o) {
    return canonical({
      characterName:o.characterName,
      sessionId:o.sessionId,
      serverRegion:o.serverRegion,
      serverIdentifier:o.serverIdentifier,
      map:o.map,
      gold:o.gold,
      freeSlots:o.freeSlots,
      service:o.service,
      selected:o.scan.selected,
      inventoryMaterial:o.inventoryMaterial,
      qMaterial:o.qMaterial
    });
  }

  function readExisting(store,key,record) {
    const raw=store.getItem(key);
    if(raw===null) return null;
    let decoded=null;
    try { decoded=JSON.parse(raw); } catch {}
    const exact=decoded
      && decoded.schemaVersion===1
      && decoded.testId===TEST_ID
      && decoded.version===VERSION
      && decoded.art==='PR20_9_CRAFT_DURABLE_SHADOW_INTENT_NO_GAMEPLAY_WRITE'
      && decoded.terminal===true
      && decoded.journalTerminalArt==='ABBRUCH'
      && decoded.sendBoundaryState==='NICHT_GESENDET'
      && decoded.reconciliationClassification==='NOT_APPLIED'
      && decoded.sameIntentRetry===false
      && decoded.actionContractId==='AL-ACTION-CRAFT'
      && decoded.recoveryContractId==='AL-RECOVERY-CRAFT'
      && decoded.verifierId==='AL-VERIFIER-CRAFT'
      && decoded.publicFunction==='craft'
      && decoded.craftPath==='NORMAL'
      && decoded.sourceSnapshotCommit===SOURCE_SNAPSHOT_COMMIT
      && canonical(decoded.recipient)===canonical(record.recipient)
      && canonical(decoded.serviceReachability)===canonical(record.serviceReachability)
      && canonical(decoded.candidate)===canonical(record.candidate)
      && canonical(decoded.fingerprints)===canonical(record.fingerprints)
      && decoded.craftAuthority===false
      && decoded.gameplayAuthority===false
      && decoded.rawWriteAuthority===false
      && decoded.broadGraphExecutionAuthority===false
      && decoded.normalRuntimeAllowed===false;
    if(!exact) throw new Error('PR20_9_CRAFT_SHADOW_EXISTING_INTENT_DRIFT');
    return decoded;
  }

  function persistShadowIntent(record) {
    const store=storage();
    const key=INTENT_PREFIX+record.fingerprints.prestate;
    const existing=readExisting(store,key,record);
    if(existing) {
      return {
        storageKey:key,
        createdThisRun:false,
        recoveredExistingTerminal:true,
        durableReadback:true
      };
    }
    const payload=JSON.stringify({
      schemaVersion:1,
      testId:TEST_ID,
      version:VERSION,
      art:'PR20_9_CRAFT_DURABLE_SHADOW_INTENT_NO_GAMEPLAY_WRITE',
      createdAtMs:Date.now(),
      terminal:true,
      journalTerminalArt:'ABBRUCH',
      sendBoundaryState:'NICHT_GESENDET',
      reconciliationClassification:'NOT_APPLIED',
      sameIntentRetry:false,
      actionContractId:'AL-ACTION-CRAFT',
      recoveryContractId:'AL-RECOVERY-CRAFT',
      verifierId:'AL-VERIFIER-CRAFT',
      publicFunction:'craft',
      craftPath:'NORMAL',
      sourceSnapshotCommit:SOURCE_SNAPSHOT_COMMIT,
      recipient:record.recipient,
      serviceReachability:record.serviceReachability,
      candidate:record.candidate,
      fingerprints:record.fingerprints,
      exactPhysicalInputIndexesPinned:true,
      freshReresolutionRequiredBeforeFutureSend:true,
      durableShadowOnly:true,
      craftAuthority:false,
      gameplayAuthority:false,
      rawWriteAuthority:false,
      broadGraphExecutionAuthority:false,
      normalRuntimeAllowed:false
    });
    store.setItem(key,payload);
    if(store.getItem(key)!==payload) {
      throw new Error('PR20_9_CRAFT_SHADOW_DURABLE_READBACK_MISMATCH');
    }
    readExisting(store,key,record);
    return {
      storageKey:key,
      createdThisRun:true,
      recoveredExistingTerminal:false,
      durableReadback:true
    };
  }

  function emit(type,severity,data={}) {
    seq+=1;
    events.push({
      seq,
      ts:new Date().toISOString(),
      event:type,
      type,
      severity,
      reason:data.reason||null,
      component:'v5-pr20-9-craft-durable-shadow-natural-recheck-no-write',
      data
    });
    if(events.length>128) events.splice(0,events.length-128);
  }

  function setState(patch) {
    state={
      ...state,
      ...patch,
      updatedAtMs:Date.now(),
      gameplayWrites:0,
      publicFunctionCalls:0,
      rawWriteCalls:0,
      sameIntentRetry:false,
      normalRuntimeAllowed:false,
      authority:{
        authorityIssued:false,
        durableIntentCreated:false,
        craftAuthority:false,
        gameplayAuthority:false,
        rawWriteAuthority:false,
        broadGraphExecutionAuthority:false
      }
    };
    return state;
  }

  function cancelRecheck() {
    if(recheckTimer!==null) {
      try { clearTimeout(recheckTimer); } catch {}
      recheckTimer=null;
    }
  }

  function finish(status,blocker=[],evidence=null) {
    cancelRecheck();
    setState({
      status,
      phase:'COMPLETE',
      terminal:true,
      blocker,
      evidence,
      nextRecheckAtMs:null
    });
  }

  function waitForNaturalCandidate(first,performanceTrick) {
    cancelRecheck();
    const recheckCount=Number(state.recheckCount||0)+1;
    const nextRecheckAtMs=Date.now()+NATURAL_CANDIDATE_RECHECK_MS;
    setState({
      status:'WAITING_FOR_NATURAL_NORMAL_CRAFT_CANDIDATE',
      phase:'WAITING_CANDIDATE',
      terminal:false,
      blocker:['PR20_9_CRAFT_SHADOW_KEIN_NORMALKANDIDAT'],
      recheckCount,
      nextRecheckAtMs,
      evidence:{
        schemaVersion:1,
        evidenceArt:'V5_PR20_9_CRAFT_NATURAL_CANDIDATE_RECHECK_NO_WRITE',
        status:'WAITING_FOR_NATURAL_NORMAL_CRAFT_CANDIDATE',
        observedAtMs:Date.now(),
        nextRecheckAtMs,
        recheckCount,
        rejectedCount:first.scan.rejectedCount,
        rejected:first.scan.rejected,
        naturalCurrentInventoryOnly:true,
        gameplayWrites:0,
        publicFunctionCalls:0,
        rawWriteCalls:0,
        craftAuthority:false,
        normalRuntimeAllowed:false,
        performanceTrick
      }
    });
    emit('PR20_9_CRAFT_SHADOW_NATURAL_CANDIDATE_WAITING','INFO',{
      recheckCount,
      nextRecheckAtMs,
      rejectedCount:first.scan.rejectedCount
    });
    recheckTimer=setTimeout(()=>{
      recheckTimer=null;
      if(state.terminal!==true) void run();
    },NATURAL_CANDIDATE_RECHECK_MS);
  }

  function installTelemetryFacade(owner) {
    if(!owner) return;
    owner.AIO_V3=owner.AIO_V3||{};
    const existing=owner.AIO_V3.operations&&typeof owner.AIO_V3.operations==='object'
      ?owner.AIO_V3.operations:null;
    const oldStatus=existing&&typeof existing.status==='function'
      ?existing.status.bind(existing):null;
    const oldHeartbeat=existing&&typeof existing.hostHeartbeat==='function'
      ?existing.hostHeartbeat.bind(existing):null;
    owner.AIO_V3.operations={
      ...(existing||{}),
      __v5Pr209CraftShadowFacadeVersion:VERSION,
      status:()=>{
        let base={};
        try {
          const value=oldStatus?oldStatus():null;
          if(value&&typeof value==='object') base=value;
        } catch {}
        return {
          ...base,
          schemaVersion:Number(base.schemaVersion)||1,
          mode:'V5_AUTONOMOUS_TEST',
          v5AutonomousTest:state,
          telemetry:{queued:events.length,lastCapturedSeq:seq,dropped:0}
        };
      },
      hostHeartbeat:()=>{
        try {
          const value=oldHeartbeat?oldHeartbeat():null;
          if(value&&typeof value==='object') {
            return {...value,v5Mode:'V5_AUTONOMOUS_TEST',v5TestId:TEST_ID,v5ObservedAtMs:Date.now()};
          }
        } catch {}
        return {schemaVersion:1,alive:true,mode:'V5_AUTONOMOUS_TEST',testId:TEST_ID,observedAtMs:Date.now()};
      },
      reconciliationStatus:()=>({
        schemaVersion:1,
        status:state.terminal?'TERMINAL_NO_MUTATION':'NO_MUTATION_RECONCILIATION_REQUIRED',
        v5AutonomousTestStatus:state.status,
        v5Terminal:state.terminal===true,
        sameIntentRetry:false
      }),
      peekTelemetry:(limit=2000)=>events.slice(-Math.max(1,Math.min(2000,Number(limit)||2000)))
    };
  }

  function publishTelemetryFacades() {
    const r=root();
    installTelemetryFacade(r);
    if(globalThis!==r) installTelemetryFacade(globalThis);
    try {
      const host=globalThis.parent;
      if(host&&host!==globalThis&&host!==r) installTelemetryFacade(host);
    } catch {}
  }

  async function execute() {
    publishTelemetryFacades();
    setState({
      status:'CHECKING_NATURAL_NORMAL_CRAFT_CANDIDATE',
      phase:'PR20_9_CRAFT_DURABLE_SHADOW_RECHECK',
      terminal:false,
      blocker:[],
      evidence:null,
      nextRecheckAtMs:null
    });
    emit('PR20_9_CRAFT_SHADOW_NO_WRITE_STARTED','INFO',{
      recheckCount:Number(state.recheckCount||0)
    });

    const performanceTrick=await ensurePerformanceTrick();
    if(!performanceTrick.active) {
      finish('BLOCKIERT',['PR20_9_CRAFT_SHADOW_PERFORMANCE_TRICK_NICHT_AKTIV'],{performanceTrick});
      return;
    }

    const first=observation();
    if(!first.scan.selected) {
      waitForNaturalCandidate(first,performanceTrick);
      return;
    }

    const firstIdentity=stableIdentity(first);
    await sleep(DOUBLE_OBSERVE_DELAY_MS);
    const second=observation();
    const secondIdentity=stableIdentity(second);
    if(firstIdentity!==secondIdentity) {
      throw new Error('PR20_9_CRAFT_SHADOW_PREFLIGHT_SNAPSHOT_DRIFT');
    }
    if(!second.scan.selected) {
      throw new Error('PR20_9_CRAFT_SHADOW_KANDIDAT_VERLOREN');
    }

    const [
      prestateFingerprintSha256,
      inventoryFingerprintSha256,
      qFingerprintSha256,
      recipeFingerprintSha256,
      inputsFingerprintSha256
    ]=await Promise.all([
      sha256(secondIdentity),
      sha256(second.inventoryMaterial),
      sha256(second.qMaterial),
      sha256(second.scan.selected.recipeMaterial),
      sha256(canonical(second.scan.selected.inputs))
    ]);

    const record={
      recipient:{
        characterName:second.characterName,
        sessionId:second.sessionId,
        ctype:second.ctype,
        serverRegion:second.serverRegion,
        serverIdentifier:second.serverIdentifier
      },
      serviceReachability:second.service,
      candidate:{
        recipeName:second.scan.selected.recipeName,
        recipeKey:second.scan.selected.recipeKey,
        outputName:second.scan.selected.outputName,
        outputLevel:second.scan.selected.outputLevel,
        outputQuantity:second.scan.selected.outputQuantity,
        goldCost:second.scan.selected.goldCost,
        requirements:second.scan.selected.requirements,
        inputs:second.scan.selected.inputs.map(x=>({
          name:x.name,
          level:x.level,
          inventoryIndex:x.index,
          observedQuantity:x.observedQuantity,
          consumeQuantity:x.consumeQuantity,
          fullyConsumed:x.fullyConsumed,
          material:x.material
        })),
        outputspaceSatisfied:true,
        freeSlots:second.scan.selected.freeSlots
      },
      fingerprints:{
        prestate:prestateFingerprintSha256,
        inventory:inventoryFingerprintSha256,
        q:qFingerprintSha256,
        recipe:recipeFingerprintSha256,
        inputs:inputsFingerprintSha256
      }
    };

    const shadowIntent=persistShadowIntent(record);
    await sleep(DOUBLE_OBSERVE_DELAY_MS);
    const third=observation();
    if(stableIdentity(third)!==secondIdentity) {
      throw new Error('PR20_9_CRAFT_SHADOW_POST_INTENT_DRIFT');
    }
    const postIntentPrestateFingerprintSha256=await sha256(stableIdentity(third));
    if(postIntentPrestateFingerprintSha256!==prestateFingerprintSha256) {
      throw new Error('PR20_9_CRAFT_SHADOW_PRESTATE_HASH_DRIFT');
    }

    finish('BESTANDEN',[],{
      schemaVersion:1,
      evidenceArt:'V5_PR20_9_CRAFT_DURABLE_SHADOW_NO_WRITE',
      status:'BESTANDEN',
      observedAtMs:Date.now(),
      sourceSnapshotCommit:SOURCE_SNAPSHOT_COMMIT,
      normalCraftOnly:true,
      anniversaryCraftAllowed:false,
      autoCraftAllowed:false,
      splitStackNormalCraftAllowed:false,
      recipient:record.recipient,
      serviceReachability:record.serviceReachability,
      candidate:record.candidate,
      fingerprints:{
        ...record.fingerprints,
        postIntentPrestate:postIntentPrestateFingerprintSha256
      },
      shadowIntent,
      stableDoubleObservation:true,
      stablePostIntentReobserve:true,
      durableTerminalIntentPresent:true,
      durableReadback:true,
      journalTerminalArt:'ABBRUCH',
      sendBoundaryState:'NICHT_GESENDET',
      reconciliationClassification:'NOT_APPLIED',
      exactPhysicalInputIndexesPinned:true,
      freshReresolutionRequiredBeforeFutureSend:true,
      gameplayWrites:0,
      publicFunctionCalls:0,
      rawWriteCalls:0,
      authorityIssued:false,
      craftAuthority:false,
      gameplayAuthority:false,
      rawWriteAuthority:false,
      broadGraphExecutionAuthority:false,
      sameIntentRetry:false,
      normalRuntimeAllowed:false,
      performanceTrick
    });
    emit('PR20_9_CRAFT_SHADOW_NO_WRITE_PASSED','INFO',{
      recipeName:record.candidate.recipeName,
      inputIndexes:record.candidate.inputs.map(x=>x.inventoryIndex)
    });
  }

  function run() {
    if(running) return running;
    cancelRecheck();
    running=Promise.resolve().then(execute).catch(error=>{
      const message=text(error?.message||error||'PR20_9_CRAFT_SHADOW_FEHLER',240);
      cancelRecheck();
      setState({
        status:'FEHLER',
        phase:'COMPLETE',
        terminal:true,
        error:message,
        blocker:[message],
        nextRecheckAtMs:null
      });
      emit('PR20_9_CRAFT_SHADOW_NO_WRITE_ERROR','ERROR',{reason:message});
    }).finally(()=>{ running=null; });
    return running;
  }

  const api=Object.freeze({
    version:VERSION,
    testId:TEST_ID,
    expectedGlobal:EXPECTED_GLOBAL,
    status:()=>clone(state),
    start:()=>run()
  });

  Object.defineProperty(globalThis,EXPECTED_GLOBAL,{
    configurable:true,enumerable:true,writable:false,value:api
  });
  try {
    if(globalThis.parent&&globalThis.parent!==globalThis) {
      Object.defineProperty(globalThis.parent,EXPECTED_GLOBAL,{
        configurable:true,enumerable:true,writable:false,value:api
      });
    }
  } catch {}

  Promise.resolve().then(run);
})();
