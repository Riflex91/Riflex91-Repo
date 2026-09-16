import type { AktionsAnfrage } from './aktions-anfrage.js';
import type { RessourcenSperre } from './ressourcen-sperre.js';

export const AKTIONS_LAUF_PHASEN = [
  'wartend',
  'blockiert',
  'laeuft',
  'abgebrochen',
  'abgeschlossen',
  'abgelaufen'
] as const;

export type AktionsLaufPhase = (typeof AKTIONS_LAUF_PHASEN)[number];

export interface AktionsLaufZustand {
  readonly anfrage: AktionsAnfrage;
  readonly phase: AktionsLaufPhase;
  readonly eingereihtAm: number;
  readonly gestartetAm: number | null;
  readonly beendetAm: number | null;
  readonly zustandsGrund: string;
  readonly blockiertDurch: readonly RessourcenSperre[];
}

export type AktionsSteuerungsSchrittArt = 'gestartet' | 'keine-ausfuehrbare-aktion';

export interface AktionsSteuerungsSchritt {
  readonly art: AktionsSteuerungsSchrittArt;
  readonly zeitpunkt: number;
  readonly gestarteteAnfrage: AktionsAnfrage | null;
  readonly unterbrocheneAnfragen: readonly string[];
  readonly blockierteAnfragen: readonly string[];
}

export const SCHATTEN_AKTIONS_PHASEN = ['laeuft', 'abgeschlossen', 'abgebrochen', 'unterbrochen'] as const;
export type SchattenAktionsPhase = (typeof SCHATTEN_AKTIONS_PHASEN)[number];

export interface SchattenAktionsEintrag {
  readonly laufendeNummer: number;
  readonly aktionsAnfrageKennung: string;
  readonly angefordertVon: string;
  readonly aktion: string;
  readonly wichtigkeit: AktionsAnfrage['wichtigkeit'];
  readonly prioritaet: number;
  readonly grund: string;
  readonly ressourcen: readonly AktionsAnfrage['benoetigteRessourcen'][number][];
  readonly geplantAm: number;
  readonly phase: SchattenAktionsPhase;
  readonly beendetAm: number | null;
  readonly abschlussGrund: string | null;
  readonly details: unknown;
}
