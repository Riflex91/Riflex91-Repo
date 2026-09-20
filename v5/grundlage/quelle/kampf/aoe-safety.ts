import {
  istThreatCcPinFrisch,
  type ThreatCcPin,
} from "./threat-cc.js";

export interface AoeHardCaps {
  readonly maximalTargets: number;
  readonly maximalErwarteterBasisDps: number;
  readonly minimaleHpQuote: number;
}

export interface AoeLearningEmpfehlung {
  readonly empfohleneMaxTargets: number;
  readonly evidenceFingerprint: string;
}

export interface AoePlanAnfrage {
  readonly jetztMs: number;
  readonly hp: number;
  readonly maxHp: number;
  readonly targets: readonly ThreatCcPin[];
  readonly hardCaps: AoeHardCaps;
  readonly learning: AoeLearningEmpfehlung | null;
}

export interface AoeSafetyNachweis {
  readonly erlaubt: boolean;
  readonly effektivesTargetLimit: number;
  readonly erwarteterBasisDps: number;
  readonly grund: "OK" | "HP_RESERVE" | "ZU_VIELE_TARGETS" | "DPS_CAP" | "STALE_TARGET";
  readonly learningKannHardCapsNichtLockern: true;
}

export function pruefeAoeSafety(anfrage: AoePlanAnfrage): AoeSafetyNachweis {
  if (!Number.isSafeInteger(anfrage.jetztMs) || anfrage.jetztMs < 0
      || !Number.isFinite(anfrage.hp) || anfrage.hp < 0
      || !Number.isFinite(anfrage.maxHp) || anfrage.maxHp <= 0
      || !Number.isInteger(anfrage.hardCaps.maximalTargets)
      || anfrage.hardCaps.maximalTargets < 1
      || anfrage.hardCaps.maximalTargets > 100
      || !Number.isFinite(anfrage.hardCaps.maximalErwarteterBasisDps)
      || anfrage.hardCaps.maximalErwarteterBasisDps < 0
      || !Number.isFinite(anfrage.hardCaps.minimaleHpQuote)
      || anfrage.hardCaps.minimaleHpQuote <= 0
      || anfrage.hardCaps.minimaleHpQuote > 1
      || anfrage.targets.length > 100) {
    throw new Error("AOE_POLICY_ODER_ANFRAGE_UNGUELTIG");
  }
  const learningLimit = anfrage.learning === null
    ? anfrage.hardCaps.maximalTargets
    : Math.max(1, Math.min(
      anfrage.hardCaps.maximalTargets,
      Math.floor(anfrage.learning.empfohleneMaxTargets),
    ));
  const basis = (erlaubt: boolean, grund: AoeSafetyNachweis["grund"], dps: number): AoeSafetyNachweis =>
    Object.freeze({
      erlaubt,
      effektivesTargetLimit: learningLimit,
      erwarteterBasisDps: dps,
      grund,
      learningKannHardCapsNichtLockern: true,
    });
  if (anfrage.hp / anfrage.maxHp < anfrage.hardCaps.minimaleHpQuote) {
    return basis(false, "HP_RESERVE", 0);
  }
  if (anfrage.targets.some(x => !istThreatCcPinFrisch(x, anfrage.jetztMs))) {
    return basis(false, "STALE_TARGET", 0);
  }
  if (anfrage.targets.length > learningLimit) {
    return basis(false, "ZU_VIELE_TARGETS", 0);
  }
  const dps = anfrage.targets.reduce((summe, x) => summe + x.erwarteterBasisDps, 0);
  if (dps > anfrage.hardCaps.maximalErwarteterBasisDps) {
    return basis(false, "DPS_CAP", dps);
  }
  return basis(true, "OK", dps);
}
