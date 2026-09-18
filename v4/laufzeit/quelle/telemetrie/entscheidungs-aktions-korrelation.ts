import type { AktionsAnfrage } from '../vertraege/aktions-anfrage.js';
import type { AktionsErgebnis } from '../vertraege/aktions-ergebnis.js';
import type { AktionsLaufZustand } from '../vertraege/aktions-steuerung.js';
import type { GruppenAktionsAnfrageDetails } from '../vertraege/gruppen-aktionsanfrage.js';
import type {
  GruppenEntscheidungsAktionsRueckmeldung,
  GruppenEntscheidungsDatensatz,
  GruppenEntscheidungsErgebnisStatus,
  GruppenEntscheidungsTatsaechlichesErgebnis
} from './gruppen-entscheidungs-datensatz.js';

type GruppenAktionsAnfrage = AktionsAnfrage<GruppenAktionsAnfrageDetails>;

function pruefeZeitpunkt(zeitpunkt: number): void {
  if (!Number.isFinite(zeitpunkt) || zeitpunkt < 0) {
    throw new Error('Der Korrelationszeitpunkt muss endlich und nichtnegativ sein.');
  }
}

function gleicheStrings(links: readonly string[], rechts: readonly string[]): boolean {
  return links.length === rechts.length && links.every((wert, index) => wert === rechts[index]);
}

function pruefeGruppenAnfrage(
  datensatz: GruppenEntscheidungsDatensatz,
  anfrage: GruppenAktionsAnfrage
): void {
  if (anfrage.kennung.trim().length === 0) throw new Error('AktionsAnfrage-Kennung darf nicht leer sein.');
  if (anfrage.angefordertVon !== 'gruppen-aktionsplanung') {
    throw new Error(`AktionsAnfrage ${anfrage.kennung} stammt nicht aus der Gruppen-Aktionsplanung.`);
  }
  if (anfrage.details.planZeitpunkt !== datensatz.zeitpunkt) {
    throw new Error(
      `AktionsAnfrage ${anfrage.kennung} gehoert zum Planzeitpunkt ${anfrage.details.planZeitpunkt} statt zur Entscheidung ${datensatz.zeitpunkt}.`
    );
  }
  const bekannteTeilnehmer = new Set(
    datensatz.situation.teilnehmer.map((teilnehmer) => teilnehmer.charakterKennung)
  );
  if (!bekannteTeilnehmer.has(anfrage.details.ausfuehrenderTeilnehmerKennung)) {
    throw new Error(
      `AktionsAnfrage ${anfrage.kennung} verweist auf einen unbekannten ausfuehrenden Teilnehmer.`
    );
  }
}

export function verknuepfeGruppenEntscheidungMitAktionsAnfragen(
  datensatz: GruppenEntscheidungsDatensatz,
  anfragen: readonly GruppenAktionsAnfrage[]
): Readonly<GruppenEntscheidungsDatensatz> {
  if (datensatz.art !== 'gruppenkoordination') {
    throw new Error('Nur ein Gruppenkoordinations-EntscheidungsDatensatz kann mit Gruppen-AktionsAnfragen verknuepft werden.');
  }

  for (const anfrage of anfragen) pruefeGruppenAnfrage(datensatz, anfrage);
  const kennungen = [...new Set(anfragen.map((anfrage) => anfrage.kennung))].sort();
  if (kennungen.length !== anfragen.length) {
    throw new Error('Dieselbe AktionsAnfrage darf nicht mehrfach mit einer Entscheidung verknuepft werden.');
  }

  const bisher = [...datensatz.aktionsAnfrageKennungen].sort();
  if (bisher.length > 0) {
    if (!gleicheStrings(bisher, kennungen)) {
      throw new Error('Der EntscheidungsDatensatz ist bereits mit einer anderen AktionsAnfrage-Menge verknuepft.');
    }
    return datensatz;
  }
  if (datensatz.tatsaechlichesErgebnis !== null && kennungen.length > 0) {
    throw new Error('Ein bereits ausgewerteter EntscheidungsDatensatz darf nicht nachtraeglich neue AktionsAnfragen erhalten.');
  }
  if (kennungen.length === 0) return datensatz;

  return Object.freeze({
    ...datensatz,
    aktionsAnfrageKennungen: Object.freeze(kennungen)
  });
}

function erfolgAusPhase(phase: AktionsLaufZustand['phase']): boolean | null {
  if (phase === 'abgeschlossen') return true;
  if (phase === 'abgebrochen' || phase === 'abgelaufen') return false;
  return null;
}

function statusAusRueckmeldungen(
  rueckmeldungen: readonly GruppenEntscheidungsAktionsRueckmeldung[]
): GruppenEntscheidungsErgebnisStatus {
  if (rueckmeldungen.length === 0) return 'keine_aktion';
  if (rueckmeldungen.some((rueckmeldung) => rueckmeldung.erfolgreich === null)) return 'offen';
  const erfolge = rueckmeldungen.filter((rueckmeldung) => rueckmeldung.erfolgreich === true).length;
  if (erfolge === rueckmeldungen.length) return 'erfolgreich';
  if (erfolge === 0) return 'fehlgeschlagen';
  return 'gemischt';
}

function mitTatsaechlichemErgebnis(
  datensatz: GruppenEntscheidungsDatensatz,
  ausgewertetAm: number,
  rueckmeldungen: readonly GruppenEntscheidungsAktionsRueckmeldung[]
): Readonly<GruppenEntscheidungsDatensatz> {
  pruefeZeitpunkt(ausgewertetAm);
  const sortiert = Object.freeze(
    [...rueckmeldungen].sort(
      (links, rechts) => links.aktionsAnfrageKennung.localeCompare(rechts.aktionsAnfrageKennung)
    )
  );
  const ergebnis: GruppenEntscheidungsTatsaechlichesErgebnis = Object.freeze({
    schemaVersion: 1,
    ausgewertetAm,
    status: statusAusRueckmeldungen(sortiert),
    rueckmeldungen: sortiert
  });
  return Object.freeze({
    ...datensatz,
    tatsaechlichesErgebnis: ergebnis
  });
}

export function werteGruppenEntscheidungMitAktionsZustaendenAus(
  datensatz: GruppenEntscheidungsDatensatz,
  zustaende: readonly AktionsLaufZustand[],
  ausgewertetAm: number
): Readonly<GruppenEntscheidungsDatensatz> {
  const zustandNachKennung = new Map(
    zustaende.map((zustand) => [zustand.anfrage.kennung, zustand] as const)
  );
  const rueckmeldungen = datensatz.aktionsAnfrageKennungen.map((kennung) => {
    const zustand = zustandNachKennung.get(kennung);
    if (zustand === undefined) {
      return Object.freeze({
        aktionsAnfrageKennung: kennung,
        phase: 'fehlt',
        erfolgreich: null,
        grund: 'Die verknuepfte AktionsAnfrage ist in den beobachteten Aktionszustaenden noch nicht vorhanden.'
      });
    }
    return Object.freeze({
      aktionsAnfrageKennung: kennung,
      phase: zustand.phase,
      erfolgreich: erfolgAusPhase(zustand.phase),
      grund: zustand.zustandsGrund
    });
  });
  return mitTatsaechlichemErgebnis(datensatz, ausgewertetAm, rueckmeldungen);
}

export function werteGruppenEntscheidungMitAktionsErgebnissenAus(
  datensatz: GruppenEntscheidungsDatensatz,
  ergebnisse: readonly AktionsErgebnis[],
  ausgewertetAm: number
): Readonly<GruppenEntscheidungsDatensatz> {
  const ergebnisNachKennung = new Map<string, AktionsErgebnis>();
  for (const ergebnis of ergebnisse) {
    if (ergebnis.ablaufKennung !== datensatz.ablaufKennung) continue;
    ergebnisNachKennung.set(ergebnis.aktionsAnfrageKennung, ergebnis);
  }

  const rueckmeldungen = datensatz.aktionsAnfrageKennungen.map((kennung) => {
    const ergebnis = ergebnisNachKennung.get(kennung);
    if (ergebnis === undefined) {
      return Object.freeze({
        aktionsAnfrageKennung: kennung,
        phase: 'ergebnis_fehlt',
        erfolgreich: null,
        grund: 'Fuer die verknuepfte AktionsAnfrage liegt noch kein AktionsErgebnis dieses Ablaufs vor.'
      });
    }
    return Object.freeze({
      aktionsAnfrageKennung: kennung,
      phase: ergebnis.erfolgreich ? 'abgeschlossen' : 'abgebrochen',
      erfolgreich: ergebnis.erfolgreich,
      grund: ergebnis.grund
    });
  });
  return mitTatsaechlichemErgebnis(datensatz, ausgewertetAm, rueckmeldungen);
}
