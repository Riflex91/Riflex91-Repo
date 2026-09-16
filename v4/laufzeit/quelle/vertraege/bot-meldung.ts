export const MELDUNGS_STUFEN = ['hinweis', 'warnung', 'fehler', 'kritisch'] as const;
export type MeldungsStufe = (typeof MELDUNGS_STUFEN)[number];

export interface BotMeldung {
  readonly kennung: string;
  readonly zeitpunkt: number;
  readonly stufe: MeldungsStufe;
  readonly meldungsCode: string;
  readonly titel: string;
  readonly wasIstPassiert: string;
  readonly warumIstEsPassiert: string;
  readonly wasHatDerBotGetan: string;
  readonly mussNutzerHandeln: boolean;
  readonly wasSollDerNutzerTun: string;
  readonly technischeDetails?: Readonly<Record<string, unknown>>;
}

export function erstelleBotMeldung(meldung: BotMeldung): Readonly<BotMeldung> {
  const pflichtTexte = [
    meldung.meldungsCode,
    meldung.titel,
    meldung.wasIstPassiert,
    meldung.warumIstEsPassiert,
    meldung.wasHatDerBotGetan,
    meldung.wasSollDerNutzerTun
  ];
  if (pflichtTexte.some((text) => text.trim().length === 0)) {
    throw new Error('Bot-Meldungen muessen erklaeren, was passiert ist, warum es passiert ist, was der Bot getan hat und was der Nutzer tun soll.');
  }
  return Object.freeze({ ...meldung });
}

export function formatiereBotMeldung(meldung: BotMeldung): string {
  const stufe = meldung.stufe.toUpperCase();
  const handeln = meldung.mussNutzerHandeln ? 'JA' : 'NEIN';
  return [
    `[${stufe}] ${meldung.meldungsCode} – ${meldung.titel}`,
    `Was ist passiert: ${meldung.wasIstPassiert}`,
    `Warum: ${meldung.warumIstEsPassiert}`,
    `Bot-Reaktion: ${meldung.wasHatDerBotGetan}`,
    `Nutzer muss handeln: ${handeln}`,
    `Was soll ich tun: ${meldung.wasSollDerNutzerTun}`
  ].join('\n');
}
