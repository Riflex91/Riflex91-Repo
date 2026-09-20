export interface LearningEvidenceEingabe {
  readonly evidenceKennung: string;
  readonly erzeugtAmMs: number;
  readonly wissensSnapshotKennung: string;
  readonly featureSchemaVersion: number;
  readonly modellKennung: string;
  readonly modellVersion: string;
  readonly stichproben: number;
  readonly metriken: Readonly<Record<string, number>>;
}

export interface LearningEvidence {
  readonly schemaVersion: 1;
  readonly learningEvidenceVersion: 1;
  readonly evidenceKennung: string;
  readonly erzeugtAmMs: number;
  readonly wissensSnapshotKennung: string;
  readonly featureSchemaVersion: number;
  readonly modellKennung: string;
  readonly modellVersion: string;
  readonly stichproben: number;
  readonly metriken: Readonly<Record<string, number>>;
  readonly autoritaet: "ANALYSE_NACHWEIS";
  readonly gameplayAutoritaet: false;
  readonly ausfuehrungsAutoritaet: false;
  readonly mutationAutorisiert: false;
  readonly automatischePromotion: false;
}

export function erzeugeLearningEvidence(eingabe: LearningEvidenceEingabe): LearningEvidence {
  if (eingabe.evidenceKennung.trim().length === 0
      || eingabe.wissensSnapshotKennung.trim().length === 0
      || eingabe.modellKennung.trim().length === 0
      || eingabe.modellVersion.trim().length === 0) {
    throw new Error("LEARNING_EVIDENCE_KENNUNG_ODER_VERSION_FEHLT");
  }
  if (!Number.isFinite(eingabe.erzeugtAmMs) || eingabe.erzeugtAmMs < 0
      || !Number.isSafeInteger(eingabe.featureSchemaVersion)
      || eingabe.featureSchemaVersion < 1
      || !Number.isSafeInteger(eingabe.stichproben)
      || eingabe.stichproben < 1) {
    throw new Error("LEARNING_EVIDENCE_VERSION_ODER_STICHPROBE_UNGUELTIG");
  }
  const metrikNamen = Object.keys(eingabe.metriken).sort();
  if (metrikNamen.length > 128) throw new Error("LEARNING_EVIDENCE_ZU_VIELE_METRIKEN");
  for (const name of metrikNamen) {
    const wert = eingabe.metriken[name];
    if (name.trim().length === 0 || wert === undefined || !Number.isFinite(wert)) {
      throw new Error("LEARNING_EVIDENCE_METRIK_UNGUELTIG");
    }
  }

  return Object.freeze({
    schemaVersion: 1,
    learningEvidenceVersion: 1,
    evidenceKennung: eingabe.evidenceKennung,
    erzeugtAmMs: eingabe.erzeugtAmMs,
    wissensSnapshotKennung: eingabe.wissensSnapshotKennung,
    featureSchemaVersion: eingabe.featureSchemaVersion,
    modellKennung: eingabe.modellKennung,
    modellVersion: eingabe.modellVersion,
    stichproben: eingabe.stichproben,
    metriken: Object.freeze({ ...eingabe.metriken }),
    autoritaet: "ANALYSE_NACHWEIS",
    gameplayAutoritaet: false,
    ausfuehrungsAutoritaet: false,
    mutationAutorisiert: false,
    automatischePromotion: false,
  });
}

export function darfLearningEvidenceMutationAutorisieren(
  _evidence: LearningEvidence,
): false {
  return false;
}
