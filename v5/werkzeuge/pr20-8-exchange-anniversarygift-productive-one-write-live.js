(() => {
  "use strict";

  const TEST_ID = "pr20-8-exchange-anniversarygift-productive-one-write-live";
  const VERSION = "1.0.0";
  const API_NAME = "V5PR208ExchangeAnniversarygiftProductiveOneWriteLive";
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

  const SOURCE_REPOSITORY = "kaansoral/adventureland_mongodb";
  const SOURCE_COMMIT = "90052162eb3ebda36c893e1eb4af643913c8f984";
  const DROP_GRAPH_SHA256 = "2fad9b50ac0bb87a8e53a0cff8f6e34ded949b3531f8843f86d3f1fb8e828342";
  const SOURCE_BLOBS = Object.freeze({
    drops: "cb9af901090eed78dd7ff5ae915874a9557409c4",
    items: "ca41b524c8bd795db40836525f7efd9626982c70",
    server: "40d0aeda16b9a4320441e833020fe1b4db496e2c",
    serverFunctions: "650797b87de128e85b2d01d574d5321a7144bef7",
    runnerFunctions: "8b40ac9931a48995cd179fa4cb6b3057df677b02",
    maps: "78350dac1a18c4eb0e7c6f545ebf08bb3d6729e4"
  });
  const PREREQUISITE_SHADOW_NOTIFICATION_ID = 2752;
  const PREREQUISITE_SCANNER_NOTIFICATION_ID = 2726;

  const EXCHANGE_POINT = Object.freeze({map:"main",x:-25,y:-478});
  const SOURCE_PINNED_SELL_DISTANCE = 400;
  const SERVICE_REACHABILITY_SAFETY_MAX = 300;
  const REQUIRED_EMPTY_SLOTS = 1;
  const DOUBLE_OBSERVE_DELAY_MS = 350;
  const AUTHORITY_TTL_MS = 1500;
  const FENCE_TTL_MS = 60000;
  const RECONCILE_ATTEMPTS = 160;
  const RECONCILE_DELAY_MS = 250;
  const PUBLIC_FUNCTION_PROMISE_TIMEOUT_MS = 2000;

  const ALLOWED_GOLD_DELTAS = Object.freeze([5000,20000]);
  const ALLOWED_CXJAR_DATA = Object.freeze(["makeawish","ikissyou"]);
  const ALLOWED_PHYSICAL_OUTPUTS = Object.freeze([
    "cxjar",
    "candleward","paradequiver","homecominghelm","homecomingcoat","homecomingcape",
    "guestbook","reunionbow","keepsakependant",
    "cake","poker","confetti","partyhat","gift0","ftrinket","scroll3","mysterybox",
    "offering","luckbooster",
    "coat","shoes","pants","gloves","helmet",
    "coat1","helmet1","pants1","hhelmet","harmor","hpants","hgloves","hboots","gloves1",
    "xhelmet","xarmor","xpants","xgloves","xboots","fury","starkillers","shoes1"
  ]);
  const ALLOWED_PHYSICAL_SET = new Set(ALLOWED_PHYSICAL_OUTPUTS);

  const RUNTIME_LEASE_KEY = "__V5PR208ExchangeAnniversaryGiftProductiveOneWriteLiveLease";
  const INTENT_PREFIX = "v5:" + TEST_ID + ":intent:";
  const AUTHORITY_PREFIX = "v5:" + TEST_ID + ":authority:";
  const FENCE_PREFIX = "v5:" + TEST_ID + ":fence:";
  const RESOURCE_CLAIMS = Object.freeze([
    "character:My_Merchant:inventory",
    "character:My_Merchant:q",
    "character:My_Merchant:socket_call_budget",
    "character:My_Merchant:action_channel:exchange",
    "character:My_Merchant:condition:massexchange",
    "character:My_Merchant:condition:massexchangepp"
  ]);

  const INSTANCE_ID = TEST_ID + ":" + Date.now() + ":" + Math.random().toString(36).slice(2,10);
  const events = [];
  let seq = 0;
  let recoveryTimer = null;
  let runPromise = null;

  let state = {
    schemaVersion: 1,
    testId: TEST_ID,
    version: VERSION,
    status: "BOOT",
    phase: "BOOT",
    startedAtMs: Date.now(),
    updatedAtMs: Date.now(),
    terminal: false,
    blocker: [],
    evidence: null,
    intents: [],
    gameplayWrites: 0,
    publicFunctionCalls: 0,
    rawWriteCalls: 0,
    startCalls: 0,
    disconnectCalls: 0,
    farmerWorkersInstalled: 0,
    sameIntentRetry: false,
    normalRuntimeAllowed: false,
    authority: {
      authorityIssued: false,
      authorityConsumed: false,
      durableIntentCreated: false,
      exchangeAuthority: false,
      gameplayAuthority: false,
      rawWriteAuthority: false,
      normalExchangeWriteRatification: false,
      maximumUses: 1
    }
  };

  function text(value,max=240){
    return String(value == null ? "" : value).trim().slice(0,max);
  }

  function clone(value){
    return JSON.parse(JSON.stringify(value));
  }

  function roots(){
    const out=[];
    try { out.push(globalThis); } catch {}
    try {
      if(globalThis.parent && globalThis.parent !== globalThis && !out.includes(globalThis.parent)){
        out.push(globalThis.parent);
      }
    } catch {}
    return out;
  }

  function root(){
    for(const candidate of roots()){
      try {
        if(candidate?.character
          && Array.isArray(candidate.character.items)
          && candidate.G?.items){
          return candidate;
        }
      } catch {}
    }
    throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_SPIELKONTEXT_FEHLT");
  }

  function sleep(ms){
    return new Promise(resolve=>setTimeout(resolve,ms));
  }

  function canonical(value){
    if(value === null || typeof value !== "object") return JSON.stringify(value);
    if(Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
    return "{" + Object.keys(value).sort()
      .map(key=>JSON.stringify(key)+":"+canonical(value[key]))
      .join(",") + "}";
  }

  async function sha256(value){
    const r=root();
    const cryptoApi=globalThis.crypto || r.crypto;
    const Encoder=globalThis.TextEncoder || r.TextEncoder;
    if(!cryptoApi?.subtle?.digest || typeof Encoder !== "function"){
      throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_WEB_CRYPTO_UNAVAILABLE");
    }
    const bytes=new Encoder().encode(String(value));
    const digest=await cryptoApi.subtle.digest("SHA-256",bytes);
    return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
  }

  function stableScalarObject(value,maximumKeys=96){
    if(!value || typeof value !== "object") return {};
    const out={};
    for(const key of Object.keys(value).sort().slice(0,maximumKeys)){
      const v=value[key];
      if(v === null || typeof v === "string" || typeof v === "number" || typeof v === "boolean"){
        out[key]=v;
      } else if(v && typeof v === "object" && !Array.isArray(v)){
        const nested={};
        for(const nk of Object.keys(v).sort().slice(0,32)){
          const nv=v[nk];
          if(nv === null || typeof nv === "string" || typeof nv === "number" || typeof nv === "boolean"){
            nested[nk]=nv;
          }
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

  function itemQuantity(item){
    if(!item || typeof item !== "object") return 0;
    const q=Number(item.q == null ? 1 : item.q);
    return Number.isSafeInteger(q) && q >= 1 ? q : -1;
  }

  function storage(){
    for(const candidate of roots()){
      try {
        if(candidate?.localStorage
          && typeof candidate.localStorage.getItem === "function"
          && typeof candidate.localStorage.setItem === "function"
          && typeof candidate.localStorage.removeItem === "function"){
          return candidate.localStorage;
        }
      } catch {}
    }
    throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_DURABLE_STORAGE_UNAVAILABLE");
  }

  function readJson(key){
    const raw=storage().getItem(key);
    if(raw === null) return null;
    try { return JSON.parse(raw); }
    catch { throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_DURABLE_JSON_BESCHAEDIGT"); }
  }

  function writeJsonExact(key,value){
    const encoded=JSON.stringify(value);
    storage().setItem(key,encoded);
    const readback=storage().getItem(key);
    if(readback !== encoded){
      throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_DURABLE_READBACK_MISMATCH");
    }
    return JSON.parse(readback);
  }

  function serverBinding(r){
    let parentRoot=null;
    try { if(r.parent && r.parent !== r) parentRoot=r.parent; } catch {}
    return {
      region:[
        r.server_region,r.server?.region,parentRoot?.server_region,parentRoot?.server?.region
      ].map(v=>text(v,32)).find(Boolean) || "",
      identifier:[
        r.server_identifier,r.server?.id,parentRoot?.server_identifier,parentRoot?.server?.id
      ].map(v=>text(v,32)).find(Boolean) || ""
    };
  }

  function runtimeConflict(r){
    try {
      const v3=r.AIO_V3?.__runtime;
      const status=v3 && typeof v3.status === "function" ? v3.status() : null;
      if(v3 && (v3.timer || status?.running === true)) return "AIO_V3_RUNTIME_ACTIVE";
    } catch { return "AIO_V3_RUNTIME_UNREADABLE"; }
    try {
      const v4=r.AIO_V4 || r.V4Runtime;
      const status=v4 && typeof v4.status === "function" ? v4.status() : null;
      if(status?.running === true || status?.aktivFreigegeben === true) return "V4_RUNTIME_ACTIVE";
    } catch { return "V4_RUNTIME_UNREADABLE"; }
    return null;
  }

  function hostileAggro(r){
    let hostile=0;
    for(const entity of Object.values(r.entities || {})){
      if(entity
        && entity.type === "monster"
        && !entity.dead
        && !entity.rip
        && text(entity.target,192) === EXPECTED_CHARACTER){
        hostile += 1;
      }
    }
    return hostile;
  }

  async function ensurePerformanceTrick(){
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
      } catch(error){
        lastError=text(error?.message || error,160);
      }
    }
    if(called) await sleep(350);
    const inspect=()=>{
      let audioFound=false;
      let playing=false;
      let cplaying=false;
      for(const candidate of roots()){
        try {
          const empty=candidate?.sounds?.empty;
          if(!empty) continue;
          audioFound=true;
          if(empty.cplaying === true) cplaying=true;
          if(typeof empty.playing === "function" && empty.playing() === true) playing=true;
          else if(empty.playing === true) playing=true;
        } catch {}
      }
      return {audioFound,playing,cplaying};
    };
    let status=inspect();
    if(available && called && !status.playing){
      for(const candidate of roots()){
        try {
          if(typeof candidate?.performance_trick === "function"){
            candidate.performance_trick();
            break;
          }
        } catch {}
      }
      await sleep(150);
      status=inspect();
    }
    return {
      available,
      called,
      audioFound:status.audioFound,
      playing:status.playing,
      cplaying:status.cplaying,
      active:available && called && status.audioFound && status.playing,
      verification:"HOWLER_PLAYING_TRUE",
      error:lastError
    };
  }

  function sellDistanceEvidence(){
    let observed=null;
    for(const candidate of roots()){
      try {
        const value=Number(candidate?.B?.sell_dist);
        if(Number.isFinite(value) && value > 0){
          observed=value;
          break;
        }
      } catch {}
    }
    if(Number.isFinite(observed) && observed !== SOURCE_PINNED_SELL_DISTANCE){
      throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_SELL_DIST_DRIFT");
    }
    return {
      value:Number.isFinite(observed) ? observed : SOURCE_PINNED_SELL_DISTANCE,
      source:Number.isFinite(observed) ? "LIVE_BROWSER_B" : "OFFICIAL_SERVER_SOURCE_PIN",
      browserObserved:Number.isFinite(observed)
    };
  }

  function serviceReachability(r,c){
    const sellDistance=sellDistanceEvidence();
    if(c.computer === true){
      return {
        reachable:true,
        viaComputer:true,
        distance:null,
        serverLimit:sellDistance.value,
        safetyLimit:SERVICE_REACHABILITY_SAFETY_MAX,
        servicePoint:EXCHANGE_POINT,
        sourceCommit:SOURCE_COMMIT
      };
    }
    if(text(c.map,96) !== EXCHANGE_POINT.map){
      throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_SERVICE_MAP_DRIFT");
    }
    const px=Number(c.real_x ?? c.x);
    const py=Number(c.real_y ?? c.y);
    if(![px,py].every(Number.isFinite)){
      throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_POSITION_UNLESBAR");
    }
    const distance=Math.hypot(px-EXCHANGE_POINT.x,py-EXCHANGE_POINT.y);
    const conservativeLimit=Math.min(sellDistance.value,SERVICE_REACHABILITY_SAFETY_MAX);
    if(!Number.isFinite(distance) || distance > conservativeLimit){
      throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_SERVICE_NICHT_ERREICHBAR");
    }
    return {
      reachable:true,
      viaComputer:false,
      distance,
      serverLimit:sellDistance.value,
      safetyLimit:conservativeLimit,
      servicePoint:EXCHANGE_POINT,
      sourceCommit:SOURCE_COMMIT
    };
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

  function candidateRows(items,G){
    const def=G.items?.[ITEM_NAME];
    if(!exactDefinition(def)){
      throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_ITEM_DEFINITION_DRIFT");
    }
    const rows=[];
    for(let index=0;index<items.length;index+=1){
      const item=items[index];
      if(!item || item.name !== ITEM_NAME || physicalUnsafe(item)) continue;
      const quantity=itemQuantity(item);
      if(quantity < EXCHANGE_QUANTITY) continue;
      rows.push({
        index,
        name:ITEM_NAME,
        quantity,
        exchangeQuantity:EXCHANGE_QUANTITY,
        baseGold:ITEM_BASE_GOLD,
        exclusive:true,
        material:stableItemMaterial(item)
      });
    }
    return rows.sort((a,b)=>a.index-b.index);
  }

  function inventoryUnits(items){
    const out={};
    for(const item of items){
      if(!item || item.name === "placeholder") continue;
      const q=itemQuantity(item);
      if(q < 0) continue;
      const key=item.name === "cxjar"
        ? "cxjar|"+text(item.data,128)
        : text(item.name,128);
      out[key]=(out[key] || 0)+q;
    }
    return out;
  }

  function countPlaceholders(items){
    return items.reduce((n,item)=>n+(item?.name === "placeholder" ? 1 : 0),0);
  }

  function countVisibleEmptySlots(c){
    const size=Number.isSafeInteger(Number(c.isize))
      ? Math.min(Number(c.isize),c.items.length)
      : c.items.length;
    let empty=0;
    for(let i=0;i<size;i+=1){
      if(c.items[i] == null) empty += 1;
    }
    return empty;
  }

  async function strictObservation(performance){
    const r=root();
    const c=r.character;
    if(text(c.name,192) !== EXPECTED_CHARACTER){
      throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_RECIPIENT_DRIFT");
    }
    if(text(c.id,192) !== EXPECTED_CHARACTER){
      throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_SESSION_DRIFT");
    }
    if(text(c.ctype || c.type,32).toLowerCase() !== EXPECTED_CLASS){
      throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_MERCHANT_ERFORDERLICH");
    }
    const server=serverBinding(r);
    if(server.region !== EXPECTED_SERVER_REGION || server.identifier !== EXPECTED_SERVER_IDENTIFIER){
      throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_SERVER_BINDUNG_DRIFT");
    }
    if(c.rip === true || c.dead === true){
      throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_CHARACTER_TOT");
    }
    if(c.moving === true){
      throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_CHARACTER_BEWEGT_SICH");
    }
    if(c.target !== null && c.target !== undefined && text(c.target,192)){
      throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_CHARACTER_HAT_ZIEL");
    }
    if(c.q && typeof c.q === "object" && Object.keys(c.q).length){
      throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_Q_NICHT_FREI");
    }
    if(text(c.map,96).startsWith("bank") || c.user){
      throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_BANK_KONTEXT_VERBOTEN");
    }
    const conflict=runtimeConflict(r);
    if(conflict){
      throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_ALTERNATIVE_RUNTIME_AKTIV:"+conflict);
    }
    if(hostileAggro(r) !== 0){
      throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_CHARACTER_UNTER_ANGRIFF");
    }
    if(!performance?.active){
      throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_PERFORMANCE_TRICK_NICHT_AKTIV");
    }
    if(typeof globalThis.exchange !== "function"){
      throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_CODE_WRAPPER_EXCHANGE_FEHLT");
    }
    if(c.s?.massexchange){
      throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_MASSEXCHANGE_AKTIV");
    }
    if(c.s?.massexchangepp){
      throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_MASSEXCHANGEPP_AKTIV");
    }

    const esize=Number(c.esize);
    const visibleEmptySlots=countVisibleEmptySlots(c);
    if(!Number.isFinite(esize) || esize < REQUIRED_EMPTY_SLOTS || visibleEmptySlots < REQUIRED_EMPTY_SLOTS){
      throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_OUTPUTSPACE_FEHLT");
    }

    const candidates=candidateRows(c.items,r.G);
    if(candidates.length !== 1){
      throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_KANDIDAT_NICHT_EINDEUTIG");
    }
    const candidate=candidates[0];
    const service=serviceReachability(r,c);
    const inventoryMaterial=canonical(c.items.map((item,index)=>[index,stableItemMaterial(item)]));
    const qMaterial=canonical(c.q || {});
    const conditionMaterial=canonical({
      massexchange:stableScalarObject(c.s?.massexchange || {},32),
      massexchangepp:stableScalarObject(c.s?.massexchangepp || {},32)
    });
    const definitionMaterial=canonical({
      name:ITEM_NAME,
      type:ITEM_TYPE,
      skin:ITEM_SKIN,
      displayName:ITEM_DISPLAY_NAME,
      explanation:ITEM_EXPLANATION,
      stackLimit:ITEM_STACK_LIMIT,
      baseGold:ITEM_BASE_GOLD,
      exchangeQuantity:EXCHANGE_QUANTITY,
      exclusive:true,
      cash:false,
      event:false,
      quest:false,
      accent:ITEM_ACCENT
    });
    const aggregate=inventoryUnits(c.items);
    const recipient={
      characterName:EXPECTED_CHARACTER,
      sessionId:EXPECTED_CHARACTER,
      ctype:EXPECTED_CLASS,
      level:Number(c.level || 0),
      map:text(c.map,96),
      serverRegion:server.region,
      serverIdentifier:server.identifier
    };
    const fingerprints={
      inventory:await sha256(inventoryMaterial),
      q:await sha256(qMaterial),
      candidate:await sha256(candidate.material),
      definition:await sha256(definitionMaterial),
      conditions:await sha256(conditionMaterial),
      aggregate:await sha256(canonical(aggregate))
    };
    fingerprints.prestate=await sha256(canonical({
      recipient,
      fingerprints,
      candidateIndex:candidate.index,
      candidateQuantity:candidate.quantity,
      esize,
      visibleEmptySlots,
      gold:Number(c.gold || 0),
      sourceCommit:SOURCE_COMMIT,
      dropGraphSha256:DROP_GRAPH_SHA256
    }));
    return {
      observedAtMs:Date.now(),
      recipient,
      service,
      candidate,
      inventoryMaterial,
      qMaterial,
      conditionMaterial,
      definitionMaterial,
      aggregate,
      gold:Number(c.gold || 0),
      esize,
      visibleEmptySlots,
      conditions:{
        massexchangePresent:false,
        massexchangeppPresent:false
      },
      source:{
        repository:SOURCE_REPOSITORY,
        commit:SOURCE_COMMIT,
        blobs:{...SOURCE_BLOBS},
        dropGraphSha256:DROP_GRAPH_SHA256
      },
      fingerprints
    };
  }

  function sameObservation(a,b){
    return a.fingerprints.prestate === b.fingerprints.prestate
      && a.candidate.index === b.candidate.index
      && a.candidate.quantity === b.candidate.quantity
      && a.esize === b.esize
      && a.visibleEmptySlots === b.visibleEmptySlots
      && a.gold === b.gold;
  }

  function intentKey(prestate){
    return INTENT_PREFIX+prestate;
  }

  function authorityKey(txId){
    return AUTHORITY_PREFIX+txId;
  }

  function fenceKey(resource){
    return FENCE_PREFIX+encodeURIComponent(resource);
  }

  function fenceOwner(txId){
    return txId+":instance:"+INSTANCE_ID;
  }

  function acquireRuntimeLease(){
    const r=root();
    const existing=r[RUNTIME_LEASE_KEY];
    if(existing?.instanceId && existing.instanceId !== INSTANCE_ID){
      throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_DUPLIKAT_INSTANZ_AKTIV");
    }
    const lease={
      schemaVersion:1,
      testId:TEST_ID,
      instanceId:INSTANCE_ID,
      acquiredAtMs:Date.now()
    };
    r[RUNTIME_LEASE_KEY]=lease;
    if(r[RUNTIME_LEASE_KEY]?.instanceId !== INSTANCE_ID){
      throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_RUNTIME_LEASE_VERLOREN");
    }
    return lease;
  }

  function assertRuntimeLease(){
    const current=root()[RUNTIME_LEASE_KEY];
    if(current?.instanceId !== INSTANCE_ID || current?.testId !== TEST_ID){
      throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_RUNTIME_LEASE_VERLOREN");
    }
  }

  function releaseRuntimeLease(){
    const r=root();
    if(r[RUNTIME_LEASE_KEY]?.instanceId === INSTANCE_ID){
      try { delete r[RUNTIME_LEASE_KEY]; }
      catch { r[RUNTIME_LEASE_KEY]=null; }
    }
  }

  function acquireFences(txId){
    const now=Date.now();
    const owner=fenceOwner(txId);
    for(const resource of RESOURCE_CLAIMS){
      const key=fenceKey(resource);
      const old=readJson(key);
      if(old && Number(old.expiresAtMs) > now && old.owner !== owner){
        throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_FENCE_BELEGT:"+resource);
      }
      writeJsonExact(key,{
        schemaVersion:1,
        testId:TEST_ID,
        resource,
        transactionId:txId,
        owner,
        ownerInstanceId:INSTANCE_ID,
        acquiredAtMs:now,
        expiresAtMs:now+FENCE_TTL_MS
      });
    }
    assertFences(txId);
  }

  function assertFences(txId){
    const owner=fenceOwner(txId);
    for(const resource of RESOURCE_CLAIMS){
      const current=readJson(fenceKey(resource));
      if(current?.owner !== owner
        || current?.ownerInstanceId !== INSTANCE_ID
        || Number(current.expiresAtMs) <= Date.now()){
        throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_FENCE_OWNERSHIP_VERLOREN:"+resource);
      }
    }
  }

  function releaseFences(txId){
    const ls=storage();
    const owner=fenceOwner(txId);
    for(const resource of RESOURCE_CLAIMS){
      const key=fenceKey(resource);
      const current=readJson(key);
      if(current?.owner === owner && current?.ownerInstanceId === INSTANCE_ID){
        ls.removeItem(key);
      }
    }
  }

  function findExistingIntent(){
    const ls=storage();
    const found=[];
    for(let i=0;i<ls.length;i+=1){
      const key=ls.key(i);
      if(!key || !key.startsWith(INTENT_PREFIX)) continue;
      const value=readJson(key);
      if(value?.testId === TEST_ID) found.push({key,value});
    }
    if(found.length > 1){
      throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_MEHRERE_INTENTS");
    }
    return found[0] || null;
  }

  function createIntent(observation){
    const pre=observation.fingerprints.prestate;
    const txId=TEST_ID+":"+pre.slice(0,32);
    const record={
      schemaVersion:1,
      testId:TEST_ID,
      version:VERSION,
      art:"PR20_8_EXCHANGE_ANNIVERSARYGIFT_PRODUCTIVE_ONE_WRITE_INTENT",
      transactionId:txId,
      attemptId:txId+":attempt:1",
      actionContractId:"AL-ACTION-EXCHANGE",
      recoveryContractId:"AL-RECOVERY-EXCHANGE",
      verifierId:"AL-VERIFIER-EXCHANGE",
      publicFunction:"exchange",
      publicFunctionSignature:"exchange(item_num)",
      sourceRepository:SOURCE_REPOSITORY,
      sourceSnapshotCommit:SOURCE_COMMIT,
      sourceBlobs:{...SOURCE_BLOBS},
      dropGraphSha256:DROP_GRAPH_SHA256,
      prerequisiteScannerNotificationId:PREREQUISITE_SCANNER_NOTIFICATION_ID,
      prerequisiteShadowNotificationId:PREREQUISITE_SHADOW_NOTIFICATION_ID,
      runnerInstanceId:INSTANCE_ID,
      createdAtMs:Date.now(),
      updatedAtMs:Date.now(),
      status:"INTENT_DURABLE",
      terminal:false,
      sendBoundaryState:"NICHT_GESENDET",
      sendCount:0,
      sameIntentRetry:false,
      resourceClaims:[...RESOURCE_CLAIMS],
      recipient:observation.recipient,
      serviceReachability:observation.service,
      candidate:{...observation.candidate},
      prestate:{
        aggregate:{...observation.aggregate},
        gold:observation.gold,
        esize:observation.esize,
        visibleEmptySlots:observation.visibleEmptySlots,
        fingerprints:{...observation.fingerprints}
      },
      rewardDomain:{
        rewardDomains:["gold","inventory","empty"],
        outputspaceClass:"PROBABILISTIC_BOUNDED_OUTPUT",
        maximumPhysicalOutputs:1,
        minimumPreSendEmptySlots:REQUIRED_EMPTY_SLOTS,
        allowedGoldDeltas:[...ALLOWED_GOLD_DELTAS],
        allowedPhysicalOutputs:[...ALLOWED_PHYSICAL_OUTPUTS],
        allowedCxjarData:[...ALLOWED_CXJAR_DATA],
        recursiveBranchesBounded:true,
        recursiveCycle:false,
        specialSixcakeMultiOutputApplies:false,
        promiseRewardSupportingOnly:true,
        fullPoststateReconciliationRequired:true
      },
      conditions:{...observation.conditions},
      authority:{
        class:"Pr208AnniversaryGiftExchangeOneShotAuthority",
        maximumUses:1,
        maximumTtlMs:AUTHORITY_TTL_MS,
        durableAuthorityWriteRequired:true,
        consumed:false
      },
      outcome:null
    };
    const key=intentKey(pre);
    const existing=readJson(key);
    if(existing) return {key,value:existing,existing:true};
    const persisted=writeJsonExact(key,record);
    if(persisted.runnerInstanceId !== INSTANCE_ID){
      throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_INTENT_OWNERSHIP_VERLOREN");
    }
    return {key,value:persisted,existing:false};
  }

  function issueAuthority(intent,observation){
    const now=Date.now();
    return writeJsonExact(authorityKey(intent.transactionId),{
      schemaVersion:1,
      testId:TEST_ID,
      transactionId:intent.transactionId,
      authorityClass:"Pr208AnniversaryGiftExchangeOneShotAuthority",
      actionContractId:"AL-ACTION-EXCHANGE",
      recoveryContractId:"AL-RECOVERY-EXCHANGE",
      verifierId:"AL-VERIFIER-EXCHANGE",
      issuedAtMs:now,
      expiresAtMs:now+AUTHORITY_TTL_MS,
      maximumUses:1,
      uses:0,
      consumed:false,
      revoked:false,
      sameIntentRetry:false,
      binding:{
        characterName:observation.recipient.characterName,
        sessionId:observation.recipient.sessionId,
        serverRegion:observation.recipient.serverRegion,
        serverIdentifier:observation.recipient.serverIdentifier,
        prestateFingerprintSha256:observation.fingerprints.prestate,
        inventoryFingerprintSha256:observation.fingerprints.inventory,
        qFingerprintSha256:observation.fingerprints.q,
        candidateFingerprintSha256:observation.fingerprints.candidate,
        definitionFingerprintSha256:observation.fingerprints.definition,
        conditionFingerprintSha256:observation.fingerprints.conditions,
        aggregateFingerprintSha256:observation.fingerprints.aggregate,
        candidateIndex:observation.candidate.index,
        candidateQuantity:observation.candidate.quantity,
        esize:observation.esize,
        visibleEmptySlots:observation.visibleEmptySlots,
        runnerInstanceId:INSTANCE_ID,
        sourceCommit:SOURCE_COMMIT,
        dropGraphSha256:DROP_GRAPH_SHA256
      }
    });
  }

  function consumeAuthority(intent,authority,observation){
    const now=Date.now();
    const b=authority.binding || {};
    const matches=authority.testId === TEST_ID
      && authority.transactionId === intent.transactionId
      && authority.authorityClass === "Pr208AnniversaryGiftExchangeOneShotAuthority"
      && authority.maximumUses === 1
      && authority.uses === 0
      && authority.consumed === false
      && authority.revoked === false
      && now <= Number(authority.expiresAtMs)
      && b.characterName === observation.recipient.characterName
      && b.sessionId === observation.recipient.sessionId
      && b.serverRegion === observation.recipient.serverRegion
      && b.serverIdentifier === observation.recipient.serverIdentifier
      && b.prestateFingerprintSha256 === observation.fingerprints.prestate
      && b.inventoryFingerprintSha256 === observation.fingerprints.inventory
      && b.qFingerprintSha256 === observation.fingerprints.q
      && b.candidateFingerprintSha256 === observation.fingerprints.candidate
      && b.definitionFingerprintSha256 === observation.fingerprints.definition
      && b.conditionFingerprintSha256 === observation.fingerprints.conditions
      && b.aggregateFingerprintSha256 === observation.fingerprints.aggregate
      && b.candidateIndex === observation.candidate.index
      && b.candidateQuantity === observation.candidate.quantity
      && b.esize === observation.esize
      && b.visibleEmptySlots === observation.visibleEmptySlots
      && b.runnerInstanceId === INSTANCE_ID
      && b.sourceCommit === SOURCE_COMMIT
      && b.dropGraphSha256 === DROP_GRAPH_SHA256;
    if(!matches){
      writeJsonExact(authorityKey(intent.transactionId),{
        ...authority,
        revoked:true,
        revokedAtMs:now
      });
      throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_AUTHORITY_BINDING_DRIFT");
    }
    return writeJsonExact(authorityKey(intent.transactionId),{
      ...authority,
      uses:1,
      consumed:true,
      consumedAtMs:now
    });
  }

  function updateIntent(key,current,patch){
    return writeJsonExact(key,{
      ...current,
      ...patch,
      updatedAtMs:Date.now()
    });
  }

  function aggregateDelta(before,after){
    const keys=[...new Set([...Object.keys(before || {}),...Object.keys(after || {})])].sort();
    const delta={};
    for(const key of keys){
      const d=Number(after?.[key] || 0)-Number(before?.[key] || 0);
      if(d !== 0) delta[key]=d;
    }
    return delta;
  }

  function classifyFinalOutcome(intent,c){
    const afterAggregate=inventoryUnits(c.items);
    const delta=aggregateDelta(intent.prestate.aggregate,afterAggregate);
    const goldDelta=Number(c.gold || 0)-Number(intent.prestate.gold || 0);
    const inputDelta=Number(delta[ITEM_NAME] || 0);
    const otherDelta={...delta};
    delete otherDelta[ITEM_NAME];

    const positives=[];
    const negatives=[];
    for(const [key,value] of Object.entries(otherDelta)){
      if(value > 0) positives.push([key,value]);
      if(value < 0) negatives.push([key,value]);
    }

    const inputConsumedExactly=inputDelta === -EXCHANGE_QUANTITY;
    const noOtherNegative=negatives.length === 0;
    const physicalRewardValid=positives.length === 1
      && positives[0][1] === 1
      && (
        (positives[0][0].startsWith("cxjar|")
          && ALLOWED_CXJAR_DATA.includes(positives[0][0].slice("cxjar|".length)))
        || ALLOWED_PHYSICAL_SET.has(positives[0][0])
      );
    const noPhysicalReward=positives.length === 0;

    let rewardKind=null;
    let reward=null;
    let valid=false;

    if(inputConsumedExactly && noOtherNegative){
      if(ALLOWED_GOLD_DELTAS.includes(goldDelta) && noPhysicalReward){
        rewardKind="gold";
        reward={gold:goldDelta};
        valid=true;
      } else if(goldDelta === 0 && physicalRewardValid){
        rewardKind="inventory";
        reward={key:positives[0][0],quantity:1};
        valid=true;
      } else if(goldDelta === 0 && noPhysicalReward){
        rewardKind="empty";
        reward={empty:true};
        valid=true;
      }
    }

    return {
      valid,
      rewardKind,
      reward,
      goldDelta,
      inputDelta,
      inputConsumedExactly,
      noOtherNegative,
      positives,
      negatives,
      aggregateDelta:delta,
      afterAggregate
    };
  }

  function recoverySnapshot(intent){
    const r=root();
    const c=r.character;
    const server=serverBinding(r);
    if(text(c.name,192) !== intent.recipient.characterName
      || text(c.id,192) !== intent.recipient.sessionId
      || server.region !== intent.recipient.serverRegion
      || server.identifier !== intent.recipient.serverIdentifier){
      return {classification:"UNRESOLVED",reason:"RECIPIENT_OR_SERVER_DRIFT"};
    }

    const qActive=!!c.q?.exchange;
    const placeholderCount=countPlaceholders(c.items);
    const candidateNow=c.items[intent.candidate.index] || null;
    const candidateQuantityNow=candidateNow?.name === ITEM_NAME
      ? itemQuantity(candidateNow)
      : 0;
    const expectedQuantity=Math.max(0,Number(intent.candidate.quantity)-EXCHANGE_QUANTITY);
    const inputProgressObserved=candidateQuantityNow === expectedQuantity;
    const domain=classifyFinalOutcome(intent,c);

    let classification="UNRESOLVED";
    let reason="POSTCONDITION_WIDERSPRUCH";
    if(!qActive && placeholderCount === 0 && domain.valid){
      classification="COMMITTED";
      reason=null;
    } else if(!qActive
      && placeholderCount === 0
      && canonical(inventoryUnits(c.items)) === canonical(intent.prestate.aggregate)
      && Number(c.gold || 0) === Number(intent.prestate.gold || 0)){
      classification="NOT_APPLIED";
      reason=null;
    } else if(qActive || placeholderCount > 0 || inputProgressObserved){
      classification="STILL_PENDING";
      reason=null;
    }

    return {
      classification,
      reason,
      qActive,
      placeholderCount,
      candidateIndex:intent.candidate.index,
      candidateQuantityBefore:intent.candidate.quantity,
      candidateQuantityNow,
      expectedQuantity,
      inputProgressObserved,
      rewardDomain:domain
    };
  }

  async function reconcile(intent){
    let acceptedEvidenceObserved=false;
    let last=null;
    for(let attempt=0;attempt<RECONCILE_ATTEMPTS;attempt+=1){
      last=recoverySnapshot(intent);
      if(last.qActive || last.placeholderCount > 0 || last.inputProgressObserved){
        acceptedEvidenceObserved=true;
      }
      if(last.classification === "COMMITTED" || last.classification === "NOT_APPLIED"){
        return {...last,acceptedEvidenceObserved,attempts:attempt+1};
      }
      await sleep(RECONCILE_DELAY_MS);
    }
    return {
      ...(last || {classification:"UNRESOLVED",reason:"NO_OBSERVATION"}),
      acceptedEvidenceObserved,
      attempts:RECONCILE_ATTEMPTS
    };
  }

  function emit(type,severity,data={}){
    seq += 1;
    events.push({
      seq,
      ts:new Date().toISOString(),
      event:type,
      type,
      severity,
      reason:data.reason || null,
      component:"v5-pr20-8-exchange-anniversarygift-productive-one-write-live",
      data
    });
    if(events.length > 2000) events.splice(0,events.length-2000);
  }

  function installTelemetryFacade(owner){
    if(!owner) return;
    owner.AIO_V3=owner.AIO_V3 || {};
    const existing=owner.AIO_V3.operations && typeof owner.AIO_V3.operations === "object"
      ? owner.AIO_V3.operations
      : {};
    owner.AIO_V3.operations={
      ...existing,
      status:()=>{
        let base={};
        try {
          base=typeof existing.status === "function" ? existing.status() || {} : {};
        } catch {}
        return {...base,v5AutonomousTest:state};
      },
      telemetry:(limit=2000)=>events.slice(-Math.max(1,Math.min(2000,Number(limit)||2000))),
      peekTelemetry:(limit=2000)=>events.slice(-Math.max(1,Math.min(2000,Number(limit)||2000)))
    };
  }

  function publishTelemetryFacades(){
    const r=root();
    installTelemetryFacade(r);
    if(globalThis !== r) installTelemetryFacade(globalThis);
    try {
      const host=globalThis.parent;
      if(host && host !== globalThis && host !== r) installTelemetryFacade(host);
    } catch {}
  }

  function setState(patch){
    state={...state,...patch,updatedAtMs:Date.now()};
    publishTelemetryFacades();
    return state;
  }

  function terminalEvidence(intent,outcome,extra={}){
    return {
      evidenceArt:"V5_PR20_8_EXCHANGE_ANNIVERSARYGIFT_PRODUCTIVE_ONE_WRITE_LIVE",
      status:outcome.classification === "COMMITTED"
        ? "BESTANDEN"
        : outcome.classification === "NOT_APPLIED" ? "NICHT_BESTANDEN" : "UNGEKLAERT",
      sourceRepository:SOURCE_REPOSITORY,
      sourceSnapshotCommit:SOURCE_COMMIT,
      sourceBlobs:{...SOURCE_BLOBS},
      dropGraphSha256:DROP_GRAPH_SHA256,
      prerequisiteScannerNotificationId:PREREQUISITE_SCANNER_NOTIFICATION_ID,
      prerequisiteShadowNotificationId:PREREQUISITE_SHADOW_NOTIFICATION_ID,
      recipient:intent.recipient,
      candidate:intent.candidate,
      serviceReachability:intent.serviceReachability,
      rewardDomain:intent.rewardDomain,
      publicFunction:"exchange",
      publicFunctionSignature:"exchange(item_num)",
      sendArguments:{candidateIndex:intent.candidate.index},
      durableIntentReadback:true,
      journalStatus:intent.status,
      sendBoundaryState:intent.sendBoundaryState,
      sendCount:intent.sendCount,
      sameIntentRetry:false,
      oneShotAuthorityMaximumUses:1,
      authorityConsumed:state.authority.authorityConsumed,
      reconciliation:outcome,
      gameplayWrites:state.gameplayWrites,
      publicFunctionCalls:state.publicFunctionCalls,
      rawWriteCalls:state.rawWriteCalls,
      normalRuntimeAllowed:false,
      ...extra
    };
  }

  function settleIntent(existing,outcome){
    const {key}=existing;
    const current=readJson(key) || existing.value;
    let journalStatus="RECOVERY_PENDING";
    let terminal=false;
    let runnerStatus="UNGEKLAERT";
    if(outcome.classification === "COMMITTED"){
      journalStatus="COMMITTED";
      terminal=true;
      runnerStatus="BESTANDEN";
    } else if(outcome.classification === "NOT_APPLIED"){
      journalStatus="FAILED_SAFE_NOT_APPLIED";
      terminal=true;
      runnerStatus="NICHT_BESTANDEN";
    }
    const settled=updateIntent(key,current,{
      status:journalStatus,
      terminal,
      sendBoundaryState:current.sendCount === 1
        ? "SEND_MOEGLICH_ODER_VERSUCHT"
        : "NICHT_GESENDET",
      outcome
    });
    if(terminal){
      releaseFences(settled.transactionId);
      releaseRuntimeLease();
    }
    const authority={
      ...state.authority,
      exchangeAuthority:false,
      gameplayAuthority:false,
      rawWriteAuthority:false
    };
    setState({
      status:runnerStatus,
      phase:terminal ? "COMPLETE" : "RECOVERY_PENDING",
      terminal,
      blocker:terminal ? [] : ["PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_RECOVERY_PENDING"],
      evidence:terminalEvidence(settled,outcome),
      intents:[{
        transactionId:settled.transactionId,
        status:settled.status,
        sendCount:settled.sendCount
      }],
      authority
    });
    emit(
      terminal ? "PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_TERMINAL"
        : "PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_RECOVERY_PENDING",
      terminal ? "info" : "warning",
      {classification:outcome.classification}
    );
    return state;
  }

  async function recoverExisting(existing){
    const intent=existing.value;
    if(intent.schemaVersion !== 1
      || intent.testId !== TEST_ID
      || intent.sourceSnapshotCommit !== SOURCE_COMMIT
      || intent.dropGraphSha256 !== DROP_GRAPH_SHA256
      || intent.sameIntentRetry !== false
      || !Number.isInteger(intent.sendCount)
      || intent.sendCount < 0
      || intent.sendCount > 1){
      throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_EXISTING_INTENT_UNGUELTIG");
    }
    const persistedAuthority=readJson(authorityKey(intent.transactionId));
    setState({
      phase:"RECOVERY",
      status:"RECOVERY",
      intents:[{
        transactionId:intent.transactionId,
        status:intent.status,
        sendCount:intent.sendCount
      }],
      gameplayWrites:intent.sendCount === 1 ? 1 : 0,
      publicFunctionCalls:intent.sendCount === 1 ? 1 : 0,
      rawWriteCalls:0,
      authority:{
        ...state.authority,
        durableIntentCreated:true,
        authorityIssued:!!persistedAuthority,
        authorityConsumed:persistedAuthority?.consumed === true,
        maximumUses:1
      }
    });

    if(intent.sendCount === 0 && intent.sendBoundaryState === "NICHT_GESENDET"){
      return settleIntent(existing,{
        classification:"NOT_APPLIED",
        reason:"DURABLE_INTENT_OHNE_SEND_RECORD",
        acceptedEvidenceObserved:false,
        attempts:0
      });
    }

    const outcome=await reconcile(intent);
    const settled=settleIntent(existing,outcome);
    if(!settled.terminal && recoveryTimer === null){
      recoveryTimer=setTimeout(async()=>{
        recoveryTimer=null;
        try {
          const fresh=findExistingIntent();
          if(fresh) await recoverExisting(fresh);
        } catch(error){
          fail(error);
        }
      },1000);
    }
    return settled;
  }

  async function performFreshOneWrite(performance){
    setState({phase:"PREFLIGHT",status:"PREFLIGHT"});
    const first=await strictObservation(performance);
    await sleep(DOUBLE_OBSERVE_DELAY_MS);
    const second=await strictObservation(performance);
    if(!sameObservation(first,second)){
      throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_DOUBLE_OBSERVE_DRIFT");
    }

    const existing=findExistingIntent();
    if(existing) return recoverExisting(existing);

    const created=createIntent(second);
    if(created.existing === true) return recoverExisting(created);
    let intent=created.value;

    state.authority={...state.authority,durableIntentCreated:true};
    state.intents=[{
      transactionId:intent.transactionId,
      status:intent.status,
      sendCount:intent.sendCount
    }];
    publishTelemetryFacades();

    acquireFences(intent.transactionId);
    assertRuntimeLease();

    const fresh=await strictObservation(performance);
    if(fresh.fingerprints.prestate !== intent.prestate.fingerprints.prestate
      || fresh.candidate.index !== intent.candidate.index
      || fresh.candidate.quantity !== intent.candidate.quantity
      || fresh.esize < REQUIRED_EMPTY_SLOTS
      || fresh.visibleEmptySlots < REQUIRED_EMPTY_SLOTS){
      releaseFences(intent.transactionId);
      intent=updateIntent(created.key,intent,{
        status:"ABORTED_FRESH_ADMISSION_DRIFT",
        terminal:true,
        sendBoundaryState:"NICHT_GESENDET",
        outcome:{classification:"NOT_APPLIED",reason:"FRESH_ADMISSION_DRIFT"}
      });
      releaseRuntimeLease();
      return setState({
        status:"NICHT_BESTANDEN",
        phase:"COMPLETE",
        terminal:true,
        blocker:["PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_FRESH_ADMISSION_DRIFT"],
        evidence:terminalEvidence(intent,intent.outcome),
        intents:[{
          transactionId:intent.transactionId,
          status:intent.status,
          sendCount:intent.sendCount
        }]
      });
    }

    const authority=issueAuthority(intent,fresh);
    state.authority={
      ...state.authority,
      authorityIssued:true,
      exchangeAuthority:true,
      gameplayAuthority:true,
      rawWriteAuthority:false
    };
    publishTelemetryFacades();

    const sendFresh=await strictObservation(performance);
    if(sendFresh.fingerprints.prestate !== intent.prestate.fingerprints.prestate
      || sendFresh.candidate.index !== intent.candidate.index
      || sendFresh.candidate.quantity !== intent.candidate.quantity
      || sendFresh.esize < REQUIRED_EMPTY_SLOTS
      || sendFresh.visibleEmptySlots < REQUIRED_EMPTY_SLOTS){
      writeJsonExact(authorityKey(intent.transactionId),{
        ...authority,
        revoked:true,
        revokedAtMs:Date.now()
      });
      state.authority={
        ...state.authority,
        exchangeAuthority:false,
        gameplayAuthority:false,
        rawWriteAuthority:false
      };
      releaseFences(intent.transactionId);
      intent=updateIntent(created.key,intent,{
        status:"ABORTED_FINAL_SEND_DRIFT",
        terminal:true,
        sendBoundaryState:"NICHT_GESENDET",
        outcome:{classification:"NOT_APPLIED",reason:"FINAL_SEND_DRIFT"}
      });
      releaseRuntimeLease();
      return setState({
        status:"NICHT_BESTANDEN",
        phase:"COMPLETE",
        terminal:true,
        blocker:["PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_FINAL_SEND_DRIFT"],
        evidence:terminalEvidence(intent,intent.outcome),
        intents:[{
          transactionId:intent.transactionId,
          status:intent.status,
          sendCount:intent.sendCount
        }]
      });
    }

    assertRuntimeLease();
    assertFences(intent.transactionId);
    const consumed=consumeAuthority(intent,authority,sendFresh);
    state.authority={
      ...state.authority,
      authorityConsumed:consumed.consumed === true
    };

    intent=updateIntent(created.key,intent,{
      status:"OUTCOME_PENDING",
      sendBoundaryState:"SEND_MOEGLICH_ODER_VERSUCHT",
      sendCount:1,
      authority:{...intent.authority,consumed:true,consumedAtMs:consumed.consumedAtMs}
    });
    state.intents=[{
      transactionId:intent.transactionId,
      status:intent.status,
      sendCount:intent.sendCount
    }];
    setState({phase:"SEND",status:"SEND"});

    let sendResult=null;
    let sendError=null;
    let sendPromiseTimedOut=false;
    let sendPromise=null;

    state.gameplayWrites += 1;
    state.publicFunctionCalls += 1;
    assertRuntimeLease();
    assertFences(intent.transactionId);
    try {
      sendPromise=Promise.resolve(globalThis.exchange(sendFresh.candidate.index));
    } catch(error){
      sendError=text(error?.message || error,500);
    }

    state.authority={
      ...state.authority,
      exchangeAuthority:false,
      gameplayAuthority:false,
      rawWriteAuthority:false
    };
    publishTelemetryFacades();

    if(sendPromise){
      const promiseObservation=await Promise.race([
        sendPromise.then(
          value=>({kind:"RESOLVED",value}),
          error=>({kind:"REJECTED",error:text(error?.message || error,500)})
        ),
        sleep(PUBLIC_FUNCTION_PROMISE_TIMEOUT_MS).then(()=>({kind:"TIMEOUT"}))
      ]);
      if(promiseObservation.kind === "RESOLVED") sendResult=promiseObservation.value;
      else if(promiseObservation.kind === "REJECTED") sendError=promiseObservation.error;
      else {
        sendPromiseTimedOut=true;
        sendError="PUBLIC_FUNCTION_PROMISE_TIMEOUT";
      }
    }

    setState({phase:"RECONCILE",status:"RECONCILE"});
    const outcome=await reconcile(intent);
    return settleIntent({key:created.key,value:intent},{
      ...outcome,
      promiseResultObserved:sendResult !== null && sendResult !== undefined,
      promiseResult:sendResult ?? null,
      promiseError:sendError,
      promiseTimedOut:sendPromiseTimedOut,
      promiseResultIsSupportingEvidenceOnly:true
    });
  }

  function fail(error){
    const message=text(error?.message || error,500) || "UNBEKANNTER_FEHLER";
    emit("PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_FEHLER","error",{reason:message});
    const safeZeroWriteNoIntentFailure=state.gameplayWrites === 0
      && state.publicFunctionCalls === 0
      && state.rawWriteCalls === 0
      && state.authority.durableIntentCreated === false
      && state.intents.length === 0;
    if(safeZeroWriteNoIntentFailure){
      try { releaseRuntimeLease(); } catch {}
    }
    setState({
      status:"FEHLER",
      phase:"ERROR",
      terminal:true,
      blocker:[message],
      authority:{
        ...state.authority,
        exchangeAuthority:false,
        gameplayAuthority:false,
        rawWriteAuthority:false
      }
    });
    return state;
  }

  async function run(){
    if(runPromise) return runPromise;
    runPromise=(async()=>{
      publishTelemetryFacades();
      acquireRuntimeLease();

      const existing=findExistingIntent();
      if(existing) return recoverExisting(existing);

      const performance=await ensurePerformanceTrick();
      if(!performance.active){
        throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_PERFORMANCE_TRICK_BLOCKED");
      }
      setState({
        performanceTrick:performance,
        sourceProof:{
          repository:SOURCE_REPOSITORY,
          commit:SOURCE_COMMIT,
          blobs:{...SOURCE_BLOBS},
          dropGraphSha256:DROP_GRAPH_SHA256,
          rewardDomains:["gold","inventory","empty"],
          outputspaceClass:"PROBABILISTIC_BOUNDED_OUTPUT",
          maximumPhysicalOutputs:1,
          minimumPreSendEmptySlots:1
        }
      });
      return performFreshOneWrite(performance);
    })().catch(fail);
    return runPromise;
  }

  const api=Object.freeze({
    version:VERSION,
    testId:TEST_ID,
    status:()=>clone(state),
    telemetry:(limit=200)=>clone(events.slice(-Math.max(1,Math.min(2000,Number(limit)||200))))
  });

  Object.defineProperty(globalThis,API_NAME,{
    configurable:true,
    enumerable:true,
    writable:false,
    value:api
  });
  try {
    if(parent && parent !== globalThis){
      Object.defineProperty(parent,API_NAME,{
        configurable:true,
        enumerable:true,
        writable:false,
        value:api
      });
    }
  } catch {}

  publishTelemetryFacades();
  Promise.resolve().then(run).catch(fail);
})();
