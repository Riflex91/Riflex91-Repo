import type { SchluesselWertSpeicher } from '../vertraege/telemetrie.js';
import type {
  CapabilityWiederholungCharakterEingabe,
  CapabilityWiederholungCharakterErgebnis,
  CapabilityWiederholungsDatensatz,
  CapabilityWiederholungsLauf,
  CapabilityWiederholungPolicyAenderung,
  CapabilityWiederholungSchritt,
  CapabilityWiederholungSchrittErgebnis
} from '../vertraege/capability-wiederholung.js';
import {
  CAPABILITY_WIEDERHOLUNG_MAX_CHARAKTERE,
  CAPABILITY_WIEDERHOLUNG_MAX_SCHRITTE,
  CAPABILITY_WIEDERHOLUNG_REMOTE_QUELLEN
} from '../vertraege/capability-wiederholung.js';
import type { CapabilitySyncEmpfang, CapabilitySyncSnapshot, RemoteCapabilityVertrauensPruefung } from '../vertraege/capability-sync.js';
import type { CharakterFaehigkeiten } from '../vertraege/charakter-faehigkeiten.js';
import type { GruppenTeilnehmerMeldung } from '../vertraege/gruppen-koordination.js';
import { AdventureLandSkillKatalogAuditSteuerung } from '../adventure-land/adventure-land-skill-katalog-audit.js';
import { AdventureLandSkillTechnikLesezugriff } from '../adventure-land/adventure-land-skill-technik.js';
import { SkillPolicySpeicher } from '../spiellogik/skill-policy.js';
import { CharakterFaehigkeitenResolver } from '../spiellogik/charakter-faehigkeiten.js';
import { erstelleCapabilitySyncSnapshot, pruefeRemoteCapabilityVertrauen } from '../spiellogik/capability-sync.js';
import { koordiniereGruppe } from '../spiellogik/gruppen-koordination.js';
import { waehleCapabilityBasierteGruppenrollen } from '../spiellogik/capability-gruppenwahl.js';
import { erstelleCapabilityStatusSicht } from '../telemetrie/capability-status.js';
import { berechneSha256 } from '../telemetrie/sha256.js';
import { kanonisiereJson } from './kanonisches-json.js';

type ReplayFenster = Record<string, unknown>;

interface CharakterLaufzeit {
  readonly fenster: ReplayFenster;
  readonly audit: AdventureLandSkillKatalogAuditSteuerung;
  readonly policy: SkillPolicySpeicher;
  readonly resolver: CharakterFaehigkeitenResolver;
  letzterSnapshot: CapabilitySyncSnapshot | null;
}

class Arbeitsspeicher implements SchluesselWertSpeicher {
  private readonly werte = new Map<string, string>();

  public getItem(schluessel: string): string | null {
    return this.werte.get(schluessel) ?? null;
  }

  public setItem(schluessel: string, wert: string): void {
    this.werte.set(schluessel, wert);
  }
}

function pruefeText(name: string, wert: string): string {
  const normalisiert = wert.trim();
  if (normalisiert.length === 0) throw new Error(`${name} darf nicht leer sein.`);
  return normalisiert;
}

function pruefeNichtnegativeZahl(name: string, wert: number): number {
  if (!Number.isFinite(wert) || wert < 0) {
    throw new Error(`${name} muss eine endliche, nichtnegative Zahl sein.`);
  }
  return wert;
}

function pruefePositiveZahl(name: string, wert: number): number {
  if (!Number.isFinite(wert) || wert <= 0) {
    throw new Error(`${name} muss eine endliche, positive Zahl sein.`);
  }
  return wert;
}

function pruefePositiveGanzzahl(name: string, wert: number): number {
  if (!Number.isSafeInteger(wert) || wert <= 0) {
    throw new Error(`${name} muss eine positive sichere Ganzzahl sein.`);
  }
  return wert;
}

function anteil(wert: number, maximum: number): number {
  if (maximum <= 0) return 0;
  return Math.max(0, Math.min(1, wert / maximum));
}

function cloneJson<T>(wert: T): T {
  return JSON.parse(kanonisiereJson(wert)) as T;
}

function aktualisiereFenster(
  fenster: ReplayFenster,
  eingabe: CapabilityWiederholungCharakterEingabe,
  zeitpunkt: number
): void {
  const character = {
    id: eingabe.charakterKennung,
    name: eingabe.charakterName,
    ctype: eingabe.klasse,
    level: eingabe.stufe,
    hp: eingabe.leben,
    max_hp: eingabe.lebenMaximal,
    mp: eingabe.mana,
    max_mp: eingabe.manaMaximal,
    map: eingabe.karte,
    target: eingabe.zielKennung,
    slots: cloneJson(eingabe.slots),
    items: cloneJson(eingabe.inventar)
  };
  const g = {
    skills: cloneJson(eingabe.skills),
    items: cloneJson(eingabe.gameItems)
  };
  const cooldowns = new Set(eingabe.cooldownSkills);
  const canUse = new Map(Object.entries(eingabe.canUse));

  fenster.character = character;
  fenster.G = g;
  fenster.server_region = eingabe.serverRegion;
  if (eingabe.connectionGap) delete fenster.server_identifier;
  else fenster.server_identifier = eingabe.serverKennung;

  const nextSkill: Record<string, number> = {};
  for (const skillId of cooldowns) {
    const rohSkill = eingabe.skills[skillId];
    const share = rohSkill && typeof rohSkill.share === 'string' && rohSkill.share.trim().length > 0
      ? rohSkill.share
      : skillId;
    nextSkill[share] = zeitpunkt + 500;
  }
  fenster.next_skill = nextSkill;
  fenster.is_on_cooldown = (skillId: unknown) =>
    typeof skillId === 'string' && cooldowns.has(skillId);
  fenster.can_use = (skillId: unknown) =>
    typeof skillId === 'string' ? (canUse.get(skillId) ?? true) : false;
}

function baueLaufzeit(): CharakterLaufzeit {
  const fenster: ReplayFenster = {};
  const policy = new SkillPolicySpeicher(new Arbeitsspeicher());
  const audit = AdventureLandSkillKatalogAuditSteuerung.fuerSpielFenster(fenster);
  const technik = new AdventureLandSkillTechnikLesezugriff(fenster);
  const resolver = new CharakterFaehigkeitenResolver(policy, technik);
  return { fenster, audit, policy, resolver, letzterSnapshot: null };
}

function charakterKontext(eingabe: CapabilityWiederholungCharakterEingabe) {
  return Object.freeze({
    charakterKennung: pruefeText('charakterKennung', eingabe.charakterKennung),
    charakterName: pruefeText('charakterName', eingabe.charakterName),
    klasse: pruefeText('klasse', eingabe.klasse).toLowerCase(),
    stufe: pruefeNichtnegativeZahl('stufe', eingabe.stufe)
  });
}

function wendePolicyAenderungAn(
  runtime: CharakterLaufzeit,
  katalog: ReturnType<AdventureLandSkillKatalogAuditSteuerung['status']>['katalog'],
  eingabe: CapabilityWiederholungCharakterEingabe,
  aenderung: CapabilityWiederholungPolicyAenderung,
  zeitpunkt: number
): void {
  const charakter = charakterKontext(eingabe);
  let ergebnis;
  if (aenderung.art === 'skill_freigabe') {
    ergebnis = runtime.policy.setzeSkillFreigabe(
      katalog,
      charakter,
      aenderung.skillId,
      aenderung.freigegeben,
      zeitpunkt
    );
  } else if (aenderung.art === 'control') {
    ergebnis = runtime.policy.setzeControlWert(
      katalog,
      charakter,
      aenderung.skillId,
      aenderung.controlKennung,
      aenderung.wert,
      zeitpunkt
    );
  } else {
    ergebnis = runtime.policy.setzeSkillZurueck(
      katalog,
      charakter,
      aenderung.skillId,
      zeitpunkt
    );
  }
  if (ergebnis.status !== 'gespeichert') {
    throw new Error(
      `Capability-Replay konnte Policy-Aenderung fuer ${eingabe.charakterKennung}/${aenderung.skillId} nicht anwenden: ${ergebnis.grund}`
    );
  }
}

function baueLebensnachweis(
  eingabe: CapabilityWiederholungCharakterEingabe,
  faehigkeiten: CharakterFaehigkeiten,
  zeitpunkt: number
): GruppenTeilnehmerMeldung {
  return Object.freeze({
    schemaVersion: 1,
    charakterKennung: eingabe.charakterKennung,
    charakterName: eingabe.charakterName,
    klasse: eingabe.klasse.toLowerCase(),
    serverRegion: eingabe.serverRegion,
    serverKennung: eingabe.serverKennung,
    karte: eingabe.karte,
    instanz: eingabe.instanz,
    lebendig: eingabe.lebendig,
    lebensAnteil: anteil(eingabe.leben, eingabe.lebenMaximal),
    manaAnteil: anteil(eingabe.mana, eingabe.manaMaximal),
    zielKennung: eingabe.zielKennung,
    gefahrenStufe: eingabe.gefahrenStufe,
    faehigkeiten: Object.freeze({ ...faehigkeiten.gruppenFaehigkeiten }),
    gesendetAm: zeitpunkt,
    laufendeNummer: eingabe.lebensnachweisLaufendeNummer
  });
}

function blockiertesRemoteVertrauen(
  eingabe: CapabilityWiederholungCharakterEingabe,
  basis: ReturnType<typeof koordiniereGruppe>,
  grund: string
): RemoteCapabilityVertrauensPruefung {
  return Object.freeze({
    schemaVersion: 1,
    status: 'blockiert' as const,
    charakterKennung: eingabe.charakterKennung,
    charakterName: eingabe.charakterName,
    gruende: Object.freeze([grund]),
    snapshot: null,
    lebensnachweisBewertung:
      basis.teilnehmerBewertungen.find((row) => row.charakterKennung === eingabe.charakterKennung) ?? null,
    aktionsAutoritaet: false as const
  });
}

function pruefeDatensatz(datensatz: CapabilityWiederholungsDatensatz): void {
  if (datensatz.schemaVersion !== 1) {
    throw new Error(`Unbekannte Capability-Wiederholungsdatensatz-Version: ${datensatz.schemaVersion}.`);
  }
  pruefeText('Datensatz-Kennung', datensatz.kennung);
  pruefeNichtnegativeZahl('erstelltAm', datensatz.erstelltAm);
  if (datensatz.schritte.length === 0 || datensatz.schritte.length > CAPABILITY_WIEDERHOLUNG_MAX_SCHRITTE) {
    throw new Error(`Capability-Replay benoetigt 1 bis ${CAPABILITY_WIEDERHOLUNG_MAX_SCHRITTE} Schritte.`);
  }

  let letzteNummer = 0;
  let letzterZeitpunkt = -1;
  for (const schritt of datensatz.schritte) {
    pruefePositiveGanzzahl('Schritt-laufendeNummer', schritt.laufendeNummer);
    if (schritt.laufendeNummer <= letzteNummer) {
      throw new Error('Capability-Replay-Schritte muessen streng steigende laufendeNummern besitzen.');
    }
    pruefeNichtnegativeZahl('Schritt-Zeitpunkt', schritt.zeitpunkt);
    if (schritt.zeitpunkt <= letzterZeitpunkt) {
      throw new Error('Capability-Replay-Schritte muessen streng steigende Zeitpunkte besitzen.');
    }
    letzteNummer = schritt.laufendeNummer;
    letzterZeitpunkt = schritt.zeitpunkt;

    if (schritt.charaktere.length === 0 || schritt.charaktere.length > CAPABILITY_WIEDERHOLUNG_MAX_CHARAKTERE) {
      throw new Error(`Capability-Replay-Schritt benoetigt 1 bis ${CAPABILITY_WIEDERHOLUNG_MAX_CHARAKTERE} Charaktere.`);
    }
    const ids = new Set<string>();
    for (const charakter of schritt.charaktere) {
      const id = pruefeText('charakterKennung', charakter.charakterKennung);
      if (ids.has(id)) throw new Error(`Charakterkennung im Replay-Schritt doppelt: ${id}.`);
      ids.add(id);
      pruefeText('charakterName', charakter.charakterName);
      pruefeText('klasse', charakter.klasse);
      pruefeNichtnegativeZahl('stufe', charakter.stufe);
      pruefeNichtnegativeZahl('leben', charakter.leben);
      pruefePositiveZahl('lebenMaximal', charakter.lebenMaximal);
      pruefeNichtnegativeZahl('mana', charakter.mana);
      pruefePositiveZahl('manaMaximal', charakter.manaMaximal);
      pruefeText('serverRegion', charakter.serverRegion);
      pruefeText('serverKennung', charakter.serverKennung);
      pruefeText('karte', charakter.karte);
      pruefeText('instanz', charakter.instanz);
      pruefePositiveGanzzahl('lebensnachweisLaufendeNummer', charakter.lebensnachweisLaufendeNummer);
      if (!(CAPABILITY_WIEDERHOLUNG_REMOTE_QUELLEN as readonly string[]).includes(charakter.remoteSnapshotQuelle)) {
        throw new Error(`Unbekannte Remote-Snapshot-Quelle: ${charakter.remoteSnapshotQuelle}.`);
      }
    }
    if (!ids.has(schritt.eigenerTeilnehmerKennung)) {
      throw new Error('eigenerTeilnehmerKennung muss im Replay-Schritt vorhanden sein.');
    }
  }

  kanonisiereJson(datensatz);
}

function sortiereSchritte(datensatz: CapabilityWiederholungsDatensatz): readonly CapabilityWiederholungSchritt[] {
  return Object.freeze([...datensatz.schritte].sort((a, b) => a.laufendeNummer - b.laufendeNummer));
}

export class CapabilityWiederholungsMaschine {
  public fuehreAus(
    datensatz: CapabilityWiederholungsDatensatz,
    varianteKennungRoh: string
  ): CapabilityWiederholungsLauf {
    pruefeDatensatz(datensatz);
    const varianteKennung = pruefeText('varianteKennung', varianteKennungRoh);
    const eingabeFingerabdruck = berechneSha256(kanonisiereJson(datensatz));
    const runtimes = new Map<string, CharakterLaufzeit>();
    const schrittErgebnisse: CapabilityWiederholungSchrittErgebnis[] = [];

    for (const schritt of sortiereSchritte(datensatz)) {
      const schrittErgebnis = this.fuehreSchrittAus(schritt, runtimes);
      schrittErgebnisse.push(schrittErgebnis);
    }

    const ausgabeBasis = {
      datensatzKennung: datensatz.kennung,
      eingabeFingerabdruck,
      schritte: schrittErgebnisse
    };
    const ausgabeFingerabdruck = berechneSha256(kanonisiereJson(ausgabeBasis));

    return Object.freeze({
      schemaVersion: 1,
      datensatzKennung: datensatz.kennung,
      varianteKennung,
      eingabeFingerabdruck,
      ausgabeFingerabdruck,
      schritte: Object.freeze(schrittErgebnisse),
      aktionsAutoritaet: false as const
    });
  }

  private fuehreSchrittAus(
    schritt: CapabilityWiederholungSchritt,
    runtimes: Map<string, CharakterLaufzeit>
  ): CapabilityWiederholungSchrittErgebnis {
    const eingaben = [...schritt.charaktere].sort((a, b) =>
      a.charakterKennung.localeCompare(b.charakterKennung)
    );
    const vorherigeSnapshots = new Map<string, CapabilitySyncSnapshot | null>();
    const charakterErgebnisse: CapabilityWiederholungCharakterErgebnis[] = [];

    for (const eingabe of eingaben) {
      let runtime = runtimes.get(eingabe.charakterKennung);
      if (runtime === undefined) {
        runtime = baueLaufzeit();
        runtimes.set(eingabe.charakterKennung, runtime);
      }
      vorherigeSnapshots.set(eingabe.charakterKennung, runtime.letzterSnapshot);

      aktualisiereFenster(runtime.fenster, eingabe, schritt.zeitpunkt);
      let audit = runtime.audit.pruefe(
        schritt.zeitpunkt,
        runtime.audit.status().auditNummer === 0 ? 'runtime_start' : 'periodisch'
      );
      if (eingabe.revalidiere) {
        if (audit.katalog.fingerprint === null) {
          throw new Error(`Revalidierung fuer ${eingabe.charakterKennung} ohne Katalog-Fingerprint nicht moeglich.`);
        }
        audit = runtime.audit.bestaetigeAktuellenKatalog(audit.katalog.fingerprint, schritt.zeitpunkt);
      }

      for (const aenderung of eingabe.policyAenderungen) {
        wendePolicyAenderungAn(runtime, audit.katalog, eingabe, aenderung, schritt.zeitpunkt);
      }

      const faehigkeiten = runtime.resolver.resolve(
        audit.katalog,
        charakterKontext(eingabe),
        schritt.zeitpunkt
      );
      const lebensnachweis = baueLebensnachweis(eingabe, faehigkeiten, schritt.zeitpunkt);
      const snapshotBau = erstelleCapabilitySyncSnapshot(faehigkeiten, { lebensnachweis });
      const aktuellerSnapshot = snapshotBau.snapshot;

      charakterErgebnisse.push(Object.freeze({
        charakterKennung: eingabe.charakterKennung,
        audit,
        faehigkeiten,
        lebensnachweis,
        aktuellerSnapshot,
        vorherigerSnapshot: vorherigeSnapshots.get(eingabe.charakterKennung) ?? null
      }));
    }

    const eigenerEingabe = eingaben.find(
      (eintrag) => eintrag.charakterKennung === schritt.eigenerTeilnehmerKennung
    )!;
    const eigenerRuntime = runtimes.get(schritt.eigenerTeilnehmerKennung)!;
    const eigenesErgebnis = charakterErgebnisse.find(
      (eintrag) => eintrag.charakterKennung === schritt.eigenerTeilnehmerKennung
    )!;
    const meldungen = Object.freeze(charakterErgebnisse.map((eintrag) => eintrag.lebensnachweis));
    const basis = koordiniereGruppe(meldungen, schritt.eigenerTeilnehmerKennung, schritt.zeitpunkt);
    const remoteVertrauen: RemoteCapabilityVertrauensPruefung[] = [];
    const remoteEmpfaenge: CapabilitySyncEmpfang[] = [];

    for (const remoteEingabe of eingaben.filter(
      (eintrag) => eintrag.charakterKennung !== schritt.eigenerTeilnehmerKennung
    )) {
      const remoteErgebnis = charakterErgebnisse.find(
        (eintrag) => eintrag.charakterKennung === remoteEingabe.charakterKennung
      )!;
      const snapshot =
        remoteEingabe.remoteSnapshotQuelle === 'aktuell'
          ? remoteErgebnis.aktuellerSnapshot
          : remoteEingabe.remoteSnapshotQuelle === 'vorheriger'
            ? remoteErgebnis.vorherigerSnapshot
            : null;

      if (snapshot === null) {
        remoteVertrauen.push(blockiertesRemoteVertrauen(
          remoteEingabe,
          basis,
          remoteEingabe.remoteSnapshotQuelle === 'fehlend'
            ? 'Replay-Eingabe liefert absichtlich keinen Remote-Capability-Snapshot.'
            : 'Replay-Eingabe verlangte einen Snapshot, aber es existiert kein passender Snapshot.'
        ));
        continue;
      }

      const empfang: CapabilitySyncEmpfang = Object.freeze({
        schemaVersion: 1,
        absenderName: snapshot.charakterName,
        empfangenAm: schritt.zeitpunkt,
        snapshot
      });
      remoteEmpfaenge.push(empfang);
      const lebensnachweisEmpfang = Object.freeze({
        schemaVersion: 1 as const,
        absenderName: remoteErgebnis.lebensnachweis.charakterName,
        empfangenAm: schritt.zeitpunkt,
        meldung: remoteErgebnis.lebensnachweis
      });
      const lebensnachweisBewertung =
        basis.teilnehmerBewertungen.find(
          (row) => row.charakterKennung === remoteEingabe.charakterKennung
        ) ?? null;

      remoteVertrauen.push(pruefeRemoteCapabilityVertrauen({
        empfang,
        lebensnachweisEmpfang,
        lebensnachweisBewertung,
        lokalerKatalog: eigenesErgebnis.audit.katalog
      }));
    }

    const autoritaeten = Object.freeze(eingaben.map((eintrag) => Object.freeze({
      charakterKennung: eintrag.charakterKennung,
      gruppenKoordinationErlaubt: eintrag.gruppenKoordinationErlaubt,
      grund: eintrag.gruppenKoordinationErlaubt
        ? 'Capability-Replay-Eingabe erlaubt Gruppenkoordination.'
        : 'Capability-Replay-Eingabe verweigert Gruppenkoordination.'
    })));

    const gruppenwahl = eigenesErgebnis.aktuellerSnapshot === null
      ? null
      : waehleCapabilityBasierteGruppenrollen({
          basisEntscheidung: basis,
          lebensnachweise: meldungen,
          lokalerSnapshot: eigenesErgebnis.aktuellerSnapshot,
          remoteVertrauen: Object.freeze(remoteVertrauen),
          autoritaeten
        });

    const policyAnsichten = eigenerRuntime.policy.listeKonfigurierbareSkills(
      eigenesErgebnis.audit.katalog,
      charakterKontext(eigenerEingabe)
    );
    const status = erstelleCapabilityStatusSicht({
      zeitpunkt: schritt.zeitpunkt,
      audit: eigenesErgebnis.audit,
      lokaleFaehigkeiten: eigenesErgebnis.faehigkeiten,
      skillPolicies: policyAnsichten,
      remoteEmpfaenge: Object.freeze(remoteEmpfaenge),
      remoteVertrauen: Object.freeze(remoteVertrauen),
      gruppenwahl
    });

    for (const ergebnis of charakterErgebnisse) {
      if (ergebnis.aktuellerSnapshot !== null) {
        runtimes.get(ergebnis.charakterKennung)!.letzterSnapshot = ergebnis.aktuellerSnapshot;
      }
    }

    const fingerprintBasis = {
      laufendeNummer: schritt.laufendeNummer,
      zeitpunkt: schritt.zeitpunkt,
      eigenerTeilnehmerKennung: schritt.eigenerTeilnehmerKennung,
      charaktere: charakterErgebnisse,
      remoteVertrauen,
      gruppenwahl,
      status
    };
    const schrittFingerabdruck = berechneSha256(kanonisiereJson(fingerprintBasis));

    return Object.freeze({
      laufendeNummer: schritt.laufendeNummer,
      zeitpunkt: schritt.zeitpunkt,
      eigenerTeilnehmerKennung: schritt.eigenerTeilnehmerKennung,
      charaktere: Object.freeze(charakterErgebnisse),
      remoteVertrauen: Object.freeze(remoteVertrauen),
      gruppenwahl,
      status,
      schrittFingerabdruck,
      aktionsAutoritaet: false as const
    });
  }
}
