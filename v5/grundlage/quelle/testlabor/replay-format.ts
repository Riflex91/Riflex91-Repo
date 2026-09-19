import type { ReplaySnapshot } from "./replay-aufzeichnung.js";
import { kanonischSerialisieren } from "../kern/kanonische-serialisierung.js";

function istSha256(wert: string): boolean {
  return /^[0-9a-f]{64}$/i.test(wert);
}

function istGitSha(wert: string): boolean {
  return /^[0-9a-f]{40}$/i.test(wert);
}

export function validiereReplaySnapshot(snapshot: ReplaySnapshot): void {
  if (snapshot.kopf.schemaVersion !== 1) throw new Error("REPLAY_SCHEMA_UNGUELTIG");
  if (!istGitSha(snapshot.kopf.buildGitSha)) throw new Error("REPLAY_BUILD_SHA_UNGUELTIG");
  if (!istSha256(snapshot.kopf.wissensSnapshotSha256)) throw new Error("REPLAY_WISSEN_SHA_UNGUELTIG");
  if (!istSha256(snapshot.kopf.konfigurationSha256)) throw new Error("REPLAY_KONFIGURATION_SHA_UNGUELTIG");
  if (!Number.isInteger(snapshot.verworfenWegenGrenze) || snapshot.verworfenWegenGrenze < 0) {
    throw new Error("REPLAY_VERWORFEN_ZAEHLER_UNGUELTIG");
  }

  let erwarteteSequenz = 1;
  let letzteZeit = Number.NEGATIVE_INFINITY;
  const ids = new Set<string>();

  for (const eintrag of snapshot.eintraege) {
    if (eintrag.schemaVersion !== 1) throw new Error("REPLAY_EINTRAG_SCHEMA_UNGUELTIG");
    if (eintrag.sequenz !== erwarteteSequenz) throw new Error("REPLAY_SEQUENZ_LUECKE");
    if (!Number.isFinite(eintrag.zeitMs) || eintrag.zeitMs < letzteZeit) {
      throw new Error("REPLAY_ZEIT_NICHT_MONOTON");
    }
    if (eintrag.eintragId.trim().length === 0 || ids.has(eintrag.eintragId)) {
      throw new Error("REPLAY_EINTRAG_ID_UNGUELTIG");
    }
    if (eintrag.art.trim().length === 0) throw new Error("REPLAY_ART_FEHLT");

    ids.add(eintrag.eintragId);
    erwarteteSequenz += 1;
    letzteZeit = eintrag.zeitMs;
  }
}

export function serialisiereReplaySnapshot(snapshot: ReplaySnapshot): string {
  validiereReplaySnapshot(snapshot);
  return kanonischSerialisieren(snapshot);
}
