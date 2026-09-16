(() => {
  'use strict';

  const API_NAME = 'V4Block6SchattenRanger';
  const VERSION = '1.0.0';
  const STANDARD_DAUER = 30 * 60 * 1000;
  const STANDARD_INTERVAL = 1000;
  const STANDARD_ZWISCHENBERICHT = 5 * 60 * 1000;
  const MAX_EREIGNISSE = 1000;
  const AKTIONS_GUELTIGKEIT = 2500;

  let lauf = null;
  let letzterBericht = null;

  function holeElternFenster() {
    try {
      if (typeof parent !== 'undefined' && parent && parent !== globalThis) return parent;
    } catch {
      // Fallback auf den aktuellen Adventure-Land-Codekontext.
    }
    return null;
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

  function holeKonsole() {
    const api = globalThis.V4Testkonsole ?? holeElternFenster()?.V4Testkonsole;
    if (!api) throw new Error('Zuerst v4/werkzeuge/adventure-land-testkonsole.js laden.');
    return api;
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
      // Der Test darf nicht an einer rein visuellen Anzeige scheitern.
    }
  }

  function istObjekt(wert) {
    return typeof wert === 'object' && wert !== null && !Array.isArray(wert);
  }

  function endlicheZahl(wert) {
    return typeof wert === 'number' && Number.isFinite(wert) ? wert : null;
  }

  function textOderNull(wert) {
    return typeof wert === 'string' && wert.length > 0 ? wert : null;
  }

  function kennungOderNull(wert) {
    return typeof wert === 'string' || typeof wert === 'number' ? String(wert) : null;
  }

  function normalisiereMonsterArten(monsterArten) {
    if (!Array.isArray(monsterArten)) throw new Error('monsterArten muss ein Array mit ausdruecklich erlaubten MonsterArten sein.');
    const werte = [...new Set(monsterArten.map((wert) => String(wert).trim()).filter(Boolean))].sort();
    if (werte.length === 0) throw new Error('Mindestens eine ausdruecklich erlaubte MonsterArt ist erforderlich.');
    return Object.freeze(werte);
  }

  function anteil(name, wert, standard) {
    const ergebnis = wert ?? standard;
    if (!Number.isFinite(ergebnis) || ergebnis < 0 || ergebnis > 1) throw new Error(`${name} muss zwischen 0 und 1 liegen.`);
    return ergebnis;
  }

  function positiveZahl(name, wert, standard) {
    const ergebnis = wert ?? standard;
    if (!Number.isFinite(ergebnis) || ergebnis <= 0) throw new Error(`${name} muss eine positive endliche Zahl sein.`);
    return ergebnis;
  }

  function nichtnegativeZahl(name, wert, standard) {
    const ergebnis = wert ?? standard;
    if (!Number.isFinite(ergebnis) || ergebnis < 0) throw new Error(`${name} muss eine endliche, nichtnegative Zahl sein.`);
    return ergebnis;
  }

  function positiveGanzzahl(name, wert, standard) {
    const ergebnis = wert ?? standard;
    if (!Number.isSafeInteger(ergebnis) || ergebnis < 1) throw new Error(`${name} muss eine positive ganze Zahl sein.`);
    return ergebnis;
  }

  function erstelleKonfiguration(monsterArten, optionen = {}) {
    return Object.freeze({
      monsterArten: normalisiereMonsterArten(monsterArten),
      lebenWiederherstellenUnter: anteil('lebenWiederherstellenUnter', optionen.lebenWiederherstellenUnter, 0.5),
      manaWiederherstellenUnter: anteil('manaWiederherstellenUnter', optionen.manaWiederherstellenUnter, 0.3),
      reichweitenPuffer: nichtnegativeZahl('reichweitenPuffer', optionen.reichweitenPuffer, 5),
      mindestensFreieInventarPlaetze: positiveGanzzahl('mindestensFreieInventarPlaetze', optionen.mindestensFreieInventarPlaetze, 1),
      stillstandNachMillisekunden: positiveZahl('stillstandNachMillisekunden', optionen.stillstandNachMillisekunden, 15000),
      dauerMillisekunden: positiveZahl('dauerMillisekunden', optionen.dauerMillisekunden, STANDARD_DAUER),
      intervallMillisekunden: positiveZahl('intervallMillisekunden', optionen.intervallMillisekunden, STANDARD_INTERVAL),
      zwischenberichtMillisekunden: positiveZahl('zwischenberichtMillisekunden', optionen.zwischenberichtMillisekunden, STANDARD_ZWISCHENBERICHT)
    });
  }

  function leseMonster(entities) {
    if (!istObjekt(entities)) return null;
    return Object.entries(entities)
      .filter(([, entity]) => istObjekt(entity) && entity.type === 'monster')
      .map(([id, entity]) => ({
        kennung: kennungOderNull(entity.id) ?? String(id),
        monsterArt: textOderNull(entity.mtype),
        leben: endlicheZahl(entity.hp),
        tot: typeof entity.dead === 'boolean' ? entity.dead : null,
        karte: textOderNull(entity.map),
        x: endlicheZahl(entity.x),
        y: endlicheZahl(entity.y),
        echtX: endlicheZahl(entity.real_x),
        echtY: endlicheZahl(entity.real_y)
      }))
      .sort((a, b) => a.kennung.localeCompare(b.kennung));
  }

  function leseSnapshot(zeitpunkt) {
    const charakter = holeSpielWert('character');
    const entities = holeSpielWert('entities');
    const snapshot = {
      zeitpunkt,
      server: {
        region: holeSpielWert('server_region') ?? null,
        kennung: holeSpielWert('server_identifier') ?? null
      },
      charakter: null,
      inventar: null,
      monster: leseMonster(entities)
    };

    if (!istObjekt(charakter)) return snapshot;
    snapshot.charakter = {
      kennung: kennungOderNull(charakter.id),
      name: textOderNull(charakter.name),
      klasse: textOderNull(charakter.ctype),
      stufe: endlicheZahl(charakter.level),
      leben: endlicheZahl(charakter.hp),
      lebenMaximal: endlicheZahl(charakter.max_hp),
      mana: endlicheZahl(charakter.mp),
      manaMaximal: endlicheZahl(charakter.max_mp),
      erfahrung: endlicheZahl(charakter.xp),
      gold: endlicheZahl(charakter.gold),
      reichweite: endlicheZahl(charakter.range),
      karte: textOderNull(charakter.map),
      x: endlicheZahl(charakter.x),
      y: endlicheZahl(charakter.y),
      echtX: endlicheZahl(charakter.real_x),
      echtY: endlicheZahl(charakter.real_y),
      tot: typeof charakter.rip === 'boolean' ? charakter.rip : null
    };
    snapshot.inventar = Array.isArray(charakter.items)
      ? charakter.items.map((gegenstand) => gegenstand === null || gegenstand === undefined ? null : (istObjekt(gegenstand) ? { belegt: true } : undefined))
      : null;
    return snapshot;
  }

  function position(objekt) {
    const x = objekt?.echtX ?? objekt?.x;
    const y = objekt?.echtY ?? objekt?.y;
    return x === null || x === undefined || y === null || y === undefined ? null : [x, y];
  }

  function istLebendesErlaubtesMonster(monster, erlaubteArten) {
    if (!monster.kennung || !monster.monsterArt || !erlaubteArten.has(monster.monsterArt)) return false;
    if (monster.tot === true) return false;
    if (monster.leben !== null && monster.leben <= 0) return false;
    return monster.tot === false || (monster.leben !== null && monster.leben > 0);
  }

  function freieInventarPlaetze(snapshot) {
    if (!Array.isArray(snapshot.inventar)) return null;
    let frei = 0;
    for (const platz of snapshot.inventar) {
      if (platz === undefined) return null;
      if (platz === null) frei += 1;
    }
    return frei;
  }

  function fortschrittsKennung(snapshot) {
    const charakter = snapshot.charakter;
    if (!charakter) return 'charakter-unbekannt';
    const inventarBelegt = Array.isArray(snapshot.inventar)
      ? snapshot.inventar.reduce((summe, platz) => summe + (platz && platz !== undefined ? 1 : 0), 0)
      : 'inventar-unbekannt';
    const charakterTeil = [
      charakter.erfahrung, charakter.gold, charakter.leben, charakter.mana,
      charakter.echtX ?? charakter.x, charakter.echtY ?? charakter.y, inventarBelegt
    ].map((wert) => wert === null || wert === undefined ? 'unbekannt' : String(wert)).join(':');
    const monsterTeil = (snapshot.monster ?? []).map((monster) => [
      monster.kennung, monster.leben, monster.echtX ?? monster.x, monster.echtY ?? monster.y, monster.tot
    ].map((wert) => wert === null || wert === undefined ? 'unbekannt' : String(wert)).join(':')).sort().join('|');
    return `${charakterTeil}#${monsterTeil}`;
  }

  function aktualisiereFortschritt(snapshot, zustand, jetzt) {
    const kennung = fortschrittsKennung(snapshot);
    return {
      ...zustand,
      letzterFortschrittAm: kennung === zustand.letzteFortschrittsKennung ? zustand.letzterFortschrittAm : jetzt,
      letzteFortschrittsKennung: kennung
    };
  }

  function waehleZiel(charakter, monster, konfiguration) {
    const charakterPosition = position(charakter);
    if (!charakterPosition || !charakter.karte) return null;
    const erlaubteArten = new Set(konfiguration.monsterArten);
    const kandidaten = monster.filter((eintrag) =>
      istLebendesErlaubtesMonster(eintrag, erlaubteArten) &&
      eintrag.karte !== null && eintrag.karte === charakter.karte && position(eintrag) !== null
    );
    kandidaten.sort((a, b) => {
      const ap = position(a);
      const bp = position(b);
      const ad = (ap[0] - charakterPosition[0]) ** 2 + (ap[1] - charakterPosition[1]) ** 2;
      const bd = (bp[0] - charakterPosition[0]) ** 2 + (bp[1] - charakterPosition[1]) ** 2;
      return ad !== bd ? ad - bd : a.kennung.localeCompare(b.kennung);
    });
    return kandidaten[0] ?? null;
  }

  function aktionsAnfrage(laufendeNummer, ablaufKennung, jetzt, art, aktion, ressourcen, grund, details) {
    return {
      kennung: `${ablaufKennung}:farm:${laufendeNummer}:${art}`,
      angefordertVon: 'grundlegendes-farmen',
      aktion,
      wichtigkeit: 'normal',
      prioritaet: 100,
      angefordertAm: jetzt,
      gueltigBis: jetzt + AKTIONS_GUELTIGKEIT,
      benoetigteRessourcen: [...ressourcen],
      grund,
      details: { ...details }
    };
  }

  function entscheidung(laufendeNummer, ablaufKennung, jetzt, art, grund, zielKennung, anfrage, meldungsCode, zustand) {
    return {
      laufendeNummer,
      entscheidungsKennung: `${ablaufKennung}:farm-entscheidung:${laufendeNummer}`,
      zeitpunkt: jetzt,
      art,
      grund,
      zielKennung,
      aktionsAnfrage: anfrage,
      meldungsCode,
      naechsterAblaufZustand: zustand
    };
  }

  function planeSchritt(snapshot, konfiguration, vorherigerZustand, laufendeNummer, ablaufKennung, jetzt) {
    let zustand = aktualisiereFortschritt(snapshot, vorherigerZustand, jetzt);
    const charakter = snapshot.charakter;
    if (!charakter) return entscheidung(laufendeNummer, ablaufKennung, jetzt, 'blockiert', 'Der Charakterzustand ist nicht bekannt.', null, null, 'FARM_VORAUSSETZUNG_FEHLT', zustand);
    if (charakter.tot !== false) return entscheidung(laufendeNummer, ablaufKennung, jetzt, 'blockiert', 'Der lebende Charakterzustand ist nicht sicher bestaetigt.', null, null, 'FARM_CHARAKTER_NICHT_BEREIT', zustand);

    const lebensAnteil = charakter.leben !== null && charakter.lebenMaximal !== null && charakter.lebenMaximal > 0 ? charakter.leben / charakter.lebenMaximal : null;
    const manaAnteil = charakter.mana !== null && charakter.manaMaximal !== null && charakter.manaMaximal > 0 ? charakter.mana / charakter.manaMaximal : null;
    if (lebensAnteil === null || manaAnteil === null) return entscheidung(laufendeNummer, ablaufKennung, jetzt, 'blockiert', 'Lebens- oder Manaanteil ist unbekannt.', null, null, 'FARM_RESSOURCENDATEN_FEHLEN', zustand);

    if (lebensAnteil < konfiguration.lebenWiederherstellenUnter) {
      const grund = `Lebensanteil ${lebensAnteil.toFixed(3)} liegt unter der Schwelle ${konfiguration.lebenWiederherstellenUnter.toFixed(3)}.`;
      return entscheidung(laufendeNummer, ablaufKennung, jetzt, 'leben_wiederherstellen', grund, null,
        aktionsAnfrage(laufendeNummer, ablaufKennung, jetzt, 'leben_wiederherstellen', 'FARM_LEBEN_WIEDERHERSTELLEN', ['inventar'], grund, { anteil: lebensAnteil, schwelle: konfiguration.lebenWiederherstellenUnter }), null, zustand);
    }

    if (manaAnteil < konfiguration.manaWiederherstellenUnter) {
      const grund = `Manaanteil ${manaAnteil.toFixed(3)} liegt unter der Schwelle ${konfiguration.manaWiederherstellenUnter.toFixed(3)}.`;
      return entscheidung(laufendeNummer, ablaufKennung, jetzt, 'mana_wiederherstellen', grund, null,
        aktionsAnfrage(laufendeNummer, ablaufKennung, jetzt, 'mana_wiederherstellen', 'FARM_MANA_WIEDERHERSTELLEN', ['inventar'], grund, { anteil: manaAnteil, schwelle: konfiguration.manaWiederherstellenUnter }), null, zustand);
    }

    const freiePlaetze = freieInventarPlaetze(snapshot);
    if (freiePlaetze === null) return entscheidung(laufendeNummer, ablaufKennung, jetzt, 'blockiert', 'Der freie Inventarplatz ist nicht sicher bestimmbar.', null, null, 'FARM_INVENTAR_UNBEKANNT', zustand);
    if (freiePlaetze < konfiguration.mindestensFreieInventarPlaetze) return entscheidung(laufendeNummer, ablaufKennung, jetzt, 'blockiert', `Nur ${freiePlaetze} freie Inventarplaetze verfuegbar.`, null, null, 'FARM_INVENTAR_VOLL', zustand);

    const monster = snapshot.monster;
    if (!monster) return entscheidung(laufendeNummer, ablaufKennung, jetzt, 'blockiert', 'Die sichtbaren Monster sind unbekannt.', null, null, 'FARM_MONSTERDATEN_FEHLEN', zustand);

    if (zustand.letzteZielKennung !== null) {
      const erlaubteArten = new Set(konfiguration.monsterArten);
      const vorherigesZielNochLebend = monster.some((eintrag) => eintrag.kennung === zustand.letzteZielKennung && istLebendesErlaubtesMonster(eintrag, erlaubteArten));
      if (!vorherigesZielNochLebend) {
        const vorherigeZielKennung = zustand.letzteZielKennung;
        zustand = { ...zustand, letzteZielKennung: null };
        const grund = `Das vorherige Farmziel ${vorherigeZielKennung} ist nicht mehr als lebendes Ziel sichtbar; vorhandene Beute wuerde aufgenommen.`;
        return entscheidung(laufendeNummer, ablaufKennung, jetzt, 'beute_aufnehmen', grund, null,
          aktionsAnfrage(laufendeNummer, ablaufKennung, jetzt, 'beute_aufnehmen', 'FARM_BEUTE_AUFNEHMEN', ['inventar'], grund, { vorherigeZielKennung }), null, zustand);
      }
    }

    const ziel = waehleZiel(charakter, monster, konfiguration);
    if (!ziel) {
      const stillstand = jetzt - zustand.letzterFortschrittAm >= konfiguration.stillstandNachMillisekunden;
      return entscheidung(laufendeNummer, ablaufKennung, jetzt, 'warten', 'Kein passendes sichtbares Farmziel.', null, null, stillstand ? 'FARM_STILLSTAND' : 'FARM_KEIN_ZIEL', zustand);
    }

    const charakterPosition = position(charakter);
    const zielPosition = position(ziel);
    if (!charakterPosition || !zielPosition || charakter.reichweite === null || charakter.reichweite < 0) return entscheidung(laufendeNummer, ablaufKennung, jetzt, 'blockiert', 'Position oder Angriffsreichweite ist unbekannt.', ziel.kennung, null, 'FARM_POSITIONS_DATEN_FEHLEN', zustand);

    zustand = { ...zustand, letzteZielKennung: ziel.kennung };
    const abstand = Math.hypot(zielPosition[0] - charakterPosition[0], zielPosition[1] - charakterPosition[1]);
    const sichereReichweite = Math.max(0, charakter.reichweite - konfiguration.reichweitenPuffer);
    const stillstand = jetzt - zustand.letzterFortschrittAm >= konfiguration.stillstandNachMillisekunden;
    if (abstand > sichereReichweite) {
      const grund = `Ziel ${ziel.kennung} ist ${abstand.toFixed(2)} entfernt und liegt ausserhalb der Farm-Angriffsreichweite ${sichereReichweite.toFixed(2)}.`;
      return entscheidung(laufendeNummer, ablaufKennung, jetzt, 'bewegen', grund, ziel.kennung,
        aktionsAnfrage(laufendeNummer, ablaufKennung, jetzt, 'bewegen', 'FARM_BEWEGEN', ['bewegung', 'kampfziel'], grund, { zielKennung: ziel.kennung, x: zielPosition[0], y: zielPosition[1] }), stillstand ? 'FARM_STILLSTAND' : null, zustand);
    }

    const grund = `Ziel ${ziel.kennung} liegt mit Abstand ${abstand.toFixed(2)} innerhalb der Farm-Angriffsreichweite ${sichereReichweite.toFixed(2)}.`;
    return entscheidung(laufendeNummer, ablaufKennung, jetzt, 'angreifen', grund, ziel.kennung,
      aktionsAnfrage(laufendeNummer, ablaufKennung, jetzt, 'angreifen', 'FARM_ANGREIFEN', ['kampfziel'], grund, { zielKennung: ziel.kennung }), stillstand ? 'FARM_STILLSTAND' : null, zustand);
  }

  function erhoehe(zaehler, schluessel) {
    const key = schluessel ?? 'null';
    zaehler[key] = (zaehler[key] ?? 0) + 1;
  }

  function kompakterSnapshot(snapshot) {
    const charakter = snapshot.charakter;
    return {
      zeitpunkt: snapshot.zeitpunkt,
      charakter: charakter ? {
        name: charakter.name,
        klasse: charakter.klasse,
        stufe: charakter.stufe,
        leben: charakter.leben,
        lebenMaximal: charakter.lebenMaximal,
        mana: charakter.mana,
        manaMaximal: charakter.manaMaximal,
        erfahrung: charakter.erfahrung,
        gold: charakter.gold,
        karte: charakter.karte,
        position: position(charakter)
      } : null,
      monsterSichtbar: snapshot.monster?.length ?? null,
      freieInventarPlaetze: freieInventarPlaetze(snapshot)
    };
  }

  function fuegeEreignisHinzu(daten) {
    if (lauf.ereignisse.length >= MAX_EREIGNISSE) {
      lauf.ereignisse.shift();
      lauf.verloreneEreignisse += 1;
    }
    lauf.ereignisse.push(daten);
  }

  function protokolliereEntscheidung(snapshot, farm) {
    lauf.anzahlSchritte += 1;
    lauf.ablaufZustand = farm.naechsterAblaufZustand;
    erhoehe(lauf.aktionsZaehler, farm.art);
    if (farm.meldungsCode) erhoehe(lauf.meldungsZaehler, farm.meldungsCode);
    if (farm.zielKennung) erhoehe(lauf.zielZaehler, farm.zielKennung);
    if (farm.meldungsCode === 'FARM_STILLSTAND') lauf.stillstaende += 1;

    const signatur = `${farm.art}|${farm.zielKennung ?? ''}|${farm.meldungsCode ?? ''}`;
    if (signatur !== lauf.letzteEntscheidungsSignatur) {
      lauf.letzteEntscheidungsSignatur = signatur;
      const ereignis = {
        zeitpunkt: snapshot.zeitpunkt,
        art: farm.art,
        zielKennung: farm.zielKennung,
        meldungsCode: farm.meldungsCode,
        grund: farm.grund,
        schattenAnfrage: farm.aktionsAnfrage ? {
          aktion: farm.aktionsAnfrage.aktion,
          ressourcen: farm.aktionsAnfrage.benoetigteRessourcen,
          details: farm.aktionsAnfrage.details
        } : null
      };
      fuegeEreignisHinzu(ereignis);
      holeKonsole().ausgeben(ereignis, `Block 6 Schatten · ${farm.art}`);
    }
  }

  function laufBericht(zeitpunkt, status, grund) {
    const letzterSnapshot = leseSnapshot(zeitpunkt);
    const startCharakter = lauf.startSnapshot.charakter;
    const endeCharakter = letzterSnapshot.charakter;
    return {
      schemaVersion: 1,
      werkzeug: API_NAME,
      version: VERSION,
      status,
      grund,
      modus: 'schatten',
      charakterKlasse: endeCharakter?.klasse ?? startCharakter?.klasse ?? null,
      gestartetAm: lauf.gestartetAm,
      beendetAm: zeitpunkt,
      dauerMillisekunden: zeitpunkt - lauf.gestartetAm,
      vorgesehenMillisekunden: lauf.konfiguration.dauerMillisekunden,
      konfiguration: {
        monsterArten: lauf.konfiguration.monsterArten,
        lebenWiederherstellenUnter: lauf.konfiguration.lebenWiederherstellenUnter,
        manaWiederherstellenUnter: lauf.konfiguration.manaWiederherstellenUnter,
        reichweitenPuffer: lauf.konfiguration.reichweitenPuffer,
        mindestensFreieInventarPlaetze: lauf.konfiguration.mindestensFreieInventarPlaetze,
        stillstandNachMillisekunden: lauf.konfiguration.stillstandNachMillisekunden,
        intervallMillisekunden: lauf.konfiguration.intervallMillisekunden
      },
      anzahlSchritte: lauf.anzahlSchritte,
      aktionsZaehler: { ...lauf.aktionsZaehler },
      meldungsZaehler: { ...lauf.meldungsZaehler },
      zielZaehler: { ...lauf.zielZaehler },
      stillstaende: lauf.stillstaende,
      fehler: [...lauf.fehler],
      verloreneEreignisse: lauf.verloreneEreignisse,
      ereignisse: [...lauf.ereignisse],
      start: kompakterSnapshot(lauf.startSnapshot),
      ende: kompakterSnapshot(letzterSnapshot),
      delta: {
        erfahrung: startCharakter?.erfahrung !== null && startCharakter?.erfahrung !== undefined && endeCharakter?.erfahrung !== null && endeCharakter?.erfahrung !== undefined
          ? endeCharakter.erfahrung - startCharakter.erfahrung : null,
        gold: startCharakter?.gold !== null && startCharakter?.gold !== undefined && endeCharakter?.gold !== null && endeCharakter?.gold !== undefined
          ? endeCharakter.gold - startCharakter.gold : null
      },
      sicherheit: {
        echteSpielaktionenAusgefuehrt: false,
        hinweis: 'Dieses Werkzeug liest Adventure-Land-Zustand und protokolliert Block-6-Entscheidungen. Es fuehrt keine Spielaktion aus.'
      }
    };
  }

  function beende(status, grund) {
    if (!lauf) return letzterBericht;
    clearInterval(lauf.intervalKennung);
    const zeitpunkt = Date.now();
    letzterBericht = Object.freeze(laufBericht(zeitpunkt, status, grund));
    lauf = null;
    aktualisiereTitel(`Block 6 · Schatten · ${status === 'abgeschlossen' ? 'beendet' : 'gestoppt'}`);
    holeKonsole().ausgeben(letzterBericht, `Block 6 Schattenlauf ${status}`);
    return letzterBericht;
  }

  function tick() {
    if (!lauf) return;
    const jetzt = Date.now();
    try {
      const snapshot = leseSnapshot(jetzt);
      const farm = planeSchritt(snapshot, lauf.konfiguration, lauf.ablaufZustand, lauf.laufendeNummer, lauf.ablaufKennung, jetzt);
      lauf.laufendeNummer += 1;
      protokolliereEntscheidung(snapshot, farm);

      if (jetzt >= lauf.naechsterZwischenberichtAm) {
        lauf.naechsterZwischenberichtAm = jetzt + lauf.konfiguration.zwischenberichtMillisekunden;
        holeKonsole().ausgeben({
          restMillisekunden: Math.max(0, lauf.vorgesehenBis - jetzt),
          anzahlSchritte: lauf.anzahlSchritte,
          aktionsZaehler: { ...lauf.aktionsZaehler },
          meldungsZaehler: { ...lauf.meldungsZaehler },
          stillstaende: lauf.stillstaende,
          fehlerAnzahl: lauf.fehler.length
        }, 'Block 6 Schatten · Zwischenbericht');
      }
    } catch (fehler) {
      const eintrag = {
        zeitpunkt: jetzt,
        meldung: fehler instanceof Error ? fehler.message : String(fehler),
        stapel: fehler instanceof Error ? fehler.stack ?? null : null
      };
      lauf.fehler.push(eintrag);
      fuegeEreignisHinzu({ zeitpunkt: jetzt, art: 'fehler', ...eintrag });
      holeKonsole().ausgeben(eintrag, 'Block 6 Schatten · Fehler');
    }

    const rest = lauf.vorgesehenBis - jetzt;
    aktualisiereTitel(`Block 6 · Schatten Ranger · Restzeit ${formatiereRestzeit(rest)}`);
    if (rest <= 0) beende('abgeschlossen', 'Die 30-Minuten-Schattenlaufzeit ist abgelaufen.');
  }

  function starte(monsterArten, optionen = {}) {
    if (lauf) throw new Error('Es laeuft bereits ein Block-6-Ranger-Schattenlauf.');
    const konfiguration = erstelleKonfiguration(monsterArten, optionen);
    const gestartetAm = Date.now();
    const startSnapshot = leseSnapshot(gestartetAm);
    if (!startSnapshot.charakter) throw new Error('Adventure Land liefert aktuell keinen lesbaren Charakter.');
    if (startSnapshot.charakter.klasse !== 'ranger') throw new Error(`Dieses Werkzeug ist fuer den ersten Block-6-Test auf einem Ranger vorgesehen; erkannt wurde ${String(startSnapshot.charakter.klasse)}.`);

    const ablaufKennung = `block6-schatten-ranger-${startSnapshot.charakter.kennung ?? 'unbekannt'}-${gestartetAm}`;
    lauf = {
      konfiguration,
      gestartetAm,
      vorgesehenBis: gestartetAm + konfiguration.dauerMillisekunden,
      naechsterZwischenberichtAm: gestartetAm + konfiguration.zwischenberichtMillisekunden,
      startSnapshot,
      ablaufKennung,
      laufendeNummer: 1,
      ablaufZustand: {
        schemaVersion: 1,
        gestartetAm,
        letzterFortschrittAm: gestartetAm,
        letzteFortschrittsKennung: fortschrittsKennung(startSnapshot),
        letzteZielKennung: null
      },
      anzahlSchritte: 0,
      aktionsZaehler: {},
      meldungsZaehler: {},
      zielZaehler: {},
      stillstaende: 0,
      fehler: [],
      ereignisse: [],
      verloreneEreignisse: 0,
      letzteEntscheidungsSignatur: null,
      intervalKennung: null
    };

    letzterBericht = null;
    holeKonsole().ausgeben({
      modus: 'schatten',
      charakter: startSnapshot.charakter.name,
      klasse: startSnapshot.charakter.klasse,
      monsterArten: konfiguration.monsterArten,
      dauerMillisekunden: konfiguration.dauerMillisekunden,
      intervallMillisekunden: konfiguration.intervallMillisekunden,
      hinweis: 'Read-only: Es werden keine Adventure-Land-Spielaktionen ausgefuehrt.'
    }, 'Block 6 Ranger-Schattenlauf gestartet');

    tick();
    if (lauf) lauf.intervalKennung = setInterval(tick, konfiguration.intervallMillisekunden);
    return status();
  }

  function status() {
    if (!lauf) return Object.freeze({ laeuft: false, letzterBerichtVorhanden: letzterBericht !== null });
    return Object.freeze({
      laeuft: true,
      modus: 'schatten',
      gestartetAm: lauf.gestartetAm,
      vorgesehenBis: lauf.vorgesehenBis,
      restMillisekunden: Math.max(0, lauf.vorgesehenBis - Date.now()),
      anzahlSchritte: lauf.anzahlSchritte,
      monsterArten: lauf.konfiguration.monsterArten,
      aktionsZaehler: Object.freeze({ ...lauf.aktionsZaehler }),
      meldungsZaehler: Object.freeze({ ...lauf.meldungsZaehler }),
      fehlerAnzahl: lauf.fehler.length
    });
  }

  function sichtbareMonsterArten() {
    const monster = leseMonster(holeSpielWert('entities')) ?? [];
    const zaehler = {};
    for (const eintrag of monster) {
      const art = eintrag.monsterArt ?? '[mtype fehlt]';
      zaehler[art] = (zaehler[art] ?? 0) + 1;
    }
    const ergebnis = Object.entries(zaehler)
      .map(([monsterArt, anzahl]) => ({ monsterArt, anzahl }))
      .sort((a, b) => a.monsterArt.localeCompare(b.monsterArt));
    holeKonsole().ausgeben(ergebnis, 'Sichtbare MonsterArten');
    return ergebnis;
  }

  function ergebnis() {
    if (lauf) return laufBericht(Date.now(), 'laeuft', 'Zwischenstand waehrend des laufenden Tests.');
    return letzterBericht;
  }

  const api = Object.freeze({
    version: VERSION,
    sichtbareMonsterArten,
    starte,
    status,
    ergebnis,
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
    schritt1: 'V4Block6SchattenRanger.sichtbareMonsterArten()',
    schritt2: 'V4Block6SchattenRanger.starte(["MONSTER_ART"])',
    standardDauerMinuten: STANDARD_DAUER / 60000,
    stop: 'V4Block6SchattenRanger.stoppe("Grund")',
    ergebnis: 'V4Block6SchattenRanger.ergebnis()',
    sicherheit: 'Read-only; keine Adventure-Land-Spielaktionen.'
  }, 'Block-6-Ranger-Schattenlauf bereit');
})();
