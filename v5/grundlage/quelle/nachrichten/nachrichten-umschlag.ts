export interface NachrichtenUmschlag<T> {
  readonly protokollVersion: 1;
  readonly nachrichtenId: string;
  readonly erzeugtAmMs: number;
  readonly gueltigBisMs: number;
  readonly dedupeSchluessel: string;
  readonly inhalt: T;
}

export function istNachrichtGueltig<T>(
  nachricht: NachrichtenUmschlag<T>,
  jetztMs: number,
): boolean {
  return nachricht.protokollVersion === 1
    && nachricht.nachrichtenId.length > 0
    && nachricht.dedupeSchluessel.length > 0
    && nachricht.erzeugtAmMs <= jetztMs
    && nachricht.gueltigBisMs >= jetztMs;
}
