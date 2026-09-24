import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(
  "werkzeuge/pr20-7-account-weapon-candidate-discovery.js",
  "utf8",
);

function sandboxWithRows(rows, active = []) {
  const sandbox = {
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
    performance_trick() {},
    sounds: {
      empty: {
        cplaying: true,
        playing: () => true,
      },
    },
    character: {
      name: "My_Merchant",
      ctype: "merchant",
    },
    G: {
      items: {
        bow: { type: "weapon", wtype: "bow" },
        blade: { type: "weapon", wtype: "short_sword" },
        staff: { type: "weapon", wtype: "staff" },
        source1: { type: "source" },
        rod: { type: "weapon", wtype: "rod" },
        coat: { type: "chest" },
      },
      classes: {
        ranger: {
          mainhand: { bow: {}, crossbow: {} },
          doublehand: { fist: {}, dagger: {} },
          offhand: { quiver: {} },
        },
        priest: {
          mainhand: { pmace: {}, staff: {} },
          doublehand: { wand: {} },
          offhand: { shield: {}, source: {}, misc_offhand: {} },
        },
        mage: {
          mainhand: { staff: {}, wblade: {}, wand: {} },
          doublehand: { great_staff: {} },
          offhand: { source: {}, misc_offhand: {} },
        },
        merchant: {
          mainhand: { staff: {} },
          doublehand: {},
          offhand: { source: {} },
        },
      },
    },
    get_characters: () => rows,
    get_active_characters: () => active,
  };
  sandbox.parent = sandbox;
  sandbox.globalThis = sandbox;
  return sandbox;
}

async function execute(rows, active = []) {
  const sandbox = sandboxWithRows(rows, active);
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, {
    filename: "pr20-7-account-weapon-candidate-discovery.js",
  });
  for (let i = 0; i < 100; i += 1) {
    await Promise.resolve();
    const api = sandbox.V5PR207AccountWeaponCandidateDiscovery;
    const status = api?.status?.();
    if (status?.terminal) return status;
  }
  throw new Error("account discovery did not terminate");
}

test("account discovery selects deterministic existing farmer candidate read-only", async () => {
  const status = await execute([
    {
      name: "My_Ranger1",
      ctype: "ranger",
      level: 70,
      items: [{ name: "blade", level: 0 }],
      slots: { mainhand: { name: "bow", level: 3 }, offhand: null },
    },
    {
      name: "My_Priest",
      ctype: "priest",
      level: 70,
      items: [{ name: "source1", level: 0 }],
      slots: { mainhand: { name: "staff", level: 3 }, offhand: null },
    },
    {
      name: "My_Mage",
      ctype: "mage",
      level: 70,
      items: [],
      slots: { mainhand: { name: "staff", level: 3 }, offhand: null },
    },
  ], ["My_Ranger1", "My_Priest", "My_Mage"]);

  assert.equal(status.status, "BESTANDEN");
  assert.equal(status.terminal, true);
  assert.equal(status.rosterSource, "get_characters");
  assert.equal(status.observations.length, 3);
  assert.equal(status.selectedCandidate.recipient, "My_Priest");
  assert.equal(status.selectedCandidate.slot, "offhand");
  assert.equal(status.selectedCandidate.candidateName, "source1");
  assert.equal(status.selectedCandidate.exactLiveSessionPreflightStillRequired, true);
  assert.equal(status.gameplayWrites, 0);
  assert.equal(status.publicFunctionCalls, 0);
  assert.equal(status.rawWriteCalls, 0);
  assert.equal(status.startCalls, 0);
  assert.equal(status.disconnectCalls, 0);
  assert.equal(status.farmerWorkersInstalled, 0);
  assert.equal(status.normalRuntimeAllowed, false);
});

test("account discovery reports roster without inventories fail-closed", async () => {
  const status = await execute([
    { name: "My_Ranger1", ctype: "ranger", level: 70 },
    { name: "My_Priest", ctype: "priest", level: 70 },
    { name: "My_Mage", ctype: "mage", level: 70 },
  ]);
  assert.equal(status.status, "BLOCKIERT");
  assert.deepEqual(
    Array.from(status.blocker),
    ["PR20_7_ACCOUNT_DISCOVERY_ROSTER_OHNE_INVENTAR_SLOTS"],
  );
  assert.equal(status.gameplayWrites, 0);
  assert.equal(status.rawWriteCalls, 0);
});

test("account discovery blocks doublehand when roster snapshot shows occupied offhand", async () => {
  const status = await execute([
    {
      name: "My_Ranger1",
      ctype: "ranger",
      level: 70,
      items: [],
      slots: { mainhand: { name: "bow", level: 3 }, offhand: null },
    },
    {
      name: "My_Priest",
      ctype: "priest",
      level: 70,
      items: [{ name: "rod", level: 0 }],
      slots: {
        mainhand: { name: "staff", level: 3 },
        offhand: { name: "source1", level: 0 },
      },
    },
    {
      name: "My_Mage",
      ctype: "mage",
      level: 70,
      items: [],
      slots: { mainhand: { name: "staff", level: 3 }, offhand: null },
    },
  ]);
  assert.equal(status.status, "BLOCKIERT");
  assert.equal(status.selectedCandidate, null);
  assert.equal(status.gameplayWrites, 0);
});

test("account discovery package has no gameplay mutation path", () => {
  for (const marker of [
    "equip(",
    "unequip(",
    "buy(",
    "buy_with_gold(",
    "bank_retrieve(",
    "bank_store(",
    "send_item(",
    "send_cm(",
    "use_skill(",
    "start_character(",
    "command_character(",
    "/disconnect ",
    "api_call(",
    "socket.emit(",
    ".socket.emit(",
  ]) assert.equal(source.includes(marker), false, marker);
  assert.ok(source.includes("gameplayWrites: 0"));
  assert.ok(source.includes("publicFunctionCalls: 0"));
  assert.ok(source.includes("rawWriteCalls: 0"));
  assert.ok(source.includes("normalRuntimeAllowed: false"));
});
