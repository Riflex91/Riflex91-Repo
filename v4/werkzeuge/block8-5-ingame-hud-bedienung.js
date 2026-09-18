(() => {
  'use strict';

  const API_NAME = 'V4IngameHudBedienung';
  const VERSION = '1.0.0';
  const HUD_ELEMENT_ID = 'v4-ingame-hud';
  const BEDIEN_ELEMENT_ID = 'v4-ingame-hud-bedienung';
  const STIL_ID = 'v4-ingame-hud-bedienung-stil';
  const STANDARD_VORGANG_PREFIX = 'v4-ingame-hud';
  let vorgangsNummer = 0;

  const SICHERE_RUNTIME_METHODEN = Object.freeze([
    'basisBedienStatus',
    'erstelleBasisBedienAnfrage',
    'fuehreBasisBedienAnfrage'
  ]);

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
    throw new Error('Fuer die V4-HUD-Bedienung ist kein nutzbares Dokument verfuegbar.');
  }

  function holeGlobal(name) {
    try {
      if (globalThis?.[name] !== undefined) return globalThis[name];
    } catch {
      // Elternfenster bleibt Fallback.
    }
    const eltern = holeElternFenster();
    try {
      if (eltern?.[name] !== undefined) return eltern[name];
    } catch {
      // Kein weiterer Fallback.
    }
    return undefined;
  }

  function fehlerText(fehler) {
    return fehler instanceof Error ? fehler.message : String(fehler);
  }

  function pruefeNichtLeer(name, wert) {
    if (typeof wert !== 'string' || wert.trim().length === 0) {
      throw new Error(`${name} darf nicht leer sein.`);
    }
  }

  function pruefeRuntime(runtime) {
    if (!runtime || typeof runtime !== 'object') {
      throw new Error('Die sichere V4-Produktionsruntime ist nicht verfuegbar.');
    }
    for (const methode of SICHERE_RUNTIME_METHODEN) {
      if (typeof runtime[methode] !== 'function') {
        throw new Error(`Die Produktionsruntime besitzt die sichere Basisbedienungs-Methode ${methode} nicht.`);
      }
    }
    return true;
  }

  function pruefeBasisStatus(status) {
    if (!status || typeof status !== 'object' || !status.laufzeit || typeof status.laufzeit !== 'object') {
      throw new Error('Der Basisbedienungs-Status ist unvollstaendig.');
    }
    if (status.laufzeit.schemaVersion !== 1) {
      throw new Error('Der LaufzeitSteuerungs-Status besitzt eine unbekannte schemaVersion.');
    }
    if (status.laufzeit.zustand !== 'laeuft' && status.laufzeit.zustand !== 'pausiert') {
      throw new Error('Der LaufzeitSteuerungs-Status besitzt einen unbekannten Zustand.');
    }
    if (!Number.isSafeInteger(status.laufzeit.generation) || status.laufzeit.generation < 0) {
      throw new Error('Die Laufzeit-Generation ist ungueltig.');
    }
    if (status.laufzeit.automatischeFortsetzung !== false) {
      throw new Error('Die Basisbedienung akzeptiert keine Laufzeit mit automatischer Fortsetzung.');
    }
    return status;
  }

  function erstelleController(optionen = {}) {
    const runtime = optionen.runtime ?? holeGlobal('V4ProduktionsLaufzeit');
    pruefeRuntime(runtime);

    const vorgangPrefix = optionen.vorgangPrefix ?? STANDARD_VORGANG_PREFIX;
    pruefeNichtLeer('vorgangPrefix', vorgangPrefix);

    let basisStatus = pruefeBasisStatus(runtime.basisBedienStatus());
    let beschaeftigt = false;
    let fortsetzenBestaetigungOffen = false;
    let letztesErgebnis = null;
    let letzterFehler = null;

    function neueVorgangsKennung(aktion) {
      vorgangsNummer += 1;
      return `${vorgangPrefix}:${aktion}:${vorgangsNummer}`;
    }

    function aktualisiereBasisStatus() {
      basisStatus = pruefeBasisStatus(runtime.basisBedienStatus());
      return basisStatus;
    }

    function pruefeErgebnis(ergebnis, aktion) {
      if (!ergebnis || typeof ergebnis !== 'object') {
        throw new Error('Die Produktionsruntime lieferte kein gueltiges Basisbedienungs-Ergebnis.');
      }
      if (ergebnis.aktion !== aktion) {
        throw new Error(
          `Basisbedienungs-Ergebnis gehoert zu ${String(ergebnis.aktion)} statt zur angeforderten Aktion ${aktion}.`
        );
      }
      if (!['ausgefuehrt', 'blockiert', 'wiederholt'].includes(ergebnis.status)) {
        throw new Error(`Unbekannter Basisbedienungs-Ergebnisstatus: ${String(ergebnis.status)}.`);
      }
      return ergebnis;
    }

    function fuehreGesichertAus(aktion, ausdruecklichBestaetigt = undefined) {
      if (beschaeftigt) {
        throw new Error('Eine HUD-Bedienaktion wird bereits verarbeitet.');
      }

      const erwarteteLaufzeitGeneration = basisStatus.laufzeit.generation;
      beschaeftigt = true;
      letzterFehler = null;
      try {
        const daten = {
          vorgangsKennung: neueVorgangsKennung(aktion),
          aktion,
          erwarteteLaufzeitGeneration
        };
        if (ausdruecklichBestaetigt !== undefined) {
          daten.ausdruecklichBestaetigt = ausdruecklichBestaetigt;
        }

        const anfrage = runtime.erstelleBasisBedienAnfrage(Object.freeze(daten));
        const ergebnis = pruefeErgebnis(runtime.fuehreBasisBedienAnfrage(anfrage), aktion);
        letztesErgebnis = ergebnis;
        aktualisiereBasisStatus();

        if (typeof optionen.beiErgebnis === 'function') {
          optionen.beiErgebnis(ergebnis, basisStatus);
        }
        return ergebnis;
      } catch (fehler) {
        letzterFehler = fehlerText(fehler);
        throw fehler;
      } finally {
        beschaeftigt = false;
      }
    }

    function diagnoseAktualisieren() {
      return fuehreGesichertAus('diagnose_aktualisieren');
    }

    function pauseAnfordern() {
      if (basisStatus.laufzeit.zustand !== 'laeuft') {
        throw new Error('Die Laufzeit ist bereits pausiert; eine weitere Pause wird nicht angefordert.');
      }
      fortsetzenBestaetigungOffen = false;
      return fuehreGesichertAus('laufzeit_pausieren');
    }

    function fortsetzenAnfordern() {
      if (beschaeftigt) throw new Error('Eine HUD-Bedienaktion wird bereits verarbeitet.');
      if (basisStatus.laufzeit.zustand !== 'pausiert') {
        throw new Error('Fortsetzen ist nur bei pausierter Laufzeit verfuegbar.');
      }
      fortsetzenBestaetigungOffen = true;
      letzterFehler = null;
      return Object.freeze({
        bestaetigungErforderlich: true,
        titel: 'Laufzeit fortsetzen?',
        auswirkung:
          'Neue normale und Hintergrundarbeit wird wieder freigegeben. Alte abgebrochene Arbeit wird nicht wiederbelebt.',
        erwarteteLaufzeitGeneration: basisStatus.laufzeit.generation
      });
    }

    function fortsetzenBestaetigen() {
      if (!fortsetzenBestaetigungOffen) {
        throw new Error('Fortsetzen wurde noch nicht zur ausdruecklichen Bestaetigung angefordert.');
      }
      fortsetzenBestaetigungOffen = false;
      return fuehreGesichertAus('laufzeit_fortsetzen', true);
    }

    function fortsetzenAbbrechen() {
      fortsetzenBestaetigungOffen = false;
      letzterFehler = null;
      return true;
    }

    return Object.freeze({
      version: VERSION,
      diagnoseAktualisieren,
      pauseAnfordern,
      fortsetzenAnfordern,
      fortsetzenBestaetigen,
      fortsetzenAbbrechen,
      synchronisiere: aktualisiereBasisStatus,
      status() {
        return Object.freeze({
          basisStatus,
          beschaeftigt,
          fortsetzenBestaetigungOffen,
          letztesErgebnis,
          letzterFehler,
          naechsteVorgangsNummer: vorgangsNummer + 1
        });
      }
    });
  }

  function installiereStil(dokument) {
    if (dokument.getElementById(STIL_ID)) return;
    const stil = dokument.createElement('style');
    stil.id = STIL_ID;
    stil.textContent = `
      .v4hud-bedienung-status{padding:6px 8px;border-top:1px solid rgba(255,255,255,.05);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;overflow-wrap:anywhere}
      .v4hud-bedienung-aktionen{display:flex;flex-wrap:wrap;gap:6px;padding:7px 8px;border-top:1px solid rgba(255,255,255,.05)}
      .v4hud-bedienung-aktionen button,.v4hud-bedienung-bestaetigung button{border:1px solid rgba(255,255,255,.14);border-radius:6px;background:rgba(255,255,255,.07);color:inherit;padding:5px 8px;cursor:pointer}
      .v4hud-bedienung-aktionen button:disabled,.v4hud-bedienung-bestaetigung button:disabled{opacity:.4;cursor:not-allowed}
      .v4hud-bedienung-bestaetigung{display:none;padding:8px;border-top:1px solid rgba(255,184,60,.20);background:rgba(255,184,60,.08)}
      .v4hud-bedienung-bestaetigung.sichtbar{display:block}.v4hud-bedienung-bestaetigung p{margin:0 0 7px}
      .v4hud-bedienung-fehler{display:none;padding:7px 8px;border-top:1px solid rgba(255,82,82,.18);color:#ffb1b1;background:rgba(255,82,82,.08)}
      .v4hud-bedienung-fehler.sichtbar{display:block}
    `;
    dokument.head.appendChild(stil);
  }

  function montiere(optionen = {}) {
    const dokument = holeDokument();
    installiereStil(dokument);

    const hudWurzel = dokument.getElementById(HUD_ELEMENT_ID);
    if (!hudWurzel) {
      throw new Error('Das V4-Ingame-HUD muss vor der sicheren HUD-Bedienung erstellt werden.');
    }
    const hudInhalt = hudWurzel.querySelector('.v4hud-inhalt');
    if (!hudInhalt) {
      throw new Error('Das V4-Ingame-HUD besitzt keinen erwarteten Inhaltsbereich.');
    }

    const bestehend = dokument.getElementById(BEDIEN_ELEMENT_ID);
    if (bestehend) bestehend.remove();

    let letzterUiFehler = null;
    let controller;

    function aktualisiereReadOnlyHud() {
      if (
        optionen.hud &&
        typeof optionen.hud.aktualisiere === 'function' &&
        typeof optionen.statusLieferant === 'function'
      ) {
        optionen.hud.aktualisiere(optionen.statusLieferant());
      }
    }

    controller = erstelleController({
      runtime: optionen.runtime,
      vorgangPrefix: optionen.vorgangPrefix,
      beiErgebnis(ergebnis, basisStatus) {
        aktualisiereReadOnlyHud();
        if (typeof optionen.beiErgebnis === 'function') {
          optionen.beiErgebnis(ergebnis, basisStatus);
        }
      }
    });

    const box = dokument.createElement('section');
    box.id = BEDIEN_ELEMENT_ID;
    box.className = 'v4hud-abschnitt v4hud-bedienung';

    const titel = dokument.createElement('h4');
    titel.textContent = 'Sichere Bedienung';
    const statusElement = dokument.createElement('div');
    statusElement.className = 'v4hud-bedienung-status';
    const fehlerElement = dokument.createElement('div');
    fehlerElement.className = 'v4hud-bedienung-fehler';

    const aktionen = dokument.createElement('div');
    aktionen.className = 'v4hud-bedienung-aktionen';

    const diagnoseKnopf = dokument.createElement('button');
    diagnoseKnopf.type = 'button';
    diagnoseKnopf.textContent = 'Diagnose aktualisieren';

    const pauseKnopf = dokument.createElement('button');
    pauseKnopf.type = 'button';
    pauseKnopf.textContent = 'Pause anfordern';

    const fortsetzenKnopf = dokument.createElement('button');
    fortsetzenKnopf.type = 'button';
    fortsetzenKnopf.textContent = 'Fortsetzen';

    aktionen.appendChild(diagnoseKnopf);
    aktionen.appendChild(pauseKnopf);
    aktionen.appendChild(fortsetzenKnopf);

    const bestaetigung = dokument.createElement('div');
    bestaetigung.className = 'v4hud-bedienung-bestaetigung';
    const bestaetigungsText = dokument.createElement('p');
    bestaetigungsText.textContent =
      'Fortsetzen gibt neue normale und Hintergrundarbeit wieder frei. Alte abgebrochene Arbeit bleibt beendet.';
    const bestaetigungsAktionen = dokument.createElement('div');
    bestaetigungsAktionen.className = 'v4hud-bedienung-aktionen';

    const bestaetigenKnopf = dokument.createElement('button');
    bestaetigenKnopf.type = 'button';
    bestaetigenKnopf.textContent = 'Fortsetzen bestaetigen';

    const abbrechenKnopf = dokument.createElement('button');
    abbrechenKnopf.type = 'button';
    abbrechenKnopf.textContent = 'Abbrechen';

    bestaetigungsAktionen.appendChild(bestaetigenKnopf);
    bestaetigungsAktionen.appendChild(abbrechenKnopf);
    bestaetigung.appendChild(bestaetigungsText);
    bestaetigung.appendChild(bestaetigungsAktionen);

    box.appendChild(titel);
    box.appendChild(statusElement);
    box.appendChild(fehlerElement);
    box.appendChild(aktionen);
    box.appendChild(bestaetigung);
    hudInhalt.appendChild(box);

    function setzeAlleKnopfeGesperrt(gesperrt) {
      for (const knopf of [
        diagnoseKnopf,
        pauseKnopf,
        fortsetzenKnopf,
        bestaetigenKnopf,
        abbrechenKnopf
      ]) {
        knopf.disabled = gesperrt;
      }
    }

    function render() {
      const zustand = controller.status();
      const laufzeit = zustand.basisStatus.laufzeit;
      statusElement.textContent =
        `Laufzeit: ${String(laufzeit.zustand).toUpperCase()} · Generation ${laufzeit.generation}`;

      const gesperrt = zustand.beschaeftigt === true;
      diagnoseKnopf.disabled = gesperrt;
      pauseKnopf.disabled = gesperrt || laufzeit.zustand !== 'laeuft';
      fortsetzenKnopf.disabled = gesperrt || laufzeit.zustand !== 'pausiert';
      bestaetigenKnopf.disabled = gesperrt;
      abbrechenKnopf.disabled = gesperrt;

      bestaetigung.classList.toggle('sichtbar', zustand.fortsetzenBestaetigungOffen === true);

      const fehler = letzterUiFehler ?? zustand.letzterFehler;
      fehlerElement.textContent = fehler ? `Bedienung blockiert: ${fehler}` : '';
      fehlerElement.classList.toggle('sichtbar', Boolean(fehler));
    }

    function fuehreUiAktion(aktion) {
      letzterUiFehler = null;
      setzeAlleKnopfeGesperrt(true);
      try {
        const ergebnis = aktion();
        render();
        return ergebnis;
      } catch (fehler) {
        letzterUiFehler = fehlerText(fehler);
        render();
        return null;
      }
    }

    diagnoseKnopf.addEventListener('click', () => {
      fuehreUiAktion(() => controller.diagnoseAktualisieren());
    });
    pauseKnopf.addEventListener('click', () => {
      fuehreUiAktion(() => controller.pauseAnfordern());
    });
    fortsetzenKnopf.addEventListener('click', () => {
      fuehreUiAktion(() => controller.fortsetzenAnfordern());
    });
    bestaetigenKnopf.addEventListener('click', () => {
      fuehreUiAktion(() => controller.fortsetzenBestaetigen());
    });
    abbrechenKnopf.addEventListener('click', () => {
      letzterUiFehler = null;
      controller.fortsetzenAbbrechen();
      render();
    });

    render();

    return Object.freeze({
      version: VERSION,
      controller,
      synchronisiere() {
        letzterUiFehler = null;
        const status = controller.synchronisiere();
        render();
        return status;
      },
      status() {
        return Object.freeze({
          controller: controller.status(),
          letzterUiFehler,
          montiert: box.isConnected !== false
        });
      },
      entfernen() {
        box.remove();
        return true;
      }
    });
  }

  const api = Object.freeze({
    version: VERSION,
    pruefeRuntime,
    erstelleController,
    montiere
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
