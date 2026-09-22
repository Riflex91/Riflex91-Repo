/* AUTO-GENERIERT: V5 Bank-Funktionstest Ingame-Paket
 * Quellen:
 * - v5/werkzeuge/v5-adventure-land-test-gui.js
 * - v5/werkzeuge/bank-function-test-gui.js
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

  const API_NAME = 'V5BankFunctionTest';
  const VERSION = '1.2.0';
  const TESTKENNUNG = 'bank-function-tests';
  const STATE_KEY = 'AIO_V5_BANK_FUNCTION_TEST_STATE_V1';
  const STABILITY_MS = 750;
  const SETTLEMENT_TIMEOUT_MS = 15000;
  const POLL_MS = 250;
  const MAX_TRUE_TESTS = 2;
  const FUNKTIONEN = Object.freeze(['RETRIEVE', 'STORE', 'SWAP']);

  const BESTAETIGUNGEN = Object.freeze({
    RETRIEVE: Object.freeze({
      1: 'V5-BANK-RETRIEVE-LIVE-1',
      2: 'V5-BANK-RETRIEVE-LIVE-2'
    }),
    STORE: Object.freeze({
      1: 'V5-BANK-STORE-LIVE-1',
      2: 'V5-BANK-STORE-LIVE-2'
    }),
    SWAP: Object.freeze({
      1: 'V5-BANK-SWAP-LIVE-1',
      2: 'V5-BANK-SWAP-LIVE-2'
    })
  });

  function guiApi() {
    try { if (globalThis.V5TestGui) return globalThis.V5TestGui; } catch {}
    try { if (parent?.V5TestGui) return parent.V5TestGui; } catch {}
    throw new Error('V5_BANK_TEST_GUI_FEHLT');
  }

  function roots() {
    const out = [];
    try { out.push(globalThis); } catch {}
    try { if (parent && parent !== globalThis) out.push(parent); } catch {}
    return out;
  }

  function rootFenster() {
    const kandidaten = roots();
    for (const root of kandidaten) {
      try {
        if (!root?.character || !Array.isArray(root.character.items) || !root.G?.items) continue;
        const hatBankFunktion = typeof root.bank_retrieve === 'function'
          || typeof root.bank_store === 'function'
          || typeof root.bank_swap === 'function';
        if (hatBankFunktion) return root;
      } catch {}
    }
    for (const root of kandidaten) {
      try {
        if (root?.character && Array.isArray(root.character.items) && root.G?.items) return root;
      } catch {}
    }
    throw new Error('V5_BANK_TEST_ADVENTURE_LAND_CODEKONTEXT_FEHLT');
  }

  function storage() {
    for (const root of roots()) {
      try { if (root?.localStorage) return root.localStorage; } catch {}
    }
    throw new Error('V5_BANK_TEST_LOCAL_STORAGE_FEHLT');
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function text(wert) {
    return wert === null || wert === undefined ? '' : String(wert).trim();
  }

  function kanonisch(wert) {
    if (wert === null) return 'null';
    const typ = typeof wert;
    if (typ === 'string' || typ === 'boolean') return JSON.stringify(wert);
    if (typ === 'number') return Number.isFinite(wert) ? JSON.stringify(wert) : JSON.stringify(String(wert));
    if (typ === 'undefined') return '"[undefined]"';
    if (Array.isArray(wert)) return '[' + wert.map(kanonisch).join(',') + ']';
    if (typ === 'object') {
      const keys = Object.keys(wert).sort();
      return '{' + keys.map(k => JSON.stringify(k) + ':' + kanonisch(wert[k])).join(',') + '}';
    }
    return JSON.stringify(String(wert));
  }

  function fingerprint(wert) {
    const material = kanonisch(wert);
    let hash = 14695981039346656037n;
    for (let i = 0; i < material.length; i += 1) {
      hash ^= BigInt(material.charCodeAt(i));
      hash = BigInt.asUintN(64, hash * 1099511628211n);
    }
    return hash.toString(16).padStart(16, '0');
  }

  function itemInfo(item) {
    if (item === null || item === undefined) return null;
    if (typeof item !== 'object' || Array.isArray(item)) {
      throw new Error('V5_BANK_TEST_ITEM_UNGUELTIG');
    }
    const name = text(item.name);
    if (!name) throw new Error('V5_BANK_TEST_ITEM_NAME_FEHLT');
    return Object.freeze({
      name,
      fingerprint: fingerprint(item),
      placeholder: name === 'placeholder',
      blocked: item.b === true,
      hasM: Object.prototype.hasOwnProperty.call(item, 'm'),
      hasV: Object.prototype.hasOwnProperty.call(item, 'v')
    });
  }

  function serverBindung(root) {
    const kandidaten = roots();
    const region = kandidaten.map(r => {
      try { return text(r?.server_region || r?.server?.region); } catch { return ''; }
    }).find(Boolean) || '';
    const kennung = kandidaten.map(r => {
      try { return text(r?.server_identifier || r?.server?.id); } catch { return ''; }
    }).find(Boolean) || '';
    return Object.freeze({ region, kennung });
  }

  function accountId(root) {
    return roots().map(r => {
      try { return text(r?.user_id || r?.character?.owner); } catch { return ''; }
    }).find(Boolean) || text(root.character?.owner);
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

  function bankPackMap(root, pack) {
    let katalog = null;
    for (const r of roots()) {
      try {
        if (r?.bank_packs && typeof r.bank_packs === 'object') {
          katalog = r.bank_packs;
          break;
        }
      } catch {}
    }
    const meta = katalog?.[pack];
    if (Array.isArray(meta)) return text(meta[0]);
    if (meta && typeof meta === 'object') return text(meta.map || meta.place);
    return '';
  }

  function bankPackKatalogSnapshot(root, bank) {
    let katalog = null;
    for (const r of roots()) {
      try {
        if (r?.bank_packs && typeof r.bank_packs === 'object') {
          katalog = r.bank_packs;
          break;
        }
      } catch {}
    }
    if (!katalog) return Object.freeze([]);
    const out = [];
    for (const pack of Object.keys(katalog).sort((a, b) => {
      const na = Number(String(a).replace(/^items/, ''));
      const nb = Number(String(b).replace(/^items/, ''));
      return na - nb;
    })) {
      if (!/^items[0-9]+$/.test(pack)) continue;
      const meta = katalog[pack];
      let map = '';
      let goldKosten = null;
      let shellKosten = null;
      if (Array.isArray(meta)) {
        map = text(meta[0]);
        const g = Number(meta[1]);
        const s = Number(meta[2]);
        goldKosten = Number.isSafeInteger(g) && g >= 0 ? g : null;
        shellKosten = Number.isSafeInteger(s) && s >= 0 ? s : null;
      } else if (meta && typeof meta === 'object') {
        map = text(meta.map || meta.place);
        const g = Number(meta.gold);
        const s = Number(meta.shells);
        goldKosten = Number.isSafeInteger(g) && g >= 0 ? g : null;
        shellKosten = Number.isSafeInteger(s) && s >= 0 ? s : null;
      }
      out.push(Object.freeze({
        pack,
        map,
        goldKosten,
        shellKosten,
        freigeschaltet: !!(bank && Array.isArray(bank[pack]))
      }));
    }
    return Object.freeze(out);
  }

  function snapshot() {
    const root = rootFenster();
    const c = root.character;
    const server = serverBindung(root);
    const bank = c.bank && typeof c.bank === 'object' && !Array.isArray(c.bank)
      ? c.bank
      : null;
    const capRaw = Number(c.isize);
    const inventoryCapacity = Number.isSafeInteger(capRaw) && capRaw >= 1 && capRaw <= 64
      ? capRaw
      : Math.min(64, c.items.length);
    const inventory = Object.freeze(
      Array.from({ length: inventoryCapacity }, (_, i) => itemInfo(c.items[i] ?? null))
    );
    const packs = [];
    if (bank) {
      for (const pack of Object.keys(bank).sort()) {
        if (!/^items[0-9]+$/.test(pack) || !Array.isArray(bank[pack])) continue;
        const map = bankPackMap(root, pack);
        if (map && map !== text(c.map)) continue;
        packs.push(Object.freeze({
          pack,
          map,
          slots: Object.freeze(
            Array.from({ length: 42 }, (_, i) => itemInfo(bank[pack][i] ?? null))
          )
        }));
      }
    }
    const characterGold = Number(c.gold);
    const characterCash = Number(c.cash);
    const bankGold = bank ? Number(bank.gold) : NaN;
    const packKatalog = bankPackKatalogSnapshot(root, bank);
    const basis = {
      accountId: accountId(root),
      charakter: text(c.name),
      sessionId: text(c.id),
      ctype: text(c.ctype || c.type).toLowerCase(),
      map: text(c.map),
      serverRegion: server.region,
      serverKennung: server.kennung,
      rip: c.rip === true,
      moving: c.moving === true,
      queueAktiv: !!(c.q && typeof c.q === 'object' && Object.keys(c.q).length),
      bankGemountet: !!bank,
      alternativeRuntimeAktiv: alternativeRuntimeAktiv(),
      characterGold: Number.isSafeInteger(characterGold) && characterGold >= 0 ? characterGold : null,
      characterCash: Number.isSafeInteger(characterCash) && characterCash >= 0 ? characterCash : null,
      bankGold: Number.isSafeInteger(bankGold) && bankGold >= 0 ? bankGold : null,
      inventoryCapacity,
      packKatalog,
      inventory,
      packs
    };
    return Object.freeze({
      ...basis,
      beobachtetAmMs: Date.now(),
      fingerprint: fingerprint({
        accountId: basis.accountId,
        charakter: basis.charakter,
        sessionId: basis.sessionId,
        map: basis.map,
        serverRegion: basis.serverRegion,
        serverKennung: basis.serverKennung,
        characterGold: basis.characterGold,
        characterCash: basis.characterCash,
        bankGold: basis.bankGold,
        packKatalog: packKatalog.map(x => ({
          pack: x.pack,
          map: x.map,
          goldKosten: x.goldKosten,
          shellKosten: x.shellKosten,
          freigeschaltet: x.freigeschaltet
        })),
        inventory: inventory.map(x => x?.fingerprint ?? null),
        packs: packs.map(p => ({
          pack: p.pack,
          slots: p.slots.map(x => x?.fingerprint ?? null)
        }))
      })
    });
  }

  function basisBlocker(s) {
    const out = [];
    if (s.ctype !== 'merchant') out.push('NUR_MERCHANT');
    if (s.rip) out.push('CHARAKTER_TOT');
    if (s.moving) out.push('CHARAKTER_BEWEGT_SICH');
    if (s.queueAktiv) out.push('CHARAKTER_QUEUE_AKTIV');
    if (!s.bankGemountet) out.push('BANK_NICHT_GEMOUNTET');
    if (s.alternativeRuntimeAktiv) out.push('ALTERNATIVE_RUNTIME_AKTIV');
    if (!s.accountId || !s.charakter || !s.sessionId || !s.serverRegion || !s.serverKennung) {
      out.push('IDENTITAET_ODER_SERVER_FEHLT');
    }
    if (!Number.isSafeInteger(s.characterGold) || !Number.isSafeInteger(s.bankGold)) {
      out.push('GOLD_NICHT_LESBAR');
    }
    if (!Array.isArray(s.packs) || s.packs.length < 1) out.push('KEIN_BANK_PACK_AM_MOUNT');
    return out;
  }

  function waehleRetrieve(s) {
    let inventorySlot = -1;
    for (let i = 0; i < s.inventoryCapacity; i += 1) {
      if (s.inventory[i] === null) { inventorySlot = i; break; }
    }
    if (inventorySlot < 0) return null;
    for (const pack of s.packs) {
      for (let bankSlot = 0; bankSlot < 42; bankSlot += 1) {
        const item = pack.slots[bankSlot];
        if (!item || item.placeholder) continue;
        return Object.freeze({
          art: 'RETRIEVE',
          pack: pack.pack,
          bankSlot,
          inventorySlot,
          item: Object.freeze({ name: item.name, fingerprint: item.fingerprint })
        });
      }
    }
    return null;
  }

  function waehleStore(s) {
    let inventorySlot = -1;
    let item = null;
    for (let i = 0; i < s.inventoryCapacity; i += 1) {
      const x = s.inventory[i];
      if (!x || x.placeholder || x.blocked || x.hasM || x.hasV) continue;
      inventorySlot = i;
      item = x;
      break;
    }
    if (inventorySlot < 0 || item === null) return null;
    for (const pack of s.packs) {
      for (let bankSlot = 0; bankSlot < 42; bankSlot += 1) {
        if (pack.slots[bankSlot] !== null) continue;
        return Object.freeze({
          art: 'STORE',
          pack: pack.pack,
          bankSlot,
          inventorySlot,
          item: Object.freeze({ name: item.name, fingerprint: item.fingerprint })
        });
      }
    }
    return null;
  }

  function waehleSwap(s) {
    for (const pack of s.packs) {
      for (let a = 0; a < 42; a += 1) {
        const itemA = pack.slots[a];
        if (!itemA || itemA.placeholder) continue;
        for (let b = a + 1; b < 42; b += 1) {
          const itemB = pack.slots[b];
          if (!itemB || itemB.placeholder || itemA.name === itemB.name) continue;
          return Object.freeze({
            art: 'SWAP',
            pack: pack.pack,
            a,
            b,
            itemA: Object.freeze({ name: itemA.name, fingerprint: itemA.fingerprint }),
            itemB: Object.freeze({ name: itemB.name, fingerprint: itemB.fingerprint }),
            stackMergeDurchNamensgleichheitAusgeschlossen: true
          });
        }
      }
    }
    return null;
  }

  function waehleOpenBankPack(s) {
    for (const row of s.packKatalog ?? []) {
      if (row.map !== s.map || row.freigeschaltet) continue;
      if (!Number.isSafeInteger(row.goldKosten) || row.goldKosten < 0
          || !Number.isSafeInteger(row.shellKosten) || row.shellKosten < 0) continue;
      if (row.goldKosten === 0 && row.shellKosten === 0) continue;
      return Object.freeze({
        art: 'OPEN_BANK_PACK',
        pack: row.pack,
        map: row.map,
        goldKosten: row.goldKosten,
        shellKosten: row.shellKosten
      });
    }
    return null;
  }

  function openPackKandidatKey(k) {
    if (!k) return null;
    return [k.art, k.pack, k.map, k.goldKosten, k.shellKosten].join('|');
  }

  function kandidat(s, art) {
    if (art === 'RETRIEVE') return waehleRetrieve(s);
    if (art === 'STORE') return waehleStore(s);
    if (art === 'SWAP') return waehleSwap(s);
    throw new Error('V5_BANK_TEST_ART_UNGUELTIG:' + String(art));
  }

  function kandidatKey(k) {
    if (!k) return null;
    if (k.art === 'SWAP') {
      return [k.art, k.pack, k.a, k.b, k.itemA.fingerprint, k.itemB.fingerprint].join('|');
    }
    return [k.art, k.pack, k.bankSlot, k.inventorySlot, k.item.fingerprint].join('|');
  }

  function pack(s, name) {
    return s.packs.find(x => x.pack === name) ?? null;
  }

  function restFingerprint(s, art, k) {
    const inventory = s.inventory.map((x, i) => {
      if ((art === 'RETRIEVE' || art === 'STORE') && i === k.inventorySlot) return '<transfer>';
      return x?.fingerprint ?? null;
    });
    const banks = s.packs.map(p => ({
      pack: p.pack,
      slots: p.slots.map((x, i) => {
        if (p.pack !== k.pack) return x?.fingerprint ?? null;
        if (art === 'SWAP' && (i === k.a || i === k.b)) return '<swap>';
        if ((art === 'RETRIEVE' || art === 'STORE') && i === k.bankSlot) return '<transfer>';
        return x?.fingerprint ?? null;
      })
    }));
    return Object.freeze({
      inventory: fingerprint(inventory),
      bank: fingerprint(banks)
    });
  }

  function itemGleich(a, b) {
    return a === null ? b === null
      : b !== null && a.name === b.name && a.fingerprint === b.fingerprint;
  }

  function settlement(pre, post, art, k) {
    const commonDrift = pre.accountId !== post.accountId
      || pre.charakter !== post.charakter
      || pre.sessionId !== post.sessionId
      || pre.serverRegion !== post.serverRegion
      || pre.serverKennung !== post.serverKennung
      || pre.map !== post.map
      || pre.characterGold !== post.characterGold
      || pre.bankGold !== post.bankGold;
    const preRest = restFingerprint(pre, art, k);
    const postRest = restFingerprint(post, art, k);
    const restDrift = preRest.inventory !== postRest.inventory
      || preRest.bank !== postRest.bank;
    if (commonDrift) {
      return Object.freeze({ status: 'DRIFT', grund: 'BINDUNG_ODER_GOLD_DRIFT', sameIntentErneutSenden: false });
    }
    if (restDrift) {
      return Object.freeze({ status: 'DRIFT', grund: 'NICHT_BETEILIGTER_ZUSTAND_DRIFT', sameIntentErneutSenden: false });
    }

    const p = pack(post, k.pack);
    if (!p) return Object.freeze({ status: 'DRIFT', grund: 'PACK_NACHHER_FEHLT', sameIntentErneutSenden: false });

    if (art === 'RETRIEVE') {
      const quelle = p.slots[k.bankSlot];
      const ziel = post.inventory[k.inventorySlot];
      if (quelle === null && itemGleich(ziel, k.item)) {
        return Object.freeze({ status: 'BESTAETIGT', grund: 'BANK_RETRIEVE_EXAKT_BESTAETIGT', sameIntentErneutSenden: false });
      }
      const prePack = pack(pre, k.pack);
      const unveraendert = itemGleich(prePack?.slots[k.bankSlot] ?? null, quelle)
        && itemGleich(pre.inventory[k.inventorySlot], ziel);
      return Object.freeze({
        status: unveraendert ? 'OFFEN' : 'DRIFT',
        grund: unveraendert ? 'NOCH_KEINE_SICHTBARE_WIRKUNG' : 'RETRIEVE_SLOT_WIRKUNG_WIDERSPRUCH',
        sameIntentErneutSenden: false
      });
    }

    if (art === 'STORE') {
      const quelle = post.inventory[k.inventorySlot];
      const ziel = p.slots[k.bankSlot];
      if (quelle === null && itemGleich(ziel, k.item)) {
        return Object.freeze({ status: 'BESTAETIGT', grund: 'BANK_STORE_EXAKT_BESTAETIGT', sameIntentErneutSenden: false });
      }
      const prePack = pack(pre, k.pack);
      const unveraendert = itemGleich(pre.inventory[k.inventorySlot], quelle)
        && itemGleich(prePack?.slots[k.bankSlot] ?? null, ziel);
      return Object.freeze({
        status: unveraendert ? 'OFFEN' : 'DRIFT',
        grund: unveraendert ? 'NOCH_KEINE_SICHTBARE_WIRKUNG' : 'STORE_SLOT_WIRKUNG_WIDERSPRUCH',
        sameIntentErneutSenden: false
      });
    }

    const a = p.slots[k.a];
    const b = p.slots[k.b];
    if (itemGleich(a, k.itemB) && itemGleich(b, k.itemA)) {
      return Object.freeze({ status: 'BESTAETIGT', grund: 'BANK_SWAP_EXAKT_BESTAETIGT', sameIntentErneutSenden: false });
    }
    const prePack = pack(pre, k.pack);
    const unveraendert = itemGleich(prePack?.slots[k.a] ?? null, a)
      && itemGleich(prePack?.slots[k.b] ?? null, b);
    return Object.freeze({
      status: unveraendert ? 'OFFEN' : 'DRIFT',
      grund: unveraendert ? 'NOCH_KEINE_SICHTBARE_WIRKUNG' : 'SWAP_SLOT_WIRKUNG_WIDERSPRUCH',
      sameIntentErneutSenden: false
    });
  }

  function defaultState() {
    return {
      schemaVersion: 1,
      controllerVersion: VERSION,
      aktualisiertAmMs: Date.now(),
      funktionen: {
        RETRIEVE: { attempts: [], lastShadow: null },
        STORE: { attempts: [], lastShadow: null },
        SWAP: { attempts: [], lastShadow: null }
      }
    };
  }

  function liesState() {
    const raw = storage().getItem(STATE_KEY);
    if (!raw) return defaultState();
    let value;
    try { value = JSON.parse(raw); }
    catch { throw new Error('V5_BANK_TEST_STATE_BESCHAEDIGT'); }
    if (!value || value.schemaVersion !== 1 || !value.funktionen) {
      throw new Error('V5_BANK_TEST_STATE_SCHEMA_UNGUELTIG');
    }
    return value;
  }

  function schreibeState(value) {
    const next = { ...value, controllerVersion: VERSION, aktualisiertAmMs: Date.now() };
    const raw = JSON.stringify(next);
    if (raw.length > 400000) throw new Error('V5_BANK_TEST_STATE_ZU_GROSS');
    storage().setItem(STATE_KEY, raw);
    const roundtrip = storage().getItem(STATE_KEY);
    if (roundtrip !== raw) throw new Error('V5_BANK_TEST_STATE_NICHT_DURABLE');
    return next;
  }

  function trueAttempts(row) {
    return (row?.attempts ?? []).filter(x => Number(x.sendCount) > 0 || x.moeglicherSend === true);
  }

  function offeneUngeklaerte(row) {
    return trueAttempts(row).some(x => ['OUTCOME_PENDING', 'RECOVERY_PENDING', 'UNGEKLAERT'].includes(x.status));
  }

  function liveEligibility(art, testNummer) {
    const state = liesState();
    const row = state.funktionen[art];
    if (!row) throw new Error('V5_BANK_TEST_STATE_FUNKTION_FEHLT');
    const echte = trueAttempts(row);
    const blocker = [];
    if (offeneUngeklaerte(row)) blocker.push('VORHERIGER_MOEGLICHER_SEND_UNGEKLAERT');
    if (echte.length >= MAX_TRUE_TESTS) blocker.push('MAXIMAL_ZWEI_ECHTE_TESTS_ERREICHT');
    if (testNummer === 1 && echte.length !== 0) blocker.push('LIVE_TEST_1_BEREITS_VERBRAUCHT');
    if (testNummer === 2) {
      if (echte.length !== 1) blocker.push('LIVE_TEST_2_ERFORDERT_EXAKT_TEST_1');
      else if (echte[0].testNummer !== 1 || echte[0].status !== 'COMMITTED') {
        blocker.push('LIVE_TEST_1_NICHT_SAUBER_COMMITTED');
      }
    }
    return Object.freeze({ state, row, echte, blocker });
  }

  function setFunctionRow(state, art, nextRow) {
    return {
      ...state,
      funktionen: {
        ...state.funktionen,
        [art]: nextRow
      }
    };
  }

  function appendAttempt(state, art, attempt) {
    const row = state.funktionen[art];
    return schreibeState(setFunctionRow(state, art, {
      ...row,
      attempts: [...row.attempts, attempt]
    }));
  }

  function ersetzeAttempt(state, art, attemptId, patch) {
    const row = state.funktionen[art];
    let gefunden = false;
    const attempts = row.attempts.map(x => {
      if (x.attemptId !== attemptId) return x;
      gefunden = true;
      return { ...x, ...patch };
    });
    if (!gefunden) throw new Error('V5_BANK_TEST_ATTEMPT_FEHLT');
    return schreibeState(setFunctionRow(state, art, { ...row, attempts }));
  }

  function setShadow(state, art, shadow) {
    const row = state.funktionen[art];
    return schreibeState(setFunctionRow(state, art, { ...row, lastShadow: shadow }));
  }

  async function stabileVorpruefung(art) {
    const performanceTrick = await guiApi().aktivierePerformanceTrick();
    if (!performanceTrick?.aktiv) {
      return Object.freeze({
        status: 'BLOCKIERT',
        blocker: ['PERFORMANCE_TRICK_NICHT_AKTIV'],
        performanceTrick
      });
    }
    const first = snapshot();
    const blocker = basisBlocker(first);
    const firstKandidat = kandidat(first, art);
    if (!firstKandidat) blocker.push('KEIN_SICHERER_KANDIDAT');
    const root = rootFenster();
    const fn = art === 'RETRIEVE' ? root.bank_retrieve
      : art === 'STORE' ? root.bank_store
        : root.bank_swap;
    if (typeof fn !== 'function') blocker.push('PUBLIC_FUNCTION_FEHLT');
    if (blocker.length) {
      return Object.freeze({
        status: 'BLOCKIERT',
        art,
        blocker: Object.freeze(blocker),
        performanceTrick,
        first,
        kandidat: firstKandidat
      });
    }
    await sleep(STABILITY_MS);
    const second = snapshot();
    const secondKandidat = kandidat(second, art);
    const stabil = first.fingerprint === second.fingerprint
      && kandidatKey(firstKandidat) === kandidatKey(secondKandidat);
    if (!stabil) {
      return Object.freeze({
        status: 'BLOCKIERT',
        art,
        blocker: ['KANDIDAT_ODER_GAMESTATE_NICHT_STABIL'],
        performanceTrick,
        firstFingerprint: first.fingerprint,
        secondFingerprint: second.fingerprint,
        firstKandidat,
        secondKandidat
      });
    }
    return Object.freeze({
      status: 'BESTANDEN',
      art,
      performanceTrick,
      beobachtungen: 2,
      intervallMs: STABILITY_MS,
      kandidat: secondKandidat,
      snapshot: second,
      sameIntentErneutSenden: false,
      gameplayWrites: 0
    });
  }

  async function shadow(art) {
    const mode = String(art).toUpperCase();
    if (!FUNKTIONEN.includes(mode)) throw new Error('V5_BANK_TEST_ART_UNGUELTIG');
    const result = await stabileVorpruefung(mode);
    const state = liesState();
    setShadow(state, mode, {
      zeitMs: Date.now(),
      status: result.status,
      kandidat: result.kandidat ?? null,
      blocker: result.blocker ?? [],
      fingerprint: result.snapshot?.fingerprint ?? null,
      performanceTrick: result.performanceTrick ?? null
    });
    return Object.freeze({
      ...result,
      testArt: 'SHADOW',
      mutatingPublicFunctionCalls: 0
    });
  }

  async function openBankPackShadow() {
    const performanceTrick = await guiApi().aktivierePerformanceTrick();
    if (!performanceTrick?.aktiv) {
      return Object.freeze({
        status: 'BLOCKIERT',
        art: 'OPEN_BANK_PACK',
        blocker: ['PERFORMANCE_TRICK_NICHT_AKTIV'],
        performanceTrick,
        gameplayWrites: 0,
        mutatingPublicFunctionCalls: 0,
        liveMutationFreigegeben: false
      });
    }

    const first = snapshot();
    const blocker = basisBlocker(first);
    const root = rootFenster();
    if (typeof root.open_bank_pack !== 'function') blocker.push('PUBLIC_FUNCTION_FEHLT');
    const firstKandidat = waehleOpenBankPack(first);
    if (!firstKandidat) blocker.push('KEIN_GESPERRTER_KOSTENPFLICHTIGER_PACK_AUF_DIESER_BANK');

    if (blocker.length) {
      return Object.freeze({
        status: 'BLOCKIERT',
        art: 'OPEN_BANK_PACK',
        blocker: Object.freeze(blocker),
        performanceTrick,
        first,
        kandidat: firstKandidat,
        gameplayWrites: 0,
        mutatingPublicFunctionCalls: 0,
        liveMutationFreigegeben: false
      });
    }

    await sleep(STABILITY_MS);
    const second = snapshot();
    const secondKandidat = waehleOpenBankPack(second);
    if (first.fingerprint !== second.fingerprint
        || openPackKandidatKey(firstKandidat) !== openPackKandidatKey(secondKandidat)) {
      return Object.freeze({
        status: 'BLOCKIERT',
        art: 'OPEN_BANK_PACK',
        blocker: ['KANDIDAT_ODER_GAMESTATE_NICHT_STABIL'],
        performanceTrick,
        firstFingerprint: first.fingerprint,
        secondFingerprint: second.fingerprint,
        firstKandidat,
        secondKandidat,
        gameplayWrites: 0,
        mutatingPublicFunctionCalls: 0,
        liveMutationFreigegeben: false
      });
    }

    return Object.freeze({
      status: 'BESTANDEN',
      art: 'OPEN_BANK_PACK',
      testArt: 'SHADOW',
      performanceTrick,
      beobachtungen: 2,
      intervallMs: STABILITY_MS,
      kandidat: secondKandidat,
      zahlung: Object.freeze({
        characterGold: second.characterGold,
        characterShells: second.characterCash,
        goldBezahlbar: Number.isSafeInteger(second.characterGold)
          && second.characterGold >= secondKandidat.goldKosten,
        shellsBezahlbar: Number.isSafeInteger(second.characterCash)
          && second.characterCash >= secondKandidat.shellKosten
      }),
      officialRunnerSemantik: Object.freeze({
        erlaubteWaehrungen: Object.freeze(['gold', 'shells']),
        goldPfad: 'BANK_DEFERRED',
        shellsPfad: 'ASYNC_BACKEND_TX_MIT_IN_PROGRESS_UND_GAME_RESPONSE'
      }),
      sameIntentErneutSenden: false,
      gameplayWrites: 0,
      mutatingPublicFunctionCalls: 0,
      liveMutationFreigegeben: false,
      naechsterSchritt: 'NUR_DIAGNOSE_KOPIEREN_KEIN_OPEN_BANK_PACK_LIVE'
    });
  }

  async function openBankPackAdmission() {
    const shadow = await openBankPackShadow();
    if (shadow.status !== 'BESTANDEN') {
      return Object.freeze({
        status: 'BLOCKIERT',
        art: 'OPEN_BANK_PACK',
        testArt: 'ADMISSION_READ_ONLY',
        blocker: Object.freeze([...(shadow.blocker ?? ['SHADOW_NICHT_BESTANDEN'])]),
        shadow,
        sameIntentErneutSenden: false,
        gameplayWrites: 0,
        mutatingPublicFunctionCalls: 0,
        liveMutationFreigegeben: false
      });
    }

    const goldBlocker = [];
    const shellsBlocker = [];
    if (!shadow.zahlung.goldBezahlbar) goldBlocker.push('BANK_OPEN_PACK_GOLD_ZU_NIEDRIG');
    if (!shadow.zahlung.shellsBezahlbar) shellsBlocker.push('BANK_OPEN_PACK_SHELLS_ZU_NIEDRIG');

    const gold = Object.freeze({
      waehrung: 'gold',
      status: goldBlocker.length === 0 ? 'BEREIT' : 'BLOCKIERT',
      blocker: Object.freeze(goldBlocker),
      kosten: shadow.kandidat.goldKosten,
      verfuegbar: shadow.zahlung.characterGold,
      korrelation: 'FIFO_DEFERRED_BANK'
    });
    const shells = Object.freeze({
      waehrung: 'shells',
      status: shellsBlocker.length === 0 ? 'BEREIT' : 'BLOCKIERT',
      blocker: Object.freeze(shellsBlocker),
      kosten: shadow.kandidat.shellKosten,
      verfuegbar: shadow.zahlung.characterShells,
      korrelation: 'REQUEST_ID_ASYNC_BACKEND_TX',
      inProgressPolicy: 'WAIT_AND_REOBSERVE_NO_SEND'
    });
    const irgendeinPfadBereit = gold.status === 'BEREIT' || shells.status === 'BEREIT';

    return Object.freeze({
      status: irgendeinPfadBereit ? 'BEREIT' : 'BLOCKIERT',
      art: 'OPEN_BANK_PACK',
      testArt: 'ADMISSION_READ_ONLY',
      kandidat: shadow.kandidat,
      performanceTrick: shadow.performanceTrick,
      pfade: Object.freeze({ gold, shells }),
      selectedPath: null,
      durableIntentErzeugt: false,
      authorityAusgestellt: false,
      sameIntentErneutSenden: false,
      gameplayWrites: 0,
      mutatingPublicFunctionCalls: 0,
      liveMutationFreigegeben: false,
      naechsterSchritt: irgendeinPfadBereit
        ? 'PFAD_BEREIT_ABER_LIVE_WEITERHIN_NICHT_FREIGEGEBEN'
        : 'RESSOURCEN_BLOCKIERT_KEIN_LIVE'
    });
  }

  async function warteSettlement(pre, art, k) {
    const start = Date.now();
    let letzter = null;
    while (Date.now() - start <= SETTLEMENT_TIMEOUT_MS) {
      const post = snapshot();
      letzter = Object.freeze({
        beobachtetAmMs: post.beobachtetAmMs,
        postFingerprint: post.fingerprint,
        settlement: settlement(pre, post, art, k)
      });
      if (letzter.settlement.status === 'BESTAETIGT'
          || letzter.settlement.status === 'DRIFT') {
        return letzter;
      }
      await sleep(POLL_MS);
    }
    return Object.freeze({
      beobachtetAmMs: Date.now(),
      postFingerprint: letzter?.postFingerprint ?? null,
      settlement: Object.freeze({
        status: 'OFFEN',
        grund: 'SETTLEMENT_TIMEOUT',
        sameIntentErneutSenden: false
      })
    });
  }

  function bestaetigung(art, testNummer) {
    return BESTAETIGUNGEN[art]?.[testNummer] ?? '';
  }

  async function live(art, testNummer, bestaetigungsText) {
    const mode = String(art).toUpperCase();
    if (!FUNKTIONEN.includes(mode)) throw new Error('V5_BANK_TEST_ART_UNGUELTIG');
    if (![1, 2].includes(testNummer)) throw new Error('V5_BANK_TEST_NUMMER_UNGUELTIG');
    if (bestaetigungsText !== bestaetigung(mode, testNummer)) {
      return Object.freeze({
        status: 'BLOCKIERT',
        art: mode,
        testNummer,
        blocker: ['OPERATOR_BESTAETIGUNG_FEHLT'],
        sameIntentErneutSenden: false,
        gameplayWrites: 0
      });
    }

    const eligibility = liveEligibility(mode, testNummer);
    if (eligibility.blocker.length) {
      return Object.freeze({
        status: 'BLOCKIERT',
        art: mode,
        testNummer,
        blocker: eligibility.blocker,
        trueAttempts: eligibility.echte.length,
        sameIntentErneutSenden: false,
        gameplayWrites: 0
      });
    }

    const preflight = await stabileVorpruefung(mode);
    if (preflight.status !== 'BESTANDEN') {
      return Object.freeze({
        ...preflight,
        testArt: 'LIVE',
        testNummer,
        sameIntentErneutSenden: false,
        gameplayWrites: 0
      });
    }

    const attemptId = 'BANK-' + mode + '-LIVE-' + String(testNummer)
      + '-' + String(Date.now()) + '-' + Math.random().toString(16).slice(2, 10);
    const intent = {
      schemaVersion: 1,
      attemptId,
      art: mode,
      testNummer,
      status: 'INTENT_DURABLE',
      gestartetAmMs: Date.now(),
      beendetAmMs: null,
      kandidat: preflight.kandidat,
      preFingerprint: preflight.snapshot.fingerprint,
      performanceTrick: preflight.performanceTrick,
      sendCount: 0,
      moeglicherSend: false,
      sameIntentErneutSenden: false,
      outcome: null
    };
    let state = appendAttempt(liesState(), mode, intent);

    const fresh = snapshot();
    const freshKandidat = kandidat(fresh, mode);
    if (fresh.fingerprint !== preflight.snapshot.fingerprint
        || kandidatKey(freshKandidat) !== kandidatKey(preflight.kandidat)
        || basisBlocker(fresh).length !== 0
        || guiApi().performanceTrickStatus().aktiv !== true) {
      state = ersetzeAttempt(state, mode, attemptId, {
        status: 'ABORTED_NO_SEND',
        beendetAmMs: Date.now(),
        outcome: {
          blocker: ['FRESH_ADMISSION_BLOCKIERT'],
          freshFingerprint: fresh.fingerprint,
          freshKandidat
        }
      });
      return Object.freeze({
        status: 'BLOCKIERT',
        art: mode,
        testNummer,
        blocker: ['FRESH_ADMISSION_BLOCKIERT'],
        attemptId,
        gameplayWrites: 0,
        moeglicherSend: false,
        sameIntentErneutSenden: false
      });
    }

    state = ersetzeAttempt(state, mode, attemptId, {
      status: 'OUTCOME_PENDING',
      sendAmMs: Date.now(),
      sendCount: 1,
      moeglicherSend: true
    });

    let callFehler = null;
    try {
      const root = rootFenster();
      if (mode === 'RETRIEVE') {
        await Promise.resolve(root.bank_retrieve(
          preflight.kandidat.pack,
          preflight.kandidat.bankSlot,
          preflight.kandidat.inventorySlot
        ));
      } else if (mode === 'STORE') {
        await Promise.resolve(root.bank_store(
          preflight.kandidat.inventorySlot,
          preflight.kandidat.pack,
          preflight.kandidat.bankSlot
        ));
      } else {
        await Promise.resolve(root.bank_swap(
          preflight.kandidat.pack,
          preflight.kandidat.a,
          preflight.kandidat.b
        ));
      }
    } catch (error) {
      callFehler = String(error?.message || error).slice(0, 500);
    }

    let beobachtung;
    try {
      beobachtung = await warteSettlement(
        preflight.snapshot,
        mode,
        preflight.kandidat
      );
    } catch (error) {
      beobachtung = Object.freeze({
        beobachtetAmMs: Date.now(),
        postFingerprint: null,
        settlement: Object.freeze({
          status: 'OFFEN',
          grund: 'SETTLEMENT_BEOBACHTUNG_FEHLER:' + String(error?.message || error).slice(0, 300),
          sameIntentErneutSenden: false
        })
      });
    }

    const clean = beobachtung.settlement.status === 'BESTAETIGT';
    const finalStatus = clean ? 'COMMITTED' : 'RECOVERY_PENDING';
    const outcome = {
      status: clean ? 'BESTANDEN' : beobachtung.settlement.status === 'DRIFT'
        ? 'NICHT_BESTANDEN'
        : 'UNGEKLAERT',
      callFehler,
      settlement: beobachtung.settlement,
      beobachtetAmMs: beobachtung.beobachtetAmMs,
      postFingerprint: beobachtung.postFingerprint,
      gameplayWrites: 1,
      publicFunctionAufrufe: 1,
      sameIntentErneutSenden: false
    };
    state = ersetzeAttempt(state, mode, attemptId, {
      status: finalStatus,
      beendetAmMs: Date.now(),
      outcome
    });

    return Object.freeze({
      schemaVersion: 1,
      status: outcome.status,
      art: mode,
      testNummer,
      attemptId,
      journalStatus: finalStatus,
      kandidat: preflight.kandidat,
      callFehler,
      settlement: beobachtung.settlement,
      gameplayWrites: 1,
      publicFunctionAufrufe: 1,
      moeglicherSend: true,
      sameIntentErneutSenden: false,
      naechsterSchritt: clean
        ? (testNummer === 1
          ? 'LIVE_TEST_2_DARF_MANUELL_GESTARTET_WERDEN'
          : 'MAXIMAL_ZWEI_ECHTE_TESTS_ERREICHT')
        : 'STOP_KEIN_RETRY_DIAGNOSE_KOPIEREN'
    });
  }

  function diagnose() {
    const state = liesState();
    const zusammenfassung = {};
    for (const art of FUNKTIONEN) {
      const row = state.funktionen[art];
      const echte = trueAttempts(row);
      zusammenfassung[art] = {
        echteTests: echte.length,
        maximalEchteTests: MAX_TRUE_TESTS,
        offenerUngeklaerterSend: offeneUngeklaerte(row),
        test1Committed: echte[0]?.testNummer === 1 && echte[0]?.status === 'COMMITTED',
        test2Erlaubt: echte.length === 1
          && echte[0]?.testNummer === 1
          && echte[0]?.status === 'COMMITTED',
        lastShadow: row.lastShadow,
        attempts: row.attempts
      };
    }
    return Object.freeze({
      schemaVersion: 1,
      controllerVersion: VERSION,
      status: 'INFO',
      performanceTrick: guiApi().performanceTrickStatus(),
      zusammenfassung,
      state
    });
  }

  const gui = guiApi().erstelleTest({
    kennung: TESTKENNUNG,
    titel: 'V5 · Bank-Funktionstests',
    beschreibung:
      'Direkter Adventure-Land-CODE-Test fuer bank_retrieve(), bank_store() und bank_swap(). Shadow ist read-only. LIVE ruft die jeweilige Public Function exakt einmal auf und sperrt bei unklarem Ausgang jeden Retry.'
  });

  try {
    const doc = parent?.document ?? globalThis.document;
    const root = doc?.getElementById?.('v5-test-gui-' + TESTKENNUNG);
    if (root) {
      root.style.width = 'min(540px, calc(100vw - 28px))';
      const area = root.querySelector('.v5tg-ergebnis');
      if (area) area.style.minHeight = '150px';
    }
  } catch {}

  function setzeResultat(result, textValue) {
    const status = result.status === 'BESTANDEN' ? 'bestanden'
      : result.status === 'BLOCKIERT' ? 'blockiert'
        : result.status === 'NICHT_BESTANDEN' ? 'fehler'
          : result.status === 'UNGEKLAERT' ? 'warnung'
            : 'info';
    gui.setzeErgebnis(result, status, textValue);
    return result;
  }

  function aktualisiereLiveButtons() {
    const state = liesState();
    for (const art of FUNKTIONEN) {
      const row = state.funktionen[art];
      const echte = trueAttempts(row);
      const offen = offeneUngeklaerte(row);
      gui.setzeAktionAktiv(
        art.toLowerCase() + '-live-1',
        !offen && echte.length === 0
      );
      gui.setzeAktionAktiv(
        art.toLowerCase() + '-live-2',
        !offen && echte.length === 1
          && echte[0].testNummer === 1
          && echte[0].status === 'COMMITTED'
      );
    }
  }

  for (const art of FUNKTIONEN) {
    const klein = art.toLowerCase();
    gui.registriereAktion({
      kennung: klein + '-shadow',
      titel: art + ' · Shadow',
      art: 'primaer',
      async ausfuehren() {
        const result = await shadow(art);
        gui.protokolliere(art + ' Shadow', result);
        return setzeResultat(
          result,
          result.status === 'BESTANDEN'
            ? art + ' Shadow BESTANDEN. Kein Gameplay-Write.'
            : art + ' Shadow blockiert. Diagnose kopieren.'
        );
      }
    });

    for (const n of [1, 2]) {
      gui.registriereAktion({
        kennung: klein + '-live-' + String(n),
        titel: art + ' · LIVE ' + String(n),
        art: 'gefahr',
        aktiviert: false,
        einmalig: true,
        bestaetigungsText: bestaetigung(art, n),
        async ausfuehren() {
          const result = await live(art, n, bestaetigung(art, n));
          gui.protokolliere(art + ' LIVE ' + String(n), result);
          const out = setzeResultat(
            result,
            result.status === 'BESTANDEN'
              ? art + ' LIVE ' + String(n) + ' BESTANDEN.'
              : result.status === 'UNGEKLAERT'
                ? art + ' LIVE ' + String(n) + ' UNGEKLAERT. KEIN RETRY. Ergebnis kopieren.'
                : art + ' LIVE ' + String(n) + ' nicht bestanden/blockiert. Ergebnis kopieren.'
          );
          aktualisiereLiveButtons();
          return out;
        }
      });
    }
  }

  gui.registriereAktion({
    kennung: 'open-pack-shadow',
    titel: 'OPEN PACK · Shadow',
    art: 'primaer',
    async ausfuehren() {
      const result = await openBankPackShadow();
      gui.protokolliere('OPEN BANK PACK Shadow', result);
      return setzeResultat(
        result,
        result.status === 'BESTANDEN'
          ? 'OPEN PACK Shadow BESTANDEN. Kosten/Pfad beobachtet; kein Spend und kein Gameplay-Write.'
          : 'OPEN PACK Shadow blockiert. Diagnose kopieren; kein Spend.'
      );
    }
  });

  gui.registriereAktion({
    kennung: 'open-pack-admission',
    titel: 'OPEN PACK · Admission',
    async ausfuehren() {
      const result = await openBankPackAdmission();
      gui.protokolliere('OPEN BANK PACK Admission', result);
      return setzeResultat(
        result,
        result.status === 'BEREIT'
          ? 'OPEN PACK Admission hat mindestens einen finanzierbaren Pfad; Live bleibt trotzdem gesperrt.'
          : 'OPEN PACK Admission BLOCKIERT. Kein Spend, kein Gameplay-Write.'
      );
    }
  });

  gui.registriereAktion({
    kennung: 'diagnose',
    titel: 'Diagnose / Testbudget',
    async ausfuehren() {
      const result = diagnose();
      gui.protokolliere('Bank-Funktionstest Diagnose', result);
      return setzeResultat(result, 'Aktueller Testzustand. Ergebnis oder Gesamtbericht kann kopiert werden.');
    }
  });

  aktualisiereLiveButtons();
  gui.protokolliere('Bank-Funktionstest GUI gestartet', {
    controllerVersion: VERSION,
    performanceTrick: guiApi().performanceTrickStatus(),
    testlimit: MAX_TRUE_TESTS,
    sameIntentErneutSenden: false
  });

  const api = Object.freeze({
    version: VERSION,
    testkennung: TESTKENNUNG,
    test: gui,
    shadow,
    live,
    diagnose,
    openBankPackShadow,
    openBankPackAdmission,
    bestaetigung,
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

