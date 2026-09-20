import {
  bewerteKritischeHealth,
  type HealthBewertung,
  type HealthEvidence,
  type KritischeHealthAnforderung,
} from "./health.js";
import type { AutoritaetsStatusRegister, AutoritaetsStatus } from "./authority-status.js";
import type {
  BegrenzteOperationsTelemetrie,
  OperationsSnapshot,
} from "./telemetrie.js";

export interface HeadlessSupervisorStatus {
  readonly schemaVersion: 1;
  readonly health: HealthBewertung;
  readonly autoritaeten: readonly AutoritaetsStatus[];
  readonly operations: OperationsSnapshot | null;
  readonly operationsAktuell: boolean;
  readonly bereit: boolean;
  readonly actionAuthority: false;
}

export class HeadlessOperationsSupervisor {
  readonly #healthAnforderungen: readonly KritischeHealthAnforderung[];
  readonly #authority: AutoritaetsStatusRegister;
  readonly #telemetrie: BegrenzteOperationsTelemetrie;
  readonly #maximalesOperationsAlterMs: number;

  public constructor(
    healthAnforderungen: readonly KritischeHealthAnforderung[],
    authority: AutoritaetsStatusRegister,
    telemetrie: BegrenzteOperationsTelemetrie,
    maximalesOperationsAlterMs = 60_000,
  ) {
    if (healthAnforderungen.length < 1 || healthAnforderungen.length > 256) {
      throw new Error("SUPERVISOR_HEALTH_ANFORDERUNGEN_UNGUELTIG");
    }
    this.#healthAnforderungen = Object.freeze(
      healthAnforderungen.map(x => Object.freeze({ ...x })),
    );
    if (!Number.isSafeInteger(maximalesOperationsAlterMs)
        || maximalesOperationsAlterMs < 1
        || maximalesOperationsAlterMs > 3_600_000) {
      throw new Error("SUPERVISOR_OPERATIONS_ALTER_UNGUELTIG");
    }
    this.#authority = authority;
    this.#telemetrie = telemetrie;
    this.#maximalesOperationsAlterMs = maximalesOperationsAlterMs;
  }

  public status(
    healthEvidence: readonly HealthEvidence[],
    jetztMs: number,
  ): HeadlessSupervisorStatus {
    const health = bewerteKritischeHealth(
      this.#healthAnforderungen,
      healthEvidence,
      jetztMs,
    );
    let operations: OperationsSnapshot | null = null;
    try {
      operations = this.#telemetrie.snapshot();
    } catch {
      operations = null;
    }

    const operationsAktuell = operations !== null
      && operations.metrik.zeitMs <= jetztMs
      && jetztMs - operations.metrik.zeitMs <= this.#maximalesOperationsAlterMs;

    return Object.freeze({
      schemaVersion: 1,
      health,
      autoritaeten: this.#authority.sicht(jetztMs),
      operations,
      operationsAktuell,
      bereit: health.zustand === "GESUND" && operationsAktuell,
      actionAuthority: false,
    });
  }
}
