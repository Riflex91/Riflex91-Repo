'use strict';

const VALIDATOR_MODE = 'v3-live-recovery-validator-v1';
const DEFAULT_MINIMUM_VERSION = '3.0.0-alpha.20.56';
const DEFAULT_EXPECTED_FARMERS = 3;
const DEFAULT_EXPECTED_MERCHANTS = 1;

function numericVersionParts(value) {
  const parts = String(value || '').match(/\d+/g);
  return parts ? parts.map(Number) : [];
}

function compareNumericVersions(left, right) {
  const a = numericVersionParts(left);
  const b = numericVersionParts(right);
  const width = Math.max(a.length, b.length);
  for (let i = 0; i < width; i += 1) {
    const delta = (a[i] || 0) - (b[i] || 0);
    if (delta !== 0) return delta < 0 ? -1 : 1;
  }
  return 0;
}

function eventsOf(session) {
  return session && session.eventLog && Array.isArray(session.eventLog.events)
    ? session.eventLog.events
    : [];
}

function eventTime(event) {
  const parsed = Date.parse(String(event && event.ts || ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function findEvents(session, eventName, predicate = null) {
  return eventsOf(session).filter((event) => {
    if (!event || String(event.event || '') !== String(eventName)) return false;
    return !predicate || predicate(event);
  });
}

function hasReason(session, reason) {
  return eventsOf(session).some((event) => String(event && event.reason || '') === String(reason));
}

function characterOf(session) {
  return session && session.summary && session.summary.character
    || session && session.status && session.status.character
    || null;
}

function sessionVersion(session) {
  return String(session && (session.version || session.summary && session.summary.version || session.status && session.status.version) || '');
}

function isMerchant(character) {
  return String(character && (character.ctype || character.type) || '').toLowerCase() === 'merchant';
}

function check(id, ok, details = null) {
  return { id, ok: !!ok, details };
}

function ordered(events, names) {
  let cursor = -1;
  const indexes = [];
  for (const name of names) {
    const index = events.findIndex((event, idx) => idx > cursor && event && event.event === name);
    if (index < 0) return { ok: false, indexes };
    indexes.push(index);
    cursor = index;
  }
  return { ok: true, indexes };
}

function regroupEvidence(sessions) {
  const published = [];
  const splitFollowers = new Set();
  let crossMapRequired = false;

  for (const session of sessions) {
    for (const event of eventsOf(session)) {
      if (event && (event.event === 'TEAM_CROSS_MAP_REGROUP_REQUIRED' || event.reason === 'CROSS_MAP_REGROUP_REQUIRED')) {
        crossMapRequired = true;
      }
      if (!event || event.event !== 'ALPHA28_TEAM_REGROUP_OBJECTIVE_PUBLISHED') continue;
      const objective = event.data && event.data.objective || {};
      const memberMaps = event.data && Array.isArray(event.data.memberMaps) ? event.data.memberMaps : [];
      const destinationMap = String(objective.map || '');
      const leaderName = String(objective.leaderName || '');
      published.push({
        leaderName,
        destinationMap,
        objectiveId: objective.id || null,
        at: eventTime(event)
      });
      for (const row of memberMaps) {
        if (!row || !row.name || !row.map || !destinationMap) continue;
        if (String(row.name) !== leaderName && String(row.map) !== destinationMap) splitFollowers.add(String(row.name));
      }
    }
  }

  return {
    exercised: crossMapRequired || published.length > 0 || splitFollowers.size > 0,
    crossMapRequired,
    published,
    splitFollowers
  };
}

function latestRegroupCompletionTime(sessions, requiredFollowers) {
  let latest = null;
  for (const session of sessions) {
    const character = characterOf(session);
    if (!character || !requiredFollowers.has(String(character.name || ''))) continue;
    for (const event of findEvents(session, 'ALPHA28_TEAM_REGROUP_COMPLETED')) {
      const at = eventTime(event);
      if (at != null && (latest == null || at > latest)) latest = at;
    }
  }
  return latest;
}

function validateBaseSession(session, options) {
  const character = characterOf(session);
  const version = sessionVersion(session);
  const completeRetainedLog = !!(session && session.eventLog && session.eventLog.completeRetainedLog === true);
  const checks = [
    check('schema-kind', session && session.kind === 'aio-v3-session-log', session && session.kind || null),
    check('character-present', !!(character && character.name && (character.ctype || character.type)), character && character.name || null),
    check('minimum-version', compareNumericVersions(version, options.minimumVersion) >= 0, { version, minimumVersion: options.minimumVersion }),
    check('complete-retained-log', completeRetainedLog, completeRetainedLog)
  ];
  if (session && session.summary && session.summary.version && session.version) {
    checks.push(check('version-consistent', String(session.summary.version) === String(session.version), {
      topLevel: session.version,
      summary: session.summary.version
    }));
  }
  return { character, version, checks };
}

function validateFarmer(session, context) {
  const base = validateBaseSession(session, context.options);
  const name = base.character && String(base.character.name || '');
  const events = eventsOf(session);
  const checks = base.checks.slice();
  const noProgressSafe = hasReason(session, 'NO_PROGRESS_SAFE_MODE')
    || events.some((event) => event && event.event === 'SUPERVISOR_STATE_CHANGED' && event.reason === 'NO_PROGRESS_SAFE_MODE');
  checks.push(check('no-progress-safe-mode-absent', !noProgressSafe, noProgressSafe ? 'NO_PROGRESS_SAFE_MODE observed' : null));

  const requiredRegroup = context.regroup.splitFollowers.has(name)
    || (context.regroup.splitFollowers.size === 0
      && events.some((event) => event && (event.event === 'TEAM_CROSS_MAP_REGROUP_REQUIRED' || event.reason === 'CROSS_MAP_REGROUP_REQUIRED')));

  if (requiredRegroup) {
    const sequence = ordered(events, [
      'ALPHA28_CROSS_MAP_OBJECTIVE_RECEIVED',
      'ALPHA28_TEAM_REGROUP_STARTED',
      'ALPHA28_TEAM_REGROUP_COMPLETED'
    ]);
    checks.push(check('regroup-received-started-completed', sequence.ok, {
      required: true,
      indexes: sequence.indexes
    }));
  } else if (context.regroup.exercised) {
    const publishedBySelf = context.regroup.published.some((row) => row.leaderName === name);
    checks.push(check('regroup-leader-published-or-follower-not-split', publishedBySelf || !context.regroup.splitFollowers.has(name), {
      publishedBySelf,
      requiredFollower: context.regroup.splitFollowers.has(name)
    }));
  }

  const selected = findEvents(session, 'FARMER_TARGET_SELECTED');
  const attacks = findEvents(session, 'FARMER_ATTACK_REQUESTED');
  const afterAt = context.combatAfterAt;
  const attacksAfterRecovery = afterAt == null
    ? attacks
    : attacks.filter((event) => {
      const at = eventTime(event);
      return at != null && at >= afterAt;
    });
  const selectedAfterRecovery = afterAt == null
    ? selected
    : selected.filter((event) => {
      const at = eventTime(event);
      return at != null && at >= afterAt;
    });

  checks.push(check('target-selected-after-recovery', selectedAfterRecovery.length > 0, {
    total: selected.length,
    afterRecovery: selectedAfterRecovery.length,
    afterAt
  }));
  checks.push(check('attack-requested-after-recovery', attacksAfterRecovery.length > 0, {
    total: attacks.length,
    afterRecovery: attacksAfterRecovery.length,
    afterAt
  }));

  return {
    name,
    ctype: base.character && (base.character.ctype || base.character.type) || null,
    role: 'farmer',
    version: base.version,
    passed: checks.every((row) => row.ok),
    checks
  };
}

function validateMerchant(session, context) {
  const base = validateBaseSession(session, context.options);
  const checks = base.checks.slice();
  const events = eventsOf(session);
  const demand = events.filter((event) =>
    event && (event.reason === 'MERCHANT_ADAPTIVE_POTION_RESTOCK_REQUIRED'
      || event.event === 'MERCHANT_ADAPTIVE_POTION_RESTOCK_REQUIRED'));
  const arrivals = findEvents(session, 'LIVE_POTION_VENDOR_ARRIVAL_ATTESTED');
  const commits = findEvents(session, 'LIVE_POTION_RESTOCK_COMMITTED');
  const failures = findEvents(session, 'LIVE_POTION_RESTOCK_FAILED_SAFE');

  checks.push(check('adaptive-restock-demand-observed', demand.length > 0, { count: demand.length }));
  checks.push(check('verified-vendor-arrival-observed', arrivals.length > 0, { count: arrivals.length }));
  checks.push(check('potion-restock-commit-observed', commits.length > 0, { count: commits.length }));
  checks.push(check('potion-restock-failed-safe-absent', failures.length === 0, { count: failures.length }));

  const paired = arrivals.map((arrival) => {
    const arrivalIndex = events.indexOf(arrival);
    const itemName = arrival.data && arrival.data.itemName || null;
    const commitIndex = events.findIndex((event, index) => index > arrivalIndex
      && event && event.event === 'LIVE_POTION_RESTOCK_COMMITTED'
      && (!itemName || !event.data || !event.data.itemName || String(event.data.itemName) === String(itemName)));
    return { itemName, arrivalIndex, commitIndex, ok: commitIndex > arrivalIndex };
  });
  checks.push(check('vendor-arrival-continues-to-buy', paired.length > 0 && paired.every((row) => row.ok), paired));

  return {
    name: base.character && String(base.character.name || ''),
    ctype: base.character && (base.character.ctype || base.character.type) || null,
    role: 'merchant',
    version: base.version,
    passed: checks.every((row) => row.ok),
    checks
  };
}

function validateLiveSessionSet(sessions, options = {}) {
  const normalized = {
    minimumVersion: options.minimumVersion || DEFAULT_MINIMUM_VERSION,
    expectedFarmers: Number.isInteger(options.expectedFarmers) ? options.expectedFarmers : DEFAULT_EXPECTED_FARMERS,
    expectedMerchants: Number.isInteger(options.expectedMerchants) ? options.expectedMerchants : DEFAULT_EXPECTED_MERCHANTS
  };
  const input = Array.isArray(sessions) ? sessions.filter(Boolean) : [];
  const farmers = [];
  const merchants = [];

  for (const session of input) {
    const character = characterOf(session);
    if (isMerchant(character)) merchants.push(session);
    else farmers.push(session);
  }

  const regroup = regroupEvidence(farmers);
  const combatAfterAt = regroup.exercised ? latestRegroupCompletionTime(farmers, regroup.splitFollowers) : null;
  const sessionResults = [];
  const groupChecks = [
    check('expected-farmer-count', farmers.length === normalized.expectedFarmers, { actual: farmers.length, expected: normalized.expectedFarmers }),
    check('expected-merchant-count', merchants.length === normalized.expectedMerchants, { actual: merchants.length, expected: normalized.expectedMerchants }),
    check('cross-map-regroup-scenario-exercised', regroup.exercised, {
      published: regroup.published.length,
      splitFollowers: [...regroup.splitFollowers]
    }),
    check('split-followers-observed', regroup.splitFollowers.size > 0, [...regroup.splitFollowers]),
    check('regroup-completion-time-observed', combatAfterAt != null, combatAfterAt)
  ];

  for (const session of farmers) {
    sessionResults.push(validateFarmer(session, { options: normalized, regroup, combatAfterAt }));
  }
  for (const session of merchants) {
    sessionResults.push(validateMerchant(session, { options: normalized }));
  }

  const failures = [];
  for (const row of groupChecks) if (!row.ok) failures.push({ scope: 'group', ...row });
  for (const session of sessionResults) {
    for (const row of session.checks) {
      if (!row.ok) failures.push({ scope: session.name || session.role, ...row });
    }
  }

  return {
    schemaVersion: 1,
    mode: VALIDATOR_MODE,
    minimumVersion: normalized.minimumVersion,
    passed: failures.length === 0,
    group: {
      farmers: farmers.length,
      merchants: merchants.length,
      regroupScenarioExercised: regroup.exercised,
      regroupPublished: regroup.published,
      splitFollowers: [...regroup.splitFollowers],
      combatAfterAt,
      checks: groupChecks
    },
    sessions: sessionResults,
    failures
  };
}

module.exports = {
  VALIDATOR_MODE,
  DEFAULT_MINIMUM_VERSION,
  compareNumericVersions,
  validateLiveSessionSet
};
