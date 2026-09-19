import type {
  CapabilityDiagnoseEintrag,
  CapabilityStatusCapabilitySicht,
  CapabilityStatusEingabe,
  CapabilityStatusGruppenwahlSicht,
  CapabilityStatusKatalogSicht,
  CapabilityStatusRemoteSicht,
  CapabilityStatusSicht,
  CapabilityStatusSkillSicht,
  CapabilityStatusSkillsSicht,
  CatalogAgreementStatus
} from '../vertraege/capability-status.js';
import type { CapabilitySyncEmpfang } from '../vertraege/capability-sync.js';
import type { SkillPolicySkillAnsicht } from '../vertraege/skill-policy.js';

function pruefeZeitpunkt(wert: number): void {
  if (!Number.isFinite(wert) || wert < 0) {
    throw new Error('zeitpunkt muss eine endliche, nichtnegative Zahl sein.');
  }
}

function empfangSchluessel(charakterKennung: string, charakterName: string): string {
  return `${charakterKennung}\u0000${charakterName}`;
}

function neuesterEmpfangJeCharakter(
  empfaenge: readonly CapabilitySyncEmpfang[]
): ReadonlyMap<string, CapabilitySyncEmpfang> {
  const sortiert = [...empfaenge].sort((a, b) => {
    const schluesselA = empfangSchluessel(a.snapshot.charakterKennung, a.snapshot.charakterName);
    const schluesselB = empfangSchluessel(b.snapshot.charakterKennung, b.snapshot.charakterName);
    const kennung = schluesselA.localeCompare(schluesselB);
    if (kennung !== 0) return kennung;
    if (a.empfangenAm !== b.empfangenAm) return b.empfangenAm - a.empfangenAm;
    return b.snapshot.generation - a.snapshot.generation;
  });
  const result = new Map<string, CapabilitySyncEmpfang>();
  for (const empfang of sortiert) {
    const schluessel = empfangSchluessel(empfang.snapshot.charakterKennung, empfang.snapshot.charakterName);
    if (!result.has(schluessel)) {
      result.set(schluessel, empfang);
    }
  }
  return result;
}

function policyNachSkill(
  ansichten: readonly SkillPolicySkillAnsicht[]
): ReadonlyMap<string, SkillPolicySkillAnsicht> {
  const result = new Map<string, SkillPolicySkillAnsicht>();
  for (const ansicht of ansichten) {
    if (!result.has(ansicht.skillId)) result.set(ansicht.skillId, ansicht);
  }
  return result;
}

function baueKatalogSicht(
  eingabe: CapabilityStatusEingabe
): CapabilityStatusKatalogSicht {
  const audit = eingabe.audit;
  return Object.freeze({
    zustand: audit.katalog.zustand,
    generation: audit.katalog.generation,
    fingerprint: audit.katalog.fingerprint,
    letzterErfolgreicherAuditAm: audit.letzterErfolgreicherAuditAm,
    letzteExpliziteValidierungAm: audit.revalidierungsProfil?.bestaetigtAm ?? null,
    bestaetigungErforderlich: audit.katalog.bestaetigungErforderlich,
    produktionsbereit: audit.produktionsbereit,
    grund: audit.grund,
    katalogGrund: audit.katalog.grund
  });
}

function baueSkillSichten(
  eingabe: CapabilityStatusEingabe
): CapabilityStatusSkillsSicht {
  const policies = policyNachSkill(eingabe.skillPolicies);
  const skills = [...eingabe.lokaleFaehigkeiten.skills]
    .sort((a, b) => a.skillId.localeCompare(b.skillId))
    .map((skill): CapabilityStatusSkillSicht => {
      const policy = policies.get(skill.skillId);
      const slider = policy === undefined
        ? Object.freeze([])
        : Object.freeze(policy.controls.map((control) => Object.freeze({
            kennung: control.definition.kennung,
            bezeichnung: control.definition.bezeichnung,
            art: control.definition.art,
            wert: control.wert,
            minimum: control.definition.minimum,
            maximum: control.definition.maximum,
            schritt: control.definition.schritt
          })));

      return Object.freeze({
        skillId: skill.skillId,
        skillName: skill.skillName,
        strukturellVorhanden: skill.strukturellVorhanden,
        automationValidated: skill.automationValidated,
        technischBereit: skill.technischBereit,
        vomNutzerFreigegeben: skill.vomNutzerFreigegeben,
        automatisierungKonfiguriert: skill.automatisierungKonfiguriert,
        aktuellAutomatisierbar: skill.aktuellAutomatisierbar,
        zielKapazitaet: skill.zielKapazitaet,
        slider,
        grund: skill.grund
      });
    });

  return Object.freeze({
    gesamt: skills.length,
    strukturellVorhanden: skills.filter((skill) => skill.strukturellVorhanden).length,
    validiert: skills.filter((skill) => skill.automationValidated).length,
    aktiv: skills.filter((skill) => skill.vomNutzerFreigegeben).length,
    technischBereit: skills.filter((skill) => skill.technischBereit).length,
    automatisierungKonfiguriert: skills.filter((skill) => skill.automatisierungKonfiguriert).length,
    aktuellAutomatisierbar: skills.filter((skill) => skill.aktuellAutomatisierbar).length,
    skills: Object.freeze(skills)
  });
}

function catalogAgreement(
  lokalerFingerprint: string | null,
  remoteFingerprint: string | null
): CatalogAgreementStatus {
  if (lokalerFingerprint === null || remoteFingerprint === null) return 'unbekannt';
  return lokalerFingerprint === remoteFingerprint ? 'stimmt' : 'abweichend';
}

function baueRemoteSichten(
  eingabe: CapabilityStatusEingabe
): readonly CapabilityStatusRemoteSicht[] {
  const empfangNachKennung = neuesterEmpfangJeCharakter(eingabe.remoteEmpfaenge);
  return Object.freeze(
    [...eingabe.remoteVertrauen]
      .sort((a, b) =>
        a.charakterKennung.localeCompare(b.charakterKennung) ||
        a.charakterName.localeCompare(b.charakterName)
      )
      .map((pruefung): CapabilityStatusRemoteSicht => {
        const empfang = empfangNachKennung.get(empfangSchluessel(pruefung.charakterKennung, pruefung.charakterName));
        const remoteSnapshot = empfang?.snapshot ?? pruefung.snapshot;
        return Object.freeze({
          charakterKennung: pruefung.charakterKennung,
          charakterName: pruefung.charakterName,
          vertrauensStatus: pruefung.status,
          lebensnachweisStatus: pruefung.lebensnachweisBewertung?.status ?? null,
          lebensnachweisAlterMillisekunden: pruefung.lebensnachweisBewertung?.alterMillisekunden ?? null,
          catalogAgreement: catalogAgreement(
            eingabe.audit.katalog.fingerprint,
            remoteSnapshot?.katalogFingerprint ?? null
          ),
          remoteKatalogFingerprint: remoteSnapshot?.katalogFingerprint ?? null,
          remoteGeneration: remoteSnapshot?.generation ?? null,
          remoteFingerprint: remoteSnapshot?.fingerprint ?? null,
          aktuellAutomatisierbareSkills:
            remoteSnapshot?.skills.filter((skill) => skill.aktuellAutomatisierbar).length ?? 0,
          gruende: Object.freeze(
            pruefung.gruende.length > 0
              ? [...pruefung.gruende]
              : [pruefung.status === 'vertraut'
                  ? 'Remote-Capability ist identitaets-, liveness- und katalogkonsistent.'
                  : 'Remote-Capability ist nicht vertraut.']
          )
        });
      })
  );
}

function baueGruppenwahlSicht(
  eingabe: CapabilityStatusEingabe
): CapabilityStatusGruppenwahlSicht {
  const gruppenwahl = eingabe.gruppenwahl;
  if (gruppenwahl === null) {
    return Object.freeze({
      verfuegbar: false,
      betriebsArt: null,
      leaderKennung: null,
      leaderName: null,
      leaderGrund: null,
      aufgabenZuordnung: null,
      vertrauteTeilnehmerKennungen: Object.freeze([]),
      ausgeschlosseneTeilnehmer: Object.freeze([])
    });
  }
  return Object.freeze({
    verfuegbar: true,
    betriebsArt: gruppenwahl.betriebsArt,
    leaderKennung: gruppenwahl.leaderKennung,
    leaderName: gruppenwahl.leaderName,
    leaderGrund: gruppenwahl.leaderGrund,
    aufgabenZuordnung: Object.freeze({ ...gruppenwahl.aufgabenZuordnung }),
    vertrauteTeilnehmerKennungen: Object.freeze([...gruppenwahl.vertrauteTeilnehmerKennungen].sort()),
    ausgeschlosseneTeilnehmer: Object.freeze(
      [...gruppenwahl.ausgeschlosseneTeilnehmer]
        .sort((a, b) => a.charakterKennung.localeCompare(b.charakterKennung))
        .map((eintrag) => Object.freeze({ ...eintrag }))
    )
  });
}

function diagnoseSortierung(a: CapabilityDiagnoseEintrag, b: CapabilityDiagnoseEintrag): number {
  const rang = { blockiert: 0, warnung: 1, info: 2 } as const;
  return rang[a.stufe] - rang[b.stufe] ||
    a.bereich.localeCompare(b.bereich) ||
    a.bezug.localeCompare(b.bezug) ||
    a.code.localeCompare(b.code);
}

function baueDiagnose(
  eingabe: CapabilityStatusEingabe,
  skills: CapabilityStatusSkillsSicht,
  remote: readonly CapabilityStatusRemoteSicht[],
  gruppenwahl: CapabilityStatusGruppenwahlSicht
): readonly CapabilityDiagnoseEintrag[] {
  const eintraege: CapabilityDiagnoseEintrag[] = [];
  const push = (
    stufe: CapabilityDiagnoseEintrag['stufe'],
    code: string,
    bereich: CapabilityDiagnoseEintrag['bereich'],
    bezug: string,
    nachricht: string
  ) => eintraege.push(Object.freeze({ stufe, code, bereich, bezug, nachricht }));

  if (!eingabe.audit.produktionsbereit) {
    push(
      'blockiert',
      'KATALOG_NICHT_PRODUKTIONSBEREIT',
      'katalog',
      'lokal',
      eingabe.audit.grund
    );
  }
  if (eingabe.audit.katalog.zustand === 'drift') {
    push('blockiert', 'KATALOG_DRIFT', 'katalog', 'lokal', eingabe.audit.katalog.grund ?? 'Skill-Katalog meldet Drift.');
  } else if (eingabe.audit.katalog.zustand === 'veraltet') {
    push('warnung', 'KATALOG_VERALTET', 'katalog', 'lokal', eingabe.audit.katalog.grund ?? 'Skill-Katalog ist veraltet.');
  } else if (eingabe.audit.katalog.zustand === 'blockiert') {
    push('blockiert', 'KATALOG_BLOCKIERT', 'katalog', 'lokal', eingabe.audit.katalog.grund ?? 'Skill-Katalog ist blockiert.');
  }

  for (const skill of skills.skills) {
    if (!skill.strukturellVorhanden) continue;
    if (!skill.automationValidated) {
      push('blockiert', 'SKILL_NICHT_VALIDIERT', 'skill', skill.skillId, skill.grund);
      continue;
    }
    if (skill.vomNutzerFreigegeben && !skill.aktuellAutomatisierbar) {
      push(
        skill.technischBereit ? 'warnung' : 'blockiert',
        'SKILL_AKTIV_ABER_NICHT_AUTOMATISIERBAR',
        'skill',
        skill.skillId,
        skill.grund
      );
    }
  }

  for (const teilnehmer of remote) {
    if (teilnehmer.catalogAgreement === 'abweichend') {
      push(
        'blockiert',
        'REMOTE_KATALOG_MISMATCH',
        'remote',
        teilnehmer.charakterKennung,
        'Remote- und lokaler Skill-Katalog besitzen unterschiedliche Fingerprints.'
      );
    }
    if (teilnehmer.vertrauensStatus !== 'vertraut') {
      push(
        'blockiert',
        'REMOTE_CAPABILITY_NICHT_VERTRAUT',
        'remote',
        teilnehmer.charakterKennung,
        teilnehmer.gruende.join(' ')
      );
    } else if (teilnehmer.lebensnachweisStatus !== 'aktiv') {
      push(
        'warnung',
        'REMOTE_LIVENESS_NICHT_AKTIV',
        'remote',
        teilnehmer.charakterKennung,
        `Lebensnachweisstatus ist ${teilnehmer.lebensnachweisStatus ?? 'unbekannt'}.`
      );
    }
  }

  for (const ausgeschlossen of gruppenwahl.ausgeschlosseneTeilnehmer) {
    push(
      'blockiert',
      'GRUPPENWAHL_TEILNEHMER_AUSGESCHLOSSEN',
      'gruppe',
      ausgeschlossen.charakterKennung,
      ausgeschlossen.grund
    );
  }

  if (gruppenwahl.verfuegbar && gruppenwahl.leaderKennung === null) {
    push(
      'warnung',
      'GRUPPENWAHL_KEIN_LEADER',
      'gruppe',
      'leader',
      gruppenwahl.leaderGrund ?? 'Kein capability-basierter Leader gewaehlt.'
    );
  }

  if (eintraege.length === 0) {
    push(
      'info',
      'CAPABILITY_STATUS_OK',
      'gruppe',
      eingabe.lokaleFaehigkeiten.charakterKennung,
      'Katalog, lokale Capabilities und bekannte Remote-Vertrauenspruefungen enthalten keine blockierende Diagnose.'
    );
  }

  return Object.freeze(eintraege.sort(diagnoseSortierung));
}

export function erstelleCapabilityStatusSicht(
  eingabe: CapabilityStatusEingabe
): Readonly<CapabilityStatusSicht> {
  pruefeZeitpunkt(eingabe.zeitpunkt);

  if (eingabe.audit.identitaet.charakterKennung !== null &&
      eingabe.audit.identitaet.charakterKennung !== eingabe.lokaleFaehigkeiten.charakterKennung) {
    throw new Error('Audit- und lokale Capability-Charakterkennung stimmen nicht ueberein.');
  }

  const katalog = baueKatalogSicht(eingabe);
  const skills = baueSkillSichten(eingabe);
  const capabilities: readonly CapabilityStatusCapabilitySicht[] = Object.freeze(
    [...eingabe.lokaleFaehigkeiten.capabilities]
      .sort((a, b) => a.capability.localeCompare(b.capability))
      .map((capability) => Object.freeze({ ...capability }))
  );
  const remote = baueRemoteSichten(eingabe);
  const gruppenwahl = baueGruppenwahlSicht(eingabe);
  const diagnose = baueDiagnose(eingabe, skills, remote, gruppenwahl);

  return Object.freeze({
    schemaVersion: 1,
    erstelltAm: eingabe.zeitpunkt,
    charakterKennung: eingabe.lokaleFaehigkeiten.charakterKennung,
    charakterName: eingabe.lokaleFaehigkeiten.charakterName,
    nurLesen: true as const,
    spielAutoritaet: false as const,
    bedienAutoritaet: false as const,
    neustartAutoritaet: false as const,
    katalog,
    skills,
    capabilities,
    remote,
    gruppenwahl,
    diagnose
  });
}
