import type { BeobachtungsHistorieSnapshot } from "../wissen/beobachtungs-evidence.js";
import type {
  ReplayKopf,
  ReplaySnapshot,
} from "./replay-aufzeichnung.js";
import { validiereReplaySnapshot } from "./replay-format.js";

export function erzeugeReplayAusBeobachtungsEvidence(
  kopf: ReplayKopf,
  historie: BeobachtungsHistorieSnapshot,
): ReplaySnapshot {
  if (historie.schemaVersion !== 1
      || historie.art !== "BEGRENZTE_BEOBACHTUNGSHISTORIE"
      || historie.ausfuehrungsAutoritaet !== false) {
    throw new Error("EVIDENCE_REPLAY_HISTORIE_UNGUELTIG");
  }
  if (historie.eintraege.length > historie.maximaleEintraege) {
    throw new Error("EVIDENCE_REPLAY_UNBOUNDED");
  }

  const snapshot: ReplaySnapshot = Object.freeze({
    kopf: Object.freeze({ ...kopf }),
    eintraege: Object.freeze(
      historie.eintraege.map((eintrag, index) => Object.freeze({
        schemaVersion: 1,
        sequenz: index + 1,
        eintragId: eintrag.evidenceId,
        zeitMs: eintrag.beobachtetAmMs,
        art: "OBSERVATION_EVIDENCE",
        inhalt: Object.freeze({
          kennung: eintrag.kennung,
          domaene: eintrag.domaene,
          quelle: eintrag.quelle,
          wert: eintrag.wert,
        }),
      })),
    ),
    verworfenWegenGrenze: historie.verworfenWegenGrenze,
  });
  validiereReplaySnapshot(snapshot);
  return snapshot;
}
