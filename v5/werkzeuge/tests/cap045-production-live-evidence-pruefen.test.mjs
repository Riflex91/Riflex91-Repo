import test from "node:test";
import assert from "node:assert/strict";

import {
  baueCap045LiveEvidence,
  extrahiereCap045Bericht,
  pruefeCap045LiveBericht,
} from "../cap045-production-live-evidence-pruefen.mjs";

function gueltigerBericht() {
  const graph = {
    schemaVersion: 1,
    planId: "cap045-live-My_Merchant-1-1",
    recipient: {
      schemaVersion: 1,
      accountId: "account-1",
      characterId: "My_Merchant",
      sessionId: "session-1",
      serverRegion: "EU",
      serverIdentifier: "I",
      rosterEpoche: 1,
      rosterFingerprint: "roster-fp",
    },
    rootNodeId: "delivery:2",
    planFingerprint: "plan-fp",
    bankKatalog: null,
    schritte: [
      {
        nodeId: "upgrade:1",
        art: "UPGRADE",
        abhaengigkeiten: [],
        outputName: "coat",
        outputLevel: 1,
        outputMenge: 1,
        operationSchluessel: "cap045-live-My_Merchant-1-1:upgrade:0",
        workspaceNachweisFingerprint: "workspace-fp",
        gateEvidence: null,
      },
      {
        nodeId: "delivery:2",
        art: "DELIVERY",
        abhaengigkeiten: ["upgrade:1"],
        outputName: "coat",
        outputLevel: 1,
        outputMenge: 1,
        operationSchluessel: "cap045-live-My_Merchant-1-1:delivery:self",
        workspaceNachweisFingerprint: null,
        gateEvidence: null,
      },
    ],
  };
  return {
    schemaVersion: 1,
    testkennung: "cap045-production-live-certification",
    guiVersion: "1.1.0",
    controllerVersion: "1.0.2",
    gesamtstatus: "BESTANDEN",
    startzeit: "2026-09-20T20:00:00.000Z",
    endzeit: "2026-09-20T20:05:15.000Z",
    stageStatus: {
      stage1: "BESTANDEN",
      stage2: "BESTANDEN",
      stage3: "BESTANDEN",
    },
    evidenceKlasse: "LIVE",
    coverageAudit: {
      schemaVersion: 1,
      auditId: "audit-1",
      katalogFingerprint: "catalog-fp",
      erwarteteZiele: 1,
      gepruefteZiele: 1,
      fullyResolved: 1,
      deferredEventInaktiv: 0,
      blockiertQuest: 0,
      structuralGaps: 0,
      syntheticEvidenceFaelle: 0,
      liveEvidenceFaelle: 1,
      bestanden: true,
      diagnosticOnly: true,
      actionAuthority: false,
      rawWriteAuthority: false,
      faelle: [{
        fallId: "fall-1",
        zielId: "coat:1",
        evidenceKlasse: "LIVE",
        klassifikation: "FULLY_RESOLVED",
        graph,
      }],
    },
    soakDauerMs: 300001,
    sampleAnzahl: 21,
    sampleGaps: 0,
    fingerprintFehler: 0,
    duplicateIrreversibleEffects: 0,
    unverifiedIrreversibleEffects: 0,
    invariantViolations: 0,
    recipientSettlementErgebnis: true,
    zertifiziererGameplayWrites: 0,
    controlledProofDriverGameplayWrites: 1,
    syntheticRegressionStatus: "BESTANDEN",
    syntheticRegressionBestanden: true,
    liveBeweisStatus: "BESTANDEN",
    blocker: [],
    synthetischeEvidenceZaehltAlsLive: false,
    liveBeweisBestanden: true,
    diagnosticOnly: true,
    actionAuthority: false,
    rawWriteAuthority: false,
    breiteRuntimeFreigabe: false,
    production: {
      produktionsId: graph.planId,
      planFingerprint: graph.planFingerprint,
      graph,
      recipientCharacterId: "My_Merchant",
      serverRegion: "EU",
      serverIdentifier: "I",
    },
    stage2Nachweis: {
      status: "BESTANDEN",
      evidenceKlasse: "LIVE",
      shadowSoakBestanden: true,
      liveBeweisBestanden: false,
      controlledLiveProofAusstehend: true,
      nachweis: {
        liveBeweisBestanden: true,
      },
    },
    stage3Outcome: {
      klassifikation: "BESTAETIGT_ERFOLG",
      postconditionVerifiziert: true,
      recipientSettlementVerifiziert: true,
      sameIntentErneutSenden: false,
      sendCount: 1,
      actionContractId: "AL-ACTION-UPGRADE",
      recoveryContractId: "AL-RECOVERY-UPGRADE",
      verifierId: "AL-VERIFIER-UPGRADE",
    },
    journalStatus: "COMMITTED",
  };
}

test("CAP-045 Evidence-Validator akzeptiert einen vollstaendig bestandenen Live-Bericht", () => {
  const bericht = gueltigerBericht();
  const nachweis = pruefeCap045LiveBericht(bericht);
  assert.equal(nachweis.status, "BESTANDEN");
  assert.equal(nachweis.sampleAnzahl, 21);
  assert.equal(nachweis.coverageZiele, 1);
});

test("CAP-045 Evidence-Validator extrahiert das Ergebnis aus dem V5-Gesamtbericht", () => {
  const bericht = gueltigerBericht();
  const raw = [
    "V5 TESTBERICHT",
    "Test: CAP-045",
    "",
    "=== ERGEBNIS ===",
    JSON.stringify(bericht, null, 2),
    "",
    "=== PROTOKOLL ===",
    "[2026-09-20T20:05:15.000Z] abgeschlossen",
  ].join("\n");
  assert.deepEqual(extrahiereCap045Bericht(raw), bericht);
  const evidence = baueCap045LiveEvidence(bericht, raw);
  assert.equal(evidence.status, "BESTANDEN");
  assert.match(evidence.sourceReportFingerprintSha256, /^[a-f0-9]{64}$/);
  assert.equal(evidence.controlledProof.controlledProofDriverGameplayWrites, 1);
  assert.equal(evidence.safety.breiteRuntimeFreigabe, false);
});

test("CAP-045 Evidence-Validator lehnt Synthetic, Gaps und Zertifizierer-Writes fail-closed ab", () => {
  for (const veraendere of [
    b => { b.evidenceKlasse = "SYNTHETISCH"; },
    b => { b.sampleGaps = 1; },
    b => { b.zertifiziererGameplayWrites = 1; },
    b => { b.controlledProofDriverGameplayWrites = 0; },
    b => { b.recipientSettlementErgebnis = false; },
  ]) {
    const bericht = gueltigerBericht();
    veraendere(bericht);
    assert.throws(() => pruefeCap045LiveBericht(bericht), /V5-CAP045-LIVE-EVIDENCE/);
  }
});

test("CAP-045 Evidence-Validator verlangt echte Mindestdauer und leere Blocker", () => {
  const kurz = gueltigerBericht();
  kurz.soakDauerMs = 299999;
  assert.throws(() => pruefeCap045LiveBericht(kurz), /LIVE_DAUER_ZU_KURZ/);

  const blockiert = gueltigerBericht();
  blockiert.blocker = ["LIVE_SOAK_FEHLT_ODER_NICHT_BESTANDEN"];
  assert.throws(() => pruefeCap045LiveBericht(blockiert), /BLOCKER_VORHANDEN/);
});


test("CAP-045 Evidence-Validator akzeptiert Export-Hotfix 1.0.3", () => {
  const bericht = gueltigerBericht();
  bericht.controllerVersion = "1.0.3";
  const nachweis = pruefeCap045LiveBericht(bericht);
  assert.equal(nachweis.status, "BESTANDEN");
});
