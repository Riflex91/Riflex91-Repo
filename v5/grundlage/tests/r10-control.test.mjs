import test from "node:test";
import assert from "node:assert/strict";

import {
  FehlerDomaenenSteuerung,
  KontrollierteLaufsteuerung,
  ladeRecoveryWiederanlauf,
} from "../../erzeugt/index.js";

test("Stop sperrt zuerst neue Arbeit und reconciliert In-Flight bounded", () => {
  const steuerung = new KontrollierteLaufsteuerung(4);
  steuerung.registriereInFlight({
    transaktionsId: "T-1",
    fehlerDomaeneId: "bank",
    irreversiblerEffektMoeglich: true,
  });
  steuerung.registriereInFlight({
    transaktionsId: "T-2",
    fehlerDomaeneId: "movement",
    irreversiblerEffektMoeglich: false,
  });

  const stop = steuerung.fordereStoppAn();
  assert.equal(stop.neueArbeitErlaubt, false);
  assert.equal(stop.status, "ABGLEICH_LAEUFT");
  assert.throws(
    () => steuerung.registriereInFlight({
      transaktionsId: "T-3",
      fehlerDomaeneId: "trade",
      irreversiblerEffektMoeglich: true,
    }),
    /LAUFSTEUERUNG_KEINE_NEUE_ARBEIT/,
  );

  assert.equal(
    steuerung.meldeAbgleichAbgeschlossen("T-2", true).status,
    "ABGLEICH_LAEUFT",
  );
  assert.equal(
    steuerung.meldeAbgleichAbgeschlossen("T-1", true).status,
    "PAUSIERT",
  );
});

test("unsicherer Stop-Abgleich einer irreversiblen In-Flight-Transaktion sperrt kritisch", () => {
  const steuerung = new KontrollierteLaufsteuerung();
  steuerung.registriereInFlight({
    transaktionsId: "T-1",
    fehlerDomaeneId: "bank",
    irreversiblerEffektMoeglich: true,
  });
  steuerung.fordereStoppAn();

  const sicht = steuerung.meldeAbgleichAbgeschlossen("T-1", false);
  assert.equal(sicht.status, "KRITISCH_GESPERRT");
  assert.equal(sicht.neueArbeitErlaubt, false);
  assert.equal(sicht.inFlight.length, 1);
});

test("Fehler bleiben auf kleinste Domaene begrenzt", () => {
  const steuerung = new FehlerDomaenenSteuerung();
  steuerung.registriere("bank");
  steuerung.registriere("movement");
  steuerung.registriere("combat");

  steuerung.meldeFehler("bank", "GESPERRT", "BANK_ABGLEICH_UNGEKLAERT");

  assert.equal(steuerung.istErlaubt("bank"), false);
  assert.equal(steuerung.istErlaubt("movement"), true);
  assert.equal(steuerung.istErlaubt("combat"), true);
  assert.equal(
    steuerung.sicht().filter(x => x.status === "GESPERRT").length,
    1,
  );
});

test("nichtterminaler Restart wird ausschliesslich als ABGLEICH_ERFORDERLICH geladen", () => {
  const result = ladeRecoveryWiederanlauf({
    schemaVersion: 1,
    workflowId: "WF-1",
    checkpointId: "CP-1",
    status: "NICHT_TERMINAL",
    sequenz: 5,
    zeitMs: 100,
    zustand: { phase: "LAEUFT" },
  });

  assert.deepEqual(result, {
    art: "ABGLEICH_ERFORDERLICH",
    workflowId: "WF-1",
    checkpointId: "CP-1",
    terminalStatus: null,
    executionAuthority: false,
  });
});

test("terminaler Restart verleiht ebenfalls keine ExecutionAuthority", () => {
  const result = ladeRecoveryWiederanlauf({
    schemaVersion: 1,
    workflowId: "WF-2",
    checkpointId: "CP-2",
    status: "ABGESCHLOSSEN",
    sequenz: 9,
    zeitMs: 200,
    zustand: {},
  });

  assert.equal(result.art, "TERMINAL");
  assert.equal(result.terminalStatus, "ABGESCHLOSSEN");
  assert.equal(result.executionAuthority, false);
});
