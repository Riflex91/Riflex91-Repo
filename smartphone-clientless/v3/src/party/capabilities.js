'use strict';

const CLASS_PRIORS = Object.freeze({
  ranger: ['ranged_damage', 'multi_target_damage', 'kiting'],
  priest: ['ranged_damage', 'healing', 'party_sustain', 'revive_support'],
  warrior: ['melee_damage', 'high_survivability', 'aggro_control', 'frontline'],
  mage: ['ranged_damage', 'burst_damage', 'multi_target_damage', 'mobility_support'],
  rogue: ['melee_damage', 'burst_damage', 'mobility'],
  paladin: ['melee_damage', 'high_survivability', 'party_sustain'],
  merchant: ['trading', 'banking', 'crafting', 'logistics']
});

function capabilitiesFor(ctype) {
  return (CLASS_PRIORS[String(ctype || '').toLowerCase()] || []).slice();
}

function partyProfile(members = []) {
  const normalized = members.map((member) => {
    const ctype = String(member.ctype || member.type || 'unknown').toLowerCase();
    return {
      name: member.name || 'unknown',
      ctype,
      level: Number(member.level) || 0,
      capabilities: capabilitiesFor(ctype)
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
  const counts = {};
  const capabilities = {};
  for (const member of normalized) {
    counts[member.ctype] = (counts[member.ctype] || 0) + 1;
    for (const capability of member.capabilities) capabilities[capability] = (capabilities[capability] || 0) + 1;
  }
  const fingerprint = Object.keys(counts).sort().map((ctype) => `${ctype}:${counts[ctype]}`).join('|') || 'solo:unknown';
  return { members: normalized, counts, capabilities, fingerprint };
}

module.exports = { CLASS_PRIORS, capabilitiesFor, partyProfile };
