import {
  pinneListingEvidence,
  type GepinnteListingEvidence,
} from "./markt-evidence.js";
import type {
  NpcVerkaufsWertEvidence,
} from "./verkaufs-sicherheit.js";
import type { MerchantDemand } from "./demand.js";
import type {
  AblaufPrioritaetsKlasse,
  WissensSnapshotPin,
} from "../scheduler/workflow-vertrag.js";

export interface MarktHistorienBeobachtung {
  readonly schemaVersion: 1;
  readonly beobachtungsId: string;
  readonly listingSchluessel: string;
  readonly name: string;
  readonly level: number;
  readonly seite: "SELL" | "BUY";
  readonly preisProEinheit: number;
  readonly menge: number;
  readonly beobachtetAmMs: number;
  readonly gueltigBisMs: number;
  readonly listingFingerprint: string;
  readonly mengenFingerprint: string;
}

export interface MarktHistorienEintrag {
  readonly schluessel: string;
  readonly name: string;
  readonly level: number;
  readonly beobachtungen: readonly MarktHistorienBeobachtung[];
}

export interface MarktAnalyseRichtlinie {
  readonly richtlinienVersion: string;
  readonly maximalesReferenzAlterMs: number;
  readonly minimaleKaufBeobachtungen: number;
  readonly minimaleGesamtBeobachtungen: number;
}

export interface MarktPreisAnalyse {
  readonly schemaVersion: 1;
  readonly name: string;
  readonly level: number;
  readonly verwendbar: boolean;
  readonly aktuelleBeobachtungen: number;
  readonly aktuelleKaufBeobachtungen: number;
  readonly aktuelleVerkaufBeobachtungen: number;
  readonly hoechsterKaufpreis: number | null;
  readonly niedrigsterVerkaufspreis: number | null;
  readonly spreadBp: number | null;
  readonly konservativerReferenzwertProEinheit: number | null;
  readonly referenzBeobachtungsId: string | null;
  readonly referenzFingerprint: string | null;
  readonly referenzBeobachtetAmMs: number | null;
  readonly referenzGueltigBisMs: number | null;
  readonly gruende: readonly string[];
  readonly richtlinienVersion: string;
  readonly planungsNachweis: true;
  readonly ausfuehrungsAutoritaet: false;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

export interface NpcPreisEvidenceEingabe {
  readonly name: string;
  readonly level: number;
  readonly npcVerkaufProEinheit: number;
  readonly beobachtetAmMs: number;
  readonly gueltigBisMs: number;
  readonly fingerprint: string;
}

export interface MarktBeobachtungsDemandAnfrage {
  readonly demandId: string;
  readonly characterId: string;
  readonly erstelltAmMs: number;
  readonly deadlineAmMs: number;
  readonly prioritaetsKlasse: AblaufPrioritaetsKlasse;
  readonly prioritaetsRang: number;
  readonly ressourcenIds: readonly string[];
  readonly wissensSnapshot: WissensSnapshotPin;
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

function kompakteKennung(prefix: string, text: string): string {
  let checksum = 0;
  for (let index = 0; index < text.length; index += 1) {
    checksum = (checksum * 131 + text.charCodeAt(index)) % 2_147_483_647;
  }
  return prefix + ":" + String(text.length) + ":" + String(checksum);
}

function marktSchluessel(name: string, level: number): string {
  pruefeText(name, "MARKT_HISTORIE_NAME_UNGUELTIG");
  pruefeGanzzahl(level, 0, 99, "MARKT_HISTORIE_LEVEL_UNGUELTIG");
  return name + ":" + String(level);
}

function listingSchluessel(evidence: GepinnteListingEvidence): string {
  return [
    evidence.targetCharacterId,
    evidence.tradeSlot,
    evidence.rid,
    evidence.seite,
  ].join("|");
}

function beobachtungsId(evidence: GepinnteListingEvidence): string {
  return [
    listingSchluessel(evidence),
    evidence.quantityFingerprint,
  ].join("|");
}

function friereBeobachtung(
  beobachtung: MarktHistorienBeobachtung,
): MarktHistorienBeobachtung {
  return Object.freeze({ ...beobachtung });
}

function friereEintrag(
  eintrag: MarktHistorienEintrag,
): MarktHistorienEintrag {
  return Object.freeze({
    ...eintrag,
    beobachtungen: Object.freeze(
      eintrag.beobachtungen.map(friereBeobachtung),
    ),
  });
}

function neuesteBeobachtungMs(eintrag: MarktHistorienEintrag): number {
  return eintrag.beobachtungen.reduce(
    (maximum, x) => Math.max(maximum, x.beobachtetAmMs),
    0,
  );
}

function validiereAnalyseRichtlinie(
  richtlinie: MarktAnalyseRichtlinie,
): void {
  pruefeText(
    richtlinie.richtlinienVersion,
    "MARKT_ANALYSE_RICHTLINIE_UNGUELTIG",
  );
  pruefeGanzzahl(
    richtlinie.maximalesReferenzAlterMs,
    1,
    86_400_000,
    "MARKT_ANALYSE_ALTER_UNGUELTIG",
  );
  pruefeGanzzahl(
    richtlinie.minimaleKaufBeobachtungen,
    1,
    128,
    "MARKT_ANALYSE_KAUF_MINIMUM_UNGUELTIG",
  );
  pruefeGanzzahl(
    richtlinie.minimaleGesamtBeobachtungen,
    richtlinie.minimaleKaufBeobachtungen,
    256,
    "MARKT_ANALYSE_GESAMT_MINIMUM_UNGUELTIG",
  );
}

function aktuelleListings(
  beobachtungen: readonly MarktHistorienBeobachtung[],
  jetztMs: number,
  maximalesAlterMs: number,
): readonly MarktHistorienBeobachtung[] {
  let aktuell: readonly MarktHistorienBeobachtung[] = Object.freeze([]);
  const kandidaten = beobachtungen
    .filter(x =>
      jetztMs >= x.beobachtetAmMs
      && jetztMs <= x.gueltigBisMs
      && jetztMs - x.beobachtetAmMs <= maximalesAlterMs)
    .sort((a, b) =>
      a.beobachtetAmMs - b.beobachtetAmMs
      || a.beobachtungsId.localeCompare(b.beobachtungsId));

  for (const kandidat of kandidaten) {
    const vorhanden = aktuell.find(
      x => x.listingSchluessel === kandidat.listingSchluessel,
    );
    if (vorhanden === undefined) {
      aktuell = Object.freeze([...aktuell, kandidat]);
      continue;
    }
    aktuell = Object.freeze(
      aktuell.map(x =>
        x.listingSchluessel === kandidat.listingSchluessel
          ? kandidat
          : x),
    );
  }
  return aktuell;
}

function analyseOhneEvidence(
  name: string,
  level: number,
  richtlinie: MarktAnalyseRichtlinie,
  grund: string,
): MarktPreisAnalyse {
  return Object.freeze({
    schemaVersion: 1,
    name,
    level,
    verwendbar: false,
    aktuelleBeobachtungen: 0,
    aktuelleKaufBeobachtungen: 0,
    aktuelleVerkaufBeobachtungen: 0,
    hoechsterKaufpreis: null,
    niedrigsterVerkaufspreis: null,
    spreadBp: null,
    konservativerReferenzwertProEinheit: null,
    referenzBeobachtungsId: null,
    referenzFingerprint: null,
    referenzBeobachtetAmMs: null,
    referenzGueltigBisMs: null,
    gruende: Object.freeze([grund]),
    richtlinienVersion: richtlinie.richtlinienVersion,
    planungsNachweis: true,
    ausfuehrungsAutoritaet: false,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
  });
}

export class MarktHistorie {
  readonly #maximaleItems: number;
  readonly #maximaleBeobachtungenJeItem: number;
  #eintraege: readonly MarktHistorienEintrag[] = Object.freeze([]);

  public constructor(
    maximaleItems = 128,
    maximaleBeobachtungenJeItem = 64,
  ) {
    pruefeGanzzahl(
      maximaleItems,
      1,
      512,
      "MARKT_HISTORIE_ITEM_GRENZE_UNGUELTIG",
    );
    pruefeGanzzahl(
      maximaleBeobachtungenJeItem,
      1,
      256,
      "MARKT_HISTORIE_SAMPLE_GRENZE_UNGUELTIG",
    );
    this.#maximaleItems = maximaleItems;
    this.#maximaleBeobachtungenJeItem = maximaleBeobachtungenJeItem;
  }

  public erfasseListing(
    evidence: GepinnteListingEvidence,
    jetztMs: number,
  ): MarktHistorienBeobachtung {
    const validiert = pinneListingEvidence(evidence, jetztMs);
    if (validiert.listingFingerprint !== evidence.listingFingerprint
        || validiert.quantityFingerprint !== evidence.quantityFingerprint) {
      throw new Error("MARKT_HISTORIE_LISTING_FINGERPRINT_WIDERSPRUCH");
    }

    const schluessel = marktSchluessel(
      evidence.itemName,
      evidence.level,
    );
    const beobachtung = friereBeobachtung({
      schemaVersion: 1,
      beobachtungsId: beobachtungsId(evidence),
      listingSchluessel: listingSchluessel(evidence),
      name: evidence.itemName,
      level: evidence.level,
      seite: evidence.seite,
      preisProEinheit: evidence.unitPrice,
      menge: evidence.menge,
      beobachtetAmMs: evidence.beobachtetAmMs,
      gueltigBisMs: evidence.gueltigBisMs,
      listingFingerprint: evidence.listingFingerprint,
      mengenFingerprint: evidence.quantityFingerprint,
    });

    const vorhanden = this.#eintraege.find(
      x => x.schluessel === schluessel,
    );
    if (vorhanden !== undefined
        && vorhanden.beobachtungen.some(
          x => x.beobachtungsId === beobachtung.beobachtungsId,
        )) {
      return beobachtung;
    }

    if (vorhanden === undefined) {
      if (this.#eintraege.length >= this.#maximaleItems) {
        const sortiert = [...this.#eintraege].sort((a, b) =>
          neuesteBeobachtungMs(a) - neuesteBeobachtungMs(b)
          || a.schluessel.localeCompare(b.schluessel));
        const zuEntfernen = sortiert[0];
        if (zuEntfernen === undefined) {
          throw new Error("MARKT_HISTORIE_EVICTION_FEHLT");
        }
        this.#eintraege = Object.freeze(
          this.#eintraege.filter(
            x => x.schluessel !== zuEntfernen.schluessel,
          ),
        );
      }
      this.#eintraege = Object.freeze([
        ...this.#eintraege,
        friereEintrag({
          schluessel,
          name: evidence.itemName,
          level: evidence.level,
          beobachtungen: Object.freeze([beobachtung]),
        }),
      ]);
      return beobachtung;
    }

    const beobachtungen = Object.freeze(
      [...vorhanden.beobachtungen, beobachtung]
        .sort((a, b) =>
          a.beobachtetAmMs - b.beobachtetAmMs
          || a.beobachtungsId.localeCompare(b.beobachtungsId))
        .slice(-this.#maximaleBeobachtungenJeItem),
    );
    const neu = friereEintrag({
      ...vorhanden,
      beobachtungen,
    });
    this.#eintraege = Object.freeze(
      this.#eintraege.map(
        x => x.schluessel === schluessel ? neu : x,
      ),
    );
    return beobachtung;
  }

  public analysiere(
    name: string,
    level: number,
    jetztMs: number,
    richtlinie: MarktAnalyseRichtlinie,
  ): MarktPreisAnalyse {
    validiereAnalyseRichtlinie(richtlinie);
    const schluessel = marktSchluessel(name, level);
    pruefeGanzzahl(
      jetztMs,
      0,
      Number.MAX_SAFE_INTEGER,
      "MARKT_ANALYSE_ZEIT_UNGUELTIG",
    );
    const eintrag = this.#eintraege.find(
      x => x.schluessel === schluessel,
    );
    if (eintrag === undefined) {
      return analyseOhneEvidence(
        name,
        level,
        richtlinie,
        "MARKT_HISTORIE_FEHLT",
      );
    }

    const aktuell = aktuelleListings(
      eintrag.beobachtungen,
      jetztMs,
      richtlinie.maximalesReferenzAlterMs,
    );
    const kauf = aktuell.filter(x => x.seite === "BUY");
    const verkauf = aktuell.filter(x => x.seite === "SELL");
    const referenz = [...kauf].sort((a, b) =>
      b.preisProEinheit - a.preisProEinheit
      || b.beobachtetAmMs - a.beobachtetAmMs
      || a.beobachtungsId.localeCompare(b.beobachtungsId))[0] ?? null;
    const niedrigsterVerkauf = [...verkauf].sort((a, b) =>
      a.preisProEinheit - b.preisProEinheit
      || b.beobachtetAmMs - a.beobachtetAmMs
      || a.beobachtungsId.localeCompare(b.beobachtungsId))[0] ?? null;

    const hoechsterKaufpreis = referenz?.preisProEinheit ?? null;
    const niedrigsterVerkaufspreis =
      niedrigsterVerkauf?.preisProEinheit ?? null;
    const marktGekreuzt = hoechsterKaufpreis !== null
      && niedrigsterVerkaufspreis !== null
      && hoechsterKaufpreis > niedrigsterVerkaufspreis;
    const spreadBp = hoechsterKaufpreis !== null
      && niedrigsterVerkaufspreis !== null
      && niedrigsterVerkaufspreis > 0
      ? Math.floor(
        ((niedrigsterVerkaufspreis - hoechsterKaufpreis) * 10_000)
        / niedrigsterVerkaufspreis,
      )
      : null;

    let gruende: readonly string[] = Object.freeze([]);
    if (aktuell.length < richtlinie.minimaleGesamtBeobachtungen) {
      gruende = Object.freeze([
        ...gruende,
        "MARKT_ZU_WENIGE_AKTUELLE_BEOBACHTUNGEN",
      ]);
    }
    if (kauf.length < richtlinie.minimaleKaufBeobachtungen) {
      gruende = Object.freeze([
        ...gruende,
        "MARKT_ZU_WENIGE_KAUFBEOBACHTUNGEN",
      ]);
    }
    if (marktGekreuzt) {
      gruende = Object.freeze([
        ...gruende,
        "MARKT_PREIS_EVIDENCE_WIDERSPRUCH",
      ]);
    }

    const verwendbar = gruende.length === 0 && referenz !== null;
    if (verwendbar) {
      gruende = Object.freeze([
        "MARKT_REFERENZWERT_EVIDENCE_AUSREICHEND",
      ]);
    }
    const referenzFingerprint = referenz === null
      ? null
      : kompakteKennung(
        "markt-ref",
        [
          name,
          String(level),
          String(referenz.preisProEinheit),
          String(referenz.beobachtetAmMs),
          referenz.beobachtungsId,
        ].join("|"),
      );

    return Object.freeze({
      schemaVersion: 1,
      name,
      level,
      verwendbar,
      aktuelleBeobachtungen: aktuell.length,
      aktuelleKaufBeobachtungen: kauf.length,
      aktuelleVerkaufBeobachtungen: verkauf.length,
      hoechsterKaufpreis,
      niedrigsterVerkaufspreis,
      spreadBp,
      konservativerReferenzwertProEinheit:
        verwendbar ? referenz?.preisProEinheit ?? null : null,
      referenzBeobachtungsId:
        verwendbar ? referenz?.beobachtungsId ?? null : null,
      referenzFingerprint:
        verwendbar ? referenzFingerprint : null,
      referenzBeobachtetAmMs:
        verwendbar ? referenz?.beobachtetAmMs ?? null : null,
      referenzGueltigBisMs:
        verwendbar ? referenz?.gueltigBisMs ?? null : null,
      gruende,
      richtlinienVersion: richtlinie.richtlinienVersion,
      planungsNachweis: true,
      ausfuehrungsAutoritaet: false,
      gameplayAutoritaet: false,
      rawWriteAutoritaet: false,
    });
  }

  public sicht(): readonly MarktHistorienEintrag[] {
    return Object.freeze(
      [...this.#eintraege]
        .sort((a, b) => a.schluessel.localeCompare(b.schluessel))
        .map(friereEintrag),
    );
  }
}

export function erzeugeNpcWertEvidenceAusMarkt(
  analyse: MarktPreisAnalyse,
  npc: NpcPreisEvidenceEingabe,
  jetztMs: number,
): NpcVerkaufsWertEvidence {
  if (!analyse.verwendbar
      || analyse.konservativerReferenzwertProEinheit === null
      || analyse.referenzFingerprint === null
      || analyse.referenzBeobachtetAmMs === null
      || analyse.referenzGueltigBisMs === null) {
    throw new Error("MARKT_REFERENZWERT_NICHT_VERWENDBAR");
  }
  for (const text of [npc.name, npc.fingerprint]) {
    pruefeText(text, "MARKT_NPC_EVIDENCE_TEXT_UNGUELTIG");
  }
  pruefeGanzzahl(
    npc.level,
    0,
    99,
    "MARKT_NPC_EVIDENCE_LEVEL_UNGUELTIG",
  );
  pruefeGanzzahl(
    npc.npcVerkaufProEinheit,
    0,
    Number.MAX_SAFE_INTEGER,
    "MARKT_NPC_EVIDENCE_WERT_UNGUELTIG",
  );
  pruefeGanzzahl(
    npc.beobachtetAmMs,
    0,
    Number.MAX_SAFE_INTEGER,
    "MARKT_NPC_EVIDENCE_ZEIT_UNGUELTIG",
  );
  pruefeGanzzahl(
    npc.gueltigBisMs,
    npc.beobachtetAmMs,
    Number.MAX_SAFE_INTEGER,
    "MARKT_NPC_EVIDENCE_GUELTIGKEIT_UNGUELTIG",
  );
  if (jetztMs < npc.beobachtetAmMs
      || jetztMs > npc.gueltigBisMs
      || jetztMs > analyse.referenzGueltigBisMs) {
    throw new Error("MARKT_NPC_EVIDENCE_NICHT_FRISCH");
  }
  if (npc.name !== analyse.name || npc.level !== analyse.level) {
    throw new Error("MARKT_NPC_EVIDENCE_IDENTITAETS_WIDERSPRUCH");
  }

  const beobachtetAmMs = Math.max(
    npc.beobachtetAmMs,
    analyse.referenzBeobachtetAmMs,
  );
  const gueltigBisMs = Math.min(
    npc.gueltigBisMs,
    analyse.referenzGueltigBisMs,
  );
  return Object.freeze({
    schemaVersion: 1,
    name: npc.name,
    level: npc.level,
    npcVerkaufProEinheit: npc.npcVerkaufProEinheit,
    konservativerReferenzwertProEinheit:
      analyse.konservativerReferenzwertProEinheit,
    beobachtetAmMs,
    gueltigBisMs,
    fingerprint: kompakteKennung(
      "npc-markt",
      [
        npc.fingerprint,
        analyse.referenzFingerprint,
      ].join("|"),
    ),
  });
}

export function erzeugeMarktBeobachtenDemand(
  analyse: MarktPreisAnalyse,
  anfrage: MarktBeobachtungsDemandAnfrage,
): MerchantDemand | null {
  if (analyse.verwendbar) return null;
  for (const text of [
    anfrage.demandId,
    anfrage.characterId,
  ]) {
    pruefeText(text, "MARKT_DEMAND_TEXT_UNGUELTIG");
  }
  pruefeGanzzahl(
    anfrage.erstelltAmMs,
    0,
    Number.MAX_SAFE_INTEGER,
    "MARKT_DEMAND_ZEIT_UNGUELTIG",
  );
  pruefeGanzzahl(
    anfrage.deadlineAmMs,
    anfrage.erstelltAmMs,
    Number.MAX_SAFE_INTEGER,
    "MARKT_DEMAND_DEADLINE_UNGUELTIG",
  );
  pruefeGanzzahl(
    anfrage.prioritaetsRang,
    0,
    1_000_000,
    "MARKT_DEMAND_PRIORITAET_UNGUELTIG",
  );

  return Object.freeze({
    schemaVersion: 1,
    demandId: anfrage.demandId,
    art: "MARKT_BEOBACHTEN",
    characterId: anfrage.characterId,
    accountId: null,
    erstelltAmMs: anfrage.erstelltAmMs,
    deadlineAmMs: anfrage.deadlineAmMs,
    prioritaetsKlasse: anfrage.prioritaetsKlasse,
    prioritaetsRang: anfrage.prioritaetsRang,
    ressourcenIds: Object.freeze([...anfrage.ressourcenIds]),
    payloadFingerprint: kompakteKennung(
      "markt-demand",
      [
        analyse.name,
        String(analyse.level),
        analyse.richtlinienVersion,
      ].join("|"),
    ),
    wissensSnapshot: Object.freeze({
      gitCommit: anfrage.wissensSnapshot.gitCommit,
      quellenSha256: Object.freeze([
        ...anfrage.wissensSnapshot.quellenSha256,
      ]),
    }),
  });
}
