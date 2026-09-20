import type { CharacterZielBindung } from "../koordination/roster-wahrheit.js";
import type { SpeicherPort } from "../persistenz/speicher-port.js";
import type { EmpfaengerSettlementEvidence } from "./recipient-settlement.js";
import {
  ProduktionsLedger,
  type ProduktionsSicht,
} from "./production-intent.js";
import type { ProduktionsPlan } from "./production-planer.js";

export interface ProduktionsControllerLadeErgebnis {
  readonly schemaVersion: 1;
  readonly geladen: boolean;
  readonly recoveryPending: number;
  readonly terminal: number;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

interface PersistierterProduktionsControllerSnapshot {
  readonly schemaVersion: 1;
  readonly gespeichertAmMs: number;
  readonly eintraege: readonly ProduktionsSicht[];
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 240) throw new Error(fehler);
}

function pruefeZeit(jetztMs: number): void {
  if (!Number.isSafeInteger(jetztMs) || jetztMs < 0) {
    throw new Error("PRODUKTION_CONTROLLER_ZEIT_UNGUELTIG");
  }
}

function istObjekt(wert: unknown): wert is Readonly<Record<string, unknown>> {
  return typeof wert === "object" && wert !== null && !Array.isArray(wert);
}

function parseSnapshot(
  text: string,
): PersistierterProduktionsControllerSnapshot {
  let roh: unknown;
  try {
    roh = JSON.parse(text);
  } catch {
    throw new Error("PRODUKTION_CONTROLLER_PERSISTENZ_UNGUELTIG");
  }
  if (!istObjekt(roh)
      || roh["schemaVersion"] !== 1
      || !Number.isSafeInteger(roh["gespeichertAmMs"])
      || !Array.isArray(roh["eintraege"])) {
    throw new Error("PRODUKTION_CONTROLLER_PERSISTENZ_UNGUELTIG");
  }
  const gespeichertAmMs = roh["gespeichertAmMs"];
  if (typeof gespeichertAmMs !== "number" || gespeichertAmMs < 0) {
    throw new Error("PRODUKTION_CONTROLLER_PERSISTENZ_UNGUELTIG");
  }
  if (roh["eintraege"].length > 1024) {
    throw new Error("PRODUKTION_CONTROLLER_PERSISTENZ_ZU_GROSS");
  }
  return {
    schemaVersion: 1,
    gespeichertAmMs,
    eintraege: roh["eintraege"] as readonly ProduktionsSicht[],
  };
}

export class PersistenterProduktionsController {
  public readonly gameplayAutoritaet = false as const;
  public readonly rawWriteAutoritaet = false as const;

  readonly #speicher: SpeicherPort;
  readonly #pfad: string;
  readonly #ledger: ProduktionsLedger;

  public constructor(
    speicher: SpeicherPort,
    pfad = "produktion/production-intents-v1.json",
    maximaleEintraege = 128,
  ) {
    pruefeText(pfad, "PRODUKTION_CONTROLLER_PFAD_UNGUELTIG");
    this.#speicher = speicher;
    this.#pfad = pfad;
    this.#ledger = new ProduktionsLedger(maximaleEintraege);
  }

  public async lade(
    jetztMs: number,
  ): Promise<ProduktionsControllerLadeErgebnis> {
    pruefeZeit(jetztMs);
    const text = await this.#speicher.lies(this.#pfad);
    if (text === undefined) {
      return Object.freeze({
        schemaVersion: 1,
        geladen: false,
        recoveryPending: 0,
        terminal: 0,
        gameplayAutoritaet: false,
        rawWriteAutoritaet: false,
      });
    }

    const snapshot = parseSnapshot(text);
    if (snapshot.gespeichertAmMs > jetztMs) {
      throw new Error("PRODUKTION_CONTROLLER_PERSISTENZ_AUS_ZUKUNFT");
    }
    this.#ledger.importiereNachRestart(snapshot.eintraege);
    await this.#persistiere(jetztMs);

    const sicht = this.#ledger.snapshot();
    return Object.freeze({
      schemaVersion: 1,
      geladen: true,
      recoveryPending: sicht.filter(
        x => x.zustand === "RECOVERY_PENDING",
      ).length,
      terminal: sicht.filter(
        x => x.zustand === "COMMITTED" || x.zustand === "FAILED_SAFE",
      ).length,
      gameplayAutoritaet: false,
      rawWriteAutoritaet: false,
    });
  }

  public async uebernehmePlan(
    plan: ProduktionsPlan,
    jetztMs: number,
  ): Promise<ProduktionsSicht> {
    pruefeZeit(jetztMs);
    if (plan.schemaVersion !== 1
        || plan.graphNachweis.erlaubt !== true
        || plan.graphNachweis.status !== "BEREIT"
        || plan.planungsNachweis !== true
        || plan.ausfuehrungsAutoritaet !== false
        || plan.gameplayAutoritaet !== false
        || plan.rawWriteAutoritaet !== false) {
      throw new Error("PRODUKTION_CONTROLLER_PLAN_NICHT_BEREIT");
    }
    const root = plan.graph.schritte.find(
      x => x.nodeId === plan.graph.rootNodeId,
    );
    if (root === undefined || root.art !== "DELIVERY") {
      throw new Error("PRODUKTION_CONTROLLER_ROOT_IST_KEINE_LIEFERUNG");
    }
    if (plan.graph.planId.trim().length === 0
        || plan.graph.planFingerprint.trim().length === 0) {
      throw new Error("PRODUKTION_CONTROLLER_PLAN_IDENTITAET_FEHLT");
    }

    const sicht = this.#ledger.plane({
      schemaVersion: 1,
      produktionsId: plan.produktionsId,
      ablaufId: plan.ablaufId,
      ownerCharacterId: plan.ownerCharacterId,
      recipientCharacterId: plan.graph.recipient.characterId,
      outputName: root.outputName,
      outputLevel: root.outputLevel,
      outputMenge: root.outputMenge,
      planFingerprint: plan.graph.planFingerprint,
    });
    await this.#persistiere(jetztMs);
    return sicht;
  }

  public async beginneHerstellung(
    produktionsId: string,
    jetztMs: number,
  ): Promise<ProduktionsSicht> {
    pruefeZeit(jetztMs);
    const sicht = this.#ledger.beginneHerstellung(produktionsId);
    await this.#persistiere(jetztMs);
    return sicht;
  }

  public async markiereOutputBereit(
    produktionsId: string,
    outputFingerprint: string,
    jetztMs: number,
  ): Promise<ProduktionsSicht> {
    pruefeZeit(jetztMs);
    const sicht = this.#ledger.markiereOutputBereit(
      produktionsId,
      outputFingerprint,
    );
    await this.#persistiere(jetztMs);
    return sicht;
  }

  public async beginneLieferung(
    produktionsId: string,
    settlementId: string,
    ziel: CharacterZielBindung,
    baselineMenge: number,
    baselineFingerprint: string,
    deliveryBegonnenAmMs: number,
    jetztMs: number,
  ): Promise<ProduktionsSicht> {
    pruefeZeit(jetztMs);
    if (deliveryBegonnenAmMs > jetztMs) {
      throw new Error("PRODUKTION_CONTROLLER_DELIVERY_AUS_ZUKUNFT");
    }
    const sicht = this.#ledger.beginneLieferung(
      produktionsId,
      settlementId,
      ziel,
      baselineMenge,
      baselineFingerprint,
      deliveryBegonnenAmMs,
    );
    await this.#persistiere(jetztMs);
    return sicht;
  }

  public async verifiziereRecipientSettlement(
    produktionsId: string,
    evidence: EmpfaengerSettlementEvidence,
    jetztMs: number,
  ): Promise<ProduktionsSicht> {
    pruefeZeit(jetztMs);
    if (evidence.beobachtetAmMs > jetztMs) {
      throw new Error("PRODUKTION_CONTROLLER_EVIDENCE_AUS_ZUKUNFT");
    }
    const sicht = this.#ledger.verifiziereRecipientSettlement(
      produktionsId,
      evidence,
    );
    await this.#persistiere(jetztMs);
    return sicht;
  }

  public async committe(
    produktionsId: string,
    jetztMs: number,
  ): Promise<ProduktionsSicht> {
    pruefeZeit(jetztMs);
    const sicht = this.#ledger.committe(produktionsId);
    await this.#persistiere(jetztMs);
    return sicht;
  }

  public async scheitereSicher(
    produktionsId: string,
    jetztMs: number,
  ): Promise<ProduktionsSicht> {
    pruefeZeit(jetztMs);
    const sicht = this.#ledger.scheitereSicher(produktionsId);
    await this.#persistiere(jetztMs);
    return sicht;
  }

  public finde(produktionsId: string): ProduktionsSicht {
    return this.#ledger.finde(produktionsId);
  }

  public snapshot(): readonly ProduktionsSicht[] {
    return this.#ledger.snapshot();
  }

  async #persistiere(jetztMs: number): Promise<void> {
    const snapshot: PersistierterProduktionsControllerSnapshot =
      Object.freeze({
        schemaVersion: 1,
        gespeichertAmMs: jetztMs,
        eintraege: this.#ledger.snapshot(),
      });
    const inhalt = JSON.stringify(snapshot);
    if (inhalt.length > 1_000_000) {
      throw new Error("PRODUKTION_CONTROLLER_PERSISTENZ_ZU_GROSS");
    }
    await this.#speicher.schreibe({
      relativerPfad: this.#pfad,
      inhalt,
      kritisch: true,
    });
  }
}
