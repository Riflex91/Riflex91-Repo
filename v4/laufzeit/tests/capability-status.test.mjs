import test from 'node:test';
import assert from 'node:assert/strict';
import { erstelleCapabilityStatusSicht } from '../../erzeugt/telemetrie/capability-status.js';

function audit(overrides = {}) {
  return {
    schemaVersion: 1,
    gestartet: true,
    auditNummer: 5,
    letzterAuditAm: 2000,
    letzterErfolgreicherAuditAm: 1900,
    letzteAusloeser: ['periodisch'],
    connectionGapAktiv: false,
    periodischesIntervallMillisekunden: 30_000,
    identitaet: {
      charakterKennung: 'R1',
      charakterName: 'RangerA',
      klasse: 'ranger',
      stufe: 80,
      serverRegion: 'EU',
      serverKennung: 'I'
    },
    katalog: {
      schemaVersion: 1,
      quelle: 'adventure-land-g-skills',
      aufgenommenAm: 1800,
      generation: 3,
      zustand: 'bereit',
      grund: null,
      fingerprint: 'b'.repeat(64),
      vorherigerFingerprint: null,
      skills: [],
      automationValidatedAnzahl: 2,
      fehler: [],
      bestaetigungErforderlich: false,
      spielAutoritaet: false
    },
    revalidierungsProfil: {
      schemaVersion: 1,
      katalogFingerprint: 'b'.repeat(64),
      katalogGeneration: 3,
      charakterKennung: 'R1',
      serverRegion: 'EU',
      serverKennung: 'I',
      bestaetigtAm: 1750,
      aktionsAutoritaet: false
    },
    produktionsbereit: true,
    grund: 'Katalog ist bereit und revalidiert.',
    aktionsAutoritaet: false,
    automatischerNeustart: false,
    ...overrides
  };
}

function technik(skillId, zustand = 'bereit') {
  return {
    schemaVersion: 1,
    skillId,
    aufgenommenAm: 2000,
    zustand,
    ausruestungBereit: zustand === 'bereit',
    materialBereit: true,
    manaBereit: true,
    aktionsBereitschaft: {
      schemaVersion: 1,
      aufgenommenAm: 2000,
      aktionsName: skillId,
      zustand: zustand === 'bereit' ? 'bereit' : 'unbekannt',
      bereitAb: null,
      restMillisekunden: null,
      grund: 'test'
    },
    gruende: zustand === 'bereit' ? [] : ['Equipment fehlt.'],
    aktionsFreigabe: false
  };
}

function local(overrides = {}) {
  return {
    schemaVersion: 1,
    aufgenommenAm: 2000,
    charakterKennung: 'R1',
    charakterName: 'RangerA',
    klasse: 'ranger',
    stufe: 80,
    generation: 7,
    fingerprint: 'a'.repeat(64),
    katalogZustand: 'bereit',
    katalogGeneration: 3,
    katalogFingerprint: 'b'.repeat(64),
    katalogVertrauenswuerdig: true,
    skills: [
      {
        schemaVersion: 1,
        skillId: '3shot',
        skillName: '3shot',
        capabilityTags: ['mehrziel-schaden', 'fernkampf-mehrziel-schaden'],
        zielKapazitaet: 3,
        strukturellVorhanden: true,
        automationValidated: true,
        technischBereit: true,
        vomNutzerFreigegeben: true,
        automatisierungKonfiguriert: true,
        aktuellAutomatisierbar: true,
        parameter: { mindestensZiele: 2 },
        technischeAuswertung: technik('3shot'),
        grund: 'bereit'
      },
      {
        schemaVersion: 1,
        skillId: '5shot',
        skillName: '5shot',
        capabilityTags: ['mehrziel-schaden', 'fernkampf-mehrziel-schaden'],
        zielKapazitaet: 5,
        strukturellVorhanden: true,
        automationValidated: true,
        technischBereit: false,
        vomNutzerFreigegeben: true,
        automatisierungKonfiguriert: true,
        aktuellAutomatisierbar: false,
        parameter: { mindestensZiele: 4 },
        technischeAuswertung: technik('5shot', 'blockiert'),
        grund: 'Equipment fehlt.'
      },
      {
        schemaVersion: 1,
        skillId: 'future',
        skillName: 'future',
        capabilityTags: ['mehrziel-schaden'],
        zielKapazitaet: null,
        strukturellVorhanden: true,
        automationValidated: false,
        technischBereit: true,
        vomNutzerFreigegeben: false,
        automatisierungKonfiguriert: false,
        aktuellAutomatisierbar: false,
        parameter: {},
        technischeAuswertung: technik('future'),
        grund: 'Neuer unbekannter Skill ist noch nicht automationValidated.'
      }
    ],
    capabilities: [
      {
        capability: 'fernkampf-mehrziel-schaden',
        strukturellAnzahl: 2,
        validiertAnzahl: 2,
        technischBereitAnzahl: 1,
        nutzerFreigegebenAnzahl: 2,
        automatisierungKonfiguriertAnzahl: 2,
        aktuellAutomatisierbarAnzahl: 1,
        maximaleZielKapazitaetStrukturell: 5,
        maximaleZielKapazitaetAktuell: 3
      },
      {
        capability: 'mehrziel-schaden',
        strukturellAnzahl: 3,
        validiertAnzahl: 2,
        technischBereitAnzahl: 2,
        nutzerFreigegebenAnzahl: 2,
        automatisierungKonfiguriertAnzahl: 2,
        aktuellAutomatisierbarAnzahl: 1,
        maximaleZielKapazitaetStrukturell: 5,
        maximaleZielKapazitaetAktuell: 3
      }
    ],
    gruppenFaehigkeiten: { heilen: 0, schaden: 1, aggro: 0, schutz: 0, unterstuetzung: 0 },
    aktionsAutoritaet: false,
    ...overrides
  };
}

function policy(skillId, wert) {
  return {
    skillId,
    skillName: skillId,
    katalogEintrag: {},
    freigegeben: true,
    konfiguriert: true,
    controls: [{
      definition: {
        kennung: 'mindestensZiele',
        art: 'ganzzahl',
        bezeichnung: 'Mindestens Ziele',
        minimum: 1,
        maximum: skillId === '5shot' ? 5 : 3,
        schritt: 1,
        standardWert: 2,
        maximumQuelle: 'zielKapazitaet'
      },
      wert
    }],
    unbekanntePersistierteControls: [],
    ungueltigePersistierteControls: [],
    hartGesperrt: false,
    grund: 'test'
  };
}

function remoteSnapshot({
  id = 'R2',
  name = 'RangerB',
  catalogFingerprint = 'b'.repeat(64),
  fingerprint = 'c'.repeat(64),
  generation = 4
} = {}) {
  return {
    schemaVersion: 1,
    charakterKennung: id,
    charakterName: name,
    klasse: 'ranger',
    stufe: 80,
    generation,
    fingerprint,
    katalogZustand: 'bereit',
    katalogGeneration: 3,
    katalogFingerprint: catalogFingerprint,
    lebensnachweisGesendetAm: 1900,
    lebensnachweisLaufendeNummer: 8,
    skills: [{
      skillId: '5shot',
      capabilityTags: ['mehrziel-schaden'],
      zielKapazitaet: 5,
      enabled: true,
      configuredReady: true,
      aktuellAutomatisierbar: true,
      parameter: { mindestensZiele: 4 }
    }],
    gruppenFaehigkeiten: { heilen: 0, schaden: 1, aggro: 0, schutz: 0, unterstuetzung: 0 },
    aktionsAutoritaet: false
  };
}

function remoteEmpfang(snapshot, empfangenAm = 1950) {
  return {
    schemaVersion: 1,
    absenderName: snapshot.charakterName,
    empfangenAm,
    snapshot
  };
}

function remoteVertrauen(snapshot, {
  status = 'vertraut',
  liveness = 'aktiv',
  alter = 100,
  gruende = []
} = {}) {
  return {
    schemaVersion: 1,
    status,
    charakterKennung: snapshot.charakterKennung,
    charakterName: snapshot.charakterName,
    gruende,
    snapshot: status === 'vertraut' ? snapshot : null,
    lebensnachweisBewertung: {
      charakterKennung: snapshot.charakterKennung,
      status: liveness,
      grund: 'test',
      alterMillisekunden: alter
    },
    aktionsAutoritaet: false
  };
}

function gruppenwahl(overrides = {}) {
  return {
    schemaVersion: 1,
    zeitpunkt: 2000,
    eigenerTeilnehmerKennung: 'R1',
    betriebsArt: 'normal',
    grund: 'Capability-Wahl aktiv.',
    leaderKennung: 'R2',
    leaderName: 'RangerB',
    leaderGrund: 'Mehr reale Damage-Capabilities.',
    leaderKandidaten: [],
    aufgaben: {},
    aufgabenZuordnung: {
      heilen: null,
      schaden: 'R2',
      aggro: null,
      schutz: null,
      unterstuetzung: null
    },
    vertrauteTeilnehmerKennungen: ['R2', 'R1'],
    ausgeschlosseneTeilnehmer: [],
    aktionsAutoritaet: false,
    ...overrides
  };
}

function eingabe(overrides = {}) {
  const snap = remoteSnapshot();
  return {
    zeitpunkt: 2050,
    audit: audit(),
    lokaleFaehigkeiten: local(),
    skillPolicies: [policy('5shot', 4), policy('3shot', 2)],
    remoteEmpfaenge: [remoteEmpfang(snap)],
    remoteVertrauen: [remoteVertrauen(snap)],
    gruppenwahl: gruppenwahl(),
    ...overrides
  };
}

test('8.6.7: CapabilityStatus zeigt Katalog Validierung Skillzahlen Slider lokale Capabilities und Gruppenwahl read-only', () => {
  const status = erstelleCapabilityStatusSicht(eingabe());

  assert.equal(status.schemaVersion, 1);
  assert.equal(status.nurLesen, true);
  assert.equal(status.spielAutoritaet, false);
  assert.equal(status.bedienAutoritaet, false);
  assert.equal(status.neustartAutoritaet, false);

  assert.equal(status.katalog.zustand, 'bereit');
  assert.equal(status.katalog.fingerprint, 'b'.repeat(64));
  assert.equal(status.katalog.letzterErfolgreicherAuditAm, 1900);
  assert.equal(status.katalog.letzteExpliziteValidierungAm, 1750);

  assert.equal(status.skills.gesamt, 3);
  assert.equal(status.skills.aktiv, 2);
  assert.equal(status.skills.aktuellAutomatisierbar, 1);
  assert.deepEqual(status.skills.skills.map((row) => row.skillId), ['3shot', '5shot', 'future']);
  assert.equal(status.skills.skills[0].slider[0].kennung, 'mindestensZiele');
  assert.equal(status.skills.skills[0].slider[0].wert, 2);

  assert.deepEqual(status.capabilities.map((row) => row.capability), [
    'fernkampf-mehrziel-schaden',
    'mehrziel-schaden'
  ]);
  assert.equal(status.gruppenwahl.leaderKennung, 'R2');
  assert.equal(status.gruppenwahl.aufgabenZuordnung.schaden, 'R2');
  assert.deepEqual(status.gruppenwahl.vertrauteTeilnehmerKennungen, ['R1', 'R2']);
});

test('8.6.7: Remote-Freshness und Catalog-Agreement bleiben getrennt sichtbar', () => {
  const snap = remoteSnapshot();
  const status = erstelleCapabilityStatusSicht(eingabe({
    remoteEmpfaenge: [remoteEmpfang(snap)],
    remoteVertrauen: [remoteVertrauen(snap, { alter: 321 })]
  }));

  assert.equal(status.remote.length, 1);
  assert.equal(status.remote[0].vertrauensStatus, 'vertraut');
  assert.equal(status.remote[0].lebensnachweisStatus, 'aktiv');
  assert.equal(status.remote[0].lebensnachweisAlterMillisekunden, 321);
  assert.equal(status.remote[0].catalogAgreement, 'stimmt');
  assert.equal(status.remote[0].aktuellAutomatisierbareSkills, 1);
});

test('8.6.7: blockierter Remote-Snapshot zeigt Fingerprint-Mismatch aus Empfangsevidenz trotz fail-closed Trust', () => {
  const snap = remoteSnapshot({ catalogFingerprint: 'd'.repeat(64) });
  const status = erstelleCapabilityStatusSicht(eingabe({
    remoteEmpfaenge: [remoteEmpfang(snap)],
    remoteVertrauen: [remoteVertrauen(snap, {
      status: 'blockiert',
      gruende: ['Lokaler und Remote-Skill-Katalog haben unterschiedliche Fingerprints.']
    })]
  }));

  assert.equal(status.remote[0].vertrauensStatus, 'blockiert');
  assert.equal(status.remote[0].catalogAgreement, 'abweichend');
  assert.equal(status.remote[0].remoteKatalogFingerprint, 'd'.repeat(64));
  assert.ok(status.diagnose.some((row) =>
    row.code === 'REMOTE_KATALOG_MISMATCH' && row.bezug === 'R2'
  ));
  assert.ok(status.diagnose.some((row) =>
    row.code === 'REMOTE_CAPABILITY_NICHT_VERTRAUT' && row.bezug === 'R2'
  ));
});

test('8.6.7: Diagnose nennt Drift unbekannten Skill aktive technische Sperre und Gruppen-Ausschluss explizit', () => {
  const driftAudit = audit({
    produktionsbereit: false,
    grund: 'Revalidierung erforderlich.',
    katalog: {
      ...audit().katalog,
      zustand: 'drift',
      grund: 'Skill-Fingerprint hat sich geaendert.',
      bestaetigungErforderlich: true
    }
  });
  const status = erstelleCapabilityStatusSicht(eingabe({
    audit: driftAudit,
    gruppenwahl: gruppenwahl({
      ausgeschlosseneTeilnehmer: [{
        charakterKennung: 'R3',
        grund: 'Koordinationsautoritaet fehlt.'
      }]
    })
  }));

  const codes = status.diagnose.map((row) => row.code);
  assert.ok(codes.includes('KATALOG_NICHT_PRODUKTIONSBEREIT'));
  assert.ok(codes.includes('KATALOG_DRIFT'));
  assert.ok(codes.includes('SKILL_NICHT_VALIDIERT'));
  assert.ok(codes.includes('SKILL_AKTIV_ABER_NICHT_AUTOMATISIERBAR'));
  assert.ok(codes.includes('GRUPPENWAHL_TEILNEHMER_AUSGESCHLOSSEN'));
  assert.equal(status.diagnose[0].stufe, 'blockiert');
});

test('8.6.7: neuester Remote-Empfang wird nur fuer exakt passende Kennung plus Name verwendet', () => {
  const korrekt = remoteSnapshot({ id: 'R2', name: 'RangerB', catalogFingerprint: 'b'.repeat(64) });
  const spoof = remoteSnapshot({
    id: 'R2',
    name: 'SpoofName',
    catalogFingerprint: 'd'.repeat(64),
    fingerprint: 'e'.repeat(64),
    generation: 99
  });
  const status = erstelleCapabilityStatusSicht(eingabe({
    remoteEmpfaenge: [
      remoteEmpfang(korrekt, 1900),
      remoteEmpfang(spoof, 2000)
    ],
    remoteVertrauen: [remoteVertrauen(korrekt)]
  }));

  assert.equal(status.remote[0].charakterName, 'RangerB');
  assert.equal(status.remote[0].catalogAgreement, 'stimmt');
  assert.equal(status.remote[0].remoteGeneration, korrekt.generation);
});

test('8.6.7: Statusprojektion sortiert deterministisch ohne Eingaben umzuschreiben', () => {
  const quelle = eingabe();
  const policiesVorher = quelle.skillPolicies.map((row) => row.skillId);
  const remoteVorher = quelle.remoteVertrauen.map((row) => row.charakterKennung);
  const jsonVorher = JSON.stringify(quelle);

  const status = erstelleCapabilityStatusSicht(quelle);

  assert.deepEqual(status.skills.skills.map((row) => row.skillId), ['3shot', '5shot', 'future']);
  assert.equal(JSON.stringify(quelle), jsonVorher);
  assert.deepEqual(quelle.skillPolicies.map((row) => row.skillId), policiesVorher);
  assert.deepEqual(quelle.remoteVertrauen.map((row) => row.charakterKennung), remoteVorher);
});

test('8.6.7: Audit und lokale Capability muessen dieselbe Charakterkennung beschreiben', () => {
  assert.throws(
    () => erstelleCapabilityStatusSicht(eingabe({
      audit: audit({
        identitaet: {
          ...audit().identitaet,
          charakterKennung: 'ANDERER'
        }
      })
    })),
    /Charakterkennung stimmen nicht ueberein/
  );
});

test('8.6.7: vollstaendig gesunder Minimalzustand erzeugt nur CAPABILITY_STATUS_OK', () => {
  const minimalLocal = local({
    skills: [local().skills[0]],
    capabilities: [local().capabilities[0]]
  });
  const status = erstelleCapabilityStatusSicht(eingabe({
    lokaleFaehigkeiten: minimalLocal,
    skillPolicies: [policy('3shot', 2)],
    remoteEmpfaenge: [],
    remoteVertrauen: [],
    gruppenwahl: gruppenwahl({
      leaderKennung: 'R1',
      leaderName: 'RangerA',
      leaderGrund: 'Lokaler Kandidat.',
      vertrauteTeilnehmerKennungen: ['R1']
    })
  }));

  assert.deepEqual(status.diagnose.map((row) => row.code), ['CAPABILITY_STATUS_OK']);
  assert.equal(status.diagnose[0].stufe, 'info');
});
