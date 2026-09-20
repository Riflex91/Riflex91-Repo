import type { CharacterZielBindung } from "../koordination/roster-wahrheit.js";

export interface SkillDefinition {
  readonly skillId: string;
  readonly erlaubteKlassen: readonly string[];
  readonly mindestLevel: number;
  readonly mpKosten: number;
  readonly cooldownDomaene: string;
  readonly range: number | null;
  readonly benoetigteEquipmentTags: readonly string[];
  readonly hostile: boolean;
}

export interface SkillLiveEvidence {
  readonly schemaVersion: 1;
  readonly character: CharacterZielBindung;
  readonly beobachtetAmMs: number;
  readonly ctype: string;
  readonly level: number;
  readonly mp: number;
  readonly rip: boolean;
  readonly disabled: boolean;
  readonly equipmentTags: readonly string[];
  readonly equipmentFingerprint: string;
  readonly skillId: string;
  readonly cooldownDomaene: string;
  readonly nextReadyAmMs: number;
  readonly evidenceFingerprint: string;
}

export type SkillNichtNutzbarGrund =
  | "STALE"
  | "FALSCHE_SESSION"
  | "FALSCHE_KLASSE"
  | "LEVEL"
  | "MP"
  | "RIP"
  | "DISABLED"
  | "EQUIPMENT"
  | "COOLDOWN"
  | "COOLDOWN_DOMAENE";

export interface SkillCapabilityNachweis {
  readonly skillId: string;
  readonly nutzbar: boolean;
  readonly grund: SkillNichtNutzbarGrund | null;
  readonly cooldownDomaene: string;
  readonly evidenceFingerprint: string;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

export function pruefeSkillCapability(
  definition: SkillDefinition,
  evidence: SkillLiveEvidence,
  erwarteteCharacterBindung: CharacterZielBindung,
  jetztMs: number,
  maxAlterMs: number,
): SkillCapabilityNachweis {
  for (const text of [definition.skillId, definition.cooldownDomaene, evidence.equipmentFingerprint,
    evidence.skillId, evidence.cooldownDomaene, evidence.evidenceFingerprint]) {
    pruefeText(text, "SKILL_TEXT_UNGUELTIG");
  }
  if (evidence.schemaVersion !== 1 || erwarteteCharacterBindung.schemaVersion !== 1
      || evidence.skillId !== definition.skillId
      || !Number.isSafeInteger(jetztMs)
      || !Number.isSafeInteger(maxAlterMs)
      || maxAlterMs < 1
      || maxAlterMs > 60_000) {
    throw new Error("SKILL_PARAMETER_UNGUELTIG");
  }
  const ergebnis = (nutzbar: boolean, grund: SkillNichtNutzbarGrund | null): SkillCapabilityNachweis =>
    Object.freeze({
      skillId: definition.skillId,
      nutzbar,
      grund,
      cooldownDomaene: definition.cooldownDomaene,
      evidenceFingerprint: evidence.evidenceFingerprint,
    });

  if (!Number.isSafeInteger(evidence.beobachtetAmMs)
      || evidence.beobachtetAmMs > jetztMs
      || jetztMs - evidence.beobachtetAmMs > maxAlterMs) return ergebnis(false, "STALE");
  if (evidence.character.characterId !== erwarteteCharacterBindung.characterId
      || evidence.character.sessionId !== erwarteteCharacterBindung.sessionId
      || evidence.character.serverRegion !== erwarteteCharacterBindung.serverRegion
      || evidence.character.serverIdentifier !== erwarteteCharacterBindung.serverIdentifier
      || evidence.character.rosterEpoche !== erwarteteCharacterBindung.rosterEpoche) {
    return ergebnis(false, "FALSCHE_SESSION");
  }
  if (definition.erlaubteKlassen.length > 0 && !definition.erlaubteKlassen.includes(evidence.ctype)) {
    return ergebnis(false, "FALSCHE_KLASSE");
  }
  if (evidence.level < definition.mindestLevel) return ergebnis(false, "LEVEL");
  if (evidence.mp < definition.mpKosten) return ergebnis(false, "MP");
  if (evidence.rip) return ergebnis(false, "RIP");
  if (evidence.disabled) return ergebnis(false, "DISABLED");
  if (!definition.benoetigteEquipmentTags.every(tag => evidence.equipmentTags.includes(tag))) {
    return ergebnis(false, "EQUIPMENT");
  }
  if (evidence.cooldownDomaene !== definition.cooldownDomaene) {
    return ergebnis(false, "COOLDOWN_DOMAENE");
  }
  if (jetztMs < evidence.nextReadyAmMs) return ergebnis(false, "COOLDOWN");
  return ergebnis(true, null);
}
