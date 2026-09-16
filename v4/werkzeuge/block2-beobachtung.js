(() => {
  'use strict';

  const API_NAME = 'V4Block2Beobachtung';
  const VERSION = '1.2.0';
  const STANDARD_INTERVALL_MS = 10000;
  const STANDARD_DAUER_MS = 30 * 60 * 1000;
  const STANDARD_BERICHT_MS = 5 * 60 * 1000;
  const TIMER_AKTUALISIERUNG_MS = 250;
  const MAX_FEHLER = 50;

  function holeFenster() {
    try {
      if (typeof parent !== 'undefined' && parent && parent !== globalThis) return parent;
    } catch {
      // Fallback folgt.
    }
    return globalThis;
  }

  function holeDokument() {
    try {
      const fenster = holeFenster();
      if (fenster?.document) return fenster.document;
    } catch {
      // Fallback folgt.
    }
    try {
      return document;
    } catch {
      return null;
    }
  }

  function holeTestkonsole() {
    const fenster = holeFenster();
    return fenster.V4Testkonsole ?? globalThis.V4Testkonsole ?? null;
  }

  const zustand = {
    laeuft: false,
    gestartetAm: null,
    beendetAm: null,
    proben: 0,
    fehler: 0,
    maxEntities: 0,
    maxMonster: 0,
    groessteProbeZeichen: 0,
    letzteProbeAm: null,
    letzteFehler: []
  };

  let intervallKennung = null;
  let endeKennung = null;
  let berichtKennung = null;
  let timerKennung = null;
  let endetUmMs = null;

  function formatiereRestzeit(restMs) {
    const gesamtSekunden = Math.max(0, Math.ceil(restMs / 1000));
    const stunden = Math.floor(gesamtSekunden / 3600);
    const minuten = Math.floor((gesamtSekunden % 3600) / 60);
    const sekunden = gesamtSekunden % 60;
    if (stunden > 0) {
      return `${String(stunden).padStart(2, '0')}:${String(minuten).padStart(2, '0')}:${String(sekunden).padStart(2, '0')}`;
    }
    return `${String(minuten).padStart(2, '0')}:${String(sekunden).padStart(2, '0')}`;
  }

  function holeTimerElement() {
    const dokument = holeDokument();
    const kopf = dokument?.querySelector('#v4-adventure-land-testkonsole .v4tk-kopf > div:first-child');
    if (!kopf) return null;

    let element = kopf.querySelector('[data-v4-testtimer="block2"]');
    if (!element) {
      element = dokument.createElement('span');
      element.setAttribute('data-v4-testtimer', 'block2');
      element.style.marginLeft = '10px';
      element.style.fontSize = '12px';
      element.style.fontWeight = '700';
      element.style.fontVariantNumeric = 'tabular-nums';
      element.style.whiteSpace = 'nowrap';
      element.style.opacity = '0.9';
      kopf.appendChild(element);
    }
    return element;
  }

  function aktualisiereTitelTimer(status = null) {
    const element = holeTimerElement();
    if (!element) return;

    if (status) {
      element.textContent = status;
      element.title = status;
      return;
    }

    if (zustand.laeuft && Number.isFinite(endetUmMs)) {
      const restzeit = formatiereRestzeit(endetUmMs - Date.now());
      const text = `Block 2 · Restzeit ${restzeit}`;
      element.textContent = text;
      element.title = `Verbleibende Zeit des laufenden Block-2-Beobachtungstests: ${restzeit}`;
      return;
    }

    element.textContent = `Block 2 · bereit · ${formatiereRestzeit(STANDARD_DAUER_MS)}`;
    element.title = 'Block-2-Beobachtung ist bereit.';
  }

  function starteTitelTimer() {
    if (timerKennung !== null) clearInterval(timerKennung);
    aktualisiereTitelTimer();
    timerKennung = setInterval(aktualisiereTitelTimer, TIMER_AKTUALISIERUNG_MS);
  }

  function stoppeTitelTimer(status) {
    if (timerKennung !== null) clearInterval(timerKennung);
    timerKennung = null;
    aktualisiereTitelTimer(status);
  }

  function merkeFehler(fehler) {
    zustand.fehler += 1;
    zustand.letzteFehler.push({
      zeitpunkt: new Date().toISOString(),
      meldung: fehler instanceof Error ? fehler.message : String(fehler)
    });
    while (zustand.letzteFehler.length > MAX_FEHLER) zustand.letzteFehler.shift();
  }

  function pruefeProbe(probe) {
    if (!probe || typeof probe !== 'object') throw new Error('Block-2-Rohdaten sind kein Objekt.');
    if (!probe.server || typeof probe.server !== 'object') throw new Error('Serverdaten fehlen.');
    if (!('charakter' in probe)) throw new Error('Charakterfeld fehlt.');
    if (!('entities' in probe)) throw new Error('Entities-Feld fehlt.');
    if (!('monster' in probe)) throw new Error('Monster-Feld fehlt.');
    if (!('karte' in probe)) throw new Error('Kartenfeld fehlt.');
  }

  function nehmeProbe() {
    const testkonsole = holeTestkonsole();
    if (!testkonsole?.block2Rohdaten) {
      merkeFehler(new Error('V4Testkonsole.block2Rohdaten() ist nicht verfuegbar.'));
      return;
    }

    try {
      const probe = testkonsole.block2Rohdaten();
      pruefeProbe(probe);
      const text = JSON.stringify(probe);
      zustand.proben += 1;
      zustand.letzteProbeAm = new Date().toISOString();
      zustand.maxEntities = Math.max(zustand.maxEntities, Number(probe.entities?.anzahl ?? 0));
      zustand.maxMonster = Math.max(zustand.maxMonster, Number(probe.monster?.anzahl ?? 0));
      zustand.groessteProbeZeichen = Math.max(zustand.groessteProbeZeichen, text.length);
    } catch (fehler) {
      merkeFehler(fehler);
    }
  }

  function bericht() {
    return {
      version: VERSION,
      readOnly: true,
      laeuft: zustand.laeuft,
      gestartetAm: zustand.gestartetAm,
      beendetAm: zustand.beendetAm,
      proben: zustand.proben,
      fehler: zustand.fehler,
      maxEntities: zustand.maxEntities,
      maxMonster: zustand.maxMonster,
      groessteProbeZeichen: zustand.groessteProbeZeichen,
      letzteProbeAm: zustand.letzteProbeAm,
      letzteFehler: [...zustand.letzteFehler]
    };
  }

  function zeigeBericht(titel = 'Block-2-Beobachtungsbericht') {
    const testkonsole = holeTestkonsole();
    if (testkonsole?.ausgeben) testkonsole.ausgeben(bericht(), titel);
    return bericht();
  }

  function stoppe() {
    if (intervallKennung !== null) clearInterval(intervallKennung);
    if (endeKennung !== null) clearTimeout(endeKennung);
    if (berichtKennung !== null) clearInterval(berichtKennung);
    intervallKennung = null;
    endeKennung = null;
    berichtKennung = null;
    endetUmMs = null;

    if (zustand.laeuft) {
      zustand.laeuft = false;
      zustand.beendetAm = new Date().toISOString();
      stoppeTitelTimer('Block 2 · beendet');
      zeigeBericht('Block-2-Beobachtung beendet');
    } else {
      stoppeTitelTimer('Block 2 · bereit');
    }
    return bericht();
  }

  function starte({
    intervallMs = STANDARD_INTERVALL_MS,
    dauerMs = STANDARD_DAUER_MS,
    berichtAlleMs = STANDARD_BERICHT_MS
  } = {}) {
    if (zustand.laeuft) return bericht();
    if (!Number.isFinite(intervallMs) || intervallMs < 1000) throw new Error('intervallMs muss mindestens 1000 sein.');
    if (!Number.isFinite(dauerMs) || dauerMs <= 0) throw new Error('dauerMs muss groesser als 0 sein.');
    if (!Number.isFinite(berichtAlleMs) || berichtAlleMs < intervallMs) throw new Error('berichtAlleMs muss mindestens so gross wie intervallMs sein.');
    if (!holeTestkonsole()?.block2Rohdaten) throw new Error('Zuerst die V4-Testkonsole starten.');

    zustand.laeuft = true;
    zustand.gestartetAm = new Date().toISOString();
    zustand.beendetAm = null;
    zustand.proben = 0;
    zustand.fehler = 0;
    zustand.maxEntities = 0;
    zustand.maxMonster = 0;
    zustand.groessteProbeZeichen = 0;
    zustand.letzteProbeAm = null;
    zustand.letzteFehler.length = 0;
    endetUmMs = Date.now() + dauerMs;

    nehmeProbe();
    starteTitelTimer();
    intervallKennung = setInterval(nehmeProbe, intervallMs);
    berichtKennung = setInterval(() => zeigeBericht('Block-2-Beobachtung Zwischenstand'), berichtAlleMs);
    endeKennung = setTimeout(stoppe, dauerMs);
    zeigeBericht('Block-2-Beobachtung gestartet');
    return bericht();
  }

  const api = { version: VERSION, starte, stoppe, bericht, zeigeBericht };
  globalThis[API_NAME] = api;
  try { holeFenster()[API_NAME] = api; } catch { /* lokale API bleibt nutzbar */ }

  aktualisiereTitelTimer();

  const testkonsole = holeTestkonsole();
  if (testkonsole?.ausgeben) {
    testkonsole.ausgeben({
      version: VERSION,
      readOnly: true,
      standardDauerMinuten: STANDARD_DAUER_MS / 60000,
      standardIntervallSekunden: STANDARD_INTERVALL_MS / 1000,
      timerInTitelleiste: true,
      startBefehl: 'V4Block2Beobachtung.starte()'
    }, 'Block-2-Beobachtung bereit');
  }
})();
