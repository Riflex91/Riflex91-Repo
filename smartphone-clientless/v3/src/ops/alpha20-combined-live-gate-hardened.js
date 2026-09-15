'use strict';

const { Alpha20CombinedLiveGate, ALPHA20_LIVE_GATE_ACK, REQUIRED_OBSERVATION_MS } = require('./alpha20-combined-live-gate');

function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function delta(after, before, key) {
  return Math.max(0, finite(after && after[key], 0) - finite(before && before[key], 0));
}

class HardenedAlpha20CombinedLiveGate extends Alpha20CombinedLiveGate {
  constructor(options = {}) {
    super(options);
    this.cancelRequested = false;
    this.cancelReason = null;
    this.cancelRequestedAt = null;
  }

  cancel(reason = 'OPERATOR_CANCELLED') {
    if (!this.running) return { accepted: false, reason: 'ALPHA20_LIVE_GATE_NOT_RUNNING', status: this.status() };
    this.cancelRequested = true;
    this.cancelReason = String(reason || 'OPERATOR_CANCELLED').slice(0, 160);
    this.cancelRequestedAt = this.now();
    this._event('ALPHA20_LIVE_GATE_CANCEL_REQUESTED', 'warn', this.cancelReason, { at: this.cancelRequestedAt });
    this._gameLog(`[AIO v3] Alpha.20 Live Gate Abbruch angefordert: ${this.cancelReason}`);
    return { accepted: true, reason: this.cancelReason, at: this.cancelRequestedAt, status: this.status() };
  }

  async run(config = {}) {
    if (!this.running) {
      this.cancelRequested = false;
      this.cancelReason = null;
      this.cancelRequestedAt = null;
    }
    return super.run(config);
  }

  _safeStateSnapshot() {
    const snapshot = super._safeStateSnapshot();
    const character = this._character();
    return {
      ...snapshot,
      merchantDead: !!(character && (character.rip === true || character.dead === true || finite(character.hp, 1) <= 0)),
      merchantInCombat: this._inCombat(),
      cancelRequested: this.cancelRequested,
      cancelReason: this.cancelReason,
      cancelRequestedAt: this.cancelRequestedAt
    };
  }

  _sampleViolations(snapshot) {
    const violations = super._sampleViolations(snapshot);
    if (snapshot && snapshot.merchantDead) violations.push('MERCHANT_DIED_DURING_OBSERVATION');
    if (snapshot && snapshot.merchantInCombat) violations.push('MERCHANT_ENTERED_COMBAT_DURING_OBSERVATION');
    if (this.cancelRequested) violations.push('OPERATOR_CANCELLED_LIVE_GATE');
    return [...new Set(violations)];
  }

  async _observeWindow() {
    const runtime = this.runtime;
    const startedAt = this.now();
    const beforeLifecycle = runtime.controlledPartyLifecycle.status();
    const beforeAura = runtime.controlledPaladinAura.status();
    const beforeEconomy = this._controlledEconomySnapshot();
    const beforeEconomyStats = {
      spaceRecovery: clone(beforeEconomy.spaceRecovery && beforeEconomy.spaceRecovery.stats || {}),
      consolidation: clone(beforeEconomy.consolidation && beforeEconomy.consolidation.stats || {}),
      merchant: clone(beforeEconomy.merchant && beforeEconomy.merchant.stats || {}),
      expansion: clone(beforeEconomy.expansion && beforeEconomy.expansion.stats || {}),
      travel: clone(beforeEconomy.travel && beforeEconomy.travel.stats || {})
    };
    const samples = [];
    const violations = [];
    let elapsed = 0;
    let cancelled = false;
    this.countdown.start(this.observationMs, 'Alpha.20 Live Gate');
    do {
      if (this.cancelRequested) {
        cancelled = true;
        violations.push({ at: this.now(), reason: 'OPERATOR_CANCELLED_LIVE_GATE', detail: this.cancelReason });
        break;
      }
      this._refreshShadowEvidence();
      const snapshot = this._safeStateSnapshot();
      const sampleViolations = this._sampleViolations(snapshot);
      for (const reason of sampleViolations) violations.push({ at: this.now(), reason });
      samples.push(snapshot);
      this.countdown.tick(this.now());
      if (this.observationMs <= 0 || elapsed >= this.observationMs) break;
      const step = Math.min(this.sampleMs, this.observationMs - elapsed);
      await this.sleep(step);
      elapsed += step;
    } while (elapsed <= this.observationMs);
    if (!cancelled) this.countdown.tick(this.now());

    const finishedAt = this.now();
    const actualElapsedMs = Math.max(0, finishedAt - startedAt);
    const afterLifecycle = runtime.controlledPartyLifecycle.status();
    const afterAura = runtime.controlledPaladinAura.status();
    const afterEconomy = this._controlledEconomySnapshot();
    const unexpectedActionDeltas = {
      partyTransitionAttempts: delta(afterLifecycle.stats, beforeLifecycle.stats, 'attempts'),
      auraAttempts: delta(afterAura.stats, beforeAura.stats, 'attempts'),
      spaceRecoveryAttempts: delta(afterEconomy.spaceRecovery && afterEconomy.spaceRecovery.stats, beforeEconomyStats.spaceRecovery, 'attempts'),
      consolidationAttempts: delta(afterEconomy.consolidation && afterEconomy.consolidation.stats, beforeEconomyStats.consolidation, 'attempts'),
      merchantAttempts: delta(afterEconomy.merchant && afterEconomy.merchant.stats, beforeEconomyStats.merchant, 'attempts'),
      expansionAttempts: delta(afterEconomy.expansion && afterEconomy.expansion.stats, beforeEconomyStats.expansion, 'attempts'),
      travelAttempts: delta(afterEconomy.travel && afterEconomy.travel.stats, beforeEconomyStats.travel, 'attempts')
    };
    for (const [key, value] of Object.entries(unexpectedActionDeltas)) {
      if (value > 0) violations.push({ at: finishedAt, reason: `${key.replace(/Attempts$/, '').toUpperCase()}_ATTEMPT_DURING_PASSIVE_WINDOW` });
    }
    const events = this._eventsSince(startedAt);
    const errorEvents = events.filter((row) => String(row && row.severity || '').toLowerCase() === 'error');
    if (errorEvents.length) violations.push({ at: finishedAt, reason: 'ERROR_EVENT_DURING_PASSIVE_WINDOW' });
    const first = samples[0] || null;
    const last = samples[samples.length - 1] || null;
    const fourCharacterCoverage = samples.length > 0 && samples.every((row) => row && row.party && row.party.valid);
    const lifecycleEvaluationCoverage = !!(last && last.lifecycle && last.lifecycle.evaluations > 0 && last.lifecycle.maxDevelopmentSlots === 1 && last.lifecycle.activeCombat.length === 3);
    return {
      pass: violations.length === 0,
      startedAt,
      finishedAt,
      actualElapsedMs,
      cancelled,
      cancelReason: cancelled ? this.cancelReason : null,
      cancelRequestedAt: cancelled ? this.cancelRequestedAt : null,
      requiredObservationMs: REQUIRED_OBSERVATION_MS,
      configuredObservationMs: this.observationMs,
      confirmationDurationSatisfied: !this.testMode && !cancelled && actualElapsedMs >= REQUIRED_OBSERVATION_MS,
      sampleCount: samples.length,
      fourCharacterCoverage,
      lifecycleEvaluationCoverage,
      firstSample: clone(first),
      lastSample: clone(last),
      violations: clone(violations),
      errorEvents: clone(errorEvents.slice(-50)),
      unexpectedActionDeltas,
      countdown: this.countdown.status(finishedAt)
    };
  }

  status() {
    return {
      ...super.status(),
      abortable: true,
      cancelRequested: this.cancelRequested,
      cancelReason: this.cancelReason,
      cancelRequestedAt: this.cancelRequestedAt
    };
  }
}

module.exports = {
  HardenedAlpha20CombinedLiveGate,
  ALPHA20_LIVE_GATE_ACK,
  REQUIRED_OBSERVATION_MS
};