function text(value, label = "TEXT") {
  const out = typeof value === "string" ? value.trim() : "";
  if (!out || out.length > 192) throw new Error("LIVE_AUTONOMY_" + label + "_INVALID");
  return out;
}

function finite(value, label = "NUMBER") {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error("LIVE_AUTONOMY_" + label + "_INVALID");
  return n;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function clamp01(value) {
  return clamp(finite(value), 0, 1);
}

function unique(values) {
  return [...new Set(values)];
}

function capabilitySet(values) {
  const out = new Set();
  for (const value of Array.isArray(values) ? values : []) {
    out.add(text(String(value), "CAPABILITY"));
  }
  return out;
}

export function optimizeTaskParty(candidates = []) {
  if (!Array.isArray(candidates) || candidates.length > 512) {
    throw new Error("LIVE_PR26_CANDIDATE_LIMIT_INVALID");
  }
  const seen = new Set();
  const ranking = [];
  const rejectedCandidateIds = [];

  for (const candidate of candidates) {
    const candidateId = text(candidate.candidateId, "PR26_CANDIDATE_ID");
    const taskId = text(candidate.taskId, "PR26_TASK_ID");
    const partyId = text(candidate.partyId, "PR26_PARTY_ID");
    if (seen.has(candidateId)) throw new Error("LIVE_PR26_CANDIDATE_DUPLICATE");
    seen.add(candidateId);

    const available = capabilitySet(candidate.availableCapabilities);
    const required = capabilitySet(candidate.requiredCapabilities);
    const capabilitiesOk = [...required].every((capability) => available.has(capability));
    const hardOk =
      candidate.hardAllowed === true
      && candidate.safetyOk === true
      && candidate.worldEvidenceFresh === true
      && capabilitiesOk;

    if (!hardOk) {
      rejectedCandidateIds.push(candidateId);
      continue;
    }

    const successScore = finite(candidate.successScore, "PR26_SUCCESS_SCORE");
    const realPerformanceScore = finite(candidate.realPerformanceScore, "PR26_PERFORMANCE_SCORE");
    const travelCost = finite(candidate.travelCost, "PR26_TRAVEL_COST");
    const resourceCost = finite(candidate.resourceCost, "PR26_RESOURCE_COST");
    const learningContribution = clamp(finite(candidate.learningScore, "PR26_LEARNING_SCORE"), -100, 100);
    const deterministicPriority = finite(candidate.deterministicPriority, "PR26_PRIORITY");

    const score =
      deterministicPriority * 1_000_000
      + successScore * 10_000
      + realPerformanceScore * 1_000
      - travelCost * 10
      - resourceCost
      + learningContribution;

    ranking.push(Object.freeze({
      candidateId,
      taskId,
      partyId,
      score,
      learningContribution,
      hardFilterPassed: true,
      payload: candidate.payload ?? null,
    }));
  }

  ranking.sort((a, b) =>
    b.score - a.score
    || a.taskId.localeCompare(b.taskId)
    || a.partyId.localeCompare(b.partyId)
    || a.candidateId.localeCompare(b.candidateId)
  );

  return Object.freeze({
    schemaVersion: 1,
    status: ranking.length > 0 ? "LIVE_SELECTION_READY" : "NO_ALLOWED_CANDIDATE",
    selected: ranking[0] ?? null,
    ranking: Object.freeze(ranking),
    rejectedCandidateIds: Object.freeze(rejectedCandidateIds.sort()),
    learningCanRelaxHardFilter: false,
    deterministicFallbackPresent: true,
    executionAuthority: ranking.length > 0,
    gameplayAuthority: ranking.length > 0,
    normalRuntimeAllowed: ranking.length > 0,
    rawWriteAuthority: false,
  });
}

export function balanceAccountProgression({
  candidates = [],
  targetCorridor = 0.08,
} = {}) {
  if (!Array.isArray(candidates) || candidates.length > 128) {
    throw new Error("LIVE_PR27_CANDIDATE_LIMIT_INVALID");
  }
  const corridor = clamp01(targetCorridor);
  const seen = new Set();
  const rejectedCandidateIds = [];
  const eligible = [];

  for (const candidate of candidates) {
    const candidateId = text(candidate.candidateId, "PR27_CANDIDATE_ID");
    const characterId = text(candidate.characterId, "PR27_CHARACTER_ID");
    if (seen.has(candidateId)) throw new Error("LIVE_PR27_CANDIDATE_DUPLICATE");
    seen.add(candidateId);

    const normalized = Object.freeze({
      candidateId,
      characterId,
      hardAllowed: candidate.hardAllowed === true,
      safetyOk: candidate.safetyOk === true,
      mandatoryRole: candidate.mandatoryRole === true,
      levelProgress: clamp01(candidate.levelProgress),
      gearProgress: clamp01(candidate.gearProgress),
      skillProgress: clamp01(candidate.skillProgress),
      survivalPerformance: clamp01(candidate.survivalPerformance),
      rolePerformance: clamp01(candidate.rolePerformance),
      trainingShare: clamp01(candidate.trainingShare),
      baseTaskScore: finite(candidate.baseTaskScore, "PR27_BASE_TASK_SCORE"),
      payload: candidate.payload ?? null,
    });

    if (!normalized.hardAllowed || !normalized.safetyOk) {
      rejectedCandidateIds.push(candidateId);
      continue;
    }
    eligible.push(normalized);
  }

  const strengths = eligible.map((candidate) =>
    (
      candidate.levelProgress
      + candidate.gearProgress
      + candidate.skillProgress
      + candidate.survivalPerformance
      + candidate.rolePerformance
    ) / 5
  );
  const strongest = strengths.length > 0 ? Math.max(...strengths) : 0;

  const ranking = eligible.map((candidate, index) => {
    const strength = strengths[index] ?? 0;
    const gap = Math.max(0, strongest - strength - corridor);
    const trainingDeficit = Math.max(0, 1 - candidate.trainingShare);
    const weaknessBoost = candidate.mandatoryRole
      ? 0
      : Math.min(1, gap * 0.7 + trainingDeficit * 0.3);
    const mandatoryBonus = candidate.mandatoryRole ? 1_000_000 : 0;
    const score =
      mandatoryBonus
      + candidate.baseTaskScore * 1_000
      + weaknessBoost * 100;

    return Object.freeze({
      candidateId: candidate.candidateId,
      characterId: candidate.characterId,
      score,
      weaknessBoost,
      mandatoryRoleProtected: candidate.mandatoryRole,
      strength,
      trainingShare: candidate.trainingShare,
      payload: candidate.payload,
    });
  });

  ranking.sort((a, b) =>
    b.score - a.score
    || a.characterId.localeCompare(b.characterId)
    || a.candidateId.localeCompare(b.candidateId)
  );

  return Object.freeze({
    schemaVersion: 1,
    status: ranking.length > 0 ? "LIVE_SELECTION_READY" : "NO_ALLOWED_CANDIDATE",
    selected: ranking[0] ?? null,
    ranking: Object.freeze(ranking),
    rejectedCandidateIds: Object.freeze(rejectedCandidateIds.sort()),
    safetyBeforeBalance: true,
    strongCharactersAreNotWeakened: true,
    progressionStarvationGuard: true,
    executionAuthority: ranking.length > 0,
    gameplayAuthority: ranking.length > 0,
    normalRuntimeAllowed: ranking.length > 0,
    rawWriteAuthority: false,
  });
}

function canonical(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  const keys = Object.keys(value).sort();
  return "{" + keys.map((key) => JSON.stringify(key) + ":" + canonical(value[key])).join(",") + "}";
}

function simpleFingerprint(value) {
  const source = canonical(value);
  let hash = 2166136261;
  for (let i = 0; i < source.length; i += 1) {
    hash ^= source.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return "fp-" + (hash >>> 0).toString(16).padStart(8, "0");
}

function normalizeWorldObservation({
  art,
  stateId,
  serverRegion,
  serverIdentifier,
  mapId,
  characterId = null,
  active,
  semanticVersion = 1,
  observedAtMs,
  validUntilMs,
  payload = {},
  known = true,
  quarantined = false,
} = {}) {
  const normalizedArt = text(art, "WORLD_ART");
  if (!["EVENT", "QUEST", "RARE_BOSS", "SERVER_HOP", "DISCOVERY"].includes(normalizedArt)) {
    throw new Error("LIVE_PR28_WORLD_ART_INVALID");
  }
  const observed = finite(observedAtMs, "WORLD_OBSERVED_AT");
  const validUntil = finite(validUntilMs, "WORLD_VALID_UNTIL");
  if (validUntil < observed) throw new Error("LIVE_PR28_WORLD_TTL_INVALID");
  const live = Object.freeze({
    art: normalizedArt,
    stateId: text(stateId, "WORLD_STATE_ID"),
    serverRegion: text(serverRegion, "WORLD_REGION"),
    serverIdentifier: text(serverIdentifier, "WORLD_SERVER"),
    mapId: text(mapId || "unknown", "WORLD_MAP"),
    characterId: characterId == null ? null : text(characterId, "WORLD_CHARACTER"),
    active: active === true,
    semanticVersion: Math.max(1, Math.floor(finite(semanticVersion, "WORLD_SEMANTIC_VERSION"))),
    observedAtMs: observed,
    validUntilMs: validUntil,
    known: known === true,
    quarantined: quarantined === true,
    payload: Object.freeze({ ...payload }),
  });
  return Object.freeze({
    ...live,
    fingerprint: simpleFingerprint({
      art: live.art,
      stateId: live.stateId,
      serverRegion: live.serverRegion,
      serverIdentifier: live.serverIdentifier,
      mapId: live.mapId,
      characterId: live.characterId,
      active: live.active,
      semanticVersion: live.semanticVersion,
      payload: live.payload,
    }),
  });
}

function worldDrift(pin, current, nowMs) {
  if (!current
      || current.art !== pin.art
      || current.stateId !== pin.stateId) {
    return Object.freeze({
      status: "BLOCKED_UNKNOWN",
      actionAllowed: false,
    });
  }
  if (nowMs < current.observedAtMs || nowMs > current.validUntilMs) {
    return Object.freeze({
      status: "BLOCKED_STALE",
      actionAllowed: false,
    });
  }
  if (!current.known || current.quarantined) {
    return Object.freeze({
      status: "BLOCKED_UNKNOWN",
      actionAllowed: false,
    });
  }
  const sameBinding =
    current.serverRegion === pin.serverRegion
    && current.serverIdentifier === pin.serverIdentifier
    && current.mapId === pin.mapId
    && current.characterId === pin.characterId;
  const sameState =
    current.semanticVersion === pin.semanticVersion
    && current.fingerprint === pin.fingerprint
    && current.active === pin.active;
  if (!sameBinding || !sameState || !current.active) {
    return Object.freeze({
      status: "REPLAN_REQUIRED",
      actionAllowed: false,
    });
  }
  return Object.freeze({
    status: "VALID",
    actionAllowed: true,
  });
}

export class WorldAutonomyRuntime {
  #observations = new Map();
  #plans = new Map();
  #quarantine = new Map();
  #serverHopHistory = new Map();
  #maxObservations;
  #maxPlans;

  constructor({
    maxObservations = 512,
    maxPlans = 256,
  } = {}) {
    this.#maxObservations = Math.max(32, Math.min(4096, Math.floor(maxObservations)));
    this.#maxPlans = Math.max(16, Math.min(1024, Math.floor(maxPlans)));
  }

  observe(input) {
    const observation = normalizeWorldObservation(input);
    const key = observation.art + ":" + observation.stateId;
    if (!observation.known || observation.quarantined) {
      this.#quarantine.set(key, Object.freeze({
        key,
        observedAtMs: observation.observedAtMs,
        reason: !observation.known ? "UNKNOWN_CONTENT" : "CONTENT_QUARANTINED",
        observation,
      }));
    }
    this.#observations.set(key, observation);
    while (this.#observations.size > this.#maxObservations) {
      const oldest = this.#observations.keys().next().value;
      this.#observations.delete(oldest);
    }
    return observation;
  }

  getObservation(art, stateId) {
    return this.#observations.get(text(art, "WORLD_ART") + ":" + text(stateId, "WORLD_STATE_ID")) ?? null;
  }

  quarantineSnapshot() {
    return Object.freeze([...this.#quarantine.values()]);
  }

  plan({
    planId,
    art,
    stateId,
    nowMs = Date.now(),
    optimizerCandidateAllowed = true,
    restartReconciled = true,
    serverHopPolicy = null,
  } = {}) {
    const id = text(planId, "WORLD_PLAN_ID");
    if (this.#plans.has(id)) throw new Error("LIVE_PR28_WORLD_PLAN_DUPLICATE");
    if (this.#plans.size >= this.#maxPlans) throw new Error("LIVE_PR28_WORLD_PLAN_LIMIT");
    const observation = this.getObservation(art, stateId);
    const blocker = [];

    if (!optimizerCandidateAllowed) blocker.push("PR28_OPTIMIZER_CANDIDATE_NOT_ALLOWED");
    if (!observation) blocker.push("PR28_OBSERVATION_MISSING");
    if (!restartReconciled) blocker.push("PR28_RESTART_NOT_RECONCILED");
    if (observation && (nowMs < observation.observedAtMs || nowMs > observation.validUntilMs)) {
      blocker.push("PR28_LIVE_EVIDENCE_STALE");
    }
    if (observation && art !== "DISCOVERY" && !observation.known) {
      blocker.push("PR28_CONTENT_UNKNOWN");
    }
    if (observation && art !== "DISCOVERY" && observation.quarantined) {
      blocker.push("PR28_CONTENT_QUARANTINED");
    }

    if (art === "RARE_BOSS" && observation?.active !== true) {
      blocker.push("PR28_RARE_BOSS_TARGET_STALE");
    }

    if (art === "SERVER_HOP") {
      const policy = serverHopPolicy || {};
      if (policy.serverHopAllowed !== true) blocker.push("PR28_SERVER_HOP_POLICY_BLOCKED");
      if (policy.targetServerModeKnown !== true) blocker.push("PR28_SERVER_MODE_UNKNOWN");
      if (policy.pvpHardcorePolicyAllowsTarget !== true) blocker.push("PR28_SERVER_POLICY_BLOCKED");
      if (policy.serverHopEvidenceFresh !== true) blocker.push("PR28_SERVER_HOP_EVIDENCE_STALE");
      if (policy.targetRegion === policy.currentRegion
          && policy.targetIdentifier === policy.currentIdentifier) {
        blocker.push("PR28_SERVER_HOP_SAME_SERVER");
      }
      const targetKey = String(policy.targetRegion || "") + ":" + String(policy.targetIdentifier || "");
      const lastHop = this.#serverHopHistory.get(targetKey) ?? 0;
      const cooldownMs = Math.max(0, Number(policy.cooldownMs || 0));
      if (cooldownMs > 0 && nowMs - lastHop < cooldownMs) {
        blocker.push("PR28_SERVER_HOP_COOLDOWN");
      }
    }

    const plan = Object.freeze({
      schemaVersion: 1,
      planId: id,
      art,
      stateId,
      status: blocker.length === 0 ? "PLANNED" : "BLOCKED",
      blocker: Object.freeze(blocker),
      pin: observation ? Object.freeze({ ...observation }) : null,
      lastValidation: null,
      actionAuthority: false,
      worldActionAuthority: false,
      serverHopAuthority: false,
      gameplayAuthority: false,
      rawWriteAuthority: false,
      normalRuntimeAllowed: false,
      serverHopPolicy: serverHopPolicy ? Object.freeze({ ...serverHopPolicy }) : null,
    });
    this.#plans.set(id, plan);
    return plan;
  }

  revalidate(planId, {
    nowMs = Date.now(),
    currentObservation = null,
  } = {}) {
    const id = text(planId, "WORLD_PLAN_ID");
    const plan = this.#plans.get(id);
    if (!plan) throw new Error("LIVE_PR28_WORLD_PLAN_UNKNOWN");
    if (plan.status === "COMPLETED") throw new Error("LIVE_PR28_WORLD_PLAN_COMPLETED");
    if (!plan.pin) return plan;

    const current = currentObservation
      ? normalizeWorldObservation(currentObservation)
      : this.getObservation(plan.art, plan.stateId);
    const validation = worldDrift(plan.pin, current, nowMs);
    const ready = validation.actionAllowed === true;

    const next = Object.freeze({
      ...plan,
      status: ready ? "ACTION_READY" : "BLOCKED",
      lastValidation: validation,
      actionAuthority: ready,
      worldActionAuthority: ready,
      serverHopAuthority: ready && plan.art === "SERVER_HOP",
      gameplayAuthority: ready,
      rawWriteAuthority: false,
      normalRuntimeAllowed: ready,
    });
    this.#plans.set(id, next);
    return next;
  }

  complete(planId, {
    nowMs = Date.now(),
  } = {}) {
    const id = text(planId, "WORLD_PLAN_ID");
    const plan = this.#plans.get(id);
    if (!plan) throw new Error("LIVE_PR28_WORLD_PLAN_UNKNOWN");
    if (plan.status !== "ACTION_READY" || plan.lastValidation?.actionAllowed !== true) {
      throw new Error("LIVE_PR28_WORLD_COMMIT_WITHOUT_REVALIDATION");
    }
    if (plan.art === "SERVER_HOP" && plan.serverHopPolicy) {
      const targetKey =
        String(plan.serverHopPolicy.targetRegion || "")
        + ":"
        + String(plan.serverHopPolicy.targetIdentifier || "");
      this.#serverHopHistory.set(targetKey, nowMs);
    }
    const next = Object.freeze({
      ...plan,
      status: "COMPLETED",
      actionAuthority: false,
      worldActionAuthority: false,
      serverHopAuthority: false,
      gameplayAuthority: false,
      normalRuntimeAllowed: false,
    });
    this.#plans.set(id, next);
    return next;
  }

  afterRestart() {
    for (const [id, plan] of this.#plans.entries()) {
      if (plan.status === "COMPLETED") continue;
      this.#plans.set(id, Object.freeze({
        ...plan,
        status: "REVALIDATION_REQUIRED",
        lastValidation: null,
        actionAuthority: false,
        worldActionAuthority: false,
        serverHopAuthority: false,
        gameplayAuthority: false,
        rawWriteAuthority: false,
        normalRuntimeAllowed: false,
      }));
    }
  }

  candidates({
    nowMs = Date.now(),
    partyId = "local",
    availableCapabilities = [],
    priorities = {},
  } = {}) {
    const out = [];
    for (const observation of this.#observations.values()) {
      const fresh = nowMs >= observation.observedAtMs && nowMs <= observation.validUntilMs;
      if (!fresh) continue;
      if (!observation.active && observation.art !== "DISCOVERY") continue;

      const hardAllowed = observation.art === "DISCOVERY"
        ? true
        : observation.known && !observation.quarantined;

      const priority = Number(priorities[observation.art] ?? (
        observation.art === "RARE_BOSS" ? 100
          : observation.art === "EVENT" ? 80
            : observation.art === "QUEST" ? 70
              : observation.art === "DISCOVERY" ? 10
                : 20
      ));

      const requiredCapabilities =
        Array.isArray(observation.payload.requiredCapabilities)
          ? observation.payload.requiredCapabilities
          : [];

      out.push(Object.freeze({
        candidateId: "world:" + observation.art + ":" + observation.stateId,
        taskId: "world:" + observation.art + ":" + observation.stateId,
        partyId,
        hardAllowed,
        safetyOk: true,
        worldEvidenceFresh: fresh,
        requiredCapabilities,
        availableCapabilities,
        successScore: clamp(Number(observation.payload.successScore ?? 0.7), 0, 1),
        realPerformanceScore: clamp(Number(observation.payload.realPerformanceScore ?? 0.5), 0, 1),
        travelCost: Math.max(0, Number(observation.payload.travelCost ?? 0)),
        resourceCost: Math.max(0, Number(observation.payload.resourceCost ?? 0)),
        learningScore: clamp(Number(observation.payload.learningScore ?? 0), -100, 100),
        deterministicPriority: priority,
        payload: Object.freeze({
          kind: "WORLD",
          observation,
        }),
      }));
    }
    return Object.freeze(out);
  }

  snapshot() {
    return Object.freeze({
      observations: Object.freeze([...this.#observations.values()]),
      plans: Object.freeze([...this.#plans.values()]),
      quarantine: this.quarantineSnapshot(),
      serverHopHistory: Object.freeze(
        [...this.#serverHopHistory.entries()].map(([server, atMs]) => ({ server, atMs })),
      ),
    });
  }
}

export function buildProgressionCandidates({
  members = [],
  trainingMsByCharacter = {},
  maxLevel = 100,
  mandatoryRoles = [],
  roleAssignments = {},
} = {}) {
  const totalTrainingMs = Object.values(trainingMsByCharacter)
    .reduce((sum, value) => sum + Math.max(0, Number(value || 0)), 0);
  const mandatoryIds = new Set(
    mandatoryRoles
      .map((role) => roleAssignments?.[role])
      .filter(Boolean),
  );

  return Object.freeze(members.map((member) => {
    const characterId = text(member.characterId || member.name, "PR27_CHARACTER_ID");
    const level = Math.max(1, Number(member.level || 1));
    const gearScore = Math.max(0, Number(member.gearScore || 0));
    const skillProgress = clamp(Number(member.skillProgress ?? 0.5), 0, 1);
    const survivalPerformance = member.maxHp > 0
      ? clamp(Number(member.hp || 0) / Number(member.maxHp), 0, 1)
      : clamp(Number(member.hpRatio ?? 0.5), 0, 1);
    const rolePerformance = clamp(Number(member.rolePerformance ?? 0.5), 0, 1);
    const trainingMs = Math.max(0, Number(trainingMsByCharacter[characterId] || 0));
    const trainingShare = totalTrainingMs > 0 ? trainingMs / totalTrainingMs : 0;

    return Object.freeze({
      candidateId: "progression:" + characterId,
      characterId,
      hardAllowed: member.sessionFresh !== false && member.rosterFresh !== false,
      safetyOk: member.lifecycleActive !== false && member.dead !== true,
      mandatoryRole: mandatoryIds.has(characterId),
      levelProgress: clamp(level / Math.max(1, maxLevel), 0, 1),
      gearProgress: clamp(gearScore / Math.max(1, Number(member.maxGearScore || 1000)), 0, 1),
      skillProgress,
      survivalPerformance,
      rolePerformance,
      trainingShare,
      baseTaskScore: Number(member.baseTaskScore ?? 0),
      payload: member,
    });
  }));
}

export const LIVE_WORLD_FINGERPRINT = simpleFingerprint;
