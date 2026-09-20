import {
  pinneBankKatalog,
  type BankKatalogEintrag,
  type BankKatalogSnapshot,
} from "../produktion/bank-katalog.js";
import type {
  AblaufPrioritaetsKlasse,
  WissensSnapshotPin,
} from "../scheduler/workflow-vertrag.js";
import {
  pruefeWorkspaceKapazitaet,
} from "./workspace.js";
import type { MerchantDemand } from "./demand.js";

export type BankWaehrung = "GOLD" | "SHELLS";

export interface BankPackKapazitaet {
  readonly pack: string;
  readonly gesamtSlots: number;
  readonly belegteSlots: number;
}

export interface BankStapellimit {
  readonly name: string;
  readonly level: number;
  readonly variantenFingerprint: string;
  readonly maximaleMenge: number;
}

export interface BankErweiterungsOption {
  readonly optionId: string;
  readonly pack: string;
  readonly waehrung: BankWaehrung;
  readonly kosten: number;
  readonly neueSlots: number;
  readonly prioritaetsRang: number;
  readonly actionContractId: "AL-ACTION-OPEN-BANK-PACK";
  readonly recoveryContractId: "AL-RECOVERY-OPEN-BANK-PACK";
}

export interface BankWaehrungsBudgetNachweis {
  readonly waehrung: BankWaehrung;
  readonly verfuegbarNachReservierungen: number;
  readonly sicherheitsReserveNachgewiesen: boolean;
}

export interface BankAutonomieRichtlinie {
  readonly policyVersion: string;
  readonly minimaleFreieSlots: number;
  readonly zielFreieSlots: number;
  readonly konsolidierungsWorkspaceSlots: number;
  readonly maximaleKonsolidierungsGruppen: number;
  readonly erweiterungErlaubt: boolean;
}

export interface BankAutonomieAnfrage {
  readonly snapshot: BankKatalogSnapshot;
  readonly packs: readonly BankPackKapazitaet[];
  readonly stapellimits: readonly BankStapellimit[];
  readonly erweiterungsOptionen: readonly BankErweiterungsOption[];
  readonly budgets: readonly BankWaehrungsBudgetNachweis[];
  readonly freieInventarSlots: number;
  readonly richtlinie: BankAutonomieRichtlinie;
}

export interface BankKonsolidierungsQuelle {
  readonly pack: string;
  readonly slot: number;
  readonly menge: number;
}

export interface BankKonsolidierungsGruppe {
  readonly gruppenId: string;
  readonly name: string;
  readonly level: number;
  readonly variantenFingerprint: string;
  readonly maximaleMenge: number;
  readonly aktuelleStacks: number;
  readonly zielStacks: number;
  readonly freiwerdendeSlots: number;
  readonly quellen: readonly BankKonsolidierungsQuelle[];
}

export type BankAutonomieArt =
  | "KEINE_AKTION"
  | "KONSOLIDIEREN"
  | "ERWEITERN"
  | "GESPERRT";

export interface BankAutonomieEntscheidung {
  readonly schemaVersion: 1;
  readonly accountId: string;
  readonly art: BankAutonomieArt;
  readonly snapshotFingerprint: string;
  readonly mountEpoche: number;
  readonly leaseEpoche: number;
  readonly policyVersion: string;
  readonly freieSlotsVorher: number;
  readonly erwarteteFreieSlotsNachPlan: number;
  readonly konsolidierungsGruppen: readonly BankKonsolidierungsGruppe[];
  readonly erweiterung: BankErweiterungsOption | null;
  readonly gruende: readonly string[];
  readonly planningEvidence: true;
  readonly executionAuthority: false;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

export interface BankAutonomieDemandAnfrage {
  readonly demandId: string;
  readonly characterId: string;
  readonly erstelltAmMs: number;
  readonly deadlineAmMs: number;
  readonly prioritaetsKlasse: AblaufPrioritaetsKlasse;
  readonly prioritaetsRang: number;
  readonly ressourcenIds: readonly string[];
  readonly wissensSnapshot: WissensSnapshotPin;
}

interface BankArbeitsGruppe {
  readonly gruppenId: string;
  readonly name: string;
  readonly level: number;
  readonly variantenFingerprint: string;
  readonly eintraege: readonly BankKatalogEintrag[];
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function pruefeGanzzahl(
  wert: number,
  minimum: number,
  maximum: number,
  fehler: string,
): void {
  if (!Number.isSafeInteger(wert) || wert < minimum || wert > maximum) {
    throw new Error(fehler);
  }
}

function friereErweiterung(
  option: BankErweiterungsOption,
): BankErweiterungsOption {
  return Object.freeze({ ...option });
}

function friereKonsolidierungsGruppe(
  gruppe: BankKonsolidierungsGruppe,
): BankKonsolidierungsGruppe {
  return Object.freeze({
    ...gruppe,
    quellen: Object.freeze(
      gruppe.quellen.map(x => Object.freeze({ ...x })),
    ),
  });
}

function baueEntscheidung(
  anfrage: BankAutonomieAnfrage,
  art: BankAutonomieArt,
  freieSlotsVorher: number,
  erwarteteFreieSlotsNachPlan: number,
  konsolidierungsGruppen: readonly BankKonsolidierungsGruppe[],
  erweiterung: BankErweiterungsOption | null,
  gruende: readonly string[],
): BankAutonomieEntscheidung {
  return Object.freeze({
    schemaVersion: 1,
    accountId: anfrage.snapshot.accountId,
    art,
    snapshotFingerprint: anfrage.snapshot.fingerprint,
    mountEpoche: anfrage.snapshot.mountEpoche,
    leaseEpoche: anfrage.snapshot.leaseEpoche,
    policyVersion: anfrage.richtlinie.policyVersion,
    freieSlotsVorher,
    erwarteteFreieSlotsNachPlan,
    konsolidierungsGruppen: Object.freeze(
      konsolidierungsGruppen.map(friereKonsolidierungsGruppe),
    ),
    erweiterung: erweiterung === null
      ? null
      : friereErweiterung(erweiterung),
    gruende: Object.freeze([...gruende]),
    planningEvidence: true,
    executionAuthority: false,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
  });
}

function validiereRichtlinie(richtlinie: BankAutonomieRichtlinie): void {
  pruefeText(richtlinie.policyVersion, "BANK_AUTONOMIE_POLICY_UNGUELTIG");
  pruefeGanzzahl(
    richtlinie.minimaleFreieSlots,
    0,
    4096,
    "BANK_AUTONOMIE_MIN_FREIE_SLOTS_UNGUELTIG",
  );
  pruefeGanzzahl(
    richtlinie.zielFreieSlots,
    richtlinie.minimaleFreieSlots,
    4096,
    "BANK_AUTONOMIE_ZIEL_FREIE_SLOTS_UNGUELTIG",
  );
  pruefeGanzzahl(
    richtlinie.konsolidierungsWorkspaceSlots,
    0,
    256,
    "BANK_AUTONOMIE_WORKSPACE_UNGUELTIG",
  );
  pruefeGanzzahl(
    richtlinie.maximaleKonsolidierungsGruppen,
    1,
    64,
    "BANK_AUTONOMIE_GRUPPEN_GRENZE_UNGUELTIG",
  );
}

function validierePacks(
  packs: readonly BankPackKapazitaet[],
): void {
  if (packs.length < 1 || packs.length > 128) {
    throw new Error("BANK_AUTONOMIE_PACK_ANZAHL_UNGUELTIG");
  }
  for (let index = 0; index < packs.length; index += 1) {
    const pack = packs[index];
    if (pack === undefined) throw new Error("BANK_AUTONOMIE_PACK_FEHLT");
    pruefeText(pack.pack, "BANK_AUTONOMIE_PACK_NAME_UNGUELTIG");
    pruefeGanzzahl(
      pack.gesamtSlots,
      1,
      4096,
      "BANK_AUTONOMIE_PACK_SLOTS_UNGUELTIG",
    );
    pruefeGanzzahl(
      pack.belegteSlots,
      0,
      pack.gesamtSlots,
      "BANK_AUTONOMIE_PACK_BELEGUNG_UNGUELTIG",
    );
    if (packs.slice(0, index).some(x => x.pack === pack.pack)) {
      throw new Error("BANK_AUTONOMIE_PACK_DOPPELT");
    }
  }
}

function validiereStapellimits(
  stapellimits: readonly BankStapellimit[],
): void {
  if (stapellimits.length > 2048) {
    throw new Error("BANK_AUTONOMIE_STAPELLIMITS_ZU_GROSS");
  }
  for (let index = 0; index < stapellimits.length; index += 1) {
    const limit = stapellimits[index];
    if (limit === undefined) throw new Error("BANK_AUTONOMIE_STAPELLIMIT_FEHLT");
    for (const text of [
      limit.name,
      limit.variantenFingerprint,
    ]) {
      pruefeText(text, "BANK_AUTONOMIE_STAPELLIMIT_TEXT_UNGUELTIG");
    }
    pruefeGanzzahl(
      limit.level,
      0,
      99,
      "BANK_AUTONOMIE_STAPELLIMIT_LEVEL_UNGUELTIG",
    );
    pruefeGanzzahl(
      limit.maximaleMenge,
      1,
      1_000_000,
      "BANK_AUTONOMIE_STAPELLIMIT_MENGE_UNGUELTIG",
    );
    if (stapellimits.slice(0, index).some(x =>
      x.name === limit.name
      && x.level === limit.level
      && x.variantenFingerprint === limit.variantenFingerprint)) {
      throw new Error("BANK_AUTONOMIE_STAPELLIMIT_DOPPELT");
    }
  }
}

function validiereErweiterungen(
  optionen: readonly BankErweiterungsOption[],
): void {
  if (optionen.length > 128) {
    throw new Error("BANK_AUTONOMIE_ERWEITERUNGEN_ZU_GROSS");
  }
  for (let index = 0; index < optionen.length; index += 1) {
    const option = optionen[index];
    if (option === undefined) {
      throw new Error("BANK_AUTONOMIE_ERWEITERUNG_FEHLT");
    }
    for (const text of [option.optionId, option.pack]) {
      pruefeText(text, "BANK_AUTONOMIE_ERWEITERUNG_TEXT_UNGUELTIG");
    }
    pruefeGanzzahl(
      option.kosten,
      1,
      Number.MAX_SAFE_INTEGER,
      "BANK_AUTONOMIE_ERWEITERUNG_KOSTEN_UNGUELTIG",
    );
    pruefeGanzzahl(
      option.neueSlots,
      1,
      4096,
      "BANK_AUTONOMIE_ERWEITERUNG_SLOTS_UNGUELTIG",
    );
    pruefeGanzzahl(
      option.prioritaetsRang,
      0,
      1_000_000,
      "BANK_AUTONOMIE_ERWEITERUNG_PRIORITAET_UNGUELTIG",
    );
    if (option.actionContractId !== "AL-ACTION-OPEN-BANK-PACK"
        || option.recoveryContractId !== "AL-RECOVERY-OPEN-BANK-PACK") {
      throw new Error("BANK_AUTONOMIE_ERWEITERUNG_VERTRAG_UNGUELTIG");
    }
    if (optionen.slice(0, index).some(x => x.optionId === option.optionId)) {
      throw new Error("BANK_AUTONOMIE_ERWEITERUNG_DOPPELT");
    }
  }
}

function validiereBudgets(
  budgets: readonly BankWaehrungsBudgetNachweis[],
): void {
  if (budgets.length > 2) throw new Error("BANK_AUTONOMIE_BUDGET_ZU_GROSS");
  for (let index = 0; index < budgets.length; index += 1) {
    const budget = budgets[index];
    if (budget === undefined) throw new Error("BANK_AUTONOMIE_BUDGET_FEHLT");
    pruefeGanzzahl(
      budget.verfuegbarNachReservierungen,
      0,
      Number.MAX_SAFE_INTEGER,
      "BANK_AUTONOMIE_BUDGET_BETRAG_UNGUELTIG",
    );
    if (budgets.slice(0, index).some(x => x.waehrung === budget.waehrung)) {
      throw new Error("BANK_AUTONOMIE_BUDGET_DOPPELT");
    }
  }
}

function kapazitaetsWiderspruch(
  snapshot: BankKatalogSnapshot,
  packs: readonly BankPackKapazitaet[],
): boolean {
  for (const pack of packs) {
    const beobachtet = snapshot.eintraege.filter(
      x => x.pack === pack.pack,
    ).length;
    if (beobachtet !== pack.belegteSlots) return true;
  }
  return snapshot.eintraege.some(
    eintrag => !packs.some(pack => pack.pack === eintrag.pack),
  );
}

function freieBankSlots(
  packs: readonly BankPackKapazitaet[],
): number {
  return packs.reduce(
    (summe, pack) => summe + pack.gesamtSlots - pack.belegteSlots,
    0,
  );
}

function gruppiereEintraege(
  eintraege: readonly BankKatalogEintrag[],
): readonly BankArbeitsGruppe[] {
  let gruppen: readonly BankArbeitsGruppe[] = Object.freeze([]);
  for (const eintrag of eintraege) {
    const gruppenId = [
      eintrag.name,
      String(eintrag.level),
      eintrag.variantenFingerprint,
    ].join(":");
    const vorhanden = gruppen.find(x => x.gruppenId === gruppenId);
    if (vorhanden === undefined) {
      gruppen = Object.freeze([
        ...gruppen,
        Object.freeze({
          gruppenId,
          name: eintrag.name,
          level: eintrag.level,
          variantenFingerprint: eintrag.variantenFingerprint,
          eintraege: Object.freeze([eintrag]),
        }),
      ]);
      continue;
    }
    const ersetzt = Object.freeze({
      ...vorhanden,
      eintraege: Object.freeze([...vorhanden.eintraege, eintrag]),
    });
    gruppen = Object.freeze(
      gruppen.map(x => x.gruppenId === gruppenId ? ersetzt : x),
    );
  }
  return gruppen;
}

function findeStapellimit(
  gruppe: BankArbeitsGruppe,
  stapellimits: readonly BankStapellimit[],
): BankStapellimit | null {
  return stapellimits.find(x =>
    x.name === gruppe.name
    && x.level === gruppe.level
    && x.variantenFingerprint === gruppe.variantenFingerprint) ?? null;
}

function berechneKonsolidierungsGruppen(
  snapshot: BankKatalogSnapshot,
  stapellimits: readonly BankStapellimit[],
  maximum: number,
): Readonly<{
  gruppen: readonly BankKonsolidierungsGruppe[];
  stapellimitWiderspruch: boolean;
}> {
  const arbeitsGruppen = gruppiereEintraege(snapshot.eintraege);
  let kandidaten: readonly BankKonsolidierungsGruppe[] = Object.freeze([]);
  let stapellimitWiderspruch = false;

  for (const gruppe of arbeitsGruppen) {
    if (gruppe.eintraege.length < 2) continue;
    const limit = findeStapellimit(gruppe, stapellimits);
    if (limit === null) continue;
    if (gruppe.eintraege.some(x => x.menge > limit.maximaleMenge)) {
      stapellimitWiderspruch = true;
      continue;
    }
    const gesamtMenge = gruppe.eintraege.reduce(
      (summe, x) => summe + x.menge,
      0,
    );
    const zielStacks = Math.ceil(gesamtMenge / limit.maximaleMenge);
    if (zielStacks >= gruppe.eintraege.length) continue;
    kandidaten = Object.freeze([
      ...kandidaten,
      friereKonsolidierungsGruppe({
        gruppenId: gruppe.gruppenId,
        name: gruppe.name,
        level: gruppe.level,
        variantenFingerprint: gruppe.variantenFingerprint,
        maximaleMenge: limit.maximaleMenge,
        aktuelleStacks: gruppe.eintraege.length,
        zielStacks,
        freiwerdendeSlots: gruppe.eintraege.length - zielStacks,
        quellen: Object.freeze(
          gruppe.eintraege
            .map(x => Object.freeze({
              pack: x.pack,
              slot: x.slot,
              menge: x.menge,
            }))
            .sort((a, b) =>
              a.pack.localeCompare(b.pack)
              || a.slot - b.slot),
        ),
      }),
    ]);
  }

  const gruppen = Object.freeze(
    [...kandidaten]
      .sort((a, b) =>
        b.freiwerdendeSlots - a.freiwerdendeSlots
        || a.gruppenId.localeCompare(b.gruppenId))
      .slice(0, maximum),
  );
  return Object.freeze({ gruppen, stapellimitWiderspruch });
}

function waehleErweiterung(
  optionen: readonly BankErweiterungsOption[],
  budgets: readonly BankWaehrungsBudgetNachweis[],
  freieSlots: number,
  richtlinie: BankAutonomieRichtlinie,
): BankErweiterungsOption | null {
  if (!richtlinie.erweiterungErlaubt) return null;
  const finanzierbar = optionen.filter(option => {
    const budget = budgets.find(x => x.waehrung === option.waehrung);
    return budget !== undefined
      && budget.sicherheitsReserveNachgewiesen
      && option.kosten <= budget.verfuegbarNachReservierungen
      && freieSlots + option.neueSlots >= richtlinie.minimaleFreieSlots;
  });
  if (finanzierbar.length === 0) return null;
  const sortiert = [...finanzierbar].sort((a, b) => {
    const aZiel = freieSlots + a.neueSlots >= richtlinie.zielFreieSlots;
    const bZiel = freieSlots + b.neueSlots >= richtlinie.zielFreieSlots;
    if (aZiel !== bZiel) return aZiel ? -1 : 1;
    return a.prioritaetsRang - b.prioritaetsRang
      || a.optionId.localeCompare(b.optionId);
  });
  return sortiert[0] ?? null;
}

export function planeBankAutonomie(
  anfrage: BankAutonomieAnfrage,
  jetztMs: number,
): BankAutonomieEntscheidung {
  validiereRichtlinie(anfrage.richtlinie);
  validierePacks(anfrage.packs);
  validiereStapellimits(anfrage.stapellimits);
  validiereErweiterungen(anfrage.erweiterungsOptionen);
  validiereBudgets(anfrage.budgets);
  pruefeGanzzahl(
    anfrage.freieInventarSlots,
    0,
    256,
    "BANK_AUTONOMIE_INVENTAR_SLOTS_UNGUELTIG",
  );
  pinneBankKatalog(anfrage.snapshot, jetztMs);

  const freieSlots = freieBankSlots(anfrage.packs);
  if (kapazitaetsWiderspruch(anfrage.snapshot, anfrage.packs)) {
    return baueEntscheidung(
      anfrage,
      "GESPERRT",
      freieSlots,
      freieSlots,
      Object.freeze([]),
      null,
      Object.freeze(["BANK_KAPAZITAET_WIDERSPRUCH"]),
    );
  }

  if (freieSlots >= anfrage.richtlinie.minimaleFreieSlots) {
    return baueEntscheidung(
      anfrage,
      "KEINE_AKTION",
      freieSlots,
      freieSlots,
      Object.freeze([]),
      null,
      Object.freeze(["BANK_KAPAZITAET_AUSREICHEND"]),
    );
  }

  const konsolidierung = berechneKonsolidierungsGruppen(
    anfrage.snapshot,
    anfrage.stapellimits,
    anfrage.richtlinie.maximaleKonsolidierungsGruppen,
  );
  if (konsolidierung.stapellimitWiderspruch) {
    return baueEntscheidung(
      anfrage,
      "GESPERRT",
      freieSlots,
      freieSlots,
      Object.freeze([]),
      null,
      Object.freeze(["BANK_STAPELLIMIT_WIDERSPRUCH"]),
    );
  }

  const workspace = pruefeWorkspaceKapazitaet({
    freieInventarSlots: anfrage.freieInventarSlots,
    temporaereWorkspaceSlots:
      anfrage.richtlinie.konsolidierungsWorkspaceSlots,
    bestehendeStacks: Object.freeze([]),
    outputs: Object.freeze([]),
  });
  const freiDurchKonsolidierung = konsolidierung.gruppen.reduce(
    (summe, x) => summe + x.freiwerdendeSlots,
    0,
  );
  if (konsolidierung.gruppen.length > 0
      && freiDurchKonsolidierung > 0
      && workspace.erlaubt) {
    return baueEntscheidung(
      anfrage,
      "KONSOLIDIEREN",
      freieSlots,
      freieSlots + freiDurchKonsolidierung,
      konsolidierung.gruppen,
      null,
      Object.freeze(["BANK_KONSOLIDIERUNG_VOR_ERWEITERUNG"]),
    );
  }

  const erweiterung = waehleErweiterung(
    anfrage.erweiterungsOptionen,
    anfrage.budgets,
    freieSlots,
    anfrage.richtlinie,
  );
  if (erweiterung !== null) {
    return baueEntscheidung(
      anfrage,
      "ERWEITERN",
      freieSlots,
      freieSlots + erweiterung.neueSlots,
      Object.freeze([]),
      erweiterung,
      Object.freeze(["BANK_ERWEITERUNG_BUDGETIERT"]),
    );
  }

  let gruende: readonly string[] = Object.freeze([
    "BANK_KEINE_SICHERE_KAPAZITAETSAKTION",
  ]);
  if (konsolidierung.gruppen.length > 0 && !workspace.erlaubt) {
    gruende = Object.freeze([
      ...gruende,
      "BANK_KONSOLIDIERUNG_WORKSPACE_FEHLT",
    ]);
  }
  if (!anfrage.richtlinie.erweiterungErlaubt) {
    gruende = Object.freeze([
      ...gruende,
      "BANK_ERWEITERUNG_POLICY_GESPERRT",
    ]);
  }
  return baueEntscheidung(
    anfrage,
    "GESPERRT",
    freieSlots,
    freieSlots,
    Object.freeze([]),
    null,
    gruende,
  );
}

export function erzeugeBankAutonomieDemand(
  entscheidung: BankAutonomieEntscheidung,
  anfrage: BankAutonomieDemandAnfrage,
): MerchantDemand | null {
  for (const text of [
    anfrage.demandId,
    anfrage.characterId,
  ]) {
    pruefeText(text, "BANK_AUTONOMIE_DEMAND_TEXT_UNGUELTIG");
  }
  pruefeGanzzahl(
    anfrage.erstelltAmMs,
    0,
    Number.MAX_SAFE_INTEGER,
    "BANK_AUTONOMIE_DEMAND_ZEIT_UNGUELTIG",
  );
  pruefeGanzzahl(
    anfrage.deadlineAmMs,
    anfrage.erstelltAmMs,
    Number.MAX_SAFE_INTEGER,
    "BANK_AUTONOMIE_DEMAND_DEADLINE_UNGUELTIG",
  );
  pruefeGanzzahl(
    anfrage.prioritaetsRang,
    0,
    1_000_000,
    "BANK_AUTONOMIE_DEMAND_PRIORITAET_UNGUELTIG",
  );
  if (entscheidung.art === "KEINE_AKTION"
      || entscheidung.art === "GESPERRT") {
    return null;
  }

  return Object.freeze({
    schemaVersion: 1,
    demandId: anfrage.demandId,
    art: entscheidung.art === "KONSOLIDIEREN"
      ? "BANK_CONSOLIDATE"
      : "BANK_ERWEITERN",
    characterId: anfrage.characterId,
    accountId: entscheidung.accountId,
    erstelltAmMs: anfrage.erstelltAmMs,
    deadlineAmMs: anfrage.deadlineAmMs,
    prioritaetsKlasse: anfrage.prioritaetsKlasse,
    prioritaetsRang: anfrage.prioritaetsRang,
    ressourcenIds: Object.freeze([...anfrage.ressourcenIds]),
    payloadFingerprint: entscheidung.snapshotFingerprint,
    wissensSnapshot: Object.freeze({
      gitCommit: anfrage.wissensSnapshot.gitCommit,
      quellenSha256: Object.freeze([
        ...anfrage.wissensSnapshot.quellenSha256,
      ]),
    }),
  });
}
