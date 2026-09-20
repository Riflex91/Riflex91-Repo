import test from "node:test";
import assert from "node:assert/strict";

import { WerttransaktionsLedger } from "../../erzeugt/index.js";

function intent(art = "UPGRADE") {
  return {
    schemaVersion: 1,
    transaktionsId: "tx-1",
    ablaufId: "wf-1",
    characterId: "merchant",
    art,
    actionContractId: "AL-ACTION-" + art,
    recoveryContractId: "AL-RECOVERY-" + art,
    physischeInputKennungen: ["merchant:1:fp-a"],
    prestateFingerprint: "pre-fp",
  };
}

test("q oder Placeholder beweist accepted in-flight und verbietet Blind-Retry", () => {
  const ledger = new WerttransaktionsLedger();
  ledger.plane(intent());
  ledger.markiereSendMoeglich("tx-1");
  const sicht = ledger.beobachteInFlight("tx-1", {
    schemaVersion: 1,
    beobachtetAmMs: 100,
    evidenceFingerprint: "ev-accepted",
    qAktiv: true,
    placeholderAnzahl: 1,
    consumableDeltaBeobachtet: true,
  });
  assert.equal(sicht.zustand, "AKZEPTIERT_IN_FLIGHT");
  assert.equal(sicht.sameIntentErneutSenden, false);
  assert.equal(sicht.acceptedAtMs, 100);
});

test("NOT_APPLIED verlangt positive Evidence fuer unveraenderte Inputs Consumables Conditions und kein q", () => {
  const ledger = new WerttransaktionsLedger();
  ledger.plane(intent("EXCHANGE"));
  ledger.markiereSendMoeglich("tx-1");
  assert.equal(ledger.klassifiziereNichtAusgefuehrt("tx-1", {
    schemaVersion: 1,
    beobachtetAmMs: 101,
    evidenceFingerprint: "ev-noop",
    alleInputsUnveraendert: true,
    consumablesUnveraendert: true,
    conditionsUnveraendert: true,
    qAktiv: false,
    placeholderAnzahl: 0,
  }), "NICHT_AUSGEFUEHRT");
  assert.equal(ledger.klassifiziereNichtAusgefuehrt("tx-1", {
    schemaVersion: 1,
    beobachtetAmMs: 102,
    evidenceFingerprint: "ev-unclear",
    alleInputsUnveraendert: true,
    consumablesUnveraendert: false,
    conditionsUnveraendert: true,
    qAktiv: false,
    placeholderAnzahl: 0,
  }), "UNGEKLAERT");
});

test("Restart setzt nichtterminale Werttransaktion auf ABGLEICH_ERFORDERLICH", () => {
  const alt = new WerttransaktionsLedger();
  alt.plane(intent("COMPOUND"));
  alt.markiereSendMoeglich("tx-1");
  alt.beobachteInFlight("tx-1", {
    schemaVersion: 1,
    beobachtetAmMs: 100,
    evidenceFingerprint: "ev-q",
    qAktiv: true,
    placeholderAnzahl: 1,
    consumableDeltaBeobachtet: true,
  });

  const neu = new WerttransaktionsLedger();
  neu.importiereNachRestart(alt.snapshot());
  const sicht = neu.finde("tx-1");
  assert.equal(sicht.zustand, "ABGLEICH_ERFORDERLICH");
  assert.equal(sicht.sameIntentErneutSenden, false);
});

test("Terminaler Pfad wird nur aus Reconciliation-Evidence gesetzt", () => {
  const ledger = new WerttransaktionsLedger();
  ledger.plane(intent());
  ledger.markiereSendMoeglich("tx-1");
  ledger.beobachteInFlight("tx-1", {
    schemaVersion: 1,
    beobachtetAmMs: 100,
    evidenceFingerprint: "ev-q",
    qAktiv: true,
    placeholderAnzahl: 1,
    consumableDeltaBeobachtet: true,
  });
  assert.equal(
    ledger.markiereTerminal("tx-1", false, "ev-final-inventory").zustand,
    "TERMINAL_FEHLER",
  );
});
