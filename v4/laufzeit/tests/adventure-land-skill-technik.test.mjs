import test from 'node:test';
import assert from 'node:assert/strict';
import { AdventureLandSkillTechnikLesezugriff } from '../../erzeugt/adventure-land/adventure-land-skill-technik.js';

function skill(skillId, overrides = {}) {
  return {
    schemaVersion: 1,
    skillId,
    name: skillId,
    art: 'skill',
    klassen: ['ranger'],
    stufenVoraussetzung: 1,
    manaKosten: 100,
    cooldownMillisekunden: 1000,
    wiederverwendungsCooldownMillisekunden: null,
    reichweite: 100,
    reichweitenMultiplikator: null,
    reichweitenBonus: null,
    schadensWert: null,
    schadensMultiplikator: null,
    cooldownMultiplikator: null,
    zielKapazitaet: null,
    ausruestung: { waffenTypen: [], nebenhandTyp: null, slots: [] },
    materialien: { verbrauch: null, inventar: [], anforderungen: {} },
    merkmale: {
      mehrziel: false,
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
    capabilityTags: ['einzelziel-schaden'],
    technischeReadiness: { zustand: 'unbekannt', grund: 'test', aktionsFreigabe: false },
    automationValidated: true,
    validierungsGrund: 'validiert',
    unbekannteRohFelder: [],
    fachlicherFingerprint: 'a'.repeat(64),
    ...overrides
  };
}

function fenster() {
  return {
    character: {
      mp: 1000,
      slots: { mainhand: { name: 'bow1' } },
      items: []
    },
    G: {
      items: {
        bow1: { wtype: 'bow', type: 'weapon' },
        knifebelt: { type: 'belt' }
      },
      skills: {
        '3shot': { share: 'attack' },
        attack: {}
      }
    },
    next_skill: {},
    is_on_cooldown: () => false,
    can_use: () => true,
    use_skill() {
      throw new Error('use_skill darf beim Lesen technischer Readiness nie aufgerufen werden');
    },
    attack() {
      throw new Error('attack darf beim Lesen technischer Readiness nie aufgerufen werden');
    }
  };
}

test('technische Skill-Readiness bestaetigt Equipment Mana und bestehende can_use-Pruefung read-only', () => {
  const root = fenster();
  const leser = new AdventureLandSkillTechnikLesezugriff(root);
  const ergebnis = leser.lies(skill('3shot', {
    manaKosten: 200,
    ausruestung: { waffenTypen: ['bow', 'crossbow'], nebenhandTyp: null, slots: [] }
  }), 1000);

  assert.equal(ergebnis.zustand, 'bereit');
  assert.equal(ergebnis.ausruestungBereit, true);
  assert.equal(ergebnis.materialBereit, true);
  assert.equal(ergebnis.manaBereit, true);
  assert.equal(ergebnis.aktionsBereitschaft.zustand, 'bereit');
  assert.equal(ergebnis.aktionsFreigabe, false);
});

test('Equipmentverlust blockiert trotz fehlendem Cooldown fail-closed', () => {
  const root = fenster();
  root.character.slots = {};
  const leser = new AdventureLandSkillTechnikLesezugriff(root);
  const ergebnis = leser.lies(skill('3shot', {
    ausruestung: { waffenTypen: ['bow', 'crossbow'], nebenhandTyp: null, slots: [] }
  }), 1000);

  assert.equal(ergebnis.zustand, 'blockiert');
  assert.equal(ergebnis.ausruestungBereit, false);
  assert.match(ergebnis.gruende.join(' '), /Waffentyp fehlt/);
});

test('katalogisierte Slot-Voraussetzung wird gegen character.slots geprueft', () => {
  const root = fenster();
  root.character.slots = { belt: { name: 'knifebelt' } };
  const leser = new AdventureLandSkillTechnikLesezugriff(root);
  const skillMitBelt = skill('fanofknives', {
    klassen: ['rogue'],
    ausruestung: {
      waffenTypen: [],
      nebenhandTyp: null,
      slots: [{ slot: 'belt', gegenstand: 'knifebelt' }]
    }
  });

  assert.equal(leser.lies(skillMitBelt, 1000).ausruestungBereit, true);
  root.character.slots = {};
  assert.equal(leser.lies(skillMitBelt, 1100).ausruestungBereit, false);
});

test('fehlendes Skill-Material und zu wenig Mana blockieren getrennt sichtbar', () => {
  const root = fenster();
  root.character.mp = 50;
  const leser = new AdventureLandSkillTechnikLesezugriff(root);
  const revive = skill('revive', {
    klassen: ['priest'],
    manaKosten: 200,
    materialien: { verbrauch: 'essenceoflife', inventar: [], anforderungen: {} }
  });

  const fehlt = leser.lies(revive, 1000);
  assert.equal(fehlt.zustand, 'blockiert');
  assert.equal(fehlt.materialBereit, false);
  assert.equal(fehlt.manaBereit, false);

  root.character.items = [{ name: 'essenceoflife' }];
  root.character.mp = 500;
  const bereit = leser.lies(revive, 1100);
  assert.equal(bereit.materialBereit, true);
  assert.equal(bereit.manaBereit, true);
  assert.equal(bereit.zustand, 'bereit');
});

test('generische unbekannte requirements werden nicht geraten', () => {
  const root = fenster();
  const leser = new AdventureLandSkillTechnikLesezugriff(root);
  const ergebnis = leser.lies(skill('future', {
    materialien: { verbrauch: null, inventar: [], anforderungen: { mystery: true } }
  }), 1000);

  assert.equal(ergebnis.zustand, 'unbekannt');
  assert.equal(ergebnis.materialBereit, null);
  assert.match(ergebnis.gruende.join(' '), /nicht geraten/);
});

test('can_use false bleibt technisch unbekannt und wird nicht als nutzbar erfunden', () => {
  const root = fenster();
  root.can_use = () => false;
  const leser = new AdventureLandSkillTechnikLesezugriff(root);
  const ergebnis = leser.lies(skill('3shot'), 1000);

  assert.equal(ergebnis.zustand, 'unbekannt');
  assert.equal(ergebnis.aktionsBereitschaft.zustand, 'unbekannt');
  assert.match(ergebnis.aktionsBereitschaft.grund, /aktuell nicht nutzbar/);
});

test('aktiver geteilter Cooldown wird ueber den bestehenden Kampfbereitschaftsleser wiederverwendet', () => {
  const root = fenster();
  root.next_skill = { attack: new Date(1500) };
  root.is_on_cooldown = (name) => name === '3shot';
  const leser = new AdventureLandSkillTechnikLesezugriff(root);
  const ergebnis = leser.lies(skill('3shot'), 1000);

  assert.equal(ergebnis.zustand, 'abklingzeit');
  assert.equal(ergebnis.aktionsBereitschaft.zustand, 'abklingzeit');
  assert.equal(ergebnis.aktionsBereitschaft.bereitAb, 1500);
  assert.equal(ergebnis.aktionsFreigabe, false);
});
