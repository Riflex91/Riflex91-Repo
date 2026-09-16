export const AUFTRAGS_ARTEN = ['sammeln', 'herstellen'] as const;
export type AuftragsArt = typeof AUFTRAGS_ARTEN[number];

export const MENGEN_ZIEL_ARTEN = ['zusaetzlich', 'gesamtbestand'] as const;
export type MengenZielArt = typeof MENGEN_ZIEL_ARTEN[number];

export const AUFTRAGS_ZUSTAENDE = [
  'entwurf',
  'geprueft',
  'bereit',
  'laeuft',
  'pausiert',
  'blockiert',
  'erledigt',
  'abgebrochen',
  'fehlgeschlagen'
] as const;
export type AuftragsZustand = typeof AUFTRAGS_ZUSTAENDE[number];

export interface NutzerAuftrag {
  auftragKennung: string;
  erstelltAm: number;
  art: AuftragsArt;
  gegenstandKennung: string;
  gegenstandName: string;
  zielMenge: number;
  mengenZielArt: MengenZielArt;
  zustand: AuftragsZustand;
  urspruenglicheEingabe?: string;
}

export interface AuftragsTeilSchritt {
  schrittKennung: string;
  beschreibung: string;
  erforderlich: boolean;
}

export interface AuftragsPlan {
  auftragKennung: string;
  erklaerung: string;
  vorhandenerBestand: number;
  nochBenoetigteMenge: number;
  teilSchritte: AuftragsTeilSchritt[];
  beteiligteCharaktere: string[];
  verbrauchsHinweise: string[];
  kannGestartetWerden: boolean;
  mussNutzerBestaetigen: boolean;
  blockierungsGrund?: string;
}

export interface AuftragsPruefErgebnis {
  gueltig: boolean;
  fehler: string[];
  warnungen: string[];
}
