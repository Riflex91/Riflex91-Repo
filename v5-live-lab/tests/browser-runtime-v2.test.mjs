import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("browser/v5-live-lab-bot-v2.js", "utf8");

function makeEnv(overrides = {}) {
  let nowMs = 1000000;
  const calls = [];
  const timers = new Map();
  let timerSeq = 0;

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
    ...overrides.character,
  };

  const partyMembers = overrides.partyMembers || ["Ranger"];

  const box = {
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
    Date: { now: () => nowMs },
    character,
    entities: { ...(overrides.entities || {}) },
    G: {
      monsters: {
        goo: {},
        crab: {},
        ...((overrides.G && overrides.G.monsters) || {}),
      },
      ...overrides.G,
    },
    S: { ...(overrides.S || {}) },
    server_region: "EU",
    server_identifier: "I",
    get_party: () => Object.fromEntries(partyMembers.map((name) => [name, { name }])),
    get_player: (name) => box.entities["player:" + name] || null,
    can_attack: (target) => target && target.dead !== true,
    is_on_cooldown: () => false,
    attack: async (target) => { calls.push(["attack", target && target.id]); return { ok: true }; },
    smart_move: async (destination) => { calls.push(["smart_move", destination]); return { ok: true }; },
    loot: async () => { calls.push(["loot"]); return { ok: true }; },
    respawn: async () => { calls.push(["respawn"]); return { ok: true }; },
    use_skill: async (...args) => { calls.push(["use_skill", ...args.map((x) => x && x.id || x && x.name || x)]); return { ok: true }; },
    send_cm: async (...args) => { calls.push(["send_cm", ...args]); return { ok: true }; },
    change_server: async (...args) => { calls.push(["change_server", ...args]); return { ok: true }; },
    buy: async (...args) => { calls.push(["buy", ...args]); return { ok: true }; },
    sell: async (...args) => { calls.push(["sell", ...args]); return { ok: true }; },
    exchange: async (...args) => { calls.push(["exchange", ...args]); return { ok: true }; },
    upgrade: async (...args) => { calls.push(["upgrade", ...args]); return { ok: true }; },
    compound: async (...args) => { calls.push(["compound", ...args]); return { ok: true }; },
    craft: async (...args) => { calls.push(["craft", ...args]); return { ok: true }; },
    send_item: async (...args) => { calls.push(["send_item", ...args]); return { ok: true }; },
    send_gold: async (...args) => { calls.push(["send_gold", ...args]); return { ok: true }; },
    bank_store: async (...args) => { calls.push(["bank_store", ...args]); return { ok: true }; },
    bank_retrieve: async (...args) => { calls.push(["bank_retrieve", ...args]); return { ok: true }; },
    bank_swap: async (...args) => { calls.push(["bank_swap", ...args]); return { ok: true }; },
    join: async (...args) => { calls.push(["join", ...args]); return { ok: true }; },
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
  vm.runInContext(source, box, { filename: "v5-live-lab-bot-v2.js" });

  return {
    box,
    calls,
    timers,
    advance(ms) { nowMs += ms; },
  };
}

async function settle() {
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
}

async function tick(env) {
  await env.box.V5LiveLab.tickNow();
  await settle();
}

test("v2 installs all PR24-28 surfaces while stopped", () => {
  const env = makeEnv();
  const status = env.box.V5LiveLab.status();

  assert.equal(env.box.V5LiveLab.version, "0.2.0");
  assert.equal(status.running, false);
  assert.equal(status.liveExecutionAllowed, false);
  assert.equal(status.rawWriteAuthority, false);
  assert.ok(status.group);
  assert.ok(status.evidence);
  assert.ok(status.world);
});

test("PR24 live group accepts fresh heal+dps topology and assigns healer", async () => {
  const env = makeEnv({
    partyMembers: ["Ranger", "Priest"],
    entities: {
      "player:Priest": {
        id: "priest-id",
        name: "Priest",
        type: "character",
        hp: 800,
        max_hp: 1000,
      },
    },
  });

  env.box.V5LiveLab.configure({
    coordination: { peers: ["Priest"], heartbeatMs: 100000 },
    group: {
      enabled: true,
      topologyId: "heal-dps",
      knownMemberIds: ["Ranger", "Priest"],
      leader: "Ranger",
    },
    farm: { enabled: false },
  });

  env.box.V5LiveLab.start({ ack: "V5_LIVE_LAB_START" });
  env.box.on_cm("Priest", {
    type: "V5_LIVE_LAB_HEARTBEAT",
    profileId: "V5_LIVE_LAB_PR28",
    character: "Priest",
    ctype: "priest",
    map: "main",
    hp: 800,
    maxHp: 1000,
    mp: 900,
    maxMp: 1000,
    level: 75,
    gearScore: 700,
    dead: false,
    moving: false,
    capabilities: ["HEAL", "SINGLE_TARGET", "REVIVE"],
  });
  await tick(env);

  const status = env.box.V5LiveLab.status();
  assert.equal(status.group.status, "LIVE_GROUP_READY");
  assert.equal(status.group.roles.HEAL, "Priest");
  assert.ok(status.group.availableCapabilities.includes("HEAL"));
  assert.equal(status.group.rawWriteAuthority, false);

  env.box.V5LiveLab.stop();
});

test("PR24 fail-closes on foreign party member", async () => {
  const env = makeEnv({
    partyMembers: ["Ranger", "Intruder"],
  });

  env.box.V5LiveLab.configure({
    group: {
      enabled: true,
      topologyId: "solo",
      knownMemberIds: ["Ranger"],
      failClosedOnFault: true,
    },
  });
  env.box.V5LiveLab.start({ ack: "V5_LIVE_LAB_START" });
  await tick(env);

  const status = env.box.V5LiveLab.status();
  assert.equal(status.group.status, "BLOCKED");
  assert.ok(status.group.faults.includes("FREMDES_PARTY_MITGLIED"));
  assert.equal(status.currentTask, null);

  env.box.V5LiveLab.stop();
});

test("PR25 records full 5m capability and 15m integration evidence", async () => {
  const env = makeEnv();

  env.box.V5LiveLab.configure({
    evidence: { enabled: true, autoIntegration: false },
  });
  env.box.V5LiveLab.start({ ack: "V5_LIVE_LAB_START" });

  env.box.V5LiveLab.startEvidenceSegment({
    art: "CAPABILITY_5M",
    capabilityId: "AOE",
  });
  env.advance(300000);
  env.box.V5LiveLab.finishEvidenceSegment("TEST");

  env.box.V5LiveLab.startEvidenceSegment({
    art: "INTEGRATION_15M",
  });
  env.advance(900000);
  env.box.V5LiveLab.finishEvidenceSegment("TEST");

  const evidence = env.box.V5LiveLab.status().evidence;
  assert.equal(evidence.status, "BESTANDEN");
  assert.equal(evidence.capabilitySegmente, 1);
  assert.equal(evidence.integrationsSegmente, 1);
  assert.equal(evidence.gesamteDauerSekunden, 1200);

  env.box.V5LiveLab.stop();
});

test("PR26 optimizer selects live event ahead of normal farm by deterministic priority", async () => {
  const env = makeEnv({
    S: { holiday: { active: true, phase: "live" } },
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
    },
  });

  env.box.V5LiveLab.configure({
    farm: { enabled: true, monsters: ["goo"], loot: false },
    world: {
      events: [{
        id: "holiday",
        stateKey: "holiday",
        destination: { map: "main", x: 500, y: 500 },
        priority: 80,
      }],
    },
  });
  env.box.V5LiveLab.start({ ack: "V5_LIVE_LAB_START" });
  await tick(env);

  const status = env.box.V5LiveLab.status();
  assert.equal(status.optimizer.learningCanRelaxHardFilter, false);
  assert.equal(status.currentTask.type, "EVENT");
  assert.match(status.currentTask.id, /^world:EVENT:/);

  env.box.V5LiveLab.stop();
});

test("PR27 selects weaker undertrained character when no mandatory role overrides", async () => {
  const env = makeEnv({
    partyMembers: ["Ranger", "WeakMage"],
  });

  env.box.V5LiveLab.configure({
    coordination: { peers: ["WeakMage"], heartbeatMs: 100000 },
    progression: {
      enabled: true,
      targetCorridor: 0.05,
      mandatoryRoles: [],
      maxLevel: 100,
      maxGearScore: 1000,
    },
  });
  env.box.V5LiveLab.start({ ack: "V5_LIVE_LAB_START" });

  env.box.on_cm("WeakMage", {
    type: "V5_LIVE_LAB_HEARTBEAT",
    profileId: "V5_LIVE_LAB_PR28",
    character: "WeakMage",
    ctype: "mage",
    map: "main",
    hp: 400,
    maxHp: 1000,
    mp: 800,
    maxMp: 1000,
    level: 30,
    gearScore: 200,
    dead: false,
    capabilities: ["SINGLE_TARGET", "AOE", "CC"],
  });

  env.advance(1000);
  await tick(env);

  const progression = env.box.V5LiveLab.status().progression;
  assert.equal(progression.status, "LIVE_SELECTION_READY");
  assert.equal(progression.selectedCharacter, "WeakMage");
  assert.equal(progression.progressionStarvationGuard, true);

  env.box.V5LiveLab.stop();
});

test("PR28 active event is revalidated and can execute allowlisted public action", async () => {
  const env = makeEnv({
    S: { goobrawl: { active: true, phase: 1 } },
  });

  env.box.V5LiveLab.configure({
    farm: { enabled: false },
    world: {
      events: [{
        id: "goobrawl",
        stateKey: "goobrawl",
        action: {
          type: "PUBLIC_FUNCTION",
          name: "join",
          args: ["goobrawl"],
        },
      }],
      allowedPublicActions: ["join"],
    },
  });
  env.box.V5LiveLab.start({ ack: "V5_LIVE_LAB_START" });
  await tick(env);

  assert.ok(env.calls.some((row) => row[0] === "join" && row[1] === "goobrawl"));
  const blocked = env.box.V5LiveLab.exportLogs().filter((row) => row.event === "WORLD_REVALIDATION_BLOCKED");
  assert.equal(blocked.length, 0);

  env.box.V5LiveLab.stop();
});

test("PR28 unknown monster discovery is quarantined and never selected for action", async () => {
  const env = makeEnv({
    entities: {
      strange1: {
        id: "strange1",
        type: "monster",
        mtype: "future_unknown_mob",
        map: "main",
        x: 10,
        y: 10,
        dead: false,
        rip: false,
      },
    },
  });

  env.box.V5LiveLab.configure({
    farm: { enabled: false },
    world: {
      discoveryEnabled: true,
      knownMonsterTypes: ["goo"],
    },
  });
  env.box.V5LiveLab.start({ ack: "V5_LIVE_LAB_START" });
  await tick(env);

  const status = env.box.V5LiveLab.status();
  assert.equal(status.world.quarantine.length, 1);
  assert.equal(status.currentTask, null);
  assert.equal(env.calls.some((row) => row[0] === "attack"), false);

  env.box.V5LiveLab.stop();
});

test("PR28 server hop uses fresh known NORMAL server and remains duplicate fenced", async () => {
  const env = makeEnv();

  env.box.V5LiveLab.configure({
    farm: { enabled: false },
    world: {
      serverHopEnabled: true,
      serverHopCooldownMs: 600000,
      servers: [{
        region: "EU",
        identifier: "II",
        mode: "NORMAL",
        online: true,
      }],
    },
  });
  env.box.V5LiveLab.start({ ack: "V5_LIVE_LAB_START" });
  await tick(env);

  assert.ok(env.calls.some((row) =>
    row[0] === "change_server" && row[1] === "EU" && row[2] === "II"
  ));
  const status = env.box.V5LiveLab.status();
  assert.equal(status.rawWriteAuthority, false);
  assert.equal(status.world.hopHistory.length, 1);

  await tick(env);
  const hopCalls = env.calls.filter((row) => row[0] === "change_server");
  assert.equal(hopCalls.length, 1);

  env.box.V5LiveLab.stop();
});

test("v2 source contains no raw socket/api_call bypass", () => {
  for (const marker of ["socket.emit(", ".socket.emit(", "api_call("]) {
    assert.equal(source.includes(marker), false, marker);
  }
});
