import {
  pruefeProduktionsGraph,
  type ProduktionsGraph,
} from "../produktion/production-graph.js";
import type { ProduktionsZustand } from "../produktion/production-intent.js";
import { evidenceFingerprint } from "./evidence-kette.js";

export type ProduktionsEvidenceKlasse = "SYNTHETISCH" | "LIVE";

export type ProduktionsCoverageKlassifikation =
  | "FULLY_RESOLVED"
  | "DEFERRED_EVENT_INAKTIV"
  | "BLOCKIERT_QUEST_NICHT_ERFUELLT"
  | "STRUCTURAL_GAP";

export interface ProduktionsCoverageFall {
  readonly schemaVersion: 1;
  readonly fallId: string;
  readonly zielId: string;
  readonly evidenceKlasse: ProduktionsEvidenceKlasse;
  readonly evidenceId: string;
  readonly graph: ProduktionsGraph | null;
  readonly planFehler: string | null;
}

export interface ProduktionsCoverageAuditAnfrage {
  readonly schemaVersion: 1;
  readonly auditId: string;
  readonly katalogFingerprint: string;
  readonly erwarteteZiele: number;
  readonly faelle: readonly ProduktionsCoverageFall[];
}

export interface ProduktionsCoverageFallNachweis {
  readonly fallId: string;
  readonly zielId: string;
  readonly evidenceKlasse: ProduktionsEvidenceKlasse;
  readonly evidenceId: string;
  readonly klassifikation: ProduktionsCoverageKlassifikation;
  readonly grund: string | null;
}

export interface ProduktionsCoverageAudit {
  readonly schemaVersion: 1;
  readonly auditId: string;
  readonly katalogFingerprint: string;
  readonly erwarteteZiele: number;
  readonly gepruefteZiele: number;
  readonly fullyResolved: number;
  readonly deferredEventInaktiv: number;
  readonly blockiertQuest: number;
  readonly structuralGaps: number;
  readonly syntheticEvidenceFaelle: number;
  readonly liveEvidenceFaelle: number;
  readonly bestanden: boolean;
  readonly faelle: readonly ProduktionsCoverageFallNachweis[];
  readonly diagnosticOnly: true;
  readonly actionAuthority: false;
  readonly rawWriteAuthority: false;
}

export type ProduktionsIrreversibleArt =
  | "BANK_RETRIEVE"
  | "BUY"
  | "CRAFT"
  | "EXCHANGE"
  | "UPGRADE"
  | "COMPOUND"
  | "DELIVERY";

export interface ProduktionsIrreversibleOperation {
  readonly art: ProduktionsIrreversibleArt;
  readonly operationSchluessel: string;
  readonly postconditionVerifiziert: boolean;
}

export interface ProduktionsSoakSampleBasis {
  readonly schemaVersion: 1;
  readonly sequenz: number;
  readonly zeitMs: number;
  readonly evidenceKlasse: ProduktionsEvidenceKlasse;
  readonly evidenceId: string;
  readonly vorherigerFingerprint: string | null;
  readonly produktionsId: string;
  readonly planFingerprint: string;
  readonly zustand: ProduktionsZustand;
  readonly sameIntentErneutSenden: false;
  readonly recipientSettlementVerifiziert: boolean;
  readonly offeneAufgaben: number;
  readonly offeneMaterialziele: number;
  readonly offeneMutationDemand: number;
  readonly offeneExchangeDemand: number;
  readonly gateVerletzungen: number;
  readonly protectedTransferOhneAutorisierung: number;
  readonly zertifiziererGameplayWrites: number;
  readonly irreversibleOperationen:
    readonly ProduktionsIrreversibleOperation[];
}

export interface ProduktionsSoakSample extends ProduktionsSoakSampleBasis {
  readonly sampleFingerprint: string;
}

export interface ProduktionsSoakGrenzen {
  readonly maximaleSamples: number;
  readonly maximalerSampleAbstandMs: number;
  readonly minimaleSyntheticSamples: number;
  readonly minimaleLiveSamples: number;
  readonly minimaleLiveDauerMs: number;
}

export interface ProduktionsSoakNachweis {
  readonly schemaVersion: 1;
  readonly evidenceKlasse: ProduktionsEvidenceKlasse;
  readonly sampleAnzahl: number;
  readonly dauerMs: number;
  readonly sampleGaps: number;
  readonly fingerprintFehler: number;
  readonly duplicateIrreversibleEffects: number;
  readonly unverifiedIrreversibleEffects: number;
  readonly invariantViolations: number;
  readonly bestanden: boolean;
  readonly syntheticRegressionBestanden: boolean;
  readonly liveBeweisBestanden: boolean;
  readonly synthetischeEvidenceZaehltAlsLive: false;
  readonly ersterFingerprint: string;
  readonly letzterFingerprint: string;
  readonly diagnosticOnly: true;
  readonly actionAuthority: false;
  readonly rawWriteAuthority: false;
}

export interface ProduktionsZertifizierungsGate {
  readonly schemaVersion: 1;
  readonly coverageBestanden: boolean;
  readonly syntheticRegressionBestanden: boolean;
  readonly liveSoakBestanden: boolean;
  readonly bereit: boolean;
  readonly blocker: readonly string[];
  readonly synthetischeEvidenceZaehltAlsLive: false;
  readonly diagnosticOnly: true;
  readonly actionAuthority: false;
  readonly rawWriteAuthority: false;
  readonly breiteRuntimeFreigabe: false;
}

const IRREVERSIBLE_ARTEN:
  readonly ProduktionsIrreversibleArt[] = Object.freeze([
    "BANK_RETRIEVE",
    "BUY",
    "CRAFT",
    "EXCHANGE",
    "UPGRADE",
    "COMPOUND",
    "DELIVERY",
  ]);

const PRODUKTIONS_ZUSTAENDE: readonly ProduktionsZustand[] =
  Object.freeze([
    "GEPLANT",
    "HERSTELLUNG_IN_FLIGHT",
    "OUTPUT_BEREIT",
    "LIEFERUNG_AUSSTEHEND",
    "RECIPIENT_SETTLED",
    "COMMITTED",
    "RECOVERY_PENDING",
    "FAILED_SAFE",
  ]);

function pruefeText(
  wert: string,
  fehler: string,
  maximum = 192,
): void {
  if (wert.trim().length === 0 || wert.length > maximum) {
    throw new Error(fehler);
  }
}

function pruefeNichtNegativGanzzahl(
  wert: number,
  fehler: string,
): void {
  if (!Number.isSafeInteger(wert) || wert < 0) {
    throw new Error(fehler);
  }
}

function fehlerText(fehler: unknown): string {
  if (fehler instanceof Error && fehler.message.trim().length > 0) {
    return fehler.message.slice(0, 240);
  }
  return "UNBEKANNTER_PRODUKTIONS_GRAPH_FEHLER";
}

function friereCoverageNachweis(
  nachweis: ProduktionsCoverageFallNachweis,
): ProduktionsCoverageFallNachweis {
  return Object.freeze({ ...nachweis });
}

export function auditiereProduktionsCoverage(
  anfrage: ProduktionsCoverageAuditAnfrage,
  jetztMs: number,
): ProduktionsCoverageAudit {
  if (anfrage.schemaVersion !== 1) {
    throw new Error("PRODUKTION_COVERAGE_SCHEMA_UNGUELTIG");
  }
  pruefeText(anfrage.auditId, "PRODUKTION_COVERAGE_AUDIT_ID_UNGUELTIG");
  pruefeText(
    anfrage.katalogFingerprint,
    "PRODUKTION_COVERAGE_KATALOG_FP_UNGUELTIG",
  );
  if (!Number.isSafeInteger(jetztMs) || jetztMs < 0) {
    throw new Error("PRODUKTION_COVERAGE_ZEIT_UNGUELTIG");
  }
  if (!Number.isSafeInteger(anfrage.erwarteteZiele)
      || anfrage.erwarteteZiele < 1
      || anfrage.erwarteteZiele > 2_048
      || anfrage.faelle.length !== anfrage.erwarteteZiele) {
    throw new Error("PRODUKTION_COVERAGE_ZIELMENGE_UNGUELTIG");
  }

  const nachweise = anfrage.faelle.map((fall, index) => {
    if (fall.schemaVersion !== 1) {
      throw new Error("PRODUKTION_COVERAGE_FALL_SCHEMA_UNGUELTIG");
    }
    for (const text of [fall.fallId, fall.zielId, fall.evidenceId]) {
      pruefeText(text, "PRODUKTION_COVERAGE_FALL_TEXT_UNGUELTIG");
    }
    if (fall.evidenceKlasse !== "SYNTHETISCH"
        && fall.evidenceKlasse !== "LIVE") {
      throw new Error("PRODUKTION_COVERAGE_EVIDENCE_KLASSE_UNGUELTIG");
    }
    if (anfrage.faelle.slice(0, index).some(
      x => x.fallId === fall.fallId || x.zielId === fall.zielId,
    )) {
      throw new Error("PRODUKTION_COVERAGE_FALL_ODER_ZIEL_DOPPELT");
    }
    const hatGraph = fall.graph !== null;
    const hatPlanFehler = fall.planFehler !== null;
    if (hatGraph === hatPlanFehler) {
      throw new Error("PRODUKTION_COVERAGE_FALL_EVIDENCE_MEHRDEUTIG");
    }

    if (fall.planFehler !== null) {
      pruefeText(
        fall.planFehler,
        "PRODUKTION_COVERAGE_PLAN_FEHLER_UNGUELTIG",
        240,
      );
      return friereCoverageNachweis({
        fallId: fall.fallId,
        zielId: fall.zielId,
        evidenceKlasse: fall.evidenceKlasse,
        evidenceId: fall.evidenceId,
        klassifikation: "STRUCTURAL_GAP",
        grund: fall.planFehler,
      });
    }

    const graph = fall.graph;
    if (graph === null) {
      throw new Error("PRODUKTION_COVERAGE_GRAPH_FEHLT");
    }

    try {
      const graphNachweis = pruefeProduktionsGraph(graph, jetztMs);
      if (graphNachweis.status === "BEREIT") {
        return friereCoverageNachweis({
          fallId: fall.fallId,
          zielId: fall.zielId,
          evidenceKlasse: fall.evidenceKlasse,
          evidenceId: fall.evidenceId,
          klassifikation: "FULLY_RESOLVED",
          grund: null,
        });
      }
      if (graphNachweis.status === "DEFERRED_EVENT_INAKTIV") {
        return friereCoverageNachweis({
          fallId: fall.fallId,
          zielId: fall.zielId,
          evidenceKlasse: fall.evidenceKlasse,
          evidenceId: fall.evidenceId,
          klassifikation: "DEFERRED_EVENT_INAKTIV",
          grund: "KNOWN_EVENT_INAKTIV",
        });
      }
      return friereCoverageNachweis({
        fallId: fall.fallId,
        zielId: fall.zielId,
        evidenceKlasse: fall.evidenceKlasse,
        evidenceId: fall.evidenceId,
        klassifikation: "BLOCKIERT_QUEST_NICHT_ERFUELLT",
        grund: "QUEST_GATE_NICHT_ERFUELLT",
      });
    } catch (fehler) {
      return friereCoverageNachweis({
        fallId: fall.fallId,
        zielId: fall.zielId,
        evidenceKlasse: fall.evidenceKlasse,
        evidenceId: fall.evidenceId,
        klassifikation: "STRUCTURAL_GAP",
        grund: fehlerText(fehler),
      });
    }
  });

  const fullyResolved = nachweise.filter(
    x => x.klassifikation === "FULLY_RESOLVED",
  ).length;
  const deferredEventInaktiv = nachweise.filter(
    x => x.klassifikation === "DEFERRED_EVENT_INAKTIV",
  ).length;
  const blockiertQuest = nachweise.filter(
    x => x.klassifikation === "BLOCKIERT_QUEST_NICHT_ERFUELLT",
  ).length;
  const structuralGaps = nachweise.filter(
    x => x.klassifikation === "STRUCTURAL_GAP",
  ).length;
  const syntheticEvidenceFaelle = nachweise.filter(
    x => x.evidenceKlasse === "SYNTHETISCH",
  ).length;
  const liveEvidenceFaelle = nachweise.filter(
    x => x.evidenceKlasse === "LIVE",
  ).length;

  return Object.freeze({
    schemaVersion: 1,
    auditId: anfrage.auditId,
    katalogFingerprint: anfrage.katalogFingerprint,
    erwarteteZiele: anfrage.erwarteteZiele,
    gepruefteZiele: nachweise.length,
    fullyResolved,
    deferredEventInaktiv,
    blockiertQuest,
    structuralGaps,
    syntheticEvidenceFaelle,
    liveEvidenceFaelle,
    bestanden: structuralGaps === 0 && blockiertQuest === 0,
    faelle: Object.freeze(nachweise.map(x => friereCoverageNachweis(x))),
    diagnosticOnly: true,
    actionAuthority: false,
    rawWriteAuthority: false,
  });
}

function validiereIrreversibleOperation(
  operation: ProduktionsIrreversibleOperation,
): void {
  if (!IRREVERSIBLE_ARTEN.includes(operation.art)) {
    throw new Error("PRODUKTION_SOAK_OPERATION_ART_UNGUELTIG");
  }
  pruefeText(
    operation.operationSchluessel,
    "PRODUKTION_SOAK_OPERATION_KEY_UNGUELTIG",
  );
  if (typeof operation.postconditionVerifiziert !== "boolean") {
    throw new Error("PRODUKTION_SOAK_POSTCONDITION_UNGUELTIG");
  }
}

function sampleBasisFuerFingerprint(
  sample: ProduktionsSoakSampleBasis,
): ProduktionsSoakSampleBasis {
  return Object.freeze({
    ...sample,
    irreversibleOperationen: Object.freeze(
      sample.irreversibleOperationen.map(
        x => Object.freeze({ ...x }),
      ),
    ),
  });
}

export function erstelleProduktionsSoakSample(
  basis: ProduktionsSoakSampleBasis,
): ProduktionsSoakSample {
  if (basis.schemaVersion !== 1
      || !Number.isSafeInteger(basis.sequenz)
      || basis.sequenz < 1
      || !Number.isSafeInteger(basis.zeitMs)
      || basis.zeitMs < 0
      || (basis.evidenceKlasse !== "SYNTHETISCH"
        && basis.evidenceKlasse !== "LIVE")
      || !PRODUKTIONS_ZUSTAENDE.includes(basis.zustand)
      || basis.sameIntentErneutSenden !== false
      || typeof basis.recipientSettlementVerifiziert !== "boolean") {
    throw new Error("PRODUKTION_SOAK_SAMPLE_KOPF_UNGUELTIG");
  }
  for (const text of [
    basis.evidenceId,
    basis.produktionsId,
    basis.planFingerprint,
  ]) {
    pruefeText(text, "PRODUKTION_SOAK_SAMPLE_TEXT_UNGUELTIG");
  }
  if (basis.vorherigerFingerprint !== null
      && !/^[0-9a-f]{16}$/.test(basis.vorherigerFingerprint)) {
    throw new Error("PRODUKTION_SOAK_VORHER_FINGERPRINT_UNGUELTIG");
  }
  for (const [wert, fehler] of [
    [basis.offeneAufgaben, "PRODUKTION_SOAK_AUFGABEN_UNGUELTIG"],
    [
      basis.offeneMaterialziele,
      "PRODUKTION_SOAK_MATERIALZIELE_UNGUELTIG",
    ],
    [
      basis.offeneMutationDemand,
      "PRODUKTION_SOAK_MUTATION_DEMAND_UNGUELTIG",
    ],
    [
      basis.offeneExchangeDemand,
      "PRODUKTION_SOAK_EXCHANGE_DEMAND_UNGUELTIG",
    ],
    [basis.gateVerletzungen, "PRODUKTION_SOAK_GATE_VERLETZUNG_UNGUELTIG"],
    [
      basis.protectedTransferOhneAutorisierung,
      "PRODUKTION_SOAK_TRANSFER_AUTORISIERUNG_UNGUELTIG",
    ],
    [
      basis.zertifiziererGameplayWrites,
      "PRODUKTION_SOAK_CERTIFIER_WRITES_UNGUELTIG",
    ],
  ] as const) {
    pruefeNichtNegativGanzzahl(wert, fehler);
  }
  if (basis.irreversibleOperationen.length > 32) {
    throw new Error("PRODUKTION_SOAK_OPERATIONEN_ZU_VIELE");
  }
  for (let index = 0;
    index < basis.irreversibleOperationen.length;
    index += 1) {
    const operation = basis.irreversibleOperationen[index];
    if (operation === undefined) {
      throw new Error("PRODUKTION_SOAK_OPERATION_FEHLT");
    }
    validiereIrreversibleOperation(operation);
    if (basis.irreversibleOperationen.slice(0, index).some(
      x => x.operationSchluessel === operation.operationSchluessel,
    )) {
      throw new Error("PRODUKTION_SOAK_OPERATION_KEY_DOPPELT_IM_SAMPLE");
    }
  }

  const eingefroren = sampleBasisFuerFingerprint(basis);
  return Object.freeze({
    ...eingefroren,
    sampleFingerprint: evidenceFingerprint(eingefroren),
  });
}

function validiereSoakGrenzen(
  grenzen: ProduktionsSoakGrenzen,
): void {
  for (const [wert, minimum, maximum, fehler] of [
    [
      grenzen.maximaleSamples,
      1,
      5_000,
      "PRODUKTION_SOAK_MAX_SAMPLES_UNGUELTIG",
    ],
    [
      grenzen.maximalerSampleAbstandMs,
      1,
      60 * 60 * 1000,
      "PRODUKTION_SOAK_SAMPLE_GAP_GRENZE_UNGUELTIG",
    ],
    [
      grenzen.minimaleSyntheticSamples,
      1,
      5_000,
      "PRODUKTION_SOAK_MIN_SYNTHETIC_UNGUELTIG",
    ],
    [
      grenzen.minimaleLiveSamples,
      1,
      5_000,
      "PRODUKTION_SOAK_MIN_LIVE_UNGUELTIG",
    ],
    [
      grenzen.minimaleLiveDauerMs,
      1,
      24 * 60 * 60 * 1000,
      "PRODUKTION_SOAK_MIN_LIVE_DAUER_UNGUELTIG",
    ],
  ] as const) {
    if (!Number.isSafeInteger(wert) || wert < minimum || wert > maximum) {
      throw new Error(fehler);
    }
  }
  if (grenzen.minimaleSyntheticSamples > grenzen.maximaleSamples
      || grenzen.minimaleLiveSamples > grenzen.maximaleSamples) {
    throw new Error("PRODUKTION_SOAK_MIN_GROESSER_MAX");
  }
}

function sampleInvariantVerletzt(
  sample: ProduktionsSoakSample,
): boolean {
  const committed = sample.zustand === "COMMITTED";
  const recoveryPending = sample.zustand === "RECOVERY_PENDING";
  const resteNachCommit = sample.offeneAufgaben
    + sample.offeneMaterialziele
    + sample.offeneMutationDemand
    + sample.offeneExchangeDemand;

  return sample.sameIntentErneutSenden !== false
    || sample.gateVerletzungen !== 0
    || sample.protectedTransferOhneAutorisierung !== 0
    || sample.zertifiziererGameplayWrites !== 0
    || (recoveryPending && sample.irreversibleOperationen.length > 0)
    || (committed && !sample.recipientSettlementVerifiziert)
    || (committed && resteNachCommit !== 0);
}

export function bewerteProduktionsSoak(
  samples: readonly ProduktionsSoakSample[],
  grenzen: ProduktionsSoakGrenzen,
): ProduktionsSoakNachweis {
  validiereSoakGrenzen(grenzen);
  if (samples.length < 1 || samples.length > grenzen.maximaleSamples) {
    throw new Error("PRODUKTION_SOAK_SERIE_GROESSE_UNGUELTIG");
  }

  const evidenceKlasse = samples[0]?.evidenceKlasse;
  if (evidenceKlasse === undefined) {
    throw new Error("PRODUKTION_SOAK_SERIE_LEER");
  }
  if (samples.some(x => x.evidenceKlasse !== evidenceKlasse)) {
    throw new Error("PRODUKTION_SOAK_SYNTHETISCH_LIVE_GEMISCHT");
  }

  let sampleGaps = 0;
  let fingerprintFehler = 0;
  let unverifiedIrreversibleEffects = 0;
  let invariantViolations = 0;

  for (let index = 0; index < samples.length; index += 1) {
    const sample = samples[index];
    if (sample === undefined) {
      throw new Error("PRODUKTION_SOAK_SAMPLE_FEHLT");
    }
    const vorher = index === 0 ? undefined : samples[index - 1];
    if (sample.sequenz !== index + 1
        || (vorher !== undefined
          && (sample.zeitMs <= vorher.zeitMs
            || sample.zeitMs - vorher.zeitMs
              > grenzen.maximalerSampleAbstandMs))) {
      sampleGaps += 1;
    }
    const erwarteterVorher = vorher?.sampleFingerprint ?? null;
    if (sample.vorherigerFingerprint !== erwarteterVorher) {
      fingerprintFehler += 1;
    }
    const basis: ProduktionsSoakSampleBasis = Object.freeze({
      schemaVersion: sample.schemaVersion,
      sequenz: sample.sequenz,
      zeitMs: sample.zeitMs,
      evidenceKlasse: sample.evidenceKlasse,
      evidenceId: sample.evidenceId,
      vorherigerFingerprint: sample.vorherigerFingerprint,
      produktionsId: sample.produktionsId,
      planFingerprint: sample.planFingerprint,
      zustand: sample.zustand,
      sameIntentErneutSenden: sample.sameIntentErneutSenden,
      recipientSettlementVerifiziert:
        sample.recipientSettlementVerifiziert,
      offeneAufgaben: sample.offeneAufgaben,
      offeneMaterialziele: sample.offeneMaterialziele,
      offeneMutationDemand: sample.offeneMutationDemand,
      offeneExchangeDemand: sample.offeneExchangeDemand,
      gateVerletzungen: sample.gateVerletzungen,
      protectedTransferOhneAutorisierung:
        sample.protectedTransferOhneAutorisierung,
      zertifiziererGameplayWrites: sample.zertifiziererGameplayWrites,
      irreversibleOperationen: Object.freeze(
        sample.irreversibleOperationen.map(
          x => Object.freeze({ ...x }),
        ),
      ),
    });
    if (sample.sampleFingerprint !== evidenceFingerprint(basis)) {
      fingerprintFehler += 1;
    }
    if (sample.irreversibleOperationen.some(
      x => !x.postconditionVerifiziert,
    )) {
      unverifiedIrreversibleEffects += 1;
    }
    if (sampleInvariantVerletzt(sample)) {
      invariantViolations += 1;
    }
  }

  const operationKeys = samples
    .flatMap(sample => sample.irreversibleOperationen.map(
      operation => operation.operationSchluessel,
    ))
    .sort();
  const duplicateIrreversibleEffects = operationKeys.filter(
    (key, index) => index > 0 && key === operationKeys[index - 1],
  ).length;

  const erster = samples[0];
  const letzter = samples.at(-1);
  if (erster === undefined || letzter === undefined) {
    throw new Error("PRODUKTION_SOAK_SERIE_LEER");
  }
  const dauerMs = letzter.zeitMs - erster.zeitMs;
  const basisBestanden = sampleGaps === 0
    && fingerprintFehler === 0
    && duplicateIrreversibleEffects === 0
    && unverifiedIrreversibleEffects === 0
    && invariantViolations === 0;

  const syntheticRegressionBestanden =
    evidenceKlasse === "SYNTHETISCH"
    && basisBestanden
    && samples.length >= grenzen.minimaleSyntheticSamples;

  const liveBeweisBestanden =
    evidenceKlasse === "LIVE"
    && basisBestanden
    && samples.length >= grenzen.minimaleLiveSamples
    && dauerMs >= grenzen.minimaleLiveDauerMs;

  return Object.freeze({
    schemaVersion: 1,
    evidenceKlasse,
    sampleAnzahl: samples.length,
    dauerMs,
    sampleGaps,
    fingerprintFehler,
    duplicateIrreversibleEffects,
    unverifiedIrreversibleEffects,
    invariantViolations,
    bestanden: evidenceKlasse === "SYNTHETISCH"
      ? syntheticRegressionBestanden
      : liveBeweisBestanden,
    syntheticRegressionBestanden,
    liveBeweisBestanden,
    synthetischeEvidenceZaehltAlsLive: false,
    ersterFingerprint: erster.sampleFingerprint,
    letzterFingerprint: letzter.sampleFingerprint,
    diagnosticOnly: true,
    actionAuthority: false,
    rawWriteAuthority: false,
  });
}

export function bewerteProduktionsZertifizierungsGate(
  coverage: ProduktionsCoverageAudit,
  syntheticSoak: ProduktionsSoakNachweis,
  liveSoak: ProduktionsSoakNachweis | null,
): ProduktionsZertifizierungsGate {
  if (coverage.schemaVersion !== 1
      || syntheticSoak.schemaVersion !== 1
      || (liveSoak !== null && liveSoak.schemaVersion !== 1)) {
    throw new Error("PRODUKTION_ZERT_GATE_SCHEMA_UNGUELTIG");
  }
  if (syntheticSoak.evidenceKlasse !== "SYNTHETISCH") {
    throw new Error("PRODUKTION_ZERT_GATE_SYNTHETIC_SOAK_FEHLT");
  }
  if (liveSoak !== null && liveSoak.evidenceKlasse !== "LIVE") {
    throw new Error("PRODUKTION_ZERT_GATE_LIVE_SOAK_FALSCHE_KLASSE");
  }

  const blocker = Object.freeze([
    ...(coverage.bestanden ? [] : ["COVERAGE_NICHT_BESTANDEN"]),
    ...(syntheticSoak.syntheticRegressionBestanden
      ? []
      : ["SYNTHETIC_REGRESSION_NICHT_BESTANDEN"]),
    ...(liveSoak?.liveBeweisBestanden === true
      ? []
      : ["LIVE_SOAK_FEHLT_ODER_NICHT_BESTANDEN"]),
  ]);

  return Object.freeze({
    schemaVersion: 1,
    coverageBestanden: coverage.bestanden,
    syntheticRegressionBestanden:
      syntheticSoak.syntheticRegressionBestanden,
    liveSoakBestanden: liveSoak?.liveBeweisBestanden === true,
    bereit: blocker.length === 0,
    blocker,
    synthetischeEvidenceZaehltAlsLive: false,
    diagnosticOnly: true,
    actionAuthority: false,
    rawWriteAuthority: false,
    breiteRuntimeFreigabe: false,
  });
}
