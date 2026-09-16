export const BEDIEN_RISIKEN = ['unkritisch', 'vorsicht', 'kritisch'] as const;
export type BedienRisiko = (typeof BEDIEN_RISIKEN)[number];

export interface BedienVoraussetzung {
  readonly kennung: string;
  readonly beschreibung: string;
  readonly erfuellt: boolean;
  readonly hilfeWennNichtErfuellt: string;
}

export interface BedienAnfrage {
  readonly kennung: string;
  readonly aktion: string;
  readonly titel: string;
  readonly erklaerung: string;
  readonly auswirkung: string;
  readonly risiko: BedienRisiko;
  readonly angefordertAm: number;
  readonly voraussetzungen: readonly BedienVoraussetzung[];
  readonly ausdruecklichBestaetigt?: boolean;
  readonly eingegebenerBestaetigungsText?: string;
  readonly erforderlicherBestaetigungsText?: string;
}

export interface BedienEntscheidung {
  readonly erlaubt: boolean;
  readonly brauchtBestaetigung: boolean;
  readonly grund: string;
  readonly fehlendeVoraussetzungen: readonly BedienVoraussetzung[];
}
