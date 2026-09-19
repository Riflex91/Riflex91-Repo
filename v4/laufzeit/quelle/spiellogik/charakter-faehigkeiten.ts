import type { SkillPolicyCharakterKontext } from '../vertraege/skill-policy.js';
import type {
  CapabilityAuswertung,
  CharakterFaehigkeiten,
  CharakterSkillFaehigkeit,
  TechnischeSkillAuswertung
} from '../vertraege/charakter-faehigkeiten.js';
import type { GruppenFaehigkeit, GruppenFaehigkeitsProfil } from '../vertraege/gruppen-koordination.js';
import {
  SKILL_CAPABILITY_TAGS,
  type SkillCapabilityTag,
  type SkillKatalog,
  type SkillKatalogEintrag
} from '../vertraege/skill-katalog.js';
import { berechneSha256 } from '../telemetrie/sha256.js';
import { kanonisiereJson } from '../wiederholung/kanonisches-json.js';
import { SkillPolicySpeicher } from './skill-policy.js';
import { AdventureLandSkillTechnikLesezugriff } from '../adventure-land/adventure-land-skill-technik.js';

const GRUPPEN_CAPABILITY_TAGS: Readonly<Record<GruppenFaehigkeit, readonly SkillCapabilityTag[]>> = Object.freeze({
  heilen: Object.freeze([
    'einzelziel-heilung',
    'gruppen-heilung',
    'gruppen-erhaltung'
  ]),
  schaden: Object.freeze([
    'einzelziel-schaden',
    'einzelziel-spitzenschaden',
    'mehrziel-schaden',
    'fernkampf-mehrziel-schaden',
    'variabler-mehrziel-schaden',
    'flaechen-schaden'
  ]),
  aggro: Object.freeze([
    'aggro-kontrolle',
    'flaechen-aggro-kontrolle',
    'pull-kontrolle'
  ]),
  schutz: Object.freeze([
    'persoenlicher-schutz',
    'einzelziel-kontrolle',
    'flaechen-kontrolle'
  ]),
  unterstuetzung: Object.freeze([
    'einzelziel-debuff',
    'gruppen-erhaltung',
    'gruppen-unterstuetzung',
    'gruppen-schadensunterstuetzung',
    'ressourcen-unterstuetzung',
    'mobilitaet',
    'wiederbelebung',
    'nichtkampf-unterstuetzung'
  ])
});

function pruefeZeitpunkt(wert: number): void {
  if (!Number.isFinite(wert) || wert < 0) {
    throw new Error('aufgenommenAm muss eine endliche, nichtnegative Zahl sein.');
  }
}

function normalisiereCharakter(kontext: SkillPolicyCharakterKontext): SkillPolicyCharakterKontext {
  const charakterKennung = kontext.charakterKennung.trim();
  const charakterName = kontext.charakterName.trim();
  const klasse = kontext.klasse.trim().toLowerCase();
  if (charakterKennung.length === 0 || charakterName.length === 0 || klasse.length === 0) {
    throw new Error('CharakterFaehigkeiten benoetigen Kennung, Name und Klasse.');
  }
  if (!Number.isFinite(kontext.stufe) || kontext.stufe < 0) {
    throw new Error('Charakterstufe muss eine endliche, nichtnegative Zahl sein.');
  }
  return Object.freeze({ charakterKennung, charakterName, klasse, stufe: kontext.stufe });
}

function klassenPassend(skill: SkillKatalogEintrag, klasse: string): boolean {
  return skill.klassen.length === 0 || skill.klassen.includes(klasse);
}

function levelPassend(skill: SkillKatalogEintrag, stufe: number): boolean {
  return stufe >= (skill.stufenVoraussetzung ?? 0);
}

function katalogVertrauenswuerdig(katalog: SkillKatalog): boolean {
  return katalog.zustand === 'bereit' &&
    katalog.bestaetigungErforderlich === false &&
    katalog.fingerprint !== null;
}

function nichtStrukturell(
  skill: SkillKatalogEintrag,
  aufgenommenAm: number,
  grund: string
): Readonly<TechnischeSkillAuswertung> {
  return Object.freeze({
    schemaVersion: 1,
    skillId: skill.skillId,
    aufgenommenAm,
    zustand: 'blockiert' as const,
    ausruestungBereit: null,
    materialBereit: null,
    manaBereit: null,
    aktionsBereitschaft: Object.freeze({
      schemaVersion: 1,
      aufgenommenAm,
      aktionsName: skill.skillId,
      zustand: 'unbekannt' as const,
      bereitAb: null,
      restMillisekunden: null,
      grund
    }),
    gruende: Object.freeze([grund]),
    aktionsFreigabe: false as const
  });
}

function policyParameter(
  policy: SkillPolicySpeicher,
  katalog: SkillKatalog,
  charakter: SkillPolicyCharakterKontext,
  skillId: string
): Readonly<Record<string, number>> {
  const ansicht = policy.listeKonfigurierbareSkills(katalog, charakter)
    .find((eintrag) => eintrag.skillId === skillId);
  if (!ansicht) return Object.freeze({});
  return Object.freeze(Object.fromEntries(
    ansicht.controls.map((control) => [control.definition.kennung, control.wert])
  ));
}

function grundFuerSkill(
  skill: SkillKatalogEintrag,
  strukturell: boolean,
  katalogBereit: boolean,
  technischBereit: boolean,
  nutzerFreigegeben: boolean,
  automatisierungKonfiguriert: boolean,
  aktuellAutomatisierbar: boolean,
  technischeAuswertung: TechnischeSkillAuswertung
): string {
  if (!strukturell) return 'Skill ist fuer Klasse oder aktuelle Charakterstufe nicht strukturell verfuegbar.';
  if (!katalogBereit) return 'Skill-Katalog ist nicht vertrauenswuerdig bereit; aktuelle Automatisierung bleibt fail-closed.';
  if (!skill.automationValidated) return skill.validierungsGrund;
  if (!nutzerFreigegeben) return 'SkillPolicy AUS ist eine harte Sperre.';
  if (!automatisierungKonfiguriert) return 'SkillPolicy ist nicht vollstaendig und sicher fuer Automatisierung konfiguriert.';
  if (!technischBereit) return technischeAuswertung.gruende.join(' ') || 'Skill ist aktuell technisch nicht bereit.';
  if (aktuellAutomatisierbar) return 'Skill ist strukturell, technisch und laut Nutzer-Policy aktuell fuer Automatisierung geeignet.';
  return 'Skill bleibt fail-closed.';
}

function maxZielKapazitaet(skills: readonly CharakterSkillFaehigkeit[]): number | null {
  const werte = skills
    .map((skill) => skill.zielKapazitaet)
    .filter((wert): wert is number => wert !== null && Number.isFinite(wert) && wert > 0);
  return werte.length === 0 ? null : Math.max(...werte);
}

function capabilityAuswertungen(skills: readonly CharakterSkillFaehigkeit[]): readonly CapabilityAuswertung[] {
  return Object.freeze(SKILL_CAPABILITY_TAGS.map((capability) => {
    const passende = skills.filter((skill) => skill.capabilityTags.includes(capability));
    return Object.freeze({
      capability,
      strukturellAnzahl: passende.filter((skill) => skill.strukturellVorhanden).length,
      validiertAnzahl: passende.filter((skill) => skill.strukturellVorhanden && skill.automationValidated).length,
      technischBereitAnzahl: passende.filter((skill) => skill.strukturellVorhanden && skill.technischBereit).length,
      nutzerFreigegebenAnzahl: passende.filter((skill) => skill.strukturellVorhanden && skill.vomNutzerFreigegeben).length,
      automatisierungKonfiguriertAnzahl: passende.filter((skill) => skill.automatisierungKonfiguriert).length,
      aktuellAutomatisierbarAnzahl: passende.filter((skill) => skill.aktuellAutomatisierbar).length,
      maximaleZielKapazitaetStrukturell: maxZielKapazitaet(passende.filter((skill) => skill.strukturellVorhanden)),
      maximaleZielKapazitaetAktuell: maxZielKapazitaet(passende.filter((skill) => skill.aktuellAutomatisierbar))
    });
  }));
}

function gruppenProfil(skills: readonly CharakterSkillFaehigkeit[]): GruppenFaehigkeitsProfil {
  const aktuell = skills.filter((skill) => skill.aktuellAutomatisierbar);
  const eintraege = Object.entries(GRUPPEN_CAPABILITY_TAGS).map(([faehigkeit, tags]) => {
    const anzahl = aktuell.filter((skill) => skill.capabilityTags.some((tag) => tags.includes(tag))).length;
    return [faehigkeit, anzahl] as const;
  });
  return Object.freeze(Object.fromEntries(eintraege) as Record<GruppenFaehigkeit, number>);
}

export class CharakterFaehigkeitenResolver {
  private readonly generationen = new Map<string, number>();
  private readonly fingerprints = new Map<string, string>();

  public constructor(
    private readonly policy: SkillPolicySpeicher,
    private readonly technik: AdventureLandSkillTechnikLesezugriff
  ) {}

  public resolve(
    katalog: SkillKatalog,
    charakterKontext: SkillPolicyCharakterKontext,
    aufgenommenAm: number
  ): Readonly<CharakterFaehigkeiten> {
    pruefeZeitpunkt(aufgenommenAm);
    const charakter = normalisiereCharakter(charakterKontext);
    const katalogBereit = katalogVertrauenswuerdig(katalog);
    const profil = this.policy.holeProfil(charakter.charakterKennung);

    const skills = Object.freeze(
      katalog.skills
        .filter((skill) => klassenPassend(skill, charakter.klasse))
        .sort((a, b) =>
          (a.stufenVoraussetzung ?? 0) - (b.stufenVoraussetzung ?? 0) ||
          a.skillId.localeCompare(b.skillId)
        )
        .map((skill): CharakterSkillFaehigkeit => {
          const strukturell = levelPassend(skill, charakter.stufe);
          const technischeAuswertung = strukturell
            ? this.technik.lies(skill, aufgenommenAm)
            : nichtStrukturell(
                skill,
                aufgenommenAm,
                `Charakterstufe ${charakter.stufe} liegt unter der Skill-Voraussetzung ${skill.stufenVoraussetzung ?? 0}.`
              );
          const technischBereit = strukturell && technischeAuswertung.zustand === 'bereit';
          const gespeicherteEinstellung = profil?.skills[skill.skillId];
          const vomNutzerFreigegeben = gespeicherteEinstellung?.freigegeben === true;
          const policyEntscheidung = this.policy.bewerteAutomatikFreigabe(katalog, charakter, skill.skillId);
          const automatisierungKonfiguriert = policyEntscheidung.erlaubt;
          const aktuellAutomatisierbar =
            katalogBereit &&
            skill.automationValidated &&
            strukturell &&
            technischBereit &&
            automatisierungKonfiguriert;
          const parameter = policyEntscheidung.erlaubt
            ? policyEntscheidung.parameter
            : policyParameter(this.policy, katalog, charakter, skill.skillId);

          return Object.freeze({
            schemaVersion: 1,
            skillId: skill.skillId,
            skillName: skill.name,
            capabilityTags: skill.capabilityTags,
            zielKapazitaet: skill.zielKapazitaet,
            strukturellVorhanden: strukturell,
            automationValidated: skill.automationValidated,
            technischBereit,
            vomNutzerFreigegeben,
            automatisierungKonfiguriert,
            aktuellAutomatisierbar,
            parameter,
            technischeAuswertung,
            grund: grundFuerSkill(
              skill,
              strukturell,
              katalogBereit,
              technischBereit,
              vomNutzerFreigegeben,
              automatisierungKonfiguriert,
              aktuellAutomatisierbar,
              technischeAuswertung
            )
          });
        })
    );

    const capabilities = capabilityAuswertungen(skills);
    const gruppenFaehigkeiten = gruppenProfil(skills);
    const fingerprintBasis = {
      schemaVersion: 1,
      charakterKennung: charakter.charakterKennung,
      charakterName: charakter.charakterName,
      klasse: charakter.klasse,
      stufe: charakter.stufe,
      katalogZustand: katalog.zustand,
      katalogGeneration: katalog.generation,
      katalogFingerprint: katalog.fingerprint,
      skills: skills.map((skill) => ({
        skillId: skill.skillId,
        capabilityTags: skill.capabilityTags,
        zielKapazitaet: skill.zielKapazitaet,
        strukturellVorhanden: skill.strukturellVorhanden,
        automationValidated: skill.automationValidated,
        technischerZustand: skill.technischeAuswertung.zustand,
        ausruestungBereit: skill.technischeAuswertung.ausruestungBereit,
        materialBereit: skill.technischeAuswertung.materialBereit,
        manaBereit: skill.technischeAuswertung.manaBereit,
        vomNutzerFreigegeben: skill.vomNutzerFreigegeben,
        automatisierungKonfiguriert: skill.automatisierungKonfiguriert,
        aktuellAutomatisierbar: skill.aktuellAutomatisierbar,
        parameter: skill.parameter
      })),
      gruppenFaehigkeiten
    };
    const fingerprint = berechneSha256(kanonisiereJson(fingerprintBasis));
    const vorherigerFingerprint = this.fingerprints.get(charakter.charakterKennung);
    let generation = this.generationen.get(charakter.charakterKennung) ?? 0;
    if (vorherigerFingerprint !== fingerprint) generation += 1;
    if (generation === 0) generation = 1;
    this.fingerprints.set(charakter.charakterKennung, fingerprint);
    this.generationen.set(charakter.charakterKennung, generation);

    return Object.freeze({
      schemaVersion: 1,
      aufgenommenAm,
      charakterKennung: charakter.charakterKennung,
      charakterName: charakter.charakterName,
      klasse: charakter.klasse,
      stufe: charakter.stufe,
      generation,
      fingerprint,
      katalogZustand: katalog.zustand,
      katalogGeneration: katalog.generation,
      katalogFingerprint: katalog.fingerprint,
      katalogVertrauenswuerdig: katalogBereit,
      skills,
      capabilities,
      gruppenFaehigkeiten,
      aktionsAutoritaet: false as const
    });
  }
}

export { GRUPPEN_CAPABILITY_TAGS };
