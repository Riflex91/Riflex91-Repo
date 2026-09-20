import type { CharacterZielBindung } from "../koordination/roster-wahrheit.js";

export type KampfCharacterStatus =
  | "AKTIV"
  | "TOT"
  | "RESPAWN_AUSSTEHEND"
  | "REJOIN_AUSSTEHEND"
  | "RECOVERY_PENDING";

export interface CharacterLifecycleEvidence {
  readonly schemaVersion: 1;
  readonly character: CharacterZielBindung;
  readonly beobachtetAmMs: number;
  readonly rip: boolean;
  readonly hp: number;
  readonly mp: number;
  readonly evidenceFingerprint: string;
}

export interface CharacterLifecycleSicht {
  readonly characterId: string;
  readonly sessionId: string;
  readonly status: KampfCharacterStatus;
  readonly epoche: number;
  readonly letzteEvidenceFingerprint: string;
  readonly normaleCombatMovementAuthority: boolean;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function friere(s: CharacterLifecycleSicht): CharacterLifecycleSicht {
  return Object.freeze({ ...s });
}

export class CharacterLifecycleLedger {
  readonly #maximal: number;
  #eintraege: readonly CharacterLifecycleSicht[] = Object.freeze([]);

  public constructor(maximal = 32) {
    if (!Number.isInteger(maximal) || maximal < 1 || maximal > 128) {
      throw new Error("LIFECYCLE_GRENZE_UNGUELTIG");
    }
    this.#maximal = maximal;
  }

  public beobachte(evidence: CharacterLifecycleEvidence): CharacterLifecycleSicht {
    if (evidence.schemaVersion !== 1 || evidence.character.schemaVersion !== 1) {
      throw new Error("LIFECYCLE_SCHEMA_UNGUELTIG");
    }
    pruefeText(evidence.evidenceFingerprint, "LIFECYCLE_EVIDENCE_UNGUELTIG");
    if (!Number.isSafeInteger(evidence.beobachtetAmMs) || evidence.beobachtetAmMs < 0
        || !Number.isFinite(evidence.hp) || evidence.hp < 0
        || !Number.isFinite(evidence.mp) || evidence.mp < 0) {
      throw new Error("LIFECYCLE_EVIDENCE_ZAHL_UNGUELTIG");
    }
    const alt = this.#eintraege.find(x => x.characterId === evidence.character.characterId);
    if (alt === undefined && this.#eintraege.length >= this.#maximal) {
      throw new Error("LIFECYCLE_LEDGER_VOLL");
    }
    const neueSession = alt !== undefined && alt.sessionId !== evidence.character.sessionId;
    const status: KampfCharacterStatus = evidence.rip
      ? "TOT"
      : alt?.status === "REJOIN_AUSSTEHEND" || alt?.status === "RECOVERY_PENDING" || neueSession
        ? "REJOIN_AUSSTEHEND"
        : "AKTIV";
    const neu = friere({
      characterId: evidence.character.characterId,
      sessionId: evidence.character.sessionId,
      status,
      epoche: neueSession ? alt.epoche + 1 : alt?.epoche ?? 1,
      letzteEvidenceFingerprint: evidence.evidenceFingerprint,
      normaleCombatMovementAuthority: status === "AKTIV",
    });
    this.#eintraege = Object.freeze(
      alt === undefined ? [...this.#eintraege, neu] : this.#eintraege.map(x => x.characterId === neu.characterId ? neu : x),
    );
    return neu;
  }

  public beginneRespawn(characterId: string): CharacterLifecycleSicht {
    const alt = this.#finde(characterId);
    if (alt.status !== "TOT") throw new Error("LIFECYCLE_RESPAWN_NUR_WENN_TOT");
    return this.#ersetze(friere({
      ...alt,
      status: "RESPAWN_AUSSTEHEND",
      normaleCombatMovementAuthority: false,
    }));
  }

  public bestaetigeRespawnResponse(characterId: string, responseFingerprint: string): CharacterLifecycleSicht {
    pruefeText(responseFingerprint, "LIFECYCLE_RESPAWN_RESPONSE_UNGUELTIG");
    const alt = this.#finde(characterId);
    if (alt.status !== "RESPAWN_AUSSTEHEND") throw new Error("LIFECYCLE_RESPAWN_RESPONSE_ZUSTAND_UNGUELTIG");
    return this.#ersetze(friere({
      ...alt,
      status: "REJOIN_AUSSTEHEND",
      letzteEvidenceFingerprint: responseFingerprint,
      normaleCombatMovementAuthority: false,
    }));
  }

  public bestaetigeRejoin(
    characterId: string,
    evidence: CharacterLifecycleEvidence,
    jetztMs: number,
    maxAlterMs: number,
  ): CharacterLifecycleSicht {
    const alt = this.#finde(characterId);
    if (alt.status !== "REJOIN_AUSSTEHEND" && alt.status !== "RECOVERY_PENDING") {
      throw new Error("LIFECYCLE_REJOIN_ZUSTAND_UNGUELTIG");
    }
    if (evidence.character.characterId !== characterId
        || evidence.character.sessionId !== alt.sessionId
        || evidence.rip
        || !Number.isSafeInteger(jetztMs)
        || !Number.isSafeInteger(maxAlterMs)
        || maxAlterMs < 1
        || evidence.beobachtetAmMs > jetztMs
        || jetztMs - evidence.beobachtetAmMs > maxAlterMs) {
      throw new Error("LIFECYCLE_REJOIN_EVIDENCE_UNGUELTIG");
    }
    return this.#ersetze(friere({
      ...alt,
      status: "AKTIV",
      letzteEvidenceFingerprint: evidence.evidenceFingerprint,
      normaleCombatMovementAuthority: true,
    }));
  }

  public importiereNachRestart(snapshot: readonly CharacterLifecycleSicht[]): void {
    if (snapshot.length > this.#maximal) throw new Error("LIFECYCLE_RESTART_ZU_GROSS");
    this.#eintraege = Object.freeze(snapshot.map((x, index) => {
      if (snapshot.slice(0, index).some(y => y.characterId === x.characterId)) {
        throw new Error("LIFECYCLE_RESTART_SNAPSHOT_UNGUELTIG");
      }
      return friere({
        ...x,
        status: "RECOVERY_PENDING",
        normaleCombatMovementAuthority: false,
      });
    }));
  }

  public snapshot(): readonly CharacterLifecycleSicht[] {
    return Object.freeze(this.#eintraege.map(x => friere(x)));
  }

  #finde(characterId: string): CharacterLifecycleSicht {
    pruefeText(characterId, "LIFECYCLE_CHARACTER_UNGUELTIG");
    const sicht = this.#eintraege.find(x => x.characterId === characterId);
    if (sicht === undefined) throw new Error("LIFECYCLE_CHARACTER_UNBEKANNT");
    return sicht;
  }

  #ersetze(neu: CharacterLifecycleSicht): CharacterLifecycleSicht {
    this.#eintraege = Object.freeze(this.#eintraege.map(x => x.characterId === neu.characterId ? neu : x));
    return neu;
  }
}
