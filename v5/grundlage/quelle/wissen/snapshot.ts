import { kanonischSerialisieren } from "../kern/kanonische-serialisierung.js";
import type {
  GepinnterWissensSnapshot,
  WissensSnapshot,
  WissensSnapshotDatei,
} from "./typen.js";

export interface HashPrueferPort {
  istSha256Gueltig(inhalt: string, erwarteterSha256: string): boolean;
}

export interface WissensSnapshotGrenzen {
  readonly maximaleDateien: number;
  readonly maximaleKanonischeZeichenJeDatei: number;
}

const SHA256_MUSTER = /^[a-f0-9]{64}$/;
const PFAD_MUSTER = /^[A-Za-z0-9._/-]+$/;

function validiereGrenzen(grenzen: WissensSnapshotGrenzen): void {
  if (!Number.isInteger(grenzen.maximaleDateien)
      || grenzen.maximaleDateien < 1
      || grenzen.maximaleDateien > 100_000) {
    throw new Error("WISSEN_SNAPSHOT_DATEIGRENZE_UNGUELTIG");
  }
  if (!Number.isInteger(grenzen.maximaleKanonischeZeichenJeDatei)
      || grenzen.maximaleKanonischeZeichenJeDatei < 2
      || grenzen.maximaleKanonischeZeichenJeDatei > 10_000_000) {
    throw new Error("WISSEN_SNAPSHOT_INHALTSGRENZE_UNGUELTIG");
  }
}

function validierePfad(pfad: string): void {
  if (pfad.length < 1 || pfad.length > 500
      || pfad.startsWith("/") || pfad.startsWith("../")
      || pfad.includes("/../") || pfad.includes(":")
      || !PFAD_MUSTER.test(pfad)) {
    throw new Error("WISSEN_SNAPSHOT_PFAD_UNGUELTIG");
  }
}

function validiereDatei(
  datei: WissensSnapshotDatei,
  hashPruefer: HashPrueferPort,
  grenzen: WissensSnapshotGrenzen,
): WissensSnapshotDatei {
  if (datei.schemaVersion !== 1) throw new Error("WISSEN_SNAPSHOT_DATEI_SCHEMA_UNTERSTUETZT_NICHT");
  validierePfad(datei.relativerPfad);
  if (!SHA256_MUSTER.test(datei.sha256)) throw new Error("WISSEN_SNAPSHOT_DATEI_HASH_FORMAT_UNGUELTIG");
  if (datei.kanonischerInhalt.length > grenzen.maximaleKanonischeZeichenJeDatei) {
    throw new Error("WISSEN_SNAPSHOT_DATEI_ZU_GROSS");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(datei.kanonischerInhalt);
  } catch {
    throw new Error("WISSEN_SNAPSHOT_DATEI_JSON_KORRUPT");
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("WISSEN_SNAPSHOT_DATEI_FORMAT_UNGUELTIG");
  }
  if ((parsed as Record<string, unknown>).schemaVersion !== datei.schemaVersion) {
    throw new Error("WISSEN_SNAPSHOT_DATEI_SCHEMA_WIDERSPRUCH");
  }
  if (kanonischSerialisieren(parsed) !== datei.kanonischerInhalt) {
    throw new Error("WISSEN_SNAPSHOT_DATEI_NICHT_KANONISCH");
  }
  if (!hashPruefer.istSha256Gueltig(datei.kanonischerInhalt, datei.sha256)) {
    throw new Error("WISSEN_SNAPSHOT_DATEI_HASH_FALSCH");
  }
  return Object.freeze({ ...datei });
}

function validiereEindeutigePfade(dateien: readonly WissensSnapshotDatei[]): void {
  const pfade = dateien.map(datei => datei.relativerPfad).sort();
  for (let index = 1; index < pfade.length; index += 1) {
    if (pfade[index] === pfade[index - 1]) throw new Error("WISSEN_SNAPSHOT_DOPPELTER_PFAD");
  }
}

export function pinneWissensSnapshot(
  snapshot: WissensSnapshot,
  hashPruefer: HashPrueferPort,
  grenzen: WissensSnapshotGrenzen,
): GepinnterWissensSnapshot {
  validiereGrenzen(grenzen);
  if (snapshot.schemaVersion !== 1) throw new Error("WISSEN_SNAPSHOT_SCHEMA_UNTERSTUETZT_NICHT");
  if (snapshot.snapshotKennung.length < 1 || snapshot.snapshotKennung.length > 200) {
    throw new Error("WISSEN_SNAPSHOT_KENNUNG_UNGUELTIG");
  }
  if (!Number.isSafeInteger(snapshot.generation) || snapshot.generation < 0) {
    throw new Error("WISSEN_SNAPSHOT_GENERATION_UNGUELTIG");
  }
  if (!["STRUKTURIERTE_WISSENSBASIS", "LOKALES_LIVE_WISSEN", "GITHUB_LIVE_SPIEGEL"]
    .includes(snapshot.quelle)) {
    throw new Error("WISSEN_SNAPSHOT_QUELLE_UNGUELTIG");
  }
  if (snapshot.autoritaet !== "PLANUNGSNACHWEIS" || snapshot.ausfuehrungsAutoritaet !== false) {
    throw new Error("WISSEN_SNAPSHOT_AUTORITAET_UNGUELTIG");
  }
  if (!SHA256_MUSTER.test(snapshot.snapshotSha256)) throw new Error("WISSEN_SNAPSHOT_HASH_FORMAT_UNGUELTIG");
  if (snapshot.dateien.length > grenzen.maximaleDateien) throw new Error("WISSEN_SNAPSHOT_ZU_VIELE_DATEIEN");

  const dateien = Object.freeze(snapshot.dateien.map(datei =>
    validiereDatei(datei, hashPruefer, grenzen)));
  validiereEindeutigePfade(dateien);

  const hashGrundlage = kanonischSerialisieren({
    schemaVersion: snapshot.schemaVersion,
    snapshotKennung: snapshot.snapshotKennung,
    generation: snapshot.generation,
    quelle: snapshot.quelle,
    autoritaet: snapshot.autoritaet,
    ausfuehrungsAutoritaet: snapshot.ausfuehrungsAutoritaet,
    dateien: dateien.map(datei => ({
      schemaVersion: datei.schemaVersion,
      relativerPfad: datei.relativerPfad,
      sha256: datei.sha256,
      kanonischerInhalt: datei.kanonischerInhalt,
    })),
  });
  if (!hashPruefer.istSha256Gueltig(hashGrundlage, snapshot.snapshotSha256)) {
    throw new Error("WISSEN_SNAPSHOT_HASH_FALSCH");
  }

  return Object.freeze({
    ...snapshot,
    dateien,
    gepinnt: true,
    ausfuehrungsAutoritaet: false,
  });
}
