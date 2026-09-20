export type AblaufPrioritaetsKlasse =
  | "NOTFALL"
  | "SICHERHEIT"
  | "KRITISCHE_VERSORGUNG"
  | "ERFORDERLICHER_DIENST"
  | "PRODUKTION_ODER_NUTZER_AUFTRAG"
  | "NORMALE_ARBEIT"
  | "OPTIMIERUNG"
  | "HINTERGRUND";

const PRIORITAETS_KLASSEN_RANG: Readonly<Record<AblaufPrioritaetsKlasse, number>> = Object.freeze({
  NOTFALL: 0,
  SICHERHEIT: 10,
  KRITISCHE_VERSORGUNG: 20,
  ERFORDERLICHER_DIENST: 30,
  PRODUKTION_ODER_NUTZER_AUFTRAG: 40,
  NORMALE_ARBEIT: 50,
  OPTIMIERUNG: 60,
  HINTERGRUND: 70,
});

export type AblaufStatus =
  | "GEPLANT"
  | "BEREIT"
  | "LAUFEND"
  | "WARTET_BEDINGUNG"
  | "WARTET_BEOBACHTUNG"
  | "SICHER_UNTERBRECHBAR"
  | "PAUSIERT"
  | "ABGLEICH_ERFORDERLICH"
  | "ABGESCHLOSSEN"
  | "ABGEBROCHEN"
  | "FEHLGESCHLAGEN_SICHER"
  | "ABGELAUFEN";

export interface WissensSnapshotPin {
  readonly gitCommit: string;
  readonly quellenSha256: readonly string[];
}

export interface WiederholungsRichtlinie {
  readonly maximaleVersuche: number;
  readonly maximaleDauerMs: number;
  readonly anfangsBackoffMs: number;
  readonly maximalerBackoffMs: number;
  readonly backoffFaktor: number;
  readonly circuitSchluessel: string;
}

export interface UnterbrechungsPunkt {
  readonly erlaubt: boolean;
  readonly sichererPunktId: string | null;
  readonly irreversibleMutationOffen: boolean;
  readonly checkpointDurable: boolean;
}

export interface AblaufPlan {
  readonly schemaVersion: 1;
  readonly ablaufId: string;
  readonly ablaufArt: string;
  readonly eigentuemerModulId: string;
  readonly prioritaetsKlasse: AblaufPrioritaetsKlasse;
  readonly prioritaetsRang: number;
  readonly erstelltAmMs: number;
  readonly deadlineAmMs: number;
  readonly ressourcenIds: readonly string[];
  readonly wissensSnapshot: WissensSnapshotPin;
  readonly wiederholung: WiederholungsRichtlinie;
  readonly idempotenzSchluessel: string;
  readonly abgleichStrategie: string;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 160) throw new Error(fehler);
}

function pruefeNichtNegativGanzzahl(wert: number, fehler: string): void {
  if (!Number.isSafeInteger(wert) || wert < 0) throw new Error(fehler);
}

function pruefeEindeutigSortierbar(werte: readonly string[], fehler: string): void {
  const sortiert = [...werte].sort();
  if (sortiert.some((wert, index) => index > 0 && wert === sortiert[index - 1])) {
    throw new Error(fehler);
  }
}

export function prioritaetsKlassenRang(klasse: AblaufPrioritaetsKlasse): number {
  return PRIORITAETS_KLASSEN_RANG[klasse];
}

export function istSafetyOderNotfall(klasse: AblaufPrioritaetsKlasse): boolean {
  return klasse === "SICHERHEIT" || klasse === "NOTFALL";
}

export function validiereWiederholungsRichtlinie(richtlinie: WiederholungsRichtlinie): void {
  if (!Number.isInteger(richtlinie.maximaleVersuche)
      || richtlinie.maximaleVersuche < 1
      || richtlinie.maximaleVersuche > 64) {
    throw new Error("RETRY_MAXIMALE_VERSUCHE_UNGUELTIG");
  }
  if (!Number.isSafeInteger(richtlinie.maximaleDauerMs)
      || richtlinie.maximaleDauerMs < 1
      || richtlinie.maximaleDauerMs > 86_400_000) {
    throw new Error("RETRY_MAXIMALE_DAUER_UNGUELTIG");
  }
  if (!Number.isSafeInteger(richtlinie.anfangsBackoffMs)
      || richtlinie.anfangsBackoffMs < 1
      || richtlinie.anfangsBackoffMs > richtlinie.maximaleDauerMs) {
    throw new Error("RETRY_ANFANGS_BACKOFF_UNGUELTIG");
  }
  if (!Number.isSafeInteger(richtlinie.maximalerBackoffMs)
      || richtlinie.maximalerBackoffMs < richtlinie.anfangsBackoffMs
      || richtlinie.maximalerBackoffMs > richtlinie.maximaleDauerMs) {
    throw new Error("RETRY_MAXIMALER_BACKOFF_UNGUELTIG");
  }
  if (!Number.isFinite(richtlinie.backoffFaktor)
      || richtlinie.backoffFaktor < 1
      || richtlinie.backoffFaktor > 10) {
    throw new Error("RETRY_BACKOFF_FAKTOR_UNGUELTIG");
  }
  pruefeText(richtlinie.circuitSchluessel, "RETRY_CIRCUIT_SCHLUESSEL_UNGUELTIG");
}

export function validiereAblaufPlan(plan: AblaufPlan): void {
  if (plan.schemaVersion !== 1) throw new Error("ABLAUF_SCHEMA_UNGUELTIG");
  pruefeText(plan.ablaufId, "ABLAUF_KENNUNG_UNGUELTIG");
  pruefeText(plan.ablaufArt, "ABLAUF_ART_UNGUELTIG");
  pruefeText(plan.eigentuemerModulId, "ABLAUF_OWNER_UNGUELTIG");
  pruefeText(plan.idempotenzSchluessel, "ABLAUF_IDEMPOTENZ_UNGUELTIG");
  pruefeText(plan.abgleichStrategie, "ABLAUF_ABGLEICH_STRATEGIE_UNGUELTIG");
  if (!Number.isInteger(plan.prioritaetsRang)
      || plan.prioritaetsRang < 0
      || plan.prioritaetsRang > 1_000_000) {
    throw new Error("ABLAUF_PRIORITAETS_RANG_UNGUELTIG");
  }
  pruefeNichtNegativGanzzahl(plan.erstelltAmMs, "ABLAUF_ERSTELLZEIT_UNGUELTIG");
  pruefeNichtNegativGanzzahl(plan.deadlineAmMs, "ABLAUF_DEADLINE_UNGUELTIG");
  if (plan.deadlineAmMs < plan.erstelltAmMs) {
    throw new Error("ABLAUF_DEADLINE_VOR_ERSTELLUNG");
  }
  if (plan.ressourcenIds.length > 128) throw new Error("ABLAUF_ZU_VIELE_RESSOURCEN");
  for (const id of plan.ressourcenIds) pruefeText(id, "ABLAUF_RESSOURCEN_KENNUNG_UNGUELTIG");
  pruefeEindeutigSortierbar(plan.ressourcenIds, "ABLAUF_RESSOURCE_DOPPELT");

  if (!/^[0-9a-f]{40}$/i.test(plan.wissensSnapshot.gitCommit)) {
    throw new Error("ABLAUF_WISSENS_COMMIT_UNGUELTIG");
  }
  if (plan.wissensSnapshot.quellenSha256.length < 1
      || plan.wissensSnapshot.quellenSha256.length > 128) {
    throw new Error("ABLAUF_WISSENS_QUELLEN_ANZAHL_UNGUELTIG");
  }
  for (const hash of plan.wissensSnapshot.quellenSha256) {
    if (!/^[0-9a-f]{64}$/i.test(hash)) throw new Error("ABLAUF_WISSENS_HASH_UNGUELTIG");
  }
  pruefeEindeutigSortierbar(
    plan.wissensSnapshot.quellenSha256,
    "ABLAUF_WISSENS_HASH_DOPPELT",
  );
  validiereWiederholungsRichtlinie(plan.wiederholung);
  if (plan.gameplayAutoritaet !== false || plan.rawWriteAutoritaet !== false) {
    throw new Error("R8_DARF_KEINE_GAMEPLAY_AUTORITAET_TRAGEN");
  }
}

export function friereAblaufPlan(plan: AblaufPlan): AblaufPlan {
  validiereAblaufPlan(plan);
  return Object.freeze({
    ...plan,
    ressourcenIds: Object.freeze([...plan.ressourcenIds].sort()),
    wissensSnapshot: Object.freeze({
      gitCommit: plan.wissensSnapshot.gitCommit,
      quellenSha256: Object.freeze([...plan.wissensSnapshot.quellenSha256].sort()),
    }),
    wiederholung: Object.freeze({ ...plan.wiederholung }),
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
  });
}
