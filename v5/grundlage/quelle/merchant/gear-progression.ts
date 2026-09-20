import type { CharacterZielBindung } from "../koordination/roster-wahrheit.js";
import {
  GearAllokationsLedger,
  type GearKandidat,
  type GearZiel,
  type GearZielPrioritaet,
  type GearZielSicht,
} from "./gear-allokation.js";

export type GearProgressionsBlockGrund =
  | "ACCOUNT_DRIFT"
  | "ZIEL_NICHT_AKTUELL"
  | "EVIDENCE_STALE"
  | "NICHT_KOMPATIBEL"
  | "CONTENT_NICHT_VERIFIZIERT"
  | "PHYSISCH_NICHT_VERFUEGBAR"
  | "DISPOSITION_GESPERRT"
  | "VERBESSERUNG_ZU_KLEIN"
  | "KANDIDAT_BEREITS_RESERVIERT"
  | "RECIPIENT_SLOT_BEREITS_BELEGT";

export interface GearVergleichEvidence {
  readonly schemaVersion: 1;
  readonly evidenceId: string;
  readonly recipient: CharacterZielBindung;
  readonly slot: string;
  readonly prioritaet: GearZielPrioritaet;
  readonly aktuellerScore: number;
  readonly minimaleVerbesserung: number;
  readonly kandidat: GearKandidat;
  readonly zielAktuell: boolean;
  readonly kompatibel: boolean;
  readonly contentVerifiziert: boolean;
  readonly physischVerfuegbar: boolean;
  readonly dispositionErlaubt: boolean;
  readonly beobachtetAmMs: number;
  readonly gueltigBisMs: number;
  readonly evidenceFingerprint: string;
}

export interface GearProgressionsRichtlinie {
  readonly richtlinienVersion: string;
  readonly maximalesEvidenceAlterMs: number;
  readonly maximaleNeueZiele: number;
  readonly farmerVorMerchantSelf: true;
}

export interface GearProgressionsAnfrage {
  readonly merchantAccountId: string;
  readonly evidenzen: readonly GearVergleichEvidence[];
  readonly richtlinie: GearProgressionsRichtlinie;
}

export interface GearProgressionsAblehnung {
  readonly evidenceId: string;
  readonly grund: GearProgressionsBlockGrund;
}

export interface GearProgressionsPlan {
  readonly schemaVersion: 1;
  readonly neueZiele: readonly GearZielSicht[];
  readonly abgelehnt: readonly GearProgressionsAblehnung[];
  readonly abgelaufeneReservierungen: readonly GearZielSicht[];
  readonly richtlinienVersion: string;
  readonly farmerVorMerchantSelf: true;
  readonly planungsNachweis: true;
  readonly ausfuehrungsAutoritaet: false;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
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

function pruefeBindung(bindung: CharacterZielBindung): void {
  if (bindung.schemaVersion !== 1
      || !Number.isSafeInteger(bindung.rosterEpoche)
      || bindung.rosterEpoche < 1) {
    throw new Error("GEAR_PROGRESS_BINDUNG_UNGUELTIG");
  }
  for (const text of [
    bindung.accountId,
    bindung.characterId,
    bindung.sessionId,
    bindung.serverRegion,
    bindung.serverIdentifier,
    bindung.rosterFingerprint,
  ]) {
    pruefeText(text, "GEAR_PROGRESS_BINDUNG_UNGUELTIG");
  }
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
    "GEAR_PROGRESS_RICHTLINIE_UNGUELTIG",
  );
  pruefeGanzzahl(
    richtlinie.maximalesEvidenceAlterMs,
    1,
    86_400_000,
    "GEAR_PROGRESS_EVIDENCE_ALTER_UNGUELTIG",
  );
  pruefeGanzzahl(
    richtlinie.maximaleNeueZiele,
    1,
    64,
    "GEAR_PROGRESS_ZIELGRENZE_UNGUELTIG",
  );
  if (richtlinie.farmerVorMerchantSelf !== true) {
    throw new Error("GEAR_PROGRESS_FARMER_PRIORITAET_ERFORDERLICH");
  }
}

function validiereEvidence(evidence: GearVergleichEvidence): void {
  if (evidence.schemaVersion !== 1) {
    throw new Error("GEAR_PROGRESS_EVIDENCE_SCHEMA_UNGUELTIG");
  }
  pruefeBindung(evidence.recipient);
  for (const text of [
    evidence.evidenceId,
    evidence.slot,
    evidence.evidenceFingerprint,
    evidence.kandidat.physischeKennung,
    evidence.kandidat.name,
    evidence.kandidat.beobachtungsFingerprint,
  ]) {
    pruefeText(text, "GEAR_PROGRESS_EVIDENCE_TEXT_UNGUELTIG");
  }
  if (evidence.prioritaet !== "FARMER"
      && evidence.prioritaet !== "MERCHANT_SELF") {
    throw new Error("GEAR_PROGRESS_PRIORITAET_UNGUELTIG");
  }
  if (!Number.isFinite(evidence.aktuellerScore)
      || !Number.isFinite(evidence.minimaleVerbesserung)
      || evidence.minimaleVerbesserung <= 0
      || !Number.isFinite(evidence.kandidat.score)
      || !Number.isSafeInteger(evidence.kandidat.level)
      || evidence.kandidat.level < 0
      || evidence.kandidat.level > 99) {
    throw new Error("GEAR_PROGRESS_SCORE_UNGUELTIG");
  }
  pruefeGanzzahl(
    evidence.beobachtetAmMs,
    0,
    Number.MAX_SAFE_INTEGER,
    "GEAR_PROGRESS_EVIDENCE_ZEIT_UNGUELTIG",
  );
  pruefeGanzzahl(
    evidence.gueltigBisMs,
    evidence.beobachtetAmMs,
    Number.MAX_SAFE_INTEGER,
    "GEAR_PROGRESS_EVIDENCE_GUELTIGKEIT_UNGUELTIG",
  );
}

function istAktivesZiel(ziel: GearZielSicht): boolean {
  return ziel.status === "RESERVIERT" || ziel.status === "RECOVERY_PENDING";
}

function recipientSlotKennung(
  recipient: CharacterZielBindung,
  slot: string,
): string {
  return [
    recipient.characterId,
    recipient.sessionId,
    String(recipient.rosterEpoche),
    slot,
  ].join("|");
}

function klassifiziere(
  anfrage: GearProgressionsAnfrage,
  evidence: GearVergleichEvidence,
  jetztMs: number,
  aktiveZiele: readonly GearZielSicht[],
): GearProgressionsBlockGrund | null {
  if (evidence.recipient.accountId !== anfrage.merchantAccountId) {
    return "ACCOUNT_DRIFT";
  }
  if (!evidence.zielAktuell) return "ZIEL_NICHT_AKTUELL";
  if (jetztMs < evidence.beobachtetAmMs
      || jetztMs > evidence.gueltigBisMs
      || jetztMs - evidence.beobachtetAmMs
        > anfrage.richtlinie.maximalesEvidenceAlterMs) {
    return "EVIDENCE_STALE";
  }
  if (!evidence.kompatibel) return "NICHT_KOMPATIBEL";
  if (!evidence.contentVerifiziert) return "CONTENT_NICHT_VERIFIZIERT";
  if (!evidence.physischVerfuegbar) return "PHYSISCH_NICHT_VERFUEGBAR";
  if (!evidence.dispositionErlaubt) return "DISPOSITION_GESPERRT";
  if (evidence.kandidat.score - evidence.aktuellerScore
      < evidence.minimaleVerbesserung) {
    return "VERBESSERUNG_ZU_KLEIN";
  }
  if (aktiveZiele.some(x =>
    x.ziel.kandidat.physischeKennung
      === evidence.kandidat.physischeKennung)) {
    return "KANDIDAT_BEREITS_RESERVIERT";
  }
  const recipientSlot = recipientSlotKennung(
    evidence.recipient,
    evidence.slot,
  );
  if (aktiveZiele.some(x =>
    recipientSlotKennung(x.ziel.recipient, x.ziel.slot)
      === recipientSlot)) {
    return "RECIPIENT_SLOT_BEREITS_BELEGT";
  }
  return null;
}

function gearZielAusEvidence(
  evidence: GearVergleichEvidence,
  jetztMs: number,
): GearZiel {
  return Object.freeze({
    schemaVersion: 1,
    gearZielId: kompakteKennung(
      "gear-goal",
      [
        evidence.evidenceId,
        evidence.recipient.characterId,
        evidence.recipient.sessionId,
        evidence.slot,
        evidence.kandidat.physischeKennung,
        evidence.evidenceFingerprint,
      ].join("|"),
    ),
    recipient: Object.freeze({ ...evidence.recipient }),
    slot: evidence.slot,
    prioritaet: evidence.prioritaet,
    aktuellerScore: evidence.aktuellerScore,
    minimaleVerbesserung: evidence.minimaleVerbesserung,
    kandidat: Object.freeze({ ...evidence.kandidat }),
    erstelltAmMs: jetztMs,
    gueltigBisMs: evidence.gueltigBisMs,
  });
}

export function planeUndReserviereGearProgression(
  anfrage: GearProgressionsAnfrage,
  ledger: GearAllokationsLedger,
  jetztMs: number,
): GearProgressionsPlan {
  pruefeText(
    anfrage.merchantAccountId,
    "GEAR_PROGRESS_ACCOUNT_UNGUELTIG",
  );
  validiereRichtlinie(anfrage.richtlinie);
  pruefeGanzzahl(
    jetztMs,
    0,
    Number.MAX_SAFE_INTEGER,
    "GEAR_PROGRESS_ZEIT_UNGUELTIG",
  );
  if (anfrage.evidenzen.length > 512) {
    throw new Error("GEAR_PROGRESS_EVIDENCE_ZU_GROSS");
  }
  for (let index = 0; index < anfrage.evidenzen.length; index += 1) {
    const evidence = anfrage.evidenzen[index];
    if (evidence === undefined) {
      throw new Error("GEAR_PROGRESS_EVIDENCE_FEHLT");
    }
    validiereEvidence(evidence);
    if (anfrage.evidenzen.slice(0, index).some(
      x => x.evidenceId === evidence.evidenceId,
    )) {
      throw new Error("GEAR_PROGRESS_EVIDENCE_ID_DOPPELT");
    }
  }

  const abgelaufeneReservierungen =
    ledger.bereinigeAbgelaufene(jetztMs);
  let aktiveZiele = ledger.snapshot().filter(istAktivesZiel);
  let abgelehnt: readonly GearProgressionsAblehnung[] =
    Object.freeze([]);
  let kandidaten: readonly GearVergleichEvidence[] =
    Object.freeze([]);

  for (const evidence of anfrage.evidenzen) {
    const grund = klassifiziere(
      anfrage,
      evidence,
      jetztMs,
      aktiveZiele,
    );
    if (grund !== null) {
      abgelehnt = Object.freeze([
        ...abgelehnt,
        Object.freeze({
          evidenceId: evidence.evidenceId,
          grund,
        }),
      ]);
      continue;
    }
    kandidaten = Object.freeze([...kandidaten, evidence]);
  }

  kandidaten = Object.freeze(
    [...kandidaten].sort((a, b) => {
      const pa = a.prioritaet === "FARMER" ? 0 : 1;
      const pb = b.prioritaet === "FARMER" ? 0 : 1;
      return pa - pb
        || (b.kandidat.score - b.aktuellerScore)
          - (a.kandidat.score - a.aktuellerScore)
        || b.kandidat.score - a.kandidat.score
        || a.gueltigBisMs - b.gueltigBisMs
        || a.evidenceId.localeCompare(b.evidenceId);
    }),
  );

  let neueZiele: readonly GearZielSicht[] = Object.freeze([]);
  for (const evidence of kandidaten) {
    if (neueZiele.length >= anfrage.richtlinie.maximaleNeueZiele) {
      break;
    }
    const grund = klassifiziere(
      anfrage,
      evidence,
      jetztMs,
      aktiveZiele,
    );
    if (grund !== null) {
      abgelehnt = Object.freeze([
        ...abgelehnt,
        Object.freeze({
          evidenceId: evidence.evidenceId,
          grund,
        }),
      ]);
      continue;
    }

    const reserviert = ledger.reserviere(
      gearZielAusEvidence(evidence, jetztMs),
    );
    neueZiele = Object.freeze([...neueZiele, reserviert]);
    aktiveZiele = Object.freeze([...aktiveZiele, reserviert]);
  }

  return Object.freeze({
    schemaVersion: 1,
    neueZiele: Object.freeze(neueZiele.map(x => Object.freeze({
      ...x,
      ziel: Object.freeze({
        ...x.ziel,
        recipient: Object.freeze({ ...x.ziel.recipient }),
        kandidat: Object.freeze({ ...x.ziel.kandidat }),
      }),
    }))),
    abgelehnt,
    abgelaufeneReservierungen,
    richtlinienVersion: anfrage.richtlinie.richtlinienVersion,
    farmerVorMerchantSelf: true,
    planungsNachweis: true,
    ausfuehrungsAutoritaet: false,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
  });
}
