import type { LearningEvidence } from "../wissen/learning-evidence.js";

export interface LernDatenPin {
  readonly schemaVersion:1;
  readonly learningEvidenceVersion:1;
  readonly evidenceKennung:string;
  readonly wissensSnapshotKennung:string;
  readonly featureSchemaVersion:number;
  readonly modellKennung:string;
  readonly modellVersion:string;
  readonly stichproben:number;
  readonly datenFingerprint:string;
  readonly gameplayAutoritaet:false;
  readonly mutationAutorisiert:false;
}

function text(w:string,f:string):void{
  if(w.trim().length===0||w.length>192) throw new Error(f);
}

export function pinneLernDatenbasis(
  evidence:LearningEvidence,
  datenFingerprint:string,
):LernDatenPin{
  text(datenFingerprint,"LERN_DATEN_FINGERPRINT_UNGUELTIG");
  if(evidence.schemaVersion!==1
      ||evidence.learningEvidenceVersion!==1
      ||evidence.gameplayAutoritaet!==false
      ||evidence.ausfuehrungsAutoritaet!==false
      ||evidence.mutationAutorisiert!==false
      ||evidence.automatischePromotion!==false
      ||!Number.isSafeInteger(evidence.featureSchemaVersion)
      ||evidence.featureSchemaVersion<1
      ||!Number.isSafeInteger(evidence.stichproben)
      ||evidence.stichproben<1){
    throw new Error("LERN_DATEN_EVIDENCE_UNGUELTIG");
  }
  for(const v of [
    evidence.evidenceKennung,evidence.wissensSnapshotKennung,
    evidence.modellKennung,evidence.modellVersion
  ]) text(v,"LERN_DATEN_TEXT_UNGUELTIG");
  return Object.freeze({
    schemaVersion:1,
    learningEvidenceVersion:1,
    evidenceKennung:evidence.evidenceKennung,
    wissensSnapshotKennung:evidence.wissensSnapshotKennung,
    featureSchemaVersion:evidence.featureSchemaVersion,
    modellKennung:evidence.modellKennung,
    modellVersion:evidence.modellVersion,
    stichproben:evidence.stichproben,
    datenFingerprint,
    gameplayAutoritaet:false,
    mutationAutorisiert:false,
  });
}
