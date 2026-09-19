import test from 'node:test';
import assert from 'node:assert/strict';
import { AdventureLandSkillTechnikLesezugriff } from '../../erzeugt/adventure-land/adventure-land-skill-technik.js';
import { CharakterFaehigkeitenResolver } from '../../erzeugt/spiellogik/charakter-faehigkeiten.js';
import { SkillPolicySpeicher } from '../../erzeugt/spiellogik/skill-policy.js';

function speicher() {
  const werte = new Map();
  return {
    getItem(key) {
      return werte.get(String(key)) ?? null;
    },
    setItem(key, value) {
      werte.set(String(key), String(value));
    }
  };
}

function skill(skillId, {
  klassen = ['ranger'],
  level = 1,
  mana = 100,
  capabilityTags = ['einzelziel-schaden'],
  zielKapazitaet = null,
  automationValidated = true,
  ausruestung = { waffenTypen: [], nebenhandTyp: null, slots: [] },
  materialien = { verbrauch: null, inventar: [], anforderungen: {} },
  merkmale = {}
} = {}) {
  return {
    schemaVersion: 1,
    skillId,
    name: skillId,
    art: 'skill',
    klassen,
    stufenVoraussetzung: level,
    manaKosten: mana,
    cooldownMillisekunden: 1000,
    wiederverwendungsCooldownMillisekunden: null,
    reichweite: 100,
    reichweitenMultiplikator: null,
    reichweitenBonus: null,
    schadensWert: null,
    schadensMultiplikator: null,
    cooldownMultiplikator: null,
    zielKapazitaet,
    ausruestung,
    materialien,
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
      immunitaetDurchdringen: null,
      ...merkmale
    },
    capabilityTags,
    technischeReadiness: {
      zustand: 'unbekannt',
      grund: 'wird charakterbezogen abgeleitet',
      aktionsFreigabe: false
    },
    automationValidated,
    validierungsGrund: automationValidated ? 'validiert' : 'nicht validiert',
    unbekannteRohFelder: [],
    fachlicherFingerprint: skillId.padEnd(64, 'a').slice(0, 64)
  };
}

function katalog(skills, {
  zustand = 'bereit',
  generation = 1,
  fingerprint = 'b'.repeat(64),
  bestaetigungErforderlich = false
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
    automationValidatedAnzahl: skills.filter((row) => row.automationValidated).length,
    fehler: [],
    bestaetigungErforderlich,
    spielAutoritaet: false
  };
}

function ranger(level = 75) {
  return {
    charakterKennung: 'R1',
    charakterName: 'RangerA',
    klasse: 'ranger',
    stufe: level
  };
}

function liveFenster() {
  return {
    character: {
      id: 'R1',
      name: 'RangerA',
      ctype: 'ranger',
      level: 75,
      mp: 2000,
      slots: { mainhand: { name: 'bow1' } },
      items: []
    },
    G: {
      items: { bow1: { wtype: 'bow', type: 'weapon' } },
      skills: {
        '3shot': { share: 'attack' },
        '5shot': { share: 'attack' },
        attack: {}
      }
    },
    next_skill: {},
    is_on_cooldown: () => false,
    can_use: () => true,
    use_skill() {
      throw new Error('CharakterFaehigkeiten duerfen use_skill nicht aufrufen');
    }
  };
}

function rangerSkills() {
  return [
    skill('3shot', {
      level: 60,
      mana: 200,
      capabilityTags: ['mehrziel-schaden', 'fernkampf-mehrziel-schaden'],
      zielKapazitaet: 3,
      ausruestung: { waffenTypen: ['bow', 'crossbow'], nebenhandTyp: null, slots: [] },
      merkmale: { mehrziel: true, geteilterCooldown: 'attack' }
    }),
    skill('5shot', {
      level: 75,
      mana: 320,
      capabilityTags: ['mehrziel-schaden', 'fernkampf-mehrziel-schaden'],
      zielKapazitaet: 5,
      ausruestung: { waffenTypen: ['bow', 'crossbow'], nebenhandTyp: null, slots: [] },
      merkmale: { mehrziel: true, geteilterCooldown: 'attack' }
    })
  ];
}

test('vier Capability-Dimensionen bleiben getrennt und SkillPolicy AUS ist harte Sperre', () => {
  const root = liveFenster();
  const kat = katalog(rangerSkills());
  const policy = new SkillPolicySpeicher(speicher());
  const resolver = new CharakterFaehigkeitenResolver(
    policy,
    new AdventureLandSkillTechnikLesezugriff(root)
  );

  const snapshot = resolver.resolve(kat, ranger(), 1000);
  const three = snapshot.skills.find((row) => row.skillId === '3shot');
  assert.ok(three);
  assert.equal(three.strukturellVorhanden, true);
  assert.equal(three.automationValidated, true);
  assert.equal(three.technischBereit, true);
  assert.equal(three.vomNutzerFreigegeben, false);
  assert.equal(three.automatisierungKonfiguriert, false);
  assert.equal(three.aktuellAutomatisierbar, false);
  assert.equal(snapshot.gruppenFaehigkeiten.schaden, 0);
  assert.equal(snapshot.aktionsAutoritaet, false);
});

test('freigegebene technisch bereite Ranger-Multishots erzeugen explizite Target-Capacity und abgeleitete Gruppenschaeden', () => {
  const root = liveFenster();
  const kat = katalog(rangerSkills());
  const policy = new SkillPolicySpeicher(speicher());
  policy.setzeSkillFreigabe(kat, ranger(), '3shot', true, 900);
  policy.setzeControlWert(kat, ranger(), '3shot', 'mindestensZiele', 2, 901);
  policy.setzeSkillFreigabe(kat, ranger(), '5shot', true, 902);

  const resolver = new CharakterFaehigkeitenResolver(
    policy,
    new AdventureLandSkillTechnikLesezugriff(root)
  );
  const snapshot = resolver.resolve(kat, ranger(), 1000);

  assert.equal(snapshot.gruppenFaehigkeiten.schaden, 2);
  assert.equal(snapshot.gruppenFaehigkeiten.heilen, 0);

  const multi = snapshot.capabilities.find((row) => row.capability === 'mehrziel-schaden');
  const ranged = snapshot.capabilities.find((row) => row.capability === 'fernkampf-mehrziel-schaden');
  assert.ok(multi);
  assert.ok(ranged);
  assert.equal(multi.strukturellAnzahl, 2);
  assert.equal(multi.technischBereitAnzahl, 2);
  assert.equal(multi.nutzerFreigegebenAnzahl, 2);
  assert.equal(multi.automatisierungKonfiguriertAnzahl, 2);
  assert.equal(multi.aktuellAutomatisierbarAnzahl, 2);
  assert.equal(multi.maximaleZielKapazitaetStrukturell, 5);
  assert.equal(multi.maximaleZielKapazitaetAktuell, 5);

  const three = snapshot.skills.find((row) => row.skillId === '3shot');
  assert.deepEqual(three.parameter, { mindestensZiele: 2 });
});

test('Equipmentverlust entzieht technische Readiness ohne Nutzerfreigabe zu vergessen', () => {
  const root = liveFenster();
  const kat = katalog(rangerSkills());
  const policy = new SkillPolicySpeicher(speicher());
  policy.setzeSkillFreigabe(kat, ranger(), '3shot', true, 900);

  const resolver = new CharakterFaehigkeitenResolver(
    policy,
    new AdventureLandSkillTechnikLesezugriff(root)
  );
  const vorher = resolver.resolve(kat, ranger(), 1000);
  assert.equal(vorher.skills.find((row) => row.skillId === '3shot').aktuellAutomatisierbar, true);

  root.character.slots = {};
  const nachher = resolver.resolve(kat, ranger(), 1100);
  const three = nachher.skills.find((row) => row.skillId === '3shot');
  assert.equal(three.vomNutzerFreigegeben, true);
  assert.equal(three.automatisierungKonfiguriert, true);
  assert.equal(three.technischBereit, false);
  assert.equal(three.aktuellAutomatisierbar, false);
  assert.equal(nachher.gruppenFaehigkeiten.schaden, 0);
  assert.ok(nachher.generation > vorher.generation);
  assert.notEqual(nachher.fingerprint, vorher.fingerprint);
});

test('Cooldown aendert Capability-Generation nur beim Zustandswechsel und nicht durch Restzeit-Ticks', () => {
  const root = liveFenster();
  const kat = katalog([rangerSkills()[0]]);
  const policy = new SkillPolicySpeicher(speicher());
  policy.setzeSkillFreigabe(kat, ranger(), '3shot', true, 900);
  const resolver = new CharakterFaehigkeitenResolver(
    policy,
    new AdventureLandSkillTechnikLesezugriff(root)
  );

  const bereit = resolver.resolve(kat, ranger(), 1000);
  root.is_on_cooldown = () => true;
  root.next_skill = { attack: new Date(2000) };
  const cooldown1 = resolver.resolve(kat, ranger(), 1100);
  const cooldown2 = resolver.resolve(kat, ranger(), 1200);

  assert.ok(cooldown1.generation > bereit.generation);
  assert.equal(cooldown2.generation, cooldown1.generation);
  assert.equal(cooldown2.fingerprint, cooldown1.fingerprint);
  assert.equal(cooldown2.skills[0].technischeAuswertung.zustand, 'abklingzeit');
  assert.equal(cooldown2.skills[0].aktuellAutomatisierbar, false);
});

test('Level-Up schaltet bekannten Skill strukturell frei und erzeugt neue Capability-Generation', () => {
  const root = liveFenster();
  const kat = katalog(rangerSkills());
  const policy = new SkillPolicySpeicher(speicher());
  const resolver = new CharakterFaehigkeitenResolver(
    policy,
    new AdventureLandSkillTechnikLesezugriff(root)
  );

  const level74 = resolver.resolve(kat, ranger(74), 1000);
  const five74 = level74.skills.find((row) => row.skillId === '5shot');
  assert.equal(five74.strukturellVorhanden, false);

  const level75 = resolver.resolve(kat, ranger(75), 1100);
  const five75 = level75.skills.find((row) => row.skillId === '5shot');
  assert.equal(five75.strukturellVorhanden, true);
  assert.ok(level75.generation > level74.generation);
  assert.notEqual(level75.fingerprint, level74.fingerprint);
});

test('unbekannter neuer Skill bleibt strukturell sichtbar aber niemals automatisch nutzbar', () => {
  const root = liveFenster();
  const mystery = skill('mysteryaoe', {
    capabilityTags: ['mehrziel-schaden'],
    zielKapazitaet: null,
    automationValidated: false
  });
  root.G.skills.mysteryaoe = {};
  const kat = katalog([mystery]);
  const policy = new SkillPolicySpeicher(speicher());
  const resolver = new CharakterFaehigkeitenResolver(
    policy,
    new AdventureLandSkillTechnikLesezugriff(root)
  );

  const snapshot = resolver.resolve(kat, ranger(), 1000);
  const row = snapshot.skills[0];
  assert.equal(row.strukturellVorhanden, true);
  assert.equal(row.automationValidated, false);
  assert.equal(row.aktuellAutomatisierbar, false);

  const multi = snapshot.capabilities.find((cap) => cap.capability === 'mehrziel-schaden');
  assert.equal(multi.strukturellAnzahl, 1);
  assert.equal(multi.validiertAnzahl, 0);
  assert.equal(multi.aktuellAutomatisierbarAnzahl, 0);
  assert.equal(snapshot.gruppenFaehigkeiten.schaden, 0);
});

test('staler Katalog entzieht aktuelle Automatisierbarkeit ohne historische Nutzerfreigabe zu loeschen', () => {
  const root = liveFenster();
  const skills = [rangerSkills()[0]];
  const bereit = katalog(skills);
  const policy = new SkillPolicySpeicher(speicher());
  policy.setzeSkillFreigabe(bereit, ranger(), '3shot', true, 900);

  const resolver = new CharakterFaehigkeitenResolver(
    policy,
    new AdventureLandSkillTechnikLesezugriff(root)
  );
  const ok = resolver.resolve(bereit, ranger(), 1000);
  assert.equal(ok.skills[0].aktuellAutomatisierbar, true);

  const stale = katalog(skills, {
    zustand: 'veraltet',
    generation: 1,
    fingerprint: 'b'.repeat(64),
    bestaetigungErforderlich: true
  });
  const gesperrt = resolver.resolve(stale, ranger(), 1100);
  assert.equal(gesperrt.katalogVertrauenswuerdig, false);
  assert.equal(gesperrt.skills[0].vomNutzerFreigegeben, true);
  assert.equal(gesperrt.skills[0].automatisierungKonfiguriert, false);
  assert.equal(gesperrt.skills[0].aktuellAutomatisierbar, false);
  assert.equal(gesperrt.gruppenFaehigkeiten.schaden, 0);
});

test('grobe Gruppenfaehigkeiten werden aus konkreten aktuell automationsfaehigen Skills gezaehlt statt aus Klasse geraten', () => {
  const root = liveFenster();
  root.character.ctype = 'priest';
  root.character.slots = {};
  root.G.skills = { heal: {}, partyheal: {} };

  const priest = {
    charakterKennung: 'P1',
    charakterName: 'PriestA',
    klasse: 'priest',
    stufe: 80
  };
  const skills = [
    skill('heal', {
      klassen: ['priest'],
      mana: 0,
      capabilityTags: ['einzelziel-heilung'],
      merkmale: { heilung: true, feindlich: false }
    }),
    skill('partyheal', {
      klassen: ['priest'],
      mana: 100,
      capabilityTags: ['gruppen-heilung', 'gruppen-erhaltung'],
      merkmale: { heilung: true, gruppe: true, mehrziel: true, feindlich: false }
    })
  ];
  const kat = katalog(skills);
  const policy = new SkillPolicySpeicher(speicher());
  policy.setzeSkillFreigabe(kat, priest, 'heal', true, 900);
  policy.setzeSkillFreigabe(kat, priest, 'partyheal', true, 901);

  const resolver = new CharakterFaehigkeitenResolver(
    policy,
    new AdventureLandSkillTechnikLesezugriff(root)
  );
  const snapshot = resolver.resolve(kat, priest, 1000);

  assert.equal(snapshot.gruppenFaehigkeiten.heilen, 2);
  assert.equal(snapshot.gruppenFaehigkeiten.schaden, 0);
  assert.equal(snapshot.gruppenFaehigkeiten.aggro, 0);
  assert.equal(snapshot.gruppenFaehigkeiten.schutz, 0);
  assert.equal(snapshot.gruppenFaehigkeiten.unterstuetzung, 1);
});
