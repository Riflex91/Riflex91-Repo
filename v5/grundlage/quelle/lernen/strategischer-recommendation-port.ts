import type { LearningEvidence } from "../wissen/learning-evidence.js";
import {
  type LernDatenPin,
} from "./datenbasis-pin.js";
import {
  type DeterministischerKandidat,
  type LernRankingVorschlag,
  type RankingErgebnis,
  waehleDeterministisch,
  waehleMitGebundenemLearning,
} from "./deterministischer-fallback.js";
import {
  pruefeLernAdmission,
  type HarteLernGrenzen,
  type LernAdmissionNachweis,
  type LernEinfluss,
} from "./lern-admission.js";

export type StrategischerRecommendationModus =
  | "SHADOW"
  | "RECOMMENDATION_ONLY";

export type StrategischeRecommendationArt =
  | "BLOCKIERT"
  | "DETERMINISTISCHER_FALLBACK"
  | "LEARNING_EMPFEHLUNG";

export interface StrategischeRecommendationAnfrage {
  readonly schemaVersion: 1;
  readonly vorschlagKennung: string;
  readonly modus: StrategischerRecommendationModus;
  readonly learningEvidence: LearningEvidence;
  readonly datenPin: LernDatenPin;
  readonly kandidaten: readonly DeterministischerKandidat[];
  readonly lernVorschlag: LernRankingVorschlag | null;
  readonly harteGrenzen: HarteLernGrenzen;
  readonly maximalesEvidenceAlterMs: number;
}

export interface StrategischeRecommendation {
  readonly schemaVersion: 1;
  readonly vorschlagKennung: string;
  readonly art: StrategischeRecommendationArt;
  readonly modus: StrategischerRecommendationModus;
  readonly grund: string;
  readonly baseline: RankingErgebnis;
  readonly empfehlung: RankingErgebnis | null;
  readonly weichtVonBaselineAb: boolean;
  readonly admission: LernAdmissionNachweis;
  readonly evidenceKennung: string;
  readonly datenFingerprint: string;
  readonly modellKennung: string;
  readonly modellVersion: string;
  readonly recommendationFingerprint: string;
  readonly anwendbarAufGameplay: false;
  readonly direkteActionAutoritaet: false;
  readonly gameplayAutoritaet: false;
  readonly ausfuehrungsAutoritaet: false;
  readonly mutationAutorisiert: false;
  readonly safetyLockerungErlaubt: false;
  readonly authorityAenderungErlaubt: false;
  readonly automatischePromotion: false;
  readonly deterministischerFallbackImmerVerfuegbar: true;
}

export interface StrategischerRecommendationPort {
  empfehle(
    anfrage: StrategischeRecommendationAnfrage,
    jetztMs: number,
  ): StrategischeRecommendation;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) {
    throw new Error(fehler);
  }
}

function pruefeZeit(wert: number, fehler: string): void {
  if (!Number.isSafeInteger(wert) || wert < 0) {
    throw new Error(fehler);
  }
}

function kompakteKennung(prefix: string, text: string): string {
  let checksum = 0;
  for (let index = 0; index < text.length; index += 1) {
    checksum = (checksum * 131 + text.charCodeAt(index)) % 2_147_483_647;
  }
  return prefix + ":" + String(text.length) + ":" + String(checksum);
}

function validiereGrundstruktur(
  anfrage: StrategischeRecommendationAnfrage,
  jetztMs: number,
): void {
  if (anfrage.schemaVersion !== 1) {
    throw new Error("STRATEGIE_RECOMMENDATION_SCHEMA_UNGUELTIG");
  }
  pruefeText(
    anfrage.vorschlagKennung,
    "STRATEGIE_RECOMMENDATION_KENNUNG_UNGUELTIG",
  );
  if (anfrage.modus !== "SHADOW"
      && anfrage.modus !== "RECOMMENDATION_ONLY") {
    throw new Error("STRATEGIE_RECOMMENDATION_MODUS_UNGUELTIG");
  }
  pruefeZeit(jetztMs, "STRATEGIE_RECOMMENDATION_ZEIT_UNGUELTIG");
  pruefeZeit(
    anfrage.maximalesEvidenceAlterMs,
    "STRATEGIE_RECOMMENDATION_EVIDENCE_ALTER_UNGUELTIG",
  );
  if (anfrage.maximalesEvidenceAlterMs < 1
      || anfrage.maximalesEvidenceAlterMs > 86_400_000) {
    throw new Error("STRATEGIE_RECOMMENDATION_EVIDENCE_ALTER_UNGUELTIG");
  }

  const evidence = anfrage.learningEvidence;
  if (evidence.schemaVersion !== 1
      || evidence.learningEvidenceVersion !== 1
      || evidence.autoritaet !== "ANALYSE_NACHWEIS"
      || evidence.gameplayAutoritaet !== false
      || evidence.ausfuehrungsAutoritaet !== false
      || evidence.mutationAutorisiert !== false
      || evidence.automatischePromotion !== false) {
    throw new Error("STRATEGIE_RECOMMENDATION_EVIDENCE_UNGUELTIG");
  }
  for (const text of [
    evidence.evidenceKennung,
    evidence.wissensSnapshotKennung,
    evidence.modellKennung,
    evidence.modellVersion,
    anfrage.datenPin.evidenceKennung,
    anfrage.datenPin.wissensSnapshotKennung,
    anfrage.datenPin.modellKennung,
    anfrage.datenPin.modellVersion,
    anfrage.datenPin.datenFingerprint,
  ]) {
    pruefeText(text, "STRATEGIE_RECOMMENDATION_EVIDENCE_TEXT_UNGUELTIG");
  }
  pruefeZeit(
    evidence.erzeugtAmMs,
    "STRATEGIE_RECOMMENDATION_EVIDENCE_ZEIT_UNGUELTIG",
  );
}

function bindungIstKonsistent(
  anfrage: StrategischeRecommendationAnfrage,
): boolean {
  const evidence = anfrage.learningEvidence;
  const pin = anfrage.datenPin;
  if (pin.schemaVersion !== 1
      || pin.learningEvidenceVersion !== 1
      || pin.gameplayAutoritaet !== false
      || pin.mutationAutorisiert !== false) {
    return false;
  }
  if (pin.evidenceKennung !== evidence.evidenceKennung
      || pin.wissensSnapshotKennung !== evidence.wissensSnapshotKennung
      || pin.featureSchemaVersion !== evidence.featureSchemaVersion
      || pin.modellKennung !== evidence.modellKennung
      || pin.modellVersion !== evidence.modellVersion
      || pin.stichproben !== evidence.stichproben) {
    return false;
  }
  const vorschlag = anfrage.lernVorschlag;
  if (vorschlag === null) return true;
  return vorschlag.modellKennung === pin.modellKennung
    && vorschlag.modellVersion === pin.modellVersion
    && vorschlag.datenFingerprint === pin.datenFingerprint
    && vorschlag.gameplayAutoritaet === false
    && vorschlag.authorityAenderungErlaubt === false;
}

function learningIstFrisch(
  anfrage: StrategischeRecommendationAnfrage,
  jetztMs: number,
): boolean {
  const erzeugtAmMs = anfrage.learningEvidence.erzeugtAmMs;
  return erzeugtAmMs <= jetztMs
    && jetztMs - erzeugtAmMs <= anfrage.maximalesEvidenceAlterMs;
}

function lernEinfluss(
  anfrage: StrategischeRecommendationAnfrage,
): LernEinfluss {
  return Object.freeze({
    schemaVersion: 1,
    vorschlagKennung: anfrage.vorschlagKennung,
    evidenceFingerprint: kompakteKennung(
      "learning",
      [
        anfrage.learningEvidence.evidenceKennung,
        anfrage.datenPin.datenFingerprint,
        anfrage.learningEvidence.modellKennung,
        anfrage.learningEvidence.modellVersion,
      ].join("|"),
    ),
    gameplayAutoritaet: false,
    authorityAenderungErlaubt: false,
    safetyLockerungErlaubt: false,
    budgetErhoehungErlaubt: false,
    quarantaeneFreigabeErlaubt: false,
    operatorDenyUeberstimmenErlaubt: false,
  });
}

function recommendationFingerprint(
  anfrage: StrategischeRecommendationAnfrage,
  art: StrategischeRecommendationArt,
  baseline: RankingErgebnis,
  empfehlung: RankingErgebnis | null,
  grund: string,
): string {
  return kompakteKennung(
    "strategy-rec",
    [
      anfrage.vorschlagKennung,
      art,
      anfrage.modus,
      grund,
      baseline.kandidatId ?? "-",
      empfehlung?.kandidatId ?? "-",
      anfrage.learningEvidence.evidenceKennung,
      anfrage.datenPin.datenFingerprint,
    ].join("|"),
  );
}

function baueRecommendation(
  anfrage: StrategischeRecommendationAnfrage,
  art: StrategischeRecommendationArt,
  grund: string,
  baseline: RankingErgebnis,
  empfehlung: RankingErgebnis | null,
  admission: LernAdmissionNachweis,
): StrategischeRecommendation {
  return Object.freeze({
    schemaVersion: 1,
    vorschlagKennung: anfrage.vorschlagKennung,
    art,
    modus: anfrage.modus,
    grund,
    baseline: Object.freeze({ ...baseline }),
    empfehlung: empfehlung === null
      ? null
      : Object.freeze({ ...empfehlung }),
    weichtVonBaselineAb:
      empfehlung !== null
      && empfehlung.kandidatId !== baseline.kandidatId,
    admission: Object.freeze({ ...admission }),
    evidenceKennung: anfrage.learningEvidence.evidenceKennung,
    datenFingerprint: anfrage.datenPin.datenFingerprint,
    modellKennung: anfrage.learningEvidence.modellKennung,
    modellVersion: anfrage.learningEvidence.modellVersion,
    recommendationFingerprint: recommendationFingerprint(
      anfrage,
      art,
      baseline,
      empfehlung,
      grund,
    ),
    anwendbarAufGameplay: false,
    direkteActionAutoritaet: false,
    gameplayAutoritaet: false,
    ausfuehrungsAutoritaet: false,
    mutationAutorisiert: false,
    safetyLockerungErlaubt: false,
    authorityAenderungErlaubt: false,
    automatischePromotion: false,
    deterministischerFallbackImmerVerfuegbar: true,
  });
}

export class GebundenerStrategischerRecommendationPort
implements StrategischerRecommendationPort {
  public empfehle(
    anfrage: StrategischeRecommendationAnfrage,
    jetztMs: number,
  ): StrategischeRecommendation {
    validiereGrundstruktur(anfrage, jetztMs);

    const baseline = waehleDeterministisch(anfrage.kandidaten);
    const einfluss = lernEinfluss(anfrage);
    const admission = pruefeLernAdmission(
      anfrage.harteGrenzen,
      einfluss,
    );

    if (!admission.erlaubt) {
      return baueRecommendation(
        anfrage,
        "BLOCKIERT",
        "STRATEGIE_HARTE_GRENZE:" + admission.grund,
        baseline,
        null,
        admission,
      );
    }

    if (!bindungIstKonsistent(anfrage)) {
      return baueRecommendation(
        anfrage,
        "DETERMINISTISCHER_FALLBACK",
        "STRATEGIE_LEARNING_BINDUNG_DRIFT",
        baseline,
        baseline,
        admission,
      );
    }

    if (!learningIstFrisch(anfrage, jetztMs)) {
      return baueRecommendation(
        anfrage,
        "DETERMINISTISCHER_FALLBACK",
        "STRATEGIE_LEARNING_EVIDENCE_STALE",
        baseline,
        baseline,
        admission,
      );
    }

    if (anfrage.lernVorschlag === null) {
      return baueRecommendation(
        anfrage,
        "DETERMINISTISCHER_FALLBACK",
        "STRATEGIE_KEIN_LEARNING_VORSCHLAG",
        baseline,
        baseline,
        admission,
      );
    }

    const learning = waehleMitGebundenemLearning(
      anfrage.kandidaten,
      anfrage.lernVorschlag,
    );
    if (learning.quelle !== "LEARNING_GEBUNDET") {
      return baueRecommendation(
        anfrage,
        "DETERMINISTISCHER_FALLBACK",
        "STRATEGIE_LEARNING_VORSCHLAG_UNGUELTIG",
        baseline,
        baseline,
        admission,
      );
    }

    return baueRecommendation(
      anfrage,
      "LEARNING_EMPFEHLUNG",
      anfrage.modus === "SHADOW"
        ? "STRATEGIE_SHADOW_EMPFEHLUNG"
        : "STRATEGIE_GEBUNDENE_EMPFEHLUNG",
      baseline,
      learning,
      admission,
    );
  }
}
