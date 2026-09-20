import test from "node:test";
import assert from "node:assert/strict";

import {
  BegrenztesCircuitRegister,
  bewerteWiederholung,
} from "../../erzeugt/index.js";

const richtlinie = {
  maximaleVersuche: 4,
  maximaleDauerMs: 10_000,
  anfangsBackoffMs: 100,
  maximalerBackoffMs: 1_000,
  backoffFaktor: 2,
  circuitSchluessel: "merchant:trade",
};

test("Retry ist durch Versuche Zeit Backoff und Circuit gebunden", () => {
  assert.deepEqual(
    bewerteWiederholung(richtlinie, 1, 0, true, false),
    { erlaubt: true, grund: "ERLAUBT", naechsterVersuchNachMs: 100 },
  );
  assert.deepEqual(
    bewerteWiederholung(richtlinie, 3, 0, true, false),
    { erlaubt: true, grund: "ERLAUBT", naechsterVersuchNachMs: 400 },
  );
  assert.equal(
    bewerteWiederholung(richtlinie, 4, 0, true, false).grund,
    "VERSUCHE_AUSGESCHOEPFT",
  );
  assert.equal(
    bewerteWiederholung(richtlinie, 1, 10_000, true, false).grund,
    "ZEITBUDGET_AUSGESCHOEPFT",
  );
  assert.equal(
    bewerteWiederholung(richtlinie, 1, 0, false, false).grund,
    "CIRCUIT_OFFEN",
  );
});

test("moeglicher Send verbietet Same-Intent-Blind-Retry unabhaengig vom Budget", () => {
  assert.deepEqual(
    bewerteWiederholung(richtlinie, 1, 0, true, true),
    {
      erlaubt: false,
      grund: "MOEGLICHER_SEND_ABGLEICH_ERFORDERLICH",
      naechsterVersuchNachMs: null,
    },
  );
});

test("Circuits sind scoped und blockieren unabhaengige Faehigkeiten nicht", () => {
  const circuits = new BegrenztesCircuitRegister();
  circuits.meldeFehler("merchant:trade", 0, 2, 1_000);
  circuits.meldeFehler("merchant:trade", 1, 2, 1_000);

  assert.equal(circuits.darfVersuch("merchant:trade", 2), false);
  assert.equal(circuits.darfVersuch("movement:local", 2), true);
  assert.equal(circuits.darfVersuch("merchant:trade", 1_001), true);
  assert.equal(circuits.sicht().find(x => x.schluessel === "merchant:trade").status, "HALBOFFEN");

  circuits.meldeErfolg("merchant:trade");
  assert.equal(circuits.darfVersuch("merchant:trade", 1_002), true);
});
