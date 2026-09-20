export interface KritischerAlert {
  readonly schemaVersion: 1;
  readonly alertId: string;
  readonly dedupeSchluessel: string;
  readonly schweregrad: "KRITISCH";
  readonly erstelltAmMs: number;
  readonly art: string;
  readonly inhalt: Readonly<Record<string, unknown>>;
}

export interface AlertPersistenzBestaetigung {
  readonly durable: true;
  readonly alertId: string;
  readonly bestaetigungsId: string;
}

export interface KritischerAlertSpoolPort {
  speichereDurable(alert: KritischerAlert): Promise<AlertPersistenzBestaetigung>;
  claimDurable(alertId: string): Promise<{ readonly claimed: boolean }>;
}

export interface PersistierterAlertClaim {
  readonly alertId: string;
  readonly persistedBeforeClaim: true;
  readonly claimed: boolean;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

export class KritischerAlertKoordinator {
  readonly #spool: KritischerAlertSpoolPort;

  public constructor(spool: KritischerAlertSpoolPort) {
    this.#spool = spool;
  }

  public async persistiereVorClaim(
    alert: KritischerAlert,
  ): Promise<PersistierterAlertClaim> {
    if (alert.schemaVersion !== 1) throw new Error("ALERT_SCHEMA_UNGUELTIG");
    pruefeText(alert.alertId, "ALERT_ID_UNGUELTIG");
    pruefeText(alert.dedupeSchluessel, "ALERT_DEDUPE_UNGUELTIG");
    pruefeText(alert.art, "ALERT_ART_UNGUELTIG");
    if (!Number.isSafeInteger(alert.erstelltAmMs) || alert.erstelltAmMs < 0) {
      throw new Error("ALERT_ZEIT_UNGUELTIG");
    }

    const bestaetigung = await this.#spool.speichereDurable(alert);
    if (bestaetigung.durable !== true || bestaetigung.alertId !== alert.alertId) {
      throw new Error("ALERT_DURABILITY_NICHT_BESTAETIGT");
    }

    const claim = await this.#spool.claimDurable(alert.alertId);
    return Object.freeze({
      alertId: alert.alertId,
      persistedBeforeClaim: true,
      claimed: claim.claimed,
    });
  }
}
