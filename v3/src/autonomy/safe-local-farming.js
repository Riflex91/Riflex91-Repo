'use strict';

const { LocalSpawnNavigator } = require('./local-farming');

class SafeLocalSpawnNavigator extends LocalSpawnNavigator {
  constructor(options = {}) {
    super(options);
    this.minLearnedConfidence = Math.max(0.02, Math.min(1, Number(options.minLearnedConfidence) || 0.10));
    this.evaluationMode = null;
  }

  _withMode(context, callback) {
    const previous = this.evaluationMode;
    this.evaluationMode = context && context.adapter && context.adapter.mode || null;
    try { return callback(); } finally { this.evaluationMode = previous; }
  }

  _safeSpawns(snapshot, gameData, world, party) {
    const rows = super._safeSpawns(snapshot, gameData, world, party);
    return rows.filter((row) => {
      const disposition = row && row.spawn && row.spawn.disposition;
      if (disposition === 'APPROVED') return true;
      if (disposition !== 'LEGACY_ALLOWED') return false;
      if (Number(row.confidence) >= this.minLearnedConfidence && row.source === 'measured-spawn') return true;
      return this.evaluationMode === 'shadow';
    });
  }

  candidates(context = {}) {
    return this._withMode(context, () => super.candidates(context));
  }

  step(context = {}, preference = null) {
    return this._withMode(context, () => super.step(context, preference));
  }

  status(context = null) {
    return this._withMode(context, () => ({
      ...super.status(context),
      legacyRequiresLearnedConfidence: true,
      minLearnedConfidence: this.minLearnedConfidence,
      unlearnedLegacyShadowPreviewOnly: true
    }));
  }
}

module.exports = { SafeLocalSpawnNavigator };
