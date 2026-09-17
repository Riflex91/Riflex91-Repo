import type { AktionsAnfrage } from './aktions-anfrage.js';
import type { FarmAblaufZustand, FarmEntscheidung, FarmKonfiguration } from './farmen.js';
import type { KampfAktionsBereitschaft } from './kampf-aktionsbereitschaft.js';
import type {
  KampfSicherheitsAblaufZustand,
  KampfSicherheitsEntscheidung,
  KampfSicherheitsKonfiguration
} from './kampfsicherheit.js';

export const SICHERE_FARM_SCHRITT_ARTEN = ['kampfsicherheit', 'farmen', 'abklingzeit', 'blockiert'] as const;
export type SichererFarmSchrittArt = (typeof SICHERE_FARM_SCHRITT_ARTEN)[number];

export interface SichereFarmKonfiguration {
  readonly farmen: FarmKonfiguration;
  readonly kampfsicherheit: KampfSicherheitsKonfiguration;
  readonly maxAktionsBereitschaftAlterMillisekunden: number;
}

export interface SichererFarmAblaufZustand {
  readonly schemaVersion: 1;
  readonly farmen: FarmAblaufZustand;
  readonly kampfsicherheit: KampfSicherheitsAblaufZustand;
}

export interface SichererFarmSchritt {
  readonly schemaVersion: 1;
  readonly zeitpunkt: number;
  readonly art: SichererFarmSchrittArt;
  readonly grund: string;
  readonly aktionsAnfrage: AktionsAnfrage | null;
  readonly farmEntscheidung: FarmEntscheidung | null;
  readonly sicherheitsEntscheidung: KampfSicherheitsEntscheidung;
  readonly angriffsBereitschaft: KampfAktionsBereitschaft;
  readonly naechsterAblaufZustand: SichererFarmAblaufZustand;
}
