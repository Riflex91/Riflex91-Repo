import {
  type AblaufPlan,
  type AblaufPrioritaetsKlasse,
  type WissensSnapshotPin,
} from "../scheduler/workflow-vertrag.js";

export type MerchantDemandArt =
  | "BANK_STORE"
  | "BANK_RETRIEVE"
  | "BANK_CONSOLIDATE"
  | "BANK_ERWEITERN"
  | "NPC_BUY"
  | "NPC_SELL"
  | "MARKT_BEOBACHTEN"
  | "MARKT_BUY"
  | "MARKT_SELL"
  | "STAND_LISTING"
  | "INVENTAR_AUFRAEUMEN"
  | "MLUCK_SERVICE";

export type MerchantDemandStatus =
  | "OFFEN"
  | "GEPLANT"
  | "LAUFEND"
  | "ERLEDIGT"
  | "ABGEBROCHEN";

export interface MerchantDemand {
  readonly schemaVersion: 1;
  readonly demandId: string;
  readonly art: MerchantDemandArt;
  readonly characterId: string;
  readonly accountId: string | null;
  readonly erstelltAmMs: number;
  readonly deadlineAmMs: number;
  readonly prioritaetsKlasse: AblaufPrioritaetsKlasse;
  readonly prioritaetsRang: number;
  readonly ressourcenIds: readonly string[];
  readonly payloadFingerprint: string;
  readonly wissensSnapshot: WissensSnapshotPin;
}

export interface MerchantDemandEintrag {
  readonly demand: MerchantDemand;
  readonly status: MerchantDemandStatus;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function friereDemand(demand: MerchantDemand): MerchantDemand {
  return Object.freeze({
    ...demand,
    ressourcenIds: Object.freeze([...demand.ressourcenIds].sort()),
    wissensSnapshot: Object.freeze({
      gitCommit: demand.wissensSnapshot.gitCommit,
      quellenSha256: Object.freeze([...demand.wissensSnapshot.quellenSha256].sort()),
    }),
  });
}

export class MerchantDemandInbox {
  readonly #maximal: number;
  #eintraege: readonly MerchantDemandEintrag[] = Object.freeze([]);

  public constructor(maximal = 512) {
    if (!Number.isInteger(maximal) || maximal < 1 || maximal > 4096) {
      throw new Error("MERCHANT_DEMAND_GRENZE_UNGUELTIG");
    }
    this.#maximal = maximal;
  }

  public legeAn(demand: MerchantDemand): MerchantDemandEintrag {
    this.#validiere(demand);
    if (this.#eintraege.length >= this.#maximal) throw new Error("MERCHANT_DEMAND_INBOX_VOLL");
    if (this.#eintraege.some(x => x.demand.demandId === demand.demandId)) {
      throw new Error("MERCHANT_DEMAND_DOPPELT");
    }
    const eintrag = Object.freeze({ demand: friereDemand(demand), status: "OFFEN" as const });
    this.#eintraege = Object.freeze([...this.#eintraege, eintrag]);
    return eintrag;
  }

  public setzeStatus(demandId: string, status: MerchantDemandStatus): MerchantDemandEintrag {
    const alt = this.#finde(demandId);
    const neu = Object.freeze({ demand: alt.demand, status });
    this.#eintraege = Object.freeze(
      this.#eintraege.map(x => x.demand.demandId === demandId ? neu : x),
    );
    return neu;
  }

  public offene(): readonly MerchantDemandEintrag[] {
    return Object.freeze(
      this.#eintraege
        .filter(x => x.status === "OFFEN")
        .sort((a, b) =>
          a.demand.erstelltAmMs - b.demand.erstelltAmMs
          || a.demand.demandId.localeCompare(b.demand.demandId))
        .map(x => Object.freeze({ demand: friereDemand(x.demand), status: x.status })),
    );
  }

  public sicht(): readonly MerchantDemandEintrag[] {
    return Object.freeze(
      [...this.#eintraege]
        .sort((a, b) => a.demand.demandId.localeCompare(b.demand.demandId))
        .map(x => Object.freeze({ demand: friereDemand(x.demand), status: x.status })),
    );
  }

  #finde(demandId: string): MerchantDemandEintrag {
    const eintrag = this.#eintraege.find(x => x.demand.demandId === demandId);
    if (eintrag === undefined) throw new Error("MERCHANT_DEMAND_UNBEKANNT");
    return eintrag;
  }

  #validiere(demand: MerchantDemand): void {
    if (demand.schemaVersion !== 1) throw new Error("MERCHANT_DEMAND_SCHEMA_UNGUELTIG");
    for (const wert of [demand.demandId, demand.characterId, demand.payloadFingerprint]) {
      pruefeText(wert, "MERCHANT_DEMAND_TEXT_UNGUELTIG");
    }
    if (demand.accountId !== null) pruefeText(demand.accountId, "MERCHANT_ACCOUNT_ID_UNGUELTIG");
    if (!Number.isSafeInteger(demand.erstelltAmMs)
        || !Number.isSafeInteger(demand.deadlineAmMs)
        || demand.erstelltAmMs < 0
        || demand.deadlineAmMs < demand.erstelltAmMs) {
      throw new Error("MERCHANT_DEMAND_ZEIT_UNGUELTIG");
    }
    if (!Number.isInteger(demand.prioritaetsRang)
        || demand.prioritaetsRang < 0
        || demand.prioritaetsRang > 1_000_000) {
      throw new Error("MERCHANT_DEMAND_PRIORITAET_UNGUELTIG");
    }
    if (demand.ressourcenIds.length > 64) throw new Error("MERCHANT_DEMAND_ZU_VIELE_RESSOURCEN");
    const ids = [...demand.ressourcenIds].sort();
    for (let i = 0; i < ids.length; i += 1) {
      const id = ids[i];
      if (id === undefined) throw new Error("MERCHANT_RESSOURCE_FEHLT");
      pruefeText(id, "MERCHANT_RESSOURCE_UNGUELTIG");
      if (i > 0 && ids[i - 1] === id) throw new Error("MERCHANT_RESSOURCE_DOPPELT");
    }
    if (!/^[0-9a-f]{40}$/i.test(demand.wissensSnapshot.gitCommit)) {
      throw new Error("MERCHANT_WISSENS_COMMIT_UNGUELTIG");
    }
    if (demand.wissensSnapshot.quellenSha256.length < 1) {
      throw new Error("MERCHANT_WISSENS_HASH_FEHLT");
    }
    for (const hash of demand.wissensSnapshot.quellenSha256) {
      if (!/^[0-9a-f]{64}$/i.test(hash)) throw new Error("MERCHANT_WISSENS_HASH_UNGUELTIG");
    }
  }
}

export class MerchantWorkflowProvider {
  public plane(demand: MerchantDemand): AblaufPlan {
    const accountRessourcen = demand.art.startsWith("BANK_")
      ? ["account:" + (demand.accountId ?? "FEHLT") + ":bank"]
      : [];
    if (demand.art.startsWith("BANK_") && demand.accountId === null) {
      throw new Error("MERCHANT_BANK_DEMAND_OHNE_ACCOUNT");
    }

    const alleRessourcen = [...demand.ressourcenIds, ...accountRessourcen].sort();
    const ressourcenIds = Object.freeze(
      alleRessourcen.filter((wert, index) => index === 0 || wert !== alleRessourcen[index - 1]),
    );
    return Object.freeze({
      schemaVersion: 1 as const,
      ablaufId: "merchant:" + demand.demandId,
      ablaufArt: "MERCHANT_" + demand.art,
      eigentuemerModulId: "merchant-core-a",
      prioritaetsKlasse: demand.prioritaetsKlasse,
      prioritaetsRang: demand.prioritaetsRang,
      erstelltAmMs: demand.erstelltAmMs,
      deadlineAmMs: demand.deadlineAmMs,
      ressourcenIds,
      wissensSnapshot: demand.wissensSnapshot,
      wiederholung: Object.freeze({
        maximaleVersuche: 1,
        maximaleDauerMs: Math.max(1, demand.deadlineAmMs - demand.erstelltAmMs),
        anfangsBackoffMs: 1,
        maximalerBackoffMs: 1,
        backoffFaktor: 1,
        circuitSchluessel: "merchant:" + demand.art.toLowerCase(),
      }),
      idempotenzSchluessel: "merchant-demand:" + demand.demandId + ":" + demand.payloadFingerprint,
      abgleichStrategie: "MERCHANT_RECONCILE_FROM_FRESH_OBSERVATION",
      gameplayAutoritaet: false,
      rawWriteAutoritaet: false,
    });
  }
}
