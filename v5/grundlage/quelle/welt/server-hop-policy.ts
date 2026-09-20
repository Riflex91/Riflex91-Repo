export type ServerModus = "NORMAL" | "PVP" | "HARDCORE" | "TEST" | "DUNGEON" | "UNBEKANNT";

export interface ServerRegistryEvidence {
  readonly schemaVersion: 1;
  readonly region: string;
  readonly identifier: string;
  readonly modus: ServerModus;
  readonly online: boolean;
  readonly beobachtetAmMs: number;
  readonly gueltigBisMs: number;
  readonly fingerprint: string;
}

export interface ServerHopPolicy {
  readonly pvpErlaubt: boolean;
  readonly hardcoreErlaubt: boolean;
  readonly testErlaubt: boolean;
  readonly dungeonErlaubt: boolean;
  readonly minimalerHopAbstandMs: number;
  readonly maximaleHopsImFenster: number;
  readonly fensterMs: number;
}

export interface ServerHopHistorie {
  readonly letzteHopsMs: readonly number[];
}

export interface ServerHopNachweis {
  readonly erlaubt: boolean;
  readonly grund:"OK"|"GLEICHER_SERVER"|"STALE"|"OFFLINE"|"MODUS_UNBEKANNT"|"MODUS_GESPERRT"|"FATIGUE";
  readonly actionAuthority:false;
}

function text(w:string,f:string):void{if(w.trim().length===0||w.length>192) throw new Error(f);}

export function pruefeServerHop(
  aktuell:ServerRegistryEvidence,
  ziel:ServerRegistryEvidence,
  policy:ServerHopPolicy,
  historie:ServerHopHistorie,
  jetztMs:number,
):ServerHopNachweis{
  for(const e of [aktuell,ziel]){
    if(e.schemaVersion!==1) throw new Error("SERVER_HOP_SCHEMA_UNGUELTIG");
    for(const v of [e.region,e.identifier,e.fingerprint]) text(v,"SERVER_HOP_TEXT_UNGUELTIG");
  }
  if(!Number.isSafeInteger(jetztMs)||jetztMs<0
    ||!Number.isSafeInteger(policy.minimalerHopAbstandMs)||policy.minimalerHopAbstandMs<0
    ||!Number.isInteger(policy.maximaleHopsImFenster)||policy.maximaleHopsImFenster<1
    ||!Number.isSafeInteger(policy.fensterMs)||policy.fensterMs<1) throw new Error("SERVER_HOP_POLICY_UNGUELTIG");
  const out=(erlaubt:boolean,grund:ServerHopNachweis["grund"]):ServerHopNachweis=>Object.freeze({erlaubt,grund,actionAuthority:false});
  if(aktuell.region===ziel.region&&aktuell.identifier===ziel.identifier) return out(false,"GLEICHER_SERVER");
  if(jetztMs<ziel.beobachtetAmMs||jetztMs>ziel.gueltigBisMs) return out(false,"STALE");
  if(!ziel.online) return out(false,"OFFLINE");
  if(ziel.modus==="UNBEKANNT") return out(false,"MODUS_UNBEKANNT");
  const modusErlaubt=ziel.modus==="NORMAL"
    || (ziel.modus==="PVP"&&policy.pvpErlaubt)
    || (ziel.modus==="HARDCORE"&&policy.hardcoreErlaubt)
    || (ziel.modus==="TEST"&&policy.testErlaubt)
    || (ziel.modus==="DUNGEON"&&policy.dungeonErlaubt);
  if(!modusErlaubt) return out(false,"MODUS_GESPERRT");
  const hops=[...historie.letzteHopsMs].filter(x=>Number.isSafeInteger(x)&&x>=0&&jetztMs-x<=policy.fensterMs).sort((a,b)=>a-b);
  const letzter=hops.at(-1);
  if((letzter!==undefined&&jetztMs-letzter<policy.minimalerHopAbstandMs)||hops.length>=policy.maximaleHopsImFenster) return out(false,"FATIGUE");
  return out(true,"OK");
}
