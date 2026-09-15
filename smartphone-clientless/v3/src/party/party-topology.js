'use strict';

const PARTY_TOPOLOGY_MIN_SIZE = 2;
const PARTY_TOPOLOGY_MAX_SIZE = 4;
const PARTY_TOPOLOGY_MIN_COMBAT = 1;
const PARTY_TOPOLOGY_MAX_COMBAT = 3;
const PARTY_TOPOLOGY_COMBAT_CLASSES = new Set(['warrior', 'paladin', 'priest', 'ranger', 'rogue', 'mage']);

function cleanName(value) {
  const name = String(value == null ? '' : value).trim();
  return name || null;
}

function cleanType(value) {
  const type = String(value == null ? '' : value).trim().toLowerCase();
  return type || null;
}

function normalizeMember(member) {
  if (typeof member === 'string') return { name: cleanName(member), ctype: null, source: member };
  if (!member || typeof member !== 'object') return { name: null, ctype: null, source: member };
  return {
    name: cleanName(member.name),
    ctype: cleanType(member.ctype || member.type),
    source: member
  };
}

function inspectPartyTopology(members, options = {}) {
  const normalized = Array.isArray(members) ? members.map(normalizeMember) : [];
  const names = normalized.map((member) => member.name).filter(Boolean);
  const uniqueNames = [...new Set(names)];
  const merchants = normalized.filter((member) => member.ctype === 'merchant');
  const supportedCombat = normalized.filter((member) => PARTY_TOPOLOGY_COMBAT_CLASSES.has(member.ctype));
  const unsupported = normalized.filter((member) => member.ctype && member.ctype !== 'merchant' && !PARTY_TOPOLOGY_COMBAT_CLASSES.has(member.ctype));
  const requestedMerchant = cleanName(options.merchantName);
  const reasons = [];

  if (!Array.isArray(members)) reasons.push('PARTY_MEMBERS_REQUIRED');
  if (normalized.length < PARTY_TOPOLOGY_MIN_SIZE) reasons.push('PARTY_SIZE_BELOW_MINIMUM');
  if (normalized.length > PARTY_TOPOLOGY_MAX_SIZE) reasons.push('PARTY_SIZE_ABOVE_MAXIMUM');
  if (normalized.some((member) => !member.name)) reasons.push('PARTY_MEMBER_NAME_REQUIRED');
  if (uniqueNames.length !== names.length) reasons.push('PARTY_MEMBER_NAMES_MUST_BE_UNIQUE');
  if (merchants.length !== 1) reasons.push('EXACTLY_ONE_MERCHANT_REQUIRED');
  if (supportedCombat.length < PARTY_TOPOLOGY_MIN_COMBAT) reasons.push('COMBAT_MEMBER_REQUIRED');
  if (supportedCombat.length > PARTY_TOPOLOGY_MAX_COMBAT) reasons.push('TOO_MANY_COMBAT_MEMBERS');
  if (unsupported.length) reasons.push('UNSUPPORTED_COMBAT_CLASS');
  if (normalized.some((member) => !member.ctype)) reasons.push('PARTY_MEMBER_TYPE_REQUIRED');
  if (requestedMerchant && (!merchants[0] || merchants[0].name !== requestedMerchant)) reasons.push('MERCHANT_IDENTITY_MISMATCH');

  const valid = reasons.length === 0;
  return {
    valid,
    reasons: [...new Set(reasons)],
    expectedSize: normalized.length,
    merchant: merchants.length === 1 ? merchants[0].source : null,
    merchantName: merchants.length === 1 ? merchants[0].name : null,
    combatMembers: supportedCombat.map((member) => member.source),
    combatNames: supportedCombat.map((member) => member.name),
    memberNames: names,
    unsupportedMembers: unsupported.map((member) => member.source),
    supportedCombatClasses: [...PARTY_TOPOLOGY_COMBAT_CLASSES]
  };
}

class PartyTopology {
  constructor(members, options = {}) {
    const inspected = inspectPartyTopology(members, options);
    this.valid = inspected.valid;
    this.reasons = Object.freeze(inspected.reasons.slice());
    this.expectedSize = inspected.expectedSize;
    this.merchant = inspected.merchant;
    this.merchantName = inspected.merchantName;
    this.combatMembers = Object.freeze(inspected.combatMembers.slice());
    this.combatNames = Object.freeze(inspected.combatNames.slice());
    this.memberNames = Object.freeze(inspected.memberNames.slice());
    this.unsupportedMembers = Object.freeze(inspected.unsupportedMembers.slice());
    this.supportedCombatClasses = Object.freeze(inspected.supportedCombatClasses.slice());
    Object.freeze(this);
  }

  static inspect(members, options = {}) {
    return inspectPartyTopology(members, options);
  }

  static from(members, options = {}) {
    return new PartyTopology(members, options);
  }
}

module.exports = {
  PartyTopology,
  inspectPartyTopology,
  PARTY_TOPOLOGY_MIN_SIZE,
  PARTY_TOPOLOGY_MAX_SIZE,
  PARTY_TOPOLOGY_MIN_COMBAT,
  PARTY_TOPOLOGY_MAX_COMBAT,
  PARTY_TOPOLOGY_COMBAT_CLASSES
};
