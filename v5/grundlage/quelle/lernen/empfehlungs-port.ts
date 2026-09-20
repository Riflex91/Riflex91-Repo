import type { LearningEvidence } from "../wissen/learning-evidence.js";
import type { LernDatenPin } from "./datenbasis-pin.js";
import {
  waehleDeterministisch,
  waehleMitGebundenemLearning,
  type DeterministischerKandidat,
  type LernRankingVorschlag,
  type RankingErgebnis,
} from "./deterministischer-fallback.js";
import {
  pruefeLernAdmission,
  type HarteLernGrenzen,
  type LernAdmissionNachweis,
  type LernEinfluss,
} from "./lern-admission.js";
import type { ModellLigaSicht } from "./modell-liga.js";

export interface GebundenerStrategischerVorschlag {
  readonly schemaVersion: 1;
  readonly einfluss: LernEinfluss;
  readonly evidence: LearningEvidence;
  readonly datenPin: LernDatenPin;
  readonly ranking: LernRankingVorschlag;
}

export interface StrategischeEmpfehlungsRichtlinie {
  readonly richtlinienVersion: string;
  readonly maximalesEvidenceAlterMs: number;
  readonly mindestStichproben: number;
  readonly maximalerLearningScoreDelta: number;
}

export interface StrategischeEmpfehlungsAnfrage {
  readonly kandidaten: readonly DeterministischerKandidat[];
  readonly harteGrenzen: HarteLernGrenzen;
  readonly modellLiga: ModellLigaSicht;
  readonly championVorschlag: GebundenerStrategischerVorschlag | null;
  readonly challengerVorschlag: GebundenerStrategischerVorschlag | null;
  readonly richtlinie: StrategischeEmpfehlungsRichtlinie;
}

export type StrategischeEmpfehlungsQuelle =
  | "GESPERRT"
  | "DETERMINISTISCH"
  | "CHAMPION_LEARNING_GEBUNDET";

export interface StrategischeEmpfehlung {
  readonly schemaVersion: 1;
  readonly empfohlenKandidatId: string | null;
  readonly quelle: StrategischeEmpfehlungsQuelle;
  readonly grund: string;
  readonly deterministischerFallback: RankingErgebnis;
  readonly championErgebnis: RankingErgebnis | null;
  readonly shadowErgebnis: RankingErgebnis | null;
  readonly shadowGrund: string | null;
  readonly admission: LernAdmissionNachweis;
  readonly richtlinienVersion: string;
  readonly recommendationPort: true;
  readonly shadowNurAnalyse: true;
  readonly deterministischerFallbackImmerVerfuegbar: true;
  readonly gameplayAutoritaet: false;
  readonly ausfuehrungsAutoritaet: false;
  readonly mutationAutorisiert: false;
  readonly authorityAenderungErlaubt: false;
}

function text(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function validiereRichtlinie(
  richtlinie: StrategischeEmpfehlungsRichtlinie,
): void {
  text(
    richtlinie.richtlinienVersion,
    "STRATEGISCHE_EMPFEHLUNG_RICHTLINIE_UNGUELTIG",
  );
  if (!Number.isSafeInteger(richtlinie.maximalesEvidenceAlterMs)
      || richtlinie.maximalesEvidenceAlterMs < 1
      || richtlinie.maximalesEvidenceAlterMs > 86_400_000
      || !Number.isSafeInteger(richtlinie.mindestStichproben)
      || richtlinie.mindestStichproben < 1
      || richtlinie.mindestStichproben > 10_000_000
      || !Number.isFinite(richtlinie.maximalerLearningScoreDelta)
      || richtlinie.maximalerLearningScoreDelta < 0
      || richtlinie.maximalerLearningScoreDelta > 1_000) {
    throw new Error("STRATEGISCHE_EMPFEHLUNG_RICHTLINIE_UNGUELTIG");
  }
}

function evidenceAnalyseOnly(evidence: LearningEvidence): boolean {
  return evidence.schemaVersion === 1
    && evidence.learningEvidenceVersion === 1
    && evidence.autoritaet === "ANALYSE_NACHWEIS"
    && evidence.gameplayAutoritaet === false
    && evidence.ausfuehrungsAutoritaet === false
    && evidence.mutationAutorisiert === false
    && evidence.automatischePromotion === false;
}

function pinAnalyseOnly(pin: LernDatenPin): boolean {
  return pin.schemaVersion === 1
    && pin.learningEvidenceVersion === 1
    && pin.gameplayAutoritaet === false
    && pin.mutationAutorisiert === false;
}

function vorschlagAuthorityFrei(
  vorschlag: GebundenerStrategischerVorschlag,
): boolean {
  return vorschlag.schemaVersion === 1
    && vorschlag.einfluss.schemaVersion === 1
    && vorschlag.einfluss.gameplayAutoritaet === false
    && vorschlag.einfluss.authorityAenderungErlaubt === false
    && vorschlag.einfluss.safetyLockerungErlaubt === false
    && vorschlag.einfluss.budgetErhoehungErlaubt === false
    && vorschlag.einfluss.quarantaeneFreigabeErlaubt === false
    && vorschlag.einfluss.operatorDenyUeberstimmenErlaubt === false
    && vorschlag.ranking.schemaVersion === 1
    && vorschlag.ranking.gameplayAutoritaet === false
    && vorschlag.ranking.authorityAenderungErlaubt === false;
}

function bindingPasst(
  vorschlag: GebundenerStrategischerVorschlag,
): boolean {
  const evidence = vorschlag.evidence;
  const pin = vorschlag.datenPin;
  const ranking = vorschlag.ranking;
  return evidence.evidenceKennung === pin.evidenceKennung
    && evidence.wissensSnapshotKennung === pin.wissensSnapshotKennung
    && evidence.featureSchemaVersion === pin.featureSchemaVersion
    && evidence.modellKennung === pin.modellKennung
    && evidence.modellVersion === pin.modellVersion
    && evidence.stichproben === pin.stichproben
    && ranking.modellKennung === pin.modellKennung
    && ranking.modellVersion === pin.modellVersion
    && ranking.datenFingerprint === pin.datenFingerprint;
}

function policyPasst(
  vorschlag: GebundenerStrategischerVorschlag,
  jetztMs: number,
  richtlinie: StrategischeEmpfehlungsRichtlinie,
): boolean {
  const evidence = vorschlag.evidence;
  return Number.isSafeInteger(evidence.erzeugtAmMs)
    && evidence.erzeugtAmMs >= 0
    && evidence.erzeugtAmMs <= jetztMs
    && jetztMs - evidence.erzeugtAmMs <= richtlinie.maximalesEvidenceAlterMs
    && evidence.stichproben >= richtlinie.mindestStichproben
    && Number.isFinite(vorschlag.ranking.maximalerAbsoluterScoreDelta)
    && vorschlag.ranking.maximalerAbsoluterScoreDelta
      <= richtlinie.maximalerLearningScoreDelta;
}

function modellPasst(
  vorschlag: GebundenerStrategischerVorschlag,
  modell: Readonly<{
    modellKennung: string;
    modellVersion: string;
    featureSchemaVersion: number;
    datenFingerprint: string;
  }>,
): boolean {
  return vorschlag.evidence.modellKennung === modell.modellKennung
    && vorschlag.evidence.modellVersion === modell.modellVersion
    && vorschlag.evidence.featureSchemaVersion === modell.featureSchemaVersion
    && vorschlag.datenPin.datenFingerprint === modell.datenFingerprint;
}

function validiereGebundenenVorschlag(
  vorschlag: GebundenerStrategischerVorschlag,
  jetztMs: number,
  richtlinie: StrategischeEmpfehlungsRichtlinie,
): boolean {
  if (!vorschlagAuthorityFrei(vorschlag)
      || !evidenceAnalyseOnly(vorschlag.evidence)
      || !pinAnalyseOnly(vorschlag.datenPin)
      || !bindingPasst(vorschlag)
      || !policyPasst(vorschlag, jetztMs, richtlinie)) {
    return false;
  }
  for (const wert of [
    vorschlag.einfluss.vorschlagKennung,
    vorschlag.einfluss.evidenceFingerprint,
    vorschlag.evidence.evidenceKennung,
    vorschlag.evidence.wissensSnapshotKennung,
    vorschlag.evidence.modellKennung,
    vorschlag.evidence.modellVersion,
    vorschlag.datenPin.datenFingerprint,
  ]) {
    text(wert, "STRATEGISCHE_EMPFEHLUNG_VORSCHLAG_TEXT_UNGUELTIG");
  }
  return true;
}

function gebundenesRanking(
  kandidaten: readonly DeterministischerKandidat[],
  vorschlag: GebundenerStrategischerVorschlag,
): RankingErgebnis {
  return waehleMitGebundenemLearning(
    kandidaten,
    vorschlag.ranking,
  );
}

function out(
  empfohlenKandidatId: string | null,
  quelle: StrategischeEmpfehlungsQuelle,
  grund: string,
  fallback: RankingErgebnis,
  championErgebnis: RankingErgebnis | null,
  shadowErgebnis: RankingErgebnis | null,
  shadowGrund: string | null,
  admission: LernAdmissionNachweis,
  richtlinie: StrategischeEmpfehlungsRichtlinie,
): StrategischeEmpfehlung {
  return Object.freeze({
    schemaVersion: 1,
    empfohlenKandidatId,
    quelle,
    grund,
    deterministischerFallback: Object.freeze({ ...fallback }),
    championErgebnis: championErgebnis === null
      ? null
      : Object.freeze({ ...championErgebnis }),
    shadowErgebnis: shadowErgebnis === null
      ? null
      : Object.freeze({ ...shadowErgebnis }),
    shadowGrund,
    admission: Object.freeze({ ...admission }),
    richtlinienVersion: richtlinie.richtlinienVersion,
    recommendationPort: true,
    shadowNurAnalyse: true,
    deterministischerFallbackImmerVerfuegbar: true,
    gameplayAutoritaet: false,
    ausfuehrungsAutoritaet: false,
    mutationAutorisiert: false,
    authorityAenderungErlaubt: false,
  });
}

export function erzeugeStrategischeEmpfehlung(
  anfrage: StrategischeEmpfehlungsAnfrage,
  jetztMs: number,
): StrategischeEmpfehlung {
  validiereRichtlinie(anfrage.richtlinie);
  if (!Number.isSafeInteger(jetztMs) || jetztMs < 0) {
    throw new Error("STRATEGISCHE_EMPFEHLUNG_ZEIT_UNGUELTIG");
  }

  const fallback = waehleDeterministisch(anfrage.kandidaten);
  const admission = pruefeLernAdmission(
    anfrage.harteGrenzen,
    anfrage.championVorschlag?.einfluss ?? null,
  );

  let shadowErgebnis: RankingErgebnis | null = null;
  let shadowGrund: string | null = null;
  const challenger = anfrage.modellLiga.challenger;
  if (anfrage.challengerVorschlag !== null) {
    const shadowGueltig = challenger !== null
      && (challenger.status === "SHADOW"
        || challenger.status === "PROMOTION_BEREIT")
      && challenger.rolle === "CHALLENGER"
      && challenger.gameplayTrafficErlaubt === false
      && challenger.gameplayAutoritaet === false
      && validiereGebundenenVorschlag(
        anfrage.challengerVorschlag,
        jetztMs,
        anfrage.richtlinie,
      )
      && modellPasst(anfrage.challengerVorschlag, challenger);
    if (shadowGueltig) {
      shadowErgebnis = gebundenesRanking(
        anfrage.kandidaten,
        anfrage.challengerVorschlag,
      );
      shadowGrund = "CHALLENGER_SHADOW_AUSGEWERTET";
    } else {
      shadowGrund = "CHALLENGER_SHADOW_UNGUELTIG";
    }
  }

  if (!admission.erlaubt) {
    return out(
      null,
      "GESPERRT",
      "HARD_GATE_" + admission.grund,
      fallback,
      null,
      shadowErgebnis,
      shadowGrund,
      admission,
      anfrage.richtlinie,
    );
  }

  const champion = anfrage.modellLiga.champion;
  if (anfrage.championVorschlag !== null) {
    const championGueltig = champion.rolle === "CHAMPION"
      && champion.status === "AKTIV"
      && champion.gameplayTrafficErlaubt === false
      && champion.gameplayAutoritaet === false
      && validiereGebundenenVorschlag(
        anfrage.championVorschlag,
        jetztMs,
        anfrage.richtlinie,
      )
      && modellPasst(anfrage.championVorschlag, champion);

    if (championGueltig) {
      const ranking = gebundenesRanking(
        anfrage.kandidaten,
        anfrage.championVorschlag,
      );
      return out(
        ranking.kandidatId,
        "CHAMPION_LEARNING_GEBUNDET",
        "CHAMPION_VORSCHLAG_GEBUNDEN",
        fallback,
        ranking,
        shadowErgebnis,
        shadowGrund,
        admission,
        anfrage.richtlinie,
      );
    }

    return out(
      fallback.kandidatId,
      "DETERMINISTISCH",
      "CHAMPION_VORSCHLAG_UNGUELTIG_FALLBACK",
      fallback,
      null,
      shadowErgebnis,
      shadowGrund,
      admission,
      anfrage.richtlinie,
    );
  }

  return out(
    fallback.kandidatId,
    "DETERMINISTISCH",
    "LEARNING_NICHT_VORHANDEN_FALLBACK",
    fallback,
    null,
    shadowErgebnis,
    shadowGrund,
    admission,
    anfrage.richtlinie,
  );
}
