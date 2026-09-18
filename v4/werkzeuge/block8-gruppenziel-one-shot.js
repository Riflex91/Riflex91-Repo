(() => {
  'use strict';

  const API_NAME = 'V4Block8GruppenZielOneShot';
  const VERSION = '1.0.0';
  const FREIGABE_TEXT = 'BLOCK8-GRUPPENZIEL-EINMAL-FREIGEBEN';
  const FREIGABE_DAUER_MS = 30_000;
  const VORSCHAU_MAXIMAL_ALTER_MS = 5_000;
  const ERLAUBTE_AKTION = 'GRUPPE_GEMEINSAMES_ZIEL_BEARBEITEN';
  const ERLAUBTE_ART = 'gemeinsames_ziel_bearbeiten';
  const BRUECKEN_NAME = 'V4Block8GruppenZielAusfuehrungsBruecke';

  let letzteVorschau = null;
  let freigabe = null;
  let letzterBericht = null;

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
      // Fallback folgt.
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
      // Diagnose darf das Gate nicht beeinflussen.
    }
  }

  function endlicheZahl(wert) {
    return typeof wert === 'number' && Number.isFinite(wert) ? wert : null;
  }

  function position(objekt) {
    if (!objekt || typeof objekt !== 'object') return null;
    const x = endlicheZahl(objekt.real_x) ?? endlicheZahl(objekt.x);
    const y = endlicheZahl(objekt.real_y) ?? endlicheZahl(objekt.y);
    return x === null || y === null ? null : Object.freeze([x, y]);
  }

  function holeGruppenSchatten() {
    const api = holeGlobal('V4Block8GruppenAktionsSteuerung');
    if (!api || typeof api.pruefe !== 'function' || typeof api.setzeSteuerungZurueck !== 'function') {
      throw new Error('V4Block8GruppenAktionsSteuerung muss vor dem One-shot-Werkzeug geladen werden.');
    }
    return api;
  }

  function holeSicherheitsQuelle() {
    const api = holeGlobal('V4Block7KampfsicherheitsQuelle');
    if (!api || typeof api.bewerte !== 'function') {
      throw new Error('V4Block7KampfsicherheitsQuelle muss vor dem One-shot-Werkzeug geladen werden.');
    }
    return api;
  }

  function pruefeAktuelleSicherheit() {
    const bewertung = holeSicherheitsQuelle().bewerte();
    if (!bewertung || bewertung.schemaVersion !== 1 || !bewertung.gefahrenBewertung) {
      throw new Error('Aktuelle Block-7-Sicherheitsbewertung ist nicht sicher lesbar.');
    }
    if (bewertung.gefahrenBewertung.stufe !== 'sicher') {
      throw new Error(`Aktuelle Block-7-Sicherheitslage ist nicht sicher: ${String(bewertung.gefahrenBewertung.stufe)}.`);
    }
    return bewertung;
  }

  function pruefeAngriffsBereitschaft() {
    const cooldown = holeGlobal('is_on_cooldown');
    if (typeof cooldown === 'function') {
      const wert = Reflect.apply(cooldown, holeElternFenster() ?? globalThis, ['attack']);
      if (wert === false) return Object.freeze({ zustand: 'bereit', quelle: 'is_on_cooldown' });
      if (wert === true) throw new Error('Der normale Angriff befindet sich aktuell auf Cooldown.');
      throw new Error('is_on_cooldown lieferte keinen booleschen Wert; Angriffsbereitschaft bleibt unbekannt.');
    }

    const canUse = holeGlobal('can_use');
    if (typeof canUse === 'function') {
      const wert = Reflect.apply(canUse, holeElternFenster() ?? globalThis, ['attack']);
      if (wert === true) return Object.freeze({ zustand: 'bereit', quelle: 'can_use' });
      throw new Error('Der normale Angriff ist ohne positive can_use-Bestaetigung nicht freigegeben.');
    }

    throw new Error('Angriffsbereitschaft ist unbekannt; weder is_on_cooldown noch can_use ist verfuegbar.');
  }

  function holeEntity(zielKennung) {
    const entities = holeGlobal('entities');
    if (!entities || typeof entities !== 'object') return null;
    const direkt = entities[zielKennung];
    if (direkt && typeof direkt === 'object') return direkt;
    for (const entity of Object.values(entities)) {
      if (entity && typeof entity === 'object' && String(entity.id ?? '') === zielKennung) return entity;
    }
    return null;
  }

  function pruefeZielUndReichweite(zielKennung) {
    const charakter = holeGlobal('character');
    if (!charakter || typeof charakter !== 'object') throw new Error('Charakterzustand ist fuer den One-shot-Test nicht lesbar.');
    if (charakter.rip === true || endlicheZahl(charakter.hp) === null || Number(charakter.hp) <= 0) {
      throw new Error('Der lokale Charakter ist nicht bestaetigt lebendig.');
    }

    const ziel = holeEntity(zielKennung);
    if (!ziel) throw new Error(`Gruppenziel ${zielKennung} ist nicht mehr sichtbar.`);
    if (ziel.dead === true || ziel.rip === true || endlicheZahl(ziel.hp) === null || Number(ziel.hp) <= 0) {
      throw new Error(`Gruppenziel ${zielKennung} ist nicht bestaetigt lebendig.`);
    }

    const von = position(charakter);
    const nach = position(ziel);
    const reichweite = endlicheZahl(charakter.range);
    if (!von || !nach || reichweite === null || reichweite < 0) {
      throw new Error(`Aktuelle Reichweite fuer Gruppenziel ${zielKennung} kann nicht sicher geprueft werden.`);
    }
    if (typeof charakter.map === 'string' && typeof ziel.map === 'string' && charakter.map !== ziel.map) {
      throw new Error(`Gruppenziel ${zielKennung} befindet sich nicht auf derselben Karte.`);
    }

    const abstand = Math.hypot(nach[0] - von[0], nach[1] - von[1]);
    if (abstand > reichweite) throw new Error(`Gruppenziel ${zielKennung} ist ausserhalb der aktuellen Angriffsreichweite.`);
    return Object.freeze({ zielKennung, abstand, reichweite, charakterPosition: von, zielPosition: nach });
  }

  function holeAusfuehrungsBruecke() {
    const bruecke = holeGlobal(BRUECKEN_NAME);
    if (!bruecke || typeof bruecke !== 'object') {
      throw new Error(`${BRUECKEN_NAME} ist nicht geladen; echte Ausfuehrung bleibt blockiert.`);
    }
    if (bruecke.quelleBereich !== 'ausfuehrung' || bruecke.aktionsName !== ERLAUBTE_AKTION || typeof bruecke.fuehreEinmalAus !== 'function') {
      throw new Error(`${BRUECKEN_NAME} besitzt nicht den erwarteten ausfuehrung/-Vertrag.`);
    }
    return bruecke;
  }

  function aktuelleFreigabe(jetzt = Date.now()) {
    if (freigabe && jetzt >= freigabe.gueltigBis) freigabe = null;
    return freigabe;
  }

  function status() {
    const jetzt = Date.now();
    const aktiv = aktuelleFreigabe(jetzt);
    let brueckeVerfuegbar = false;
    try {
      holeAusfuehrungsBruecke();
      brueckeVerfuegbar = true;
    } catch {
      brueckeVerfuegbar = false;
    }
    return Object.freeze({
      schemaVersion: 1,
      werkzeug: API_NAME,
      version: VERSION,
      freigegeben: Boolean(aktiv),
      freigabeAktionsKennung: aktiv?.aktionsKennung ?? null,
      freigabeZielKennung: aktiv?.zielKennung ?? null,
      freigabeRestMillisekunden: aktiv ? Math.max(0, aktiv.gueltigBis - jetzt) : 0,
      letzteVorschau,
      letzterBericht,
      ausfuehrungsBruecke: BRUECKEN_NAME,
      ausfuehrungsBrueckeVerfuegbar: brueckeVerfuegbar,
      echteSpielaktionenDurchWerkzeug: false
    });
  }

  async function vorschau() {
    const sicherheit = pruefeAktuelleSicherheit();
    const bereitschaft = pruefeAngriffsBereitschaft();
    const schatten = holeGruppenSchatten();
    schatten.setzeSteuerungZurueck();
    const ergebnis = await schatten.pruefe({
      uebersetzungAktiviert: true,
      freigegebeneArten: [ERLAUBTE_ART],
      einreichungAktiviert: true,
      freigegebeneAktionen: [ERLAUBTE_AKTION],
      verarbeiten: true
    });

    const verarbeitung = ergebnis?.steuerungsErgebnis?.verarbeitung;
    const anfrage = verarbeitung?.gestarteteAnfrage;
    if (verarbeitung?.art !== 'gestartet' || !anfrage) {
      throw new Error('Der zentrale Block-8-Schattenpfad hat keine ausfuehrbare Gruppenzielanfrage gestartet.');
    }
    if (anfrage.aktion !== ERLAUBTE_AKTION || anfrage.angefordertVon !== 'gruppen-aktionsplanung') {
      throw new Error('Der zentrale Schattenpfad lieferte nicht die exakt erlaubte Gruppenzielaktion.');
    }
    const ressourcen = [...new Set(anfrage.benoetigteRessourcen ?? [])].sort();
    if (ressourcen.length !== 2 || ressourcen[0] !== 'gruppe' || ressourcen[1] !== 'kampfziel') {
      throw new Error('Die gestartete Gruppenzielanfrage besitzt nicht exakt gruppe und kampfziel.');
    }
    const zielKennung = anfrage.details?.zielKennung;
    if (typeof zielKennung !== 'string' || zielKennung.length === 0) {
      throw new Error('Die gestartete Gruppenzielanfrage besitzt keine Zielkennung.');
    }
    const zielPruefung = pruefeZielUndReichweite(zielKennung);
    const jetzt = Date.now();
    letzteVorschau = Object.freeze({
      schemaVersion: 1,
      werkzeug: API_NAME,
      version: VERSION,
      erstelltAm: jetzt,
      aktionsKennung: anfrage.kennung,
      aktionsName: anfrage.aktion,
      zielKennung,
      lokalerCharakter: ergebnis.lokalerCharakter ?? null,
      benoetigteRessourcen: Object.freeze([...ressourcen]),
      sicherheit: Object.freeze({
        ausgewertetAm: sicherheit.ausgewertetAm,
        stufe: sicherheit.gefahrenBewertung.stufe,
        quellBlobSha: sicherheit.quellBlobSha ?? null
      }),
      angriffsBereitschaft: bereitschaft,
      zielPruefung,
      zentraleSchattenPhase: ergebnis.steuerungsErgebnis.laufZustaende?.find((zustand) => zustand.anfrage?.kennung === anfrage.kennung)?.phase ?? null,
      echteSpielaktionenAusgefuehrt: false
    });
    freigabe = null;
    ausgeben(letzteVorschau, 'Block 8 Gruppenziel One-shot · Vorschau (read-only)');
    return letzteVorschau;
  }

  function freigeben(text) {
    if (text !== FREIGABE_TEXT) throw new Error(`Falscher Freigabetext. Erwartet wird exakt: ${FREIGABE_TEXT}`);
    const jetzt = Date.now();
    if (!letzteVorschau) throw new Error('Vor der Freigabe ist eine frische read-only Vorschau erforderlich.');
    if (jetzt - letzteVorschau.erstelltAm > VORSCHAU_MAXIMAL_ALTER_MS) {
      throw new Error('Die One-shot-Vorschau ist zu alt; zuerst erneut read-only pruefen.');
    }
    pruefeAktuelleSicherheit();
    pruefeAngriffsBereitschaft();
    pruefeZielUndReichweite(letzteVorschau.zielKennung);

    freigabe = Object.freeze({
      aktionsKennung: letzteVorschau.aktionsKennung,
      zielKennung: letzteVorschau.zielKennung,
      erteiltAm: jetzt,
      gueltigBis: jetzt + FREIGABE_DAUER_MS
    });
    const ergebnis = status();
    ausgeben(ergebnis, 'Block 8 Gruppenziel One-shot · freigegeben');
    return ergebnis;
  }

  function sperren() {
    freigabe = null;
    const ergebnis = status();
    ausgeben(ergebnis, 'Block 8 Gruppenziel One-shot · gesperrt');
    return ergebnis;
  }

  async function starte() {
    const jetzt = Date.now();
    const aktiv = aktuelleFreigabe(jetzt);
    if (!aktiv) throw new Error('Block-8-Gruppenziel-One-shot ist gesperrt oder die Freigabe ist abgelaufen.');
    if (!letzteVorschau || aktiv.aktionsKennung !== letzteVorschau.aktionsKennung || aktiv.zielKennung !== letzteVorschau.zielKennung) {
      freigabe = null;
      throw new Error('Die One-shot-Freigabe passt nicht mehr zur letzten Vorschau.');
    }

    // One-shot: Sperre wird vor jeder delegierten Ausfuehrung verbraucht, auch wenn ein spaeterer Check fehlschlaegt.
    freigabe = null;

    let delegiert = false;
    try {
      const sicherheit = pruefeAktuelleSicherheit();
      const bereitschaft = pruefeAngriffsBereitschaft();
      const zielPruefung = pruefeZielUndReichweite(letzteVorschau.zielKennung);
      const bruecke = holeAusfuehrungsBruecke();

      const auftrag = Object.freeze({
        schemaVersion: 1,
        aktionsKennung: letzteVorschau.aktionsKennung,
        aktionsName: ERLAUBTE_AKTION,
        zielKennung: letzteVorschau.zielKennung,
        freigabeText: FREIGABE_TEXT,
        freigegebenAm: aktiv.erteiltAm,
        sicherheitsAuswertungAm: sicherheit.ausgewertetAm,
        angriffsBereitschaft: bereitschaft,
        zielPruefung
      });
      delegiert = true;
      const brueckenErgebnis = await bruecke.fuehreEinmalAus(auftrag);
      letzterBericht = Object.freeze({
        schemaVersion: 1,
        werkzeug: API_NAME,
        version: VERSION,
        status: 'delegiert',
        beendetAm: Date.now(),
        aktionsKennung: auftrag.aktionsKennung,
        aktionsName: auftrag.aktionsName,
        zielKennung: auftrag.zielKennung,
        delegierteAusfuehrungen: 1,
        automatischWiederGesperrt: true,
        echteSpielaktionenDurchWerkzeug: false,
        brueckenErgebnis: brueckenErgebnis ?? null
      });
      ausgeben(letzterBericht, 'Block 8 Gruppenziel One-shot · delegiertes Ergebnis');
      return letzterBericht;
    } catch (fehler) {
      letzterBericht = Object.freeze({
        schemaVersion: 1,
        werkzeug: API_NAME,
        version: VERSION,
        status: 'fehlgeschlagen',
        beendetAm: Date.now(),
        aktionsKennung: aktiv.aktionsKennung,
        zielKennung: aktiv.zielKennung,
        delegierteAusfuehrungen: delegiert ? 1 : 0,
        automatischWiederGesperrt: true,
        echteSpielaktionenDurchWerkzeug: false,
        fehler: fehler instanceof Error ? fehler.message : String(fehler)
      });
      ausgeben(letzterBericht, 'Block 8 Gruppenziel One-shot · fehlgeschlagen');
      throw fehler;
    }
  }

  const api = Object.freeze({
    version: VERSION,
    status,
    vorschau,
    freigeben,
    sperren,
    starte,
    ergebnis() { return letzterBericht; },
    freigabeText() { return FREIGABE_TEXT; },
    ausfuehrungsBrueckenName() { return BRUECKEN_NAME; }
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
    status: 'V4Block8GruppenZielOneShot.status()',
    vorschau: 'await V4Block8GruppenZielOneShot.vorschau()',
    freigabe: `V4Block8GruppenZielOneShot.freigeben("${FREIGABE_TEXT}")`,
    start: 'await V4Block8GruppenZielOneShot.starte()',
    sicherheit: 'One-shot; automatische Wiedersperrung vor Delegation; das Werkzeug selbst besitzt keinen Adventure-Land-Aktionsaufruf.',
    bruecke: BRUECKEN_NAME
  }, 'Block-8-Gruppenziel-One-shot-Werkzeug bereit');
})();
