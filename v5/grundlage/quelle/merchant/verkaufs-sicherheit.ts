import {
  physischeGegenstandsKennung,
  validierePhysischeGegenstandsIdentitaet,
  type PhysischeGegenstandsIdentitaet,
} from "./gegenstands-identitaet.js";
import type {
  GegenstandsDispositionsLedger,
  GegenstandsReservierung,
} from "./disposition.js";

export interface VerkaufsMetadatenEvidence {
  readonly schemaVersion: 1;
  readonly name: string;
  readonly typ: string;
  readonly maximaleStackMenge: number | null;
  readonly quest: boolean;
  readonly exchange: boolean;
  readonly event: boolean;
  readonly cash: boolean;
  readonly soulbound: boolean;
  readonly upgrade: boolean;
  readonly compound: boolean;
  readonly strukturelleSignale: readonly string[];
  readonly spezialSignale: readonly string[];
  readonly konflikt: boolean;
  readonly beobachtetAmMs: number;
  readonly gueltigBisMs: number;
  readonly fingerprint: string;
}

export interface NpcVerkaufsWertEvidence {
  readonly schemaVersion: 1;
  readonly name: string;
  readonly level: number;
  readonly npcVerkaufProEinheit: number;
  readonly konservativerReferenzwertProEinheit: number | null;
  readonly beobachtetAmMs: number;
  readonly gueltigBisMs: number;
  readonly fingerprint: string;
}

export interface VerkaufsPhysikNachweis {
  readonly gesperrt: boolean;
  readonly blockiert: boolean;
  readonly spezialKennung: string | null;
}

export interface VerkaufsRichtlinie {
  readonly richtlinienVersion: string;
  readonly erlaubteMetadatenTypen: readonly string[];
  readonly referenzwertErforderlich: boolean;
  readonly minimalerNpcAnteilAmReferenzwertBp: number;
  readonly maximalerAutomatischerGesamtwert: number;
  readonly maximalesIdentitaetsAlterMs: number;
}

export type NpcVerkaufsEntscheidungArt =
  | "ERLAUBT"
  | "GESPERRT"
  | "QUARANTAENE";

export interface NpcVerkaufsBewertung {
  readonly schemaVersion: 1;
  readonly art: NpcVerkaufsEntscheidungArt;
  readonly physischeKennung: string;
  readonly menge: number;
  readonly npcGesamtwert: number | null;
  readonly referenzGesamtwert: number | null;
  readonly npcAnteilAmReferenzwertBp: number | null;
  readonly gruende: readonly string[];
  readonly actionContractId: "AL-ACTION-SELL";
  readonly recoveryContractId: "AL-RECOVERY-SELL";
  readonly richtlinienVersion: string;
  readonly planungsNachweis: true;
  readonly ausfuehrungsAutoritaet: false;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

export interface NpcVerkaufsBewertungsAnfrage {
  readonly identitaet: PhysischeGegenstandsIdentitaet;
  readonly metadaten: VerkaufsMetadatenEvidence;
  readonly wert: NpcVerkaufsWertEvidence;
  readonly physik: VerkaufsPhysikNachweis;
  readonly dispositionen: Pick<
    GegenstandsDispositionsLedger,
    "lies" | "reservierungen"
  >;
  readonly richtlinie: VerkaufsRichtlinie;
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

function pruefeZeitfenster(
  beobachtetAmMs: number,
  gueltigBisMs: number,
  jetztMs: number,
  fehler: string,
): void {
  pruefeGanzzahl(
    beobachtetAmMs,
    0,
    Number.MAX_SAFE_INTEGER,
    fehler,
  );
  pruefeGanzzahl(
    gueltigBisMs,
    beobachtetAmMs,
    Number.MAX_SAFE_INTEGER,
    fehler,
  );
  if (!Number.isSafeInteger(jetztMs)
      || jetztMs < beobachtetAmMs
      || jetztMs > gueltigBisMs) {
    throw new Error(fehler);
  }
}

function validiereRichtlinie(richtlinie: VerkaufsRichtlinie): void {
  pruefeText(
    richtlinie.richtlinienVersion,
    "VERKAUF_RICHTLINIEN_VERSION_UNGUELTIG",
  );
  if (richtlinie.erlaubteMetadatenTypen.length < 1
      || richtlinie.erlaubteMetadatenTypen.length > 32) {
    throw new Error("VERKAUF_ERLAUBTE_TYPEN_UNGUELTIG");
  }
  for (let index = 0; index < richtlinie.erlaubteMetadatenTypen.length; index += 1) {
    const typ = richtlinie.erlaubteMetadatenTypen[index];
    if (typ === undefined) throw new Error("VERKAUF_ERLAUBTER_TYP_FEHLT");
    pruefeText(typ, "VERKAUF_ERLAUBTER_TYP_UNGUELTIG");
    if (richtlinie.erlaubteMetadatenTypen
      .slice(0, index)
      .some(x => x === typ)) {
      throw new Error("VERKAUF_ERLAUBTER_TYP_DOPPELT");
    }
  }
  pruefeGanzzahl(
    richtlinie.minimalerNpcAnteilAmReferenzwertBp,
    0,
    10_000,
    "VERKAUF_MINDEST_REFERENZANTEIL_UNGUELTIG",
  );
  pruefeGanzzahl(
    richtlinie.maximalerAutomatischerGesamtwert,
    1,
    Number.MAX_SAFE_INTEGER,
    "VERKAUF_MAX_GESAMTWERT_UNGUELTIG",
  );
  pruefeGanzzahl(
    richtlinie.maximalesIdentitaetsAlterMs,
    1,
    86_400_000,
    "VERKAUF_IDENTITAETSALTER_UNGUELTIG",
  );
}

function validiereMetadaten(
  evidence: VerkaufsMetadatenEvidence,
  jetztMs: number,
): void {
  if (evidence.schemaVersion !== 1) {
    throw new Error("VERKAUF_METADATEN_SCHEMA_UNGUELTIG");
  }
  for (const text of [
    evidence.name,
    evidence.typ,
    evidence.fingerprint,
  ]) {
    pruefeText(text, "VERKAUF_METADATEN_TEXT_UNGUELTIG");
  }
  if (evidence.maximaleStackMenge !== null) {
    pruefeGanzzahl(
      evidence.maximaleStackMenge,
      1,
      1_000_000,
      "VERKAUF_STACKLIMIT_UNGUELTIG",
    );
  }
  if (evidence.strukturelleSignale.length > 32
      || evidence.spezialSignale.length > 32) {
    throw new Error("VERKAUF_METADATEN_SIGNale_ZU_GROSS");
  }
  for (const text of [
    ...evidence.strukturelleSignale,
    ...evidence.spezialSignale,
  ]) {
    pruefeText(text, "VERKAUF_METADATEN_SIGNAL_UNGUELTIG");
  }
  pruefeZeitfenster(
    evidence.beobachtetAmMs,
    evidence.gueltigBisMs,
    jetztMs,
    "VERKAUF_METADATEN_NICHT_FRISCH",
  );
}

function validiereWert(
  evidence: NpcVerkaufsWertEvidence,
  jetztMs: number,
): void {
  if (evidence.schemaVersion !== 1) {
    throw new Error("VERKAUF_WERT_SCHEMA_UNGUELTIG");
  }
  for (const text of [evidence.name, evidence.fingerprint]) {
    pruefeText(text, "VERKAUF_WERT_TEXT_UNGUELTIG");
  }
  pruefeGanzzahl(
    evidence.level,
    0,
    99,
    "VERKAUF_WERT_LEVEL_UNGUELTIG",
  );
  pruefeGanzzahl(
    evidence.npcVerkaufProEinheit,
    0,
    Number.MAX_SAFE_INTEGER,
    "VERKAUF_NPC_WERT_UNGUELTIG",
  );
  if (evidence.konservativerReferenzwertProEinheit !== null) {
    pruefeGanzzahl(
      evidence.konservativerReferenzwertProEinheit,
      0,
      Number.MAX_SAFE_INTEGER,
      "VERKAUF_REFERENZWERT_UNGUELTIG",
    );
  }
  pruefeZeitfenster(
    evidence.beobachtetAmMs,
    evidence.gueltigBisMs,
    jetztMs,
    "VERKAUF_WERT_NICHT_FRISCH",
  );
}

function aktiveReservierungFuer(
  reservierungen: readonly GegenstandsReservierung[],
  physischeKennung: string,
): GegenstandsReservierung | null {
  return reservierungen.find(
    x => x.physischeKennung === physischeKennung,
  ) ?? null;
}

function schuetzerGruende(
  metadaten: VerkaufsMetadatenEvidence,
): readonly string[] {
  let gruende: readonly string[] = Object.freeze([]);
  if (metadaten.quest) {
    gruende = Object.freeze([...gruende, "VERKAUF_QUEST_ITEM_GESCHUETZT"]);
  }
  if (metadaten.exchange) {
    gruende = Object.freeze([...gruende, "VERKAUF_EXCHANGE_ITEM_GESCHUETZT"]);
  }
  if (metadaten.event) {
    gruende = Object.freeze([...gruende, "VERKAUF_EVENT_ITEM_GESCHUETZT"]);
  }
  if (metadaten.cash) {
    gruende = Object.freeze([...gruende, "VERKAUF_CASH_ITEM_GESCHUETZT"]);
  }
  if (metadaten.soulbound) {
    gruende = Object.freeze([...gruende, "VERKAUF_SOULBOUND_ITEM_GESCHUETZT"]);
  }
  if (metadaten.upgrade) {
    gruende = Object.freeze([...gruende, "VERKAUF_UPGRADE_ITEM_GESCHUETZT"]);
  }
  if (metadaten.compound) {
    gruende = Object.freeze([...gruende, "VERKAUF_COMPOUND_ITEM_GESCHUETZT"]);
  }
  if (metadaten.strukturelleSignale.length > 0) {
    gruende = Object.freeze([...gruende, "VERKAUF_STRUKTURELLES_SIGNAL_GESCHUETZT"]);
  }
  if (metadaten.spezialSignale.length > 0) {
    gruende = Object.freeze([...gruende, "VERKAUF_SPEZIAL_SIGNAL_GESCHUETZT"]);
  }
  return gruende;
}

function baueBewertung(
  anfrage: NpcVerkaufsBewertungsAnfrage,
  art: NpcVerkaufsEntscheidungArt,
  physischeKennung: string,
  npcGesamtwert: number | null,
  referenzGesamtwert: number | null,
  npcAnteilAmReferenzwertBp: number | null,
  gruende: readonly string[],
): NpcVerkaufsBewertung {
  return Object.freeze({
    schemaVersion: 1,
    art,
    physischeKennung,
    menge: anfrage.identitaet.menge,
    npcGesamtwert,
    referenzGesamtwert,
    npcAnteilAmReferenzwertBp,
    gruende: Object.freeze([...gruende]),
    actionContractId: "AL-ACTION-SELL",
    recoveryContractId: "AL-RECOVERY-SELL",
    richtlinienVersion: anfrage.richtlinie.richtlinienVersion,
    planungsNachweis: true,
    ausfuehrungsAutoritaet: false,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
  });
}

export function bewerteNpcVerkauf(
  anfrage: NpcVerkaufsBewertungsAnfrage,
  jetztMs: number,
): NpcVerkaufsBewertung {
  validiereRichtlinie(anfrage.richtlinie);
  validierePhysischeGegenstandsIdentitaet(anfrage.identitaet);
  validiereMetadaten(anfrage.metadaten, jetztMs);
  validiereWert(anfrage.wert, jetztMs);

  if (!Number.isSafeInteger(jetztMs) || jetztMs < 0) {
    throw new Error("VERKAUF_ZEIT_UNGUELTIG");
  }
  if (jetztMs < anfrage.identitaet.beobachtetAmMs
      || jetztMs - anfrage.identitaet.beobachtetAmMs
        > anfrage.richtlinie.maximalesIdentitaetsAlterMs) {
    throw new Error("VERKAUF_ITEM_IDENTITAET_NICHT_FRISCH");
  }

  const physischeKennung = physischeGegenstandsKennung(anfrage.identitaet);
  const disposition = anfrage.dispositionen.lies(anfrage.identitaet);
  if (disposition.disposition === "QUARANTAENE") {
    return baueBewertung(
      anfrage,
      "QUARANTAENE",
      physischeKennung,
      null,
      null,
      null,
      Object.freeze(["VERKAUF_DISPOSITION_QUARANTAENE"]),
    );
  }
  if (disposition.disposition !== "NPC_VERKAUF") {
    return baueBewertung(
      anfrage,
      "GESPERRT",
      physischeKennung,
      null,
      null,
      null,
      Object.freeze([
        "VERKAUF_DISPOSITION_VERBIETET_NPC:"
        + disposition.disposition,
      ]),
    );
  }

  if (anfrage.metadaten.name !== anfrage.identitaet.name
      || anfrage.wert.name !== anfrage.identitaet.name
      || anfrage.wert.level !== anfrage.identitaet.level) {
    return baueBewertung(
      anfrage,
      "QUARANTAENE",
      physischeKennung,
      null,
      null,
      null,
      Object.freeze(["VERKAUF_EVIDENCE_IDENTITAETS_WIDERSPRUCH"]),
    );
  }

  if (anfrage.metadaten.konflikt) {
    return baueBewertung(
      anfrage,
      "QUARANTAENE",
      physischeKennung,
      null,
      null,
      null,
      Object.freeze(["VERKAUF_METADATEN_KONFLIKT"]),
    );
  }

  if (!anfrage.richtlinie.erlaubteMetadatenTypen
    .some(x => x === anfrage.metadaten.typ)) {
    return baueBewertung(
      anfrage,
      "GESPERRT",
      physischeKennung,
      null,
      null,
      null,
      Object.freeze(["VERKAUF_METADATEN_TYP_NICHT_ERLAUBT"]),
    );
  }
  if (anfrage.metadaten.maximaleStackMenge === null
      || anfrage.metadaten.maximaleStackMenge < 2) {
    return baueBewertung(
      anfrage,
      "GESPERRT",
      physischeKennung,
      null,
      null,
      null,
      Object.freeze(["VERKAUF_NICHT_NORMAL_STACKBAR"]),
    );
  }

  const schutz = schuetzerGruende(anfrage.metadaten);
  if (schutz.length > 0) {
    return baueBewertung(
      anfrage,
      "GESPERRT",
      physischeKennung,
      null,
      null,
      null,
      schutz,
    );
  }
  if (anfrage.physik.gesperrt
      || anfrage.physik.blockiert
      || anfrage.physik.spezialKennung !== null) {
    return baueBewertung(
      anfrage,
      "GESPERRT",
      physischeKennung,
      null,
      null,
      null,
      Object.freeze(["VERKAUF_PHYSISCHES_ITEM_GESCHUETZT"]),
    );
  }

  const reservierung = aktiveReservierungFuer(
    anfrage.dispositionen.reservierungen(),
    physischeKennung,
  );
  if (reservierung !== null) {
    return baueBewertung(
      anfrage,
      "GESPERRT",
      physischeKennung,
      null,
      null,
      null,
      Object.freeze([
        "VERKAUF_ITEM_BEREITS_RESERVIERT:"
        + reservierung.reservierungsId,
      ]),
    );
  }

  const npcGesamtwert =
    anfrage.wert.npcVerkaufProEinheit * anfrage.identitaet.menge;
  if (!Number.isSafeInteger(npcGesamtwert)) {
    throw new Error("VERKAUF_NPC_GESAMTWERT_UEBERLAUF");
  }
  if (npcGesamtwert > anfrage.richtlinie.maximalerAutomatischerGesamtwert) {
    return baueBewertung(
      anfrage,
      "GESPERRT",
      physischeKennung,
      npcGesamtwert,
      null,
      null,
      Object.freeze(["VERKAUF_AUTOMATIK_WERTGRENZE_UEBERSCHRITTEN"]),
    );
  }

  const referenzProEinheit =
    anfrage.wert.konservativerReferenzwertProEinheit;
  if (referenzProEinheit === null) {
    return baueBewertung(
      anfrage,
      anfrage.richtlinie.referenzwertErforderlich
        ? "GESPERRT"
        : "ERLAUBT",
      physischeKennung,
      npcGesamtwert,
      null,
      null,
      Object.freeze([
        anfrage.richtlinie.referenzwertErforderlich
          ? "VERKAUF_REFERENZWERT_FEHLT"
          : "VERKAUF_SICHER_OHNE_REFERENZWERT",
      ]),
    );
  }

  const referenzGesamtwert =
    referenzProEinheit * anfrage.identitaet.menge;
  if (!Number.isSafeInteger(referenzGesamtwert)) {
    throw new Error("VERKAUF_REFERENZ_GESAMTWERT_UEBERLAUF");
  }
  const npcAnteilAmReferenzwertBp = referenzGesamtwert === 0
    ? 10_000
    : Math.floor((npcGesamtwert * 10_000) / referenzGesamtwert);
  if (!Number.isSafeInteger(npcAnteilAmReferenzwertBp)) {
    throw new Error("VERKAUF_REFERENZANTEIL_UEBERLAUF");
  }
  if (npcAnteilAmReferenzwertBp
      < anfrage.richtlinie.minimalerNpcAnteilAmReferenzwertBp) {
    return baueBewertung(
      anfrage,
      "GESPERRT",
      physischeKennung,
      npcGesamtwert,
      referenzGesamtwert,
      npcAnteilAmReferenzwertBp,
      Object.freeze(["VERKAUF_NPC_WERT_ZU_WEIT_UNTER_REFERENZ"]),
    );
  }

  return baueBewertung(
    anfrage,
    "ERLAUBT",
    physischeKennung,
    npcGesamtwert,
    referenzGesamtwert,
    npcAnteilAmReferenzwertBp,
    Object.freeze(["VERKAUF_SICHERHEIT_UND_WERT_EVIDENCE_BESTANDEN"]),
  );
}
