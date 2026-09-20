import {
  AccountKoordinator,
  type KoordinationsFreigabe,
} from "./account-koordinator.js";
import {
  CmInbox,
  type CmEmpfangErgebnis,
  type CmUmschlag,
} from "./cm-protokoll.js";
import type { CharacterHeartbeat } from "./character-liveness.js";

export interface CharacterAgentIdentitaet {
  readonly accountId: string;
  readonly characterId: string;
  readonly sessionId: string;
  readonly serverRegion: string;
  readonly serverIdentifier: string;
}

function pruefeText(wert: string): void {
  if (wert.trim().length === 0 || wert.length > 192) {
    throw new Error("CHARACTER_AGENT_IDENTITAET_UNGUELTIG");
  }
}

export class CharacterAgent {
  public readonly gameplayAutoritaet = false as const;
  public readonly rawWriteAutoritaet = false as const;
  readonly #identitaet: CharacterAgentIdentitaet;
  readonly #inbox: CmInbox;

  public constructor(identitaet: CharacterAgentIdentitaet, inbox = new CmInbox()) {
    for (const text of [identitaet.accountId, identitaet.characterId, identitaet.sessionId,
      identitaet.serverRegion, identitaet.serverIdentifier]) pruefeText(text);
    this.#identitaet = Object.freeze({ ...identitaet });
    this.#inbox = inbox;
  }

  public heartbeat(beobachtetAmMs: number): CharacterHeartbeat {
    if (!Number.isSafeInteger(beobachtetAmMs) || beobachtetAmMs < 0) {
      throw new Error("CHARACTER_AGENT_ZEIT_UNGUELTIG");
    }
    return Object.freeze({
      schemaVersion: 1,
      ...this.#identitaet,
      beobachtetAmMs,
    });
  }

  public akzeptiereKoordinationsFreigabe(
    token: KoordinationsFreigabe,
    koordinator: AccountKoordinator,
    jetztMs: number,
  ): boolean {
    return token.accountId === this.#identitaet.accountId
      && token.characterId === this.#identitaet.characterId
      && token.sessionId === this.#identitaet.sessionId
      && token.serverRegion === this.#identitaet.serverRegion
      && token.serverIdentifier === this.#identitaet.serverIdentifier
      && koordinator.validiereKoordinationsFreigabe(token, jetztMs);
  }

  public empfangeCm<T>(
    umschlag: CmUmschlag<T>,
    vertrauenswuerdigeSender: readonly string[],
    rosterEpoche: number,
    jetztMs: number,
    maximaleTtlMs = 30_000,
    maximalePayloadZeichen = 8_192,
  ): CmEmpfangErgebnis {
    return this.#inbox.empfange(umschlag, {
      empfaengerCharacterId: this.#identitaet.characterId,
      serverRegion: this.#identitaet.serverRegion,
      serverIdentifier: this.#identitaet.serverIdentifier,
      rosterEpoche,
      vertrauenswuerdigeSender,
      maximaleTtlMs,
      maximalePayloadZeichen,
    }, jetztMs);
  }

  public identitaet(): CharacterAgentIdentitaet {
    return Object.freeze({ ...this.#identitaet });
  }
}
