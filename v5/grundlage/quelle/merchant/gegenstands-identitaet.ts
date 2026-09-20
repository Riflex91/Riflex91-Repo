export interface PhysischeGegenstandsIdentitaet {
  readonly schemaVersion: 1;
  readonly characterId: string;
  readonly inventarIndex: number;
  readonly name: string;
  readonly level: number;
  readonly menge: number;
  readonly beobachtungsFingerprint: string;
  readonly beobachtetAmMs: number;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

export function validierePhysischeGegenstandsIdentitaet(
  identitaet: PhysischeGegenstandsIdentitaet,
): void {
  if (identitaet.schemaVersion !== 1) throw new Error("ITEM_IDENTITAET_SCHEMA_UNGUELTIG");
  pruefeText(identitaet.characterId, "ITEM_IDENTITAET_CHARACTER_UNGUELTIG");
  pruefeText(identitaet.name, "ITEM_IDENTITAET_NAME_UNGUELTIG");
  pruefeText(identitaet.beobachtungsFingerprint, "ITEM_IDENTITAET_FINGERPRINT_UNGUELTIG");
  if (!Number.isInteger(identitaet.inventarIndex)
      || identitaet.inventarIndex < 0
      || identitaet.inventarIndex > 255) {
    throw new Error("ITEM_IDENTITAET_INDEX_UNGUELTIG");
  }
  if (!Number.isInteger(identitaet.level) || identitaet.level < 0 || identitaet.level > 99) {
    throw new Error("ITEM_IDENTITAET_LEVEL_UNGUELTIG");
  }
  if (!Number.isInteger(identitaet.menge) || identitaet.menge < 1 || identitaet.menge > 1_000_000) {
    throw new Error("ITEM_IDENTITAET_MENGE_UNGUELTIG");
  }
  if (!Number.isSafeInteger(identitaet.beobachtetAmMs) || identitaet.beobachtetAmMs < 0) {
    throw new Error("ITEM_IDENTITAET_ZEIT_UNGUELTIG");
  }
}

export function physischeGegenstandsKennung(
  identitaet: PhysischeGegenstandsIdentitaet,
): string {
  validierePhysischeGegenstandsIdentitaet(identitaet);
  return [
    identitaet.characterId,
    String(identitaet.inventarIndex),
    identitaet.beobachtungsFingerprint,
  ].join(":");
}
