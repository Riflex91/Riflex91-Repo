export type RetentionKlasse =
  | "EVIDENZ"
  | "REPLAY"
  | "TELEMETRIE"
  | "CACHE";

export interface RetentionEintrag {
  readonly id: string;
  readonly klasse: RetentionKlasse;
  readonly bytes: number;
  readonly erstelltAmMs: number;
}

export interface RetentionBudget {
  readonly klasse: RetentionKlasse;
  readonly maximaleBytes: number;
  readonly maximaleAnzahl: number;
  readonly maximalesAlterMs: number;
}

export interface RetentionPlan {
  readonly loeschenIds: readonly string[];
  readonly behaltenIds: readonly string[];
}

function validiereBudget(budget: RetentionBudget): void {
  if (!Number.isSafeInteger(budget.maximaleBytes) || budget.maximaleBytes < 0
      || !Number.isSafeInteger(budget.maximaleAnzahl) || budget.maximaleAnzahl < 0
      || !Number.isSafeInteger(budget.maximalesAlterMs) || budget.maximalesAlterMs < 0) {
    throw new Error("RETENTION_BUDGET_UNGUELTIG");
  }
}

export function planeRetention(
  eintraege: readonly RetentionEintrag[],
  budgets: readonly RetentionBudget[],
  jetztMs: number,
): RetentionPlan {
  if (!Number.isFinite(jetztMs)) throw new Error("RETENTION_ZEIT_UNGUELTIG");
  if (eintraege.length > 1_000_000) throw new Error("RETENTION_ZU_VIELE_EINTRAEGE");
  if (budgets.length > 16) throw new Error("RETENTION_ZU_VIELE_BUDGETS");

  for (const budget of budgets) validiereBudget(budget);

  const klassen: readonly RetentionKlasse[] =
    Object.freeze(["CACHE","TELEMETRIE","REPLAY","EVIDENZ"]);
  let loeschen: readonly string[] = Object.freeze([]);
  let behalten: readonly string[] = Object.freeze([]);

  for (const klasse of klassen) {
    const budget = budgets.find(b => b.klasse === klasse);
    const kandidaten = eintraege
      .filter(e => e.klasse === klasse)
      .sort((a, b) => a.erstelltAmMs - b.erstelltAmMs || a.id.localeCompare(b.id));

    if (budget === undefined) {
      behalten = Object.freeze([...behalten, ...kandidaten.map(e => e.id)]);
      continue;
    }

    let aktiv = kandidaten.filter(
      e => jetztMs - e.erstelltAmMs <= budget.maximalesAlterMs,
    );
    const zuAlt = kandidaten.filter(
      e => jetztMs - e.erstelltAmMs > budget.maximalesAlterMs,
    );
    loeschen = Object.freeze([...loeschen, ...zuAlt.map(e => e.id)]);

    while (aktiv.length > budget.maximaleAnzahl
        || aktiv.reduce((summe, e) => summe + e.bytes, 0) > budget.maximaleBytes) {
      const erstes = aktiv[0];
      if (erstes === undefined) break;
      loeschen = Object.freeze([...loeschen, erstes.id]);
      aktiv = aktiv.slice(1);
    }

    behalten = Object.freeze([...behalten, ...aktiv.map(e => e.id)]);
  }

  return Object.freeze({
    loeschenIds: Object.freeze([...loeschen]),
    behaltenIds: Object.freeze([...behalten]),
  });
}
