export const ADVENTURE_LAND_SPIEL = "Adventure Land - The Code MMORPG" as const;

export type WissensQuelle =
  | "STRUKTURIERTE_WISSENSBASIS"
  | "LOKALES_LIVE_WISSEN"
  | "GITHUB_LIVE_SPIEGEL";

export type WissensDomaene =
  | "KERN" | "CHARAKTER" | "INVENTAR" | "SKILL" | "MONSTER" | "MAP"
  | "EVENT" | "QUEST" | "MARKT" | "BANK" | "HANDWERK" | "KAMPF"
  | "NAVIGATION" | "GRUPPE" | "SERVER" | "ITEM" | "NPC";

export interface WissensSnapshotDatei {
  readonly schemaVersion: 1;
  readonly relativerPfad: string;
  readonly sha256: string;
  readonly kanonischerInhalt: string;
}

export interface WissensSnapshot {
  readonly schemaVersion: 1;
  readonly snapshotKennung: string;
  readonly generation: number;
  readonly quelle: WissensQuelle;
  readonly snapshotSha256: string;
  readonly autoritaet: "PLANUNGSNACHWEIS";
  readonly ausfuehrungsAutoritaet: false;
  readonly dateien: readonly WissensSnapshotDatei[];
}

export interface GepinnterWissensSnapshot extends WissensSnapshot {
  readonly gepinnt: true;
}

export interface DefinitionsWissen<T = unknown> {
  readonly art: "DEFINITION";
  readonly kennung: string;
  readonly domaene: WissensDomaene;
  readonly wert: T;
  readonly ausfuehrungsAutoritaet: false;
}

export interface SpielBeobachtung<T = unknown> {
  readonly art: "BEOBACHTUNG";
  readonly nachweisKennung: string;
  readonly kennung: string;
  readonly domaene: WissensDomaene;
  readonly spiel: typeof ADVENTURE_LAND_SPIEL;
  readonly beobachtetAmMs: number;
  readonly maximalAlterMs: number;
  readonly quelle: { readonly art: "LIVE_SPIEL"; readonly methode: string };
  readonly wert: T;
}

export interface LiveVerifizierterFakt<T = unknown> {
  readonly art: "LIVE_VERIFIZIERTER_FAKT";
  readonly nachweisKennung: string;
  readonly kennung: string;
  readonly domaene: WissensDomaene;
  readonly spiel: typeof ADVENTURE_LAND_SPIEL;
  readonly status: "LIVE_VERIFIZIERT";
  readonly beobachtetAmMs: number;
  readonly verifiziertAmMs: number;
  readonly maximalAlterMs: number;
  readonly quelle: { readonly art: "LIVE_SPIEL"; readonly methode: string };
  readonly wert: T;
  readonly autoritaet: "PLANUNGSNACHWEIS";
  readonly ausfuehrungsAutoritaet: false;
}

export type WeltWahrheitsStatus =
  | "BESTAETIGT"
  | "VERALTET"
  | "WIDERSPRUCH"
  | "UNBEKANNT";

export interface AbgeglicheneWeltWahrheit<T = unknown> {
  readonly art: "ABGEGLICHENE_WELTWAHRHEIT";
  readonly kennung: string;
  readonly domaene: WissensDomaene;
  readonly status: WeltWahrheitsStatus;
  readonly wert?: T;
  readonly begruendung: string;
  readonly beobachtetAmMs?: number;
  readonly autoritaet: "PLANUNGSNACHWEIS";
  readonly ausfuehrungsAutoritaet: false;
  readonly mutationAutorisiert: false;
}
