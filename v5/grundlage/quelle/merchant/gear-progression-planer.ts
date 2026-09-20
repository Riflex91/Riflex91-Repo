import type { CharacterZielBindung } from "../koordination/roster-wahrheit.js";
import {
  physischeGegenstandsKennung,
  validierePhysischeGegenstandsIdentitaet,
  type PhysischeGegenstandsIdentitaet,
} from "./gegenstands-identitaet.js";
import type {
  GegenstandsDisposition,
  GegenstandsDispositionsLedger,
} from "./disposition.js";
import type {
  GearZiel,
  GearZielPrioritaet,
  GearZielSicht,
} from "./gear-allokation.js";

export interface GearKandidatenEvidence {
  readonly schemaVersion: 1;
  readonly source: CharacterZielBindung;
  readonly recipient: CharacterZielBindung;
  readonly prioritaet: GearZielPrioritaet;
  readonly slot: string;
  readonly identitaet: PhysischeGegenstandsIdentitaet;
  readonly aktuellerScore: number;
  readonly kandidatScore: number;
  readonly kompatibel: boolean;
  readonly contentVerifiziert: boolean;
  readonly gesperrt: boolean;
  readonly blockiert: boolean;
  readonly spezialKennung: string | null;
  readonly zielSlotFingerprint: string;
  readonly evidenceFingerprint: string;
  readonly beobachtetAmMs: number;
  readonly gueltigBisMs: number;
}

export interface GearProgressionsRichtlinie {
  readonly richtlinienVersion: string;
  readonly maximalesEvidenceAlterMs: number;
  readonly minimaleFarmerVerbesserung: number;
  readonly minimaleMerchantSelfVerbesserung: number;
  readonly maximaleZiele: number;
}

export type GearPlanungsAblehnungGrund =
  | "EVIDENCE_STALE"
  | "IDENTITAET_STALE"
  | "ROSTER_DRIFT"
  | "SOURCE_IDENTITAET_DRIFT"
  | "PRIORITAET_ZIEL_DRIFT"
  | "NICHT_KOMPATIBEL"
  | "CONTENT_NICHT_VERIFIZIERT"
  | "PHYSISCH_GESCHUETZT"
  | "NICHT_EINZELNES_GEAR"
  | "DISPOSITION_FEHLT"
  | "DISPOSITION_VERBIETET"
  | "PHYSISCH_BEREITS_RESERVIERT"
  | "GEAR_KANDIDAT_BEREITS_AKTIV"
  | "RECIPIENT_SLOT_BEREITS_AKTIV"
  | "VERBESSERUNG_ZU_KLEIN"
  | "DUPLIKAT_IM_PLAN";

export interface GearPlanungsAblehnung {
  readonly recipientCharacterId: string;
  readonly slot: string;
  readonly physischeKennung: string;
  readonly evidenceFingerprint: string;
  readonly grund: GearPlanungsAblehnungGrund;
}

export interface GearProgressionsPlan {
  readonly schemaVersion: 1;
  readonly ziele: readonly GearZiel[];
  readonly abgelehnt: readonly GearPlanungsAblehnung[];
  readonly richtlinienVersion: string;
  readonly planningEvidence: true;
  readonly ausfuehrungsAutoritaet: false;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

export interface GearProgressionsAnfrage {
  readonly merchant: CharacterZielBindung;
  readonly kandidaten: readonly GearKandidatenEvidence[];
  readonly bestehendeGearZiele: readonly GearZielSicht[];
  readonly dispositionen: Pick<
    GegenstandsDispositionsLedger,
    "lies" | "reservierungen"
  >;
  readonly richtlinie: GearProgressionsRichtlinie;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function pruefeBindung(
  bindung: CharacterZielBindung,
  fehler: string,
): void {
  if (bindung.schemaVersion !== 1
      || !Number.isSafeInteger(bindung.rosterEpoche)
      || bindung.rosterEpoche < 1) {
    throw new Error(fehler);
  }
  for (const text of [
    bindung.accountId,
    bindung.characterId,
    bindung.sessionId,
    bindung.serverRegion,
    bindung.serverIdentifier,
    bindung.rosterFingerprint,
  ]) {
    pruefeText(text, fehler);
  }
}

function gleicheRosterWahrheit(
  a: CharacterZielBindung,
  b: CharacterZielBindung,
): boolean {
  return a.accountId === b.accountId
    && a.serverRegion === b.serverRegion
    && a.serverIdentifier === b.serverIdentifier
    && a.rosterEpoche === b.rosterEpoche
    && a.rosterFingerprint === b.rosterFingerprint;
}

function kompakteKennung(prefix: string, text: string): string {
  let checksum = 0;
  for (let index = 0; index < text.length; index += 1) {
    checksum = (checksum * 131 + text.charCodeAt(index)) % 2_147_483_647;
  }
  return prefix + ":" + String(text.length) + ":" + String(checksum);
}

function validiereRichtlinie(richtlinie: GearProgressionsRichtlinie): void {
  pruefeText(
    richtlinie.richtlinienVersion,
    "GEAR_PLAN_RICHTLINIE_UNGUELTIG",
  );
  if (!Number.isSafeInteger(richtlinie.maximalesEvidenceAlterMs)
      || richtlinie.maximalesEvidenceAlterMs < 1
      || richtlinie.maximalesEvidenceAlterMs > 60_000
      || !Number.isFinite(richtlinie.minimaleFarmerVerbesserung)
      || richtlinie.minimaleFarmerVerbesserung <= 0
      || !Number.isFinite(richtlinie.minimaleMerchantSelfVerbesserung)
      || richtlinie.minimaleMerchantSelfVerbesserung <= 0
      || !Number.isInteger(richtlinie.maximaleZiele)
      || richtlinie.maximaleZiele < 1
      || richtlinie.maximaleZiele > 64) {
    throw new Error("GEAR_PLAN_RICHTLINIE_UNGUELTIG");
  }
}

function expectedDisposition(
  prioritaet: GearZielPrioritaet,
): GegenstandsDisposition {
  return prioritaet === "FARMER" ? "DELIVERY" : "BEHALTEN";
}

function minimaleVerbesserung(
  prioritaet: GearZielPrioritaet,
  richtlinie: GearProgressionsRichtlinie,
): number {
  return prioritaet === "FARMER"
    ? richtlinie.minimaleFarmerVerbesserung
    : richtlinie.minimaleMerchantSelfVerbesserung;
}

function istTerminalGearStatus(status: GearZielSicht["status"]): boolean {
  return status === "SETTLED" || status === "ABGEBROCHEN";
}

function friereGearZiel(ziel: GearZiel): GearZiel {
  return Object.freeze({
    ...ziel,
    recipient: Object.freeze({ ...ziel.recipient }),
    kandidat: Object.freeze({ ...ziel.kandidat }),
  });
}

function ablehnung(
  evidence: GearKandidatenEvidence,
  physischeKennung: string,
  grund: GearPlanungsAblehnungGrund,
): GearPlanungsAblehnung {
  return Object.freeze({
    recipientCharacterId: evidence.recipient.characterId,
    slot: evidence.slot,
    physischeKennung,
    evidenceFingerprint: evidence.evidenceFingerprint,
    grund,
  });
}

function evidenceFrisch(
  evidence: GearKandidatenEvidence,
  jetztMs: number,
  maxAlterMs: number,
): boolean {
  return Number.isSafeInteger(evidence.beobachtetAmMs)
    && Number.isSafeInteger(evidence.gueltigBisMs)
    && evidence.beobachtetAmMs >= 0
    && evidence.gueltigBisMs >= evidence.beobachtetAmMs
    && jetztMs >= evidence.beobachtetAmMs
    && jetztMs <= evidence.gueltigBisMs
    && jetztMs - evidence.beobachtetAmMs <= maxAlterMs;
}

function identitaetFrisch(
  identitaet: PhysischeGegenstandsIdentitaet,
  jetztMs: number,
  maxAlterMs: number,
): boolean {
  return identitaet.beobachtetAmMs <= jetztMs
    && jetztMs - identitaet.beobachtetAmMs <= maxAlterMs;
}

function validiereEvidenceStruktur(
  evidence: GearKandidatenEvidence,
): void {
  if (evidence.schemaVersion !== 1) {
    throw new Error("GEAR_PLAN_EVIDENCE_SCHEMA_UNGUELTIG");
  }
  pruefeBindung(evidence.source, "GEAR_PLAN_SOURCE_BINDUNG_UNGUELTIG");
  pruefeBindung(evidence.recipient, "GEAR_PLAN_RECIPIENT_BINDUNG_UNGUELTIG");
  validierePhysischeGegenstandsIdentitaet(evidence.identitaet);
  for (const text of [
    evidence.slot,
    evidence.zielSlotFingerprint,
    evidence.evidenceFingerprint,
  ]) {
    pruefeText(text, "GEAR_PLAN_EVIDENCE_TEXT_UNGUELTIG");
  }
  if (!["FARMER", "MERCHANT_SELF"].includes(evidence.prioritaet)
      || !Number.isFinite(evidence.aktuellerScore)
      || !Number.isFinite(evidence.kandidatScore)) {
    throw new Error("GEAR_PLAN_EVIDENCE_WERT_UNGUELTIG");
  }
  if (evidence.spezialKennung !== null) {
    pruefeText(
      evidence.spezialKennung,
      "GEAR_PLAN_SPEZIALKENNUNG_UNGUELTIG",
    );
  }
}

function grundVorAuswahl(
  anfrage: GearProgressionsAnfrage,
  evidence: GearKandidatenEvidence,
  jetztMs: number,
  physischeKennung: string,
): GearPlanungsAblehnungGrund | null {
  const policy = anfrage.richtlinie;
  if (!evidenceFrisch(
    evidence,
    jetztMs,
    policy.maximalesEvidenceAlterMs,
  )) {
    return "EVIDENCE_STALE";
  }
  if (!identitaetFrisch(
    evidence.identitaet,
    jetztMs,
    policy.maximalesEvidenceAlterMs,
  )) {
    return "IDENTITAET_STALE";
  }
  if (!gleicheRosterWahrheit(anfrage.merchant, evidence.source)
      || !gleicheRosterWahrheit(anfrage.merchant, evidence.recipient)) {
    return "ROSTER_DRIFT";
  }
  if (evidence.source.characterId !== evidence.identitaet.characterId) {
    return "SOURCE_IDENTITAET_DRIFT";
  }
  if ((evidence.prioritaet === "FARMER"
      && evidence.recipient.characterId === anfrage.merchant.characterId)
      || (evidence.prioritaet === "MERCHANT_SELF"
        && (evidence.recipient.characterId !== anfrage.merchant.characterId
          || evidence.source.characterId !== anfrage.merchant.characterId))) {
    return "PRIORITAET_ZIEL_DRIFT";
  }
  if (!evidence.kompatibel) return "NICHT_KOMPATIBEL";
  if (!evidence.contentVerifiziert) return "CONTENT_NICHT_VERIFIZIERT";
  if (evidence.gesperrt
      || evidence.blockiert
      || evidence.spezialKennung !== null) {
    return "PHYSISCH_GESCHUETZT";
  }
  if (evidence.identitaet.menge !== 1) return "NICHT_EINZELNES_GEAR";

  let disposition;
  try {
    disposition = anfrage.dispositionen.lies(evidence.identitaet);
  } catch {
    return "DISPOSITION_FEHLT";
  }
  if (disposition.disposition !== expectedDisposition(evidence.prioritaet)) {
    return "DISPOSITION_VERBIETET";
  }

  if (anfrage.dispositionen.reservierungen().some(
    x => x.physischeKennung === physischeKennung,
  )) {
    return "PHYSISCH_BEREITS_RESERVIERT";
  }

  const aktive = anfrage.bestehendeGearZiele.filter(
    x => !istTerminalGearStatus(x.status),
  );
  if (aktive.some(
    x => x.ziel.kandidat.physischeKennung === physischeKennung,
  )) {
    return "GEAR_KANDIDAT_BEREITS_AKTIV";
  }
  if (aktive.some(
    x => x.ziel.recipient.characterId === evidence.recipient.characterId
      && x.ziel.slot === evidence.slot,
  )) {
    return "RECIPIENT_SLOT_BEREITS_AKTIV";
  }

  if (evidence.kandidatScore - evidence.aktuellerScore
      < minimaleVerbesserung(evidence.prioritaet, policy)) {
    return "VERBESSERUNG_ZU_KLEIN";
  }
  return null;
}

function baueGearZiel(
  evidence: GearKandidatenEvidence,
  richtlinie: GearProgressionsRichtlinie,
  jetztMs: number,
  physischeKennung: string,
): GearZiel {
  const mindest = minimaleVerbesserung(
    evidence.prioritaet,
    richtlinie,
  );
  return friereGearZiel({
    schemaVersion: 1,
    gearZielId: kompakteKennung(
      "gear-ziel",
      [
        evidence.recipient.characterId,
        evidence.recipient.sessionId,
        String(evidence.recipient.rosterEpoche),
        evidence.slot,
        physischeKennung,
        evidence.zielSlotFingerprint,
        evidence.evidenceFingerprint,
        richtlinie.richtlinienVersion,
      ].join("|"),
    ),
    recipient: evidence.recipient,
    slot: evidence.slot,
    prioritaet: evidence.prioritaet,
    aktuellerScore: evidence.aktuellerScore,
    minimaleVerbesserung: mindest,
    kandidat: Object.freeze({
      physischeKennung,
      name: evidence.identitaet.name,
      level: evidence.identitaet.level,
      score: evidence.kandidatScore,
      beobachtungsFingerprint: evidence.identitaet.beobachtungsFingerprint,
    }),
    erstelltAmMs: jetztMs,
    gueltigBisMs: evidence.gueltigBisMs,
  });
}

export function planeGearProgression(
  anfrage: GearProgressionsAnfrage,
  jetztMs: number,
): GearProgressionsPlan {
  validiereRichtlinie(anfrage.richtlinie);
  pruefeBindung(anfrage.merchant, "GEAR_PLAN_MERCHANT_BINDUNG_UNGUELTIG");
  if (!Number.isSafeInteger(jetztMs) || jetztMs < 0) {
    throw new Error("GEAR_PLAN_ZEIT_UNGUELTIG");
  }
  if (anfrage.kandidaten.length > 512) {
    throw new Error("GEAR_PLAN_ZU_VIELE_KANDIDATEN");
  }
  if (anfrage.bestehendeGearZiele.length > 2048) {
    throw new Error("GEAR_PLAN_BESTEHENDE_ZIELE_ZU_GROSS");
  }

  let gueltig: readonly Readonly<{
    evidence: GearKandidatenEvidence;
    physischeKennung: string;
    verbesserung: number;
  }>[] = Object.freeze([]);
  let abgelehnt: readonly GearPlanungsAblehnung[] = Object.freeze([]);

  for (const evidence of anfrage.kandidaten) {
    validiereEvidenceStruktur(evidence);
    const physischeKennung = physischeGegenstandsKennung(
      evidence.identitaet,
    );
    const grund = grundVorAuswahl(
      anfrage,
      evidence,
      jetztMs,
      physischeKennung,
    );
    if (grund !== null) {
      abgelehnt = Object.freeze([
        ...abgelehnt,
        ablehnung(evidence, physischeKennung, grund),
      ]);
      continue;
    }
    gueltig = Object.freeze([
      ...gueltig,
      Object.freeze({
        evidence,
        physischeKennung,
        verbesserung: evidence.kandidatScore - evidence.aktuellerScore,
      }),
    ]);
  }

  const sortiert = [...gueltig].sort((a, b) => {
    const aPrioritaet = a.evidence.prioritaet === "FARMER" ? 0 : 1;
    const bPrioritaet = b.evidence.prioritaet === "FARMER" ? 0 : 1;
    return aPrioritaet - bPrioritaet
      || b.verbesserung - a.verbesserung
      || a.evidence.recipient.characterId.localeCompare(
        b.evidence.recipient.characterId,
      )
      || a.evidence.slot.localeCompare(b.evidence.slot)
      || a.physischeKennung.localeCompare(b.physischeKennung)
      || a.evidence.evidenceFingerprint.localeCompare(
        b.evidence.evidenceFingerprint,
      );
  });

  let ziele: readonly GearZiel[] = Object.freeze([]);
  let verwendetePhysischeKennungen: readonly string[] = Object.freeze([]);
  let verwendeteRecipientSlots: readonly string[] = Object.freeze([]);

  for (const kandidat of sortiert) {
    if (ziele.length >= anfrage.richtlinie.maximaleZiele) break;
    const recipientSlot = [
      kandidat.evidence.recipient.characterId,
      kandidat.evidence.slot,
    ].join(":");
    if (verwendetePhysischeKennungen.includes(kandidat.physischeKennung)
        || verwendeteRecipientSlots.includes(recipientSlot)) {
      abgelehnt = Object.freeze([
        ...abgelehnt,
        ablehnung(
          kandidat.evidence,
          kandidat.physischeKennung,
          "DUPLIKAT_IM_PLAN",
        ),
      ]);
      continue;
    }

    ziele = Object.freeze([
      ...ziele,
      baueGearZiel(
        kandidat.evidence,
        anfrage.richtlinie,
        jetztMs,
        kandidat.physischeKennung,
      ),
    ]);
    verwendetePhysischeKennungen = Object.freeze([
      ...verwendetePhysischeKennungen,
      kandidat.physischeKennung,
    ]);
    verwendeteRecipientSlots = Object.freeze([
      ...verwendeteRecipientSlots,
      recipientSlot,
    ]);
  }

  return Object.freeze({
    schemaVersion: 1,
    ziele: Object.freeze(ziele.map(friereGearZiel)),
    abgelehnt: Object.freeze(abgelehnt.map(x => Object.freeze({ ...x }))),
    richtlinienVersion: anfrage.richtlinie.richtlinienVersion,
    planningEvidence: true,
    ausfuehrungsAutoritaet: false,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
  });
}
