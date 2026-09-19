export const ERLAUBTE_HOST_BEFEHLE = Object.freeze([
  "STATUS_LESEN",
  "PROZESS_STARTEN",
  "PROZESS_STOPPEN",
  "PROZESS_NEUSTART_ANFORDERN",
  "ALERT_UEBERTRAGEN",
  "WISSENSSTATUS_LESEN",
] as const);

export type HostBefehl = (typeof ERLAUBTE_HOST_BEFEHLE)[number];

export interface HostStatus {
  readonly prozessLaeuft: boolean;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

export function istErlaubterHostBefehl(wert: string): wert is HostBefehl {
  return (ERLAUBTE_HOST_BEFEHLE as readonly string[]).includes(wert);
}
