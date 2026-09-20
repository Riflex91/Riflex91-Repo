import fs from "node:fs/promises";
import { performance } from "node:perf_hooks";

export const V5_PRODUKTIONS_STORAGE_HEALTH_ID = "produktiver-speicher";

function pruefeGanzzahl(wert, minimum, maximum, fehler) {
  if (!Number.isSafeInteger(wert) || wert < minimum || wert > maximum) {
    throw new Error(fehler);
  }
}

function pruefeText(wert, maximum, fehler) {
  if (typeof wert !== "string"
      || wert.trim().length === 0
      || wert.length > maximum) {
    throw new Error(fehler);
  }
}

function freieBytesAlsSichereZahl(stat) {
  const bytes = stat.bavail * stat.bsize;
  const maximum = BigInt(Number.MAX_SAFE_INTEGER);
  return Number(bytes > maximum ? maximum : bytes);
}

export class NodeProduktionsOperationsQuelle {
  #dateisystem;
  #healthId;
  #gueltigkeitMs;
  #minimaleFreieBytes;
  #maximaleIoLatenzMs;

  constructor(dateisystem, {
    healthId = V5_PRODUKTIONS_STORAGE_HEALTH_ID,
    gueltigkeitMs = 30_000,
    minimaleFreieBytes = 1_000_000_000,
    maximaleIoLatenzMs = 250,
  } = {}) {
    if (dateisystem === null
        || typeof dateisystem !== "object"
        || typeof dateisystem.wurzel !== "string"
        || typeof dateisystem.schreibeAtomarDurable !== "function") {
      throw new Error("PRODUKTIONS_OPERATIONS_DATEISYSTEM_UNGUELTIG");
    }
    pruefeText(
      healthId,
      128,
      "PRODUKTIONS_OPERATIONS_HEALTH_ID_UNGUELTIG",
    );
    pruefeGanzzahl(
      gueltigkeitMs,
      1_000,
      300_000,
      "PRODUKTIONS_OPERATIONS_GUELTIGKEIT_UNGUELTIG",
    );
    pruefeGanzzahl(
      minimaleFreieBytes,
      1,
      Number.MAX_SAFE_INTEGER,
      "PRODUKTIONS_OPERATIONS_FREIE_BYTES_GRENZE_UNGUELTIG",
    );
    if (!Number.isFinite(maximaleIoLatenzMs)
        || maximaleIoLatenzMs <= 0
        || maximaleIoLatenzMs > 60_000) {
      throw new Error("PRODUKTIONS_OPERATIONS_IO_LATENZ_GRENZE_UNGUELTIG");
    }

    this.#dateisystem = dateisystem;
    this.#healthId = healthId;
    this.#gueltigkeitMs = gueltigkeitMs;
    this.#minimaleFreieBytes = minimaleFreieBytes;
    this.#maximaleIoLatenzMs = maximaleIoLatenzMs;
  }

  async beobachte(jetztMs) {
    pruefeGanzzahl(
      jetztMs,
      0,
      Number.MAX_SAFE_INTEGER - this.#gueltigkeitMs,
      "PRODUKTIONS_OPERATIONS_ZEIT_UNGUELTIG",
    );

    const evidenceId = "HOST-STORAGE:" + jetztMs;
    const gueltigBisMs = jetztMs + this.#gueltigkeitMs;
    let ioLatenzMs = null;
    let freieBytes = null;

    try {
      const start = performance.now();
      await this.#dateisystem.schreibeAtomarDurable(
        "runtime/health/storage-probe.json",
        JSON.stringify({
          schemaVersion: 1,
          healthId: this.#healthId,
          beobachtetAmMs: jetztMs,
        }) + "\n",
        "storage-health-" + jetztMs,
      );
      ioLatenzMs = Math.max(0, performance.now() - start);

      const stat = await fs.statfs(this.#dateisystem.wurzel, {
        bigint: true,
      });
      freieBytes = freieBytesAlsSichereZahl(stat);

      const degradiert = freieBytes < this.#minimaleFreieBytes
        || ioLatenzMs > this.#maximaleIoLatenzMs;

      return Object.freeze({
        schemaVersion: 1,
        healthEvidence: Object.freeze([
          Object.freeze({
            healthId: this.#healthId,
            zustand: degradiert ? "DEGRADIERT" : "GESUND",
            beobachtetAmMs: jetztMs,
            gueltigBisMs,
            evidenceId,
          }),
        ]),
        operationsMetrik: Object.freeze({
          schemaVersion: 1,
          zeitMs: jetztMs,
          ssdIoLatenzMs: ioLatenzMs,
          ioQueueTiefe: null,
          backpressureAktiv: degradiert,
          freieBytes,
          recorderDrops: 0,
        }),
      });
    } catch {
      return Object.freeze({
        schemaVersion: 1,
        healthEvidence: Object.freeze([
          Object.freeze({
            healthId: this.#healthId,
            zustand: "KRITISCH",
            beobachtetAmMs: jetztMs,
            gueltigBisMs,
            evidenceId,
          }),
        ]),
        operationsMetrik: Object.freeze({
          schemaVersion: 1,
          zeitMs: jetztMs,
          ssdIoLatenzMs: ioLatenzMs,
          ioQueueTiefe: null,
          backpressureAktiv: true,
          freieBytes,
          recorderDrops: 0,
        }),
      });
    }
  }
}
