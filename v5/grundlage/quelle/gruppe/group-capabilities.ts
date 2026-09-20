import {
  istPartyWahrheitFrisch,
  type FrischePartyWahrheit,
} from "./party-wahrheit.js";
import type { SkillCapabilityNachweis } from "../kampf/skill-capability.js";

export type GruppenCapability =
  | "TANK"
  | "HEAL"
  | "SINGLE_TARGET"
  | "AOE"
  | "CC"
  | "KITE"
  | "REVIVE";

export interface MitgliedCapabilityEvidence {
  readonly characterId: string;
  readonly sessionId: string;
  readonly lifecycleAktiv: boolean;
  readonly beobachtetAmMs: number;
  readonly evidenceFingerprint: string;
  readonly capabilities: readonly Readonly<{
    capability: GruppenCapability;
    skill: SkillCapabilityNachweis;
  }>[];
}

export interface GruppenCapabilitySicht {
  readonly capability: GruppenCapability;
  readonly verfuegbar: boolean;
  readonly traegerCharacterIds: readonly string[];
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

export function berechneGruppenCapabilities(
  party: FrischePartyWahrheit,
  evidence: readonly MitgliedCapabilityEvidence[],
  jetztMs: number,
  maxEvidenceAlterMs: number,
): readonly GruppenCapabilitySicht[] {
  if (!istPartyWahrheitFrisch(party, jetztMs)) throw new Error("GRUPPE_PARTY_STALE");
  if (!Number.isSafeInteger(maxEvidenceAlterMs)
      || maxEvidenceAlterMs < 1
      || maxEvidenceAlterMs > 60_000
      || evidence.length > 16) {
    throw new Error("GRUPPE_CAPABILITY_POLICY_UNGUELTIG");
  }
  for (let index = 0; index < evidence.length; index += 1) {
    const e = evidence[index];
    if (e === undefined) throw new Error("GRUPPE_CAPABILITY_EVIDENCE_FEHLT");
    for (const text of [e.characterId, e.sessionId, e.evidenceFingerprint]) {
      pruefeText(text, "GRUPPE_CAPABILITY_TEXT_UNGUELTIG");
    }
    const member = party.mitglieder.find(x => x.characterId === e.characterId);
    if (member === undefined || member.zielBindung.sessionId !== e.sessionId) {
      throw new Error("GRUPPE_CAPABILITY_MEMBER_BINDUNG_DRIFT");
    }
    if (!Number.isSafeInteger(e.beobachtetAmMs)
        || e.beobachtetAmMs > jetztMs
        || jetztMs - e.beobachtetAmMs > maxEvidenceAlterMs) {
      throw new Error("GRUPPE_CAPABILITY_EVIDENCE_STALE");
    }
    if (evidence.slice(0, index).some(x => x.characterId === e.characterId)) {
      throw new Error("GRUPPE_CAPABILITY_MEMBER_DOPPELT");
    }
  }

  const alle: readonly GruppenCapability[] = Object.freeze([
    "TANK", "HEAL", "SINGLE_TARGET", "AOE", "CC", "KITE", "REVIVE",
  ]);
  return Object.freeze(alle.map(capability => {
    const traeger = evidence
      .filter(e => e.lifecycleAktiv)
      .filter(e => e.capabilities.some(c => c.capability === capability && c.skill.nutzbar))
      .map(e => e.characterId)
      .sort();
    return Object.freeze({
      capability,
      verfuegbar: traeger.length > 0,
      traegerCharacterIds: Object.freeze(traeger),
    });
  }));
}
