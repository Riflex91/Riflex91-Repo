'use strict';

const {
  AccountCharacterTransport,
  NAMED_RECEIVER_CM_PROTOCOL,
  cleanName
} = require('../party/account-character-transport');

const PATCH = Symbol.for('AIO_V3_ALPHA20_57_RELIABLE_ACCOUNT_TRANSPORT_PATCH');
const RELIABLE_RECEIVER = '__AIO_V3_ACCOUNT_TRANSPORT_RELIABLE';
const DELIVERY_KIND = 'DELIVERY';
const ACK_KIND = 'ACK';
const DEFAULT_ACK_TIMEOUT_MS = 1200;
const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_RETRY_BACKOFF_MS = 250;
const DEDUPE_TTL_MS = 60000;
const MAX_DEDUPE_ENTRIES = 256;

function boundedMessage(error) {
  return String(error && error.message || error || 'unknown').slice(0, 240);
}

function isStorageQuotaError(error) {
  return /QuotaExceededError|exceeded the quota|quota.*storage|storage.*quota/i.test(String(error && error.message || error || ''));
}

function boundedInteger(value, fallback, min, max) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function cleanMessageId(value) {
  const id = String(value == null ? '' : value).trim().slice(0, 180);
  return id || null;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, Number(ms) || 0)));
}

function functionOf(instance, name) {
  const root = instance && instance.root;
  return root && (root[name] || (root.parent && root.parent[name])) || null;
}

function ensureStats(instance) {
  const stats = instance.stats || (instance.stats = {});
  for (const key of [
    'deliveryAttempted',
    'remoteReceived',
    'receiverAccepted',
    'ackSent',
    'ackReceived',
    'deliveryRetries',
    'deliveryTimeouts',
    'deliveryFailedSafe',
    'duplicatesSuppressed',
    'cmRouterRepairs'
  ]) {
    if (!Number.isFinite(Number(stats[key]))) stats[key] = 0;
  }
  return stats;
}

function reliableState(instance) {
  ensureStats(instance);
  if (!instance.__alpha2057ReliableTransport) {
    instance.__alpha2057ReliableTransport = {
      pending: new Map(),
      inflight: new Map(),
      received: new Map(),
      sequence: 0,
      handler: null
    };
  }
  return instance.__alpha2057ReliableTransport;
}

function pruneReceived(instance) {
  const state = reliableState(instance);
  const now = instance.now();
  for (const [key, row] of state.received.entries()) {
    if (!row || Number(row.expiresAt) <= now) state.received.delete(key);
  }
  while (state.received.size > MAX_DEDUPE_ENTRIES) {
    const oldest = state.received.keys().next();
    if (oldest.done) break;
    state.received.delete(oldest.value);
  }
}

function sendAck(instance, target, message, accepted, reason) {
  const targetName = cleanName(target);
  const messageId = cleanMessageId(message && message.messageId);
  const sendCm = functionOf(instance, 'send_cm');
  if (!targetName || !messageId || typeof sendCm !== 'function') return false;

  const envelope = {
    __aioProtocol: NAMED_RECEIVER_CM_PROTOCOL,
    receiver: RELIABLE_RECEIVER,
    payload: {
      kind: ACK_KIND,
      messageId,
      receiver: cleanName(message && message.receiver),
      accepted: accepted === true,
      reason: reason == null ? null : String(reason).slice(0, 160)
    }
  };

  Promise.resolve()
    .then(() => sendCm.call(instance.root, targetName, envelope))
    .then(() => {
      instance.stats.ackSent += 1;
      instance._event('ACCOUNT_TRANSPORT_ACK_SENT', 'info', accepted ? 'NAMED_RECEIVER_ACCEPTED' : (reason || 'NAMED_RECEIVER_REJECTED'), {
        target: targetName,
        messageId,
        receiver: envelope.payload.receiver,
        accepted: accepted === true
      });
    })
    .catch((error) => {
      instance.stats.fallbackFailed += 1;
      instance._event('ACCOUNT_TRANSPORT_FALLBACK_FAILED', 'warn', 'ACK_SEND_CM_FAILED', {
        target: targetName,
        messageId,
        message: boundedMessage(error)
      });
    });
  return true;
}

function handleAck(instance, sender, data) {
  const state = reliableState(instance);
  const senderName = cleanName(sender);
  const messageId = cleanMessageId(data && data.messageId);
  const pending = senderName && messageId ? state.pending.get(`${senderName}:${messageId}`) : null;
  if (!pending) {
    instance.stats.fallbackRejected += 1;
    instance._event('ACCOUNT_TRANSPORT_FALLBACK_REJECTED', 'warn', 'ACK_NOT_PENDING_OR_WRONG_SENDER', {
      sender: senderName,
      messageId
    });
    return false;
  }

  instance.stats.ackReceived += 1;
  instance._event('ACCOUNT_TRANSPORT_ACK_RECEIVED', data.accepted === true ? 'info' : 'warn', data.accepted === true ? 'REMOTE_DELIVERY_CONFIRMED' : (data.reason || 'REMOTE_RECEIVER_REJECTED'), {
    sender: senderName,
    messageId,
    receiver: cleanName(data.receiver) || pending.receiver,
    accepted: data.accepted === true,
    attempt: pending.attempt
  });
  pending.settle({
    accepted: data.accepted === true,
    reason: data.reason == null ? null : String(data.reason).slice(0, 160)
  });
  return true;
}

function handleDelivery(instance, sender, data) {
  const state = reliableState(instance);
  const senderName = cleanName(sender);
  const messageId = cleanMessageId(data && data.messageId);
  const receiver = cleanName(data && data.receiver);
  const trusted = !instance.trustedNames.size || (senderName && instance.trustedNames.has(senderName));
  const receiverAvailable = !!(receiver && instance.root && typeof instance.root[receiver] === 'function');

  instance.stats.remoteReceived += 1;
  instance._event('ACCOUNT_TRANSPORT_REMOTE_RECEIVED', 'info', null, {
    sender: senderName,
    messageId,
    receiver,
    trusted,
    receiverAvailable
  });

  if (!trusted) {
    instance.stats.fallbackRejected += 1;
    sendAck(instance, senderName, data, false, 'SENDER_NOT_TRUSTED_OWN_CHARACTER');
    return false;
  }
  if (!messageId) {
    instance.stats.fallbackRejected += 1;
    return false;
  }

  pruneReceived(instance);
  const key = `${senderName || 'unknown'}:${messageId}`;
  const previous = state.received.get(key);
  if (previous) {
    instance.stats.duplicatesSuppressed += 1;
    instance._event('ACCOUNT_TRANSPORT_DUPLICATE_SUPPRESSED', 'info', 'MESSAGE_ID_ALREADY_PROCESSED', {
      sender: senderName,
      messageId,
      receiver,
      accepted: previous.accepted === true
    });
    sendAck(instance, senderName, data, previous.accepted === true, previous.reason);
    return previous.accepted === true;
  }

  let accepted = false;
  let reason = null;
  if (!receiverAvailable) {
    reason = 'NAMED_RECEIVER_UNAVAILABLE';
  } else {
    try {
      const result = instance.root[receiver](senderName || sender, data.payload);
      if (result && typeof result.then === 'function') reason = 'ASYNC_NAMED_RECEIVER_UNSUPPORTED';
      else if (result === false) reason = 'NAMED_RECEIVER_REJECTED';
      else {
        accepted = true;
        reason = 'NAMED_RECEIVER_ACCEPTED';
      }
    } catch (error) {
      reason = `NAMED_RECEIVER_FAILED:${boundedMessage(error)}`;
    }
  }

  state.received.set(key, {
    accepted,
    reason,
    expiresAt: instance.now() + DEDUPE_TTL_MS
  });
  pruneReceived(instance);
  if (accepted) instance.stats.receiverAccepted += 1;
  else instance.stats.fallbackRejected += 1;
  sendAck(instance, senderName, data, accepted, reason);
  return accepted;
}

function handleReliableMessage(instance, sender, data) {
  if (!data || typeof data !== 'object') return false;
  if (data.kind === ACK_KIND) return handleAck(instance, sender, data);
  if (data.kind === DELIVERY_KIND) return handleDelivery(instance, sender, data);
  instance.stats.fallbackRejected += 1;
  instance._event('ACCOUNT_TRANSPORT_FALLBACK_REJECTED', 'warn', 'RELIABLE_MESSAGE_KIND_UNKNOWN', {
    sender: cleanName(sender),
    kind: String(data.kind || '')
  });
  return false;
}

function ensureReliableReceiver(instance, baseInstallDirectReceiver) {
  if (!instance || !instance.root) return false;
  const state = reliableState(instance);
  if (!state.handler) state.handler = (sender, data) => handleReliableMessage(instance, sender, data);
  const installed = baseInstallDirectReceiver.call(instance, RELIABLE_RECEIVER, state.handler);
  try { instance._installCmRouter(); } catch (_) {}
  return installed;
}

function messageId(instance, target, receiver, requested) {
  const explicit = cleanMessageId(requested);
  if (explicit) return explicit;
  const state = reliableState(instance);
  state.sequence += 1;
  return `aio-${instance.localName() || 'unknown'}-${target}-${receiver}-${instance.now()}-${state.sequence}`.slice(0, 180);
}

function pendingAck(instance, target, id, receiver) {
  const state = reliableState(instance);
  const key = `${target}:${id}`;
  let settled = false;
  let resolvePromise;
  const promise = new Promise((resolve) => { resolvePromise = resolve; });
  const pending = {
    receiver,
    attempt: 0,
    settle(result) {
      if (settled) return false;
      settled = true;
      resolvePromise(result);
      return true;
    }
  };
  state.pending.set(key, pending);
  return { key, pending, promise };
}

function deliveryResult(instance, target, sender, receiver, id, attempt, ack) {
  if (ack && ack.accepted === true) {
    return {
      delivered: true,
      transport: 'send_cm-ack',
      target,
      sender,
      receiver,
      messageId: id,
      attempts: attempt,
      reason: 'REMOTE_ACK_CONFIRMED'
    };
  }

  const reason = ack && ack.reason || 'REMOTE_RECEIVER_REJECTED';
  instance.stats.deliveryFailedSafe += 1;
  instance._event('ACCOUNT_TRANSPORT_DELIVERY_FAILED_SAFE', 'error', reason, {
    target,
    sender,
    receiver,
    messageId: id,
    attempt,
    remoteReceived: true
  });
  return {
    delivered: false,
    transport: 'send_cm-ack',
    target,
    sender,
    receiver,
    messageId: id,
    attempts: attempt,
    reason
  };
}

async function sendReliable(instance, targetName, payload, options, baseInstallDirectReceiver) {
  const target = cleanName(targetName);
  const sender = cleanName(options && options.sender) || instance.localName();
  const receiver = cleanName(options && options.receiver);
  if (!target || !sender) throw new Error('ACCOUNT_TRANSPORT_INVALID_ENDPOINT');
  if (!receiver) throw new Error('ACCOUNT_TRANSPORT_ACK_REQUIRES_RECEIVER');
  ensureReliableReceiver(instance, baseInstallDirectReceiver);

  if (target === instance.localName() && instance.root && typeof instance.root[receiver] === 'function') {
    const accepted = instance.root[receiver](sender, payload) !== false;
    instance.stats.localDelivered += 1;
    return {
      delivered: accepted,
      transport: 'local',
      target,
      sender,
      receiver,
      reason: accepted ? 'LOCAL_RECEIVER_ACCEPTED' : 'LOCAL_RECEIVER_REJECTED'
    };
  }

  if (!instance.isOwned(target)) {
    instance.stats.rejectedNotOwned += 1;
    instance._event('ACCOUNT_TRANSPORT_REJECTED', 'warn', 'TARGET_NOT_TRUSTED_OWN_CHARACTER', { target, sender });
    throw new Error(`TARGET_NOT_TRUSTED_OWN_CHARACTER:${target}`);
  }
  if (!instance.fallbackEnabled) throw new Error(`ACCOUNT_TRANSPORT_DIRECT_UNAVAILABLE:${target}`);
  const sendCm = functionOf(instance, 'send_cm');
  if (typeof sendCm !== 'function') throw new Error('SEND_CM_UNAVAILABLE');

  const state = reliableState(instance);
  const id = messageId(instance, target, receiver, options && options.messageId);
  const inflightKey = `${target}:${id}`;
  const existing = state.inflight.get(inflightKey);
  if (existing) return existing;

  const ackTimeoutMs = boundedInteger(options && options.ackTimeoutMs, DEFAULT_ACK_TIMEOUT_MS, 25, 30000);
  const maxAttempts = boundedInteger(options && options.maxAttempts, DEFAULT_MAX_ATTEMPTS, 1, 5);
  const retryBackoffMs = boundedInteger(options && options.retryBackoffMs, DEFAULT_RETRY_BACKOFF_MS, 0, 10000);

  const operation = (async () => {
    const wait = pendingAck(instance, target, id, receiver);
    try {
      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        wait.pending.attempt = attempt;
        const envelope = {
          __aioProtocol: NAMED_RECEIVER_CM_PROTOCOL,
          receiver: RELIABLE_RECEIVER,
          payload: {
            kind: DELIVERY_KIND,
            messageId: id,
            receiver,
            payload: payload == null ? null : payload,
            requiresAck: true,
            attempt
          }
        };

        instance.stats.deliveryAttempted += 1;
        instance._event('ACCOUNT_TRANSPORT_DELIVERY_ATTEMPTED', 'info', 'SEND_CM_ACK_REQUIRED', {
          target,
          sender,
          receiver,
          messageId: id,
          attempt,
          maxAttempts,
          transport: 'send_cm'
        });

        try {
          await Promise.resolve(sendCm.call(instance.root, target, envelope));
          instance.stats.fallbackSent += 1;
        } catch (error) {
          if (isStorageQuotaError(error)) throw error;
          instance.stats.fallbackFailed += 1;
          instance._event('ACCOUNT_TRANSPORT_FALLBACK_FAILED', 'warn', 'SEND_CM_FAILED', {
            target,
            sender,
            receiver,
            messageId: id,
            attempt,
            message: boundedMessage(error)
          });
          if (attempt < maxAttempts) {
            instance.stats.deliveryRetries += 1;
            instance._event('ACCOUNT_TRANSPORT_RETRY', 'warn', 'SEND_CM_FAILED', {
              target,
              receiver,
              messageId: id,
              nextAttempt: attempt + 1,
              maxAttempts
            });
            const lateAck = await Promise.race([wait.promise, delay(retryBackoffMs).then(() => null)]);
            if (lateAck) return deliveryResult(instance, target, sender, receiver, id, attempt, lateAck);
            continue;
          }
          break;
        }

        const ack = await Promise.race([wait.promise, delay(ackTimeoutMs).then(() => null)]);
        if (ack) return deliveryResult(instance, target, sender, receiver, id, attempt, ack);

        instance.stats.deliveryTimeouts += 1;
        instance._event('ACCOUNT_TRANSPORT_DELIVERY_TIMEOUT', 'warn', 'REMOTE_ACK_TIMEOUT', {
          target,
          sender,
          receiver,
          messageId: id,
          attempt,
          ackTimeoutMs
        });

        if (attempt < maxAttempts) {
          instance.stats.deliveryRetries += 1;
          instance._event('ACCOUNT_TRANSPORT_RETRY', 'warn', 'REMOTE_ACK_TIMEOUT', {
            target,
            receiver,
            messageId: id,
            nextAttempt: attempt + 1,
            maxAttempts
          });
          const lateAck = await Promise.race([wait.promise, delay(retryBackoffMs).then(() => null)]);
          if (lateAck) return deliveryResult(instance, target, sender, receiver, id, attempt, lateAck);
        }
      }

      instance.stats.deliveryFailedSafe += 1;
      instance._event('ACCOUNT_TRANSPORT_DELIVERY_FAILED_SAFE', 'error', 'REMOTE_ACK_NOT_CONFIRMED', {
        target,
        sender,
        receiver,
        messageId: id,
        maxAttempts
      });
      return {
        delivered: false,
        transport: 'send_cm-ack',
        target,
        sender,
        receiver,
        messageId: id,
        attempts: maxAttempts,
        reason: 'REMOTE_ACK_NOT_CONFIRMED'
      };
    } finally {
      state.pending.delete(wait.key);
    }
  })();

  state.inflight.set(inflightKey, operation);
  try {
    return await operation;
  } finally {
    if (state.inflight.get(inflightKey) === operation) state.inflight.delete(inflightKey);
  }
}

function isReliableAlpha28Objective(payload, options) {
  return !!(
    options && options.receiver &&
    payload && typeof payload === 'object' &&
    payload.crossMapAuthorizedBy === 'alpha28-controlled-farmer-travel' &&
    cleanMessageId(payload.id)
  );
}

function installAlpha2057ReliableAccountTransport() {
  const proto = AccountCharacterTransport && AccountCharacterTransport.prototype;
  if (!proto || proto[PATCH]) return false;
  Object.defineProperty(proto, PATCH, { value: true, enumerable: false });

  const baseInstallRouter = proto._installCmRouter;
  const baseInstallDirectReceiver = proto.installDirectReceiver;
  const baseSend = proto.send;
  const baseStatus = proto.status;

  proto._installCmRouter = function installSelfHealingReliableRouter() {
    const displaced = this._cmRouterInstalled === true && this.root && this._cmRouter && this.root.on_cm !== this._cmRouter;
    if (displaced) {
      this._cmRouterInstalled = false;
      this._cmRouter = null;
      this._cmRouterPrevious = null;
      ensureStats(this);
      this.stats.cmRouterRepairs += 1;
      this._event('ACCOUNT_TRANSPORT_CM_ROUTER_REPAIRED', 'warn', 'ON_CM_HANDLER_DISPLACED', {
        localName: this.localName(),
        directReceiverCount: this._directReceiverNames && this._directReceiverNames.size || 0
      });
    }
    return baseInstallRouter.call(this);
  };

  proto.installDirectReceiver = function installReceiverWithReliableTunnel(receiverName, handler) {
    const installed = baseInstallDirectReceiver.call(this, receiverName, handler);
    if (cleanName(receiverName) !== RELIABLE_RECEIVER) ensureReliableReceiver(this, baseInstallDirectReceiver);
    return installed;
  };

  proto.send = function sendWithAckDelivery(targetName, payload, options = {}) {
    ensureReliableReceiver(this, baseInstallDirectReceiver);
    const target = cleanName(targetName);
    const reliableAlpha28 = isReliableAlpha28Objective(payload, options);
    if (options.requiresAck === true || reliableAlpha28) {
      const reliableOptions = reliableAlpha28 && !options.messageId
        ? { ...options, requiresAck: true, messageId: `alpha28:${String(payload.id)}:${target || 'unknown'}` }
        : { ...options, requiresAck: true };
      return sendReliable(this, targetName, payload, reliableOptions, baseInstallDirectReceiver);
    }
    return baseSend.call(this, targetName, payload, options);
  };

  proto.status = function statusWithReliableDelivery() {
    const base = baseStatus.call(this);
    const state = reliableState(this);
    pruneReceived(this);
    return {
      ...base,
      alpha20_57ReliableAccountTransport: true,
      reliableDelivery: {
        receiver: RELIABLE_RECEIVER,
        protocol: NAMED_RECEIVER_CM_PROTOCOL,
        transport: 'send_cm-ack',
        ackTimeoutMs: DEFAULT_ACK_TIMEOUT_MS,
        maxAttempts: DEFAULT_MAX_ATTEMPTS,
        retryBackoffMs: DEFAULT_RETRY_BACKOFF_MS,
        dedupeTtlMs: DEDUPE_TTL_MS,
        pendingAcks: state.pending.size,
        inflight: state.inflight.size,
        retainedDedupeEntries: state.received.size
      },
      stats: { ...this.stats }
    };
  };

  return true;
}

module.exports = {
  RELIABLE_RECEIVER,
  DELIVERY_KIND,
  ACK_KIND,
  DEFAULT_ACK_TIMEOUT_MS,
  DEFAULT_MAX_ATTEMPTS,
  DEFAULT_RETRY_BACKOFF_MS,
  DEDUPE_TTL_MS,
  installAlpha2057ReliableAccountTransport
};