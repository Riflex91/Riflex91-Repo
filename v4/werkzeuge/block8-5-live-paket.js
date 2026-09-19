/* GENERATED: V4 Block 8.5.9 kontrolliertes Live-/Soak-Komplettpaket.
 * Quelle: block8-5-live-paket-bauen.mjs
 * Bindet den real bestandenen Schattennachweis und startet Runtime 1.1.5 bewusst aktiv.
 * Der Launcher ruft keine Adventure-Land-Spielaktionsfunktion direkt auf; die Produktionsruntime sendet Heartbeats per send_cm.
 */
(() => {
  'use strict';

  const belegteNamen = [
    'AIO_V4_RUNTIME_CONFIG',
    'AIO_V4_BOOTSTRAP_CONFIG',
    'AIO_V4_BLOCK85_FREIGABE_CONFIG',
    'V4ProduktionsLaufzeit',
    'V4Bootstrap',
    'V4TestGui',
    'V4Block85FreigabeLiveTest',
    'V4Block85LiveLauncher'
  ].filter((name) => globalThis[name] !== undefined);
  if (belegteNamen.length > 0) {
    throw new Error(
      'Block-8.5-Livepaket verlangt einen frischen Codekontext; bereits vorhanden: ' +
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
    ablaufKennung: 'block8-5-kontrolliert-live-1789775266269',
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
  setzeGlobal('AIO_V4_BLOCK85_FREIGABE_CONFIG', Object.freeze({
    aenderungsKennung: 'git:88185523c81687dc16f9647ca5e7568c5e2c228c',
    laufKennung: 'block8-5-schatten-1789775266269',
    modus: 'live',
    soakDauerMillisekunden: 600000,
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

/* ===== BEGIN werkzeuge/block8-5-freigabestufen-live-test.js ===== */
(() => {
  'use strict';

  const API_NAME = 'V4Block85FreigabeLiveTest';
  const VERSION = '1.1.0';
  const LAUFZEIT_PFAD = 'block8.5-basisbedienung-runtime';
  const ERWARTETE_AENDERUNGS_KENNUNG = 'git:88185523c81687dc16f9647ca5e7568c5e2c228c';
  const ERWARTETE_RUNTIME_SHA256 = '95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f';
  const ERWARTETE_RUNTIME_URL =
    'https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/88185523c81687dc16f9647ca5e7568c5e2c228c/aio-v4-runtime.js';
  const MODI = Object.freeze(['schatten', 'live']);
  const GUI_API_NAME = 'V4TestGui';
  const RUNTIME_API_NAME = 'V4ProduktionsLaufzeit';
  const ERWARTETE_RUNTIME_VERSION = '1.1.5';
  const CONFIG_NAME = 'AIO_V4_BLOCK85_FREIGABE_CONFIG';
  const SOAK_MIN_MILLIS = 10 * 60 * 1000;
  const SOAK_MAX_MILLIS = 60 * 60 * 1000;
  const SOAK_SAMPLE_MILLIS = 5_000;

  let vorgangsNummer = 0;

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
      if (globalThis?.[name] !== undefined) return globalThis[name];
    } catch {
      // Parent-Fallback.
    }
    const eltern = holeElternFenster();
    try {
      if (eltern?.[name] !== undefined) return eltern[name];
    } catch {
      // Nicht vorhanden.
    }
    return undefined;
  }

  function pruefeNichtLeer(name, wert) {
    if (typeof wert !== 'string' || wert.trim().length === 0) {
      throw new Error(`${name} darf nicht leer sein.`);
    }
    return wert.trim();
  }

  function konfiguration() {
    const roh = holeGlobal(CONFIG_NAME);
    if (!roh || typeof roh !== 'object') {
      throw new Error(`${CONFIG_NAME} fehlt.`);
    }
    const aenderungsKennung = pruefeNichtLeer('aenderungsKennung', roh.aenderungsKennung);
    if (aenderungsKennung !== ERWARTETE_AENDERUNGS_KENNUNG) {
      throw new Error(
        `aenderungsKennung muss exakt ${ERWARTETE_AENDERUNGS_KENNUNG} entsprechen.`
      );
    }
    const laufKennung = pruefeNichtLeer('laufKennung', roh.laufKennung);
    const modus = pruefeNichtLeer('modus', roh.modus);
    if (!MODI.includes(modus)) {
      throw new Error('modus muss schatten oder live sein.');
    }
    const soakDauerMillisekunden = Number(roh.soakDauerMillisekunden ?? SOAK_MIN_MILLIS);
    if (
      !Number.isFinite(soakDauerMillisekunden) ||
      soakDauerMillisekunden < SOAK_MIN_MILLIS ||
      soakDauerMillisekunden > SOAK_MAX_MILLIS
    ) {
      throw new Error(
        `soakDauerMillisekunden muss zwischen ${SOAK_MIN_MILLIS} und ${SOAK_MAX_MILLIS} liegen.`
      );
    }
    const schattenUebergabe = modus === 'live'
      ? pruefeSchattenUebergabe(roh.schattenUebergabe, laufKennung, aenderungsKennung)
      : null;
    return Object.freeze({
      aenderungsKennung,
      laufKennung,
      modus,
      soakDauerMillisekunden,
      schattenUebergabe
    });
  }

  function guiApi() {
    const api = holeGlobal(GUI_API_NAME);
    if (!api || typeof api.erstelleTest !== 'function') {
      throw new Error(`${GUI_API_NAME} fehlt. Zuerst adventure-land-test-gui.js laden.`);
    }
    return api;
  }

  function runtimeApi() {
    const api = holeGlobal(RUNTIME_API_NAME);
    if (!api || typeof api !== 'object') {
      throw new Error(`${RUNTIME_API_NAME} ist nicht geladen.`);
    }
    if (api.version !== ERWARTETE_RUNTIME_VERSION) {
      throw new Error(
        `Freigabe-Runner erwartet Runtime ${ERWARTETE_RUNTIME_VERSION}, gefunden wurde ${String(api.version)}.`
      );
    }
    for (const methode of [
      'status',
      'basisBedienStatus',
      'erstelleBasisBedienAnfrage',
      'fuehreBasisBedienAnfrage'
    ]) {
      if (typeof api[methode] !== 'function') {
        throw new Error(`${RUNTIME_API_NAME} besitzt die sichere Methode ${methode} nicht.`);
      }
    }
    return api;
  }

  function pruefeSchattenUebergabe(wert, laufKennung, aenderungsKennung) {
    if (!wert || typeof wert !== 'object') {
      throw new Error('Live-Modus braucht eine schattenUebergabe aus einem bestandenen strikten Schattenlauf.');
    }
    const nachweis = wert.nachweis;
    if (!nachweis || typeof nachweis !== 'object') {
      throw new Error('schattenUebergabe.nachweis fehlt.');
    }

    for (const [name, erwartetWert] of Object.entries({
      schemaVersion: 1,
      laufzeitPfadKennung: LAUFZEIT_PFAD,
      aenderungsKennung,
      laufKennung,
      runtimeVersion: ERWARTETE_RUNTIME_VERSION,
      runtimeSha256: ERWARTETE_RUNTIME_SHA256,
      runtimeUrl: ERWARTETE_RUNTIME_URL,
      betriebsart: 'gesperrt_nicht_gestartet',
      generation: 0,
      heartbeatVersuche: 0,
      heartbeatErfolge: 0,
      heartbeatFehler: 0
    })) {
      if (wert[name] !== erwartetWert) {
        throw new Error(`schattenUebergabe besitzt unerwarteten Wert fuer ${name}.`);
      }
    }

    for (const [name, erwartetWert] of Object.entries({
      schemaVersion: 1,
      laufzeitPfadKennung: LAUFZEIT_PFAD,
      aenderungsKennung,
      stufe: 'schatten',
      nachweisKennung: `${laufKennung}:schatten`,
      ergebnis: 'bestanden',
      deterministisch: false,
      spielAktionAusgefuehrt: false,
      begrenzt: false,
      telemetrieNachweis: false,
      recoveryNachweis: false,
      gesamtauswertungBestanden: false
    })) {
      if (nachweis[name] !== erwartetWert) {
        throw new Error(`schattenUebergabe.nachweis besitzt unerwarteten Wert fuer ${name}.`);
      }
    }
    if (!Number.isFinite(nachweis.durchgefuehrtAm) || nachweis.durchgefuehrtAm < 0) {
      throw new Error('schattenUebergabe.nachweis.durchgefuehrtAm ist ungueltig.');
    }

    return Object.freeze({
      ...wert,
      nachweis: Object.freeze({ ...nachweis })
    });
  }

  function neueVorgangsKennung(aktion) {
    vorgangsNummer += 1;
    return `${cfg.laufKennung}:${aktion}:${vorgangsNummer}`;
  }

  function pruefeBasisStatus(status, erwarteterZustand = null) {
    if (!status || typeof status !== 'object' || !status.laufzeit || typeof status.laufzeit !== 'object') {
      throw new Error('Basisbedienungs-Status ist unvollstaendig.');
    }
    if (status.laufzeit.schemaVersion !== 1) {
      throw new Error('Basisbedienungs-Laufzeit besitzt eine unbekannte schemaVersion.');
    }
    if (!Number.isSafeInteger(status.laufzeit.generation) || status.laufzeit.generation < 0) {
      throw new Error('Basisbedienungs-Laufzeit besitzt eine ungueltige Generation.');
    }
    if (status.laufzeit.automatischeFortsetzung !== false) {
      throw new Error('Automatische Fortsetzung muss fuer die Freigabe deaktiviert sein.');
    }
    if (erwarteterZustand !== null && status.laufzeit.zustand !== erwarteterZustand) {
      throw new Error(
        `Laufzeit ist ${String(status.laufzeit.zustand)} statt ${erwarteterZustand}.`
      );
    }
    return status;
  }

  function pruefeBootstrapBindung() {
    const bootstrap = holeGlobal('V4Bootstrap');
    if (!bootstrap || typeof bootstrap.status !== 'function') {
      throw new Error('V4Bootstrap fehlt; exakte immutable Runtime-Bindung kann nicht bestaetigt werden.');
    }
    const status = bootstrap.status();
    if (
      status?.bereit !== true ||
      status?.geladenVon !== ERWARTETE_RUNTIME_URL ||
      status?.geladenerSha256 !== ERWARTETE_RUNTIME_SHA256
    ) {
      throw new Error('V4Bootstrap bestaetigt nicht die exakt erwartete immutable Runtime 1.1.5.');
    }
    return status;
  }

  function pruefeSchattenRuntimeStatus(status) {
    if (!status || typeof status !== 'object') throw new Error('Runtime-Status fehlt.');
    if (status.aktivFreigegeben !== false) {
      throw new Error('Schattenbetrieb verlangt eine gesperrte Runtime mit aktivFreigegeben=false.');
    }
    if (status.gestoppt === true) {
      throw new Error('Schattenbetrieb akzeptiert keine bereits gestoppte Runtime.');
    }
    if (status.empfangInstalliert !== false) {
      throw new Error('Schattenbetrieb verlangt eine nicht gestartete Runtime ohne installierten CM-Empfang.');
    }
    if (status.lebensnachweisAutomatikAktiv !== false) {
      throw new Error('Schattenbetrieb verlangt einen nicht gestarteten Produktionsheartbeat.');
    }
    if (status.lebensnachweisAutomatikPausiert !== false) {
      throw new Error('Schattenbetrieb akzeptiert keinen zuvor gestarteten/pausierten Produktionsheartbeat.');
    }
    for (const feld of [
      'lebensnachweisSendeVersuche',
      'lebensnachweisSendeErfolge',
      'lebensnachweisSendeFehler',
      'lebensnachweisSendeOffen',
      'lebensnachweisSendeMaxOffen'
    ]) {
      if (status[feld] !== 0) {
        throw new Error(`Schattenbetrieb verlangt ${feld}=0.`);
      }
    }
    if (status.performanceTrickAufgerufen !== false || status.performanceTrickAufrufe !== 0) {
      throw new Error('Schattenbetrieb verlangt eine noch nicht gestartete Runtime ohne performance_trick-Aufruf.');
    }
    if (status.liveSmokeInstalliert === true || status.gruppenZielVorbereitungVerbraucht === true) {
      throw new Error('Schattenbetrieb akzeptiert keine vorbereitete oder installierte Live-Autoritaet.');
    }
    return status;
  }

  function pruefeLiveRuntimeStatus(status) {
    if (!status || typeof status !== 'object') throw new Error('Runtime-Status fehlt.');
    if (status.aktivFreigegeben !== true) {
      throw new Error('Live-Modus verlangt eine aktiv freigegebene Produktionsruntime.');
    }
    if (status.gestoppt === true) {
      throw new Error('Produktionsruntime ist bereits gestoppt.');
    }
    if (status.empfangInstalliert !== true) {
      throw new Error('Live-Modus verlangt eine gestartete Runtime mit installiertem CM-Empfang.');
    }
    if (status.lebensnachweisAutomatikAktiv !== true) {
      throw new Error('Produktionsheartbeat ist nicht aktiv.');
    }
    if (status.lebensnachweisAutomatikPausiert === true) {
      throw new Error('Produktionsheartbeat ist pausiert.');
    }
    if (!Number.isSafeInteger(status.lebensnachweisSendeVersuche) || status.lebensnachweisSendeVersuche < 1) {
      throw new Error('Live-Modus verlangt mindestens einen echten Produktionsheartbeat-Sendeversuch.');
    }
    if (
      status.performanceTrickErforderlich === true &&
      status.performanceTrickAufgerufen !== true
    ) {
      throw new Error('Browser-Hintergrundschutz performance_trick ist nicht bestaetigt aktiv.');
    }
    return status;
  }

  function schattenPreflight() {
    if (cfg.modus !== 'schatten') {
      throw new Error('Schattennachweis ist nur im Modus schatten erlaubt.');
    }
    const runtime = runtimeApi();
    const bootstrapStatus = pruefeBootstrapBindung();
    const runtimeStatus = pruefeSchattenRuntimeStatus(runtime.status());
    const basisStatus = pruefeBasisStatus(runtime.basisBedienStatus(), 'laeuft');
    if (basisStatus.laufzeit.generation !== 0) {
      throw new Error('Schattenbetrieb verlangt Laufzeit-Generation 0.');
    }
    return Object.freeze({ runtime, bootstrapStatus, runtimeStatus, basisStatus });
  }

  function livePreflight() {
    if (cfg.modus !== 'live') {
      throw new Error('Kontrollierter Live-Test und Soak sind nur im Modus live erlaubt.');
    }
    const runtime = runtimeApi();
    const bootstrapStatus = pruefeBootstrapBindung();
    const runtimeStatus = pruefeLiveRuntimeStatus(runtime.status());
    const basisStatus = pruefeBasisStatus(runtime.basisBedienStatus(), 'laeuft');
    return Object.freeze({ runtime, bootstrapStatus, runtimeStatus, basisStatus });
  }

  function erstelleNachweis(stufe, ergebnis, durchgefuehrtAm, optionen = {}) {
    return Object.freeze({
      schemaVersion: 1,
      laufzeitPfadKennung: LAUFZEIT_PFAD,
      aenderungsKennung: cfg.aenderungsKennung,
      stufe,
      nachweisKennung: `${cfg.laufKennung}:${stufe}`,
      ergebnis,
      durchgefuehrtAm,
      deterministisch: optionen.deterministisch === true,
      spielAktionAusgefuehrt: optionen.spielAktionAusgefuehrt === true,
      begrenzt: optionen.begrenzt === true,
      telemetrieNachweis: optionen.telemetrieNachweis === true,
      recoveryNachweis: optionen.recoveryNachweis === true,
      gesamtauswertungBestanden: optionen.gesamtauswertungBestanden === true
    });
  }

  const cfg = konfiguration();
  const test = guiApi().erstelleTest({
    kennung: `block8-5-freigabe-${cfg.laufKennung}`,
    titel: 'V4 Block 8.5.9 · Freigabestufen',
    beschreibung:
      'Modusgebundene Freigabe fuer Runtime 1.1.5: Schatten strikt gesperrt/nicht gestartet; Live/Soak erst in separater aktiver Sitzung mit importierter Schattenuebergabe.'
  });

  let schattenNachweis = cfg.schattenUebergabe?.nachweis ?? null;
  let schattenUebergabe = cfg.schattenUebergabe;
  let liveNachweis = null;
  let soakNachweis = null;

  function schatten() {
    const gestartetAm = Date.now();
    const { runtime, bootstrapStatus, runtimeStatus, basisStatus } = schattenPreflight();
    const generationVorher = basisStatus.laufzeit.generation;

    const anfrage = runtime.erstelleBasisBedienAnfrage(Object.freeze({
      vorgangsKennung: neueVorgangsKennung('schatten-diagnose'),
      aktion: 'diagnose_aktualisieren',
      erwarteteLaufzeitGeneration: generationVorher
    }));
    const ergebnis = runtime.fuehreBasisBedienAnfrage(anfrage);
    const basisNachher = pruefeBasisStatus(runtime.basisBedienStatus(), 'laeuft');
    const runtimeNachher = pruefeSchattenRuntimeStatus(runtime.status());

    const pass =
      ergebnis?.status === 'ausgefuehrt' &&
      ergebnis?.aktion === 'diagnose_aktualisieren' &&
      generationVorher === 0 &&
      basisNachher.laufzeit.generation === 0 &&
      runtimeNachher.lebensnachweisSendeVersuche === 0 &&
      runtimeNachher.lebensnachweisSendeErfolge === 0 &&
      runtimeNachher.lebensnachweisSendeFehler === 0;

    schattenNachweis = erstelleNachweis(
      'schatten',
      pass ? 'bestanden' : 'fehlgeschlagen',
      Date.now()
    );
    schattenUebergabe = pass
      ? Object.freeze({
          schemaVersion: 1,
          laufzeitPfadKennung: LAUFZEIT_PFAD,
          aenderungsKennung: cfg.aenderungsKennung,
          laufKennung: cfg.laufKennung,
          runtimeVersion: ERWARTETE_RUNTIME_VERSION,
          runtimeSha256: ERWARTETE_RUNTIME_SHA256,
          runtimeUrl: ERWARTETE_RUNTIME_URL,
          betriebsart: 'gesperrt_nicht_gestartet',
          generation: 0,
          heartbeatVersuche: 0,
          heartbeatErfolge: 0,
          heartbeatFehler: 0,
          nachweis: schattenNachweis
        })
      : null;

    const bericht = Object.freeze({
      stufe: 'schatten',
      pass,
      gestartetAm,
      nachweis: schattenNachweis,
      generationVorher,
      generationNachher: basisNachher.laufzeit.generation,
      diagnoseStatus: ergebnis?.status ?? null,
      bootstrap: bootstrapStatus,
      runtimeVorher: runtimeStatus,
      runtimeNachher,
      schattenUebergabe
    });
    test.setzeErgebnis(
      bericht,
      pass ? 'pass' : 'fail',
      pass
        ? 'Schattennachweis bestanden: Runtime blieb gesperrt, nicht gestartet und bei 0 Heartbeat-/CM-Versuchen. Fuer Live eine neue aktive Sitzung mit der ausgegebenen schattenUebergabe verwenden.'
        : 'Schattennachweis fehlgeschlagen.'
    );
    test.protokolliere('Schattennachweis', bericht);
    return bericht;
  }

  function kontrolliertLive() {
    if (schattenNachweis?.ergebnis !== 'bestanden') {
      throw new Error('Kontrollierter Live-Test verlangt zuerst einen bestandenen Schattennachweis.');
    }

    const gestartetAm = Date.now();
    const { runtime, runtimeStatus, basisStatus } = livePreflight();
    const generationVorher = basisStatus.laufzeit.generation;

    const pauseAnfrage = runtime.erstelleBasisBedienAnfrage(Object.freeze({
      vorgangsKennung: neueVorgangsKennung('live-pause'),
      aktion: 'laufzeit_pausieren',
      erwarteteLaufzeitGeneration: generationVorher
    }));
    const pause = runtime.fuehreBasisBedienAnfrage(pauseAnfrage);
    const nachPause = pruefeBasisStatus(runtime.basisBedienStatus(), 'pausiert');
    const runtimeNachPause = pruefeLiveRuntimeStatus(runtime.status());

    if (
      pause?.status !== 'ausgefuehrt' ||
      nachPause.laufzeit.generation !== generationVorher + 1
    ) {
      liveNachweis = erstelleNachweis('kontrolliert_live', 'fehlgeschlagen', Date.now(), {
        begrenzt: true,
        spielAktionAusgefuehrt: true
      });
      throw new Error(
        'Kontrollierter Live-Test konnte die sichere Pause nicht eindeutig bestaetigen; Runtime bleibt fail-safe im beobachteten Zustand.'
      );
    }

    const fortsetzenAnfrage = runtime.erstelleBasisBedienAnfrage(Object.freeze({
      vorgangsKennung: neueVorgangsKennung('live-fortsetzen'),
      aktion: 'laufzeit_fortsetzen',
      erwarteteLaufzeitGeneration: nachPause.laufzeit.generation,
      ausdruecklichBestaetigt: true
    }));
    const fortsetzen = runtime.fuehreBasisBedienAnfrage(fortsetzenAnfrage);
    const nachFortsetzen = pruefeBasisStatus(runtime.basisBedienStatus(), 'laeuft');
    const runtimeNachher = pruefeLiveRuntimeStatus(runtime.status());

    const pass =
      fortsetzen?.status === 'ausgefuehrt' &&
      nachFortsetzen.laufzeit.generation === generationVorher + 2 &&
      runtimeNachPause.lebensnachweisAutomatikAktiv === true &&
      runtimeNachher.lebensnachweisAutomatikAktiv === true &&
      runtimeNachher.lebensnachweisAutomatikPausiert === false;

    liveNachweis = erstelleNachweis(
      'kontrolliert_live',
      pass ? 'bestanden' : 'fehlgeschlagen',
      Date.now(),
      { begrenzt: true, spielAktionAusgefuehrt: true }
    );

    const bericht = Object.freeze({
      stufe: 'kontrolliert_live',
      pass,
      gestartetAm,
      nachweis: liveNachweis,
      generationVorher,
      generationNachPause: nachPause.laufzeit.generation,
      generationNachFortsetzen: nachFortsetzen.laufzeit.generation,
      pauseStatus: pause?.status ?? null,
      fortsetzenStatus: fortsetzen?.status ?? null,
      heartbeatVorher: runtimeStatus.lebensnachweisSendeErfolge,
      heartbeatNachPause: runtimeNachPause.lebensnachweisSendeErfolge,
      heartbeatNachher: runtimeNachher.lebensnachweisSendeErfolge
    });

    test.setzeErgebnis(
      bericht,
      pass ? 'pass' : 'fail',
      pass
        ? 'Kontrollierter Live-Test bestanden: genau eine sichere Pause und bestaetigte Fortsetzung; Produktionsheartbeat blieb aktiv.'
        : 'Kontrollierter Live-Test fehlgeschlagen.'
    );
    test.protokolliere('Kontrollierter Live-Test', bericht);
    test.setzeAktionAktiv('soak', pass);
    return bericht;
  }

  async function soak() {
    if (liveNachweis?.ergebnis !== 'bestanden') {
      throw new Error('Soak-Test verlangt zuerst einen bestandenen kontrollierten Live-Test.');
    }

    const { runtime, runtimeStatus, basisStatus } = livePreflight();
    const generation = basisStatus.laufzeit.generation;
    const gestartetAm = Date.now();
    const fehler = [];
    let samples = 0;

    test.protokolliere('Soak gestartet', Object.freeze({
      dauerMillisekunden: cfg.soakDauerMillisekunden,
      sampleMillisekunden: SOAK_SAMPLE_MILLIS,
      generation,
      heartbeatErfolge: runtimeStatus.lebensnachweisSendeErfolge,
      heartbeatFehler: runtimeStatus.lebensnachweisSendeFehler
    }));

    await new Promise((resolve) => {
      const timer = setInterval(() => {
        samples += 1;
        try {
          const status = pruefeLiveRuntimeStatus(runtime.status());
          const basis = pruefeBasisStatus(runtime.basisBedienStatus(), 'laeuft');
          if (basis.laufzeit.generation !== generation) {
            fehler.push(
              `Unerwartete Laufzeit-Generation ${basis.laufzeit.generation}; erwartet ${generation}.`
            );
          }
          if (status.lebensnachweisSendeFehler > runtimeStatus.lebensnachweisSendeFehler) {
            fehler.push(
              `Produktionsheartbeat meldet neue SendeFehler: ${status.lebensnachweisSendeFehler}.`
            );
          }
        } catch (ursache) {
          fehler.push(ursache instanceof Error ? ursache.message : String(ursache));
        }

        if (Date.now() - gestartetAm >= cfg.soakDauerMillisekunden) {
          clearInterval(timer);
          resolve();
        }
      }, SOAK_SAMPLE_MILLIS);
    });

    const runtimeNachher = pruefeLiveRuntimeStatus(runtime.status());
    const basisNachher = pruefeBasisStatus(runtime.basisBedienStatus(), 'laeuft');
    const erwarteteSamples = Math.max(
      1,
      Math.floor(cfg.soakDauerMillisekunden / SOAK_SAMPLE_MILLIS) - 2
    );

    if (samples < erwarteteSamples) {
      fehler.push(
        `Soak-Sampling war zu duenn: ${samples} statt mindestens ${erwarteteSamples} Samples.`
      );
    }
    if (basisNachher.laufzeit.generation !== generation) {
      fehler.push('Laufzeit-Generation hat sich waehrend des Soak-Tests veraendert.');
    }
    if (runtimeNachher.lebensnachweisSendeErfolge <= runtimeStatus.lebensnachweisSendeErfolge) {
      fehler.push('Produktionsheartbeat hat waehrend des Soak-Tests keinen neuen Erfolg bestaetigt.');
    }

    const pass = fehler.length === 0;
    soakNachweis = erstelleNachweis(
      'soak',
      pass ? 'bestanden' : 'fehlgeschlagen',
      Date.now(),
      {
        spielAktionAusgefuehrt: true,
        telemetrieNachweis: pass,
        recoveryNachweis: pass && liveNachweis?.ergebnis === 'bestanden',
        gesamtauswertungBestanden: pass
      }
    );

    const bericht = Object.freeze({
      stufe: 'soak',
      pass,
      nachweis: soakNachweis,
      gestartetAm,
      beendetAm: Date.now(),
      dauerMillisekunden: cfg.soakDauerMillisekunden,
      sampleMillisekunden: SOAK_SAMPLE_MILLIS,
      samples,
      erwarteteSamples,
      fehler: Object.freeze([...fehler]),
      generation,
      generationNachher: basisNachher.laufzeit.generation,
      heartbeatErfolgeVorher: runtimeStatus.lebensnachweisSendeErfolge,
      heartbeatErfolgeNachher: runtimeNachher.lebensnachweisSendeErfolge,
      heartbeatFehlerVorher: runtimeStatus.lebensnachweisSendeFehler,
      heartbeatFehlerNachher: runtimeNachher.lebensnachweisSendeFehler
    });

    test.setzeErgebnis(
      bericht,
      pass ? 'pass' : 'fail',
      pass
        ? 'Soak-Test bestanden: Telemetrie stabil, Heartbeat fortgeschritten und Recovery-Grenzen unveraendert.'
        : 'Soak-Test fehlgeschlagen; Bericht enthaelt die beobachteten Abweichungen.'
    );
    test.protokolliere('Soak-Abschluss', bericht);
    return bericht;
  }

  const LIVE_TEXT = `BLOCK8-5-KONTROLLIERT-LIVE:${cfg.laufKennung}`;
  const SOAK_TEXT = `BLOCK8-5-SOAK-STARTEN:${cfg.laufKennung}`;

  test.registriereAktion({
    kennung: 'schatten',
    titel: '1 · Schattennachweis',
    art: 'primaer',
    aktiviert: cfg.modus === 'schatten',
    einmalig: true,
    ausfuehren: schatten
  });
  test.registriereAktion({
    kennung: 'kontrolliert-live',
    titel: '2 · Kontrolliert live',
    art: 'gefahr',
    aktiviert: cfg.modus === 'live' && schattenNachweis?.ergebnis === 'bestanden',
    einmalig: true,
    bestaetigungsText: LIVE_TEXT,
    ausfuehren: kontrolliertLive
  });
  test.registriereAktion({
    kennung: 'soak',
    titel: '3 · Soak starten',
    art: 'gefahr',
    aktiviert: false,
    einmalig: true,
    bestaetigungsText: SOAK_TEXT,
    ausfuehren: soak
  });

  const api = Object.freeze({
    version: VERSION,
    erwarteteRuntimeVersion: ERWARTETE_RUNTIME_VERSION,
    aenderungsKennung: cfg.aenderungsKennung,
    laufKennung: cfg.laufKennung,
    modus: cfg.modus,
    erwarteteRuntimeSha256: ERWARTETE_RUNTIME_SHA256,
    erwarteteRuntimeUrl: ERWARTETE_RUNTIME_URL,
    liveBestaetigungsText: () => LIVE_TEXT,
    soakBestaetigungsText: () => SOAK_TEXT,
    test,
    status() {
      return Object.freeze({
        version: VERSION,
        erwarteteRuntimeVersion: ERWARTETE_RUNTIME_VERSION,
        aenderungsKennung: cfg.aenderungsKennung,
        laufKennung: cfg.laufKennung,
        modus: cfg.modus,
        soakDauerMillisekunden: cfg.soakDauerMillisekunden,
        schattenNachweis,
        schattenUebergabe,
        liveNachweis,
        soakNachweis,
        gui: test.status()
      });
    },
    kopiereBericht: () => test.kopiereBericht()
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
/* ===== END werkzeuge/block8-5-freigabestufen-live-test.js ===== */

/* ===== BEGIN kontrollierter Live-Launcher ===== */
(() => {
  'use strict';

  const API_NAME = 'V4Block85LiveLauncher';
  const VERSION = '1.0.0';
  const testApi = globalThis.V4Block85FreigabeLiveTest;
  const bootstrap = globalThis.V4Bootstrap;
  if (!testApi?.test || typeof bootstrap?.lade !== 'function') {
    throw new Error('Livepaket konnte Bootstrap/Test-Runner nicht initialisieren.');
  }

  const zustand = {
    phase: 'laedt',
    bereit: false,
    fehler: null,
    heartbeatErfolge: 0,
    heartbeatVersuche: 0,
    laufKennung: globalThis.AIO_V4_BLOCK85_FREIGABE_CONFIG.laufKennung
  };

  Object.defineProperty(globalThis, API_NAME, {
    configurable: true,
    enumerable: true,
    writable: false,
    value: Object.freeze({
      version: VERSION,
      laufKennung: zustand.laufKennung,
      runtimeSha256: '95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f',
      runtimeUrl: 'https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/88185523c81687dc16f9647ca5e7568c5e2c228c/aio-v4-runtime.js',
      status() {
        return Object.freeze({ ...zustand });
      }
    })
  });

  function schlafe(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function warteAufBestaetigtenHeartbeat(runtime) {
    const gestartetAm = Date.now();
    while (Date.now() - gestartetAm < 10_000) {
      const status = runtime.status();
      if (status.lebensnachweisSendeFehler > 0) {
        throw new Error(
          'Produktionsheartbeat meldet vor dem kontrollierten Live-Test einen SendeFehler: ' +
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
    const status = runtime.status();
    throw new Error(
      'Innerhalb von 10 Sekunden wurde kein bestaetigter Produktionsheartbeat erreicht: ' +
      JSON.stringify({
        versuche: status.lebensnachweisSendeVersuche,
        erfolge: status.lebensnachweisSendeErfolge,
        fehler: status.lebensnachweisSendeFehler,
        offen: status.lebensnachweisSendeOffen,
        letzterFehler: status.lebensnachweisLetzterFehler
      })
    );
  }

  testApi.test.setzeAktionAktiv('schatten', false);
  testApi.test.setzeAktionAktiv('kontrolliert-live', false);
  testApi.test.setzeAktionAktiv('soak', false);
  testApi.test.setzeStatus(
    'laeuft',
    'Immutable Runtime 1.1.5 wird geladen und danach bewusst aktiv gestartet. Kontrolliert live bleibt bis zu einem bestaetigten echten Produktionsheartbeat gesperrt.'
  );

  void Promise.resolve(bootstrap.lade()).then(async (bootstrapStatus) => {
    const runtime = globalThis.V4ProduktionsLaufzeit;
    if (!runtime || runtime.version !== '1.1.5' || typeof runtime.starte !== 'function') {
      throw new Error('Geladene Runtime ist nicht die erwartete startfaehige Version 1.1.5.');
    }

    const vorStart = runtime.status();
    if (
      vorStart.aktivFreigegeben !== true ||
      vorStart.empfangInstalliert !== false ||
      vorStart.lebensnachweisAutomatikAktiv !== false ||
      vorStart.lebensnachweisSendeVersuche !== 0
    ) {
      throw new Error('Livepaket erwartet vor starte() eine aktive, aber noch nicht gestartete Runtime mit 0 Heartbeat-Versuchen.');
    }

    runtime.starte();
    const status = await warteAufBestaetigtenHeartbeat(runtime);
    const basis = runtime.basisBedienStatus();

    const fehler = [];
    if (bootstrapStatus.geladenVon !== 'https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/88185523c81687dc16f9647ca5e7568c5e2c228c/aio-v4-runtime.js') fehler.push('immutable Runtime-URL');
    if (bootstrapStatus.geladenerSha256 !== '95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f') fehler.push('Runtime-SHA-256');
    if (status.aktivFreigegeben !== true) fehler.push('aktivFreigegeben=true');
    if (status.gestoppt !== false) fehler.push('gestoppt=false');
    if (status.empfangInstalliert !== true) fehler.push('empfangInstalliert=true');
    if (status.lebensnachweisAutomatikAktiv !== true) fehler.push('Heartbeat aktiv');
    if (status.lebensnachweisAutomatikPausiert !== false) fehler.push('Heartbeat nicht pausiert');
    if (status.lebensnachweisSendeVersuche < 1) fehler.push('Heartbeat-Versuche>=1');
    if (status.lebensnachweisSendeErfolge < 1) fehler.push('Heartbeat-Erfolge>=1');
    if (status.lebensnachweisSendeFehler !== 0) fehler.push('Heartbeat-Fehler=0');
    if (status.lebensnachweisSendeOffen !== 0) fehler.push('Heartbeat-Offen=0');
    if (status.performanceTrickErforderlich === true && status.performanceTrickAufgerufen !== true) {
      fehler.push('performance_trick bestaetigt');
    }
    if (status.liveSmokeInstalliert === true) fehler.push('kein Live-Smoke');
    if (status.gruppenZielVorbereitungVerbraucht === true) fehler.push('keine Gruppenziel-Vorbereitung');
    if (basis?.laufzeit?.zustand !== 'laeuft') fehler.push('LaufzeitSteuerung=laeuft');
    if (basis?.laufzeit?.generation !== 0) fehler.push('Generation=0');
    if (basis?.laufzeit?.automatischeFortsetzung !== false) fehler.push('automatischeFortsetzung=false');

    if (fehler.length > 0) {
      throw new Error('Kontrollierter Live-Preflight fehlgeschlagen: ' + fehler.join(', '));
    }

    zustand.phase = 'bereit';
    zustand.bereit = true;
    zustand.heartbeatErfolge = status.lebensnachweisSendeErfolge;
    zustand.heartbeatVersuche = status.lebensnachweisSendeVersuche;
    testApi.test.protokolliere('Kontrollierter Live-Launcher bereit', Object.freeze({
      laufKennung: zustand.laufKennung,
      runtimeVersion: runtime.version,
      runtimeUrl: bootstrapStatus.geladenVon,
      runtimeSha256: bootstrapStatus.geladenerSha256,
      aktivFreigegeben: status.aktivFreigegeben,
      empfangInstalliert: status.empfangInstalliert,
      heartbeatAktiv: status.lebensnachweisAutomatikAktiv,
      heartbeatVersuche: status.lebensnachweisSendeVersuche,
      heartbeatErfolge: status.lebensnachweisSendeErfolge,
      heartbeatFehler: status.lebensnachweisSendeFehler,
      generation: basis.laufzeit.generation,
      schattenNachweisKennung:
        globalThis.AIO_V4_BLOCK85_FREIGABE_CONFIG.schattenUebergabe.nachweis.nachweisKennung
    }));
    testApi.test.setzeStatus(
      'bereit',
      'Live-Preflight bestanden: Runtime aktiv, echter Produktionsheartbeat bestaetigt, Schattennachweis gebunden. Jetzt nur „2 · Kontrolliert live“ mit dem angezeigten Bestaetigungstext ausfuehren.'
    );
    testApi.test.setzeAktionAktiv('kontrolliert-live', true);
  }).catch((ursache) => {
    const meldung = ursache instanceof Error ? ursache.message : String(ursache);
    zustand.phase = 'fehlgeschlagen';
    zustand.bereit = false;
    zustand.fehler = meldung;
    testApi.test.setzeAktionAktiv('kontrolliert-live', false);
    testApi.test.setzeAktionAktiv('soak', false);
    testApi.test.setzeErgebnis(
      Object.freeze({ status: 'fehlgeschlagen', fehler: meldung }),
      'fail',
      meldung
    );
    testApi.test.protokolliere('Kontrollierter Live-Launcher FEHLER', meldung);
  });
})();
/* ===== END kontrollierter Live-Launcher ===== */
