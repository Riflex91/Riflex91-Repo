export interface KartenDefinition {
  readonly mapId: string;
  readonly fingerprint: string;
  readonly pvp: boolean;
  readonly safe: boolean;
  readonly instance: boolean;
  readonly ignore: boolean;
}

export interface KartenKanteDefinition {
  readonly vonMapId: string;
  readonly nachMapId: string;
  readonly kanteId: string;
  readonly fingerprint: string;
}

export interface MapGraphSnapshot {
  readonly schemaVersion: 1;
  readonly definitionFingerprint: string;
  readonly maps: readonly KartenDefinition[];
  readonly kanten: readonly KartenKanteDefinition[];
}

export interface MapGraphNachweis {
  readonly schemaVersion: 1;
  readonly definitionFingerprint: string;
  readonly bekannteMaps: readonly string[];
  readonly kanten: readonly KartenKanteDefinition[];
  readonly planningEvidence: true;
  readonly executionAuthority: false;
}

function text(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

export function validiereMapGraph(snapshot: MapGraphSnapshot): MapGraphNachweis {
  if (snapshot.schemaVersion !== 1) throw new Error("MAPGRAPH_SCHEMA_UNGUELTIG");
  text(snapshot.definitionFingerprint, "MAPGRAPH_FINGERPRINT_UNGUELTIG");
  if (snapshot.maps.length < 1 || snapshot.maps.length > 512 || snapshot.kanten.length > 4096) {
    throw new Error("MAPGRAPH_GROESSE_UNGUELTIG");
  }
  for (let i = 0; i < snapshot.maps.length; i += 1) {
    const m=snapshot.maps[i];
    if (!m) throw new Error("MAPGRAPH_MAP_FEHLT");
    text(m.mapId,"MAPGRAPH_MAP_ID_UNGUELTIG");
    text(m.fingerprint,"MAPGRAPH_MAP_FINGERPRINT_UNGUELTIG");
    if (snapshot.maps.slice(0,i).some(x=>x.mapId===m.mapId)) throw new Error("MAPGRAPH_MAP_DOPPELT");
  }
  const ids=new Set(snapshot.maps.map(x=>x.mapId));
  for (let i=0;i<snapshot.kanten.length;i+=1){
    const k=snapshot.kanten[i];
    if(!k) throw new Error("MAPGRAPH_KANTE_FEHLT");
    for(const v of [k.vonMapId,k.nachMapId,k.kanteId,k.fingerprint]) text(v,"MAPGRAPH_KANTE_TEXT_UNGUELTIG");
    if(!ids.has(k.vonMapId)||!ids.has(k.nachMapId)) throw new Error("MAPGRAPH_KANTE_ZIEL_UNBEKANNT");
    if(snapshot.kanten.slice(0,i).some(x=>x.kanteId===k.kanteId)) throw new Error("MAPGRAPH_KANTE_DOPPELT");
  }
  return Object.freeze({
    schemaVersion:1,
    definitionFingerprint:snapshot.definitionFingerprint,
    bekannteMaps:Object.freeze(snapshot.maps.filter(x=>!x.ignore).map(x=>x.mapId).sort()),
    kanten:Object.freeze(snapshot.kanten.map(x=>Object.freeze({...x}))),
    planningEvidence:true,
    executionAuthority:false,
  });
}
