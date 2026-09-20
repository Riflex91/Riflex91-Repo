import test from "node:test";
import assert from "node:assert/strict";

import {
  pinneListingEvidence,
  reproduziereTradeSellServerAuswahl,
  validiereTradeIntent,
} from "../../erzeugt/index.js";

function listing(overrides = {}) {
  return {
    schemaVersion: 1,
    targetCharacterId: "buyer",
    tradeSlot: "trade1",
    rid: "ABCD",
    seite: "BUY",
    itemName: "coat",
    level: 5,
    unitPrice: 123456,
    menge: 3,
    beobachtetAmMs: 1000,
    gueltigBisMs: 1200,
    ...overrides,
  };
}

function item(index, fingerprint, disposition, fungibilitaet = "coat+5") {
  return {
    identitaet: {
      schemaVersion: 1,
      characterId: "merchant",
      inventarIndex: index,
      name: "coat",
      level: 5,
      menge: 3,
      beobachtungsFingerprint: fingerprint,
      beobachtetAmMs: 1000,
    },
    locked: false,
    blocked: false,
    fungibilitaetsSchluessel: fungibilitaet,
    disposition,
  };
}

test("Market Intent verlangt nichtleere frische RID-Evidence und feste Menge", () => {
  const ev = pinneListingEvidence(listing(), 1050);
  assert.doesNotThrow(() => validiereTradeIntent(ev, "BUY", 2, 1100));
  assert.throws(() => validiereTradeIntent(ev, "BUY", 4, 1100), /TRADE_MENGE_UEBER_FRISCHE_RESTMENGE/);
  assert.throws(() => validiereTradeIntent(ev, "BUY", 2, 1201), /TRADE_LISTING_EVIDENCE_ABGELAUFEN/);
  assert.throws(() => pinneListingEvidence(listing({ rid: "" }), 1050), /LISTING_TEXT_UNGUELTIG/);
});

test("RID bleibt bei Partial Fill als Listing-Anker gleich aber Mengen-Evidence aendert sich", () => {
  const vorher = pinneListingEvidence(listing({ menge: 3 }), 1050);
  const nachher = pinneListingEvidence(listing({
    menge: 1,
    beobachtetAmMs: 1100,
    gueltigBisMs: 1300,
  }), 1150);
  assert.equal(vorher.listingFingerprint, nachher.listingFingerprint);
  assert.notEqual(vorher.quantityFingerprint, nachher.quantityFingerprint);
});

test("trade_sell reproduziert Server-Scan ab Index 0 und blockiert falsches physisches Item", () => {
  const ev = pinneListingEvidence(listing(), 1050);
  const nachweis = reproduziereTradeSellServerAuswahl([
    item(0, "fp-keep", "BEHALTEN"),
    item(1, "fp-sell", "MARKT_VERKAUF"),
  ], ev, 1, 1100);

  assert.equal(nachweis.ausgewaehlt?.identitaet.inventarIndex, 0);
  assert.equal(nachweis.erlaubt, false);
  assert.equal(nachweis.grund, "DISPOSITION_VERBIETET_MARKTVERKAUF");
});

test("trade_sell verweigert nicht-fungible mehrdeutige Serverkandidaten", () => {
  const ev = pinneListingEvidence(listing(), 1050);
  const nachweis = reproduziereTradeSellServerAuswahl([
    item(0, "fp-a", "MARKT_VERKAUF", "variant-a"),
    item(1, "fp-b", "MARKT_VERKAUF", "variant-b"),
  ], ev, 1, 1100);
  assert.equal(nachweis.erlaubt, false);
  assert.equal(nachweis.grund, "NICHT_FUNGIBLE_MEHRDEUTIGE_SERVERAUSWAHL");
});

test("trade_sell erlaubt eindeutige/fungible erste Serverauswahl", () => {
  const ev = pinneListingEvidence(listing(), 1050);
  const nachweis = reproduziereTradeSellServerAuswahl([
    item(0, "fp-a", "MARKT_VERKAUF"),
    item(1, "fp-b", "MARKT_VERKAUF"),
  ], ev, 1, 1100);
  assert.equal(nachweis.erlaubt, true);
  assert.equal(nachweis.ausgewaehlt?.identitaet.inventarIndex, 0);
});
