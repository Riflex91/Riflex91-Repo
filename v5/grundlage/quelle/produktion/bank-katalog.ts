export interface BankKatalogEintrag {
  readonly pack: string;
  readonly slot: number;
  readonly name: string;
  readonly level: number;
  readonly menge: number;
  readonly variantenFingerprint: string;
}

export interface BankKatalogSnapshot {
  readonly schemaVersion: 1;
  readonly accountId: string;
  readonly beobachtetAmMs: number;
  readonly gueltigBisMs: number;
  readonly mountEpoche: number;
  readonly leaseEpoche: number;
  readonly fingerprint: string;
  readonly eintraege: readonly BankKatalogEintrag[];
}

export interface BankKatalogPin {
  readonly schemaVersion: 1;
  readonly accountId: string;
  readonly mountEpoche: number;
  readonly leaseEpoche: number;
  readonly fingerprint: string;
  readonly gueltigBisMs: number;
  readonly planningEvidence: true;
  readonly executionAuthority: false;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

export function pinneBankKatalog(
  snapshot: BankKatalogSnapshot,
  jetztMs: number,
): BankKatalogPin {
  if (snapshot.schemaVersion !== 1) throw new Error("BANK_KATALOG_SCHEMA_UNGUELTIG");
  for (const text of [snapshot.accountId, snapshot.fingerprint]) {
    pruefeText(text, "BANK_KATALOG_TEXT_UNGUELTIG");
  }
  if (!Number.isSafeInteger(jetztMs)
      || !Number.isSafeInteger(snapshot.beobachtetAmMs)
      || !Number.isSafeInteger(snapshot.gueltigBisMs)
      || snapshot.beobachtetAmMs < 0
      || snapshot.gueltigBisMs < snapshot.beobachtetAmMs
      || jetztMs < snapshot.beobachtetAmMs
      || jetztMs > snapshot.gueltigBisMs
      || !Number.isSafeInteger(snapshot.mountEpoche)
      || snapshot.mountEpoche < 1
      || !Number.isSafeInteger(snapshot.leaseEpoche)
      || snapshot.leaseEpoche < 1) {
    throw new Error("BANK_KATALOG_NICHT_FRISCH");
  }
  if (snapshot.eintraege.length > 2048) throw new Error("BANK_KATALOG_ZU_GROSS");
  for (let index = 0; index < snapshot.eintraege.length; index += 1) {
    const eintrag = snapshot.eintraege[index];
    if (eintrag === undefined) throw new Error("BANK_KATALOG_EINTRAG_FEHLT");
    for (const text of [eintrag.pack, eintrag.name, eintrag.variantenFingerprint]) {
      pruefeText(text, "BANK_KATALOG_EINTRAG_TEXT_UNGUELTIG");
    }
    if (!Number.isInteger(eintrag.slot)
        || eintrag.slot < 0
        || eintrag.slot > 255
        || !Number.isInteger(eintrag.level)
        || eintrag.level < 0
        || eintrag.level > 99
        || !Number.isInteger(eintrag.menge)
        || eintrag.menge < 1
        || eintrag.menge > 1_000_000) {
      throw new Error("BANK_KATALOG_EINTRAG_UNGUELTIG");
    }
    if (snapshot.eintraege.slice(0, index).some(x =>
      x.pack === eintrag.pack && x.slot === eintrag.slot)) {
      throw new Error("BANK_KATALOG_SLOT_DOPPELT");
    }
  }
  return Object.freeze({
    schemaVersion: 1,
    accountId: snapshot.accountId,
    mountEpoche: snapshot.mountEpoche,
    leaseEpoche: snapshot.leaseEpoche,
    fingerprint: snapshot.fingerprint,
    gueltigBisMs: snapshot.gueltigBisMs,
    planningEvidence: true,
    executionAuthority: false,
  });
}

export function istBankKatalogPinFrisch(pin: BankKatalogPin, jetztMs: number): boolean {
  return pin.schemaVersion === 1
    && pin.planningEvidence === true
    && pin.executionAuthority === false
    && Number.isSafeInteger(jetztMs)
    && jetztMs >= 0
    && jetztMs <= pin.gueltigBisMs;
}
