export interface AktionsErgebnis<TDetails = unknown> {
  readonly aktionsAnfrageKennung: string;
  readonly ablaufKennung: string;
  readonly erfolgreich: boolean;
  readonly grund: string;
  readonly gestartetAm: number;
  readonly beendetAm: number;
  readonly details?: TDetails;
}
