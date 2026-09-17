'use strict';

const MERCHANT_MLUCK_POLICY_MODE = 'merchant-mluck-policy-v1';

function finite(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function cleanName(value) {
  return String(value == null ? '' : value).trim();
}

function remainingMluckMs(effect, now = Date.now()) {
  if (!effect || typeof effect !== 'object') return null;
  for (const key of ['ms', 'remainingMs', 'remaining']) {
    const value = finite(effect[key]);
    if (value != null) return Math.max(0, value);
  }
  for (const key of ['expiresAt', 'expires', 'expiration']) {
    const value = finite(effect[key]);
    if (value != null) return Math.max(0, value - now);
  }
  return Infinity;
}

class MerchantMluckPolicy {
  constructor(options = {}) {
    this.refreshLeadMs = Math.max(1000, Math.min(60 * 60 * 1000, finite(options.refreshLeadMs, 5 * 60 * 1000)));
  }

  _row(target, index, now) {
    const effect = target && target.effect && typeof target.effect === 'object' ? target.effect : null;
    const remainingMs = remainingMluckMs(effect, now);
    let buffState = 'MISSING';
    if (effect) {
      if (remainingMs === Infinity) buffState = 'HEALTHY_UNKNOWN_EXPIRY';
      else if (remainingMs > this.refreshLeadMs) buffState = 'HEALTHY';
      else if (remainingMs > 0) buffState = 'EXPIRING';
    }
    return {
      id: target && target.id != null ? String(target.id) : '',
      name: cleanName(target && target.name),
      topologyIndex: Number.isInteger(target && target.topologyIndex) ? target.topologyIndex : index,
      valid: target && target.valid !== false,
      dead: !!(target && target.dead),
      reachable: target && target.reachable !== false,
      inRange: target && target.inRange !== false,
      antiSpamBlocked: !!(target && target.antiSpamBlocked),
      antiSpamUntil: finite(target && target.antiSpamUntil),
      remainingMs,
      buffState
    };
  }

  decide(input = {}) {
    const now = finite(input.now, Date.now());
    const merchant = input.merchant || {};
    const ctype = String(merchant.ctype || merchant.type || '').toLowerCase();
    if (ctype !== 'merchant') return { action: 'HOLD', reason: 'MERCHANT_REQUIRED', candidates: [] };
    if (merchant.rip === true || merchant.dead === true) return { action: 'HOLD', reason: 'MERCHANT_DEAD', candidates: [] };

    const rows = (Array.isArray(input.targets) ? input.targets : []).map((target, index) => this._row(target, index, now));
    if (!rows.length) return { action: 'HOLD', reason: 'PARTY_EMPTY', candidates: [] };

    const needsBuff = rows.filter((row) => row.buffState === 'MISSING' || row.buffState === 'EXPIRING');
    const candidates = needsBuff
      .filter((row) => row.valid && row.id && row.name && !row.dead && row.reachable && row.inRange && !row.antiSpamBlocked)
      .sort((a, b) => {
        const stateA = a.buffState === 'MISSING' ? 0 : 1;
        const stateB = b.buffState === 'MISSING' ? 0 : 1;
        if (stateA !== stateB) return stateA - stateB;
        const remainingA = a.remainingMs == null ? Infinity : a.remainingMs;
        const remainingB = b.remainingMs == null ? Infinity : b.remainingMs;
        if (remainingA !== remainingB) return remainingA - remainingB;
        if (a.topologyIndex !== b.topologyIndex) return a.topologyIndex - b.topologyIndex;
        const byName = a.name.localeCompare(b.name);
        return byName || a.id.localeCompare(b.id);
      });

    const selected = candidates[0] || null;
    if (selected) {
      return {
        action: 'CAST',
        reason: selected.buffState === 'MISSING' ? 'MLUCK_MISSING' : 'MLUCK_EXPIRING',
        target: { ...selected },
        candidates: candidates.map((row) => ({ ...row }))
      };
    }

    if (!needsBuff.length) return { action: 'HOLD', reason: 'MLUCK_HEALTHY', candidates: [], targets: rows };
    if (needsBuff.some((row) => row.valid && !row.dead && row.reachable && row.inRange && row.antiSpamBlocked)) {
      return { action: 'HOLD', reason: 'MLUCK_ANTI_SPAM', candidates: [], targets: rows };
    }
    if (needsBuff.some((row) => row.valid && !row.dead && row.reachable && !row.inRange)) {
      return { action: 'HOLD', reason: 'MLUCK_TARGET_OUT_OF_RANGE', candidates: [], targets: rows };
    }
    if (needsBuff.some((row) => row.valid && !row.dead && !row.reachable)) {
      return { action: 'HOLD', reason: 'MLUCK_TARGET_UNREACHABLE', candidates: [], targets: rows };
    }
    if (needsBuff.every((row) => row.dead || !row.valid || !row.id || !row.name)) {
      return { action: 'HOLD', reason: 'NO_VALID_MLUCK_TARGETS', candidates: [], targets: rows };
    }
    return { action: 'HOLD', reason: 'NO_ELIGIBLE_MLUCK_TARGET', candidates: [], targets: rows };
  }

  status() {
    return { schemaVersion: 1, mode: MERCHANT_MLUCK_POLICY_MODE, refreshLeadMs: this.refreshLeadMs };
  }
}

module.exports = { MerchantMluckPolicy, MERCHANT_MLUCK_POLICY_MODE, remainingMluckMs };
