import type {
  LaufzeitGateKontext,
  LaufzeitGateNachweis,
  LaufzeitGatePort,
} from "../ausfuehrung/ports.js";

export const V5_GESAMTFREIGABE_NACHWEISPFAD =
  "v5/roadmap/gesamtfreigabe.json";
export const V5_GESAMTFREIGABE_BESTAETIGUNG =
  "V5 GESAMTFREIGABE ERTEILEN";

const SHA40 = /^[0-9a-f]{40}$/;
const SICHERHEITS_FLAGS = Object.freeze([
  "capabilitySafetyBleibtErforderlich",
  "operatorDenyBleibtWirksam",
  "killSwitchBleibtWirksam",
  "actionContractsBleibenErforderlich",
  "admissionBleibtErforderlich",
  "freshnessBleibtErforderlich",
  "fencingBleibtErforderlich",
  "durableIntentBleibtErforderlich",
  "unknownReconciliationBleibtErforderlich",
  "learningOhneAuthorityBleibtErforderlich",
] as const);

type JsonObjekt = Readonly<Record<string, unknown>>;

export interface ProduktionsGesamtfreigabeBewertung {
  readonly schemaVersion: 1;
  readonly erlaubt: boolean;
  readonly gruende: readonly string[];
  readonly nachweisId: string;
  readonly releaseCandidateSha: string | null;
}

function alsObjekt(wert: unknown): JsonObjekt | null {
  return wert !== null && typeof wert === "object" && !Array.isArray(wert)
    ? wert as JsonObjekt
    : null;
}

function istText(wert: unknown, maximal = 192): wert is string {
  return typeof wert === "string"
    && wert.trim().length > 0
    && wert.length <= maximal;
}

function istKontextGueltig(kontext: LaufzeitGateKontext | undefined): boolean {
  if (kontext === undefined) return false;
  return [
    kontext.transaktionsId,
    kontext.faehigkeitId,
    kontext.eigentuemerModulId,
    kontext.actionContractId,
    kontext.recoveryContractId,
    kontext.verifierId,
  ].every(wert => istText(wert));
}

export function bewerteProduktionsGesamtfreigabe(
  bereitschaftWert: unknown,
  gesamtfreigabeWert: unknown,
): ProduktionsGesamtfreigabeBewertung {
  const maximaleGruende = 32;
  let gruende: readonly string[] = Object.freeze([]);
  function meldeGrund(grund: string): void {
    if (gruende.length >= maximaleGruende) {
      throw new Error("GESAMTFREIGABE_FEHLERLISTE_VOLL");
    }
    gruende = Object.freeze([...gruende, grund]);
  }
  const bereitschaft = alsObjekt(bereitschaftWert);
  const gesamtfreigabe = alsObjekt(gesamtfreigabeWert);

  if (bereitschaft === null) meldeGrund("LAUFZEIT_BEREITSCHAFT_UNGUELTIG");
  if (gesamtfreigabe === null) meldeGrund("GESAMTFREIGABE_EVIDENCE_UNGUELTIG");

  const freigabe = gesamtfreigabe === null
    ? null
    : alsObjekt(gesamtfreigabe["freigabe"]);
  const sicherheit = gesamtfreigabe === null
    ? null
    : alsObjekt(gesamtfreigabe["sicherheit"]);

  if (gesamtfreigabe !== null) {
    if (gesamtfreigabe["schemaVersion"] !== 1) {
      meldeGrund("GESAMTFREIGABE_SCHEMA_UNGUELTIG");
    }
    if (gesamtfreigabe["kennung"] !== "V5_GESAMTFREIGABE") {
      meldeGrund("GESAMTFREIGABE_KENNUNG_UNGUELTIG");
    }
    if (gesamtfreigabe["status"] !== "ERTEILT") {
      meldeGrund("GESAMTFREIGABE_STATUS_NICHT_ERTEILT");
    }
    if (gesamtfreigabe["bestaetigungQuelle"] !== "BETREIBER_INTERAKTIV") {
      meldeGrund("GESAMTFREIGABE_QUELLE_UNGUELTIG");
    }
    if (gesamtfreigabe["bestaetigungText"] !== V5_GESAMTFREIGABE_BESTAETIGUNG) {
      meldeGrund("GESAMTFREIGABE_BESTAETIGUNG_UNGUELTIG");
    }
    if (gesamtfreigabe["vorbereitung"] !== "v5/roadmap/gesamtfreigabe-vorbereitung.json") {
      meldeGrund("GESAMTFREIGABE_VORBEREITUNG_UNGUELTIG");
    }
  }

  if (freigabe === null) {
    meldeGrund("GESAMTFREIGABE_BLOCK_UNGUELTIG");
  } else {
    if (freigabe["laufzeitBereitschaft"] !== "FREIGEGEBEN") {
      meldeGrund("GESAMTFREIGABE_LAUFZEIT_NICHT_FREIGEGEBEN");
    }
    if (freigabe["breiteRuntimeFreigabe"] !== true) {
      meldeGrund("GESAMTFREIGABE_BREITE_RUNTIME_NICHT_FREIGEGEBEN");
    }
  }

  if (sicherheit === null) {
    meldeGrund("GESAMTFREIGABE_SICHERHEIT_UNGUELTIG");
  } else {
    for (const flag of SICHERHEITS_FLAGS) {
      if (sicherheit[flag] !== true) {
        meldeGrund("GESAMTFREIGABE_SICHERHEIT_FEHLT:" + flag);
      }
    }
  }

  let releaseCandidateSha: string | null = null;
  if (gesamtfreigabe !== null) {
    const sha = gesamtfreigabe["releaseCandidateSha"];
    if (typeof sha === "string" && SHA40.test(sha)) {
      releaseCandidateSha = sha;
    } else {
      meldeGrund("GESAMTFREIGABE_RELEASE_SHA_UNGUELTIG");
    }
  }

  if (bereitschaft !== null) {
    if (bereitschaft["schemaVersion"] !== 1) {
      meldeGrund("LAUFZEIT_BEREITSCHAFT_SCHEMA_UNGUELTIG");
    }
    if (bereitschaft["status"] !== "FREIGEGEBEN") {
      meldeGrund("LAUFZEIT_BEREITSCHAFT_NICHT_FREIGEGEBEN");
    }
    if (bereitschaft["gesamtfreigabe"] !== "ERTEILT") {
      meldeGrund("LAUFZEIT_BEREITSCHAFT_GESAMTFREIGABE_NICHT_ERTEILT");
    }
    if (bereitschaft["breiteRuntimeFreigabe"] !== true) {
      meldeGrund("LAUFZEIT_BEREITSCHAFT_BREITE_RUNTIME_NICHT_FREIGEGEBEN");
    }
    if (bereitschaft["gesamtfreigabeNachweis"] !== V5_GESAMTFREIGABE_NACHWEISPFAD) {
      meldeGrund("LAUFZEIT_BEREITSCHAFT_NACHWEISPFAD_UNGUELTIG");
    }
    const blocker = bereitschaft["offeneBlocker"];
    if (!Array.isArray(blocker) || blocker.length !== 0) {
      meldeGrund("LAUFZEIT_BEREITSCHAFT_BLOCKER_OFFEN");
    }
    if (releaseCandidateSha !== null
        && bereitschaft["gesamtfreigabeReleaseCandidateSha"] !== releaseCandidateSha) {
      meldeGrund("LAUFZEIT_BEREITSCHAFT_RELEASE_SHA_STIMMT_NICHT");
    }
  }

  const erlaubt = gruende.length === 0 && releaseCandidateSha !== null;
  const nachweisId = erlaubt
    ? "V5_GESAMTFREIGABE:" + releaseCandidateSha
    : "V5_GESAMTFREIGABE:BLOCKIERT";

  return Object.freeze({
    schemaVersion: 1,
    erlaubt,
    gruende: Object.freeze([...gruende]),
    nachweisId,
    releaseCandidateSha: erlaubt ? releaseCandidateSha : null,
  });
}

export class ProduktivesV5GesamtfreigabeGate implements LaufzeitGatePort {
  readonly #bewertung: ProduktionsGesamtfreigabeBewertung;
  readonly #generation: number;

  public constructor(
    bereitschaft: unknown,
    gesamtfreigabe: unknown,
    generation: number,
  ) {
    if (!Number.isSafeInteger(generation) || generation < 1) {
      throw new Error("PRODUKTIONS_RUNTIME_GATE_GENERATION_UNGUELTIG");
    }
    this.#generation = generation;
    this.#bewertung = bewerteProduktionsGesamtfreigabe(
      bereitschaft,
      gesamtfreigabe,
    );
  }

  public pruefe(kontext?: LaufzeitGateKontext): LaufzeitGateNachweis {
    if (!this.#bewertung.erlaubt) {
      return Object.freeze({
        freigegeben: false,
        generation: this.#generation,
        nachweisId: this.#bewertung.nachweisId,
      });
    }
    if (!istKontextGueltig(kontext)) {
      return Object.freeze({
        freigegeben: false,
        generation: this.#generation,
        nachweisId: this.#bewertung.nachweisId + ":KONTEXT_UNGUELTIG",
      });
    }
    return Object.freeze({
      freigegeben: true,
      generation: this.#generation,
      nachweisId: this.#bewertung.nachweisId,
    });
  }

  public bewertung(): ProduktionsGesamtfreigabeBewertung {
    return this.#bewertung;
  }
}
