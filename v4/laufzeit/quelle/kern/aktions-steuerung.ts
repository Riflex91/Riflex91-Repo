import type { AktionsAnfrage } from '../vertraege/aktions-anfrage.js';
import type {
  AktionsLaufZustand,
  AktionsSteuerungsSchritt,
  SchattenAktionsEintrag
} from '../vertraege/aktions-steuerung.js';
import { RESSOURCEN_NAMEN } from '../vertraege/ressourcen-sperre.js';
import type { RessourcenSperre } from '../vertraege/ressourcen-sperre.js';
import { AKTIONS_WICHTIGKEITS_RANG, AktionsAuswahl } from './aktions-auswahl.js';
import { RessourcenVergabe } from './ressourcen-vergabe.js';
import type { RessourcenSperrErgebnis } from './ressourcen-vergabe.js';
import { SchattenAusfuehrung } from './schatten-ausfuehrung.js';

const GUELTIGE_RESSOURCEN = new Set<string>(RESSOURCEN_NAMEN);

export interface AktionsSteuerungOptionen {
  readonly aktionsAuswahl?: AktionsAuswahl;
  readonly ressourcenVergabe?: RessourcenVergabe;
  readonly schattenAusfuehrung?: SchattenAusfuehrung;
}

function friereListe<T>(werte: readonly T[]): readonly T[] {
  return Object.freeze([...werte]);
}

function kopiereAnfrage(anfrage: AktionsAnfrage): AktionsAnfrage {
  return Object.freeze({
    ...anfrage,
    benoetigteRessourcen: Object.freeze([...new Set(anfrage.benoetigteRessourcen)].sort())
  });
}

export class AktionsSteuerung {
  private readonly aktionsAuswahl: AktionsAuswahl;
  private readonly ressourcenVergabe: RessourcenVergabe;
  private readonly schattenAusfuehrung: SchattenAusfuehrung;
  private readonly zustaende = new Map<string, AktionsLaufZustand>();

  constructor(optionen: AktionsSteuerungOptionen = {}) {
    this.aktionsAuswahl = optionen.aktionsAuswahl ?? new AktionsAuswahl();
    this.ressourcenVergabe = optionen.ressourcenVergabe ?? new RessourcenVergabe();
    this.schattenAusfuehrung = optionen.schattenAusfuehrung ?? new SchattenAusfuehrung();
  }

  reicheAnfrageEin(anfrage: AktionsAnfrage): AktionsLaufZustand {
    this.pruefeAnfrage(anfrage);
    if (this.zustaende.has(anfrage.kennung)) {
      throw new Error(`Die AktionsAnfrage-Kennung ${anfrage.kennung} wurde bereits verwendet.`);
    }

    const gespeicherteAnfrage = kopiereAnfrage(anfrage);
    const zustand: AktionsLaufZustand = Object.freeze({
      anfrage: gespeicherteAnfrage,
      phase: 'wartend',
      eingereihtAm: gespeicherteAnfrage.angefordertAm,
      gestartetAm: null,
      beendetAm: null,
      zustandsGrund: 'Anfrage wartet auf die zentrale AktionsSteuerung.',
      blockiertDurch: Object.freeze([])
    });
    this.zustaende.set(gespeicherteAnfrage.kennung, zustand);
    return zustand;
  }

  verarbeiteNaechsteAktion(jetzt: number): AktionsSteuerungsSchritt {
    this.pruefeZeitpunkt(jetzt);
    this.markiereAbgelaufeneAnfragen(jetzt);

    const kandidaten = this.aktionsAuswahl.sortiereNachWichtigkeit(
      [...this.zustaende.values()]
        .filter((zustand) => zustand.phase === 'wartend' || zustand.phase === 'blockiert')
        .map((zustand) => zustand.anfrage),
      jetzt
    );

    const blockierteAnfragen: string[] = [];

    for (const anfrage of kandidaten) {
      const sperrErgebnis = this.versucheRessourcenFuerAnfrageZuSperren(anfrage);

      if (!sperrErgebnis.gesperrt) {
        const bisher = this.mussZustandHolen(anfrage.kennung);
        const blockierer = sperrErgebnis.blockiertDurch
          .map((sperre) => `${sperre.ressource}:${sperre.besitzer}`)
          .join(', ');
        this.zustaende.set(anfrage.kennung, Object.freeze({
          ...bisher,
          phase: 'blockiert',
          zustandsGrund: `Ressourcen sind belegt: ${blockierer}.`,
          blockiertDurch: friereListe(sperrErgebnis.blockiertDurch)
        }));
        blockierteAnfragen.push(anfrage.kennung);
        continue;
      }

      const unterbrocheneAnfragen: string[] = [];
      for (const unterbrocheneKennung of sperrErgebnis.unterbrocheneBesitzer) {
        const unterbrochenerZustand = this.zustaende.get(unterbrocheneKennung);
        if (!unterbrochenerZustand || unterbrochenerZustand.phase !== 'laeuft') continue;

        const grund = `Unterbrochen durch die wichtigere AktionsAnfrage ${anfrage.kennung}.`;
        this.schattenAusfuehrung.unterbreche(unterbrocheneKennung, jetzt, grund);
        this.zustaende.set(unterbrocheneKennung, Object.freeze({
          ...unterbrochenerZustand,
          phase: 'abgebrochen',
          beendetAm: jetzt,
          zustandsGrund: grund,
          blockiertDurch: Object.freeze([])
        }));
        unterbrocheneAnfragen.push(unterbrocheneKennung);
      }

      const bisher = this.mussZustandHolen(anfrage.kennung);
      const laufend: AktionsLaufZustand = Object.freeze({
        ...bisher,
        phase: 'laeuft',
        gestartetAm: jetzt,
        beendetAm: null,
        zustandsGrund: 'Im Schattenbetrieb gestartet; es wurde keine Spielaktion ausgefuehrt.',
        blockiertDurch: Object.freeze([])
      });
      this.zustaende.set(anfrage.kennung, laufend);
      this.schattenAusfuehrung.starte(anfrage, jetzt);

      return Object.freeze({
        art: 'gestartet',
        zeitpunkt: jetzt,
        gestarteteAnfrage: anfrage,
        unterbrocheneAnfragen: friereListe(unterbrocheneAnfragen),
        blockierteAnfragen: friereListe(blockierteAnfragen)
      });
    }

    return Object.freeze({
      art: 'keine-ausfuehrbare-aktion',
      zeitpunkt: jetzt,
      gestarteteAnfrage: null,
      unterbrocheneAnfragen: Object.freeze([]),
      blockierteAnfragen: friereListe(blockierteAnfragen)
    });
  }

  brecheAktionAb(aktionsAnfrageKennung: string, jetzt: number, grund: string): boolean {
    this.pruefeZeitpunkt(jetzt);
    if (grund.trim().length === 0) throw new Error('Ein Abbruch benoetigt einen Grund.');

    const zustand = this.mussZustandHolen(aktionsAnfrageKennung);
    if (zustand.phase === 'abgebrochen' || zustand.phase === 'abgeschlossen' || zustand.phase === 'abgelaufen') {
      return false;
    }

    if (zustand.phase === 'laeuft') {
      this.ressourcenVergabe.gibRessourcenFuerBesitzerFrei(aktionsAnfrageKennung);
      this.schattenAusfuehrung.brecheAb(aktionsAnfrageKennung, jetzt, grund);
    }

    this.zustaende.set(aktionsAnfrageKennung, Object.freeze({
      ...zustand,
      phase: 'abgebrochen',
      beendetAm: jetzt,
      zustandsGrund: grund,
      blockiertDurch: Object.freeze([])
    }));
    return true;
  }

  schliesseAktionAb(aktionsAnfrageKennung: string, jetzt: number, grund = 'Schattenaktion abgeschlossen.'): AktionsLaufZustand {
    this.pruefeZeitpunkt(jetzt);
    if (grund.trim().length === 0) throw new Error('Ein Abschluss benoetigt einen Grund.');

    const zustand = this.mussZustandHolen(aktionsAnfrageKennung);
    if (zustand.phase !== 'laeuft') {
      throw new Error(`Die AktionsAnfrage ${aktionsAnfrageKennung} laeuft nicht und kann nicht abgeschlossen werden.`);
    }

    this.ressourcenVergabe.gibRessourcenFuerBesitzerFrei(aktionsAnfrageKennung);
    this.schattenAusfuehrung.schliesseAb(aktionsAnfrageKennung, jetzt, grund);

    const abgeschlossen: AktionsLaufZustand = Object.freeze({
      ...zustand,
      phase: 'abgeschlossen',
      beendetAm: jetzt,
      zustandsGrund: grund,
      blockiertDurch: Object.freeze([])
    });
    this.zustaende.set(aktionsAnfrageKennung, abgeschlossen);
    return abgeschlossen;
  }

  holeAktionsZustand(aktionsAnfrageKennung: string): AktionsLaufZustand | null {
    return this.zustaende.get(aktionsAnfrageKennung) ?? null;
  }

  listeAktionsZustaende(): readonly AktionsLaufZustand[] {
    return [...this.zustaende.values()].sort((a, b) => {
      if (a.anfrage.angefordertAm !== b.anfrage.angefordertAm) {
        return a.anfrage.angefordertAm - b.anfrage.angefordertAm;
      }
      return a.anfrage.kennung.localeCompare(b.anfrage.kennung);
    });
  }

  listeRessourcenSperren(): readonly RessourcenSperre[] {
    return this.ressourcenVergabe.listeRessourcenSperren();
  }

  listeSchattenProtokoll(): readonly SchattenAktionsEintrag[] {
    return this.schattenAusfuehrung.listeEintraege();
  }

  private versucheRessourcenFuerAnfrageZuSperren(anfrage: AktionsAnfrage): RessourcenSperrErgebnis {
    if (anfrage.benoetigteRessourcen.length === 0) {
      return {
        gesperrt: true,
        blockiertDurch: [],
        unterbrocheneBesitzer: [],
        sperren: []
      };
    }

    return this.ressourcenVergabe.versucheRessourcenZuSperren({
      besitzer: anfrage.kennung,
      ressourcen: anfrage.benoetigteRessourcen,
      wichtigkeitsRang: AKTIONS_WICHTIGKEITS_RANG[anfrage.wichtigkeit],
      prioritaet: anfrage.prioritaet,
      darfUnterbrochenWerden: anfrage.wichtigkeit !== 'notfall',
      angefordertAm: anfrage.angefordertAm
    });
  }

  private markiereAbgelaufeneAnfragen(jetzt: number): void {
    for (const [kennung, zustand] of this.zustaende.entries()) {
      if ((zustand.phase !== 'wartend' && zustand.phase !== 'blockiert') ||
          zustand.anfrage.gueltigBis === undefined ||
          zustand.anfrage.gueltigBis > jetzt) {
        continue;
      }

      this.zustaende.set(kennung, Object.freeze({
        ...zustand,
        phase: 'abgelaufen',
        beendetAm: jetzt,
        zustandsGrund: 'Die AktionsAnfrage ist vor der Ausfuehrung abgelaufen.',
        blockiertDurch: Object.freeze([])
      }));
    }
  }

  private pruefeAnfrage(anfrage: AktionsAnfrage): void {
    for (const [feld, wert] of [
      ['kennung', anfrage.kennung],
      ['angefordertVon', anfrage.angefordertVon],
      ['aktion', anfrage.aktion],
      ['grund', anfrage.grund]
    ] as const) {
      if (wert.trim().length === 0) throw new Error(`${feld} darf nicht leer sein.`);
    }

    if (!Object.prototype.hasOwnProperty.call(AKTIONS_WICHTIGKEITS_RANG, anfrage.wichtigkeit)) {
      throw new Error(`Unbekannte AktionsWichtigkeit: ${String(anfrage.wichtigkeit)}.`);
    }
    if (!Number.isFinite(anfrage.prioritaet)) throw new Error('Die Aktionsprioritaet muss eine endliche Zahl sein.');
    this.pruefeZeitpunkt(anfrage.angefordertAm);
    if (anfrage.gueltigBis !== undefined) {
      this.pruefeZeitpunkt(anfrage.gueltigBis);
      if (anfrage.gueltigBis <= anfrage.angefordertAm) {
        throw new Error('gueltigBis muss nach angefordertAm liegen.');
      }
    }

    for (const ressource of anfrage.benoetigteRessourcen) {
      if (!GUELTIGE_RESSOURCEN.has(ressource)) throw new Error(`Unbekannte Ressource: ${String(ressource)}.`);
    }
  }

  private pruefeZeitpunkt(zeitpunkt: number): void {
    if (!Number.isFinite(zeitpunkt) || zeitpunkt < 0) {
      throw new Error('Zeitpunkte muessen endliche, nichtnegative Zahlen sein.');
    }
  }

  private mussZustandHolen(aktionsAnfrageKennung: string): AktionsLaufZustand {
    const zustand = this.zustaende.get(aktionsAnfrageKennung);
    if (!zustand) throw new Error(`Unbekannte AktionsAnfrage: ${aktionsAnfrageKennung}.`);
    return zustand;
  }
}
