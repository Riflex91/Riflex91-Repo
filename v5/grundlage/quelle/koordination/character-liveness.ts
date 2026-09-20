export type CharacterLebendigkeitsStatus = "AKTIV" | "RECOVERY_PENDING";

export interface CharacterHeartbeat {
  readonly schemaVersion: 1;
  readonly accountId: string;
  readonly characterId: string;
  readonly sessionId: string;
  readonly serverRegion: string;
  readonly serverIdentifier: string;
  readonly beobachtetAmMs: number;
}

export interface CharacterLebendigkeitsSicht extends CharacterHeartbeat {
  readonly sitzungsEpoche: number;
  readonly lebendigBisMs: number;
  readonly status: CharacterLebendigkeitsStatus;
}

function pruefeText(wert: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error("LIVENESS_TEXT_UNGUELTIG");
}

export class CharacterLebendigkeitsRegister {
  readonly #maximalesAlterMs: number;
  readonly #maximaleCharacters: number;
  #eintraege: readonly CharacterLebendigkeitsSicht[] = Object.freeze([]);
  #epocheFloors: readonly Readonly<{ characterId: string; epoche: number }>[] = Object.freeze([]);

  public constructor(maximalesAlterMs = 5_000, maximaleCharacters = 32) {
    if (!Number.isSafeInteger(maximalesAlterMs) || maximalesAlterMs < 100 || maximalesAlterMs > 300_000) {
      throw new Error("LIVENESS_ALTER_UNGUELTIG");
    }
    if (!Number.isInteger(maximaleCharacters) || maximaleCharacters < 1 || maximaleCharacters > 128) {
      throw new Error("LIVENESS_GRENZE_UNGUELTIG");
    }
    this.#maximalesAlterMs = maximalesAlterMs;
    this.#maximaleCharacters = maximaleCharacters;
  }

  public heartbeat(beobachtung: CharacterHeartbeat): CharacterLebendigkeitsSicht {
    if (beobachtung.schemaVersion !== 1) throw new Error("LIVENESS_SCHEMA_UNGUELTIG");
    for (const text of [beobachtung.accountId, beobachtung.characterId, beobachtung.sessionId,
      beobachtung.serverRegion, beobachtung.serverIdentifier]) pruefeText(text);
    if (!Number.isSafeInteger(beobachtung.beobachtetAmMs) || beobachtung.beobachtetAmMs < 0) {
      throw new Error("LIVENESS_ZEIT_UNGUELTIG");
    }
    const alt = this.#eintraege.find(x => x.characterId === beobachtung.characterId);
    if (alt === undefined && this.#eintraege.length >= this.#maximaleCharacters) {
      throw new Error("LIVENESS_REGISTER_VOLL");
    }
    if (alt !== undefined && beobachtung.beobachtetAmMs < alt.beobachtetAmMs) {
      throw new Error("LIVENESS_HEARTBEAT_VERALTET");
    }
    const identischeSitzung = alt !== undefined
      && alt.status === "AKTIV"
      && alt.accountId === beobachtung.accountId
      && alt.sessionId === beobachtung.sessionId
      && alt.serverRegion === beobachtung.serverRegion
      && alt.serverIdentifier === beobachtung.serverIdentifier;
    const floor = this.#floor(beobachtung.characterId);
    const sitzungsEpoche = identischeSitzung
      ? alt.sitzungsEpoche
      : Math.max(floor, alt?.sitzungsEpoche ?? 0) + 1;
    this.#setFloor(beobachtung.characterId, sitzungsEpoche);
    const neu: CharacterLebendigkeitsSicht = Object.freeze({
      ...beobachtung,
      sitzungsEpoche,
      lebendigBisMs: beobachtung.beobachtetAmMs + this.#maximalesAlterMs,
      status: "AKTIV",
    });
    this.#eintraege = Object.freeze(
      alt === undefined
        ? [...this.#eintraege, neu]
        : this.#eintraege.map(x => x.characterId === neu.characterId ? neu : x),
    );
    return Object.freeze({ ...neu });
  }

  public istFrisch(
    characterId: string,
    sessionId: string,
    sitzungsEpoche: number,
    serverRegion: string,
    serverIdentifier: string,
    jetztMs: number,
  ): boolean {
    if (!Number.isSafeInteger(jetztMs) || jetztMs < 0) return false;
    const sicht = this.#eintraege.find(x => x.characterId === characterId);
    return sicht !== undefined
      && sicht.status === "AKTIV"
      && sicht.sessionId === sessionId
      && sicht.sitzungsEpoche === sitzungsEpoche
      && sicht.serverRegion === serverRegion
      && sicht.serverIdentifier === serverIdentifier
      && jetztMs >= sicht.beobachtetAmMs
      && jetztMs <= sicht.lebendigBisMs;
  }

  public finde(characterId: string): CharacterLebendigkeitsSicht | null {
    const sicht = this.#eintraege.find(x => x.characterId === characterId);
    return sicht === undefined ? null : Object.freeze({ ...sicht });
  }

  public importiereNachRestart(persistiert: readonly CharacterLebendigkeitsSicht[]): void {
    if (persistiert.length > this.#maximaleCharacters) throw new Error("LIVENESS_RESTART_ZU_GROSS");
    for (let index = 0; index < persistiert.length; index += 1) {
      const eintrag = persistiert[index];
      if (eintrag === undefined
          || eintrag.schemaVersion !== 1
          || !Number.isSafeInteger(eintrag.sitzungsEpoche)
          || eintrag.sitzungsEpoche < 1
          || persistiert.slice(0, index).some(x => x.characterId === eintrag.characterId)) {
        throw new Error("LIVENESS_RESTART_SNAPSHOT_UNGUELTIG");
      }
      this.#setFloor(eintrag.characterId, eintrag.sitzungsEpoche);
    }
    this.#eintraege = Object.freeze(
      persistiert.map(x => Object.freeze({ ...x, status: "RECOVERY_PENDING" as const })),
    );
  }

  public snapshot(): readonly CharacterLebendigkeitsSicht[] {
    return Object.freeze(this.#eintraege.map(x => Object.freeze({ ...x })));
  }

  #floor(characterId: string): number {
    return this.#epocheFloors.find(x => x.characterId === characterId)?.epoche ?? 0;
  }

  #setFloor(characterId: string, epoche: number): void {
    const vorhanden = this.#epocheFloors.some(x => x.characterId === characterId);
    if (!vorhanden && this.#epocheFloors.length >= this.#maximaleCharacters) {
      throw new Error("LIVENESS_EPOCHE_REGISTER_VOLL");
    }
    const neu = Object.freeze({ characterId, epoche });
    this.#epocheFloors = Object.freeze(
      vorhanden
        ? this.#epocheFloors.map(x => x.characterId === characterId ? neu : x)
        : [...this.#epocheFloors, neu],
    );
  }
}
