export type PrioritaetsKlasse =
  | "SICHERHEIT"
  | "NOTFALL"
  | "HOCH"
  | "NORMAL"
  | "NIEDRIG";

const RANG: Readonly<Record<PrioritaetsKlasse, number>> = Object.freeze({
  SICHERHEIT: 0,
  NOTFALL: 10,
  HOCH: 20,
  NORMAL: 30,
  NIEDRIG: 40,
});

export function prioritaetsRang(klasse: PrioritaetsKlasse): number {
  return RANG[klasse];
}

export function hatVorrang(
  links: PrioritaetsKlasse,
  rechts: PrioritaetsKlasse,
): boolean {
  return prioritaetsRang(links) < prioritaetsRang(rechts);
}
