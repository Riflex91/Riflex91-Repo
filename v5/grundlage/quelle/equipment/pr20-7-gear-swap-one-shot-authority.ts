import type { Pr207GearSwapPlan } from "./pr20-7-gear-swap-vorbereitung.js";

export const PR20_7_GEAR_SWAP_ONE_SHOT_POLICY_ID =
  "PR20-7-GEAR-OCCUPIED-NONWEAPON-ONE-SHOT-V1";

export type Pr207GearSwapFenceArt = "EXKLUSIV";

export interface Pr207GearSwapFenceClaim {
  readonly ressourcenId: string;
  readonly art: Pr207GearSwapFenceArt;
  readonly epoche: number;
}

export interface Pr207GearSwapOneShotAnforderung {
  readonly schemaVersion: 1;
  readonly aktivierungsId: string;
  readonly transaktionsId: string;
  readonly plan: Pr207GearSwapPlan;
  readonly ausgestelltAmMs: number;
  readonly gueltigBisMs: number;
  readonly equipmentFenceEpoche: number;
  readonly inventoryFenceEpoche: number;
}

export interface Pr207GearSwapOneShotDaten {
  readonly schemaVersion: 1;
  readonly policyId: typeof PR20_7_GEAR_SWAP_ONE_SHOT_POLICY_ID;
  readonly aktivierungsId: string;
  readonly transaktionsId: string;
  readonly recipientCharacterId: string;
  readonly recipientSessionId: string;
  readonly recipientRosterEpoche: number;
  readonly recipientRosterFingerprint: string;
  readonly serverRegion: string;
  readonly serverIdentifier: string;
  readonly slot: string;
  readonly kandidatIndex: number;
  readonly evidenceId: string;
  readonly prestateFingerprintMaterial: Readonly<{
    slotFingerprint: string;
    indexFingerprint: string;
    restInventarFingerprint: string;
    restEquipmentFingerprint: string;
  }>;
  readonly resourceClaims: readonly Pr207GearSwapFenceClaim[];
  readonly ausgestelltAmMs: number;
  readonly gueltigBisMs: number;
  readonly maximaleVerwendungen: 1;
  readonly actionContractId: "AL-ACTION-EQUIP";
  readonly recoveryContractId: "AL-RECOVERY-EQUIP";
  readonly verifierId: "AL-VERIFIER-EQUIP";
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
  readonly swapWriteRatification: false;
}

export interface Pr207GearSwapOneShotPruefung {
  readonly schemaVersion: 1;
  readonly erlaubt: boolean;
  readonly grund: string;
  readonly verbraucht: boolean;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
  readonly swapWriteRatification: false;
}

function text(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function zeit(wert: number, fehler: string): void {
  if (!Number.isSafeInteger(wert) || wert < 0) throw new Error(fehler);
}

function epoche(wert: number, fehler: string): void {
  if (!Number.isSafeInteger(wert) || wert < 1) throw new Error(fehler);
}

function validierePlan(plan: Pr207GearSwapPlan): void {
  if (plan.schemaVersion !== 1
      || plan.status !== "BEREIT_NO_WRITE"
      || plan.ausfuehrungsAutoritaet !== false
      || plan.gameplayAutoritaet !== false
      || plan.rawWriteAutoritaet !== false
      || plan.swapWriteRatification !== false
      || plan.actionContractId !== "AL-ACTION-EQUIP"
      || plan.recoveryContractId !== "AL-RECOVERY-EQUIP"
      || plan.verifierId !== "AL-VERIFIER-EQUIP") {
    throw new Error("PR20_7_GEAR_ONE_SHOT_PLAN_UNGUELTIG");
  }
  for (const wert of [
    plan.evidenceId,
    plan.recipient.characterId,
    plan.recipient.sessionId,
    plan.recipient.serverRegion,
    plan.recipient.serverIdentifier,
    plan.recipient.rosterFingerprint,
    plan.slot,
    plan.prestate.slotFingerprint,
    plan.prestate.indexFingerprint,
    plan.prestate.restInventarFingerprint,
    plan.prestate.restEquipmentFingerprint,
  ]) text(wert, "PR20_7_GEAR_ONE_SHOT_PLAN_TEXT_UNGUELTIG");
  if (!Number.isInteger(plan.kandidatIndex)
      || plan.kandidatIndex < 0
      || plan.kandidatIndex >= 128) {
    throw new Error("PR20_7_GEAR_ONE_SHOT_INDEX_UNGUELTIG");
  }
  epoche(
    plan.recipient.rosterEpoche,
    "PR20_7_GEAR_ONE_SHOT_ROSTER_EPOCHE_UNGUELTIG",
  );
}

export class Pr207GearSwapOneShotAuthority {
  readonly #daten: Pr207GearSwapOneShotDaten;
  #verbraucht = false;
  #widerrufen = false;

  public constructor(daten: Pr207GearSwapOneShotDaten) {
    this.#daten = Object.freeze({
      ...daten,
      prestateFingerprintMaterial: Object.freeze({
        ...daten.prestateFingerprintMaterial,
      }),
      resourceClaims: Object.freeze(
        daten.resourceClaims.map(claim => Object.freeze({ ...claim })),
      ),
    });
  }

  public daten(): Pr207GearSwapOneShotDaten {
    return this.#daten;
  }

  public gueltigFuer(jetztMs: number): boolean {
    return Number.isSafeInteger(jetztMs)
      && jetztMs >= this.#daten.ausgestelltAmMs
      && jetztMs <= this.#daten.gueltigBisMs
      && !this.#verbraucht
      && !this.#widerrufen;
  }

  public pruefeExakteBindung(
    plan: Pr207GearSwapPlan,
    jetztMs: number,
    equipmentFenceEpoche: number,
    inventoryFenceEpoche: number,
  ): Pr207GearSwapOneShotPruefung {
    if (!this.gueltigFuer(jetztMs)) {
      return this.#blockiert("PR20_7_GEAR_ONE_SHOT_NICHT_GUELTIG");
    }
    const d = this.#daten;
    const claims = new Map(
      d.resourceClaims.map(claim => [claim.ressourcenId, claim.epoche]),
    );
    const equipmentId =
      "character:" + plan.recipient.characterId + ":equipment";
    const inventoryId =
      "character:" + plan.recipient.characterId + ":inventory";
    const passt = plan.evidenceId === d.evidenceId
      && plan.recipient.characterId === d.recipientCharacterId
      && plan.recipient.sessionId === d.recipientSessionId
      && plan.recipient.rosterEpoche === d.recipientRosterEpoche
      && plan.recipient.rosterFingerprint === d.recipientRosterFingerprint
      && plan.recipient.serverRegion === d.serverRegion
      && plan.recipient.serverIdentifier === d.serverIdentifier
      && plan.slot === d.slot
      && plan.kandidatIndex === d.kandidatIndex
      && plan.prestate.slotFingerprint
        === d.prestateFingerprintMaterial.slotFingerprint
      && plan.prestate.indexFingerprint
        === d.prestateFingerprintMaterial.indexFingerprint
      && plan.prestate.restInventarFingerprint
        === d.prestateFingerprintMaterial.restInventarFingerprint
      && plan.prestate.restEquipmentFingerprint
        === d.prestateFingerprintMaterial.restEquipmentFingerprint
      && claims.get(equipmentId) === equipmentFenceEpoche
      && claims.get(inventoryId) === inventoryFenceEpoche;

    if (!passt) {
      this.#widerrufen = true;
      return this.#blockiert("PR20_7_GEAR_ONE_SHOT_BINDUNG_ODER_FENCE_DRIFT");
    }
    this.#verbraucht = true;
    return Object.freeze({
      schemaVersion: 1,
      erlaubt: true,
      grund: "PR20_7_GEAR_ONE_SHOT_EXAKT_GEBUNDEN_NO_WRITE",
      verbraucht: true,
      gameplayAutoritaet: false,
      rawWriteAutoritaet: false,
      swapWriteRatification: false,
    });
  }

  public widerrufe(): void {
    this.#widerrufen = true;
  }

  public verbraucht(): boolean {
    return this.#verbraucht;
  }

  #blockiert(grund: string): Pr207GearSwapOneShotPruefung {
    return Object.freeze({
      schemaVersion: 1,
      erlaubt: false,
      grund,
      verbraucht: this.#verbraucht,
      gameplayAutoritaet: false,
      rawWriteAutoritaet: false,
      swapWriteRatification: false,
    });
  }
}

export function erstellePr207GearSwapOneShotAuthority(
  a: Pr207GearSwapOneShotAnforderung,
): Pr207GearSwapOneShotAuthority {
  if (a.schemaVersion !== 1) {
    throw new Error("PR20_7_GEAR_ONE_SHOT_SCHEMA_UNGUELTIG");
  }
  validierePlan(a.plan);
  for (const wert of [a.aktivierungsId, a.transaktionsId]) {
    text(wert, "PR20_7_GEAR_ONE_SHOT_ID_UNGUELTIG");
  }
  zeit(a.ausgestelltAmMs, "PR20_7_GEAR_ONE_SHOT_ZEIT_UNGUELTIG");
  zeit(a.gueltigBisMs, "PR20_7_GEAR_ONE_SHOT_GUELTIGKEIT_UNGUELTIG");
  if (a.gueltigBisMs < a.ausgestelltAmMs
      || a.gueltigBisMs - a.ausgestelltAmMs > 1_500) {
    throw new Error("PR20_7_GEAR_ONE_SHOT_TTL_UNGUELTIG");
  }
  epoche(
    a.equipmentFenceEpoche,
    "PR20_7_GEAR_ONE_SHOT_EQUIPMENT_FENCE_UNGUELTIG",
  );
  epoche(
    a.inventoryFenceEpoche,
    "PR20_7_GEAR_ONE_SHOT_INVENTORY_FENCE_UNGUELTIG",
  );

  const characterId = a.plan.recipient.characterId;
  const claims = Object.freeze([
    Object.freeze({
      ressourcenId: "character:" + characterId + ":equipment",
      art: "EXKLUSIV" as const,
      epoche: a.equipmentFenceEpoche,
    }),
    Object.freeze({
      ressourcenId: "character:" + characterId + ":inventory",
      art: "EXKLUSIV" as const,
      epoche: a.inventoryFenceEpoche,
    }),
  ]);

  return new Pr207GearSwapOneShotAuthority(Object.freeze({
    schemaVersion: 1,
    policyId: PR20_7_GEAR_SWAP_ONE_SHOT_POLICY_ID,
    aktivierungsId: a.aktivierungsId,
    transaktionsId: a.transaktionsId,
    recipientCharacterId: a.plan.recipient.characterId,
    recipientSessionId: a.plan.recipient.sessionId,
    recipientRosterEpoche: a.plan.recipient.rosterEpoche,
    recipientRosterFingerprint: a.plan.recipient.rosterFingerprint,
    serverRegion: a.plan.recipient.serverRegion,
    serverIdentifier: a.plan.recipient.serverIdentifier,
    slot: a.plan.slot,
    kandidatIndex: a.plan.kandidatIndex,
    evidenceId: a.plan.evidenceId,
    prestateFingerprintMaterial: Object.freeze({
      ...a.plan.prestate,
    }),
    resourceClaims: claims,
    ausgestelltAmMs: a.ausgestelltAmMs,
    gueltigBisMs: a.gueltigBisMs,
    maximaleVerwendungen: 1,
    actionContractId: "AL-ACTION-EQUIP",
    recoveryContractId: "AL-RECOVERY-EQUIP",
    verifierId: "AL-VERIFIER-EQUIP",
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
    swapWriteRatification: false,
  }));
}
