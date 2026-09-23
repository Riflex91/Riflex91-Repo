(() => {
  'use strict';

  const TEST_ID = 'pr20-7-gear-occupied-slot-readonly-preflight';
  const VERSION = '1.0.0';
  const REGISTRY_KEY = 'AIO_V5_PR20_7_GEAR_READONLY_OBSERVATIONS_V1';
  const HEARTBEAT_MS = 2_000;
  const SAFE_SLOTS = Object.freeze([
    'cape','belt','amulet','orb','helmet','gloves','shoes','pants','chest'
  ]);
  const EXPECTED = Object.freeze({
    ranger: 'My_Ranger1',
    priest: 'My_Priest',
    mage: 'My_Mage'
  });

  const text = value => String(value == null ? '' : value).trim();
  const local = globalThis;
  let host = globalThis;
  try {
    if (globalThis.parent && globalThis.parent !== globalThis) host = globalThis.parent;
  } catch {}

  let state = Object.freeze({
    schemaVersion: 1,
    testId: TEST_ID,
    version: VERSION,
    name: text(local.character?.name || host.character?.name),
    ctype: text(local.character?.ctype || host.character?.ctype).toLowerCase(),
    active: true,
    status: 'STARTING',
    phase: 'WORKER_PREFLIGHT',
    terminal: false,
    performanceTrick: false,
    eligible: false,
    candidate: null,
    blocker: null,
    gameplayWrites: 0,
    rawWriteCalls: 0,
    sameIntentRetry: false,
    observedAtMs: Date.now()
  });

  function setState(patch) {
    state = Object.freeze({ ...state, ...patch, observedAtMs: Date.now() });
    return state;
  }

  function rootCharacter() {
    return local.character || host.character || null;
  }

  function storage() {
    try { if (local.localStorage) return local.localStorage; } catch {}
    try { if (host.localStorage) return host.localStorage; } catch {}
    return null;
  }

  function canonical(value) {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
    return '{' + Object.keys(value).sort()
      .map(key => JSON.stringify(key) + ':' + canonical(value[key]))
      .join(',') + '}';
  }

  async function sha256(value) {
    const cryptoApi = local.crypto || host.crypto;
    if (!cryptoApi?.subtle?.digest || typeof TextEncoder !== 'function') {
      throw new Error('PR20_7_WEB_CRYPTO_UNAVAILABLE');
    }
    const bytes = new TextEncoder().encode(String(value));
    const digest = await cryptoApi.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), byte =>
      byte.toString(16).padStart(2, '0')).join('');
  }

  async function ensurePerformanceTrick() {
    let called = false;
    for (const candidate of [local, host]) {
      try {
        if (typeof candidate?.performance_trick !== 'function') continue;
        candidate.performance_trick();
        called = true;
        break;
      } catch {}
    }
    if (!called) return false;
    await new Promise(resolve => setTimeout(resolve, 350));
    for (const candidate of [local, host]) {
      try {
        const empty = candidate?.sounds?.empty;
        if (empty && typeof empty.playing === 'function' && empty.playing() === true) {
          return true;
        }
      } catch {}
    }
    return false;
  }

  function runtimeConflict() {
    try {
      if (local.AIO_V3?.__runtime?.timer || host.AIO_V3?.__runtime?.timer) {
        return 'AIO_V3_RUNTIME_ACTIVE';
      }
    } catch {
      return 'AIO_V3_RUNTIME_UNREADABLE';
    }
    try {
      if (local.V4ProduktionsLaufzeit || local.AIO_V4 || local.V4Runtime
          || host.V4ProduktionsLaufzeit || host.AIO_V4 || host.V4Runtime) {
        return 'V4_RUNTIME_ACTIVE';
      }
    } catch {
      return 'V4_RUNTIME_UNREADABLE';
    }
    return null;
  }

  function serverBinding() {
    const region = [
      local.server_region, local.server?.region,
      host.server_region, host.server?.region
    ].map(text).find(Boolean) || '';
    const identifier = [
      local.server_identifier, local.server?.id,
      host.server_identifier, host.server?.id
    ].map(text).find(Boolean) || '';
    return { region, identifier };
  }

  async function accountKey() {
    const c = rootCharacter();
    const raw = text(local.user_id || host.user_id || c?.owner);
    return raw ? sha256('account:' + raw) : '';
  }

  function isLocked(item) {
    return item?.l === true || item?.locked === true || item?.lock === true;
  }

  async function fingerprintItem(item) {
    if (!item || typeof item !== 'object' || !text(item.name)) return null;
    return sha256(canonical(item));
  }

  async function observe() {
    const c = rootCharacter();
    if (!c || !Array.isArray(c.items) || !c.slots) {
      throw new Error('PR20_7_CHARACTER_STATE_UNAVAILABLE');
    }
    const name = text(c.name);
    const ctype = text(c.ctype || c.type).toLowerCase();
    if (EXPECTED[ctype] !== name) throw new Error('PR20_7_WORKER_IDENTITY_NOT_ALLOWED');

    const conflict = runtimeConflict();
    if (conflict) throw new Error(conflict);

    const server = serverBinding();
    const account = await accountKey();
    if (!account || !server.region || !server.identifier || !text(c.id)) {
      throw new Error('PR20_7_BINDING_INCOMPLETE');
    }

    const inventory = await Promise.all(c.items.map(async (item, index) => ({
      index,
      item,
      fingerprint: await fingerprintItem(item)
    })));
    const slots = [];
    for (const slot of SAFE_SLOTS) {
      const item = c.slots?.[slot] || null;
      slots.push({ slot, item, fingerprint: await fingerprintItem(item) });
    }

    const allFingerprints = [
      ...inventory.map(row => row.fingerprint),
      ...slots.map(row => row.fingerprint)
    ].filter(Boolean);
    const countFingerprint = fp => allFingerprints.filter(value => value === fp).length;

    const candidates = [];
    for (const slotRow of slots) {
      const oldItem = slotRow.item;
      const oldFp = slotRow.fingerprint;
      if (!oldItem || !oldFp || oldItem.b === true || isLocked(oldItem)) continue;
      if (countFingerprint(oldFp) !== 1) continue;

      for (const row of inventory) {
        if (!row.item || !row.fingerprint) continue;
        if (row.item.b === true || isLocked(row.item)) continue;
        if (row.fingerprint === oldFp) continue;
        if (countFingerprint(row.fingerprint) !== 1) continue;
        const def = (local.G || host.G)?.items?.[row.item.name];
        if (!def || text(def.type) !== slotRow.slot) continue;

        const restInventory = inventory.map(entry => [
          entry.index,
          entry.index === row.index ? '__PR20_7_CANDIDATE__' : entry.fingerprint
        ]);
        const restEquipment = slots.map(entry => [
          entry.slot,
          entry.slot === slotRow.slot ? '__PR20_7_TARGET_SLOT__' : entry.fingerprint
        ]);
        const restInventoryFingerprint = await sha256(canonical(restInventory));
        const restEquipmentFingerprint = await sha256(canonical(restEquipment));
        const candidatePhysicalId = await sha256(
          account + '|' + name + '|candidate|' + row.fingerprint
        );
        const oldPhysicalId = await sha256(
          account + '|' + name + '|equipped|' + oldFp
        );
        const evidenceFingerprint = await sha256(canonical({
          account,
          name,
          ctype,
          sessionId: text(c.id),
          serverRegion: server.region,
          serverIdentifier: server.identifier,
          slot: slotRow.slot,
          candidateIndex: row.index,
          candidateFingerprint: row.fingerprint,
          oldFingerprint: oldFp,
          restInventoryFingerprint,
          restEquipmentFingerprint
        }));

        candidates.push({
          slot: slotRow.slot,
          candidateIndex: row.index,
          candidate: {
            name: text(row.item.name),
            level: Number(row.item.level || 0),
            fingerprint: row.fingerprint,
            physicalId: candidatePhysicalId
          },
          previousSlotItem: {
            name: text(oldItem.name),
            level: Number(oldItem.level || 0),
            fingerprint: oldFp,
            physicalId: oldPhysicalId
          },
          restInventoryFingerprint,
          restEquipmentFingerprint,
          evidenceFingerprint
        });
      }
    }

    candidates.sort((a, b) =>
      SAFE_SLOTS.indexOf(a.slot) - SAFE_SLOTS.indexOf(b.slot)
      || a.candidateIndex - b.candidateIndex
      || a.candidate.name.localeCompare(b.candidate.name));

    return Object.freeze({
      schemaVersion: 1,
      testId: TEST_ID,
      version: VERSION,
      name,
      ctype,
      sessionId: text(c.id),
      accountKey: account,
      serverRegion: server.region,
      serverIdentifier: server.identifier,
      performanceTrick: true,
      runtimeConflict: null,
      eligible: candidates.length > 0,
      candidateCount: candidates.length,
      candidate: candidates[0] || null,
      gameplayWrites: 0,
      rawWriteCalls: 0,
      sameIntentRetry: false,
      observedAtMs: Date.now()
    });
  }

  async function publish() {
    try {
      const observation = await observe();
      setState({
        status: 'WORKER',
        phase: 'HEARTBEAT',
        performanceTrick: true,
        eligible: observation.eligible,
        candidate: observation.candidate,
        blocker: observation.eligible ? null : 'PR20_7_NO_SAFE_OCCUPIED_SWAP_CANDIDATE'
      });
      const store = storage();
      if (!store) throw new Error('PR20_7_LOCAL_STORAGE_UNAVAILABLE');
      let registry = { schemaVersion: 1, observations: {} };
      try {
        const raw = store.getItem(REGISTRY_KEY);
        if (raw) registry = JSON.parse(raw);
      } catch {}
      const observations = registry?.observations && typeof registry.observations === 'object'
        ? registry.observations
        : {};
      store.setItem(REGISTRY_KEY, JSON.stringify({
        schemaVersion: 1,
        observations: { ...observations, [observation.name]: observation }
      }));
    } catch (error) {
      setState({
        status: 'BLOCKIERT',
        phase: 'WORKER_PREFLIGHT',
        eligible: false,
        candidate: null,
        blocker: text(error?.message || error || 'PR20_7_WORKER_FAILED').slice(0, 160),
        gameplayWrites: 0,
        rawWriteCalls: 0,
        sameIntentRetry: false
      });
    }
  }

  const c = rootCharacter();
  const name = text(c?.name);
  const ctype = text(c?.ctype || c?.type).toLowerCase();
  if (EXPECTED[ctype] !== name) {
    setState({ status: 'BLOCKIERT', blocker: 'PR20_7_WORKER_IDENTITY_NOT_ALLOWED' });
  } else {
    Promise.resolve().then(async () => {
      const armed = await ensurePerformanceTrick();
      if (!armed) {
        setState({
          status: 'BLOCKIERT',
          blocker: 'PR20_7_WORKER_PERFORMANCE_TRICK_UNAVAILABLE',
          performanceTrick: false
        });
        return;
      }
      setState({ performanceTrick: true });
      await publish();
      try {
        if (globalThis.__V5_PR20_7_GEAR_WORKER_TIMER) {
          clearInterval(globalThis.__V5_PR20_7_GEAR_WORKER_TIMER);
        }
      } catch {}
      globalThis.__V5_PR20_7_GEAR_WORKER_TIMER = setInterval(() => {
        void publish();
      }, HEARTBEAT_MS);
    });
  }

  Object.defineProperty(globalThis, 'V5PR207GearWorker', {
    configurable: true,
    enumerable: true,
    writable: false,
    value: Object.freeze({
      version: VERSION,
      testId: TEST_ID,
      status: () => ({ ...state })
    })
  });
})();