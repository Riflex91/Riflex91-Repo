'use strict';

const { TeamCombatCohesionHotfix } = require('./team-combat-cohesion-hotfix');
const {
  Alpha28CrossMapFarmerProgression,
  SHARED_OBJECTIVE,
  TEAM_REGROUP_KIND
} = require('./alpha28-cross-map-farmer');

const TEAM_PATCH = Symbol.for('AIO_V3_ALPHA20_57_REGROUP_MOVEMENT_OWNER_TEAM_PATCH');
const CROSS_MAP_PATCH = Symbol.for('AIO_V3_ALPHA20_57_REGROUP_MOVEMENT_OWNER_CROSS_MAP_PATCH');
const HOLD_REASON = 'ALPHA28_REGROUP_MOVEMENT_AUTHORITY_ACTIVE';

function normalizeFailureReason(value, fallback = 'SMART_MOVE_FAILED', depth = 0) {
  if (depth > 4 || value == null) return fallback;
  if (value instanceof Error && value.message) return String(value.message).slice(0, 512);
  if (typeof value === 'string') return value.trim() || fallback;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    const code = typeof value.code === 'string' ? value.code.trim() : '';
    const message = typeof value.message === 'string' ? value.message.trim() : '';
    const nestedReason = value.reason != null && value.reason !== value
      ? normalizeFailureReason(value.reason, '', depth + 1)
      : '';
    const nestedError = value.error != null && value.error !== value
      ? normalizeFailureReason(value.error, '', depth + 1)
      : '';
    const detail = message || nestedReason || nestedError;
    if (code && detail) return `${code}: ${detail}`.slice(0, 512);
    if (detail) return detail.slice(0, 512);
    if (code) return code.slice(0, 512);
    try {
      const serialized = JSON.stringify(value);
      if (serialized && serialized !== '{}') return serialized.slice(0, 512);
    } catch (_) {}
  }
  const text = String(value || '').trim();
  return !text || text === '[object Object]' ? fallback : text.slice(0, 512);
}

function failureDetails(value) {
  if (value == null) return { type: 'null' };
  if (value instanceof Error) {
    return {
      type: 'error',
      name: String(value.name || 'Error').slice(0, 80),
      message: String(value.message || '').slice(0, 512),
      code: value.code == null ? null : String(value.code).slice(0, 120)
    };
  }
  if (typeof value !== 'object') {
    return { type: typeof value, value: String(value).slice(0, 512) };
  }
  const details = { type: 'object' };
  for (const key of ['name', 'code', 'message', 'reason', 'error', 'status']) {
    if (value[key] == null) continue;
    details[key] = typeof value[key] === 'object'
      ? normalizeFailureReason(value[key], '', 1)
      : String(value[key]).slice(0, 512);
  }
  try {
    const serialized = JSON.stringify(value);
    if (serialized && serialized !== '{}') details.serialized = serialized.slice(0, 768);
  } catch (_) {}
  return details;
}

function activeRegroupOwnership(runtime, team) {
  const alpha28 = runtime && runtime.alpha28LiveAuthorityLiveness;
  const crossMap = alpha28 && alpha28.crossMap;
  if (!crossMap || crossMap.busy !== true || !crossMap.activePlanId || !crossMap.activeObjectiveId) return null;

  const candidates = [];
  if (crossMap.receivedObjective) candidates.push(crossMap.receivedObjective);
  try {
    const shared = crossMap.parent && crossMap.parent[SHARED_OBJECTIVE];
    if (shared) candidates.push(shared);
  } catch (_) {}

  const objective = candidates.find((row) => row
    && String(row.id || '') === String(crossMap.activeObjectiveId || '')
    && String(row.kind || '') === TEAM_REGROUP_KIND);
  if (!objective) return null;
  if (team && team.leaderName && objective.leaderName
    && String(team.leaderName) !== String(objective.leaderName)) return null;

  return { crossMap, objective };
}

function patchTeamMovementOwnership() {
  const proto = TeamCombatCohesionHotfix && TeamCombatCohesionHotfix.prototype;
  if (!proto || typeof proto._followLeader !== 'function') return false;
  if (proto[TEAM_PATCH]) return true;

  const baseFollowLeader = proto._followLeader;
  proto._followLeader = function alpha2057RegroupMovementOwnerFollowLeader(context, team, reason) {
    const ownership = activeRegroupOwnership(this.runtime, team);
    if (!ownership) {
      this.__alpha2057RegroupMovementHoldKey = null;
      return baseFollowLeader.call(this, context, team, reason);
    }

    const { crossMap, objective } = ownership;
    const at = typeof this.now === 'function' ? this.now() : Date.now();
    this.lastDecision = {
      at,
      action: 'FORMATION_HOLD',
      reason: HOLD_REASON,
      requestedReason: reason || null,
      leaderName: team && team.leaderName || objective.leaderName || null,
      planId: crossMap.activePlanId,
      objectiveId: objective.id,
      movementOwner: 'alpha28-controlled-farmer-travel'
    };

    const holdKey = `${objective.id}:${crossMap.activePlanId}`;
    if (this.__alpha2057RegroupMovementHoldKey !== holdKey) {
      this.__alpha2057RegroupMovementHoldKey = holdKey;
      if (typeof this._event === 'function') {
        this._event('TEAM_FORMATION_MOVE_SUPPRESSED', 'info', HOLD_REASON, { ...this.lastDecision });
      }
    }
    return true;
  };
  proto[TEAM_PATCH] = true;
  return true;
}

function patchCrossMapSmartMoveFailureTelemetry() {
  const proto = Alpha28CrossMapFarmerProgression && Alpha28CrossMapFarmerProgression.prototype;
  if (!proto || typeof proto._execute !== 'function') return false;
  if (proto[CROSS_MAP_PATCH]) return true;

  const baseExecute = proto._execute;
  proto._execute = async function alpha2057NormalizedCrossMapExecute(objective, snapshot) {
    const root = this.root || {};
    const property = typeof root.smart_move === 'function'
      ? 'smart_move'
      : (typeof root.smartMove === 'function' ? 'smartMove' : null);
    if (!property) return baseExecute.call(this, objective, snapshot);

    const original = root[property];
    const owner = this;
    const emitFailure = (source, value, fallback) => {
      const reason = normalizeFailureReason(value, fallback);
      if (typeof owner.event === 'function') {
        owner.event('ALPHA28_SMART_MOVE_REJECTED', 'error', reason, {
          source,
          planId: owner.activePlanId || null,
          objectiveId: objective && objective.id || null,
          objectiveKind: objective && objective.kind || null,
          failure: failureDetails(value)
        });
      }
      return reason;
    };

    const wrapped = function alpha2057NormalizedSmartMove(...args) {
      let result;
      try {
        result = original.apply(this, args);
      } catch (error) {
        const reason = emitFailure('throw', error, 'SMART_MOVE_THROWN');
        throw new Error(reason);
      }
      return Promise.resolve(result).then((response) => {
        if (response && response.failed === true) {
          const reason = emitFailure('resolved-failure', response.reason, 'SMART_MOVE_FAILED');
          return { ...response, reason };
        }
        return response;
      }, (error) => {
        const reason = emitFailure('rejection', error, 'SMART_MOVE_REJECTED');
        throw new Error(reason);
      });
    };

    root[property] = wrapped;
    try {
      return await baseExecute.call(this, objective, snapshot);
    } finally {
      if (root[property] === wrapped) root[property] = original;
    }
  };
  proto[CROSS_MAP_PATCH] = true;
  return true;
}

function installAlpha2057RegroupMovementOwnership() {
  const teamPatched = patchTeamMovementOwnership();
  const crossMapPatched = patchCrossMapSmartMoveFailureTelemetry();
  return teamPatched && crossMapPatched;
}

module.exports = {
  HOLD_REASON,
  normalizeFailureReason,
  failureDetails,
  activeRegroupOwnership,
  installAlpha2057RegroupMovementOwnership
};
