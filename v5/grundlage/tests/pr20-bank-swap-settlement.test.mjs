import test from "node:test";
import assert from "node:assert/strict";

import {
  pruefeBankSwapBereitschaft,
  pruefeBankSwapSettlement,
  waehleBankSwapErstenKandidaten,
} from "../../erzeugt/index.js";

const fp = c => String(c).repeat(64).slice(0, 64);

function bindung(overrides = {}) {
  return {
    schemaVersion: 1,
    characterId: "Merchant",
    sessionId: "session-1",
    serverRegion: "EU",
    serverKennung: "I",
    leaseEpoche: 7,
    mountEpoche: 1000,
    beobachtetAmMs: 1000,
    bankPack: "items0",
    slotA: 2,
    slotB: 9,
    slotAItem: { name: "helmet", fingerprint: fp("a") },
    slotBItem: { name: "shoes", fingerprint: fp("b") },
    packRestFingerprint: fp("c"),
    inventoryFingerprint: fp("d"),
    characterGold: 100,
    bankGold: 200,
    fingerprint: fp("e"),
    ...overrides,
  };
}

test("Bank-Swap erster Kandidat verlangt zwei belegte verschieden benannte Slots", () => {
  const kandidat = waehleBankSwapErstenKandidaten([
    { pack: "items0", slots: [
      { name: "hpot0", fingerprint: fp("1") },
      { name: "hpot0", fingerprint: fp("2") },
      null,
      { name: "helmet", fingerprint: fp("3") },
    ] },
  ]);
  assert.ok(kandidat);
  assert.equal(kandidat.a, 0);
  assert.equal(kandidat.b, 3);
  assert.equal(kandidat.itemA.name, "hpot0");
  assert.equal(kandidat.itemB.name, "helmet");
  assert.equal(kandidat.stackMergeDurchNamensgleichheitAusgeschlossen, true);
});

test("Bank-Swap Bereitschaft blockiert Stack-Merge-Risiko und nicht-idle Zustand", () => {
  const r = pruefeBankSwapBereitschaft({
    schemaVersion: 1,
    ctype: "merchant",
    lebt: true,
    idle: false,
    bankGemountet: true,
    alternativeRuntimeAktiv: false,
    offeneBankTransaktion: false,
    evidenceFrisch: true,
    bindung: bindung({
      slotBItem: { name: "helmet", fingerprint: fp("f") },
    }),
  });
  assert.equal(r.status, "BLOCKIERT");
  assert.ok(r.gruende.includes("BANK_SWAP_CHARACTER_NICHT_IDLE"));
  assert.ok(r.gruende.includes("BANK_SWAP_ERSTER_KANDIDAT_NAMENSGLEICH_STACK_RISIKO"));
  assert.equal(r.sameIntentErneutSenden, false);
});

test("Bank-Swap Settlement bestaetigt nur exakten Zwei-Slot-Tausch", () => {
  const vorher = bindung();
  const nachher = bindung({
    beobachtetAmMs: 1001,
    slotAItem: vorher.slotBItem,
    slotBItem: vorher.slotAItem,
    fingerprint: fp("f"),
  });
  const r = pruefeBankSwapSettlement(vorher, nachher);
  assert.equal(r.status, "BESTAETIGT");
  assert.equal(r.grund, "BANK_SWAP_EXAKTER_ZWEI_SLOT_TAUSCH");
  assert.equal(r.slotAGetauscht, true);
  assert.equal(r.slotBGetauscht, true);
  assert.equal(r.sameIntentErneutSenden, false);
});

test("Bank-Swap unveraenderter frischer Zustand bleibt OFFEN und wird nie blind erneut gesendet", () => {
  const vorher = bindung();
  const r = pruefeBankSwapSettlement(vorher, bindung({ beobachtetAmMs: 1001 }));
  assert.equal(r.status, "OFFEN");
  assert.equal(r.sameIntentErneutSenden, false);
});

test("Bank-Swap Settlement erkennt Inventory-, Gold- und Pack-Rest-Drift", () => {
  const vorher = bindung();
  for (const delta of [
    { inventoryFingerprint: fp("9") },
    { characterGold: 101 },
    { bankGold: 199 },
    { packRestFingerprint: fp("8") },
  ]) {
    const r = pruefeBankSwapSettlement(vorher, bindung({
      beobachtetAmMs: 1001,
      fingerprint: fp("f"),
      slotAItem: vorher.slotBItem,
      slotBItem: vorher.slotAItem,
      ...delta,
    }));
    assert.equal(r.status, "DRIFT");
  }
});

test("Bank-Swap akzeptiert keine Slots ausserhalb 0..41 und verlaesst sich nie auf Server-Clamping", () => {
  assert.throws(
    () => pruefeBankSwapBereitschaft({
      schemaVersion: 1,
      ctype: "merchant",
      lebt: true,
      idle: true,
      bankGemountet: true,
      alternativeRuntimeAktiv: false,
      offeneBankTransaktion: false,
      evidenceFrisch: true,
      bindung: bindung({ slotA: 42 }),
    }),
    /BANK_SWAP_SLOT_A_UNGUELTIG/,
  );
});
