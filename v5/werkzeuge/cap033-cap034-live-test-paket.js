/* AUTO-GENERIERT: V5 CAP-033/034 Live-Funktionstest
 * Quellen:
 * - v5/werkzeuge/v5-adventure-land-test-gui.js
 * - v5/werkzeuge/cap033-cap034-live-test-gui.js
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

  const API_NAME = 'V5Cap033034LiveTest';
  const VERSION = '1.0.0';
  const SESSION_KEY = 'AIO_V5_CAP033034_LIVE_SESSION_V1';
  const JOURNAL_KEY = 'AIO_V5_CAP034_MUTATION_JOURNAL_V1';
  const DAUER_MS = 5 * 60 * 1000;
  const INTERVALL_MS = 15 * 1000;
  const MAX_SAMPLE_GAP_MS = 45 * 1000;
  const MAX_SAMPLES = 30;
  const MIN_PREVIEW_CHANCE = 0.99;
  const MAX_TEST_BASISWERT_GOLD = 100000;
  const UPGRADE_BESTAETIGUNG = 'CAP034-UPGRADE-ONE-SHOT-ITEMVERLUST-AKZEPTIERT';
  const COMPOUND_BESTAETIGUNG = 'CAP034-COMPOUND-ONE-SHOT-3-ITEM-VERLUST-AKZEPTIERT';
  const ERLAUBTE_GEAR_TYPEN = Object.freeze({
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

  function rootFenster() {
    const kandidaten = [];
    try { kandidaten.push(globalThis); } catch {}
    try { if (parent && parent !== globalThis) kandidaten.push(parent); } catch {}
    for (const root of kandidaten) {
      try {
        if (root?.character && Array.isArray(root.character.items)
            && root.character.slots && root.G?.items) return root;
      } catch {}
    }
    throw new Error('CAP033034_ADVENTURE_LAND_CODEKONTEXT_FEHLT');
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
    throw new Error('CAP033034_STORAGE_FEHLT');
  }

  function jetztIso() { return new Date().toISOString(); }

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
          v3 = { vorhanden: true, aktiv: !!(runtime.timer || status?.running === true), status };
        }
      } catch (error) {
        v3 = { vorhanden: true, aktiv: true, fehler: String(error?.message || error) };
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
          v4 = { vorhanden: true, aktiv, status };
        }
      } catch (error) {
        v4 = { vorhanden: true, aktiv: true, fehler: String(error?.message || error) };
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
      aktionen,
      nachher
    };
  }

  function hashText(text) {
    let hash = 2166136261 >>> 0;
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619) >>> 0;
    }
    return hash.toString(16).padStart(8, '0');
  }

  function itemMenge(item) {
    if (!item) return 0;
    const q = Number(item.q);
    return Number.isFinite(q) && q > 0 ? Math.trunc(q) : 1;
  }

  function itemLocked(item) {
    return item?.l === true || item?.locked === true || item?.lock === true;
  }

  function plainItem(item) {
    if (!item?.name || itemLocked(item)) return false;
    if (item.p != null || item.stat_type != null) return false;
    if (Number(item.grace || 0) !== 0) return false;
    if (item.expires != null || item.gift != null || item.data != null) return false;
    return true;
  }

  function cleanItem(root, item, index) {
    if (!item?.name) return null;
    const def = root.G.items[item.name] || {};
    return {
      index,
      name: String(item.name),
      level: Number(item.level || 0),
      menge: itemMenge(item),
      locked: itemLocked(item),
      plain: plainItem(item),
      typ: String(def.type || ''),
      upgrade: !!def.upgrade,
      compound: !!def.compound,
      cash: def.cash === true || def.cash_item === true,
      quest: def.quest === true || def.q === true,
      event: def.event === true,
      exchange: def.exchange === true || def.e === true,
      basisGold: Number.isFinite(Number(def.g ?? def.gold))
        ? Math.max(0, Math.trunc(Number(def.g ?? def.gold)))
        : 0,
      fingerprint: hashText(JSON.stringify({
        index,
        name: String(item.name),
        level: Number(item.level || 0),
        menge: itemMenge(item),
        locked: itemLocked(item),
        p: item.p ?? null,
        stat_type: item.stat_type ?? null,
        grace: Number(item.grace || 0)
      }))
    };
  }

  function inventarSnapshot(root) {
    return root.character.items
      .map((item, index) => cleanItem(root, item, index))
      .filter(Boolean)
      .slice(0, 128);
  }

  function istGeschuetzt(item) {
    return item.cash || item.quest || item.event || item.exchange;
  }

  function gearKandidat(root, inventar) {
    const rows = inventar
      .filter(x => x.plain && !istGeschuetzt(x) && ERLAUBTE_GEAR_TYPEN[x.typ])
      .map(x => ({
        index: x.index,
        name: x.name,
        level: x.level,
        slot: ERLAUBTE_GEAR_TYPEN[x.typ],
        slotIstLeer: !root.character.slots?.[ERLAUBTE_GEAR_TYPEN[x.typ]],
        fingerprint: x.fingerprint
      }))
      .sort((a, b) =>
        Number(b.slotIstLeer) - Number(a.slotIstLeer)
        || a.level - b.level
        || a.index - b.index);
    return rows[0] ?? null;
  }

  function findeScroll(inventar, typ, name) {
    return inventar.find(x =>
      x.name === name && x.typ === typ && x.menge >= 1 && !x.locked) ?? null;
  }

  function upgradeKandidat(inventar) {
    const scroll = findeScroll(inventar, 'uscroll', 'scroll0');
    if (!scroll) return null;
    const ziel = inventar
      .filter(x =>
        x.upgrade && x.level === 0 && x.plain && !istGeschuetzt(x)
        && x.basisGold > 0 && x.basisGold <= MAX_TEST_BASISWERT_GOLD
        && x.index !== scroll.index)
      .sort((a, b) => a.index - b.index)[0] ?? null;
    if (!ziel) return null;
    return {
      art: 'UPGRADE',
      ziel,
      scroll,
      fingerprint: hashText(JSON.stringify({
        ziel: ziel.fingerprint,
        scroll: scroll.fingerprint
      }))
    };
  }

  function compoundKandidat(inventar) {
    const scroll = findeScroll(inventar, 'cscroll', 'cscroll0');
    if (!scroll) return null;
    const gruppen = {};
    for (const item of inventar) {
      if (!item.compound || item.level !== 0 || !item.plain || istGeschuetzt(item)
          || item.basisGold <= 0 || item.basisGold > MAX_TEST_BASISWERT_GOLD
          || item.index === scroll.index) continue;
      const key = item.name + ':' + item.level;
      if (!gruppen[key]) gruppen[key] = [];
      if (gruppen[key].length < 3) gruppen[key].push(item);
    }
    const key = Object.keys(gruppen).sort().find(k => gruppen[k].length >= 3);
    if (!key) return null;
    const ziele = gruppen[key].slice(0, 3);
    return {
      art: 'COMPOUND',
      ziele,
      scroll,
      fingerprint: hashText(JSON.stringify({
        ziele: ziele.map(x => x.fingerprint),
        scroll: scroll.fingerprint
      }))
    };
  }

  function qStatus(root) {
    return {
      upgrade: root.character?.q?.upgrade ?? null,
      compound: root.character?.q?.compound ?? null
    };
  }

  function beobachte() {
    const root = rootFenster();
    const inventar = inventarSnapshot(root);
    const runtime = runtimeStatus();
    const gear = gearKandidat(root, inventar);
    const upgrade = upgradeKandidat(inventar);
    const compound = compoundKandidat(inventar);
    return {
      zeitMs: Date.now(),
      charakter: String(root.character?.name || ''),
      rip: !!root.character?.rip,
      bewegtSich: !!root.character?.moving,
      ziel: root.character?.target == null ? null : String(root.character.target),
      runtime,
      q: qStatus(root),
      inventar,
      inventarFingerprint: hashText(JSON.stringify(inventar)),
      gear,
      upgrade,
      compound
    };
  }

  function blockerFuerLive(obs) {
    const blocker = [];
    if (!obs.charakter) blocker.push('CHARAKTER_FEHLT');
    if (obs.rip) blocker.push('CHARAKTER_TOT');
    if (obs.bewegtSich) blocker.push('CHARAKTER_BEWEGT_SICH');
    if (obs.ziel !== null) blocker.push('CHARAKTER_HAT_ZIEL');
    if (obs.runtime.alternativeRuntimeAktiv) blocker.push('ALTERNATIVE_RUNTIME_AKTIV');
    if (obs.q.upgrade || obs.q.compound) blocker.push('MUTATIONS_Q_BEREITS_AKTIV');
    return blocker;
  }

  function liesSession() {
    const raw = storage().getItem(SESSION_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); }
    catch { return { status: 'BESCHAEDIGT', samples: [] }; }
  }

  function schreibeSession(session) {
    const text = JSON.stringify(session);
    if (text.length > 900000) throw new Error('CAP033034_SESSION_ZU_GROSS');
    storage().setItem(SESSION_KEY, text);
    if (storage().getItem(SESSION_KEY) !== text) {
      throw new Error('CAP033034_SESSION_ROUNDTRIP_FEHLER');
    }
  }

  function liesJournal() {
    const raw = storage().getItem(JOURNAL_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); }
    catch { return { status: 'BESCHAEDIGT' }; }
  }

  function journalOffen(journal) {
    return !!journal && !['COMMITTED','ABORTED'].includes(journal.status);
  }

  function schreibeJournal(journal) {
    const text = JSON.stringify(journal);
    if (text.length > 20000) throw new Error('CAP034_JOURNAL_ZU_GROSS');
    storage().setItem(JOURNAL_KEY, text);
    if (storage().getItem(JOURNAL_KEY) !== text) {
      throw new Error('CAP034_JOURNAL_ROUNDTRIP_FEHLER');
    }
  }

  function validiereKette(samples) {
    if (!Array.isArray(samples) || samples.length > MAX_SAMPLES) return false;
    let vorher = null;
    for (let i = 0; i < samples.length; i += 1) {
      const s = samples[i];
      if (!s || s.sequenz !== i + 1 || s.vorherigerFingerprint !== vorher) return false;
      const basis = { ...s };
      delete basis.evidenceFingerprint;
      if (s.evidenceFingerprint !== hashText(JSON.stringify(basis))) return false;
      vorher = s.evidenceFingerprint;
    }
    return true;
  }

  function sampleErstellen(session) {
    const obs = beobachte();
    const vorher = session.samples.at(-1) || null;
    const basis = {
      schemaVersion: 1,
      sequenz: session.samples.length + 1,
      zeitMs: obs.zeitMs,
      seitStartMs: obs.zeitMs - session.gestartetAmMs,
      vorherigerFingerprint: vorher?.evidenceFingerprint ?? null,
      gapMs: vorher ? obs.zeitMs - vorher.zeitMs : 0,
      charakter: obs.charakter,
      rip: obs.rip,
      alternativeRuntimeAktiv: obs.runtime.alternativeRuntimeAktiv,
      performanceTrickAktiv: guiApi().performanceTrickStatus().aktiv === true,
      qUpgradeAktiv: !!obs.q.upgrade,
      qCompoundAktiv: !!obs.q.compound,
      inventarFingerprint: obs.inventarFingerprint,
      gearKandidat: obs.gear,
      upgradeKandidat: obs.upgrade,
      compoundKandidat: obs.compound,
      gameplayWritesDurchHarness: 0
    };
    return Object.freeze({
      ...basis,
      evidenceFingerprint: hashText(JSON.stringify(basis))
    });
  }

  function bewerteShadow(session) {
    const samples = session.samples;
    const letzter = samples.at(-1);
    const dauerMs = letzter ? letzter.zeitMs - session.gestartetAmMs : 0;
    const blocker = [];
    const gaps = samples.filter(x => x.gapMs > MAX_SAMPLE_GAP_MS).length;
    const gearSamples = samples.filter(x => x.gearKandidat !== null).length;
    const mutationSamples = samples.filter(x =>
      x.upgradeKandidat !== null || x.compoundKandidat !== null).length;
    if (dauerMs < DAUER_MS) blocker.push('DAUER_UNTER_5M');
    if (samples.length < 20) blocker.push('ZU_WENIGE_SAMPLES');
    if (!validiereKette(samples)) blocker.push('EVIDENCE_KETTE_UNGUELTIG');
    if (gaps !== 0) blocker.push('SAMPLE_GAPS');
    if (samples.some(x => x.rip)) blocker.push('CHARAKTER_TOT');
    if (samples.some(x => x.alternativeRuntimeAktiv)) blocker.push('ALTERNATIVE_RUNTIME_AKTIV');
    if (samples.some(x => !x.performanceTrickAktiv)) blocker.push('PERFORMANCE_TRICK_AUSGEFALLEN');
    if (samples.some(x => x.qUpgradeAktiv || x.qCompoundAktiv)) blocker.push('UNERWARTETE_MUTATIONS_Q');
    if (gearSamples === 0) blocker.push('CAP033_KEIN_GEAR_KANDIDAT_BEOBACHTET');
    if (mutationSamples === 0) blocker.push('CAP034_KEIN_MUTATIONS_KANDIDAT_BEOBACHTET');
    return {
      schemaVersion: 1,
      test: 'CAP033_CAP034_FUNKTION_5M_LIVE_SHADOW',
      testzeitStandard: 'FUNKTION_5M',
      status: blocker.length ? 'NICHT_BESTANDEN' : 'BESTANDEN',
      dauerMs,
      sampleAnzahl: samples.length,
      sampleGaps: gaps,
      evidenceKetteGueltig: validiereKette(samples),
      cap033GearKandidatSamples: gearSamples,
      cap034MutationsKandidatSamples: mutationSamples,
      gameplayWritesDurchHarness: 0,
      unerwarteteGameWrites: 0,
      blocker,
      hinweis: blocker.length
        ? 'Live-Shadow nicht bestanden. Vor Mutation Bericht auswerten.'
        : '5-Minuten-Live-Shadow bestanden. Controlled-Live-Preview kann folgen.'
    };
  }

  async function passiveVorpruefung() {
    const obs = beobachte();
    const blocker = blockerFuerLive(obs);
    const performanceTrick = await guiApi().aktivierePerformanceTrick();
    if (!performanceTrick.aktiv) blocker.push('PERFORMANCE_TRICK_NICHT_AKTIV');
    const journal = liesJournal();
    if (journalOffen(journal)) blocker.push('VORHERIGE_MUTATION_UNGEKLAERT');
    if (!obs.gear) blocker.push('CAP033_KEIN_GEAR_KANDIDAT');
    if (!obs.upgrade && !obs.compound) blocker.push('CAP034_KEIN_TESTKANDIDAT');
    return {
      schemaVersion: 1,
      status: blocker.length ? 'BLOCKIERT' : 'BESTANDEN',
      zeit: jetztIso(),
      charakter: obs.charakter,
      performanceTrick,
      runtime: obs.runtime,
      q: obs.q,
      cap033GearKandidat: obs.gear,
      cap034UpgradeKandidat: obs.upgrade,
      cap034CompoundKandidat: obs.compound,
      blocker,
      gameplayWritesDurchHarness: 0
    };
  }

  function previewChance(result) {
    const kandidaten = [
      result?.chance,
      result?.probability,
      result?.p,
      typeof result === 'number' ? result : null
    ];
    for (const wert of kandidaten) {
      const n = Number(wert);
      if (Number.isFinite(n) && n >= 0 && n <= 1) return n;
    }
    return null;
  }

  async function rufeUpgrade(root, kandidat, nurBerechnen) {
    return Promise.resolve(
      root.upgrade(
        kandidat.ziel.index,
        kandidat.scroll.index,
        null,
        nurBerechnen
      )
    );
  }

  async function rufeCompound(root, kandidat, nurBerechnen) {
    return Promise.resolve(
      root.compound(
        kandidat.ziele[0].index,
        kandidat.ziele[1].index,
        kandidat.ziele[2].index,
        kandidat.scroll.index,
        null,
        nurBerechnen
      )
    );
  }

  function shadowBestanden() {
    const session = liesSession();
    return session?.status === 'COMPLETED'
      && session?.result?.status === 'BESTANDEN';
  }

  async function preview(art) {
    if (!shadowBestanden()) {
      throw new Error('CAP033034_5M_SHADOW_FEHLT');
    }
    const pre = await passiveVorpruefung();
    if (pre.status !== 'BESTANDEN') return pre;
    const obs = beobachte();
    const kandidat = art === 'UPGRADE' ? obs.upgrade : obs.compound;
    if (!kandidat) {
      return { status: 'BLOCKIERT', blocker: ['KANDIDAT_FEHLT'], art };
    }
    const root = rootFenster();
    let result;
    try {
      result = art === 'UPGRADE'
        ? await rufeUpgrade(root, kandidat, true)
        : await rufeCompound(root, kandidat, true);
    } catch (error) {
      return {
        status: 'BLOCKIERT',
        art,
        blocker: ['SERVER_PREVIEW_ABGELEHNT'],
        serverFehler: String(error?.message || error),
        kandidat
      };
    }
    const chance = previewChance(result);
    return {
      schemaVersion: 1,
      status: chance !== null && chance >= MIN_PREVIEW_CHANCE
        ? 'BESTANDEN'
        : 'BLOCKIERT',
      art,
      kandidat,
      kandidatFingerprint: kandidat.fingerprint,
      previewChance: chance,
      minimalePreviewChance: MIN_PREVIEW_CHANCE,
      serverPreview: result ?? null,
      previewVerbrauchtNichts: true,
      gameplayWritesDurchHarness: 0,
      blocker: chance === null
        ? ['PREVIEW_CHANCE_NICHT_LESBAR']
        : chance < MIN_PREVIEW_CHANCE
          ? ['PREVIEW_CHANCE_UNTER_TESTGRENZE']
          : []
    };
  }

  function itemAmIndex(root, index) {
    return cleanItem(root, root.character.items[index], index);
  }

  function scrollMenge(root, index) {
    return itemMenge(root.character.items[index]);
  }

  async function warteTerminal(art, kandidat, pre, timeoutMs = 30000) {
    const start = Date.now();
    let qGesehen = false;
    while (Date.now() - start <= timeoutMs) {
      const root = rootFenster();
      const q = qStatus(root);
      if (art === 'UPGRADE' && q.upgrade) qGesehen = true;
      if (art === 'COMPOUND' && q.compound) qGesehen = true;
      const aktiv = art === 'UPGRADE' ? !!q.upgrade : !!q.compound;
      if (!aktiv && (qGesehen || Date.now() - start > 1200)) {
        const scrollNachher = scrollMenge(root, kandidat.scroll.index);
        if (art === 'UPGRADE') {
          const ziel = itemAmIndex(root, kandidat.ziel.index);
          const success = ziel?.name === kandidat.ziel.name
            && ziel?.level === kandidat.ziel.level + 1;
          const preUnveraendert = ziel?.fingerprint === kandidat.ziel.fingerprint
            && scrollNachher === pre.scrollMenge;
          const konsumiert = scrollNachher < pre.scrollMenge;
          return {
            klassifikation: success
              ? 'BESTAETIGT_ERFOLG'
              : konsumiert && !preUnveraendert
                ? 'BESTAETIGT_ERWARTETER_FEHLER_ODER_VERLUST'
                : preUnveraendert && !qGesehen
                  ? 'NICHT_AUSGEFUEHRT'
                  : 'UNGEKLAERT',
            qGesehen,
            ziel,
            scrollMengeVorher: pre.scrollMenge,
            scrollMengeNachher: scrollNachher
          };
        }
        const ziele = kandidat.ziele.map(x => itemAmIndex(root, x.index));
        const success = ziele[0]?.name === kandidat.ziele[0].name
          && ziele[0]?.level === kandidat.ziele[0].level + 1
          && ziele[1] === null && ziele[2] === null;
        const allePre = ziele.every((x, i) =>
          x?.fingerprint === kandidat.ziele[i]?.fingerprint);
        const konsumiert = scrollNachher < pre.scrollMenge;
        return {
          klassifikation: success
            ? 'BESTAETIGT_ERFOLG'
            : konsumiert && ziele.every(x => x === null)
              ? 'BESTAETIGT_COMPOUND_VERLUST'
              : allePre && !qGesehen && !konsumiert
                ? 'NICHT_AUSGEFUEHRT'
                : 'UNGEKLAERT',
          qGesehen,
          ziele,
          scrollMengeVorher: pre.scrollMenge,
          scrollMengeNachher: scrollNachher
        };
      }
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    return { klassifikation: 'UNGEKLAERT_TIMEOUT', qGesehen };
  }

  let letzterUpgradePreview = null;
  let letzterCompoundPreview = null;
  let sendVerbraucht = false;
  let shadowTimer = null;
  let countdownTimer = null;
  let sampling = false;

  const gui = guiApi().erstelleTest({
    kennung: 'cap033-cap034-live-function-test',
    titel: 'V5 · CAP-033/034 · Echte Funktionsabnahme',
    beschreibung: 'Zuerst 5 Minuten echte Live-Shadow-Evidence ohne Write. Danach optional exakt ein manuell bestaetigter Upgrade- ODER Compound-Send mit Postcondition und ohne Retry.'
  });

  function setzeResultat(result, text) {
    const status = result.status === 'BESTANDEN'
      ? 'bestanden'
      : result.status === 'BLOCKIERT'
        ? 'blockiert'
        : result.status === 'NICHT_BESTANDEN'
          ? 'fehler'
          : result.status === 'UNGEKLAERT'
            ? 'warnung'
            : 'info';
    gui.setzeErgebnis(result, status, text);
    return result;
  }

  function restzeitMs(session) {
    return Math.max(0, DAUER_MS - (Date.now() - session.gestartetAmMs));
  }

  function stoppeCountdown(abgeschlossen = false) {
    if (countdownTimer !== null) clearInterval(countdownTimer);
    countdownTimer = null;
    if (abgeschlossen) gui.setzeRestzeit(0, '5-Minuten-Testdauer erreicht');
    else gui.setzeRestzeit(null);
  }

  async function shadowTick() {
    if (sampling) return;
    sampling = true;
    try {
      const session = liesSession();
      if (!session || session.status !== 'RUNNING') return;
      if (!validiereKette(session.samples)) {
        throw new Error('CAP033034_EVIDENCE_KETTE_MANIPULIERT');
      }
      const sample = sampleErstellen(session);
      const samples = [...session.samples, sample];
      if (samples.length > MAX_SAMPLES) {
        throw new Error('CAP033034_SAMPLE_GRENZE_UEBERSCHRITTEN');
      }
      const aktualisiert = { ...session, samples };
      schreibeSession(aktualisiert);
      gui.setzeRestzeit(restzeitMs(aktualisiert), 'Verbleibende Live-Shadow-Dauer');
      gui.setzeErgebnis({
        status: 'LAEUFT',
        seitStartMs: sample.seitStartMs,
        sampleAnzahl: samples.length,
        gearKandidat: sample.gearKandidat,
        upgradeKandidat: sample.upgradeKandidat,
        compoundKandidat: sample.compoundKandidat,
        gameplayWritesDurchHarness: 0
      }, 'laeuft', 'CAP-033/034 Live-Shadow laeuft.');
      if (sample.seitStartMs >= DAUER_MS) {
        if (shadowTimer !== null) clearInterval(shadowTimer);
        shadowTimer = null;
        stoppeCountdown(true);
        const finalSession = {
          ...aktualisiert,
          status: 'COMPLETED',
          abgeschlossenAmMs: Date.now()
        };
        const result = bewerteShadow(finalSession);
        schreibeSession({ ...finalSession, result });
        gui.protokolliere('5m Live-Shadow abgeschlossen', result);
        setzeResultat(result, result.status === 'BESTANDEN'
          ? '5m Live-Shadow BESTANDEN. Jetzt Preview ausfuehren.'
          : '5m Live-Shadow NICHT BESTANDEN. Kein Mutations-Send.');
        gui.setzeAktionAktiv('preview-upgrade', result.status === 'BESTANDEN');
        gui.setzeAktionAktiv('preview-compound', result.status === 'BESTANDEN');
      }
    } finally {
      sampling = false;
    }
  }

  gui.registriereAktion({
    kennung: 'runtime-stoppen',
    titel: '1 · Alte Runtime stoppen',
    async ausfuehren() {
      const performanceTrick = await guiApi().aktivierePerformanceTrick();
      const result = stoppeAltRuntime();
      result.performanceTrick = performanceTrick;
      if (!performanceTrick.aktiv) result.status = 'BLOCKIERT';
      gui.protokolliere('Runtime-Stopp', result);
      setzeResultat(result, result.status === 'BESTANDEN'
        ? 'Alte Runtime gestoppt; Performance-Trick aktiv.'
        : 'Runtime-Stopp oder Performance-Trick blockiert.');
      gui.setzeAktionAktiv('vorpruefung', result.status === 'BESTANDEN');
      return result;
    }
  });

  gui.registriereAktion({
    kennung: 'vorpruefung',
    titel: '2 · Live-Vorprüfung',
    aktiviert: false,
    art: 'primaer',
    async ausfuehren() {
      const result = await passiveVorpruefung();
      gui.protokolliere('Live-Vorpruefung', result);
      setzeResultat(result, result.status === 'BESTANDEN'
        ? 'Vorprüfung bestanden. 5-Minuten-Test kann starten.'
        : 'Vorprüfung blockiert. Keine Mutation.');
      gui.setzeAktionAktiv('shadow-start', result.status === 'BESTANDEN');
      return result;
    }
  });

  gui.registriereAktion({
    kennung: 'shadow-start',
    titel: '3 · 5m Live-Shadow starten',
    aktiviert: false,
    art: 'gefahr',
    einmalig: true,
    bestaetigungsText: 'CAP033034-5M-LIVE-SHADOW-START',
    async ausfuehren() {
      const pre = await passiveVorpruefung();
      if (pre.status !== 'BESTANDEN') return setzeResultat(pre, 'Frische Vorprüfung blockiert.');
      const session = {
        schemaVersion: 1,
        status: 'RUNNING',
        gestartetAmMs: Date.now(),
        samples: [],
        gameplayWritesDurchHarness: 0
      };
      schreibeSession(session);
      gui.setzeRestzeit(DAUER_MS, 'Verbleibende Live-Shadow-Dauer');
      countdownTimer = setInterval(() => {
        const s = liesSession();
        if (s?.status === 'RUNNING') gui.setzeRestzeit(restzeitMs(s), 'Verbleibende Live-Shadow-Dauer');
      }, 1000);
      await shadowTick();
      shadowTimer = setInterval(() => { void shadowTick(); }, INTERVALL_MS);
      return { status: 'LAEUFT', dauerMs: DAUER_MS, gameplayWritesDurchHarness: 0 };
    }
  });

  gui.registriereAktion({
    kennung: 'preview-upgrade',
    titel: '4a · Upgrade Preview',
    aktiviert: false,
    async ausfuehren() {
      letzterUpgradePreview = await preview('UPGRADE');
      gui.protokolliere('Upgrade Preview', letzterUpgradePreview);
      setzeResultat(letzterUpgradePreview, letzterUpgradePreview.status === 'BESTANDEN'
        ? 'Upgrade Preview bestanden. One-Shot kann manuell freigegeben werden.'
        : 'Upgrade Preview blockiert.');
      gui.setzeAktionAktiv('one-shot-upgrade', letzterUpgradePreview.status === 'BESTANDEN' && !sendVerbraucht);
      return letzterUpgradePreview;
    }
  });

  gui.registriereAktion({
    kennung: 'preview-compound',
    titel: '4b · Compound Preview',
    aktiviert: false,
    async ausfuehren() {
      letzterCompoundPreview = await preview('COMPOUND');
      gui.protokolliere('Compound Preview', letzterCompoundPreview);
      setzeResultat(letzterCompoundPreview, letzterCompoundPreview.status === 'BESTANDEN'
        ? 'Compound Preview bestanden. One-Shot kann manuell freigegeben werden.'
        : 'Compound Preview blockiert.');
      gui.setzeAktionAktiv('one-shot-compound', letzterCompoundPreview.status === 'BESTANDEN' && !sendVerbraucht);
      return letzterCompoundPreview;
    }
  });

  async function oneShot(art, previewResult) {
    if (sendVerbraucht) throw new Error('CAP034_ONE_SHOT_BEREITS_VERBRAUCHT');
    if (!previewResult || previewResult.status !== 'BESTANDEN') {
      throw new Error('CAP034_PREVIEW_FEHLT');
    }
    const preflight = await passiveVorpruefung();
    if (preflight.status !== 'BESTANDEN') return preflight;
    const obs = beobachte();
    const kandidat = art === 'UPGRADE' ? obs.upgrade : obs.compound;
    if (!kandidat || kandidat.fingerprint !== previewResult.kandidatFingerprint) {
      return {
        status: 'BLOCKIERT',
        blocker: ['KANDIDAT_DRIFT_SEIT_PREVIEW'],
        vorher: previewResult.kandidat,
        jetzt: kandidat
      };
    }
    const frischPreview = await preview(art);
    if (frischPreview.status !== 'BESTANDEN'
        || frischPreview.kandidatFingerprint !== kandidat.fingerprint) {
      return {
        status: 'BLOCKIERT',
        blocker: ['FRISCHE_PREVIEW_BLOCKIERT_ODER_DRIFT'],
        frischPreview
      };
    }

    const root = rootFenster();
    const runId = 'CAP034-' + art + '-' + Date.now();
    const pre = {
      inventarFingerprint: obs.inventarFingerprint,
      scrollMenge: scrollMenge(root, kandidat.scroll.index),
      q: obs.q
    };
    const intent = {
      schemaVersion: 1,
      runId,
      status: 'INTENT',
      zeit: jetztIso(),
      art,
      actionContractId: art === 'UPGRADE' ? 'AL-ACTION-UPGRADE' : 'AL-ACTION-COMPOUND',
      recoveryContractId: art === 'UPGRADE' ? 'AL-RECOVERY-UPGRADE' : 'AL-RECOVERY-COMPOUND',
      verifierId: art === 'UPGRADE' ? 'AL-VERIFIER-UPGRADE' : 'AL-VERIFIER-COMPOUND',
      kandidat,
      kandidatFingerprint: kandidat.fingerprint,
      previewChance: frischPreview.previewChance,
      maximaleAktionen: 1,
      sameIntentRetry: false,
      pre
    };
    schreibeJournal(intent);
    sendVerbraucht = true;
    gui.setzeAktionAktiv('one-shot-upgrade', false);
    gui.setzeAktionAktiv('one-shot-compound', false);

    let serverErgebnis = null;
    let serverFehler = null;
    try {
      serverErgebnis = art === 'UPGRADE'
        ? await rufeUpgrade(root, kandidat, false)
        : await rufeCompound(root, kandidat, false);
    } catch (error) {
      serverFehler = String(error?.message || error);
    }

    const post = await warteTerminal(art, kandidat, pre);
    const bestaetigt = post.klassifikation.startsWith('BESTAETIGT_');
    const finalStatus = bestaetigt ? 'COMMITTED' : 'UNGEKLAERT';
    const journal = {
      ...intent,
      status: finalStatus,
      abgeschlossenAm: jetztIso(),
      sendVersuche: 1,
      serverErgebnis: serverErgebnis ?? null,
      serverFehler,
      postcondition: post
    };
    schreibeJournal(journal);

    return {
      schemaVersion: 1,
      test: 'CAP034_CONTROLLED_LIVE_' + art,
      status: bestaetigt ? 'BESTANDEN' : 'UNGEKLAERT',
      runId,
      art,
      actionContractId: intent.actionContractId,
      recoveryContractId: intent.recoveryContractId,
      verifierId: intent.verifierId,
      kandidat,
      previewChance: frischPreview.previewChance,
      gameWrites: 1,
      unerwarteteGameWrites: 0,
      maximaleAktionen: 1,
      sameIntentRetry: false,
      serverErgebnis: serverErgebnis ?? null,
      serverFehler,
      postcondition: post,
      hinweis: bestaetigt
        ? 'Controlled-Live-One-Shot postcondition-verifiziert. Bericht kopieren.'
        : 'Ausgang ungeklärt. KEIN Retry. Bericht kopieren.'
    };
  }

  gui.registriereAktion({
    kennung: 'one-shot-upgrade',
    titel: '5a · ONE-SHOT Upgrade',
    aktiviert: false,
    art: 'gefahr',
    einmalig: true,
    bestaetigungsText: UPGRADE_BESTAETIGUNG,
    async ausfuehren() {
      const result = await oneShot('UPGRADE', letzterUpgradePreview);
      gui.protokolliere('Upgrade ONE-SHOT', result);
      return setzeResultat(result, result.status === 'BESTANDEN'
        ? 'Upgrade BESTANDEN. Gesamtbericht kopieren.'
        : 'Upgrade nicht eindeutig. KEIN Retry; Bericht kopieren.');
    }
  });

  gui.registriereAktion({
    kennung: 'one-shot-compound',
    titel: '5b · ONE-SHOT Compound',
    aktiviert: false,
    art: 'gefahr',
    einmalig: true,
    bestaetigungsText: COMPOUND_BESTAETIGUNG,
    async ausfuehren() {
      const result = await oneShot('COMPOUND', letzterCompoundPreview);
      gui.protokolliere('Compound ONE-SHOT', result);
      return setzeResultat(result, result.status === 'BESTANDEN'
        ? 'Compound BESTANDEN. Gesamtbericht kopieren.'
        : 'Compound nicht eindeutig. KEIN Retry; Bericht kopieren.');
    }
  });

  gui.registriereAktion({
    kennung: 'status',
    titel: 'Status / Journal',
    ausfuehren() {
      const result = {
        status: 'INFO',
        session: liesSession(),
        journal: liesJournal(),
        sendVerbraucht
      };
      gui.protokolliere('Status gelesen', result);
      gui.setzeErgebnis(result, 'info', 'Aktueller Teststatus.');
      return result;
    }
  });

  const api = Object.freeze({
    version: VERSION,
    test: gui,
    passiveVorpruefung,
    beobachte,
    status: () => ({ session: liesSession(), journal: liesJournal(), sendVerbraucht }),
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

  gui.protokolliere('CAP-033/034 Live-Test bereit', {
    version: VERSION,
    testzeitStandard: 'FUNKTION_5M',
    dauerMs: DAUER_MS,
    intervallMs: INTERVALL_MS,
    minPreviewChance: MIN_PREVIEW_CHANCE,
    maxTestBasiswertGold: MAX_TEST_BASISWERT_GOLD,
    maximaleMutationsWritesProLauf: 1,
    sameIntentRetry: false,
    upgradeBestaetigung: UPGRADE_BESTAETIGUNG,
    compoundBestaetigung: COMPOUND_BESTAETIGUNG
  });
  gui.setzeStatus('bereit', 'Mit „1 · Alte Runtime stoppen“ beginnen.');
})();

