import {
  physischeGegenstandsKennung,
  validierePhysischeGegenstandsIdentitaet,
  type PhysischeGegenstandsIdentitaet,
} from "./gegenstands-identitaet.js";
import type {
  GegenstandsDisposition,
  GegenstandsDispositionsLedger,
  GegenstandsReservierung,
} from "./disposition.js";
import type {
  GearAllokationsLedger,
  GearZielSicht,
} from "./gear-allokation.js";
import {
  pruefeWorkspaceKapazitaet,
  type WorkspaceAnfrage,
  type WorkspaceNachweis,
} from "./workspace.js";
import {
  type WerttransaktionsSicht,
  WerttransaktionsLedger,
} from "./werttransaktion.js";

export const PR20_8_EXCHANGE_SOURCE_SNAPSHOT_COMMIT =
  "ddcf7222c3264f1404382e1ff5dea8e73f6cb4b4";

export type ExchangeRewardDomain =
  | "inventory"
  | "gold"
  | "shells"
  | "account_cosmetics"
  | "empty"
  | "recursive_drop";

export type ExchangeOutputspaceKlasse =
  | "DETERMINISTIC_ONE_OUTPUT"
  | "DETERMINISTIC_MULTI_OUTPUT"
  | "PROBABILISTIC_BOUNDED_OUTPUT"
  | "RECURSIVE_DROP_OUTPUT";

export interface ExchangeDropGraphEvidence {
  readonly schemaVersion: 1;
  readonly sourceSnapshotCommit: string;
  readonly dropGraphFingerprint: string;
  readonly bounded: boolean;
  readonly recursiveBranchesBounded: boolean;
  readonly specialMultiOutputBounded: boolean;
  readonly conservativeInventoryOutputsComplete: boolean;
  readonly rewardDomains: readonly ExchangeRewardDomain[];
  readonly outputspaceKlasse: ExchangeOutputspaceKlasse;
  readonly beobachtetAmMs: number;
  readonly gueltigBisMs: number;
  readonly evidenceFingerprint: string;
}

export interface ExchangeProduktionsRichtlinie {
  readonly richtlinienVersion: string;
  readonly maximalesEvidenceAlterMs: number;
  readonly maximalesIdentitaetsAlterMs: number;
  readonly maximalerInputGesamtwert: number;
  readonly erlaubteRewardDomains: readonly ExchangeRewardDomain[];
  readonly recursiveDropErlaubt: boolean;
  readonly specialMultiOutputErlaubt: boolean;
  readonly massExchangeErlaubt: boolean;
}

export interface ExchangeProduktionsKandidat {
  readonly schemaVersion: 1;
  readonly transaktionsId: string;
  readonly ablaufId: string;
  readonly characterId: string;
  readonly input: PhysischeGegenstandsIdentitaet;
  readonly exchangeMenge: number;
  readonly definitionExchangeMenge: number;
  readonly inputGesamtwert: number;
  readonly contentVerifiziert: boolean;
  readonly serviceErreichbar: boolean;
  readonly qFrei: boolean;
  readonly massExchangeConditionActive: boolean;
  readonly specialMultiOutputCase: boolean;
  readonly workspace: WorkspaceAnfrage;
  readonly dropGraphEvidence: ExchangeDropGraphEvidence;
  readonly beobachtetAmMs: number;
  readonly gueltigBisMs: number;
  readonly prestateFingerprint: string;
}

export interface ExchangeInputReservierungsAnforderung {
  readonly physischeKennung: string;
  readonly disposition: "VERBRAUCH";
  readonly menge: number;
  readonly rolle: "EXCHANGE_INPUT";
}

export type ExchangeProduktionsBlockGrund =
  | "EVIDENCE_STALE"
  | "IDENTITAET_STALE"
  | "CONTENT_NICHT_VERIFIZIERT"
  | "SERVICE_NICHT_ERREICHBAR"
  | "Q_NICHT_FREI"
  | "EXCHANGE_MENGE_DRIFT"
  | "INPUT_MENGE_UNZUREICHEND"
  | "SOURCE_SNAPSHOT_DRIFT"
  | "DROP_GRAPH_UNBEGRENZT"
  | "REWARD_DOMAIN_UNGUELTIG"
  | "OUTPUTSPACE_EVIDENCE_UNVOLLSTAENDIG"
  | "RECURSIVE_DROP_POLICY_BLOCK"
  | "SPECIAL_MULTI_OUTPUT_POLICY_BLOCK"
  | "MASS_EXCHANGE_POLICY_BLOCK"
  | "INPUT_WERT_BUDGET_UEBERSCHRITTEN"
  | "WORKSPACE_PLACEHOLDER_FEHLT"
  | "WORKSPACE_FEHLT"
  | "DISPOSITION_BLOCK"
  | "AKTIVE_ITEM_RESERVIERUNG"
  | "GEAR_KANDIDAT_RESERVIERT"
  | "TRANSAKTION_BEREITS_VORHANDEN";

export interface ExchangeProduktionsPlan {
  readonly schemaVersion: 1;
  readonly art: "GEPLANT" | "GESPERRT";
  readonly grund: "OK" | ExchangeProduktionsBlockGrund;
  readonly werttransaktion: WerttransaktionsSicht | null;
  readonly workspaceNachweis: WorkspaceNachweis;
  readonly inputReservierung: ExchangeInputReservierungsAnforderung;
  readonly ressourcenIds: readonly string[];
  readonly rewardDomains: readonly ExchangeRewardDomain[];
  readonly actionContractId: "AL-ACTION-EXCHANGE";
  readonly recoveryContractId: "AL-RECOVERY-EXCHANGE";
  readonly verifierId: "AL-VERIFIER-EXCHANGE";
  readonly publicFunction: "exchange";
  readonly sourceSnapshotCommit:
    typeof PR20_8_EXCHANGE_SOURCE_SNAPSHOT_COMMIT;
  readonly promiseRewardIstNurSupportingEvidence: true;
  readonly fullRewardDomainReconciliationRequired: true;
  readonly placeholderUndQAcceptedInFlight: true;
  readonly exactPhysicalIndexMustBeReresolvedBeforeSend: true;
  readonly previewIstKeineExecutionAuthority: true;
  readonly unknownOutcomeKeinBlindRetry: true;
  readonly sameIntentRetry: false;
  readonly planungsNachweis: true;
  readonly ausfuehrungsAutoritaet: false;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

export interface ExchangeProduktionsPlanerAbhaengigkeiten {
  readonly dispositionen: Pick<
    GegenstandsDispositionsLedger,
    "lies" | "reservierungen"
  >;
  readonly gearAllokation: Pick<GearAllokationsLedger, "snapshot">;
  readonly werttransaktionen: WerttransaktionsLedger;
}

const REWARD_DOMAINS: readonly ExchangeRewardDomain[] = Object.freeze([
  "inventory",
  "gold",
  "shells",
  "account_cosmetics",
  "empty",
  "recursive_drop",
]);

const OUTPUTSPACE_KLASSEN: readonly ExchangeOutputspaceKlasse[] =
  Object.freeze([
    "DETERMINISTIC_ONE_OUTPUT",
    "DETERMINISTIC_MULTI_OUTPUT",
    "PROBABILISTIC_BOUNDED_OUTPUT",
    "RECURSIVE_DROP_OUTPUT",
  ]);

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) {
    throw new Error(fehler);
  }
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

function kompakteKennung(prefix: string, text: string): string {
  let checksum = 0;
  for (let index = 0; index < text.length; index += 1) {
    checksum = (checksum * 131 + text.charCodeAt(index))
      % 2_147_483_647;
  }
  return prefix + ":" + String(text.length) + ":" + String(checksum);
}

function identitaetFrisch(
  identitaet: PhysischeGegenstandsIdentitaet,
  jetztMs: number,
  maximalAlterMs: number,
): boolean {
  return identitaet.beobachtetAmMs <= jetztMs
    && jetztMs - identitaet.beobachtetAmMs <= maximalAlterMs;
}

function aktiveGearZiele(
  ziele: readonly GearZielSicht[],
): readonly GearZielSicht[] {
  return Object.freeze(
    ziele.filter(x =>
      x.status === "RESERVIERT"
      || x.status === "RECOVERY_PENDING"),
  );
}

function hatAktiveReservierung(
  reservierungen: readonly GegenstandsReservierung[],
  physischeKennung: string,
): boolean {
  return reservierungen.some(
    x => x.physischeKennung === physischeKennung,
  );
}

function validiereRewardDomains(
  domains: readonly ExchangeRewardDomain[],
  fehler: string,
): readonly ExchangeRewardDomain[] {
  if (domains.length < 1 || domains.length > REWARD_DOMAINS.length) {
    throw new Error(fehler);
  }
  const eindeutig = [...new Set(domains)];
  if (eindeutig.length !== domains.length
      || domains.some(x => !REWARD_DOMAINS.includes(x))) {
    throw new Error(fehler);
  }
  return Object.freeze([...eindeutig].sort());
}

function validiereDropGraphEvidence(
  evidence: ExchangeDropGraphEvidence,
): void {
  if (evidence.schemaVersion !== 1) {
    throw new Error("EXCHANGE_DROP_GRAPH_SCHEMA_UNGUELTIG");
  }
  for (const text of [
    evidence.sourceSnapshotCommit,
    evidence.dropGraphFingerprint,
    evidence.evidenceFingerprint,
  ]) {
    pruefeText(text, "EXCHANGE_DROP_GRAPH_TEXT_UNGUELTIG");
  }
  if (!OUTPUTSPACE_KLASSEN.includes(evidence.outputspaceKlasse)) {
    throw new Error("EXCHANGE_OUTPUTSPACE_KLASSE_UNGUELTIG");
  }
  validiereRewardDomains(
    evidence.rewardDomains,
    "EXCHANGE_REWARD_DOMAINS_UNGUELTIG",
  );
  pruefeGanzzahl(
    evidence.beobachtetAmMs,
    0,
    Number.MAX_SAFE_INTEGER,
    "EXCHANGE_DROP_GRAPH_ZEIT_UNGUELTIG",
  );
  pruefeGanzzahl(
    evidence.gueltigBisMs,
    evidence.beobachtetAmMs,
    Number.MAX_SAFE_INTEGER,
    "EXCHANGE_DROP_GRAPH_GUELTIGKEIT_UNGUELTIG",
  );
}

function validiereRichtlinie(
  richtlinie: ExchangeProduktionsRichtlinie,
): void {
  pruefeText(
    richtlinie.richtlinienVersion,
    "EXCHANGE_RICHTLINIE_UNGUELTIG",
  );
  pruefeGanzzahl(
    richtlinie.maximalesEvidenceAlterMs,
    1,
    86_400_000,
    "EXCHANGE_EVIDENCE_ALTER_UNGUELTIG",
  );
  pruefeGanzzahl(
    richtlinie.maximalesIdentitaetsAlterMs,
    1,
    86_400_000,
    "EXCHANGE_IDENTITAETSALTER_UNGUELTIG",
  );
  pruefeGanzzahl(
    richtlinie.maximalerInputGesamtwert,
    0,
    Number.MAX_SAFE_INTEGER,
    "EXCHANGE_WERTGRENZE_UNGUELTIG",
  );
  validiereRewardDomains(
    richtlinie.erlaubteRewardDomains,
    "EXCHANGE_RICHTLINIE_REWARD_DOMAINS_UNGUELTIG",
  );
}

function validiereKandidat(
  kandidat: ExchangeProduktionsKandidat,
): void {
  if (kandidat.schemaVersion !== 1) {
    throw new Error("EXCHANGE_SCHEMA_UNGUELTIG");
  }
  for (const text of [
    kandidat.transaktionsId,
    kandidat.ablaufId,
    kandidat.characterId,
    kandidat.prestateFingerprint,
  ]) {
    pruefeText(text, "EXCHANGE_TEXT_UNGUELTIG");
  }
  validierePhysischeGegenstandsIdentitaet(kandidat.input);
  if (kandidat.input.characterId !== kandidat.characterId) {
    throw new Error("EXCHANGE_CHARACTER_DRIFT");
  }
  pruefeGanzzahl(
    kandidat.exchangeMenge,
    1,
    1_000_000,
    "EXCHANGE_MENGE_UNGUELTIG",
  );
  pruefeGanzzahl(
    kandidat.definitionExchangeMenge,
    1,
    1_000_000,
    "EXCHANGE_DEFINITION_MENGE_UNGUELTIG",
  );
  pruefeGanzzahl(
    kandidat.inputGesamtwert,
    0,
    Number.MAX_SAFE_INTEGER,
    "EXCHANGE_INPUT_WERT_UNGUELTIG",
  );
  pruefeGanzzahl(
    kandidat.beobachtetAmMs,
    0,
    Number.MAX_SAFE_INTEGER,
    "EXCHANGE_EVIDENCE_ZEIT_UNGUELTIG",
  );
  pruefeGanzzahl(
    kandidat.gueltigBisMs,
    kandidat.beobachtetAmMs,
    Number.MAX_SAFE_INTEGER,
    "EXCHANGE_EVIDENCE_GUELTIGKEIT_UNGUELTIG",
  );
  validiereDropGraphEvidence(kandidat.dropGraphEvidence);
}

function inputReservierung(
  kandidat: ExchangeProduktionsKandidat,
): ExchangeInputReservierungsAnforderung {
  return Object.freeze({
    physischeKennung: physischeGegenstandsKennung(kandidat.input),
    disposition: "VERBRAUCH",
    menge: kandidat.exchangeMenge,
    rolle: "EXCHANGE_INPUT",
  });
}

function ressourcen(
  kandidat: ExchangeProduktionsKandidat,
): readonly string[] {
  const domains = [...kandidat.dropGraphEvidence.rewardDomains].sort();
  return Object.freeze(
    [
      kompakteKennung("exchange-inventory", kandidat.characterId),
      kompakteKennung("exchange-q", kandidat.characterId),
      kompakteKennung("exchange-socket-budget", kandidat.characterId),
      kompakteKennung(
        "exchange-input",
        physischeGegenstandsKennung(kandidat.input),
      ),
      ...domains.map(x =>
        kompakteKennung("exchange-domain-" + x, kandidat.characterId)),
    ]
      .sort()
      .filter(
        (x, index, alle) => index === 0 || x !== alle[index - 1],
      ),
  );
}

function evidenceStale(
  beobachtetAmMs: number,
  gueltigBisMs: number,
  jetztMs: number,
  maximalAlterMs: number,
): boolean {
  return jetztMs < beobachtetAmMs
    || jetztMs > gueltigBisMs
    || jetztMs - beobachtetAmMs > maximalAlterMs;
}

function blockiert(
  kandidat: ExchangeProduktionsKandidat,
  richtlinie: ExchangeProduktionsRichtlinie,
  abhaengigkeiten: ExchangeProduktionsPlanerAbhaengigkeiten,
  jetztMs: number,
  workspaceNachweis: WorkspaceNachweis,
): ExchangeProduktionsBlockGrund | null {
  if (evidenceStale(
    kandidat.beobachtetAmMs,
    kandidat.gueltigBisMs,
    jetztMs,
    richtlinie.maximalesEvidenceAlterMs,
  ) || evidenceStale(
    kandidat.dropGraphEvidence.beobachtetAmMs,
    kandidat.dropGraphEvidence.gueltigBisMs,
    jetztMs,
    richtlinie.maximalesEvidenceAlterMs,
  )) {
    return "EVIDENCE_STALE";
  }
  if (!identitaetFrisch(
    kandidat.input,
    jetztMs,
    richtlinie.maximalesIdentitaetsAlterMs,
  )) {
    return "IDENTITAET_STALE";
  }
  if (!kandidat.contentVerifiziert) {
    return "CONTENT_NICHT_VERIFIZIERT";
  }
  if (!kandidat.serviceErreichbar) {
    return "SERVICE_NICHT_ERREICHBAR";
  }
  if (!kandidat.qFrei) {
    return "Q_NICHT_FREI";
  }
  if (kandidat.exchangeMenge !== kandidat.definitionExchangeMenge) {
    return "EXCHANGE_MENGE_DRIFT";
  }
  if (kandidat.input.menge < kandidat.exchangeMenge) {
    return "INPUT_MENGE_UNZUREICHEND";
  }
  if (kandidat.dropGraphEvidence.sourceSnapshotCommit
      !== PR20_8_EXCHANGE_SOURCE_SNAPSHOT_COMMIT) {
    return "SOURCE_SNAPSHOT_DRIFT";
  }
  if (!kandidat.dropGraphEvidence.bounded) {
    return "DROP_GRAPH_UNBEGRENZT";
  }

  const rewardDomains = kandidat.dropGraphEvidence.rewardDomains;
  if (rewardDomains.some(
    x => !richtlinie.erlaubteRewardDomains.includes(x),
  )) {
    return "REWARD_DOMAIN_UNGUELTIG";
  }
  const recursive = rewardDomains.includes("recursive_drop");
  if (recursive
      && kandidat.dropGraphEvidence.outputspaceKlasse
        !== "RECURSIVE_DROP_OUTPUT") {
    return "REWARD_DOMAIN_UNGUELTIG";
  }
  if (!recursive
      && kandidat.dropGraphEvidence.outputspaceKlasse
        === "RECURSIVE_DROP_OUTPUT") {
    return "REWARD_DOMAIN_UNGUELTIG";
  }
  if (!kandidat.dropGraphEvidence.conservativeInventoryOutputsComplete
      || (rewardDomains.includes("inventory")
        && kandidat.workspace.outputs.length === 0)) {
    return "OUTPUTSPACE_EVIDENCE_UNVOLLSTAENDIG";
  }
  if (recursive
      && (!kandidat.dropGraphEvidence.recursiveBranchesBounded
        || !richtlinie.recursiveDropErlaubt)) {
    return "RECURSIVE_DROP_POLICY_BLOCK";
  }
  if (kandidat.specialMultiOutputCase
      && (!kandidat.dropGraphEvidence.specialMultiOutputBounded
        || !richtlinie.specialMultiOutputErlaubt)) {
    return "SPECIAL_MULTI_OUTPUT_POLICY_BLOCK";
  }
  if (kandidat.massExchangeConditionActive
      && !richtlinie.massExchangeErlaubt) {
    return "MASS_EXCHANGE_POLICY_BLOCK";
  }
  if (kandidat.inputGesamtwert
      > richtlinie.maximalerInputGesamtwert) {
    return "INPUT_WERT_BUDGET_UEBERSCHRITTEN";
  }
  if (kandidat.workspace.temporaereWorkspaceSlots < 1) {
    return "WORKSPACE_PLACEHOLDER_FEHLT";
  }
  if (!workspaceNachweis.erlaubt) {
    return "WORKSPACE_FEHLT";
  }

  let disposition;
  try {
    disposition = abhaengigkeiten.dispositionen.lies(kandidat.input);
  } catch {
    return "DISPOSITION_BLOCK";
  }
  if (disposition.disposition !== ("VERBRAUCH" as GegenstandsDisposition)) {
    return "DISPOSITION_BLOCK";
  }

  const kennung = physischeGegenstandsKennung(kandidat.input);
  if (hatAktiveReservierung(
    abhaengigkeiten.dispositionen.reservierungen(),
    kennung,
  )) {
    return "AKTIVE_ITEM_RESERVIERUNG";
  }
  if (aktiveGearZiele(
    abhaengigkeiten.gearAllokation.snapshot(),
  ).some(x => x.ziel.kandidat.physischeKennung === kennung)) {
    return "GEAR_KANDIDAT_RESERVIERT";
  }
  if (abhaengigkeiten.werttransaktionen.snapshot().some(
    x => x.transaktionsId === kandidat.transaktionsId,
  )) {
    return "TRANSAKTION_BEREITS_VORHANDEN";
  }
  return null;
}

function ergebnis(
  kandidat: ExchangeProduktionsKandidat,
  art: ExchangeProduktionsPlan["art"],
  grund: ExchangeProduktionsPlan["grund"],
  werttransaktion: WerttransaktionsSicht | null,
  workspaceNachweis: WorkspaceNachweis,
): ExchangeProduktionsPlan {
  return Object.freeze({
    schemaVersion: 1,
    art,
    grund,
    werttransaktion,
    workspaceNachweis: Object.freeze({ ...workspaceNachweis }),
    inputReservierung: inputReservierung(kandidat),
    ressourcenIds: ressourcen(kandidat),
    rewardDomains: Object.freeze(
      [...kandidat.dropGraphEvidence.rewardDomains].sort(),
    ),
    actionContractId: "AL-ACTION-EXCHANGE",
    recoveryContractId: "AL-RECOVERY-EXCHANGE",
    verifierId: "AL-VERIFIER-EXCHANGE",
    publicFunction: "exchange",
    sourceSnapshotCommit: PR20_8_EXCHANGE_SOURCE_SNAPSHOT_COMMIT,
    promiseRewardIstNurSupportingEvidence: true,
    fullRewardDomainReconciliationRequired: true,
    placeholderUndQAcceptedInFlight: true,
    exactPhysicalIndexMustBeReresolvedBeforeSend: true,
    previewIstKeineExecutionAuthority: true,
    unknownOutcomeKeinBlindRetry: true,
    sameIntentRetry: false,
    planungsNachweis: true,
    ausfuehrungsAutoritaet: false,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
  });
}

export function planeExchangeProduktion(
  kandidat: ExchangeProduktionsKandidat,
  richtlinie: ExchangeProduktionsRichtlinie,
  abhaengigkeiten: ExchangeProduktionsPlanerAbhaengigkeiten,
  jetztMs: number,
): ExchangeProduktionsPlan {
  validiereKandidat(kandidat);
  validiereRichtlinie(richtlinie);
  pruefeGanzzahl(
    jetztMs,
    0,
    Number.MAX_SAFE_INTEGER,
    "EXCHANGE_ZEIT_UNGUELTIG",
  );

  const workspaceNachweis =
    pruefeWorkspaceKapazitaet(kandidat.workspace);
  const grund = blockiert(
    kandidat,
    richtlinie,
    abhaengigkeiten,
    jetztMs,
    workspaceNachweis,
  );
  if (grund !== null) {
    return ergebnis(
      kandidat,
      "GESPERRT",
      grund,
      null,
      workspaceNachweis,
    );
  }

  const werttransaktion = abhaengigkeiten.werttransaktionen.plane({
    schemaVersion: 1,
    transaktionsId: kandidat.transaktionsId,
    ablaufId: kandidat.ablaufId,
    characterId: kandidat.characterId,
    art: "EXCHANGE",
    actionContractId: "AL-ACTION-EXCHANGE",
    recoveryContractId: "AL-RECOVERY-EXCHANGE",
    physischeInputKennungen: Object.freeze([
      physischeGegenstandsKennung(kandidat.input),
    ]),
    prestateFingerprint: kandidat.prestateFingerprint,
  });

  return ergebnis(
    kandidat,
    "GEPLANT",
    "OK",
    werttransaktion,
    workspaceNachweis,
  );
}
