import test from 'node:test';
import assert from 'node:assert/strict';
import { AdventureLandSkillKatalogAuditSteuerung } from '../../erzeugt/adventure-land/adventure-land-skill-katalog-audit.js';

function gelesen(wert) {
  return { vorhanden: true, wert, lesefehler: null };
}

function fehlend() {
  return { vorhanden: false, wert: undefined, lesefehler: null };
}

function basisSkills() {
  return {
    '3shot': {
      type: 'skill',
      class: ['ranger'],
      name: '3-Shot',
      level: 60,
      mp: 200,
      damage_multiplier: 0.7,
      cooldown_multiplier: 1,
      multi: true,
      share: 'attack',
      hostile: true,
      wtype: ['bow', 'crossbow'],
      pierces_immunity: true,
      procs: true,
      use_range: true,
      damage_type: 'physical'
    }
  };
}

function rohDaten(aenderungen = {}) {
  const basis = {
    charakter: gelesen({
      id: 'Ranger-1',
      name: 'Ranger-1',
      ctype: 'ranger',
      level: 75
    }),
    entities: gelesen({}),
    gruppe: gelesen({}),
    spielDaten: gelesen({ skills: basisSkills() }),
    serverRegion: gelesen('EU'),
    serverKennung: gelesen('I')
  };
  return { ...basis, ...aenderungen };
}

function quelle(start = rohDaten()) {
  return {
    aktuell: start,
    liesRohdaten() {
      return this.aktuell;
    }
  };
}

test('Runtime-Start installiert periodische read-only Audits ohne neue Autoritaet', () => {
  const datenQuelle = quelle();
  const audit = new AdventureLandSkillKatalogAuditSteuerung(datenQuelle, {
    periodischesIntervallMillisekunden: 5000
  });

  let jetzt = 1000;
  let callback = null;
  let geloescht = null;
  const status = audit.starte({
    jetzt: () => jetzt,
    setzeIntervall: (aktion, intervall) => {
      assert.equal(intervall, 5000);
      callback = aktion;
      return 'audit-timer';
    },
    loescheIntervall: (kennung) => {
      geloescht = kennung;
    }
  });

  assert.equal(status.gestartet, true);
  assert.equal(status.auditNummer, 1);
  assert.deepEqual(status.letzteAusloeser, ['runtime_start']);
  assert.equal(status.katalog.zustand, 'bereit');
  assert.equal(status.produktionsbereit, true);
  assert.equal(status.aktionsAutoritaet, false);
  assert.equal(status.automatischerNeustart, false);

  jetzt = 6000;
  assert.equal(typeof callback, 'function');
  callback();
  const periodisch = audit.status();
  assert.equal(periodisch.auditNummer, 2);
  assert.deepEqual(periodisch.letzteAusloeser, ['periodisch']);
  assert.equal(periodisch.katalog.generation, 1);

  const gestoppt = audit.stoppe();
  assert.equal(gestoppt.gestartet, false);
  assert.equal(geloescht, 'audit-timer');
});

test('Connection-Gap -> Recovery bleibt veraltet bis exakte Revalidierung', () => {
  const datenQuelle = quelle();
  const audit = new AdventureLandSkillKatalogAuditSteuerung(datenQuelle);

  const start = audit.pruefe(1000, 'runtime_start');
  assert.equal(start.katalog.zustand, 'bereit');
  const fingerprint = start.katalog.fingerprint;
  assert.ok(fingerprint);

  datenQuelle.aktuell = rohDaten({ serverKennung: fehlend() });
  const gap = audit.pruefe(2000);
  assert.equal(gap.connectionGapAktiv, true);
  assert.equal(gap.katalog.zustand, 'veraltet');
  assert.equal(gap.produktionsbereit, false);
  assert.ok(gap.letzteAusloeser.includes('connection_gap'));
  assert.equal(gap.aktionsAutoritaet, false);

  datenQuelle.aktuell = rohDaten();
  const recovery = audit.pruefe(3000);
  assert.equal(recovery.connectionGapAktiv, false);
  assert.equal(recovery.katalog.zustand, 'veraltet');
  assert.equal(recovery.katalog.fingerprint, fingerprint);
  assert.equal(recovery.katalog.generation, 1);
  assert.ok(recovery.letzteAusloeser.includes('recovery'));
  assert.equal(recovery.produktionsbereit, false);

  const bestaetigt = audit.bestaetigeAktuellenKatalog(fingerprint, 3000);
  assert.equal(bestaetigt.katalog.zustand, 'bereit');
  assert.equal(bestaetigt.produktionsbereit, true);
  assert.deepEqual(bestaetigt.letzteAusloeser, ['revalidierung']);
  assert.equal(bestaetigt.revalidierungsProfil?.katalogFingerprint, fingerprint);
  assert.equal(bestaetigt.revalidierungsProfil?.charakterKennung, 'Ranger-1');
  assert.equal(bestaetigt.revalidierungsProfil?.aktionsAutoritaet, false);
});

test('Charakter- und Serverwechsel erzwingen Revalidierung statt alte Generation weiterzuverwenden', () => {
  const datenQuelle = quelle();
  const audit = new AdventureLandSkillKatalogAuditSteuerung(datenQuelle);
  const start = audit.pruefe(1000, 'runtime_start');
  audit.bestaetigeAktuellenKatalog(start.katalog.fingerprint, 1000);

  datenQuelle.aktuell = rohDaten({
    charakter: gelesen({ id: 'Ranger-2', name: 'Ranger-2', ctype: 'ranger', level: 75 }),
    serverKennung: gelesen('II')
  });
  const gewechselt = audit.pruefe(2000);

  assert.ok(gewechselt.letzteAusloeser.includes('charakterwechsel'));
  assert.ok(gewechselt.letzteAusloeser.includes('serverwechsel'));
  assert.equal(gewechselt.katalog.zustand, 'veraltet');
  assert.equal(gewechselt.katalog.generation, 1);
  assert.equal(gewechselt.produktionsbereit, false);
});

test('Level-Aenderung loest Audit aus ohne unveraenderten Katalog kuenstlich zu invalidieren', () => {
  const datenQuelle = quelle();
  const audit = new AdventureLandSkillKatalogAuditSteuerung(datenQuelle);
  const start = audit.pruefe(1000, 'runtime_start');

  datenQuelle.aktuell = rohDaten({
    charakter: gelesen({ id: 'Ranger-1', name: 'Ranger-1', ctype: 'ranger', level: 76 })
  });
  const level = audit.pruefe(2000);

  assert.ok(level.letzteAusloeser.includes('levelaenderung'));
  assert.equal(level.katalog.fingerprint, start.katalog.fingerprint);
  assert.equal(level.katalog.generation, 1);
  assert.equal(level.katalog.zustand, 'bereit');
  assert.equal(level.produktionsbereit, true);
});

test('echte Skill-Drift bleibt beim identischen zweiten Audit gesperrt und widerspruechliche Folge-Drift erhoeht Generation', () => {
  const datenQuelle = quelle();
  const audit = new AdventureLandSkillKatalogAuditSteuerung(datenQuelle);
  const start = audit.pruefe(1000, 'runtime_start');

  const skillsZwei = basisSkills();
  skillsZwei['3shot'].mp = 250;
  datenQuelle.aktuell = rohDaten({ spielDaten: gelesen({ skills: skillsZwei }) });
  const drift = audit.pruefe(2000);
  assert.equal(drift.katalog.zustand, 'drift');
  assert.equal(drift.katalog.generation, start.katalog.generation + 1);
  assert.ok(drift.letzteAusloeser.includes('skill_drift'));

  const identisch = audit.pruefe(3000);
  assert.equal(identisch.katalog.zustand, 'drift');
  assert.equal(identisch.katalog.generation, drift.katalog.generation);
  assert.equal(identisch.produktionsbereit, false);

  const skillsDrei = basisSkills();
  skillsDrei['3shot'].mp = 275;
  datenQuelle.aktuell = rohDaten({ spielDaten: gelesen({ skills: skillsDrei }) });
  const widerspruch = audit.pruefe(4000);
  assert.equal(widerspruch.katalog.zustand, 'drift');
  assert.equal(widerspruch.katalog.generation, drift.katalog.generation + 1);
  assert.notEqual(widerspruch.katalog.fingerprint, drift.katalog.fingerprint);
  assert.ok(widerspruch.letzteAusloeser.includes('skill_drift'));
});

test('Neustart mit altem persistentem Revalidierungsprofil und neuem Katalog fail-closed auf Drift', () => {
  const ersteQuelle = quelle();
  const ersterAudit = new AdventureLandSkillKatalogAuditSteuerung(ersteQuelle);
  const basis = ersterAudit.pruefe(1000, 'runtime_start');
  const bestaetigt = ersterAudit.bestaetigeAktuellenKatalog(basis.katalog.fingerprint, 1000);
  const altesProfil = bestaetigt.revalidierungsProfil;
  assert.ok(altesProfil);

  const neueSkills = basisSkills();
  neueSkills['3shot'].mp = 260;
  const zweiteQuelle = quelle(rohDaten({ spielDaten: gelesen({ skills: neueSkills }) }));
  const nachNeustart = new AdventureLandSkillKatalogAuditSteuerung(
    zweiteQuelle,
    {},
    altesProfil
  ).pruefe(2000, 'runtime_start');

  assert.equal(nachNeustart.katalog.zustand, 'drift');
  assert.equal(nachNeustart.produktionsbereit, false);
  assert.ok(nachNeustart.letzteAusloeser.includes('skill_drift'));
  assert.match(nachNeustart.katalog.grund, /Persistiertes Revalidierungsprofil/);
  assert.equal(nachNeustart.aktionsAutoritaet, false);
  assert.equal(nachNeustart.automatischerNeustart, false);
});

test('ungueltige oder fehlende Startidentitaet bleibt fail-closed und kann nicht revalidiert werden', () => {
  const datenQuelle = quelle(rohDaten({ charakter: fehlend() }));
  const audit = new AdventureLandSkillKatalogAuditSteuerung(datenQuelle);
  const status = audit.pruefe(1000, 'runtime_start');

  assert.equal(status.connectionGapAktiv, true);
  assert.equal(status.katalog.zustand, 'blockiert');
  assert.equal(status.produktionsbereit, false);
  assert.throws(() => audit.bestaetigeAktuellenKatalog('0'.repeat(64), 1000), /Connection-Gaps/);
});
