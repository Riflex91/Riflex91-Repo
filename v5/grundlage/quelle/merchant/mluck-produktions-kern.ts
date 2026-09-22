import type {
  FaehigkeitsAutoritaetsNachweis,
  FaehigkeitsAutoritaetsPort,
} from "../ausfuehrung/ports.js";
import type { HealthEvidence } from "../operations/health.js";
import { bewerteKritischeHealth } from "../operations/health.js";
import type {
  TransaktionsJournalEintrag,
  TransaktionsJournalPort,
} from "../persistenz/ports.js";
import {
  MERCHANT_MLUCK_CORE_MODUL_ID,
  MERCHANT_MLUCK_CORE_MODUL_VERSION,
  MERCHANT_MLUCK_FAEHIGKEIT_ID,
} from "./mluck-produktions-modul-vertrag.js";

export const MLUCK_ACTION_CONTRACT_ID = "AL-ACTION-MLUCK-SAME-ACCOUNT";
export const MLUCK_RECOVERY_CONTRACT_ID = "AL-RECOVERY-MLUCK-SAME-ACCOUNT";
export const MLUCK_VERIFIER_ID = "AL-VERIFIER-MLUCK-SAME-ACCOUNT";
export const MLUCK_EINMAL_POLICY_ID = "MERCHANT-MLUCK-SAME-ACCOUNT-EINMAL-V1";
export const MLUCK_EINMAL_BESTAETIGUNG = "V5 MLUCK EINMAL AUSFUEHREN";
export const MLUCK_MAX_RANGE = 320;
export const MLUCK_MIN_MP = 10;
export const MLUCK_MIN_LEVEL = 40;
export const MLUCK_MAX_EVIDENCE_AGE_MS = 1_000;
export const MLUCK_AUTHORITY_MAX_LIFETIME_MS = 2_000;
export const MLUCK_REQUIRED_HEALTH_ID = "produktiver-speicher";

export interface MluckLiveEvidence {
  readonly schemaVersion: 1;
  readonly merchantId: string;
  readonly merchantSessionId: string;
  readonly targetId: string;
  readonly targetSessionId: string;
  readonly sameAccount: boolean;
  readonly sameServer: boolean;
  readonly sameInstance: boolean;
  readonly senderCtype: string;
  readonly senderLevel: number;
  readonly senderMp: number;
  readonly senderDisabled: boolean;
  readonly skillCooldownAktiv: boolean;
  readonly distance: number;
  readonly targetMluckActive: boolean;
  readonly targetMluckSource: string | null;
  readonly targetMluckStrong: boolean;
  readonly criticalMerchantWorkActive: boolean;
  readonly beobachtetAmMs: number;
  readonly fingerprint: string;
}

export interface MluckAdmissionErgebnis {
  readonly bereit: boolean;
  readonly blocker: readonly string[];
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

function text(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

export function bewerteProduktiveMluckAdmission(
  evidence: MluckLiveEvidence,
  jetztMs: number,
): MluckAdmissionErgebnis {
  const blocker: string[] = [];
  if (evidence.schemaVersion !== 1) blocker.push("SCHEMA_UNGUELTIG");
  try {
    text(evidence.merchantId, "MERCHANT_ID_UNGUELTIG");
    text(evidence.merchantSessionId, "MERCHANT_SESSION_UNGUELTIG");
    text(evidence.targetId, "TARGET_ID_UNGUELTIG");
    text(evidence.targetSessionId, "TARGET_SESSION_UNGUELTIG");
    text(evidence.fingerprint, "FINGERPRINT_UNGUELTIG");
  } catch (error) {
    blocker.push(error instanceof Error ? error.message : "BINDUNG_UNGUELTIG");
  }
  if (!Number.isSafeInteger(jetztMs) || jetztMs < 0
      || !Number.isSafeInteger(evidence.beobachtetAmMs)
      || evidence.beobachtetAmMs > jetztMs
      || jetztMs - evidence.beobachtetAmMs > MLUCK_MAX_EVIDENCE_AGE_MS) {
    blocker.push("EVIDENCE_STALE");
  }
  if (evidence.merchantId === evidence.targetId) blocker.push("TARGET_MUSS_ANDERER_CHARACTER_SEIN");
  if (!evidence.sameAccount) blocker.push("SAME_ACCOUNT_FEHLT");
  if (!evidence.sameServer) blocker.push("SAME_SERVER_FEHLT");
  if (!evidence.sameInstance) blocker.push("SAME_INSTANCE_FEHLT");
  if (evidence.senderCtype.toLowerCase() !== "merchant") blocker.push("MERCHANT_ERFORDERLICH");
  if (!Number.isSafeInteger(evidence.senderLevel) || evidence.senderLevel < MLUCK_MIN_LEVEL) {
    blocker.push("MERCHANT_LEVEL_ZU_NIEDRIG");
  }
  if (!Number.isFinite(evidence.senderMp) || evidence.senderMp < MLUCK_MIN_MP) {
    blocker.push("MP_ZU_NIEDRIG");
  }
  if (evidence.senderDisabled) blocker.push("MERCHANT_DISABLED");
  if (evidence.skillCooldownAktiv) blocker.push("MLUCK_COOLDOWN_AKTIV");
  if (!Number.isFinite(evidence.distance) || evidence.distance < 0 || evidence.distance > MLUCK_MAX_RANGE) {
    blocker.push("TARGET_AUSSER_REICHWEITE");
  }
  if (evidence.criticalMerchantWorkActive) blocker.push("KRITISCHE_MERCHANT_ARBEIT_HAT_VORRANG");
  if (evidence.targetMluckActive
      && evidence.targetMluckStrong
      && evidence.targetMluckSource !== evidence.merchantId) {
    blocker.push("FREMDES_STARKES_MLUCK_DARF_NICHT_UEBERSCHRIEBEN_WERDEN");
  }
  if (evidence.targetMluckActive
      && evidence.targetMluckStrong
      && evidence.targetMluckSource === evidence.merchantId) {
    blocker.push("EIGENES_STARKES_MLUCK_BEREITS_AKTIV");
  }
  return Object.freeze({
    bereit: blocker.length === 0,
    blocker: Object.freeze([...new Set(blocker)].sort()),
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
  });
}

export interface MluckAuthorityDurableIntent {
  readonly schemaVersion: 1;
  readonly art: "MLUCK_EINMAL_AUTHORITY_VOR_WIRKUNG";
  readonly aktivierungsId: string;
  readonly transaktionsId: string;
  readonly faehigkeitId: typeof MERCHANT_MLUCK_FAEHIGKEIT_ID;
  readonly ownerId: typeof MERCHANT_MLUCK_CORE_MODUL_ID;
  readonly ownerVersion: typeof MERCHANT_MLUCK_CORE_MODUL_VERSION;
  readonly actionContractId: typeof MLUCK_ACTION_CONTRACT_ID;
  readonly recoveryContractId: typeof MLUCK_RECOVERY_CONTRACT_ID;
  readonly verifierId: typeof MLUCK_VERIFIER_ID;
  readonly policyId: typeof MLUCK_EINMAL_POLICY_ID;
  readonly evidenceIds: readonly string[];
  readonly liveEvidenceFingerprint: string;
  readonly ausgestelltAmMs: number;
  readonly gueltigBisMs: number;
  readonly maximaleVerwendungen: 1;
  readonly rawWriteAutoritaet: false;
  readonly breiteRuntimeFreigabe: false;
}

export interface MluckAuthorityProtokollPort {
  schreibeDurable(intent: MluckAuthorityDurableIntent): Promise<{
    readonly durable: true;
    readonly bestaetigungsId: string;
    readonly aktivierungsId: string;
    readonly transaktionsId: string;
  }>;
}

export interface MluckAuthorityAnforderung {
  readonly schemaVersion: 1;
  readonly aktivierungsId: string;
  readonly transaktionsId: string;
  readonly bestaetigungText: typeof MLUCK_EINMAL_BESTAETIGUNG;
  readonly healthEvidence: readonly HealthEvidence[];
  readonly liveEvidence: MluckLiveEvidence;
  readonly jetztMs: number;
  readonly gueltigBisMs: number;
  readonly faehigkeitsGeneration: number;
}

export interface MluckAuthorityDaten {
  readonly aktivierungsId: string;
  readonly transaktionsId: string;
  readonly ausgestelltAmMs: number;
  readonly gueltigBisMs: number;
  readonly faehigkeitsGeneration: number;
  readonly liveEvidenceFingerprint: string;
  readonly evidenceIds: readonly string[];
}

export class ProduktiveMluckEinmalAuthority implements FaehigkeitsAutoritaetsPort {
  readonly #daten: MluckAuthorityDaten;
  #verbraucht = false;
  #widerrufen = false;

  public constructor(daten: MluckAuthorityDaten) {
    this.#daten = Object.freeze({
      ...daten,
      evidenceIds: Object.freeze([...daten.evidenceIds]),
    });
  }

  public pruefe(faehigkeitId: string, eigentuemerModulId: string):
  FaehigkeitsAutoritaetsNachweis {
    const erlaubt = !this.#verbraucht
      && !this.#widerrufen
      && faehigkeitId === MERCHANT_MLUCK_FAEHIGKEIT_ID
      && eigentuemerModulId === MERCHANT_MLUCK_CORE_MODUL_ID;
    if (erlaubt) this.#verbraucht = true;
    return Object.freeze({
      erlaubt,
      mutierend: true,
      generation: this.#daten.faehigkeitsGeneration,
    });
  }

  public gueltigFuer(jetztMs: number): boolean {
    return Number.isSafeInteger(jetztMs)
      && jetztMs >= this.#daten.ausgestelltAmMs
      && jetztMs <= this.#daten.gueltigBisMs
      && !this.#verbraucht
      && !this.#widerrufen;
  }

  public verbraucht(): boolean { return this.#verbraucht; }
  public widerrufe(): void { this.#widerrufen = true; }
  public daten(): MluckAuthorityDaten { return this.#daten; }
}

export async function erteileProduktiveMluckEinmalAuthority(
  anforderung: MluckAuthorityAnforderung,
  protokoll: MluckAuthorityProtokollPort,
): Promise<ProduktiveMluckEinmalAuthority> {
  if (anforderung.schemaVersion !== 1
      || anforderung.bestaetigungText !== MLUCK_EINMAL_BESTAETIGUNG) {
    throw new Error("MLUCK_AUTHORITY_BINDUNG_UNGUELTIG");
  }
  text(anforderung.aktivierungsId, "MLUCK_AUTHORITY_AKTIVIERUNG_ID_UNGUELTIG");
  text(anforderung.transaktionsId, "MLUCK_AUTHORITY_TX_ID_UNGUELTIG");
  if (!Number.isSafeInteger(anforderung.jetztMs)
      || !Number.isSafeInteger(anforderung.gueltigBisMs)
      || anforderung.jetztMs < 0
      || anforderung.gueltigBisMs < anforderung.jetztMs
      || anforderung.gueltigBisMs - anforderung.jetztMs > MLUCK_AUTHORITY_MAX_LIFETIME_MS
      || !Number.isSafeInteger(anforderung.faehigkeitsGeneration)
      || anforderung.faehigkeitsGeneration < 1) {
    throw new Error("MLUCK_AUTHORITY_ZEIT_ODER_GENERATION_UNGUELTIG");
  }
  const health = bewerteKritischeHealth(
    Object.freeze([{ healthId: MLUCK_REQUIRED_HEALTH_ID, erforderlich: true }]),
    anforderung.healthEvidence,
    anforderung.jetztMs,
  );
  if (!health.mutationErlaubt) throw new Error("MLUCK_AUTHORITY_HEALTH_BLOCKIERT");
  const admission = bewerteProduktiveMluckAdmission(
    anforderung.liveEvidence,
    anforderung.jetztMs,
  );
  if (!admission.bereit) {
    throw new Error("MLUCK_AUTHORITY_ADMISSION_BLOCKIERT:" + admission.blocker.join(","));
  }
  const evidenceIds = Object.freeze(
    anforderung.healthEvidence.map(x => x.evidenceId)
      .filter((x, i, a) => a.indexOf(x) === i).sort(),
  );
  if (evidenceIds.length < 1 || evidenceIds.length > 64) {
    throw new Error("MLUCK_AUTHORITY_EVIDENCE_UNGUELTIG");
  }
  const intent: MluckAuthorityDurableIntent = Object.freeze({
    schemaVersion: 1,
    art: "MLUCK_EINMAL_AUTHORITY_VOR_WIRKUNG",
    aktivierungsId: anforderung.aktivierungsId,
    transaktionsId: anforderung.transaktionsId,
    faehigkeitId: MERCHANT_MLUCK_FAEHIGKEIT_ID,
    ownerId: MERCHANT_MLUCK_CORE_MODUL_ID,
    ownerVersion: MERCHANT_MLUCK_CORE_MODUL_VERSION,
    actionContractId: MLUCK_ACTION_CONTRACT_ID,
    recoveryContractId: MLUCK_RECOVERY_CONTRACT_ID,
    verifierId: MLUCK_VERIFIER_ID,
    policyId: MLUCK_EINMAL_POLICY_ID,
    evidenceIds,
    liveEvidenceFingerprint: anforderung.liveEvidence.fingerprint,
    ausgestelltAmMs: anforderung.jetztMs,
    gueltigBisMs: anforderung.gueltigBisMs,
    maximaleVerwendungen: 1,
    rawWriteAutoritaet: false,
    breiteRuntimeFreigabe: false,
  });
  const ack = await protokoll.schreibeDurable(intent);
  if (!ack || ack.durable !== true
      || ack.aktivierungsId !== anforderung.aktivierungsId
      || ack.transaktionsId !== anforderung.transaktionsId
      || String(ack.bestaetigungsId || "").trim().length === 0) {
    throw new Error("MLUCK_AUTHORITY_DURABILITY_NICHT_BESTAETIGT");
  }
  return new ProduktiveMluckEinmalAuthority(Object.freeze({
    aktivierungsId: anforderung.aktivierungsId,
    transaktionsId: anforderung.transaktionsId,
    ausgestelltAmMs: anforderung.jetztMs,
    gueltigBisMs: anforderung.gueltigBisMs,
    faehigkeitsGeneration: anforderung.faehigkeitsGeneration,
    liveEvidenceFingerprint: anforderung.liveEvidence.fingerprint,
    evidenceIds,
  }));
}

export interface MluckAdapter {
  readonly adapterId: string;
  readonly actionContractId: typeof MLUCK_ACTION_CONTRACT_ID;
  readonly recoveryContractId: typeof MLUCK_RECOVERY_CONTRACT_ID;
  readonly verifierId: typeof MLUCK_VERIFIER_ID;
  sende(targetId: string): Promise<
    | { readonly art: "SERVER_ERGEBNIS"; readonly korrelationId: string | null }
    | { readonly art: "UNBEKANNT"; readonly grund: string }
    | { readonly art: "NICHT_GESENDET"; readonly grund: string }
  >;
}

export interface MluckRecoveryBeobachtung {
  readonly klassifikation:
    | "BESTAETIGT"
    | "NICHT_AUSGEFUEHRT"
    | "TEILWEISE"
    | "NOCH_AUSSTEHEND"
    | "UNGEKLAERT";
  readonly beobachtetAmMs: number;
  readonly targetSessionId: string;
  readonly targetMluckActive: boolean;
  readonly targetMluckSource: string | null;
  readonly targetMluckStrong: boolean;
  readonly senderMpNachher: number;
  readonly cooldownAktivNachher: boolean;
  readonly fingerprint: string;
}

export interface MluckRecoveryBeobachter {
  beobachte(versuch: number): Promise<MluckRecoveryBeobachtung>;
}

export interface MluckTransaktionsAnforderung {
  readonly schemaVersion: 1;
  readonly transaktionsId: string;
  readonly targetId: string;
  readonly targetSessionId: string;
  readonly liveEvidence: MluckLiveEvidence;
  readonly authority: ProduktiveMluckEinmalAuthority;
  readonly jetztMs: () => number;
}

export interface MluckTransaktionsErgebnis {
  readonly status: "COMMITTED" | "ABORTED" | "FAILED_SAFE" | "OPERATOR_REQUIRED";
  readonly transportArt: "SERVER_ERGEBNIS" | "UNBEKANNT" | "NICHT_GESENDET";
  readonly recoveryKlassifikation: string;
  readonly journalTerminalArt: "COMMIT" | "ABBRUCH" | "SICHER_FEHLGESCHLAGEN";
  readonly adapterAufrufeMaximal: 1;
  readonly sameIntentErneutSenden: false;
}

function journal(
  a: MluckTransaktionsAnforderung,
  sequenz: number,
  art: TransaktionsJournalEintrag["art"],
  inhalt: Readonly<Record<string, unknown>>,
): TransaktionsJournalEintrag {
  return Object.freeze({
    schemaVersion: 1,
    journalId: a.transaktionsId + ":" + sequenz,
    transaktionsId: a.transaktionsId,
    sequenz,
    art,
    zeitMs: a.jetztMs(),
    inhalt: Object.freeze({ ...inhalt }),
  });
}

export class ProduktiveMluckTransaktion {
  public async fuehreEinmalAus(
    a: MluckTransaktionsAnforderung,
    journalPort: TransaktionsJournalPort,
    adapter: MluckAdapter,
    recovery: MluckRecoveryBeobachter,
  ): Promise<MluckTransaktionsErgebnis> {
    if (a.schemaVersion !== 1) throw new Error("MLUCK_TX_SCHEMA_UNGUELTIG");
    text(a.transaktionsId, "MLUCK_TX_ID_UNGUELTIG");
    text(a.targetId, "MLUCK_TX_TARGET_UNGUELTIG");
    text(a.targetSessionId, "MLUCK_TX_TARGET_SESSION_UNGUELTIG");
    if (adapter.actionContractId !== MLUCK_ACTION_CONTRACT_ID
        || adapter.recoveryContractId !== MLUCK_RECOVERY_CONTRACT_ID
        || adapter.verifierId !== MLUCK_VERIFIER_ID) {
      throw new Error("MLUCK_TX_ADAPTER_BINDUNG_UNGUELTIG");
    }
    const now = a.jetztMs();
    const admission = bewerteProduktiveMluckAdmission(a.liveEvidence, now);
    if (!admission.bereit) {
      throw new Error("MLUCK_TX_ADMISSION_BLOCKIERT:" + admission.blocker.join(","));
    }
    if (a.targetId !== a.liveEvidence.targetId
        || a.targetSessionId !== a.liveEvidence.targetSessionId
        || a.authority.daten().transaktionsId !== a.transaktionsId
        || a.authority.daten().liveEvidenceFingerprint !== a.liveEvidence.fingerprint
        || !a.authority.gueltigFuer(now)) {
      throw new Error("MLUCK_TX_AUTHORITY_ODER_TARGET_DRIFT");
    }

    let sequenz = 1;
    await journalPort.haengeDurableAn(journal(a, sequenz++, "INTENT", {
      action_contract_id: MLUCK_ACTION_CONTRACT_ID,
      recovery_contract_id: MLUCK_RECOVERY_CONTRACT_ID,
      verifier_id: MLUCK_VERIFIER_ID,
      target_id: a.targetId,
      target_session_id: a.targetSessionId,
      pinned_prestate_fingerprint: a.liveEvidence.fingerprint,
      send_boundary_state: "NICHT_GESENDET",
      same_intent_retry: false,
    }));

    const authority = a.authority.pruefe(
      MERCHANT_MLUCK_FAEHIGKEIT_ID,
      MERCHANT_MLUCK_CORE_MODUL_ID,
    );
    if (!authority.erlaubt) {
      await journalPort.haengeDurableAn(journal(a, sequenz, "ABBRUCH", {
        grund: "AUTHORITY_BLOCKIERT",
        same_intent_retry: false,
      }));
      return Object.freeze({
        status: "ABORTED",
        transportArt: "NICHT_GESENDET",
        recoveryKlassifikation: "NICHT_GESENDET",
        journalTerminalArt: "ABBRUCH",
        adapterAufrufeMaximal: 1,
        sameIntentErneutSenden: false,
      });
    }

    let transport: Awaited<ReturnType<MluckAdapter["sende"]>>;
    try {
      transport = await adapter.sende(a.targetId);
    } catch {
      transport = { art: "UNBEKANNT", grund: "TRANSPORT_UNKLAR" };
    }

    if (transport.art === "NICHT_GESENDET") {
      await journalPort.haengeDurableAn(journal(a, sequenz, "ABBRUCH", {
        grund: transport.grund,
        send_boundary_state: "NICHT_GESENDET",
        same_intent_retry: false,
      }));
      return Object.freeze({
        status: "ABORTED",
        transportArt: "NICHT_GESENDET",
        recoveryKlassifikation: "NICHT_GESENDET",
        journalTerminalArt: "ABBRUCH",
        adapterAufrufeMaximal: 1,
        sameIntentErneutSenden: false,
      });
    }

    await journalPort.haengeDurableAn(journal(
      a,
      sequenz++,
      transport.art === "SERVER_ERGEBNIS" ? "SERVER_ERGEBNIS" : "UNBEKANNT",
      {
        korrelation_id: transport.art === "SERVER_ERGEBNIS"
          ? transport.korrelationId
          : null,
        grund: transport.art === "UNBEKANNT" ? transport.grund : null,
        send_boundary_state: "MOEGLICH_GESENDET",
        same_intent_retry: false,
      },
    ));

    let obs: MluckRecoveryBeobachtung | null = null;
    for (let versuch = 1; versuch <= 4; versuch += 1) {
      obs = await recovery.beobachte(versuch);
      if (obs.targetSessionId !== a.targetSessionId) {
        obs = Object.freeze({ ...obs, klassifikation: "UNGEKLAERT" });
      }
      if (obs.klassifikation !== "NOCH_AUSSTEHEND") break;
    }
    if (obs === null) throw new Error("MLUCK_TX_RECOVERY_OHNE_EVIDENCE");

    await journalPort.haengeDurableAn(journal(a, sequenz++, "POSTCONDITION", {
      klassifikation: obs.klassifikation,
      target_session_id: obs.targetSessionId,
      target_mluck_active: obs.targetMluckActive,
      target_mluck_source: obs.targetMluckSource,
      target_mluck_strong: obs.targetMluckStrong,
      sender_mp_nachher: obs.senderMpNachher,
      cooldown_aktiv_nachher: obs.cooldownAktivNachher,
      evidence_fingerprint: obs.fingerprint,
      same_intent_retry: false,
    }));

    const committed = obs.klassifikation === "BESTAETIGT"
      && obs.targetMluckActive
      && obs.targetMluckSource === a.liveEvidence.merchantId
      && obs.targetMluckStrong
      && obs.senderMpNachher <= a.liveEvidence.senderMp - MLUCK_MIN_MP
      && obs.cooldownAktivNachher;
    const notApplied = obs.klassifikation === "NICHT_AUSGEFUEHRT";
    const terminal = committed ? "COMMIT" : notApplied ? "ABBRUCH" : "SICHER_FEHLGESCHLAGEN";
    await journalPort.haengeDurableAn(journal(a, sequenz, terminal, {
      klassifikation: obs.klassifikation,
      same_intent_retry: false,
      neuer_intent_erforderlich: !committed,
    }));

    return Object.freeze({
      status: committed
        ? "COMMITTED"
        : notApplied
          ? "ABORTED"
          : obs.klassifikation === "UNGEKLAERT" || obs.klassifikation === "TEILWEISE"
            ? "OPERATOR_REQUIRED"
            : "FAILED_SAFE",
      transportArt: transport.art,
      recoveryKlassifikation: obs.klassifikation,
      journalTerminalArt: terminal,
      adapterAufrufeMaximal: 1,
      sameIntentErneutSenden: false,
    });
  }
}
