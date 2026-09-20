import test from "node:test";
import assert from "node:assert/strict";

import {
  auditiereProduktionsCoverage,
  bewerteProduktionsSoak,
  bewerteProduktionsZertifizierungsGate,
  erstelleProduktionsSoakSample,
  pinneBankKatalog,
} from "../../erzeugt/index.js";

const recipient = Object.freeze({
  schemaVersion: 1,
  accountId: "account-1",
  characterId: "warrior",
  sessionId: "session-1",
  serverRegion: "EU",
  serverIdentifier: "I",
  rosterEpoche: 20,
  rosterFingerprint: "roster-fp",
});

function bankPin() {
  return pinneBankKatalog({
    schemaVersion: 1,
    accountId: "account-1",
    beobachtetAmMs: 100,
    gueltigBisMs: 2_000,
    mountEpoche: 4,
    leaseEpoche: 9,
    fingerprint: "bank-fp",
    eintraege: [{
      pack: "items0",
      slot: 0,
      name: "iron",
      level: 0,
      menge: 5,
      variantenFingerprint: "iron-v1",
    }],
  }, 200);
}

function graph(overrides = {}) {
  return {
    schemaVersion: 1,
    planId: "plan-1",
    recipient,
    rootNodeId: "deliver",
    planFingerprint: "plan-fp",
    bankKatalog: bankPin(),
    schritte: [
      {
        nodeId: "bank",
        art: "BANK_RETRIEVE",
        abhaengigkeiten: [],
        outputName: "iron",
        outputLevel: 0,
        outputMenge: 2,
        operationSchluessel: "op-bank",
        workspaceNachweisFingerprint: null,
        gateEvidence: null,
      },
      {
        nodeId: "craft",
        art: "CRAFT",
        abhaengigkeiten: ["bank"],
        outputName: "sword",
        outputLevel: 0,
        outputMenge: 1,
        operationSchluessel: "op-craft",
        workspaceNachweisFingerprint: "workspace-fp",
        gateEvidence: null,
      },
      {
        nodeId: "deliver",
        art: "DELIVERY",
        abhaengigkeiten: ["craft"],
        outputName: "sword",
        outputLevel: 0,
        outputMenge: 1,
        operationSchluessel: "op-delivery",
        workspaceNachweisFingerprint: null,
        gateEvidence: null,
      },
    ],
    ...overrides,
  };
}

function eventGraph() {
  return {
    schemaVersion: 1,
    planId: "event-plan",
    recipient,
    rootNodeId: "deliver-event",
    planFingerprint: "event-plan-fp",
    bankKatalog: null,
    schritte: [
      {
        nodeId: "event",
        art: "EVENT",
        abhaengigkeiten: [],
        outputName: "eventmat",
        outputLevel: 0,
        outputMenge: 1,
        operationSchluessel: null,
        workspaceNachweisFingerprint: null,
        gateEvidence: {
          schemaVersion: 1,
          gateArt: "EVENT",
          gateId: "holiday-event",
          aktiv: false,
          beobachtetAmMs: 200,
          gueltigBisMs: 500,
          fingerprint: "event-fp",
        },
      },
      {
        nodeId: "deliver-event",
        art: "DELIVERY",
        abhaengigkeiten: ["event"],
        outputName: "eventmat",
        outputLevel: 0,
        outputMenge: 1,
        operationSchluessel: "op-event-delivery",
        workspaceNachweisFingerprint: null,
        gateEvidence: null,
      },
    ],
  };
}

function coverageFaelle() {
  return [
    {
      schemaVersion: 1,
      fallId: "coverage-sword",
      zielId: "sword:0",
      evidenceKlasse: "SYNTHETISCH",
      evidenceId: "coverage-evidence-sword",
      graph: graph(),
      planFehler: null,
    },
    {
      schemaVersion: 1,
      fallId: "coverage-event",
      zielId: "eventmat:0",
      evidenceKlasse: "SYNTHETISCH",
      evidenceId: "coverage-evidence-event",
      graph: eventGraph(),
      planFehler: null,
    },
  ];
}

function coverageAudit(overrides = {}) {
  const faelle = overrides.faelle ?? coverageFaelle();
  return auditiereProduktionsCoverage({
    schemaVersion: 1,
    auditId: "production-coverage-1",
    katalogFingerprint: "production-target-catalog-fp",
    erwarteteZiele: faelle.length,
    faelle,
    ...overrides,
  }, 300);
}

function soakGrenzen(overrides = {}) {
  return {
    maximaleSamples: 20,
    maximalerSampleAbstandMs: 2_000,
    minimaleSyntheticSamples: 3,
    minimaleLiveSamples: 3,
    minimaleLiveDauerMs: 2_000,
    ...overrides,
  };
}

function sampleBasis({
  sequenz,
  zeitMs,
  evidenceKlasse,
  vorherigerFingerprint,
  zustand = "HERSTELLUNG_IN_FLIGHT",
  irreversibleOperationen = [],
  recipientSettlementVerifiziert = false,
  offeneAufgaben = 1,
  offeneMaterialziele = 0,
  offeneMutationDemand = 0,
  offeneExchangeDemand = 0,
  gateVerletzungen = 0,
  protectedTransferOhneAutorisierung = 0,
  zertifiziererGameplayWrites = 0,
}) {
  return {
    schemaVersion: 1,
    sequenz,
    zeitMs,
    evidenceKlasse,
    evidenceId: evidenceKlasse.toLowerCase() + "-" + String(sequenz),
    vorherigerFingerprint,
    produktionsId: "prod-1",
    planFingerprint: "plan-fp",
    zustand,
    sameIntentErneutSenden: false,
    recipientSettlementVerifiziert,
    offeneAufgaben,
    offeneMaterialziele,
    offeneMutationDemand,
    offeneExchangeDemand,
    gateVerletzungen,
    protectedTransferOhneAutorisierung,
    zertifiziererGameplayWrites,
    irreversibleOperationen,
  };
}

function serie(evidenceKlasse) {
  const eins = erstelleProduktionsSoakSample(sampleBasis({
    sequenz: 1,
    zeitMs: 100,
    evidenceKlasse,
    vorherigerFingerprint: null,
  }));
  const zwei = erstelleProduktionsSoakSample(sampleBasis({
    sequenz: 2,
    zeitMs: 1_100,
    evidenceKlasse,
    vorherigerFingerprint: eins.sampleFingerprint,
    irreversibleOperationen: [{
      art: "CRAFT",
      operationSchluessel: "op-craft-observed",
      postconditionVerifiziert: true,
    }],
  }));
  const drei = erstelleProduktionsSoakSample(sampleBasis({
    sequenz: 3,
    zeitMs: 2_100,
    evidenceKlasse,
    vorherigerFingerprint: zwei.sampleFingerprint,
    zustand: "COMMITTED",
    recipientSettlementVerifiziert: true,
    offeneAufgaben: 0,
  }));
  return [eins, zwei, drei];
}

test("CAP-045 CoverageAudit erlaubt bekannt inaktives Event als Deferred, nicht als strukturellen Gap", () => {
  const audit = coverageAudit();

  assert.equal(audit.bestanden, true);
  assert.equal(audit.fullyResolved, 1);
  assert.equal(audit.deferredEventInaktiv, 1);
  assert.equal(audit.structuralGaps, 0);
  assert.equal(audit.blockiertQuest, 0);
  assert.equal(audit.syntheticEvidenceFaelle, 2);
  assert.equal(audit.liveEvidenceFaelle, 0);
  assert.equal(audit.diagnosticOnly, true);
  assert.equal(audit.actionAuthority, false);
  assert.equal(audit.rawWriteAuthority, false);
});

test("CAP-045 CoverageAudit macht Planfehler und invaliden Graph zu Structural Gap", () => {
  const faelle = [
    {
      schemaVersion: 1,
      fallId: "missing-source",
      zielId: "unknown:0",
      evidenceKlasse: "SYNTHETISCH",
      evidenceId: "missing-source-evidence",
      graph: null,
      planFehler: "PRODUKTION_PLAN_QUELLE_FEHLT:unknown:0:1",
    },
    {
      schemaVersion: 1,
      fallId: "bad-graph",
      zielId: "bad:0",
      evidenceKlasse: "SYNTHETISCH",
      evidenceId: "bad-graph-evidence",
      graph: graph({
        schritte: graph().schritte.map(x =>
          x.nodeId === "craft"
            ? { ...x, workspaceNachweisFingerprint: null }
            : x),
      }),
      planFehler: null,
    },
  ];
  const audit = coverageAudit({ faelle });

  assert.equal(audit.bestanden, false);
  assert.equal(audit.structuralGaps, 2);
  assert.ok(audit.faelle.every(
    x => x.klassifikation === "STRUCTURAL_GAP",
  ));
});

test("CAP-045 synthetischer Soak besteht Regression, ist aber niemals Live-Beweis", () => {
  const nachweis = bewerteProduktionsSoak(
    serie("SYNTHETISCH"),
    soakGrenzen(),
  );

  assert.equal(nachweis.bestanden, true);
  assert.equal(nachweis.syntheticRegressionBestanden, true);
  assert.equal(nachweis.liveBeweisBestanden, false);
  assert.equal(nachweis.synthetischeEvidenceZaehltAlsLive, false);
  assert.equal(nachweis.actionAuthority, false);
  assert.equal(nachweis.rawWriteAuthority, false);
});

test("CAP-045 Live-Soak braucht echte LIVE-Klasse, Mindestdauer und Samples", () => {
  const live = bewerteProduktionsSoak(
    serie("LIVE"),
    soakGrenzen(),
  );
  assert.equal(live.bestanden, true);
  assert.equal(live.liveBeweisBestanden, true);
  assert.equal(live.syntheticRegressionBestanden, false);

  const zuKurz = bewerteProduktionsSoak(
    serie("LIVE"),
    soakGrenzen({ minimaleLiveDauerMs: 2_001 }),
  );
  assert.equal(zuKurz.bestanden, false);
  assert.equal(zuKurz.liveBeweisBestanden, false);
});

test("CAP-045 verbietet gemischte Synthetic-/Live-Serie", () => {
  const synthetic = serie("SYNTHETISCH");
  const live = serie("LIVE");
  assert.throws(
    () => bewerteProduktionsSoak(
      [synthetic[0], live[1], live[2]],
      soakGrenzen(),
    ),
    /PRODUKTION_SOAK_SYNTHETISCH_LIVE_GEMISCHT/,
  );
});

test("CAP-045 erkennt Duplicate irreversible Effects und unverified Postcondition", () => {
  const eins = erstelleProduktionsSoakSample(sampleBasis({
    sequenz: 1,
    zeitMs: 100,
    evidenceKlasse: "SYNTHETISCH",
    vorherigerFingerprint: null,
    irreversibleOperationen: [{
      art: "BUY",
      operationSchluessel: "dup-op",
      postconditionVerifiziert: true,
    }],
  }));
  const zwei = erstelleProduktionsSoakSample(sampleBasis({
    sequenz: 2,
    zeitMs: 200,
    evidenceKlasse: "SYNTHETISCH",
    vorherigerFingerprint: eins.sampleFingerprint,
    irreversibleOperationen: [{
      art: "BUY",
      operationSchluessel: "dup-op",
      postconditionVerifiziert: false,
    }],
  }));
  const drei = erstelleProduktionsSoakSample(sampleBasis({
    sequenz: 3,
    zeitMs: 300,
    evidenceKlasse: "SYNTHETISCH",
    vorherigerFingerprint: zwei.sampleFingerprint,
  }));
  const nachweis = bewerteProduktionsSoak(
    [eins, zwei, drei],
    soakGrenzen(),
  );

  assert.equal(nachweis.bestanden, false);
  assert.equal(nachweis.duplicateIrreversibleEffects, 1);
  assert.equal(nachweis.unverifiedIrreversibleEffects, 1);
});

test("CAP-045 blockiert irreversible Beobachtung waehrend RECOVERY_PENDING", () => {
  const eins = erstelleProduktionsSoakSample(sampleBasis({
    sequenz: 1,
    zeitMs: 100,
    evidenceKlasse: "SYNTHETISCH",
    vorherigerFingerprint: null,
  }));
  const zwei = erstelleProduktionsSoakSample(sampleBasis({
    sequenz: 2,
    zeitMs: 200,
    evidenceKlasse: "SYNTHETISCH",
    vorherigerFingerprint: eins.sampleFingerprint,
    zustand: "RECOVERY_PENDING",
    irreversibleOperationen: [{
      art: "DELIVERY",
      operationSchluessel: "send-during-recovery",
      postconditionVerifiziert: true,
    }],
  }));
  const drei = erstelleProduktionsSoakSample(sampleBasis({
    sequenz: 3,
    zeitMs: 300,
    evidenceKlasse: "SYNTHETISCH",
    vorherigerFingerprint: zwei.sampleFingerprint,
  }));
  const nachweis = bewerteProduktionsSoak(
    [eins, zwei, drei],
    soakGrenzen(),
  );

  assert.equal(nachweis.bestanden, false);
  assert.equal(nachweis.invariantViolations, 1);
});

test("CAP-045 COMMITTED braucht Recipient Settlement und null Restarbeit", () => {
  const eins = erstelleProduktionsSoakSample(sampleBasis({
    sequenz: 1,
    zeitMs: 100,
    evidenceKlasse: "SYNTHETISCH",
    vorherigerFingerprint: null,
  }));
  const zwei = erstelleProduktionsSoakSample(sampleBasis({
    sequenz: 2,
    zeitMs: 200,
    evidenceKlasse: "SYNTHETISCH",
    vorherigerFingerprint: eins.sampleFingerprint,
    zustand: "COMMITTED",
    recipientSettlementVerifiziert: false,
    offeneAufgaben: 1,
    offeneMutationDemand: 1,
  }));
  const drei = erstelleProduktionsSoakSample(sampleBasis({
    sequenz: 3,
    zeitMs: 300,
    evidenceKlasse: "SYNTHETISCH",
    vorherigerFingerprint: zwei.sampleFingerprint,
  }));
  const nachweis = bewerteProduktionsSoak(
    [eins, zwei, drei],
    soakGrenzen(),
  );

  assert.equal(nachweis.bestanden, false);
  assert.equal(nachweis.invariantViolations, 1);
});

test("CAP-045 Zertifizierungsgate kann Synthetic niemals an Stelle von Live akzeptieren", () => {
  const coverage = coverageAudit();
  const synthetic = bewerteProduktionsSoak(
    serie("SYNTHETISCH"),
    soakGrenzen(),
  );

  const ohneLive = bewerteProduktionsZertifizierungsGate(
    coverage,
    synthetic,
    null,
  );
  assert.equal(ohneLive.bereit, false);
  assert.equal(ohneLive.syntheticRegressionBestanden, true);
  assert.equal(ohneLive.liveSoakBestanden, false);
  assert.deepEqual(
    ohneLive.blocker,
    ["LIVE_SOAK_FEHLT_ODER_NICHT_BESTANDEN"],
  );
  assert.equal(ohneLive.synthetischeEvidenceZaehltAlsLive, false);
  assert.equal(ohneLive.breiteRuntimeFreigabe, false);

  const live = bewerteProduktionsSoak(
    serie("LIVE"),
    soakGrenzen(),
  );
  const mitLive = bewerteProduktionsZertifizierungsGate(
    coverage,
    synthetic,
    live,
  );
  assert.equal(mitLive.bereit, true);
  assert.equal(mitLive.actionAuthority, false);
  assert.equal(mitLive.rawWriteAuthority, false);
  assert.equal(mitLive.breiteRuntimeFreigabe, false);
});

test("CAP-045 manipulierte Fingerprint-Kette wird erkannt", () => {
  const samples = serie("SYNTHETISCH");
  const manipuliert = {
    ...samples[1],
    offeneAufgaben: 9,
  };
  const nachweis = bewerteProduktionsSoak(
    [samples[0], manipuliert, samples[2]],
    soakGrenzen(),
  );
  assert.equal(nachweis.bestanden, false);
  assert.ok(nachweis.fingerprintFehler > 0);
});
