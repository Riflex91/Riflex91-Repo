(() => {
  'use strict';

  const VERSION = '1.0.0';
  const TEST_ID = 'pr20-6-mluck-autonomous-live-5m';
  const ACTORS_KEY = 'AIO_V5_PR20_6_MLUCK_ACTORS_V1';
  const HEARTBEAT_MS = 2_000;
  const EXPECTED = Object.freeze({
    My_Ranger1: 'ranger',
    My_Priest: 'priest',
    My_Mage: 'mage'
  });

  const state = {
    schemaVersion: 1,
    testId: TEST_ID,
    version: VERSION,
    phase: 'STARTING',
    active: false,
    name: null,
    ctype: null,
    performanceTrick: false,
    blocker: null,
    observedAtMs: Date.now()
  };

  const text = value => String(value == null ? '' : value).trim();
  const clone = value => JSON.parse(JSON.stringify(value));

  function root() {
    try {
      return globalThis.parent && globalThis.parent !== globalThis
        ? globalThis.parent
        : globalThis;
    } catch {
      return globalThis;
    }
  }

  function performanceRoots() {
    const roots = [globalThis];
    try {
      const host = root();
      if (host && !roots.includes(host)) roots.push(host);
    } catch {}
    return roots;
  }

  function performanceActive() {
    let available = false;
    let playing = false;
    for (const host of performanceRoots()) {
      try {
        if (typeof host?.performance_trick === 'function') available = true;
        const empty = host?.sounds?.empty;
        if (empty && typeof empty.playing === 'function' && empty.playing() === true)
          playing = true;
      } catch {}
    }
    return available && playing;
  }

  async function armPerformanceTrick() {
    let called = false;
    for (const host of performanceRoots()) {
      try {
        if (typeof host?.performance_trick !== 'function') continue;
        host.performance_trick();
        called = true;
        break;
      } catch {}
    }
    if (!called) return false;
    await new Promise(resolve => setTimeout(resolve, 350));
    return performanceActive();
  }

  function fingerprint(value) {
    const input = JSON.stringify(value);
    let hash = 2166136261;
    for (let i = 0; i < input.length; i += 1) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
  }

  function serverBinding(r) {
    let parentHost = null;
    try { if (r.parent && r.parent !== r) parentHost = r.parent; } catch {}
    const region = [r.server_region, r.server?.region, parentHost?.server_region, parentHost?.server?.region]
      .map(text).find(Boolean) || '';
    const identifier = [r.server_identifier, r.server?.id, parentHost?.server_identifier, parentHost?.server?.id]
      .map(text).find(Boolean) || '';
    return { region, identifier };
  }

  function accountKey(r) {
    let parentHost = null;
    try { if (r.parent && r.parent !== r) parentHost = r.parent; } catch {}
    const raw = text(r.user_id || parentHost?.user_id || r.character?.owner || parentHost?.character?.owner);
    return raw ? fingerprint({ account: raw }) : '';
  }

  function remainingMs(effect) {
    if (!effect || typeof effect !== 'object') return null;
    for (const key of ['ms', 'remainingMs', 'remaining']) {
      const value = Number(effect[key]);
      if (Number.isFinite(value)) return Math.max(0, value);
    }
    for (const key of ['expiresAt', 'expires', 'expiration']) {
      const value = Number(effect[key]);
      if (Number.isFinite(value)) return Math.max(0, value - Date.now());
    }
    return null;
  }

  function mluckEffect(character) {
    const effect = character?.s?.mluck;
    return !effect || typeof effect !== 'object'
      ? { active: false, source: null, strong: false, remainingMs: null }
      : {
          active: true,
          source: text(effect.f) || null,
          strong: effect.strong === true,
          remainingMs: remainingMs(effect)
        };
  }

  function runtimeConflict(r) {
    try { if (r.AIO_V3?.__runtime?.timer) return 'AIO_V3_RUNTIME_ACTIVE'; }
    catch { return 'AIO_V3_RUNTIME_UNREADABLE'; }
    try { if (r.V4ProduktionsLaufzeit || r.AIO_V4 || r.V4Runtime) return 'V4_RUNTIME_ACTIVE'; }
    catch { return 'V4_RUNTIME_UNREADABLE'; }
    return null;
  }

  function snapshot() {
    const r = globalThis;
    const binding = serverBinding(r);
    return {
      schemaVersion: 1,
      testId: TEST_ID,
      name: text(r.character?.name),
      ctype: text(r.character?.ctype).toLowerCase(),
      sessionId: text(r.character?.id),
      accountKey: accountKey(r),
      serverRegion: binding.region,
      serverIdentifier: binding.identifier,
      map: text(r.character?.map),
      x: Number(r.character?.real_x ?? r.character?.x ?? 0),
      y: Number(r.character?.real_y ?? r.character?.y ?? 0),
      hp: Number(r.character?.hp || 0),
      mp: Number(r.character?.mp || 0),
      level: Number(r.character?.level || 0),
      rip: !!r.character?.rip,
      mluck: mluckEffect(r.character),
      runtimeConflict: runtimeConflict(r),
      performanceTrick: true,
      observedAtMs: Date.now()
    };
  }

  function publish() {
    const snap = snapshot();
    let registry = { schemaVersion: 1, actors: {} };
    try {
      const raw = globalThis.localStorage?.getItem(ACTORS_KEY);
      if (raw) registry = JSON.parse(raw);
    } catch {}
    const actors = registry?.actors && typeof registry.actors === 'object' ? registry.actors : {};
    globalThis.localStorage?.setItem(ACTORS_KEY, JSON.stringify({
      schemaVersion: 1,
      actors: { ...actors, [snap.name]: snap }
    }));
    Object.assign(state, {
      phase: 'HEARTBEAT',
      active: true,
      name: snap.name,
      ctype: snap.ctype,
      performanceTrick: true,
      blocker: null,
      observedAtMs: snap.observedAtMs
    });
    return snap;
  }

  const api = Object.freeze({
    version: VERSION,
    testId: TEST_ID,
    status: () => clone(state)
  });
  Object.defineProperty(globalThis, 'V5PR206MluckWorker', {
    configurable: true,
    enumerable: true,
    writable: false,
    value: api
  });

  Promise.resolve().then(async () => {
    const name = text(globalThis.character?.name);
    const ctype = text(globalThis.character?.ctype).toLowerCase();
    state.name = name || null;
    state.ctype = ctype || null;
    if (!name || EXPECTED[name] !== ctype) {
      state.phase = 'BLOCKED';
      state.blocker = 'PR20_6_BRIDGE_WORKER_TARGET_NOT_ALLOWED';
      state.observedAtMs = Date.now();
      return;
    }
    if (!await armPerformanceTrick()) {
      state.phase = 'BLOCKED';
      state.blocker = 'PR20_6_WORKER_PERFORMANCE_TRICK_UNAVAILABLE';
      state.observedAtMs = Date.now();
      return;
    }
    try {
      if (globalThis.__V5_PR20_6_MLUCK_WORKER_TIMER)
        clearInterval(globalThis.__V5_PR20_6_MLUCK_WORKER_TIMER);
    } catch {}
    publish();
    globalThis.__V5_PR20_6_MLUCK_WORKER_TIMER = setInterval(publish, HEARTBEAT_MS);
  });
})();
