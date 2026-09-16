import type { BotEreignis } from './bot-ereignis.js';
import type { BotMeldung, MeldungsStufe } from './bot-meldung.js';
import type { KontingentSchutzstufe } from './dienst-kontingent.js';

export interface BegrenzungsRegeln {
  readonly maxEintraege: number;
  readonly maxBytes: number;
  readonly maxAlterMillisekunden: number;
}

export interface EreignisSchreibDaten<TDetails = unknown> {
  readonly zeitpunkt: number;
  readonly name: string;
  readonly quelle: string;
  readonly ablaufKennung: string;
  readonly details: TDetails;
}

export interface EreignisSchreiber {
  schreibe<TDetails>(daten: EreignisSchreibDaten<TDetails>): BotEreignis<TDetails>;
}

export interface LaufzeitAbschnitt {
  readonly schemaVersion: 1;
  readonly kennung: string;
  readonly start: number;
  readonly ende: number;
  readonly charakterName?: string;
}

export interface LeistungsZaehlerEintrag {
  readonly schemaVersion: 1;
  readonly kennung: string;
  readonly zeitpunkt: number;
  readonly charakterName?: string;
  readonly erfahrungGewonnen: number;
  readonly goldGewonnen: number;
  readonly tode: number;
  readonly rueckzuege: number;
  readonly verbindungsAbbrueche: number;
  readonly neustarts: number;
  readonly automatischBehoben: number;
  readonly ungefangeneFehler: number;
}

export interface EntscheidungsSpurEintrag<TDetails = unknown> {
  readonly entscheidungKennung: string;
  readonly zeitpunkt: number;
  readonly ablaufKennung: string;
  readonly quelle: string;
  readonly entscheidung: string;
  readonly grund: string;
  readonly details: TDetails;
}

export interface AktionsSpurEintrag<TDetails = unknown> {
  readonly aktionsKennung: string;
  readonly zeitpunkt: number;
  readonly ablaufKennung: string;
  readonly quelle: string;
  readonly phase: string;
  readonly grund: string;
  readonly details: TDetails;
}

export interface DienstVerbrauchsEintrag {
  readonly schemaVersion: 1;
  readonly kennung: string;
  readonly zeitpunkt: number;
  readonly dienstKennung: string;
  readonly grenzeKennung: string;
  readonly fensterKennung: string;
  readonly vorgangKennung: string;
  readonly lokalReserviert: number;
  readonly vomAnbieterGemeldet: number;
  readonly schutzstufe: KontingentSchutzstufe;
  readonly erlaubt: boolean;
  readonly grund: string;
}

export interface WiederholungsSegmentNachweis {
  readonly schemaVersion: 1;
  readonly segmentKennung: string;
  readonly sitzungKennung: string;
  readonly erstelltAm: number;
  readonly zeitraumStart: number;
  readonly zeitraumEnde: number;
  readonly sequenzStart: number;
  readonly sequenzEnde: number;
  readonly ereignisAnzahl: number;
  readonly groesseBytes: number;
  readonly sha256: string;
}

export interface WiederholungsSegment extends WiederholungsSegmentNachweis {
  readonly inhalt: string;
}

export const VORFALL_ARTEN = ['stillstand', 'schleife', 'zeitueberschreitung', 'unerwarteter_zustandswechsel'] as const;
export type VorfallArt = (typeof VORFALL_ARTEN)[number];

export interface Vorfall {
  readonly schemaVersion: 1;
  readonly vorfallKennung: string;
  readonly art: VorfallArt;
  readonly schwere: MeldungsStufe;
  readonly entdecktAm: number;
  readonly ablaufKennung: string;
  readonly zustand: string;
  readonly ursache: string;
  readonly botReaktion: string;
  readonly nutzerAktion: string;
  readonly mussNutzerHandeln: boolean;
  readonly meldung: BotMeldung;
}

export interface VorfallPaket {
  readonly schemaVersion: 1;
  readonly paketKennung: string;
  readonly vorfall: Vorfall;
  readonly erstelltAm: number;
  readonly abgeschlossenAm: number;
  readonly ereignisseVorher: readonly BotEreignis[];
  readonly ereignisseNachher: readonly BotEreignis[];
  readonly gekuerzt: boolean;
}

export interface AblaufBeobachtung {
  readonly kennung: string;
  readonly ablaufKennung: string;
  readonly zeitpunkt: number;
  readonly zustand: string;
  readonly fortschrittKennung: string;
  readonly entscheidungKennung: string;
  readonly gestartetAm: number;
  readonly letzterFortschrittAm: number;
  readonly zeitlimitMillisekunden?: number;
  readonly erlaubteNaechsteZustaende?: readonly string[];
}

export interface VorfallErkennungsRegeln {
  readonly stillstandNachMillisekunden: number;
  readonly schleifenFensterMillisekunden: number;
  readonly schleifenWiederholungen: number;
  readonly schleifenMusterLaengeMax: number;
}

export interface LeistungsGesamtZusammenfassung {
  readonly laufzeitMillisekunden: number;
  readonly verbindungsAbbrueche: number;
  readonly automatischBehoben: number;
  readonly ungefangeneFehler: number;
  readonly neustarts: number;
}

export interface LeistungsCharakterZusammenfassung {
  readonly charakterName: string;
  readonly laufzeitMillisekunden: number;
  readonly erfahrungGewonnen: number;
  readonly goldGewonnen: number;
  readonly erfahrungProStunde: number | null;
  readonly goldProStunde: number | null;
  readonly tode: number;
  readonly rueckzuege: number;
}

export interface LeistungsZusammenfassung {
  readonly zeitraumStart: number;
  readonly zeitraumEnde: number;
  readonly vollstaendig: boolean;
  readonly datenVon: number | null;
  readonly datenBis: number | null;
  readonly gesamt: LeistungsGesamtZusammenfassung;
  readonly charaktere: readonly LeistungsCharakterZusammenfassung[];
}

export interface TelemetrieDauerzustand {
  readonly schemaVersion: 1;
  readonly gespeichertAm: number;
  readonly laufzeitAbschnitte: readonly LaufzeitAbschnitt[];
  readonly leistungsZaehler: readonly LeistungsZaehlerEintrag[];
  readonly dienstVerbrauch: readonly DienstVerbrauchsEintrag[];
  readonly wiederholungsSegmente: readonly WiederholungsSegment[];
  readonly vorfallPakete: readonly VorfallPaket[];
}

export interface TelemetrieAblage {
  lese(): string | null;
  schreibe(inhalt: string): void;
}

export interface SchluesselWertSpeicher {
  getItem(schluessel: string): string | null;
  setItem(schluessel: string, wert: string): void;
}
