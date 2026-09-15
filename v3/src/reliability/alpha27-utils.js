'use strict';

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function clone(value) {
  if (value == null) return value;
  try { return JSON.parse(JSON.stringify(value)); } catch (_) { return null; }
}
function text(value) {
  const s = String(value == null ? '' : value).trim();
  return s || null;
}
function errorDetails(error, max = 240) {
  const limit = Math.max(40, Math.floor(finite(max, 240)));
  if (error == null) return { reason: 'UNKNOWN_ERROR' };
  if (typeof error !== 'object') return { reason: String(error).trim().slice(0, limit) || 'UNKNOWN_ERROR' };
  const rawReason = error.reason != null ? error.reason
    : error.message != null ? error.message
      : error.error != null ? error.error
        : error.code != null ? error.code
          : error.statusText != null ? error.statusText
            : null;
  const reason = rawReason == null ? 'STRUCTURED_ERROR' : String(rawReason).trim().slice(0, limit) || 'STRUCTURED_ERROR';
  const details = { reason };
  for (const key of ['failed', 'success', 'code', 'status', 'place', 'response']) {
    const value = error[key];
    if (value == null) continue;
    if (typeof value === 'string') details[key] = value.slice(0, limit);
    else if (typeof value === 'number' || typeof value === 'boolean') details[key] = value;
  }
  return details;
}
function errorReason(error, fallback = 'UNKNOWN_ERROR', max = 240) {
  const details = errorDetails(error, max);
  return details.reason || fallback;
}
function levelOf(item) { return Math.max(0, Math.floor(finite(item && item.level, 0))); }
function qtyOf(item) { return Math.max(1, Math.floor(finite(item && item.q, 1))); }
function inventoryOf(root) {
  const c = root && (root.character || root.parent && root.parent.character);
  const items = c && Array.isArray(c.items) ? c.items : [];
  return items.map((item, index) => item ? { ...item, index } : null);
}
function characterOf(runtime) {
  const root = runtime && runtime.root || globalThis;
  return root && (root.character || root.parent && root.parent.character) || null;
}
function gameDataOf(runtime) {
  try {
    return runtime && runtime.adapter && typeof runtime.adapter.getGameData === 'function'
      ? runtime.adapter.getGameData() || {}
      : runtime && runtime.root && (runtime.root.G || runtime.root.parent && runtime.root.parent.G) || {};
  } catch (_) { return {}; }
}
function identityQuantity(items, name, level) {
  return (Array.isArray(items) ? items : []).reduce((sum, item) => {
    if (!item || String(item.name || '') !== String(name || '') || levelOf(item) !== levelOf({ level })) return sum;
    return sum + qtyOf(item);
  }, 0);
}
function findItem(root, name, level = null) {
  return inventoryOf(root).find((item) => item && String(item.name || '') === String(name || '') && (level == null || levelOf(item) === levelOf({ level }))) || null;
}
function gradeForLevel(meta, level) {
  const grades = Array.isArray(meta && meta.grades) ? meta.grades : [9, 10, 11, 12];
  const l = levelOf({ level });
  for (let index = Math.min(3, grades.length - 1); index >= 0; index -= 1) {
    const threshold = Number(grades[index]);
    if (Number.isFinite(threshold) && l >= threshold) return index + 1;
  }
  return 0;
}
function levelRequirement(gameData, level) {
  const levels = gameData && gameData.levels;
  if (!levels) return null;
  const raw = Array.isArray(levels) ? levels[level] : levels[level] != null ? levels[level] : levels[String(level)];
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}
function xpDelta(previous, current, gameData) {
  if (!previous || !current) return 0;
  const before = finite(previous.xp, 0);
  const after = finite(current.xp, 0);
  const beforeLevel = finite(previous.level, 0);
  const afterLevel = finite(current.level, 0);
  if (afterLevel === beforeLevel) return Math.max(0, after - before);
  if (afterLevel < beforeLevel) return 0;
  let total = -before + after;
  for (let level = beforeLevel; level < afterLevel; level += 1) {
    const required = levelRequirement(gameData, level);
    if (required == null) return Math.max(0, after - before);
    total += required;
  }
  return Math.max(0, total);
}
function potionCount(inventory = []) {
  let total = 0;
  for (const item of inventory || []) {
    if (!item || !/^(hpot|mpot)/i.test(String(item.name || ''))) continue;
    total += qtyOf(item);
  }
  return total;
}
function monsterMap(snapshot) {
  const map = new Map();
  for (const entity of snapshot && snapshot.entities || []) if (entity && entity.id != null) map.set(String(entity.id), entity);
  return map;
}
function isAliveMonster(entity) {
  return !!(entity && entity.mtype && !entity.dead && !entity.rip && (entity.hp == null || finite(entity.hp, 0) > 0));
}
function ownedTargetId(runtime) {
  const farmer = runtime && runtime.farmer;
  return farmer && farmer.targetId != null ? String(farmer.targetId) : null;
}
function farmerOwnedCombatBusy(runtime, snapshot) {
  if (!snapshot || !snapshot.character || snapshot.character.rip || snapshot.character.dead) return true;
  if (runtime && runtime.pendingEmergencyRetreat) return true;
  const c = snapshot.character;
  if ((snapshot.entities || []).some((entity) => isAliveMonster(entity) && String(entity.target || '') === String(c.name || ''))) return true;
  const farmer = runtime && runtime.farmer;
  if (!farmer) return false;
  if (String(farmer.state || '') === 'RECOVER') return true;
  if (String(farmer.state || '') === 'ENGAGE' && farmer.targetId != null) return true;
  return false;
}
function isPoisonedPerformanceProfile(profile, monsterMeta) {
  return !!(profile && monsterMeta && finite(monsterMeta.xp, 0) > 0 && finite(profile.windows, 0) > 0 && finite(profile.kills, 0) > 0 && finite(profile.xp, 0) <= 0);
}
function transactionInputs(tx) {
  if (Array.isArray(tx && tx.inputs) && tx.inputs.length) return tx.inputs.map((row) => ({ ...row }));
  if (!tx) return [];
  return [{ key: tx.reservationKey || `${tx.character}:${tx.index}`, character: tx.character, index: tx.index, item: tx.item, level: tx.level, quantity: tx.quantity || 1, disposition: tx.disposition }];
}
function rawFunction(root, name) {
  if (root && typeof root[name] === 'function') return { fn: root[name], owner: root };
  const parent = root && root.parent;
  if (parent && typeof parent[name] === 'function') return { fn: parent[name], owner: parent };
  return null;
}

module.exports = {
  finite, clone, text, errorDetails, errorReason, levelOf, qtyOf, inventoryOf, characterOf, gameDataOf,
  identityQuantity, findItem, gradeForLevel, xpDelta, potionCount, monsterMap,
  isAliveMonster, ownedTargetId, farmerOwnedCombatBusy, isPoisonedPerformanceProfile,
  transactionInputs, rawFunction
};