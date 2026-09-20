import {
  CharacterLebendigkeitsRegister,
} from "./character-liveness.js";
import {
  RosterWahrheit,
  type CharacterZielBindung,
} from "./roster-wahrheit.js";

export interface KoordinationsFreigabe {
  readonly schemaVersion: 1;
  readonly accountId: string;
  readonly characterId: string;
  readonly sessionId: string;
  readonly sitzungsEpoche: number;
  readonly serverRegion: string;
  readonly serverIdentifier: string;
  readonly rosterEpoche: number;
  readonly rosterFingerprint: string;
  readonly workflowId: string;
  readonly erteiltAmMs: number;
  readonly gueltigBisMs: number;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

export class AccountKoordinator {
  public readonly gameplayAutoritaet = false as const;
  public readonly rawWriteAutoritaet = false as const;
  readonly #accountId: string;
  readonly #roster: RosterWahrheit;
  readonly #liveness: CharacterLebendigkeitsRegister;
  readonly #maximaleFreigabeDauerMs: number;

  public constructor(
    accountId: string,
    roster: RosterWahrheit,
    liveness: CharacterLebendigkeitsRegister,
    maximaleFreigabeDauerMs = 5_000,
  ) {
    pruefeText(accountId, "KOORDINATOR_ACCOUNT_UNGUELTIG");
    if (!Number.isSafeInteger(maximaleFreigabeDauerMs)
        || maximaleFreigabeDauerMs < 1
        || maximaleFreigabeDauerMs > 60_000) {
      throw new Error("KOORDINATOR_FREIGABE_DAUER_UNGUELTIG");
    }
    this.#accountId = accountId;
    this.#roster = roster;
    this.#liveness = liveness;
    this.#maximaleFreigabeDauerMs = maximaleFreigabeDauerMs;
  }

  public erteileKoordinationsFreigabe(
    characterId: string,
    workflowId: string,
    jetztMs: number,
    dauerMs: number,
  ): KoordinationsFreigabe {
    pruefeText(characterId, "KOORDINATOR_CHARACTER_UNGUELTIG");
    pruefeText(workflowId, "KOORDINATOR_WORKFLOW_UNGUELTIG");
    if (!Number.isSafeInteger(jetztMs) || jetztMs < 0
        || !Number.isSafeInteger(dauerMs) || dauerMs < 1
        || dauerMs > this.#maximaleFreigabeDauerMs) {
      throw new Error("KOORDINATOR_FREIGABE_PARAMETER_UNGUELTIG");
    }
    const ziel = this.#roster.bindeZiel(characterId);
    if (ziel.accountId !== this.#accountId) throw new Error("KOORDINATOR_FALSCHER_ACCOUNT");
    const lebendig = this.#liveness.finde(characterId);
    if (lebendig === null
        || lebendig.accountId !== this.#accountId
        || lebendig.sessionId !== ziel.sessionId
        || lebendig.serverRegion !== ziel.serverRegion
        || lebendig.serverIdentifier !== ziel.serverIdentifier
        || !this.#liveness.istFrisch(
          characterId,
          lebendig.sessionId,
          lebendig.sitzungsEpoche,
          lebendig.serverRegion,
          lebendig.serverIdentifier,
          jetztMs,
        )) {
      throw new Error("KOORDINATOR_CHARACTER_STALE");
    }
    return this.#baueFreigabe(
      ziel,
      workflowId,
      lebendig.sitzungsEpoche,
      jetztMs,
      Math.min(jetztMs + dauerMs, lebendig.lebendigBisMs),
    );
  }

  public validiereKoordinationsFreigabe(token: KoordinationsFreigabe, jetztMs: number): boolean {
    if (token.schemaVersion !== 1
        || token.accountId !== this.#accountId
        || token.gameplayAutoritaet !== false
        || token.rawWriteAutoritaet !== false
        || !Number.isSafeInteger(jetztMs)
        || jetztMs < token.erteiltAmMs
        || jetztMs > token.gueltigBisMs) return false;
    const ziel: CharacterZielBindung = {
      schemaVersion: 1,
      accountId: token.accountId,
      characterId: token.characterId,
      sessionId: token.sessionId,
      serverRegion: token.serverRegion,
      serverIdentifier: token.serverIdentifier,
      rosterEpoche: token.rosterEpoche,
      rosterFingerprint: token.rosterFingerprint,
    };
    return this.#roster.validiereZiel(ziel)
      && this.#liveness.istFrisch(
        token.characterId,
        token.sessionId,
        token.sitzungsEpoche,
        token.serverRegion,
        token.serverIdentifier,
        jetztMs,
      );
  }

  #baueFreigabe(
    ziel: CharacterZielBindung,
    workflowId: string,
    sitzungsEpoche: number,
    erteiltAmMs: number,
    gueltigBisMs: number,
  ): KoordinationsFreigabe {
    return Object.freeze({
      schemaVersion: 1,
      accountId: ziel.accountId,
      characterId: ziel.characterId,
      sessionId: ziel.sessionId,
      sitzungsEpoche,
      serverRegion: ziel.serverRegion,
      serverIdentifier: ziel.serverIdentifier,
      rosterEpoche: ziel.rosterEpoche,
      rosterFingerprint: ziel.rosterFingerprint,
      workflowId,
      erteiltAmMs,
      gueltigBisMs,
      gameplayAutoritaet: false,
      rawWriteAutoritaet: false,
    });
  }
}
