'use strict';

const { fingerprint } = require('../world/content-drift');
const { semanticFor } = require('./skill-semantics');

const SkillCatalogState = Object.freeze({
  WAITING: 'WAITING',
  READY: 'READY',
  STALE: 'STALE',
  DRIFT_DETECTED: 'DRIFT_DETECTED',
  INVALID: 'INVALID'
});

const SUPPORTED_CLASSES = Object.freeze(['warrior', 'paladin', 'rogue', 'ranger', 'mage', 'priest', 'merchant']);

function finite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function clone(value, fallback = null) {
  if (value == null) return fallback;
  try { return JSON.parse(JSON.stringify(value)); } catch (_) { return fallback; }
}

function normalizeStringArray(value) {
  if (Array.isArray(value)) return [...new Set(value.map(String).filter(Boolean))].sort();
  if (value == null || value === false) return [];
  return [String(value)];
}

function normalizeSlotRequirements(value) {
  if (!Array.isArray(value)) return [];
  const out = [];
  for (const row of value) {
    if (!Array.isArray(row) || row.length < 2) continue;
    const slot = String(row[0] || '').trim();
    const item = String(row[1] || '').trim();
    if (slot && item) out.push([slot, item]);
  }
  return out;
}

function normalizeLiveSkill(id, skill) {
  const raw = skill && typeof skill === 'object' ? skill : {};
  const rawFingerprint = fingerprint(raw);
  const classes = normalizeStringArray(raw.class).map((value) => value.toLowerCase());
  const semantic = semanticFor(id, raw);
  const record = {
    id: String(id),
    name: raw.name == null ? String(id) : String(raw.name),
    type: raw.type == null ? null : String(raw.type),
    classes,
    classSupported: classes.some((ctype) => SUPPORTED_CLASSES.includes(ctype)),
    requiredLevel: Math.max(0, finite(raw.level) == null ? 0 : finite(raw.level)),
    mp: finite(raw.mp),
    cooldown: finite(raw.cooldown),
    reuseCooldown: finite(raw.reuse_cooldown),
    range: finite(raw.range),
    rangeMultiplier: finite(raw.range_multiplier),
    rangeBonus: finite(raw.range_bonus),
    damage: finite(raw.damage),
    damageMultiplier: finite(raw.damage_multiplier),
    cooldownMultiplier: finite(raw.cooldown_multiplier),
    maxTargets: finite(raw.max_targets),
    multi: raw.multi === true,
    list: raw.list === true,
    party: raw.party === true,
    aura: raw.aura === true,
    heal: raw.heal === true,
    hostile: raw.hostile === true,
    target: raw.target == null ? null : raw.target,
    monsters: raw.monsters == null ? null : raw.monsters,
    wtype: normalizeStringArray(raw.wtype),
    offhandType: raw.offhand_type == null ? null : String(raw.offhand_type),
    slot: normalizeSlotRequirements(raw.slot),
    share: raw.share == null ? null : String(raw.share),
    consume: raw.consume == null ? null : String(raw.consume),
    condition: raw.condition == null ? null : String(raw.condition),
    procs: raw.procs == null ? null : raw.procs === true,
    piercesImmunity: raw.pierces_immunity == null ? null : raw.pierces_immunity === true,
    targetCapacity: semantic.targetCapacity,
    automationValidated: semantic.automationValidated,
    defaultEnabled: semantic.defaultEnabled === true,
    capabilities: semantic.capabilities.slice(),
    controls: semantic.controls.map((control) => ({ ...control })),
    rawFingerprint: rawFingerprint.hash,
    rawBytes: rawFingerprint.bytes
  };
  return Object.freeze(record);
}

function catalogFingerprint(records) {
  const rows = [...records.values()]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((row) => [row.id, row.rawFingerprint]);
  return fingerprint(rows);
}

function diffCatalog(previous, next) {
  const before = previous || new Map();
  const after = next || new Map();
  const newSkills = [];
  const removedSkills = [];
  const changedSkills = [];
  for (const [id, row] of after.entries()) {
    const old = before.get(id);
    if (!old) newSkills.push(id);
    else if (old.rawFingerprint !== row.rawFingerprint) changedSkills.push(id);
  }
  for (const id of before.keys()) if (!after.has(id)) removedSkills.push(id);
  return {
    newSkills: newSkills.sort(),
    removedSkills: removedSkills.sort(),
    changedSkills: changedSkills.sort()
  };
}

function serverIdentity(root) {
  const parent = root && root.parent || root || {};
  const region = root && root.server_region != null ? root.server_region : parent && parent.server_region;
  const identifier = root && root.server_identifier != null ? root.server_identifier : parent && parent.server_identifier;
  return `${region == null ? 'unknown' : String(region)}:${identifier == null ? 'unknown' : String(identifier)}`;
}

function characterIdentity(snapshot) {
  const c = snapshot && snapshot.character;
  if (!c) return null;
  return `${String(c.name || 'unknown')}|${String(c.ctype || 'unknown').toLowerCase()}`;
}

function equipmentFingerprint(liveCharacter) {
  const slots = liveCharacter && liveCharacter.slots;
  if (!slots || typeof slots !== 'object') return null;
  const compact = {};
  for (const slot of Object.keys(slots).sort()) {
    const item = slots[slot];
    if (!item || typeof item !== 'object') continue;
    compact[slot] = { name: item.name || null, level: finite(item.level) || 0 };
  }
  return fingerprint(compact).hash;
}

function partyIdentity(snapshot) {
  const rows = [];
  const c = snapshot && snapshot.character;
  if (c) rows.push([String(c.name || ''), String(c.ctype || ''), finite(c.level) || 0]);
  for (const member of snapshot && snapshot.party || []) {
    if (!member || !member.name) continue;
    rows.push([String(member.name), String(member.ctype || member.type || ''), finite(member.level) || 0]);
  }
  rows.sort((a, b) => a[0].localeCompare(b[0]));
  return fingerprint(rows).hash;
}

class SkillCatalogService {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.getGameData = typeof options.getGameData === 'function'
      ? options.getGameData
      : () => this.root && (this.root.G || this.root.parent && this.root.parent.G) || {};
    this.auditIntervalMs = Math.max(1000, Math.min(60000, Number(options.auditIntervalMs) || 5000));
    this.connectionGapMs = Math.max(1000, Math.min(60000, Number(options.connectionGapMs) || 5000));
    this.state = SkillCatalogState.WAITING;
    this.records = new Map();
    this.generation = 0;
    this.fingerprint = null;
    this.builtAt = null;
    this.lastCheckedAt = null;
    this.lastGoodAt = null;
    this.lastReason = null;
    this.lastError = null;
    this.lastChange = null;
    this.pendingVerificationFingerprint = null;
    this.unavailableSince = null;
    this.context = {
      server: null,
      character: null,
      level: null,
      equipment: null,
      party: null
    };
    this.stats = {
      audits: 0,
      rebuilds: 0,
      unchanged: 0,
      driftEvents: 0,
      invalidAudits: 0,
      staleEvents: 0,
      recoveries: 0
    };
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    try {
      this.log.emit({ component: 'skill-catalog', event, severity, reason, data });
    } catch (_) {}
  }

  _liveSkills() {
    const gameData = this.getGameData() || {};
    const skills = gameData.skills;
    if (!skills || typeof skills !== 'object' || Array.isArray(skills)) return null;
    return skills;
  }

  _build(skills) {
    const records = new Map();
    for (const id of Object.keys(skills).sort()) {
      const skill = skills[id];
      if (!skill || typeof skill !== 'object' || Array.isArray(skill)) continue;
      records.set(String(id), normalizeLiveSkill(id, skill));
    }
    return records;
  }

  _invalid(reason, message = null) {
    this.stats.invalidAudits += 1;
    this.lastError = message || reason;
    this.lastReason = reason;
    this.state = this.records.size ? SkillCatalogState.STALE : SkillCatalogState.INVALID;
    this._event('SKILL_CATALOG_INVALID', 'warn', reason, { message: this.lastError, retainedRecords: this.records.size });
    return { ok: false, changed: false, state: this.state, reason };
  }

  audit(reason = 'MANUAL', options = {}) {
    const now = this.now();
    if (options.force !== true && this.lastCheckedAt != null && now - this.lastCheckedAt < this.auditIntervalMs) {
      return { ok: this.state === SkillCatalogState.READY, changed: false, skipped: true, state: this.state, reason: 'AUDIT_INTERVAL' };
    }
    this.lastCheckedAt = now;
    this.lastReason = String(reason || 'MANUAL');
    this.stats.audits += 1;

    let skills;
    try { skills = this._liveSkills(); } catch (error) {
      return this._invalid('GAME_DATA_READ_FAILED', String(error && error.message || error));
    }
    if (!skills) return this._invalid('SKILL_DATA_UNAVAILABLE');
    const next = this._build(skills);
    if (!next.size) return this._invalid('SKILL_DATA_EMPTY');

    const nextFingerprint = catalogFingerprint(next);
    if (!this.fingerprint) {
      this.records = next;
      this.fingerprint = nextFingerprint.hash;
      this.generation = 1;
      this.builtAt = now;
      this.lastGoodAt = now;
      this.lastError = null;
      this.state = SkillCatalogState.READY;
      this.stats.rebuilds += 1;
      this._event('SKILL_CATALOG_READY', 'info', this.lastReason, {
        generation: this.generation,
        fingerprint: this.fingerprint,
        skills: this.records.size
      });
      return { ok: true, changed: true, initial: true, state: this.state, generation: this.generation };
    }

    if (this.fingerprint === nextFingerprint.hash) {
      this.records = next;
      this.lastGoodAt = now;
      this.lastError = null;
      if (this.state === SkillCatalogState.DRIFT_DETECTED && this.pendingVerificationFingerprint === nextFingerprint.hash) {
        this.state = SkillCatalogState.READY;
        this.pendingVerificationFingerprint = null;
        this._event('SKILL_CATALOG_DRIFT_VERIFIED', 'info', 'SECOND_IDENTICAL_AUDIT', {
          generation: this.generation,
          fingerprint: this.fingerprint
        });
      } else if (this.state === SkillCatalogState.STALE || this.state === SkillCatalogState.INVALID || this.state === SkillCatalogState.WAITING) {
        this.state = SkillCatalogState.READY;
        this.stats.recoveries += 1;
        this._event('SKILL_CATALOG_RECOVERED', 'info', this.lastReason, { generation: this.generation, fingerprint: this.fingerprint });
      }
      this.stats.unchanged += 1;
      return { ok: this.state === SkillCatalogState.READY, changed: false, state: this.state, generation: this.generation };
    }

    const changes = diffCatalog(this.records, next);
    const previousFingerprint = this.fingerprint;
    this.records = next;
    this.fingerprint = nextFingerprint.hash;
    this.generation += 1;
    this.builtAt = now;
    this.lastGoodAt = now;
    this.lastError = null;
    this.state = SkillCatalogState.DRIFT_DETECTED;
    this.pendingVerificationFingerprint = nextFingerprint.hash;
    this.lastChange = {
      at: now,
      reason: this.lastReason,
      previousFingerprint,
      fingerprint: this.fingerprint,
      generation: this.generation,
      ...changes
    };
    this.stats.rebuilds += 1;
    this.stats.driftEvents += 1;
    this._event('SKILL_CATALOG_DRIFT_DETECTED', 'warn', 'LIVE_SKILL_DEFINITION_CHANGED', clone(this.lastChange, {}));
    return { ok: false, changed: true, drift: true, state: this.state, generation: this.generation, changes };
  }

  markStale(reason = 'STALE') {
    if (this.state === SkillCatalogState.STALE) return false;
    if (this.state === SkillCatalogState.INVALID && !this.records.size) return false;
    this.state = SkillCatalogState.STALE;
    this.lastReason = String(reason);
    this.stats.staleEvents += 1;
    this._event('SKILL_CATALOG_STALE', 'warn', this.lastReason, { generation: this.generation, fingerprint: this.fingerprint });
    return true;
  }

  noteSnapshotUnavailable() {
    const now = this.now();
    if (this.unavailableSince == null) this.unavailableSince = now;
    if (now - this.unavailableSince >= this.connectionGapMs) this.markStale('CONNECTION_GAP');
    return this.status();
  }

  observeRuntime(context = {}) {
    const snapshot = context.snapshot;
    if (!snapshot || !snapshot.character) {
      this.noteSnapshotUnavailable();
      return {
        catalogChanged: false,
        characterContextChanged: false,
        partyContextChanged: false,
        reasons: ['SNAPSHOT_UNAVAILABLE']
      };
    }

    const now = this.now();
    const reasons = [];
    let forceAudit = false;
    let characterContextChanged = false;
    let partyContextChanged = false;

    if (this.unavailableSince != null) {
      const gapMs = Math.max(0, now - this.unavailableSince);
      this.unavailableSince = null;
      if (gapMs >= this.connectionGapMs) {
        reasons.push('CONNECTION_RECOVERED');
        forceAudit = true;
      }
    }

    const next = {
      server: serverIdentity(this.root),
      character: characterIdentity(snapshot),
      level: finite(snapshot.character.level) || 0,
      equipment: equipmentFingerprint(context.liveCharacter),
      party: partyIdentity(snapshot)
    };

    if (this.context.server != null && this.context.server !== next.server) {
      reasons.push('SERVER_CHANGED');
      forceAudit = true;
      partyContextChanged = true;
    }
    if (this.context.character != null && this.context.character !== next.character) {
      reasons.push('CHARACTER_CHANGED');
      forceAudit = true;
      characterContextChanged = true;
      partyContextChanged = true;
    }
    if (this.context.level != null && this.context.level !== next.level) {
      reasons.push('LEVEL_CHANGED');
      forceAudit = true;
      characterContextChanged = true;
      partyContextChanged = true;
    }
    if (this.context.equipment != null && this.context.equipment !== next.equipment) {
      reasons.push('EQUIPMENT_CHANGED');
      characterContextChanged = true;
      partyContextChanged = true;
    }
    if (this.context.party != null && this.context.party !== next.party) {
      reasons.push('PARTY_CHANGED');
      partyContextChanged = true;
    }

    const firstSnapshot = this.context.character == null;
    if (firstSnapshot) {
      reasons.push('FIRST_SNAPSHOT');
      forceAudit = true;
      characterContextChanged = true;
      partyContextChanged = true;
    }
    this.context = next;

    let auditResult = null;
    if (forceAudit || this.lastCheckedAt == null || now - this.lastCheckedAt >= this.auditIntervalMs) {
      auditResult = this.audit(reasons[0] || 'PERIODIC', { force: forceAudit });
    }
    return {
      catalogChanged: !!(auditResult && auditResult.changed),
      characterContextChanged,
      partyContextChanged,
      reasons,
      audit: auditResult
    };
  }

  noteIndependentDrift(skillId, kind = 'DRIFT', observedFingerprint = null) {
    if (!this.records.size || !this.fingerprint) return false;
    const now = this.now();
    this.state = SkillCatalogState.DRIFT_DETECTED;
    this.pendingVerificationFingerprint = this.fingerprint;
    this.lastReason = `CONTENT_DRIFT_${String(kind || 'DRIFT')}`;
    this.lastChange = {
      at: now,
      reason: this.lastReason,
      fingerprint: this.fingerprint,
      generation: this.generation,
      independentMonitor: true,
      skill: skillId == null ? null : String(skillId),
      observedFingerprint: observedFingerprint == null ? null : String(observedFingerprint)
    };
    this.stats.driftEvents += 1;
    this._event('SKILL_CATALOG_INDEPENDENT_DRIFT_SIGNAL', 'warn', this.lastReason, clone(this.lastChange, {}));
    return true;
  }

  get(skillId) {
    const row = this.records.get(String(skillId || ''));
    return row ? clone(row, null) : null;
  }

  list(options = {}) {
    const ctype = options.ctype == null ? null : String(options.ctype).toLowerCase();
    const rows = [...this.records.values()]
      .filter((row) => !ctype || row.classes.includes(ctype))
      .sort((a, b) => a.requiredLevel - b.requiredLevel || a.id.localeCompare(b.id));
    return rows.map((row) => clone(row, {}));
  }

  combatReady() {
    return this.state === SkillCatalogState.READY;
  }

  status() {
    return {
      schemaVersion: 1,
      mode: 'live-g-skills-validated-catalog-v1',
      state: this.state,
      combatReady: this.combatReady(),
      generation: this.generation,
      fingerprint: this.fingerprint,
      skills: this.records.size,
      supportedClassSkills: [...this.records.values()].filter((row) => row.classSupported).length,
      automationValidatedSkills: [...this.records.values()].filter((row) => row.automationValidated).length,
      builtAt: this.builtAt,
      lastCheckedAt: this.lastCheckedAt,
      lastGoodAt: this.lastGoodAt,
      lastReason: this.lastReason,
      lastError: this.lastError,
      lastChange: clone(this.lastChange, null),
      pendingVerification: this.pendingVerificationFingerprint != null,
      auditIntervalMs: this.auditIntervalMs,
      connectionGapMs: this.connectionGapMs,
      context: { ...this.context },
      stats: { ...this.stats }
    };
  }
}

module.exports = {
  SkillCatalogService,
  SkillCatalogState,
  SUPPORTED_CLASSES,
  normalizeLiveSkill,
  diffCatalog
};
