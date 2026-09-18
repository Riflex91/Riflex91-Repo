import type { GruppenFaehigkeitsProfil } from '../vertraege/gruppen-koordination.js';
import { SichereBasisBedienung } from '../kern/sichere-basis-bedienung.js';
import type {
  BasisBedienAktion,
  BasisBedienAnfrage,
  BasisBedienErgebnis
} from '../vertraege/laufzeit-steuerung.js';
import type { AdventureLandGruppenZielLiveSmokeErwartung } from './adventure-land-gruppen-ziel-live-smoke.js';
import {
  AdventureLandProduktionsBootstrap,
  PRODUKTIONS_BOOTSTRAP_VERSION,
  PRODUKTIONS_GRUPPENZIEL_VORBEREITEN_TEXT,
  PRODUKTIONS_LIVE_SMOKE_INSTALLIEREN_TEXT
} from './adventure-land-produktions-bootstrap.js';

export const PRODUKTIONS_LAUFZEIT_GLOBALER_NAME = 'V4ProduktionsLaufzeit';
export const PRODUKTIONS_LAUFZEIT_VERSION = '1.1.5';
export const PRODUKTIONS_LEBENSNACHWEIS_INTERVALL_MILLIS = 2_000;

export interface AdventureLandProduktionsLaufzeitKonfiguration {
  readonly aktivFreigegeben?: boolean;
  readonly ablaufKennung?: string;
  readonly vertrauensNamen?: readonly string[];
  readonly faehigkeiten?: GruppenFaehigkeitsProfil;
  readonly lebensnachweisIntervallMillisekunden?: number;
}

export interface AdventureLandProduktionsBasisBedienDaten {
  readonly vorgangsKennung: string;
  readonly aktion: BasisBedienAktion;
  readonly erwarteteLaufzeitGeneration?: number;
  readonly ausdruecklichBestaetigt?: boolean;
}

export type AdventureLandProduktionsLaufzeitStatus = Readonly<
  ReturnType<AdventureLandProduktionsBootstrap['status']> & {
    readonly lebensnachweisAutomatikAktiv: boolean;
    readonly lebensnachweisAutomatikPausiert: boolean;
    readonly lebensnachweisIntervallMillisekunden: number;
    readonly lebensnachweisSendeVersuche: number;
    readonly lebensnachweisSendeErfolge: number;
    readonly lebensnachweisSendeFehler: number;
    readonly lebensnachweisSendeOffen: number;
    readonly lebensnachweisSendeMaxOffen: number;
    readonly lebensnachweisLetzterErfolgAm: number | null;
    readonly lebensnachweisLetzterFehler: string | null;
    readonly performanceTrickErforderlich: boolean;
    readonly performanceTrickVerfuegbar: boolean;
    readonly performanceTrickAufgerufen: boolean;
    readonly performanceTrickAufrufe: number;
    readonly performanceTrickLetzterFehler: string | null;
  }
>;

export interface AdventureLandProduktionsLaufzeitApi {
  readonly version: typeof PRODUKTIONS_LAUFZEIT_VERSION;
  readonly bootstrapVersion: typeof PRODUKTIONS_BOOTSTRAP_VERSION;
  readonly status: () => AdventureLandProduktionsLaufzeitStatus;
  readonly starte: () => AdventureLandProduktionsLaufzeitStatus;
  readonly sendeLebensnachweis: () => ReturnType<AdventureLandProduktionsBootstrap['sendeLokalenLebensnachweis']>;
  readonly pausiereLebensnachweisAutomatik: () => AdventureLandProduktionsLaufzeitStatus;
  readonly setzeLebensnachweisAutomatikFort: () => AdventureLandProduktionsLaufzeitStatus;
  readonly pruefeGruppenZustand: () => ReturnType<AdventureLandProduktionsBootstrap['pruefeGruppenZustand']>;
  readonly basisBedienStatus: () => ReturnType<SichereBasisBedienung<AdventureLandProduktionsLaufzeitStatus>['status']>;
  readonly erstelleBasisBedienAnfrage: (
    daten: Readonly<AdventureLandProduktionsBasisBedienDaten>
  ) => Readonly<BasisBedienAnfrage>;
  readonly fuehreBasisBedienAnfrage: (
    anfrage: Readonly<BasisBedienAnfrage>
  ) => Readonly<BasisBedienErgebnis<AdventureLandProduktionsLaufzeitStatus>>;
  readonly bereiteGruppenZielVor: (freigabeText: string) => ReturnType<AdventureLandProduktionsBootstrap['bereiteGruppenZielVor']>;
  readonly installiereGruppenZielLiveSmoke: (
    erwartung: Readonly<AdventureLandGruppenZielLiveSmokeErwartung>,
    freigabeText: string
  ) => ReturnType<AdventureLandProduktionsBootstrap['installiereGruppenZielLiveSmoke']>;
  readonly stoppe: () => ReturnType<AdventureLandProduktionsBootstrap['stoppe']>;
  readonly gruppenzielFreigabeText: () => typeof PRODUKTIONS_GRUPPENZIEL_VORBEREITEN_TEXT;
  readonly liveSmokeInstallationsText: () => typeof PRODUKTIONS_LIVE_SMOKE_INSTALLIEREN_TEXT;
}

function istObjekt(wert: unknown): wert is Readonly<Record<string, unknown>> {
  return typeof wert === 'object' && wert !== null;
}

function holeSpielFenster(codeKontext: object): object {
  try {
    const parent = Reflect.get(codeKontext, 'parent');
    if (istObjekt(parent) && parent !== codeKontext && 'character' in parent) return parent;
  } catch {
    // Lokaler Kontext bleibt Fallback.
  }
  return codeKontext;
}

function normalisiereFaehigkeiten(
  wert: GruppenFaehigkeitsProfil | undefined,
  aktiv: boolean
): GruppenFaehigkeitsProfil {
  if (wert === undefined) {
    if (aktiv) throw new Error('Aktive V4-Produktionslaufzeit benoetigt ein explizites Gruppenfaehigkeitsprofil.');
    return Object.freeze({ heilen: 0, schaden: 0, aggro: 0, schutz: 0, unterstuetzung: 0 });
  }
  return Object.freeze({ ...wert });
}

function normalisiereKonfiguration(
  konfiguration: Readonly<AdventureLandProduktionsLaufzeitKonfiguration>
): Readonly<Required<AdventureLandProduktionsLaufzeitKonfiguration>> {
  const aktivFreigegeben = konfiguration.aktivFreigegeben === true;
  const ablaufKennung = konfiguration.ablaufKennung?.trim() || 'v4-produktionslaufzeit';
  const vertrauensNamen = Object.freeze(
    [...new Set((konfiguration.vertrauensNamen ?? []).map((name) => name.trim()).filter((name) => name.length > 0))].sort()
  );
  const faehigkeiten = normalisiereFaehigkeiten(konfiguration.faehigkeiten, aktivFreigegeben);
  const lebensnachweisIntervallMillisekunden = Number(
    konfiguration.lebensnachweisIntervallMillisekunden ?? PRODUKTIONS_LEBENSNACHWEIS_INTERVALL_MILLIS
  );
  if (
    !Number.isFinite(lebensnachweisIntervallMillisekunden) ||
    lebensnachweisIntervallMillisekunden < 500 ||
    lebensnachweisIntervallMillisekunden > 10_000
  ) {
    throw new Error('lebensnachweisIntervallMillisekunden muss zwischen 500 und 10000 liegen.');
  }
  return Object.freeze({
    aktivFreigegeben,
    ablaufKennung,
    vertrauensNamen,
    faehigkeiten,
    lebensnachweisIntervallMillisekunden
  });
}

function eigenerWert(ziel: object, name: string): unknown {
  try {
    return Object.prototype.hasOwnProperty.call(ziel, name) ? Reflect.get(ziel, name) : undefined;
  } catch {
    return undefined;
  }
}

export function installiereAdventureLandProduktionsLaufzeit(
  codeKontext: object,
  konfiguration: Readonly<AdventureLandProduktionsLaufzeitKonfiguration> = {}
): Readonly<AdventureLandProduktionsLaufzeitApi> {
  if (eigenerWert(codeKontext, PRODUKTIONS_LAUFZEIT_GLOBALER_NAME) !== undefined) {
    throw new Error(`${PRODUKTIONS_LAUFZEIT_GLOBALER_NAME} ist im Codekontext bereits vorhanden.`);
  }

  const cfg = normalisiereKonfiguration(konfiguration);
  const spielFenster = holeSpielFenster(codeKontext);
  const bootstrap = new AdventureLandProduktionsBootstrap(
    codeKontext,
    spielFenster,
    () => Date.now(),
    cfg
  );
  let basisBedienung: SichereBasisBedienung<AdventureLandProduktionsLaufzeitStatus>;

  const performanceTrickErforderlich =
    Reflect.get(spielFenster, 'is_tauri') !== true &&
    Reflect.get(spielFenster, 'is_electron') !== true;
  const performanceTrickVerfuegbar = typeof Reflect.get(codeKontext, 'performance_trick') === 'function';

  let performanceTrickAufgerufen = false;
  let performanceTrickAufrufe = 0;
  let performanceTrickLetzterFehler: string | null = null;
  let lebensnachweisTimer: unknown = null;
  let lebensnachweisAutomatikPausiert = false;
  let lebensnachweisSendeVersuche = 0;
  let lebensnachweisSendeErfolge = 0;
  let lebensnachweisSendeFehler = 0;
  let lebensnachweisSendeOffen = 0;
  let lebensnachweisSendeMaxOffen = 0;
  let lebensnachweisLetzterErfolgAm: number | null = null;
  let lebensnachweisLetzterFehler: string | null = null;

  function runtimeStatus(): AdventureLandProduktionsLaufzeitStatus {
    return Object.freeze({
      ...bootstrap.status(),
      lebensnachweisAutomatikAktiv: lebensnachweisTimer !== null,
      lebensnachweisAutomatikPausiert,
      lebensnachweisIntervallMillisekunden: cfg.lebensnachweisIntervallMillisekunden,
      lebensnachweisSendeVersuche,
      lebensnachweisSendeErfolge,
      lebensnachweisSendeFehler,
      lebensnachweisSendeOffen,
      lebensnachweisSendeMaxOffen,
      lebensnachweisLetzterErfolgAm,
      lebensnachweisLetzterFehler,
      performanceTrickErforderlich,
      performanceTrickVerfuegbar,
      performanceTrickAufgerufen,
      performanceTrickAufrufe,
      performanceTrickLetzterFehler
    });
  }

  function aktivierePerformanceTrick(): void {
    if (!cfg.aktivFreigegeben || !performanceTrickErforderlich || performanceTrickAufgerufen) return;
    if (!performanceTrickVerfuegbar) {
      performanceTrickLetzterFehler = 'Adventure-Land-Codekontext stellt performance_trick nicht bereit.';
      throw new Error(
        'Aktive V4-Produktionslaufzeit im Browser benoetigt Adventure Lands performance_trick(), damit Hintergrund-Tabs nicht gedrosselt werden.'
      );
    }

    const funktion = Reflect.get(codeKontext, 'performance_trick');
    try {
      performanceTrickAufrufe += 1;
      Reflect.apply(funktion as (...argumente: unknown[]) => unknown, codeKontext, []);
      performanceTrickAufgerufen = true;
      performanceTrickLetzterFehler = null;
    } catch (fehler) {
      performanceTrickLetzterFehler = fehler instanceof Error ? fehler.message : String(fehler);
      throw new Error(`Adventure Lands performance_trick() konnte nicht aktiviert werden: ${performanceTrickLetzterFehler}`);
    }
  }

  function timerFunktion(name: 'setInterval' | 'clearInterval'): (...argumente: unknown[]) => unknown {
    const funktion = Reflect.get(codeKontext, name);
    if (typeof funktion !== 'function') {
      throw new Error(`Adventure-Land-Codekontext stellt ${name} nicht bereit.`);
    }
    return funktion as (...argumente: unknown[]) => unknown;
  }

  function stoppeLebensnachweisTimer(): void {
    if (lebensnachweisTimer === null) return;
    Reflect.apply(timerFunktion('clearInterval'), codeKontext, [lebensnachweisTimer]);
    lebensnachweisTimer = null;
  }

  function sendeAutomatischenLebensnachweis(): void {
    if (!cfg.aktivFreigegeben || lebensnachweisAutomatikPausiert || bootstrap.status().gestoppt) return;

    lebensnachweisSendeVersuche += 1;
    lebensnachweisSendeOffen += 1;
    lebensnachweisSendeMaxOffen = Math.max(lebensnachweisSendeMaxOffen, lebensnachweisSendeOffen);

    void Promise.resolve(bootstrap.sendeLokalenLebensnachweis()).then((ergebnis) => {
      lebensnachweisSendeOffen = Math.max(0, lebensnachweisSendeOffen - 1);
      const bestaetigt =
        ergebnis.ergebnisse.length > 0 &&
        ergebnis.ergebnisse.every((eintrag) => eintrag.gesendet === true);
      if (!bestaetigt) {
        lebensnachweisSendeFehler += 1;
        lebensnachweisLetzterFehler = 'Mindestens ein Lebensnachweisziel wurde von send_cm nicht als Empfaenger bestaetigt.';
        return;
      }
      lebensnachweisSendeErfolge += 1;
      lebensnachweisLetzterErfolgAm = Date.now();
      lebensnachweisLetzterFehler = null;
    }, (fehler) => {
      lebensnachweisSendeOffen = Math.max(0, lebensnachweisSendeOffen - 1);
      lebensnachweisSendeFehler += 1;
      lebensnachweisLetzterFehler = fehler instanceof Error ? fehler.message : String(fehler);
    });
  }

  function starteLebensnachweisTimer(): void {
    if (!cfg.aktivFreigegeben || lebensnachweisAutomatikPausiert || lebensnachweisTimer !== null) return;
    const setIntervalFn = timerFunktion('setInterval');
    lebensnachweisTimer = Reflect.apply(setIntervalFn, codeKontext, [
      () => sendeAutomatischenLebensnachweis(),
      cfg.lebensnachweisIntervallMillisekunden
    ]);
    sendeAutomatischenLebensnachweis();
  }

  function pruefeBasisBedienMutation(aktion: BasisBedienAktion): void {
    if (aktion === 'diagnose_aktualisieren') return;
    if (bootstrap.status().gestoppt) {
      throw new Error('Produktionslaufzeit wurde bereits gestoppt; veraendernde Basisbedienung bleibt gesperrt.');
    }
    if (!cfg.aktivFreigegeben) {
      throw new Error('Produktionslaufzeit ist standardmaessig gesperrt; veraendernde Basisbedienung ist nicht freigegeben.');
    }
  }

  basisBedienung = new SichereBasisBedienung<AdventureLandProduktionsLaufzeitStatus>({
    laufzeitSteuerung: bootstrap.holeLaufzeitSteuerung(),
    aktionsSteuerung: bootstrap.holeZentraleAktionsSteuerung(),
    diagnoseLieferant: () => runtimeStatus()
  });

  const api: Readonly<AdventureLandProduktionsLaufzeitApi> = Object.freeze({
    version: PRODUKTIONS_LAUFZEIT_VERSION,
    bootstrapVersion: PRODUKTIONS_BOOTSTRAP_VERSION,
    status: () => runtimeStatus(),
    starte: () => {
      aktivierePerformanceTrick();
      bootstrap.installiereLebensnachweisEmpfang();
      starteLebensnachweisTimer();
      return runtimeStatus();
    },
    sendeLebensnachweis: () => bootstrap.sendeLokalenLebensnachweis(),
    pausiereLebensnachweisAutomatik: () => {
      if (!cfg.aktivFreigegeben) throw new Error('Gesperrte Produktionslaufzeit besitzt keine aktive Lebensnachweis-Automatik.');
      stoppeLebensnachweisTimer();
      lebensnachweisAutomatikPausiert = true;
      return runtimeStatus();
    },
    setzeLebensnachweisAutomatikFort: () => {
      if (!cfg.aktivFreigegeben) throw new Error('Gesperrte Produktionslaufzeit besitzt keine aktive Lebensnachweis-Automatik.');
      lebensnachweisAutomatikPausiert = false;
      starteLebensnachweisTimer();
      return runtimeStatus();
    },
    pruefeGruppenZustand: () => bootstrap.pruefeGruppenZustand(),
    basisBedienStatus: () => basisBedienung.status(),
    erstelleBasisBedienAnfrage: (daten: Readonly<AdventureLandProduktionsBasisBedienDaten>) => {
      pruefeBasisBedienMutation(daten.aktion);
      return basisBedienung.erstelleAnfrage({
        vorgangsKennung: daten.vorgangsKennung,
        aktion: daten.aktion,
        angefordertAm: Date.now(),
        ...(daten.erwarteteLaufzeitGeneration === undefined
          ? {}
          : { erwarteteLaufzeitGeneration: daten.erwarteteLaufzeitGeneration }),
        ...(daten.ausdruecklichBestaetigt === undefined
          ? {}
          : { ausdruecklichBestaetigt: daten.ausdruecklichBestaetigt })
      });
    },
    fuehreBasisBedienAnfrage: (anfrage: Readonly<BasisBedienAnfrage>) => {
      pruefeBasisBedienMutation(anfrage.basisAktion);
      return basisBedienung.fuehreAus(anfrage);
    },
    bereiteGruppenZielVor: (freigabeText: string) => bootstrap.bereiteGruppenZielVor(freigabeText),
    installiereGruppenZielLiveSmoke: (
      erwartung: Readonly<AdventureLandGruppenZielLiveSmokeErwartung>,
      freigabeText: string
    ) => bootstrap.installiereGruppenZielLiveSmoke(erwartung, freigabeText),
    stoppe: () => {
      stoppeLebensnachweisTimer();
      lebensnachweisAutomatikPausiert = false;
      bootstrap.stoppe();
      return runtimeStatus();
    },
    gruppenzielFreigabeText: () => PRODUKTIONS_GRUPPENZIEL_VORBEREITEN_TEXT,
    liveSmokeInstallationsText: () => PRODUKTIONS_LIVE_SMOKE_INSTALLIEREN_TEXT
  });

  const installiert = Reflect.defineProperty(codeKontext, PRODUKTIONS_LAUFZEIT_GLOBALER_NAME, {
    configurable: true,
    enumerable: true,
    writable: false,
    value: api
  });
  if (!installiert) throw new Error('V4ProduktionsLaufzeit konnte nicht im Adventure-Land-Codekontext installiert werden.');
  return api;
}
