(() => {
  "use strict";

  const TEST_ID = "pr20-8-exchange-market-discovery";
  const VERSION = "1.0.0";
  const API_NAME = "V5PR208ExchangeMarketDiscovery";
  const EXPECTED_CHARACTER = "My_Merchant";
  const EXPECTED_CLASS = "merchant";
  const EXPECTED_SERVER_REGION = "EU";
  const EXPECTED_SERVER_IDENTIFIER = "I";
  const MAX_EXCHANGE_BASE_GOLD = 50000;
  const MAX_TOTAL_ACQUISITION_GOLD = 50000;
  const MIN_GOLD_RESERVE = 1000;
  const MAX_TRADE_DISTANCE = 400;
  const TARGET_MAP = "main";
  const POLL_MS = 250;
  const MOVE_TIMEOUT_MS = 120000;
  const DISCOVERY_WINDOW_MS = 5000;
  const SPECIAL_EXCHANGE_NAMES = Object.freeze(new Set(["sixcake"]));

  let state = {
    schemaVersion: 1,
    testId: TEST_ID,
    version: VERSION,
    phase: "PR20_8_EXCHANGE_MARKET_DISCOVERY",
    status: "BOOT",
    terminal: false,
    blocker: [],
    startedAtMs: Date.now(),
    updatedAtMs: Date.now(),
    recipient: null,
    movementTarget: TARGET_MAP,
    movementIssued: false,
    movementCompleted: false,
    movementError: null,
    visibleSellerCount: 0,
    eligibleListingCount: 0,
    selected: null,
    nextAction: null,
    gameplayWrites: 0,
    publicFunctionCalls: 0,
    rawWriteCalls: 0,
    sameIntentRetry: false,
    tradeBuyAuthority: false,
    farmAuthority: false,
    normalRuntimeAllowed: false,
  };

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const text = (v,max=192) => String(v == null ? "" : v).trim().slice(0,max);

  function roots() {
    const out = [];
    try { out.push(globalThis); } catch {}
    try {
      if (globalThis.parent && globalThis.parent !== globalThis && !out.includes(globalThis.parent)) {
        out.push(globalThis.parent);
      }
    } catch {}
    return out;
  }

  function root() {
    for (const r of roots()) {
      try {
        if (r?.character && Array.isArray(r.character.items) && r.G?.items) return r;
      } catch {}
    }
    throw new Error("PR20_8_MARKET_DISCOVERY_SPIELKONTEXT_FEHLT");
  }

  function serverBinding(r) {
    let p = null;
    try { if (r.parent && r.parent !== r) p = r.parent; } catch {}
    return {
      region: [r.server_region,r.server?.region,p?.server_region,p?.server?.region].map(v=>text(v,32)).find(Boolean)||"",
      identifier: [r.server_identifier,r.server?.id,p?.server_identifier,p?.server?.id].map(v=>text(v,32)).find(Boolean)||"",
    };
  }

  function runtimeConflict(r) {
    try {
      const v3=r.AIO_V3?.__runtime;
      const s=v3&&typeof v3.status==="function"?v3.status():null;
      if(v3&&(v3.timer||s?.running===true)) return "AIO_V3_RUNTIME_ACTIVE";
    } catch { return "AIO_V3_RUNTIME_UNREADABLE"; }
    try {
      const v4=r.AIO_V4||r.V4Runtime;
      const s=v4&&typeof v4.status==="function"?v4.status():null;
      if(s?.running===true||s?.aktivFreigegeben===true) return "V4_RUNTIME_ACTIVE";
    } catch { return "V4_RUNTIME_UNREADABLE"; }
    return null;
  }

  function unsafePhysical(item) {
    return !item
      || item.l===true || item.locked===true || item.lock===true
      || item.b===true || item.blocked===true || item.giveaway===true
      || item.expires!=null || item.acl!=null || item.p!=null || item.gift!=null;
  }

  function unsafeDefinition(def) {
    return !def || def.cash===true || def.event===true || def.quest===true || def.exclusive===true;
  }

  function distance(r,a,b) {
    try {
      if(typeof r.distance==="function") {
        const d=Number(r.distance(a,b));
        if(Number.isFinite(d)&&d>=0) return d;
      }
    } catch {}
    const ax=Number(a?.real_x??a?.x), ay=Number(a?.real_y??a?.y);
    const bx=Number(b?.real_x??b?.x), by=Number(b?.real_y??b?.y);
    if([ax,ay,bx,by].every(Number.isFinite)) return Math.hypot(ax-bx,ay-by);
    return Number.POSITIVE_INFINITY;
  }

  function listingCandidate(r,seller,slotName,listing) {
    if(!listing||typeof listing!=="object"||listing.b===true||listing.giveaway===true) return null;
    const rid=text(listing.rid,64);
    const name=text(listing.name,128);
    const def=r.G.items?.[name];
    const exchangeQuantity=Number(def?.e);
    const baseGold=Number(def?.g);
    const listingQuantity=Number(listing.q==null?1:listing.q);
    const unitPrice=Number(listing.price);
    if(!rid||!name
        ||!Number.isSafeInteger(exchangeQuantity)||exchangeQuantity<1
        ||!Number.isFinite(baseGold)||baseGold<0||baseGold>MAX_EXCHANGE_BASE_GOLD
        ||SPECIAL_EXCHANGE_NAMES.has(name)
        ||unsafePhysical(listing)||unsafeDefinition(def)
        ||!Number.isSafeInteger(listingQuantity)||listingQuantity<exchangeQuantity
        ||!Number.isSafeInteger(unitPrice)||unitPrice<1) return null;
    const totalCost=unitPrice*exchangeQuantity;
    if(!Number.isSafeInteger(totalCost)||totalCost<1||totalCost>MAX_TOTAL_ACQUISITION_GOLD) return null;
    const gold=Number(r.character.gold);
    if(!Number.isSafeInteger(gold)||gold<totalCost+MIN_GOLD_RESERVE) return null;
    const d=distance(r,r.character,seller);
    if(!Number.isFinite(d)||d>MAX_TRADE_DISTANCE) return null;
    return {
      targetCharacterId:text(seller.name||seller.id,192),
      targetEntityId:text(seller.id||seller.name,192),
      tradeSlot:slotName,
      rid,
      itemName:name,
      level:Number.isInteger(listing.level)&&listing.level>=0?listing.level:0,
      exchangeQuantity,
      listingQuantity,
      unitPrice,
      totalCost,
      baseGold,
      distance:Math.round(d*100)/100,
    };
  }

  function scan(r) {
    const c=r.character;
    const entities=r.entities || r.parent?.entities || {};
    const candidates=[];
    let visibleSellerCount=0;
    for(const id of Object.keys(entities)) {
      const seller=entities[id];
      if(!seller||seller.type!=="character"||seller.npc===true||seller.visible===false||seller.rip===true||seller.invincible===true) continue;
      if(text(seller.name||seller.id,192)===text(c.name,192)) continue;
      if(text(seller.map,96)!==text(c.map,96)) continue;
      visibleSellerCount+=1;
      const slots=seller.slots&&typeof seller.slots==="object"?seller.slots:{};
      for(const slotName of Object.keys(slots).filter(x=>/^trade[0-9]+$/.test(x)).sort()) {
        const candidate=listingCandidate(r,seller,slotName,slots[slotName]);
        if(candidate) candidates.push(candidate);
      }
    }
    candidates.sort((a,b)=>
      a.totalCost-b.totalCost
      ||a.baseGold-b.baseGold
      ||a.exchangeQuantity-b.exchangeQuantity
      ||a.itemName.localeCompare(b.itemName)
      ||a.targetCharacterId.localeCompare(b.targetCharacterId)
      ||a.tradeSlot.localeCompare(b.tradeSlot));
    return {visibleSellerCount,candidates};
  }

  function installTelemetry(owner) {
    if(!owner) return;
    owner.AIO_V3=owner.AIO_V3||{};
    const old=owner.AIO_V3.operations&&typeof owner.AIO_V3.operations==="object"?owner.AIO_V3.operations:{};
    const oldStatus=typeof old.status==="function"?old.status.bind(old):null;
    const oldHeartbeat=typeof old.hostHeartbeat==="function"?old.hostHeartbeat.bind(old):null;
    owner.AIO_V3.operations={
      ...old,
      __v5Pr208ExchangeMarketDiscoveryVersion:VERSION,
      status:()=>{
        let base={}; try{const v=oldStatus?oldStatus():null;if(v&&typeof v==="object")base=v}catch{}
        return {...base,schemaVersion:Number(base.schemaVersion)||1,mode:"V5_AUTONOMOUS_TEST",v5AutonomousTest:JSON.parse(JSON.stringify(state)),telemetry:{queued:0,lastCapturedSeq:0,dropped:0}};
      },
      hostHeartbeat:()=>{
        let base={}; try{const v=oldHeartbeat?oldHeartbeat():null;if(v&&typeof v==="object")base=v}catch{}
        const now=Date.now();
        return {...base,schemaVersion:Number(base.schemaVersion)||1,mode:"V5_AUTONOMOUS_TEST",v5Mode:"V5_AUTONOMOUS_TEST",v5TestId:TEST_ID,alive:true,observedAtMs:now,v5ObservedAtMs:now};
      },
      reconciliationStatus:()=>({schemaVersion:1,status:state.terminal?"TERMINAL_NO_RETRY":"OBSERVING",v5AutonomousTestStatus:state.status,v5Terminal:state.terminal===true,sameIntentRetry:false}),
      peekTelemetry:()=>[]
    };
  }

  function publish() {
    state.updatedAtMs=Date.now();
    for(const owner of roots()) { try{installTelemetry(owner)}catch{} }
  }

  function finish(status,blocker,patch={}) {
    state={...state,...patch,status,terminal:true,blocker:[...new Set(blocker||[])],updatedAtMs:Date.now()};
    publish();
    return state;
  }

  async function run() {
    try {
      publish();
      const r=root();
      const c=r.character;
      const server=serverBinding(r);
      const recipient={characterName:text(c.name,192),sessionId:text(c.id,192),serverRegion:server.region,serverIdentifier:server.identifier};
      if(recipient.characterName!==EXPECTED_CHARACTER) return finish("BLOCKIERT",["PR20_8_MARKET_DISCOVERY_EXAKTER_MERCHANT_ERFORDERLICH"],{recipient});
      if(text(c.ctype||c.type,32).toLowerCase()!==EXPECTED_CLASS) return finish("BLOCKIERT",["PR20_8_MARKET_DISCOVERY_MERCHANT_KLASSE_ERFORDERLICH"],{recipient});
      if(!recipient.sessionId) return finish("BLOCKIERT",["PR20_8_MARKET_DISCOVERY_SESSION_FEHLT"],{recipient});
      if(server.region!==EXPECTED_SERVER_REGION||server.identifier!==EXPECTED_SERVER_IDENTIFIER) return finish("BLOCKIERT",["PR20_8_MARKET_DISCOVERY_SERVER_BINDUNG_DRIFT"],{recipient});
      if(c.rip===true||c.dead===true) return finish("BLOCKIERT",["PR20_8_MARKET_DISCOVERY_CHARACTER_TOT"],{recipient});
      if(c.moving===true) return finish("BLOCKIERT",["PR20_8_MARKET_DISCOVERY_CHARACTER_BEWEGT_SICH"],{recipient});
      if(c.q&&typeof c.q==="object"&&Object.keys(c.q).length>0) return finish("BLOCKIERT",["PR20_8_MARKET_DISCOVERY_Q_NICHT_FREI"],{recipient});
      const conflict=runtimeConflict(r);
      if(conflict) return finish("BLOCKIERT",["PR20_8_MARKET_DISCOVERY_ALTERNATIVE_RUNTIME_AKTIV:"+conflict],{recipient});
      state={...state,recipient}; publish();

      if(/^bank/.test(text(c.map,96))) {
        let smartMove=null;
        for(const owner of roots()) {
          try{if(typeof owner?.smart_move==="function"){smartMove=owner.smart_move.bind(owner);break}}catch{}
        }
        if(!smartMove) return finish("BLOCKIERT",["PR20_8_MARKET_DISCOVERY_SMART_MOVE_FEHLT"],{nextAction:"REMAIN_BLOCKED_NO_MOVEMENT_CALL"});
        state={...state,movementIssued:true,gameplayWrites:1,publicFunctionCalls:1}; publish();
        let movementError=null;
        try {
          const result=smartMove(TARGET_MAP);
          if(result&&typeof result.then==="function") result.catch(e=>{movementError=text(e?.message||e,500)||"MOVE_FAILED"});
        } catch(e) { movementError=text(e?.message||e,500)||"MOVE_FAILED"; }
        const started=Date.now();
        while(Date.now()-started<=MOVE_TIMEOUT_MS) {
          if(text(c.map,96)===TARGET_MAP) { state={...state,movementCompleted:true,movementError}; publish(); break; }
          if(movementError) return finish("FEHLER",["PR20_8_MARKET_DISCOVERY_MOVE_FEHLER_NO_RETRY"],{movementError,nextAction:"RECONCILE_MOVEMENT_OUTCOME_NO_RETRY"});
          await sleep(POLL_MS);
        }
        if(!state.movementCompleted) return finish("BLOCKIERT",["PR20_8_MARKET_DISCOVERY_MOVE_TIMEOUT_NO_RETRY"],{movementError,nextAction:"RECONCILE_MOVEMENT_OUTCOME_NO_RETRY"});
      }

      const started=Date.now();
      let last={visibleSellerCount:0,candidates:[]};
      while(Date.now()-started<=DISCOVERY_WINDOW_MS) {
        last=scan(r);
        state={...state,visibleSellerCount:last.visibleSellerCount,eligibleListingCount:last.candidates.length,selected:last.candidates[0]||null}; publish();
        if(last.candidates[0]) {
          return finish("BESTANDEN",[],{visibleSellerCount:last.visibleSellerCount,eligibleListingCount:last.candidates.length,selected:last.candidates[0],nextAction:"PREPARE_EXACT_TRADE_BUY_ONE_SHOT"});
        }
        await sleep(POLL_MS);
      }
      return finish("BLOCKIERT",["PR20_8_ACQUISITION_KEIN_MARKET_KANDIDAT"],{visibleSellerCount:last.visibleSellerCount,eligibleListingCount:0,selected:null,nextAction:"PREPARE_SEASHELL_FARM_STAGE"});
    } catch(error) {
      return finish("FEHLER",[text(error?.message||error,500)||"PR20_8_MARKET_DISCOVERY_UNBEKANNTER_FEHLER"],{nextAction:"REMAIN_BLOCKED_NO_RETRY"});
    }
  }

  let runPromise=null;
  function start(){if(runPromise===null)runPromise=run();return runPromise;}
  publish();
  const api=Object.freeze({testId:TEST_ID,version:VERSION,status:()=>state,start});
  globalThis[API_NAME]=api;
  try{const r=root();if(r!==globalThis)r[API_NAME]=api}catch{}
  try{if(globalThis.parent&&globalThis.parent!==globalThis)globalThis.parent[API_NAME]=api}catch{}
  Promise.resolve().then(start).catch(()=>{});
})();