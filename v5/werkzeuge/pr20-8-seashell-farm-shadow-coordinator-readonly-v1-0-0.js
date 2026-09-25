(() => {
  "use strict";

  const TEST_ID = "pr20-8-seashell-farm-shadow-coordinator-readonly";
  const VERSION = "1.0.0";
  const API_NAME = "V5PR208SeashellFarmShadowCoordinatorReadonly";
  const EXPECTED_CHARACTER = "My_Merchant";
  const EXPECTED_SERVER_REGION = "EU";
  const EXPECTED_SERVER_IDENTIFIER = "I";
  const REQUIRED_QUANTITY = 20;
  const MIN_HP_RATIO = 0.8;
  const FARMERS = Object.freeze([
    Object.freeze({name:"My_Ranger1",ctype:"ranger"}),
    Object.freeze({name:"My_Priest",ctype:"priest"}),
    Object.freeze({name:"My_Mage",ctype:"mage"}),
  ]);

  const state = {
    schemaVersion:1,
    testId:TEST_ID,
    version:VERSION,
    phase:"PR20_8_SEASHELL_FARM_SHADOW_COORDINATOR_READONLY",
    status:"BOOT",
    terminal:false,
    blocker:[],
    nextAction:null,
    startedAtMs:Date.now(),
    updatedAtMs:Date.now(),
    rosterSource:null,
    rosterSourceCandidates:[],
    activeCharacters:[],
    observations:[],
    selectedWorker:null,
    performanceTrick:null,
    gameplayWrites:0,
    publicFunctionCalls:0,
    rawWriteCalls:0,
    startCalls:0,
    disconnectCalls:0,
    commandCharacterCalls:0,
    farmerWorkersInstalled:0,
    sameIntentRetry:false,
    normalRuntimeAllowed:false,
    authority:{
      authorityIssued:false,
      movementAuthority:false,
      combatAuthority:false,
      skillAuthority:false,
      lootAuthority:false,
      farmAuthority:false,
      handoffAuthority:false,
      exchangeAuthority:false,
      gameplayAuthority:false,
      rawWriteAuthority:false,
      durableIntentCreated:false,
    },
  };

  function text(value,max=192){
    return String(value==null?"":value).trim().slice(0,max);
  }
  function clone(value){ return JSON.parse(JSON.stringify(value)); }
  function sleep(ms){ return new Promise(resolve=>setTimeout(resolve,ms)); }

  function root(){
    try { if(globalThis.character) return globalThis; } catch {}
    try { if(parent && parent.character) return parent; } catch {}
    throw new Error("PR20_8_SEASHELL_COORDINATOR_CONTEXT_MISSING");
  }

  function roots(){
    const out=[];
    try { out.push(globalThis); } catch {}
    try {
      if(globalThis.parent
          && globalThis.parent!==globalThis
          && !out.includes(globalThis.parent)) out.push(globalThis.parent);
    } catch {}
    return out;
  }

  async function performanceStatus(){
    let available=false,called=false,error=null;
    for(const candidate of roots()){
      try {
        if(typeof candidate?.performance_trick!=="function") continue;
        available=true;
        candidate.performance_trick();
        called=true;
        break;
      } catch(cause){
        error=text(cause?.message||cause,160);
      }
    }
    if(called) await sleep(50);
    let audioFound=false,playing=false;
    for(const candidate of roots()){
      try {
        const sound=candidate?.sounds?.empty;
        if(!sound) continue;
        audioFound=true;
        if(sound.cplaying===true) playing=true;
        if(typeof sound.playing==="function" && sound.playing()===true) playing=true;
      } catch {}
    }
    return {
      available,called,error,audioFound,playing,
      active:available&&called&&audioFound&&playing,
      verification:playing?"HOWLER_PLAYING_TRUE":"HOWLER_PLAYING_FALSE",
    };
  }

  function installTelemetryFacade(owner){
    if(!owner) return;
    owner.AIO_V3=owner.AIO_V3||{};
    const existing=owner.AIO_V3.operations&&typeof owner.AIO_V3.operations==="object"
      ? owner.AIO_V3.operations
      : null;
    if(existing?.__v5Pr208SeashellShadowCoordinatorFacadeVersion===VERSION) return;
    const oldStatus=existing&&typeof existing.status==="function"
      ? existing.status.bind(existing)
      : null;
    const oldHeartbeat=existing&&typeof existing.hostHeartbeat==="function"
      ? existing.hostHeartbeat.bind(existing)
      : null;
    owner.AIO_V3.operations={
      ...(existing||{}),
      __v5Pr208SeashellShadowCoordinatorFacadeVersion:VERSION,
      status:()=>{
        let base={};
        try {
          const value=oldStatus?oldStatus():null;
          if(value&&typeof value==="object") base=value;
        } catch {}
        return {
          ...base,
          schemaVersion:Number(base.schemaVersion)||1,
          mode:"V5_AUTONOMOUS_TEST",
          v5AutonomousTest:clone(state),
          telemetry:{queued:0,lastCapturedSeq:0,dropped:0},
        };
      },
      hostHeartbeat:()=>{
        try {
          const value=oldHeartbeat?oldHeartbeat():null;
          if(value&&typeof value==="object"){
            return {
              ...value,
              v5Mode:"V5_AUTONOMOUS_TEST",
              v5TestId:TEST_ID,
              v5ObservedAtMs:Date.now(),
            };
          }
        } catch {}
        return {
          schemaVersion:1,
          mode:"V5_AUTONOMOUS_TEST",
          v5Mode:"V5_AUTONOMOUS_TEST",
          v5TestId:TEST_ID,
          alive:true,
          observedAtMs:Date.now(),
          v5ObservedAtMs:Date.now(),
        };
      },
      reconciliationStatus:()=>({
        schemaVersion:1,
        status:state.terminal?"TERMINAL_NO_MUTATION":"OBSERVING",
        v5AutonomousTestStatus:state.status,
        v5Terminal:state.terminal===true,
        sameIntentRetry:false,
      }),
      peekTelemetry:()=>[],
    };
  }

  function publish(){
    state.updatedAtMs=Date.now();
    for(const owner of roots()){
      try { installTelemetryFacade(owner); } catch {}
    }
  }

  function finish(status,blocker,nextAction){
    state.status=status;
    state.blocker=[...new Set(blocker)];
    state.nextAction=nextAction;
    state.terminal=true;
    state.phase=status==="BESTANDEN"
      ?"PR20_8_SEASHELL_FARM_SHADOW_COORDINATOR_COMPLETE"
      :"PR20_8_SEASHELL_FARM_SHADOW_COORDINATOR_READONLY";
    publish();
  }

  function candidateSources(){
    const candidates=[];
    const owners=roots();
    for(const owner of owners){
      try {
        if(typeof owner.get_characters==="function"){
          const rows=owner.get_characters();
          if(Array.isArray(rows)) candidates.push({source:"get_characters",rows});
        }
      } catch {}
      try {
        const rows=owner?.X?.characters;
        if(Array.isArray(rows)) candidates.push({source:"X.characters",rows});
      } catch {}
    }
    const scored=candidates.map(candidate=>{
      let exact=0,rich=0;
      for(const expected of FARMERS){
        const matches=candidate.rows.filter(row=>
          row&&typeof row==="object"
          &&text(row.name,64)===expected.name
          &&text(row.ctype||row.type,32).toLowerCase()===expected.ctype
        );
        if(matches.length===1){
          exact+=1;
          const row=matches[0];
          if(Array.isArray(row.items)
              &&Number.isFinite(Number(row.hp))
              &&Number.isFinite(Number(row.max_hp??row.maxHp))) rich+=1;
        }
      }
      return {
        ...candidate,
        exactFarmerRows:exact,
        richFarmerRows:rich,
        score:exact*1000+rich*100+(candidate.source==="X.characters"?1:0),
      };
    });
    scored.sort((a,b)=>b.score-a.score||a.source.localeCompare(b.source));
    return {
      selected:scored[0]||null,
      summary:scored.map(x=>({
        source:x.source,
        exactFarmerRows:x.exactFarmerRows,
        richFarmerRows:x.richFarmerRows,
        score:x.score,
      })),
    };
  }

  function activeNames(){
    const names=[];
    for(const owner of roots()){
      try {
        if(typeof owner.get_active_characters!=="function") continue;
        const raw=owner.get_active_characters();
        if(Array.isArray(raw)){
          for(const row of raw){
            const name=typeof row==="string"?row:text(row?.name,64);
            if(name) names.push(name);
          }
        } else if(raw&&typeof raw==="object"){
          for(const [key,value] of Object.entries(raw)){
            const name=text(
              typeof value==="object"&&value?.name?value.name:key,
              64,
            );
            if(name) names.push(name);
          }
        }
      } catch {}
    }
    return [...new Set(names)].sort();
  }

  function quantity(items,name){
    let total=0;
    for(const item of items){
      if(!item||text(item.name,96)!==name) continue;
      const q=Number(item.q==null?1:item.q);
      if(Number.isSafeInteger(q)&&q>0) total+=q;
    }
    return total;
  }

  function capacity(items,isize,currentQuantity){
    if(currentQuantity>0) return true;
    if(items.some(item=>item==null)) return true;
    return Number.isSafeInteger(isize)&&isize>items.length;
  }

  function observeWorker(row,expected){
    const items=Array.isArray(row?.items)?row.items:null;
    const hp=Number(row?.hp);
    const maxHp=Number(row?.max_hp??row?.maxHp);
    const hpRatio=Number.isFinite(hp)&&Number.isFinite(maxHp)&&maxHp>0?hp/maxHp:null;
    const currentQuantity=items?quantity(items,"seashell"):0;
    const isize=Number(row?.isize);
    const capacityAvailable=items?capacity(items,isize,currentQuantity):false;
    const active=state.activeCharacters.includes(expected.name);
    const lifecycleActive=row?.rip!==true&&row?.dead!==true;
    const handoffReady=active&&items!==null&&currentQuantity>=REQUIRED_QUANTITY;
    const localShadowReady=active
      &&items!==null
      &&lifecycleActive
      &&hpRatio!==null
      &&hpRatio>=MIN_HP_RATIO
      &&capacityAvailable;
    const blocker=[];
    if(!active) blocker.push("FARMER_NOT_ACTIVE");
    if(items===null) blocker.push("FARMER_INVENTORY_UNAVAILABLE");
    if(!lifecycleActive) blocker.push("FARMER_LIFECYCLE_NOT_ACTIVE");
    if(hpRatio===null||hpRatio<MIN_HP_RATIO) blocker.push("FARMER_HP_HARD_CAP");
    if(items!==null&&currentQuantity<REQUIRED_QUANTITY&&!capacityAvailable){
      blocker.push("FARMER_INVENTORY_CAPACITY_MISSING");
    }
    return {
      name:expected.name,
      ctype:expected.ctype,
      active,
      level:Number.isFinite(Number(row?.level))?Number(row.level):null,
      map:text(row?.map,96)||null,
      hp:Number.isFinite(hp)?hp:null,
      maxHp:Number.isFinite(maxHp)?maxHp:null,
      hpRatio,
      currentSeashellQuantity:currentQuantity,
      remainingQuantity:Math.max(0,REQUIRED_QUANTITY-currentQuantity),
      hasItemsArray:items!==null,
      inventorySize:Number.isSafeInteger(isize)?isize:null,
      capacityAvailable,
      lifecycleActive,
      handoffReady,
      localShadowReady,
      blocker,
    };
  }

  async function run(){
    publish();
    const r=root(),c=r.character;
    if(!c
        ||text(c.name,64)!==EXPECTED_CHARACTER
        ||text(c.ctype||c.type,32).toLowerCase()!=="merchant"){
      finish("BLOCKIERT",["PR20_8_SEASHELL_COORDINATOR_MERCHANT_CONTEXT_REQUIRED"],"REMAIN_BLOCKED");
      return;
    }
    const region=text(r.server_region??globalThis.server_region,16);
    const identifier=text(r.server_identifier??globalThis.server_identifier,16);
    if(region!==EXPECTED_SERVER_REGION||identifier!==EXPECTED_SERVER_IDENTIFIER){
      finish("BLOCKIERT",["PR20_8_SEASHELL_COORDINATOR_SERVER_DRIFT"],"REMAIN_BLOCKED");
      return;
    }
    state.performanceTrick=await performanceStatus();
    if(!state.performanceTrick.active){
      finish("BLOCKIERT",["PR20_8_SEASHELL_COORDINATOR_PERFORMANCE_TRICK_BLOCKED"],"REMAIN_BLOCKED");
      return;
    }

    const G=r.G||globalThis.G;
    const def=G?.items?.seashell;
    if(!def
        ||!G?.monsters?.croc
        ||Number(def.e)!==REQUIRED_QUANTITY
        ||Number(def.g)!==800
        ||def.quest!=="seashell"
        ||def.cash===true
        ||def.event===true
        ||def.exclusive===true){
      finish("BLOCKIERT",["PR20_8_SEASHELL_COORDINATOR_GAME_DATA_DRIFT"],"REMAIN_BLOCKED");
      return;
    }

    state.activeCharacters=activeNames();
    const found=candidateSources();
    state.rosterSource=found.selected?.source||null;
    state.rosterSourceCandidates=found.summary;
    if(!found.selected||found.selected.exactFarmerRows!==FARMERS.length){
      finish("BLOCKIERT",["PR20_8_SEASHELL_COORDINATOR_ROSTER_INCOMPLETE"],"REMAIN_BLOCKED");
      return;
    }

    const rows=found.selected.rows;
    state.observations=FARMERS.map(expected=>{
      const matches=rows.filter(row=>
        row&&typeof row==="object"
        &&text(row.name,64)===expected.name
        &&text(row.ctype||row.type,32).toLowerCase()===expected.ctype
      );
      return matches.length===1
        ? observeWorker(matches[0],expected)
        : {
            name:expected.name,
            ctype:expected.ctype,
            active:false,
            handoffReady:false,
            localShadowReady:false,
            blocker:["FARMER_ROW_NOT_EXACT"],
          };
    });

    const farmerIndex=name=>FARMERS.findIndex(x=>x.name===name);
    const handoff=state.observations.filter(x=>x.handoffReady).sort((a,b)=>
      b.currentSeashellQuantity-a.currentSeashellQuantity
      ||farmerIndex(a.name)-farmerIndex(b.name)
    );
    if(handoff.length){
      state.selectedWorker={...handoff[0],selectionReason:"SEASHELL_TARGET_ALREADY_SATISFIED"};
      finish("BESTANDEN",[],"PREPARE_SEASHELL_HANDOFF_SHADOW_NO_WRITE");
      return;
    }

    const candidates=state.observations.filter(x=>x.localShadowReady).sort((a,b)=>
      b.currentSeashellQuantity-a.currentSeashellQuantity
      ||farmerIndex(a.name)-farmerIndex(b.name)
    );
    if(!candidates.length){
      const rich=state.observations.some(x=>x.hasItemsArray===true);
      finish(
        "BLOCKIERT",
        [rich
          ?"PR20_8_SEASHELL_COORDINATOR_KEIN_SICHERER_AKTIVER_FARMER"
          :"PR20_8_SEASHELL_COORDINATOR_ROSTER_OHNE_LIVE_SAFETY"],
        "REMAIN_BLOCKED",
      );
      return;
    }

    state.selectedWorker={...candidates[0],selectionReason:"MINIMIZE_REMAINING_SEASHELLS_THEN_STABLE_FARMER_ORDER"};
    finish(
      "BESTANDEN",
      [],
      "PREPARE_SEASHELL_FARM_SHADOW_WORKER_DISTRIBUTION_NO_WRITE",
    );
  }

  const api=Object.freeze({
    version:VERSION,
    testId:TEST_ID,
    status:()=>clone(state),
  });
  Object.defineProperty(globalThis,API_NAME,{
    configurable:true,enumerable:true,writable:false,value:api,
  });
  try {
    if(parent&&parent!==globalThis){
      Object.defineProperty(parent,API_NAME,{
        configurable:true,enumerable:true,writable:false,value:api,
      });
    }
  } catch {}

  Promise.resolve().then(run).catch(error=>{
    state.error=text(error?.message||error,240);
    finish("FEHLER",["PR20_8_SEASHELL_COORDINATOR_UNEXPECTED_ERROR"],"REMAIN_BLOCKED");
  });
})();