import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

async function lade({
  runtimeVersion = '1.1.5',
  fortsetzenFehler = false,
  soakDauerMillisekunden = 600_000
} = {}) {
  const code = await readFile(
    new URL('../../werkzeuge/block8-5-freigabestufen-live-test.js', import.meta.url),
    'utf8'
  );

  const aktionen = new Map();
  const protokoll = [];
  let guiStatus = { status: 'bereit' };
  let zustand = 'laeuft';
  let generation = 0;
  let heartbeatErfolge = 10;
  let heartbeatFehler = 0;
  let jetzt = 1_000_000;
  let timerId = 0;
  const timer = new Map();

  const guiTest = {
    registriereAktion(aktion) {
      aktionen.set(aktion.kennung, { ...aktion, aktiv: aktion.aktiviert !== false });
      return aktion.kennung;
    },
    setzeAktionAktiv(kennung, aktiv) {
      const eintrag = aktionen.get(kennung);
      if (!eintrag) return false;
      eintrag.aktiv = aktiv === true;
      return true;
    },
    setzeErgebnis(wert, status, text) {
      guiStatus = { status, text, wert };
      return wert;
    },
    protokolliere(text, wert) {
      protokoll.push({ text, wert });
    },
    status() {
      return guiStatus;
    },
    kopiereBericht: async () => true
  };

  const runtime = {
    version: runtimeVersion,
    status() {
      return Object.freeze({
        aktivFreigegeben: true,
        gestoppt: false,
        lebensnachweisAutomatikAktiv: true,
        lebensnachweisAutomatikPausiert: false,
        lebensnachweisSendeErfolge: heartbeatErfolge,
        lebensnachweisSendeFehler: heartbeatFehler,
        performanceTrickErforderlich: true,
        performanceTrickAufgerufen: true
      });
    },
    basisBedienStatus() {
      return Object.freeze({
        laufzeit: Object.freeze({
          schemaVersion: 1,
          zustand,
          generation,
          automatischeFortsetzung: false
        }),
        behandelteVorgaenge: 0,
        maxBehandelteVorgaenge: 100
      });
    },
    erstelleBasisBedienAnfrage(daten) {
      return Object.freeze({
        kennung: daten.vorgangsKennung,
        basisAktion: daten.aktion,
        erwarteteLaufzeitGeneration: daten.erwarteteLaufzeitGeneration,
        ausdruecklichBestaetigt: daten.ausdruecklichBestaetigt === true
      });
    },
    fuehreBasisBedienAnfrage(anfrage) {
      if (anfrage.basisAktion === 'diagnose_aktualisieren') {
        return Object.freeze({
          aktion: 'diagnose_aktualisieren',
          status: 'ausgefuehrt'
        });
      }
      if (anfrage.erwarteteLaufzeitGeneration !== generation) {
        return Object.freeze({
          aktion: anfrage.basisAktion,
          status: 'blockiert'
        });
      }
      if (anfrage.basisAktion === 'laufzeit_pausieren') {
        if (zustand !== 'laeuft') {
          return Object.freeze({ aktion: anfrage.basisAktion, status: 'blockiert' });
        }
        zustand = 'pausiert';
        generation += 1;
        return Object.freeze({ aktion: anfrage.basisAktion, status: 'ausgefuehrt' });
      }
      if (anfrage.basisAktion === 'laufzeit_fortsetzen') {
        if (fortsetzenFehler) throw new Error('simulierter Fortsetzen-Fehler');
        if (zustand !== 'pausiert' || anfrage.ausdruecklichBestaetigt !== true) {
          return Object.freeze({ aktion: anfrage.basisAktion, status: 'blockiert' });
        }
        zustand = 'laeuft';
        generation += 1;
        return Object.freeze({ aktion: anfrage.basisAktion, status: 'ausgefuehrt' });
      }
      throw new Error('Unbekannte Testaktion.');
    }
  };

  class FakeDate extends Date {
    static now() {
      return jetzt;
    }
  }

  const kontext = vm.createContext({
    console,
    Date: FakeDate,
    setInterval(fn) {
      timerId += 1;
      timer.set(timerId, fn);
      return timerId;
    },
    clearInterval(id) {
      timer.delete(id);
    },
    V4TestGui: {
      erstelleTest() {
        return guiTest;
      }
    },
    V4ProduktionsLaufzeit: runtime,
    AIO_V4_BLOCK85_FREIGABE_CONFIG: Object.freeze({
      aenderungsKennung: 'git:teststand',
      laufKennung: 'lauf-1',
      soakDauerMillisekunden
    })
  });
  kontext.globalThis = kontext;
  kontext.parent = kontext;

  vm.runInContext(code, kontext, { filename: 'block8-5-freigabestufen-live-test.js' });

  return {
    api: kontext.V4Block85FreigabeLiveTest,
    aktionen,
    protokoll,
    runtime,
    status: () => ({ zustand, generation, heartbeatErfolge, heartbeatFehler }),
    setzeGeneration(wert) {
      generation = wert;
    },
    setzeHeartbeatFehler(wert) {
      heartbeatFehler = wert;
    },
    async tick(millisekunden = 5_000) {
      jetzt += millisekunden;
      heartbeatErfolge += 1;
      for (const fn of [...timer.values()]) fn();
      await Promise.resolve();
    }
  };
}

test('Block 8.5.9 Live-Runner akzeptiert nur Runtime 1.1.5', async () => {
  const u = await lade({ runtimeVersion: '1.1.4' });

  assert.throws(
    () => u.aktionen.get('schatten').ausfuehren(),
    /erwartet Runtime 1\.1\.5/
  );
});

test('Block 8.5.9 Live-Runner erzeugt Schattennachweis nur ueber read-only Diagnose', async () => {
  const u = await lade();

  const bericht = u.aktionen.get('schatten').ausfuehren();

  assert.equal(bericht.pass, true);
  assert.equal(bericht.nachweis.stufe, 'schatten');
  assert.equal(bericht.nachweis.ergebnis, 'bestanden');
  assert.equal(bericht.nachweis.spielAktionAusgefuehrt, false);
  assert.equal(bericht.generationVorher, 0);
  assert.equal(bericht.generationNachher, 0);
  assert.equal(u.status().zustand, 'laeuft');
  assert.equal(u.status().generation, 0);
  assert.equal(u.aktionen.get('kontrolliert-live').aktiv, true);
});

test('Block 8.5.9 kontrollierter Live-Nachweis fuehrt genau Pause und bestaetigtes Fortsetzen aus', async () => {
  const u = await lade();

  u.aktionen.get('schatten').ausfuehren();
  const bericht = u.aktionen.get('kontrolliert-live').ausfuehren();

  assert.equal(bericht.pass, true);
  assert.equal(bericht.nachweis.stufe, 'kontrolliert_live');
  assert.equal(bericht.nachweis.ergebnis, 'bestanden');
  assert.equal(bericht.nachweis.begrenzt, true);
  assert.equal(bericht.nachweis.spielAktionAusgefuehrt, false);
  assert.equal(bericht.generationVorher, 0);
  assert.equal(bericht.generationNachPause, 1);
  assert.equal(bericht.generationNachFortsetzen, 2);
  assert.equal(u.status().zustand, 'laeuft');
  assert.equal(u.status().generation, 2);
  assert.equal(u.aktionen.get('soak').aktiv, true);
});

test('Block 8.5.9 kontrollierter Live-Nachweis ist ohne Schattenstufe blockiert', async () => {
  const u = await lade();

  assert.throws(
    () => u.aktionen.get('kontrolliert-live').ausfuehren(),
    /verlangt zuerst einen bestandenen Schattennachweis/
  );
  assert.equal(u.status().generation, 0);
});

test('Block 8.5.9 Live-Fehler nach Pause setzt die Runtime nicht automatisch fort', async () => {
  const u = await lade({ fortsetzenFehler: true });

  u.aktionen.get('schatten').ausfuehren();

  assert.throws(
    () => u.aktionen.get('kontrolliert-live').ausfuehren(),
    /simulierter Fortsetzen-Fehler/
  );
  assert.equal(u.status().zustand, 'pausiert');
  assert.equal(u.status().generation, 1);
});

test('Block 8.5.9 Soak erzeugt Telemetrie- und Recovery-Nachweis erst nach Mindestdauer', async () => {
  const u = await lade();

  u.aktionen.get('schatten').ausfuehren();
  u.aktionen.get('kontrolliert-live').ausfuehren();

  const soakPromise = u.aktionen.get('soak').ausfuehren();
  for (let index = 0; index < 120; index += 1) {
    await u.tick();
  }
  const bericht = await soakPromise;

  assert.equal(bericht.pass, true);
  assert.equal(bericht.samples, 120);
  assert.equal(bericht.nachweis.stufe, 'soak');
  assert.equal(bericht.nachweis.ergebnis, 'bestanden');
  assert.equal(bericht.nachweis.telemetrieNachweis, true);
  assert.equal(bericht.nachweis.recoveryNachweis, true);
  assert.equal(bericht.nachweis.gesamtauswertungBestanden, true);
  assert.equal(bericht.generation, 2);
  assert.equal(bericht.generationNachher, 2);
});

test('Block 8.5.9 Soak schlaegt bei unerwarteter Laufzeit-Generation fehl', async () => {
  const u = await lade();

  u.aktionen.get('schatten').ausfuehren();
  u.aktionen.get('kontrolliert-live').ausfuehren();

  const soakPromise = u.aktionen.get('soak').ausfuehren();
  for (let index = 0; index < 120; index += 1) {
    if (index === 10) u.setzeGeneration(99);
    await u.tick();
  }
  const bericht = await soakPromise;

  assert.equal(bericht.pass, false);
  assert.equal(bericht.nachweis.ergebnis, 'fehlgeschlagen');
  assert.equal(bericht.nachweis.telemetrieNachweis, false);
  assert.equal(bericht.nachweis.recoveryNachweis, false);
  assert.equal(bericht.nachweis.gesamtauswertungBestanden, false);
  assert.ok(bericht.fehler.some((text) => /Generation/.test(text)));
});

test('Block 8.5.9 Live-Runner erzwingt mindestens zehn Minuten Soak', async () => {
  await assert.rejects(
    () => lade({ soakDauerMillisekunden: 599_999 }),
    /soakDauerMillisekunden muss zwischen/
  );
});

test('Block 8.5.9 Live-Runner besitzt keinen direkten Adventure-Land-Spielaktionsaufruf', async () => {
  const source = await readFile(
    new URL('../../werkzeuge/block8-5-freigabestufen-live-test.js', import.meta.url),
    'utf8'
  );

  for (const name of [
    'attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp',
    'use_hp_or_mp', 'loot', 'send_cm', 'command_character', 'send_party_invite',
    'buy', 'sell', 'send_item', 'upgrade', 'compound'
  ]) {
    assert.equal(new RegExp(`\\b${name}\\s*\\(`).test(source), false, name);
  }

  for (const verboten of [
    '.pausiereLebensnachweisAutomatik(',
    '.setzeLebensnachweisAutomatikFort(',
    '.bereiteGruppenZielVor(',
    '.installiereGruppenZielLiveSmoke(',
    '.stoppe(',
    'location.reload(',
    'window.close('
  ]) {
    assert.equal(source.includes(verboten), false, verboten);
  }
});
