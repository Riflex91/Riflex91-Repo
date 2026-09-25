(function installV5LiveLab(root) {
  "use strict";

  const PROFILE_ID = "V5_LIVE_LAB_PR28";
  const VERSION = "0.1.0";
  const SOURCE_MAIN_SHA = "3fde62bd75aaed495b60cc71b1cfc4c197af4316";
  const START_ACK = "V5_LIVE_LAB_START";
  const MAX_LOGS = 2000;

  const defaults = Object.freeze({
    loopMs: 250,
    actionGapMs: 180,
    movementGapMs: 1200,
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
      rareMonsters: Object.freeze([]),
      serverHopEnabled: false,
      serverHopRegion: null,
      serverHopIdentifier: null,
      serverHopCooldownMs: 10 * 60 * 1000,
    }),
  });

  function clone(value) {
    if (value == null || typeof value !== "object") return value;
    if (Array.isArray(value)) return value.map(clone);
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = clone(v);
    return out;
  }

  function merge(base, patch) {
    if (patch == null || typeof patch !== "object" || Array.isArray(patch)) {
      return clone(patch);
    }
    const out = clone(base);
    for (const [k, v] of Object.entries(patch)) {
      if (
        v
        && typeof v === "object"
        && !Array.isArray(v)
        && out[k]
        && typeof out[k] === "object"
        && !Array.isArray(out[k])
      ) {
        out[k] = merge(out[k], v);
      } else {
        out[k] = clone(v);
      }
    }
    return out;
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
  let previousOnCm = null;

  const logs = [];
  const peers = new Map();
  const irreversible = new Map();

  function now() {
    return Date.now();
  }

  function character() {
    try {
      return root.character || root.parent?.character || null;
    } catch {
      return null;
    }
  }

  function entities() {
    try {
      return root.entities || root.parent?.entities || {};
    } catch {
      return {};
    }
  }

  function currentServer() {
    let region = "";
    let identifier = "";
    try {
      region = String(root.server_region || root.parent?.server_region || root.server?.region || "");
    } catch {}
    try {
      identifier = String(root.server_identifier || root.parent?.server_identifier || root.server?.id || "");
    } catch {}
    return { region, identifier };
  }

  function log(event, data) {
    const c = character();
    const entry = Object.freeze({
      seq: ++seq,
      atMs: now(),
      event,
      profileId: PROFILE_ID,
      version: VERSION,
      sourceMainSha: SOURCE_MAIN_SHA,
      character: c?.name ?? null,
      ctype: c?.ctype ?? c?.type ?? null,
      map: c?.map ?? null,
      x: Number.isFinite(c?.x) ? c.x : null,
      y: Number.isFinite(c?.y) ? c.y : null,
      ...data,
    });
    logs.push(entry);
    if (logs.length > MAX_LOGS) logs.splice(0, logs.length - MAX_LOGS);
    return entry;
  }

  function publicFunction(name) {
    const roots = [root];
    try {
      if (root.parent && root.parent !== root) roots.push(root.parent);
    } catch {}
    for (const r of roots) {
      try {
        if (typeof r?.[name] === "function") return r[name].bind(r);
      } catch {}
    }
    return null;
  }

  function callPublic(name, args) {
    const fn = publicFunction(name);
    if (!fn) throw new Error("LIVE_LAB_PUBLIC_FUNCTION_UNAVAILABLE:" + name);
    return fn(...args);
  }

  function alternativeRuntimeActive() {
    try {
      const v3 = root.AIO_V3?.__runtime;
      const s = v3 && typeof v3.status === "function" ? v3.status() : null;
      if (v3 && (v3.timer || s?.running === true)) return "AIO_V3_RUNTIME_ACTIVE";
    } catch {
      return "AIO_V3_RUNTIME_UNREADABLE";
    }
    try {
      const v4 = root.AIO_V4 || root.V4Runtime || root.V4ProduktionsLaufzeit;
      const s = v4 && typeof v4.status === "function" ? v4.status() : null;
      if (v4 && (s?.running === true || s?.aktivFreigegeben === true)) {
        return "V4_RUNTIME_ACTIVE";
      }
    } catch {
      return "V4_RUNTIME_UNREADABLE";
    }
    return null;
  }

  function queueBusy(c) {
    return !!(
      c?.q
      && typeof c.q === "object"
      && Object.keys(c.q).length > 0
    );
  }

  function hpRatio(c) {
    const hp = Number(c?.hp);
    const max = Number(c?.max_hp ?? c?.maxHp);
    if (!(max > 0) || !Number.isFinite(hp)) return 0;
    return Math.max(0, Math.min(1, hp / max));
  }

  function mpRatio(c) {
    const mp = Number(c?.mp);
    const max = Number(c?.max_mp ?? c?.maxMp);
    if (!(max > 0) || !Number.isFinite(mp)) return 0;
    return Math.max(0, Math.min(1, mp / max));
  }

  function distance(a, b) {
    const ax = Number(a?.real_x ?? a?.x);
    const ay = Number(a?.real_y ?? a?.y);
    const bx = Number(b?.real_x ?? b?.x);
    const by = Number(b?.real_y ?? b?.y);
    if (![ax, ay, bx, by].every(Number.isFinite)) return Infinity;
    return Math.hypot(ax - bx, ay - by);
  }

  function normalizeMonsterName(e) {
    return String(e?.mtype || e?.name || "").toLowerCase();
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
      blocker,
      liveExecutionAllowed: blocker.length === 0,
      gameplayAuthority: blocker.length === 0,
      normalRuntimeAllowed: blocker.length === 0,
      rawWriteAuthority: false,
    };
  }

  function actionGapPassed(gap = config.actionGapMs) {
    return now() - lastActionAt >= gap;
  }

  function noteAction(kind, details) {
    lastActionAt = now();
    log("ACTION_SENT", { kind, ...details });
  }

  async function executePublic(kind, publicName, args, {
    intentId = null,
    irreversibleAction = false,
  } = {}) {
    const safety = liveSafety();
    if (!safety.admitted) {
      throw new Error("LIVE_LAB_ACTION_BLOCKED:" + safety.blocker.join(","));
    }

    if (irreversibleAction) {
      if (typeof intentId !== "string" || intentId.length < 3 || intentId.length > 240) {
        throw new Error("LIVE_LAB_IRREVERSIBLE_INTENT_ID_REQUIRED");
      }
      const prior = irreversible.get(intentId);
      if (prior) {
        throw new Error(
          "LIVE_LAB_DUPLICATE_OR_UNKNOWN_IRREVERSIBLE_INTENT:"
          + intentId
          + ":"
          + prior.status,
        );
      }
      irreversible.set(intentId, {
        status: "IN_FLIGHT",
        kind,
        startedAtMs: now(),
      });
    }

    noteAction(kind, { intentId });
    try {
      const result = await callPublic(publicName, args);
      if (irreversibleAction) {
        irreversible.set(intentId, {
          status: "COMMITTED",
          kind,
          finishedAtMs: now(),
        });
      }
      log("ACTION_COMMIT", { kind, intentId });
      return result;
    } catch (error) {
      if (irreversibleAction) {
        irreversible.set(intentId, {
          status: "UNKNOWN",
          kind,
          finishedAtMs: now(),
          error: String(error?.message ?? error),
        });
      }
      log(irreversibleAction ? "ACTION_UNKNOWN" : "ACTION_FAILED", {
        kind,
        intentId,
        error: String(error?.message ?? error),
      });
      throw error;
    }
  }

  function partySnapshot() {
    let party = {};
    try {
      const getParty = publicFunction("get_party");
      party = getParty ? getParty() : (root.party || root.parent?.party || {});
    } catch {
      party = {};
    }
    const names = Array.isArray(party)
      ? party.map((x) => String(x?.name || x || "")).filter(Boolean)
      : Object.keys(party || {});
    return Object.freeze({
      memberNames: Object.freeze(names.sort()),
      size: names.length,
    });
  }

  function heartbeatPayload() {
    const c = character();
    const p = partySnapshot();
    return Object.freeze({
      type: "V5_LIVE_LAB_HEARTBEAT",
      schemaVersion: 1,
      profileId: PROFILE_ID,
      version: VERSION,
      atMs: now(),
      character: c?.name ?? null,
      ctype: c?.ctype ?? c?.type ?? null,
      map: c?.map ?? null,
      x: Number(c?.x ?? 0),
      y: Number(c?.y ?? 0),
      hp: Number(c?.hp ?? 0),
      maxHp: Number(c?.max_hp ?? c?.maxHp ?? 0),
      mp: Number(c?.mp ?? 0),
      maxMp: Number(c?.max_mp ?? c?.maxMp ?? 0),
      targetId: currentTargetId,
      taskId: currentTask?.id ?? null,
      partySize: p.size,
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
        log("COORDINATION_SEND_FAILED", {
          peer,
          error: String(error?.message ?? error),
        });
      }
    }
  }

  function installCmHandler() {
    if (previousOnCm !== null) return;
    previousOnCm = typeof root.on_cm === "function" ? root.on_cm : false;
    root.on_cm = function onLiveLabCm(name, data) {
      try {
        if (data?.type === "V5_LIVE_LAB_HEARTBEAT"
            && data.profileId === PROFILE_ID) {
          peers.set(String(name), Object.freeze({
            ...data,
            receivedAtMs: now(),
          }));
          log("COORDINATION_HEARTBEAT_RECEIVED", {
            peer: String(name),
            peerTaskId: data.taskId ?? null,
            peerTargetId: data.targetId ?? null,
          });
        }
      } catch (error) {
        log("COORDINATION_RECEIVE_FAILED", {
          error: String(error?.message ?? error),
        });
      }

      if (typeof previousOnCm === "function") {
        try {
          return previousOnCm(name, data);
        } catch (error) {
          log("PREVIOUS_ON_CM_FAILED", {
            error: String(error?.message ?? error),
          });
        }
      }
      return undefined;
    };
  }

  function restoreCmHandler() {
    if (previousOnCm === null) return;
    if (previousOnCm === false) {
      try {
        delete root.on_cm;
      } catch {
        root.on_cm = undefined;
      }
    } else {
      root.on_cm = previousOnCm;
    }
    previousOnCm = null;
  }

  function entityById(id) {
    if (id == null) return null;
    const all = entities();
    return all?.[id] ?? null;
  }

  function eligibleMonster(e, allowedNames) {
    if (!e || e.type !== "monster" || e.dead || e.rip) return false;
    const name = normalizeMonsterName(e);
    return allowedNames.has(name);
  }

  function nearestMonster(names) {
    const c = character();
    if (!c) return null;
    const allowed = new Set(
      (Array.isArray(names) ? names : [])
        .map((x) => String(x).toLowerCase())
        .filter(Boolean),
    );
    if (allowed.size === 0) return null;

    let best = null;
    let bestDistance = Infinity;
    for (const e of Object.values(entities())) {
      if (!eligibleMonster(e, allowed)) continue;
      const d = distance(c, e);
      if (d < bestDistance) {
        best = e;
        bestDistance = d;
      }
    }
    return best;
  }

  function rareMonster() {
    if (!config.world.enabled) return null;
    return nearestMonster(config.world.rareMonsters);
  }

  function assistLeaderTarget() {
    const leader = config.coordination.assistLeader;
    if (!leader) return null;
    const row = peers.get(String(leader));
    if (!row || now() - row.receivedAtMs > config.coordination.staleMs) return null;
    if (!row.targetId) return null;
    const target = entityById(row.targetId);
    if (!target || target.dead || target.rip || target.type !== "monster") return null;
    return target;
  }

  function selectTask() {
    const rare = rareMonster();
    if (rare) {
      return Object.freeze({
        id: "world:rare:" + String(rare.id || normalizeMonsterName(rare)),
        type: "RARE_BOSS",
        target: rare,
        score: 1000000,
      });
    }

    const assisted = assistLeaderTarget();
    if (assisted) {
      return Object.freeze({
        id: "group:assist:" + String(assisted.id || normalizeMonsterName(assisted)),
        type: "GROUP_ASSIST",
        target: assisted,
        score: 500000,
      });
    }

    if (config.farm.enabled) {
      const target = nearestMonster(config.farm.monsters);
      if (target) {
        return Object.freeze({
          id: "farm:" + String(target.id || normalizeMonsterName(target)),
          type: "FARM",
          target,
          score: 1000 - Math.min(999, distance(character(), target)),
        });
      }
    }

    return null;
  }

  function targetStillUsable(target) {
    if (!target || target.dead || target.rip || target.type !== "monster") return false;
    const live = entityById(target.id);
    return !!(live && !live.dead && !live.rip);
  }

  function canAttackTarget(target) {
    const fn = publicFunction("can_attack");
    if (fn) {
      try {
        return !!fn(target);
      } catch {
        return false;
      }
    }
    const c = character();
    const range = Number(c?.range ?? 0);
    return range > 0 && distance(c, target) <= range;
  }

  function isSkillReady(skill) {
    const cooldown = publicFunction("is_on_cooldown");
    if (!cooldown) return true;
    try {
      return cooldown(skill) !== true;
    } catch {
      return false;
    }
  }

  function nearbyEligibleCount(center, radius, names) {
    const allowed = new Set(
      (Array.isArray(names) ? names : [])
        .map((x) => String(x).toLowerCase())
        .filter(Boolean),
    );
    let count = 0;
    for (const e of Object.values(entities())) {
      if (!eligibleMonster(e, allowed)) continue;
      if (distance(center, e) <= radius) count += 1;
    }
    return count;
  }

  async function maybeUseConfiguredSkill(target) {
    const c = character();
    if (!c || !target) return false;

    for (const rule of config.farm.skills) {
      if (!rule || typeof rule.name !== "string") continue;
      if (!isSkillReady(rule.name)) continue;

      const minMp = Number(rule.minMp ?? 0);
      if (Number(c.mp ?? 0) < minMp) continue;

      if (rule.aoe === true) {
        if (!config.farm.aoeEnabled) continue;
        if (hpRatio(c) < config.farm.aoeMinHpRatio) continue;
        const radius = Number(rule.radius ?? c.range ?? 120);
        const count = nearbyEligibleCount(c, radius, config.farm.monsters);
        if (count < config.farm.aoeMinTargets) continue;
        if (count > config.farm.aoeMaxTargets) {
          log("AOE_BLOCKED_HARD_CAP", { skill: rule.name, count });
          continue;
        }
      }

      try {
        const args = rule.targeted === false
          ? [rule.name]
          : [rule.name, target];
        await executePublic("USE_SKILL", "use_skill", args);
        return true;
      } catch (error) {
        log("SKILL_FAILED", {
          skill: rule.name,
          error: String(error?.message ?? error),
        });
      }
    }
    return false;
  }

  async function maybeMoveToTarget(target) {
    if (!config.farm.moveToTarget || !target) return false;
    const c = character();
    if (!c || c.moving) return false;

    const range = Math.max(30, Number(c.range ?? 100));
    const stopAt = range * Number(config.farm.stopDistanceRatio || 0.8);
    if (distance(c, target) <= stopAt) return false;
    if (movementPromise) return false;
    if (now() - movementStartedAt < config.movementGapMs) return false;

    const destination = {
      map: target.map || c.map,
      x: Number(target.real_x ?? target.x),
      y: Number(target.real_y ?? target.y),
    };
    if (!Number.isFinite(destination.x) || !Number.isFinite(destination.y)) return false;

    movementStartedAt = now();
    log("MOVEMENT_BEGIN", {
      targetId: target.id ?? null,
      destination,
    });

    try {
      const result = executePublic("SMART_MOVE", "smart_move", [destination]);
      movementPromise = Promise.resolve(result)
        .then(() => {
          log("MOVEMENT_COMPLETE", {
            targetId: target.id ?? null,
          });
        })
        .catch((error) => {
          log("MOVEMENT_FAILED", {
            targetId: target.id ?? null,
            error: String(error?.message ?? error),
          });
        })
        .finally(() => {
          movementPromise = null;
        });
      return true;
    } catch (error) {
      movementPromise = null;
      log("MOVEMENT_FAILED", {
        targetId: target.id ?? null,
        error: String(error?.message ?? error),
      });
      return false;
    }
  }

  async function farmerTick(task) {
    const c = character();
    if (!c || !config.farm.enabled) return;

    if (c.rip || c.dead) {
      currentTargetId = null;
      if (!config.farm.respawn) return;
      if (now() - lastRespawnAt < config.respawnGapMs) return;
      if (!publicFunction("respawn")) return;
      lastRespawnAt = now();
      try {
        await executePublic("RESPAWN", "respawn", []);
      } catch (error) {
        log("RESPAWN_FAILED", { error: String(error?.message ?? error) });
      }
      return;
    }

    if (hpRatio(c) < config.farm.minHpRatio) {
      log("FARM_PAUSED_LOW_HP", { hpRatio: hpRatio(c) });
      return;
    }
    if (mpRatio(c) < config.farm.minMpRatio) {
      log("FARM_LOW_MP", { mpRatio: mpRatio(c) });
    }
    if (queueBusy(c)) return;

    const target = task?.target;
    if (!targetStillUsable(target)) {
      currentTargetId = null;
      return;
    }
    currentTargetId = target.id ?? null;

    if (!canAttackTarget(target)) {
      await maybeMoveToTarget(target);
      return;
    }

    if (!actionGapPassed()) return;

    if (await maybeUseConfiguredSkill(target)) return;

    try {
      await executePublic("ATTACK", "attack", [target]);
    } catch (error) {
      log("ATTACK_FAILED", {
        targetId: target.id ?? null,
        error: String(error?.message ?? error),
      });
    }
  }

  async function lootTick() {
    if (!config.farm.enabled || !config.farm.loot) return;
    if (now() - lastLootAt < config.lootGapMs) return;
    const fn = publicFunction("loot");
    if (!fn) return;
    lastLootAt = now();
    try {
      await executePublic("LOOT", "loot", []);
    } catch (error) {
      log("LOOT_FAILED", { error: String(error?.message ?? error) });
    }
  }

  function inventory() {
    const c = character();
    return Array.isArray(c?.items) ? c.items : [];
  }

  function freeInventorySlots() {
    const c = character();
    const size = Number(c?.isize ?? inventory().length);
    const used = inventory().filter(Boolean).length;
    return Math.max(0, size - used);
  }

  function findInventoryItem(name) {
    const target = String(name || "");
    const items = inventory();
    for (let i = 0; i < items.length; i += 1) {
      if (items[i]?.name === target) return { index: i, item: items[i] };
    }
    return null;
  }

  function nextBankSlot() {
    const c = character();
    const bank = c?.bank;
    if (!bank || typeof bank !== "object" || Array.isArray(bank)) return null;
    for (const pack of Object.keys(bank).sort()) {
      if (!/^items[0-9]+$/.test(pack)) continue;
      const slots = bank[pack];
      if (!Array.isArray(slots)) continue;
      for (let i = 0; i < slots.length; i += 1) {
        if (!slots[i]) return { pack, index: i };
      }
    }
    return null;
  }

  function serviceAllowed(service) {
    if (lastService && lastService !== service
        && now() - lastServiceAt < config.merchant.serviceCooldownMs) {
      log("MERCHANT_PINGPONG_BLOCKED", {
        from: lastService,
        to: service,
        elapsedMs: now() - lastServiceAt,
      });
      return false;
    }
    if (serviceArrivalAt > 0
        && now() - serviceArrivalAt < config.merchant.serviceSettleMs) {
      return false;
    }
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
    if (c.rip || c.dead || c.moving || c.target != null || queueBusy(c)) return;
    if (!actionGapPassed(500)) return;

    for (const rule of config.merchant.exchangeRules) {
      if (!rule?.item) continue;
      const found = findInventoryItem(rule.item);
      const required = Number(rule.quantity ?? 1);
      if (!found || Number(found.item?.q ?? 1) < required) continue;
      if (freeInventorySlots() < config.merchant.minimumFreeSlots) continue;
      if (!serviceAllowed("exchange")) return;

      if (rule.destination && !rule.atService) {
        markService("exchange");
        try {
          movementStartedAt = now();
          await executePublic("SMART_MOVE", "smart_move", [rule.destination]);
          serviceArrivalAt = now();
        } catch (error) {
          log("MERCHANT_SERVICE_MOVE_FAILED", {
            service: "exchange",
            error: String(error?.message ?? error),
          });
        }
        return;
      }

      markService("exchange");
      const intentId = [
        "exchange",
        c.name,
        rule.item,
        found.index,
        Number(found.item?.q ?? 1),
      ].join(":");
      try {
        await executePublic("EXCHANGE", "exchange", [found.index], {
          intentId,
          irreversibleAction: true,
        });
      } catch (error) {
        log("MERCHANT_EXCHANGE_FAILED", {
          item: rule.item,
          index: found.index,
          error: String(error?.message ?? error),
        });
      }
      return;
    }

    for (const rule of config.merchant.bankRules) {
      if (!rule?.item) continue;
      const found = findInventoryItem(rule.item);
      if (!found) continue;
      if (!serviceAllowed("bank")) return;

      const slot = nextBankSlot();
      if (!slot) {
        if (rule.destination && !c.bank) {
          markService("bank");
          try {
            movementStartedAt = now();
            await executePublic("SMART_MOVE", "smart_move", [rule.destination]);
            serviceArrivalAt = now();
          } catch (error) {
            log("MERCHANT_SERVICE_MOVE_FAILED", {
              service: "bank",
              error: String(error?.message ?? error),
            });
          }
        }
        return;
      }

      markService("bank");
      const intentId = [
        "bank-store",
        c.name,
        rule.item,
        found.index,
        slot.pack,
        slot.index,
      ].join(":");
      try {
        await executePublic(
          "BANK_STORE",
          "bank_store",
          [found.index, slot.pack, slot.index],
          { intentId, irreversibleAction: true },
        );
      } catch (error) {
        log("MERCHANT_BANK_STORE_FAILED", {
          item: rule.item,
          index: found.index,
          pack: slot.pack,
          packIndex: slot.index,
          error: String(error?.message ?? error),
        });
      }
      return;
    }

    for (const rule of config.merchant.buyRules) {
      if (!rule?.item) continue;
      const have = inventory()
        .filter((item) => item?.name === rule.item)
        .reduce((sum, item) => sum + Number(item?.q ?? 1), 0);
      const minimum = Number(rule.minimum ?? 0);
      const target = Number(rule.target ?? minimum);
      if (have >= minimum || target <= have) continue;
      if (!serviceAllowed("buy")) return;

      if (rule.destination && !rule.atService) {
        markService("buy");
        try {
          movementStartedAt = now();
          await executePublic("SMART_MOVE", "smart_move", [rule.destination]);
          serviceArrivalAt = now();
        } catch (error) {
          log("MERCHANT_SERVICE_MOVE_FAILED", {
            service: "buy",
            error: String(error?.message ?? error),
          });
        }
        return;
      }

      const quantity = Math.max(1, Math.floor(target - have));
      markService("buy");
      const intentId = ["buy", c.name, rule.item, quantity, now()].join(":");
      try {
        await executePublic("BUY", "buy", [rule.item, quantity], {
          intentId,
          irreversibleAction: true,
        });
      } catch (error) {
        log("MERCHANT_BUY_FAILED", {
          item: rule.item,
          quantity,
          error: String(error?.message ?? error),
        });
      }
      return;
    }
  }

  async function worldTick() {
    if (!config.world.enabled || !config.world.serverHopEnabled) return;
    const c = character();
    if (!c || c.rip || c.dead || c.moving || c.target != null || queueBusy(c)) return;
    if (currentTask) return;
    if (now() - lastServerHopAt < config.world.serverHopCooldownMs) return;

    const region = config.world.serverHopRegion;
    const identifier = config.world.serverHopIdentifier;
    if (!region || !identifier) return;

    const current = currentServer();
    if (current.region === String(region) && current.identifier === String(identifier)) return;

    const intentId = [
      "server-hop",
      c.name,
      current.region,
      current.identifier,
      region,
      identifier,
    ].join(":");

    lastServerHopAt = now();
    try {
      await executePublic("SERVER_HOP", "change_server", [region, identifier], {
        intentId,
        irreversibleAction: true,
      });
    } catch (error) {
      log("WORLD_SERVER_HOP_FAILED", {
        region,
        identifier,
        error: String(error?.message ?? error),
      });
    }
  }

  function prunePeers() {
    const cutoff = now() - Math.max(config.coordination.staleMs * 4, 60000);
    for (const [name, row] of peers.entries()) {
      if (row.receivedAtMs < cutoff) peers.delete(name);
    }
  }

  async function tick() {
    if (!running || inTick) return;
    inTick = true;
    tickSeq += 1;

    try {
      const safety = liveSafety();
      if (!safety.admitted) {
        log("TICK_BLOCKED", { blocker: safety.blocker });
        return;
      }

      prunePeers();
      await coordinationTick();

      const task = selectTask();
      const taskId = task?.id ?? null;
      if (taskId !== currentTask?.id) {
        log("TASK_CHANGED", {
          from: currentTask?.id ?? null,
          to: taskId,
          taskType: task?.type ?? null,
          score: task?.score ?? null,
        });
      }
      currentTask = task;

      const c = character();
      const isMerchant = String(c?.ctype || c?.type || "").toLowerCase() === "merchant";
      if (isMerchant) {
        await merchantTick();
      } else {
        await farmerTick(task);
        await lootTick();
      }

      await worldTick();
    } catch (error) {
      log("TICK_ERROR", {
        error: String(error?.stack || error?.message || error),
      });
    } finally {
      inTick = false;
    }
  }

  function validateConfig(next) {
    if (!Number.isSafeInteger(next.loopMs) || next.loopMs < 100 || next.loopMs > 5000) {
      throw new Error("LIVE_LAB_CONFIG_LOOP_INVALID");
    }
    if (!Array.isArray(next.farm.monsters)) {
      throw new Error("LIVE_LAB_CONFIG_FARM_MONSTERS_INVALID");
    }
    if (!Array.isArray(next.farm.skills)) {
      throw new Error("LIVE_LAB_CONFIG_FARM_SKILLS_INVALID");
    }
    if (!Array.isArray(next.coordination.peers)) {
      throw new Error("LIVE_LAB_CONFIG_PEERS_INVALID");
    }
    if (!Array.isArray(next.merchant.buyRules)
        || !Array.isArray(next.merchant.exchangeRules)
        || !Array.isArray(next.merchant.bankRules)) {
      throw new Error("LIVE_LAB_CONFIG_MERCHANT_RULES_INVALID");
    }
    if (!Array.isArray(next.world.rareMonsters)) {
      throw new Error("LIVE_LAB_CONFIG_WORLD_RARES_INVALID");
    }
    if (!(next.farm.minHpRatio >= 0 && next.farm.minHpRatio <= 1)) {
      throw new Error("LIVE_LAB_CONFIG_MIN_HP_INVALID");
    }
    if (!(next.farm.aoeMinHpRatio >= 0 && next.farm.aoeMinHpRatio <= 1)) {
      throw new Error("LIVE_LAB_CONFIG_AOE_HP_INVALID");
    }
    if (!Number.isSafeInteger(next.farm.aoeMaxTargets)
        || next.farm.aoeMaxTargets < 1
        || next.farm.aoeMaxTargets > 20) {
      throw new Error("LIVE_LAB_CONFIG_AOE_CAP_INVALID");
    }
  }

  function configure(patch) {
    if (running) throw new Error("LIVE_LAB_STOP_BEFORE_CONFIGURE");
    const next = merge(config, patch || {});
    validateConfig(next);
    config = next;
    log("CONFIG_UPDATED", {
      farmEnabled: config.farm.enabled,
      farmMonsters: [...config.farm.monsters],
      merchantEnabled: config.merchant.enabled,
      peers: [...config.coordination.peers],
      worldRareMonsters: [...config.world.rareMonsters],
      serverHopEnabled: config.world.serverHopEnabled,
    });
    return api.status();
  }

  function start(options) {
    if (options?.ack !== START_ACK) {
      throw new Error("LIVE_LAB_START_ACK_REQUIRED:" + START_ACK);
    }
    if (running) return api.status();

    const conflict = alternativeRuntimeActive();
    if (conflict) throw new Error("LIVE_LAB_RUNTIME_CONFLICT:" + conflict);
    if (!character()) throw new Error("LIVE_LAB_CHARACTER_UNAVAILABLE");

    running = true;
    emergencyStop = false;
    stopReason = null;
    installCmHandler();

    log("RUNTIME_STARTED", {
      liveExecutionAllowed: true,
      gameplayAuthority: true,
      normalRuntimeAllowed: true,
      rawWriteAuthority: false,
    });

    timer = setInterval(() => {
      void tick();
    }, config.loopMs);
    void tick();

    return api.status();
  }

  function stop(reason = "MANUAL_STOP") {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    running = false;
    stopReason = String(reason);
    movementPromise = null;
    currentTargetId = null;
    currentTask = null;
    restoreCmHandler();
    log("RUNTIME_STOPPED", { reason: stopReason });
    return api.status();
  }

  function triggerEmergencyStop(reason = "MANUAL_EMERGENCY_STOP") {
    emergencyStop = true;
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    running = false;
    stopReason = String(reason);
    restoreCmHandler();
    log("EMERGENCY_STOP", { reason: stopReason });
    return api.status();
  }

  function peerSnapshot() {
    return Object.freeze(
      [...peers.entries()]
        .map(([name, row]) => Object.freeze({
          name,
          ...row,
          ageMs: now() - row.receivedAtMs,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    );
  }

  const api = Object.freeze({
    profileId: PROFILE_ID,
    version: VERSION,
    sourceMainSha: SOURCE_MAIN_SHA,
    startAck: START_ACK,

    configure,
    start,
    stop,
    emergencyStop: triggerEmergencyStop,
    tickNow: () => tick(),

    status() {
      const safety = liveSafety();
      const c = character();
      return Object.freeze({
        schemaVersion: 1,
        profileId: PROFILE_ID,
        version: VERSION,
        sourceMainSha: SOURCE_MAIN_SHA,
        running,
        stopReason,
        emergencyStop,
        liveExecutionAllowed: running && safety.admitted,
        gameplayAuthority: running && safety.admitted,
        normalRuntimeAllowed: running && safety.admitted,
        rawWriteAuthority: false,
        character: c?.name ?? null,
        ctype: c?.ctype ?? c?.type ?? null,
        server: currentServer(),
        tickSeq,
        currentTask: currentTask
          ? {
              id: currentTask.id,
              type: currentTask.type,
              score: currentTask.score,
              targetId: currentTask.target?.id ?? null,
            }
          : null,
        currentTargetId,
        movementInFlight: !!movementPromise,
        lastService,
        lastServiceAt,
        serviceArrivalAt,
        freeInventorySlots: freeInventorySlots(),
        peers: peerSnapshot(),
        logEntries: logs.length,
        irreversibleIntents: Object.freeze(
          [...irreversible.entries()].map(([intentId, row]) => ({
            intentId,
            ...row,
          })),
        ),
        safety,
      });
    },

    exportLogs({ sinceSeq = 0 } = {}) {
      const rows = logs.filter((entry) => entry.seq > Number(sinceSeq || 0));
      return Object.freeze(rows.map((entry) => Object.freeze({ ...entry })));
    },

    exportBugBundle() {
      const c = character();
      return Object.freeze({
        schemaVersion: 1,
        issueSchema: "V5 Live-Test Bug",
        profileId: PROFILE_ID,
        version: VERSION,
        sourceMainSha: SOURCE_MAIN_SHA,
        observedAtMs: now(),
        character: c?.name ?? null,
        ctype: c?.ctype ?? c?.type ?? null,
        server: currentServer(),
        status: api.status(),
        config: clone(config),
        logs: api.exportLogs(),
      });
    },

    getConfig() {
      return clone(config);
    },

    inspectPorts() {
      const names = [
        "smart_move",
        "move",
        "attack",
        "use_skill",
        "loot",
        "respawn",
        "send_cm",
        "change_server",
        "buy",
        "sell",
        "exchange",
        "upgrade",
        "compound",
        "craft",
        "send_item",
        "send_gold",
        "bank_store",
        "bank_retrieve",
        "bank_swap",
      ];
      const out = {};
      for (const name of names) out[name] = !!publicFunction(name);
      return Object.freeze(out);
    },
  });

  root.V5LiveLab = api;
  log("RUNTIME_INSTALLED", {
    liveExecutionAllowed: false,
    gameplayAuthority: false,
    normalRuntimeAllowed: false,
    rawWriteAuthority: false,
  });
})(typeof globalThis !== "undefined" ? globalThis : window);
