import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { webcrypto } from "node:crypto";
import { TextEncoder } from "node:util";

const source = fs.readFileSync(
  "werkzeuge/pr20-7-weapon-offhand-read-only-autonomous.js",
  "utf8",
);

function makeSandbox({
  items,
  mainhand = { name: "staff", level: 0, gift: 1 },
  offhand = null,
} = {}) {
  let playing = true;
  const sandbox = {
    console,
    crypto: webcrypto,
    TextEncoder,
    Date,
    Promise,
    Object,
    Array,
    String,
    Number,
    Boolean,
    JSON,
    Math,
    setTimeout: fn => setImmediate(fn),
    clearTimeout: () => {},
    performance_trick: () => { playing = true; },
    sounds: {
      empty: {
        cplaying: true,
        playing: () => playing,
      },
    },
    server_region: "EU",
    server_identifier: "I",
    entities: {},
    character: {
      name: "My_Merchant",
      id: "My_Merchant",
      owner: "account-1",
      ctype: "merchant",
      level: 58,
      map: "main",
      rip: false,
      dead: false,
      moving: false,
      target: null,
      q: {},
      items: items ?? [{ name: "blade", level: 1 }],
      slots: {
        mainhand,
        offhand,
        helmet: { name: "wcap", level: 4 },
        chest: { name: "coat", level: 5 },
      },
    },
    G: {
      items: {
        blade: { type: "weapon", wtype: "short_sword" },
        staff: { type: "weapon", wtype: "staff" },
        rod: { type: "weapon", wtype: "rod" },
        source1: { type: "source" },
        wcap: { type: "helmet" },
        coat: { type: "chest" },
      },
      classes: {
        merchant: {
          mainhand: {
            mace: {}, staff: {}, bow: {}, spear: {}, short_sword: {},
            fist: {}, dartgun: {}, dagger: {},
          },
          doublehand: { rod: {}, pickaxe: {}, axe: {}, basher: {} },
          offhand: { shield: {}, source: {}, quiver: {}, misc_offhand: {} },
        },
      },
    },
  };
  sandbox.parent = sandbox;
  sandbox.globalThis = sandbox;
  return sandbox;
}

async function execute(options = {}) {
  const sandbox = makeSandbox(options);
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, {
    filename: "pr20-7-weapon-offhand-read-only-autonomous.js",
  });
  for (let i = 0; i < 1000; i += 1) {
    await new Promise(resolve => setImmediate(resolve));
    const api = sandbox.V5PR207WeaponOffhandReadOnlyTest;
    if (api?.status()?.terminal === true) return api.status();
  }
  throw new Error("weapon/offhand preflight did not terminate");
}

test("weapon/offhand read-only preflight selects stable explicit mainhand candidate", async () => {
  const status = await execute();
  assert.equal(status.status, "BESTANDEN");
  assert.equal(status.phase, "COMPLETE");
  assert.equal(status.terminal, true);
  assert.equal(status.evidence.recipient.characterName, "My_Merchant");
  assert.equal(status.evidence.candidate.slot, "mainhand");
  assert.equal(status.evidence.candidate.inventoryIndex, 0);
  assert.equal(status.evidence.candidate.name, "blade");
  assert.equal(status.evidence.candidateWtype, "short_sword");
  assert.equal(status.evidence.candidateIsDoublehand, false);
  assert.equal(status.evidence.oppositeHand.slot, "offhand");
  assert.equal(status.evidence.oppositeHand.name, null);
  assert.equal(status.evidence.explicitWeaponSlotResolved, true);
  assert.equal(status.evidence.oppositeHandPinned, true);
  assert.equal(status.evidence.classRulesVerified, true);
  assert.equal(status.evidence.stableDoubleObservation, true);
  assert.equal(status.evidence.performanceTrick.active, true);
  assert.equal(status.gameplayWrites, 0);
  assert.equal(status.publicFunctionCalls, 0);
  assert.equal(status.rawWriteCalls, 0);
  assert.equal(status.sameIntentRetry, false);
  assert.equal(status.normalRuntimeAllowed, false);
});

test("doublehand candidate blocks when offhand is occupied", async () => {
  const status = await execute({
    items: [{ name: "rod", level: 0 }],
    offhand: { name: "source1", level: 0 },
  });
  assert.equal(status.status, "BLOCKIERT");
  assert.equal(status.terminal, true);
  assert.deepEqual(
    Array.from(status.blocker),
    ["PR20_7_WEAPON_OFFHAND_KEIN_SICHERER_KANDIDAT"],
  );
  assert.equal(status.gameplayWrites, 0);
  assert.equal(status.rawWriteCalls, 0);
});

test("offhand source candidate is selected only with compatible one-hand mainhand", async () => {
  const status = await execute({
    items: [{ name: "source1", level: 0 }],
    mainhand: { name: "staff", level: 0 },
    offhand: null,
  });
  assert.equal(status.status, "BESTANDEN");
  assert.equal(status.evidence.candidate.slot, "offhand");
  assert.equal(status.evidence.candidate.name, "source1");
  assert.equal(status.evidence.oppositeHand.slot, "mainhand");
  assert.equal(status.evidence.oppositeHand.name, "staff");
  assert.equal(status.evidence.candidateIsDoublehand, false);
});

test("weapon/offhand package contains no gameplay mutation bypass", () => {
  for (const forbidden of [
    "equip(",
    "unequip(",
    "use_skill(",
    "send_item(",
    "start_character(",
    "command_character(",
    "/disconnect ",
    "api_call(",
    "socket.emit(",
    ".socket.emit(",
  ]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
  assert.ok(source.includes("gameplayWrites: 0"));
  assert.ok(source.includes("rawWriteCalls: 0"));
  assert.ok(source.includes("publicFunctionCalls: 0"));
  assert.ok(source.includes("normalRuntimeAllowed: false"));
});
