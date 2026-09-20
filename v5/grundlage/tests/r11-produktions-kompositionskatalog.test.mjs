import test from "node:test";
import assert from "node:assert/strict";

import {
  MERCHANT_CORE_A_MODUL_ID,
  MERCHANT_CORE_A_MODUL_VERSION,
  MERCHANT_CORE_A_PLANUNGS_FAEHIGKEIT_IDS,
  MerchantWorkflowProvider,
  PRODUKTIONS_KOMPOSITIONS_KATALOG_STATUS,
  V5ProduktionsRuntime,
  erstelleKanonischeProduktionsKomposition,
} from "../../erzeugt/index.js";

function healthAnforderungen() {
  return [{
    healthId: "journal",
    erforderlich: true,
  }];
}

function demand() {
  return {
    schemaVersion: 1,
    demandId: "D-1",
    art: "INVENTAR_AUFRAEUMEN",
    characterId: "My_Merchant",
    accountId: null,
    erstelltAmMs: 100,
    deadlineAmMs: 1_000,
    prioritaetsKlasse: "NORMALE_ARBEIT",
    prioritaetsRang: 100,
    ressourcenIds: [],
    payloadFingerprint: "fp-demand-1",
    wissensSnapshot: {
      gitCommit: "a".repeat(40),
      quellenSha256: ["b".repeat(64)],
    },
  };
}

test("kanonische Produktionskomposition registriert nur belegte Module default-deny", () => {
  const definition = erstelleKanonischeProduktionsKomposition(
    healthAnforderungen(),
  );

  assert.equal(
    PRODUKTIONS_KOMPOSITIONS_KATALOG_STATUS,
    "DEFAULT_DENY_PLANEN_REGISTRIERT_INAKTIV",
  );
  assert.equal(definition.schemaVersion, 1);
  assert.equal(definition.modulDefinitionen.length, 1);
  assert.equal(definition.faehigkeitsDefinitionen.length, 8);
  assert.deepEqual(definition.healthAnforderungen, healthAnforderungen());

  const [merchant] = definition.modulDefinitionen;
  assert.equal(merchant.modulId, MERCHANT_CORE_A_MODUL_ID);
  assert.equal(merchant.modulId, "merchant-core-a");
  assert.equal(merchant.modulVersion, MERCHANT_CORE_A_MODUL_VERSION);
  assert.equal(merchant.standardAktiv, false);
  assert.deepEqual(
    merchant.bereitgestellteFaehigkeiten,
    [...MERCHANT_CORE_A_PLANUNGS_FAEHIGKEIT_IDS],
  );
  assert.deepEqual(merchant.benoetigteFaehigkeiten, []);
});

test("Merchant-Workflows verwenden exakt die kanonische Modulidentitaet", () => {
  const plan = new MerchantWorkflowProvider().plane(demand());

  assert.equal(plan.eigentuemerModulId, MERCHANT_CORE_A_MODUL_ID);
  assert.equal(plan.eigentuemerModulId, "merchant-core-a");
  assert.equal(plan.gameplayAutoritaet, false);
  assert.equal(plan.rawWriteAutoritaet, false);
});

test("Start der kanonischen Komposition aktiviert weder Module noch Capabilities", async () => {
  const runtime = new V5ProduktionsRuntime(
    erstelleKanonischeProduktionsKomposition(healthAnforderungen()),
  );

  const vorStart = runtime.status();
  assert.equal(vorStart.registrierteModule, 1);
  assert.equal(vorStart.aktiveModule, 0);
  assert.equal(vorStart.registrierteFaehigkeiten, 8);
  assert.equal(vorStart.aktiveFaehigkeiten, 0);
  assert.equal(vorStart.aktiveMutierendeFaehigkeiten, 0);

  const start = await runtime.starte();
  const nachStart = runtime.status();

  assert.equal(start.erfolgreich, true);
  assert.equal(nachStart.prozessLaeuft, true);
  assert.equal(nachStart.aktiveModule, 0);
  assert.equal(nachStart.aktiveFaehigkeiten, 0);
  assert.equal(nachStart.aktiveMutierendeFaehigkeiten, 0);
  assert.equal(nachStart.gameplayAutoritaet, false);
  assert.equal(nachStart.rawWriteAutoritaet, false);
  assert.equal(nachStart.actionAuthority, false);
  assert.equal(nachStart.automatischerNeustart, false);
});

test("Produktionskomposition kopiert Health-Anforderungen unveraenderlich", () => {
  const health = healthAnforderungen();
  const definition = erstelleKanonischeProduktionsKomposition(health);

  health[0].healthId = "manipuliert";

  assert.equal(definition.healthAnforderungen[0].healthId, "journal");
  assert.equal(Object.isFrozen(definition.healthAnforderungen), true);
  assert.equal(Object.isFrozen(definition.healthAnforderungen[0]), true);
});

test("Merchant-Produktionskatalog registriert exakt acht PLANEN-Capabilities inaktiv", () => {
  const definition = erstelleKanonischeProduktionsKomposition(
    healthAnforderungen(),
  );

  assert.deepEqual(
    definition.faehigkeitsDefinitionen.map(x => x.faehigkeitId),
    [...MERCHANT_CORE_A_PLANUNGS_FAEHIGKEIT_IDS],
  );
  assert.equal(
    definition.faehigkeitsDefinitionen.every(
      x => x.anbieterModulId === MERCHANT_CORE_A_MODUL_ID
        && x.anbieterVersion === MERCHANT_CORE_A_MODUL_VERSION
        && x.modus === "PLANEN"
        && x.status === "VERFUEGBAR"
        && x.standardAktiv === false,
    ),
    true,
  );

  const runtime = new V5ProduktionsRuntime(definition);
  const eintraege = runtime.kernKomponenten().faehigkeiten.sicht();
  assert.equal(eintraege.length, 8);
  assert.equal(eintraege.every(x => x.modus === "PLANEN"), true);
  assert.equal(eintraege.every(x => x.aktiv === false), true);
  assert.equal(eintraege.some(x => x.modus === "MUTIEREN"), false);
});
