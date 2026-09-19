export interface SpeicherSchreibAnfrage {
  readonly relativerPfad: string;
  readonly inhalt: string;
  readonly kritisch: boolean;
}

export interface SpeicherPort {
  schreibe(anfrage: SpeicherSchreibAnfrage): Promise<void>;
  lies(relativerPfad: string): Promise<string | undefined>;
}
