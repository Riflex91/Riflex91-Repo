import type { CmUmschlag } from "./cm-protokoll.js";

export type CmAuftragsStatus = "AUSSTEHEND" | "BESTAETIGT" | "ABGESCHLOSSEN";

export interface CmAuftragsSicht {
  readonly schemaVersion: 1;
  readonly auftragNachrichtenId: string;
  readonly workflowId: string;
  readonly workflowRevision: number;
  readonly senderCharacterId: string;
  readonly empfaengerCharacterId: string;
  readonly serverRegion: string;
  readonly serverIdentifier: string;
  readonly gueltigBisMs: number;
  readonly status: CmAuftragsStatus;
}

export interface CmAntwortSnapshot {
  readonly schemaVersion: 1;
  readonly auftraege: readonly CmAuftragsSicht[];
}

export type CmAntwortStatus =
  | "ACK_BESTAETIGT"
  | "SETTLEMENT_ABGESCHLOSSEN"
  | "BEREITS_ABGESCHLOSSEN"
  | "AUFTRAG_UNBEKANNT"
  | "ANTWORT_KORRELATION_UNGUELTIG"
  | "AUFTRAG_ABGELAUFEN";

function istText(wert: string): boolean {
  return wert.trim().length > 0 && wert.length <= 192;
}

function friere(sicht: CmAuftragsSicht): CmAuftragsSicht {
  return Object.freeze({ ...sicht });
}

export class CmAntwortLedger {
  readonly #maximaleAuftraege: number;
  #auftraege: readonly CmAuftragsSicht[] = Object.freeze([]);

  public constructor(maximaleAuftraege = 256) {
    if (!Number.isInteger(maximaleAuftraege) || maximaleAuftraege < 1 || maximaleAuftraege > 2048) {
      throw new Error("CM_ANTWORT_LEDGER_GRENZE_UNGUELTIG");
    }
    this.#maximaleAuftraege = maximaleAuftraege;
  }

  public registriereAuftrag<T>(umschlag: CmUmschlag<T>): CmAuftragsSicht {
    if (umschlag.typ !== "AUFTRAG"
        || !istText(umschlag.nachrichtenId)
        || !istText(umschlag.workflowId)
        || !Number.isSafeInteger(umschlag.workflowRevision)
        || umschlag.workflowRevision < 0
        || !Number.isSafeInteger(umschlag.gueltigBisMs)
        || umschlag.gueltigBisMs < 0) {
      throw new Error("CM_ANTWORT_AUFTRAG_UNGUELTIG");
    }
    const vorhanden = this.#auftraege.find(x => x.auftragNachrichtenId === umschlag.nachrichtenId);
    if (vorhanden !== undefined) return friere(vorhanden);
    if (this.#auftraege.length >= this.#maximaleAuftraege) {
      throw new Error("CM_ANTWORT_LEDGER_VOLL");
    }
    const sicht = friere({
      schemaVersion: 1,
      auftragNachrichtenId: umschlag.nachrichtenId,
      workflowId: umschlag.workflowId,
      workflowRevision: umschlag.workflowRevision,
      senderCharacterId: umschlag.senderCharacterId,
      empfaengerCharacterId: umschlag.empfaengerCharacterId,
      serverRegion: umschlag.serverRegion,
      serverIdentifier: umschlag.serverIdentifier,
      gueltigBisMs: umschlag.gueltigBisMs,
      status: "AUSSTEHEND",
    });
    this.#auftraege = Object.freeze([...this.#auftraege, sicht]);
    return sicht;
  }

  public verarbeiteAntwort<T>(umschlag: CmUmschlag<T>, jetztMs: number): CmAntwortStatus {
    if ((umschlag.typ !== "ACK" && umschlag.typ !== "SETTLEMENT")
        || umschlag.antwortAuf === null
        || !Number.isSafeInteger(jetztMs)
        || jetztMs < 0) {
      return "ANTWORT_KORRELATION_UNGUELTIG";
    }
    const alt = this.#auftraege.find(x => x.auftragNachrichtenId === umschlag.antwortAuf);
    if (alt === undefined) return "AUFTRAG_UNBEKANNT";
    if (jetztMs > alt.gueltigBisMs) return "AUFTRAG_ABGELAUFEN";
    const korreliert = umschlag.workflowId === alt.workflowId
      && umschlag.workflowRevision === alt.workflowRevision
      && umschlag.senderCharacterId === alt.empfaengerCharacterId
      && umschlag.empfaengerCharacterId === alt.senderCharacterId
      && umschlag.serverRegion === alt.serverRegion
      && umschlag.serverIdentifier === alt.serverIdentifier;
    if (!korreliert) return "ANTWORT_KORRELATION_UNGUELTIG";

    if (alt.status === "ABGESCHLOSSEN") return "BEREITS_ABGESCHLOSSEN";
    const status: CmAuftragsStatus = umschlag.typ === "SETTLEMENT" ? "ABGESCHLOSSEN" : "BESTAETIGT";
    const neu = friere({ ...alt, status });
    this.#auftraege = Object.freeze(
      this.#auftraege.map(x => x.auftragNachrichtenId === neu.auftragNachrichtenId ? neu : x),
    );
    return umschlag.typ === "SETTLEMENT" ? "SETTLEMENT_ABGESCHLOSSEN" : "ACK_BESTAETIGT";
  }

  public snapshot(jetztMs: number): CmAntwortSnapshot {
    if (!Number.isSafeInteger(jetztMs) || jetztMs < 0) throw new Error("CM_ANTWORT_ZEIT_UNGUELTIG");
    const relevant = this.#auftraege.filter(x => x.gueltigBisMs >= jetztMs);
    return Object.freeze({
      schemaVersion: 1,
      auftraege: Object.freeze(relevant.map(x => friere(x))),
    });
  }

  public importiereNachRestart(snapshot: CmAntwortSnapshot, jetztMs: number): void {
    if (snapshot.schemaVersion !== 1
        || !Number.isSafeInteger(jetztMs)
        || jetztMs < 0
        || snapshot.auftraege.length > this.#maximaleAuftraege) {
      throw new Error("CM_ANTWORT_RESTART_SNAPSHOT_UNGUELTIG");
    }
    const relevant = snapshot.auftraege.filter(x => x.gueltigBisMs >= jetztMs);
    for (let index = 0; index < relevant.length; index += 1) {
      const eintrag = relevant[index];
      if (eintrag === undefined
          || eintrag.schemaVersion !== 1
          || !istText(eintrag.auftragNachrichtenId)
          || !istText(eintrag.workflowId)
          || !Number.isSafeInteger(eintrag.workflowRevision)
          || !["AUSSTEHEND", "BESTAETIGT", "ABGESCHLOSSEN"].includes(eintrag.status)
          || relevant.slice(0, index).some(x =>
            x.auftragNachrichtenId === eintrag.auftragNachrichtenId)) {
        throw new Error("CM_ANTWORT_RESTART_EINTRAG_UNGUELTIG");
      }
    }
    this.#auftraege = Object.freeze(relevant.map(x => friere(x)));
  }

  public sicht(): readonly CmAuftragsSicht[] {
    return Object.freeze(this.#auftraege.map(x => friere(x)));
  }
}
