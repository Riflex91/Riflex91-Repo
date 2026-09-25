import type { CharacterZielBindung } from "./roster-wahrheit.js";
import type { ProduktionsPlan } from "../produktion/production-planer.js";
import type { ProduktionsSchritt } from "../produktion/production-graph.js";

export interface ProduktionsMaterialFarmQuellenEvidence {
  readonly schemaVersion: 1;
  readonly sourceId: string;
  readonly name: string;
  readonly level: number;
  readonly verfuegbareMenge: number;
  readonly monsterTyp: string;
  readonly mapName: string;
  readonly spawnFingerprint: string;
  readonly beobachtetAmMs: number;
  readonly gueltigBisMs: number;
}

export interface ProduktionsMaterialFarmerEvidence {
  readonly schemaVersion: 1;
  readonly farmer: CharacterZielBindung;
  readonly beobachtetAmMs: number;
  readonly gueltigBisMs: number;
  readonly freshnessFingerprint: string;
  readonly lifecycleAktiv: boolean;
  readonly safetyBereit: boolean;
  readonly movementVorbereitet: boolean;
  readonly combatVorbereitet: boolean;
  readonly lootVorbereitet: boolean;
  readonly unterstuetzteSourceIds: readonly string[];
}

export interface ProduktionsMaterialAkquiseAnfrage {
  readonly schemaVersion: 1;
  readonly plan: ProduktionsPlan;
  readonly farmQuellen: readonly ProduktionsMaterialFarmQuellenEvidence[];
  readonly farmer: readonly ProduktionsMaterialFarmerEvidence[];
  readonly maximalesEvidenceAlterMs: number;
}

export interface ProduktionsMaterialZiel {
  readonly schemaVersion: 1;
  readonly objectiveId: string;
  readonly produktionsId: string;
  readonly ablaufId: string;
  readonly farmNodeId: string;
  readonly farmer: CharacterZielBindung;
  readonly sourceId: string;
  readonly monsterTyp: string;
  readonly mapName: string;
  readonly spawnFingerprint: string;
  readonly name: string;
  readonly level: number;
  readonly menge: number;
  readonly gueltigBisMs: number;
  readonly farmStopBeiMaterialBereit: true;
  readonly handoffNachMaterialBereit: true;
  readonly pr22KoordinationErforderlich: true;
  readonly pr23FarmerAktionenErforderlich: true;
  readonly pr20_9CraftRatificationCredit: false;
  readonly planningOnly: true;
  readonly ausfuehrungsAutoritaet: false;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

export interface ProduktionsMaterialAkquisePlan {
  readonly schemaVersion: 1;
  readonly status: "BEREIT_NO_WRITE" | "BLOCKIERT" | "KEIN_FARM_BEDARF";
  readonly produktionsId: string;
  readonly ablaufId: string;
  readonly ziele: readonly ProduktionsMaterialZiel[];
  readonly blocker: readonly string[];
  readonly pr22ProduktivGateErforderlich: true;
  readonly pr23ProduktivGateErforderlich: true;
  readonly currentPr20_9CandidateAcquisitionAllowed: false;
  readonly planningOnly: true;
  readonly ausfuehrungsAutoritaet: false;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
  readonly normalRuntimeAllowed: false;
}

export interface ProduktionsMaterialInventarEvidence {
  readonly schemaVersion: 1;
  readonly farmer: CharacterZielBindung;
  readonly name: string;
  readonly level: number;
  readonly menge: number;
  readonly beobachtetAmMs: number;
  readonly gueltigBisMs: number;
  readonly inventoryFingerprint: string;
}

export interface ProduktionsMaterialFortschritt {
  readonly schemaVersion: 1;
  readonly objectiveId: string;
  readonly status: "FARM_REQUIRED" | "MATERIAL_READY_FOR_HANDOFF";
  readonly beobachteteMenge: number;
  readonly restMenge: number;
  readonly beobachtetAmMs: number;
  readonly gueltigBisMs: number;
  readonly farmStopErforderlich: boolean;
  readonly handoffErforderlich: boolean;
  readonly pr22KoordinationErforderlich: true;
  readonly pr23FarmerAktionenErforderlich: true;
  readonly pr20_9CraftRatificationCredit: false;
  readonly ausfuehrungsAutoritaet: false;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function pruefeGanzzahl(
  wert: number,
  minimum: number,
  maximum: number,
  fehler: string,
): void {
  if (!Number.isSafeInteger(wert) || wert < minimum || wert > maximum) {
    throw new Error(fehler);
  }
}

function evidenceFrisch(
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

function gleicheServerBindung(
  a: CharacterZielBindung,
  b: CharacterZielBindung,
): boolean {
  return a.accountId === b.accountId
    && a.serverRegion === b.serverRegion
    && a.serverIdentifier === b.serverIdentifier;
}

function validiereBindung(bindung: CharacterZielBindung, fehler: string): void {
  if (bindung.schemaVersion !== 1
      || !Number.isSafeInteger(bindung.rosterEpoche)
      || bindung.rosterEpoche < 1) {
    throw new Error(fehler);
  }
  for (const text of [
    bindung.accountId,
    bindung.characterId,
    bindung.sessionId,
    bindung.serverRegion,
    bindung.serverIdentifier,
    bindung.rosterFingerprint,
  ]) pruefeText(text, fehler);
}

function farmNodes(plan: ProduktionsPlan): readonly ProduktionsSchritt[] {
  return Object.freeze(
    plan.graph.schritte
      .filter(schritt => schritt.art === "FARM")
      .slice()
      .sort((a, b) => a.nodeId.localeCompare(b.nodeId)),
  );
}

export function planeProductionMaterialAkquise(
  anfrage: ProduktionsMaterialAkquiseAnfrage,
  jetztMs: number,
): ProduktionsMaterialAkquisePlan {
  if (anfrage.schemaVersion !== 1 || anfrage.plan.schemaVersion !== 1) {
    throw new Error("CAP022_MATERIAL_AKQUISE_SCHEMA_UNGUELTIG");
  }
  pruefeGanzzahl(
    jetztMs,
    0,
    Number.MAX_SAFE_INTEGER,
    "CAP022_MATERIAL_AKQUISE_ZEIT_UNGUELTIG",
  );
  pruefeGanzzahl(
    anfrage.maximalesEvidenceAlterMs,
    1,
    60_000,
    "CAP022_MATERIAL_AKQUISE_EVIDENCE_ALTER_UNGUELTIG",
  );
  if (!anfrage.plan.graphNachweis.erlaubt
      || anfrage.plan.ausfuehrungsAutoritaet !== false
      || anfrage.plan.gameplayAutoritaet !== false
      || anfrage.plan.rawWriteAutoritaet !== false) {
    throw new Error("CAP022_MATERIAL_AKQUISE_PLAN_NICHT_NO_WRITE_BEREIT");
  }
  if (anfrage.farmQuellen.length > 256 || anfrage.farmer.length > 32) {
    throw new Error("CAP022_MATERIAL_AKQUISE_EVIDENCE_ZU_GROSS");
  }

  for (let index = 0; index < anfrage.farmQuellen.length; index += 1) {
    const quelle = anfrage.farmQuellen[index];
    if (quelle === undefined || quelle.schemaVersion !== 1) {
      throw new Error("CAP022_FARM_QUELLE_SCHEMA_UNGUELTIG");
    }
    for (const text of [
      quelle.sourceId,
      quelle.name,
      quelle.monsterTyp,
      quelle.mapName,
      quelle.spawnFingerprint,
    ]) pruefeText(text, "CAP022_FARM_QUELLE_TEXT_UNGUELTIG");
    pruefeGanzzahl(quelle.level, 0, 99, "CAP022_FARM_QUELLE_LEVEL_UNGUELTIG");
    pruefeGanzzahl(
      quelle.verfuegbareMenge,
      1,
      1_000_000,
      "CAP022_FARM_QUELLE_MENGE_UNGUELTIG",
    );
    if (anfrage.farmQuellen.slice(0, index).some(
      x => x.sourceId === quelle.sourceId,
    )) {
      throw new Error("CAP022_FARM_QUELLE_DOPPELT");
    }
  }

  for (let index = 0; index < anfrage.farmer.length; index += 1) {
    const worker = anfrage.farmer[index];
    if (worker === undefined || worker.schemaVersion !== 1) {
      throw new Error("CAP022_FARMER_EVIDENCE_SCHEMA_UNGUELTIG");
    }
    validiereBindung(worker.farmer, "CAP022_FARMER_BINDUNG_UNGUELTIG");
    pruefeText(
      worker.freshnessFingerprint,
      "CAP022_FARMER_FRESHNESS_UNGUELTIG",
    );
    if (worker.unterstuetzteSourceIds.length > 256) {
      throw new Error("CAP022_FARMER_SOURCE_IDS_ZU_GROSS");
    }
    for (let sourceIndex = 0;
      sourceIndex < worker.unterstuetzteSourceIds.length;
      sourceIndex += 1) {
      const sourceId = worker.unterstuetzteSourceIds[sourceIndex];
      if (sourceId === undefined) throw new Error("CAP022_FARMER_SOURCE_ID_FEHLT");
      pruefeText(sourceId, "CAP022_FARMER_SOURCE_ID_UNGUELTIG");
      if (worker.unterstuetzteSourceIds.slice(0, sourceIndex).includes(sourceId)) {
        throw new Error("CAP022_FARMER_SOURCE_ID_DOPPELT");
      }
    }
    if (anfrage.farmer.slice(0, index).some(
      x => gleicheBindung(x.farmer, worker.farmer),
    )) {
      throw new Error("CAP022_FARMER_EVIDENCE_DOPPELT");
    }
  }

  const nodes = farmNodes(anfrage.plan);
  if (nodes.length === 0) {
    return Object.freeze({
      schemaVersion: 1,
      status: "KEIN_FARM_BEDARF",
      produktionsId: anfrage.plan.produktionsId,
      ablaufId: anfrage.plan.ablaufId,
      ziele: Object.freeze([]),
      blocker: Object.freeze([]),
      pr22ProduktivGateErforderlich: true,
      pr23ProduktivGateErforderlich: true,
      currentPr20_9CandidateAcquisitionAllowed: false,
      planningOnly: true,
      ausfuehrungsAutoritaet: false,
      gameplayAutoritaet: false,
      rawWriteAutoritaet: false,
      normalRuntimeAllowed: false,
    });
  }

  const blocker: string[] = [];
  const ziele: ProduktionsMaterialZiel[] = [];

  for (const node of nodes) {
    const quellen = anfrage.farmQuellen
      .filter(quelle =>
        quelle.name === node.outputName
        && quelle.level === node.outputLevel
        && quelle.verfuegbareMenge >= node.outputMenge
        && evidenceFrisch(
          quelle.beobachtetAmMs,
          quelle.gueltigBisMs,
          jetztMs,
          anfrage.maximalesEvidenceAlterMs,
        ))
      .slice()
      .sort((a, b) => a.sourceId.localeCompare(b.sourceId));

    const quelle = quellen[0];
    if (quelle === undefined) {
      blocker.push("CAP022_FARM_QUELLE_FEHLT_ODER_STALE:" + node.nodeId);
      continue;
    }

    const worker = anfrage.farmer
      .filter(evidence =>
        evidence.lifecycleAktiv
        && evidence.safetyBereit
        && evidence.movementVorbereitet
        && evidence.combatVorbereitet
        && evidence.lootVorbereitet
        && evidence.unterstuetzteSourceIds.includes(quelle.sourceId)
        && gleicheServerBindung(evidence.farmer, anfrage.plan.graph.recipient)
        && evidenceFrisch(
          evidence.beobachtetAmMs,
          evidence.gueltigBisMs,
          jetztMs,
          anfrage.maximalesEvidenceAlterMs,
        ))
      .slice()
      .sort((a, b) =>
        a.farmer.characterId.localeCompare(b.farmer.characterId))[0];

    if (worker === undefined) {
      blocker.push("CAP022_FARMER_FEHLT_ODER_STALE:" + node.nodeId);
      continue;
    }

    ziele.push(Object.freeze({
      schemaVersion: 1,
      objectiveId:
        anfrage.plan.produktionsId + ":material:" + node.nodeId,
      produktionsId: anfrage.plan.produktionsId,
      ablaufId: anfrage.plan.ablaufId,
      farmNodeId: node.nodeId,
      farmer: Object.freeze({ ...worker.farmer }),
      sourceId: quelle.sourceId,
      monsterTyp: quelle.monsterTyp,
      mapName: quelle.mapName,
      spawnFingerprint: quelle.spawnFingerprint,
      name: node.outputName,
      level: node.outputLevel,
      menge: node.outputMenge,
      gueltigBisMs: Math.min(
        quelle.gueltigBisMs,
        worker.gueltigBisMs,
      ),
      farmStopBeiMaterialBereit: true,
      handoffNachMaterialBereit: true,
      pr22KoordinationErforderlich: true,
      pr23FarmerAktionenErforderlich: true,
      pr20_9CraftRatificationCredit: false,
      planningOnly: true,
      ausfuehrungsAutoritaet: false,
      gameplayAutoritaet: false,
      rawWriteAutoritaet: false,
    }));
  }

  return Object.freeze({
    schemaVersion: 1,
    status: blocker.length === 0 ? "BEREIT_NO_WRITE" : "BLOCKIERT",
    produktionsId: anfrage.plan.produktionsId,
    ablaufId: anfrage.plan.ablaufId,
    ziele: Object.freeze(ziele),
    blocker: Object.freeze(blocker),
    pr22ProduktivGateErforderlich: true,
    pr23ProduktivGateErforderlich: true,
    currentPr20_9CandidateAcquisitionAllowed: false,
    planningOnly: true,
    ausfuehrungsAutoritaet: false,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
    normalRuntimeAllowed: false,
  });
}

export function bewerteProductionMaterialFortschritt(
  ziel: ProduktionsMaterialZiel,
  evidence: ProduktionsMaterialInventarEvidence,
  jetztMs: number,
  maximalesEvidenceAlterMs = 5_000,
): ProduktionsMaterialFortschritt {
  if (ziel.schemaVersion !== 1 || evidence.schemaVersion !== 1) {
    throw new Error("CAP022_MATERIAL_FORTSCHRITT_SCHEMA_UNGUELTIG");
  }
  validiereBindung(ziel.farmer, "CAP022_MATERIAL_ZIEL_FARMER_UNGUELTIG");
  validiereBindung(
    evidence.farmer,
    "CAP022_MATERIAL_FORTSCHRITT_FARMER_UNGUELTIG",
  );
  if (!gleicheBindung(ziel.farmer, evidence.farmer)) {
    throw new Error("CAP022_MATERIAL_FORTSCHRITT_FARMER_DRIFT");
  }
  pruefeText(ziel.objectiveId, "CAP022_MATERIAL_ZIEL_ID_UNGUELTIG");
  pruefeText(evidence.inventoryFingerprint, "CAP022_MATERIAL_INVENTAR_FP_UNGUELTIG");
  pruefeGanzzahl(ziel.level, 0, 99, "CAP022_MATERIAL_ZIEL_LEVEL_UNGUELTIG");
  pruefeGanzzahl(ziel.menge, 1, 1_000_000, "CAP022_MATERIAL_ZIEL_MENGE_UNGUELTIG");
  pruefeGanzzahl(evidence.level, 0, 99, "CAP022_MATERIAL_INVENTAR_LEVEL_UNGUELTIG");
  pruefeGanzzahl(evidence.menge, 0, 1_000_000, "CAP022_MATERIAL_INVENTAR_MENGE_UNGUELTIG");
  pruefeGanzzahl(
    maximalesEvidenceAlterMs,
    1,
    60_000,
    "CAP022_MATERIAL_FORTSCHRITT_EVIDENCE_ALTER_UNGUELTIG",
  );
  if (!evidenceFrisch(
    evidence.beobachtetAmMs,
    evidence.gueltigBisMs,
    jetztMs,
    maximalesEvidenceAlterMs,
  )) {
    throw new Error("CAP022_MATERIAL_FORTSCHRITT_EVIDENCE_STALE");
  }
  if (evidence.name !== ziel.name || evidence.level !== ziel.level) {
    throw new Error("CAP022_MATERIAL_FORTSCHRITT_ITEM_DRIFT");
  }

  const bereit = evidence.menge >= ziel.menge;
  return Object.freeze({
    schemaVersion: 1,
    objectiveId: ziel.objectiveId,
    status: bereit ? "MATERIAL_READY_FOR_HANDOFF" : "FARM_REQUIRED",
    beobachteteMenge: evidence.menge,
    restMenge: Math.max(0, ziel.menge - evidence.menge),
    beobachtetAmMs: evidence.beobachtetAmMs,
    gueltigBisMs: evidence.gueltigBisMs,
    farmStopErforderlich: bereit,
    handoffErforderlich: bereit,
    pr22KoordinationErforderlich: true,
    pr23FarmerAktionenErforderlich: true,
    pr20_9CraftRatificationCredit: false,
    ausfuehrungsAutoritaet: false,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
  });
}
