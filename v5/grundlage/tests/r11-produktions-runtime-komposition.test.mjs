import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  ProduktivesV5GesamtfreigabeGate,
  V5ProduktionsBootstrap,
  V5ProduktionsRuntime,
} from "../../erzeugt/index.js";

function liesJson(relativ) {
  return JSON.parse(fs.readFileSync(new URL(relativ, import.meta.url), "utf8"));
}

const bereitschaft = liesJson("../../bereitschaft/laufzeit-bereitschaft.json");
const gesamtfreigabe = liesJson("../../roadmap/gesamtfreigabe.json");

const modul = Object.freeze({
  schemaVersion: 1,
  modulId: "merchant-core",
  modulVersion: "1",
  bereitgestellteFaehigkeiten: Object.freeze(["bank.deposit"]),
  benoetigteFaehigkeiten: Object.freeze([]),
  bereitgestelltePorts: Object.freeze([]),
  benoetigtePorts: Object.freeze([]),
  standardAktiv: false,
});

const faehigkeit = Object.freeze({
  schemaVersion: 1,
  faehigkeitId: "bank.deposit",
  anbieterModulId: "merchant-core",
  anbieterVersion: "1",
  modus: "MUTIEREN",
  status: "VERFUEGBAR",
  standardAktiv: false,
});

function definition(overrides = {}) {
  return {
    schemaVersion: 1,
    modulDefinitionen: [modul],
    faehigkeitsDefinitionen: [faehigkeit],
    healthAnforderungen: [{
      healthId: "journal",
      erforderlich: true,
    }],
    ...overrides,
  };
}

function metrischeBasis() {
  return {
    schemaVersion: 1,
    zeitMs: 100,
    ssdIoLatenzMs: 2,
    ioQueueTiefe: 0,
    backpressureAktiv: false,
    freieBytes: 50_000_000,
    recorderDrops: 0,
  };
}

function health() {
  return [{
    healthId: "journal",
    zustand: "GESUND",
    beobachtetAmMs: 90,
    gueltigBisMs: 200,
    evidenceId: "HEALTH-JOURNAL-1",
  }];
}

test("Produktions-Komposition startet mit zentralen Kernen und null aktiver Mutation", async () => {
  const runtime = new V5ProduktionsRuntime(definition());

  const davor = runtime.status();
  assert.equal(davor.prozessLaeuft, false);
  assert.equal(davor.bereit, false);
  assert.equal(davor.registrierteModule, 1);
  assert.equal(davor.aktiveModule, 0);
  assert.equal(davor.registrierteFaehigkeiten, 1);
  assert.equal(davor.aktiveFaehigkeiten, 0);
  assert.equal(davor.aktiveMutierendeFaehigkeiten, 0);

  const start = await runtime.starte();
  const danach = runtime.status();

  assert.equal(start.erfolgreich, true);
  assert.equal(danach.prozessLaeuft, true);
  assert.equal(danach.bereit, true);
  assert.equal(danach.zustand, "LAEUFT");
  assert.equal(danach.aktiveModule, 0);
  assert.equal(danach.aktiveMutierendeFaehigkeiten, 0);
  assert.equal(danach.gameplayAutoritaet, false);
  assert.equal(danach.rawWriteAutoritaet, false);
  assert.equal(danach.actionAuthority, false);
  assert.equal(danach.automatischerNeustart, false);
});

test("Kompositionswurzel liefert genau die gemeinsam verdrahteten zentralen Kernkomponenten", () => {
  const runtime = new V5ProduktionsRuntime(definition());
  const kern = runtime.kernKomponenten();

  assert.equal(typeof kern.module.sicht, "function");
  assert.equal(typeof kern.faehigkeiten.sicht, "function");
  assert.equal(typeof kern.scheduler.sicht, "function");
  assert.equal(typeof kern.ressourcen.sicht, "function");
  assert.equal(typeof kern.socketBudget.sicht, "function");
  assert.equal(typeof kern.mutationsKanaele.reserviere, "function");
  assert.equal(typeof kern.ausfuehrung.fuehreAus, "function");
  assert.equal(typeof kern.laufsteuerung.sicht, "function");
  assert.equal(typeof kern.autoritaetsStatus.sicht, "function");
  assert.equal(typeof kern.telemetrie.snapshot, "function");

  assert.equal(kern.module.sicht().length, 1);
  assert.equal(kern.faehigkeiten.sicht().length, 1);
  assert.equal(
    kern.faehigkeiten.sicht()[0].aktiv,
    false,
  );
});

test("Produktions-Komposition verbietet jede implizite Standardaktivierung", () => {
  assert.throws(
    () => new V5ProduktionsRuntime(definition({
      faehigkeitsDefinitionen: [{
        ...faehigkeit,
        modus: "LESEN",
        standardAktiv: true,
      }],
    })),
    /PRODUKTIONS_KOMPOSITION_FAEHIGKEIT_STANDARD_AKTIV_VERBOTEN/,
  );

  assert.throws(
    () => new V5ProduktionsRuntime(definition({
      modulDefinitionen: [{
        ...modul,
        standardAktiv: true,
      }],
    })),
    /PRODUKTIONS_KOMPOSITION_MODUL_STANDARD_AKTIV_VERBOTEN/,
  );
});

test("kontrollierter Stop verhindert Blind-Restart derselben Runtime-Instanz", async () => {
  const runtime = new V5ProduktionsRuntime(definition());

  assert.equal((await runtime.starte()).erfolgreich, true);
  const stopp = await runtime.stoppe("BETREIBER_STOPP");
  const restart = await runtime.starte();

  assert.equal(stopp.erfolgreich, true);
  assert.equal(runtime.status().prozessLaeuft, false);
  assert.equal(runtime.status().zustand, "PAUSIERT");
  assert.equal(restart.erfolgreich, false);
  assert.equal(
    restart.grund,
    "V5_RUNTIME_NEUSTART_ERFORDERT_NEUE_INSTANZ",
  );
});

test("Stop mit In-Flight-Mutation bleibt bis Reconciliation laufend und fail-closed", async () => {
  const runtime = new V5ProduktionsRuntime(definition());
  const kern = runtime.kernKomponenten();

  await runtime.starte();
  kern.laufsteuerung.registriereInFlight({
    transaktionsId: "T-INFLIGHT-1",
    fehlerDomaeneId: "BANK",
    irreversiblerEffektMoeglich: true,
  });

  const ersterStopp = await runtime.stoppe("BETREIBER_STOPP");

  assert.equal(ersterStopp.erfolgreich, false);
  assert.equal(ersterStopp.grund, "V5_RUNTIME_ABGLEICH_ERFORDERLICH");
  assert.equal(runtime.status().prozessLaeuft, true);
  assert.equal(runtime.status().zustand, "ABGLEICH_ERFORDERLICH");

  kern.laufsteuerung.meldeAbgleichAbgeschlossen("T-INFLIGHT-1", true);
  const zweiterStopp = await runtime.stoppe("ABGLEICH_ABGESCHLOSSEN");

  assert.equal(zweiterStopp.erfolgreich, true);
  assert.equal(runtime.status().prozessLaeuft, false);
  assert.equal(runtime.status().zustand, "PAUSIERT");
});

test("realer Gesamtfreigabe-Bootstrap startet die konkrete V5-Kompositionswurzel", async () => {
  const runtime = new V5ProduktionsRuntime(definition());
  runtime.erfasseOperationsMetrik(metrischeBasis());

  const gate = new ProduktivesV5GesamtfreigabeGate(
    bereitschaft,
    gesamtfreigabe,
    1,
  );
  const bootstrap = new V5ProduktionsBootstrap(
    gate,
    runtime.operationsSupervisor(),
    runtime,
  );

  const gestartet = await bootstrap.starte(health(), 100);

  assert.equal(gestartet.zustand, "LAEUFT");
  assert.equal(gestartet.prozess?.runtimeKennung, "V5");
  assert.equal(gestartet.prozess?.prozessLaeuft, true);
  assert.equal(runtime.status().aktiveMutierendeFaehigkeiten, 0);

  const gestoppt = await bootstrap.stoppe("BETREIBER_STOPP");
  assert.equal(gestoppt.zustand, "GESTOPPT");
  assert.equal(runtime.status().prozessLaeuft, false);
});


test("Produktions-Komposition verlangt exaktes Provider-Modul fuer jede Capability", () => {
  assert.throws(
    () => new V5ProduktionsRuntime(definition({
      faehigkeitsDefinitionen: [{
        ...faehigkeit,
        anbieterModulId: "nicht-registriert",
      }],
    })),
    /PRODUKTIONS_KOMPOSITION_FAEHIGKEIT_PROVIDER_FEHLT:bank\.deposit/,
  );
});

test("Produktions-Komposition verlangt Capability-Deklaration am Provider-Modul", () => {
  assert.throws(
    () => new V5ProduktionsRuntime(definition({
      modulDefinitionen: [{
        ...modul,
        bereitgestellteFaehigkeiten: [],
      }],
    })),
    /PRODUKTIONS_KOMPOSITION_FAEHIGKEIT_NICHT_DEKLARIERT:bank\.deposit/,
  );
});

test("Produktions-Komposition verbietet Modul-Capability ohne Provider-Definition", () => {
  assert.throws(
    () => new V5ProduktionsRuntime(definition({
      faehigkeitsDefinitionen: [],
    })),
    /PRODUKTIONS_KOMPOSITION_MODUL_FAEHIGKEIT_OHNE_ANBIETER:bank\.deposit/,
  );
});

test("Produktions-Komposition verlangt Anbieter fuer jede benoetigte Capability", () => {
  assert.throws(
    () => new V5ProduktionsRuntime(definition({
      modulDefinitionen: [{
        ...modul,
        benoetigteFaehigkeiten: ["world.observe"],
      }],
    })),
    /PRODUKTIONS_KOMPOSITION_BENOETIGTE_FAEHIGKEIT_FEHLT:world\.observe/,
  );
});
