import type { GruppenFaehigkeitsProfil } from '../vertraege/gruppen-koordination.js';
import type { AdventureLandGruppenZielLiveSmokeErwartung } from './adventure-land-gruppen-ziel-live-smoke.js';
import {
  AdventureLandProduktionsBootstrap,
  PRODUKTIONS_BOOTSTRAP_VERSION,
  PRODUKTIONS_GRUPPENZIEL_VORBEREITEN_TEXT,
  PRODUKTIONS_LIVE_SMOKE_INSTALLIEREN_TEXT
} from './adventure-land-produktions-bootstrap.js';

export const PRODUKTIONS_LAUFZEIT_GLOBALER_NAME = 'V4ProduktionsLaufzeit';
export const PRODUKTIONS_LAUFZEIT_VERSION = '1.1.0';

export interface AdventureLandProduktionsLaufzeitKonfiguration {
  readonly aktivFreigegeben?: boolean;
  readonly ablaufKennung?: string;
  readonly vertrauensNamen?: readonly string[];
  readonly faehigkeiten?: GruppenFaehigkeitsProfil;
}

export interface AdventureLandProduktionsLaufzeitApi {
  readonly version: typeof PRODUKTIONS_LAUFZEIT_VERSION;
  readonly bootstrapVersion: typeof PRODUKTIONS_BOOTSTRAP_VERSION;
  readonly status: () => ReturnType<AdventureLandProduktionsBootstrap['status']>;
  readonly starte: () => ReturnType<AdventureLandProduktionsBootstrap['status']>;
  readonly sendeLebensnachweis: () => ReturnType<AdventureLandProduktionsBootstrap['sendeLokalenLebensnachweis']>;
  readonly pruefeGruppenZustand: () => ReturnType<AdventureLandProduktionsBootstrap['pruefeGruppenZustand']>;
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
  return Object.freeze({ aktivFreigegeben, ablaufKennung, vertrauensNamen, faehigkeiten });
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

  const api: Readonly<AdventureLandProduktionsLaufzeitApi> = Object.freeze({
    version: PRODUKTIONS_LAUFZEIT_VERSION,
    bootstrapVersion: PRODUKTIONS_BOOTSTRAP_VERSION,
    status: () => bootstrap.status(),
    starte: () => {
      bootstrap.installiereLebensnachweisEmpfang();
      return bootstrap.status();
    },
    sendeLebensnachweis: () => bootstrap.sendeLokalenLebensnachweis(),
    pruefeGruppenZustand: () => bootstrap.pruefeGruppenZustand(),
    bereiteGruppenZielVor: (freigabeText: string) => bootstrap.bereiteGruppenZielVor(freigabeText),
    installiereGruppenZielLiveSmoke: (
      erwartung: Readonly<AdventureLandGruppenZielLiveSmokeErwartung>,
      freigabeText: string
    ) => bootstrap.installiereGruppenZielLiveSmoke(erwartung, freigabeText),
    stoppe: () => bootstrap.stoppe(),
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
