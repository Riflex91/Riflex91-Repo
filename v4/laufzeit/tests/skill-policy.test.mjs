import test from 'node:test';
import assert from 'node:assert/strict';
import { SkillPolicySpeicher } from '../../erzeugt/spiellogik/skill-policy.js';

function speicher(initial = null) {
  const werte = new Map();
  if (initial !== null) werte.set('aio-v4-skill-policy-v1', initial);
  return {
    werte,
    fehlerBeimSchreiben: false,
    getItem(key) {
      return werte.get(String(key)) ?? null;
    },
    setItem(key, value) {
      if (this.fehlerBeimSchreiben) throw new Error('speicher-voll');
      werte.set(String(key), String(value));
    }
  };
}

function skill(skillId, {
  name = skillId,
  klassen = ['ranger'],
  level = 1,
  zielKapazitaet = null,
  automationValidated = true
} = {}) {
  return {
    schemaVersion: 1,
    skillId,
    name,
    art: 'skill',
    klassen,
    stufenVoraussetzung: level,
    manaKosten: 100,
    cooldownMillisekunden: 1000,
    wiederverwendungsCooldownMillisekunden: null,
    reichweite: 100,
    reichweitenMultiplikator: null,
    reichweitenBonus: null,
    schadensWert: null,
    schadensMultiplikator: null,
    cooldownMultiplikator: null,
    zielKapazitaet,
    ausruestung: { waffenTypen: [], nebenhandTyp: null, slots: [] },
    materialien: { verbrauch: null, inventar: [], anforderungen: {} },
    merkmale: {
      mehrziel: zielKapazitaet !== null,
      zielListe: false,
      gruppe: false,
      aura: false,
      heilung: false,
      feindlich: true,
      passiv: false,
      umschaltbar: false,
      zielModus: true,
      geteilterCooldown: null,
      bedingung: null,
      schadensArt: null,
      procs: null,
      immunitaetDurchdringen: null
    },
    capabilityTags: [],
    technischeReadiness: {
      zustand: 'unbekannt',
      grund: '8.6.4',
      aktionsFreigabe: false
    },
    automationValidated,
    validierungsGrund: automationValidated ? 'validiert' : 'nicht validiert',
    unbekannteRohFelder: [],
    fachlicherFingerprint: 'a'.repeat(64)
  };
}

function katalog({
  zustand = 'bereit',
  fingerprint = 'b'.repeat(64),
  generation = 1,
  bestaetigungErforderlich = false,
  skills = []
} = {}) {
  return {
    schemaVersion: 1,
    quelle: 'adventure-land-g-skills',
    aufgenommenAm: 1000,
    generation,
    zustand,
    grund: zustand === 'bereit' ? null : 'test',
    fingerprint,
    vorherigerFingerprint: null,
    skills,
    automationValidatedAnzahl: skills.filter((eintrag) => eintrag.automationValidated).length,
    fehler: [],
    bestaetigungErforderlich,
    spielAutoritaet: false
  };
}

function ranger(id = 'R1', level = 80) {
  return { charakterKennung: id, charakterName: id, klasse: 'ranger', stufe: level };
}

test('nur passende validierte und freigeschaltete Level-Skills sind konfigurierbar und standardmaessig AUS', () => {
  const store = new SkillPolicySpeicher(speicher());
  const kat = katalog({
    skills: [
      skill('3shot', { level: 60, zielKapazitaet: 3 }),
      skill('5shot', { level: 75, zielKapazitaet: 5 }),
      skill('heal', { klassen: ['priest'], level: 1 }),
      skill('mystery', { level: 1, automationValidated: false })
    ]
  });

  const ansichten = store.listeKonfigurierbareSkills(kat, ranger('R1', 70));
  assert.deepEqual(ansichten.map((eintrag) => eintrag.skillId), ['3shot']);

  const three = ansichten[0];
  assert.equal(three.freigegeben, false);
  assert.equal(three.hartGesperrt, true);
  assert.match(three.grund, /standardmaessig AUS/);
  assert.deepEqual(three.controls.map((control) => ({
    key: control.definition.kennung,
    min: control.definition.minimum,
    max: control.definition.maximum,
    wert: control.wert
  })), [
    { key: 'mindestensZiele', min: 1, max: 3, wert: 2 }
  ]);

  const entscheidung = store.bewerteAutomatikFreigabe(kat, ranger('R1', 70), '3shot');
  assert.equal(entscheidung.erlaubt, false);
  assert.equal(entscheidung.grund, 'skill_policy_aus');
  assert.equal(entscheidung.aktionsAutoritaet, false);
});

test('Per-Character Policy trennt zwei Ranger derselben Klasse strikt', () => {
  const backend = speicher();
  const store = new SkillPolicySpeicher(backend);
  const kat = katalog({ skills: [skill('3shot', { level: 60, zielKapazitaet: 3 })] });

  const r1 = store.setzeSkillFreigabe(kat, ranger('R1'), '3shot', true, 1000);
  assert.equal(r1.status, 'gespeichert');

  const r1Entscheidung = store.bewerteAutomatikFreigabe(kat, ranger('R1'), '3shot');
  const r2Entscheidung = store.bewerteAutomatikFreigabe(kat, ranger('R2'), '3shot');
  assert.equal(r1Entscheidung.erlaubt, true);
  assert.equal(r2Entscheidung.erlaubt, false);
  assert.equal(r2Entscheidung.grund, 'skill_policy_aus');

  const neuGeladen = new SkillPolicySpeicher(backend);
  assert.equal(neuGeladen.bewerteAutomatikFreigabe(kat, ranger('R1'), '3shot').erlaubt, true);
  assert.equal(neuGeladen.bewerteAutomatikFreigabe(kat, ranger('R2'), '3shot').erlaubt, false);
});

test('Slider werden streng begrenzt und unbekannte Controls fail-closed blockiert', () => {
  const store = new SkillPolicySpeicher(speicher());
  const kat = katalog({ skills: [skill('3shot', { level: 60, zielKapazitaet: 3 })] });

  const unbekannt = store.setzeControlWert(kat, ranger(), '3shot', 'erfundenerSlider', 2, 1000);
  assert.equal(unbekannt.status, 'blockiert');
  assert.match(unbekannt.grund, /Unbekanntes/);

  const zuGross = store.setzeControlWert(kat, ranger(), '3shot', 'mindestensZiele', 4, 1000);
  assert.equal(zuGross.status, 'blockiert');

  const gueltig = store.setzeControlWert(kat, ranger(), '3shot', 'mindestensZiele', 3, 1000);
  assert.equal(gueltig.status, 'gespeichert');
  assert.equal(gueltig.ansicht.freigegeben, false, 'Slider-Aenderung darf Skill nicht automatisch einschalten');
  assert.equal(gueltig.ansicht.controls[0].wert, 3);

  const aus = store.bewerteAutomatikFreigabe(kat, ranger(), '3shot');
  assert.equal(aus.erlaubt, false);
  assert.equal(aus.grund, 'skill_policy_aus');
});

test('Checkbox AUS bleibt harte Sperre auch bei gueltigen Sliderwerten', () => {
  const store = new SkillPolicySpeicher(speicher());
  const kat = katalog({ skills: [skill('3shot', { level: 60, zielKapazitaet: 3 })] });

  store.setzeControlWert(kat, ranger(), '3shot', 'mindestensZiele', 3, 1000);
  store.setzeSkillFreigabe(kat, ranger(), '3shot', true, 1100);
  const erlaubt = store.bewerteAutomatikFreigabe(kat, ranger(), '3shot');
  assert.equal(erlaubt.erlaubt, true);
  assert.deepEqual(erlaubt.parameter, { mindestensZiele: 3 });
  assert.equal(erlaubt.aktionsAutoritaet, false);

  store.setzeSkillFreigabe(kat, ranger(), '3shot', false, 1200);
  const gesperrt = store.bewerteAutomatikFreigabe(kat, ranger(), '3shot');
  assert.equal(gesperrt.erlaubt, false);
  assert.equal(gesperrt.grund, 'skill_policy_aus');
});

test('Heal und Ressourcen-Skills erhalten nur semantisch passende Prozent-Slider', () => {
  const store = new SkillPolicySpeicher(speicher());
  const priest = { charakterKennung: 'P1', charakterName: 'P1', klasse: 'priest', stufe: 80 };
  const mage = { charakterKennung: 'M1', charakterName: 'M1', klasse: 'mage', stufe: 80 };

  const healKat = katalog({
    skills: [
      skill('heal', { klassen: ['priest'], level: 1 }),
      skill('partyheal', { klassen: ['priest'], level: 1 })
    ]
  });
  const healAnsichten = store.listeKonfigurierbareSkills(healKat, priest);
  const heal = healAnsichten.find((eintrag) => eintrag.skillId === 'heal');
  const partyheal = healAnsichten.find((eintrag) => eintrag.skillId === 'partyheal');
  assert.ok(heal);
  assert.ok(partyheal);
  assert.deepEqual(heal.controls.map((control) => [
    control.definition.kennung,
    control.definition.minimum,
    control.definition.maximum,
    control.definition.standardWert
  ]), [['lebensSchwelleProzent', 0, 100, 65]]);
  assert.deepEqual(partyheal.controls.map((control) => control.definition.kennung), [
    'lebensSchwelleProzent',
    'mindestensVerletzteMitglieder'
  ]);

  const manaKat = katalog({ skills: [skill('energize', { klassen: ['mage'], level: 1 })] });
  const energize = store.listeKonfigurierbareSkills(manaKat, mage)[0];
  assert.equal(energize.controls[0].definition.kennung, 'empfaengerManaSchwelleProzent');
  assert.equal(energize.controls[0].definition.minimum, 0);
  assert.equal(energize.controls[0].definition.maximum, 100);
});

test('Katalogdrift sperrt aktuelle Freigabe ohne historische Policy zu loeschen', () => {
  const store = new SkillPolicySpeicher(speicher());
  const bereit = katalog({ skills: [skill('3shot', { level: 60, zielKapazitaet: 3 })] });
  store.setzeSkillFreigabe(bereit, ranger(), '3shot', true, 1000);

  const profilVorher = store.holeProfil('R1');
  assert.equal(profilVorher.skills['3shot'].freigegeben, true);

  const drift = katalog({
    zustand: 'drift',
    fingerprint: 'c'.repeat(64),
    generation: 2,
    bestaetigungErforderlich: true,
    skills: [skill('3shot', { level: 60, zielKapazitaet: 3 })]
  });
  const waehrendDrift = store.bewerteAutomatikFreigabe(drift, ranger(), '3shot');
  assert.equal(waehrendDrift.erlaubt, false);
  assert.equal(waehrendDrift.grund, 'katalog_nicht_bereit');
  assert.equal(store.holeProfil('R1').skills['3shot'].freigegeben, true);

  const revalidiert = katalog({
    fingerprint: 'c'.repeat(64),
    generation: 2,
    skills: [skill('3shot', { level: 60, zielKapazitaet: 3 })]
  });
  assert.equal(store.bewerteAutomatikFreigabe(revalidiert, ranger(), '3shot').erlaubt, true);
});

test('unbekannte persistierte Controls bleiben historisch erhalten aber sperren Automatik fail-closed', () => {
  const raw = JSON.stringify({
    schemaVersion: 1,
    gespeichertAm: 1000,
    profile: [{
      schemaVersion: 1,
      charakterKennung: 'R1',
      charakterName: 'R1',
      klasse: 'ranger',
      geaendertAm: 1000,
      skills: {
        '3shot': {
          freigegeben: true,
          parameter: {
            mindestensZiele: 2,
            fremdesControl: 9
          },
          geaendertAm: 1000,
          katalogFingerprintBeiAenderung: 'b'.repeat(64)
        }
      }
    }]
  });
  const store = new SkillPolicySpeicher(speicher(raw));
  const kat = katalog({ skills: [skill('3shot', { level: 60, zielKapazitaet: 3 })] });

  const ansicht = store.listeKonfigurierbareSkills(kat, ranger())[0];
  assert.deepEqual(ansicht.unbekanntePersistierteControls, ['fremdesControl']);
  assert.equal(ansicht.hartGesperrt, true);

  const entscheidung = store.bewerteAutomatikFreigabe(kat, ranger(), '3shot');
  assert.equal(entscheidung.erlaubt, false);
  assert.equal(entscheidung.grund, 'unbekannte_persistierte_controls');

  const reset = store.setzeSkillZurueck(kat, ranger(), '3shot', 2000);
  assert.equal(reset.status, 'gespeichert');
  assert.equal(reset.ansicht.freigegeben, false);
  assert.deepEqual(reset.ansicht.unbekanntePersistierteControls, []);
});

test('ungueltige Persistenzschema wird fail-closed verworfen', () => {
  const store = new SkillPolicySpeicher(speicher(JSON.stringify({
    schemaVersion: 99,
    gespeichertAm: 1000,
    profile: []
  })));

  const status = store.status();
  assert.equal(status.profileAnzahl, 0);
  assert.match(status.letzterLadeFehler, /fail-closed/);
  assert.equal(status.neueSkillsStandardmaessigFreigegeben, false);
  assert.equal(status.userDisableIstHarteSperre, true);
  assert.equal(status.unbekannteControlsFailClosed, true);
  assert.equal(status.aktionsAutoritaet, false);
});

test('Persistenzfehler aktiviert eine Policy-Aenderung nicht im Speicherzustand', () => {
  const backend = speicher();
  const store = new SkillPolicySpeicher(backend);
  const kat = katalog({ skills: [skill('3shot', { level: 60, zielKapazitaet: 3 })] });
  backend.fehlerBeimSchreiben = true;

  const ergebnis = store.setzeSkillFreigabe(kat, ranger(), '3shot', true, 1000);
  assert.equal(ergebnis.status, 'blockiert');
  assert.match(ergebnis.grund, /Persistenz fehlschlug/);
  assert.equal(store.bewerteAutomatikFreigabe(kat, ranger(), '3shot').erlaubt, false);
  assert.match(store.status().letzterSpeicherFehler, /speicher-voll/);
});
