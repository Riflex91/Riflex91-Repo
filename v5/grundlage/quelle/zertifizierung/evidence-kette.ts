export interface ZertifizierungsMetriken {
  readonly unexpectedGameWrites: number;
  readonly duplicateIrreversibleEffects: number;
  readonly unsafePreemptions: number;
  readonly unverifiedActionUsage: number;
  readonly unresolvedTransactions: number;
  readonly invariantViolations: number;
  readonly recorderDrops: number;
  readonly memoryHistoryEntries: number;
  readonly ssdAktiveBytes: number;
  readonly ssdSegmente: number;
  readonly kritischePersistenzverluste: number;
  readonly hotPathNichtkritischeSsdBlockaden: number;
  readonly freieBytes: number;
  readonly ioQueueTiefe: number;
  readonly ssdIoLatenzMs: number;
}

export interface ZertifizierungsSample {
  readonly schemaVersion: 1;
  readonly sequenz: number;
  readonly zeitMs: number;
  readonly stufe: string;
  readonly vorherigerFingerprint: string | null;
  readonly metrik: ZertifizierungsMetriken;
  readonly evidenceFingerprint: string;
}

export interface ZertifizierungsGrenzen {
  readonly maximalerSampleAbstandMs: number;
  readonly maximaleMemoryHistoryEntries: number;
  readonly maximaleSsdAktiveBytes: number;
  readonly maximaleSsdSegmente: number;
  readonly minimaleFreieBytes: number;
  readonly maximaleIoQueueTiefe: number;
  readonly maximaleSsdIoLatenzMs: number;
}

export interface ZertifizierungsSerienNachweis {
  readonly bestanden: boolean;
  readonly sampleGaps: number;
  readonly fingerprintFehler: number;
  readonly nullToleranzVerletzungen: number;
  readonly ressourcenVerletzungen: number;
  readonly ersterFingerprint: string;
  readonly letzterFingerprint: string;
  readonly unveraenderlicheKette: true;
}

function kanonisch(wert: unknown): string {
  if (wert === null || typeof wert !== "object") return JSON.stringify(wert);
  if (Array.isArray(wert)) return "[" + wert.map(x => kanonisch(x)).join(",") + "]";
  const objekt = wert as Readonly<Record<string, unknown>>;
  return "{" + Object.keys(objekt).sort()
    .map(key => JSON.stringify(key) + ":" + kanonisch(objekt[key]))
    .join(",") + "}";
}

export function evidenceFingerprint(wert: unknown): string {
  const text = kanonisch(wert);
  let hash = 14695981039346656037n;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= BigInt(text.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * 1099511628211n);
  }
  return hash.toString(16).padStart(16, "0");
}

function pruefeNichtNegativ(wert: number, fehler: string): void {
  if (!Number.isFinite(wert) || wert < 0) throw new Error(fehler);
}

export function erstelleZertifizierungsSample(
  sequenz: number,
  zeitMs: number,
  stufe: string,
  vorherigerFingerprint: string | null,
  metrik: ZertifizierungsMetriken,
): ZertifizierungsSample {
  if (!Number.isSafeInteger(sequenz) || sequenz < 1
      || !Number.isSafeInteger(zeitMs) || zeitMs < 0
      || stufe.trim().length === 0 || stufe.length > 64
      || (vorherigerFingerprint !== null && !/^[0-9a-f]{16}$/.test(vorherigerFingerprint))) {
    throw new Error("ZERTIFIZIERUNGS_SAMPLE_KOPF_UNGUELTIG");
  }
  for (const [wert, fehler] of [
    [metrik.unexpectedGameWrites, "ZERT_UNEXPECTED_WRITES_UNGUELTIG"],
    [metrik.duplicateIrreversibleEffects, "ZERT_DUPLICATE_EFFECTS_UNGUELTIG"],
    [metrik.unsafePreemptions, "ZERT_UNSAFE_PREEMPTIONS_UNGUELTIG"],
    [metrik.unverifiedActionUsage, "ZERT_UNVERIFIED_ACTION_UNGUELTIG"],
    [metrik.unresolvedTransactions, "ZERT_UNRESOLVED_UNGUELTIG"],
    [metrik.invariantViolations, "ZERT_INVARIANT_UNGUELTIG"],
    [metrik.recorderDrops, "ZERT_RECORDER_DROPS_UNGUELTIG"],
    [metrik.memoryHistoryEntries, "ZERT_MEMORY_UNGUELTIG"],
    [metrik.ssdAktiveBytes, "ZERT_SSD_BYTES_UNGUELTIG"],
    [metrik.ssdSegmente, "ZERT_SSD_SEGMENTE_UNGUELTIG"],
    [metrik.kritischePersistenzverluste, "ZERT_PERSISTENZVERLUST_UNGUELTIG"],
    [metrik.hotPathNichtkritischeSsdBlockaden, "ZERT_HOTPATH_BLOCK_UNGUELTIG"],
    [metrik.freieBytes, "ZERT_FREIE_BYTES_UNGUELTIG"],
    [metrik.ioQueueTiefe, "ZERT_QUEUE_UNGUELTIG"],
    [metrik.ssdIoLatenzMs, "ZERT_IO_LATENZ_UNGUELTIG"],
  ] as const) pruefeNichtNegativ(wert, fehler);

  const basis = Object.freeze({
    schemaVersion: 1 as const,
    sequenz,
    zeitMs,
    stufe,
    vorherigerFingerprint,
    metrik: Object.freeze({ ...metrik }),
  });
  return Object.freeze({
    ...basis,
    evidenceFingerprint: evidenceFingerprint(basis),
  });
}

export function pruefeZertifizierungsSerie(
  samples: readonly ZertifizierungsSample[],
  grenzen: ZertifizierungsGrenzen,
): ZertifizierungsSerienNachweis {
  if (samples.length < 1 || samples.length > 100_000) {
    throw new Error("ZERTIFIZIERUNGS_SERIE_GROESSE_UNGUELTIG");
  }
  if (!Number.isSafeInteger(grenzen.maximalerSampleAbstandMs) || grenzen.maximalerSampleAbstandMs < 1
      || grenzen.maximaleMemoryHistoryEntries < 1
      || grenzen.maximaleSsdAktiveBytes < 1
      || grenzen.maximaleSsdSegmente < 1
      || grenzen.minimaleFreieBytes < 0
      || grenzen.maximaleIoQueueTiefe < 0
      || grenzen.maximaleSsdIoLatenzMs < 0) {
    throw new Error("ZERTIFIZIERUNGS_GRENZEN_UNGUELTIG");
  }

  let sampleGaps = 0;
  let fingerprintFehler = 0;
  let nullToleranzVerletzungen = 0;
  let ressourcenVerletzungen = 0;

  for (let index = 0; index < samples.length; index += 1) {
    const sample = samples[index];
    if (sample === undefined) throw new Error("ZERTIFIZIERUNGS_SAMPLE_FEHLT");
    const vorher = index === 0 ? undefined : samples[index - 1];
    const erwarteteSequenz = index + 1;
    if (sample.sequenz !== erwarteteSequenz
        || (vorher !== undefined && sample.zeitMs - vorher.zeitMs > grenzen.maximalerSampleAbstandMs)) {
      sampleGaps += 1;
    }
    const erwarteterVorher = vorher?.evidenceFingerprint ?? null;
    if (sample.vorherigerFingerprint !== erwarteterVorher) fingerprintFehler += 1;
    const basis = {
      schemaVersion: sample.schemaVersion,
      sequenz: sample.sequenz,
      zeitMs: sample.zeitMs,
      stufe: sample.stufe,
      vorherigerFingerprint: sample.vorherigerFingerprint,
      metrik: sample.metrik,
    };
    if (sample.evidenceFingerprint !== evidenceFingerprint(basis)) fingerprintFehler += 1;

    const m = sample.metrik;
    if (m.unexpectedGameWrites !== 0
        || m.duplicateIrreversibleEffects !== 0
        || m.unsafePreemptions !== 0
        || m.unverifiedActionUsage !== 0
        || m.unresolvedTransactions !== 0
        || m.invariantViolations !== 0
        || m.recorderDrops !== 0
        || m.kritischePersistenzverluste !== 0
        || m.hotPathNichtkritischeSsdBlockaden !== 0) {
      nullToleranzVerletzungen += 1;
    }
    if (m.memoryHistoryEntries > grenzen.maximaleMemoryHistoryEntries
        || m.ssdAktiveBytes > grenzen.maximaleSsdAktiveBytes
        || m.ssdSegmente > grenzen.maximaleSsdSegmente
        || m.freieBytes < grenzen.minimaleFreieBytes
        || m.ioQueueTiefe > grenzen.maximaleIoQueueTiefe
        || m.ssdIoLatenzMs > grenzen.maximaleSsdIoLatenzMs) {
      ressourcenVerletzungen += 1;
    }
  }

  const erster = samples[0];
  const letzter = samples.at(-1);
  if (erster === undefined || letzter === undefined) throw new Error("ZERTIFIZIERUNGS_SERIE_LEER");
  return Object.freeze({
    bestanden: sampleGaps === 0
      && fingerprintFehler === 0
      && nullToleranzVerletzungen === 0
      && ressourcenVerletzungen === 0,
    sampleGaps,
    fingerprintFehler,
    nullToleranzVerletzungen,
    ressourcenVerletzungen,
    ersterFingerprint: erster.evidenceFingerprint,
    letzterFingerprint: letzter.evidenceFingerprint,
    unveraenderlicheKette: true,
  });
}
