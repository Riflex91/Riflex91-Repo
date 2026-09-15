'use strict';

const LOW_RISK_SELL_TYPES = Object.freeze(['material']);
const STRUCTURAL_GEAR_KEYS = Object.freeze(['grades', 'tier', 'scroll', 'wtype', 'class']);
const INTERACTIVE_KEYS = Object.freeze(['action', 'onclick', 'offering', 'throw', 'rare', 'ignore']);

function hasOwn(value, key) {
  return !!value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, key);
}

function finite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function sellProtectionReasons(meta) {
  if (!meta || typeof meta !== 'object') return ['SELL_METADATA_UNKNOWN'];
  const reasons = [];
  const type = String(meta.type || '').toLowerCase();
  if (!LOW_RISK_SELL_TYPES.includes(type)) reasons.push('SELL_TYPE_NOT_LOW_RISK');

  const stackSize = finite(meta.s);
  if (stackSize == null || stackSize < 2) reasons.push('SELL_NOT_PLAIN_STACKABLE_MATERIAL');

  if (meta.quest || meta.q) reasons.push('SELL_QUEST_ITEM_PROTECTED');
  if (meta.e || meta.exchange) reasons.push('SELL_EXCHANGE_ITEM_PROTECTED');
  if (meta.event) reasons.push('SELL_EVENT_ITEM_PROTECTED');
  if (meta.cash || meta.cash_item || meta.cashitem) reasons.push('SELL_CASH_ITEM_PROTECTED');
  if (meta.soulbound || meta.soul_bound) reasons.push('SELL_SOULBOUND_ITEM_PROTECTED');
  if (meta.compound) reasons.push('SELL_COMPOUND_ITEM_PROTECTED');
  if (meta.upgrade) reasons.push('SELL_UPGRADE_ITEM_PROTECTED');

  for (const key of STRUCTURAL_GEAR_KEYS) {
    if (hasOwn(meta, key)) reasons.push(`SELL_GEAR_SIGNAL_${key.toUpperCase()}`);
  }
  for (const key of INTERACTIVE_KEYS) {
    if (hasOwn(meta, key) && meta[key] != null && meta[key] !== false) reasons.push(`SELL_SPECIAL_SIGNAL_${key.toUpperCase()}`);
  }

  return unique(reasons);
}

function rawSellProtectionReasons(item) {
  if (!item || typeof item !== 'object') return ['SELL_RAW_ITEM_UNKNOWN'];
  const reasons = [];
  if (hasOwn(item, 'level')) reasons.push('SELL_RAW_LEVELLED_ITEM_PROTECTED');
  if (item.l === true) reasons.push('SELL_RAW_LOCKED_ITEM_PROTECTED');
  if (item.p) reasons.push('SELL_RAW_SPECIAL_ITEM_PROTECTED');
  return unique(reasons);
}

function sellMetadataSafetyView(meta) {
  if (!meta || typeof meta !== 'object') return null;
  const out = {
    type: String(meta.type || '').toLowerCase(),
    stackSize: finite(meta.s)
  };
  for (const key of [
    'quest', 'q', 'e', 'exchange', 'event', 'cash', 'cash_item', 'cashitem',
    'soulbound', 'soul_bound', 'compound', 'upgrade',
    ...STRUCTURAL_GEAR_KEYS, ...INTERACTIVE_KEYS
  ]) {
    out[key] = hasOwn(meta, key) ? (meta[key] == null ? null : meta[key] === false ? false : true) : 'ABSENT';
  }
  return out;
}

function sellMetadataConsensus(root, itemName) {
  const name = String(itemName || '').trim();
  const candidates = [];
  const seen = new Set();
  const sources = [
    ['root', root && root.G],
    ['parent', root && root.parent && root.parent.G]
  ];

  for (const [source, gameData] of sources) {
    const meta = gameData && gameData.items && gameData.items[name];
    if (!meta || typeof meta !== 'object' || seen.has(meta)) continue;
    seen.add(meta);
    candidates.push({ source, meta });
  }

  if (!candidates.length) {
    return { ok: false, blockers: ['SELL_METADATA_UNKNOWN'], sources: [], views: [] };
  }

  const blockers = [];
  const views = [];
  for (const candidate of candidates) {
    blockers.push(...sellProtectionReasons(candidate.meta));
    views.push({ source: candidate.source, safety: sellMetadataSafetyView(candidate.meta) });
  }

  const fingerprints = new Set(views.map((row) => JSON.stringify(row.safety)));
  if (fingerprints.size > 1) blockers.push('SELL_METADATA_CONFLICT');

  const resolvedBlockers = unique(blockers);
  return {
    ok: resolvedBlockers.length === 0,
    blockers: resolvedBlockers,
    sources: candidates.map((row) => row.source),
    views
  };
}

function sellSafetyStatus() {
  return {
    policy: 'plain-stackable-material-only',
    allowlistCannotOverride: true,
    allowedMetadataTypes: LOW_RISK_SELL_TYPES.slice(),
    requiresStackableMetadata: true,
    rawLevelledItemProtected: true,
    metadataConsensusRequiredAtLiveExecution: true,
    protectedSignals: [
      'quest', 'exchange', 'event', 'cash', 'soulbound', 'compound', 'upgrade',
      'grades', 'tier', 'scroll', 'wtype', 'class',
      'action', 'onclick', 'offering', 'throw', 'rare', 'ignore'
    ]
  };
}

module.exports = {
  LOW_RISK_SELL_TYPES,
  sellProtectionReasons,
  rawSellProtectionReasons,
  sellMetadataSafetyView,
  sellMetadataConsensus,
  sellSafetyStatus
};
