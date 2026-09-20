export type WerttransaktionsArt = "UPGRADE" | "COMPOUND" | "EXCHANGE";

export type WerttransaktionsZustand =
  | "GEPLANT"
  | "SEND_MOEGLICH"
  | "AKZEPTIERT_IN_FLIGHT"
  | "ABGLEICH_ERFORDERLICH"
  | "TERMINAL_BESTAETIGT"
  | "TERMINAL_FEHLER";

export interface WerttransaktionsIntent {
  readonly schemaVersion: 1;
  readonly transaktionsId: string;
  readonly ablaufId: string;
  readonly characterId: string;
  readonly art: WerttransaktionsArt;
  readonly actionContractId: string;
  readonly recoveryContractId: string;
  readonly physischeInputKennungen: readonly string[];
  readonly prestateFingerprint: string;
}

export interface WerttransaktionsSicht extends WerttransaktionsIntent {
  readonly zustand: WerttransaktionsZustand;
  readonly acceptedAtMs: number | null;
  readonly letzteEvidenceFingerprint: string | null;
  readonly sameIntentErneutSenden: false;
}

export interface InFlightEvidence {
  readonly schemaVersion: 1;
  readonly beobachtetAmMs: number;
  readonly evidenceFingerprint: string;
  readonly qAktiv: boolean;
  readonly placeholderAnzahl: number;
  readonly consumableDeltaBeobachtet: boolean;
}

export interface NichtAusgefuehrtEvidence {
  readonly schemaVersion: 1;
  readonly beobachtetAmMs: number;
  readonly evidenceFingerprint: string;
  readonly alleInputsUnveraendert: boolean;
  readonly consumablesUnveraendert: boolean;
  readonly conditionsUnveraendert: boolean;
  readonly qAktiv: boolean;
  readonly placeholderAnzahl: number;
}

export type NichtAusgefuehrtKlassifikation = "NICHT_AUSGEFUEHRT" | "UNGEKLAERT";

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function pruefeZeit(wert: number, fehler: string): void {
  if (!Number.isSafeInteger(wert) || wert < 0) throw new Error(fehler);
}

function pruefeInputs(inputs: readonly string[]): readonly string[] {
  if (inputs.length < 1 || inputs.length > 16) throw new Error("WERTTRANSAKTION_INPUT_ANZAHL_UNGUELTIG");
  for (const input of inputs) pruefeText(input, "WERTTRANSAKTION_INPUT_UNGUELTIG");
  const sortiert = [...inputs].sort();
  if (sortiert.some((x, index) => index > 0 && x === sortiert[index - 1])) {
    throw new Error("WERTTRANSAKTION_INPUT_DOPPELT");
  }
  return Object.freeze(sortiert);
}

function friere(sicht: WerttransaktionsSicht): WerttransaktionsSicht {
  return Object.freeze({
    ...sicht,
    physischeInputKennungen: Object.freeze([...sicht.physischeInputKennungen]),
  });
}

export class WerttransaktionsLedger {
  readonly #maximaleEintraege: number;
  #eintraege: readonly WerttransaktionsSicht[] = Object.freeze([]);

  public constructor(maximaleEintraege = 256) {
    if (!Number.isInteger(maximaleEintraege) || maximaleEintraege < 1 || maximaleEintraege > 2048) {
      throw new Error("WERTTRANSAKTION_LEDGER_GRENZE_UNGUELTIG");
    }
    this.#maximaleEintraege = maximaleEintraege;
  }

  public plane(intent: WerttransaktionsIntent): WerttransaktionsSicht {
    if (intent.schemaVersion !== 1) throw new Error("WERTTRANSAKTION_SCHEMA_UNGUELTIG");
    for (const text of [
      intent.transaktionsId,
      intent.ablaufId,
      intent.characterId,
      intent.actionContractId,
      intent.recoveryContractId,
      intent.prestateFingerprint,
    ]) pruefeText(text, "WERTTRANSAKTION_TEXT_UNGUELTIG");
    if (!["UPGRADE", "COMPOUND", "EXCHANGE"].includes(intent.art)) {
      throw new Error("WERTTRANSAKTION_ART_UNGUELTIG");
    }
    const inputs = pruefeInputs(intent.physischeInputKennungen);
    if (this.#eintraege.some(x => x.transaktionsId === intent.transaktionsId)) {
      throw new Error("WERTTRANSAKTION_ID_DOPPELT");
    }
    if (this.#eintraege.length >= this.#maximaleEintraege) {
      throw new Error("WERTTRANSAKTION_LEDGER_VOLL");
    }
    const sicht = friere({
      ...intent,
      physischeInputKennungen: inputs,
      zustand: "GEPLANT",
      acceptedAtMs: null,
      letzteEvidenceFingerprint: null,
      sameIntentErneutSenden: false,
    });
    this.#eintraege = Object.freeze([...this.#eintraege, sicht]);
    return sicht;
  }

  public markiereSendMoeglich(transaktionsId: string): WerttransaktionsSicht {
    const alt = this.#finde(transaktionsId);
    if (alt.zustand !== "GEPLANT") throw new Error("WERTTRANSAKTION_SEND_ZUSTAND_UNGUELTIG");
    return this.#ersetze(friere({ ...alt, zustand: "SEND_MOEGLICH" }));
  }

  public beobachteInFlight(
    transaktionsId: string,
    evidence: InFlightEvidence,
  ): WerttransaktionsSicht {
    const alt = this.#finde(transaktionsId);
    if (alt.zustand !== "SEND_MOEGLICH"
        && alt.zustand !== "AKZEPTIERT_IN_FLIGHT"
        && alt.zustand !== "ABGLEICH_ERFORDERLICH") {
      throw new Error("WERTTRANSAKTION_INFLIGHT_ZUSTAND_UNGUELTIG");
    }
    if (evidence.schemaVersion !== 1) throw new Error("WERTTRANSAKTION_EVIDENCE_SCHEMA_UNGUELTIG");
    pruefeZeit(evidence.beobachtetAmMs, "WERTTRANSAKTION_EVIDENCE_ZEIT_UNGUELTIG");
    pruefeText(evidence.evidenceFingerprint, "WERTTRANSAKTION_EVIDENCE_FINGERPRINT_UNGUELTIG");
    if (!Number.isInteger(evidence.placeholderAnzahl)
        || evidence.placeholderAnzahl < 0
        || evidence.placeholderAnzahl > 16) {
      throw new Error("WERTTRANSAKTION_PLACEHOLDER_ANZAHL_UNGUELTIG");
    }
    const akzeptiert = evidence.qAktiv
      || evidence.placeholderAnzahl > 0
      || evidence.consumableDeltaBeobachtet;
    if (!akzeptiert) throw new Error("WERTTRANSAKTION_KEINE_ACCEPTED_EVIDENCE");
    return this.#ersetze(friere({
      ...alt,
      zustand: "AKZEPTIERT_IN_FLIGHT",
      acceptedAtMs: alt.acceptedAtMs ?? evidence.beobachtetAmMs,
      letzteEvidenceFingerprint: evidence.evidenceFingerprint,
    }));
  }

  public markiereTerminal(
    transaktionsId: string,
    erfolgreich: boolean,
    evidenceFingerprint: string,
  ): WerttransaktionsSicht {
    pruefeText(evidenceFingerprint, "WERTTRANSAKTION_TERMINAL_EVIDENCE_UNGUELTIG");
    const alt = this.#finde(transaktionsId);
    if (alt.zustand !== "AKZEPTIERT_IN_FLIGHT"
        && alt.zustand !== "ABGLEICH_ERFORDERLICH") {
      throw new Error("WERTTRANSAKTION_TERMINAL_ZUSTAND_UNGUELTIG");
    }
    return this.#ersetze(friere({
      ...alt,
      zustand: erfolgreich ? "TERMINAL_BESTAETIGT" : "TERMINAL_FEHLER",
      letzteEvidenceFingerprint: evidenceFingerprint,
    }));
  }

  public klassifiziereNichtAusgefuehrt(
    transaktionsId: string,
    evidence: NichtAusgefuehrtEvidence,
  ): NichtAusgefuehrtKlassifikation {
    const alt = this.#finde(transaktionsId);
    if (alt.zustand !== "SEND_MOEGLICH" && alt.zustand !== "ABGLEICH_ERFORDERLICH") {
      throw new Error("WERTTRANSAKTION_NOT_APPLIED_ZUSTAND_UNGUELTIG");
    }
    if (evidence.schemaVersion !== 1) throw new Error("WERTTRANSAKTION_EVIDENCE_SCHEMA_UNGUELTIG");
    pruefeZeit(evidence.beobachtetAmMs, "WERTTRANSAKTION_EVIDENCE_ZEIT_UNGUELTIG");
    pruefeText(evidence.evidenceFingerprint, "WERTTRANSAKTION_EVIDENCE_FINGERPRINT_UNGUELTIG");
    if (!Number.isInteger(evidence.placeholderAnzahl) || evidence.placeholderAnzahl < 0) {
      throw new Error("WERTTRANSAKTION_PLACEHOLDER_ANZAHL_UNGUELTIG");
    }
    return evidence.alleInputsUnveraendert
      && evidence.consumablesUnveraendert
      && evidence.conditionsUnveraendert
      && !evidence.qAktiv
      && evidence.placeholderAnzahl === 0
      ? "NICHT_AUSGEFUEHRT"
      : "UNGEKLAERT";
  }

  public importiereNachRestart(snapshot: readonly WerttransaktionsSicht[]): void {
    if (snapshot.length > this.#maximaleEintraege) throw new Error("WERTTRANSAKTION_RESTART_ZU_GROSS");
    const neu = snapshot.map((x, index) => {
      if (x.schemaVersion !== 1
          || snapshot.slice(0, index).some(y => y.transaktionsId === x.transaktionsId)) {
        throw new Error("WERTTRANSAKTION_RESTART_SNAPSHOT_UNGUELTIG");
      }
      const terminal = x.zustand === "TERMINAL_BESTAETIGT" || x.zustand === "TERMINAL_FEHLER";
      return friere({
        ...x,
        physischeInputKennungen: pruefeInputs(x.physischeInputKennungen),
        zustand: terminal ? x.zustand : "ABGLEICH_ERFORDERLICH",
        sameIntentErneutSenden: false,
      });
    });
    this.#eintraege = Object.freeze(neu);
  }

  public snapshot(): readonly WerttransaktionsSicht[] {
    return Object.freeze(this.#eintraege.map(x => friere(x)));
  }

  public finde(transaktionsId: string): WerttransaktionsSicht {
    pruefeText(transaktionsId, "WERTTRANSAKTION_ID_UNGUELTIG");
    const sicht = this.#eintraege.find(x => x.transaktionsId === transaktionsId);
    if (sicht === undefined) throw new Error("WERTTRANSAKTION_UNBEKANNT");
    return friere(sicht);
  }

  #ersetze(neu: WerttransaktionsSicht): WerttransaktionsSicht {
    this.#eintraege = Object.freeze(
      this.#eintraege.map(x => x.transaktionsId === neu.transaktionsId ? neu : x),
    );
    return friere(neu);
  }
}
