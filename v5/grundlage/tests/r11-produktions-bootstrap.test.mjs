import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  AutoritaetsStatusRegister,
  BegrenzteOperationsTelemetrie,
  HeadlessOperationsSupervisor,
  ProduktivesV5GesamtfreigabeGate,
  V5ProduktionsBootstrap,
} from "../../erzeugt/index.js";

function liesJson(relativ) {
  return JSON.parse(fs.readFileSync(new URL(relativ, import.meta.url), "utf8"));
}

function kopie(wert) {
  return JSON.parse(JSON.stringify(wert));
}

const bereitschaft = liesJson("../../bereitschaft/laufzeit-bereitschaft.json");
const gesamtfreigabe = liesJson("../../roadmap/gesamtfreigabe.json");

class ProzessFake {
  constructor(optionen = {}) {
    this.optionen = optionen;
    this.laeuft = optionen.externGestartet === true;
    this.starts = 0;
    this.stopps = 0;
  }

  status() {
    if (this.optionen.statusWirft === true) {
      throw new Error("STATUS_KAPUTT");
    }
    const unsicher = this.optionen.unsicherVorStart === true
      || (this.starts > 0 && this.optionen.unsicherNachStart === true);
    return {
      prozessLaeuft: this.laeuft,
      runtimeKennung: this.optionen.falscheRuntime === true ? "V4" : "V5",
      bereit: this.laeuft && this.optionen.nichtBereit !== true,
      gameplayAutoritaet: unsicher,
      rawWriteAutoritaet: false,
    };
  }

  async starte() {
    this.starts += 1;
    if (this.optionen.startWirft === true) throw new Error("START_KAPUTT");
    if (this.optionen.startErfolglos === true) {
      return { erfolgreich: false, grund: "TEST_START_BLOCKIERT" };
    }
    this.laeuft = true;
    return { erfolgreich: true, grund: "TEST_GESTARTET" };
  }

  async stoppe() {
    this.stopps += 1;
    this.laeuft = false;
    return { erfolgreich: true, grund: "TEST_GESTOPPT" };
  }
}

function supervisor() {
  const authority = new AutoritaetsStatusRegister();
  const telemetrie = new BegrenzteOperationsTelemetrie();
  telemetrie.erfasse({
    schemaVersion: 1,
    zeitMs: 100,
    ssdIoLatenzMs: 2,
    ioQueueTiefe: 0,
    backpressureAktiv: false,
    freieBytes: 10_000_000,
    recorderDrops: 0,
  });
  return new HeadlessOperationsSupervisor(
    [{ healthId: "journal", erforderlich: true }],
    authority,
    telemetrie,
  );
}

function health(zustand = "GESUND") {
  return [{
    healthId: "journal",
    zustand,
    beobachtetAmMs: 90,
    gueltigBisMs: 200,
    evidenceId: "HEALTH-JOURNAL-1",
  }];
}

function gate(freigabe = gesamtfreigabe, ready = bereitschaft) {
  return new ProduktivesV5GesamtfreigabeGate(ready, freigabe, 1);
}

test("V5 Produktions-Bootstrap startet nur mit realer Gesamtfreigabe und gesunder Operations-Sicht", async () => {
  const prozess = new ProzessFake();
  const bootstrap = new V5ProduktionsBootstrap(
    gate(),
    supervisor(),
    prozess,
  );

  const status = await bootstrap.starte(health(), 100);

  assert.equal(status.zustand, "LAEUFT");
  assert.equal(status.gesamtfreigabeErlaubt, true);
  assert.equal(status.operationsBereit, true);
  assert.equal(status.prozess?.prozessLaeuft, true);
  assert.equal(status.prozess?.runtimeKennung, "V5");
  assert.equal(status.gameplayAutoritaet, false);
  assert.equal(status.rawWriteAutoritaet, false);
  assert.equal(status.automatischerNeustart, false);
  assert.equal(prozess.starts, 1);
});

test("ungültige Gesamtfreigabe erreicht den Prozess-Start niemals", async () => {
  const manipuliert = kopie(gesamtfreigabe);
  manipuliert.bestaetigungText = "mach weiter";
  const prozess = new ProzessFake();
  const bootstrap = new V5ProduktionsBootstrap(
    gate(manipuliert),
    supervisor(),
    prozess,
  );

  const status = await bootstrap.starte(health(), 100);

  assert.equal(status.zustand, "GESPERRT");
  assert.equal(status.grund, "GESAMTFREIGABE_NICHT_GUELTIG");
  assert.equal(prozess.starts, 0);
});

test("degradierte oder stale kritische Health sperrt vor Prozess-Start", async () => {
  for (const evidence of [
    health("DEGRADIERT"),
    [{
      ...health()[0],
      gueltigBisMs: 99,
    }],
  ]) {
    const prozess = new ProzessFake();
    const bootstrap = new V5ProduktionsBootstrap(
      gate(),
      supervisor(),
      prozess,
    );

    const status = await bootstrap.starte(evidence, 100);

    assert.equal(status.zustand, "GESPERRT");
    assert.equal(status.grund, "OPERATIONS_NICHT_BEREIT");
    assert.equal(prozess.starts, 0);
  }
});

test("extern bereits gestarteter V5-Prozess wird nicht stillschweigend übernommen", async () => {
  const prozess = new ProzessFake({ externGestartet: true });
  const bootstrap = new V5ProduktionsBootstrap(
    gate(),
    supervisor(),
    prozess,
  );

  const status = await bootstrap.starte(health(), 100);

  assert.equal(status.zustand, "GESPERRT");
  assert.equal(status.grund, "PROZESS_BEREITS_EXTERN_GESTARTET");
  assert.equal(prozess.starts, 0);
});

test("Host-Grenzverletzung nach Start wird sofort fail-closed gestoppt", async () => {
  const prozess = new ProzessFake({ unsicherNachStart: true });
  const bootstrap = new V5ProduktionsBootstrap(
    gate(),
    supervisor(),
    prozess,
  );

  const status = await bootstrap.starte(health(), 100);

  assert.equal(status.zustand, "GESPERRT");
  assert.equal(status.grund, "POST_START_GRENZE_UNGUELTIG");
  assert.equal(prozess.starts, 1);
  assert.equal(prozess.stopps, 1);
  assert.equal(prozess.laeuft, false);
});

test("wiederholtes Starten erzeugt keinen zweiten Prozess und Stop startet nichts neu", async () => {
  const prozess = new ProzessFake();
  const bootstrap = new V5ProduktionsBootstrap(
    gate(),
    supervisor(),
    prozess,
  );

  const erster = await bootstrap.starte(health(), 100);
  const zweiter = await bootstrap.starte(health(), 101);
  const gestoppt = await bootstrap.stoppe("BETREIBER_STOPP");

  assert.equal(erster.zustand, "LAEUFT");
  assert.equal(zweiter.zustand, "LAEUFT");
  assert.equal(prozess.starts, 1);
  assert.equal(gestoppt.zustand, "GESTOPPT");
  assert.equal(gestoppt.automatischerNeustart, false);
  assert.equal(prozess.stopps, 1);
  assert.equal(prozess.starts, 1);
});
