export const KAMPF_AKTIONS_BEREITSCHAFT_ZUSTAENDE = ['bereit', 'abklingzeit', 'unbekannt'] as const;
export type KampfAktionsBereitschaftZustand = (typeof KAMPF_AKTIONS_BEREITSCHAFT_ZUSTAENDE)[number];

export interface KampfAktionsBereitschaft {
  readonly schemaVersion: 1;
  readonly aufgenommenAm: number;
  readonly aktionsName: string;
  readonly zustand: KampfAktionsBereitschaftZustand;
  readonly bereitAb: number | null;
  readonly restMillisekunden: number | null;
  readonly grund: string;
}
