import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const datei = new URL('../../werkzeuge/block8-gruppenziel-live-smoke.js', import.meta.url);

async function lade({ mitProduktionsSmoke = true } = {}) {
  const code = await readFile(datei, 'utf8');
  let jetzt = 10_000;
  let freigaben = 0;
  let starts = 0;
  let sperren = 0;
  const ausgaben = [];
  const bericht = Object.freeze({
    schemaVersion: 1,
    werkzeug: 'V4Block8GruppenZielLiveSmoke',
    version: '1.0.0',
    status: 'bestanden',
    echteSpielaktionen: Object.freeze({ attack: 1, sonstige: 0, sonstigeNamen: Object.freeze([]) }),
    automatischWiederGesperrt: true,
    ausfuehrungsBrueckeEntfernt: true,
    zentralePhase: 'abgeschlossen',
    verbleibendeRessourcen: Object.freeze([]),
    fehler: null
  });
  let letzter = null;

  class TestDate extends Date {
    static now() { return jetzt; }
  }

  const parent = {
    V4Testkonsole: { ausgeben(wert, titel) { ausgaben.push({ wert, titel }); } }
  };
  if (mitProduktionsSmoke) {
    parent.V4Block8GruppenZielLiveSmoke = Object.freeze({
      quelleBereich: 'ausfuehrung',
      modus: 'one-shot-live-smoke',
      status() {
        return Object.freeze({ schemaVersion: 1, aktivFreigegeben: true, freigegeben: freigaben > starts, versuchVerbraucht: starts > 0 });
      },
      vorschau() {
        return Object.freeze({
          schemaVersion: 1,
          erstelltAm: jetzt,
          aktionsKennung: 'gruppe-1',
          charakterName: 'My_Ranger1',
          serverRegion: 'EU',
          serverKennung: 'I',
          karte: 'main',
          instanz: 'main',
          zielKennung: 'goo-1',
          monsterArt: 'goo'
        });
      },
      freigeben(text) {
        assert.equal(text, 'PRODUKTIONS-FREIGABE');
        freigaben += 1;
        return this.status();
      },
      sperren() {
        sperren += 1;
        return this.status();
      },
      async starte() {
        starts += 1;
        letzter = bericht;
        return bericht;
      },
      ergebnis() { return letzter; },
      freigabeText() { return 'PRODUKTIONS-FREIGABE'; }
    });
  }
  parent.parent = parent;

  const kontext = vm.createContext({
    console,
    parent,
    globalThis: null,
    Date: TestDate,
    Object,
    Number,
    String,
    Error,
    Promise
  });
  kontext.globalThis = kontext;
  vm.runInContext(code, kontext, { filename: 'block8-gruppenziel-live-smoke.js' });

  return {
    code,
    kontext,
    parent,
    ausgaben,
    setJetzt(wert) { jetzt = wert; },
    zaehler() { return { freigaben, starts, sperren }; }
  };
}

test('Block-8 Live-Smoke-Runner bleibt ohne Produktions-Smoke blockiert', async () => {
  const u = await lade({ mitProduktionsSmoke: false });
  assert.equal(u.kontext.V4Block8GruppenZielLiveSmokeRunner.status().produktionsSmokeVerfuegbar, false);
  assert.throws(() => u.kontext.V4Block8GruppenZielLiveSmokeRunner.vorschau(), /ist nicht installiert/);
  await assert.rejects(
    () => u.kontext.V4Block8GruppenZielLiveSmokeRunner.starte(u.kontext.V4Block8GruppenZielLiveSmokeRunner.startText()),
    /Produktionsvorschau/
  );
});

test('Block-8 Live-Smoke-Runner zeigt zuerst Produktionsvorschau und fuehrt dabei nichts aus', async () => {
  const u = await lade();
  const vorschauStatus = u.kontext.V4Block8GruppenZielLiveSmokeRunner.vorschau();
  assert.equal(vorschauStatus.letzteVorschau.aktionsKennung, 'gruppe-1');
  assert.equal(vorschauStatus.letzteVorschau.zielKennung, 'goo-1');
  assert.deepEqual(u.zaehler(), { freigaben: 0, starts: 0, sperren: 0 });
});

test('Block-8 Live-Smoke-Runner verlangt exakten Starttext und frische angezeigte Vorschau', async () => {
  const u = await lade();
  await assert.rejects(() => u.kontext.V4Block8GruppenZielLiveSmokeRunner.starte('JA'), /Falscher Live-Smoke-Starttext/);
  const text = u.kontext.V4Block8GruppenZielLiveSmokeRunner.startText();
  await assert.rejects(() => u.kontext.V4Block8GruppenZielLiveSmokeRunner.starte(text), /Produktionsvorschau/);

  u.kontext.V4Block8GruppenZielLiveSmokeRunner.vorschau();
  u.setJetzt(15_001);
  await assert.rejects(() => u.kontext.V4Block8GruppenZielLiveSmokeRunner.starte(text), /Produktionsvorschau ist .* zu alt/);
  assert.deepEqual(u.zaehler(), { freigaben: 0, starts: 0, sperren: 0 });
});

test('Block-8 Live-Smoke-Runner delegiert nach Starttext genau einmal an den Produktions-Smoke', async () => {
  const u = await lade();
  u.kontext.V4Block8GruppenZielLiveSmokeRunner.vorschau();
  const bericht = await u.kontext.V4Block8GruppenZielLiveSmokeRunner.starte(
    u.kontext.V4Block8GruppenZielLiveSmokeRunner.startText()
  );

  assert.equal(bericht.status, 'bestanden');
  assert.equal(bericht.echteSpielaktionen.attack, 1);
  assert.deepEqual(u.zaehler(), { freigaben: 1, starts: 1, sperren: 0 });
  assert.equal(u.kontext.V4Block8GruppenZielLiveSmokeRunner.status().versuchGestartet, true);
  await assert.rejects(
    () => u.kontext.V4Block8GruppenZielLiveSmokeRunner.starte(u.kontext.V4Block8GruppenZielLiveSmokeRunner.startText()),
    /bereits gestartet/
  );
  assert.deepEqual(u.zaehler(), { freigaben: 1, starts: 1, sperren: 0 });
});

test('Block-8 Live-Smoke-Runner kann nach Vorschau wieder sperren ohne Start', async () => {
  const u = await lade();
  u.kontext.V4Block8GruppenZielLiveSmokeRunner.vorschau();
  const status = u.kontext.V4Block8GruppenZielLiveSmokeRunner.sperren();
  assert.equal(status.letzteVorschau, null);
  assert.deepEqual(u.zaehler(), { freigaben: 0, starts: 0, sperren: 1 });
});

test('Block-8 Live-Smoke-Runner besitzt selbst keinen Adventure-Land-Aktionsaufruf', async () => {
  const u = await lade();
  for (const name of ['attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp', 'use_hp_or_mp', 'loot', 'send_cm', 'command_character', 'send_party_invite']) {
    assert.doesNotMatch(u.code, new RegExp(`\\b${name}\\s*\\(`));
  }
  assert.match(u.code, /api\.starte\(\)/);
  assert.match(u.code, /api\.freigeben\(produktionsFreigabeText\)/);
});
