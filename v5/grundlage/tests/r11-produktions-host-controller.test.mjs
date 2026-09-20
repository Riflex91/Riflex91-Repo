import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  BedienerRichtlinienDienst,
  MERCHANT_CORE_A_MODUL_ID,
  MERCHANT_CORE_A_MODUL_VERSION,
  MERCHANT_CORE_A_PLANUNGS_FAEHIGKEIT_IDS,
  ProduktivesV5GesamtfreigabeGate,
  V5ProduktionsBootstrap,
  V5ProduktionsHostController,
  V5ProduktionsRuntime,
  V5_PRODUKTIONS_STORAGE_HEALTH_ID,
  erstelleKanonischeProduktionsKomposition,
} from "../../erzeugt/index.js";

function liesJson(relativ) {
  return JSON.parse(fs.readFileSync(new URL(relativ, import.meta.url), "utf8"));
}

const bereitschaft = liesJson("../../bereitschaft/laufzeit-bereitschaft.json");
const gesamtfreigabe = liesJson("../../roadmap/gesamtfreigabe.json");

function policy() {
  return new BedienerRichtlinienDienst({
    async schreibeDurable() {},
  });
}

function audit() {
  return {
    eintraege: [],
    async schreibeDurable(intent) {
      this.eintraege = [...this.eintraege, intent];
      return {
        durable: true,
        bestaetigungsId: "HOST-AUDIT:" + intent.aktivierungsId,
        aktivierungsId: intent.aktivierungsId,
      };
    },
  };
}

class OperationsQuelleFake {
  constructor() {
    this.fehler = false;
    this.zustand = "GESUND";
    this.aufrufe = 0;
  }

  async beobachte(jetztMs) {
    this.aufrufe += 1;
    if (this.fehler) throw new Error("OPERATIONS_QUELLE_DOWN");
    return {
      schemaVersion: 1,
      healthEvidence: [{
        healthId: V5_PRODUKTIONS_STORAGE_HEALTH_ID,
        zustand: this.zustand,
        beobachtetAmMs: jetztMs,
        gueltigBisMs: jetztMs + 1_000,
        evidenceId: "HOST-STORAGE-" + jetztMs,
      }],
      operationsMetrik: {
        schemaVersion: 1,
        zeitMs: jetztMs,
        ssdIoLatenzMs: 2,
        ioQueueTiefe: 0,
        backpressureAktiv: false,
        freieBytes: 50_000_000,
        recorderDrops: 0,
      },
    };
  }
}

function baueSystem() {
  const bediener = policy();
  const aktivierungsAudit = audit();
  const runtime = new V5ProduktionsRuntime(
    erstelleKanonischeProduktionsKomposition(),
    bediener,
    aktivierungsAudit,
  );
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
  const quelle = new OperationsQuelleFake();
  const host = new V5ProduktionsHostController(
    bootstrap,
    runtime,
    quelle,
  );
  return {
    bediener,
    aktivierungsAudit,
    runtime,
    bootstrap,
    quelle,
    host,
  };
}

function planenAnfrage(overrides = {}) {
  return {
    schemaVersion: 1,
    aktivierungsId: "HOST-PLAN-1",
    faehigkeitId: MERCHANT_CORE_A_PLANUNGS_FAEHIGKEIT_IDS[0],
    anbieterModulId: MERCHANT_CORE_A_MODUL_ID,
    anbieterVersion: MERCHANT_CORE_A_MODUL_VERSION,
    policyId: "HOST-PLANEN-V1",
    ...overrides,
  };
}

test("Produktions-Host startet Runtime nur aus observer-only Operations-Evidence", async () => {
  const system = baueSystem();

  const status = await system.host.starte(100);

  assert.equal(status.zustand, "LAEUFT");
  assert.equal(status.prozess?.prozessLaeuft, true);
  assert.deepEqual(
    status.letzteHealthEvidenceIds,
    ["HOST-STORAGE-100"],
  );
  assert.equal(status.letzteOperationsZeitMs, 100);
  assert.deepEqual(status.aktivePlanenFaehigkeiten, []);
  assert.equal(status.gameplayAutoritaet, false);
  assert.equal(status.rawWriteAutoritaet, false);
  assert.equal(status.actionAuthority, false);
  assert.equal(system.runtime.status().aktiveFaehigkeiten, 0);
  assert.equal(system.quelle.aufrufe, 1);
});

test("Host aktiviert PLANEN nur mit frisch selbst erhobener Evidence", async () => {
  const system = baueSystem();
  await system.host.starte(100);

  const ergebnis = await system.host.aktivierePlanen(
    planenAnfrage(),
    101,
  );

  assert.equal(ergebnis.erfolgreich, true);
  assert.equal(ergebnis.wirkung, "AKTIVIERT");
  assert.equal(system.runtime.status().aktiveFaehigkeiten, 1);
  assert.equal(system.runtime.status().aktiveMutierendeFaehigkeiten, 0);
  assert.equal(system.aktivierungsAudit.eintraege.length, 1);
  assert.deepEqual(
    system.aktivierungsAudit.eintraege[0].evidenceIds,
    ["HOST-STORAGE-101"],
  );
  assert.equal(system.quelle.aufrufe, 2);
});

test("Operations-Quellenausfall entzieht aktive PLANEN-Authority beim naechsten Tick", async () => {
  const system = baueSystem();
  await system.host.starte(100);
  assert.equal(
    (await system.host.aktivierePlanen(planenAnfrage(), 101)).erfolgreich,
    true,
  );

  system.quelle.fehler = true;
  const status = await system.host.tick(102);

  assert.equal(status.zustand, "GESPERRT");
  assert.equal(
    status.grund,
    "PRODUKTIONS_HOST_OPERATIONS_QUELLE_NICHT_BEREIT",
  );
  assert.deepEqual(status.aktivePlanenFaehigkeiten, []);
  assert.equal(system.runtime.status().aktiveFaehigkeiten, 0);
  assert.equal(system.runtime.status().aktiveModule, 0);
  assert.equal(system.runtime.status().aktiveMutierendeFaehigkeiten, 0);
});

test("degradierte Storage-Health blockiert Host-Start vor Runtime-Wirkung", async () => {
  const system = baueSystem();
  system.quelle.zustand = "DEGRADIERT";

  const status = await system.host.starte(100);

  assert.equal(status.zustand, "GESPERRT");
  assert.match(
    status.grund,
    /PRODUKTIONS_HOST_BOOTSTRAP_NICHT_LAEUFT:OPERATIONS_NICHT_BEREIT/,
  );
  assert.equal(system.runtime.status().prozessLaeuft, false);
  assert.equal(system.runtime.status().aktiveFaehigkeiten, 0);
});

test("Operator-Deny wird beim Host-Tick gegen laufende PLANEN-Authority revalidiert", async () => {
  const system = baueSystem();
  await system.host.starte(100);
  assert.equal(
    (await system.host.aktivierePlanen(planenAnfrage(), 101)).erfolgreich,
    true,
  );

  await system.bediener.wendeDenyAn({
    schemaVersion: 1,
    befehlId: "HOST-DENY-1",
    bedienerId: "operator",
    zeitMs: 102,
    art: "FAEHIGKEIT_SPERREN",
    faehigkeitId: planenAnfrage().faehigkeitId,
  });

  const status = await system.host.tick(103);

  assert.equal(status.zustand, "GESPERRT");
  assert.match(
    status.grund,
    /PRODUKTIONS_HOST_REVALIDIERUNG_NICHT_BEREIT/,
  );
  assert.deepEqual(status.aktivePlanenFaehigkeiten, []);
  assert.equal(system.runtime.status().aktiveFaehigkeiten, 0);
  assert.equal(system.runtime.status().aktiveModule, 0);
});
