import type {
  DurableBestaetigung,
  PersistenzPort,
} from "../persistenz/ports.js";
import {
  serialisiereBeobachtungsHistorie,
  type BeobachtungsHistorieSnapshot,
} from "./beobachtungs-evidence.js";

export class BeobachtungsEvidenceAblage {
  readonly #persistenz: PersistenzPort;

  public constructor(persistenz: PersistenzPort) {
    this.#persistenz = persistenz;
  }

  public async speichereSnapshotDurable(
    snapshotKennung: string,
    snapshot: BeobachtungsHistorieSnapshot,
  ): Promise<DurableBestaetigung> {
    if (!/^[A-Za-z0-9._-]+$/.test(snapshotKennung)) {
      throw new Error("BEOBACHTUNGS_EVIDENCE_SNAPSHOT_KENNUNG_UNGUELTIG");
    }
    if (snapshot.schemaVersion !== 1
        || snapshot.art !== "BEGRENZTE_BEOBACHTUNGSHISTORIE"
        || snapshot.ausfuehrungsAutoritaet !== false
        || snapshot.eintraege.length > snapshot.maximaleEintraege) {
      throw new Error("BEOBACHTUNGS_EVIDENCE_SNAPSHOT_UNGUELTIG");
    }

    const kanonischesJson = serialisiereBeobachtungsHistorie(snapshot);
    return this.#persistenz.speichereDurable(Object.freeze({
      schemaVersion: 1,
      datensatzId: "beobachtung-" + snapshotKennung,
      art: "BEOBACHTUNGS_EVIDENCE",
      inhalt: kanonischesJson,
    }));
  }
}
