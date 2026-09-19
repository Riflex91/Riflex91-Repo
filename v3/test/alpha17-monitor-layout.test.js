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

function fakeDocument() {
  const body = new FakeNode('body');
  return {
    body,
    documentElement: body,
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
    execCommand() { return false; }
  };
}

function monitor() {
  return {
    summary() {
      return {
        version: '3.0.0-alpha.20.132', running: true, mode: 'active',
        character: { name: 'R1', level: 80, hp: 900, max_hp: 1000, mp: 450, max_mp: 500, isize: 42, inventory: [{ name: 'hpot0' }, null] },
        scheduler: { active: [{ type: 'FARM', owner: 'R1' }], queued: [] },
        farmer: { enabled: true, state: 'ENGAGE', targetType: 'goo' },
        supervisor: {}, economy: {}, travel: {}, inventory: {}, recentSignals: {}
      };
    },
    async copyToClipboard() { return { copied: true, method: 'test', bytes: 2 }; },
    exportSession() { return '{}'; }
  };
}

test('Debug monitor prefers the parent Adventure Land document over the local code frame', () => {
  const localDocument = fakeDocument();
  const parentDocument = fakeDocument();
  const root = {
    document: localDocument,
    parent: { document: parentDocument },
    setInterval: () => 1,
    clearInterval() {},
    setTimeout: (fn) => { fn(); return 1; }
  };

  const ui = new DebugMonitorUI({ root, monitor: monitor(), log: new EventLog(), refreshMs: 500 });
  const shown = ui.show();

  assert.equal(shown.shown, true);
  assert.equal(shown.documentScope, 'parent');
  assert.equal(localDocument.body.children.length, 0);
  assert.equal(parentDocument.body.children.length, 1);
  assert.equal(ui.status().documentScope, 'parent');
  ui.destroy();
});

test('Debug monitor uses a larger responsive bottom-right layout', () => {
  const document = fakeDocument();
  const root = {
    document,
    setInterval: () => 1,
    clearInterval() {},
    setTimeout: (fn) => { fn(); return 1; }
  };

  const ui = new DebugMonitorUI({ root, monitor: monitor(), log: new EventLog(), refreshMs: 500 });
  assert.equal(ui.show().shown, true);

  assert.equal(ui.container.style.right, '18px');
  assert.equal(ui.container.style.bottom, '18px');
  assert.equal(ui.container.style.top, 'auto');
  assert.equal(ui.container.style.width, '480px');
  assert.equal(ui.container.style.maxWidth, 'calc(100vw - 36px)');
  assert.equal(ui.container.style.maxHeight, 'calc(100vh - 36px)');
  assert.equal(ui.titleNode.textContent, 'AiO v3 - 3.0-132');
  assert.equal(ui.logBox, null);
  assert.equal(ui.body.children.length, 6);
  assert.deepEqual(ui.body.children.map((row) => row.children[0] && row.children[0].textContent), ['Name', 'Level', 'HP', 'MP', 'Inventar', 'Aufgabe']);
  assert.equal(ui.body.children[4].children[1].textContent, '1 / 42');
  assert.equal(ui.body.children[5].children[1].textContent, 'Farmen');
  assert.equal(ui.copyButton.textContent, 'Log kopieren');
  assert.equal(ui.status().actionAuthority, false);
  ui.destroy();
});
