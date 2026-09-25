export type Pr24_25FaultArt =
  | "TANK_TOT"
  | "HEAL_TOT"
  | "DPS_TOT"
  | "DISCONNECT"
  | "REJOIN"
  | "MP_MANGEL"
  | "SHARED_COOLDOWN"
  | "EQUIPMENT_DRIFT"
  | "CAPABILITY_VERLUST"
  | "AGGRO_WECHSEL"
  | "CC_IMMUNITY"
  | "MEMBER_FEHLT"
  | "FREMDES_PARTY_MITGLIED"
  | "ROSTER_SESSION_DRIFT"
  | "MAP_INSTANZ_DRIFT"
  | "LEADER_MOVEMENT_DRIFT"
  | "RESTART";

export interface Pr24_25MatrixFall {
  readonly caseId: string;
  readonly topologyId: string;
  readonly requiredCapabilities: readonly string[];
  readonly faults: readonly Pr24_25FaultArt[];
}

export interface Pr25EvidenceMessung {
  readonly segmentId: string;
  readonly art: "CAPABILITY_5M" | "INTEGRATION_15M";
  readonly dauerSekunden: number;
  readonly unerwarteteGameplayWrites: number;
  readonly duplicateIrreversibleEffects: number;
  readonly safetyViolations: number;
  readonly staleTargetActions: number;
  readonly movementThrashEvents: number;
  readonly unresolvedRecoveryCount: number;
  readonly deaths: number;
  readonly disconnectRejoinFailures: number;
  readonly killrate: number;
  readonly xpProMinute: number;
}

export interface Pr25EvidenceAuswertung {
  readonly schemaVersion: 1;
  readonly status: "BESTANDEN" | "BLOCKIERT";
  readonly blocker: readonly string[];
  readonly capabilitySegmente: number;
  readonly integrationsSegmente: number;
  readonly gesamteDauerSekunden: number;
  readonly liveEvidenceRatified: false;
  readonly productiveAuthority: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
}

const TOPOLOGIEN = Object.freeze([
  ["solo", ["SINGLE_TARGET"]],
  ["two-farmer", ["SINGLE_TARGET"]],
  ["three-farmer", ["SINGLE_TARGET"]],
  ["tank-heal", ["TANK","HEAL"]],
  ["tank-dps", ["TANK","SINGLE_TARGET"]],
  ["tank-aoe", ["TANK","AOE"]],
  ["heal-dps", ["HEAL","SINGLE_TARGET"]],
  ["tank-heal-single", ["TANK","HEAL","SINGLE_TARGET"]],
  ["tank-heal-aoe", ["TANK","HEAL","AOE"]],
  ["multi-dps", ["SINGLE_TARGET"]],
  ["duplicate-classes", ["SINGLE_TARGET"]],
  ["without-tank", ["SINGLE_TARGET"]],
  ["without-heal", ["SINGLE_TARGET"]],
  ["without-aoe", ["SINGLE_TARGET"]],
] as const);

const FAULTS: readonly Pr24_25FaultArt[] = Object.freeze([
  "TANK_TOT",
  "HEAL_TOT",
  "DPS_TOT",
  "DISCONNECT",
  "REJOIN",
  "MP_MANGEL",
  "SHARED_COOLDOWN",
  "EQUIPMENT_DRIFT",
  "CAPABILITY_VERLUST",
  "AGGRO_WECHSEL",
  "CC_IMMUNITY",
  "MEMBER_FEHLT",
  "FREMDES_PARTY_MITGLIED",
  "ROSTER_SESSION_DRIFT",
  "MAP_INSTANZ_DRIFT",
  "LEADER_MOVEMENT_DRIFT",
  "RESTART",
]);

export function bauePr24PflichtMatrix(): readonly Pr24_25MatrixFall[] {
  return Object.freeze(TOPOLOGIEN.map(([topologyId, capabilities]) => Object.freeze({
    caseId: "pr24:" + topologyId,
    topologyId,
    requiredCapabilities: Object.freeze([...capabilities]),
    faults: FAULTS,
  })));
}

function zaehler(wert: number, fehler: string): void {
  if (!Number.isFinite(wert) || wert < 0) throw new Error(fehler);
}

export function wertePr25GruppenEvidenceAus(
  messungen: readonly Pr25EvidenceMessung[],
): Pr25EvidenceAuswertung {
  if (messungen.length < 1 || messungen.length > 256) {
    throw new Error("PR25_EVIDENCE_MESSUNGEN_UNGUELTIG");
  }
  const ids = new Set<string>();
  const blocker: string[] = [];
  let capabilitySegmente = 0;
  let integrationsSegmente = 0;
  let gesamteDauerSekunden = 0;

  for (const row of messungen) {
    if (row.segmentId.trim().length === 0 || row.segmentId.length > 192) {
      throw new Error("PR25_EVIDENCE_SEGMENT_ID_UNGUELTIG");
    }
    if (ids.has(row.segmentId)) throw new Error("PR25_EVIDENCE_SEGMENT_DOPPELT");
    ids.add(row.segmentId);
    for (const value of [
      row.dauerSekunden,
      row.unerwarteteGameplayWrites,
      row.duplicateIrreversibleEffects,
      row.safetyViolations,
      row.staleTargetActions,
      row.movementThrashEvents,
      row.unresolvedRecoveryCount,
      row.deaths,
      row.disconnectRejoinFailures,
      row.killrate,
      row.xpProMinute,
    ]) zaehler(value, "PR25_EVIDENCE_METRIK_UNGUELTIG");

    gesamteDauerSekunden += row.dauerSekunden;
    if (row.art === "CAPABILITY_5M") {
      capabilitySegmente += 1;
      if (row.dauerSekunden < 300) blocker.push("PR25_CAPABILITY_DAUER_ZU_KURZ:" + row.segmentId);
    } else {
      integrationsSegmente += 1;
      if (row.dauerSekunden < 900) blocker.push("PR25_INTEGRATION_DAUER_ZU_KURZ:" + row.segmentId);
    }
    if (row.unerwarteteGameplayWrites > 0) blocker.push("PR25_UNERWARTETER_WRITE:" + row.segmentId);
    if (row.duplicateIrreversibleEffects > 0) blocker.push("PR25_DUPLICATE_EFFECT:" + row.segmentId);
    if (row.safetyViolations > 0) blocker.push("PR25_SAFETY_VIOLATION:" + row.segmentId);
    if (row.staleTargetActions > 0) blocker.push("PR25_STALE_TARGET_ACTION:" + row.segmentId);
    if (row.movementThrashEvents > 0) blocker.push("PR25_MOVEMENT_THRASH:" + row.segmentId);
    if (row.unresolvedRecoveryCount > 0) blocker.push("PR25_UNRESOLVED_RECOVERY:" + row.segmentId);
    if (row.disconnectRejoinFailures > 0) blocker.push("PR25_REJOIN_FAILURE:" + row.segmentId);
  }

  if (integrationsSegmente < 1) blocker.push("PR25_INTEGRATION_SEGMENT_FEHLT");

  return Object.freeze({
    schemaVersion: 1,
    status: blocker.length === 0 ? "BESTANDEN" : "BLOCKIERT",
    blocker: Object.freeze(blocker),
    capabilitySegmente,
    integrationsSegmente,
    gesamteDauerSekunden,
    liveEvidenceRatified: false,
    productiveAuthority: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
  });
}
