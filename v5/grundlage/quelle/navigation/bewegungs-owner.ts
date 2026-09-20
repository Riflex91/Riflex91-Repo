export type BewegungsZweck = "TRAVEL" | "RENDEZVOUS" | "KITE" | "POSITIONIERUNG" | "SAFETY";
export type BewegungsOwnerStatus = "AKTIV" | "FREI" | "RECOVERY_PENDING";

export interface BewegungsOwnerToken {
  readonly schemaVersion: 1;
  readonly characterId: string;
  readonly ownerAblaufId: string;
  readonly zweck: BewegungsZweck;
  readonly intentFingerprint: string;
  readonly epoche: number;
  readonly leaseBisMs: number;
}

export interface BewegungsOwnerSicht extends BewegungsOwnerToken {
  readonly status: BewegungsOwnerStatus;
  readonly handoffSperreBisMs: number;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function friereToken(token: BewegungsOwnerToken): BewegungsOwnerToken {
  return Object.freeze({ ...token });
}

function friereSicht(sicht: BewegungsOwnerSicht): BewegungsOwnerSicht {
  return Object.freeze({ ...sicht });
}

export class BewegungsOwnerLedger {
  readonly #maximalCharacters: number;
  readonly #minHandoffMs: number;
  #slots: readonly BewegungsOwnerSicht[] = Object.freeze([]);

  public constructor(maximalCharacters = 32, minHandoffMs = 250) {
    if (!Number.isInteger(maximalCharacters) || maximalCharacters < 1 || maximalCharacters > 128
        || !Number.isSafeInteger(minHandoffMs) || minHandoffMs < 0 || minHandoffMs > 60_000) {
      throw new Error("BEWEGUNGS_OWNER_POLICY_UNGUELTIG");
    }
    this.#maximalCharacters = maximalCharacters;
    this.#minHandoffMs = minHandoffMs;
  }

  public beanspruche(
    characterId: string,
    ownerAblaufId: string,
    zweck: BewegungsZweck,
    intentFingerprint: string,
    jetztMs: number,
    leaseDauerMs: number,
  ): BewegungsOwnerToken {
    for (const text of [characterId, ownerAblaufId, intentFingerprint]) {
      pruefeText(text, "BEWEGUNGS_OWNER_TEXT_UNGUELTIG");
    }
    if (!["TRAVEL", "RENDEZVOUS", "KITE", "POSITIONIERUNG", "SAFETY"].includes(zweck)
        || !Number.isSafeInteger(jetztMs) || jetztMs < 0
        || !Number.isSafeInteger(leaseDauerMs) || leaseDauerMs < 1 || leaseDauerMs > 60_000) {
      throw new Error("BEWEGUNGS_OWNER_PARAMETER_UNGUELTIG");
    }
    this.#markiereAbgelaufen(jetztMs);
    const alt = this.#slots.find(x => x.characterId === characterId);
    if (alt?.status === "RECOVERY_PENDING") throw new Error("BEWEGUNGS_OWNER_ABGLEICH_ERFORDERLICH");
    if (alt === undefined && this.#slots.length >= this.#maximalCharacters) {
      throw new Error("BEWEGUNGS_OWNER_LEDGER_VOLL");
    }
    if (alt?.status === "AKTIV" && alt.ownerAblaufId !== ownerAblaufId) {
      if (zweck !== "SAFETY") throw new Error("BEWEGUNG_BEREITS_BELEGT");
      return this.#preemptSafety(alt, ownerAblaufId, intentFingerprint, jetztMs, leaseDauerMs);
    }
    if (alt?.status === "FREI" && jetztMs < alt.handoffSperreBisMs && zweck !== "SAFETY") {
      throw new Error("BEWEGUNGS_HANDOFF_SPERRFRIST");
    }
    const epoche = alt?.status === "AKTIV" ? alt.epoche : (alt?.epoche ?? 0) + 1;
    const neu = friereSicht({
      schemaVersion: 1,
      characterId,
      ownerAblaufId,
      zweck,
      intentFingerprint,
      epoche,
      leaseBisMs: jetztMs + leaseDauerMs,
      status: "AKTIV",
      handoffSperreBisMs: alt?.handoffSperreBisMs ?? 0,
    });
    this.#slots = Object.freeze(
      alt === undefined ? [...this.#slots, neu] : this.#slots.map(x => x.characterId === characterId ? neu : x),
    );
    return friereToken(neu);
  }

  public validiere(token: BewegungsOwnerToken, jetztMs: number): boolean {
    this.#markiereAbgelaufen(jetztMs);
    const slot = this.#slots.find(x => x.characterId === token.characterId);
    return slot !== undefined
      && slot.status === "AKTIV"
      && slot.ownerAblaufId === token.ownerAblaufId
      && slot.zweck === token.zweck
      && slot.intentFingerprint === token.intentFingerprint
      && slot.epoche === token.epoche
      && slot.leaseBisMs === token.leaseBisMs
      && jetztMs <= token.leaseBisMs;
  }

  public gibFrei(token: BewegungsOwnerToken, jetztMs: number): void {
    if (!this.validiere(token, jetztMs)) throw new Error("BEWEGUNGS_OWNER_TOKEN_UNGUELTIG");
    const alt = this.#slots.find(x => x.characterId === token.characterId);
    if (alt === undefined) throw new Error("BEWEGUNGS_OWNER_UNBEKANNT");
    const frei = friereSicht({
      ...alt,
      status: "FREI",
      leaseBisMs: jetztMs,
      handoffSperreBisMs: jetztMs + this.#minHandoffMs,
    });
    this.#slots = Object.freeze(this.#slots.map(x => x.characterId === token.characterId ? frei : x));
  }

  public importiereNachRestart(snapshot: readonly BewegungsOwnerSicht[]): void {
    if (snapshot.length > this.#maximalCharacters) throw new Error("BEWEGUNGS_OWNER_RESTART_ZU_GROSS");
    this.#slots = Object.freeze(snapshot.map((x, index) => {
      if (x.schemaVersion !== 1
          || snapshot.slice(0, index).some(y => y.characterId === x.characterId)) {
        throw new Error("BEWEGUNGS_OWNER_RESTART_SNAPSHOT_UNGUELTIG");
      }
      return friereSicht({ ...x, status: x.status === "FREI" ? "FREI" : "RECOVERY_PENDING" });
    }));
  }

  public schliesseAbgleichAb(characterId: string, epoche: number, jetztMs: number): void {
    const alt = this.#slots.find(x => x.characterId === characterId);
    if (alt === undefined || alt.status !== "RECOVERY_PENDING" || alt.epoche !== epoche) {
      throw new Error("BEWEGUNGS_OWNER_ABGLEICH_TOKEN_UNGUELTIG");
    }
    const frei = friereSicht({
      ...alt,
      status: "FREI",
      leaseBisMs: jetztMs,
      handoffSperreBisMs: jetztMs + this.#minHandoffMs,
    });
    this.#slots = Object.freeze(this.#slots.map(x => x.characterId === characterId ? frei : x));
  }

  public snapshot(): readonly BewegungsOwnerSicht[] {
    return Object.freeze(this.#slots.map(x => friereSicht(x)));
  }

  #preemptSafety(
    alt: BewegungsOwnerSicht,
    ownerAblaufId: string,
    intentFingerprint: string,
    jetztMs: number,
    leaseDauerMs: number,
  ): BewegungsOwnerToken {
    const neu = friereSicht({
      ...alt,
      ownerAblaufId,
      zweck: "SAFETY",
      intentFingerprint,
      epoche: alt.epoche + 1,
      leaseBisMs: jetztMs + leaseDauerMs,
      status: "AKTIV",
      handoffSperreBisMs: alt.handoffSperreBisMs,
    });
    this.#slots = Object.freeze(this.#slots.map(x => x.characterId === alt.characterId ? neu : x));
    return friereToken(neu);
  }

  #markiereAbgelaufen(jetztMs: number): void {
    if (!Number.isSafeInteger(jetztMs) || jetztMs < 0) throw new Error("BEWEGUNGS_OWNER_ZEIT_UNGUELTIG");
    this.#slots = Object.freeze(this.#slots.map(x =>
      x.status === "AKTIV" && x.leaseBisMs < jetztMs
        ? friereSicht({ ...x, status: "RECOVERY_PENDING" })
        : x));
  }
}
