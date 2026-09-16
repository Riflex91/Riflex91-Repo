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

test('migrated representative modules cannot return to direct monkey-patching', () => {
  const sourceRoot = path.resolve(__dirname, '..', 'src');
  const protectedFiles = [
    {
      path: 'reliability/farmer-local-plan-priority.js',
      pattern: /\bfarmer\.step\s*=/
    },
    {
      path: 'reliability/live-navigation-hotfix.js',
      pattern: /\._visibleMonsters\s*=/
    }
  ];
  const findings = protectedFiles.filter((entry) => {
    const source = fs.readFileSync(path.join(sourceRoot, entry.path), 'utf8');
    return entry.pattern.test(source);
  }).map((entry) => entry.path);
  assert.deepEqual(findings, []);
});
