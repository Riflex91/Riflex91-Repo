import type { CharacterZielBindung } from "../koordination/roster-wahrheit.js";

export interface PartyMitgliedBeobachtung {
  readonly characterId: string;
  readonly ctype: string;
  readonly level: number;
  readonly map: string;
  readonly instanz: string;
  readonly x: number;
  readonly y: number;
  readonly rip: boolean;
  readonly zielBindung: CharacterZielBindung;
}

export interface PartySnapshot {
  readonly schemaVersion: 1;
  readonly partyId: string;
  readonly beobachtetAmMs: number;
  readonly fingerprint: string;
  readonly mitglieder: readonly PartyMitgliedBeobachtung[];
}

export interface FrischePartyWahrheit extends PartySnapshot {
  readonly gueltigBisMs: number;
  readonly partyObjektIstLanglebigeAuthority: false;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

export function pinnePartyWahrheit(
  snapshot: PartySnapshot,
  jetztMs: number,
  maxAlterMs: number,
): FrischePartyWahrheit {
  if (snapshot.schemaVersion !== 1) throw new Error("PARTY_SCHEMA_UNGUELTIG");
  for (const text of [snapshot.partyId, snapshot.fingerprint]) {
    pruefeText(text, "PARTY_TEXT_UNGUELTIG");
  }
  if (!Number.isSafeInteger(snapshot.beobachtetAmMs)
      || !Number.isSafeInteger(jetztMs)
      || !Number.isSafeInteger(maxAlterMs)
      || snapshot.beobachtetAmMs < 0
      || jetztMs < snapshot.beobachtetAmMs
      || maxAlterMs < 1
      || maxAlterMs > 60_000
      || jetztMs - snapshot.beobachtetAmMs > maxAlterMs
      || snapshot.mitglieder.length < 1
      || snapshot.mitglieder.length > 16) {
    throw new Error("PARTY_FRESHNESS_UNGUELTIG");
  }
  for (let index = 0; index < snapshot.mitglieder.length; index += 1) {
    const m = snapshot.mitglieder[index];
    if (m === undefined) throw new Error("PARTY_MITGLIED_FEHLT");
    for (const text of [m.characterId, m.ctype, m.map, m.instanz]) {
      pruefeText(text, "PARTY_MITGLIED_TEXT_UNGUELTIG");
    }
    if (m.characterId !== m.zielBindung.characterId
        || m.zielBindung.schemaVersion !== 1
        || !Number.isInteger(m.level)
        || m.level < 1
        || m.level > 200
        || !Number.isFinite(m.x)
        || !Number.isFinite(m.y)) {
      throw new Error("PARTY_MITGLIED_BINDUNG_UNGUELTIG");
    }
    if (snapshot.mitglieder.slice(0, index).some(x => x.characterId === m.characterId)) {
      throw new Error("PARTY_MITGLIED_DOPPELT");
    }
  }
  return Object.freeze({
    ...snapshot,
    mitglieder: Object.freeze(snapshot.mitglieder.map(m => Object.freeze({
      ...m,
      zielBindung: Object.freeze({ ...m.zielBindung }),
    }))),
    gueltigBisMs: snapshot.beobachtetAmMs + maxAlterMs,
    partyObjektIstLanglebigeAuthority: false,
  });
}

export function istPartyWahrheitFrisch(party: FrischePartyWahrheit, jetztMs: number): boolean {
  return party.schemaVersion === 1
    && party.partyObjektIstLanglebigeAuthority === false
    && Number.isSafeInteger(jetztMs)
    && jetztMs >= party.beobachtetAmMs
    && jetztMs <= party.gueltigBisMs;
}
