(() => {
  'use strict';

  const KONSOLE_ID = 'v4-adventure-land-testkonsole';
  const STIL_ID = 'v4-adventure-land-testkonsole-stil';
  const API_NAME = 'V4Testkonsole';
  const VERSION = '1.1.0';
  const MAX_AUSGABEN = 100;
  const MAX_OBJEKT_TIEFE = 7;
  const MAX_OBJEKT_EINTRAEGE = 4000;
  const MAX_AUSGABE_ZEICHEN = 200000;

  function holeElternFenster() {
    try {
      if (typeof parent !== 'undefined' && parent && parent !== globalThis) return parent;
    } catch {
      // Zugriff kann in fremden Browser-Kontexten blockiert sein.
    }
    return null;
  }

  function holeSpielDokument() {
    const elternFenster = holeElternFenster();
    try {
      if (elternFenster?.document?.body) return elternFenster.document;
    } catch {
      // Fallback auf das aktuelle Dokument.
    }
    return document;
  }

  function holeSpielFenster() {
    return holeElternFenster() ?? globalThis;
  }

  function holeSpielWert(name) {
    const spielFenster = holeSpielFenster();
    try {
      if (name in spielFenster) return spielFenster[name];
    } catch {
      // Fallback auf den lokalen Kontext.
    }
    try {
      if (name in globalThis) return globalThis[name];
    } catch {
      // Nicht vorhanden.
    }
    return undefined;
  }

  function begrenzeText(text) {
    if (text.length <= MAX_AUSGABE_ZEICHEN) return text;
    const abgeschnitten = text.slice(0, MAX_AUSGABE_ZEICHEN);
    return `${abgeschnitten}\n\n[Ausgabe nach ${MAX_AUSGABE_ZEICHEN.toLocaleString('de-DE')} Zeichen abgeschnitten]`;
  }

  function sichereDarstellung(wert) {
    const gesehen = new WeakSet();
    let eintraege = 0;

    function wandel(innererWert, tiefe) {
      if (innererWert === null) return null;
      if (innererWert === undefined) return '[undefined]';
      if (typeof innererWert === 'bigint') return `${innererWert.toString()}n`;
      if (typeof innererWert === 'function') return `[Funktion ${innererWert.name || 'anonym'}]`;
      if (typeof innererWert === 'symbol') return innererWert.toString();
      if (typeof innererWert !== 'object') return innererWert;

      if (innererWert instanceof Error) {
        return {
          name: innererWert.name,
          meldung: innererWert.message,
          stapel: innererWert.stack ?? null
        };
      }

      if (gesehen.has(innererWert)) return '[Zirkulaere Referenz]';
      if (tiefe >= MAX_OBJEKT_TIEFE) return '[Maximale Tiefe erreicht]';
      if (eintraege >= MAX_OBJEKT_EINTRAEGE) return '[Maximale Eintragszahl erreicht]';

      gesehen.add(innererWert);

      if (Array.isArray(innererWert)) {
        const ergebnis = [];
        for (const eintrag of innererWert) {
          eintraege += 1;
          if (eintraege > MAX_OBJEKT_EINTRAEGE) {
            ergebnis.push('[Weitere Eintraege abgeschnitten]');
            break;
          }
          ergebnis.push(wandel(eintrag, tiefe + 1));
        }
        return ergebnis;
      }

      if (innererWert instanceof Map) {
        const ergebnis = {};
        for (const [schluessel, mapWert] of innererWert.entries()) {
          eintraege += 1;
          if (eintraege > MAX_OBJEKT_EINTRAEGE) {
            ergebnis['[abgeschnitten]'] = true;
            break;
          }
          ergebnis[String(schluessel)] = wandel(mapWert, tiefe + 1);
        }
        return ergebnis;
      }

      if (innererWert instanceof Set) return wandel(Array.from(innererWert), tiefe + 1);

      const ergebnis = {};
      let schluessel = [];
      try {
        schluessel = Object.keys(innererWert);
      } catch (fehler) {
        return `[Objekt konnte nicht gelesen werden: ${fehler instanceof Error ? fehler.message : String(fehler)}]`;
      }

      for (const name of schluessel) {
        eintraege += 1;
        if (eintraege > MAX_OBJEKT_EINTRAEGE) {
          ergebnis['[abgeschnitten]'] = true;
          break;
        }

        try {
          const beschreibung = Object.getOwnPropertyDescriptor(innererWert, name);
          if (beschreibung?.get && !('value' in beschreibung)) {
            ergebnis[name] = '[Getter nicht automatisch ausgefuehrt]';
            continue;
          }
          ergebnis[name] = wandel(innererWert[name], tiefe + 1);
        } catch (fehler) {
          ergebnis[name] = `[Lesefehler: ${fehler instanceof Error ? fehler.message : String(fehler)}]`;
        }
      }

      return ergebnis;
    }

    try {
      return begrenzeText(JSON.stringify(wandel(wert, 0), null, 2));
    } catch (fehler) {
      return begrenzeText(String(fehler));
    }
  }

  function leseFelder(objekt, feldNamen) {
    if (!objekt || typeof objekt !== 'object') return null;
    const ergebnis = {};
    for (const name of feldNamen) {
      try {
        if (name in objekt) ergebnis[name] = objekt[name] ?? null;
      } catch (fehler) {
        ergebnis[name] = `[Lesefehler: ${fehler instanceof Error ? fehler.message : String(fehler)}]`;
      }
    }
    return ergebnis;
  }

  function fasseGegenstandZusammen(gegenstand, platz = null) {
    if (gegenstand === null || gegenstand === undefined) {
      return platz === null ? null : { platz, leer: true };
    }
    const ergebnis = leseFelder(gegenstand, [
      'name', 'q', 'level', 'p', 'locked', 'l', 'rid', 'expires', 'stat_type'
    ]) ?? {};
    if (platz !== null) ergebnis.platz = platz;
    return ergebnis;
  }

  function erstelleInventarAnsicht() {
    const charakter = holeSpielWert('character');
    const items = Array.isArray(charakter?.items) ? charakter.items : [];
    return {
      plaetze: items.length,
      belegt: items.reduce((summe, item) => summe + (item ? 1 : 0), 0),
      gegenstaende: items.map((item, platz) => fasseGegenstandZusammen(item, platz))
    };
  }

  function erstelleCharakterAnsicht() {
    const charakter = holeSpielWert('character');
    if (!charakter) return null;

    const kern = leseFelder(charakter, [
      'id', 'name', 'ctype', 'level',
      'hp', 'max_hp', 'mp', 'max_mp',
      'xp', 'max_xp', 'gold',
      'attack', 'frequency', 'speed', 'range', 'armor', 'resistance',
      'map', 'in', 'x', 'y', 'real_x', 'real_y',
      'moving', 'target', 'rip', 'stand'
    ]) ?? {};

    return {
      ...kern,
      inventar: {
        plaetze: Array.isArray(charakter.items) ? charakter.items.length : null,
        belegt: Array.isArray(charakter.items)
          ? charakter.items.reduce((summe, item) => summe + (item ? 1 : 0), 0)
          : null
      },
      ausruestung: charakter.slots
        ? Object.fromEntries(Object.entries(charakter.slots).map(([platz, item]) => [platz, fasseGegenstandZusammen(item)]))
        : null
    };
  }

  function erstelleEntityAnsicht(entity, idFallback = null) {
    if (!entity || typeof entity !== 'object') return null;
    const ergebnis = leseFelder(entity, [
      'id', 'name', 'type', 'mtype', 'ctype', 'npc', 'owner',
      'level', 'hp', 'max_hp', 'mp', 'max_mp',
      'attack', 'frequency', 'speed', 'range', 'armor', 'resistance',
      'map', 'in', 'x', 'y', 'real_x', 'real_y',
      'moving', 'target', 'rip', 'dead', 'party', 'cooperative'
    ]) ?? {};
    if (!('id' in ergebnis) && idFallback !== null) ergebnis.id = idFallback;
    return ergebnis;
  }

  function erstelleEntitiesAnsicht(nurMonster = false) {
    const entities = holeSpielWert('entities') ?? {};
    const ergebnis = [];

    for (const [id, entity] of Object.entries(entities)) {
      if (!entity || typeof entity !== 'object') continue;
      if (nurMonster && entity.type !== 'monster') continue;
      ergebnis.push(erstelleEntityAnsicht(entity, id));
    }

    ergebnis.sort((a, b) => String(a?.id ?? '').localeCompare(String(b?.id ?? '')));
    return {
      anzahl: ergebnis.length,
      entities: ergebnis
    };
  }

  function erstelleGruppenAnsicht() {
    const gruppe = holeSpielWert('party');
    if (!gruppe || typeof gruppe !== 'object') return gruppe ?? null;
    const ergebnis = {};
    for (const [name, mitglied] of Object.entries(gruppe)) {
      ergebnis[name] = leseFelder(mitglied, [
        'name', 'type', 'skin', 'level', 'hp', 'max_hp', 'mp', 'max_mp',
        'x', 'y', 'map', 'in'
      ]) ?? mitglied;
    }
    return ergebnis;
  }

  function erstelleKartenAnsicht() {
    const charakter = holeSpielWert('character');
    const spielDaten = holeSpielWert('G');
    const kartenKennung = charakter?.map ?? null;
    const kartenDaten = kartenKennung && spielDaten?.maps ? spielDaten.maps[kartenKennung] : null;

    return {
      kennung: kartenKennung,
      position: {
        x: charakter?.x ?? null,
        y: charakter?.y ?? null,
        real_x: charakter?.real_x ?? null,
        real_y: charakter?.real_y ?? null
      },
      daten: leseFelder(kartenDaten, [
        'name', 'zone', 'safe', 'pvp', 'instance', 'ignore', 'monsters', 'spawns', 'doors', 'npcs'
      ])
    };
  }

  function erstelleBlock2Rohdaten() {
    return {
      erfasstAm: new Date().toISOString(),
      server: {
        region: holeSpielWert('server_region') ?? null,
        kennung: holeSpielWert('server_identifier') ?? null
      },
      charakter: erstelleCharakterAnsicht(),
      inventar: erstelleInventarAnsicht(),
      gruppe: erstelleGruppenAnsicht(),
      entities: erstelleEntitiesAnsicht(false),
      monster: erstelleEntitiesAnsicht(true),
      karte: erstelleKartenAnsicht()
    };
  }

  const schnelltests = [
    { kennung: 'charakter', titel: 'Charakter', lesen: erstelleCharakterAnsicht },
    { kennung: 'inventar', titel: 'Inventar', lesen: erstelleInventarAnsicht },
    { kennung: 'entities', titel: 'Entities', lesen: () => erstelleEntitiesAnsicht(false) },
    { kennung: 'monster', titel: 'Monster', lesen: () => erstelleEntitiesAnsicht(true) },
    { kennung: 'gruppe', titel: 'Gruppe', lesen: erstelleGruppenAnsicht },
    { kennung: 'karte', titel: 'Map', lesen: erstelleKartenAnsicht },
    { kennung: 'block2', titel: 'Block-2-Rohdaten', lesen: erstelleBlock2Rohdaten }
  ];

  const spielDokument = holeSpielDokument();
  const bestehend = spielDokument.getElementById(KONSOLE_ID);
  if (bestehend) {
    bestehend.style.display = 'flex';
    bestehend.querySelector('textarea')?.focus();
    return;
  }

  if (!spielDokument.getElementById(STIL_ID)) {
    const stil = spielDokument.createElement('style');
    stil.id = STIL_ID;
    stil.textContent = `
      #${KONSOLE_ID} {
        position: fixed;
        right: 12px;
        bottom: 12px;
        z-index: 2147483647;
        width: min(620px, calc(100vw - 24px));
        min-width: 320px;
        min-height: 220px;
        max-height: 78vh;
        resize: both;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        border: 1px solid rgba(255,255,255,.20);
        border-radius: 10px;
        background: rgba(18, 20, 26, .97);
        color: #f5f7fb;
        box-shadow: 0 12px 40px rgba(0,0,0,.45);
        font: 13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      #${KONSOLE_ID} * { box-sizing: border-box; }
      #${KONSOLE_ID} button,
      #${KONSOLE_ID} textarea { font: inherit; }
      #${KONSOLE_ID} .v4tk-kopf {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 9px 10px;
        border-bottom: 1px solid rgba(255,255,255,.12);
        background: rgba(255,255,255,.04);
      }
      #${KONSOLE_ID} .v4tk-titel { font-weight: 700; }
      #${KONSOLE_ID} .v4tk-version { opacity: .65; font-size: 11px; margin-left: 6px; }
      #${KONSOLE_ID} .v4tk-kopfaktionen { display: flex; gap: 6px; }
      #${KONSOLE_ID} button {
        min-height: 30px;
        border: 1px solid rgba(255,255,255,.16);
        border-radius: 6px;
        padding: 5px 9px;
        background: rgba(255,255,255,.08);
        color: inherit;
        cursor: pointer;
      }
      #${KONSOLE_ID} button:hover { background: rgba(255,255,255,.14); }
      #${KONSOLE_ID} button:focus-visible,
      #${KONSOLE_ID} textarea:focus-visible { outline: 2px solid #7ab8ff; outline-offset: 1px; }
      #${KONSOLE_ID} .v4tk-inhalt {
        min-height: 0;
        display: flex;
        flex: 1 1 auto;
        flex-direction: column;
        overflow: hidden;
      }
      #${KONSOLE_ID} .v4tk-hinweis {
        padding: 7px 10px;
        background: rgba(255, 180, 0, .10);
        border-bottom: 1px solid rgba(255, 180, 0, .22);
        color: #ffe2a3;
      }
      #${KONSOLE_ID} .v4tk-schnelltests {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        padding: 8px 10px;
        border-bottom: 1px solid rgba(255,255,255,.10);
      }
      #${KONSOLE_ID} .v4tk-schnelltests button::after {
        content: ' RO';
        font-size: 10px;
        opacity: .55;
      }
      #${KONSOLE_ID} .v4tk-eingabe {
        padding: 8px 10px;
        border-bottom: 1px solid rgba(255,255,255,.10);
      }
      #${KONSOLE_ID} textarea {
        width: 100%;
        min-height: 64px;
        max-height: 180px;
        resize: vertical;
        padding: 8px;
        border: 1px solid rgba(255,255,255,.18);
        border-radius: 6px;
        background: rgba(0,0,0,.26);
        color: #fff;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      }
      #${KONSOLE_ID} .v4tk-werkzeugleiste {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        margin-top: 7px;
      }
      #${KONSOLE_ID} .v4tk-werkzeugleiste .primaer { background: rgba(74, 144, 226, .28); }
      #${KONSOLE_ID} .v4tk-tastatur { margin-left: auto; opacity: .6; font-size: 11px; }
      #${KONSOLE_ID} .v4tk-ausgaben {
        min-height: 90px;
        flex: 1 1 auto;
        overflow: auto;
        padding: 8px 10px 10px;
      }
      #${KONSOLE_ID} .v4tk-leer { opacity: .55; padding: 16px 4px; text-align: center; }
      #${KONSOLE_ID} .v4tk-ausgabe {
        margin: 0 0 8px;
        border: 1px solid rgba(255,255,255,.12);
        border-radius: 7px;
        overflow: hidden;
        background: rgba(0,0,0,.20);
      }
      #${KONSOLE_ID} .v4tk-ausgabe-fehler { border-color: rgba(255, 95, 95, .45); }
      #${KONSOLE_ID} .v4tk-ausgabe-kopf {
        display: flex;
        align-items: center;
        gap: 7px;
        padding: 5px 7px;
        background: rgba(255,255,255,.05);
        font-size: 11px;
      }
      #${KONSOLE_ID} .v4tk-ausgabe-titel {
        font-weight: 700;
        flex: 1 1 auto;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      #${KONSOLE_ID} .v4tk-ausgabe-status { opacity: .7; }
      #${KONSOLE_ID} .v4tk-ausgabe-kopf button { min-height: 25px; padding: 2px 7px; font-size: 11px; }
      #${KONSOLE_ID} pre {
        margin: 0;
        padding: 8px;
        overflow: auto;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        color: #dce6f5;
        font: 12px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      }
      #${KONSOLE_ID}.v4tk-eingeklappt { min-height: 0; height: auto !important; resize: none; }
      #${KONSOLE_ID}.v4tk-eingeklappt .v4tk-inhalt { display: none; }
      @media (max-width: 520px) {
        #${KONSOLE_ID} { right: 6px; bottom: 6px; width: calc(100vw - 12px); min-width: 0; }
        #${KONSOLE_ID} .v4tk-tastatur { display: none; }
      }
    `;
    spielDokument.head.appendChild(stil);
  }

  const wurzel = spielDokument.createElement('section');
  wurzel.id = KONSOLE_ID;
  wurzel.setAttribute('aria-label', 'V4 Adventure-Land-Testkonsole');
  wurzel.innerHTML = `
    <div class="v4tk-kopf">
      <div><span class="v4tk-titel">V4 Testkonsole</span><span class="v4tk-version">v${VERSION}</span></div>
      <div class="v4tk-kopfaktionen">
        <button type="button" data-aktion="einklappen" title="Ein- oder ausklappen">–</button>
        <button type="button" data-aktion="schliessen" title="Testkonsole schliessen">×</button>
      </div>
    </div>
    <div class="v4tk-inhalt">
      <div class="v4tk-hinweis"><strong>Schnelltests sind read-only und kompakt.</strong> Freies JavaScript kann Spielzustand veraendern und Rohobjekte sehr gross ausgeben.</div>
      <div class="v4tk-schnelltests" aria-label="Read-only Schnelltests"></div>
      <div class="v4tk-eingabe">
        <textarea spellcheck="false" aria-label="JavaScript-Befehl" placeholder="JavaScript eingeben, z. B. character.hp oder console.log(character.hp)"></textarea>
        <div class="v4tk-werkzeugleiste">
          <button type="button" class="primaer" data-aktion="ausfuehren">Ausfuehren</button>
          <button type="button" data-aktion="verlauf-zurueck" title="Vorheriger Befehl">↑</button>
          <button type="button" data-aktion="verlauf-vor" title="Naechster Befehl">↓</button>
          <button type="button" data-aktion="letzte-kopieren">Letzte kopieren</button>
          <button type="button" data-aktion="alles-kopieren">Alles kopieren</button>
          <button type="button" data-aktion="leeren">Leeren</button>
          <span class="v4tk-tastatur">Strg+Enter ausfuehren · Alt+↑/↓ Verlauf</span>
        </div>
      </div>
      <div class="v4tk-ausgaben" aria-live="polite"><div class="v4tk-leer">Noch keine Ausgabe.</div></div>
    </div>
  `;
  spielDokument.body.appendChild(wurzel);

  const eingabe = wurzel.querySelector('textarea');
  const ausgabenElement = wurzel.querySelector('.v4tk-ausgaben');
  const schnelltestElement = wurzel.querySelector('.v4tk-schnelltests');
  const verlauf = [];
  const ausgaben = [];
  let verlaufPosition = 0;

  function formatiereZeitpunkt(zeitpunkt) {
    return new Intl.DateTimeFormat('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    }).format(zeitpunkt);
  }

  async function kopiereText(text) {
    const spielFenster = holeSpielFenster();
    try {
      const navigatorObjekt = spielFenster.navigator ?? globalThis.navigator;
      if (navigatorObjekt?.clipboard?.writeText) {
        await navigatorObjekt.clipboard.writeText(text);
        return true;
      }
    } catch {
      // Fallback folgt.
    }

    const hilfsfeld = spielDokument.createElement('textarea');
    hilfsfeld.value = text;
    hilfsfeld.setAttribute('readonly', '');
    hilfsfeld.style.position = 'fixed';
    hilfsfeld.style.opacity = '0';
    spielDokument.body.appendChild(hilfsfeld);
    hilfsfeld.select();
    let erfolgreich = false;
    try {
      erfolgreich = spielDokument.execCommand('copy');
    } finally {
      hilfsfeld.remove();
    }
    return erfolgreich;
  }

  function aktualisiereLeerHinweis() {
    const leer = ausgabenElement.querySelector('.v4tk-leer');
    if (ausgaben.length === 0 && !leer) {
      const hinweis = spielDokument.createElement('div');
      hinweis.className = 'v4tk-leer';
      hinweis.textContent = 'Noch keine Ausgabe.';
      ausgabenElement.appendChild(hinweis);
    }
    if (ausgaben.length > 0) leer?.remove();
  }

  function fuegeAusgabeHinzu({ titel, text, fehler = false, zeitpunkt = new Date() }) {
    const eintrag = { titel, text: begrenzeText(text), fehler, zeitpunkt };
    ausgaben.push(eintrag);
    while (ausgaben.length > MAX_AUSGABEN) ausgaben.shift();

    const artikel = spielDokument.createElement('article');
    artikel.className = `v4tk-ausgabe${fehler ? ' v4tk-ausgabe-fehler' : ''}`;

    const kopf = spielDokument.createElement('div');
    kopf.className = 'v4tk-ausgabe-kopf';

    const zeit = spielDokument.createElement('span');
    zeit.textContent = formatiereZeitpunkt(zeitpunkt);

    const status = spielDokument.createElement('span');
    status.className = 'v4tk-ausgabe-status';
    status.textContent = fehler ? 'FEHLER' : 'OK';

    const titelElement = spielDokument.createElement('span');
    titelElement.className = 'v4tk-ausgabe-titel';
    titelElement.textContent = titel;
    titelElement.title = titel;

    const kopierKnopf = spielDokument.createElement('button');
    kopierKnopf.type = 'button';
    kopierKnopf.textContent = 'Kopieren';
    kopierKnopf.addEventListener('click', async () => {
      const erfolgreich = await kopiereText(eintrag.text);
      kopierKnopf.textContent = erfolgreich ? 'Kopiert' : 'Fehler';
      setTimeout(() => { kopierKnopf.textContent = 'Kopieren'; }, 1200);
    });

    const vor = spielDokument.createElement('pre');
    vor.textContent = eintrag.text;

    kopf.append(zeit, status, titelElement, kopierKnopf);
    artikel.append(kopf, vor);
    ausgabenElement.prepend(artikel);

    while (ausgabenElement.querySelectorAll('.v4tk-ausgabe').length > MAX_AUSGABEN) {
      ausgabenElement.lastElementChild?.remove();
    }

    aktualisiereLeerHinweis();
    return eintrag;
  }

  function fuehreSchnelltestAus(test) {
    try {
      fuegeAusgabeHinzu({ titel: `${test.titel} [read-only]`, text: sichereDarstellung(test.lesen()) });
    } catch (fehler) {
      fuegeAusgabeHinzu({
        titel: `${test.titel} [read-only]`,
        text: sichereDarstellung(fehler),
        fehler: true
      });
    }
  }

  function baueGefangeneKonsole(zeilen) {
    const schreibe = (stufe, werte) => {
      zeilen.push(`${stufe}: ${werte.map((wert) => sichereDarstellung(wert)).join(' ')}`);
    };
    return {
      log: (...werte) => schreibe('log', werte),
      info: (...werte) => schreibe('info', werte),
      warn: (...werte) => schreibe('warn', werte),
      error: (...werte) => schreibe('error', werte),
      debug: (...werte) => schreibe('debug', werte)
    };
  }

  async function fuehreFreiesJavascriptAus(code) {
    const zeilen = [];
    const gefangeneKonsole = baueGefangeneKonsole(zeilen);
    const ausgabe = (...werte) => zeilen.push(werte.map((wert) => sichereDarstellung(wert)).join(' '));
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

    let ergebnis;
    try {
      const alsAusdruck = new AsyncFunction('console', 'ausgabe', `return (${code}\n);`);
      ergebnis = await alsAusdruck(gefangeneKonsole, ausgabe);
    } catch (fehler) {
      if (!(fehler instanceof SyntaxError)) throw fehler;
      const alsProgramm = new AsyncFunction('console', 'ausgabe', code);
      ergebnis = await alsProgramm(gefangeneKonsole, ausgabe);
    }

    const teile = [];
    if (zeilen.length > 0) teile.push(zeilen.join('\n'));
    teile.push(`Rueckgabewert:\n${sichereDarstellung(ergebnis)}`);
    return teile.join('\n\n');
  }

  async function ausfuehren() {
    const code = eingabe.value.trim();
    if (!code) return;

    if (verlauf.at(-1) !== code) verlauf.push(code);
    while (verlauf.length > 100) verlauf.shift();
    verlaufPosition = verlauf.length;

    const start = performance.now();
    try {
      const text = await fuehreFreiesJavascriptAus(code);
      const dauer = Math.round((performance.now() - start) * 10) / 10;
      fuegeAusgabeHinzu({ titel: `${code} (${dauer} ms)`, text });
    } catch (fehler) {
      const dauer = Math.round((performance.now() - start) * 10) / 10;
      fuegeAusgabeHinzu({
        titel: `${code} (${dauer} ms)`,
        text: sichereDarstellung(fehler),
        fehler: true
      });
    }
  }

  function navigiereVerlauf(richtung) {
    if (verlauf.length === 0) return;
    verlaufPosition = Math.max(0, Math.min(verlauf.length, verlaufPosition + richtung));
    eingabe.value = verlaufPosition === verlauf.length ? '' : verlauf[verlaufPosition];
    eingabe.focus();
    eingabe.setSelectionRange(eingabe.value.length, eingabe.value.length);
  }

  function formatiereAlleAusgaben() {
    return ausgaben.slice().reverse().map((eintrag) => {
      const zeit = eintrag.zeitpunkt.toISOString();
      return `[${zeit}] ${eintrag.fehler ? 'FEHLER' : 'OK'} ${eintrag.titel}\n${eintrag.text}`;
    }).join('\n\n---\n\n');
  }

  for (const test of schnelltests) {
    const knopf = spielDokument.createElement('button');
    knopf.type = 'button';
    knopf.textContent = test.titel;
    knopf.dataset.test = test.kennung;
    knopf.addEventListener('click', () => fuehreSchnelltestAus(test));
    schnelltestElement.appendChild(knopf);
  }

  wurzel.querySelector('[data-aktion="ausfuehren"]').addEventListener('click', ausfuehren);
  wurzel.querySelector('[data-aktion="verlauf-zurueck"]').addEventListener('click', () => navigiereVerlauf(-1));
  wurzel.querySelector('[data-aktion="verlauf-vor"]').addEventListener('click', () => navigiereVerlauf(1));
  wurzel.querySelector('[data-aktion="leeren"]').addEventListener('click', () => {
    ausgaben.length = 0;
    ausgabenElement.replaceChildren();
    aktualisiereLeerHinweis();
  });
  wurzel.querySelector('[data-aktion="letzte-kopieren"]').addEventListener('click', async (ereignis) => {
    const knopf = ereignis.currentTarget;
    const letzter = ausgaben.at(-1);
    if (!letzter) return;
    const erfolgreich = await kopiereText(letzter.text);
    knopf.textContent = erfolgreich ? 'Kopiert' : 'Fehler';
    setTimeout(() => { knopf.textContent = 'Letzte kopieren'; }, 1200);
  });
  wurzel.querySelector('[data-aktion="alles-kopieren"]').addEventListener('click', async (ereignis) => {
    const knopf = ereignis.currentTarget;
    if (ausgaben.length === 0) return;
    const erfolgreich = await kopiereText(formatiereAlleAusgaben());
    knopf.textContent = erfolgreich ? 'Kopiert' : 'Fehler';
    setTimeout(() => { knopf.textContent = 'Alles kopieren'; }, 1200);
  });
  wurzel.querySelector('[data-aktion="einklappen"]').addEventListener('click', (ereignis) => {
    const eingeklappt = wurzel.classList.toggle('v4tk-eingeklappt');
    ereignis.currentTarget.textContent = eingeklappt ? '+' : '–';
  });
  wurzel.querySelector('[data-aktion="schliessen"]').addEventListener('click', () => wurzel.remove());

  eingabe.addEventListener('keydown', (ereignis) => {
    if (ereignis.ctrlKey && ereignis.key === 'Enter') {
      ereignis.preventDefault();
      void ausfuehren();
      return;
    }
    if (ereignis.altKey && ereignis.key === 'ArrowUp') {
      ereignis.preventDefault();
      navigiereVerlauf(-1);
      return;
    }
    if (ereignis.altKey && ereignis.key === 'ArrowDown') {
      ereignis.preventDefault();
      navigiereVerlauf(1);
    }
  });

  const api = {
    version: VERSION,
    oeffnen() {
      wurzel.style.display = 'flex';
      eingabe.focus();
    },
    schliessen() {
      wurzel.remove();
    },
    ausgeben(wert, titel = 'Externe Ausgabe') {
      return fuegeAusgabeHinzu({ titel, text: sichereDarstellung(wert) });
    },
    charakter() {
      return erstelleCharakterAnsicht();
    },
    entities() {
      return erstelleEntitiesAnsicht(false);
    },
    block2Rohdaten() {
      return erstelleBlock2Rohdaten();
    },
    leeren() {
      ausgaben.length = 0;
      ausgabenElement.replaceChildren();
      aktualisiereLeerHinweis();
    }
  };

  try {
    globalThis[API_NAME] = api;
    holeSpielFenster()[API_NAME] = api;
  } catch {
    // Die GUI bleibt auch ohne globale API nutzbar.
  }

  fuegeAusgabeHinzu({
    titel: 'Testkonsole bereit',
    text: 'Version 1.1.0: Schnelltests geben kompakte Adventure-Land-Daten aus und vermeiden PIXI-/Render-Interna.'
  });
  eingabe.focus();
})();