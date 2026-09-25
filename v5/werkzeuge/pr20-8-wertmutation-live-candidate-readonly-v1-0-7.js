(() => {
  'use strict';

  const TEST_ID = 'pr20-8-wertmutation-live-candidate-readonly';
  const VERSION = '1.0.7';
  const EXPECTED_CHARACTER = 'My_Merchant';
  const EXPECTED_CLASS = 'merchant';
  const EXPECTED_SERVER_REGION = 'EU';
  const EXPECTED_SERVER_IDENTIFIER = 'I';
  const MAX_UPGRADE_BASE_GOLD = 10000;
  const MAX_COMPOUND_BASE_GOLD = 30000;
  const MAX_EXCHANGE_BASE_GOLD = 50000;
  const MAX_NORMAL_LEVEL = 1;
  const SPECIAL_EXCHANGE_NAMES = Object.freeze(new Set(['sixcake']));
  const EXCLUSIVE_EXCHANGE_TEST_EXCEPTION = 'anniversarygift';

  const state = {
    schemaVersion: 1,
    testId: TEST_ID,
    version: VERSION,
    phase: 'PR20_8_LIVE_CANDIDATE_SELECTION',
    status: 'BOOT',
    terminal: false,
    blocker: [],
    startedAtMs: Date.now(),
    updatedAtMs: Date.now(),
    recipient: null,
    inventoryFingerprintMaterial: null,
    qFingerprintMaterial: null,
    observations: {
      UPGRADE: null,
      COMPOUND: null,
      EXCHANGE: null
    },
    selectedCandidates: {
      UPGRADE: null,
      COMPOUND: null,
      EXCHANGE: null
    },
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
      gameplayAuthority: false,
      rawWriteAuthority: false,
      upgradeAuthority: false,
      compoundAuthority: false,
      exchangeAuthority: false
    },
    performanceTrick: null
  };

  function text(value, max = 192) {
    return String(value == null ? '' : value).trim().slice(0, max);
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function roots() {
    const out = [];
    try { out.push(globalThis); } catch {}
    try {
      if (globalThis.parent
          && globalThis.parent !== globalThis
          && !out.includes(globalThis.parent)) {
        out.push(globalThis.parent);
      }
    } catch {}
    return out;
  }

  function root() {
    for (const candidate of roots()) {
      try {
        if (candidate?.character
            && Array.isArray(candidate.character.items)
            && candidate.G?.items) {
          return candidate;
        }
      } catch {}
    }
    throw new Error('PR20_8_CANDIDATE_SPIELKONTEXT_FEHLT');
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
      if (status?.running === true || status?.aktivFreigegeben === true) return 'V4_RUNTIME_ACTIVE';
    } catch {
      return 'V4_RUNTIME_UNREADABLE';
    }
    return null;
  }

  async function performanceStatus() {
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
        const audio = candidate?.sounds?.empty;
        if (!audio) continue;
        audioFound = true;
        if (audio.cplaying === true) cplaying = true;
        if (typeof audio.playing === 'function' && audio.playing() === true) playing = true;
        else if (audio.playing === true) playing = true;
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

  function stableItem(item) {
    if (!item || typeof item !== 'object') return null;
    const out = {};
    for (const key of Object.keys(item).sort()) {
      const value = item[key];
      if (value == null || ['string','number','boolean'].includes(typeof value)) out[key] = value;
    }
    return JSON.stringify(out);
  }

  function stableQ(q) {
    if (!q || typeof q !== 'object') return '{}';
    const out = {};
    for (const key of Object.keys(q).sort()) {
      const value = q[key];
      if (value == null || ['string','number','boolean'].includes(typeof value)) out[key] = value;
      else if (value && typeof value === 'object') {
        const nested = {};
        for (const nk of Object.keys(value).sort()) {
          const nv = value[nk];
          if (nv == null || ['string','number','boolean'].includes(typeof nv)) nested[nk] = nv;
        }
        out[key] = nested;
      }
    }
    return JSON.stringify(out);
  }

  function blockedItem(item, def, allowAnniversaryGiftExclusive = false) {
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
      || (def.exclusive === true
        && !(allowAnniversaryGiftExclusive
          && text(item?.name,128) === EXCLUSIVE_EXCHANGE_TEST_EXCEPTION));
  }

  function levelOf(item) {
    const n = Number(item?.level || 0);
    return Number.isSafeInteger(n) && n >= 0 ? n : null;
  }

  function quantityOf(item) {
    const n = Number(item?.q == null ? 1 : item.q);
    return Number.isSafeInteger(n) && n >= 1 ? n : null;
  }

  function gradeForLevel(def, level) {
    const grades = Array.isArray(def?.grades) ? def.grades : [9, 10, 11, 12];
    for (let index = Math.min(3, grades.length - 1); index >= 0; index -= 1) {
      const threshold = Number(grades[index]);
      if (Number.isFinite(threshold) && level >= threshold) return index + 1;
    }
    return 0;
  }

  function stackQuantity(items, name) {
    let total = 0;
    for (const item of items) {
      if (!item || item.name !== name) continue;
      const q = quantityOf(item);
      if (q) total += q;
    }
    return total;
  }

  function itemView(item, index, G) {
    if (!item || typeof item !== 'object') return null;
    const name = text(item.name, 128);
    const def = G.items?.[name];
    const level = levelOf(item);
    const quantity = quantityOf(item);
    if (!name || !def || level === null || quantity === null) return null;
    return {
      index,
      name,
      level,
      quantity,
      type: text(def.type, 64),
      baseGold: Number.isFinite(Number(def.g)) ? Number(def.g) : null,
      locked: item.l === true || item.locked === true || item.lock === true,
      blocked: item.b === true || item.blocked === true,
      specialProperty: item.p != null,
      gift: item.gift != null,
      definitionFlags: {
        cash: def.cash === true,
        event: def.event === true,
        quest: def.quest === true,
        exclusive: def.exclusive === true
      },
      material: stableItem(item)
    };
  }

  function scanUpgrade(items, G) {
    const candidates = [];
    const rejected = [];
    for (let index = 0; index < items.length && index < 128; index += 1) {
      const item = items[index];
      if (!item || typeof item !== 'object') continue;
      const def = G.items?.[item.name];
      if (!def?.upgrade) continue;
      const level = levelOf(item);
      const q = quantityOf(item);
      const baseGold = Number(def.g);
      const view = itemView(item, index, G);
      if (level === null || q !== 1 || blockedItem(item, def)) {
        rejected.push({ index, name:text(item.name,128), reason:'UNSAFE_PHYSICAL_ITEM' });
        continue;
      }
      if (level > MAX_NORMAL_LEVEL) {
        rejected.push({ index, name:text(item.name,128), reason:'LEVEL_ABOVE_FIRST_LIVE_CAP', level });
        continue;
      }
      if (!Number.isFinite(baseGold) || baseGold < 0 || baseGold > MAX_UPGRADE_BASE_GOLD) {
        rejected.push({ index, name:text(item.name,128), reason:'BASE_VALUE_ABOVE_FIRST_LIVE_CAP', baseGold:Number.isFinite(baseGold)?baseGold:null });
        continue;
      }
      const grade = gradeForLevel(def, level);
      if (grade > 2) {
        rejected.push({ index, name:text(item.name,128), reason:'SCROLL_GRADE_ABOVE_FIRST_LIVE_CAP', grade });
        continue;
      }
      const scrollName = 'scroll' + grade;
      const scrollQuantity = stackQuantity(items, scrollName);
      if (scrollQuantity < 1) {
        rejected.push({ index, name:text(item.name,128), reason:'REQUIRED_SCROLL_MISSING', scrollName });
        continue;
      }
      candidates.push({
        family:'UPGRADE',
        candidate:view,
        scroll:{ name:scrollName, observedQuantity:scrollQuantity },
        offering:null,
        normalPathOnly:true,
        exactPhysicalIndexMustBeReresolvedBeforeSend:true,
        liveAuthority:false
      });
    }
    candidates.sort((a,b) =>
      a.candidate.baseGold - b.candidate.baseGold
      || a.candidate.level - b.candidate.level
      || a.candidate.name.localeCompare(b.candidate.name)
      || a.candidate.index - b.candidate.index
    );
    return {
      family:'UPGRADE',
      status:candidates.length ? 'KANDIDAT_GEFUNDEN' : 'KEIN_KANDIDAT',
      candidateCount:candidates.length,
      selected:candidates[0] || null,
      rejected:rejected.slice(0,32)
    };
  }

  function scanCompound(items, G) {
    const groups = new Map();
    const rejected = [];
    for (let index = 0; index < items.length && index < 128; index += 1) {
      const item = items[index];
      if (!item || typeof item !== 'object') continue;
      const def = G.items?.[item.name];
      if (!def?.compound) continue;
      const level = levelOf(item);
      const q = quantityOf(item);
      const baseGold = Number(def.g);
      if (level === null || q !== 1 || blockedItem(item, def)) {
        rejected.push({ index, name:text(item.name,128), reason:'UNSAFE_PHYSICAL_ITEM' });
        continue;
      }
      if (level > MAX_NORMAL_LEVEL) {
        rejected.push({ index, name:text(item.name,128), reason:'LEVEL_ABOVE_FIRST_LIVE_CAP', level });
        continue;
      }
      if (!Number.isFinite(baseGold) || baseGold < 0 || baseGold > MAX_COMPOUND_BASE_GOLD) {
        rejected.push({ index, name:text(item.name,128), reason:'BASE_VALUE_ABOVE_FIRST_LIVE_CAP', baseGold:Number.isFinite(baseGold)?baseGold:null });
        continue;
      }
      const grade = gradeForLevel(def, level);
      if (grade > 2) {
        rejected.push({ index, name:text(item.name,128), reason:'CSCROLL_GRADE_ABOVE_FIRST_LIVE_CAP', grade });
        continue;
      }
      const key = text(item.name,128) + '|' + String(level);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push({ item, index, def, level, baseGold, grade });
    }

    const candidates = [];
    for (const rows of groups.values()) {
      if (rows.length < 3) continue;
      rows.sort((a,b) => a.index-b.index);
      const first = rows[0];
      const scrollName = 'cscroll' + first.grade;
      const scrollQuantity = stackQuantity(items, scrollName);
      if (scrollQuantity < 1) {
        rejected.push({ name:text(first.item.name,128), level:first.level, reason:'REQUIRED_CSCROLL_MISSING', scrollName });
        continue;
      }
      candidates.push({
        family:'COMPOUND',
        candidates:rows.slice(0,3).map(row => itemView(row.item,row.index,G)),
        scroll:{ name:scrollName, observedQuantity:scrollQuantity },
        offering:null,
        normalPathOnly:true,
        exactPhysicalIndexesMustBeReresolvedBeforeSend:true,
        liveAuthority:false,
        baseGold:first.baseGold,
        level:first.level,
        name:text(first.item.name,128)
      });
    }
    candidates.sort((a,b) =>
      a.baseGold-b.baseGold
      || a.level-b.level
      || a.name.localeCompare(b.name)
      || a.candidates[0].index-b.candidates[0].index
    );
    return {
      family:'COMPOUND',
      status:candidates.length ? 'KANDIDAT_GEFUNDEN' : 'KEIN_KANDIDAT',
      candidateCount:candidates.length,
      selected:candidates[0] || null,
      rejected:rejected.slice(0,32)
    };
  }

  function scanExchange(items, G) {
    const candidates = [];
    const rejected = [];
    for (let index = 0; index < items.length && index < 128; index += 1) {
      const item = items[index];
      if (!item || typeof item !== 'object') continue;
      const def = G.items?.[item.name];
      const required = Number(def?.e);
      if (!Number.isSafeInteger(required) || required < 1) continue;
      const q = quantityOf(item);
      const baseGold = Number(def.g);
      if (q === null || blockedItem(item, def, true)) {
        rejected.push({ index, name:text(item.name,128), reason:'UNSAFE_PHYSICAL_ITEM' });
        continue;
      }
      if (q < required) {
        rejected.push({ index, name:text(item.name,128), reason:'EXCHANGE_QUANTITY_INSUFFICIENT', required, observed:q });
        continue;
      }
      if (SPECIAL_EXCHANGE_NAMES.has(text(item.name,128))) {
        rejected.push({ index, name:text(item.name,128), reason:'SPECIAL_MULTI_OUTPUT_EXCLUDED' });
        continue;
      }
      if (!Number.isFinite(baseGold) || baseGold < 0 || baseGold > MAX_EXCHANGE_BASE_GOLD) {
        rejected.push({ index, name:text(item.name,128), reason:'BASE_VALUE_ABOVE_FIRST_LIVE_CAP', baseGold:Number.isFinite(baseGold)?baseGold:null });
        continue;
      }
      candidates.push({
        family:'EXCHANGE',
        candidate:itemView(item,index,G),
        exchangeQuantity:required,
        exclusiveTestException:text(item.name,128) === EXCLUSIVE_EXCHANGE_TEST_EXCEPTION,
        normalPathOnly:true,
        massExchangeAllowed:false,
        recursiveDropAuthority:false,
        specialMultiOutputAuthority:false,
        fullRewardDomainReconciliationRequired:true,
        promiseRewardOnlySupportingEvidence:true,
        exactPhysicalIndexMustBeReresolvedBeforeSend:true,
        liveAuthority:false
      });
    }
    candidates.sort((a,b) =>
      a.candidate.baseGold-b.candidate.baseGold
      || a.exchangeQuantity-b.exchangeQuantity
      || a.candidate.name.localeCompare(b.candidate.name)
      || a.candidate.index-b.candidate.index
    );
    return {
      family:'EXCHANGE',
      status:candidates.length ? 'KANDIDAT_GEFUNDEN' : 'KEIN_KANDIDAT',
      candidateCount:candidates.length,
      selected:candidates[0] || null,
      rejected:rejected.slice(0,32)
    };
  }

  function installTelemetryFacade(owner) {
    if (!owner) return;
    owner.AIO_V3 = owner.AIO_V3 || {};
    const existing = owner.AIO_V3.operations && typeof owner.AIO_V3.operations === 'object'
      ? owner.AIO_V3.operations
      : null;
    let existingFacadeIsCurrent = false;
    if (existing?.__v5Pr208CandidateFacadeVersion === VERSION
        && typeof existing.status === 'function') {
      try {
        const current = existing.status()?.v5AutonomousTest;
        existingFacadeIsCurrent = current
          && current.testId === TEST_ID
          && current.version === VERSION;
      } catch {}
    }
    if (existingFacadeIsCurrent) return;

    const oldStatus = existing && typeof existing.status === 'function'
      ? existing.status.bind(existing)
      : null;
    const oldHeartbeat = existing && typeof existing.hostHeartbeat === 'function'
      ? existing.hostHeartbeat.bind(existing)
      : null;

    owner.AIO_V3.operations = {
      ...(existing || {}),
      __v5Pr208CandidateFacadeVersion: VERSION,
      status: () => {
        let base = {};
        try {
          const value = oldStatus ? oldStatus() : null;
          if (value && typeof value === 'object') base = value;
        } catch {}
        return {
          ...base,
          schemaVersion: Number(base.schemaVersion) || 1,
          mode: 'V5_AUTONOMOUS_TEST',
          v5AutonomousTest: clone(state),
          telemetry: { queued:0, lastCapturedSeq:0, dropped:0 }
        };
      },
      hostHeartbeat: () => {
        try {
          const value = oldHeartbeat ? oldHeartbeat() : null;
          if (value && typeof value === 'object') {
            return {
              ...value,
              v5Mode:'V5_AUTONOMOUS_TEST',
              v5TestId:TEST_ID,
              v5ObservedAtMs:Date.now()
            };
          }
        } catch {}
        return {
          schemaVersion:1,
          mode:'V5_AUTONOMOUS_TEST',
          v5Mode:'V5_AUTONOMOUS_TEST',
          v5TestId:TEST_ID,
          alive:true,
          observedAtMs:Date.now(),
          v5ObservedAtMs:Date.now()
        };
      },
      reconciliationStatus: () => ({
        schemaVersion:1,
        status:state.terminal ? 'TERMINAL_NO_MUTATION' : 'OBSERVING',
        v5AutonomousTestStatus:state.status,
        v5Terminal:state.terminal === true,
        sameIntentRetry:false
      }),
      peekTelemetry: () => []
    };
  }

  function publish() {
    state.updatedAtMs = Date.now();
    for (const owner of roots()) {
      try { installTelemetryFacade(owner); } catch {}
    }
  }

  function finish(status, blockers = []) {
    state.status = status;
    state.terminal = true;
    state.blocker = [...new Set(blockers)];
    state.phase = status === 'BESTANDEN'
      ? 'COMPLETE'
      : 'PR20_8_LIVE_CANDIDATE_SELECTION';
    publish();
  }

  async function run() {
    publish();
    const r = root();
    const c = r.character;
    const server = serverBinding(r);

    if (text(c.name,192) !== EXPECTED_CHARACTER) {
      finish('BLOCKIERT',['PR20_8_CANDIDATE_EXAKTER_MERCHANT_ERFORDERLICH']);
      return;
    }
    if (text(c.ctype || c.type,32).toLowerCase() !== EXPECTED_CLASS) {
      finish('BLOCKIERT',['PR20_8_CANDIDATE_MERCHANT_KLASSE_ERFORDERLICH']);
      return;
    }
    if (!text(c.id,192)) {
      finish('BLOCKIERT',['PR20_8_CANDIDATE_SESSION_FEHLT']);
      return;
    }
    if (server.region !== EXPECTED_SERVER_REGION || server.identifier !== EXPECTED_SERVER_IDENTIFIER) {
      finish('BLOCKIERT',['PR20_8_CANDIDATE_SERVER_BINDUNG_DRIFT']);
      return;
    }
    if (c.rip === true || c.dead === true) {
      finish('BLOCKIERT',['PR20_8_CANDIDATE_CHARACTER_TOT']);
      return;
    }
    if (c.moving === true) {
      finish('BLOCKIERT',['PR20_8_CANDIDATE_CHARACTER_BEWEGT_SICH']);
      return;
    }
    if (c.target !== null && c.target !== undefined && text(c.target,192)) {
      finish('BLOCKIERT',['PR20_8_CANDIDATE_CHARACTER_HAT_ZIEL']);
      return;
    }
    const qMaterial = stableQ(c.q);
    if (c.q && typeof c.q === 'object' && Object.keys(c.q).length) {
      state.qFingerprintMaterial = qMaterial;
      finish('BLOCKIERT',['PR20_8_CANDIDATE_Q_NICHT_FREI']);
      return;
    }
    const conflict = runtimeConflict(r);
    if (conflict) {
      finish('BLOCKIERT',['PR20_8_CANDIDATE_ALTERNATIVE_RUNTIME_AKTIV:' + conflict]);
      return;
    }

    state.performanceTrick = await performanceStatus();
    if (!state.performanceTrick.active) {
      finish('BLOCKIERT',['PR20_8_CANDIDATE_PERFORMANCE_TRICK_BLOCKED']);
      return;
    }

    const items = c.items;
    state.recipient = {
      characterName:text(c.name,192),
      sessionId:text(c.id,192),
      ctype:EXPECTED_CLASS,
      level:Number(c.level || 0),
      map:text(c.map,96),
      serverRegion:server.region,
      serverIdentifier:server.identifier
    };
    state.inventoryFingerprintMaterial = JSON.stringify(items.map(stableItem));
    state.qFingerprintMaterial = qMaterial;

    state.observations.UPGRADE = scanUpgrade(items,r.G);
    state.observations.COMPOUND = scanCompound(items,r.G);
    state.observations.EXCHANGE = scanExchange(items,r.G);
    state.selectedCandidates.UPGRADE = state.observations.UPGRADE.selected;
    state.selectedCandidates.COMPOUND = state.observations.COMPOUND.selected;
    state.selectedCandidates.EXCHANGE = state.observations.EXCHANGE.selected;

    const targetFound = Boolean(
      state.selectedCandidates.COMPOUND
      || state.selectedCandidates.EXCHANGE
    );
    if (!targetFound) {
      finish('BLOCKIERT',['PR20_8_CANDIDATE_KEIN_COMPOUND_ODER_EXCHANGE_NORMALKANDIDAT']);
      return;
    }
    finish('BESTANDEN',[]);
  }

  const api = Object.freeze({
    version:VERSION,
    testId:TEST_ID,
    status:() => clone(state)
  });
  Object.defineProperty(globalThis,'V5PR208ValueMutationLiveCandidateReadonly',{
    configurable:true,
    enumerable:true,
    writable:false,
    value:api
  });
  try {
    if (parent && parent !== globalThis) {
      Object.defineProperty(parent,'V5PR208ValueMutationLiveCandidateReadonly',{
        configurable:true,
        enumerable:true,
        writable:false,
        value:api
      });
    }
  } catch {}

  publish();

  Promise.resolve().then(run).catch(error => {
    state.error = text(error?.message || error,240);
    finish('FEHLER',['PR20_8_CANDIDATE_UNEXPECTED_ERROR']);
  });
})();
