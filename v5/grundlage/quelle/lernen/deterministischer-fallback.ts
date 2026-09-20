export interface DeterministischerKandidat {
  readonly kandidatId: string;
  readonly basisScore: number;
  readonly hardErlaubt: boolean;
}

export interface LernRankingVorschlag {
  readonly schemaVersion: 1;
  readonly modellKennung: string;
  readonly modellVersion: string;
  readonly datenFingerprint: string;
  readonly kandidatScores: readonly Readonly<{
    kandidatId: string;
    scoreDelta: number;
  }>[];
  readonly maximalerAbsoluterScoreDelta: number;
  readonly gameplayAutoritaet: false;
  readonly authorityAenderungErlaubt: false;
}

export interface RankingErgebnis {
  readonly kandidatId: string | null;
  readonly quelle: "DETERMINISTISCH" | "LEARNING_GEBUNDET";
  readonly score: number | null;
  readonly fallbackImmerVerfuegbar: true;
}

function pruefeText(wert:string,fehler:string):void{
  if(wert.trim().length===0||wert.length>192) throw new Error(fehler);
}

function validiereKandidaten(kandidaten:readonly DeterministischerKandidat[]):void{
  if(kandidaten.length>512) throw new Error("LERN_KANDIDATEN_ZU_VIELE");
  for(let i=0;i<kandidaten.length;i+=1){
    const k=kandidaten[i];
    if(!k) throw new Error("LERN_KANDIDAT_FEHLT");
    pruefeText(k.kandidatId,"LERN_KANDIDAT_ID_UNGUELTIG");
    if(!Number.isFinite(k.basisScore)) throw new Error("LERN_KANDIDAT_SCORE_UNGUELTIG");
    if(kandidaten.slice(0,i).some(x=>x.kandidatId===k.kandidatId)) throw new Error("LERN_KANDIDAT_DOPPELT");
  }
}

export function waehleDeterministisch(
  kandidaten:readonly DeterministischerKandidat[],
):RankingErgebnis{
  validiereKandidaten(kandidaten);
  const erlaubt=kandidaten.filter(x=>x.hardErlaubt);
  if(erlaubt.length===0){
    return Object.freeze({kandidatId:null,quelle:"DETERMINISTISCH",score:null,fallbackImmerVerfuegbar:true});
  }
  const sortiert=[...erlaubt].sort((a,b)=>b.basisScore-a.basisScore||a.kandidatId.localeCompare(b.kandidatId));
  const top=sortiert[0];
  if(!top) throw new Error("LERN_FALLBACK_TOP_FEHLT");
  return Object.freeze({kandidatId:top.kandidatId,quelle:"DETERMINISTISCH",score:top.basisScore,fallbackImmerVerfuegbar:true});
}

export function waehleMitGebundenemLearning(
  kandidaten:readonly DeterministischerKandidat[],
  vorschlag:LernRankingVorschlag|null,
):RankingErgebnis{
  const fallback=waehleDeterministisch(kandidaten);
  if(vorschlag===null) return fallback;
  if(vorschlag.schemaVersion!==1
      ||vorschlag.gameplayAutoritaet!==false
      ||vorschlag.authorityAenderungErlaubt!==false
      ||!Number.isFinite(vorschlag.maximalerAbsoluterScoreDelta)
      ||vorschlag.maximalerAbsoluterScoreDelta<0
      ||vorschlag.maximalerAbsoluterScoreDelta>1_000
      ||vorschlag.kandidatScores.length>512){
    return fallback;
  }
  for(const text of [vorschlag.modellKennung,vorschlag.modellVersion,vorschlag.datenFingerprint]){
    pruefeText(text,"LERN_VORSCHLAG_TEXT_UNGUELTIG");
  }
  const erlaubt=kandidaten.filter(x=>x.hardErlaubt);
  const bewertet=erlaubt.map(k=>{
    const row=vorschlag.kandidatScores.find(x=>x.kandidatId===k.kandidatId);
    const raw=row?.scoreDelta??0;
    const delta=Number.isFinite(raw)
      ? Math.max(-vorschlag.maximalerAbsoluterScoreDelta,Math.min(vorschlag.maximalerAbsoluterScoreDelta,raw))
      : 0;
    return Object.freeze({kandidatId:k.kandidatId,score:k.basisScore+delta});
  });
  if(bewertet.length===0) return fallback;
  const sortiert=[...bewertet].sort((a,b)=>b.score-a.score||a.kandidatId.localeCompare(b.kandidatId));
  const top=sortiert[0];
  if(!top) return fallback;
  return Object.freeze({kandidatId:top.kandidatId,quelle:"LEARNING_GEBUNDET",score:top.score,fallbackImmerVerfuegbar:true});
}
