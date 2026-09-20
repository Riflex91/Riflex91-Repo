import {
  RessourcenVerwalter,
  actionKanalRessourcenId,
  type FencingToken,
} from "../scheduler/ressourcen-verwalter.js";

export type BankLeaseZustand =
  | "ACQUIRING"
  | "ACTIVE"
  | "RECOVERY_PENDING"
  | "RELEASING"
  | "RELEASED"
  | "QUARANTINED";

export interface BankExternalFence {
  readonly serverRegion: string;
  readonly serverIdentifier: string;
  readonly mountedCharacterId: string | null;
  readonly konflikt: boolean;
}

export interface BankLeaseToken {
  readonly schemaVersion: 1;
  readonly accountId: string;
  readonly ownerCharacterId: string;
  readonly ablaufId: string;
  readonly epoche: number;
  readonly ressourcenToken: FencingToken;
}

export interface BankLeaseSicht {
  readonly accountId: string;
  readonly ownerCharacterId: string;
  readonly ablaufId: string;
  readonly epoche: number;
  readonly zustand: BankLeaseZustand;
  readonly acquiredAtMs: number;
  readonly lastHeartbeatAtMs: number;
  readonly purpose: string;
  readonly serverRegion: string;
  readonly serverIdentifier: string;
  readonly ressourcenToken: FencingToken | null;
}

export interface BankFreigabeNachweis {
  readonly offeneTransaktionen: number;
  readonly backendInProgress: boolean;
  readonly bankActionInFlight: boolean;
  readonly characterBankAktiv: boolean;
  readonly erwarteterExitBeobachtet: boolean;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function bankRessourcenId(accountId: string): string {
  pruefeText(accountId, "BANK_ACCOUNT_ID_UNGUELTIG");
  return "account:" + accountId + ":bank";
}

function istNichtTerminal(zustand: BankLeaseZustand): boolean {
  return zustand !== "RELEASED";
}

export class BankLeaseKoordinator {
  readonly #ressourcen: RessourcenVerwalter;
  #leases: readonly BankLeaseSicht[] = Object.freeze([]);
  #epocheFloor = new Map<string, number>();

  public constructor(ressourcen: RessourcenVerwalter) {
    this.#ressourcen = ressourcen;
  }

  public beanspruche(
    accountId: string,
    ownerCharacterId: string,
    ablaufId: string,
    purpose: string,
    serverRegion: string,
    serverIdentifier: string,
    jetztMs: number,
    leaseDauerMs: number,
  ): BankLeaseToken {
    for (const text of [accountId, ownerCharacterId, ablaufId, purpose, serverRegion, serverIdentifier]) {
      pruefeText(text, "BANK_LEASE_TEXT_UNGUELTIG");
    }
    if (!Number.isSafeInteger(jetztMs) || jetztMs < 0) throw new Error("BANK_LEASE_ZEIT_UNGUELTIG");
    if (!Number.isSafeInteger(leaseDauerMs) || leaseDauerMs < 1) {
      throw new Error("BANK_LEASE_DAUER_UNGUELTIG");
    }
    const offen = this.#leases.find(x => x.accountId === accountId && istNichtTerminal(x.zustand));
    if (offen !== undefined) {
      throw new Error("BANK_LEASE_ACCOUNT_BEREITS_BELEGT:" + offen.zustand);
    }

    const [ressourcenToken] = this.#ressourcen.beanspruche(ablaufId, [{
      ressourcenId: bankRessourcenId(accountId),
      art: "LANGLEBIG",
      leaseDauerMs,
    }], jetztMs);
    if (ressourcenToken === undefined) throw new Error("BANK_LEASE_RESSOURCENTOKEN_FEHLT");

    const floor = this.#epocheFloor.get(accountId) ?? 0;
    const epoche = Math.max(floor + 1, ressourcenToken.epoche);
    this.#epocheFloor.set(accountId, epoche);
    const sicht = Object.freeze({
      accountId,
      ownerCharacterId,
      ablaufId,
      epoche,
      zustand: "ACQUIRING" as const,
      acquiredAtMs: jetztMs,
      lastHeartbeatAtMs: jetztMs,
      purpose,
      serverRegion,
      serverIdentifier,
      ressourcenToken,
    });
    this.#leases = Object.freeze([...this.#leases.filter(x => x.accountId !== accountId), sicht]);
    return Object.freeze({
      schemaVersion: 1,
      accountId,
      ownerCharacterId,
      ablaufId,
      epoche,
      ressourcenToken,
    });
  }

  public aktiviere(
    token: BankLeaseToken,
    fence: BankExternalFence,
    jetztMs: number,
  ): BankLeaseSicht {
    const alt = this.#pruefeToken(token, jetztMs);
    if (alt.zustand !== "ACQUIRING" && alt.zustand !== "RECOVERY_PENDING") {
      throw new Error("BANK_LEASE_AKTIVIERUNG_STATUS_UNGUELTIG");
    }
    if (fence.konflikt
        || fence.mountedCharacterId !== token.ownerCharacterId
        || fence.serverRegion !== alt.serverRegion
        || fence.serverIdentifier !== alt.serverIdentifier) {
      return this.#setzeZustand(alt, "QUARANTINED", jetztMs);
    }
    return this.#setzeZustand(alt, "ACTIVE", jetztMs);
  }

  public heartbeat(token: BankLeaseToken, jetztMs: number, leaseDauerMs: number): BankLeaseToken {
    const alt = this.#pruefeToken(token, jetztMs);
    if (alt.zustand !== "ACTIVE" && alt.zustand !== "ACQUIRING") {
      throw new Error("BANK_LEASE_HEARTBEAT_STATUS_UNGUELTIG");
    }
    const neuToken = this.#ressourcen.verlaengereLease(
      token.ressourcenToken,
      jetztMs,
      leaseDauerMs,
    );
    const neu = Object.freeze({ ...alt, lastHeartbeatAtMs: jetztMs, ressourcenToken: neuToken });
    this.#ersetze(neu);
    return Object.freeze({ ...token, ressourcenToken: neuToken });
  }

  public validiereMutation(
    token: BankLeaseToken,
    lokalerBankKanalToken: FencingToken,
    fence: BankExternalFence,
    jetztMs: number,
  ): boolean {
    let lease: BankLeaseSicht;
    try { lease = this.#pruefeToken(token, jetztMs); }
    catch { return false; }
    return lease.zustand === "ACTIVE"
      && !fence.konflikt
      && fence.mountedCharacterId === token.ownerCharacterId
      && fence.serverRegion === lease.serverRegion
      && fence.serverIdentifier === lease.serverIdentifier
      && lokalerBankKanalToken.ressourcenId
        === actionKanalRessourcenId(token.ownerCharacterId, "bank")
      && lokalerBankKanalToken.ablaufId === token.ablaufId
      && this.#ressourcen.validiereFencing(lokalerBankKanalToken, jetztMs);
  }

  public markiereRecovery(token: BankLeaseToken, jetztMs: number): BankLeaseSicht {
    const alt = this.#pruefeToken(token, jetztMs);
    return this.#setzeZustand(alt, "RECOVERY_PENDING", jetztMs);
  }

  public beginneFreigabe(token: BankLeaseToken, jetztMs: number): BankLeaseSicht {
    const alt = this.#pruefeToken(token, jetztMs);
    if (alt.zustand !== "ACTIVE") throw new Error("BANK_LEASE_RELEASE_NUR_ACTIVE");
    return this.#setzeZustand(alt, "RELEASING", jetztMs);
  }

  public gibFrei(
    token: BankLeaseToken,
    nachweis: BankFreigabeNachweis,
    jetztMs: number,
  ): BankLeaseSicht {
    const alt = this.#pruefeToken(token, jetztMs);
    if (alt.zustand !== "RELEASING") throw new Error("BANK_LEASE_RELEASE_STATUS_UNGUELTIG");
    if (nachweis.offeneTransaktionen !== 0
        || nachweis.backendInProgress
        || nachweis.bankActionInFlight
        || nachweis.characterBankAktiv
        || !nachweis.erwarteterExitBeobachtet) {
      throw new Error("BANK_LEASE_RELEASE_NACHWEIS_UNVOLLSTAENDIG");
    }
    this.#ressourcen.gibFrei(token.ressourcenToken, jetztMs);
    return this.#setzeZustand(alt, "RELEASED", jetztMs, null);
  }

  public importiereNachRestart(
    persistiert: Omit<BankLeaseSicht, "zustand" | "ressourcenToken">,
  ): BankLeaseSicht {
    if (this.#leases.some(x => x.accountId === persistiert.accountId && istNichtTerminal(x.zustand))) {
      throw new Error("BANK_RESTART_ACCOUNT_BEREITS_VORHANDEN");
    }
    this.#epocheFloor.set(
      persistiert.accountId,
      Math.max(this.#epocheFloor.get(persistiert.accountId) ?? 0, persistiert.epoche),
    );
    const sicht = Object.freeze({
      ...persistiert,
      zustand: "RECOVERY_PENDING" as const,
      ressourcenToken: null,
    });
    this.#leases = Object.freeze([...this.#leases, sicht]);
    return sicht;
  }

  public schliesseRestartAbgleichAb(
    accountId: string,
    erwarteteEpoche: number,
    externeBelegungFrei: boolean,
    jetztMs: number,
  ): BankLeaseSicht {
    const alt = this.#leases.find(x =>
      x.accountId === accountId
      && x.epoche === erwarteteEpoche
      && x.zustand === "RECOVERY_PENDING"
      && x.ressourcenToken === null);
    if (alt === undefined) throw new Error("BANK_RESTART_ABGLEICH_LEASE_FEHLT");
    if (!externeBelegungFrei) return this.#setzeZustand(alt, "QUARANTINED", jetztMs, null);
    return this.#setzeZustand(alt, "RELEASED", jetztMs, null);
  }

  public sicht(): readonly BankLeaseSicht[] {
    return Object.freeze(
      [...this.#leases]
        .sort((a, b) => a.accountId.localeCompare(b.accountId))
        .map(x => Object.freeze({ ...x })),
    );
  }

  #pruefeToken(token: BankLeaseToken, jetztMs: number): BankLeaseSicht {
    const lease = this.#leases.find(x =>
      x.accountId === token.accountId
      && x.ownerCharacterId === token.ownerCharacterId
      && x.ablaufId === token.ablaufId
      && x.epoche === token.epoche);
    if (lease === undefined || lease.ressourcenToken === null) {
      throw new Error("BANK_LEASE_TOKEN_UNGUELTIG");
    }
    if (!this.#ressourcen.validiereFencing(token.ressourcenToken, jetztMs)) {
      throw new Error("BANK_LEASE_FENCING_UNGUELTIG");
    }
    return lease;
  }

  #setzeZustand(
    alt: BankLeaseSicht,
    zustand: BankLeaseZustand,
    jetztMs: number,
    ressourcenToken: FencingToken | null = alt.ressourcenToken,
  ): BankLeaseSicht {
    if (!Number.isSafeInteger(jetztMs) || jetztMs < 0) throw new Error("BANK_LEASE_ZEIT_UNGUELTIG");
    const neu = Object.freeze({
      ...alt,
      zustand,
      lastHeartbeatAtMs: jetztMs,
      ressourcenToken,
    });
    this.#ersetze(neu);
    return neu;
  }

  #ersetze(neu: BankLeaseSicht): void {
    this.#leases = Object.freeze(
      this.#leases.map(x => x.accountId === neu.accountId ? neu : x),
    );
  }
}
