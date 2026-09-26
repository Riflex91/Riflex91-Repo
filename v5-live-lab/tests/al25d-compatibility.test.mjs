import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("browser/v5-live-lab-bot-v2.js", "utf8");

function makeDocument(frame = null) {
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
      children: [],
      parentNode: null,
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
    querySelector(selector) {
      return selector === 'iframe[data-al25d-legacy-runtime="true"]'
        ? frame
        : null;
    },
    execCommand() {
      return true;
    },
  };
}

function makeLegacyGame(name = "Ranger") {
  const calls = [];
  const game = {
    character: {
      name,
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
    current_map: "main",
    server_region: "EU",
    server_identifier: "I",
    get_party: () => ({
      [name]: { name },
    }),
    get_player: () => null,
    can_attack: () => true,
    is_on_cooldown: () => false,
    attack: async (target) => {
      calls.push(["attack", target?.id]);
      return { ok: true };
    },
    smart_move: async (destination) => {
      calls.push(["smart_move", destination]);
      return { ok: true };
    },
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
    map_click() {},
  };

  return { game, calls };
}

function install(root) {
  let nowMs = 1_000_000;
  class FakeDate extends Date {
    static now() {
      return nowMs;
    }
  }

  const context = vm.createContext({
    ...root,
    globalThis: root,
    window: root,
    setInterval() {
      return 1;
    },
    clearInterval() {},
    setTimeout() {
      return 1;
    },
    clearTimeout() {},
    Date: FakeDate,
  });

  context.globalThis = context;
  context.window = context;

  if (!context.parent) context.parent = context;

  vm.runInContext(source, context, {
    filename: "v5-live-lab-bot-v2.js",
  });

  return {
    root: context,
    advance(ms) {
      nowMs += ms;
    },
  };
}

async function settle(rounds = 16) {
  for (let i = 0; i < rounds; i += 1) {
    await new Promise((resolve) => setImmediate(resolve));
  }
}

test("direct Adventure Land runtime remains supported", () => {
  const { game } = makeLegacyGame("DirectRanger");
  game.document = makeDocument();
  game.localStorage = {
    getItem: () => null,
    setItem() {},
  };
  game.navigator = {
    clipboard: {
      async writeText() {},
    },
  };
  game.parent = game;

  const env = install(game);
  const status = env.root.V5LiveLab.status();

  assert.equal(env.root.V5LiveLab.version, "0.6.2");
  assert.equal(env.root.V5LiveLab.buildId, "V5_LIVE_LAB_FULL_AUTONOMY_R10_1");
  assert.equal(status.runtimeEnvironment.mode, "ADVENTURE_LAND_DIRECT");
  assert.equal(status.character, "DirectRanger");
  assert.equal(env.root.V5LiveLab.inspectPorts().attack, true);
});

test("AL25D host routes gameplay to same-origin legacy iframe while GUI stays visible", async () => {
  const legacy = makeLegacyGame("HostRanger");
  const frame = {
    contentWindow: legacy.game,
  };
  const host = {
    AL25D: {
      legacyRuntimeReady: () => true,
    },
    location: {
      hostname: "127.0.0.1",
    },
    localStorage: {
      getItem: () => null,
      setItem() {},
    },
    navigator: {
      clipboard: {
        async writeText() {},
      },
    },
  };
  host.document = makeDocument(frame);
  host.parent = host;
  legacy.game.parent = host;
  legacy.game.document = makeDocument();

  const env = install(host);

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
  await env.root.V5LiveLab.tickNow();
  await settle();

  const status = env.root.V5LiveLab.status();
  assert.equal(
    status.runtimeEnvironment.mode,
    "AL25D_HOST_TO_LEGACY_IFRAME",
  );
  assert.equal(status.runtimeEnvironment.al25dDetected, true);
  assert.equal(status.runtimeEnvironment.al25dLegacyRuntimeReady, true);
  assert.equal(status.character, "HostRanger");
  assert.equal(status.server.region, "EU");
  assert.equal(status.server.identifier, "I");
  assert.ok(legacy.calls.some((row) => row[0] === "attack" && row[1] === "goo1"));
  assert.equal(typeof legacy.game.on_cm, "function");
  assert.equal(typeof env.root.on_cm, "undefined");
  assert.ok(host.document.getElementById("v5-live-lab-gui"));
  assert.equal(
    legacy.game.document.getElementById("v5-live-lab-gui"),
    null,
  );
});

test("original CODE runner nested inside AL25D resolves legacy gameplay and visible host surfaces", async () => {
  const legacy = makeLegacyGame("NestedRanger");
  const frame = {
    contentWindow: legacy.game,
  };
  const host = {
    AL25D: {
      legacyRuntimeReady: () => true,
    },
    location: {
      hostname: "127.0.0.1",
    },
    localStorage: {
      getItem: () => null,
      setItem() {},
    },
    navigator: {
      clipboard: {
        async writeText() {},
      },
    },
  };
  host.document = makeDocument(frame);
  host.parent = host;

  legacy.game.document = makeDocument();
  legacy.game.parent = host;

  const runner = {
    document: makeDocument(),
    parent: legacy.game,
  };

  const env = install(runner);

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
  await env.root.V5LiveLab.tickNow();
  await settle();

  const status = env.root.V5LiveLab.status();
  assert.equal(
    status.runtimeEnvironment.mode,
    "AL25D_CODE_RUNNER_TO_LEGACY",
  );
  assert.equal(status.character, "NestedRanger");
  assert.ok(legacy.calls.some((row) => row[0] === "attack" && row[1] === "goo1"));
  assert.equal(typeof legacy.game.on_cm, "function");
  assert.equal(typeof env.root.on_cm, "undefined");
  assert.ok(host.document.getElementById("v5-live-lab-gui"));
  assert.equal(
    legacy.game.document.getElementById("v5-live-lab-gui"),
    null,
  );
  assert.equal(status.persistenceAvailable, true);
});

test("AL25D advertised upstream mismatch fails closed before runtime start", () => {
  const legacy = makeLegacyGame("PinnedRanger");
  legacy.game.__AL25D_UPSTREAM_COMMIT__ = "different-upstream";

  const frame = {
    contentWindow: legacy.game,
  };
  const host = {
    AL25D: {
      legacyRuntimeReady: () => true,
    },
    location: {
      hostname: "127.0.0.1",
    },
    localStorage: {
      getItem: () => null,
      setItem() {},
    },
    navigator: {
      clipboard: {
        async writeText() {},
      },
    },
  };
  host.document = makeDocument(frame);
  host.parent = host;
  legacy.game.parent = host;
  legacy.game.document = makeDocument();

  const env = install(host);

  assert.throws(
    () => env.root.V5LiveLab.start({ ack: "V5_LIVE_LAB_START" }),
    /AL25D_UPSTREAM_COMMIT_MISMATCH/,
  );
  assert.equal(env.root.V5LiveLab.status().running, false);
});

test("AL25D legacy iframe reload rebinds CM handler and subsequent gameplay to new window", async () => {
  const first = makeLegacyGame("ReloadRanger");
  const second = makeLegacyGame("ReloadRanger");
  const frame = {
    contentWindow: first.game,
  };
  const host = {
    AL25D: {
      legacyRuntimeReady: () => true,
    },
    location: {
      hostname: "127.0.0.1",
    },
    localStorage: {
      getItem: () => null,
      setItem() {},
    },
    navigator: {
      clipboard: {
        async writeText() {},
      },
    },
  };
  host.document = makeDocument(frame);
  host.parent = host;
  first.game.parent = host;
  first.game.document = makeDocument();
  second.game.parent = host;
  second.game.document = makeDocument();

  const env = install(host);
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

  assert.equal(typeof first.game.on_cm, "function");

  frame.contentWindow = second.game;
  env.advance(1000);
  await env.root.V5LiveLab.tickNow();
  await settle();

  assert.equal(typeof first.game.on_cm, "undefined");
  assert.equal(typeof second.game.on_cm, "function");
  assert.ok(second.calls.some((row) => row[0] === "attack"));
});


test("local AL25D full autonomy auto-starts and farms without manual configure", async () => {
  const legacy = makeLegacyGame("AutoWarrior");
  legacy.game.character.ctype = "warrior";
  legacy.game.character.level = 1;
  legacy.game.character.hp = 500;
  legacy.game.character.max_hp = 500;
  legacy.game.G.monsters.goo = { hp: 80, attack: 10, level: 1 };
  legacy.game.attack = async (target) => {
    legacy.calls.push(["attack", target?.id]);
    return { ok: true };
  };

  const frame = { contentWindow: legacy.game };
  const host = {
    AL25D: { legacyRuntimeReady: () => true },
    location: { hostname: "127.0.0.1" },
    localStorage: { getItem: () => null, setItem() {} },
    navigator: { clipboard: { async writeText() {} } },
  };
  host.document = makeDocument(frame);
  host.parent = host;
  legacy.game.parent = host;
  legacy.game.document = makeDocument();

  const env = install(legacy.game);
  await settle();
  env.advance(1500);
  await env.root.V5LiveLab.tickNow();
  await settle();

  const status = env.root.V5LiveLab.status();
  assert.equal(status.running, true);
  assert.equal(status.fullDecisionAuthority, true);
  assert.equal(status.autonomy.enabled, true);
  assert.equal(status.autonomy.localAutoStart, true);
  assert.equal(status.optimizer.status, "LIVE_SELECTION_READY");
  assert.equal(status.currentTask.type, "FARM");
  assert.equal(status.currentTargetId, "goo1");
  assert.ok(legacy.calls.some((row) => row[0] === "attack" && row[1] === "goo1"));
});

test("full autonomy creates a farm-search task and roams when no monster is visible", async () => {
  const legacy = makeLegacyGame("AutoRogue");
  legacy.game.character.ctype = "rogue";
  legacy.game.character.level = 1;
  legacy.game.entities = {};
  legacy.game.G.monsters.goo = { hp: 80, attack: 10, level: 1 };
  legacy.game.G.maps = { main: { monsters: [{ type: "goo" }] } };
  legacy.game.smart_move = async (destination) => {
    legacy.calls.push(["smart_move", destination]);
    return { ok: true };
  };

  const frame = { contentWindow: legacy.game };
  const host = {
    AL25D: { legacyRuntimeReady: () => true },
    location: { hostname: "127.0.0.1" },
    localStorage: { getItem: () => null, setItem() {} },
    navigator: { clipboard: { async writeText() {} } },
  };
  host.document = makeDocument(frame);
  host.parent = host;
  legacy.game.parent = host;
  legacy.game.document = makeDocument();

  const env = install(legacy.game);
  await settle();
  env.advance(1500);
  await env.root.V5LiveLab.tickNow();
  await settle();

  const status = env.root.V5LiveLab.status();
  assert.equal(status.running, true);
  assert.equal(status.currentTask.type, "FARM");
  assert.match(status.currentTask.id, /^farm:search:goo/);
  assert.ok(legacy.calls.some((row) => row[0] === "smart_move" && row[1] === "goo"));
});

test("merchant full autonomy is not blocked by SINGLE_TARGET and services potion stock", async () => {
  const legacy = makeLegacyGame("AutoMerchant");
  legacy.game.character.ctype = "merchant";
  legacy.game.character.level = 1;
  legacy.game.entities = {};
  legacy.game.smart_move = async (destination) => {
    legacy.calls.push(["smart_move", destination]);
    return { ok: true };
  };
  legacy.game.buy = async (item, quantity) => {
    legacy.calls.push(["buy", item, quantity]);
    return { ok: true };
  };

  const frame = { contentWindow: legacy.game };
  const host = {
    AL25D: { legacyRuntimeReady: () => true },
    location: { hostname: "127.0.0.1" },
    localStorage: { getItem: () => null, setItem() {} },
    navigator: { clipboard: { async writeText() {} } },
  };
  host.document = makeDocument(frame);
  host.parent = host;
  legacy.game.parent = host;
  legacy.game.document = makeDocument();

  const env = install(legacy.game);
  await settle();
  env.advance(2000);
  await env.root.V5LiveLab.tickNow();
  await settle();

  const status = env.root.V5LiveLab.status();
  assert.equal(status.running, true);
  assert.equal(status.group.status, "LIVE_GROUP_READY");
  assert.deepEqual([...status.group.requiredCapabilities], []);
  assert.equal(status.group.blocker.length, 0);
  assert.ok(
    legacy.calls.some((row) =>
      (row[0] === "smart_move" && row[1] === "potions")
      || (row[0] === "buy" && row[1] === "hpot0")
    ),
  );
});
