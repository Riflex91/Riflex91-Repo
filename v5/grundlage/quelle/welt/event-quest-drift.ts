export type WeltPlanArt = "EVENT" | "QUEST";
export type WeltDriftStatus = "GUELTIG" | "REPLAN_ERFORDERLICH" | "BLOCKIERT_STALE" | "BLOCKIERT_UNBEKANNT";

export interface WeltLiveState {
  readonly schemaVersion: 1;
  readonly art: WeltPlanArt;
  readonly stateId: string;
  readonly serverRegion: string;
  readonly serverIdentifier: string;
  readonly mapId: string;
  readonly characterId: string | null;
  readonly aktiv: boolean;
  readonly semantikVersion: number;
  readonly beobachtetAmMs: number;
  readonly gueltigBisMs: number;
  readonly fingerprint: string;
}

export interface WeltPlanPin {
  readonly schemaVersion: 1;
  readonly planId: string;
  readonly live: WeltLiveState;
  readonly actionAuthority: false;
}

export interface WeltDriftNachweis {
  readonly status: WeltDriftStatus;
  readonly actionErlaubt: boolean;
  readonly fingerprint: string;
}

function text(w:string,f:string):void{if(w.trim().length===0||w.length>192) throw new Error(f);}

export function pinneWeltPlan(planId:string, live:WeltLiveState, jetztMs:number):WeltPlanPin{
  text(planId,"WELT_PLAN_ID_UNGUELTIG");
  if(live.schemaVersion!==1) throw new Error("WELT_STATE_SCHEMA_UNGUELTIG");
  for(const v of [live.stateId,live.serverRegion,live.serverIdentifier,live.mapId,live.fingerprint]) text(v,"WELT_STATE_TEXT_UNGUELTIG");
  if(!Number.isInteger(live.semantikVersion)||live.semantikVersion<1
    ||!Number.isSafeInteger(jetztMs)||jetztMs<live.beobachtetAmMs||jetztMs>live.gueltigBisMs) throw new Error("WELT_STATE_NICHT_FRISCH");
  return Object.freeze({schemaVersion:1,planId,live:Object.freeze({...live}),actionAuthority:false});
}

export function pruefeWeltDrift(pin:WeltPlanPin, aktuell:WeltLiveState, jetztMs:number):WeltDriftNachweis{
  if(aktuell.schemaVersion!==1||aktuell.art!==pin.live.art||aktuell.stateId!==pin.live.stateId) {
    return Object.freeze({status:"BLOCKIERT_UNBEKANNT",actionErlaubt:false,fingerprint:aktuell.fingerprint||"unknown"});
  }
  if(!Number.isInteger(aktuell.semantikVersion)||aktuell.semantikVersion<1
    ||!Number.isSafeInteger(jetztMs)||jetztMs<aktuell.beobachtetAmMs||jetztMs>aktuell.gueltigBisMs){
    return Object.freeze({status:"BLOCKIERT_STALE",actionErlaubt:false,fingerprint:aktuell.fingerprint});
  }
  const gleicheBindung=aktuell.serverRegion===pin.live.serverRegion
    && aktuell.serverIdentifier===pin.live.serverIdentifier
    && aktuell.mapId===pin.live.mapId
    && aktuell.characterId===pin.live.characterId;
  const gleicherState=aktuell.semantikVersion===pin.live.semantikVersion
    && aktuell.fingerprint===pin.live.fingerprint
    && aktuell.aktiv===pin.live.aktiv;
  if(!gleicheBindung||!gleicherState){
    return Object.freeze({status:"REPLAN_ERFORDERLICH",actionErlaubt:false,fingerprint:aktuell.fingerprint});
  }
  if(!aktuell.aktiv){
    return Object.freeze({status:"REPLAN_ERFORDERLICH",actionErlaubt:false,fingerprint:aktuell.fingerprint});
  }
  return Object.freeze({status:"GUELTIG",actionErlaubt:true,fingerprint:aktuell.fingerprint});
}
