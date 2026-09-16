(() => {
  'use strict';

  const API_NAME = 'V4Block6Kompaktbericht';
  const VERSION = '1.0.0';

  function holeElternFenster() {
    try {
      if (typeof parent !== 'undefined' && parent && parent !== globalThis) return parent;
    } catch {
      // Fallback auf aktuellen Kontext.
    }
    return null;
  }

  function holeSchattenApi() {
    const api = globalThis.V4Block6SchattenRanger ?? holeElternFenster()?.V4Block6SchattenRanger;
    if (!api || typeof api.ergebnis !== 'function') {
      throw new Error('Zuerst v4/werkzeuge/block6-schattenlauf-ranger.js laden.');
    }
    return api;
  }

  function kompakt(bericht) {
    if (!bericht) return null;
    return Object.freeze({
      schemaVersion: bericht.schemaVersion ?? 1,
      werkzeug: bericht.werkzeug ?? 'V4Block6SchattenRanger',
      version: bericht.version ?? null,
      status: bericht.status ?? null,
      grund: bericht.grund ?? null,
      modus: bericht.modus ?? null,
      charakterKlasse: bericht.charakterKlasse ?? null,
      gestartetAm: bericht.gestartetAm ?? null,
      beendetAm: bericht.beendetAm ?? null,
      dauerMillisekunden: bericht.dauerMillisekunden ?? null,
      vorgesehenMillisekunden: bericht.vorgesehenMillisekunden ?? null,
      konfiguration: bericht.konfiguration ?? null,
      anzahlSchritte: bericht.anzahlSchritte ?? 0,
      aktionsZaehler: Object.freeze({ ...(bericht.aktionsZaehler ?? {}) }),
      meldungsZaehler: Object.freeze({ ...(bericht.meldungsZaehler ?? {}) }),
      stillstaende: bericht.stillstaende ?? 0,
      fehler: Object.freeze([...(bericht.fehler ?? [])]),
      verloreneEreignisse: bericht.verloreneEreignisse ?? 0,
      start: bericht.start ?? null,
      ende: bericht.ende ?? null,
      delta: bericht.delta ?? null,
      sicherheit: bericht.sicherheit ?? null
    });
  }

  const schatten = holeSchattenApi();
  const erweitert = Object.freeze({
    ...schatten,
    kompaktErgebnis() {
      return kompakt(schatten.ergebnis());
    }
  });

  globalThis.V4Block6SchattenRanger = erweitert;
  try {
    const elternFenster = holeElternFenster();
    if (elternFenster) elternFenster.V4Block6SchattenRanger = erweitert;
  } catch {
    // Lokale API bleibt verfuegbar.
  }

  const api = Object.freeze({
    version: VERSION,
    ausBericht: kompakt,
    ergebnis() {
      return kompakt(erweitert.ergebnis());
    }
  });
  globalThis[API_NAME] = api;
  try {
    const elternFenster = holeElternFenster();
    if (elternFenster) elternFenster[API_NAME] = api;
  } catch {
    // Lokale API bleibt verfuegbar.
  }

  const konsole = globalThis.V4Testkonsole ?? holeElternFenster()?.V4Testkonsole;
  if (konsole?.ausgeben) {
    konsole.ausgeben({
      version: VERSION,
      befehl: 'V4Block6SchattenRanger.kompaktErgebnis()',
      hinweis: 'Der Kompaktbericht laesst die umfangreiche Ereignisliste und Zielzaehler bewusst weg.'
    }, 'Block-6-Kompaktbericht bereit');
  }
})();
