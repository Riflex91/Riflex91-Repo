const CAPABILITIES = Object.freeze([
  "TANK",
  "HEAL",
  "SINGLE_TARGET",
  "AOE",
  "CC",
  "KITE",
  "REVIVE",
]);

const CLASS_CAPABILITIES = Object.freeze({
  warrior: Object.freeze(["TANK", "SINGLE_TARGET", "AOE", "CC"]),
  priest: Object.freeze(["HEAL", "SINGLE_TARGET", "REVIVE"]),
  ranger: Object.freeze(["SINGLE_TARGET", "AOE", "KITE"]),
  rogue: Object.freeze(["SINGLE_TARGET", "KITE"]),
  mage: Object.freeze(["SINGLE_TARGET", "AOE", "CC"]),
  paladin: Object.freeze(["TANK", "HEAL", "SINGLE_TARGET"]),
  merchant: Object.freeze([]),
});

const TOPOLOGY = Object.freeze({
  solo: Object.freeze({ minMembers: 1, maxMembers: 1, requiredCapabilities: ["SINGLE_TARGET"] }),
  "two-farmer": Object.freeze({ minMembers: 2, maxMembers: 2, requiredCapabilities: ["SINGLE_TARGET"] }),
  "three-farmer": Object.freeze({ minMembers: 3, maxMembers: 3, requiredCapabilities: ["SINGLE_TARGET"] }),
  "tank-heal": Object.freeze({ minMembers: 2, maxMembers: 8, requiredCapabilities: ["TANK", "HEAL"] }),
  "tank-dps": Object.freeze({ minMembers: 2, maxMembers: 8, requiredCapabilities: ["TANK", "SINGLE_TARGET"] }),
  "tank-aoe": Object.freeze({ minMembers: 2, maxMembers: 8, requiredCapabilities: ["TANK", "AOE"] }),
  "heal-dps": Object.freeze({ minMembers: 2, maxMembers: 8, requiredCapabilities: ["HEAL", "SINGLE_TARGET"] }),
  "tank-heal-single": Object.freeze({ minMembers: 3, maxMembers: 8, requiredCapabilities: ["TANK", "HEAL", "SINGLE_TARGET"] }),
  "tank-heal-aoe": Object.freeze({ minMembers: 3, maxMembers: 8, requiredCapabilities: ["TANK", "HEAL", "AOE"] }),
  "multi-dps": Object.freeze({ minMembers: 2, maxMembers: 8, requiredCapabilities: ["SINGLE_TARGET"] }),
  "duplicate-classes": Object.freeze({ minMembers: 2, maxMembers: 8, requiredCapabilities: ["SINGLE_TARGET"] }),
  "without-tank": Object.freeze({ minMembers: 1, maxMembers: 8, requiredCapabilities: ["SINGLE_TARGET"] }),
  "without-heal": Object.freeze({ minMembers: 1, maxMembers: 8, requiredCapabilities: ["SINGLE_TARGET"] }),
  "without-aoe": Object.freeze({ minMembers: 1, maxMembers: 8, requiredCapabilities: ["SINGLE_TARGET"] }),
});

function finite(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, finite(value)));
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function unique(values) {
  return [...new Set(values)];
}

function capabilitiesFor(member) {
  const explicit = Array.isArray(member.capabilities)
    ? member.capabilities.filter((x) => CAPABILITIES.includes(x))
    : [];
  if (explicit.length > 0) return unique(explicit);
  const ctype = text(member.ctype || member.className || member.klasse).toLowerCase();
  return [...(CLASS_CAPABILITIES[ctype] || [])];
}

function normalizeMember(member, nowMs, staleMs) {
  const observedAtMs = finite(member.observedAtMs ?? member.receivedAtMs, nowMs);
  const ageMs = Math.max(0, nowMs - observedAtMs);
  const hp = finite(member.hp);
  const maxHp = finite(member.maxHp ?? member.max_hp);
  const mp = finite(member.mp);
  const maxMp = finite(member.maxMp ?? member.max_mp);
  const dead = member.dead === true || member.rip === true || (maxHp > 0 && hp <= 0);
  return Object.freeze({
    characterId: text(member.characterId || member.name),
    ctype: text(member.ctype || member.className || member.klasse).toLowerCase(),
    map: text(member.map),
    instance: text(member.instance || member.in),
    observedAtMs,
    ageMs,
    sessionFresh: member.sessionFresh !== false && ageMs <= staleMs,
    rosterFresh: member.rosterFresh !== false && ageMs <= staleMs,
    lifecycleActive: member.lifecycleActive !== false && !dead,
    dead,
    moving: member.moving === true,
    hp,
    maxHp,
    hpRatio: maxHp > 0 ? clamp01(hp / maxHp) : 0,
    mp,
    maxMp,
    mpRatio: maxMp > 0 ? clamp01(mp / maxMp) : 0,
    level: Math.max(1, Math.floor(finite(member.level, 1))),
    gearScore: Math.max(0, finite(member.gearScore)),
    targetId: text(member.targetId) || null,
    capabilities: Object.freeze(capabilitiesFor(member)),
  });
}

function selectBest(members, capability, excluded) {
  return members
    .filter((m) => !excluded.has(m.characterId) && m.capabilities.includes(capability))
    .sort((a, b) =>
      Number(b.lifecycleActive) - Number(a.lifecycleActive)
      || b.gearScore - a.gearScore
      || b.level - a.level
      || b.hpRatio - a.hpRatio
      || a.characterId.localeCompare(b.characterId)
    )[0] || null;
}

function assignRoles(activeMembers) {
  const assigned = new Set();
  const roles = {};
  for (const capability of ["TANK", "HEAL", "AOE", "CC", "KITE", "REVIVE"]) {
    const member = selectBest(activeMembers, capability, assigned);
    if (member) {
      roles[capability] = member.characterId;
      assigned.add(member.characterId);
    }
  }
  const dps = activeMembers
    .filter((m) => m.capabilities.includes("SINGLE_TARGET"))
    .map((m) => m.characterId)
    .sort();
  roles.DPS = Object.freeze(dps);
  return Object.freeze(roles);
}

function detectFaults({
  members,
  activeMembers,
  requiredCapabilities,
  knownMemberIds,
  ownMap,
  leaderId,
  lowMpRatio,
  restartReconciled,
}) {
  const faults = [];
  if (!restartReconciled) faults.push("RESTART");
  if (members.some((m) => !m.sessionFresh || !m.rosterFresh)) faults.push("ROSTER_SESSION_DRIFT");
  if (members.some((m) => m.dead && m.capabilities.includes("TANK"))) faults.push("TANK_TOT");
  if (members.some((m) => m.dead && m.capabilities.includes("HEAL"))) faults.push("HEAL_TOT");
  if (members.some((m) => m.dead && m.capabilities.includes("SINGLE_TARGET"))) faults.push("DPS_TOT");
  if (members.some((m) => m.mpRatio < lowMpRatio && m.lifecycleActive)) faults.push("MP_MANGEL");
  if (ownMap && activeMembers.some((m) => m.map && m.map !== ownMap)) faults.push("MAP_INSTANZ_DRIFT");

  const activeCapabilities = unique(activeMembers.flatMap((m) => m.capabilities));
  for (const capability of requiredCapabilities) {
    if (!activeCapabilities.includes(capability)) {
      faults.push("CAPABILITY_VERLUST");
      break;
    }
  }

  if (knownMemberIds && knownMemberIds.size > 0) {
    if (members.some((m) => !knownMemberIds.has(m.characterId))) {
      faults.push("FREMDES_PARTY_MITGLIED");
    }
    if ([...knownMemberIds].some((id) => !members.some((m) => m.characterId === id))) {
      faults.push("MEMBER_FEHLT");
    }
  }

  if (leaderId) {
    const leader = members.find((m) => m.characterId === leaderId);
    if (!leader || !leader.sessionFresh || !leader.rosterFresh) faults.push("LEADER_MOVEMENT_DRIFT");
  }

  return Object.freeze(unique(faults));
}

export function evaluateLiveGroup({
  topologyId = "solo",
  members = [],
  knownMemberIds = [],
  ownMap = "",
  leaderId = null,
  restartReconciled = true,
  nowMs = Date.now(),
  staleMs = 12000,
  lowMpRatio = 0.10,
  requiredCapabilities = null,
} = {}) {
  const topology = TOPOLOGY[topologyId] || TOPOLOGY.solo;
  const normalized = members
    .map((member) => normalizeMember(member, nowMs, staleMs))
    .filter((member) => member.characterId);
  const active = normalized.filter(
    (member) => member.sessionFresh && member.rosterFresh && member.lifecycleActive,
  );
  const required = unique(
    Array.isArray(requiredCapabilities)
      ? requiredCapabilities.filter((x) => CAPABILITIES.includes(x))
      : topology.requiredCapabilities,
  );
  const available = unique(active.flatMap((member) => member.capabilities));
  const missing = required.filter((capability) => !available.includes(capability));

  const blockers = [];
  if (active.length < topology.minMembers) blockers.push("PR24_ZU_WENIGE_AKTIVE_MEMBER");
  if (active.length > topology.maxMembers) blockers.push("PR24_ZU_VIELE_AKTIVE_MEMBER");
  if (missing.length > 0) blockers.push(...missing.map((x) => "PR24_CAPABILITY_FEHLT:" + x));

  const faults = detectFaults({
    members: normalized,
    activeMembers: active,
    requiredCapabilities: required,
    knownMemberIds: new Set(knownMemberIds.map(text).filter(Boolean)),
    ownMap: text(ownMap),
    leaderId: text(leaderId),
    lowMpRatio,
    restartReconciled,
  });

  for (const fault of faults) {
    if (["RESTART", "ROSTER_SESSION_DRIFT", "MAP_INSTANZ_DRIFT", "FREMDES_PARTY_MITGLIED"].includes(fault)) {
      blockers.push("PR24_FAULT:" + fault);
    }
  }

  return Object.freeze({
    schemaVersion: 1,
    topologyId,
    status: blockers.length === 0 ? "LIVE_GROUP_READY" : "BLOCKED",
    blocker: Object.freeze(unique(blockers)),
    faults,
    requiredCapabilities: Object.freeze(required),
    availableCapabilities: Object.freeze(available),
    missingCapabilities: Object.freeze(missing),
    activeMemberIds: Object.freeze(active.map((m) => m.characterId).sort()),
    members: Object.freeze(normalized),
    roles: assignRoles(active),
    liveExecutionAllowed: blockers.length === 0,
    gameplayAuthority: blockers.length === 0,
    normalRuntimeAllowed: blockers.length === 0,
    rawWriteAuthority: false,
  });
}

export class GroupEvidenceTracker {
  #segments = new Map();
  #current = null;

  begin({
    segmentId,
    art = "INTEGRATION_15M",
    topologyId = "solo",
    capabilityId = null,
    atMs = Date.now(),
    startXp = 0,
    startKills = 0,
  } = {}) {
    if (this.#current) throw new Error("LIVE_GROUP_EVIDENCE_SEGMENT_ALREADY_RUNNING");
    const id = text(segmentId);
    if (!id || this.#segments.has(id)) throw new Error("LIVE_GROUP_EVIDENCE_SEGMENT_INVALID");
    if (!["CAPABILITY_5M", "INTEGRATION_15M"].includes(art)) {
      throw new Error("LIVE_GROUP_EVIDENCE_ART_INVALID");
    }
    this.#current = {
      segmentId: id,
      art,
      topologyId: text(topologyId) || "solo",
      capabilityId: capabilityId == null ? null : text(capabilityId),
      startedAtMs: atMs,
      startXp: Math.max(0, finite(startXp)),
      startKills: Math.max(0, finite(startKills)),
      unerwarteteGameplayWrites: 0,
      duplicateIrreversibleEffects: 0,
      safetyViolations: 0,
      staleTargetActions: 0,
      movementThrashEvents: 0,
      unresolvedRecoveryCount: 0,
      deaths: 0,
      disconnectRejoinFailures: 0,
    };
    return Object.freeze({ ...this.#current });
  }

  note(metric, amount = 1) {
    if (!this.#current) return;
    if (!(metric in this.#current)) return;
    const n = Math.max(0, finite(amount));
    this.#current[metric] += n;
  }

  finish({
    atMs = Date.now(),
    endXp = 0,
    endKills = 0,
  } = {}) {
    if (!this.#current) throw new Error("LIVE_GROUP_EVIDENCE_NO_ACTIVE_SEGMENT");
    const row = this.#current;
    const durationMs = Math.max(0, atMs - row.startedAtMs);
    const dauerSekunden = durationMs / 1000;
    const minutes = Math.max(durationMs / 60000, 1 / 60);
    const result = Object.freeze({
      ...row,
      endedAtMs: atMs,
      dauerSekunden,
      killrate: Math.max(0, finite(endKills) - row.startKills) / minutes,
      xpProMinute: Math.max(0, finite(endXp) - row.startXp) / minutes,
    });
    this.#segments.set(row.segmentId, result);
    this.#current = null;
    return result;
  }

  summary() {
    const rows = [...this.#segments.values()];
    const blocker = [];
    let capabilitySegmente = 0;
    let integrationsSegmente = 0;
    let gesamteDauerSekunden = 0;
    for (const row of rows) {
      gesamteDauerSekunden += row.dauerSekunden;
      if (row.art === "CAPABILITY_5M") {
        capabilitySegmente += 1;
        if (row.dauerSekunden < 300) blocker.push("PR25_CAPABILITY_DAUER_ZU_KURZ:" + row.segmentId);
      } else {
        integrationsSegmente += 1;
        if (row.dauerSekunden < 900) blocker.push("PR25_INTEGRATION_DAUER_ZU_KURZ:" + row.segmentId);
      }
      for (const key of [
        "unerwarteteGameplayWrites",
        "duplicateIrreversibleEffects",
        "safetyViolations",
        "staleTargetActions",
        "movementThrashEvents",
        "unresolvedRecoveryCount",
        "disconnectRejoinFailures",
      ]) {
        if (row[key] > 0) blocker.push("PR25_" + key.toUpperCase() + ":" + row.segmentId);
      }
    }
    if (rows.length > 0 && integrationsSegmente < 1) blocker.push("PR25_INTEGRATION_SEGMENT_FEHLT");
    return Object.freeze({
      schemaVersion: 1,
      status: blocker.length === 0 ? "BESTANDEN" : "BLOCKIERT",
      blocker: Object.freeze(blocker),
      capabilitySegmente,
      integrationsSegmente,
      gesamteDauerSekunden,
      current: this.#current ? Object.freeze({ ...this.#current }) : null,
      segments: Object.freeze(rows.map((row) => Object.freeze({ ...row }))),
      liveEvidenceRatified: false,
      gameplayAuthority: true,
      rawWriteAuthority: false,
    });
  }
}

export const LIVE_GROUP_CAPABILITIES = CAPABILITIES;
export const LIVE_GROUP_CLASS_CAPABILITIES = CLASS_CAPABILITIES;
export const LIVE_GROUP_TOPOLOGIES = TOPOLOGY;
