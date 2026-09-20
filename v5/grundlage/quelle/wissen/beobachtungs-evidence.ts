import { kanonischSerialisieren } from "../kern/kanonische-serialisierung.js";
import type { WissensDomaene } from "./typen.js";

export type BeobachtungsEvidenceQuelle = "LIVE_SPIEL" | "SIMULATION" | "REPLAY";

export interface BeobachtungsEvidenceEintrag<T = unknown> {
  readonly schemaVersion: 1;
  readonly evidenceId: string;
  readonly sequenz: number;
  readonly kennung: string;
  readonly domaene: WissensDomaene;
  readonly beobachtetAmMs: number;
  readonly quelle: BeobachtungsEvidenceQuelle;
  readonly klassifikation: "OBSERVATION_EVIDENCE";
  readonly speicherklasse: "WARM_SSD";
  readonly wert: T;
  readonly ausfuehrungsAutoritaet: false;
}

export interface BeobachtungsHistorieSnapshot<T = unknown> {
  readonly schemaVersion: 1;
  readonly art: "BEGRENZTE_BEOBACHTUNGSHISTORIE";
  readonly maximaleEintraege: number;
  readonly maximaleGesamtZeichen: number;
  readonly verworfenWegenGrenze: number;
  readonly eintraege: readonly BeobachtungsEvidenceEintrag<T>[];
  readonly ausfuehrungsAutoritaet: false;
}

export interface BeobachtungsHistorieGrenzen {
  readonly maximaleEintraege: number;
  readonly maximaleEintragZeichen: number;
  readonly maximaleGesamtZeichen: number;
}

function pruefeGrenzen(grenzen: BeobachtungsHistorieGrenzen): void {
  if (!Number.isInteger(grenzen.maximaleEintraege)
      || grenzen.maximaleEintraege < 1
      || grenzen.maximaleEintraege > 100_000) {
    throw new Error("BEOBACHTUNGS_EVIDENCE_ANZAHLGRENZE_UNGUELTIG");
  }
  if (!Number.isInteger(grenzen.maximaleEintragZeichen)
      || grenzen.maximaleEintragZeichen < 2
      || grenzen.maximaleEintragZeichen > 10_000_000) {
    throw new Error("BEOBACHTUNGS_EVIDENCE_EINTRAGSGRENZE_UNGUELTIG");
  }
  if (!Number.isInteger(grenzen.maximaleGesamtZeichen)
      || grenzen.maximaleGesamtZeichen < grenzen.maximaleEintragZeichen
      || grenzen.maximaleGesamtZeichen > 100_000_000) {
    throw new Error("BEOBACHTUNGS_EVIDENCE_GESAMTGRENZE_UNGUELTIG");
  }
}

function pruefeEintrag<T>(
  eintrag: BeobachtungsEvidenceEintrag<T>,
  grenzen: BeobachtungsHistorieGrenzen,
): BeobachtungsEvidenceEintrag<T> {
  if (eintrag.schemaVersion !== 1
      || eintrag.klassifikation !== "OBSERVATION_EVIDENCE"
      || eintrag.speicherklasse !== "WARM_SSD"
      || eintrag.ausfuehrungsAutoritaet !== false) {
    throw new Error("BEOBACHTUNGS_EVIDENCE_SCHEMA_UNGUELTIG");
  }
  if (eintrag.evidenceId.trim().length === 0 || eintrag.evidenceId.length > 200) {
    throw new Error("BEOBACHTUNGS_EVIDENCE_ID_UNGUELTIG");
  }
  if (eintrag.kennung.trim().length === 0 || eintrag.kennung.length > 200) {
    throw new Error("BEOBACHTUNGS_EVIDENCE_KENNUNG_UNGUELTIG");
  }
  if (!Number.isSafeInteger(eintrag.sequenz) || eintrag.sequenz < 1
      || !Number.isFinite(eintrag.beobachtetAmMs) || eintrag.beobachtetAmMs < 0) {
    throw new Error("BEOBACHTUNGS_EVIDENCE_ZEIT_ODER_SEQUENZ_UNGUELTIG");
  }
  if (!["LIVE_SPIEL", "SIMULATION", "REPLAY"].includes(eintrag.quelle)) {
    throw new Error("BEOBACHTUNGS_EVIDENCE_QUELLE_UNGUELTIG");
  }
  const kanonisch = kanonischSerialisieren(eintrag);
  if (kanonisch.length > grenzen.maximaleEintragZeichen) {
    throw new Error("BEOBACHTUNGS_EVIDENCE_EINTRAG_ZU_GROSS");
  }
  return Object.freeze({ ...eintrag });
}

function gesamtZeichen<T>(eintraege: readonly BeobachtungsEvidenceEintrag<T>[]): number {
  return eintraege.reduce(
    (summe, eintrag) => summe + kanonischSerialisieren(eintrag).length,
    0,
  );
}

export class BegrenzteBeobachtungsHistorie<T = unknown> {
  readonly #grenzen: BeobachtungsHistorieGrenzen;
  #eintraege: readonly BeobachtungsEvidenceEintrag<T>[] = Object.freeze([]);
  #verworfenWegenGrenze = 0;

  public constructor(grenzen: BeobachtungsHistorieGrenzen) {
    pruefeGrenzen(grenzen);
    this.#grenzen = Object.freeze({ ...grenzen });
  }

  public fuegeHinzu(eintrag: BeobachtungsEvidenceEintrag<T>): void {
    const geprueft = pruefeEintrag(eintrag, this.#grenzen);
    if (this.#eintraege.some(vorhanden => vorhanden.evidenceId === geprueft.evidenceId)) {
      throw new Error("BEOBACHTUNGS_EVIDENCE_DOPPELTE_ID");
    }
    const letzter = this.#eintraege.at(-1);
    if (letzter !== undefined
        && (geprueft.sequenz <= letzter.sequenz
          || geprueft.beobachtetAmMs < letzter.beobachtetAmMs)) {
      throw new Error("BEOBACHTUNGS_EVIDENCE_NICHT_MONOTON");
    }

    let kandidat: readonly BeobachtungsEvidenceEintrag<T>[] =
      Object.freeze([...this.#eintraege, geprueft]);
    while (kandidat.length > this.#grenzen.maximaleEintraege
        || gesamtZeichen(kandidat) > this.#grenzen.maximaleGesamtZeichen) {
      kandidat = Object.freeze(kandidat.slice(1));
      this.#verworfenWegenGrenze += 1;
    }
    this.#eintraege = kandidat;
  }

  public snapshot(): BeobachtungsHistorieSnapshot<T> {
    return Object.freeze({
      schemaVersion: 1,
      art: "BEGRENZTE_BEOBACHTUNGSHISTORIE",
      maximaleEintraege: this.#grenzen.maximaleEintraege,
      maximaleGesamtZeichen: this.#grenzen.maximaleGesamtZeichen,
      verworfenWegenGrenze: this.#verworfenWegenGrenze,
      eintraege: this.#eintraege,
      ausfuehrungsAutoritaet: false,
    });
  }
}

export function serialisiereBeobachtungsHistorie(
  historie: BeobachtungsHistorieSnapshot,
): string {
  return kanonischSerialisieren(historie);
}
