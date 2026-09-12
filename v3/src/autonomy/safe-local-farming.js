'use strict';

const { LocalSpawnNavigator } = require('./local-farming');

class SafeLocalSpawnNavigator extends LocalSpawnNavigator {
  constructor(options = {}) {
    super(options);
    this.minLearnedConfidence = Math.max(0.02, Math.min(1, Number(options.minLearnedConfidence) || 0.10));
  }

  _safeSpawns(snapshot, gameData, world, party) {
    const rows = super._safeSpawns(snapshot, gameData, world, party);
    return rows.filter((row) => {
      const disposition = row && row.spawn && row.spawn.disposition;
      if (disposition === 'APPROVED') return true;
      if (disposition !== 'LEGACY_ALLOWED') return false;
      return Number(row.confidence) >= this.minLearnedConfidence;
    });
  }

  status(context = null) {
    return {
      ...super.status(context),
      legacyRequiresLearnedConfidence: true,
      minLearnedConfidence: this.minLearnedConfidence
    };
  }
}

module.exports = { SafeLocalSpawnNavigator };
