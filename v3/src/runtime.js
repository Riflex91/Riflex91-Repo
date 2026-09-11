'use strict';

const { EventLog } = require('./core/event-log');
const { Scheduler } = require('./core/scheduler');
const { GameAdapter } = require('./game/adapter');
const { WorldModel, EvidenceKind } = require('./world/world-model');
const { partyProfile } = require('./party/capabilities');
const { FarmPlanner } = require('./planner/farm-planner');

const VERSION = '3.0.0-alpha.1';

class Runtime {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.log = options.log || new EventLog({ version: VERSION, now: this.now, capacity: options.logCapacity || 4000 });
    this.adapter = options.adapter || new GameAdapter({ root: options.root || globalThis, parent: options.parent, log: this.log, mode: options.mode || 'shadow' });
    this.world = options.world || new WorldModel({ now: this.now, log: this.log });
    this.scheduler = options.scheduler || new Scheduler({ now: this.now, log: this.log });
    this.planner = options.planner || new FarmPlanner({ log: this.log });
    this.tickMs = Math.max(100, Number(options.tickMs) || 250);
    this.timer = null;
    this.lastHeartbeat = 0;
    this.lastPlannerAudit = -Infinity;
    this.lastSnapshot = null;
    this.startedAt = null;
  }

  setMode(mode) { return this.adapter.setMode(mode); }

  start() {
    if (this.timer) return false;
    this.startedAt = this.startedAt || this.now();
    this.log.emit({ component: 'runtime', event: 'RUNTIME_STARTED', data: { version: VERSION, mode: this.adapter.mode, tickMs: this.tickMs } });
    this.tick();
    this.timer = setInterval(() => this.tick(), this.tickMs);
    return true;
  }

  stop() {
    if (!this.timer) return false;
    clearInterval(this.timer);
    this.timer = null;
    this.log.emit({ component: 'runtime', event: 'RUNTIME_STOPPED' });
    return true;
  }

  _observe(snapshot) {
    if (!snapshot) return;
    const c = snapshot.character;
    this.world.observeEntity('character', c.name, { ctype: c.ctype, level: c.level, map: c.map, rip: c.rip }, { evidence: EvidenceKind.OBSERVED, confidence: 1 });
    for (const entity of snapshot.entities) {
      const type = entity.mtype ? 'monster' : entity.npc ? 'npc' : entity.player ? 'player' : entity.type || 'entity';
      const id = entity.mtype || entity.name || entity.id;
      this.world.observeEntity(type, id, { map: entity.map, x: entity.x, y: entity.y, live: !entity.dead }, { evidence: EvidenceKind.OBSERVED, confidence: 1 });
    }
  }

  _partyProfile(snapshot) {
    const members = [{ name: snapshot.character.name, ctype: snapshot.character.ctype, level: snapshot.character.level }];
    for (const p of snapshot.party || []) {
      if (p.name && p.name !== snapshot.character.name) members.push({ name: p.name, ctype: p.type, level: p.level });
    }
    return partyProfile(members);
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
    const snapshot = this.adapter.snapshot();
    if (!snapshot) {
      if (this.now() - this.lastHeartbeat > 5000) {
        this.lastHeartbeat = this.now();
        this.log.emit({ component: 'runtime', event: 'SNAPSHOT_UNAVAILABLE', severity: 'warn', reason: 'CHARACTER_NOT_READY' });
      }
      return;
    }
    this.lastSnapshot = snapshot;
    this._observe(snapshot);
    const profile = this._partyProfile(snapshot);
    this.scheduler.tick({ snapshot, adapter: this.adapter, world: this.world, party: profile, runtime: this });

    if (this.now() - this.lastPlannerAudit >= 15000) {
      this.lastPlannerAudit = this.now();
      const candidates = this._plannerCandidates(snapshot, profile);
      if (candidates.length) this.planner.rank(candidates, { character: snapshot.character.name, partyFingerprint: profile.fingerprint });
      else this.log.emit({ component: 'planner', event: 'NO_LIVE_FARM_CANDIDATES', character: snapshot.character.name, data: { partyFingerprint: profile.fingerprint } });
    }

    if (this.now() - this.lastHeartbeat >= 5000) {
      this.lastHeartbeat = this.now();
      this.log.emit({ component: 'runtime', event: 'HEARTBEAT', character: snapshot.character.name, data: { mode: this.adapter.mode, map: snapshot.character.map, hp: snapshot.character.hp, mp: snapshot.character.mp, gold: snapshot.character.gold, scheduler: { queued: this.scheduler.queue.length, active: this.scheduler.activeByOwner.size }, world: this.world.summary() } });
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
      world: this.world.summary(),
      eventSummary: this.log.summary()
    };
  }

  exportDiagnostics() {
    return this.log.exportBundle({
      runtime: this.status(),
      snapshot: this.lastSnapshot,
      scheduler: this.scheduler.snapshot(),
      world: this.world.summary()
    });
  }
}

module.exports = { Runtime, VERSION };
