import { AdventureLandLesezugriff } from './adventure-land-lesezugriff.js';
import type { AdventureLandDatenQuelle, GelesenerAdventureLandWert } from './adventure-land-lesezugriff.js';
import { berechneSha256 } from '../telemetrie/sha256.js';
import { kanonisiereJson } from '../wiederholung/kanonisches-json.js';
import {
  SKILL_KATALOG_QUELLE,
  SKILL_KATALOG_SCHEMA_VERSION,
  type SkillCapabilityTag,
  type SkillKatalog,
  type SkillKatalogEintrag,
  type SkillKatalogZustand,
  type SkillSlotVoraussetzung
} from '../vertraege/skill-katalog.js';

type RohObjekt = Readonly<Record<string, unknown>>;
type Regel = Readonly<{
  klassen: readonly string[];
  tags: readonly SkillCapabilityTag[];
  gleich?: Readonly<Record<string, unknown>>;
  listen?: Readonly<Record<string, readonly string[]>>;
  zielKapazitaetFallback?: number;
}>;

const BEKANNTE_FELDER = Object.freeze(new Set([
  'action', 'apiercing', 'armor_cap', 'armor_multiplier', 'aura', 'class', 'code', 'complementary',
  'condition', 'consume', 'cooldown', 'cooldown_multiplier', 'damage', 'damage_multiplier', 'damage_type',
  'default_state', 'duration', 'duration_max', 'duration_min', 'emote', 'exclusive_condition', 'explanation',
  'fixed_range', 'global', 'heal', 'hostile', 'inventory', 'kill_buff', 'level', 'levels', 'link_range',
  'list', 'max', 'max_targets', 'merchant_use', 'monsters', 'mp', 'mp_return_levels', 'multi', 'name',
  'negative', 'no_reflection', 'no_self', 'nprop', 'offhand_type', 'output', 'party', 'passive', 'persistent',
  'pierces_immunity', 'positive', 'procs', 'projectile', 'range', 'range_bonus', 'range_multiplier',
  'rank_levels', 'ratio', 'requirements', 'reuse_cooldown', 'rpiercing', 'set_speed', 'share', 'skin', 'skins',
  'slot', 'states', 'target', 'toggle', 'type', 'ui', 'use_range', 'variance', 'warning', 'wtype'
]));

const REGELN: Readonly<Record<string, Regel>> = Object.freeze({
  heal: { klassen: ['priest'], tags: ['einzelziel-heilung'], gleich: { heal: true, target: true, share: 'attack' } },
  partyheal: { klassen: ['priest'], tags: ['gruppen-heilung', 'gruppen-erhaltung'], gleich: { heal: true, party: true, multi: true } },
  cleave: { klassen: ['warrior'], tags: ['flaechen-schaden', 'mehrziel-schaden'], gleich: { hostile: true }, listen: { wtype: ['axe', 'scythe'] } },
  stomp: { klassen: ['warrior'], tags: ['flaechen-kontrolle'], gleich: { hostile: true, condition: 'stunned' }, listen: { wtype: ['basher'] } },
  agitate: { klassen: ['warrior'], tags: ['flaechen-aggro-kontrolle', 'pull-kontrolle'], gleich: { hostile: true } },
  taunt: { klassen: ['warrior'], tags: ['aggro-kontrolle'], gleich: { hostile: true, target: true } },
  hardshell: { klassen: ['warrior'], tags: ['persoenlicher-schutz'], gleich: { condition: 'hardshell' } },
  '3shot': { klassen: ['ranger'], tags: ['mehrziel-schaden', 'fernkampf-mehrziel-schaden'], gleich: { multi: true, hostile: true, share: 'attack' }, listen: { wtype: ['bow', 'crossbow'] }, zielKapazitaetFallback: 3 },
  '5shot': { klassen: ['ranger'], tags: ['mehrziel-schaden', 'fernkampf-mehrziel-schaden'], gleich: { multi: true, hostile: true, share: 'attack' }, listen: { wtype: ['bow', 'crossbow'] }, zielKapazitaetFallback: 5 },
  supershot: { klassen: ['ranger'], tags: ['einzelziel-spitzenschaden'], gleich: { target: true, hostile: true } },
  huntersmark: { klassen: ['ranger'], tags: ['einzelziel-debuff'], gleich: { target: true, hostile: true, condition: 'marked' } },
  fanofknives: { klassen: ['rogue'], tags: ['mehrziel-schaden'], gleich: { multi: true, hostile: true } },
  cburst: { klassen: ['mage'], tags: ['mehrziel-schaden', 'variabler-mehrziel-schaden'], gleich: { list: true, hostile: true } },
  burst: { klassen: ['mage'], tags: ['einzelziel-spitzenschaden'], gleich: { target: true, hostile: true } },
  energize: { klassen: ['mage'], tags: ['ressourcen-unterstuetzung', 'gruppen-unterstuetzung'], gleich: { target: 'player' } },
  darkblessing: { klassen: ['priest'], tags: ['gruppen-schadensunterstuetzung'], gleich: { condition: 'darkblessing' } },
  absorb: { klassen: ['priest'], tags: ['aggro-kontrolle', 'gruppen-unterstuetzung'], gleich: { target: 'player' } },
  revive: { klassen: ['priest'], tags: ['wiederbelebung'], gleich: { target: 'player', consume: 'essenceoflife' } },
  mshield: { klassen: ['paladin'], tags: ['persoenlicher-schutz'], gleich: { toggle: true, condition: 'mshield' } },
  mluck: { klassen: ['merchant'], tags: ['nichtkampf-unterstuetzung'], gleich: { target: 'player' } }
});

function istObjekt(wert: unknown): wert is RohObjekt {
  return typeof wert === 'object' && wert !== null && !Array.isArray(wert);
}

function fehlerText(fehler: unknown): string {
  return fehler instanceof Error ? fehler.message : String(fehler);
}

function waehleFenster(spielFenster: object): object {
  try {
    if ('G' in spielFenster) return spielFenster;
    const parent = Reflect.get(spielFenster, 'parent');
    if (istObjekt(parent) && parent !== spielFenster) return parent;
  } catch {
    // Fail-closed ueber den direkten Kontext.
  }
  return spielFenster;
}

function friereTief<T>(wert: T): T {
  if ((typeof wert !== 'object' && typeof wert !== 'function') || wert === null || Object.isFrozen(wert)) return wert;
  for (const unterWert of Object.values(wert as Readonly<Record<string, unknown>>)) friereTief(unterWert);
  return Object.freeze(wert);
}

function text(wert: unknown): string | null {
  if (typeof wert !== 'string') return null;
  const normalisiert = wert.trim();
  return normalisiert.length > 0 ? normalisiert : null;
}

function zahl(wert: unknown): number | null {
  return typeof wert === 'number' && Number.isFinite(wert) && wert >= 0 ? (Object.is(wert, -0) ? 0 : wert) : null;
}

function positiveGanzzahl(wert: unknown): number | null {
  const normalisiert = zahl(wert);
  return normalisiert !== null && normalisiert > 0 ? Math.floor(normalisiert) : null;
}

function texte(wert: unknown): readonly string[] {
  const roh = Array.isArray(wert) ? wert : wert === undefined || wert === null || wert === false ? [] : [wert];
  return Object.freeze([...new Set(roh.map(text).filter((eintrag): eintrag is string => eintrag !== null))].sort((a, b) => a.localeCompare(b)));
}

function klassen(wert: unknown): readonly string[] {
  return Object.freeze(texte(wert).map((eintrag) => eintrag.toLowerCase()).sort((a, b) => a.localeCompare(b)));
}

function slots(wert: unknown): readonly SkillSlotVoraussetzung[] {
  if (!Array.isArray(wert)) return Object.freeze([]);
  const gesehen = new Set<string>();
  const ausgabe: SkillSlotVoraussetzung[] = [];
  for (const roh of wert) {
    if (!Array.isArray(roh) || roh.length < 2) continue;
    const slot = text(roh[0]);
    const gegenstand = text(roh[1]);
    if (slot === null || gegenstand === null) continue;
    const kennung = `${slot}\u0000${gegenstand}`;
    if (!gesehen.has(kennung)) {
      gesehen.add(kennung);
      ausgabe.push(Object.freeze({ slot, gegenstand }));
    }
  }
  return Object.freeze(ausgabe.sort((a, b) => a.slot.localeCompare(b.slot) || a.gegenstand.localeCompare(b.gegenstand)));
}

function anforderungen(wert: unknown): Readonly<Record<string, string | number | boolean>> {
  if (!istObjekt(wert)) return Object.freeze({});
  const paare: [string, string | number | boolean][] = [];
  for (const [name, roh] of Object.entries(wert).sort(([a], [b]) => a.localeCompare(b))) {
    if (typeof roh === 'string' || typeof roh === 'boolean') paare.push([name, roh]);
    else if (typeof roh === 'number' && Number.isFinite(roh)) paare.push([name, Object.is(roh, -0) ? 0 : roh]);
  }
  return Object.freeze(Object.fromEntries(paare));
}

function fingerprint(wert: unknown): string {
  return berechneSha256(kanonisiereJson(wert));
}

function pruefeRegel(skill: RohObjekt, regel: Regel): readonly string[] {
  const fehler: string[] = [];
  const beobachteteKlassen = klassen(skill.class);
  for (const klasse of regel.klassen) if (!beobachteteKlassen.includes(klasse)) fehler.push(`Erwartete Klasse fehlt: ${klasse}.`);
  for (const [feld, erwartet] of Object.entries(regel.gleich ?? {})) if (skill[feld] !== erwartet) fehler.push(`Erwartete Semantik fehlt: ${feld}.`);
  for (const [feld, erwartet] of Object.entries(regel.listen ?? {})) {
    const beobachtet = texte(skill[feld]);
    if (!erwartet.every((eintrag) => beobachtet.includes(eintrag))) fehler.push(`Erwartete Listen-Semantik fehlt: ${feld}.`);
  }
  return Object.freeze(fehler);
}

function beobachteteTags(skill: RohObjekt): readonly SkillCapabilityTag[] {
  const tags = new Set<SkillCapabilityTag>();
  if (skill.heal === true && (skill.party === true || skill.multi === true)) {
    tags.add('gruppen-heilung');
    tags.add('gruppen-erhaltung');
  } else if (skill.heal === true) tags.add('einzelziel-heilung');
  if (skill.hostile === true && (skill.multi === true || skill.list === true)) tags.add('mehrziel-schaden');
  else if (skill.hostile === true && (skill.target === true || typeof skill.target === 'string')) tags.add('einzelziel-schaden');
  if (skill.party === true || skill.aura === true) tags.add('gruppen-unterstuetzung');
  return Object.freeze([...tags].sort((a, b) => a.localeCompare(b)));
}

function normalisiereSkill(skillId: string, skill: RohObjekt): Readonly<SkillKatalogEintrag> {
  const regel = REGELN[skillId];
  const neueFelder = Object.freeze(Object.keys(skill).filter((name) => !BEKANNTE_FELDER.has(name)).sort((a, b) => a.localeCompare(b)));
  const regelFehler = regel === undefined ? Object.freeze([] as string[]) : pruefeRegel(skill, regel);
  const automationValidated = regel !== undefined && regelFehler.length === 0 && neueFelder.length === 0;
  const capabilityTags = Object.freeze([...new Set<SkillCapabilityTag>([...(regel?.tags ?? []), ...beobachteteTags(skill)])].sort((a, b) => a.localeCompare(b)));
  const zielKapazitaet = positiveGanzzahl(skill.max_targets) ?? (regel !== undefined && skill.multi === true ? regel.zielKapazitaetFallback ?? null : null);
  const validierungsGrund = regel === undefined
    ? 'Fuer diese Skill-ID existiert noch keine explizite V4-Automationsvalidierung.'
    : neueFelder.length > 0
      ? `Bekannte Skill-ID enthaelt neue, noch nicht validierte Adventure-Land-Felder: ${neueFelder.join(', ')}.`
      : regelFehler.length > 0
        ? `Explizite V4-Semantikvalidierung fehlgeschlagen: ${regelFehler.join(' ')}`
        : 'Explizite V4-Semantikvalidierung bestanden.';

  const basis = {
    schemaVersion: SKILL_KATALOG_SCHEMA_VERSION,
    skillId,
    name: text(skill.name),
    art: text(skill.type),
    klassen: klassen(skill.class),
    stufenVoraussetzung: zahl(skill.level),
    manaKosten: zahl(skill.mp),
    cooldownMillisekunden: zahl(skill.cooldown),
    wiederverwendungsCooldownMillisekunden: zahl(skill.reuse_cooldown),
    reichweite: zahl(skill.range),
    reichweitenMultiplikator: zahl(skill.range_multiplier),
    reichweitenBonus: zahl(skill.range_bonus),
    schadensWert: zahl(skill.damage),
    schadensMultiplikator: zahl(skill.damage_multiplier),
    cooldownMultiplikator: zahl(skill.cooldown_multiplier),
    zielKapazitaet,
    ausruestung: { waffenTypen: texte(skill.wtype), nebenhandTyp: text(skill.offhand_type), slots: slots(skill.slot) },
    materialien: { verbrauch: text(skill.consume), inventar: texte(skill.inventory), anforderungen: anforderungen(skill.requirements) },
    merkmale: {
      mehrziel: skill.multi === true,
      zielListe: skill.list === true,
      gruppe: skill.party === true,
      aura: skill.aura === true,
      heilung: skill.heal === true,
      feindlich: skill.hostile === true,
      passiv: skill.passive === true,
      umschaltbar: skill.toggle === true,
      zielModus: typeof skill.target === 'boolean' || typeof skill.target === 'string' ? skill.target : null,
      geteilterCooldown: text(skill.share),
      bedingung: text(skill.condition),
      schadensArt: text(skill.damage_type),
      procs: typeof skill.procs === 'boolean' ? skill.procs : null,
      immunitaetDurchdringen: typeof skill.pierces_immunity === 'boolean' ? skill.pierces_immunity : null
    },
    capabilityTags,
    technischeReadiness: {
      zustand: 'unbekannt' as const,
      grund: 'Charakterbezogene technische Readiness wird erst aus Live-Charakterzustand, Voraussetzungen und SkillPolicy abgeleitet.',
      aktionsFreigabe: false as const
    },
    automationValidated,
    validierungsGrund,
    unbekannteRohFelder: neueFelder
  };
  return friereTief({
    ...basis,
    fachlicherFingerprint: fingerprint({ ...basis, technischeReadiness: { zustand: 'unbekannt', aktionsFreigabe: false } })
  });
}

function skillsAusG(spielDaten: GelesenerAdventureLandWert): RohObjekt {
  if (spielDaten.lesefehler !== null) throw new Error(`Adventure Land G konnte nicht gelesen werden: ${spielDaten.lesefehler}`);
  if (!spielDaten.vorhanden) throw new Error('Adventure Land hat G nicht geliefert.');
  if (!istObjekt(spielDaten.wert)) throw new Error('Adventure Land G hat einen unerwarteten Typ.');
  const skills = spielDaten.wert.skills;
  if (!istObjekt(skills)) throw new Error('Adventure Land G.skills fehlt oder hat einen unerwarteten Typ.');
  if (Object.keys(skills).length === 0) throw new Error('Adventure Land G.skills ist leer.');
  return skills;
}

function normalisiereSkills(skills: RohObjekt): readonly SkillKatalogEintrag[] {
  const ausgabe: SkillKatalogEintrag[] = [];
  for (const [rohId, rohSkill] of Object.entries(skills).sort(([a], [b]) => a.localeCompare(b))) {
    const skillId = rohId.trim();
    if (skillId.length === 0) throw new Error('G.skills enthaelt eine leere Skill-ID.');
    if (!istObjekt(rohSkill)) throw new Error(`G.skills.${skillId} hat einen unerwarteten Typ.`);
    ausgabe.push(normalisiereSkill(skillId, rohSkill));
  }
  return Object.freeze(ausgabe);
}

export class AdventureLandSkillKatalogLesequelle {
  private generation = 0;
  private zustand: SkillKatalogZustand = 'blockiert';
  private grund: string | null = 'Noch kein gueltiger Live-Skill-Katalog beobachtet.';
  private fingerprint: string | null = null;
  private vorherigerFingerprint: string | null = null;
  private letzteSkills: readonly SkillKatalogEintrag[] = Object.freeze([]);
  private letzteFehler: readonly string[] = Object.freeze([]);
  private bestaetigungErforderlich = true;
  private letzteAufnahme = 0;

  public constructor(private readonly datenQuelle: AdventureLandDatenQuelle) {}

  public static fuerSpielFenster(spielFenster: object): AdventureLandSkillKatalogLesequelle {
    return new AdventureLandSkillKatalogLesequelle(new AdventureLandLesezugriff(waehleFenster(spielFenster)));
  }

  public liesKatalog(aufgenommenAm: number): Readonly<SkillKatalog> {
    if (!Number.isFinite(aufgenommenAm) || aufgenommenAm < 0) throw new Error('aufgenommenAm muss eine endliche, nichtnegative Zahl sein.');
    this.letzteAufnahme = aufgenommenAm;
    let eintraege: readonly SkillKatalogEintrag[];
    try {
      eintraege = normalisiereSkills(skillsAusG(this.datenQuelle.liesRohdaten().spielDaten));
    } catch (fehler) {
      return this.blockiere(`Adventure-Land-Skilldaten konnten nicht sicher gelesen oder normalisiert werden: ${fehlerText(fehler)}`);
    }

    const neuerFingerprint = fingerprint(eintraege.map((skill) => [skill.skillId, skill.fachlicherFingerprint]));
    const semantikDrift = eintraege.filter((skill) => REGELN[skill.skillId] !== undefined && skill.automationValidated !== true);
    const warBlockiertMitHistorie = this.zustand === 'blockiert' && this.fingerprint !== null;
    this.letzteSkills = eintraege;
    this.letzteFehler = Object.freeze([]);

    if (this.fingerprint === null) {
      this.fingerprint = neuerFingerprint;
      this.generation = 1;
      this.vorherigerFingerprint = null;
      if (semantikDrift.length > 0) this.setzeDrift(`Explizit bekannte Skill-Semantik weicht ab: ${semantikDrift.map((skill) => skill.skillId).join(', ')}.`);
      else this.setzeBereit();
      return this.status();
    }

    if (this.fingerprint !== neuerFingerprint) {
      this.vorherigerFingerprint = this.fingerprint;
      this.fingerprint = neuerFingerprint;
      this.generation += 1;
      this.setzeDrift(semantikDrift.length > 0
        ? `Live-Skill-Katalog und explizit bekannte Skill-Semantik haben sich geaendert: ${semantikDrift.map((skill) => skill.skillId).join(', ')}.`
        : 'Der fachliche Live-Skill-Katalog hat sich gegenueber der vorherigen Generation geaendert.');
      return this.status();
    }

    if (semantikDrift.length > 0) this.setzeDrift(`Explizit bekannte Skill-Semantik weicht ab: ${semantikDrift.map((skill) => skill.skillId).join(', ')}.`);
    else if (warBlockiertMitHistorie) {
      this.zustand = 'veraltet';
      this.grund = 'Die Live-Lesequelle ist wieder verfuegbar; vor erneuter Bereitschaft ist eine ausdrueckliche Revalidierung erforderlich.';
      this.bestaetigungErforderlich = true;
    }
    return this.status();
  }

  public markiereVeraltet(grund: string): Readonly<SkillKatalog> {
    const normalisiert = grund.trim();
    if (normalisiert.length === 0) throw new Error('Ein veralteter Skill-Katalog benoetigt einen Grund.');
    this.zustand = this.fingerprint === null ? 'blockiert' : 'veraltet';
    this.grund = normalisiert;
    this.bestaetigungErforderlich = true;
    return this.status();
  }

  public bestaetigeAktuellenFingerprint(erwarteterFingerprint: string): Readonly<SkillKatalog> {
    if (this.fingerprint === null || erwarteterFingerprint.trim() !== this.fingerprint) throw new Error('Der zu bestaetigende Skill-Katalog-Fingerprint passt nicht zum aktuell beobachteten Katalog.');
    if (this.letzteFehler.length > 0 || this.letzteSkills.length === 0) throw new Error('Ein blockierter oder leerer Skill-Katalog kann nicht bestaetigt werden.');
    const semantikDrift = this.letzteSkills.filter((skill) => REGELN[skill.skillId] !== undefined && skill.automationValidated !== true);
    if (semantikDrift.length > 0) throw new Error(`Skill-Katalog kann wegen ungepruefter Semantik nicht bereit werden: ${semantikDrift.map((skill) => skill.skillId).join(', ')}.`);
    this.setzeBereit();
    return this.status();
  }

  public status(): Readonly<SkillKatalog> {
    return friereTief({
      schemaVersion: SKILL_KATALOG_SCHEMA_VERSION,
      quelle: SKILL_KATALOG_QUELLE,
      aufgenommenAm: this.letzteAufnahme,
      generation: this.generation,
      zustand: this.zustand,
      grund: this.grund,
      fingerprint: this.fingerprint,
      vorherigerFingerprint: this.vorherigerFingerprint,
      skills: this.zustand === 'blockiert' ? Object.freeze([]) : this.letzteSkills,
      automationValidatedAnzahl: this.zustand === 'blockiert' ? 0 : this.letzteSkills.filter((skill) => skill.automationValidated).length,
      fehler: this.letzteFehler,
      bestaetigungErforderlich: this.bestaetigungErforderlich,
      spielAutoritaet: false as const
    });
  }

  private setzeBereit(): void {
    this.zustand = 'bereit';
    this.grund = null;
    this.bestaetigungErforderlich = false;
  }

  private setzeDrift(grund: string): void {
    this.zustand = 'drift';
    this.grund = grund;
    this.bestaetigungErforderlich = true;
  }

  private blockiere(fehler: string): Readonly<SkillKatalog> {
    this.zustand = 'blockiert';
    this.grund = fehler;
    this.letzteFehler = Object.freeze([fehler]);
    this.bestaetigungErforderlich = true;
    return this.status();
  }
}

export const SKILL_KATALOG_EXPLIZIT_VALIDIERTE_IDS = Object.freeze(Object.keys(REGELN).sort((a, b) => a.localeCompare(b)));
