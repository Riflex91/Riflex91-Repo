import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AdventureLandSkillKatalogLesequelle,
  SKILL_KATALOG_EXPLIZIT_VALIDIERTE_IDS
} from '../../erzeugt/adventure-land/adventure-land-skill-katalog.js';

function basisSkills() {
  return {
    heal: {
      type: 'ability', class: ['priest'], name: 'Heal', cooldown_multiplier: 1,
      share: 'attack', target: true, use_range: true, heal: true, procs: true,
      pierces_immunity: true, explanation: 'Heal the target', skin: 'heal'
    },
    partyheal: {
      type: 'skill', class: ['priest'], name: 'Party Heal', mp: 400, cooldown: 200,
      party: true, heal: true, multi: true, projectile: 'partyheal', damage_type: 'magical'
    },
    '3shot': {
      type: 'skill', class: ['ranger'], name: '3-Shot', level: 60, mp: 200,
      damage_multiplier: 0.7, cooldown_multiplier: 1, multi: true, share: 'attack',
      hostile: true, wtype: ['bow', 'crossbow'], pierces_immunity: true, procs: true,
      use_range: true, damage_type: 'physical'
    },
    '5shot': {
      type: 'skill', class: ['ranger'], name: '5-Shot', level: 75, mp: 320,
      damage_multiplier: 0.5, cooldown_multiplier: 1, multi: true, share: 'attack',
      hostile: true, wtype: ['bow', 'crossbow'], pierces_immunity: true, procs: true,
      use_range: true, damage_type: 'physical'
    },
    fanofknives: {
      type: 'skill', class: ['rogue'], name: 'Fan of Knives', level: 65, mp: 180,
      range: 160, multi: true, max_targets: 5, share: 'attack',
      slot: [['belt', 'knifebelt']], hostile: true, damage_multiplier: 0.85,
      damage_type: 'physical', projectile: 'fanofknives', procs: false
    },
    revive: {
      type: 'skill', class: ['priest'], name: 'Revive!', mp: 500, cooldown: 200,
      range: 240, consume: 'essenceoflife', target: 'player'
    },
    cburst: {
      type: 'skill', class: ['mage'], name: 'Controlled Mana Burst', level: 75,
      mp: 80, cooldown: 240, list: true, hostile: true, ratio: 0.5,
      use_range: true, damage_type: 'magical'
    }
  };
}

function fensterMitSkills(skills = basisSkills()) {
  return {
    G: { skills },
    use_skill() { throw new Error('use_skill darf beim Lesen des Skill-Katalogs nicht aufgerufen werden'); },
    attack() { throw new Error('attack darf beim Lesen des Skill-Katalogs nicht aufgerufen werden'); },
    move() { throw new Error('move darf beim Lesen des Skill-Katalogs nicht aufgerufen werden'); }
  };
}

function skill(katalog, id) {
  const gefunden = katalog.skills.find((eintrag) => eintrag.skillId === id);
  assert.ok(gefunden, `Skill ${id} fehlt im Katalog`);
  return gefunden;
}

test('Live Skill-Katalog liest und normalisiert Adventure Land G.skills ohne Spielaktion', () => {
  const katalogQuelle = AdventureLandSkillKatalogLesequelle.fuerSpielFenster(fensterMitSkills());
  const katalog = katalogQuelle.liesKatalog(1000);

  assert.equal(katalog.schemaVersion, 1);
  assert.equal(katalog.quelle, 'adventure-land-g-skills');
  assert.equal(katalog.zustand, 'bereit');
  assert.equal(katalog.generation, 1);
  assert.match(katalog.fingerprint, /^[0-9a-f]{64}$/, 'Katalog-Fingerprint muss den zentralen SHA-256-Pfad verwenden');
  assert.equal(katalog.spielAutoritaet, false);
  assert.equal(katalog.bestaetigungErforderlich, false);

  const three = skill(katalog, '3shot');
  assert.match(three.fachlicherFingerprint, /^[0-9a-f]{64}$/, 'Skill-Fingerprint muss SHA-256 sein');
  assert.equal(three.stufenVoraussetzung, 60);
  assert.equal(three.manaKosten, 200);
  assert.equal(three.schadensMultiplikator, 0.7);
  assert.deepEqual(three.ausruestung.waffenTypen, ['bow', 'crossbow']);
  assert.equal(three.zielKapazitaet, 3);
  assert.equal(three.automationValidated, true);
  assert.ok(three.capabilityTags.includes('fernkampf-mehrziel-schaden'));
  assert.deepEqual(three.technischeReadiness, {
    zustand: 'unbekannt',
    grund: 'Charakterbezogene technische Readiness wird erst aus Live-Charakterzustand, Voraussetzungen und SkillPolicy abgeleitet.',
    aktionsFreigabe: false
  });

  const five = skill(katalog, '5shot');
  assert.equal(five.zielKapazitaet, 5);
  assert.equal(five.automationValidated, true);

  const knives = skill(katalog, 'fanofknives');
  assert.equal(knives.zielKapazitaet, 5);
  assert.deepEqual(knives.ausruestung.slots, [{ slot: 'belt', gegenstand: 'knifebelt' }]);

  const revive = skill(katalog, 'revive');
  assert.equal(revive.materialien.verbrauch, 'essenceoflife');
});

test('gleiche fachliche Live-Daten behalten Fingerprint und Generation trotz Zeit und Feldreihenfolge', () => {
  const skills = basisSkills();
  const fenster = fensterMitSkills(skills);
  const katalogQuelle = AdventureLandSkillKatalogLesequelle.fuerSpielFenster(fenster);
  const eins = katalogQuelle.liesKatalog(1000);

  fenster.G.skills = Object.fromEntries(Object.entries(skills).reverse());
  fenster.G.skills['3shot'] = {
    ...fenster.G.skills['3shot'],
    class: ['ranger'],
    wtype: ['crossbow', 'bow'],
    explanation: 'Dieser Beschreibungstext darf den fachlichen Fingerprint nicht veraendern.',
    skin: 'anderes_nur_visuelles_skin'
  };
  const zwei = katalogQuelle.liesKatalog(999999);

  assert.equal(zwei.fingerprint, eins.fingerprint);
  assert.equal(zwei.generation, eins.generation);
  assert.equal(zwei.zustand, 'bereit');
  assert.equal(zwei.aufgenommenAm, 999999);
});

test('unbekannter neuer Skill bleibt sichtbar und analysierbar, aber fail-closed', () => {
  const skills = basisSkills();
  skills.mysteryaoe = {
    type: 'skill', class: ['ranger'], name: 'Mystery AoE', level: 1,
    multi: true, hostile: true, max_targets: 7, wtype: ['bow'], runtime_counter: 1
  };
  const fenster = fensterMitSkills(skills);
  const katalogQuelle = AdventureLandSkillKatalogLesequelle.fuerSpielFenster(fenster);
  const eins = katalogQuelle.liesKatalog(1000);
  const mystery = skill(eins, 'mysteryaoe');

  assert.equal(eins.zustand, 'bereit');
  assert.equal(mystery.automationValidated, false);
  assert.match(mystery.validierungsGrund, /keine explizite V4-Automationsvalidierung/);
  assert.equal(mystery.zielKapazitaet, 7);
  assert.ok(mystery.capabilityTags.includes('mehrziel-schaden'));
  assert.equal(mystery.technischeReadiness.aktionsFreigabe, false);
  assert.deepEqual(mystery.unbekannteRohFelder, ['runtime_counter']);

  const fingerprint = eins.fingerprint;
  fenster.G.skills.mysteryaoe.runtime_counter = 999999;
  const zwei = katalogQuelle.liesKatalog(2000);
  assert.equal(zwei.fingerprint, fingerprint, 'Unbekannte Laufzeitwerte duerfen den fachlichen Fingerprint nicht churnen');
  assert.equal(zwei.generation, 1);
});

test('neues unbekanntes Rohfeld an explizit validiertem Skill entzieht automationValidated und erzeugt Drift', () => {
  const fenster = fensterMitSkills();
  const katalogQuelle = AdventureLandSkillKatalogLesequelle.fuerSpielFenster(fenster);
  const eins = katalogQuelle.liesKatalog(1000);
  assert.equal(skill(eins, '3shot').automationValidated, true);

  fenster.G.skills['3shot'].neues_server_feld = 'unbekannte-semantik';
  const drift = katalogQuelle.liesKatalog(2000);

  assert.equal(drift.zustand, 'drift');
  assert.equal(drift.generation, 2);
  assert.equal(drift.bestaetigungErforderlich, true);
  assert.equal(skill(drift, '3shot').automationValidated, false);
  assert.deepEqual(skill(drift, '3shot').unbekannteRohFelder, ['neues_server_feld']);
  assert.throws(() => katalogQuelle.bestaetigeAktuellenFingerprint(drift.fingerprint), /ungepruefter Semantik/);
});

test('fachliche Drift wird nicht durch einen zweiten identischen Snapshot automatisch produktionsbereit', () => {
  const fenster = fensterMitSkills();
  const katalogQuelle = AdventureLandSkillKatalogLesequelle.fuerSpielFenster(fenster);
  const basis = katalogQuelle.liesKatalog(1000);

  fenster.G.skills['3shot'].mp = 250;
  const drift = katalogQuelle.liesKatalog(2000);
  assert.equal(drift.generation, basis.generation + 1);
  assert.equal(drift.zustand, 'drift');
  assert.notEqual(drift.fingerprint, basis.fingerprint);
  assert.equal(drift.vorherigerFingerprint, basis.fingerprint);

  const zweiterSnapshot = katalogQuelle.liesKatalog(3000);
  assert.equal(zweiterSnapshot.fingerprint, drift.fingerprint);
  assert.equal(zweiterSnapshot.generation, drift.generation);
  assert.equal(zweiterSnapshot.zustand, 'drift');
  assert.equal(zweiterSnapshot.bestaetigungErforderlich, true);

  assert.throws(() => katalogQuelle.bestaetigeAktuellenFingerprint('0'.repeat(64)), /passt nicht/);
  const bestaetigt = katalogQuelle.bestaetigeAktuellenFingerprint(drift.fingerprint);
  assert.equal(bestaetigt.zustand, 'bereit');
  assert.equal(bestaetigt.generation, drift.generation);
  assert.equal(bestaetigt.bestaetigungErforderlich, false);
  assert.equal(bestaetigt.spielAutoritaet, false);
});

test('Connection-/Leseausfall blockiert fail-closed und erfolgreiche Rueckkehr bleibt bis Revalidierung veraltet', () => {
  const fenster = fensterMitSkills();
  const katalogQuelle = AdventureLandSkillKatalogLesequelle.fuerSpielFenster(fenster);
  const basis = katalogQuelle.liesKatalog(1000);
  const fingerprint = basis.fingerprint;

  delete fenster.G.skills;
  const blockiert = katalogQuelle.liesKatalog(2000);
  assert.equal(blockiert.zustand, 'blockiert');
  assert.equal(blockiert.spielAutoritaet, false);
  assert.equal(blockiert.skills.length, 0);
  assert.equal(blockiert.automationValidatedAnzahl, 0);
  assert.ok(blockiert.fehler.length > 0);

  fenster.G.skills = basisSkills();
  const zurueck = katalogQuelle.liesKatalog(3000);
  assert.equal(zurueck.fingerprint, fingerprint);
  assert.equal(zurueck.generation, 1);
  assert.equal(zurueck.zustand, 'veraltet');
  assert.equal(zurueck.bestaetigungErforderlich, true);

  const bestaetigt = katalogQuelle.bestaetigeAktuellenFingerprint(fingerprint);
  assert.equal(bestaetigt.zustand, 'bereit');
  assert.equal(bestaetigt.spielAutoritaet, false);
});

test('manuelles Veralten aendert weder Fingerprint noch Generation und braucht Revalidierung', () => {
  const katalogQuelle = AdventureLandSkillKatalogLesequelle.fuerSpielFenster(fensterMitSkills());
  const basis = katalogQuelle.liesKatalog(1000);
  const veraltet = katalogQuelle.markiereVeraltet('CONNECTION_GAP');
  assert.equal(veraltet.zustand, 'veraltet');
  assert.equal(veraltet.fingerprint, basis.fingerprint);
  assert.equal(veraltet.generation, basis.generation);
  assert.equal(veraltet.bestaetigungErforderlich, true);
  assert.throws(() => katalogQuelle.markiereVeraltet('  '), /Grund/);
});

test('explizite V4-Validierungsliste ist bounded und enthaelt die aktuell abgesicherten Kernskills', () => {
  for (const id of ['heal', 'partyheal', '3shot', '5shot', 'fanofknives', 'cburst', 'revive']) {
    assert.ok(SKILL_KATALOG_EXPLIZIT_VALIDIERTE_IDS.includes(id));
  }
  assert.equal(SKILL_KATALOG_EXPLIZIT_VALIDIERTE_IDS.includes('mysteryaoe'), false);
  assert.equal(Object.isFrozen(SKILL_KATALOG_EXPLIZIT_VALIDIERTE_IDS), true);
});


test('Live-Lesequelle findet G auch im Adventure-Land-Parent-Kontext', () => {
  const katalogQuelle = AdventureLandSkillKatalogLesequelle.fuerSpielFenster({
    parent: fensterMitSkills()
  });
  const katalog = katalogQuelle.liesKatalog(1000);
  assert.equal(katalog.zustand, 'bereit');
  assert.ok(katalog.skills.some((eintrag) => eintrag.skillId === '3shot'));
});

test('Fehler beim Zugriff auf verschachtelte Skilldaten werden blockiert statt durchgereicht', () => {
  const skills = new Proxy({}, {
    ownKeys() { throw new Error('proxy-lesefehler'); }
  });
  const katalogQuelle = AdventureLandSkillKatalogLesequelle.fuerSpielFenster({ G: { skills } });
  const katalog = katalogQuelle.liesKatalog(1000);
  assert.equal(katalog.zustand, 'blockiert');
  assert.match(katalog.fehler.join(' '), /proxy-lesefehler/);
  assert.equal(katalog.spielAutoritaet, false);
});

test('ungueltiger Aufnahmezeitpunkt und fehlende G-Daten bleiben fail-closed', () => {
  const katalogQuelle = AdventureLandSkillKatalogLesequelle.fuerSpielFenster({});
  assert.throws(() => katalogQuelle.liesKatalog(-1), /aufgenommenAm/);
  const blockiert = katalogQuelle.liesKatalog(0);
  assert.equal(blockiert.zustand, 'blockiert');
  assert.equal(blockiert.fingerprint, null);
  assert.equal(blockiert.generation, 0);
  assert.equal(blockiert.spielAutoritaet, false);
  assert.equal(blockiert.bestaetigungErforderlich, true);
});
