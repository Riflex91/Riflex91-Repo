(() => {
  'use strict';

  const API_NAME = 'V4Block8Lebensnachweis';
  const VERSION = '1.1.0';
  const PROTOKOLL = 'v4-gruppen-lebensnachweis-v1';
  const SICHERHEITS_QUELL_NAME = 'V4Block7KampfsicherheitsQuelle';
  const STANDARD_INTERVALL_MS = 1000;
  const MIN_INTERVALL_MS = 500;
  const MAX_INTERVALL_MS = 10000;
  const STANDARD_SICHERHEITS_MAX_ALTER_MS = 1500;
  const GEFAHREN_STUFEN = new Set(['unbekannt', 'sicher', 'angespannt', 'gefaehrlich', 'kritisch']);
  const FAEHIGKEITEN = ['heilen', 'schaden', 'aggro', 'schutz', 'unterstuetzung'];

  let konfiguration = null;
  let timer = null;
  let vorherigerOnCm = null;
  let eigenerOnCm = null;
  let laufendeNummer = 0;
  let gesendet = 0;
  let empfangen = 0;
  let verworfen = 0;
  let letzteSicherheit = null;
  const letzteMeldungen = new Map();

  function holeElternFenster() {
    try {
      if (typeof parent !== 'undefined' && parent && parent !== globalThis) return parent;
    } catch {
      // Kein nutzbarer Parent-Kontext.
    }
    return null;
  }

  function holeEmpfangsFenster() {
    return globalThis;
  }

  function holeSpielWert(name) {
    try {
      if (name in globalThis) return globalThis[name];
    } catch {
      // Fallback auf Parent-Kontext.
    }
    const eltern = holeElternFenster();
    try {
      if (eltern && name in eltern) return eltern[name];
    } catch {
      // Nicht vorhanden.
    }
    return undefined;
  }

  function holeSpielFunktion(name) {
    try {
      if (typeof globalThis[name] === 'function') return { funktion: globalThis[name], kontext: globalThis, quelle: 'lokal' };
    } catch {
      // Fallback auf Parent-Kontext.
    }
    const eltern = holeElternFenster();
    try {
      if (eltern && typeof eltern[name] === 'function') return { funktion: eltern[name], kontext: eltern, quelle: 'parent' };
    } catch {
      // Nicht vorhanden.
    }
    return null;
  }

  function holeSicherheitsQuelle() {
    try {
      const lokal = globalThis[SICHERHEITS_QUELL_NAME];
      if (lokal && typeof lokal.bewerte === 'function') return { api: lokal, quelle: 'lokal' };
    } catch {
      // Fallback auf Parent-Kontext.
    }
    const eltern = holeElternFenster();
    try {
      const imParent = eltern?.[SICHERHEITS_QUELL_NAME];
      if (imParent && typeof imParent.bewerte === 'function') return { api: imParent, quelle: 'parent' };
    } catch {
      // Nicht vorhanden.
    }
    return null;
  }

  function ausgeben(wert, titel) {
    try {
      const konsole = globalThis.V4Testkonsole ?? holeElternFenster()?.V4Testkonsole;
      if (konsole?.ausgeben) konsole.ausgeben(wert, titel);
      else console.log(titel, wert);
    } catch {
      // Diagnose darf den Test nicht beeinflussen.
    }
  }

  function name(wert) {
    if (typeof wert !== 'string') return null;
    const sauber = wert.trim();
    return sauber.length > 0 ? sauber : null;
  }

  function endlicheZahl(wert) {
    return typeof wert === 'number' && Number.isFinite(wert) ? wert : null;
  }

  function anteil(wert, maximal) {
    const a = endlicheZahl(wert);
    const b = endlicheZahl(maximal);
    if (a === null || b === null || b <= 0) return null;
    return Math.max(0, Math.min(1, a / b));
  }

  function normalisiereFaehigkeiten(roh) {
    if (!roh || typeof roh !== 'object') throw new Error('faehigkeiten muessen als Objekt angegeben werden.');
    const ergebnis = {};
    for (const faehigkeit of FAEHIGKEITEN) {
      const wert = Number(roh[faehigkeit]);
      if (!Number.isFinite(wert) || wert < 0 || wert > 1) throw new Error(`${faehigkeit} muss zwischen 0 und 1 liegen.`);
      ergebnis[faehigkeit] = wert;
    }
    return Object.freeze(ergebnis);
  }

  function normalisiereKonfiguration(roh = {}) {
    if (Object.prototype.hasOwnProperty.call(roh, 'gefahrenStufe')) {
      throw new Error('gefahrenStufe darf nicht mehr manuell konfiguriert werden; Block 8 verwendet V4Block7KampfsicherheitsQuelle.');
    }
    const vertrauensNamen = [...new Set((Array.isArray(roh.vertrauensNamen) ? roh.vertrauensNamen : []).map(name).filter(Boolean))].sort();
    if (vertrauensNamen.length < 2) throw new Error('Mindestens zwei vertrauensNamen sind fuer den Mehrcharakter-Nachweis erforderlich.');
    const intervallMillisekunden = Number(roh.intervallMillisekunden ?? STANDARD_INTERVALL_MS);
    if (!Number.isFinite(intervallMillisekunden) || intervallMillisekunden < MIN_INTERVALL_MS || intervallMillisekunden > MAX_INTERVALL_MS) {
      throw new Error(`intervallMillisekunden muss zwischen ${MIN_INTERVALL_MS} und ${MAX_INTERVALL_MS} liegen.`);
    }
    const sicherheitsMaximalAlterMillisekunden = Number(
      roh.sicherheitsMaximalAlterMillisekunden ?? STANDARD_SICHERHEITS_MAX_ALTER_MS
    );
    if (!Number.isFinite(sicherheitsMaximalAlterMillisekunden) || sicherheitsMaximalAlterMillisekunden <= 0 || sicherheitsMaximalAlterMillisekunden > MAX_INTERVALL_MS) {
      throw new Error(`sicherheitsMaximalAlterMillisekunden muss groesser als 0 und hoechstens ${MAX_INTERVALL_MS} sein.`);
    }
    return Object.freeze({
      vertrauensNamen: Object.freeze(vertrauensNamen),
      faehigkeiten: normalisiereFaehigkeiten(roh.faehigkeiten),
      intervallMillisekunden,
      sicherheitsMaximalAlterMillisekunden
    });
  }

  function lokalerCharakter() {
    const c = holeSpielWert('character');
    return c && typeof c === 'object' ? c : null;
  }

  function leseSicherheitsBewertung() {
    if (!konfiguration) throw new Error('Werkzeug ist nicht konfiguriert.');
    const quelle = holeSicherheitsQuelle();
    if (!quelle) throw new Error(`${SICHERHEITS_QUELL_NAME} muss vor dem Lebensnachweis geladen werden.`);

    const ergebnis = quelle.api.bewerte();
    const jetzt = Date.now();
    const ausgewertetAm = endlicheZahl(ergebnis?.ausgewertetAm);
    const gefahrenStufe = ergebnis?.gefahrenBewertung?.stufe;
    if (ergebnis?.schemaVersion !== 1 || ergebnis?.werkzeug !== SICHERHEITS_QUELL_NAME) {
      throw new Error('Block-7-Sicherheitsquelle lieferte ein unbekanntes Ergebnisformat.');
    }
    if (ausgewertetAm === null || ausgewertetAm > jetzt) {
      throw new Error('Block-7-Sicherheitsbewertung hat einen ungueltigen Zeitpunkt.');
    }
    const alterMillisekunden = jetzt - ausgewertetAm;
    if (alterMillisekunden > konfiguration.sicherheitsMaximalAlterMillisekunden) {
      throw new Error(`Block-7-Sicherheitsbewertung ist mit ${alterMillisekunden} ms zu alt.`);
    }
    if (!GEFAHREN_STUFEN.has(gefahrenStufe)) {
      throw new Error('Block-7-Sicherheitsquelle lieferte keine gueltige Gefahrenstufe.');
    }

    letzteSicherheit = Object.freeze({
      quelle: SICHERHEITS_QUELL_NAME,
      kontext: quelle.quelle,
      version: String(ergebnis.version ?? ''),
      quellBlobSha: String(ergebnis.quellBlobSha ?? ''),
      ausgewertetAm,
      alterMillisekunden,
      gefahrenStufe,
      gruende: Object.freeze(Array.isArray(ergebnis.gefahrenBewertung.gruende) ? [...ergebnis.gefahrenBewertung.gruende] : [])
    });
    return letzteSicherheit;
  }

  function baueMeldung() {
    if (!konfiguration) throw new Error('Werkzeug ist nicht konfiguriert.');
    const sicherheit = leseSicherheitsBewertung();
    const c = lokalerCharakter();
    const serverRegion = name(holeSpielWert('server_region'));
    const serverKennung = name(holeSpielWert('server_identifier'));
    const charakterName = name(c?.name);
    const charakterKennung = c?.id === null || c?.id === undefined ? null : name(String(c.id));
    const klasse = name(c?.ctype);
    const karte = name(c?.map);
    const instanz = name(c?.in);

    const fehlt = [];
    if (!charakterName) fehlt.push('character.name');
    if (!charakterKennung) fehlt.push('character.id');
    if (!klasse) fehlt.push('character.ctype');
    if (!karte) fehlt.push('character.map');
    if (!instanz) fehlt.push('character.in');
    if (!serverRegion) fehlt.push('server_region');
    if (!serverKennung) fehlt.push('server_identifier');
    if (fehlt.length) throw new Error(`Lebensnachweis blockiert; Pflichtfelder fehlen: ${fehlt.join(', ')}`);
    if (!konfiguration.vertrauensNamen.includes(charakterName)) throw new Error('Lokaler Charakter steht nicht in vertrauensNamen.');

    laufendeNummer += 1;
    return Object.freeze({
      schemaVersion: 1,
      charakterKennung,
      charakterName,
      klasse,
      serverRegion,
      serverKennung,
      karte,
      instanz,
      lebendig: typeof c.rip === 'boolean' ? !c.rip : null,
      lebensAnteil: anteil(c.hp, c.max_hp),
      manaAnteil: anteil(c.mp, c.max_mp),
      zielKennung: c.target === null || c.target === undefined ? null : String(c.target),
      gefahrenStufe: sicherheit.gefahrenStufe,
      faehigkeiten: konfiguration.faehigkeiten,
      gesendetAm: Date.now(),
      laufendeNummer
    });
  }

  function istUmschlag(daten) {
    return Boolean(
      daten && typeof daten === 'object' &&
      daten.schemaVersion === 1 &&
      daten.protokoll === PROTOKOLL &&
      name(daten.absenderName) &&
      daten.meldung && typeof daten.meldung === 'object' &&
      daten.meldung.schemaVersion === 1
    );
  }

  function installiereEmpfang() {
    if (eigenerOnCm) return;
    const empfangsFenster = holeEmpfangsFenster();
    vorherigerOnCm = typeof empfangsFenster.on_cm === 'function' ? empfangsFenster.on_cm : null;
    eigenerOnCm = function block8LebensnachweisOnCm(absenderRoh, daten) {
      if (!istUmschlag(daten)) {
        return vorherigerOnCm ? Reflect.apply(vorherigerOnCm, empfangsFenster, [absenderRoh, daten]) : undefined;
      }
      const absender = name(absenderRoh);
      const umschlagAbsender = name(daten.absenderName);
      const meldungsName = name(daten.meldung.charakterName);
      if (!konfiguration || !absender || !konfiguration.vertrauensNamen.includes(absender) || absender !== umschlagAbsender || absender !== meldungsName) {
        verworfen += 1;
        return false;
      }
      letzteMeldungen.set(absender, Object.freeze({ empfangenAm: Date.now(), meldung: Object.freeze({ ...daten.meldung }) }));
      empfangen += 1;
      return true;
    };
    empfangsFenster.on_cm = eigenerOnCm;
  }

  function entferneEmpfang() {
    if (!eigenerOnCm) return;
    const empfangsFenster = holeEmpfangsFenster();
    if (empfangsFenster.on_cm === eigenerOnCm) empfangsFenster.on_cm = vorherigerOnCm ?? undefined;
    eigenerOnCm = null;
    vorherigerOnCm = null;
  }

  async function sendeEinmal() {
    if (!konfiguration) throw new Error('Werkzeug ist nicht konfiguriert.');
    const sendePfad = holeSpielFunktion('send_cm');
    if (!sendePfad) throw new Error('Adventure Land stellt send_cm weder lokal noch im Parent-Kontext bereit.');
    const meldung = baueMeldung();
    const umschlag = Object.freeze({ schemaVersion: 1, protokoll: PROTOKOLL, absenderName: meldung.charakterName, meldung });
    const ziele = konfiguration.vertrauensNamen.filter((ziel) => ziel !== meldung.charakterName);
    for (const ziel of ziele) {
      await Promise.resolve(Reflect.apply(sendePfad.funktion, sendePfad.kontext, [ziel, umschlag]));
      gesendet += 1;
    }
    return Object.freeze({
      meldung,
      ziele: Object.freeze([...ziele]),
      sendeKontext: sendePfad.quelle,
      sicherheit: letzteSicherheit
    });
  }

  function status() {
    const jetzt = Date.now();
    const sendePfad = holeSpielFunktion('send_cm');
    const sicherheitsQuelle = holeSicherheitsQuelle();
    const teilnehmer = [...letzteMeldungen.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([charakterName, eintrag]) => Object.freeze({
        charakterName,
        empfangenAm: eintrag.empfangenAm,
        alterMillisekunden: Math.max(0, jetzt - eintrag.empfangenAm),
        meldung: eintrag.meldung
      }));
    return Object.freeze({
      schemaVersion: 1,
      werkzeug: API_NAME,
      version: VERSION,
      aktiv: timer !== null,
      konfiguriert: konfiguration !== null,
      lokalerCharakter: name(lokalerCharakter()?.name),
      vertrauensNamen: konfiguration?.vertrauensNamen ?? Object.freeze([]),
      gefahrenStufe: letzteSicherheit?.gefahrenStufe ?? null,
      gefahrenQuelle: SICHERHEITS_QUELL_NAME,
      sicherheitsQuelleVerfuegbar: sicherheitsQuelle !== null,
      sicherheitsQuelleKontext: sicherheitsQuelle?.quelle ?? null,
      sicherheitsMaximalAlterMillisekunden: konfiguration?.sicherheitsMaximalAlterMillisekunden ?? null,
      letzteSicherheit,
      intervallMillisekunden: konfiguration?.intervallMillisekunden ?? null,
      gesendet,
      empfangen,
      verworfen,
      empfangInstalliert: eigenerOnCm !== null,
      empfangsKontext: 'lokaler_codekontext',
      sendeKontext: sendePfad?.quelle ?? null,
      teilnehmer: Object.freeze(teilnehmer),
      echteSpielaktionenAusgefuehrt: false,
      kommunikation: 'send_cm'
    });
  }

  function konfiguriere(roh) {
    if (timer !== null) throw new Error('Laufenden Austausch zuerst stoppen.');
    konfiguration = normalisiereKonfiguration(roh);
    laufendeNummer = 0;
    gesendet = 0;
    empfangen = 0;
    verworfen = 0;
    letzteSicherheit = null;
    letzteMeldungen.clear();
    const ergebnis = status();
    ausgeben(ergebnis, 'Block 8 Lebensnachweis · konfiguriert');
    return ergebnis;
  }

  async function starte() {
    if (!konfiguration) throw new Error('Zuerst V4Block8Lebensnachweis.konfiguriere(...) aufrufen.');
    if (timer !== null) return status();
    installiereEmpfang();
    await sendeEinmal();
    timer = setInterval(() => {
      sendeEinmal().catch((fehler) => ausgeben({ fehler: String(fehler?.message ?? fehler) }, 'Block 8 Lebensnachweis · Sendefehler'));
    }, konfiguration.intervallMillisekunden);
    const ergebnis = status();
    ausgeben(ergebnis, 'Block 8 Lebensnachweis · gestartet');
    return ergebnis;
  }

  function stoppe() {
    if (timer !== null) clearInterval(timer);
    timer = null;
    entferneEmpfang();
    const ergebnis = status();
    ausgeben(ergebnis, 'Block 8 Lebensnachweis · gestoppt');
    return ergebnis;
  }

  const api = Object.freeze({
    version: VERSION,
    konfiguriere,
    starte,
    stoppe,
    sendeEinmal,
    status
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
    gefahrenQuelle: SICHERHEITS_QUELL_NAME,
    hinweis: 'Read-only gegen Spielzustand: Gefahrenstufe kommt ausschliesslich aus der frischen Block-7-Kampfsicherheitsquelle; on_cm bleibt lokal; send_cm darf lokal oder im Parent liegen; keine Spielaktion.',
    beispiel: 'V4Block8Lebensnachweis.konfiguriere({vertrauensNamen:["CharA","CharB"],faehigkeiten:{heilen:0,schaden:1,aggro:0,schutz:0,unterstuetzung:0}})'
  }, 'Block-8-Lebensnachweis-Schattenwerkzeug bereit');
})();
