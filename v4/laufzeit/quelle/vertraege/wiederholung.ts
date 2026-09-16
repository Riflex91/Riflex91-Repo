import type { BotEreignis } from './bot-ereignis.js';
import type { DienstAnfrage, DienstProfil, KontingentEntscheidung } from './dienst-kontingent.js';
import type { Spielzustand } from './spielzustand.js';
import type {
  AblaufBeobachtung,
  LeistungsZusammenfassung,
  TelemetrieDauerzustand,
  Vorfall,
  VorfallErkennungsRegeln,
  WiederholungsSegment
} from './telemetrie.js';

export const WIEDERHOLUNGS_SICHERHEITSZUSTAENDE = ['sicher', 'warnung', 'verletzung'] as const;
export type WiederholungsSicherheitszustand = (typeof WIEDERHOLUNGS_SICHERHEITSZUSTAENDE)[number];

export const WIEDERHOLUNGS_VERGLEICHSBEWERTUNGEN = [
  'gleich',
  'geaendert',
  'verbessert',
  'verschlechtert',
  'sicherheitsverletzung'
] as const;
export type WiederholungsVergleichsBewertung = (typeof WIEDERHOLUNGS_VERGLEICHSBEWERTUNGEN)[number];

export interface WiederholungsZustandsEintrag {
  readonly charakterKennung: string;
  readonly zustand: Spielzustand;
}

export interface WiederholungsEreignisEintrag {
  readonly charakterKennung: string | null;
  readonly ereignis: BotEreignis;
}

export interface WiederholungsEntscheidung<TDetails = unknown> {
  readonly kennung: string;
  readonly zeitpunkt: number;
  readonly charakterKennung: string;
  readonly entscheidung: string;
  readonly grund: string;
  readonly sicherheitszustand: WiederholungsSicherheitszustand;
  readonly bewertungsWert: number;
  readonly details: TDetails;
}

export interface WiederholungsKontext {
  readonly jetzt: number;
  readonly charakterKennung: string;
  readonly spielzustand: Spielzustand;
  readonly ereignisseBisJetzt: readonly BotEreignis[];
  readonly vorherigeEntscheidungen: readonly WiederholungsEntscheidung[];
}

export type WiederholungsEntscheider = (
  kontext: WiederholungsKontext
) => WiederholungsEntscheidung | readonly WiederholungsEntscheidung[] | null;

export interface KontingentProfilSchritt {
  readonly art: 'profil_setzen';
  readonly laufendeNummer: number;
  readonly zeitpunkt: number;
  readonly profil: DienstProfil;
}

export interface KontingentAnbieterVerbrauchSchritt {
  readonly art: 'anbieter_verbrauch';
  readonly laufendeNummer: number;
  readonly zeitpunkt: number;
  readonly dienstKennung: string;
  readonly grenzeKennung: string;
  readonly fensterKennung: string;
  readonly vomAnbieterGemeldet: number;
}

export interface KontingentAnfrageSchritt {
  readonly art: 'anfrage';
  readonly laufendeNummer: number;
  readonly zeitpunkt: number;
  readonly anfrage: DienstAnfrage;
  readonly fensterKennungen: Readonly<Record<string, string>>;
}

export type KontingentWiederholungsSchritt =
  | KontingentProfilSchritt
  | KontingentAnbieterVerbrauchSchritt
  | KontingentAnfrageSchritt;

export interface KontingentWiederholungsErgebnis {
  readonly laufendeNummer: number;
  readonly zeitpunkt: number;
  readonly entscheidung: KontingentEntscheidung;
}

export interface LeistungsWiederholungsZeitraum {
  readonly kennung: string;
  readonly zeitraumStart: number;
  readonly zeitraumEnde: number;
}

export interface LeistungsWiederholungsErgebnis {
  readonly kennung: string;
  readonly zusammenfassung: LeistungsZusammenfassung;
}

export interface WiederholungsDatensatz {
  readonly schemaVersion: 1;
  readonly kennung: string;
  readonly erstelltAm: number;
  readonly zustaende: readonly WiederholungsZustandsEintrag[];
  readonly ereignisse: readonly WiederholungsEreignisEintrag[];
  readonly ablaufBeobachtungen: readonly AblaufBeobachtung[];
  readonly vorfallRegeln: VorfallErkennungsRegeln;
  readonly kontingentSchritte: readonly KontingentWiederholungsSchritt[];
  readonly telemetrieDauerzustand: TelemetrieDauerzustand | null;
  readonly leistungsZeitraeume: readonly LeistungsWiederholungsZeitraum[];
}

export interface WiederholungsLauf {
  readonly schemaVersion: 1;
  readonly datensatzKennung: string;
  readonly varianteKennung: string;
  readonly eingabeFingerabdruck: string;
  readonly ausgabeFingerabdruck: string;
  readonly entscheidungen: readonly WiederholungsEntscheidung[];
  readonly vorfaelle: readonly Vorfall[];
  readonly kontingentEntscheidungen: readonly KontingentWiederholungsErgebnis[];
  readonly leistungsAuswertungen: readonly LeistungsWiederholungsErgebnis[];
}

export interface EntscheidungsVergleich {
  readonly schluessel: string;
  readonly vorher: WiederholungsEntscheidung | null;
  readonly nachher: WiederholungsEntscheidung | null;
  readonly bewertung: WiederholungsVergleichsBewertung;
  readonly grund: string;
}

export interface WiederholungsVergleich {
  readonly schemaVersion: 1;
  readonly datensatzKennung: string;
  readonly vorherVariante: string;
  readonly nachherVariante: string;
  readonly eingabeFingerabdruck: string;
  readonly entscheidungsVergleiche: readonly EntscheidungsVergleich[];
  readonly geaenderteEntscheidungen: number;
  readonly verbesserungen: number;
  readonly verschlechterungen: number;
  readonly sicherheitsverletzungen: number;
  readonly identisch: boolean;
}

export interface GeladenesWiederholungsSegment {
  readonly segment: WiederholungsSegment;
  readonly ereignisse: readonly BotEreignis[];
}

export interface WiederholungsSegmentSammlung {
  readonly sitzungKennung: string;
  readonly segmente: readonly GeladenesWiederholungsSegment[];
  readonly ereignisse: readonly BotEreignis[];
  readonly vollstaendig: boolean;
  readonly luecken: readonly string[];
}

export interface GoldenerWiederholungsEintrag {
  readonly schemaVersion: 1;
  readonly kennung: string;
  readonly hinzugefuegtAm: number;
  readonly grund: string;
  readonly datensatz: WiederholungsDatensatz;
  readonly sha256: string;
}

export interface GoldenerWiederholungsSatzGrenzen {
  readonly maxEintraege: number;
  readonly maxBytes: number;
}

export interface GoldenerWiederholungsHinzufuegeErgebnis {
  readonly aufgenommen: boolean;
  readonly grund: string;
  readonly eintrag: GoldenerWiederholungsEintrag | null;
}
