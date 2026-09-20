import test from "node:test";
import assert from "node:assert/strict";

import {
  AblaufScheduler,
  AusfuehrungsKernel,
  CharacterSocketBudget,
  ErteilteAusfuehrungsFreigabe,
  MutationsKanalKoordination,
  PersistVorMutationTor,
  RecoveryKernel,
  RessourcenVerwalter,
  ShadowAusfuehrungsAdapter,
  VerticalSliceProtokoll,
  bewerteControlledLive,
  erstelleMutationsKanalPlan,
  ladeRecoveryWiederanlauf,
} from "../../erzeugt/index.js";

const ACTION = "AL-ACTION-EQUIP";
const RECOVERY = "AL-RECOVERY-EQUIP";
const VERIFIER = "AL-VERIFIER-EQUIP";
const HASH = "a".repeat(64);
const COMMIT = "1".repeat(40);

class JournalFake {
  constructor() {
    this.eintraege = [];
  }

  async haengeDurableAn(eintrag) {
    this.eintraege = [...this.eintraege, eintrag];
    return {
      durable: true,
      bestaetigungsId: "ACK-" + eintrag.journalId,
      journalId: eintrag.journalId,
      transaktionsId: eintrag.transaktionsId,
      sequenz: eintrag.sequenz,
    };
  }

  async liesTransaktion(transaktionsId) {
    return this.eintraege.filter(x => x.transaktionsId === transaktionsId);
  }
}

function workflowPlan() {
  return {
    schemaVersion: 1,
    ablaufId: "VS-WF-1",
    ablaufArt: "VERTICAL_SLICE_SHADOW",
    eigentuemerModulId: "vertical-slice-shadow",
    prioritaetsKlasse: "NORMALE_ARBEIT",
    prioritaetsRang: 10,
    erstelltAmMs: 100,
    deadlineAmMs: 1_000,
    ressourcenIds: ["character:equipment"],
    wissensSnapshot: {
      gitCommit: COMMIT,
      quellenSha256: [HASH],
    },
    wiederholung: {
      maximaleVersuche: 1,
      maximaleDauerMs: 500,
      anfangsBackoffMs: 10,
      maximalerBackoffMs: 10,
      backoffFaktor: 1,
      circuitSchluessel: "vertical-slice:equip",
    },
    idempotenzSchluessel: "VS-IDEM-1",
    abgleichStrategie: "LIVE_NEU_BEOBACHTEN",
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
  };
}

test("Vertical Slice 0 durchlaeuft Shadow-End-to-End ohne Sonderumgehung und ohne Raw Write", async () => {
  const protokoll = new VerticalSliceProtokoll();

  const observation = {
    equipmentSlot: "mainhand",
    itemIdentity: "shadow-item-1",
    beobachtetAmMs: 100,
  };
  assert.equal(observation.itemIdentity, "shadow-item-1");
  protokoll.melde("BEOBACHTUNG", "OBS-1");

  const scheduler = new AblaufScheduler();
  scheduler.registriere(workflowPlan());
  protokoll.melde("PLAN", "PLAN-1");
  scheduler.setzeStatus("VS-WF-1", "BEREIT", 101);
  assert.equal(scheduler.waehleNaechsten(101).plan.ablaufId, "VS-WF-1");
  protokoll.melde("WORKFLOW", "WF-1");

  const ressourcen = new RessourcenVerwalter();
  const socketBudget = new CharacterSocketBudget();
  const [equipmentToken] = ressourcen.beanspruche("VS-WF-1", [{
    ressourcenId: "character:equipment",
    art: "EXKLUSIV",
    leaseDauerMs: null,
  }], 102);
  const kanal = new MutationsKanalKoordination(
    ressourcen,
    socketBudget,
  ).reserviere(
    "VS-BUDGET-1",
    "VS-WF-1",
    erstelleMutationsKanalPlan("shadow-character", "equip", 1),
    102,
  );
  protokoll.melde("RESSOURCEN", "RES-1");

  const intentEintrag = {
    schemaVersion: 1,
    journalId: "VS-J-1",
    transaktionsId: "VS-T-1",
    sequenz: 1,
    art: "INTENT",
    zeitMs: 103,
    inhalt: {
      auftrag_id: "VS-AUF-1",
      ablauf_id: "VS-WF-1",
      faehigkeit_id: "equipment.equip",
      owner_id: "vertical-slice-shadow",
      action_contract_id: ACTION,
      recovery_contract_id: RECOVERY,
      verifier_id: VERIFIER,
    },
  };
  const journal = new JournalFake();
  const intentToken = await new PersistVorMutationTor(journal).persistiereIntent(
    intentEintrag,
  );
  assert.equal(intentToken.durable, true);
  protokoll.melde("INTENT_DURABLE", "INTENT-1");

  const freigabe = await ErteilteAusfuehrungsFreigabe.erteile({
    schemaVersion: 1,
    freigabeId: "VS-FREIGABE-1",
    auftragId: "VS-AUF-1",
    ablaufId: "VS-WF-1",
    transaktionsId: "VS-T-1",
    faehigkeitId: "equipment.equip",
    eigentuemerModulId: "vertical-slice-shadow",
    actionContractId: ACTION,
    recoveryContractId: RECOVERY,
    verifierId: VERIFIER,
    invariantenKennungen: ["V5-INV-030"],
    voraussetzungsIds: ["equipment_slot", "inventory_item_identity"],
    ausgestelltAmMs: 104,
    gueltigBisMs: 200,
    fencingTokens: [equipmentToken],
    mutationsKanal: kanal,
    intentToken,
    intentEintrag,
  }, {
    faehigkeitsAutoritaet: {
      pruefe() {
        return { erlaubt: true, mutierend: true, generation: 1 };
      },
    },
    operatorRichtlinie: {
      pruefe() {
        return { erlaubt: true, generation: 1 };
      },
    },
    laufzeitGate: {
      pruefe() {
        return {
          freigegeben: true,
          generation: 1,
          nachweisId: "SHADOW_TEST_GATE",
        };
      },
    },
    aktionsVertraege: {
      pruefe(actionContractId, recoveryContractId, verifierId) {
        return {
          actionContractId,
          recoveryContractId,
          verifierId,
          produktivErlaubt: true,
          invariantenKennungen: ["V5-INV-030"],
        };
      },
    },
    liveVoraussetzungen: {
      async pruefe(ids, jetztMs) {
        return ids.map(id => ({
          voraussetzungId: id,
          fingerprint: "shadow:" + id,
          beobachtetAmMs: jetztMs,
          gueltigBisMs: 250,
        }));
      },
    },
    ressourcen,
    socketBudget,
  });
  protokoll.melde("ADMISSION", "ADM-1");

  const adapter = new ShadowAusfuehrungsAdapter(
    "shadow-equip",
    ACTION,
    RECOVERY,
    VERIFIER,
    async request => ({
      simuliert: true,
      slot: request.slot,
      itemIdentity: request.itemIdentity,
    }),
  );
  const transport = await new AusfuehrungsKernel().fuehreAus(
    freigabe,
    { slot: "mainhand", itemIdentity: "shadow-item-1" },
    adapter,
    105,
  );
  assert.equal(adapter.rohSchreibAufrufe(), 0);
  assert.equal(adapter.simulationsAufrufe(), 1);
  protokoll.melde("EXECUTION_SHADOW", "SHADOW-EXEC-1");
  assert.equal(transport.art, "SERVER_ERGEBNIS");
  protokoll.melde("SERVERERGEBNIS", "SERVER-SIM-1");

  const snapshot = {
    schemaVersion: 1,
    wissensSnapshot: {
      gitCommit: COMMIT,
      quellenSha256: [HASH],
    },
    configFingerprint: "cfg:shadow",
    prestateFingerprint: "pre:equipment:mainhand",
    actionContractId: ACTION,
    recoveryContractId: RECOVERY,
    verifierId: VERIFIER,
  };
  const recovery = new RecoveryKernel({
    pruefe(actionContractId, recoveryContractId) {
      return {
        actionContractId,
        recoveryContractId,
        produktivErlaubt: true,
        sameIntentAfterPossibleSend: "NEVER",
        maximaleBeobachtungen: 1,
        fehlerDomaeneId: "shadow:equipment",
      };
    },
  }, {
    async beobachte() {
      return {
        schemaVersion: 1,
        klassifikation: "BESTAETIGT",
        beobachtetAmMs: 106,
        snapshot,
        differenz: {
          schemaVersion: 1,
          erwarteteDomaenen: ["equipment"],
          angewendeteDomaenen: ["equipment"],
          offeneDomaenen: [],
          widerspruechlicheDomaenen: [],
        },
        evidenceFingerprints: ["shadow-postcondition:equipment"],
      };
    },
  });
  const abschluss = await recovery.gleicheAb({
    schemaVersion: 1,
    transaktionsId: "VS-T-1",
    actionContractId: ACTION,
    recoveryContractId: RECOVERY,
    transportErgebnis: transport,
    snapshot,
  });
  protokoll.melde("POSTCONDITION", "POST-1");
  assert.equal(abschluss.art, "COMMITTED");
  assert.equal(abschluss.sameIntentErneutSenden, false);
  protokoll.melde("COMMIT", "COMMIT-1");

  const restart = ladeRecoveryWiederanlauf({
    schemaVersion: 1,
    workflowId: "VS-WF-1",
    checkpointId: "VS-CP-1",
    status: "ABGESCHLOSSEN",
    sequenz: 12,
    zeitMs: 107,
    zustand: { transaktionsId: "VS-T-1" },
  });
  assert.equal(restart.art, "TERMINAL");
  assert.equal(restart.executionAuthority, false);
  protokoll.melde("RESTART_ABGLEICH", "RESTART-1");

  assert.equal(adapter.rohSchreibAufrufe(), 0);
  protokoll.melde("SHADOW_NACHWEIS", "ZERO-WRITES");
  assert.equal(protokoll.vollstaendig(), true);
  assert.deepEqual(
    protokoll.sicht().map(x => x.stufe),
    [
      "BEOBACHTUNG",
      "PLAN",
      "WORKFLOW",
      "RESSOURCEN",
      "INTENT_DURABLE",
      "ADMISSION",
      "EXECUTION_SHADOW",
      "SERVERERGEBNIS",
      "POSTCONDITION",
      "COMMIT",
      "RESTART_ABGLEICH",
      "SHADOW_NACHWEIS",
    ],
  );
});

test("Controlled Live bleibt beim realen R12-Readiness-Stand fail-closed", () => {
  const entscheidung = bewerteControlledLive({
    readinessStatus: "GESPERRT",
    actionContractId: ACTION,
    publicFunction: "equip",
    shadowVollstaendig: true,
    shadowUnerwarteteWrites: 0,
    operatorFreigabe: true,
    maximaleAktionen: 1,
  });
  assert.equal(entscheidung.erlaubt, false);
  assert.ok(entscheidung.gruende.includes("RUNTIME_GATE_GESPERRT"));
});

test("Controlled-Live-Policy erlaubt hypothetisch nur genau eine freigegebene Equip-Action", () => {
  assert.equal(bewerteControlledLive({
    readinessStatus: "FREIGEGEBEN",
    actionContractId: ACTION,
    publicFunction: "equip",
    shadowVollstaendig: true,
    shadowUnerwarteteWrites: 0,
    operatorFreigabe: true,
    maximaleAktionen: 1,
  }).erlaubt, true);

  const riskant = bewerteControlledLive({
    readinessStatus: "FREIGEGEBEN",
    actionContractId: "AL-ACTION-UPGRADE",
    publicFunction: "upgrade",
    shadowVollstaendig: true,
    shadowUnerwarteteWrites: 0,
    operatorFreigabe: true,
    maximaleAktionen: 1,
  });
  assert.equal(riskant.erlaubt, false);
  assert.ok(riskant.gruende.includes("ACTION_NICHT_LOW_RISK_SLICE"));
  assert.ok(riskant.gruende.includes("RISIKO_ACTION_VERBOTEN"));
});
