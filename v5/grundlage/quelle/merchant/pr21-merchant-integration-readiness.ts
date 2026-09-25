export type Pr21MerchantBereich =
  | "TASK"
  | "BANK"
  | "MARKT"
  | "SUPPLY"
  | "COLLECTION"
  | "RENDEZVOUS"
  | "MLUCK"
  | "GEAR"
  | "WERTMUTATION"
  | "CRAFT"
  | "PRODUCTION"
  | "RECOVERY";

export interface Pr21MerchantBereichEvidence {
  readonly bereich: Pr21MerchantBereich;
  readonly vorbereitet: boolean;
  readonly evidenceFingerprint: string;
  readonly beobachtetAmMs: number;
  readonly gueltigBisMs: number;
  readonly unerwarteteGameplayWrites: number;
  readonly duplicateIrreversibleEffects: number;
  readonly unresolvedTransactions: number;
  readonly operatorRequiredTransactions: number;
  readonly authorityLeaks: number;
}

export interface Pr21MerchantIntegrationRequest {
  readonly schemaVersion: 1;
  readonly evidence: readonly Pr21MerchantBereichEvidence[];
  readonly jetztMs: number;
  readonly nothaltAktiv: boolean;
  readonly capabilityDenyAktiv: boolean;
  readonly irreversibleMutationInFlight: boolean;
  readonly merchantThrashEvents: number;
  readonly merchantPingpongEvents: number;
  readonly starvationCriticalCount: number;
  readonly sameIntentRetryCount: number;
}

export interface Pr21MerchantIntegrationReadiness {
  readonly schemaVersion: 1;
  readonly status: "BEREIT_FUER_INTEGRATIONSTEST_NO_WRITE" | "BLOCKIERT";
  readonly blocker: readonly string[];
  readonly abgedeckteBereiche: readonly Pr21MerchantBereich[];
  readonly fehlendeBereiche: readonly Pr21MerchantBereich[];
  readonly liveExecutionAllowed: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly normalRuntimeAllowed: false;
}

const BEREICHE: readonly Pr21MerchantBereich[] = Object.freeze([
  "TASK",
  "BANK",
  "MARKT",
  "SUPPLY",
  "COLLECTION",
  "RENDEZVOUS",
  "MLUCK",
  "GEAR",
  "WERTMUTATION",
  "CRAFT",
  "PRODUCTION",
  "RECOVERY",
]);

function text(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 240) throw new Error(fehler);
}

function zaehler(wert: number, fehler: string): void {
  if (!Number.isSafeInteger(wert) || wert < 0) throw new Error(fehler);
}

export function bewertePr21MerchantIntegrationReadiness(
  anfrage: Pr21MerchantIntegrationRequest,
): Pr21MerchantIntegrationReadiness {
  if (anfrage.schemaVersion !== 1 || !Number.isSafeInteger(anfrage.jetztMs) || anfrage.jetztMs < 0) {
    throw new Error("PR21_INTEGRATION_SCHEMA_ODER_ZEIT_UNGUELTIG");
  }
  for (const wert of [
    anfrage.merchantThrashEvents,
    anfrage.merchantPingpongEvents,
    anfrage.starvationCriticalCount,
    anfrage.sameIntentRetryCount,
  ]) zaehler(wert, "PR21_INTEGRATION_ZAEHLER_UNGUELTIG");

  const blocker: string[] = [];
  const gesehen = new Set<Pr21MerchantBereich>();
  const abgedeckt: Pr21MerchantBereich[] = [];

  for (const row of anfrage.evidence) {
    if (!BEREICHE.includes(row.bereich)) throw new Error("PR21_INTEGRATION_BEREICH_UNBEKANNT");
    if (gesehen.has(row.bereich)) throw new Error("PR21_INTEGRATION_BEREICH_DOPPELT");
    gesehen.add(row.bereich);
    text(row.evidenceFingerprint, "PR21_INTEGRATION_FINGERPRINT_UNGUELTIG");
    if (!Number.isSafeInteger(row.beobachtetAmMs)
        || !Number.isSafeInteger(row.gueltigBisMs)
        || row.beobachtetAmMs < 0
        || row.gueltigBisMs < row.beobachtetAmMs) {
      throw new Error("PR21_INTEGRATION_EVIDENCE_ZEIT_UNGUELTIG");
    }
    for (const wert of [
      row.unerwarteteGameplayWrites,
      row.duplicateIrreversibleEffects,
      row.unresolvedTransactions,
      row.operatorRequiredTransactions,
      row.authorityLeaks,
    ]) zaehler(wert, "PR21_INTEGRATION_EVIDENCE_ZAEHLER_UNGUELTIG");

    if (!row.vorbereitet) blocker.push("PR21_BEREICH_NICHT_VORBEREITET:" + row.bereich);
    if (anfrage.jetztMs < row.beobachtetAmMs || anfrage.jetztMs > row.gueltigBisMs) {
      blocker.push("PR21_EVIDENCE_STALE:" + row.bereich);
    }
    if (row.unerwarteteGameplayWrites > 0) blocker.push("PR21_UNERWARTETER_WRITE:" + row.bereich);
    if (row.duplicateIrreversibleEffects > 0) blocker.push("PR21_DUPLICATE_EFFECT:" + row.bereich);
    if (row.authorityLeaks > 0) blocker.push("PR21_AUTHORITY_LEAK:" + row.bereich);
    if (row.unresolvedTransactions > row.operatorRequiredTransactions) {
      blocker.push("PR21_UNRESOLVED_TRANSACTION:" + row.bereich);
    }
    if (row.vorbereitet) abgedeckt.push(row.bereich);
  }

  const fehlend = BEREICHE.filter(x => !gesehen.has(x));
  for (const bereich of fehlend) blocker.push("PR21_BEREICH_FEHLT:" + bereich);
  if (anfrage.nothaltAktiv) blocker.push("PR21_NOTHALT_AKTIV");
  if (anfrage.capabilityDenyAktiv) blocker.push("PR21_CAPABILITY_DENY_AKTIV");
  if (anfrage.irreversibleMutationInFlight) blocker.push("PR21_IRREVERSIBLE_MUTATION_IN_FLIGHT");
  if (anfrage.merchantThrashEvents > 0) blocker.push("PR21_MERCHANT_THRASH");
  if (anfrage.merchantPingpongEvents > 0) blocker.push("PR21_MERCHANT_PINGPONG");
  if (anfrage.starvationCriticalCount > 0) blocker.push("PR21_CRITICAL_STARVATION");
  if (anfrage.sameIntentRetryCount > 0) blocker.push("PR21_SAME_INTENT_RETRY");

  return Object.freeze({
    schemaVersion: 1,
    status: blocker.length === 0 ? "BEREIT_FUER_INTEGRATIONSTEST_NO_WRITE" : "BLOCKIERT",
    blocker: Object.freeze(blocker),
    abgedeckteBereiche: Object.freeze([...abgedeckt].sort()),
    fehlendeBereiche: Object.freeze([...fehlend]),
    liveExecutionAllowed: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    normalRuntimeAllowed: false,
  });
}
