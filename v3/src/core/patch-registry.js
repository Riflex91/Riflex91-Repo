'use strict';

const PATCH_KINDS = Object.freeze({
  DECORATE: 'decorate',
  EXCLUSIVE: 'exclusive'
});

function nonEmpty(value, label) {
  const text = String(value || '').trim();
  if (!text) throw new Error(`patch registry ${label} required`);
  return text;
}

class PatchRegistry {
  constructor(options = {}) {
    this.log = options.log || null;
    this.targets = new WeakMap();
    this.registrations = [];
  }

  _slot(target, method, targetMethod) {
    if (!target || (typeof target !== 'object' && typeof target !== 'function')) {
      throw new Error('patch registry target required');
    }
    if (typeof target[method] !== 'function') {
      throw new Error(`patch registry target method unavailable: ${targetMethod}`);
    }
    let methods = this.targets.get(target);
    if (!methods) {
      methods = new Map();
      this.targets.set(target, methods);
    }
    let slot = methods.get(method);
    if (!slot) {
      slot = {
        target,
        method,
        targetMethod,
        original: target[method],
        exclusive: null,
        decorators: []
      };
      methods.set(method, slot);
    } else if (slot.targetMethod !== targetMethod) {
      throw new Error(`patch registry target identity mismatch: ${slot.targetMethod} != ${targetMethod}`);
    }
    return slot;
  }

  _emit(event, reason, data) {
    if (this.log && typeof this.log.emit === 'function') {
      this.log.emit({ component: 'patch-registry', event, severity: 'info', reason, data });
    }
  }

  register(input = {}) {
    const moduleId = nonEmpty(input.moduleId, 'moduleId');
    const method = nonEmpty(input.method, 'method');
    const targetMethod = nonEmpty(input.targetMethod, 'targetMethod');
    const kind = nonEmpty(input.kind, 'kind');
    const order = Number(input.order);
    if (!Object.values(PATCH_KINDS).includes(kind)) {
      throw new Error(`patch registry unsupported kind: ${kind}`);
    }
    if (!Number.isSafeInteger(order)) {
      throw new Error(`patch registry deterministic integer order required: ${moduleId} -> ${targetMethod}`);
    }
    if (typeof input.patch !== 'function') {
      throw new Error(`patch registry patch function required: ${moduleId} -> ${targetMethod}`);
    }

    const slot = this._slot(input.target, method, targetMethod);
    const existing = [...slot.decorators, slot.exclusive].filter(Boolean).find((row) => row.moduleId === moduleId);
    if (existing) {
      throw new Error(`patch registry duplicate module registration: ${moduleId} -> ${targetMethod}`);
    }

    const registration = { moduleId, targetMethod, kind, order, patch: input.patch };
    if (kind === PATCH_KINDS.EXCLUSIVE) {
      if (slot.exclusive) {
        throw new Error(`patch registry exclusive owner collision: ${slot.exclusive.moduleId} vs ${moduleId} -> ${targetMethod}`);
      }
      slot.exclusive = registration;
    } else {
      const sameOrder = slot.decorators.find((row) => row.order === order);
      if (sameOrder) {
        throw new Error(`patch registry ambiguous decorator order ${order}: ${sameOrder.moduleId} vs ${moduleId} -> ${targetMethod}`);
      }
      slot.decorators.push(registration);
    }

    this._apply(slot);
    const metadata = Object.freeze({ moduleId, targetMethod, kind, order });
    this.registrations.push(metadata);
    this._emit('PATCH_REGISTERED', 'DETERMINISTIC_PATCH_INSTALLED', metadata);
    return metadata;
  }

  _apply(slot) {
    let implementation = slot.exclusive ? slot.exclusive.patch : slot.original;
    const ordered = [...slot.decorators].sort((a, b) => a.order - b.order);
    for (let index = ordered.length - 1; index >= 0; index -= 1) {
      implementation = ordered[index].patch(implementation);
      if (typeof implementation !== 'function') {
        throw new Error(`patch registry decorator did not return a function: ${ordered[index].moduleId} -> ${slot.targetMethod}`);
      }
    }
    slot.target[slot.method] = implementation;
  }

  list() {
    return this.registrations.map((row) => ({ ...row }));
  }

  status() {
    const rows = this.list();
    return {
      schemaVersion: 1,
      registrations: rows,
      counts: {
        total: rows.length,
        exclusive: rows.filter((row) => row.kind === PATCH_KINDS.EXCLUSIVE).length,
        decorators: rows.filter((row) => row.kind === PATCH_KINDS.DECORATE).length
      }
    };
  }
}

function ensurePatchRegistry(runtime) {
  if (!runtime || typeof runtime !== 'object') throw new Error('runtime required');
  if (runtime.patchRegistry instanceof PatchRegistry) return runtime.patchRegistry;
  if (runtime.patchRegistry != null) throw new Error('runtime patchRegistry must be a PatchRegistry');
  runtime.patchRegistry = new PatchRegistry({ log: runtime.log });
  return runtime.patchRegistry;
}

module.exports = { PatchRegistry, ensurePatchRegistry, PATCH_KINDS };
