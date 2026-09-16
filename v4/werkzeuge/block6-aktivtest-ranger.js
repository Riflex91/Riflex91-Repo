(() => {
  'use strict';

  const API_NAME = 'V4Block6AktivRanger';
  const VERSION = '1.0.1';
  const STANDARD_DAUER = 10 * 60 * 1000;
  const MAX_DAUER = 15 * 60 * 1000;
  const PLANUNGS_INTERVAL = 1000;
  const POLL_INTERVAL = 200;
  const ERLAUBTE_MONSTER_ART = 'goo';
  const ERLAUBTE_AKTIONEN = new Set([
    'FARM_BEWEGEN',
    'FARM_ANGREIFEN',
    'FARM_LEBEN_WIEDERHERSTELLEN',
    'FARM_MANA_WIEDERHERSTELLEN',
    'FARM_BEUTE_AUFNEHMEN'
  ]);

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

  function holeSpielFenster() {
    return holeElternFenster() ?? globalThis;
  }

  function holeKonsole() {
    const api = globalThis.V4Testkonsole ?? holeElternFenster()?.V4Testkonsole;
    if (!api?.ausgeben) throw new Error('Zuerst v4/werkzeuge/adventure-land-testkonsole.js laden.');
    return api;
  }

  function holeSchattenApi() {
    const api = globalThis.V4Block6SchattenRanger ?? holeElternFenster()?.V4Block6SchattenRanger;
    if (!api || typeof api.starte !== 'function' || typeof api.status !== 'function' || typeof api.ergebnis !== 'function') {
      throw new Error('Zuerst v4/werkzeuge/block6-schattenlauf-ranger.js laden.');
    }
    return api;
  }

  function istObjekt(wert) {
    return typeof wert === 'object' && wert !== null && !Array.isArray(wert);
  }

  function positiveDauer(wert) {
    const dauer = wert ?? STANDARD_DAUER;
    if (!Number.isFinite(dauer) || dauer <= 0) throw new Error('dauerMillisekunden muss eine positive endliche Zahl sein.');
    if (dauer > MAX_DAUER) throw new Error('Der Block-6-Aktivtest ist auf maximal 15 Minuten begrenzt.');
    return dauer;
  }

  function normalisiereMonsterArten(monsterArten) {
    if (!Array.isArray(monsterArten)) throw new Error('monsterArten muss als Array angegeben werden.');
    const werte = [...new Set(monsterArten.map((wert) => String(wert).trim()).filter(Boolean))].sort();
    if (werte.length !== 1 || werte[0] !== ERLAUBTE_MONSTER_ART) {
      throw new Error('Der erste aktive Block-6-Test ist ausschliesslich fuer monsterArten: ["goo"] freigegeben.');
    }
    return Object.freeze(werte);
  }

  function fehlerDarstellung(fehler) {
    if (fehler instanceof Error) return fehler.message || fehler.name || 'Error';
    if (typeof fehler === 'string') return fehler;
    if (fehler === null) return 'null';
    if (fehler === undefined) return 'undefined';
    if (typeof fehler !== 'object') return String(fehler);
    try {
      const gesehen = new WeakSet();
      const text = JSON.stringify(fehler, (schluessel, wert) => {
        if (typeof wert === 'object' && wert !== null) {
          if (gesehen.has(wert)) return '[zirkulaer]';
          gesehen.add(wert);
        }
        if (typeof wert === 'function') return `[Funktion ${wert.name || 'anonym'}]`;
        return wert;
      });
      if (text && text !== '{}') return text;
    } catch {
      // Fallback unten.
    }
    try {
      const teile = Object.entries(fehler).map(([schluessel, wert]) => `${schluessel}=${String(wert)}`);
      if (teile.length > 0) return `{${teile.join(', ')}}`;
    } catch {
      // Fallback unten.
    }
    return Object.prototype.toString.call(fehler);
  }

  function kompakteFehlerDetails(fehler) {
    if (fehler instanceof Error) {
      return Object.freeze({ typ: fehler.name || 'Error', meldung: fehler.message || String(fehler) });
    }
    if (istObjekt(fehler)) {
      const details = {};
      for (const [schluessel, wert] of Object.entries(fehler).slice(0, 12)) {
        if (wert === null || ['string', 'number', 'boolean'].includes(typeof wert)) details[schluessel] = wert;
        else if (wert !== undefined) details[schluessel] = String(wert);
      }
      return Object.freeze(details);
    }
    return Object.freeze({ wert: String(fehler) });
  }

  function charakterSnapshot() {
    const spiel = holeSpielFenster();
    const charakter = spiel.character ?? globalThis.character;
    if (!istObjekt(charakter)) return null;
    const items = Array.isArray(charakter.items) ? charakter.items : null;
    return {
      name: typeof charakter.name === 'string' ? charakter.name : null,
      klasse: typeof charakter.ctype === 'string' ? charakter.ctype : null,
      stufe: Number.isFinite(charakter.level) ? charakter.level : null,
      leben: Number.isFinite(charakter.hp) ? charakter.hp : null,
      lebenMaximal: Number.isFinite(charakter.max_hp) ? charakter.max_hp : null,
      mana: Number.isFinite(charakter.mp) ? charakter.mp : null,
      manaMaximal: Number.isFinite(charakter.max_mp) ? charakter.max_mp : null,
      erfahrung: Number.isFinite(charakter.xp) ? charakter.xp : null,
      gold: Number.isFinite(charakter.gold) ? charakter.gold : null,
      karte: typeof charakter.map === 'string' ? charakter.map : null,
      position: [
        Number.isFinite(charakter.real_x) ? charakter.real_x : (Number.isFinite(charakter.x) ? charakter.x : null),
        Number.isFinite(charakter.real_y) ? charakter.real_y : (Number.isFinite(charakter.y) ? charakter.y : null)
      ],
      tot: charakter.rip === true,
      freieInventarPlaetze: items ? items.reduce((summe, eintrag) => summe + (eintrag == null ? 1 : 0), 0) : null
    };
  }

  function sichtbareGooAnzahl() {
    const spiel = holeSpielFenster();
    const entities = spiel.entities ?? globalThis.entities;
    if (!istObjekt(entities)) return 0;
    return Object.values(entities).filter((entity) => istObjekt(entity) && entity.type === 'monster' && entity.mtype === 'goo' && entity.dead !== true && (!Number.isFinite(entity.hp) || entity.hp > 0)).length;
  }

  function formatiereRestzeit(restMillisekunden) {
    const gesamtSekunden = Math.max(0, Math.ceil(restMillisekunden / 1000));
    const minuten = Math.floor(gesamtSekunden / 60);
    const sekunden = gesamtSekunden % 60;
    return `${String(minuten).padStart(2, '0')}:${String(sekunden).padStart(2, '0')}`;
  }

  function aktualisiereTitel(text) {
    try {
      const dokument = holeElternFenster()?.document ?? globalThis.document;
      const titel = dokument?.getElementById('v4-adventure-land-testkonsole')?.querySelector('.v4tk-titel');
      if (titel) titel.textContent = text;
    } catch {
      // Rein visuelle Ausgabe darf den Test nicht beeinflussen.
    }
  }

  function zaehle(objekt, schluessel) {
    objekt[schluessel] = (objekt[schluessel] ?? 0) + 1;
  }

  function holeEntity(zielKennung) {
    const spiel = holeSpielFenster();
    const entities = spiel.entities ?? globalThis.entities;
    if (!istObjekt(entities)) return null;
    const direkt = entities[zielKennung];
    if (istObjekt(direkt)) return direkt;
    for (const entity of Object.values(entities)) {
      if (istObjekt(entity) && String(entity.id ?? '') === String(zielKennung)) return entity;
    }
    return null;
  }

  function rufeSpielFunktionAuf(name, argumente = []) {
    const spiel = holeSpielFenster();
    const funktion = spiel[name] ?? globalThis[name];
    if (typeof funktion !== 'function') throw new Error(`Adventure-Land-Funktion ${name} ist nicht verfuegbar.`);
    const kontext = typeof spiel[name] === 'function' ? spiel : globalThis;
    return Reflect.apply(funktion, kontext, argumente);
  }

  function kannAngreifen(ziel) {
    const spiel = holeSpielFenster();
    const canAttack = spiel.can_attack ?? globalThis.can_attack;
    if (typeof canAttack !== 'function') return null;
    const kontext = typeof spiel.can_attack === 'function' ? spiel : globalThis;
    try {
      return Reflect.apply(canAttack, kontext, [ziel]) === true;
    } catch {
      return false;
    }
  }

  function zielLebtNoch(ziel) {
    if (!istObjekt(ziel)) return false;
    if (ziel.dead === true) return false;
    if (Number.isFinite(ziel.hp) && ziel.hp <= 0) return false;
    return true;
  }

  class BrowserAktionsSteuerung {
    constructor() {
      this.laufend = null;
    }

    starte(anfrage, jetzt) {
      if (!istObjekt(anfrage) || typeof anfrage.kennung !== 'string' || !ERLAUBTE_AKTIONEN.has(anfrage.aktion)) {
        throw new Error('Die zentrale Browser-Aktionssteuerung hat eine ungueltige oder nicht freigegebene Anfrage erhalten.');
      }
      if (this.laufend !== null) return null;
      this.laufend = Object.freeze({ ...anfrage, gestartetAm: jetzt });
      return Object.freeze({ art: 'gestartet', zeitpunkt: jetzt, gestarteteAnfrage: this.laufend });
    }

    schliesseAb(kennung) {
      if (this.laufend?.kennung === kennung) this.laufend = null;
    }

    brecheAb(kennung) {
      if (this.laufend?.kennung === kennung) this.laufend = null;
    }
  }

  async function fuehreFreigegebeneAktionAus(schritt) {
    if (!lauf?.aktivFreigegeben) throw new Error('Aktive Adventure-Land-Farmausfuehrung ist nicht ausdruecklich freigegeben.');
    if (!schritt || schritt.art !== 'gestartet' || !schritt.gestarteteAnfrage) {
      throw new Error('Nur eine von der zentralen Browser-Aktionssteuerung gestartete Anfrage darf aktiv ausgefuehrt werden.');
    }
    const anfrage = schritt.gestarteteAnfrage;
    if (!ERLAUBTE_AKTIONEN.has(anfrage.aktion)) throw new Error(`Nicht freigegebene Farmaktion: ${String(anfrage.aktion)}.`);

    if (anfrage.aktion === 'FARM_BEWEGEN') {
      const details = anfrage.details;
      if (!istObjekt(details) || !Number.isFinite(details.x) || !Number.isFinite(details.y)) throw new Error('FARM_BEWEGEN benoetigt endliche x-/y-Koordinaten.');
      await Promise.resolve(rufeSpielFunktionAuf('move', [details.x, details.y]));
      return 'ausgefuehrt';
    }

    if (anfrage.aktion === 'FARM_ANGREIFEN') {
      const zielKennung = anfrage.details?.zielKennung;
      if (typeof zielKennung !== 'string' || zielKennung.length === 0) throw new Error('FARM_ANGREIFEN benoetigt eine Zielkennung.');
      const ziel = holeEntity(zielKennung);
      if (!zielLebtNoch(ziel)) return 'ziel_nicht_mehr_sichtbar';
      if (kannAngreifen(ziel) === false) return 'angriff_noch_nicht_moeglich';

      try {
        await Promise.resolve(rufeSpielFunktionAuf('attack', [ziel]));
        return 'ausgefuehrt';
      } catch (fehler) {
        // Adventure Land kann zwischen can_attack() und attack() den Zustand aendern.
        // Solche Race-Conditions sind normale Laufzeitereignisse und kein Bot-Absturz.
        const zielNachFehler = holeEntity(zielKennung);
        if (!zielLebtNoch(zielNachFehler)) return 'ziel_waehrend_angriff_verschwunden';
        if (kannAngreifen(zielNachFehler) === false) return 'angriff_zwischenzeitlich_nicht_mehr_moeglich';

        const meldung = fehlerDarstellung(fehler);
        const weitergereicht = new Error(`Adventure-Land attack() wurde abgelehnt: ${meldung}`);
        weitergereicht.name = 'AdventureLandAngriffsfehler';
        weitergereicht.details = kompakteFehlerDetails(fehler);
        throw weitergereicht;
      }
    }

    if (anfrage.aktion === 'FARM_LEBEN_WIEDERHERSTELLEN') {
      const spiel = holeSpielFenster();
      const direkt = spiel.use_hp ?? globalThis.use_hp;
      if (typeof direkt === 'function') {
        const kontext = typeof spiel.use_hp === 'function' ? spiel : globalThis;
        await Promise.resolve(Reflect.apply(direkt, kontext, []));
      } else {
        await Promise.resolve(rufeSpielFunktionAuf('use_hp_or_mp', []));
      }
      return 'ausgefuehrt';
    }

    if (anfrage.aktion === 'FARM_MANA_WIEDERHERSTELLEN') {
      const spiel = holeSpielFenster();
      const direkt = spiel.use_mp ?? globalThis.use_mp;
      if (typeof direkt === 'function') {
        const kontext = typeof spiel.use_mp === 'function' ? spiel : globalThis;
        await Promise.resolve(Reflect.apply(direkt, kontext, []));
      } else {
        await Promise.resolve(rufeSpielFunktionAuf('use_hp_or_mp', []));
      }
      return 'ausgefuehrt';
    }

    if (anfrage.aktion === 'FARM_BEUTE_AUFNEHMEN') {
      await Promise.resolve(rufeSpielFunktionAuf('loot', []));
      return 'ausgefuehrt';
    }

    throw new Error(`Nicht freigegebene Farmaktion: ${String(anfrage.aktion)}.`);
  }

  function kompakterBericht(status, grund) {
    const ende = charakterSnapshot();
    const start = lauf?.start ?? letzterBericht?.start ?? null;
    return Object.freeze({
      schemaVersion: 1,
      werkzeug: API_NAME,
      version: VERSION,
      status,
      grund,
      modus: 'aktiv_begrenzt',
      gestartetAm: lauf?.gestartetAm ?? letzterBericht?.gestartetAm ?? null,
      beendetAm: Date.now(),
      vorgesehenMillisekunden: lauf?.dauerMillisekunden ?? letzterBericht?.vorgesehenMillisekunden ?? null,
      monsterArten: Object.freeze([ERLAUBTE_MONSTER_ART]),
      letzteVerarbeitetePlanungsNummer: lauf?.letztePlanungsNummer ?? letzterBericht?.letzteVerarbeitetePlanungsNummer ?? 0,
      ausgefuehrtZaehler: Object.freeze({ ...(lauf?.ausgefuehrtZaehler ?? letzterBericht?.ausgefuehrtZaehler ?? {}) }),
      uebersprungenZaehler: Object.freeze({ ...(lauf?.uebersprungenZaehler ?? letzterBericht?.uebersprungenZaehler ?? {}) }),
      fehler: Object.freeze([...(lauf?.fehler ?? letzterBericht?.fehler ?? [])]),
      start,
      ende,
      delta: {
        erfahrung: start?.erfahrung != null && ende?.erfahrung != null ? ende.erfahrung - start.erfahrung : null,
        gold: start?.gold != null && ende?.gold != null ? ende.gold - start.gold : null
      },
      sicherheit: Object.freeze({
        aktivFreigegeben: true,
        rangerOnly: true,
        monsterOnly: ERLAUBTE_MONSTER_ART,
        maximaleDauerMillisekunden: MAX_DAUER
      })
    });
  }

  function stoppeSchatten(grund) {
    try {
      const schatten = holeSchattenApi();
      if (schatten.status()?.laeuft) schatten.stoppe(grund);
    } catch {
      // Der Aktivtest muss auch dann sauber stoppen, wenn der Schattenhelfer bereits beendet ist.
    }
  }

  function beende(status, grund) {
    if (!lauf) return letzterBericht;
    lauf.beendet = true;
    clearInterval(lauf.intervalKennung);
    stoppeSchatten(`Aktivtest beendet: ${grund}`);
    letzterBericht = kompakterBericht(status, grund);
    lauf = null;
    aktualisiereTitel(`Block 6 · Aktiv Ranger · ${status === 'abgeschlossen' ? 'beendet' : 'gestoppt'}`);
    holeKonsole().ausgeben(letzterBericht, `Block 6 Aktivtest ${status}`);
    return letzterBericht;
  }

  function pruefeSicherheitszustand() {
    const charakter = charakterSnapshot();
    if (!charakter) return 'Charakterdaten sind nicht lesbar.';
    if (charakter.klasse !== 'ranger') return `Charakterklasse hat sich geaendert: ${String(charakter.klasse)}.`;
    if (charakter.tot) return 'Der Ranger ist tot.';
    if (charakter.freieInventarPlaetze !== null && charakter.freieInventarPlaetze < 1) return 'Das Inventar hat keinen freien Platz mehr.';
    return null;
  }

  async function tick() {
    if (!lauf || lauf.tickLaeuft || lauf.beendet) return;
    lauf.tickLaeuft = true;
    try {
      const sicherheitsGrund = pruefeSicherheitszustand();
      if (sicherheitsGrund) {
        beende('sicherheitsstopp', sicherheitsGrund);
        return;
      }

      const jetzt = Date.now();
      if (jetzt >= lauf.vorgesehenBis) {
        beende('abgeschlossen', 'Die begrenzte Aktivtest-Laufzeit ist abgelaufen.');
        return;
      }

      const schatten = holeSchattenApi();
      const schattenStatus = schatten.status();
      if (!schattenStatus?.laeuft) {
        beende('sicherheitsstopp', 'Der Schattenplaner laeuft nicht mehr.');
        return;
      }
      const planungsNummer = schattenStatus.anzahlSchritte ?? 0;
      if (planungsNummer <= lauf.letztePlanungsNummer) return;
      if (planungsNummer > lauf.letztePlanungsNummer + 1) {
        beende('sicherheitsstopp', `Planungsschritte wurden uebersprungen (${lauf.letztePlanungsNummer} -> ${planungsNummer}).`);
        return;
      }

      const bericht = schatten.ergebnis();
      const ereignisse = bericht?.ereignisse;
      const ereignis = Array.isArray(ereignisse) && ereignisse.length > 0 ? ereignisse[ereignisse.length - 1] : null;
      lauf.letztePlanungsNummer = planungsNummer;
      if (!ereignis) return;

      if (ereignis.meldungsCode === 'FARM_STILLSTAND') {
        beende('sicherheitsstopp', 'Der Farmplaner meldet FARM_STILLSTAND.');
        return;
      }
      if (ereignis.art === 'blockiert') {
        beende('sicherheitsstopp', `Der Farmplaner ist blockiert: ${ereignis.meldungsCode ?? ereignis.grund ?? 'unbekannter Grund'}.`);
        return;
      }
      if (!ereignis.schattenAnfrage) return;

      const anfrage = Object.freeze({
        kennung: `block6-aktiv:${lauf.gestartetAm}:${planungsNummer}`,
        aktion: ereignis.schattenAnfrage.aktion,
        benoetigteRessourcen: Object.freeze([...(ereignis.schattenAnfrage.ressourcen ?? [])]),
        details: Object.freeze({ ...(ereignis.schattenAnfrage.details ?? {}) })
      });
      const schritt = lauf.steuerung.starte(anfrage, jetzt);
      if (!schritt) {
        zaehle(lauf.uebersprungenZaehler, 'zentrale_aktion_laeuft');
        return;
      }

      try {
        const ergebnis = await fuehreFreigegebeneAktionAus(schritt);
        lauf.steuerung.schliesseAb(anfrage.kennung);
        if (ergebnis === 'ausgefuehrt') zaehle(lauf.ausgefuehrtZaehler, anfrage.aktion);
        else zaehle(lauf.uebersprungenZaehler, ergebnis);
      } catch (fehler) {
        lauf.steuerung.brecheAb(anfrage.kennung);
        const eintrag = {
          zeitpunkt: Date.now(),
          aktion: anfrage.aktion,
          typ: fehler instanceof Error ? fehler.name : typeof fehler,
          meldung: fehlerDarstellung(fehler),
          details: fehler instanceof Error && istObjekt(fehler.details) ? fehler.details : kompakteFehlerDetails(fehler)
        };
        lauf.fehler.push(Object.freeze(eintrag));
        beende('fehler', `Aktive Farmaktion fehlgeschlagen: ${eintrag.meldung}`);
        return;
      }

      aktualisiereTitel(`Block 6 · Aktiv Ranger · Restzeit ${formatiereRestzeit(lauf.vorgesehenBis - Date.now())}`);
    } finally {
      if (lauf) lauf.tickLaeuft = false;
    }
  }

  function starte(optionen = {}) {
    if (lauf) throw new Error('Es laeuft bereits ein Block-6-Aktivtest.');
    if (optionen.aktivFreigegeben !== true) {
      throw new Error('Der Aktivtest benoetigt die ausdrueckliche Option { aktivFreigegeben: true }.');
    }
    const monsterArten = normalisiereMonsterArten(optionen.monsterArten ?? [ERLAUBTE_MONSTER_ART]);
    const dauerMillisekunden = positiveDauer(optionen.dauerMillisekunden);
    const start = charakterSnapshot();
    if (!start) throw new Error('Adventure Land liefert aktuell keinen lesbaren Charakter.');
    if (start.klasse !== 'ranger') throw new Error(`Der begrenzte Block-6-Aktivtest ist nur fuer Ranger freigegeben; erkannt wurde ${String(start.klasse)}.`);
    if (start.tot) throw new Error('Der Aktivtest darf nicht mit einem toten Ranger gestartet werden.');
    if (start.freieInventarPlaetze !== null && start.freieInventarPlaetze < 1) throw new Error('Der Aktivtest benoetigt mindestens einen freien Inventarplatz.');
    if (sichtbareGooAnzahl() < 1) throw new Error('Es ist aktuell kein lebendes sichtbares goo vorhanden.');

    const schatten = holeSchattenApi();
    if (schatten.status()?.laeuft) throw new Error('Vor dem Aktivtest darf kein anderer Block-6-Schattenlauf laufen.');

    const gestartetAm = Date.now();
    lauf = {
      aktiviert: true,
      aktivFreigegeben: true,
      monsterArten,
      dauerMillisekunden,
      gestartetAm,
      vorgesehenBis: gestartetAm + dauerMillisekunden,
      start,
      letztePlanungsNummer: 0,
      ausgefuehrtZaehler: {},
      uebersprungenZaehler: {},
      fehler: [],
      steuerung: new BrowserAktionsSteuerung(),
      tickLaeuft: false,
      beendet: false,
      intervalKennung: null
    };
    letzterBericht = null;

    try {
      schatten.starte(monsterArten, {
        dauerMillisekunden,
        intervallMillisekunden: PLANUNGS_INTERVAL,
        zwischenberichtMillisekunden: Math.min(5 * 60 * 1000, dauerMillisekunden)
      });
    } catch (fehler) {
      lauf = null;
      throw fehler;
    }

    holeKonsole().ausgeben({
      modus: 'aktiv_begrenzt',
      charakter: start.name,
      klasse: start.klasse,
      monsterArten,
      dauerMillisekunden,
      maximaleDauerMillisekunden: MAX_DAUER,
      aktivFreigegeben: true,
      hinweis: 'Dieser Test fuehrt echte Adventure-Land-Aktionen aus. Andere Bot-/Farmcodes auf diesem Ranger muessen ausgeschaltet sein.'
    }, 'Block 6 begrenzter Ranger-Aktivtest gestartet');

    aktualisiereTitel(`Block 6 · Aktiv Ranger · Restzeit ${formatiereRestzeit(dauerMillisekunden)}`);
    lauf.intervalKennung = setInterval(() => { void tick(); }, POLL_INTERVAL);
    void tick();
    return status();
  }

  function status() {
    if (!lauf) return Object.freeze({ laeuft: false, letzterBerichtVorhanden: letzterBericht !== null });
    return Object.freeze({
      laeuft: true,
      modus: 'aktiv_begrenzt',
      gestartetAm: lauf.gestartetAm,
      vorgesehenBis: lauf.vorgesehenBis,
      restMillisekunden: Math.max(0, lauf.vorgesehenBis - Date.now()),
      monsterArten: lauf.monsterArten,
      letztePlanungsNummer: lauf.letztePlanungsNummer,
      ausgefuehrtZaehler: Object.freeze({ ...lauf.ausgefuehrtZaehler }),
      uebersprungenZaehler: Object.freeze({ ...lauf.uebersprungenZaehler }),
      fehlerAnzahl: lauf.fehler.length
    });
  }

  function ergebnis() {
    if (lauf) return kompakterBericht('laeuft', 'Zwischenstand waehrend des begrenzten Aktivtests.');
    return letzterBericht;
  }

  const api = Object.freeze({
    version: VERSION,
    starte,
    status,
    ergebnis,
    kompaktErgebnis: ergebnis,
    stoppe(grund = 'Manuell gestoppt.') {
      if (typeof grund !== 'string' || grund.trim().length === 0) throw new Error('Ein manueller Stopp benoetigt einen Grund.');
      return beende('gestoppt', grund.trim());
    }
  });

  globalThis[API_NAME] = api;
  try {
    const elternFenster = holeElternFenster();
    if (elternFenster) elternFenster[API_NAME] = api;
  } catch {
    // Lokale API bleibt verfuegbar.
  }

  holeKonsole().ausgeben({
    version: VERSION,
    start10Minuten: 'V4Block6AktivRanger.starte({ monsterArten: ["goo"], aktivFreigegeben: true })',
    start15Minuten: 'V4Block6AktivRanger.starte({ monsterArten: ["goo"], dauerMillisekunden: 15 * 60 * 1000, aktivFreigegeben: true })',
    status: 'V4Block6AktivRanger.status()',
    stop: 'V4Block6AktivRanger.stoppe("Grund")',
    ergebnis: 'V4Block6AktivRanger.kompaktErgebnis()',
    sicherheit: 'Ranger-only, goo-only, ausdrueckliche Freigabe, maximal 15 Minuten und automatischer Sicherheitsstopp.'
  }, 'Block-6-Ranger-Aktivtest bereit');
})();
