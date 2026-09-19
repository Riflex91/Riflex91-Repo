import { DeterministischerKennungsGenerator } from "../determinismus/kennungen.js";
import { MonotoneSequenz } from "../determinismus/sequenz.js";
import { SimulierteUhr } from "../determinismus/uhr.js";
import { XorShift32Zufall } from "../determinismus/zufall.js";
import { DomaenenEreignisErzeuger } from "../kern/domaenen-ereignis.js";
import { kanonischSerialisieren } from "../kern/kanonische-serialisierung.js";

export interface SzenarioEingabe {
  readonly seed: number;
  readonly startZeitMs: number;
  readonly korrelationsId: string;
  readonly optionen: readonly string[];
}

export function fuehreDeterministischesSzenarioAus(
  eingabe: SzenarioEingabe,
): string {
  if (eingabe.optionen.length === 0 || eingabe.optionen.length > 1_000) {
    throw new Error("SZENARIO_OPTIONEN_UNGUELTIG");
  }

  const uhr = new SimulierteUhr(eingabe.startZeitMs);
  const zufall = new XorShift32Zufall(eingabe.seed);
  const ids = new DeterministischerKennungsGenerator("SZENARIO");
  const sequenz = new MonotoneSequenz();
  const ereignisse = new DomaenenEreignisErzeuger(uhr, ids, sequenz);

  const index = zufall.waehleIndex(eingabe.optionen.length);
  const auswahl = eingabe.optionen[index];
  if (auswahl === undefined) throw new Error("SZENARIO_AUSWAHL_UNGUELTIG");

  const start = ereignisse.erzeuge(
    "SZENARIO_GESTARTET",
    eingabe.korrelationsId,
    { optionsAnzahl: eingabe.optionen.length },
  );

  uhr.schreiteVor(1);

  const entscheidung = ereignisse.erzeuge(
    "OPTION_GEWAEHLT",
    eingabe.korrelationsId,
    { index, auswahl },
    start.ereignisId,
  );

  return kanonischSerialisieren({
    seed: eingabe.seed,
    startZeitMs: eingabe.startZeitMs,
    ereignisse: [start, entscheidung],
  });
}
