import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("browser/v5-live-lab-bot-v2.js", "utf8");

function makeDocument() {
  const nodes = new Map();

  function element(tagName) {
    let html = "";
    const node = {
      tagName: String(tagName).toUpperCase(),
      id: "",
      className: "",
      textContent: "",
      value: "",
      style: {},
      parentNode: null,
      children: [],
      onclick: null,
      setAttribute() {},
      focus() {},
      select() {},
      setSelectionRange() {},
      appendChild(child) {
        child.parentNode = this;
        this.children.push(child);
        if (child.id) nodes.set(child.id, child);
        return child;
      },
      remove() {
        if (this.id) nodes.delete(this.id);
        if (this.parentNode) {
          this.parentNode.children = this.parentNode.children.filter(
            (child) => child !== this,
          );
        }
      },
      get innerHTML() {
        return html;
      },
      set innerHTML(value) {
        html = String(value);
        for (const match of html.matchAll(/id="([^"]+)"/g)) {
          const id = match[1];
          if (nodes.has(id)) continue;
          const child = element("div");
          child.id = id;
          child.parentNode = node;
          nodes.set(id, child);
          node.children.push(child);
        }
      },
    };
    return node;
  }

  const body = element("body");
  const head = element("head");

  return {
    body,
    head,
    documentElement: element("html"),
    createElement: element,
    getElementById(id) {
      return nodes.get(id) ?? null;
    },
    execCommand() {
      return true;
    },
  };
}

function makeEnvironment() {
  const document = makeDocument();
  let clipboardText = "";
  let nowMs = 1_000_000;

  class FakeDate extends Date {
    static now() {
      return nowMs;
    }
  }

  const root = {
    document,
    navigator: {
      clipboard: {
        async writeText(value) {
          clipboardText = String(value);
        },
      },
    },
    character: {
      name: "Ranger",
      ctype: "ranger",
      map: "main",
      x: 0,
      y: 0,
      real_x: 0,
      real_y: 0,
      hp: 1000,
      max_hp: 1000,
      mp: 500,
      max_mp: 500,
      range: 120,
      level: 80,
      xp: 1000,
      rip: false,
      dead: false,
      moving: false,
      target: null,
      q: {},
      s: {},
      items: [],
      slots: {},
      isize: 42,
    },
    entities: {},
    G: {
      monsters: {
        goo: {},
      },
    },
    S: {},
    server_region: "EU",
    server_identifier: "I",
    get_party: () => ({
      Ranger: {
        name: "Ranger",
      },
    }),
    get_player: () => null,
    can_attack: () => false,
    is_on_cooldown: () => false,
    attack: async () => ({ ok: true }),
    smart_move: async () => ({ ok: true }),
    loot: async () => ({ ok: true }),
    respawn: async () => ({ ok: true }),
    use_skill: async () => ({ ok: true }),
    send_cm: async () => ({ ok: true }),
    change_server: async () => ({ ok: true }),
    buy: async () => ({ ok: true }),
    sell: async () => ({ ok: true }),
    exchange: async () => ({ ok: true }),
    upgrade: async () => ({ ok: true }),
    compound: async () => ({ ok: true }),
    craft: async () => ({ ok: true }),
    send_item: async () => ({ ok: true }),
    send_gold: async () => ({ ok: true }),
    bank_store: async () => ({ ok: true }),
    bank_retrieve: async () => ({ ok: true }),
    bank_swap: async () => ({ ok: true }),
    join: async () => ({ ok: true }),
    localStorage: {
      getItem: () => null,
      setItem: () => {},
    },
  };

  root.globalThis = root;
  root.window = root;
  root.parent = root;

  let intervalId = 0;
  let timeoutId = 0;
  const intervals = new Map();
  const timeouts = new Map();

  const context = vm.createContext({
    ...root,
    globalThis: root,
    window: root,
    parent: root,
    setInterval(fn, ms) {
      const id = ++intervalId;
      intervals.set(id, { fn, ms });
      return id;
    },
    clearInterval(id) {
      intervals.delete(id);
    },
    setTimeout(fn, ms) {
      const id = ++timeoutId;
      timeouts.set(id, { fn, ms });
      return id;
    },
    clearTimeout(id) {
      timeouts.delete(id);
    },
    Date: FakeDate,
  });

  // Keep explicit root identity because the runtime installs onto globalThis.
  context.globalThis = context;
  context.window = context;
  context.parent = context;
  context.document = document;
  context.navigator = root.navigator;

  vm.runInContext(source, context, {
    filename: "v5-live-lab-bot-v2.js",
  });

  return {
    root: context,
    document,
    clipboard() {
      return clipboardText;
    },
    advance(ms) {
      nowMs += ms;
    },
  };
}

async function settle(rounds = 12) {
  for (let i = 0; i < rounds; i += 1) {
    await new Promise((resolve) => setImmediate(resolve));
  }
}

test("in-game GUI auto-mounts with start/stop/emergency/report controls", () => {
  const env = makeEnvironment();

  assert.ok(env.document.getElementById("v5-live-lab-gui"));
  assert.ok(env.document.getElementById("v5ll-start"));
  assert.ok(env.document.getElementById("v5ll-stop"));
  assert.ok(env.document.getElementById("v5ll-emergency"));
  assert.ok(env.document.getElementById("v5ll-report"));
  assert.ok(env.document.getElementById("v5ll-log-folder"));

  assert.equal(env.root.V5LiveLab.version, "0.6.2");
  assert.equal(
    env.root.V5LiveLab.buildId,
    "V5_LIVE_LAB_FULL_AUTONOMY_R10_1",
  );
});

test("GUI start and emergency buttons change real runtime authority", async () => {
  const env = makeEnvironment();

  env.document.getElementById("v5ll-start").onclick();
  await settle();
  env.root.V5LiveLab.refreshGui();

  let status = env.root.V5LiveLab.status();
  assert.equal(status.running, true);
  assert.equal(status.liveExecutionAllowed, true);
  assert.equal(status.gameplayAuthority, true);
  assert.equal(status.normalRuntimeAllowed, true);
  assert.equal(status.rawWriteAuthority, false);
  assert.equal(
    env.document.getElementById("v5ll-state").textContent,
    "LIVE",
  );

  env.document.getElementById("v5ll-emergency").onclick();
  await settle();
  env.root.V5LiveLab.refreshGui();

  status = env.root.V5LiveLab.status();
  assert.equal(status.running, false);
  assert.equal(status.emergencyStop, true);
  assert.equal(
    env.document.getElementById("v5ll-state").textContent,
    "NOTHALT",
  );
});

test("Fehler melden copies a complete V5 Live-Test Bug report", async () => {
  const env = makeEnvironment();

  env.document.getElementById("v5ll-start").onclick();
  await settle();

  env.document.getElementById("v5ll-report").onclick();
  await settle(30);

  const report = env.clipboard();

  assert.ok(report.length > 1000);
  assert.match(report, /# V5 Live-Test Bug/);
  assert.match(report, /## Build \/ Version/);
  assert.match(report, /V5_LIVE_LAB_FULL_AUTONOMY_R10_1/);
  assert.match(report, /chatgpt\/v5-live-lab-character-situation-files-r10/);
  assert.match(report, /## Game context/);
  assert.match(report, /## Current task \/ PR26 party selection/);
  assert.match(report, /## PR24\/25 group \+ evidence/);
  assert.match(report, /## PR27 progression/);
  assert.match(report, /## PR28 world autonomy/);
  assert.match(report, /## Relevant log excerpt/);
  assert.match(report, /## Full V5LiveLab Bug Bundle/);

  assert.match(
    env.document.getElementById("v5-live-lab-gui-notice").textContent,
    /Fehlerreport kopiert/,
  );
});
