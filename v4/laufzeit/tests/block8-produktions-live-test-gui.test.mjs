import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const datei = new URL('../../werkzeuge/block8-produktions-live-test-gui.js', import.meta.url);

async function lade({ name = 'My_Ranger1', leiterName = 'My_Ranger1' } = {}) {
  const code = await readFile(datei, 'utf8');
  const aktionen = new Map();
  const aktive = new Map();
  const protokoll = [];
  const ergebnisse = [];
  let guiStatus = { status: 'bereit' };

  const testGui = {
    erstelleTest() {
      return {
        registriereAktion(aktion) {
          aktionen.set(aktion.kennung, aktion);
          aktive.set(aktion.kennung, aktion.aktiviert !== false);
          return aktion.kennung;
        },
        setzeAktionAktiv(kennung, wert) { aktive.set(kennung, wert === true); return true; },
        setzeErgebnis(wert, status, text) {
          ergebnisse.push({ wert, status, text });
          guiStatus = { status, text, ergebnis: wert };
          return wert;
        },
        protokolliere(text, wert) { protokoll.push({ text, wert }); },
        setzeStatus(status, text) { guiStatus = { ...guiStatus, status, text }; },
        kopiereBericht: async () => true,
        status() { return guiStatus; }
      };
    }
  };

  let runtimeGeladen = false;
  let empfang = false;
  let vorbereitet = false;
  let smoke = false;
  let gestoppt = false;
  let oneShot = false;
  const ziel = { id: 'tortoise-1', mtype: 'tortoise', hp: 100, dead: false };

  const runtime = {
    status() {
      return Object.freeze({
        aktivFreigegeben: true,
        empfangInstalliert: empfang,
        bekannteTeilnehmer: Object.freeze(['My_Ranger1', 'My_Ranger2']),
        laufendeGruppenAnfragen: Object.freeze(vorbereitet && !oneShot && !gestoppt ? ['gruppe-1'] : []),
        ressourcenSperren: Object.freeze(vorbereitet && !oneShot && !gestoppt ? [
          Object.freeze({ ressource: 'gruppe', besitzer: 'gruppe-1' }),
          Object.freeze({ ressource: 'kampfziel', besitzer: 'gruppe-1' })
        ] : []),
        liveSmokeInstalliert: smoke && !gestoppt,
        gruppenZielVorbereitungVerbraucht: vorbereitet,
        gestoppt
      });
    },
    starte() { empfang = true; return this.status(); },
    async sendeLebensnachweis() {
      return Object.freeze({
        meldung: Object.freeze({ charakterName: name, zielKennung: 'tortoise-1' }),
        ergebnisse: Object.freeze([
          Object.freeze({ zielName: name === 'My_Ranger1' ? 'My_Ranger2' : 'My_Ranger1', gesendet: true, grund: 'ok' })
        ])
      });
    },
    gruppenzielFreigabeText() { return 'VORBEREITEN'; },
    bereiteGruppenZielVor(text) {
      assert.equal(text, 'VORBEREITEN');
      vorbereitet = true;
      return Object.freeze({
        gestarteterAktionsName: 'GRUPPE_GEMEINSAMES_ZIEL_BEARBEITEN',
        gestarteteAktionsKennung: 'gruppe-1',
        gemeinsamesZielKennung: 'tortoise-1',
        planStatus: 'geplant',
        uebersetzungsStatus: 'erzeugt',
        steuerungsStatus: 'verarbeitet'
      });
    },
    liveSmokeInstallationsText() { return 'SMOKE-INSTALL'; },
    installiereGruppenZielLiveSmoke(erwartung, text) {
      assert.equal(text, 'SMOKE-INSTALL');
      assert.equal(erwartung.zielKennung, 'tortoise-1');
      smoke = true;
      return {};
    },
    stoppe() {
      gestoppt = true;
      empfang = false;
      smoke = false;
      return this.status();
    }
  };

  const vorschau = Object.freeze({
    aktionsKennung: 'gruppe-1',
    aktionsName: 'GRUPPE_GEMEINSAMES_ZIEL_BEARBEITEN',
    charakterName: name,
    serverRegion: 'EU',
    serverKennung: 'I',
    karte: 'main',
    instanz: 'main',
    zielKennung: 'tortoise-1',
    monsterArt: 'tortoise',
    angriffsBereitschaft: 'bereit',
    ressourcen: Object.freeze(['gruppe', 'kampfziel'])
  });

  const runner = {
    status() { return Object.freeze({ versuchGestartet: oneShot }); },
    startText() { return 'BLOCK8-GRUPPENZIEL-LIVE-SMOKE-STARTEN'; },
    vorschau() { return Object.freeze({ letzteVorschau: vorschau }); },
    async starte(text) {
      assert.equal(text, this.startText());
      oneShot = true;
      return Object.freeze({
        status: 'bestanden',
        echteSpielaktionen: Object.freeze({ attack: 1, sonstige: 0, sonstigeNamen: Object.freeze([]) }),
        ausfuehrungsBrueckeEntfernt: true,
        zentralePhase: 'abgeschlossen',
        verbleibendeRessourcen: Object.freeze([]),
        automatischWiederGesperrt: true
      });
    }
  };

  const bootstrap = {
    status() { return Object.freeze({ bereit: runtimeGeladen }); },
    async lade() { runtimeGeladen = true; return Object.freeze({ bereit: true }); }
  };

  const parent = {
    parent: null,
    character: { name, map: 'main', in: 'main', hp: 500 },
    server_region: 'EU',
    server_identifier: 'I',
    entities: { 'anderer-key': ziel },
    V4TestGui: testGui,
    V4Bootstrap: bootstrap,
    V4ProduktionsLaufzeit: runtime,
    V4Block8GruppenZielLiveSmokeRunner: runner,
    AIO_V4_LIVE_TEST_GUI_CONFIG: { leiterName }
  };
  parent.parent = parent;

  const kontext = vm.createContext({
    console,
    parent,
    globalThis: null,
    Object,
    Array,
    String,
    Number,
    Error,
    JSON
  });
  kontext.globalThis = kontext;
  Object.assign(kontext, parent);
  vm.runInContext(code, kontext, { filename: 'block8-produktions-live-test-gui.js' });

  async function fuehre(kennung) {
    assert.equal(aktive.get(kennung), true, `Aktion ${kennung} muss aktiv sein`);
    return aktionen.get(kennung).ausfuehren();
  }

  return {
    code,
    kontext,
    aktionen,
    aktive,
    protokoll,
    ergebnisse,
    fuehre,
    zustand() { return { runtimeGeladen, empfang, vorbereitet, smoke, gestoppt, oneShot }; }
  };
}

test('Block-8 Live-Test-GUI fuehrt Leiterablauf nur ueber Produktions-APIs bis zum bestandenen one-shot', async () => {
  const u = await lade();
  assert.equal(u.kontext.V4Block8ProduktionsLiveTestGui.istLeiter, true);

  await u.fuehre('runtime-laden');
  await u.fuehre('empfang-starten');
  await u.fuehre('heartbeat-senden');
  await u.fuehre('gruppenziel-vorschau');
  assert.equal(u.aktive.get('one-shot'), true);

  await u.fuehre('one-shot');
  const letzter = u.ergebnisse.at(-1);
  assert.equal(letzter.status, 'pass');
  assert.equal(letzter.wert.schritt, 'one_shot_live_smoke');
  assert.equal(letzter.wert.bericht.echteSpielaktionen.attack, 1);
  assert.equal(letzter.wert.bericht.echteSpielaktionen.sonstige, 0);
  assert.equal(u.zustand().oneShot, true);
});

test('Block-8 Live-Test-GUI deaktiviert aktive Ziel-/Smoke-Schritte auf Nicht-Leiter', async () => {
  const u = await lade({ name: 'My_Ranger2' });
  assert.equal(u.kontext.V4Block8ProduktionsLiveTestGui.istLeiter, false);
  assert.equal(u.aktive.get('gruppenziel-vorschau'), false);
  assert.equal(u.aktive.get('one-shot'), false);

  await u.fuehre('runtime-laden');
  await u.fuehre('empfang-starten');
  await u.fuehre('heartbeat-senden');
  assert.equal(u.aktive.get('gruppenziel-vorschau'), false);
  assert.equal(u.aktive.get('one-shot'), false);
});

test('Block-8 Live-Test-GUI findet Ziel auch ueber entity.id statt nur ueber Objekt-Key', async () => {
  const u = await lade();
  await u.fuehre('runtime-laden');
  await u.fuehre('empfang-starten');
  await u.fuehre('heartbeat-senden');
  await u.fuehre('gruppenziel-vorschau');
  const letzter = u.ergebnisse.at(-1);
  assert.equal(letzter.status, 'pass');
  assert.equal(letzter.wert.erwartung.zielKennung, 'tortoise-1');
});

test('Block-8 Live-Test-GUI stoppt zentral und meldet freigegebene Ressourcen', async () => {
  const u = await lade();
  await u.fuehre('runtime-laden');
  await u.fuehre('empfang-starten');
  await u.fuehre('heartbeat-senden');
  await u.fuehre('gruppenziel-vorschau');
  await u.fuehre('stoppen');
  const letzter = u.ergebnisse.at(-1);
  assert.equal(letzter.wert.schritt, 'stoppen');
  assert.equal(letzter.wert.pass, true);
  assert.deepEqual([...letzter.wert.runtime.ressourcenSperren], []);
});

test('Block-8 Live-Test-GUI besitzt selbst keinen direkten Adventure-Land-Aktionsaufruf', async () => {
  const u = await lade();
  for (const name of ['attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp', 'use_hp_or_mp', 'loot', 'send_cm', 'command_character', 'send_party_invite']) {
    assert.doesNotMatch(u.code, new RegExp(`\\b${name}\\s*\\(`));
  }
  assert.match(u.code, /runtimeApi\\(\\)\\.sendeLebensnachweis\\(\\)/);
  assert.match(u.code, /runner\\.starte\\(runner\\.startText\\(\\)\\)/);
});
