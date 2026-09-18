import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

async function ladeApi() {
  const code = await readFile(
    new URL('../../werkzeuge/block8-5-ingame-hud-bedienung.js', import.meta.url),
    'utf8'
  );
  const kontext = vm.createContext({ console });
  kontext.globalThis = kontext;
  vm.runInContext(code, kontext, { filename: 'block8-5-ingame-hud-bedienung.js' });
  return kontext.V4IngameHudBedienung;
}

function fakeRuntime() {
  const aufrufe = [];
  let zustand = 'laeuft';
  let generation = 0;
  let behandelteVorgaenge = 0;

  function laufzeitStatus() {
    return Object.freeze({
      schemaVersion: 1,
      zustand,
      generation,
      letzteAenderungAm: generation === 0 ? null : 10_000 + generation,
      grund: zustand === 'laeuft' ? 'Freigegeben.' : 'Pausiert.',
      automatischeFortsetzung: false
    });
  }

  const runtime = Object.freeze({
    basisBedienStatus() {
      aufrufe.push({ methode: 'basisBedienStatus' });
      return Object.freeze({
        laufzeit: laufzeitStatus(),
        behandelteVorgaenge,
        maxBehandelteVorgaenge: 100
      });
    },
    erstelleBasisBedienAnfrage(daten) {
      aufrufe.push({ methode: 'erstelleBasisBedienAnfrage', daten: { ...daten } });
      return Object.freeze({
        kennung: daten.vorgangsKennung,
        aktion: `FAKE_${daten.aktion}`,
        basisAktion: daten.aktion,
        erwarteteLaufzeitGeneration: daten.erwarteteLaufzeitGeneration,
        titel: daten.aktion,
        erklaerung: 'Fake.',
        auswirkung: 'Fake.',
        risiko: daten.aktion === 'laufzeit_fortsetzen' ? 'vorsicht' : 'unkritisch',
        angefordertAm: 10_000,
        voraussetzungen: Object.freeze([]),
        ausdruecklichBestaetigt: daten.ausdruecklichBestaetigt === true
      });
    },
    fuehreBasisBedienAnfrage(anfrage) {
      aufrufe.push({ methode: 'fuehreBasisBedienAnfrage', anfrage });
      behandelteVorgaenge += 1;

      let status = 'ausgefuehrt';
      let grund = 'Ausgefuehrt.';
      if (
        anfrage.basisAktion !== 'diagnose_aktualisieren' &&
        anfrage.erwarteteLaufzeitGeneration !== generation
      ) {
        status = 'blockiert';
        grund = 'Laufzeit-Generation ist veraltet.';
      } else if (anfrage.basisAktion === 'laufzeit_pausieren') {
        if (zustand !== 'laeuft') {
          status = 'blockiert';
          grund = 'Bereits pausiert.';
        } else {
          zustand = 'pausiert';
          generation += 1;
        }
      } else if (anfrage.basisAktion === 'laufzeit_fortsetzen') {
        if (zustand !== 'pausiert' || anfrage.ausdruecklichBestaetigt !== true) {
          status = 'blockiert';
          grund = 'Fortsetzen ist nicht bestaetigt.';
        } else {
          zustand = 'laeuft';
          generation += 1;
        }
      }

      return Object.freeze({
        schemaVersion: 1,
        vorgangsKennung: anfrage.kennung,
        aktion: anfrage.basisAktion,
        status,
        grund,
        bedienEntscheidung: Object.freeze({
          erlaubt: status === 'ausgefuehrt',
          brauchtBestaetigung:
            anfrage.basisAktion === 'laufzeit_fortsetzen' &&
            anfrage.ausdruecklichBestaetigt !== true,
          grund,
          fehlendeVoraussetzungen: Object.freeze([])
        }),
        laufzeitStatus: laufzeitStatus(),
        abgebrocheneAktionsAnfrageKennungen: Object.freeze([]),
        diagnose: anfrage.basisAktion === 'diagnose_aktualisieren'
          ? Object.freeze({ ok: true })
          : null
      });
    }
  });

  return {
    runtime,
    aufrufe,
    externPausiere() {
      if (zustand === 'laeuft') {
        zustand = 'pausiert';
        generation += 1;
      }
    },
    zustand: () => ({ zustand, generation, behandelteVorgaenge })
  };
}

function methoden(aufrufe) {
  return aufrufe.map((eintrag) => eintrag.methode);
}

test('Block 8.5.7 HUD-Bedienung exportiert nur sichere Controller- und Montagehelfer', async () => {
  const api = await ladeApi();

  assert.equal(api.version, '1.0.0');
  assert.equal(typeof api.pruefeRuntime, 'function');
  assert.equal(typeof api.erstelleController, 'function');
  assert.equal(typeof api.montiere, 'function');
  assert.deepEqual(
    Object.keys(api).sort(),
    ['version', 'pruefeRuntime', 'erstelleController', 'montiere'].sort()
  );
});

test('Block 8.5.7 HUD-Controller akzeptiert nur Runtime mit den drei sicheren Basisbedienungs-Methoden', async () => {
  const api = await ladeApi();

  assert.throws(
    () => api.erstelleController({ runtime: {} }),
    /basisBedienStatus/
  );
  assert.throws(
    () => api.erstelleController({
      runtime: {
        basisBedienStatus() { return {}; },
        erstelleBasisBedienAnfrage() {}
      }
    }),
    /fuehreBasisBedienAnfrage/
  );

  const fake = fakeRuntime();
  assert.equal(api.pruefeRuntime(fake.runtime), true);
});

test('Block 8.5.7 Diagnose nutzt ausschliesslich sicheren Anfragepfad und veraendert Generation nicht', async () => {
  const api = await ladeApi();
  const fake = fakeRuntime();
  const controller = api.erstelleController({ runtime: fake.runtime, vorgangPrefix: 'test-hud' });
  fake.aufrufe.length = 0;

  const ergebnis = controller.diagnoseAktualisieren();

  assert.equal(ergebnis.status, 'ausgefuehrt');
  assert.deepEqual(
    methoden(fake.aufrufe),
    ['erstelleBasisBedienAnfrage', 'fuehreBasisBedienAnfrage', 'basisBedienStatus']
  );
  assert.equal(fake.aufrufe[0].daten.aktion, 'diagnose_aktualisieren');
  assert.equal(fake.aufrufe[0].daten.erwarteteLaufzeitGeneration, 0);
  assert.equal(fake.zustand().generation, 0);
  assert.equal(controller.status().basisStatus.laufzeit.zustand, 'laeuft');
});

test('Block 8.5.7 Pause verwendet die zuletzt beobachtete Generation und synchronisiert erst danach', async () => {
  const api = await ladeApi();
  const fake = fakeRuntime();
  const controller = api.erstelleController({ runtime: fake.runtime, vorgangPrefix: 'pause' });
  fake.aufrufe.length = 0;

  const ergebnis = controller.pauseAnfordern();

  assert.equal(ergebnis.status, 'ausgefuehrt');
  assert.equal(fake.aufrufe[0].methode, 'erstelleBasisBedienAnfrage');
  assert.equal(fake.aufrufe[0].daten.erwarteteLaufzeitGeneration, 0);
  assert.equal(fake.aufrufe[1].methode, 'fuehreBasisBedienAnfrage');
  assert.equal(fake.aufrufe[2].methode, 'basisBedienStatus');
  assert.equal(controller.status().basisStatus.laufzeit.zustand, 'pausiert');
  assert.equal(controller.status().basisStatus.laufzeit.generation, 1);
});

test('Block 8.5.7 stale HUD-Generation bleibt sichtbar blockiert statt vor dem Klick heimlich aktualisiert zu werden', async () => {
  const api = await ladeApi();
  const fake = fakeRuntime();
  const controller = api.erstelleController({ runtime: fake.runtime, vorgangPrefix: 'stale' });

  assert.equal(controller.status().basisStatus.laufzeit.generation, 0);
  fake.externPausiere();
  fake.aufrufe.length = 0;

  const ergebnis = controller.pauseAnfordern();

  assert.equal(ergebnis.status, 'blockiert');
  assert.equal(fake.aufrufe[0].daten.erwarteteLaufzeitGeneration, 0);
  assert.match(ergebnis.grund, /veraltet/);
  assert.equal(controller.status().basisStatus.laufzeit.generation, 1);
  assert.equal(controller.status().basisStatus.laufzeit.zustand, 'pausiert');
});

test('Block 8.5.7 Fortsetzen benoetigt erst lokale Folgenanzeige und danach ausdrueckliche zweite Bestaetigung', async () => {
  const api = await ladeApi();
  const fake = fakeRuntime();
  const controller = api.erstelleController({ runtime: fake.runtime, vorgangPrefix: 'resume' });

  controller.pauseAnfordern();
  fake.aufrufe.length = 0;

  const vorschau = controller.fortsetzenAnfordern();
  assert.equal(vorschau.bestaetigungErforderlich, true);
  assert.equal(vorschau.erwarteteLaufzeitGeneration, 1);
  assert.deepEqual(fake.aufrufe, []);
  assert.equal(controller.status().fortsetzenBestaetigungOffen, true);

  const ergebnis = controller.fortsetzenBestaetigen();
  assert.equal(ergebnis.status, 'ausgefuehrt');
  assert.equal(fake.aufrufe[0].daten.aktion, 'laufzeit_fortsetzen');
  assert.equal(fake.aufrufe[0].daten.erwarteteLaufzeitGeneration, 1);
  assert.equal(fake.aufrufe[0].daten.ausdruecklichBestaetigt, true);
  assert.equal(controller.status().basisStatus.laufzeit.zustand, 'laeuft');
  assert.equal(controller.status().fortsetzenBestaetigungOffen, false);
});

test('Block 8.5.7 Fortsetzen ohne vorherige Bestaetigungsphase ruft Runtime nicht auf', async () => {
  const api = await ladeApi();
  const fake = fakeRuntime();
  const controller = api.erstelleController({ runtime: fake.runtime });

  controller.pauseAnfordern();
  fake.aufrufe.length = 0;

  assert.throws(
    () => controller.fortsetzenBestaetigen(),
    /noch nicht zur ausdruecklichen Bestaetigung/
  );
  assert.deepEqual(fake.aufrufe, []);
  assert.equal(fake.zustand().zustand, 'pausiert');
});

test('Block 8.5.7 wiederholter Pause-Klick wird lokal blockiert und erzeugt keine zweite mutierende Anfrage', async () => {
  const api = await ladeApi();
  const fake = fakeRuntime();
  const controller = api.erstelleController({ runtime: fake.runtime, vorgangPrefix: 'doppelt' });

  controller.pauseAnfordern();
  const mutierendeVorher = fake.aufrufe.filter(
    (eintrag) => eintrag.methode === 'fuehreBasisBedienAnfrage'
  ).length;

  assert.throws(
    () => controller.pauseAnfordern(),
    /bereits pausiert/
  );

  const mutierendeNachher = fake.aufrufe.filter(
    (eintrag) => eintrag.methode === 'fuehreBasisBedienAnfrage'
  ).length;
  assert.equal(mutierendeNachher, mutierendeVorher);
});

test('Block 8.5.7 Vorgangskennungen sind lokal monoton ohne Zufall oder versteckte Uhr', async () => {
  const api = await ladeApi();
  const fake = fakeRuntime();
  const controller = api.erstelleController({ runtime: fake.runtime, vorgangPrefix: 'folge' });
  fake.aufrufe.length = 0;

  controller.diagnoseAktualisieren();
  controller.diagnoseAktualisieren();

  const kennungen = fake.aufrufe
    .filter((eintrag) => eintrag.methode === 'erstelleBasisBedienAnfrage')
    .map((eintrag) => eintrag.daten.vorgangsKennung);

  assert.deepEqual(kennungen, [
    'folge:diagnose_aktualisieren:1',
    'folge:diagnose_aktualisieren:2'
  ]);
  assert.equal(controller.status().naechsteVorgangsNummer, 3);
});

test('Block 8.5.7 Remount erzeugt ueber neue Controller hinweg keine identische Vorgangskennung', async () => {
  const api = await ladeApi();
  const fake = fakeRuntime();
  const ersterController = api.erstelleController({
    runtime: fake.runtime,
    vorgangPrefix: 'remount'
  });
  const zweiterController = api.erstelleController({
    runtime: fake.runtime,
    vorgangPrefix: 'remount'
  });
  fake.aufrufe.length = 0;

  ersterController.diagnoseAktualisieren();
  zweiterController.diagnoseAktualisieren();

  const kennungen = fake.aufrufe
    .filter((eintrag) => eintrag.methode === 'erstelleBasisBedienAnfrage')
    .map((eintrag) => eintrag.daten.vorgangsKennung);

  assert.deepEqual(kennungen, [
    'remount:diagnose_aktualisieren:1',
    'remount:diagnose_aktualisieren:2'
  ]);
  assert.notEqual(kennungen[0], kennungen[1]);
  assert.equal(zweiterController.status().naechsteVorgangsNummer, 3);
});

test('Block 8.5.7 Controller kann ohne DOM arbeiten und Montage bleibt reine Oberflaechenfunktion', async () => {
  const api = await ladeApi();
  const fake = fakeRuntime();

  assert.doesNotThrow(() => api.erstelleController({ runtime: fake.runtime }));
  assert.throws(
    () => api.montiere({ runtime: fake.runtime }),
    /kein nutzbares Dokument/
  );
});

test('Block 8.5.7 HUD-Bedienadapter besitzt keinen direkten Spiel-, Heartbeat-, Aktions- oder Neustartpfad', async () => {
  const source = await readFile(
    new URL('../../werkzeuge/block8-5-ingame-hud-bedienung.js', import.meta.url),
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
    '.reicheAnfrageEin(',
    '.verarbeiteNaechsteAktion(',
    '.brecheAktionAb(',
    '.schliesseAktionAb(',
    '.stoppe(',
    'Date.now(',
    'Math.random(',
    'location.reload(',
    'window.close('
  ]) {
    assert.equal(source.includes(verboten), false, verboten);
  }
});
