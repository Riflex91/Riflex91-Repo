'use strict';

const COMBAT_CLASSES = new Set(['warrior', 'paladin', 'rogue', 'ranger', 'mage', 'priest']);
const ACTIVE_CHARACTER_STATES = new Set(['self', 'starting', 'loading', 'active', 'code']);

// Account identity comes from get_characters(); get_active_characters() is only
// a same-account runner/liveness compatibility source and never invents names.

function cleanName(value) {
  const name = String(value == null ? '' : value).trim();
  return name || null;
}

function cleanCtype(value) {
  const ctype = String(value == null ? '' : value).trim().toLowerCase();
  return ctype || null;
}

function readFunction(root, name) {
  return root && (root[name] || root.parent && root.parent[name]) || null;
}

function rawRows(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return Object.values(value);
  return [];
}

function onlineFlag(value) {
  if (value === true || value === 1) return true;
  if (value === false || value === 0 || value == null) return false;
  const normalized = String(value).trim().toLowerCase();
  return !['', '0', 'false', 'offline', 'none', 'null', 'undefined'].includes(normalized);
}

function normalizeCharacter(row) {
  if (!row || typeof row !== 'object') return null;
  const name = cleanName(row.name);
  if (!name) return null;
  return {
    name,
    ctype: cleanCtype(row.ctype || row.type),
    online: onlineFlag(row.online),
    server: row.server || row.server_identifier || null,
    region: row.region || row.server_region || null
  };
}

function uniqueCharacters(rows) {
  const byName = new Map();
  for (const raw of rows || []) {
    const row = normalizeCharacter(raw);
    if (!row) continue;
    const previous = byName.get(row.name);
    byName.set(row.name, previous ? {
      ...previous,
      ...row,
      ctype: row.ctype || previous.ctype,
      online: row.online || previous.online
    } : row);
  }
  return [...byName.values()];
}

class DynamicPartyRosterDiscovery {
  constructor(options = {}) {
    this.root = options.root || options.runtime && options.runtime.root || globalThis;
    this.now = options.now || options.runtime && options.runtime.now || (() => Date.now());
    const configuredSettleMs = Number(options.settleMs);
    this.settleMs = Number.isFinite(configuredSettleMs)
      ? Math.max(0, Math.min(15000, configuredSettleMs))
      : 1500;
    this.pendingSignature = null;
    this.pendingSince = 0;
    this.lastStatus = null;
  }

  _local() {
    const character = this.root && (this.root.character || this.root.parent && this.root.parent.character) || null;
    if (!character || !cleanName(character.name)) return null;
    return {
      name: cleanName(character.name),
      ctype: cleanCtype(character.ctype || character.type),
      online: true
    };
  }

  _accountSnapshot() {
    const fn = readFunction(this.root, 'get_characters');
    if (typeof fn !== 'function') return { available: false, rows: [] };
    try {
      const value = fn.call(this.root);
      return { available: value != null, rows: uniqueCharacters(rawRows(value)) };
    } catch (_) {
      return { available: false, rows: [] };
    }
  }

  _activeSnapshot() {
    const fn = readFunction(this.root, 'get_active_characters');
    if (typeof fn !== 'function') return { available: false, names: [] };
    try {
      const value = fn.call(this.root);
      const names = value && typeof value === 'object'
        ? Object.entries(value)
          .filter(([, state]) => ACTIVE_CHARACTER_STATES.has(String(state)))
          .map(([name]) => cleanName(name))
          .filter(Boolean)
        : [];
      const local = this._local();
      if (local && !names.includes(local.name)) names.push(local.name);
      return { available: value != null, names: [...new Set(names)] };
    } catch (_) {
      return { available: false, names: [] };
    }
  }

  _candidate() {
    const local = this._local();
    const account = this._accountSnapshot();
    const active = this._activeSnapshot();

    if (!local) {
      return {
        readyCandidate: false,
        reason: 'DYNAMIC_ROSTER_LOCAL_CHARACTER_UNAVAILABLE',
        local: null,
        account,
        active,
        roster: [],
        merchantName: null
      };
    }

    if (!account.available) {
      if (active.names.length > 4) {
        return {
          readyCandidate: false,
          reason: 'ACTIVE_CHARACTER_LIMIT_EXCEEDED',
          local,
          account,
          active,
          roster: active.names.map((name) => ({
            name,
            ctype: name === local.name ? local.ctype : null,
            online: true
          })),
          merchantName: local.ctype === 'merchant' ? local.name : null
        };
      }

      // get_active_characters() is an Adventure Land same-account CODE-runner
      // view. It is safe as a compatibility fallback when get_characters() is
      // unavailable, but only the local Merchant can establish Merchant
      // identity because class metadata for the other active names is absent.
      if (local.ctype === 'merchant' && active.names.length >= 2 && active.names.length <= 4) {
        const roster = [
          local,
          ...active.names
            .filter((name) => name !== local.name)
            .sort((a, b) => a.localeCompare(b))
            .map((name) => ({ name, ctype: null, online: true }))
        ];
        return {
          readyCandidate: true,
          settleRequired: false,
          source: 'get_active_characters-compatibility-fallback',
          reason: 'DYNAMIC_ROSTER_ACTIVE_RUNNER_FALLBACK_VALID',
          local,
          account,
          active,
          roster,
          merchantName: local.name
        };
      }

      return {
        readyCandidate: false,
        reason: local.ctype === 'merchant'
          ? 'DYNAMIC_ROSTER_WAITING_FOR_COMBAT_CHARACTER'
          : 'DYNAMIC_ROSTER_ACCOUNT_CHARACTER_STATE_UNAVAILABLE',
        local,
        account,
        active,
        roster: [local],
        merchantName: local.ctype === 'merchant' ? local.name : null
      };
    }

    const activeSet = new Set(active.names);
    let online = account.rows.filter((row) => row.online || activeSet.has(row.name) || row.name === local.name);
    if (!online.some((row) => row.name === local.name)) online.push(local);
    online = uniqueCharacters(online);

    if (online.length > 4) {
      return {
        readyCandidate: false,
        reason: 'ACTIVE_CHARACTER_LIMIT_EXCEEDED',
        local,
        account,
        active,
        roster: online,
        merchantName: null
      };
    }

    const unsupported = online.filter((row) => row.ctype !== 'merchant' && !COMBAT_CLASSES.has(row.ctype));
    if (unsupported.length) {
      return {
        readyCandidate: false,
        reason: 'DYNAMIC_ROSTER_UNSUPPORTED_ONLINE_CHARACTER',
        local,
        account,
        active,
        roster: online,
        unsupported: unsupported.map((row) => ({ name: row.name, ctype: row.ctype })),
        merchantName: null
      };
    }

    const merchants = online.filter((row) => row.ctype === 'merchant');
    const combat = online.filter((row) => COMBAT_CLASSES.has(row.ctype));

    if (!merchants.length) {
      return {
        readyCandidate: false,
        reason: 'DYNAMIC_ROSTER_WAITING_FOR_MERCHANT',
        local,
        account,
        active,
        roster: online,
        merchantName: null
      };
    }
    if (merchants.length !== 1) {
      return {
        readyCandidate: false,
        reason: 'DYNAMIC_ROSTER_AMBIGUOUS_MERCHANT',
        local,
        account,
        active,
        roster: online,
        merchantName: null
      };
    }
    if (combat.length < 1) {
      return {
        readyCandidate: false,
        reason: 'DYNAMIC_ROSTER_WAITING_FOR_COMBAT_CHARACTER',
        local,
        account,
        active,
        roster: online,
        merchantName: merchants[0].name
      };
    }
    if (combat.length > 3 || online.length < 2 || online.length > 4) {
      return {
        readyCandidate: false,
        reason: 'ACTIVE_CHARACTER_LIMIT_EXCEEDED',
        local,
        account,
        active,
        roster: online,
        merchantName: merchants[0].name
      };
    }

    const roster = [
      merchants[0],
      ...combat.slice().sort((a, b) => a.name.localeCompare(b.name))
    ];
    return {
      readyCandidate: true,
      reason: 'DYNAMIC_ROSTER_CANDIDATE_VALID',
      local,
      account,
      active,
      roster,
      merchantName: merchants[0].name
    };
  }

  refresh() {
    const at = this.now();
    const candidate = this._candidate();
    const signature = candidate.readyCandidate
      ? candidate.roster.map((row) => `${row.name}:${row.ctype}`).join('|')
      : null;

    if (!signature) {
      this.pendingSignature = null;
      this.pendingSince = 0;
      this.lastStatus = {
        schemaVersion: 1,
        mode: 'dynamic-account-party-roster-discovery-v1',
        source: 'get_characters-online',
        actionAuthority: false,
        ready: false,
        reason: candidate.reason,
        merchantName: candidate.merchantName || null,
        roster: candidate.roster.map((row) => ({ name: row.name, ctype: row.ctype })),
        accountStateAvailable: candidate.account.available,
        activeStateAvailable: candidate.active.available,
        observedActiveNames: candidate.active.names.slice(),
        accountCharacters: candidate.account.rows.map((row) => ({ name: row.name, ctype: row.ctype, online: row.online })),
        unsupported: candidate.unsupported || [],
        candidateSince: null,
        settleMs: this.settleMs,
        local: candidate.local
      };
      return this.status();
    }

    if (signature !== this.pendingSignature) {
      this.pendingSignature = signature;
      this.pendingSince = at;
    }

    const settled = candidate.settleRequired === false
      || this.settleMs === 0
      || at - this.pendingSince >= this.settleMs;
    this.lastStatus = {
      schemaVersion: 1,
      mode: 'dynamic-account-party-roster-discovery-v1',
      source: candidate.source || 'get_characters-online',
      actionAuthority: false,
      ready: settled,
      reason: settled ? 'DYNAMIC_ROSTER_READY' : 'DYNAMIC_ROSTER_SETTLING',
      merchantName: candidate.merchantName,
      roster: candidate.roster.map((row) => ({ name: row.name, ctype: row.ctype })),
      accountStateAvailable: candidate.account.available,
      activeStateAvailable: candidate.active.available,
      observedActiveNames: candidate.active.names.slice(),
      accountCharacters: candidate.account.rows.map((row) => ({ name: row.name, ctype: row.ctype, online: row.online })),
      unsupported: [],
      candidateSince: this.pendingSince,
      settleMs: this.settleMs,
      local: candidate.local
    };
    return this.status();
  }

  status() {
    return this.lastStatus ? JSON.parse(JSON.stringify(this.lastStatus)) : {
      schemaVersion: 1,
      mode: 'dynamic-account-party-roster-discovery-v1',
      source: 'get_characters-online',
      actionAuthority: false,
      ready: false,
      reason: 'DYNAMIC_ROSTER_NOT_OBSERVED',
      merchantName: null,
      roster: [],
      accountStateAvailable: false,
      activeStateAvailable: false,
      observedActiveNames: [],
      accountCharacters: [],
      unsupported: [],
      candidateSince: null,
      settleMs: this.settleMs,
      local: null
    };
  }
}

module.exports = {
  DynamicPartyRosterDiscovery,
  COMBAT_CLASSES,
  ACTIVE_CHARACTER_STATES,
  cleanName,
  cleanCtype,
  onlineFlag,
  normalizeCharacter,
  uniqueCharacters
};
