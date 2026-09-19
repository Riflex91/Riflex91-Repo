export type SpeicherDatenklasse =
  | "KRITISCHE_PERSISTENZ"
  | "EVIDENZ"
  | "REPLAY"
  | "TELEMETRIE"
  | "CACHE";

export interface SpeicherdruckEntscheidung {
  readonly freiProzent: number;
  readonly gesperrteKlassen: readonly SpeicherDatenklasse[];
  readonly neueWertmutationenErlaubt: boolean;
}

export function bewerteSpeicherdruck(
  freiBytes: number,
  gesamtBytes: number,
): SpeicherdruckEntscheidung {
  if (!Number.isFinite(freiBytes)
      || !Number.isFinite(gesamtBytes)
      || gesamtBytes <= 0
      || freiBytes < 0
      || freiBytes > gesamtBytes) {
    throw new Error("SPEICHERDRUCK_WERTE_UNGUELTIG");
  }

  const freiProzent = (freiBytes / gesamtBytes) * 100;
  let gesperrt: readonly SpeicherDatenklasse[] = Object.freeze([]);

  if (freiProzent < 15) gesperrt = Object.freeze(["CACHE"]);
  if (freiProzent < 10) gesperrt = Object.freeze(["CACHE","TELEMETRIE"]);
  if (freiProzent < 7) gesperrt = Object.freeze(["CACHE","TELEMETRIE","REPLAY"]);
  if (freiProzent < 5) gesperrt = Object.freeze(["CACHE","TELEMETRIE","REPLAY","EVIDENZ"]);
  if (freiProzent < 2) {
    gesperrt = Object.freeze(["CACHE","TELEMETRIE","REPLAY","EVIDENZ","KRITISCHE_PERSISTENZ"]);
  }

  return Object.freeze({
    freiProzent,
    gesperrteKlassen: gesperrt,
    neueWertmutationenErlaubt: !gesperrt.includes("KRITISCHE_PERSISTENZ"),
  });
}
