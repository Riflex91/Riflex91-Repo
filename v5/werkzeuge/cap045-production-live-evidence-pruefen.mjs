import crypto from "node:crypto";
import fs from "node:fs";

import { pruefeProduktionsGraph } from "../erzeugt/index.js";

const TESTKENNUNG = "cap045-production-live-certification";
const CONTROLLER_VERSION = "1.0.2";
const ACTION_CONTRACT_ID = "AL-ACTION-UPGRADE";
const RECOVERY_CONTRACT_ID = "AL-RECOVERY-UPGRADE";
const VERIFIER_ID = "AL-VERIFIER-UPGRADE";
const MIN_LIVE_DAUER_MS = 5 * 60 * 1000;
const MIN_LIVE_SAMPLES = 20;
const MAX_LIVE_SAMPLES = 30;

function fehler(code) {
  throw new Error("[V5-CAP045-LIVE-EVIDENCE] " + code);
}

function verlange(bedingung, code) {
  if (!bedingung) fehler(code);
}

export function extrahiereCap045Bericht(text) {
  if (typeof text !== "string" || text.trim().length === 0) {
    fehler("BERICHT_LEER");
  }
  const getrimmt = text.trim();
  if (getrimmt.startsWith("{")) {
    try { return JSON.parse(getrimmt); }
    catch { fehler("JSON_UNGUELTIG"); }
  }

  const ergebnisMarker = "=== ERGEBNIS ===";
  const protokollMarker = "=== PROTOKOLL ===";
  const ergebnisStart = text.indexOf(ergebnisMarker);
  const protokollStart = text.indexOf(protokollMarker, ergebnisStart + ergebnisMarker.length);
  if (ergebnisStart < 0 || protokollStart < 0 || protokollStart <= ergebnisStart) {
    fehler("V5_TESTBERICHT_MARKER_FEHLEN");
  }
  const jsonText = text
    .slice(ergebnisStart + ergebnisMarker.length, protokollStart)
    .trim();
  try { return JSON.parse(jsonText); }
  catch { fehler("ERGEBNIS_JSON_UNGUELTIG"); }
}

export function pruefeCap045LiveBericht(bericht) {
  verlange(bericht && typeof bericht === "object", "BERICHT_OBJEKT_FEHLT");
  verlange(bericht.schemaVersion === 1, "SCHEMA_UNGUELTIG");
  verlange(bericht.testkennung === TESTKENNUNG, "TESTKENNUNG_UNGUELTIG");
  verlange(bericht.controllerVersion === CONTROLLER_VERSION, "CONTROLLER_VERSION_UNGUELTIG");
  verlange(bericht.gesamtstatus === "BESTANDEN", "GESAMTSTATUS_NICHT_BESTANDEN");
  verlange(bericht.evidenceKlasse === "LIVE", "EVIDENCE_NICHT_LIVE");
  verlange(bericht.stageStatus?.stage1 === "BESTANDEN", "STAGE1_NICHT_BESTANDEN");
  verlange(bericht.stageStatus?.stage2 === "BESTANDEN", "STAGE2_NICHT_BESTANDEN");
  verlange(bericht.stageStatus?.stage3 === "BESTANDEN", "STAGE3_NICHT_BESTANDEN");

  const coverage = bericht.coverageAudit;
  verlange(coverage?.bestanden === true, "COVERAGE_NICHT_BESTANDEN");
  verlange(Number.isInteger(coverage.erwarteteZiele) && coverage.erwarteteZiele >= 1,
    "COVERAGE_ERWARTETE_ZIELE_UNGUELTIG");
  verlange(coverage.gepruefteZiele === coverage.erwarteteZiele,
    "COVERAGE_NICHT_VOLLSTAENDIG");
  verlange(coverage.fullyResolved === coverage.erwarteteZiele,
    "COVERAGE_NICHT_VOLL_AUFGELOEST");
  verlange(coverage.structuralGaps === 0, "COVERAGE_STRUCTURAL_GAPS");
  verlange(coverage.blockiertQuest === 0, "COVERAGE_QUEST_BLOCKER");
  verlange(coverage.syntheticEvidenceFaelle === 0, "COVERAGE_SYNTHETISCHE_FAELLE");
  verlange(coverage.liveEvidenceFaelle === coverage.erwarteteZiele,
    "COVERAGE_LIVE_FAELLE_UNVOLLSTAENDIG");
  verlange(Array.isArray(coverage.faelle) && coverage.faelle.length === coverage.erwarteteZiele,
    "COVERAGE_FAELLE_UNVOLLSTAENDIG");
  verlange(coverage.faelle.every(x =>
    x?.evidenceKlasse === "LIVE"
    && x?.klassifikation === "FULLY_RESOLVED"
    && x?.graph?.schemaVersion === 1
    && typeof x?.graph?.planId === "string"
    && x.graph.planId.length > 0
    && x?.graph?.recipient?.schemaVersion === 1),
    "COVERAGE_FALL_UNGUELTIG");
  for (const fall of coverage.faelle) {
    let graphNachweis;
    try {
      graphNachweis = pruefeProduktionsGraph(fall.graph, Date.now());
    } catch {
      fehler("COVERAGE_CORE_GRAPH_UNGUELTIG");
    }
    verlange(graphNachweis.erlaubt === true && graphNachweis.status === "BEREIT",
      "COVERAGE_CORE_GRAPH_NICHT_BEREIT");
  }

  verlange(Number.isFinite(bericht.soakDauerMs) && bericht.soakDauerMs >= MIN_LIVE_DAUER_MS,
    "LIVE_DAUER_ZU_KURZ");
  verlange(Number.isInteger(bericht.sampleAnzahl)
    && bericht.sampleAnzahl >= MIN_LIVE_SAMPLES
    && bericht.sampleAnzahl <= MAX_LIVE_SAMPLES,
    "LIVE_SAMPLE_ANZAHL_UNGUELTIG");
  for (const [feld, code] of [
    ["sampleGaps", "SAMPLE_GAPS"],
    ["fingerprintFehler", "FINGERPRINT_FEHLER"],
    ["duplicateIrreversibleEffects", "DUPLICATE_IRREVERSIBLE_EFFECTS"],
    ["unverifiedIrreversibleEffects", "UNVERIFIED_IRREVERSIBLE_EFFECTS"],
    ["invariantViolations", "INVARIANT_VIOLATIONS"],
  ]) {
    verlange(bericht[feld] === 0, code);
  }

  verlange(bericht.recipientSettlementErgebnis === true, "RECIPIENT_SETTLEMENT_FEHLT");
  verlange(bericht.zertifiziererGameplayWrites === 0, "ZERTIFIZIERER_GAMEPLAY_WRITES");
  verlange(bericht.controlledProofDriverGameplayWrites === 1,
    "CONTROLLED_PROOF_WRITE_ANZAHL_UNGUELTIG");
  verlange(bericht.syntheticRegressionStatus === "BESTANDEN",
    "SYNTHETIC_REGRESSION_STATUS");
  verlange(bericht.syntheticRegressionBestanden === true,
    "SYNTHETIC_REGRESSION_NICHT_BESTANDEN");
  verlange(bericht.liveBeweisStatus === "BESTANDEN", "LIVE_BEWEIS_STATUS");
  verlange(bericht.liveBeweisBestanden === true, "LIVE_BEWEIS_NICHT_BESTANDEN");
  verlange(Array.isArray(bericht.blocker) && bericht.blocker.length === 0, "BLOCKER_VORHANDEN");
  verlange(bericht.synthetischeEvidenceZaehltAlsLive === false,
    "SYNTHETISCHE_EVIDENCE_ZAEHLT_ALS_LIVE");
  verlange(bericht.diagnosticOnly === true, "DIAGNOSTIC_ONLY_FEHLT");
  verlange(bericht.actionAuthority === false, "ACTION_AUTHORITY_UNERWARTET");
  verlange(bericht.rawWriteAuthority === false, "RAW_WRITE_AUTHORITY_UNERWARTET");
  verlange(bericht.breiteRuntimeFreigabe === false, "BREITE_RUNTIME_FREIGABE_UNERWARTET");

  const stage2 = bericht.stage2Nachweis;
  verlange(stage2?.status === "BESTANDEN", "STAGE2_NACHWEIS_STATUS");
  verlange(stage2?.evidenceKlasse === "LIVE", "STAGE2_NACHWEIS_NICHT_LIVE");
  verlange(stage2?.shadowSoakBestanden === true, "STAGE2_SHADOW_SOAK_NICHT_BESTANDEN");
  verlange(stage2?.liveBeweisBestanden === false, "STAGE2_DARF_FINALEN_LIVE_BEWEIS_NICHT_SETZEN");
  verlange(stage2?.controlledLiveProofAusstehend === true,
    "STAGE2_CONTROLLED_PROOF_MARKER_FEHLT");
  verlange(stage2?.nachweis?.liveBeweisBestanden === true,
    "STAGE2_LIVE_SOAK_KERN_NICHT_BESTANDEN");

  const outcome = bericht.stage3Outcome;
  verlange(outcome?.klassifikation === "BESTAETIGT_ERFOLG", "STAGE3_OUTCOME_UNGUELTIG");
  verlange(outcome?.postconditionVerifiziert === true, "STAGE3_POSTCONDITION_FEHLT");
  verlange(outcome?.recipientSettlementVerifiziert === true,
    "STAGE3_RECIPIENT_SETTLEMENT_FEHLT");
  verlange(outcome?.sameIntentErneutSenden === false, "STAGE3_SAME_INTENT_RETRY");
  verlange(outcome?.sendCount === 1, "STAGE3_SEND_COUNT_UNGUELTIG");
  verlange(outcome?.actionContractId === ACTION_CONTRACT_ID, "ACTION_CONTRACT_UNGUELTIG");
  verlange(outcome?.recoveryContractId === RECOVERY_CONTRACT_ID, "RECOVERY_CONTRACT_UNGUELTIG");
  verlange(outcome?.verifierId === VERIFIER_ID, "VERIFIER_UNGUELTIG");
  verlange(bericht.journalStatus === "COMMITTED", "JOURNAL_NICHT_COMMITTED");

  verlange(typeof bericht.startzeit === "string" && bericht.startzeit.length > 0,
    "STARTZEIT_FEHLT");
  verlange(typeof bericht.endzeit === "string" && bericht.endzeit.length > 0,
    "ENDZEIT_FEHLT");
  verlange(bericht.production?.produktionsId === bericht.production?.graph?.planId,
    "PRODUCTION_ID_PLAN_ID_DRIFT");

  return Object.freeze({
    status: "BESTANDEN",
    testkennung: TESTKENNUNG,
    liveDauerMs: bericht.soakDauerMs,
    sampleAnzahl: bericht.sampleAnzahl,
    coverageZiele: coverage.erwarteteZiele,
    controlledProofWrites: bericht.controlledProofDriverGameplayWrites,
  });
}

export function baueCap045LiveEvidence(bericht, rawReportText) {
  pruefeCap045LiveBericht(bericht);
  const raw = String(rawReportText);
  const fingerprint = crypto.createHash("sha256").update(raw, "utf8").digest("hex");
  return Object.freeze({
    schemaVersion: 1,
    stand: bericht.endzeit,
    capability: "CAP-045",
    status: "BESTANDEN",
    evidenceArt: "MANUELLE_PRODUCTION_LIVE_EVIDENCE",
    source: "V5_INGAME_TEST_GUI_BERICHT",
    sourceKennung: bericht.testkennung,
    sourceGuiVersion: bericht.guiVersion,
    sourceControllerVersion: bericht.controllerVersion,
    sourceReportFingerprintSha256: fingerprint,
    startzeit: bericht.startzeit,
    endzeit: bericht.endzeit,
    evidenceKlasse: "LIVE",
    stageStatus: bericht.stageStatus,
    coverage: {
      auditId: bericht.coverageAudit.auditId,
      katalogFingerprint: bericht.coverageAudit.katalogFingerprint,
      erwarteteZiele: bericht.coverageAudit.erwarteteZiele,
      fullyResolved: bericht.coverageAudit.fullyResolved,
      structuralGaps: bericht.coverageAudit.structuralGaps,
      liveEvidenceFaelle: bericht.coverageAudit.liveEvidenceFaelle,
    },
    soak: {
      dauerMs: bericht.soakDauerMs,
      sampleAnzahl: bericht.sampleAnzahl,
      sampleGaps: bericht.sampleGaps,
      fingerprintFehler: bericht.fingerprintFehler,
      duplicateIrreversibleEffects: bericht.duplicateIrreversibleEffects,
      unverifiedIrreversibleEffects: bericht.unverifiedIrreversibleEffects,
      invariantViolations: bericht.invariantViolations,
    },
    controlledProof: {
      actionContractId: bericht.stage3Outcome.actionContractId,
      recoveryContractId: bericht.stage3Outcome.recoveryContractId,
      verifierId: bericht.stage3Outcome.verifierId,
      sendCount: bericht.stage3Outcome.sendCount,
      sameIntentErneutSenden: bericht.stage3Outcome.sameIntentErneutSenden,
      postconditionVerifiziert: bericht.stage3Outcome.postconditionVerifiziert,
      recipientSettlementVerifiziert: bericht.stage3Outcome.recipientSettlementVerifiziert,
      journalStatus: bericht.journalStatus,
      zertifiziererGameplayWrites: bericht.zertifiziererGameplayWrites,
      controlledProofDriverGameplayWrites: bericht.controlledProofDriverGameplayWrites,
    },
    syntheticRegression: {
      status: bericht.syntheticRegressionStatus,
      bestanden: bericht.syntheticRegressionBestanden,
      synthetischeEvidenceZaehltAlsLive: bericht.synthetischeEvidenceZaehltAlsLive,
    },
    production: {
      produktionsId: bericht.production.produktionsId,
      planFingerprint: bericht.production.planFingerprint,
      recipientCharacterId: bericht.production.recipientCharacterId,
      serverRegion: bericht.production.serverRegion,
      serverIdentifier: bericht.production.serverIdentifier,
    },
    blocker: [],
    safety: {
      diagnosticOnly: true,
      actionAuthority: false,
      rawWriteAuthority: false,
      breiteRuntimeFreigabe: false,
    },
    hinweis:
      "CAP-045 Production-Live-Evidence wurde fail-closed aus einem bestandenen V5-Ingame-Testbericht abgeleitet. Sie ersetzt keine separate globale Runtime-Freigabe.",
  });
}

function cli() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    fehler("AUFRUF: node werkzeuge/cap045-production-live-evidence-pruefen.mjs <bericht.txt|json> [--evidence <ziel.json>]");
  }
  const input = args[0];
  let evidencePfad = null;
  for (let index = 1; index < args.length; index += 1) {
    if (args[index] === "--evidence") {
      evidencePfad = args[index + 1] ?? null;
      index += 1;
    } else {
      fehler("UNBEKANNTES_ARGUMENT:" + args[index]);
    }
  }
  if (evidencePfad !== null && evidencePfad.trim().length === 0) {
    fehler("EVIDENCE_ZIEL_FEHLT");
  }

  const raw = fs.readFileSync(input, "utf8");
  const bericht = extrahiereCap045Bericht(raw);
  const evidence = baueCap045LiveEvidence(bericht, raw);
  if (evidencePfad !== null) {
    fs.writeFileSync(evidencePfad, JSON.stringify(evidence, null, 2) + "\n", "utf8");
  }
  console.log(
    "[V5-CAP045-LIVE-EVIDENCE] OK / LIVE:",
    evidence.status,
    "/ Samples:",
    evidence.soak.sampleAnzahl,
    "/ DauerMs:",
    evidence.soak.dauerMs,
    evidencePfad ? "/ Evidence: " + evidencePfad : ""
  );
}

if (process.argv[1]?.endsWith("cap045-production-live-evidence-pruefen.mjs")) {
  cli();
}
