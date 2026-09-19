'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { DebugMonitorUI, EventLog } = require('../src');

class FakeNode {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.parentNode = null;
    this.style = {};
    this.attributes = {};
    this.textContent = '';
    this.value = '';
    this.firstChild = null;
    this.onclick = null;
    this.onmousedown = null;
    this.disabled = false;
  }
  appendChild(node) {
    node.parentNode = this;
    this.children.push(node);
    this.firstChild = this.children[0] || null;
    return node;
  }
  removeChild(node) {
    this.children = this.children.filter((x) => x !== node);
    node.parentNode = null;
    this.firstChild = this.children[0] || null;
    return node;
  }
  setAttribute(key, value) { this.attributes[key] = value; }
  focus() {}
  select() {}
  setSelectionRange() {}
}

function fakeDocument(width = 1000, height = 800) {
  const body = new FakeNode('body');
  const listeners = new Map();
  return {
    body,
    documentElement: Object.assign(body, { clientWidth: width, clientHeight: height }),
    createElement(tag) { return new FakeNode(tag); },
    getElementById(id) {
      const walk = (node) => {
        if (node.id === id) return node;
        for (const child of node.children || []) {
          const found = walk(child);
          if (found) return found;
        }
        return null;
      };
      return walk(body);
    },
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
    },
    removeEventListener(type, fn) {
      if (listeners.has(type)) listeners.get(type).delete(fn);
    },
    dispatch(type, event) {
      for (const fn of Array.from(listeners.get(type) || [])) fn(event);
    },
    execCommand() { return false; }
  };
}

function monitor() {
  return {
    summary() {
      return {
        version: '3.0.0-alpha.17.0', mode: 'shadow', character: {}, supervisor: {}, economy: {},
        travel: {}, inventory: {}, recentSignals: {}
      };
    },
    async copyToClipboard() { return { copied: true, method: 'test', bytes: 2 }; },
    exportSession() { return '{}'; }
  };
}

test('minimize collapses monitor to title bar only and restores the prior size', () => {
  const document = fakeDocument();
  const root = {
    document, innerWidth: 1000, innerHeight: 800,
    setInterval: () => 1, clearInterval() {}, setTimeout: (fn) => { fn(); return 1; }
  };
  const ui = new DebugMonitorUI({ root, monitor: monitor(), log: new EventLog(), refreshMs: 500, minWidth: 340, minHeight: 240 });
  assert.equal(ui.show().shown, true);

  ui.container.style.left = '200px';
  ui.container.style.top = '120px';
  ui.container.style.right = 'auto';
  ui.container.style.bottom = 'auto';
  ui.container.style.width = '520px';
  ui.container.style.height = '420px';
  ui.container.getBoundingClientRect = () => ({ left: 200, top: 120, width: 520, height: 420, right: 720, bottom: 540 });

  const buttons = ui.header.children[1];
  const minimize = buttons.children.find((button) => button && button.textContent === '–');
  assert.ok(minimize);
  assert.equal(minimize.textContent, '–');

  minimize.onclick();

  assert.equal(ui.status().minimized, true);
  assert.equal(ui.status().collapsedToTitleBar, true);
  assert.equal(ui.container.style.height, 'auto');
  assert.equal(ui.container.style.minHeight, '0px');
  assert.equal(ui.container.style.maxHeight, 'none');
  assert.equal(ui.container.style.overflow, 'hidden');
  assert.equal(ui.header.style.marginBottom, '0px');
  assert.equal(ui.body.style.display, 'none');
  assert.equal(ui.resizeHandle.style.display, 'none');
  assert.equal(minimize.textContent, '+');

  minimize.onclick();

  assert.equal(ui.status().minimized, false);
  assert.equal(ui.container.style.width, '520px');
  assert.equal(ui.container.style.height, '420px');
  assert.equal(ui.container.style.minHeight, '240px');
  assert.equal(ui.container.style.maxHeight, 'calc(100vh - 36px)');
  assert.equal(ui.container.style.overflow, 'auto');
  assert.equal(ui.header.style.marginBottom, '9px');
  assert.equal(ui.body.style.display, 'block');
  assert.equal(ui.resizeHandle.style.display, 'block');
  assert.equal(minimize.textContent, '–');
  ui.destroy();
});