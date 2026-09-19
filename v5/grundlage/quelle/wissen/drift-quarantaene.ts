export type WissensDriftArt =
  | "HASH_DRIFT"
  | "SCHEMA_DRIFT"
  | "WIDERSPRUCH"
  | "UNBEKANNTER_INHALT";

export interface WissensDrift {
  readonly art: WissensDriftArt;
  readonly betroffeneFaehigkeiten: readonly string[];
  readonly grund: string;
}

export interface DriftEntscheidung {
  readonly faehigkeitsKennung: string;
  readonly status: "QUARANTAENE" | "UNVERAENDERT";
  readonly automatischeFreigabe: false;
  readonly mutationAutorisiert: false;
  readonly grund: string;
}

export function bewerteDriftFuerFaehigkeit(
  faehigkeitsKennung: string,
  drift: WissensDrift,
): DriftEntscheidung {
  if (faehigkeitsKennung.trim().length === 0) throw new Error("DRIFT_FAEHIGKEIT_FEHLT");
  if (drift.grund.trim().length === 0) throw new Error("DRIFT_GRUND_FEHLT");
  const betroffen = drift.betroffeneFaehigkeiten.includes("*")
    || drift.betroffeneFaehigkeiten.includes(faehigkeitsKennung);
  return Object.freeze({
    faehigkeitsKennung,
    status: betroffen ? "QUARANTAENE" : "UNVERAENDERT",
    automatischeFreigabe: false,
    mutationAutorisiert: false,
    grund: betroffen ? "WISSENSDRIFT:" + drift.art + ":" + drift.grund : "NICHT_BETROFFEN",
  });
}
