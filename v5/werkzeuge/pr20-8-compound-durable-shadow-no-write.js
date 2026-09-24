(() => {
  'use strict';

  const VERSION = '1.0.0';
  const TEST_ID = 'pr20-8-compound-durable-shadow-no-write';
  const EXPECTED_CHARACTER = 'My_Merchant';
  const EXPECTED_CLASS = 'merchant';
  const EXPECTED_SERVER_REGION = 'EU';
  const EXPECTED_SERVER_IDENTIFIER = 'I';
  const ITEM_NAME = 'hpamulet';
  const ITEM_LEVEL = 0;
  const ITEM_BASE_GOLD = 20000;
  const SCROLL_NAME = 'cscroll0';
  const SCROLL_CONSUME_QUANTITY = 1;
  const SOURCE_SNAPSHOT_COMMIT = 'ddcf7222c3264f1404382e1ff5dea8e73f6cb4b4';
  const SOURCE_PINNED_SELL_DISTANCE = 400;
  const SERVICE_REACHABILITY_SAFETY_MAX = 300;
  const RATIFIED_CANDIDATE_EVIDENCE_COMMIT = '5974e293e973493241e3d659ea30d3cae85ebc35';
  const DOUBLE_OBSERVE_DELAY_MS = 350;
  const INTENT_PREFIX = 'v5:' + TEST_ID + ':intent:';

  const events = [];
  let seq = 0;
  let state = {
    schemaVersion: 1,
    testId: TEST_ID,
    version: VERSION,
    status: 'BOOT',
    phase: 'BOOT',
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
      durableIntentCreated: false,
      compoundAuthority: false,
      gameplayAuthority: false,
      rawWriteAuthority: false,
      normalCompoundWriteRatification: false
    }
  };

  function text(value, max = 240) {
    return String(value == null ? '' : value).trim().slice(0, max);
  }

  function roots() {
    const out = [];
    try { out.push(globalThis); } catch {}
    try {
      if (globalThis.parent
          && globalThis.parent !== globalThis
          && !out.includes(globalThis.parent)) out.push(globalThis.parent);
    } catch {}
    return out;
  }

  function root() {
    for (const candidate of roots()) {
      try {
        if (candidate?.character
            && Array.isArray(candidate.character.items)
            && candidate.G?.items) return candidate;
      } catch {}
    }
    throw new Error('PR20_8_COMPOUND_SHADOW_SPIELKONTEXT_FEHLT');
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function canonical(value) {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
    return '{' + Object.keys(value).sort()
      .map(key => JSON.stringify(key) + ':' + canonical(value[key]))
      .join(',') + '}';
  }

  async function sha256(value) {
    const r = root();
    const cryptoApi = globalThis.crypto || r.crypto;
    if (!cryptoApi?.subtle?.digest) {
      throw new Error('PR20_8_COMPOUND_SHADOW_WEB_CRYPTO_UNAVAILABLE');
    }
    const bytes = new TextEncoder().encode(String(value));
    const digest = await cryptoApi.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), byte =>
      byte.toString(16).padStart(2, '0')).join('');
  }

  function storage() {
    for (const candidate of roots()) {
      try {
        if (candidate?.localStorage
            && typeof candidate.localStorage.setItem === 'function'
            && typeof candidate.localStorage.getItem === 'function') {
          return candidate.localStorage;
        }
      } catch {}
    }
    throw new Error('PR20_8_COMPOUND_SHADOW_DURABLE_STORAGE_UNAVAILABLE');
  }

  function stableScalarObject(value, maximumKeys = 96) {
    if (!value || typeof value !== 'object') return {};
    const out = {};
    for (const key of Object.keys(value).sort().slice(0, maximumKeys)) {
      const v = value[key];
      if (v === null
          || typeof v === 'string'
          || typeof v === 'number'
          || typeof v === 'boolean') {
        out[key] = v;
      } else if (v && typeof v === 'object' && !Array.isArray(v)) {
        const nested = {};
        for (const nk of Object.keys(v).sort().slice(0, 32)) {
          const nv = v[nk];
          if (nv === null
              || typeof nv === 'string'
              || typeof nv === 'number'
              || typeof nv === 'boolean') nested[nk] = nv;
        }
        out[key] = nested;
      }
    }
    return out;
  }

  function stableItemMaterial(item) {
    return item && typeof item === 'object'
      ? canonical(stableScalarObject(item, 64))
      : null;
  }

  function serverBinding(r) {
    let parentRoot = null;
    try { if (r.parent && r.parent !== r) parentRoot = r.parent; } catch {}
    return {
      region: [r.server_region, r.server?.region, parentRoot?.server_region, parentRoot?.server?.region]
        .map(v => text(v, 32)).find(Boolean) || '',
      identifier: [r.server_identifier, r.server?.id, parentRoot?.server_identifier, parentRoot?.server?.id]
        .map(v => text(v, 32)).find(Boolean) || ''
    };
  }

  function runtimeConflict(r) {
    try {
      const v3 = r.AIO_V3?.__runtime;
      const status = v3 && typeof v3.status === 'function' ? v3.status() : null;
      if (v3 && (v3.timer || status?.running === true)) return 'AIO_V3_RUNTIME_ACTIVE';
    } catch {
      return 'AIO_V3_RUNTIME_UNREADABLE';
    }
    try {
      const v4 = r.AIO_V4 || r.V4Runtime;
      const status = v4 && typeof v4.status === 'function' ? v4.status() : null;
      if (status?.running === true || status?.aktivFreigegeben === true) {
        return 'V4_RUNTIME_ACTIVE';
      }
    } catch {
      return 'V4_RUNTIME_UNREADABLE';
    }
    return null;
  }

  async function ensurePerformanceTrick() {
    let available = false;
    let called = false;
    let lastError = null;
    for (const candidate of roots()) {
      try {
        if (typeof candidate?.performance_trick !== 'function') continue;
        available = true;
        candidate.performance_trick();
        called = true;
        break;
      } catch (error) {
        lastError = text(error?.message || error, 160);
      }
    }
    if (called) await sleep(350);
    let audioFound = false;
    let playing = false;
    let cplaying = false;
    for (const candidate of roots()) {
      try {
        const empty = candidate?.sounds?.empty;
        if (!empty) continue;
        audioFound = true;
        if (empty.cplaying === true) cplaying = true;
        if (typeof empty.playing === 'function' && empty.playing() === true) {
          playing = true;
        } else if (empty.playing === true) {
          playing = true;
        }
      } catch {}
    }
    return {
      available,
      called,
      audioFound,
      playing,
      cplaying,
      active: available && called && audioFound && playing,
      verification: 'HOWLER_PLAYING_TRUE',
      error: lastError
    };
  }

  function compoundFunctionAvailable() {
    for (const candidate of roots()) {
      try {
        if (typeof candidate?.['compound'] === 'function') return true;
      } catch {}
    }
    return false;
  }

  function sellDistanceEvidence() {
    let observed = null;
    for (const candidate of roots()) {
      try {
        const value = Number(candidate?.B?.sell_dist);
        if (Number.isFinite(value) && value > 0) {
          observed = value;
          break;
        }
      } catch {}
    }
    if (Number.isFinite(observed) && observed !== SOURCE_PINNED_SELL_DISTANCE) {
      throw new Error('PR20_8_COMPOUND_SHADOW_SELL_DIST_DRIFT');
    }
    return {
      value: Number.isFinite(observed) ? observed : SOURCE_PINNED_SELL_DISTANCE,
      source: Number.isFinite(observed)
        ? 'LIVE_BROWSER_B'
        : 'OFFICIAL_SERVER_SOURCE_PIN',
      browserObserved: Number.isFinite(observed)
    };
  }

  function serviceReachability(r,c) {
    const sellDistance = sellDistanceEvidence();
    if (c.computer === true) {
      return {
        reachable:true,
        viaComputer:true,
        distance:null,
        serverLimit:sellDistance.value,
        safetyLimit:SERVICE_REACHABILITY_SAFETY_MAX,
        sellDistanceSource:sellDistance.source,
        browserObserved:sellDistance.browserObserved
      };
    }
    if (text(c.map,96) !== 'main') {
      throw new Error('PR20_8_COMPOUND_SHADOW_SERVICE_MAP_DRIFT');
    }
    const service = r.G?.maps?.main?.ref?.c_mid;
    const sx = Number(Array.isArray(service) ? service[0] : service?.x);
    const sy = Number(Array.isArray(service) ? service[1] : service?.y);
    const px = Number(c.real_x ?? c.x);
    const py = Number(c.real_y ?? c.y);
    if (![sx,sy,px,py].every(Number.isFinite)) {
      throw new Error('PR20_8_COMPOUND_SHADOW_SERVICE_POSITION_UNLESBAR');
    }
    const distance = Math.hypot(px-sx,py-sy);
    const conservativeLimit = Math.min(
      sellDistance.value,
      SERVICE_REACHABILITY_SAFETY_MAX,
    );
    if (!Number.isFinite(distance) || distance > conservativeLimit) {
      throw new Error('PR20_8_COMPOUND_SHADOW_SERVICE_NICHT_ERREICHBAR');
    }
    return {
      reachable:true,
      viaComputer:false,
      distance,
      serverLimit:sellDistance.value,
      safetyLimit:conservativeLimit,
      servicePoint:{map:'main',x:sx,y:sy},
      sellDistanceSource:sellDistance.source,
      browserObserved:sellDistance.browserObserved
    };
  }

  function itemBlocked(item, def) {
    return !item
      || !def
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
      || item.gift != null
      || def.cash === true
      || def.event === true
      || def.quest === true
      || def.exclusive === true;
  }

  function resolveCandidate(items, G) {
    const matches = [];
    for (let index = 0; index < items.length && index < 128; index += 1) {
      const item = items[index];
      if (!item || item.name !== ITEM_NAME || Number(item.level || 0) !== ITEM_LEVEL) continue;
      const def = G.items?.[item.name];
      if (!def?.compound || itemBlocked(item, def)) continue;
      const q = Number(item.q == null ? 1 : item.q);
      if (q !== 1) continue;
      const baseGold = Number(def.g);
      if (!Number.isFinite(baseGold) || baseGold !== ITEM_BASE_GOLD) continue;
      matches.push({
        index,
        name: ITEM_NAME,
        level: ITEM_LEVEL,
        quantity: 1,
        baseGold,
        material: stableItemMaterial(item)
      });
    }
    matches.sort((a,b) => a.index-b.index);
    if (matches.length < 3) throw new Error('PR20_8_COMPOUND_SHADOW_DREI_KANDIDATEN_ERFORDERLICH');
    const rows = matches.slice(0,3);
    return {
      selected: {
        index: rows[0].index,
        indexes: rows.map(x => x.index),
        name: ITEM_NAME,
        level: ITEM_LEVEL,
        quantity: 3,
        quantityEach: 1,
        baseGold: rows[0].baseGold,
        materials: rows.map(x => x.material),
        material: canonical(rows.map(x => [x.index,x.material]))
      },
      matchingCandidateCount: matches.length
    };
  }

  function resolveScroll(items, G) {
    const matches = [];
    for (let index = 0; index < items.length && index < 128; index += 1) {
      const item = items[index];
      if (!item || item.name !== SCROLL_NAME) continue;
      const def = G.items?.[item.name];
      if (!def || itemBlocked(item, def)) continue;
      const q = Number(item.q == null ? 1 : item.q);
      if (!Number.isSafeInteger(q) || q < SCROLL_CONSUME_QUANTITY) continue;
      matches.push({
        index,
        name: SCROLL_NAME,
        observedQuantity: q,
        consumeQuantity: SCROLL_CONSUME_QUANTITY,
        material: stableItemMaterial(item)
      });
    }
    matches.sort((a,b) => a.index-b.index);
    if (!matches.length) throw new Error('PR20_8_COMPOUND_SHADOW_SCROLL_FEHLT');
    return matches[0];
  }

  function observation() {
    const r = root();
    const c = r.character;
    if (text(c.name,192) !== EXPECTED_CHARACTER) {
      throw new Error('PR20_8_COMPOUND_SHADOW_RECIPIENT_DRIFT');
    }
    if (text(c.id,192) !== EXPECTED_CHARACTER) {
      throw new Error('PR20_8_COMPOUND_SHADOW_SESSION_DRIFT');
    }
    if (text(c.ctype || c.type,32).toLowerCase() !== EXPECTED_CLASS) {
      throw new Error('PR20_8_COMPOUND_SHADOW_MERCHANT_ERFORDERLICH');
    }
    const server = serverBinding(r);
    if (server.region !== EXPECTED_SERVER_REGION
        || server.identifier !== EXPECTED_SERVER_IDENTIFIER) {
      throw new Error('PR20_8_COMPOUND_SHADOW_SERVER_BINDUNG_DRIFT');
    }
    if (c.rip === true || c.dead === true) {
      throw new Error('PR20_8_COMPOUND_SHADOW_CHARACTER_TOT');
    }
    if (c.moving === true) {
      throw new Error('PR20_8_COMPOUND_SHADOW_CHARACTER_BEWEGT_SICH');
    }
    if (c.target !== null && c.target !== undefined && text(c.target,192)) {
      throw new Error('PR20_8_COMPOUND_SHADOW_CHARACTER_HAT_ZIEL');
    }
    if (c.q && typeof c.q === 'object' && Object.keys(c.q).length) {
      throw new Error('PR20_8_COMPOUND_SHADOW_Q_NICHT_FREI');
    }
    const conflict = runtimeConflict(r);
    if (conflict) {
      throw new Error('PR20_8_COMPOUND_SHADOW_ALTERNATIVE_RUNTIME_AKTIV:' + conflict);
    }
    let hostile = 0;
    try {
      for (const entity of Object.values(r.entities || {})) {
        if (entity
            && entity.type === 'monster'
            && !entity.dead
            && !entity.rip
            && text(entity.target,192) === EXPECTED_CHARACTER) hostile += 1;
      }
    } catch {
      throw new Error('PR20_8_COMPOUND_SHADOW_AGGRO_UNLESBAR');
    }
    if (hostile !== 0) {
      throw new Error('PR20_8_COMPOUND_SHADOW_CHARACTER_UNTER_ANGRIFF');
    }
    if (!compoundFunctionAvailable()) {
      throw new Error('PR20_8_COMPOUND_SHADOW_PUBLIC_FUNCTION_FEHLT');
    }

    const itemDef = r.G.items?.[ITEM_NAME];
    if (!itemDef?.compound
        || text(itemDef.type,64) !== 'amulet'
        || Number(itemDef.g) !== ITEM_BASE_GOLD) {
      throw new Error('PR20_8_COMPOUND_SHADOW_ITEM_DEFINITION_DRIFT');
    }
    const scrollDef = r.G.items?.[SCROLL_NAME];
    if (!scrollDef
        || text(scrollDef.type,64) !== 'cscroll'
        || Number(scrollDef.grade) !== 0
        || Number(scrollDef.g) !== 6400) {
      throw new Error('PR20_8_COMPOUND_SHADOW_SCROLL_DEFINITION_DRIFT');
    }
    const service = serviceReachability(r,c);

    const candidate = resolveCandidate(c.items,r.G);
    const scroll = resolveScroll(c.items,r.G);
    if (candidate.selected.indexes.includes(scroll.index)) {
      throw new Error('PR20_8_COMPOUND_SHADOW_INPUT_INDEX_KOLLISION');
    }

    const inventoryMaterial = canonical(c.items.map((item,index) => [
      index,
      stableItemMaterial(item)
    ]));
    const qMaterial = canonical(stableScalarObject(c.q || {},32));
    const compoundEffectMaterial = canonical({
      massproduction: stableScalarObject(c.s?.massproduction || {},32),
      massproductionpp: stableScalarObject(c.s?.massproductionpp || {},32),
      ograce: c.p?.ograce ?? null,
      compoundRoll: c.p?.c_roll ?? null,
      compoundItem: stableScalarObject(c.p?.c_item || {},64),
      compoundItemX: stableScalarObject(c.p?.c_itemx || {},64),
      serverCgrace: stableScalarObject(r.S?.cgrace || {},32)
    });
    const itemDefinitionMaterial = canonical({
      name: ITEM_NAME,
      type: text(itemDef.type,64),
      baseGold: Number(itemDef.g),
      compoundable: !!itemDef.compound,
      grades: Array.isArray(itemDef.grades) ? [...itemDef.grades] : null
    });
    const scrollDefinitionMaterial = canonical({
      name: SCROLL_NAME,
      type: text(scrollDef.type,64),
      grade: scrollDef.grade ?? null,
      baseGold: Number.isFinite(Number(scrollDef.g)) ? Number(scrollDef.g) : null
    });

    return {
      characterName: EXPECTED_CHARACTER,
      sessionId: EXPECTED_CHARACTER,
      ctype: EXPECTED_CLASS,
      level: Number(c.level || 0),
      map: text(c.map,96),
      serverRegion: server.region,
      serverIdentifier: server.identifier,
      candidate: candidate.selected,
      matchingCandidateCount: candidate.matchingCandidateCount,
      scroll,
      offering: null,
      normalPathOnly: true,
      publicFunctionAvailable: true,
      service,
      inventoryMaterial,
      qMaterial,
      compoundEffectMaterial,
      itemDefinitionMaterial,
      scrollDefinitionMaterial
    };
  }

  function stableIdentity(o) {
    return canonical({
      characterName:o.characterName,
      sessionId:o.sessionId,
      serverRegion:o.serverRegion,
      serverIdentifier:o.serverIdentifier,
      map:o.map,
      candidate:o.candidate,
      matchingCandidateCount:o.matchingCandidateCount,
      scroll:o.scroll,
      offering:o.offering,
      normalPathOnly:o.normalPathOnly,
      service:o.service,
      inventoryMaterial:o.inventoryMaterial,
      qMaterial:o.qMaterial,
      compoundEffectMaterial:o.compoundEffectMaterial,
      itemDefinitionMaterial:o.itemDefinitionMaterial,
      scrollDefinitionMaterial:o.scrollDefinitionMaterial
    });
  }

  function expectedResourceClaims() {
    return [
      'character:My_Merchant:inventory',
      'character:My_Merchant:q',
      'character:My_Merchant:action_channel:compound',
      'character:My_Merchant:socket_call_budget'
    ];
  }

  function readExactTerminalShadowIntent(store,key,record) {
    const existing=store.getItem(key);
    if(existing===null) return null;
    let decoded=null;
    try { decoded=JSON.parse(existing); } catch {}
    const versionAllowed=decoded
      && (decoded.version==='1.0.0' || decoded.version===VERSION);
    const exact=decoded
      && decoded.schemaVersion===1
      && decoded.testId===TEST_ID
      && versionAllowed
      && decoded.art==='PR20_8_COMPOUND_DURABLE_SHADOW_INTENT_NO_GAMEPLAY_WRITE'
      && decoded.terminal===true
      && decoded.journalTerminalArt==='ABBRUCH'
      && decoded.sendBoundaryState==='NICHT_GESENDET'
      && decoded.sameIntentRetry===false
      && decoded.actionContractId==='AL-ACTION-COMPOUND'
      && decoded.recoveryContractId==='AL-RECOVERY-COMPOUND'
      && decoded.verifierId==='AL-VERIFIER-COMPOUND'
      && decoded.publicFunction==='compound'
      && decoded.sourceSnapshotCommit===SOURCE_SNAPSHOT_COMMIT
      && decoded.ratifiedCandidateEvidenceCommit===RATIFIED_CANDIDATE_EVIDENCE_COMMIT
      && canonical(decoded.serviceReachability)===canonical(record.serviceReachability)
      && decoded.recipient?.characterName===record.recipient.characterName
      && decoded.recipient?.sessionId===record.recipient.sessionId
      && decoded.recipient?.ctype===record.recipient.ctype
      && decoded.recipient?.serverRegion===record.recipient.serverRegion
      && decoded.recipient?.serverIdentifier===record.recipient.serverIdentifier
      && decoded.candidate?.name===record.candidate.name
      && decoded.candidate?.level===record.candidate.level
      && decoded.candidate?.index===record.candidate.index
      && canonical(decoded.candidate?.indexes)===canonical(record.candidate.indexes)
      && decoded.candidate?.quantity===record.candidate.quantity
      && decoded.candidate?.quantityEach===record.candidate.quantityEach
      && decoded.candidate?.baseGold===record.candidate.baseGold
      && canonical(decoded.candidate?.materials)===canonical(record.candidate.materials)
      && decoded.candidate?.material===record.candidate.material
      && decoded.scroll?.name===record.scroll.name
      && decoded.scroll?.index===record.scroll.index
      && decoded.scroll?.observedQuantity===record.scroll.observedQuantity
      && decoded.scroll?.consumeQuantity===record.scroll.consumeQuantity
      && decoded.scroll?.material===record.scroll.material
      && decoded.offering===null
      && decoded.normalPathOnly===true
      && canonical(decoded.resourceClaims)===canonical(expectedResourceClaims())
      && decoded.oneShot?.bindingPrepared===true
      && decoded.oneShot?.maximumUses===1
      && decoded.oneShot?.compoundAuthorityIssued===false
      && decoded.fingerprints?.prestate===record.prestateFingerprintSha256
      && decoded.fingerprints?.inventory===record.inventoryFingerprintSha256
      && decoded.fingerprints?.q===record.qFingerprintSha256
      && decoded.fingerprints?.candidate===record.candidateFingerprintSha256
      && decoded.fingerprints?.scroll===record.scrollFingerprintSha256
      && decoded.fingerprints?.compoundEffects===record.compoundEffectsFingerprintSha256
      && decoded.fingerprints?.itemDefinition===record.itemDefinitionFingerprintSha256
      && decoded.fingerprints?.scrollDefinition===record.scrollDefinitionFingerprintSha256
      && decoded.exactPhysicalCandidateIndexesPinned===true
      && decoded.exactPhysicalScrollIndexPinned===true
      && decoded.freshReresolutionRequiredBeforeFutureSend===true
      && decoded.durableShadowOnly===true
      && decoded.gameplayAuthority===false
      && decoded.rawWriteAuthority===false
      && decoded.compoundAuthority===false
      && decoded.normalCompoundWriteRatification===false
      && decoded.normalRuntimeAllowed===false;
    if(!exact) {
      throw new Error('PR20_8_COMPOUND_SHADOW_TERMINAL_INTENT_DRIFT');
    }
    return decoded;
  }

  function shadowIntentSummary(key,decoded,recoveredExistingTerminal) {
    return {
      storage:'LOCAL_STORAGE_SHADOW_ONLY',
      key,
      durableReadback:true,
      journalTerminalArt:'ABBRUCH',
      sendBoundaryState:'NICHT_GESENDET',
      sameIntentRetry:false,
      resourceClaims:decoded.resourceClaims,
      oneShot:decoded.oneShot,
      exactPhysicalCandidateIndexesPinned:true,
      exactPhysicalScrollIndexPinned:true,
      freshReresolutionRequiredBeforeFutureSend:true,
      createdThisRun:recoveredExistingTerminal!==true,
      recoveredExistingTerminal:recoveredExistingTerminal===true,
      recoveredVersion:recoveredExistingTerminal===true ? decoded.version : null
    };
  }

  function persistShadowIntent(record) {
    const store=storage();
    const key=INTENT_PREFIX+record.prestateFingerprintSha256;
    const existing=readExactTerminalShadowIntent(store,key,record);
    if(existing) {
      return shadowIntentSummary(key,existing,true);
    }

    const payload=JSON.stringify({
      schemaVersion:1,
      testId:TEST_ID,
      version:VERSION,
      art:'PR20_8_COMPOUND_DURABLE_SHADOW_INTENT_NO_GAMEPLAY_WRITE',
      createdAtMs:Date.now(),
      terminal:true,
      journalTerminalArt:'ABBRUCH',
      sendBoundaryState:'NICHT_GESENDET',
      sameIntentRetry:false,
      actionContractId:'AL-ACTION-COMPOUND',
      recoveryContractId:'AL-RECOVERY-COMPOUND',
      verifierId:'AL-VERIFIER-COMPOUND',
      publicFunction:'compound',
      sourceSnapshotCommit:SOURCE_SNAPSHOT_COMMIT,
      ratifiedCandidateEvidenceCommit:RATIFIED_CANDIDATE_EVIDENCE_COMMIT,
      serviceReachability:record.serviceReachability,
      recipient:record.recipient,
      candidate:record.candidate,
      scroll:record.scroll,
      offering:null,
      normalPathOnly:true,
      resourceClaims:expectedResourceClaims(),
      oneShot:{
        bindingPrepared:true,
        maximumUses:1,
        compoundAuthorityIssued:false
      },
      fingerprints:{
        prestate:record.prestateFingerprintSha256,
        inventory:record.inventoryFingerprintSha256,
        q:record.qFingerprintSha256,
        candidate:record.candidateFingerprintSha256,
        scroll:record.scrollFingerprintSha256,
        compoundEffects:record.compoundEffectsFingerprintSha256,
        itemDefinition:record.itemDefinitionFingerprintSha256,
        scrollDefinition:record.scrollDefinitionFingerprintSha256
      },
      exactPhysicalCandidateIndexesPinned:true,
      exactPhysicalScrollIndexPinned:true,
      freshReresolutionRequiredBeforeFutureSend:true,
      durableShadowOnly:true,
      gameplayAuthority:false,
      rawWriteAuthority:false,
      compoundAuthority:false,
      normalCompoundWriteRatification:false,
      normalRuntimeAllowed:false
    });
    store.setItem(key,payload);
    const readback=store.getItem(key);
    if(readback!==payload) {
      throw new Error('PR20_8_COMPOUND_SHADOW_DURABLE_READBACK_MISMATCH');
    }
    const decoded=readExactTerminalShadowIntent(store,key,record);
    if(!decoded) {
      throw new Error('PR20_8_COMPOUND_SHADOW_DURABLE_INTENT_INVALID');
    }
    return shadowIntentSummary(key,decoded,false);
  }

  function emit(type,severity,data={}) {
    seq += 1;
    events.push({
      seq,
      ts:new Date().toISOString(),
      event:type,
      type,
      severity,
      reason:data.reason || null,
      component:'v5-pr20-8-compound-shadow-no-write',
      data
    });
    if (events.length > 128) events.splice(0,events.length-128);
  }

  function setState(patch) {
    state = {
      ...state,
      ...patch,
      updatedAtMs:Date.now(),
      intents:[],
      gameplayWrites:0,
      publicFunctionCalls:0,
      rawWriteCalls:0,
      startCalls:0,
      disconnectCalls:0,
      farmerWorkersInstalled:0,
      sameIntentRetry:false,
      normalRuntimeAllowed:false,
      authority:{
        authorityIssued:false,
        durableIntentCreated:false,
        compoundAuthority:false,
        gameplayAuthority:false,
        rawWriteAuthority:false,
        normalCompoundWriteRatification:false
      }
    };
    return state;
  }

  function installTelemetryFacade(owner) {
    if (!owner) return;
    owner.AIO_V3 = owner.AIO_V3 || {};
    const existing = owner.AIO_V3.operations && typeof owner.AIO_V3.operations === 'object'
      ? owner.AIO_V3.operations
      : null;
    const oldStatus = existing && typeof existing.status === 'function'
      ? existing.status.bind(existing)
      : null;
    const oldHeartbeat = existing && typeof existing.hostHeartbeat === 'function'
      ? existing.hostHeartbeat.bind(existing)
      : null;
    owner.AIO_V3.operations = {
      ...(existing || {}),
      __v5Pr208CompoundShadowFacadeVersion:VERSION,
      status:() => {
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
      hostHeartbeat:() => {
        try {
          const value=oldHeartbeat?oldHeartbeat():null;
          if(value&&typeof value==='object') {
            return {...value,v5Mode:'V5_AUTONOMOUS_TEST',v5TestId:TEST_ID,v5ObservedAtMs:Date.now()};
          }
        } catch {}
        return {schemaVersion:1,alive:true,mode:'V5_AUTONOMOUS_TEST',testId:TEST_ID,observedAtMs:Date.now()};
      },
      reconciliationStatus:() => ({
        schemaVersion:1,
        status:state.terminal?'TERMINAL_NO_MUTATION':'NO_MUTATION_RECONCILIATION_REQUIRED',
        v5AutonomousTestStatus:state.status,
        v5Terminal:state.terminal===true,
        sameIntentRetry:false
      }),
      peekTelemetry:(limit=2000) =>
        events.slice(-Math.max(1,Math.min(2000,Number(limit)||2000)))
    };
  }

  function publishTelemetryFacades() {
    const r = root();
    installTelemetryFacade(r);
    if (globalThis !== r) installTelemetryFacade(globalThis);
    try {
      const host = globalThis.parent;
      if (host && host !== globalThis && host !== r) installTelemetryFacade(host);
    } catch {}
  }

  async function run() {
    publishTelemetryFacades();
    emit('PR20_8_COMPOUND_SHADOW_NO_WRITE_STARTED','INFO');

    const performanceTrick=await ensurePerformanceTrick();
    if(!performanceTrick.active) {
      setState({
        status:'BLOCKIERT',
        phase:'BACKGROUND_EXECUTION',
        terminal:true,
        blocker:['PR20_8_COMPOUND_SHADOW_PERFORMANCE_TRICK_NICHT_AKTIV'],
        performanceTrick
      });
      return;
    }

    const first=observation();
    const firstIdentity=stableIdentity(first);
    await sleep(DOUBLE_OBSERVE_DELAY_MS);
    const second=observation();
    const secondIdentity=stableIdentity(second);
    if(firstIdentity!==secondIdentity) {
      throw new Error('PR20_8_COMPOUND_SHADOW_PREFLIGHT_SNAPSHOT_DRIFT');
    }

    const [
      prestateFingerprintSha256,
      inventoryFingerprintSha256,
      qFingerprintSha256,
      candidateFingerprintSha256,
      scrollFingerprintSha256,
      compoundEffectsFingerprintSha256,
      itemDefinitionFingerprintSha256,
      scrollDefinitionFingerprintSha256
    ]=await Promise.all([
      sha256(secondIdentity),
      sha256(second.inventoryMaterial),
      sha256(second.qMaterial),
      sha256(second.candidate.material),
      sha256(second.scroll.material),
      sha256(second.compoundEffectMaterial),
      sha256(second.itemDefinitionMaterial),
      sha256(second.scrollDefinitionMaterial)
    ]);

    const shadowIntent=persistShadowIntent({
      recipient:{
        characterName:second.characterName,
        sessionId:second.sessionId,
        ctype:second.ctype,
        serverRegion:second.serverRegion,
        serverIdentifier:second.serverIdentifier
      },
      serviceReachability:second.service,
      candidate:{
        name:second.candidate.name,
        level:second.candidate.level,
        index:second.candidate.index,
        indexes:second.candidate.indexes,
        quantity:second.candidate.quantity,
        quantityEach:second.candidate.quantityEach,
        baseGold:second.candidate.baseGold,
        materials:second.candidate.materials,
        material:second.candidate.material
      },
      scroll:{
        name:second.scroll.name,
        index:second.scroll.index,
        observedQuantity:second.scroll.observedQuantity,
        consumeQuantity:second.scroll.consumeQuantity,
        material:second.scroll.material
      },
      prestateFingerprintSha256,
      inventoryFingerprintSha256,
      qFingerprintSha256,
      candidateFingerprintSha256,
      scrollFingerprintSha256,
      compoundEffectsFingerprintSha256,
      itemDefinitionFingerprintSha256,
      scrollDefinitionFingerprintSha256
    });

    await sleep(DOUBLE_OBSERVE_DELAY_MS);
    const third=observation();
    const thirdIdentity=stableIdentity(third);
    if(thirdIdentity!==secondIdentity) {
      throw new Error('PR20_8_COMPOUND_SHADOW_POST_INTENT_DRIFT');
    }
    const postIntentPrestateFingerprintSha256=await sha256(thirdIdentity);
    if(postIntentPrestateFingerprintSha256!==prestateFingerprintSha256) {
      throw new Error('PR20_8_COMPOUND_SHADOW_PRESTATE_HASH_DRIFT');
    }

    const evidence={
      schemaVersion:1,
      evidenceArt:'V5_PR20_8_COMPOUND_DURABLE_SHADOW_NO_WRITE',
      status:'BESTANDEN',
      observedAtMs:Date.now(),
      recipient:{
        characterName:second.characterName,
        sessionId:second.sessionId,
        ctype:second.ctype,
        level:second.level,
        map:second.map,
        serverRegion:second.serverRegion,
        serverIdentifier:second.serverIdentifier
      },
      candidate:{
        name:second.candidate.name,
        level:second.candidate.level,
        inventoryIndexes:second.candidate.indexes,
        quantity:second.candidate.quantity,
        quantityEach:second.candidate.quantityEach,
        baseGold:second.candidate.baseGold,
        matchingCandidateCount:second.matchingCandidateCount,
        fingerprintSha256:candidateFingerprintSha256
      },
      scroll:{
        name:second.scroll.name,
        inventoryIndex:second.scroll.index,
        observedQuantity:second.scroll.observedQuantity,
        consumeQuantity:second.scroll.consumeQuantity,
        fingerprintSha256:scrollFingerprintSha256
      },
      offering:null,
      normalPathOnly:true,
      publicFunction:'compound',
      publicFunctionAvailable:second.publicFunctionAvailable,
      sourceSnapshotCommit:SOURCE_SNAPSHOT_COMMIT,
      ratifiedCandidateEvidenceCommit:RATIFIED_CANDIDATE_EVIDENCE_COMMIT,
      serviceReachability:second.service,
      fingerprints:{
        prestateFingerprintSha256,
        postIntentPrestateFingerprintSha256,
        inventoryFingerprintSha256,
        qFingerprintSha256,
        candidateFingerprintSha256,
        scrollFingerprintSha256,
        compoundEffectsFingerprintSha256,
        itemDefinitionFingerprintSha256,
        scrollDefinitionFingerprintSha256
      },
      shadowIntent,
      stableDoubleObservation:true,
      stablePostIntentReobserve:true,
      durableIntentCreatedShadowOnly:shadowIntent.createdThisRun===true,
      durableTerminalIntentPresent:true,
      durableTerminalIntentRecovered:shadowIntent.recoveredExistingTerminal===true,
      durableRecoveredVersion:shadowIntent.recoveredVersion,
      durableReadback:true,
      journalTerminalArt:'ABBRUCH',
      sendBoundaryState:'NICHT_GESENDET',
      reconciliationClassification:'NOT_APPLIED',
      exactPhysicalCandidateIndexesPinned:true,
      exactPhysicalScrollIndexPinned:true,
      freshReresolutionRequiredBeforeFutureSend:true,
      oneShotBindingPrepared:true,
      oneShotMaximumUses:1,
      oneShotCompoundAuthorityIssued:false,
      inventoryFencePrepared:true,
      qFencePrepared:true,
      compoundActionChannelFencePrepared:true,
      socketBudgetFencePrepared:true,
      performanceTrick,
      gameplayWrites:0,
      publicFunctionCalls:0,
      rawWriteCalls:0,
      startCalls:0,
      disconnectCalls:0,
      farmerWorkersInstalled:0,
      authorityIssued:false,
      compoundAuthority:false,
      gameplayAuthority:false,
      rawWriteAuthority:false,
      normalCompoundWriteRatification:false,
      sameIntentRetry:false,
      normalRuntimeAllowed:false
    };

    setState({
      status:'BESTANDEN',
      phase:'COMPLETE',
      terminal:true,
      blocker:[],
      performanceTrick,
      evidence
    });
    emit('PR20_8_COMPOUND_SHADOW_NO_WRITE_PASSED','INFO',{
      prestateFingerprintSha256,
      candidateIndexes:second.candidate.indexes,
      scrollIndex:second.scroll.index
    });
  }

  publishTelemetryFacades();
  const api=Object.freeze({
    version:VERSION,
    testId:TEST_ID,
    status:() => state,
    start:() => run()
  });
  globalThis.V5PR208CompoundDurableShadowNoWrite=api;
  try {
    const r=root();
    if (r !== globalThis) r.V5PR208CompoundDurableShadowNoWrite=api;
  } catch {}
  try {
    if (globalThis.parent && globalThis.parent !== globalThis)
      globalThis.parent.V5PR208CompoundDurableShadowNoWrite=api;
  } catch {}

  Promise.resolve().then(run).catch(error => {
    const message=text(error?.message||error||'PR20_8_COMPOUND_SHADOW_FEHLER',240);
    setState({
      status:'FEHLER',
      phase:state.phase||'UNKNOWN',
      terminal:true,
      error:message,
      blocker:[message]
    });
    emit('PR20_8_COMPOUND_SHADOW_NO_WRITE_ERROR','ERROR',{reason:message});
  });
})();
