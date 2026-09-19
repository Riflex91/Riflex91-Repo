import type { SchluesselWertSpeicher } from '../vertraege/telemetrie.js';
import type {
  SkillPolicyAenderungsErgebnis,
  SkillPolicyCharakterKontext,
  SkillPolicyCharakterProfil,
  SkillPolicyControlDefinition,
  SkillPolicyDauerzustand,
  SkillPolicyEntscheidung,
  SkillPolicyEntscheidungsGrund,
  SkillPolicyPersistierteSkillEinstellung,
  SkillPolicySkillAnsicht,
  SkillPolicyStatus
} from '../vertraege/skill-policy.js';
import {
  SKILL_POLICY_SCHEMA_VERSION,
  SKILL_POLICY_SPEICHER_SCHLUESSEL
} from '../vertraege/skill-policy.js';
import type { SkillKatalog, SkillKatalogEintrag } from '../vertraege/skill-katalog.js';
import { kanonisiereJson } from '../wiederholung/kanonisches-json.js';
import { holeWirksameSkillPolicyControls } from './skill-policy-semantik.js';

type RohObjekt = Readonly<Record<string, unknown>>;

function istObjekt(wert: unknown): wert is RohObjekt {
  return typeof wert === 'object' && wert !== null && !Array.isArray(wert);
}

function fehlerText(fehler: unknown): string {
  return fehler instanceof Error ? fehler.message : String(fehler);
}

function pruefeZeitpunkt(name: string, wert: number): void {
  if (!Number.isFinite(wert) || wert < 0) throw new Error(`${name} muss eine endliche, nichtnegative Zahl sein.`);
}

function normalisiereText(name: string, wert: string): string {
  const normalisiert = wert.trim();
  if (normalisiert.length === 0) throw new Error(`${name} darf nicht leer sein.`);
  return normalisiert;
}

function normalisiereCharakter(kontext: SkillPolicyCharakterKontext): SkillPolicyCharakterKontext {
  if (!Number.isFinite(kontext.stufe) || kontext.stufe < 0) {
    throw new Error('SkillPolicy-Charakterstufe muss eine endliche, nichtnegative Zahl sein.');
  }
  return Object.freeze({
    charakterKennung: normalisiereText('charakterKennung', kontext.charakterKennung),
    charakterName: normalisiereText('charakterName', kontext.charakterName),
    klasse: normalisiereText('klasse', kontext.klasse).toLowerCase(),
    stufe: kontext.stufe
  });
}

function friereEinstellung(
  einstellung: SkillPolicyPersistierteSkillEinstellung
): SkillPolicyPersistierteSkillEinstellung {
  return Object.freeze({
    freigegeben: einstellung.freigegeben,
    parameter: Object.freeze(
      Object.fromEntries(
        Object.entries(einstellung.parameter)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([kennung, wert]) => [kennung, wert])
      )
    ),
    geaendertAm: einstellung.geaendertAm,
    katalogFingerprintBeiAenderung: einstellung.katalogFingerprintBeiAenderung
  });
}

function friereProfil(profil: SkillPolicyCharakterProfil): SkillPolicyCharakterProfil {
  return Object.freeze({
    schemaVersion: SKILL_POLICY_SCHEMA_VERSION,
    charakterKennung: profil.charakterKennung,
    charakterName: profil.charakterName,
    klasse: profil.klasse,
    geaendertAm: profil.geaendertAm,
    skills: Object.freeze(
      Object.fromEntries(
        Object.entries(profil.skills)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([skillId, einstellung]) => [skillId, friereEinstellung(einstellung)])
      )
    )
  });
}

function controlWertGueltig(definition: SkillPolicyControlDefinition, wert: number): boolean {
  if (!Number.isFinite(wert)) return false;
  if (wert < definition.minimum || wert > definition.maximum) return false;
  if (definition.art === 'ganzzahl' && !Number.isInteger(wert)) return false;
  const schritte = (wert - definition.minimum) / definition.schritt;
  return Math.abs(schritte - Math.round(schritte)) < 1e-9;
}

function defaultParameter(definitionen: readonly SkillPolicyControlDefinition[]): Readonly<Record<string, number>> {
  return Object.freeze(Object.fromEntries(definitionen.map((definition) => [definition.kennung, definition.standardWert])));
}

function skillPasstZuCharakter(eintrag: SkillKatalogEintrag, charakter: SkillPolicyCharakterKontext): boolean {
  if (eintrag.klassen.length > 0 && !eintrag.klassen.includes(charakter.klasse)) return false;
  return charakter.stufe >= (eintrag.stufenVoraussetzung ?? 0);
}

function istKatalogKonfigurierbar(katalog: SkillKatalog): boolean {
  return katalog.zustand === 'bereit' &&
    katalog.bestaetigungErforderlich === false &&
    katalog.fingerprint !== null;
}

function findeSkill(katalog: SkillKatalog, skillId: string): SkillKatalogEintrag | null {
  return katalog.skills.find((eintrag) => eintrag.skillId === skillId) ?? null;
}

function parseEinstellung(wert: unknown): SkillPolicyPersistierteSkillEinstellung | null {
  if (!istObjekt(wert)) return null;
  if (typeof wert.freigegeben !== 'boolean') return null;
  if (typeof wert.geaendertAm !== 'number' || !Number.isFinite(wert.geaendertAm) || wert.geaendertAm < 0) return null;
  if (
    wert.katalogFingerprintBeiAenderung !== null &&
    (typeof wert.katalogFingerprintBeiAenderung !== 'string' || !/^[a-f0-9]{64}$/.test(wert.katalogFingerprintBeiAenderung))
  ) return null;
  if (!istObjekt(wert.parameter)) return null;

  const parameter: Record<string, number> = {};
  for (const [kennung, roh] of Object.entries(wert.parameter)) {
    if (kennung.trim().length === 0 || typeof roh !== 'number' || !Number.isFinite(roh)) return null;
    parameter[kennung] = roh;
  }
  return friereEinstellung({
    freigegeben: wert.freigegeben,
    parameter,
    geaendertAm: Number(wert.geaendertAm),
    katalogFingerprintBeiAenderung: wert.katalogFingerprintBeiAenderung as string | null
  });
}

function parseProfil(wert: unknown): SkillPolicyCharakterProfil | null {
  if (!istObjekt(wert) || wert.schemaVersion !== SKILL_POLICY_SCHEMA_VERSION) return null;
  if (
    typeof wert.charakterKennung !== 'string' ||
    typeof wert.charakterName !== 'string' ||
    typeof wert.klasse !== 'string' ||
    wert.charakterKennung.trim().length === 0 ||
    wert.charakterName.trim().length === 0 ||
    wert.klasse.trim().length === 0 ||
    typeof wert.geaendertAm !== 'number' ||
    !Number.isFinite(wert.geaendertAm) ||
    wert.geaendertAm < 0 ||
    !istObjekt(wert.skills)
  ) return null;

  const skills: Record<string, SkillPolicyPersistierteSkillEinstellung> = {};
  for (const [skillId, roh] of Object.entries(wert.skills)) {
    if (skillId.trim().length === 0) return null;
    const einstellung = parseEinstellung(roh);
    if (einstellung === null) return null;
    skills[skillId] = einstellung;
  }

  return friereProfil({
    schemaVersion: SKILL_POLICY_SCHEMA_VERSION,
    charakterKennung: wert.charakterKennung.trim(),
    charakterName: wert.charakterName.trim(),
    klasse: wert.klasse.trim().toLowerCase(),
    geaendertAm: wert.geaendertAm,
    skills
  });
}

export class SkillPolicySpeicher {
  private profile = new Map<string, SkillPolicyCharakterProfil>();
  private letzterSpeicherZeitpunkt: number | null = null;
  private letzterLadeFehler: string | null = null;
  private letzterSpeicherFehler: string | null = null;

  public constructor(
    private readonly speicher: SchluesselWertSpeicher,
    private readonly speicherSchluessel = SKILL_POLICY_SPEICHER_SCHLUESSEL
  ) {
    normalisiereText('speicherSchluessel', speicherSchluessel);
    this.lade();
  }

  public listeKonfigurierbareSkills(
    katalog: SkillKatalog,
    charakterKontext: SkillPolicyCharakterKontext
  ): readonly SkillPolicySkillAnsicht[] {
    const charakter = normalisiereCharakter(charakterKontext);
    if (!istKatalogKonfigurierbar(katalog)) return Object.freeze([]);

    return Object.freeze(
      katalog.skills
        .filter((eintrag) => eintrag.automationValidated === true && skillPasstZuCharakter(eintrag, charakter))
        .sort((a, b) => a.skillId.localeCompare(b.skillId))
        .map((eintrag) => this.baueAnsicht(katalog, charakter, eintrag))
    );
  }

  public setzeSkillFreigabe(
    katalog: SkillKatalog,
    charakterKontext: SkillPolicyCharakterKontext,
    skillIdRoh: string,
    freigegeben: boolean,
    geaendertAm: number
  ): Readonly<SkillPolicyAenderungsErgebnis> {
    const charakter = normalisiereCharakter(charakterKontext);
    const skillId = normalisiereText('skillId', skillIdRoh);
    pruefeZeitpunkt('geaendertAm', geaendertAm);
    if (typeof freigegeben !== 'boolean') {
      return this.blockiert(charakter, skillId, 'SkillPolicy Ein/Aus benoetigt einen booleschen Wert.');
    }

    const eintrag = this.konfigurierbarerSkill(katalog, charakter, skillId);
    if (eintrag === null) {
      return this.blockiert(
        charakter,
        skillId,
        'Skill ist fuer diesen Charakter oder den aktuellen Katalog nicht sicher konfigurierbar.'
      );
    }

    const definitionen = holeWirksameSkillPolicyControls(eintrag);
    const vorhanden = this.profile.get(charakter.charakterKennung)?.skills[skillId];
    const parameter = vorhanden?.parameter ?? defaultParameter(definitionen);
    const einstellung = friereEinstellung({
      freigegeben,
      parameter,
      geaendertAm,
      katalogFingerprintBeiAenderung: katalog.fingerprint
    });

    return this.speichereSkillAenderung(katalog, charakter, eintrag, einstellung, geaendertAm);
  }

  public setzeControlWert(
    katalog: SkillKatalog,
    charakterKontext: SkillPolicyCharakterKontext,
    skillIdRoh: string,
    controlKennungRoh: string,
    wert: number,
    geaendertAm: number
  ): Readonly<SkillPolicyAenderungsErgebnis> {
    const charakter = normalisiereCharakter(charakterKontext);
    const skillId = normalisiereText('skillId', skillIdRoh);
    const controlKennung = normalisiereText('controlKennung', controlKennungRoh);
    pruefeZeitpunkt('geaendertAm', geaendertAm);

    const eintrag = this.konfigurierbarerSkill(katalog, charakter, skillId);
    if (eintrag === null) {
      return this.blockiert(
        charakter,
        skillId,
        'Skill ist fuer diesen Charakter oder den aktuellen Katalog nicht sicher konfigurierbar.'
      );
    }

    const definitionen = holeWirksameSkillPolicyControls(eintrag);
    const definition = definitionen.find((control) => control.kennung === controlKennung);
    if (definition === undefined) {
      return this.blockiert(
        charakter,
        skillId,
        `Unbekanntes oder fuer diesen Skill unpassendes Control: ${controlKennung}.`
      );
    }
    if (!controlWertGueltig(definition, wert)) {
      return this.blockiert(
        charakter,
        skillId,
        `Control ${controlKennung} liegt ausserhalb der erlaubten Grenzen oder passt nicht zum Schritt.`
      );
    }

    const vorhanden = this.profile.get(charakter.charakterKennung)?.skills[skillId];
    const parameter = {
      ...(vorhanden?.parameter ?? defaultParameter(definitionen)),
      [controlKennung]: wert
    };
    const einstellung = friereEinstellung({
      freigegeben: vorhanden?.freigegeben === true,
      parameter,
      geaendertAm,
      katalogFingerprintBeiAenderung: katalog.fingerprint
    });

    return this.speichereSkillAenderung(katalog, charakter, eintrag, einstellung, geaendertAm);
  }

  public setzeSkillZurueck(
    katalog: SkillKatalog,
    charakterKontext: SkillPolicyCharakterKontext,
    skillIdRoh: string,
    geaendertAm: number
  ): Readonly<SkillPolicyAenderungsErgebnis> {
    const charakter = normalisiereCharakter(charakterKontext);
    const skillId = normalisiereText('skillId', skillIdRoh);
    pruefeZeitpunkt('geaendertAm', geaendertAm);
    const eintrag = this.konfigurierbarerSkill(katalog, charakter, skillId);
    if (eintrag === null) {
      return this.blockiert(
        charakter,
        skillId,
        'Skill ist fuer diesen Charakter oder den aktuellen Katalog nicht sicher konfigurierbar.'
      );
    }

    const profil = this.profile.get(charakter.charakterKennung);
    if (profil === undefined || profil.skills[skillId] === undefined) {
      return Object.freeze({
        schemaVersion: SKILL_POLICY_SCHEMA_VERSION,
        status: 'gespeichert' as const,
        grund: 'SkillPolicy war bereits auf sicherem Standardzustand AUS.',
        charakterKennung: charakter.charakterKennung,
        skillId,
        ansicht: this.baueAnsicht(katalog, charakter, eintrag)
      });
    }

    const skills = { ...profil.skills };
    delete skills[skillId];
    const neuesProfil = friereProfil({
      schemaVersion: SKILL_POLICY_SCHEMA_VERSION,
      charakterKennung: charakter.charakterKennung,
      charakterName: charakter.charakterName,
      klasse: charakter.klasse,
      geaendertAm,
      skills
    });

    const kandidaten = new Map(this.profile);
    kandidaten.set(charakter.charakterKennung, neuesProfil);
    const fehler = this.persistiere(kandidaten, geaendertAm);
    if (fehler !== null) return this.blockiert(charakter, skillId, fehler);

    return Object.freeze({
      schemaVersion: SKILL_POLICY_SCHEMA_VERSION,
      status: 'gespeichert' as const,
      grund: 'SkillPolicy wurde auf den sicheren Standardzustand AUS zurueckgesetzt.',
      charakterKennung: charakter.charakterKennung,
      skillId,
      ansicht: this.baueAnsicht(katalog, charakter, eintrag)
    });
  }

  public bewerteAutomatikFreigabe(
    katalog: SkillKatalog,
    charakterKontext: SkillPolicyCharakterKontext,
    skillIdRoh: string
  ): Readonly<SkillPolicyEntscheidung> {
    const charakter = normalisiereCharakter(charakterKontext);
    const skillId = normalisiereText('skillId', skillIdRoh);

    if (!istKatalogKonfigurierbar(katalog)) {
      return this.entscheidung(false, 'katalog_nicht_bereit', katalog, charakter, skillId, {});
    }
    const eintrag = findeSkill(katalog, skillId);
    if (eintrag === null) {
      return this.entscheidung(false, 'skill_unbekannt', katalog, charakter, skillId, {});
    }
    if (!eintrag.automationValidated) {
      return this.entscheidung(false, 'automation_nicht_validiert', katalog, charakter, skillId, {});
    }
    if (eintrag.klassen.length > 0 && !eintrag.klassen.includes(charakter.klasse)) {
      return this.entscheidung(false, 'klasse_passt_nicht', katalog, charakter, skillId, {});
    }
    if (charakter.stufe < (eintrag.stufenVoraussetzung ?? 0)) {
      return this.entscheidung(false, 'level_zu_niedrig', katalog, charakter, skillId, {});
    }

    const ansicht = this.baueAnsicht(katalog, charakter, eintrag);
    if (!ansicht.freigegeben) {
      return this.entscheidung(false, 'skill_policy_aus', katalog, charakter, skillId, {});
    }
    if (ansicht.unbekanntePersistierteControls.length > 0) {
      return this.entscheidung(false, 'unbekannte_persistierte_controls', katalog, charakter, skillId, {});
    }
    if (ansicht.ungueltigePersistierteControls.length > 0) {
      return this.entscheidung(false, 'ungueltige_persistierte_controls', katalog, charakter, skillId, {});
    }

    return this.entscheidung(
      true,
      'erlaubt',
      katalog,
      charakter,
      skillId,
      Object.freeze(Object.fromEntries(ansicht.controls.map((control) => [control.definition.kennung, control.wert])))
    );
  }

  public holeProfil(charakterKennungRoh: string): Readonly<SkillPolicyCharakterProfil> | null {
    const charakterKennung = normalisiereText('charakterKennung', charakterKennungRoh);
    return this.profile.get(charakterKennung) ?? null;
  }

  public status(): Readonly<SkillPolicyStatus> {
    return Object.freeze({
      schemaVersion: SKILL_POLICY_SCHEMA_VERSION,
      profileAnzahl: this.profile.size,
      letzterSpeicherZeitpunkt: this.letzterSpeicherZeitpunkt,
      letzterLadeFehler: this.letzterLadeFehler,
      letzterSpeicherFehler: this.letzterSpeicherFehler,
      speicherSchluessel: this.speicherSchluessel,
      neueSkillsStandardmaessigFreigegeben: false as const,
      userDisableIstHarteSperre: true as const,
      unbekannteControlsFailClosed: true as const,
      aktionsAutoritaet: false as const
    });
  }

  private konfigurierbarerSkill(
    katalog: SkillKatalog,
    charakter: SkillPolicyCharakterKontext,
    skillId: string
  ): SkillKatalogEintrag | null {
    if (!istKatalogKonfigurierbar(katalog)) return null;
    const eintrag = findeSkill(katalog, skillId);
    if (eintrag === null || !eintrag.automationValidated || !skillPasstZuCharakter(eintrag, charakter)) return null;
    return eintrag;
  }

  private baueAnsicht(
    katalog: SkillKatalog,
    charakter: SkillPolicyCharakterKontext,
    eintrag: SkillKatalogEintrag
  ): SkillPolicySkillAnsicht {
    const definitionen = holeWirksameSkillPolicyControls(eintrag);
    const definitionsMap = new Map(definitionen.map((definition) => [definition.kennung, definition] as const));
    const gespeichert = this.profile.get(charakter.charakterKennung)?.skills[eintrag.skillId];
    const gespeicherteParameter = gespeichert?.parameter ?? {};

    const unbekanntePersistierteControls = Object.freeze(
      Object.keys(gespeicherteParameter)
        .filter((kennung) => !definitionsMap.has(kennung as SkillPolicyControlDefinition['kennung']))
        .sort((a, b) => a.localeCompare(b))
    );
    const ungueltigePersistierteControls = Object.freeze(
      definitionen
        .filter((definition) => {
          const wert = gespeicherteParameter[definition.kennung];
          return wert !== undefined && !controlWertGueltig(definition, wert);
        })
        .map((definition) => definition.kennung)
        .sort((a, b) => a.localeCompare(b))
    );

    const controls = Object.freeze(definitionen.map((definition) => {
      const gespeichertWert = gespeicherteParameter[definition.kennung];
      return Object.freeze({
        definition,
        wert: gespeichertWert !== undefined && controlWertGueltig(definition, gespeichertWert)
          ? gespeichertWert
          : definition.standardWert
      });
    }));

    const freigegeben = gespeichert?.freigegeben === true;
    const hartGesperrt =
      !freigegeben ||
      unbekanntePersistierteControls.length > 0 ||
      ungueltigePersistierteControls.length > 0;

    let grund: string;
    if (gespeichert === undefined) grund = 'SkillPolicy ist standardmaessig AUS; neue Skills erhalten keine implizite Automatikfreigabe.';
    else if (!freigegeben) grund = 'SkillPolicy AUS ist eine harte Sperre.';
    else if (unbekanntePersistierteControls.length > 0) grund = 'Unbekannte persistierte Controls sperren den Skill fail-closed.';
    else if (ungueltigePersistierteControls.length > 0) grund = 'Ungueltige persistierte Control-Werte sperren den Skill fail-closed.';
    else grund = 'Nutzer-Policy erlaubt den Skill; technische Readiness und weitere Sicherheitsgates bleiben zusaetzlich erforderlich.';

    return Object.freeze({
      skillId: eintrag.skillId,
      skillName: eintrag.name,
      katalogEintrag: eintrag,
      freigegeben,
      konfiguriert: gespeichert !== undefined,
      controls,
      unbekanntePersistierteControls,
      ungueltigePersistierteControls,
      hartGesperrt,
      grund
    });
  }

  private speichereSkillAenderung(
    katalog: SkillKatalog,
    charakter: SkillPolicyCharakterKontext,
    eintrag: SkillKatalogEintrag,
    einstellung: SkillPolicyPersistierteSkillEinstellung,
    geaendertAm: number
  ): Readonly<SkillPolicyAenderungsErgebnis> {
    const vorhanden = this.profile.get(charakter.charakterKennung);
    const skills = {
      ...(vorhanden?.skills ?? {}),
      [eintrag.skillId]: einstellung
    };
    const profil = friereProfil({
      schemaVersion: SKILL_POLICY_SCHEMA_VERSION,
      charakterKennung: charakter.charakterKennung,
      charakterName: charakter.charakterName,
      klasse: charakter.klasse,
      geaendertAm,
      skills
    });

    const kandidaten = new Map(this.profile);
    kandidaten.set(charakter.charakterKennung, profil);
    const fehler = this.persistiere(kandidaten, geaendertAm);
    if (fehler !== null) return this.blockiert(charakter, eintrag.skillId, fehler);

    return Object.freeze({
      schemaVersion: SKILL_POLICY_SCHEMA_VERSION,
      status: 'gespeichert' as const,
      grund: 'SkillPolicy-Aenderung wurde versioniert persistiert.',
      charakterKennung: charakter.charakterKennung,
      skillId: eintrag.skillId,
      ansicht: this.baueAnsicht(katalog, charakter, eintrag)
    });
  }

  private blockiert(
    charakter: SkillPolicyCharakterKontext,
    skillId: string,
    grund: string
  ): Readonly<SkillPolicyAenderungsErgebnis> {
    return Object.freeze({
      schemaVersion: SKILL_POLICY_SCHEMA_VERSION,
      status: 'blockiert' as const,
      grund,
      charakterKennung: charakter.charakterKennung,
      skillId,
      ansicht: null
    });
  }

  private entscheidung(
    erlaubt: boolean,
    grund: SkillPolicyEntscheidungsGrund,
    katalog: SkillKatalog,
    charakter: SkillPolicyCharakterKontext,
    skillId: string,
    parameter: Readonly<Record<string, number>>
  ): Readonly<SkillPolicyEntscheidung> {
    return Object.freeze({
      schemaVersion: SKILL_POLICY_SCHEMA_VERSION,
      erlaubt,
      grund,
      charakterKennung: charakter.charakterKennung,
      skillId,
      katalogGeneration: katalog.generation,
      katalogFingerprint: katalog.fingerprint,
      parameter,
      aktionsAutoritaet: false as const
    });
  }

  private lade(): void {
    let roh: string | null;
    try {
      roh = this.speicher.getItem(this.speicherSchluessel);
    } catch (fehler) {
      this.letzterLadeFehler = `SkillPolicy-Persistenz konnte nicht gelesen werden: ${fehlerText(fehler)}`;
      return;
    }
    if (roh === null) return;

    try {
      const wert: unknown = JSON.parse(roh);
      if (!istObjekt(wert) || wert.schemaVersion !== SKILL_POLICY_SCHEMA_VERSION) {
        throw new Error('unbekannte SkillPolicy-SchemaVersion');
      }
      if (typeof wert.gespeichertAm !== 'number' || !Number.isFinite(wert.gespeichertAm) || wert.gespeichertAm < 0) {
        throw new Error('ungueltiger gespeichertAm-Wert');
      }
      if (!Array.isArray(wert.profile)) throw new Error('profile muss ein Array sein');

      const geladen = new Map<string, SkillPolicyCharakterProfil>();
      for (const rohProfil of wert.profile) {
        const profil = parseProfil(rohProfil);
        if (profil === null) throw new Error('ungueltiges Charakterprofil');
        if (geladen.has(profil.charakterKennung)) throw new Error('doppelte Charakterkennung');
        geladen.set(profil.charakterKennung, profil);
      }
      this.profile = geladen;
      this.letzterSpeicherZeitpunkt = wert.gespeichertAm;
      this.letzterLadeFehler = null;
    } catch (fehler) {
      this.profile = new Map();
      this.letzterLadeFehler = `SkillPolicy-Persistenz wurde fail-closed verworfen: ${fehlerText(fehler)}`;
    }
  }

  private persistiere(
    kandidaten: Map<string, SkillPolicyCharakterProfil>,
    gespeichertAm: number
  ): string | null {
    const dauerzustand: SkillPolicyDauerzustand = Object.freeze({
      schemaVersion: SKILL_POLICY_SCHEMA_VERSION,
      gespeichertAm,
      profile: Object.freeze([...kandidaten.values()].sort((a, b) =>
        a.charakterKennung.localeCompare(b.charakterKennung)
      ))
    });

    try {
      this.speicher.setItem(this.speicherSchluessel, kanonisiereJson(dauerzustand));
    } catch (fehler) {
      this.letzterSpeicherFehler = `SkillPolicy-Aenderung wurde nicht aktiviert, weil Persistenz fehlschlug: ${fehlerText(fehler)}`;
      return this.letzterSpeicherFehler;
    }

    this.profile = kandidaten;
    this.letzterSpeicherZeitpunkt = gespeichertAm;
    this.letzterSpeicherFehler = null;
    return null;
  }
}
