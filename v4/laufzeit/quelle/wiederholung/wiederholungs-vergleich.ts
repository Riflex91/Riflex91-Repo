import type {
  EntscheidungsVergleich,
  WiederholungsEntscheidung,
  WiederholungsLauf,
  WiederholungsVergleich,
  WiederholungsVergleichsBewertung
} from '../vertraege/wiederholung.js';
import { kanonisiereJson } from './kanonisches-json.js';

function schluessel(entscheidung: WiederholungsEntscheidung): string {
  return `${entscheidung.charakterKennung}:${entscheidung.kennung}`;
}

function bewerte(vorher: WiederholungsEntscheidung | null, nachher: WiederholungsEntscheidung | null): { bewertung: WiederholungsVergleichsBewertung; grund: string } {
  if (vorher === null || nachher === null) return { bewertung: 'geaendert', grund: 'Die Entscheidung existiert nur in einer der beiden Varianten.' };
  if (nachher.sicherheitszustand === 'verletzung' && vorher.sicherheitszustand !== 'verletzung') {
    return { bewertung: 'sicherheitsverletzung', grund: 'Die neue Variante erzeugt eine Sicherheitsverletzung, die vorher nicht vorhanden war.' };
  }
  if (vorher.sicherheitszustand === 'verletzung' && nachher.sicherheitszustand !== 'verletzung') {
    return { bewertung: 'verbessert', grund: 'Die vorherige Sicherheitsverletzung tritt in der neuen Variante nicht mehr auf.' };
  }
  if (kanonisiereJson(vorher) === kanonisiereJson(nachher)) return { bewertung: 'gleich', grund: 'Die Entscheidung ist unveraendert.' };
  if (nachher.bewertungsWert > vorher.bewertungsWert) return { bewertung: 'verbessert', grund: 'Der von der Fachlogik gelieferte Bewertungswert ist gestiegen.' };
  if (nachher.bewertungsWert < vorher.bewertungsWert) return { bewertung: 'verschlechtert', grund: 'Der von der Fachlogik gelieferte Bewertungswert ist gesunken.' };
  return { bewertung: 'geaendert', grund: 'Die Entscheidung hat sich bei gleichem Bewertungswert geaendert.' };
}

export function vergleicheWiederholungsLaeufe(vorher: WiederholungsLauf, nachher: WiederholungsLauf): WiederholungsVergleich {
  if (vorher.datensatzKennung !== nachher.datensatzKennung || vorher.eingabeFingerabdruck !== nachher.eingabeFingerabdruck) {
    throw new Error('Vorher-Nachher-Vergleich ist nur mit exakt demselben Wiederholungsdatensatz erlaubt.');
  }
  const vorherMap = new Map(vorher.entscheidungen.map((entscheidung) => [schluessel(entscheidung), entscheidung]));
  const nachherMap = new Map(nachher.entscheidungen.map((entscheidung) => [schluessel(entscheidung), entscheidung]));
  const alleSchluessel = [...new Set([...vorherMap.keys(), ...nachherMap.keys()])].sort();
  const entscheidungsVergleiche: EntscheidungsVergleich[] = alleSchluessel.map((kennung) => {
    const alteEntscheidung = vorherMap.get(kennung) ?? null;
    const neueEntscheidung = nachherMap.get(kennung) ?? null;
    const bewertung = bewerte(alteEntscheidung, neueEntscheidung);
    return Object.freeze({ schluessel: kennung, vorher: alteEntscheidung, nachher: neueEntscheidung, ...bewertung });
  });
  const geaenderte = entscheidungsVergleiche.filter((eintrag) => eintrag.bewertung !== 'gleich');
  return Object.freeze({
    schemaVersion: 1,
    datensatzKennung: vorher.datensatzKennung,
    vorherVariante: vorher.varianteKennung,
    nachherVariante: nachher.varianteKennung,
    eingabeFingerabdruck: vorher.eingabeFingerabdruck,
    entscheidungsVergleiche: Object.freeze(entscheidungsVergleiche),
    geaenderteEntscheidungen: geaenderte.length,
    verbesserungen: entscheidungsVergleiche.filter((eintrag) => eintrag.bewertung === 'verbessert').length,
    verschlechterungen: entscheidungsVergleiche.filter((eintrag) => eintrag.bewertung === 'verschlechtert').length,
    sicherheitsverletzungen: entscheidungsVergleiche.filter((eintrag) => eintrag.bewertung === 'sicherheitsverletzung').length,
    identisch: geaenderte.length === 0 && vorher.ausgabeFingerabdruck === nachher.ausgabeFingerabdruck
  });
}
