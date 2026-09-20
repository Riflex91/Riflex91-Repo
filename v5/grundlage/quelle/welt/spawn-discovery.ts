export interface SpawnPackDefinition {
  readonly schemaVersion: 1;
  readonly mapId: string;
  readonly packId: string;
  readonly monsterTyp: string;
  readonly count: number;
  readonly definitionFingerprint: string;
  readonly seltenOderBoss: boolean;
}

export interface LiveEntityEvidence {
  readonly schemaVersion: 1;
  readonly entityId: string;
  readonly entityFingerprint: string;
  readonly monsterTyp: string;
  readonly mapId: string;
  readonly instanz: string;
  readonly serverRegion: string;
  readonly serverIdentifier: string;
  readonly sichtbar: boolean;
  readonly tot: boolean;
  readonly beobachtetAmMs: number;
  readonly gueltigBisMs: number;
  readonly evidenceFingerprint: string;
}

export interface DiscoveryCandidate {
  readonly schemaVersion: 1;
  readonly monsterTyp: string;
  readonly mapId: string;
  readonly packId: string;
  readonly entityId: string;
  readonly entityFingerprint: string;
  readonly seltenOderBoss: boolean;
  readonly evidenceFingerprint: string;
  readonly combatAuthority: false;
}

function text(wert:string, fehler:string):void{
  if(wert.trim().length===0||wert.length>192) throw new Error(fehler);
}

export function bildeDiscoveryCandidate(
  pack: SpawnPackDefinition,
  live: LiveEntityEvidence,
  jetztMs: number,
): DiscoveryCandidate {
  if(pack.schemaVersion!==1||live.schemaVersion!==1) throw new Error("DISCOVERY_SCHEMA_UNGUELTIG");
  for(const v of [pack.mapId,pack.packId,pack.monsterTyp,pack.definitionFingerprint,
    live.entityId,live.entityFingerprint,live.monsterTyp,live.mapId,live.instanz,
    live.serverRegion,live.serverIdentifier,live.evidenceFingerprint]) text(v,"DISCOVERY_TEXT_UNGUELTIG");
  if(!Number.isInteger(pack.count)||pack.count<1||pack.count>10000) throw new Error("DISCOVERY_PACK_COUNT_UNGUELTIG");
  if(!Number.isSafeInteger(jetztMs)||jetztMs<live.beobachtetAmMs||jetztMs>live.gueltigBisMs) throw new Error("DISCOVERY_EVIDENCE_STALE");
  if(!live.sichtbar||live.tot) throw new Error("DISCOVERY_ENTITY_NICHT_NUTZBAR");
  if(pack.monsterTyp!==live.monsterTyp||pack.mapId!==live.mapId) throw new Error("DISCOVERY_DEFINITION_LIVE_DRIFT");
  return Object.freeze({
    schemaVersion:1,
    monsterTyp:pack.monsterTyp,
    mapId:pack.mapId,
    packId:pack.packId,
    entityId:live.entityId,
    entityFingerprint:live.entityFingerprint,
    seltenOderBoss:pack.seltenOderBoss,
    evidenceFingerprint:live.evidenceFingerprint,
    combatAuthority:false,
  });
}
