import type { SpeicherGesundheit } from "./ports.js";

export interface ErwartetesSpeicherziel {
  readonly laufwerk: "D:";
  readonly volumeId: string;
  readonly medientyp: "SSD";
  readonly mindestFreieReserveProzent: 15;
}

export function pruefeKritischesSpeicherziel(
  gesundheit: SpeicherGesundheit,
  erwartet: ErwartetesSpeicherziel,
): void {
  if (!gesundheit.vorhanden) throw new Error("SPEICHER_VOLUME_FEHLT");
  if (!gesundheit.bereit) throw new Error("SPEICHER_VOLUME_NICHT_BEREIT");
  if (!gesundheit.beschreibbar) throw new Error("SPEICHER_NICHT_BESCHREIBBAR");
  if (gesundheit.laufwerk.toUpperCase() !== erwartet.laufwerk) {
    throw new Error("SPEICHER_FALSCHES_LAUFWERK");
  }
  if (erwartet.volumeId.trim().length === 0
      || gesundheit.volumeId !== erwartet.volumeId) {
    throw new Error("SPEICHER_VOLUME_IDENTITAET_FALSCH");
  }
  if (gesundheit.medientyp !== erwartet.medientyp) {
    throw new Error("SPEICHER_MEDIENTYP_FALSCH");
  }
  if (!Number.isFinite(gesundheit.gesamtBytes)
      || !Number.isFinite(gesundheit.freiBytes)
      || gesundheit.gesamtBytes <= 0
      || gesundheit.freiBytes < 0
      || gesundheit.freiBytes > gesundheit.gesamtBytes) {
    throw new Error("SPEICHER_KAPAZITAET_UNGUELTIG");
  }

  const freiProzent = gesundheit.freiBytes * 100 / gesundheit.gesamtBytes;
  if (freiProzent < erwartet.mindestFreieReserveProzent) {
    throw new Error("SPEICHER_RESERVE_UNTERSCHRITTEN");
  }
}
