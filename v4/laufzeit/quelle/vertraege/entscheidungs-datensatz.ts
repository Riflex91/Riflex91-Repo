export interface EntscheidungsMoeglichkeit {
  readonly kennung: string;
  readonly erlaubt: boolean;
  readonly grund: string;
}

export interface EntscheidungsDatensatz<
  TSituation = unknown,
  TErwartetesErgebnis = unknown,
  TTatsaechlichesErgebnis = unknown
> {
  readonly schemaVersion: 1;
  readonly art: string;
  readonly entscheidungKennung: string;
  readonly ablaufKennung: string;
  readonly quelle: string;
  readonly zeitpunkt: number;
  readonly eingabeFingerabdruck: string;
  readonly fachlicherFingerabdruck: string;
  readonly situation: TSituation;
  readonly erkannteEreignisse: readonly string[];
  readonly moeglichkeiten: readonly EntscheidungsMoeglichkeit[];
  readonly gewaehlteEntscheidung: string;
  readonly grund: string;
  readonly erwartetesErgebnis: TErwartetesErgebnis;
  readonly aktionsAnfrageKennungen: readonly string[];
  readonly tatsaechlichesErgebnis: TTatsaechlichesErgebnis | null;
}
