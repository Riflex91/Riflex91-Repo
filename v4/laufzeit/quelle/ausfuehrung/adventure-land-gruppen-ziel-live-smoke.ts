import { AdventureLandKampfBereitschaftLesezugriff } from '../adventure-land/adventure-land-kampf-bereitschaft.js';
import { AktionsSteuerung } from '../kern/aktions-steuerung.js';
import { GRUPPEN_AKTIONS_NAMEN } from '../vertraege/gruppen-aktionsanfrage.js';
import type { KampfSicherheitsEntscheidung } from '../vertraege/kampfsicherheit.js';
import {
  AdventureLandGruppenZielLiveBindung,
  GRUPPEN_ZIEL_LIVE_BINDUNG_FREIGABE_TEXT
} from './adventure-land-gruppen-ziel-live-bindung.js';
import { GRUPPEN_ZIEL_AUSFUEHRUNGS_BRUECKEN_NAME } from './adventure-land-gruppen-ziel-ausfuehrungs-bruecke.js';

export const GRUPPEN_ZIEL_LIVE_SMOKE_GLOBALER_NAME = 'V4Block8GruppenZielLiveSmoke';
export const GRUPPEN_ZIEL_LIVE_SMOKE_VERSION = '1.0.0';
export const GRUPPEN_ZIEL_LIVE_SMOKE_FREIGABE_TEXT = 'BLOCK8-GRUPPENZIEL-LIVE-SMOKE-EINMAL';

const STANDARD_VORSCHAU_MAXIMAL_ALTER_MILLISEKUNDEN = 5_000;
const STANDARD_SICHERHEITS_MAXIMAL_ALTER_MILLISEKUNDEN = 1_500;
const AKTIONS_FUNKTIONEN = Object.freeze([
  'attack',
  'move',
  'smart_move',
  'use_skill',
  'use_hp',
  'use_mp',
  'use_hp_or_mp',
  'loot',
  'send_cm',
  'command_character',
  'send_party_invite'
] as const);

type AktionsFunktionsName = (typeof AKTIONS_FUNKTIONEN)[number];

export interface AdventureLandGruppenZielLiveSmokeErwartung {
  readonly charakterName: string;
  readonly serverRegion: string;
  readonly serverKennung: string;
  readonly karte: string;
  readonly instanz: string;
  readonly zielKennung: string;
  readonly monsterArt: string;
}

export interface AdventureLandGruppenZielLiveSmokeOptionen {
  readonly aktivFreigegeben?: boolean;
  readonly vorschauMaximalAlterMillisekunden?: number;
  readonly sicherheitsMaximalAlterMillisekunden?: number;
  readonly brueckenAuftragMaximalAlterMillisekunden?: number;
}

export interface AdventureLandGruppenZielLiveSmokeVorschau {
  readonly schemaVersion: 1;
  readonly erstelltAm: number;
  readonly aktionsKennung: string;
  readonly aktionsName: typeof GRUPPEN_AKTIONS_NAMEN.gemeinsamesZielBearbeiten;
  readonly charakterName: string;
  readonly serverRegion: string;
  readonly serverKennung: string;
  readonly karte: string;
  readonly instanz: string;
  readonly zielKennung: string;
  readonly monsterArt: string;
  readonly sicherheitsZeitpunkt: number;
  readonly angriffsBereitschaft: 'bereit';
  readonly ressourcen: readonly ['gruppe', 'kampfziel'];
}

export interface AdventureLandGruppenZielLiveSmokeBericht {
  readonly schemaVersion: 1;
  readonly werkzeug: typeof GRUPPEN_ZIEL_LIVE_SMOKE_GLOBALER_NAME;
  readonly version: typeof GRUPPEN_ZIEL_LIVE_SMOKE_VERSION;
  readonly status: 'bestanden' | 'fehlgeschlagen';
  readonly gestartetAm: number;
  readonly beendetAm: number;
  readonly aktionsKennung: string | null;
  readonly zielKennung: string;
  readonly echteSpielaktionen: Readonly<{
    attack: number;
    sonstige: number;
    sonstigeNamen: readonly string[];
  }>;
  readonly automatischWiederGesperrt: true;
  readonly ausfuehrungsBrueckeEntfernt: boolean;
  readonly zentralePhase: string | null;
  readonly verbleibendeRessourcen: readonly string[];
  readonly fehler: string | null;
}

export interface AdventureLandGruppenZielLiveSmokeStatus {
  readonly schemaVersion: 1;
  readonly version: typeof GRUPPEN_ZIEL_LIVE_SMOKE_VERSION;
  readonly quelleBereich: 'ausfuehrung';
  readonly aktivFreigegeben: boolean;
  readonly freigegeben: boolean;
  readonly freigabeRestMillisekunden: number;
  readonly versuchVerbraucht: boolean;
  readonly letzteVorschau: Readonly<AdventureLandGruppenZielLiveSmokeVorschau> | null;
  readonly letzterBericht: Readonly<AdventureLandGruppenZielLiveSmokeBericht> | null;
}

export interface AdventureLandGruppenZielLiveSmokeFassade {
  readonly quelleBereich: 'ausfuehrung';
  readonly modus: 'one-shot-live-smoke';
  readonly version: typeof GRUPPEN_ZIEL_LIVE_SMOKE_VERSION;
  readonly status: () => Readonly<AdventureLandGruppenZielLiveSmokeStatus>;
  readonly vorschau: () => Readonly<AdventureLandGruppenZielLiveSmokeVorschau>;
  readonly freigeben: (text: string) => Readonly<AdventureLandGruppenZielLiveSmokeStatus>;
  readonly sperren: () => Readonly<AdventureLandGruppenZielLiveSmokeStatus>;
  readonly starte: () => Promise<Readonly<AdventureLandGruppenZielLiveSmokeBericht>>;
  readonly ergebnis: () => Readonly<AdventureLandGruppenZielLiveSmokeBericht> | null;
  readonly freigabeText: () => typeof GRUPPEN_ZIEL_LIVE_SMOKE_FREIGABE_TEXT;
}

function istObjekt(wert: unknown): wert is Readonly<Record<string, unknown>> {
  return typeof wert === 'object' && wert !== null;
}

function pruefeText(name: string, wert: string): void {
  if (wert.trim().length === 0) throw new Error(`${name} darf nicht leer sein.`);
}

function pruefePositiveZahl(name: string, wert: number): void {
  if (!Number.isFinite(wert) || wert <= 0) throw new Error(`${name} muss eine positive endliche Zahl sein.`);
}

function pruefeZeitpunkt(name: string, wert: number): void {
  if (!Number.isFinite(wert) || wert < 0) throw new Error(`${name} muss eine endliche, nichtnegative Zahl sein.`);
}

function fehlerText(fehler: unknown): string {
  return fehler instanceof Error ? fehler.message : String(fehler);
}

function holeParent(objekt: object): object | null {
  try {
    const wert = Reflect.get(objekt, 'parent');
    return (typeof wert === 'object' && wert !== null) || typeof wert === 'function' ? wert as object : null;
  } catch {
    return null;
  }
}

function leseSpielWert(spielFenster: object, name: string): unknown {
  try {
    const direkt = Reflect.get(spielFenster, name);
    if (direkt !== undefined) return direkt;
  } catch {
    // Parent-Fallback.
  }
  const parent = holeParent(spielFenster);
  if (parent && parent !== spielFenster) {
    try { return Reflect.get(parent, name); } catch { return undefined; }
  }
  return undefined;
}

function leseNichtleerenText(spielFenster: object, name: string): string | null {
  const wert = leseSpielWert(spielFenster, name);
  return typeof wert === 'string' && wert.length > 0 ? wert : null;
}

function leseCharakter(spielFenster: object): Readonly<Record<string, unknown>> {
  const charakter = leseSpielWert(spielFenster, 'character');
  if (!istObjekt(charakter)) throw new Error('Der Adventure-Land-Charakterzustand ist nicht sicher lesbar.');
  return charakter;
}

function leseZiel(spielFenster: object, zielKennung: string): Readonly<Record<string, unknown>> {
  const entities = leseSpielWert(spielFenster, 'entities');
  if (!istObjekt(entities)) throw new Error('Adventure-Land-Entities sind nicht sicher lesbar.');
  const direkt = entities[zielKennung];
  if (istObjekt(direkt)) return direkt;
  const gefunden = Object.values(entities).find((entity) => istObjekt(entity) && String(entity.id ?? '') === zielKennung);
  if (!istObjekt(gefunden)) throw new Error(`Das erwartete Smoke-Ziel ${zielKennung} ist nicht sichtbar.`);
  return gefunden;
}

function eigenerWert(ziel: object, name: string): unknown {
  try {
    return Object.prototype.hasOwnProperty.call(ziel, name) ? Reflect.get(ziel, name) : undefined;
  } catch {
    return undefined;
  }
}

export class AdventureLandGruppenZielLiveSmoke {
  private readonly aktivFreigegeben: boolean;
  private readonly vorschauMaximalAlterMillisekunden: number;
  private readonly sicherheitsMaximalAlterMillisekunden: number;
  private readonly brueckenAuftragMaximalAlterMillisekunden: number | undefined;
  private letzteVorschau: Readonly<AdventureLandGruppenZielLiveSmokeVorschau> | null = null;
  private letzterBericht: Readonly<AdventureLandGruppenZielLiveSmokeBericht> | null = null;
  private freigegebenAm: number | null = null;
  private freigegebenBis: number | null = null;
  private versuchVerbraucht = false;

  public constructor(
    private readonly zielKontext: object,
    private readonly spielFenster: object,
    private readonly steuerung: AktionsSteuerung,
    private readonly liesAktuelleSicherheit: () => Readonly<KampfSicherheitsEntscheidung>,
    private readonly zeitQuelle: () => number,
    private readonly erwartung: Readonly<AdventureLandGruppenZielLiveSmokeErwartung>,
    optionen: AdventureLandGruppenZielLiveSmokeOptionen = {}
  ) {
    this.aktivFreigegeben = optionen.aktivFreigegeben === true;
    this.vorschauMaximalAlterMillisekunden = optionen.vorschauMaximalAlterMillisekunden ?? STANDARD_VORSCHAU_MAXIMAL_ALTER_MILLISEKUNDEN;
    this.sicherheitsMaximalAlterMillisekunden = optionen.sicherheitsMaximalAlterMillisekunden ?? STANDARD_SICHERHEITS_MAXIMAL_ALTER_MILLISEKUNDEN;
    this.brueckenAuftragMaximalAlterMillisekunden = optionen.brueckenAuftragMaximalAlterMillisekunden;
    pruefePositiveZahl('vorschauMaximalAlterMillisekunden', this.vorschauMaximalAlterMillisekunden);
    pruefePositiveZahl('sicherheitsMaximalAlterMillisekunden', this.sicherheitsMaximalAlterMillisekunden);
    if (this.brueckenAuftragMaximalAlterMillisekunden !== undefined) {
      pruefePositiveZahl('brueckenAuftragMaximalAlterMillisekunden', this.brueckenAuftragMaximalAlterMillisekunden);
    }
    for (const [name, wert] of Object.entries(this.erwartung)) pruefeText(`erwartung.${name}`, wert);
  }

  public status(): Readonly<AdventureLandGruppenZielLiveSmokeStatus> {
    const jetzt = this.liesZeitpunkt('Der Smoke-Statuszeitpunkt');
    if (this.freigegebenBis !== null && jetzt > this.freigegebenBis) this.entferneFreigabe();
    return Object.freeze({
      schemaVersion: 1,
      version: GRUPPEN_ZIEL_LIVE_SMOKE_VERSION,
      quelleBereich: 'ausfuehrung',
      aktivFreigegeben: this.aktivFreigegeben,
      freigegeben: this.freigegebenAm !== null && this.freigegebenBis !== null,
      freigabeRestMillisekunden: this.freigegebenBis === null ? 0 : Math.max(0, this.freigegebenBis - jetzt),
      versuchVerbraucht: this.versuchVerbraucht,
      letzteVorschau: this.letzteVorschau,
      letzterBericht: this.letzterBericht
    });
  }

  public vorschau(): Readonly<AdventureLandGruppenZielLiveSmokeVorschau> {
    if (this.versuchVerbraucht) throw new Error('Der Live-Smoke-Versuch wurde bereits verbraucht.');
    const basis = this.pruefeGesamtenZustand();
    const vorschau = Object.freeze({
      schemaVersion: 1 as const,
      erstelltAm: basis.geprueftAm,
      aktionsKennung: basis.aktionsKennung,
      aktionsName: GRUPPEN_AKTIONS_NAMEN.gemeinsamesZielBearbeiten,
      charakterName: this.erwartung.charakterName,
      serverRegion: this.erwartung.serverRegion,
      serverKennung: this.erwartung.serverKennung,
      karte: this.erwartung.karte,
      instanz: this.erwartung.instanz,
      zielKennung: this.erwartung.zielKennung,
      monsterArt: this.erwartung.monsterArt,
      sicherheitsZeitpunkt: basis.sicherheit.zeitpunkt,
      angriffsBereitschaft: 'bereit' as const,
      ressourcen: Object.freeze(['gruppe', 'kampfziel'] as const)
    });
    this.letzteVorschau = vorschau;
    this.entferneFreigabe();
    return vorschau;
  }

  public freigeben(text: string): Readonly<AdventureLandGruppenZielLiveSmokeStatus> {
    if (!this.aktivFreigegeben) throw new Error('Der Block-8-Gruppenziel-Live-Smoke ist standardmaessig gesperrt.');
    if (this.versuchVerbraucht) throw new Error('Der Live-Smoke-Versuch wurde bereits verbraucht.');
    if (text !== GRUPPEN_ZIEL_LIVE_SMOKE_FREIGABE_TEXT) {
      throw new Error(`Falscher Live-Smoke-Freigabetext. Erwartet wird exakt: ${GRUPPEN_ZIEL_LIVE_SMOKE_FREIGABE_TEXT}`);
    }
    if (!this.letzteVorschau) throw new Error('Vor der Live-Smoke-Freigabe ist eine frische Produktionsvorschau erforderlich.');
    const basis = this.pruefeGesamtenZustand();
    const jetzt = basis.geprueftAm;
    if (jetzt - this.letzteVorschau.erstelltAm > this.vorschauMaximalAlterMillisekunden) {
      throw new Error('Die Produktionsvorschau fuer den Live-Smoke ist zu alt.');
    }
    if (basis.aktionsKennung !== this.letzteVorschau.aktionsKennung) {
      throw new Error('Der zentral laufende Gruppenauftrag hat sich seit der Produktionsvorschau geaendert.');
    }
    this.freigegebenAm = jetzt;
    this.freigegebenBis = jetzt + this.vorschauMaximalAlterMillisekunden;
    return this.status();
  }

  public sperren(): Readonly<AdventureLandGruppenZielLiveSmokeStatus> {
    this.entferneFreigabe();
    return this.status();
  }

  public async starte(): Promise<Readonly<AdventureLandGruppenZielLiveSmokeBericht>> {
    if (this.versuchVerbraucht) throw new Error('Der einzige Live-Smoke-Versuch wurde bereits verbraucht.');
    const gestartetAm = this.liesZeitpunkt('Der Smoke-Startzeitpunkt');
    const freigegebenAm = this.freigegebenAm;
    const freigegebenBis = this.freigegebenBis;
    if (freigegebenAm === null || freigegebenBis === null || gestartetAm > freigegebenBis) {
      this.entferneFreigabe();
      throw new Error('Der Block-8-Gruppenziel-Live-Smoke ist gesperrt oder die Freigabe ist abgelaufen.');
    }

    this.versuchVerbraucht = true;
    this.entferneFreigabe();

    let aktionsKennung: string | null = null;
    const audit = {
      attack: 0,
      sonstige: 0,
      sonstigeNamen: [] as string[]
    };
    let bindung: AdventureLandGruppenZielLiveBindung | null = null;

    try {
      const basis = this.pruefeGesamtenZustand();
      aktionsKennung = basis.aktionsKennung;
      if (this.letzteVorschau?.aktionsKennung !== aktionsKennung) {
        throw new Error('Der zentral laufende Gruppenauftrag stimmt beim Start nicht mehr mit der Vorschau ueberein.');
      }

      const auditFenster = this.erzeugeAuditSpielFenster(audit);
      const bindungsOptionen: {
        aktivFreigegeben: true;
        sicherheitsMaximalAlterMillisekunden: number;
        auftragMaximalAlterMillisekunden?: number;
      } = {
        aktivFreigegeben: true,
        sicherheitsMaximalAlterMillisekunden: this.sicherheitsMaximalAlterMillisekunden
      };
      if (this.brueckenAuftragMaximalAlterMillisekunden !== undefined) {
        bindungsOptionen.auftragMaximalAlterMillisekunden = this.brueckenAuftragMaximalAlterMillisekunden;
      }
      bindung = new AdventureLandGruppenZielLiveBindung(
        auditFenster,
        this.steuerung,
        this.liesAktuelleSicherheit,
        this.zeitQuelle,
        bindungsOptionen
      );
      const fassade = bindung.installiere(this.zielKontext, GRUPPEN_ZIEL_LIVE_BINDUNG_FREIGABE_TEXT);

      const sicherheitRoh = this.liesAktuelleSicherheit();
      const sicherheitsPruefungAm = this.liesZeitpunkt('Der Smoke-Sicherheitspruefzeitpunkt');
      const sicherheit = this.pruefeSicherheit(sicherheitRoh, sicherheitsPruefungAm);
      const ergebnis = await fassade.fuehreEinmalAus(Object.freeze({
        schemaVersion: 1,
        aktionsKennung,
        aktionsName: GRUPPEN_AKTIONS_NAMEN.gemeinsamesZielBearbeiten,
        zielKennung: this.erwartung.zielKennung,
        freigabeText: 'BLOCK8-GRUPPENZIEL-EINMAL-FREIGEBEN',
        freigegebenAm,
        sicherheitsAuswertungAm: sicherheit.zeitpunkt,
        angriffsBereitschaft: Object.freeze({ zustand: 'bereit', quelle: 'produktions-smoke-vorschau' }),
        zielPruefung: Object.freeze({ zielKennung: this.erwartung.zielKennung })
      }));

      const beendetAm = this.liesZeitpunkt('Der Smoke-Abschlusszeitpunkt');
      if (ergebnis.aktionsKennung !== aktionsKennung) throw new Error('Die Produktionsbruecke meldete eine unerwartete Aktionskennung.');
      if (audit.attack !== 1 || audit.sonstige !== 0) {
        throw new Error(`Der Live-Smoke beobachtete unerwartete Aktionszaehler: attack=${audit.attack}, sonstige=${audit.sonstige}.`);
      }
      if (eigenerWert(this.zielKontext, GRUPPEN_ZIEL_AUSFUEHRUNGS_BRUECKEN_NAME) !== undefined) {
        throw new Error('Die Produktionsbruecke ist nach dem one-shot Versuch noch global installiert.');
      }
      const phase = this.steuerung.holeAktionsZustand(aktionsKennung)?.phase ?? null;
      if (phase !== 'abgeschlossen') throw new Error(`Die zentrale Gruppenanfrage ist nach dem Smoke nicht abgeschlossen: ${String(phase)}.`);
      const verbleibende = this.ressourcenFuer(aktionsKennung);
      if (verbleibende.length !== 0) throw new Error(`Nach dem Smoke sind noch zentrale Ressourcen gesperrt: ${verbleibende.join(', ')}.`);

      const bericht = this.baueBericht(
        'bestanden',
        gestartetAm,
        beendetAm,
        aktionsKennung,
        audit,
        phase,
        verbleibende,
        null
      );
      this.letzterBericht = bericht;
      return bericht;
    } catch (fehler) {
      bindung?.sperre();
      const beendetAm = this.liesZeitpunkt('Der Smoke-Fehlerzeitpunkt');
      if (aktionsKennung !== null && this.steuerung.holeAktionsZustand(aktionsKennung)?.phase === 'laeuft') {
        this.steuerung.brecheAktionAb(
          aktionsKennung,
          beendetAm,
          `Block-8-Gruppenziel-Live-Smoke hat fail-safe abgebrochen: ${fehlerText(fehler)}`
        );
      }
      const phase = aktionsKennung === null ? null : this.steuerung.holeAktionsZustand(aktionsKennung)?.phase ?? null;
      const verbleibende = aktionsKennung === null ? Object.freeze([] as string[]) : this.ressourcenFuer(aktionsKennung);
      const bericht = this.baueBericht(
        'fehlgeschlagen',
        gestartetAm,
        beendetAm,
        aktionsKennung,
        audit,
        phase,
        verbleibende,
        fehlerText(fehler)
      );
      this.letzterBericht = bericht;
      throw Object.assign(new Error(bericht.fehler ?? 'Live-Smoke fehlgeschlagen.'), { bericht });
    }
  }

  public ergebnis(): Readonly<AdventureLandGruppenZielLiveSmokeBericht> | null {
    return this.letzterBericht;
  }

  private pruefeGesamtenZustand(): Readonly<{
    aktionsKennung: string;
    sicherheit: Readonly<KampfSicherheitsEntscheidung>;
    geprueftAm: number;
  }> {
    this.pruefeIdentitaetUndZiel();
    if (eigenerWert(this.zielKontext, GRUPPEN_ZIEL_AUSFUEHRUNGS_BRUECKEN_NAME) !== undefined) {
      throw new Error('Im Smoke-Zielkontext ist bereits eine Ausfuehrungsbruecke vorhanden; bestehende Autoritaet wird nicht uebernommen oder entfernt.');
    }
    const laufende = this.steuerung.listeAktionsZustaende().filter((zustand) =>
      zustand.phase === 'laeuft' &&
      zustand.anfrage.angefordertVon === 'gruppen-aktionsplanung' &&
      zustand.anfrage.aktion === GRUPPEN_AKTIONS_NAMEN.gemeinsamesZielBearbeiten
    );
    const passend = laufende.filter((zustand) =>
      istObjekt(zustand.anfrage.details) &&
      zustand.anfrage.details.zielKennung === this.erwartung.zielKennung
    );
    if (passend.length !== 1) {
      throw new Error(`Der Live-Smoke benoetigt genau eine laufende zentrale Gruppenzielanfrage fuer ${this.erwartung.zielKennung}; gefunden: ${passend.length}.`);
    }
    const zustand = passend[0]!;
    const sperren = this.steuerung.listeRessourcenSperren();
    for (const ressource of ['gruppe', 'kampfziel'] as const) {
      if (sperren.find((sperre) => sperre.ressource === ressource)?.besitzer !== zustand.anfrage.kennung) {
        throw new Error(`Die zentrale Gruppenzielanfrage besitzt die Ressource ${ressource} nicht.`);
      }
    }

    // Die Produktions-Safety darf ihren eigenen Zeitstempel waehrend der Berechnung erst erzeugen.
    // Deshalb wird der Vergleichszeitpunkt bewusst NACH der Safety-Erzeugung gelesen.
    const sicherheitRoh = this.liesAktuelleSicherheit();
    const geprueftAm = this.liesZeitpunkt('Der Smoke-Zustandspruefzeitpunkt');
    const sicherheit = this.pruefeSicherheit(sicherheitRoh, geprueftAm);

    if (zustand.anfrage.gueltigBis !== undefined && zustand.anfrage.gueltigBis <= geprueftAm) {
      throw new Error('Die zentrale Gruppenzielanfrage ist bereits abgelaufen.');
    }

    const bereitschaft = new AdventureLandKampfBereitschaftLesezugriff(this.spielFenster).liesNormalenAngriff(geprueftAm);
    if (bereitschaft.zustand !== 'bereit') {
      throw new Error(`Der normale Angriff ist fuer den Live-Smoke nicht explizit bereit: ${bereitschaft.zustand}.`);
    }
    return Object.freeze({ aktionsKennung: zustand.anfrage.kennung, sicherheit, geprueftAm });
  }

  private pruefeIdentitaetUndZiel(): void {
    const charakter = leseCharakter(this.spielFenster);
    const name = typeof charakter.name === 'string' ? charakter.name : null;
    const karte = typeof charakter.map === 'string' ? charakter.map : null;
    const instanz = typeof charakter.in === 'string' ? charakter.in : null;
    const region = leseNichtleerenText(this.spielFenster, 'server_region');
    const server = leseNichtleerenText(this.spielFenster, 'server_identifier');
    if (name !== this.erwartung.charakterName) throw new Error(`Live-Smoke Charakter stimmt nicht: ${String(name)}.`);
    if (region !== this.erwartung.serverRegion) throw new Error(`Live-Smoke Serverregion stimmt nicht: ${String(region)}.`);
    if (server !== this.erwartung.serverKennung) throw new Error(`Live-Smoke Serverkennung stimmt nicht: ${String(server)}.`);
    if (karte !== this.erwartung.karte) throw new Error(`Live-Smoke Karte stimmt nicht: ${String(karte)}.`);
    if (instanz !== this.erwartung.instanz) throw new Error(`Live-Smoke Instanz stimmt nicht: ${String(instanz)}.`);
    if (charakter.rip === true || typeof charakter.hp !== 'number' || !Number.isFinite(charakter.hp) || charakter.hp <= 0) {
      throw new Error('Der Live-Smoke-Charakter ist nicht bestaetigt lebendig.');
    }

    const ziel = leseZiel(this.spielFenster, this.erwartung.zielKennung);
    if (String(ziel.id ?? '') !== this.erwartung.zielKennung) throw new Error('Die sichtbare Zielkennung stimmt nicht exakt mit der Smoke-Erwartung ueberein.');
    if (ziel.mtype !== this.erwartung.monsterArt) throw new Error(`Die Monsterart des Smoke-Ziels stimmt nicht: ${String(ziel.mtype)}.`);
    if (ziel.dead === true || ziel.rip === true || typeof ziel.hp !== 'number' || !Number.isFinite(ziel.hp) || ziel.hp <= 0) {
      throw new Error('Das Live-Smoke-Ziel ist nicht bestaetigt lebendig.');
    }
    if (typeof ziel.map === 'string' && ziel.map !== this.erwartung.karte) {
      throw new Error(`Das Live-Smoke-Ziel befindet sich auf einer unerwarteten Karte: ${ziel.map}.`);
    }
  }

  private pruefeSicherheit(
    sicherheit: Readonly<KampfSicherheitsEntscheidung>,
    jetzt: number
  ): Readonly<KampfSicherheitsEntscheidung> {
    if (!sicherheit || sicherheit.schemaVersion !== 1) throw new Error('Der Live-Smoke erhielt keine gueltige Produktions-Sicherheitsentscheidung.');
    pruefeZeitpunkt('Der Produktions-Sicherheitszeitpunkt', sicherheit.zeitpunkt);
    if (sicherheit.zeitpunkt > jetzt) throw new Error('Die Produktions-Safety liegt fuer den Live-Smoke in der Zukunft.');
    if (jetzt - sicherheit.zeitpunkt > this.sicherheitsMaximalAlterMillisekunden) {
      throw new Error('Die Produktions-Safety ist fuer den Live-Smoke zu alt.');
    }
    if (sicherheit.normalAktionenErlaubt !== true || sicherheit.art !== 'keine' || sicherheit.gefahrenBewertung.stufe !== 'sicher') {
      throw new Error('Die Produktions-Safety gibt den Live-Smoke nicht frei.');
    }
    return sicherheit;
  }

  private erzeugeAuditSpielFenster(audit: { attack: number; sonstige: number; sonstigeNamen: string[] }): object {
    const original = this.spielFenster;
    return new Proxy(original, {
      get: (ziel, eigenschaft, empfaenger) => {
        if (typeof eigenschaft !== 'string' || !AKTIONS_FUNKTIONEN.includes(eigenschaft as AktionsFunktionsName)) {
          return Reflect.get(ziel, eigenschaft, empfaenger);
        }
        const originalFunktion = Reflect.get(ziel, eigenschaft, ziel);
        if (typeof originalFunktion !== 'function') return originalFunktion;
        if (eigenschaft === 'attack') {
          return (...argumente: unknown[]) => {
            audit.attack += 1;
            return Reflect.apply(originalFunktion, ziel, argumente);
          };
        }
        return (..._argumente: unknown[]) => {
          audit.sonstige += 1;
          audit.sonstigeNamen.push(eigenschaft);
          throw new Error(`Unerwartete Adventure-Land-Aktion im Gruppenziel-Live-Smoke blockiert: ${eigenschaft}.`);
        };
      }
    });
  }

  private ressourcenFuer(aktionsKennung: string): readonly string[] {
    return Object.freeze(
      this.steuerung.listeRessourcenSperren()
        .filter((sperre) => sperre.besitzer === aktionsKennung)
        .map((sperre) => sperre.ressource)
        .sort()
    );
  }

  private baueBericht(
    status: 'bestanden' | 'fehlgeschlagen',
    gestartetAm: number,
    beendetAm: number,
    aktionsKennung: string | null,
    audit: { attack: number; sonstige: number; sonstigeNamen: string[] },
    zentralePhase: string | null,
    verbleibendeRessourcen: readonly string[],
    fehler: string | null
  ): Readonly<AdventureLandGruppenZielLiveSmokeBericht> {
    return Object.freeze({
      schemaVersion: 1,
      werkzeug: GRUPPEN_ZIEL_LIVE_SMOKE_GLOBALER_NAME,
      version: GRUPPEN_ZIEL_LIVE_SMOKE_VERSION,
      status,
      gestartetAm,
      beendetAm,
      aktionsKennung,
      zielKennung: this.erwartung.zielKennung,
      echteSpielaktionen: Object.freeze({
        attack: audit.attack,
        sonstige: audit.sonstige,
        sonstigeNamen: Object.freeze([...audit.sonstigeNamen])
      }),
      automatischWiederGesperrt: true,
      ausfuehrungsBrueckeEntfernt: eigenerWert(this.zielKontext, GRUPPEN_ZIEL_AUSFUEHRUNGS_BRUECKEN_NAME) === undefined,
      zentralePhase,
      verbleibendeRessourcen: Object.freeze([...verbleibendeRessourcen]),
      fehler
    });
  }

  private entferneFreigabe(): void {
    this.freigegebenAm = null;
    this.freigegebenBis = null;
  }

  private liesZeitpunkt(name: string): number {
    const wert = this.zeitQuelle();
    pruefeZeitpunkt(name, wert);
    return wert;
  }
}

export function installiereAdventureLandGruppenZielLiveSmoke(
  zielKontext: object,
  smoke: AdventureLandGruppenZielLiveSmoke
): Readonly<AdventureLandGruppenZielLiveSmokeFassade> {
  const vorhanden = eigenerWert(zielKontext, GRUPPEN_ZIEL_LIVE_SMOKE_GLOBALER_NAME);
  if (vorhanden !== undefined) throw new Error(`${GRUPPEN_ZIEL_LIVE_SMOKE_GLOBALER_NAME} ist bereits im Zielkontext vorhanden.`);

  const fassade: Readonly<AdventureLandGruppenZielLiveSmokeFassade> = Object.freeze({
    quelleBereich: 'ausfuehrung',
    modus: 'one-shot-live-smoke',
    version: GRUPPEN_ZIEL_LIVE_SMOKE_VERSION,
    status: () => smoke.status(),
    vorschau: () => smoke.vorschau(),
    freigeben: (text: string) => smoke.freigeben(text),
    sperren: () => smoke.sperren(),
    starte: () => smoke.starte(),
    ergebnis: () => smoke.ergebnis(),
    freigabeText: () => GRUPPEN_ZIEL_LIVE_SMOKE_FREIGABE_TEXT
  });
  const ok = Reflect.defineProperty(zielKontext, GRUPPEN_ZIEL_LIVE_SMOKE_GLOBALER_NAME, {
    configurable: true,
    enumerable: true,
    writable: false,
    value: fassade
  });
  if (!ok) throw new Error('Die Block-8-Gruppenziel-Live-Smoke-Fassade konnte nicht installiert werden.');
  return fassade;
}
