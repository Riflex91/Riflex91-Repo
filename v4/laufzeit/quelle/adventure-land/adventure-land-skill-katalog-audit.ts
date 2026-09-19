import { AdventureLandLesezugriff } from './adventure-land-lesezugriff.js';
import type {
  AdventureLandDatenQuelle,
  AdventureLandRohdaten,
  GelesenerAdventureLandWert
} from './adventure-land-lesezugriff.js';
import { AdventureLandSkillKatalogLesequelle } from './adventure-land-skill-katalog.js';
import {
  SKILL_KATALOG_AUDIT_AUSLOESER,
  SKILL_KATALOG_AUDIT_SCHEMA_VERSION,
  type SkillKatalogAuditAusloeser,
  type SkillKatalogAuditIdentitaet,
  type SkillKatalogAuditKonfiguration,
  type SkillKatalogAuditStatus,
  type SkillKatalogAuditZeitgeber,
  type SkillKatalogRevalidierungsProfil
} from '../vertraege/skill-katalog-audit.js';

const STANDARD_AUDIT_INTERVALL_MILLIS = 30_000;
const MIN_AUDIT_INTERVALL_MILLIS = 1_000;
const MAX_AUDIT_INTERVALL_MILLIS = 300_000;

type RohObjekt = Readonly<Record<string, unknown>>;

function istObjekt(wert: unknown): wert is RohObjekt {
  return typeof wert === 'object' && wert !== null && !Array.isArray(wert);
}

function pruefeZeitpunkt(name: string, wert: number): void {
  if (!Number.isFinite(wert) || wert < 0) throw new Error(`${name} muss eine endliche, nichtnegative Zahl sein.`);
}

function text(wert: unknown): string | null {
  if (typeof wert !== 'string') return null;
  const normalisiert = wert.trim();
  return normalisiert.length > 0 ? normalisiert : null;
}

function kennung(wert: unknown): string | null {
  if (typeof wert === 'number' && Number.isFinite(wert)) return String(wert);
  return text(wert);
}

function stufe(wert: unknown): number | null {
  return typeof wert === 'number' && Number.isFinite(wert) && wert >= 0 ? wert : null;
}

function liesDirektenText(wert: GelesenerAdventureLandWert): string | null {
  if (wert.lesefehler !== null || !wert.vorhanden) return null;
  return text(wert.wert);
}

function liesCharakterObjekt(wert: GelesenerAdventureLandWert): RohObjekt | null {
  if (wert.lesefehler !== null || !wert.vorhanden || !istObjekt(wert.wert)) return null;
  return wert.wert;
}

function liesObjektWert(objekt: RohObjekt, name: string): unknown {
  try {
    return Reflect.get(objekt, name);
  } catch {
    return undefined;
  }
}

function liesIdentitaet(rohDaten: AdventureLandRohdaten): SkillKatalogAuditIdentitaet {
  const charakter = liesCharakterObjekt(rohDaten.charakter);
  return Object.freeze({
    charakterKennung: charakter === null ? null : kennung(liesObjektWert(charakter, 'id')),
    charakterName: charakter === null ? null : text(liesObjektWert(charakter, 'name')),
    klasse: charakter === null ? null : text(liesObjektWert(charakter, 'ctype')),
    stufe: charakter === null ? null : stufe(liesObjektWert(charakter, 'level')),
    serverRegion: liesDirektenText(rohDaten.serverRegion),
    serverKennung: liesDirektenText(rohDaten.serverKennung)
  });
}

function leereIdentitaet(): SkillKatalogAuditIdentitaet {
  return Object.freeze({
    charakterKennung: null,
    charakterName: null,
    klasse: null,
    stufe: null,
    serverRegion: null,
    serverKennung: null
  });
}

function identitaetVollstaendig(
  identitaet: SkillKatalogAuditIdentitaet
): identitaet is SkillKatalogAuditIdentitaet & Readonly<{
  charakterKennung: string;
  charakterName: string;
  klasse: string;
  stufe: number;
  serverRegion: string;
  serverKennung: string;
}> {
  return identitaet.charakterKennung !== null &&
    identitaet.charakterName !== null &&
    identitaet.klasse !== null &&
    identitaet.stufe !== null &&
    identitaet.serverRegion !== null &&
    identitaet.serverKennung !== null;
}

function verbindungsQuelleFehlt(wert: GelesenerAdventureLandWert): boolean {
  return wert.lesefehler !== null || !wert.vorhanden;
}

function hatConnectionGap(
  rohDaten: AdventureLandRohdaten,
  identitaet: SkillKatalogAuditIdentitaet
): boolean {
  return verbindungsQuelleFehlt(rohDaten.charakter) ||
    verbindungsQuelleFehlt(rohDaten.spielDaten) ||
    verbindungsQuelleFehlt(rohDaten.serverRegion) ||
    verbindungsQuelleFehlt(rohDaten.serverKennung) ||
    !identitaetVollstaendig(identitaet);
}

function sortiereAusloeser(werte: Iterable<SkillKatalogAuditAusloeser>): readonly SkillKatalogAuditAusloeser[] {
  const rang = new Map(SKILL_KATALOG_AUDIT_AUSLOESER.map((wert, index) => [wert, index] as const));
  return Object.freeze([...new Set(werte)].sort((links, rechts) =>
    (rang.get(links) ?? Number.MAX_SAFE_INTEGER) - (rang.get(rechts) ?? Number.MAX_SAFE_INTEGER)
  ));
}

function validiereProfil(profil: SkillKatalogRevalidierungsProfil): SkillKatalogRevalidierungsProfil {
  if (profil.schemaVersion !== SKILL_KATALOG_AUDIT_SCHEMA_VERSION) {
    throw new Error('Skill-Katalog-Revalidierungsprofil besitzt eine unbekannte schemaVersion.');
  }
  if (!/^[a-f0-9]{64}$/.test(profil.katalogFingerprint)) {
    throw new Error('Skill-Katalog-Revalidierungsprofil benoetigt einen gueltigen SHA-256-Fingerprint.');
  }
  if (!Number.isSafeInteger(profil.katalogGeneration) || profil.katalogGeneration <= 0) {
    throw new Error('katalogGeneration im Revalidierungsprofil muss eine positive ganze Zahl sein.');
  }
  for (const [name, wert] of [
    ['charakterKennung', profil.charakterKennung],
    ['serverRegion', profil.serverRegion],
    ['serverKennung', profil.serverKennung]
  ] as const) {
    if (wert.trim().length === 0) throw new Error(`${name} im Revalidierungsprofil darf nicht leer sein.`);
  }
  pruefeZeitpunkt('bestaetigtAm', profil.bestaetigtAm);
  if (profil.aktionsAutoritaet !== false) {
    throw new Error('Skill-Katalog-Revalidierungsprofil darf keine Aktionsautoritaet besitzen.');
  }
  return Object.freeze({ ...profil, aktionsAutoritaet: false as const });
}

export function erstelleSkillKatalogAuditKonfiguration(
  aenderungen: Partial<SkillKatalogAuditKonfiguration> = {}
): SkillKatalogAuditKonfiguration {
  const periodischesIntervallMillisekunden =
    aenderungen.periodischesIntervallMillisekunden ?? STANDARD_AUDIT_INTERVALL_MILLIS;
  if (
    !Number.isFinite(periodischesIntervallMillisekunden) ||
    periodischesIntervallMillisekunden < MIN_AUDIT_INTERVALL_MILLIS ||
    periodischesIntervallMillisekunden > MAX_AUDIT_INTERVALL_MILLIS
  ) {
    throw new Error(
      `periodischesIntervallMillisekunden muss zwischen ${MIN_AUDIT_INTERVALL_MILLIS} und ${MAX_AUDIT_INTERVALL_MILLIS} liegen.`
    );
  }
  return Object.freeze({ periodischesIntervallMillisekunden });
}

function waehleSpielFenster(spielFenster: object): object {
  try {
    if ('G' in spielFenster || 'character' in spielFenster) return spielFenster;
    const parent = Reflect.get(spielFenster, 'parent');
    if (istObjekt(parent) && parent !== spielFenster) return parent;
  } catch {
    // Direkter Kontext bleibt der fail-closed Fallback.
  }
  return spielFenster;
}

export class AdventureLandSkillKatalogAuditSteuerung {
  private readonly katalogQuelle: AdventureLandSkillKatalogLesequelle;
  private readonly konfiguration: SkillKatalogAuditKonfiguration;
  private gestartet = false;
  private auditNummer = 0;
  private letzterAuditAm: number | null = null;
  private letzterErfolgreicherAuditAm: number | null = null;
  private letzteAusloeser: readonly SkillKatalogAuditAusloeser[] = Object.freeze([]);
  private connectionGapAktiv = false;
  private identitaet: SkillKatalogAuditIdentitaet = leereIdentitaet();
  private revalidierungsProfil: SkillKatalogRevalidierungsProfil | null;
  private grund = 'Skill-Katalog-Audit wurde noch nicht gestartet.';
  private zeitgeber: SkillKatalogAuditZeitgeber | null = null;
  private intervallKennung: unknown = null;

  public constructor(
    private readonly datenQuelle: AdventureLandDatenQuelle,
    konfiguration: Partial<SkillKatalogAuditKonfiguration> = {},
    revalidierungsProfil: SkillKatalogRevalidierungsProfil | null = null
  ) {
    this.konfiguration = erstelleSkillKatalogAuditKonfiguration(konfiguration);
    this.katalogQuelle = new AdventureLandSkillKatalogLesequelle(datenQuelle);
    this.revalidierungsProfil = revalidierungsProfil === null ? null : validiereProfil(revalidierungsProfil);
  }

  public static fuerSpielFenster(
    spielFenster: object,
    konfiguration: Partial<SkillKatalogAuditKonfiguration> = {},
    revalidierungsProfil: SkillKatalogRevalidierungsProfil | null = null
  ): AdventureLandSkillKatalogAuditSteuerung {
    return new AdventureLandSkillKatalogAuditSteuerung(
      new AdventureLandLesezugriff(waehleSpielFenster(spielFenster)),
      konfiguration,
      revalidierungsProfil
    );
  }

  public starte(zeitgeber: SkillKatalogAuditZeitgeber): Readonly<SkillKatalogAuditStatus> {
    if (this.gestartet) return this.status();
    this.gestartet = true;
    this.zeitgeber = zeitgeber;
    const startStatus = this.pruefe(zeitgeber.jetzt(), 'runtime_start');
    try {
      this.intervallKennung = zeitgeber.setzeIntervall(() => {
        this.pruefe(zeitgeber.jetzt(), 'periodisch');
      }, this.konfiguration.periodischesIntervallMillisekunden);
    } catch (fehler) {
      this.gestartet = false;
      this.zeitgeber = null;
      const text = fehler instanceof Error ? fehler.message : String(fehler);
      throw new Error(`Periodischer Skill-Katalog-Audit konnte nicht installiert werden: ${text}`);
    }
    return startStatus;
  }

  public stoppe(): Readonly<SkillKatalogAuditStatus> {
    if (this.intervallKennung !== null && this.zeitgeber !== null) {
      this.zeitgeber.loescheIntervall(this.intervallKennung);
    }
    this.intervallKennung = null;
    this.zeitgeber = null;
    this.gestartet = false;
    return this.status();
  }

  public pruefe(
    zeitpunkt: number,
    basisAusloeser: 'runtime_start' | 'periodisch' = 'periodisch'
  ): Readonly<SkillKatalogAuditStatus> {
    pruefeZeitpunkt('Audit-Zeitpunkt', zeitpunkt);
    if (this.letzterAuditAm !== null && zeitpunkt < this.letzterAuditAm) {
      throw new Error('Audit-Zeitpunkt darf nicht vor dem letzten Audit liegen.');
    }

    const ausloeser = new Set<SkillKatalogAuditAusloeser>([basisAusloeser]);
    const vorherigeIdentitaet = this.identitaet;
    const vorherigerFingerprint = this.katalogQuelle.status().fingerprint;
    let rohDaten: AdventureLandRohdaten;

    try {
      rohDaten = this.datenQuelle.liesRohdaten();
    } catch (fehler) {
      const text = fehler instanceof Error ? fehler.message : String(fehler);
      ausloeser.add('connection_gap');
      this.connectionGapAktiv = true;
      this.katalogQuelle.markiereVeraltet(`Connection-Gap: Adventure-Land-Rohdaten konnten nicht gelesen werden: ${text}`);
      return this.schliesseAuditAb(
        zeitpunkt,
        ausloeser,
        false,
        'Connection-Gap erkannt; der letzte Skill-Katalog bleibt bis Recovery und Revalidierung veraltet.'
      );
    }

    const aktuelleIdentitaet = liesIdentitaet(rohDaten);
    if (hatConnectionGap(rohDaten, aktuelleIdentitaet)) {
      ausloeser.add('connection_gap');
      this.connectionGapAktiv = true;
      this.katalogQuelle.markiereVeraltet(
        'Connection-Gap: Charakter-, Server- oder G-Daten sind nicht vollstaendig und sicher beobachtbar.'
      );
      return this.schliesseAuditAb(
        zeitpunkt,
        ausloeser,
        false,
        'Connection-Gap erkannt; eine alte Capability-/Kataloggeneration darf nicht still weiterverwendet werden.'
      );
    }

    const recovery = this.connectionGapAktiv;
    if (recovery) {
      ausloeser.add('recovery');
      this.katalogQuelle.markiereVeraltet(
        'Recovery erkannt; der wieder beobachtete Skill-Katalog muss vor erneuter Produktionsbereitschaft revalidiert werden.'
      );
      this.connectionGapAktiv = false;
    }

    if (
      vorherigeIdentitaet.charakterKennung !== null &&
      vorherigeIdentitaet.charakterKennung !== aktuelleIdentitaet.charakterKennung
    ) {
      ausloeser.add('charakterwechsel');
      this.katalogQuelle.markiereVeraltet(
        'Charakterwechsel erkannt; der Skill-Katalog muss fuer die neue Charakteridentitaet revalidiert werden.'
      );
    }

    if (
      vorherigeIdentitaet.serverRegion !== null &&
      vorherigeIdentitaet.serverKennung !== null &&
      (
        vorherigeIdentitaet.serverRegion !== aktuelleIdentitaet.serverRegion ||
        vorherigeIdentitaet.serverKennung !== aktuelleIdentitaet.serverKennung
      )
    ) {
      ausloeser.add('serverwechsel');
      this.katalogQuelle.markiereVeraltet(
        'Serverwechsel erkannt; der Skill-Katalog muss fuer die neue Serveridentitaet revalidiert werden.'
      );
    }

    if (
      vorherigeIdentitaet.charakterKennung !== null &&
      vorherigeIdentitaet.charakterKennung === aktuelleIdentitaet.charakterKennung &&
      vorherigeIdentitaet.stufe !== null &&
      vorherigeIdentitaet.stufe !== aktuelleIdentitaet.stufe
    ) {
      ausloeser.add('levelaenderung');
    }

    this.identitaet = aktuelleIdentitaet;
    let katalog = this.katalogQuelle.liesKatalogAusRohdaten(rohDaten, zeitpunkt);

    if (
      vorherigerFingerprint !== null &&
      katalog.fingerprint !== null &&
      vorherigerFingerprint !== katalog.fingerprint
    ) {
      ausloeser.add('skill_drift');
    }

    const profil = this.revalidierungsProfil;
    if (profil !== null && katalog.fingerprint !== null) {
      if (profil.katalogFingerprint !== katalog.fingerprint) {
        katalog = this.katalogQuelle.markiereDrift(
          'Persistiertes Revalidierungsprofil passt nicht zum aktuell beobachteten Skill-Katalog-Fingerprint.'
        );
        ausloeser.add('skill_drift');
      } else if (
        profil.charakterKennung !== aktuelleIdentitaet.charakterKennung ||
        profil.serverRegion !== aktuelleIdentitaet.serverRegion ||
        profil.serverKennung !== aktuelleIdentitaet.serverKennung
      ) {
        katalog = this.katalogQuelle.markiereVeraltet(
          'Persistiertes Revalidierungsprofil gehoert zu einer anderen Charakter- oder Serveridentitaet.'
        );
      }
    }

    const erfolgreich = katalog.zustand !== 'blockiert';
    const grund = katalog.zustand === 'bereit'
      ? 'Skill-Katalog-Audit ist aktuell, identitaetsgebunden und ohne offene Revalidierung.'
      : katalog.grund ?? 'Skill-Katalog-Audit ist nicht produktionsbereit.';
    return this.schliesseAuditAb(zeitpunkt, ausloeser, erfolgreich, grund);
  }

  public bestaetigeAktuellenKatalog(
    erwarteterFingerprint: string,
    bestaetigtAm: number
  ): Readonly<SkillKatalogAuditStatus> {
    pruefeZeitpunkt('bestaetigtAm', bestaetigtAm);
    if (this.letzterAuditAm === null || bestaetigtAm < this.letzterAuditAm) {
      throw new Error('Revalidierung benoetigt einen aktuellen Audit und darf nicht vor diesem liegen.');
    }
    const identitaet = this.identitaet;
    if (this.connectionGapAktiv || !identitaetVollstaendig(identitaet)) {
      throw new Error('Revalidierung ist waehrend eines Connection-Gaps oder ohne vollstaendige Identitaet nicht erlaubt.');
    }

    const katalog = this.katalogQuelle.bestaetigeAktuellenFingerprint(erwarteterFingerprint);
    if (katalog.fingerprint === null || katalog.zustand !== 'bereit') {
      throw new Error('Revalidierung konnte keinen bereiten Skill-Katalog herstellen.');
    }
    this.revalidierungsProfil = Object.freeze({
      schemaVersion: SKILL_KATALOG_AUDIT_SCHEMA_VERSION,
      katalogFingerprint: katalog.fingerprint,
      katalogGeneration: katalog.generation,
      charakterKennung: identitaet.charakterKennung,
      serverRegion: identitaet.serverRegion,
      serverKennung: identitaet.serverKennung,
      bestaetigtAm,
      aktionsAutoritaet: false as const
    });
    this.letzteAusloeser = Object.freeze(['revalidierung']);
    this.grund = 'Der exakt aktuell beobachtete Skill-Katalog wurde identitaetsgebunden revalidiert.';
    return this.status();
  }

  public status(): Readonly<SkillKatalogAuditStatus> {
    const katalog = this.katalogQuelle.status();
    const produktionsbereit =
      !this.connectionGapAktiv &&
      identitaetVollstaendig(this.identitaet) &&
      katalog.zustand === 'bereit' &&
      katalog.bestaetigungErforderlich === false;

    return Object.freeze({
      schemaVersion: SKILL_KATALOG_AUDIT_SCHEMA_VERSION,
      gestartet: this.gestartet,
      auditNummer: this.auditNummer,
      letzterAuditAm: this.letzterAuditAm,
      letzterErfolgreicherAuditAm: this.letzterErfolgreicherAuditAm,
      letzteAusloeser: this.letzteAusloeser,
      connectionGapAktiv: this.connectionGapAktiv,
      periodischesIntervallMillisekunden: this.konfiguration.periodischesIntervallMillisekunden,
      identitaet: Object.freeze({ ...this.identitaet }),
      katalog,
      revalidierungsProfil: this.revalidierungsProfil,
      produktionsbereit,
      grund: this.grund,
      aktionsAutoritaet: false as const,
      automatischerNeustart: false as const
    });
  }

  private schliesseAuditAb(
    zeitpunkt: number,
    ausloeser: Iterable<SkillKatalogAuditAusloeser>,
    erfolgreich: boolean,
    grund: string
  ): Readonly<SkillKatalogAuditStatus> {
    this.auditNummer += 1;
    this.letzterAuditAm = zeitpunkt;
    if (erfolgreich) this.letzterErfolgreicherAuditAm = zeitpunkt;
    this.letzteAusloeser = sortiereAusloeser(ausloeser);
    this.grund = grund;
    return this.status();
  }
}
