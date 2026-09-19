import test from 'node:test';
import assert from 'node:assert/strict';
import { waehleCapabilityBasierteGruppenrollen } from '../../erzeugt/spiellogik/capability-gruppenwahl.js';
import { koordiniereGruppe } from '../../erzeugt/spiellogik/gruppen-koordination.js';

function lebensnachweis({
  id,
  name,
  klasse,
  gesendetAm = 1000,
  laufendeNummer = 1,
  hp = 1,
  gefahr = 'sicher',
  grob = {}
}) {
  return {
    schemaVersion: 1,
    charakterKennung: id,
    charakterName: name,
    klasse,
    serverRegion: 'EU',
    serverKennung: 'I',
    karte: 'main',
    instanz: 'main',
    lebendig: true,
    lebensAnteil: hp,
    manaAnteil: 1,
    zielKennung: 'goo-1',
    gefahrenStufe: gefahr,
    faehigkeiten: {
      heilen: 0,
      schaden: 0,
      aggro: 0,
      schutz: 0,
      unterstuetzung: 0,
      ...grob
    },
    gesendetAm,
    laufendeNummer
  };
}

function skill(skillId, tags, {
  capacity = null,
  enabled = true,
  configuredReady = true,
  aktuell = true
} = {}) {
  return {
    skillId,
    capabilityTags: tags,
    zielKapazitaet: capacity,
    enabled,
    configuredReady,
    aktuellAutomatisierbar: aktuell,
    parameter: {}
  };
}

function snapshot(hb, {
  fingerprint = 'a'.repeat(64),
  skills = [],
  grob = {}
} = {}) {
  return {
    schemaVersion: 1,
    charakterKennung: hb.charakterKennung,
    charakterName: hb.charakterName,
    klasse: hb.klasse,
    stufe: 80,
    generation: 1,
    fingerprint,
    katalogZustand: 'bereit',
    katalogGeneration: 3,
    katalogFingerprint: 'b'.repeat(64),
    lebensnachweisGesendetAm: hb.gesendetAm,
    lebensnachweisLaufendeNummer: hb.laufendeNummer,
    skills,
    gruppenFaehigkeiten: {
      heilen: 0,
      schaden: 0,
      aggro: 0,
      schutz: 0,
      unterstuetzung: 0,
      ...grob
    },
    aktionsAutoritaet: false
  };
}

function vertrauen(snap, basis, status = 'vertraut') {
  const bewertung = basis.teilnehmerBewertungen.find(
    (row) => row.charakterKennung === snap.charakterKennung
  ) ?? null;
  return {
    schemaVersion: 1,
    status,
    charakterKennung: snap.charakterKennung,
    charakterName: snap.charakterName,
    gruende: status === 'vertraut' ? [] : ['test-blockiert'],
    snapshot: status === 'vertraut' ? snap : null,
    lebensnachweisBewertung: bewertung,
    aktionsAutoritaet: false
  };
}

function autoritaeten(...ids) {
  return ids.map((id) => ({
    charakterKennung: id,
    gruppenKoordinationErlaubt: true,
    grund: 'test-freigabe'
  }));
}

function input({
  hbs,
  eigen,
  lokal,
  remotes = [],
  auth = autoritaeten(...hbs.map((hb) => hb.charakterKennung)),
  now = 1500
}) {
  const basis = koordiniereGruppe(hbs, eigen, now);
  return {
    basis,
    eingabe: {
      basisEntscheidung: basis,
      lebensnachweise: hbs,
      lokalerSnapshot: lokal,
      remoteVertrauen: remotes.map((snap) => vertrauen(snap, basis)),
      autoritaeten: auth
    }
  };
}

test('keine statische Klassenprioritaet: Ranger gewinnt gegen Warrior durch mehr reale Damage-Capabilities', () => {
  const warriorHb = lebensnachweis({ id: 'W1', name: 'WarriorA', klasse: 'warrior' });
  const rangerHb = lebensnachweis({ id: 'R1', name: 'RangerA', klasse: 'ranger' });

  const warrior = snapshot(warriorHb, {
    skills: [skill('cleave', ['mehrziel-schaden'], { capacity: 3 })]
  });
  const ranger = snapshot(rangerHb, {
    fingerprint: 'c'.repeat(64),
    skills: [
      skill('3shot', ['mehrziel-schaden', 'fernkampf-mehrziel-schaden'], { capacity: 3 }),
      skill('5shot', ['mehrziel-schaden', 'fernkampf-mehrziel-schaden'], { capacity: 5 })
    ]
  });

  const { eingabe } = input({
    hbs: [warriorHb, rangerHb],
    eigen: 'W1',
    lokal: warrior,
    remotes: [ranger]
  });
  const result = waehleCapabilityBasierteGruppenrollen(eingabe);

  assert.equal(result.betriebsArt, 'normal');
  assert.equal(result.leaderKennung, 'R1');
  assert.equal(result.aufgaben.schaden.charakterKennung, 'R1');
  assert.deepEqual(result.aufgaben.schaden.kandidaten[0].relevanteSkills, ['3shot', '5shot']);
  assert.equal(result.aktionsAutoritaet, false);
});

test('Aufgaben werden aus konkreten Capability-Tags statt grober Klassenannahmen verteilt', () => {
  const rangerHb = lebensnachweis({ id: 'R1', name: 'RangerA', klasse: 'ranger' });
  const priestHb = lebensnachweis({ id: 'P1', name: 'PriestA', klasse: 'priest' });
  const warriorHb = lebensnachweis({ id: 'W1', name: 'WarriorA', klasse: 'warrior' });

  const ranger = snapshot(rangerHb, {
    skills: [skill('5shot', ['mehrziel-schaden', 'fernkampf-mehrziel-schaden'], { capacity: 5 })]
  });
  const priest = snapshot(priestHb, {
    fingerprint: 'c'.repeat(64),
    skills: [
      skill('heal', ['einzelziel-heilung']),
      skill('partyheal', ['gruppen-heilung', 'gruppen-erhaltung'])
    ]
  });
  const warrior = snapshot(warriorHb, {
    fingerprint: 'd'.repeat(64),
    skills: [skill('agitate', ['flaechen-aggro-kontrolle'], { capacity: 6 })]
  });

  const { eingabe } = input({
    hbs: [rangerHb, priestHb, warriorHb],
    eigen: 'R1',
    lokal: ranger,
    remotes: [priest, warrior]
  });
  const result = waehleCapabilityBasierteGruppenrollen(eingabe);

  assert.equal(result.aufgaben.schaden.charakterKennung, 'R1');
  assert.equal(result.aufgaben.heilen.charakterKennung, 'P1');
  assert.equal(result.aufgaben.unterstuetzung.charakterKennung, 'P1');
  assert.equal(result.aufgaben.aggro.charakterKennung, 'W1');
  assert.equal(result.aufgaben.schutz.charakterKennung, null);
  assert.equal(result.leaderKennung, 'P1', 'Priest deckt zwei reale Aufgabenkategorien ab');
});

test('aktuelle Safety hat Vorrang vor groesserer Capability-Breite', () => {
  const safeHb = lebensnachweis({ id: 'W1', name: 'WarriorA', klasse: 'warrior', hp: 1 });
  const lowHpHb = lebensnachweis({ id: 'R1', name: 'RangerA', klasse: 'ranger', hp: 0.2 });

  const safe = snapshot(safeHb, {
    skills: [skill('cleave', ['mehrziel-schaden'], { capacity: 3 })]
  });
  const breit = snapshot(lowHpHb, {
    fingerprint: 'c'.repeat(64),
    skills: [
      skill('3shot', ['mehrziel-schaden'], { capacity: 3 }),
      skill('5shot', ['mehrziel-schaden'], { capacity: 5 }),
      skill('supershot', ['einzelziel-spitzenschaden'])
    ]
  });

  const { eingabe } = input({
    hbs: [safeHb, lowHpHb],
    eigen: 'W1',
    lokal: safe,
    remotes: [breit]
  });
  const result = waehleCapabilityBasierteGruppenrollen(eingabe);

  assert.equal(result.leaderKennung, 'W1');
  assert.equal(result.aufgaben.schaden.charakterKennung, 'W1');
});

test('bei gleicher Safety entscheidet Capability vor Freshness und Identitaet', () => {
  const aHb = lebensnachweis({ id: 'A1', name: 'Alpha', klasse: 'ranger', gesendetAm: 1490 });
  const zHb = lebensnachweis({ id: 'Z1', name: 'Zulu', klasse: 'ranger', gesendetAm: 1400 });
  const a = snapshot(aHb, {
    skills: [skill('3shot', ['mehrziel-schaden'], { capacity: 3 })]
  });
  const z = snapshot(zHb, {
    fingerprint: 'c'.repeat(64),
    skills: [
      skill('3shot', ['mehrziel-schaden'], { capacity: 3 }),
      skill('5shot', ['mehrziel-schaden'], { capacity: 5 })
    ]
  });

  const { eingabe } = input({
    hbs: [aHb, zHb],
    eigen: 'A1',
    lokal: a,
    remotes: [z],
    now: 1500
  });
  const result = waehleCapabilityBasierteGruppenrollen(eingabe);

  assert.equal(result.aufgaben.schaden.charakterKennung, 'Z1');
  assert.equal(result.leaderKennung, 'Z1');
});

test('bei gleicher Safety und Capability entscheidet Freshness vor Kennung', () => {
  const altHb = lebensnachweis({ id: 'A1', name: 'Alpha', klasse: 'ranger', gesendetAm: 1400 });
  const frischHb = lebensnachweis({ id: 'Z1', name: 'Zulu', klasse: 'ranger', gesendetAm: 1490 });
  const a = snapshot(altHb, { skills: [skill('3shot', ['mehrziel-schaden'], { capacity: 3 })] });
  const z = snapshot(frischHb, {
    fingerprint: 'c'.repeat(64),
    skills: [skill('3shot', ['mehrziel-schaden'], { capacity: 3 })]
  });

  const { eingabe } = input({
    hbs: [altHb, frischHb],
    eigen: 'A1',
    lokal: a,
    remotes: [z],
    now: 1500
  });
  const result = waehleCapabilityBasierteGruppenrollen(eingabe);

  assert.equal(result.leaderKennung, 'Z1');
  assert.equal(result.aufgaben.schaden.charakterKennung, 'Z1');
});

test('Charakterkennung ist nur letzter deterministischer Tie-Breaker', () => {
  const aHb = lebensnachweis({ id: 'A1', name: 'Alpha', klasse: 'ranger', gesendetAm: 1490 });
  const zHb = lebensnachweis({ id: 'Z1', name: 'Zulu', klasse: 'ranger', gesendetAm: 1490 });
  const a = snapshot(aHb, { skills: [skill('3shot', ['mehrziel-schaden'], { capacity: 3 })] });
  const z = snapshot(zHb, {
    fingerprint: 'c'.repeat(64),
    skills: [skill('3shot', ['mehrziel-schaden'], { capacity: 3 })]
  });

  const { eingabe } = input({
    hbs: [zHb, aHb],
    eigen: 'A1',
    lokal: a,
    remotes: [z],
    now: 1500
  });
  const result = waehleCapabilityBasierteGruppenrollen(eingabe);

  assert.equal(result.leaderKennung, 'A1');
  assert.equal(result.aufgaben.schaden.charakterKennung, 'A1');
});

test('fehlende explizite Koordinationsautoritaet sperrt Kandidat trotz besserer Capability', () => {
  const localHb = lebensnachweis({ id: 'W1', name: 'WarriorA', klasse: 'warrior' });
  const remoteHb = lebensnachweis({ id: 'R1', name: 'RangerA', klasse: 'ranger' });
  const local = snapshot(localHb, { skills: [skill('cleave', ['mehrziel-schaden'], { capacity: 3 })] });
  const remote = snapshot(remoteHb, {
    fingerprint: 'c'.repeat(64),
    skills: [
      skill('3shot', ['mehrziel-schaden'], { capacity: 3 }),
      skill('5shot', ['mehrziel-schaden'], { capacity: 5 })
    ]
  });

  const { eingabe } = input({
    hbs: [localHb, remoteHb],
    eigen: 'W1',
    lokal: local,
    remotes: [remote],
    auth: [{
      charakterKennung: 'W1',
      gruppenKoordinationErlaubt: true,
      grund: 'local'
    }, {
      charakterKennung: 'R1',
      gruppenKoordinationErlaubt: false,
      grund: 'remote nicht autorisiert'
    }]
  });
  const result = waehleCapabilityBasierteGruppenrollen(eingabe);

  assert.equal(result.leaderKennung, 'W1');
  assert.equal(result.aufgaben.schaden.charakterKennung, 'W1');
  assert.ok(result.ausgeschlosseneTeilnehmer.some(
    (row) => row.charakterKennung === 'R1' && /nicht autorisiert/.test(row.grund)
  ));
});

test('fehlende oder blockierte Remote-Capability wird nicht durch alte grobe Lebensnachweiswerte ersetzt', () => {
  const localHb = lebensnachweis({ id: 'P1', name: 'PriestA', klasse: 'priest' });
  const remoteHb = lebensnachweis({
    id: 'R1',
    name: 'RangerA',
    klasse: 'ranger',
    grob: { schaden: 1 }
  });
  const local = snapshot(localHb, { skills: [skill('heal', ['einzelziel-heilung'])] });
  const remote = snapshot(remoteHb, {
    fingerprint: 'c'.repeat(64),
    skills: [skill('5shot', ['mehrziel-schaden'], { capacity: 5 })]
  });

  const basis = koordiniereGruppe([localHb, remoteHb], 'P1', 1500);
  const result = waehleCapabilityBasierteGruppenrollen({
    basisEntscheidung: basis,
    lebensnachweise: [localHb, remoteHb],
    lokalerSnapshot: local,
    remoteVertrauen: [vertrauen(remote, basis, 'blockiert')],
    autoritaeten: autoritaeten('P1', 'R1')
  });

  assert.equal(result.aufgaben.schaden.charakterKennung, null);
  assert.ok(result.ausgeschlosseneTeilnehmer.some(
    (row) => row.charakterKennung === 'R1' && /vertrauter Capability-Snapshot/.test(row.grund)
  ));
});

test('Safety- oder Blockierbetrieb vergibt weder normalen Leader noch Aufgaben', () => {
  const hb = lebensnachweis({
    id: 'R1',
    name: 'RangerA',
    klasse: 'ranger',
    gefahr: 'kritisch'
  });
  const snap = snapshot(hb, {
    skills: [skill('5shot', ['mehrziel-schaden'], { capacity: 5 })]
  });
  const basis = koordiniereGruppe([hb], 'R1', 1500);
  assert.equal(basis.betriebsArt, 'sicherheit');

  const result = waehleCapabilityBasierteGruppenrollen({
    basisEntscheidung: basis,
    lebensnachweise: [hb],
    lokalerSnapshot: snap,
    remoteVertrauen: [],
    autoritaeten: autoritaeten('R1')
  });

  assert.equal(result.leaderKennung, null);
  assert.deepEqual(result.aufgabenZuordnung, {
    heilen: null,
    schaden: null,
    aggro: null,
    schutz: null,
    unterstuetzung: null
  });
  assert.equal(result.aktionsAutoritaet, false);
});

test('alter lokaler Snapshot wird trotz aktiver neuer Liveness fail-closed ausgeschlossen', () => {
  const altHb = lebensnachweis({
    id: 'R1',
    name: 'RangerA',
    klasse: 'ranger',
    gesendetAm: 1000,
    laufendeNummer: 1
  });
  const neuHb = lebensnachweis({
    id: 'R1',
    name: 'RangerA',
    klasse: 'ranger',
    gesendetAm: 1490,
    laufendeNummer: 2
  });
  const alterSnapshot = snapshot(altHb, {
    skills: [skill('5shot', ['mehrziel-schaden'], { capacity: 5 })]
  });
  const basis = koordiniereGruppe([neuHb], 'R1', 1500);
  const result = waehleCapabilityBasierteGruppenrollen({
    basisEntscheidung: basis,
    lebensnachweise: [neuHb],
    lokalerSnapshot: alterSnapshot,
    remoteVertrauen: [],
    autoritaeten: autoritaeten('R1')
  });

  assert.equal(result.leaderKennung, null);
  assert.equal(result.aufgaben.schaden.charakterKennung, null);
  assert.match(result.ausgeschlosseneTeilnehmer[0].grund, /nicht an den aktuell aktiven/);
});

test('zwei Ranger derselben Klasse bleiben capability-seitig getrennte Kandidaten', () => {
  const r1Hb = lebensnachweis({ id: 'R1', name: 'RangerA', klasse: 'ranger' });
  const r2Hb = lebensnachweis({ id: 'R2', name: 'RangerB', klasse: 'ranger' });
  const r1 = snapshot(r1Hb, {
    skills: [skill('3shot', ['mehrziel-schaden'], { capacity: 3 })]
  });
  const r2 = snapshot(r2Hb, {
    fingerprint: 'c'.repeat(64),
    skills: [skill('5shot', ['mehrziel-schaden'], { capacity: 5 })]
  });

  const { eingabe } = input({
    hbs: [r1Hb, r2Hb],
    eigen: 'R1',
    lokal: r1,
    remotes: [r2]
  });
  const result = waehleCapabilityBasierteGruppenrollen(eingabe);

  assert.equal(result.aufgaben.schaden.charakterKennung, 'R2');
  assert.equal(result.aufgaben.schaden.kandidaten.length, 2);
  assert.deepEqual(
    result.vertrauteTeilnehmerKennungen,
    ['R1', 'R2']
  );
});
