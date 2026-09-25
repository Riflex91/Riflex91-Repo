import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("browser/v5-live-lab-bot-v1.js", "utf8");

function sandbox(overrides = {}) {
  const calls = [];
  const c = {
    name: "Farmer",
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
    rip: false,
    dead: false,
    moving: false,
    target: null,
    q: {},
    items: [],
    isize: 42,
    ...overrides.character,
  };
  const timers = new Map();
  let timerSeq = 0;

  const box = {
    console,
    Date,
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
    character: c,
    entities: {
      goo1: {
        id: "goo1",
        type: "monster",
        mtype: "goo",
        map: "main",
        x: 50,
        y: 0,
        real_x: 50,
        real_y: 0,
        dead: false,
        rip: false,
      },
      ...overrides.entities,
    },
    server_region: "EU",
    server_identifier: "I",
    attack: async (target) => {
      calls.push(["attack", target?.id ?? target]);
      return { ok: true };
    },
    smart_move: async (destination) => {
      calls.push(["smart_move", destination]);
      return { ok: true };
    },
    loot: async () => {
      calls.push(["loot"]);
      return { ok: true };
    },
    respawn: async () => {
      calls.push(["respawn"]);
      return { ok: true };
    },
    use_skill: async (...args) => {
      calls.push(["use_skill", ...args]);
      return { ok: true };
    },
    send_cm: async (...args) => {
      calls.push(["send_cm", ...args]);
      return { ok: true };
    },
    change_server: async (...args) => {
      calls.push(["change_server", ...args]);
      return { ok: true };
    },
    buy: async (...args) => {
      calls.push(["buy", ...args]);
      return { ok: true };
    },
    sell: async (...args) => {
      calls.push(["sell", ...args]);
      return { ok: true };
    },
    exchange: async (...args) => {
      calls.push(["exchange", ...args]);
      return { ok: true };
    },
    upgrade: async (...args) => {
      calls.push(["upgrade", ...args]);
      return { ok: true };
    },
    compound: async (...args) => {
      calls.push(["compound", ...args]);
      return { ok: true };
    },
    craft: async (...args) => {
      calls.push(["craft", ...args]);
      return { ok: true };
    },
    send_item: async (...args) => {
      calls.push(["send_item", ...args]);
      return { ok: true };
    },
    send_gold: async (...args) => {
      calls.push(["send_gold", ...args]);
      return { ok: true };
    },
    bank_store: async (...args) => {
      calls.push(["bank_store", ...args]);
      return { ok: true };
    },
    bank_retrieve: async (...args) => {
      calls.push(["bank_retrieve", ...args]);
      return { ok: true };
    },
    bank_swap: async (...args) => {
      calls.push(["bank_swap", ...args]);
      return { ok: true };
    },
    can_attack: () => true,
    is_on_cooldown: () => false,
    get_party: () => ({}),
    setInterval(fn) {
      const id = ++timerSeq;
      timers.set(id, fn);
      return id;
    },
    clearInterval(id) {
      timers.delete(id);
    },
    ...overrides.root,
  };
  box.globalThis = box;
  box.parent = box;

  vm.createContext(box);
  vm.runInContext(source, box, {
    filename: "v5-live-lab-bot-v1.js",
  });

  return { box, calls, timers };
}

async function settle() {
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
}

test("runtime installs stopped and exposes explicit Live Lab identity", () => {
  const { box } = sandbox();
  const status = box.V5LiveLab.status();

  assert.equal(box.V5LiveLab.profileId, "V5_LIVE_LAB_PR28");
  assert.equal(status.running, false);
  assert.equal(status.liveExecutionAllowed, false);
  assert.equal(status.gameplayAuthority, false);
  assert.equal(status.normalRuntimeAllowed, false);
  assert.equal(status.rawWriteAuthority, false);
});

test("start requires explicit acknowledgement", () => {
  const { box } = sandbox();
  assert.throws(
    () => box.V5LiveLab.start(),
    /LIVE_LAB_START_ACK_REQUIRED/,
  );
});

test("configured farmer executes a real public attack with live authority", async () => {
  const { box, calls } = sandbox();

  box.V5LiveLab.configure({
    farm: {
      enabled: true,
      monsters: ["goo"],
      moveToTarget: false,
      loot: false,
    },
  });

  const started = box.V5LiveLab.start({
    ack: "V5_LIVE_LAB_START",
  });

  assert.equal(started.running, true);
  assert.equal(started.liveExecutionAllowed, true);
  assert.equal(started.gameplayAuthority, true);
  assert.equal(started.normalRuntimeAllowed, true);
  assert.equal(started.rawWriteAuthority, false);

  await settle();

  assert.ok(calls.some((row) => row[0] === "attack" && row[1] === "goo1"));
  const logs = box.V5LiveLab.exportLogs();
  assert.ok(logs.some((row) => row.event === "ACTION_SENT" && row.kind === "ATTACK"));

  box.V5LiveLab.stop();
});

test("active legacy runtime prevents dual-control start", () => {
  const { box } = sandbox({
    root: {
      AIO_V3: {
        __runtime: {
          timer: 1,
          status: () => ({ running: true }),
        },
      },
    },
  });

  assert.throws(
    () => box.V5LiveLab.start({ ack: "V5_LIVE_LAB_START" }),
    /LIVE_LAB_RUNTIME_CONFLICT:AIO_V3_RUNTIME_ACTIVE/,
  );
});

test("emergency stop removes all three live switches", () => {
  const { box } = sandbox();

  box.V5LiveLab.start({ ack: "V5_LIVE_LAB_START" });
  const stopped = box.V5LiveLab.emergencyStop("TEST_STOP");

  assert.equal(stopped.running, false);
  assert.equal(stopped.emergencyStop, true);
  assert.equal(stopped.liveExecutionAllowed, false);
  assert.equal(stopped.gameplayAuthority, false);
  assert.equal(stopped.normalRuntimeAllowed, false);
  assert.equal(stopped.rawWriteAuthority, false);
});

test("bug bundle carries build identity, status, config and bounded logs", () => {
  const { box } = sandbox();
  const bundle = box.V5LiveLab.exportBugBundle();

  assert.equal(bundle.issueSchema, "V5 Live-Test Bug");
  assert.equal(bundle.profileId, "V5_LIVE_LAB_PR28");
  assert.match(bundle.sourceMainSha, /^[0-9a-f]{40}$/);
  assert.ok(Array.isArray(bundle.logs));
  assert.equal(bundle.status.rawWriteAuthority, false);
  assert.ok(bundle.config.farm);
});

test("browser artifact contains no raw socket or api_call mutation bypass", () => {
  for (const marker of [
    "socket.emit(",
    ".socket.emit(",
    "api_call(",
  ]) {
    assert.equal(source.includes(marker), false, marker);
  }
});
