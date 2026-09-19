(() => {
  'use strict';

  const API_NAME = 'V4CapabilityHud';
  const VERSION = '1.0.0';
  const ELEMENT_ID = 'v4-capability-hud';
  const STIL_ID = 'v4-capability-hud-stil';
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
    throw new Error('Fuer das V4-Capability-HUD ist kein nutzbares Dokument verfuegbar.');
  }

  function pruefeStatusSicht(status) {
    if (!status || typeof status !== 'object') {
      throw new Error('CapabilityStatusSicht fehlt oder ist kein Objekt.');
    }
    if (status.schemaVersion !== 1) throw new Error('CapabilityStatusSicht besitzt eine unbekannte schemaVersion.');
    if (status.nurLesen !== true) throw new Error('CapabilityStatusSicht muss nurLesen=true melden.');
    if (status.spielAutoritaet !== false) throw new Error('CapabilityStatusSicht darf keine Spielautoritaet besitzen.');
    if (status.bedienAutoritaet !== false) throw new Error('CapabilityStatusSicht darf keine Bedienautoritaet besitzen.');
    if (status.neustartAutoritaet !== false) throw new Error('CapabilityStatusSicht darf keine Neustartautoritaet besitzen.');
    if (!status.katalog || typeof status.katalog !== 'object') throw new Error('CapabilityStatusSicht enthaelt keinen Katalogstatus.');
    if (!status.skills || typeof status.skills !== 'object') throw new Error('CapabilityStatusSicht enthaelt keinen Skillstatus.');
    if (!Array.isArray(status.capabilities)) throw new Error('CapabilityStatusSicht enthaelt keine Capability-Liste.');
    if (!Array.isArray(status.remote)) throw new Error('CapabilityStatusSicht enthaelt keine Remote-Liste.');
    if (!status.gruppenwahl || typeof status.gruppenwahl !== 'object') throw new Error('CapabilityStatusSicht enthaelt keine Gruppenwahl.');
    if (!Array.isArray(status.diagnose)) throw new Error('CapabilityStatusSicht enthaelt keine Diagnose.');
    return true;
  }

  function formatiereAlter(wert) {
    if (wert === null || wert === undefined) return 'n/a';
    const zahl = Number(wert);
    if (!Number.isFinite(zahl) || zahl < 0) return 'ungueltig';
    if (zahl < 1_000) return Math.round(zahl) + ' ms';
    return (zahl / 1_000).toFixed(1) + ' s';
  }

  function kurzFingerprint(wert) {
    if (typeof wert !== 'string' || wert.length === 0) return 'n/a';
    return wert.length <= 16 ? wert : wert.slice(0, 12) + '…' + wert.slice(-4);
  }

  function jaNein(wert) {
    return wert === true ? 'ja' : 'nein';
  }

  function zeile(label, wert, details = null) {
    return Object.freeze({
      label: String(label),
      wert: String(wert),
      details: details === null ? null : String(details)
    });
  }

  function abschnitt(kennung, titel, zeilen) {
    return Object.freeze({
      kennung,
      titel,
      zeilen: Object.freeze([...zeilen])
    });
  }

  function skillText(skill) {
    const status = skill.aktuellAutomatisierbar
      ? 'bereit'
      : skill.vomNutzerFreigegeben
        ? 'gesperrt'
        : 'aus';
    const slider = Array.isArray(skill.slider) && skill.slider.length > 0
      ? ' · ' + skill.slider.map((s) => s.bezeichnung + '=' + s.wert).join(', ')
      : '';
    const capacity = skill.zielKapazitaet === null ? '' : ' · cap=' + skill.zielKapazitaet;
    return status + capacity + slider;
  }

  function capabilityText(capability) {
    const teile = [
      'aktuell=' + capability.aktuellAutomatisierbarAnzahl,
      'technisch=' + capability.technischBereitAnzahl,
      'validiert=' + capability.validiertAnzahl
    ];
    if (capability.maximaleZielKapazitaetAktuell !== null) {
      teile.push('cap=' + capability.maximaleZielKapazitaetAktuell);
    }
    return teile.join(' · ');
  }

  function remoteText(remote) {
    const teile = [
      remote.vertrauensStatus,
      'liveness=' + (remote.lebensnachweisStatus ?? 'unbekannt'),
      'alter=' + formatiereAlter(remote.lebensnachweisAlterMillisekunden),
      'catalog=' + remote.catalogAgreement,
      'skills=' + remote.aktuellAutomatisierbareSkills
    ];
    return teile.join(' · ');
  }

  function aufgabenText(aufgaben) {
    if (!aufgaben || typeof aufgaben !== 'object') return 'keine';
    return Object.entries(aufgaben)
      .map(([name, kennung]) => name + '=' + (kennung ?? '-'))
      .join(' · ');
  }

  function erstelleAnzeigeModell(status) {
    pruefeStatusSicht(status);

    const katalog = status.katalog;
    const skills = status.skills;
    const gruppenwahl = status.gruppenwahl;

    const katalogZeilen = [
      zeile('Zustand', katalog.zustand),
      zeile('Generation', katalog.generation),
      zeile('Fingerprint', kurzFingerprint(katalog.fingerprint), katalog.fingerprint),
      zeile('Letzter Audit', katalog.letzterErfolgreicherAuditAm ?? 'n/a'),
      zeile('Letzte Validierung', katalog.letzteExpliziteValidierungAm ?? 'n/a'),
      zeile('Bestaetigung erforderlich', jaNein(katalog.bestaetigungErforderlich)),
      zeile('Produktionsbereit', jaNein(katalog.produktionsbereit)),
      zeile('Grund', katalog.katalogGrund ?? katalog.grund ?? '')
    ];

    const skillZeilen = [
      zeile(
        'Aktiv / Gesamt',
        skills.aktiv + ' / ' + skills.gesamt,
        'aktuell automatisierbar=' + skills.aktuellAutomatisierbar +
          ', technisch bereit=' + skills.technischBereit +
          ', konfiguriert=' + skills.automatisierungKonfiguriert
      ),
      ...skills.skills.map((skill) =>
        zeile(skill.skillId, skillText(skill), skill.grund)
      )
    ];

    const capabilityZeilen = status.capabilities.length > 0
      ? status.capabilities.map((capability) =>
          zeile(capability.capability, capabilityText(capability))
        )
      : [zeile('Status', 'keine lokalen Capabilities')];

    const remoteZeilen = status.remote.length > 0
      ? status.remote.map((remote) =>
          zeile(
            remote.charakterName + ' [' + remote.charakterKennung + ']',
            remoteText(remote),
            Array.isArray(remote.gruende) ? remote.gruende.join(' ') : ''
          )
        )
      : [zeile('Status', 'keine Remote-Capabilities beobachtet')];

    const gruppenZeilen = gruppenwahl.verfuegbar
      ? [
          zeile('Betriebsart', gruppenwahl.betriebsArt ?? 'unbekannt'),
          zeile('Leader', gruppenwahl.leaderName
            ? gruppenwahl.leaderName + ' [' + gruppenwahl.leaderKennung + ']'
            : 'kein Leader'),
          zeile('Leader-Grund', gruppenwahl.leaderGrund ?? ''),
          zeile('Aufgaben', aufgabenText(gruppenwahl.aufgabenZuordnung)),
          zeile(
            'Vertraute Teilnehmer',
            Array.isArray(gruppenwahl.vertrauteTeilnehmerKennungen)
              ? gruppenwahl.vertrauteTeilnehmerKennungen.join(', ') || 'keine'
              : 'keine'
          ),
          ...gruppenwahl.ausgeschlosseneTeilnehmer.map((eintrag) =>
            zeile('Ausgeschlossen ' + eintrag.charakterKennung, eintrag.grund)
          )
        ]
      : [zeile('Status', 'keine capability-basierte Gruppenwahl verfuegbar')];

    const diagnoseZeilen = status.diagnose.length > 0
      ? status.diagnose.map((eintrag) =>
          zeile(
            eintrag.stufe.toUpperCase() + ' · ' + eintrag.code,
            eintrag.bereich + ':' + eintrag.bezug,
            eintrag.nachricht
          )
        )
      : [zeile('Status', 'keine Diagnoseeintraege')];

    return Object.freeze({
      schemaVersion: 1,
      charakterName: status.charakterName,
      katalogZustand: katalog.zustand,
      hatBlockierendeDiagnose: status.diagnose.some((eintrag) => eintrag.stufe === 'blockiert'),
      abschnitte: Object.freeze([
        abschnitt('katalog', 'Skill-Katalog', katalogZeilen),
        abschnitt('skills', 'Skills & Policy', skillZeilen),
        abschnitt('capabilities', 'Lokale Capabilities', capabilityZeilen),
        abschnitt('remote', 'Remote-Capabilities', remoteZeilen),
        abschnitt('gruppenwahl', 'Capability-Gruppenwahl', gruppenZeilen),
        abschnitt('diagnose', 'Diagnose', diagnoseZeilen)
      ])
    });
  }

  function installiereStil(dokument) {
    if (dokument.getElementById(STIL_ID)) return;
    const stil = dokument.createElement('style');
    stil.id = STIL_ID;
    stil.textContent = [
      '.v4cap{position:fixed;right:14px;top:14px;z-index:2147483646;width:min(460px,calc(100vw - 28px));max-height:88vh;display:flex;flex-direction:column;overflow:hidden;border:1px solid rgba(255,255,255,.16);border-radius:12px;background:rgba(12,16,22,.96);color:#eef4ff;box-shadow:0 12px 38px rgba(0,0,0,.52);font:12px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}',
      '.v4cap *{box-sizing:border-box}.v4cap-kopf{display:flex;align-items:center;gap:7px;padding:9px 10px;border-bottom:1px solid rgba(255,255,255,.10)}.v4cap-titel{font-weight:750;flex:1}.v4cap-status{font-size:11px;padding:2px 7px;border-radius:999px;background:rgba(255,255,255,.10)}',
      '.v4cap-status[data-blockiert="true"]{color:#ffb1b1;background:rgba(255,82,82,.18)}.v4cap-status[data-blockiert="false"]{color:#aef0c1;background:rgba(50,180,95,.18)}',
      '.v4cap button{border:1px solid rgba(255,255,255,.14);border-radius:6px;background:rgba(255,255,255,.07);color:inherit;padding:3px 7px;cursor:pointer}.v4cap-inhalt{overflow:auto;padding:8px}.v4cap-fehler{display:none;margin:0 0 8px;padding:7px;border-radius:7px;background:rgba(255,82,82,.13);color:#ffb1b1}.v4cap-fehler.sichtbar{display:block}',
      '.v4cap-abschnitt{margin-bottom:8px;border:1px solid rgba(255,255,255,.08);border-radius:8px;overflow:hidden}.v4cap-abschnitt h4{margin:0;padding:6px 8px;background:rgba(255,255,255,.04);font-size:12px}.v4cap-zeile{display:grid;grid-template-columns:minmax(130px,42%) 1fr;gap:8px;padding:5px 8px;border-top:1px solid rgba(255,255,255,.05)}.v4cap-zeile span:first-child{opacity:.66}.v4cap-zeile span:last-child{overflow-wrap:anywhere;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}.v4cap-details{grid-column:1/-1;opacity:.62;font-size:11px}.v4cap-minimiert .v4cap-inhalt{display:none}',
      '@media(max-width:520px){.v4cap{right:6px;top:6px;width:calc(100vw - 12px);max-height:94vh}}'
    ].join('');
    dokument.head.appendChild(stil);
  }

  function leereElement(element) {
    while (element.firstChild) element.removeChild(element.firstChild);
  }

  function renderModell(dokument, wurzel, modell) {
    wurzel.querySelector('.v4cap-titel').textContent = 'V4 Capability · ' + modell.charakterName;
    const status = wurzel.querySelector('.v4cap-status');
    status.textContent = modell.hatBlockierendeDiagnose ? 'BLOCKIERT' : String(modell.katalogZustand).toUpperCase();
    status.dataset.blockiert = modell.hatBlockierendeDiagnose ? 'true' : 'false';

    const inhalt = wurzel.querySelector('.v4cap-inhalt');
    leereElement(inhalt);

    for (const abschnitt of modell.abschnitte) {
      const container = dokument.createElement('section');
      container.className = 'v4cap-abschnitt';
      const titel = dokument.createElement('h4');
      titel.textContent = abschnitt.titel;
      container.appendChild(titel);

      for (const zeile of abschnitt.zeilen) {
        const row = dokument.createElement('div');
        row.className = 'v4cap-zeile';
        const label = dokument.createElement('span');
        const wert = dokument.createElement('span');
        label.textContent = zeile.label;
        wert.textContent = zeile.wert;
        row.appendChild(label);
        row.appendChild(wert);
        if (zeile.details) {
          const details = dokument.createElement('div');
          details.className = 'v4cap-details';
          details.textContent = zeile.details;
          row.appendChild(details);
        }
        container.appendChild(row);
      }
      inhalt.appendChild(container);
    }
  }

  function erstelleHud(optionen = {}) {
    const dokument = holeDokument();
    installiereStil(dokument);

    const bestehend = dokument.getElementById(ELEMENT_ID);
    if (bestehend) bestehend.remove();

    const wurzel = dokument.createElement('div');
    wurzel.id = ELEMENT_ID;
    wurzel.className = 'v4cap';
    wurzel.innerHTML =
      '<div class="v4cap-kopf">' +
        '<div class="v4cap-titel">V4 Capability</div>' +
        '<div class="v4cap-status" data-blockiert="true">UNBEKANNT</div>' +
        '<button type="button" data-v4cap-minimieren>–</button>' +
        '<button type="button" data-v4cap-schliessen>×</button>' +
      '</div>' +
      '<div class="v4cap-inhalt"></div>';
    dokument.body.appendChild(wurzel);

    const statusQuelle = typeof optionen.statusQuelle === 'function'
      ? optionen.statusQuelle
      : () => optionen.status;
    const intervallMillis = Number.isFinite(optionen.intervallMillis)
      ? Math.max(250, Number(optionen.intervallMillis))
      : STANDARD_INTERVALL_MILLIS;

    let intervall = null;
    let geschlossen = false;

    function aktualisieren() {
      if (geschlossen) return;
      const status = statusQuelle();
      const modell = erstelleAnzeigeModell(status);
      renderModell(dokument, wurzel, modell);
      return modell;
    }

    wurzel.querySelector('[data-v4cap-minimieren]').addEventListener('click', () => {
      wurzel.classList.toggle('v4cap-minimiert');
    });
    wurzel.querySelector('[data-v4cap-schliessen]').addEventListener('click', () => {
      geschlossen = true;
      if (intervall !== null && typeof clearInterval === 'function') clearInterval(intervall);
      wurzel.remove();
    });

    aktualisieren();
    if (optionen.autoAktualisieren !== false && typeof setInterval === 'function') {
      intervall = setInterval(aktualisieren, intervallMillis);
    }

    return Object.freeze({
      aktualisieren,
      schliessen() {
        if (geschlossen) return false;
        geschlossen = true;
        if (intervall !== null && typeof clearInterval === 'function') clearInterval(intervall);
        wurzel.remove();
        return true;
      },
      element: wurzel
    });
  }

  const api = Object.freeze({
    version: VERSION,
    pruefeStatusSicht,
    erstelleAnzeigeModell,
    erstelleHud
  });

  try {
    globalThis[API_NAME] = api;
  } catch {
    // Keine alternative Schreibseite erzeugen.
  }
})();
