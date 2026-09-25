export type Pr24GruppenCapability =
  | "TANK"
  | "HEAL"
  | "SINGLE_TARGET"
  | "AOE"
  | "CC"
  | "KITE"
  | "REVIVE";

export interface Pr24GruppenMitglied {
  readonly characterId: string;
  readonly klasse: string;
  readonly sessionFresh: boolean;
  readonly rosterFresh: boolean;
  readonly lifecycleAktiv: boolean;
  readonly capabilities: readonly Pr24GruppenCapability[];
  readonly gearScore: number;
  readonly level: number;
}

export interface Pr24GruppenAnforderung {
  readonly schemaVersion: 1;
  readonly topologyId: string;
  readonly minMembers: number;
  readonly maxMembers: number;
  readonly requiredCapabilities: readonly Pr24GruppenCapability[];
  readonly members: readonly Pr24GruppenMitglied[];
  readonly fremdesPartyMitgliedVorhanden: boolean;
  readonly mapInstanceDrift: boolean;
  readonly leaderMovementDrift: boolean;
  readonly restartReconciled: boolean;
}

export interface Pr24GruppenMatrixErgebnis {
  readonly schemaVersion: 1;
  readonly status: "ZULAESSIG_NO_WRITE" | "BLOCKIERT";
  readonly blocker: readonly string[];
  readonly vorhandeneCapabilities: readonly Pr24GruppenCapability[];
  readonly fehlendeCapabilities: readonly Pr24GruppenCapability[];
  readonly activeMemberIds: readonly string[];
  readonly erfindetFehlendeCapability: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly normalRuntimeAllowed: false;
}

const ALLE: readonly Pr24GruppenCapability[] = Object.freeze([
  "TANK",
  "HEAL",
  "SINGLE_TARGET",
  "AOE",
  "CC",
  "KITE",
  "REVIVE",
]);

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

export function bewertePr24GruppenKonstellation(
  anfrage: Pr24GruppenAnforderung,
): Pr24GruppenMatrixErgebnis {
  if (anfrage.schemaVersion !== 1) throw new Error("PR24_MATRIX_SCHEMA_UNGUELTIG");
  pruefeText(anfrage.topologyId, "PR24_MATRIX_TOPOLOGY_UNGUELTIG");
  if (!Number.isSafeInteger(anfrage.minMembers)
      || !Number.isSafeInteger(anfrage.maxMembers)
      || anfrage.minMembers < 1
      || anfrage.maxMembers < anfrage.minMembers
      || anfrage.maxMembers > 16
      || anfrage.members.length > 16) {
    throw new Error("PR24_MATRIX_MEMBER_LIMIT_UNGUELTIG");
  }

  const seen = new Set<string>();
  for (const member of anfrage.members) {
    pruefeText(member.characterId, "PR24_MATRIX_CHARACTER_UNGUELTIG");
    pruefeText(member.klasse, "PR24_MATRIX_KLASSE_UNGUELTIG");
    if (seen.has(member.characterId)) throw new Error("PR24_MATRIX_CHARACTER_DOPPELT");
    seen.add(member.characterId);
    if (!Number.isFinite(member.gearScore) || member.gearScore < 0
        || !Number.isSafeInteger(member.level) || member.level < 1) {
      throw new Error("PR24_MATRIX_PROGRESS_UNGUELTIG");
    }
    for (const capability of member.capabilities) {
      if (!ALLE.includes(capability)) throw new Error("PR24_MATRIX_CAPABILITY_UNBEKANNT");
    }
  }
  for (const capability of anfrage.requiredCapabilities) {
    if (!ALLE.includes(capability)) throw new Error("PR24_MATRIX_REQUIREMENT_UNBEKANNT");
  }

  const blocker: string[] = [];
  const active = anfrage.members.filter(member =>
    member.sessionFresh && member.rosterFresh && member.lifecycleAktiv);
  if (active.length < anfrage.minMembers) blocker.push("PR24_ZU_WENIGE_AKTIVE_MEMBER");
  if (active.length > anfrage.maxMembers) blocker.push("PR24_ZU_VIELE_AKTIVE_MEMBER");
  if (anfrage.members.some(member => !member.sessionFresh)) blocker.push("PR24_SESSION_DRIFT");
  if (anfrage.members.some(member => !member.rosterFresh)) blocker.push("PR24_ROSTER_DRIFT");
  if (anfrage.members.some(member => !member.lifecycleAktiv)) blocker.push("PR24_MEMBER_LIFECYCLE_AUSGEFALLEN");
  if (anfrage.fremdesPartyMitgliedVorhanden) blocker.push("PR24_FREMDES_PARTY_MITGLIED");
  if (anfrage.mapInstanceDrift) blocker.push("PR24_MAP_INSTANZ_DRIFT");
  if (anfrage.leaderMovementDrift) blocker.push("PR24_LEADER_MOVEMENT_DRIFT");
  if (!anfrage.restartReconciled) blocker.push("PR24_RESTART_NICHT_RECONCILED");

  const vorhanden = ALLE.filter(capability =>
    active.some(member => member.capabilities.includes(capability)));
  const required = Array.from(new Set(anfrage.requiredCapabilities));
  const fehlend = required.filter(capability => !vorhanden.includes(capability));
  for (const capability of fehlend) blocker.push("PR24_CAPABILITY_FEHLT:" + capability);

  return Object.freeze({
    schemaVersion: 1,
    status: blocker.length === 0 ? "ZULAESSIG_NO_WRITE" : "BLOCKIERT",
    blocker: Object.freeze(blocker),
    vorhandeneCapabilities: Object.freeze(vorhanden),
    fehlendeCapabilities: Object.freeze(fehlend),
    activeMemberIds: Object.freeze(active.map(x => x.characterId).sort()),
    erfindetFehlendeCapability: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    normalRuntimeAllowed: false,
  });
}
