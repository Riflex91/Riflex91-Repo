import type { SpeicherPort } from "../persistenz/speicher-port.js";
import {
  MerchantLogistikLedger,
  type MerchantLogistikSicht,
  type RendezvousEvidence,
  type TransferSettlementEvidence,
} from "./logistik-workflow.js";
import {
  pruefeLogistikQuellenPin,
  type LogistikQuellenEvidence,
  type LogistikQuellenPin,
  type MerchantLogistikPlanungsErgebnis,
} from "./logistik-planer.js";

export interface LogistikTransferVorbereitung {
  readonly schemaVersion: 1;
  readonly sicht: MerchantLogistikSicht;
  readonly actionContractId: "AL-ACTION-SEND-ITEM";
  readonly recoveryContractId: "AL-RECOVERY-SEND-ITEM";
  readonly verifierId: "AL-VERIFIER-SEND-ITEM";
  readonly durableIntentPersistiert: true;
  readonly sameTransferErneutSenden: false;
  readonly ausfuehrungsAutoritaet: false;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

export interface PersistenterLogistikLadeStatus {
  readonly schemaVersion: 1;
  readonly geladen: boolean;
  readonly recoveryPending: number;
  readonly settled: number;
  readonly failedSafe: number;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

interface PersistierterLogistikEintrag {
  readonly sicht: MerchantLogistikSicht;
  readonly quellenPin: LogistikQuellenPin;
}

interface PersistierterLogistikControllerSnapshot {
  readonly schemaVersion: 1;
  readonly gespeichertAmMs: number;
  readonly eintraege: readonly PersistierterLogistikEintrag[];
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 240) throw new Error(fehler);
}

function pruefeZeit(jetztMs: number): void {
  if (!Number.isSafeInteger(jetztMs) || jetztMs < 0) {
    throw new Error("LOGISTIK_CONTROLLER_ZEIT_UNGUELTIG");
  }
}

function istObjekt(wert: unknown): wert is Readonly<Record<string, unknown>> {
  return typeof wert === "object" && wert !== null && !Array.isArray(wert);
}

function validierePinStruktur(pin: unknown): LogistikQuellenPin {
  if (!istObjekt(pin)
      || pin["schemaVersion"] !== 1
      || pin["planningEvidence"] !== true
      || pin["executionAuthority"] !== false
      || !istObjekt(pin["quelle"])
      || !Array.isArray(pin["posten"])) {
    throw new Error("LOGISTIK_CONTROLLER_PIN_UNGUELTIG");
  }
  const freshnessFingerprint = pin["freshnessFingerprint"];
  const inventoryFingerprint = pin["inventoryFingerprint"];
  const gueltigBisMs = pin["gueltigBisMs"];
  const maximalesEvidenceAlterMs = pin["maximalesEvidenceAlterMs"];
  if (typeof freshnessFingerprint !== "string"
      || typeof inventoryFingerprint !== "string"
      || typeof gueltigBisMs !== "number"
      || !Number.isSafeInteger(gueltigBisMs)
      || gueltigBisMs < 0
      || typeof maximalesEvidenceAlterMs !== "number"
      || !Number.isSafeInteger(maximalesEvidenceAlterMs)
      || maximalesEvidenceAlterMs < 1
      || maximalesEvidenceAlterMs > 60_000
      || pin["posten"].length < 1
      || pin["posten"].length > 64) {
    throw new Error("LOGISTIK_CONTROLLER_PIN_UNGUELTIG");
  }
  pruefeText(
    freshnessFingerprint,
    "LOGISTIK_CONTROLLER_PIN_TEXT_UNGUELTIG",
  );
  pruefeText(
    inventoryFingerprint,
    "LOGISTIK_CONTROLLER_PIN_TEXT_UNGUELTIG",
  );
  return pin as unknown as LogistikQuellenPin;
}

function parsePersistenz(
  text: string,
): PersistierterLogistikControllerSnapshot {
  let roh: unknown;
  try {
    roh = JSON.parse(text);
  } catch {
    throw new Error("LOGISTIK_CONTROLLER_PERSISTENZ_UNGUELTIG");
  }
  if (!istObjekt(roh)
      || roh["schemaVersion"] !== 1
      || !Array.isArray(roh["eintraege"])) {
    throw new Error("LOGISTIK_CONTROLLER_PERSISTENZ_UNGUELTIG");
  }
  const gespeichertAmMs = roh["gespeichertAmMs"];
  if (typeof gespeichertAmMs !== "number"
      || !Number.isSafeInteger(gespeichertAmMs)
      || gespeichertAmMs < 0
      || roh["eintraege"].length > 512) {
    throw new Error("LOGISTIK_CONTROLLER_PERSISTENZ_UNGUELTIG");
  }

  const eintraege = roh["eintraege"].map((row, index) => {
    if (!istObjekt(row) || !istObjekt(row["sicht"])) {
      throw new Error("LOGISTIK_CONTROLLER_EINTRAG_UNGUELTIG");
    }
    const sicht = row["sicht"] as unknown as MerchantLogistikSicht;
    if (sicht.plan?.schemaVersion !== 1
        || typeof sicht.plan.logistikId !== "string"
        || roh["eintraege"].slice(0, index).some(
          vorher => istObjekt(vorher)
            && istObjekt(vorher["sicht"])
            && istObjekt(vorher["sicht"]["plan"])
            && vorher["sicht"]["plan"]["logistikId"] === sicht.plan.logistikId,
        )) {
      throw new Error("LOGISTIK_CONTROLLER_EINTRAG_UNGUELTIG");
    }
    const quellenPin = validierePinStruktur(row["quellenPin"]);
    if (quellenPin.quelle.characterId !== sicht.plan.quelleCharacterId) {
      throw new Error("LOGISTIK_CONTROLLER_PIN_QUELLE_DRIFT");
    }
    return Object.freeze({
      sicht,
      quellenPin,
    });
  });

  return Object.freeze({
    schemaVersion: 1,
    gespeichertAmMs,
    eintraege: Object.freeze(eintraege),
  });
}

export class PersistenterMerchantLogistikController {
  public readonly gameplayAutoritaet = false as const;
  public readonly rawWriteAutoritaet = false as const;

  readonly #speicher: SpeicherPort;
  readonly #pfad: string;
  readonly #ledger: MerchantLogistikLedger;
  #pins: readonly Readonly<{
    logistikId: string;
    quellenPin: LogistikQuellenPin;
  }>[] = Object.freeze([]);

  public constructor(
    speicher: SpeicherPort,
    pfad = "merchant/logistik-intents-v1.json",
    maximaleEintraege = 256,
  ) {
    pruefeText(pfad, "LOGISTIK_CONTROLLER_PFAD_UNGUELTIG");
    this.#speicher = speicher;
    this.#pfad = pfad;
    this.#ledger = new MerchantLogistikLedger(maximaleEintraege);
  }

  public async lade(jetztMs: number): Promise<PersistenterLogistikLadeStatus> {
    pruefeZeit(jetztMs);
    const text = await this.#speicher.lies(this.#pfad);
    if (text === undefined) {
      return Object.freeze({
        schemaVersion: 1,
        geladen: false,
        recoveryPending: 0,
        settled: 0,
        failedSafe: 0,
        gameplayAutoritaet: false,
        rawWriteAutoritaet: false,
      });
    }

    const snapshot = parsePersistenz(text);
    if (snapshot.gespeichertAmMs > jetztMs) {
      throw new Error("LOGISTIK_CONTROLLER_PERSISTENZ_AUS_ZUKUNFT");
    }

    this.#ledger.importiereNachRestart(
      Object.freeze(snapshot.eintraege.map(x => x.sicht)),
    );
    this.#pins = Object.freeze(snapshot.eintraege.map(x => Object.freeze({
      logistikId: x.sicht.plan.logistikId,
      quellenPin: x.quellenPin,
    })));
    await this.#persistiere(jetztMs);

    const sicht = this.#ledger.snapshot();
    return Object.freeze({
      schemaVersion: 1,
      geladen: true,
      recoveryPending: sicht.filter(
        x => x.zustand === "RECOVERY_PENDING",
      ).length,
      settled: sicht.filter(x => x.zustand === "SETTLED").length,
      failedSafe: sicht.filter(x => x.zustand === "FAILED_SAFE").length,
      gameplayAutoritaet: false,
      rawWriteAutoritaet: false,
    });
  }

  public async uebernehmePlan(
    ergebnis: MerchantLogistikPlanungsErgebnis,
    jetztMs: number,
  ): Promise<MerchantLogistikSicht> {
    pruefeZeit(jetztMs);
    if (ergebnis.schemaVersion !== 1
        || ergebnis.planungsNachweis !== true
        || ergebnis.ausfuehrungsAutoritaet !== false
        || ergebnis.gameplayAutoritaet !== false
        || ergebnis.rawWriteAutoritaet !== false
        || ergebnis.transferBindung.actionContractId !== "AL-ACTION-SEND-ITEM"
        || ergebnis.transferBindung.recoveryContractId
          !== "AL-RECOVERY-SEND-ITEM"
        || ergebnis.transferBindung.verifierId !== "AL-VERIFIER-SEND-ITEM"
        || ergebnis.transferBindung.planningOnly !== true) {
      throw new Error("LOGISTIK_CONTROLLER_PLAN_UNGUELTIG");
    }
    if (ergebnis.plan.gueltigBisMs < jetztMs) {
      throw new Error("LOGISTIK_CONTROLLER_PLAN_ABGELAUFEN");
    }
    const sicht = this.#ledger.plane(ergebnis.plan);
    this.#pins = Object.freeze([
      ...this.#pins,
      Object.freeze({
        logistikId: ergebnis.plan.logistikId,
        quellenPin: ergebnis.quellenPin,
      }),
    ]);
    await this.#persistiere(jetztMs);
    return sicht;
  }

  public async beginneRendezvous(
    logistikId: string,
    jetztMs: number,
  ): Promise<MerchantLogistikSicht> {
    pruefeZeit(jetztMs);
    const sicht = this.#ledger.beginneRendezvous(logistikId);
    await this.#persistiere(jetztMs);
    return sicht;
  }

  public async bestaetigeRendezvous(
    logistikId: string,
    evidence: RendezvousEvidence,
    jetztMs: number,
  ): Promise<MerchantLogistikSicht> {
    pruefeZeit(jetztMs);
    if (evidence.beobachtetAmMs > jetztMs) {
      throw new Error("LOGISTIK_CONTROLLER_ZIEL_EVIDENCE_AUS_ZUKUNFT");
    }
    const sicht = this.#ledger.bestaetigeRendezvous(logistikId, evidence);
    await this.#persistiere(jetztMs);
    return sicht;
  }

  public async bereiteTransferVor(
    logistikId: string,
    quelleEvidence: LogistikQuellenEvidence,
    jetztMs: number,
  ): Promise<LogistikTransferVorbereitung> {
    pruefeZeit(jetztMs);
    const alt = this.#ledger.finde(logistikId);
    const pin = this.#findePin(logistikId);
    pruefeLogistikQuellenPin(pin, quelleEvidence, alt.plan, jetztMs);

    const sicht = this.#ledger.beginneTransfer(logistikId);
    await this.#persistiere(jetztMs);

    return Object.freeze({
      schemaVersion: 1,
      sicht,
      actionContractId: "AL-ACTION-SEND-ITEM",
      recoveryContractId: "AL-RECOVERY-SEND-ITEM",
      verifierId: "AL-VERIFIER-SEND-ITEM",
      durableIntentPersistiert: true,
      sameTransferErneutSenden: false,
      ausfuehrungsAutoritaet: false,
      gameplayAutoritaet: false,
      rawWriteAutoritaet: false,
    });
  }

  public async verifiziereSettlement(
    logistikId: string,
    evidence: TransferSettlementEvidence,
    jetztMs: number,
  ): Promise<MerchantLogistikSicht> {
    pruefeZeit(jetztMs);
    if (evidence.beobachtetAmMs > jetztMs) {
      throw new Error("LOGISTIK_CONTROLLER_SETTLEMENT_AUS_ZUKUNFT");
    }
    const sicht = this.#ledger.verifiziereSettlement(logistikId, evidence);
    await this.#persistiere(jetztMs);
    return sicht;
  }

  public async scheitereSicher(
    logistikId: string,
    jetztMs: number,
  ): Promise<MerchantLogistikSicht> {
    pruefeZeit(jetztMs);
    const sicht = this.#ledger.scheitereSicher(logistikId);
    await this.#persistiere(jetztMs);
    return sicht;
  }

  public finde(logistikId: string): MerchantLogistikSicht {
    return this.#ledger.finde(logistikId);
  }

  public snapshot(): readonly MerchantLogistikSicht[] {
    return this.#ledger.snapshot();
  }

  #findePin(logistikId: string): LogistikQuellenPin {
    pruefeText(logistikId, "LOGISTIK_CONTROLLER_ID_UNGUELTIG");
    const row = this.#pins.find(x => x.logistikId === logistikId);
    if (row === undefined) {
      throw new Error("LOGISTIK_CONTROLLER_PIN_FEHLT");
    }
    return row.quellenPin;
  }

  async #persistiere(jetztMs: number): Promise<void> {
    const sicht = this.#ledger.snapshot();
    const eintraege = sicht.map(row => Object.freeze({
      sicht: row,
      quellenPin: this.#findePin(row.plan.logistikId),
    }));
    const snapshot: PersistierterLogistikControllerSnapshot = Object.freeze({
      schemaVersion: 1,
      gespeichertAmMs: jetztMs,
      eintraege: Object.freeze(eintraege),
    });
    const inhalt = JSON.stringify(snapshot);
    if (inhalt.length > 1_000_000) {
      throw new Error("LOGISTIK_CONTROLLER_PERSISTENZ_ZU_GROSS");
    }
    await this.#speicher.schreibe({
      relativerPfad: this.#pfad,
      inhalt,
      kritisch: true,
    });
  }
}
