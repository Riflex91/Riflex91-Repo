/* GENERATED: V4 Block 8.5.9 separates 10-Minuten-Soak-Komplettpaket.
 * Quelle: block8-5-soak-paket-bauen.mjs
 * Bindet den real bestandenen Schatten- und kontrollierten Live-Nachweis.
 * Der Launcher ruft keine Adventure-Land-Spielaktionsfunktion direkt auf; die aktive Produktionsruntime sendet Heartbeats.
 */
(() => {
  'use strict';

  const belegteNamen = [
    'AIO_V4_RUNTIME_CONFIG',
    'AIO_V4_BOOTSTRAP_CONFIG',
    'AIO_V4_BLOCK85_SOAK_CONFIG',
    'V4ProduktionsLaufzeit',
    'V4Bootstrap',
    'V4TestGui',
    'V4Block85SoakLauncher'
  ].filter((name) => globalThis[name] !== undefined);
  if (belegteNamen.length > 0) {
    throw new Error(
      'Block-8.5-Soakpaket verlangt einen frischen Codekontext; bereits vorhanden: ' +
      belegteNamen.join(', ')
    );
  }

  function setzeGlobal(name, wert) {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      enumerable: true,
      writable: false,
      value: wert
    });
  }

  setzeGlobal('AIO_V4_RUNTIME_CONFIG', Object.freeze({
    aktivFreigegeben: true,
    ablaufKennung: 'block8-5-soak-block8-5-schatten-1789775266269',
    vertrauensNamen: Object.freeze(['My_Ranger1', 'My_Ranger2']),
    faehigkeiten: Object.freeze({
      heilen: 0,
      schaden: 1,
      aggro: 0,
      schutz: 0,
      unterstuetzung: 0
    })
  }));
  setzeGlobal('AIO_V4_BOOTSTRAP_CONFIG', Object.freeze({
    runtimeUrl: 'https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/88185523c81687dc16f9647ca5e7568c5e2c228c/aio-v4-runtime.js',
    runtimeSha256: '95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f'
  }));
  setzeGlobal('AIO_V4_BLOCK85_SOAK_CONFIG', Object.freeze({
    aenderungsKennung: 'git:88185523c81687dc16f9647ca5e7568c5e2c228c',
    laufKennung: 'block8-5-schatten-1789775266269',
    soakDauerMillisekunden: 600000,
    sampleMillisekunden: 5000,
    schattenUebergabe: Object.freeze({
        "schemaVersion": 1,
        "laufzeitPfadKennung": "block8.5-basisbedienung-runtime",
        "aenderungsKennung": "git:88185523c81687dc16f9647ca5e7568c5e2c228c",
        "laufKennung": "block8-5-schatten-1789775266269",
        "runtimeVersion": "1.1.5",
        "runtimeSha256": "95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f",
        "runtimeUrl": "https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/88185523c81687dc16f9647ca5e7568c5e2c228c/aio-v4-runtime.js",
        "betriebsart": "gesperrt_nicht_gestartet",
        "generation": 0,
        "heartbeatVersuche": 0,
        "heartbeatErfolge": 0,
        "heartbeatFehler": 0,
        "nachweis": {
            "schemaVersion": 1,
            "laufzeitPfadKennung": "block8.5-basisbedienung-runtime",
            "aenderungsKennung": "git:88185523c81687dc16f9647ca5e7568c5e2c228c",
            "stufe": "schatten",
            "nachweisKennung": "block8-5-schatten-1789775266269:schatten",
            "ergebnis": "bestanden",
            "durchgefuehrtAm": 1789775267498,
            "deterministisch": false,
            "spielAktionAusgefuehrt": false,
            "begrenzt": false,
            "telemetrieNachweis": false,
            "recoveryNachweis": false,
            "gesamtauswertungBestanden": false
        }
    }),
    liveUebergabe: Object.freeze({
        "schemaVersion": 1,
        "laufzeitPfadKennung": "block8.5-basisbedienung-runtime",
        "aenderungsKennung": "git:88185523c81687dc16f9647ca5e7568c5e2c228c",
        "laufKennung": "block8-5-schatten-1789775266269",
        "runtimeVersion": "1.1.5",
        "runtimeSha256": "95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f",
        "runtimeUrl": "https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/88185523c81687dc16f9647ca5e7568c5e2c228c/aio-v4-runtime.js",
        "generationVorher": 0,
        "generationNachPause": 1,
        "generationNachFortsetzen": 2,
        "heartbeatErfolgePreflight": 1,
        "heartbeatFehlerPreflight": 0,
        "pauseStatus": "ausgefuehrt",
        "fortsetzenStatus": "ausgefuehrt",
        "nachweis": {
            "schemaVersion": 1,
            "laufzeitPfadKennung": "block8.5-basisbedienung-runtime",
            "aenderungsKennung": "git:88185523c81687dc16f9647ca5e7568c5e2c228c",
            "stufe": "kontrolliert_live",
            "nachweisKennung": "block8-5-schatten-1789775266269:kontrolliert_live",
            "ergebnis": "bestanden",
            "durchgefuehrtAm": 1789776285337,
            "deterministisch": false,
            "spielAktionAusgefuehrt": true,
            "begrenzt": true,
            "telemetrieNachweis": false,
            "recoveryNachweis": false,
            "gesamtauswertungBestanden": false
        }
    })
  }));
})();

/* ===== BEGIN werkzeuge/adventure-land-v4-bootstrap.js ===== */
(() => {
  'use strict';

  const API_NAME = 'V4Bootstrap';
  const VERSION = '1.0.0';
  const RUNTIME_MARKER = 'Adventure Land AiO Bot V4 | generated | production runtime';
  const MIN_RUNTIME_BYTES = 10_000;
  const MAX_RUNTIME_BYTES = 8 * 1024 * 1024;

  let ladeVersuch = false;
  let letzterFehler = null;
  let geladenVon = null;
  let geladenerSha256 = null;

  function config() {
    const wert = globalThis.AIO_V4_BOOTSTRAP_CONFIG;
    return wert && typeof wert === 'object' ? wert : {};
  }

  function runtimeUrl() {
    const wert = config().runtimeUrl;
    return typeof wert === 'string' && wert.trim().length > 0 ? wert.trim() : null;
  }

  function runtimeSha256() {
    const wert = config().runtimeSha256;
    if (typeof wert !== 'string') return null;
    const normalisiert = wert.trim().toLowerCase();
    return /^[a-f0-9]{64}$/.test(normalisiert) ? normalisiert : null;
  }

  async function berechneSha256(code) {
    if (!globalThis.crypto?.subtle || typeof globalThis.TextEncoder !== 'function') {
      throw new Error('Web-Crypto oder TextEncoder ist fuer die V4-Runtime-Hashpruefung nicht verfuegbar.');
    }
    const bytes = new globalThis.TextEncoder().encode(code);
    const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), (wert) => wert.toString(16).padStart(2, '0')).join('');
  }

  function status() {
    const laufzeit = globalThis.V4ProduktionsLaufzeit;
    return Object.freeze({
      schemaVersion: 1,
      werkzeug: API_NAME,
      version: VERSION,
      runtimeUrlKonfiguriert: runtimeUrl() !== null,
      runtimeSha256Konfiguriert: runtimeSha256() !== null,
      ladeVersuch,
      bereit: Boolean(laufzeit && typeof laufzeit.status === 'function'),
      geladenVon,
      geladenerSha256,
      letzterFehler
    });
  }

  async function lade() {
    if (ladeVersuch) throw new Error('Der V4-Bootstrap hat seinen Ladeversuch bereits verbraucht.');
    if (globalThis.V4ProduktionsLaufzeit !== undefined) {
      throw new Error('V4ProduktionsLaufzeit ist bereits vorhanden; Bootstrap ueberschreibt keine bestehende Runtime.');
    }
    const url = runtimeUrl();
    if (url === null) throw new Error('AIO_V4_BOOTSTRAP_CONFIG.runtimeUrl fehlt; Produktionsruntime bleibt gesperrt.');
    if (!/^https:\/\//i.test(url)) throw new Error('AIO_V4_BOOTSTRAP_CONFIG.runtimeUrl muss eine explizite HTTPS-URL sein.');
    const erwarteterSha256 = runtimeSha256();
    if (erwarteterSha256 === null) {
      throw new Error('AIO_V4_BOOTSTRAP_CONFIG.runtimeSha256 fehlt oder ist kein gueltiger SHA-256.');
    }
    if (typeof globalThis.fetch !== 'function') throw new Error('fetch ist im Adventure-Land-Codekontext nicht verfuegbar.');

    ladeVersuch = true;
    letzterFehler = null;
    geladenVon = null;
    geladenerSha256 = null;

    try {
      const response = await globalThis.fetch(url, { cache: 'no-store' });
      if (!response || response.ok !== true) throw new Error(`Runtime-Download fehlgeschlagen: HTTP ${String(response?.status ?? 'unbekannt')}.`);
      const code = String(await response.text());
      if (code.length < MIN_RUNTIME_BYTES) throw new Error('Geladene V4-Produktionsruntime ist unerwartet klein.');
      if (code.length > MAX_RUNTIME_BYTES) throw new Error('Geladene V4-Produktionsruntime ist unerwartet gross.');
      if (!code.includes(RUNTIME_MARKER)) throw new Error('Geladene Datei besitzt nicht den erwarteten V4-Produktionsruntime-Marker.');
      const tatsaechlicherSha256 = await berechneSha256(code);
      if (tatsaechlicherSha256 !== erwarteterSha256) {
        throw new Error(`SHA-256 der geladenen V4-Produktionsruntime stimmt nicht: ${tatsaechlicherSha256}.`);
      }

      (0, eval)(code);

      const laufzeit = globalThis.V4ProduktionsLaufzeit;
      if (!laufzeit || typeof laufzeit.status !== 'function' || typeof laufzeit.stoppe !== 'function') {
        throw new Error('Geladene V4-Produktionsruntime hat ihre feste globale API nicht installiert.');
      }
      geladenVon = url;
      geladenerSha256 = erwarteterSha256;
      return status();
    } catch (fehler) {
      letzterFehler = fehler instanceof Error ? fehler.message : String(fehler);
      throw fehler;
    }
  }

  const api = Object.freeze({
    version: VERSION,
    status,
    lade
  });

  if (globalThis[API_NAME] !== undefined) {
    throw new Error(`${API_NAME} ist bereits im Codekontext vorhanden.`);
  }
  Object.defineProperty(globalThis, API_NAME, {
    configurable: true,
    enumerable: true,
    writable: false,
    value: api
  });
})();
/* ===== END werkzeuge/adventure-land-v4-bootstrap.js ===== */

/* ===== BEGIN werkzeuge/adventure-land-test-gui.js ===== */
(() => {
  'use strict';

  const API_NAME = 'V4TestGui';
  const VERSION = '1.0.0';
  const STIL_ID = 'v4-test-gui-stil';
  const STATUS = Object.freeze(['bereit', 'laeuft', 'pass', 'fail', 'warn', 'info']);

  function holeElternFenster() {
    try {
      if (typeof parent !== 'undefined' && parent && parent !== globalThis) return parent;
    } catch {
      // Lokaler Kontext bleibt Fallback.
    }
    return null;
  }

  function holeDokument() {
    const eltern = holeElternFenster();
    try {
      if (eltern?.document?.body) return eltern.document;
    } catch {
      // Lokales Dokument bleibt Fallback.
    }
    if (typeof document !== 'undefined' && document?.body) return document;
    throw new Error('Fuer die V4-Test-GUI ist kein nutzbares Dokument verfuegbar.');
  }

  function sichereKennung(wert) {
    return String(wert ?? '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'test';
  }

  function fehlerText(fehler) {
    return fehler instanceof Error ? fehler.message : String(fehler);
  }

  function begrenzeWert(wert, tiefe = 0, gesehen = new WeakSet()) {
    if (wert === null || wert === undefined || typeof wert === 'string' || typeof wert === 'number' || typeof wert === 'boolean') {
      return wert ?? null;
    }
    if (typeof wert === 'bigint') return `${wert.toString()}n`;
    if (typeof wert === 'function') return `[Funktion ${wert.name || 'anonym'}]`;
    if (typeof wert !== 'object') return String(wert);
    if (wert instanceof Error) return { name: wert.name, meldung: wert.message, stapel: wert.stack ?? null };
    if (gesehen.has(wert)) return '[Zirkulaere Referenz]';
    if (tiefe >= 6) return '[Maximale Tiefe erreicht]';
    gesehen.add(wert);
    if (Array.isArray(wert)) return wert.slice(0, 200).map((eintrag) => begrenzeWert(eintrag, tiefe + 1, gesehen));
    const ergebnis = {};
    let anzahl = 0;
    for (const name of Object.keys(wert)) {
      anzahl += 1;
      if (anzahl > 500) {
        ergebnis['[abgeschnitten]'] = true;
        break;
      }
      try {
        ergebnis[name] = begrenzeWert(wert[name], tiefe + 1, gesehen);
      } catch (fehler) {
        ergebnis[name] = `[Lesefehler: ${fehlerText(fehler)}]`;
      }
    }
    return ergebnis;
  }

  function formatiereWert(wert) {
    try {
      return JSON.stringify(begrenzeWert(wert), null, 2);
    } catch {
      return String(wert);
    }
  }

  async function kopiereText(dokument, text) {
    const eltern = holeElternFenster();
    try {
      const navigatorObjekt = eltern?.navigator ?? globalThis.navigator;
      if (navigatorObjekt?.clipboard?.writeText) {
        await navigatorObjekt.clipboard.writeText(text);
        return true;
      }
    } catch {
      // Fallback folgt.
    }

    const feld = dokument.createElement('textarea');
    feld.value = text;
    feld.setAttribute('readonly', '');
    feld.style.position = 'fixed';
    feld.style.left = '-10000px';
    feld.style.top = '0';
    dokument.body.appendChild(feld);
    feld.select();
    let ok = false;
    try {
      ok = dokument.execCommand('copy');
    } finally {
      feld.remove();
    }
    return ok;
  }

  function installiereStil(dokument) {
    if (dokument.getElementById(STIL_ID)) return;
    const stil = dokument.createElement('style');
    stil.id = STIL_ID;
    stil.textContent = `
      .v4tg{position:fixed;right:14px;top:14px;z-index:2147483647;width:min(560px,calc(100vw - 28px));max-height:90vh;display:flex;flex-direction:column;overflow:hidden;border:1px solid rgba(255,255,255,.18);border-radius:12px;background:rgba(14,17,23,.98);color:#eef4ff;box-shadow:0 14px 44px rgba(0,0,0,.55);font:13px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      .v4tg *{box-sizing:border-box}.v4tg button,.v4tg input,.v4tg textarea{font:inherit}.v4tg-kopf{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.11);background:rgba(255,255,255,.04)}.v4tg-titel{font-weight:750;flex:1;min-width:0}.v4tg-version{opacity:.55;font-size:11px}.v4tg-status{padding:3px 8px;border-radius:999px;font-size:11px;font-weight:750;text-transform:uppercase;background:rgba(255,255,255,.10)}.v4tg-status[data-status="pass"]{background:rgba(55,200,110,.22);color:#9ff0bb}.v4tg-status[data-status="fail"]{background:rgba(255,82,82,.22);color:#ffb1b1}.v4tg-status[data-status="warn"]{background:rgba(255,184,60,.22);color:#ffe0a3}.v4tg-status[data-status="laeuft"]{background:rgba(75,150,255,.22);color:#b7d6ff}
      .v4tg-inhalt{overflow:auto;padding:10px 12px}.v4tg-beschreibung{margin:0 0 10px;color:#c7d2e3}.v4tg-status-text{padding:8px 9px;margin-bottom:10px;border-radius:7px;background:rgba(255,255,255,.05);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}.v4tg-aktionen{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:10px}.v4tg button{border:1px solid rgba(255,255,255,.16);border-radius:7px;padding:7px 10px;background:rgba(255,255,255,.08);color:inherit;cursor:pointer}.v4tg button:hover:not(:disabled){background:rgba(255,255,255,.15)}.v4tg button:disabled{opacity:.38;cursor:not-allowed}.v4tg button[data-art="primaer"]{background:rgba(73,141,255,.25)}.v4tg button[data-art="gefahr"]{background:rgba(200,73,73,.22);border-color:rgba(255,100,100,.35)}
      .v4tg-bestaetigung{display:none;padding:9px;margin:0 0 10px;border:1px solid rgba(255,178,61,.30);border-radius:8px;background:rgba(255,178,61,.08)}.v4tg-bestaetigung.sichtbar{display:block}.v4tg-bestaetigung label{display:block;margin-bottom:5px;color:#ffe0a3}.v4tg-bestaetigung code{user-select:all}.v4tg-bestaetigung input{width:100%;padding:7px 8px;border:1px solid rgba(255,255,255,.18);border-radius:6px;background:rgba(0,0,0,.28);color:#fff}
      .v4tg-ergebnis-kopf,.v4tg-log-kopf{display:flex;align-items:center;gap:8px;margin:10px 0 5px}.v4tg-ergebnis-kopf strong,.v4tg-log-kopf strong{flex:1}.v4tg textarea{width:100%;min-height:160px;max-height:320px;resize:vertical;padding:9px;border:1px solid rgba(255,255,255,.15);border-radius:7px;background:rgba(0,0,0,.28);color:#eaf1ff;font:12px/1.45 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;white-space:pre}.v4tg-log{max-height:150px;overflow:auto;padding:8px;border:1px solid rgba(255,255,255,.10);border-radius:7px;background:rgba(0,0,0,.20);font:11px/1.45 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;white-space:pre-wrap;overflow-wrap:anywhere}.v4tg-fuss{display:flex;gap:7px;padding-top:10px}.v4tg-minimiert .v4tg-inhalt{display:none}
      @media(max-width:600px){.v4tg{right:6px;top:6px;width:calc(100vw - 12px);max-height:94vh}}
    `;
    dokument.head.appendChild(stil);
  }

  function erstelleTest(optionen = {}) {
    const dokument = holeDokument();
    installiereStil(dokument);
    const kennung = sichereKennung(optionen.kennung);
    const elementId = `v4-test-gui-${kennung}`;
    const bestehend = dokument.getElementById(elementId);
    if (bestehend) bestehend.remove();

    const zustand = {
      status: 'bereit',
      statusText: 'Bereit.',
      ergebnis: null,
      protokoll: [],
      aktionen: new Map()
    };

    const wurzel = dokument.createElement('section');
    wurzel.id = elementId;
    wurzel.className = 'v4tg';
    wurzel.setAttribute('aria-label', optionen.titel || 'V4 Test');
    wurzel.innerHTML = `
      <div class="v4tg-kopf">
        <div class="v4tg-titel"></div>
        <span class="v4tg-version">GUI v${VERSION}</span>
        <span class="v4tg-status" data-status="bereit">BEREIT</span>
        <button type="button" data-aktion="minimieren" title="Minimieren">–</button>
        <button type="button" data-aktion="schliessen" title="Schliessen">×</button>
      </div>
      <div class="v4tg-inhalt">
        <p class="v4tg-beschreibung"></p>
        <div class="v4tg-status-text">Bereit.</div>
        <div class="v4tg-aktionen"></div>
        <div class="v4tg-bestaetigung">
          <label>Zur Freigabe exakt eingeben: <code></code></label>
          <input type="text" autocomplete="off" spellcheck="false" aria-label="Bestaetigungstext">
        </div>
        <div class="v4tg-ergebnis-kopf"><strong>Ergebnis</strong><button type="button" data-aktion="ergebnis-kopieren">Ergebnis kopieren</button></div>
        <textarea class="v4tg-ergebnis" readonly spellcheck="false" aria-label="Kopierbares Testergebnis">Noch kein Ergebnis.</textarea>
        <div class="v4tg-log-kopf"><strong>Protokoll</strong><button type="button" data-aktion="bericht-kopieren">Gesamtbericht kopieren</button></div>
        <div class="v4tg-log">Noch kein Protokoll.</div>
        <div class="v4tg-fuss"><button type="button" data-aktion="protokoll-leeren">Protokoll leeren</button></div>
      </div>
    `;
    dokument.body.appendChild(wurzel);

    const titelElement = wurzel.querySelector('.v4tg-titel');
    const beschreibungElement = wurzel.querySelector('.v4tg-beschreibung');
    const statusElement = wurzel.querySelector('.v4tg-status');
    const statusTextElement = wurzel.querySelector('.v4tg-status-text');
    const aktionenElement = wurzel.querySelector('.v4tg-aktionen');
    const bestaetigungElement = wurzel.querySelector('.v4tg-bestaetigung');
    const bestaetigungCode = bestaetigungElement.querySelector('code');
    const bestaetigungInput = bestaetigungElement.querySelector('input');
    const ergebnisElement = wurzel.querySelector('.v4tg-ergebnis');
    const logElement = wurzel.querySelector('.v4tg-log');

    titelElement.textContent = optionen.titel || 'V4 Test';
    beschreibungElement.textContent = optionen.beschreibung || '';

    function zeit() {
      return new Date().toISOString();
    }

    function setzeStatus(status, text = '') {
      if (!STATUS.includes(status)) throw new Error(`Unbekannter V4-Test-GUI-Status: ${status}`);
      zustand.status = status;
      zustand.statusText = text || status;
      statusElement.dataset.status = status;
      statusElement.textContent = status.toUpperCase();
      statusTextElement.textContent = zustand.statusText;
      return status;
    }

    function protokolliere(text, wert) {
      const zeile = wert === undefined
        ? `[${zeit()}] ${String(text)}`
        : `[${zeit()}] ${String(text)}: ${typeof wert === 'string' ? wert : formatiereWert(wert)}`;
      zustand.protokoll.push(zeile);
      if (zustand.protokoll.length > 250) zustand.protokoll.shift();
      logElement.textContent = zustand.protokoll.join('\n\n');
      logElement.scrollTop = logElement.scrollHeight;
      return zeile;
    }

    function setzeErgebnis(wert, status = null, text = '') {
      zustand.ergebnis = begrenzeWert(wert);
      ergebnisElement.value = formatiereWert(zustand.ergebnis);
      if (status !== null) setzeStatus(status, text);
      return zustand.ergebnis;
    }

    function berichtText() {
      return [
        'V4 TESTBERICHT',
        `Test: ${optionen.titel || kennung}`,
        `Kennung: ${kennung}`,
        `GUI-Version: ${VERSION}`,
        `Status: ${zustand.status.toUpperCase()}`,
        `Status-Text: ${zustand.statusText}`,
        `Erstellt: ${zeit()}`,
        '',
        '=== ERGEBNIS ===',
        ergebnisElement.value,
        '',
        '=== PROTOKOLL ===',
        zustand.protokoll.length > 0 ? zustand.protokoll.join('\n\n') : 'Kein Protokoll.'
      ].join('\n');
    }

    function setzeBestaetigung(text) {
      const wert = typeof text === 'string' && text.length > 0 ? text : null;
      if (wert === null) {
        bestaetigungElement.classList.remove('sichtbar');
        bestaetigungCode.textContent = '';
        bestaetigungInput.value = '';
        return;
      }
      bestaetigungCode.textContent = wert;
      bestaetigungElement.classList.add('sichtbar');
      bestaetigungInput.value = '';
      bestaetigungInput.focus();
    }

    function registriereAktion(aktion) {
      if (!aktion || typeof aktion !== 'object') throw new Error('V4-Test-GUI-Aktion muss ein Objekt sein.');
      const aktionsKennung = sichereKennung(aktion.kennung);
      if (zustand.aktionen.has(aktionsKennung)) throw new Error(`V4-Test-GUI-Aktion bereits vorhanden: ${aktionsKennung}`);
      if (typeof aktion.ausfuehren !== 'function') throw new Error(`V4-Test-GUI-Aktion ${aktionsKennung} benoetigt ausfuehren().`);

      const knopf = dokument.createElement('button');
      knopf.type = 'button';
      knopf.textContent = aktion.titel || aktionsKennung;
      knopf.dataset.art = aktion.art || 'normal';
      knopf.disabled = aktion.aktiviert === false;

      const datensatz = { ...aktion, kennung: aktionsKennung, knopf };
      zustand.aktionen.set(aktionsKennung, datensatz);

      knopf.addEventListener('click', async () => {
        if (knopf.disabled) return;
        const bestaetigungsText = typeof datensatz.bestaetigungsText === 'string' ? datensatz.bestaetigungsText : null;
        if (bestaetigungsText !== null && bestaetigungInput.value !== bestaetigungsText) {
          setzeBestaetigung(bestaetigungsText);
          setzeStatus('warn', 'Bestaetigungstext fehlt oder stimmt nicht exakt.');
          protokolliere(`Aktion ${aktionsKennung} blockiert: Bestaetigung fehlt.`);
          return;
        }

        knopf.disabled = true;
        setzeStatus('laeuft', `${datensatz.titel || aktionsKennung} laeuft ...`);
        protokolliere(`Aktion gestartet: ${datensatz.titel || aktionsKennung}`);
        try {
          const ergebnis = await datensatz.ausfuehren();
          protokolliere(`Aktion abgeschlossen: ${datensatz.titel || aktionsKennung}`);
          if (bestaetigungsText !== null) setzeBestaetigung(null);
          if (zustand.status === 'laeuft') setzeStatus('info', `${datensatz.titel || aktionsKennung} abgeschlossen.`);
          return ergebnis;
        } catch (fehler) {
          const meldung = fehlerText(fehler);
          setzeStatus('fail', meldung);
          protokolliere(`FEHLER ${datensatz.titel || aktionsKennung}`, meldung);
          setzeErgebnis({ status: 'fehlgeschlagen', fehler: meldung }, 'fail', meldung);
          return undefined;
        } finally {
          if (datensatz.einmalig !== true) knopf.disabled = false;
        }
      });

      aktionenElement.appendChild(knopf);
      return aktionsKennung;
    }

    function setzeAktionAktiv(aktionsKennung, aktiv) {
      const datensatz = zustand.aktionen.get(sichereKennung(aktionsKennung));
      if (!datensatz) return false;
      datensatz.knopf.disabled = aktiv !== true;
      return true;
    }

    async function kopiereErgebnis() {
      return kopiereText(dokument, ergebnisElement.value);
    }

    async function kopiereBericht() {
      return kopiereText(dokument, berichtText());
    }

    wurzel.querySelector('[data-aktion="ergebnis-kopieren"]').addEventListener('click', async (ereignis) => {
      const knopf = ereignis.currentTarget;
      const ok = await kopiereErgebnis();
      const alt = knopf.textContent;
      knopf.textContent = ok ? 'Kopiert' : 'Kopieren fehlgeschlagen';
      setTimeout(() => { knopf.textContent = alt; }, 1400);
    });
    wurzel.querySelector('[data-aktion="bericht-kopieren"]').addEventListener('click', async (ereignis) => {
      const knopf = ereignis.currentTarget;
      const ok = await kopiereBericht();
      const alt = knopf.textContent;
      knopf.textContent = ok ? 'Kopiert' : 'Kopieren fehlgeschlagen';
      setTimeout(() => { knopf.textContent = alt; }, 1400);
    });
    wurzel.querySelector('[data-aktion="protokoll-leeren"]').addEventListener('click', () => {
      zustand.protokoll.length = 0;
      logElement.textContent = 'Noch kein Protokoll.';
    });
    wurzel.querySelector('[data-aktion="minimieren"]').addEventListener('click', (ereignis) => {
      const minimiert = wurzel.classList.toggle('v4tg-minimiert');
      ereignis.currentTarget.textContent = minimiert ? '+' : '–';
    });
    wurzel.querySelector('[data-aktion="schliessen"]').addEventListener('click', () => {
      wurzel.style.display = 'none';
    });

    return Object.freeze({
      kennung,
      version: VERSION,
      setzeStatus,
      protokolliere,
      setzeErgebnis,
      registriereAktion,
      setzeAktionAktiv,
      setzeBestaetigung,
      berichtText,
      kopiereErgebnis,
      kopiereBericht,
      oeffnen() { wurzel.style.display = 'flex'; },
      schliessen() { wurzel.style.display = 'none'; },
      status() {
        return Object.freeze({
          status: zustand.status,
          statusText: zustand.statusText,
          ergebnis: zustand.ergebnis,
          protokollEintraege: zustand.protokoll.length,
          aktionen: Object.freeze([...zustand.aktionen.keys()])
        });
      }
    });
  }

  const api = Object.freeze({
    version: VERSION,
    erstelleTest,
    formatiereWert
  });

  if (globalThis[API_NAME] !== undefined) {
    throw new Error(`${API_NAME} ist bereits im Codekontext vorhanden.`);
  }

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
})();
/* ===== END werkzeuge/adventure-land-test-gui.js ===== */

/* ===== BEGIN separater Soak-Launcher ===== */
(() => {
  'use strict';

  const API_NAME = 'V4Block85SoakLauncher';
  const VERSION = '1.0.0';
  const PFAD = 'block8.5-basisbedienung-runtime';
  const AENDERUNG = 'git:88185523c81687dc16f9647ca5e7568c5e2c228c';
  const RUNTIME_VERSION = '1.1.5';
  const RUNTIME_SHA256 = '95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f';
  const RUNTIME_URL = 'https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/88185523c81687dc16f9647ca5e7568c5e2c228c/aio-v4-runtime.js';
  const cfg = globalThis.AIO_V4_BLOCK85_SOAK_CONFIG;
  const bootstrap = globalThis.V4Bootstrap;
  const gui = globalThis.V4TestGui;

  if (!cfg || !bootstrap || !gui) {
    throw new Error('Soakpaket konnte Konfiguration, Bootstrap oder Test-GUI nicht initialisieren.');
  }

  function pruefeNachweis(wert, stufe, optionen) {
    if (!wert || typeof wert !== 'object' || !wert.nachweis || typeof wert.nachweis !== 'object') {
      throw new Error(stufe + '-Uebergabe fehlt oder ist unvollstaendig.');
    }
    const nachweis = wert.nachweis;
    const erwartet = {
      schemaVersion: 1,
      laufzeitPfadKennung: PFAD,
      aenderungsKennung: AENDERUNG,
      laufKennung: cfg.laufKennung,
      runtimeVersion: RUNTIME_VERSION,
      runtimeSha256: RUNTIME_SHA256,
      runtimeUrl: RUNTIME_URL
    };
    for (const [name, erwartetWert] of Object.entries(erwartet)) {
      if (wert[name] !== erwartetWert) {
        throw new Error(stufe + '-Uebergabe besitzt unerwarteten Wert fuer ' + name + '.');
      }
    }
    for (const [name, erwartetWert] of Object.entries(optionen.nachweis)) {
      if (nachweis[name] !== erwartetWert) {
        throw new Error(stufe + '-Nachweis besitzt unerwarteten Wert fuer ' + name + '.');
      }
    }
    if (!Number.isFinite(nachweis.durchgefuehrtAm) || nachweis.durchgefuehrtAm < 0) {
      throw new Error(stufe + '-Nachweis besitzt ungueltigen Zeitpunkt.');
    }
    return nachweis;
  }

  const schattenNachweis = pruefeNachweis(cfg.schattenUebergabe, 'Schatten', {
    nachweis: {
      schemaVersion: 1,
      laufzeitPfadKennung: PFAD,
      aenderungsKennung: AENDERUNG,
      stufe: 'schatten',
      nachweisKennung: cfg.laufKennung + ':schatten',
      ergebnis: 'bestanden',
      deterministisch: false,
      spielAktionAusgefuehrt: false,
      begrenzt: false,
      telemetrieNachweis: false,
      recoveryNachweis: false,
      gesamtauswertungBestanden: false
    }
  });
  if (
    cfg.schattenUebergabe.betriebsart !== 'gesperrt_nicht_gestartet' ||
    cfg.schattenUebergabe.generation !== 0 ||
    cfg.schattenUebergabe.heartbeatVersuche !== 0 ||
    cfg.schattenUebergabe.heartbeatErfolge !== 0 ||
    cfg.schattenUebergabe.heartbeatFehler !== 0
  ) {
    throw new Error('Schatten-Uebergabe verletzt den strikten Null-Heartbeat-Nachweis.');
  }

  const liveNachweis = pruefeNachweis(cfg.liveUebergabe, 'Kontrolliert-live', {
    nachweis: {
      schemaVersion: 1,
      laufzeitPfadKennung: PFAD,
      aenderungsKennung: AENDERUNG,
      stufe: 'kontrolliert_live',
      nachweisKennung: cfg.laufKennung + ':kontrolliert_live',
      ergebnis: 'bestanden',
      deterministisch: false,
      spielAktionAusgefuehrt: true,
      begrenzt: true,
      telemetrieNachweis: false,
      recoveryNachweis: false,
      gesamtauswertungBestanden: false
    }
  });
  if (
    cfg.liveUebergabe.generationVorher !== 0 ||
    cfg.liveUebergabe.generationNachPause !== 1 ||
    cfg.liveUebergabe.generationNachFortsetzen !== 2 ||
    cfg.liveUebergabe.heartbeatErfolgePreflight < 1 ||
    cfg.liveUebergabe.heartbeatFehlerPreflight !== 0 ||
    cfg.liveUebergabe.pauseStatus !== 'ausgefuehrt' ||
    cfg.liveUebergabe.fortsetzenStatus !== 'ausgefuehrt'
  ) {
    throw new Error('Kontrolliert-live-Uebergabe bestaetigt den sicheren 0->1->2-Pause/Fortsetzen-Pfad nicht.');
  }
  if (liveNachweis.durchgefuehrtAm < schattenNachweis.durchgefuehrtAm) {
    throw new Error('Kontrolliert-live-Nachweis liegt zeitlich vor dem Schattennachweis.');
  }

  if (
    cfg.soakDauerMillisekunden !== 600000 ||
    cfg.sampleMillisekunden !== 5000
  ) {
    throw new Error('Soakpaket ist fest auf 600000 ms Dauer und 5000 ms Sampling gebunden.');
  }

  const test = gui.erstelleTest({
    kennung: 'block8-5-soak-' + cfg.laufKennung,
    titel: 'V4 Block 8.5.9 · 10-Minuten-Soak',
    beschreibung:
      'Separate letzte Freigabestufe: importierter Schatten- und Live-Nachweis, frische aktive Runtime, 10 Minuten read-only Telemetrie/Recovery-Auswertung.'
  });
  const bestaetigungsText = 'BLOCK8-5-SOAK-STARTEN:' + cfg.laufKennung;
  let soakGestartet = false;

  function pruefeRuntime(runtime) {
    const status = runtime.status();
    if (status.aktivFreigegeben !== true) throw new Error('Soak verlangt aktivFreigegeben=true.');
    if (status.gestoppt === true) throw new Error('Soak akzeptiert keine gestoppte Runtime.');
    if (status.empfangInstalliert !== true) throw new Error('Soak verlangt installierten CM-Empfang.');
    if (status.lebensnachweisAutomatikAktiv !== true) throw new Error('Soak verlangt aktiven Produktionsheartbeat.');
    if (status.lebensnachweisAutomatikPausiert === true) throw new Error('Soak akzeptiert keinen pausierten Produktionsheartbeat.');
    if (!Number.isSafeInteger(status.lebensnachweisSendeVersuche) || status.lebensnachweisSendeVersuche < 1) {
      throw new Error('Soak verlangt mindestens einen Produktionsheartbeat-Sendeversuch.');
    }
    if (!Number.isSafeInteger(status.lebensnachweisSendeErfolge) || status.lebensnachweisSendeErfolge < 1) {
      throw new Error('Soak verlangt mindestens einen bestaetigten Produktionsheartbeat-Erfolg.');
    }
    if (status.lebensnachweisSendeFehler !== 0) {
      throw new Error('Soak verlangt vor und waehrend des Laufs 0 Produktionsheartbeat-Sendefehler.');
    }
    if (status.performanceTrickErforderlich === true && status.performanceTrickAufgerufen !== true) {
      throw new Error('Soak verlangt bestaetigten performance_trick-Browser-Hintergrundschutz.');
    }
    if (status.liveSmokeInstalliert === true || status.gruppenZielVorbereitungVerbraucht === true) {
      throw new Error('Soak akzeptiert keine Live-Smoke-/Gruppenziel-Autoritaet.');
    }
    return status;
  }

  function pruefeBasis(runtime) {
    const basis = runtime.basisBedienStatus();
    if (!basis?.laufzeit || basis.laufzeit.schemaVersion !== 1) {
      throw new Error('Soak-Basisstatus ist unvollstaendig.');
    }
    if (basis.laufzeit.zustand !== 'laeuft') {
      throw new Error('Soak verlangt LaufzeitSteuerung=laeuft.');
    }
    if (basis.laufzeit.automatischeFortsetzung !== false) {
      throw new Error('Soak verlangt automatischeFortsetzung=false.');
    }
    return basis;
  }

  function schlafe(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function warteAufBestaetigtenHeartbeat(runtime) {
    const gestartetAm = Date.now();
    while (Date.now() - gestartetAm < 10000) {
      const status = runtime.status();
      if (status.lebensnachweisSendeFehler > 0) {
        throw new Error(
          'Produktionsheartbeat meldet vor Soak einen SendeFehler: ' +
          String(status.lebensnachweisLetzterFehler ?? 'unbekannt')
        );
      }
      if (
        status.lebensnachweisSendeVersuche >= 1 &&
        status.lebensnachweisSendeErfolge >= 1 &&
        status.lebensnachweisSendeOffen === 0
      ) {
        return status;
      }
      await schlafe(250);
    }
    throw new Error('Innerhalb von 10 Sekunden wurde kein bestaetigter Produktionsheartbeat fuer Soak erreicht.');
  }

  async function soak() {
    if (soakGestartet) throw new Error('Soak ist one-shot und wurde bereits gestartet.');
    soakGestartet = true;

    const runtime = globalThis.V4ProduktionsLaufzeit;
    const basisVorher = pruefeBasis(runtime);
    const runtimeVorher = pruefeRuntime(runtime);
    const generation = basisVorher.laufzeit.generation;
    const heartbeatErfolgeVorher = runtimeVorher.lebensnachweisSendeErfolge;
    const gestartetAm = Date.now();
    const fehler = [];
    let samples = 0;

    test.protokolliere('Soak gestartet', Object.freeze({
      dauerMillisekunden: cfg.soakDauerMillisekunden,
      sampleMillisekunden: cfg.sampleMillisekunden,
      generation,
      heartbeatErfolgeVorher,
      heartbeatFehlerVorher: runtimeVorher.lebensnachweisSendeFehler,
      schattenNachweisKennung: schattenNachweis.nachweisKennung,
      liveNachweisKennung: liveNachweis.nachweisKennung
    }));

    await new Promise((resolve) => {
      const timer = setInterval(() => {
        samples += 1;
        try {
          const status = pruefeRuntime(runtime);
          const basis = pruefeBasis(runtime);
          if (basis.laufzeit.generation !== generation) {
            fehler.push(
              'Unerwartete Laufzeit-Generation ' +
              basis.laufzeit.generation +
              '; erwartet ' +
              generation +
              '.'
            );
          }
          if (status.lebensnachweisSendeFehler !== runtimeVorher.lebensnachweisSendeFehler) {
            fehler.push('Produktionsheartbeat-Sendefehlerzahl hat sich waehrend Soak veraendert.');
          }
        } catch (ursache) {
          fehler.push(ursache instanceof Error ? ursache.message : String(ursache));
        }

        if (Date.now() - gestartetAm >= cfg.soakDauerMillisekunden) {
          clearInterval(timer);
          resolve();
        }
      }, cfg.sampleMillisekunden);
    });

    const runtimeNachher = pruefeRuntime(runtime);
    const basisNachher = pruefeBasis(runtime);
    const erwarteteSamples = Math.max(
      1,
      Math.floor(cfg.soakDauerMillisekunden / cfg.sampleMillisekunden) - 2
    );

    if (samples < erwarteteSamples) {
      fehler.push('Soak-Sampling war zu duenn: ' + samples + ' statt mindestens ' + erwarteteSamples + '.');
    }
    if (basisNachher.laufzeit.generation !== generation) {
      fehler.push('Laufzeit-Generation hat sich waehrend Soak veraendert.');
    }
    if (runtimeNachher.lebensnachweisSendeErfolge <= heartbeatErfolgeVorher) {
      fehler.push('Produktionsheartbeat hat waehrend Soak keinen neuen Erfolg bestaetigt.');
    }

    const pass = fehler.length === 0;
    const nachweis = Object.freeze({
      schemaVersion: 1,
      laufzeitPfadKennung: PFAD,
      aenderungsKennung: AENDERUNG,
      stufe: 'soak',
      nachweisKennung: cfg.laufKennung + ':soak',
      ergebnis: pass ? 'bestanden' : 'fehlgeschlagen',
      durchgefuehrtAm: Date.now(),
      deterministisch: false,
      spielAktionAusgefuehrt: true,
      begrenzt: false,
      telemetrieNachweis: pass,
      recoveryNachweis: pass,
      gesamtauswertungBestanden: pass
    });
    const bericht = Object.freeze({
      stufe: 'soak',
      pass,
      gestartetAm,
      beendetAm: Date.now(),
      nachweis,
      dauerMillisekunden: cfg.soakDauerMillisekunden,
      sampleMillisekunden: cfg.sampleMillisekunden,
      samples,
      erwarteteSamples,
      fehler: Object.freeze([...fehler]),
      generation,
      generationNachher: basisNachher.laufzeit.generation,
      heartbeatErfolgeVorher,
      heartbeatErfolgeNachher: runtimeNachher.lebensnachweisSendeErfolge,
      heartbeatFehlerVorher: runtimeVorher.lebensnachweisSendeFehler,
      heartbeatFehlerNachher: runtimeNachher.lebensnachweisSendeFehler,
      schattenNachweisKennung: schattenNachweis.nachweisKennung,
      liveNachweisKennung: liveNachweis.nachweisKennung
    });

    test.setzeErgebnis(
      bericht,
      pass ? 'pass' : 'fail',
      pass
        ? 'Soak-Test bestanden: 10 Minuten Telemetrie stabil, Produktionsheartbeat fortgeschritten, Recovery-Grenzen unveraendert.'
        : 'Soak-Test fehlgeschlagen; Bericht enthaelt die beobachteten Abweichungen.'
    );
    test.protokolliere('Soak-Abschluss', bericht);
    return bericht;
  }

  test.registriereAktion({
    kennung: 'soak',
    titel: '3 · Soak starten',
    art: 'gefahr',
    aktiviert: false,
    einmalig: true,
    bestaetigungsText,
    ausfuehren: soak
  });
  test.setzeStatus(
    'laeuft',
    'Immutable Runtime 1.1.5 wird fuer eine frische Soak-Sitzung geladen. Soak bleibt bis zu einem bestaetigten echten Produktionsheartbeat gesperrt.'
  );

  const zustand = {
    phase: 'laedt',
    bereit: false,
    fehler: null,
    heartbeatVersuche: 0,
    heartbeatErfolge: 0,
    laufKennung: cfg.laufKennung
  };

  Object.defineProperty(globalThis, API_NAME, {
    configurable: true,
    enumerable: true,
    writable: false,
    value: Object.freeze({
      version: VERSION,
      laufKennung: cfg.laufKennung,
      bestaetigungsText,
      test,
      status() {
        return Object.freeze({ ...zustand, gui: test.status() });
      },
      kopiereBericht: () => test.kopiereBericht()
    })
  });

  void Promise.resolve(bootstrap.lade()).then(async (bootstrapStatus) => {
    const runtime = globalThis.V4ProduktionsLaufzeit;
    if (!runtime || runtime.version !== RUNTIME_VERSION || typeof runtime.starte !== 'function') {
      throw new Error('Geladene Runtime ist nicht die erwartete startfaehige Version 1.1.5.');
    }
    const vorStart = runtime.status();
    if (
      vorStart.aktivFreigegeben !== true ||
      vorStart.empfangInstalliert !== false ||
      vorStart.lebensnachweisAutomatikAktiv !== false ||
      vorStart.lebensnachweisSendeVersuche !== 0
    ) {
      throw new Error('Soakpaket erwartet vor starte() eine aktive, aber noch nicht gestartete Runtime mit 0 Heartbeat-Versuchen.');
    }

    runtime.starte();
    await warteAufBestaetigtenHeartbeat(runtime);
    const status = pruefeRuntime(runtime);
    const basis = pruefeBasis(runtime);

    if (bootstrapStatus.geladenVon !== RUNTIME_URL) throw new Error('Soak-Bootstrap bestaetigt nicht die immutable Runtime-URL.');
    if (bootstrapStatus.geladenerSha256 !== RUNTIME_SHA256) throw new Error('Soak-Bootstrap bestaetigt nicht den Runtime-SHA-256.');
    if (basis.laufzeit.generation !== 0) throw new Error('Frische Soak-Sitzung verlangt Laufzeit-Generation 0.');
    if (status.lebensnachweisSendeOffen !== 0) throw new Error('Soak-Preflight verlangt 0 offene Heartbeat-Sendungen.');

    zustand.phase = 'bereit';
    zustand.bereit = true;
    zustand.heartbeatVersuche = status.lebensnachweisSendeVersuche;
    zustand.heartbeatErfolge = status.lebensnachweisSendeErfolge;
    test.protokolliere('Soak-Launcher bereit', Object.freeze({
      laufKennung: cfg.laufKennung,
      runtimeVersion: runtime.version,
      runtimeUrl: bootstrapStatus.geladenVon,
      runtimeSha256: bootstrapStatus.geladenerSha256,
      generation: basis.laufzeit.generation,
      heartbeatVersuche: status.lebensnachweisSendeVersuche,
      heartbeatErfolge: status.lebensnachweisSendeErfolge,
      heartbeatFehler: status.lebensnachweisSendeFehler,
      schattenNachweisKennung: schattenNachweis.nachweisKennung,
      liveNachweisKennung: liveNachweis.nachweisKennung
    }));
    test.setzeStatus(
      'bereit',
      'Soak-Preflight bestanden: Schatten und kontrolliert live gebunden, Runtime aktiv, echter Produktionsheartbeat bestaetigt. Jetzt nur „3 · Soak starten“ ausfuehren.'
    );
    test.setzeAktionAktiv('soak', true);
  }).catch((ursache) => {
    const meldung = ursache instanceof Error ? ursache.message : String(ursache);
    zustand.phase = 'fehlgeschlagen';
    zustand.bereit = false;
    zustand.fehler = meldung;
    test.setzeAktionAktiv('soak', false);
    test.setzeErgebnis(Object.freeze({ status: 'fehlgeschlagen', fehler: meldung }), 'fail', meldung);
    test.protokolliere('Soak-Launcher FEHLER', meldung);
  });
})();
/* ===== END separater Soak-Launcher ===== */
