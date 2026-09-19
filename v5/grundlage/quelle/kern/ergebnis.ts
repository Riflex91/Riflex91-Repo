export type FachErgebnis<T, F> =
  | { readonly status: "ERFOLG"; readonly wert: T }
  | { readonly status: "FEHLER"; readonly fehler: F }
  | {
      readonly status: "UNBEKANNT";
      readonly grund: string;
      readonly abgleichErforderlich: true;
    };

export const erfolg = <T>(wert: T): FachErgebnis<T, never> =>
  Object.freeze({ status: "ERFOLG", wert });

export const fehler = <F>(wert: F): FachErgebnis<never, F> =>
  Object.freeze({ status: "FEHLER", fehler: wert });

export const unbekannt = (grund: string): FachErgebnis<never, never> =>
  Object.freeze({
    status: "UNBEKANNT",
    grund,
    abgleichErforderlich: true,
  });
