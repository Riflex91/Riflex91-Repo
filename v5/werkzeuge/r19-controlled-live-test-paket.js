/* AUTO-GENERIERT: V5 R19 Ingame-Testpaket
 * Quellen:
 * - v5/werkzeuge/v5-adventure-land-test-gui.js
 * - v5/werkzeuge/r19-controlled-live-test-gui.js
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

  const API_NAME = 'V5R19TestGui';
  const VERSION = '1.0.0';
  const JOURNAL_KEY = 'AIO_V5_R19_TEST_JOURNAL_V1';
  const PROBE_KEY = 'AIO_V5_R19_TEST_PROBE_V1';
  const BESTAETIGUNG = 'R19-CONTROLLED-LIVE-EQUIP-ONCE';
  const ACTION = 'AL-ACTION-EQUIP';
  const RECOVERY = 'AL-RECOVERY-EQUIP';
  const VERIFIER = 'AL-VERIFIER-EQUIP';
  const ERLAUBTE_TYPEN = Object.freeze({
    helmet: 'helmet',
    chest: 'chest',
    pants: 'pants',
    shoes: 'shoes',
    gloves: 'gloves',
    cape: 'cape',
    amulet: 'amulet',
    belt: 'belt',
    orb: 'orb'
  });
  const SLOT_PRIORITAET = Object.freeze(['cape','belt','amulet','orb','helmet','gloves','shoes','pants','chest']);

  function fenster() {
    const kandidaten = [];
    try { kandidaten.push(globalThis); } catch {}
    try { if (parent && parent !== globalThis) kandidaten.push(parent); } catch {}
    for (const root of kandidaten) {
      try {
        if (root?.character && Array.isArray(root.character.items) && root.character.slots && root.G?.items) return root;
      } catch {}
    }
    throw new Error('R19_ADVENTURE_LAND_CODEKONTEXT_FEHLT');
  }

  function guiApi() {
    try { if (globalThis.V5TestGui) return globalThis.V5TestGui; } catch {}
    try { if (parent?.V5TestGui) return parent.V5TestGui; } catch {}
    throw new Error('V5_TEST_GUI_FEHLT');
  }

  function storage() {
    const root = fenster();
    try {
      if (root.localStorage) return root.localStorage;
    } catch {}
    try {
      if (globalThis.localStorage) return globalThis.localStorage;
    } catch {}
    throw new Error('R19_TEST_STORAGE_FEHLT');
  }

  function jetzt() { return new Date().toISOString(); }

  function runId() {
    const zufall = Math.floor(Math.random() * 0x100000000).toString(16).padStart(8, '0');
    return 'R19-' + Date.now() + '-' + zufall;
  }

  function cleanSlot(item) {
    return item ? { name: String(item.name || ''), level: Number(item.level || 0) } : null;
  }

  function runtimeStatus() {
    const roots = [];
    try { roots.push(globalThis); } catch {}
    try { if (parent && parent !== globalThis) roots.push(parent); } catch {}
    let v3 = { vorhanden: false, aktiv: false, detail: null };
    let v4 = { vorhanden: false, aktiv: false, detail: null };

    for (const root of roots) {
      try {
        const runtime = root?.AIO_V3?.__runtime;
        if (runtime) {
          const status = typeof runtime.status === 'function' ? runtime.status() : null;
          const aktiv = !!(runtime.timer || status?.running === true);
          v3 = { vorhanden: true, aktiv, detail: status };
        }
      } catch (error) {
        v3 = { vorhanden: true, aktiv: true, detail: { fehler: String(error?.message || error) } };
      }

      try {
        const runtime = root?.V4ProduktionsLaufzeit || root?.AIO_V4 || root?.V4Runtime;
        if (runtime) {
          const status = typeof runtime.status === 'function' ? runtime.status() : null;
          const aktiv = !!(status && (
            status.running === true ||
            status.aktivFreigegeben === true ||
            status.gestoppt === false ||
            status.empfangInstalliert === true
          ));
          v4 = { vorhanden: true, aktiv, detail: status };
        }
      } catch (error) {
        v4 = { vorhanden: true, aktiv: true, detail: { fehler: String(error?.message || error) } };
      }
    }

    return { v3, v4, alternativeRuntimeAktiv: v3.aktiv || v4.aktiv };
  }

  function stoppeAltRuntime() {
    const roots = [];
    try { roots.push(globalThis); } catch {}
    try { if (parent && parent !== globalThis) roots.push(parent); } catch {}
    const aktionen = [];

    for (const root of roots) {
      try {
        const runtime = root?.AIO_V3?.__runtime;
        if (runtime && typeof runtime.stop === 'function') {
          aktionen.push({ runtime: 'V3', ergebnis: runtime.stop() });
        }
      } catch (error) {
        aktionen.push({ runtime: 'V3', fehler: String(error?.message || error) });
      }
      try {
        const runtime = root?.V4ProduktionsLaufzeit;
        if (runtime && typeof runtime.stoppe === 'function') {
          aktionen.push({ runtime: 'V4', ergebnis: runtime.stoppe() });
        } else if (runtime && typeof runtime.stop === 'function') {
          aktionen.push({ runtime: 'V4', ergebnis: runtime.stop() });
        }
      } catch (error) {
        aktionen.push({ runtime: 'V4', fehler: String(error?.message || error) });
      }
    }

    const nachher = runtimeStatus();
    return {
      status: nachher.alternativeRuntimeAktiv ? 'BLOCKIERT' : 'BESTANDEN',
      zeit: jetzt(),
      aktionen,
      nachher
    };
  }

  function beobachte() {
    const root = fenster();
    const c = root.character;
    const entities = root.entities || {};
    const feinde = Object.values(entities).filter(e =>
      e && e.type === 'monster' && !e.dead && e.target === c.name).length;
    const slots = {};
    for (const slot of Object.values(ERLAUBTE_TYPEN)) slots[slot] = cleanSlot(c.slots?.[slot] || null);
    const inventar = c.items.map((item, index) => {
      if (!item?.name) return null;
      const def = root.G.items[item.name] || {};
      return {
        index,
        name: String(item.name),
        level: Number(item.level || 0),
        gesperrt: item.l === true || item.locked === true || item.lock === true,
        typ: String(def.type || '')
      };
    }).filter(Boolean);

    return {
      charakterName: String(c.name || ''),
      rip: !!c.rip,
      bewegtSich: !!c.moving,
      zielName: c.target == null ? null : String(c.target),
      feindeAufCharakter: feinde,
      runtime: runtimeStatus(),
      inventar,
      slots
    };
  }

  function ruheGruende(obs) {
    const gruende = [];
    if (!obs.charakterName) gruende.push('CHARAKTER_FEHLT');
    if (obs.rip) gruende.push('CHARAKTER_TOT');
    if (obs.bewegtSich) gruende.push('CHARAKTER_BEWEGT_SICH');
    if (obs.zielName !== null) gruende.push('CHARAKTER_HAT_ZIEL');
    if (obs.feindeAufCharakter !== 0) gruende.push('CHARAKTER_UNTER_ANGRIFF');
    if (obs.runtime.alternativeRuntimeAktiv) gruende.push('ALTERNATIVE_RUNTIME_AKTIV');
    return gruende;
  }

  function waehleKandidat(obs) {
    if (ruheGruende(obs).length) return null;
    const kandidaten = obs.inventar
      .filter(item => Number.isInteger(item.index)
        && item.index >= 0
        && item.index < 128
        && item.name
        && !item.gesperrt
        && ERLAUBTE_TYPEN[item.typ])
      .map(item => {
        const slot = ERLAUBTE_TYPEN[item.typ];
        const vorher = obs.slots[slot] ?? null;
        return {
          index: item.index,
          itemName: item.name,
          itemLevel: item.level,
          slot,
          slotWarLeer: vorher === null,
          vorherigesSlotItem: vorher
        };
      })
      .sort((a, b) =>
        Number(b.slotWarLeer) - Number(a.slotWarLeer)
        || SLOT_PRIORITAET.indexOf(a.slot) - SLOT_PRIORITAET.indexOf(b.slot)
        || a.index - b.index);
    return kandidaten[0] ?? null;
  }

  function kandidatFingerprint(k) {
    return JSON.stringify({
      index: k.index,
      itemName: k.itemName,
      itemLevel: k.itemLevel,
      slot: k.slot,
      vorherigesSlotItem: k.vorherigesSlotItem
    });
  }

  function liesJournal() {
    const raw = storage().getItem(JOURNAL_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); }
    catch { return { status: 'UNGEKLAERT', fehler: 'JOURNAL_JSON_UNGUELTIG' }; }
  }

  function journalOffen(journal) {
    return !!journal && !['COMMITTED','ABORTED'].includes(journal.status);
  }

  function schreibeJournal(wert) {
    const text = JSON.stringify(wert);
    if (text.length > 12000) throw new Error('R19_TEST_JOURNAL_ZU_GROSS');
    const store = storage();
    store.setItem(JOURNAL_KEY, text);
    const roundtrip = store.getItem(JOURNAL_KEY);
    if (roundtrip !== text) throw new Error('R19_TEST_JOURNAL_ROUNDTRIP_FEHLER');
    return wert;
  }

  function pruefeStorage() {
    const store = storage();
    const probe = JSON.stringify({ schemaVersion: 1, zeit: jetzt(), probe: 'R19' });
    store.setItem(PROBE_KEY, probe);
    const gelesen = store.getItem(PROBE_KEY);
    store.removeItem(PROBE_KEY);
    return { ok: gelesen === probe, art: 'BROWSER_TEST_WITNESS', produktionsPersistenz: false };
  }

  async function passiveVorpruefung() {
    const obs = beobachte();
    const gruende = ruheGruende(obs);
    const performanceTrick = guiApi().aktivierePerformanceTrick();
    if (!performanceTrick.aktiv) gruende.push('PERFORMANCE_TRICK_NICHT_AKTIV');
    const journal = liesJournal();
    if (journalOffen(journal)) gruende.push('VORHERIGER_TESTVERSUCH_UNGEKLAERT');
    const speicher = pruefeStorage();
    if (!speicher.ok) gruende.push('TEST_JOURNAL_NICHT_DURABLE');
    const kandidat = waehleKandidat(obs);
    if (!kandidat) gruende.push('KEIN_SICHERER_EQUIP_KANDIDAT');

    return {
      schemaVersion: 1,
      test: 'R19_CONTROLLED_LIVE_EQUIP_CERTIFICATION',
      phase: 'R19',
      status: gruende.length ? 'BLOCKIERT' : 'BESTANDEN',
      zeit: jetzt(),
      breiteRuntimeFreigabe: false,
      performanceTrick,
      actionContractId: ACTION,
      recoveryContractId: RECOVERY,
      verifierId: VERIFIER,
      charakter: obs.charakterName,
      health: {
        rip: obs.rip,
        bewegtSich: obs.bewegtSich,
        zielName: obs.zielName,
        feindeAufCharakter: obs.feindeAufCharakter,
        alternativeRuntimeAktiv: obs.runtime.alternativeRuntimeAktiv
      },
      runtime: obs.runtime,
      kandidat,
      kandidatFingerprint: kandidat ? kandidatFingerprint(kandidat) : null,
      testJournal: {
        speicher,
        bestehenderEintrag: journal ? { status: journal.status, runId: journal.runId ?? null, zeit: journal.zeit ?? null } : null
      },
      blocker: gruende
    };
  }

  function itemAmIndex(obs, index) {
    return obs.inventar.find(x => x.index === index) ?? null;
  }

  function slotGleich(a, b) {
    if (a === null || b === null) return a === b;
    return a.name === b.name && a.level === b.level;
  }

  async function postcondition(kandidat, versuche = 4) {
    let letzte = null;
    for (let i = 0; i < versuche; i += 1) {
      if (i > 0) await new Promise(resolve => setTimeout(resolve, 300));
      const obs = beobachte();
      const slot = obs.slots[kandidat.slot] ?? null;
      const item = itemAmIndex(obs, kandidat.index);
      const slotCommitted = slot?.name === kandidat.itemName && slot?.level === kandidat.itemLevel;
      const inventoryCommitted = kandidat.vorherigesSlotItem === null
        ? item === null
        : item?.name === kandidat.vorherigesSlotItem.name && item?.level === kandidat.vorherigesSlotItem.level;
      const preNochDa = slotGleich(slot, kandidat.vorherigesSlotItem)
        && item?.name === kandidat.itemName
        && item?.level === kandidat.itemLevel;
      letzte = { obs, slot, item, slotCommitted, inventoryCommitted, preNochDa };
      if (slotCommitted && inventoryCommitted) return { klassifikation: 'BESTAETIGT', ...letzte };
    }
    if (letzte?.preNochDa) return { klassifikation: 'NICHT_AUSGEFUEHRT', ...letzte };
    return { klassifikation: 'UNGEKLAERT', ...letzte };
  }

  const gui = guiApi().erstelleTest({
    kennung: 'r19-controlled-live-equip',
    titel: 'V5 · R19 Controlled Live · Equip-Zertifizierung',
    beschreibung: 'R19 Controlled-Live-Zertifizierung. Maximal ein equip-Send, Postcondition-Pflicht, kein automatischer Retry. Danach Gesamtbericht kopieren.'
  });

  let letzterPreflight = null;
  let sendVerbraucht = false;

  function setzeResultat(ergebnis, text) {
    const status = ergebnis.status === 'BESTANDEN'
      ? 'bestanden'
      : ergebnis.status === 'BLOCKIERT'
        ? 'blockiert'
        : ergebnis.status === 'UNGEKLAERT'
          ? 'warnung'
          : 'fehler';
    gui.setzeErgebnis(ergebnis, status, text);
    return ergebnis;
  }

  gui.registriereAktion({
    kennung: 'runtime-stoppen',
    titel: '1 · Alte Runtime stoppen',
    art: 'normal',
    async ausfuehren() {
      const performanceTrick = guiApi().aktivierePerformanceTrick();
      const result = stoppeAltRuntime();
      result.performanceTrick = performanceTrick;
      if (!performanceTrick.aktiv) result.status = 'BLOCKIERT';
      gui.protokolliere('Alte Runtime stoppen', result);
      setzeResultat(result, result.status === 'BESTANDEN'
        ? 'Keine alte V3/V4-Gameplay-Runtime mehr aktiv; performance_trick ist aktiv.'
        : 'Runtime- oder performance_trick-Vorbedingung ist nicht erfuellt.');
      gui.setzeAktionAktiv('passive-vorpruefung', result.status === 'BESTANDEN');
      return result;
    }
  });

  gui.registriereAktion({
    kennung: 'passive-vorpruefung',
    titel: '2 · Passive Vorprüfung',
    art: 'primaer',
    aktiviert: false,
    async ausfuehren() {
      const result = await passiveVorpruefung();
      letzterPreflight = result;
      gui.protokolliere('Passive Vorpruefung', result);
      setzeResultat(result, result.status === 'BESTANDEN'
        ? 'Vorprüfung bestanden. Genau ein Equip-One-Shot kann freigegeben werden.'
        : 'Vorprüfung blockiert. Keine Spielaktion wurde ausgeführt.');
      gui.setzeAktionAktiv('one-shot', result.status === 'BESTANDEN' && !sendVerbraucht);
      return result;
    }
  });

  gui.registriereAktion({
    kennung: 'one-shot',
    titel: '3 · ONE-SHOT equip',
    art: 'gefahr',
    aktiviert: false,
    einmalig: true,
    bestaetigungsText: BESTAETIGUNG,
    async ausfuehren() {
      if (sendVerbraucht) throw new Error('R19_ONE_SHOT_BEREITS_VERBRAUCHT');
      if (!letzterPreflight || letzterPreflight.status !== 'BESTANDEN' || !letzterPreflight.kandidat) {
        throw new Error('R19_PASSIVE_VORPRUEFUNG_FEHLT');
      }

      const frisch = await passiveVorpruefung();
      if (frisch.status !== 'BESTANDEN') {
        setzeResultat(frisch, 'Frische Vorprüfung blockiert. Kein Send.');
        return frisch;
      }
      if (frisch.kandidatFingerprint !== letzterPreflight.kandidatFingerprint) {
        const drift = {
          schemaVersion: 1,
          status: 'BLOCKIERT',
          zeit: jetzt(),
          blocker: ['KANDIDAT_DRIFT_ZWISCHEN_VORPRUEFUNG_UND_SEND'],
          vorher: letzterPreflight.kandidat,
          jetzt: frisch.kandidat
        };
        setzeResultat(drift, 'Kandidat hat sich geändert. Kein Send.');
        return drift;
      }

      const root = fenster();
      const kandidat = frisch.kandidat;
      const id = runId();
      const intent = {
        schemaVersion: 1,
        runId: id,
        status: 'INTENT',
        zeit: jetzt(),
        actionContractId: ACTION,
        recoveryContractId: RECOVERY,
        verifierId: VERIFIER,
        publicFunction: 'equip',
        maximaleAktionen: 1,
        sameIntentRetry: false,
        breiteRuntimeFreigabe: false,
        preflight: {
          charakter: frisch.charakter,
          kandidat,
          health: frisch.health
        }
      };
      schreibeJournal(intent);
      sendVerbraucht = true;
      gui.setzeAktionAktiv('passive-vorpruefung', false);

      let serverErgebnis = null;
      let serverFehler = null;
      try {
        serverErgebnis = await Promise.resolve(root.equip(kandidat.index, kandidat.slot));
      } catch (error) {
        serverFehler = String(error?.message || error);
      }

      const post = await postcondition(kandidat);
      const erfolgreich = post.klassifikation === 'BESTAETIGT';
      const finalStatus = erfolgreich ? 'COMMITTED' : 'UNGEKLAERT';
      const journal = {
        ...intent,
        status: finalStatus,
        abgeschlossenAm: jetzt(),
        sendVersuche: 1,
        serverErgebnis: serverErgebnis ?? null,
        serverFehler,
        postcondition: {
          klassifikation: post.klassifikation,
          slot: post.slot ?? null,
          inventoryIndex: post.item ?? null
        }
      };
      schreibeJournal(journal);

      const result = {
        schemaVersion: 1,
        test: 'R19_CONTROLLED_LIVE_EQUIP',
        phase: 'R19',
        status: erfolgreich ? 'BESTANDEN' : 'UNGEKLAERT',
        zeit: jetzt(),
        runId: id,
        actionContractId: ACTION,
        recoveryContractId: RECOVERY,
        verifierId: VERIFIER,
        publicFunction: 'equip',
        gameWrites: 1,
        unerwarteteGameWrites: 0,
        maximaleAktionen: 1,
        sameIntentRetry: false,
        breiteRuntimeFreigabe: false,
        zertifizierungsStufe: 'CONTROLLED_LIVE',
        manuelleBestaetigung: true,
        charakter: frisch.charakter,
        kandidat,
        serverErgebnis: serverErgebnis ?? null,
        serverFehler,
        postcondition: {
          klassifikation: post.klassifikation,
          slot: post.slot ?? null,
          inventoryIndex: post.item ?? null
        },
        testJournal: {
          art: 'BROWSER_TEST_WITNESS',
          produktionsPersistenz: false,
          status: finalStatus
        },
        hinweis: erfolgreich
          ? 'One-Shot postcondition-verifiziert. Keine weitere Spielaktion ausführen; Bericht kopieren und senden.'
          : 'Ausgang ist nicht eindeutig. KEIN Retry. Bericht kopieren und senden.'
      };
      gui.protokolliere('ONE-SHOT Ergebnis', result);
      return setzeResultat(result, erfolgreich
        ? 'BESTANDEN · Genau ein equip-Send, Postcondition bestätigt. Jetzt Gesamtbericht kopieren.'
        : 'UNGEKLÄRT · Kein Retry. Gesamtbericht kopieren und senden.');
    }
  });

  gui.registriereAktion({
    kennung: 'journal-anzeigen',
    titel: 'Testjournal anzeigen',
    ausfuehren() {
      const journal = liesJournal();
      const result = {
        schemaVersion: 1,
        status: journal ? 'INFO' : 'LEER',
        zeit: jetzt(),
        journal
      };
      gui.protokolliere('Testjournal gelesen', result);
      gui.setzeErgebnis(result, 'info', journal ? 'Aktueller Testjournal-Eintrag.' : 'Kein Testjournal vorhanden.');
      return result;
    }
  });

  const api = Object.freeze({
    version: VERSION,
    bestaetigungsText: BESTAETIGUNG,
    test: gui,
    status: () => gui.status(),
    passiveVorpruefung,
    runtimeStatus,
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

  gui.protokolliere('R19 Ingame-Test-GUI bereit', {
    version: VERSION,
    bestaetigungsText: BESTAETIGUNG,
    actionContractId: ACTION,
    zertifizierungsStufe: 'CONTROLLED_LIVE',
    maximaleAktionen: 1,
    sameIntentRetry: false,
    breiteRuntimeFreigabe: false
  });
  gui.setzeStatus('bereit', 'Mit „1 · Alte Runtime stoppen“ beginnen.');
})();
