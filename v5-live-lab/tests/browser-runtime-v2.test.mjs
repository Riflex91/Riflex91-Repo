import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("browser/v5-live-lab-bot-v2.js", "utf8");

function makeEnv(overrides = {}) {
  let nowMs = 1_000_000;
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

  const partyMembers = overrides.partyMembers || [character.name];

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
    S: overrides.S || {},
    server_region: "EU",
    server_identifier: "I",
    get_party: () => Object.fromEntries(
      partyMembers.map((name) => [name, { name }]),
    ),
    get_player: (name) => box.entities["player:" + name] || null,
    can_attack: (target) => !!target && target.dead !== true,
    is_on_cooldown: () => false,
    attack: async (target) => {
      calls.push(["attack", target?.id]);
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
      calls.push([
        "use_skill",
        ...args.map((value) => value?.id ?? value?.name ?? value),
      ]);
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
    join: async (...args) => {
      calls.push(["join", ...args]);
      return { ok: true };
    },
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
    filename: "v5-live-lab-bot-v2.js",
  });

  return {
    box,
    calls,
    timers,
    advance(ms) {
      nowMs += ms;
    },
  };
}

async function settle(rounds = 8) {
  for (let i = 0; i < rounds; i += 1) {
    await new Promise((resolve) => setImmediate(resolve));
  }
}

async function startAndSettle(env) {
  env.box.V5LiveLab.start({ ack: "V5_LIVE_LAB_START" });
  await settle();
}

async function tickAndSettle(env) {
  await env.box.V5LiveLab.tickNow();
  await settle();
}

test("v2 installs PR24-28 live surfaces stopped and without raw authority", () => {
  const env = makeEnv();
  const status = env.box.V5LiveLab.status();

  assert.equal(env.box.V5LiveLab.version, "0.4.0");
  assert.equal(status.running, false);
  assert.equal(status.liveExecutionAllowed, false);
  assert.equal(status.gameplayAuthority, false);
  assert.equal(status.normalRuntimeAllowed, false);
  assert.equal(status.rawWriteAuthority, false);
  assert.ok(status.world);
  assert.ok(status.evidence);
});

test("PR24 fresh heal+dps topology assigns HEAL and REVIVE to the priest", async () => {
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
    coordination: {
      peers: ["Priest"],
      heartbeatMs: 999999,
    },
    group: {
      enabled: true,
      topologyId: "heal-dps",
      knownMemberIds: ["Ranger", "Priest"],
      leader: "Ranger",
    },
    farm: { enabled: false },
  });

  await startAndSettle(env);
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
    capabilities: ["HEAL", "SINGLE_TARGET", "REVIVE"],
  });
  await tickAndSettle(env);

  const group = env.box.V5LiveLab.status().group;
  assert.equal(group.status, "LIVE_GROUP_READY");
  assert.equal(group.roles.HEAL, "Priest");
  assert.equal(group.roles.REVIVE, "Priest");
  assert.equal(group.rawWriteAuthority, false);
  assert.equal(
    env.box.V5LiveLab.exportLogs().some((row) => row.event === "TICK_ERROR"),
    false,
  );

  env.box.V5LiveLab.stop();
});

test("PR24 foreign party member fails closed", async () => {
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
  await startAndSettle(env);
  await tickAndSettle(env);

  const status = env.box.V5LiveLab.status();
  assert.equal(status.group.status, "BLOCKED");
  assert.ok(status.group.faults.includes("FREMDES_PARTY_MITGLIED"));
  assert.equal(status.currentTask, null);

  env.box.V5LiveLab.stop();
});

test("PR25 full 5m capability and 15m integration evidence passes", async () => {
  const env = makeEnv();

  env.box.V5LiveLab.configure({
    farm: { enabled: false },
    evidence: {
      enabled: true,
      autoIntegration: false,
    },
  });
  await startAndSettle(env);

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

test("PR26 hard filter rejects unsafe high-priority learning candidate", async () => {
  const env = makeEnv({
    S: {
      unsafeevent: {
        active: true,
      },
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
  });

  env.box.V5LiveLab.configure({
    farm: {
      enabled: true,
      monsters: ["goo"],
      loot: false,
    },
    world: {
      events: [{
        id: "unsafeevent",
        stateKey: "unsafeevent",
        known: false,
        priority: 999,
        learningScore: 100,
      }],
    },
  });
  await startAndSettle(env);
  await tickAndSettle(env);

  const status = env.box.V5LiveLab.status();
  assert.equal(status.currentTask.type, "FARM");
  assert.ok(
    status.optimizer.rejectedCandidateIds.includes(
      "world:EVENT:unsafeevent",
    ),
  );
  assert.equal(status.optimizer.learningCanRelaxHardFilter, false);

  env.box.V5LiveLab.stop();
});

test("PR26 ranks concrete task-party combinations and binds the local execution party", async () => {
  const env = makeEnv({
    partyMembers: ["Ranger", "Priest"],
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
  });

  env.box.V5LiveLab.configure({
    farm: {
      enabled: true,
      monsters: ["goo"],
      loot: false,
    },
    coordination: {
      peers: ["Priest"],
      heartbeatMs: 999999,
    },
    progression: {
      enabled: false,
    },
    optimizer: {
      replanMs: 1000,
      partyProfiles: [
        {
          id: "solo-ranger",
          memberIds: ["Ranger"],
          successModifier: 0,
        },
        {
          id: "duo",
          memberIds: ["Ranger", "Priest"],
          successModifier: 0.3,
        },
      ],
    },
  });
  await startAndSettle(env);

  env.box.on_cm("Priest", {
    type: "V5_LIVE_LAB_HEARTBEAT",
    profileId: "V5_LIVE_LAB_PR28",
    character: "Priest",
    ctype: "priest",
    map: "main",
    hp: 900,
    maxHp: 1000,
    mp: 900,
    maxMp: 1000,
    level: 75,
    gearScore: 700,
    dead: false,
    capabilities: ["HEAL", "SINGLE_TARGET", "REVIVE"],
  });

  env.advance(1500);
  await tickAndSettle(env);

  const status = env.box.V5LiveLab.status();
  assert.equal(status.currentTask.partyId, "duo");
  assert.deepEqual(
    [...status.currentTask.partyMemberIds].sort(),
    ["Priest", "Ranger"],
  );
  assert.equal(status.optimizer.ranking[0].partyId, "duo");

  env.box.V5LiveLab.stop();
});

test("PR27 selects weaker undertrained character and gates optional work on stronger local character", async () => {
  const env = makeEnv({
    partyMembers: ["Ranger", "WeakMage"],
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
  });

  env.box.V5LiveLab.configure({
    farm: {
      enabled: true,
      monsters: ["goo"],
      loot: false,
    },
    coordination: {
      peers: ["WeakMage"],
      heartbeatMs: 999999,
    },
    progression: {
      enabled: true,
      targetCorridor: 0.05,
      mandatoryRoles: [],
      maxLevel: 100,
      maxGearScore: 1000,
    },
  });
  await startAndSettle(env);

  env.box.on_cm("WeakMage", {
    type: "V5_LIVE_LAB_HEARTBEAT",
    profileId: "V5_LIVE_LAB_PR28",
    character: "WeakMage",
    ctype: "mage",
    map: "main",
    hp: 400,
    maxHp: 1000,
    mp: 700,
    maxMp: 1000,
    level: 30,
    gearScore: 200,
    dead: false,
    capabilities: ["SINGLE_TARGET", "AOE", "CC"],
  });

  env.advance(1000);
  await tickAndSettle(env);

  const progression = env.box.V5LiveLab.status().progression;
  assert.equal(progression.status, "LIVE_SELECTION_READY");
  assert.equal(progression.selectedCharacter, "WeakMage");
  assert.equal(progression.progressionStarvationGuard, true);
  assert.equal(env.box.V5LiveLab.status().currentTask, null);
  assert.equal(
    env.calls.filter((row) => row[0] === "attack").length,
    0,
  );

  env.box.V5LiveLab.stop();
});

test("PR28 event public action is revalidated, deduped and recorded in world ledger", async () => {
  const env = makeEnv({
    S: {
      goobrawl: {
        active: true,
        phase: 1,
      },
    },
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
  await startAndSettle(env);
  await tickAndSettle(env);

  const status = env.box.V5LiveLab.status();
  assert.equal(
    env.calls.filter((row) => row[0] === "join").length,
    1,
  );
  assert.equal(status.world.plans.length, 1);
  assert.equal(status.world.plans[0].status, "COMPLETED");
  assert.equal(status.world.plans[0].lastValidation, "VALID");

  await tickAndSettle(env);
  assert.equal(
    env.calls.filter((row) => row[0] === "join").length,
    1,
  );

  env.box.V5LiveLab.stop();
});

test("PR28 event drift between planning and action blocks the action", async () => {
  let reads = 0;
  const S = {};
  Object.defineProperty(S, "driftevent", {
    configurable: true,
    get() {
      reads += 1;
      return {
        active: true,
        phase: reads === 1 ? 1 : 2,
      };
    },
  });

  const env = makeEnv({ S });
  env.box.V5LiveLab.configure({
    farm: { enabled: false },
    world: {
      events: [{
        id: "driftevent",
        stateKey: "driftevent",
        action: {
          type: "PUBLIC_FUNCTION",
          name: "join",
          args: ["driftevent"],
        },
      }],
      allowedPublicActions: ["join"],
    },
  });
  await startAndSettle(env);

  assert.equal(
    env.calls.some((row) => row[0] === "join"),
    false,
  );
  assert.ok(
    env.box.V5LiveLab.exportLogs().some(
      (row) =>
        row.event === "WORLD_REVALIDATION_BLOCKED"
        && row.status === "REPLAN_REQUIRED",
    ),
  );

  env.box.V5LiveLab.stop();
});

test("PR28 unknown discovery stays quarantined and receives no action authority", async () => {
  const env = makeEnv({
    entities: {
      unknown1: {
        id: "unknown1",
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
  await startAndSettle(env);
  await tickAndSettle(env);

  const status = env.box.V5LiveLab.status();
  assert.equal(status.world.quarantine.length, 1);
  assert.equal(status.currentTask, null);
  assert.equal(
    env.calls.some((row) => row[0] === "attack"),
    false,
  );

  env.box.V5LiveLab.stop();
});

test("PR28 known NORMAL server hop executes once and enters cooldown history", async () => {
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
  await startAndSettle(env);
  await tickAndSettle(env);

  assert.equal(
    env.calls.filter(
      (row) =>
        row[0] === "change_server"
        && row[1] === "EU"
        && row[2] === "II",
    ).length,
    1,
  );

  const status = env.box.V5LiveLab.status();
  assert.equal(status.world.hopHistory.length, 1);
  assert.equal(status.world.plans[0].status, "COMPLETED");
  assert.equal(status.rawWriteAuthority, false);

  await tickAndSettle(env);
  assert.equal(
    env.calls.filter((row) => row[0] === "change_server").length,
    1,
  );

  env.box.V5LiveLab.stop();
});

test("restart reconciliation persists irreversible fences and fails the first group tick closed", async () => {
  const rows = new Map();
  const localStorage = {
    getItem(key) {
      return rows.has(key) ? rows.get(key) : null;
    },
    setItem(key, value) {
      rows.set(key, String(value));
    },
  };

  rows.set(
    "v5-live-lab:v2:Ranger",
    JSON.stringify({
      schemaVersion: 1,
      profileId: "V5_LIVE_LAB_PR28",
      version: "0.2.0",
      character: "Ranger",
      lastServer: {
        region: "EU",
        identifier: "I",
      },
      updatedAtMs: 999000,
      session: {
        running: true,
        sessionId: "old-session",
      },
      irreversible: [[
        "exchange:Ranger:gift:7:10",
        {
          status: "IN_FLIGHT",
          kind: "EXCHANGE",
          startedAtMs: 998000,
        },
      ]],
      worldHopHistory: [["EU:II", 900000]],
      trainingMs: [["Ranger", 120000]],
    }),
  );

  const env = makeEnv({
    root: {
      localStorage,
    },
  });

  let status = env.box.V5LiveLab.status();
  assert.equal(status.restartDetected, true);
  assert.equal(status.restartReconciled, true);
  assert.equal(status.persistenceAvailable, true);
  assert.equal(
    status.irreversibleIntents[0].status,
    "UNKNOWN",
  );
  assert.equal(
    status.irreversibleIntents[0].error,
    "RESTART_DURING_IRREVERSIBLE_ACTION",
  );

  env.box.V5LiveLab.configure({
    farm: { enabled: false },
    group: {
      enabled: true,
      topologyId: "solo",
      knownMemberIds: ["Ranger"],
    },
  });

  await startAndSettle(env);
  status = env.box.V5LiveLab.status();
  assert.equal(status.group.status, "BLOCKED");
  assert.ok(status.group.faults.includes("RESTART"));

  await tickAndSettle(env);
  status = env.box.V5LiveLab.status();
  assert.equal(status.group.status, "LIVE_GROUP_READY");
  assert.equal(status.group.faults.includes("RESTART"), false);

  const persisted = JSON.parse(
    localStorage.getItem("v5-live-lab:v2:Ranger"),
  );
  assert.equal(persisted.session.running, true);
  assert.equal(persisted.irreversible[0][1].status, "UNKNOWN");

  env.box.V5LiveLab.stop();
});

test("v2 source contains no raw socket or api_call mutation bypass", () => {
  for (const marker of [
    "socket.emit(",
    ".socket.emit(",
    "api_call(",
  ]) {
    assert.equal(source.includes(marker), false, marker);
  }
});
