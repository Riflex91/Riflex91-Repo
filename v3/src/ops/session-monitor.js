'use strict';

const MONITOR_SCHEMA_VERSION = 1;

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}
function safeCall(fn, fallback = null) {
  try { return typeof fn === 'function' ? fn() : fallback; } catch (_) { return fallback; }
}
function sessionId(now) {
  return `session-${Number(now()).toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

class SessionMonitor {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.runtime = options.runtime;
    this.operations = options.operations || null;
    this.log = options.log || (this.runtime && this.runtime.log) || null;
    this.now = options.now || (() => Date.now());
    this.version = options.version || null;
    const retainedCapacity = this.log && Number(this.log.capacity);
    this.maxEvents = Math.max(100, Math.min(20000, Math.floor(finite(options.maxEvents, Number.isFinite(retainedCapacity) ? retainedCapacity : 4000))));
    this.maxInventory = Math.max(50, Math.min(1000, Math.floor(finite(options.maxInventory, 400))));
    this.maxTransactions = Math.max(20, Math.min(500, Math.floor(finite(options.maxTransactions, 200))));
    this.maxTravel = Math.max(20, Math.min(300, Math.floor(finite(options.maxTravel, 100))));
    this.maxGoals = Math.max(20, Math.min(300, Math.floor(finite(options.maxGoals, 100))));
    this.id = sessionId(this.now);
    this.startedAt = this.now();
    this.copyStats = { attempts: 0, success: 0, failures: 0, lastMethod: null, lastAt: null };
  }

  _status() {
    const base = safeCall(() => this.runtime.status(), {}) || {};
    if (!this.operations || typeof this.operations.status !== 'function') return base;
    return { ...base, operations: safeCall(() => this.operations.status(), null) };
  }

  _character(status) {
    const c = status && status.character || this.root && this.root.character || {};
    return {
      name: c.name || null,
      ctype: c.ctype || c.type || null,
      level: finite(c.level, 0),
      map: c.map || null,
      x: finite(c.x != null ? c.x : c.real_x, 0),
      y: finite(c.y != null ? c.y : c.real_y, 0),
      hp: finite(c.hp, 0),
      maxHp: finite(c.max_hp, 0),
      mp: finite(c.mp, 0),
      maxMp: finite(c.max_mp, 0),
      xp: finite(c.xp, 0),
      gold: finite(c.gold, 0),
      rip: c.rip === true
    };
  }

  summary() {
    const status = this._status();
    const inventory = status.inventory || {};
    const inventorySummary = inventory.summary || {};
    const economy = status.economy || {};
    const transactions = economy.transactions || {};
    const travel = status.travel || {};
    const supervisor = status.supervisor || {};
    const party = status.party || {};
    const gear = status.gearProgression || {};
    const events = this.log && typeof this.log.list === 'function' ? this.log.list(50) : [];
    const errorEvents = events.filter((row) => row && (row.severity === 'error' || row.severity === 'fatal')).length;
    const warningEvents = events.filter((row) => row && row.severity === 'warn').length;
    return {
      schemaVersion: MONITOR_SCHEMA_VERSION,
      sessionId: this.id,
      startedAt: this.startedAt,
      generatedAt: this.now(),
      version: status.version || this.version,
      running: status.running === true,
      mode: status.mode || null,
      character: this._character(status),
      supervisor: {
        state: supervisor.state || null,
        reasons: Array.isArray(supervisor.reasons) ? supervisor.reasons.slice(0, 16) : [],
        controlledSubsystems: clone(supervisor.controlledSubsystems || null)
      },
      party: {
        mode: party.mode || null,
        actionAuthority: party.actionAuthority === true,
        transitionState: party.transition && party.transition.state || null,
        transitionLive: !!(party.transition && party.transition.liveEnabled)
      },
      economy: {
        live: !!economy.liveEnabled,
        controlled: clone(economy.controlled || null),
        activeTransactions: finite(transactions.active, 0),
        recoveringTransactions: finite(transactions.recovering, 0),
        transactionStates: clone(transactions.states || {}),
        transactionCircuits: clone(transactions.circuits || {})
      },
      travel: {
        active: finite(travel.active, 0),
        states: clone(travel.states || {}),
        circuit: clone(travel.circuit || null),
        controlled: clone(travel.controlled || null)
      },
      inventory: {
        totalEntries: finite(inventorySummary.entries, finite(inventory.stats && inventory.stats.items, 0)),
        capacity: finite(inventory.capacity, 0),
        dispositionCounts: clone(inventorySummary.dispositions || {}),
        pressure: clone(inventorySummary.selfInventory || null),
        stale: inventory.stale === true
      },
      gear: {
        goals: finite(gear.goals, finite(gear.stats && gear.stats.goals, 0)),
        lastEvaluation: clone(gear.lastEvaluation || null)
      },
      recentSignals: { errors: errorEvents, warnings: warningEvents, retainedSample: events.length },
      copy: clone(this.copyStats)
    };
  }

  bundle() {
    const status = this._status();
    const runtime = this.runtime || {};
    const eventLog = this.log && typeof this.log.list === 'function' ? this.log.list(this.maxEvents) : [];
    const eventSummary = this.log && typeof this.log.summary === 'function' ? this.log.summary() : null;
    const inventoryEntries = runtime.inventoryLedger && typeof runtime.inventoryLedger.list === 'function' ? runtime.inventoryLedger.list(this.maxInventory) : [];
    const gearGoals = runtime.gearProgression && typeof runtime.gearProgression.list === 'function' ? runtime.gearProgression.list(this.maxGoals) : [];
    const transactions = runtime.transactionEngine && typeof runtime.transactionEngine.list === 'function' ? runtime.transactionEngine.list(this.maxTransactions) : [];
    const travelPlans = runtime.safeTravel && typeof runtime.safeTravel.list === 'function' ? runtime.safeTravel.list(this.maxTravel) : [];
    const performance = runtime.performance && typeof runtime.performance.status === 'function' ? safeCall(() => runtime.performance.status(), null) : null;
    const registry = runtime.characterRegistry && typeof runtime.characterRegistry.status === 'function' ? safeCall(() => runtime.characterRegistry.status(), null) : null;
    return {
      schemaVersion: MONITOR_SCHEMA_VERSION,
      kind: 'aio-v3-session-log',
      sessionId: this.id,
      startedAt: this.startedAt,
      generatedAt: this.now(),
      durationMs: Math.max(0, this.now() - this.startedAt),
      version: status.version || this.version,
      summary: this.summary(),
      status: clone(status),
      performance: clone(performance),
      characterRegistry: clone(registry),
      inventory: { status: clone(status.inventory || null), entries: clone(inventoryEntries) },
      gearProgression: { status: clone(status.gearProgression || null), goals: clone(gearGoals) },
      economy: { status: clone(status.economy || null), transactions: clone(transactions) },
      travel: { status: clone(status.travel || null), plans: clone(travelPlans) },
      eventLog: {
        summary: clone(eventSummary),
        retained: eventLog.length,
        maxExported: this.maxEvents,
        completeRetainedLog: !eventSummary || eventSummary.retained <= eventLog.length,
        events: clone(eventLog)
      }
    };
  }

  exportSession() {
    return JSON.stringify(this.bundle(), null, 2);
  }

  _document() {
    try {
      if (this.root && this.root.document) return this.root.document;
      if (this.root && this.root.parent && this.root.parent.document) return this.root.parent.document;
    } catch (_) {}
    return null;
  }

  _navigator() {
    try {
      if (this.root && this.root.navigator) return this.root.navigator;
      if (this.root && this.root.parent && this.root.parent.navigator) return this.root.parent.navigator;
    } catch (_) {}
    return null;
  }

  async copyToClipboard() {
    this.copyStats.attempts += 1;
    this.copyStats.lastAt = this.now();
    const text = this.exportSession();
    const nav = this._navigator();
    if (nav && nav.clipboard && typeof nav.clipboard.writeText === 'function') {
      try {
        await nav.clipboard.writeText(text);
        this.copyStats.success += 1;
        this.copyStats.lastMethod = 'navigator.clipboard';
        return { copied: true, method: 'navigator.clipboard', bytes: text.length };
      } catch (_) {}
    }

    const doc = this._document();
    if (doc && typeof doc.createElement === 'function') {
      let area = null;
      try {
        area = doc.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', 'readonly');
        area.style.position = 'fixed';
        area.style.opacity = '0';
        area.style.left = '-9999px';
        const body = doc.body || doc.documentElement;
        if (body && typeof body.appendChild === 'function') body.appendChild(area);
        if (typeof area.focus === 'function') area.focus();
        if (typeof area.select === 'function') area.select();
        if (typeof area.setSelectionRange === 'function') area.setSelectionRange(0, area.value.length);
        const ok = typeof doc.execCommand === 'function' && doc.execCommand('copy') === true;
        if (area.parentNode) area.parentNode.removeChild(area);
        if (ok) {
          this.copyStats.success += 1;
          this.copyStats.lastMethod = 'execCommand';
          return { copied: true, method: 'execCommand', bytes: text.length };
        }
      } catch (_) {
        try { if (area && area.parentNode) area.parentNode.removeChild(area); } catch (_) {}
      }
    }

    this.copyStats.failures += 1;
    this.copyStats.lastMethod = 'manual';
    return { copied: false, method: 'manual', bytes: text.length, text };
  }

  status() {
    return {
      schemaVersion: MONITOR_SCHEMA_VERSION,
      mode: 'read-only-monitor',
      actionAuthority: false,
      directGameplayActionAccess: false,
      sessionId: this.id,
      startedAt: this.startedAt,
      maxEvents: this.maxEvents,
      copy: clone(this.copyStats)
    };
  }
}

module.exports = { SessionMonitor, MONITOR_SCHEMA_VERSION };
