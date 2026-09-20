import {
  pruefeSkillCapability,
  type SkillCapabilityNachweis,
  type SkillDefinition,
  type SkillLiveEvidence,
} from "../faehigkeiten/skill-capability.js";
import type { CharacterZielBindung } from "../koordination/roster-wahrheit.js";
import type { WissensSnapshotPin } from "../scheduler/workflow-vertrag.js";
import type { MerchantDemand } from "./demand.js";

export interface MLuckZielEvidence {
  readonly schemaVersion: 1;
  readonly ziel: CharacterZielBindung;
  readonly topologieRang: number;
  readonly beobachtetAmMs: number;
  readonly gueltigBisMs: number;
  readonly tot: boolean;
  readonly erreichbar: boolean;
  readonly inReichweite: boolean;
  readonly wirkungAktiv: boolean;
  readonly wirkungVerbleibendMs: number | null;
  readonly wirkungFingerprint: string;
  readonly naechsterVersuchAbMs: number | null;
}

export interface MLuckRichtlinie {
  readonly richtlinienVersion: string;
  readonly refreshVorlaufMs: number;
  readonly maximalesZielAlterMs: number;
  readonly maximalesSkillEvidenceAlterMs: number;
  readonly servicePrioritaetsRang: number;
}

export interface MLuckPlanungsAnfrage {
  readonly merchant: CharacterZielBindung;
  readonly skillDefinition: SkillDefinition;
  readonly skillEvidence: SkillLiveEvidence;
  readonly ziele: readonly MLuckZielEvidence[];
  readonly aktiveDemandZiele: readonly string[];
  readonly richtlinie: MLuckRichtlinie;
}

export type MLuckPlanungsArt =
  | "KEINE_AKTION"
  | "DEMAND_ERZEUGEN"
  | "BEOBACHTUNG_ERFORDERLICH"
  | "GESPERRT";

export interface MLuckPlanungsEntscheidung {
  readonly schemaVersion: 1;
  readonly art: MLuckPlanungsArt;
  readonly merchant: CharacterZielBindung;
  readonly ziel: MLuckZielEvidence | null;
  readonly grund: string;
  readonly skillNachweis: SkillCapabilityNachweis;
  readonly prioritaetsKlasse: "OPTIMIERUNG";
  readonly prioritaetsRang: number;
  readonly richtlinienVersion: string;
  readonly planungsNachweis: true;
  readonly ausfuehrungsAutoritaet: false;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

export interface MLuckDemandAnfrage {
  readonly demandId: string;
  readonly erstelltAmMs: number;
  readonly deadlineAmMs: number;
  readonly ressourcenIds: readonly string[];
  readonly wissensSnapshot: WissensSnapshotPin;
}

export interface MLuckSettlementEvidence {
  readonly schemaVersion: 1;
  readonly ziel: CharacterZielBindung;
  readonly beobachtetAmMs: number;
  readonly gueltigBisMs: number;
  readonly wirkungAktiv: boolean;
  readonly wirkungVerbleibendMs: number | null;
  readonly wirkungFingerprint: string;
}

export interface MLuckSettlementNachweis {
  readonly schemaVersion: 1;
  readonly bestaetigt: true;
  readonly zielCharacterId: string;
  readonly zielSessionId: string;
  readonly wirkungFingerprint: string;
  readonly beobachtetAmMs: number;
  readonly ausfuehrungsAutoritaet: false;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
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

function pruefeBindung(
  bindung: CharacterZielBindung,
  fehler: string,
): void {
  if (bindung.schemaVersion !== 1
      || !Number.isSafeInteger(bindung.rosterEpoche)
      || bindung.rosterEpoche < 1) {
    throw new Error(fehler);
  }
  for (const text of [
    bindung.accountId,
    bindung.characterId,
    bindung.sessionId,
    bindung.serverRegion,
    bindung.serverIdentifier,
    bindung.rosterFingerprint,
  ]) {
    pruefeText(text, fehler);
  }
}

function gleicheRosterWahrheit(
  a: CharacterZielBindung,
  b: CharacterZielBindung,
): boolean {
  return a.accountId === b.accountId
    && a.serverRegion === b.serverRegion
    && a.serverIdentifier === b.serverIdentifier
    && a.rosterEpoche === b.rosterEpoche
    && a.rosterFingerprint === b.rosterFingerprint;
}

function gleicheZielBindung(
  a: CharacterZielBindung,
  b: CharacterZielBindung,
): boolean {
  return gleicheRosterWahrheit(a, b)
    && a.characterId === b.characterId
    && a.sessionId === b.sessionId;
}

function kompakteKennung(prefix: string, text: string): string {
  let checksum = 0;
  for (let index = 0; index < text.length; index += 1) {
    checksum = (checksum * 131 + text.charCodeAt(index)) % 2_147_483_647;
  }
  return prefix + ":" + String(text.length) + ":" + String(checksum);
}

function friereBindung(
  bindung: CharacterZielBindung,
): CharacterZielBindung {
  return Object.freeze({ ...bindung });
}

function friereZiel(
  ziel: MLuckZielEvidence,
): MLuckZielEvidence {
  return Object.freeze({
    ...ziel,
    ziel: friereBindung(ziel.ziel),
  });
}

function validiereRichtlinie(richtlinie: MLuckRichtlinie): void {
  pruefeText(
    richtlinie.richtlinienVersion,
    "MLUCK_RICHTLINIE_UNGUELTIG",
  );
  pruefeGanzzahl(
    richtlinie.refreshVorlaufMs,
    1_000,
    3_600_000,
    "MLUCK_REFRESH_VORLAUF_UNGUELTIG",
  );
  pruefeGanzzahl(
    richtlinie.maximalesZielAlterMs,
    1,
    60_000,
    "MLUCK_ZIELALTER_UNGUELTIG",
  );
  pruefeGanzzahl(
    richtlinie.maximalesSkillEvidenceAlterMs,
    1,
    60_000,
    "MLUCK_SKILLALTER_UNGUELTIG",
  );
  pruefeGanzzahl(
    richtlinie.servicePrioritaetsRang,
    0,
    1_000_000,
    "MLUCK_PRIORITAET_UNGUELTIG",
  );
}

function validiereZiele(
  anfrage: MLuckPlanungsAnfrage,
): void {
  if (anfrage.ziele.length > 32) {
    throw new Error("MLUCK_ZIELE_ZU_GROSS");
  }
  if (anfrage.aktiveDemandZiele.length > 32) {
    throw new Error("MLUCK_AKTIVE_DEMANDS_ZU_GROSS");
  }
  for (let index = 0; index < anfrage.aktiveDemandZiele.length; index += 1) {
    const zielId = anfrage.aktiveDemandZiele[index];
    if (zielId === undefined) throw new Error("MLUCK_AKTIVES_ZIEL_FEHLT");
    pruefeText(zielId, "MLUCK_AKTIVES_ZIEL_UNGUELTIG");
    if (anfrage.aktiveDemandZiele.slice(0, index).some(x => x === zielId)) {
      throw new Error("MLUCK_AKTIVES_ZIEL_DOPPELT");
    }
  }

  for (let index = 0; index < anfrage.ziele.length; index += 1) {
    const ziel = anfrage.ziele[index];
    if (ziel === undefined) throw new Error("MLUCK_ZIEL_FEHLT");
    if (ziel.schemaVersion !== 1) throw new Error("MLUCK_ZIEL_SCHEMA_UNGUELTIG");
    pruefeBindung(ziel.ziel, "MLUCK_ZIEL_BINDUNG_UNGUELTIG");
    if (!gleicheRosterWahrheit(anfrage.merchant, ziel.ziel)) {
      throw new Error("MLUCK_ZIEL_ROSTER_DRIFT");
    }
    pruefeGanzzahl(
      ziel.topologieRang,
      0,
      1_000,
      "MLUCK_TOPOLOGIE_RANG_UNGUELTIG",
    );
    pruefeGanzzahl(
      ziel.beobachtetAmMs,
      0,
      Number.MAX_SAFE_INTEGER,
      "MLUCK_ZIEL_ZEIT_UNGUELTIG",
    );
    pruefeGanzzahl(
      ziel.gueltigBisMs,
      ziel.beobachtetAmMs,
      Number.MAX_SAFE_INTEGER,
      "MLUCK_ZIEL_GUELTIGKEIT_UNGUELTIG",
    );
    pruefeText(
      ziel.wirkungFingerprint,
      "MLUCK_WIRKUNG_FINGERPRINT_UNGUELTIG",
    );
    if (ziel.wirkungVerbleibendMs !== null) {
      pruefeGanzzahl(
        ziel.wirkungVerbleibendMs,
        0,
        86_400_000,
        "MLUCK_WIRKUNG_RESTZEIT_UNGUELTIG",
      );
    }
    if (ziel.naechsterVersuchAbMs !== null) {
      pruefeGanzzahl(
        ziel.naechsterVersuchAbMs,
        0,
        Number.MAX_SAFE_INTEGER,
        "MLUCK_ANTISPAM_ZEIT_UNGUELTIG",
      );
    }
    if (anfrage.ziele.slice(0, index).some(
      x => x.ziel.characterId === ziel.ziel.characterId,
    )) {
      throw new Error("MLUCK_ZIEL_CHARACTER_DOPPELT");
    }
  }
}

function skillGrund(nachweis: SkillCapabilityNachweis): string {
  return nachweis.grund === null
    ? "MLUCK_SKILL_UNBEKANNT"
    : "MLUCK_SKILL_" + nachweis.grund;
}

function istFrisch(
  ziel: MLuckZielEvidence,
  jetztMs: number,
  maximalAlterMs: number,
): boolean {
  return jetztMs >= ziel.beobachtetAmMs
    && jetztMs <= ziel.gueltigBisMs
    && jetztMs - ziel.beobachtetAmMs <= maximalAlterMs;
}

function benoetigtMluck(
  ziel: MLuckZielEvidence,
  refreshVorlaufMs: number,
): boolean {
  return !ziel.wirkungAktiv
    || (ziel.wirkungVerbleibendMs !== null
      && ziel.wirkungVerbleibendMs <= refreshVorlaufMs);
}

function istFehlend(ziel: MLuckZielEvidence): boolean {
  return !ziel.wirkungAktiv;
}

function istEligible(
  ziel: MLuckZielEvidence,
  jetztMs: number,
  aktiveDemandZiele: readonly string[],
): boolean {
  return !ziel.tot
    && ziel.erreichbar
    && ziel.inReichweite
    && (ziel.naechsterVersuchAbMs === null
      || jetztMs >= ziel.naechsterVersuchAbMs)
    && !aktiveDemandZiele.includes(ziel.ziel.characterId);
}

function baueEntscheidung(
  anfrage: MLuckPlanungsAnfrage,
  art: MLuckPlanungsArt,
  ziel: MLuckZielEvidence | null,
  grund: string,
  skillNachweis: SkillCapabilityNachweis,
): MLuckPlanungsEntscheidung {
  return Object.freeze({
    schemaVersion: 1,
    art,
    merchant: friereBindung(anfrage.merchant),
    ziel: ziel === null ? null : friereZiel(ziel),
    grund,
    skillNachweis: Object.freeze({ ...skillNachweis }),
    prioritaetsKlasse: "OPTIMIERUNG",
    prioritaetsRang: anfrage.richtlinie.servicePrioritaetsRang,
    richtlinienVersion: anfrage.richtlinie.richtlinienVersion,
    planungsNachweis: true,
    ausfuehrungsAutoritaet: false,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
  });
}

export function planeMLuckService(
  anfrage: MLuckPlanungsAnfrage,
  jetztMs: number,
): MLuckPlanungsEntscheidung {
  validiereRichtlinie(anfrage.richtlinie);
  pruefeBindung(anfrage.merchant, "MLUCK_MERCHANT_BINDUNG_UNGUELTIG");
  pruefeGanzzahl(
    jetztMs,
    0,
    Number.MAX_SAFE_INTEGER,
    "MLUCK_ZEIT_UNGUELTIG",
  );
  if (anfrage.skillDefinition.skillId !== "mluck"
      || anfrage.skillDefinition.hostile) {
    throw new Error("MLUCK_SKILL_DEFINITION_UNGUELTIG");
  }
  validiereZiele(anfrage);

  const skillNachweis = pruefeSkillCapability(
    anfrage.skillDefinition,
    anfrage.skillEvidence,
    anfrage.merchant,
    jetztMs,
    anfrage.richtlinie.maximalesSkillEvidenceAlterMs,
  );
  if (!skillNachweis.nutzbar) {
    return baueEntscheidung(
      anfrage,
      "GESPERRT",
      null,
      skillGrund(skillNachweis),
      skillNachweis,
    );
  }
  if (anfrage.ziele.length === 0) {
    return baueEntscheidung(
      anfrage,
      "KEINE_AKTION",
      null,
      "MLUCK_KEINE_ZIELE",
      skillNachweis,
    );
  }

  const frisch = anfrage.ziele.filter(
    x => istFrisch(
      x,
      jetztMs,
      anfrage.richtlinie.maximalesZielAlterMs,
    ),
  );
  const bedarf = frisch.filter(
    x => benoetigtMluck(
      x,
      anfrage.richtlinie.refreshVorlaufMs,
    ),
  );
  const eligible = bedarf
    .filter(x => istEligible(
      x,
      jetztMs,
      anfrage.aktiveDemandZiele,
    ))
    .sort((a, b) => {
      if (istFehlend(a) !== istFehlend(b)) {
        return istFehlend(a) ? -1 : 1;
      }
      const aRest = a.wirkungVerbleibendMs ?? Number.MAX_SAFE_INTEGER;
      const bRest = b.wirkungVerbleibendMs ?? Number.MAX_SAFE_INTEGER;
      return aRest - bRest
        || a.topologieRang - b.topologieRang
        || a.ziel.characterId.localeCompare(b.ziel.characterId);
    });

  const ausgewaehlt = eligible[0] ?? null;
  if (ausgewaehlt !== null) {
    return baueEntscheidung(
      anfrage,
      "DEMAND_ERZEUGEN",
      ausgewaehlt,
      istFehlend(ausgewaehlt)
        ? "MLUCK_FEHLT"
        : "MLUCK_LAEUFT_BALD_AB",
      skillNachweis,
    );
  }

  if (anfrage.ziele.some(
    x => !istFrisch(
      x,
      jetztMs,
      anfrage.richtlinie.maximalesZielAlterMs,
    ),
  )) {
    return baueEntscheidung(
      anfrage,
      "BEOBACHTUNG_ERFORDERLICH",
      null,
      "MLUCK_ZIEL_EVIDENCE_STALE",
      skillNachweis,
    );
  }
  if (frisch.some(
    x => x.wirkungAktiv && x.wirkungVerbleibendMs === null,
  )) {
    return baueEntscheidung(
      anfrage,
      "BEOBACHTUNG_ERFORDERLICH",
      null,
      "MLUCK_ABLAUF_UNBEKANNT",
      skillNachweis,
    );
  }
  if (bedarf.some(
    x => anfrage.aktiveDemandZiele.includes(x.ziel.characterId),
  )) {
    return baueEntscheidung(
      anfrage,
      "KEINE_AKTION",
      null,
      "MLUCK_DEMAND_BEREITS_AKTIV",
      skillNachweis,
    );
  }
  if (bedarf.some(
    x => x.naechsterVersuchAbMs !== null
      && jetztMs < x.naechsterVersuchAbMs,
  )) {
    return baueEntscheidung(
      anfrage,
      "KEINE_AKTION",
      null,
      "MLUCK_ANTISPAM_AKTIV",
      skillNachweis,
    );
  }
  if (bedarf.some(x => !x.tot && x.erreichbar && !x.inReichweite)) {
    return baueEntscheidung(
      anfrage,
      "KEINE_AKTION",
      null,
      "MLUCK_ZIEL_AUSSER_REICHWEITE",
      skillNachweis,
    );
  }
  if (bedarf.some(x => !x.tot && !x.erreichbar)) {
    return baueEntscheidung(
      anfrage,
      "KEINE_AKTION",
      null,
      "MLUCK_ZIEL_NICHT_ERREICHBAR",
      skillNachweis,
    );
  }
  if (bedarf.length > 0) {
    return baueEntscheidung(
      anfrage,
      "KEINE_AKTION",
      null,
      "MLUCK_KEIN_ELIGIBLES_ZIEL",
      skillNachweis,
    );
  }

  return baueEntscheidung(
    anfrage,
    "KEINE_AKTION",
    null,
    "MLUCK_ALLE_WIRKUNGEN_GESUND",
    skillNachweis,
  );
}

export function erzeugeMLuckDemand(
  entscheidung: MLuckPlanungsEntscheidung,
  anfrage: MLuckDemandAnfrage,
): MerchantDemand | null {
  if (entscheidung.art !== "DEMAND_ERZEUGEN"
      || entscheidung.ziel === null) {
    return null;
  }
  pruefeText(anfrage.demandId, "MLUCK_DEMAND_ID_UNGUELTIG");
  pruefeGanzzahl(
    anfrage.erstelltAmMs,
    0,
    Number.MAX_SAFE_INTEGER,
    "MLUCK_DEMAND_ZEIT_UNGUELTIG",
  );
  pruefeGanzzahl(
    anfrage.deadlineAmMs,
    anfrage.erstelltAmMs,
    Number.MAX_SAFE_INTEGER,
    "MLUCK_DEMAND_DEADLINE_UNGUELTIG",
  );
  if (anfrage.ressourcenIds.length > 60) {
    throw new Error("MLUCK_DEMAND_ZU_VIELE_RESSOURCEN");
  }

  const ziel = entscheidung.ziel.ziel;
  const serviceRessourcen = [
    kompakteKennung(
      "mluck-skill",
      entscheidung.merchant.characterId,
    ),
    kompakteKennung(
      "mluck-ziel",
      [
        ziel.characterId,
        ziel.sessionId,
        String(ziel.rosterEpoche),
      ].join("|"),
    ),
  ];
  const ressourcenIds = Object.freeze(
    [...anfrage.ressourcenIds, ...serviceRessourcen]
      .sort()
      .filter((x, index, alle) => index === 0 || x !== alle[index - 1]),
  );

  return Object.freeze({
    schemaVersion: 1,
    demandId: anfrage.demandId,
    art: "MLUCK_SERVICE",
    characterId: entscheidung.merchant.characterId,
    accountId: null,
    erstelltAmMs: anfrage.erstelltAmMs,
    deadlineAmMs: anfrage.deadlineAmMs,
    prioritaetsKlasse: "OPTIMIERUNG",
    prioritaetsRang: entscheidung.prioritaetsRang,
    ressourcenIds,
    payloadFingerprint: kompakteKennung(
      "mluck-demand",
      [
        ziel.characterId,
        ziel.sessionId,
        ziel.rosterFingerprint,
        entscheidung.ziel.wirkungFingerprint,
        entscheidung.skillNachweis.evidenceFingerprint,
        entscheidung.richtlinienVersion,
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

export function verifiziereMLuckSettlement(
  entscheidung: MLuckPlanungsEntscheidung,
  evidence: MLuckSettlementEvidence,
  jetztMs: number,
): MLuckSettlementNachweis {
  if (entscheidung.art !== "DEMAND_ERZEUGEN"
      || entscheidung.ziel === null) {
    throw new Error("MLUCK_SETTLEMENT_OHNE_AUFTRAG");
  }
  if (evidence.schemaVersion !== 1) {
    throw new Error("MLUCK_SETTLEMENT_SCHEMA_UNGUELTIG");
  }
  pruefeBindung(evidence.ziel, "MLUCK_SETTLEMENT_ZIEL_UNGUELTIG");
  if (!gleicheZielBindung(
    entscheidung.ziel.ziel,
    evidence.ziel,
  )) {
    throw new Error("MLUCK_SETTLEMENT_ZIEL_DRIFT");
  }
  pruefeGanzzahl(
    evidence.beobachtetAmMs,
    0,
    Number.MAX_SAFE_INTEGER,
    "MLUCK_SETTLEMENT_ZEIT_UNGUELTIG",
  );
  pruefeGanzzahl(
    evidence.gueltigBisMs,
    evidence.beobachtetAmMs,
    Number.MAX_SAFE_INTEGER,
    "MLUCK_SETTLEMENT_GUELTIGKEIT_UNGUELTIG",
  );
  if (jetztMs < evidence.beobachtetAmMs
      || jetztMs > evidence.gueltigBisMs) {
    throw new Error("MLUCK_SETTLEMENT_EVIDENCE_STALE");
  }
  pruefeText(
    evidence.wirkungFingerprint,
    "MLUCK_SETTLEMENT_FINGERPRINT_UNGUELTIG",
  );
  if (!evidence.wirkungAktiv) {
    throw new Error("MLUCK_SETTLEMENT_WIRKUNG_FEHLT");
  }
  if (evidence.wirkungVerbleibendMs !== null) {
    pruefeGanzzahl(
      evidence.wirkungVerbleibendMs,
      1,
      86_400_000,
      "MLUCK_SETTLEMENT_RESTZEIT_UNGUELTIG",
    );
  }

  return Object.freeze({
    schemaVersion: 1,
    bestaetigt: true,
    zielCharacterId: evidence.ziel.characterId,
    zielSessionId: evidence.ziel.sessionId,
    wirkungFingerprint: evidence.wirkungFingerprint,
    beobachtetAmMs: evidence.beobachtetAmMs,
    ausfuehrungsAutoritaet: false,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
  });
}
