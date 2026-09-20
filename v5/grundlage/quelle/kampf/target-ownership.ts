import type { BewegungsZielBeobachtung } from "../navigation/motion-freshness.js";

export type TargetOwnershipStatus = "AKTIV" | "RECOVERY_PENDING" | "FREI";

export interface TargetOwnershipToken {
  readonly schemaVersion: 1;
  readonly ressourcenId: string;
  readonly ownerAblaufId: string;
  readonly ownerCharacterId: string;
  readonly entityId: string;
  readonly entityFingerprint: string;
  readonly serverRegion: string;
  readonly serverIdentifier: string;
  readonly map: string;
  readonly instanz: string;
  readonly epoche: number;
  readonly leaseBisMs: number;
  readonly rawTargetIstAuthority: false;
}

export interface TargetOwnershipSicht extends TargetOwnershipToken {
  readonly status: TargetOwnershipStatus;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function friereToken(token: TargetOwnershipToken): TargetOwnershipToken {
  return Object.freeze({ ...token });
}

function friereSicht(sicht: TargetOwnershipSicht): TargetOwnershipSicht {
  return Object.freeze({ ...sicht });
}

export function targetRessourcenId(
  serverRegion: string,
  serverIdentifier: string,
  instanz: string,
  entityId: string,
  entityFingerprint: string,
): string {
  for (const text of [serverRegion, serverIdentifier, instanz, entityId, entityFingerprint]) {
    pruefeText(text, "TARGET_OWNERSHIP_ID_TEXT_UNGUELTIG");
  }
  return ["target", serverRegion, serverIdentifier, instanz, entityId, entityFingerprint].join(":");
}

export class TargetOwnershipLedger {
  readonly #maximal: number;
  #slots: readonly TargetOwnershipSicht[] = Object.freeze([]);

  public constructor(maximal = 256) {
    if (!Number.isInteger(maximal) || maximal < 1 || maximal > 2048) {
      throw new Error("TARGET_OWNERSHIP_GRENZE_UNGUELTIG");
    }
    this.#maximal = maximal;
  }

  public beanspruche(
    ownerAblaufId: string,
    ownerCharacterId: string,
    ziel: BewegungsZielBeobachtung,
    jetztMs: number,
    leaseDauerMs: number,
  ): TargetOwnershipToken {
    for (const text of [ownerAblaufId, ownerCharacterId]) {
      pruefeText(text, "TARGET_OWNERSHIP_OWNER_UNGUELTIG");
    }
    if (!Number.isSafeInteger(jetztMs) || jetztMs < ziel.beobachtetAmMs
        || !Number.isSafeInteger(leaseDauerMs) || leaseDauerMs < 1 || leaseDauerMs > 60_000
        || !ziel.visible || ziel.tot) {
      throw new Error("TARGET_OWNERSHIP_PARAMETER_UNGUELTIG");
    }
    const ressourcenId = targetRessourcenId(
      ziel.serverRegion,
      ziel.serverIdentifier,
      ziel.instanz,
      ziel.entityId,
      ziel.entityFingerprint,
    );
    this.#markiereAbgelaufen(jetztMs);
    const alt = this.#slots.find(x => x.ressourcenId === ressourcenId);
    if (alt?.status === "RECOVERY_PENDING") {
      throw new Error("TARGET_OWNERSHIP_ABGLEICH_ERFORDERLICH");
    }
    if (alt?.status === "AKTIV" && alt.ownerAblaufId !== ownerAblaufId) {
      throw new Error("TARGET_BEREITS_FACHLICH_BELEGT");
    }
    if (alt === undefined && this.#slots.length >= this.#maximal) {
      throw new Error("TARGET_OWNERSHIP_LEDGER_VOLL");
    }
    const epoche = alt?.status === "AKTIV" ? alt.epoche : (alt?.epoche ?? 0) + 1;
    const sicht = friereSicht({
      schemaVersion: 1,
      ressourcenId,
      ownerAblaufId,
      ownerCharacterId,
      entityId: ziel.entityId,
      entityFingerprint: ziel.entityFingerprint,
      serverRegion: ziel.serverRegion,
      serverIdentifier: ziel.serverIdentifier,
      map: ziel.map,
      instanz: ziel.instanz,
      epoche,
      leaseBisMs: jetztMs + leaseDauerMs,
      rawTargetIstAuthority: false,
      status: "AKTIV",
    });
    this.#slots = Object.freeze(
      alt === undefined
        ? [...this.#slots, sicht]
        : this.#slots.map(x => x.ressourcenId === ressourcenId ? sicht : x),
    );
    return friereToken(sicht);
  }

  public validiere(
    token: TargetOwnershipToken,
    aktuelleEvidence: BewegungsZielBeobachtung,
    jetztMs: number,
  ): boolean {
    this.#markiereAbgelaufen(jetztMs);
    const slot = this.#slots.find(x => x.ressourcenId === token.ressourcenId);
    return slot !== undefined
      && slot.status === "AKTIV"
      && token.schemaVersion === 1
      && slot.ownerAblaufId === token.ownerAblaufId
      && slot.ownerCharacterId === token.ownerCharacterId
      && slot.epoche === token.epoche
      && slot.leaseBisMs === token.leaseBisMs
      && jetztMs <= token.leaseBisMs
      && aktuelleEvidence.visible
      && !aktuelleEvidence.tot
      && aktuelleEvidence.entityId === token.entityId
      && aktuelleEvidence.entityFingerprint === token.entityFingerprint
      && aktuelleEvidence.serverRegion === token.serverRegion
      && aktuelleEvidence.serverIdentifier === token.serverIdentifier
      && aktuelleEvidence.map === token.map
      && aktuelleEvidence.instanz === token.instanz;
  }

  public gibFrei(token: TargetOwnershipToken, jetztMs: number): void {
    if (!this.validiere(token, {
      schemaVersion: 1,
      entityId: token.entityId,
      entityFingerprint: token.entityFingerprint,
      serverRegion: token.serverRegion,
      serverIdentifier: token.serverIdentifier,
      map: token.map,
      instanz: token.instanz,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      moving: false,
      visible: true,
      tot: false,
      beobachtetAmMs: jetztMs,
    }, jetztMs)) {
      throw new Error("TARGET_OWNERSHIP_TOKEN_UNGUELTIG");
    }
    const alt = this.#slots.find(x => x.ressourcenId === token.ressourcenId);
    if (alt === undefined) throw new Error("TARGET_OWNERSHIP_UNBEKANNT");
    const frei = friereSicht({ ...alt, status: "FREI", leaseBisMs: jetztMs });
    this.#slots = Object.freeze(
      this.#slots.map(x => x.ressourcenId === token.ressourcenId ? frei : x),
    );
  }

  public importiereNachRestart(snapshot: readonly TargetOwnershipSicht[]): void {
    if (snapshot.length > this.#maximal) throw new Error("TARGET_OWNERSHIP_RESTART_ZU_GROSS");
    this.#slots = Object.freeze(snapshot.map((x, index) => {
      if (x.schemaVersion !== 1
          || snapshot.slice(0, index).some(y => y.ressourcenId === x.ressourcenId)) {
        throw new Error("TARGET_OWNERSHIP_RESTART_SNAPSHOT_UNGUELTIG");
      }
      return friereSicht({
        ...x,
        status: x.status === "FREI" ? "FREI" : "RECOVERY_PENDING",
        rawTargetIstAuthority: false,
      });
    }));
  }

  public schliesseAbgleichAb(ressourcenId: string, epoche: number): void {
    const alt = this.#slots.find(x => x.ressourcenId === ressourcenId);
    if (alt === undefined || alt.status !== "RECOVERY_PENDING" || alt.epoche !== epoche) {
      throw new Error("TARGET_OWNERSHIP_ABGLEICH_TOKEN_UNGUELTIG");
    }
    const frei = friereSicht({ ...alt, status: "FREI" });
    this.#slots = Object.freeze(this.#slots.map(x => x.ressourcenId === ressourcenId ? frei : x));
  }

  public snapshot(): readonly TargetOwnershipSicht[] {
    return Object.freeze(this.#slots.map(x => friereSicht(x)));
  }

  #markiereAbgelaufen(jetztMs: number): void {
    if (!Number.isSafeInteger(jetztMs) || jetztMs < 0) throw new Error("TARGET_OWNERSHIP_ZEIT_UNGUELTIG");
    this.#slots = Object.freeze(this.#slots.map(x =>
      x.status === "AKTIV" && x.leaseBisMs < jetztMs
        ? friereSicht({ ...x, status: "RECOVERY_PENDING" })
        : x));
  }
}
