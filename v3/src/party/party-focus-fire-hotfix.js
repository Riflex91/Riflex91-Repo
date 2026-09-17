'use strict';

const PARTY_FOCUS_FIRE_MODE = 'safe-visible-party-focus-v1';

function distance(a, b) {
  if (!a || !b || a.x == null || a.y == null || b.x == null || b.y == null) return Infinity;
  return Math.hypot(Number(a.x) - Number(b.x), Number(a.y) - Number(b.y));
}

class PartyFocusFireHotfix {
  constructor(runtime, options = {}) {
    if (!runtime || !runtime.farmer) throw new Error('runtime farmer required');
    this.runtime = runtime;
    this.farmer = runtime.farmer;
    this.now = runtime.now || (() => Date.now());
    this.log = runtime.log || null;
    this.maxFocusDistance = Math.max(100, Number(options.maxFocusDistance) || 320);
    this.lastDecision = null;
    this.stats = {
      selectionFocusHits: 0,
      reassessmentFocusSwitches: 0,
      anchorUnavailable: 0,
      unsafeOrInvisibleFocusRejected: 0,
      selfDefenseOverrides: 0,
      distanceRejected: 0
    };
    this.installed = false;
    this._install();
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    try { this.log.emit({ component: 'party-focus-fire', event, severity, reason, data }); } catch (_) {}
  }

  _combatNames(snapshot) {
    const rows = [];
    const self = snapshot && snapshot.character;
    if (self && self.name && self.ctype !== 'merchant') rows.push({ name: String(self.name), type: self.ctype || null });
    for (const member of snapshot && snapshot.party || []) {
      if (!member || !member.name) continue;
      const type = member.type || null;
      if (type === 'merchant') continue;
      rows.push({ name: String(member.name), type });
    }
    return [...new Map(rows.map((row) => [row.name, row])).values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  _anchorName(snapshot) {
    const rows = this._combatNames(snapshot);
    return rows.length ? rows[0].name : null;
  }

  _anchorTargetId(snapshot, anchorName) {
    if (!snapshot || !snapshot.character || !anchorName) return null;
    if (snapshot.character.name === anchorName) return snapshot.character.target == null ? null : String(snapshot.character.target);
    const entity = (snapshot.entities || []).find((row) => row && row.name === anchorName);
    return entity && entity.target != null ? String(entity.target) : null;
  }

  _safeCandidateSet(context) {
    const farmer = this.farmer;
    if (!farmer || typeof farmer._candidateRows !== 'function') return { rows: [], monsters: [] };
    try {
      const result = farmer._candidateRows(context) || {};
      return {
        rows: Array.isArray(result.rows) ? result.rows : [],
        monsters: Array.isArray(result.monsters) ? result.monsters : []
      };
    } catch (_) {
      return { rows: [], monsters: [] };
    }
  }

  _focusTarget(context) {
    const snapshot = context && context.snapshot;
    const self = snapshot && snapshot.character;
    if (!snapshot || !self) return null;
    const anchorName = this._anchorName(snapshot);
    if (!anchorName || anchorName === self.name) return null;
    const targetId = this._anchorTargetId(snapshot, anchorName);
    if (!targetId) {
      this.stats.anchorUnavailable += 1;
      return null;
    }

    const { rows, monsters } = this._safeCandidateSet(context);
    const target = monsters.find((row) => row && String(row.id) === targetId) || null;
    if (!target) {
      this.stats.unsafeOrInvisibleFocusRejected += 1;
      return null;
    }
    const d = distance(self, target);
    if (!Number.isFinite(d) || d > this.maxFocusDistance) {
      this.stats.distanceRejected += 1;
      return null;
    }

    let ranking = rows.find((row) => row && String(row.monster || row.id) === String(target.mtype)) || null;
    if (this.farmer.planner && typeof this.farmer.planner.rank === 'function' && rows.length) {
      try {
        const ranked = this.farmer.planner.rank(rows, {
          character: self.name,
          partyFingerprint: context.party && context.party.fingerprint || null
        });
        ranking = ranked.find((row) => row && String(row.monster || row.id) === String(target.mtype)) || ranking;
      } catch (_) {}
    }
    ranking = {
      ...(ranking || {}),
      id: ranking && ranking.id || target.mtype,
      monster: ranking && ranking.monster || target.mtype,
      score: Number.isFinite(Number(ranking && ranking.score)) ? Number(ranking.score) : 0,
      source: `party-focus:${ranking && ranking.source || 'live'}`,
      confidence: Number.isFinite(Number(ranking && ranking.confidence)) ? Number(ranking.confidence) : 0,
      travelSeconds: Number.isFinite(Number(ranking && ranking.travelSeconds)) ? Number(ranking.travelSeconds) : d / Math.max(1, Number(self.speed) || 40)
    };
    return { anchorName, target, ranking, distance: d };
  }

  _currentIsSelfDefense(snapshot, target) {
    return !!(snapshot && snapshot.character && target && target.target === snapshot.character.name);
  }

  _installSelection() {
    const farmer = this.farmer;
    if (typeof farmer._selectTarget !== 'function' || farmer.__partyFocusSelectionInstalled) return;
    const base = farmer._selectTarget.bind(farmer);
    farmer._selectTarget = (context) => {
      const normal = base(context);
      const focus = this._focusTarget(context);
      if (!focus) return normal;
      if (normal && normal.target && this._currentIsSelfDefense(context.snapshot, normal.target)) {
        this.stats.selfDefenseOverrides += 1;
        return normal;
      }
      this.stats.selectionFocusHits += 1;
      this.lastDecision = {
        at: this.now(),
        reason: 'VISIBLE_SAFE_PARTY_ANCHOR_TARGET',
        anchorName: focus.anchorName,
        targetId: String(focus.target.id),
        targetType: focus.target.mtype || null,
        distance: focus.distance
      };
      this._event('FARMER_PARTY_FOCUS_SELECTED', 'info', this.lastDecision.reason, { ...this.lastDecision });
      return { target: focus.target, ranking: focus.ranking };
    };
    farmer.__partyFocusSelectionInstalled = true;
  }

  _installReassessment() {
    const farmer = this.farmer;
    if (typeof farmer._maybeReassessTarget !== 'function' || farmer.__partyFocusReassessmentInstalled) return;
    const base = farmer._maybeReassessTarget.bind(farmer);
    farmer._maybeReassessTarget = (context, target) => {
      const normal = base(context, target);
      const snapshot = context && context.snapshot;
      if (this._currentIsSelfDefense(snapshot, target) || this._currentIsSelfDefense(snapshot, normal)) {
        this.stats.selfDefenseOverrides += 1;
        return normal;
      }
      const focus = this._focusTarget(context);
      if (!focus || !focus.target || String(focus.target.id) === String(normal && normal.id)) return normal;

      const cooldown = farmer.targetReassessment && Number(farmer.targetReassessment.switchCooldownMs) || 2500;
      if (Number.isFinite(Number(farmer.lastTargetSwitchAt)) && this.now() - Number(farmer.lastTargetSwitchAt) < cooldown) return normal;

      const previous = normal || target;
      farmer.targetId = String(focus.target.id);
      farmer.targetType = focus.target.mtype || null;
      farmer.lastTargetSwitchAt = this.now();
      farmer.lastTargetSwitch = {
        at: this.now(),
        reason: 'PARTY_FOCUS_ANCHOR',
        fromTargetId: previous && previous.id || null,
        fromTargetType: previous && previous.mtype || null,
        toTargetId: focus.target.id || null,
        toTargetType: focus.target.mtype || null,
        anchorName: focus.anchorName,
        distance: focus.distance
      };
      this.stats.reassessmentFocusSwitches += 1;
      this.lastDecision = { ...farmer.lastTargetSwitch };
      farmer._event('FARMER_PARTY_FOCUS_SWITCHED', 'info', 'PARTY_FOCUS_ANCHOR', { ...farmer.lastTargetSwitch });
      return focus.target;
    };
    farmer.__partyFocusReassessmentInstalled = true;
  }

  _install() {
    this._installSelection();
    this._installReassessment();
    this.installed = true;
    this._event('PARTY_FOCUS_FIRE_HOTFIX_INSTALLED', 'info', null, { maxFocusDistance: this.maxFocusDistance });
  }

  status() {
    return {
      schemaVersion: 1,
      mode: PARTY_FOCUS_FIRE_MODE,
      installed: this.installed,
      maxFocusDistance: this.maxFocusDistance,
      strategy: 'lexicographically-first-visible-combat-member-anchor',
      selfDefensePriority: true,
      communicationRequired: false,
      lastDecision: this.lastDecision ? { ...this.lastDecision } : null,
      stats: { ...this.stats }
    };
  }
}

function installPartyFocusFireHotfix(runtime, options = {}) {
  return new PartyFocusFireHotfix(runtime, options);
}

module.exports = { PartyFocusFireHotfix, installPartyFocusFireHotfix, PARTY_FOCUS_FIRE_MODE };
