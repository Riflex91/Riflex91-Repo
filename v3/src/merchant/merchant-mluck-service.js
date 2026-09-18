'use strict';

const { MerchantMluckPolicy } = require('./merchant-mluck-policy');

const MERCHANT_MLUCK_SERVICE_MODE = 'merchant-mluck-service-v1';
const SUPERVISOR_ALLOWED = new Set(['HEALTHY', 'WATCH']);

function finite(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function cleanName(value) {
  return String(value == null ? '' : value).trim();
}

function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

class MerchantMluckService {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.adapter = options.adapter || null;
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.getBusy = options.getBusy || (() => false);
    this.getSupervisorStatus = options.getSupervisorStatus || (() => ({ state: 'HEALTHY' }));
    this.policy = options.policy || new MerchantMluckPolicy({ refreshLeadMs: options.refreshLeadMs });
    this.enabled = options.enabled !== false;
    this.attemptCooldownMs = Math.max(250, Math.min(60000, finite(options.attemptCooldownMs, 3000)));
    this.minCycleMs = Math.max(100, Math.min(30000, finite(options.minCycleMs, 750)));
    this.lastCycleAt = -Infinity;
    this.lastDecision = null;
    this.lastCommand = null;
    this.lastTargets = [];
    this.lastDecisionSignature = null;
    this.attempts = new Map();
    this.busy = false;
    this.stats = {
      cycles: 0,
      castsAttempted: 0,
      castsExecuted: 0,
      shadowCasts: 0,
      rejectedCasts: 0,
      cooldownResourceSkips: 0,
      rangeSkips: 0,
      antiSpamSkips: 0,
      busySkips: 0
    };
    this.reasonCounts = {};
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    try { this.log.emit({ component: 'merchant-mluck', event, severity, reason, data }); } catch (_) {}
  }

  _character() {
    return this.root && (this.root.character || (this.root.parent && this.root.parent.character)) || null;
  }

  _entities() {
    return this.root && this.root.parent && this.root.parent.entities || this.root && this.root.entities || {};
  }

  _rawEntityByName(name) {
    const wanted = cleanName(name);
    if (!wanted) return null;
    for (const entity of Object.values(this._entities())) {
      if (!entity || cleanName(entity.name) !== wanted) continue;
      const playerLike = entity.player === true || !!entity.ctype || String(entity.type || '').toLowerCase() === 'character' || !entity.mtype;
      if (playerLike) return entity;
    }
    return null;
  }

  _partyNames(snapshot) {
    const out = [];
    const seen = new Set();
    for (const row of snapshot && Array.isArray(snapshot.party) ? snapshot.party : []) {
      const name = cleanName(row && row.name);
      if (!name || seen.has(name)) continue;
      seen.add(name);
      out.push(name);
    }
    const local = cleanName(snapshot && snapshot.character && snapshot.character.name || this._character() && this._character().name);
    if (local && !seen.has(local)) out.push(local);
    return out;
  }

  _effect(raw) {
    return raw && raw.s && raw.s.mluck && typeof raw.s.mluck === 'object' ? raw.s.mluck : null;
  }

  _attemptState(targetId, now) {
    const previous = finite(this.attempts.get(String(targetId || '')));
    if (previous == null) return { blocked: false, until: null };
    const until = previous + this.attemptCooldownMs;
    return { blocked: until > now, until: until > now ? until : null };
  }

  _pruneAttempts(now) {
    for (const [id, at] of this.attempts.entries()) {
      if (now - at > this.attemptCooldownMs * 4) this.attempts.delete(id);
    }
  }

  _inRange(targetId, self, raw) {
    if (self) return true;
    if (this.adapter && typeof this.adapter.isSkillInRange === 'function') {
      try { return this.adapter.isSkillInRange(targetId, 'mluck') === true; } catch (_) { return false; }
    }
    const c = this._character();
    const game = this.adapter && typeof this.adapter.getGameData === 'function' ? this.adapter.getGameData() || {} : {};
    const skill = game.skills && game.skills.mluck || null;
    const range = finite(skill && skill.range);
    const cx = finite(c && (c.real_x != null ? c.real_x : c.x));
    const cy = finite(c && (c.real_y != null ? c.real_y : c.y));
    const tx = finite(raw && (raw.real_x != null ? raw.real_x : raw.x));
    const ty = finite(raw && (raw.real_y != null ? raw.real_y : raw.y));
    if (range == null || cx == null || cy == null || tx == null || ty == null) return false;
    return Math.hypot(cx - tx, cy - ty) <= range;
  }

  _targets(snapshot, now) {
    const c = this._character();
    const localName = cleanName(snapshot && snapshot.character && snapshot.character.name || c && c.name);
    const localMap = String(snapshot && snapshot.character && snapshot.character.map || c && c.map || '');
    return this._partyNames(snapshot).map((name, topologyIndex) => {
      const self = name === localName;
      const raw = self ? c : this._rawEntityByName(name);
      const id = cleanName(raw && (raw.id || raw.name) || (self ? localName : ''));
      const targetMap = String(raw && raw.map || snapshot && snapshot.party && snapshot.party.find((row) => cleanName(row && row.name) === name)?.map || localMap || '');
      const dead = !!(raw && (raw.dead === true || raw.rip === true));
      const reachable = !!raw && !!id && (!localMap || !targetMap || localMap === targetMap);
      const inRange = reachable && this._inRange(id, self, raw);
      const attempt = this._attemptState(id, now);
      return {
        id,
        name,
        topologyIndex,
        valid: !!id && !!name,
        dead,
        reachable,
        inRange,
        effect: this._effect(raw),
        antiSpamBlocked: attempt.blocked,
        antiSpamUntil: attempt.until
      };
    });
  }

  _countReason(reason) {
    const key = String(reason || 'UNKNOWN');
    this.reasonCounts[key] = (this.reasonCounts[key] || 0) + 1;
  }

  _recordDecision(decision, targets) {
    this.lastDecision = clone(decision);
    this.lastTargets = clone(targets || []);
    this._countReason(decision && decision.reason);
    if (decision && decision.reason === 'MLUCK_TARGET_OUT_OF_RANGE') this.stats.rangeSkips += 1;
    if (decision && decision.reason === 'MLUCK_ANTI_SPAM') this.stats.antiSpamSkips += 1;
    const targetId = decision && decision.target && decision.target.id || '-';
    const signature = `${decision && decision.action || 'HOLD'}:${decision && decision.reason || 'UNKNOWN'}:${targetId}`;
    if (signature !== this.lastDecisionSignature) {
      this.lastDecisionSignature = signature;
      this._event('MLUCK_DECISION', decision && decision.action === 'CAST' ? 'info' : 'debug', decision && decision.reason, {
        action: decision && decision.action || 'HOLD',
        target: decision && decision.target ? { id: decision.target.id, name: decision.target.name, remainingMs: decision.target.remainingMs, buffState: decision.target.buffState } : null
      });
    }
    return decision;
  }

  _hold(reason, extra = {}, targets = []) {
    return this._recordDecision({ action: 'HOLD', reason, ...extra }, targets);
  }

  configure(config = {}) {
    if (config.enabled != null) this.enabled = config.enabled === true;
    const lead = finite(config.refreshLeadMs);
    if (lead != null) this.policy.refreshLeadMs = Math.max(1000, Math.min(60 * 60 * 1000, lead));
    const cooldown = finite(config.attemptCooldownMs);
    if (cooldown != null) this.attemptCooldownMs = Math.max(250, Math.min(60000, cooldown));
    this._event('MLUCK_CONFIG_CHANGED', 'info', this.enabled ? 'ENABLED' : 'DISABLED', {
      enabled: this.enabled,
      refreshLeadMs: this.policy.refreshLeadMs,
      attemptCooldownMs: this.attemptCooldownMs
    });
    return this.status();
  }

  disable(reason = 'OPERATOR_DISABLED') {
    this.enabled = false;
    this._event('MLUCK_DISABLED', 'warn', reason);
    return this.status();
  }

  cycle(snapshot = null) {
    const now = this.now();
    this.stats.cycles += 1;
    if (now - this.lastCycleAt < this.minCycleMs) return this._hold('MLUCK_CYCLE_THROTTLED', {}, this.lastTargets);
    this.lastCycleAt = now;
    this._pruneAttempts(now);

    if (!this.enabled) return this._hold('MLUCK_DISABLED');
    const current = snapshot || (this.adapter && typeof this.adapter.snapshot === 'function' ? this.adapter.snapshot() : null);
    const merchant = current && current.character || this._character() || {};
    if (String(merchant.ctype || merchant.type || '').toLowerCase() !== 'merchant') return this._hold('MERCHANT_REQUIRED');
    if (merchant.rip === true || merchant.dead === true) return this._hold('MERCHANT_DEAD');
    const supervisor = this.getSupervisorStatus() || {};
    if (!SUPERVISOR_ALLOWED.has(String(supervisor.state || ''))) return this._hold('SUPERVISOR_NOT_HEALTHY');
    if (this.getBusy() === true) {
      this.stats.busySkips += 1;
      return this._hold('MERCHANT_CONTROLLED_OPERATION_BUSY');
    }

    const targets = this._targets(current, now);
    const decision = this.policy.decide({ now, merchant, targets });
    if (!decision || decision.action !== 'CAST') return this._recordDecision(decision || { action: 'HOLD', reason: 'NO_MLUCK_DECISION' }, targets);

    const skillPolicy = this.adapter && this.adapter.skillPolicy;
    if (skillPolicy && typeof skillPolicy.peek === 'function' && !skillPolicy.peek('mluck', merchant)) {
      return this._hold('MLUCK_SKILL_POLICY_DISABLED', { target: decision.target }, targets);
    }
    if (!this.adapter || typeof this.adapter.canUseSkill !== 'function') return this._hold('MLUCK_SKILL_CHECK_UNAVAILABLE', { target: decision.target }, targets);
    let canUse = false;
    try { canUse = this.adapter.canUseSkill('mluck') === true; } catch (_) { canUse = false; }
    if (!canUse) {
      this.stats.cooldownResourceSkips += 1;
      return this._hold('MLUCK_COOLDOWN_OR_RESOURCE', { target: decision.target }, targets);
    }
    if (!this.adapter || typeof this.adapter.command !== 'function') return this._hold('MLUCK_COMMAND_BOUNDARY_UNAVAILABLE', { target: decision.target }, targets);

    const targetId = decision.target.id;
    this.attempts.set(String(targetId), now);
    this.stats.castsAttempted += 1;
    this.busy = true;
    let result;
    try {
      result = this.adapter.command('use_skill', ['mluck', targetId]);
    } catch (error) {
      result = { executed: false, reason: 'MLUCK_COMMAND_EXCEPTION', error: String(error && error.message || error) };
    } finally {
      this.busy = false;
    }

    if (result && result.executed === true) this.stats.castsExecuted += 1;
    else if (result && result.shadow === true) this.stats.shadowCasts += 1;
    else this.stats.rejectedCasts += 1;
    this.lastCommand = {
      at: now,
      targetId,
      targetName: decision.target.name,
      reason: decision.reason,
      executed: !!(result && result.executed),
      shadow: !!(result && result.shadow),
      commandReason: result && result.reason || null
    };
    this._event('MLUCK_COMMAND', result && (result.executed || result.shadow) ? 'info' : 'warn', result && result.executed ? 'MLUCK_CAST_EXECUTED' : result && result.shadow ? 'MLUCK_CAST_SHADOW' : result && result.reason || 'MLUCK_CAST_REJECTED', this.lastCommand);
    return this._recordDecision({ ...decision, result: clone(result), command: clone(this.lastCommand) }, targets);
  }

  status() {
    return {
      schemaVersion: 1,
      mode: MERCHANT_MLUCK_SERVICE_MODE,
      enabled: this.enabled,
      busy: this.busy,
      policy: this.policy.status(),
      attemptCooldownMs: this.attemptCooldownMs,
      minCycleMs: this.minCycleMs,
      lastCycleAt: Number.isFinite(this.lastCycleAt) ? this.lastCycleAt : null,
      lastDecision: clone(this.lastDecision),
      lastCommand: clone(this.lastCommand),
      targets: clone(this.lastTargets),
      stats: { ...this.stats },
      reasonCounts: { ...this.reasonCounts }
    };
  }
}

module.exports = { MerchantMluckService, MERCHANT_MLUCK_SERVICE_MODE, SUPERVISOR_ALLOWED };
