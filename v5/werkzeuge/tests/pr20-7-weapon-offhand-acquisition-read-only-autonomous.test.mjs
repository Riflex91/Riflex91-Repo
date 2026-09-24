import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source = fs.readFileSync(
  "werkzeuge/pr20-7-weapon-offhand-acquisition-read-only-autonomous.js",
  "utf8",
);

function fixture(overrides = {}) {
  let playing = true;
  const character = {
    name: "My_Merchant",
    id: "merchant-session-1",
    ctype: "merchant",
    level: 58,
    map: "main",
    x: 0,
    y: 0,
    gold: 1_000_000,
    moving: false,
    target: null,
    q: {},
    rip: false,
    dead: false,
    items: Array.from({ length: 42 }, () => null),
    slots: {
      mainhand: { name: "staff", level: 0 },
      offhand: null,
    },
    ...overrides.character,
  };
  if (Array.isArray(overrides.items)) character.items = overrides.items;
  if ("offhand" in overrides) character.slots.offhand = overrides.offhand;
  if ("mainhand" in overrides) character.slots.mainhand = overrides.mainhand;

  const root = {
    character,
    server_region: "EU",
    server_identifier: "I",
    B: { sell_dist: 400 },
    G: {
      items: {
        wshield: {
          type: "shield",
          armor: 40,
          resistance: 15,
          stat: 2,
          g: 4800,
          grades: [7, 9],
        },
        staff: { type: "weapon", wtype: "staff", g: 12400 },
        rod: { type: "weapon", wtype: "rod", g: 1000 },
        ...(overrides.G?.items || {}),
      },
      classes: {
        merchant: {
          mainhand: { mace: {}, staff: {}, bow: {}, spear: {}, short_sword: {}, fist: {}, dartgun: {}, dagger: {} },
          doublehand: { rod: {}, pickaxe: {}, axe: {}, basher: {} },
          offhand: { shield: {}, source: {}, quiver: {}, misc_offhand: {} },
        },
        ...(overrides.G?.classes || {}),
      },
      npcs: {
        basics: {
          name: "Gabriel",
          role: "merchant",
          items: ["helmet", "shoes", "gloves", "pants", "coat", "blade", "claw", "staff", "bow", "wshield", "wand", "mace", "wbasher"],
        },
        ...(overrides.G?.npcs || {}),
      },
      maps: {
        main: {
          items: {
            wshield: [{ x: 0, y: 0 }],
          },
        },
        ...(overrides.G?.maps || {}),
      },
    },
    sounds: {
      empty: {
        cplaying: true,
        playing: () => playing,
      },
    },
    performance_trick: () => { playing = true; },
    simple_distance: (a, b) => Math.hypot(Number(a.x || 0) - Number(b.x || 0), Number(a.y || 0) - Number(b.y || 0)),
    buy_with_gold: async () => {
      throw new Error("read-only package must not call buy_with_gold");
    },
    AIO_V3: {
      operations: {
        status: () => ({ schemaVersion: 1, preserved: true }),
        hostHeartbeat: () => ({ schemaVersion: 1, alive: true }),
      },
    },
  };
  root.parent = root;
  return root;
}

async function execute(overrides = {}) {
  const root = fixture(overrides);
  const sandbox = {
    ...root,
    globalThis: null,
    parent: root,
    setTimeout: fn => setImmediate(fn),
    Promise,
    Date,
    JSON,
    Object,
    Array,
    Number,
    String,
    Math,
  };
  sandbox.globalThis = sandbox;
  sandbox.parent = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: "pr20-7-acquisition-read-only.js" });

  for (let i = 0; i < 1000; i += 1) {
    await new Promise(resolve => setImmediate(resolve));
    const status = sandbox.V5PR207WeaponOffhandAcquisitionReadOnly?.status?.();
    if (status?.terminal) return { status, sandbox };
  }
  throw new Error("acquisition read-only preflight did not terminate");
}

test("wshield source preflight is stable, merchant-only and zero-write", async () => {
  const { status, sandbox } = await execute();
  assert.equal(status.status, "BESTANDEN");
  assert.equal(status.phase, "ACQUISITION_SOURCE_READY");
  assert.equal(status.terminal, true);
  assert.equal(status.evidence.recipient.characterName, "My_Merchant");
  assert.equal(status.evidence.recipient.serverRegion, "EU");
  assert.equal(status.evidence.recipient.serverIdentifier, "I");
  assert.equal(status.evidence.candidate.itemName, "wshield");
  assert.equal(status.evidence.candidate.displayName, "Wooden Shield");
  assert.equal(status.evidence.candidate.targetSlot, "offhand");
  assert.equal(status.evidence.candidate.type, "shield");
  assert.equal(status.evidence.candidate.unitPrice, 4800);
  assert.equal(status.evidence.candidate.totalPrice, 4800);
  assert.equal(status.evidence.candidate.vendorId, "basics");
  assert.equal(status.evidence.candidate.vendorName, "Gabriel");
  assert.equal(status.evidence.candidate.currentOffhand, null);
  assert.equal(status.evidence.candidate.currentMainhand.name, "staff");
  assert.equal(status.evidence.acquisition.route, "GOLD_ONLY_NPC");
  assert.equal(status.evidence.acquisition.publicFunction, "buy_with_gold");
  assert.equal(status.evidence.acquisition.publicFunctionAvailable, true);
  assert.equal(status.evidence.acquisition.vendorReachableNow, true);
  assert.equal(status.evidence.acquisition.goldBudgetLedgerReservationRequired, true);
  assert.equal(status.evidence.acquisition.goldBudgetLedgerReservationSatisfied, false);
  assert.equal(status.evidence.acquisition.purchaseAuthority, false);
  assert.equal(status.evidence.stableDoubleObservation, true);
  assert.equal(status.evidence.performanceTrick.active, true);
  assert.equal(status.evidence.sourceCandidateRatifiedOnly, true);
  assert.equal(status.evidence.purchaseStillRequiresDurableIntentAndOneShotAuthority, true);
  assert.equal(status.evidence.equipStillSeparateMutation, true);
  assert.equal(status.gameplayWrites, 0);
  assert.equal(status.publicFunctionCalls, 0);
  assert.equal(status.rawWriteCalls, 0);
  assert.equal(status.startCalls, 0);
  assert.equal(status.disconnectCalls, 0);
  assert.equal(status.sameIntentRetry, false);
  assert.equal(status.normalRuntimeAllowed, false);
  assert.equal(status.authority.purchaseAuthority, false);

  const envelope = sandbox.AIO_V3.operations.status();
  assert.equal(envelope.preserved, true);
  assert.equal(envelope.v5AutonomousTest.testId, "pr20-7-gear-weapon-offhand-acquisition-read-only-preflight");
});

test("occupied offhand fails closed before any acquisition authority", async () => {
  const { status } = await execute({ offhand: { name: "wshield", level: 0 } });
  assert.equal(status.status, "BLOCKIERT");
  assert.deepEqual(Array.from(status.blocker), ["PR20_7_ACQUISITION_OFFHAND_NICHT_LEER"]);
  assert.equal(status.gameplayWrites, 0);
  assert.equal(status.rawWriteCalls, 0);
  assert.equal(status.authority.purchaseAuthority, false);
});

test("doublehand mainhand blocks shield acquisition plan", async () => {
  const { status } = await execute({ mainhand: { name: "rod", level: 0 } });
  assert.equal(status.status, "BLOCKIERT");
  assert.deepEqual(Array.from(status.blocker), ["PR20_7_ACQUISITION_DOUBLEHAND_KONFLIKT"]);
  assert.equal(status.publicFunctionCalls, 0);
});

test("insufficient base gold fails closed even before budget reservation", async () => {
  const { status } = await execute({
    character: {
      gold: 4799,
    },
  });
  assert.equal(status.status, "BLOCKIERT");
  assert.deepEqual(Array.from(status.blocker), ["PR20_7_ACQUISITION_GOLD_UNTER_BASISKOSTEN"]);
  assert.equal(status.gameplayWrites, 0);
});

test("existing wshield redirects back to gear re-observation instead of buying another", async () => {
  const items = Array.from({ length: 42 }, () => null);
  items[3] = { name: "wshield", level: 0 };
  const { status } = await execute({ items });
  assert.equal(status.status, "BLOCKIERT");
  assert.deepEqual(
    Array.from(status.blocker),
    ["PR20_7_ACQUISITION_ITEM_BEREITS_VORHANDEN_REOBSERVE_GEAR"],
  );
});

test("read-only acquisition package contains no mutation bypass", () => {
  for (const forbidden of [
    "buy_with_gold(",
    "buy(",
    "equip(",
    "unequip(",
    "sell(",
    "send_item(",
    "send_gold(",
    "start_character(",
    "command_character(",
    "use_skill(",
    "api_call(",
    "socket.emit(",
    ".socket.emit(",
    "/disconnect ",
  ]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
  assert.ok(source.includes("gameplayWrites: 0"));
  assert.ok(source.includes("publicFunctionCalls: 0"));
  assert.ok(source.includes("rawWriteCalls: 0"));
  assert.ok(source.includes("purchaseAuthority: false"));
  assert.ok(source.includes("goldBudgetLedgerReservationRequired: true"));
  assert.ok(source.includes("goldBudgetLedgerReservationSatisfied: false"));
  assert.ok(source.includes("normalRuntimeAllowed: false"));
});
