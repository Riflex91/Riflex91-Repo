import type {
  EntscheidungsDatensatz,
  EntscheidungsMoeglichkeit
} from '../vertraege/entscheidungs-datensatz.js';
import {
  GRUPPEN_BETRIEBS_ARTEN,
  type GruppenAufgabenZuordnung,
  type GruppenBetriebsArt,
  type GruppenFaehigkeitsProfil,
  type GruppenKoordinationsEntscheidung,
  type GruppenTeilnehmerMeldung,
  type GruppenTeilnehmerStatus
} from '../vertraege/gruppen-koordination.js';
import type { KampfGefahrenStufe } from '../vertraege/kampfsicherheit.js';
import { berechneSha256 } from './sha256.js';
import { kanonisiereJson } from '../wiederholung/kanonisches-json.js';

export interface GruppenEntscheidungsTeilnehmer {
  readonly charakterKennung: string;
  readonly charakterName: string;
  readonly klasse: string;
  readonly serverRegion: string;
  readonly serverKennung: string;
  readonly karte: string;
  readonly instanz: string;
  readonly lebendig: boolean | null;
  readonly lebensAnteil: number | null;
  readonly manaAnteil: number | null;
  readonly zielKennung: string | null;
  readonly gefahrenStufe: KampfGefahrenStufe;
  readonly faehigkeiten: GruppenFaehigkeitsProfil;
  readonly koordinationsStatus: GruppenTeilnehmerStatus | null;
}

export interface GruppenEntscheidungsSituation {
  readonly eigenerTeilnehmerKennung: string;
  readonly teilnehmer: readonly GruppenEntscheidungsTeilnehmer[];
}

export interface GruppenEntscheidungsErwartung {
  readonly betriebsArt: GruppenBetriebsArt;
  readonly gemeinsameGefahrenStufe: KampfGefahrenStufe;
  readonly gemeinsamesZielKennung: string | null;
  readonly aktiveTeilnehmerKennungen: readonly string[];
  readonly aufgaben: GruppenAufgabenZuordnung;
}

export const GRUPPEN_ENTSCHEIDUNGS_ERGEBNIS_STATUS = [
  'keine_aktion',
  'offen',
  'erfolgreich',
  'fehlgeschlagen',
  'gemischt'
] as const;
export type GruppenEntscheidungsErgebnisStatus =
  (typeof GRUPPEN_ENTSCHEIDUNGS_ERGEBNIS_STATUS)[number];

export interface GruppenEntscheidungsAktionsRueckmeldung {
  readonly aktionsAnfrageKennung: string;
  readonly phase: string;
  readonly erfolgreich: boolean | null;
  readonly grund: string;
}

export interface GruppenEntscheidungsTatsaechlichesErgebnis {
  readonly schemaVersion: 1;
  readonly ausgewertetAm: number;
  readonly status: GruppenEntscheidungsErgebnisStatus;
  readonly rueckmeldungen: readonly GruppenEntscheidungsAktionsRueckmeldung[];
}

export type GruppenEntscheidungsDatensatz = EntscheidungsDatensatz<
  GruppenEntscheidungsSituation,
  GruppenEntscheidungsErwartung,
  GruppenEntscheidungsTatsaechlichesErgebnis
>;

function pruefeText(name: string, wert: string): void {
  if (wert.trim().length === 0) throw new Error(`${name} darf nicht leer sein.`);
}

function verdichteNeuesteMeldungen(
  meldungen: readonly GruppenTeilnehmerMeldung[]
): readonly GruppenTeilnehmerMeldung[] {
  const sortiert = [...meldungen].sort((links, rechts) => {
    const kennung = links.charakterKennung.localeCompare(rechts.charakterKennung);
    if (kennung !== 0) return kennung;
    if (links.gesendetAm !== rechts.gesendetAm) return rechts.gesendetAm - links.gesendetAm;
    return rechts.laufendeNummer - links.laufendeNummer;
  });
  const neueste = new Map<string, GruppenTeilnehmerMeldung>();
  for (const meldung of sortiert) {
    if (!neueste.has(meldung.charakterKennung)) neueste.set(meldung.charakterKennung, meldung);
  }
  return Object.freeze([...neueste.values()].sort(
    (links, rechts) => links.charakterKennung.localeCompare(rechts.charakterKennung)
  ));
}

function baueSituation(
  meldungen: readonly GruppenTeilnehmerMeldung[],
  entscheidung: GruppenKoordinationsEntscheidung
): GruppenEntscheidungsSituation {
  const statusNachKennung = new Map(
    entscheidung.teilnehmerBewertungen.map((bewertung) => [bewertung.charakterKennung, bewertung.status] as const)
  );
  const teilnehmer = verdichteNeuesteMeldungen(meldungen).map((meldung) => Object.freeze({
    charakterKennung: meldung.charakterKennung,
    charakterName: meldung.charakterName,
    klasse: meldung.klasse,
    serverRegion: meldung.serverRegion,
    serverKennung: meldung.serverKennung,
    karte: meldung.karte,
    instanz: meldung.instanz,
    lebendig: meldung.lebendig,
    lebensAnteil: meldung.lebensAnteil,
    manaAnteil: meldung.manaAnteil,
    zielKennung: meldung.zielKennung,
    gefahrenStufe: meldung.gefahrenStufe,
    faehigkeiten: Object.freeze({ ...meldung.faehigkeiten }),
    koordinationsStatus: statusNachKennung.get(meldung.charakterKennung) ?? null
  }));
  return Object.freeze({
    eigenerTeilnehmerKennung: entscheidung.eigenerTeilnehmerKennung,
    teilnehmer: Object.freeze(teilnehmer)
  });
}

function baueMoeglichkeiten(entscheidung: GruppenKoordinationsEntscheidung): readonly EntscheidungsMoeglichkeit[] {
  return Object.freeze(GRUPPEN_BETRIEBS_ARTEN.map((betriebsArt) => Object.freeze({
    kennung: `gruppenbetrieb:${betriebsArt}`,
    erlaubt: entscheidung.betriebsArt === betriebsArt,
    grund: entscheidung.betriebsArt === betriebsArt
      ? 'Diese Betriebsart wurde aus der aktuellen Gruppenlage gewaehlt.'
      : `Die aktuelle Gruppenlage fuehrt stattdessen zu ${entscheidung.betriebsArt}.`
  })));
}

function baueErkannteEreignisse(
  situation: GruppenEntscheidungsSituation,
  entscheidung: GruppenKoordinationsEntscheidung
): readonly string[] {
  const ereignisse: string[] = [];
  for (const teilnehmer of situation.teilnehmer) {
    if (teilnehmer.koordinationsStatus !== null && teilnehmer.koordinationsStatus !== 'aktiv') {
      ereignisse.push(`teilnehmer:${teilnehmer.charakterKennung}:${teilnehmer.koordinationsStatus}`);
    }
  }
  if (entscheidung.gemeinsameGefahrenStufe !== 'sicher') {
    ereignisse.push(`gruppen_sicherheit:${entscheidung.gemeinsameGefahrenStufe}`);
  }
  if (entscheidung.gemeinsamesZielKennung !== null) {
    ereignisse.push(`gemeinsames_ziel:${entscheidung.gemeinsamesZielKennung}`);
  }
  return Object.freeze(ereignisse.sort());
}

function baueErwartung(entscheidung: GruppenKoordinationsEntscheidung): GruppenEntscheidungsErwartung {
  return Object.freeze({
    betriebsArt: entscheidung.betriebsArt,
    gemeinsameGefahrenStufe: entscheidung.gemeinsameGefahrenStufe,
    gemeinsamesZielKennung: entscheidung.gemeinsamesZielKennung,
    aktiveTeilnehmerKennungen: Object.freeze([...entscheidung.aktiveTeilnehmerKennungen].sort()),
    aufgaben: Object.freeze({ ...entscheidung.aufgaben })
  });
}

export function erstelleGruppenEntscheidungsDatensatz(
  ablaufKennung: string,
  meldungen: readonly GruppenTeilnehmerMeldung[],
  entscheidung: GruppenKoordinationsEntscheidung
): Readonly<GruppenEntscheidungsDatensatz> {
  pruefeText('ablaufKennung', ablaufKennung);
  pruefeText('eigenerTeilnehmerKennung', entscheidung.eigenerTeilnehmerKennung);
  pruefeText('grund', entscheidung.grund);
  if (!Number.isFinite(entscheidung.zeitpunkt) || entscheidung.zeitpunkt < 0) {
    throw new Error('Der Entscheidungszeitpunkt muss endlich und nichtnegativ sein.');
  }

  const situation = baueSituation(meldungen, entscheidung);
  const moeglichkeiten = baueMoeglichkeiten(entscheidung);
  const erkannteEreignisse = baueErkannteEreignisse(situation, entscheidung);
  const erwartetesErgebnis = baueErwartung(entscheidung);
  const gewaehlteEntscheidung = `gruppenbetrieb:${entscheidung.betriebsArt}`;

  const eingabeFingerabdruck = berechneSha256(kanonisiereJson(situation));
  const fachlicherFingerabdruck = berechneSha256(kanonisiereJson({
    situation,
    erkannteEreignisse,
    moeglichkeiten: moeglichkeiten.map((moeglichkeit) => ({
      kennung: moeglichkeit.kennung,
      erlaubt: moeglichkeit.erlaubt
    })),
    gewaehlteEntscheidung,
    erwartetesErgebnis
  }));
  const entscheidungKennung =
    `gruppenentscheidung:${entscheidung.zeitpunkt}:${fachlicherFingerabdruck.slice(0, 16)}`;

  return Object.freeze({
    schemaVersion: 1,
    art: 'gruppenkoordination',
    entscheidungKennung,
    ablaufKennung,
    quelle: 'gruppen-koordination',
    zeitpunkt: entscheidung.zeitpunkt,
    eingabeFingerabdruck,
    fachlicherFingerabdruck,
    situation,
    erkannteEreignisse,
    moeglichkeiten,
    gewaehlteEntscheidung,
    grund: entscheidung.grund,
    erwartetesErgebnis,
    aktionsAnfrageKennungen: Object.freeze([]),
    tatsaechlichesErgebnis: null
  });
}
