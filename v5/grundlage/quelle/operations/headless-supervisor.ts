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
  readonly bereit: boolean;
  readonly actionAuthority: false;
}

export class HeadlessOperationsSupervisor {
  readonly #healthAnforderungen: readonly KritischeHealthAnforderung[];
  readonly #authority: AutoritaetsStatusRegister;
  readonly #telemetrie: BegrenzteOperationsTelemetrie;

  public constructor(
    healthAnforderungen: readonly KritischeHealthAnforderung[],
    authority: AutoritaetsStatusRegister,
    telemetrie: BegrenzteOperationsTelemetrie,
  ) {
    if (healthAnforderungen.length < 1 || healthAnforderungen.length > 256) {
      throw new Error("SUPERVISOR_HEALTH_ANFORDERUNGEN_UNGUELTIG");
    }
    this.#healthAnforderungen = Object.freeze(
      healthAnforderungen.map(x => Object.freeze({ ...x })),
    );
    this.#authority = authority;
    this.#telemetrie = telemetrie;
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

    return Object.freeze({
      schemaVersion: 1,
      health,
      autoritaeten: this.#authority.sicht(jetztMs),
      operations,
      bereit: health.zustand === "GESUND" && operations !== null,
      actionAuthority: false,
    });
  }
}
