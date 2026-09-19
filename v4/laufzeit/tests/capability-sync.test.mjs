import test from 'node:test';
import assert from 'node:assert/strict';
import {
  erstelleCapabilitySyncSnapshot,
  liesCapabilitySyncSnapshot,
  pruefeRemoteCapabilityVertrauen
} from '../../erzeugt/spiellogik/capability-sync.js';

function lebensnachweis({
  charakterKennung = 'R1',
  charakterName = 'RangerA',
  klasse = 'ranger',
  gesendetAm = 1000,
  laufendeNummer = 7
} = {}) {
  return {
    schemaVersion: 1,
    charakterKennung,
    charakterName,
    klasse,
    serverRegion: 'EU',
    serverKennung: 'I',
    karte: 'main',
    instanz: 'main',
    lebendig: true,
    lebensAnteil: 1,
    manaAnteil: 1,
    zielKennung: null,
    gefahrenStufe: 'sicher',
    faehigkeiten: { heilen: 0, schaden: 1, aggro: 0, schutz: 0, unterstuetzung: 0 },
    gesendetAm,
    laufendeNummer
  };
}

function skill(skillId, {
  validiert = true,
  strukturell = true,
  enabled = true,
  configuredReady = true,
  aktuell = true,
  tags = ['mehrziel-schaden'],
  zielKapazitaet = 3,
  parameter = { mindestensZiele: 2 }
} = {}) {
  return {
    schemaVersion: 1,
    skillId,
    skillName: skillId,
    capabilityTags: tags,
    zielKapazitaet,
    strukturellVorhanden: strukturell,
    automationValidated: validiert,
    technischBereit: aktuell,
    vomNutzerFreigegeben: enabled,
    automatisierungKonfiguriert: configuredReady,
    aktuellAutomatisierbar: aktuell,
    parameter,
    technischeAuswertung: {
      schemaVersion: 1,
      skillId,
      aufgenommenAm: 1000,
      zustand: aktuell ? 'bereit' : 'blockiert',
      ausruestungBereit: aktuell,
      materialBereit: aktuell,
      manaBereit: aktuell,
      aktionsBereitschaft: {
        schemaVersion: 1,
        aufgenommenAm: 1000,
        aktionsName: skillId,
        zustand: aktuell ? 'bereit' : 'unbekannt',
        bereitAb: null,
        restMillisekunden: null,
        grund: 'test'
      },
      gruende: [],
      aktionsFreigabe: false
    },
    grund: 'test'
  };
}

function charakterFaehigkeiten(overrides = {}) {
  return {
    schemaVersion: 1,
    aufgenommenAm: 1000,
    charakterKennung: 'R1',
    charakterName: 'RangerA',
    klasse: 'ranger',
    stufe: 80,
    generation: 4,
    fingerprint: 'a'.repeat(64),
    katalogZustand: 'bereit',
    katalogGeneration: 3,
    katalogFingerprint: 'b'.repeat(64),
    katalogVertrauenswuerdig: true,
    skills: [
      skill('3shot'),
      skill('5shot', { zielKapazitaet: 5, parameter: { mindestensZiele: 4 } }),
      skill('mystery', { validiert: false, tags: ['mehrziel-schaden'], zielKapazitaet: null })
    ],
    capabilities: [],
    gruppenFaehigkeiten: { heilen: 0, schaden: 2, aggro: 0, schutz: 0, unterstuetzung: 0 },
    aktionsAutoritaet: false,
    ...overrides
  };
}

function katalog({
  zustand = 'bereit',
  fingerprint = 'b'.repeat(64),
  bestaetigungErforderlich = false
} = {}) {
  return {
    schemaVersion: 1,
    quelle: 'adventure-land-g-skills',
    aufgenommenAm: 1000,
    generation: 3,
    zustand,
    grund: zustand === 'bereit' ? null : 'test',
    fingerprint,
    vorherigerFingerprint: null,
    skills: [],
    automationValidatedAnzahl: 0,
    fehler: [],
    bestaetigungErforderlich,
    spielAutoritaet: false
  };
}

function empfang(snapshot, absenderName = 'RangerA') {
  return {
    schemaVersion: 1,
    absenderName,
    empfangenAm: 1010,
    snapshot
  };
}

function lebensnachweisEmpfang(meldung = lebensnachweis(), absenderName = 'RangerA') {
  return {
    schemaVersion: 1,
    absenderName,
    empfangenAm: 1005,
    meldung
  };
}

function bewertung({
  charakterKennung = 'R1',
  status = 'aktiv',
  alterMillisekunden = 10
} = {}) {
  return {
    charakterKennung,
    status,
    grund: 'test',
    alterMillisekunden
  };
}

test('Snapshot ist bounded, an genau einen Lebensnachweis gebunden und enthaelt nur validierte strukturelle Skills', () => {
  const hb = lebensnachweis();
  const result = erstelleCapabilitySyncSnapshot(charakterFaehigkeiten(), { lebensnachweis: hb });

  assert.equal(result.status, 'bereit');
  assert.ok(result.snapshot);
  assert.equal(result.snapshot.lebensnachweisGesendetAm, hb.gesendetAm);
  assert.equal(result.snapshot.lebensnachweisLaufendeNummer, hb.laufendeNummer);
  assert.deepEqual(result.snapshot.skills.map((row) => row.skillId), ['3shot', '5shot']);
  assert.equal(result.snapshot.skills[0].enabled, true);
  assert.equal(result.snapshot.skills[0].configuredReady, true);
  assert.equal(result.snapshot.skills[0].zielKapazitaet, 3);
  assert.deepEqual(result.snapshot.skills[0].parameter, { mindestensZiele: 2 });
  assert.equal(result.snapshot.aktionsAutoritaet, false);
});

test('Snapshot-Bau blockiert bei nicht bereitem Katalog oder falscher Heartbeat-Identitaet', () => {
  const stale = charakterFaehigkeiten({
    katalogZustand: 'veraltet',
    katalogVertrauenswuerdig: false
  });
  assert.equal(
    erstelleCapabilitySyncSnapshot(stale, { lebensnachweis: lebensnachweis() }).status,
    'blockiert'
  );

  const falscherHeartbeat = lebensnachweis({ charakterKennung: 'R2' });
  const result = erstelleCapabilitySyncSnapshot(charakterFaehigkeiten(), { lebensnachweis: falscherHeartbeat });
  assert.equal(result.status, 'blockiert');
  assert.match(result.gruende.join(' '), /Charakterkennung/);
});

test('Remote-Capability wird nur mit aktivem exakt gebundenem Block-8-Lebensnachweis vertraut', () => {
  const hb = lebensnachweis();
  const gebaut = erstelleCapabilitySyncSnapshot(charakterFaehigkeiten(), { lebensnachweis: hb });
  const snapshot = gebaut.snapshot;
  assert.ok(snapshot);

  const result = pruefeRemoteCapabilityVertrauen({
    empfang: empfang(snapshot),
    lebensnachweisEmpfang: lebensnachweisEmpfang(hb),
    lebensnachweisBewertung: bewertung(),
    lokalerKatalog: katalog()
  });

  assert.equal(result.status, 'vertraut');
  assert.equal(result.snapshot, snapshot);
  assert.equal(result.aktionsAutoritaet, false);
});

test('staler Lebensnachweis blockiert Remote-Capability ohne eigenen Capability-TTL', () => {
  const hb = lebensnachweis();
  const snapshot = erstelleCapabilitySyncSnapshot(charakterFaehigkeiten(), { lebensnachweis: hb }).snapshot;
  assert.ok(snapshot);

  const result = pruefeRemoteCapabilityVertrauen({
    empfang: empfang(snapshot),
    lebensnachweisEmpfang: lebensnachweisEmpfang(hb),
    lebensnachweisBewertung: bewertung({ status: 'veraltet', alterMillisekunden: 6000 }),
    lokalerKatalog: katalog()
  });

  assert.equal(result.status, 'blockiert');
  assert.match(result.gruende.join(' '), /nicht aktiv: veraltet/);
  assert.equal(result.snapshot, null);
});

test('neuer Lebensnachweis kann keinen alten Capability-Snapshot versehentlich frisch machen', () => {
  const alt = lebensnachweis({ gesendetAm: 1000, laufendeNummer: 7 });
  const neu = lebensnachweis({ gesendetAm: 2000, laufendeNummer: 8 });
  const snapshot = erstelleCapabilitySyncSnapshot(charakterFaehigkeiten(), { lebensnachweis: alt }).snapshot;
  assert.ok(snapshot);

  const result = pruefeRemoteCapabilityVertrauen({
    empfang: empfang(snapshot),
    lebensnachweisEmpfang: lebensnachweisEmpfang(neu),
    lebensnachweisBewertung: bewertung(),
    lokalerKatalog: katalog()
  });

  assert.equal(result.status, 'blockiert');
  assert.match(result.gruende.join(' '), /nicht an genau den aktuellen Lebensnachweis gebunden/);
});

test('lokaler stale Katalog und Catalog-Fingerprint-Mismatch blockieren fail-closed', () => {
  const hb = lebensnachweis();
  const snapshot = erstelleCapabilitySyncSnapshot(charakterFaehigkeiten(), { lebensnachweis: hb }).snapshot;
  assert.ok(snapshot);

  const stale = pruefeRemoteCapabilityVertrauen({
    empfang: empfang(snapshot),
    lebensnachweisEmpfang: lebensnachweisEmpfang(hb),
    lebensnachweisBewertung: bewertung(),
    lokalerKatalog: katalog({ zustand: 'veraltet', bestaetigungErforderlich: true })
  });
  assert.equal(stale.status, 'blockiert');
  assert.match(stale.gruende.join(' '), /Lokaler Skill-Katalog/);

  const mismatch = pruefeRemoteCapabilityVertrauen({
    empfang: empfang(snapshot),
    lebensnachweisEmpfang: lebensnachweisEmpfang(hb),
    lebensnachweisBewertung: bewertung(),
    lokalerKatalog: katalog({ fingerprint: 'c'.repeat(64) })
  });
  assert.equal(mismatch.status, 'blockiert');
  assert.match(mismatch.gruende.join(' '), /unterschiedliche Fingerprints/);
});

test('Sender-Spoof und Charakterkennungs-Mismatch werden getrennt blockiert', () => {
  const hb = lebensnachweis();
  const snapshot = erstelleCapabilitySyncSnapshot(charakterFaehigkeiten(), { lebensnachweis: hb }).snapshot;
  assert.ok(snapshot);

  const spoof = pruefeRemoteCapabilityVertrauen({
    empfang: empfang(snapshot, 'Attacker'),
    lebensnachweisEmpfang: lebensnachweisEmpfang(hb),
    lebensnachweisBewertung: bewertung(),
    lokalerKatalog: katalog()
  });
  assert.equal(spoof.status, 'blockiert');
  assert.match(spoof.gruende.join(' '), /Sendername/);

  const falscheKennung = pruefeRemoteCapabilityVertrauen({
    empfang: empfang(snapshot),
    lebensnachweisEmpfang: lebensnachweisEmpfang(lebensnachweis({ charakterKennung: 'R2' })),
    lebensnachweisBewertung: bewertung({ charakterKennung: 'R2' }),
    lokalerKatalog: katalog()
  });
  assert.equal(falscheKennung.status, 'blockiert');
  assert.match(falscheKennung.gruende.join(' '), /Charakterkennung/);
});

test('zwei Ranger derselben Klasse bleiben durch Charakterkennung und Heartbeat-Bindung getrennt', () => {
  const hb1 = lebensnachweis({ charakterKennung: 'R1', charakterName: 'RangerA', laufendeNummer: 1 });
  const hb2 = lebensnachweis({ charakterKennung: 'R2', charakterName: 'RangerB', laufendeNummer: 1 });
  const faehigkeiten2 = charakterFaehigkeiten({
    charakterKennung: 'R2',
    charakterName: 'RangerB',
    fingerprint: 'd'.repeat(64)
  });
  const snapshot1 = erstelleCapabilitySyncSnapshot(charakterFaehigkeiten(), { lebensnachweis: hb1 }).snapshot;
  const snapshot2 = erstelleCapabilitySyncSnapshot(faehigkeiten2, { lebensnachweis: hb2 }).snapshot;
  assert.ok(snapshot1);
  assert.ok(snapshot2);

  const r1 = pruefeRemoteCapabilityVertrauen({
    empfang: empfang(snapshot1, 'RangerA'),
    lebensnachweisEmpfang: lebensnachweisEmpfang(hb1, 'RangerA'),
    lebensnachweisBewertung: bewertung({ charakterKennung: 'R1' }),
    lokalerKatalog: katalog()
  });
  const r2 = pruefeRemoteCapabilityVertrauen({
    empfang: empfang(snapshot2, 'RangerB'),
    lebensnachweisEmpfang: lebensnachweisEmpfang(hb2, 'RangerB'),
    lebensnachweisBewertung: bewertung({ charakterKennung: 'R2' }),
    lokalerKatalog: katalog()
  });
  assert.equal(r1.status, 'vertraut');
  assert.equal(r2.status, 'vertraut');
  assert.notEqual(r1.snapshot.charakterKennung, r2.snapshot.charakterKennung);
});

test('Parser verwirft unbekannte Autoritaet, doppelte Skills und unbounded Parameter fail-closed', () => {
  const hb = lebensnachweis();
  const snapshot = erstelleCapabilitySyncSnapshot(charakterFaehigkeiten(), { lebensnachweis: hb }).snapshot;
  assert.ok(snapshot);

  assert.equal(liesCapabilitySyncSnapshot({ ...snapshot, aktionsAutoritaet: true }), null);
  assert.equal(liesCapabilitySyncSnapshot({
    ...snapshot,
    skills: [snapshot.skills[0], snapshot.skills[0]]
  }), null);
  assert.equal(liesCapabilitySyncSnapshot({
    ...snapshot,
    skills: [{
      ...snapshot.skills[0],
      parameter: {
        a: 1, b: 1, c: 1, d: 1, e: 1, f: 1, g: 1, h: 1, i: 1
      }
    }]
  }), null);
});
