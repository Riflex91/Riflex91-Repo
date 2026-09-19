/* GENERATED: V4 Block 8.6.9 separates 10-Minuten-Soak-Komplettpaket.
 * Quelle: block8-6-soak-paket-bauen.mjs
 * Bindet realen Schatten und bidirektionales kontrolliert live an exakt denselben immutable Candidate.
 * Beide Ranger sollen dieses Paket parallel ausfuehren; der Launcher verlangt im Soak mindestens einen beobachteten Remote-Heartbeat.
 */
(() => {
  'use strict';

  const belegteNamen = [
    'AIO_V4_RUNTIME_CONFIG',
    'AIO_V4_CAPABILITY_CONFIG',
    'AIO_V4_BLOCK86_FREIGABE_CONFIG',
    'V4ProduktionsLaufzeit',
    'V4CapabilityLaufzeit',
    'V4Block86Candidate',
    'V4Block86FreigabeLiveTest',
    'V4TestGui',
    'V4Block86SoakLauncher'
  ].filter((name) => globalThis[name] !== undefined);
  if (belegteNamen.length > 0) {
    throw new Error(
      'Block-8.6-Soakpaket verlangt einen frischen Codekontext; bereits vorhanden: ' +
      belegteNamen.join(', ')
    );
  }

  const RELEASE_SHA = 'ca0dfee7685563c8b6003469300c8fd08777b053';
  const LAUF_KENNUNG = 'block8-6-schatten-1789822653521';
  const VERTRAUENS_NAMEN = Object.freeze(['My_Ranger1', 'My_Ranger2']);
  const SCHATTEN_UEBERGABE = Object.freeze({
  "schemaVersion": 1,
  "laufKennung": "block8-6-schatten-1789822653521",
  "aenderungsKennung": "git:ca0dfee7685563c8b6003469300c8fd08777b053",
  "katalogFingerprint": "2299d0025c1e85725c2a75601832009aa2b78afa56a9f8a771d17528416c5268",
  "capabilityFingerprint": "20c2cf00b529b2b6c281a2ca349d14a501d4b49d24353122eeadb547bbd4038d",
  "nachweis": {
    "schemaVersion": 1,
    "laufzeitPfadKennung": "block8.6-capability-runtime",
    "aenderungsKennung": "git:ca0dfee7685563c8b6003469300c8fd08777b053",
    "stufe": "schatten",
    "nachweisKennung": "block8-6-schatten-1789822653521:schatten",
    "ergebnis": "bestanden",
    "durchgefuehrtAm": 1789822656778,
    "deterministisch": false,
    "spielAktionAusgefuehrt": false,
    "begrenzt": false,
    "telemetrieNachweis": false,
    "recoveryNachweis": false,
    "gesamtauswertungBestanden": false
  }
});
  const LIVE_UEBERGABEN = Object.freeze({
  "My_Ranger1": {
    "schemaVersion": 1,
    "laufKennung": "block8-6-schatten-1789822653521",
    "aenderungsKennung": "git:ca0dfee7685563c8b6003469300c8fd08777b053",
    "nachweis": {
      "schemaVersion": 1,
      "laufzeitPfadKennung": "block8.6-capability-runtime",
      "aenderungsKennung": "git:ca0dfee7685563c8b6003469300c8fd08777b053",
      "stufe": "kontrolliert_live",
      "nachweisKennung": "block8-6-schatten-1789822653521:kontrolliert_live",
      "ergebnis": "bestanden",
      "durchgefuehrtAm": 1789823891623,
      "deterministisch": false,
      "spielAktionAusgefuehrt": true,
      "begrenzt": true,
      "telemetrieNachweis": false,
      "recoveryNachweis": false,
      "gesamtauswertungBestanden": false
    },
    "ziele": [
      "My_Ranger2"
    ]
  },
  "My_Ranger2": {
    "schemaVersion": 1,
    "laufKennung": "block8-6-schatten-1789822653521",
    "aenderungsKennung": "git:ca0dfee7685563c8b6003469300c8fd08777b053",
    "nachweis": {
      "schemaVersion": 1,
      "laufzeitPfadKennung": "block8.6-capability-runtime",
      "aenderungsKennung": "git:ca0dfee7685563c8b6003469300c8fd08777b053",
      "stufe": "kontrolliert_live",
      "nachweisKennung": "block8-6-schatten-1789822653521:kontrolliert_live",
      "ergebnis": "bestanden",
      "durchgefuehrtAm": 1789823889836,
      "deterministisch": false,
      "spielAktionAusgefuehrt": true,
      "begrenzt": true,
      "telemetrieNachweis": false,
      "recoveryNachweis": false,
      "gesamtauswertungBestanden": false
    },
    "ziele": [
      "My_Ranger1"
    ]
  }
});
  const LIVE_EVIDENZ_HASHES = Object.freeze({
    My_Ranger1: 'fba08a78942b6d2de9da482bf44df6aac6f8c91349fa13484423554195a886a7',
    My_Ranger2: 'becc261eef26a674fe460befcd77dbeca8e9d3ed0fe1901ee026b216e979d4e2'
  });

  const lokalerCharakter = String(globalThis.character?.name ?? '').trim();
  if (!VERTRAUENS_NAMEN.includes(lokalerCharakter)) {
    throw new Error(
      'Block-8.6-Soak muss auf My_Ranger1 oder My_Ranger2 laufen; erkannt: ' +
      String(lokalerCharakter || 'unbekannt') + '.'
    );
  }
  const liveUebergabe = LIVE_UEBERGABEN[lokalerCharakter];
  if (!liveUebergabe || liveUebergabe.nachweis?.ergebnis !== 'bestanden') {
    throw new Error('Passende kanonische Controlled-Live-Uebergabe fehlt fuer ' + lokalerCharakter + '.');
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
    ablaufKennung: 'block8-6-soak-' + LAUF_KENNUNG,
    vertrauensNamen: VERTRAUENS_NAMEN,
    faehigkeiten: Object.freeze({
      heilen: 0,
      schaden: 1,
      aggro: 0,
      schutz: 0,
      unterstuetzung: 0
    })
  }));
  setzeGlobal('AIO_V4_CAPABILITY_CONFIG', Object.freeze({
    aktivFreigegeben: true,
    ablaufKennung: 'block8-6-soak-' + LAUF_KENNUNG,
    vertrauensNamen: VERTRAUENS_NAMEN,
    koordinationsNamen: VERTRAUENS_NAMEN,
    policyVorgaben: Object.freeze([])
  }));
  setzeGlobal('AIO_V4_BLOCK86_FREIGABE_CONFIG', Object.freeze({
    aenderungsKennung: 'git:' + RELEASE_SHA,
    laufKennung: LAUF_KENNUNG,
    modus: 'soak',
    soakDauerMillisekunden: 600000,
    sampleMillisekunden: 5000,
    recoveryReplayVerified: true,
    schattenUebergabe: SCHATTEN_UEBERGABE,
    liveUebergabe
  }));
  setzeGlobal('AIO_V4_BLOCK86_SOAK_EVIDENZ', Object.freeze({
    lokalerCharakter,
    liveReportSha256: LIVE_EVIDENZ_HASHES[lokalerCharakter]
  }));
})();

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

/* ===== BEGIN Block-8.6-Soak-Launcher ===== */
(() => {
  'use strict';

  const API_NAME = 'V4Block86SoakLauncher';
  const VERSION = '1.0.0';
  const RELEASE_SHA = 'ca0dfee7685563c8b6003469300c8fd08777b053';
  const CANDIDATE_SHA256 = 'b5d39ac692157ec98c9c77cc7d4afca0b39a0b67abbabbcc31b863a6b0f77ea5';
  const CANDIDATE_BYTES = 396471;
  const CANDIDATE_URL = 'https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/ca0dfee7685563c8b6003469300c8fd08777b053/aio-v4-runtime.js';
  const CANDIDATE_MARKER = 'Adventure Land AiO Bot V4 | generated | Block 8.6 capability release candidate';
  const LAUF_KENNUNG = 'block8-6-schatten-1789822653521';
  const BESTAETIGUNG = 'BLOCK8-6-SOAK-STARTEN:block8-6-schatten-1789822653521';
  const RUNNER_SOURCE = "(() => {\n  'use strict';\n\n  const API_NAME = 'V4Block86FreigabeLiveTest';\n  const VERSION = '1.0.0';\n  const PFAD = 'block8.6-capability-runtime';\n  const STANDARD_SOAK_MILLIS = 600000;\n  const STANDARD_SAMPLE_MILLIS = 5000;\n\n  function objekt(wert) {\n    return typeof wert === 'object' && wert !== null && !Array.isArray(wert);\n  }\n\n  function text(name, wert) {\n    if (typeof wert !== 'string' || wert.trim().length === 0) {\n      throw new Error(name + ' darf nicht leer sein.');\n    }\n    return wert.trim();\n  }\n\n  function konfiguration() {\n    const roh = globalThis.AIO_V4_BLOCK86_FREIGABE_CONFIG;\n    if (!objekt(roh)) throw new Error('AIO_V4_BLOCK86_FREIGABE_CONFIG fehlt.');\n    const modus = roh.modus;\n    if (!['schatten', 'live', 'soak'].includes(modus)) {\n      throw new Error('Block-8.6-Freigabemodus muss schatten, live oder soak sein.');\n    }\n    const soakDauerMillisekunden = Number(roh.soakDauerMillisekunden ?? STANDARD_SOAK_MILLIS);\n    const sampleMillisekunden = Number(roh.sampleMillisekunden ?? STANDARD_SAMPLE_MILLIS);\n    if (\n      !Number.isFinite(soakDauerMillisekunden) ||\n      soakDauerMillisekunden < STANDARD_SOAK_MILLIS ||\n      soakDauerMillisekunden > 3600000\n    ) {\n      throw new Error('Soak-Dauer muss zwischen 600000 und 3600000 ms liegen.');\n    }\n    if (\n      !Number.isFinite(sampleMillisekunden) ||\n      sampleMillisekunden < 1000 ||\n      sampleMillisekunden > 30000\n    ) {\n      throw new Error('Soak-Sampling muss zwischen 1000 und 30000 ms liegen.');\n    }\n    return Object.freeze({\n      aenderungsKennung: text('aenderungsKennung', roh.aenderungsKennung),\n      laufKennung: text('laufKennung', roh.laufKennung),\n      modus,\n      soakDauerMillisekunden,\n      sampleMillisekunden,\n      recoveryReplayVerified: roh.recoveryReplayVerified === true,\n      schattenUebergabe: roh.schattenUebergabe ?? null,\n      liveUebergabe: roh.liveUebergabe ?? null\n    });\n  }\n\n  const cfg = konfiguration();\n  const candidate = globalThis.V4Block86Candidate;\n  const runtime = globalThis.V4ProduktionsLaufzeit;\n  const capability = globalThis.V4CapabilityLaufzeit;\n\n  if (!objekt(candidate) || candidate.version !== '1.0.0') {\n    throw new Error('Block-8.6-Freigaberunner verlangt V4Block86Candidate 1.0.0.');\n  }\n  if (!objekt(runtime) || runtime.version !== '1.1.5') {\n    throw new Error('Block-8.6-Freigaberunner verlangt die eingebettete Produktionsruntime 1.1.5.');\n  }\n  if (!objekt(capability) || capability.version !== '1.0.0') {\n    throw new Error('Block-8.6-Freigaberunner verlangt V4CapabilityLaufzeit 1.0.0.');\n  }\n\n  let letzterBericht = null;\n  let verbraucht = false;\n\n  function nachweis(stufe, daten) {\n    return Object.freeze({\n      schemaVersion: 1,\n      laufzeitPfadKennung: PFAD,\n      aenderungsKennung: cfg.aenderungsKennung,\n      stufe,\n      nachweisKennung: cfg.laufKennung + ':' + stufe,\n      ergebnis: daten.bestanden ? 'bestanden' : 'fehlgeschlagen',\n      durchgefuehrtAm: daten.durchgefuehrtAm,\n      deterministisch: daten.deterministisch === true,\n      spielAktionAusgefuehrt: daten.spielAktionAusgefuehrt === true,\n      begrenzt: daten.begrenzt === true,\n      telemetrieNachweis: daten.telemetrieNachweis === true,\n      recoveryNachweis: daten.recoveryNachweis === true,\n      gesamtauswertungBestanden: daten.gesamtauswertungBestanden === true\n    });\n  }\n\n  function pruefeEinmalig(erwarteterModus) {\n    if (cfg.modus !== erwarteterModus) {\n      throw new Error('Diese Aktion ist nur im Modus ' + erwarteterModus + ' erlaubt.');\n    }\n    if (verbraucht) throw new Error('Dieser Freigabelauf ist one-shot und bereits verbraucht.');\n    verbraucht = true;\n  }\n\n  function shadowPreflight() {\n    const runtimeStatus = runtime.status();\n    const capStatus = capability.status();\n    if (\n      runtimeStatus.aktivFreigegeben !== false ||\n      runtimeStatus.empfangInstalliert !== false ||\n      runtimeStatus.lebensnachweisAutomatikAktiv !== false ||\n      runtimeStatus.lebensnachweisSendeVersuche !== 0 ||\n      runtimeStatus.lebensnachweisSendeErfolge !== 0 ||\n      runtimeStatus.lebensnachweisSendeFehler !== 0\n    ) {\n      throw new Error('Schatten verlangt gesperrte, nicht gestartete Runtime mit exakt 0 Heartbeat-Sendezaehlern.');\n    }\n    if (\n      capStatus.aktivFreigegeben !== false ||\n      capStatus.remoteBeobachtungInstalliert !== false ||\n      capStatus.capabilityEmpfangInstalliert !== false ||\n      capStatus.senden.versuche !== 0\n    ) {\n      throw new Error('Schatten verlangt gesperrte Capability-Laufzeit ohne Remote-Beobachtung und ohne Sendeversuch.');\n    }\n  }\n\n  function schatten() {\n    pruefeEinmalig('schatten');\n    shadowPreflight();\n    const update = capability.aktualisiere();\n    const status = update.status;\n    const fehler = [];\n\n    if (!status.audit?.produktionsbereit) fehler.push('Skill-Katalog-Audit ist im Schatten nicht produktionsbereit.');\n    if (update.lokalerSnapshot === null) fehler.push('Lokaler Capability-Snapshot konnte im Schatten nicht gebildet werden.');\n    if (status.senden.versuche !== 0) fehler.push('Schatten hat unerwartet Capability-Sendeversuche erzeugt.');\n    if (runtime.status().lebensnachweisSendeVersuche !== 0) fehler.push('Schatten hat unerwartet Heartbeat-Sendeversuche erzeugt.');\n    if (status.capabilityStatus?.spielAutoritaet !== false) fehler.push('CapabilityStatus besitzt unerwartete Spielautoritaet.');\n\n    const bestanden = fehler.length === 0;\n    const durchgefuehrtAm = Date.now();\n    const beweis = nachweis('schatten', {\n      bestanden,\n      durchgefuehrtAm,\n      deterministisch: false,\n      spielAktionAusgefuehrt: false,\n      begrenzt: false,\n      telemetrieNachweis: false,\n      recoveryNachweis: false,\n      gesamtauswertungBestanden: false\n    });\n    letzterBericht = Object.freeze({\n      schemaVersion: 1,\n      runnerVersion: VERSION,\n      stufe: 'schatten',\n      pass: bestanden,\n      fehler: Object.freeze(fehler),\n      nachweis: beweis,\n      katalogFingerprint: status.audit?.katalog?.fingerprint ?? null,\n      capabilityFingerprint: status.faehigkeiten?.fingerprint ?? null,\n      lokalerSnapshotFingerprint: update.lokalerSnapshot?.fingerprint ?? null,\n      runtimeHeartbeatVersuche: runtime.status().lebensnachweisSendeVersuche,\n      capabilitySendeVersuche: status.senden.versuche,\n      schattenUebergabe: bestanden\n        ? Object.freeze({\n            schemaVersion: 1,\n            laufKennung: cfg.laufKennung,\n            aenderungsKennung: cfg.aenderungsKennung,\n            nachweis: beweis,\n            katalogFingerprint: status.audit.katalog.fingerprint,\n            capabilityFingerprint: status.faehigkeiten.fingerprint\n          })\n        : null\n    });\n    return letzterBericht;\n  }\n\n  function pruefeUebergabe(uebergabe, stufe) {\n    if (!objekt(uebergabe)) throw new Error(stufe + '-Uebergabe fehlt.');\n    if (uebergabe.laufKennung !== cfg.laufKennung) throw new Error(stufe + '-Uebergabe gehoert zu anderem Lauf.');\n    if (uebergabe.aenderungsKennung !== cfg.aenderungsKennung) {\n      throw new Error(stufe + '-Uebergabe gehoert zu anderem Aenderungsstand.');\n    }\n    if (!objekt(uebergabe.nachweis) || uebergabe.nachweis.ergebnis !== 'bestanden') {\n      throw new Error(stufe + '-Uebergabe besitzt keinen bestandenen Nachweis.');\n    }\n    return uebergabe;\n  }\n\n  function livePreflight() {\n    pruefeUebergabe(cfg.schattenUebergabe, 'Schatten');\n    const runtimeStatus = runtime.status();\n    if (\n      runtimeStatus.aktivFreigegeben !== true ||\n      runtimeStatus.empfangInstalliert !== true ||\n      runtimeStatus.lebensnachweisAutomatikAktiv !== true ||\n      runtimeStatus.lebensnachweisSendeErfolge < 1 ||\n      runtimeStatus.lebensnachweisSendeFehler !== 0\n    ) {\n      throw new Error('Kontrolliert live verlangt aktive 1.1.5-Runtime mit bestaetigtem fehlerfreiem Produktionsheartbeat.');\n    }\n    if (capability.status().aktivFreigegeben !== true) {\n      throw new Error('Kontrolliert live verlangt aktiv freigegebene Capability-Laufzeit.');\n    }\n  }\n\n  async function kontrolliertLive(bestaetigungsText) {\n    pruefeEinmalig('live');\n    livePreflight();\n    const erwartet = 'BLOCK8-6-KONTROLLIERT-LIVE:' + cfg.laufKennung;\n    if (bestaetigungsText !== erwartet) {\n      throw new Error('Falscher Bestaetigungstext. Erwartet wird exakt: ' + erwartet);\n    }\n\n    capability.installiereRemoteBeobachtung();\n    const update = capability.aktualisiere();\n    const localName = update.status.capabilityStatus?.charakterName;\n    const vertrauensNamen = Array.isArray(globalThis.AIO_V4_CAPABILITY_CONFIG?.vertrauensNamen)\n      ? [...new Set(globalThis.AIO_V4_CAPABILITY_CONFIG.vertrauensNamen)]\n          .map((name) => String(name).trim())\n          .filter((name) => name && name !== localName)\n          .sort()\n      : [];\n    if (vertrauensNamen.length < 1) {\n      throw new Error('Kontrolliert live benoetigt mindestens einen anderen vertrauten Zielcharakter.');\n    }\n\n    const sendeErgebnisse = [];\n    for (const zielName of vertrauensNamen) {\n      const antwort = await capability.sendeCapabilityEinmal(\n        zielName,\n        capability.sendeBestaetigungsText(zielName)\n      );\n      sendeErgebnisse.push(antwort.ergebnis);\n    }\n    const nachher = capability.aktualisiere().status;\n    const fehler = [];\n    if (sendeErgebnisse.some((row) => row.gesendet !== true)) {\n      fehler.push('Mindestens ein Capability-One-Shot wurde nicht als zugestellt bestaetigt.');\n    }\n    if (nachher.senden.versuche !== vertrauensNamen.length) {\n      fehler.push('Capability-Sendeversuche entsprechen nicht exakt der Zahl der kontrollierten Ziele.');\n    }\n    if (nachher.senden.fehler !== 0) fehler.push('Capability-Laufzeit meldet Sende-Fehler.');\n    if (!nachher.remoteBeobachtungInstalliert || !nachher.capabilityEmpfangInstalliert) {\n      fehler.push('Remote-Beobachtung oder Capability-Empfang ist nicht installiert.');\n    }\n\n    const bestanden = fehler.length === 0;\n    const durchgefuehrtAm = Date.now();\n    const beweis = nachweis('kontrolliert_live', {\n      bestanden,\n      durchgefuehrtAm,\n      deterministisch: false,\n      spielAktionAusgefuehrt: true,\n      begrenzt: true,\n      telemetrieNachweis: false,\n      recoveryNachweis: false,\n      gesamtauswertungBestanden: false\n    });\n    letzterBericht = Object.freeze({\n      schemaVersion: 1,\n      runnerVersion: VERSION,\n      stufe: 'kontrolliert_live',\n      pass: bestanden,\n      fehler: Object.freeze(fehler),\n      nachweis: beweis,\n      ziele: Object.freeze(vertrauensNamen),\n      sendeErgebnisse: Object.freeze(sendeErgebnisse),\n      capabilitySendeStatus: nachher.senden,\n      beobachteteLebensnachweise: nachher.beobachteteLebensnachweise,\n      empfangeneCapabilitySnapshots: nachher.empfangeneCapabilitySnapshots,\n      liveUebergabe: bestanden\n        ? Object.freeze({\n            schemaVersion: 1,\n            laufKennung: cfg.laufKennung,\n            aenderungsKennung: cfg.aenderungsKennung,\n            nachweis: beweis,\n            ziele: Object.freeze(vertrauensNamen)\n          })\n        : null\n    });\n    return letzterBericht;\n  }\n\n  function soakPreflight() {\n    pruefeUebergabe(cfg.schattenUebergabe, 'Schatten');\n    pruefeUebergabe(cfg.liveUebergabe, 'Live');\n    if (!cfg.recoveryReplayVerified) {\n      throw new Error('Soak verlangt den an denselben Candidate gebundenen 8.6.8-Recovery-Replay-Nachweis.');\n    }\n    const runtimeStatus = runtime.status();\n    if (\n      runtimeStatus.aktivFreigegeben !== true ||\n      runtimeStatus.empfangInstalliert !== true ||\n      runtimeStatus.lebensnachweisAutomatikAktiv !== true ||\n      runtimeStatus.lebensnachweisSendeErfolge < 1 ||\n      runtimeStatus.lebensnachweisSendeFehler !== 0\n    ) {\n      throw new Error('Soak verlangt aktive fehlerfreie Produktionsheartbeat-Basis.');\n    }\n  }\n\n  async function soak(bestaetigungsText) {\n    pruefeEinmalig('soak');\n    soakPreflight();\n    const erwartet = 'BLOCK8-6-SOAK-STARTEN:' + cfg.laufKennung;\n    if (bestaetigungsText !== erwartet) {\n      throw new Error('Falscher Bestaetigungstext. Erwartet wird exakt: ' + erwartet);\n    }\n\n    capability.installiereRemoteBeobachtung();\n    const runtimeVorher = runtime.status();\n    const capVorher = capability.aktualisiere().status;\n    const heartbeatErfolgeVorher = runtimeVorher.lebensnachweisSendeErfolge;\n    const heartbeatFehlerVorher = runtimeVorher.lebensnachweisSendeFehler;\n    const capabilitySendeFehlerVorher = capVorher.senden.fehler;\n    const katalogFingerprint = capVorher.audit?.katalog?.fingerprint ?? null;\n    const gestartetAm = Date.now();\n    const fehler = [];\n    let samples = 0;\n\n    await new Promise((resolve) => {\n      let timer = null;\n      timer = setInterval(() => {\n        samples += 1;\n        try {\n          const status = capability.aktualisiere().status;\n          const runtimeStatus = runtime.status();\n          if (!status.audit?.produktionsbereit) fehler.push('Skill-Katalog-Audit verlor Produktionsbereitschaft.');\n          if (status.audit?.katalog?.fingerprint !== katalogFingerprint) fehler.push('Skill-Katalog-Fingerprint hat sich im Soak geaendert.');\n          if (status.lokalerSnapshot === null) fehler.push('Lokaler Capability-Snapshot war im Soak nicht verfuegbar.');\n          if (status.senden.fehler !== capabilitySendeFehlerVorher) fehler.push('Capability-Sendefehlerzahl hat sich im Soak veraendert.');\n          if (runtimeStatus.lebensnachweisSendeFehler !== heartbeatFehlerVorher) fehler.push('Produktionsheartbeat-Sendefehlerzahl hat sich im Soak veraendert.');\n        } catch (ursache) {\n          fehler.push(ursache instanceof Error ? ursache.message : String(ursache));\n        }\n\n        if (Date.now() - gestartetAm >= cfg.soakDauerMillisekunden) {\n          if (timer !== null) clearInterval(timer);\n          resolve();\n        }\n      }, cfg.sampleMillisekunden);\n    });\n\n    const runtimeNachher = runtime.status();\n    const capNachher = capability.aktualisiere().status;\n    const erwarteteSamples = Math.max(\n      1,\n      Math.floor(cfg.soakDauerMillisekunden / cfg.sampleMillisekunden) - 2\n    );\n    if (samples < erwarteteSamples) {\n      fehler.push('Soak-Sampling war zu duenn: ' + samples + ' statt mindestens ' + erwarteteSamples + '.');\n    }\n    if (runtimeNachher.lebensnachweisSendeErfolge <= heartbeatErfolgeVorher) {\n      fehler.push('Produktionsheartbeat hat im Soak keinen neuen Erfolg bestaetigt.');\n    }\n\n    const bestanden = fehler.length === 0;\n    const durchgefuehrtAm = Date.now();\n    const beweis = nachweis('soak', {\n      bestanden,\n      durchgefuehrtAm,\n      deterministisch: false,\n      spielAktionAusgefuehrt: true,\n      begrenzt: false,\n      telemetrieNachweis: bestanden,\n      recoveryNachweis: bestanden && cfg.recoveryReplayVerified,\n      gesamtauswertungBestanden: bestanden\n    });\n    letzterBericht = Object.freeze({\n      schemaVersion: 1,\n      runnerVersion: VERSION,\n      stufe: 'soak',\n      pass: bestanden,\n      fehler: Object.freeze(fehler),\n      nachweis: beweis,\n      gestartetAm,\n      beendetAm: durchgefuehrtAm,\n      dauerMillisekunden: cfg.soakDauerMillisekunden,\n      sampleMillisekunden: cfg.sampleMillisekunden,\n      samples,\n      erwarteteSamples,\n      katalogFingerprint,\n      heartbeatErfolgeVorher,\n      heartbeatErfolgeNachher: runtimeNachher.lebensnachweisSendeErfolge,\n      heartbeatFehlerVorher,\n      heartbeatFehlerNachher: runtimeNachher.lebensnachweisSendeFehler,\n      capabilitySendeFehlerVorher,\n      capabilitySendeFehlerNachher: capNachher.senden.fehler,\n      recoveryReplayVerified: cfg.recoveryReplayVerified\n    });\n    return letzterBericht;\n  }\n\n  Object.defineProperty(globalThis, API_NAME, {\n    configurable: true,\n    enumerable: true,\n    writable: false,\n    value: Object.freeze({\n      version: VERSION,\n      modus: cfg.modus,\n      laufKennung: cfg.laufKennung,\n      aenderungsKennung: cfg.aenderungsKennung,\n      schatten,\n      kontrolliertLive,\n      soak,\n      status() {\n        return Object.freeze({\n          schemaVersion: 1,\n          version: VERSION,\n          modus: cfg.modus,\n          laufKennung: cfg.laufKennung,\n          aenderungsKennung: cfg.aenderungsKennung,\n          verbraucht,\n          letzterBericht\n        });\n      }\n    })\n  });\n})();";

  const guiApi = globalThis.V4TestGui;
  if (!guiApi || typeof guiApi.erstelleTest !== 'function') {
    throw new Error('V4TestGui fehlt im Block-8.6-Soakpaket.');
  }

  const test = guiApi.erstelleTest({
    kennung: 'block8-6-soak-' + LAUF_KENNUNG + '-' + String(globalThis.character?.name ?? 'unbekannt'),
    titel: 'V4 Block 8.6.9 · 10-Minuten-Soak',
    beschreibung:
      'Bindet Schatten + kontrolliert live, startet exakt den immutable Candidate und prueft 600000 ms lang Katalog, Heartbeat, Capability-Fehler und Remote-Liveness.'
  });

  const zustand = {
    phase: 'laedt',
    bereit: false,
    fehler: null,
    releaseSha: RELEASE_SHA,
    candidateSha256: CANDIDATE_SHA256,
    candidateBytes: CANDIDATE_BYTES,
    candidateUrl: CANDIDATE_URL,
    laufKennung: LAUF_KENNUNG,
    lokalerCharakter: String(globalThis.character?.name ?? '').trim(),
    zielName: null,
    geladenerSha256: null,
    heartbeatErfolgeVorFreigabe: 0,
    beobachteteLebensnachweiseVorher: 0,
    letzterBericht: null
  };

  function fehlerText(ursache) {
    return ursache instanceof Error ? ursache.message : String(ursache);
  }

  async function berechneSha256(code) {
    if (!globalThis.crypto?.subtle || typeof globalThis.TextEncoder !== 'function') {
      throw new Error('Web-Crypto oder TextEncoder ist fuer die Candidate-Hashpruefung nicht verfuegbar.');
    }
    const bytes = new globalThis.TextEncoder().encode(code);
    const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), (wert) => wert.toString(16).padStart(2, '0')).join('');
  }

  function schlafe(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function warteAufProduktionsheartbeat(runtime) {
    const gestartetAm = Date.now();
    while (Date.now() - gestartetAm < 10000) {
      const status = runtime.status();
      if (status.lebensnachweisSendeFehler > 0) {
        throw new Error(
          'Produktionsheartbeat meldet vor Soak einen Sendefehler: ' +
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
        offen: status.lebensnachweisSendeOffen
      })
    );
  }

  function pruefeVorStart() {
    const runtime = globalThis.V4ProduktionsLaufzeit;
    const capability = globalThis.V4CapabilityLaufzeit;
    const candidate = globalThis.V4Block86Candidate;
    const runner = globalThis.V4Block86FreigabeLiveTest;
    const cfg = globalThis.AIO_V4_BLOCK86_FREIGABE_CONFIG;
    const fehler = [];

    if (!candidate || candidate.version !== '1.0.0') fehler.push('V4Block86Candidate 1.0.0');
    if (candidate?.spielAutoritaet !== false) fehler.push('Candidate spielAutoritaet=false');
    if (candidate?.neustartAutoritaet !== false) fehler.push('Candidate neustartAutoritaet=false');
    if (!runtime || runtime.version !== '1.1.5') fehler.push('Runtime 1.1.5');
    if (!capability || capability.version !== '1.0.0') fehler.push('Capability 1.0.0');
    if (!runner || runner.version !== '1.0.0') fehler.push('Runner 1.0.0');
    if (runner?.modus !== 'soak') fehler.push('Runner modus=soak');
    if (runner?.laufKennung !== LAUF_KENNUNG) fehler.push('Runner Laufbindung');
    if (runner?.aenderungsKennung !== 'git:ca0dfee7685563c8b6003469300c8fd08777b053') fehler.push('Runner Candidate-Bindung');
    if (cfg?.soakDauerMillisekunden !== 600000) fehler.push('Soak-Dauer=600000');
    if (cfg?.sampleMillisekunden !== 5000) fehler.push('Sampling=5000');
    if (cfg?.recoveryReplayVerified !== true) fehler.push('Recovery-Replay gebunden');
    if (cfg?.schattenUebergabe?.nachweis?.ergebnis !== 'bestanden') fehler.push('Schatten-Uebergabe');
    if (cfg?.liveUebergabe?.nachweis?.ergebnis !== 'bestanden') fehler.push('Live-Uebergabe');

    const r = runtime?.status?.();
    if (r?.aktivFreigegeben !== true) fehler.push('Runtime aktivFreigegeben=true');
    if (r?.empfangInstalliert !== false) fehler.push('Runtime vor Start empfangInstalliert=false');
    if (r?.lebensnachweisAutomatikAktiv !== false) fehler.push('Runtime vor Start Heartbeat=false');
    if (r?.lebensnachweisSendeVersuche !== 0) fehler.push('Runtime vor Start Heartbeat-Versuche=0');

    const c = capability?.status?.();
    if (c?.aktivFreigegeben !== true) fehler.push('Capability aktivFreigegeben=true');
    if (c?.remoteBeobachtungInstalliert !== false) fehler.push('Remote-Beobachtung vor Soak=false');
    if (c?.capabilityEmpfangInstalliert !== false) fehler.push('Capability-Empfang vor Soak=false');
    if (c?.senden?.versuche !== 0 || c?.senden?.erfolge !== 0 || c?.senden?.fehler !== 0) {
      fehler.push('Capability vor Soak Sendezaehler=0');
    }

    if (fehler.length > 0) {
      throw new Error('Block-8.6-Soak-Preflight vor Runtime-Start fehlgeschlagen: ' + fehler.join(', '));
    }
  }

  async function soak() {
    const runner = globalThis.V4Block86FreigabeLiveTest;
    const runtime = globalThis.V4ProduktionsLaufzeit;
    const capability = globalThis.V4CapabilityLaufzeit;
    const vor = capability.status();

    if (vor.senden.versuche !== 0 || vor.senden.erfolge !== 0 || vor.senden.fehler !== 0) {
      throw new Error('Soak startet nur mit exakt 0 Capability-Sendezaehlern.');
    }

    const bericht = await runner.soak(BESTAETIGUNG);
    const runtimeNachher = runtime.status();
    const capNachher = capability.status();
    const remoteLivenessNeu =
      capNachher.beobachteteLebensnachweise - zustand.beobachteteLebensnachweiseVorher;
    const pass =
      bericht?.pass === true &&
      bericht?.stufe === 'soak' &&
      bericht?.nachweis?.ergebnis === 'bestanden' &&
      bericht?.nachweis?.telemetrieNachweis === true &&
      bericht?.nachweis?.recoveryNachweis === true &&
      bericht?.nachweis?.gesamtauswertungBestanden === true &&
      bericht?.dauerMillisekunden === 600000 &&
      bericht?.sampleMillisekunden === 5000 &&
      bericht?.samples >= bericht?.erwarteteSamples &&
      bericht?.recoveryReplayVerified === true &&
      runtimeNachher.lebensnachweisSendeFehler === 0 &&
      capNachher.senden.versuche === 0 &&
      capNachher.senden.erfolge === 0 &&
      capNachher.senden.fehler === 0 &&
      capNachher.remoteBeobachtungInstalliert === true &&
      capNachher.capabilityEmpfangInstalliert === true &&
      remoteLivenessNeu >= 1;

    const gesamtbericht = Object.freeze({
      schemaVersion: 1,
      paketVersion: VERSION,
      releaseSha: RELEASE_SHA,
      candidateUrl: CANDIDATE_URL,
      candidateSha256: CANDIDATE_SHA256,
      candidateBytes: CANDIDATE_BYTES,
      geladenerSha256: zustand.geladenerSha256,
      laufKennung: LAUF_KENNUNG,
      lokalerCharakter: zustand.lokalerCharakter,
      zielName: zustand.zielName,
      liveReportSha256: globalThis.AIO_V4_BLOCK86_SOAK_EVIDENZ?.liveReportSha256 ?? null,
      pass,
      remoteLivenessNeu,
      empfangeneCapabilitySnapshots: capNachher.empfangeneCapabilitySnapshots,
      runnerBericht: bericht,
      runtimeStatus: runtimeNachher,
      capabilityStatus: capNachher
    });
    zustand.letzterBericht = gesamtbericht;

    test.setzeErgebnis(
      gesamtbericht,
      pass ? 'pass' : 'fail',
      pass
        ? 'Block-8.6-Soak bestanden: 10 Minuten stabil, Heartbeats fortgeschritten, 0 Capability-Sendungen und Remote-Liveness beobachtet.'
        : 'Block-8.6-Soak fehlgeschlagen. Beide Ranger-Berichte kopieren und Block 8.6 nicht abschliessen.'
    );
    test.protokolliere('Soak-Abschluss', gesamtbericht);
    if (!pass) throw new Error('Block-8.6-Soakbericht erfuellt die strikten PASS-Bedingungen nicht.');
    return gesamtbericht;
  }

  test.registriereAktion({
    kennung: 'soak',
    titel: '3 · Soak starten',
    art: 'gefahr',
    aktiviert: false,
    einmalig: true,
    bestaetigungsText: BESTAETIGUNG,
    ausfuehren: soak
  });

  Object.defineProperty(globalThis, API_NAME, {
    configurable: true,
    enumerable: true,
    writable: false,
    value: Object.freeze({
      version: VERSION,
      releaseSha: RELEASE_SHA,
      candidateUrl: CANDIDATE_URL,
      candidateSha256: CANDIDATE_SHA256,
      candidateBytes: CANDIDATE_BYTES,
      laufKennung: LAUF_KENNUNG,
      bestaetigungsText: BESTAETIGUNG,
      status() {
        return Object.freeze({ ...zustand });
      },
      kopiereBericht: () => test.kopiereBericht()
    })
  });

  test.setzeStatus(
    'laeuft',
    'Immutable Block-8.6-Candidate wird geladen. Soak bleibt bis zum bestaetigten Produktionsheartbeat gesperrt.'
  );

  void (async () => {
    try {
      if (typeof globalThis.fetch !== 'function') {
        throw new Error('fetch ist im Adventure-Land-Codekontext nicht verfuegbar.');
      }
      const response = await globalThis.fetch(CANDIDATE_URL, { cache: 'no-store' });
      if (!response || response.ok !== true) {
        throw new Error('Candidate-Download fehlgeschlagen: HTTP ' + String(response?.status ?? 'unbekannt') + '.');
      }
      const candidateCode = String(await response.text());
      const bytes = new globalThis.TextEncoder().encode(candidateCode).byteLength;
      if (bytes !== CANDIDATE_BYTES) {
        throw new Error('Candidate-Bytegroesse stimmt nicht: ' + String(bytes) + '.');
      }
      if (!candidateCode.includes(CANDIDATE_MARKER)) {
        throw new Error('Geladene Datei besitzt nicht den erwarteten Block-8.6-Candidate-Marker.');
      }
      const hash = await berechneSha256(candidateCode);
      if (hash !== CANDIDATE_SHA256) {
        throw new Error('Candidate-SHA-256 stimmt nicht: ' + hash + '.');
      }
      zustand.geladenerSha256 = hash;

      (0, eval)(candidateCode);
      (0, eval)(RUNNER_SOURCE);
      pruefeVorStart();

      const runtime = globalThis.V4ProduktionsLaufzeit;
      runtime.starte();
      const heartbeatStatus = await warteAufProduktionsheartbeat(runtime);

      const capability = globalThis.V4CapabilityLaufzeit;
      const update = capability.aktualisiere();
      const capStatus = update.status;
      const localName = capStatus.capabilityStatus?.charakterName;
      if (localName !== zustand.lokalerCharakter) {
        throw new Error('Capability-Charakter stimmt nicht mit lokalem Soak-Charakter ueberein.');
      }
      const ziel = ['My_Ranger1', 'My_Ranger2'].filter((name) => name !== localName);
      if (ziel.length !== 1) throw new Error('Soak konnte nicht exakt einen anderen Ranger bestimmen.');
      if (!capStatus.audit?.produktionsbereit || update.lokalerSnapshot === null) {
        throw new Error('Capability-Audit oder lokaler Snapshot ist vor Soak nicht produktionsbereit.');
      }
      if (
        capStatus.remoteBeobachtungInstalliert !== false ||
        capStatus.capabilityEmpfangInstalliert !== false ||
        capStatus.senden.versuche !== 0 ||
        capStatus.senden.erfolge !== 0 ||
        capStatus.senden.fehler !== 0
      ) {
        throw new Error('Capability-Laufzeit muss vor dem Soak komplett sendefrei und ohne Remote-Wrapper sein.');
      }

      zustand.zielName = ziel[0];
      zustand.heartbeatErfolgeVorFreigabe = heartbeatStatus.lebensnachweisSendeErfolge;
      zustand.beobachteteLebensnachweiseVorher = capStatus.beobachteteLebensnachweise;
      zustand.phase = 'bereit';
      zustand.bereit = true;

      test.protokolliere('Block-8.6-Soak-Launcher bereit', Object.freeze({
        releaseSha: RELEASE_SHA,
        candidateSha256: hash,
        candidateBytes: bytes,
        laufKennung: LAUF_KENNUNG,
        lokalerCharakter: localName,
        zielName: ziel[0],
        heartbeatErfolge: heartbeatStatus.lebensnachweisSendeErfolge,
        heartbeatFehler: heartbeatStatus.lebensnachweisSendeFehler,
        capabilitySendeVersuche: capStatus.senden.versuche,
        beobachteteLebensnachweiseVorher: capStatus.beobachteteLebensnachweise,
        liveReportSha256: globalThis.AIO_V4_BLOCK86_SOAK_EVIDENZ?.liveReportSha256 ?? null
      }));
      test.setzeStatus(
        'bereit',
        'Soak-Preflight bestanden. Auf BEIDEN Rangern jetzt „3 · Soak starten“ mit dem angezeigten Bestaetigungstext ausfuehren und 10 Minuten ungestoert laufen lassen.'
      );
      test.setzeAktionAktiv('soak', true);
    } catch (ursache) {
      const meldung = fehlerText(ursache);
      zustand.phase = 'fehlgeschlagen';
      zustand.bereit = false;
      zustand.fehler = meldung;
      test.setzeAktionAktiv('soak', false);
      test.setzeErgebnis(
        Object.freeze({ status: 'fehlgeschlagen', fehler: meldung }),
        'fail',
        meldung
      );
      test.protokolliere('Block-8.6-Soak-Launcher FEHLER', meldung);
    }
  })();
})();
/* ===== END Block-8.6-Soak-Launcher ===== */
