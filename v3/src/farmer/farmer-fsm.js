'use strict';

const { TaskState, createTask } = require('../core/task');

const FarmerState = Object.freeze({
  ASSESS: 'ASSESS',
  SELECT_TARGET: 'SELECT_TARGET',
  TRAVEL: 'TRAVEL',
  ENGAGE: 'ENGAGE',
  RECOVER: 'RECOVER',
  REASSESS: 'REASSESS',
  BLOCKED: 'BLOCKED'
});

const TargetPolicy = Object.freeze({
  AVOID: 'avoid',
  PARTY_ONLY: 'party-only',
  ALLOW: 'allow'
});

function normalizeTargetPolicy(policy) {
  const resolved = String(policy || TargetPolicy.PARTY_ONLY).toLowerCase();
  if (!Object.values(TargetPolicy).includes(resolved)) {
    throw new Error(`target policy must be one of: ${Object.values(TargetPolicy).join(', ')}`);
  }
  return resolved;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function ratio(value, max) {
  const denominator = Number(max) || 0;
  if (denominator <= 0) return 1;
  return clamp01((Number(value) || 0) / denominator);
}

function distance(a, b) {
  if (!a || !b || a.x == null || a.y == null || b.x == null || b.y == null) return Infinity;
  return Math.hypot(Number(a.x) - Number(b.x), Number(a.y) - Number(b.y));
}

function hasPotion(inventory, prefix) {
  return (inventory || []).some((item) => item && String(item.name || '').startsWith(prefix) && (Number(item.q) || 0) > 0);
}

class FarmerController {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.planner = options.planner || null;
    this.enabled = options.enabled !== false;
    this.targetPolicy = normalizeTargetPolicy(options.targetPolicy || TargetPolicy.PARTY_ONLY);
    this.state = FarmerState.ASSESS;
    this.stateSince = this.now();
    this.stateReason = 'INITIAL';
    this.targetId = null;
    this.targetType = null;
    this.lastActionAt = 0;
    this.lastPotionAt = 0;
    this.lastShadowPlanAt = -Infinity;
    this.shadowPlanRevision = 0;
    this.blockedUntil = 0;
    this.lastSelection = null;
    this.taskId = null;
    this.owner = null;
    this.config = {
      recoverHpRatio: Number(options.recoverHpRatio) || 0.75,
      engageMinHpRatio: Number(options.engageMinHpRatio) || 0.45,
      useHpRatio: Number(options.useHpRatio) || 0.62,
      recoverMpRatio: Number(options.recoverMpRatio) || 0.22,
      useMpRatio: Number(options.useMpRatio) || 0.28,
      potionCooldownMs: Math.max(500, Number(options.potionCooldownMs) || 1800),
      moveCooldownMs: Math.max(250, Number(options.moveCooldownMs) || 900),
      fallbackAttackIntervalMs: Math.max(250, Number(options.attackIntervalMs) || 950),
      shadowPlanIntervalMs: Math.max(1000, Number(options.shadowPlanIntervalMs) || 5000),
      blockedRetryMs: Math.max(1000, Number(options.blockedRetryMs) || 5000),
      engagementRangeFactor: Math.max(0.4, Math.min(0.95, Number(options.engagementRangeFactor) || 0.8))
    };
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log) return;
    this.log.emit({
      component: 'farmer',
      event,
      severity,
      character: this.owner,
      reason,
      data: {
        state: this.state,
        targetId: this.targetId,
        targetType: this.targetType,
        targetPolicy: this.targetPolicy,
        ...data
      }
    });
  }

  _transition(next, reason, data = {}) {
    if (!FarmerState[next] && !Object.values(FarmerState).includes(next)) throw new Error(`unknown farmer state ${next}`);
    const resolved = FarmerState[next] || next;
    if (this.state === resolved && this.stateReason === reason) return;
    const previous = this.state;
    this.state = resolved;
    this.stateSince = this.now();
    this.stateReason = reason || null;
    this._event('FARMER_STATE_CHANGED', 'info', reason || null, { from: previous, to: resolved, ...data });
  }

  _clearTarget(reason = 'TARGET_CLEARED') {
    if (this.targetId || this.targetType) {
      this._event('FARMER_TARGET_CLEARED', 'info', reason, { clearedTargetId: this.targetId, clearedTargetType: this.targetType });
    }
    this.targetId = null;
    this.targetType = null;
  }

  setEnabled(enabled) {
    this.enabled = enabled !== false;
    this._event(this.enabled ? 'FARMER_ENABLED' : 'FARMER_DISABLED', this.enabled ? 'info' : 'warn');
    if (this.enabled) this._transition(FarmerState.REASSESS, 'ENABLED');
    return this.enabled;
  }

  setTargetPolicy(policy) {
    const resolved = normalizeTargetPolicy(policy);
    if (resolved === this.targetPolicy) return this.targetPolicy;
    const previous = this.targetPolicy;
    this.targetPolicy = resolved;
    this.lastShadowPlanAt = -Infinity;
    this._clearTarget('TARGET_POLICY_CHANGED');
    this._transition(FarmerState.REASSESS, 'TARGET_POLICY_CHANGED', { previousTargetPolicy: previous, targetPolicy: resolved });
    this._event('FARMER_TARGET_POLICY_CHANGED', 'info', 'TARGET_POLICY_CHANGED', { previousTargetPolicy: previous, targetPolicy: resolved });
    return this.targetPolicy;
  }

  _attackIntervalMs(snapshot) {
    const frequency = snapshot && snapshot.character && Number(snapshot.character.frequency);
    if (Number.isFinite(frequency) && frequency > 0) return Math.max(250, Math.ceil(1000 / frequency));
    return this.config.fallbackAttackIntervalMs;
  }

  _engagementRange(snapshot) {
    const liveRange = snapshot && snapshot.character && Number(snapshot.character.range);
    const base = Number.isFinite(liveRange) && liveRange > 0 ? liveRange : 100;
    return Math.max(25, base * this.config.engagementRangeFactor);
  }

  _findTarget(snapshot) {
    if (!snapshot || !this.targetId) return null;
    return (snapshot.entities || []).find((entity) => entity && String(entity.id) === String(this.targetId)) || null;
  }

  _friendlyNames(snapshot, party) {
    const names = new Set();
    const selfName = snapshot && snapshot.character && snapshot.character.name;
    if (selfName) names.add(selfName);
    for (const member of party && party.members || []) if (member && member.name) names.add(member.name);
    return names;
  }

  _targetAllowed(entity, snapshot, party) {
    if (!entity || !snapshot || !snapshot.character) return false;
    if (!entity.target) return true;
    if (entity.target === snapshot.character.name) return true;
    if (this.targetPolicy === TargetPolicy.ALLOW) return true;
    if (this.targetPolicy === TargetPolicy.AVOID) return false;
    return this._friendlyNames(snapshot, party).has(entity.target);
  }

  _safeLiveMonsters(snapshot, party) {
    if (!snapshot || !snapshot.character) return [];
    const c = snapshot.character;
    return (snapshot.entities || []).filter((entity) => {
      if (!entity || !entity.mtype || entity.dead || (entity.hp != null && entity.hp <= 0)) return false;
      if (entity.map && c.map && entity.map !== c.map) return false;
      return this._targetAllowed(entity, snapshot, party);
    });
  }

  _candidateRows(context) {
    const snapshot = context.snapshot;
    const party = context.party || { fingerprint: 'solo:unknown' };
    const world = context.world;
    const gameData = context.adapter && context.adapter.getGameData ? context.adapter.getGameData() || {} : {};
    const monsters = this._safeLiveMonsters(snapshot, party);
    const rows = [];
    const byType = new Map();
    for (const entity of monsters) {
      const list = byType.get(entity.mtype) || [];
      list.push(entity);
      byType.set(entity.mtype, list);
    }
    for (const [mtype, entities] of byType.entries()) {
      const learned = world && world.performanceFor ? world.performanceFor(mtype, party.fingerprint) : null;
      const g = gameData.monsters && gameData.monsters[mtype] || {};
      const nearest = entities.slice().sort((a, b) => distance(snapshot.character, a) - distance(snapshot.character, b))[0];
      rows.push({
        id: mtype,
        monster: mtype,
        xpPerHour: learned ? learned.xpPerHour : Math.max(0, Number(g.xp) || 0) * 60,
        goldPerHour: learned ? learned.goldPerHour : 0,
        deathsPerHour: learned ? learned.deathsPerHour : 0,
        confidence: learned ? learned.confidence : 0.05,
        travelSeconds: Number.isFinite(distance(snapshot.character, nearest)) ? distance(snapshot.character, nearest) / Math.max(1, Number(snapshot.character.speed) || 40) : 120,
        source: learned ? 'measured' : 'estimate-live'
      });
    }
    return { rows, monsters };
  }

  _selectTarget(context) {
    const { rows, monsters } = this._candidateRows(context);
    if (!rows.length || !monsters.length) return null;

    const objective = this.materialObjective;
    if (objective && Number(objective.expiresAt || 0) > this.now() && objective.monster) {
      const objectiveTargets = monsters
        .filter((entity) => entity.mtype === objective.monster)
        .sort((a, b) => distance(context.snapshot.character, a) - distance(context.snapshot.character, b));
      if (objectiveTargets.length) {
        const row = rows.find((candidate) => (candidate.monster || candidate.id) === objective.monster) || {};
        return {
          target: objectiveTargets[0],
          ranking: {
            ...row,
            monster: objective.monster,
            score: Number.MAX_SAFE_INTEGER,
            source: 'elixir-material-objective',
            objectiveKind: objective.kind || 'MATERIAL',
            material: objective.material || null,
            elixirName: objective.elixirName || null,
            objectiveExpiresAt: objective.expiresAt
          }
        };
      }
    } else if (objective) {
      this.materialObjective = null;
    }

    const ranked = this.planner && this.planner.rank ? this.planner.rank(rows, {
      character: context.snapshot.character.name,
      partyFingerprint: context.party && context.party.fingerprint || null
    }) : rows;
    if (!ranked.length) return null;
    const type = ranked[0].monster || ranked[0].id;
    const candidates = monsters.filter((entity) => entity.mtype === type)
      .sort((a, b) => distance(context.snapshot.character, a) - distance(context.snapshot.character, b));
    const target = candidates[0];
    if (!target) return null;
    return { target, ranking: ranked[0] };
  }

  _inventory(snapshot) {
    return snapshot && snapshot.character && snapshot.character.inventory || [];
  }

  _needsRecovery(snapshot) {
    const c = snapshot.character;
    const hpRatio = ratio(c.hp, c.max_hp);
    const mpRatio = ratio(c.mp, c.max_mp);
    return {
      hpRatio,
      mpRatio,
      hpLow: hpRatio < this.config.recoverHpRatio,
      hpUnsafe: hpRatio < this.config.engageMinHpRatio,
      mpLow: mpRatio < this.config.recoverMpRatio,
      hasHpPotion: hasPotion(this._inventory(snapshot), 'hpot'),
      hasMpPotion: hasPotion(this._inventory(snapshot), 'mpot')
    };
  }

  _maybePotion(context, recovery) {
    const now = this.now();
    if (now - this.lastPotionAt < this.config.potionCooldownMs) return false;
    const c = context.snapshot.character;
    if (recovery.hasHpPotion && recovery.hpRatio < this.config.useHpRatio) {
      const result = context.adapter.command('use_hp');
      if (result.executed) {
        this.lastPotionAt = now;
        this._event('FARMER_POTION_USED', 'info', 'HP_LOW', { kind: 'hp', hp: c.hp, maxHp: c.max_hp });
        return true;
      }
    }
    if (recovery.hasMpPotion && recovery.mpRatio < this.config.useMpRatio) {
      const result = context.adapter.command('use_mp');
      if (result.executed) {
        this.lastPotionAt = now;
        this._event('FARMER_POTION_USED', 'info', 'MP_LOW', { kind: 'mp', mp: c.mp, maxMp: c.max_mp });
        return true;
      }
    }
    return false;
  }

  _block(reason) {
    this.blockedUntil = this.now() + this.config.blockedRetryMs;
    this._transition(FarmerState.BLOCKED, reason);
  }

  _shadowStep(context) {
    const now = this.now();
    if (now - this.lastShadowPlanAt < this.config.shadowPlanIntervalMs) return { state: TaskState.RUNNING };
    this.lastShadowPlanAt = now;
    this.shadowPlanRevision += 1;
    const snapshot = context.snapshot;
    if (!snapshot || !snapshot.character) return { state: TaskState.WAITING };
    const recovery = this._needsRecovery(snapshot);
    const selection = this._selectTarget(context);
    this.lastSelection = selection && selection.ranking || null;
    this.targetId = selection && selection.target.id || null;
    this.targetType = selection && selection.target.mtype || null;
    this.state = recovery.hpLow ? FarmerState.RECOVER : (selection ? FarmerState.SELECT_TARGET : FarmerState.REASSESS);
    this.stateSince = now;
    this.stateReason = recovery.hpLow ? 'SHADOW_RECOVERY_PREVIEW' : (selection ? 'SHADOW_TARGET_PREVIEW' : 'SHADOW_NO_TARGET');
    this._event('FARMER_SHADOW_PLAN', 'info', this.stateReason, {
      hpRatio: Number(recovery.hpRatio.toFixed(3)),
      mpRatio: Number(recovery.mpRatio.toFixed(3)),
      selected: selection ? selection.target.mtype : null,
      score: selection && selection.ranking ? Number(selection.ranking.score.toFixed(5)) : null,
      revision: this.shadowPlanRevision
    });
    return { state: TaskState.RUNNING };
  }

  _moveToMaterialObjective(context) {
    const objective = this.materialObjective;
    const snapshot = context && context.snapshot;
    const c = snapshot && snapshot.character;
    if (!objective || !c || Number(objective.expiresAt || 0) <= this.now()) return false;
    if (!objective.map || String(objective.map) !== String(c.map || '')) return false;
    const visible = (snapshot.entities || []).some((entity) => entity && !entity.dead && entity.mtype === objective.monster);
    if (visible) return false;
    const ox = Number(objective.x), oy = Number(objective.y);
    if (!Number.isFinite(ox) || !Number.isFinite(oy) || !Number.isFinite(Number(c.x)) || !Number.isFinite(Number(c.y))) return false;
    const d = Math.hypot(ox - Number(c.x), oy - Number(c.y));
    if (d <= 120) {
      this.lastSelection = {
        monster: objective.monster,
        source: 'elixir-material-objective-same-map',
        score: Number.MAX_SAFE_INTEGER,
        travelSeconds: 0,
        material: objective.material || null,
        elixirName: objective.elixirName || null
      };
      const fallbackVisible = this._safeLiveMonsters(snapshot, context.party)
        .some((entity) => entity && entity.mtype !== objective.monster);
      if (fallbackVisible) {
        this._event('FARMER_MATERIAL_OBJECTIVE_IDLE_FALLBACK', 'info', 'OBJECTIVE_SPAWN_EMPTY_USE_SAFE_LOCAL_TARGET', {
          monster: objective.monster,
          material: objective.material || null,
          distance: Math.round(d)
        });
        // Keep the material objective latched, but let normal target selection
        // use a safe visible monster until the requested spawn appears. This
        // prevents a leader from pinning every follower in direction HOLD.
        return false;
      }
      this._transition(FarmerState.SELECT_TARGET, 'MATERIAL_OBJECTIVE_SPAWN_WAIT', { monster: objective.monster, distance: Math.round(d) });
      return true;
    }
    const now = this.now();
    if (now - this.lastActionAt < this.config.moveCooldownMs) return true;
    const result = context.adapter.command('move', [ox, oy]);
    this.lastActionAt = now;
    if (!result.executed && !result.shadow) {
      this._block(result.reason === 'COMMAND_UNAVAILABLE' ? 'MATERIAL_OBJECTIVE_MOVE_UNAVAILABLE' : 'MATERIAL_OBJECTIVE_MOVE_FAILED');
      return true;
    }
    this.lastSelection = {
      monster: objective.monster,
      source: 'elixir-material-objective-same-map',
      score: Number.MAX_SAFE_INTEGER,
      travelSeconds: d / Math.max(1, Number(c.speed) || 40),
      material: objective.material || null,
      elixirName: objective.elixirName || null
    };
    this._event('FARMER_MATERIAL_OBJECTIVE_MOVE_REQUESTED', 'info', 'SAME_MAP_ELIXIR_MATERIAL_OBJECTIVE', {
      monster: objective.monster,
      material: objective.material || null,
      elixirName: objective.elixirName || null,
      x: Math.round(ox),
      y: Math.round(oy),
      distance: Math.round(d)
    });
    return true;
  }

  _travel(context, target) {
    const snapshot = context.snapshot;
    const c = snapshot.character;
    if (!target || target.dead || (target.hp != null && target.hp <= 0)) {
      this._clearTarget('TARGET_GONE');
      this._transition(FarmerState.REASSESS, 'TARGET_GONE');
      return;
    }
    if (!this._targetAllowed(target, snapshot, context.party)) {
      this._clearTarget('TARGET_POLICY_REJECTED');
      this._transition(FarmerState.REASSESS, 'TARGET_POLICY_REJECTED');
      return;
    }
    const engageRange = this._engagementRange(snapshot);
    const d = distance(c, target);
    if (d <= engageRange) {
      this._transition(FarmerState.ENGAGE, 'IN_RANGE', { distance: Math.round(d), engageRange: Math.round(engageRange) });
      return;
    }
    if (!Number.isFinite(d) || target.x == null || target.y == null || c.x == null || c.y == null) {
      this._block('TARGET_POSITION_UNKNOWN');
      return;
    }
    const now = this.now();
    if (now - this.lastActionAt < this.config.moveCooldownMs) return;
    const dx = Number(target.x) - Number(c.x);
    const dy = Number(target.y) - Number(c.y);
    const len = Math.max(1, Math.hypot(dx, dy));
    const desired = Math.max(20, engageRange * 0.9);
    const travel = Math.max(0, len - desired);
    const x = Number(c.x) + (dx / len) * travel;
    const y = Number(c.y) + (dy / len) * travel;
    const result = context.adapter.command('move', [x, y]);
    this.lastActionAt = now;
    if (!result.executed && !result.shadow) {
      this._block(result.reason === 'COMMAND_UNAVAILABLE' ? 'MOVE_COMMAND_UNAVAILABLE' : 'MOVE_COMMAND_FAILED');
      return;
    }
    this._event('FARMER_MOVE_REQUESTED', 'info', 'TARGET_OUT_OF_RANGE', { x: Math.round(x), y: Math.round(y), distance: Math.round(d), engageRange: Math.round(engageRange) });
  }

  _engage(context, target) {
    const snapshot = context.snapshot;
    const recovery = this._needsRecovery(snapshot);
    this._maybePotion(context, recovery);
    if (snapshot.character.rip) {
      this._block('CHARACTER_DEAD');
      return;
    }
    if (recovery.hpUnsafe && !recovery.hasHpPotion) {
      this._block('LOW_HP_NO_POTION');
      return;
    }
    if (!target || target.dead || (target.hp != null && target.hp <= 0)) {
      this._clearTarget('TARGET_DEAD_OR_GONE');
      this._transition(FarmerState.REASSESS, 'TARGET_DEAD_OR_GONE');
      return;
    }
    if (!this._targetAllowed(target, snapshot, context.party)) {
      this._clearTarget('TARGET_POLICY_REJECTED');
      this._transition(FarmerState.REASSESS, 'TARGET_POLICY_REJECTED');
      return;
    }
    const d = distance(snapshot.character, target);
    const engageRange = this._engagementRange(snapshot);
    if (d > engageRange * 1.15) {
      this._transition(FarmerState.TRAVEL, 'TARGET_MOVED_OUT_OF_RANGE', { distance: Math.round(d), engageRange: Math.round(engageRange) });
      return;
    }
    const now = this.now();
    if (now - this.lastActionAt < this._attackIntervalMs(snapshot)) return;
    if (context.adapter.canAttack && !context.adapter.canAttack(target.id)) return;
    const result = context.adapter.command('attack', [target.id]);
    this.lastActionAt = now;
    if (!result.executed && !result.shadow) {
      this._block(result.reason === 'COMMAND_UNAVAILABLE' ? 'ATTACK_COMMAND_UNAVAILABLE' : 'ATTACK_COMMAND_FAILED');
      return;
    }
    this._event('FARMER_ATTACK_REQUESTED', 'info', 'TARGET_IN_RANGE', { targetHp: target.hp, distance: Math.round(d) });
  }

  _activeStep(context) {
    const snapshot = context.snapshot;
    if (!snapshot || !snapshot.character) return { state: TaskState.WAITING };
    const c = snapshot.character;
    const recovery = this._needsRecovery(snapshot);
    const target = this._findTarget(snapshot);

    if (c.rip && this.state !== FarmerState.BLOCKED) this._block('CHARACTER_DEAD');

    switch (this.state) {
      case FarmerState.ASSESS:
        if (recovery.hpUnsafe && !recovery.hasHpPotion) this._block('LOW_HP_NO_POTION');
        else if (recovery.hpLow || (recovery.mpLow && recovery.hasMpPotion)) this._transition(FarmerState.RECOVER, recovery.hpLow ? 'HP_BELOW_RECOVERY_THRESHOLD' : 'MP_BELOW_RECOVERY_THRESHOLD');
        else this._transition(FarmerState.SELECT_TARGET, 'READY_TO_SELECT');
        break;

      case FarmerState.SELECT_TARGET: {
        if (this._moveToMaterialObjective(context)) break;
        const selection = this._selectTarget(context);
        this.lastSelection = selection && selection.ranking || null;
        if (!selection) {
          this._clearTarget('NO_SAFE_LIVE_TARGET');
          this._transition(FarmerState.REASSESS, 'NO_SAFE_LIVE_TARGET');
          break;
        }
        this.targetId = String(selection.target.id);
        this.targetType = selection.target.mtype;
        this._event('FARMER_TARGET_SELECTED', 'info', 'PLANNER_TOP_SAFE_LIVE_TARGET', {
          score: Number(selection.ranking.score.toFixed(5)),
          source: selection.ranking.source,
          travelSeconds: Number(selection.ranking.travelSeconds.toFixed(2))
        });
        const d = distance(c, selection.target);
        this._transition(d <= this._engagementRange(snapshot) ? FarmerState.ENGAGE : FarmerState.TRAVEL, d <= this._engagementRange(snapshot) ? 'TARGET_IN_RANGE' : 'TARGET_OUT_OF_RANGE');
        break;
      }

      case FarmerState.TRAVEL:
        if (recovery.hpUnsafe) this._transition(FarmerState.RECOVER, 'HP_UNSAFE_DURING_TRAVEL');
        else this._travel(context, target);
        break;

      case FarmerState.ENGAGE:
        this._engage(context, target);
        break;

      case FarmerState.RECOVER:
        this._maybePotion(context, recovery);
        if (recovery.hpUnsafe && !recovery.hasHpPotion) this._block('LOW_HP_NO_POTION');
        else if (recovery.hpRatio >= this.config.recoverHpRatio && (!recovery.mpLow || !recovery.hasMpPotion)) this._transition(FarmerState.REASSESS, 'RECOVERY_COMPLETE');
        break;

      case FarmerState.REASSESS:
        this._transition(FarmerState.ASSESS, 'REASSESS');
        break;

      case FarmerState.BLOCKED:
        if (c.rip) break;
        if (this.now() >= this.blockedUntil) this._transition(FarmerState.REASSESS, 'BLOCK_RETRY');
        break;

      default:
        this._block('UNKNOWN_STATE');
        break;
    }
    return { state: TaskState.RUNNING };
  }

  step(context) {
    if (!this.enabled) return { state: TaskState.SUCCEEDED, reason: 'FARMER_DISABLED' };
    this.owner = context && context.snapshot && context.snapshot.character && context.snapshot.character.name || this.owner || 'local';
    if (!context || !context.adapter) return { state: TaskState.WAITING };
    if (context.adapter.mode !== 'active') return this._shadowStep(context);
    return this._activeStep(context);
  }

  progress(context) {
    const snapshot = context && context.snapshot;
    const c = snapshot && snapshot.character || {};
    const target = this._findTarget(snapshot);
    const x = Number.isFinite(Number(c.x)) ? Math.round(Number(c.x) / 10) : 'x';
    const y = Number.isFinite(Number(c.y)) ? Math.round(Number(c.y) / 10) : 'y';
    const hp = target && Number.isFinite(Number(target.hp)) ? Math.round(Number(target.hp)) : 'na';
    const selfHp = Number.isFinite(Number(c.hp)) ? Math.round(Number(c.hp)) : 'na';
    return `${this.state}|${this.targetId || '-'}|${x}:${y}|thp:${hp}|hp:${selfHp}|shadow:${this.shadowPlanRevision}`;
  }

  createTask(owner) {
    this.owner = owner || this.owner || 'local';
    const task = createTask({
      key: `farmer:${this.owner}`,
      type: 'FARMER_FSM',
      owner: this.owner,
      priority: 20,
      interruptible: true,
      maxRetries: 2,
      stallMs: 20000,
      timeoutMs: Infinity,
      progress: (context) => this.progress(context),
      step: (context) => this.step(context)
    });
    this.taskId = task.id;
    return task;
  }

  ensureScheduled(scheduler, owner) {
    if (!this.enabled || !scheduler || !owner) return null;
    const key = `farmer:${owner}`;
    const active = [...scheduler.activeByOwner.values()].find((task) => task.key === key);
    const queued = scheduler.queue.find((task) => task.key === key);
    if (active || queued) {
      const existing = active || queued;
      this.taskId = existing.id;
      return existing;
    }
    const task = this.createTask(owner);
    scheduler.submit(task);
    this._event('FARMER_TASK_ENSURED', 'info', 'SCHEDULER_OWNER_READY', { taskId: task.id });
    return task;
  }

  status() {
    return {
      enabled: this.enabled,
      state: this.state,
      reason: this.stateReason,
      stateSince: this.stateSince,
      owner: this.owner,
      taskId: this.taskId,
      targetId: this.targetId,
      targetType: this.targetType,
      targetPolicy: this.targetPolicy,
      shadowPlanRevision: this.shadowPlanRevision,
      lastSelection: this.lastSelection ? {
        id: this.lastSelection.id,
        score: this.lastSelection.score,
        source: this.lastSelection.source,
        confidence: this.lastSelection.confidence,
        travelSeconds: this.lastSelection.travelSeconds
      } : null
    };
  }
}

module.exports = { FarmerController, FarmerState, TargetPolicy, normalizeTargetPolicy, ratio, distance, hasPotion };
