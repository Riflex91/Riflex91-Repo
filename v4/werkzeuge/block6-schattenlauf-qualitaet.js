(() => {
  'use strict';

  const API_NAME = 'V4Block6SchattenQualitaet';
  const VERSION = '1.1.0';
  const STANDARD_DAUER = 30 * 60 * 1000;
  const STANDARD_INTERVALL = 1000;
  const STANDARD_ZWISCHENBERICHT = 5 * 60 * 1000;
  const STANDARD_MINDEST_ABDECKUNG_PROZENT = 95;
  const STANDARD_MAX_TICK_LUECKE_FAKTOR = 5;
  const MIN_MONITOR_INTERVAL = 250;
  const MAX_MONITOR_INTERVAL = 1000;

  let lauf = null;
  let letzterBericht = null;

  function holeElternFenster() {
    try {
      if (typeof parent !== 'undefined' && parent && parent !== globalThis) return parent;
    } catch {
      // Fallback auf aktuellen Kontext.
    }
    return null;
  }

  function holeSchattenApi() {
    const api = globalThis.V4Block6SchattenRanger ?? holeElternFenster()?.V4Block6SchattenRanger;
    if (!api || typeof api.starte !== 'function' || typeof api.status !== 'function' || typeof api.ergebnis !== 'function' || typeof api.stoppe !== 'function') {
      throw new Error('Zuerst v4/werkzeuge/block6-schattenlauf-ranger.js laden.');
    }
    return api;
  }

  function holeKonsole() {
    const api = globalThis.V4Testkonsole ?? holeElternFenster()?.V4Testkonsole;
    if (!api?.ausgeben) throw new Error('Zuerst v4/werkzeuge/adventure-land-testkonsole.js laden.');
    return api;
  }

  function aktivierePerformanceTrick() {
    const eltern = holeElternFenster();
    const funktion = typeof eltern?.performance_trick === 'function'
      ? eltern.performance_trick
      : globalThis.performance_trick;
    const kontext = typeof eltern?.performance_trick === 'function' ? eltern : globalThis;

    if (typeof funktion !== 'function') {
      throw new Error('Adventure-Land-Funktion performance_trick() ist nicht verfuegbar. Der ueberwachte Schattenlauf wird nicht gestartet.');
    }

    try {
      Reflect.apply(funktion, kontext, []);
    } catch (fehler) {
      const meldung = fehler instanceof Error ? fehler.message : String(fehler);
      throw new Error(`performance_trick() konnte nicht aktiviert werden: ${meldung}`);
    }

    return Object.freeze({ verfuegbar: true, aktiviert: true, aktiviertAm: Date.now() });
  }

  function positiveZahl(name, wert, standard) {
    const ergebnis = wert ?? standard;
    if (!Number.isFinite(ergebnis) || ergebnis <= 0) throw new Error(`${name} muss eine positive endliche Zahl sein.`);
    return ergebnis;
  }

  function anteilProzent(name, wert, standard) {
    const ergebnis = wert ?? standard;
    if (!Number.isFinite(ergebnis) || ergebnis <= 0 || ergebnis > 100) throw new Error(`${name} muss groesser 0 und hoechstens 100 sein.`);
    return ergebnis;
  }

  function runde(wert, stellen = 3) {
    const faktor = 10 ** stellen;
    return Math.round(wert * faktor) / faktor;
  }

  function formatDauer(millisekunden) {
    const gesamtSekunden = Math.max(0, Math.round(millisekunden / 1000));
    const stunden = Math.floor(gesamtSekunden / 3600);
    const minuten = Math.floor((gesamtSekunden % 3600) / 60);
    const sekunden = gesamtSekunden % 60;
    const teile = [];
    if (stunden > 0) teile.push(`${stunden}h`);
    if (minuten > 0 || stunden > 0) teile.push(`${minuten}m`);
    teile.push(`${sekunden}s`);
    return teile.join(' ');
  }

  function erwarteteSchritte(dauerMillisekunden, intervallMillisekunden) {
    if (!Number.isFinite(dauerMillisekunden) || dauerMillisekunden < 0) return null;
    if (!Number.isFinite(intervallMillisekunden) || intervallMillisekunden <= 0) return null;
    return Math.floor(dauerMillisekunden / intervallMillisekunden) + 1;
  }

  function pruefeSchrittstand(zeitpunkt) {
    if (!lauf) return;
    const status = holeSchattenApi().status();
    const schritte = Number.isFinite(status?.anzahlSchritte) ? status.anzahlSchritte : lauf.letzteSchrittZahl;

    if (schritte > lauf.letzteSchrittZahl) {
      const luecke = Math.max(0, zeitpunkt - lauf.letzterSchrittBeobachtetAm);
      lauf.maximaleTickLueckeMillisekunden = Math.max(lauf.maximaleTickLueckeMillisekunden, luecke);
      if (luecke > lauf.erlaubteMaximaleTickLueckeMillisekunden) lauf.langeTickLuecken += 1;
      if (schritte > lauf.letzteSchrittZahl + 1) lauf.nichtEinzelnBeobachteteSchritte += schritte - lauf.letzteSchrittZahl - 1;
      lauf.letzteSchrittZahl = schritte;
      lauf.letzterSchrittBeobachtetAm = zeitpunkt;
    }

    if (status?.laeuft === false) finalisiereAusQuelle(zeitpunkt);
  }

  function samplingQualitaet(rohbericht, zeitpunkt) {
    const gestartetAm = Number.isFinite(rohbericht?.gestartetAm) ? rohbericht.gestartetAm : lauf?.gestartetAm ?? null;
    const vorgesehen = Number.isFinite(rohbericht?.vorgesehenMillisekunden) ? rohbericht.vorgesehenMillisekunden : lauf?.dauerMillisekunden ?? null;
    const intervall = Number.isFinite(rohbericht?.konfiguration?.intervallMillisekunden) ? rohbericht.konfiguration.intervallMillisekunden : lauf?.intervallMillisekunden ?? null;
    const tatsaechlicheDauer = Number.isFinite(rohbericht?.dauerMillisekunden)
      ? rohbericht.dauerMillisekunden
      : (gestartetAm !== null ? Math.max(0, zeitpunkt - gestartetAm) : null);
    const fuerErwartung = rohbericht?.status === 'abgeschlossen' && vorgesehen !== null
      ? vorgesehen
      : (tatsaechlicheDauer !== null && vorgesehen !== null ? Math.min(tatsaechlicheDauer, vorgesehen) : tatsaechlicheDauer);
    const erwartet = fuerErwartung !== null && intervall !== null ? erwarteteSchritte(fuerErwartung, intervall) : null;
    const tatsaechlich = Number.isFinite(rohbericht?.anzahlSchritte) ? rohbericht.anzahlSchritte : lauf?.letzteSchrittZahl ?? null;
    const abdeckung = erwartet && tatsaechlich !== null ? Math.min(100, (tatsaechlich / erwartet) * 100) : null;
    const verpasst = erwartet !== null && tatsaechlich !== null ? Math.max(0, erwartet - tatsaechlich) : null;

    let maxLuecke = lauf?.maximaleTickLueckeMillisekunden ?? 0;
    const letzterSchritt = lauf?.letzterSchrittBeobachtetAm ?? null;
    if (letzterSchritt !== null && rohbericht?.status !== 'laeuft') maxLuecke = Math.max(maxLuecke, Math.max(0, zeitpunkt - letzterSchritt));

    const mindestAbdeckung = lauf?.mindestAbdeckungProzent ?? STANDARD_MINDEST_ABDECKUNG_PROZENT;
    const erlaubteLuecke = lauf?.erlaubteMaximaleTickLueckeMillisekunden
      ?? (Number.isFinite(intervall) ? intervall * STANDARD_MAX_TICK_LUECKE_FAKTOR : null);
    const abdeckungOkay = abdeckung !== null && abdeckung >= mindestAbdeckung;
    const lueckeOkay = erlaubteLuecke !== null && maxLuecke <= erlaubteLuecke;
    const abgeschlossen = rohbericht?.status === 'abgeschlossen';

    return Object.freeze({
      status: abgeschlossen ? (abdeckungOkay && lueckeOkay ? 'ausreichend' : 'unzureichend') : 'laufend',
      erwarteteSchritte: erwartet,
      tatsaechlicheSchritte: tatsaechlich,
      abdeckungProzent: abdeckung === null ? null : runde(abdeckung),
      mindestAbdeckungProzent: mindestAbdeckung,
      verpassteIntervalle: verpasst,
      maximaleTickLueckeMillisekunden: maxLuecke,
      erlaubteMaximaleTickLueckeMillisekunden: erlaubteLuecke,
      langeTickLuecken: lauf?.langeTickLuecken ?? 0,
      nichtEinzelnBeobachteteSchritte: lauf?.nichtEinzelnBeobachteteSchritte ?? 0,
      monitorIntervallMillisekunden: lauf?.monitorIntervallMillisekunden ?? null,
      browserSamplingAusreichend: abgeschlossen ? abdeckungOkay && lueckeOkay : null
    });
  }

  function kompakterBericht(rohbericht, zeitpunkt = Date.now()) {
    if (!rohbericht) return null;
    const qualitaet = samplingQualitaet(rohbericht, zeitpunkt);
    let status = rohbericht.status;
    let grund = rohbericht.grund;

    if (rohbericht.status === 'abgeschlossen') {
      if (qualitaet.browserSamplingAusreichend) {
        status = 'abgeschlossen';
        grund = `Die konfigurierte Schattenlaufzeit von ${formatDauer(rohbericht.vorgesehenMillisekunden)} ist mit ausreichender Sampling-Qualitaet abgelaufen.`;
      } else {
        status = 'unvollstaendig';
        grund = `Sampling unzureichend: ${qualitaet.abdeckungProzent ?? 'unbekannt'} % Abdeckung, maximale Tick-Luecke ${qualitaet.maximaleTickLueckeMillisekunden} ms.`;
      }
    }

    return Object.freeze({
      schemaVersion: 2,
      werkzeug: API_NAME,
      version: VERSION,
      status,
      grund,
      quellStatus: rohbericht.status,
      quellGrund: rohbericht.grund,
      modus: 'schatten_mit_samplingqualitaet',
      charakterKlasse: rohbericht.charakterKlasse ?? null,
      gestartetAm: rohbericht.gestartetAm ?? null,
      beendetAm: rohbericht.beendetAm ?? zeitpunkt,
      dauerMillisekunden: rohbericht.dauerMillisekunden ?? null,
      vorgesehenMillisekunden: rohbericht.vorgesehenMillisekunden ?? null,
      konfiguration: rohbericht.konfiguration ?? null,
      anzahlSchritte: rohbericht.anzahlSchritte ?? null,
      aktionsZaehler: Object.freeze({ ...(rohbericht.aktionsZaehler ?? {}) }),
      meldungsZaehler: Object.freeze({ ...(rohbericht.meldungsZaehler ?? {}) }),
      stillstaende: rohbericht.stillstaende ?? null,
      fehler: Object.freeze([...(rohbericht.fehler ?? [])]),
      verloreneEreignisse: rohbericht.verloreneEreignisse ?? null,
      start: rohbericht.start ?? null,
      ende: rohbericht.ende ?? null,
      delta: rohbericht.delta ?? null,
      performanceTrick: lauf?.performanceTrick ?? letzterBericht?.performanceTrick ?? null,
      samplingQualitaet: qualitaet,
      sicherheit: rohbericht.sicherheit ?? null
    });
  }

  function finalisiereAusQuelle(zeitpunkt = Date.now()) {
    if (!lauf) return letzterBericht;
    const schatten = holeSchattenApi();
    if (schatten.status()?.laeuft) return null;
    clearInterval(lauf.monitorKennung);
    letzterBericht = kompakterBericht(schatten.ergebnis(), zeitpunkt);
    lauf = null;
    holeKonsole().ausgeben(letzterBericht, `Block 6 Schatten · Sampling ${letzterBericht?.status ?? 'unbekannt'}`);
    return letzterBericht;
  }

  function monitor() {
    if (!lauf) return;
    const jetzt = Date.now();
    try {
      pruefeSchrittstand(jetzt);
    } catch (fehler) {
      lauf.monitorFehler.push({ zeitpunkt: jetzt, meldung: fehler instanceof Error ? fehler.message : String(fehler) });
    }
  }

  function starte(monsterArten, optionen = {}) {
    if (lauf) throw new Error('Es laeuft bereits ein ueberwachter Block-6-Schattenlauf.');
    const schatten = holeSchattenApi();
    if (schatten.status()?.laeuft) throw new Error('Vor dem ueberwachten Lauf darf kein anderer Block-6-Schattenlauf laufen.');

    const dauerMillisekunden = positiveZahl('dauerMillisekunden', optionen.dauerMillisekunden, STANDARD_DAUER);
    const intervallMillisekunden = positiveZahl('intervallMillisekunden', optionen.intervallMillisekunden, STANDARD_INTERVALL);
    const zwischenberichtMillisekunden = positiveZahl('zwischenberichtMillisekunden', optionen.zwischenberichtMillisekunden, STANDARD_ZWISCHENBERICHT);
    const mindestAbdeckungProzent = anteilProzent('mindestAbdeckungProzent', optionen.mindestAbdeckungProzent, STANDARD_MINDEST_ABDECKUNG_PROZENT);
    const maxTickLueckeFaktor = positiveZahl('maxTickLueckeFaktor', optionen.maxTickLueckeFaktor, STANDARD_MAX_TICK_LUECKE_FAKTOR);
    const monitorIntervallMillisekunden = Math.min(MAX_MONITOR_INTERVAL, Math.max(MIN_MONITOR_INTERVAL, intervallMillisekunden / 2));

    const performanceTrick = aktivierePerformanceTrick();
    const schattenOptionen = { ...optionen, dauerMillisekunden, intervallMillisekunden, zwischenberichtMillisekunden };
    delete schattenOptionen.mindestAbdeckungProzent;
    delete schattenOptionen.maxTickLueckeFaktor;

    const startStatus = schatten.starte(monsterArten, schattenOptionen);
    const gestartetAm = Number.isFinite(startStatus?.gestartetAm) ? startStatus.gestartetAm : Date.now();
    const startSchritte = Number.isFinite(startStatus?.anzahlSchritte) ? startStatus.anzahlSchritte : 0;

    lauf = {
      gestartetAm,
      dauerMillisekunden,
      intervallMillisekunden,
      mindestAbdeckungProzent,
      erlaubteMaximaleTickLueckeMillisekunden: intervallMillisekunden * maxTickLueckeFaktor,
      monitorIntervallMillisekunden,
      letzteSchrittZahl: startSchritte,
      letzterSchrittBeobachtetAm: gestartetAm,
      maximaleTickLueckeMillisekunden: 0,
      langeTickLuecken: 0,
      nichtEinzelnBeobachteteSchritte: 0,
      monitorFehler: [],
      monitorKennung: null,
      performanceTrick
    };
    letzterBericht = null;
    lauf.monitorKennung = setInterval(monitor, monitorIntervallMillisekunden);

    holeKonsole().ausgeben({
      modus: 'schatten_mit_samplingqualitaet',
      dauerMillisekunden,
      intervallMillisekunden,
      erwarteteSchritte: erwarteteSchritte(dauerMillisekunden, intervallMillisekunden),
      mindestAbdeckungProzent,
      erlaubteMaximaleTickLueckeMillisekunden: lauf.erlaubteMaximaleTickLueckeMillisekunden,
      performanceTrick,
      sicherheit: 'Read-only; performance_trick() verhindert Browser-Drosselung, fuehrt aber keine Spielaktion aus.'
    }, 'Block 6 Schatten mit Sampling-Qualitaet gestartet');

    return status();
  }

  function status() {
    if (!lauf) return Object.freeze({ laeuft: false, letzterBerichtVorhanden: letzterBericht !== null });
    monitor();
    if (!lauf) return Object.freeze({ laeuft: false, letzterBerichtVorhanden: letzterBericht !== null });
    const rohStatus = holeSchattenApi().status();
    const kompakt = kompakterBericht(holeSchattenApi().ergebnis(), Date.now());
    return Object.freeze({
      laeuft: rohStatus?.laeuft === true,
      status: kompakt?.status ?? 'laufend',
      gestartetAm: lauf.gestartetAm,
      restMillisekunden: rohStatus?.restMillisekunden ?? null,
      anzahlSchritte: rohStatus?.anzahlSchritte ?? null,
      performanceTrick: lauf.performanceTrick,
      samplingQualitaet: kompakt?.samplingQualitaet ?? null
    });
  }

  function ergebnis() {
    if (lauf) {
      const schatten = holeSchattenApi();
      if (schatten.status()?.laeuft === false) return finalisiereAusQuelle(Date.now());
      return kompakterBericht(schatten.ergebnis(), Date.now());
    }
    return letzterBericht;
  }

  function stoppe(grund = 'Manuell gestoppt.') {
    if (!lauf) return letzterBericht;
    if (typeof grund !== 'string' || grund.trim().length === 0) throw new Error('Ein manueller Stopp benoetigt einen Grund.');
    const schatten = holeSchattenApi();
    if (schatten.status()?.laeuft) schatten.stoppe(grund.trim());
    return finalisiereAusQuelle(Date.now());
  }

  const api = Object.freeze({ version: VERSION, starte, status, ergebnis, kompaktErgebnis: ergebnis, stoppe });

  globalThis[API_NAME] = api;
  try {
    const elternFenster = holeElternFenster();
    if (elternFenster) elternFenster[API_NAME] = api;
  } catch {
    // Lokale API bleibt verfuegbar.
  }

  holeKonsole().ausgeben({
    version: VERSION,
    start30Minuten: 'V4Block6SchattenQualitaet.starte(["goo"])',
    status: 'V4Block6SchattenQualitaet.status()',
    ergebnis: 'V4Block6SchattenQualitaet.kompaktErgebnis()',
    stop: 'V4Block6SchattenQualitaet.stoppe("Grund")',
    performanceTrick: 'performance_trick() wird vor jedem Lauf verpflichtend aktiviert.',
    hinweis: 'Ein abgeschlossener Quelllauf wird bei unzureichender Sampling-Abdeckung oder zu grosser Tick-Luecke als unvollstaendig markiert.'
  }, 'Block-6-Schattenlauf-Samplingqualitaet bereit');
})();
