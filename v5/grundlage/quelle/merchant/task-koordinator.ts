import {
  MerchantDemandInbox,
  MerchantWorkflowProvider,
  type MerchantDemand,
  type MerchantDemandArt,
  type MerchantDemandEintrag,
} from "./demand.js";
import {
  bewerteMerchantDienstWechsel,
  type MerchantDienstBereich,
  type MerchantDienstStabilitaetsRichtlinie,
} from "./dienst-stabilitaet.js";
import {
  AblaufScheduler,
  type SchedulerEintrag,
} from "../scheduler/ablauf-scheduler.js";
import type {
  AblaufStatus,
  UnterbrechungsPunkt,
} from "../scheduler/workflow-vertrag.js";

export const MERCHANT_DIENST_STABILITAETS_RICHTLINIE:
MerchantDienstStabilitaetsRichtlinie = Object.freeze({
  richtlinienVersion: "merchant-stability-v1",
  mindestHaltedauerMs: 30_000,
  wechselCooldownMs: 10_000,
  wechselFensterMs: 60_000,
  maximaleWechselImFenster: 3,
  starvationGrenzeMs: 120_000,
  maximaleHistorie: 16,
});

export interface MerchantPlanungsErgebnis {
  readonly schemaVersion: 1;
  readonly geplant: readonly string[];
  readonly abgelaufen: readonly string[];
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

export interface MerchantTaskKoordinatorStatus {
  readonly schemaVersion: 1;
  readonly offeneDemands: number;
  readonly geplanteDemands: number;
  readonly laufendeDemands: number;
  readonly erledigteDemands: number;
  readonly abgebrocheneDemands: number;
  readonly registrierteAblaeufe: number;
  readonly aktuellerDemandId: string | null;
  readonly aktuellerBereich: MerchantDienstBereich | null;
  readonly letzterWechselAmMs: number | null;
  readonly wechselHistorie: number;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

function bereichFuerDemandArt(art: MerchantDemandArt): MerchantDienstBereich {
  if (art.startsWith("BANK_")) return "BANK";
  if (art.startsWith("NPC_")) return "NPC";
  if (art.startsWith("MARKT_") || art === "STAND_LISTING") return "MARKT";
  if (art === "MLUCK_SERVICE") return "MLUCK";
  return "SONSTIG";
}

function pruefeZeit(jetztMs: number): void {
  if (!Number.isSafeInteger(jetztMs) || jetztMs < 0) {
    throw new Error("MERCHANT_TASK_ZEIT_UNGUELTIG");
  }
}

function pruefeGrenze(maximum: number): void {
  if (!Number.isInteger(maximum) || maximum < 1 || maximum > 64) {
    throw new Error("MERCHANT_TASK_PLANUNGSGRENZE_UNGUELTIG");
  }
}

function ablaufIdFuerDemand(demandId: string): string {
  return "merchant:" + demandId;
}

function istTerminal(status: AblaufStatus): boolean {
  return status === "ABGESCHLOSSEN"
    || status === "ABGEBROCHEN"
    || status === "FEHLGESCHLAGEN_SICHER"
    || status === "ABGELAUFEN";
}

export class MerchantTaskKoordinator {
  public readonly gameplayAutoritaet = false as const;
  public readonly rawWriteAutoritaet = false as const;

  readonly #inbox: MerchantDemandInbox;
  readonly #provider: MerchantWorkflowProvider;
  readonly #scheduler: AblaufScheduler;
  readonly #stabilitaetsRichtlinie: MerchantDienstStabilitaetsRichtlinie;
  #aktuellerDemandId: string | null = null;
  #aktuellerBereich: MerchantDienstBereich | null = null;
  #bereichBegonnenAmMs: number | null = null;
  #letzterWechselAmMs: number | null = null;
  #wechselHistorieMs: readonly number[] = Object.freeze([]);

  public constructor(
    inbox: MerchantDemandInbox,
    provider: MerchantWorkflowProvider,
    scheduler: AblaufScheduler,
    stabilitaetsRichtlinie: MerchantDienstStabilitaetsRichtlinie =
      MERCHANT_DIENST_STABILITAETS_RICHTLINIE,
  ) {
    this.#inbox = inbox;
    this.#provider = provider;
    this.#scheduler = scheduler;
    this.#stabilitaetsRichtlinie = Object.freeze({ ...stabilitaetsRichtlinie });
  }

  public planeOffene(
    jetztMs: number,
    maximum = 32,
  ): MerchantPlanungsErgebnis {
    pruefeZeit(jetztMs);
    pruefeGrenze(maximum);

    let geplant: readonly string[] = Object.freeze([]);
    let abgelaufen: readonly string[] = Object.freeze([]);
    const offene = this.#inbox.offene();

    for (const eintrag of offene) {
      if (geplant.length + abgelaufen.length >= maximum) break;
      const demand = eintrag.demand;
      const ablaufId = ablaufIdFuerDemand(demand.demandId);
      const vorhanden = this.#scheduler.sicht().find(
        x => x.plan.ablaufId === ablaufId,
      );
      if (vorhanden !== undefined) {
        throw new Error("MERCHANT_TASK_SCHEDULER_DRIFT:" + demand.demandId);
      }

      if (demand.deadlineAmMs < jetztMs) {
        this.#inbox.setzeStatus(demand.demandId, "ABGEBROCHEN");
        abgelaufen = Object.freeze([...abgelaufen, demand.demandId]);
        continue;
      }

      const plan = this.#provider.plane(demand);
      this.#scheduler.registriere(plan);
      this.#scheduler.setzeStatus(plan.ablaufId, "BEREIT", jetztMs);
      this.#inbox.setzeStatus(demand.demandId, "GEPLANT");
      geplant = Object.freeze([...geplant, demand.demandId]);
    }

    return Object.freeze({
      schemaVersion: 1,
      geplant,
      abgelaufen,
      gameplayAutoritaet: false,
      rawWriteAutoritaet: false,
    });
  }

  public starteNaechsten(
    jetztMs: number,
    lokalitaetsRessourcen: readonly string[] = Object.freeze([]),
  ): MerchantDemandEintrag | null {
    pruefeZeit(jetztMs);
    if (lokalitaetsRessourcen.length > 128) {
      throw new Error("MERCHANT_TASK_LOKALITAET_ZU_GROSS");
    }

    const naechster = this.#scheduler.waehleNaechsten(
      jetztMs,
      lokalitaetsRessourcen,
    );
    if (naechster === undefined) return null;
    if (!naechster.plan.ablaufId.startsWith("merchant:")) {
      return null;
    }

    const demand = this.#findeDemandFuerAblauf(naechster);
    if (demand.status !== "GEPLANT") {
      throw new Error("MERCHANT_TASK_DEMAND_STATUS_DRIFT");
    }

    const laufende = this.#scheduler.sicht().filter(
      x => x.plan.ablaufId.startsWith("merchant:")
        && (x.status === "LAUFEND" || x.status === "SICHER_UNTERBRECHBAR"),
    );
    if (laufende.length > 1) {
      throw new Error("MERCHANT_TASK_MEHRFACH_LAUFEND_DRIFT");
    }

    const laufend = laufende[0];
    if (laufend !== undefined) {
      const schedulerEntscheidung = this.#scheduler.bewerteUnterbrechung(
        laufend.plan.ablaufId,
        naechster.plan.ablaufId,
        jetztMs,
      );
      if (schedulerEntscheidung !== "UNTERBRECHEN") return null;

      const laufenderDemand = this.#findeDemandFuerAblauf(laufend);
      const aktuellerBereich = bereichFuerDemandArt(laufenderDemand.demand.art);
      const bewerberBereich = bereichFuerDemandArt(demand.demand.art);

      if (aktuellerBereich !== bewerberBereich) {
        const bereichBegonnenAmMs =
          this.#aktuellerDemandId === laufenderDemand.demand.demandId
          && this.#bereichBegonnenAmMs !== null
            ? this.#bereichBegonnenAmMs
            : jetztMs;
        const wechsel = bewerteMerchantDienstWechsel(
          {
            aktuellerBereich,
            aktuellePrioritaetsKlasse: laufend.plan.prioritaetsKlasse,
            bereichBegonnenAmMs,
            letzterWechselAmMs: this.#letzterWechselAmMs,
            sichereUnterbrechung: laufend.unterbrechung.erlaubt,
            checkpointDurable: laufend.unterbrechung.checkpointDurable,
            irreversibleMutationOffen: laufend.unterbrechung.irreversibleMutationOffen,
            wechselHistorieMs: this.#wechselHistorieMs,
          },
          {
            bereich: bewerberBereich,
            prioritaetsKlasse: naechster.plan.prioritaetsKlasse,
            wartetSeitMs: naechster.plan.erstelltAmMs,
            deadlineAmMs: naechster.plan.deadlineAmMs,
            schedulerVorrang: true,
          },
          this.#stabilitaetsRichtlinie,
          jetztMs,
        );
        if (!wechsel.wechselErlaubt) return null;

        this.#letzterWechselAmMs = jetztMs;
        this.#bereichBegonnenAmMs = jetztMs;
        this.#wechselHistorieMs = Object.freeze(
          [...this.#wechselHistorieMs, jetztMs]
            .slice(-this.#stabilitaetsRichtlinie.maximaleHistorie),
        );
      }

      this.#scheduler.setzeStatus(
        laufend.plan.ablaufId,
        "PAUSIERT",
        jetztMs,
      );
    } else {
      this.#bereichBegonnenAmMs = jetztMs;
    }

    this.#scheduler.setzeStatus(
      naechster.plan.ablaufId,
      "LAUFEND",
      jetztMs,
    );
    this.#aktuellerDemandId = demand.demand.demandId;
    this.#aktuellerBereich = bereichFuerDemandArt(demand.demand.art);
    return this.#inbox.setzeStatus(
      demand.demand.demandId,
      "LAUFEND",
    );
  }

  public markiereSicherUnterbrechbar(
    demandId: string,
    punkt: UnterbrechungsPunkt,
    jetztMs: number,
  ): MerchantDemandEintrag {
    pruefeZeit(jetztMs);
    const { demand, ablauf } = this.#findePaar(demandId);
    if (demand.status !== "LAUFEND" || ablauf.status !== "LAUFEND") {
      throw new Error("MERCHANT_TASK_UNTERBRECHUNG_STATUS_UNGUELTIG");
    }
    this.#scheduler.meldeUnterbrechungsPunkt(
      ablauf.plan.ablaufId,
      punkt,
      jetztMs,
    );
    this.#scheduler.setzeStatus(
      ablauf.plan.ablaufId,
      "SICHER_UNTERBRECHBAR",
      jetztMs,
    );
    return demand;
  }

  public markiereWartetBeobachtung(
    demandId: string,
    jetztMs: number,
  ): MerchantDemandEintrag {
    pruefeZeit(jetztMs);
    const { demand, ablauf } = this.#findePaar(demandId);
    if (demand.status !== "LAUFEND"
        || (ablauf.status !== "LAUFEND"
          && ablauf.status !== "SICHER_UNTERBRECHBAR")) {
      throw new Error("MERCHANT_TASK_WARTEN_STATUS_UNGUELTIG");
    }
    this.#scheduler.setzeStatus(
      ablauf.plan.ablaufId,
      "WARTET_BEOBACHTUNG",
      jetztMs,
    );
    return demand;
  }

  public markiereBereit(
    demandId: string,
    jetztMs: number,
  ): MerchantDemandEintrag {
    pruefeZeit(jetztMs);
    const { demand, ablauf } = this.#findePaar(demandId);
    if (demand.status !== "LAUFEND"
        || (ablauf.status !== "WARTET_BEOBACHTUNG"
          && ablauf.status !== "WARTET_BEDINGUNG"
          && ablauf.status !== "PAUSIERT")) {
      throw new Error("MERCHANT_TASK_BEREIT_STATUS_UNGUELTIG");
    }
    this.#scheduler.setzeStatus(
      ablauf.plan.ablaufId,
      "BEREIT",
      jetztMs,
    );
    return this.#inbox.setzeStatus(demandId, "GEPLANT");
  }

  public markiereErledigt(
    demandId: string,
    jetztMs: number,
  ): MerchantDemandEintrag {
    pruefeZeit(jetztMs);
    const { demand, ablauf } = this.#findePaar(demandId);
    if (demand.status !== "LAUFEND"
        || ![
          "LAUFEND",
          "WARTET_BEOBACHTUNG",
          "WARTET_BEDINGUNG",
          "SICHER_UNTERBRECHBAR",
        ].includes(ablauf.status)) {
      throw new Error("MERCHANT_TASK_ABSCHLUSS_STATUS_UNGUELTIG");
    }
    this.#scheduler.setzeStatus(
      ablauf.plan.ablaufId,
      "ABGESCHLOSSEN",
      jetztMs,
    );
    if (this.#aktuellerDemandId === demandId) {
      this.#aktuellerDemandId = null;
      this.#aktuellerBereich = null;
      this.#bereichBegonnenAmMs = null;
    }
    return this.#inbox.setzeStatus(demandId, "ERLEDIGT");
  }

  public markiereAbgebrochen(
    demandId: string,
    jetztMs: number,
  ): MerchantDemandEintrag {
    pruefeZeit(jetztMs);
    const { demand, ablauf } = this.#findePaar(demandId);
    if (demand.status === "ERLEDIGT"
        || demand.status === "ABGEBROCHEN"
        || istTerminal(ablauf.status)) {
      throw new Error("MERCHANT_TASK_ABBRUCH_STATUS_UNGUELTIG");
    }
    this.#scheduler.setzeStatus(
      ablauf.plan.ablaufId,
      "ABGEBROCHEN",
      jetztMs,
    );
    if (this.#aktuellerDemandId === demandId) {
      this.#aktuellerDemandId = null;
      this.#aktuellerBereich = null;
      this.#bereichBegonnenAmMs = null;
    }
    return this.#inbox.setzeStatus(demandId, "ABGEBROCHEN");
  }

  public status(): MerchantTaskKoordinatorStatus {
    const demands = this.#inbox.sicht();
    const ablaeufe = this.#scheduler.sicht();
    return Object.freeze({
      schemaVersion: 1,
      offeneDemands: demands.filter(x => x.status === "OFFEN").length,
      geplanteDemands: demands.filter(x => x.status === "GEPLANT").length,
      laufendeDemands: demands.filter(x => x.status === "LAUFEND").length,
      erledigteDemands: demands.filter(x => x.status === "ERLEDIGT").length,
      abgebrocheneDemands: demands.filter(x => x.status === "ABGEBROCHEN").length,
      registrierteAblaeufe: ablaeufe.filter(
        x => x.plan.ablaufId.startsWith("merchant:"),
      ).length,
      aktuellerDemandId: this.#aktuellerDemandId,
      aktuellerBereich: this.#aktuellerBereich,
      letzterWechselAmMs: this.#letzterWechselAmMs,
      wechselHistorie: this.#wechselHistorieMs.length,
      gameplayAutoritaet: false,
      rawWriteAutoritaet: false,
    });
  }

  #findeDemandFuerAblauf(
    ablauf: SchedulerEintrag,
  ): MerchantDemandEintrag {
    const demandId = ablauf.plan.ablaufId.slice("merchant:".length);
    const demand = this.#inbox.sicht().find(
      x => x.demand.demandId === demandId,
    );
    if (demand === undefined) {
      throw new Error("MERCHANT_TASK_DEMAND_FEHLT:" + demandId);
    }
    return demand;
  }

  #findePaar(
    demandId: string,
  ): Readonly<{
    demand: MerchantDemandEintrag;
    ablauf: SchedulerEintrag;
  }> {
    const demand = this.#inbox.sicht().find(
      x => x.demand.demandId === demandId,
    );
    if (demand === undefined) {
      throw new Error("MERCHANT_TASK_DEMAND_FEHLT:" + demandId);
    }
    const ablauf = this.#scheduler.sicht().find(
      x => x.plan.ablaufId === ablaufIdFuerDemand(demandId),
    );
    if (ablauf === undefined) {
      throw new Error("MERCHANT_TASK_ABLAUF_FEHLT:" + demandId);
    }
    return Object.freeze({ demand, ablauf });
  }
}
