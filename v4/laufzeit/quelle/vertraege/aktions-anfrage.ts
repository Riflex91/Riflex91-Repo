import type { RessourcenName } from './ressourcen-sperre.js';

export const AKTIONS_WICHTIGKEITEN = ['notfall', 'sicherheit', 'normal', 'hintergrund'] as const;
export type AktionsWichtigkeit = (typeof AKTIONS_WICHTIGKEITEN)[number];

export interface AktionsAnfrage<TDetails = unknown> {
  readonly kennung: string;
  readonly angefordertVon: string;
  readonly aktion: string;
  readonly wichtigkeit: AktionsWichtigkeit;
  readonly prioritaet: number;
  readonly angefordertAm: number;
  readonly gueltigBis?: number;
  readonly benoetigteRessourcen: readonly RessourcenName[];
  readonly grund: string;
  readonly details: TDetails;
}
