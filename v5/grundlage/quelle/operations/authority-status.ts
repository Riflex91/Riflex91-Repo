export interface AutoritaetsStatus {
  readonly schemaVersion: 1;
  readonly authorityId: string;
  readonly capabilityId: string;
  readonly ownerModulId: string;
  readonly aktiv: boolean;
  readonly grund: string;
  readonly policyId: string;
  readonly evidenceIds: readonly string[];
  readonly ressourcenIds: readonly string[];
  readonly erwarteteWirkung: string;
  readonly ausgestelltAmMs: number;
  readonly gueltigBisMs: number;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 256) throw new Error(fehler);
}

function friere(status: AutoritaetsStatus): AutoritaetsStatus {
  return Object.freeze({
    ...status,
    evidenceIds: Object.freeze([...status.evidenceIds].sort()),
    ressourcenIds: Object.freeze([...status.ressourcenIds].sort()),
  });
}

export class AutoritaetsStatusRegister {
  readonly #maximum: number;
  #werte: readonly AutoritaetsStatus[] = Object.freeze([]);

  public constructor(maximum = 256) {
    if (!Number.isInteger(maximum) || maximum < 1 || maximum > 4096) {
      throw new Error("AUTORITAETS_STATUS_GRENZE_UNGUELTIG");
    }
    this.#maximum = maximum;
  }

  public setze(status: AutoritaetsStatus): void {
    if (status.schemaVersion !== 1) throw new Error("AUTORITAETS_STATUS_SCHEMA_UNGUELTIG");
    for (const [wert, fehler] of [
      [status.authorityId, "AUTORITAETS_ID_UNGUELTIG"],
      [status.capabilityId, "AUTORITAETS_CAPABILITY_UNGUELTIG"],
      [status.ownerModulId, "AUTORITAETS_OWNER_UNGUELTIG"],
      [status.grund, "AUTORITAETS_GRUND_UNGUELTIG"],
      [status.policyId, "AUTORITAETS_POLICY_UNGUELTIG"],
      [status.erwarteteWirkung, "AUTORITAETS_WIRKUNG_UNGUELTIG"],
    ] as const) pruefeText(wert, fehler);
    if (status.evidenceIds.length < 1 || status.evidenceIds.length > 64) {
      throw new Error("AUTORITAETS_EVIDENCE_ANZAHL_UNGUELTIG");
    }
    if (status.ressourcenIds.length > 64) {
      throw new Error("AUTORITAETS_RESSOURCEN_ANZAHL_UNGUELTIG");
    }
    if (!Number.isSafeInteger(status.ausgestelltAmMs)
        || !Number.isSafeInteger(status.gueltigBisMs)
        || status.gueltigBisMs < status.ausgestelltAmMs) {
      throw new Error("AUTORITAETS_ZEIT_UNGUELTIG");
    }

    const alt = this.#werte.find(x => x.authorityId === status.authorityId);
    if (alt === undefined && this.#werte.length >= this.#maximum) {
      throw new Error("AUTORITAETS_STATUS_REGISTER_VOLL");
    }
    const neu = friere(status);
    this.#werte = Object.freeze(
      alt === undefined
        ? [...this.#werte, neu]
        : this.#werte.map(x => x.authorityId === status.authorityId ? neu : x),
    );
  }

  public sicht(jetztMs: number): readonly AutoritaetsStatus[] {
    if (!Number.isSafeInteger(jetztMs) || jetztMs < 0) {
      throw new Error("AUTORITAETS_STATUS_ZEIT_UNGUELTIG");
    }
    return Object.freeze(
      this.#werte
        .map(x => x.gueltigBisMs < jetztMs ? friere({ ...x, aktiv: false }) : friere(x))
        .sort((a, b) => a.authorityId.localeCompare(b.authorityId)),
    );
  }
}
