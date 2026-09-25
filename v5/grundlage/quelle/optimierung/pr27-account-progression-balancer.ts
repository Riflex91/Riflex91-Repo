export interface Pr27ProgressionCandidate {
  readonly candidateId: string;
  readonly characterId: string;
  readonly hardAllowed: boolean;
  readonly safetyOk: boolean;
  readonly mandatoryRole: boolean;
  readonly levelProgress: number;
  readonly gearProgress: number;
  readonly skillProgress: number;
  readonly survivalPerformance: number;
  readonly rolePerformance: number;
  readonly trainingShare: number;
  readonly baseTaskScore: number;
}

export interface Pr27ProgressionBalancerRequest {
  readonly schemaVersion: 1;
  readonly candidates: readonly Pr27ProgressionCandidate[];
  readonly targetCorridor: number;
}

export interface Pr27ProgressionRank {
  readonly candidateId: string;
  readonly characterId: string;
  readonly score: number;
  readonly weaknessBoost: number;
  readonly mandatoryRoleProtected: boolean;
}

export interface Pr27ProgressionBalancerResult {
  readonly schemaVersion: 1;
  readonly status: "AUSWAHL_BEREIT_NO_WRITE" | "KEIN_ZULAESSIGER_KANDIDAT";
  readonly selected: Pr27ProgressionRank | null;
  readonly ranking: readonly Pr27ProgressionRank[];
  readonly rejectedCandidateIds: readonly string[];
  readonly safetyVorBalance: true;
  readonly starkeCharaktereWerdenNichtGeschwaecht: true;
  readonly progressionStarvationGuard: true;
  readonly executionAuthority: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly normalRuntimeAllowed: false;
}

function text(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function unit(wert: number, fehler: string): void {
  if (!Number.isFinite(wert) || wert < 0 || wert > 1) throw new Error(fehler);
}

export function balancierePr27AccountProgression(
  anfrage: Pr27ProgressionBalancerRequest,
): Pr27ProgressionBalancerResult {
  if (anfrage.schemaVersion !== 1
      || !Number.isFinite(anfrage.targetCorridor)
      || anfrage.targetCorridor < 0
      || anfrage.targetCorridor > 1
      || anfrage.candidates.length > 128) {
    throw new Error("PR27_BALANCER_SCHEMA_ODER_POLICY_UNGUELTIG");
  }

  const seen = new Set<string>();
  const rejected: string[] = [];
  const eligible = anfrage.candidates.filter(candidate => {
    text(candidate.candidateId, "PR27_BALANCER_CANDIDATE_UNGUELTIG");
    text(candidate.characterId, "PR27_BALANCER_CHARACTER_UNGUELTIG");
    if (seen.has(candidate.candidateId)) throw new Error("PR27_BALANCER_CANDIDATE_DOPPELT");
    seen.add(candidate.candidateId);
    for (const [value, fehler] of [
      [candidate.levelProgress, "PR27_BALANCER_LEVEL_UNGUELTIG"],
      [candidate.gearProgress, "PR27_BALANCER_GEAR_UNGUELTIG"],
      [candidate.skillProgress, "PR27_BALANCER_SKILL_UNGUELTIG"],
      [candidate.survivalPerformance, "PR27_BALANCER_SURVIVAL_UNGUELTIG"],
      [candidate.rolePerformance, "PR27_BALANCER_ROLE_UNGUELTIG"],
      [candidate.trainingShare, "PR27_BALANCER_TRAINING_UNGUELTIG"],
    ] as const) unit(value, fehler);
    if (!Number.isFinite(candidate.baseTaskScore)) {
      throw new Error("PR27_BALANCER_BASE_SCORE_UNGUELTIG");
    }
    if (!candidate.hardAllowed || !candidate.safetyOk) {
      rejected.push(candidate.candidateId);
      return false;
    }
    return true;
  });

  const strengths = eligible.map(candidate =>
    (candidate.levelProgress
      + candidate.gearProgress
      + candidate.skillProgress
      + candidate.survivalPerformance
      + candidate.rolePerformance) / 5);
  const strongest = strengths.length > 0 ? Math.max(...strengths) : 0;

  const ranking: Pr27ProgressionRank[] = eligible.map((candidate, index) => {
    const strength = strengths[index] ?? 0;
    const gap = Math.max(0, strongest - strength - anfrage.targetCorridor);
    const trainingDeficit = Math.max(0, 1 - candidate.trainingShare);
    const weaknessBoost = candidate.mandatoryRole
      ? 0
      : Math.min(1, gap * 0.7 + trainingDeficit * 0.3);
    const mandatoryBonus = candidate.mandatoryRole ? 1_000_000 : 0;
    const score = mandatoryBonus + candidate.baseTaskScore * 1_000 + weaknessBoost * 100;
    return Object.freeze({
      candidateId: candidate.candidateId,
      characterId: candidate.characterId,
      score,
      weaknessBoost,
      mandatoryRoleProtected: candidate.mandatoryRole,
    });
  });

  ranking.sort((a, b) =>
    b.score - a.score
    || a.characterId.localeCompare(b.characterId)
    || a.candidateId.localeCompare(b.candidateId));

  return Object.freeze({
    schemaVersion: 1,
    status: ranking.length > 0 ? "AUSWAHL_BEREIT_NO_WRITE" : "KEIN_ZULAESSIGER_KANDIDAT",
    selected: ranking[0] ?? null,
    ranking: Object.freeze(ranking),
    rejectedCandidateIds: Object.freeze(rejected.sort()),
    safetyVorBalance: true,
    starkeCharaktereWerdenNichtGeschwaecht: true,
    progressionStarvationGuard: true,
    executionAuthority: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    normalRuntimeAllowed: false,
  });
}
