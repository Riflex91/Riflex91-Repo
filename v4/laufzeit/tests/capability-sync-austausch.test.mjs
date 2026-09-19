import test from 'node:test';
import assert from 'node:assert/strict';
import { AdventureLandCapabilitySyncAustausch } from '../../erzeugt/ausfuehrung/adventure-land-capability-sync-austausch.js';

function snapshot(overrides = {}) {
  return {
    schemaVersion: 1,
    charakterKennung: 'R1',
    charakterName: 'RangerA',
    klasse: 'ranger',
    stufe: 80,
    generation: 4,
    fingerprint: 'a'.repeat(64),
    katalogZustand: 'bereit',
    katalogGeneration: 3,
    katalogFingerprint: 'b'.repeat(64),
    lebensnachweisGesendetAm: 1000,
    lebensnachweisLaufendeNummer: 7,
    skills: [{
      skillId: '3shot',
      capabilityTags: ['mehrziel-schaden', 'fernkampf-mehrziel-schaden'],
      zielKapazitaet: 3,
      enabled: true,
      configuredReady: true,
      aktuellAutomatisierbar: true,
      parameter: { mindestensZiele: 2 }
    }],
    gruppenFaehigkeiten: { heilen: 0, schaden: 1, aggro: 0, schutz: 0, unterstuetzung: 0 },
    aktionsAutoritaet: false,
    ...overrides
  };
}

function fenster() {
  const gesendet = [];
  return {
    character: { name: 'RangerA' },
    gesendet,
    async send_cm(ziel, daten) {
      gesendet.push({ ziel, daten });
      return { receivers: [ziel] };
    },
    on_cm: undefined
  };
}

test('Capability-Transport besitzt keinen eigenen Liveness-Timer und nutzt bestehende Vertrauensnamen', () => {
  const root = fenster();
  const austausch = new AdventureLandCapabilitySyncAustausch(root, {
    aktivFreigegeben: true,
    vertrauensNamen: ['RangerB'],
    jetzt: () => 1000
  });

  const status = austausch.holeStatus();
  assert.equal(status.eigenerLivenessTimer, false);
  assert.equal(status.freshnessQuelle, 'block8-gruppen-lebensnachweis');
  assert.equal(status.aktionsAutoritaet, false);
  assert.deepEqual(status.vertrauensNamen, ['RangerB']);
});

test('Capability-Snapshot wird nur an ausdruecklich vertrauten bestaetigten Empfaenger gesendet', async () => {
  const root = fenster();
  const austausch = new AdventureLandCapabilitySyncAustausch(root, {
    aktivFreigegeben: true,
    vertrauensNamen: ['RangerB'],
    jetzt: () => 1000
  });

  const blockiert = await austausch.sendeSnapshot('Attacker', snapshot());
  assert.equal(blockiert.gesendet, false);
  assert.match(blockiert.grund, /Vertrauensliste/);

  const ok = await austausch.sendeSnapshot('RangerB', snapshot());
  assert.equal(ok.gesendet, true);
  assert.equal(root.gesendet.length, 1);
  assert.equal(root.gesendet[0].ziel, 'RangerB');
  assert.equal(root.gesendet[0].daten.protokoll, 'v4-capability-sync-v1');
  assert.equal(root.gesendet[0].daten.absenderName, 'RangerA');
});

test('send_cm Bestaetigung muss den Zielcharakter explizit enthalten', async () => {
  const root = fenster();
  root.send_cm = async () => ({ receivers: ['SomeoneElse'] });
  const austausch = new AdventureLandCapabilitySyncAustausch(root, {
    aktivFreigegeben: true,
    vertrauensNamen: ['RangerB'],
    jetzt: () => 1000
  });

  const result = await austausch.sendeSnapshot('RangerB', snapshot());
  assert.equal(result.gesendet, false);
  assert.match(result.grund, /nicht als Empfaenger bestaetigt/);
});

test('Empfang akzeptiert nur vertrauensgebundenen Sender mit passendem Snapshot-Namen', () => {
  const root = fenster();
  const empfangen = [];
  const austausch = new AdventureLandCapabilitySyncAustausch(root, {
    aktivFreigegeben: true,
    vertrauensNamen: ['RangerB'],
    jetzt: () => 1010
  });
  assert.equal(austausch.installiereEmpfang((wert) => empfangen.push(wert)), true);

  const umschlag = {
    schemaVersion: 1,
    protokoll: 'v4-capability-sync-v1',
    absenderName: 'RangerB',
    snapshot: snapshot({
      charakterKennung: 'R2',
      charakterName: 'RangerB',
      fingerprint: 'c'.repeat(64)
    })
  };

  assert.equal(root.on_cm('RangerB', umschlag), true);
  assert.equal(empfangen.length, 1);
  assert.equal(empfangen[0].absenderName, 'RangerB');
  assert.equal(empfangen[0].snapshot.charakterKennung, 'R2');

  assert.equal(root.on_cm('Attacker', umschlag), false);
  assert.equal(empfangen.length, 1);
});

test('fremde CM-Protokolle werden an vorhandenen on_cm Handler weitergereicht', () => {
  const root = fenster();
  const weitergereicht = [];
  root.on_cm = (absender, daten) => {
    weitergereicht.push({ absender, daten });
    return 'ALT';
  };
  const austausch = new AdventureLandCapabilitySyncAustausch(root, {
    aktivFreigegeben: true,
    vertrauensNamen: ['RangerB'],
    jetzt: () => 1010
  });
  austausch.installiereEmpfang(() => {});

  const result = root.on_cm('RangerB', { protokoll: 'anderes-protokoll' });
  assert.equal(result, 'ALT');
  assert.equal(weitergereicht.length, 1);
});

test('Empfang kann ohne Zerstoerung des vorherigen CM-Handlers entfernt werden', () => {
  const root = fenster();
  const alt = () => 'ALT';
  root.on_cm = alt;
  const austausch = new AdventureLandCapabilitySyncAustausch(root, {
    aktivFreigegeben: true,
    vertrauensNamen: ['RangerB'],
    jetzt: () => 1010
  });

  assert.equal(austausch.installiereEmpfang(() => {}), true);
  assert.notEqual(root.on_cm, alt);
  assert.equal(austausch.entferneEmpfang(), true);
  assert.equal(root.on_cm, alt);
  assert.equal(austausch.entferneEmpfang(), false);
});
