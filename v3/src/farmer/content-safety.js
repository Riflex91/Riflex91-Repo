'use strict';

const { EvidenceKind } = require('../world/world-model');

const ContentDisposition = Object.freeze({
  LEGACY_ALLOWED: 'LEGACY_ALLOWED',
  APPROVED: 'APPROVED',
  QUARANTINED: 'QUARANTINED'
});

const BUILT_IN_DANGEROUS_MONSTERS = Object.freeze(['redfairy', 'greenfairy', 'bluefairy']);
const BUILT_IN_DANGEROUS_SET = new Set(BUILT_IN_DANGEROUS_MONSTERS);

function normalizeMonsterType(value) {
  const id = String(value || '').trim();
  if (!id) throw new Error('monster type must be a non-empty string');
  return id;
}

class ContentSafetyGate {
  constructor(options = {}) {
    this.log = options.log || null;
    this.now = options.now || (() => Date.now());
    this.policyType = 'monster-policy';
    this.dispositionFact = 'contentSafetyDisposition';
    this.maxStatusEntries = Math.max(10, Math.min(500, Number(options.maxStatusEntries) || 100));
    this.lastDecision = null;
  }

  _fact(world, mtype, name) {
    if (!world || typeof world.fact !== 'function') return null;
    const fact = world.fact(this.policyType, mtype, name);
    return fact && fact.value != null ? fact.value : null;
  }

  _write(world, mtype, disposition, reason, event) {
    if (!world || typeof world.observeEntity !== 'function') return null;
    const id = normalizeMonsterType(mtype);
    const at = this.now();
    world.observeEntity(this.policyType, id, {
      [this.dispositionFact]: disposition,
      contentSafetyReason: reason,
      contentSafetyUpdatedAt: at
    }, { evidence: EvidenceKind.INFERRED, confidence: 1 });
    const record = { at, monsterType: id, disposition, reason };
    this.lastDecision = record;
    if (this.log && event) {
      this.log.emit({
        component: 'content-safety',
        event,
        severity: disposition === ContentDisposition.QUARANTINED ? 'warn' : 'info',
        reason,
        data: record
      });
    }
    return record;
  }

  approve(world, mtype) {
    const id = normalizeMonsterType(mtype);
    if (BUILT_IN_DANGEROUS_SET.has(id)) {
      return this._write(world, id, ContentDisposition.QUARANTINED, 'BUILT_IN_DANGEROUS_SPECIAL', 'CONTENT_MONSTER_BUILT_IN_BLOCKED');
    }
    return this._write(world, id, ContentDisposition.APPROVED, 'OPERATOR_APPROVED', 'CONTENT_MONSTER_APPROVED');
  }

  quarantine(world, mtype) {
    return this._write(world, mtype, ContentDisposition.QUARANTINED, 'OPERATOR_QUARANTINED', 'CONTENT_MONSTER_QUARANTINED');
  }

  evaluate(entity, world) {
    if (!entity || !entity.mtype) {
      return { allowed: true, reason: 'CONTENT_SAFETY_NOT_APPLICABLE', disposition: null, monsterType: null };
    }
    const mtype = String(entity.mtype);

    // Hard safety boundary. These special fairies can exist in old persisted
    // world data and therefore used to inherit LEGACY_ALLOWED. Built-in safety
    // always wins over migration state and cannot be overridden by approve().
    if (BUILT_IN_DANGEROUS_SET.has(mtype)) {
      const validWorld = world && typeof world.fact === 'function' && typeof world.observeEntity === 'function';
      const disposition = validWorld ? this._fact(world, mtype, this.dispositionFact) : null;
      const reason = validWorld ? this._fact(world, mtype, 'contentSafetyReason') : null;
      if (validWorld && (disposition !== ContentDisposition.QUARANTINED || reason !== 'BUILT_IN_DANGEROUS_SPECIAL')) {
        this._write(world, mtype, ContentDisposition.QUARANTINED, 'BUILT_IN_DANGEROUS_SPECIAL', 'CONTENT_MONSTER_BUILT_IN_BLOCKED');
      }
      const result = {
        allowed: false,
        reason: 'BUILT_IN_DANGEROUS_SPECIAL',
        disposition: ContentDisposition.QUARANTINED,
        monsterType: mtype
      };
      this.lastDecision = { at: this.now(), ...result };
      return result;
    }

    if (!world || typeof world.hasEntity !== 'function' || typeof world.fact !== 'function' || typeof world.observeEntity !== 'function') {
      const result = { allowed: false, reason: 'CONTENT_SAFETY_UNAVAILABLE', disposition: null, monsterType: mtype };
      this.lastDecision = { at: this.now(), ...result };
      return result;
    }

    const disposition = this._fact(world, mtype, this.dispositionFact);
    if (disposition === ContentDisposition.APPROVED || disposition === ContentDisposition.LEGACY_ALLOWED) {
      const result = { allowed: true, reason: disposition === ContentDisposition.APPROVED ? 'CONTENT_APPROVED' : 'CONTENT_LEGACY_ALLOWED', disposition, monsterType: mtype };
      this.lastDecision = { at: this.now(), ...result };
      return result;
    }
    if (disposition === ContentDisposition.QUARANTINED) {
      const result = { allowed: false, reason: 'CONTENT_QUARANTINED', disposition, monsterType: mtype };
      this.lastDecision = { at: this.now(), ...result };
      return result;
    }

    // Migration boundary: monster types already present in the persistent world
    // before alpha.8.12 remain eligible. Truly new types are quarantined before
    // Discovery records them as known world entities later in the same tick.
    if (world.hasEntity('monster', mtype)) {
      this._write(world, mtype, ContentDisposition.LEGACY_ALLOWED, 'PRE_ALPHA_8_12_KNOWN', 'CONTENT_MONSTER_LEGACY_ALLOWED');
      return { allowed: true, reason: 'CONTENT_LEGACY_ALLOWED', disposition: ContentDisposition.LEGACY_ALLOWED, monsterType: mtype };
    }

    this._write(world, mtype, ContentDisposition.QUARANTINED, 'NEW_MONSTER_TYPE', 'CONTENT_MONSTER_QUARANTINED');
    return { allowed: false, reason: 'CONTENT_QUARANTINED', disposition: ContentDisposition.QUARANTINED, monsterType: mtype, cause: 'NEW_MONSTER_TYPE' };
  }

  status(world) {
    const rows = [];
    if (world && world.entities instanceof Map) {
      for (const entity of world.entities.values()) {
        if (!entity || entity.type !== this.policyType) continue;
        const mtype = String(entity.id);
        const disposition = this._fact(world, mtype, this.dispositionFact);
        if (!Object.values(ContentDisposition).includes(disposition)) continue;
        rows.push({
          monsterType: mtype,
          disposition,
          reason: this._fact(world, mtype, 'contentSafetyReason'),
          updatedAt: this._fact(world, mtype, 'contentSafetyUpdatedAt')
        });
      }
    }
    rows.sort((a, b) => String(a.monsterType).localeCompare(String(b.monsterType)));
    const counts = { LEGACY_ALLOWED: 0, APPROVED: 0, QUARANTINED: 0 };
    for (const row of rows) counts[row.disposition] += 1;
    return {
      enabled: true,
      unknownDefault: ContentDisposition.QUARANTINED,
      builtInDangerous: BUILT_IN_DANGEROUS_MONSTERS.slice(),
      policyType: this.policyType,
      counts,
      quarantined: rows.filter((row) => row.disposition === ContentDisposition.QUARANTINED).slice(0, this.maxStatusEntries),
      approved: rows.filter((row) => row.disposition === ContentDisposition.APPROVED).slice(0, this.maxStatusEntries),
      legacyAllowed: rows.filter((row) => row.disposition === ContentDisposition.LEGACY_ALLOWED).slice(0, this.maxStatusEntries),
      lastDecision: this.lastDecision
    };
  }
}

module.exports = {
  ContentSafetyGate,
  ContentDisposition,
  BUILT_IN_DANGEROUS_MONSTERS,
  normalizeMonsterType
};
