/* GENERATED: V4 Block 8 Live-Test-Komplettpaket.
 * Quelle: block8-live-test-paket-bauen.mjs
 * Keine Adventure-Land-Aktionsfunktion wird in der GUI direkt aufgerufen.
 */
globalThis.AIO_V4_RUNTIME_CONFIG = Object.freeze({
  aktivFreigegeben: true,
  ablaufKennung: 'block8-gui-live-test',
  vertrauensNamen: Object.freeze(['My_Ranger1', 'My_Ranger2']),
  faehigkeiten: Object.freeze({
    heilen: 0,
    schaden: 1,
    aggro: 0,
    schutz: 0,
    unterstuetzung: 0
  })
});

globalThis.AIO_V4_BOOTSTRAP_CONFIG = Object.freeze({
  runtimeUrl: 'https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/47288ddfdef03ded63142670cdaca5d7ed251a75/aio-v4-runtime.js',
  runtimeSha256: '8e50143a671a8ce30d14150cb14971c20c89daa5dbb651064dfb1ea4f13cdcfa'
});

globalThis.AIO_V4_LIVE_TEST_GUI_CONFIG = Object.freeze({
  leiterName: 'My_Ranger1'
});


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


/* ===== BEGIN werkzeuge/block8-gruppenziel-live-smoke.js ===== */
(() => {
  'use strict';

  const API_NAME = 'V4Block8GruppenZielLiveSmokeRunner';
  const VERSION = '1.0.0';
  const PRODUKTIONS_API_NAME = 'V4Block8GruppenZielLiveSmoke';
  const START_TEXT = 'BLOCK8-GRUPPENZIEL-LIVE-SMOKE-STARTEN';
  const VORSCHAU_MAXIMAL_ALTER_MS = 5_000;

  let letzteVorschau = null;
  let letzterBericht = null;
  let versuchGestartet = false;

  function holeElternFenster() {
    try {
      if (typeof parent !== 'undefined' && parent && parent !== globalThis) return parent;
    } catch {
      // Kein nutzbarer Parent-Kontext.
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

  function ausgeben(wert, titel) {
    try {
      const konsole = holeGlobal('V4Testkonsole');
      if (konsole?.ausgeben) konsole.ausgeben(wert, titel);
      else console.log(titel, wert);
    } catch {
      // Diagnose darf den Smoke nicht beeinflussen.
    }
  }

  function produktionsSmoke() {
    const api = holeGlobal(PRODUKTIONS_API_NAME);
    if (!api || typeof api !== 'object') {
      throw new Error(`${PRODUKTIONS_API_NAME} ist nicht installiert; Live-Smoke bleibt blockiert.`);
    }
    if (api.quelleBereich !== 'ausfuehrung' || api.modus !== 'one-shot-live-smoke') {
      throw new Error(`${PRODUKTIONS_API_NAME} besitzt nicht den erwarteten Produktionsvertrag.`);
    }
    for (const name of ['status', 'vorschau', 'freigeben', 'sperren', 'starte', 'ergebnis', 'freigabeText']) {
      if (typeof api[name] !== 'function') throw new Error(`${PRODUKTIONS_API_NAME} ist unvollstaendig: ${name} fehlt.`);
    }
    return api;
  }

  function status() {
    let produktionsStatus = null;
    let produktionsSmokeVerfuegbar = false;
    try {
      const api = produktionsSmoke();
      produktionsStatus = api.status();
      produktionsSmokeVerfuegbar = true;
    } catch {
      produktionsSmokeVerfuegbar = false;
    }
    return Object.freeze({
      schemaVersion: 1,
      werkzeug: API_NAME,
      version: VERSION,
      produktionsSmokeVerfuegbar,
      produktionsStatus,
      letzteVorschau: letzteVorschau?.wert ?? null,
      vorschauAlterMillisekunden: letzteVorschau ? Math.max(0, Date.now() - letzteVorschau.beobachtetAm) : null,
      versuchGestartet,
      letzterBericht,
      echteSpielaktionenDurchRunner: false
    });
  }

  function vorschau() {
    if (versuchGestartet) throw new Error('Der Runner hat seinen einzigen Live-Smoke-Versuch bereits gestartet.');
    const api = produktionsSmoke();
    const wert = api.vorschau();
    letzteVorschau = Object.freeze({ beobachtetAm: Date.now(), wert });
    const ergebnis = status();
    ausgeben(ergebnis, 'Block 8 Gruppenziel Live-Smoke · Produktionsvorschau');
    return ergebnis;
  }

  function sperren() {
    letzteVorschau = null;
    const api = produktionsSmoke();
    const produktionsStatus = api.sperren();
    const ergebnis = Object.freeze({ ...status(), produktionsStatus });
    ausgeben(ergebnis, 'Block 8 Gruppenziel Live-Smoke · gesperrt');
    return ergebnis;
  }

  async function starte(text) {
    if (text !== START_TEXT) {
      throw new Error(`Falscher Live-Smoke-Starttext. Erwartet wird exakt: ${START_TEXT}`);
    }
    if (versuchGestartet) throw new Error('Der Runner hat seinen einzigen Live-Smoke-Versuch bereits gestartet.');
    if (!letzteVorschau) throw new Error('Vor dem Live-Smoke-Start muss die Produktionsvorschau explizit angezeigt werden.');
    const alter = Date.now() - letzteVorschau.beobachtetAm;
    if (!Number.isFinite(alter) || alter < 0 || alter > VORSCHAU_MAXIMAL_ALTER_MS) {
      letzteVorschau = null;
      throw new Error('Die angezeigte Produktionsvorschau ist fuer den Live-Smoke zu alt.');
    }

    const api = produktionsSmoke();
    versuchGestartet = true;
    const produktionsFreigabeText = api.freigabeText();
    if (typeof produktionsFreigabeText !== 'string' || produktionsFreigabeText.length === 0) {
      throw new Error('Die Produktions-Smoke-Fassade lieferte keinen gueltigen Freigabetext.');
    }

    try {
      api.freigeben(produktionsFreigabeText);
      letzteVorschau = null;
      letzterBericht = await api.starte();
      ausgeben(letzterBericht, 'Block 8 Gruppenziel Live-Smoke · Abschlussbericht');
      return letzterBericht;
    } catch (fehler) {
      letzteVorschau = null;
      try { api.sperren(); } catch { /* Fail-safe Best-Effort; Produktionsschicht bleibt one-shot. */ }
      letzterBericht = api.ergebnis?.() ?? Object.freeze({
        schemaVersion: 1,
        werkzeug: API_NAME,
        version: VERSION,
        status: 'fehlgeschlagen',
        fehler: fehler instanceof Error ? fehler.message : String(fehler)
      });
      ausgeben(letzterBericht, 'Block 8 Gruppenziel Live-Smoke · fehlgeschlagen');
      throw fehler;
    }
  }

  const api = Object.freeze({
    version: VERSION,
    status,
    vorschau,
    sperren,
    starte,
    ergebnis() { return letzterBericht; },
    startText() { return START_TEXT; }
  });

  globalThis[API_NAME] = api;
  try {
    const eltern = holeElternFenster();
    if (eltern) eltern[API_NAME] = api;
  } catch {
    // Lokale API bleibt verfuegbar.
  }

  ausgeben({
    version: VERSION,
    status: 'V4Block8GruppenZielLiveSmokeRunner.status()',
    vorschau: 'V4Block8GruppenZielLiveSmokeRunner.vorschau()',
    start: `await V4Block8GruppenZielLiveSmokeRunner.starte("${START_TEXT}")`,
    sperren: 'V4Block8GruppenZielLiveSmokeRunner.sperren()',
    sicherheit: 'Der Runner besitzt keinen Adventure-Land-Aktionsaufruf. Er startet maximal einen bereits installierten Produktions-Smoke nach frischer Vorschau.'
  }, 'Block-8-Gruppenziel-Live-Smoke-Runner bereit');
})();
/* ===== END werkzeuge/block8-gruppenziel-live-smoke.js ===== */


/* ===== BEGIN werkzeuge/block8-produktions-live-test-gui.js ===== */
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
/* ===== END werkzeuge/block8-produktions-live-test-gui.js ===== */
