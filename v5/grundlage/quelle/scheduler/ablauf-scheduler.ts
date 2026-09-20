import {
  type AblaufPlan,
  type AblaufStatus,
  type UnterbrechungsPunkt,
  friereAblaufPlan,
  istSafetyOderNotfall,
  prioritaetsKlassenRang,
} from "./workflow-vertrag.js";

export interface SchedulerEintrag {
  readonly plan: AblaufPlan;
  readonly status: AblaufStatus;
  readonly unterbrechung: UnterbrechungsPunkt;
  readonly letzteFortschrittMs: number;
}

export type UnterbrechungsEntscheidung =
  | "UNTERBRECHEN"
  | "WARTEN_BIS_SICHERER_PUNKT"
  | "KEIN_VORRANG";

function friereUnterbrechung(punkt: UnterbrechungsPunkt): UnterbrechungsPunkt {
  return Object.freeze({ ...punkt });
}

function friereEintrag(eintrag: SchedulerEintrag): SchedulerEintrag {
  return Object.freeze({
    ...eintrag,
    plan: friereAblaufPlan(eintrag.plan),
    unterbrechung: friereUnterbrechung(eintrag.unterbrechung),
  });
}

function validiereZeit(zeitMs: number): void {
  if (!Number.isSafeInteger(zeitMs) || zeitMs < 0) {
    throw new Error("SCHEDULER_ZEIT_UNGUELTIG");
  }
}

export class AblaufScheduler {
  readonly #maximaleAblaeufe: number;
  readonly #agingIntervallMs: number;
  #eintraege: readonly SchedulerEintrag[] = Object.freeze([]);

  public constructor(maximaleAblaeufe = 512, agingIntervallMs = 1_000) {
    if (!Number.isInteger(maximaleAblaeufe)
        || maximaleAblaeufe < 1
        || maximaleAblaeufe > 4096) {
      throw new Error("SCHEDULER_GRENZE_UNGUELTIG");
    }
    if (!Number.isSafeInteger(agingIntervallMs)
        || agingIntervallMs < 1
        || agingIntervallMs > 3_600_000) {
      throw new Error("SCHEDULER_AGING_INTERVALL_UNGUELTIG");
    }
    this.#maximaleAblaeufe = maximaleAblaeufe;
    this.#agingIntervallMs = agingIntervallMs;
  }

  public registriere(plan: AblaufPlan): SchedulerEintrag {
    const gefroren = friereAblaufPlan(plan);
    if (this.#eintraege.length >= this.#maximaleAblaeufe) {
      throw new Error("SCHEDULER_VOLL");
    }
    if (this.#eintraege.some(x => x.plan.ablaufId === gefroren.ablaufId)) {
      throw new Error("SCHEDULER_ABLAUF_DOPPELT");
    }
    const eintrag = friereEintrag({
      plan: gefroren,
      status: "GEPLANT",
      unterbrechung: {
        erlaubt: false,
        sichererPunktId: null,
        irreversibleMutationOffen: false,
        checkpointDurable: false,
      },
      letzteFortschrittMs: gefroren.erstelltAmMs,
    });
    this.#eintraege = Object.freeze([...this.#eintraege, eintrag]);
    return eintrag;
  }

  public setzeStatus(
    ablaufId: string,
    status: AblaufStatus,
    jetztMs: number,
  ): SchedulerEintrag {
    validiereZeit(jetztMs);
    const alt = this.#finde(ablaufId);
    const neu = friereEintrag({
      ...alt,
      status,
      letzteFortschrittMs: jetztMs,
    });
    this.#ersetze(alt, neu);
    return neu;
  }

  public meldeUnterbrechungsPunkt(
    ablaufId: string,
    punkt: UnterbrechungsPunkt,
    jetztMs: number,
  ): SchedulerEintrag {
    validiereZeit(jetztMs);
    const alt = this.#finde(ablaufId);
    if (punkt.erlaubt && (punkt.sichererPunktId === null || punkt.sichererPunktId.trim() === "")) {
      throw new Error("SICHERER_UNTERBRECHUNGSPUNKT_FEHLT");
    }
    if (punkt.erlaubt && punkt.irreversibleMutationOffen) {
      throw new Error("UNTERBRECHUNG_BEI_IRREVERSIBLER_MUTATION_VERBOTEN");
    }
    if (punkt.erlaubt && !punkt.checkpointDurable) {
      throw new Error("UNTERBRECHUNG_OHNE_DURABLEN_CHECKPOINT_VERBOTEN");
    }
    const neu = friereEintrag({
      ...alt,
      unterbrechung: punkt,
      letzteFortschrittMs: jetztMs,
    });
    this.#ersetze(alt, neu);
    return neu;
  }

  public waehleNaechsten(
    jetztMs: number,
    lokalitaetsRessourcen: readonly string[] = [],
  ): SchedulerEintrag | undefined {
    validiereZeit(jetztMs);
    const bereit = this.#eintraege.filter(eintrag =>
      eintrag.status === "BEREIT"
      && eintrag.plan.deadlineAmMs >= jetztMs);
    if (bereit.length === 0) return undefined;

    const sortiert = [...bereit].sort((a, b) =>
      this.#vergleiche(a, b, jetztMs, lokalitaetsRessourcen));
    const erster = sortiert[0];
    return erster === undefined ? undefined : friereEintrag(erster);
  }

  public bewerteUnterbrechung(
    laufendAblaufId: string,
    bewerberAblaufId: string,
    jetztMs: number,
  ): UnterbrechungsEntscheidung {
    validiereZeit(jetztMs);
    const laufend = this.#finde(laufendAblaufId);
    const bewerber = this.#finde(bewerberAblaufId);
    if (laufend.status !== "LAUFEND" && laufend.status !== "SICHER_UNTERBRECHBAR") {
      throw new Error("SCHEDULER_LAUFENDER_ABLAUF_STATUS_UNGUELTIG");
    }
    if (bewerber.status !== "BEREIT") {
      throw new Error("SCHEDULER_BEWERBER_NICHT_BEREIT");
    }

    if (istSafetyOderNotfall(laufend.plan.prioritaetsKlasse)
        && !istSafetyOderNotfall(bewerber.plan.prioritaetsKlasse)) {
      return "KEIN_VORRANG";
    }
    if (this.#vergleiche(bewerber, laufend, jetztMs, []) >= 0) {
      return "KEIN_VORRANG";
    }
    if (!laufend.unterbrechung.erlaubt
        || laufend.unterbrechung.sichererPunktId === null
        || laufend.unterbrechung.irreversibleMutationOffen
        || !laufend.unterbrechung.checkpointDurable) {
      return "WARTEN_BIS_SICHERER_PUNKT";
    }
    return "UNTERBRECHEN";
  }

  public sicht(): readonly SchedulerEintrag[] {
    return Object.freeze(
      this.#eintraege
        .map(eintrag => friereEintrag(eintrag))
        .sort((a, b) => a.plan.ablaufId.localeCompare(b.plan.ablaufId)),
    );
  }

  #vergleiche(
    links: SchedulerEintrag,
    rechts: SchedulerEintrag,
    jetztMs: number,
    lokalitaetsRessourcen: readonly string[],
  ): number {
    const klassen = prioritaetsKlassenRang(links.plan.prioritaetsKlasse)
      - prioritaetsKlassenRang(rechts.plan.prioritaetsKlasse);
    if (klassen !== 0) return klassen;

    const linksAlter = Math.max(0, jetztMs - links.plan.erstelltAmMs);
    const rechtsAlter = Math.max(0, jetztMs - rechts.plan.erstelltAmMs);
    const linksEffektiv = links.plan.prioritaetsRang
      - Math.floor(linksAlter / this.#agingIntervallMs);
    const rechtsEffektiv = rechts.plan.prioritaetsRang
      - Math.floor(rechtsAlter / this.#agingIntervallMs);
    if (linksEffektiv !== rechtsEffektiv) return linksEffektiv - rechtsEffektiv;

    if (links.plan.deadlineAmMs !== rechts.plan.deadlineAmMs) {
      return links.plan.deadlineAmMs - rechts.plan.deadlineAmMs;
    }

    const lokalitaetsTreffer = (eintrag: SchedulerEintrag): number =>
      eintrag.plan.ressourcenIds.filter(id => lokalitaetsRessourcen.includes(id)).length;
    const locality = lokalitaetsTreffer(rechts) - lokalitaetsTreffer(links);
    if (locality !== 0) return locality;

    if (links.plan.erstelltAmMs !== rechts.plan.erstelltAmMs) {
      return links.plan.erstelltAmMs - rechts.plan.erstelltAmMs;
    }
    return links.plan.ablaufId.localeCompare(rechts.plan.ablaufId);
  }

  #finde(ablaufId: string): SchedulerEintrag {
    const eintrag = this.#eintraege.find(x => x.plan.ablaufId === ablaufId);
    if (eintrag === undefined) throw new Error("SCHEDULER_ABLAUF_UNBEKANNT");
    return eintrag;
  }

  #ersetze(alt: SchedulerEintrag, neu: SchedulerEintrag): void {
    this.#eintraege = Object.freeze(this.#eintraege.map(x => x === alt ? neu : x));
  }
}
