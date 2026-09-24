import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(
  "werkzeuge/pr20-8-wertmutation-live-candidate-readonly-v1-0-4.js",
  "utf8",
);

function defs() {
  return {
    gloves: { type:"gloves", g:3400, scroll:true, upgrade:{}, grades:[7,9] },
    scroll0: { type:"scroll", g:1000 },
    ringsj: { type:"ring", g:24000, compound:{ int:1 }, grades:[3,4] },
    cscroll0: { type:"scroll", g:1000 },
    gem1: { type:"gem", g:24000, e:1 },
    anniversarygift: { type:"gem", g:100, e:1, exclusive:true },
    sixcake: { type:"gem", g:100, e:1 },
    expensive: { type:"gloves", g:999999, upgrade:{} },
  };
}

function sandbox(items, overrides = {}) {
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
    setTimeout: fn => setImmediate(fn),
    clearTimeout: () => {},
    performance_trick() {},
    sounds: {
      empty: {
        cplaying: true,
        playing: () => true,
      },
    },
    server_region: "EU",
    server_identifier: "I",
    character: {
      name: "My_Merchant",
      id: "My_Merchant",
      ctype: "merchant",
      level: 80,
      map: "main",
      moving: false,
      target: null,
      q: {},
      items,
      ...overrides.character,
    },
    G: {
      items: defs(),
      ...overrides.G,
    },
    ...overrides.root,
  };
  box.parent = box;
  return box;
}

async function run(box) {
  vm.createContext(box);
  vm.runInContext(source, box, {
    filename: "pr20-8-wertmutation-live-candidate-readonly-v1-0-4.js",
  });
  for (let i = 0; i < 20; i += 1) {
    await new Promise(resolve => setImmediate(resolve));
    const status = box.V5PR208ValueMutationLiveCandidateReadonly?.status?.();
    if (status?.terminal) return status;
  }
  throw new Error("TEST_DID_NOT_TERMINATE");
}

test("PR20.8 candidate scanner v1.0.4 exposes bridge observability synchronously", () => {
  const box = sandbox([
    { name:"gloves", level:0 },
    { name:"scroll0", q:1 },
  ]);
  vm.createContext(box);
  vm.runInContext(source, box, {
    filename: "pr20-8-wertmutation-live-candidate-readonly-v1-0-4.js",
  });

  const facade = box.AIO_V3?.operations?.status?.()?.v5AutonomousTest;
  assert.ok(facade);
  assert.equal(facade.testId, "pr20-8-wertmutation-live-candidate-readonly");
  assert.equal(facade.version, "1.0.4");
  assert.equal(facade.status, "BOOT");
  assert.equal(facade.terminal, false);
  assert.equal(facade.gameplayWrites, 0);
  assert.equal(facade.publicFunctionCalls, 0);
  assert.equal(facade.rawWriteCalls, 0);
  assert.equal(facade.normalRuntimeAllowed, false);

  const api = box.V5PR208ValueMutationLiveCandidateReadonly;
  assert.equal(api?.testId, "pr20-8-wertmutation-live-candidate-readonly");
  assert.equal(api?.version, "1.0.4");
});

test("PR20.8 candidate scanner v1.0.4 exposes bridge observability without G/items root", () => {
  const box = sandbox(
    [{ name:"gloves", level:0 }, { name:"scroll0", q:1 }],
    { root:{ G:undefined } },
  );
  vm.createContext(box);
  vm.runInContext(source, box, {
    filename: "pr20-8-wertmutation-live-candidate-readonly-v1-0-4.js",
  });

  const facade = box.AIO_V3?.operations?.status?.()?.v5AutonomousTest;
  assert.ok(facade);
  assert.equal(facade.testId, "pr20-8-wertmutation-live-candidate-readonly");
  assert.equal(facade.version, "1.0.4");
  assert.equal(facade.status, "BOOT");
  assert.equal(facade.terminal, false);
  assert.equal(facade.gameplayWrites, 0);
  assert.equal(facade.publicFunctionCalls, 0);
  assert.equal(facade.rawWriteCalls, 0);

  const api = box.V5PR208ValueMutationLiveCandidateReadonly;
  assert.equal(api?.testId, "pr20-8-wertmutation-live-candidate-readonly");
  assert.equal(api?.version, "1.0.4");
});

test("PR20.8 live candidate discovery findet alle drei einfachen Normalfamilien read-only", async () => {
  const status = await run(sandbox([
    { name:"gloves", level:0 },
    { name:"scroll0", q:4 },
    { name:"ringsj", level:0 },
    { name:"ringsj", level:0 },
    { name:"ringsj", level:0 },
    { name:"cscroll0", q:3 },
    { name:"gem1", q:2 },
  ]));
  assert.equal(status.status, "BESTANDEN");
  assert.equal(status.phase, "COMPLETE");
  assert.equal(status.observations.UPGRADE.status, "KANDIDAT_GEFUNDEN");
  assert.equal(status.observations.COMPOUND.status, "KANDIDAT_GEFUNDEN");
  assert.equal(status.observations.EXCHANGE.status, "KANDIDAT_GEFUNDEN");

  assert.equal(status.selectedCandidates.UPGRADE.candidate.name, "gloves");
  assert.equal(status.selectedCandidates.UPGRADE.scroll.name, "scroll0");
  assert.equal(status.selectedCandidates.UPGRADE.offering, null);
  assert.equal(status.selectedCandidates.UPGRADE.normalPathOnly, true);

  assert.equal(status.selectedCandidates.COMPOUND.candidates.length, 3);
  assert.deepEqual(
    status.selectedCandidates.COMPOUND.candidates.map(x => x.index),
    [2,3,4],
  );
  assert.equal(status.selectedCandidates.COMPOUND.scroll.name, "cscroll0");
  assert.equal(status.selectedCandidates.COMPOUND.offering, null);

  assert.equal(status.selectedCandidates.EXCHANGE.candidate.name, "gem1");
  assert.equal(status.selectedCandidates.EXCHANGE.exchangeQuantity, 1);
  assert.equal(status.selectedCandidates.EXCHANGE.massExchangeAllowed, false);
  assert.equal(status.selectedCandidates.EXCHANGE.recursiveDropAuthority, false);
  assert.equal(status.selectedCandidates.EXCHANGE.specialMultiOutputAuthority, false);
  assert.equal(
    status.selectedCandidates.EXCHANGE.fullRewardDomainReconciliationRequired,
    true,
  );

  assert.equal(status.gameplayWrites, 0);
  assert.equal(status.publicFunctionCalls, 0);
  assert.equal(status.rawWriteCalls, 0);
  assert.equal(status.sameIntentRetry, false);
  assert.equal(status.normalRuntimeAllowed, false);
  assert.equal(status.authority.authorityIssued, false);
  assert.equal(status.authority.durableIntentCreated, false);
  assert.equal(status.authority.upgradeAuthority, false);
  assert.equal(status.authority.compoundAuthority, false);
  assert.equal(status.authority.exchangeAuthority, false);
});

test("PR20.8 Remaining-Family-Rescan blockiert wenn nur Upgrade vorhanden ist", async () => {
  const status = await run(sandbox([
    { name:"gloves", level:0 },
    { name:"scroll0", q:1 },
  ]));
  assert.equal(status.status, "BLOCKIERT");
  assert.deepEqual(
    status.blocker,
    ["PR20_8_CANDIDATE_KEIN_COMPOUND_ODER_EXCHANGE_NORMALKANDIDAT"],
  );
  assert.equal(status.observations.UPGRADE.status, "KANDIDAT_GEFUNDEN");
  assert.equal(status.observations.COMPOUND.status, "KEIN_KANDIDAT");
  assert.equal(status.observations.EXCHANGE.status, "KEIN_KANDIDAT");
  assert.ok(status.selectedCandidates.UPGRADE);
  assert.equal(status.selectedCandidates.COMPOUND, null);
  assert.equal(status.selectedCandidates.EXCHANGE, null);
});

test("PR20.8 Discovery blockiert wenn q nicht frei ist", async () => {
  const status = await run(sandbox(
    [
      { name:"gloves", level:0 },
      { name:"scroll0", q:1 },
    ],
    { character:{ q:{ upgrade:{ ms:500 } } } },
  ));
  assert.equal(status.status, "BLOCKIERT");
  assert.deepEqual(status.blocker, ["PR20_8_CANDIDATE_Q_NICHT_FREI"]);
  assert.equal(status.gameplayWrites, 0);
  assert.equal(status.rawWriteCalls, 0);
  assert.equal(status.authority.authorityIssued, false);
});

test("PR20.8 Discovery schliesst Event Exclusive und spezielle Exchange-Pfade aus", async () => {
  const status = await run(sandbox([
    { name:"anniversarygift", q:5 },
    { name:"sixcake", q:2 },
    { name:"gloves", level:0 },
    { name:"scroll0", q:1 },
  ]));
  assert.equal(status.status, "BLOCKIERT");
  assert.deepEqual(
    status.blocker,
    ["PR20_8_CANDIDATE_KEIN_COMPOUND_ODER_EXCHANGE_NORMALKANDIDAT"],
  );
  assert.equal(status.observations.EXCHANGE.status, "KEIN_KANDIDAT");
  assert.ok(status.observations.EXCHANGE.rejected.some(x =>
    x.name === "anniversarygift" && x.reason === "UNSAFE_PHYSICAL_ITEM"));
  assert.ok(status.observations.EXCHANGE.rejected.some(x =>
    x.name === "sixcake" && x.reason === "SPECIAL_MULTI_OUTPUT_EXCLUDED"));
});

test("PR20.8 Discovery beobachtet Upgrade deterministisch ohne Remaining-Family-Erfolg", async () => {
  const status = await run(sandbox([
    { name:"expensive", level:0 },
    { name:"gloves", level:1 },
    { name:"gloves", level:0 },
    { name:"scroll0", q:5 },
  ]));
  assert.equal(status.status, "BLOCKIERT");
  assert.deepEqual(
    status.blocker,
    ["PR20_8_CANDIDATE_KEIN_COMPOUND_ODER_EXCHANGE_NORMALKANDIDAT"],
  );
  assert.equal(status.selectedCandidates.UPGRADE.candidate.name, "gloves");
  assert.equal(status.selectedCandidates.UPGRADE.candidate.level, 0);
  assert.equal(status.selectedCandidates.UPGRADE.candidate.index, 2);
  assert.ok(status.observations.UPGRADE.rejected.some(x =>
    x.name === "expensive" && x.reason === "BASE_VALUE_ABOVE_FIRST_LIVE_CAP"));
});

test("PR20.8 Discovery blockiert wenn kein einfacher normaler Kandidat existiert", async () => {
  const status = await run(sandbox([
    { name:"anniversarygift", q:10 },
    { name:"sixcake", q:10 },
  ]));
  assert.equal(status.status, "BLOCKIERT");
  assert.deepEqual(
    status.blocker,
    ["PR20_8_CANDIDATE_KEIN_COMPOUND_ODER_EXCHANGE_NORMALKANDIDAT"],
  );
  assert.equal(status.selectedCandidates.UPGRADE, null);
  assert.equal(status.selectedCandidates.COMPOUND, null);
  assert.equal(status.selectedCandidates.EXCHANGE, null);
});



test("PR20.8 Remaining-Family-Rescan besteht mit genau einem Compound-Kandidaten", async () => {
  const status = await run(sandbox([
    { name:"ringsj", level:0 },
    { name:"ringsj", level:0 },
    { name:"ringsj", level:0 },
    { name:"cscroll0", q:1 },
  ]));
  assert.equal(status.status, "BESTANDEN");
  assert.equal(status.observations.COMPOUND.status, "KANDIDAT_GEFUNDEN");
  assert.equal(status.observations.EXCHANGE.status, "KEIN_KANDIDAT");
  assert.ok(status.selectedCandidates.COMPOUND);
  assert.equal(status.selectedCandidates.EXCHANGE, null);
});

test("PR20.8 Remaining-Family-Rescan besteht mit genau einem Exchange-Kandidaten", async () => {
  const status = await run(sandbox([
    { name:"gem1", q:2 },
  ]));
  assert.equal(status.status, "BESTANDEN");
  assert.equal(status.observations.COMPOUND.status, "KEIN_KANDIDAT");
  assert.equal(status.observations.EXCHANGE.status, "KANDIDAT_GEFUNDEN");
  assert.equal(status.selectedCandidates.COMPOUND, null);
  assert.ok(status.selectedCandidates.EXCHANGE);
});
test("PR20.8 Live-Candidate-Paket enthaelt keinen mutierenden Gameplay-Pfad", () => {
  for (const marker of [
    "upgrade(",
    "compound(",
    "exchange(",
    "buy(",
    "buy_with_gold(",
    "send_item(",
    "send_gold(",
    "start_character(",
    "command_character(",
    "use_skill(",
    "equip(",
    "unequip(",
    "api_call(",
    "socket.emit(",
    ".socket.emit(",
  ]) assert.equal(source.includes(marker), false, marker);

  for (const marker of [
    "gameplayWrites: 0",
    "publicFunctionCalls: 0",
    "rawWriteCalls: 0",
    "sameIntentRetry: false",
    "normalRuntimeAllowed: false",
    "authorityIssued: false",
    "durableIntentCreated: false",
    "upgradeAuthority: false",
    "compoundAuthority: false",
    "exchangeAuthority: false",
    "exactPhysicalIndexMustBeReresolvedBeforeSend:true",
    "exactPhysicalIndexesMustBeReresolvedBeforeSend:true",
  ]) assert.ok(source.includes(marker), marker);
});
