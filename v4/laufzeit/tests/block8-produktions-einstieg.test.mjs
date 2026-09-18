import test from 'node:test';
import assert from 'node:assert/strict';
import {
  installiereAdventureLandProduktionsLaufzeit,
  PRODUKTIONS_LAUFZEIT_GLOBALER_NAME
} from '../../erzeugt/ausfuehrung/adventure-land-produktions-einstieg.js';

function spiel() {
  let intervalCallback = null;
  let intervalMillisekunden = null;
  let intervalId = 0;
  let performanceTrickAufrufe = 0;
  const gesendet = [];
  const parent = {
    character: {
      id: 'ranger-1', name: 'My_Ranger1', ctype: 'ranger', level: 80,
      hp: 900, max_hp: 1000, mp: 700, max_mp: 800, xp: 1, max_xp: 2, gold: 100,
      attack: 100, frequency: 1, speed: 40, range: 100, armor: 10, resistance: 10,
      map: 'main', in: 'main', x: 0, y: 0, real_x: 0, real_y: 0, moving: false,
      target: null, rip: false, stand: false, items: [], slots: {}
    },
    entities: {}, party: {}, G: {}, server_region: 'EU', server_identifier: 'I',
    is_on_cooldown: () => false,
    send_cm(name, daten) {
      gesendet.push({ name, daten });
      return { receivers: [name], locals: [] };
    }
  };
  const code = {
    parent,
    character: parent.character,
    on_cm: undefined,
    performance_trick() {
      performanceTrickAufrufe += 1;
    },
    setInterval(fn, millisekunden) {
      intervalCallback = fn;
      intervalMillisekunden = millisekunden;
      intervalId += 1;
      return intervalId;
    },
    clearInterval() {
      intervalCallback = null;
    }
  };
  return {
    code,
    parent,
    gesendet,
    intervalMillisekunden: () => intervalMillisekunden,
    performanceTrickAufrufe: () => performanceTrickAufrufe,
    feuereIntervall() {
      assert.notEqual(intervalCallback, null);
      intervalCallback();
    },
    hatIntervall: () => intervalCallback !== null
  };
}

async function flush() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

test('V4 Produktionslaufzeit installiert standardmaessig nur eine gesperrte eingefrorene API', () => {
  const u = spiel();
  const api = installiereAdventureLandProduktionsLaufzeit(u.code);
  assert.equal(u.code[PRODUKTIONS_LAUFZEIT_GLOBALER_NAME], api);
  assert.equal(Object.isFrozen(api), true);
  assert.equal(api.status().aktivFreigegeben, false);
  assert.equal(api.status().empfangInstalliert, false);
  const gestartet = api.starte();
  assert.equal(gestartet.empfangInstalliert, true);
  assert.equal(gestartet.lebensnachweisAutomatikAktiv, false);
  assert.equal(gestartet.performanceTrickErforderlich, true);
  assert.equal(gestartet.performanceTrickVerfuegbar, true);
  assert.equal(gestartet.performanceTrickAufgerufen, false);
  assert.equal(u.performanceTrickAufrufe(), 0);
  assert.throws(() => api.bereiteGruppenZielVor(api.gruppenzielFreigabeText()), /standardmaessig gesperrt/);
});

test('V4 Produktionslaufzeit besitzt autonomen 2s-Heartbeat mit Pause Fortsetzen und Transportmetriken', async () => {
  const u = spiel();
  const api = installiereAdventureLandProduktionsLaufzeit(u.code, {
    aktivFreigegeben: true,
    vertrauensNamen: ['My_Ranger1', 'My_Ranger2'],
    faehigkeiten: { heilen: 0, schaden: 1, aggro: 0, schutz: 0, unterstuetzung: 0.5 }
  });

  const gestartet = api.starte();
  assert.equal(gestartet.empfangInstalliert, true);
  assert.equal(gestartet.lebensnachweisAutomatikAktiv, true);
  assert.equal(gestartet.lebensnachweisAutomatikPausiert, false);
  assert.equal(gestartet.lebensnachweisIntervallMillisekunden, 2_000);
  assert.equal(gestartet.performanceTrickErforderlich, true);
  assert.equal(gestartet.performanceTrickVerfuegbar, true);
  assert.equal(gestartet.performanceTrickAufgerufen, true);
  assert.equal(gestartet.performanceTrickAufrufe, 1);
  assert.equal(gestartet.performanceTrickLetzterFehler, null);
  assert.equal(u.performanceTrickAufrufe(), 1);
  assert.equal(u.intervalMillisekunden(), 2_000);

  await flush();
  assert.equal(api.status().lebensnachweisSendeVersuche, 1);
  assert.equal(api.status().lebensnachweisSendeErfolge, 1);
  assert.equal(api.status().lebensnachweisSendeFehler, 0);
  assert.equal(u.gesendet.length, 1);

  u.feuereIntervall();
  await flush();
  assert.equal(api.status().lebensnachweisSendeVersuche, 2);
  assert.equal(api.status().lebensnachweisSendeErfolge, 2);

  const pausiert = api.pausiereLebensnachweisAutomatik();
  assert.equal(pausiert.lebensnachweisAutomatikAktiv, false);
  assert.equal(pausiert.lebensnachweisAutomatikPausiert, true);
  assert.equal(u.hatIntervall(), false);

  const fortgesetzt = api.setzeLebensnachweisAutomatikFort();
  assert.equal(fortgesetzt.lebensnachweisAutomatikAktiv, true);
  assert.equal(fortgesetzt.lebensnachweisAutomatikPausiert, false);
  await flush();
  assert.equal(api.status().lebensnachweisSendeVersuche, 3);
  assert.equal(api.status().lebensnachweisSendeErfolge, 3);
  assert.equal(api.status().performanceTrickAufrufe, 1);
  assert.equal(u.performanceTrickAufrufe(), 1);

  const gestoppt = api.stoppe();
  assert.equal(gestoppt.empfangInstalliert, false);
  assert.equal(gestoppt.lebensnachweisAutomatikAktiv, false);
  assert.equal(u.hatIntervall(), false);
});

test('V4 Produktionslaufzeit blockiert aktive Browserlaufzeit fail-safe ohne performance_trick', () => {
  const u = spiel();
  delete u.code.performance_trick;
  const api = installiereAdventureLandProduktionsLaufzeit(u.code, {
    aktivFreigegeben: true,
    vertrauensNamen: ['My_Ranger1', 'My_Ranger2'],
    faehigkeiten: { heilen: 0, schaden: 1, aggro: 0, schutz: 0, unterstuetzung: 0.5 }
  });

  assert.throws(
    () => api.starte(),
    /benoetigt Adventure Lands performance_trick/
  );
  const status = api.status();
  assert.equal(status.performanceTrickErforderlich, true);
  assert.equal(status.performanceTrickVerfuegbar, false);
  assert.equal(status.performanceTrickAufgerufen, false);
  assert.match(status.performanceTrickLetzterFehler, /stellt performance_trick nicht bereit/);
  assert.equal(status.empfangInstalliert, false);
  assert.equal(status.lebensnachweisAutomatikAktiv, false);
});

test('V4 Produktionslaufzeit verlangt performance_trick nicht in Adventure Lands Desktoplaufzeit', async () => {
  const u = spiel();
  delete u.code.performance_trick;
  u.parent.is_electron = true;
  const api = installiereAdventureLandProduktionsLaufzeit(u.code, {
    aktivFreigegeben: true,
    vertrauensNamen: ['My_Ranger1', 'My_Ranger2'],
    faehigkeiten: { heilen: 0, schaden: 1, aggro: 0, schutz: 0, unterstuetzung: 0.5 }
  });

  const gestartet = api.starte();
  await flush();
  assert.equal(gestartet.performanceTrickErforderlich, false);
  assert.equal(gestartet.performanceTrickVerfuegbar, false);
  assert.equal(gestartet.performanceTrickAufgerufen, false);
  assert.equal(gestartet.empfangInstalliert, true);
  assert.equal(api.status().lebensnachweisSendeErfolge, 1);
  api.stoppe();
});

test('V4 Produktionslaufzeit zaehlt fehlende send_cm-Empfaengerbestaetigung als Heartbeat-Fehler', async () => {
  const u = spiel();
  u.parent.send_cm = () => ({ receivers: [], locals: [] });
  const api = installiereAdventureLandProduktionsLaufzeit(u.code, {
    aktivFreigegeben: true,
    vertrauensNamen: ['My_Ranger1', 'My_Ranger2'],
    faehigkeiten: { heilen: 0, schaden: 1, aggro: 0, schutz: 0, unterstuetzung: 0.5 }
  });

  api.starte();
  await flush();

  const status = api.status();
  assert.equal(status.lebensnachweisSendeVersuche, 1);
  assert.equal(status.lebensnachweisSendeErfolge, 0);
  assert.equal(status.lebensnachweisSendeFehler, 1);
  assert.match(status.lebensnachweisLetzterFehler, /nicht als Empfaenger bestaetigt/);
  api.stoppe();
});

test('V4 Produktionslaufzeit exportiert read-only Gruppendiagnose ohne Gruppenaktion', () => {
  const u = spiel();
  const api = installiereAdventureLandProduktionsLaufzeit(u.code);
  const diagnose = api.pruefeGruppenZustand();
  assert.equal(typeof api.pruefeGruppenZustand, 'function');
  assert.equal(diagnose.koordination.eigenerTeilnehmerKennung, 'ranger-1');
  assert.deepEqual(diagnose.laufendeGruppenAnfragen, []);
  assert.deepEqual(diagnose.ressourcenSperren, []);
  assert.equal(diagnose.liveSmokeInstalliert, false);
  assert.equal(diagnose.gruppenZielVorbereitungVerbraucht, false);
});

test('V4 Produktionslaufzeit verlangt bei aktiver Freigabe ein explizites Faehigkeitsprofil', () => {
  const u = spiel();
  assert.throws(
    () => installiereAdventureLandProduktionsLaufzeit(u.code, { aktivFreigegeben: true }),
    /explizites Gruppenfaehigkeitsprofil/
  );
});

test('V4 Produktionslaufzeit ueberschreibt keine bestehende globale Laufzeit', () => {
  const u = spiel();
  Object.defineProperty(u.code, PRODUKTIONS_LAUFZEIT_GLOBALER_NAME, {
    configurable: true,
    value: Object.freeze({ fremd: true })
  });
  assert.throws(() => installiereAdventureLandProduktionsLaufzeit(u.code), /bereits vorhanden/);
  assert.deepEqual(u.code[PRODUKTIONS_LAUFZEIT_GLOBALER_NAME], { fremd: true });
});

test('V4 Produktionslaufzeit stoppt den installierten Empfang fail-safe', () => {
  const u = spiel();
  const api = installiereAdventureLandProduktionsLaufzeit(u.code);
  api.starte();
  assert.equal(typeof u.code.on_cm, 'function');
  const status = api.stoppe();
  assert.equal(status.empfangInstalliert, false);
});
