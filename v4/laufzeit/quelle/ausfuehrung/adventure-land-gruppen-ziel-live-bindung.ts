import { AktionsSteuerung } from '../kern/aktions-steuerung.js';
import { GRUPPEN_AKTIONS_NAMEN } from '../vertraege/gruppen-aktionsanfrage.js';
import type { KampfSicherheitsEntscheidung } from '../vertraege/kampfsicherheit.js';
import {
  AdventureLandGruppenZielAusfuehrungsBruecke,
  type AdventureLandGruppenZielAusfuehrungsBrueckenErgebnis,
  type GruppenZielAusfuehrungsBrueckenAuftrag,
  GRUPPEN_ZIEL_AUSFUEHRUNGS_BRUECKEN_NAME,
  GRUPPEN_ZIEL_AUSFUEHRUNGS_BRUECKEN_VERSION
} from './adventure-land-gruppen-ziel-ausfuehrungs-bruecke.js';

export const GRUPPEN_ZIEL_LIVE_BINDUNG_FREIGABE_TEXT = 'BLOCK8-GRUPPENZIEL-LIVE-BINDUNG-EINMAL';
export const GRUPPEN_ZIEL_LIVE_BINDUNG_VERSION = '1.0.0';

export interface AdventureLandGruppenZielLiveBindungOptionen {
  readonly aktivFreigegeben?: boolean;
  readonly auftragMaximalAlterMillisekunden?: number;
  readonly sicherheitsMaximalAlterMillisekunden?: number;
}

export interface AdventureLandGruppenZielLiveBindungStatus {
  readonly schemaVersion: 1;
  readonly version: typeof GRUPPEN_ZIEL_LIVE_BINDUNG_VERSION;
  readonly globalerName: typeof GRUPPEN_ZIEL_AUSFUEHRUNGS_BRUECKEN_NAME;
  readonly quelleBereich: 'ausfuehrung';
  readonly aktionsName: typeof GRUPPEN_AKTIONS_NAMEN.gemeinsamesZielBearbeiten;
  readonly aktivFreigegeben: boolean;
  readonly installiert: boolean;
  readonly versuchVerbraucht: boolean;
}

export interface AdventureLandGruppenZielLiveFassade {
  readonly quelleBereich: 'ausfuehrung';
  readonly aktionsName: typeof GRUPPEN_AKTIONS_NAMEN.gemeinsamesZielBearbeiten;
  readonly version: typeof GRUPPEN_ZIEL_AUSFUEHRUNGS_BRUECKEN_VERSION;
  readonly status: () => ReturnType<AdventureLandGruppenZielAusfuehrungsBruecke['status']>;
  readonly fuehreEinmalAus: (
    auftrag: Readonly<GruppenZielAusfuehrungsBrueckenAuftrag>
  ) => Promise<Readonly<AdventureLandGruppenZielAusfuehrungsBrueckenErgebnis>>;
}

function pruefeZeitpunkt(name: string, wert: number): void {
  if (!Number.isFinite(wert) || wert < 0) throw new Error(`${name} muss eine endliche, nichtnegative Zahl sein.`);
}

function istObjekt(wert: unknown): wert is Readonly<Record<string, unknown>> {
  return typeof wert === 'object' && wert !== null;
}

function leseEigeneEigenschaft(ziel: object, name: string): unknown {
  try {
    return Object.prototype.hasOwnProperty.call(ziel, name) ? Reflect.get(ziel, name) : undefined;
  } catch {
    return undefined;
  }
}

export class AdventureLandGruppenZielLiveBindung {
  private readonly aktivFreigegeben: boolean;
  private readonly brueckenOptionen: Readonly<{
    auftragMaximalAlterMillisekunden?: number;
    sicherheitsMaximalAlterMillisekunden?: number;
  }>;
  private installiertAuf: object | null = null;
  private fassade: Readonly<AdventureLandGruppenZielLiveFassade> | null = null;
  private bruecke: AdventureLandGruppenZielAusfuehrungsBruecke | null = null;
  private versuchVerbraucht = false;

  public constructor(
    private readonly spielFenster: object,
    private readonly steuerung: AktionsSteuerung,
    private readonly liesAktuelleSicherheit: () => Readonly<KampfSicherheitsEntscheidung>,
    private readonly zeitQuelle: () => number,
    optionen: AdventureLandGruppenZielLiveBindungOptionen = {}
  ) {
    this.aktivFreigegeben = optionen.aktivFreigegeben === true;
    const brueckenOptionen: {
      auftragMaximalAlterMillisekunden?: number;
      sicherheitsMaximalAlterMillisekunden?: number;
    } = {};
    if (optionen.auftragMaximalAlterMillisekunden !== undefined) {
      brueckenOptionen.auftragMaximalAlterMillisekunden = optionen.auftragMaximalAlterMillisekunden;
    }
    if (optionen.sicherheitsMaximalAlterMillisekunden !== undefined) {
      brueckenOptionen.sicherheitsMaximalAlterMillisekunden = optionen.sicherheitsMaximalAlterMillisekunden;
    }
    this.brueckenOptionen = Object.freeze(brueckenOptionen);
  }

  public status(): Readonly<AdventureLandGruppenZielLiveBindungStatus> {
    return Object.freeze({
      schemaVersion: 1,
      version: GRUPPEN_ZIEL_LIVE_BINDUNG_VERSION,
      globalerName: GRUPPEN_ZIEL_AUSFUEHRUNGS_BRUECKEN_NAME,
      quelleBereich: 'ausfuehrung',
      aktionsName: GRUPPEN_AKTIONS_NAMEN.gemeinsamesZielBearbeiten,
      aktivFreigegeben: this.aktivFreigegeben,
      installiert: this.installiertAuf !== null && this.fassade !== null,
      versuchVerbraucht: this.versuchVerbraucht
    });
  }

  public installiere(
    zielKontext: object,
    freigabeText: string
  ): Readonly<AdventureLandGruppenZielLiveFassade> {
    if (!this.aktivFreigegeben) {
      throw new Error('Die Block-8-Gruppenziel-Live-Bindung ist standardmaessig gesperrt.');
    }
    if (freigabeText !== GRUPPEN_ZIEL_LIVE_BINDUNG_FREIGABE_TEXT) {
      throw new Error(`Falscher Live-Bindungs-Freigabetext. Erwartet wird exakt: ${GRUPPEN_ZIEL_LIVE_BINDUNG_FREIGABE_TEXT}`);
    }
    if (this.versuchVerbraucht) {
      throw new Error('Die Block-8-Gruppenziel-Live-Bindung wurde bereits fuer einen Versuch verbraucht.');
    }
    if (this.installiertAuf !== null || this.fassade !== null || this.bruecke !== null) {
      throw new Error('Die Block-8-Gruppenziel-Live-Bindung ist bereits installiert.');
    }

    const vorhanden = leseEigeneEigenschaft(zielKontext, GRUPPEN_ZIEL_AUSFUEHRUNGS_BRUECKEN_NAME);
    if (vorhanden !== undefined) {
      throw new Error(`Der Browserkontext besitzt bereits ${GRUPPEN_ZIEL_AUSFUEHRUNGS_BRUECKEN_NAME}; bestehende Laufzeitautoritaet wird nicht ueberschrieben.`);
    }

    const bruecke = new AdventureLandGruppenZielAusfuehrungsBruecke(
      this.spielFenster,
      this.steuerung,
      () => this.liesAktuelleSicherheit(),
      this.zeitQuelle,
      {
        aktivFreigegeben: true,
        ...this.brueckenOptionen
      }
    );

    const fassade: Readonly<AdventureLandGruppenZielLiveFassade> = Object.freeze({
      quelleBereich: 'ausfuehrung',
      aktionsName: GRUPPEN_AKTIONS_NAMEN.gemeinsamesZielBearbeiten,
      version: GRUPPEN_ZIEL_AUSFUEHRUNGS_BRUECKEN_VERSION,
      status: () => bruecke.status(),
      fuehreEinmalAus: async (auftrag: Readonly<GruppenZielAusfuehrungsBrueckenAuftrag>) => this.fuehreInstalliertenVersuchAus(auftrag)
    });

    const installiert = Reflect.defineProperty(zielKontext, GRUPPEN_ZIEL_AUSFUEHRUNGS_BRUECKEN_NAME, {
      configurable: true,
      enumerable: true,
      writable: false,
      value: fassade
    });
    if (!installiert) {
      throw new Error('Die feste Gruppenziel-Ausfuehrungsbruecke konnte nicht im Browserkontext installiert werden.');
    }

    this.installiertAuf = zielKontext;
    this.fassade = fassade;
    this.bruecke = bruecke;
    return fassade;
  }

  public sperre(): Readonly<AdventureLandGruppenZielLiveBindungStatus> {
    this.entferneEigeneFassade(false);
    this.bruecke = null;
    return this.status();
  }

  private async fuehreInstalliertenVersuchAus(
    auftrag: Readonly<GruppenZielAusfuehrungsBrueckenAuftrag>
  ): Promise<Readonly<AdventureLandGruppenZielAusfuehrungsBrueckenErgebnis>> {
    if (this.versuchVerbraucht) {
      throw new Error('Der einzige Live-Bindungsversuch wurde bereits verbraucht.');
    }

    this.versuchVerbraucht = true;
    const bruecke = this.bruecke;

    try {
      if (!bruecke || !this.installiertAuf || !this.fassade) {
        throw new Error('Die Live-Bindung besitzt keine vollstaendig installierte Produktionsbruecke.');
      }

      // Sicherheitsgrenze: Die globale Fassade verschwindet vor jeder delegierten Ausfuehrung.
      this.entferneEigeneFassade(true);
      this.bruecke = null;

      return await bruecke.fuehreEinmalAus(auftrag);
    } catch (fehler) {
      this.bruecke = null;
      this.brechePassendeLaufendeGruppenanfrageAb(auftrag, fehler);
      throw fehler;
    }
  }

  private entferneEigeneFassade(strikt: boolean): void {
    const ziel = this.installiertAuf;
    const fassade = this.fassade;
    if (!ziel || !fassade) {
      this.installiertAuf = null;
      this.fassade = null;
      return;
    }

    const aktuell = leseEigeneEigenschaft(ziel, GRUPPEN_ZIEL_AUSFUEHRUNGS_BRUECKEN_NAME);
    if (aktuell !== fassade) {
      this.installiertAuf = null;
      this.fassade = null;
      if (strikt) {
        throw new Error('Die installierte Gruppenziel-Brueckenfassade wurde im Browserkontext unerwartet ersetzt.');
      }
      return;
    }

    if (!Reflect.deleteProperty(ziel, GRUPPEN_ZIEL_AUSFUEHRUNGS_BRUECKEN_NAME)) {
      if (strikt) {
        throw new Error('Die Gruppenziel-Brueckenfassade konnte vor dem Live-Versuch nicht entfernt werden.');
      }
      return;
    }

    this.installiertAuf = null;
    this.fassade = null;
  }

  private brechePassendeLaufendeGruppenanfrageAb(auftrag: unknown, fehler: unknown): void {
    if (!istObjekt(auftrag) || typeof auftrag.aktionsKennung !== 'string') return;
    const zustand = this.steuerung.holeAktionsZustand(auftrag.aktionsKennung);
    if (!zustand || zustand.phase !== 'laeuft') return;
    if (zustand.anfrage.angefordertVon !== 'gruppen-aktionsplanung') return;
    if (zustand.anfrage.aktion !== GRUPPEN_AKTIONS_NAMEN.gemeinsamesZielBearbeiten) return;

    const jetzt = this.zeitQuelle();
    pruefeZeitpunkt('Der Live-Bindungs-Abbruchzeitpunkt', jetzt);
    const text = fehler instanceof Error ? fehler.message : String(fehler);
    this.steuerung.brecheAktionAb(
      auftrag.aktionsKennung,
      jetzt,
      `Block-8-Gruppenziel-Live-Bindung hat fail-safe abgebrochen: ${text}`
    );
  }
}

export function installiereAdventureLandGruppenZielLiveBindung(
  zielKontext: object,
  spielFenster: object,
  steuerung: AktionsSteuerung,
  liesAktuelleSicherheit: () => Readonly<KampfSicherheitsEntscheidung>,
  zeitQuelle: () => number,
  freigabeText: string,
  optionen: AdventureLandGruppenZielLiveBindungOptionen = {}
): Readonly<{
  bindung: AdventureLandGruppenZielLiveBindung;
  fassade: Readonly<AdventureLandGruppenZielLiveFassade>;
}> {
  const bindung = new AdventureLandGruppenZielLiveBindung(
    spielFenster,
    steuerung,
    liesAktuelleSicherheit,
    zeitQuelle,
    optionen
  );
  const fassade = bindung.installiere(zielKontext, freigabeText);
  return Object.freeze({ bindung, fassade });
}
