'use strict';
const fs = require('fs');
const vm = require('vm');
const assert = require('node:assert/strict');

const code = fs.readFileSync(require('path').resolve(__dirname, '../dist/aio-v3.js'), 'utf8');
const sandbox = {
  AIO_V3_AUTOSTART: false,
  console,
  setInterval,
  clearInterval,
  Date,
  Math,
  parent: { entities: {}, party: {} },
  character: { name: 'Smoke', ctype: 'ranger', level: 1, map: 'main', real_x: 0, real_y: 0, hp: 100, max_hp: 100, mp: 100, max_mp: 100, xp: 0, gold: 0, items: [], speed: 40 },
  G: { monsters: {}, maps: { main: {} }, skills: {} }
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(code, sandbox);
assert.ok(sandbox.AIO_V3);
assert.equal(sandbox.AIO_V3.version, '3.0.0-alpha.9.10');
assert.equal(sandbox.AIO_V3.status().version, '3.0.0-alpha.9.10');
assert.equal(sandbox.AIO_V3.status().mode, 'shadow');
assert.ok(sandbox.AIO_V3.status().combatRisk);
assert.equal(typeof sandbox.AIO_V3.status().combatRisk.threshold, 'number');
assert.ok(sandbox.AIO_V3.status().combatRisk.contentSafety);
assert.equal(sandbox.AIO_V3.status().combatRisk.contentSafety.enabled, true);
assert.equal(sandbox.AIO_V3.status().combatRisk.contentSafety.unknownDefault, 'QUARANTINED');
assert.ok(sandbox.AIO_V3.status().combatEmergency);
assert.equal(typeof sandbox.AIO_V3.status().combatEmergency.criticalHpRatio, 'number');
assert.equal(typeof sandbox.AIO_V3.status().combatEmergency.multiAggroHpRatio, 'number');
assert.equal(typeof sandbox.AIO_V3.status().combatEmergency.pendingRetreat, 'boolean');
assert.ok(sandbox.AIO_V3.performance);
assert.ok(sandbox.AIO_V3.research);
assert.ok(sandbox.AIO_V3.farmer);
assert.equal(typeof sandbox.AIO_V3.farmer.status, 'function');
assert.equal(typeof sandbox.AIO_V3.farmer.setTargetPolicy, 'function');
assert.equal(typeof sandbox.AIO_V3.farmer.addTargetExclusion, 'function');
assert.equal(typeof sandbox.AIO_V3.farmer.removeTargetExclusion, 'function');
assert.equal(typeof sandbox.AIO_V3.farmer.approveMonsterContent, 'function');
assert.equal(typeof sandbox.AIO_V3.farmer.quarantineMonsterContent, 'function');
assert.ok(sandbox.AIO_V3.farmer.status().targetExclusions.includes('automatron'));
assert.equal(sandbox.AIO_V3.farmer.status().targetPolicy, 'party-only');
assert.ok(sandbox.AIO_V3.farmer.status().kiting);
assert.equal(sandbox.AIO_V3.farmer.status().kiting.enabled, true);
assert.equal(typeof sandbox.AIO_V3.farmer.status().kiting.minRange, 'number');
assert.ok(sandbox.AIO_V3.farmer.status().skillUsage);
assert.equal(sandbox.AIO_V3.farmer.status().skillUsage.enabled, true);
assert.equal(typeof sandbox.AIO_V3.farmer.status().skillUsage.mpReserveRatio, 'number');
assert.equal(typeof sandbox.AIO_V3.farmer.status().skillUsage.minIntervalMs, 'number');
assert.equal(sandbox.AIO_V3.farmer.status().skillUsage.fallbackEnabled, true);
assert.equal(sandbox.AIO_V3.farmer.status().skillUsage.executionFallbackEnabled, true);
assert.equal(sandbox.AIO_V3.farmer.status().skillUsage.maxCommandAttempts, 2);
assert.deepEqual(Array.from(sandbox.AIO_V3.farmer.status().skillUsage.retryableCommandReasons), ['COMMAND_FAILED']);
assert.equal(sandbox.AIO_V3.farmer.status().skillUsage.failureBackoffEnabled, true);
assert.equal(sandbox.AIO_V3.farmer.status().skillUsage.failureBackoffMs, 2000);
assert.equal(sandbox.AIO_V3.farmer.status().skillUsage.failureIntelligenceEnabled, true);
assert.equal(sandbox.AIO_V3.farmer.status().skillUsage.failureBackoffMultiplier, 2);
assert.equal(sandbox.AIO_V3.farmer.status().skillUsage.failureBackoffMaxMs, 8000);
assert.equal(sandbox.AIO_V3.farmer.status().skillUsage.failureStreakResetMs, 30000);
assert.equal(sandbox.AIO_V3.farmer.status().skillUsage.backoffReason, 'SKILL_COMMAND_BACKOFF');
assert.deepEqual(Array.from(sandbox.AIO_V3.farmer.status().skillUsage.activeFailureBackoffs), []);
assert.deepEqual(Array.from(sandbox.AIO_V3.farmer.status().skillUsage.recentFailureStreaks), []);
assert.equal(sandbox.AIO_V3.farmer.status().skillUsage.lastBackoff, null);
assert.equal(sandbox.AIO_V3.farmer.status().skillUsage.lastFailureRecovery, null);
assert.match(sandbox.AIO_V3.farmer.status().skillUsage.selection, /live safe fallback/);
assert.ok(sandbox.AIO_V3.farmer.status().targetReassessment);
assert.equal(sandbox.AIO_V3.farmer.status().targetReassessment.enabled, true);
assert.equal(typeof sandbox.AIO_V3.farmer.status().targetReassessment.minIntervalMs, 'number');
assert.equal(typeof sandbox.AIO_V3.farmer.status().targetReassessment.switchCooldownMs, 'number');
assert.equal(sandbox.AIO_V3.farmer.status().targetReassessment.selfAggroSwitchFactor, 0.7);
assert.equal(sandbox.AIO_V3.farmer.status().targetReassessment.selfAggroThreatSwitchFactor, 1.25);
assert.equal(sandbox.AIO_V3.farmer.status().targetReassessment.threatMetric, 'G.monsters[mtype].attack * frequency');
assert.ok(sandbox.AIO_V3.farmer.status().safeRetreat);
assert.equal(sandbox.AIO_V3.farmer.status().safeRetreat.enabled, true);
assert.equal(typeof sandbox.AIO_V3.farmer.status().safeRetreat.stepSeconds, 'number');
assert.equal(typeof sandbox.AIO_V3.farmer.status().safeRetreat.minStep, 'number');
assert.equal(typeof sandbox.AIO_V3.farmer.status().safeRetreat.maxStep, 'number');
assert.equal(typeof sandbox.AIO_V3.saveWorld, 'function');
assert.equal(typeof sandbox.AIO_V3.showStatus, 'function');

// Alpha.8 stability freeze contract remains binding.
const stability = sandbox.AIO_V3.status().stability;
assert.ok(stability);
assert.equal(stability.stableScheduler, true);
assert.ok(stability.commandOutcomes);
assert.ok(stability.commandOutcomes.outcomes);
assert.equal(stability.commandOutcomes.outcomes.historyCapacity, 500);
assert.ok(stability.commandOutcomes.movement);
assert.equal(stability.commandOutcomes.movement.maxFailures, 3);
assert.equal(stability.commandOutcomes.movement.circuitOpen, false);
assert.ok(stability.combat);
assert.ok(stability.combat.retreat);
assert.equal(stability.combat.retreat.pendingOutcomeId, null);
assert.ok(stability.knowledgeAging);
assert.equal(stability.knowledgeAging.freshMs, 6 * 60 * 60 * 1000);
assert.equal(stability.knowledgeAging.staleMs, 72 * 60 * 60 * 1000);
assert.equal(stability.knowledgeAging.minFreshness, 0.15);
assert.ok(sandbox.AIO_V3.status().persistence);
assert.equal(sandbox.AIO_V3.status().persistence.retryBaseMs, 5000);
assert.equal(sandbox.AIO_V3.status().persistence.retryMaxMs, 120000);
assert.equal(typeof sandbox.AIO_V3.status().persistence.saveCircuitOpen, 'boolean');

// Alpha.9 same-map farming contract.
assert.ok(sandbox.AIO_V3.localFarming);
assert.equal(typeof sandbox.AIO_V3.localFarming.status, 'function');
assert.equal(typeof sandbox.AIO_V3.localFarming.reset, 'function');
const local = sandbox.AIO_V3.localFarming.status();
assert.equal(local.enabled, true);
assert.equal(local.sameMapOnly, true);
assert.equal(local.crossMapAllowed, false);
assert.equal(local.unknownContentAllowed, false);
assert.equal(local.schedulerOwned, true);
assert.equal(local.legacyRequiresLearnedConfidence, true);
assert.equal(local.unlearnedLegacyShadowPreviewOnly, true);
assert.equal(local.minLearnedConfidence, 0.10);
assert.equal(local.pendingSchedulerMove, null);

// Alpha.9 strategic Brain contract.
assert.ok(sandbox.AIO_V3.brain);
assert.equal(typeof sandbox.AIO_V3.brain.status, 'function');
assert.equal(typeof sandbox.AIO_V3.brain.features, 'function');
assert.equal(typeof sandbox.AIO_V3.brain.submitTeacher, 'function');
assert.equal(typeof sandbox.AIO_V3.brain.setInfluenceEnabled, 'function');
assert.equal(typeof sandbox.AIO_V3.brain.researchSummary, 'function');
const brain = sandbox.AIO_V3.brain.status();
assert.equal(brain.enabled, true);
assert.equal(brain.strategicOnly, true);
assert.equal(brain.rawGameplayAccess, false);
assert.equal(brain.influenceEnabled, false);
assert.equal(brain.influenceDefault, false);
assert.equal(brain.features.featureCount, 32);
assert.equal(Array.from(brain.features.featureNames).length, 32);
assert.equal(brain.student.architecture, '32-24-5');
assert.equal(brain.replay.capacity, 512);
assert.equal(brain.maxPendingOutcomes, 32);
assert.equal(brain.diary.capacity, 80);
assert.deepEqual(Array.from(brain.actions), ['continue', 'change_farm_target', 'replan_merchant', 'explore', 'wait']);
assert.equal(brain.teacher.transport, 'host-provided');
assert.equal(brain.teacher.requiredForGameplay, false);
assert.equal(brain.quality.state, 'warming');
assert.equal(brain.league.thresholds.minSamples, 80);
assert.equal(brain.league.thresholds.minUpdates, 120);
assert.equal(brain.league.thresholds.minTeacherAgreement, 0.6);
assert.equal(brain.league.thresholds.challengerTraffic, 0.2);
assert.equal(brain.persistence.maxBytes, 350000);

// Headless contract: no DOM or game_log is supplied by this VM sandbox.
assert.equal(typeof sandbox.document, 'undefined');
assert.equal(typeof sandbox.game_log, 'undefined');
assert.ok(sandbox.AIO_V3.operations);
assert.equal(typeof sandbox.AIO_V3.operations.status, 'function');
assert.equal(typeof sandbox.AIO_V3.operations.submit, 'function');
assert.equal(typeof sandbox.AIO_V3.operations.drainTelemetry, 'function');
assert.equal(typeof sandbox.AIO_V3.operations.takeStateReplica, 'function');
const ops = sandbox.AIO_V3.operations.status();
assert.equal(ops.contractVersion, 1);
assert.equal(ops.transport, 'host-provided');
assert.equal(ops.health.headlessCompatible, true);
assert.equal(ops.health.domRequired, false);
assert.equal(ops.health.gameLogRequired, false);
assert.equal(ops.health.dashboardRequired, false);
assert.equal(ops.control.allowElevated, false);
assert.ok(Array.from(ops.control.actions).includes('BRAIN_TEACH'));
assert.ok(Array.from(ops.control.actions).includes('SET_BRAIN_INFLUENCE'));

const now = Date.now();
const safeRemote = sandbox.AIO_V3.operations.submit({ commandId: 'smoke-shadow', action: 'SET_MODE', params: { mode: 'shadow' }, issuedAt: now - 100, expiresAt: now + 1000 });
assert.equal(safeRemote.status, 'EXECUTED');
const deniedRemote = sandbox.AIO_V3.operations.submit({ commandId: 'smoke-active', action: 'SET_MODE', params: { mode: 'active' }, issuedAt: now - 100, expiresAt: now + 1000 });
assert.equal(deniedRemote.status, 'REJECTED');
assert.equal(deniedRemote.reason, 'ELEVATED_CONTROL_DISABLED');
const deniedTeach = sandbox.AIO_V3.operations.submit({ commandId: 'smoke-teacher', action: 'BRAIN_TEACH', params: { recommendation: { action: 'continue', confidence: 0.8 } }, issuedAt: now - 100, expiresAt: now + 1000 });
assert.equal(deniedTeach.status, 'REJECTED');
assert.equal(deniedTeach.reason, 'ELEVATED_CONTROL_DISABLED');
const deniedInfluence = sandbox.AIO_V3.operations.submit({ commandId: 'smoke-brain-enable', action: 'SET_BRAIN_INFLUENCE', params: { enabled: true }, issuedAt: now - 100, expiresAt: now + 1000 });
assert.equal(deniedInfluence.status, 'REJECTED');
assert.equal(deniedInfluence.reason, 'ELEVATED_CONTROL_DISABLED');
const safeInfluenceOff = sandbox.AIO_V3.operations.submit({ commandId: 'smoke-brain-disable', action: 'SET_BRAIN_INFLUENCE', params: { enabled: false }, issuedAt: now - 100, expiresAt: now + 1000 });
assert.equal(safeInfluenceOff.status, 'EXECUTED');
assert.equal(sandbox.AIO_V3.brain.status().influenceEnabled, false);

assert.doesNotThrow(() => JSON.stringify(sandbox.AIO_V3.status()));
assert.doesNotThrow(() => JSON.stringify(sandbox.AIO_V3.brain.researchSummary()));
assert.ok(sandbox.AIO_V3.status().operations);
console.log('bundle smoke OK');
