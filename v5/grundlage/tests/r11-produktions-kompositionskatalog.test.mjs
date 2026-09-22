import test from "node:test";
import assert from "node:assert/strict";

import {
  EQUIPMENT_CORE_MODUL_ID,
  EQUIPMENT_CORE_MODUL_VERSION,
  EQUIPMENT_EQUIP_FAEHIGKEIT_ID,
  MERCHANT_CORE_A_MODUL_ID,
  MERCHANT_CORE_A_MODUL_VERSION,
  MERCHANT_CORE_A_PLANUNGS_FAEHIGKEIT_IDS,
  MERCHANT_BANK_CORE_MODUL_ID,
  MERCHANT_BANK_CORE_MODUL_VERSION,
  MERCHANT_BANK_DEPOSIT_FAEHIGKEIT_ID,
  MERCHANT_BANK_WITHDRAW_FAEHIGKEIT_ID,
  MERCHANT_BANK_SWAP_FAEHIGKEIT_ID,
  MERCHANT_BANK_RETRIEVE_FAEHIGKEIT_ID,
  MERCHANT_BANK_STORE_FAEHIGKEIT_ID,
  MERCHANT_MLUCK_CORE_MODUL_ID,
  MERCHANT_MLUCK_CORE_MODUL_VERSION,
  MERCHANT_MLUCK_FAEHIGKEIT_ID,
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
    "DEFAULT_DENY_PLANEN_EQUIP_UND_BANK_GOLD_MUTIEREN_REGISTRIERT_INAKTIV",
  );
  assert.equal(definition.schemaVersion, 1);
  assert.equal(definition.modulDefinitionen.length, 4);
  assert.equal(definition.faehigkeitsDefinitionen.length, 15);
  assert.deepEqual(definition.healthAnforderungen, healthAnforderungen());

  const [merchant, bank, equipment, mluck] = definition.modulDefinitionen;
  assert.equal(merchant.modulId, MERCHANT_CORE_A_MODUL_ID);
  assert.equal(merchant.modulId, "merchant-core-a");
  assert.equal(merchant.modulVersion, MERCHANT_CORE_A_MODUL_VERSION);
  assert.equal(merchant.standardAktiv, false);
  assert.deepEqual(
    merchant.bereitgestellteFaehigkeiten,
    [...MERCHANT_CORE_A_PLANUNGS_FAEHIGKEIT_IDS],
  );
  assert.deepEqual(merchant.benoetigteFaehigkeiten, []);

  assert.equal(bank.modulId, MERCHANT_BANK_CORE_MODUL_ID);
  assert.equal(bank.modulId, "merchant-bank-core");
  assert.equal(bank.modulVersion, MERCHANT_BANK_CORE_MODUL_VERSION);
  assert.equal(bank.standardAktiv, false);
  assert.deepEqual(
    bank.bereitgestellteFaehigkeiten,
    [
      MERCHANT_BANK_DEPOSIT_FAEHIGKEIT_ID,
      MERCHANT_BANK_WITHDRAW_FAEHIGKEIT_ID,
      MERCHANT_BANK_SWAP_FAEHIGKEIT_ID,
      MERCHANT_BANK_RETRIEVE_FAEHIGKEIT_ID,
      MERCHANT_BANK_STORE_FAEHIGKEIT_ID,
    ],
  );
  assert.deepEqual(bank.benoetigteFaehigkeiten, []);

  assert.equal(equipment.modulId, EQUIPMENT_CORE_MODUL_ID);
  assert.equal(equipment.modulId, "equipment-core");
  assert.equal(equipment.modulVersion, EQUIPMENT_CORE_MODUL_VERSION);
  assert.equal(equipment.standardAktiv, false);
  assert.deepEqual(
    equipment.bereitgestellteFaehigkeiten,
    [EQUIPMENT_EQUIP_FAEHIGKEIT_ID],
  );
  assert.deepEqual(equipment.benoetigteFaehigkeiten, []);

  assert.equal(mluck.modulId, MERCHANT_MLUCK_CORE_MODUL_ID);
  assert.equal(mluck.modulId, "merchant-mluck-core");
  assert.equal(mluck.modulVersion, MERCHANT_MLUCK_CORE_MODUL_VERSION);
  assert.equal(mluck.standardAktiv, false);
  assert.deepEqual(
    mluck.bereitgestellteFaehigkeiten,
    [MERCHANT_MLUCK_FAEHIGKEIT_ID],
  );
  assert.deepEqual(mluck.benoetigteFaehigkeiten, []);
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
  assert.equal(vorStart.registrierteModule, 4);
  assert.equal(vorStart.aktiveModule, 0);
  assert.equal(vorStart.registrierteFaehigkeiten, 15);
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

  const planen = definition.faehigkeitsDefinitionen.filter(
    x => x.modus === "PLANEN",
  );
  assert.deepEqual(
    planen.map(x => x.faehigkeitId),
    [...MERCHANT_CORE_A_PLANUNGS_FAEHIGKEIT_IDS],
  );
  assert.equal(
    planen.every(
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
  assert.equal(eintraege.length, 15);
  assert.equal(
    eintraege.filter(x => x.modus === "PLANEN").length,
    8,
  );
  assert.equal(eintraege.every(x => x.aktiv === false), true);
});

test("Produktionskatalog registriert Equip, Bank und MLuck getrennt default-off", () => {
  const definition = erstelleKanonischeProduktionsKomposition(
    healthAnforderungen(),
  );
  const mutierend = definition.faehigkeitsDefinitionen.filter(
    x => x.modus === "MUTIEREN",
  );

  assert.equal(mutierend.length, 7);
  const equip = mutierend.find(
    x => x.faehigkeitId === EQUIPMENT_EQUIP_FAEHIGKEIT_ID,
  );
  const bank = mutierend.find(
    x => x.faehigkeitId === MERCHANT_BANK_DEPOSIT_FAEHIGKEIT_ID,
  );
  const withdraw = mutierend.find(
    x => x.faehigkeitId === MERCHANT_BANK_WITHDRAW_FAEHIGKEIT_ID,
  );
  const swap = mutierend.find(
    x => x.faehigkeitId === MERCHANT_BANK_SWAP_FAEHIGKEIT_ID,
  );
  const retrieve = mutierend.find(
    x => x.faehigkeitId === MERCHANT_BANK_RETRIEVE_FAEHIGKEIT_ID,
  );
  const store = mutierend.find(
    x => x.faehigkeitId === MERCHANT_BANK_STORE_FAEHIGKEIT_ID,
  );
  const mluck = mutierend.find(
    x => x.faehigkeitId === MERCHANT_MLUCK_FAEHIGKEIT_ID,
  );
  assert.ok(equip);
  assert.ok(bank);
  assert.ok(withdraw);
  assert.ok(swap);
  assert.ok(retrieve);
  assert.ok(store);
  assert.ok(mluck);
  assert.equal(equip.anbieterModulId, EQUIPMENT_CORE_MODUL_ID);
  assert.equal(equip.anbieterVersion, EQUIPMENT_CORE_MODUL_VERSION);
  assert.equal(bank.anbieterModulId, MERCHANT_BANK_CORE_MODUL_ID);
  assert.equal(bank.anbieterVersion, MERCHANT_BANK_CORE_MODUL_VERSION);
  assert.equal(withdraw.anbieterModulId, MERCHANT_BANK_CORE_MODUL_ID);
  assert.equal(withdraw.anbieterVersion, MERCHANT_BANK_CORE_MODUL_VERSION);
  assert.equal(swap.anbieterModulId, MERCHANT_BANK_CORE_MODUL_ID);
  assert.equal(swap.anbieterVersion, MERCHANT_BANK_CORE_MODUL_VERSION);
  assert.equal(retrieve.anbieterModulId, MERCHANT_BANK_CORE_MODUL_ID);
  assert.equal(retrieve.anbieterVersion, MERCHANT_BANK_CORE_MODUL_VERSION);
  assert.equal(store.anbieterModulId, MERCHANT_BANK_CORE_MODUL_ID);
  assert.equal(store.anbieterVersion, MERCHANT_BANK_CORE_MODUL_VERSION);
  assert.equal(mluck.anbieterModulId, MERCHANT_MLUCK_CORE_MODUL_ID);
  assert.equal(mluck.anbieterVersion, MERCHANT_MLUCK_CORE_MODUL_VERSION);
  assert.equal(
    mutierend.every(x =>
      x.status === "VERFUEGBAR" && x.standardAktiv === false),
    true,
  );

  const runtime = new V5ProduktionsRuntime(definition);
  const eintraege = runtime.kernKomponenten().faehigkeiten.sicht();
  const equipEintrag = eintraege.find(
    x => x.faehigkeitId === EQUIPMENT_EQUIP_FAEHIGKEIT_ID,
  );
  const bankEintrag = eintraege.find(
    x => x.faehigkeitId === MERCHANT_BANK_DEPOSIT_FAEHIGKEIT_ID,
  );
  const withdrawEintrag = eintraege.find(
    x => x.faehigkeitId === MERCHANT_BANK_WITHDRAW_FAEHIGKEIT_ID,
  );
  const swapEintrag = eintraege.find(
    x => x.faehigkeitId === MERCHANT_BANK_SWAP_FAEHIGKEIT_ID,
  );
  const retrieveEintrag = eintraege.find(
    x => x.faehigkeitId === MERCHANT_BANK_RETRIEVE_FAEHIGKEIT_ID,
  );
  const storeEintrag = eintraege.find(
    x => x.faehigkeitId === MERCHANT_BANK_STORE_FAEHIGKEIT_ID,
  );
  const mluckEintrag = eintraege.find(
    x => x.faehigkeitId === MERCHANT_MLUCK_FAEHIGKEIT_ID,
  );
  assert.ok(equipEintrag);
  assert.ok(bankEintrag);
  assert.ok(withdrawEintrag);
  assert.ok(swapEintrag);
  assert.ok(retrieveEintrag);
  assert.ok(storeEintrag);
  assert.ok(mluckEintrag);
  assert.equal(equipEintrag.modus, "MUTIEREN");
  assert.equal(bankEintrag.modus, "MUTIEREN");
  assert.equal(withdrawEintrag.modus, "MUTIEREN");
  assert.equal(swapEintrag.modus, "MUTIEREN");
  assert.equal(retrieveEintrag.modus, "MUTIEREN");
  assert.equal(storeEintrag.modus, "MUTIEREN");
  assert.equal(mluckEintrag.modus, "MUTIEREN");
  assert.equal(equipEintrag.aktiv, false);
  assert.equal(bankEintrag.aktiv, false);
  assert.equal(withdrawEintrag.aktiv, false);
  assert.equal(swapEintrag.aktiv, false);
  assert.equal(retrieveEintrag.aktiv, false);
  assert.equal(storeEintrag.aktiv, false);
  assert.equal(mluckEintrag.aktiv, false);
  assert.equal(runtime.status().aktiveMutierendeFaehigkeiten, 0);
  assert.equal(
    "aktiviereNichtMutierend" in runtime.kernKomponenten().faehigkeiten,
    false,
  );
});
