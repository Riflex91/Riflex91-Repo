/* AUTO-GENERIERT: V5 PR20.3 Market NPC-Sell Stufentest
 * Quellen:
 * - v5/werkzeuge/v5-adventure-land-test-gui.js
 * - v5/werkzeuge/pr20-3-market-sell-step-test-gui.js
 * Nicht manuell bearbeiten.
 */

(() => {
  'use strict';

  const API_NAME = 'V5TestGui';
  const VERSION = '1.1.0';
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
      '.v5tg-timer{display:none;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;margin-bottom:10px;border:1px solid rgba(75,150,255,.24);border-radius:8px;background:rgba(75,150,255,.10)}.v5tg-timer.sichtbar{display:flex}.v5tg-timer span{color:#b7c8df}.v5tg-timer strong{font:800 22px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.04em;color:#dceaff}',
      '.v5tg-aktionen{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:10px}.v5tg button{border:1px solid rgba(255,255,255,.16);border-radius:7px;padding:7px 10px;background:rgba(255,255,255,.08);color:inherit;cursor:pointer}.v5tg button:hover:not(:disabled){background:rgba(255,255,255,.15)}.v5tg button:disabled{opacity:.38;cursor:not-allowed}.v5tg button[data-art="primaer"]{background:rgba(73,141,255,.25)}.v5tg button[data-art="gefahr"]{background:rgba(200,73,73,.24);border-color:rgba(255,100,100,.38)}',
      '.v5tg-bestaetigung{display:none;padding:9px;margin:0 0 10px;border:1px solid rgba(255,178,61,.30);border-radius:8px;background:rgba(255,178,61,.08)}.v5tg-bestaetigung.sichtbar{display:block}.v5tg-bestaetigung label{display:block;margin-bottom:5px;color:#ffe0a3}.v5tg-bestaetigung code{user-select:all}.v5tg-bestaetigung input{width:100%;padding:7px 8px;border:1px solid rgba(255,255,255,.18);border-radius:6px;background:rgba(0,0,0,.28);color:#fff}',
      '.v5tg-ergebnis-kopf,.v5tg-log-kopf{display:flex;align-items:center;gap:8px;margin:10px 0 5px}.v5tg-ergebnis-kopf strong,.v5tg-log-kopf strong{flex:1}.v5tg textarea{width:100%;min-height:190px;max-height:350px;resize:vertical;padding:9px;border:1px solid rgba(255,255,255,.15);border-radius:7px;background:rgba(0,0,0,.28);color:#eaf1ff;font:12px/1.45 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;white-space:pre}',
      '.v5tg-log{max-height:170px;overflow:auto;padding:8px;border:1px solid rgba(255,255,255,.10);border-radius:7px;background:rgba(0,0,0,.20);font:11px/1.45 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;white-space:pre-wrap;overflow-wrap:anywhere}.v5tg-fuss{display:flex;flex-wrap:wrap;gap:7px;padding-top:10px}.v5tg-minimiert .v5tg-inhalt{display:none}',
      '@media(max-width:650px){.v5tg{right:6px;top:6px;width:calc(100vw - 12px);max-height:95vh}}'
    ].join('');
    doc.head.appendChild(css);
  }


  function performanceRoots() {
    const roots = [];
    try { roots.push(globalThis); } catch {}
    try { if (parent && parent !== globalThis) roots.push(parent); } catch {}
    return roots;
  }

  function performanceTrickStatus() {
    const roots = performanceRoots();
    let verfuegbar = false;
    let audioGefunden = false;
    let cplaying = false;
    let playing = false;
    let howlState = null;
    for (const root of roots) {
      try {
        if (typeof root?.performance_trick === 'function') verfuegbar = true;
        const empty = root?.sounds?.empty;
        if (!empty) continue;
        audioGefunden = true;
        if (empty.cplaying === true) cplaying = true;
        if (typeof empty.playing === 'function' && empty.playing() === true) playing = true;
        if (typeof empty.state === 'function') howlState = String(empty.state());
      } catch {}
    }
    let visibilityState = null;
    try { visibilityState = String(dokument().visibilityState || 'unknown'); } catch {}
    return Object.freeze({
      verfuegbar,
      audioGefunden,
      cplaying,
      playing,
      howlState,
      aktiv: verfuegbar && audioGefunden && playing,
      visibilityState
    });
  }

  async function aktivierePerformanceTrick() {
    const roots = performanceRoots();
    let ziel = null;
    let aufgerufen = false;
    let fehler = null;
    for (const root of roots) {
      try {
        if (typeof root?.performance_trick !== 'function') continue;
        ziel = root;
        root.performance_trick();
        aufgerufen = true;
        break;
      } catch (error) {
        fehler = fehlerText(error);
      }
    }
    if (aufgerufen) await new Promise(resolve => setTimeout(resolve, 350));
    let status = performanceTrickStatus();
    if (ziel && status.playing !== true) {
      try {
        ziel.performance_trick();
        await new Promise(resolve => setTimeout(resolve, 150));
        status = performanceTrickStatus();
      } catch (error) {
        fehler = fehlerText(error);
      }
    }
    return Object.freeze({ ...status, aufgerufen, fehler, verifikation: 'HOWLER_PLAYING_TRUE' });
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
      gestartetAm: new Date().toISOString(),
      restzeitMs: null,
      restzeitLabel: null
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
      '<div class="v5tg-timer"><span>Verbleibende Testdauer</span><strong>--:--</strong></div>',
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
    const timerEl = root.querySelector('.v5tg-timer');
    const timerLabel = timerEl.querySelector('span');
    const timerWert = timerEl.querySelector('strong');
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

    function formatiereRestzeit(restMs) {
      const sekunden = Math.max(0, Math.ceil(Number(restMs) / 1000));
      const stunden = Math.floor(sekunden / 3600);
      const minuten = Math.floor((sekunden % 3600) / 60);
      const restSekunden = sekunden % 60;
      const mm = String(minuten).padStart(2, '0');
      const ss = String(restSekunden).padStart(2, '0');
      return stunden > 0 ? String(stunden).padStart(2, '0') + ':' + mm + ':' + ss : mm + ':' + ss;
    }

    function setzeRestzeit(restMs, label = 'Verbleibende Testdauer') {
      if (restMs === null || restMs === undefined) {
        zustand.restzeitMs = null;
        zustand.restzeitLabel = null;
        timerEl.classList.remove('sichtbar');
        timerLabel.textContent = 'Verbleibende Testdauer';
        timerWert.textContent = '--:--';
        return null;
      }
      const wert = Number(restMs);
      if (!Number.isFinite(wert)) throw new Error('V5_TEST_GUI_RESTZEIT_UNGUELTIG');
      const geklemmt = Math.max(0, Math.floor(wert));
      zustand.restzeitMs = geklemmt;
      zustand.restzeitLabel = String(label || 'Verbleibende Testdauer');
      timerLabel.textContent = zustand.restzeitLabel;
      timerWert.textContent = formatiereRestzeit(geklemmt);
      timerEl.classList.add('sichtbar');
      return geklemmt;
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
        const performanceTrick = aktivierePerformanceTrick();
        protokolliere('Performance-Trick Benutzeraktion', performanceTrick);
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
      setzeRestzeit,
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
          restzeitMs: zustand.restzeitMs,
          restzeitLabel: zustand.restzeitLabel,
          protokollEintraege: zustand.protokoll.length,
          aktionen: Object.freeze([...zustand.aktionen.keys()])
        });
      }
    });
  }

  const api = Object.freeze({ version: VERSION, erstelleTest, formatiereWert: format, aktivierePerformanceTrick, performanceTrickStatus });

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

  const API_NAME = 'V5PR203SellStepTest';
  const VERSION = '1.0.0';
  const TESTKENNUNG = 'pr20-3-market-sell-step-test';
  const STATE_KEY = 'AIO_V5_PR20_3_SELL_STEP_TEST_V1';
  const BUY_STATE_KEY = 'AIO_V5_PR20_3_BUY_GOLD_STEP_TEST_V1';

  const MENGE = 1;
  const MAX_TRUE_TESTS = 2;
  const MAX_SELL_VALUE = 10000;
  const STABILITY_MS = 750;
  const SETTLEMENT_TIMEOUT_MS = 15000;
  const SETTLEMENT_POLL_MS = 250;

  const SOAK_MS = 5 * 60 * 1000;
  const SOAK_INTERVAL_MS = 15 * 1000;
  const MAX_SAMPLE_GAP_MS = 45 * 1000;
  const MIN_SAMPLES = 20;
  const MAX_SAMPLES = 30;

  const BESTAETIGUNG_LIVE_1 = 'PR20.3-SELL-LIVE-1';
  const BESTAETIGUNG_LIVE_2 = 'PR20.3-SELL-LIVE-2';

  let soakTimer = null;
  let soakSampling = false;

  function guiApi() {
    try { if (globalThis.V5TestGui) return globalThis.V5TestGui; } catch {}
    try { if (parent?.V5TestGui) return parent.V5TestGui; } catch {}
    throw new Error('PR20_3_SELL_TEST_GUI_FEHLT');
  }

  function roots() {
    const out = [];
    try { out.push(globalThis); } catch {}
    try { if (parent && parent !== globalThis) out.push(parent); } catch {}
    for (const root of [...out]) {
      try {
        if (root?.parent && root.parent !== root && !out.includes(root.parent)) out.push(root.parent);
      } catch {}
    }
    return out;
  }

  function rootFenster() {
    for (const root of roots()) {
      try {
        if (root?.character && Array.isArray(root.character.items) && root.G?.items && root.G?.maps) {
          return root;
        }
      } catch {}
    }
    throw new Error('PR20_3_SELL_ADVENTURE_LAND_CODEKONTEXT_FEHLT');
  }

  function storage() {
    for (const root of roots()) {
      try { if (root?.localStorage) return root.localStorage; } catch {}
    }
    throw new Error('PR20_3_SELL_LOCAL_STORAGE_FEHLT');
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function text(value) {
    return value === null || value === undefined ? '' : String(value).trim();
  }

  function safeInt(value) {
    const n = Number(value);
    return Number.isSafeInteger(n) ? n : null;
  }

  function kanonisch(value) {
    if (value === null) return 'null';
    const typ = typeof value;
    if (typ === 'string' || typ === 'boolean') return JSON.stringify(value);
    if (typ === 'number') return Number.isFinite(value) ? JSON.stringify(value) : JSON.stringify(String(value));
    if (typ === 'undefined') return '"[undefined]"';
    if (Array.isArray(value)) return '[' + value.map(kanonisch).join(',') + ']';
    if (typ === 'object') {
      const keys = Object.keys(value).sort();
      return '{' + keys.map(k => JSON.stringify(k) + ':' + kanonisch(value[k])).join(',') + '}';
    }
    return JSON.stringify(String(value));
  }

  function fingerprint(value) {
    const material = kanonisch(value);
    let hash = 14695981039346656037n;
    for (let i = 0; i < material.length; i += 1) {
      hash ^= BigInt(material.charCodeAt(i));
      hash = BigInt.asUintN(64, hash * 1099511628211n);
    }
    return hash.toString(16).padStart(16, '0');
  }

  function serverBindung() {
    const rs = roots();
    const region = rs.map(r => {
      try { return text(r?.server_region || r?.server?.region); } catch { return ''; }
    }).find(Boolean) || '';
    const kennung = rs.map(r => {
      try { return text(r?.server_identifier || r?.server?.id); } catch { return ''; }
    }).find(Boolean) || '';
    const quelle = rs.map(r => {
      try {
        if (text(r?.server_region) && text(r?.server_identifier)) return 'SERVER_GLOBALS';
        if (text(r?.server?.region) && text(r?.server?.id)) return 'SERVER_OBJECT';
      } catch {}
      return '';
    }).find(Boolean) || 'FEHLT';
    return Object.freeze({ region, kennung, quelle });
  }

  function alternativeRuntimeAktiv() {
    for (const root of roots()) {
      try {
        const v3 = root?.AIO_V3?.__runtime;
        const s3 = v3 && typeof v3.status === 'function' ? v3.status() : null;
        if (v3 && (v3.timer || s3?.running === true)) return true;
      } catch { return true; }
      try {
        const v4 = root?.AIO_V4 || root?.V4Runtime || root?.V4ProduktionsLaufzeit;
        const s4 = v4 && typeof v4.status === 'function' ? v4.status() : null;
        if (v4 && (s4?.running === true || s4?.aktivFreigegeben === true)) return true;
      } catch { return true; }
    }
    return false;
  }

  function sellApi() {
    for (const root of roots()) {
      try {
        if (typeof root?.sell === 'function') return Object.freeze({ owner: root, fn: root.sell });
      } catch {}
    }
    return null;
  }

  function itemValueApi() {
    for (const root of roots()) {
      try {
        if (typeof root?.item_value === 'function') {
          return Object.freeze({ owner: root, fn: root.item_value });
        }
      } catch {}
    }
    return null;
  }

  function sellDistance() {
    for (const root of roots()) {
      try {
        const n = Number(root?.B?.sell_dist);
        if (Number.isFinite(n) && n > 0) return n;
      } catch {}
    }
    return 120;
  }

  function xy(obj) {
    const x = Number(obj?.real_x ?? obj?.x);
    const y = Number(obj?.real_y ?? obj?.y);
    return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
  }

  function distanz(a, b) {
    const aa = xy(a);
    const bb = xy(b);
    if (!aa || !bb) return Infinity;
    return Math.hypot(aa.x - bb.x, aa.y - bb.y);
  }

  function itemMenge(item) {
    if (!item) return 0;
    const q = safeInt(item.q);
    return q !== null && q > 0 ? q : 1;
  }

  function itemGesamtmenge(character, name) {
    let total = 0;
    for (const item of character.items || []) {
      if (item?.name === name) total += itemMenge(item);
    }
    return total;
  }

  function itemFingerprint(item) {
    return fingerprint(item ? {
      name: item.name,
      q: item.q ?? 1,
      level: item.level ?? 0,
      p: item.p ?? null,
      stat_type: item.stat_type ?? null,
      l: item.l ?? null,
      b: item.b ?? null,
      m: item.m ?? null,
      v: item.v ?? null,
      gift: item.gift ?? null,
      expires: item.expires ?? null
    } : null);
  }

  function inventoryFingerprint(character) {
    return fingerprint((character.items || []).map(item => item ? {
      name: item.name,
      q: item.q ?? 1,
      level: item.level ?? 0,
      p: item.p ?? null,
      stat_type: item.stat_type ?? null,
      l: item.l ?? null,
      b: item.b ?? null,
      m: item.m ?? null,
      v: item.v ?? null,
      gift: item.gift ?? null,
      expires: item.expires ?? null
    } : null));
  }

  function inventoryRestFingerprint(character, index) {
    return fingerprint((character.items || []).map((item, i) => i === index ? '[TARGET]' : (item ? {
      name: item.name,
      q: item.q ?? 1,
      level: item.level ?? 0,
      p: item.p ?? null,
      stat_type: item.stat_type ?? null,
      l: item.l ?? null,
      b: item.b ?? null,
      m: item.m ?? null,
      v: item.v ?? null,
      gift: item.gift ?? null,
      expires: item.expires ?? null
    } : null)));
  }

  function itemDefinitionFingerprint(def) {
    return fingerprint({
      name: def?.name ?? null,
      g: def?.g ?? null,
      s: def?.s ?? null,
      cash: def?.cash ?? null,
      p2w: def?.p2w ?? null,
      type: def?.type ?? null,
      quest: def?.quest ?? null,
      exchange: def?.exchange ?? null,
      event: def?.event ?? null,
      upgrade: def?.upgrade ?? null,
      compound: def?.compound ?? null,
      soulbound: def?.soulbound ?? null
    });
  }

  function merchantInReichweite(root) {
    const c = root.character;
    const merchants = root.G?.maps?.[text(c.map)]?.merchants;
    if (!Array.isArray(merchants)) return null;
    const limit = sellDistance();
    let best = null;
    for (const merchant of merchants) {
      const d = distanz(c, merchant);
      if (!Number.isFinite(d) || d >= limit) continue;
      if (!best || d < best.distanz) best = { merchant, distanz: d };
    }
    if (!best) return null;
    return Object.freeze({
      map: text(c.map),
      x: Number(best.merchant?.x),
      y: Number(best.merchant?.y),
      id: text(best.merchant?.id || best.merchant?.name || ''),
      distanz: Math.round(best.distanz * 100) / 100,
      fingerprint: fingerprint({
        map: text(c.map),
        x: Number(best.merchant?.x),
        y: Number(best.merchant?.y),
        id: text(best.merchant?.id || best.merchant?.name || '')
      })
    });
  }

  function definitionSicher(def) {
    if (!def || typeof def !== 'object') return false;
    const stack = safeInt(def.s);
    if (stack === null || stack < 2) return false;
    if (def.cash || def.p2w || def.ignore || def.upgrade || def.compound) return false;
    if (def.quest || def.exchange || def.event || def.soulbound) return false;
    return true;
  }

  function physischSicher(item) {
    if (!item || typeof item !== 'object' || !text(item.name)) return false;
    if (item.name === 'placeholder') return false;
    if ((safeInt(item.level) ?? 0) !== 0) return false;
    if (item.l || item.b || item.gift || item.expires) return false;
    if (item.p || item.stat_type || item.m || item.v || item.special) return false;
    return true;
  }

  function liesBuyQuelle() {
    const raw = storage().getItem(BUY_STATE_KEY);
    if (!raw) {
      return Object.freeze({ status: 'BLOCKIERT', blocker: ['BUY_GOLD_STATE_FEHLT'], fingerprint: null, units: [] });
    }
    let state;
    try { state = JSON.parse(raw); }
    catch {
      return Object.freeze({ status: 'BLOCKIERT', blocker: ['BUY_GOLD_STATE_BESCHAEDIGT'], fingerprint: null, units: [] });
    }
    const blocker = [];
    if (state?.schemaVersion !== 1 || state?.steps?.['7']?.status !== 'BESTANDEN') {
      blocker.push('BUY_GOLD_7_OF_7_NICHT_BESTANDEN');
    }
    if (!Array.isArray(state?.liveAttempts) || state.liveAttempts.length !== 2) {
      blocker.push('BUY_GOLD_LIVE_2_OF_2_FEHLT');
    }
    const attempts = Array.isArray(state?.liveAttempts) ? state.liveAttempts : [];
    for (const a of attempts) {
      if (a?.status !== 'COMMITTED') blocker.push('BUY_GOLD_LIVE_NICHT_COMMITTED');
      if (a?.settlement?.status !== 'BESTAETIGT') blocker.push('BUY_GOLD_SETTLEMENT_NICHT_BESTAETIGT');
      if (a?.gameplayWrites !== 1 || a?.publicFunctionAufrufe !== 1) blocker.push('BUY_GOLD_LIVE_WRITEZAHL_UNGUELTIG');
      if (a?.sameIntentErneutSenden !== false) blocker.push('BUY_GOLD_SAME_INTENT_RETRY_UNGUELTIG');
      if (!text(a?.candidate?.itemName)) blocker.push('BUY_GOLD_ITEMNAME_FEHLT');
    }
    const units = attempts.slice(0, 2).map((a, i) => Object.freeze({
      testNr: i + 1,
      buyIntentId: text(a?.intentId),
      itemName: text(a?.candidate?.itemName),
      buyCandidateKey: text(a?.candidate?.key)
    }));
    return Object.freeze({
      status: blocker.length ? 'BLOCKIERT' : 'BESTANDEN',
      blocker: Object.freeze([...new Set(blocker)]),
      fingerprint: fingerprint({
        step7: state?.steps?.['7']?.status,
        units,
        attempts: attempts.map(a => ({
          status: a?.status,
          settlement: a?.settlement?.status,
          writes: a?.gameplayWrites
        }))
      }),
      units: Object.freeze(units)
    });
  }

  function findeSellKandidat(root, sourceUnit) {
    if (!sourceUnit || !text(sourceUnit.itemName)) return null;
    const merchant = merchantInReichweite(root);
    if (!merchant) return null;
    const def = root.G?.items?.[sourceUnit.itemName];
    if (!definitionSicher(def)) return null;
    const valueApi = itemValueApi();
    if (!valueApi) return null;
    const rows = [];
    for (let index = 0; index < (root.character.items || []).length; index += 1) {
      const item = root.character.items[index];
      if (!item || item.name !== sourceUnit.itemName || !physischSicher(item)) continue;
      let payout;
      try { payout = safeInt(valueApi.fn.call(valueApi.owner, item)); }
      catch { payout = null; }
      if (payout === null || payout < 1 || payout > MAX_SELL_VALUE) continue;
      const slotMenge = itemMenge(item);
      const candidate = {
        sourceBuyTestNr: sourceUnit.testNr,
        sourceBuyIntentId: sourceUnit.buyIntentId,
        itemName: sourceUnit.itemName,
        menge: MENGE,
        inventarIndex: index,
        slotMenge,
        erwarteterGoldZuwachs: payout,
        itemFingerprint: itemFingerprint(item),
        itemDefinitionFingerprint: itemDefinitionFingerprint(def),
        merchantFingerprint: merchant.fingerprint,
        merchantDistanz: merchant.distanz,
        map: text(root.character.map)
      };
      rows.push(Object.freeze({
        ...candidate,
        key: fingerprint(candidate)
      }));
    }
    rows.sort((a, b) => a.inventarIndex - b.inventarIndex);
    return rows[0] ?? null;
  }

  function snapshot(sourceUnit = null) {
    const root = rootFenster();
    const c = root.character;
    const server = serverBindung();
    const perf = guiApi().performanceTrickStatus();
    const buy = liesBuyQuelle();
    const candidate = sourceUnit ? findeSellKandidat(root, sourceUnit) : null;
    return Object.freeze({
      zeitMs: Date.now(),
      characterName: text(c.name),
      sessionId: text(c.id),
      serverRegion: server.region,
      serverKennung: server.kennung,
      serverBindungQuelle: server.quelle,
      ctype: text(c.ctype || c.type).toLowerCase(),
      map: text(c.map),
      rip: c.rip === true,
      moving: c.moving === true,
      warteschlangeLeer: !(c.q && typeof c.q === 'object' && Object.keys(c.q).length),
      alternativeRuntimeAktiv: alternativeRuntimeAktiv(),
      performanceTrick: perf,
      sellVerfuegbar: sellApi() !== null,
      itemValueVerfuegbar: itemValueApi() !== null,
      merchant: merchantInReichweite(root),
      characterGold: safeInt(c.gold),
      inventoryFingerprint: inventoryFingerprint(c),
      buyQuelle: buy,
      candidate,
      candidateItemGesamtmenge: candidate ? itemGesamtmenge(c, candidate.itemName) : null
    });
  }

  function bindungKey(s) {
    return [
      s.characterName,
      s.sessionId,
      s.serverRegion,
      s.serverKennung,
      s.ctype,
      s.map
    ].join('|');
  }

  function basisBlocker(s, candidateRequired = false) {
    const out = [];
    if (s.ctype !== 'merchant') out.push('NUR_MERCHANT');
    if (s.rip) out.push('CHARAKTER_TOT');
    if (s.moving) out.push('CHARAKTER_BEWEGT_SICH');
    if (!s.warteschlangeLeer) out.push('CHARAKTER_QUEUE_AKTIV');
    if (s.alternativeRuntimeAktiv) out.push('ALTERNATIVE_RUNTIME_AKTIV');
    if (!s.characterName || !s.sessionId || !s.serverRegion || !s.serverKennung) {
      out.push('BINDUNG_UNVOLLSTAENDIG');
    }
    if (!s.performanceTrick?.aktiv || s.performanceTrick?.playing !== true) {
      out.push('PERFORMANCE_TRICK_NICHT_AKTIV');
    }
    if (!s.sellVerfuegbar) out.push('SELL_API_FEHLT');
    if (!s.itemValueVerfuegbar) out.push('ITEM_VALUE_API_FEHLT');
    if (!Number.isSafeInteger(s.characterGold)) out.push('GOLD_NICHT_LESBAR');
    if (s.buyQuelle?.status !== 'BESTANDEN') out.push(...(s.buyQuelle?.blocker || ['BUY_QUELLE_UNGUELTIG']));
    if (candidateRequired && !s.merchant) out.push('KEIN_NPC_MERCHANT_IN_SELL_DIST');
    if (candidateRequired && !s.candidate) out.push('KEIN_SICHERER_SELL_KANDIDAT_AUS_BUY_EVIDENCE');
    return [...new Set(out)];
  }

  function defaultState() {
    return {
      schemaVersion: 1,
      controllerVersion: VERSION,
      aktualisiertAmMs: Date.now(),
      steps: {
        '1': { status: 'OFFEN', evidence: null },
        '2': { status: 'OFFEN', evidence: null },
        '3': { status: 'OFFEN', evidence: null },
        '4': { status: 'OFFEN', evidence: null },
        '5': { status: 'OFFEN', evidence: null },
        '6': { status: 'OFFEN', evidence: null },
        '7': { status: 'OFFEN', evidence: null }
      },
      buySourceFingerprint: null,
      sourceUnits: [],
      pinnedCandidate: null,
      liveAttempts: [],
      soak: null,
      sameIntentErneutSenden: false
    };
  }

  function normalisiereState(value) {
    if (!value || value.schemaVersion !== 1 || !value.steps || !Array.isArray(value.liveAttempts)) {
      throw new Error('PR20_3_SELL_STATE_SCHEMA_UNGUELTIG');
    }
    if (value.liveAttempts.length > MAX_TRUE_TESTS) {
      throw new Error('PR20_3_SELL_TESTBUDGET_STATE_UNGUELTIG');
    }
    return value;
  }

  function liesState() {
    const raw = storage().getItem(STATE_KEY);
    if (!raw) return defaultState();
    let value;
    try { value = JSON.parse(raw); }
    catch { throw new Error('PR20_3_SELL_STATE_BESCHAEDIGT'); }
    return normalisiereState(value);
  }

  function schreibeState(value) {
    const next = {
      ...value,
      controllerVersion: VERSION,
      aktualisiertAmMs: Date.now(),
      sameIntentErneutSenden: false
    };
    const raw = JSON.stringify(next);
    if (raw.length > 500000) throw new Error('PR20_3_SELL_STATE_ZU_GROSS');
    storage().setItem(STATE_KEY, raw);
    return next;
  }

  function stepBestanden(state, nr) {
    return state.steps?.[String(nr)]?.status === 'BESTANDEN';
  }

  function setzeStep(state, nr, status, evidence) {
    return schreibeState({
      ...state,
      steps: {
        ...state.steps,
        [String(nr)]: { status, evidence, abgeschlossenAmMs: Date.now() }
      }
    });
  }

  function checkliste(state) {
    return Object.freeze([
      { schritt: 1, name: 'Buy-Evidence / Umgebung', status: state.steps['1'].status },
      { schritt: 2, name: 'Sell-Kandidat 1 pinnen', status: state.steps['2'].status },
      { schritt: 3, name: 'Read-only Shadow / Admission', status: state.steps['3'].status },
      { schritt: 4, name: 'LIVE 1 · sell(index, 1)', status: state.steps['4'].status },
      { schritt: 5, name: 'Sell-Kandidat 2 frisch pinnen', status: state.steps['5'].status },
      { schritt: 6, name: 'LIVE 2 · sell(index, 1)', status: state.steps['6'].status },
      { schritt: 7, name: 'NO-WRITE 5M Stabilitaet', status: state.steps['7'].status }
    ]);
  }

  async function frischePerformance() {
    await guiApi().aktivierePerformanceTrick();
    return guiApi().performanceTrickStatus();
  }

  function sourceUnit(state, testNr) {
    const unit = state.sourceUnits?.[testNr - 1];
    if (!unit) throw new Error('SELL_SOURCE_UNIT_' + testNr + '_FEHLT');
    return unit;
  }

  async function step1() {
    await frischePerformance();
    const s = snapshot();
    const blocker = basisBlocker(s, false);
    const result = Object.freeze({
      schemaVersion: 1,
      status: blocker.length ? 'BLOCKIERT' : 'BESTANDEN',
      testArt: 'PR20_3_SELL_STEP_1_BUY_EVIDENCE_ENVIRONMENT',
      blocker,
      buyQuelle: s.buyQuelle,
      snapshot: {
        characterName: s.characterName,
        sessionId: s.sessionId,
        serverRegion: s.serverRegion,
        serverKennung: s.serverKennung,
        ctype: s.ctype,
        map: s.map,
        characterGold: s.characterGold
      },
      gameplayWrites: 0,
      mutatingPublicFunctionCalls: 0,
      functionalTestBudgetConsumed: false,
      sameIntentErneutSenden: false
    });
    let state = liesState();
    if (!blocker.length) {
      state = schreibeState({
        ...state,
        buySourceFingerprint: s.buyQuelle.fingerprint,
        sourceUnits: s.buyQuelle.units
      });
      state = setzeStep(state, 1, 'BESTANDEN', result);
    }
    return { result, state };
  }

  async function pinneKandidat(state, testNr, stepNr, testArt) {
    const unit = sourceUnit(state, testNr);
    await frischePerformance();
    const a = snapshot(unit);
    const blockersA = basisBlocker(a, true);
    if (a.buyQuelle?.fingerprint !== state.buySourceFingerprint) blockersA.push('BUY_SOURCE_DRIFT');
    if (blockersA.length) {
      return { result: Object.freeze({ status: 'BLOCKIERT', blocker: [...new Set(blockersA)], snapshot: a }), state };
    }
    await sleep(STABILITY_MS);
    const b = snapshot(unit);
    const blockersB = basisBlocker(b, true);
    const stable = blockersB.length === 0
      && b.buyQuelle?.fingerprint === state.buySourceFingerprint
      && bindungKey(a) === bindungKey(b)
      && a.characterGold === b.characterGold
      && a.inventoryFingerprint === b.inventoryFingerprint
      && a.candidate?.key === b.candidate?.key;
    const result = Object.freeze({
      schemaVersion: 1,
      status: stable ? 'BESTANDEN' : 'BLOCKIERT',
      testArt,
      blocker: stable ? [] : [...new Set([...blockersB, 'SELL_KANDIDAT_ODER_PRESTATE_NICHT_STABIL'])],
      sourceUnit: unit,
      candidate: b.candidate,
      stabilityMs: STABILITY_MS,
      gameplayWrites: 0,
      mutatingPublicFunctionCalls: 0,
      functionalTestBudgetConsumed: false,
      sameIntentErneutSenden: false
    });
    if (stable) {
      state = schreibeState({ ...state, pinnedCandidate: b.candidate });
      state = setzeStep(state, stepNr, 'BESTANDEN', result);
    }
    return { result, state };
  }

  async function step2(state) {
    return pinneKandidat(state, 1, 2, 'PR20_3_SELL_STEP_2_CANDIDATE_1_LOCK');
  }

  async function step3() {
    let state = liesState();
    if (!stepBestanden(state, 2)) throw new Error('SCHRITT_2_NOCH_NICHT_BESTANDEN');
    const unit = sourceUnit(state, 1);
    const pinned = state.pinnedCandidate;
    if (!pinned) throw new Error('SELL_KANDIDAT_1_FEHLT');
    await frischePerformance();
    const samples = [];
    for (let i = 0; i < 3; i += 1) {
      if (i) await sleep(STABILITY_MS);
      const s = snapshot(unit);
      const blocker = basisBlocker(s, true);
      if (s.buyQuelle?.fingerprint !== state.buySourceFingerprint) blocker.push('BUY_SOURCE_DRIFT');
      samples.push(Object.freeze({
        zeitMs: s.zeitMs,
        bindungKey: bindungKey(s),
        characterGold: s.characterGold,
        inventoryFingerprint: s.inventoryFingerprint,
        candidateKey: s.candidate?.key ?? null,
        blocker: [...new Set(blocker)]
      }));
    }
    const first = samples[0];
    const stable = samples.every(x =>
      x.blocker.length === 0
      && x.bindungKey === first.bindungKey
      && x.characterGold === first.characterGold
      && x.inventoryFingerprint === first.inventoryFingerprint
      && x.candidateKey === pinned.key
    );
    const result = Object.freeze({
      schemaVersion: 1,
      status: stable ? 'BESTANDEN' : 'BLOCKIERT',
      testArt: 'PR20_3_SELL_STEP_3_SHADOW_ADMISSION',
      blocker: stable ? [] : ['SELL_SHADOW_ODER_ADMISSION_DRIFT'],
      candidate: pinned,
      samples,
      durableIntentErzeugt: false,
      authorityAusgestellt: false,
      gameplayWrites: 0,
      mutatingPublicFunctionCalls: 0,
      functionalTestBudgetConsumed: false,
      sameIntentErneutSenden: false
    });
    if (stable) state = setzeStep(state, 3, 'BESTANDEN', result);
    return { result, state };
  }

  function effectSnapshot(pinned) {
    const root = rootFenster();
    const c = root.character;
    const server = serverBindung();
    const merchant = merchantInReichweite(root);
    const item = c.items?.[pinned.inventarIndex] ?? null;
    return Object.freeze({
      zeitMs: Date.now(),
      characterName: text(c.name),
      sessionId: text(c.id),
      serverRegion: server.region,
      serverKennung: server.kennung,
      map: text(c.map),
      characterGold: safeInt(c.gold),
      itemGesamtmenge: itemGesamtmenge(c, pinned.itemName),
      slotItemName: text(item?.name),
      slotMenge: item ? itemMenge(item) : 0,
      slotItemFingerprint: itemFingerprint(item),
      inventoryRestFingerprint: inventoryRestFingerprint(c, pinned.inventarIndex),
      merchantFingerprint: merchant?.fingerprint ?? null,
      merchantErreichbar: merchant !== null
    });
  }

  function bewerteSettlement(before, after, pinned) {
    const bindingDrift = before.characterName !== after.characterName
      || before.sessionId !== after.sessionId
      || before.serverRegion !== after.serverRegion
      || before.serverKennung !== after.serverKennung
      || before.map !== after.map
      || before.merchantFingerprint !== after.merchantFingerprint;
    const goldDelta = after.characterGold - before.characterGold;
    const itemMengenDelta = after.itemGesamtmenge - before.itemGesamtmenge;
    const restInventoryUnveraendert =
      after.inventoryRestFingerprint === before.inventoryRestFingerprint;
    const slotOk = pinned.slotMenge > 1
      ? after.slotItemName === pinned.itemName && after.slotMenge === pinned.slotMenge - 1
      : after.slotMenge === 0;

    const out = (status, grund) => Object.freeze({
      status,
      grund,
      goldDelta,
      itemMengenDelta,
      restInventoryUnveraendert,
      slotOk,
      merchantErreichbar: after.merchantErreichbar,
      sameIntentErneutSenden: false
    });

    if (bindingDrift) return out('DRIFT', 'SELL_BINDUNG_ODER_MERCHANT_DRIFT');
    if (goldDelta === pinned.erwarteterGoldZuwachs
        && itemMengenDelta === -1
        && restInventoryUnveraendert
        && slotOk) {
      return out('BESTAETIGT', 'SELL_EXAKTES_ITEM_GOLD_DELTA');
    }
    if (goldDelta === 0
        && itemMengenDelta === 0
        && restInventoryUnveraendert
        && after.slotItemFingerprint === before.slotItemFingerprint) {
      return out('OFFEN', 'SELL_NOCH_KEINE_SICHTBARE_WIRKUNG');
    }
    return out('DRIFT', 'SELL_DELTA_WIDERSPRUCH');
  }

  function aktuellePinnedAdmission(state, testNr) {
    const unit = sourceUnit(state, testNr);
    const s = snapshot(unit);
    const blocker = basisBlocker(s, true);
    if (s.buyQuelle?.fingerprint !== state.buySourceFingerprint) blocker.push('BUY_SOURCE_DRIFT');
    if (!state.pinnedCandidate || s.candidate?.key !== state.pinnedCandidate.key) {
      blocker.push('GEPINNTER_SELL_KANDIDAT_DRIFT');
    }
    return { s, blocker: [...new Set(blocker)] };
  }

  async function live(testNr, voraussetzungStep, zielStep) {
    let state = liesState();
    if (!stepBestanden(state, voraussetzungStep)) {
      throw new Error('VORAUSSETZUNG_SCHRITT_' + voraussetzungStep + '_FEHLT');
    }
    if (state.liveAttempts.length >= MAX_TRUE_TESTS) {
      throw new Error('PR20_3_SELL_LIVE_TESTLIMIT_ERREICHT');
    }
    if (state.liveAttempts.length !== testNr - 1) {
      throw new Error('PR20_3_SELL_LIVE_TESTREIHENFOLGE_UNGUELTIG');
    }
    await frischePerformance();
    const admission = aktuellePinnedAdmission(state, testNr);
    if (admission.blocker.length) {
      return {
        result: Object.freeze({
          schemaVersion: 1,
          status: 'BLOCKIERT',
          testArt: 'PR20_3_SELL_LIVE_' + testNr,
          blocker: admission.blocker,
          gameplayWrites: 0,
          mutatingPublicFunctionCalls: 0,
          functionalTestBudgetConsumed: false,
          sameIntentErneutSenden: false
        }),
        state
      };
    }

    const api = sellApi();
    if (!api) throw new Error('SELL_API_FEHLT');
    const pinned = state.pinnedCandidate;
    const before = effectSnapshot(pinned);
    const attempt = {
      schemaVersion: 1,
      testNr,
      status: 'POSSIBLE_SEND',
      intentId: 'PR20_3_SELL_' + testNr + '_' + Date.now(),
      gestartetAmMs: Date.now(),
      sourceBuyUnit: sourceUnit(state, testNr),
      candidate: pinned,
      before,
      publicFunction: 'sell',
      publicFunctionAufrufe: 1,
      gameplayWrites: 1,
      sameIntentErneutSenden: false
    };
    state = schreibeState({ ...state, liveAttempts: [...state.liveAttempts, attempt] });

    let promiseStatus = 'PENDING';
    let promiseResult = null;
    let promiseError = null;
    try {
      const p = api.fn.call(api.owner, pinned.inventarIndex, MENGE);
      Promise.resolve(p).then(
        value => { promiseStatus = 'RESOLVED'; promiseResult = value ?? null; },
        error => { promiseStatus = 'REJECTED'; promiseError = String(error?.reason || error?.message || error); }
      );
    } catch (error) {
      promiseStatus = 'THREW';
      promiseError = String(error?.message || error);
    }

    const deadline = Date.now() + SETTLEMENT_TIMEOUT_MS;
    let settlement = null;
    let after = before;
    while (Date.now() <= deadline) {
      await sleep(SETTLEMENT_POLL_MS);
      after = effectSnapshot(pinned);
      settlement = bewerteSettlement(before, after, pinned);
      if (settlement.status === 'BESTAETIGT' || settlement.status === 'DRIFT') break;
    }
    if (!settlement || settlement.status === 'OFFEN') {
      settlement = Object.freeze({
        ...(settlement || bewerteSettlement(before, after, pinned)),
        status: 'UNAUFGELOEST',
        grund: 'SELL_SETTLEMENT_TIMEOUT_KEIN_BLIND_RETRY',
        sameIntentErneutSenden: false
      });
    }

    const passed = settlement.status === 'BESTAETIGT';
    const finalAttempt = Object.freeze({
      ...attempt,
      status: passed ? 'COMMITTED' : settlement.status,
      abgeschlossenAmMs: Date.now(),
      after,
      settlement,
      promiseStatus,
      promiseResult,
      promiseError
    });
    state = schreibeState({
      ...state,
      liveAttempts: state.liveAttempts.map((x, i) =>
        i === state.liveAttempts.length - 1 ? finalAttempt : x)
    });
    const result = Object.freeze({
      schemaVersion: 1,
      status: passed ? 'BESTANDEN' : 'NICHT_BESTANDEN',
      testArt: 'PR20_3_SELL_LIVE_' + testNr,
      testNr,
      candidate: pinned,
      publicFunctionAufrufe: 1,
      gameplayWrites: 1,
      functionalTestBudgetConsumed: true,
      testsConsumed: state.liveAttempts.length,
      maxTrueTests: MAX_TRUE_TESTS,
      promiseStatus,
      promiseResult,
      promiseError,
      settlement,
      sameIntentErneutSenden: false
    });
    state = setzeStep(state, zielStep, passed ? 'BESTANDEN' : 'NICHT_BESTANDEN', result);
    return { result, state };
  }

  async function step5() {
    let state = liesState();
    if (!stepBestanden(state, 4)) throw new Error('SCHRITT_4_NOCH_NICHT_BESTANDEN');
    if (state.liveAttempts.length !== 1 || state.liveAttempts[0]?.status !== 'COMMITTED') {
      throw new Error('SELL_LIVE_1_COMMIT_FEHLT');
    }
    return pinneKandidat(state, 2, 5, 'PR20_3_SELL_STEP_5_CANDIDATE_2_READMISSION');
  }

  function soakBlocker(baseline, current, gapMs) {
    const out = [];
    if (gapMs > MAX_SAMPLE_GAP_MS) out.push('SAMPLE_GAP_ZU_GROSS');
    if (bindungKey(current) !== baseline.bindungKey) out.push('BINDUNG_DRIFT');
    if (current.rip) out.push('CHARAKTER_TOT');
    if (current.moving) out.push('CHARAKTER_BEWEGT_SICH');
    if (!current.warteschlangeLeer) out.push('CHARAKTER_QUEUE_AKTIV');
    if (current.alternativeRuntimeAktiv) out.push('ALTERNATIVE_RUNTIME_AKTIV');
    if (!current.performanceTrick?.aktiv || current.performanceTrick?.playing !== true) {
      out.push('PERFORMANCE_TRICK_FEHLER');
    }
    if (current.buyQuelle?.fingerprint !== baseline.buySourceFingerprint) out.push('BUY_SOURCE_DRIFT');
    if (current.characterGold !== baseline.characterGold) out.push('GOLD_DRIFT');
    if (current.inventoryFingerprint !== baseline.inventoryFingerprint) out.push('INVENTORY_DRIFT');
    return out;
  }

  async function soakTick(gui) {
    if (soakSampling) return;
    soakSampling = true;
    try {
      let state = liesState();
      const soak = state.soak;
      if (!soak || soak.status !== 'RUNNING') return;
      const now = Date.now();
      const previous = soak.samples.length
        ? soak.samples[soak.samples.length - 1].zeitMs
        : soak.gestartetAmMs;
      const s = snapshot();
      const gapMs = now - previous;
      const blocker = soakBlocker(soak.baseline, { ...s, bindungKey: bindungKey(s) }, gapMs);
      const sample = Object.freeze({
        nr: soak.samples.length + 1,
        zeitMs: now,
        seitStartMs: now - soak.gestartetAmMs,
        gapMs,
        evidenceFingerprint: fingerprint({
          bindungKey: bindungKey(s),
          gold: s.characterGold,
          inventory: s.inventoryFingerprint,
          buySource: s.buyQuelle?.fingerprint,
          performance: s.performanceTrick,
          blocker
        }),
        blocker
      });
      const samples = [...soak.samples, sample];
      if (samples.length > MAX_SAMPLES) throw new Error('PR20_3_SELL_SOAK_SAMPLE_GRENZE');
      const elapsed = sample.seitStartMs;
      const updated = { ...soak, samples };
      state = schreibeState({ ...state, soak: updated });

      gui.setzeRestzeit(Math.max(0, SOAK_MS - elapsed), 'Schritt 7 · Sell NO-WRITE 5M');
      gui.setzeErgebnis({
        status: 'LAEUFT',
        testArt: 'PR20_3_SELL_STEP_7_NO_WRITE_5M',
        seitStartMs: elapsed,
        sampleAnzahl: samples.length,
        letzterGapMs: gapMs,
        letzterBlocker: blocker,
        gameplayWrites: 0,
        functionalTestBudgetConsumed: false,
        liveTestsConsumed: state.liveAttempts.length,
        sameIntentErneutSenden: false
      }, 'laeuft', 'Sell Schritt 7 laeuft · Restzeit ' + Math.ceil(Math.max(0, SOAK_MS - elapsed) / 1000) + ' s');

      if (blocker.length || elapsed >= SOAK_MS) {
        if (soakTimer !== null) clearInterval(soakTimer);
        soakTimer = null;
        gui.setzeRestzeit(null);
        const gaps = samples.filter(x => x.gapMs > MAX_SAMPLE_GAP_MS).length;
        const blockerSamples = samples.filter(x => x.blocker.length > 0).length;
        const passed = elapsed >= SOAK_MS
          && samples.length >= MIN_SAMPLES
          && samples.length <= MAX_SAMPLES
          && gaps === 0
          && blockerSamples === 0;
        const result = Object.freeze({
          schemaVersion: 1,
          status: passed ? 'BESTANDEN' : 'NICHT_BESTANDEN',
          testArt: 'PR20_3_SELL_STEP_7_NO_WRITE_5M',
          dauerMs: elapsed,
          sampleAnzahl: samples.length,
          sampleGaps: gaps,
          blockerSamples,
          gameplayWrites: 0,
          mutatingPublicFunctionCalls: 0,
          functionalTestBudgetConsumed: false,
          liveTestsConsumed: state.liveAttempts.length,
          liveTestsMax: MAX_TRUE_TESTS,
          sameIntentErneutSenden: false
        });
        state = schreibeState({
          ...state,
          soak: { ...updated, status: 'COMPLETED', abgeschlossenAmMs: Date.now(), result }
        });
        state = setzeStep(state, 7, passed ? 'BESTANDEN' : 'NICHT_BESTANDEN', result);
        gui.protokolliere('PR20.3 Sell Schritt 7 abgeschlossen', result);
        gui.setzeErgebnis(
          { ...result, checkliste: checkliste(state) },
          passed ? 'bestanden' : 'fehler',
          passed
            ? 'Alle PR20.3 Sell-Testschritte BESTANDEN · Gesamtbericht kopieren.'
            : 'Sell Schritt 7 NICHT BESTANDEN · kein weiterer Write.'
        );
        synchronisiereAktionen(gui, state);
      }
    } catch (error) {
      if (soakTimer !== null) clearInterval(soakTimer);
      soakTimer = null;
      gui.setzeRestzeit(null);
      gui.setzeErgebnis({
        status: 'FEHLER',
        fehler: String(error?.message || error),
        sameIntentErneutSenden: false
      }, 'fehler', String(error?.message || error));
    } finally {
      soakSampling = false;
    }
  }

  async function step7Start(gui) {
    let state = liesState();
    if (!stepBestanden(state, 6)) throw new Error('SCHRITT_6_NOCH_NICHT_BESTANDEN');
    if (state.liveAttempts.length !== MAX_TRUE_TESTS
        || state.liveAttempts.some(x => x.status !== 'COMMITTED')) {
      throw new Error('SELL_LIVE_EVIDENCE_2_OF_2_FEHLT');
    }
    await frischePerformance();
    const s = snapshot();
    const blocker = basisBlocker(s, false);
    if (s.buyQuelle?.fingerprint !== state.buySourceFingerprint) blocker.push('BUY_SOURCE_DRIFT');
    if (blocker.length) {
      return {
        result: Object.freeze({
          status: 'BLOCKIERT',
          testArt: 'PR20_3_SELL_STEP_7_PREFLIGHT',
          blocker: [...new Set(blocker)],
          gameplayWrites: 0,
          functionalTestBudgetConsumed: false
        }),
        state
      };
    }
    const baseline = Object.freeze({
      bindungKey: bindungKey(s),
      characterGold: s.characterGold,
      inventoryFingerprint: s.inventoryFingerprint,
      buySourceFingerprint: s.buyQuelle.fingerprint
    });
    const soak = {
      schemaVersion: 1,
      status: 'RUNNING',
      gestartetAmMs: Date.now(),
      abgeschlossenAmMs: null,
      baseline,
      samples: [],
      gameplayWrites: 0,
      functionalTestBudgetConsumed: false,
      sameIntentErneutSenden: false
    };
    state = schreibeState({ ...state, soak });
    gui.setzeRestzeit(SOAK_MS, 'Schritt 7 · Sell NO-WRITE 5M');
    await soakTick(gui);
    if (liesState().soak?.status === 'RUNNING') {
      soakTimer = setInterval(() => soakTick(gui), SOAK_INTERVAL_MS);
    }
    return {
      result: Object.freeze({
        status: 'LAEUFT',
        testArt: 'PR20_3_SELL_STEP_7_NO_WRITE_5M',
        dauerMs: SOAK_MS,
        intervallMs: SOAK_INTERVAL_MS,
        gameplayWrites: 0,
        functionalTestBudgetConsumed: false,
        liveTestsConsumed: state.liveAttempts.length,
        sameIntentErneutSenden: false
      }),
      state
    };
  }

  function recoveryDiagnose() {
    const state = liesState();
    const offene = state.liveAttempts.find(x => x.status === 'POSSIBLE_SEND');
    if (!offene) {
      return Object.freeze({
        status: 'KEIN_OFFENER_LIVE_ATTEMPT',
        state,
        checkliste: checkliste(state),
        sameIntentErneutSenden: false
      });
    }
    const after = effectSnapshot(offene.candidate);
    const settlement = bewerteSettlement(offene.before, after, offene.candidate);
    return Object.freeze({
      status: 'RECOVERY_READ_ONLY',
      testNr: offene.testNr,
      attemptStatus: offene.status,
      settlement,
      after,
      hinweis: settlement.status === 'BESTAETIGT'
        ? 'Sell-Wirkung ist read-only erkennbar; Report senden. Kein erneuter Send.'
        : 'Kein erneuter Send. Unaufgeloesten Sell-Zustand zuerst dokumentieren.',
      sameIntentErneutSenden: false
    });
  }

  function synchronisiereAktionen(gui, state = liesState()) {
    gui.setzeAktionAktiv('step-1', !stepBestanden(state, 1));
    gui.setzeAktionAktiv('step-2', stepBestanden(state, 1) && !stepBestanden(state, 2));
    gui.setzeAktionAktiv('step-3', stepBestanden(state, 2) && !stepBestanden(state, 3));
    gui.setzeAktionAktiv(
      'step-4-live-1',
      stepBestanden(state, 3) && !stepBestanden(state, 4) && state.liveAttempts.length === 0
    );
    gui.setzeAktionAktiv(
      'step-5',
      stepBestanden(state, 4) && !stepBestanden(state, 5) && state.liveAttempts.length === 1
    );
    gui.setzeAktionAktiv(
      'step-6-live-2',
      stepBestanden(state, 5) && !stepBestanden(state, 6) && state.liveAttempts.length === 1
    );
    gui.setzeAktionAktiv(
      'step-7',
      stepBestanden(state, 6)
        && !stepBestanden(state, 7)
        && state.liveAttempts.length === 2
        && state.liveAttempts.every(x => x.status === 'COMMITTED')
    );
    gui.setzeAktionAktiv('diagnose', true);
  }

  const gui = guiApi().erstelleTest({
    kennung: TESTKENNUNG,
    titel: 'V5 · PR20.3 Markt · NPC-Sell Stufentest',
    beschreibung:
      'Ein Paket, sieben persistente Stufen. Verkauft nur zwei durch den bestandenen Buy-Gold-Test bestaetigte Testeinheiten; kein Merge zwischen Stufen.'
  });

  gui.registriereAktion({
    kennung: 'step-1',
    titel: '1 · Buy-Evidence / Umgebung abhaken',
    art: 'primaer',
    einmalig: true,
    async ausfuehren() {
      const { result, state } = await step1();
      gui.protokolliere('PR20.3 Sell Schritt 1', result);
      gui.setzeErgebnis(
        { ...result, checkliste: checkliste(state) },
        result.status === 'BESTANDEN' ? 'bestanden' : 'blockiert',
        result.status === 'BESTANDEN'
          ? 'Sell Schritt 1 BESTANDEN · Schritt 2 ist freigeschaltet.'
          : 'Sell Schritt 1 BLOCKIERT · Buy-Gold muss zuerst 7/7 bestanden sein.'
      );
      synchronisiereAktionen(gui, state);
      return result;
    }
  });

  gui.registriereAktion({
    kennung: 'step-2',
    titel: '2 · Sell-Kandidat 1 stabil pinnen',
    art: 'primaer',
    aktiviert: false,
    einmalig: true,
    async ausfuehren() {
      let state = liesState();
      if (!stepBestanden(state, 1)) throw new Error('SCHRITT_1_NOCH_NICHT_BESTANDEN');
      const out = await step2(state);
      gui.protokolliere('PR20.3 Sell Schritt 2', out.result);
      gui.setzeErgebnis(
        { ...out.result, checkliste: checkliste(out.state) },
        out.result.status === 'BESTANDEN' ? 'bestanden' : 'blockiert',
        out.result.status === 'BESTANDEN'
          ? 'Sell Schritt 2 BESTANDEN · Schritt 3 ist freigeschaltet.'
          : 'Sell Schritt 2 BLOCKIERT · kein Verkauf.'
      );
      synchronisiereAktionen(gui, out.state);
      return out.result;
    }
  });

  gui.registriereAktion({
    kennung: 'step-3',
    titel: '3 · Read-only Sell Shadow / Admission',
    art: 'primaer',
    aktiviert: false,
    einmalig: true,
    async ausfuehren() {
      const out = await step3();
      gui.protokolliere('PR20.3 Sell Schritt 3', out.result);
      gui.setzeErgebnis(
        { ...out.result, checkliste: checkliste(out.state) },
        out.result.status === 'BESTANDEN' ? 'bestanden' : 'blockiert',
        out.result.status === 'BESTANDEN'
          ? 'Sell Schritt 3 BESTANDEN · LIVE 1 ist freigeschaltet.'
          : 'Sell Schritt 3 BLOCKIERT · kein Send.'
      );
      synchronisiereAktionen(gui, out.state);
      return out.result;
    }
  });

  gui.registriereAktion({
    kennung: 'step-4-live-1',
    titel: '4 · LIVE 1 · 1 bestaetigte Testeinheit verkaufen',
    art: 'gefahr',
    aktiviert: false,
    einmalig: true,
    bestaetigungsText: BESTAETIGUNG_LIVE_1,
    async ausfuehren() {
      const out = await live(1, 3, 4);
      gui.protokolliere('PR20.3 Sell LIVE 1', out.result);
      gui.setzeErgebnis(
        { ...out.result, checkliste: checkliste(out.state) },
        out.result.status === 'BESTANDEN' ? 'bestanden' : 'fehler',
        out.result.status === 'BESTANDEN'
          ? 'Sell LIVE 1 BESTANDEN · Schritt 5 ist freigeschaltet.'
          : 'Sell LIVE 1 NICHT BESTANDEN · kein Retry desselben Intents.'
      );
      synchronisiereAktionen(gui, out.state);
      return out.result;
    }
  });

  gui.registriereAktion({
    kennung: 'step-5',
    titel: '5 · Sell-Kandidat 2 frisch pinnen',
    art: 'primaer',
    aktiviert: false,
    einmalig: true,
    async ausfuehren() {
      const out = await step5();
      gui.protokolliere('PR20.3 Sell Schritt 5', out.result);
      gui.setzeErgebnis(
        { ...out.result, checkliste: checkliste(out.state) },
        out.result.status === 'BESTANDEN' ? 'bestanden' : 'blockiert',
        out.result.status === 'BESTANDEN'
          ? 'Sell Schritt 5 BESTANDEN · LIVE 2 ist freigeschaltet.'
          : 'Sell Schritt 5 BLOCKIERT · kein zweiter Send.'
      );
      synchronisiereAktionen(gui, out.state);
      return out.result;
    }
  });

  gui.registriereAktion({
    kennung: 'step-6-live-2',
    titel: '6 · LIVE 2 · 1 bestaetigte Testeinheit verkaufen',
    art: 'gefahr',
    aktiviert: false,
    einmalig: true,
    bestaetigungsText: BESTAETIGUNG_LIVE_2,
    async ausfuehren() {
      const out = await live(2, 5, 6);
      gui.protokolliere('PR20.3 Sell LIVE 2', out.result);
      gui.setzeErgebnis(
        { ...out.result, checkliste: checkliste(out.state) },
        out.result.status === 'BESTANDEN' ? 'bestanden' : 'fehler',
        out.result.status === 'BESTANDEN'
          ? 'Sell LIVE 2 BESTANDEN · 2/2 Testbudget erreicht. Schritt 7 ist freigeschaltet.'
          : 'Sell LIVE 2 NICHT BESTANDEN · Testbudget nicht zuruecksetzen.'
      );
      synchronisiereAktionen(gui, out.state);
      return out.result;
    }
  });

  gui.registriereAktion({
    kennung: 'step-7',
    titel: '7 · Sell NO-WRITE 5M Stabilitaet starten',
    art: 'primaer',
    aktiviert: false,
    einmalig: true,
    async ausfuehren() {
      const out = await step7Start(gui);
      gui.protokolliere('PR20.3 Sell Schritt 7 gestartet', out.result);
      synchronisiereAktionen(gui, out.state);
      return out.result;
    }
  });

  gui.registriereAktion({
    kennung: 'diagnose',
    titel: 'Status / Recovery read-only',
    async ausfuehren() {
      const state = liesState();
      const result = Object.freeze({
        schemaVersion: 1,
        testArt: 'PR20_3_SELL_STEP_TEST_STATUS',
        state,
        checkliste: checkliste(state),
        recovery: recoveryDiagnose(),
        buyQuelle: liesBuyQuelle(),
        aktuellerSnapshot: snapshot(),
        maxTrueTests: MAX_TRUE_TESTS,
        liveTestsConsumed: state.liveAttempts.length,
        sameIntentErneutSenden: false
      });
      gui.protokolliere('PR20.3 Sell Status / Recovery', result);
      gui.setzeErgebnis(result, 'info', 'Persistenter Sell-Stand · kein Testbudget wird zurueckgesetzt.');
      synchronisiereAktionen(gui, state);
      return result;
    }
  });

  let startState = liesState();
  if (startState.soak?.status === 'RUNNING') {
    startState = schreibeState({
      ...startState,
      soak: {
        ...startState.soak,
        status: 'UNTERBROCHEN',
        unterbrochenAmMs: Date.now(),
        sameIntentErneutSenden: false
      }
    });
    gui.protokolliere('Unterbrochener Sell-NO-WRITE-Soak erkannt', {
      status: 'UNTERBROCHEN',
      gameplayWrites: 0,
      functionalTestBudgetConsumed: false
    });
  }

  gui.protokolliere('PR20.3 NPC-Sell Stufentest gestartet', {
    controllerVersion: VERSION,
    stateKey: STATE_KEY,
    sourceBuyStateKey: BUY_STATE_KEY,
    maxSellValue: MAX_SELL_VALUE,
    maxTrueTests: MAX_TRUE_TESTS,
    liveTestsConsumed: startState.liveAttempts.length,
    sameIntentErneutSenden: false
  });
  gui.setzeErgebnis({
    schemaVersion: 1,
    status: stepBestanden(startState, 7) ? 'BESTANDEN' : 'BEREIT',
    checkliste: checkliste(startState),
    buyQuelle: liesBuyQuelle(),
    liveTestsConsumed: startState.liveAttempts.length,
    maxTrueTests: MAX_TRUE_TESTS,
    sameIntentErneutSenden: false
  }, stepBestanden(startState, 7) ? 'bestanden' : 'bereit',
  stepBestanden(startState, 7)
    ? 'Alle sieben Sell-Schritte bereits BESTANDEN.'
    : 'Nach vollstaendig bestandenem Buy-Gold-Test mit Schritt 1 beginnen.');
  synchronisiereAktionen(gui, startState);

  const api = Object.freeze({
    version: VERSION,
    stateKey: STATE_KEY,
    sourceBuyStateKey: BUY_STATE_KEY,
    bestaetigungLive1: BESTAETIGUNG_LIVE_1,
    bestaetigungLive2: BESTAETIGUNG_LIVE_2,
    maxTrueTests: MAX_TRUE_TESTS,
    maxSellValue: MAX_SELL_VALUE,
    status: () => liesState(),
    checkliste: () => checkliste(liesState()),
    buyQuelle: liesBuyQuelle,
    snapshot,
    recoveryDiagnose,
    test: gui,
    kopiereBericht: () => gui.kopiereBericht()
  });

  try { delete globalThis[API_NAME]; } catch {}
  Object.defineProperty(globalThis, API_NAME, {
    configurable: true,
    enumerable: true,
    writable: false,
    value: api
  });
  try {
    if (parent && parent !== globalThis) {
      try { delete parent[API_NAME]; } catch {}
      Object.defineProperty(parent, API_NAME, {
        configurable: true,
        enumerable: true,
        writable: false,
        value: api
      });
    }
  } catch {}
})();

