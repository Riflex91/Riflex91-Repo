import type { AktionsAnfrage } from './aktions-anfrage.js';
import type { BotMeldung } from './bot-meldung.js';
import type { AblaufBeobachtung, LeistungsZaehlerEintrag, LaufzeitAbschnitt } from './telemetrie.js';

export const FARM_AKTIONS_ARTEN = [
  'bewegen',
  'angreifen',
  'leben_wiederherstellen',
  'mana_wiederherstellen',
  'beute_aufnehmen',
  'warten',
  'blockiert'
] as const;
export type FarmAktionsArt = (typeof FARM_AKTIONS_ARTEN)[number];

export const FARM_AKTIONS_NAMEN = Object.freeze({
  bewegen: 'FARM_BEWEGEN',
  angreifen: 'FARM_ANGREIFEN',
  lebenWiederherstellen: 'FARM_LEBEN_WIEDERHERSTELLEN',
  manaWiederherstellen: 'FARM_MANA_WIEDERHERSTELLEN',
  beuteAufnehmen: 'FARM_BEUTE_AUFNEHMEN'
} as const);

export type FarmAusfuehrbareAktionsArt = Exclude<FarmAktionsArt, 'warten' | 'blockiert'>;
export type FarmAktionsName = (typeof FARM_AKTIONS_NAMEN)[keyof typeof FARM_AKTIONS_NAMEN];

export interface FarmKonfiguration {
  readonly monsterArten: readonly string[];
  readonly lebenWiederherstellenUnter: number;
  readonly manaWiederherstellenUnter: number;
  readonly reichweitenPuffer: number;
  readonly mindestensFreieInventarPlaetze: number;
  readonly stillstandNachMillisekunden: number;
}

export interface FarmAblaufZustand {
  readonly schemaVersion: 1;
  readonly gestartetAm: number;
  readonly letzterFortschrittAm: number;
  readonly letzteFortschrittsKennung: string;
  readonly letzteZielKennung: string | null;
}

export interface FarmBewegungsDetails {
  readonly zielKennung: string;
  readonly x: number;
  readonly y: number;
}

export interface FarmZielDetails {
  readonly zielKennung: string;
}

export interface FarmWiederherstellungsDetails {
  readonly anteil: number;
  readonly schwelle: number;
}

export interface FarmBeuteDetails {
  readonly vorherigeZielKennung: string;
}

export type FarmAktionsDetails =
  | FarmBewegungsDetails
  | FarmZielDetails
  | FarmWiederherstellungsDetails
  | FarmBeuteDetails
  | Readonly<Record<string, never>>;

export interface FarmEntscheidung {
  readonly schemaVersion: 1;
  readonly entscheidungsKennung: string;
  readonly zeitpunkt: number;
  readonly art: FarmAktionsArt;
  readonly grund: string;
  readonly zielKennung: string | null;
  readonly aktionsAnfrage: AktionsAnfrage<FarmAktionsDetails> | null;
  readonly meldung: BotMeldung | null;
  readonly ablaufBeobachtung: AblaufBeobachtung;
  readonly naechsterAblaufZustand: FarmAblaufZustand;
}

export interface FarmLeistungsEintraege {
  readonly laufzeitAbschnitt: LaufzeitAbschnitt;
  readonly leistungsZaehler: LeistungsZaehlerEintrag | null;
}

export interface FarmWiederholungsDetails {
  readonly art: FarmAktionsArt;
  readonly zielKennung: string | null;
  readonly aktionsName: string | null;
  readonly naechsterAblaufZustand: FarmAblaufZustand;
  readonly meldungsCode: string | null;
}
