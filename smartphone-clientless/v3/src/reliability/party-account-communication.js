'use strict';

const { AccountCharacterTransport } = require('../party/account-character-transport');

const CONTROL_RECEIVER = '__AIO_V3_PARTY_CONTROL_RECEIVE';
const TELEMETRY_RECEIVER = '__AIO_V3_PARTY_TELEMETRY_RECEIVE';

function bounded(value, max = 240) {
  return String(value == null ? '' : value).slice(0, max);
}

class PartyAccountCommunicationReliability {
  constructor(runtime, options = {}) {
    if (!runtime) throw new Error('runtime required');
    this.runtime = runtime;
    this.root = runtime.root || globalThis;
    this.now = runtime.now || (() => Date.now());
    this.log = runtime.log || null;
    this.transport = options.transport || new AccountCharacterTransport({
      root: this.root,
      now: this.now,
      log: this.log,
      fallbackEnabled: options.fallbackEnabled !== false
    });
    this.telemetryFailureStreak = 0;
    this.telemetryBackoffUntil = 0;
    this.telemetryBaseBackoffMs = Math.max(5000, Number(options.telemetryBaseBackoffMs) || 5000);
    this.telemetryMaxBackoffMs = Math.max(this.telemetryBaseBackoffMs, Number(options.telemetryMaxBackoffMs) || 120000);
    this.installed = false;
    this.originalControlSend = null;
    this.originalTelemetryTick = null;
    this.originalTelemetryReceive = null;
    this.originalTelemetryCleanReport = null;
    this.stats = {
      controlDirectReceiverCalls: 0,
      telemetryDirectReceiverCalls: 0,
      telemetryBackoffs: 0,
      telemetryRecovered: 0,
      telemetryUntrustedRejected: 0
    };
    this.install();
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    this.log.emit({ component: 'party-account-communication', event, severity, reason, data });
  }

  _localName() {
    return this.transport.localName();
  }

  _armTelemetryBackoff(error) {
    this.telemetryFailureStreak += 1;
    const delay = Math.min(
      this.telemetryMaxBackoffMs,
      this.telemetryBaseBackoffMs * Math.pow(2, Math.max(0, this.telemetryFailureStreak - 1))
    );
    this.telemetryBackoffUntil = this.now() + delay;
    this.stats.telemetryBackoffs += 1;
    this._event('PARTY_TELEMETRY_BACKOFF_ARMED', 'warn', 'TRANSPORT_FAILURE', {
      failureStreak: this.telemetryFailureStreak,
      delayMs: delay,
      message: bounded(error && error.message || error)
    });
  }

  _clearTelemetryBackoff(transport) {
    if (this.telemetryFailureStreak > 0) this.stats.telemetryRecovered += 1;
    this.telemetryFailureStreak = 0;
    this.telemetryBackoffUntil = 0;
    this._event('PARTY_TELEMETRY_DELIVERED', 'info', null, { transport });
  }

  _installControlTransport() {
    const lease = this.runtime.partyControlLease;
    if (!lease) return false;
    this.transport.installDirectReceiver(CONTROL_RECEIVER, (sender, payload) => {
      if (!lease.installed || typeof lease.receive !== 'function') return false;
      this.stats.controlDirectReceiverCalls += 1;
      return lease.receive(sender, payload);
    });
    if (!this.originalControlSend) this.originalControlSend = typeof lease._send === 'function' ? lease._send.bind(lease) : null;
    lease._send = async (target, payload) => this.transport.send(target, payload, {
      receiver: CONTROL_RECEIVER,
      sender: this._localName()
    });
    return true;
  }

  _installTelemetryTrustBoundary(bridge) {
    if (bridge.__aioOwnedTelemetryTrustInstalled) return false;
    bridge.__aioOwnedTelemetryTrustInstalled = true;
    this.originalTelemetryCleanReport = typeof bridge._cleanReport === 'function' ? bridge._cleanReport.bind(bridge) : null;
    this.originalTelemetryReceive = typeof bridge.receive === 'function' ? bridge.receive.bind(bridge) : null;
    if (!this.originalTelemetryCleanReport || !this.originalTelemetryReceive) return false;

    // Keep _cleanReport as the production sanitizer/freshness contract used by
    // existing diagnostics. Trust is enforced at the actual receive boundary,
    // where an untrusted payload could mutate the report store.
    bridge._cleanReport = (report, sender) => {
      const trusted = bridge.trustedNames;
      bridge.trustedNames = new Set();
      try {
        return this.originalTelemetryCleanReport(report, sender);
      } finally {
        bridge.trustedNames = trusted;
      }
    };

    bridge.receive = (sender, data) => {
      const name = String(sender || (data && data.name) || '');
      if (!name || (bridge.trustedNames.size && !bridge.trustedNames.has(name))) {
        bridge.stats.rejected += 1;
        this.stats.telemetryUntrustedRejected += 1;
        return false;
      }
      return this.originalTelemetryReceive(sender, data);
    };
    return true;
  }

  _installTelemetryTransport() {
    const bridge = this.runtime.partyTelemetry;
    if (!bridge) return false;
    this._installTelemetryTrustBoundary(bridge);
    this.transport.installDirectReceiver(TELEMETRY_RECEIVER, (sender, payload) => {
      if (typeof bridge.receive !== 'function') return false;
      this.stats.telemetryDirectReceiverCalls += 1;
      return bridge.receive(sender, payload);
    });
    if (!this.originalTelemetryTick) this.originalTelemetryTick = typeof bridge.tick === 'function' ? bridge.tick.bind(bridge) : null;

    bridge.tick = (runtime) => {
      if (typeof bridge.prune === 'function') bridge.prune();
      const c = this.root && (this.root.character || (this.root.parent && this.root.parent.character));
      const now = this.now();
      if (!c || !bridge.merchantName || c.name === bridge.merchantName) return false;
      if (now < this.telemetryBackoffUntil) return false;
      if (now - bridge.lastSentAt < bridge.sendIntervalMs) return false;
      const report = bridge.buildLocalReport(runtime);
      if (!report) return false;

      bridge.lastSentAt = now;
      bridge.stats.sent += 1;
      Promise.resolve(this.transport.send(bridge.merchantName, report, {
        receiver: TELEMETRY_RECEIVER,
        sender: c.name
      })).then((result) => {
        this._clearTelemetryBackoff(result && result.transport || null);
      }).catch((error) => {
        bridge.stats.sendFailures += 1;
        if (typeof bridge._event === 'function') {
          bridge._event('PARTY_TELEMETRY_SEND_FAILED', {
            merchant: bridge.merchantName,
            message: bounded(error && error.message || error)
          }, 'warn', 'ACCOUNT_TRANSPORT_FAILED');
        }
        this._armTelemetryBackoff(error);
      });
      return true;
    };
    return true;
  }

  install() {
    if (this.installed) return false;
    this._installControlTransport();
    this._installTelemetryTransport();
    this.installed = true;
    this._event('PARTY_ACCOUNT_COMMUNICATION_INSTALLED', 'info', null, {
      preferredTransport: 'command_character',
      fallbackTransport: 'send_cm'
    });
    return true;
  }

  status() {
    return {
      schemaVersion: 1,
      mode: 'party-account-communication-reliability-v1',
      installed: this.installed,
      controlReceiver: CONTROL_RECEIVER,
      telemetryReceiver: TELEMETRY_RECEIVER,
      telemetryFailureStreak: this.telemetryFailureStreak,
      telemetryBackoffUntil: this.telemetryBackoffUntil || null,
      telemetryBackoffRemainingMs: Math.max(0, this.telemetryBackoffUntil - this.now()),
      stats: { ...this.stats },
      transport: this.transport.status()
    };
  }
}

function installPartyAccountCommunication(runtime, options = {}) {
  return new PartyAccountCommunicationReliability(runtime, options);
}

module.exports = {
  PartyAccountCommunicationReliability,
  installPartyAccountCommunication,
  CONTROL_RECEIVER,
  TELEMETRY_RECEIVER
};
