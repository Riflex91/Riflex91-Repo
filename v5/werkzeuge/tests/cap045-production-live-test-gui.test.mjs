import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

import { pruefeProduktionsGraph } from "../../erzeugt/index.js";

const controller = fs.readFileSync("werkzeuge/cap045-production-live-test-gui.js", "utf8");
const paket = fs.readFileSync("werkzeuge/cap045-production-live-test-paket.js", "utf8");

test("CAP-045 Live-Paket bildet drei klar getrennte Stages und die geforderten Evidence-Klassen ab", () => {
  for (const marker of [
    "STAGE_1","STAGE_2","STAGE_3",
    "FULLY_RESOLVED","DEFERRED_EVENT_INAKTIV",
    "BLOCKIERT_QUEST_NICHT_ERFUELLT","STRUCTURAL_GAP",
    "evidenceKlasse: 'LIVE'","evidenceKlasse: 'SYNTHETISCH'",
    "synthetischeEvidenceZaehltAlsLive: false",
    "liveBeweisBestanden","breiteRuntimeFreigabe: false"
  ]) assert.ok(controller.includes(marker), marker);
});

test("CAP-045 Zertifizierer bleibt read-only und Controlled-Proof besitzt exakt einen Write-Pfad", () => {
  assert.ok(controller.includes("zertifiziererGameplayWrites: 0"));
  assert.ok(controller.includes("controlledProofDriverGameplayWrites: 1"));
  assert.ok(controller.includes("legacyRuntimeMethodenAufgerufen: false"));
  assert.equal(controller.includes(".status()"), false);
  assert.equal((controller.match(/\.upgrade\s*\(/g) ?? []).length, 1);
  for (const verboten of [
    ".attack(", ".move(", ".smart_move(", ".use_skill(",
    ".buy(", ".sell(", ".send_item(", ".send_gold(",
    ".craft(", ".exchange(", ".compound("
  ]) assert.equal(controller.includes(verboten), false, verboten);
});

test("CAP-045 Controlled-Proof ist durable-intent-, admission-, contract- und no-retry-gebunden", () => {
  for (const marker of [
    "CAP045-PRODUCTION-LIVE-PROOF-UPGRADE-ONE-SHOT-AKZEPTIERT",
    "CAP045-STAGE2-LIVE-SOAK-START",
    "AL-ACTION-UPGRADE","AL-RECOVERY-UPGRADE","AL-VERIFIER-UPGRADE",
    "status: 'INTENT_DURABLE'","status: 'ADMITTED'","status: 'OUTCOME_PENDING'",
    "sameIntentErneutSenden: false","RECOVERY_PENDING","COMMITTED",
    "maximalerSendCount: 1","sendCount: 1"
  ]) assert.ok(controller.includes(marker), marker);
  const durable = controller.indexOf("schreibeJournal(intent)");
  const admission = controller.indexOf("status: 'ADMITTED'", durable);
  const sendPending = controller.indexOf("status: 'OUTCOME_PENDING'", admission);
  const send = controller.indexOf("await rufeUpgrade(rootFenster(), kandidat, false)", sendPending);
  assert.ok(durable >= 0 && admission > durable && sendPending > admission && send > sendPending);
});

test("CAP-045 Bericht enthaelt die verlangten Live-Abnahmefelder", () => {
  for (const marker of [
    "testkennung","guiVersion","gesamtstatus","startzeit","endzeit","stageStatus",
    "coverageAudit","soakDauerMs","sampleAnzahl","sampleGaps","fingerprintFehler",
    "duplicateIrreversibleEffects","unverifiedIrreversibleEffects",
    "invariantViolations","recipientSettlementErgebnis",
    "syntheticRegressionStatus","liveBeweisStatus","blocker"
  ]) assert.ok(controller.includes(marker), marker);
});

test("CAP-045 Paket ist source-locked und enthaelt keinen Fremdnetzwerk-Lader", () => {
  assert.ok(paket.indexOf("const API_NAME = 'V5TestGui'") >= 0);
  assert.ok(
    paket.indexOf("const API_NAME = 'V5Cap045ProductionLiveTest'")
      > paket.indexOf("const API_NAME = 'V5TestGui'")
  );
  assert.equal(paket.includes("fetch("), false);
  assert.equal(paket.includes("XMLHttpRequest"), false);
});

test("CAP-045 Stage 1 erzeugt einen Core-schema-gueltigen ProduktionsGraph", async () => {
  const speicher = new Map();
  const gui = {
    version: "1.1.0",
    registriereAktion() {},
    protokolliere() {},
    setzeStatus() {},
    setzeErgebnis() {},
    setzeAktionAktiv() {},
    setzeRestzeit() {},
    kopiereBericht() { return ""; }
  };
  const kontext = vm.createContext({
    parent: null,
    user_id: "account-1",
    server_region: "EU",
    server_identifier: "I",
    character: {
      name: "My_Merchant",
      id: "session-1",
      owner: "account-1",
      rip: false,
      moving: false,
      target: null,
      q: {},
      items: [
        { name: "coat", level: 0 },
        { name: "scroll0", q: 2 }
      ]
    },
    G: {
      items: {
        coat: { type: "chest", upgrade: true, g: 100 },
        scroll0: { type: "uscroll" }
      }
    },
    upgrade() { return Promise.resolve({ chance: 1 }); },
    localStorage: {
      getItem(key) { return speicher.has(key) ? speicher.get(key) : null; },
      setItem(key, wert) { speicher.set(key, String(wert)); },
      removeItem(key) { speicher.delete(key); }
    },
    V5TestGui: {
      version: "1.1.0",
      performanceTrickStatus() { return { aktiv: true }; },
      async aktivierePerformanceTrick() { return { aktiv: true }; },
      erstelleTest() { return gui; }
    },
    setInterval,
    clearInterval,
    setTimeout,
    clearTimeout
  });

  vm.runInContext(controller, kontext);
  const result = await kontext.V5Cap045ProductionLiveTest.stage1Discovery();
  assert.equal(result.stageStatus.stage1, "BESTANDEN");
  assert.equal(result.coverageAudit.bestanden, true);
  const graph = result.coverageAudit.faelle[0].graph;
  assert.equal(graph.planId.startsWith("cap045-live-My_Merchant-"), true);
  assert.equal(graph.bankKatalog, null);
  assert.equal(graph.recipient.accountId, "account-1");
  assert.equal(graph.recipient.characterId, "My_Merchant");
  assert.equal(graph.recipient.sessionId, "session-1");
  assert.ok(graph.schritte.find(x => x.art === "UPGRADE").workspaceNachweisFingerprint);
  assert.equal(graph.schritte.every(x => Object.hasOwn(x, "gateEvidence")), true);

  const nachweis = pruefeProduktionsGraph(graph, Date.now());
  assert.equal(nachweis.erlaubt, true);
  assert.equal(nachweis.status, "BEREIT");
});

test("CAP-045 Stage 2 misst die Mindestdauer zwischen echten Evidence-Samples", () => {
  assert.ok(controller.includes("sample.zeitMs - samples[0].zeitMs >= SOAK_DAUER_MS"));
  assert.ok(controller.includes("samples.length >= MIN_LIVE_SAMPLES"));
  assert.equal(
    controller.includes("sample.zeitMs - aktualisiert.stage2.gestartetAmMs >= SOAK_DAUER_MS"),
    false
  );
});


test("CAP-045 Stage 1 liest Serverbindung aus Adventure-Land-Runner und Parent fail-closed", async () => {
  async function laufeMitServerSurfaces({ runnerServer = null, parentServer = null }) {
    const speicher = new Map();
    const gui = {
      version: "1.1.0",
      registriereAktion() {},
      protokolliere() {},
      setzeStatus() {},
      setzeErgebnis() {},
      setzeAktionAktiv() {},
      setzeRestzeit() {},
      kopiereBericht() { return ""; }
    };
    const parentObjekt = {
      user_id: "account-1",
      server_region: parentServer?.region,
      server_identifier: parentServer?.id,
      character: { owner: "account-1" }
    };
    parentObjekt.parent = parentObjekt;
    const basis = {
      parent: parentObjekt,
      user_id: "account-1",
      character: {
        name: "My_Merchant",
        id: "session-1",
        owner: "account-1",
        rip: false,
        moving: false,
        target: null,
        q: {},
        items: [
          { name: "coat", level: 0 },
          { name: "scroll0", q: 2 }
        ]
      },
      G: {
        items: {
          coat: { type: "chest", upgrade: true, g: 100 },
          scroll0: { type: "uscroll" }
        }
      },
      upgrade() { return Promise.resolve({ chance: 1 }); },
      localStorage: {
        getItem(key) { return speicher.has(key) ? speicher.get(key) : null; },
        setItem(key, wert) { speicher.set(key, String(wert)); },
        removeItem(key) { speicher.delete(key); }
      },
      V5TestGui: {
        version: "1.1.0",
        performanceTrickStatus() { return { aktiv: true }; },
        async aktivierePerformanceTrick() { return { aktiv: true }; },
        erstelleTest() { return gui; }
      },
      setInterval,
      clearInterval,
      setTimeout,
      clearTimeout
    };
    if (runnerServer) basis.server = { region: runnerServer.region, id: runnerServer.id };
    const kontext = vm.createContext(basis);
    vm.runInContext(controller, kontext);
    return kontext.V5Cap045ProductionLiveTest.stage1Discovery();
  }

  const runner = await laufeMitServerSurfaces({
    runnerServer: { region: "EU", id: "I" }
  });
  assert.equal(runner.stageStatus.stage1, "BESTANDEN");
  assert.equal(runner.production.serverRegion, "EU");
  assert.equal(runner.production.serverIdentifier, "I");

  const parentFallback = await laufeMitServerSurfaces({
    parentServer: { region: "US", id: "II" }
  });
  assert.equal(parentFallback.stageStatus.stage1, "BESTANDEN");
  assert.equal(parentFallback.production.serverRegion, "US");
  assert.equal(parentFallback.production.serverIdentifier, "II");

  const fehlt = await laufeMitServerSurfaces({});
  assert.equal(fehlt.status, "BLOCKIERT");
  assert.deepEqual(Array.from(fehlt.blocker), ["SERVER_BINDUNG_FEHLT"]);
  assert.equal(fehlt.serverBindung.quelle, "FEHLT");
});


test("CAP-045 Maschinenbericht exportiert lossless JSON und bewahrt Session-Provenienz", () => {
  assert.ok(controller.includes("function maschinenBerichtObjekt()"));
  assert.ok(controller.includes("function maschinenBerichtText()"));
  assert.ok(controller.includes("JSON.stringify(maschinenBerichtObjekt(), null, 2)"));
  assert.ok(controller.includes("controllerVersion: session.controllerVersion ?? VERSION"));
  assert.ok(controller.includes("CAP045_MASCHINENBERICHT_NUR_NACH_BESTANDEN"));
  assert.equal(
    controller.includes("maschinenBerichtText() {\n    return format("),
    false
  );
});

test("CAP-045 Maschinenexport bleibt read-only und fuegt keinen zweiten Mutation-Pfad hinzu", () => {
  assert.equal((controller.match(/\.upgrade\s*\(/g) ?? []).length, 1);
  assert.ok(controller.includes("kopiereMaschinenBericht"));
  assert.equal(controller.includes("maschinenbericht-kopieren"), true);
});
