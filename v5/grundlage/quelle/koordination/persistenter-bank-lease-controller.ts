import {
  BankLeaseKoordinator,
  type BankExternalFence,
  type BankFreigabeNachweis,
  type BankLeaseSicht,
  type BankLeaseToken,
  type BankLeaseZustand,
  type BankSnapshotNachweis,
} from "./account-bank-lease.js";
import type { FencingToken } from "../scheduler/ressourcen-verwalter.js";

const BANK_LEASE_MAX_EINTRAEGE = 128;

export interface BankLeasePersistenzPort {
  lies(): Promise<string | undefined>;
  schreibeDurable(inhalt: string, tempKennung: string): Promise<void>;
}

export interface PersistierteBankLeaseSicht {
  readonly schemaVersion: 1;
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
}

export interface PersistierterBankLeaseSnapshot {
  readonly schemaVersion: 1;
  readonly gespeichertAmMs: number;
  readonly eintraege: readonly PersistierteBankLeaseSicht[];
}

export interface PersistenterBankLeaseLadeStatus {
  readonly schemaVersion: 1;
  readonly geladen: boolean;
  readonly recoveryPending: number;
  readonly released: number;
  readonly epocheFloorsImportiert: number;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

function istObjekt(
  wert: unknown,
): wert is Readonly<Record<string, unknown>> {
  return typeof wert === "object" && wert !== null && !Array.isArray(wert);
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function pruefeZeit(wert: number, fehler: string): void {
  if (!Number.isSafeInteger(wert) || wert < 0) throw new Error(fehler);
}

function validiereZustand(wert: unknown): BankLeaseZustand {
  const erlaubte: readonly BankLeaseZustand[] = Object.freeze([
    "ACQUIRING",
    "ACTIVE",
    "RECOVERY_PENDING",
    "RELEASING",
    "RELEASED",
    "QUARANTINED",
  ]);
  if (typeof wert !== "string"
      || !erlaubte.includes(wert as BankLeaseZustand)) {
    throw new Error("BANK_LEASE_PERSISTENZ_ZUSTAND_UNGUELTIG");
  }
  return wert as BankLeaseZustand;
}

function validierePersistiert(
  roh: unknown,
): PersistierteBankLeaseSicht {
  if (!istObjekt(roh) || roh["schemaVersion"] !== 1) {
    throw new Error("BANK_LEASE_PERSISTENZ_EINTRAG_UNGUELTIG");
  }
  const textFelder = [
    "accountId",
    "ownerCharacterId",
    "ablaufId",
    "purpose",
    "serverRegion",
    "serverIdentifier",
  ] as const;
  for (const feld of textFelder) {
    const wert = roh[feld];
    if (typeof wert !== "string") {
      throw new Error("BANK_LEASE_PERSISTENZ_EINTRAG_UNGUELTIG");
    }
    pruefeText(wert, "BANK_LEASE_PERSISTENZ_TEXT_UNGUELTIG");
  }
  const epoche = roh["epoche"];
  const acquiredAtMs = roh["acquiredAtMs"];
  const lastHeartbeatAtMs = roh["lastHeartbeatAtMs"];
  if (typeof epoche !== "number"
      || !Number.isSafeInteger(epoche)
      || epoche < 1
      || typeof acquiredAtMs !== "number"
      || typeof lastHeartbeatAtMs !== "number") {
    throw new Error("BANK_LEASE_PERSISTENZ_EINTRAG_UNGUELTIG");
  }
  pruefeZeit(acquiredAtMs, "BANK_LEASE_PERSISTENZ_ZEIT_UNGUELTIG");
  pruefeZeit(lastHeartbeatAtMs, "BANK_LEASE_PERSISTENZ_ZEIT_UNGUELTIG");
  if (lastHeartbeatAtMs < acquiredAtMs) {
    throw new Error("BANK_LEASE_PERSISTENZ_ZEITREIHENFOLGE_UNGUELTIG");
  }

  return Object.freeze({
    schemaVersion: 1,
    accountId: roh["accountId"] as string,
    ownerCharacterId: roh["ownerCharacterId"] as string,
    ablaufId: roh["ablaufId"] as string,
    epoche,
    zustand: validiereZustand(roh["zustand"]),
    acquiredAtMs,
    lastHeartbeatAtMs,
    purpose: roh["purpose"] as string,
    serverRegion: roh["serverRegion"] as string,
    serverIdentifier: roh["serverIdentifier"] as string,
  });
}

function parseSnapshot(text: string): PersistierterBankLeaseSnapshot {
  if (text.length < 2 || text.length > 500_000) {
    throw new Error("BANK_LEASE_PERSISTENZ_GROESSE_UNGUELTIG");
  }
  let roh: unknown;
  try {
    roh = JSON.parse(text);
  } catch {
    throw new Error("BANK_LEASE_PERSISTENZ_JSON_UNGUELTIG");
  }
  if (!istObjekt(roh)
      || roh["schemaVersion"] !== 1
      || typeof roh["gespeichertAmMs"] !== "number"
      || !Array.isArray(roh["eintraege"])
      || roh["eintraege"].length > BANK_LEASE_MAX_EINTRAEGE) {
    throw new Error("BANK_LEASE_PERSISTENZ_SNAPSHOT_UNGUELTIG");
  }
  pruefeZeit(
    roh["gespeichertAmMs"],
    "BANK_LEASE_PERSISTENZ_SPEICHERZEIT_UNGUELTIG",
  );
  const eintraege = Object.freeze(
    roh["eintraege"].map(validierePersistiert),
  );
  const accounts = eintraege.map(x => x.accountId).sort();
  if (accounts.some((x, i) => i > 0 && x === accounts[i - 1])) {
    throw new Error("BANK_LEASE_PERSISTENZ_ACCOUNT_DOPPELT");
  }
  return Object.freeze({
    schemaVersion: 1,
    gespeichertAmMs: roh["gespeichertAmMs"],
    eintraege,
  });
}

function persistierbar(sicht: BankLeaseSicht): PersistierteBankLeaseSicht {
  return Object.freeze({
    schemaVersion: 1,
    accountId: sicht.accountId,
    ownerCharacterId: sicht.ownerCharacterId,
    ablaufId: sicht.ablaufId,
    epoche: sicht.epoche,
    zustand: sicht.zustand,
    acquiredAtMs: sicht.acquiredAtMs,
    lastHeartbeatAtMs: sicht.lastHeartbeatAtMs,
    purpose: sicht.purpose,
    serverRegion: sicht.serverRegion,
    serverIdentifier: sicht.serverIdentifier,
  });
}

export class PersistenterBankLeaseController {
  public readonly gameplayAutoritaet = false as const;
  public readonly rawWriteAutoritaet = false as const;

  readonly #koordinator: BankLeaseKoordinator;
  readonly #persistenz: BankLeasePersistenzPort;
  #persistierteFloors: readonly PersistierteBankLeaseSicht[] =
    Object.freeze([]);
  #persistenzGesperrt = false;

  public constructor(
    koordinator: BankLeaseKoordinator,
    persistenz: BankLeasePersistenzPort,
  ) {
    this.#koordinator = koordinator;
    this.#persistenz = persistenz;
  }

  public async lade(
    jetztMs: number,
  ): Promise<PersistenterBankLeaseLadeStatus> {
    pruefeZeit(jetztMs, "BANK_LEASE_CONTROLLER_ZEIT_UNGUELTIG");
    const text = await this.#persistenz.lies();
    if (text === undefined) {
      return Object.freeze({
        schemaVersion: 1,
        geladen: false,
        recoveryPending: 0,
        released: 0,
        epocheFloorsImportiert: 0,
        gameplayAutoritaet: false,
        rawWriteAutoritaet: false,
      });
    }

    const snapshot = parseSnapshot(text);
    if (snapshot.gespeichertAmMs > jetztMs) {
      throw new Error("BANK_LEASE_PERSISTENZ_AUS_ZUKUNFT");
    }

    this.#persistierteFloors = Object.freeze([...snapshot.eintraege]);
    for (const row of snapshot.eintraege) {
      this.#koordinator.importiereEpocheFloor(row.accountId, row.epoche);
      if (row.zustand !== "RELEASED") {
        this.#koordinator.importiereNachRestart({
          accountId: row.accountId,
          ownerCharacterId: row.ownerCharacterId,
          ablaufId: row.ablaufId,
          epoche: row.epoche,
          acquiredAtMs: row.acquiredAtMs,
          lastHeartbeatAtMs: row.lastHeartbeatAtMs,
          purpose: row.purpose,
          serverRegion: row.serverRegion,
          serverIdentifier: row.serverIdentifier,
        });
      }
    }
    await this.#persistiere(jetztMs);

    const sicht = this.#koordinator.sicht();
    return Object.freeze({
      schemaVersion: 1,
      geladen: true,
      recoveryPending: sicht.filter(
        x => x.zustand === "RECOVERY_PENDING",
      ).length,
      released: snapshot.eintraege.filter(
        x => x.zustand === "RELEASED",
      ).length,
      epocheFloorsImportiert: snapshot.eintraege.length,
      gameplayAutoritaet: false,
      rawWriteAutoritaet: false,
    });
  }

  public async beanspruche(
    accountId: string,
    ownerCharacterId: string,
    ablaufId: string,
    purpose: string,
    serverRegion: string,
    serverIdentifier: string,
    jetztMs: number,
    leaseDauerMs: number,
  ): Promise<BankLeaseToken> {
    this.#pruefePersistenzOffen();
    const token = this.#koordinator.beanspruche(
      accountId,
      ownerCharacterId,
      ablaufId,
      purpose,
      serverRegion,
      serverIdentifier,
      jetztMs,
      leaseDauerMs,
    );
    try {
      await this.#persistiere(jetztMs);
      return token;
    } catch (fehler) {
      this.#persistenzGesperrt = true;
      try {
        this.#koordinator.markiereRecovery(token, jetztMs);
      } catch {
        // Lokale Ressource bleibt fail-closed belegt.
      }
      throw fehler;
    }
  }

  public async aktiviere(
    token: BankLeaseToken,
    fence: BankExternalFence,
    jetztMs: number,
  ): Promise<BankLeaseSicht> {
    this.#pruefePersistenzOffen();
    const sicht = this.#koordinator.aktiviere(token, fence, jetztMs);
    try {
      await this.#persistiere(jetztMs);
      return sicht;
    } catch (fehler) {
      this.#persistenzGesperrt = true;
      if (sicht.zustand === "ACTIVE") {
        try {
          this.#koordinator.markiereRecovery(token, jetztMs);
        } catch {
          // Token bleibt ohne erfolgreiche Persistenz unbrauchbar.
        }
      }
      throw fehler;
    }
  }

  public async heartbeat(
    token: BankLeaseToken,
    jetztMs: number,
    leaseDauerMs: number,
  ): Promise<BankLeaseToken> {
    this.#pruefePersistenzOffen();
    const neu = this.#koordinator.heartbeat(token, jetztMs, leaseDauerMs);
    try {
      await this.#persistiere(jetztMs);
      return neu;
    } catch (fehler) {
      this.#persistenzGesperrt = true;
      try {
        this.#koordinator.markiereRecovery(neu, jetztMs);
      } catch {
        // Lokaler Zustand bleibt fail-closed.
      }
      throw fehler;
    }
  }

  public validiereMutation(
    token: BankLeaseToken,
    lokalerBankKanalToken: FencingToken,
    fence: BankExternalFence,
    jetztMs: number,
  ): boolean {
    if (this.#persistenzGesperrt) return false;
    return this.#koordinator.validiereMutation(
      token,
      lokalerBankKanalToken,
      fence,
      jetztMs,
    );
  }

  public validiereSnapshot(
    token: BankLeaseToken,
    snapshot: BankSnapshotNachweis,
    jetztMs: number,
    maximaleAlterMs: number,
  ): boolean {
    if (this.#persistenzGesperrt) return false;
    return this.#koordinator.validiereSnapshot(
      token,
      snapshot,
      jetztMs,
      maximaleAlterMs,
    );
  }

  public async markiereRecovery(
    token: BankLeaseToken,
    jetztMs: number,
  ): Promise<BankLeaseSicht> {
    this.#pruefePersistenzOffen();
    const sicht = this.#koordinator.markiereRecovery(token, jetztMs);
    await this.#persistiere(jetztMs);
    return sicht;
  }

  public async beginneFreigabe(
    token: BankLeaseToken,
    jetztMs: number,
  ): Promise<BankLeaseSicht> {
    this.#pruefePersistenzOffen();
    const sicht = this.#koordinator.beginneFreigabe(token, jetztMs);
    await this.#persistiere(jetztMs);
    return sicht;
  }

  public async gibFrei(
    token: BankLeaseToken,
    nachweis: BankFreigabeNachweis,
    jetztMs: number,
  ): Promise<BankLeaseSicht> {
    this.#pruefePersistenzOffen();
    const sicht = this.#koordinator.gibFrei(token, nachweis, jetztMs);
    await this.#persistiere(jetztMs);
    return sicht;
  }

  public async schliesseRestartAbgleichAb(
    accountId: string,
    erwarteteEpoche: number,
    externeBelegungFrei: boolean,
    jetztMs: number,
  ): Promise<BankLeaseSicht> {
    this.#pruefePersistenzOffen();
    const sicht = this.#koordinator.schliesseRestartAbgleichAb(
      accountId,
      erwarteteEpoche,
      externeBelegungFrei,
      jetztMs,
    );
    await this.#persistiere(jetztMs);
    return sicht;
  }

  public sicht(): readonly BankLeaseSicht[] {
    return this.#koordinator.sicht();
  }

  #pruefePersistenzOffen(): void {
    if (this.#persistenzGesperrt) {
      throw new Error("BANK_LEASE_PERSISTENZ_FEHLER_GESPERRT");
    }
  }

  async #persistiere(jetztMs: number): Promise<void> {
    pruefeZeit(jetztMs, "BANK_LEASE_CONTROLLER_ZEIT_UNGUELTIG");
    const sicht = this.#koordinator.sicht();
    if (sicht.length > BANK_LEASE_MAX_EINTRAEGE) {
      throw new Error("BANK_LEASE_PERSISTENZ_ZU_VIELE_EINTRAEGE");
    }
    const live = Object.freeze(sicht.map(persistierbar));
    const ohneLive = this.#persistierteFloors.filter(
      alt => !live.some(neu => neu.accountId === alt.accountId),
    );
    const eintraege = Object.freeze(
      [...live, ...ohneLive]
        .sort((a, b) => a.accountId.localeCompare(b.accountId)),
    );
    if (eintraege.length > BANK_LEASE_MAX_EINTRAEGE) {
      throw new Error("BANK_LEASE_PERSISTENZ_ZU_VIELE_EINTRAEGE");
    }
    this.#persistierteFloors = eintraege;
    const snapshot: PersistierterBankLeaseSnapshot = Object.freeze({
      schemaVersion: 1,
      gespeichertAmMs: jetztMs,
      eintraege,
    });
    const inhalt = JSON.stringify(snapshot);
    if (inhalt.length > 500_000) {
      throw new Error("BANK_LEASE_PERSISTENZ_ZU_GROSS");
    }
    try {
      await this.#persistenz.schreibeDurable(
        inhalt + "\n",
        "bank-lease-" + jetztMs,
      );
    } catch (fehler) {
      this.#persistenzGesperrt = true;
      throw fehler;
    }
  }
}
