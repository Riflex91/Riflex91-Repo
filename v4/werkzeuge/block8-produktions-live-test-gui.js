(() => {
  'use strict';

  const API_NAME = 'V4Block8ProduktionsLiveTestGui';
  const VERSION = '1.0.0';
  const GUI_API_NAME = 'V4TestGui';
  const RUNTIME_API_NAME = 'V4ProduktionsLaufzeit';
  const BOOTSTRAP_API_NAME = 'V4Bootstrap';
  const RUNNER_API_NAME = 'V4Block8GruppenZielLiveSmokeRunner';
  const AKTION_GRUPPENZIEL = 'GRUPPE_GEMEINSAMES_ZIEL_BEARBEITEN';

  function holeElternFenster() {
    try {
      if (typeof parent !== 'undefined' && parent && parent !== globalThis) return parent;
    } catch {
      // Lokaler Kontext bleibt Fallback.
    }
    return null;
  }

  function holeGlobal(name) {
    try {
      if (name in globalThis) return globalThis[name];
    } catch {
      // Parent-Fallback.
    }
    const eltern = holeElternFenster();
    try {
      if (eltern && name in eltern) return eltern[name];
    } catch {
      // Nicht vorhanden.
    }
    return undefined;
  }

  function holeSpielFenster() {
    const eltern = holeElternFenster();
    try {
      if (eltern?.character) return eltern;
    } catch {
      // Lokaler Kontext bleibt Fallback.
    }
    return globalThis;
  }

  function konfiguration() {
    const roh = holeGlobal('AIO_V4_LIVE_TEST_GUI_CONFIG');
    const wert = roh && typeof roh === 'object' ? roh : {};
    const leiterName = typeof wert.leiterName === 'string' ? wert.leiterName.trim() : '';
    if (!leiterName) throw new Error('AIO_V4_LIVE_TEST_GUI_CONFIG.leiterName fehlt.');
    return Object.freeze({ leiterName });
  }

  function guiApi() {
    const api = holeGlobal(GUI_API_NAME);
    if (!api || typeof api.erstelleTest !== 'function') {
      throw new Error(`${GUI_API_NAME} fehlt. Zuerst adventure-land-test-gui.js laden.`);
    }
    return api;
  }

  function bootstrapApi() {
    const api = holeGlobal(BOOTSTRAP_API_NAME);
    if (!api || typeof api.lade !== 'function' || typeof api.status !== 'function') {
      throw new Error(`${BOOTSTRAP_API_NAME} fehlt.`);
    }
    return api;
  }

  function runtimeApi() {
    const api = holeGlobal(RUNTIME_API_NAME);
    if (!api || typeof api.status !== 'function') {
      throw new Error(`${RUNTIME_API_NAME} ist nicht geladen.`);
    }
    return api;
  }

  function runnerApi() {
    const api = holeGlobal(RUNNER_API_NAME);
    if (!api || typeof api.vorschau !== 'function' || typeof api.starte !== 'function' || typeof api.startText !== 'function') {
      throw new Error(`${RUNNER_API_NAME} fehlt.`);
    }
    return api;
  }

  function lokaleIdentitaet() {
    const spiel = holeSpielFenster();
    const charakter = spiel?.character;
    if (!charakter || typeof charakter !== 'object') throw new Error('Adventure-Land-Charakter ist nicht lesbar.');
    const name = typeof charakter.name === 'string' ? charakter.name : '';
    if (!name) throw new Error('Adventure-Land-Charaktername ist nicht lesbar.');
    return Object.freeze({
      name,
      serverRegion: typeof spiel.server_region === 'string' ? spiel.server_region : null,
      serverKennung: typeof spiel.server_identifier === 'string' ? spiel.server_identifier : null,
      karte: typeof charakter.map === 'string' ? charakter.map : null,
      instanz: typeof charakter.in === 'string' ? charakter.in : null
    });
  }

  function findeZiel(zielKennung) {
    const spiel = holeSpielFenster();
    const entities = spiel?.entities;
    if (!entities || typeof entities !== 'object') {
      throw new Error('Adventure-Land-Entities sind nicht lesbar.');
    }
    let ziel = entities[String(zielKennung)];
    if (!ziel || typeof ziel !== 'object') {
      ziel = Object.values(entities).find((eintrag) =>
        eintrag &&
        typeof eintrag === 'object' &&
        String(eintrag.id ?? '') === String(zielKennung)
      );
    }
    if (!ziel || typeof ziel !== 'object') {
      throw new Error(`Gemeinsames Ziel ist nicht sichtbar: ${String(zielKennung)}.`);
    }
    if (ziel.dead === true || ziel.rip === true || typeof ziel.hp !== 'number' || !Number.isFinite(ziel.hp) || ziel.hp <= 0) {
      throw new Error(`Gemeinsames Ziel ist nicht bestaetigt lebendig: ${String(zielKennung)}.`);
    }
    if (typeof ziel.mtype !== 'string' || ziel.mtype.length === 0) {
      throw new Error(`Monsterart des gemeinsamen Ziels ist unbekannt: ${String(zielKennung)}.`);
    }
    return ziel;
  }

  function baueErwartung(zielKennung, ziel) {
    const identitaet = lokaleIdentitaet();
    if (!identitaet.serverRegion || !identitaet.serverKennung || !identitaet.karte || !identitaet.instanz) {
      throw new Error('Server/Karte/Instanz sind fuer den Smoke nicht vollstaendig lesbar.');
    }
    return Object.freeze({
      charakterName: identitaet.name,
      serverRegion: identitaet.serverRegion,
      serverKennung: identitaet.serverKennung,
      karte: identitaet.karte,
      instanz: identitaet.instanz,
      zielKennung: String(zielKennung),
      monsterArt: ziel.mtype
    });
  }

  function pruefeSmokeVorschau(status) {
    const v = status?.letzteVorschau;
    if (!v || typeof v !== 'object') throw new Error('Smoke-Runner lieferte keine Produktionsvorschau.');
    if (v.aktionsName !== AKTION_GRUPPENZIEL) throw new Error(`Unerwartete Smoke-Aktion: ${String(v.aktionsName)}.`);
    if (v.angriffsBereitschaft !== 'bereit') throw new Error(`Angriff ist nicht bereit: ${String(v.angriffsBereitschaft)}.`);
    const ressourcen = Array.isArray(v.ressourcen) ? [...v.ressourcen].sort() : [];
    if (ressourcen.length !== 2 || ressourcen[0] !== 'gruppe' || ressourcen[1] !== 'kampfziel') {
      throw new Error(`Unerwartete Smoke-Ressourcen: ${JSON.stringify(ressourcen)}.`);
    }
    return v;
  }

  const cfg = konfiguration();
  const identitaetBeimStart = lokaleIdentitaet();
  const istLeiter = identitaetBeimStart.name === cfg.leiterName;
  const test = guiApi().erstelleTest({
    kennung: `block8-live-${identitaetBeimStart.name}`,
    titel: `V4 Block 8 Live-Test · ${identitaetBeimStart.name}`,
    beschreibung: istLeiter
      ? 'Testleiter: Runtime, Heartbeat, Gruppenziel, Smoke-Vorschau und bestaetigter one-shot. Jeder Schritt erzeugt einen kopierbaren Bericht.'
      : 'Teilnehmer: Runtime/Empfang und Heartbeat. Aktive Gruppenziel-/Smoke-Schritte sind nur auf dem konfigurierten Testleiter verfuegbar.'
  });

  let letzterVorbereitungsBericht = null;

  function protokolliereStatus(prefix = 'Runtime') {
    const status = runtimeApi().status();
    test.protokolliere(prefix, status);
    return status;
  }

  async function runtimeLaden() {
    let bootstrapStatus = bootstrapApi().status();
    if (!bootstrapStatus.bereit) {
      bootstrapStatus = await bootstrapApi().lade();
    }
    const runtimeStatus = runtimeApi().status();
    const pass = runtimeStatus.aktivFreigegeben === true &&
      runtimeStatus.liveSmokeInstalliert === false &&
      runtimeStatus.gestoppt === false;

    const ergebnis = Object.freeze({
      schritt: 'runtime_laden',
      pass,
      charakter: lokaleIdentitaet(),
      bootstrap: bootstrapStatus,
      runtime: runtimeStatus
    });
    test.setzeErgebnis(ergebnis, pass ? 'pass' : 'fail', pass
      ? 'Aktive Produktionsruntime geladen; noch keine Smoke-Aktion.'
      : 'Runtime-Status entspricht nicht der erwarteten aktiven Testkonfiguration.');
    test.protokolliere('Runtime geladen', ergebnis);
    test.setzeAktionAktiv('empfang-starten', pass);
    return ergebnis;
  }

  function empfangStarten() {
    const status = runtimeApi().starte();
    const pass = status.empfangInstalliert === true &&
      status.laufendeGruppenAnfragen.length === 0 &&
      status.ressourcenSperren.length === 0 &&
      status.liveSmokeInstalliert === false;

    const ergebnis = Object.freeze({
      schritt: 'empfang_starten',
      pass,
      charakter: lokaleIdentitaet(),
      runtime: status
    });
    test.setzeErgebnis(ergebnis, pass ? 'pass' : 'fail', pass
      ? 'Lebensnachweis-Empfang aktiv; keine Gruppenaktion gestartet.'
      : 'Empfangs-Preflight ist nicht sauber.');
    test.protokolliere('Empfang gestartet', ergebnis);
    test.setzeAktionAktiv('heartbeat-senden', pass);
    return ergebnis;
  }

  async function heartbeatSenden() {
    const sendeErgebnis = await runtimeApi().sendeLebensnachweis();
    const ergebnisse = Array.isArray(sendeErgebnis.ergebnisse) ? sendeErgebnis.ergebnisse : [];
    const pass = ergebnisse.length > 0 && ergebnisse.every((eintrag) => eintrag?.gesendet === true);
    const status = protokolliereStatus('Runtime nach Heartbeat');
    const ergebnis = Object.freeze({
      schritt: 'heartbeat_senden',
      pass,
      charakter: lokaleIdentitaet(),
      meldung: sendeErgebnis.meldung,
      senden: ergebnisse,
      bekannteTeilnehmer: status.bekannteTeilnehmer,
      laufendeGruppenAnfragen: status.laufendeGruppenAnfragen,
      ressourcenSperren: status.ressourcenSperren
    });
    const mindestensZweiTeilnehmer = Array.isArray(status.bekannteTeilnehmer) && status.bekannteTeilnehmer.length >= 2;
    const vorbereitungBereit = pass && mindestensZweiTeilnehmer;
    test.setzeErgebnis(ergebnis, vorbereitungBereit ? 'pass' : pass ? 'warn' : 'fail', vorbereitungBereit
      ? 'Heartbeat gesendet und mindestens zwei Teilnehmer sind bekannt. Gruppenziel-Vorschau ist freigegeben.'
      : pass
        ? 'Heartbeat gesendet, aber noch nicht mindestens zwei Teilnehmer bekannt.'
        : 'Mindestens ein Lebensnachweis wurde nicht gesendet.');
    test.protokolliere('Heartbeat', ergebnis);
    if (istLeiter) test.setzeAktionAktiv('gruppenziel-vorschau', vorbereitungBereit);
    return ergebnis;
  }

  function gruppenzielUndVorschau() {
    if (!istLeiter) throw new Error(`Nur Testleiter ${cfg.leiterName} darf Gruppenziel/Smoke vorbereiten.`);
    const runtime = runtimeApi();
    const vorbereitung = runtime.bereiteGruppenZielVor(runtime.gruppenzielFreigabeText());
    if (vorbereitung.gestarteterAktionsName !== AKTION_GRUPPENZIEL || !vorbereitung.gestarteteAktionsKennung) {
      throw new Error(`Gruppenziel-Vorbereitung startete keine erlaubte Zielaktion: ${String(vorbereitung.gestarteterAktionsName)}.`);
    }
    if (!vorbereitung.gemeinsamesZielKennung) throw new Error('Gruppenplanung lieferte kein gemeinsames Ziel.');

    const ziel = findeZiel(vorbereitung.gemeinsamesZielKennung);
    const erwartung = baueErwartung(vorbereitung.gemeinsamesZielKennung, ziel);
    runtime.installiereGruppenZielLiveSmoke(erwartung, runtime.liveSmokeInstallationsText());

    const runnerStatus = runnerApi().vorschau();
    const vorschau = pruefeSmokeVorschau(runnerStatus);
    const runtimeStatus = runtime.status();
    const pass = runtimeStatus.laufendeGruppenAnfragen.length === 1 &&
      runtimeStatus.ressourcenSperren.length === 2 &&
      runtimeStatus.liveSmokeInstalliert === true &&
      runtimeStatus.gruppenZielVorbereitungVerbraucht === true;

    const ergebnis = Object.freeze({
      schritt: 'gruppenziel_smoke_vorschau',
      pass,
      charakter: lokaleIdentitaet(),
      vorbereitung,
      erwartung,
      vorschau,
      runtime: runtimeStatus,
      hinweis: 'Noch keine Adventure-Land-Kampfaktion ausgefuehrt.'
    });
    letzterVorbereitungsBericht = ergebnis;
    test.setzeErgebnis(ergebnis, pass ? 'pass' : 'fail', pass
      ? 'Smoke-Vorschau bestanden. one-shot bleibt gesperrt bis zur expliziten Bestaetigung.'
      : 'Smoke-Vorschau hat die PASS-Kriterien nicht erfuellt.');
    test.protokolliere('Gruppenziel + Smoke-Vorschau', ergebnis);
    test.setzeAktionAktiv('one-shot', pass);
    return ergebnis;
  }

  async function oneShot() {
    if (!istLeiter) throw new Error(`Nur Testleiter ${cfg.leiterName} darf den one-shot starten.`);
    if (!letzterVorbereitungsBericht?.pass) throw new Error('Vor dem one-shot ist eine bestandene Gruppenziel-/Smoke-Vorschau erforderlich.');

    const runner = runnerApi();
    const frisch = runner.vorschau();
    const frischeVorschau = pruefeSmokeVorschau(frisch);
    test.protokolliere('Frische Vorschau unmittelbar vor one-shot', frischeVorschau);

    const bericht = await runner.starte(runner.startText());
    const pass = bericht?.status === 'bestanden' &&
      bericht?.echteSpielaktionen?.attack === 1 &&
      bericht?.echteSpielaktionen?.sonstige === 0 &&
      bericht?.ausfuehrungsBrueckeEntfernt === true &&
      bericht?.zentralePhase === 'abgeschlossen' &&
      Array.isArray(bericht?.verbleibendeRessourcen) &&
      bericht.verbleibendeRessourcen.length === 0 &&
      bericht?.automatischWiederGesperrt === true;

    const runtimeStatus = runtimeApi().status();
    const ergebnis = Object.freeze({
      schritt: 'one_shot_live_smoke',
      pass,
      charakter: lokaleIdentitaet(),
      bericht,
      runtimeNachher: runtimeStatus
    });
    test.setzeErgebnis(ergebnis, pass ? 'pass' : 'fail', pass
      ? 'ONE-SHOT BESTANDEN: exakt ein attack, keine sonstige Aktion, Ressourcen frei.'
      : 'ONE-SHOT FEHLGESCHLAGEN: Bericht entspricht nicht allen PASS-Kriterien.');
    test.protokolliere('One-shot Abschlussbericht', ergebnis);
    test.setzeAktionAktiv('one-shot', false);
    return ergebnis;
  }

  function stoppen() {
    const status = runtimeApi().stoppe();
    const ergebnis = Object.freeze({
      schritt: 'stoppen',
      pass: status.gestoppt === true &&
        status.empfangInstalliert === false &&
        status.liveSmokeInstalliert === false &&
        status.laufendeGruppenAnfragen.length === 0 &&
        status.ressourcenSperren.length === 0,
      charakter: lokaleIdentitaet(),
      runtime: status
    });
    test.setzeErgebnis(ergebnis, ergebnis.pass ? 'pass' : 'warn', ergebnis.pass
      ? 'Runtime sauber gestoppt; keine Gruppenanfrage oder Ressourcensperre verbleibt.'
      : 'Runtime gestoppt, aber Abschlussstatus benoetigt Pruefung.');
    test.protokolliere('Stop', ergebnis);
    for (const kennung of ['empfang-starten', 'heartbeat-senden', 'gruppenziel-vorschau', 'one-shot']) {
      test.setzeAktionAktiv(kennung, false);
    }
    return ergebnis;
  }

  test.registriereAktion({
    kennung: 'runtime-laden',
    titel: '1 · Runtime laden',
    art: 'primaer',
    einmalig: true,
    ausfuehren: runtimeLaden
  });
  test.registriereAktion({
    kennung: 'empfang-starten',
    titel: '2 · Empfang starten',
    aktiviert: false,
    einmalig: true,
    ausfuehren: empfangStarten
  });
  test.registriereAktion({
    kennung: 'heartbeat-senden',
    titel: '3 · Heartbeat senden',
    aktiviert: false,
    ausfuehren: heartbeatSenden
  });
  test.registriereAktion({
    kennung: 'gruppenziel-vorschau',
    titel: '4 · Gruppenziel + Vorschau',
    art: 'primaer',
    aktiviert: false,
    einmalig: true,
    ausfuehren: gruppenzielUndVorschau
  });
  test.registriereAktion({
    kennung: 'one-shot',
    titel: '5 · ONE-SHOT AUSFUEHREN',
    art: 'gefahr',
    aktiviert: false,
    einmalig: true,
    bestaetigungsText: runnerApi().startText(),
    ausfuehren: oneShot
  });
  test.registriereAktion({
    kennung: 'stoppen',
    titel: 'Stoppen / aufraeumen',
    art: 'gefahr',
    ausfuehren: stoppen
  });

  if (!istLeiter) {
    test.setzeAktionAktiv('gruppenziel-vorschau', false);
    test.setzeAktionAktiv('one-shot', false);
  }

  const api = Object.freeze({
    version: VERSION,
    istLeiter,
    leiterName: cfg.leiterName,
    lokalerName: identitaetBeimStart.name,
    test,
    status() {
      return Object.freeze({
        version: VERSION,
        istLeiter,
        leiterName: cfg.leiterName,
        lokalerName: identitaetBeimStart.name,
        gui: test.status(),
        runtime: holeGlobal(RUNTIME_API_NAME)?.status?.() ?? null,
        runner: holeGlobal(RUNNER_API_NAME)?.status?.() ?? null
      });
    },
    kopiereBericht: () => test.kopiereBericht()
  });

  Object.defineProperty(globalThis, API_NAME, {
    configurable: true,
    enumerable: true,
    writable: false,
    value: api
  });
  try {
    const eltern = holeElternFenster();
    if (eltern && eltern[API_NAME] === undefined) {
      Object.defineProperty(eltern, API_NAME, {
        configurable: true,
        enumerable: true,
        writable: false,
        value: api
      });
    }
  } catch {
    // Lokale API bleibt verfuegbar.
  }

  test.protokolliere('GUI bereit', {
    charakter: identitaetBeimStart,
    leiterName: cfg.leiterName,
    istLeiter,
    sicherheit: 'Die GUI selbst ruft keine Adventure-Land-Aktionsfunktion direkt auf. Der one-shot nutzt ausschliesslich den bestehenden Produktions-Smoke-Runner.'
  });
  test.setzeStatus('bereit', istLeiter
    ? 'Testleiter bereit. Mit „1 · Runtime laden“ beginnen.'
    : 'Teilnehmer bereit. Runtime laden, Empfang starten und Heartbeats senden.');
})();
