import test from 'node:test';
import assert from 'node:assert/strict';
import { AdventureLandCapabilityFreigabe } from '../../erzeugt/ausfuehrung/adventure-land-capability-freigabe.js';
import { CAPABILITY_SYNC_PROTOKOLL } from '../../erzeugt/vertraege/capability-sync.js';
import { GRUPPEN_LEBENSNACHWEIS_PROTOKOLL } from '../../erzeugt/vertraege/gruppen-lebensnachweis.js';
import { koordiniereGruppe } from '../../erzeugt/spiellogik/gruppen-koordination.js';

function skillDaten() {
  return {
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
}

function heartbeat({
  id = 'R1',
  name = 'RangerA',
  gesendetAm = 1000,
  laufendeNummer = 1
} = {}) {
  return {
    schemaVersion: 1,
    charakterKennung: id,
    charakterName: name,
    klasse: 'ranger',
    serverRegion: 'EU',
    serverKennung: 'I',
    karte: 'main',
    instanz: 'main',
    lebendig: true,
    lebensAnteil: 1,
    manaAnteil: 1,
    zielKennung: 'goo-1',
    gefahrenStufe: 'sicher',
    faehigkeiten: { heilen: 0, schaden: 1, aggro: 0, schutz: 0, unterstuetzung: 0 },
    gesendetAm,
    laufendeNummer
  };
}

function rootFenster() {
  const gesendet = [];
  const weitergereicht = [];
  const root = {
    character: {
      id: 'R1',
      name: 'RangerA',
      ctype: 'ranger',
      level: 80,
      hp: 1000,
      max_hp: 1000,
      mp: 2000,
      max_mp: 2000,
      map: 'main',
      target: 'goo-1',
      slots: { mainhand: { name: 'bow1' } },
      items: []
    },
    G: {
      skills: skillDaten(),
      items: { bow1: { wtype: 'bow', type: 'weapon' } }
    },
    server_region: 'EU',
    server_identifier: 'I',
    next_skill: {},
    is_on_cooldown() { return false; },
    can_use() { return true; },
    async send_cm(ziel, daten) {
      gesendet.push({ ziel, daten });
      return { receivers: [ziel] };
    },
    on_cm(absender, daten) {
      weitergereicht.push({ absender, daten });
      if (daten?.protokoll === GRUPPEN_LEBENSNACHWEIS_PROTOKOLL) return true;
      return 'ALT';
    },
    gesendet,
    weitergereicht
  };
  return root;
}

function produktionsRuntime({ aktiv = false, remote = null } = {}) {
  const lokal = heartbeat();
  return {
    version: '1.1.5',
    status() {
      return {
        schemaVersion: 1,
        version: '1.1.5',
        aktivFreigegeben: aktiv,
        empfangInstalliert: aktiv,
        lebensnachweisAutomatikAktiv: aktiv,
        lebensnachweisSendeErfolge: aktiv ? 3 : 0
      };
    },
    pruefeGruppenZustand() {
      const meldungen = remote ? [lokal, remote] : [lokal];
      return {
        schemaVersion: 1,
        zeitpunkt: 1000,
        lokalerLebensnachweis: lokal,
        koordination: koordiniereGruppe(meldungen, 'R1', 1000),
        laufendeGruppenAnfragen: [],
        ressourcenSperren: [],
        liveSmokeInstalliert: false,
        gruppenZielVorbereitungVerbraucht: false
      };
    }
  };
}

function optionen(aktivFreigegeben) {
  return {
    aktivFreigegeben,
    ablaufKennung: 'block86-test',
    vertrauensNamen: ['RangerB'],
    koordinationsNamen: ['RangerA', 'RangerB'],
    policyVorgaben: [
      { skillId: '3shot', freigegeben: true, parameter: { mindestensZiele: 2 } },
      { skillId: '5shot', freigegeben: false, parameter: { mindestensZiele: 4 } }
    ]
  };
}

test('8.6.9: Schatten aktualisiert Live-Katalog und lokale Capabilities bei exakt 0 CM-Sendungen', () => {
  const root = rootFenster();
  const runtime = produktionsRuntime({ aktiv: false });
  const capability = new AdventureLandCapabilityFreigabe(root, runtime, optionen(false), () => 1000);

  const update = capability.aktualisiere();

  assert.equal(root.gesendet.length, 0);
  assert.equal(update.status.aktivFreigegeben, false);
  assert.equal(update.status.remoteBeobachtungInstalliert, false);
  assert.equal(update.status.capabilityEmpfangInstalliert, false);
  assert.equal(update.status.senden.versuche, 0);
  assert.equal(update.status.audit.produktionsbereit, true);
  assert.ok(update.lokalerSnapshot);
  const shot3 = update.status.faehigkeiten.skills.find((row) => row.skillId === '3shot');
  const shot5 = update.status.faehigkeiten.skills.find((row) => row.skillId === '5shot');
  assert.equal(shot3.aktuellAutomatisierbar, true);
  assert.equal(shot5.technischBereit, true);
  assert.equal(shot5.vomNutzerFreigegeben, false);
  assert.equal(shot5.aktuellAutomatisierbar, false);
  assert.equal(update.status.spielAutoritaet, false);
  assert.equal(update.status.neustartAutoritaet, false);
});

test('8.6.9: Schattenmodus kann Remote-Beobachtung und Capability-Senden nicht aktivieren', async () => {
  const root = rootFenster();
  const capability = new AdventureLandCapabilityFreigabe(
    root,
    produktionsRuntime({ aktiv: false }),
    optionen(false),
    () => 1000
  );

  assert.throws(
    () => capability.installiereRemoteBeobachtung(),
    /Schattenmodus gesperrt/
  );
  await assert.rejects(
    () => capability.sendeCapabilityEinmal('RangerB', 'BLOCK8-6-CAPABILITY-SENDEN:RangerB'),
    /Schattenmodus gesperrt/
  );
  assert.equal(root.gesendet.length, 0);
});

test('8.6.9: Live-Beobachtung nutzt akzeptierten bestehenden Block-8-Heartbeat und laesst alten Handler intakt', () => {
  const remoteHb = heartbeat({ id: 'R2', name: 'RangerB' });
  const root = rootFenster();
  const capability = new AdventureLandCapabilityFreigabe(
    root,
    produktionsRuntime({ aktiv: true, remote: remoteHb }),
    optionen(true),
    () => 1000
  );
  const erste = capability.aktualisiere();
  const katalogFingerprint = erste.status.audit.katalog.fingerprint;
  assert.ok(katalogFingerprint);

  capability.installiereRemoteBeobachtung();
  assert.equal(root.gesendet.length, 0);

  const heartbeatUmschlag = {
    schemaVersion: 1,
    protokoll: GRUPPEN_LEBENSNACHWEIS_PROTOKOLL,
    absenderName: 'RangerB',
    meldung: remoteHb
  };
  assert.equal(root.on_cm('RangerB', heartbeatUmschlag), true);
  assert.ok(root.weitergereicht.some((row) => row.daten === heartbeatUmschlag));

  const remoteSnapshot = {
    schemaVersion: 1,
    charakterKennung: 'R2',
    charakterName: 'RangerB',
    klasse: 'ranger',
    stufe: 80,
    generation: 2,
    fingerprint: 'c'.repeat(64),
    katalogZustand: 'bereit',
    katalogGeneration: 1,
    katalogFingerprint,
    lebensnachweisGesendetAm: remoteHb.gesendetAm,
    lebensnachweisLaufendeNummer: remoteHb.laufendeNummer,
    skills: [{
      skillId: '5shot',
      capabilityTags: ['mehrziel-schaden', 'fernkampf-mehrziel-schaden'],
      zielKapazitaet: 5,
      enabled: true,
      configuredReady: true,
      aktuellAutomatisierbar: true,
      parameter: { mindestensZiele: 4 }
    }],
    gruppenFaehigkeiten: { heilen: 0, schaden: 1, aggro: 0, schutz: 0, unterstuetzung: 0 },
    aktionsAutoritaet: false
  };
  const capabilityUmschlag = {
    schemaVersion: 1,
    protokoll: CAPABILITY_SYNC_PROTOKOLL,
    absenderName: 'RangerB',
    snapshot: remoteSnapshot
  };
  assert.equal(root.on_cm('RangerB', capabilityUmschlag), true);

  const update = capability.aktualisiere();
  assert.equal(update.status.beobachteteLebensnachweise, 1);
  assert.equal(update.status.empfangeneCapabilitySnapshots, 1);
  assert.equal(update.status.remoteVertrauen[0].status, 'vertraut');
  assert.ok(update.status.gruppenwahl);
  assert.deepEqual(update.status.gruppenwahl.vertrauteTeilnehmerKennungen, ['R1', 'R2']);
  assert.equal(root.gesendet.length, 0);
});

test('8.6.9: kontrolliertes Capability-Senden ist explizit bestaetigter One-Shot und zaehlt Erfolg', async () => {
  const remoteHb = heartbeat({ id: 'R2', name: 'RangerB' });
  const root = rootFenster();
  const capability = new AdventureLandCapabilityFreigabe(
    root,
    produktionsRuntime({ aktiv: true, remote: remoteHb }),
    optionen(true),
    () => 1000
  );

  capability.aktualisiere();
  capability.installiereRemoteBeobachtung();

  await assert.rejects(
    () => capability.sendeCapabilityEinmal('RangerB', 'FALSCH'),
    /Falscher Capability-Sendebestaetigungstext/
  );
  assert.equal(root.gesendet.length, 0);

  const antwort = await capability.sendeCapabilityEinmal(
    'RangerB',
    capability.sendeBestaetigungsText('RangerB')
  );
  assert.equal(antwort.ergebnis.gesendet, true);
  assert.equal(root.gesendet.length, 1);
  assert.equal(root.gesendet[0].ziel, 'RangerB');
  assert.equal(root.gesendet[0].daten.protokoll, CAPABILITY_SYNC_PROTOKOLL);
  assert.equal(antwort.status.senden.versuche, 1);
  assert.equal(antwort.status.senden.erfolge, 1);
  assert.equal(antwort.status.senden.fehler, 0);
});

test('8.6.9: Live-Beobachtung verlangt bereits aktive bestehende Block-8-Liveness', () => {
  const root = rootFenster();
  const capability = new AdventureLandCapabilityFreigabe(
    root,
    produktionsRuntime({ aktiv: false }),
    optionen(true),
    () => 1000
  );

  assert.throws(
    () => capability.installiereRemoteBeobachtung(),
    /Block-8-Produktionsruntime/
  );
  assert.equal(root.gesendet.length, 0);
});

test('8.6.9: stoppe entfernt nur Capability-Wrapper und stoppt die Produktionsruntime nicht', () => {
  const remoteHb = heartbeat({ id: 'R2', name: 'RangerB' });
  const root = rootFenster();
  const alterHandler = root.on_cm;
  const runtime = produktionsRuntime({ aktiv: true, remote: remoteHb });
  const capability = new AdventureLandCapabilityFreigabe(
    root,
    runtime,
    optionen(true),
    () => 1000
  );

  capability.aktualisiere();
  capability.installiereRemoteBeobachtung();
  assert.notEqual(root.on_cm, alterHandler);

  capability.stoppe();
  assert.equal(root.on_cm, alterHandler);
  assert.equal(runtime.status().lebensnachweisAutomatikAktiv, true);
});
