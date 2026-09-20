export interface RosterMitglied {
  readonly characterId: string;
  readonly sessionId: string;
}

export interface RosterBeobachtung {
  readonly schemaVersion: 1;
  readonly accountId: string;
  readonly serverRegion: string;
  readonly serverIdentifier: string;
  readonly beobachtetAmMs: number;
  readonly fingerprint: string;
  readonly mitglieder: readonly RosterMitglied[];
}

export interface RosterSicht extends RosterBeobachtung {
  readonly rosterEpoche: number;
}

export interface CharacterZielBindung {
  readonly schemaVersion: 1;
  readonly accountId: string;
  readonly characterId: string;
  readonly sessionId: string;
  readonly serverRegion: string;
  readonly serverIdentifier: string;
  readonly rosterEpoche: number;
  readonly rosterFingerprint: string;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function normalisiereMitglieder(
  mitglieder: readonly RosterMitglied[],
  maximaleMitglieder: number,
): readonly RosterMitglied[] {
  if (mitglieder.length > maximaleMitglieder) throw new Error("ROSTER_ZU_GROSS");
  for (let index = 0; index < mitglieder.length; index += 1) {
    const eintrag = mitglieder[index];
    if (eintrag === undefined) throw new Error("ROSTER_MITGLIED_FEHLT");
    pruefeText(eintrag.characterId, "ROSTER_CHARACTER_UNGUELTIG");
    pruefeText(eintrag.sessionId, "ROSTER_SESSION_UNGUELTIG");
    if (mitglieder.slice(0, index).some(x => x.characterId === eintrag.characterId)) {
      throw new Error("ROSTER_CHARACTER_DOPPELT");
    }
  }
  return Object.freeze(
    [...mitglieder]
      .sort((a, b) => a.characterId.localeCompare(b.characterId))
      .map(x => Object.freeze({ ...x })),
  );
}

function mitgliederGleich(a: readonly RosterMitglied[], b: readonly RosterMitglied[]): boolean {
  return a.length === b.length
    && a.every((x, index) => {
      const y = b[index];
      return y !== undefined && x.characterId === y.characterId && x.sessionId === y.sessionId;
    });
}

export class RosterWahrheit {
  readonly #maximaleMitglieder: number;
  #sicht: RosterSicht | null = null;
  #epocheFloor = 0;

  public constructor(maximaleMitglieder = 32) {
    if (!Number.isInteger(maximaleMitglieder) || maximaleMitglieder < 1 || maximaleMitglieder > 128) {
      throw new Error("ROSTER_GRENZE_UNGUELTIG");
    }
    this.#maximaleMitglieder = maximaleMitglieder;
  }

  public aktualisiere(beobachtung: RosterBeobachtung): RosterSicht {
    if (beobachtung.schemaVersion !== 1) throw new Error("ROSTER_SCHEMA_UNGUELTIG");
    for (const text of [beobachtung.accountId, beobachtung.serverRegion,
      beobachtung.serverIdentifier, beobachtung.fingerprint]) {
      pruefeText(text, "ROSTER_TEXT_UNGUELTIG");
    }
    if (!Number.isSafeInteger(beobachtung.beobachtetAmMs) || beobachtung.beobachtetAmMs < 0) {
      throw new Error("ROSTER_ZEIT_UNGUELTIG");
    }
    const mitglieder = normalisiereMitglieder(beobachtung.mitglieder, this.#maximaleMitglieder);
    if (this.#sicht !== null && beobachtung.beobachtetAmMs < this.#sicht.beobachtetAmMs) {
      throw new Error("ROSTER_BEOBACHTUNG_VERALTET");
    }
    const geaendert = this.#sicht === null
      || this.#sicht.accountId !== beobachtung.accountId
      || this.#sicht.serverRegion !== beobachtung.serverRegion
      || this.#sicht.serverIdentifier !== beobachtung.serverIdentifier
      || this.#sicht.fingerprint !== beobachtung.fingerprint
      || !mitgliederGleich(this.#sicht.mitglieder, mitglieder);
    const rosterEpoche = geaendert
      ? Math.max(this.#epocheFloor, this.#sicht?.rosterEpoche ?? 0) + 1
      : this.#sicht?.rosterEpoche ?? this.#epocheFloor + 1;
    this.#epocheFloor = Math.max(this.#epocheFloor, rosterEpoche);
    this.#sicht = Object.freeze({
      ...beobachtung,
      mitglieder,
      rosterEpoche,
    });
    return this.sicht() as RosterSicht;
  }

  public bindeZiel(characterId: string): CharacterZielBindung {
    pruefeText(characterId, "ROSTER_ZIEL_CHARACTER_UNGUELTIG");
    const sicht = this.#sicht;
    if (sicht === null) throw new Error("ROSTER_KEINE_AKTUELLE_WAHRHEIT");
    const mitglied = sicht.mitglieder.find(x => x.characterId === characterId);
    if (mitglied === undefined) throw new Error("ROSTER_ZIEL_NICHT_AKTUELL");
    return Object.freeze({
      schemaVersion: 1,
      accountId: sicht.accountId,
      characterId,
      sessionId: mitglied.sessionId,
      serverRegion: sicht.serverRegion,
      serverIdentifier: sicht.serverIdentifier,
      rosterEpoche: sicht.rosterEpoche,
      rosterFingerprint: sicht.fingerprint,
    });
  }

  public validiereZiel(bindung: CharacterZielBindung): boolean {
    const sicht = this.#sicht;
    if (sicht === null || bindung.schemaVersion !== 1) return false;
    const mitglied = sicht.mitglieder.find(x => x.characterId === bindung.characterId);
    return mitglied !== undefined
      && bindung.accountId === sicht.accountId
      && bindung.sessionId === mitglied.sessionId
      && bindung.serverRegion === sicht.serverRegion
      && bindung.serverIdentifier === sicht.serverIdentifier
      && bindung.rosterEpoche === sicht.rosterEpoche
      && bindung.rosterFingerprint === sicht.fingerprint;
  }

  public importiereNachRestart(persistiert: RosterSicht): void {
    if (persistiert.schemaVersion !== 1
        || !Number.isSafeInteger(persistiert.rosterEpoche)
        || persistiert.rosterEpoche < 1) {
      throw new Error("ROSTER_RESTART_SNAPSHOT_UNGUELTIG");
    }
    normalisiereMitglieder(persistiert.mitglieder, this.#maximaleMitglieder);
    this.#epocheFloor = Math.max(this.#epocheFloor, persistiert.rosterEpoche);
    this.#sicht = null;
  }

  public sicht(): RosterSicht | null {
    if (this.#sicht === null) return null;
    return Object.freeze({
      ...this.#sicht,
      mitglieder: Object.freeze(this.#sicht.mitglieder.map(x => Object.freeze({ ...x }))),
    });
  }
}
