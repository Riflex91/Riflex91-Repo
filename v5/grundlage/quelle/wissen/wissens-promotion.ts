export type WissensPromotionZiel = "ALLGEMEINE_SPIELREGEL" | "ACTION_CONTRACT";

export interface WissensPromotionAntrag {
  readonly zielKennung: string;
  readonly zielArt: WissensPromotionZiel;
  readonly liveFaktNachweise: readonly string[];
  readonly unabhaengigeEvidenceAnzahl: number;
  readonly revalidiert: boolean;
}

export interface WissensPromotionEntscheidung {
  readonly status: "ABGELEHNT" | "PRUEFUNG_ERFORDERLICH";
  readonly automatischePromotion: false;
  readonly gameplayAutoritaet: false;
  readonly ausfuehrungsAutoritaet: false;
  readonly grund: string;
}

export function bewerteWissensPromotion(
  antrag: WissensPromotionAntrag,
): WissensPromotionEntscheidung {
  if (antrag.zielKennung.trim().length === 0) throw new Error("WISSENS_PROMOTION_ZIEL_FEHLT");
  if (!["ALLGEMEINE_SPIELREGEL", "ACTION_CONTRACT"].includes(antrag.zielArt)) {
    throw new Error("WISSENS_PROMOTION_ZIELART_UNGUELTIG");
  }
  if (!Number.isSafeInteger(antrag.unabhaengigeEvidenceAnzahl)
      || antrag.unabhaengigeEvidenceAnzahl < 0) {
    throw new Error("WISSENS_PROMOTION_EVIDENCE_ANZAHL_UNGUELTIG");
  }

  let status: WissensPromotionEntscheidung["status"] = "PRUEFUNG_ERFORDERLICH";
  let grund = "MEHRERE_EVIDENCE_VORHANDEN_ABER_KEINE_AUTOMATISCHE_PROMOTION";

  if (antrag.liveFaktNachweise.length <= 1) {
    status = "ABGELEHNT";
    grund = "EINZELNER_LIVE_FAKT_DARF_NICHT_GENERALISIERT_WERDEN";
  } else if (antrag.unabhaengigeEvidenceAnzahl < 2) {
    status = "ABGELEHNT";
    grund = "ZU_WENIG_UNABHAENGIGE_EVIDENCE";
  } else if (!antrag.revalidiert) {
    status = "ABGELEHNT";
    grund = "REVALIDIERUNG_FEHLT";
  }

  return Object.freeze({
    status,
    automatischePromotion: false,
    gameplayAutoritaet: false,
    ausfuehrungsAutoritaet: false,
    grund,
  });
}
