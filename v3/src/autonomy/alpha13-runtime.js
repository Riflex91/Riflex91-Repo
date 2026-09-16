'use strict';

const { Alpha12Runtime } = require('./alpha12-hardened-runtime');
const { GlobalSupervisor } = require('../stability/global-supervisor');
const { ContentDriftMonitor } = require('../world/content-drift');

const ALPHA13_VERSION = '3.0.0-alpha.13.0';

function contentDriftStorageKey(root, explicitKey = null) {
  if (explicitKey != null && String(explicitKey).trim()) return String(explicitKey).trim();
  const character = root && (root.character || root.parent && root.parent.character);
  const name = character && String(character.name || '').trim();
  return name ? `aio-v3-content-drift-v1:${name}` : undefined;
}

class Alpha13Runtime extends Alpha12Runtime {
  constructor(options = {}) {
    super(options);
    this.log.version = ALPHA13_VERSION;
    this.contentDriftScanMs = Math.max(1000, Math.min(60000, Number(options.contentDriftScanMs) || 5000));
    this.supervisorIntervalMs = Math.max(500, Math.min(30000, Number(options.globalSupervisorIntervalMs) || 1000));
    this.lastContentDriftScanAt = -Infinity;
    this.lastSupervisorAt = -Infinity;
    this.lastContentDriftResult = null;
    this.lastSupervisorResult = null;

    this.contentDrift = options.contentDrift || new ContentDriftMonitor({
      root: this.root,
      storage: options.contentDriftStorage || options.storage,
      key: contentDriftStorageKey(this.root, options.contentDriftKey),
      now: this.now,
      log: this.log,
      capacity: options.contentDriftCapacity,
      scanBudget: options.contentDriftScanBudget,
      minObservedSamples: options.contentDriftMinObservedSamples,
      minSaveMs: options.contentDriftSaveMs
    });
    this.contentDrift.load();

    this.globalSupervisor = options.globalSupervisor || new GlobalSupervisor({
      now: this.now,
      log: this.log,
      safeActionsEnabled: options.globalSupervisorSafeActionsEnabled === true,
      watchAfterMs: options.globalSupervisorWatchAfterMs,
      degradedAfterMs: options.globalSupervisorDegradedAfterMs,
      safeModeAfterMs: options.globalSupervisorSafeModeAfterMs,
      quarantineAfterMs: options.globalSupervisorQuarantineAfterMs,
      minMovementProgress: options.globalSupervisorMinMovementProgress,
      recoveryCooldownMs: options.globalSupervisorRecoveryCooldownMs,
      recoveryWindowMs: options.globalSupervisorRecoveryWindowMs,
      maxRecoveriesPerWindow: options.globalSupervisorMaxRecoveriesPerWindow
    });
  }

  _announce(message, event) {
    const normalized = String(message).replace(/\[AIO v3 [^\]]+\]/g, `[AIO v3 ${ALPHA13_VERSION}]`);
    this.log.emit({ component: 'runtime', event, data: { message: normalized, visibleMirror: !!this.visibleStatusEnabled } });
    this._gameLog(normalized);
    return true;
  }

  _scanContentDrift() {
    if (!this.lastSnapshot || !this.lastSnapshot.character) return null;
    const gameData = this.adapter.getGameData() || {};
    const result = this.contentDrift.scan(this.lastSnapshot, gameData);
    this.lastContentDriftResult = result;
    for (const change of result && result.changes || []) {
      if (change.category !== 'monsters') continue;
      if (change.kind !== 'DRIFT' && change.kind !== 'NOVELTY') continue;
      try {
        this.combatRisk.quarantineMonsterType(this.world, change.id);
        this.log.emit({
          component: 'content-drift', event: 'CONTENT_MONSTER_FAIL_CLOSED', severity: 'warn',
          reason: change.kind === 'DRIFT' ? 'MONSTER_DEFINITION_CHANGED' : 'NEW_MONSTER_AFTER_BASELINE',
          data: { monster: change.id, fingerprint: change.fingerprint }
        });
      } catch (error) {
        this.log.emit({
          component: 'content-drift', event: 'CONTENT_MONSTER_FAIL_CLOSED_FAILED', severity: 'error', reason: 'QUARANTINE_WRITE_FAILED',
          data: { monster: change.id, message: String(error && error.message || error) }
        });
      }
    }
    return result;
  }

  _evaluateGlobalSupervisor() {
    const baseStatus = super.status();
    const result = this.globalSupervisor.observe({ runtime: this, status: baseStatus, contentDrift: this.contentDrift.status() });
    this.lastSupervisorResult = result;
    return result;
  }

  tick() {
    super.tick();
    const now = this.now();
    if (now - this.lastContentDriftScanAt >= this.contentDriftScanMs) {
      this.lastContentDriftScanAt = now;
      this._scanContentDrift();
    }
    if (now - this.lastSupervisorAt >= this.supervisorIntervalMs) {
      this.lastSupervisorAt = now;
      this._evaluateGlobalSupervisor();
    }
  }

  stop() {
    if (this.contentDrift) this.contentDrift.save({ force: true });
    return super.stop();
  }

  setSupervisorSafeActionsEnabled(enabled) { return this.globalSupervisor.setSafeActionsEnabled(enabled); }
  quarantineSubsystem(name, reason) { return this.globalSupervisor.quarantineSubsystem(name, reason); }
  clearSubsystemQuarantine(name) { return this.globalSupervisor.clearSubsystemQuarantine(name); }
  markContentRevalidated(category, id) { return this.contentDrift.markRevalidated(category, id); }

  status() {
    const base = super.status();
    return { ...base, version: ALPHA13_VERSION, supervisor: this.globalSupervisor.status(), contentDrift: this.contentDrift.status() };
  }

  exportDiagnostics() {
    const base = JSON.parse(super.exportDiagnostics());
    base.context = base.context || {};
    base.context.supervisor = this.globalSupervisor.status();
    base.context.contentDrift = { status: this.contentDrift.status(), recent: this.contentDrift.list(200) };
    return JSON.stringify(base, null, 2);
  }
}

module.exports = { Alpha13Runtime, ALPHA13_VERSION, contentDriftStorageKey };
