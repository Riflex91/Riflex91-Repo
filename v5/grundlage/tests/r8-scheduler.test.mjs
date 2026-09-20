import test from "node:test";
import assert from "node:assert/strict";

import {
  AblaufScheduler,
} from "../../erzeugt/index.js";

const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);
const COMMIT_A = "1".repeat(40);
const COMMIT_B = "2".repeat(40);

function plan(ablaufId, optionen = {}) {
  return {
    schemaVersion: 1,
    ablaufId,
    ablaufArt: optionen.ablaufArt ?? "TEST",
    eigentuemerModulId: optionen.eigentuemerModulId ?? "modul.test",
    prioritaetsKlasse: optionen.prioritaetsKlasse ?? "NORMALE_ARBEIT",
    prioritaetsRang: optionen.prioritaetsRang ?? 100,
    erstelltAmMs: optionen.erstelltAmMs ?? 0,
    deadlineAmMs: optionen.deadlineAmMs ?? 1_000_000,
    ressourcenIds: optionen.ressourcenIds ?? [],
    wissensSnapshot: optionen.wissensSnapshot ?? {
      gitCommit: COMMIT_A,
      quellenSha256: [HASH_A],
    },
    wiederholung: {
      maximaleVersuche: 3,
      maximaleDauerMs: 10_000,
      anfangsBackoffMs: 100,
      maximalerBackoffMs: 1_000,
      backoffFaktor: 2,
      circuitSchluessel: "test:" + ablaufId,
    },
    idempotenzSchluessel: "idem:" + ablaufId,
    abgleichStrategie: "LIVE_NEU_BEOBACHTEN",
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
  };
}

test("geplanter Ablauf pinnt Knowledge-Commit und Quellenhashes unveraenderlich", () => {
  const quellen = [HASH_A];
  const scheduler = new AblaufScheduler();
  scheduler.registriere(plan("A", {
    wissensSnapshot: {
      gitCommit: COMMIT_A,
      quellenSha256: quellen,
    },
  }));

  quellen[0] = HASH_B;
  scheduler.registriere(plan("B", {
    wissensSnapshot: {
      gitCommit: COMMIT_B,
      quellenSha256: [HASH_B],
    },
  }));

  const sicht = scheduler.sicht();
  const a = sicht.find(eintrag => eintrag.plan.ablaufId === "A");
  const b = sicht.find(eintrag => eintrag.plan.ablaufId === "B");

  assert.equal(a.plan.wissensSnapshot.gitCommit, COMMIT_A);
  assert.deepEqual(a.plan.wissensSnapshot.quellenSha256, [HASH_A]);
  assert.equal(b.plan.wissensSnapshot.gitCommit, COMMIT_B);
  assert.deepEqual(b.plan.wissensSnapshot.quellenSha256, [HASH_B]);
});

test("Aging verhindert Starvation innerhalb derselben Prioritaetsklasse", () => {
  const scheduler = new AblaufScheduler(20, 1_000);
  scheduler.registriere(plan("ALT", {
    prioritaetsRang: 100,
    erstelltAmMs: 0,
    deadlineAmMs: 1_000_000,
  }));
  scheduler.registriere(plan("NEU", {
    prioritaetsRang: 0,
    erstelltAmMs: 150_000,
    deadlineAmMs: 1_000_000,
  }));
  scheduler.setzeStatus("ALT", "BEREIT", 150_000);
  scheduler.setzeStatus("NEU", "BEREIT", 150_000);

  assert.equal(scheduler.waehleNaechsten(200_000).plan.ablaufId, "ALT");
});

test("Prioritaetsklasse dominiert Aging und normale Arbeit niemals Safety", () => {
  const scheduler = new AblaufScheduler(20, 1);
  scheduler.registriere(plan("HINTERGRUND", {
    prioritaetsKlasse: "HINTERGRUND",
    prioritaetsRang: 0,
    erstelltAmMs: 0,
  }));
  scheduler.registriere(plan("SAFETY", {
    prioritaetsKlasse: "SICHERHEIT",
    prioritaetsRang: 999_999,
    erstelltAmMs: 999_000,
  }));
  scheduler.setzeStatus("HINTERGRUND", "BEREIT", 999_000);
  scheduler.setzeStatus("SAFETY", "BEREIT", 999_000);

  assert.equal(scheduler.waehleNaechsten(1_000_000).plan.ablaufId, "SAFETY");
});

test("Safety kann normale Arbeit erst am deklarierten sicheren Punkt preempten", () => {
  const scheduler = new AblaufScheduler();
  scheduler.registriere(plan("NORMAL", {
    prioritaetsKlasse: "NORMALE_ARBEIT",
    prioritaetsRang: 0,
  }));
  scheduler.registriere(plan("SAFETY", {
    prioritaetsKlasse: "SICHERHEIT",
    prioritaetsRang: 0,
  }));
  scheduler.setzeStatus("NORMAL", "LAUFEND", 10);
  scheduler.setzeStatus("SAFETY", "BEREIT", 10);

  assert.equal(
    scheduler.bewerteUnterbrechung("NORMAL", "SAFETY", 10),
    "WARTEN_BIS_SICHERER_PUNKT",
  );

  scheduler.meldeUnterbrechungsPunkt("NORMAL", {
    erlaubt: true,
    sichererPunktId: "NACH_CHECKPOINT",
    irreversibleMutationOffen: false,
    checkpointDurable: true,
  }, 11);

  assert.equal(
    scheduler.bewerteUnterbrechung("NORMAL", "SAFETY", 11),
    "UNTERBRECHEN",
  );
});

test("normale Arbeit kann Safety auch mit besserem Zahlenrang nie preempten", () => {
  const scheduler = new AblaufScheduler();
  scheduler.registriere(plan("SAFETY", {
    prioritaetsKlasse: "SICHERHEIT",
    prioritaetsRang: 999_999,
  }));
  scheduler.registriere(plan("NORMAL", {
    prioritaetsKlasse: "NORMALE_ARBEIT",
    prioritaetsRang: 0,
  }));
  scheduler.setzeStatus("SAFETY", "LAUFEND", 10);
  scheduler.meldeUnterbrechungsPunkt("SAFETY", {
    erlaubt: true,
    sichererPunktId: "SICHER",
    irreversibleMutationOffen: false,
    checkpointDurable: true,
  }, 11);
  scheduler.setzeStatus("NORMAL", "BEREIT", 11);

  assert.equal(
    scheduler.bewerteUnterbrechung("SAFETY", "NORMAL", 11),
    "KEIN_VORRANG",
  );
});

test("unsafe Preemption-Punkte werden bereits beim Melden blockiert", () => {
  const scheduler = new AblaufScheduler();
  scheduler.registriere(plan("A"));
  scheduler.setzeStatus("A", "LAUFEND", 1);

  assert.throws(
    () => scheduler.meldeUnterbrechungsPunkt("A", {
      erlaubt: true,
      sichererPunktId: "MITTEN_IM_COMMIT",
      irreversibleMutationOffen: true,
      checkpointDurable: true,
    }, 2),
    /UNTERBRECHUNG_BEI_IRREVERSIBLER_MUTATION_VERBOTEN/,
  );
  assert.throws(
    () => scheduler.meldeUnterbrechungsPunkt("A", {
      erlaubt: true,
      sichererPunktId: "OHNE_CHECKPOINT",
      irreversibleMutationOffen: false,
      checkpointDurable: false,
    }, 2),
    /UNTERBRECHUNG_OHNE_DURABLEN_CHECKPOINT_VERBOTEN/,
  );
});
