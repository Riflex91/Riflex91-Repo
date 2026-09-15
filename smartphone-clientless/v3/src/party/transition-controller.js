'use strict';

const base = require('./transition-controller-base');

function memberName(member) {
  return typeof member === 'string' ? member : member && member.name;
}

class PartyTransitionController extends base.PartyTransitionController {
  preflight(plan, context = {}) {
    const result = super.preflight(plan, context);
    const reasons = result.reasons.filter((reason) => reason !== 'PARTY_SIZE_MUST_BE_FOUR');
    const targetMembers = Array.isArray(plan && plan.members) ? plan.members : [];
    const targetNames = result.targetNames || [];
    const registry = context.registryStatus || { characters: [] };
    const byName = new Map((registry.characters || []).filter(Boolean).map((entry) => [String(entry.name), entry]));

    if (targetNames.length < 2) reasons.push('PARTY_SIZE_BELOW_MINIMUM');
    if (targetNames.length > 4) reasons.push('PARTY_SIZE_ABOVE_MAXIMUM');

    const desiredMerchant = result.merchantName;
    const merchantNames = new Set();
    for (const member of targetMembers) {
      const name = memberName(member);
      const row = member && typeof member === 'object' ? member : byName.get(String(name || ''));
      if (row && String(row.ctype || row.type || '').toLowerCase() === 'merchant' && name) merchantNames.add(String(name));
    }
    for (const name of targetNames) {
      const row = byName.get(String(name));
      if (row && String(row.ctype || row.type || '').toLowerCase() === 'merchant') merchantNames.add(String(name));
    }
    if (desiredMerchant && targetNames.includes(desiredMerchant)) merchantNames.add(String(desiredMerchant));
    if (merchantNames.size !== 1 || (desiredMerchant && !merchantNames.has(String(desiredMerchant)))) {
      reasons.push('EXACTLY_ONE_MERCHANT_REQUIRED');
    }

    result.reasons = [...new Set(reasons)];
    result.allowed = result.reasons.length === 0;
    return result;
  }
}

module.exports = { PartyTransitionController, TransitionState: base.TransitionState };
