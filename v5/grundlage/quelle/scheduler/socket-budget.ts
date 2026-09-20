import {
  RessourcenVerwalter,
  actionKanalRessourcenId,
  socketBudgetRessourcenId,
  type FencingToken,
} from "./ressourcen-verwalter.js";

export interface MutationsKanalPlan {
  readonly schemaVersion: 1;
  readonly characterId: string;
  readonly kanalId: string;
  readonly actionKanalRessourcenId: string;
  readonly socketBudgetRessourcenId: string;
  readonly geplanteGewichteteKosten: number;
}

export interface SocketBudgetReservierung {
  readonly schemaVersion: 1;
  readonly reservierungId: string;
  readonly characterId: string;
  readonly ablaufId: string;
  readonly kanalId: string;
  readonly zeitMs: number;
  readonly gewichteteKosten: number;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 160) throw new Error(fehler);
}

export function erstelleMutationsKanalPlan(
  characterId: string,
  kanalId: string,
  geplanteGewichteteKosten: number,
): MutationsKanalPlan {
  pruefeText(characterId, "CHARACTER_KENNUNG_UNGUELTIG");
  pruefeText(kanalId, "ACTION_KANAL_KENNUNG_UNGUELTIG");
  if (!Number.isFinite(geplanteGewichteteKosten)
      || geplanteGewichteteKosten <= 0
      || geplanteGewichteteKosten > 100) {
    throw new Error("SOCKET_BUDGET_KOSTEN_UNGUELTIG");
  }
  return Object.freeze({
    schemaVersion: 1,
    characterId,
    kanalId,
    actionKanalRessourcenId: actionKanalRessourcenId(characterId, kanalId),
    socketBudgetRessourcenId: socketBudgetRessourcenId(characterId),
    geplanteGewichteteKosten,
  });
}

export class CharacterSocketBudget {
  readonly #fensterMs: number;
  readonly #planBudget: number;
  readonly #serverGrenze: number;
  readonly #maximaleReservierungen: number;
  #reservierungen: readonly SocketBudgetReservierung[] = Object.freeze([]);

  public constructor(
    fensterMs = 4_000,
    planBudget = 100,
    serverGrenze = 200,
    maximaleReservierungen = 1024,
  ) {
    if (!Number.isSafeInteger(fensterMs) || fensterMs < 1 || fensterMs > 60_000) {
      throw new Error("SOCKET_BUDGET_FENSTER_UNGUELTIG");
    }
    if (!Number.isFinite(planBudget)
        || !Number.isFinite(serverGrenze)
        || planBudget <= 0
        || serverGrenze <= planBudget) {
      throw new Error("SOCKET_BUDGET_GRENZEN_UNGUELTIG");
    }
    if (!Number.isInteger(maximaleReservierungen)
        || maximaleReservierungen < 1
        || maximaleReservierungen > 8192) {
      throw new Error("SOCKET_BUDGET_RESERVIERUNGS_GRENZE_UNGUELTIG");
    }
    this.#fensterMs = fensterMs;
    this.#planBudget = planBudget;
    this.#serverGrenze = serverGrenze;
    this.#maximaleReservierungen = maximaleReservierungen;
  }

  public reserviere(
    reservierungId: string,
    ablaufId: string,
    plan: MutationsKanalPlan,
    jetztMs: number,
  ): SocketBudgetReservierung {
    pruefeText(reservierungId, "SOCKET_BUDGET_RESERVIERUNG_ID_UNGUELTIG");
    pruefeText(ablaufId, "SOCKET_BUDGET_ABLAUF_ID_UNGUELTIG");
    if (!Number.isSafeInteger(jetztMs) || jetztMs < 0) {
      throw new Error("SOCKET_BUDGET_ZEIT_UNGUELTIG");
    }
    if (plan.schemaVersion !== 1
        || plan.actionKanalRessourcenId !== actionKanalRessourcenId(plan.characterId, plan.kanalId)
        || plan.socketBudgetRessourcenId !== socketBudgetRessourcenId(plan.characterId)) {
      throw new Error("SOCKET_BUDGET_MUTATIONSKANAL_PLAN_UNGUELTIG");
    }

    this.#reservierungen = Object.freeze(
      this.#reservierungen.filter(eintrag => jetztMs - eintrag.zeitMs <= this.#fensterMs),
    );
    if (this.#reservierungen.some(eintrag => eintrag.reservierungId === reservierungId)) {
      throw new Error("SOCKET_BUDGET_RESERVIERUNG_DOPPELT");
    }
    if (this.#reservierungen.length >= this.#maximaleReservierungen) {
      throw new Error("SOCKET_BUDGET_RESERVIERUNGEN_VOLL");
    }

    const belegt = this.#reservierungen
      .filter(eintrag => eintrag.characterId === plan.characterId)
      .reduce((summe, eintrag) => summe + eintrag.gewichteteKosten, 0);
    if (belegt + plan.geplanteGewichteteKosten > this.#planBudget) {
      throw new Error("SOCKET_BUDGET_PLANLIMIT_UEBERSCHRITTEN");
    }

    const reservierung = Object.freeze({
      schemaVersion: 1 as const,
      reservierungId,
      characterId: plan.characterId,
      ablaufId,
      kanalId: plan.kanalId,
      zeitMs: jetztMs,
      gewichteteKosten: plan.geplanteGewichteteKosten,
    });
    this.#reservierungen = Object.freeze([...this.#reservierungen, reservierung]);
    return reservierung;
  }

  public validiereReservierung(
    reservierung: SocketBudgetReservierung,
    jetztMs: number,
  ): boolean {
    if (!Number.isSafeInteger(jetztMs) || jetztMs < 0) return false;
    return this.#reservierungen.some(eintrag =>
      eintrag.reservierungId === reservierung.reservierungId
      && eintrag.characterId === reservierung.characterId
      && eintrag.ablaufId === reservierung.ablaufId
      && eintrag.kanalId === reservierung.kanalId
      && eintrag.zeitMs === reservierung.zeitMs
      && eintrag.gewichteteKosten === reservierung.gewichteteKosten
      && jetztMs - eintrag.zeitMs <= this.#fensterMs);
  }

  public storniere(reservierungId: string): void {
    pruefeText(reservierungId, "SOCKET_BUDGET_RESERVIERUNG_ID_UNGUELTIG");
    if (!this.#reservierungen.some(eintrag => eintrag.reservierungId === reservierungId)) {
      throw new Error("SOCKET_BUDGET_RESERVIERUNG_UNBEKANNT");
    }
    this.#reservierungen = Object.freeze(
      this.#reservierungen.filter(eintrag => eintrag.reservierungId !== reservierungId),
    );
  }

  public sicht(characterId: string, jetztMs: number): Readonly<{
    fensterMs: number;
    planBudget: number;
    serverGrenze: number;
    reserve: number;
    belegt: number;
    verfuegbar: number;
  }> {
    pruefeText(characterId, "CHARACTER_KENNUNG_UNGUELTIG");
    if (!Number.isSafeInteger(jetztMs) || jetztMs < 0) {
      throw new Error("SOCKET_BUDGET_ZEIT_UNGUELTIG");
    }
    const belegt = this.#reservierungen
      .filter(eintrag =>
        eintrag.characterId === characterId
        && jetztMs - eintrag.zeitMs <= this.#fensterMs)
      .reduce((summe, eintrag) => summe + eintrag.gewichteteKosten, 0);
    return Object.freeze({
      fensterMs: this.#fensterMs,
      planBudget: this.#planBudget,
      serverGrenze: this.#serverGrenze,
      reserve: this.#serverGrenze - this.#planBudget,
      belegt,
      verfuegbar: Math.max(0, this.#planBudget - belegt),
    });
  }
}

export interface MutationsKanalFreigabe {
  readonly kanalToken: FencingToken;
  readonly budgetReservierung: SocketBudgetReservierung;
}

export class MutationsKanalKoordination {
  readonly #ressourcen: RessourcenVerwalter;
  readonly #budget: CharacterSocketBudget;

  public constructor(
    ressourcen: RessourcenVerwalter,
    budget: CharacterSocketBudget,
  ) {
    this.#ressourcen = ressourcen;
    this.#budget = budget;
  }

  public reserviere(
    reservierungId: string,
    ablaufId: string,
    plan: MutationsKanalPlan,
    jetztMs: number,
  ): MutationsKanalFreigabe {
    const budgetReservierung = this.#budget.reserviere(
      reservierungId,
      ablaufId,
      plan,
      jetztMs,
    );
    try {
      const tokens = this.#ressourcen.beanspruche(ablaufId, [{
        ressourcenId: plan.actionKanalRessourcenId,
        art: "ACTION_KANAL",
        leaseDauerMs: null,
      }], jetztMs);
      const kanalToken = tokens[0];
      if (kanalToken === undefined) throw new Error("ACTION_KANAL_TOKEN_FEHLT");
      return Object.freeze({
        kanalToken,
        budgetReservierung,
      });
    } catch (fehler) {
      this.#budget.storniere(reservierungId);
      throw fehler;
    }
  }
}
