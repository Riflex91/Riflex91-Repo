export interface OperationsMetrik {
  readonly schemaVersion: 1;
  readonly zeitMs: number;
  readonly ssdIoLatenzMs: number | null;
  readonly ioQueueTiefe: number | null;
  readonly backpressureAktiv: boolean;
  readonly freieBytes: number | null;
  readonly recorderDrops: number;
}

export interface DashboardSenke {
  veroeffentliche(snapshot: OperationsSnapshot): Promise<void>;
}

export interface OperationsSnapshot {
  readonly schemaVersion: 1;
  readonly metrik: OperationsMetrik;
  readonly dashboardFehler: number;
  readonly verworfeneMetriken: number;
  readonly actionAuthority: false;
}

export class BegrenzteOperationsTelemetrie {
  readonly #maximum: number;
  #werte: readonly OperationsMetrik[] = Object.freeze([]);
  #verworfen = 0;
  #dashboardFehler = 0;

  public constructor(maximum = 1024) {
    if (!Number.isInteger(maximum) || maximum < 1 || maximum > 100_000) {
      throw new Error("OPERATIONS_TELEMETRIE_GRENZE_UNGUELTIG");
    }
    this.#maximum = maximum;
  }

  public erfasse(metrik: OperationsMetrik): boolean {
    if (metrik.schemaVersion !== 1
        || !Number.isSafeInteger(metrik.zeitMs)
        || metrik.zeitMs < 0
        || !Number.isInteger(metrik.recorderDrops)
        || metrik.recorderDrops < 0) {
      throw new Error("OPERATIONS_METRIK_UNGUELTIG");
    }
    if (metrik.ssdIoLatenzMs !== null && (!Number.isFinite(metrik.ssdIoLatenzMs) || metrik.ssdIoLatenzMs < 0)) {
      throw new Error("OPERATIONS_IO_LATENZ_UNGUELTIG");
    }
    if (metrik.ioQueueTiefe !== null && (!Number.isInteger(metrik.ioQueueTiefe) || metrik.ioQueueTiefe < 0)) {
      throw new Error("OPERATIONS_QUEUE_TIEFE_UNGUELTIG");
    }
    if (metrik.freieBytes !== null && (!Number.isSafeInteger(metrik.freieBytes) || metrik.freieBytes < 0)) {
      throw new Error("OPERATIONS_FREIE_BYTES_UNGUELTIG");
    }

    if (this.#werte.length >= this.#maximum) {
      this.#werte = Object.freeze(this.#werte.slice(1));
      this.#verworfen += 1;
    }
    this.#werte = Object.freeze([...this.#werte, Object.freeze({ ...metrik })]);
    return true;
  }

  public snapshot(): OperationsSnapshot {
    const metrik = this.#werte.at(-1);
    if (metrik === undefined) throw new Error("OPERATIONS_METRIK_FEHLT");
    return Object.freeze({
      schemaVersion: 1,
      metrik,
      dashboardFehler: this.#dashboardFehler,
      verworfeneMetriken: this.#verworfen,
      actionAuthority: false,
    });
  }

  public async publiziereBestEffort(senke: DashboardSenke): Promise<void> {
    let snapshot: OperationsSnapshot;
    try {
      snapshot = this.snapshot();
    } catch {
      this.#dashboardFehler += 1;
      return;
    }
    try {
      await senke.veroeffentliche(snapshot);
    } catch {
      this.#dashboardFehler += 1;
    }
  }
}
