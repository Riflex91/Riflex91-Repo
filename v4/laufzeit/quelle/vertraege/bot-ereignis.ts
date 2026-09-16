export interface BotEreignis<TDetails = unknown> {
  readonly kennung: string;
  readonly laufendeNummer: number;
  readonly zeitpunkt: number;
  readonly name: string;
  readonly quelle: string;
  readonly ablaufKennung: string;
  readonly details: TDetails;
}
