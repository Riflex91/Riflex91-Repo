(() => {
  "use strict";

  const TEST_ID = "pr20-8-exchange-normal-source-discovery";
  const VERSION = "1.0.0";
  const API_NAME = "V5PR208ExchangeNormalSourceDiscovery";
  const EXPECTED_CHARACTER = "My_Merchant";
  const EXPECTED_CLASS = "merchant";
  const EXPECTED_SERVER_REGION = "EU";
  const EXPECTED_SERVER_IDENTIFIER = "I";
  const MAX_EXCHANGE_BASE_GOLD = 50000;
  const SPECIAL_EXCHANGE_NAMES = Object.freeze(new Set(["sixcake"]));

  let state = {
    schemaVersion: 1,
    testId: TEST_ID,
    version: VERSION,
    phase: "PR20_8_EXCHANGE_NORMAL_SOURCE_DISCOVERY",
    status: "BOOT",
    terminal: false,
    blocker: [],
    startedAtMs: Date.now(),
    updatedAtMs: Date.now(),
    recipient: null,
    scannerCandidateDefinitionCount: 0,
    sourceBackedCandidateCount: 0,
    purchaseCandidateCount: 0,
    farmCandidateCount: 0,
    selected: null,
    unsupportedCandidates: [],
    nextAction: null,
    gameplayWrites: 0,
    publicFunctionCalls: 0,
    rawWriteCalls: 0,
    sameIntentRetry: false,
    npcBuyAuthority: false,
    tradeBuyAuthority: false,
    farmAuthority: false,
    exchangeAuthority: false,
    normalRuntimeAllowed: false,
  };

  const text = (v,max=192) => String(v == null ? "" : v).trim().slice(0,max);

  function roots() {
    const out = [];
    try { out.push(globalThis); } catch {}
    try {
      if (globalThis.parent && globalThis.parent !== globalThis && !out.includes(globalThis.parent)) out.push(globalThis.parent);
    } catch {}
    return out;
  }

  function root() {
    for (const r of roots()) {
      try {
        if (r?.character && Array.isArray(r.character.items) && r.G?.items) return r;
      } catch {}
    }
    throw new Error("PR20_8_SOURCE_DISCOVERY_SPIELKONTEXT_FEHLT");
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

  function scannerCompatibleDefinition(name,def) {
    if(!def||typeof def!=="object") return null;
    const exchangeQuantity=Number(def.e);
    const baseGold=Number(def.g);
    if(!Number.isSafeInteger(exchangeQuantity)||exchangeQuantity<1) return null;
    if(!Number.isFinite(baseGold)||baseGold<0||baseGold>MAX_EXCHANGE_BASE_GOLD) return null;
    if(SPECIAL_EXCHANGE_NAMES.has(name)) return null;
    if(def.cash===true||def.event===true||def.quest===true||def.exclusive===true) return null;
    return {itemName:name,exchangeQuantity,baseGold};
  }

  function npcSources(G,itemName) {
    const out=[];
    const npcs=G?.npcs&&typeof G.npcs==="object"?G.npcs:{};
    for(const npcId of Object.keys(npcs).sort()) {
      const npc=npcs[npcId];
      if(!npc||typeof npc!=="object"||text(npc.role,64)!=="merchant"||!Array.isArray(npc.items)) continue;
      if(!npc.items.some(v=>v===itemName)) continue;
      out.push({
        npcId:text(npcId,128),
        name:text(npc.name||npcId,192),
        role:"merchant",
      });
    }
    return out;
  }

  function monsterSources(G,itemName) {
    const out=[];
    const monsters=G?.drops?.monsters&&typeof G.drops.monsters==="object"?G.drops.monsters:{};
    for(const monsterName of Object.keys(monsters).sort()) {
      const rows=Array.isArray(monsters[monsterName])?monsters[monsterName]:[];
      for(let index=0;index<rows.length;index+=1) {
        const row=rows[index];
        if(!Array.isArray(row)||row.length<2||row[1]!==itemName) continue;
        const chance=Number(row[0]);
        if(!Number.isFinite(chance)||chance<=0) continue;
        const qCandidate=Number(row[2]);
        const quantity=Number.isSafeInteger(qCandidate)&&qCandidate>0?qCandidate:1;
        out.push({
          monsterName:text(monsterName,128),
          chance,
          quantity,
          rowIndex:index,
        });
      }
    }
    return out;
  }

  function discover(G) {
    const definitions=[];
    const backed=[];
    const unsupported=[];
    const items=G?.items&&typeof G.items==="object"?G.items:{};
    for(const itemName of Object.keys(items).sort()) {
      const base=scannerCompatibleDefinition(itemName,items[itemName]);
      if(!base) continue;
      const npcMerchants=npcSources(G,itemName);
      const monsterDrops=monsterSources(G,itemName);
      const row={
        ...base,
        npcMerchants,
        monsterDrops,
        sourceKind:npcMerchants.length?"NPC_PURCHASE":monsterDrops.length?"MONSTER_DROP":null,
        estimatedNpcAcquisitionGold:npcMerchants.length?base.baseGold*base.exchangeQuantity:null,
      };
      definitions.push(row);
      if(row.sourceKind) backed.push(row);
      else unsupported.push({
        itemName:row.itemName,
        exchangeQuantity:row.exchangeQuantity,
        baseGold:row.baseGold,
      });
    }
    backed.sort((a,b)=>
      (a.sourceKind==="NPC_PURCHASE"?0:1)-(b.sourceKind==="NPC_PURCHASE"?0:1)
      ||Number(a.estimatedNpcAcquisitionGold??Number.MAX_SAFE_INTEGER)-Number(b.estimatedNpcAcquisitionGold??Number.MAX_SAFE_INTEGER)
      ||a.baseGold-b.baseGold
      ||a.exchangeQuantity-b.exchangeQuantity
      ||a.itemName.localeCompare(b.itemName));
    return {
      definitions,
      backed,
      unsupported,
      purchaseCandidateCount:backed.filter(x=>x.sourceKind==="NPC_PURCHASE").length,
      farmCandidateCount:backed.filter(x=>x.sourceKind==="MONSTER_DROP").length,
    };
  }

  function installTelemetry(owner) {
    if(!owner) return;
    owner.AIO_V3=owner.AIO_V3||{};
    const old=owner.AIO_V3.operations&&typeof owner.AIO_V3.operations==="object"?owner.AIO_V3.operations:{};
    const oldStatus=typeof old.status==="function"?old.status.bind(old):null;
    const oldHeartbeat=typeof old.hostHeartbeat==="function"?old.hostHeartbeat.bind(old):null;
    owner.AIO_V3.operations={
      ...old,
      __v5Pr208ExchangeNormalSourceDiscoveryVersion:VERSION,
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

  function run() {
    try {
      publish();
      const r=root();
      const c=r.character;
      const server=serverBinding(r);
      const recipient={characterName:text(c.name,192),sessionId:text(c.id,192),serverRegion:server.region,serverIdentifier:server.identifier};
      if(recipient.characterName!==EXPECTED_CHARACTER) return finish("BLOCKIERT",["PR20_8_SOURCE_DISCOVERY_EXAKTER_MERCHANT_ERFORDERLICH"],{recipient});
      if(text(c.ctype||c.type,32).toLowerCase()!==EXPECTED_CLASS) return finish("BLOCKIERT",["PR20_8_SOURCE_DISCOVERY_MERCHANT_KLASSE_ERFORDERLICH"],{recipient});
      if(!recipient.sessionId) return finish("BLOCKIERT",["PR20_8_SOURCE_DISCOVERY_SESSION_FEHLT"],{recipient});
      if(server.region!==EXPECTED_SERVER_REGION||server.identifier!==EXPECTED_SERVER_IDENTIFIER) return finish("BLOCKIERT",["PR20_8_SOURCE_DISCOVERY_SERVER_BINDUNG_DRIFT"],{recipient});
      if(c.rip===true||c.dead===true) return finish("BLOCKIERT",["PR20_8_SOURCE_DISCOVERY_CHARACTER_TOT"],{recipient});
      if(c.moving===true) return finish("BLOCKIERT",["PR20_8_SOURCE_DISCOVERY_CHARACTER_BEWEGT_SICH"],{recipient});
      if(c.q&&typeof c.q==="object"&&Object.keys(c.q).length>0) return finish("BLOCKIERT",["PR20_8_SOURCE_DISCOVERY_Q_NICHT_FREI"],{recipient});
      const conflict=runtimeConflict(r);
      if(conflict) return finish("BLOCKIERT",["PR20_8_SOURCE_DISCOVERY_ALTERNATIVE_RUNTIME_AKTIV:"+conflict],{recipient});

      const found=discover(r.G);
      const selected=found.backed[0]||null;
      const patch={
        recipient,
        scannerCandidateDefinitionCount:found.definitions.length,
        sourceBackedCandidateCount:found.backed.length,
        purchaseCandidateCount:found.purchaseCandidateCount,
        farmCandidateCount:found.farmCandidateCount,
        selected,
        unsupportedCandidates:found.unsupported.slice(0,64),
      };
      if(selected?.sourceKind==="NPC_PURCHASE") {
        return finish("BESTANDEN",[],{...patch,nextAction:"PREPARE_EXACT_NPC_BUY_ONE_SHOT"});
      }
      if(selected?.sourceKind==="MONSTER_DROP") {
        return finish("BESTANDEN",[],{...patch,nextAction:"PREPARE_BOUNDED_FARM_SHADOW"});
      }
      return finish("BLOCKIERT",["PR20_8_ACQUISITION_KEINE_NORMALQUELLE_GEFUNDEN"],{...patch,nextAction:"REMAIN_BLOCKED_NO_NORMAL_ACQUISITION_SOURCE"});
    } catch(error) {
      return finish("FEHLER",[text(error?.message||error,500)||"PR20_8_SOURCE_DISCOVERY_UNBEKANNTER_FEHLER"],{nextAction:"REMAIN_BLOCKED_NO_RETRY"});
    }
  }

  let runResult=null;
  function start(){if(runResult===null)runResult=run();return runResult;}
  publish();
  const api=Object.freeze({testId:TEST_ID,version:VERSION,status:()=>state,start});
  globalThis[API_NAME]=api;
  try{const r=root();if(r!==globalThis)r[API_NAME]=api}catch{}
  try{if(globalThis.parent&&globalThis.parent!==globalThis)globalThis.parent[API_NAME]=api}catch{}
  Promise.resolve().then(start).catch(()=>{});
})();
