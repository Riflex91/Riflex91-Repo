import {
  istSafetyOderNotfall,
  type AblaufPrioritaetsKlasse,
} from "../scheduler/workflow-vertrag.js";

export type MerchantDienstBereich =
  | "BANK"
  | "NPC"
  | "MARKT"
  | "FARMER_RENDEZVOUS"
  | "MLUCK"
  | "GEAR"
  | "PRODUKTION"
  | "SONSTIG";

export interface MerchantDienstStabilitaetsRichtlinie {
  readonly richtlinienVersion: string;
  readonly mindestHaltedauerMs: number;
  readonly wechselCooldownMs: number;
  readonly wechselFensterMs: number;
  readonly maximaleWechselImFenster: number;
  readonly starvationGrenzeMs: number;
  readonly maximaleHistorie: number;
}

export interface MerchantDienstLaufKontext {
  readonly aktuellerBereich: MerchantDienstBereich;
  readonly aktuellePrioritaetsKlasse: AblaufPrioritaetsKlasse;
  readonly bereichBegonnenAmMs: number;
  readonly letzterWechselAmMs: number | null;
  readonly sichereUnterbrechung: boolean;
  readonly checkpointDurable: boolean;
  readonly irreversibleMutationOffen: boolean;
  readonly wechselHistorieMs: readonly number[];
}

export interface MerchantDienstBewerber {
  readonly bereich: MerchantDienstBereich;
  readonly prioritaetsKlasse: AblaufPrioritaetsKlasse;
  readonly wartetSeitMs: number;
  readonly deadlineAmMs: number;
  readonly schedulerVorrang: boolean;
}

export type MerchantDienstWechselGrund =
  | "GLEICHER_BEREICH"
  | "IRREVERSIBLE_MUTATION_OFFEN"
  | "KEIN_SICHERER_DURABLER_UNTERBRECHUNGSPUNKT"
  | "AKTUELLE_SAFETY_ARBEIT_HAT_VORRANG"
  | "SCHEDULER_GIBT_KEINEN_VORRANG"
  | "SAFETY_PREEMPTION"
  | "STARVATION_GRENZE_ERREICHT"
  | "MINDEST_HALTEDAUER"
  | "WECHSEL_COOLDOWN"
  | "WECHSEL_BUDGET_ERSCHOEPFT"
  | "STABILER_WECHSEL_ERLAUBT";

export interface MerchantDienstWechselEntscheidung {
  readonly schemaVersion: 1;
  readonly wechselErlaubt: boolean;
  readonly grund: MerchantDienstWechselGrund;
  readonly wechselImAktuellenFenster: number;
  readonly gewartetMs: number;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function pruefeZeit(wert: number, fehler: string): void {
  if (!Number.isSafeInteger(wert) || wert < 0) throw new Error(fehler);
}

function validiereRichtlinie(r: MerchantDienstStabilitaetsRichtlinie): void {
  pruefeText(r.richtlinienVersion, "MERCHANT_STABILITAET_RICHTLINIE_UNGUELTIG");
  for (const [wert, fehler] of [
    [r.mindestHaltedauerMs, "MERCHANT_STABILITAET_HALTEDAUER_UNGUELTIG"],
    [r.wechselCooldownMs, "MERCHANT_STABILITAET_COOLDOWN_UNGUELTIG"],
    [r.wechselFensterMs, "MERCHANT_STABILITAET_FENSTER_UNGUELTIG"],
    [r.starvationGrenzeMs, "MERCHANT_STABILITAET_STARVATION_UNGUELTIG"],
  ] as const) {
    if (!Number.isSafeInteger(wert) || wert < 1 || wert > 86_400_000) {
      throw new Error(fehler);
    }
  }
  if (!Number.isInteger(r.maximaleWechselImFenster)
      || r.maximaleWechselImFenster < 1
      || r.maximaleWechselImFenster > 256) {
    throw new Error("MERCHANT_STABILITAET_WECHSEL_GRENZE_UNGUELTIG");
  }
  if (!Number.isInteger(r.maximaleHistorie)
      || r.maximaleHistorie < r.maximaleWechselImFenster
      || r.maximaleHistorie > 1024) {
    throw new Error("MERCHANT_STABILITAET_HISTORIE_GRENZE_UNGUELTIG");
  }
}

function ergebnis(
  wechselErlaubt: boolean,
  grund: MerchantDienstWechselGrund,
  wechselImAktuellenFenster: number,
  gewartetMs: number,
): MerchantDienstWechselEntscheidung {
  return Object.freeze({
    schemaVersion: 1,
    wechselErlaubt,
    grund,
    wechselImAktuellenFenster,
    gewartetMs,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
  });
}

export function bewerteMerchantDienstWechsel(
  kontext: MerchantDienstLaufKontext,
  bewerber: MerchantDienstBewerber,
  richtlinie: MerchantDienstStabilitaetsRichtlinie,
  jetztMs: number,
): MerchantDienstWechselEntscheidung {
  validiereRichtlinie(richtlinie);
  pruefeZeit(jetztMs, "MERCHANT_STABILITAET_ZEIT_UNGUELTIG");
  pruefeZeit(kontext.bereichBegonnenAmMs, "MERCHANT_STABILITAET_BEREICH_ZEIT_UNGUELTIG");
  pruefeZeit(bewerber.wartetSeitMs, "MERCHANT_STABILITAET_WARTEN_ZEIT_UNGUELTIG");
  pruefeZeit(bewerber.deadlineAmMs, "MERCHANT_STABILITAET_DEADLINE_UNGUELTIG");
  if (kontext.bereichBegonnenAmMs > jetztMs
      || bewerber.wartetSeitMs > jetztMs
      || bewerber.deadlineAmMs < bewerber.wartetSeitMs) {
    throw new Error("MERCHANT_STABILITAET_ZEIT_DRIFT");
  }
  if (kontext.letzterWechselAmMs !== null) {
    pruefeZeit(kontext.letzterWechselAmMs, "MERCHANT_STABILITAET_LETZTER_WECHSEL_UNGUELTIG");
    if (kontext.letzterWechselAmMs > jetztMs) {
      throw new Error("MERCHANT_STABILITAET_WECHSEL_ZEIT_DRIFT");
    }
  }
  if (kontext.wechselHistorieMs.length > richtlinie.maximaleHistorie) {
    throw new Error("MERCHANT_STABILITAET_HISTORIE_ZU_GROSS");
  }
  for (let index = 0; index < kontext.wechselHistorieMs.length; index += 1) {
    const wert = kontext.wechselHistorieMs[index];
    if (wert === undefined) throw new Error("MERCHANT_STABILITAET_HISTORIE_FEHLT");
    pruefeZeit(wert, "MERCHANT_STABILITAET_HISTORIE_ZEIT_UNGUELTIG");
    if (wert > jetztMs
        || (index > 0 && wert < (kontext.wechselHistorieMs[index - 1] ?? 0))) {
      throw new Error("MERCHANT_STABILITAET_HISTORIE_DRIFT");
    }
  }

  const fensterStart = Math.max(0, jetztMs - richtlinie.wechselFensterMs);
  const wechselImFenster = kontext.wechselHistorieMs.filter(
    wert => wert >= fensterStart && wert <= jetztMs,
  ).length;
  const gewartetMs = Math.max(0, jetztMs - bewerber.wartetSeitMs);

  if (bewerber.bereich === kontext.aktuellerBereich) {
    return ergebnis(false, "GLEICHER_BEREICH", wechselImFenster, gewartetMs);
  }
  if (kontext.irreversibleMutationOffen) {
    return ergebnis(false, "IRREVERSIBLE_MUTATION_OFFEN", wechselImFenster, gewartetMs);
  }
  if (!kontext.sichereUnterbrechung || !kontext.checkpointDurable) {
    return ergebnis(
      false,
      "KEIN_SICHERER_DURABLER_UNTERBRECHUNGSPUNKT",
      wechselImFenster,
      gewartetMs,
    );
  }

  const aktuellSafety = istSafetyOderNotfall(kontext.aktuellePrioritaetsKlasse);
  const bewerberSafety = istSafetyOderNotfall(bewerber.prioritaetsKlasse);
  if (aktuellSafety && !bewerberSafety) {
    return ergebnis(
      false,
      "AKTUELLE_SAFETY_ARBEIT_HAT_VORRANG",
      wechselImFenster,
      gewartetMs,
    );
  }
  if (!bewerber.schedulerVorrang) {
    return ergebnis(false, "SCHEDULER_GIBT_KEINEN_VORRANG", wechselImFenster, gewartetMs);
  }
  if (bewerberSafety && !aktuellSafety) {
    return ergebnis(true, "SAFETY_PREEMPTION", wechselImFenster, gewartetMs);
  }
  if (gewartetMs >= richtlinie.starvationGrenzeMs) {
    return ergebnis(
      true,
      "STARVATION_GRENZE_ERREICHT",
      wechselImFenster,
      gewartetMs,
    );
  }
  if (jetztMs - kontext.bereichBegonnenAmMs < richtlinie.mindestHaltedauerMs) {
    return ergebnis(false, "MINDEST_HALTEDAUER", wechselImFenster, gewartetMs);
  }
  if (kontext.letzterWechselAmMs !== null
      && jetztMs - kontext.letzterWechselAmMs < richtlinie.wechselCooldownMs) {
    return ergebnis(false, "WECHSEL_COOLDOWN", wechselImFenster, gewartetMs);
  }
  if (wechselImFenster >= richtlinie.maximaleWechselImFenster) {
    return ergebnis(
      false,
      "WECHSEL_BUDGET_ERSCHOEPFT",
      wechselImFenster,
      gewartetMs,
    );
  }
  return ergebnis(true, "STABILER_WECHSEL_ERLAUBT", wechselImFenster, gewartetMs);
}
