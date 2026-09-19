import { fehler, erfolg, type FachErgebnis } from "../kern/ergebnis.js";
import {
  ADVENTURE_LAND_SPIEL,
  type LiveVerifizierterFakt,
  type SpielBeobachtung,
} from "./typen.js";

export type VerifierEntscheidung<T> =
  | { readonly status: "BESTAETIGT"; readonly wert: T; readonly methode: string }
  | { readonly status: "ABGELEHNT"; readonly grund: string };

export interface FachlicherLiveVerifier<T> {
  pruefe(beobachtung: SpielBeobachtung<T>): VerifierEntscheidung<T>;
}

export function verifiziereLiveBeobachtung<T>(
  beobachtung: SpielBeobachtung<T>,
  verifier: FachlicherLiveVerifier<T>,
  verifiziertAmMs: number,
): FachErgebnis<LiveVerifizierterFakt<T>, string> {
  if (beobachtung.art !== "BEOBACHTUNG"
      || beobachtung.spiel !== ADVENTURE_LAND_SPIEL
      || beobachtung.quelle.art !== "LIVE_SPIEL"
      || beobachtung.quelle.methode.trim().length === 0
      || !Number.isFinite(beobachtung.beobachtetAmMs)
      || !Number.isFinite(beobachtung.maximalAlterMs)
      || beobachtung.maximalAlterMs < 0
      || !Number.isFinite(verifiziertAmMs)
      || verifiziertAmMs < beobachtung.beobachtetAmMs) {
    return fehler("LIVE_VERIFIER_BEOBACHTUNG_UNGUELTIG");
  }

  const entscheidung = verifier.pruefe(beobachtung);
  if (entscheidung.status !== "BESTAETIGT") {
    return fehler("LIVE_VERIFIER_ABGELEHNT:" + entscheidung.grund);
  }
  if (entscheidung.methode.trim().length === 0) return fehler("LIVE_VERIFIER_METHODE_FEHLT");

  return erfolg(Object.freeze({
    art: "LIVE_VERIFIZIERTER_FAKT",
    nachweisKennung: beobachtung.nachweisKennung,
    kennung: beobachtung.kennung,
    domaene: beobachtung.domaene,
    spiel: ADVENTURE_LAND_SPIEL,
    status: "LIVE_VERIFIZIERT",
    beobachtetAmMs: beobachtung.beobachtetAmMs,
    verifiziertAmMs,
    maximalAlterMs: beobachtung.maximalAlterMs,
    quelle: Object.freeze({ art: "LIVE_SPIEL", methode: entscheidung.methode }),
    wert: entscheidung.wert,
    autoritaet: "PLANUNGSNACHWEIS",
    ausfuehrungsAutoritaet: false,
  }));
}
