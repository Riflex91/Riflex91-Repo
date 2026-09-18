(() => {
  'use strict';

  const API_NAME = 'V4IngameHud';
  const VERSION = '1.0.0';
  const ELEMENT_ID = 'v4-ingame-hud';
  const STIL_ID = 'v4-ingame-hud-stil';
  const STANDARD_INTERVALL_MILLIS = 1_000;

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
    throw new Error('Fuer das V4-Ingame-HUD ist kein nutzbares Dokument verfuegbar.');
  }

  function fehlerText(fehler) {
    return fehler instanceof Error ? fehler.message : String(fehler);
  }

  function pruefeStatusSicht(status) {
    if (!status || typeof status !== 'object') {
      throw new Error('GemeinsameStatusSicht fehlt oder ist kein Objekt.');
    }
    if (status.schemaVersion !== 1) {
      throw new Error('GemeinsameStatusSicht besitzt eine unbekannte schemaVersion.');
    }
    if (status.nurLesen !== true) {
      throw new Error('GemeinsameStatusSicht muss nurLesen=true melden.');
    }
    if (status.spielAutoritaet !== false) {
      throw new Error('GemeinsameStatusSicht darf keine Spielautoritaet besitzen.');
    }
    if (status.bedienAutoritaet !== false) {
      throw new Error('GemeinsameStatusSicht darf keine Bedienautoritaet besitzen.');
    }
    if (status.neustartAutoritaet !== false) {
      throw new Error('GemeinsameStatusSicht darf keine Neustartautoritaet besitzen.');
    }
    if (!status.runtime || typeof status.runtime !== 'object') {
      throw new Error('GemeinsameStatusSicht enthaelt keinen Runtime-Status.');
    }
    if (!status.charakter || typeof status.charakter !== 'object') {
      throw new Error('GemeinsameStatusSicht enthaelt keinen Charakterstatus.');
    }
    return true;
  }

  function formatiereStatusWert(statusWert) {
    if (!statusWert || typeof statusWert !== 'object') return 'unbekannt';
    if (statusWert.zustand === 'bekannt') {
      if (statusWert.wert === null) return 'null';
      if (typeof statusWert.wert === 'boolean') return statusWert.wert ? 'ja' : 'nein';
      return String(statusWert.wert);
    }
    const grund = typeof statusWert.grund === 'string' && statusWert.grund.length > 0
      ? `: ${statusWert.grund}`
      : '';
    return `${String(statusWert.zustand || 'unbekannt')}${grund}`;
  }

  function formatiereAlter(wert) {
    if (wert === null || wert === undefined) return 'n/a';
    const zahl = Number(wert);
    if (!Number.isFinite(zahl) || zahl < 0) return 'ungueltig';
    if (zahl < 1_000) return `${Math.round(zahl)} ms`;
    return `${(zahl / 1_000).toFixed(1)} s`;
  }

  function zeile(label, wert) {
    return Object.freeze({ label: String(label), wert: String(wert) });
  }

  function abschnitt(kennung, titel, zeilen) {
    return Object.freeze({
      kennung,
      titel,
      zeilen: Object.freeze([...zeilen])
    });
  }

  function erstelleAnzeigeModell(status) {
    pruefeStatusSicht(status);

    const c = status.charakter;
    const runtime = status.runtime;
    const gruppe = status.gruppe || { verfuegbar: false };
    const entscheidung = status.entscheidung;
    const checkpoint = status.checkpoint || {};
    const meldung = status.letzteMeldung;
    const aktionen = Array.isArray(status.aktionen) ? status.aktionen : [];

    const charakterName = c.name?.zustand === 'bekannt'
      ? formatiereStatusWert(c.name)
      : 'Charakter unbekannt';

    const charakterZeilen = [
      zeile('Name', formatiereStatusWert(c.name)),
      zeile('Klasse', formatiereStatusWert(c.klasse)),
      zeile('Stufe', formatiereStatusWert(c.stufe)),
      zeile('Leben', `${formatiereStatusWert(c.leben)} / ${formatiereStatusWert(c.lebenMaximal)}`),
      zeile('Mana', `${formatiereStatusWert(c.mana)} / ${formatiereStatusWert(c.manaMaximal)}`),
      zeile('Karte', formatiereStatusWert(c.karte)),
      zeile('Instanz', formatiereStatusWert(c.instanz)),
      zeile('Tot', formatiereStatusWert(c.tot))
    ];

    const runtimeZeilen = [
      zeile('Recovery', runtime.recoveryStufe ?? 'unbekannt'),
      zeile('Safety', runtime.sicherheitsStufe ?? 'unbekannt'),
      zeile('Gruppen-Liveness', runtime.gruppenLiveness ?? 'unbekannt'),
      zeile('Snapshot-Alter', formatiereAlter(runtime.snapshotAlterMillisekunden)),
      zeile('Heartbeat-Alter', formatiereAlter(runtime.heartbeatAlterMillisekunden)),
      zeile('Fortschritt-Alter', formatiereAlter(runtime.fachlicherFortschrittAlterMillisekunden)),
      zeile('Offene Aktionen', runtime.offeneAktionsAnfragen ?? 0),
      zeile('Abgebrochene Aktionen', runtime.abgebrocheneAktionsAnfragen ?? 0),
      zeile('Nutzer muss handeln', runtime.mussNutzerHandeln === true ? 'ja' : 'nein'),
      zeile('Host-Neustart empfohlen', runtime.hostNeustartEmpfohlen === true ? 'ja' : 'nein')
    ];

    const gruppenZeilen = gruppe.verfuegbar === true
      ? [
          zeile('Betriebsart', gruppe.betriebsArt ?? 'unbekannt'),
          zeile('Gefahr', gruppe.gemeinsameGefahrenStufe ?? 'unbekannt'),
          zeile('Ziel', gruppe.gemeinsamesZielKennung ?? 'kein gemeinsames Ziel'),
          zeile('Aktive Teilnehmer', Array.isArray(gruppe.aktiveTeilnehmerKennungen)
            ? gruppe.aktiveTeilnehmerKennungen.join(', ') || 'keine'
            : 'keine'),
          zeile('Aufgaben', gruppe.aufgaben
            ? Object.entries(gruppe.aufgaben)
                .map(([name, traeger]) => `${name}=${traeger ?? '-'}`)
                .join(' · ')
            : 'keine'),
          zeile('Grund', gruppe.grund ?? '')
        ]
      : [zeile('Status', 'keine Gruppenentscheidung verfuegbar')];

    const entscheidungsZeilen = entscheidung
      ? [
          zeile('Kennung', entscheidung.entscheidungKennung),
          zeile('Entscheidung', entscheidung.gewaehlteEntscheidung),
          zeile('Quelle', entscheidung.quelle),
          zeile('Grund', entscheidung.grund),
          zeile('AktionsAnfragen', Array.isArray(entscheidung.aktionsAnfrageKennungen)
            ? entscheidung.aktionsAnfrageKennungen.join(', ') || 'keine'
            : 'keine')
        ]
      : [zeile('Status', 'keine aktuelle Entscheidung')];

    const aktionsZeilen = aktionen.length > 0
      ? aktionen.map((aktion) =>
          zeile(
            aktion.kennung ?? 'unbekannte Kennung',
            `${aktion.phase ?? 'unbekannt'} · ${aktion.aktion ?? 'unbekannte Aktion'} · ${aktion.grund ?? ''}`
          ))
      : [zeile('Status', 'keine beobachtete AktionsAnfrage')];

    const checkpointZeilen = [
      zeile('Ladestatus', checkpoint.ladeStatus ?? 'unbekannt'),
      zeile('Slot', checkpoint.slot ?? '-'),
      zeile('Sequenz', checkpoint.sequenz ?? '-'),
      zeile('Fallback', checkpoint.fallbackVerwendet === true ? 'ja' : 'nein'),
      zeile('Wiederaufnahme erlaubt', checkpoint.wiederaufnahmeErlaubt === false ? 'nein' : 'n/a'),
      zeile('Abgleich erforderlich', checkpoint.abgleichErforderlich === true ? 'ja' : 'n/a'),
      zeile('Aktionsautoritaet', checkpoint.aktionsAutoritaet === false ? 'nein' : 'n/a')
    ];

    const meldungsZeilen = meldung
      ? [
          zeile('Stufe', meldung.stufe),
          zeile('Titel', meldung.titel),
          zeile('Was ist passiert', meldung.wasIstPassiert),
          zeile('Warum', meldung.warumIstEsPassiert),
          zeile('Bot-Reaktion', meldung.wasHatDerBotGetan),
          zeile('Nutzeraktion', meldung.wasSollDerNutzerTun)
        ]
      : [zeile('Status', 'keine aktuelle Meldung')];

    return Object.freeze({
      schemaVersion: 1,
      charakterName,
      recoveryStufe: runtime.recoveryStufe ?? 'unbekannt',
      mussNutzerHandeln: runtime.mussNutzerHandeln === true,
      abschnitte: Object.freeze([
        abschnitt('charakter', 'Charakter', charakterZeilen),
        abschnitt('runtime', 'Runtime & Safety', runtimeZeilen),
        abschnitt('gruppe', 'Gruppe', gruppenZeilen),
        abschnitt('entscheidung', 'Entscheidung', entscheidungsZeilen),
        abschnitt('aktionen', 'Aktionsphasen', aktionsZeilen),
        abschnitt('checkpoint', 'Recovery-Checkpoint', checkpointZeilen),
        abschnitt('meldung', 'Letzte Meldung', meldungsZeilen)
      ])
    });
  }

  function installiereStil(dokument) {
    if (dokument.getElementById(STIL_ID)) return;
    const stil = dokument.createElement('style');
    stil.id = STIL_ID;
    stil.textContent = `
      .v4hud{position:fixed;left:14px;top:14px;z-index:2147483646;width:min(420px,calc(100vw - 28px));max-height:88vh;display:flex;flex-direction:column;overflow:hidden;border:1px solid rgba(255,255,255,.16);border-radius:12px;background:rgba(12,16,22,.96);color:#eef4ff;box-shadow:0 12px 38px rgba(0,0,0,.52);font:12px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      .v4hud *{box-sizing:border-box}.v4hud-kopf{display:flex;align-items:center;gap:7px;padding:9px 10px;border-bottom:1px solid rgba(255,255,255,.10)}.v4hud-titel{font-weight:750;flex:1}.v4hud-status{font-size:11px;padding:2px 7px;border-radius:999px;background:rgba(255,255,255,.10)}.v4hud-status[data-recovery="normal"]{color:#aef0c1;background:rgba(50,180,95,.18)}.v4hud-status[data-recovery="beobachten"]{color:#ffe0a3;background:rgba(255,184,60,.18)}.v4hud-status[data-recovery="sicher_pausiert"],.v4hud-status[data-recovery="neustart_empfohlen"],.v4hud-status[data-recovery="blockiert"]{color:#ffb1b1;background:rgba(255,82,82,.18)}
      .v4hud button{border:1px solid rgba(255,255,255,.14);border-radius:6px;background:rgba(255,255,255,.07);color:inherit;padding:3px 7px;cursor:pointer}.v4hud-inhalt{overflow:auto;padding:8px}.v4hud-fehler{display:none;margin:0 0 8px;padding:7px;border-radius:7px;background:rgba(255,82,82,.13);color:#ffb1b1}.v4hud-fehler.sichtbar{display:block}.v4hud-abschnitt{margin-bottom:8px;border:1px solid rgba(255,255,255,.08);border-radius:8px;overflow:hidden}.v4hud-abschnitt h4{margin:0;padding:6px 8px;background:rgba(255,255,255,.04);font-size:12px}.v4hud-zeile{display:grid;grid-template-columns:minmax(110px,38%) 1fr;gap:8px;padding:5px 8px;border-top:1px solid rgba(255,255,255,.05)}.v4hud-zeile span:first-child{opacity:.66}.v4hud-zeile span:last-child{overflow-wrap:anywhere;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}.v4hud-minimiert .v4hud-inhalt{display:none}
      @media(max-width:520px){.v4hud{left:6px;top:6px;width:calc(100vw - 12px);max-height:94vh}}
    `;
    dokument.head.appendChild(stil);
  }

  function leereElement(element) {
    while (element.firstChild) element.removeChild(element.firstChild);
  }

  function renderModell(dokument, inhaltElement, titelElement, statusElement, modell) {
    titelElement.textContent = `V4 · ${modell.charakterName}`;
    statusElement.textContent = String(modell.recoveryStufe).toUpperCase();
    statusElement.dataset.recovery = modell.recoveryStufe;

    leereElement(inhaltElement);
    for (const abschnittModell of modell.abschnitte) {
      const box = dokument.createElement('section');
      box.className = 'v4hud-abschnitt';
      const titel = dokument.createElement('h4');
      titel.textContent = abschnittModell.titel;
      box.appendChild(titel);

      for (const zeilenModell of abschnittModell.zeilen) {
        const zeilenElement = dokument.createElement('div');
        zeilenElement.className = 'v4hud-zeile';
        const label = dokument.createElement('span');
        const wert = dokument.createElement('span');
        label.textContent = zeilenModell.label;
        wert.textContent = zeilenModell.wert;
        zeilenElement.appendChild(label);
        zeilenElement.appendChild(wert);
        box.appendChild(zeilenElement);
      }
      inhaltElement.appendChild(box);
    }
  }

  function erstelleHud(optionen = {}) {
    const dokument = holeDokument();
    installiereStil(dokument);
    const bestehend = dokument.getElementById(ELEMENT_ID);
    if (bestehend) bestehend.remove();

    const wurzel = dokument.createElement('section');
    wurzel.id = ELEMENT_ID;
    wurzel.className = 'v4hud';
    wurzel.setAttribute('aria-label', 'V4 Ingame HUD');

    const kopf = dokument.createElement('div');
    kopf.className = 'v4hud-kopf';
    const titel = dokument.createElement('div');
    titel.className = 'v4hud-titel';
    titel.textContent = optionen.titel || 'V4';
    const statusElement = dokument.createElement('span');
    statusElement.className = 'v4hud-status';
    statusElement.textContent = 'BEREIT';

    const minimieren = dokument.createElement('button');
    minimieren.type = 'button';
    minimieren.textContent = '–';
    minimieren.title = 'HUD minimieren';
    const schliessen = dokument.createElement('button');
    schliessen.type = 'button';
    schliessen.textContent = '×';
    schliessen.title = 'HUD schliessen';

    kopf.appendChild(titel);
    kopf.appendChild(statusElement);
    kopf.appendChild(minimieren);
    kopf.appendChild(schliessen);

    const inhaltRahmen = dokument.createElement('div');
    inhaltRahmen.className = 'v4hud-inhalt';
    const fehlerElement = dokument.createElement('div');
    fehlerElement.className = 'v4hud-fehler';
    const inhaltElement = dokument.createElement('div');
    inhaltRahmen.appendChild(fehlerElement);
    inhaltRahmen.appendChild(inhaltElement);

    wurzel.appendChild(kopf);
    wurzel.appendChild(inhaltRahmen);
    dokument.body.appendChild(wurzel);

    let statusLieferant = null;
    let intervallMillisekunden = STANDARD_INTERVALL_MILLIS;
    let timer = null;
    let letzterStatus = null;
    let letzterFehler = null;
    let sichtbar = true;

    function setzeFehler(fehler) {
      letzterFehler = fehlerText(fehler);
      fehlerElement.textContent = `HUD-Fehler: ${letzterFehler}`;
      fehlerElement.classList.add('sichtbar');
      return false;
    }

    function loescheFehler() {
      letzterFehler = null;
      fehlerElement.textContent = '';
      fehlerElement.classList.remove('sichtbar');
    }

    function aktualisiere(status) {
      try {
        const modell = erstelleAnzeigeModell(status);
        renderModell(dokument, inhaltElement, titel, statusElement, modell);
        letzterStatus = status;
        loescheFehler();
        return true;
      } catch (fehler) {
        return setzeFehler(fehler);
      }
    }

    function stoppeTimer() {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    }

    function tick() {
      if (typeof statusLieferant !== 'function') return false;
      try {
        return aktualisiere(statusLieferant());
      } catch (fehler) {
        return setzeFehler(fehler);
      }
    }

    function starteTimer() {
      stoppeTimer();
      if (!sichtbar || typeof statusLieferant !== 'function') return;
      tick();
      timer = setInterval(tick, intervallMillisekunden);
    }

    function verbinde(lieferant, neuesIntervallMillisekunden = STANDARD_INTERVALL_MILLIS) {
      if (typeof lieferant !== 'function') throw new Error('statusLieferant muss eine Funktion sein.');
      if (!Number.isFinite(neuesIntervallMillisekunden) || neuesIntervallMillisekunden < 250) {
        throw new Error('HUD-Aktualisierungsintervall muss mindestens 250 ms betragen.');
      }
      statusLieferant = lieferant;
      intervallMillisekunden = neuesIntervallMillisekunden;
      starteTimer();
      return true;
    }

    function trenne() {
      stoppeTimer();
      statusLieferant = null;
      return true;
    }

    function oeffnen() {
      sichtbar = true;
      wurzel.style.display = 'flex';
      starteTimer();
      return true;
    }

    function hudSchliessen() {
      sichtbar = false;
      wurzel.style.display = 'none';
      stoppeTimer();
      return true;
    }

    minimieren.addEventListener('click', () => {
      const minimiert = wurzel.classList.toggle('v4hud-minimiert');
      minimieren.textContent = minimiert ? '+' : '–';
    });
    schliessen.addEventListener('click', hudSchliessen);

    if (typeof optionen.statusLieferant === 'function') {
      verbinde(optionen.statusLieferant, optionen.intervallMillisekunden ?? STANDARD_INTERVALL_MILLIS);
    }

    return Object.freeze({
      version: VERSION,
      aktualisiere,
      verbinde,
      trenne,
      oeffnen,
      schliessen: hudSchliessen,
      status() {
        return Object.freeze({
          sichtbar,
          verbunden: typeof statusLieferant === 'function',
          timerAktiv: timer !== null,
          intervallMillisekunden,
          letzterFehler,
          letzterStatusErstelltAm: letzterStatus?.erstelltAm ?? null
        });
      }
    });
  }

  const api = Object.freeze({
    version: VERSION,
    pruefeStatusSicht,
    formatiereStatusWert,
    erstelleAnzeigeModell,
    erstelleHud
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
    // Lokale read-only API bleibt verfuegbar.
  }
})();
