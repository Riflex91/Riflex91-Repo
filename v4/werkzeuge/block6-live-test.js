(() => {
  'use strict';

  const API_NAME = 'V4Block6LiveTest';
  const KONSOLE_ID = 'v4-adventure-land-testkonsole';
  const STANDARD_SCHATTEN_DAUER = 24 * 60 * 60 * 1000;
  const STANDARD_AKTIV_DAUER = 15 * 60 * 1000;
  let lauf = null;

  function holeElternFenster() {
    try {
      if (typeof parent !== 'undefined' && parent && parent !== globalThis) return parent;
    } catch {
      // Fallback auf aktuellen Kontext.
    }
    return null;
  }

  function holeSpielDokument() {
    const elternFenster = holeElternFenster();
    try {
      if (elternFenster?.document?.body) return elternFenster.document;
    } catch {
      // Fallback auf aktuellen Kontext.
    }
    return document;
  }

  function holeKonsole() {
    const api = globalThis.V4Testkonsole ?? holeElternFenster()?.V4Testkonsole;
    if (!api) throw new Error('Zuerst v4/werkzeuge/adventure-land-testkonsole.js laden.');
    return api;
  }

  function holeTitelElement() {
    const element = holeSpielDokument().getElementById(KONSOLE_ID)?.querySelector('.v4tk-titel');
    if (!element) throw new Error('Die Titelleiste der V4-Testkonsole wurde nicht gefunden.');
    return element;
  }

  function formatiereRestzeit(restMillisekunden) {
    const gesamtSekunden = Math.max(0, Math.ceil(restMillisekunden / 1000));
    const stunden = Math.floor(gesamtSekunden / 3600);
    const minuten = Math.floor((gesamtSekunden % 3600) / 60);
    const sekunden = gesamtSekunden % 60;
    if (stunden > 0) return `${String(stunden).padStart(2, '0')}:${String(minuten).padStart(2, '0')}:${String(sekunden).padStart(2, '0')}`;
    return `${String(minuten).padStart(2, '0')}:${String(sekunden).padStart(2, '0')}`;
  }

  function beende(status, grund) {
    if (!lauf) return false;
    clearInterval(lauf.intervalKennung);
    const abgeschlossen = {
      modus: lauf.modus,
      gestartetAm: lauf.gestartetAm,
      vorgesehenBis: lauf.vorgesehenBis,
      beendetAm: Date.now(),
      status,
      grund
    };
    lauf = null;
    const titel = holeTitelElement();
    titel.textContent = `Block 6 · ${status === 'abgeschlossen' ? 'beendet' : 'gestoppt'}`;
    holeKonsole().ausgeben(abgeschlossen, `Block 6 ${status}`);
    return true;
  }

  function aktualisiereTitel() {
    if (!lauf) return;
    const rest = lauf.vorgesehenBis - Date.now();
    const titel = holeTitelElement();
    titel.textContent = `Block 6 · Restzeit ${formatiereRestzeit(rest)}`;
    if (rest <= 0) beende('abgeschlossen', 'Die vorgegebene Testdauer ist abgelaufen.');
  }

  function starte(modus, dauerMillisekunden) {
    if (lauf) throw new Error('Es laeuft bereits ein Block-6-Zeittest.');
    if (modus !== 'schatten' && modus !== 'aktiv') throw new Error('modus muss schatten oder aktiv sein.');
    if (!Number.isFinite(dauerMillisekunden) || dauerMillisekunden <= 0) throw new Error('dauerMillisekunden muss positiv und endlich sein.');
    const gestartetAm = Date.now();
    lauf = {
      modus,
      gestartetAm,
      vorgesehenBis: gestartetAm + dauerMillisekunden,
      intervalKennung: null
    };
    lauf.intervalKennung = setInterval(aktualisiereTitel, 1000);
    aktualisiereTitel();
    holeKonsole().ausgeben({
      modus,
      dauerMillisekunden,
      gestartetAm,
      hinweis: 'Dieser Timer zeigt nur die Testdauer an und steuert keine Farmaktion.'
    }, `Block 6 ${modus}-Zeittest gestartet`);
    return status();
  }

  function status() {
    if (!lauf) return Object.freeze({ laeuft: false });
    return Object.freeze({
      laeuft: true,
      modus: lauf.modus,
      gestartetAm: lauf.gestartetAm,
      vorgesehenBis: lauf.vorgesehenBis,
      restMillisekunden: Math.max(0, lauf.vorgesehenBis - Date.now())
    });
  }

  const api = Object.freeze({
    starteSchatten24h() {
      return starte('schatten', STANDARD_SCHATTEN_DAUER);
    },
    starteAktivBegrenzt(dauerMillisekunden = STANDARD_AKTIV_DAUER) {
      return starte('aktiv', dauerMillisekunden);
    },
    stoppe(grund = 'Manuell gestoppt.') {
      if (typeof grund !== 'string' || grund.trim().length === 0) throw new Error('Ein manueller Stopp benoetigt einen Grund.');
      return beende('gestoppt', grund);
    },
    status
  });

  globalThis[API_NAME] = api;
  try {
    const elternFenster = holeElternFenster();
    if (elternFenster) elternFenster[API_NAME] = api;
  } catch {
    // Lokale API bleibt verfuegbar.
  }

  holeKonsole().ausgeben({
    schatten: 'V4Block6LiveTest.starteSchatten24h()',
    aktiv: 'V4Block6LiveTest.starteAktivBegrenzt()',
    stop: 'V4Block6LiveTest.stoppe("Grund")',
    regel: 'Der Timer beeinflusst den Testablauf nicht.'
  }, 'Block-6-Zeittest bereit');
})();
