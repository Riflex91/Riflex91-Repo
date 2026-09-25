(function installV5LiveLabV2(root) {
  "use strict";

  const PROFILE_ID = "V5_LIVE_LAB_PR28";
  const VERSION = "0.2.0";
  const SOURCE_MAIN_SHA = "a240cdb63679f36d92b7eb5583831e159fe2a3f5";
  const START_ACK = "V5_LIVE_LAB_START";
  const MAX_LOGS = 4000;

  const CAPABILITIES_BY_CLASS = Object.freeze({
    warrior: Object.freeze(["TANK", "SINGLE_TARGET", "AOE", "CC"]),
    priest: Object.freeze(["HEAL", "SINGLE_TARGET", "REVIVE"]),
    ranger: Object.freeze(["SINGLE_TARGET", "AOE", "KITE"]),
    rogue: Object.freeze(["SINGLE_TARGET", "KITE"]),
    mage: Object.freeze(["SINGLE_TARGET", "AOE", "CC"]),
    paladin: Object.freeze(["TANK", "HEAL", "SINGLE_TARGET"]),
    merchant: Object.freeze([]),
  });

  const TOPOLOGIES = Object.freeze({
    solo: Object.freeze({ min: 1, max: 1, required: ["SINGLE_TARGET"] }),
    "two-farmer": Object.freeze({ min: 2, max: 2, required: ["SINGLE_TARGET"] }),
    "three-farmer": Object.freeze({ min: 3, max: 3, required: ["SINGLE_TARGET"] }),
    "tank-heal": Object.freeze({ min: 2, max: 8, required: ["TANK", "HEAL"] }),
    "tank-dps": Object.freeze({ min: 2, max: 8, required: ["TANK", "SINGLE_TARGET"] }),
    "tank-aoe": Object.freeze({ min: 2, max: 8, required: ["TANK", "AOE"] }),
    "heal-dps": Object.freeze({ min: 2, max: 8, required: ["HEAL", "SINGLE_TARGET"] }),
    "tank-heal-single": Object.freeze({ min: 3, max: 8, required: ["TANK", "HEAL", "SINGLE_TARGET"] }),
    "tank-heal-aoe": Object.freeze({ min: 3, max: 8, required: ["TANK", "HEAL", "AOE"] }),
    "multi-dps": Object.freeze({ min: 2, max: 8, required: ["SINGLE_TARGET"] }),
    "duplicate-classes": Object.freeze({ min: 2, max: 8, required: ["SINGLE_TARGET"] }),
    "without-tank": Object.freeze({ min: 1, max: 8, required: ["SINGLE_TARGET"] }),
    "without-heal": Object.freeze({ min: 1, max: 8, required: ["SINGLE_TARGET"] }),
    "without-aoe": Object.freeze({ min: 1, max: 8, required: ["SINGLE_TARGET"] }),
  });

  const defaults = Object.freeze({
    loopMs: 250,
    actionGapMs: 180,
    movementGapMs: 1200,
    movementThrashWindowMs: 2500,
    lootGapMs: 1000,
    respawnGapMs: 3000,

    farm: Object.freeze({
      enabled: false,
      monsters: Object.freeze([]),
      moveToTarget: true,
      loot: true,
      respawn: true,
      minHpRatio: 0.45,
      minMpRatio: 0.10,
      stopDistanceRatio: 0.80,
      skills: Object.freeze([]),
      aoeEnabled: false,
      aoeMinTargets: 2,
      aoeMaxTargets: 6,
      aoeMinHpRatio: 0.70,
    }),

    coordination: Object.freeze({
      enabled: true,
      peers: Object.freeze([]),
      heartbeatMs: 3000,
      staleMs: 12000,
      assistLeader: null,
    }),

    group: Object.freeze({
      enabled: false,
      topologyId: "solo",
      leader: null,
      knownMemberIds: Object.freeze([]),
      requiredCapabilities: null,
      failClosedOnFault: true,
      lowMpRatio: 0.10,
      healThreshold: 0.62,
      emergencyHealThreshold: 0.35,
      roleSkills: Object.freeze({
        heal: "heal",
        taunt: "taunt",
        agitate: "agitate",
        revive: "revive",
        cc: null,
      }),
    }),

    evidence: Object.freeze({
      enabled: true,
      autoIntegration: true,
      autoCapability: false,
      integrationDurationMs: 15 * 60 * 1000,
      capabilityDurationMs: 5 * 60 * 1000,
    }),

    optimizer: Object.freeze({
      enabled: true,
      replanMs: 1000,
      farmPriority: 1,
      groupAssistPriority: 40,
      progressionPriorityBoost: 8,
      priorities: Object.freeze({
        RARE_BOSS: 100,
        EVENT: 80,
        QUEST: 70,
        SERVER_HOP: 20,
        DISCOVERY: 10,
      }),
    }),

    progression: Object.freeze({
      enabled: true,
      targetCorridor: 0.08,
      maxLevel: 100,
      maxGearScore: 1000,
      mandatoryRoles: Object.freeze(["TANK", "HEAL"]),
    }),

    merchant: Object.freeze({
      enabled: false,
      serviceSettleMs: 1500,
      serviceCooldownMs: 12000,
      minimumFreeSlots: 2,
      buyRules: Object.freeze([]),
      exchangeRules: Object.freeze([]),
      bankRules: Object.freeze([]),
    }),

    world: Object.freeze({
      enabled: true,
      observationTtlMs: 5000,
      events: Object.freeze([]),
      quests: Object.freeze([]),
      rareMonsters: Object.freeze([]),
      knownMonsterTypes: Object.freeze([]),
      discoveryEnabled: true,
      allowedPublicActions: Object.freeze(["join"]),
      servers: Object.freeze([]),
      serverHopEnabled: false,
      serverHopCooldownMs: 10 * 60 * 1000,
      allowPvp: false,
      allowHardcore: false,
    }),
  });

  function clone(value) {
    if (value == null || typeof value !== "object") return value;
    if (Array.isArray(value)) return value.map(clone);
    const out = {};
    for (const key of Object.keys(value)) out[key] = clone(value[key]);
    return out;
  }

  function merge(base, patch) {
    if (patch == null || typeof patch !== "object" || Array.isArray(patch)) return clone(patch);
    const out = clone(base);
    for (const key of Object.keys(patch)) {
      const value = patch[key];
      if (
        value
        && typeof value === "object"
        && !Array.isArray(value)
        && out[key]
        && typeof out[key] === "object"
        && !Array.isArray(out[key])
      ) out[key] = merge(out[key], value);
      else out[key] = clone(value);
    }
    return out;
  }

  function number(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function unique(values) {
    return Array.from(new Set(values));
  }

  function stable(value) {
    if (value === null || typeof value !== "object") return JSON.stringify(value);
    if (Array.isArray(value)) return "[" + value.map(stable).join(",") + "]";
    const keys = Object.keys(value).sort();
    return "{" + keys.map(function (key) {
      return JSON.stringify(key) + ":" + stable(value[key]);
    }).join(",") + "}";
  }

  function fingerprint(value) {
    const source = stable(value);
    let hash = 2166136261;
    for (let i = 0; i < source.length; i += 1) {
      hash ^= source.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return "fp-" + (hash >>> 0).toString(16).padStart(8, "0");
  }

  let config = clone(defaults);
  let running = false;
  let timer = null;
  let emergencyStop = false;
  let stopReason = null;
  let seq = 0;
  let tickSeq = 0;
  let inTick = false;
  let movementPromise = null;
  let movementStartedAt = 0;
  let lastMovementKey = null;
  let lastMovementAt = 0;
  let lastActionAt = 0;
  let lastLootAt = 0;
  let lastRespawnAt = 0;
  let lastHeartbeatAt = 0;
  let lastServerHopAt = 0;
  let lastService = null;
  let lastServiceAt = 0;
  let serviceArrivalAt = 0;
  let currentTargetId = null;
  let currentTask = null;
  let currentGroup = null;
  let currentOptimizer = null;
  let currentProgression = null;
  let previousOnCm = null;
  let lastOptimizerAt = 0;
  let lastTrainingTickAt = 0;
  let lastLocalDead = false;
  let killCount = 0;
  let lastTargetWasAlive = false;
  let lastTargetSeenId = null;

  const logs = [];
  const peers = new Map();
  const irreversible = new Map();
  const trainingMs = new Map();
  const worldQuarantine = new Map();
  const worldPlans = new Map();
  const worldHopHistory = new Map();
  const evidenceSegments = [];
  let activeEvidenceSegment = null;

  function now() {
    return Date.now();
  }

  function character() {
    try {
      return root.character || (root.parent && root.parent.character) || null;
    } catch (_) {
      return null;
    }
  }

  function entities() {
    try {
      return root.entities || (root.parent && root.parent.entities) || {};
    } catch (_) {
      return {};
    }
  }

  function globalGameData() {
    try {
      return root.G || (root.parent && root.parent.G) || {};
    } catch (_) {
      return {};
    }
  }

  function serverState() {
    try {
      return root.S || (root.parent && root.parent.S) || {};
    } catch (_) {
      return {};
    }
  }

  function currentServer() {
    let region = "";
    let identifier = "";
    try {
      region = String(root.server_region || (root.parent && root.parent.server_region) || (root.server && root.server.region) || "");
    } catch (_) {}
    try {
      identifier = String(root.server_identifier || (root.parent && root.parent.server_identifier) || (root.server && root.server.id) || "");
    } catch (_) {}
    return { region: region, identifier: identifier };
  }

  function log(event, data) {
    const c = character();
    const entry = Object.freeze(Object.assign({
      seq: ++seq,
      atMs: now(),
      event: event,
      profileId: PROFILE_ID,
      version: VERSION,
      sourceMainSha: SOURCE_MAIN_SHA,
      character: c && c.name || null,
      ctype: c && (c.ctype || c.type) || null,
      map: c && c.map || null,
      x: c && Number.isFinite(c.x) ? c.x : null,
      y: c && Number.isFinite(c.y) ? c.y : null,
    }, data || {}));
    logs.push(entry);
    if (logs.length > MAX_LOGS) logs.splice(0, logs.length - MAX_LOGS);
    return entry;
  }

  function publicFunction(name) {
    const roots = [root];
    try {
      if (root.parent && root.parent !== root) roots.push(root.parent);
    } catch (_) {}
    for (const candidate of roots) {
      try {
        if (candidate && typeof candidate[name] === "function") return candidate[name].bind(candidate);
      } catch (_) {}
    }
    return null;
  }

  function callPublic(name, args) {
    const fn = publicFunction(name);
    if (!fn) throw new Error("LIVE_LAB_PUBLIC_FUNCTION_UNAVAILABLE:" + name);
    return fn.apply(null, args || []);
  }

  function alternativeRuntimeActive() {
    try {
      const v3 = root.AIO_V3 && root.AIO_V3.__runtime;
      const status = v3 && typeof v3.status === "function" ? v3.status() : null;
      if (v3 && (v3.timer || status && status.running === true)) return "AIO_V3_RUNTIME_ACTIVE";
    } catch (_) {
      return "AIO_V3_RUNTIME_UNREADABLE";
    }
    try {
      const v4 = root.AIO_V4 || root.V4Runtime || root.V4ProduktionsLaufzeit;
      const status = v4 && typeof v4.status === "function" ? v4.status() : null;
      if (v4 && status && (status.running === true || status.aktivFreigegeben === true)) return "V4_RUNTIME_ACTIVE";
    } catch (_) {
      return "V4_RUNTIME_UNREADABLE";
    }
    return null;
  }

  function queueBusy(c) {
    return !!(c && c.q && typeof c.q === "object" && Object.keys(c.q).length > 0);
  }

  function hpRatio(c) {
    const hp = number(c && c.hp, 0);
    const max = number(c && (c.max_hp != null ? c.max_hp : c.maxHp), 0);
    return max > 0 ? clamp(hp / max, 0, 1) : 0;
  }

  function mpRatio(c) {
    const mp = number(c && c.mp, 0);
    const max = number(c && (c.max_mp != null ? c.max_mp : c.maxMp), 0);
    return max > 0 ? clamp(mp / max, 0, 1) : 0;
  }

  function distance(a, b) {
    const ax = number(a && (a.real_x != null ? a.real_x : a.x), NaN);
    const ay = number(a && (a.real_y != null ? a.real_y : a.y), NaN);
    const bx = number(b && (b.real_x != null ? b.real_x : b.x), NaN);
    const by = number(b && (b.real_y != null ? b.real_y : b.y), NaN);
    if (![ax, ay, bx, by].every(Number.isFinite)) return Infinity;
    return Math.hypot(ax - bx, ay - by);
  }

  function gearScoreFor(c) {
    if (!c) return 0;
    const slots = c.slots && typeof c.slots === "object" ? c.slots : {};
    let score = 0;
    for (const item of Object.values(slots)) {
      if (!item) continue;
      score += 1 + Math.max(0, number(item.level, 0)) * 10;
    }
    return score;
  }

  function capabilitiesFor(ctype) {
    return (CAPABILITIES_BY_CLASS[String(ctype || "").toLowerCase()] || []).slice();
  }

  function partySnapshot() {
    let party = {};
    try {
      const getParty = publicFunction("get_party");
      party = getParty ? getParty() : root.party || (root.parent && root.parent.party) || {};
    } catch (_) {
      party = {};
    }
    const names = Array.isArray(party)
      ? party.map(function (x) { return String(x && x.name || x || ""); }).filter(Boolean)
      : Object.keys(party || {});
    return Object.freeze({
      memberNames: Object.freeze(names.sort()),
      size: names.length,
    });
  }

  function liveSafety() {
    const c = character();
    const blocker = [];
    if (!running) blocker.push("LIVE_LAB_NOT_RUNNING");
    if (emergencyStop) blocker.push("LIVE_LAB_EMERGENCY_STOP");
    if (!c) blocker.push("LIVE_LAB_CHARACTER_UNAVAILABLE");
    if (c && !String(c.name || "").trim()) blocker.push("LIVE_LAB_CHARACTER_IDENTITY_MISSING");
    const server = currentServer();
    if (!server.region || !server.identifier) blocker.push("LIVE_LAB_SERVER_IDENTITY_MISSING");
    return {
      admitted: blocker.length === 0,
      blocker: blocker,
      liveExecutionAllowed: blocker.length === 0,
      gameplayAuthority: blocker.length === 0,
      normalRuntimeAllowed: blocker.length === 0,
      rawWriteAuthority: false,
    };
  }

  function actionGapPassed(gap) {
    return now() - lastActionAt >= number(gap, config.actionGapMs);
  }

  function evidenceNote(metric, amount) {
    if (!activeEvidenceSegment) return;
    if (!(metric in activeEvidenceSegment)) return;
    activeEvidenceSegment[metric] += Math.max(0, number(amount, 1));
  }

  function noteAction(kind, details) {
    lastActionAt = now();
    log("ACTION_SENT", Object.assign({ kind: kind }, details || {}));
  }

  async function executePublic(kind, publicName, args, options) {
    const opts = options || {};
    const safety = liveSafety();
    if (!safety.admitted) throw new Error("LIVE_LAB_ACTION_BLOCKED:" + safety.blocker.join(","));

    const irreversibleAction = opts.irreversibleAction === true;
    const intentId = opts.intentId || null;

    if (irreversibleAction) {
      if (typeof intentId !== "string" || intentId.length < 3 || intentId.length > 240) {
        throw new Error("LIVE_LAB_IRREVERSIBLE_INTENT_ID_REQUIRED");
      }
      const prior = irreversible.get(intentId);
      if (prior) {
        evidenceNote("duplicateIrreversibleEffects", 1);
        throw new Error("LIVE_LAB_DUPLICATE_OR_UNKNOWN_IRREVERSIBLE_INTENT:" + intentId + ":" + prior.status);
      }
      irreversible.set(intentId, {
        status: "IN_FLIGHT",
        kind: kind,
        startedAtMs: now(),
      });
    }

    noteAction(kind, { intentId: intentId });
    try {
      const result = await callPublic(publicName, args || []);
      if (irreversibleAction) {
        irreversible.set(intentId, {
          status: "COMMITTED",
          kind: kind,
          finishedAtMs: now(),
        });
      }
      log("ACTION_COMMIT", { kind: kind, intentId: intentId });
      return result;
    } catch (error) {
      if (irreversibleAction) {
        irreversible.set(intentId, {
          status: "UNKNOWN",
          kind: kind,
          finishedAtMs: now(),
          error: String(error && error.message || error),
        });
        evidenceNote("unresolvedRecoveryCount", 1);
      }
      log(irreversibleAction ? "ACTION_UNKNOWN" : "ACTION_FAILED", {
        kind: kind,
        intentId: intentId,
        error: String(error && error.message || error),
      });
      throw error;
    }
  }

  function heartbeatPayload() {
    const c = character();
    const p = partySnapshot();
    return Object.freeze({
      type: "V5_LIVE_LAB_HEARTBEAT",
      schemaVersion: 2,
      profileId: PROFILE_ID,
      version: VERSION,
      atMs: now(),
      character: c && c.name || null,
      ctype: c && (c.ctype || c.type) || null,
      map: c && c.map || null,
      instance: c && (c.in || c.instance) || null,
      x: number(c && c.x, 0),
      y: number(c && c.y, 0),
      hp: number(c && c.hp, 0),
      maxHp: number(c && (c.max_hp != null ? c.max_hp : c.maxHp), 0),
      mp: number(c && c.mp, 0),
      maxMp: number(c && (c.max_mp != null ? c.max_mp : c.maxMp), 0),
      level: Math.max(1, Math.floor(number(c && c.level, 1))),
      gearScore: gearScoreFor(c),
      dead: !!(c && (c.rip || c.dead)),
      moving: !!(c && c.moving),
      targetId: currentTargetId,
      taskId: currentTask && currentTask.id || null,
      partySize: p.size,
      capabilities: capabilitiesFor(c && (c.ctype || c.type)),
      roleAssignments: currentGroup && currentGroup.roles || null,
      progressionSelectedCharacter: currentProgression && currentProgression.selectedCharacter || null,
    });
  }

  async function coordinationTick() {
    if (!config.coordination.enabled) return;
    if (now() - lastHeartbeatAt < config.coordination.heartbeatMs) return;
    lastHeartbeatAt = now();
    const payload = heartbeatPayload();
    for (const peer of config.coordination.peers) {
      if (typeof peer !== "string" || !peer.trim()) continue;
      try {
        await executePublic("SEND_CM", "send_cm", [peer, payload]);
      } catch (error) {
        log("COORDINATION_SEND_FAILED", { peer: peer, error: String(error && error.message || error) });
      }
    }
  }

  function installCmHandler() {
    if (previousOnCm !== null) return;
    previousOnCm = typeof root.on_cm === "function" ? root.on_cm : false;
    root.on_cm = function (name, data) {
      try {
        if (data && data.type === "V5_LIVE_LAB_HEARTBEAT" && data.profileId === PROFILE_ID) {
          const existed = peers.has(String(name));
          peers.set(String(name), Object.freeze(Object.assign({}, data, { receivedAtMs: now() })));
          if (!existed) log("COORDINATION_PEER_JOINED", { peer: String(name) });
        }
      } catch (error) {
        log("COORDINATION_RECEIVE_FAILED", { error: String(error && error.message || error) });
      }
      if (typeof previousOnCm === "function") {
        try {
          return previousOnCm(name, data);
        } catch (error) {
          log("PREVIOUS_ON_CM_FAILED", { error: String(error && error.message || error) });
        }
      }
      return undefined;
    };
  }

  function restoreCmHandler() {
    if (previousOnCm === null) return;
    if (previousOnCm === false) {
      try { delete root.on_cm; } catch (_) { root.on_cm = undefined; }
    } else root.on_cm = previousOnCm;
    previousOnCm = null;
  }

  function peerSnapshot() {
    return Object.freeze(Array.from(peers.entries()).map(function (entry) {
      return Object.freeze(Object.assign({
        name: entry[0],
        ageMs: now() - entry[1].receivedAtMs,
      }, entry[1]));
    }).sort(function (a, b) { return a.name.localeCompare(b.name); }));
  }

  function prunePeers() {
    const cutoff = now() - Math.max(config.coordination.staleMs * 4, 60000);
    for (const entry of peers.entries()) {
      if (entry[1].receivedAtMs < cutoff) {
        peers.delete(entry[0]);
        log("COORDINATION_PEER_PRUNED", { peer: entry[0] });
      }
    }
  }

  function localMember() {
    const c = character();
    if (!c) return null;
    return {
      characterId: String(c.name || ""),
      ctype: String(c.ctype || c.type || "").toLowerCase(),
      map: String(c.map || ""),
      instance: String(c.in || c.instance || ""),
      observedAtMs: now(),
      sessionFresh: true,
      rosterFresh: true,
      lifecycleActive: !(c.rip || c.dead),
      dead: !!(c.rip || c.dead),
      moving: !!c.moving,
      hp: number(c.hp, 0),
      maxHp: number(c.max_hp != null ? c.max_hp : c.maxHp, 0),
      mp: number(c.mp, 0),
      maxMp: number(c.max_mp != null ? c.max_mp : c.maxMp, 0),
      level: Math.max(1, Math.floor(number(c.level, 1))),
      gearScore: gearScoreFor(c),
      targetId: currentTargetId,
      capabilities: capabilitiesFor(c.ctype || c.type),
    };
  }

  function allMembers() {
    const out = [];
    const local = localMember();
    if (local) out.push(local);
    for (const peer of peerSnapshot()) {
      out.push({
        characterId: String(peer.character || peer.name || ""),
        ctype: String(peer.ctype || "").toLowerCase(),
        map: String(peer.map || ""),
        instance: String(peer.instance || ""),
        observedAtMs: number(peer.receivedAtMs, 0),
        sessionFresh: peer.ageMs <= config.coordination.staleMs,
        rosterFresh: peer.ageMs <= config.coordination.staleMs,
        lifecycleActive: peer.dead !== true,
        dead: peer.dead === true,
        moving: peer.moving === true,
        hp: number(peer.hp, 0),
        maxHp: number(peer.maxHp, 0),
        mp: number(peer.mp, 0),
        maxMp: number(peer.maxMp, 0),
        level: Math.max(1, Math.floor(number(peer.level, 1))),
        gearScore: Math.max(0, number(peer.gearScore, 0)),
        targetId: peer.targetId || null,
        capabilities: Array.isArray(peer.capabilities)
          ? peer.capabilities.slice()
          : capabilitiesFor(peer.ctype),
      });
    }
    return out;
  }

  function ratio(n, d) {
    return d > 0 ? clamp(n / d, 0, 1) : 0;
  }

  function assignGroupRoles(active) {
    const roles = {};
    const used = new Set();
    const pick = function (capability) {
      const candidates = active.filter(function (m) {
        return !used.has(m.characterId) && m.capabilities.includes(capability);
      }).sort(function (a, b) {
        return b.gearScore - a.gearScore || b.level - a.level || a.characterId.localeCompare(b.characterId);
      });
      if (candidates[0]) {
        roles[capability] = candidates[0].characterId;
        used.add(candidates[0].characterId);
      }
    };
    ["TANK", "HEAL", "AOE", "CC", "KITE", "REVIVE"].forEach(pick);
    roles.DPS = Object.freeze(active.filter(function (m) {
      return m.capabilities.includes("SINGLE_TARGET");
    }).map(function (m) { return m.characterId; }).sort());
    return Object.freeze(roles);
  }

  function evaluateGroup() {
    const topology = TOPOLOGIES[config.group.topologyId] || TOPOLOGIES.solo;
    const members = allMembers();
    const active = members.filter(function (m) {
      return m.sessionFresh && m.rosterFresh && m.lifecycleActive;
    });
    const required = Array.isArray(config.group.requiredCapabilities)
      ? unique(config.group.requiredCapabilities.slice())
      : topology.required.slice();
    const available = unique(active.flatMap(function (m) { return m.capabilities; }));
    const missing = required.filter(function (capability) { return !available.includes(capability); });
    const blockers = [];
    const faults = [];

    if (active.length < topology.min) blockers.push("PR24_ZU_WENIGE_AKTIVE_MEMBER");
    if (active.length > topology.max) blockers.push("PR24_ZU_VIELE_AKTIVE_MEMBER");
    missing.forEach(function (x) { blockers.push("PR24_CAPABILITY_FEHLT:" + x); });

    if (members.some(function (m) { return !m.sessionFresh || !m.rosterFresh; })) faults.push("ROSTER_SESSION_DRIFT");
    if (members.some(function (m) { return m.dead && m.capabilities.includes("TANK"); })) faults.push("TANK_TOT");
    if (members.some(function (m) { return m.dead && m.capabilities.includes("HEAL"); })) faults.push("HEAL_TOT");
    if (members.some(function (m) { return m.dead && m.capabilities.includes("SINGLE_TARGET"); })) faults.push("DPS_TOT");
    if (members.some(function (m) {
      return m.lifecycleActive && ratio(m.mp, m.maxMp) < config.group.lowMpRatio;
    })) faults.push("MP_MANGEL");

    const c = character();
    const ownMap = String(c && c.map || "");
    if (active.some(function (m) { return m.map && ownMap && m.map !== ownMap; })) faults.push("MAP_INSTANZ_DRIFT");

    const known = new Set((config.group.knownMemberIds || []).map(String));
    const party = partySnapshot();
    if (known.size > 0) {
      if (party.memberNames.some(function (name) { return !known.has(name); })) faults.push("FREMDES_PARTY_MITGLIED");
      if (Array.from(known).some(function (id) {
        return !members.some(function (m) { return m.characterId === id; });
      })) faults.push("MEMBER_FEHLT");
    }

    if (missing.length) faults.push("CAPABILITY_VERLUST");
    if (config.group.failClosedOnFault && faults.some(function (fault) {
      return ["ROSTER_SESSION_DRIFT", "MAP_INSTANZ_DRIFT", "FREMDES_PARTY_MITGLIED", "CAPABILITY_VERLUST"].includes(fault);
    })) blockers.push("PR24_GROUP_FAULT_FAIL_CLOSED");

    return Object.freeze({
      status: blockers.length === 0 ? "LIVE_GROUP_READY" : "BLOCKED",
      blocker: Object.freeze(unique(blockers)),
      faults: Object.freeze(unique(faults)),
      topologyId: config.group.topologyId,
      requiredCapabilities: Object.freeze(required),
      availableCapabilities: Object.freeze(available),
      missingCapabilities: Object.freeze(missing),
      members: Object.freeze(members.map(function (m) { return Object.freeze(Object.assign({}, m)); })),
      activeMemberIds: Object.freeze(active.map(function (m) { return m.characterId; }).sort()),
      roles: assignGroupRoles(active),
      gameplayAuthority: blockers.length === 0,
      normalRuntimeAllowed: blockers.length === 0,
      rawWriteAuthority: false,
    });
  }

  function startEvidenceSegment(kind, capabilityId) {
    if (!config.evidence.enabled || activeEvidenceSegment) return null;
    const c = character();
    const art = kind === "CAPABILITY_5M" ? "CAPABILITY_5M" : "INTEGRATION_15M";
    activeEvidenceSegment = {
      segmentId: art === "CAPABILITY_5M"
        ? "capability:" + String(capabilityId || "unknown") + ":" + now()
        : "integration:" + String(config.group.topologyId || "solo") + ":" + now(),
      art: art,
      capabilityId: capabilityId || null,
      topologyId: config.group.topologyId,
      startedAtMs: now(),
      startXp: number(c && c.xp, 0),
      startKills: killCount,
      unerwarteteGameplayWrites: 0,
      duplicateIrreversibleEffects: 0,
      safetyViolations: 0,
      staleTargetActions: 0,
      movementThrashEvents: 0,
      unresolvedRecoveryCount: 0,
      deaths: 0,
      disconnectRejoinFailures: 0,
    };
    log("PR25_EVIDENCE_SEGMENT_BEGIN", {
      segmentId: activeEvidenceSegment.segmentId,
      art: activeEvidenceSegment.art,
      capabilityId: activeEvidenceSegment.capabilityId,
    });
    return Object.freeze(Object.assign({}, activeEvidenceSegment));
  }

  function finishEvidenceSegment(reason) {
    if (!activeEvidenceSegment) return null;
    const c = character();
    const endAt = now();
    const durationMs = Math.max(0, endAt - activeEvidenceSegment.startedAtMs);
    const minutes = Math.max(durationMs / 60000, 1 / 60);
    const row = Object.freeze(Object.assign({}, activeEvidenceSegment, {
      endedAtMs: endAt,
      dauerSekunden: durationMs / 1000,
      killrate: Math.max(0, killCount - activeEvidenceSegment.startKills) / minutes,
      xpProMinute: Math.max(0, number(c && c.xp, 0) - activeEvidenceSegment.startXp) / minutes,
      finishReason: reason || "MANUAL",
    }));
    evidenceSegments.push(row);
    activeEvidenceSegment = null;
    log("PR25_EVIDENCE_SEGMENT_END", {
      segmentId: row.segmentId,
      art: row.art,
      dauerSekunden: row.dauerSekunden,
      finishReason: row.finishReason,
    });
    return row;
  }

  function evidenceSummary() {
    const blocker = [];
    let capabilitySegmente = 0;
    let integrationsSegmente = 0;
    let gesamteDauerSekunden = 0;
    for (const row of evidenceSegments) {
      gesamteDauerSekunden += row.dauerSekunden;
      if (row.art === "CAPABILITY_5M") {
        capabilitySegmente += 1;
        if (row.dauerSekunden < 300) blocker.push("PR25_CAPABILITY_DAUER_ZU_KURZ:" + row.segmentId);
      } else {
        integrationsSegmente += 1;
        if (row.dauerSekunden < 900) blocker.push("PR25_INTEGRATION_DAUER_ZU_KURZ:" + row.segmentId);
      }
      if (row.unerwarteteGameplayWrites > 0) blocker.push("PR25_UNERWARTETER_WRITE:" + row.segmentId);
      if (row.duplicateIrreversibleEffects > 0) blocker.push("PR25_DUPLICATE_EFFECT:" + row.segmentId);
      if (row.safetyViolations > 0) blocker.push("PR25_SAFETY_VIOLATION:" + row.segmentId);
      if (row.staleTargetActions > 0) blocker.push("PR25_STALE_TARGET_ACTION:" + row.segmentId);
      if (row.movementThrashEvents > 0) blocker.push("PR25_MOVEMENT_THRASH:" + row.segmentId);
      if (row.unresolvedRecoveryCount > 0) blocker.push("PR25_UNRESOLVED_RECOVERY:" + row.segmentId);
      if (row.disconnectRejoinFailures > 0) blocker.push("PR25_REJOIN_FAILURE:" + row.segmentId);
    }
    if (evidenceSegments.length && integrationsSegmente < 1) blocker.push("PR25_INTEGRATION_SEGMENT_FEHLT");
    return Object.freeze({
      status: blocker.length === 0 ? "BESTANDEN" : "BLOCKIERT",
      blocker: Object.freeze(blocker),
      capabilitySegmente: capabilitySegmente,
      integrationsSegmente: integrationsSegmente,
      gesamteDauerSekunden: gesamteDauerSekunden,
      active: activeEvidenceSegment ? Object.freeze(Object.assign({}, activeEvidenceSegment)) : null,
      segments: Object.freeze(evidenceSegments.slice()),
      liveEvidenceRatified: false,
      gameplayAuthority: true,
      rawWriteAuthority: false,
    });
  }

  function updateEvidenceLifecycle() {
    const c = character();
    const dead = !!(c && (c.rip || c.dead));
    if (dead && !lastLocalDead) evidenceNote("deaths", 1);
    lastLocalDead = dead;

    if (currentTargetId && lastTargetSeenId === currentTargetId) {
      const target = entityById(currentTargetId);
      if (lastTargetWasAlive && target && (target.dead || target.rip)) killCount += 1;
      lastTargetWasAlive = !!(target && !target.dead && !target.rip);
    } else {
      lastTargetSeenId = currentTargetId;
      const target = entityById(currentTargetId);
      lastTargetWasAlive = !!(target && !target.dead && !target.rip);
    }

    if (activeEvidenceSegment) {
      const targetDuration = activeEvidenceSegment.art === "CAPABILITY_5M"
        ? config.evidence.capabilityDurationMs
        : config.evidence.integrationDurationMs;
      if (now() - activeEvidenceSegment.startedAtMs >= targetDuration) {
        finishEvidenceSegment("TARGET_DURATION_REACHED");
      }
    } else if (
      config.evidence.autoIntegration
      && config.group.enabled
      && currentGroup
      && currentGroup.status === "LIVE_GROUP_READY"
    ) startEvidenceSegment("INTEGRATION_15M", null);
  }

  function updateTraining() {
    const current = now();
    if (!lastTrainingTickAt) {
      lastTrainingTickAt = current;
      return;
    }
    const delta = Math.max(0, Math.min(5000, current - lastTrainingTickAt));
    lastTrainingTickAt = current;
    for (const member of allMembers()) {
      if (member.sessionFresh && member.rosterFresh && member.lifecycleActive) {
        trainingMs.set(member.characterId, (trainingMs.get(member.characterId) || 0) + delta);
      }
    }
  }

  function progressionBalance() {
    const members = allMembers();
    const totalTraining = Array.from(trainingMs.values()).reduce(function (a, b) { return a + b; }, 0);
    const roles = currentGroup && currentGroup.roles || {};
    const mandatory = new Set((config.progression.mandatoryRoles || []).map(function (role) {
      return roles[role];
    }).filter(Boolean));

    const candidates = members.filter(function (m) {
      return m.sessionFresh && m.rosterFresh && m.lifecycleActive;
    }).map(function (m) {
      const trained = trainingMs.get(m.characterId) || 0;
      const trainingShare = totalTraining > 0 ? trained / totalTraining : 0;
      const strength = (
        clamp(m.level / Math.max(1, config.progression.maxLevel), 0, 1)
        + clamp(m.gearScore / Math.max(1, config.progression.maxGearScore), 0, 1)
        + 0.5
        + ratio(m.hp, m.maxHp)
        + 0.5
      ) / 5;
      return {
        candidateId: "progression:" + m.characterId,
        characterId: m.characterId,
        mandatoryRole: mandatory.has(m.characterId),
        trainingShare: trainingShare,
        strength: strength,
        baseTaskScore: 0,
      };
    });

    const strongest = candidates.length ? Math.max.apply(null, candidates.map(function (c) { return c.strength; })) : 0;
    const ranking = candidates.map(function (candidate) {
      const gap = Math.max(0, strongest - candidate.strength - config.progression.targetCorridor);
      const weaknessBoost = candidate.mandatoryRole
        ? 0
        : Math.min(1, gap * 0.7 + Math.max(0, 1 - candidate.trainingShare) * 0.3);
      const score = (candidate.mandatoryRole ? 1000000 : 0) + candidate.baseTaskScore * 1000 + weaknessBoost * 100;
      return Object.freeze(Object.assign({}, candidate, {
        score: score,
        weaknessBoost: weaknessBoost,
        mandatoryRoleProtected: candidate.mandatoryRole,
      }));
    }).sort(function (a, b) {
      return b.score - a.score || a.characterId.localeCompare(b.characterId);
    });

    const selected = ranking[0] || null;
    return Object.freeze({
      status: selected ? "LIVE_SELECTION_READY" : "NO_ALLOWED_CANDIDATE",
      selectedCharacter: selected && selected.characterId || null,
      selected: selected,
      ranking: Object.freeze(ranking),
      safetyBeforeBalance: true,
      progressionStarvationGuard: true,
      gameplayAuthority: !!selected,
      normalRuntimeAllowed: !!selected,
      rawWriteAuthority: false,
    });
  }

  function entityById(id) {
    if (id == null) return null;
    return entities()[id] || null;
  }

  function normalizeMonsterName(entity) {
    return String(entity && (entity.mtype || entity.name) || "").toLowerCase();
  }

  function eligibleMonster(entity, allowedNames) {
    if (!entity || entity.type !== "monster" || entity.dead || entity.rip) return false;
    return allowedNames.has(normalizeMonsterName(entity));
  }

  function nearestMonster(names) {
    const c = character();
    if (!c) return null;
    const allowed = new Set((Array.isArray(names) ? names : []).map(function (x) {
      return String(x).toLowerCase();
    }).filter(Boolean));
    if (!allowed.size) return null;

    let best = null;
    let bestDistance = Infinity;
    for (const entity of Object.values(entities())) {
      if (!eligibleMonster(entity, allowed)) continue;
      const d = distance(c, entity);
      if (d < bestDistance) {
        best = entity;
        bestDistance = d;
      }
    }
    return best;
  }

  function playerEntity(name) {
    if (!name) return null;
    const getPlayer = publicFunction("get_player");
    if (getPlayer) {
      try {
        const p = getPlayer(name);
        if (p) return p;
      } catch (_) {}
    }
    const all = entities();
    for (const entity of Object.values(all)) {
      if (entity && entity.type === "character" && entity.name === name) return entity;
    }
    return null;
  }

  function currentEventObservation(definition) {
    const server = currentServer();
    const S = serverState();
    const key = String(definition.stateKey || definition.id || "");
    const state = key && S ? S[key] : null;
    const active = definition.active === true || !!(state && state.active !== false);
    const payload = {
      state: state || null,
      destination: definition.destination || null,
      monsterNames: definition.monsterNames || [],
      requiredCapabilities: definition.requiredCapabilities || [],
      successScore: number(definition.successScore, 0.8),
      realPerformanceScore: number(definition.realPerformanceScore, 0.5),
      travelCost: number(definition.travelCost, 0),
      resourceCost: number(definition.resourceCost, 0),
      learningScore: number(definition.learningScore, 0),
      action: definition.action || null,
    };
    const obs = {
      art: "EVENT",
      stateId: String(definition.id || key),
      serverRegion: server.region,
      serverIdentifier: server.identifier,
      mapId: String(character() && character().map || "unknown"),
      characterId: null,
      active: active,
      known: definition.known !== false,
      quarantined: definition.quarantined === true,
      observedAtMs: now(),
      validUntilMs: now() + config.world.observationTtlMs,
      payload: payload,
    };
    obs.fingerprint = fingerprint({
      art: obs.art,
      stateId: obs.stateId,
      serverRegion: obs.serverRegion,
      serverIdentifier: obs.serverIdentifier,
      active: obs.active,
      payload: obs.payload,
    });
    return Object.freeze(obs);
  }

  function readPath(object, path) {
    if (!path) return undefined;
    const parts = String(path).split(".");
    let value = object;
    for (const part of parts) {
      if (value == null || typeof value !== "object") return undefined;
      value = value[part];
    }
    return value;
  }

  function currentQuestObservation(definition) {
    const c = character();
    const server = currentServer();
    const source = definition.source === "q" ? c && c.q : c && c.s;
    const value = readPath(source || {}, definition.stateKey || definition.id);
    const active = definition.active === true
      || (definition.activeWhenPresent !== false && value != null && value !== false);
    const payload = {
      state: value == null ? null : value,
      destination: definition.destination || null,
      monsterNames: definition.monsterNames || [],
      requiredCapabilities: definition.requiredCapabilities || [],
      successScore: number(definition.successScore, 0.75),
      realPerformanceScore: number(definition.realPerformanceScore, 0.5),
      travelCost: number(definition.travelCost, 0),
      resourceCost: number(definition.resourceCost, 0),
      learningScore: number(definition.learningScore, 0),
      action: definition.action || null,
    };
    const obs = {
      art: "QUEST",
      stateId: String(definition.id || definition.stateKey || ""),
      serverRegion: server.region,
      serverIdentifier: server.identifier,
      mapId: String(c && c.map || "unknown"),
      characterId: String(c && c.name || ""),
      active: active,
      known: definition.known !== false,
      quarantined: definition.quarantined === true,
      observedAtMs: now(),
      validUntilMs: now() + config.world.observationTtlMs,
      payload: payload,
    };
    obs.fingerprint = fingerprint({
      art: obs.art,
      stateId: obs.stateId,
      serverRegion: obs.serverRegion,
      serverIdentifier: obs.serverIdentifier,
      mapId: obs.mapId,
      characterId: obs.characterId,
      active: obs.active,
      payload: obs.payload,
    });
    return Object.freeze(obs);
  }

  function rareObservations() {
    const server = currentServer();
    const c = character();
    const allowed = new Set((config.world.rareMonsters || []).map(function (x) {
      return String(x).toLowerCase();
    }));
    const out = [];
    for (const entity of Object.values(entities())) {
      if (!entity || entity.type !== "monster" || entity.dead || entity.rip) continue;
      const name = normalizeMonsterName(entity);
      if (!allowed.has(name)) continue;
      const obs = {
        art: "RARE_BOSS",
        stateId: String(entity.id || name),
        serverRegion: server.region,
        serverIdentifier: server.identifier,
        mapId: String(entity.map || c && c.map || "unknown"),
        characterId: null,
        active: true,
        known: true,
        quarantined: false,
        observedAtMs: now(),
        validUntilMs: now() + config.world.observationTtlMs,
        payload: {
          entityId: entity.id || null,
          monsterName: name,
          requiredCapabilities: [],
          successScore: 0.9,
          realPerformanceScore: 0.5,
          travelCost: distance(c, entity),
          resourceCost: 0,
          learningScore: 0,
          action: { type: "FARM_MONSTERS", monsterNames: [name] },
        },
      };
      obs.fingerprint = fingerprint({
        art: obs.art,
        stateId: obs.stateId,
        serverRegion: obs.serverRegion,
        serverIdentifier: obs.serverIdentifier,
        mapId: obs.mapId,
        entityId: obs.payload.entityId,
        active: obs.active,
      });
      out.push(Object.freeze(obs));
    }
    return out;
  }

  function discoveryObservations() {
    if (!config.world.discoveryEnabled) return [];
    const G = globalGameData();
    const definitions = G.monsters && typeof G.monsters === "object" ? G.monsters : {};
    const configuredKnown = new Set((config.world.knownMonsterTypes || []).map(function (x) {
      return String(x).toLowerCase();
    }));
    const server = currentServer();
    const c = character();
    const out = [];

    for (const entity of Object.values(entities())) {
      if (!entity || entity.type !== "monster" || entity.dead || entity.rip) continue;
      const name = normalizeMonsterName(entity);
      const known = !!definitions[name] || configuredKnown.has(name);
      if (known) continue;
      const key = "DISCOVERY:" + String(entity.id || name);
      const obs = Object.freeze({
        art: "DISCOVERY",
        stateId: String(entity.id || name),
        serverRegion: server.region,
        serverIdentifier: server.identifier,
        mapId: String(entity.map || c && c.map || "unknown"),
        characterId: null,
        active: true,
        known: false,
        quarantined: true,
        observedAtMs: now(),
        validUntilMs: now() + config.world.observationTtlMs,
        fingerprint: fingerprint({
          art: "DISCOVERY",
          stateId: String(entity.id || name),
          monsterName: name,
          map: String(entity.map || c && c.map || "unknown"),
        }),
        payload: Object.freeze({
          entityId: entity.id || null,
          monsterName: name,
        }),
      });
      worldQuarantine.set(key, obs);
      out.push(obs);
    }
    return out;
  }

  function serverHopObservation(serverDef) {
    const current = currentServer();
    const c = character();
    const id = String(serverDef.region || "") + ":" + String(serverDef.identifier || "");
    const obs = {
      art: "SERVER_HOP",
      stateId: id,
      serverRegion: current.region,
      serverIdentifier: current.identifier,
      mapId: String(c && c.map || "unknown"),
      characterId: String(c && c.name || ""),
      active: serverDef.online !== false,
      known: !!serverDef.region && !!serverDef.identifier && !!serverDef.mode,
      quarantined: false,
      observedAtMs: now(),
      validUntilMs: now() + config.world.observationTtlMs,
      payload: {
        targetRegion: serverDef.region,
        targetIdentifier: serverDef.identifier,
        mode: serverDef.mode,
        pvp: serverDef.pvp === true,
        hardcore: String(serverDef.mode || "").toUpperCase() === "HARDCORE" || serverDef.hardcore === true,
        requiredCapabilities: [],
        successScore: number(serverDef.successScore, 0.5),
        realPerformanceScore: number(serverDef.realPerformanceScore, 0.5),
        travelCost: number(serverDef.travelCost, 0),
        resourceCost: number(serverDef.resourceCost, 0),
        learningScore: number(serverDef.learningScore, 0),
        action: {
          type: "SERVER_HOP",
          region: serverDef.region,
          identifier: serverDef.identifier,
        },
      },
    };
    obs.fingerprint = fingerprint({
      art: obs.art,
      stateId: obs.stateId,
      active: obs.active,
      known: obs.known,
      payload: obs.payload,
    });
    return Object.freeze(obs);
  }

  function worldObservations() {
    if (!config.world.enabled) return [];
    const out = [];
    for (const def of config.world.events || []) {
      const obs = currentEventObservation(def);
      if (obs.active) out.push(obs);
    }
    for (const def of config.world.quests || []) {
      const obs = currentQuestObservation(def);
      if (obs.active) out.push(obs);
    }
    out.push.apply(out, rareObservations());
    discoveryObservations();

    if (config.world.serverHopEnabled) {
      for (const serverDef of config.world.servers || []) {
        const obs = serverHopObservation(serverDef);
        const current = currentServer();
        if (
          obs.active
          && !(obs.payload.targetRegion === current.region && obs.payload.targetIdentifier === current.identifier)
        ) out.push(obs);
      }
    }
    return out;
  }

  function observationFresh(obs) {
    return !!obs && now() >= obs.observedAtMs && now() <= obs.validUntilMs;
  }

  function revalidateWorldObservation(task) {
    const original = task && task.worldObservation;
    if (!original) return { ok: true, status: "NOT_REQUIRED", observation: null };

    let current = null;
    if (original.art === "EVENT") {
      const def = (config.world.events || []).find(function (x) {
        return String(x.id || x.stateKey || "") === original.stateId;
      });
      current = def ? currentEventObservation(def) : null;
    } else if (original.art === "QUEST") {
      const def = (config.world.quests || []).find(function (x) {
        return String(x.id || x.stateKey || "") === original.stateId;
      });
      current = def ? currentQuestObservation(def) : null;
    } else if (original.art === "RARE_BOSS") {
      current = rareObservations().find(function (x) { return x.stateId === original.stateId; }) || null;
    } else if (original.art === "SERVER_HOP") {
      const def = (config.world.servers || []).find(function (x) {
        return String(x.region || "") + ":" + String(x.identifier || "") === original.stateId;
      });
      current = def ? serverHopObservation(def) : null;
    } else if (original.art === "DISCOVERY") {
      return { ok: false, status: "BLOCKED_UNKNOWN_CONTENT", observation: original };
    }

    if (!current) return { ok: false, status: "BLOCKED_UNKNOWN", observation: null };
    if (!observationFresh(current)) return { ok: false, status: "BLOCKED_STALE", observation: current };
    if (!current.known || current.quarantined) return { ok: false, status: "BLOCKED_UNKNOWN_CONTENT", observation: current };
    if (!current.active) return { ok: false, status: "REPLAN_REQUIRED", observation: current };
    if (current.fingerprint !== original.fingerprint) return { ok: false, status: "REPLAN_REQUIRED", observation: current };
    return { ok: true, status: "VALID", observation: current };
  }

  function groupAssistTarget() {
    const leader = config.group.leader || config.coordination.assistLeader;
    if (!leader) return null;
    const row = peers.get(String(leader));
    if (!row || now() - row.receivedAtMs > config.coordination.staleMs || !row.targetId) return null;
    const target = entityById(row.targetId);
    return target && !target.dead && !target.rip && target.type === "monster" ? target : null;
  }

  function candidateFromWorld(obs) {
    const priority = number(config.optimizer.priorities && config.optimizer.priorities[obs.art], 0);
    const mode = String(obs.payload && obs.payload.mode || "").toUpperCase();
    let hardAllowed = obs.known && !obs.quarantined && observationFresh(obs);
    if (obs.art === "DISCOVERY") hardAllowed = false;
    if (obs.art === "SERVER_HOP") {
      if (obs.payload.pvp && !config.world.allowPvp) hardAllowed = false;
      if (obs.payload.hardcore && !config.world.allowHardcore) hardAllowed = false;
      if (!obs.payload.mode) hardAllowed = false;
      if (mode === "PVP" && !config.world.allowPvp) hardAllowed = false;
      if (mode === "HARDCORE" && !config.world.allowHardcore) hardAllowed = false;
      const last = worldHopHistory.get(obs.stateId) || 0;
      if (now() - last < config.world.serverHopCooldownMs) hardAllowed = false;
    }
    const available = currentGroup && currentGroup.availableCapabilities || capabilitiesFor(character() && (character().ctype || character().type));
    return {
      candidateId: "world:" + obs.art + ":" + obs.stateId,
      taskId: "world:" + obs.art + ":" + obs.stateId,
      partyId: config.group.topologyId || "local",
      hardAllowed: hardAllowed,
      safetyOk: true,
      worldEvidenceFresh: observationFresh(obs),
      requiredCapabilities: obs.payload.requiredCapabilities || [],
      availableCapabilities: available,
      successScore: number(obs.payload.successScore, 0.5),
      realPerformanceScore: number(obs.payload.realPerformanceScore, 0.5),
      travelCost: number(obs.payload.travelCost, 0),
      resourceCost: number(obs.payload.resourceCost, 0),
      learningScore: number(obs.payload.learningScore, 0),
      deterministicPriority: priority,
      payload: {
        type: obs.art,
        worldObservation: obs,
        action: obs.payload.action || null,
      },
    };
  }

  function optimize(candidates) {
    const ranking = [];
    const rejected = [];
    const seen = new Set();

    for (const candidate of candidates) {
      if (!candidate || seen.has(candidate.candidateId)) continue;
      seen.add(candidate.candidateId);
      const available = new Set(candidate.availableCapabilities || []);
      const required = new Set(candidate.requiredCapabilities || []);
      const capabilitiesOk = Array.from(required).every(function (cap) { return available.has(cap); });
      const hardOk = candidate.hardAllowed === true
        && candidate.safetyOk === true
        && candidate.worldEvidenceFresh === true
        && capabilitiesOk;
      if (!hardOk) {
        rejected.push(candidate.candidateId);
        continue;
      }
      const learning = clamp(number(candidate.learningScore, 0), -100, 100);
      let score = number(candidate.deterministicPriority, 0) * 1000000
        + number(candidate.successScore, 0) * 10000
        + number(candidate.realPerformanceScore, 0) * 1000
        - number(candidate.travelCost, 0) * 10
        - number(candidate.resourceCost, 0)
        + learning;
      const c = character();
      if (
        currentProgression
        && currentProgression.selectedCharacter
        && c
        && c.name === currentProgression.selectedCharacter
      ) score += config.optimizer.progressionPriorityBoost * 1000000;
      ranking.push(Object.freeze(Object.assign({}, candidate, {
        score: score,
        learningContribution: learning,
      })));
    }

    ranking.sort(function (a, b) {
      return b.score - a.score
        || a.taskId.localeCompare(b.taskId)
        || a.partyId.localeCompare(b.partyId)
        || a.candidateId.localeCompare(b.candidateId);
    });

    return Object.freeze({
      status: ranking.length ? "LIVE_SELECTION_READY" : "NO_ALLOWED_CANDIDATE",
      selected: ranking[0] || null,
      ranking: Object.freeze(ranking),
      rejectedCandidateIds: Object.freeze(rejected.sort()),
      learningCanRelaxHardFilter: false,
      deterministicFallbackPresent: true,
      gameplayAuthority: ranking.length > 0,
      normalRuntimeAllowed: ranking.length > 0,
      rawWriteAuthority: false,
    });
  }

  function buildCandidates() {
    const c = character();
    const available = currentGroup && currentGroup.availableCapabilities || capabilitiesFor(c && (c.ctype || c.type));
    const candidates = [];

    const assist = groupAssistTarget();
    if (assist) {
      candidates.push({
        candidateId: "group-assist:" + String(assist.id || normalizeMonsterName(assist)),
        taskId: "group-assist:" + String(assist.id || normalizeMonsterName(assist)),
        partyId: config.group.topologyId || "group",
        hardAllowed: !config.group.enabled || currentGroup && currentGroup.status === "LIVE_GROUP_READY",
        safetyOk: true,
        worldEvidenceFresh: true,
        requiredCapabilities: ["SINGLE_TARGET"],
        availableCapabilities: available,
        successScore: 0.9,
        realPerformanceScore: 0.8,
        travelCost: distance(c, assist),
        resourceCost: 0,
        learningScore: 0,
        deterministicPriority: config.optimizer.groupAssistPriority,
        payload: { type: "GROUP_ASSIST", target: assist },
      });
    }

    for (const obs of worldObservations()) candidates.push(candidateFromWorld(obs));

    if (config.farm.enabled) {
      const target = nearestMonster(config.farm.monsters);
      if (target) {
        candidates.push({
          candidateId: "farm:" + String(target.id || normalizeMonsterName(target)),
          taskId: "farm:" + String(target.id || normalizeMonsterName(target)),
          partyId: config.group.topologyId || "local",
          hardAllowed: !config.group.enabled || currentGroup && currentGroup.status === "LIVE_GROUP_READY",
          safetyOk: true,
          worldEvidenceFresh: true,
          requiredCapabilities: ["SINGLE_TARGET"],
          availableCapabilities: available,
          successScore: 0.7,
          realPerformanceScore: 0.7,
          travelCost: distance(c, target),
          resourceCost: 0,
          learningScore: 0,
          deterministicPriority: config.optimizer.farmPriority,
          payload: { type: "FARM", target: target },
        });
      }
    }

    return candidates;
  }

  function selectTask() {
    if (!config.optimizer.enabled) {
      const target = config.farm.enabled ? nearestMonster(config.farm.monsters) : null;
      return target ? Object.freeze({
        id: "farm:" + String(target.id || normalizeMonsterName(target)),
        type: "FARM",
        target: target,
        score: 0,
      }) : null;
    }

    if (now() - lastOptimizerAt < config.optimizer.replanMs && currentOptimizer) {
      return currentOptimizer.selectedTask || null;
    }
    lastOptimizerAt = now();

    const result = optimize(buildCandidates());
    let selectedTask = null;
    if (result.selected) {
      selectedTask = Object.freeze({
        id: result.selected.taskId,
        type: result.selected.payload && result.selected.payload.type || "UNKNOWN",
        target: result.selected.payload && result.selected.payload.target || null,
        worldObservation: result.selected.payload && result.selected.payload.worldObservation || null,
        action: result.selected.payload && result.selected.payload.action || null,
        score: result.selected.score,
        partyId: result.selected.partyId,
      });
    }
    currentOptimizer = Object.freeze(Object.assign({}, result, { selectedTask: selectedTask }));
    return selectedTask;
  }

  function targetStillUsable(target) {
    if (!target || target.dead || target.rip || target.type !== "monster") return false;
    const live = entityById(target.id);
    return !!(live && !live.dead && !live.rip);
  }

  function canAttackTarget(target) {
    const fn = publicFunction("can_attack");
    if (fn) {
      try { return !!fn(target); } catch (_) { return false; }
    }
    const c = character();
    const range = number(c && c.range, 0);
    return range > 0 && distance(c, target) <= range;
  }

  function isSkillReady(skill) {
    const cooldown = publicFunction("is_on_cooldown");
    if (!cooldown) return true;
    try { return cooldown(skill) !== true; } catch (_) { return false; }
  }

  function nearbyEligibleCount(center, radius, names) {
    const allowed = new Set((names || []).map(function (x) { return String(x).toLowerCase(); }));
    let count = 0;
    for (const entity of Object.values(entities())) {
      if (eligibleMonster(entity, allowed) && distance(center, entity) <= radius) count += 1;
    }
    return count;
  }

  async function maybeUseConfiguredSkill(target) {
    const c = character();
    if (!c || !target) return false;
    for (const rule of config.farm.skills || []) {
      if (!rule || typeof rule.name !== "string" || !isSkillReady(rule.name)) continue;
      if (number(c.mp, 0) < number(rule.minMp, 0)) continue;
      if (rule.aoe === true) {
        if (!config.farm.aoeEnabled || hpRatio(c) < config.farm.aoeMinHpRatio) continue;
        const count = nearbyEligibleCount(c, number(rule.radius, c.range || 120), config.farm.monsters);
        if (count < config.farm.aoeMinTargets) continue;
        if (count > config.farm.aoeMaxTargets) {
          log("AOE_BLOCKED_HARD_CAP", { skill: rule.name, count: count });
          continue;
        }
      }
      try {
        await executePublic("USE_SKILL", "use_skill", rule.targeted === false ? [rule.name] : [rule.name, target]);
        return true;
      } catch (error) {
        log("SKILL_FAILED", { skill: rule.name, error: String(error && error.message || error) });
      }
    }
    return false;
  }

  async function roleSupportTick(target) {
    if (!config.group.enabled || !currentGroup || currentGroup.status !== "LIVE_GROUP_READY") return false;
    const c = character();
    if (!c) return false;
    const name = String(c.name || "");
    const roles = currentGroup.roles || {};

    if (roles.HEAL === name) {
      const members = currentGroup.members.slice().sort(function (a, b) {
        return ratio(a.hp, a.maxHp) - ratio(b.hp, b.maxHp);
      });
      const low = members[0];
      if (low && ratio(low.hp, low.maxHp) < config.group.healThreshold) {
        const player = low.characterId === name ? c : playerEntity(low.characterId);
        const skill = config.group.roleSkills.heal;
        if (player && skill && isSkillReady(skill)) {
          try {
            await executePublic("GROUP_HEAL", "use_skill", [skill, player]);
            return true;
          } catch (error) {
            log("GROUP_HEAL_FAILED", { target: low.characterId, error: String(error && error.message || error) });
          }
        }
      }
    }

    if (roles.REVIVE === name) {
      const dead = currentGroup.members.find(function (m) { return m.dead; });
      const skill = config.group.roleSkills.revive;
      if (dead && skill && isSkillReady(skill)) {
        const player = playerEntity(dead.characterId);
        if (player) {
          try {
            await executePublic("GROUP_REVIVE", "use_skill", [skill, player]);
            return true;
          } catch (error) {
            log("GROUP_REVIVE_FAILED", { target: dead.characterId, error: String(error && error.message || error) });
          }
        }
      }
    }

    if (roles.TANK === name && target) {
      const skill = config.group.roleSkills.taunt;
      const aggroTarget = String(target.target || "");
      if (skill && aggroTarget && aggroTarget !== name && isSkillReady(skill)) {
        try {
          await executePublic("GROUP_TAUNT", "use_skill", [skill, target]);
          return true;
        } catch (error) {
          log("GROUP_TAUNT_FAILED", { targetId: target.id || null, error: String(error && error.message || error) });
        }
      }
    }

    if (roles.CC === name && target) {
      const skill = config.group.roleSkills.cc;
      if (skill && isSkillReady(skill)) {
        try {
          await executePublic("GROUP_CC", "use_skill", [skill, target]);
          return true;
        } catch (error) {
          log("GROUP_CC_FAILED", { targetId: target.id || null, error: String(error && error.message || error) });
        }
      }
    }

    return false;
  }

  async function maybeMoveToTarget(target) {
    if (!config.farm.moveToTarget || !target) return false;
    const c = character();
    if (!c || c.moving || movementPromise) return false;
    const range = Math.max(30, number(c.range, 100));
    const stopAt = range * number(config.farm.stopDistanceRatio, 0.8);
    if (distance(c, target) <= stopAt) return false;
    if (now() - movementStartedAt < config.movementGapMs) return false;

    const destination = {
      map: target.map || c.map,
      x: number(target.real_x != null ? target.real_x : target.x, NaN),
      y: number(target.real_y != null ? target.real_y : target.y, NaN),
    };
    if (!Number.isFinite(destination.x) || !Number.isFinite(destination.y)) return false;

    const key = String(destination.map || "") + ":" + Math.round(destination.x / 20) + ":" + Math.round(destination.y / 20);
    if (lastMovementKey && lastMovementKey !== key && now() - lastMovementAt < config.movementThrashWindowMs) {
      evidenceNote("movementThrashEvents", 1);
      log("MOVEMENT_THRASH_BLOCKED", { from: lastMovementKey, to: key });
      return false;
    }
    lastMovementKey = key;
    lastMovementAt = now();
    movementStartedAt = now();

    try {
      const promise = executePublic("SMART_MOVE", "smart_move", [destination]);
      movementPromise = Promise.resolve(promise).then(function () {
        log("MOVEMENT_COMPLETE", { destination: destination });
      }).catch(function (error) {
        log("MOVEMENT_FAILED", { destination: destination, error: String(error && error.message || error) });
      }).finally(function () {
        movementPromise = null;
      });
      return true;
    } catch (error) {
      movementPromise = null;
      log("MOVEMENT_FAILED", { destination: destination, error: String(error && error.message || error) });
      return false;
    }
  }

  async function moveToDestination(destination, reason) {
    if (!destination || movementPromise) return false;
    const c = character();
    if (!c || c.moving) return false;
    if (now() - movementStartedAt < config.movementGapMs) return false;
    movementStartedAt = now();
    try {
      const promise = executePublic("WORLD_MOVE", "smart_move", [destination]);
      movementPromise = Promise.resolve(promise).then(function () {
        log("WORLD_ARRIVAL_TRANSPORT_COMPLETE", { reason: reason, destination: destination });
      }).catch(function (error) {
        log("WORLD_MOVE_FAILED", { reason: reason, error: String(error && error.message || error) });
      }).finally(function () { movementPromise = null; });
      return true;
    } catch (error) {
      movementPromise = null;
      return false;
    }
  }

  async function farmerTick(task) {
    const c = character();
    if (!c || !config.farm.enabled) return;
    if (c.rip || c.dead) {
      currentTargetId = null;
      if (!config.farm.respawn || now() - lastRespawnAt < config.respawnGapMs || !publicFunction("respawn")) return;
      lastRespawnAt = now();
      try { await executePublic("RESPAWN", "respawn", []); } catch (error) {
        log("RESPAWN_FAILED", { error: String(error && error.message || error) });
      }
      return;
    }

    if (hpRatio(c) < config.farm.minHpRatio) {
      log("FARM_PAUSED_LOW_HP", { hpRatio: hpRatio(c) });
      return;
    }
    if (queueBusy(c)) return;

    let target = task && task.target || null;
    if (!target && task && task.worldObservation && task.worldObservation.payload) {
      const names = task.worldObservation.payload.monsterNames || [];
      if (names.length) target = nearestMonster(names);
    }

    if (!targetStillUsable(target)) {
      if (target) evidenceNote("staleTargetActions", 1);
      currentTargetId = null;
      if (task && task.worldObservation && task.worldObservation.payload && task.worldObservation.payload.destination) {
        await moveToDestination(task.worldObservation.payload.destination, task.type);
      }
      return;
    }

    currentTargetId = target.id || null;
    if (await roleSupportTick(target)) return;

    if (!canAttackTarget(target)) {
      await maybeMoveToTarget(target);
      return;
    }
    if (!actionGapPassed(config.actionGapMs)) return;
    if (await maybeUseConfiguredSkill(target)) return;

    try { await executePublic("ATTACK", "attack", [target]); } catch (error) {
      log("ATTACK_FAILED", { targetId: target.id || null, error: String(error && error.message || error) });
    }
  }

  async function lootTick() {
    if (!config.farm.enabled || !config.farm.loot || now() - lastLootAt < config.lootGapMs) return;
    if (!publicFunction("loot")) return;
    lastLootAt = now();
    try { await executePublic("LOOT", "loot", []); } catch (error) {
      log("LOOT_FAILED", { error: String(error && error.message || error) });
    }
  }

  function inventory() {
    const c = character();
    return Array.isArray(c && c.items) ? c.items : [];
  }

  function freeInventorySlots() {
    const c = character();
    const size = number(c && c.isize, inventory().length);
    return Math.max(0, size - inventory().filter(Boolean).length);
  }

  function findInventoryItem(name) {
    const items = inventory();
    for (let i = 0; i < items.length; i += 1) {
      if (items[i] && items[i].name === name) return { index: i, item: items[i] };
    }
    return null;
  }

  function nextBankSlot() {
    const c = character();
    const bank = c && c.bank;
    if (!bank || typeof bank !== "object" || Array.isArray(bank)) return null;
    for (const pack of Object.keys(bank).sort()) {
      if (!/^items[0-9]+$/.test(pack) || !Array.isArray(bank[pack])) continue;
      for (let i = 0; i < bank[pack].length; i += 1) if (!bank[pack][i]) return { pack: pack, index: i };
    }
    return null;
  }

  function serviceAllowed(service) {
    if (lastService && lastService !== service && now() - lastServiceAt < config.merchant.serviceCooldownMs) {
      log("MERCHANT_PINGPONG_BLOCKED", { from: lastService, to: service, elapsedMs: now() - lastServiceAt });
      return false;
    }
    if (serviceArrivalAt > 0 && now() - serviceArrivalAt < config.merchant.serviceSettleMs) return false;
    return true;
  }

  function markService(service) {
    if (lastService !== service) {
      lastService = service;
      lastServiceAt = now();
      serviceArrivalAt = now();
    }
  }

  async function merchantTick() {
    if (!config.merchant.enabled) return;
    const c = character();
    if (!c || String(c.ctype || c.type || "").toLowerCase() !== "merchant") return;
    if (c.rip || c.dead || c.moving || c.target != null || queueBusy(c) || !actionGapPassed(500)) return;

    for (const rule of config.merchant.exchangeRules || []) {
      if (!rule || !rule.item) continue;
      const found = findInventoryItem(rule.item);
      const required = number(rule.quantity, 1);
      if (!found || number(found.item.q, 1) < required || freeInventorySlots() < config.merchant.minimumFreeSlots) continue;
      if (!serviceAllowed("exchange")) return;

      if (rule.destination && rule.atService !== true) {
        markService("exchange");
        await moveToDestination(rule.destination, "MERCHANT_EXCHANGE");
        serviceArrivalAt = now();
        return;
      }

      markService("exchange");
      const intentId = ["exchange", c.name, rule.item, found.index, number(found.item.q, 1)].join(":");
      try {
        await executePublic("EXCHANGE", "exchange", [found.index], { intentId: intentId, irreversibleAction: true });
      } catch (error) {
        log("MERCHANT_EXCHANGE_FAILED", { item: rule.item, index: found.index, error: String(error && error.message || error) });
      }
      return;
    }

    for (const rule of config.merchant.bankRules || []) {
      if (!rule || !rule.item) continue;
      const found = findInventoryItem(rule.item);
      if (!found || !serviceAllowed("bank")) continue;
      const slot = nextBankSlot();
      if (!slot) {
        if (rule.destination && !(c && c.bank)) {
          markService("bank");
          await moveToDestination(rule.destination, "MERCHANT_BANK");
          serviceArrivalAt = now();
        }
        return;
      }
      markService("bank");
      const intentId = ["bank-store", c.name, rule.item, found.index, slot.pack, slot.index].join(":");
      try {
        await executePublic("BANK_STORE", "bank_store", [found.index, slot.pack, slot.index], { intentId: intentId, irreversibleAction: true });
      } catch (error) {
        log("MERCHANT_BANK_STORE_FAILED", { item: rule.item, error: String(error && error.message || error) });
      }
      return;
    }

    for (const rule of config.merchant.buyRules || []) {
      if (!rule || !rule.item) continue;
      const have = inventory().filter(function (item) { return item && item.name === rule.item; }).reduce(function (sum, item) {
        return sum + number(item.q, 1);
      }, 0);
      const minimum = number(rule.minimum, 0);
      const target = number(rule.target, minimum);
      if (have >= minimum || target <= have || !serviceAllowed("buy")) continue;

      if (rule.destination && rule.atService !== true) {
        markService("buy");
        await moveToDestination(rule.destination, "MERCHANT_BUY");
        serviceArrivalAt = now();
        return;
      }

      const quantity = Math.max(1, Math.floor(target - have));
      markService("buy");
      const intentId = ["buy", c.name, rule.item, quantity, now()].join(":");
      try {
        await executePublic("BUY", "buy", [rule.item, quantity], { intentId: intentId, irreversibleAction: true });
      } catch (error) {
        log("MERCHANT_BUY_FAILED", { item: rule.item, quantity: quantity, error: String(error && error.message || error) });
      }
      return;
    }
  }

  async function executeWorldAction(task) {
    if (!task || !task.worldObservation) return false;
    const validation = revalidateWorldObservation(task);
    if (!validation.ok) {
      log("WORLD_REVALIDATION_BLOCKED", {
        taskId: task.id,
        art: task.type,
        status: validation.status,
      });
      return false;
    }

    const action = task.action || validation.observation && validation.observation.payload && validation.observation.payload.action;
    if (!action) return false;

    if (action.type === "SERVER_HOP") {
      const obs = validation.observation;
      if (!obs || !obs.known || !obs.active) return false;
      if (obs.payload.pvp && !config.world.allowPvp) return false;
      if (obs.payload.hardcore && !config.world.allowHardcore) return false;
      const last = worldHopHistory.get(obs.stateId) || 0;
      if (now() - last < config.world.serverHopCooldownMs) return false;
      const c = character();
      if (!c || c.rip || c.dead || c.moving || c.target != null || queueBusy(c)) return false;
      const intentId = ["server-hop", c.name, currentServer().region, currentServer().identifier, action.region, action.identifier].join(":");
      lastServerHopAt = now();
      try {
        await executePublic("SERVER_HOP", "change_server", [action.region, action.identifier], {
          intentId: intentId,
          irreversibleAction: true,
        });
        worldHopHistory.set(obs.stateId, now());
        return true;
      } catch (error) {
        log("WORLD_SERVER_HOP_FAILED", { error: String(error && error.message || error) });
        return false;
      }
    }

    if (action.type === "MOVE" && action.destination) {
      return moveToDestination(action.destination, task.type);
    }

    if (action.type === "FARM_MONSTERS") {
      return false;
    }

    if (action.type === "USE_SKILL" && action.skill) {
      const target = action.targetName ? playerEntity(action.targetName) : null;
      try {
        await executePublic("WORLD_USE_SKILL", "use_skill", target ? [action.skill, target] : [action.skill]);
        return true;
      } catch (error) {
        log("WORLD_USE_SKILL_FAILED", { error: String(error && error.message || error) });
        return false;
      }
    }

    if (action.type === "PUBLIC_FUNCTION" && action.name) {
      if (!(config.world.allowedPublicActions || []).includes(action.name)) {
        log("WORLD_PUBLIC_ACTION_BLOCKED", { name: action.name, reason: "NOT_ALLOWLISTED" });
        return false;
      }
      if (!publicFunction(action.name)) {
        log("WORLD_PUBLIC_ACTION_BLOCKED", { name: action.name, reason: "FUNCTION_UNAVAILABLE" });
        return false;
      }
      try {
        await executePublic("WORLD_PUBLIC_ACTION", action.name, Array.isArray(action.args) ? action.args : []);
        return true;
      } catch (error) {
        log("WORLD_PUBLIC_ACTION_FAILED", { name: action.name, error: String(error && error.message || error) });
        return false;
      }
    }

    return false;
  }

  async function worldTick(task) {
    if (!config.world.enabled || !task || !task.worldObservation) return;
    if (task.type === "DISCOVERY") {
      log("WORLD_DISCOVERY_OBSERVED_NO_AUTHORITY", {
        stateId: task.worldObservation.stateId,
        fingerprint: task.worldObservation.fingerprint,
      });
      return;
    }
    await executeWorldAction(task);
  }

  function validateConfig(next) {
    if (!Number.isSafeInteger(next.loopMs) || next.loopMs < 100 || next.loopMs > 5000) throw new Error("LIVE_LAB_CONFIG_LOOP_INVALID");
    if (!Array.isArray(next.farm.monsters) || !Array.isArray(next.farm.skills)) throw new Error("LIVE_LAB_CONFIG_FARM_INVALID");
    if (!Array.isArray(next.coordination.peers)) throw new Error("LIVE_LAB_CONFIG_PEERS_INVALID");
    if (!Array.isArray(next.group.knownMemberIds)) throw new Error("LIVE_LAB_CONFIG_GROUP_MEMBERS_INVALID");
    if (!TOPOLOGIES[next.group.topologyId]) throw new Error("LIVE_LAB_CONFIG_GROUP_TOPOLOGY_INVALID");
    if (!Array.isArray(next.merchant.buyRules) || !Array.isArray(next.merchant.exchangeRules) || !Array.isArray(next.merchant.bankRules)) {
      throw new Error("LIVE_LAB_CONFIG_MERCHANT_RULES_INVALID");
    }
    if (!Array.isArray(next.world.events) || !Array.isArray(next.world.quests) || !Array.isArray(next.world.rareMonsters) || !Array.isArray(next.world.servers)) {
      throw new Error("LIVE_LAB_CONFIG_WORLD_INVALID");
    }
    if (!(next.farm.minHpRatio >= 0 && next.farm.minHpRatio <= 1)) throw new Error("LIVE_LAB_CONFIG_MIN_HP_INVALID");
    if (!(next.farm.aoeMinHpRatio >= 0 && next.farm.aoeMinHpRatio <= 1)) throw new Error("LIVE_LAB_CONFIG_AOE_HP_INVALID");
    if (!Number.isSafeInteger(next.farm.aoeMaxTargets) || next.farm.aoeMaxTargets < 1 || next.farm.aoeMaxTargets > 20) {
      throw new Error("LIVE_LAB_CONFIG_AOE_CAP_INVALID");
    }
    if (!(next.progression.targetCorridor >= 0 && next.progression.targetCorridor <= 1)) throw new Error("LIVE_LAB_CONFIG_PROGRESSION_CORRIDOR_INVALID");
  }

  function configure(patch) {
    if (running) throw new Error("LIVE_LAB_STOP_BEFORE_CONFIGURE");
    const next = merge(config, patch || {});
    validateConfig(next);
    config = next;
    log("CONFIG_UPDATED", {
      farmEnabled: config.farm.enabled,
      groupEnabled: config.group.enabled,
      topologyId: config.group.topologyId,
      optimizerEnabled: config.optimizer.enabled,
      progressionEnabled: config.progression.enabled,
      merchantEnabled: config.merchant.enabled,
      worldEnabled: config.world.enabled,
      eventDefinitions: config.world.events.length,
      questDefinitions: config.world.quests.length,
      rareDefinitions: config.world.rareMonsters.length,
      serverDefinitions: config.world.servers.length,
    });
    return api.status();
  }

  async function tick() {
    if (!running || inTick) return;
    inTick = true;
    tickSeq += 1;

    try {
      const safety = liveSafety();
      if (!safety.admitted) {
        evidenceNote("safetyViolations", 1);
        log("TICK_BLOCKED", { blocker: safety.blocker });
        return;
      }

      prunePeers();
      await coordinationTick();
      currentGroup = config.group.enabled ? evaluateGroup() : evaluateGroup();
      updateTraining();
      currentProgression = config.progression.enabled ? progressionBalance() : null;
      updateEvidenceLifecycle();

      if (
        config.group.enabled
        && config.group.failClosedOnFault
        && currentGroup.status !== "LIVE_GROUP_READY"
      ) {
        log("GROUP_RUNTIME_BLOCKED", {
          blocker: currentGroup.blocker,
          faults: currentGroup.faults,
        });
        const c = character();
        if (c && (c.rip || c.dead) && config.farm.respawn) {
          await farmerTick(null);
        }
        return;
      }

      const task = selectTask();
      if ((task && task.id || null) !== (currentTask && currentTask.id || null)) {
        log("TASK_CHANGED", {
          from: currentTask && currentTask.id || null,
          to: task && task.id || null,
          taskType: task && task.type || null,
          score: task && task.score || null,
          progressionSelectedCharacter: currentProgression && currentProgression.selectedCharacter || null,
        });
      }
      currentTask = task;

      const c = character();
      const isMerchant = String(c && (c.ctype || c.type) || "").toLowerCase() === "merchant";
      if (isMerchant) {
        await merchantTick();
      } else {
        if (task && task.worldObservation) await worldTick(task);
        await farmerTick(task);
        await lootTick();
      }
    } catch (error) {
      log("TICK_ERROR", { error: String(error && (error.stack || error.message) || error) });
    } finally {
      inTick = false;
    }
  }

  function start(options) {
    if (!options || options.ack !== START_ACK) throw new Error("LIVE_LAB_START_ACK_REQUIRED:" + START_ACK);
    if (running) return api.status();
    const conflict = alternativeRuntimeActive();
    if (conflict) throw new Error("LIVE_LAB_RUNTIME_CONFLICT:" + conflict);
    if (!character()) throw new Error("LIVE_LAB_CHARACTER_UNAVAILABLE");

    running = true;
    emergencyStop = false;
    stopReason = null;
    installCmHandler();
    lastTrainingTickAt = now();

    log("RUNTIME_STARTED", {
      liveExecutionAllowed: true,
      gameplayAuthority: true,
      normalRuntimeAllowed: true,
      rawWriteAuthority: false,
      pr24GroupRuntime: true,
      pr25LiveEvidence: true,
      pr26Optimizer: true,
      pr27Progression: true,
      pr28WorldAutonomy: true,
    });

    timer = setInterval(function () { void tick(); }, config.loopMs);
    void tick();
    return api.status();
  }

  function stop(reason) {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    running = false;
    stopReason = String(reason || "MANUAL_STOP");
    movementPromise = null;
    currentTargetId = null;
    currentTask = null;
    restoreCmHandler();
    if (activeEvidenceSegment) finishEvidenceSegment("RUNTIME_STOP");
    log("RUNTIME_STOPPED", { reason: stopReason });
    return api.status();
  }

  function triggerEmergencyStop(reason) {
    emergencyStop = true;
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    running = false;
    stopReason = String(reason || "MANUAL_EMERGENCY_STOP");
    restoreCmHandler();
    if (activeEvidenceSegment) finishEvidenceSegment("EMERGENCY_STOP");
    log("EMERGENCY_STOP", { reason: stopReason });
    return api.status();
  }

  const api = Object.freeze({
    profileId: PROFILE_ID,
    version: VERSION,
    sourceMainSha: SOURCE_MAIN_SHA,
    startAck: START_ACK,

    configure: configure,
    start: start,
    stop: stop,
    emergencyStop: triggerEmergencyStop,
    tickNow: function () { return tick(); },

    startEvidenceSegment: function (options) {
      options = options || {};
      return startEvidenceSegment(options.art || "INTEGRATION_15M", options.capabilityId || null);
    },
    finishEvidenceSegment: function (reason) {
      return finishEvidenceSegment(reason || "MANUAL");
    },

    status: function () {
      const safety = liveSafety();
      const c = character();
      return Object.freeze({
        schemaVersion: 2,
        profileId: PROFILE_ID,
        version: VERSION,
        sourceMainSha: SOURCE_MAIN_SHA,
        running: running,
        stopReason: stopReason,
        emergencyStop: emergencyStop,
        liveExecutionAllowed: running && safety.admitted,
        gameplayAuthority: running && safety.admitted,
        normalRuntimeAllowed: running && safety.admitted,
        rawWriteAuthority: false,
        character: c && c.name || null,
        ctype: c && (c.ctype || c.type) || null,
        server: currentServer(),
        tickSeq: tickSeq,
        currentTask: currentTask ? {
          id: currentTask.id,
          type: currentTask.type,
          score: currentTask.score,
          targetId: currentTask.target && currentTask.target.id || null,
          worldStateId: currentTask.worldObservation && currentTask.worldObservation.stateId || null,
        } : null,
        currentTargetId: currentTargetId,
        movementInFlight: !!movementPromise,
        lastService: lastService,
        lastServiceAt: lastServiceAt,
        freeInventorySlots: freeInventorySlots(),
        group: currentGroup,
        optimizer: currentOptimizer,
        progression: currentProgression,
        evidence: evidenceSummary(),
        peers: peerSnapshot(),
        world: Object.freeze({
          quarantine: Object.freeze(Array.from(worldQuarantine.values())),
          plans: Object.freeze(Array.from(worldPlans.values())),
          hopHistory: Object.freeze(Array.from(worldHopHistory.entries()).map(function (entry) {
            return { server: entry[0], atMs: entry[1] };
          })),
        }),
        trainingMs: Object.freeze(Array.from(trainingMs.entries()).map(function (entry) {
          return { characterId: entry[0], ms: entry[1] };
        })),
        logEntries: logs.length,
        irreversibleIntents: Object.freeze(Array.from(irreversible.entries()).map(function (entry) {
          return Object.assign({ intentId: entry[0] }, entry[1]);
        })),
        safety: safety,
      });
    },

    exportLogs: function (options) {
      const sinceSeq = number(options && options.sinceSeq, 0);
      return Object.freeze(logs.filter(function (entry) { return entry.seq > sinceSeq; }).map(function (entry) {
        return Object.freeze(Object.assign({}, entry));
      }));
    },

    exportBugBundle: function () {
      const c = character();
      return Object.freeze({
        schemaVersion: 2,
        issueSchema: "V5 Live-Test Bug",
        profileId: PROFILE_ID,
        version: VERSION,
        sourceMainSha: SOURCE_MAIN_SHA,
        observedAtMs: now(),
        character: c && c.name || null,
        ctype: c && (c.ctype || c.type) || null,
        server: currentServer(),
        status: api.status(),
        config: clone(config),
        logs: api.exportLogs(),
      });
    },

    getConfig: function () { return clone(config); },

    inspectPorts: function () {
      const names = [
        "smart_move", "move", "attack", "use_skill", "loot", "respawn",
        "send_cm", "change_server", "buy", "sell", "exchange", "upgrade",
        "compound", "craft", "send_item", "send_gold", "bank_store",
        "bank_retrieve", "bank_swap", "get_player", "get_party", "join",
      ];
      const out = {};
      names.forEach(function (name) { out[name] = !!publicFunction(name); });
      return Object.freeze(out);
    },
  });

  if (root.V5LiveLab && root.V5LiveLab.version && root.V5LiveLab.version !== VERSION) {
    try {
      if (typeof root.V5LiveLab.stop === "function") root.V5LiveLab.stop("UPGRADE_TO_V2");
    } catch (_) {}
  }
  root.V5LiveLab = api;
  log("RUNTIME_INSTALLED", {
    liveExecutionAllowed: false,
    gameplayAuthority: false,
    normalRuntimeAllowed: false,
    rawWriteAuthority: false,
    pr24GroupRuntime: true,
    pr25LiveEvidence: true,
    pr26Optimizer: true,
    pr27Progression: true,
    pr28WorldAutonomy: true,
  });
})(typeof globalThis !== "undefined" ? globalThis : window);
