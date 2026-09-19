export interface AusfuehrungsFreigabe {
  readonly schemaVersion: 1;
  readonly freigabeId: string;
  readonly auftragId: string;
  readonly faehigkeit: string;
  readonly owner: string;
  readonly ressourcenEpoche: number;
  readonly ausgestelltAmMs: number;
  readonly gueltigBisMs: number;
  readonly operatorErlaubt: boolean;
  readonly vorbedingungenBestaetigt: boolean;
  readonly ressourcenBestaetigt: boolean;
  readonly kanalBestaetigt: boolean;
  readonly budgetBestaetigt: boolean;
  readonly intentDurable: boolean;
}

export interface ErwarteteAusfuehrung {
  readonly auftragId: string;
  readonly faehigkeit: string;
  readonly owner: string;
  readonly ressourcenEpoche: number;
  readonly jetztMs: number;
}

export type FreigabePruefung =
  | { readonly erlaubt: true }
  | { readonly erlaubt: false; readonly grund: string };

export function pruefeAusfuehrungsFreigabe(
  freigabe: AusfuehrungsFreigabe | undefined,
  erwartet: ErwarteteAusfuehrung,
): FreigabePruefung {
  if (freigabe === undefined) return { erlaubt: false, grund: "FREIGABE_FEHLT" };
  if (freigabe.schemaVersion !== 1) return { erlaubt: false, grund: "FREIGABE_SCHEMA_UNGUELTIG" };
  if (freigabe.auftragId !== erwartet.auftragId) return { erlaubt: false, grund: "AUFTRAG_STIMMT_NICHT" };
  if (freigabe.faehigkeit !== erwartet.faehigkeit) return { erlaubt: false, grund: "FAEHIGKEIT_STIMMT_NICHT" };
  if (freigabe.owner !== erwartet.owner) return { erlaubt: false, grund: "OWNER_STIMMT_NICHT" };
  if (freigabe.ressourcenEpoche !== erwartet.ressourcenEpoche) return { erlaubt: false, grund: "RESSOURCEN_EPOCHE_STALE" };
  if (freigabe.ausgestelltAmMs > erwartet.jetztMs) return { erlaubt: false, grund: "FREIGABE_AUS_ZUKUNFT" };
  if (freigabe.gueltigBisMs < erwartet.jetztMs) return { erlaubt: false, grund: "FREIGABE_ABGELAUFEN" };
  if (!freigabe.operatorErlaubt) return { erlaubt: false, grund: "OPERATOR_DENY" };
  if (!freigabe.vorbedingungenBestaetigt) return { erlaubt: false, grund: "VORBEDINGUNGEN_FEHLEN" };
  if (!freigabe.ressourcenBestaetigt) return { erlaubt: false, grund: "RESSOURCEN_FEHLEN" };
  if (!freigabe.kanalBestaetigt) return { erlaubt: false, grund: "ACTION_KANAL_FEHLT" };
  if (!freigabe.budgetBestaetigt) return { erlaubt: false, grund: "BUDGET_FEHLT" };
  if (!freigabe.intentDurable) return { erlaubt: false, grund: "DURABLE_INTENT_FEHLT" };
  return { erlaubt: true };
}
