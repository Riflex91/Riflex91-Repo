/* AUTO-GENERIERT: V5 CAP-045 Production Live Ingame-Testpaket
 * Quellen:
 * - v5/werkzeuge/v5-adventure-land-test-gui.js
 * - v5/werkzeuge/cap045-production-live-test-gui.js
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

  const API_NAME = 'V5Cap045ProductionLiveTest';
  const VERSION = '1.0.0';
  const TESTKENNUNG = 'cap045-production-live-certification';
  const SESSION_KEY = 'AIO_V5_CAP045_PRODUCTION_LIVE_SESSION_V1';
  const JOURNAL_KEY = 'AIO_V5_CAP045_PRODUCTION_LIVE_JOURNAL_V1';
  const SOAK_DAUER_MS = 5 * 60 * 1000;
  const SAMPLE_INTERVALL_MS = 15 * 1000;
  const MAX_SAMPLE_GAP_MS = 90 * 1000;
  const MIN_LIVE_SAMPLES = 20;
  const MAX_SAMPLES = 30;
  const MAX_STAGE3_NACHLAUF_MS = MAX_SAMPLE_GAP_MS;
  const MAX_TEST_BASISWERT_GOLD = 100000;
  const MIN_PREVIEW_CHANCE = 0.99;
  const STAGE2_BESTAETIGUNG = 'CAP045-STAGE2-LIVE-SOAK-START';
  const STAGE3_BESTAETIGUNG =
    'CAP045-PRODUCTION-LIVE-PROOF-UPGRADE-ONE-SHOT-AKZEPTIERT';
  const ACTION_CONTRACT_ID = 'AL-ACTION-UPGRADE';
  const RECOVERY_CONTRACT_ID = 'AL-RECOVERY-UPGRADE';
  const VERIFIER_ID = 'AL-VERIFIER-UPGRADE';
  const COVERAGE_KLASSIFIKATIONEN = Object.freeze([
    'FULLY_RESOLVED',
    'DEFERRED_EVENT_INAKTIV',
    'BLOCKIERT_QUEST_NICHT_ERFUELLT',
    'STRUCTURAL_GAP'
  ]);

  function rootFenster() {
    const kandidaten = [];
    try { kandidaten.push(globalThis); } catch {}
    try { if (parent && parent !== globalThis) kandidaten.push(parent); } catch {}
    for (const root of kandidaten) {
      try {
        if (root?.character && Array.isArray(root.character.items)
            && root.G?.items && typeof root.upgrade === 'function') return root;
      } catch {}
    }
    throw new Error('CAP045_ADVENTURE_LAND_CODEKONTEXT_FEHLT');
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
    throw new Error('CAP045_STORAGE_FEHLT');
  }

  function jetztIso() {
    return new Date().toISOString();
  }

  function kanonisch(wert) {
    if (wert === null || typeof wert !== 'object') return JSON.stringify(wert);
    if (Array.isArray(wert)) return '[' + wert.map(x => kanonisch(x)).join(',') + ']';
    return '{' + Object.keys(wert).sort()
      .map(key => JSON.stringify(key) + ':' + kanonisch(wert[key]))
      .join(',') + '}';
  }

  function evidenceFingerprint(wert) {
    const text = kanonisch(wert);
    let hash = 14695981039346656037n;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= BigInt(text.charCodeAt(index));
      hash = BigInt.asUintN(64, hash * 1099511628211n);
    }
    return hash.toString(16).padStart(16, '0');
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
    const basis = {
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
        : 0
    };
    return Object.freeze({
      ...basis,
      fingerprint: evidenceFingerprint(basis)
    });
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

  function findeScroll(inventar) {
    return inventar.find(x =>
      x.name === 'scroll0'
      && x.typ === 'uscroll'
      && x.menge >= 1
      && !x.locked
    ) ?? null;
  }

  function upgradeKandidaten(inventar) {
    const scroll = findeScroll(inventar);
    if (!scroll) return [];
    return inventar
      .filter(x =>
        x.upgrade
        && x.level === 0
        && x.plain
        && !istGeschuetzt(x)
        && x.basisGold > 0
        && x.basisGold <= MAX_TEST_BASISWERT_GOLD
        && x.index !== scroll.index
      )
      .sort((a, b) => a.basisGold - b.basisGold || a.index - b.index)
      .slice(0, 10)
      .map(ziel => Object.freeze({
        art: 'UPGRADE',
        ziel,
        scroll,
        outputName: ziel.name,
        outputLevel: ziel.level + 1,
        outputMenge: 1,
        fingerprint: evidenceFingerprint({
          ziel: ziel.fingerprint,
          scroll: scroll.fingerprint,
          outputName: ziel.name,
          outputLevel: ziel.level + 1
        })
      }));
  }

  function runtimeStatus() {
    const roots = [];
    try { roots.push(globalThis); } catch {}
    try { if (parent && parent !== globalThis) roots.push(parent); } catch {}
    let v3Vorhanden = false;
    let v3Aktiv = false;
    let v4Vorhanden = false;
    for (const root of roots) {
      try {
        const runtime = root?.AIO_V3?.__runtime;
        if (runtime) {
          v3Vorhanden = true;
          v3Aktiv = !!runtime.timer;
        }
      } catch {
        v3Vorhanden = true;
        v3Aktiv = true;
      }
      try {
        if (root?.V4ProduktionsLaufzeit || root?.AIO_V4 || root?.V4Runtime) {
          v4Vorhanden = true;
        }
      } catch {
        v4Vorhanden = true;
      }
    }
    return Object.freeze({
      v3Vorhanden,
      v3Aktiv,
      v4Vorhanden,
      alternativeRuntimeAktiv: v3Aktiv || v4Vorhanden,
      legacyRuntimeMethodenAufgerufen: false
    });
  }

  function qStatus(root) {
    return Object.freeze({
      upgrade: root.character?.q?.upgrade ?? null,
      compound: root.character?.q?.compound ?? null
    });
  }

  function beobachte() {
    const root = rootFenster();
    const inventar = inventarSnapshot(root);
    const kandidaten = upgradeKandidaten(inventar);
    return Object.freeze({
      zeitMs: Date.now(),
      charakter: String(root.character?.name || ''),
      serverRegion: String(root.server_region || ''),
      serverIdentifier: String(root.server_identifier || ''),
      rip: !!root.character?.rip,
      bewegtSich: !!root.character?.moving,
      ziel: root.character?.target == null ? null : String(root.character.target),
      q: qStatus(root),
      runtime: runtimeStatus(),
      performanceTrick: guiApi().performanceTrickStatus(),
      inventarFingerprint: evidenceFingerprint(inventar),
      kandidaten
    });
  }

  function liesJson(key) {
    const raw = storage().getItem(key);
    if (!raw) return null;
    try { return JSON.parse(raw); }
    catch { return { status: 'BESCHAEDIGT' }; }
  }

  function schreibeJson(key, wert, maxZeichen) {
    const text = JSON.stringify(wert);
    if (text.length > maxZeichen) throw new Error('CAP045_PERSISTENZ_ZU_GROSS:' + key);
    storage().setItem(key, text);
    if (storage().getItem(key) !== text) {
      throw new Error('CAP045_PERSISTENZ_ROUNDTRIP_FEHLER:' + key);
    }
  }

  function liesSession() {
    return liesJson(SESSION_KEY);
  }

  function schreibeSession(session) {
    schreibeJson(SESSION_KEY, session, 900000);
  }

  function liesJournal() {
    return liesJson(JOURNAL_KEY);
  }

  function schreibeJournal(journal) {
    schreibeJson(JOURNAL_KEY, journal, 30000);
  }

  function journalOffen(journal) {
    return !!journal
      && !['COMMITTED', 'FAILED_SAFE', 'ABORTED'].includes(journal.status);
  }

  function coverageGraph(produktionsId, kandidat) {
    const upgradeId = 'upgrade:1';
    const deliveryId = 'delivery:2';
    return Object.freeze({
      schemaVersion: 1,
      produktionsId,
      rootNodeId: deliveryId,
      planFingerprint: evidenceFingerprint({
        produktionsId,
        kandidatFingerprint: kandidat.fingerprint,
        actionContractId: ACTION_CONTRACT_ID,
        recoveryContractId: RECOVERY_CONTRACT_ID,
        verifierId: VERIFIER_ID
      }),
      schritte: Object.freeze([
        Object.freeze({
          nodeId: upgradeId,
          art: 'UPGRADE',
          abhaengigkeiten: Object.freeze([]),
          outputName: kandidat.outputName,
          outputLevel: kandidat.outputLevel,
          outputMenge: 1,
          operationSchluessel: produktionsId + ':upgrade:' + String(kandidat.ziel.index),
          actionContractId: ACTION_CONTRACT_ID,
          recoveryContractId: RECOVERY_CONTRACT_ID,
          verifierId: VERIFIER_ID
        }),
        Object.freeze({
          nodeId: deliveryId,
          art: 'DELIVERY',
          abhaengigkeiten: Object.freeze([upgradeId]),
          outputName: kandidat.outputName,
          outputLevel: kandidat.outputLevel,
          outputMenge: 1,
          operationSchluessel: produktionsId + ':delivery:self',
          selfRecipientSettlement: true
        })
      ])
    });
  }

  function baueCoverageAudit(obs) {
    const faelle = obs.kandidaten.map((kandidat, index) => {
      const produktionsId = 'cap045-live-' + obs.charakter + '-' + String(obs.zeitMs)
        + '-' + String(index + 1);
      const graph = coverageGraph(produktionsId, kandidat);
      return Object.freeze({
        fallId: 'live-coverage-' + String(index + 1),
        zielId: kandidat.outputName + ':' + String(kandidat.outputLevel),
        evidenceKlasse: 'LIVE',
        evidenceId: 'live:' + obs.serverRegion + ':' + obs.serverIdentifier
          + ':' + obs.charakter + ':' + String(obs.zeitMs) + ':' + String(index + 1),
        klassifikation: 'FULLY_RESOLVED',
        grund: null,
        graph,
        kandidat
      });
    });
    for (const fall of faelle) {
      if (!COVERAGE_KLASSIFIKATIONEN.includes(fall.klassifikation)) {
        throw new Error('CAP045_COVERAGE_KLASSIFIKATION_UNGUELTIG');
      }
    }
    return Object.freeze({
      schemaVersion: 1,
      auditId: 'cap045-live-coverage-' + String(obs.zeitMs),
      katalogFingerprint: evidenceFingerprint({
        charakter: obs.charakter,
        serverRegion: obs.serverRegion,
        serverIdentifier: obs.serverIdentifier,
        inventarFingerprint: obs.inventarFingerprint,
        kandidaten: obs.kandidaten.map(x => x.fingerprint)
      }),
      erwarteteZiele: faelle.length,
      gepruefteZiele: faelle.length,
      fullyResolved: faelle.length,
      deferredEventInaktiv: 0,
      blockiertQuest: 0,
      structuralGaps: 0,
      syntheticEvidenceFaelle: 0,
      liveEvidenceFaelle: faelle.length,
      bestanden: faelle.length > 0,
      coverageScope: 'LIVE_SAFE_UPGRADE_PRODUCTION_TARGETS',
      faelle: Object.freeze(faelle),
      diagnosticOnly: true,
      actionAuthority: false,
      rawWriteAuthority: false
    });
  }

  function sampleBasis({
    sequenz,
    zeitMs,
    evidenceKlasse,
    evidenceId,
    vorherigerFingerprint,
    produktionsId,
    planFingerprint,
    zustand,
    recipientSettlementVerifiziert,
    offeneAufgaben,
    offeneMaterialziele,
    offeneMutationDemand,
    offeneExchangeDemand,
    gateVerletzungen,
    protectedTransferOhneAutorisierung,
    zertifiziererGameplayWrites,
    irreversibleOperationen
  }) {
    return Object.freeze({
      schemaVersion: 1,
      sequenz,
      zeitMs,
      evidenceKlasse,
      evidenceId,
      vorherigerFingerprint,
      produktionsId,
      planFingerprint,
      zustand,
      sameIntentErneutSenden: false,
      recipientSettlementVerifiziert,
      offeneAufgaben,
      offeneMaterialziele,
      offeneMutationDemand,
      offeneExchangeDemand,
      gateVerletzungen,
      protectedTransferOhneAutorisierung,
      zertifiziererGameplayWrites,
      irreversibleOperationen: Object.freeze(
        irreversibleOperationen.map(x => Object.freeze({ ...x }))
      )
    });
  }

  function erstelleSample(basis) {
    return Object.freeze({
      ...basis,
      sampleFingerprint: evidenceFingerprint(basis)
    });
  }

  function sampleInvariantVerletzt(sample) {
    const committed = sample.zustand === 'COMMITTED';
    const recoveryPending = sample.zustand === 'RECOVERY_PENDING';
    const reste = sample.offeneAufgaben
      + sample.offeneMaterialziele
      + sample.offeneMutationDemand
      + sample.offeneExchangeDemand;
    return sample.sameIntentErneutSenden !== false
      || sample.gateVerletzungen !== 0
      || sample.protectedTransferOhneAutorisierung !== 0
      || sample.zertifiziererGameplayWrites !== 0
      || (recoveryPending && sample.irreversibleOperationen.length > 0)
      || (committed && !sample.recipientSettlementVerifiziert)
      || (committed && reste !== 0);
  }

  function bewerteSoak(samples, grenzen) {
    if (!Array.isArray(samples) || samples.length < 1
        || samples.length > grenzen.maximaleSamples) {
      throw new Error('CAP045_SOAK_SERIE_GROESSE_UNGUELTIG');
    }
    const evidenceKlasse = samples[0].evidenceKlasse;
    if (!['SYNTHETISCH', 'LIVE'].includes(evidenceKlasse)
        || samples.some(x => x.evidenceKlasse !== evidenceKlasse)) {
      throw new Error('CAP045_SOAK_EVIDENCE_KLASSE_UNGUELTIG');
    }

    let sampleGaps = 0;
    let fingerprintFehler = 0;
    let unverifiedIrreversibleEffects = 0;
    let invariantViolations = 0;

    for (let index = 0; index < samples.length; index += 1) {
      const sample = samples[index];
      const vorher = index === 0 ? null : samples[index - 1];
      if (sample.sequenz !== index + 1
          || (vorher !== null
            && (sample.zeitMs <= vorher.zeitMs
              || sample.zeitMs - vorher.zeitMs > grenzen.maximalerSampleAbstandMs))) {
        sampleGaps += 1;
      }
      const erwartetVorher = vorher?.sampleFingerprint ?? null;
      if (sample.vorherigerFingerprint !== erwartetVorher) fingerprintFehler += 1;
      const basis = sampleBasis({
        sequenz: sample.sequenz,
        zeitMs: sample.zeitMs,
        evidenceKlasse: sample.evidenceKlasse,
        evidenceId: sample.evidenceId,
        vorherigerFingerprint: sample.vorherigerFingerprint,
        produktionsId: sample.produktionsId,
        planFingerprint: sample.planFingerprint,
        zustand: sample.zustand,
        recipientSettlementVerifiziert: sample.recipientSettlementVerifiziert,
        offeneAufgaben: sample.offeneAufgaben,
        offeneMaterialziele: sample.offeneMaterialziele,
        offeneMutationDemand: sample.offeneMutationDemand,
        offeneExchangeDemand: sample.offeneExchangeDemand,
        gateVerletzungen: sample.gateVerletzungen,
        protectedTransferOhneAutorisierung:
          sample.protectedTransferOhneAutorisierung,
        zertifiziererGameplayWrites: sample.zertifiziererGameplayWrites,
        irreversibleOperationen: sample.irreversibleOperationen
      });
      if (sample.sampleFingerprint !== evidenceFingerprint(basis)) {
        fingerprintFehler += 1;
      }
      if (sample.irreversibleOperationen.some(x => !x.postconditionVerifiziert)) {
        unverifiedIrreversibleEffects += 1;
      }
      if (sampleInvariantVerletzt(sample)) invariantViolations += 1;
    }

    const keys = samples
      .flatMap(s => s.irreversibleOperationen.map(x => x.operationSchluessel))
      .sort();
    const duplicateIrreversibleEffects = keys.filter(
      (key, index) => index > 0 && key === keys[index - 1]
    ).length;
    const erster = samples[0];
    const letzter = samples.at(-1);
    const dauerMs = letzter.zeitMs - erster.zeitMs;
    const basisBestanden = sampleGaps === 0
      && fingerprintFehler === 0
      && duplicateIrreversibleEffects === 0
      && unverifiedIrreversibleEffects === 0
      && invariantViolations === 0;
    const syntheticRegressionBestanden = evidenceKlasse === 'SYNTHETISCH'
      && basisBestanden
      && samples.length >= grenzen.minimaleSyntheticSamples;
    const liveBeweisBestanden = evidenceKlasse === 'LIVE'
      && basisBestanden
      && samples.length >= grenzen.minimaleLiveSamples
      && dauerMs >= grenzen.minimaleLiveDauerMs;
    return Object.freeze({
      schemaVersion: 1,
      evidenceKlasse,
      sampleAnzahl: samples.length,
      dauerMs,
      sampleGaps,
      fingerprintFehler,
      duplicateIrreversibleEffects,
      unverifiedIrreversibleEffects,
      invariantViolations,
      bestanden: evidenceKlasse === 'SYNTHETISCH'
        ? syntheticRegressionBestanden
        : liveBeweisBestanden,
      syntheticRegressionBestanden,
      liveBeweisBestanden,
      synthetischeEvidenceZaehltAlsLive: false,
      ersterFingerprint: erster.sampleFingerprint,
      letzterFingerprint: letzter.sampleFingerprint,
      diagnosticOnly: true,
      actionAuthority: false,
      rawWriteAuthority: false
    });
  }

  function syntheticRegression() {
    const samples = [];
    for (let i = 0; i < 3; i += 1) {
      const vorher = samples.at(-1) ?? null;
      const basis = sampleBasis({
        sequenz: i + 1,
        zeitMs: 1000 + i * 1000,
        evidenceKlasse: 'SYNTHETISCH',
        evidenceId: 'synthetic-cap045-' + String(i + 1),
        vorherigerFingerprint: vorher?.sampleFingerprint ?? null,
        produktionsId: 'synthetic-prod',
        planFingerprint: 'synthetic-plan',
        zustand: 'GEPLANT',
        recipientSettlementVerifiziert: false,
        offeneAufgaben: 2,
        offeneMaterialziele: 0,
        offeneMutationDemand: 1,
        offeneExchangeDemand: 0,
        gateVerletzungen: 0,
        protectedTransferOhneAutorisierung: 0,
        zertifiziererGameplayWrites: 0,
        irreversibleOperationen: []
      });
      samples.push(erstelleSample(basis));
    }
    const nachweis = bewerteSoak(samples, {
      maximaleSamples: 10,
      maximalerSampleAbstandMs: 2000,
      minimaleSyntheticSamples: 3,
      minimaleLiveSamples: 3,
      minimaleLiveDauerMs: 1000
    });
    return Object.freeze({
      evidenceKlasse: 'SYNTHETISCH',
      status: nachweis.syntheticRegressionBestanden ? 'BESTANDEN' : 'NICHT_BESTANDEN',
      syntheticRegressionBestanden: nachweis.syntheticRegressionBestanden,
      synthetischeEvidenceZaehltAlsLive: false,
      liveBeweisBestanden: false,
      nachweis
    });
  }

  function blockerFuerStage1(obs) {
    const blocker = [];
    if (!obs.charakter) blocker.push('CHARAKTER_FEHLT');
    if (!obs.serverRegion || !obs.serverIdentifier) blocker.push('SERVER_BINDUNG_FEHLT');
    if (obs.rip) blocker.push('CHARAKTER_TOT');
    if (obs.bewegtSich) blocker.push('CHARAKTER_BEWEGT_SICH');
    if (obs.ziel !== null) blocker.push('CHARAKTER_HAT_ZIEL');
    if (obs.runtime.alternativeRuntimeAktiv) blocker.push('ALTERNATIVE_RUNTIME_AKTIV');
    if (obs.q.upgrade || obs.q.compound) blocker.push('MUTATIONS_Q_BEREITS_AKTIV');
    if (obs.performanceTrick.aktiv !== true) blocker.push('PERFORMANCE_TRICK_NICHT_AKTIV');
    if (obs.kandidaten.length === 0) blocker.push('KEIN_SICHERER_LIVE_UPGRADE_PRODUCTION_KANDIDAT');
    const journal = liesJournal();
    if (journalOffen(journal)) blocker.push('VORHERIGER_PRODUCTION_PROOF_UNGEKLAERT');
    return blocker;
  }

  async function stage1Discovery() {
    const performanceTrick = await guiApi().aktivierePerformanceTrick();
    const obs = beobachte();
    const blocker = blockerFuerStage1(obs);
    if (!performanceTrick.aktiv && !blocker.includes('PERFORMANCE_TRICK_NICHT_AKTIV')) {
      blocker.push('PERFORMANCE_TRICK_NICHT_AKTIV');
    }
    if (blocker.length) {
      return Object.freeze({
        schemaVersion: 1,
        stage: 'STAGE_1',
        status: 'BLOCKIERT',
        evidenceKlasse: 'LIVE',
        coverageAudit: null,
        blocker,
        zertifiziererGameplayWrites: 0,
        synthetischeEvidenceZaehltAlsLive: false,
        breiteRuntimeFreigabe: false
      });
    }

    const coverageAudit = baueCoverageAudit(obs);
    const ausgewaehlt = coverageAudit.faelle[0];
    const startMs = Date.now();
    const session = {
      schemaVersion: 1,
      testkennung: TESTKENNUNG,
      controllerVersion: VERSION,
      guiVersion: gui.version,
      status: 'STAGE1_COMPLETED',
      gestartetAmMs: startMs,
      gestartetAm: new Date(startMs).toISOString(),
      beendetAmMs: null,
      beendetAm: null,
      evidenceKlasse: 'LIVE',
      stage1: {
        status: 'BESTANDEN',
        abgeschlossenAmMs: startMs,
        coverageAudit
      },
      stage2: {
        status: 'NICHT_GESTARTET',
        gestartetAmMs: null,
        abgeschlossenAmMs: null,
        nachweis: null
      },
      stage3: {
        status: 'NICHT_GESTARTET',
        vorbereitetAmMs: null,
        abgeschlossenAmMs: null,
        preflight: null,
        outcome: null
      },
      production: {
        produktionsId: ausgewaehlt.graph.produktionsId,
        planFingerprint: ausgewaehlt.graph.planFingerprint,
        graph: ausgewaehlt.graph,
        kandidat: ausgewaehlt.kandidat,
        recipientCharacterId: obs.charakter,
        serverRegion: obs.serverRegion,
        serverIdentifier: obs.serverIdentifier
      },
      samples: [],
      synthetischeRegression: syntheticRegression(),
      controlledProofDriverGameplayWrites: 0,
      zertifiziererGameplayWrites: 0,
      protectedTransferOhneAutorisierung: 0,
      breiteRuntimeFreigabe: false
    };
    schreibeSession(session);
    return bericht(session);
  }

  function kandidatNochGleich(session, obs) {
    const erwartet = session.production.kandidat;
    const aktuell = obs.kandidaten.find(x =>
      x.ziel.index === erwartet.ziel.index
      && x.ziel.name === erwartet.ziel.name
      && x.ziel.level === erwartet.ziel.level
      && x.scroll.index === erwartet.scroll.index
    );
    return aktuell?.fingerprint === erwartet.fingerprint ? aktuell : null;
  }

  function stage2Sample(session) {
    const obs = beobachte();
    const kandidat = kandidatNochGleich(session, obs);
    let gateVerletzungen = 0;
    if (!kandidat) gateVerletzungen += 1;
    if (obs.rip || obs.runtime.alternativeRuntimeAktiv) gateVerletzungen += 1;
    if (obs.performanceTrick.aktiv !== true) gateVerletzungen += 1;
    if (obs.q.upgrade || obs.q.compound) gateVerletzungen += 1;
    if (obs.charakter !== session.production.recipientCharacterId
        || obs.serverRegion !== session.production.serverRegion
        || obs.serverIdentifier !== session.production.serverIdentifier) {
      gateVerletzungen += 1;
    }

    const vorher = session.samples.at(-1) ?? null;
    const zeitMs = Math.max(Date.now(), vorher ? vorher.zeitMs + 1 : Date.now());
    return erstelleSample(sampleBasis({
      sequenz: session.samples.length + 1,
      zeitMs,
      evidenceKlasse: 'LIVE',
      evidenceId: 'live-soak-' + String(session.samples.length + 1),
      vorherigerFingerprint: vorher?.sampleFingerprint ?? null,
      produktionsId: session.production.produktionsId,
      planFingerprint: session.production.planFingerprint,
      zustand: 'GEPLANT',
      recipientSettlementVerifiziert: false,
      offeneAufgaben: 2,
      offeneMaterialziele: 0,
      offeneMutationDemand: 1,
      offeneExchangeDemand: 0,
      gateVerletzungen,
      protectedTransferOhneAutorisierung: 0,
      zertifiziererGameplayWrites: 0,
      irreversibleOperationen: []
    }));
  }

  function liveGrenzen() {
    return Object.freeze({
      maximaleSamples: MAX_SAMPLES,
      maximalerSampleAbstandMs: MAX_SAMPLE_GAP_MS,
      minimaleSyntheticSamples: 3,
      minimaleLiveSamples: MIN_LIVE_SAMPLES,
      minimaleLiveDauerMs: SOAK_DAUER_MS
    });
  }

  function stage2Bewertung(session) {
    const nachweis = bewerteSoak(session.samples, liveGrenzen());
    const blocker = [];
    if (!nachweis.liveBeweisBestanden) blocker.push('LIVE_SHADOW_SOAK_NICHT_BESTANDEN');
    return Object.freeze({
      status: blocker.length ? 'NICHT_BESTANDEN' : 'BESTANDEN',
      evidenceKlasse: 'LIVE',
      shadowSoakBestanden: blocker.length === 0,
      liveBeweisBestanden: false,
      controlledLiveProofAusstehend: true,
      nachweis,
      blocker,
      zertifiziererGameplayWrites: 0,
      breiteRuntimeFreigabe: false
    });
  }

  function previewChance(result) {
    for (const wert of [
      result?.chance,
      result?.probability,
      result?.p,
      typeof result === 'number' ? result : null
    ]) {
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

  function itemAmIndex(root, index) {
    return cleanItem(root, root.character.items[index], index);
  }

  function scrollMenge(root, index) {
    return itemMenge(root.character.items[index]);
  }

  async function warteUpgradeTerminal(kandidat, baselineScrollMenge, timeoutMs = 30000) {
    const start = Date.now();
    let qGesehen = false;
    while (Date.now() - start <= timeoutMs) {
      const root = rootFenster();
      const q = qStatus(root);
      if (q.upgrade) qGesehen = true;
      if (!q.upgrade && (qGesehen || Date.now() - start > 1200)) {
        const ziel = itemAmIndex(root, kandidat.ziel.index);
        const scrollNachher = scrollMenge(root, kandidat.scroll.index);
        const erfolg = ziel?.name === kandidat.ziel.name
          && ziel?.level === kandidat.ziel.level + 1;
        const preUnveraendert = ziel?.fingerprint === kandidat.ziel.fingerprint
          && scrollNachher === baselineScrollMenge;
        const konsumiert = scrollNachher < baselineScrollMenge;
        return Object.freeze({
          klassifikation: erfolg
            ? 'BESTAETIGT_ERFOLG'
            : konsumiert && !preUnveraendert
              ? 'BESTAETIGT_ERWARTETER_FEHLER_ODER_VERLUST'
              : preUnveraendert && !qGesehen
                ? 'NICHT_AUSGEFUEHRT'
                : 'UNGEKLAERT',
          qGesehen,
          ziel,
          scrollMengeVorher: baselineScrollMenge,
          scrollMengeNachher: scrollNachher,
          postconditionVerifiziert: erfolg || (konsumiert && !preUnveraendert)
        });
      }
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    return Object.freeze({
      klassifikation: 'UNGEKLAERT_TIMEOUT',
      qGesehen,
      postconditionVerifiziert: false
    });
  }

  async function stage3Preflight({ persistieren = true } = {}) {
    const session = liesSession();
    if (!session || session.stage1?.status !== 'BESTANDEN'
        || session.stage2?.status !== 'BESTANDEN') {
      return Object.freeze({
        status: 'BLOCKIERT',
        blocker: ['STAGE_1_ODER_STAGE_2_FEHLT'],
        evidenceKlasse: 'LIVE'
      });
    }
    const abgeschlossenAmMs = Number(session.stage2.abgeschlossenAmMs);
    if (!Number.isFinite(abgeschlossenAmMs)
        || Date.now() - abgeschlossenAmMs > MAX_STAGE3_NACHLAUF_MS) {
      return Object.freeze({
        status: 'BLOCKIERT',
        blocker: ['STAGE_2_EVIDENCE_ZU_ALT'],
        evidenceKlasse: 'LIVE'
      });
    }
    const journal = liesJournal();
    if (journalOffen(journal)) {
      return Object.freeze({
        status: 'BLOCKIERT',
        blocker: ['VORHERIGER_PRODUCTION_PROOF_UNGEKLAERT'],
        journal,
        evidenceKlasse: 'LIVE'
      });
    }

    const performanceTrick = await guiApi().aktivierePerformanceTrick();
    const obs = beobachte();
    const kandidat = kandidatNochGleich(session, obs);
    const blocker = [];
    if (!performanceTrick.aktiv) blocker.push('PERFORMANCE_TRICK_NICHT_AKTIV');
    if (!kandidat) blocker.push('LIVE_TARGET_DRIFT');
    if (obs.rip) blocker.push('CHARAKTER_TOT');
    if (obs.bewegtSich) blocker.push('CHARAKTER_BEWEGT_SICH');
    if (obs.ziel !== null) blocker.push('CHARAKTER_HAT_ZIEL');
    if (obs.runtime.alternativeRuntimeAktiv) blocker.push('ALTERNATIVE_RUNTIME_AKTIV');
    if (obs.q.upgrade || obs.q.compound) blocker.push('MUTATIONS_Q_BEREITS_AKTIV');
    if (obs.charakter !== session.production.recipientCharacterId
        || obs.serverRegion !== session.production.serverRegion
        || obs.serverIdentifier !== session.production.serverIdentifier) {
      blocker.push('RECIPIENT_ODER_SERVER_DRIFT');
    }
    if (blocker.length) {
      return Object.freeze({
        status: 'BLOCKIERT',
        blocker,
        evidenceKlasse: 'LIVE',
        performanceTrick
      });
    }

    let previewResult;
    try {
      previewResult = await rufeUpgrade(rootFenster(), kandidat, true);
    } catch (error) {
      return Object.freeze({
        status: 'BLOCKIERT',
        blocker: ['SERVER_PREVIEW_ABGELEHNT'],
        serverFehler: String(error?.message || error),
        evidenceKlasse: 'LIVE'
      });
    }
    const chance = previewChance(previewResult);
    if (chance === null || chance < MIN_PREVIEW_CHANCE) {
      return Object.freeze({
        status: 'BLOCKIERT',
        blocker: [
          chance === null
            ? 'PREVIEW_CHANCE_NICHT_LESBAR'
            : 'PREVIEW_CHANCE_UNTER_TESTGRENZE'
        ],
        previewChance: chance,
        minimalePreviewChance: MIN_PREVIEW_CHANCE,
        evidenceKlasse: 'LIVE'
      });
    }

    const preflight = Object.freeze({
      schemaVersion: 1,
      status: 'BESTANDEN',
      evidenceKlasse: 'LIVE',
      zeitMs: Date.now(),
      kandidat,
      kandidatFingerprint: kandidat.fingerprint,
      scrollMenge: scrollMenge(rootFenster(), kandidat.scroll.index),
      previewChance: chance,
      minimalePreviewChance: MIN_PREVIEW_CHANCE,
      previewVerbrauchtNichts: true,
      actionContractId: ACTION_CONTRACT_ID,
      recoveryContractId: RECOVERY_CONTRACT_ID,
      verifierId: VERIFIER_ID,
      admissionDirektVorMutationErforderlich: true,
      durableIntentVorMutationErforderlich: true,
      sameIntentErneutSenden: false,
      maximalerSendCount: 1,
      zertifiziererGameplayWrites: 0,
      breiteRuntimeFreigabe: false,
      blocker: Object.freeze([])
    });

    if (persistieren) {
      const aktualisiert = {
        ...session,
        status: 'STAGE3_PREPARED',
        stage3: {
          ...session.stage3,
          status: 'VORBEREITET',
          vorbereitetAmMs: preflight.zeitMs,
          preflight
        }
      };
      schreibeSession(aktualisiert);
    }
    return preflight;
  }

  function journalBasis(session, preflight) {
    return Object.freeze({
      schemaVersion: 1,
      journalId: 'cap045-proof-' + String(Date.now()),
      status: 'INTENT_DURABLE',
      produktionsId: session.production.produktionsId,
      planFingerprint: session.production.planFingerprint,
      operationSchluessel:
        session.production.graph.schritte.find(x => x.art === 'UPGRADE').operationSchluessel,
      kandidatFingerprint: preflight.kandidatFingerprint,
      actionContractId: ACTION_CONTRACT_ID,
      recoveryContractId: RECOVERY_CONTRACT_ID,
      verifierId: VERIFIER_ID,
      recipientCharacterId: session.production.recipientCharacterId,
      serverRegion: session.production.serverRegion,
      serverIdentifier: session.production.serverIdentifier,
      intentPersistiertAmMs: Date.now(),
      admissionAmMs: null,
      sendAmMs: null,
      maximalerSendCount: 1,
      sendCount: 0,
      sameIntentErneutSenden: false,
      outcome: null
    });
  }

  function finalSample(session, outcome, operationSchluessel) {
    const vorher = session.samples.at(-1);
    const zeitMs = Math.max(Date.now(), (vorher?.zeitMs ?? 0) + 1);
    const erfolg = outcome.klassifikation === 'BESTAETIGT_ERFOLG'
      && outcome.postconditionVerifiziert === true
      && outcome.recipientSettlementVerifiziert === true;
    const ungeklaert = outcome.klassifikation.startsWith('UNGEKLAERT');
    const zustand = erfolg
      ? 'COMMITTED'
      : ungeklaert
        ? 'RECOVERY_PENDING'
        : 'FAILED_SAFE';
    const irreversible = erfolg || outcome.klassifikation
      === 'BESTAETIGT_ERWARTETER_FEHLER_ODER_VERLUST'
      ? [{
        art: 'UPGRADE',
        operationSchluessel,
        postconditionVerifiziert: outcome.postconditionVerifiziert === true
      }]
      : [];
    return erstelleSample(sampleBasis({
      sequenz: session.samples.length + 1,
      zeitMs,
      evidenceKlasse: 'LIVE',
      evidenceId: 'live-controlled-proof-final',
      vorherigerFingerprint: vorher?.sampleFingerprint ?? null,
      produktionsId: session.production.produktionsId,
      planFingerprint: session.production.planFingerprint,
      zustand,
      recipientSettlementVerifiziert: erfolg,
      offeneAufgaben: erfolg ? 0 : 1,
      offeneMaterialziele: erfolg ? 0 : 1,
      offeneMutationDemand: 0,
      offeneExchangeDemand: 0,
      gateVerletzungen: 0,
      protectedTransferOhneAutorisierung: 0,
      zertifiziererGameplayWrites: 0,
      irreversibleOperationen: irreversible
    }));
  }

  async function stage3ControlledProof() {
    const session = liesSession();
    if (!session || session.stage3?.status !== 'VORBEREITET') {
      return Object.freeze({
        status: 'BLOCKIERT',
        blocker: ['STAGE_3_PREFLIGHT_FEHLT']
      });
    }

    const preflight = await stage3Preflight({ persistieren: false });
    if (preflight.status !== 'BESTANDEN') return preflight;

    const intent = journalBasis(session, preflight);
    schreibeJournal(intent);
    const persisted = liesJournal();
    if (!persisted || persisted.journalId !== intent.journalId
        || persisted.status !== 'INTENT_DURABLE') {
      throw new Error('CAP045_DURABLE_INTENT_NICHT_BESTAETIGT');
    }

    const obsDirektVorher = beobachte();
    const kandidat = kandidatNochGleich(session, obsDirektVorher);
    if (!kandidat
        || kandidat.fingerprint !== preflight.kandidatFingerprint
        || obsDirektVorher.rip
        || obsDirektVorher.bewegtSich
        || obsDirektVorher.ziel !== null
        || obsDirektVorher.runtime.alternativeRuntimeAktiv
        || obsDirektVorher.q.upgrade
        || obsDirektVorher.q.compound
        || guiApi().performanceTrickStatus().aktiv !== true) {
      const abgebrochen = {
        ...intent,
        status: 'ABORTED',
        outcome: 'FRESH_ADMISSION_BLOCKIERT',
        beendetAmMs: Date.now()
      };
      schreibeJournal(abgebrochen);
      return Object.freeze({
        status: 'BLOCKIERT',
        blocker: ['FRESH_ADMISSION_BLOCKIERT'],
        journal: abgebrochen,
        sameIntentErneutSenden: false
      });
    }

    const admission = {
      ...intent,
      status: 'ADMITTED',
      admissionAmMs: Date.now()
    };
    schreibeJournal(admission);

    const sendJournal = {
      ...admission,
      status: 'OUTCOME_PENDING',
      sendAmMs: Date.now(),
      sendCount: 1
    };
    schreibeJournal(sendJournal);

    let sendFehler = null;
    try {
      await rufeUpgrade(rootFenster(), kandidat, false);
    } catch (error) {
      sendFehler = String(error?.message || error);
    }

    const outcomeBasis = await warteUpgradeTerminal(
      kandidat,
      preflight.scrollMenge
    );
    const recipientSettlementVerifiziert =
      outcomeBasis.klassifikation === 'BESTAETIGT_ERFOLG'
      && outcomeBasis.ziel?.name === kandidat.outputName
      && outcomeBasis.ziel?.level === kandidat.outputLevel;

    const outcome = Object.freeze({
      ...outcomeBasis,
      recipientSettlementVerifiziert,
      sendFehler,
      sameIntentErneutSenden: false,
      sendCount: 1,
      actionContractId: ACTION_CONTRACT_ID,
      recoveryContractId: RECOVERY_CONTRACT_ID,
      verifierId: VERIFIER_ID
    });

    const terminalJournalStatus = recipientSettlementVerifiziert
      && outcome.postconditionVerifiziert
      ? 'COMMITTED'
      : outcome.klassifikation.startsWith('UNGEKLAERT')
        ? 'RECOVERY_PENDING'
        : 'FAILED_SAFE';
    const terminalJournal = {
      ...sendJournal,
      status: terminalJournalStatus,
      outcome,
      beendetAmMs: Date.now()
    };
    schreibeJournal(terminalJournal);

    const frisch = liesSession();
    const sample = finalSample(
      frisch,
      outcome,
      terminalJournal.operationSchluessel
    );
    const samples = [...frisch.samples, sample];
    const liveNachweis = bewerteSoak(samples, liveGrenzen());
    const stage3Bestanden = terminalJournalStatus === 'COMMITTED'
      && outcome.postconditionVerifiziert === true
      && outcome.recipientSettlementVerifiziert === true
      && liveNachweis.liveBeweisBestanden === true;

    const abgeschlossenAmMs = Date.now();
    const aktualisiert = {
      ...frisch,
      status: stage3Bestanden ? 'COMPLETED' : 'BLOCKED',
      beendetAmMs: abgeschlossenAmMs,
      beendetAm: new Date(abgeschlossenAmMs).toISOString(),
      samples,
      controlledProofDriverGameplayWrites: 1,
      zertifiziererGameplayWrites: 0,
      stage3: {
        ...frisch.stage3,
        status: stage3Bestanden
          ? 'BESTANDEN'
          : terminalJournalStatus === 'RECOVERY_PENDING'
            ? 'UNGEKLAERT'
            : 'NICHT_BESTANDEN',
        abgeschlossenAmMs,
        preflight,
        outcome,
        journalStatus: terminalJournalStatus,
        liveNachweis
      }
    };
    schreibeSession(aktualisiert);
    return bericht(aktualisiert);
  }

  function sammleBlocker(session, liveNachweis) {
    const blocker = [];
    if (session?.stage1?.status !== 'BESTANDEN') blocker.push('STAGE_1_NICHT_BESTANDEN');
    if (session?.stage2?.status !== 'BESTANDEN') blocker.push('STAGE_2_NICHT_BESTANDEN');
    if (session?.stage3?.status !== 'BESTANDEN') blocker.push('STAGE_3_NICHT_BESTANDEN');
    if (session?.stage1?.coverageAudit?.bestanden !== true) blocker.push('COVERAGE_NICHT_BESTANDEN');
    if (session?.synthetischeRegression?.syntheticRegressionBestanden !== true) {
      blocker.push('SYNTHETIC_REGRESSION_NICHT_BESTANDEN');
    }
    if (liveNachweis?.liveBeweisBestanden !== true) {
      blocker.push('LIVE_SOAK_FEHLT_ODER_NICHT_BESTANDEN');
    }
    if ((session?.zertifiziererGameplayWrites ?? 0) !== 0) {
      blocker.push('ZERTIFIZIERER_GAMEPLAY_WRITES');
    }
    return Object.freeze([...new Set(blocker)]);
  }

  function bericht(session = liesSession()) {
    if (!session || session.status === 'BESCHAEDIGT') {
      return Object.freeze({
        testkennung: TESTKENNUNG,
        guiVersion: gui.version,
        controllerVersion: VERSION,
        gesamtstatus: 'UNVOLLSTAENDIG',
        evidenceKlasse: 'LIVE',
        blocker: ['KEINE_GUELTIGE_SESSION'],
        synthetischeEvidenceZaehltAlsLive: false,
        liveBeweisBestanden: false,
        breiteRuntimeFreigabe: false
      });
    }

    let liveNachweis = null;
    if (Array.isArray(session.samples) && session.samples.length > 0) {
      try { liveNachweis = bewerteSoak(session.samples, liveGrenzen()); }
      catch (error) {
        liveNachweis = {
          evidenceKlasse: 'LIVE',
          liveBeweisBestanden: false,
          fehler: String(error?.message || error)
        };
      }
    }
    const blocker = sammleBlocker(session, liveNachweis);
    const liveBeweisBestanden = blocker.length === 0
      && liveNachweis?.liveBeweisBestanden === true;
    return Object.freeze({
      schemaVersion: 1,
      testkennung: TESTKENNUNG,
      guiVersion: session.guiVersion ?? gui.version,
      controllerVersion: VERSION,
      gesamtstatus: liveBeweisBestanden ? 'BESTANDEN' : 'UNVOLLSTAENDIG_ODER_BLOCKIERT',
      startzeit: session.gestartetAm ?? null,
      endzeit: session.beendetAm ?? null,
      stageStatus: Object.freeze({
        stage1: session.stage1?.status ?? 'NICHT_GESTARTET',
        stage2: session.stage2?.status ?? 'NICHT_GESTARTET',
        stage3: session.stage3?.status ?? 'NICHT_GESTARTET'
      }),
      evidenceKlasse: 'LIVE',
      coverageAudit: session.stage1?.coverageAudit ?? null,
      soakDauerMs: liveNachweis?.dauerMs ?? 0,
      sampleAnzahl: liveNachweis?.sampleAnzahl ?? session.samples?.length ?? 0,
      sampleGaps: liveNachweis?.sampleGaps ?? null,
      fingerprintFehler: liveNachweis?.fingerprintFehler ?? null,
      duplicateIrreversibleEffects:
        liveNachweis?.duplicateIrreversibleEffects ?? null,
      unverifiedIrreversibleEffects:
        liveNachweis?.unverifiedIrreversibleEffects ?? null,
      invariantViolations: liveNachweis?.invariantViolations ?? null,
      recipientSettlementErgebnis:
        session.stage3?.outcome?.recipientSettlementVerifiziert ?? false,
      zertifiziererGameplayWrites: session.zertifiziererGameplayWrites ?? 0,
      controlledProofDriverGameplayWrites:
        session.controlledProofDriverGameplayWrites ?? 0,
      syntheticRegressionStatus:
        session.synthetischeRegression?.status ?? 'NICHT_AUSGEFUEHRT',
      syntheticRegressionBestanden:
        session.synthetischeRegression?.syntheticRegressionBestanden ?? false,
      liveBeweisStatus: liveBeweisBestanden ? 'BESTANDEN' : 'NICHT_BESTANDEN',
      blocker,
      synthetischeEvidenceZaehltAlsLive: false,
      liveBeweisBestanden,
      diagnosticOnly: true,
      actionAuthority: false,
      rawWriteAuthority: false,
      breiteRuntimeFreigabe: false,
      production: session.production ?? null,
      stage2Nachweis: session.stage2?.nachweis ?? null,
      stage3Outcome: session.stage3?.outcome ?? null,
      journalStatus: session.stage3?.journalStatus ?? liesJournal()?.status ?? null
    });
  }

  const gui = guiApi().erstelleTest({
    kennung: TESTKENNUNG,
    titel: 'V5 · CAP-045 · Production Live Certification',
    beschreibung:
      'Stage 1 entdeckt reale sichere Production-Ziele read-only. Stage 2 sammelt 5 Minuten LIVE-Soak-Evidence ohne Gameplay-Writes. Stage 3 fuehrt nur nach frischer Admission exakt einen kontrollierten Upgrade-Production-Proof aus; der Zertifizierer selbst bleibt zero-write.'
  });

  let soakTimer = null;
  let countdownTimer = null;
  let sampling = false;

  function setzeResultat(result, text) {
    const status = result.gesamtstatus === 'BESTANDEN'
      || result.status === 'BESTANDEN'
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
    if (!session?.stage2?.gestartetAmMs) return SOAK_DAUER_MS;
    return Math.max(0, SOAK_DAUER_MS - (Date.now() - session.stage2.gestartetAmMs));
  }

  function stoppeCountdown(abgeschlossen = false) {
    if (countdownTimer !== null) clearInterval(countdownTimer);
    countdownTimer = null;
    if (abgeschlossen) gui.setzeRestzeit(0, 'Stage 2 Live-Soak erreicht');
    else gui.setzeRestzeit(null);
  }

  async function stage2Tick() {
    if (sampling) return;
    sampling = true;
    try {
      const session = liesSession();
      if (!session || session.stage2?.status !== 'RUNNING') return;
      const sample = stage2Sample(session);
      const samples = [...session.samples, sample];
      if (samples.length > MAX_SAMPLES) {
        throw new Error('CAP045_SAMPLE_GRENZE_UEBERSCHRITTEN');
      }
      const aktualisiert = { ...session, samples };
      schreibeSession(aktualisiert);
      gui.setzeRestzeit(restzeitMs(aktualisiert), 'Verbleibende Stage-2-Live-Soak-Dauer');
      gui.setzeErgebnis({
        status: 'LAEUFT',
        stage: 'STAGE_2',
        evidenceKlasse: 'LIVE',
        seitStartMs: sample.zeitMs - aktualisiert.stage2.gestartetAmMs,
        sampleAnzahl: samples.length,
        letzterFingerprint: sample.sampleFingerprint,
        gateVerletzungen: sample.gateVerletzungen,
        zertifiziererGameplayWrites: 0,
        breiteRuntimeFreigabe: false
      }, 'laeuft', 'Stage 2 LIVE-Soak laeuft read-only.');

      if (sample.zeitMs - aktualisiert.stage2.gestartetAmMs >= SOAK_DAUER_MS) {
        if (soakTimer !== null) clearInterval(soakTimer);
        soakTimer = null;
        stoppeCountdown(true);
        const bewertung = stage2Bewertung(aktualisiert);
        const abgeschlossenAmMs = Date.now();
        const finalSession = {
          ...aktualisiert,
          status: bewertung.status === 'BESTANDEN'
            ? 'STAGE2_COMPLETED'
            : 'BLOCKED',
          stage2: {
            ...aktualisiert.stage2,
            status: bewertung.status,
            abgeschlossenAmMs,
            nachweis: bewertung
          }
        };
        schreibeSession(finalSession);
        gui.protokolliere('CAP-045 Stage 2 abgeschlossen', bewertung);
        setzeResultat(
          bericht(finalSession),
          bewertung.status === 'BESTANDEN'
            ? 'Stage 2 BESTANDEN. Stage-3-Preflight kann folgen.'
            : 'Stage 2 NICHT BESTANDEN. Keine Mutation ausfuehren.'
        );
        gui.setzeAktionAktiv('stage3-preflight', bewertung.status === 'BESTANDEN');
      }
    } catch (error) {
      if (soakTimer !== null) clearInterval(soakTimer);
      soakTimer = null;
      stoppeCountdown(false);
      const session = liesSession();
      if (session?.stage2?.status === 'RUNNING') {
        schreibeSession({
          ...session,
          status: 'BLOCKED',
          stage2: {
            ...session.stage2,
            status: 'NICHT_BESTANDEN',
            abgeschlossenAmMs: Date.now(),
            nachweis: { status: 'NICHT_BESTANDEN', fehler: String(error?.message || error) }
          }
        });
      }
      throw error;
    } finally {
      sampling = false;
    }
  }

  gui.registriereAktion({
    kennung: 'stage1',
    titel: '1 · Stage 1 Passive Live Discovery',
    art: 'primaer',
    async ausfuehren() {
      const result = await stage1Discovery();
      gui.protokolliere('CAP-045 Stage 1', result);
      setzeResultat(
        result,
        result.stageStatus?.stage1 === 'BESTANDEN'
          ? 'Stage 1 BESTANDEN. Reale LIVE-Coverage erfasst; Stage 2 kann starten.'
          : 'Stage 1 blockiert. Keine Gameplay-Mutation.'
      );
      gui.setzeAktionAktiv(
        'stage2-start',
        result.stageStatus?.stage1 === 'BESTANDEN'
      );
      return result;
    }
  });

  gui.registriereAktion({
    kennung: 'stage2-start',
    titel: '2 · Stage 2 Live Shadow / Soak starten',
    art: 'gefahr',
    aktiviert: false,
    einmalig: true,
    bestaetigungsText: STAGE2_BESTAETIGUNG,
    async ausfuehren() {
      const session = liesSession();
      if (!session || session.stage1?.status !== 'BESTANDEN') {
        throw new Error('CAP045_STAGE1_FEHLT');
      }
      const performanceTrick = await guiApi().aktivierePerformanceTrick();
      const obs = beobachte();
      const blocker = blockerFuerStage1(obs);
      if (!performanceTrick.aktiv && !blocker.includes('PERFORMANCE_TRICK_NICHT_AKTIV')) {
        blocker.push('PERFORMANCE_TRICK_NICHT_AKTIV');
      }
      if (!kandidatNochGleich(session, obs)) blocker.push('LIVE_TARGET_DRIFT');
      if (blocker.length) {
        return setzeResultat(
          { status: 'BLOCKIERT', stage: 'STAGE_2', blocker },
          'Frische Stage-2-Vorpruefung blockiert.'
        );
      }
      const start = Date.now();
      const aktualisiert = {
        ...session,
        status: 'STAGE2_RUNNING',
        samples: [],
        stage2: {
          status: 'RUNNING',
          gestartetAmMs: start,
          abgeschlossenAmMs: null,
          nachweis: null
        }
      };
      schreibeSession(aktualisiert);
      gui.setzeRestzeit(SOAK_DAUER_MS, 'Verbleibende Stage-2-Live-Soak-Dauer');
      countdownTimer = setInterval(() => {
        const s = liesSession();
        if (s?.stage2?.status === 'RUNNING') {
          gui.setzeRestzeit(restzeitMs(s), 'Verbleibende Stage-2-Live-Soak-Dauer');
        }
      }, 1000);
      await stage2Tick();
      soakTimer = setInterval(() => { void stage2Tick(); }, SAMPLE_INTERVALL_MS);
      return Object.freeze({
        status: 'LAEUFT',
        stage: 'STAGE_2',
        evidenceKlasse: 'LIVE',
        dauerMs: SOAK_DAUER_MS,
        sampleIntervallMs: SAMPLE_INTERVALL_MS,
        zertifiziererGameplayWrites: 0,
        breiteRuntimeFreigabe: false
      });
    }
  });

  gui.registriereAktion({
    kennung: 'stage2-status',
    titel: 'Stage 2 Zwischenstand',
    ausfuehren() {
      const result = bericht();
      gui.protokolliere('CAP-045 Zwischenstand', result);
      return setzeResultat(result, 'Aktueller CAP-045-Status.');
    }
  });

  gui.registriereAktion({
    kennung: 'stage3-preflight',
    titel: '3a · Stage 3 frische Controlled-Prüfung',
    art: 'primaer',
    aktiviert: false,
    async ausfuehren() {
      const result = await stage3Preflight();
      gui.protokolliere('CAP-045 Stage 3 Preflight', result);
      setzeResultat(
        result,
        result.status === 'BESTANDEN'
          ? 'Stage-3-Preflight BESTANDEN. Exakt ein kontrollierter Send kann bestaetigt werden.'
          : 'Stage-3-Preflight blockiert. Kein Send.'
      );
      gui.setzeAktionAktiv('stage3-send', result.status === 'BESTANDEN');
      return result;
    }
  });

  gui.registriereAktion({
    kennung: 'stage3-send',
    titel: '3b · Exakt einen Production Live Proof senden',
    art: 'gefahr',
    aktiviert: false,
    einmalig: true,
    bestaetigungsText: STAGE3_BESTAETIGUNG,
    async ausfuehren() {
      const result = await stage3ControlledProof();
      gui.protokolliere('CAP-045 Stage 3 Controlled Proof', result);
      return setzeResultat(
        result,
        result.liveBeweisBestanden === true
          ? 'CAP-045 LIVE-BEWEIS BESTANDEN. Breite Runtime bleibt trotzdem gesperrt.'
          : 'CAP-045 Live-Beweis nicht vollstaendig bestanden. Kein Retry.'
      );
    }
  });

  gui.registriereAktion({
    kennung: 'bericht',
    titel: 'Vollständigen Bericht anzeigen',
    ausfuehren() {
      const result = bericht();
      gui.protokolliere('CAP-045 Vollbericht', result);
      return setzeResultat(result, 'Vollbericht bereit. Danach Gesamtbericht kopieren.');
    }
  });

  const api = Object.freeze({
    version: VERSION,
    testkennung: TESTKENNUNG,
    stage2BestaetigungsText: STAGE2_BESTAETIGUNG,
    stage3BestaetigungsText: STAGE3_BESTAETIGUNG,
    test: gui,
    status: () => liesSession(),
    journal: () => liesJournal(),
    bericht,
    stage1Discovery,
    stage3Preflight,
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

  gui.protokolliere('CAP-045 Production Live Test bereit', {
    version: VERSION,
    testkennung: TESTKENNUNG,
    stage2BestaetigungsText: STAGE2_BESTAETIGUNG,
    stage3BestaetigungsText: STAGE3_BESTAETIGUNG,
    soakDauerMs: SOAK_DAUER_MS,
    sampleIntervallMs: SAMPLE_INTERVALL_MS,
    maximalerSampleGapMs: MAX_SAMPLE_GAP_MS,
    evidenceKlasse: 'LIVE',
    synthetischeEvidenceZaehltAlsLive: false,
    zertifiziererGameplayWrites: 0,
    breiteRuntimeFreigabe: false
  });
  gui.setzeStatus('bereit', 'Mit „1 · Stage 1 Passive Live Discovery“ beginnen.');
})();
