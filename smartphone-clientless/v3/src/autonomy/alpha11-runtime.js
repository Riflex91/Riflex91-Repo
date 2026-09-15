'use strict';

const { Alpha10Runtime } = require('./alpha10-runtime');
const { CharacterRegistry } = require('../party/character-registry');

class Alpha11Runtime extends Alpha10Runtime {
  constructor(options = {}) {
    super(options);
    this.characterRegistry = options.characterRegistry || new CharacterRegistry({
      now: this.now,
      log: this.log,
      capacity: options.characterRegistryCapacity,
      staleAfterMs: options.characterRegistryStaleAfterMs,
      maxInventoryItems: options.characterRegistryMaxInventoryItems,
      roster: options.characterRoster
    });
    this.partyObservationMs = Math.max(500, Math.min(60000, Number(options.partyObservationMs) || 1000));
    this.lastPartyObservation = -Infinity;
  }

  _partyObservation() {
    const snapshot = this.lastSnapshot;
    if (!snapshot || !snapshot.character) return null;
    return this.characterRegistry.observe({
      snapshot,
      gameData: this.adapter.getGameData() || {},
      liveCharacter: this.root && (this.root.character || (this.root.parent && this.root.parent.character)) || null
    });
  }

  tick() {
    super.tick();
    const now = this.now();
    if (now - this.lastPartyObservation < this.partyObservationMs) return;
    this.lastPartyObservation = now;
    this._partyObservation();
  }

  status() {
    const base = super.status();
    return {
      ...base,
      party: {
        ...(base.party || {}),
        observationIntervalMs: this.partyObservationMs,
        registry: this.characterRegistry.status()
      }
    };
  }

  exportDiagnostics() {
    const base = JSON.parse(super.exportDiagnostics());
    base.context = base.context || {};
    base.context.party = {
      observationIntervalMs: this.partyObservationMs,
      registry: this.characterRegistry.status()
    };
    return JSON.stringify(base, null, 2);
  }
}

module.exports = { Alpha11Runtime };
