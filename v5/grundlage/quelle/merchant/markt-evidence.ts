import type { PhysischeGegenstandsIdentitaet } from "./gegenstands-identitaet.js";
import type { GegenstandsDisposition } from "./disposition.js";

export type ListingSeite = "SELL" | "BUY";

export interface ListingBeobachtung {
  readonly schemaVersion: 1;
  readonly targetCharacterId: string;
  readonly tradeSlot: string;
  readonly rid: string;
  readonly seite: ListingSeite;
  readonly itemName: string;
  readonly level: number;
  readonly unitPrice: number;
  readonly menge: number;
  readonly beobachtetAmMs: number;
  readonly gueltigBisMs: number;
}

export interface GepinnteListingEvidence extends ListingBeobachtung {
  readonly listingFingerprint: string;
  readonly quantityFingerprint: string;
}

export interface TradeSellInventarKandidat {
  readonly identitaet: PhysischeGegenstandsIdentitaet;
  readonly locked: boolean;
  readonly blocked: boolean;
  readonly fungibilitaetsSchluessel: string;
  readonly disposition: GegenstandsDisposition;
}

export interface ServerAuswahlNachweis {
  readonly erlaubt: boolean;
  readonly grund: string | null;
  readonly ausgewaehlt: TradeSellInventarKandidat | null;
  readonly serverEligibleCount: number;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function pruefePositiveGanzzahl(wert: number, fehler: string): void {
  if (!Number.isSafeInteger(wert) || wert < 1) throw new Error(fehler);
}

function listingAnker(beobachtung: ListingBeobachtung): string {
  return [
    beobachtung.targetCharacterId,
    beobachtung.tradeSlot,
    beobachtung.rid,
    beobachtung.seite,
    beobachtung.itemName,
    String(beobachtung.level),
    String(beobachtung.unitPrice),
  ].join("|");
}

export function pinneListingEvidence(
  beobachtung: ListingBeobachtung,
  jetztMs: number,
): GepinnteListingEvidence {
  if (beobachtung.schemaVersion !== 1) throw new Error("LISTING_SCHEMA_UNGUELTIG");
  for (const wert of [
    beobachtung.targetCharacterId,
    beobachtung.tradeSlot,
    beobachtung.rid,
    beobachtung.itemName,
  ]) pruefeText(wert, "LISTING_TEXT_UNGUELTIG");
  pruefePositiveGanzzahl(beobachtung.unitPrice, "LISTING_PREIS_UNGUELTIG");
  pruefePositiveGanzzahl(beobachtung.menge, "LISTING_MENGE_UNGUELTIG");
  if (!Number.isInteger(beobachtung.level) || beobachtung.level < 0 || beobachtung.level > 99) {
    throw new Error("LISTING_LEVEL_UNGUELTIG");
  }
  if (!Number.isSafeInteger(beobachtung.beobachtetAmMs)
      || !Number.isSafeInteger(beobachtung.gueltigBisMs)
      || beobachtung.beobachtetAmMs < 0
      || beobachtung.gueltigBisMs < beobachtung.beobachtetAmMs) {
    throw new Error("LISTING_ZEIT_UNGUELTIG");
  }
  if (!Number.isSafeInteger(jetztMs)
      || jetztMs < beobachtung.beobachtetAmMs
      || jetztMs > beobachtung.gueltigBisMs) {
    throw new Error("LISTING_EVIDENCE_NICHT_FRISCH");
  }
  const anker = listingAnker(beobachtung);
  return Object.freeze({
    ...beobachtung,
    listingFingerprint: anker,
    quantityFingerprint: anker + "|q=" + beobachtung.menge
      + "|observed=" + beobachtung.beobachtetAmMs,
  });
}

export function validiereTradeIntent(
  evidence: GepinnteListingEvidence,
  erwarteteSeite: ListingSeite,
  angefragteMenge: number,
  jetztMs: number,
): void {
  pruefePositiveGanzzahl(angefragteMenge, "TRADE_MENGE_UNGUELTIG");
  if (evidence.rid.trim().length === 0) throw new Error("TRADE_RID_FEHLT");
  if (evidence.seite !== erwarteteSeite) throw new Error("TRADE_LISTING_SEITE_FALSCH");
  if (angefragteMenge > evidence.menge) throw new Error("TRADE_MENGE_UEBER_FRISCHE_RESTMENGE");
  if (jetztMs < evidence.beobachtetAmMs || jetztMs > evidence.gueltigBisMs) {
    throw new Error("TRADE_LISTING_EVIDENCE_ABGELAUFEN");
  }
}

export function reproduziereTradeSellServerAuswahl(
  inventar: readonly TradeSellInventarKandidat[],
  wishlist: GepinnteListingEvidence,
  angefragteMenge: number,
  jetztMs: number,
): ServerAuswahlNachweis {
  validiereTradeIntent(wishlist, "BUY", angefragteMenge, jetztMs);
  const eligible = [...inventar]
    .sort((a, b) => a.identitaet.inventarIndex - b.identitaet.inventarIndex)
    .filter(kandidat =>
      kandidat.identitaet.name === wishlist.itemName
      && kandidat.identitaet.level === wishlist.level
      && kandidat.identitaet.menge >= angefragteMenge
      && !kandidat.locked);

  const ausgewaehlt = eligible[0] ?? null;
  if (ausgewaehlt === null) {
    return Object.freeze({
      erlaubt: false,
      grund: "SERVER_AUSWAHLKANDIDAT_FEHLT",
      ausgewaehlt: null,
      serverEligibleCount: 0,
    });
  }
  if (ausgewaehlt.blocked) {
    return Object.freeze({
      erlaubt: false,
      grund: "SERVER_AUSWAHLKANDIDAT_BLOCKIERT",
      ausgewaehlt,
      serverEligibleCount: eligible.length,
    });
  }

  const fungibilitaet = new Set(eligible.map(x => x.fungibilitaetsSchluessel));
  if (fungibilitaet.size > 1) {
    return Object.freeze({
      erlaubt: false,
      grund: "NICHT_FUNGIBLE_MEHRDEUTIGE_SERVERAUSWAHL",
      ausgewaehlt,
      serverEligibleCount: eligible.length,
    });
  }
  if (ausgewaehlt.disposition !== "MARKT_VERKAUF") {
    return Object.freeze({
      erlaubt: false,
      grund: "DISPOSITION_VERBIETET_MARKTVERKAUF",
      ausgewaehlt,
      serverEligibleCount: eligible.length,
    });
  }
  return Object.freeze({
    erlaubt: true,
    grund: null,
    ausgewaehlt,
    serverEligibleCount: eligible.length,
  });
}
