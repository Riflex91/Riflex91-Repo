(() => {
  "use strict";

  const VERSION = "1.0.0";
  const TEST_ID = "pr20-7-gear-weapon-offhand-equip-live-5m";
  const SAFE_SLOTS = Object.freeze(["mainhand","offhand"]);
  const EXPECTED = Object.freeze({
    characterName: "My_Merchant",
    serverRegion: "EU",
    serverIdentifier: "I",
    slot: "offhand",
    candidateName: "wshield",
    candidateType: "shield",
    mainhandName: "staff"
  });
  const DOUBLE_OBSERVE_DELAY_MS = 350;
  const RECONCILE_ATTEMPTS = 8;
  const RECONCILE_DELAY_MS = 250;
  const SOAK_SAMPLES = 60;
  const SOAK_INTERVAL_MS = 5000;
  const FENCE_TTL_MS = 10000;
  const INTENT_PREFIX = "v5:" + TEST_ID + ":intent:";
  const FENCE_PREFIX = "v5:" + TEST_ID + ":fence:";

  const events = [];
  let seq = 0;
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
    sameIntentRetry: false,
    startCalls: 0,
    disconnectCalls: 0,
    farmerWorkersInstalled: 0,
    normalRuntimeAllowed: false,
    authority: {
      authorityIssued: false,
      authorityConsumed: false,
      gameplayAuthority: false,
      rawWriteAuthority: false,
      weaponOffhandWriteRatification: false,
      maximumUses: 1
    },
    supabase: {
      transport: "WINDOWS_BRIDGE_5S_LOCAL_OBSERVE_60S_AGGREGATE_PLUS_TERMINAL_PUSH",
      localObservationSeconds: 5,
      statusIntervalSeconds: 60,
      terminalEventImmediate: true
    }
  };

  function txt(value, max = 240) {
    return String(value == null ? "" : value).trim().slice(0, max);
  }

  function roots() {
    const out = [];
    try { out.push(globalThis); } catch {}
    try {
      if (globalThis.parent && globalThis.parent !== globalThis
          && !out.includes(globalThis.parent)) out.push(globalThis.parent);
    } catch {}
    return out;
  }

  function root() {
    for (const candidate of roots()) {
      try {
        if (candidate?.character
            && Array.isArray(candidate.character.items)
            && candidate.character.slots
            && candidate.G?.items) return candidate;
      } catch {}
    }
    throw new Error("PR20_7_GEAR_LIVE_SPIELKONTEXT_FEHLT");
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function canonical(value) {
    if (value === null || typeof value !== "object") return JSON.stringify(value);
    if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
    return "{" + Object.keys(value).sort()
      .map(key => JSON.stringify(key) + ":" + canonical(value[key]))
      .join(",") + "}";
  }

  async function sha256(value) {
    const r = root();
    const cryptoApi = globalThis.crypto || r.crypto;
    if (!cryptoApi?.subtle?.digest) {
      throw new Error("PR20_7_GEAR_LIVE_WEB_CRYPTO_UNAVAILABLE");
    }
    const bytes = new TextEncoder().encode(String(value));
    const digest = await cryptoApi.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), byte =>
      byte.toString(16).padStart(2, "0")).join("");
  }

  function stableItemMaterial(item) {
    if (!item || typeof item !== "object") return null;
    const out = {};
    for (const key of Object.keys(item).sort().slice(0, 64)) {
      const value = item[key];
      if (value === null
          || typeof value === "string"
          || typeof value === "number"
          || typeof value === "boolean") out[key] = value;
    }
    return canonical(out);
  }

  function serverBinding(r) {
    let parentRoot = null;
    try { if (r.parent && r.parent !== r) parentRoot = r.parent; } catch {}
    const region = [
      r.server_region,r.server?.region,parentRoot?.server_region,parentRoot?.server?.region
    ].map(value => txt(value, 32)).find(Boolean) || "";
    const identifier = [
      r.server_identifier,r.server?.id,parentRoot?.server_identifier,parentRoot?.server?.id
    ].map(value => txt(value, 32)).find(Boolean) || "";
    return { region, identifier };
  }

  function accountId(r) {
    for (const candidate of roots()) {
      try {
        const value = txt(candidate?.user_id || candidate?.character?.owner || "", 192);
        if (value) return value;
      } catch {}
    }
    return txt(r.character?.owner || "", 192);
  }

  function runtimeConflict(r) {
    try {
      const v3 = r.AIO_V3?.__runtime;
      const status = v3 && typeof v3.status === "function" ? v3.status() : null;
      if (v3 && (v3.timer || status?.running === true)) return "AIO_V3_RUNTIME_ACTIVE";
    } catch { return "AIO_V3_RUNTIME_UNREADABLE"; }
    try {
      const v4 = r.AIO_V4 || r.V4Runtime;
      const status = v4 && typeof v4.status === "function" ? v4.status() : null;
      if (status?.running === true || status?.aktivFreigegeben === true) {
        return "V4_RUNTIME_ACTIVE";
      }
    } catch { return "V4_RUNTIME_UNREADABLE"; }
    return null;
  }

  async function ensurePerformanceTrick() {
    let available = false;
    let called = false;
    let lastError = null;
    for (const candidate of roots()) {
      try {
        if (typeof candidate?.performance_trick !== "function") continue;
        available = true;
        candidate.performance_trick();
        called = true;
        break;
      } catch (error) {
        lastError = txt(error?.message || error, 160);
      }
    }
    if (called) await sleep(350);
    const inspect = () => {
      let audioFound = false;
      let playing = false;
      let cplaying = false;
      for (const candidate of roots()) {
        try {
          const empty = candidate?.sounds?.empty;
          if (!empty) continue;
          audioFound = true;
          if (empty.cplaying === true) cplaying = true;
          if (typeof empty.playing === "function" && empty.playing() === true) playing = true;
        } catch {}
      }
      return { audioFound, playing, cplaying };
    };
    let status = inspect();
    if (available && called && !status.playing) {
      for (const candidate of roots()) {
        try {
          if (typeof candidate?.performance_trick === "function") {
            candidate.performance_trick();
            break;
          }
        } catch {}
      }
      await sleep(150);
      status = inspect();
    }
    return {
      available,called,audioFound:status.audioFound,playing:status.playing,
      cplaying:status.cplaying,
      active:available && called && status.audioFound && status.playing,
      verification:"HOWLER_PLAYING_TRUE",
      error:lastError
    };
  }

  function observation() {
    const r = root();
    const c = r.character;
    const server = serverBinding(r);
    const account = accountId(r);
    if (!account) throw new Error("PR20_7_WEAPON_OFFHAND_EQUIP_LIVE_ACCOUNT_BINDUNG_FEHLT");
    if (!txt(c.name,192)) throw new Error("PR20_7_WEAPON_OFFHAND_EQUIP_LIVE_CHARACTER_BINDUNG_FEHLT");
    if (!txt(c.id,192)) throw new Error("PR20_7_WEAPON_OFFHAND_EQUIP_LIVE_SESSION_BINDUNG_FEHLT");
    if (!server.region || !server.identifier) throw new Error("PR20_7_WEAPON_OFFHAND_EQUIP_LIVE_SERVER_BINDUNG_FEHLT");
    if (txt(c.ctype,32).toLowerCase() !== "merchant") throw new Error("PR20_7_WEAPON_OFFHAND_EQUIP_LIVE_MERCHANT_COORDINATOR_ERFORDERLICH");
    if (c.rip === true || c.dead === true) throw new Error("PR20_7_WEAPON_OFFHAND_EQUIP_LIVE_CHARACTER_TOT");
    if (c.moving === true) throw new Error("PR20_7_WEAPON_OFFHAND_EQUIP_LIVE_CHARACTER_BEWEGT_SICH");
    if (c.target !== null && c.target !== undefined && txt(c.target,192)) throw new Error("PR20_7_WEAPON_OFFHAND_EQUIP_LIVE_CHARACTER_HAT_ZIEL");
    if (c.q && typeof c.q === "object" && Object.keys(c.q).length) throw new Error("PR20_7_WEAPON_OFFHAND_EQUIP_LIVE_CHARACTER_QUEUE_AKTIV");
    const conflict = runtimeConflict(r);
    if (conflict) throw new Error("PR20_7_WEAPON_OFFHAND_EQUIP_LIVE_ALTERNATIVE_RUNTIME_AKTIV:" + conflict);
    let hostile = 0;
    for (const entity of Object.values(r.entities || {})) {
      if (entity && entity.type === "monster" && !entity.dead && !entity.rip
          && txt(entity.target,192) === txt(c.name,192)) hostile += 1;
    }
    if (hostile !== 0) throw new Error("PR20_7_WEAPON_OFFHAND_EQUIP_LIVE_CHARACTER_UNTER_ANGRIFF");

    const inventory = c.items.map((item,index) => {
      if (!item || !item.name) return null;
      const def = r.G.items[item.name] || {};
      return {
        index,name:txt(item.name,128),level:Number(item.level || 0),
        type:txt(def.type,64),wtype:txt(def.wtype,64),
        classList:Array.isArray(def.class) ? def.class.map(x => txt(x,32).toLowerCase()) : [],
        requiredLevel:Number.isFinite(Number(def.level)) ? Number(def.level) : 0,
        locked:item.l === true || item.locked === true || item.lock === true,
        virtualB:item.b === true,material:stableItemMaterial(item)
      };
    }).filter(Boolean);

    const slots = {};
    for (const slot of SAFE_SLOTS) {
      const item = c.slots?.[slot] || null;
      if (!item || !item.name) { slots[slot] = null; continue; }
      const def = r.G.items[item.name] || {};
      slots[slot] = {
        slot,name:txt(item.name,128),level:Number(item.level || 0),
        type:txt(def.type,64),wtype:txt(def.wtype,64),
        locked:item.l === true || item.locked === true || item.lock === true,
        virtualB:item.b === true,material:stableItemMaterial(item)
      };
    }
    const merchantClass = r.G?.classes?.merchant || {};
    const classRules = {
      mainhandWtypes:Object.keys(merchantClass.mainhand || {}),
      doublehandWtypes:Object.keys(merchantClass.doublehand || {}),
      offhandKinds:Object.keys(merchantClass.offhand || {})
    };
    return {
      account,characterName:txt(c.name,192),sessionId:txt(c.id,192),
      ctype:txt(c.ctype,32).toLowerCase(),level:Number(c.level || 0),
      map:txt(c.map,96),serverRegion:server.region,serverIdentifier:server.identifier,
      inventory,slots,classRules
    };
  }

  function chooseCandidate(observed) {
    if (observed.characterName !== EXPECTED.characterName
        || observed.serverRegion !== EXPECTED.serverRegion
        || observed.serverIdentifier !== EXPECTED.serverIdentifier) return null;
    if (observed.slots.offhand !== null) return null;
    const mainhand = observed.slots.mainhand;
    if (!mainhand || mainhand.name !== EXPECTED.mainhandName
        || mainhand.locked || mainhand.virtualB) return null;
    if (observed.classRules.doublehandWtypes.includes(mainhand.wtype)) return null;
    if (!observed.classRules.offhandKinds.includes(EXPECTED.candidateType)) return null;

    const candidates = observed.inventory.filter(item =>
      Number.isInteger(item.index) && item.index >= 0 && item.index < 128
      && item.name === EXPECTED.candidateName
      && item.type === EXPECTED.candidateType
      && !item.locked && !item.virtualB
      && !!item.material
      && (!item.classList.length || item.classList.includes("merchant"))
      && item.requiredLevel <= observed.level
    );
    if (candidates.length !== 1) return null;
    const item = candidates[0];
    const restInventory = observed.inventory
      .filter(row => row.index !== item.index)
      .map(row => [row.index,row.material]);
    const restEquipment = SAFE_SLOTS
      .filter(slot => slot !== EXPECTED.slot)
      .map(slot => [slot,observed.slots[slot]?.material ?? null]);
    return {
      slot:EXPECTED.slot,inventoryIndex:item.index,candidate:item,previous:null,
      mainhand,restInventoryMaterial:canonical(restInventory),
      restEquipmentMaterial:canonical(restEquipment),
      classRulesMaterial:canonical(observed.classRules)
    };
  }

  function identity(observed, selected) {
    return canonical({
      account:observed.account,characterName:observed.characterName,
      sessionId:observed.sessionId,serverRegion:observed.serverRegion,
      serverIdentifier:observed.serverIdentifier,slot:selected.slot,
      inventoryIndex:selected.inventoryIndex,candidateMaterial:selected.candidate.material,
      previousMaterial:null,mainhandMaterial:selected.mainhand.material,
      classRulesMaterial:selected.classRulesMaterial,
      restInventoryMaterial:selected.restInventoryMaterial,
      restEquipmentMaterial:selected.restEquipmentMaterial
    });
  }

  function currentAt(observed, index) {
    return observed.inventory.find(row => row.index === index) || null;
  }

  function classify(plan, observed) {
    if (observed.account !== plan.account
        || observed.characterName !== plan.characterName
        || observed.sessionId !== plan.sessionId
        || observed.serverRegion !== plan.serverRegion
        || observed.serverIdentifier !== plan.serverIdentifier) {
      return {status:"UNKNOWN_OPERATOR_REQUIRED",settlement:"UNGEKLAERT",reason:"RECIPIENT_BINDING_DRIFT"};
    }
    const slotItem = observed.slots[plan.slot] || null;
    const indexItem = currentAt(observed,plan.inventoryIndex);
    const restInventory = canonical(observed.inventory
      .filter(row => row.index !== plan.inventoryIndex).map(row => [row.index,row.material]));
    const restEquipment = canonical(SAFE_SLOTS
      .filter(slot => slot !== plan.slot).map(slot => [slot,observed.slots[slot]?.material ?? null]));
    const restOk = restInventory === plan.restInventoryMaterial
      && restEquipment === plan.restEquipmentMaterial
      && canonical(observed.classRules) === plan.classRulesMaterial;
    const postSlot = (slotItem?.material ?? null) === plan.candidateMaterial;
    const postIndex = (indexItem?.material ?? null) === null;
    const preSlot = (slotItem?.material ?? null) === null;
    const preIndex = (indexItem?.material ?? null) === plan.candidateMaterial;
    if (restOk && postSlot && postIndex) return {status:"COMMITTED",settlement:"BESTAETIGT",reason:null};
    if (restOk && preSlot && preIndex) return {status:"NOT_APPLIED",settlement:"NICHT_AUSGEFUEHRT",reason:null};
    if (restOk && (postSlot || postIndex)) return {status:"PARTIAL_OPERATOR_REQUIRED",settlement:"TEILWEISE",reason:"NUR_TEILMENGE_DER_OFFHAND_POSTCONDITION"};
    return {status:"UNKNOWN_OPERATOR_REQUIRED",settlement:"UNGEKLAERT",reason:"WEDER_PRESTATE_NOCH_POSTCONDITION_ODER_REST_DRIFT"};
  }

  function storage() {
    const r = root();
    const ls = r.localStorage || globalThis.localStorage;
    if (!ls || typeof ls.getItem !== "function" || typeof ls.setItem !== "function") {
      throw new Error("PR20_7_GEAR_LIVE_DURABLE_STORAGE_UNAVAILABLE");
    }
    return ls;
  }

  function writeReadback(key, value) {
    const ls = storage();
    const encoded = JSON.stringify(value);
    ls.setItem(key, encoded);
    const raw = ls.getItem(key);
    if (raw !== encoded) throw new Error("PR20_7_GEAR_LIVE_DURABLE_READBACK_MISMATCH");
    return JSON.parse(raw);
  }

  function existingIntent() {
    const ls = storage();
    for (let i = 0; i < ls.length; i += 1) {
      const key = ls.key(i);
      if (!key || !key.startsWith(INTENT_PREFIX)) continue;
      try {
        const value = JSON.parse(ls.getItem(key));
        if (value?.testId === TEST_ID) return { key, value };
      } catch {}
    }
    return null;
  }

  function acquireFence(resource, owner, epoch, nowMs) {
    const key = FENCE_PREFIX + resource;
    const ls = storage();
    const raw = ls.getItem(key);
    if (raw) {
      try {
        const old = JSON.parse(raw);
        if (Number(old?.expiresAtMs) > nowMs && old?.owner !== owner) {
          throw new Error("PR20_7_GEAR_LIVE_FENCE_BELEGT:" + resource);
        }
      } catch (error) {
        if (String(error?.message || error).startsWith("PR20_7_GEAR_LIVE_FENCE_BELEGT")) throw error;
      }
    }
    const record = {
      schemaVersion:1,testId:TEST_ID,resource,owner,epoch,
      acquiredAtMs:nowMs,expiresAtMs:nowMs + FENCE_TTL_MS
    };
    writeReadback(key, record);
    return { key, record };
  }

  function releaseFence(fence) {
    try {
      const ls = storage();
      const raw = ls.getItem(fence.key);
      if (!raw) return;
      const current = JSON.parse(raw);
      if (current?.owner === fence.record.owner
          && current?.epoch === fence.record.epoch) ls.removeItem(fence.key);
    } catch {}
  }

  function emit(type, severity, data = {}) {
    seq += 1;
    events.push({
      seq,ts:new Date().toISOString(),event:type,type,severity,
      reason:data.reason || null,
      component:"v5-pr20-7-weapon-offhand-equip-live-5m",
      data
    });
    if (events.length > 128) events.splice(0, events.length - 128);
  }

  function setState(patch) {
    state = {
      ...state,...patch,updatedAtMs:Date.now(),
      sameIntentRetry:false,startCalls:0,disconnectCalls:0,farmerWorkersInstalled:0,
      normalRuntimeAllowed:false,rawWriteCalls:0
    };
    return state;
  }

  function installTelemetryFacade() {
    const r = root();
    r.AIO_V3 = r.AIO_V3 || {};
    const existing = r.AIO_V3.operations && typeof r.AIO_V3.operations === "object"
      ? r.AIO_V3.operations : null;
    const oldStatus = existing && typeof existing.status === "function"
      ? existing.status.bind(existing) : null;
    const oldHeartbeat = existing && typeof existing.hostHeartbeat === "function"
      ? existing.hostHeartbeat.bind(existing) : null;

    r.AIO_V3.operations = {
      ...(existing || {}),
      __v5Pr207GearOccupiedLiveVersion: VERSION,
      status: () => {
        let base = {};
        try {
          const value = oldStatus ? oldStatus() : null;
          if (value && typeof value === "object") base = value;
        } catch {}
        return {
          ...base,
          schemaVersion:Number(base.schemaVersion) || 1,
          mode:"V5_AUTONOMOUS_TEST",
          v5AutonomousTest:state,
          telemetry:{queued:events.length,lastCapturedSeq:seq,dropped:0}
        };
      },
      hostHeartbeat: () => {
        try {
          const value = oldHeartbeat ? oldHeartbeat() : null;
          if (value && typeof value === "object") {
            return {...value,v5Mode:"V5_AUTONOMOUS_TEST",v5TestId:TEST_ID,v5ObservedAtMs:Date.now()};
          }
        } catch {}
        return {schemaVersion:1,alive:true,mode:"V5_AUTONOMOUS_TEST",testId:TEST_ID,observedAtMs:Date.now()};
      },
      reconciliationStatus: () => ({
        schemaVersion:1,
        status:state.terminal ? "TERMINAL_ONE_SHOT" : "ONE_SHOT_IN_PROGRESS",
        v5AutonomousTestStatus:state.status,
        v5Terminal:state.terminal === true,
        sameIntentRetry:false
      }),
      peekTelemetry: (limit = 2000) =>
        events.slice(-Math.max(1,Math.min(2000,Number(limit) || 2000)))
    };
  }

  async function run() {
    installTelemetryFacade();
    emit("PR20_7_WEAPON_OFFHAND_EQUIP_LIVE_STARTED","INFO");

    const oldIntent = existingIntent();

    const performanceTrick = await ensurePerformanceTrick();
    if (!performanceTrick.active) {
      setState({
        status:"BLOCKIERT",phase:"BACKGROUND_EXECUTION",terminal:true,
        blocker:["PR20_7_GEAR_PERFORMANCE_TRICK_NICHT_AKTIV"],
        performanceTrick,gameplayWrites:0,publicFunctionCalls:0
      });
      return;
    }

    if (oldIntent) {
      const old = oldIntent.value;
      const recoveryPlan = {
        account:txt(old?.recipient?.account,192),
        characterName:txt(old?.recipient?.characterName,192),
        sessionId:txt(old?.recipient?.sessionId,192),
        serverRegion:txt(old?.recipient?.serverRegion,32),
        serverIdentifier:txt(old?.recipient?.serverIdentifier,32),
        slot:txt(old?.slot,64),
        inventoryIndex:Number(old?.inventoryIndex),
        candidateMaterial:old?.candidateFingerprintMaterial || null,
        previousMaterial:null,
        mainhandMaterial:old?.mainhandFingerprintMaterial || null,
        classRulesMaterial:old?.classRulesMaterial || null,
        restInventoryMaterial:old?.restInventoryMaterial || null,
        restEquipmentMaterial:old?.restEquipmentMaterial || null
      };
      if (!recoveryPlan.account
          || !recoveryPlan.characterName
          || !recoveryPlan.sessionId
          || !SAFE_SLOTS.includes(recoveryPlan.slot)
          || !Number.isInteger(recoveryPlan.inventoryIndex)
          || !recoveryPlan.candidateMaterial
          || !recoveryPlan.mainhandMaterial
          || !recoveryPlan.classRulesMaterial) {
        setState({
          status:"BLOCKIERT",phase:"RESTART_RECONCILIATION",terminal:true,
          blocker:["PR20_7_GEAR_EXISTING_INTENT_UNVOLLSTAENDIG"],
          intents:[old],performanceTrick,
          gameplayWrites:Number(old?.gameplayWrites) || 0,
          publicFunctionCalls:Number(old?.publicFunctionCalls) || 0,
          authority:{...state.authority,authorityIssued:false,gameplayAuthority:false}
        });
        return;
      }

      const current = observation();
      const recovered = classify(recoveryPlan,current);
      if (old?.possibleSend !== true || recovered.status !== "COMMITTED") {
        setState({
          status:"BLOCKIERT",phase:"RESTART_RECONCILIATION",terminal:true,
          blocker:["PR20_7_GEAR_RESTART_" + recovered.status],
          intents:[{...old,restartReconciliation:recovered}],
          performanceTrick,
          gameplayWrites:Number(old?.gameplayWrites) || 0,
          publicFunctionCalls:Number(old?.publicFunctionCalls) || 0,
          evidence:{
            schemaVersion:1,
            evidenceArt:"V5_PR20_7_WEAPON_OFFHAND_EQUIP_RESTART_RECONCILIATION",
            status:"NICHT_BESTANDEN",
            reconciliation:recovered,
            sameIntentRetry:false,
            resendAttempted:false,
            normalRuntimeAllowed:false
          },
          authority:{...state.authority,authorityIssued:false,gameplayAuthority:false}
        });
        emit("PR20_7_WEAPON_OFFHAND_EQUIP_RESTART_BLOCKED","ERROR",{
          reason:recovered.status
        });
        return;
      }

      if (old?.completionStatus === "BESTANDEN"
          && old?.completionEvidence?.soak?.status === "BESTANDEN"
          && Number(old?.completionEvidence?.soak?.samples) >= SOAK_SAMPLES
          && Number(old?.completionEvidence?.soak?.durationMs)
            >= SOAK_SAMPLES * SOAK_INTERVAL_MS - 1000) {
        setState({
          status:"BESTANDEN",phase:"COMPLETE",terminal:true,blocker:[],
          performanceTrick,
          intents:[{...old,restartReconciliation:recovered,resendAttempted:false}],
          gameplayWrites:Number(old?.gameplayWrites) || 1,
          publicFunctionCalls:Number(old?.publicFunctionCalls) || 1,
          evidence:{
            ...old.completionEvidence,
            restartRecovered:true,
            resendAttempted:false,
            sameIntentRetry:false
          },
          authority:{
            ...state.authority,authorityIssued:false,authorityConsumed:true,
            gameplayAuthority:false,weaponOffhandWriteRatification:true
          }
        });
        emit("PR20_7_WEAPON_OFFHAND_EQUIP_RESTART_RECOVERED","INFO",{
          reconciliation:"COMMITTED",resendAttempted:false
        });
        return;
      }

      setState({
        status:"SOAK",phase:"RESTART_FIVE_MINUTE_SOAK",terminal:false,
        blocker:[],performanceTrick,
        intents:[{...old,restartReconciliation:recovered,resendAttempted:false}],
        gameplayWrites:Number(old?.gameplayWrites) || 1,
        publicFunctionCalls:Number(old?.publicFunctionCalls) || 1,
        authority:{
          ...state.authority,authorityIssued:false,authorityConsumed:true,
          gameplayAuthority:false,weaponOffhandWriteRatification:true
        }
      });
      const recoverySoakStartedAtMs = Date.now();
      let recoverySamples = 0;
      for (let i = 0; i < SOAK_SAMPLES; i += 1) {
        await sleep(SOAK_INTERVAL_MS);
        const sample = observation();
        const classified = classify(recoveryPlan,sample);
        if (classified.status !== "COMMITTED") {
          setState({
            status:"BLOCKIERT",phase:"RESTART_FIVE_MINUTE_SOAK",terminal:true,
            blocker:["PR20_7_GEAR_RESTART_SOAK_STATE_DRIFT"],
            evidence:{
              schemaVersion:1,
              evidenceArt:"V5_PR20_7_WEAPON_OFFHAND_EQUIP_RESTART_RECONCILIATION",
              status:"NICHT_BESTANDEN",
              reconciliation:classified,
              samples:recoverySamples,
              resendAttempted:false,
              sameIntentRetry:false,
              normalRuntimeAllowed:false
            }
          });
          return;
        }
        recoverySamples += 1;
      }
      const recoveryDurationMs = Date.now() - recoverySoakStartedAtMs;
      if (recoveryDurationMs < SOAK_SAMPLES * SOAK_INTERVAL_MS - 1000) {
        throw new Error("PR20_7_GEAR_RESTART_SOAK_DAUER_ZU_KURZ");
      }
      const recoveredEvidence = {
        schemaVersion:1,
        evidenceArt:"V5_PR20_7_WEAPON_OFFHAND_EQUIP_LIVE_5M",
        status:"BESTANDEN",
        observedAtMs:Date.now(),
        restartRecovered:true,
        resendAttempted:false,
        reconciliation:"COMMITTED",
        settlement:"BESTAETIGT",
        durableIntentReadback:true,
        sameIntentRetry:false,
        gameplayWrites:Number(old?.gameplayWrites) || 1,
        publicFunctionCalls:Number(old?.publicFunctionCalls) || 1,
        rawWriteCalls:0,
        startCalls:0,
        disconnectCalls:0,
        farmerWorkersInstalled:0,
        soak:{
          status:"BESTANDEN",
          samples:recoverySamples,
          durationMs:recoveryDurationMs,
          minimumSamples:SOAK_SAMPLES
        },
        normalRuntimeAllowed:false
      };
      const recoveredIntent = {
        ...old,
        terminal:true,
        completionStatus:"BESTANDEN",
        completionEvidence:recoveredEvidence,
        restartReconciliation:recovered,
        resendAttempted:false,
        sameIntentRetry:false
      };
      writeReadback(oldIntent.key,recoveredIntent);
      setState({
        status:"BESTANDEN",phase:"COMPLETE",terminal:true,blocker:[],
        performanceTrick,evidence:recoveredEvidence,intents:[recoveredIntent],
        gameplayWrites:recoveredEvidence.gameplayWrites,
        publicFunctionCalls:recoveredEvidence.publicFunctionCalls
      });
      emit("PR20_7_WEAPON_OFFHAND_EQUIP_RESTART_RECOVERED","INFO",{
        reconciliation:"COMMITTED",samples:recoverySamples,resendAttempted:false
      });
      return;
    }

    const first = observation();
    const firstCandidate = chooseCandidate(first);
    if (!firstCandidate) {
      setState({
        status:"BLOCKIERT",phase:"LIVE_PREFLIGHT",terminal:true,
        blocker:["PR20_7_WEAPON_OFFHAND_EQUIP_KEIN_EXAKTER_WSHIELD_KANDIDAT"],
        performanceTrick,gameplayWrites:0,publicFunctionCalls:0
      });
      return;
    }
    const firstIdentity = identity(first, firstCandidate);
    await sleep(DOUBLE_OBSERVE_DELAY_MS);
    const second = observation();
    const secondCandidate = chooseCandidate(second);
    if (!secondCandidate || identity(second, secondCandidate) !== firstIdentity) {
      throw new Error("PR20_7_GEAR_LIVE_PREFLIGHT_SNAPSHOT_DRIFT");
    }

    const prestateFingerprintSha256 = await sha256(firstIdentity);
    const plan = {
      account:second.account,
      characterName:second.characterName,
      sessionId:second.sessionId,
      serverRegion:second.serverRegion,
      serverIdentifier:second.serverIdentifier,
      slot:secondCandidate.slot,
      inventoryIndex:secondCandidate.inventoryIndex,
      candidateMaterial:secondCandidate.candidate.material,
      previousMaterial:null,
      mainhandMaterial:secondCandidate.mainhand.material,
      classRulesMaterial:secondCandidate.classRulesMaterial,
      restInventoryMaterial:secondCandidate.restInventoryMaterial,
      restEquipmentMaterial:secondCandidate.restEquipmentMaterial
    };

    const runId = TEST_ID + ":" + Date.now();
    const epochBase = Date.now();
    const equipmentFence = acquireFence(
      "character:" + plan.characterName + ":equipment",runId,epochBase,Date.now());
    const inventoryFence = acquireFence(
      "character:" + plan.characterName + ":inventory",runId,epochBase + 1,Date.now());

    const intentKey = INTENT_PREFIX + prestateFingerprintSha256;
    const intent = {
      schemaVersion:1,testId:TEST_ID,version:VERSION,runId,
      transaktionsId:"PR20.7-WSHIELD-EQUIP-" + Date.now(),
      createdAtMs:Date.now(),
      recipient:{account:plan.account,characterName:plan.characterName,sessionId:plan.sessionId,
        serverRegion:plan.serverRegion,serverIdentifier:plan.serverIdentifier},
      slot:plan.slot,inventoryIndex:plan.inventoryIndex,
      candidateName:secondCandidate.candidate.name,
      candidateLevel:secondCandidate.candidate.level,
      candidateFingerprintMaterial:plan.candidateMaterial,
      previousName:null,
      previousLevel:null,
      previousFingerprintMaterial:null,
      mainhandFingerprintMaterial:plan.mainhandMaterial,
      classRulesMaterial:plan.classRulesMaterial,
      restInventoryMaterial:plan.restInventoryMaterial,
      restEquipmentMaterial:plan.restEquipmentMaterial,
      prestateFingerprintSha256,
      resourceClaims:[
        {resource:equipmentFence.record.resource,epoch:equipmentFence.record.epoch},
        {resource:inventoryFence.record.resource,epoch:inventoryFence.record.epoch}
      ],
      sendBoundaryState:"NICHT_GESENDET",
      possibleSend:false,
      gameplayWrites:0,
      publicFunctionCalls:0,
      sameIntentRetry:false,
      terminal:false
    };
    writeReadback(intentKey,intent);

    const beforeSend = observation();
    const beforeSelected = chooseCandidate(beforeSend);
    if (!beforeSelected || identity(beforeSend,beforeSelected) !== firstIdentity) {
      releaseFence(inventoryFence); releaseFence(equipmentFence);
      throw new Error("PR20_7_GEAR_LIVE_PRE_SEND_DRIFT");
    }

    const sendIntent = {
      ...intent,
      sendBoundaryState:"MOEGLICH_GESENDET",
      possibleSend:true,
      sendStartedAtMs:Date.now()
    };
    writeReadback(intentKey,sendIntent);

    setState({
      status:"RUNNING",phase:"ONE_SHOT_SEND",terminal:false,
      blocker:[],performanceTrick,
      intents:[sendIntent],
      authority:{
        authorityIssued:true,authorityConsumed:false,gameplayAuthority:true,
        rawWriteAuthority:false,weaponOffhandWriteRatification:true,maximumUses:1,
        scope:{characterName:plan.characterName,sessionId:plan.sessionId,
          slot:plan.slot,inventoryIndex:plan.inventoryIndex,
          prestateFingerprintSha256}
      }
    });

    const r = root();
    if (typeof r.equip !== "function") throw new Error("PR20_7_WEAPON_OFFHAND_EQUIP_LIVE_EQUIP_UNAVAILABLE");

    let callResult = null;
    let callError = null;
    setState({
      gameplayWrites:1,publicFunctionCalls:1,
      authority:{...state.authority,authorityConsumed:true,gameplayAuthority:false}
    });
    try {
      callResult = await Promise.resolve(r.equip(plan.inventoryIndex, plan.slot));
    } catch (error) {
      callError = txt(error?.message || error,240);
    }

    let reconciliation = null;
    let settledObservation = null;
    for (let attempt = 0; attempt < RECONCILE_ATTEMPTS; attempt += 1) {
      await sleep(RECONCILE_DELAY_MS);
      const current = observation();
      const classified = classify(plan,current);
      reconciliation = classified;
      settledObservation = current;
      if (classified.status === "COMMITTED"
          || classified.status === "PARTIAL_OPERATOR_REQUIRED") break;
    }

    releaseFence(inventoryFence);
    releaseFence(equipmentFence);

    const terminalIntent = {
      ...sendIntent,
      gameplayWrites:1,
      publicFunctionCalls:1,
      callResult:callResult == null ? null : txt(
        typeof callResult === "string" ? callResult : JSON.stringify(callResult),240),
      callError,
      reconciliation,
      terminal:true,
      terminalAtMs:Date.now()
    };
    writeReadback(intentKey,terminalIntent);

    if (!reconciliation || reconciliation.status !== "COMMITTED") {
      setState({
        status:"BLOCKIERT",phase:"RECONCILIATION",terminal:true,
        blocker:["PR20_7_GEAR_LIVE_" + (reconciliation?.status || "RECONCILIATION_FEHLT")],
        intents:[terminalIntent],
        evidence:{
          schemaVersion:1,evidenceArt:"V5_PR20_7_WEAPON_OFFHAND_EQUIP_LIVE_ONE_SHOT",
          status:"NICHT_BESTANDEN",reconciliation,prestateFingerprintSha256,
          gameplayWrites:1,publicFunctionCalls:1,rawWriteCalls:0,sameIntentRetry:false,
          normalRuntimeAllowed:false
        }
      });
      emit("PR20_7_WEAPON_OFFHAND_EQUIP_LIVE_BLOCKED","ERROR",{
        reason:reconciliation?.status || "RECONCILIATION_FEHLT"
      });
      return;
    }

    const postSlotMaterial = settledObservation.slots[plan.slot]?.material || null;
    const postIndexMaterial = currentAt(settledObservation,plan.inventoryIndex)?.material || null;
    const candidateFingerprintSha256 = await sha256(plan.candidateMaterial);

    setState({
      status:"SOAK",phase:"FIVE_MINUTE_SOAK",terminal:false,
      intents:[terminalIntent]
    });
    const soakStartedAtMs = Date.now();
    let samples = 0;
    for (let i = 0; i < SOAK_SAMPLES; i += 1) {
      await sleep(SOAK_INTERVAL_MS);
      const sample = observation();
      const classified = classify(plan,sample);
      if (classified.status !== "COMMITTED") {
        setState({
          status:"BLOCKIERT",phase:"FIVE_MINUTE_SOAK",terminal:true,
          blocker:["PR20_7_GEAR_LIVE_SOAK_STATE_DRIFT"],
          evidence:{
            schemaVersion:1,evidenceArt:"V5_PR20_7_WEAPON_OFFHAND_EQUIP_LIVE_5M",
            status:"NICHT_BESTANDEN",reconciliation:classified,samples,
            gameplayWrites:1,publicFunctionCalls:1,rawWriteCalls:0,sameIntentRetry:false,
            normalRuntimeAllowed:false
          }
        });
        return;
      }
      samples += 1;
    }
    const soakDurationMs = Date.now() - soakStartedAtMs;
    if (soakDurationMs < SOAK_SAMPLES * SOAK_INTERVAL_MS - 1000) {
      throw new Error("PR20_7_GEAR_LIVE_SOAK_DAUER_ZU_KURZ");
    }

    const evidence = {
      schemaVersion:1,
      evidenceArt:"V5_PR20_7_WEAPON_OFFHAND_EQUIP_LIVE_5M",
      status:"BESTANDEN",
      observedAtMs:Date.now(),
      recipient:{
        characterName:plan.characterName,ctype:"merchant",
        serverRegion:plan.serverRegion,serverIdentifier:plan.serverIdentifier,
        accountBindingSha256:await sha256(plan.account),
        sessionBindingSha256:await sha256(plan.sessionId)
      },
      candidate:{
        slot:plan.slot,inventoryIndex:plan.inventoryIndex,
        name:secondCandidate.candidate.name,level:secondCandidate.candidate.level,
        fingerprintSha256:candidateFingerprintSha256
      },
      previousSlotItem:null,
      oppositeHand:{
        slot:"mainhand",name:secondCandidate.mainhand.name,
        level:secondCandidate.mainhand.level,
        fingerprintSha256:await sha256(secondCandidate.mainhand.material)
      },
      prestateFingerprintSha256,
      postSlotMaterialSha256:await sha256(postSlotMaterial),
      postIndexMaterialSha256:await sha256(postIndexMaterial),
      durableIntentReadback:true,
      sendBoundaryState:"MOEGLICH_GESENDET",
      reconciliation:"COMMITTED",
      settlement:"BESTAETIGT",
      oneShotAuthority:{
        issued:true,maximumUses:1,consumed:true,
        exactRecipientSessionBinding:true,exactSlotAndIndexBinding:true,
        exactEmptyOffhandPrestate:true,oppositeHandPinned:true,
        equipmentInventoryFenceClaims:true
      },
      performanceTrick,
      gameplayWrites:1,
      publicFunctionCalls:1,
      rawWriteCalls:0,
      sameIntentRetry:false,
      startCalls:0,
      disconnectCalls:0,
      farmerWorkersInstalled:0,
      soak:{status:"BESTANDEN",samples,durationMs:soakDurationMs,minimumSamples:SOAK_SAMPLES},
      normalRuntimeAllowed:false
    };

    const completedIntent = {
      ...terminalIntent,
      completionStatus:"BESTANDEN",
      completionEvidence:evidence,
      soak:evidence.soak,
      sameIntentRetry:false
    };
    writeReadback(intentKey,completedIntent);

    setState({
      status:"BESTANDEN",phase:"COMPLETE",terminal:true,blocker:[],
      evidence,intents:[completedIntent],gameplayWrites:1,publicFunctionCalls:1,
      authority:{...state.authority,authorityConsumed:true,gameplayAuthority:false}
    });
    emit("PR20_7_WEAPON_OFFHAND_EQUIP_LIVE_PASSED","INFO",{
      slot:plan.slot,inventoryIndex:plan.inventoryIndex,samples,soakDurationMs
    });
  }

  installTelemetryFacade();
  globalThis.V5PR207WeaponOffhandEquipLiveTest = Object.freeze({
    version:VERSION,
    testId:TEST_ID,
    status:() => state,
    start:() => run()
  });

  Promise.resolve().then(run).catch(error => {
    setState({
      status:"BLOCKIERT",phase:"ERROR",terminal:true,
      blocker:[txt(error?.message || error,240)],
      authority:{...state.authority,gameplayAuthority:false}
    });
    emit("PR20_7_WEAPON_OFFHAND_EQUIP_LIVE_ERROR","ERROR",{
      reason:txt(error?.message || error,240)
    });
  });
})();
