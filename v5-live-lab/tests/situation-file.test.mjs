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

  return {
    body: element("body"),
    head: element("head"),
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
  let nowMs = 1_000_000;
  let latestFileText = "";
  let writeCount = 0;
  const intervals = new Map();
  let intervalSeq = 0;

  const directoryHandle = {
    name: "v5-Test",
    async queryPermission() {
      return "granted";
    },
    async requestPermission() {
      return "granted";
    },
    async getFileHandle(name, options) {
      assert.equal(name, "V5-Live-Situation.md");
      assert.equal(options.create, true);
      return {
        async createWritable() {
          return {
            async write(value) {
              latestFileText = String(value);
              writeCount += 1;
            },
            async close() {},
          };
        },
      };
    },
  };

  const document = makeDocument();
  const character = {
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
  };

  const context = {
    console,
    Promise,
    Object,
    Array,
    String,
    Number,
    Boolean,
    JSON,
    Math,
    Set,
    Map,
    Error,
    RegExp,
    Date: class extends Date {
      static now() {
        return nowMs;
      }
    },
    document,
    character,
    entities: {
      goo1: {
        id: "goo1",
        type: "monster",
        mtype: "goo",
        map: "main",
        x: 10,
        y: 0,
        real_x: 10,
        real_y: 0,
        dead: false,
        rip: false,
      },
    },
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
    can_attack: () => true,
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
    navigator: {
      clipboard: {
        async writeText() {},
      },
    },
    async showDirectoryPicker(options) {
      assert.equal(options.mode, "readwrite");
      return directoryHandle;
    },
    setInterval(fn, ms) {
      const id = ++intervalSeq;
      intervals.set(id, { fn, ms });
      return id;
    },
    clearInterval(id) {
      intervals.delete(id);
    },
    setTimeout() {
      return 1;
    },
    clearTimeout() {},
  };

  context.globalThis = context;
  context.window = context;
  context.parent = context;

  vm.createContext(context);
  vm.runInContext(source, context, {
    filename: "v5-live-lab-bot-v2.js",
  });

  return {
    root: context,
    document,
    intervals,
    directoryHandle,
    fileText() {
      return latestFileText;
    },
    writeCount() {
      return writeCount;
    },
    advance(ms) {
      nowMs += ms;
    },
  };
}

async function settle(rounds = 10) {
  for (let i = 0; i < rounds; i += 1) {
    await new Promise((resolve) => setImmediate(resolve));
  }
}

test("LOG-ORDNER connects selected Windows folder and writes current situation immediately", async () => {
  const env = makeEnvironment();

  const button = env.document.getElementById("v5ll-log-folder");
  assert.ok(button);

  button.onclick();
  await settle(20);

  const status = env.root.V5LiveLab.situationWriterStatus();
  assert.equal(status.configured, true);
  assert.equal(status.directoryName, "v5-Test");
  assert.equal(status.permission, "granted");
  assert.equal(status.fileName, "V5-Live-Situation.md");
  assert.equal(status.intervalMs, 30000);
  assert.equal(status.active, true);
  assert.match(
    status.requestedWindowsPath,
    /D:\\v5-Test\\V5-Live-Situation\.md/,
  );

  assert.ok(env.writeCount() >= 1);
  assert.match(env.fileText(), /# V5 Live Lab – Current Situation/);
  assert.match(env.fileText(), /## Capability Evidence Summary/);
});

test("capability ledger records repeated successful live attack calls and situation file contains them", async () => {
  const env = makeEnvironment();

  env.root.V5LiveLab.configure({
    farm: {
      enabled: true,
      monsters: ["goo"],
      loot: false,
      moveToTarget: false,
    },
    optimizer: {
      replanMs: 1,
    },
  });

  env.root.V5LiveLab.start({
    ack: "V5_LIVE_LAB_START",
  });
  await settle();

  for (let i = 0; i < 6; i += 1) {
    env.advance(500);
    await env.root.V5LiveLab.tickNow();
    await settle();
  }

  const ledger = env.root.V5LiveLab.capabilityLedger();
  const attack = ledger.find((row) => row.capability === "attack");

  assert.ok(attack);
  assert.ok(attack.confirmedSuccesses >= 5);
  assert.equal(attack.failures, 0);
  assert.equal(attack.unknownOutcomes, 0);
  assert.equal(
    attack.evidenceState,
    "REPEATED_LIVE_CALL_SUCCESS",
  );

  await env.root.V5LiveLab.connectSituationDirectory();
  const text = env.fileText();

  assert.match(text, /\| attack \| REPEATED_LIVE_CALL_SUCCESS/);
  assert.match(text, /### Repeated live call success/);
  assert.match(text, /call-level evidence/i);
});

test("30 second writer overwrites the same situation file with newer capability state", async () => {
  const env = makeEnvironment();

  await env.root.V5LiveLab.connectSituationDirectory();
  const writesAfterConnect = env.writeCount();

  const writerInterval = [...env.intervals.values()].find(
    (row) => row.ms === 30000,
  );
  assert.ok(writerInterval);

  env.advance(30000);
  await writerInterval.fn();
  await settle();

  assert.equal(env.writeCount(), writesAfterConnect + 1);
  assert.match(env.fileText(), /Diese Datei wird automatisch alle 30 Sekunden überschrieben/);
  assert.match(env.fileText(), /Build ID: V5_LIVE_LAB_PR28_R4_LIVE_EVIDENCE_1/);
});
