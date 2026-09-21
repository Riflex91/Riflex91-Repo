import test from "node:test";
import assert from "node:assert/strict";

import { bewerteMerchantDienstWechsel } from "../../erzeugt/index.js";

const richtlinie = {
  richtlinienVersion: "merchant-stability-v1",
  mindestHaltedauerMs: 30_000,
  wechselCooldownMs: 10_000,
  wechselFensterMs: 60_000,
  maximaleWechselImFenster: 3,
  starvationGrenzeMs: 120_000,
  maximaleHistorie: 16,
};

function kontext(overrides = {}) {
  return {
    aktuellerBereich: "BANK",
    aktuellePrioritaetsKlasse: "NORMALE_ARBEIT",
    bereichBegonnenAmMs: 100_000,
    letzterWechselAmMs: 100_000,
    sichereUnterbrechung: true,
    checkpointDurable: true,
    irreversibleMutationOffen: false,
    wechselHistorieMs: [70_000, 100_000],
    ...overrides,
  };
}

function bewerber(overrides = {}) {
  return {
    bereich: "FARMER_RENDEZVOUS",
    prioritaetsKlasse: "ERFORDERLICHER_DIENST",
    wartetSeitMs: 90_000,
    deadlineAmMs: 300_000,
    schedulerVorrang: true,
    ...overrides,
  };
}

test("Merchant wechselt nicht waehrend offener irreversibler Mutation", () => {
  const e = bewerteMerchantDienstWechsel(
    kontext({ irreversibleMutationOffen: true }),
    bewerber({ prioritaetsKlasse: "SICHERHEIT" }),
    richtlinie,
    150_000,
  );
  assert.equal(e.wechselErlaubt, false);
  assert.equal(e.grund, "IRREVERSIBLE_MUTATION_OFFEN");
});

test("Safety darf stabile normale Arbeit an sicherem Checkpoint preempten", () => {
  const e = bewerteMerchantDienstWechsel(
    kontext(),
    bewerber({ prioritaetsKlasse: "SICHERHEIT" }),
    richtlinie,
    150_000,
  );
  assert.equal(e.wechselErlaubt, true);
  assert.equal(e.grund, "SAFETY_PREEMPTION");
});

test("Mindesthaltedauer und Cooldown verhindern Merchant-Pingpong", () => {
  const halt = bewerteMerchantDienstWechsel(
    kontext({ bereichBegonnenAmMs: 140_000, letzterWechselAmMs: 140_000 }),
    bewerber({ wartetSeitMs: 145_000 }),
    richtlinie,
    150_000,
  );
  assert.equal(halt.wechselErlaubt, false);
  assert.equal(halt.grund, "MINDEST_HALTEDAUER");

  const cooldown = bewerteMerchantDienstWechsel(
    kontext({ bereichBegonnenAmMs: 100_000, letzterWechselAmMs: 145_000 }),
    bewerber({ wartetSeitMs: 120_000 }),
    richtlinie,
    150_000,
  );
  assert.equal(cooldown.wechselErlaubt, false);
  assert.equal(cooldown.grund, "WECHSEL_COOLDOWN");
});

test("bounded Wechselbudget blockiert Thrash", () => {
  const e = bewerteMerchantDienstWechsel(
    kontext({ wechselHistorieMs: [100_000, 120_000, 140_000] }),
    bewerber({ wartetSeitMs: 130_000 }),
    richtlinie,
    150_000,
  );
  assert.equal(e.wechselErlaubt, false);
  assert.equal(e.grund, "WECHSEL_BUDGET_ERSCHOEPFT");
});

test("Starvation darf nur am sicheren durable Checkpoint aufgeloest werden", () => {
  const e = bewerteMerchantDienstWechsel(
    kontext({ bereichBegonnenAmMs: 100_000, letzterWechselAmMs: 100_000 }),
    bewerber({ wartetSeitMs: 1_000 }),
    richtlinie,
    150_000,
  );
  assert.equal(e.wechselErlaubt, true);
  assert.equal(e.grund, "STARVATION_GRENZE_ERREICHT");

  const block = bewerteMerchantDienstWechsel(
    kontext({ sichereUnterbrechung: false }),
    bewerber({ wartetSeitMs: 1_000 }),
    richtlinie,
    150_000,
  );
  assert.equal(block.wechselErlaubt, false);
  assert.equal(block.grund, "KEIN_SICHERER_DURABLER_UNTERBRECHUNGSPUNKT");
});

test("Planner selbst besitzt keine Gameplay- oder Raw-Write-Authority", () => {
  const e = bewerteMerchantDienstWechsel(
    kontext({ wechselHistorieMs: [] }),
    bewerber({ wartetSeitMs: 120_000 }),
    richtlinie,
    150_000,
  );
  assert.equal(e.gameplayAutoritaet, false);
  assert.equal(e.rawWriteAutoritaet, false);
});
