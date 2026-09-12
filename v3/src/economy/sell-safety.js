'use strict';

const LOW_RISK_SELL_TYPES = Object.freeze(['material', 'misc']);
const LOW_RISK_SELL_TYPE_SET = new Set(LOW_RISK_SELL_TYPES);

function sellProtectionReasons(meta) {
  if (!meta || typeof meta !== 'object') return ['SELL_METADATA_UNKNOWN'];

  const reasons = [];
  const type = String(meta.type || '').toLowerCase();

  if (!LOW_RISK_SELL_TYPE_SET.has(type)) reasons.push('SELL_TYPE_NOT_LOW_RISK');
  if (type === 'quest' || meta.quest != null) reasons.push('SELL_QUEST_PROTECTED');
  if (meta.e != null || meta.exchange != null) reasons.push('SELL_EXCHANGE_PROTECTED');
  if (meta.event === true || typeof meta.event === 'string') reasons.push('SELL_EVENT_PROTECTED');
  if (meta.cash != null && meta.cash !== false) reasons.push('SELL_CASH_PROTECTED');
  if (meta.soulbound === true) reasons.push('SELL_SOULBOUND_PROTECTED');
  if (meta.compound === true) reasons.push('SELL_COMPOUND_PROTECTED');
  if (meta.upgrade != null && meta.upgrade !== false) reasons.push('SELL_UPGRADE_PROTECTED');

  return [...new Set(reasons)];
}

function sellSafetyStatus() {
  return {
    policy: 'low-risk-metadata-only',
    allowlistCannotOverride: true,
    allowedMetadataTypes: LOW_RISK_SELL_TYPES.slice(),
    protectedSignals: [
      'quest',
      'exchange',
      'event',
      'cash',
      'soulbound',
      'compound',
      'upgrade',
      'non-low-risk-type'
    ]
  };
}

module.exports = {
  LOW_RISK_SELL_TYPES,
  sellProtectionReasons,
  sellSafetyStatus
};
