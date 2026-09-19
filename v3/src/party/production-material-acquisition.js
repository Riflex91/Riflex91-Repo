'use strict';

const { directDropChance, rewardChanceForExchange } = require('./elixir-policy');
const { spawnType, spawnCenter, contentDisposition, isApprovedDisposition } = require('../autonomy/local-farm-planner');
const { probabilisticFarmTime, probabilisticOperations, PROBABILISTIC_FARM_TIME_MODEL } = require('./probabilistic-farm-time');
const {
  questDestination,
  sourceEventDescriptor,
  isExchangeBackedSource,
  isQuestBackedSource,
  isEventBackedSource,
  sourceKind
} = require('./acquisition-source-evidence');

const PRODUCTION_MATERIAL_ACQUISITION_MODE = 'team-production-material-acquisition-v3';
const DEFAULT_MAX_TEAM_FARM_HOURS = 12;
const DEFAULT_FALLBACK_KILLS_PER_HOUR = 20;

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clone(value) {
  try { return value == null ? value : JSON.parse(JSON.stringify(value)); } catch (_) { return null; }
}

function currentPartyFingerprintKey(runtime) {
  const raw = runtime && runtime.currentPartyFingerprint;
  if (typeof raw === 'string' && raw) return raw;
  if (raw && typeof raw.key === 'string' && raw.key) return raw.key;
  try {
    const snapshot = runtime && runtime.lastSnapshot;
    const profile = snapshot && runtime && typeof runtime._partyProfile === 'function' ? runtime._partyProfile(snapshot) : null;
    if (profile && typeof profile.fingerprint === 'string' && profile.fingerprint) return profile.fingerprint;
  } catch (_) {}
  return null;
}

function bestMeasuredKillRate(runtime, monster) {
  const world = runtime && runtime.world;
  if (!world) return null;
  const fingerprint = currentPartyFingerprintKey(runtime);
  if (fingerprint && typeof world.performanceFor === 'function') {
    try {
      const current = world.performanceFor(monster, fingerprint);
      if (current && finite(current.seconds, 0) >= 60 && finite(current.killsPerHour, 0) > 0) {
        return {
          killsPerHour: finite(current.killsPerHour, 0),
          seconds: finite(current.seconds, 0),
          kills: finite(current.kills, 0),
          fingerprint,
          evidence: 'MEASURED_CURRENT_TEAM_KILLS_PER_HOUR'
        };
      }
    } catch (_) {}
    // Do not borrow kill rates from a different party composition. The whole
    // Farmer team acts together, so unknown current-team throughput falls back
    // to the conservative estimate instead.
    return null;
  }
  if (!(world.performance instanceof Map)) return null;
  const rows = [...world.performance.values()]
    .filter((row) => row && row.monster === monster && finite(row.seconds, 0) >= 60)
    .map((row) => {
      const hours = finite(row.seconds, 0) / 3600;
      return {
        killsPerHour: hours > 0 ? finite(row.kills, 0) / hours : 0,
        seconds: finite(row.seconds, 0),
        kills: finite(row.kills, 0),
        evidence: 'MEASURED_TEAM_KILLS_PER_HOUR'
      };
    })
    .filter((row) => row.killsPerHour > 0)
    .sort((a, b) => b.seconds - a.seconds || b.killsPerHour - a.killsPerHour);
  return rows[0] || null;
}

function bestMeasuredKillsPerHour(runtime, monster) {
  const row = bestMeasuredKillRate(runtime, monster);
  return row ? row.killsPerHour : null;
}

function partyHeldQuantity(runtime, name, level = 0) {
  const registry = runtime && runtime.characterRegistry;
  let status = null;
  try { status = registry && typeof registry.status === 'function' ? registry.status() : null; } catch (_) { status = null; }
  const rows = Array.isArray(status && status.characters) ? status.characters : [];
  let total = 0;
  for (const character of rows) {
    if (!character || String(character.ctype || character.type || '').toLowerCase() === 'merchant') continue;
    const inventory = Array.isArray(character.inventory) ? character.inventory : Array.isArray(character.items) ? character.items : [];
    for (const item of inventory) {
      if (!item || String(item.name || '') !== String(name || '')) continue;
      if (Math.max(0, Math.floor(finite(item.level, 0))) !== Math.max(0, Math.floor(finite(level, 0)))) continue;
      total += Math.max(1, Math.floor(finite(item.q, 1)));
    }
  }
  return total;
}

function quantityInRows(rows, name, level = 0) {
  let total = 0;
  for (const item of Array.isArray(rows) ? rows : []) {
    if (!item || String(item.name || '') !== String(name || '')) continue;
    if (Math.max(0, Math.floor(finite(item.level, 0))) !== Math.max(0, Math.floor(finite(level, 0)))) continue;
    total += Math.max(1, Math.floor(finite(item.q != null ? item.q : item.quantity, 1)));
  }
  return total;
}

function merchantHeldQuantity(runtime, name, level = 0) {
  const root = runtime && runtime.root || {};
  const character = root.character || root.parent && root.parent.character || {};
  const inventory = Array.isArray(character.items) ? character.items : Array.isArray(character.inventory) ? character.inventory : [];
  let total = quantityInRows(inventory, name, level);
  const liveBank = character.bank && typeof character.bank === 'object' ? character.bank : null;
  if (liveBank) {
    for (const rows of Object.values(liveBank)) total += quantityInRows(rows, name, level);
    return total;
  }
  try {
    const catalog = runtime && runtime.merchantBankCatalog && typeof runtime.merchantBankCatalog.status === 'function'
      ? runtime.merchantBankCatalog.status()
      : null;
    const rows = catalog && catalog.usable === true && catalog.snapshot && Array.isArray(catalog.snapshot.rows)
      ? catalog.snapshot.rows
      : [];
    total += quantityInRows(rows, name, level);
  } catch (_) {}
  return total;
}

function sourceSafe(runtime, monster, spawn) {
  if (!runtime || !monster || !spawn || !spawn.map) return false;
  try {
    if (!isApprovedDisposition(contentDisposition(runtime.world, monster))) return false;
  } catch (_) { return false; }
  const drift = runtime.contentDrift;
  if (drift && typeof drift.requiresRevalidation === 'function') {
    try {
      if (drift.requiresRevalidation('monsters', monster)) return false;
      if (drift.requiresRevalidation('maps', spawn.map)) return false;
    } catch (_) { return false; }
  }
  return true;
}

function knownSpawns(gameData, monster) {
  const out = [];
  const maps = gameData && gameData.maps || {};
  for (const [map, meta] of Object.entries(maps)) {
    const raw = meta && meta.monsters;
    const spawns = Array.isArray(raw) ? raw : raw && typeof raw === 'object' ? Object.values(raw) : [];
    for (let index = 0; index < spawns.length; index += 1) {
      const entry = spawns[index];
      if (String(spawnType(entry) || '') !== String(monster || '')) continue;
      const center = spawnCenter(entry);
      if (!center) continue;
      out.push({ map, spawnIndex: index, x: center.x, y: center.y });
    }
  }
  return out;
}

function bestDirectMaterialFarmSource(runtime, material, quantity, options = {}) {
  const name = String(material == null ? '' : material).trim();
  const need = Math.max(1, Math.floor(finite(quantity, 1)));
  if (!name) return null;
  const gameData = runtime && runtime.adapter && typeof runtime.adapter.getGameData === 'function'
    ? runtime.adapter.getGameData() || {}
    : {};
  const monsters = gameData && gameData.drops && gameData.drops.monsters || {};
  const fallbackKillsPerHour = Math.max(1, finite(options.fallbackKillsPerHour, DEFAULT_FALLBACK_KILLS_PER_HOUR));
  const candidates = [];

  for (const monster of Object.keys(monsters)) {
    const yieldPerKill = directDropChance(gameData, monster, name);
    if (!(yieldPerKill > 0)) continue;
    const spawns = knownSpawns(gameData, monster);
    if (!spawns.length) continue;
    const measured = bestMeasuredKillRate(runtime, monster);
    const killsPerHour = measured ? measured.killsPerHour : fallbackKillsPerHour;
    const unitsPerHour = yieldPerKill * killsPerHour;
    if (!(unitsPerHour > 0)) continue;
    for (const spawn of spawns) {
      if (!sourceSafe(runtime, monster, spawn)) continue;
      const event = sourceEventDescriptor(runtime, gameData, {
        material: name,
        targetMaterial: name,
        monster,
        map: spawn.map
      });
      if (event.required && (!event.verified || !event.active)) continue;
      const time = probabilisticFarmTime({
        requiredUnits: need,
        unitsPerHour,
        measured: !!measured,
        sampleSeconds: measured && measured.seconds || 0,
        evidence: measured ? measured.evidence : 'CONSERVATIVE_FALLBACK_KILLS_PER_HOUR'
      });
      candidates.push({
        kind: sourceKind({ direct: true, event: event.required }),
        material: name,
        targetMaterial: name,
        quantity: need,
        monster,
        yieldPerKill,
        killsPerHour,
        measuredKillsPerHour: measured ? measured.killsPerHour : null,
        measuredSampleSeconds: measured ? measured.seconds : 0,
        evidence: measured ? measured.evidence : 'CONSERVATIVE_FALLBACK_KILLS_PER_HOUR',
        unitsPerHour,
        expectedHours: time.expectedHours,
        p50Hours: time.p50Hours,
        p90Hours: time.p90Hours,
        probabilityConfidence: time.confidence,
        timeModel: time.model,
        decisionQuantile: time.decisionQuantile,
        rareDrop: time.rareDrop,
        eventKey: event.eventKey,
        eventType: event.eventType,
        eventEndsAt: event.endsAt,
        eventEvidence: event.evidence,
        graphNode: {
          kind: event.required ? 'EVENT_FARM' : 'FARM_DROP',
          eventKey: event.eventKey,
          material: name,
          monster,
          map: spawn.map,
          quantity: need,
          time: clone(time)
        },
        ...spawn
      });
    }
  }

  candidates.sort((a, b) => finite(a.p90Hours, Infinity) - finite(b.p90Hours, Infinity)
    || finite(a.p50Hours, Infinity) - finite(b.p50Hours, Infinity)
    || a.expectedHours - b.expectedHours
    || (b.measuredKillsPerHour != null ? 1 : 0) - (a.measuredKillsPerHour != null ? 1 : 0)
    || b.unitsPerHour - a.unitsPerHour
    || a.monster.localeCompare(b.monster)
    || a.map.localeCompare(b.map)
    || a.spawnIndex - b.spawnIndex);
  return candidates[0] || null;
}

function bestExchangeMaterialFarmSource(runtime, desiredMaterial, quantity, options = {}) {
  const desired = String(desiredMaterial == null ? '' : desiredMaterial).trim();
  const need = Math.max(1, Math.floor(finite(quantity, 1)));
  if (!desired) return null;
  const gameData = runtime && runtime.adapter && typeof runtime.adapter.getGameData === 'function'
    ? runtime.adapter.getGameData() || {}
    : {};
  const items = gameData.items || {};
  const fallbackKillsPerHour = Math.max(1, finite(options.fallbackKillsPerHour, DEFAULT_FALLBACK_KILLS_PER_HOUR));
  const candidates = [];

  for (const [exchangeItem, meta] of Object.entries(items)) {
    const requiredPerExchange = Math.max(0, Math.floor(finite(meta && meta.e, 0)));
    if (requiredPerExchange <= 0) continue;
    const rewardPerExchange = rewardChanceForExchange(gameData, exchangeItem, desired);
    if (!(rewardPerExchange > 0)) continue;

    const quest = meta && meta.quest ? String(meta.quest) : null;
    const questTarget = quest ? questDestination(gameData, quest) : null;
    // A quest-tagged exchange is executable only when the live G data maps the
    // quest key to a concrete NPC location. Never downgrade it to generic Xyn.
    if (quest && !questTarget) continue;

    const operations = probabilisticOperations({
      requiredRewards: need,
      rewardUnitsPerOperation: rewardPerExchange
    });
    const expectedExchangeOperations = operations.expectedOperations;
    const p50ExchangeOperations = operations.p50Operations;
    const p90ExchangeOperations = operations.p90Operations;
    const expectedInputUnits = Math.max(requiredPerExchange, Math.ceil(expectedExchangeOperations * requiredPerExchange));
    const riskAdjustedInputUnits = Math.max(requiredPerExchange, p90ExchangeOperations * requiredPerExchange);
    const alreadyOnFarmers = partyHeldQuantity(runtime, exchangeItem, 0);
    const alreadyOnMerchantOrBank = merchantHeldQuantity(runtime, exchangeItem, 0);
    const farmInputUnits = Math.max(0, riskAdjustedInputUnits - alreadyOnFarmers - alreadyOnMerchantOrBank);

    const monsters = gameData && gameData.drops && gameData.drops.monsters || {};
    for (const monster of Object.keys(monsters)) {
      const inputYieldPerKill = directDropChance(gameData, monster, exchangeItem);
      if (!(inputYieldPerKill > 0)) continue;
      const spawns = knownSpawns(gameData, monster);
      if (!spawns.length) continue;
      const measured = bestMeasuredKillRate(runtime, monster);
      const killsPerHour = measured ? measured.killsPerHour : fallbackKillsPerHour;
      const inputUnitsPerHour = inputYieldPerKill * killsPerHour;
      if (!(inputUnitsPerHour > 0)) continue;
      const desiredUnitsPerHour = (inputUnitsPerHour / requiredPerExchange) * rewardPerExchange;
      if (!(desiredUnitsPerHour > 0)) continue;

      for (const spawn of spawns) {
        if (!sourceSafe(runtime, monster, spawn)) continue;
        const event = sourceEventDescriptor(runtime, gameData, {
          material: exchangeItem,
          targetMaterial: desired,
          monster,
          map: spawn.map
        });
        if (event.required && (!event.verified || !event.active)) continue;
        const time = farmInputUnits > 0
          ? probabilisticFarmTime({
            requiredUnits: farmInputUnits,
            unitsPerHour: inputUnitsPerHour,
            measured: !!measured,
            sampleSeconds: measured && measured.seconds || 0,
            evidence: measured ? measured.evidence : 'CONSERVATIVE_FALLBACK_KILLS_PER_HOUR'
          })
          : {
            model: PROBABILISTIC_FARM_TIME_MODEL,
            expectedHours: 0,
            p50Hours: 0,
            p90Hours: 0,
            confidence: measured ? 0.5 : 0.25,
            decisionQuantile: 'P90',
            rareDrop: false
          };
        const kind = sourceKind({ quest: !!quest, event: event.required });
        candidates.push({
          kind,
          material: exchangeItem,
          targetMaterial: desired,
          quantity: riskAdjustedInputUnits,
          expectedInputUnits,
          riskAdjustedInputUnits,
          farmQuantity: farmInputUnits,
          requiredPerExchange,
          rewardPerExchange,
          expectedExchangeOperations,
          p50ExchangeOperations,
          p90ExchangeOperations,
          inputYieldPerKill,
          killsPerHour,
          measuredKillsPerHour: measured ? measured.killsPerHour : null,
          measuredSampleSeconds: measured ? measured.seconds : 0,
          evidence: measured ? measured.evidence : 'CONSERVATIVE_FALLBACK_KILLS_PER_HOUR',
          unitsPerHour: inputUnitsPerHour,
          targetUnitsPerHour: desiredUnitsPerHour,
          expectedHours: time.expectedHours,
          p50Hours: time.p50Hours,
          p90Hours: time.p90Hours,
          probabilityConfidence: time.confidence,
          timeModel: time.model,
          decisionQuantile: time.decisionQuantile,
          rareDrop: time.rareDrop,
          alreadyOnFarmers,
          alreadyOnMerchantOrBank,
          quest,
          questDestination: clone(questTarget),
          eventKey: event.eventKey,
          eventType: event.eventType,
          eventEndsAt: event.endsAt,
          eventEvidence: event.evidence,
          graphNode: {
            kind: quest && event.required ? 'EVENT_QUEST_EXCHANGE'
              : quest ? 'QUEST_EXCHANGE'
                : event.required ? 'EVENT_EXCHANGE'
                  : 'EXCHANGE',
            targetMaterial: desired,
            rewardUnitsPerOperation: rewardPerExchange,
            operations: clone(operations),
            quest,
            questDestination: clone(questTarget),
            eventKey: event.eventKey,
            input: {
              kind: event.required ? 'EVENT_FARM' : 'FARM_DROP',
              material: exchangeItem,
              quantity: riskAdjustedInputUnits,
              farmQuantity: farmInputUnits,
              monster,
              map: spawn.map,
              time: clone(time)
            }
          },
          ...spawn
        });
      }
    }
  }

  candidates.sort((a, b) => finite(a.p90Hours, Infinity) - finite(b.p90Hours, Infinity)
    || finite(a.p50Hours, Infinity) - finite(b.p50Hours, Infinity)
    || a.expectedHours - b.expectedHours
    || (b.measuredKillsPerHour != null ? 1 : 0) - (a.measuredKillsPerHour != null ? 1 : 0)
    || b.targetUnitsPerHour - a.targetUnitsPerHour
    || a.material.localeCompare(b.material)
    || a.monster.localeCompare(b.monster));
  return candidates[0] || null;
}

function bestMaterialFarmSource(runtime, desiredMaterial, quantity, options = {}) {
  const direct = bestDirectMaterialFarmSource(runtime, desiredMaterial, quantity, options);
  const exchange = bestExchangeMaterialFarmSource(runtime, desiredMaterial, quantity, options);
  if (!direct) return exchange;
  if (!exchange) return direct;
  const rows = [direct, exchange].sort((a, b) =>
    finite(a.p90Hours, Infinity) - finite(b.p90Hours, Infinity)
    || finite(a.p50Hours, Infinity) - finite(b.p50Hours, Infinity)
    || finite(a.expectedHours, Infinity) - finite(b.expectedHours, Infinity));
  return rows[0];
}

function diagnoseUnavailableMaterialSource(runtime, desiredMaterial) {
  const desired = String(desiredMaterial == null ? '' : desiredMaterial).trim();
  const gameData = runtime && runtime.adapter && typeof runtime.adapter.getGameData === 'function'
    ? runtime.adapter.getGameData() || {}
    : {};
  const monsters = gameData && gameData.drops && gameData.drops.monsters || {};
  const diagnoses = [];

  for (const monster of Object.keys(monsters)) {
    if (!(directDropChance(gameData, monster, desired) > 0)) continue;
    for (const spawn of knownSpawns(gameData, monster)) {
      if (!sourceSafe(runtime, monster, spawn)) continue;
      const event = sourceEventDescriptor(runtime, gameData, {
        material: desired,
        targetMaterial: desired,
        monster,
        map: spawn.map
      });
      if (event.required && !event.verified) diagnoses.push({
        reason: 'EVENT_SOURCE_UNVERIFIED',
        material: desired,
        monster,
        map: spawn.map,
        event: clone(event)
      });
      else if (event.required && !event.active) diagnoses.push({
        reason: 'EVENT_SOURCE_INACTIVE',
        material: desired,
        monster,
        map: spawn.map,
        event: clone(event)
      });
    }
  }

  for (const [exchangeItem, meta] of Object.entries(gameData.items || {})) {
    const requiredPerExchange = Math.max(0, Math.floor(finite(meta && meta.e, 0)));
    if (requiredPerExchange <= 0 || !(rewardChanceForExchange(gameData, exchangeItem, desired) > 0)) continue;
    const quest = meta && meta.quest ? String(meta.quest) : null;
    const questTarget = quest ? questDestination(gameData, quest) : null;
    if (quest && !questTarget) {
      diagnoses.push({
        reason: 'QUEST_SOURCE_DESTINATION_UNVERIFIED',
        material: desired,
        exchangeItem,
        quest,
        requiredPerExchange
      });
      continue;
    }
    for (const monster of Object.keys(monsters)) {
      if (!(directDropChance(gameData, monster, exchangeItem) > 0)) continue;
      for (const spawn of knownSpawns(gameData, monster)) {
        if (!sourceSafe(runtime, monster, spawn)) continue;
        const event = sourceEventDescriptor(runtime, gameData, {
          material: exchangeItem,
          targetMaterial: desired,
          monster,
          map: spawn.map
        });
        if (event.required && !event.verified) diagnoses.push({
          reason: 'EVENT_SOURCE_UNVERIFIED',
          material: desired,
          exchangeItem,
          quest,
          questDestination: clone(questTarget),
          monster,
          map: spawn.map,
          event: clone(event)
        });
        else if (event.required && !event.active) diagnoses.push({
          reason: 'EVENT_SOURCE_INACTIVE',
          material: desired,
          exchangeItem,
          quest,
          questDestination: clone(questTarget),
          monster,
          map: spawn.map,
          event: clone(event)
        });
      }
    }
  }

  diagnoses.sort((a, b) => {
    const priority = {
      EVENT_SOURCE_INACTIVE: 0,
      QUEST_SOURCE_DESTINATION_UNVERIFIED: 1,
      EVENT_SOURCE_UNVERIFIED: 2
    };
    return finite(priority[a.reason], 99) - finite(priority[b.reason], 99)
      || String(a.exchangeItem || a.material || '').localeCompare(String(b.exchangeItem || b.material || ''));
  });
  return diagnoses[0] || { reason: 'NO_SAFE_DIRECT_FARM_SOURCE', material: desired };
}

function aggregateFarmSteps(steps = []) {
  const grouped = new Map();
  for (const step of Array.isArray(steps) ? steps : []) {
    if (!step || String(step.kind || '') !== 'FARM_REQUIRED' || !step.name) continue;
    const level = Math.max(0, Math.floor(finite(step.level, 0)));
    const key = `${String(step.name)}|${level}`;
    const current = grouped.get(key) || { name: String(step.name), level, quantity: 0 };
    current.quantity += Math.max(1, Math.floor(finite(step.quantity, 1)));
    grouped.set(key, current);
  }
  return [...grouped.values()];
}

function estimateBlockedProductionCandidate(runtime, blockedCandidate, options = {}) {
  if (!blockedCandidate || !blockedCandidate.candidate) return { eligible: false, reason: 'CANDIDATE_UNAVAILABLE' };
  const materialSteps = aggregateFarmSteps(blockedCandidate.steps);
  if (!materialSteps.length) return { eligible: false, reason: 'NO_FARM_REQUIRED_MATERIALS' };
  const nonMaterialBlockers = (blockedCandidate.blockers || []).filter((row) => row && row.reason !== 'MATERIAL_FARM_REQUIRED');
  if (nonMaterialBlockers.length) return { eligible: false, reason: 'NON_MATERIAL_BLOCKER', blockers: clone(nonMaterialBlockers) };

  const materials = [];
  for (const step of materialSteps) {
    if (step.level !== 0) {
      return { eligible: false, reason: 'LEVELED_MATERIAL_REQUIRES_PROGRESSION', material: clone(step) };
    }
    const alreadyOnFarmers = partyHeldQuantity(runtime, step.name, step.level);
    const remainingToFarm = Math.max(0, step.quantity - alreadyOnFarmers);
    if (remainingToFarm <= 0) {
      materials.push({
        ...clone(step),
        alreadyOnFarmers,
        remainingToFarm: 0,
        source: null,
        awaitingTransfer: true,
        handoffMaterial: step.name,
        handoffLevel: step.level,
        handoffQuantity: step.quantity,
        heldByFarmers: alreadyOnFarmers
      });
      continue;
    }
    const source = bestMaterialFarmSource(runtime, step.name, remainingToFarm, options);
    if (!source) {
      const deferredSource = diagnoseUnavailableMaterialSource(runtime, step.name);
      return {
        eligible: false,
        reason: deferredSource && deferredSource.reason || 'NO_SAFE_DIRECT_FARM_SOURCE',
        material: { ...clone(step), alreadyOnFarmers, remainingToFarm },
        deferredSource: clone(deferredSource)
      };
    }
    if (source.kind === 'EXCHANGE_MATERIAL_DROP' && finite(source.farmQuantity, 0) <= 0 && finite(source.alreadyOnFarmers, 0) > 0) {
      const handoffQuantity = Math.max(1, Math.floor(finite(source.quantity, 1) - finite(source.alreadyOnMerchantOrBank, 0)));
      materials.push({
        ...clone(step),
        alreadyOnFarmers,
        remainingToFarm,
        source,
        awaitingTransfer: true,
        handoffMaterial: source.material,
        handoffLevel: 0,
        handoffQuantity,
        heldByFarmers: finite(source.alreadyOnFarmers, 0)
      });
      continue;
    }
    materials.push({ ...clone(step), alreadyOnFarmers, remainingToFarm, source });
  }

  if (materials.every((row) => row.awaitingTransfer === true)) {
    return { eligible: false, reason: 'MATERIAL_ALREADY_HELD_BY_FARMERS_AWAIT_TRANSFER', materials };
  }

  const totalExpectedHours = materials.reduce((sum, row) => sum + (row.source ? finite(row.source.expectedHours, Infinity) : 0), 0);
  const totalP50Hours = materials.reduce((sum, row) => sum + (row.source ? finite(row.source.p50Hours, Infinity) : 0), 0);
  const totalP90Hours = materials.reduce((sum, row) => sum + (row.source ? finite(row.source.p90Hours, Infinity) : 0), 0);
  if (![totalExpectedHours, totalP50Hours, totalP90Hours].every(Number.isFinite)) {
    return { eligible: false, reason: 'FARM_TIME_ESTIMATE_UNAVAILABLE', materials };
  }
  const maxTeamFarmHours = Math.max(0.25, finite(options.maxTeamFarmHours, DEFAULT_MAX_TEAM_FARM_HOURS));
  // 12h remains a prioritization boundary, never a permanent eligibility gate.
  // P90 is used here so rare-drop variance cannot make a path look deceptively cheap.
  const longPath = totalP90Hours > maxTeamFarmHours;

  const target = blockedCandidate.candidate;
  const benefit = Math.max(
    0.001,
    finite(target.improvement, 0)
      + Math.max(0, finite(target.survivalImprovement, 0))
      + Math.max(0, finite(target.speedImprovement, 0)) * 10
  );
  const utilityPerFarmHour = benefit / Math.max(0.01, totalP90Hours);
  const nextMaterial = materials.filter((row) => row.source).sort((a, b) =>
    finite(b.source && b.source.p90Hours, 0) - finite(a.source && a.source.p90Hours, 0)
    || finite(b.source && b.source.p50Hours, 0) - finite(a.source && a.source.p50Hours, 0)
    || a.name.localeCompare(b.name)
  )[0];

  const confidenceRows = materials.filter((row) => row.source && Number.isFinite(Number(row.source.probabilityConfidence)));
  const probabilityConfidence = confidenceRows.length
    ? Math.min(...confidenceRows.map((row) => finite(row.source.probabilityConfidence, 0)))
    : 1;

  return {
    eligible: true,
    reason: longPath ? 'LONG_TEAM_FARM_PATH_DEPRIORITIZED' : 'TEAM_FARM_PATH_WITHIN_PRIORITY_BUDGET',
    target: clone(target),
    materials,
    nextMaterial,
    totalExpectedHours,
    totalP50Hours,
    totalP90Hours,
    probabilityConfidence,
    farmTimeModel: PROBABILISTIC_FARM_TIME_MODEL,
    decisionQuantile: 'P90',
    maxTeamFarmHours,
    longPath,
    priorityTier: longPath ? 1 : 0,
    benefit,
    utilityPerFarmHour
  };
}

function chooseProductionTeamFarmObjective(runtime, blockedCandidates = [], options = {}) {
  const evaluated = (Array.isArray(blockedCandidates) ? blockedCandidates : [])
    .map((candidate) => ({ candidate, estimate: estimateBlockedProductionCandidate(runtime, candidate, options) }));
  const eligible = evaluated
    .filter((row) => row.estimate && row.estimate.eligible)
    .sort((a, b) => finite(a.estimate.priorityTier, 0) - finite(b.estimate.priorityTier, 0)
      || b.estimate.utilityPerFarmHour - a.estimate.utilityPerFarmHour
      || a.estimate.totalP90Hours - b.estimate.totalP90Hours
      || a.estimate.totalP50Hours - b.estimate.totalP50Hours
      || a.estimate.totalExpectedHours - b.estimate.totalExpectedHours
      || finite(b.estimate.benefit, 0) - finite(a.estimate.benefit, 0)
      || String(a.estimate.target && a.estimate.target.output || '').localeCompare(String(b.estimate.target && b.estimate.target.output || '')));
  return {
    selected: eligible.length ? clone(eligible[0].estimate) : null,
    evaluated: evaluated.map((row) => ({
      output: row.candidate && row.candidate.candidate && row.candidate.candidate.output || null,
      recipient: row.candidate && row.candidate.candidate && row.candidate.candidate.recipient || null,
      slot: row.candidate && row.candidate.candidate && row.candidate.candidate.slot || null,
      target: clone(row.candidate && row.candidate.candidate || null),
      eligible: row.estimate && row.estimate.eligible === true,
      reason: row.estimate && row.estimate.reason || 'UNKNOWN',
      materials: clone(row.estimate && row.estimate.materials || []),
      deferredSource: clone(row.estimate && row.estimate.deferredSource || null),
      totalExpectedHours: row.estimate && Number.isFinite(row.estimate.totalExpectedHours) ? row.estimate.totalExpectedHours : null,
      totalP50Hours: row.estimate && Number.isFinite(row.estimate.totalP50Hours) ? row.estimate.totalP50Hours : null,
      totalP90Hours: row.estimate && Number.isFinite(row.estimate.totalP90Hours) ? row.estimate.totalP90Hours : null,
      probabilityConfidence: row.estimate && Number.isFinite(row.estimate.probabilityConfidence) ? row.estimate.probabilityConfidence : null,
      farmTimeModel: row.estimate && row.estimate.farmTimeModel || null,
      decisionQuantile: row.estimate && row.estimate.decisionQuantile || null,
      maxTeamFarmHours: row.estimate && row.estimate.maxTeamFarmHours || Math.max(0.25, finite(options.maxTeamFarmHours, DEFAULT_MAX_TEAM_FARM_HOURS)),
      longPath: row.estimate && row.estimate.longPath === true,
      priorityTier: row.estimate && Number.isFinite(row.estimate.priorityTier) ? row.estimate.priorityTier : null,
      utilityPerFarmHour: row.estimate && Number.isFinite(row.estimate.utilityPerFarmHour) ? row.estimate.utilityPerFarmHour : null
    }))
  };
}

module.exports = {
  PRODUCTION_MATERIAL_ACQUISITION_MODE,
  DEFAULT_MAX_TEAM_FARM_HOURS,
  DEFAULT_FALLBACK_KILLS_PER_HOUR,
  currentPartyFingerprintKey,
  bestMeasuredKillsPerHour,
  partyHeldQuantity,
  quantityInRows,
  merchantHeldQuantity,
  knownSpawns,
  bestDirectMaterialFarmSource,
  bestExchangeMaterialFarmSource,
  bestMaterialFarmSource,
  aggregateFarmSteps,
  estimateBlockedProductionCandidate,
  chooseProductionTeamFarmObjective
};
