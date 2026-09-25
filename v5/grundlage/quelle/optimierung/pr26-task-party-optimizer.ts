export interface Pr26TaskPartyCandidate {
  readonly candidateId: string;
  readonly taskId: string;
  readonly partyId: string;
  readonly hardAllowed: boolean;
  readonly safetyOk: boolean;
  readonly worldEvidenceFresh: boolean;
  readonly requiredCapabilities: readonly string[];
  readonly availableCapabilities: readonly string[];
  readonly successScore: number;
  readonly realPerformanceScore: number;
  readonly travelCost: number;
  readonly resourceCost: number;
  readonly learningScore: number;
  readonly deterministicPriority: number;
}

export interface Pr26TaskPartyOptimizerRequest {
  readonly schemaVersion: 1;
  readonly candidates: readonly Pr26TaskPartyCandidate[];
}

export interface Pr26TaskPartyRank {
  readonly candidateId: string;
  readonly taskId: string;
  readonly partyId: string;
  readonly score: number;
  readonly learningContribution: number;
}

export interface Pr26TaskPartyOptimizerResult {
  readonly schemaVersion: 1;
  readonly status: "AUSWAHL_BEREIT_NO_WRITE" | "KEIN_ZULAESSIGER_KANDIDAT";
  readonly selected: Pr26TaskPartyRank | null;
  readonly ranking: readonly Pr26TaskPartyRank[];
  readonly rejectedCandidateIds: readonly string[];
  readonly learningKannHardFilterNichtLockern: true;
  readonly deterministicFallbackVorhanden: true;
  readonly executionAuthority: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly normalRuntimeAllowed: false;
}

function text(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function finite(wert: number, fehler: string): void {
  if (!Number.isFinite(wert)) throw new Error(fehler);
}

function capabilitySet(values: readonly string[]): Set<string> {
  const out = new Set<string>();
  for (const value of values) {
    text(value, "PR26_OPTIMIZER_CAPABILITY_UNGUELTIG");
    out.add(value);
  }
  return out;
}

export function optimierePr26TaskParty(
  anfrage: Pr26TaskPartyOptimizerRequest,
): Pr26TaskPartyOptimizerResult {
  if (anfrage.schemaVersion !== 1 || anfrage.candidates.length > 512) {
    throw new Error("PR26_OPTIMIZER_SCHEMA_ODER_LIMIT_UNGUELTIG");
  }

  const seen = new Set<string>();
  const rejected: string[] = [];
  const ranking: Pr26TaskPartyRank[] = [];

  for (const candidate of anfrage.candidates) {
    for (const value of [candidate.candidateId, candidate.taskId, candidate.partyId]) {
      text(value, "PR26_OPTIMIZER_TEXT_UNGUELTIG");
    }
    if (seen.has(candidate.candidateId)) throw new Error("PR26_OPTIMIZER_KANDIDAT_DOPPELT");
    seen.add(candidate.candidateId);
    for (const [value, fehler] of [
      [candidate.successScore, "PR26_OPTIMIZER_SUCCESS_SCORE_UNGUELTIG"],
      [candidate.realPerformanceScore, "PR26_OPTIMIZER_PERFORMANCE_SCORE_UNGUELTIG"],
      [candidate.travelCost, "PR26_OPTIMIZER_TRAVEL_COST_UNGUELTIG"],
      [candidate.resourceCost, "PR26_OPTIMIZER_RESOURCE_COST_UNGUELTIG"],
      [candidate.learningScore, "PR26_OPTIMIZER_LEARNING_SCORE_UNGUELTIG"],
      [candidate.deterministicPriority, "PR26_OPTIMIZER_PRIORITY_UNGUELTIG"],
    ] as const) finite(value, fehler);

    const available = capabilitySet(candidate.availableCapabilities);
    const required = capabilitySet(candidate.requiredCapabilities);
    const capabilitiesOk = [...required].every(capability => available.has(capability));
    const hardOk = candidate.hardAllowed
      && candidate.safetyOk
      && candidate.worldEvidenceFresh
      && capabilitiesOk;

    if (!hardOk) {
      rejected.push(candidate.candidateId);
      continue;
    }

    const learningContribution = Math.max(-100, Math.min(100, candidate.learningScore));
    const score =
      candidate.deterministicPriority * 1_000_000
      + candidate.successScore * 10_000
      + candidate.realPerformanceScore * 1_000
      - candidate.travelCost * 10
      - candidate.resourceCost
      + learningContribution;

    ranking.push(Object.freeze({
      candidateId: candidate.candidateId,
      taskId: candidate.taskId,
      partyId: candidate.partyId,
      score,
      learningContribution,
    }));
  }

  ranking.sort((a, b) =>
    b.score - a.score
    || a.taskId.localeCompare(b.taskId)
    || a.partyId.localeCompare(b.partyId)
    || a.candidateId.localeCompare(b.candidateId));

  return Object.freeze({
    schemaVersion: 1,
    status: ranking.length > 0 ? "AUSWAHL_BEREIT_NO_WRITE" : "KEIN_ZULAESSIGER_KANDIDAT",
    selected: ranking[0] ?? null,
    ranking: Object.freeze(ranking),
    rejectedCandidateIds: Object.freeze(rejected.sort()),
    learningKannHardFilterNichtLockern: true,
    deterministicFallbackVorhanden: true,
    executionAuthority: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    normalRuntimeAllowed: false,
  });
}
