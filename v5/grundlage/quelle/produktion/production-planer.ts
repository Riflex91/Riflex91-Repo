import type { CharacterZielBindung } from "../koordination/roster-wahrheit.js";
import {
  pinneBankKatalog,
  type BankKatalogPin,
  type BankKatalogSnapshot,
} from "./bank-katalog.js";
import {
  pruefeProduktionsGraph,
  type ProduktionsGateEvidence,
  type ProduktionsGraph,
  type ProduktionsGraphNachweis,
  type ProduktionsSchritt,
  type ProduktionsSchrittArt,
} from "./production-graph.js";

export type ProduktionsQuellenArt =
  | "BUY"
  | "FARM"
  | "QUEST"
  | "EVENT";

export type ProduktionsTransformationArt =
  | "CRAFT"
  | "EXCHANGE"
  | "UPGRADE"
  | "COMPOUND";

export type ProduktionsPlanungsQuelle =
  | "LOKAL"
  | "BANK"
  | ProduktionsQuellenArt
  | ProduktionsTransformationArt;

export interface ProduktionsBestandEvidence {
  readonly schemaVersion: 1;
  readonly name: string;
  readonly level: number;
  readonly menge: number;
  readonly beobachtetAmMs: number;
  readonly gueltigBisMs: number;
  readonly fingerprint: string;
}

export interface ProduktionsQuellenEvidence {
  readonly schemaVersion: 1;
  readonly sourceId: string;
  readonly art: ProduktionsQuellenArt;
  readonly name: string;
  readonly level: number;
  readonly verfuegbareMenge: number;
  readonly beobachtetAmMs: number;
  readonly gueltigBisMs: number;
  readonly fingerprint: string;
  readonly gateEvidence: ProduktionsGateEvidence | null;
}

export interface ProduktionsInputBedarf {
  readonly name: string;
  readonly level: number;
  readonly menge: number;
}

export interface ProduktionsTransformationEvidence {
  readonly schemaVersion: 1;
  readonly transformationId: string;
  readonly art: ProduktionsTransformationArt;
  readonly outputName: string;
  readonly outputLevel: number;
  readonly outputMengeProVorgang: number;
  readonly inputs: readonly ProduktionsInputBedarf[];
  readonly workspaceNachweisFingerprint: string;
  readonly beobachtetAmMs: number;
  readonly gueltigBisMs: number;
  readonly fingerprint: string;
}

export interface ProduktionsPlanungsRichtlinie {
  readonly richtlinienVersion: string;
  readonly quellenPrioritaet: readonly ProduktionsPlanungsQuelle[];
  readonly maximaleTiefe: number;
  readonly maximaleSchritte: number;
  readonly maximalesEvidenceAlterMs: number;
}

export interface ProduktionsPlanungsAnfrage {
  readonly schemaVersion: 1;
  readonly planId: string;
  readonly produktionsId: string;
  readonly ablaufId: string;
  readonly ownerCharacterId: string;
  readonly recipient: CharacterZielBindung;
  readonly outputName: string;
  readonly outputLevel: number;
  readonly outputMenge: number;
  readonly planFingerprint: string;
  readonly lokalerBestand: readonly ProduktionsBestandEvidence[];
  readonly bankSnapshot: BankKatalogSnapshot | null;
  readonly quellen: readonly ProduktionsQuellenEvidence[];
  readonly transformationen: readonly ProduktionsTransformationEvidence[];
  readonly richtlinie: ProduktionsPlanungsRichtlinie;
}

export interface ProduktionsSchrittBindung {
  readonly nodeId: string;
  readonly art: ProduktionsSchrittArt;
  readonly actionContractId: string | null;
  readonly recoveryContractId: string | null;
  readonly verifierId: string | null;
  readonly planningOnly: true;
}

export interface ProduktionsPlan {
  readonly schemaVersion: 1;
  readonly produktionsId: string;
  readonly ablaufId: string;
  readonly ownerCharacterId: string;
  readonly graph: ProduktionsGraph;
  readonly graphNachweis: ProduktionsGraphNachweis;
  readonly schrittBindungen: readonly ProduktionsSchrittBindung[];
  readonly bankKatalogPin: BankKatalogPin | null;
  readonly planungsNachweis: true;
  readonly ausfuehrungsAutoritaet: false;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

interface ArbeitsQuelle {
  readonly evidence: ProduktionsQuellenEvidence;
  rest: number;
}

interface ArbeitsBankEintrag {
  readonly pack: string;
  readonly slot: number;
  readonly name: string;
  readonly level: number;
  rest: number;
}

interface AcquireResult {
  readonly nodes: readonly string[];
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

function itemKey(name: string, level: number): string {
  return name + "|" + String(level);
}

function evidenceFrisch(
  beobachtetAmMs: number,
  gueltigBisMs: number,
  jetztMs: number,
  maximalAlterMs: number,
): boolean {
  return Number.isSafeInteger(beobachtetAmMs)
    && Number.isSafeInteger(gueltigBisMs)
    && beobachtetAmMs >= 0
    && gueltigBisMs >= beobachtetAmMs
    && jetztMs >= beobachtetAmMs
    && jetztMs <= gueltigBisMs
    && jetztMs - beobachtetAmMs <= maximalAlterMs;
}

function validiereRichtlinie(richtlinie: ProduktionsPlanungsRichtlinie): void {
  pruefeText(richtlinie.richtlinienVersion, "PRODUKTION_PLAN_POLICY_UNGUELTIG");
  pruefeGanzzahl(
    richtlinie.maximaleTiefe,
    1,
    32,
    "PRODUKTION_PLAN_MAX_TIEFE_UNGUELTIG",
  );
  pruefeGanzzahl(
    richtlinie.maximaleSchritte,
    1,
    128,
    "PRODUKTION_PLAN_MAX_SCHRITTE_UNGUELTIG",
  );
  pruefeGanzzahl(
    richtlinie.maximalesEvidenceAlterMs,
    1,
    86_400_000,
    "PRODUKTION_PLAN_EVIDENCE_ALTER_UNGUELTIG",
  );
  if (richtlinie.quellenPrioritaet.length < 1
      || richtlinie.quellenPrioritaet.length > 10) {
    throw new Error("PRODUKTION_PLAN_QUELLEN_PRIORITAET_UNGUELTIG");
  }
  const erlaubt = new Set<ProduktionsPlanungsQuelle>([
    "LOKAL",
    "BANK",
    "BUY",
    "FARM",
    "QUEST",
    "EVENT",
    "CRAFT",
    "EXCHANGE",
    "UPGRADE",
    "COMPOUND",
  ]);
  for (let index = 0; index < richtlinie.quellenPrioritaet.length; index += 1) {
    const art = richtlinie.quellenPrioritaet[index];
    if (art === undefined || !erlaubt.has(art)) {
      throw new Error("PRODUKTION_PLAN_QUELLEN_PRIORITAET_UNGUELTIG");
    }
    if (richtlinie.quellenPrioritaet.slice(0, index).includes(art)) {
      throw new Error("PRODUKTION_PLAN_QUELLEN_PRIORITAET_DOPPELT");
    }
  }
}

function validiereAnfrage(
  anfrage: ProduktionsPlanungsAnfrage,
  jetztMs: number,
): void {
  if (anfrage.schemaVersion !== 1 || anfrage.recipient.schemaVersion !== 1) {
    throw new Error("PRODUKTION_PLAN_SCHEMA_UNGUELTIG");
  }
  for (const text of [
    anfrage.planId,
    anfrage.produktionsId,
    anfrage.ablaufId,
    anfrage.ownerCharacterId,
    anfrage.outputName,
    anfrage.planFingerprint,
    anfrage.recipient.accountId,
    anfrage.recipient.characterId,
    anfrage.recipient.sessionId,
    anfrage.recipient.serverRegion,
    anfrage.recipient.serverIdentifier,
    anfrage.recipient.rosterFingerprint,
  ]) {
    pruefeText(text, "PRODUKTION_PLAN_TEXT_UNGUELTIG");
  }
  pruefeGanzzahl(
    anfrage.outputLevel,
    0,
    99,
    "PRODUKTION_PLAN_OUTPUT_LEVEL_UNGUELTIG",
  );
  pruefeGanzzahl(
    anfrage.outputMenge,
    1,
    1_000_000,
    "PRODUKTION_PLAN_OUTPUT_MENGE_UNGUELTIG",
  );
  pruefeGanzzahl(
    jetztMs,
    0,
    Number.MAX_SAFE_INTEGER,
    "PRODUKTION_PLAN_ZEIT_UNGUELTIG",
  );
  validiereRichtlinie(anfrage.richtlinie);

  if (anfrage.lokalerBestand.length > 512
      || anfrage.quellen.length > 1024
      || anfrage.transformationen.length > 512) {
    throw new Error("PRODUKTION_PLAN_EVIDENCE_ZU_GROSS");
  }

  for (const bestand of anfrage.lokalerBestand) {
    if (bestand.schemaVersion !== 1) {
      throw new Error("PRODUKTION_PLAN_BESTAND_SCHEMA_UNGUELTIG");
    }
    for (const text of [bestand.name, bestand.fingerprint]) {
      pruefeText(text, "PRODUKTION_PLAN_BESTAND_TEXT_UNGUELTIG");
    }
    pruefeGanzzahl(bestand.level, 0, 99, "PRODUKTION_PLAN_BESTAND_LEVEL_UNGUELTIG");
    pruefeGanzzahl(bestand.menge, 1, 1_000_000, "PRODUKTION_PLAN_BESTAND_MENGE_UNGUELTIG");
  }

  for (const quelle of anfrage.quellen) {
    if (quelle.schemaVersion !== 1) {
      throw new Error("PRODUKTION_PLAN_QUELLE_SCHEMA_UNGUELTIG");
    }
    for (const text of [
      quelle.sourceId,
      quelle.name,
      quelle.fingerprint,
    ]) {
      pruefeText(text, "PRODUKTION_PLAN_QUELLE_TEXT_UNGUELTIG");
    }
    pruefeGanzzahl(quelle.level, 0, 99, "PRODUKTION_PLAN_QUELLE_LEVEL_UNGUELTIG");
    pruefeGanzzahl(
      quelle.verfuegbareMenge,
      1,
      1_000_000,
      "PRODUKTION_PLAN_QUELLE_MENGE_UNGUELTIG",
    );
    if ((quelle.art === "EVENT" || quelle.art === "QUEST")
        !== (quelle.gateEvidence !== null)) {
      throw new Error("PRODUKTION_PLAN_GATE_EVIDENCE_DRIFT");
    }
  }

  for (const transformation of anfrage.transformationen) {
    if (transformation.schemaVersion !== 1) {
      throw new Error("PRODUKTION_PLAN_TRANSFORMATION_SCHEMA_UNGUELTIG");
    }
    for (const text of [
      transformation.transformationId,
      transformation.outputName,
      transformation.workspaceNachweisFingerprint,
      transformation.fingerprint,
    ]) {
      pruefeText(text, "PRODUKTION_PLAN_TRANSFORMATION_TEXT_UNGUELTIG");
    }
    pruefeGanzzahl(
      transformation.outputLevel,
      0,
      99,
      "PRODUKTION_PLAN_TRANSFORMATION_LEVEL_UNGUELTIG",
    );
    pruefeGanzzahl(
      transformation.outputMengeProVorgang,
      1,
      1_000_000,
      "PRODUKTION_PLAN_TRANSFORMATION_MENGE_UNGUELTIG",
    );
    if (transformation.inputs.length < 1 || transformation.inputs.length > 32) {
      throw new Error("PRODUKTION_PLAN_TRANSFORMATION_INPUTS_UNGUELTIG");
    }
    for (const input of transformation.inputs) {
      pruefeText(input.name, "PRODUKTION_PLAN_INPUT_NAME_UNGUELTIG");
      pruefeGanzzahl(input.level, 0, 99, "PRODUKTION_PLAN_INPUT_LEVEL_UNGUELTIG");
      pruefeGanzzahl(input.menge, 1, 1_000_000, "PRODUKTION_PLAN_INPUT_MENGE_UNGUELTIG");
    }
  }
}

function bindungFuer(
  nodeId: string,
  art: ProduktionsSchrittArt,
): ProduktionsSchrittBindung {
  const mapping: Partial<Record<
    ProduktionsSchrittArt,
    readonly [string, string, string]
  >> = {
    BANK_RETRIEVE: [
      "AL-ACTION-BANK-RETRIEVE",
      "AL-RECOVERY-BANK-RETRIEVE",
      "AL-VERIFIER-BANK-RETRIEVE",
    ],
    BUY: ["AL-ACTION-BUY", "AL-RECOVERY-BUY", "AL-VERIFIER-BUY"],
    CRAFT: ["AL-ACTION-CRAFT", "AL-RECOVERY-CRAFT", "AL-VERIFIER-CRAFT"],
    EXCHANGE: [
      "AL-ACTION-EXCHANGE",
      "AL-RECOVERY-EXCHANGE",
      "AL-VERIFIER-EXCHANGE",
    ],
    UPGRADE: [
      "AL-ACTION-UPGRADE",
      "AL-RECOVERY-UPGRADE",
      "AL-VERIFIER-UPGRADE",
    ],
    COMPOUND: [
      "AL-ACTION-COMPOUND",
      "AL-RECOVERY-COMPOUND",
      "AL-VERIFIER-COMPOUND",
    ],
    DELIVERY: [
      "AL-ACTION-SEND-ITEM",
      "AL-RECOVERY-SEND-ITEM",
      "AL-VERIFIER-SEND-ITEM",
    ],
  };
  const ids = mapping[art] ?? null;
  return Object.freeze({
    nodeId,
    art,
    actionContractId: ids?.[0] ?? null,
    recoveryContractId: ids?.[1] ?? null,
    verifierId: ids?.[2] ?? null,
    planningOnly: true,
  });
}

export function planeProduktion(
  anfrage: ProduktionsPlanungsAnfrage,
  jetztMs: number,
): ProduktionsPlan {
  validiereAnfrage(anfrage, jetztMs);

  const lokalerPool = new Map<string, number>();
  for (const bestand of anfrage.lokalerBestand) {
    if (!evidenceFrisch(
      bestand.beobachtetAmMs,
      bestand.gueltigBisMs,
      jetztMs,
      anfrage.richtlinie.maximalesEvidenceAlterMs,
    )) {
      continue;
    }
    const key = itemKey(bestand.name, bestand.level);
    lokalerPool.set(key, (lokalerPool.get(key) ?? 0) + bestand.menge);
  }

  let bankPin: BankKatalogPin | null = null;
  const bankPool: ArbeitsBankEintrag[] = [];
  if (anfrage.bankSnapshot !== null) {
    if (anfrage.bankSnapshot.accountId !== anfrage.recipient.accountId) {
      throw new Error("PRODUKTION_PLAN_BANK_ACCOUNT_DRIFT");
    }
    bankPin = pinneBankKatalog(anfrage.bankSnapshot, jetztMs);
    for (const eintrag of anfrage.bankSnapshot.eintraege) {
      bankPool.push({
        pack: eintrag.pack,
        slot: eintrag.slot,
        name: eintrag.name,
        level: eintrag.level,
        rest: eintrag.menge,
      });
    }
  }

  const quellen: ArbeitsQuelle[] = anfrage.quellen.map(evidence => ({
    evidence,
    rest: evidence.verfuegbareMenge,
  }));

  const schritte: ProduktionsSchritt[] = [];
  let nodeSequenz = 0;

  const neueNodeId = (prefix: string): string => {
    nodeSequenz += 1;
    return prefix + ":" + String(nodeSequenz);
  };

  const pushSchritt = (schritt: ProduktionsSchritt): void => {
    if (schritte.length >= anfrage.richtlinie.maximaleSchritte - 1) {
      throw new Error("PRODUKTION_PLAN_SCHRITTGRENZE_UEBERSCHRITTEN");
    }
    schritte.push(Object.freeze({ ...schritt }));
  };

  const acquire = (
    name: string,
    level: number,
    menge: number,
    tiefe: number,
    pfad: readonly string[],
  ): AcquireResult => {
    if (tiefe > anfrage.richtlinie.maximaleTiefe) {
      throw new Error("PRODUKTION_PLAN_TIEFE_UEBERSCHRITTEN");
    }
    const key = itemKey(name, level);
    let rest = menge;
    const nodes: string[] = [];
    let stalePassendeEvidence = false;

    for (const sourceArt of anfrage.richtlinie.quellenPrioritaet) {
      if (rest <= 0) break;

      if (sourceArt === "LOKAL") {
        const vorhanden = lokalerPool.get(key) ?? 0;
        const take = Math.min(rest, vorhanden);
        if (take > 0) {
          lokalerPool.set(key, vorhanden - take);
          rest -= take;
        }
        continue;
      }

      if (sourceArt === "BANK") {
        if (bankPin === null) continue;
        for (const row of bankPool) {
          if (rest <= 0) break;
          if (row.name !== name || row.level !== level || row.rest <= 0) continue;
          const geliefert = row.rest;
          const verwendet = Math.min(rest, geliefert);
          row.rest = 0;
          rest -= verwendet;
          const nodeId = neueNodeId("bank");
          pushSchritt({
            nodeId,
            art: "BANK_RETRIEVE",
            abhaengigkeiten: Object.freeze([]),
            outputName: name,
            outputLevel: level,
            outputMenge: geliefert,
            operationSchluessel:
              anfrage.produktionsId + ":bank:" + row.pack + ":" + String(row.slot),
            workspaceNachweisFingerprint: null,
            gateEvidence: null,
          });
          nodes.push(nodeId);
        }
        continue;
      }

      if (sourceArt === "BUY"
          || sourceArt === "FARM"
          || sourceArt === "QUEST"
          || sourceArt === "EVENT") {
        const passende = quellen
          .filter(x =>
            x.rest > 0
            && x.evidence.art === sourceArt
            && x.evidence.name === name
            && x.evidence.level === level)
          .sort((a, b) =>
            a.evidence.sourceId.localeCompare(b.evidence.sourceId));
        for (const row of passende) {
          if (rest <= 0) break;
          if (!evidenceFrisch(
            row.evidence.beobachtetAmMs,
            row.evidence.gueltigBisMs,
            jetztMs,
            anfrage.richtlinie.maximalesEvidenceAlterMs,
          )) {
            stalePassendeEvidence = true;
            continue;
          }
          const take = Math.min(rest, row.rest);
          if (take <= 0) continue;
          row.rest -= take;
          rest -= take;
          const nodeId = neueNodeId(sourceArt.toLowerCase());
          pushSchritt({
            nodeId,
            art: sourceArt,
            abhaengigkeiten: Object.freeze([]),
            outputName: name,
            outputLevel: level,
            outputMenge: take,
            operationSchluessel: sourceArt === "BUY"
              ? anfrage.produktionsId + ":buy:" + row.evidence.sourceId + ":" + nodeId
              : null,
            workspaceNachweisFingerprint: null,
            gateEvidence: row.evidence.gateEvidence,
          });
          nodes.push(nodeId);
        }
        continue;
      }

      if (sourceArt === "CRAFT"
          || sourceArt === "EXCHANGE"
          || sourceArt === "UPGRADE"
          || sourceArt === "COMPOUND") {
        const kandidaten = anfrage.transformationen
          .filter(x =>
            x.art === sourceArt
            && x.outputName === name
            && x.outputLevel === level)
          .sort((a, b) =>
            a.transformationId.localeCompare(b.transformationId));
        for (const transformation of kandidaten) {
          if (rest <= 0) break;
          if (!evidenceFrisch(
            transformation.beobachtetAmMs,
            transformation.gueltigBisMs,
            jetztMs,
            anfrage.richtlinie.maximalesEvidenceAlterMs,
          )) {
            stalePassendeEvidence = true;
            continue;
          }
          if (pfad.includes(key)) {
            throw new Error("PRODUKTION_PLAN_RECIPE_CYCLE");
          }
          const vorgaenge = Math.ceil(
            rest / transformation.outputMengeProVorgang,
          );
          const deps: string[] = [];
          const naechsterPfad = Object.freeze([...pfad, key]);
          for (const input of transformation.inputs) {
            const inputResult = acquire(
              input.name,
              input.level,
              input.menge * vorgaenge,
              tiefe + 1,
              naechsterPfad,
            );
            deps.push(...inputResult.nodes);
          }
          const produziert =
            transformation.outputMengeProVorgang * vorgaenge;
          const nodeId = neueNodeId(sourceArt.toLowerCase());
          pushSchritt({
            nodeId,
            art: sourceArt,
            abhaengigkeiten: Object.freeze(
              [...new Set(deps)].sort(),
            ),
            outputName: name,
            outputLevel: level,
            outputMenge: produziert,
            operationSchluessel:
              anfrage.produktionsId
              + ":" + sourceArt.toLowerCase()
              + ":" + transformation.transformationId
              + ":" + nodeId,
            workspaceNachweisFingerprint:
              transformation.workspaceNachweisFingerprint,
            gateEvidence: null,
          });
          nodes.push(nodeId);
          rest = Math.max(0, rest - produziert);
        }
      }
    }

    if (rest > 0) {
      if (stalePassendeEvidence) {
        throw new Error("PRODUKTION_PLAN_EVIDENCE_STALE");
      }
      throw new Error(
        "PRODUKTION_PLAN_QUELLE_FEHLT:"
        + name + ":" + String(level) + ":" + String(rest),
      );
    }
    return Object.freeze({
      nodes: Object.freeze([...new Set(nodes)].sort()),
    });
  };

  const root = acquire(
    anfrage.outputName,
    anfrage.outputLevel,
    anfrage.outputMenge,
    0,
    Object.freeze([]),
  );

  const deliveryNodeId = neueNodeId("delivery");
  if (schritte.length >= anfrage.richtlinie.maximaleSchritte) {
    throw new Error("PRODUKTION_PLAN_SCHRITTGRENZE_UEBERSCHRITTEN");
  }
  schritte.push(Object.freeze({
    nodeId: deliveryNodeId,
    art: "DELIVERY",
    abhaengigkeiten: root.nodes,
    outputName: anfrage.outputName,
    outputLevel: anfrage.outputLevel,
    outputMenge: anfrage.outputMenge,
    operationSchluessel: anfrage.produktionsId + ":delivery",
    workspaceNachweisFingerprint: null,
    gateEvidence: null,
  }));

  const bankVerwendet = schritte.some(x => x.art === "BANK_RETRIEVE");
  const graph: ProduktionsGraph = Object.freeze({
    schemaVersion: 1,
    planId: anfrage.planId,
    recipient: Object.freeze({ ...anfrage.recipient }),
    rootNodeId: deliveryNodeId,
    planFingerprint: anfrage.planFingerprint,
    bankKatalog: bankVerwendet ? bankPin : null,
    schritte: Object.freeze(schritte.map(x => Object.freeze({ ...x }))),
  });

  const graphNachweis = pruefeProduktionsGraph(graph, jetztMs);
  if (!graphNachweis.erlaubt) {
    return Object.freeze({
      schemaVersion: 1,
      produktionsId: anfrage.produktionsId,
      ablaufId: anfrage.ablaufId,
      ownerCharacterId: anfrage.ownerCharacterId,
      graph,
      graphNachweis,
      schrittBindungen: Object.freeze(
        graph.schritte.map(x => bindungFuer(x.nodeId, x.art)),
      ),
      bankKatalogPin: bankVerwendet ? bankPin : null,
      planungsNachweis: true,
      ausfuehrungsAutoritaet: false,
      gameplayAutoritaet: false,
      rawWriteAutoritaet: false,
    });
  }

  return Object.freeze({
    schemaVersion: 1,
    produktionsId: anfrage.produktionsId,
    ablaufId: anfrage.ablaufId,
    ownerCharacterId: anfrage.ownerCharacterId,
    graph,
    graphNachweis,
    schrittBindungen: Object.freeze(
      graph.schritte.map(x => bindungFuer(x.nodeId, x.art)),
    ),
    bankKatalogPin: bankVerwendet ? bankPin : null,
    planungsNachweis: true,
    ausfuehrungsAutoritaet: false,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
  });
}
