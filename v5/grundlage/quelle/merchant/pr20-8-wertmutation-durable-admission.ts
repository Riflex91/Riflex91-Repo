import { PersistVorMutationTor } from "../persistenz/journal.js";
import type {
  TransaktionsJournalEintrag,
  TransaktionsJournalPort,
} from "../persistenz/ports.js";
import type {
  Pr208CompoundOneShotAuthority,
  Pr208ExchangeOneShotAuthority,
  Pr208UpgradeOneShotAuthority,
  Pr208WertmutationCurrentSnapshot,
  Pr208WertmutationResourceEpochen,
} from "./pr20-8-wertmutation-one-shot.js";

export interface Pr208WertmutationPreflightPlan {
  readonly schemaVersion: 1;
  readonly transaktionsId: string;
  readonly auftragId: string;
  readonly ablaufId: string;
  readonly characterId: string;
  readonly sessionId: string;
  readonly serverRegion: string;
  readonly serverIdentifier: string;
  readonly prestateFingerprint: string;
  readonly inventoryFingerprint: string;
  readonly qFingerprint: string;
  readonly itemFingerprints: readonly string[];
  readonly resourceEpochen: Pr208WertmutationResourceEpochen;
  readonly actionContractId:
    | "AL-ACTION-UPGRADE"
    | "AL-ACTION-COMPOUND"
    | "AL-ACTION-EXCHANGE";
  readonly recoveryContractId:
    | "AL-RECOVERY-UPGRADE"
    | "AL-RECOVERY-COMPOUND"
    | "AL-RECOVERY-EXCHANGE";
  readonly verifierId:
    | "AL-VERIFIER-UPGRADE"
    | "AL-VERIFIER-COMPOUND"
    | "AL-VERIFIER-EXCHANGE";
  readonly publicFunction: "upgrade" | "compound" | "exchange";
  readonly observedAtMs: number;
  readonly gueltigBisMs: number;
}

export interface Pr208WertmutationPreflightErgebnis {
  readonly schemaVersion: 1;
  readonly status: "BEREIT_NO_WRITE" | "BLOCKIERT";
  readonly grund: string;
  readonly sameIntentRetry: false;
  readonly gameplayWrites: 0;
  readonly publicFunctionCalls: 0;
  readonly rawWriteCalls: 0;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
  readonly normalRuntimeAllowed: false;
}

export interface Pr208WertmutationDurableIntentErgebnis {
  readonly schemaVersion: 1;
  readonly status: "INTENT_DURABLE_NO_WRITE";
  readonly transaktionsId: string;
  readonly journalId: string;
  readonly durable: true;
  readonly sendBoundaryState: "NICHT_GESENDET";
  readonly sameIntentRetry: false;
  readonly gameplayWrites: 0;
  readonly publicFunctionCalls: 0;
  readonly rawWriteCalls: 0;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
  readonly normalRuntimeAllowed: false;
}

export interface Pr208WertmutationAdmissionErgebnis {
  readonly schemaVersion: 1;
  readonly status: "ADMITTED_ONE_SHOT_NO_SEND" | "BLOCKIERT";
  readonly grund: string;
  readonly authorityConsumed: boolean;
  readonly sendBoundaryState: "NICHT_GESENDET";
  readonly sameIntentRetry: false;
  readonly gameplayWrites: 0;
  readonly publicFunctionCalls: 0;
  readonly rawWriteCalls: 0;
  readonly normalRuntimeAllowed: false;
}

type Authority =
  | Pr208UpgradeOneShotAuthority
  | Pr208CompoundOneShotAuthority
  | Pr208ExchangeOneShotAuthority;

interface Family {
  readonly action: Pr208WertmutationPreflightPlan["actionContractId"];
  readonly recovery: Pr208WertmutationPreflightPlan["recoveryContractId"];
  readonly verifier: Pr208WertmutationPreflightPlan["verifierId"];
  readonly publicFunction: Pr208WertmutationPreflightPlan["publicFunction"];
  readonly durableArt:
    | "PR20_8_UPGRADE_DURABLE_INTENT"
    | "PR20_8_COMPOUND_DURABLE_INTENT"
    | "PR20_8_EXCHANGE_DURABLE_INTENT";
  readonly prefix: string;
}

const UPGRADE: Family = Object.freeze({
  action: "AL-ACTION-UPGRADE",
  recovery: "AL-RECOVERY-UPGRADE",
  verifier: "AL-VERIFIER-UPGRADE",
  publicFunction: "upgrade",
  durableArt: "PR20_8_UPGRADE_DURABLE_INTENT",
  prefix: "PR20_8_UPGRADE",
});

const COMPOUND: Family = Object.freeze({
  action: "AL-ACTION-COMPOUND",
  recovery: "AL-RECOVERY-COMPOUND",
  verifier: "AL-VERIFIER-COMPOUND",
  publicFunction: "compound",
  durableArt: "PR20_8_COMPOUND_DURABLE_INTENT",
  prefix: "PR20_8_COMPOUND",
});

const EXCHANGE: Family = Object.freeze({
  action: "AL-ACTION-EXCHANGE",
  recovery: "AL-RECOVERY-EXCHANGE",
  verifier: "AL-VERIFIER-EXCHANGE",
  publicFunction: "exchange",
  durableArt: "PR20_8_EXCHANGE_DURABLE_INTENT",
  prefix: "PR20_8_EXCHANGE",
});

function text(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function planGueltig(
  plan: Pr208WertmutationPreflightPlan,
  family: Family,
  jetztMs: number,
): string | null {
  if (!plan || plan.schemaVersion !== 1) return family.prefix + "_PREFLIGHT_SCHEMA_UNGUELTIG";
  for (const x of [
    plan.transaktionsId,
    plan.auftragId,
    plan.ablaufId,
    plan.characterId,
    plan.sessionId,
    plan.serverRegion,
    plan.serverIdentifier,
    plan.prestateFingerprint,
    plan.inventoryFingerprint,
    plan.qFingerprint,
  ]) {
    try {
      text(x, family.prefix + "_PREFLIGHT_TEXT_UNGUELTIG");
    } catch {
      return family.prefix + "_PREFLIGHT_TEXT_UNGUELTIG";
    }
  }
  if (plan.actionContractId !== family.action
      || plan.recoveryContractId !== family.recovery
      || plan.verifierId !== family.verifier
      || plan.publicFunction !== family.publicFunction) {
    return family.prefix + "_CONTRACT_BINDING_DRIFT";
  }
  if (!Number.isSafeInteger(jetztMs)
      || jetztMs < plan.observedAtMs
      || jetztMs > plan.gueltigBisMs
      || plan.gueltigBisMs - plan.observedAtMs > 1_500) {
    return family.prefix + "_PREFLIGHT_TTL_UNGUELTIG";
  }
  if (plan.itemFingerprints.length < 1 || plan.itemFingerprints.length > 16) {
    return family.prefix + "_ITEM_FINGERPRINT_ANZAHL_UNGUELTIG";
  }
  return null;
}

function snapshotPasstPlan(
  plan: Pr208WertmutationPreflightPlan,
  snapshot: Pr208WertmutationCurrentSnapshot,
): boolean {
  return plan.characterId === snapshot.characterId
    && plan.sessionId === snapshot.sessionId
    && plan.serverRegion === snapshot.serverRegion
    && plan.serverIdentifier === snapshot.serverIdentifier
    && plan.prestateFingerprint === snapshot.prestateFingerprint
    && plan.inventoryFingerprint === snapshot.inventoryFingerprint
    && plan.qFingerprint === snapshot.qFingerprint
    && plan.itemFingerprints.length === snapshot.itemFingerprints.length
    && plan.itemFingerprints.every((x, i) => x === snapshot.itemFingerprints[i])
    && plan.resourceEpochen.inventory === snapshot.resourceEpochen.inventory
    && plan.resourceEpochen.q === snapshot.resourceEpochen.q
    && plan.resourceEpochen.socketBudget === snapshot.resourceEpochen.socketBudget
    && plan.resourceEpochen.actionChannel === snapshot.resourceEpochen.actionChannel;
}

function preflight(
  plan: Pr208WertmutationPreflightPlan,
  authority: Authority,
  snapshot: Pr208WertmutationCurrentSnapshot,
  jetztMs: number,
  family: Family,
): Pr208WertmutationPreflightErgebnis {
  let grund = planGueltig(plan, family, jetztMs);
  if (grund === null && authority.daten().transaktionsId !== plan.transaktionsId) {
    grund = family.prefix + "_AUTHORITY_TX_DRIFT";
  }
  if (grund === null && !snapshotPasstPlan(plan, snapshot)) {
    authority.widerrufe();
    grund = family.prefix + "_CURRENT_DRIFT";
  }
  if (grund === null && !authority.revalidiere(snapshot, jetztMs)) {
    grund = family.prefix + "_AUTHORITY_NICHT_GUELTIG";
  }
  return Object.freeze({
    schemaVersion: 1,
    status: grund === null ? "BEREIT_NO_WRITE" : "BLOCKIERT",
    grund: grund ?? family.prefix + "_PREFLIGHT_BEREIT",
    sameIntentRetry: false,
    gameplayWrites: 0,
    publicFunctionCalls: 0,
    rawWriteCalls: 0,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
    normalRuntimeAllowed: false,
  });
}

async function persistiere(
  plan: Pr208WertmutationPreflightPlan,
  authority: Authority,
  snapshot: Pr208WertmutationCurrentSnapshot,
  jetztMs: number,
  family: Family,
  journal: TransaktionsJournalPort,
): Promise<Pr208WertmutationDurableIntentErgebnis> {
  const p = preflight(plan, authority, snapshot, jetztMs, family);
  if (p.status !== "BEREIT_NO_WRITE") throw new Error(p.grund);

  const intent: TransaktionsJournalEintrag = Object.freeze({
    schemaVersion: 1,
    journalId: plan.transaktionsId + ":1",
    transaktionsId: plan.transaktionsId,
    sequenz: 1,
    art: "INTENT",
    zeitMs: jetztMs,
    inhalt: Object.freeze({
      art: family.durableArt,
      auftrag_id: plan.auftragId,
      ablauf_id: plan.ablaufId,
      action_contract_id: family.action,
      recovery_contract_id: family.recovery,
      verifier_id: family.verifier,
      public_function: family.publicFunction,
      character_id: plan.characterId,
      session_id: plan.sessionId,
      server_region: plan.serverRegion,
      server_identifier: plan.serverIdentifier,
      prestate_fingerprint: plan.prestateFingerprint,
      inventory_fingerprint: plan.inventoryFingerprint,
      q_fingerprint: plan.qFingerprint,
      item_fingerprints: Object.freeze([...plan.itemFingerprints]),
      resource_epochs: Object.freeze({ ...plan.resourceEpochen }),
      send_boundary_state: "NICHT_GESENDET",
      same_intent_retry: false,
      gameplay_authority: false,
      raw_write_authority: false,
      normal_runtime_allowed: false,
    }),
  });
  const token = await new PersistVorMutationTor(journal).persistiereIntent(intent);
  const readback = await journal.liesTransaktion(plan.transaktionsId);
  const exact = readback.some(x =>
    x.journalId === token.journalId
    && x.transaktionsId === plan.transaktionsId
    && x.art === "INTENT"
    && x.sequenz === 1);
  if (!exact) {
    authority.widerrufe();
    throw new Error(family.prefix + "_DURABLE_READBACK_FEHLER");
  }

  return Object.freeze({
    schemaVersion: 1,
    status: "INTENT_DURABLE_NO_WRITE",
    transaktionsId: plan.transaktionsId,
    journalId: token.journalId,
    durable: true,
    sendBoundaryState: "NICHT_GESENDET",
    sameIntentRetry: false,
    gameplayWrites: 0,
    publicFunctionCalls: 0,
    rawWriteCalls: 0,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
    normalRuntimeAllowed: false,
  });
}

function admit(
  plan: Pr208WertmutationPreflightPlan,
  authority: Authority,
  snapshot: Pr208WertmutationCurrentSnapshot,
  jetztMs: number,
  durable: Pr208WertmutationDurableIntentErgebnis,
  family: Family,
): Pr208WertmutationAdmissionErgebnis {
  let grund: string | null = null;
  if (!durable.durable
      || durable.status !== "INTENT_DURABLE_NO_WRITE"
      || durable.transaktionsId !== plan.transaktionsId
      || durable.sendBoundaryState !== "NICHT_GESENDET") {
    grund = family.prefix + "_DURABLE_INTENT_FEHLT";
  }
  const p = grund === null
    ? preflight(plan, authority, snapshot, jetztMs, family)
    : null;
  if (grund === null && p?.status !== "BEREIT_NO_WRITE") {
    grund = p?.grund ?? family.prefix + "_PREFLIGHT_BLOCKIERT";
  }
  const consumed = grund === null
    ? authority.verbrauche(snapshot, jetztMs)
    : false;
  if (grund === null && !consumed) {
    grund = family.prefix + "_ONE_SHOT_CONSUME_BLOCKIERT";
  }
  return Object.freeze({
    schemaVersion: 1,
    status: grund === null ? "ADMITTED_ONE_SHOT_NO_SEND" : "BLOCKIERT",
    grund: grund ?? family.prefix + "_ADMISSION_BEREIT",
    authorityConsumed: consumed,
    sendBoundaryState: "NICHT_GESENDET",
    sameIntentRetry: false,
    gameplayWrites: 0,
    publicFunctionCalls: 0,
    rawWriteCalls: 0,
    normalRuntimeAllowed: false,
  });
}

export function pruefePr208UpgradePreflight(
  plan: Pr208WertmutationPreflightPlan,
  authority: Pr208UpgradeOneShotAuthority,
  snapshot: Pr208WertmutationCurrentSnapshot,
  jetztMs: number,
): Pr208WertmutationPreflightErgebnis {
  return preflight(plan, authority, snapshot, jetztMs, UPGRADE);
}

export function pruefePr208CompoundPreflight(
  plan: Pr208WertmutationPreflightPlan,
  authority: Pr208CompoundOneShotAuthority,
  snapshot: Pr208WertmutationCurrentSnapshot,
  jetztMs: number,
): Pr208WertmutationPreflightErgebnis {
  return preflight(plan, authority, snapshot, jetztMs, COMPOUND);
}

export function pruefePr208ExchangePreflight(
  plan: Pr208WertmutationPreflightPlan,
  authority: Pr208ExchangeOneShotAuthority,
  snapshot: Pr208WertmutationCurrentSnapshot,
  jetztMs: number,
): Pr208WertmutationPreflightErgebnis {
  return preflight(plan, authority, snapshot, jetztMs, EXCHANGE);
}

export function persistierePr208UpgradeDurableIntent(
  plan: Pr208WertmutationPreflightPlan,
  authority: Pr208UpgradeOneShotAuthority,
  snapshot: Pr208WertmutationCurrentSnapshot,
  jetztMs: number,
  journal: TransaktionsJournalPort,
): Promise<Pr208WertmutationDurableIntentErgebnis> {
  return persistiere(plan, authority, snapshot, jetztMs, UPGRADE, journal);
}

export function persistierePr208CompoundDurableIntent(
  plan: Pr208WertmutationPreflightPlan,
  authority: Pr208CompoundOneShotAuthority,
  snapshot: Pr208WertmutationCurrentSnapshot,
  jetztMs: number,
  journal: TransaktionsJournalPort,
): Promise<Pr208WertmutationDurableIntentErgebnis> {
  return persistiere(plan, authority, snapshot, jetztMs, COMPOUND, journal);
}

export function persistierePr208ExchangeDurableIntent(
  plan: Pr208WertmutationPreflightPlan,
  authority: Pr208ExchangeOneShotAuthority,
  snapshot: Pr208WertmutationCurrentSnapshot,
  jetztMs: number,
  journal: TransaktionsJournalPort,
): Promise<Pr208WertmutationDurableIntentErgebnis> {
  return persistiere(plan, authority, snapshot, jetztMs, EXCHANGE, journal);
}

export function admitPr208UpgradeNachDurableReadback(
  plan: Pr208WertmutationPreflightPlan,
  authority: Pr208UpgradeOneShotAuthority,
  snapshot: Pr208WertmutationCurrentSnapshot,
  jetztMs: number,
  durable: Pr208WertmutationDurableIntentErgebnis,
): Pr208WertmutationAdmissionErgebnis {
  return admit(plan, authority, snapshot, jetztMs, durable, UPGRADE);
}

export function admitPr208CompoundNachDurableReadback(
  plan: Pr208WertmutationPreflightPlan,
  authority: Pr208CompoundOneShotAuthority,
  snapshot: Pr208WertmutationCurrentSnapshot,
  jetztMs: number,
  durable: Pr208WertmutationDurableIntentErgebnis,
): Pr208WertmutationAdmissionErgebnis {
  return admit(plan, authority, snapshot, jetztMs, durable, COMPOUND);
}

export function admitPr208ExchangeNachDurableReadback(
  plan: Pr208WertmutationPreflightPlan,
  authority: Pr208ExchangeOneShotAuthority,
  snapshot: Pr208WertmutationCurrentSnapshot,
  jetztMs: number,
  durable: Pr208WertmutationDurableIntentErgebnis,
): Pr208WertmutationAdmissionErgebnis {
  return admit(plan, authority, snapshot, jetztMs, durable, EXCHANGE);
}
