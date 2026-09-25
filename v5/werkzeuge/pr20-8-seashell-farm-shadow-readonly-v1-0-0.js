(() => {
  "use strict";

  const TEST_ID = "pr20-8-seashell-farm-shadow-readonly";
  const VERSION = "1.0.0";
  const API_NAME = "V5PR208SeashellFarmShadowReadonly";
  const EXPECTED_SERVER_REGION = "EU";
  const EXPECTED_SERVER_IDENTIFIER = "I";
  const REQUIRED_QUANTITY = 20;
  const MIN_HP_RATIO = 0.8;
  const FARMERS = Object.freeze({
    My_Ranger1: "ranger",
    My_Priest: "priest",
    My_Mage: "mage",
  });

  const state = {
    schemaVersion: 1,
    testId: TEST_ID,
    version: VERSION,
    phase: "PR20_8_SEASHELL_FARM_SHADOW_READONLY",
    status: "BOOT",
    terminal: false,
    blocker: [],
    nextAction: null,
    startedAtMs: Date.now(),
    updatedAtMs: Date.now(),
    worker: null,
    inventory: null,
    gameData: null,
    hostileTargetCount: 0,
    performanceTrick: null,
    gameplayWrites: 0,
    publicFunctionCalls: 0,
    rawWriteCalls: 0,
    startCalls: 0,
    disconnectCalls: 0,
    commandCharacterCalls: 0,
    farmerWorkersInstalled: 0,
    sameIntentRetry: false,
    normalRuntimeAllowed: false,
    authority: {
      authorityIssued: false,
      movementAuthority: false,
      combatAuthority: false,
      skillAuthority: false,
      lootAuthority: false,
      farmAuthority: false,
      exchangeAuthority: false,
      gameplayAuthority: false,
      rawWriteAuthority: false,
      durableIntentCreated: false,
    },
  };

  function text(value, max = 192) {
    return String(value == null ? "" : value).trim().slice(0, max);
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function root() {
    try { if (globalThis.character) return globalThis; } catch {}
    try { if (parent && parent.character) return parent; } catch {}
    throw new Error("PR20_8_SEASHELL_SHADOW_CONTEXT_MISSING");
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

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function performanceStatus() {
    let available = false;
    let called = false;
    let error = null;
    for (const candidate of roots()) {
      try {
        if (typeof candidate?.performance_trick !== "function") continue;
        available = true;
        candidate.performance_trick();
        called = true;
        break;
      } catch (cause) {
        error = text(cause?.message || cause, 160);
      }
    }
    if (called) await sleep(50);

    let audioFound = false;
    let playing = false;
    for (const candidate of roots()) {
      try {
        const sound = candidate?.sounds?.empty;
        if (!sound) continue;
        audioFound = true;
        if (sound.cplaying === true) playing = true;
        if (typeof sound.playing === "function" && sound.playing() === true) playing = true;
      } catch {}
    }
    return {
      available,
      called,
      error,
      audioFound,
      playing,
      active: available && called && audioFound && playing,
      verification: playing ? "HOWLER_PLAYING_TRUE" : "HOWLER_PLAYING_FALSE",
    };
  }

  function quantity(items, name) {
    let total = 0;
    for (const item of items) {
      if (!item || text(item.name, 96) !== name) continue;
      const q = Number(item.q == null ? 1 : item.q);
      if (Number.isSafeInteger(q) && q > 0) total += q;
    }
    return total;
  }

  function capacity(items, isize, currentQuantity) {
    if (currentQuantity > 0) return true;
    if (items.some(item => item == null)) return true;
    return Number.isSafeInteger(isize) && isize > items.length;
  }

  function hostileCount(r, characterName) {
    const sources = [];
    try { if (r.entities && typeof r.entities === "object") sources.push(r.entities); } catch {}
    try {
      if (r.parent?.entities
          && typeof r.parent.entities === "object"
          && !sources.includes(r.parent.entities)) sources.push(r.parent.entities);
    } catch {}
    let count = 0;
    const seen = new Set();
    for (const entities of sources) {
      for (const [key, entity] of Object.entries(entities)) {
        if (!entity || entity.type !== "monster" || entity.dead || entity.rip) continue;
        const id = text(entity.id || key, 128);
        if (seen.has(id)) continue;
        seen.add(id);
        if (text(entity.target, 192) === characterName) count += 1;
      }
    }
    return count;
  }

  function finish(status, blocker, nextAction) {
    state.status = status;
    state.blocker = [...new Set(blocker)];
    state.nextAction = nextAction;
    state.terminal = true;
    state.phase = status === "BESTANDEN"
      ? "PR20_8_SEASHELL_FARM_SHADOW_READONLY_COMPLETE"
      : "PR20_8_SEASHELL_FARM_SHADOW_READONLY";
    state.updatedAtMs = Date.now();
  }

  async function run() {
    const r = root();
    const c = r.character;
    const name = text(c?.name, 64);
    const ctype = text(c?.ctype || c?.type, 32).toLowerCase();
    const expectedCtype = FARMERS[name];
    if (!expectedCtype || ctype !== expectedCtype) {
      finish("BLOCKIERT", ["PR20_8_SEASHELL_SHADOW_FARMER_CONTEXT_REQUIRED"], "REMAIN_BLOCKED");
      return;
    }

    const serverRegion = text(r.server_region ?? globalThis.server_region, 16);
    const serverIdentifier = text(r.server_identifier ?? globalThis.server_identifier, 16);
    if (serverRegion !== EXPECTED_SERVER_REGION
        || serverIdentifier !== EXPECTED_SERVER_IDENTIFIER) {
      finish("BLOCKIERT", ["PR20_8_SEASHELL_SHADOW_SERVER_DRIFT"], "REMAIN_BLOCKED");
      return;
    }

    state.performanceTrick = await performanceStatus();
    if (!state.performanceTrick.active) {
      finish("BLOCKIERT", ["PR20_8_SEASHELL_SHADOW_PERFORMANCE_TRICK_BLOCKED"], "REMAIN_BLOCKED");
      return;
    }

    const G = r.G || globalThis.G;
    const def = G?.items?.seashell;
    const croc = G?.monsters?.croc;
    state.gameData = {
      itemPresent: !!def,
      crocPresent: !!croc,
      exchangeQuantity: Number(def?.e),
      baseGold: Number(def?.g),
      questMarker: def?.quest == null ? null : text(def.quest, 96),
      cash: def?.cash === true,
      event: def?.event === true,
      exclusive: def?.exclusive === true,
    };
    if (!def || !croc
        || Number(def.e) !== REQUIRED_QUANTITY
        || Number(def.g) !== 800
        || def.quest !== "seashell"
        || def.cash === true
        || def.event === true
        || def.exclusive === true) {
      finish("BLOCKIERT", ["PR20_8_SEASHELL_SHADOW_GAME_DATA_DRIFT"], "REMAIN_BLOCKED");
      return;
    }

    const items = Array.isArray(c.items) ? c.items : null;
    if (!items) {
      finish("BLOCKIERT", ["PR20_8_SEASHELL_SHADOW_INVENTORY_UNAVAILABLE"], "REMAIN_BLOCKED");
      return;
    }
    const currentQuantity = quantity(items, "seashell");
    const isize = Number(c.isize);
    const capacityAvailable = capacity(items, isize, currentQuantity);
    state.inventory = {
      currentSeashellQuantity: currentQuantity,
      requiredSeashellQuantity: REQUIRED_QUANTITY,
      remainingQuantity: Math.max(0, REQUIRED_QUANTITY - currentQuantity),
      inventorySlotsObserved: items.length,
      inventorySize: Number.isSafeInteger(isize) ? isize : null,
      capacityAvailable,
    };

    const hp = Number(c.hp);
    const maxHp = Number(c.max_hp ?? c.maxHp);
    const hpRatio = Number.isFinite(hp) && Number.isFinite(maxHp) && maxHp > 0
      ? hp / maxHp
      : null;
    state.hostileTargetCount = hostileCount(r, name);
    state.worker = {
      name,
      ctype,
      map: text(c.map, 96),
      level: Number.isFinite(Number(c.level)) ? Number(c.level) : null,
      hp: Number.isFinite(hp) ? hp : null,
      maxHp: Number.isFinite(maxHp) ? maxHp : null,
      hpRatio,
      rip: c.rip === true,
      dead: c.dead === true,
    };

    if (currentQuantity >= REQUIRED_QUANTITY) {
      finish(
        "BESTANDEN",
        [],
        "PREPARE_SEASHELL_HANDOFF_SHADOW_NO_WRITE",
      );
      return;
    }

    const blocker = [];
    if (c.rip === true || c.dead === true) blocker.push("PR20_8_SEASHELL_SHADOW_LIFECYCLE_NICHT_AKTIV");
    if (hpRatio == null || hpRatio < MIN_HP_RATIO) blocker.push("PR20_8_SEASHELL_SHADOW_HP_HARD_CAP");
    if (!capacityAvailable) blocker.push("PR20_8_SEASHELL_SHADOW_INVENTORY_CAPACITY_FEHLT");
    if (state.hostileTargetCount !== 0) blocker.push("PR20_8_SEASHELL_SHADOW_CHARACTER_UNTER_ANGRIFF");

    if (blocker.length) {
      finish("BLOCKIERT", blocker, "REMAIN_BLOCKED");
      return;
    }

    finish(
      "BESTANDEN",
      [],
      "PREPARE_SEASHELL_FARM_SHADOW_COORDINATOR_READ_ONLY",
    );
  }

  const api = Object.freeze({
    version: VERSION,
    testId: TEST_ID,
    status: () => clone(state),
  });
  Object.defineProperty(globalThis, API_NAME, {
    configurable: true,
    enumerable: true,
    writable: false,
    value: api,
  });
  try {
    if (parent && parent !== globalThis) {
      Object.defineProperty(parent, API_NAME, {
        configurable: true,
        enumerable: true,
        writable: false,
        value: api,
      });
    }
  } catch {}

  Promise.resolve().then(run).catch(error => {
    state.error = text(error?.message || error, 240);
    finish("FEHLER", ["PR20_8_SEASHELL_SHADOW_UNEXPECTED_ERROR"], "REMAIN_BLOCKED");
  });
})();