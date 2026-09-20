import test from "node:test";
import assert from "node:assert/strict";

import {
  GegenstandsDispositionsLedger,
  physischeGegenstandsKennung,
  pruefeWorkspaceKapazitaet,
} from "../../erzeugt/index.js";

function item(index, fingerprint, menge = 1) {
  return {
    schemaVersion: 1,
    characterId: "merchant",
    inventarIndex: index,
    name: "coat",
    level: 5,
    menge,
    beobachtungsFingerprint: fingerprint,
    beobachtetAmMs: 100,
  };
}

test("zentrale Disposition bindet alle Merchant-Reservierungen an konkrete physische Identitaet", () => {
  const ledger = new GegenstandsDispositionsLedger();
  const a = item(3, "fp-a", 2);
  const b = item(4, "fp-b", 2);

  ledger.setze({
    identitaet: a,
    disposition: "MARKT_VERKAUF",
    begruendung: "explizit fuer Marktverkauf freigegeben",
    policyVersion: "merchant-policy-1",
  });
  ledger.setze({
    identitaet: b,
    disposition: "BEHALTEN",
    begruendung: "wertvolles zweites physisches Exemplar",
    policyVersion: "merchant-policy-1",
  });

  const reservierung = ledger.reserviere("R-1", "WF-1", a, "MARKT_VERKAUF", 1);
  assert.equal(reservierung.physischeKennung, physischeGegenstandsKennung(a));
  assert.equal(ledger.validiere(reservierung, a), true);
  assert.equal(ledger.validiere(reservierung, b), false);

  assert.throws(
    () => ledger.reserviere("R-2", "WF-2", b, "MARKT_VERKAUF", 1),
    /ITEM_DISPOSITION_VERBIETET_ZWECK/,
  );
});

test("physische Reservierung verhindert Doppelverbrauch derselben Menge", () => {
  const ledger = new GegenstandsDispositionsLedger();
  const a = item(7, "fp-stack", 3);
  ledger.setze({
    identitaet: a,
    disposition: "NPC_VERKAUF",
    begruendung: "NPC Verkauf",
    policyVersion: "merchant-policy-1",
  });
  ledger.reserviere("R-1", "WF-1", a, "NPC_VERKAUF", 2);
  assert.throws(
    () => ledger.reserviere("R-2", "WF-2", a, "NPC_VERKAUF", 2),
    /ITEM_PHYSISCHE_MENGE_BEREITS_RESERVIERT/,
  );
});

test("Workspace-Preflight rechnet sichere Stack-Merges und temporaere Slots konservativ", () => {
  const ok = pruefeWorkspaceKapazitaet({
    freieInventarSlots: 2,
    temporaereWorkspaceSlots: 1,
    bestehendeStacks: [{
      slotId: "12",
      name: "hpot1",
      level: 0,
      menge: 80,
      maximaleMenge: 100,
      variantenFingerprint: "normal",
    }],
    outputs: [{
      name: "hpot1",
      level: 0,
      menge: 20,
      maximaleMenge: 100,
      variantenFingerprint: "normal",
    }],
  });
  assert.deepEqual(ok, {
    erlaubt: true,
    benoetigteNeueSlots: 0,
    temporaereWorkspaceSlots: 1,
    gesamtBenoetigteFreieSlots: 1,
    freieInventarSlots: 2,
  });

  const konservativ = pruefeWorkspaceKapazitaet({
    freieInventarSlots: 1,
    temporaereWorkspaceSlots: 1,
    bestehendeStacks: [{
      slotId: "12",
      name: "hpot1",
      level: 0,
      menge: 80,
      maximaleMenge: 100,
      variantenFingerprint: "normal",
    }],
    outputs: [{
      name: "hpot1",
      level: 0,
      menge: 20,
      maximaleMenge: 100,
      variantenFingerprint: null,
    }],
  });
  assert.equal(konservativ.benoetigteNeueSlots, 1);
  assert.equal(konservativ.gesamtBenoetigteFreieSlots, 2);
  assert.equal(konservativ.erlaubt, false);
});
