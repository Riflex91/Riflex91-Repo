import type { CharacterZielBindung } from "../koordination/roster-wahrheit.js";
import {
  istBankKatalogPinFrisch,
  type BankKatalogPin,
} from "./bank-katalog.js";

export type ProduktionsSchrittArt =
  | "BANK_RETRIEVE"
  | "BUY"
  | "FARM"
  | "QUEST"
  | "EVENT"
  | "CRAFT"
  | "EXCHANGE"
  | "UPGRADE"
  | "COMPOUND"
  | "DELIVERY";

export interface ProduktionsGateEvidence {
  readonly schemaVersion: 1;
  readonly gateArt: "EVENT" | "QUEST";
  readonly gateId: string;
  readonly aktiv: boolean;
  readonly beobachtetAmMs: number;
  readonly gueltigBisMs: number;
  readonly fingerprint: string;
}

export interface ProduktionsSchritt {
  readonly nodeId: string;
  readonly art: ProduktionsSchrittArt;
  readonly abhaengigkeiten: readonly string[];
  readonly outputName: string;
  readonly outputLevel: number;
  readonly outputMenge: number;
  readonly operationSchluessel: string | null;
  readonly workspaceNachweisFingerprint: string | null;
  readonly gateEvidence: ProduktionsGateEvidence | null;
}

export interface ProduktionsGraph {
  readonly schemaVersion: 1;
  readonly planId: string;
  readonly recipient: CharacterZielBindung;
  readonly rootNodeId: string;
  readonly planFingerprint: string;
  readonly bankKatalog: BankKatalogPin | null;
  readonly schritte: readonly ProduktionsSchritt[];
}

export type ProduktionsGraphStatus =
  | "BEREIT"
  | "DEFERRED_EVENT_INAKTIV"
  | "BLOCKIERT_QUEST_NICHT_ERFUELLT";

export interface ProduktionsGraphNachweis {
  readonly erlaubt: boolean;
  readonly status: ProduktionsGraphStatus;
  readonly reihenfolge: readonly string[];
  readonly actionAuthority: false;
  readonly rawWriteAuthority: false;
}

const MUTATIONEN = ["CRAFT", "EXCHANGE", "UPGRADE", "COMPOUND"] as const;
const IRREVERSIBEL = ["BANK_RETRIEVE", "BUY", "CRAFT", "EXCHANGE", "UPGRADE", "COMPOUND", "DELIVERY"] as const;

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function pruefeGate(gate: ProduktionsGateEvidence, jetztMs: number, erwarteteArt: "EVENT" | "QUEST"): void {
  if (gate.schemaVersion !== 1 || gate.gateArt !== erwarteteArt) {
    throw new Error("PRODUKTION_GATE_SCHEMA_ODER_ART_UNGUELTIG");
  }
  for (const text of [gate.gateId, gate.fingerprint]) {
    pruefeText(text, "PRODUKTION_GATE_TEXT_UNGUELTIG");
  }
  if (!Number.isSafeInteger(gate.beobachtetAmMs)
      || !Number.isSafeInteger(gate.gueltigBisMs)
      || gate.beobachtetAmMs < 0
      || gate.gueltigBisMs < gate.beobachtetAmMs
      || jetztMs < gate.beobachtetAmMs
      || jetztMs > gate.gueltigBisMs) {
    throw new Error("PRODUKTION_GATE_STALE");
  }
}

function topologisch(schritte: readonly ProduktionsSchritt[]): readonly string[] {
  let erledigt: readonly string[] = Object.freeze([]);
  for (let runde = 0; runde < schritte.length; runde += 1) {
    const bereit = schritte.filter(x =>
      !erledigt.includes(x.nodeId)
      && x.abhaengigkeiten.every(id => erledigt.includes(id)));
    if (bereit.length === 0) break;
    erledigt = Object.freeze([
      ...erledigt,
      ...bereit.map(x => x.nodeId).sort(),
    ]);
  }
  if (erledigt.length !== schritte.length) throw new Error("PRODUKTION_GRAPH_RECIPE_CYCLE");
  return erledigt;
}

export function pruefeProduktionsGraph(
  graph: ProduktionsGraph,
  jetztMs: number,
): ProduktionsGraphNachweis {
  if (graph.schemaVersion !== 1 || graph.recipient.schemaVersion !== 1) {
    throw new Error("PRODUKTION_GRAPH_SCHEMA_UNGUELTIG");
  }
  for (const text of [
    graph.planId,
    graph.rootNodeId,
    graph.planFingerprint,
    graph.recipient.characterId,
    graph.recipient.sessionId,
    graph.recipient.serverRegion,
    graph.recipient.serverIdentifier,
  ]) pruefeText(text, "PRODUKTION_GRAPH_TEXT_UNGUELTIG");
  if (!Number.isSafeInteger(jetztMs) || jetztMs < 0) throw new Error("PRODUKTION_GRAPH_ZEIT_UNGUELTIG");
  if (graph.schritte.length < 1 || graph.schritte.length > 128) {
    throw new Error("PRODUKTION_GRAPH_GROESSE_UNGUELTIG");
  }

  for (let index = 0; index < graph.schritte.length; index += 1) {
    const schritt = graph.schritte[index];
    if (schritt === undefined) throw new Error("PRODUKTION_GRAPH_SCHRITT_FEHLT");
    for (const text of [schritt.nodeId, schritt.outputName]) {
      pruefeText(text, "PRODUKTION_GRAPH_SCHRITT_TEXT_UNGUELTIG");
    }
    if (!["BANK_RETRIEVE", "BUY", "FARM", "QUEST", "EVENT", "CRAFT",
      "EXCHANGE", "UPGRADE", "COMPOUND", "DELIVERY"].includes(schritt.art)) {
      throw new Error("PRODUKTION_GRAPH_SCHRITT_ART_UNGUELTIG");
    }
    if (!Number.isInteger(schritt.outputLevel)
        || schritt.outputLevel < 0
        || schritt.outputLevel > 99
        || !Number.isInteger(schritt.outputMenge)
        || schritt.outputMenge < 1
        || schritt.outputMenge > 1_000_000
        || schritt.abhaengigkeiten.length > 32) {
      throw new Error("PRODUKTION_GRAPH_SCHRITT_ZAHL_UNGUELTIG");
    }
    if (graph.schritte.slice(0, index).some(x => x.nodeId === schritt.nodeId)) {
      throw new Error("PRODUKTION_GRAPH_NODE_DOPPELT");
    }
    for (let depIndex = 0; depIndex < schritt.abhaengigkeiten.length; depIndex += 1) {
      const dep = schritt.abhaengigkeiten[depIndex];
      if (dep === undefined) throw new Error("PRODUKTION_GRAPH_DEP_FEHLT");
      pruefeText(dep, "PRODUKTION_GRAPH_DEP_UNGUELTIG");
      if (dep === schritt.nodeId) throw new Error("PRODUKTION_GRAPH_SELF_CYCLE");
      if (schritt.abhaengigkeiten.slice(0, depIndex).includes(dep)) {
        throw new Error("PRODUKTION_GRAPH_DEP_DOPPELT");
      }
    }
    if (schritt.operationSchluessel !== null) {
      pruefeText(schritt.operationSchluessel, "PRODUKTION_OPERATION_SCHLUESSEL_UNGUELTIG");
    }
    if (MUTATIONEN.includes(schritt.art as typeof MUTATIONEN[number])
        && schritt.workspaceNachweisFingerprint === null) {
      throw new Error("PRODUKTION_MUTATION_OHNE_WORKSPACE_NACHWEIS");
    }
    if (schritt.workspaceNachweisFingerprint !== null) {
      pruefeText(
        schritt.workspaceNachweisFingerprint,
        "PRODUKTION_WORKSPACE_NACHWEIS_UNGUELTIG",
      );
    }
    if (IRREVERSIBEL.includes(schritt.art as typeof IRREVERSIBEL[number])
        && schritt.operationSchluessel === null) {
      throw new Error("PRODUKTION_IRREVERSIBEL_OHNE_OPERATIONSSCHLUESSEL");
    }
    if (schritt.operationSchluessel !== null
        && graph.schritte.slice(0, index).some(x =>
          x.operationSchluessel === schritt.operationSchluessel)) {
      throw new Error("PRODUKTION_OPERATIONSSCHLUESSEL_DOPPELT");
    }
  }

  if (!graph.schritte.some(x => x.nodeId === graph.rootNodeId)) {
    throw new Error("PRODUKTION_GRAPH_ROOT_FEHLT");
  }
  for (const schritt of graph.schritte) {
    if (schritt.abhaengigkeiten.some(id => !graph.schritte.some(x => x.nodeId === id))) {
      throw new Error("PRODUKTION_GRAPH_DEP_UNBEKANNT");
    }
  }
  if (graph.schritte.some(x => x.art === "BANK_RETRIEVE")) {
    if (graph.bankKatalog === null || !istBankKatalogPinFrisch(graph.bankKatalog, jetztMs)) {
      throw new Error("PRODUKTION_BANK_KATALOG_STALE_ODER_FEHLT");
    }
  }

  const reihenfolge = topologisch(graph.schritte);
  for (const schritt of graph.schritte) {
    if (schritt.art === "EVENT") {
      if (schritt.gateEvidence === null) throw new Error("PRODUKTION_EVENT_GATE_FEHLT");
      pruefeGate(schritt.gateEvidence, jetztMs, "EVENT");
      if (!schritt.gateEvidence.aktiv) {
        return Object.freeze({
          erlaubt: false,
          status: "DEFERRED_EVENT_INAKTIV",
          reihenfolge: Object.freeze([...reihenfolge]),
          actionAuthority: false,
          rawWriteAuthority: false,
        });
      }
    }
    if (schritt.art === "QUEST") {
      if (schritt.gateEvidence === null) throw new Error("PRODUKTION_QUEST_GATE_FEHLT");
      pruefeGate(schritt.gateEvidence, jetztMs, "QUEST");
      if (!schritt.gateEvidence.aktiv) {
        return Object.freeze({
          erlaubt: false,
          status: "BLOCKIERT_QUEST_NICHT_ERFUELLT",
          reihenfolge: Object.freeze([...reihenfolge]),
          actionAuthority: false,
          rawWriteAuthority: false,
        });
      }
    }
  }

  return Object.freeze({
    erlaubt: true,
    status: "BEREIT",
    reihenfolge: Object.freeze([...reihenfolge]),
    actionAuthority: false,
    rawWriteAuthority: false,
  });
}
