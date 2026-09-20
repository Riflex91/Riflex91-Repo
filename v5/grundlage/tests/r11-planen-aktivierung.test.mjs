import test from "node:test";
import assert from "node:assert/strict";

import {
  BedienerRichtlinienDienst,
  V5ProduktionsRuntime,
} from "../../erzeugt/index.js";

function definition(modus = "PLANEN") {
  const faehigkeitId = modus === "PLANEN"
    ? "merchant.bank.planen"
    : "merchant.bank.mutieren";
  return {
    schemaVersion: 1,
    modulDefinitionen: [{
      schemaVersion: 1,
      modulId: "merchant-core-a",
      modulVersion: "1",
      bereitgestellteFaehigkeiten: [faehigkeitId],
      benoetigteFaehigkeiten: [],
      bereitgestelltePorts: [],
      benoetigtePorts: [],
      standardAktiv: false,
    }],
    faehigkeitsDefinitionen: [{
      schemaVersion: 1,
      faehigkeitId,
      anbieterModulId: "merchant-core-a",
      anbieterVersion: "1",
      modus,
      status: "VERFUEGBAR",
      standardAktiv: false,
    }],
    healthAnforderungen: [{
      healthId: "journal",
      erforderlich: true,
    }],
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
    evidenceId: "HEALTH-JOURNAL-PLANEN-1",
  }];
}

function richtlinie() {
  const protokoll = {
    async schreibeDurable() {},
  };
  return new BedienerRichtlinienDienst(protokoll);
}

function anforderung(overrides = {}) {
  return {
    schemaVersion: 1,
    aktivierungsId: "PLANEN-AKT-1",
    faehigkeitId: "merchant.bank.planen",
    anbieterModulId: "merchant-core-a",
    anbieterVersion: "1",
    policyId: "PLANEN-AKTIVIERUNG-V1",
    healthEvidence: health(),
    jetztMs: 100,
    ...overrides,
  };
}

async function gestarteteRuntime({ mitRichtlinie = true, modus = "PLANEN" } = {}) {
  const policy = mitRichtlinie ? richtlinie() : null;
  const runtime = new V5ProduktionsRuntime(definition(modus), policy);
  assert.equal((await runtime.starte()).erfolgreich, true);
  return { runtime, policy };
}

test("PLANEN bleibt beim Runtime-Start inaktiv und Kernansicht bietet keinen Aktivierungs-Bypass", async () => {
  const { runtime } = await gestarteteRuntime();
  const kern = runtime.kernKomponenten();

  assert.equal(runtime.status().aktiveModule, 0);
  assert.equal(runtime.status().aktiveFaehigkeiten, 0);
  assert.equal("aktiviere" in kern.module, false);
  assert.equal("aktiviereNichtMutierend" in kern.faehigkeiten, false);
});

test("kontrollierte PLANEN-Aktivierung verlangt Runtime, Supervisor, Policy und exakte Providerbindung", async () => {
  const { runtime } = await gestarteteRuntime();
  runtime.erfasseOperationsMetrik(metrischeBasis());

  const ergebnis = runtime.aktivierePlanenFaehigkeit(anforderung());

  assert.equal(ergebnis.erfolgreich, true);
  assert.equal(ergebnis.grund, "V5_PLANEN_AKTIVIERUNG_ERFOLGREICH");
  assert.equal(ergebnis.wirkung, "AKTIVIERT");
  assert.deepEqual(ergebnis.evidenceIds, ["HEALTH-JOURNAL-PLANEN-1"]);
  assert.equal(ergebnis.gameplayAutoritaet, false);
  assert.equal(ergebnis.rawWriteAutoritaet, false);
  assert.equal(ergebnis.actionAuthority, false);

  const status = runtime.status();
  assert.equal(status.aktiveModule, 1);
  assert.equal(status.aktiveFaehigkeiten, 1);
  assert.equal(status.aktiveMutierendeFaehigkeiten, 0);
  assert.equal(status.gameplayAutoritaet, false);
  assert.equal(status.rawWriteAutoritaet, false);
  assert.equal(status.actionAuthority, false);

  const audit = runtime.planenAktivierungsAudit();
  assert.equal(audit.length, 1);
  assert.equal(audit[0].aktivierungsId, "PLANEN-AKT-1");
  assert.equal(audit[0].policyId, "PLANEN-AKTIVIERUNG-V1");
  assert.equal(audit[0].wirkung, "AKTIVIERT");
  assert.deepEqual(audit[0].evidenceIds, ["HEALTH-JOURNAL-PLANEN-1"]);
});

test("PLANEN-Aktivierung blockiert ohne explizite deny-only Bediener-Richtlinie", async () => {
  const { runtime } = await gestarteteRuntime({ mitRichtlinie: false });
  runtime.erfasseOperationsMetrik(metrischeBasis());

  const ergebnis = runtime.aktivierePlanenFaehigkeit(anforderung());

  assert.equal(ergebnis.erfolgreich, false);
  assert.equal(
    ergebnis.grund,
    "V5_PLANEN_AKTIVIERUNG_BEDIENER_RICHTLINIE_FEHLT",
  );
  assert.equal(runtime.status().aktiveModule, 0);
  assert.equal(runtime.status().aktiveFaehigkeiten, 0);
});

test("PLANEN-Aktivierung blockiert ohne bereiten Headless Supervisor", async () => {
  const { runtime } = await gestarteteRuntime();

  const ohneMetrik = runtime.aktivierePlanenFaehigkeit(anforderung());
  assert.equal(ohneMetrik.erfolgreich, false);
  assert.equal(
    ohneMetrik.grund,
    "V5_PLANEN_AKTIVIERUNG_SUPERVISOR_NICHT_BEREIT",
  );

  runtime.erfasseOperationsMetrik(metrischeBasis());
  const stale = runtime.aktivierePlanenFaehigkeit(anforderung({
    aktivierungsId: "PLANEN-AKT-STALE",
    jetztMs: 300,
  }));
  assert.equal(stale.erfolgreich, false);
  assert.equal(
    stale.grund,
    "V5_PLANEN_AKTIVIERUNG_SUPERVISOR_NICHT_BEREIT",
  );
  assert.equal(runtime.status().aktiveFaehigkeiten, 0);
});

test("Capability-Sperre und NOTHALT verhindern PLANEN-Aktivierung", async () => {
  const sperre = await gestarteteRuntime();
  sperre.runtime.erfasseOperationsMetrik(metrischeBasis());
  await sperre.policy.wendeDenyAn({
    schemaVersion: 1,
    befehlId: "DENY-PLANEN-1",
    bedienerId: "operator",
    zeitMs: 95,
    art: "FAEHIGKEIT_SPERREN",
    faehigkeitId: "merchant.bank.planen",
  });

  const gesperrt = sperre.runtime.aktivierePlanenFaehigkeit(anforderung());
  assert.equal(gesperrt.erfolgreich, false);
  assert.equal(
    gesperrt.grund,
    "V5_PLANEN_AKTIVIERUNG_DURCH_POLICY_GESPERRT",
  );
  assert.equal(sperre.runtime.status().aktiveFaehigkeiten, 0);

  const nothalt = await gestarteteRuntime();
  nothalt.runtime.erfasseOperationsMetrik(metrischeBasis());
  await nothalt.policy.wendeDenyAn({
    schemaVersion: 1,
    befehlId: "NOTHALT-PLANEN-1",
    bedienerId: "operator",
    zeitMs: 95,
    art: "NOTHALT_AKTIVIEREN",
  });

  const blockiert = nothalt.runtime.aktivierePlanenFaehigkeit(anforderung());
  assert.equal(blockiert.erfolgreich, false);
  assert.equal(
    blockiert.grund,
    "V5_PLANEN_AKTIVIERUNG_NOTHALT_AKTIV",
  );
  assert.equal(nothalt.runtime.status().aktiveFaehigkeiten, 0);
});

test("PLANEN-Aktivierung blockiert falsche Providerbindung und ungesundes Modul", async () => {
  const provider = await gestarteteRuntime();
  provider.runtime.erfasseOperationsMetrik(metrischeBasis());

  const falsch = provider.runtime.aktivierePlanenFaehigkeit(anforderung({
    anbieterVersion: "2",
  }));
  assert.equal(falsch.erfolgreich, false);
  assert.equal(
    falsch.grund,
    "V5_PLANEN_AKTIVIERUNG_PROVIDER_BINDUNG_UNGUELTIG",
  );

  provider.runtime.kernKomponenten().module.setzeGesundheit(
    "merchant-core-a",
    "1",
    "DEGRADIERT",
  );
  const ungesund = provider.runtime.aktivierePlanenFaehigkeit(anforderung({
    aktivierungsId: "PLANEN-AKT-UNGESUND",
  }));
  assert.equal(ungesund.erfolgreich, false);
  assert.equal(
    ungesund.grund,
    "V5_PLANEN_AKTIVIERUNG_MODUL_NICHT_GESUND",
  );
  assert.equal(provider.runtime.status().aktiveFaehigkeiten, 0);
});

test("MUTIEREN kann ueber den PLANEN-Pfad niemals aktiviert werden", async () => {
  const { runtime } = await gestarteteRuntime({ modus: "MUTIEREN" });
  runtime.erfasseOperationsMetrik(metrischeBasis());

  const ergebnis = runtime.aktivierePlanenFaehigkeit(anforderung({
    faehigkeitId: "merchant.bank.mutieren",
  }));

  assert.equal(ergebnis.erfolgreich, false);
  assert.equal(ergebnis.grund, "V5_PLANEN_AKTIVIERUNG_NUR_PLANEN_ERLAUBT");
  assert.equal(runtime.status().aktiveFaehigkeiten, 0);
  assert.equal(runtime.status().aktiveMutierendeFaehigkeiten, 0);
});

test("kontrollierter Runtime-Stop entzieht zuvor aktivierte PLANEN-Authority", async () => {
  const { runtime } = await gestarteteRuntime();
  runtime.erfasseOperationsMetrik(metrischeBasis());
  assert.equal(
    runtime.aktivierePlanenFaehigkeit(anforderung()).erfolgreich,
    true,
  );

  const stopp = await runtime.stoppe("BETREIBER_STOPP");

  assert.equal(stopp.erfolgreich, true);
  assert.equal(runtime.status().prozessLaeuft, false);
  assert.equal(runtime.status().aktiveModule, 0);
  assert.equal(runtime.status().aktiveFaehigkeiten, 0);
  assert.equal(runtime.status().aktiveMutierendeFaehigkeiten, 0);
});
