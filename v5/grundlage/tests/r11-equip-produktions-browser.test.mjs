import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  ProduktionsCdpEquipAdapter,
  validiereProduktionsEquipRuhezustand,
  waehleProduktionsEquipKandidat,
} from "../../werkzeuge/equipment-equip-produktions-browser.mjs";

function beobachtung(overrides = {}) {
  return {
    charakterName: "Merchant",
    ctype: "merchant",
    rip: false,
    bewegtSich: false,
    zielName: null,
    feindeAufCharakter: 0,
    alternativeRuntimeAktiv: false,
    inventar: [{
      index: 2,
      name: "helmet1",
      level: 0,
      gesperrt: false,
      typ: "helmet",
    }, {
      index: 4,
      name: "sword1",
      level: 0,
      gesperrt: false,
      typ: "weapon",
    }],
    slots: {
      cape: null,
      belt: null,
      amulet: null,
      orb: null,
      helmet: null,
      gloves: null,
      shoes: null,
      pants: null,
      chest: null,
    },
    ...overrides,
  };
}

test("Produktions-Equip-Auswahl nimmt nur unlocked Nicht-Waffe in leeren Slot", () => {
  const b = beobachtung();
  assert.deepEqual(validiereProduktionsEquipRuhezustand(b), []);

  const kandidat = waehleProduktionsEquipKandidat(b);
  assert.deepEqual(kandidat, {
    index: 2,
    itemName: "helmet1",
    itemLevel: 0,
    slot: "helmet",
    vorherigesSlotItem: null,
  });
});

test("Produktions-Equip blockiert Nicht-Merchant Alternative Runtime und belegten Zielslot", () => {
  assert.deepEqual(
    validiereProduktionsEquipRuhezustand(beobachtung({ ctype: "warrior" })),
    ["MERCHANT_ERFORDERLICH"],
  );
  assert.deepEqual(
    validiereProduktionsEquipRuhezustand(beobachtung({
      alternativeRuntimeAktiv: true,
    })),
    ["ALTERNATIVE_RUNTIME_AKTIV"],
  );
  assert.equal(
    waehleProduktionsEquipKandidat(beobachtung({
      slots: {
        ...beobachtung().slots,
        helmet: { name: "oldhat", level: 0 },
      },
    })),
    null,
  );
});

test("Produktions-CDP-Adapter besitzt exakt einen Write-Aufruf pro Instanz", async () => {
  let evaluateCalls = 0;
  const session = {
    async evaluate(source) {
      evaluateCalls += 1;
      assert.match(source, /root\.equip\(/);
      return { sent: true, result: null };
    },
  };
  const kandidat = waehleProduktionsEquipKandidat(beobachtung());
  assert.ok(kandidat);
  const adapter = new ProduktionsCdpEquipAdapter(session, 1, kandidat);

  const result = await adapter.sende(null, {
    index: kandidat.index,
    slot: kandidat.slot,
    itemName: kandidat.itemName,
    itemLevel: kandidat.itemLevel,
  });
  assert.equal(result.art, "SERVER_ERGEBNIS");
  assert.equal(adapter.adapterAufrufe, 1);
  assert.equal(adapter.gameWrites, 1);
  assert.equal(evaluateCalls, 1);

  await assert.rejects(
    () => adapter.sende(null, {
      index: kandidat.index,
      slot: kandidat.slot,
      itemName: kandidat.itemName,
      itemLevel: kandidat.itemLevel,
    }),
    /EQUIP_PROD_MEHR_ALS_EIN_ADAPTER_AUFRUF/,
  );
  assert.equal(evaluateCalls, 1);
});

test("Produktions-Browserdatei enthaelt nur den expliziten Equip-Gameplay-Write", () => {
  const source = fs.readFileSync(
    new URL("../../werkzeuge/equipment-equip-produktions-browser.mjs", import.meta.url),
    "utf8",
  );
  const equipWrites = source.match(/root\.equip\s*\(/g) ?? [];
  assert.equal(equipWrites.length, 1);

  for (const verboten of [
    /\battack\s*\(/,
    /\bmove\s*\(/,
    /\bsmart_move\s*\(/,
    /\buse_skill\s*\(/,
    /\bbank_store\s*\(/,
    /\bbank_retrieve\s*\(/,
    /\bbuy\s*\(/,
    /\bsell\s*\(/,
    /\bexchange\s*\(/,
    /\bcraft\s*\(/,
    /\bupgrade\s*\(/,
    /\bcompound\s*\(/,
    /\bsend_item\s*\(/,
    /\bsend_gold\s*\(/,
    /\.emit\s*\(/,
  ]) {
    assert.equal(verboten.test(source), false, String(verboten));
  }
});
