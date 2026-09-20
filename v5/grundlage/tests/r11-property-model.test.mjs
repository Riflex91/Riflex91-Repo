import test from "node:test";
import assert from "node:assert/strict";

import {
  AblaufScheduler,
  GeschlossenerZustandsautomat,
  RessourcenVerwalter,
} from "../../erzeugt/index.js";

const HASH = "a".repeat(64);
const COMMIT = "1".repeat(40);

function plan(id, klasse, rang, erstelltAmMs) {
  return {
    schemaVersion: 1,
    ablaufId: id,
    ablaufArt: "PROPERTY",
    eigentuemerModulId: "property.test",
    prioritaetsKlasse: klasse,
    prioritaetsRang: rang,
    erstelltAmMs,
    deadlineAmMs: erstelltAmMs + 1_000_000,
    ressourcenIds: [],
    wissensSnapshot: { gitCommit: COMMIT, quellenSha256: [HASH] },
    wiederholung: {
      maximaleVersuche: 3,
      maximaleDauerMs: 10_000,
      anfangsBackoffMs: 10,
      maximalerBackoffMs: 100,
      backoffFaktor: 2,
      circuitSchluessel: "property:" + id,
    },
    idempotenzSchluessel: "property:" + id,
    abgleichStrategie: "LIVE_NEU_BEOBACHTEN",
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
  };
}

function lcg(seed) {
  let x = seed >>> 0;
  return () => {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    return x;
  };
}

test("Property: Safety dominiert normale Arbeit fuer viele deterministische Rangkombinationen", () => {
  const rnd = lcg(123456);
  for (let i = 0; i < 200; i += 1) {
    const scheduler = new AblaufScheduler(20, 1000);
    const normalRang = rnd() % 1_000_000;
    const safetyRang = rnd() % 1_000_000;
    scheduler.registriere(plan("N-" + i, "NORMALE_ARBEIT", normalRang, 0));
    scheduler.registriere(plan("S-" + i, "SICHERHEIT", safetyRang, 0));
    scheduler.setzeStatus("N-" + i, "BEREIT", 1);
    scheduler.setzeStatus("S-" + i, "BEREIT", 1);
    assert.equal(scheduler.waehleNaechsten(10_000).plan.ablaufId, "S-" + i);
  }
});

test("Property: stale Fencing-Token wird nach jeder Freigabe/Neuvergabe ungueltig", () => {
  const verwalter = new RessourcenVerwalter();
  let vorher = null;
  for (let i = 0; i < 100; i += 1) {
    const [token] = verwalter.beanspruche("WF-" + i, [{
      ressourcenId: "resource:property",
      art: "EXKLUSIV",
      leaseDauerMs: null,
    }], i * 2);
    assert.equal(verwalter.validiereFencing(token, i * 2), true);
    if (vorher !== null) {
      assert.equal(verwalter.validiereFencing(vorher, i * 2), false);
      assert.ok(token.epoche > vorher.epoche);
    }
    verwalter.gibFrei(token, i * 2 + 1);
    assert.equal(verwalter.validiereFencing(token, i * 2 + 1), false);
    vorher = token;
  }
});

test("Model: geschlossener Automat akzeptiert exakt deklarierte Kanten", () => {
  const kanten = [
    ["A", "B"],
    ["B", "C"],
    ["C", "D"],
  ];
  for (const [von, nach] of kanten) {
    const automat = new GeschlossenerZustandsautomat({
      kennung: "MODEL-" + von + nach,
      start: von,
      zustaende: ["A", "B", "C", "D"],
      uebergaenge: kanten.map(([a,b]) => ({ von: a, nach: b })),
      terminal: ["D"],
    });
    assert.equal(automat.darfWechseln(nach), true);
    for (const kandidat of ["A", "B", "C", "D"]) {
      if (kandidat !== nach) {
        assert.equal(automat.darfWechseln(kandidat), false);
      }
    }
  }
});
