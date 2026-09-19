import type {
  CapabilityGruppenwahlEingabe,
  CapabilityGruppenwahlEntscheidung,
  CapabilityGruppenwahlSnapshotQuelle,
  CapabilityKoordinationsAutoritaet,
  CapabilityAufgabenBewertung,
  CapabilityAufgabenEntscheidung,
  CapabilityLeaderBewertung
} from '../vertraege/capability-gruppenwahl.js';
import type { CapabilitySyncSnapshot } from '../vertraege/capability-sync.js';
import {
  GRUPPEN_FAEHIGKEITEN,
  type GruppenAufgabenZuordnung,
  type GruppenFaehigkeit,
  type GruppenTeilnehmerMeldung
} from '../vertraege/gruppen-koordination.js';
import type { SkillCapabilityTag } from '../vertraege/skill-katalog.js';
import { GRUPPEN_CAPABILITY_TAGS } from './charakter-faehigkeiten.js';

const SICHERHEITS_RANG = Object.freeze({
  sicher: 2,
  angespannt: 1,
  gefaehrlich: 0,
  kritisch: 0,
  unbekannt: 0
} as const);

interface TeilnehmerKontext {
  readonly snapshot: CapabilitySyncSnapshot;
  readonly lebensnachweis: GruppenTeilnehmerMeldung;
  readonly lebensnachweisAlterMillisekunden: number;
  readonly autoritaet: CapabilityKoordinationsAutoritaet;
  readonly quelle: CapabilityGruppenwahlSnapshotQuelle['quelle'];
}

function leereAufgabe(faehigkeit: GruppenFaehigkeit): CapabilityAufgabenEntscheidung {
  return Object.freeze({
    faehigkeit,
    charakterKennung: null,
    charakterName: null,
    grund: 'Keine capability-basierte Aufgabenwahl freigegeben.',
    kandidaten: Object.freeze([])
  });
}

function leereAufgaben(): Readonly<Record<GruppenFaehigkeit, CapabilityAufgabenEntscheidung>> {
  return Object.freeze({
    heilen: leereAufgabe('heilen'),
    schaden: leereAufgabe('schaden'),
    aggro: leereAufgabe('aggro'),
    schutz: leereAufgabe('schutz'),
    unterstuetzung: leereAufgabe('unterstuetzung')
  });
}

function zuordnungAusAufgaben(
  aufgaben: Readonly<Record<GruppenFaehigkeit, CapabilityAufgabenEntscheidung>>
): GruppenAufgabenZuordnung {
  return Object.freeze(Object.fromEntries(
    GRUPPEN_FAEHIGKEITEN.map((faehigkeit) => [faehigkeit, aufgaben[faehigkeit].charakterKennung])
  ) as Record<GruppenFaehigkeit, string | null>);
}

function verdichteLebensnachweise(
  meldungen: readonly GruppenTeilnehmerMeldung[]
): ReadonlyMap<string, GruppenTeilnehmerMeldung> {
  const sortiert = [...meldungen].sort((a, b) => {
    const kennung = a.charakterKennung.localeCompare(b.charakterKennung);
    if (kennung !== 0) return kennung;
    if (a.gesendetAm !== b.gesendetAm) return b.gesendetAm - a.gesendetAm;
    return b.laufendeNummer - a.laufendeNummer;
  });
  const result = new Map<string, GruppenTeilnehmerMeldung>();
  for (const meldung of sortiert) {
    if (!result.has(meldung.charakterKennung)) result.set(meldung.charakterKennung, meldung);
  }
  return result;
}

function autoritaetNachKennung(
  autoritaeten: readonly CapabilityKoordinationsAutoritaet[]
): ReadonlyMap<string, CapabilityKoordinationsAutoritaet | null> {
  const result = new Map<string, CapabilityKoordinationsAutoritaet | null>();
  for (const autoritaet of autoritaeten) {
    const kennung = autoritaet.charakterKennung.trim();
    if (kennung.length === 0) continue;
    if (result.has(kennung)) {
      result.set(kennung, null);
      continue;
    }
    result.set(kennung, Object.freeze({
      charakterKennung: kennung,
      gruppenKoordinationErlaubt: autoritaet.gruppenKoordinationErlaubt === true,
      grund: autoritaet.grund
    }));
  }
  return result;
}

function remoteSnapshotNachKennung(
  eingabe: CapabilityGruppenwahlEingabe
): ReadonlyMap<string, CapabilitySyncSnapshot | null> {
  const result = new Map<string, CapabilitySyncSnapshot | null>();
  for (const pruefung of eingabe.remoteVertrauen) {
    const kennung = pruefung.charakterKennung.trim();
    if (kennung.length === 0) continue;
    if (result.has(kennung)) {
      result.set(kennung, null);
      continue;
    }
    result.set(
      kennung,
      pruefung.status === 'vertraut' && pruefung.snapshot !== null
        ? pruefung.snapshot
        : null
    );
  }
  return result;
}

function sicherheitsRang(meldung: GruppenTeilnehmerMeldung): number {
  return SICHERHEITS_RANG[meldung.gefahrenStufe] ?? 0;
}

function lebensAnteil(meldung: GruppenTeilnehmerMeldung): number {
  return typeof meldung.lebensAnteil === 'number' && Number.isFinite(meldung.lebensAnteil)
    ? Math.max(0, Math.min(1, meldung.lebensAnteil))
    : 0;
}

function relevanteSkills(
  snapshot: CapabilitySyncSnapshot,
  faehigkeit: GruppenFaehigkeit
): readonly CapabilitySyncSnapshot['skills'][number][] {
  const relevanteTags = GRUPPEN_CAPABILITY_TAGS[faehigkeit] as readonly SkillCapabilityTag[];
  return Object.freeze(
    snapshot.skills.filter((skill) =>
      skill.aktuellAutomatisierbar &&
      skill.enabled &&
      skill.configuredReady &&
      skill.capabilityTags.some((tag) => relevanteTags.includes(tag))
    )
  );
}

function maximaleZielKapazitaet(
  skills: readonly CapabilitySyncSnapshot['skills'][number][]
): number | null {
  const werte = skills
    .map((skill) => skill.zielKapazitaet)
    .filter((wert): wert is number => typeof wert === 'number' && Number.isFinite(wert) && wert > 0);
  return werte.length === 0 ? null : Math.max(...werte);
}

function vergleicheSafety(
  a: Readonly<{ lebensnachweis: GruppenTeilnehmerMeldung }>,
  b: Readonly<{ lebensnachweis: GruppenTeilnehmerMeldung }>
): number {
  const sicherheit = sicherheitsRang(b.lebensnachweis) - sicherheitsRang(a.lebensnachweis);
  if (sicherheit !== 0) return sicherheit;

  return lebensAnteil(b.lebensnachweis) - lebensAnteil(a.lebensnachweis);
}

function vergleicheFreshnessUndIdentitaet(
  a: Readonly<{
    lebensnachweisAlterMillisekunden: number;
    charakterKennung: string;
    charakterName: string;
  }>,
  b: Readonly<{
    lebensnachweisAlterMillisekunden: number;
    charakterKennung: string;
    charakterName: string;
  }>
): number {
  const freshness = a.lebensnachweisAlterMillisekunden - b.lebensnachweisAlterMillisekunden;
  if (freshness !== 0) return freshness;

  const kennung = a.charakterKennung.localeCompare(b.charakterKennung);
  if (kennung !== 0) return kennung;
  return a.charakterName.localeCompare(b.charakterName);
}

function baueTeilnehmerKontexte(
  eingabe: CapabilityGruppenwahlEingabe
): Readonly<{
  kontexte: readonly TeilnehmerKontext[];
  ausgeschlossen: readonly Readonly<{ charakterKennung: string; grund: string }>[];
}> {
  const aktiveKennungen = new Set(eingabe.basisEntscheidung.aktiveTeilnehmerKennungen);
  const bewertungNachKennung = new Map(
    eingabe.basisEntscheidung.teilnehmerBewertungen.map((bewertung) => [bewertung.charakterKennung, bewertung] as const)
  );
  const lebensnachweisNachKennung = verdichteLebensnachweise(eingabe.lebensnachweise);
  const autoritaeten = autoritaetNachKennung(eingabe.autoritaeten);
  const remote = remoteSnapshotNachKennung(eingabe);
  const kontexte: TeilnehmerKontext[] = [];
  const ausgeschlossen: Array<Readonly<{ charakterKennung: string; grund: string }>> = [];

  for (const charakterKennung of [...aktiveKennungen].sort((a, b) => a.localeCompare(b))) {
    const lebensnachweis = lebensnachweisNachKennung.get(charakterKennung);
    const bewertung = bewertungNachKennung.get(charakterKennung);
    const autoritaet = autoritaeten.get(charakterKennung);

    if (lebensnachweis === undefined || bewertung?.status !== 'aktiv') {
      ausgeschlossen.push(Object.freeze({
        charakterKennung,
        grund: 'Aktiver Block-8-Lebensnachweis oder aktive Bewertung fehlt.'
      }));
      continue;
    }
    if (autoritaet === undefined || autoritaet === null || !autoritaet.gruppenKoordinationErlaubt) {
      ausgeschlossen.push(Object.freeze({
        charakterKennung,
        grund:
          autoritaet === null
            ? 'Koordinationsautoritaet ist mehrdeutig.'
            : autoritaet?.grund || 'Explizite Koordinationsautoritaet fehlt oder ist nicht freigegeben.'
      }));
      continue;
    }

    let snapshot: CapabilitySyncSnapshot | null = null;
    let quelle: CapabilityGruppenwahlSnapshotQuelle['quelle'] = 'remote_vertraut';

    if (charakterKennung === eingabe.basisEntscheidung.eigenerTeilnehmerKennung) {
      snapshot = eingabe.lokalerSnapshot;
      quelle = 'lokal';
    } else {
      snapshot = remote.get(charakterKennung) ?? null;
    }

    if (snapshot === null) {
      ausgeschlossen.push(Object.freeze({
        charakterKennung,
        grund: 'Kein in Block 8.6.5 vertrauter Capability-Snapshot vorhanden.'
      }));
      continue;
    }
    if (
      snapshot.charakterKennung !== charakterKennung ||
      snapshot.charakterName !== lebensnachweis.charakterName ||
      snapshot.klasse.toLowerCase() !== lebensnachweis.klasse.toLowerCase()
    ) {
      ausgeschlossen.push(Object.freeze({
        charakterKennung,
        grund: 'Capability-Snapshot und Block-8-Lebensnachweis haben unterschiedliche Identitaeten.'
      }));
      continue;
    }
    if (
      snapshot.lebensnachweisGesendetAm !== lebensnachweis.gesendetAm ||
      snapshot.lebensnachweisLaufendeNummer !== lebensnachweis.laufendeNummer
    ) {
      ausgeschlossen.push(Object.freeze({
        charakterKennung,
        grund: 'Capability-Snapshot ist nicht an den aktuell aktiven Block-8-Lebensnachweis gebunden.'
      }));
      continue;
    }

    kontexte.push(Object.freeze({
      snapshot,
      lebensnachweis,
      lebensnachweisAlterMillisekunden: bewertung.alterMillisekunden,
      autoritaet,
      quelle
    }));
  }

  return Object.freeze({
    kontexte: Object.freeze(kontexte),
    ausgeschlossen: Object.freeze(ausgeschlossen)
  });
}

function waehleAufgabe(
  faehigkeit: GruppenFaehigkeit,
  kontexte: readonly TeilnehmerKontext[]
): CapabilityAufgabenEntscheidung {
  const kandidaten = kontexte
    .map((kontext): CapabilityAufgabenBewertung | null => {
      const skills = relevanteSkills(kontext.snapshot, faehigkeit);
      if (skills.length === 0) return null;
      return Object.freeze({
        charakterKennung: kontext.snapshot.charakterKennung,
        charakterName: kontext.snapshot.charakterName,
        faehigkeit,
        relevanteSkills: Object.freeze(skills.map((skill) => skill.skillId).sort((a, b) => a.localeCompare(b))),
        relevanteSkillAnzahl: skills.length,
        maximaleZielKapazitaet: maximaleZielKapazitaet(skills),
        lebensAnteil: kontext.lebensnachweis.lebensAnteil,
        lebensnachweisAlterMillisekunden: kontext.lebensnachweisAlterMillisekunden,
        grund: 'Kandidat besitzt mindestens einen aktuell automatisierbaren, zur Aufgabe passenden Skill.'
      });
    })
    .filter((kandidat): kandidat is CapabilityAufgabenBewertung => kandidat !== null)
    .sort((a, b) => {
      const kontextA = kontexte.find((k) => k.snapshot.charakterKennung === a.charakterKennung)!;
      const kontextB = kontexte.find((k) => k.snapshot.charakterKennung === b.charakterKennung)!;

      const safety = vergleicheSafety(
        { lebensnachweis: kontextA.lebensnachweis },
        { lebensnachweis: kontextB.lebensnachweis }
      );
      if (safety !== 0) return safety;

      const skillAnzahl = b.relevanteSkillAnzahl - a.relevanteSkillAnzahl;
      if (skillAnzahl !== 0) return skillAnzahl;

      const kapazitaet = (b.maximaleZielKapazitaet ?? 0) - (a.maximaleZielKapazitaet ?? 0);
      if (kapazitaet !== 0) return kapazitaet;

      return vergleicheFreshnessUndIdentitaet(a, b);
    });

  const gewinner = kandidaten[0];
  return Object.freeze({
    faehigkeit,
    charakterKennung: gewinner?.charakterKennung ?? null,
    charakterName: gewinner?.charakterName ?? null,
    grund:
      gewinner === undefined
        ? 'Kein autorisierter Teilnehmer besitzt eine vertraute aktuell automatisierbare Capability fuer diese Aufgabe.'
        : 'Auswahl erfolgt deterministisch nach Safety, Lebensanteil, Freshness, Capability-Readiness und erst danach Identitaets-Tie-Breakern.',
    kandidaten: Object.freeze(kandidaten)
  });
}

function waehleLeader(kontexte: readonly TeilnehmerKontext[]): Readonly<{
  leaderKennung: string | null;
  leaderName: string | null;
  leaderGrund: string;
  kandidaten: readonly CapabilityLeaderBewertung[];
}> {
  const kandidaten = kontexte
    .map((kontext): CapabilityLeaderBewertung | null => {
      const aufgabenAbdeckung = GRUPPEN_FAEHIGKEITEN.filter(
        (faehigkeit) => relevanteSkills(kontext.snapshot, faehigkeit).length > 0
      ).length;
      const aktuellAutomatisierbareSkills = kontext.snapshot.skills.filter(
        (skill) => skill.aktuellAutomatisierbar && skill.enabled && skill.configuredReady
      );
      if (aufgabenAbdeckung === 0 || aktuellAutomatisierbareSkills.length === 0) return null;

      return Object.freeze({
        charakterKennung: kontext.snapshot.charakterKennung,
        charakterName: kontext.snapshot.charakterName,
        aufgabenAbdeckung,
        aktuellAutomatisierbareSkills: aktuellAutomatisierbareSkills.length,
        maximaleZielKapazitaet: maximaleZielKapazitaet(aktuellAutomatisierbareSkills),
        lebensAnteil: kontext.lebensnachweis.lebensAnteil,
        lebensnachweisAlterMillisekunden: kontext.lebensnachweisAlterMillisekunden,
        grund: 'Kandidat besitzt explizite Koordinationsautoritaet und mindestens eine vertraute aktuell automatisierbare Capability.'
      });
    })
    .filter((kandidat): kandidat is CapabilityLeaderBewertung => kandidat !== null)
    .sort((a, b) => {
      const kontextA = kontexte.find((k) => k.snapshot.charakterKennung === a.charakterKennung)!;
      const kontextB = kontexte.find((k) => k.snapshot.charakterKennung === b.charakterKennung)!;

      const safety = vergleicheSafety(
        { lebensnachweis: kontextA.lebensnachweis },
        { lebensnachweis: kontextB.lebensnachweis }
      );
      if (safety !== 0) return safety;

      const abdeckung = b.aufgabenAbdeckung - a.aufgabenAbdeckung;
      if (abdeckung !== 0) return abdeckung;

      const skills = b.aktuellAutomatisierbareSkills - a.aktuellAutomatisierbareSkills;
      if (skills !== 0) return skills;

      const kapazitaet = (b.maximaleZielKapazitaet ?? 0) - (a.maximaleZielKapazitaet ?? 0);
      if (kapazitaet !== 0) return kapazitaet;

      return vergleicheFreshnessUndIdentitaet(a, b);
    });

  const gewinner = kandidaten[0];
  return Object.freeze({
    leaderKennung: gewinner?.charakterKennung ?? null,
    leaderName: gewinner?.charakterName ?? null,
    leaderGrund:
      gewinner === undefined
        ? 'Kein autorisierter Teilnehmer besitzt eine vertraute aktuell automatisierbare Capability.'
        : 'Leader-Auswahl erfolgt deterministisch nach Safety, Lebensanteil, Freshness und realer Capability-Abdeckung; Klasse und Level sind keine Rangmerkmale.',
    kandidaten: Object.freeze(kandidaten)
  });
}

export function waehleCapabilityBasierteGruppenrollen(
  eingabe: CapabilityGruppenwahlEingabe
): CapabilityGruppenwahlEntscheidung {
  const basis = eingabe.basisEntscheidung;
  if (!Number.isFinite(basis.zeitpunkt)) {
    throw new Error('Basis-Gruppenentscheidung benoetigt einen endlichen Zeitpunkt.');
  }

  if (basis.betriebsArt !== 'normal') {
    const aufgaben = leereAufgaben();
    return Object.freeze({
      schemaVersion: 1,
      zeitpunkt: basis.zeitpunkt,
      eigenerTeilnehmerKennung: basis.eigenerTeilnehmerKennung,
      betriebsArt: basis.betriebsArt,
      grund: 'Capability-basierte normale Rollenwahl bleibt ausserhalb des normalen Block-8-Betriebs fail-closed.',
      leaderKennung: null,
      leaderName: null,
      leaderGrund: 'Safety-/Blockierbetrieb besitzt Vorrang; normaler Capability-Leader wird nicht gewaehlt.',
      leaderKandidaten: Object.freeze([]),
      aufgaben,
      aufgabenZuordnung: zuordnungAusAufgaben(aufgaben),
      vertrauteTeilnehmerKennungen: Object.freeze([]),
      ausgeschlosseneTeilnehmer: Object.freeze([]),
      aktionsAutoritaet: false as const
    });
  }

  const { kontexte, ausgeschlossen } = baueTeilnehmerKontexte(eingabe);
  const aufgaben = Object.freeze(Object.fromEntries(
    GRUPPEN_FAEHIGKEITEN.map((faehigkeit) => [faehigkeit, waehleAufgabe(faehigkeit, kontexte)])
  ) as Record<GruppenFaehigkeit, CapabilityAufgabenEntscheidung>);
  const leader = waehleLeader(kontexte);

  return Object.freeze({
    schemaVersion: 1,
    zeitpunkt: basis.zeitpunkt,
    eigenerTeilnehmerKennung: basis.eigenerTeilnehmerKennung,
    betriebsArt: basis.betriebsArt,
    grund:
      kontexte.length === 0
        ? 'Keine vertrauten, aktiven und explizit fuer Gruppenkoordination autorisierten Capability-Snapshots vorhanden.'
        : 'Rollen werden aus Block-8-Safety/Liveness plus vertrauten Block-8.6-Capabilities deterministisch abgeleitet.',
    leaderKennung: leader.leaderKennung,
    leaderName: leader.leaderName,
    leaderGrund: leader.leaderGrund,
    leaderKandidaten: leader.kandidaten,
    aufgaben,
    aufgabenZuordnung: zuordnungAusAufgaben(aufgaben),
    vertrauteTeilnehmerKennungen: Object.freeze(
      kontexte.map((kontext) => kontext.snapshot.charakterKennung).sort((a, b) => a.localeCompare(b))
    ),
    ausgeschlosseneTeilnehmer: ausgeschlossen,
    aktionsAutoritaet: false as const
  });
}
