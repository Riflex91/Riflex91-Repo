import { AdventureLandSkillKatalogAuditSteuerung } from '../adventure-land/adventure-land-skill-katalog-audit.js';
import { AdventureLandSkillTechnikLesezugriff } from '../adventure-land/adventure-land-skill-technik.js';
import { CharakterFaehigkeitenResolver } from '../spiellogik/charakter-faehigkeiten.js';
import { SkillPolicySpeicher } from '../spiellogik/skill-policy.js';
import { erstelleCapabilitySyncSnapshot, pruefeRemoteCapabilityVertrauen } from '../spiellogik/capability-sync.js';
import { waehleCapabilityBasierteGruppenrollen } from '../spiellogik/capability-gruppenwahl.js';
import { erstelleCapabilityStatusSicht } from '../telemetrie/capability-status.js';
import type { SchluesselWertSpeicher } from '../vertraege/telemetrie.js';
import type {
  CapabilityFreigabeAktualisierung,
  CapabilityFreigabeApi,
  CapabilityFreigabeOptionen,
  CapabilityFreigabePolicyVorgabe,
  CapabilityFreigabeSendeAntwort,
  CapabilityFreigabeStatus
} from '../vertraege/capability-freigabe.js';
import { CAPABILITY_FREIGABE_VERSION } from '../vertraege/capability-freigabe.js';
import type { CapabilitySyncEmpfang, CapabilitySyncSnapshot, RemoteCapabilityVertrauensPruefung } from '../vertraege/capability-sync.js';
import type { GruppenLebensnachweisEmpfang } from '../vertraege/gruppen-lebensnachweis.js';
import type { GruppenTeilnehmerMeldung } from '../vertraege/gruppen-koordination.js';
import type { SkillPolicyCharakterKontext } from '../vertraege/skill-policy.js';
import type { AdventureLandProduktionsLaufzeitApi } from './adventure-land-produktions-einstieg.js';
import {
  AdventureLandCapabilitySyncAustausch
} from './adventure-land-capability-sync-austausch.js';
import {
  AdventureLandAkzeptierterLebensnachweisBeobachter
} from './adventure-land-akzeptierter-lebensnachweis-beobachter.js';
import type { AdventureLandGruppenKommunikationsFenster } from './adventure-land-gruppen-lebensnachweis-austausch.js';

export const CAPABILITY_FREIGABE_GLOBALER_NAME = 'V4CapabilityLaufzeit';
const SENDEN_BESTAETIGUNG_PREFIX = 'BLOCK8-6-CAPABILITY-SENDEN:';

class Arbeitsspeicher implements SchluesselWertSpeicher {
  private readonly werte = new Map<string, string>();

  public getItem(schluessel: string): string | null {
    return this.werte.get(schluessel) ?? null;
  }

  public setItem(schluessel: string, wert: string): void {
    this.werte.set(schluessel, wert);
  }
}

function istObjekt(wert: unknown): wert is Readonly<Record<string, unknown>> {
  return typeof wert === 'object' && wert !== null && !Array.isArray(wert);
}

function text(name: string, wert: string): string {
  const normalisiert = wert.trim();
  if (normalisiert.length === 0) throw new Error(`${name} darf nicht leer sein.`);
  return normalisiert;
}

function namenListe(werte: readonly string[] | undefined): readonly string[] {
  return Object.freeze(
    [...new Set((werte ?? []).map((wert) => wert.trim()).filter((wert) => wert.length > 0))]
      .sort((a, b) => a.localeCompare(b))
  );
}

function holeSpielFenster(codeKontext: AdventureLandGruppenKommunikationsFenster & object): object {
  try {
    const parent = Reflect.get(codeKontext, 'parent');
    if (istObjekt(parent) && parent !== codeKontext && 'character' in parent) return parent as object;
  } catch {
    // Lokaler Kontext bleibt Fallback.
  }
  return codeKontext;
}

function eigenerWert(ziel: object, name: string): unknown {
  try {
    return Object.prototype.hasOwnProperty.call(ziel, name) ? Reflect.get(ziel, name) : undefined;
  } catch {
    return undefined;
  }
}

function charakterKontextAusAudit(
  audit: ReturnType<AdventureLandSkillKatalogAuditSteuerung['status']>
): SkillPolicyCharakterKontext {
  const id = audit.identitaet.charakterKennung;
  const name = audit.identitaet.charakterName;
  const klasse = audit.identitaet.klasse;
  const stufe = audit.identitaet.stufe;
  if (
    id === null ||
    name === null ||
    klasse === null ||
    stufe === null
  ) {
    throw new Error('Capability-Freigabe benoetigt eine vollstaendige Charakteridentitaet aus dem Skill-Katalog-Audit.');
  }
  return Object.freeze({
    charakterKennung: id,
    charakterName: name,
    klasse,
    stufe
  });
}

function policyKey(vorgabe: CapabilityFreigabePolicyVorgabe): string {
  const parameter = Object.entries(vorgabe.parameter ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([kennung, wert]) => `${kennung}=${wert}`)
    .join(',');
  return `${vorgabe.skillId.trim()}|${vorgabe.freigegeben ? '1' : '0'}|${parameter}`;
}

export class AdventureLandCapabilityFreigabe {
  private readonly aktivFreigegeben: boolean;
  private readonly ablaufKennung: string;
  private readonly vertrauensNamen: readonly string[];
  private readonly koordinationsNamen: ReadonlySet<string>;
  private readonly policyVorgaben: readonly CapabilityFreigabePolicyVorgabe[];
  private readonly policyAngewandt = new Set<string>();
  private readonly audit: AdventureLandSkillKatalogAuditSteuerung;
  private readonly policy = new SkillPolicySpeicher(new Arbeitsspeicher());
  private readonly resolver: CharakterFaehigkeitenResolver;
  private readonly sync: AdventureLandCapabilitySyncAustausch;
  private readonly lebensnachweisBeobachter: AdventureLandAkzeptierterLebensnachweisBeobachter;
  private readonly lebensnachweise = new Map<string, GruppenLebensnachweisEmpfang>();
  private readonly capabilityEmpfaenge = new Map<string, CapabilitySyncEmpfang>();
  private remoteBeobachtungInstalliert = false;
  private capabilityEmpfangInstalliert = false;
  private ersterAudit = true;
  private sendeVersuche = 0;
  private sendeErfolge = 0;
  private sendeFehler = 0;
  private letzterSendeFehler: string | null = null;
  private letzterStatus: CapabilityFreigabeStatus;

  public constructor(
    private readonly codeKontext: AdventureLandGruppenKommunikationsFenster & object,
    private readonly produktionsRuntime: AdventureLandProduktionsLaufzeitApi,
    optionen: CapabilityFreigabeOptionen,
    private readonly jetzt: () => number = () => Date.now()
  ) {
    this.aktivFreigegeben = optionen.aktivFreigegeben === true;
    this.ablaufKennung = text('ablaufKennung', optionen.ablaufKennung);
    this.vertrauensNamen = namenListe(optionen.vertrauensNamen);
    this.koordinationsNamen = new Set(namenListe(optionen.koordinationsNamen));
    this.policyVorgaben = Object.freeze([...(optionen.policyVorgaben ?? [])]);
    const spielFenster = holeSpielFenster(codeKontext);
    this.audit = AdventureLandSkillKatalogAuditSteuerung.fuerSpielFenster(spielFenster);
    this.resolver = new CharakterFaehigkeitenResolver(
      this.policy,
      new AdventureLandSkillTechnikLesezugriff(spielFenster)
    );
    this.sync = new AdventureLandCapabilitySyncAustausch(codeKontext, {
      aktivFreigegeben: this.aktivFreigegeben,
      vertrauensNamen: this.vertrauensNamen,
      jetzt: this.jetzt
    });
    this.lebensnachweisBeobachter = new AdventureLandAkzeptierterLebensnachweisBeobachter(
      codeKontext,
      this.jetzt
    );
    this.letzterStatus = this.leererStatus();
  }

  public status(): CapabilityFreigabeStatus {
    return this.letzterStatus;
  }

  public aktualisiere(): CapabilityFreigabeAktualisierung {
    const zeitpunkt = this.jetzt();
    if (!Number.isFinite(zeitpunkt) || zeitpunkt < 0) {
      throw new Error('Capability-Freigabe-Zeitpunkt muss endlich und nichtnegativ sein.');
    }

    const audit = this.audit.pruefe(
      zeitpunkt,
      this.ersterAudit ? 'runtime_start' : 'periodisch'
    );
    this.ersterAudit = false;
    const charakter = charakterKontextAusAudit(audit);
    this.wendePolicyVorgabenAn(audit, charakter, zeitpunkt);

    const faehigkeiten = this.resolver.resolve(audit.katalog, charakter, zeitpunkt);
    const produktionsDiagnose = this.produktionsRuntime.pruefeGruppenZustand();
    const lokalerLebensnachweis = produktionsDiagnose.lokalerLebensnachweis;
    if (
      lokalerLebensnachweis.charakterKennung !== charakter.charakterKennung ||
      lokalerLebensnachweis.charakterName !== charakter.charakterName
    ) {
      throw new Error('Capability- und Produktionsruntime beschreiben unterschiedliche lokale Charakteridentitaeten.');
    }

    const snapshotBau = erstelleCapabilitySyncSnapshot(faehigkeiten, {
      lebensnachweis: lokalerLebensnachweis
    });
    const lokalerSnapshot = snapshotBau.snapshot;
    const remoteEmpfaenge = Object.freeze(
      [...this.capabilityEmpfaenge.values()]
        .sort((a, b) =>
          a.snapshot.charakterKennung.localeCompare(b.snapshot.charakterKennung) ||
          a.snapshot.charakterName.localeCompare(b.snapshot.charakterName)
        )
    );
    const remoteVertrauen = this.baueRemoteVertrauen(
      audit,
      produktionsDiagnose.koordination,
      remoteEmpfaenge
    );

    const gruppenwahl = lokalerSnapshot === null
      ? null
      : waehleCapabilityBasierteGruppenrollen({
          basisEntscheidung: produktionsDiagnose.koordination,
          lebensnachweise: this.lebensnachweiseFuerGruppenwahl(lokalerLebensnachweis),
          lokalerSnapshot,
          remoteVertrauen,
          autoritaeten: this.baueKoordinationsAutoritaeten(
            lokalerLebensnachweis,
            remoteEmpfaenge
          )
        });

    const capabilityStatus = erstelleCapabilityStatusSicht({
      zeitpunkt,
      audit,
      lokaleFaehigkeiten: faehigkeiten,
      skillPolicies: this.policy.listeKonfigurierbareSkills(audit.katalog, charakter),
      remoteEmpfaenge,
      remoteVertrauen,
      gruppenwahl
    });

    this.letzterStatus = Object.freeze({
      schemaVersion: 1,
      version: CAPABILITY_FREIGABE_VERSION,
      aktivFreigegeben: this.aktivFreigegeben,
      ablaufKennung: this.ablaufKennung,
      remoteBeobachtungInstalliert: this.remoteBeobachtungInstalliert,
      capabilityEmpfangInstalliert: this.capabilityEmpfangInstalliert,
      beobachteteLebensnachweise: this.lebensnachweise.size,
      empfangeneCapabilitySnapshots: this.capabilityEmpfaenge.size,
      senden: Object.freeze({
        versuche: this.sendeVersuche,
        erfolge: this.sendeErfolge,
        fehler: this.sendeFehler,
        letzterFehler: this.letzterSendeFehler
      }),
      audit,
      faehigkeiten,
      lokalerSnapshot,
      remoteVertrauen,
      gruppenwahl,
      capabilityStatus,
      spielAutoritaet: false as const,
      neustartAutoritaet: false as const
    });

    return Object.freeze({
      schemaVersion: 1,
      status: this.letzterStatus,
      lokalerSnapshot,
      remoteEmpfaenge
    });
  }

  public installiereRemoteBeobachtung(): CapabilityFreigabeStatus {
    if (!this.aktivFreigegeben) {
      throw new Error('Remote-Capability-Beobachtung bleibt im Schattenmodus gesperrt.');
    }
    const produktionsStatus = this.produktionsRuntime.status();
    if (
      produktionsStatus.aktivFreigegeben !== true ||
      produktionsStatus.empfangInstalliert !== true ||
      produktionsStatus.lebensnachweisAutomatikAktiv !== true ||
      produktionsStatus.lebensnachweisSendeErfolge < 1
    ) {
      throw new Error(
        'Remote-Capability-Beobachtung verlangt die bereits aktive Block-8-Produktionsruntime mit bestaetigtem Lebensnachweis.'
      );
    }

    if (!this.remoteBeobachtungInstalliert) {
      this.lebensnachweisBeobachter.installiere((empfang) => {
        const vorher = this.lebensnachweise.get(empfang.meldung.charakterKennung);
        if (
          vorher === undefined ||
          empfang.meldung.gesendetAm > vorher.meldung.gesendetAm ||
          (
            empfang.meldung.gesendetAm === vorher.meldung.gesendetAm &&
            empfang.meldung.laufendeNummer > vorher.meldung.laufendeNummer
          )
        ) {
          this.lebensnachweise.set(empfang.meldung.charakterKennung, empfang);
        }
      });
      this.remoteBeobachtungInstalliert = true;
    }

    if (!this.capabilityEmpfangInstalliert) {
      this.sync.installiereEmpfang((empfang) => {
        const vorher = this.capabilityEmpfaenge.get(empfang.snapshot.charakterKennung);
        if (
          vorher === undefined ||
          empfang.empfangenAm > vorher.empfangenAm ||
          (
            empfang.empfangenAm === vorher.empfangenAm &&
            empfang.snapshot.generation > vorher.snapshot.generation
          )
        ) {
          this.capabilityEmpfaenge.set(empfang.snapshot.charakterKennung, empfang);
        }
      });
      this.capabilityEmpfangInstalliert = true;
    }

    return this.aktualisiere().status;
  }

  public async sendeCapabilityEinmal(
    zielNameRoh: string,
    bestaetigungsText: string
  ): Promise<CapabilityFreigabeSendeAntwort> {
    if (!this.aktivFreigegeben) {
      throw new Error('Capability-Senden bleibt im Schattenmodus gesperrt.');
    }
    const zielName = text('zielName', zielNameRoh);
    if (bestaetigungsText !== this.sendeBestaetigungsText(zielName)) {
      throw new Error(
        `Falscher Capability-Sendebestaetigungstext. Erwartet wird exakt: ${this.sendeBestaetigungsText(zielName)}`
      );
    }
    if (!this.remoteBeobachtungInstalliert || !this.capabilityEmpfangInstalliert) {
      throw new Error('Capability-Senden verlangt vorher installierte Remote-Beobachtung.');
    }

    const aktualisierung = this.aktualisiere();
    if (aktualisierung.lokalerSnapshot === null) {
      throw new Error('Lokaler Capability-Snapshot ist nicht bereit; kontrolliertes Senden bleibt blockiert.');
    }

    this.sendeVersuche += 1;
    const ergebnis = await this.sync.sendeSnapshot(zielName, aktualisierung.lokalerSnapshot);
    if (ergebnis.gesendet) {
      this.sendeErfolge += 1;
      this.letzterSendeFehler = null;
    } else {
      this.sendeFehler += 1;
      this.letzterSendeFehler = ergebnis.grund;
    }
    const status = this.aktualisiere().status;

    return Object.freeze({
      schemaVersion: 1,
      zielName,
      ergebnis,
      status
    });
  }

  public sendeBestaetigungsText(zielNameRoh: string): string {
    return SENDEN_BESTAETIGUNG_PREFIX + text('zielName', zielNameRoh);
  }

  public stoppe(): CapabilityFreigabeStatus {
    if (this.capabilityEmpfangInstalliert) {
      this.sync.entferneEmpfang();
      this.capabilityEmpfangInstalliert = false;
    }
    if (this.remoteBeobachtungInstalliert) {
      this.lebensnachweisBeobachter.entferne();
      this.remoteBeobachtungInstalliert = false;
    }
    return this.letzterStatus;
  }

  private wendePolicyVorgabenAn(
    audit: ReturnType<AdventureLandSkillKatalogAuditSteuerung['status']>,
    charakter: SkillPolicyCharakterKontext,
    zeitpunkt: number
  ): void {
    if (
      audit.katalog.zustand !== 'bereit' ||
      audit.katalog.bestaetigungErforderlich ||
      audit.katalog.fingerprint === null
    ) return;

    for (const vorgabe of this.policyVorgaben) {
      const key = policyKey(vorgabe);
      if (this.policyAngewandt.has(key)) continue;
      const skillId = text('policyVorgabe.skillId', vorgabe.skillId);
      const freigabe = this.policy.setzeSkillFreigabe(
        audit.katalog,
        charakter,
        skillId,
        vorgabe.freigegeben,
        zeitpunkt
      );
      if (freigabe.status !== 'gespeichert') continue;

      let erfolgreich = true;
      for (const [kennung, wert] of Object.entries(vorgabe.parameter ?? {})) {
        const control = this.policy.setzeControlWert(
          audit.katalog,
          charakter,
          skillId,
          kennung,
          wert,
          zeitpunkt
        );
        if (control.status !== 'gespeichert') {
          erfolgreich = false;
          break;
        }
      }
      if (erfolgreich) this.policyAngewandt.add(key);
    }
  }

  private baueRemoteVertrauen(
    audit: ReturnType<AdventureLandSkillKatalogAuditSteuerung['status']>,
    koordination: ReturnType<AdventureLandProduktionsLaufzeitApi['pruefeGruppenZustand']>['koordination'],
    remoteEmpfaenge: readonly CapabilitySyncEmpfang[]
  ): readonly RemoteCapabilityVertrauensPruefung[] {
    return Object.freeze(remoteEmpfaenge.map((empfang) => {
      const heartbeat = this.lebensnachweise.get(empfang.snapshot.charakterKennung) ?? null;
      const bewertung = koordination.teilnehmerBewertungen.find(
        (row) => row.charakterKennung === empfang.snapshot.charakterKennung
      ) ?? null;
      return pruefeRemoteCapabilityVertrauen({
        empfang,
        lebensnachweisEmpfang: heartbeat,
        lebensnachweisBewertung: bewertung,
        lokalerKatalog: audit.katalog
      });
    }));
  }

  private lebensnachweiseFuerGruppenwahl(
    lokal: GruppenTeilnehmerMeldung
  ): readonly GruppenTeilnehmerMeldung[] {
    const remote = [...this.lebensnachweise.values()]
      .map((empfang) => empfang.meldung)
      .filter((meldung) => meldung.charakterKennung !== lokal.charakterKennung);
    return Object.freeze([...remote, lokal]);
  }

  private baueKoordinationsAutoritaeten(
    lokal: GruppenTeilnehmerMeldung,
    remoteEmpfaenge: readonly CapabilitySyncEmpfang[]
  ) {
    const eintraege = [
      Object.freeze({
        charakterKennung: lokal.charakterKennung,
        gruppenKoordinationErlaubt: this.koordinationsNamen.has(lokal.charakterName),
        grund: this.koordinationsNamen.has(lokal.charakterName)
          ? 'Lokaler Charakter ist explizit fuer Capability-Gruppenkoordination freigegeben.'
          : 'Lokaler Charakter ist nicht fuer Capability-Gruppenkoordination freigegeben.'
      }),
      ...remoteEmpfaenge.map((empfang) => Object.freeze({
        charakterKennung: empfang.snapshot.charakterKennung,
        gruppenKoordinationErlaubt: this.koordinationsNamen.has(empfang.snapshot.charakterName),
        grund: this.koordinationsNamen.has(empfang.snapshot.charakterName)
          ? 'Remote-Charakter ist explizit fuer Capability-Gruppenkoordination freigegeben.'
          : 'Remote-Charakter ist nicht fuer Capability-Gruppenkoordination freigegeben.'
      }))
    ];
    return Object.freeze(eintraege);
  }

  private leererStatus(): CapabilityFreigabeStatus {
    return Object.freeze({
      schemaVersion: 1,
      version: CAPABILITY_FREIGABE_VERSION,
      aktivFreigegeben: this.aktivFreigegeben,
      ablaufKennung: this.ablaufKennung,
      remoteBeobachtungInstalliert: false,
      capabilityEmpfangInstalliert: false,
      beobachteteLebensnachweise: 0,
      empfangeneCapabilitySnapshots: 0,
      senden: Object.freeze({
        versuche: 0,
        erfolge: 0,
        fehler: 0,
        letzterFehler: null
      }),
      audit: null,
      faehigkeiten: null,
      lokalerSnapshot: null,
      remoteVertrauen: Object.freeze([]),
      gruppenwahl: null,
      capabilityStatus: null,
      spielAutoritaet: false as const,
      neustartAutoritaet: false as const
    });
  }
}

export function installiereAdventureLandCapabilityFreigabe(
  codeKontext: AdventureLandGruppenKommunikationsFenster & object,
  produktionsRuntime: AdventureLandProduktionsLaufzeitApi,
  optionen: CapabilityFreigabeOptionen
): CapabilityFreigabeApi {
  if (eigenerWert(codeKontext, CAPABILITY_FREIGABE_GLOBALER_NAME) !== undefined) {
    throw new Error(`${CAPABILITY_FREIGABE_GLOBALER_NAME} ist im Codekontext bereits vorhanden.`);
  }
  const instanz = new AdventureLandCapabilityFreigabe(
    codeKontext,
    produktionsRuntime,
    optionen
  );
  const api: CapabilityFreigabeApi = Object.freeze({
    version: CAPABILITY_FREIGABE_VERSION,
    status: () => instanz.status(),
    aktualisiere: () => instanz.aktualisiere(),
    installiereRemoteBeobachtung: () => instanz.installiereRemoteBeobachtung(),
    sendeCapabilityEinmal: (zielName: string, bestaetigungsText: string) =>
      instanz.sendeCapabilityEinmal(zielName, bestaetigungsText),
    stoppe: () => instanz.stoppe(),
    sendeBestaetigungsText: (zielName: string) => instanz.sendeBestaetigungsText(zielName)
  });
  const installiert = Reflect.defineProperty(codeKontext, CAPABILITY_FREIGABE_GLOBALER_NAME, {
    configurable: true,
    enumerable: true,
    writable: false,
    value: api
  });
  if (!installiert) {
    throw new Error('V4CapabilityLaufzeit konnte nicht im Adventure-Land-Codekontext installiert werden.');
  }
  return api;
}
