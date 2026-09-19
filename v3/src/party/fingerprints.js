'use strict';

const FINGERPRINT_SCHEMA_VERSION = 1;

function finite(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
function clamp(value, min, max) {
  const n = finite(value);
  if (n == null) return min;
  return Math.max(min, Math.min(max, n));
}
function stableStringify(value) {
  if (value == null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
}
function hash(input) {
  const text = String(input || '');
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}
function gearSignature(gear) {
  if (!gear || typeof gear !== 'object') return 'none';
  return Object.keys(gear).sort().map((slot) => { const item = gear[slot] || {}; return `${slot}:${item.name || '?'}+${Math.max(0, Number(item.level) || 0)}`; }).join(',') || 'none';
}
function memberFingerprint(member) {
  return { name: String(member && member.name || 'unknown'), ctype: String(member && (member.ctype || member.type) || 'unknown').toLowerCase(), level: Math.max(0, Number(member && member.level) || 0), gear: gearSignature(member && member.gear), skills: Array.isArray(member && member.skillUnlocks) ? member.skillUnlocks.slice().map(String).sort().slice(0, 128) : [] };
}
function createPartyFingerprint(members = [], options = {}) {
  const normalized = members.map(memberFingerprint).sort((a, b) => a.name.localeCompare(b.name));
  const classes = normalized.map((member) => member.ctype).sort();
  const semantic = classes.join('|') || 'empty';
  const detail = { schemaVersion: FINGERPRINT_SCHEMA_VERSION, members: normalized, aura: options.aura || null, rolePolicy: options.rolePolicy || null };
  const detailHash = hash(stableStringify(detail));
  return { schemaVersion: FINGERPRINT_SCHEMA_VERSION, semantic, key: `${semantic}::${detailHash}`, detailHash, members: normalized, aura: options.aura || null };
}
function monsterMetadata(gameData, mtype) {
  const raw = gameData && gameData.monsters && gameData.monsters[mtype] || {};
  return { mtype: mtype || null, hp: finite(raw.hp), attack: finite(raw.attack), frequency: finite(raw.frequency), armor: finite(raw.armor), resistance: finite(raw.resistance), damageType: raw.damage_type || raw.damageType || null, aggro: raw.aggro == null ? null : Number(raw.aggro), rage: raw.rage == null ? null : Number(raw.rage) };
}
function dominantMonster(snapshot) {
  const c = snapshot && snapshot.character;
  if (!c) return null;
  const rows = new Map();
  for (const entity of snapshot.entities || []) {
    if (!entity || !entity.mtype || entity.dead) continue;
    let score = 1;
    if (String(entity.id) === String(c.target || '')) score += 6;
    if (entity.target === c.name) score += 4;
    rows.set(entity.mtype, (rows.get(entity.mtype) || 0) + score);
  }
  return [...rows.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || null;
}
function createPullLearningFingerprint(context = {}) {
  const snapshot = context.snapshot || {};
  const c = snapshot.character || {};
  const gameData = context.gameData || {};
  const mtype = context.monster || dominantMonster(snapshot) || null;
  const metadata = monsterMetadata(gameData, mtype);
  const levels = (context.currentMembers || [])
    .map((row) => Number(row && row.level) || 0)
    .filter((value) => value > 0);
  const avgLevel = levels.length ? levels.reduce((a, b) => a + b, 0) / levels.length : Number(c.level) || 0;
  const detail = {
    schemaVersion: FINGERPRINT_SCHEMA_VERSION,
    map: c.map || null,
    monster: metadata,
    partyLevelBand: context.partyLevelBand == null ? Math.floor(avgLevel / 10) * 10 : context.partyLevelBand,
    event: context.event || null,
    contentDisposition: context.contentDisposition || null
  };
  return { ...detail, key: `pullctx::${hash(stableStringify(detail))}` };
}

function createEncounterFingerprint(context = {}) {
  const snapshot = context.snapshot || {};
  const c = snapshot.character || {};
  const gameData = context.gameData || {};
  const mtype = context.monster || dominantMonster(snapshot) || (context.currentPlan && context.currentPlan.monster) || null;
  const metadata = monsterMetadata(gameData, mtype);
  const selfAggro = (snapshot.entities || []).filter((entity) => entity && !entity.dead && entity.target === c.name).length;
  const visibleSameType = (snapshot.entities || []).filter((entity) => entity && !entity.dead && entity.mtype === mtype).length;
  const hpRatio = c.max_hp > 0 ? clamp(c.hp / c.max_hp, 0, 1) : null;
  const mpRatio = c.max_mp > 0 ? clamp(c.mp / c.max_mp, 0, 1) : null;
  const detail = { schemaVersion: FINGERPRINT_SCHEMA_VERSION, map: c.map || null, zone: context.zone || null, monster: metadata, expectedParallel: Math.max(visibleSameType, selfAggro, Number(context.expectedParallel) || 1), spawnDensity: context.spawnDensity == null ? null : clamp(context.spawnDensity, 0, 1000), avgDistance: context.avgDistance == null ? null : Math.max(0, finite(context.avgDistance) || 0), partyLevelBand: context.partyLevelBand || null, event: context.event || null, hpBand: hpRatio == null ? null : Math.round(hpRatio * 10), mpBand: mpRatio == null ? null : Math.round(mpRatio * 10), contentDisposition: context.contentDisposition || null };
  const key = `enc::${hash(stableStringify(detail))}`;
  return { ...detail, key };
}
module.exports = { FINGERPRINT_SCHEMA_VERSION, stableStringify, hash, createPartyFingerprint, createEncounterFingerprint, createPullLearningFingerprint, dominantMonster, monsterMetadata };
