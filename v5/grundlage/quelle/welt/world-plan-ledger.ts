import {
  type WeltDriftNachweis,
  type WeltLiveState,
  type WeltPlanPin,
  pinneWeltPlan,
  pruefeWeltDrift,
} from "./event-quest-drift.js";

export type WeltPlanStatus =
  | "GEPLANT"
  | "AKTIONSBEREIT"
  | "REVALIDIERUNG_ERFORDERLICH"
  | "BLOCKIERT"
  | "ABGESCHLOSSEN";

export interface WeltPlanSicht {
  readonly schemaVersion: 1;
  readonly pin: WeltPlanPin;
  readonly status: WeltPlanStatus;
  readonly letztePruefung: WeltDriftNachweis | null;
  readonly actionAuthority: false;
}

function text(w:string,f:string):void{if(w.trim().length===0||w.length>192) throw new Error(f);}
function friere(x:WeltPlanSicht):WeltPlanSicht{
  return Object.freeze({
    ...x,
    pin:Object.freeze({...x.pin,live:Object.freeze({...x.pin.live})}),
    letztePruefung:x.letztePruefung===null?null:Object.freeze({...x.letztePruefung}),
    actionAuthority:false,
  });
}

export class WeltPlanLedger{
  readonly #maximal:number;
  #eintraege:readonly WeltPlanSicht[]=Object.freeze([]);

  public constructor(maximal=256){
    if(!Number.isInteger(maximal)||maximal<1||maximal>4096) throw new Error("WELT_PLAN_LEDGER_GRENZE_UNGUELTIG");
    this.#maximal=maximal;
  }

  public plane(planId:string,live:WeltLiveState,jetztMs:number):WeltPlanSicht{
    text(planId,"WELT_PLAN_ID_UNGUELTIG");
    if(this.#eintraege.some(x=>x.pin.planId===planId)) throw new Error("WELT_PLAN_ID_DOPPELT");
    if(this.#eintraege.length>=this.#maximal) throw new Error("WELT_PLAN_LEDGER_VOLL");
    const pin=pinneWeltPlan(planId,live,jetztMs);
    const sicht=friere({schemaVersion:1,pin,status:"GEPLANT",letztePruefung:null,actionAuthority:false});
    this.#eintraege=Object.freeze([...this.#eintraege,sicht]);
    return sicht;
  }

  public revalidiere(planId:string,aktuell:WeltLiveState,jetztMs:number):WeltPlanSicht{
    const alt=this.#finde(planId);
    if(alt.status==="ABGESCHLOSSEN") throw new Error("WELT_PLAN_BEREITS_ABGESCHLOSSEN");
    const nachweis=pruefeWeltDrift(alt.pin,aktuell,jetztMs);
    const status:WeltPlanStatus=nachweis.status==="GUELTIG"?"AKTIONSBEREIT":"BLOCKIERT";
    const neu=friere({...alt,status,letztePruefung:nachweis,actionAuthority:false});
    this.#ersetze(neu); return neu;
  }

  public markiereAbgeschlossen(planId:string):WeltPlanSicht{
    const alt=this.#finde(planId);
    if(alt.status!=="AKTIONSBEREIT"||alt.letztePruefung?.actionErlaubt!==true) throw new Error("WELT_PLAN_COMMIT_OHNE_REVALIDIERUNG");
    const neu=friere({...alt,status:"ABGESCHLOSSEN",actionAuthority:false});
    this.#ersetze(neu); return neu;
  }

  public importiereNachRestart(snapshot:readonly WeltPlanSicht[]):void{
    if(snapshot.length>this.#maximal) throw new Error("WELT_PLAN_RESTART_ZU_GROSS");
    this.#eintraege=Object.freeze(snapshot.map((x,i)=>{
      if(x.schemaVersion!==1||snapshot.slice(0,i).some(y=>y.pin.planId===x.pin.planId)) throw new Error("WELT_PLAN_RESTART_SNAPSHOT_UNGUELTIG");
      return friere({
        ...x,
        status:x.status==="ABGESCHLOSSEN"?"ABGESCHLOSSEN":"REVALIDIERUNG_ERFORDERLICH",
        letztePruefung:null,
        actionAuthority:false,
      });
    }));
  }

  public snapshot():readonly WeltPlanSicht[]{return Object.freeze(this.#eintraege.map(x=>friere(x)));}

  #finde(planId:string):WeltPlanSicht{
    text(planId,"WELT_PLAN_ID_UNGUELTIG");
    const x=this.#eintraege.find(e=>e.pin.planId===planId);
    if(!x) throw new Error("WELT_PLAN_UNBEKANNT");
    return x;
  }
  #ersetze(neu:WeltPlanSicht):void{
    this.#eintraege=Object.freeze(this.#eintraege.map(x=>x.pin.planId===neu.pin.planId?neu:x));
  }
}
