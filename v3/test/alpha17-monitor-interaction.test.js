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

function px(value, fallback = 0) {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}

function fakeDocument(width = 1000, height = 800) {
  const body = new FakeNode('body');
  const listeners = new Map();
  const doc = {
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
  return doc;
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

function installRect(ui, viewportWidth = 1000, viewportHeight = 800) {
  ui.container.getBoundingClientRect = () => {
    const style = ui.container.style;
    const width = px(style.width, 480);
    const height = px(style.height, 420);
    const left = style.left && style.left !== 'auto'
      ? px(style.left)
      : viewportWidth - px(style.right, 18) - width;
    const top = style.top && style.top !== 'auto'
      ? px(style.top)
      : viewportHeight - px(style.bottom, 18) - height;
    return { left, top, width, height, right: left + width, bottom: top + height };
  };
}

test('Debug monitor can be dragged by its header and remains clamped to the viewport', () => {
  const document = fakeDocument();
  const root = {
    document, innerWidth: 1000, innerHeight: 800,
    setInterval: () => 1, clearInterval() {}, setTimeout: (fn) => { fn(); return 1; }
  };
  const ui = new DebugMonitorUI({ root, monitor: monitor(), log: new EventLog(), refreshMs: 500 });
  assert.equal(ui.show().shown, true);
  installRect(ui);

  ui.header.onmousedown({ button: 0, clientX: 600, clientY: 400, preventDefault() {} });
  document.dispatch('mousemove', { clientX: 700, clientY: 450 });
  document.dispatch('mouseup', {});

  assert.equal(ui.container.style.right, 'auto');
  assert.equal(ui.container.style.bottom, 'auto');
  assert.equal(ui.container.style.left, '520px');
  assert.equal(ui.container.style.top, '412px');

  ui.header.onmousedown({ button: 0, clientX: 700, clientY: 450, preventDefault() {} });
  document.dispatch('mousemove', { clientX: -5000, clientY: -5000 });
  document.dispatch('mouseup', {});
  assert.equal(ui.container.style.left, '0px');
  assert.equal(ui.container.style.top, '0px');
  assert.equal(ui.status().draggable, true);
  assert.equal(ui.status().actionAuthority, false);
  ui.destroy();
});

test('Debug monitor resize handle changes size and enforces bounded minimums', () => {
  const document = fakeDocument();
  const root = {
    document, innerWidth: 1000, innerHeight: 800,
    setInterval: () => 1, clearInterval() {}, setTimeout: (fn) => { fn(); return 1; }
  };
  const ui = new DebugMonitorUI({ root, monitor: monitor(), log: new EventLog(), refreshMs: 500, minWidth: 340, minHeight: 240 });
  assert.equal(ui.show().shown, true);
  installRect(ui);

  ui.container.style.left = '300px';
  ui.container.style.top = '180px';
  ui.container.style.right = 'auto';
  ui.container.style.bottom = 'auto';
  ui.container.style.width = '480px';
  ui.container.style.height = '420px';

  ui.resizeHandle.onmousedown({
    button: 0, clientX: 780, clientY: 600,
    preventDefault() {}, stopPropagation() {}
  });
  document.dispatch('mousemove', { clientX: 880, clientY: 680 });
  document.dispatch('mouseup', {});
  assert.equal(ui.container.style.width, '580px');
  assert.equal(ui.container.style.height, '500px');

  ui.resizeHandle.onmousedown({
    button: 0, clientX: 880, clientY: 680,
    preventDefault() {}, stopPropagation() {}
  });
  document.dispatch('mousemove', { clientX: -5000, clientY: -5000 });
  document.dispatch('mouseup', {});
  assert.equal(ui.container.style.width, '340px');
  assert.equal(ui.container.style.height, '240px');
  assert.equal(ui.status().resizable, true);
  assert.equal(ui.status().directGameplayActionAccess, false);
  ui.destroy();
});
