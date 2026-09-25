(() => {
  "use strict";

  const TEST_ID = "pr20-8-exchange-anniversarygift-autonomy-route-shadow-no-write";
  const VERSION = "1.0.0";
  const API_NAME = "V5PR208ExchangeAnniversarygiftAutonomyRouteShadowNoWrite";

  const EXPECTED_CHARACTER = "My_Merchant";
  const EXPECTED_CLASS = "merchant";
  const EXPECTED_SERVER_REGION = "EU";
  const EXPECTED_SERVER_IDENTIFIER = "I";

  const ITEM_NAME = "anniversarygift";
  const ITEM_TYPE = "gem";
  const ITEM_SKIN = "anniversarygift";
  const ITEM_DISPLAY_NAME = "Anniversary Gift";
  const ITEM_EXPLANATION = "Ten years, tied with a ribbon.";
  const ITEM_STACK_LIMIT = 9999;
  const ITEM_BASE_GOLD = 100;
  const EXCHANGE_QUANTITY = 1;
  const ITEM_ACCENT = "#3DB5A5";

  const OFFICIAL_SOURCE_COMMIT =
    "90052162eb3ebda36c893e1eb4af643913c8f984";
  const DROP_GRAPH_SHA256 =
    "2fad9b50ac0bb87a8e53a0cff8f6e34ded949b3531f8843f86d3f1fb8e828342";
  const SOURCE_MAPS_BLOB =
    "78350dac1a18c4eb0e7c6f545ebf08bb3d6729e4";
  const TARGET_POINT = Object.freeze({map:"main",x:-25,y:-478});
  const SOURCE_PINNED_SELL_DISTANCE = 400;
  const SAFETY_DISTANCE = 300;
  const REQUIRED_EMPTY_SLOTS = 1;
  const DOUBLE_OBSERVE_DELAY_MS = 350;
  const DECISION_PREFIX = "v5:" + TEST_ID + ":decision:";

  const events = [];
  let seq = 0;
  let runPromise = null;

  let state = {
    schemaVersion: 1,
    testId: TEST_ID,
    version: VERSION,
    phase: "PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_ROUTE_SHADOW",
    status: "BOOT",
    terminal: false,
    blocker: [],
    startedAtMs: Date.now(),
    updatedAtMs: Date.now(),
    recipient: null,
    candidate: null,
    definition: null,
    serviceReachability: null,
    fingerprints: null,
    autonomyDecision: null,
    recoveredExistingDecision: false,
    durableDecisionReadback: false,
    durableStorageWrites: 0,
    gameplayWrites: 0,
    publicFunctionCalls: 0,
    rawWriteCalls: 0,
    sameIntentRetry: false,
    exchangeAuthority: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    normalRuntimeAllowed: false,
    nextAction: null
  };

  function text(value,max=300){
    return String(value == null ? "" : value).trim().slice(0,max);
  }

  function clone(value){
    return JSON.parse(JSON.stringify(value));
  }

  function canonical(value){
    if(value === null || typeof value !== "object") return JSON.stringify(value);
    if(Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
    return "{" + Object.keys(value).sort()
      .map(key => JSON.stringify(key) + ":" + canonical(value[key]))
      .join(",") + "}";
  }

  function roots(){
    const out=[];
    try { out.push(globalThis); } catch {}
    try {
      if(globalThis.parent
        && globalThis.parent !== globalThis
        && !out.includes(globalThis.parent)) out.push(globalThis.parent);
    } catch {}
    return out;
  }

  function root(){
    for(const candidate of roots()){
      try {
        if(candidate?.character
          && Array.isArray(candidate.character.items)
          && candidate.G?.items) return candidate;
      } catch {}
    }
    throw new Error("PR20_8_EXCHANGE_AUTONOMY_SHADOW_SPIELKONTEXT_FEHLT");
  }

  function sleep(ms){
    return new Promise(resolve => setTimeout(resolve,ms));
  }

  async function sha256(value){
    const r=root();
    const cryptoApi=globalThis.crypto || r.crypto;
    const Encoder=globalThis.TextEncoder || r.TextEncoder;
    if(!cryptoApi?.subtle?.digest || typeof Encoder !== "function"){
      throw new Error("PR20_8_EXCHANGE_AUTONOMY_SHADOW_WEB_CRYPTO_UNAVAILABLE");
    }
    const bytes=new Encoder().encode(String(value));
    const digest=await cryptoApi.subtle.digest("SHA-256",bytes);
    return Array.from(new Uint8Array(digest),byte =>
      byte.toString(16).padStart(2,"0")).join("");
  }

  function stableScalarObject(value,maximumKeys=96){
    if(!value || typeof value !== "object") return {};
    const out={};
    for(const key of Object.keys(value).sort().slice(0,maximumKeys)){
      const v=value[key];
      if(v === null
        || typeof v === "string"
        || typeof v === "number"
        || typeof v === "boolean"){
        out[key]=v;
      } else if(v && typeof v === "object" && !Array.isArray(v)){
        const nested={};
        for(const nk of Object.keys(v).sort().slice(0,32)){
          const nv=v[nk];
          if(nv === null
            || typeof nv === "string"
            || typeof nv === "number"
            || typeof nv === "boolean") nested[nk]=nv;
        }
        out[key]=nested;
      }
    }
    return out;
  }

  function stableItemMaterial(item){
    return item && typeof item === "object"
      ? canonical(stableScalarObject(item,64))
      : null;
  }

  function stableQ(q){
    return canonical(stableScalarObject(q,64));
  }

  function stableInventory(items){
    return canonical(items.map(item =>
      item && typeof item === "object" ? stableScalarObject(item,64) : null));
  }

  function stableConditions(c){
    return canonical({
      massexchange:c.s?.massexchange || null,
      massexchangepp:c.s?.massexchangepp || null,
      moving:c.moving === true,
      target:c.target == null ? null : text(c.target,192)
    });
  }

  function storage(){
    for(const candidate of roots()){
      try {
        if(candidate?.localStorage
          && typeof candidate.localStorage.setItem === "function"
          && typeof candidate.localStorage.getItem === "function"
          && typeof candidate.localStorage.key === "function"){
          return candidate.localStorage;
        }
      } catch {}
    }
    throw new Error("PR20_8_EXCHANGE_AUTONOMY_SHADOW_DURABLE_STORAGE_UNAVAILABLE");
  }

  function readJson(key){
    const raw=storage().getItem(key);
    if(raw === null) return null;
    try { return JSON.parse(raw); }
    catch {
      throw new Error("PR20_8_EXCHANGE_AUTONOMY_SHADOW_DURABLE_JSON_BESCHAEDIGT");
    }
  }

  function writeDecisionExact(key,value){
    const ls=storage();
    const encoded=JSON.stringify(value);
    ls.setItem(key,encoded);
    const readback=ls.getItem(key);
    if(readback !== encoded){
      throw new Error("PR20_8_EXCHANGE_AUTONOMY_SHADOW_DURABLE_READBACK_MISMATCH");
    }
    return JSON.parse(readback);
  }

  function listDecisions(){
    const ls=storage();
    const out=[];
    for(let i=0;i<ls.length;i+=1){
      const key=ls.key(i);
      if(!key || !key.startsWith(DECISION_PREFIX)) continue;
      const value=readJson(key);
      if(value?.testId === TEST_ID) out.push({key,value});
    }
    return out;
  }

  function serverBinding(r){
    let p=null;
    try { if(r.parent && r.parent !== r) p=r.parent; } catch {}
    return {
      region:[r.server_region,r.server?.region,p?.server_region,p?.server?.region]
        .map(v=>text(v,32)).find(Boolean) || "",
      identifier:[r.server_identifier,r.server?.id,p?.server_identifier,p?.server?.id]
        .map(v=>text(v,32)).find(Boolean) || ""
    };
  }

  function runtimeConflict(r){
    try {
      const v3=r.AIO_V3?.__runtime;
      const s=v3 && typeof v3.status === "function" ? v3.status() : null;
      if(v3 && (v3.timer || s?.running === true)) return "AIO_V3_RUNTIME_ACTIVE";
    } catch { return "AIO_V3_RUNTIME_UNREADABLE"; }
    try {
      const v4=r.AIO_V4 || r.V4Runtime;
      const s=v4 && typeof v4.status === "function" ? v4.status() : null;
      if(s?.running === true || s?.aktivFreigegeben === true) return "V4_RUNTIME_ACTIVE";
    } catch { return "V4_RUNTIME_UNREADABLE"; }
    return null;
  }

  async function performanceStatus(){
    let available=false;
    let called=false;
    let lastError=null;
    for(const candidate of roots()){
      try {
        if(typeof candidate?.performance_trick !== "function") continue;
        available=true;
        candidate.performance_trick();
        called=true;
        break;
      } catch(error) {
        lastError=text(error?.message || error,160);
      }
    }
    if(called) await sleep(DOUBLE_OBSERVE_DELAY_MS);

    let audioFound=false;
    let playing=false;
    let cplaying=false;
    for(const candidate of roots()){
      try {
        const audio=candidate?.sounds?.empty;
        if(!audio) continue;
        audioFound=true;
        if(audio.cplaying === true) cplaying=true;
        if(typeof audio.playing === "function" && audio.playing() === true) playing=true;
        else if(audio.playing === true) playing=true;
      } catch {}
    }
    return {
      available,called,audioFound,playing,cplaying,
      active:available && called && audioFound && playing,
      verification:"HOWLER_PLAYING_TRUE",
      error:lastError
    };
  }

  function publicExchangeAvailable(){
    for(const candidate of roots()){
      try { if(typeof candidate?.exchange === "function") return true; } catch {}
    }
    return false;
  }

  function quantityOf(item){
    const n=Number(item?.q == null ? 1 : item.q);
    return Number.isSafeInteger(n) && n >= 1 ? n : null;
  }

  function physicalUnsafe(item){
    return !item
      || typeof item !== "object"
      || item.l === true
      || item.locked === true
      || item.lock === true
      || item.b === true
      || item.blocked === true
      || item.giveaway === true
      || item.list === true
      || item.expires != null
      || item.acl != null
      || item.rid != null
      || item.p != null
      || item.gift != null;
  }

  function exactDefinition(def){
    return Boolean(def
      && def.type === ITEM_TYPE
      && def.skin === ITEM_SKIN
      && def.name === ITEM_DISPLAY_NAME
      && def.explanation === ITEM_EXPLANATION
      && Number(def.s) === ITEM_STACK_LIMIT
      && Number(def.g) === ITEM_BASE_GOLD
      && Number(def.e) === EXCHANGE_QUANTITY
      && def.exclusive === true
      && def.cash !== true
      && def.event !== true
      && def.quest !== true
      && def.cx?.accent === ITEM_ACCENT);
  }

  function resolveCandidate(r){
    const def=r.G?.items?.[ITEM_NAME];
    if(!exactDefinition(def)){
      throw new Error("PR20_8_EXCHANGE_AUTONOMY_SHADOW_ITEM_DEFINITION_DRIFT");
    }
    const matches=[];
    for(let index=0;index<r.character.items.length && index<128;index+=1){
      const item=r.character.items[index];
      if(!item || item.name !== ITEM_NAME) continue;
      const quantity=quantityOf(item);
      if(quantity === null || quantity < EXCHANGE_QUANTITY || physicalUnsafe(item)) continue;
      matches.push({
        index,
        quantity,
        material:stableItemMaterial(item)
      });
    }
    if(matches.length === 0){
      throw new Error("PR20_8_EXCHANGE_AUTONOMY_SHADOW_EXAKTER_INPUT_FEHLT");
    }
    if(matches.length !== 1){
      throw new Error("PR20_8_EXCHANGE_AUTONOMY_SHADOW_KANDIDAT_MEHRDEUTIG:" + matches.length);
    }
    return {
      candidate:{
        name:ITEM_NAME,
        index:matches[0].index,
        quantity:matches[0].quantity,
        exchangeQuantity:EXCHANGE_QUANTITY,
        baseGold:ITEM_BASE_GOLD,
        exclusive:true,
        exclusiveTestException:true,
        material:matches[0].material,
        selectedByFreshAutonomousScan:true,
        observedIndexCarriesAuthority:false
      },
      definition:{
        type:ITEM_TYPE,
        skin:ITEM_SKIN,
        displayName:ITEM_DISPLAY_NAME,
        explanation:ITEM_EXPLANATION,
        stackLimit:ITEM_STACK_LIMIT,
        baseGold:ITEM_BASE_GOLD,
        exchangeQuantity:EXCHANGE_QUANTITY,
        exclusive:true,
        accent:ITEM_ACCENT
      }
    };
  }

  function emptySlots(c){
    let count=0;
    for(let i=0;i<c.items.length;i+=1) if(c.items[i] == null) count+=1;
    return count;
  }

  function serviceReachability(r){
    const c=r.character;
    const map=text(c.map,96);
    const x=Number(c.real_x ?? c.x);
    const y=Number(c.real_y ?? c.y);
    const distance=map === TARGET_POINT.map && Number.isFinite(x) && Number.isFinite(y)
      ? Math.hypot(x-TARGET_POINT.x,y-TARGET_POINT.y)
      : Number.POSITIVE_INFINITY;
    const currentSellDistance=Number(r.B?.sell_dist);
    if(Number.isFinite(currentSellDistance)
      && currentSellDistance > 0
      && currentSellDistance !== SOURCE_PINNED_SELL_DISTANCE){
      throw new Error("PR20_8_EXCHANGE_AUTONOMY_SHADOW_SELL_DIST_DRIFT");
    }
    return {
      map,x,y,distance,
      targetPoint:TARGET_POINT,
      sourcePinnedServerLimit:SOURCE_PINNED_SELL_DISTANCE,
      safetyLimit:SAFETY_DISTANCE,
      reachable:Number.isFinite(distance) && distance <= SAFETY_DISTANCE,
      viaComputer:false
    };
  }

  function strictAdmission(r){
    const c=r.character;
    const server=serverBinding(r);
    if(text(c.name,192) !== EXPECTED_CHARACTER
      || text(c.id,192) !== EXPECTED_CHARACTER){
      throw new Error("PR20_8_EXCHANGE_AUTONOMY_SHADOW_EXAKTER_MERCHANT_ERFORDERLICH");
    }
    if(text(c.ctype,32).toLowerCase() !== EXPECTED_CLASS){
      throw new Error("PR20_8_EXCHANGE_AUTONOMY_SHADOW_MERCHANT_KLASSE_ERFORDERLICH");
    }
    if(server.region !== EXPECTED_SERVER_REGION
      || server.identifier !== EXPECTED_SERVER_IDENTIFIER){
      throw new Error("PR20_8_EXCHANGE_AUTONOMY_SHADOW_SERVER_BINDUNG_DRIFT");
    }
    if(c.rip === true || c.dead === true){
      throw new Error("PR20_8_EXCHANGE_AUTONOMY_SHADOW_CHARACTER_TOT");
    }
    if(c.moving === true){
      throw new Error("PR20_8_EXCHANGE_AUTONOMY_SHADOW_CHARACTER_BEWEGT_SICH");
    }
    if(c.target != null && text(c.target,192)){
      throw new Error("PR20_8_EXCHANGE_AUTONOMY_SHADOW_CHARACTER_HAT_ZIEL");
    }
    if(c.q && typeof c.q === "object" && Object.keys(c.q).length > 0){
      throw new Error("PR20_8_EXCHANGE_AUTONOMY_SHADOW_Q_NICHT_FREI");
    }
    if(c.s?.massexchange){
      throw new Error("PR20_8_EXCHANGE_AUTONOMY_SHADOW_MASSEXCHANGE_AKTIV");
    }
    if(c.s?.massexchangepp){
      throw new Error("PR20_8_EXCHANGE_AUTONOMY_SHADOW_MASSEXCHANGEPP_AKTIV");
    }
    const conflict=runtimeConflict(r);
    if(conflict) throw new Error("PR20_8_EXCHANGE_AUTONOMY_SHADOW_RUNTIME_KONFLIKT:" + conflict);
    if(!publicExchangeAvailable()){
      throw new Error("PR20_8_EXCHANGE_AUTONOMY_SHADOW_PUBLIC_EXCHANGE_FEHLT");
    }
    const free=emptySlots(c);
    if(free < REQUIRED_EMPTY_SLOTS){
      throw new Error("PR20_8_EXCHANGE_AUTONOMY_SHADOW_LEERER_SLOT_FEHLT");
    }
    const service=serviceReachability(r);
    if(!service.reachable){
      throw new Error("PR20_8_EXCHANGE_AUTONOMY_SHADOW_SERVICE_NICHT_ERREICHBAR");
    }
    return {
      recipient:{
        characterName:text(c.name,192),
        sessionId:text(c.id,192),
        ctype:text(c.ctype,32).toLowerCase(),
        serverRegion:server.region,
        serverIdentifier:server.identifier
      },
      service,
      visibleEmptySlots:free
    };
  }

  async function observe(){
    const r=root();
    const admission=strictAdmission(r);
    const resolved=resolveCandidate(r);
    const material={
      recipient:admission.recipient,
      candidate:resolved.candidate,
      definition:resolved.definition,
      service:admission.service,
      visibleEmptySlots:admission.visibleEmptySlots,
      inventoryMaterial:stableInventory(r.character.items),
      qMaterial:stableQ(r.character.q),
      conditionsMaterial:stableConditions(r.character),
      sourceCommit:OFFICIAL_SOURCE_COMMIT,
      mapsBlob:SOURCE_MAPS_BLOB,
      dropGraphSha256:DROP_GRAPH_SHA256
    };
    return {
      ...admission,
      ...resolved,
      fingerprints:{
        inventory:await sha256(material.inventoryMaterial),
        q:await sha256(material.qMaterial),
        conditions:await sha256(material.conditionsMaterial),
        candidate:await sha256(resolved.candidate.material),
        definition:await sha256(canonical(resolved.definition)),
        autonomousPrestate:await sha256(canonical(material))
      }
    };
  }

  function sameObservation(a,b){
    return a.recipient.characterName === b.recipient.characterName
      && a.recipient.sessionId === b.recipient.sessionId
      && a.recipient.serverRegion === b.recipient.serverRegion
      && a.recipient.serverIdentifier === b.recipient.serverIdentifier
      && a.candidate.name === b.candidate.name
      && a.candidate.index === b.candidate.index
      && a.candidate.quantity === b.candidate.quantity
      && a.candidate.material === b.candidate.material
      && a.visibleEmptySlots === b.visibleEmptySlots
      && a.service.map === b.service.map
      && a.service.distance <= SAFETY_DISTANCE
      && b.service.distance <= SAFETY_DISTANCE
      && a.fingerprints.inventory === b.fingerprints.inventory
      && a.fingerprints.q === b.fingerprints.q
      && a.fingerprints.conditions === b.fingerprints.conditions
      && a.fingerprints.candidate === b.fingerprints.candidate
      && a.fingerprints.definition === b.fingerprints.definition
      && a.fingerprints.autonomousPrestate === b.fingerprints.autonomousPrestate;
  }

  function emit(type,severity,data={}){
    seq+=1;
    events.push({
      seq,
      ts:new Date().toISOString(),
      event:type,
      type,
      severity,
      component:"v5-pr20-8-exchange-anniversarygift-autonomy-route-shadow",
      data:clone(data)
    });
    if(events.length>1000) events.splice(0,events.length-1000);
  }

  function installFacade(owner){
    if(!owner) return;
    owner.AIO_V3=owner.AIO_V3 || {};
    const existing=owner.AIO_V3.operations && typeof owner.AIO_V3.operations === "object"
      ? owner.AIO_V3.operations : {};
    owner.AIO_V3.operations={
      ...existing,
      status:()=>{
        let base={};
        try { base=typeof existing.status === "function" ? existing.status() || {} : {}; }
        catch {}
        return {...base,v5AutonomousTest:clone(state)};
      },
      telemetry:(limit=1000)=>events.slice(-Math.max(1,Math.min(1000,Number(limit)||1000))),
      peekTelemetry:(limit=1000)=>events.slice(-Math.max(1,Math.min(1000,Number(limit)||1000)))
    };
  }

  function publish(){
    state={...state,updatedAtMs:Date.now()};
    for(const owner of roots()) installFacade(owner);
  }

  function finish(status,blocker=[],extra={}){
    state={
      ...state,...extra,
      status,
      phase:"COMPLETE",
      terminal:true,
      blocker,
      gameplayWrites:0,
      publicFunctionCalls:0,
      rawWriteCalls:0,
      sameIntentRetry:false,
      exchangeAuthority:false,
      gameplayAuthority:false,
      rawWriteAuthority:false,
      normalRuntimeAllowed:false,
      updatedAtMs:Date.now()
    };
    publish();
    emit("PR20_8_EXCHANGE_AUTONOMY_SHADOW_TERMINAL",
      status === "BESTANDEN" ? "info" : "warning",
      {status,blocker});
    return state;
  }

  function validateDecision(value){
    return value
      && value.schemaVersion === 1
      && value.testId === TEST_ID
      && value.version === VERSION
      && value.art === "PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_ROUTE_SHADOW_DECISION"
      && value.status === "SHADOW_ADMITTED_NO_SEND"
      && value.terminal === true
      && value.sendBoundaryState === "NICHT_GESENDET"
      && value.sendCount === 0
      && value.sameIntentRetry === false
      && value.exchangeAuthority === false
      && value.gameplayAuthority === false
      && value.rawWriteAuthority === false
      && value.sourceCommit === OFFICIAL_SOURCE_COMMIT
      && value.dropGraphSha256 === DROP_GRAPH_SHA256
      && value.candidate?.name === ITEM_NAME
      && value.candidate?.selectedByFreshAutonomousScan === true
      && value.candidate?.observedIndexCarriesAuthority === false;
  }

  async function recoverExisting(existing){
    if(!validateDecision(existing.value)){
      throw new Error("PR20_8_EXCHANGE_AUTONOMY_SHADOW_EXISTING_DECISION_UNGUELTIG");
    }
    const current=await observe();
    const d=existing.value;
    if(d.fingerprints?.autonomousPrestate !== current.fingerprints.autonomousPrestate
      || d.candidate?.index !== current.candidate.index
      || d.candidate?.quantity !== current.candidate.quantity
      || d.candidate?.material !== current.candidate.material){
      throw new Error("PR20_8_EXCHANGE_AUTONOMY_SHADOW_RECOVERY_PRESTATE_DRIFT");
    }
    return finish("BESTANDEN",[],{
      recipient:current.recipient,
      candidate:current.candidate,
      definition:current.definition,
      serviceReachability:current.service,
      fingerprints:current.fingerprints,
      autonomyDecision:d,
      recoveredExistingDecision:true,
      durableDecisionReadback:true,
      durableStorageWrites:0,
      nextAction:"PREPARE_ANNIVERSARYGIFT_EXCHANGE_AUTONOMY_PRODUCTIVE_ONE_WRITE"
    });
  }

  async function run(){
    try {
      publish();
      const existing=listDecisions();
      if(existing.length > 1){
        throw new Error("PR20_8_EXCHANGE_AUTONOMY_SHADOW_MEHRERE_DECISIONS");
      }
      if(existing.length === 1) return recoverExisting(existing[0]);

      const performance=await performanceStatus();
      if(!performance.active){
        throw new Error("PR20_8_EXCHANGE_AUTONOMY_SHADOW_PERFORMANCE_TRICK_NICHT_AKTIV");
      }

      const first=await observe();
      await sleep(DOUBLE_OBSERVE_DELAY_MS);
      const second=await observe();
      if(!sameObservation(first,second)){
        throw new Error("PR20_8_EXCHANGE_AUTONOMY_SHADOW_DOPPELBEOBACHTUNG_DRIFT");
      }

      const decisionId=second.fingerprints.autonomousPrestate;
      const key=DECISION_PREFIX+decisionId;
      const now=Date.now();
      const decision={
        schemaVersion:1,
        testId:TEST_ID,
        version:VERSION,
        art:"PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_ROUTE_SHADOW_DECISION",
        decisionId,
        createdAtMs:now,
        updatedAtMs:now,
        status:"SHADOW_ADMITTED_NO_SEND",
        terminal:true,
        sourceCommit:OFFICIAL_SOURCE_COMMIT,
        sourceMapsBlob:SOURCE_MAPS_BLOB,
        dropGraphSha256:DROP_GRAPH_SHA256,
        targetFunction:"exchange",
        sendBoundaryState:"NICHT_GESENDET",
        sendCount:0,
        sameIntentRetry:false,
        selectedWithoutManualInventoryIndex:true,
        freshCandidateReresolution:true,
        exactExclusiveExceptionItem:ITEM_NAME,
        genericExclusivePolicyRelaxed:false,
        recipient:second.recipient,
        candidate:second.candidate,
        definition:second.definition,
        serviceReachability:second.service,
        visibleEmptySlots:second.visibleEmptySlots,
        fingerprints:second.fingerprints,
        exchangeAuthority:false,
        gameplayAuthority:false,
        rawWriteAuthority:false,
        normalRuntimeAllowed:false
      };
      const persisted=writeDecisionExact(key,decision);
      if(!validateDecision(persisted) || persisted.decisionId !== decisionId){
        throw new Error("PR20_8_EXCHANGE_AUTONOMY_SHADOW_DURABLE_DECISION_DRIFT");
      }

      const after=await observe();
      if(after.fingerprints.autonomousPrestate !== second.fingerprints.autonomousPrestate
        || after.candidate.index !== second.candidate.index
        || after.candidate.quantity !== second.candidate.quantity){
        throw new Error("PR20_8_EXCHANGE_AUTONOMY_SHADOW_POST_DECISION_REOBSERVE_DRIFT");
      }

      return finish("BESTANDEN",[],{
        recipient:after.recipient,
        candidate:after.candidate,
        definition:after.definition,
        serviceReachability:after.service,
        fingerprints:after.fingerprints,
        autonomyDecision:persisted,
        durableDecisionReadback:true,
        durableStorageWrites:1,
        performanceTrick:performance,
        nextAction:"PREPARE_ANNIVERSARYGIFT_EXCHANGE_AUTONOMY_PRODUCTIVE_ONE_WRITE"
      });
    } catch(error){
      const reason=text(error?.message || error,500) || "UNBEKANNTER_FEHLER";
      emit("PR20_8_EXCHANGE_AUTONOMY_SHADOW_FEHLER","error",{reason});
      return finish("FEHLER",[reason],{
        nextAction:"REMAIN_BLOCKED_NO_EXCHANGE_AUTHORITY"
      });
    }
  }

  function startOnce(){
    if(runPromise === null) runPromise=run();
    return runPromise;
  }

  const api=Object.freeze({
    testId:TEST_ID,
    version:VERSION,
    status:()=>clone(state),
    telemetry:(limit=1000)=>events.slice(-Math.max(1,Math.min(1000,Number(limit)||1000))),
    start:()=>startOnce()
  });

  for(const owner of roots()){
    try {
      Object.defineProperty(owner,API_NAME,{
        configurable:true,
        enumerable:true,
        writable:false,
        value:api
      });
    } catch {
      try { owner[API_NAME]=api; } catch {}
    }
  }

  publish();
  Promise.resolve().then(startOnce).catch(()=>{});
})();