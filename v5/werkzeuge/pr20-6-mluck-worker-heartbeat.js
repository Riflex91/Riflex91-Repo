(() => {
  'use strict';

  const TEST_ID = 'pr20-6-mluck-autonomous-live-5m';
  const VERSION = '1.0.2';
  const ACTORS_KEY = 'AIO_V5_PR20_6_MLUCK_ACTORS_V1';
  const HEARTBEAT_MS = 2_000;
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

  function storage() {
    try { if (local.localStorage) return local.localStorage; } catch {}
    try { if (host.localStorage) return host.localStorage; } catch {}
    return null;
  }

  function fingerprint(value) {
    const input = JSON.stringify(value);
    let hash = 2166136261;
    for (let index = 0; index < input.length; index += 1) {
      hash ^= input.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
  }

  function serverBinding() {
    const region = [
      local.server_region,
      local.server?.region,
      host.server_region,
      host.server?.region
    ].map(text).find(Boolean) || '';
    const identifier = [
      local.server_identifier,
      local.server?.id,
      host.server_identifier,
      host.server?.id
    ].map(text).find(Boolean) || '';
    return { region, identifier };
  }

  function accountKey() {
    const raw = text(
      local.user_id
      || host.user_id
      || local.character?.owner
      || host.character?.owner
    );
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
    if (!effect || typeof effect !== 'object') {
      return { active: false, source: null, strong: false, remainingMs: null };
    }
    return {
      active: true,
      source: text(effect.f) || null,
      strong: effect.strong === true,
      remainingMs: remainingMs(effect)
    };
  }

  function runtimeConflict() {
    try {
      if (local.AIO_V3?.__runtime?.timer || host.AIO_V3?.__runtime?.timer)
        return 'AIO_V3_RUNTIME_ACTIVE';
    } catch {
      return 'AIO_V3_RUNTIME_UNREADABLE';
    }
    try {
      if (local.V4ProduktionsLaufzeit || local.AIO_V4 || local.V4Runtime
          || host.V4ProduktionsLaufzeit || host.AIO_V4 || host.V4Runtime)
        return 'V4_RUNTIME_ACTIVE';
    } catch {
      return 'V4_RUNTIME_UNREADABLE';
    }
    return null;
  }

  function character() {
    return local.character || host.character || null;
  }

  function baseStatus(blocker, performanceTrick) {
    const current = character();
    return {
      schemaVersion: 1,
      testId: TEST_ID,
      version: VERSION,
      name: text(current?.name),
      ctype: text(current?.ctype).toLowerCase(),
      status: blocker ? 'BLOCKIERT' : 'WORKER',
      phase: blocker ? 'WORKER_PREFLIGHT' : 'HEARTBEAT',
      terminal: false,
      performanceTrick: performanceTrick === true,
      blocker: blocker || null,
      gameplayWrites: 0,
      rawWriteCalls: 0,
      sameIntentRetry: false,
      observedAtMs: Date.now()
    };
  }

  function expose(blocker, performanceTrick) {
    const api = Object.freeze({
      version: VERSION,
      testId: TEST_ID,
      status: () => blocker ? baseStatus(blocker, performanceTrick) : snapshot()
    });
    Object.defineProperty(globalThis, 'V5PR206MluckWorker', {
      configurable: true,
      enumerable: true,
      writable: false,
      value: api
    });
    return api;
  }

  const current = character();
  const workerClass = text(current?.ctype).toLowerCase();
  const workerName = text(current?.name);
  if (!Object.prototype.hasOwnProperty.call(EXPECTED, workerClass)
      || EXPECTED[workerClass] !== workerName) {
    expose('PR20_6_WORKER_IDENTITY_NOT_ALLOWED', false);
    return;
  }

  let performanceTrick = false;
  for (const candidate of [local, host]) {
    try {
      if (typeof candidate?.performance_trick !== 'function') continue;
      candidate.performance_trick();
      performanceTrick = true;
      break;
    } catch {}
  }
  if (!performanceTrick) {
    expose('PR20_6_WORKER_PERFORMANCE_TRICK_UNAVAILABLE', false);
    return;
  }

  function snapshot() {
    const currentCharacter = character();
    const server = serverBinding();
    return {
      ...baseStatus(null, true),
      sessionId: text(currentCharacter?.id),
      accountKey: accountKey(),
      serverRegion: server.region,
      serverIdentifier: server.identifier,
      map: text(currentCharacter?.map),
      x: Number(currentCharacter?.real_x ?? currentCharacter?.x ?? 0),
      y: Number(currentCharacter?.real_y ?? currentCharacter?.y ?? 0),
      hp: Number(currentCharacter?.hp || 0),
      mp: Number(currentCharacter?.mp || 0),
      level: Number(currentCharacter?.level || 0),
      rip: !!currentCharacter?.rip,
      mluck: mluckEffect(currentCharacter),
      runtimeConflict: runtimeConflict()
    };
  }

  function publish() {
    const store = storage();
    if (!store) return false;
    const snap = snapshot();
    let registry = { schemaVersion: 1, actors: {} };
    try {
      const raw = store.getItem(ACTORS_KEY);
      if (raw) registry = JSON.parse(raw);
    } catch {}
    const actors = registry?.actors && typeof registry.actors === 'object'
      ? registry.actors
      : {};
    try {
      store.setItem(ACTORS_KEY, JSON.stringify({
        schemaVersion: 1,
        actors: { ...actors, [snap.name]: snap }
      }));
      return true;
    } catch {
      return false;
    }
  }

  try {
    if (globalThis.__V5_PR20_6_MLUCK_WORKER_TIMER)
      clearInterval(globalThis.__V5_PR20_6_MLUCK_WORKER_TIMER);
  } catch {}

  expose(null, true);
  publish();
  globalThis.__V5_PR20_6_MLUCK_WORKER_TIMER = setInterval(publish, HEARTBEAT_MS);
})();