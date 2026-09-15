'use strict';

const { RELEASE_VERSION } = require('./release-version');
const { EventLog } = require('./core/event-log');
const { Scheduler } = require('./core/scheduler');
const { GameAdapter } = require('./game/adapter');
const { WorldModel, EvidenceKind } = require('./world/world-model');
const { WorldPersistence } = require('./world/persistence');
const { DiscoveryService } = require('./world/discovery');
const { PerformanceTracker } = require('./telemetry/performance-tracker');
const { ResearchJournal } = require('./research/research');
const { partyProfile } = require('./party/capabilities');
const { FarmPlanner } = require('./planner/farm-planner');
const { RetreatFarmerController } = require('./farmer/retreat-farmer');
const { TargetSafety } = require('./farmer/target-safety');
const { CombatRiskGate } = require('./farmer/combat-risk');
const { CombatEmergencyGate } = require('./farmer/combat-emergency');

const VERSION = RELEASE_VERSION;

class Runtime {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.root = options.root || globalThis;
    this.log = options.log || new EventLog({ version: VERSION, now: this.now, capacity: options.logCapacity || 4000 });
    this.adapter = options.adapter || new GameAdapter({ root: this.root, parent: options.parent, log: this.log, mode: options.mode || 'shadow', now: this.now });
    this.world = options.world || new WorldModel({ now: this.now, log: this.log });
    this.scheduler = options.scheduler || new Scheduler({ now: this.now, log: this.log });
    this.planner = options.planner || new FarmPlanner({ log: this.log });
    this.farmer = options.farmer || new RetreatFarmerController({
      now: this.now,
      log: this.log,
      planner: this.planner,
      enabled: options.farmerEnabled !== false,
      targetPolicy: options.farmerTargetPolicy || options.targetPolicy,
      useHpRatio: options.farmerUseHpRatio || 0.75,
      kitingEnabled: options.farmerKitingEnabled !== false,
      kitingMinRange: options.farmerKitingMinRange,
      kitingTooCloseFactor: options.farmerKitingTooCloseFactor,
      kitingDesiredFactor: options.farmerKitingDesiredFactor,
      kitingMaxStepFactor: options.farmerKitingMaxStepFactor,
      kitingSpeedStepSeconds: options.farmerKitingSpeedStepSeconds,
      kitingMoveCooldownMs: options.farmerKitingMoveCooldownMs,
      skillUsageEnabled: options.farmerSkillUsageEnabled !== false,
      skillUsageMpReserveRatio: options.farmerSkillUsageMpReserveRatio,
      skillUsageMinIntervalMs: options.farmerSkillUsageMinIntervalMs,
      skillUsageMaxCommandAttempts: options.farmerSkillUsageMaxCommandAttempts,
      skillUsageFailureBackoffMs: options.farmerSkillUsageFailureBackoffMs,
      skillUsageFailureBackoffMultiplier: options.farmerSkillUsageFailureBackoffMultiplier,
      skillUsageFailureBackoffMaxMs: options.farmerSkillUsageFailureBackoffMaxMs,
      skillUsageFailureStreakResetMs: options.farmerSkillUsageFailureStreakResetMs,
      targetReassessmentEnabled: options.farmerTargetReassessmentEnabled !== false,
      targetReassessmentMinIntervalMs: options.farmerTargetReassessmentMinIntervalMs,
      targetReassessmentSwitchCooldownMs: options.farmerTargetReassessmentSwitchCooldownMs,
      targetReassessmentSelfAggroSwitchFactor: options.farmerTargetReassessmentSelfAggroSwitchFactor,
      targetReassessmentSelfAggroThreatSwitchFactor: options.farmerTargetReassessmentSelfAggroThreatSwitchFactor,
      safeRetreatEnabled: options.farmerSafeRetreatEnabled !== false,
      safeRetreatStepSeconds: options.farmerSafeRetreatStepSeconds,
      safeRetreatMinStep: options.farmerSafeRetreatMinStep,
      safeRetreatMaxStep: options.farmerSafeRetreatMaxStep,
      safeRetreatMaxThreats: options.farmerSafeRetreatMaxThreats
    });
    this.targetSafety = options.targetSafety || new TargetSafety({ exclusions: options.farmerTargetExclusions || [] });
    this.lastSafetySkip = null;
    this.safetySkipLoggedAt = new Map();
    this.safetySkipLogCooldownMs = Math.max(5000, Number(options.safetySkipLogCooldownMs) || 30000);
    this.combatRisk = options.combatRisk || new CombatRiskGate({
      threshold: options.combatRiskThreshold,
      recoveryHpRatio: options.farmerRecoverHpRatio || this.farmer.config.recoverHpRatio,
      minLearnedConfidence: options.combatRiskMinConfidence,
      deathRateReference: options.combatRiskDeathRateReference,
      log: this.log,
      now: this.now
    });
    this.lastRiskSkip = null;
    this.riskSkipLoggedAt = new Map();
    this.riskSkipLogCooldownMs = Math.max(5000, Number(options.riskSkipLogCooldownMs) || 30000);
    this.combatEmergency = options.combatEmergency || new CombatEmergencyGate({
      criticalHpRatio: options.combatEmergencyCriticalHpRatio,
      multiAggroHpRatio: options.combatEmergencyMultiAggroHpRatio,
      multiAggroCount: options.combatEmergencyMultiAggroCount
    });
    this.lastEmergencyDisengage = null;
    this.pendingEmergencyRetreat = null;
    this.performance = options.performance || new PerformanceTracker({ now: this.now, log: this.log, windowMs: options.performanceWindowMs || 60000 });
    this.persistence = options.persistence || new WorldPersistence({ root: this.root, storage: options.storage, now: this.now, log: this.log, minIntervalMs: options.persistenceIntervalMs || 30000 });
    this.discovery = options.discovery || new DiscoveryService({ world: this.world, now: this.now, log: this.log });
    this.research = options.research || new ResearchJournal({ world: this.world, now: this.now, log: this.log });
    this.tickMs = Math.max(100, Number(options.tickMs) || 250);
    this.timer = null;
    this.lastHeartbeat = 0;
    this.lastPlannerAudit = -Infinity;
    this.lastSnapshot = null;
    this.lastDiscovery = null;
    this.startedAt = null;
    this.worldLoaded = false;
    this.visibleStatusEnabled = options.visibleStatus !== false;
    this.readyAnnounced = false;
  }

  setMode(mode) {
    const resolved = this.adapter.setMode(mode);
    const note = resolved === 'active' ? 'farmer commands can execute' : 'farmer preview only';
    this._announce(`[AIO v3 ${VERSION}] MODE | ${resolved} | ${note}`, 'VISIBLE_MODE_CHANGED');
    return resolved;
  }

  setFarmerEnabled(enabled) {
    const resolved = this.farmer.setEnabled(enabled);
    this._announce(`[AIO v3 ${VERSION}] FARMER | ${resolved ? 'enabled' : 'disabled'} | mode=${this.adapter.mode}`, resolved ? 'VISIBLE_FARMER_ENABLED' : 'VISIBLE_FARMER_DISABLED');
    return resolved;
  }

  setFarmerTargetPolicy(policy) {
    const resolved = this.farmer.setTargetPolicy(policy);
    this._announce(`[AIO v3 ${VERSION}] FARMER TARGET POLICY | ${resolved}`, 'VISIBLE_FARMER_TARGET_POLICY_CHANGED');
    return resolved;
  }

  addFarmerTargetExclusion(value) {
    const token = this.targetSafety.add(value);
    this._announce(`[AIO v3 ${VERSION}] FARMER TARGET EXCLUSION | added=${token}`, 'VISIBLE_FARMER_TARGET_EXCLUSION_CHANGED');
    return token;
  }

  removeFarmerTargetExclusion(value) {
    const removed = this.targetSafety.remove(value);
    this._announce(`[AIO v3 ${VERSION}] FARMER TARGET EXCLUSION | remove=${String(value || '').trim().toLowerCase()} | removed=${removed}`, 'VISIBLE_FARMER_TARGET_EXCLUSION_CHANGED');
    return removed;
  }

  _gameLog(message) {
    if (!this.visibleStatusEnabled) return false;
    const fn = this.root && (this.root.game_log || (this.root.parent && this.root.parent.game_log));
    if (typeof fn !== 'function') return false;
    try {
      fn.call(this.root, message);
      return true;
    } catch (error) {
      this.log.emit({ component: 'runtime', event: 'VISIBLE_STATUS_FAILED', severity: 'warn', reason: String(error && error.message || error) });
      return false;
    }
  }

  _announce(message, event) {
    if (!this._gameLog(message)) return false;
    this.log.emit({ component: 'runtime', event, data: { message } });
    return true;
  }

  _announceReady(snapshot) {
    if (this.readyAnnounced || !snapshot || !snapshot.character) return false;
    const c = snapshot.character;
    const message = `[AIO v3 ${VERSION}] READY | ${c.name} | ${c.ctype} L${c.level} | map=${c.map || 'unknown'} | mode=${this.adapter.mode} | visible=${snapshot.entities.length}`;
    if (!this._announce(message, 'VISIBLE_READY')) return false;
    this.readyAnnounced = true;
    return true;
  }

  farmerStatus() {
    return {
      ...this.farmer.status(),
      targetExclusions: this.targetSafety.list(),
      lastSafetySkip: this.lastSafetySkip,
      lastRiskSkip: this.lastRiskSkip,
      lastEmergencyDisengage: this.lastEmergencyDisengage
    };
  }

  showStatus() {
    const status = this.status();
    const c = status.character;
    const character = c ? `${c.name} | ${c.ctype} L${c.level} | map=${c.map || 'unknown'}` : 'character=waiting';
    const queued = status.scheduler && status.scheduler.queued ? status.scheduler.queued.length : 0;
    const active = status.scheduler && status.scheduler.active ? status.scheduler.active.length : 0;
    const entities = status.world && Number.isFinite(Number(status.world.entities)) ? Number(status.world.entities) : 0;
    const modeNote = status.mode === 'shadow' ? 'observing only' : 'active commands enabled';
    const farmer = status.farmer || {};
    const farmerText = `farmer=${farmer.enabled ? farmer.state : 'disabled'}${farmer.targetType ? ':' + farmer.targetType : ''}${farmer.reason ? '[' + farmer.reason + ']' : ''} | targetPolicy=${farmer.targetPolicy || 'party-only'}`;
    const message = `[AIO v3 ${VERSION}] STATUS | running=${status.running} | mode=${status.mode} (${modeNote}) | ${character} | ${farmerText} | world=${entities} | tasks=${active}/${queued}`;
    this._announce(message, 'VISIBLE_STATUS');
    return status;
  }

  _restoreWorldOnce() {
    if (this.worldLoaded) return;
    this.worldLoaded = true;
    this.persistence.load(this.world);
  }

  start() {
    if (this.timer) return false;
    this._restoreWorldOnce();
    this.startedAt = this.startedAt || this.now();
    this.log.emit({ component: 'runtime', event: 'RUNTIME_STARTED', data: { version: VERSION, mode: this.adapter.mode, tickMs: this.tickMs } });
    const modeNote = this.adapter.mode === 'shadow' ? 'observing only' : 'active commands enabled';
    this._announce(`[AIO v3 ${VERSION}] STARTED | mode=${this.adapter.mode} | ${modeNote}`, 'VISIBLE_STARTUP');
    this.tick();
    this.timer = setInterval(() => this.tick(), this.tickMs);
    return true;
  }

  stop() {
    if (!this.timer) {
      this.persistence.maybeSave(this.world, { force: true });
      return false;
    }
    clearInterval(this.timer);
    this.timer = null;
    this.performance.flush({ world: this.world }, 'RUNTIME_STOPPED');
    this.persistence.maybeSave(this.world, { force: true });
    this.log.emit({ component: 'runtime', event: 'RUNTIME_STOPPED' });
    return true;
  }

  _observeCharacter(snapshot) {
    if (!snapshot) return;
    const c = snapshot.character;
    this.world.observeEntity('character', c.name, { ctype: c.ctype, level: c.level, map: c.map, rip: c.rip }, { evidence: EvidenceKind.OBSERVED, confidence: 1 });
  }

  _partyProfile(snapshot) {
    const members = [{ name: snapshot.character.name, ctype: snapshot.character.ctype, level: snapshot.character.level }];
    for (const p of snapshot.party || []) {
      if (p.name && p.name !== snapshot.character.name) members.push({ name: p.name, ctype: p.type, level: p.level });
    }
    return partyProfile(members);
  }

  _noteSafetySkip(entity, safety) {
    if (!entity || !safety || safety.allowed) return;
    const now = this.now();
    const key = `${entity.id || entity.mtype || 'unknown'}:${safety.reason}:${safety.token || '-'}`;
    const record = {
      at: now,
      entityId: entity.id || null,
      entityName: entity.name || null,
      monsterType: entity.mtype || null,
      reason: safety.reason,
      exclusion: safety.token || null,
      source: safety.source || null
    };
    this.lastSafetySkip = record;
    const last = this.safetySkipLoggedAt.get(key) || -Infinity;
    if (now - last < this.safetySkipLogCooldownMs) return;
    this.safetySkipLoggedAt.set(key, now);
    this.log.emit({ component: 'farmer', event: 'FARMER_TARGET_SKIPPED', character: this.lastSnapshot && this.lastSnapshot.character && this.lastSnapshot.character.name || null, reason: safety.reason, data: record });
  }

  _noteRiskSkip(entity, risk) {
    if (!entity || !risk || risk.allowed) return;
    const now = this.now();
    const key = `${entity.id || entity.mtype || 'unknown'}:${risk.reason}`;
    const record = {
      at: now,
      entityId: entity.id || null,
      entityName: entity.name || null,
      monsterType: entity.mtype || null,
      reason: risk.reason,
      score: risk.score,
      threshold: risk.threshold,
      signals: risk.signals || {}
    };
    this.lastRiskSkip = record;
    const last = this.riskSkipLoggedAt.get(key) || -Infinity;
    if (now - last < this.riskSkipLogCooldownMs) return;
    this.riskSkipLoggedAt.set(key, now);
    this.log.emit({ component: 'farmer', event: 'FARMER_TARGET_RISK_REJECTED', character: this.lastSnapshot && this.lastSnapshot.character && this.lastSnapshot.character.name || null, reason: risk.reason, data: record });
  }

  _armEmergencyRetreat(snapshot, entity, emergency, at) {
    if (this.adapter.mode !== 'active' || !snapshot || !snapshot.character) return;
    const character = snapshot.character;
    const threats = [];
    const seen = new Set();
    for (const candidate of snapshot.entities || []) {
      if (!candidate || !candidate.id || !candidate.mtype || candidate.dead || (candidate.hp != null && Number(candidate.hp) <= 0)) continue;
      const isCurrent = entity && String(candidate.id) === String(entity.id);
      const isSelfAggro = candidate.target === character.name;
      if (!isCurrent && !isSelfAggro) continue;
      const key = String(candidate.id);
      if (seen.has(key)) continue;
      seen.add(key);
      threats.push({
        id: key,
        mtype: candidate.mtype || null,
        x: candidate.x == null ? null : Number(candidate.x),
        y: candidate.y == null ? null : Number(candidate.y),
        target: candidate.target || null
      });
      if (threats.length >= 6) break;
    }

    this.pendingEmergencyRetreat = {
      at,
      reason: emergency.reason,
      hpRatio: emergency.signals && emergency.signals.hpRatio != null ? Number(emergency.signals.hpRatio) : null,
      sourceTargetId: entity && entity.id || null,
      sourceTargetType: entity && entity.mtype || null,
      threats
    };
  }

  takeEmergencyRetreat() {
    const pending = this.pendingEmergencyRetreat;
    this.pendingEmergencyRetreat = null;
    return pending;
  }

  _noteEmergencyDisengage(entity, emergency, snapshot) {
    if (!entity || !emergency || !emergency.triggered) return;
    const at = this.now();
    const record = {
      at,
      entityId: entity.id || null,
      entityName: entity.name || null,
      monsterType: entity.mtype || null,
      reason: emergency.reason,
      signals: emergency.signals || {}
    };
    this.lastEmergencyDisengage = record;
    this._armEmergencyRetreat(snapshot, entity, emergency, at);
    this.log.emit({
      component: 'farmer',
      event: 'FARMER_EMERGENCY_DISENGAGE',
      severity: 'warn',
      character: this.lastSnapshot && this.lastSnapshot.character && this.lastSnapshot.character.name || null,
      reason: emergency.reason,
      data: record
    });
  }

  _farmSnapshot(snapshot, gameData, profile) {
    if (!snapshot) return snapshot;
    const entities = [];
    for (const entity of snapshot.entities || []) {
      const isCurrentEngageTarget = this.farmer.state === 'ENGAGE' && this.farmer.targetId != null && String(entity.id) === String(this.farmer.targetId);
      if (isCurrentEngageTarget) {
        const emergency = this.combatEmergency.evaluate(snapshot, entity);
        if (emergency.triggered) {
          this._noteEmergencyDisengage(entity, emergency, snapshot);
          continue;
        }
      }

      const safety = this.targetSafety.evaluate(entity, gameData || {});
      if (!safety.allowed) {
        this._noteSafetySkip(entity, safety);
        continue;
      }
      const risk = this.combatRisk.evaluate(entity, snapshot, this.world, profile);
      if (!risk.allowed) {
        this._noteRiskSkip(entity, risk);
        continue;
      }
      entities.push(entity);
    }
    return { ...snapshot, entities };
  }

  _plannerCandidates(snapshot, profile) {
    const G = this.adapter.getGameData() || {};
    const seen = new Set();
    const rows = [];
    for (const entity of snapshot.entities) {
      if (!entity.mtype || entity.dead || seen.has(entity.mtype)) continue;
      seen.add(entity.mtype);
      const learned = this.world.performanceFor(entity.mtype, profile.fingerprint);
      const g = G.monsters && G.monsters[entity.mtype] || {};
      const fallbackXp = Math.max(0, Number(g.xp) || 0) * 60;
      rows.push({
        id: entity.mtype,
        monster: entity.mtype,
        xpPerHour: learned ? learned.xpPerHour : fallbackXp,
        goldPerHour: learned ? learned.goldPerHour : 0,
        deathsPerHour: learned ? learned.deathsPerHour : 0,
        confidence: learned ? learned.confidence : 0.05,
        travelSeconds: this._roughTravelSeconds(snapshot.character, entity),
        source: learned ? 'measured' : 'estimate-live'
      });
    }
    return rows;
  }

  _roughTravelSeconds(character, entity) {
    if (!character || character.map !== entity.map || character.x == null || character.y == null || entity.x == null || entity.y == null) return 120;
    const distance = Math.hypot(character.x - entity.x, character.y - entity.y);
    const c = this.adapter._character && this.adapter._character();
    const speed = c && Number(c.speed) || 40;
    return distance / Math.max(1, speed);
  }

  tick() {
    this._restoreWorldOnce();
    const snapshot = this.adapter.snapshot();
    if (!snapshot) {
      if (this.now() - this.lastHeartbeat > 5000) {
        this.lastHeartbeat = this.now();
        this.log.emit({ component: 'runtime', event: 'SNAPSHOT_UNAVAILABLE', severity: 'warn', reason: 'CHARACTER_NOT_READY' });
      }
      return;
    }
    this.lastSnapshot = snapshot;
    this._observeCharacter(snapshot);
    const profile = this._partyProfile(snapshot);
    const gameData = this.adapter.getGameData() || {};
    const farmSnapshot = this._farmSnapshot(snapshot, gameData, profile);
    this.lastDiscovery = this.discovery.scan(snapshot, gameData);
    this._announceReady(snapshot);
    this.performance.observe(snapshot, { partyFingerprint: profile.fingerprint, world: this.world, gameData });
    this.farmer.ensureScheduled(this.scheduler, snapshot.character.name);
    this.scheduler.tick({ snapshot: farmSnapshot, adapter: this.adapter, world: this.world, party: profile, runtime: this });
    this.persistence.maybeSave(this.world);

    if (this.now() - this.lastPlannerAudit >= 15000) {
      this.lastPlannerAudit = this.now();
      const candidates = this._plannerCandidates(farmSnapshot, profile);
      if (candidates.length) this.planner.rank(candidates, { character: snapshot.character.name, partyFingerprint: profile.fingerprint });
      else this.log.emit({ component: 'planner', event: 'NO_LIVE_FARM_CANDIDATES', character: snapshot.character.name, data: { partyFingerprint: profile.fingerprint } });
    }

    if (this.now() - this.lastHeartbeat >= 5000) {
      this.lastHeartbeat = this.now();
      this.log.emit({
        component: 'runtime',
        event: 'HEARTBEAT',
        character: snapshot.character.name,
        data: {
          mode: this.adapter.mode,
          map: snapshot.character.map,
          hp: snapshot.character.hp,
          mp: snapshot.character.mp,
          gold: snapshot.character.gold,
          scheduler: { queued: this.scheduler.queue.length, active: this.scheduler.activeByOwner.size },
          world: this.world.summary(),
          performance: this.performance.status().current,
          combatRisk: { ...this.combatRisk.status(), lastRiskSkip: this.lastRiskSkip },
          combatEmergency: { ...this.combatEmergency.status(), lastEmergencyDisengage: this.lastEmergencyDisengage, pendingRetreat: !!this.pendingEmergencyRetreat },
          persistence: this.persistence.status()
        }
      });
    }
  }

  status() {
    return {
      version: VERSION,
      mode: this.adapter.mode,
      running: !!this.timer,
      runId: this.log.runId,
      startedAt: this.startedAt,
      character: this.lastSnapshot && this.lastSnapshot.character || null,
      scheduler: this.scheduler.snapshot(),
      farmer: this.farmerStatus(),
      combatRisk: { ...this.combatRisk.status(), lastRiskSkip: this.lastRiskSkip },
      combatEmergency: { ...this.combatEmergency.status(), lastEmergencyDisengage: this.lastEmergencyDisengage, pendingRetreat: !!this.pendingEmergencyRetreat },
      world: this.world.summary(),
      performance: this.performance.status(),
      discovery: this.discovery.status(),
      research: this.research.summary(),
      persistence: this.persistence.status(),
      eventSummary: this.log.summary()
    };
  }

  exportDiagnostics() {
    return this.log.exportBundle({
      runtime: this.status(),
      snapshot: this.lastSnapshot,
      scheduler: this.scheduler.snapshot(),
      farmer: this.farmerStatus(),
      combatRisk: { ...this.combatRisk.status(), lastRiskSkip: this.lastRiskSkip },
      combatEmergency: { ...this.combatEmergency.status(), lastEmergencyDisengage: this.lastEmergencyDisengage, pendingRetreat: !!this.pendingEmergencyRetreat },
      world: this.world.diagnosticsSnapshot(200),
      performance: this.performance.status(),
      research: { summary: this.research.summary(), experiments: this.research.listExperiments() },
      discovery: this.lastDiscovery
    });
  }
}

module.exports = { Runtime, VERSION };