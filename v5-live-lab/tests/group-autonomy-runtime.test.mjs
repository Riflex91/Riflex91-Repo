import test from "node:test";
import assert from "node:assert/strict";

import {
  evaluateLiveGroup,
  GroupEvidenceTracker,
} from "../src/group-runtime.mjs";

import {
  balanceAccountProgression,
  buildProgressionCandidates,
  optimizeTaskParty,
  WorldAutonomyRuntime,
} from "../src/autonomy-runtime.mjs";

test("PR24 live group requires fresh capabilities and assigns deterministic roles", () => {
  const now = 100000;
  const result = evaluateLiveGroup({
    topologyId: "tank-heal-aoe",
    nowMs: now,
    knownMemberIds: ["Tank", "Heal", "Mage"],
    ownMap: "main",
    leaderId: "Tank",
    members: [
      {
        name: "Tank",
        ctype: "warrior",
        observedAtMs: now - 100,
        sessionFresh: true,
        rosterFresh: true,
        lifecycleActive: true,
        hp: 1000,
        maxHp: 1000,
        mp: 200,
        maxMp: 300,
        level: 80,
        gearScore: 900,
        map: "main",
      },
      {
        name: "Heal",
        ctype: "priest",
        observedAtMs: now - 100,
        sessionFresh: true,
        rosterFresh: true,
        lifecycleActive: true,
        hp: 800,
        maxHp: 1000,
        mp: 1000,
        maxMp: 1000,
        level: 80,
        gearScore: 850,
        map: "main",
      },
      {
        name: "Mage",
        ctype: "mage",
        observedAtMs: now - 100,
        sessionFresh: true,
        rosterFresh: true,
        lifecycleActive: true,
        hp: 700,
        maxHp: 900,
        mp: 1200,
        maxMp: 1200,
        level: 80,
        gearScore: 800,
        map: "main",
      },
    ],
  });

  assert.equal(result.status, "LIVE_GROUP_READY");
  assert.deepEqual(result.missingCapabilities, []);
  assert.equal(result.roles.TANK, "Tank");
  assert.equal(result.roles.HEAL, "Heal");
  assert.equal(result.roles.AOE, "Mage");
  assert.equal(result.liveExecutionAllowed, true);
  assert.equal(result.gameplayAuthority, true);
  assert.equal(result.rawWriteAuthority, false);
});

test("PR24 blocks stale roster and missing capability", () => {
  const now = 100000;
  const result = evaluateLiveGroup({
    topologyId: "tank-heal",
    nowMs: now,
    staleMs: 1000,
    members: [
      {
        name: "Tank",
        ctype: "warrior",
        observedAtMs: now - 5000,
        sessionFresh: true,
        rosterFresh: true,
        lifecycleActive: true,
        hp: 1000,
        maxHp: 1000,
        mp: 200,
        maxMp: 300,
        map: "main",
      },
    ],
  });

  assert.equal(result.status, "BLOCKED");
  assert.ok(result.faults.includes("ROSTER_SESSION_DRIFT"));
  assert.ok(result.missingCapabilities.includes("HEAL"));
  assert.equal(result.gameplayAuthority, false);
});

test("PR25 evidence tracker reproduces 5m/15m gates and fault counters", () => {
  const tracker = new GroupEvidenceTracker();

  tracker.begin({
    segmentId: "capability:aoe",
    art: "CAPABILITY_5M",
    atMs: 0,
    startXp: 1000,
    startKills: 10,
  });
  tracker.finish({
    atMs: 300000,
    endXp: 7000,
    endKills: 40,
  });

  tracker.begin({
    segmentId: "integration:tank-heal-aoe",
    art: "INTEGRATION_15M",
    atMs: 400000,
    startXp: 7000,
    startKills: 40,
  });
  tracker.finish({
    atMs: 1300000,
    endXp: 25000,
    endKills: 130,
  });

  const summary = tracker.summary();
  assert.equal(summary.status, "BESTANDEN");
  assert.equal(summary.capabilitySegmente, 1);
  assert.equal(summary.integrationsSegmente, 1);
  assert.equal(summary.gesamteDauerSekunden, 1200);
  assert.equal(summary.liveEvidenceRatified, false);
});

test("PR26 optimizer applies hard filters before learning", () => {
  const result = optimizeTaskParty([
    {
      candidateId: "unsafe-learning",
      taskId: "rare:boss",
      partyId: "party",
      hardAllowed: false,
      safetyOk: true,
      worldEvidenceFresh: true,
      requiredCapabilities: [],
      availableCapabilities: [],
      successScore: 1,
      realPerformanceScore: 1,
      travelCost: 0,
      resourceCost: 0,
      learningScore: 100,
      deterministicPriority: 1000,
    },
    {
      candidateId: "safe",
      taskId: "farm:goo",
      partyId: "party",
      hardAllowed: true,
      safetyOk: true,
      worldEvidenceFresh: true,
      requiredCapabilities: ["SINGLE_TARGET"],
      availableCapabilities: ["SINGLE_TARGET"],
      successScore: 0.7,
      realPerformanceScore: 0.8,
      travelCost: 10,
      resourceCost: 1,
      learningScore: 0,
      deterministicPriority: 1,
    },
  ]);

  assert.equal(result.status, "LIVE_SELECTION_READY");
  assert.equal(result.selected.candidateId, "safe");
  assert.ok(result.rejectedCandidateIds.includes("unsafe-learning"));
  assert.equal(result.learningCanRelaxHardFilter, false);
});

test("PR27 progression protects mandatory roles and balances training starvation", () => {
  const candidates = buildProgressionCandidates({
    members: [
      {
        name: "Tank",
        level: 80,
        gearScore: 900,
        maxGearScore: 1000,
        hp: 1000,
        maxHp: 1000,
        sessionFresh: true,
        rosterFresh: true,
        lifecycleActive: true,
      },
      {
        name: "Dps",
        level: 50,
        gearScore: 400,
        maxGearScore: 1000,
        hp: 700,
        maxHp: 1000,
        sessionFresh: true,
        rosterFresh: true,
        lifecycleActive: true,
      },
    ],
    trainingMsByCharacter: {
      Tank: 100000,
      Dps: 1000,
    },
    mandatoryRoles: ["TANK"],
    roleAssignments: {
      TANK: "Tank",
    },
  });

  const result = balanceAccountProgression({
    candidates,
    targetCorridor: 0.05,
  });

  assert.equal(result.status, "LIVE_SELECTION_READY");
  assert.equal(result.selected.characterId, "Tank");
  assert.equal(result.selected.mandatoryRoleProtected, true);
  assert.equal(result.progressionStarvationGuard, true);
});

test("PR28 event/quest plan must revalidate exact live fingerprint before action", () => {
  const world = new WorldAutonomyRuntime();
  const observed = world.observe({
    art: "EVENT",
    stateId: "holidayseason",
    serverRegion: "EU",
    serverIdentifier: "I",
    mapId: "main",
    active: true,
    observedAtMs: 1000,
    validUntilMs: 10000,
    payload: { phase: "active" },
    known: true,
  });

  const plan = world.plan({
    planId: "event-plan-1",
    art: "EVENT",
    stateId: "holidayseason",
    nowMs: 2000,
  });
  assert.equal(plan.status, "PLANNED");
  assert.equal(plan.actionAuthority, false);

  const ready = world.revalidate("event-plan-1", { nowMs: 3000 });
  assert.equal(ready.status, "ACTION_READY");
  assert.equal(ready.worldActionAuthority, true);

  world.observe({
    ...observed,
    observedAtMs: 3500,
    validUntilMs: 10000,
    payload: { phase: "ended" },
    active: false,
  });

  const drifted = world.revalidate("event-plan-1", { nowMs: 4000 });
  assert.equal(drifted.status, "BLOCKED");
  assert.equal(drifted.lastValidation.status, "REPLAN_REQUIRED");
});

test("PR28 unknown discovery stays quarantined and cannot silently become action content", () => {
  const world = new WorldAutonomyRuntime();
  world.observe({
    art: "DISCOVERY",
    stateId: "mystery-monster",
    serverRegion: "EU",
    serverIdentifier: "I",
    mapId: "main",
    active: true,
    observedAtMs: 1000,
    validUntilMs: 10000,
    payload: { entityType: "mystery" },
    known: false,
    quarantined: true,
  });

  assert.equal(world.quarantineSnapshot().length, 1);
  const candidates = world.candidates({
    nowMs: 2000,
    availableCapabilities: ["SINGLE_TARGET"],
  });
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].payload.observation.art, "DISCOVERY");
  assert.equal(candidates[0].hardAllowed, true);

  const actionPlan = world.plan({
    planId: "unsafe",
    art: "DISCOVERY",
    stateId: "mystery-monster",
    nowMs: 2000,
  });
  assert.equal(actionPlan.status, "PLANNED");

  const revalidated = world.revalidate("unsafe", { nowMs: 3000 });
  assert.equal(revalidated.status, "BLOCKED");
  assert.equal(revalidated.worldActionAuthority, false);
});

test("PR28 server hop requires fresh mode/policy and cooldown", () => {
  const world = new WorldAutonomyRuntime();
  world.observe({
    art: "SERVER_HOP",
    stateId: "EU:II",
    serverRegion: "EU",
    serverIdentifier: "I",
    mapId: "main",
    active: true,
    observedAtMs: 1000,
    validUntilMs: 10000,
    payload: { targetRegion: "EU", targetIdentifier: "II" },
    known: true,
  });

  const blocked = world.plan({
    planId: "hop-blocked",
    art: "SERVER_HOP",
    stateId: "EU:II",
    nowMs: 2000,
    serverHopPolicy: {
      serverHopAllowed: true,
      serverHopEvidenceFresh: true,
      targetServerModeKnown: false,
      pvpHardcorePolicyAllowsTarget: true,
      currentRegion: "EU",
      currentIdentifier: "I",
      targetRegion: "EU",
      targetIdentifier: "II",
      cooldownMs: 60000,
    },
  });
  assert.equal(blocked.status, "BLOCKED");
  assert.ok(blocked.blocker.includes("PR28_SERVER_MODE_UNKNOWN"));

  const planned = world.plan({
    planId: "hop-good",
    art: "SERVER_HOP",
    stateId: "EU:II",
    nowMs: 2000,
    serverHopPolicy: {
      serverHopAllowed: true,
      serverHopEvidenceFresh: true,
      targetServerModeKnown: true,
      pvpHardcorePolicyAllowsTarget: true,
      currentRegion: "EU",
      currentIdentifier: "I",
      targetRegion: "EU",
      targetIdentifier: "II",
      cooldownMs: 60000,
    },
  });
  assert.equal(planned.status, "PLANNED");
  assert.equal(world.revalidate("hop-good", { nowMs: 3000 }).serverHopAuthority, true);
  assert.equal(world.complete("hop-good", { nowMs: 3000 }).status, "COMPLETED");
});
