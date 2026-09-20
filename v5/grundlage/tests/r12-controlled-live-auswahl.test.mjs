import test from "node:test";
import assert from "node:assert/strict";

import {
  validiereControlledLiveRuhezustand,
  waehleControlledLiveEquipKandidat,
} from "../../erzeugt/index.js";

function beobachtung(overrides = {}) {
  return {
    charakterName: "My_Warrior",
    rip: false,
    bewegtSich: false,
    zielName: null,
    feindeAufCharakter: 0,
    alternativeRuntimeAktiv: false,
    inventar: [
      { index: 0, name: "helmet1", level: 1, gesperrt: false, typ: "helmet" },
      { index: 1, name: "sword1", level: 1, gesperrt: false, typ: "weapon" },
    ],
    slots: {
      helmet: null,
      chest: { name: "coat1", level: 0 },
    },
    ...overrides,
  };
}

test("Controlled-Live-Auswahl bevorzugt eindeutigen leeren Nicht-Waffen-Slot", () => {
  const kandidat = waehleControlledLiveEquipKandidat(beobachtung());
  assert.deepEqual(kandidat, {
    index: 0,
    itemName: "helmet1",
    itemLevel: 1,
    slot: "helmet",
    slotWarLeer: true,
    vorherigesSlotItem: null,
  });
});

test("Waffen und mehrdeutige Typen werden fuer R12 nicht ausgewaehlt", () => {
  const kandidat = waehleControlledLiveEquipKandidat(beobachtung({
    inventar: [
      { index: 0, name: "sword", level: 0, gesperrt: false, typ: "weapon" },
      { index: 1, name: "ring", level: 0, gesperrt: false, typ: "ring" },
      { index: 2, name: "earring", level: 0, gesperrt: false, typ: "earring" },
    ],
  }));
  assert.equal(kandidat, null);
});

test("Bewegung Ziel Aggro Tod und parallele Runtime blockieren die Auswahl", () => {
  for (const delta of [
    { bewegtSich: true },
    { zielName: "goo" },
    { feindeAufCharakter: 1 },
    { rip: true },
    { alternativeRuntimeAktiv: true },
  ]) {
    assert.equal(waehleControlledLiveEquipKandidat(beobachtung(delta)), null);
    assert.ok(validiereControlledLiveRuhezustand(beobachtung(delta)).length > 0);
  }
});

test("gesperrte Inventory-Items werden nicht ausgewaehlt", () => {
  assert.equal(waehleControlledLiveEquipKandidat(beobachtung({
    inventar: [{ index: 0, name: "helmet1", level: 1, gesperrt: true, typ: "helmet" }],
  })), null);
});
