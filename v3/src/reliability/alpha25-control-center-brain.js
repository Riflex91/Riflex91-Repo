'use strict';

const { ControlPlaneConfig } = require('../control/control-plane-config');
const { CloudControlPlane } = require('../control/cloud-control-plane');
const { StrategicBrainV2 } = require('../brain/strategic-brain-v2');
const { boundedOptions, synchronizeLegacyUpgradePolicy, synchronizeLegacyCompoundPolicy } = require('./alpha27-combat-merchant-convergence');

const ALPHA25_MODE = 'alpha25-control-center-brain-v2';
const PROGRESSION_SETTING_KEYS = Object.freeze(['economy.maxUpgrade', 'economy.maxCompound']);
const ADVENTURE_LAND_ASSET_BASE = 'https://adventure.land/';
const EQUIPMENT_SHADE_SKINS = Object.freeze({
  earring1: 'shade_earring', helmet: 'shade_helmet', earring2: 'shade_earring', amulet: 'shade_amulet',
  mainhand: 'shade_mainhand', chest: 'shade_chest', offhand: 'shade_offhand', cape: 'shade20_cape',
  ring1: 'shade_ring', pants: 'shade_pants', ring2: 'shade_ring', orb: 'shade20_orb',
  belt: 'shade_belt', shoes: 'shade_shoes', gloves: 'shade_gloves', elixir: 'shade20_elixir'
});

function adventureLandAssetUrl(file) {
  const value = String(file == null ? '' : file).trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('//')) return `https:${value}`;
  return ADVENTURE_LAND_ASSET_BASE + value.replace(/^\/+/, '');
}

function gameDataSources(runtime) {
  const sources = [];
  const add = (value) => {
    if (!value || typeof value !== 'object' || sources.includes(value)) return;
    sources.push(value);
  };
  try {
    if (runtime && runtime.adapter && typeof runtime.adapter.getGameData === 'function') add(runtime.adapter.getGameData());
  } catch (_) {}
  try { add(runtime && runtime.adapter && runtime.adapter.root && runtime.adapter.root.G); } catch (_) {}
  try { add(runtime && runtime.adapter && runtime.adapter.parent && runtime.adapter.parent.G); } catch (_) {}
  try { add(runtime && runtime.root && runtime.root.G); } catch (_) {}
  try { add(runtime && runtime.root && runtime.root.parent && runtime.root.parent.G); } catch (_) {}
  return sources;
}

function mergeGameData(runtime) {
  const merged = { items: {}, positions: {}, imagesets: {} };
  for (const source of gameDataSources(runtime)) {
    for (const [name, def] of Object.entries(source && source.items || {})) {
      if (!def || typeof def !== 'object' || Array.isArray(def)) continue;
      const existing = merged.items[name];
      merged.items[name] = existing ? { ...def, ...existing } : { ...def };
    }
    for (const [skin, position] of Object.entries(source && source.positions || {})) {
      if (!Array.isArray(position) || Array.isArray(merged.positions[skin])) continue;
      merged.positions[skin] = position.slice();
    }
    for (const [packName, pack] of Object.entries(source && source.imagesets || {})) {
      if (!pack || typeof pack !== 'object' || Array.isArray(pack)) continue;
      const existing = merged.imagesets[packName];
      merged.imagesets[packName] = existing ? { ...pack, ...existing } : { ...pack };
    }
  }
  return merged;
}

function positionFromImageSets(gameData, skin) {
  for (const [packName, pack] of Object.entries(gameData && gameData.imagesets || {})) {
    const matrix = Array.isArray(pack && pack.matrix) ? pack.matrix : [];
    for (let y = 0; y < matrix.length; y += 1) {
      const row = Array.isArray(matrix[y]) ? matrix[y] : [];
      for (let x = 0; x < row.length; x += 1) {
        const cell = row[x];
        if (cell === skin || (Array.isArray(cell) && cell.includes(skin))) return [packName, x, y];
      }
    }
  }
  return null;
}

function spritePosition(gameData, skin) {
  const direct = skin && gameData && gameData.positions && gameData.positions[skin];
  return Array.isArray(direct) ? direct : positionFromImageSets(gameData, skin);
}

function inferredImageSetRows(gameData, packName, pack) {
  const explicit = Number(pack && pack.rows);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  if (Array.isArray(pack && pack.matrix) && pack.matrix.length) return pack.matrix.length;
  let maxY = -1;
  for (const position of Object.values(gameData && gameData.positions || {})) {
    if (!Array.isArray(position) || (position[0] || 'pack_20') !== packName) continue;
    const y = Number(position[2]);
    if (Number.isFinite(y) && y >= 0) maxY = Math.max(maxY, y);
  }
  return maxY >= 0 ? maxY + 1 : null;
}

function spriteMeta(gameData, skin) {
  const position = spritePosition(gameData, skin);
  const packName = Array.isArray(position) && position[0] || 'pack_20';
  const pack = gameData && gameData.imagesets && gameData.imagesets[packName];
  const file = adventureLandAssetUrl(pack && pack.file);
  const x = Number(Array.isArray(position) ? position[1] : NaN);
  const y = Number(Array.isArray(position) ? position[2] : NaN);
  const size = Number(pack && pack.size);
  const columns = Number(pack && pack.columns);
  const rows = inferredImageSetRows(gameData, packName, pack);
  if (!skin || !file || !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(size) || size <= 0 || !Number.isFinite(columns) || columns <= 0 || !Number.isFinite(rows) || rows <= 0) return null;
  return { skin, file, x, y, size, columns, rows };
}

function liveCharacterOf(runtime) {
  try {
    return runtime && runtime.root && (runtime.root.character || runtime.root.parent && runtime.root.parent.character)
      || runtime && runtime.adapter && (runtime.adapter.root && runtime.adapter.root.character || runtime.adapter.parent && runtime.adapter.parent.character)
      || null;
  } catch (_) { return null; }
}

function itemSpriteCatalog(runtime, maxItems = 160) {
  const gameData = mergeGameData(runtime);
  let registry = null;
  try { registry = runtime && runtime.characterRegistry && typeof runtime.characterRegistry.status === 'function' ? runtime.characterRegistry.status() : null; } catch (_) {}
  const names = new Set();
  const add = (item) => {
    const name = String(item && item.name || '').trim();
    if (name && names.size < maxItems) names.add(name);
  };
  for (const character of registry && Array.isArray(registry.characters) ? registry.characters : []) {
    for (const item of Array.isArray(character && character.inventory) ? character.inventory : []) add(item);
    for (const item of Object.values(character && character.gear && typeof character.gear === 'object' ? character.gear : {})) add(item);
    if (names.size >= maxItems) break;
  }
  const snapshotCharacter = runtime && runtime.lastSnapshot && runtime.lastSnapshot.character;
  for (const item of Array.isArray(snapshotCharacter && snapshotCharacter.inventory) ? snapshotCharacter.inventory : []) add(item);
  const liveCharacter = liveCharacterOf(runtime);
  for (const item of Array.isArray(liveCharacter && liveCharacter.items) ? liveCharacter.items : []) add(item);
  for (const item of Object.values(liveCharacter && liveCharacter.slots && typeof liveCharacter.slots === 'object' ? liveCharacter.slots : {})) add(item);

  const catalog = {};
  for (const name of names) {
    const def = gameData.items && gameData.items[name];
    const skin = def && (def.skin_c || def.skin);
    const meta = spriteMeta(gameData, skin);
    if (meta) catalog[name] = meta;
  }
  return catalog;
}

function equipmentShadeCatalog(runtime) {
  const gameData = mergeGameData(runtime);
  const catalog = {};
  for (const [slot, skin] of Object.entries(EQUIPMENT_SHADE_SKINS)) {
    const meta = spriteMeta(gameData, skin);
    if (meta) catalog[slot] = meta;
  }
  return catalog;
}

function itemNpcCatalog(gameData) {
  const byItem = new Map();
  const add = (item, npc, map) => {
    const name = String(item || '').trim();
    if (!name) return;
    const rows = byItem.get(name) || [];
    const key = `${String(npc || 'npc')}|${String(map || '')}`;
    if (!rows.some((row) => row.key === key)) rows.push({ key, npc: String(npc || 'npc'), map: map || null });
    byItem.set(name, rows);
  };
  for (const [mapId, map] of Object.entries(gameData && gameData.maps || {})) {
    for (const raw of Array.isArray(map && (map.npcs || map.NPCs)) ? (map.npcs || map.NPCs) : []) {
      const npcId = Array.isArray(raw) ? raw[0] : raw && (raw.id || raw.npc);
      const def = gameData && gameData.npcs && gameData.npcs[npcId] || {};
      const stock = [].concat(def.items || def.sells || []);
      for (const row of stock) add(Array.isArray(row) ? row[0] : row && row.name || row, npcId, mapId);
    }
  }
  return byItem;
}

function observedAutomationItems(runtime, maxItems = 10000) {
  const observed = new Map();
  const add = (item, fallbackType = null) => {
    const name = String(item && item.name || '').trim();
    if (!name || observed.size >= maxItems) return;
    const prior = observed.get(name) || {};
    observed.set(name, {
      ...prior,
      name,
      type: prior.type || item && (item.metadataType || item.type) || fallbackType || null
    });
  };

  let registry = null;
  try { registry = runtime && runtime.characterRegistry && typeof runtime.characterRegistry.status === 'function' ? runtime.characterRegistry.status() : null; } catch (_) {}
  for (const character of registry && Array.isArray(registry.characters) ? registry.characters : []) {
    for (const item of Array.isArray(character && character.inventory) ? character.inventory : []) add(item);
    for (const item of Object.values(character && character.gear && typeof character.gear === 'object' ? character.gear : {})) add(item);
  }

  const snapshotCharacter = runtime && runtime.lastSnapshot && runtime.lastSnapshot.character;
  for (const item of Array.isArray(snapshotCharacter && snapshotCharacter.inventory) ? snapshotCharacter.inventory : []) add(item);

  const liveCharacter = liveCharacterOf(runtime);
  for (const item of Array.isArray(liveCharacter && liveCharacter.items) ? liveCharacter.items : []) add(item);
  for (const item of Object.values(liveCharacter && liveCharacter.slots && typeof liveCharacter.slots === 'object' ? liveCharacter.slots : {})) add(item);

  try {
    const rows = runtime && runtime.inventoryLedger && typeof runtime.inventoryLedger.list === 'function'
      ? runtime.inventoryLedger.list(maxItems)
      : [];
    for (const row of rows) add(row, row && row.metadataType);
  } catch (_) {}

  try {
    const bankStatus = runtime && runtime.merchantBankCatalog && typeof runtime.merchantBankCatalog.status === 'function'
      ? runtime.merchantBankCatalog.status()
      : null;
    const bankRows = bankStatus && bankStatus.snapshot && Array.isArray(bankStatus.snapshot.rows) ? bankStatus.snapshot.rows : [];
    for (const row of bankRows) add(row);
  } catch (_) {}

  return observed;
}

function itemAutomationCatalog(runtime, maxItems = 10000) {
  const merged = mergeGameData(runtime);
  const gameData = { ...merged, maps: {}, npcs: {} };
  for (const source of gameDataSources(runtime)) {
    for (const [mapId, map] of Object.entries(source && source.maps || {})) {
      if (!map || typeof map !== 'object' || Array.isArray(map)) continue;
      const existing = gameData.maps[mapId];
      gameData.maps[mapId] = existing ? { ...map, ...existing } : { ...map };
    }
    for (const [npcId, npc] of Object.entries(source && source.npcs || {})) {
      if (!npc || typeof npc !== 'object' || Array.isArray(npc)) continue;
      const existing = gameData.npcs[npcId];
      gameData.npcs[npcId] = existing ? { ...npc, ...existing } : { ...npc };
    }
  }

  const observed = observedAutomationItems(runtime, maxItems);
  const ids = new Set(Object.keys(gameData.items || {}));
  for (const id of observed.keys()) {
    if (ids.size >= maxItems) break;
    ids.add(id);
  }

  const npcByItem = itemNpcCatalog(gameData);
  const inventorySprites = itemSpriteCatalog(runtime, maxItems);
  const rows = [];
  for (const id of [...ids].slice(0, maxItems)) {
    const observedRow = observed.get(id) || {};
    const def = gameData.items && gameData.items[id];
    const meta = def && typeof def === 'object' && !Array.isArray(def) ? def : {};
    const classes = [].concat(meta.class || meta.classes || []).map((value) => String(value || '').toLowerCase()).filter(Boolean);
    const level = Number(meta.level != null ? meta.level : meta.req != null ? meta.req : meta.requirement);
    const skin = meta.skin_c || meta.skin || inventorySprites[id] && inventorySprites[id].skin || null;
    rows.push({
      id,
      name: meta.name || observedRow.name || id,
      type: meta.type || observedRow.type || null,
      wtype: meta.wtype || null,
      level: Number.isFinite(level) ? level : null,
      grade: Number.isFinite(Number(meta.grade)) ? Number(meta.grade) : null,
      classes,
      npc: (npcByItem.get(id) || []).map(({ npc, map }) => ({ npc, map })),
      upgrade: !!meta.upgrade,
      compound: !!meta.compound,
      exchange: !!(meta.exchange || meta.e),
      quest: !!(meta.quest || meta.q),
      cash: !!meta.cash,
      soulbound: !!meta.soulbound,
      special: !!meta.special,
      goldValue: Number.isFinite(Number(meta.g)) ? Number(meta.g) : null,
      skin,
      sprite: spriteMeta(gameData, skin) || inventorySprites[id] || null,
      observed: observed.has(id)
    });
  }
  rows.sort((a, b) => String(a.name || a.id).localeCompare(String(b.name || b.id)));
  return rows;
}

const ADVENTURE_LAND_ITEM_SURFACE_VERSION = 2;

function installAdventureLandItemSprites(runtime, cloud) {
  if (!cloud || typeof cloud._runtimeSnapshot !== 'function') return false;
  if (Number(cloud.__adventureLandItemSurfaceVersion || 0) >= ADVENTURE_LAND_ITEM_SURFACE_VERSION) return false;
  const originalRuntimeSnapshot = cloud._runtimeSnapshot.bind(cloud);
  cloud._runtimeSnapshot = () => {
    const snapshot = originalRuntimeSnapshot();
    if (snapshot && typeof snapshot === 'object') {
      snapshot.itemSprites = itemSpriteCatalog(runtime);
      snapshot.equipmentShades = equipmentShadeCatalog(runtime);
      const liveCharacter = runtime && runtime.lastSnapshot && runtime.lastSnapshot.character;
      if (liveCharacter && String(liveCharacter.ctype || '').toLowerCase() === 'merchant') snapshot.automationCatalog = itemAutomationCatalog(runtime);
      if (snapshot.character && Number.isFinite(Number(liveCharacter && liveCharacter.isize))) {
        snapshot.character.isize = Math.max(0, Math.floor(Number(liveCharacter.isize)));
      }
    }
    return snapshot;
  };
  cloud.__adventureLandItemSpritesInstalled = true;
  cloud.__adventureLandItemSurfaceVersion = ADVENTURE_LAND_ITEM_SURFACE_VERSION;
  return true;
}

class Alpha25ControlCenterBrain {
  constructor(runtime, options = {}) {
    if (!runtime) throw new Error('runtime required');
    this.runtime = runtime;
    this.now = runtime.now || (() => Date.now());
    this.log = runtime.log || null;
    this.installedAt = this.now();
    this.legacyBrain = runtime.brain || null;
    this.controlPlane = runtime.controlPlane || new ControlPlaneConfig({ root: runtime.root, now: this.now, log: this.log });
    runtime.controlPlane = this.controlPlane;
    this.brain = runtime.strategicBrainV2 || new StrategicBrainV2({ runtime, root: runtime.root, now: this.now, log: this.log, controlPlane: this.controlPlane, legacyBrain: this.legacyBrain });
    runtime.legacyShadowBrain = this.legacyBrain;
    runtime.strategicBrainV2 = this.brain;
    runtime.brain = this.brain;
    this.cloud = runtime.cloudControlPlane || new CloudControlPlane({ runtime, root: runtime.root, now: this.now, log: this.log, controlPlane: this.controlPlane, brain: this.brain, onSettingsChanged: (changed) => this._applyExtendedSettings(changed) });
    runtime.cloudControlPlane = this.cloud;
    installAdventureLandItemSprites(runtime, this.cloud);
    this.lastCycleAt = 0;
    this.progressionPolicyTarget = runtime.alpha27CombatMerchantConvergence || null;
    this.stats = { ticks: 0, outcomes: 0, remoteEncounterOutcomes: 0, remoteEncounterOutcomeBatches: 0, remoteEncounterOutcomeSkips: 0, cloudCyclesStarted: 0, cloudCycleErrors: 0, localPatches: 0, remoteExtendedPatches: 0, extendedSettingsApplied: 0, lateProgressionPolicySyncs: 0 };
    this.controlPlane.applyHot(runtime);
    this._applyExtendedSettings();
    if (this.cloud.autoEnableSuggested && this.cloud.status().ready && this.controlPlane.get('cloud.enabled', false) !== true) {
      const source = this.cloud.legacyCredentialsMigrated ? 'v2-cloud-credential-migration' : 'global-cloud-config';
      this.patchSettings({ 'cloud.enabled': true }, source);
    }
    if (this.log) this.log.emit({ component: 'alpha25-control-center', event: 'ALPHA25_CONTROL_CENTER_BRAIN_INSTALLED', data: this.status() });
  }

  _applyExtendedSettings(keys = null) {
    const selected = Array.isArray(keys) ? new Set(keys.map((row) => typeof row === 'string' ? row : row && row.key).filter(Boolean)) : null;
    const apply = (key, fn) => {
      if (selected && !selected.has(key)) return;
      const value = this.controlPlane.get(key);
      if (value == null) return;
      try { fn(value); this.stats.extendedSettingsApplied += 1; } catch (_) {}
    };
    const farmer = this.runtime.farmer;
    if (farmer && farmer.config) apply('combat.recoveryHpRatio', (value) => { farmer.config.recoverHpRatio = Number(value); });
    const base = this.runtime.merchantEconomyAutonomy;
    if (base && base.cfg) {
      const map = {
        'merchant.lowFreeSlots': 'lowSlots', 'merchant.targetFreeSlots': 'targetSlots', 'merchant.potionLow': 'potionLow', 'merchant.potionTarget': 'potionTarget', 'merchant.goldReserve': 'goldReserve', 'merchant.transferRange': 'transferRange',
        'economy.keepValue': 'keepValue', 'economy.upgradeCap': 'upgradeCap', 'economy.compoundCap': 'compoundCap'
      };
      for (const [key, property] of Object.entries(map)) apply(key, (value) => { base.cfg[property] = Number(value); });
    }

    const alpha27 = this.runtime.alpha27CombatMerchantConvergence;
    apply('economy.maxUpgrade', (value) => {
      const current = alpha27 && alpha27.options && typeof alpha27.options === 'object' ? alpha27.options : {};
      const limit = boundedOptions({ ...current, maxUpgradeLevel: Number(value) }).maxUpgradeLevel;
      if (alpha27 && alpha27.options) alpha27.options.maxUpgradeLevel = limit;
      const synchronized = synchronizeLegacyUpgradePolicy(this.runtime, limit);
      if (alpha27) alpha27.legacyUpgradePolicySynchronized = synchronized;
    });
    apply('economy.maxCompound', (value) => {
      const current = alpha27 && alpha27.options && typeof alpha27.options === 'object' ? alpha27.options : {};
      const limit = boundedOptions({ ...current, maxCompoundLevel: Number(value) }).maxCompoundLevel;
      if (alpha27 && alpha27.options) alpha27.options.maxCompoundLevel = limit;
      const synchronized = synchronizeLegacyCompoundPolicy(this.runtime, limit);
      if (alpha27) alpha27.legacyCompoundPolicySynchronized = synchronized;
    });

    apply('economy.itemPermissions', (value) => {
      const ledger = this.runtime.inventoryLedger;
      if (ledger && typeof ledger.setItemPermissions === 'function') ledger.setItemPermissions(value);
      if (this.runtime.lastSnapshot && typeof this.runtime._planInventoryAndGear === 'function') this.runtime._planInventoryAndGear();
    });

    const economy = this.runtime.economyEquipmentAutonomyV2;
    if (economy && economy.marketHistory) {
      apply('economy.marketMaxTrackedItems', (value) => { economy.marketHistory.maxItems = Math.max(16, Math.min(256, Number(value) || 96)); });
      apply('economy.marketMaxSamples', (value) => { economy.marketHistory.maxSamplesPerItem = Math.max(8, Math.min(128, Number(value) || 48)); });
    }
    if (this.runtime.combatRisk) apply('combat.riskThreshold', (value) => { this.runtime.combatRisk.threshold = Number(value); });
    if (selected) this.stats.remoteExtendedPatches += selected.size;
    return true;
  }

  _syncLateProgressionPolicy() {
    const alpha27 = this.runtime.alpha27CombatMerchantConvergence || null;
    if (!alpha27 || alpha27 === this.progressionPolicyTarget) return false;
    this.progressionPolicyTarget = alpha27;
    this._applyExtendedSettings(PROGRESSION_SETTING_KEYS);
    this.stats.lateProgressionPolicySyncs += 1;
    if (this.log) this.log.emit({ component: 'alpha25-control-center', event: 'ALPHA27_PROGRESSION_POLICY_RESYNCED', data: { maxUpgradeLevel: alpha27.options && alpha27.options.maxUpgradeLevel, maxCompoundLevel: alpha27.options && alpha27.options.maxCompoundLevel } });
    return true;
  }

  beforeTick() {
    this.stats.ticks += 1;
    this._syncLateProgressionPolicy();
    let encounterOutcome = null;
    const character = this.runtime && this.runtime.lastSnapshot && this.runtime.lastSnapshot.character;
    const encounterTelemetry = this.runtime && this.runtime.partyTelemetry;
    const hasEncounterTelemetry = !!(encounterTelemetry
      && (typeof encounterTelemetry.encounterOutcomeList === 'function' || typeof encounterTelemetry.encounterOutcomes === 'function'));
    if (character && String(character.ctype || '').toLowerCase() === 'merchant'
      && hasEncounterTelemetry
      && this.brain && typeof this.brain.ingestEncounterOutcome === 'function') {
      try {
        const sourceRows = typeof this.runtime.partyTelemetry.encounterOutcomeList === 'function'
          ? this.runtime.partyTelemetry.encounterOutcomeList()
          : Object.values(this.runtime.partyTelemetry.encounterOutcomes() || {});
        const rows = sourceRows
          .filter((row) => row && row.encounterId)
          .sort((a, b) => Number(a.endedAt || 0) - Number(b.endedAt || 0) || String(a.encounterId).localeCompare(String(b.encounterId)));
        let acceptedInBatch = 0;
        for (const row of rows) {
          const accepted = this.brain.ingestEncounterOutcome(row, { remote: true });
          if (accepted && accepted.accepted === true) {
            encounterOutcome = accepted;
            acceptedInBatch += 1;
            this.stats.remoteEncounterOutcomes += 1;
            if (this.cloud && Array.isArray(this.cloud.pendingFeedback)) this.cloud.pendingFeedback.push(accepted);
          } else if (accepted && accepted.reason !== 'ENCOUNTER_OUTCOME_DUPLICATE') {
            this.stats.remoteEncounterOutcomeSkips += 1;
          }
        }
        if (acceptedInBatch > 0) this.stats.remoteEncounterOutcomeBatches += 1;
      } catch (_) {}
    }
    const outcome = this.brain && typeof this.brain.tickOutcome === 'function' ? this.brain.tickOutcome() : null;
    if (outcome) {
      this.stats.outcomes += 1;
      if (this.cloud && Array.isArray(this.cloud.pendingFeedback)) this.cloud.pendingFeedback.push(outcome);
    }
    const now = this.now();
    if (this.cloud && now - this.lastCycleAt >= 1000) {
      this.lastCycleAt = now;
      this.stats.cloudCyclesStarted += 1;
      Promise.resolve(this.cloud.cycle()).catch((error) => {
        this.stats.cloudCycleErrors += 1;
        if (this.log) this.log.emit({ component: 'alpha25-control-center', event: 'CLOUD_CONTROL_PROMISE_REJECTED', severity: 'warn', reason: String(error && error.message || error).slice(0, 240) });
      });
    }
    return !!outcome || !!encounterOutcome;
  }

  patchSettings(values = {}, source = 'local-api') {
    const patch = this.controlPlane.patch(values, { source });
    const applied = this.controlPlane.applyHot(this.runtime, patch.changed);
    this._applyExtendedSettings(patch.changed);
    this.stats.localPatches += patch.changed.length;
    return { ...patch, ...applied };
  }

  configureCloud(config = {}) {
    const cloud = this.cloud.configure(config);
    if (cloud.ready) this.patchSettings({ 'cloud.enabled': true }, 'cloud-configure');
    return this.cloud.status();
  }

  status() {
    return {
      schemaVersion: 2,
      mode: ALPHA25_MODE,
      installedAt: this.installedAt,
      controlPlane: this.controlPlane.status(),
      brain: this.brain.status(),
      cloud: this.cloud.status(),
      stats: { ...this.stats },
      policies: {
        dashboardSettingsAreLocallyRevalidated: true,
        remoteExtendedSettingsReachLiveSubsystems: true,
        progressionSettingsReachCurrentAlpha27Policy: true,
        lateAlpha27InstallReceivesStoredProgressionSettings: true,
        compoundDashboardLimitUsesResultLevelSemantics: true,
        outcomeEvaluationHasSingleOwner: true,
        explicitGlobalCloudConfigEnablesControlPlane: true,
        legacyV2DashboardCredentialsAutoMigrate: true,
        migratedCloudCredentialsAutoEnableControlPlane: true,
        cloudCannotBypassSafety: true,
        brainStrategicOnly: true,
        brainDirectExecutorAccess: false,
        dangerousContentFailClosed: true,
        emergencyRetreatPriorityPreserved: true,
        commandCharacterAuthorityWidened: false
      }
    };
  }
}

function installAlpha25ControlCenterBrain(runtime, options = {}) {
  if (!runtime) throw new Error('runtime required');
  if (runtime.alpha25ControlCenterBrain) {
    const existing = runtime.alpha25ControlCenterBrain;
    const cloud = runtime.cloudControlPlane || existing.cloud;
    installAdventureLandItemSprites(runtime, cloud);
    return existing;
  }
  const module = new Alpha25ControlCenterBrain(runtime, options);
  runtime.alpha25ControlCenterBrain = module;
  return module;
}

module.exports = {
  ALPHA25_MODE,
  Alpha25ControlCenterBrain,
  installAlpha25ControlCenterBrain,
  adventureLandAssetUrl,
  itemSpriteCatalog,
  equipmentShadeCatalog,
  itemAutomationCatalog,
  installAdventureLandItemSprites
};