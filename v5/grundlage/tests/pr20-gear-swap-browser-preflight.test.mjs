import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  PR20_7_GEAR_BROWSER_GAMEPLAY_WRITES,
  PR20_7_GEAR_BROWSER_READ_ONLY,
  pr207GearPrestateFingerprint,
  validierePr207GearRecipientBeobachtung,
  waehlePr207GearOccupiedCandidate,
} from "../../werkzeuge/pr20-7-gear-swap-produktions-browser.mjs";

function material(name, level = 0, extra = {}) {
  return JSON.stringify({ name, level, ...extra });
}

function observation(overrides = {}) {
  const base = {
    status: "OK",
    accountId: "account-1",
    charakterName: "My_Ranger1",
    sessionId: "ranger-session-1",
    ctype: "ranger",
    characterLevel: 80,
    map: "main",
    serverRegion: "EU",
    serverIdentifier: "I",
    rip: false,
    bewegtSich: false,
    zielName: null,
    feindeAufCharakter: 0,
    queueAktiv: false,
    alternativeRuntimeAktiv: false,
    inventar: [{
      index: 4,
      itemMaterial: material("helmet-new", 2, { rid: "new-rid" }),
      name: "helmet-new",
      level: 2,
      typ: "helmet",
      gesperrt: false,
      virtuellB: false,
    }],
    slots: {
      cape: null,
      belt: null,
      amulet: null,
      orb: null,
      helmet: {
        slot: "helmet",
        itemMaterial: material("helmet-old", 1, { rid: "old-rid" }),
        name: "helmet-old",
        level: 1,
        typ: "helmet",
        gesperrt: false,
        virtuellB: false,
      },
      gloves: null,
      shoes: null,
      pants: null,
      chest: null,
    },
  };
  return {
    ...base,
    ...overrides,
    slots: overrides.slots ?? base.slots,
    inventar: overrides.inventar ?? base.inventar,
  };
}

test("PR20.7 Browser-Preflight ist strikt no-write", () => {
  assert.equal(PR20_7_GEAR_BROWSER_READ_ONLY, true);
  assert.equal(PR20_7_GEAR_BROWSER_GAMEPLAY_WRITES, 0);

  const forbidden = [
    ["root", ".", "equip", "("],
    [".", "equip", "("],
    ["un", "equip", "("],
    ["socket", ".", "emit", "("],
    ["api", "_", "call", "("],
    ["use", "_", "skill", "("],
    ["send", "_", "item", "("],
    ["bank", "_", "store", "("],
    ["bank", "_", "retrieve", "("],
  ].map(parts => parts.join(""));

  for (const file of [
    "werkzeuge/pr20-7-gear-swap-produktions-browser.mjs",
    "werkzeuge/pr20-7-gear-swap-produktions-preflight.mjs",
  ]) {
    const source = fs.readFileSync(file, "utf8");
    for (const marker of forbidden) {
      assert.equal(source.includes(marker), false, file + ":" + marker);
    }
  }

  const runner = fs.readFileSync(
    "werkzeuge/pr20-7-gear-swap-produktions-preflight.mjs",
    "utf8",
  );
  assert.ok(runner.includes("aktiviereUndVerifiziereBrowserPerformanceTrick"));
  assert.ok(runner.includes("browserGameplayWrites: 0"));
  assert.ok(runner.includes("authorityAusgestellt: false"));
  assert.ok(runner.includes("durableIntentErzeugt: false"));
  assert.ok(runner.includes("normalRuntimeAllowed: false"));
  assert.ok(runner.includes("rev-parse"));
});

test("PR20.7 waehlt nur einen belegten sicheren Nicht-Waffen-Slot", () => {
  const b = validierePr207GearRecipientBeobachtung(observation());
  const candidate = waehlePr207GearOccupiedCandidate(b);
  assert.ok(candidate);
  assert.equal(candidate.slot, "helmet");
  assert.equal(candidate.kandidatIndex, 4);
  assert.equal(candidate.kandidat.name, "helmet-new");
  assert.equal(candidate.vorherigesSlotItem.name, "helmet-old");
  assert.equal(candidate.kandidat.gesperrt, false);
  assert.equal(candidate.vorherigesSlotItem.virtuellB, false);
  assert.equal(candidate.gameplayAutoritaet, false);
  assert.equal(candidate.rawWriteAutoritaet, false);
  assert.notEqual(
    candidate.kandidat.beobachtungsFingerprint,
    candidate.vorherigesSlotItem.beobachtungsFingerprint,
  );
  assert.match(pr207GearPrestateFingerprint(b, candidate), /^[0-9a-f]{64}$/);
});

test("PR20.7 blockiert leere, gesperrte, virtuelle und unklare Swaps", () => {
  assert.equal(waehlePr207GearOccupiedCandidate(observation({
    slots: { ...observation().slots, helmet: null },
  })), null);

  assert.equal(waehlePr207GearOccupiedCandidate(observation({
    inventar: [{ ...observation().inventar[0], gesperrt: true }],
  })), null);

  assert.equal(waehlePr207GearOccupiedCandidate(observation({
    slots: {
      ...observation().slots,
      helmet: { ...observation().slots.helmet, gesperrt: true },
    },
  })), null);

  assert.equal(waehlePr207GearOccupiedCandidate(observation({
    slots: {
      ...observation().slots,
      helmet: { ...observation().slots.helmet, virtuellB: true },
    },
  })), null);

  const sameMaterial = material("same-helmet", 1, { rid: "same-rid" });
  assert.equal(waehlePr207GearOccupiedCandidate(observation({
    inventar: [{
      index: 4,
      itemMaterial: sameMaterial,
      name: "same-helmet",
      level: 1,
      typ: "helmet",
      gesperrt: false,
      virtuellB: false,
    }],
    slots: {
      ...observation().slots,
      helmet: {
        slot: "helmet",
        itemMaterial: sameMaterial,
        name: "same-helmet",
        level: 1,
        typ: "helmet",
        gesperrt: false,
        virtuellB: false,
      },
    },
  })), null);
});

test("PR20.7 blockiert instabile Recipient-Zustaende fail-closed", () => {
  for (const override of [
    { rip: true },
    { bewegtSich: true },
    { zielName: "goo" },
    { feindeAufCharakter: 1 },
    { queueAktiv: true },
    { alternativeRuntimeAktiv: true },
    { accountId: "" },
    { sessionId: "" },
    { serverRegion: "" },
    { serverIdentifier: "" },
  ]) {
    assert.throws(
      () => validierePr207GearRecipientBeobachtung(observation(override)),
    );
  }
});

test("PR20.7 bindet Kandidat exakt an Slot und Inventarindex", () => {
  assert.ok(waehlePr207GearOccupiedCandidate(
    observation(),
    { inventoryIndex: 4, slot: "helmet" },
  ));
  assert.equal(
    waehlePr207GearOccupiedCandidate(
      observation(),
      { inventoryIndex: 5, slot: "helmet" },
    ),
    null,
  );
  assert.throws(
    () => waehlePr207GearOccupiedCandidate(
      observation(),
      { inventoryIndex: 4, slot: "mainhand" },
    ),
    /SLOT_FILTER_UNGUELTIG/,
  );
});
