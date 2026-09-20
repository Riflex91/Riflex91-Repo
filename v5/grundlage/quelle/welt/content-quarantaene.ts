export type ContentDisposition = "QUARANTAENE" | "ERLAUBT" | "GESPERRT";

export interface ContentEintrag {
  readonly schemaVersion: 1;
  readonly contentArt: "MAP" | "MONSTER" | "NPC" | "EVENT" | "QUEST" | "SERVER_MODE";
  readonly contentId: string;
  readonly semantikVersion: number;
  readonly definitionFingerprint: string;
  readonly disposition: ContentDisposition;
  readonly revalidiertAmMs: number | null;
}

export interface ContentBeobachtung {
  readonly contentArt: ContentEintrag["contentArt"];
  readonly contentId: string;
  readonly semantikVersion: number;
  readonly definitionFingerprint: string;
  readonly beobachtetAmMs: number;
}

function text(w:string,f:string):void{if(w.trim().length===0||w.length>192) throw new Error(f);}

export class ContentQuarantaeneRegister {
  readonly #maximal:number;
  #eintraege:readonly ContentEintrag[]=Object.freeze([]);

  public constructor(maximal=4096){
    if(!Number.isInteger(maximal)||maximal<1||maximal>20000) throw new Error("CONTENT_REGISTER_GRENZE_UNGUELTIG");
    this.#maximal=maximal;
  }

  public beobachte(beobachtung:ContentBeobachtung):ContentEintrag{
    for(const v of [beobachtung.contentId,beobachtung.definitionFingerprint]) text(v,"CONTENT_TEXT_UNGUELTIG");
    if(!Number.isInteger(beobachtung.semantikVersion)||beobachtung.semantikVersion<1
      ||!Number.isSafeInteger(beobachtung.beobachtetAmMs)||beobachtung.beobachtetAmMs<0) throw new Error("CONTENT_BEOBACHTUNG_UNGUELTIG");
    const alt=this.#eintraege.find(x=>x.contentArt===beobachtung.contentArt&&x.contentId===beobachtung.contentId);
    if(alt===undefined){
      if(this.#eintraege.length>=this.#maximal) throw new Error("CONTENT_REGISTER_VOLL");
      const neu=Object.freeze({schemaVersion:1 as const,...beobachtung,disposition:"QUARANTAENE" as const,revalidiertAmMs:null});
      this.#eintraege=Object.freeze([...this.#eintraege,neu]);
      return neu;
    }
    if(alt.semantikVersion!==beobachtung.semantikVersion||alt.definitionFingerprint!==beobachtung.definitionFingerprint){
      const neu=Object.freeze({...alt,semantikVersion:beobachtung.semantikVersion,definitionFingerprint:beobachtung.definitionFingerprint,disposition:"QUARANTAENE" as const,revalidiertAmMs:null});
      this.#ersetze(neu); return neu;
    }
    return Object.freeze({...alt});
  }

  public revalidiere(contentArt:ContentEintrag["contentArt"],contentId:string,definitionFingerprint:string,semantikVersion:number,erlaubt:boolean,jetztMs:number):ContentEintrag{
    const alt=this.#finde(contentArt,contentId);
    if(alt.definitionFingerprint!==definitionFingerprint||alt.semantikVersion!==semantikVersion) throw new Error("CONTENT_REVALIDIERUNG_DRIFT");
    if(!Number.isSafeInteger(jetztMs)||jetztMs<0) throw new Error("CONTENT_REVALIDIERUNG_ZEIT_UNGUELTIG");
    const neu=Object.freeze({...alt,disposition:erlaubt?"ERLAUBT" as const:"GESPERRT" as const,revalidiertAmMs:jetztMs});
    this.#ersetze(neu); return neu;
  }

  public darfAutomatisieren(contentArt:ContentEintrag["contentArt"],contentId:string):boolean{
    return this.#finde(contentArt,contentId).disposition==="ERLAUBT";
  }

  public importiereNachRestart(snapshot:readonly ContentEintrag[]):void{
    if(snapshot.length>this.#maximal) throw new Error("CONTENT_RESTART_ZU_GROSS");
    this.#eintraege=Object.freeze(snapshot.map((x,i)=>{
      if(x.schemaVersion!==1||snapshot.slice(0,i).some(y=>y.contentArt===x.contentArt&&y.contentId===x.contentId)) throw new Error("CONTENT_RESTART_SNAPSHOT_UNGUELTIG");
      return Object.freeze({
        ...x,
        disposition:x.disposition==="GESPERRT"?"GESPERRT" as const:"QUARANTAENE" as const,
        revalidiertAmMs:null,
      });
    }));
  }

  public snapshot():readonly ContentEintrag[]{return Object.freeze(this.#eintraege.map(x=>Object.freeze({...x})));}

  #finde(art:ContentEintrag["contentArt"],id:string):ContentEintrag{
    text(id,"CONTENT_ID_UNGUELTIG");
    const e=this.#eintraege.find(x=>x.contentArt===art&&x.contentId===id);
    if(!e) throw new Error("CONTENT_UNBEKANNT");
    return e;
  }
  #ersetze(neu:ContentEintrag):void{
    this.#eintraege=Object.freeze(this.#eintraege.map(x=>x.contentArt===neu.contentArt&&x.contentId===neu.contentId?neu:x));
  }
}
