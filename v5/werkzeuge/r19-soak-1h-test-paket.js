/* AUTO-GENERIERT: V5 R19 SOAK_1H Ingame-Testpaket
 * Quellen:
 * - v5/werkzeuge/v5-adventure-land-test-gui.js
 * - v5/werkzeuge/r19-soak-1h-test-gui.js
 * Nicht manuell bearbeiten.
 */

(() => {
  'use strict';

  const API_NAME = 'V5TestGui';
  const VERSION = '1.0.0';
  const STIL_ID = 'v5-test-gui-stil';
  const STATUS = Object.freeze(['bereit', 'laeuft', 'bestanden', 'blockiert', 'fehler', 'warnung', 'info']);

  function elternFenster() {
    try {
      if (typeof parent !== 'undefined' && parent && parent !== globalThis) return parent;
    } catch {}
    return null;
  }

  function dokument() {
    const eltern = elternFenster();
    try {
      if (eltern?.document?.body) return eltern.document;
    } catch {}
    if (typeof document !== 'undefined' && document?.body) return document;
    throw new Error('V5_TEST_GUI_DOKUMENT_FEHLT');
  }

  function sichereKennung(wert) {
    return String(wert ?? '').trim().toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'test';
  }

  function fehlerText(fehler) {
    return fehler instanceof Error ? fehler.message : String(fehler);
  }

  function begrenzeWert(wert, tiefe = 0, gesehen = new WeakSet()) {
    if (wert === null || wert === undefined || typeof wert === 'string'
        || typeof wert === 'number' || typeof wert === 'boolean') return wert ?? null;
    if (typeof wert === 'bigint') return String(wert) + 'n';
    if (typeof wert === 'function') return '[Funktion ' + (wert.name || 'anonym') + ']';
    if (typeof wert !== 'object') return String(wert);
    if (wert instanceof Error) return { name: wert.name, meldung: wert.message, stapel: wert.stack ?? null };
    if (gesehen.has(wert)) return '[Zirkulaere Referenz]';
    if (tiefe >= 7) return '[Maximale Tiefe erreicht]';
    gesehen.add(wert);
    if (Array.isArray(wert)) return wert.slice(0, 250).map(x => begrenzeWert(x, tiefe + 1, gesehen));
    const out = {};
    let count = 0;
    for (const name of Object.keys(wert)) {
      count += 1;
      if (count > 600) {
        out['[abgeschnitten]'] = true;
        break;
      }
      try { out[name] = begrenzeWert(wert[name], tiefe + 1, gesehen); }
      catch (error) { out[name] = '[Lesefehler: ' + fehlerText(error) + ']'; }
    }
    return out;
  }

  function format(wert) {
    try { return JSON.stringify(begrenzeWert(wert), null, 2); }
    catch { return String(wert); }
  }

  async function kopiereText(doc, text) {
    const eltern = elternFenster();
    try {
      const nav = eltern?.navigator ?? globalThis.navigator;
      if (nav?.clipboard?.writeText) {
        await nav.clipboard.writeText(text);
        return true;
      }
    } catch {}

    const feld = doc.createElement('textarea');
    feld.value = text;
    feld.setAttribute('readonly', '');
    feld.style.position = 'fixed';
    feld.style.left = '-10000px';
    feld.style.top = '0';
    doc.body.appendChild(feld);
    feld.select();
    let ok = false;
    try { ok = doc.execCommand('copy'); }
    finally { feld.remove(); }
    return ok;
  }

  function style(doc) {
    if (doc.getElementById(STIL_ID)) return;
    const css = doc.createElement('style');
    css.id = STIL_ID;
    css.textContent = [
      '.v5tg{position:fixed;right:14px;top:14px;z-index:2147483647;width:min(620px,calc(100vw - 28px));max-height:92vh;display:flex;flex-direction:column;overflow:hidden;border:1px solid rgba(255,255,255,.18);border-radius:13px;background:rgba(12,15,21,.985);color:#eef4ff;box-shadow:0 16px 50px rgba(0,0,0,.60);font:13px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}',
      '.v5tg *{box-sizing:border-box}.v5tg button,.v5tg input,.v5tg textarea{font:inherit}.v5tg-kopf{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.11);background:rgba(255,255,255,.04)}',
      '.v5tg-titel{font-weight:800;flex:1;min-width:0}.v5tg-version{opacity:.55;font-size:11px}.v5tg-status{padding:3px 8px;border-radius:999px;font-size:11px;font-weight:800;text-transform:uppercase;background:rgba(255,255,255,.10)}',
      '.v5tg-status[data-status="bestanden"]{background:rgba(55,200,110,.22);color:#9ff0bb}.v5tg-status[data-status="fehler"]{background:rgba(255,82,82,.22);color:#ffb1b1}.v5tg-status[data-status="blockiert"]{background:rgba(255,145,55,.22);color:#ffd0a1}.v5tg-status[data-status="warnung"]{background:rgba(255,184,60,.22);color:#ffe0a3}.v5tg-status[data-status="laeuft"]{background:rgba(75,150,255,.22);color:#b7d6ff}',
      '.v5tg-inhalt{overflow:auto;padding:10px 12px}.v5tg-beschreibung{margin:0 0 10px;color:#c7d2e3}.v5tg-status-text{padding:8px 9px;margin-bottom:10px;border-radius:7px;background:rgba(255,255,255,.05);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}',
      '.v5tg-aktionen{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:10px}.v5tg button{border:1px solid rgba(255,255,255,.16);border-radius:7px;padding:7px 10px;background:rgba(255,255,255,.08);color:inherit;cursor:pointer}.v5tg button:hover:not(:disabled){background:rgba(255,255,255,.15)}.v5tg button:disabled{opacity:.38;cursor:not-allowed}.v5tg button[data-art="primaer"]{background:rgba(73,141,255,.25)}.v5tg button[data-art="gefahr"]{background:rgba(200,73,73,.24);border-color:rgba(255,100,100,.38)}',
      '.v5tg-bestaetigung{display:none;padding:9px;margin:0 0 10px;border:1px solid rgba(255,178,61,.30);border-radius:8px;background:rgba(255,178,61,.08)}.v5tg-bestaetigung.sichtbar{display:block}.v5tg-bestaetigung label{display:block;margin-bottom:5px;color:#ffe0a3}.v5tg-bestaetigung code{user-select:all}.v5tg-bestaetigung input{width:100%;padding:7px 8px;border:1px solid rgba(255,255,255,.18);border-radius:6px;background:rgba(0,0,0,.28);color:#fff}',
      '.v5tg-ergebnis-kopf,.v5tg-log-kopf{display:flex;align-items:center;gap:8px;margin:10px 0 5px}.v5tg-ergebnis-kopf strong,.v5tg-log-kopf strong{flex:1}.v5tg textarea{width:100%;min-height:190px;max-height:350px;resize:vertical;padding:9px;border:1px solid rgba(255,255,255,.15);border-radius:7px;background:rgba(0,0,0,.28);color:#eaf1ff;font:12px/1.45 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;white-space:pre}',
      '.v5tg-log{max-height:170px;overflow:auto;padding:8px;border:1px solid rgba(255,255,255,.10);border-radius:7px;background:rgba(0,0,0,.20);font:11px/1.45 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;white-space:pre-wrap;overflow-wrap:anywhere}.v5tg-fuss{display:flex;flex-wrap:wrap;gap:7px;padding-top:10px}.v5tg-minimiert .v5tg-inhalt{display:none}',
      '@media(max-width:650px){.v5tg{right:6px;top:6px;width:calc(100vw - 12px);max-height:95vh}}'
    ].join('');
    doc.head.appendChild(css);
  }

  function erstelleTest(optionen = {}) {
    const doc = dokument();
    style(doc);
    const kennung = sichereKennung(optionen.kennung);
    const elementId = 'v5-test-gui-' + kennung;
    doc.getElementById(elementId)?.remove();

    const zustand = {
      status: 'bereit',
      statusText: 'Bereit.',
      ergebnis: null,
      protokoll: [],
      aktionen: new Map(),
      gestartetAm: new Date().toISOString()
    };

    const root = doc.createElement('section');
    root.id = elementId;
    root.className = 'v5tg';
    root.innerHTML = [
      '<div class="v5tg-kopf">',
      '<div class="v5tg-titel"></div>',
      '<span class="v5tg-version">V5 GUI v' + VERSION + '</span>',
      '<span class="v5tg-status" data-status="bereit">BEREIT</span>',
      '<button type="button" data-aktion="minimieren" title="Minimieren">–</button>',
      '<button type="button" data-aktion="schliessen" title="Schliessen">×</button>',
      '</div>',
      '<div class="v5tg-inhalt">',
      '<p class="v5tg-beschreibung"></p>',
      '<div class="v5tg-status-text">Bereit.</div>',
      '<div class="v5tg-aktionen"></div>',
      '<div class="v5tg-bestaetigung"><label>Zur Freigabe exakt eingeben: <code></code></label><input type="text" autocomplete="off" spellcheck="false"></div>',
      '<div class="v5tg-ergebnis-kopf"><strong>Testergebnis</strong><button type="button" data-aktion="ergebnis-kopieren">Ergebnis kopieren</button></div>',
      '<textarea class="v5tg-ergebnis" readonly spellcheck="false">Noch kein Ergebnis.</textarea>',
      '<div class="v5tg-log-kopf"><strong>Protokoll</strong><button type="button" data-aktion="bericht-kopieren">Gesamtbericht kopieren</button></div>',
      '<div class="v5tg-log">Noch kein Protokoll.</div>',
      '<div class="v5tg-fuss"><button type="button" data-aktion="protokoll-leeren">Protokoll leeren</button><button type="button" data-aktion="gui-oeffnen">GUI anzeigen</button></div>',
      '</div>'
    ].join('');
    doc.body.appendChild(root);

    const titel = root.querySelector('.v5tg-titel');
    const beschreibung = root.querySelector('.v5tg-beschreibung');
    const statusEl = root.querySelector('.v5tg-status');
    const statusText = root.querySelector('.v5tg-status-text');
    const aktionen = root.querySelector('.v5tg-aktionen');
    const bestaetigung = root.querySelector('.v5tg-bestaetigung');
    const bestaetigungCode = bestaetigung.querySelector('code');
    const bestaetigungInput = bestaetigung.querySelector('input');
    const ergebnis = root.querySelector('.v5tg-ergebnis');
    const log = root.querySelector('.v5tg-log');

    titel.textContent = optionen.titel || 'V5 Test';
    beschreibung.textContent = optionen.beschreibung || '';

    function zeit() { return new Date().toISOString(); }

    function setzeStatus(status, text = '') {
      if (!STATUS.includes(status)) throw new Error('V5_TEST_GUI_STATUS_UNGUELTIG:' + status);
      zustand.status = status;
      zustand.statusText = text || status;
      statusEl.dataset.status = status;
      statusEl.textContent = status.toUpperCase();
      statusText.textContent = zustand.statusText;
      return status;
    }

    function protokolliere(text, wert) {
      const zeile = wert === undefined
        ? '[' + zeit() + '] ' + String(text)
        : '[' + zeit() + '] ' + String(text) + ': ' + (typeof wert === 'string' ? wert : format(wert));
      zustand.protokoll.push(zeile);
      if (zustand.protokoll.length > 300) zustand.protokoll.shift();
      log.textContent = zustand.protokoll.join('\n\n');
      log.scrollTop = log.scrollHeight;
      return zeile;
    }

    function setzeErgebnis(wert, status = null, text = '') {
      zustand.ergebnis = begrenzeWert(wert);
      ergebnis.value = format(zustand.ergebnis);
      if (status !== null) setzeStatus(status, text);
      return zustand.ergebnis;
    }

    function berichtText() {
      return [
        'V5 TESTBERICHT',
        'Test: ' + (optionen.titel || kennung),
        'Kennung: ' + kennung,
        'GUI-Version: ' + VERSION,
        'Status: ' + zustand.status.toUpperCase(),
        'Status-Text: ' + zustand.statusText,
        'Gestartet: ' + zustand.gestartetAm,
        'Erstellt: ' + zeit(),
        '',
        '=== ERGEBNIS ===',
        ergebnis.value,
        '',
        '=== PROTOKOLL ===',
        zustand.protokoll.length ? zustand.protokoll.join('\n\n') : 'Kein Protokoll.'
      ].join('\n');
    }

    function setzeBestaetigung(text) {
      const wert = typeof text === 'string' && text.length > 0 ? text : null;
      if (wert === null) {
        bestaetigung.classList.remove('sichtbar');
        bestaetigungCode.textContent = '';
        bestaetigungInput.value = '';
        return;
      }
      bestaetigungCode.textContent = wert;
      bestaetigung.classList.add('sichtbar');
      bestaetigungInput.value = '';
      bestaetigungInput.focus();
    }

    function registriereAktion(aktion) {
      if (!aktion || typeof aktion !== 'object' || typeof aktion.ausfuehren !== 'function') {
        throw new Error('V5_TEST_GUI_AKTION_UNGUELTIG');
      }
      const id = sichereKennung(aktion.kennung);
      if (zustand.aktionen.has(id)) throw new Error('V5_TEST_GUI_AKTION_DOPPELT:' + id);
      const button = doc.createElement('button');
      button.type = 'button';
      button.textContent = aktion.titel || id;
      button.dataset.art = aktion.art || 'normal';
      button.disabled = aktion.aktiviert === false;
      const row = { ...aktion, kennung: id, button };
      zustand.aktionen.set(id, row);

      button.addEventListener('click', async () => {
        if (button.disabled) return;
        const confirm = typeof row.bestaetigungsText === 'string' ? row.bestaetigungsText : null;
        if (confirm !== null && bestaetigungInput.value !== confirm) {
          setzeBestaetigung(confirm);
          setzeStatus('warnung', 'Bestaetigung fehlt oder stimmt nicht exakt.');
          protokolliere('Aktion blockiert: ' + id + ' / Bestaetigung fehlt.');
          return;
        }

        button.disabled = true;
        setzeStatus('laeuft', (row.titel || id) + ' laeuft ...');
        protokolliere('Aktion gestartet: ' + (row.titel || id));
        try {
          const result = await row.ausfuehren();
          protokolliere('Aktion abgeschlossen: ' + (row.titel || id));
          if (confirm !== null) setzeBestaetigung(null);
          if (zustand.status === 'laeuft') setzeStatus('info', (row.titel || id) + ' abgeschlossen.');
          return result;
        } catch (error) {
          const msg = fehlerText(error);
          setzeErgebnis({ status: 'FEHLER', fehler: msg }, 'fehler', msg);
          protokolliere('FEHLER ' + (row.titel || id), msg);
          return undefined;
        } finally {
          if (row.einmalig !== true) button.disabled = false;
        }
      });
      aktionen.appendChild(button);
      return id;
    }

    function setzeAktionAktiv(id, aktiv) {
      const row = zustand.aktionen.get(sichereKennung(id));
      if (!row) return false;
      row.button.disabled = aktiv !== true;
      return true;
    }

    async function kopiereErgebnis() { return kopiereText(doc, ergebnis.value); }
    async function kopiereBericht() { return kopiereText(doc, berichtText()); }

    root.querySelector('[data-aktion="ergebnis-kopieren"]').addEventListener('click', async e => {
      const button = e.currentTarget;
      const alt = button.textContent;
      button.textContent = await kopiereErgebnis() ? 'Kopiert ✓' : 'Kopieren fehlgeschlagen';
      setTimeout(() => { button.textContent = alt; }, 1500);
    });
    root.querySelector('[data-aktion="bericht-kopieren"]').addEventListener('click', async e => {
      const button = e.currentTarget;
      const alt = button.textContent;
      button.textContent = await kopiereBericht() ? 'Kopiert ✓' : 'Kopieren fehlgeschlagen';
      setTimeout(() => { button.textContent = alt; }, 1500);
    });
    root.querySelector('[data-aktion="protokoll-leeren"]').addEventListener('click', () => {
      zustand.protokoll.length = 0;
      log.textContent = 'Noch kein Protokoll.';
    });
    root.querySelector('[data-aktion="minimieren"]').addEventListener('click', e => {
      const min = root.classList.toggle('v5tg-minimiert');
      e.currentTarget.textContent = min ? '+' : '–';
    });
    root.querySelector('[data-aktion="schliessen"]').addEventListener('click', () => { root.style.display = 'none'; });
    root.querySelector('[data-aktion="gui-oeffnen"]').addEventListener('click', () => { root.style.display = 'flex'; });

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
      oeffnen() { root.style.display = 'flex'; },
      schliessen() { root.style.display = 'none'; },
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

  const api = Object.freeze({ version: VERSION, erstelleTest, formatiereWert: format });

  try { delete globalThis[API_NAME]; } catch {}
  Object.defineProperty(globalThis, API_NAME, { configurable: true, enumerable: true, writable: false, value: api });
  try {
    const eltern = elternFenster();
    if (eltern) {
      try { delete eltern[API_NAME]; } catch {}
      Object.defineProperty(eltern, API_NAME, { configurable: true, enumerable: true, writable: false, value: api });
    }
  } catch {}
})();

(() => {
  'use strict';

  const API_NAME = 'V5R19Soak1hGui';
  const VERSION = '1.0.0';
  const SESSION_KEY = 'AIO_V5_R19_SOAK_1H_SESSION_V1';
  const PROBE_KEY = 'AIO_V5_R19_SOAK_1H_PROBE_V1';
  const BESTAETIGUNG = 'R19-SOAK-1H-START';
  const DAUER_MS = 60 * 60 * 1000;
  const INTERVALL_MS = 30 * 1000;
  const MAX_SAMPLE_GAP_MS = 90 * 1000;
  const MAX_SAMPLES = 130;
  const MIN_FREIE_BYTES = 64 * 1024 * 1024;
  const MAX_BROWSER_PERSISTENZ_ROUNDTRIP_MS = 250;
  const MAX_HEAP_WACHSTUM_BYTES = 512 * 1024 * 1024;

  function rootFenster() {
    const kandidaten = [];
    try { kandidaten.push(globalThis); } catch {}
    try { if (parent && parent !== globalThis) kandidaten.push(parent); } catch {}
    for (const root of kandidaten) {
      try {
        if (root?.character && Array.isArray(root.character.items) && root.character.slots && root.G?.items) return root;
      } catch {}
    }
    throw new Error('R19_SOAK_ADVENTURE_LAND_CODEKONTEXT_FEHLT');
  }

  function guiApi() {
    try { if (globalThis.V5TestGui) return globalThis.V5TestGui; } catch {}
    try { if (parent?.V5TestGui) return parent.V5TestGui; } catch {}
    throw new Error('V5_TEST_GUI_FEHLT');
  }

  function storage() {
    const root = rootFenster();
    try { if (root.localStorage) return root.localStorage; } catch {}
    try { if (globalThis.localStorage) return globalThis.localStorage; } catch {}
    throw new Error('R19_SOAK_STORAGE_FEHLT');
  }

  function browserRoot() {
    try {
      if (parent && parent !== globalThis) return parent;
    } catch {}
    return globalThis;
  }

  function runtimeStatus() {
    const roots = [];
    try { roots.push(globalThis); } catch {}
    try { if (parent && parent !== globalThis) roots.push(parent); } catch {}
    let v3 = { vorhanden: false, aktiv: false };
    let v4 = { vorhanden: false, aktiv: false };
    for (const root of roots) {
      try {
        const runtime = root?.AIO_V3?.__runtime;
        if (runtime) {
          const status = typeof runtime.status === 'function' ? runtime.status() : null;
          v3 = { vorhanden: true, aktiv: !!(runtime.timer || status?.running === true) };
        }
      } catch {
        v3 = { vorhanden: true, aktiv: true };
      }
      try {
        const runtime = root?.V4ProduktionsLaufzeit || root?.AIO_V4 || root?.V4Runtime;
        if (runtime) {
          const status = typeof runtime.status === 'function' ? runtime.status() : null;
          v4 = {
            vorhanden: true,
            aktiv: !!(status && (
              status.running === true ||
              status.aktivFreigegeben === true ||
              status.gestoppt === false ||
              status.empfangInstalliert === true
            ))
          };
        }
      } catch {
        v4 = { vorhanden: true, aktiv: true };
      }
    }
    return { v3, v4, alternativeRuntimeAktiv: v3.aktiv || v4.aktiv };
  }

  function performanceApi() {
    const root = browserRoot();
    return root.performance || globalThis.performance;
  }

  function navigatorApi() {
    const root = browserRoot();
    return root.navigator || globalThis.navigator;
  }

  function heapSnapshot() {
    const perf = performanceApi();
    const memory = perf?.memory;
    if (!memory || !Number.isFinite(memory.usedJSHeapSize) || !Number.isFinite(memory.jsHeapSizeLimit)) {
      return { unterstuetzt: false, usedJSHeapSize: null, jsHeapSizeLimit: null };
    }
    return {
      unterstuetzt: true,
      usedJSHeapSize: Math.trunc(memory.usedJSHeapSize),
      jsHeapSizeLimit: Math.trunc(memory.jsHeapSizeLimit)
    };
  }

  async function storageSchaetzung() {
    const nav = navigatorApi();
    if (!nav?.storage?.estimate) {
      return { unterstuetzt: false, quota: null, usage: null, freieBytes: null };
    }
    try {
      const e = await nav.storage.estimate();
      const quota = Number.isFinite(e?.quota) ? Math.trunc(e.quota) : null;
      const usage = Number.isFinite(e?.usage) ? Math.trunc(e.usage) : null;
      const freieBytes = quota !== null && usage !== null ? Math.max(0, quota - usage) : null;
      return { unterstuetzt: quota !== null && usage !== null, quota, usage, freieBytes };
    } catch {
      return { unterstuetzt: false, quota: null, usage: null, freieBytes: null };
    }
  }

  function persistenzRoundtrip() {
    const store = storage();
    const perf = performanceApi();
    const now = () => typeof perf?.now === 'function' ? perf.now() : Date.now();
    const wert = JSON.stringify({ zeit: Date.now(), probe: 'R19_SOAK_1H' });
    const start = now();
    store.setItem(PROBE_KEY, wert);
    const gelesen = store.getItem(PROBE_KEY);
    store.removeItem(PROBE_KEY);
    const ms = Math.max(0, now() - start);
    return { ok: gelesen === wert, roundtripMs: ms };
  }

  function hashText(text) {
    let hash = 2166136261 >>> 0;
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619) >>> 0;
    }
    return hash.toString(16).padStart(8, '0');
  }

  function fingerprint(sampleOhneFingerprint) {
    return hashText(JSON.stringify(sampleOhneFingerprint));
  }

  function liesSession() {
    const raw = storage().getItem(SESSION_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); }
    catch { return { status: 'BESCHAEDIGT', samples: [] }; }
  }

  function schreibeSession(session) {
    const text = JSON.stringify(session);
    if (text.length > 900_000) throw new Error('R19_SOAK_SESSION_ZU_GROSS');
    const store = storage();
    store.setItem(SESSION_KEY, text);
    if (store.getItem(SESSION_KEY) !== text) throw new Error('R19_SOAK_SESSION_ROUNDTRIP_FEHLER');
  }

  function validiereKette(samples) {
    if (!Array.isArray(samples) || samples.length > MAX_SAMPLES) return false;
    let vorher = null;
    for (let i = 0; i < samples.length; i += 1) {
      const s = samples[i];
      if (!s || s.sequenz !== i + 1 || s.vorherigerFingerprint !== vorher) return false;
      const basis = { ...s };
      delete basis.evidenceFingerprint;
      if (s.evidenceFingerprint !== fingerprint(basis)) return false;
      vorher = s.evidenceFingerprint;
    }
    return true;
  }

  async function sampleErstellen(session) {
    const root = rootFenster();
    const c = root.character;
    const jetztMs = Date.now();
    const vorher = session.samples.at(-1) || null;
    const gapMs = vorher ? jetztMs - vorher.zeitMs : 0;
    const heap = heapSnapshot();
    const storageEstimate = await storageSchaetzung();
    const persistenz = persistenzRoundtrip();
    const runtime = runtimeStatus();

    const basis = {
      schemaVersion: 1,
      sequenz: session.samples.length + 1,
      zeitMs: jetztMs,
      seitStartMs: jetztMs - session.gestartetAmMs,
      vorherigerFingerprint: vorher?.evidenceFingerprint ?? null,
      gapMs,
      charakter: String(c?.name || ''),
      rip: !!c?.rip,
      runtime,
      heap,
      storage: storageEstimate,
      browserPersistenzRoundtripMs: persistenz.roundtripMs,
      browserPersistenzOk: persistenz.ok,
      interneIoQueueTiefe: 0,
      recorderDrops: session.recorderDrops,
      gameplayWritesDurchHarness: 0,
      unerwarteteGameWritesImHarness: 0,
      breiteRuntimeFreigabe: false
    };
    return Object.freeze({ ...basis, evidenceFingerprint: fingerprint(basis) });
  }

  function bewerte(session) {
    const samples = session.samples;
    const erster = samples[0];
    const letzter = samples.at(-1);
    const gaps = samples.filter(s => s.gapMs > MAX_SAMPLE_GAP_MS).length;
    const heapFehlt = samples.some(s => s.heap?.unterstuetzt !== true);
    const storageFehlt = samples.some(s => s.storage?.unterstuetzt !== true);
    const persistenzFehler = samples.filter(s => s.browserPersistenzOk !== true).length;
    const minFreieBytes = storageFehlt ? null : Math.min(...samples.map(s => s.storage.freieBytes));
    const maxRoundtripMs = Math.max(...samples.map(s => s.browserPersistenzRoundtripMs));
    const ersterHeap = erster?.heap?.usedJSHeapSize ?? null;
    const maxHeap = heapFehlt ? null : Math.max(...samples.map(s => s.heap.usedJSHeapSize));
    const heapWachstumBytes = ersterHeap === null || maxHeap === null ? null : Math.max(0, maxHeap - ersterHeap);
    const alternativeRuntimeSamples = samples.filter(s => s.runtime?.alternativeRuntimeAktiv === true).length;
    const toteSamples = samples.filter(s => s.rip === true).length;
    const dauerMs = letzter ? letzter.zeitMs - session.gestartetAmMs : 0;
    const genugSamples = samples.length >= 120;
    const grenzen = {
      dauerMs: DAUER_MS,
      intervallMs: INTERVALL_MS,
      maximalerSampleGapMs: MAX_SAMPLE_GAP_MS,
      minimaleSamples: 120,
      minimaleFreieBytes: MIN_FREIE_BYTES,
      maximalerBrowserPersistenzRoundtripMs: MAX_BROWSER_PERSISTENZ_ROUNDTRIP_MS,
      maximalesHeapWachstumBytes: MAX_HEAP_WACHSTUM_BYTES
    };
    const blocker = [];
    if (dauerMs < DAUER_MS) blocker.push('DAUER_UNTER_1H');
    if (!genugSamples) blocker.push('ZU_WENIGE_SAMPLES');
    if (!validiereKette(samples)) blocker.push('EVIDENCE_KETTE_UNGUELTIG');
    if (gaps !== 0) blocker.push('SAMPLE_GAPS');
    if (session.recorderDrops !== 0) blocker.push('RECORDER_DROPS');
    if (heapFehlt) blocker.push('HEAP_METRIK_FEHLT');
    if (storageFehlt) blocker.push('STORAGE_ESTIMATE_FEHLT');
    if (persistenzFehler !== 0) blocker.push('BROWSER_PERSISTENZ_FEHLER');
    if (minFreieBytes !== null && minFreieBytes < MIN_FREIE_BYTES) blocker.push('SPEICHERRESERVE_ZU_KLEIN');
    if (maxRoundtripMs > MAX_BROWSER_PERSISTENZ_ROUNDTRIP_MS) blocker.push('BROWSER_PERSISTENZ_ZU_LANGSAM');
    if (heapWachstumBytes !== null && heapWachstumBytes > MAX_HEAP_WACHSTUM_BYTES) blocker.push('HEAP_WACHSTUM_ZU_GROSS');
    if (alternativeRuntimeSamples !== 0) blocker.push('ALTERNATIVE_RUNTIME_AKTIV');
    if (toteSamples !== 0) blocker.push('CHARAKTER_TOT');
    return {
      schemaVersion: 1,
      test: 'R19_SOAK_1H_CANARY_SCOPE',
      phase: 'R19',
      zertifizierungsStufe: 'SOAK_1H',
      status: blocker.length ? 'NICHT_BESTANDEN' : 'BESTANDEN',
      breiteRuntimeFreigabe: false,
      scope: 'CANARY_SCOPE_READ_ONLY_SOAK',
      gameplayWritesDurchHarness: 0,
      unerwarteteGameWritesImHarness: 0,
      sampleAnzahl: samples.length,
      dauerMs,
      sampleGaps: gaps,
      recorderDrops: session.recorderDrops,
      evidenceKetteGueltig: validiereKette(samples),
      ersteEvidence: erster?.evidenceFingerprint ?? null,
      letzteEvidence: letzter?.evidenceFingerprint ?? null,
      ressourcen: {
        heapMetrikUnterstuetzt: !heapFehlt,
        storageEstimateUnterstuetzt: !storageFehlt,
        ersterHeapBytes: ersterHeap,
        maxHeapBytes: maxHeap,
        heapWachstumBytes,
        minFreieBytes,
        maxBrowserPersistenzRoundtripMs: maxRoundtripMs,
        maxInterneIoQueueTiefe: 0,
        browserPersistenzFehler: persistenzFehler
      },
      runtime: {
        alternativeRuntimeSamples,
        toteSamples
      },
      grenzen,
      blocker,
      hinweis: blocker.length
        ? '1h-Soak nicht bestanden. Nicht wiederholen, bevor der Bericht ausgewertet wurde.'
        : '1h-Canary-Scope-Soak bestanden. Diese Evidence gibt die breite Runtime nicht frei.'
    };
  }

  const gui = guiApi().erstelleTest({
    kennung: 'r19-soak-1h',
    titel: 'V5 · R19 SOAK 1H · Canary-Scope',
    beschreibung: 'Lueckenlose 1h-Zeitreihe ohne Gameplay-Writes. Browser-Speicherreserve, Heap, Persistenz-Roundtrip und Sample-Gaps werden fail-closed bewertet.'
  });

  let timer = null;
  let laeuft = false;
  let sampling = false;

  async function passiveVorpruefung() {
    const bestehend = liesSession();
    const root = rootFenster();
    const heap = heapSnapshot();
    const estimate = await storageSchaetzung();
    const persistenz = persistenzRoundtrip();
    const runtime = runtimeStatus();
    const blocker = [];
    if (!String(root.character?.name || '')) blocker.push('CHARAKTER_FEHLT');
    if (root.character?.rip) blocker.push('CHARAKTER_TOT');
    if (runtime.alternativeRuntimeAktiv) blocker.push('ALTERNATIVE_RUNTIME_AKTIV');
    if (!heap.unterstuetzt) blocker.push('HEAP_METRIK_FEHLT');
    if (!estimate.unterstuetzt) blocker.push('STORAGE_ESTIMATE_FEHLT');
    if (estimate.freieBytes !== null && estimate.freieBytes < MIN_FREIE_BYTES) blocker.push('SPEICHERRESERVE_ZU_KLEIN');
    if (!persistenz.ok) blocker.push('BROWSER_PERSISTENZ_FEHLER');
    if (bestehend?.status === 'RUNNING') blocker.push('VORHERIGE_SOAK_SESSION_UNTERBROCHEN');
    return {
      schemaVersion: 1,
      status: blocker.length ? 'BLOCKIERT' : 'BESTANDEN',
      zeitMs: Date.now(),
      charakter: String(root.character?.name || ''),
      runtime,
      heap,
      storage: estimate,
      browserPersistenzRoundtripMs: persistenz.roundtripMs,
      blocker,
      breiteRuntimeFreigabe: false
    };
  }

  async function tick() {
    if (!laeuft || sampling) return;
    sampling = true;
    try {
      const session = liesSession();
      if (!session || session.status !== 'RUNNING') throw new Error('R19_SOAK_SESSION_NICHT_RUNNING');
      if (!validiereKette(session.samples)) throw new Error('R19_SOAK_EVIDENCE_KETTE_MANIPULIERT');
      const sample = await sampleErstellen(session);
      const samples = [...session.samples, sample];
      if (samples.length > MAX_SAMPLES) throw new Error('R19_SOAK_SAMPLE_GRENZE_UEBERSCHRITTEN');
      const aktualisiert = { ...session, samples };
      schreibeSession(aktualisiert);
      const elapsed = sample.seitStartMs;
      gui.setzeErgebnis({
        status: 'LAEUFT',
        zertifizierungsStufe: 'SOAK_1H',
        seitStartMs: elapsed,
        sampleAnzahl: samples.length,
        letzterGapMs: sample.gapMs,
        letzterFingerprint: sample.evidenceFingerprint,
        breiteRuntimeFreigabe: false,
        gameplayWritesDurchHarness: 0
      }, 'laeuft', 'SOAK_1H laeuft · ' + Math.floor(elapsed / 60000) + ' / 60 Minuten');
      if (elapsed >= DAUER_MS) {
        laeuft = false;
        if (timer !== null) clearInterval(timer);
        timer = null;
        const finalSession = { ...aktualisiert, status: 'COMPLETED', abgeschlossenAmMs: Date.now() };
        const result = bewerte(finalSession);
        schreibeSession({ ...finalSession, result });
        gui.protokolliere('SOAK_1H abgeschlossen', result);
        gui.setzeErgebnis(
          result,
          result.status === 'BESTANDEN' ? 'bestanden' : 'fehler',
          result.status === 'BESTANDEN'
            ? 'SOAK_1H BESTANDEN · Jetzt Gesamtbericht kopieren.'
            : 'SOAK_1H NICHT BESTANDEN · Kein Neustart. Gesamtbericht kopieren.'
        );
      }
    } catch (error) {
      laeuft = false;
      if (timer !== null) clearInterval(timer);
      timer = null;
      const message = String(error?.message || error);
      const session = liesSession();
      if (session && session.status === 'RUNNING') {
        try { schreibeSession({ ...session, status: 'FAILED', fehler: message, abgeschlossenAmMs: Date.now() }); } catch {}
      }
      gui.setzeErgebnis({ status: 'FEHLER', fehler: message }, 'fehler', message);
      gui.protokolliere('SOAK_1H FEHLER', message);
    } finally {
      sampling = false;
    }
  }

  gui.registriereAktion({
    kennung: 'vorpruefung',
    titel: '1 · Passive Vorprüfung',
    art: 'primaer',
    async ausfuehren() {
      const result = await passiveVorpruefung();
      gui.protokolliere('SOAK_1H Vorpruefung', result);
      gui.setzeErgebnis(
        result,
        result.status === 'BESTANDEN' ? 'bestanden' : 'blockiert',
        result.status === 'BESTANDEN'
          ? 'Vorprüfung bestanden. 1h-Soak kann gestartet werden.'
          : 'Vorprüfung blockiert. Kein Soak gestartet.'
      );
      gui.setzeAktionAktiv('start', result.status === 'BESTANDEN');
      return result;
    }
  });

  gui.registriereAktion({
    kennung: 'start',
    titel: '2 · SOAK_1H starten',
    art: 'gefahr',
    aktiviert: false,
    einmalig: true,
    bestaetigungsText: BESTAETIGUNG,
    async ausfuehren() {
      if (laeuft) throw new Error('R19_SOAK_BEREITS_AKTIV');
      const pre = await passiveVorpruefung();
      if (pre.status !== 'BESTANDEN') {
        gui.setzeErgebnis(pre, 'blockiert', 'Frische Vorprüfung blockiert. Kein Start.');
        return pre;
      }
      const session = {
        schemaVersion: 1,
        status: 'RUNNING',
        zertifizierungsStufe: 'SOAK_1H',
        gestartetAmMs: Date.now(),
        charakter: pre.charakter,
        recorderDrops: 0,
        samples: [],
        breiteRuntimeFreigabe: false,
        gameplayWritesDurchHarness: 0
      };
      schreibeSession(session);
      laeuft = true;
      gui.protokolliere('SOAK_1H gestartet', {
        gestartetAmMs: session.gestartetAmMs,
        intervallMs: INTERVALL_MS,
        dauerMs: DAUER_MS,
        bestaetigungsText: BESTAETIGUNG,
        gameplayWritesDurchHarness: 0,
        breiteRuntimeFreigabe: false
      });
      await tick();
      if (laeuft) timer = setInterval(() => { void tick(); }, INTERVALL_MS);
      return { status: 'LAEUFT', gestartetAmMs: session.gestartetAmMs, dauerMs: DAUER_MS };
    }
  });

  gui.registriereAktion({
    kennung: 'zwischenstand',
    titel: 'Zwischenstand',
    ausfuehren() {
      const session = liesSession();
      const result = session?.result ?? {
        status: session?.status ?? 'LEER',
        zertifizierungsStufe: 'SOAK_1H',
        sampleAnzahl: session?.samples?.length ?? 0,
        seitStartMs: session?.gestartetAmMs ? Date.now() - session.gestartetAmMs : 0,
        evidenceKetteGueltig: Array.isArray(session?.samples) ? validiereKette(session.samples) : false,
        breiteRuntimeFreigabe: false
      };
      gui.protokolliere('SOAK_1H Zwischenstand', result);
      gui.setzeErgebnis(result, session?.status === 'COMPLETED' ? 'info' : 'laeuft', 'SOAK_1H Zwischenstand.');
      return result;
    }
  });

  gui.registriereAktion({
    kennung: 'abbrechen',
    titel: 'Soak abbrechen',
    art: 'gefahr',
    ausfuehren() {
      laeuft = false;
      if (timer !== null) clearInterval(timer);
      timer = null;
      const session = liesSession();
      if (session?.status === 'RUNNING') {
        schreibeSession({ ...session, status: 'ABGEBROCHEN', abgeschlossenAmMs: Date.now() });
      }
      const result = { status: 'ABGEBROCHEN', zertifizierungsStufe: 'SOAK_1H', bestanden: false };
      gui.protokolliere('SOAK_1H abgebrochen', result);
      gui.setzeErgebnis(result, 'warnung', 'Soak abgebrochen. Diese Stufe ist nicht bestanden.');
      return result;
    }
  });

  const api = Object.freeze({
    version: VERSION,
    bestaetigungsText: BESTAETIGUNG,
    test: gui,
    passiveVorpruefung,
    status: () => liesSession(),
    kopiereBericht: () => gui.kopiereBericht()
  });

  try { delete globalThis[API_NAME]; } catch {}
  Object.defineProperty(globalThis, API_NAME, { configurable: true, enumerable: true, writable: false, value: api });
  try {
    if (parent && parent !== globalThis) {
      try { delete parent[API_NAME]; } catch {}
      Object.defineProperty(parent, API_NAME, { configurable: true, enumerable: true, writable: false, value: api });
    }
  } catch {}

  gui.protokolliere('R19 SOAK_1H GUI bereit', {
    version: VERSION,
    bestaetigungsText: BESTAETIGUNG,
    dauerMs: DAUER_MS,
    intervallMs: INTERVALL_MS,
    maximalerSampleGapMs: MAX_SAMPLE_GAP_MS,
    gameplayWritesDurchHarness: 0,
    breiteRuntimeFreigabe: false
  });
  gui.setzeStatus('bereit', 'Mit „1 · Passive Vorprüfung“ beginnen.');
})();
