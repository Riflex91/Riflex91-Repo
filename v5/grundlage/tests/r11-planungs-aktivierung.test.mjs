import test from "node:test";
import assert from "node:assert/strict";

import {
  BedienerRichtlinienDienst,
  FaehigkeitsRegister,
  MERCHANT_CORE_A_MODUL_ID,
  MERCHANT_CORE_A_MODUL_VERSION,
  MERCHANT_CORE_A_PLANUNGS_FAEHIGKEIT_IDS,
  PLANUNGS_AKTIVIERUNGS_POLICY_ID,
  V5ProduktionsRuntime,
  erstelleKanonischeProduktionsKomposition,
} from "../../erzeugt/index.js";

function health(gueltigBisMs = 200) {
  return [{
    healthId: "journal",
    zustand: "GESUND",
    beobachtetAmMs: 90,
    gueltigBisMs,
    evidenceId: "HEALTH-JOURNAL-1",
  }];
}

function metrik() {
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

function anfrage(overrides = {}) {
  return {
    schemaVersion: 1,
    aktivierungsId: "ACT-PLAN-1",
    faehigkeitId: MERCHANT_CORE_A_PLANUNGS_FAEHIGKEIT_IDS[0],
    anbieterModulId: MERCHANT_CORE_A_MODUL_ID,
    anbieterVersion: MERCHANT_CORE_A_MODUL_VERSION,
    grund: "Explizite produktive PLANEN-Aktivierung",
    ...overrides,
  };
}

function baueRuntime(optionen = {}) {
  const bedienerEintraege = [];
  const aktivierungsEintraege = [];
  const bedienerRichtlinie = new BedienerRichtlinienDienst({
    async schreibeDurable(eintrag) {
      bedienerEintraege.push(eintrag);
    },
  });
  const runtime = new V5ProduktionsRuntime(
    optionen.definition ?? erstelleKanonischeProduktionsKomposition([
      { healthId: "journal", erforderlich: true },
    ]),
    {
      bedienerRichtlinie,
      planungsAktivierungsProtokoll: {
        async schreibeDurable(eintrag) {
          if (optionen.auditFehler === true) {
            throw new Error("AUDIT_DISK_DOWN");
          }
          aktivierungsEintraege.push(eintrag);
        },
      },
    },
  );
  runtime.erfasseOperationsMetrik(metrik());
  return {
    runtime,
    bedienerRichtlinie,
    bedienerEintraege,
    aktivierungsEintraege,
  };
}

test("PLANEN-Aktivierung verlangt eine laufende Runtime und schreibt vorher kein Audit", async () => {
  const { runtime, aktivierungsEintraege } = baueRuntime();

  const ergebnis = await runtime.aktivierePlanungsFaehigkeit(
    anfrage(),
    health(),
    100,
  );

  assert.equal(ergebnis.erfolgreich, false);
  assert.equal(ergebnis.grund, "PLANUNGS_AKTIVIERUNG_RUNTIME_NICHT_LAEUFT");
  assert.equal(ergebnis.faehigkeitAktiv, false);
  assert.equal(aktivierungsEintraege.length, 0);
  assert.equal(runtime.status().aktiveFaehigkeiten, 0);
});

test("gesunde PLANEN-Capability wird explizit auditierbar aktiviert ohne Action-Authority", async () => {
  const { runtime, aktivierungsEintraege } = baueRuntime();
  await runtime.starte();

  const ergebnis = await runtime.aktivierePlanungsFaehigkeit(
    anfrage(),
    health(),
    100,
  );

  assert.equal(ergebnis.erfolgreich, true);
  assert.equal(ergebnis.grund, "PLANUNGS_AKTIVIERUNG_ERFOLGREICH");
  assert.equal(ergebnis.modulAktiv, true);
  assert.equal(ergebnis.faehigkeitAktiv, true);
  assert.equal(ergebnis.gameplayAutoritaet, false);
  assert.equal(ergebnis.rawWriteAutoritaet, false);
  assert.equal(ergebnis.actionAuthority, false);
  assert.equal(runtime.status().aktiveModule, 1);
  assert.equal(runtime.status().aktiveFaehigkeiten, 1);
  assert.equal(runtime.status().aktiveMutierendeFaehigkeiten, 0);

  assert.equal(aktivierungsEintraege.length, 1);
  assert.equal(
    aktivierungsEintraege[0].art,
    "PLANEN_AKTIVIERUNG_VOR_WIRKUNG",
  );
  assert.equal(
    aktivierungsEintraege[0].policyId,
    PLANUNGS_AKTIVIERUNGS_POLICY_ID,
  );
  assert.deepEqual(
    aktivierungsEintraege[0].healthEvidenceIds,
    ["HEALTH-JOURNAL-1"],
  );

  const [authority] = runtime.kernKomponenten().autoritaetsStatus.sicht(100);
  assert.equal(authority.capabilityId, anfrage().faehigkeitId);
  assert.equal(authority.ownerModulId, MERCHANT_CORE_A_MODUL_ID);
  assert.equal(authority.policyId, PLANUNGS_AKTIVIERUNGS_POLICY_ID);
  assert.equal(authority.aktiv, true);
  assert.equal(authority.gueltigBisMs, 200);

  const erneut = await runtime.aktivierePlanungsFaehigkeit(
    { ...anfrage(), aktivierungsId: "ACT-PLAN-2" },
    health(),
    101,
  );
  assert.equal(erneut.erfolgreich, false);
  assert.equal(
    erneut.grund,
    "PLANUNGS_AKTIVIERUNG_FAEHIGKEIT_BEREITS_AKTIV",
  );
  assert.equal(aktivierungsEintraege.length, 1);
});

test("stale Health oder fehlende Operations-Bereitschaft blockiert PLANEN-Aktivierung fail-closed", async () => {
  const { runtime, aktivierungsEintraege } = baueRuntime();
  await runtime.starte();

  const ergebnis = await runtime.aktivierePlanungsFaehigkeit(
    anfrage(),
    health(99),
    100,
  );

  assert.equal(ergebnis.erfolgreich, false);
  assert.equal(
    ergebnis.grund,
    "PLANUNGS_AKTIVIERUNG_OPERATIONS_NICHT_BEREIT",
  );
  assert.equal(runtime.status().aktiveModule, 0);
  assert.equal(runtime.status().aktiveFaehigkeiten, 0);
  assert.equal(aktivierungsEintraege.length, 0);
});

test("Capability-Deny und NOTHALT dominieren jede PLANEN-Aktivierung", async () => {
  const gesperrt = baueRuntime();
  await gesperrt.runtime.starte();
  await gesperrt.bedienerRichtlinie.wendeDenyAn({
    schemaVersion: 1,
    befehlId: "DENY-1",
    bedienerId: "OP-1",
    zeitMs: 99,
    art: "FAEHIGKEIT_SPERREN",
    faehigkeitId: anfrage().faehigkeitId,
  });

  const denyErgebnis = await gesperrt.runtime.aktivierePlanungsFaehigkeit(
    anfrage(),
    health(),
    100,
  );
  assert.equal(denyErgebnis.erfolgreich, false);
  assert.equal(
    denyErgebnis.grund,
    "PLANUNGS_AKTIVIERUNG_DURCH_OPERATOR_GESPERRT",
  );
  assert.equal(gesperrt.aktivierungsEintraege.length, 0);

  const nothalt = baueRuntime();
  await nothalt.runtime.starte();
  await nothalt.bedienerRichtlinie.wendeDenyAn({
    schemaVersion: 1,
    befehlId: "STOP-1",
    bedienerId: "OP-1",
    zeitMs: 99,
    art: "NOTHALT_AKTIVIEREN",
  });
  const stoppErgebnis = await nothalt.runtime.aktivierePlanungsFaehigkeit(
    anfrage(),
    health(),
    100,
  );
  assert.equal(stoppErgebnis.erfolgreich, false);
  assert.equal(stoppErgebnis.grund, "PLANUNGS_AKTIVIERUNG_NOTHALT_AKTIV");
  assert.equal(nothalt.aktivierungsEintraege.length, 0);
});

test("fehlgeschlagenes durable Aktivierungs-Audit laesst Modul und Capability inaktiv", async () => {
  const { runtime } = baueRuntime({ auditFehler: true });
  await runtime.starte();

  const ergebnis = await runtime.aktivierePlanungsFaehigkeit(
    anfrage(),
    health(),
    100,
  );

  assert.equal(ergebnis.erfolgreich, false);
  assert.equal(
    ergebnis.grund,
    "PLANUNGS_AKTIVIERUNG_AUDIT_NICHT_DURABLE",
  );
  assert.equal(runtime.status().aktiveModule, 0);
  assert.equal(runtime.status().aktiveFaehigkeiten, 0);
});

test("MUTIEREN-Capability kann den PLANEN-Aktivierungspfad niemals benutzen", async () => {
  const definition = {
    schemaVersion: 1,
    modulDefinitionen: [{
      schemaVersion: 1,
      modulId: "merchant-mut",
      modulVersion: "1",
      bereitgestellteFaehigkeiten: ["merchant.transfer"],
      benoetigteFaehigkeiten: [],
      bereitgestelltePorts: [],
      benoetigtePorts: [],
      standardAktiv: false,
    }],
    faehigkeitsDefinitionen: [{
      schemaVersion: 1,
      faehigkeitId: "merchant.transfer",
      anbieterModulId: "merchant-mut",
      anbieterVersion: "1",
      modus: "MUTIEREN",
      status: "VERFUEGBAR",
      standardAktiv: false,
    }],
    healthAnforderungen: [{ healthId: "journal", erforderlich: true }],
  };
  const { runtime, aktivierungsEintraege } = baueRuntime({ definition });
  await runtime.starte();

  const ergebnis = await runtime.aktivierePlanungsFaehigkeit(
    anfrage({
      aktivierungsId: "ACT-MUT-1",
      faehigkeitId: "merchant.transfer",
      anbieterModulId: "merchant-mut",
      anbieterVersion: "1",
    }),
    health(),
    100,
  );

  assert.equal(ergebnis.erfolgreich, false);
  assert.equal(ergebnis.grund, "PLANUNGS_AKTIVIERUNG_NUR_PLANEN");
  assert.equal(runtime.status().aktiveMutierendeFaehigkeiten, 0);
  assert.equal(aktivierungsEintraege.length, 0);
});

test("Faehigkeits-Lifecycle kann bei mehreren Provider-Versionen exakt binden", () => {
  const register = new FaehigkeitsRegister();
  for (const version of ["1", "2"]) {
    register.registriere({
      schemaVersion: 1,
      faehigkeitId: "merchant.plan",
      anbieterModulId: "merchant-a",
      anbieterVersion: version,
      modus: "PLANEN",
      status: "VERFUEGBAR",
      standardAktiv: false,
    });
  }

  const aktiviert = register.aktiviereNichtMutierend(
    "merchant.plan",
    "merchant-a",
    "2",
  );

  assert.equal(aktiviert.anbieterVersion, "2");
  assert.equal(
    register.sicht().find(x => x.anbieterVersion === "1").aktiv,
    false,
  );
  assert.equal(
    register.sicht().find(x => x.anbieterVersion === "2").aktiv,
    true,
  );
});

test("Runtime ohne explizite Aktivierungs-Abhaengigkeiten bleibt fail-closed", async () => {
  const runtime = new V5ProduktionsRuntime(
    erstelleKanonischeProduktionsKomposition([
      { healthId: "journal", erforderlich: true },
    ]),
  );
  runtime.erfasseOperationsMetrik(metrik());
  await runtime.starte();

  await assert.rejects(
    () => runtime.aktivierePlanungsFaehigkeit(anfrage(), health(), 100),
    /PLANUNGS_AKTIVIERUNG_NICHT_KONFIGURIERT/,
  );
  assert.equal(runtime.status().aktiveFaehigkeiten, 0);
});
