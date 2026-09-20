export interface HarteLernGrenzen {
  readonly safetyErlaubt: boolean;
  readonly authorityErlaubt: boolean;
  readonly operatorErlaubt: boolean;
  readonly quarantaeneErlaubt: boolean;
  readonly budgetErlaubt: boolean;
  readonly retryGrenzeUnveraendert: boolean;
}

export interface LernEinfluss {
  readonly schemaVersion: 1;
  readonly vorschlagKennung: string;
  readonly evidenceFingerprint: string;
  readonly gameplayAutoritaet: false;
  readonly authorityAenderungErlaubt: false;
  readonly safetyLockerungErlaubt: false;
  readonly budgetErhoehungErlaubt: false;
  readonly quarantaeneFreigabeErlaubt: false;
  readonly operatorDenyUeberstimmenErlaubt: false;
}

export type LernAdmissionGrund =
  | "OK"
  | "SAFETY_DENY"
  | "AUTHORITY_DENY"
  | "OPERATOR_DENY"
  | "QUARANTAENE"
  | "BUDGET_DENY"
  | "RETRY_GRENZE_DRIFT"
  | "VORSCHLAG_UNGUELTIG";

export interface LernAdmissionNachweis {
  readonly erlaubt:boolean;
  readonly grund:LernAdmissionGrund;
  readonly learningKannDenyNichtUeberstimmen:true;
  readonly gameplayAutoritaet:false;
}

function text(w:string,f:string):void{
  if(w.trim().length===0||w.length>192) throw new Error(f);
}

export function pruefeLernAdmission(
  grenzen:HarteLernGrenzen,
  learning:LernEinfluss|null,
):LernAdmissionNachweis{
  const out=(erlaubt:boolean,grund:LernAdmissionGrund):LernAdmissionNachweis=>Object.freeze({
    erlaubt,grund,learningKannDenyNichtUeberstimmen:true,gameplayAutoritaet:false,
  });
  if(!grenzen.safetyErlaubt) return out(false,"SAFETY_DENY");
  if(!grenzen.authorityErlaubt) return out(false,"AUTHORITY_DENY");
  if(!grenzen.operatorErlaubt) return out(false,"OPERATOR_DENY");
  if(!grenzen.quarantaeneErlaubt) return out(false,"QUARANTAENE");
  if(!grenzen.budgetErlaubt) return out(false,"BUDGET_DENY");
  if(!grenzen.retryGrenzeUnveraendert) return out(false,"RETRY_GRENZE_DRIFT");
  if(learning===null) return out(true,"OK");
  if(learning.schemaVersion!==1
      ||learning.gameplayAutoritaet!==false
      ||learning.authorityAenderungErlaubt!==false
      ||learning.safetyLockerungErlaubt!==false
      ||learning.budgetErhoehungErlaubt!==false
      ||learning.quarantaeneFreigabeErlaubt!==false
      ||learning.operatorDenyUeberstimmenErlaubt!==false){
    return out(false,"VORSCHLAG_UNGUELTIG");
  }
  text(learning.vorschlagKennung,"LERN_ADMISSION_VORSCHLAG_UNGUELTIG");
  text(learning.evidenceFingerprint,"LERN_ADMISSION_EVIDENCE_UNGUELTIG");
  return out(true,"OK");
}
