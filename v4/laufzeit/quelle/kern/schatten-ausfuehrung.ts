import type { AktionsAnfrage } from '../vertraege/aktions-anfrage.js';
import type { SchattenAktionsEintrag, SchattenAktionsPhase } from '../vertraege/aktions-steuerung.js';

export class SchattenAusfuehrung {
  private naechsteLaufendeNummer = 1;
  private readonly eintraege: SchattenAktionsEintrag[] = [];
  private readonly aktiveEintraege = new Map<string, number>();

  starte(anfrage: AktionsAnfrage, geplantAm: number): SchattenAktionsEintrag {
    if (this.aktiveEintraege.has(anfrage.kennung)) {
      throw new Error(`Fuer die AktionsAnfrage ${anfrage.kennung} laeuft bereits ein Schatteneintrag.`);
    }

    const eintrag: SchattenAktionsEintrag = Object.freeze({
      laufendeNummer: this.naechsteLaufendeNummer,
      aktionsAnfrageKennung: anfrage.kennung,
      angefordertVon: anfrage.angefordertVon,
      aktion: anfrage.aktion,
      wichtigkeit: anfrage.wichtigkeit,
      prioritaet: anfrage.prioritaet,
      grund: anfrage.grund,
      ressourcen: Object.freeze([...anfrage.benoetigteRessourcen]),
      geplantAm,
      phase: 'laeuft',
      beendetAm: null,
      abschlussGrund: null,
      details: anfrage.details
    });

    this.naechsteLaufendeNummer += 1;
    const index = this.eintraege.length;
    this.eintraege.push(eintrag);
    this.aktiveEintraege.set(anfrage.kennung, index);
    return eintrag;
  }

  unterbreche(aktionsAnfrageKennung: string, beendetAm: number, grund: string): SchattenAktionsEintrag {
    return this.beende(aktionsAnfrageKennung, 'unterbrochen', beendetAm, grund);
  }

  brecheAb(aktionsAnfrageKennung: string, beendetAm: number, grund: string): SchattenAktionsEintrag {
    return this.beende(aktionsAnfrageKennung, 'abgebrochen', beendetAm, grund);
  }

  schliesseAb(aktionsAnfrageKennung: string, beendetAm: number, grund: string): SchattenAktionsEintrag {
    return this.beende(aktionsAnfrageKennung, 'abgeschlossen', beendetAm, grund);
  }

  listeEintraege(): readonly SchattenAktionsEintrag[] {
    return [...this.eintraege];
  }

  private beende(
    aktionsAnfrageKennung: string,
    phase: Exclude<SchattenAktionsPhase, 'laeuft'>,
    beendetAm: number,
    grund: string
  ): SchattenAktionsEintrag {
    const index = this.aktiveEintraege.get(aktionsAnfrageKennung);
    if (index === undefined) {
      throw new Error(`Keine laufende Schattenaktion fuer ${aktionsAnfrageKennung} gefunden.`);
    }

    const vorher = this.eintraege[index];
    if (vorher === undefined) throw new Error('Der interne Schatteneintrag fehlt.');

    const aktualisiert: SchattenAktionsEintrag = Object.freeze({
      ...vorher,
      phase,
      beendetAm,
      abschlussGrund: grund
    });

    this.eintraege[index] = aktualisiert;
    this.aktiveEintraege.delete(aktionsAnfrageKennung);
    return aktualisiert;
  }
}
