import type { CharacterZielBindung } from "./roster-wahrheit.js";
import type {
  ProduktionsMaterialFarmerEvidence,
  ProduktionsMaterialInventarEvidence,
  ProduktionsMaterialZiel,
} from "./production-material-acquisition.js";

export interface ProduktionsMaterialTeamAnfrage {
  readonly schemaVersion: 1;
  readonly ziel: ProduktionsMaterialZiel;
  readonly farmer: readonly ProduktionsMaterialFarmerEvidence[];
  readonly inventar: readonly ProduktionsMaterialInventarEvidence[];
  readonly maximaleFarmer: number;
  readonly maximalesEvidenceAlterMs: number;
}

export interface ProduktionsMaterialTeamZuteilung {
  readonly schemaVersion: 1;
  readonly objectiveId: string;
  readonly farmer: CharacterZielBindung;
  readonly sourceId: string;
  readonly name: string;
  readonly level: number;
  readonly beobachteteMenge: number;
  readonly farmRestZuteilung: number;
  readonly freshnessFingerprint: string;
  readonly inventoryFingerprint: string;
  readonly sameProductionObjective: true;
  readonly planningOnly: true;
  readonly movementAuthority: false;
  readonly combatAuthority: false;
  readonly lootAuthority: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
}

export interface ProduktionsMaterialTeamPlan {
  readonly schemaVersion: 1;
  readonly status:
    | "TEAM_FARM_REQUIRED_NO_WRITE"
    | "TEAM_MATERIAL_READY_FOR_HANDOFF_NO_WRITE"
    | "BLOCKIERT";
  readonly objectiveId: string;
  readonly produktionsId: string;
  readonly ablaufId: string;
  readonly sourceId: string;
  readonly name: string;
  readonly level: number;
  readonly requiredQuantity: number;
  readonly heldByFarmers: number;
  readonly remainingToFarm: number;
  readonly zuteilungen: readonly ProduktionsMaterialTeamZuteilung[];
  readonly blocker: readonly string[];
  readonly allWorkersSameProductionObjective: true;
  readonly splitAcrossProductionObjectives: false;
  readonly aggregateInventoryEvidenceRequired: true;
  readonly farmStopBeiAggregateReady: true;
  readonly farmStopRequired: boolean;
  readonly handoffBatchRequired: boolean;
  readonly pr22CoordinationRequired: true;
  readonly pr23FarmerActionsRequired: true;
  readonly currentPr20_9RatificationCredit: false;
  readonly productiveExecutionAllowed: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly normalRuntimeAllowed: false;
}

function text(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 240) throw new Error(fehler);
}

function ganzzahl(
  wert: number,
  minimum: number,
  maximum: number,
  fehler: string,
): void {
  if (!Number.isSafeInteger(wert) || wert < minimum || wert > maximum) {
    throw new Error(fehler);
  }
}

function bindungGueltig(bindung: CharacterZielBindung): boolean {
  return bindung.schemaVersion === 1
    && bindung.accountId.trim().length > 0
    && bindung.accountId.length <= 192
    && bindung.characterId.trim().length > 0
    && bindung.characterId.length <= 192
    && bindung.sessionId.trim().length > 0
    && bindung.sessionId.length <= 192
    && bindung.serverRegion.trim().length > 0
    && bindung.serverRegion.length <= 192
    && bindung.serverIdentifier.trim().length > 0
    && bindung.serverIdentifier.length <= 192
    && bindung.rosterFingerprint.trim().length > 0
    && bindung.rosterFingerprint.length <= 192
    && Number.isSafeInteger(bindung.rosterEpoche)
    && bindung.rosterEpoche >= 1;
}

function gleicheBindung(
  a: CharacterZielBindung,
  b: CharacterZielBindung,
): boolean {
  return a.schemaVersion === 1
    && b.schemaVersion === 1
    && a.accountId === b.accountId
    && a.characterId === b.characterId
    && a.sessionId === b.sessionId
    && a.serverRegion === b.serverRegion
    && a.serverIdentifier === b.serverIdentifier
    && a.rosterEpoche === b.rosterEpoche
    && a.rosterFingerprint === b.rosterFingerprint;
}

function gleicheAccountServerBindung(
  a: CharacterZielBindung,
  b: CharacterZielBindung,
): boolean {
  return a.accountId === b.accountId
    && a.serverRegion === b.serverRegion
    && a.serverIdentifier === b.serverIdentifier;
}

function frisch(
  beobachtetAmMs: number,
  gueltigBisMs: number,
  jetztMs: number,
  maximalesEvidenceAlterMs: number,
): boolean {
  return Number.isSafeInteger(beobachtetAmMs)
    && Number.isSafeInteger(gueltigBisMs)
    && beobachtetAmMs >= 0
    && gueltigBisMs >= beobachtetAmMs
    && jetztMs >= beobachtetAmMs
    && jetztMs <= gueltigBisMs
    && jetztMs - beobachtetAmMs <= maximalesEvidenceAlterMs;
}

function verteilteFarmMengen(
  fehlend: number,
  anzahl: number,
): readonly number[] {
  if (fehlend <= 0) return Object.freeze(Array(anzahl).fill(0));
  const basis = Math.floor(fehlend / anzahl);
  const rest = fehlend % anzahl;
  return Object.freeze(Array.from(
    { length: anzahl },
    (_, index) => basis + (index < rest ? 1 : 0),
  ));
}

export function planeProductionMaterialTeam(
  anfrage: ProduktionsMaterialTeamAnfrage,
  jetztMs: number,
): ProduktionsMaterialTeamPlan {
  if (anfrage.schemaVersion !== 1 || anfrage.ziel.schemaVersion !== 1) {
    throw new Error("CAP022_TEAM_SCHEMA_UNGUELTIG");
  }
  ganzzahl(
    jetztMs,
    0,
    Number.MAX_SAFE_INTEGER,
    "CAP022_TEAM_ZEIT_UNGUELTIG",
  );
  ganzzahl(
    anfrage.maximaleFarmer,
    1,
    8,
    "CAP022_TEAM_MAX_FARMER_UNGUELTIG",
  );
  ganzzahl(
    anfrage.maximalesEvidenceAlterMs,
    1,
    60_000,
    "CAP022_TEAM_EVIDENCE_ALTER_UNGUELTIG",
  );

  const ziel = anfrage.ziel;
  if (!bindungGueltig(ziel.farmer)
      || ziel.planningOnly !== true
      || ziel.ausfuehrungsAutoritaet !== false
      || ziel.gameplayAutoritaet !== false
      || ziel.rawWriteAutoritaet !== false
      || ziel.pr20_9CraftRatificationCredit !== false
      || ziel.pr22KoordinationErforderlich !== true
      || ziel.pr23FarmerAktionenErforderlich !== true) {
    throw new Error("CAP022_TEAM_ZIEL_UNGUELTIG");
  }
  for (const wert of [
    ziel.objectiveId,
    ziel.produktionsId,
    ziel.ablaufId,
    ziel.farmNodeId,
    ziel.sourceId,
    ziel.name,
    ziel.spawnFingerprint,
  ]) text(wert, "CAP022_TEAM_ZIEL_TEXT_UNGUELTIG");
  ganzzahl(ziel.level, 0, 99, "CAP022_TEAM_ZIEL_LEVEL_UNGUELTIG");
  ganzzahl(ziel.menge, 1, 1_000_000, "CAP022_TEAM_ZIEL_MENGE_UNGUELTIG");
  if (jetztMs > ziel.gueltigBisMs) {
    throw new Error("CAP022_TEAM_ZIEL_STALE");
  }
  if (anfrage.farmer.length > 32 || anfrage.inventar.length > 32) {
    throw new Error("CAP022_TEAM_EVIDENCE_ZU_GROSS");
  }

  for (let index = 0; index < anfrage.farmer.length; index += 1) {
    const worker = anfrage.farmer[index];
    if (worker === undefined
        || worker.schemaVersion !== 1
        || !bindungGueltig(worker.farmer)) {
      throw new Error("CAP022_TEAM_FARMER_EVIDENCE_UNGUELTIG");
    }
    text(
      worker.freshnessFingerprint,
      "CAP022_TEAM_FARMER_FRESHNESS_UNGUELTIG",
    );
    if (anfrage.farmer.slice(0, index).some(
      x => x.farmer.characterId === worker.farmer.characterId,
    )) {
      throw new Error("CAP022_TEAM_FARMER_DOPPELT");
    }
  }

  for (let index = 0; index < anfrage.inventar.length; index += 1) {
    const inv = anfrage.inventar[index];
    if (inv === undefined
        || inv.schemaVersion !== 1
        || !bindungGueltig(inv.farmer)) {
      throw new Error("CAP022_TEAM_INVENTAR_EVIDENCE_UNGUELTIG");
    }
    text(
      inv.inventoryFingerprint,
      "CAP022_TEAM_INVENTAR_FP_UNGUELTIG",
    );
    ganzzahl(inv.level, 0, 99, "CAP022_TEAM_INVENTAR_LEVEL_UNGUELTIG");
    ganzzahl(inv.menge, 0, 1_000_000, "CAP022_TEAM_INVENTAR_MENGE_UNGUELTIG");
    if (anfrage.inventar.slice(0, index).some(
      x => x.farmer.characterId === inv.farmer.characterId,
    )) {
      throw new Error("CAP022_TEAM_INVENTAR_DOPPELT");
    }
  }

  const geeignete = anfrage.farmer
    .filter(worker =>
      worker.lifecycleAktiv
      && worker.safetyBereit
      && worker.movementVorbereitet
      && worker.combatVorbereitet
      && worker.lootVorbereitet
      && worker.unterstuetzteSourceIds.includes(ziel.sourceId)
      && gleicheAccountServerBindung(worker.farmer, ziel.farmer)
      && frisch(
        worker.beobachtetAmMs,
        worker.gueltigBisMs,
        jetztMs,
        anfrage.maximalesEvidenceAlterMs,
      ))
    .slice()
    .sort((a, b) => {
      const aAnchor = gleicheBindung(a.farmer, ziel.farmer) ? 0 : 1;
      const bAnchor = gleicheBindung(b.farmer, ziel.farmer) ? 0 : 1;
      return aAnchor - bAnchor
        || a.farmer.characterId.localeCompare(b.farmer.characterId);
    });

  const blocker: string[] = [];
  if (!geeignete.some(x => gleicheBindung(x.farmer, ziel.farmer))) {
    blocker.push("CAP022_TEAM_ANCHOR_FARMER_FEHLT_ODER_STALE");
  }

  const ausgewaehlt = geeignete.slice(0, anfrage.maximaleFarmer);
  const rows = ausgewaehlt.map(worker => {
    const inv = anfrage.inventar.find(evidence =>
      gleicheBindung(evidence.farmer, worker.farmer)
      && evidence.name === ziel.name
      && evidence.level === ziel.level
      && frisch(
        evidence.beobachtetAmMs,
        evidence.gueltigBisMs,
        jetztMs,
        anfrage.maximalesEvidenceAlterMs,
      ));
    if (inv === undefined) {
      blocker.push(
        "CAP022_TEAM_INVENTAR_FEHLT_ODER_STALE:"
        + worker.farmer.characterId,
      );
      return null;
    }
    return Object.freeze({
      worker,
      inv,
    });
  });

  if (ausgewaehlt.length === 0) {
    blocker.push("CAP022_TEAM_KEIN_GEEIGNETER_FARMER");
  }

  const kompletteRows = rows.filter(
    (row): row is NonNullable<typeof row> => row !== null,
  );
  const heldByFarmers = kompletteRows.reduce(
    (summe, row) => summe + row.inv.menge,
    0,
  );
  const remainingToFarm = Math.max(0, ziel.menge - heldByFarmers);
  const ready = blocker.length === 0 && remainingToFarm === 0;
  const farmMengen = verteilteFarmMengen(
    blocker.length === 0 ? remainingToFarm : 0,
    Math.max(1, kompletteRows.length),
  );

  const zuteilungen = kompletteRows.map((row, index) => Object.freeze({
    schemaVersion: 1 as const,
    objectiveId: ziel.objectiveId,
    farmer: Object.freeze({ ...row.worker.farmer }),
    sourceId: ziel.sourceId,
    name: ziel.name,
    level: ziel.level,
    beobachteteMenge: row.inv.menge,
    farmRestZuteilung: blocker.length === 0
      ? (farmMengen[index] ?? 0)
      : 0,
    freshnessFingerprint: row.worker.freshnessFingerprint,
    inventoryFingerprint: row.inv.inventoryFingerprint,
    sameProductionObjective: true as const,
    planningOnly: true as const,
    movementAuthority: false as const,
    combatAuthority: false as const,
    lootAuthority: false as const,
    gameplayAuthority: false as const,
    rawWriteAuthority: false as const,
  }));

  return Object.freeze({
    schemaVersion: 1,
    status: blocker.length > 0
      ? "BLOCKIERT"
      : ready
        ? "TEAM_MATERIAL_READY_FOR_HANDOFF_NO_WRITE"
        : "TEAM_FARM_REQUIRED_NO_WRITE",
    objectiveId: ziel.objectiveId,
    produktionsId: ziel.produktionsId,
    ablaufId: ziel.ablaufId,
    sourceId: ziel.sourceId,
    name: ziel.name,
    level: ziel.level,
    requiredQuantity: ziel.menge,
    heldByFarmers,
    remainingToFarm,
    zuteilungen: Object.freeze(zuteilungen),
    blocker: Object.freeze(blocker),
    allWorkersSameProductionObjective: true,
    splitAcrossProductionObjectives: false,
    aggregateInventoryEvidenceRequired: true,
    farmStopBeiAggregateReady: true,
    farmStopRequired: ready,
    handoffBatchRequired: ready,
    pr22CoordinationRequired: true,
    pr23FarmerActionsRequired: true,
    currentPr20_9RatificationCredit: false,
    productiveExecutionAllowed: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    normalRuntimeAllowed: false,
  });
}
