'use strict';

const { AccountCharacterTransport, NAMED_RECEIVER_CM_PROTOCOL, cleanName } = require('../party/account-character-transport');
const PATCH = Symbol.for('AIO_V3_ALPHA20_19_ACCOUNT_TRANSPORT_PATCH');
const DIRECT_BACKOFF_MS = 15000;
const DIRECT_SKIP_LOG_INTERVAL_MS = 15000;

function finite(value) { const n = Number(value); return Number.isFinite(n) ? n : null; }
function boundedMessage(error) { return String(error && error.message || error || 'unknown').slice(0, 240); }
function fn(instance, name) {
  const root = instance && instance.root;
  return root && (root[name] || (root.parent && root.parent[name])) || null;
}

// Broader visibility is diagnostic only. In Adventure Land, a character can be
// visible through party/get_player/entities while command_character still emits
// "Character not found". Never use this function as direct action authority.
function strongLiveEvidence(instance, name) {
  const target = cleanName(name);
  if (!target || !instance || !instance.isOwned(target)) return { live: false, source: null };
  if (target === instance.localName()) return { live: true, source: 'local' };
  if (instance.activeNames().includes(target)) return { live: true, source: 'observed-active' };
  const getPlayer = fn(instance, 'get_player');
  if (typeof getPlayer === 'function') {
    try {
      const row = getPlayer.call(instance.root, target);
      if (row && typeof row === 'object' && row.dead !== true && row.rip !== true) return { live: true, source: 'get-player' };
    } catch (_) {}
  }
  const root = instance.root;
  const parent = root && root.parent || root;
  for (const collection of [root && root.entities, parent && parent.entities]) {
    if (!collection || typeof collection !== 'object') continue;
    for (const row of Object.values(collection)) {
      if (!row || typeof row !== 'object' || cleanName(row.name) !== target) continue;
      const playerLike = !!row.ctype || row.player === true || String(row.type || '').toLowerCase() === 'character' || !row.mtype;
      if (playerLike && row.dead !== true && row.rip !== true) return { live: true, source: 'entity' };
    }
  }
  for (const party of [root && root.party, parent && parent.party]) {
    if (!party || typeof party !== 'object') continue;
    const row = party[target] || Object.values(party).find((entry) => cleanName(entry && entry.name) === target);
    if (!row || typeof row !== 'object') continue;
    const liveShape = row.map != null || (finite(row.x) != null && finite(row.y) != null) || finite(row.hp) != null;
    if (liveShape && row.dead !== true && row.rip !== true) return { live: true, source: 'party' };
  }
  return { live: false, source: null };
}

function state(instance) {
  if (!instance.__alpha2019DirectBackoff) instance.__alpha2019DirectBackoff = new Map();
  if (!instance.__alpha2019DirectSkipLogAt) instance.__alpha2019DirectSkipLogAt = new Map();
  const stats = instance.stats || (instance.stats = {});
  for (const key of ['directSkippedBackoff','directEvidenceObservedActive','directEvidenceGetPlayer','directEvidenceEntity','directEvidenceParty','directSkipLogsSuppressed']) {
    if (!Number.isFinite(Number(stats[key]))) stats[key] = 0;
  }
  return instance.__alpha2019DirectBackoff;
}

function shouldLogDirectSkip(instance, target, reason, now) {
  state(instance);
  const key = `${cleanName(target)}:${String(reason || '')}`;
  const map = instance.__alpha2019DirectSkipLogAt;
  const previous = Number(map.get(key)) || 0;
  if (previous && now - previous < DIRECT_SKIP_LOG_INTERVAL_MS) {
    instance.stats.directSkipLogsSuppressed += 1;
    return false;
  }
  map.set(key, now);
  return true;
}

function installAlpha2019AccountTransportHotfix() {
  const proto = AccountCharacterTransport && AccountCharacterTransport.prototype;
  if (!proto || proto[PATCH]) return false;
  Object.defineProperty(proto, PATCH, { value: true, enumerable: false });
  const baseStatus = proto.status;

  proto.strongLiveEvidence = function(name) { return strongLiveEvidence(this, name); };
  proto.visibleOwnedNames = function() { return this.ownedNames().filter((name) => strongLiveEvidence(this, name).live); };
  proto.directEligibleOwnedNames = function() {
    const observed = new Set(this.activeNames());
    return this.ownedNames().filter((name) => observed.has(name));
  };

  proto.send = async function(targetName, payload, options = {}) {
    const target = cleanName(targetName);
    const sender = cleanName(options.sender) || this.localName();
    const receiver = cleanName(options.receiver);
    if (!target || !sender) throw new Error('ACCOUNT_TRANSPORT_INVALID_ENDPOINT');
    if (target === this.localName() && receiver && this.root && typeof this.root[receiver] === 'function') {
      this.root[receiver](sender, payload); this.stats.localDelivered += 1;
      return { delivered: true, transport: 'local', target, sender };
    }
    if (!this.isOwned(target)) {
      this.stats.rejectedNotOwned += 1;
      this._event('ACCOUNT_TRANSPORT_REJECTED', 'warn', 'TARGET_NOT_TRUSTED_OWN_CHARACTER', { target, sender });
      throw new Error(`TARGET_NOT_TRUSTED_OWN_CHARACTER:${target}`);
    }

    const backoff = state(this);
    const now = this.now();
    const until = Number(backoff.get(target)) || 0;
    if (until && until <= now) backoff.delete(target);

    // Direct routing authority is deliberately narrower than general visibility.
    // get_player, entity and party rows cannot prove command_character routability.
    const observedActive = this.activeNames();
    const directObserved = observedActive.includes(target);
    const broadEvidence = strongLiveEvidence(this, target);
    const commandCharacter = fn(this, 'command_character');

    if (receiver && typeof commandCharacter === 'function' && directObserved && until <= now) {
      this.stats.directEvidenceObservedActive += 1;
      try {
        await Promise.resolve(commandCharacter.call(this.root, target, this._directCode(receiver, sender, payload)));
        this.stats.directSent += 1; backoff.delete(target);
        return { delivered: true, transport: 'command_character', target, sender, evidence: 'observed-active' };
      } catch (error) {
        this.stats.directFailed += 1; backoff.set(target, now + DIRECT_BACKOFF_MS);
        this._event('ACCOUNT_TRANSPORT_DIRECT_FAILED', 'warn', 'COMMAND_CHARACTER_FAILED', { target, sender, evidence: 'observed-active', backoffMs: DIRECT_BACKOFF_MS, message: boundedMessage(error) });
      }
    } else if (receiver && typeof commandCharacter === 'function' && directObserved && until > now) {
      this.stats.directSkippedBackoff += 1;
      if (shouldLogDirectSkip(this, target, 'DIRECT_FAILURE_BACKOFF', now)) {
        this._event('ACCOUNT_TRANSPORT_DIRECT_SKIPPED', 'info', 'DIRECT_FAILURE_BACKOFF', { target, sender, backoffRemainingMs: until - now });
      }
    } else if (receiver && typeof commandCharacter === 'function' && !directObserved) {
      this.stats.directSkippedUnobserved += 1;
      if (shouldLogDirectSkip(this, target, 'TARGET_NOT_OBSERVED_ACTIVE', now)) {
        this._event('ACCOUNT_TRANSPORT_DIRECT_SKIPPED', 'info', 'TARGET_NOT_OBSERVED_ACTIVE', {
          target,
          sender,
          observedActive,
          broaderVisibility: broadEvidence.live,
          broaderVisibilitySource: broadEvidence.source
        });
      }
    }

    if (!this.fallbackEnabled) throw new Error(`ACCOUNT_TRANSPORT_DIRECT_UNAVAILABLE:${target}`);
    const sendCm = fn(this, 'send_cm');
    if (typeof sendCm !== 'function') throw new Error('SEND_CM_UNAVAILABLE');
    try {
      // Preserve the named receiver contract from AccountCharacterTransport.
      // Without this envelope the recipient sees a plain CM payload and cannot
      // route Alpha27 target authority (or any other addressed receiver).
      const body = receiver
        ? { __aioProtocol: NAMED_RECEIVER_CM_PROTOCOL, receiver, payload: payload == null ? null : payload }
        : payload;
      await Promise.resolve(sendCm.call(this.root, target, body));
      this.stats.fallbackSent += 1;
      return { delivered: true, transport: 'send_cm', target, sender };
    } catch (error) {
      this.stats.fallbackFailed += 1;
      this._event('ACCOUNT_TRANSPORT_FALLBACK_FAILED', 'warn', 'SEND_CM_FAILED', { target, sender, message: boundedMessage(error) });
      throw error;
    }
  };

  proto.status = function() {
    const base = baseStatus.call(this); const now = this.now(); const backoff = state(this);
    return {
      ...base,
      schemaVersion: 4,
      mode: 'observed-active-command-character-else-cm-with-backoff',
      visibleOwnedNames: this.visibleOwnedNames(),
      directEligibleOwnedNames: this.directEligibleOwnedNames(),
      directRequiresObservedActive: true,
      directRequiresStrongLiveEvidence: false,
      broaderVisibilityIsDiagnosticOnly: true,
      directFailureBackoffMs: DIRECT_BACKOFF_MS,
      directSkipLogIntervalMs: DIRECT_SKIP_LOG_INTERVAL_MS,
      directBackoffs: [...backoff.entries()].filter(([, until]) => Number(until) > now).map(([name, until]) => ({ name, until, remainingMs: Number(until) - now })),
      stats: { ...this.stats }
    };
  };
  return true;
}

module.exports = { DIRECT_BACKOFF_MS, DIRECT_SKIP_LOG_INTERVAL_MS, strongLiveEvidence, shouldLogDirectSkip, installAlpha2019AccountTransportHotfix };