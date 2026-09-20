import fs from "node:fs";

const fehler = [];
const liesText = pfad => fs.readFileSync(pfad, "utf8");

const pflicht = [
  "grundlage/quelle/navigation/reise-arrival.ts",
  "grundlage/quelle/navigation/motion-freshness.ts",
  "grundlage/quelle/navigation/bewegungs-owner.ts",
  "grundlage/quelle/kampf/target-ownership.ts",
  "grundlage/quelle/kampf/skill-capability.ts",
  "grundlage/quelle/faehigkeiten/skill-capability.ts",
  "grundlage/quelle/kampf/character-lifecycle.ts",
  "grundlage/quelle/kampf/threat-cc.ts",
  "grundlage/quelle/kampf/aoe-safety.ts",
  "grundlage/quelle/kampf/encounter-ledger.ts",
  "grundlage/quelle/gruppe/party-wahrheit.ts",
  "grundlage/quelle/gruppe/group-capabilities.ts",
  "grundlage/quelle/farmer/farmer-fsm.ts",
  "grundlage/tests/r16-arrival-motion.test.mjs",
  "grundlage/tests/r16-ownership-movement.test.mjs",
  "grundlage/tests/r16-party-skill-lifecycle.test.mjs",
  "grundlage/tests/r16-combat-farmer.test.mjs",
  "dokumentation/P1B-PARTY-COMBAT-NAVIGATION.md",
];
for (const pfad of pflicht) {
  if (!fs.existsSync(pfad)) fehler.push("PFLICHTARTEFAKT_FEHLT:" + pfad);
}

const arrival = liesText("grundlage/quelle/navigation/reise-arrival.ts");
for (const marker of [
  "ARRIVAL_AUSSTEHEND",
  "movementReturnIstArrivalBeweis: false",
  "verifiziereArrival",
  "RECOVERY_PENDING",
  "schliesseRestartAbgleichAlsNeuZuPlanen",
]) {
  if (!arrival.includes(marker)) fehler.push("ARRIVAL_MARKER_FEHLT:" + marker);
}

const motion = liesText("grundlage/quelle/navigation/motion-freshness.ts");
for (const marker of [
  "pinneBewegungsZiel",
  "validiereBewegungsZielFrische",
  "entityFingerprint",
  "maxVorhersageFehler",
  "MOTION_ZIEL_ZU_STARK_GEDRIFTET",
  "MOTION_EVIDENCE_STALE",
]) {
  if (!motion.includes(marker)) fehler.push("MOTION_MARKER_FEHLT:" + marker);
}

const target = liesText("grundlage/quelle/kampf/target-ownership.ts");
for (const marker of [
  "TargetOwnershipLedger",
  "rawTargetIstAuthority: false",
  "TARGET_BEREITS_FACHLICH_BELEGT",
  "maxEvidenceAlterMs",
  "RECOVERY_PENDING",
]) {
  if (!target.includes(marker)) fehler.push("TARGET_MARKER_FEHLT:" + marker);
}

const movement = liesText("grundlage/quelle/navigation/bewegungs-owner.ts");
for (const marker of [
  "BewegungsOwnerLedger",
  "BEWEGUNGS_HANDOFF_SPERRFRIST",
  "SAFETY",
  "RECOVERY_PENDING",
]) {
  if (!movement.includes(marker)) fehler.push("MOVEMENT_OWNER_MARKER_FEHLT:" + marker);
}

const party = liesText("grundlage/quelle/gruppe/party-wahrheit.ts");
for (const marker of [
  "pinnePartyWahrheit",
  "partyObjektIstLanglebigeAuthority: false",
  "gueltigBisMs",
  "zielBindung",
]) {
  if (!party.includes(marker)) fehler.push("PARTY_MARKER_FEHLT:" + marker);
}

const skill = liesText("grundlage/quelle/faehigkeiten/skill-capability.ts");
for (const marker of [
  "pruefeSkillCapability",
  "cooldownDomaene",
  "nextReadyAmMs",
  "FALSCHE_SESSION",
  "COOLDOWN_DOMAENE",
]) {
  if (!skill.includes(marker)) fehler.push("SKILL_MARKER_FEHLT:" + marker);
}

const lifecycle = liesText("grundlage/quelle/kampf/character-lifecycle.ts");
for (const marker of [
  "CharacterLifecycleLedger",
  "RESPAWN_AUSSTEHEND",
  "REJOIN_AUSSTEHEND",
  "RECOVERY_PENDING",
  "normaleCombatMovementAuthority",
]) {
  if (!lifecycle.includes(marker)) fehler.push("LIFECYCLE_MARKER_FEHLT:" + marker);
}

const aoe = liesText("grundlage/quelle/kampf/aoe-safety.ts");
for (const marker of [
  "pruefeAoeSafety",
  "learningKannHardCapsNichtLockern: true",
  "STALE_TARGET",
  "DPS_CAP",
]) {
  if (!aoe.includes(marker)) fehler.push("AOE_MARKER_FEHLT:" + marker);
}

const encounter = liesText("grundlage/quelle/kampf/encounter-ledger.ts");
for (const marker of [
  "EncounterLedger",
  "outcomeGenauEinmal: true",
  "ENCOUNTER_OUTCOME_WIDERSPRUCH",
  "RECOVERY_PENDING",
]) {
  if (!encounter.includes(marker)) fehler.push("ENCOUNTER_MARKER_FEHLT:" + marker);
}

const farmer = liesText("grundlage/quelle/farmer/farmer-fsm.ts");
for (const marker of [
  "FarmerFsm",
  "FAILED_SAFE",
  "maxConsecutiveBlocked",
  "gameplayAutoritaet: false",
  "rawWriteAutoritaet: false",
]) {
  if (!farmer.includes(marker)) fehler.push("FARMER_MARKER_FEHLT:" + marker);
}

const p1b = liesText("dokumentation/P1B-PARTY-COMBAT-NAVIGATION.md");
if (!p1b.includes("**Status:** GESCHLOSSEN")) fehler.push("P1B_NICHT_GESCHLOSSEN");

const rawMuster = [
  /\battack\s*\(/,
  /\bsmart_move\s*\(/,
  /\bxmove\s*\(/,
  /\bmove\s*\(/,
  /\buse_skill\s*\(/,
  /\brespawn\s*\(/,
  /\bchange_target\s*\(/,
  /\bsend_cm\s*\(/,
  /\bsend_gold\s*\(/,
  /\bsend_item\s*\(/,
  /\.emit\s*\(/,
];

const r16Quellen = pflicht.filter(p => p.startsWith("grundlage/quelle/"));
for (const pfad of r16Quellen) {
  const text = liesText(pfad);
  if (rawMuster.some(muster => muster.test(text))) {
    fehler.push("R16_CORE_RAW_GAME_WRITE_VERBOTEN:" + pfad);
  }
}

if (fehler.length > 0) {
  console.error("[V5-R16-GUARD] FEHLER\n" + fehler.join("\n"));
  process.exit(1);
}
console.log("[V5-R16-GUARD] OK / Party Combat Farming Navigation bleibt no-write foundation");
