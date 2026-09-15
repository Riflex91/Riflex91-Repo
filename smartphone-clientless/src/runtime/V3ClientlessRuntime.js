'use strict';

const { Alpha20_5FarmReadinessRuntime } = require('../../v3/src/autonomy/alpha20-5-farm-readiness-runtime');
const { ClientlessGameAdapter } = require('./ClientlessGameAdapter');

function memoryStorage() {
  const rows = new Map();
  return { get: (key) => rows.has(key) ? rows.get(key) : null, set: (key, value) => { rows.set(key, value); return true; } };
}

class V3ClientlessRuntime {
  constructor(options = {}) {
    if (!options.transport) throw new Error('CLIENTLESS_TRANSPORT_REQUIRED');
    this.transport = options.transport;
    this.role = options.role === 'merchant' ? 'merchant' : 'farmer';
    this.adapter = new ClientlessGameAdapter({ transport: this.transport, mode: options.mode || 'active', now: options.now });
    this.root = { setTimeout, clearTimeout, setInterval, clearInterval };
    this.runtime = new Alpha20_5FarmReadinessRuntime({
      ...options,
      root: this.root,
      adapter: this.adapter,
      storage: options.storage || memoryStorage(),
      visibleStatus: false,
      mode: options.mode || 'active',
      farmerEnabled: this.role !== 'merchant'
    });
  }

  start() { return this.runtime.start(); }
  stop() { return this.runtime.stop(); }
  status() { return { clientless: true, role: this.role, transport: this.transport.status(), v3: this.runtime.status() }; }
  exportDiagnostics() { return this.runtime.exportDiagnostics(); }
}

module.exports = { V3ClientlessRuntime, memoryStorage };
