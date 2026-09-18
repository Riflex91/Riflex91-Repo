import { AdventureLandLesezugriff } from '../adventure-land/adventure-land-lesezugriff.js';
import { beobachteSpielzustand } from '../kern/spielzustand-erstellung.js';
import { AktionsSteuerung } from '../kern/aktions-steuerung.js';
import {
  erstelleKampfSicherheitsAblaufZustand,
  erstelleKampfSicherheitsKonfiguration,
  planeKampfSicherheitsSchritt
} from '../spiellogik/kampfsicherheit.js';
import {
  erstelleGruppenTeilnehmerMeldungAusKampfsicherheit
} from '../spiellogik/gruppen-lebensnachweis.js';
import {
  erstelleGruppenKoordinationsKonfiguration,
  koordiniereGruppe
} from '../spiellogik/gruppen-koordination.js';
import {
  erstelleGruppenAktionsPlanKonfiguration,
  planeGruppenAktionen
} from '../spiellogik/gruppen-aktionsplanung.js';
import {
  erstelleGruppenAktionsAnfrageKonfiguration,
  uebersetzeEigeneGruppenPlanSchritte
} from '../spiellogik/gruppen-aktionsanfragen.js';
import {
  erstelleGruppenAktionsSteuerungKonfiguration,
  uebergibGruppenAktionsAnfragenAnSteuerung
} from '../spiellogik/gruppen-aktionssteuerung.js';
import type { GruppenFaehigkeitsProfil, GruppenKoordinationsEntscheidung, GruppenTeilnehmerMeldung } from '../vertraege/gruppen-koordination.js';
import type { KampfSicherheitsAblaufZustand, KampfSicherheitsEntscheidung } from '../vertraege/kampfsicherheit.js';
import { GRUPPEN_AKTIONS_NAMEN } from '../vertraege/gruppen-aktionsanfrage.js';
import type { GruppenLebensnachweisEmpfang } from '../vertraege/gruppen-lebensnachweis.js';
import {
  AdventureLandGruppenLebensnachweisAustausch,
  type AdventureLandGruppenKommunikationsFenster
} from './adventure-land-gruppen-lebensnachweis-austausch.js';
import {
  AdventureLandGruppenZielLiveSmoke,
  installiereAdventureLandGruppenZielLiveSmoke,
  type AdventureLandGruppenZielLiveSmokeErwartung,
  type AdventureLandGruppenZielLiveSmokeFassade
} from './adventure-land-gruppen-ziel-live-smoke.js';

export const PRODUKTIONS_BOOTSTRAP_VERSION = '1.1.2';
export const PRODUKTIONS_GRUPPENZIEL_VORBEREITEN_TEXT = 'BLOCK8-PRODUKTIONS-GRUPPENZIEL-VORBEREITEN';
export const PRODUKTIONS_LIVE_SMOKE_INSTALLIEREN_TEXT = 'BLOCK8-PRODUKTIONS-LIVE-SMOKE-INSTALLIEREN';
const MINDESTENS_AKTIVE_GRUPPEN_TEILNEHMER = 2;
export const PRODUKTIONS_GRUPPEN_LEBENSNACHWEIS_MAXIMAL_ALTER_MILLIS = 8_000;

export interface AdventureLandProduktionsBootstrapOptionen {
  readonly aktivFreigegeben?: boolean;
  readonly ablaufKennung: string;
  readonly vertrauensNamen: readonly string[];
  readonly faehigkeiten: GruppenFaehigkeitsProfil;
}

export interface AdventureLandProduktionsBootstrapStatus {
  readonly schemaVersion: 1;
  readonly version: typeof PRODUKTIONS_BOOTSTRAP_VERSION;
  readonly aktivFreigegeben: boolean;
  readonly empfangInstalliert: boolean;
  readonly gruppenLebensnachweisMaximalAlterMillisekunden: typeof PRODUKTIONS_GRUPPEN_LEBENSNACHWEIS_MAXIMAL_ALTER_MILLIS;
  readonly bekannteTeilnehmer: readonly string[];
  readonly laufendeGruppenAnfragen: readonly string[];
  readonly ressourcenSperren: readonly Readonly<{ ressource: string; besitzer: string }>[];
  readonly liveSmokeInstalliert: boolean;
  readonly gruppenZielVorbereitungVerbraucht: boolean;
  readonly gestoppt: boolean;
}

export interface AdventureLandProduktionsGruppenDiagnose {
  readonly schemaVersion: 1;
  readonly zeitpunkt: number;
  readonly lokalerLebensnachweis: GruppenTeilnehmerMeldung;
  readonly koordination: GruppenKoordinationsEntscheidung;
  readonly laufendeGruppenAnfragen: readonly string[];
  readonly ressourcenSperren: readonly Readonly<{ ressource: string; besitzer: string }>[];
  readonly liveSmokeInstalliert: boolean;
  readonly gruppenZielVorbereitungVerbraucht: boolean;
}

interface GespeicherterTeilnehmerLebensnachweis {
  readonly meldung: GruppenTeilnehmerMeldung;
  readonly frischeReferenzAm: number;
}

export interface AdventureLandGruppenZielVorbereitung {
  readonly schemaVersion: 1;
  readonly zeitpunkt: number;
  readonly lokalerTeilnehmerKennung: string;
  readonly koordinationsBetriebsArt: string;
  readonly gemeinsamesZielKennung: string | null;
  readonly planStatus: string;
  readonly uebersetzungsStatus: string;
  readonly steuerungsStatus: string;
  readonly gestarteteAktionsKennung: string | null;
  readonly gestarteterAktionsName: string | null;
}

function pruefeZeitpunkt(name: string, wert: number): void {
  if (!Number.isFinite(wert) || wert < 0) throw new Error(`${name} muss eine endliche, nichtnegative Zahl sein.`);
}

function pruefeNichtLeer(name: string, wert: string): void {
  if (wert.trim().length === 0) throw new Error(`${name} darf nicht leer sein.`);
}

function eigenerWert(ziel: object, name: string): unknown {
  try {
    return Object.prototype.hasOwnProperty.call(ziel, name) ? Reflect.get(ziel, name) : undefined;
  } catch {
    return undefined;
  }
}

export class AdventureLandProduktionsBootstrap {
  private readonly aktivFreigegeben: boolean;
  private readonly leser: AdventureLandLesezugriff;
  private readonly steuerung = new AktionsSteuerung();
  private readonly austausch: AdventureLandGruppenLebensnachweisAustausch;
  private readonly teilnehmerNachName = new Map<string, Readonly<GespeicherterTeilnehmerLebensnachweis>>();
  private readonly kampfKonfiguration = erstelleKampfSicherheitsKonfiguration();
  private readonly gruppenKoordinationsKonfiguration = erstelleGruppenKoordinationsKonfiguration({
    lebensnachweisMaximalAlterMillisekunden: PRODUKTIONS_GRUPPEN_LEBENSNACHWEIS_MAXIMAL_ALTER_MILLIS
  });
  private laufendeNummer = 0;
  private letzterSicherheitsZeitpunkt: number | null = null;
  private gruppenZielVorbereitungVerbraucht = false;
  private gestoppt = false;
  private kampfAblauf: Readonly<KampfSicherheitsAblaufZustand> | null = null;
  private empfangInstalliert = false;
  private smokeFassade: Readonly<AdventureLandGruppenZielLiveSmokeFassade> | null = null;

  public constructor(
    private readonly codeKontext: AdventureLandGruppenKommunikationsFenster & object,
    private readonly spielFenster: object,
    private readonly zeitQuelle: () => number,
    private readonly optionen: Readonly<AdventureLandProduktionsBootstrapOptionen>
  ) {
    this.aktivFreigegeben = optionen.aktivFreigegeben === true;
    pruefeNichtLeer('ablaufKennung', optionen.ablaufKennung);
    this.leser = new AdventureLandLesezugriff(spielFenster);
    this.austausch = new AdventureLandGruppenLebensnachweisAustausch(codeKontext, {
      aktivFreigegeben: this.aktivFreigegeben,
      vertrauensNamen: optionen.vertrauensNamen,
      jetzt: zeitQuelle
    });
  }

  public status(): Readonly<AdventureLandProduktionsBootstrapStatus> {
    return Object.freeze({
      schemaVersion: 1,
      version: PRODUKTIONS_BOOTSTRAP_VERSION,
      aktivFreigegeben: this.aktivFreigegeben,
      empfangInstalliert: this.empfangInstalliert,
      gruppenLebensnachweisMaximalAlterMillisekunden: PRODUKTIONS_GRUPPEN_LEBENSNACHWEIS_MAXIMAL_ALTER_MILLIS,
      bekannteTeilnehmer: Object.freeze(
        [...this.teilnehmerNachName.values()].map((eintrag) => eintrag.meldung.charakterKennung).sort()
      ),
      laufendeGruppenAnfragen: Object.freeze(
        this.steuerung.listeAktionsZustaende()
          .filter((zustand) => zustand.phase === 'laeuft' && zustand.anfrage.angefordertVon === 'gruppen-aktionsplanung')
          .map((zustand) => zustand.anfrage.kennung)
          .sort()
      ),
      ressourcenSperren: Object.freeze(
        this.steuerung.listeRessourcenSperren()
          .map((sperre) => Object.freeze({ ressource: sperre.ressource, besitzer: sperre.besitzer }))
      ),
      liveSmokeInstalliert: this.smokeFassade !== null,
      gruppenZielVorbereitungVerbraucht: this.gruppenZielVorbereitungVerbraucht,
      gestoppt: this.gestoppt
    });
  }

  public installiereLebensnachweisEmpfang(): boolean {
    if (this.gestoppt) throw new Error('Produktions-Bootstrap wurde bereits gestoppt; Lebensnachweis-Empfang bleibt deaktiviert.');
    if (this.empfangInstalliert) return false;
    const installiert = this.austausch.installiereEmpfang((empfang) => this.uebernehmeEmpfang(empfang));
    this.empfangInstalliert = installiert;
    return installiert;
  }

  public entferneLebensnachweisEmpfang(): boolean {
    if (!this.empfangInstalliert) return false;
    const entfernt = this.austausch.entferneEmpfang();
    if (entfernt) this.empfangInstalliert = false;
    return entfernt;
  }

  public async sendeLokalenLebensnachweis(): Promise<Readonly<{
    meldung: GruppenTeilnehmerMeldung;
    ergebnisse: readonly Readonly<{ zielName: string; gesendet: boolean; grund: string }>[];
  }>> {
    this.pruefeAktiv('Lebensnachweis senden');
    const { meldung } = this.erzeugeLokalenLebensnachweis();
    this.teilnehmerNachName.set(meldung.charakterName, Object.freeze({
      meldung,
      frischeReferenzAm: meldung.gesendetAm
    }));

    const ziele = [...new Set(this.optionen.vertrauensNamen.map((name) => name.trim()).filter((name) => name.length > 0 && name !== meldung.charakterName))].sort();
    const ergebnisse = [];
    for (const zielName of ziele) {
      ergebnisse.push(await this.austausch.sendeLebensnachweis(zielName, meldung));
    }
    return Object.freeze({ meldung, ergebnisse: Object.freeze(ergebnisse) });
  }

  public pruefeGruppenZustand(): Readonly<AdventureLandProduktionsGruppenDiagnose> {
    if (this.gestoppt) {
      throw new Error('Produktions-Bootstrap wurde bereits gestoppt; Gruppen-Diagnose ist nicht mehr verfuegbar.');
    }

    const jetzt = this.liesZeitpunkt('Der Produktions-Gruppendiagnosezeitpunkt');
    const { meldung } = this.erzeugeLokalenLebensnachweis(jetzt);

    const gespeicherteMeldungen = this.liesEindeutigeTeilnehmerMeldungen()
      .filter((eintrag) => eintrag.charakterName !== meldung.charakterName);
    const meldungen = Object.freeze([...gespeicherteMeldungen, meldung]);
    const koordination = koordiniereGruppe(
      meldungen,
      meldung.charakterKennung,
      jetzt,
      this.gruppenKoordinationsKonfiguration
    );
    const status = this.status();

    return Object.freeze({
      schemaVersion: 1,
      zeitpunkt: jetzt,
      lokalerLebensnachweis: meldung,
      koordination,
      laufendeGruppenAnfragen: status.laufendeGruppenAnfragen,
      ressourcenSperren: status.ressourcenSperren,
      liveSmokeInstalliert: status.liveSmokeInstalliert,
      gruppenZielVorbereitungVerbraucht: status.gruppenZielVorbereitungVerbraucht
    });
  }

  public bereiteGruppenZielVor(freigabeText: string): Readonly<AdventureLandGruppenZielVorbereitung> {
    this.pruefeAktiv('Gruppenziel vorbereiten');
    if (freigabeText !== PRODUKTIONS_GRUPPENZIEL_VORBEREITEN_TEXT) {
      throw new Error(`Falscher Produktions-Gruppenziel-Freigabetext. Erwartet wird exakt: ${PRODUKTIONS_GRUPPENZIEL_VORBEREITEN_TEXT}`);
    }

    if (this.gruppenZielVorbereitungVerbraucht) {
      throw new Error('Die one-shot Produktions-Gruppenziel-Vorbereitung wurde bereits verbraucht.');
    }
    this.gruppenZielVorbereitungVerbraucht = true;

    const jetzt = this.liesZeitpunkt('Der Produktions-Gruppenplanzeitpunkt');
    const { meldung } = this.erzeugeLokalenLebensnachweis(jetzt);
    this.teilnehmerNachName.set(meldung.charakterName, Object.freeze({
      meldung,
      frischeReferenzAm: meldung.gesendetAm
    }));

    const meldungen = this.liesEindeutigeTeilnehmerMeldungen();
    const koordination = koordiniereGruppe(
      meldungen,
      meldung.charakterKennung,
      jetzt,
      this.gruppenKoordinationsKonfiguration
    );
    if (koordination.aktiveTeilnehmerKennungen.length < MINDESTENS_AKTIVE_GRUPPEN_TEILNEHMER) {
      throw new Error(
        `Produktions-Gruppenziel benoetigt mindestens ${MINDESTENS_AKTIVE_GRUPPEN_TEILNEHMER} aktive frische Teilnehmer; gefunden: ${koordination.aktiveTeilnehmerKennungen.length}.`
      );
    }
    const plan = planeGruppenAktionen(meldungen, koordination, erstelleGruppenAktionsPlanKonfiguration());
    const uebersetzung = uebersetzeEigeneGruppenPlanSchritte(
      plan,
      meldung.charakterKennung,
      erstelleGruppenAktionsAnfrageKonfiguration({
        aktiviert: true,
        freigegebeneArten: ['gemeinsames_ziel_bearbeiten']
      })
    );
    const steuerungsErgebnis = uebergibGruppenAktionsAnfragenAnSteuerung(
      uebersetzung,
      this.steuerung,
      jetzt,
      erstelleGruppenAktionsSteuerungKonfiguration({
        aktiviert: true,
        freigegebeneAktionen: [GRUPPEN_AKTIONS_NAMEN.gemeinsamesZielBearbeiten],
        verarbeiten: true
      })
    );

    return Object.freeze({
      schemaVersion: 1,
      zeitpunkt: jetzt,
      lokalerTeilnehmerKennung: meldung.charakterKennung,
      koordinationsBetriebsArt: koordination.betriebsArt,
      gemeinsamesZielKennung: koordination.gemeinsamesZielKennung,
      planStatus: plan.status,
      uebersetzungsStatus: uebersetzung.status,
      steuerungsStatus: steuerungsErgebnis.status,
      gestarteteAktionsKennung: steuerungsErgebnis.verarbeitung?.gestarteteAnfrage?.kennung ?? null,
      gestarteterAktionsName: steuerungsErgebnis.verarbeitung?.gestarteteAnfrage?.aktion ?? null
    });
  }

  public installiereGruppenZielLiveSmoke(
    erwartung: Readonly<AdventureLandGruppenZielLiveSmokeErwartung>,
    freigabeText: string
  ): Readonly<AdventureLandGruppenZielLiveSmokeFassade> {
    this.pruefeAktiv('Live-Smoke installieren');
    if (freigabeText !== PRODUKTIONS_LIVE_SMOKE_INSTALLIEREN_TEXT) {
      throw new Error(`Falscher Produktions-Live-Smoke-Installationsfreigabetext. Erwartet wird exakt: ${PRODUKTIONS_LIVE_SMOKE_INSTALLIEREN_TEXT}`);
    }
    if (this.smokeFassade !== null) throw new Error('Die Produktions-Live-Smoke-Fassade ist bereits installiert.');
    const laufendeZiele = this.steuerung.listeAktionsZustaende().filter((zustand) =>
      zustand.phase === 'laeuft' &&
      zustand.anfrage.angefordertVon === 'gruppen-aktionsplanung' &&
      zustand.anfrage.aktion === GRUPPEN_AKTIONS_NAMEN.gemeinsamesZielBearbeiten
    );
    if (laufendeZiele.length !== 1) {
      throw new Error(`Live-Smoke-Installation benoetigt genau eine laufende zentrale Gruppenzielanfrage; gefunden: ${laufendeZiele.length}.`);
    }
    const laufendeDetails = laufendeZiele[0]?.anfrage.details;
    if (
      typeof laufendeDetails !== 'object' ||
      laufendeDetails === null ||
      !('zielKennung' in laufendeDetails) ||
      laufendeDetails.zielKennung !== erwartung.zielKennung
    ) {
      throw new Error('Die laufende zentrale Gruppenzielanfrage passt nicht zur erwarteten Live-Smoke-Zielkennung.');
    }

    const smoke = new AdventureLandGruppenZielLiveSmoke(
      this.codeKontext,
      this.spielFenster,
      this.steuerung,
      () => this.liesAktuelleSicherheitsEntscheidung(),
      this.zeitQuelle,
      erwartung,
      { aktivFreigegeben: true }
    );
    const fassade = installiereAdventureLandGruppenZielLiveSmoke(this.codeKontext, smoke);
    this.smokeFassade = fassade;
    return fassade;
  }

  public stoppe(): Readonly<AdventureLandProduktionsBootstrapStatus> {
    if (this.gestoppt) return this.status();
    this.gestoppt = true;
    if (this.smokeFassade !== null) {
      try { this.smokeFassade.sperren(); } catch { /* Fail-safe: zentrale Arbeit wird unten beendet. */ }
      const aktuellerSmoke = eigenerWert(this.codeKontext, 'V4Block8GruppenZielLiveSmoke');
      if (aktuellerSmoke === this.smokeFassade) {
        try { Reflect.deleteProperty(this.codeKontext, 'V4Block8GruppenZielLiveSmoke'); } catch { /* Status bleibt beobachtbar. */ }
      }
      this.smokeFassade = null;
    }
    this.entferneLebensnachweisEmpfang();
    const jetzt = this.liesZeitpunkt('Der Produktions-Bootstrap-Stoppzeitpunkt');
    for (const zustand of this.steuerung.listeAktionsZustaende()) {
      if (!['wartend', 'blockiert', 'laeuft'].includes(zustand.phase)) continue;
      if (zustand.anfrage.angefordertVon !== 'gruppen-aktionsplanung') continue;
      this.steuerung.brecheAktionAb(
        zustand.anfrage.kennung,
        jetzt,
        'Produktions-Bootstrap wurde gestoppt; Gruppenarbeit wird fail-safe beendet.'
      );
    }
    return this.status();
  }

  public holeZentraleAktionsSteuerung(): AktionsSteuerung {
    return this.steuerung;
  }

  private uebernehmeEmpfang(empfang: Readonly<GruppenLebensnachweisEmpfang>): void {
    if (this.gestoppt) return;
    const neu = empfang.meldung;
    const vorher = this.teilnehmerNachName.get(neu.charakterName)?.meldung;
    if (
      vorher !== undefined &&
      (
        neu.gesendetAm < vorher.gesendetAm ||
        (neu.gesendetAm === vorher.gesendetAm && neu.laufendeNummer <= vorher.laufendeNummer)
      )
    ) {
      return;
    }
    this.teilnehmerNachName.set(neu.charakterName, Object.freeze({
      meldung: neu,
      frischeReferenzAm: empfang.empfangenAm
    }));
  }

  private liesEindeutigeTeilnehmerMeldungen(): readonly GruppenTeilnehmerMeldung[] {
    const gespeicherte = [...this.teilnehmerNachName.values()];
    const nameNachKennung = new Map<string, string>();
    for (const eintrag of gespeicherte) {
      const meldung = eintrag.meldung;
      const vorherigerName = nameNachKennung.get(meldung.charakterKennung);
      if (vorherigerName !== undefined && vorherigerName !== meldung.charakterName) {
        throw new Error(
          `Doppelte Gruppen-Teilnehmerkennung ${meldung.charakterKennung} fuer ${vorherigerName} und ${meldung.charakterName}; Gruppenplanung bleibt blockiert.`
        );
      }
      nameNachKennung.set(meldung.charakterKennung, meldung.charakterName);
    }

    return Object.freeze(gespeicherte.map((eintrag) => Object.freeze({
      ...eintrag.meldung,
      // In der Produktionskoordination misst Freshness ab lokalem Empfang.
      // Der originale Senderzeitpunkt bleibt separat im Speicher fuer Replay-/Reihenfolgepruefung erhalten.
      gesendetAm: eintrag.frischeReferenzAm
    })));
  }

  private erzeugeLokalenLebensnachweis(jetzt = this.liesZeitpunkt('Der lokale Lebensnachweiszeitpunkt')): Readonly<{
    meldung: GruppenTeilnehmerMeldung;
    sicherheit: Readonly<KampfSicherheitsEntscheidung>;
  }> {
    const sicherheit = this.berechneSicherheit(jetzt);
    const zustand = sicherheit.spielzustand;
    const ergebnis = erstelleGruppenTeilnehmerMeldungAusKampfsicherheit(zustand, {
      sicherheitsEntscheidung: sicherheit.entscheidung,
      faehigkeiten: this.optionen.faehigkeiten
    });
    if (ergebnis.status !== 'bereit' || ergebnis.meldung === null) {
      throw new Error(`Lokaler Produktions-Lebensnachweis ist blockiert: ${ergebnis.gruende.join(' ')}`);
    }
    return Object.freeze({ meldung: ergebnis.meldung, sicherheit: sicherheit.entscheidung });
  }

  private liesAktuelleSicherheitsEntscheidung(): Readonly<KampfSicherheitsEntscheidung> {
    return this.berechneSicherheit(this.liesZeitpunkt('Der Produktions-Sicherheitszeitpunkt')).entscheidung;
  }

  private berechneSicherheit(jetzt: number): Readonly<{
    spielzustand: ReturnType<typeof beobachteSpielzustand>;
    entscheidung: Readonly<KampfSicherheitsEntscheidung>;
  }> {
    if (this.letzterSicherheitsZeitpunkt !== null && jetzt < this.letzterSicherheitsZeitpunkt) {
      throw new Error('Produktions-Sicherheitszeit darf nicht rueckwaerts laufen.');
    }
    this.letzterSicherheitsZeitpunkt = jetzt;
    this.laufendeNummer += 1;
    const spielzustand = beobachteSpielzustand(this.leser, {
      laufendeNummer: this.laufendeNummer,
      aufgenommenAm: jetzt,
      ablaufKennung: this.optionen.ablaufKennung
    });
    const vorher = this.kampfAblauf ?? erstelleKampfSicherheitsAblaufZustand(spielzustand, jetzt);
    const entscheidung = planeKampfSicherheitsSchritt(spielzustand, this.kampfKonfiguration, vorher, jetzt);
    this.kampfAblauf = entscheidung.naechsterAblaufZustand;
    return Object.freeze({ spielzustand, entscheidung });
  }

  private pruefeAktiv(aktion: string): void {
    if (this.gestoppt) {
      throw new Error(`Produktions-Bootstrap wurde bereits gestoppt; ${aktion} bleibt gesperrt.`);
    }
    if (!this.aktivFreigegeben) {
      throw new Error(`Produktions-Bootstrap ist standardmaessig gesperrt; ${aktion} ist nicht freigegeben.`);
    }
  }

  private liesZeitpunkt(name: string): number {
    const jetzt = this.zeitQuelle();
    pruefeZeitpunkt(name, jetzt);
    return jetzt;
  }
}
