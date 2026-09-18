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
          throw fehler;
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
