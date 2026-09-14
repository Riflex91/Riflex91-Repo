'use strict';

const base = require('./controlled-lifecycle-coordinator-base');
const { PartyLifecycleState } = require('./lifecycle-store');

const SUPPORTED_COMBAT_CLASSES = new Set(['warrior', 'paladin', 'priest', 'ranger', 'rogue', 'mage']);

function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }
function finite(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function uniqueNames(values) { return [...new Set((values || []).map((value) => typeof value === 'string' ? value : value && value.name).filter(Boolean).map(String))]; }
function validPartySize(names) { return names.length >= 2 && names.length <= 4; }

class ControlledPartyLifecycleCoordinator extends base.ControlledPartyLifecycleCoordinator {
  _sanitizeDevelopmentSession(value) {
    if (!value || typeof value !== 'object') return null;
    const originalNames = uniqueNames(value.originalNames);
    const trainingNames = uniqueNames(value.trainingNames);
    if (!value.candidate || !value.incumbent || !validPartySize(originalNames) || trainingNames.length !== originalNames.length) return null;
    return {
      schemaVersion: 1,
      candidate: String(value.candidate),
      incumbent: String(value.incumbent),
      originalNames,
      trainingNames,
      startedAt: Math.max(0, finite(value.startedAt)),
      expiresAt: Math.max(0, finite(value.expiresAt)),
      baselineCurrentScore: value.baselineCurrentScore == null ? null : finite(value.baselineCurrentScore),
      baselineProjectedScore: value.baselineProjectedScore == null ? null : finite(value.baselineProjectedScore),
      baselineProjectedProgress: value.baselineProjectedProgress == null ? null : finite(value.baselineProjectedProgress),
      baselineXpPerHour: Math.max(0, finite(value.baselineXpPerHour)),
      driftDetectedAt: value.driftDetectedAt == null ? null : Math.max(0, finite(value.driftDetectedAt)),
      lastObservedAt: value.lastObservedAt == null ? null : Math.max(0, finite(value.lastObservedAt))
    };
  }

  _startDevelopmentSession(plan, at = this.now()) {
    const originalNames = uniqueNames(plan && plan.evidence && plan.evidence.context && plan.evidence.context.currentNames);
    const trainingNames = uniqueNames(plan && plan.targetNames);
    if (!plan || plan.kind !== 'DEVELOPMENT_ROTATION' || !validPartySize(originalNames) || trainingNames.length !== originalNames.length) return null;
    const outgoing = plan.evidence && plan.evidence.outgoing || {};
    this.developmentSession = this._sanitizeDevelopmentSession({
      candidate: plan.incoming,
      incumbent: plan.outgoing,
      originalNames,
      trainingNames,
      startedAt: at,
      expiresAt: at + this.maxDevelopmentRotationMs,
      baselineCurrentScore: outgoing.currentScore,
      baselineProjectedScore: outgoing.projectedScore,
      baselineProjectedProgress: outgoing.projectedProgress,
      baselineXpPerHour: outgoing.xpPerHour,
      lastObservedAt: at
    });
    if (this.developmentSession) {
      this._event('DEVELOPMENT_SESSION_STARTED', clone(this.developmentSession));
      this.save();
    }
    return clone(this.developmentSession);
  }

  _planDevelopmentSession(currentMembers = [], registryStatus = {}, context = {}) {
    const session = this.developmentSession;
    if (!session) return null;
    const currentNames = uniqueNames(currentMembers);
    const now = this.now();

    if (this._sameNames(currentNames, session.originalNames)) {
      this._clearDevelopmentSession('ORIGINAL_PARTY_OBSERVED');
      return { planned: false, reason: 'DEVELOPMENT_SESSION_RETURN_OBSERVED' };
    }
    if (!this._sameNames(currentNames, session.trainingNames)) {
      if (session.driftDetectedAt == null) {
        session.driftDetectedAt = now;
        session.lastObservedAt = now;
        this.stats.developmentSessionDrifts += 1;
        this._recordFailure('DEVELOPMENT_SESSION_PARTY_DRIFT');
        this._event('DEVELOPMENT_SESSION_PARTY_DRIFT', { session: clone(session), currentNames }, 'error', 'NO_BLIND_TRANSITION');
        this.save();
      }
      return { planned: false, reason: 'DEVELOPMENT_SESSION_PARTY_DRIFT', currentNames, expectedTrainingNames: session.trainingNames.slice(), expectedOriginalNames: session.originalNames.slice() };
    }

    session.lastObservedAt = now;
    session.driftDetectedAt = null;
    const life = this.lifecycle && this.lifecycle.status ? this.lifecycle.status() : { characters: [] };
    const candidate = (life.characters || []).find((row) => row.name === session.candidate) || null;
    if (candidate && candidate.state === PartyLifecycleState.PROMOTION_CANDIDATE && candidate.active === true) {
      this.stats.developmentPromotions += 1;
      this.stats.promotions += 1;
      this._clearDevelopmentSession('MEASURED_PROMOTION_CONFIRMED');
      this._event('DEVELOPMENT_PROMOTION_COMMITTED', { candidate: candidate.name, currentScore: candidate.currentScore, promotionStreak: candidate.promotionStreak });
      return { planned: false, reason: 'DEVELOPMENT_PROMOTION_COMMITTED_NO_RAW_TRANSITION', promoted: true, candidate: candidate.name };
    }

    if (now < session.expiresAt) {
      this.save();
      return { planned: false, reason: 'DEVELOPMENT_WINDOW_ACTIVE', candidate: session.candidate, expiresAt: session.expiresAt, remainingMs: session.expiresAt - now };
    }
    if (!this.allowDevelopmentRotation) return { planned: false, reason: 'DEVELOPMENT_RETURN_NOT_AUTHORIZED', candidate: session.candidate };

    const byName = new Map((registryStatus.characters || []).map((row) => [row.name, row]));
    const merchants = currentMembers.filter((row) => row && row.ctype === 'merchant');
    if (merchants.length !== 1) return { planned: false, reason: 'EXACTLY_ONE_MERCHANT_REQUIRED' };
    const merchant = merchants[0];
    const members = session.originalNames.map((name) => byName.get(name) || currentMembers.find((row) => row && row.name === name)).filter(Boolean);
    if (members.length !== session.originalNames.length || new Set(members.map((row) => row.name)).size !== session.originalNames.length) return { planned: false, reason: 'DEVELOPMENT_RETURN_STATE_INCOMPLETE' };
    const incumbent = byName.get(session.incumbent) || members.find((row) => row.name === session.incumbent);
    if (!incumbent || incumbent.dead === true || incumbent.available === false) return { planned: false, reason: 'DEVELOPMENT_RETURN_INCUMBENT_UNAVAILABLE' };

    return {
      planned: true,
      kind: 'DEVELOPMENT_RETURN',
      destructive: false,
      incoming: session.incumbent,
      outgoing: session.candidate,
      targetNames: session.originalNames.slice(),
      members,
      merchant,
      evidence: { session: clone(session), context: clone(context) }
    };
  }

  _selectPlan(currentMembers = [], registryStatus = {}, context = {}) {
    const life = this.lifecycle && this.lifecycle.status ? this.lifecycle.status() : { characters: [], thresholds: {} };
    const rows = life.characters || [];
    const current = currentMembers.filter(Boolean);
    if (!validPartySize(uniqueNames(current)) || uniqueNames(current).length !== current.length) return { planned: false, reason: 'CURRENT_PARTY_SIZE_OR_DUPLICATE_INVALID' };
    const merchants = current.filter((row) => row.ctype === 'merchant');
    const activeCombat = current.filter((row) => row.ctype !== 'merchant');
    if (merchants.length !== 1 || activeCombat.length < 1 || activeCombat.length > 3) return { planned: false, reason: 'CURRENT_PARTY_REQUIRES_ONE_MERCHANT_AND_ONE_TO_THREE_COMBAT' };
    if (activeCombat.some((row) => !SUPPORTED_COMBAT_CLASSES.has(String(row.ctype || '').toLowerCase()))) return { planned: false, reason: 'CURRENT_PARTY_UNSUPPORTED_COMBAT_CLASS' };
    const merchant = merchants[0];
    const byName = new Map((registryStatus.characters || []).map((row) => [row.name, row]));
    const lifecycleByName = new Map(rows.map((row) => [row.name, row]));
    const promotion = rows.filter((row) => row.state === PartyLifecycleState.PROMOTION_CANDIDATE && !row.active).sort((a, b) => (b.currentScore || 0) - (a.currentScore || 0))[0] || null;
    const development = rows.filter((row) => row.state === PartyLifecycleState.DEVELOPMENT && !row.active).sort((a, b) => (b.projectedScore || 0) - (a.projectedScore || 0))[0] || null;
    let incoming = promotion;
    let kind = 'PROMOTION';
    if (!incoming && this.allowDevelopmentRotation) { incoming = development; kind = 'DEVELOPMENT_ROTATION'; }
    if (!incoming) return { planned: false, reason: 'NO_ELIGIBLE_LIFECYCLE_CHANGE' };
    if (kind === 'DEVELOPMENT_ROTATION' && !this.allowDevelopmentRotation) return { planned: false, reason: 'DEVELOPMENT_ROTATION_NOT_AUTHORIZED' };
    if (kind === 'PROMOTION' && !this.allowTransitions) return { planned: false, reason: 'TRANSITIONS_NOT_AUTHORIZED' };
    const incomingRegistry = byName.get(incoming.name);
    if (!incomingRegistry || incomingRegistry.dead === true || incomingRegistry.available === false) return { planned: false, reason: 'INCOMING_NOT_AVAILABLE' };
    if (!SUPPORTED_COMBAT_CLASSES.has(String(incomingRegistry.ctype || '').toLowerCase())) return { planned: false, reason: 'INCOMING_UNSUPPORTED_COMBAT_CLASS' };

    const outgoing = activeCombat
      .map((member) => ({ member, lifecycle: lifecycleByName.get(member.name) || null }))
      .sort((a, b) => {
        const as = a.lifecycle && a.lifecycle.currentScore;
        const bs = b.lifecycle && b.lifecycle.currentScore;
        if (as == null && bs != null) return -1;
        if (as != null && bs == null) return 1;
        return finite(as, 0) - finite(bs, 0) || finite(a.member.level, 0) - finite(b.member.level, 0);
      })[0];
    if (!outgoing) return { planned: false, reason: 'NO_OUTGOING_MEMBER' };
    if (kind === 'PROMOTION') {
      if (incoming.currentScore == null || !outgoing.lifecycle || outgoing.lifecycle.currentScore == null || incoming.currentScore <= outgoing.lifecycle.currentScore) return { planned: false, reason: 'CURRENT_SUPERIORITY_NOT_PROVEN' };
    }
    const minTrainingXpRatio = life.thresholds && Number(life.thresholds.minTrainingExpectedXpRatio);
    if (kind === 'DEVELOPMENT_ROTATION' && (incoming.expectedTrainingXpRatio == null || !Number.isFinite(minTrainingXpRatio) || incoming.expectedTrainingXpRatio < minTrainingXpRatio)) return { planned: false, reason: 'TRAINING_XP_RATIO_GATE' };

    const targetNames = [merchant.name, ...activeCombat.filter((row) => row.name !== outgoing.member.name).map((row) => row.name), incoming.name];
    if (new Set(targetNames).size !== current.length || targetNames.length !== current.length) return { planned: false, reason: 'TARGET_PARTY_DUPLICATE_OR_SIZE_DRIFT' };
    const targetMembers = targetNames.map((name) => byName.get(name) || current.find((row) => row.name === name)).filter(Boolean);
    if (targetMembers.length !== current.length) return { planned: false, reason: 'TARGET_MEMBER_STATE_INCOMPLETE' };
    return {
      planned: true,
      kind,
      destructive: false,
      incoming: incoming.name,
      outgoing: outgoing.member.name,
      targetNames,
      members: targetMembers,
      merchant,
      evidence: { incoming: clone(incoming), outgoing: clone(outgoing.lifecycle), context: clone(context) }
    };
  }

  reconcile(currentNames = []) {
    if (!this.operation || this.operation.state !== base.PartyLifecycleOperationState.RECOVERING) return { reconciled: false, reason: 'NO_RECOVERING_OPERATION' };
    const current = uniqueNames(currentNames);
    const target = uniqueNames(this.operation.plan && this.operation.plan.targetNames);
    const old = uniqueNames(this.operation.plan && this.operation.plan.evidence && this.operation.plan.evidence.context && this.operation.plan.evidence.context.currentNames);
    const topologyValid = validPartySize(target) && old.length === target.length;

    if (topologyValid && this._sameNames(current, target)) {
      this.operation.state = base.PartyLifecycleOperationState.COMMITTED;
      this.operation.reason = 'RESTART_TARGET_STATE_OBSERVED';
      this.operation.updatedAt = this.now();
      this.lastTransitionAt = this.now();
      this.stats.committed += 1;
      if (this.operation.plan.kind === 'DEVELOPMENT_ROTATION' && !this.developmentSession) {
        this.stats.developmentRotations += 1;
        this._startDevelopmentSession(this.operation.plan, this.operation.updatedAt);
      }
      if (this.operation.plan.kind === 'DEVELOPMENT_RETURN') {
        this.stats.developmentReturns += 1;
        this._clearDevelopmentSession('RESTART_RETURN_TARGET_OBSERVED');
      }
      if (this.operation.plan.kind === 'PROMOTION') this.stats.promotions += 1;
    } else if (topologyValid && this._sameNames(current, old)) {
      this.operation.state = base.PartyLifecycleOperationState.ABORTED;
      this.operation.reason = 'RESTART_ORIGINAL_STATE_OBSERVED';
      this.operation.updatedAt = this.now();
      this.stats.aborted += 1;
    } else {
      this.operation.state = base.PartyLifecycleOperationState.FAILED_SAFE;
      this.operation.reason = 'RESTART_PARTY_STATE_AMBIGUOUS_NO_BLIND_RETRY';
      this.operation.updatedAt = this.now();
      this.stats.failedSafe += 1;
      this._recordFailure(this.operation.reason);
    }
    this.lastResult = clone(this.operation);
    this.save();
    return { reconciled: true, operation: clone(this.operation), developmentSession: clone(this.developmentSession) };
  }
}

module.exports = {
  ControlledPartyLifecycleCoordinator,
  CONTROLLED_PARTY_LIFECYCLE_MODE: base.CONTROLLED_PARTY_LIFECYCLE_MODE,
  CONTROLLED_PARTY_LIFECYCLE_ACK: base.CONTROLLED_PARTY_LIFECYCLE_ACK,
  PartyLifecycleOperationState: base.PartyLifecycleOperationState
};
