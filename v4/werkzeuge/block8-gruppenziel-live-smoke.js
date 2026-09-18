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
