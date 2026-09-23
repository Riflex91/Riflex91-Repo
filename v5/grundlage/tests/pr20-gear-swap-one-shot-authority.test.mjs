import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  erstellePr207GearSwapOneShotAuthority,
  pruefePr207GearSwapVorbereitung,
} from "../../erzeugt/index.js";

function bindung(overrides = {}) {
  return {
    schemaVersion: 1,
    accountId: "account-1",
    characterId: "My_Merchant",
    sessionId: "merchant-session-1",
    serverRegion: "EU",
    serverIdentifier: "I",
    rosterEpoche: 11,
    rosterFingerprint: "roster-fp-11",
    ...overrides,
  };
}

function item(id, overrides = {}) {
  return {
    name: id,
    level: 1,
    physischeKennung: "physical:" + id,
    beobachtungsFingerprint: "fp:" + id,
    physisch: true,
    gesperrt: false,
    virtuellB: false,
    ...overrides,
  };
}

function plan() {
  const prep = pruefePr207GearSwapVorbereitung({
    schemaVersion: 1,
    evidenceId: "gear-swap-evidence-1",
    recipient: bindung(),
    merchantAccountId: "account-1",
    slot: "helmet",
    kandidatIndex: 7,
    kandidat: item("wcap"),
    vorherigesSlotItem: item("partyhat"),
    kompatibel: true,
    contentVerifiziert: true,
    dispositionErlaubt: true,
    beobachtetAmMs: 1_000,
    gueltigBisMs: 2_000,
    maximalesEvidenceAlterMs: 1_000,
    restInventarFingerprint: "rest-inv",
    restEquipmentFingerprint: "rest-equip",
    evidenceFingerprint: "evidence-fp",
  }, 1_100);
  assert.ok(prep.plan);
  return prep.plan;
}

function authority(overrides = {}) {
  return erstellePr207GearSwapOneShotAuthority({
    schemaVersion: 1,
    aktivierungsId: "pr20-7-one-shot-1",
    transaktionsId: "pr20-7-swap-tx-1",
    plan: plan(),
    ausgestelltAmMs: 1_200,
    gueltigBisMs: 2_200,
    equipmentFenceEpoche: 41,
    inventoryFenceEpoche: 73,
    ...overrides,
  });
}

test("PR20.7 One-Shot bindet Recipient, Slot, Index, Prestate und beide Fences", () => {
  const a = authority();
  const d = a.daten();
  assert.equal(d.maximaleVerwendungen, 1);
  assert.equal(d.recipientCharacterId, "My_Merchant");
  assert.equal(d.recipientSessionId, "merchant-session-1");
  assert.equal(d.slot, "helmet");
  assert.equal(d.kandidatIndex, 7);
  assert.equal(d.resourceClaims.length, 2);
  assert.deepEqual(
    d.resourceClaims.map(x => [x.ressourcenId, x.art, x.epoche]),
    [
      ["character:My_Merchant:equipment", "EXKLUSIV", 41],
      ["character:My_Merchant:inventory", "EXKLUSIV", 73],
    ],
  );
  assert.equal(d.gameplayAutoritaet, false);
  assert.equal(d.rawWriteAutoritaet, false);
  assert.equal(d.swapWriteRatification, false);
});

test("PR20.7 One-Shot ist kurzlebig und genau einmal pruefbar", () => {
  const a = authority();
  assert.equal(a.gueltigFuer(1_500), true);
  const first = a.pruefeExakteBindung(plan(), 1_500, 41, 73);
  assert.equal(first.erlaubt, true);
  assert.equal(first.verbraucht, true);
  assert.equal(first.gameplayAutoritaet, false);
  assert.equal(a.verbraucht(), true);
  assert.equal(a.gueltigFuer(1_501), false);
  const second = a.pruefeExakteBindung(plan(), 1_501, 41, 73);
  assert.equal(second.erlaubt, false);
});

test("PR20.7 One-Shot widerruft bei Session-, Slot-, Index- oder Fence-Drift", () => {
  const cases = [
    {
      mutate: p => ({
        ...p,
        recipient: { ...p.recipient, sessionId: "other-session" },
      }),
      equipment: 41,
      inventory: 73,
    },
    {
      mutate: p => ({ ...p, slot: "cape" }),
      equipment: 41,
      inventory: 73,
    },
    {
      mutate: p => ({ ...p, kandidatIndex: 8 }),
      equipment: 41,
      inventory: 73,
    },
    {
      mutate: p => p,
      equipment: 42,
      inventory: 73,
    },
    {
      mutate: p => p,
      equipment: 41,
      inventory: 74,
    },
  ];
  for (const row of cases) {
    const a = authority();
    const result = a.pruefeExakteBindung(
      row.mutate(plan()),
      1_500,
      row.equipment,
      row.inventory,
    );
    assert.equal(result.erlaubt, false);
    assert.equal(
      result.grund,
      "PR20_7_GEAR_ONE_SHOT_BINDUNG_ODER_FENCE_DRIFT",
    );
    assert.equal(a.gueltigFuer(1_500), false);
  }
});

test("PR20.7 One-Shot blockiert TTL ueber 1500 ms und ungueltige Fences", () => {
  assert.throws(
    () => authority({ gueltigBisMs: 2_701 }),
    /PR20_7_GEAR_ONE_SHOT_TTL_UNGUELTIG/,
  );
  assert.throws(
    () => authority({ equipmentFenceEpoche: 0 }),
    /PR20_7_GEAR_ONE_SHOT_EQUIPMENT_FENCE_UNGUELTIG/,
  );
  assert.throws(
    () => authority({ inventoryFenceEpoche: 0 }),
    /PR20_7_GEAR_ONE_SHOT_INVENTORY_FENCE_UNGUELTIG/,
  );
});

test("PR20.7 One-Shot-Foundation enthaelt keinen Gameplay-Write-Pfad", () => {
  const source = fs.readFileSync(
    "grundlage/quelle/equipment/pr20-7-gear-swap-one-shot-authority.ts",
    "utf8",
  );
  for (const forbidden of [
    ".equip(",
    "unequip(",
    "socket.emit(",
    ".socket.emit(",
    "api_call(",
    "use_skill(",
    "send_item(",
  ]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
  assert.ok(source.includes("gameplayAutoritaet: false"));
  assert.ok(source.includes("rawWriteAutoritaet: false"));
  assert.ok(source.includes("swapWriteRatification: false"));
});
