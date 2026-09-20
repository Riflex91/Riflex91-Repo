export type ModellRolle = "CHAMPION" | "CHALLENGER";
export type ModellStatus = "AKTIV" | "SHADOW" | "PROMOTION_BEREIT" | "QUARANTAENE";

export interface LernModell {
  readonly modellKennung:string;
  readonly modellVersion:string;
  readonly featureSchemaVersion:number;
  readonly datenFingerprint:string;
  readonly rolle:ModellRolle;
  readonly status:ModellStatus;
  readonly generation:number;
  readonly gameplayTrafficErlaubt:false;
  readonly gameplayAutoritaet:false;
}

export interface ChallengerEvidence {
  readonly schemaVersion:1;
  readonly modellKennung:string;
  readonly modellVersion:string;
  readonly datenFingerprint:string;
  readonly stichproben:number;
  readonly qualitaetsVerbesserung:number;
  readonly safetyVerletzungen:number;
  readonly invariantVerletzungen:number;
  readonly sampleGaps:number;
  readonly evidenceFingerprint:string;
}

export interface PromotionPolicy {
  readonly mindestStichproben:number;
  readonly minimaleQualitaetsVerbesserung:number;
}

export interface ModellLigaSicht {
  readonly champion:LernModell;
  readonly challenger:LernModell|null;
  readonly letzteEvidence:ChallengerEvidence|null;
  readonly gameplayTrafficNurChampion:false;
}

function text(w:string,f:string):void{
  if(w.trim().length===0||w.length>192) throw new Error(f);
}

function friereModell(x:LernModell):LernModell{return Object.freeze({...x});}
function friereEvidence(x:ChallengerEvidence|null):ChallengerEvidence|null{
  return x===null?null:Object.freeze({...x});
}
function friereSicht(x:ModellLigaSicht):ModellLigaSicht{
  return Object.freeze({
    champion:friereModell(x.champion),
    challenger:x.challenger===null?null:friereModell(x.challenger),
    letzteEvidence:friereEvidence(x.letzteEvidence),
    gameplayTrafficNurChampion:false,
  });
}

export class ModellLiga {
  #sicht:ModellLigaSicht;

  public constructor(champion:LernModell){
    this.#pruefeModell(champion);
    if(champion.rolle!=="CHAMPION"||champion.status!=="AKTIV") throw new Error("MODELL_LIGA_CHAMPION_UNGUELTIG");
    this.#sicht=friereSicht({champion,challenger:null,letzteEvidence:null,gameplayTrafficNurChampion:false});
  }

  public setzeChallenger(modell:LernModell):ModellLigaSicht{
    this.#pruefeModell(modell);
    if(modell.rolle!=="CHALLENGER"||modell.status!=="SHADOW") throw new Error("MODELL_LIGA_CHALLENGER_MUSS_SHADOW_SEIN");
    if(modell.featureSchemaVersion!==this.#sicht.champion.featureSchemaVersion) throw new Error("MODELL_LIGA_FEATURE_SCHEMA_DRIFT");
    this.#sicht=friereSicht({...this.#sicht,challenger:modell,letzteEvidence:null});
    return this.sicht();
  }

  public bewerteChallenger(evidence:ChallengerEvidence,policy:PromotionPolicy):ModellLigaSicht{
    const c=this.#sicht.challenger;
    if(c===null) throw new Error("MODELL_LIGA_KEIN_CHALLENGER");
    this.#pruefeEvidence(evidence);
    if(evidence.modellKennung!==c.modellKennung
        ||evidence.modellVersion!==c.modellVersion
        ||evidence.datenFingerprint!==c.datenFingerprint) throw new Error("MODELL_LIGA_EVIDENCE_BINDUNG_DRIFT");
    if(!Number.isSafeInteger(policy.mindestStichproben)||policy.mindestStichproben<1
        ||!Number.isFinite(policy.minimaleQualitaetsVerbesserung)
        ||policy.minimaleQualitaetsVerbesserung<0) throw new Error("MODELL_LIGA_POLICY_UNGUELTIG");
    const sauber=evidence.safetyVerletzungen===0
      &&evidence.invariantVerletzungen===0
      &&evidence.sampleGaps===0;
    const bereit=sauber
      &&evidence.stichproben>=policy.mindestStichproben
      &&evidence.qualitaetsVerbesserung>=policy.minimaleQualitaetsVerbesserung;
    const challenger=friereModell({...c,status:bereit?"PROMOTION_BEREIT":"SHADOW",gameplayTrafficErlaubt:false,gameplayAutoritaet:false});
    this.#sicht=friereSicht({...this.#sicht,challenger,letzteEvidence:evidence});
    return this.sicht();
  }

  public promote():ModellLigaSicht{
    const c=this.#sicht.challenger;
    const e=this.#sicht.letzteEvidence;
    if(c===null||e===null||c.status!=="PROMOTION_BEREIT"
        ||e.safetyVerletzungen!==0||e.invariantVerletzungen!==0||e.sampleGaps!==0){
      throw new Error("MODELL_LIGA_PROMOTION_NICHT_ERLAUBT");
    }
    const champion=friereModell({
      ...c,rolle:"CHAMPION",status:"AKTIV",generation:this.#sicht.champion.generation+1,
      gameplayTrafficErlaubt:false,gameplayAutoritaet:false,
    });
    this.#sicht=friereSicht({champion,challenger:null,letzteEvidence:e,gameplayTrafficNurChampion:false});
    return this.sicht();
  }

  public quarantiniereChallenger():ModellLigaSicht{
    const c=this.#sicht.challenger;
    if(c===null) return this.sicht();
    this.#sicht=friereSicht({
      ...this.#sicht,
      challenger:friereModell({...c,status:"QUARANTAENE",gameplayTrafficErlaubt:false,gameplayAutoritaet:false}),
    });
    return this.sicht();
  }

  public sicht():ModellLigaSicht{return friereSicht(this.#sicht);}

  #pruefeModell(m:LernModell):void{
    for(const v of [m.modellKennung,m.modellVersion,m.datenFingerprint]) text(v,"MODELL_LIGA_TEXT_UNGUELTIG");
    if(!Number.isSafeInteger(m.featureSchemaVersion)||m.featureSchemaVersion<1
        ||!Number.isSafeInteger(m.generation)||m.generation<1
        ||m.gameplayTrafficErlaubt!==false||m.gameplayAutoritaet!==false) throw new Error("MODELL_LIGA_MODELL_UNGUELTIG");
  }
  #pruefeEvidence(e:ChallengerEvidence):void{
    if(e.schemaVersion!==1) throw new Error("MODELL_LIGA_EVIDENCE_SCHEMA_UNGUELTIG");
    for(const v of [e.modellKennung,e.modellVersion,e.datenFingerprint,e.evidenceFingerprint]) text(v,"MODELL_LIGA_EVIDENCE_TEXT_UNGUELTIG");
    if(!Number.isSafeInteger(e.stichproben)||e.stichproben<1
        ||!Number.isFinite(e.qualitaetsVerbesserung)
        ||!Number.isSafeInteger(e.safetyVerletzungen)||e.safetyVerletzungen<0
        ||!Number.isSafeInteger(e.invariantVerletzungen)||e.invariantVerletzungen<0
        ||!Number.isSafeInteger(e.sampleGaps)||e.sampleGaps<0) throw new Error("MODELL_LIGA_EVIDENCE_UNGUELTIG");
  }
}
