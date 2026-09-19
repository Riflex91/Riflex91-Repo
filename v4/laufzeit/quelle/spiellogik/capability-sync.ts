import {
  CAPABILITY_SYNC_MAX_PARAMETER_PRO_SKILL,
  CAPABILITY_SYNC_MAX_SKILLS,
  CAPABILITY_SYNC_MAX_TAGS_PRO_SKILL,
  type CapabilitySyncBauEingabe,
  type CapabilitySyncBauErgebnis,
  type CapabilitySyncEmpfang,
  type CapabilitySyncSkillSnapshot,
  type CapabilitySyncSnapshot,
  type CapabilitySyncVertrauensEingabe,
  type RemoteCapabilityVertrauensPruefung
} from '../vertraege/capability-sync.js';
import type { CharakterFaehigkeiten, CharakterSkillFaehigkeit } from '../vertraege/charakter-faehigkeiten.js';
import { GRUPPEN_FAEHIGKEITEN, type GruppenFaehigkeitsProfil } from '../vertraege/gruppen-koordination.js';
import { SKILL_CAPABILITY_TAGS, type SkillCapabilityTag } from '../vertraege/skill-katalog.js';

type RohObjekt = Readonly<Record<string, unknown>>;

const SHA256 = /^[a-f0-9]{64}$/;

function istObjekt(wert: unknown): wert is RohObjekt {
  return typeof wert === 'object' && wert !== null && !Array.isArray(wert);
}

function saubererText(wert: unknown): string | null {
  if (typeof wert !== 'string') return null;
  const text = wert.trim();
  return text.length > 0 ? text : null;
}

function positiveSichereGanzzahl(wert: unknown): number | null {
  return typeof wert === 'number' && Number.isSafeInteger(wert) && wert > 0 ? wert : null;
}

function nichtnegativeSichereGanzzahl(wert: unknown): number | null {
  return typeof wert === 'number' && Number.isSafeInteger(wert) && wert >= 0 ? wert : null;
}

function endlicheNichtnegativeZahl(wert: unknown): number | null {
  return typeof wert === 'number' && Number.isFinite(wert) && wert >= 0 ? wert : null;
}

function istCapabilityTag(wert: unknown): wert is SkillCapabilityTag {
  return typeof wert === 'string' && (SKILL_CAPABILITY_TAGS as readonly string[]).includes(wert);
}

function sortiereTags(tags: readonly SkillCapabilityTag[]): readonly SkillCapabilityTag[] {
  return Object.freeze([...new Set(tags)].sort((a, b) => a.localeCompare(b)));
}

function normalisiereParameter(
  parameter: Readonly<Record<string, number>>
): Readonly<Record<string, number>> | null {
  const eintraege = Object.entries(parameter).sort(([a], [b]) => a.localeCompare(b));
  if (eintraege.length > CAPABILITY_SYNC_MAX_PARAMETER_PRO_SKILL) return null;
  const normalisiert: Array<readonly [string, number]> = [];
  for (const [kennungRoh, wert] of eintraege) {
    const kennung = kennungRoh.trim();
    if (kennung.length === 0 || !Number.isFinite(wert)) return null;
    normalisiert.push([kennung, Object.is(wert, -0) ? 0 : wert]);
  }
  return Object.freeze(Object.fromEntries(normalisiert));
}

function baueSkillSnapshot(skill: CharakterSkillFaehigkeit): CapabilitySyncSkillSnapshot | null {
  if (!skill.automationValidated || !skill.strukturellVorhanden) return null;
  const tags = sortiereTags(skill.capabilityTags);
  if (tags.length > CAPABILITY_SYNC_MAX_TAGS_PRO_SKILL) return null;
  const parameter = normalisiereParameter(skill.parameter);
  if (parameter === null) return null;

  const zielKapazitaet =
    skill.zielKapazitaet === null
      ? null
      : positiveSichereGanzzahl(skill.zielKapazitaet);
  if (skill.zielKapazitaet !== null && zielKapazitaet === null) return null;

  return Object.freeze({
    skillId: skill.skillId,
    capabilityTags: tags,
    zielKapazitaet,
    enabled: skill.vomNutzerFreigegeben,
    configuredReady: skill.automatisierungKonfiguriert,
    aktuellAutomatisierbar: skill.aktuellAutomatisierbar,
    parameter
  });
}

function gruppenProfilGueltig(wert: unknown): wert is GruppenFaehigkeitsProfil {
  if (!istObjekt(wert)) return false;
  return GRUPPEN_FAEHIGKEITEN.every((faehigkeit) => {
    const zahl = wert[faehigkeit];
    return typeof zahl === 'number' && Number.isFinite(zahl) && zahl >= 0;
  });
}

function cloneGruppenProfil(profil: GruppenFaehigkeitsProfil): GruppenFaehigkeitsProfil {
  return Object.freeze(Object.fromEntries(
    GRUPPEN_FAEHIGKEITEN.map((faehigkeit) => [faehigkeit, profil[faehigkeit]])
  ) as Record<(typeof GRUPPEN_FAEHIGKEITEN)[number], number>);
}

function blockierterBau(...gruende: readonly string[]): CapabilitySyncBauErgebnis {
  return Object.freeze({
    schemaVersion: 1,
    status: 'blockiert' as const,
    gruende: Object.freeze([...gruende]),
    snapshot: null
  });
}

export function erstelleCapabilitySyncSnapshot(
  faehigkeiten: CharakterFaehigkeiten,
  eingabe: CapabilitySyncBauEingabe
): CapabilitySyncBauErgebnis {
  const lebensnachweis = eingabe.lebensnachweis;
  const gruende: string[] = [];

  if (!faehigkeiten.katalogVertrauenswuerdig || faehigkeiten.katalogZustand !== 'bereit' || faehigkeiten.katalogFingerprint === null) {
    gruende.push('Lokale CharakterFaehigkeiten basieren nicht auf einem vertrauenswuerdig bereiten Katalog.');
  }
  if (!SHA256.test(faehigkeiten.fingerprint)) gruende.push('Capability-Fingerprint ist kein gueltiger SHA-256.');
  if (faehigkeiten.charakterKennung !== lebensnachweis.charakterKennung) {
    gruende.push('Capability-Charakterkennung stimmt nicht mit dem Lebensnachweis ueberein.');
  }
  if (faehigkeiten.charakterName !== lebensnachweis.charakterName) {
    gruende.push('Capability-Charaktername stimmt nicht mit dem Lebensnachweis ueberein.');
  }
  if (faehigkeiten.klasse !== lebensnachweis.klasse) {
    gruende.push('Capability-Klasse stimmt nicht mit dem Lebensnachweis ueberein.');
  }
  if (!Number.isFinite(lebensnachweis.gesendetAm) || lebensnachweis.gesendetAm < 0) {
    gruende.push('Lebensnachweis-Zeitpunkt ist ungueltig.');
  }
  if (!Number.isSafeInteger(lebensnachweis.laufendeNummer) || lebensnachweis.laufendeNummer < 0) {
    gruende.push('Lebensnachweis-Laufnummer ist ungueltig.');
  }

  const skills: CapabilitySyncSkillSnapshot[] = [];
  for (const skill of faehigkeiten.skills) {
    if (!skill.automationValidated || !skill.strukturellVorhanden) continue;
    const snapshot = baueSkillSnapshot(skill);
    if (snapshot === null) {
      gruende.push(`Validierter Skill ${skill.skillId} ueberschreitet die bounded Capability-Snapshot-Grenzen.`);
      continue;
    }
    skills.push(snapshot);
  }
  skills.sort((a, b) => a.skillId.localeCompare(b.skillId));
  if (skills.length > CAPABILITY_SYNC_MAX_SKILLS) {
    gruende.push(`Capability-Snapshot enthaelt mehr als ${CAPABILITY_SYNC_MAX_SKILLS} validierte Skills.`);
  }

  if (gruende.length > 0 || faehigkeiten.katalogFingerprint === null) {
    return blockierterBau(...gruende);
  }

  const snapshot: CapabilitySyncSnapshot = Object.freeze({
    schemaVersion: 1,
    charakterKennung: faehigkeiten.charakterKennung,
    charakterName: faehigkeiten.charakterName,
    klasse: faehigkeiten.klasse,
    stufe: faehigkeiten.stufe,
    generation: faehigkeiten.generation,
    fingerprint: faehigkeiten.fingerprint,
    katalogZustand: 'bereit' as const,
    katalogGeneration: faehigkeiten.katalogGeneration,
    katalogFingerprint: faehigkeiten.katalogFingerprint,
    lebensnachweisGesendetAm: lebensnachweis.gesendetAm,
    lebensnachweisLaufendeNummer: lebensnachweis.laufendeNummer,
    skills: Object.freeze(skills),
    gruppenFaehigkeiten: cloneGruppenProfil(faehigkeiten.gruppenFaehigkeiten),
    aktionsAutoritaet: false as const
  });

  return Object.freeze({
    schemaVersion: 1,
    status: 'bereit' as const,
    gruende: Object.freeze([]),
    snapshot
  });
}

function liesSkillSnapshot(wert: unknown): CapabilitySyncSkillSnapshot | null {
  if (!istObjekt(wert)) return null;
  const skillId = saubererText(wert.skillId);
  if (skillId === null || !Array.isArray(wert.capabilityTags) || wert.capabilityTags.length > CAPABILITY_SYNC_MAX_TAGS_PRO_SKILL) return null;
  const tags = wert.capabilityTags;
  if (!tags.every(istCapabilityTag) || new Set(tags).size !== tags.length) return null;
  if (
    wert.zielKapazitaet !== null &&
    positiveSichereGanzzahl(wert.zielKapazitaet) === null
  ) return null;
  if (
    typeof wert.enabled !== 'boolean' ||
    typeof wert.configuredReady !== 'boolean' ||
    typeof wert.aktuellAutomatisierbar !== 'boolean'
  ) return null;
  if (!istObjekt(wert.parameter)) return null;
  const parameter = normalisiereParameter(
    Object.fromEntries(
      Object.entries(wert.parameter).map(([kennung, parameterWert]) => [kennung, parameterWert])
    ) as Record<string, number>
  );
  if (parameter === null || Object.values(wert.parameter).some((parameterWert) => typeof parameterWert !== 'number')) return null;

  return Object.freeze({
    skillId,
    capabilityTags: Object.freeze([...tags] as SkillCapabilityTag[]),
    zielKapazitaet: wert.zielKapazitaet as number | null,
    enabled: wert.enabled,
    configuredReady: wert.configuredReady,
    aktuellAutomatisierbar: wert.aktuellAutomatisierbar,
    parameter
  });
}

export function liesCapabilitySyncSnapshot(wert: unknown): CapabilitySyncSnapshot | null {
  if (!istObjekt(wert) || wert.schemaVersion !== 1) return null;
  const charakterKennung = saubererText(wert.charakterKennung);
  const charakterName = saubererText(wert.charakterName);
  const klasse = saubererText(wert.klasse);
  if (charakterKennung === null || charakterName === null || klasse === null) return null;
  if (endlicheNichtnegativeZahl(wert.stufe) === null) return null;
  if (positiveSichereGanzzahl(wert.generation) === null) return null;
  if (typeof wert.fingerprint !== 'string' || !SHA256.test(wert.fingerprint)) return null;
  if (wert.katalogZustand !== 'bereit') return null;
  if (positiveSichereGanzzahl(wert.katalogGeneration) === null) return null;
  if (typeof wert.katalogFingerprint !== 'string' || !SHA256.test(wert.katalogFingerprint)) return null;
  if (endlicheNichtnegativeZahl(wert.lebensnachweisGesendetAm) === null) return null;
  if (nichtnegativeSichereGanzzahl(wert.lebensnachweisLaufendeNummer) === null) return null;
  if (!Array.isArray(wert.skills) || wert.skills.length > CAPABILITY_SYNC_MAX_SKILLS) return null;
  if (!gruppenProfilGueltig(wert.gruppenFaehigkeiten)) return null;
  if (wert.aktionsAutoritaet !== false) return null;

  const skills: CapabilitySyncSkillSnapshot[] = [];
  const ids = new Set<string>();
  for (const rohSkill of wert.skills) {
    const skill = liesSkillSnapshot(rohSkill);
    if (skill === null || ids.has(skill.skillId)) return null;
    ids.add(skill.skillId);
    skills.push(skill);
  }
  skills.sort((a, b) => a.skillId.localeCompare(b.skillId));

  return Object.freeze({
    schemaVersion: 1,
    charakterKennung,
    charakterName,
    klasse: klasse.toLowerCase(),
    stufe: wert.stufe as number,
    generation: wert.generation as number,
    fingerprint: wert.fingerprint,
    katalogZustand: 'bereit' as const,
    katalogGeneration: wert.katalogGeneration as number,
    katalogFingerprint: wert.katalogFingerprint,
    lebensnachweisGesendetAm: wert.lebensnachweisGesendetAm as number,
    lebensnachweisLaufendeNummer: wert.lebensnachweisLaufendeNummer as number,
    skills: Object.freeze(skills),
    gruppenFaehigkeiten: cloneGruppenProfil(wert.gruppenFaehigkeiten),
    aktionsAutoritaet: false as const
  });
}

function blockiertesVertrauen(
  empfang: CapabilitySyncEmpfang,
  lebensnachweisBewertung: CapabilitySyncVertrauensEingabe['lebensnachweisBewertung'],
  gruende: readonly string[]
): RemoteCapabilityVertrauensPruefung {
  return Object.freeze({
    schemaVersion: 1,
    status: 'blockiert' as const,
    charakterKennung: empfang.snapshot.charakterKennung,
    charakterName: empfang.snapshot.charakterName,
    gruende: Object.freeze([...gruende]),
    snapshot: null,
    lebensnachweisBewertung,
    aktionsAutoritaet: false as const
  });
}

export function pruefeRemoteCapabilityVertrauen(
  eingabe: CapabilitySyncVertrauensEingabe
): RemoteCapabilityVertrauensPruefung {
  const { empfang, lebensnachweisEmpfang, lebensnachweisBewertung, lokalerKatalog } = eingabe;
  const snapshot = empfang.snapshot;
  const gruende: string[] = [];

  if (empfang.absenderName !== snapshot.charakterName) {
    gruende.push('Capability-Sendername stimmt nicht mit dem Snapshot-Charaktername ueberein.');
  }
  if (lebensnachweisEmpfang === null) {
    gruende.push('Passender Block-8-Lebensnachweis fehlt.');
  } else {
    const meldung = lebensnachweisEmpfang.meldung;
    if (lebensnachweisEmpfang.absenderName !== empfang.absenderName) {
      gruende.push('Capability- und Lebensnachweis-Absender stimmen nicht ueberein.');
    }
    if (meldung.charakterKennung !== snapshot.charakterKennung) {
      gruende.push('Capability-Charakterkennung stimmt nicht mit dem Lebensnachweis ueberein.');
    }
    if (meldung.charakterName !== snapshot.charakterName) {
      gruende.push('Capability-Charaktername stimmt nicht mit dem Lebensnachweis ueberein.');
    }
    if (meldung.klasse.toLowerCase() !== snapshot.klasse.toLowerCase()) {
      gruende.push('Capability-Klasse stimmt nicht mit dem Lebensnachweis ueberein.');
    }
    if (
      meldung.gesendetAm !== snapshot.lebensnachweisGesendetAm ||
      meldung.laufendeNummer !== snapshot.lebensnachweisLaufendeNummer
    ) {
      gruende.push('Capability-Snapshot ist nicht an genau den aktuellen Lebensnachweis gebunden.');
    }
  }

  if (lebensnachweisBewertung === null) {
    gruende.push('Block-8-Lebensnachweisbewertung fehlt.');
  } else {
    if (lebensnachweisBewertung.charakterKennung !== snapshot.charakterKennung) {
      gruende.push('Lebensnachweisbewertung gehoert zu einer anderen Charakterkennung.');
    }
    if (lebensnachweisBewertung.status !== 'aktiv') {
      gruende.push(`Lebensnachweis ist nicht aktiv: ${lebensnachweisBewertung.status}.`);
    }
  }

  if (
    lokalerKatalog.zustand !== 'bereit' ||
    lokalerKatalog.bestaetigungErforderlich ||
    lokalerKatalog.fingerprint === null
  ) {
    gruende.push('Lokaler Skill-Katalog ist nicht vertrauenswuerdig bereit.');
  } else if (snapshot.katalogFingerprint !== lokalerKatalog.fingerprint) {
    gruende.push('Lokaler und Remote-Skill-Katalog haben unterschiedliche Fingerprints.');
  }

  if (snapshot.katalogZustand !== 'bereit') {
    gruende.push('Remote-Skill-Katalog ist nicht bereit.');
  }

  if (gruende.length > 0) return blockiertesVertrauen(empfang, lebensnachweisBewertung, gruende);

  return Object.freeze({
    schemaVersion: 1,
    status: 'vertraut' as const,
    charakterKennung: snapshot.charakterKennung,
    charakterName: snapshot.charakterName,
    gruende: Object.freeze([]),
    snapshot,
    lebensnachweisBewertung,
    aktionsAutoritaet: false as const
  });
}
