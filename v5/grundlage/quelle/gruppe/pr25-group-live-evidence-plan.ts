export interface Pr25CapabilityEvidenceRequirement {
  readonly capabilityId: string;
  readonly neuZuPruefen: boolean;
}

export interface Pr25GruppenLiveEvidenceRequest {
  readonly schemaVersion: 1;
  readonly topologyId: string;
  readonly capabilities: readonly Pr25CapabilityEvidenceRequirement[];
  readonly integrationRequired: boolean;
}

export interface Pr25LiveEvidenceSegment {
  readonly segmentId: string;
  readonly art: "CAPABILITY_5M" | "INTEGRATION_15M";
  readonly capabilityId: string | null;
  readonly dauerSekunden: number;
  readonly erwarteteGameplayWrites: "NUR_RATIFIZIERTE_CAPABILITIES";
  readonly unerwarteteGameplayWritesErlaubt: false;
  readonly safetyViolationErlaubt: false;
}

export interface Pr25GruppenLiveEvidencePlan {
  readonly schemaVersion: 1;
  readonly status: "PLAN_BEREIT_NO_WRITE";
  readonly topologyId: string;
  readonly segmente: readonly Pr25LiveEvidenceSegment[];
  readonly gesamtDauerSekunden: number;
  readonly liveExecutionAllowed: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly normalRuntimeAllowed: false;
}

function text(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

export function bauePr25GruppenLiveEvidencePlan(
  anfrage: Pr25GruppenLiveEvidenceRequest,
): Pr25GruppenLiveEvidencePlan {
  if (anfrage.schemaVersion !== 1) throw new Error("PR25_EVIDENCE_SCHEMA_UNGUELTIG");
  text(anfrage.topologyId, "PR25_EVIDENCE_TOPOLOGY_UNGUELTIG");
  if (anfrage.capabilities.length > 64) throw new Error("PR25_EVIDENCE_CAPABILITY_LIMIT");

  const seen = new Set<string>();
  const segmente: Pr25LiveEvidenceSegment[] = [];
  for (const capability of anfrage.capabilities) {
    text(capability.capabilityId, "PR25_EVIDENCE_CAPABILITY_UNGUELTIG");
    if (seen.has(capability.capabilityId)) throw new Error("PR25_EVIDENCE_CAPABILITY_DOPPELT");
    seen.add(capability.capabilityId);
    if (!capability.neuZuPruefen) continue;
    segmente.push(Object.freeze({
      segmentId: "capability:" + capability.capabilityId,
      art: "CAPABILITY_5M",
      capabilityId: capability.capabilityId,
      dauerSekunden: 300,
      erwarteteGameplayWrites: "NUR_RATIFIZIERTE_CAPABILITIES",
      unerwarteteGameplayWritesErlaubt: false,
      safetyViolationErlaubt: false,
    }));
  }

  if (anfrage.integrationRequired) {
    segmente.push(Object.freeze({
      segmentId: "integration:" + anfrage.topologyId,
      art: "INTEGRATION_15M",
      capabilityId: null,
      dauerSekunden: 900,
      erwarteteGameplayWrites: "NUR_RATIFIZIERTE_CAPABILITIES",
      unerwarteteGameplayWritesErlaubt: false,
      safetyViolationErlaubt: false,
    }));
  }

  return Object.freeze({
    schemaVersion: 1,
    status: "PLAN_BEREIT_NO_WRITE",
    topologyId: anfrage.topologyId,
    segmente: Object.freeze(segmente),
    gesamtDauerSekunden: segmente.reduce((sum, x) => sum + x.dauerSekunden, 0),
    liveExecutionAllowed: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    normalRuntimeAllowed: false,
  });
}
