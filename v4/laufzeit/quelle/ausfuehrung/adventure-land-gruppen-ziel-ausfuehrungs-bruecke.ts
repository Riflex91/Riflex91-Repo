import { AktionsSteuerung } from '../kern/aktions-steuerung.js';
import type { AktionsSteuerungsSchritt } from '../vertraege/aktions-steuerung.js';
import { GRUPPEN_AKTIONS_NAMEN } from '../vertraege/gruppen-aktionsanfrage.js';
import type { KampfSicherheitsEntscheidung } from '../vertraege/kampfsicherheit.js';
import {
  AdventureLandGruppenZielAusfuehrung,
  AdventureLandGruppenZielEinmalFreigabe,
  GRUPPEN_ZIEL_EINMAL_FREIGABE_TEXT
} from './adventure-land-gruppen-ziel-ausfuehrung.js';

export const GRUPPEN_ZIEL_AUSFUEHRUNGS_BRUECKEN_NAME = 'V4Block8GruppenZielAusfuehrungsBruecke';
export const GRUPPEN_ZIEL_AUSFUEHRUNGS_BRUECKEN_VERSION = '1.0.0';

const STANDARD_AUFTRAG_MAXIMAL_ALTER_MILLISEKUNDEN = 30_000;
const STANDARD_SICHERHEITS_MAXIMAL_ALTER_MILLISEKUNDEN = 1_500;

export interface GruppenZielAusfuehrungsBrueckenAuftrag {
  readonly schemaVersion: 1;
  readonly aktionsKennung: string;
  readonly aktionsName: string;
  readonly zielKennung: string;
  readonly freigabeText: string;
  readonly freigegebenAm: number;
  readonly sicherheitsAuswertungAm: number;
  readonly angriffsBereitschaft: unknown;
  readonly zielPruefung: unknown;
}

export interface AdventureLandGruppenZielAusfuehrungsBrueckeOptionen {
  readonly aktivFreigegeben?: boolean;
  readonly auftragMaximalAlterMillisekunden?: number;
  readonly sicherheitsMaximalAlterMillisekunden?: number;
}

export interface AdventureLandGruppenZielAusfuehrungsBrueckenStatus {
  readonly schemaVersion: 1;
  readonly name: typeof GRUPPEN_ZIEL_AUSFUEHRUNGS_BRUECKEN_NAME;
  readonly version: typeof GRUPPEN_ZIEL_AUSFUEHRUNGS_BRUECKEN_VERSION;
  readonly quelleBereich: 'ausfuehrung';
  readonly aktionsName: typeof GRUPPEN_AKTIONS_NAMEN.gemeinsamesZielBearbeiten;
  readonly aktivFreigegeben: boolean;
  readonly versuchVerbraucht: boolean;
}

export interface AdventureLandGruppenZielAusfuehrungsBrueckenErgebnis {
  readonly schemaVersion: 1;
  readonly brueckenName: typeof GRUPPEN_ZIEL_AUSFUEHRUNGS_BRUECKEN_NAME;
  readonly brueckenVersion: typeof GRUPPEN_ZIEL_AUSFUEHRUNGS_BRUECKEN_VERSION;
  readonly quelleBereich: 'ausfuehrung';
  readonly aktionsKennung: string;
  readonly aktionsName: string;
  readonly zielKennung: string;
  readonly sicherheitsZeitpunkt: number;
  readonly beendetAm: number;
  readonly versuchVerbraucht: true;
}

function pruefePositiveZahl(name: string, wert: number): void {
  if (!Number.isFinite(wert) || wert <= 0) throw new Error(`${name} muss eine positive endliche Zahl sein.`);
}

function pruefeZeitpunkt(name: string, wert: number): void {
  if (!Number.isFinite(wert) || wert < 0) throw new Error(`${name} muss eine endliche, nichtnegative Zahl sein.`);
}

function istObjekt(wert: unknown): wert is Readonly<Record<string, unknown>> {
  return typeof wert === 'object' && wert !== null;
}

function textFeld(auftrag: Readonly<Record<string, unknown>>, name: string): string {
  const wert = auftrag[name];
  if (typeof wert !== 'string' || wert.trim().length === 0) throw new Error(`Brueckenauftrag benoetigt ${name} als nichtleeren Text.`);
  return wert;
}

function zeitFeld(auftrag: Readonly<Record<string, unknown>>, name: string): number {
  const wert = auftrag[name];
  if (typeof wert !== 'number') throw new Error(`Brueckenauftrag benoetigt ${name} als Zahl.`);
  pruefeZeitpunkt(`Brueckenauftrag.${name}`, wert);
  return wert;
}

export class AdventureLandGruppenZielAusfuehrungsBruecke {
  public readonly quelleBereich = 'ausfuehrung' as const;
  public readonly aktionsName = GRUPPEN_AKTIONS_NAMEN.gemeinsamesZielBearbeiten;

  private readonly aktivFreigegeben: boolean;
  private readonly auftragMaximalAlterMillisekunden: number;
  private readonly sicherheitsMaximalAlterMillisekunden: number;
  private versuchVerbraucht = false;

  public constructor(
    private readonly spielFenster: object,
    private readonly steuerung: AktionsSteuerung,
    private readonly liesAktuelleSicherheit: () => Readonly<KampfSicherheitsEntscheidung>,
    private readonly zeitQuelle: () => number,
    optionen: AdventureLandGruppenZielAusfuehrungsBrueckeOptionen = {}
  ) {
    this.aktivFreigegeben = optionen.aktivFreigegeben === true;
    this.auftragMaximalAlterMillisekunden = optionen.auftragMaximalAlterMillisekunden ?? STANDARD_AUFTRAG_MAXIMAL_ALTER_MILLISEKUNDEN;
    this.sicherheitsMaximalAlterMillisekunden = optionen.sicherheitsMaximalAlterMillisekunden ?? STANDARD_SICHERHEITS_MAXIMAL_ALTER_MILLISEKUNDEN;
    pruefePositiveZahl('auftragMaximalAlterMillisekunden', this.auftragMaximalAlterMillisekunden);
    pruefePositiveZahl('sicherheitsMaximalAlterMillisekunden', this.sicherheitsMaximalAlterMillisekunden);
  }

  public status(): Readonly<AdventureLandGruppenZielAusfuehrungsBrueckenStatus> {
    return Object.freeze({
      schemaVersion: 1,
      name: GRUPPEN_ZIEL_AUSFUEHRUNGS_BRUECKEN_NAME,
      version: GRUPPEN_ZIEL_AUSFUEHRUNGS_BRUECKEN_VERSION,
      quelleBereich: this.quelleBereich,
      aktionsName: this.aktionsName,
      aktivFreigegeben: this.aktivFreigegeben,
      versuchVerbraucht: this.versuchVerbraucht
    });
  }

  public async fuehreEinmalAus(rohAuftrag: unknown): Promise<Readonly<AdventureLandGruppenZielAusfuehrungsBrueckenErgebnis>> {
    if (!this.aktivFreigegeben) {
      throw new Error('Die feste Gruppenziel-Ausfuehrungsbruecke ist standardmaessig gesperrt.');
    }
    if (this.versuchVerbraucht) {
      throw new Error('Der einzige Ausfuehrungsversuch dieser Gruppenziel-Bruecke wurde bereits verbraucht.');
    }

    // Ein aktiver Brueckenversuch ist one-shot und wird vor jeder weiteren Validierung verbraucht.
    this.versuchVerbraucht = true;

    const jetzt = this.liesZeitpunkt('Der Bruecken-Ausfuehrungszeitpunkt');
    let passendeLaufendeKennung: string | null = null;

    try {
      const auftrag = this.pruefeAuftrag(rohAuftrag, jetzt);
      passendeLaufendeKennung = auftrag.aktionsKennung;

      const zustand = this.steuerung.holeAktionsZustand(auftrag.aktionsKennung);
      if (!zustand || zustand.phase !== 'laeuft' || zustand.gestartetAm === null) {
        throw new Error('Die feste Bruecke akzeptiert nur eine aktuell laufende Anfrage der zentralen AktionsSteuerung.');
      }
      if (zustand.anfrage.angefordertVon !== 'gruppen-aktionsplanung') {
        throw new Error('Die laufende Anfrage stammt nicht aus gruppen-aktionsplanung.');
      }
      if (zustand.anfrage.aktion !== GRUPPEN_AKTIONS_NAMEN.gemeinsamesZielBearbeiten) {
        throw new Error(`Die laufende Anfrage ist nicht die erlaubte Gruppenzielaktion: ${zustand.anfrage.aktion}.`);
      }
      if (zustand.anfrage.gueltigBis !== undefined && zustand.anfrage.gueltigBis <= jetzt) {
        throw new Error('Die laufende Gruppenzielanfrage ist fuer die Brueckenausfuehrung bereits abgelaufen.');
      }

      const details = zustand.anfrage.details;
      if (!istObjekt(details) || details.zielKennung !== auftrag.zielKennung) {
        throw new Error('Der One-shot-Auftrag passt nicht zum Ziel der zentral laufenden Gruppenanfrage.');
      }

      const sicherheit = this.liesAktuelleSicherheit();
      if (!sicherheit || sicherheit.schemaVersion !== 1) {
        throw new Error('Die feste Bruecke erhielt keine gueltige aktuelle Produktions-Sicherheitsentscheidung.');
      }
      if (sicherheit.zeitpunkt < auftrag.freigegebenAm) {
        throw new Error('Die Produktions-Sicherheitsentscheidung ist aelter als die explizite One-shot-Freigabe.');
      }

      const intern = new AdventureLandGruppenZielEinmalFreigabe(this.auftragMaximalAlterMillisekunden);
      intern.erteile(GRUPPEN_ZIEL_EINMAL_FREIGABE_TEXT, auftrag.aktionsKennung, jetzt);

      const schritt: Readonly<AktionsSteuerungsSchritt> = Object.freeze({
        art: 'gestartet',
        zeitpunkt: zustand.gestartetAm,
        gestarteteAnfrage: zustand.anfrage,
        unterbrocheneAnfragen: Object.freeze([]),
        blockierteAnfragen: Object.freeze([])
      });

      const ausfuehrung = new AdventureLandGruppenZielAusfuehrung(this.spielFenster, {
        aktivFreigegeben: true,
        einmalFreigabe: intern,
        sicherheitsMaximalAlterMillisekunden: this.sicherheitsMaximalAlterMillisekunden
      });
      const ergebnis = await ausfuehrung.fuehreFreigegebeneGruppenZielAktionAus(
        schritt,
        this.steuerung,
        sicherheit,
        this.zeitQuelle
      );

      return Object.freeze({
        schemaVersion: 1,
        brueckenName: GRUPPEN_ZIEL_AUSFUEHRUNGS_BRUECKEN_NAME,
        brueckenVersion: GRUPPEN_ZIEL_AUSFUEHRUNGS_BRUECKEN_VERSION,
        quelleBereich: this.quelleBereich,
        aktionsKennung: ergebnis.aktionsKennung,
        aktionsName: ergebnis.aktionsName,
        zielKennung: ergebnis.zielKennung,
        sicherheitsZeitpunkt: ergebnis.sicherheitsZeitpunkt,
        beendetAm: ergebnis.beendetAm,
        versuchVerbraucht: true
      });
    } catch (fehler) {
      const abbruchAm = this.liesZeitpunkt('Der Bruecken-Abbruchzeitpunkt');
      if (passendeLaufendeKennung !== null && this.steuerung.holeAktionsZustand(passendeLaufendeKennung)?.phase === 'laeuft') {
        const text = fehler instanceof Error ? fehler.message : String(fehler);
        this.steuerung.brecheAktionAb(
          passendeLaufendeKennung,
          abbruchAm,
          `Feste Gruppenziel-Ausfuehrungsbruecke hat fail-safe abgebrochen: ${text}`
        );
      }
      throw fehler;
    }
  }

  private pruefeAuftrag(rohAuftrag: unknown, jetzt: number): Readonly<{
    aktionsKennung: string;
    aktionsName: string;
    zielKennung: string;
    freigegebenAm: number;
    sicherheitsAuswertungAm: number;
  }> {
    if (!istObjekt(rohAuftrag) || rohAuftrag.schemaVersion !== 1) {
      throw new Error('Die feste Bruecke akzeptiert nur One-shot-Auftraege mit schemaVersion 1.');
    }

    const aktionsKennung = textFeld(rohAuftrag, 'aktionsKennung');
    const aktionsName = textFeld(rohAuftrag, 'aktionsName');
    const zielKennung = textFeld(rohAuftrag, 'zielKennung');
    const freigabeText = textFeld(rohAuftrag, 'freigabeText');
    const freigegebenAm = zeitFeld(rohAuftrag, 'freigegebenAm');
    const sicherheitsAuswertungAm = zeitFeld(rohAuftrag, 'sicherheitsAuswertungAm');

    if (aktionsName !== GRUPPEN_AKTIONS_NAMEN.gemeinsamesZielBearbeiten) {
      throw new Error(`Nicht freigegebener Bruecken-Aktionsname: ${aktionsName}.`);
    }
    if (freigabeText !== GRUPPEN_ZIEL_EINMAL_FREIGABE_TEXT) {
      throw new Error('Der Brueckenauftrag besitzt nicht den exakten Block-8-Einmal-Freigabetext.');
    }
    if (freigegebenAm > jetzt) throw new Error('Die One-shot-Freigabe liegt unzulaessig in der Zukunft.');
    if (jetzt - freigegebenAm > this.auftragMaximalAlterMillisekunden) {
      throw new Error('Der One-shot-Brueckenauftrag ist zu alt.');
    }
    if (sicherheitsAuswertungAm < freigegebenAm || sicherheitsAuswertungAm > jetzt) {
      throw new Error('Die read-only Sicherheitsauswertung des One-shot-Auftrags liegt nicht im Freigabefenster.');
    }

    return Object.freeze({
      aktionsKennung,
      aktionsName,
      zielKennung,
      freigegebenAm,
      sicherheitsAuswertungAm
    });
  }

  private liesZeitpunkt(name: string): number {
    const zeit = this.zeitQuelle();
    pruefeZeitpunkt(name, zeit);
    return zeit;
  }
}

export function erstelleAdventureLandGruppenZielAusfuehrungsBruecke(
  spielFenster: object,
  steuerung: AktionsSteuerung,
  liesAktuelleSicherheit: () => Readonly<KampfSicherheitsEntscheidung>,
  zeitQuelle: () => number,
  optionen: AdventureLandGruppenZielAusfuehrungsBrueckeOptionen = {}
): AdventureLandGruppenZielAusfuehrungsBruecke {
  return new AdventureLandGruppenZielAusfuehrungsBruecke(
    spielFenster,
    steuerung,
    liesAktuelleSicherheit,
    zeitQuelle,
    optionen
  );
}
