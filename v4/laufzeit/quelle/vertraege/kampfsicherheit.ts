import type { AktionsAnfrage } from './aktions-anfrage.js';
import type { BotMeldung } from './bot-meldung.js';

export const KAMPF_GEFAHREN_STUFEN = ['unbekannt', 'sicher', 'angespannt', 'gefaehrlich', 'kritisch'] as const;
export type KampfGefahrenStufe = (typeof KAMPF_GEFAHREN_STUFEN)[number];

export const KAMPF_SICHERHEITS_AKTIONS_ARTEN = ['keine', 'abstand_herstellen', 'rueckzug', 'blockiert'] as const;
export type KampfSicherheitsAktionsArt = (typeof KAMPF_SICHERHEITS_AKTIONS_ARTEN)[number];

export const KAMPF_SICHERHEITS_AKTIONS_NAMEN = Object.freeze({
  abstandHerstellen: 'KAMPF_ABSTAND_HERSTELLEN',
  rueckzug: 'KAMPF_RUECKZUG'
} as const);

export interface KampfSicherheitsKonfiguration {
  readonly rueckzugUnterLebensAnteil: number;
  readonly kritischUnterLebensAnteil: number;
  readonly mindestensManaAnteilImKampf: number;
  readonly maximalAngreifer: number;
  readonly mindestAbstandFaktor: number;
  readonly rueckzugDistanz: number;
  readonly bewegungsStillstandNachMillisekunden: number;
}

export interface KampfSicherheitsAblaufZustand {
  readonly schemaVersion: 1;
  readonly gestartetAm: number;
  readonly letztePositionKennung: string | null;
  readonly letzterPositionsFortschrittAm: number;
  readonly sicherheitsBewegungAktivSeit: number | null;
}

export interface KampfGefahrenBewertung {
  readonly stufe: KampfGefahrenStufe;
  readonly gruende: readonly string[];
  readonly angreiferKennungen: readonly string[];
  readonly lebensAnteil: number | null;
  readonly manaAnteil: number | null;
  readonly naechsterAngreiferAbstand: number | null;
  readonly mindestAbstand: number | null;
}

export interface KampfSicherheitsAktionsDetails {
  readonly x: number;
  readonly y: number;
  readonly grundCode: string;
  readonly angreiferKennungen: readonly string[];
}

export interface KampfSicherheitsEntscheidung {
  readonly schemaVersion: 1;
  readonly entscheidungsKennung: string;
  readonly zeitpunkt: number;
  readonly art: KampfSicherheitsAktionsArt;
  readonly grund: string;
  readonly normalAktionenErlaubt: boolean;
  readonly gefahrenBewertung: KampfGefahrenBewertung;
  readonly aktionsAnfrage: AktionsAnfrage<KampfSicherheitsAktionsDetails> | null;
  readonly meldung: Readonly<BotMeldung> | null;
  readonly naechsterAblaufZustand: KampfSicherheitsAblaufZustand;
}
