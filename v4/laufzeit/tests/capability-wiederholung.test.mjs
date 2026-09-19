import test from 'node:test';
import assert from 'node:assert/strict';
import { CapabilityWiederholungsMaschine } from '../../erzeugt/wiederholung/capability-wiederholung.js';

function skills({ future = false, remoteOnly = false } = {}) {
  const result = {
    '3shot': {
      name: '3shot',
      type: 'skill',
      class: ['ranger'],
      level: 60,
      mp: 120,
      multi: true,
      hostile: true,
      share: 'attack',
      wtype: ['bow', 'crossbow'],
      max_targets: 3
    },
    '5shot': {
      name: '5shot',
      type: 'skill',
      class: ['ranger'],
      level: 75,
      mp: 240,
      multi: true,
      hostile: true,
      share: 'attack',
      wtype: ['bow', 'crossbow'],
      max_targets: 5
    }
  };
  if (future) {
    result.futureaoe = {
      name: 'Future AoE',
      type: 'skill',
      class: ['ranger'],
      level: 1,
      mp: 50,
      multi: true,
      hostile: true,
      wtype: ['bow'],
      max_targets: 4
    };
  }
  if (remoteOnly) {
    result.remoteonly = {
      name: 'Remote Only',
      type: 'skill',
      class: ['ranger'],
      level: 1,
      mp: 50,
      multi: true,
      hostile: true,
      wtype: ['bow'],
      max_targets: 6
    };
  }
  return result;
}

const gameItems = {
  bow1: { wtype: 'bow', type: 'weapon' }
};

function ranger({
  id,
  name,
  level,
  sequence,
  policy = [],
  withBow = true,
  skillSet = skills(),
  connectionGap = false,
  revalidiere = false,
  remoteSnapshotQuelle = 'aktuell',
  hp = 1000,
  maxHp = 1000
}) {
  return {
    charakterKennung: id,
    charakterName: name,
    klasse: 'ranger',
    stufe: level,
    leben: hp,
    lebenMaximal: maxHp,
    mana: 2000,
    manaMaximal: 2000,
    serverRegion: 'EU',
    serverKennung: 'I',
    karte: 'main',
    instanz: 'main',
    zielKennung: 'goo-1',
    gefahrenStufe: 'sicher',
    lebendig: true,
    skills: skillSet,
    gameItems,
    slots: withBow ? { mainhand: { name: 'bow1' } } : {},
    inventar: [],
    cooldownSkills: [],
    canUse: { '3shot': true, '5shot': true, futureaoe: true, remoteonly: true },
    connectionGap,
    revalidiere,
    policyAenderungen: policy,
    lebensnachweisLaufendeNummer: sequence,
    remoteSnapshotQuelle,
    gruppenKoordinationErlaubt: true
  };
}

function enable(skillId, freigegeben = true) {
  return { art: 'skill_freigabe', skillId, freigegeben };
}

function control(skillId, wert) {
  return { art: 'control', skillId, controlKennung: 'mindestensZiele', wert };
}

function datensatz() {
  return {
    schemaVersion: 1,
    kennung: 'block8-6-golden-capability-replay',
    erstelltAm: 10_000,
    schritte: [
      {
        laufendeNummer: 1,
        zeitpunkt: 1_000,
        eigenerTeilnehmerKennung: 'R1',
        charaktere: [
          ranger({
            id: 'R1',
            name: 'RangerA',
            level: 74,
            sequence: 1,
            policy: [enable('3shot'), control('3shot', 2)]
          }),
          ranger({
            id: 'R2',
            name: 'RangerB',
            level: 80,
            sequence: 1,
            policy: [
              enable('3shot'), control('3shot', 2),
              enable('5shot'), control('5shot', 4)
            ]
          })
        ]
      },
      {
        laufendeNummer: 2,
        zeitpunkt: 2_000,
        eigenerTeilnehmerKennung: 'R1',
        charaktere: [
          ranger({ id: 'R1', name: 'RangerA', level: 75, sequence: 2 }),
          ranger({ id: 'R2', name: 'RangerB', level: 80, sequence: 2 })
        ]
      },
      {
        laufendeNummer: 3,
        zeitpunkt: 3_000,
        eigenerTeilnehmerKennung: 'R1',
        charaktere: [
          ranger({ id: 'R1', name: 'RangerA', level: 75, sequence: 3 }),
          ranger({ id: 'R2', name: 'RangerB', level: 80, sequence: 3, withBow: false })
        ]
      },
      {
        laufendeNummer: 4,
        zeitpunkt: 4_000,
        eigenerTeilnehmerKennung: 'R1',
        charaktere: [
          ranger({
            id: 'R1',
            name: 'RangerA',
            level: 75,
            sequence: 4,
            skillSet: skills({ future: true }),
            revalidiere: true
          }),
          ranger({
            id: 'R2',
            name: 'RangerB',
            level: 80,
            sequence: 4,
            withBow: false,
            skillSet: skills({ future: true }),
            revalidiere: true
          })
        ]
      },
      {
        laufendeNummer: 5,
        zeitpunkt: 5_000,
        eigenerTeilnehmerKennung: 'R1',
        charaktere: [
          ranger({
            id: 'R1',
            name: 'RangerA',
            level: 75,
            sequence: 5,
            skillSet: skills({ future: true })
          }),
          ranger({
            id: 'R2',
            name: 'RangerB',
            level: 80,
            sequence: 5,
            skillSet: skills({ future: true }),
            remoteSnapshotQuelle: 'vorheriger'
          })
        ]
      },
      {
        laufendeNummer: 6,
        zeitpunkt: 6_000,
        eigenerTeilnehmerKennung: 'R1',
        charaktere: [
          ranger({
            id: 'R1',
            name: 'RangerA',
            level: 75,
            sequence: 6,
            skillSet: skills({ future: true })
          }),
          ranger({
            id: 'R2',
            name: 'RangerB',
            level: 80,
            sequence: 6,
            skillSet: skills({ future: true, remoteOnly: true }),
            revalidiere: true
          })
        ]
      },
      {
        laufendeNummer: 7,
        zeitpunkt: 7_000,
        eigenerTeilnehmerKennung: 'R1',
        charaktere: [
          ranger({
            id: 'R1',
            name: 'RangerA',
            level: 75,
            sequence: 7,
            skillSet: skills({ future: true }),
            connectionGap: true
          }),
          ranger({
            id: 'R2',
            name: 'RangerB',
            level: 80,
            sequence: 7,
            skillSet: skills({ future: true, remoteOnly: true })
          })
        ]
      },
      {
        laufendeNummer: 8,
        zeitpunkt: 8_000,
        eigenerTeilnehmerKennung: 'R1',
        charaktere: [
          ranger({
            id: 'R1',
            name: 'RangerA',
            level: 75,
            sequence: 8,
            skillSet: skills({ future: true })
          }),
          ranger({
            id: 'R2',
            name: 'RangerB',
            level: 80,
            sequence: 8,
            skillSet: skills({ future: true, remoteOnly: true })
          })
        ]
      },
      {
        laufendeNummer: 9,
        zeitpunkt: 9_000,
        eigenerTeilnehmerKennung: 'R1',
        charaktere: [
          ranger({
            id: 'R1',
            name: 'RangerA',
            level: 75,
            sequence: 9,
            skillSet: skills({ future: true }),
            revalidiere: true
          }),
          ranger({
            id: 'R2',
            name: 'RangerB',
            level: 80,
            sequence: 9,
            skillSet: skills({ future: true, remoteOnly: true })
          })
        ]
      }
    ]
  };
}

function char(schritt, id) {
  return schritt.charaktere.find((row) => row.charakterKennung === id);
}

function skill(faehigkeiten, skillId) {
  return faehigkeiten.skills.find((row) => row.skillId === skillId);
}

test('8.6.8: gleiche Inputs erzeugen identische Capability-, Leader- und Ausgabe-Fingerprints', () => {
  const input = datensatz();
  const a = new CapabilityWiederholungsMaschine().fuehreAus(input, 'lauf-a');
  const b = new CapabilityWiederholungsMaschine().fuehreAus(input, 'lauf-b');

  assert.equal(a.eingabeFingerabdruck, b.eingabeFingerabdruck);
  assert.equal(a.ausgabeFingerabdruck, b.ausgabeFingerabdruck);
  assert.deepEqual(
    a.schritte.map((row) => row.schrittFingerabdruck),
    b.schritte.map((row) => row.schrittFingerabdruck)
  );
  assert.deepEqual(
    a.schritte.map((row) => row.gruppenwahl?.leaderKennung ?? null),
    b.schritte.map((row) => row.gruppenwahl?.leaderKennung ?? null)
  );
  assert.equal(a.aktionsAutoritaet, false);
});

test('8.6.8: zwei Ranger behalten getrennte 3shot/5shot-Policies und reale Leaderwahl', () => {
  const lauf = new CapabilityWiederholungsMaschine().fuehreAus(datensatz(), 'policy');
  const schritt = lauf.schritte[0];
  const r1 = char(schritt, 'R1');
  const r2 = char(schritt, 'R2');

  assert.equal(skill(r1.faehigkeiten, '3shot').aktuellAutomatisierbar, true);
  assert.equal(skill(r1.faehigkeiten, '5shot').strukturellVorhanden, false);
  assert.equal(skill(r2.faehigkeiten, '3shot').aktuellAutomatisierbar, true);
  assert.equal(skill(r2.faehigkeiten, '5shot').aktuellAutomatisierbar, true);
  assert.equal(schritt.gruppenwahl.leaderKennung, 'R2');
  assert.equal(schritt.gruppenwahl.aufgaben.schaden.charakterKennung, 'R2');
});

test('8.6.8: Level-Up schaltet bekannten 5shot strukturell frei, Skill AUS bleibt trotz technischer Readiness harte Sperre', () => {
  const lauf = new CapabilityWiederholungsMaschine().fuehreAus(datensatz(), 'level-up');
  const vorher = skill(char(lauf.schritte[0], 'R1').faehigkeiten, '5shot');
  const nachher = skill(char(lauf.schritte[1], 'R1').faehigkeiten, '5shot');

  assert.equal(vorher.strukturellVorhanden, false);
  assert.equal(nachher.strukturellVorhanden, true);
  assert.equal(nachher.technischBereit, true);
  assert.equal(nachher.vomNutzerFreigegeben, false);
  assert.equal(nachher.automatisierungKonfiguriert, false);
  assert.equal(nachher.aktuellAutomatisierbar, false);
  assert.match(nachher.grund, /SkillPolicy AUS/);
});

test('8.6.8: Equipmentverlust entzieht Readiness und kann Leader deterministisch wechseln', () => {
  const lauf = new CapabilityWiederholungsMaschine().fuehreAus(datensatz(), 'equipment');
  const vorher = lauf.schritte[1];
  const nachher = lauf.schritte[2];
  const r2Vorher = skill(char(vorher, 'R2').faehigkeiten, '5shot');
  const r2Nachher = skill(char(nachher, 'R2').faehigkeiten, '5shot');

  assert.equal(r2Vorher.technischBereit, true);
  assert.equal(r2Nachher.vomNutzerFreigegeben, true);
  assert.equal(r2Nachher.technischBereit, false);
  assert.equal(r2Nachher.aktuellAutomatisierbar, false);
  assert.match(r2Nachher.grund, /Waffentyp fehlt/);
  assert.equal(vorher.gruppenwahl.leaderKennung, 'R2');
  assert.equal(nachher.gruppenwahl.leaderKennung, 'R1');
});

test('8.6.8: unbekannter neuer Skill bleibt nach expliziter Katalog-Revalidierung sichtbar aber nicht automatisierbar', () => {
  const lauf = new CapabilityWiederholungsMaschine().fuehreAus(datensatz(), 'unknown');
  const schritt = lauf.schritte[3];
  const r1 = char(schritt, 'R1');
  const future = skill(r1.faehigkeiten, 'futureaoe');

  assert.equal(r1.audit.katalog.zustand, 'bereit');
  assert.equal(r1.audit.katalog.bestaetigungErforderlich, false);
  assert.equal(future.strukturellVorhanden, true);
  assert.equal(future.automationValidated, false);
  assert.equal(future.aktuellAutomatisierbar, false);
  assert.ok(schritt.status.diagnose.some((row) =>
    row.code === 'SKILL_NICHT_VALIDIERT' && row.bezug === 'futureaoe'
  ));
});

test('8.6.8: alter Remote-Snapshot bleibt trotz neuem aktivem Lebensnachweis stale und fail-closed', () => {
  const lauf = new CapabilityWiederholungsMaschine().fuehreAus(datensatz(), 'stale-remote');
  const schritt = lauf.schritte[4];
  const remote = schritt.remoteVertrauen.find((row) => row.charakterKennung === 'R2');

  assert.equal(remote.status, 'blockiert');
  assert.match(remote.gruende.join(' '), /nicht an genau den aktuellen Lebensnachweis gebunden/);
  assert.equal(schritt.gruppenwahl.leaderKennung, 'R1');
  assert.ok(schritt.gruppenwahl.ausgeschlosseneTeilnehmer.some(
    (row) => row.charakterKennung === 'R2'
  ));
});

test('8.6.8: Katalog-Fingerprint-Mismatch blockiert Remote-Capability und verhindert Klassenfallback', () => {
  const lauf = new CapabilityWiederholungsMaschine().fuehreAus(datensatz(), 'mismatch');
  const schritt = lauf.schritte[5];
  const remote = schritt.remoteVertrauen.find((row) => row.charakterKennung === 'R2');

  assert.equal(remote.status, 'blockiert');
  assert.match(remote.gruende.join(' '), /unterschiedliche Fingerprints/);
  assert.equal(schritt.status.remote[0].catalogAgreement, 'abweichend');
  assert.equal(schritt.gruppenwahl.leaderKennung, 'R1');
});

test('8.6.8: Connection-Gap und Recovery bleiben bis expliziter Revalidierung fail-closed', () => {
  const lauf = new CapabilityWiederholungsMaschine().fuehreAus(datensatz(), 'recovery');
  const gap = lauf.schritte[6];
  const recovery = lauf.schritte[7];
  const revalidiert = lauf.schritte[8];

  assert.equal(char(gap, 'R1').audit.katalog.zustand, 'veraltet');
  assert.equal(char(gap, 'R1').audit.connectionGapAktiv, true);
  assert.equal(gap.gruppenwahl, null);

  assert.equal(char(recovery, 'R1').audit.katalog.zustand, 'veraltet');
  assert.equal(char(recovery, 'R1').audit.connectionGapAktiv, false);
  assert.ok(char(recovery, 'R1').audit.letzteAusloeser.includes('recovery'));
  assert.equal(recovery.gruppenwahl, null);

  assert.equal(char(revalidiert, 'R1').audit.katalog.zustand, 'bereit');
  assert.equal(char(revalidiert, 'R1').audit.produktionsbereit, true);
  assert.deepEqual(char(revalidiert, 'R1').audit.letzteAusloeser, ['revalidierung']);
  assert.ok(revalidiert.gruppenwahl);
});

test('8.6.8: Replay-Ausgabe bleibt read-only ohne Spielaktionsautoritaet auf allen Ebenen', () => {
  const lauf = new CapabilityWiederholungsMaschine().fuehreAus(datensatz(), 'authority');

  for (const schritt of lauf.schritte) {
    assert.equal(schritt.aktionsAutoritaet, false);
    assert.equal(schritt.status.spielAutoritaet, false);
    assert.equal(schritt.status.bedienAutoritaet, false);
    assert.equal(schritt.status.neustartAutoritaet, false);
    for (const row of schritt.charaktere) {
      assert.equal(row.faehigkeiten.aktionsAutoritaet, false);
      assert.equal(row.audit.aktionsAutoritaet, false);
      assert.equal(row.audit.automatischerNeustart, false);
      if (row.aktuellerSnapshot) assert.equal(row.aktuellerSnapshot.aktionsAutoritaet, false);
    }
    for (const remote of schritt.remoteVertrauen) {
      assert.equal(remote.aktionsAutoritaet, false);
    }
    if (schritt.gruppenwahl) assert.equal(schritt.gruppenwahl.aktionsAutoritaet, false);
  }
});

test('8.6.8: unbounded oder zeitlich nicht monotone Datensaetze werden abgewiesen', () => {
  const basis = datensatz();
  assert.throws(
    () => new CapabilityWiederholungsMaschine().fuehreAus({
      ...basis,
      schritte: basis.schritte.map((row, index) =>
        index === 1 ? { ...row, zeitpunkt: basis.schritte[0].zeitpunkt } : row
      )
    }, 'bad-time'),
    /streng steigende Zeitpunkte/
  );

  assert.throws(
    () => new CapabilityWiederholungsMaschine().fuehreAus({
      ...basis,
      schritte: Array.from({ length: 257 }, (_, index) => ({
        ...basis.schritte[0],
        laufendeNummer: index + 1,
        zeitpunkt: index + 1
      }))
    }, 'too-many'),
    /1 bis 256 Schritte/
  );
});
