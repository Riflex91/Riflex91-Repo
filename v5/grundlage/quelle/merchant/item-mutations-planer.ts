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

export type ItemMutationsArt = "UPGRADE" | "COMPOUND";

export interface ItemMutationsPfadEvidence {
  readonly schemaVersion: 1;
  readonly art: ItemMutationsArt;
  readonly pfad:
    | "NORMAL_LEVEL_UPGRADE"
    | "NORMAL_COMPOUND";
  readonly previewNurPlanungsEvidence: true;
  readonly zielVerlustBeiUpgradeFehler: boolean;
  readonly alleDreiInputsVerlustBeiCompoundFehler: boolean;
  readonly beobachtetAmMs: number;
  readonly gueltigBisMs: number;
  readonly evidenceFingerprint: string;
}

export interface ItemMutationsRichtlinie {
  readonly richtlinienVersion: string;
  readonly maximalesEvidenceAlterMs: number;
  readonly maximalesIdentitaetsAlterMs: number;
  readonly maximalerInputGesamtwert: number;
  readonly maximalerZielLevelVorMutation: number;
  readonly upgradeItemverlustErlaubt: boolean;
  readonly compoundDreifachverlustErlaubt: boolean;
  readonly offeringErlaubt: boolean;
}

export interface ItemMutationsKandidat {
  readonly schemaVersion: 1;
  readonly transaktionsId: string;
  readonly ablaufId: string;
  readonly characterId: string;
  readonly art: ItemMutationsArt;
  readonly ziele: readonly PhysischeGegenstandsIdentitaet[];
  readonly scroll: PhysischeGegenstandsIdentitaet;
  readonly scrollMenge: number;
  readonly offering: PhysischeGegenstandsIdentitaet | null;
  readonly offeringMenge: number;
  readonly inputGesamtwert: number;
  readonly contentVerifiziert: boolean;
  readonly serviceErreichbar: boolean;
  readonly qFrei: boolean;
  readonly workspace: WorkspaceAnfrage;
  readonly pfadEvidence: ItemMutationsPfadEvidence;
  readonly beobachtetAmMs: number;
  readonly gueltigBisMs: number;
  readonly prestateFingerprint: string;
}

export interface ItemMutationsReservierungsAnforderung {
  readonly physischeKennung: string;
  readonly disposition: GegenstandsDisposition;
  readonly menge: number;
  readonly rolle: "ZIEL" | "SCROLL" | "OFFERING";
}

export type ItemMutationsBlockGrund =
  | "EVIDENCE_STALE"
  | "IDENTITAET_STALE"
  | "CONTENT_NICHT_VERIFIZIERT"
  | "SERVICE_NICHT_ERREICHBAR"
  | "Q_NICHT_FREI"
  | "WORKSPACE_FEHLT"
  | "PFAD_NICHT_FREIGEGEBEN"
  | "RISIKO_POLICY_BLOCK"
  | "INPUT_WERT_BUDGET_UEBERSCHRITTEN"
  | "ZIEL_LEVEL_UEBER_GRENZE"
  | "DISPOSITION_BLOCK"
  | "AKTIVE_ITEM_RESERVIERUNG"
  | "GEAR_KANDIDAT_RESERVIERT"
  | "TRANSAKTION_BEREITS_VORHANDEN";

export interface ItemMutationsPlan {
  readonly schemaVersion: 1;
  readonly art: "GEPLANT" | "GESPERRT";
  readonly grund: "OK" | ItemMutationsBlockGrund;
  readonly werttransaktion: WerttransaktionsSicht | null;
  readonly workspaceNachweis: WorkspaceNachweis;
  readonly reservierungen:
    readonly ItemMutationsReservierungsAnforderung[];
  readonly ressourcenIds: readonly string[];
  readonly actionContractId:
    | "AL-ACTION-UPGRADE"
    | "AL-ACTION-COMPOUND";
  readonly recoveryContractId:
    | "AL-RECOVERY-UPGRADE"
    | "AL-RECOVERY-COMPOUND";
  readonly verifierId:
    | "AL-VERIFIER-UPGRADE"
    | "AL-VERIFIER-COMPOUND";
  readonly previewIstKeineExecutionAuthority: true;
  readonly unknownOutcomeKeinBlindRetry: true;
  readonly planungsNachweis: true;
  readonly ausfuehrungsAutoritaet: false;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

export interface ItemMutationsPlanerAbhaengigkeiten {
  readonly dispositionen: Pick<
    GegenstandsDispositionsLedger,
    "lies" | "reservierungen"
  >;
  readonly gearAllokation: Pick<GearAllokationsLedger, "snapshot">;
  readonly werttransaktionen: WerttransaktionsLedger;
}

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

function actionContractId(
  art: ItemMutationsArt,
): "AL-ACTION-UPGRADE" | "AL-ACTION-COMPOUND" {
  return art === "UPGRADE"
    ? "AL-ACTION-UPGRADE"
    : "AL-ACTION-COMPOUND";
}

function recoveryContractId(
  art: ItemMutationsArt,
): "AL-RECOVERY-UPGRADE" | "AL-RECOVERY-COMPOUND" {
  return art === "UPGRADE"
    ? "AL-RECOVERY-UPGRADE"
    : "AL-RECOVERY-COMPOUND";
}

function verifierId(
  art: ItemMutationsArt,
): "AL-VERIFIER-UPGRADE" | "AL-VERIFIER-COMPOUND" {
  return art === "UPGRADE"
    ? "AL-VERIFIER-UPGRADE"
    : "AL-VERIFIER-COMPOUND";
}

function erwarteterPfad(
  art: ItemMutationsArt,
): ItemMutationsPfadEvidence["pfad"] {
  return art === "UPGRADE"
    ? "NORMAL_LEVEL_UPGRADE"
    : "NORMAL_COMPOUND";
}

function zielDisposition(
  art: ItemMutationsArt,
): GegenstandsDisposition {
  return art;
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

function identitaetFrisch(
  identitaet: PhysischeGegenstandsIdentitaet,
  jetztMs: number,
  maximalAlterMs: number,
): boolean {
  return identitaet.beobachtetAmMs <= jetztMs
    && jetztMs - identitaet.beobachtetAmMs <= maximalAlterMs;
}

function alleIdentitaeten(
  kandidat: ItemMutationsKandidat,
): readonly PhysischeGegenstandsIdentitaet[] {
  return Object.freeze([
    ...kandidat.ziele,
    kandidat.scroll,
    ...(kandidat.offering === null ? [] : [kandidat.offering]),
  ]);
}

function validiereRichtlinie(
  richtlinie: ItemMutationsRichtlinie,
): void {
  pruefeText(
    richtlinie.richtlinienVersion,
    "ITEM_MUTATION_RICHTLINIE_UNGUELTIG",
  );
  pruefeGanzzahl(
    richtlinie.maximalesEvidenceAlterMs,
    1,
    86_400_000,
    "ITEM_MUTATION_EVIDENCE_ALTER_UNGUELTIG",
  );
  pruefeGanzzahl(
    richtlinie.maximalesIdentitaetsAlterMs,
    1,
    86_400_000,
    "ITEM_MUTATION_IDENTITAETSALTER_UNGUELTIG",
  );
  pruefeGanzzahl(
    richtlinie.maximalerInputGesamtwert,
    0,
    Number.MAX_SAFE_INTEGER,
    "ITEM_MUTATION_WERTGRENZE_UNGUELTIG",
  );
  pruefeGanzzahl(
    richtlinie.maximalerZielLevelVorMutation,
    0,
    99,
    "ITEM_MUTATION_LEVELGRENZE_UNGUELTIG",
  );
}

function validierePfadEvidence(
  evidence: ItemMutationsPfadEvidence,
): void {
  if (evidence.schemaVersion !== 1
      || evidence.previewNurPlanungsEvidence !== true) {
    throw new Error("ITEM_MUTATION_PFAD_EVIDENCE_UNGUELTIG");
  }
  pruefeText(
    evidence.evidenceFingerprint,
    "ITEM_MUTATION_PFAD_FINGERPRINT_UNGUELTIG",
  );
  pruefeGanzzahl(
    evidence.beobachtetAmMs,
    0,
    Number.MAX_SAFE_INTEGER,
    "ITEM_MUTATION_PFAD_ZEIT_UNGUELTIG",
  );
  pruefeGanzzahl(
    evidence.gueltigBisMs,
    evidence.beobachtetAmMs,
    Number.MAX_SAFE_INTEGER,
    "ITEM_MUTATION_PFAD_GUELTIGKEIT_UNGUELTIG",
  );
}

function validiereKandidat(
  kandidat: ItemMutationsKandidat,
): void {
  if (kandidat.schemaVersion !== 1) {
    throw new Error("ITEM_MUTATION_SCHEMA_UNGUELTIG");
  }
  for (const text of [
    kandidat.transaktionsId,
    kandidat.ablaufId,
    kandidat.characterId,
    kandidat.prestateFingerprint,
  ]) {
    pruefeText(text, "ITEM_MUTATION_TEXT_UNGUELTIG");
  }
  if (kandidat.art !== "UPGRADE" && kandidat.art !== "COMPOUND") {
    throw new Error("ITEM_MUTATION_ART_UNGUELTIG");
  }
  if (kandidat.ziele.length !== (kandidat.art === "UPGRADE" ? 1 : 3)) {
    throw new Error("ITEM_MUTATION_ZIEL_ANZAHL_UNGUELTIG");
  }
  for (const identitaet of alleIdentitaeten(kandidat)) {
    validierePhysischeGegenstandsIdentitaet(identitaet);
    if (identitaet.characterId !== kandidat.characterId) {
      throw new Error("ITEM_MUTATION_CHARACTER_DRIFT");
    }
  }
  const kennungen = alleIdentitaeten(kandidat)
    .map(physischeGegenstandsKennung)
    .sort();
  if (kennungen.some(
    (x, index) => index > 0 && x === kennungen[index - 1],
  )) {
    throw new Error("ITEM_MUTATION_PHYSISCHER_INPUT_DOPPELT");
  }
  if (kandidat.art === "COMPOUND") {
    const basis = kandidat.ziele[0];
    if (basis === undefined
        || kandidat.ziele.some(
          x => x.name !== basis.name || x.level !== basis.level,
        )) {
      throw new Error("ITEM_MUTATION_COMPOUND_INPUTS_NICHT_GLEICH");
    }
  }
  pruefeGanzzahl(
    kandidat.scrollMenge,
    1,
    kandidat.scroll.menge,
    "ITEM_MUTATION_SCROLL_MENGE_UNGUELTIG",
  );
  if (kandidat.offering === null) {
    if (kandidat.offeringMenge !== 0) {
      throw new Error("ITEM_MUTATION_OFFERING_MENGE_UNGUELTIG");
    }
  } else {
    pruefeGanzzahl(
      kandidat.offeringMenge,
      1,
      kandidat.offering.menge,
      "ITEM_MUTATION_OFFERING_MENGE_UNGUELTIG",
    );
  }
  pruefeGanzzahl(
    kandidat.inputGesamtwert,
    0,
    Number.MAX_SAFE_INTEGER,
    "ITEM_MUTATION_INPUT_WERT_UNGUELTIG",
  );
  pruefeGanzzahl(
    kandidat.beobachtetAmMs,
    0,
    Number.MAX_SAFE_INTEGER,
    "ITEM_MUTATION_EVIDENCE_ZEIT_UNGUELTIG",
  );
  pruefeGanzzahl(
    kandidat.gueltigBisMs,
    kandidat.beobachtetAmMs,
    Number.MAX_SAFE_INTEGER,
    "ITEM_MUTATION_EVIDENCE_GUELTIGKEIT_UNGUELTIG",
  );
  validierePfadEvidence(kandidat.pfadEvidence);
  if (kandidat.pfadEvidence.art !== kandidat.art) {
    throw new Error("ITEM_MUTATION_PFAD_ART_DRIFT");
  }
}

function reservierungsAnforderungen(
  kandidat: ItemMutationsKandidat,
): readonly ItemMutationsReservierungsAnforderung[] {
  const zielZweck = zielDisposition(kandidat.art);
  const zielRows = kandidat.ziele.map(x => Object.freeze({
    physischeKennung: physischeGegenstandsKennung(x),
    disposition: zielZweck,
    menge: 1,
    rolle: "ZIEL" as const,
  }));
  const scroll = Object.freeze({
    physischeKennung: physischeGegenstandsKennung(kandidat.scroll),
    disposition: "VERBRAUCH" as const,
    menge: kandidat.scrollMenge,
    rolle: "SCROLL" as const,
  });
  const offering = kandidat.offering === null
    ? []
    : [Object.freeze({
      physischeKennung: physischeGegenstandsKennung(kandidat.offering),
      disposition: "VERBRAUCH" as const,
      menge: kandidat.offeringMenge,
      rolle: "OFFERING" as const,
    })];
  return Object.freeze([...zielRows, scroll, ...offering]);
}

function ressourcen(
  kandidat: ItemMutationsKandidat,
): readonly string[] {
  const itemRessourcen = alleIdentitaeten(kandidat).map(
    x => kompakteKennung(
      "mutation-item",
      physischeGegenstandsKennung(x),
    ),
  );
  return Object.freeze(
    [
      "character:" + kandidat.characterId + ":inventory",
      "character:" + kandidat.characterId + ":q:"
        + kandidat.art.toLowerCase(),
      "character:" + kandidat.characterId + ":socket_call_budget",
      ...itemRessourcen,
    ]
      .sort()
      .filter(
        (x, index, alle) => index === 0 || x !== alle[index - 1],
      ),
  );
}

function blockiert(
  kandidat: ItemMutationsKandidat,
  richtlinie: ItemMutationsRichtlinie,
  abhaengigkeiten: ItemMutationsPlanerAbhaengigkeiten,
  jetztMs: number,
  workspaceNachweis: WorkspaceNachweis,
): ItemMutationsBlockGrund | null {
  if (jetztMs < kandidat.beobachtetAmMs
      || jetztMs > kandidat.gueltigBisMs
      || jetztMs - kandidat.beobachtetAmMs
        > richtlinie.maximalesEvidenceAlterMs
      || jetztMs < kandidat.pfadEvidence.beobachtetAmMs
      || jetztMs > kandidat.pfadEvidence.gueltigBisMs
      || jetztMs - kandidat.pfadEvidence.beobachtetAmMs
        > richtlinie.maximalesEvidenceAlterMs) {
    return "EVIDENCE_STALE";
  }
  if (alleIdentitaeten(kandidat).some(
    x => !identitaetFrisch(
      x,
      jetztMs,
      richtlinie.maximalesIdentitaetsAlterMs,
    ),
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
  if (!workspaceNachweis.erlaubt) {
    return "WORKSPACE_FEHLT";
  }
  if (kandidat.pfadEvidence.pfad !== erwarteterPfad(kandidat.art)) {
    return "PFAD_NICHT_FREIGEGEBEN";
  }
  if (kandidat.art === "UPGRADE"
      && (!kandidat.pfadEvidence.zielVerlustBeiUpgradeFehler
        || kandidat.pfadEvidence
          .alleDreiInputsVerlustBeiCompoundFehler)) {
    return "PFAD_NICHT_FREIGEGEBEN";
  }
  if (kandidat.art === "COMPOUND"
      && (kandidat.pfadEvidence.zielVerlustBeiUpgradeFehler
        || !kandidat.pfadEvidence
          .alleDreiInputsVerlustBeiCompoundFehler)) {
    return "PFAD_NICHT_FREIGEGEBEN";
  }
  if ((kandidat.art === "UPGRADE"
      && !richtlinie.upgradeItemverlustErlaubt)
      || (kandidat.art === "COMPOUND"
        && !richtlinie.compoundDreifachverlustErlaubt)
      || (kandidat.offering !== null
        && !richtlinie.offeringErlaubt)) {
    return "RISIKO_POLICY_BLOCK";
  }
  if (kandidat.inputGesamtwert
      > richtlinie.maximalerInputGesamtwert) {
    return "INPUT_WERT_BUDGET_UEBERSCHRITTEN";
  }
  if (kandidat.ziele.some(
    x => x.level > richtlinie.maximalerZielLevelVorMutation,
  )) {
    return "ZIEL_LEVEL_UEBER_GRENZE";
  }

  const anforderungen = reservierungsAnforderungen(kandidat);
  for (let index = 0; index < anforderungen.length; index += 1) {
    const anforderung = anforderungen[index];
    const identitaet = alleIdentitaeten(kandidat)[index];
    if (anforderung === undefined || identitaet === undefined) {
      throw new Error("ITEM_MUTATION_RESERVIERUNG_ZUORDNUNG_FEHLT");
    }
    let disposition;
    try {
      disposition = abhaengigkeiten.dispositionen.lies(identitaet);
    } catch {
      return "DISPOSITION_BLOCK";
    }
    if (disposition.disposition !== anforderung.disposition) {
      return "DISPOSITION_BLOCK";
    }
  }

  const aktiveReservierungen =
    abhaengigkeiten.dispositionen.reservierungen();
  if (anforderungen.some(x =>
    hatAktiveReservierung(
      aktiveReservierungen,
      x.physischeKennung,
    ),
  )) {
    return "AKTIVE_ITEM_RESERVIERUNG";
  }

  const gear = aktiveGearZiele(
    abhaengigkeiten.gearAllokation.snapshot(),
  );
  const zielKennungen = kandidat.ziele.map(
    physischeGegenstandsKennung,
  );
  if (gear.some(x =>
    zielKennungen.includes(x.ziel.kandidat.physischeKennung),
  )) {
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
  kandidat: ItemMutationsKandidat,
  art: ItemMutationsPlan["art"],
  grund: ItemMutationsPlan["grund"],
  werttransaktion: WerttransaktionsSicht | null,
  workspaceNachweis: WorkspaceNachweis,
): ItemMutationsPlan {
  return Object.freeze({
    schemaVersion: 1,
    art,
    grund,
    werttransaktion,
    workspaceNachweis: Object.freeze({ ...workspaceNachweis }),
    reservierungen: reservierungsAnforderungen(kandidat),
    ressourcenIds: ressourcen(kandidat),
    actionContractId: actionContractId(kandidat.art),
    recoveryContractId: recoveryContractId(kandidat.art),
    verifierId: verifierId(kandidat.art),
    previewIstKeineExecutionAuthority: true,
    unknownOutcomeKeinBlindRetry: true,
    planungsNachweis: true,
    ausfuehrungsAutoritaet: false,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
  });
}

export function planeItemMutation(
  kandidat: ItemMutationsKandidat,
  richtlinie: ItemMutationsRichtlinie,
  abhaengigkeiten: ItemMutationsPlanerAbhaengigkeiten,
  jetztMs: number,
): ItemMutationsPlan {
  validiereKandidat(kandidat);
  validiereRichtlinie(richtlinie);
  pruefeGanzzahl(
    jetztMs,
    0,
    Number.MAX_SAFE_INTEGER,
    "ITEM_MUTATION_ZEIT_UNGUELTIG",
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
    art: kandidat.art,
    actionContractId: actionContractId(kandidat.art),
    recoveryContractId: recoveryContractId(kandidat.art),
    physischeInputKennungen: Object.freeze(
      alleIdentitaeten(kandidat)
        .map(physischeGegenstandsKennung),
    ),
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
