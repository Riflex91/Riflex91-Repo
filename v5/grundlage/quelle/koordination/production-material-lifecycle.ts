import type { SpeicherPort } from "../persistenz/speicher-port.js";
import type {
  ProduktionsMaterialFortschritt,
  ProduktionsMaterialZiel,
} from "./production-material-acquisition.js";
import type { ProduktionsMaterialHandoffPlan } from "./production-material-handoff.js";
import type { ProduktionsMaterialCraftRescanErgebnis } from "./production-material-craft-rescan.js";

export type ProduktionsMaterialLifecycleZustand =
  | "FARM_REQUIRED"
  | "MATERIAL_READY_FOR_HANDOFF"
  | "COLLECTION_PLAN_BEREIT"
  | "CRAFT_RESCAN_BEREIT"
  | "CRAFT_RESCAN_BLOCKIERT"
  | "RECOVERY_PENDING"
  | "FAILED_SAFE";

export type ProduktionsMaterialRecoveryVorZustand =
  | "FARM_REQUIRED"
  | "MATERIAL_READY_FOR_HANDOFF"
  | "COLLECTION_PLAN_BEREIT";

export interface ProduktionsMaterialLifecycleEintrag {
  readonly schemaVersion: 1;
  readonly objectiveId: string;
  readonly produktionsId: string;
  readonly ablaufId: string;
  readonly farmNodeId: string;
  readonly handoffLogistikId: string | null;
  readonly zustand: ProduktionsMaterialLifecycleZustand;
  readonly recoveryVorZustand: ProduktionsMaterialRecoveryVorZustand | null;
  readonly letzteEvidenceFingerprint: string;
  readonly aktualisiertAmMs: number;
  readonly sameFarmObjectiveErneutSenden: false;
  readonly sameHandoffErneutSenden: false;
  readonly sameCraftRescanErneutSenden: false;
  readonly executionAuthority: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly normalRuntimeAllowed: false;
}

export interface ProduktionsMaterialLifecycleLadeStatus {
  readonly schemaVersion: 1;
  readonly geladen: boolean;
  readonly recoveryPending: number;
  readonly terminal: number;
  readonly executionAuthority: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly normalRuntimeAllowed: false;
}

interface PersistierterSnapshot {
  readonly schemaVersion: 1;
  readonly gespeichertAmMs: number;
  readonly eintraege: readonly ProduktionsMaterialLifecycleEintrag[];
}

const ALLE_ZUSTAENDE: readonly ProduktionsMaterialLifecycleZustand[] =
  Object.freeze([
    "FARM_REQUIRED",
    "MATERIAL_READY_FOR_HANDOFF",
    "COLLECTION_PLAN_BEREIT",
    "CRAFT_RESCAN_BEREIT",
    "CRAFT_RESCAN_BLOCKIERT",
    "RECOVERY_PENDING",
    "FAILED_SAFE",
  ]);

const RECOVERY_FAehIG: readonly ProduktionsMaterialRecoveryVorZustand[] =
  Object.freeze([
    "FARM_REQUIRED",
    "MATERIAL_READY_FOR_HANDOFF",
    "COLLECTION_PLAN_BEREIT",
  ]);

function text(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 240) throw new Error(fehler);
}

function zeit(wert: number, fehler: string): void {
  if (!Number.isSafeInteger(wert) || wert < 0) throw new Error(fehler);
}

function terminal(zustand: ProduktionsMaterialLifecycleZustand): boolean {
  return zustand === "CRAFT_RESCAN_BEREIT"
    || zustand === "CRAFT_RESCAN_BLOCKIERT"
    || zustand === "FAILED_SAFE";
}

function friere(
  eintrag: ProduktionsMaterialLifecycleEintrag,
): ProduktionsMaterialLifecycleEintrag {
  return Object.freeze({ ...eintrag });
}

function parse(textWert: string): PersistierterSnapshot {
  let roh: unknown;
  try {
    roh = JSON.parse(textWert);
  } catch {
    throw new Error("CAP022_LIFECYCLE_PERSISTENZ_UNGUELTIG");
  }
  if (typeof roh !== "object" || roh === null || Array.isArray(roh)) {
    throw new Error("CAP022_LIFECYCLE_PERSISTENZ_UNGUELTIG");
  }
  const obj = roh as Record<string, unknown>;
  if (obj["schemaVersion"] !== 1
      || typeof obj["gespeichertAmMs"] !== "number"
      || !Number.isSafeInteger(obj["gespeichertAmMs"])
      || obj["gespeichertAmMs"] < 0
      || !Array.isArray(obj["eintraege"])
      || obj["eintraege"].length > 512) {
    throw new Error("CAP022_LIFECYCLE_PERSISTENZ_UNGUELTIG");
  }

  const rows = obj["eintraege"].map((row, index) => {
    if (typeof row !== "object" || row === null || Array.isArray(row)) {
      throw new Error("CAP022_LIFECYCLE_EINTRAG_UNGUELTIG");
    }
    const x = row as Record<string, unknown>;
    const zustand = x["zustand"];
    const recovery = x["recoveryVorZustand"];
    if (x["schemaVersion"] !== 1
        || typeof x["objectiveId"] !== "string"
        || typeof x["produktionsId"] !== "string"
        || typeof x["ablaufId"] !== "string"
        || typeof x["farmNodeId"] !== "string"
        || (x["handoffLogistikId"] !== null
          && typeof x["handoffLogistikId"] !== "string")
        || typeof zustand !== "string"
        || !ALLE_ZUSTAENDE.includes(zustand as ProduktionsMaterialLifecycleZustand)
        || (recovery !== null
          && (typeof recovery !== "string"
            || !RECOVERY_FAehIG.includes(
              recovery as ProduktionsMaterialRecoveryVorZustand,
            )))
        || typeof x["letzteEvidenceFingerprint"] !== "string"
        || typeof x["aktualisiertAmMs"] !== "number"
        || !Number.isSafeInteger(x["aktualisiertAmMs"])
        || x["aktualisiertAmMs"] < 0
        || x["sameFarmObjectiveErneutSenden"] !== false
        || x["sameHandoffErneutSenden"] !== false
        || x["sameCraftRescanErneutSenden"] !== false
        || x["executionAuthority"] !== false
        || x["gameplayAuthority"] !== false
        || x["rawWriteAuthority"] !== false
        || x["normalRuntimeAllowed"] !== false) {
      throw new Error("CAP022_LIFECYCLE_EINTRAG_UNGUELTIG");
    }
    if (zustand === "RECOVERY_PENDING" && recovery === null) {
      throw new Error("CAP022_LIFECYCLE_RECOVERY_URSPRUNG_FEHLT");
    }
    const objectiveId = x["objectiveId"] as string;
    if ((obj["eintraege"] as unknown[]).slice(0, index).some(v =>
      typeof v === "object"
      && v !== null
      && !Array.isArray(v)
      && (v as Record<string, unknown>)["objectiveId"] === objectiveId)) {
      throw new Error("CAP022_LIFECYCLE_OBJECTIVE_DOPPELT");
    }
    for (const wert of [
      objectiveId,
      x["produktionsId"] as string,
      x["ablaufId"] as string,
      x["farmNodeId"] as string,
      x["letzteEvidenceFingerprint"] as string,
    ]) text(wert, "CAP022_LIFECYCLE_TEXT_UNGUELTIG");
    if (typeof x["handoffLogistikId"] === "string") {
      text(
        x["handoffLogistikId"],
        "CAP022_LIFECYCLE_HANDOFF_ID_UNGUELTIG",
      );
    }
    return friere(x as unknown as ProduktionsMaterialLifecycleEintrag);
  });

  return Object.freeze({
    schemaVersion: 1,
    gespeichertAmMs: obj["gespeichertAmMs"] as number,
    eintraege: Object.freeze(rows),
  });
}

export class PersistenterProduktionsMaterialLifecycle {
  public readonly executionAuthority = false as const;
  public readonly gameplayAuthority = false as const;
  public readonly rawWriteAuthority = false as const;
  public readonly normalRuntimeAllowed = false as const;

  readonly #speicher: SpeicherPort;
  readonly #pfad: string;
  readonly #maximal: number;
  #eintraege: readonly ProduktionsMaterialLifecycleEintrag[] = Object.freeze([]);

  public constructor(
    speicher: SpeicherPort,
    pfad = "koordination/production-material-lifecycle-v1.json",
    maximal = 256,
  ) {
    text(pfad, "CAP022_LIFECYCLE_PFAD_UNGUELTIG");
    if (!Number.isSafeInteger(maximal) || maximal < 1 || maximal > 2048) {
      throw new Error("CAP022_LIFECYCLE_GRENZE_UNGUELTIG");
    }
    this.#speicher = speicher;
    this.#pfad = pfad;
    this.#maximal = maximal;
  }

  public async lade(
    jetztMs: number,
  ): Promise<ProduktionsMaterialLifecycleLadeStatus> {
    zeit(jetztMs, "CAP022_LIFECYCLE_ZEIT_UNGUELTIG");
    const gespeichert = await this.#speicher.lies(this.#pfad);
    if (gespeichert === undefined) {
      return Object.freeze({
        schemaVersion: 1,
        geladen: false,
        recoveryPending: 0,
        terminal: 0,
        executionAuthority: false,
        gameplayAuthority: false,
        rawWriteAuthority: false,
        normalRuntimeAllowed: false,
      });
    }

    const snapshot = parse(gespeichert);
    if (snapshot.gespeichertAmMs > jetztMs) {
      throw new Error("CAP022_LIFECYCLE_PERSISTENZ_AUS_ZUKUNFT");
    }

    this.#eintraege = Object.freeze(snapshot.eintraege.map(row => {
      if (terminal(row.zustand)) return friere(row);
      const recoveryKandidat = row.zustand === "RECOVERY_PENDING"
        ? row.recoveryVorZustand
        : row.zustand;
      if (recoveryKandidat === null
          || !RECOVERY_FAehIG.includes(
            recoveryKandidat as ProduktionsMaterialRecoveryVorZustand,
          )) {
        throw new Error("CAP022_LIFECYCLE_RECOVERY_URSPRUNG_UNGUELTIG");
      }
      const recoveryVorZustand =
        recoveryKandidat as ProduktionsMaterialRecoveryVorZustand;
      return friere({
        ...row,
        zustand: "RECOVERY_PENDING",
        recoveryVorZustand,
        aktualisiertAmMs: jetztMs,
        sameFarmObjectiveErneutSenden: false,
        sameHandoffErneutSenden: false,
        sameCraftRescanErneutSenden: false,
        executionAuthority: false,
        gameplayAuthority: false,
        rawWriteAuthority: false,
        normalRuntimeAllowed: false,
      });
    }));
    await this.#persistiere(jetztMs);

    return Object.freeze({
      schemaVersion: 1,
      geladen: true,
      recoveryPending: this.#eintraege.filter(
        x => x.zustand === "RECOVERY_PENDING",
      ).length,
      terminal: this.#eintraege.filter(x => terminal(x.zustand)).length,
      executionAuthority: false,
      gameplayAuthority: false,
      rawWriteAuthority: false,
      normalRuntimeAllowed: false,
    });
  }

  public async beginne(
    ziel: ProduktionsMaterialZiel,
    jetztMs: number,
  ): Promise<ProduktionsMaterialLifecycleEintrag> {
    zeit(jetztMs, "CAP022_LIFECYCLE_ZEIT_UNGUELTIG");
    if (ziel.schemaVersion !== 1
        || ziel.planningOnly !== true
        || ziel.ausfuehrungsAutoritaet !== false
        || ziel.gameplayAutoritaet !== false
        || ziel.rawWriteAutoritaet !== false
        || ziel.pr20_9CraftRatificationCredit !== false) {
      throw new Error("CAP022_LIFECYCLE_ZIEL_UNGUELTIG");
    }
    for (const wert of [
      ziel.objectiveId,
      ziel.produktionsId,
      ziel.ablaufId,
      ziel.farmNodeId,
      ziel.spawnFingerprint,
    ]) text(wert, "CAP022_LIFECYCLE_ZIEL_TEXT_UNGUELTIG");
    if (this.#eintraege.some(x => x.objectiveId === ziel.objectiveId)) {
      throw new Error("CAP022_LIFECYCLE_OBJECTIVE_EXISTIERT");
    }
    if (this.#eintraege.length >= this.#maximal) {
      throw new Error("CAP022_LIFECYCLE_VOLL");
    }

    const eintrag = friere({
      schemaVersion: 1,
      objectiveId: ziel.objectiveId,
      produktionsId: ziel.produktionsId,
      ablaufId: ziel.ablaufId,
      farmNodeId: ziel.farmNodeId,
      handoffLogistikId: null,
      zustand: "FARM_REQUIRED",
      recoveryVorZustand: null,
      letzteEvidenceFingerprint: ziel.spawnFingerprint,
      aktualisiertAmMs: jetztMs,
      sameFarmObjectiveErneutSenden: false,
      sameHandoffErneutSenden: false,
      sameCraftRescanErneutSenden: false,
      executionAuthority: false,
      gameplayAuthority: false,
      rawWriteAuthority: false,
      normalRuntimeAllowed: false,
    });
    this.#eintraege = Object.freeze([...this.#eintraege, eintrag]);
    await this.#persistiere(jetztMs);
    return friere(eintrag);
  }

  public async markiereMaterialBereit(
    objectiveId: string,
    fortschritt: ProduktionsMaterialFortschritt,
    jetztMs: number,
  ): Promise<ProduktionsMaterialLifecycleEintrag> {
    zeit(jetztMs, "CAP022_LIFECYCLE_ZEIT_UNGUELTIG");
    const alt = this.#finde(objectiveId);
    if (alt.zustand !== "FARM_REQUIRED") {
      throw new Error("CAP022_LIFECYCLE_MATERIAL_ZUSTAND_UNGUELTIG");
    }
    if (fortschritt.schemaVersion !== 1
        || fortschritt.objectiveId !== objectiveId
        || fortschritt.status !== "MATERIAL_READY_FOR_HANDOFF"
        || fortschritt.restMenge !== 0
        || fortschritt.farmStopErforderlich !== true
        || fortschritt.handoffErforderlich !== true
        || fortschritt.pr20_9CraftRatificationCredit !== false
        || fortschritt.ausfuehrungsAutoritaet !== false
        || fortschritt.gameplayAutoritaet !== false
        || fortschritt.rawWriteAutoritaet !== false) {
      throw new Error("CAP022_LIFECYCLE_MATERIAL_EVIDENCE_UNGUELTIG");
    }
    text(
      fortschritt.inventoryFingerprint,
      "CAP022_LIFECYCLE_MATERIAL_FP_UNGUELTIG",
    );
    return this.#ersetze({
      ...alt,
      zustand: "MATERIAL_READY_FOR_HANDOFF",
      recoveryVorZustand: null,
      letzteEvidenceFingerprint: fortschritt.inventoryFingerprint,
      aktualisiertAmMs: jetztMs,
    }, jetztMs);
  }

  public async markiereHandoffGeplant(
    objectiveId: string,
    handoff: ProduktionsMaterialHandoffPlan,
    jetztMs: number,
  ): Promise<ProduktionsMaterialLifecycleEintrag> {
    zeit(jetztMs, "CAP022_LIFECYCLE_ZEIT_UNGUELTIG");
    const alt = this.#finde(objectiveId);
    if (alt.zustand !== "MATERIAL_READY_FOR_HANDOFF") {
      throw new Error("CAP022_LIFECYCLE_HANDOFF_ZUSTAND_UNGUELTIG");
    }
    if (handoff.schemaVersion !== 1
        || handoff.objectiveId !== objectiveId
        || handoff.status !== "COLLECTION_PLAN_BEREIT_NO_WRITE"
        || handoff.planningOnly !== true
        || handoff.ausfuehrungsAutoritaet !== false
        || handoff.gameplayAutoritaet !== false
        || handoff.rawWriteAutoritaet !== false
        || handoff.normalRuntimeAllowed !== false
        || handoff.foundationCountsAsCraftRatification !== false) {
      throw new Error("CAP022_LIFECYCLE_HANDOFF_UNGUELTIG");
    }
    text(
      handoff.logistik.plan.logistikId,
      "CAP022_LIFECYCLE_HANDOFF_ID_UNGUELTIG",
    );
    return this.#ersetze({
      ...alt,
      handoffLogistikId: handoff.logistik.plan.logistikId,
      zustand: "COLLECTION_PLAN_BEREIT",
      recoveryVorZustand: null,
      letzteEvidenceFingerprint: handoff.logistik.quellenPin.inventoryFingerprint,
      aktualisiertAmMs: jetztMs,
    }, jetztMs);
  }

  public async markiereCraftRescan(
    objectiveId: string,
    rescan: ProduktionsMaterialCraftRescanErgebnis,
    jetztMs: number,
  ): Promise<ProduktionsMaterialLifecycleEintrag> {
    zeit(jetztMs, "CAP022_LIFECYCLE_ZEIT_UNGUELTIG");
    const alt = this.#finde(objectiveId);
    if (alt.zustand !== "COLLECTION_PLAN_BEREIT"
        || alt.handoffLogistikId === null) {
      throw new Error("CAP022_LIFECYCLE_RESCAN_ZUSTAND_UNGUELTIG");
    }
    if (rescan.schemaVersion !== 1
        || ![
          "CRAFT_RESCAN_KANDIDAT_BEREIT_NO_WRITE",
          "CRAFT_RESCAN_BLOCKIERT",
        ].includes(rescan.status)
        || rescan.objectiveId !== objectiveId
        || rescan.logistikId !== alt.handoffLogistikId
        || rescan.settledHandoffVerified !== true
        || rescan.postSettlementInventoryVerified !== true
        || rescan.handedMaterialMatchesRecipeInput !== true
        || rescan.rescanTriggerEligible !== true
        || rescan.currentPr20_9RatificationCredit !== false
        || rescan.foundationCountsAsCraftRatification !== false
        || rescan.productiveCraftAuthorityOpened !== false
        || rescan.broadGraphExecutionAuthority !== false
        || rescan.gameplayWrites !== 0
        || rescan.publicFunctionCalls !== 0
        || rescan.rawWriteCalls !== 0
        || rescan.craftAuthority !== false
        || rescan.gameplayAuthority !== false
        || rescan.rawWriteAuthority !== false
        || rescan.normalRuntimeAllowed !== false) {
      throw new Error("CAP022_LIFECYCLE_RESCAN_UNGUELTIG");
    }
    text(
      rescan.settlementFingerprint,
      "CAP022_LIFECYCLE_RESCAN_FP_UNGUELTIG",
    );
    return this.#ersetze({
      ...alt,
      zustand: rescan.status === "CRAFT_RESCAN_KANDIDAT_BEREIT_NO_WRITE"
        ? "CRAFT_RESCAN_BEREIT"
        : "CRAFT_RESCAN_BLOCKIERT",
      recoveryVorZustand: null,
      letzteEvidenceFingerprint: rescan.settlementFingerprint,
      aktualisiertAmMs: jetztMs,
    }, jetztMs);
  }

  public async reconciliereNachRestart(
    objectiveId: string,
    bestaetigterZustand: ProduktionsMaterialRecoveryVorZustand,
    evidenceFingerprint: string,
    jetztMs: number,
  ): Promise<ProduktionsMaterialLifecycleEintrag> {
    zeit(jetztMs, "CAP022_LIFECYCLE_ZEIT_UNGUELTIG");
    text(
      evidenceFingerprint,
      "CAP022_LIFECYCLE_RECOVERY_FP_UNGUELTIG",
    );
    const alt = this.#finde(objectiveId);
    if (alt.zustand !== "RECOVERY_PENDING"
        || alt.recoveryVorZustand !== bestaetigterZustand) {
      throw new Error("CAP022_LIFECYCLE_RECOVERY_DRIFT");
    }
    return this.#ersetze({
      ...alt,
      zustand: bestaetigterZustand,
      recoveryVorZustand: null,
      letzteEvidenceFingerprint: evidenceFingerprint,
      aktualisiertAmMs: jetztMs,
      sameFarmObjectiveErneutSenden: false,
      sameHandoffErneutSenden: false,
      sameCraftRescanErneutSenden: false,
    }, jetztMs);
  }

  public async scheitereSicher(
    objectiveId: string,
    evidenceFingerprint: string,
    jetztMs: number,
  ): Promise<ProduktionsMaterialLifecycleEintrag> {
    zeit(jetztMs, "CAP022_LIFECYCLE_ZEIT_UNGUELTIG");
    text(
      evidenceFingerprint,
      "CAP022_LIFECYCLE_FAILED_SAFE_FP_UNGUELTIG",
    );
    const alt = this.#finde(objectiveId);
    if (terminal(alt.zustand)) {
      throw new Error("CAP022_LIFECYCLE_TERMINAL");
    }
    return this.#ersetze({
      ...alt,
      zustand: "FAILED_SAFE",
      recoveryVorZustand: null,
      letzteEvidenceFingerprint: evidenceFingerprint,
      aktualisiertAmMs: jetztMs,
    }, jetztMs);
  }

  public finde(objectiveId: string): ProduktionsMaterialLifecycleEintrag {
    return friere(this.#finde(objectiveId));
  }

  public snapshot(): readonly ProduktionsMaterialLifecycleEintrag[] {
    return Object.freeze(this.#eintraege.map(x => friere(x)));
  }

  #finde(objectiveId: string): ProduktionsMaterialLifecycleEintrag {
    text(objectiveId, "CAP022_LIFECYCLE_OBJECTIVE_ID_UNGUELTIG");
    const row = this.#eintraege.find(x => x.objectiveId === objectiveId);
    if (row === undefined) throw new Error("CAP022_LIFECYCLE_OBJECTIVE_UNBEKANNT");
    return row;
  }

  async #ersetze(
    neu: ProduktionsMaterialLifecycleEintrag,
    jetztMs: number,
  ): Promise<ProduktionsMaterialLifecycleEintrag> {
    this.#eintraege = Object.freeze(
      this.#eintraege.map(x => x.objectiveId === neu.objectiveId
        ? friere(neu)
        : x),
    );
    await this.#persistiere(jetztMs);
    return friere(neu);
  }

  async #persistiere(jetztMs: number): Promise<void> {
    const snapshot: PersistierterSnapshot = Object.freeze({
      schemaVersion: 1,
      gespeichertAmMs: jetztMs,
      eintraege: Object.freeze(this.#eintraege.map(x => friere(x))),
    });
    const inhalt = JSON.stringify(snapshot);
    if (inhalt.length > 1_000_000) {
      throw new Error("CAP022_LIFECYCLE_PERSISTENZ_ZU_GROSS");
    }
    await this.#speicher.schreibe({
      relativerPfad: this.#pfad,
      inhalt,
      kritisch: true,
    });
  }
}
