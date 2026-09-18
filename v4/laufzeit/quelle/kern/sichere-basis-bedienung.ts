import type { BedienAnfrage, BedienEntscheidung } from '../vertraege/bedien-anfrage.js';
import type {
  BasisBedienAktion,
  BasisBedienAnfrageDaten,
  BasisBedienErgebnis,
  LaufzeitSteuerungsStatus
} from '../vertraege/laufzeit-steuerung.js';
import { BedienSicherung } from './bedien-sicherung.js';
import { AktionsSteuerung } from './aktions-steuerung.js';
import { LaufzeitSteuerung } from './laufzeit-steuerung.js';

const STANDARD_MAX_BEHANDELTE_VORGAENGE = 100;

const AKTIONS_NAME: Readonly<Record<BasisBedienAktion, string>> = Object.freeze({
  diagnose_aktualisieren: 'V4_DIAGNOSE_AKTUALISIEREN',
  laufzeit_pausieren: 'V4_LAUFZEIT_PAUSIEREN',
  laufzeit_fortsetzen: 'V4_LAUFZEIT_FORTSETZEN'
});

function pruefeText(name: string, wert: string): void {
  if (wert.trim().length === 0) throw new Error(`${name} darf nicht leer sein.`);
}

function pruefeZeitpunkt(zeitpunkt: number): void {
  if (!Number.isFinite(zeitpunkt) || zeitpunkt < 0) {
    throw new Error('angefordertAm muss endlich und nichtnegativ sein.');
  }
}

export function erstelleBasisBedienAnfrage(
  daten: BasisBedienAnfrageDaten
): Readonly<BedienAnfrage> {
  pruefeText('vorgangsKennung', daten.vorgangsKennung);
  pruefeZeitpunkt(daten.angefordertAm);

  const status = daten.laufzeitStatus;
  if (status.schemaVersion !== 1) throw new Error('Laufzeitstatus besitzt eine unbekannte schemaVersion.');

  if (daten.aktion === 'diagnose_aktualisieren') {
    return Object.freeze({
      kennung: daten.vorgangsKennung,
      aktion: AKTIONS_NAME[daten.aktion],
      titel: 'Diagnose aktualisieren',
      erklaerung: 'Liest den aktuellen V4-Zustand erneut, ohne die Bot-Laufzeit zu veraendern.',
      auswirkung: 'Es werden nur neue Diagnosedaten gelesen.',
      risiko: 'unkritisch',
      angefordertAm: daten.angefordertAm,
      voraussetzungen: Object.freeze([])
    });
  }

  if (daten.aktion === 'laufzeit_pausieren') {
    return Object.freeze({
      kennung: daten.vorgangsKennung,
      aktion: AKTIONS_NAME[daten.aktion],
      titel: 'Laufzeit pausieren',
      erklaerung: 'Stoppt normale und Hintergrundarbeit zentral; Notfall- und Sicherheitsarbeit bleibt zugelassen.',
      auswirkung: 'Laufende normale Arbeit wird fail-safe abgebrochen und nicht automatisch wieder aufgenommen.',
      risiko: 'unkritisch',
      angefordertAm: daten.angefordertAm,
      voraussetzungen: Object.freeze([Object.freeze({
        kennung: 'laufzeit-laeuft',
        beschreibung: 'Die Laufzeit muss aktuell fuer normale Arbeit freigegeben sein.',
        erfuellt: status.zustand === 'laeuft',
        hilfeWennNichtErfuellt: 'Die Laufzeit ist bereits pausiert.'
      })])
    });
  }

  if (daten.aktion === 'laufzeit_fortsetzen') {
    return Object.freeze({
      kennung: daten.vorgangsKennung,
      aktion: AKTIONS_NAME[daten.aktion],
      titel: 'Laufzeit fortsetzen',
      erklaerung: 'Gibt neue normale und Hintergrundarbeit nach einer Pause wieder frei.',
      auswirkung: 'Alte abgebrochene Arbeit wird nicht wiederbelebt; nur neue AktionsAnfragen duerfen wieder normal verarbeitet werden.',
      risiko: 'vorsicht',
      angefordertAm: daten.angefordertAm,
      voraussetzungen: Object.freeze([Object.freeze({
        kennung: 'laufzeit-pausiert',
        beschreibung: 'Die Laufzeit muss aktuell pausiert sein.',
        erfuellt: status.zustand === 'pausiert',
        hilfeWennNichtErfuellt: 'Die Laufzeit ist nicht pausiert.'
      })]),
      ausdruecklichBestaetigt: daten.ausdruecklichBestaetigt === true
    });
  }

  const niemals: never = daten.aktion;
  throw new Error(`Unbekannte BasisBedienAktion: ${String(niemals)}.`);
}

function basisAktionAusBedienAnfrage(anfrage: BedienAnfrage): BasisBedienAktion {
  const gefunden = (Object.entries(AKTIONS_NAME) as readonly [BasisBedienAktion, string][])
    .find(([, name]) => name === anfrage.aktion);
  if (!gefunden) throw new Error(`Unbekannte Basis-Bedienaktion: ${anfrage.aktion}.`);
  return gefunden[0];
}

export interface SichereBasisBedienungOptionen<TDiagnose> {
  readonly bedienSicherung?: BedienSicherung;
  readonly laufzeitSteuerung: LaufzeitSteuerung;
  readonly aktionsSteuerung: AktionsSteuerung;
  readonly diagnoseLieferant: () => TDiagnose;
  readonly maxBehandelteVorgaenge?: number;
}

export class SichereBasisBedienung<TDiagnose = unknown> {
  private readonly bedienSicherung: BedienSicherung;
  private readonly laufzeitSteuerung: LaufzeitSteuerung;
  private readonly aktionsSteuerung: AktionsSteuerung;
  private readonly diagnoseLieferant: () => TDiagnose;
  private readonly maxBehandelteVorgaenge: number;
  private readonly ergebnisse = new Map<string, Readonly<BasisBedienErgebnis<TDiagnose>>>();

  constructor(optionen: SichereBasisBedienungOptionen<TDiagnose>) {
    this.bedienSicherung = optionen.bedienSicherung ?? new BedienSicherung();
    this.laufzeitSteuerung = optionen.laufzeitSteuerung;
    this.aktionsSteuerung = optionen.aktionsSteuerung;
    this.diagnoseLieferant = optionen.diagnoseLieferant;
    this.maxBehandelteVorgaenge =
      optionen.maxBehandelteVorgaenge ?? STANDARD_MAX_BEHANDELTE_VORGAENGE;

    if (typeof this.diagnoseLieferant !== 'function') {
      throw new Error('diagnoseLieferant muss eine Funktion sein.');
    }
    if (!Number.isSafeInteger(this.maxBehandelteVorgaenge) || this.maxBehandelteVorgaenge <= 0) {
      throw new Error('maxBehandelteVorgaenge muss eine positive ganze Zahl sein.');
    }
    if (!this.aktionsSteuerung.istMitLaufzeitSteuerungVerbunden(this.laufzeitSteuerung)) {
      throw new Error('SichereBasisBedienung und AktionsSteuerung muessen dieselbe LaufzeitSteuerung verwenden.');
    }
  }

  erstelleAnfrage(daten: Omit<BasisBedienAnfrageDaten, 'laufzeitStatus'>): Readonly<BedienAnfrage> {
    return erstelleBasisBedienAnfrage({
      ...daten,
      laufzeitStatus: this.laufzeitSteuerung.status()
    });
  }

  fuehreAus(anfrage: BedienAnfrage): Readonly<BasisBedienErgebnis<TDiagnose>> {
    pruefeText('BedienAnfrage.kennung', anfrage.kennung);
    const wiederholt = this.ergebnisse.get(anfrage.kennung);
    if (wiederholt !== undefined) {
      return Object.freeze({
        ...wiederholt,
        status: 'wiederholt',
        grund: 'Diese Vorgangskennung wurde bereits verarbeitet; die Aktion wird nicht erneut ausgefuehrt.'
      });
    }

    const aktion = basisAktionAusBedienAnfrage(anfrage);
    const bedienEntscheidung = this.bedienSicherung.pruefe(anfrage);
    if (!bedienEntscheidung.erlaubt) {
      return this.merkeErgebnis(Object.freeze({
        schemaVersion: 1,
        vorgangsKennung: anfrage.kennung,
        aktion,
        status: 'blockiert',
        grund: bedienEntscheidung.grund,
        bedienEntscheidung,
        laufzeitStatus: this.laufzeitSteuerung.status(),
        abgebrocheneAktionsAnfrageKennungen: Object.freeze([]),
        diagnose: null
      }));
    }

    if (aktion === 'diagnose_aktualisieren') {
      const diagnose = this.diagnoseLieferant();
      return this.merkeErgebnis(Object.freeze({
        schemaVersion: 1,
        vorgangsKennung: anfrage.kennung,
        aktion,
        status: 'ausgefuehrt',
        grund: 'Diagnose wurde read-only aktualisiert.',
        bedienEntscheidung,
        laufzeitStatus: this.laufzeitSteuerung.status(),
        abgebrocheneAktionsAnfrageKennungen: Object.freeze([]),
        diagnose
      }));
    }

    if (aktion === 'laufzeit_pausieren') {
      const laufzeitStatus = this.laufzeitSteuerung.pausiere(
        anfrage.angefordertAm,
        'Vom Nutzer ueber die sichere Basisbedienung pausiert.'
      );
      const abgebrochen = this.aktionsSteuerung.brecheNormaleArbeitFuerPauseAb(
        anfrage.angefordertAm,
        'Laufzeit wurde durch eine gepruefte BedienAnfrage pausiert.'
      );
      return this.merkeErgebnis(Object.freeze({
        schemaVersion: 1,
        vorgangsKennung: anfrage.kennung,
        aktion,
        status: 'ausgefuehrt',
        grund: 'Laufzeit wurde zentral pausiert; normale und Hintergrundarbeit wurde fail-safe beendet.',
        bedienEntscheidung,
        laufzeitStatus,
        abgebrocheneAktionsAnfrageKennungen: abgebrochen,
        diagnose: null
      }));
    }

    const laufzeitStatus = this.laufzeitSteuerung.setzeFort(
      anfrage.angefordertAm,
      'Vom Nutzer ueber die sichere Basisbedienung ausdruecklich fortgesetzt.'
    );
    return this.merkeErgebnis(Object.freeze({
      schemaVersion: 1,
      vorgangsKennung: anfrage.kennung,
      aktion,
      status: 'ausgefuehrt',
      grund: 'Laufzeit wurde fuer neue normale Arbeit wieder freigegeben; alte abgebrochene Arbeit bleibt beendet.',
      bedienEntscheidung,
      laufzeitStatus,
      abgebrocheneAktionsAnfrageKennungen: Object.freeze([]),
      diagnose: null
    }));
  }

  status(): Readonly<{
    laufzeit: LaufzeitSteuerungsStatus;
    behandelteVorgaenge: number;
    maxBehandelteVorgaenge: number;
  }> {
    return Object.freeze({
      laufzeit: this.laufzeitSteuerung.status(),
      behandelteVorgaenge: this.ergebnisse.size,
      maxBehandelteVorgaenge: this.maxBehandelteVorgaenge
    });
  }

  private merkeErgebnis(
    ergebnis: Readonly<BasisBedienErgebnis<TDiagnose>>
  ): Readonly<BasisBedienErgebnis<TDiagnose>> {
    this.ergebnisse.set(ergebnis.vorgangsKennung, ergebnis);
    while (this.ergebnisse.size > this.maxBehandelteVorgaenge) {
      const aeltesteKennung = this.ergebnisse.keys().next().value as string | undefined;
      if (aeltesteKennung === undefined) break;
      this.ergebnisse.delete(aeltesteKennung);
    }
    return ergebnis;
  }
}
