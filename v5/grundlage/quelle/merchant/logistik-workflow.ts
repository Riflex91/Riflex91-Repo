import type { CharacterZielBindung } from "../koordination/roster-wahrheit.js";

export type MerchantLogistikArt = "SUPPLY_DELIVERY" | "COLLECTION" | "GEAR_DELIVERY";
export type MerchantLogistikZustand =
  | "GEPLANT"
  | "RENDEZVOUS_AUSSTEHEND"
  | "RENDEZVOUS_BESTAETIGT"
  | "TRANSFER_AUSSTEHEND"
  | "SETTLED"
  | "RECOVERY_PENDING"
  | "FAILED_SAFE";

export interface LogistikPosten {
  readonly physischeKennung: string;
  readonly name: string;
  readonly level: number;
  readonly menge: number;
  readonly baselineEmpfaengerMenge: number;
}

export interface MerchantLogistikPlan {
  readonly schemaVersion: 1;
  readonly logistikId: string;
  readonly art: MerchantLogistikArt;
  readonly ownerCharacterId: string;
  readonly quelleCharacterId: string;
  readonly empfaenger: CharacterZielBindung;
  readonly posten: readonly LogistikPosten[];
  readonly erstelltAmMs: number;
  readonly gueltigBisMs: number;
  readonly maximalTransferDistanz: number;
  readonly zielFreshnessFingerprint: string;
  readonly baselineEmpfaengerInventoryFingerprint: string;
}

export interface RendezvousEvidence {
  readonly schemaVersion: 1;
  readonly characterId: string;
  readonly sessionId: string;
  readonly serverRegion: string;
  readonly serverIdentifier: string;
  readonly rosterEpoche: number;
  readonly beobachtetAmMs: number;
  readonly distanz: number;
  readonly freshnessFingerprint: string;
}

export interface TransferSettlementEvidence {
  readonly schemaVersion: 1;
  readonly characterId: string;
  readonly sessionId: string;
  readonly serverRegion: string;
  readonly serverIdentifier: string;
  readonly rosterEpoche: number;
  readonly beobachtetAmMs: number;
  readonly inventoryFingerprint: string;
  readonly baselineInventoryFingerprint: string;
  readonly mengen: readonly Readonly<{ name: string; level: number; menge: number }>[];
  readonly settlementFingerprint: string;
}

export interface MerchantLogistikSicht {
  readonly plan: MerchantLogistikPlan;
  readonly zustand: MerchantLogistikZustand;
  readonly recoveryVorZustand:
    | Exclude<MerchantLogistikZustand, "RECOVERY_PENDING">
    | null;
  readonly letzteEvidenceFingerprint: string | null;
  readonly sameTransferErneutSenden: false;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function pruefeGanzzahl(wert: number, max: number, fehler: string): void {
  if (!Number.isInteger(wert) || wert < 0 || wert > max) throw new Error(fehler);
}

function pruefeZiel(ziel: CharacterZielBindung): void {
  if (ziel.schemaVersion !== 1 || !Number.isInteger(ziel.rosterEpoche) || ziel.rosterEpoche < 1) {
    throw new Error("LOGISTIK_ZIEL_UNGUELTIG");
  }
  for (const text of [
    ziel.accountId,
    ziel.characterId,
    ziel.sessionId,
    ziel.serverRegion,
    ziel.serverIdentifier,
    ziel.rosterFingerprint,
  ]) pruefeText(text, "LOGISTIK_ZIEL_TEXT_UNGUELTIG");
}

function frierePlan(plan: MerchantLogistikPlan): MerchantLogistikPlan {
  return Object.freeze({
    ...plan,
    empfaenger: Object.freeze({ ...plan.empfaenger }),
    posten: Object.freeze(plan.posten.map(x => Object.freeze({ ...x }))),
  });
}

function friereSicht(sicht: MerchantLogistikSicht): MerchantLogistikSicht {
  return Object.freeze({ ...sicht, plan: frierePlan(sicht.plan) });
}

function zielPasst(plan: MerchantLogistikPlan, evidence: RendezvousEvidence | TransferSettlementEvidence): boolean {
  return evidence.characterId === plan.empfaenger.characterId
    && evidence.sessionId === plan.empfaenger.sessionId
    && evidence.serverRegion === plan.empfaenger.serverRegion
    && evidence.serverIdentifier === plan.empfaenger.serverIdentifier
    && evidence.rosterEpoche === plan.empfaenger.rosterEpoche;
}

export class MerchantLogistikLedger {
  readonly #maximal: number;
  #eintraege: readonly MerchantLogistikSicht[] = Object.freeze([]);

  public constructor(maximal = 256) {
    if (!Number.isInteger(maximal) || maximal < 1 || maximal > 2048) {
      throw new Error("LOGISTIK_LEDGER_GRENZE_UNGUELTIG");
    }
    this.#maximal = maximal;
  }

  public plane(plan: MerchantLogistikPlan): MerchantLogistikSicht {
    if (plan.schemaVersion !== 1) throw new Error("LOGISTIK_SCHEMA_UNGUELTIG");
    for (const text of [
      plan.logistikId,
      plan.ownerCharacterId,
      plan.quelleCharacterId,
      plan.zielFreshnessFingerprint,
      plan.baselineEmpfaengerInventoryFingerprint,
    ]) pruefeText(text, "LOGISTIK_TEXT_UNGUELTIG");
    if (!["SUPPLY_DELIVERY", "COLLECTION", "GEAR_DELIVERY"].includes(plan.art)) {
      throw new Error("LOGISTIK_ART_UNGUELTIG");
    }
    pruefeZiel(plan.empfaenger);
    if (!Number.isSafeInteger(plan.erstelltAmMs)
        || !Number.isSafeInteger(plan.gueltigBisMs)
        || plan.erstelltAmMs < 0
        || plan.gueltigBisMs < plan.erstelltAmMs
        || !Number.isFinite(plan.maximalTransferDistanz)
        || plan.maximalTransferDistanz <= 0
        || plan.maximalTransferDistanz > 10_000) {
      throw new Error("LOGISTIK_GUELTIGKEIT_UNGUELTIG");
    }
    if (plan.posten.length < 1 || plan.posten.length > 64) {
      throw new Error("LOGISTIK_POSTEN_ANZAHL_UNGUELTIG");
    }
    for (let index = 0; index < plan.posten.length; index += 1) {
      const posten = plan.posten[index];
      if (posten === undefined) throw new Error("LOGISTIK_POSTEN_FEHLT");
      for (const text of [posten.physischeKennung, posten.name]) {
        pruefeText(text, "LOGISTIK_POSTEN_TEXT_UNGUELTIG");
      }
      pruefeGanzzahl(posten.level, 99, "LOGISTIK_POSTEN_LEVEL_UNGUELTIG");
      pruefeGanzzahl(posten.menge, 1_000_000, "LOGISTIK_POSTEN_MENGE_UNGUELTIG");
      pruefeGanzzahl(
        posten.baselineEmpfaengerMenge,
        1_000_000,
        "LOGISTIK_POSTEN_BASELINE_UNGUELTIG",
      );
      if (posten.menge < 1) throw new Error("LOGISTIK_POSTEN_MENGE_UNGUELTIG");
      if (plan.posten.slice(0, index).some(x => x.physischeKennung === posten.physischeKennung)) {
        throw new Error("LOGISTIK_PHYSISCHER_POSTEN_DOPPELT");
      }
    }
    if (this.#eintraege.some(x => x.plan.logistikId === plan.logistikId)) {
      throw new Error("LOGISTIK_ID_DOPPELT");
    }
    if (this.#eintraege.length >= this.#maximal) throw new Error("LOGISTIK_LEDGER_VOLL");
    const sicht = friereSicht({
      plan: frierePlan(plan),
      zustand: "GEPLANT",
      recoveryVorZustand: null,
      letzteEvidenceFingerprint: null,
      sameTransferErneutSenden: false,
    });
    this.#eintraege = Object.freeze([...this.#eintraege, sicht]);
    return sicht;
  }

  public beginneRendezvous(logistikId: string): MerchantLogistikSicht {
    const alt = this.#finde(logistikId);
    const darfNachRestart = alt.zustand === "RECOVERY_PENDING"
      && alt.recoveryVorZustand === "GEPLANT";
    if (alt.zustand !== "GEPLANT" && !darfNachRestart) {
      throw new Error("LOGISTIK_RENDEZVOUS_ZUSTAND_UNGUELTIG");
    }
    return this.#ersetze(friereSicht({
      ...alt,
      zustand: "RENDEZVOUS_AUSSTEHEND",
      recoveryVorZustand: null,
    }));
  }

  public bestaetigeRendezvous(logistikId: string, evidence: RendezvousEvidence): MerchantLogistikSicht {
    const alt = this.#finde(logistikId);
    const darfNachRestart = alt.zustand === "RECOVERY_PENDING"
      && (alt.recoveryVorZustand === "RENDEZVOUS_AUSSTEHEND"
        || alt.recoveryVorZustand === "RENDEZVOUS_BESTAETIGT");
    if (alt.zustand !== "RENDEZVOUS_AUSSTEHEND" && !darfNachRestart) {
      throw new Error("LOGISTIK_RENDEZVOUS_EVIDENCE_ZUSTAND_UNGUELTIG");
    }
    if (evidence.schemaVersion !== 1
        || !zielPasst(alt.plan, evidence)
        || evidence.freshnessFingerprint !== alt.plan.zielFreshnessFingerprint) {
      throw new Error("LOGISTIK_RENDEZVOUS_ZIEL_DRIFT");
    }
    if (!Number.isSafeInteger(evidence.beobachtetAmMs)
        || evidence.beobachtetAmMs < alt.plan.erstelltAmMs
        || evidence.beobachtetAmMs > alt.plan.gueltigBisMs
        || !Number.isFinite(evidence.distanz)
        || evidence.distanz < 0
        || evidence.distanz > alt.plan.maximalTransferDistanz) {
      throw new Error("LOGISTIK_RENDEZVOUS_NICHT_FRISCH_ODER_ZU_WEIT");
    }
    return this.#ersetze(friereSicht({
      ...alt,
      zustand: "RENDEZVOUS_BESTAETIGT",
      recoveryVorZustand: null,
      letzteEvidenceFingerprint: evidence.freshnessFingerprint,
    }));
  }

  public beginneTransfer(logistikId: string): MerchantLogistikSicht {
    const alt = this.#finde(logistikId);
    if (alt.zustand !== "RENDEZVOUS_BESTAETIGT") {
      throw new Error("LOGISTIK_TRANSFER_ZUSTAND_UNGUELTIG");
    }
    return this.#ersetze(friereSicht({
      ...alt,
      zustand: "TRANSFER_AUSSTEHEND",
      recoveryVorZustand: null,
    }));
  }

  public verifiziereSettlement(
    logistikId: string,
    evidence: TransferSettlementEvidence,
  ): MerchantLogistikSicht {
    const alt = this.#finde(logistikId);
    const darfNachRestart = alt.zustand === "RECOVERY_PENDING"
      && alt.recoveryVorZustand === "TRANSFER_AUSSTEHEND";
    if (alt.zustand !== "TRANSFER_AUSSTEHEND" && !darfNachRestart) {
      throw new Error("LOGISTIK_SETTLEMENT_ZUSTAND_UNGUELTIG");
    }
    if (evidence.schemaVersion !== 1 || !zielPasst(alt.plan, evidence)) {
      throw new Error("LOGISTIK_SETTLEMENT_ZIEL_DRIFT");
    }
    for (const text of [
      evidence.inventoryFingerprint,
      evidence.baselineInventoryFingerprint,
      evidence.settlementFingerprint,
    ]) pruefeText(text, "LOGISTIK_SETTLEMENT_TEXT_UNGUELTIG");
    if (!Number.isSafeInteger(evidence.beobachtetAmMs)
        || evidence.beobachtetAmMs < alt.plan.erstelltAmMs
        || evidence.beobachtetAmMs > alt.plan.gueltigBisMs) {
      throw new Error("LOGISTIK_SETTLEMENT_EVIDENCE_ZU_ALT");
    }
    if (evidence.baselineInventoryFingerprint !== alt.plan.baselineEmpfaengerInventoryFingerprint) {
      throw new Error("LOGISTIK_SETTLEMENT_BASELINE_DRIFT");
    }
    if (evidence.inventoryFingerprint === evidence.baselineInventoryFingerprint) {
      throw new Error("LOGISTIK_SETTLEMENT_KEIN_NEUER_INVENTARSTAND");
    }
    const itemKeys = alt.plan.posten
      .map(posten => posten.name + "|" + String(posten.level))
      .filter((key, index, alle) => alle.indexOf(key) === index);
    for (const key of itemKeys) {
      const geplant = alt.plan.posten.filter(
        posten => posten.name + "|" + String(posten.level) === key,
      );
      const erster = geplant[0];
      if (erster === undefined) {
        throw new Error("LOGISTIK_SETTLEMENT_PLAN_POSTEN_FEHLT");
      }
      if (geplant.some(
        posten => posten.baselineEmpfaengerMenge
          !== erster.baselineEmpfaengerMenge,
      )) {
        throw new Error(
          "LOGISTIK_SETTLEMENT_PLAN_BASELINE_DRIFT:" + erster.name,
        );
      }
      const benoetigt = geplant.reduce(
        (summe, posten) => summe + posten.menge,
        0,
      );
      const beobachtet = evidence.mengen
        .filter(x => x.name === erster.name && x.level === erster.level)
        .reduce((summe, x) => summe + x.menge, 0);
      if (beobachtet - erster.baselineEmpfaengerMenge < benoetigt) {
        throw new Error("LOGISTIK_SETTLEMENT_MENGE_FEHLT:" + erster.name);
      }
    }
    return this.#ersetze(friereSicht({
      ...alt,
      zustand: "SETTLED",
      recoveryVorZustand: null,
      letzteEvidenceFingerprint: evidence.settlementFingerprint,
    }));
  }

  public scheitereSicher(logistikId: string): MerchantLogistikSicht {
    const alt = this.#finde(logistikId);
    if (alt.zustand === "SETTLED" || alt.zustand === "FAILED_SAFE") {
      throw new Error("LOGISTIK_FAILED_SAFE_ZUSTAND_UNGUELTIG");
    }
    return this.#ersetze(friereSicht({
      ...alt,
      zustand: "FAILED_SAFE",
      recoveryVorZustand: null,
      sameTransferErneutSenden: false,
    }));
  }

  public importiereNachRestart(snapshot: readonly MerchantLogistikSicht[]): void {
    if (snapshot.length > this.#maximal) throw new Error("LOGISTIK_RESTART_ZU_GROSS");
    const neu = snapshot.map((x, index) => {
      if (x.plan.schemaVersion !== 1
          || snapshot.slice(0, index).some(y => y.plan.logistikId === x.plan.logistikId)) {
        throw new Error("LOGISTIK_RESTART_SNAPSHOT_UNGUELTIG");
      }
      const terminal = x.zustand === "SETTLED" || x.zustand === "FAILED_SAFE";
      const recoveryVorZustand = terminal
        ? null
        : x.zustand === "RECOVERY_PENDING"
          ? x.recoveryVorZustand
          : x.zustand;
      if (!terminal && recoveryVorZustand === null) {
        throw new Error("LOGISTIK_RESTART_RECOVERY_URSPRUNG_FEHLT");
      }
      return friereSicht({
        ...x,
        zustand: terminal ? x.zustand : "RECOVERY_PENDING",
        recoveryVorZustand,
        sameTransferErneutSenden: false,
      });
    });
    this.#eintraege = Object.freeze(neu);
  }

  public finde(logistikId: string): MerchantLogistikSicht {
    return friereSicht(this.#finde(logistikId));
  }

  public snapshot(): readonly MerchantLogistikSicht[] {
    return Object.freeze(this.#eintraege.map(x => friereSicht(x)));
  }

  #finde(logistikId: string): MerchantLogistikSicht {
    pruefeText(logistikId, "LOGISTIK_ID_UNGUELTIG");
    const sicht = this.#eintraege.find(x => x.plan.logistikId === logistikId);
    if (sicht === undefined) throw new Error("LOGISTIK_UNBEKANNT");
    return sicht;
  }

  #ersetze(neu: MerchantLogistikSicht): MerchantLogistikSicht {
    this.#eintraege = Object.freeze(
      this.#eintraege.map(x => x.plan.logistikId === neu.plan.logistikId ? neu : x),
    );
    return friereSicht(neu);
  }
}
