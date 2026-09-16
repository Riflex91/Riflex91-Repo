'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PatchRegistry } = require('../src/core/patch-registry');

test('exclusive patch ownership is visible and a second owner fails loudly', () => {
  const target = { read() { return 'base'; } };
  const registry = new PatchRegistry();
  registry.register({
    moduleId: 'navigation.owner',
    target,
    method: 'read',
    targetMethod: 'localFarming._visibleMonsters',
    kind: 'exclusive',
    order: 0,
    patch() { return 'owned'; }
  });

  assert.equal(target.read(), 'owned');
  assert.deepEqual(registry.status().counts, { total: 1, exclusive: 1, decorators: 0 });
  assert.throws(() => registry.register({
    moduleId: 'navigation.competing-owner',
    target,
    method: 'read',
    targetMethod: 'localFarming._visibleMonsters',
    kind: 'exclusive',
    order: 0,
    patch() { return 'collision'; }
  }), /exclusive owner collision/);
  assert.equal(target.read(), 'owned');
});

test('decorators execute in ascending declared order and preserve the original receiver', () => {
  const calls = [];
  const target = {
    value: 7,
    run() { calls.push('base'); return this.value; }
  };
  const registry = new PatchRegistry();
  registry.register({
    moduleId: 'outer',
    target,
    method: 'run',
    targetMethod: 'farmer.step',
    kind: 'decorate',
    order: 10,
    patch(next) {
      return function outer() {
        calls.push('outer:before');
        const result = next.call(this);
        calls.push('outer:after');
        return result;
      };
    }
  });
  registry.register({
    moduleId: 'inner',
    target,
    method: 'run',
    targetMethod: 'farmer.step',
    kind: 'decorate',
    order: 20,
    patch(next) {
      return function inner() {
        calls.push('inner:before');
        const result = next.call(this);
        calls.push('inner:after');
        return result;
      };
    }
  });

  assert.equal(target.run(), 7);
  assert.deepEqual(calls, ['outer:before', 'inner:before', 'base', 'inner:after', 'outer:after']);
  assert.deepEqual(registry.list().map((row) => [row.moduleId, row.targetMethod, row.kind, row.order]), [
    ['outer', 'farmer.step', 'decorate', 10],
    ['inner', 'farmer.step', 'decorate', 20]
  ]);
});

test('ambiguous decorator order and incomplete metadata are rejected', () => {
  const target = { run() { return true; } };
  const registry = new PatchRegistry();
  registry.register({
    moduleId: 'first',
    target,
    method: 'run',
    targetMethod: 'farmer.step',
    kind: 'decorate',
    order: 10,
    patch: (next) => next
  });
  assert.throws(() => registry.register({
    moduleId: 'second',
    target,
    method: 'run',
    targetMethod: 'farmer.step',
    kind: 'decorate',
    order: 10,
    patch: (next) => next
  }), /ambiguous decorator order/);
  assert.throws(() => registry.register({
    moduleId: 'missing-order',
    target,
    method: 'run',
    targetMethod: 'farmer.step',
    kind: 'decorate',
    patch: (next) => next
  }), /deterministic integer order required/);
});

test('protected representative methods are not monkey-patched outside the registry', () => {
  const sourceRoot = path.resolve(__dirname, '..', 'src');
  const findings = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (entry.isFile() && entry.name.endsWith('.js')) {
        const source = fs.readFileSync(full, 'utf8');
        if (/\bfarmer\.step\s*=/.test(source) || /\._visibleMonsters\s*=/.test(source)) {
          findings.push(path.relative(sourceRoot, full));
        }
      }
    }
  };
  visit(sourceRoot);
  assert.deepEqual(findings, []);
});
