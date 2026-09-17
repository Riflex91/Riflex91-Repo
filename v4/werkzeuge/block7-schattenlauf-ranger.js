(() => {
  'use strict';

  const API_NAME = 'V4Block7SchattenRanger';
  const VERSION = '1.0.0';
  const STANDARD_DAUER = 30 * 60 * 1000;
  const STANDARD_INTERVALL = 1000;
  const STANDARD_ZWISCHENBERICHT = 5 * 60 * 1000;
  const MAX_EREIGNISSE = 1000;
  const AKTIONS_GUELTIGKEIT = 2500;

  let lauf = null;
  let letzterBericht = null;

  function holeElternFenster() {
    try {
      if (typeof parent !== 'undefined' && parent && parent !== globalThis) return parent;
    } catch {
      // Fallback auf lokalen Adventure-Land-Codekontext.
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
      // Fallback auf globalThis.
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
    if (!api?.ausgeben) throw new Error('Zuerst v4/werkzeuge/adventure-land-testkonsole.js laden.');
    return api;
  }

  function aktualisiereTitel(text) {
    try {
      const dokument = holeElternFenster()?.document ?? globalThis.document;
      const titel = dokument?.getElementById('v4-adventure-land-testkonsole')?.querySelector('.v4tk-titel');
      if (titel) titel.textContent = text;
    } catch {
      // Eine rein visuelle Anzeige darf den Test nicht beeinflussen.
    }
  }

  function formatiereRestzeit(restMillisekunden) {
    const gesamtSekunden = Math.max(0, Math.ceil(restMillisekunden / 1000));
    const minuten = Math.floor(gesamtSekunden / 60);
    const sekunden = gesamtSekunden % 60;
    return `${String(minuten).padStart(2, '0')}:${String(sekunden).padStart(2, '0')}`;
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

  function anteil(name, wert, standard) {
    const ergebnis = wert ?? standard;
    if (!Number.isFinite(ergebnis) || ergebnis < 0 || ergebnis > 1) throw new Error(`${name} muss zwischen 0 und 1 liegen.`);
    return ergebnis;
  }

  function positiveGanzzahl(name, wert, standard) {
    const ergebnis = wert ?? standard;
    if (!Number.isSafeInteger(ergebnis) || ergebnis < 1) throw new Error(`${name} muss eine positive ganze Zahl sein.`);
    return ergebnis;
  }

  function normalisiereMonsterArten(monsterArten) {
    if (!Array.isArray(monsterArten)) throw new Error('monsterArten muss ein Array sein.');
    const werte = [...new Set(monsterArten.map((wert) => String(wert).trim()).filter(Boolean))].sort();
    if (werte.length === 0) throw new Error('Mindestens eine ausdruecklich erlaubte MonsterArt ist erforderlich.');
    return Object.freeze(werte);
  }

  function erstelleKonfiguration(monsterArten, optionen = {}) {
    const kritisch = anteil('kritischUnterLebensAnteil', optionen.kritischUnterLebensAnteil, 0.25);
    const rueckzug = anteil('rueckzugUnterLebensAnteil', optionen.rueckzugUnterLebensAnteil, 0.45);
    if (kritisch > rueckzug) throw new Error('kritischUnterLebensAnteil darf nicht groesser als rueckzugUnterLebensAnteil sein.');
    return Object.freeze({
      monsterArten: normalisiereMonsterArten(monsterArten),
      lebenWiederherstellenUnter: anteil('lebenWiederherstellenUnter', optionen.lebenWiederherstellenUnter, 0.5),
      manaWiederherstellenUnter: anteil('manaWiederherstellenUnter', optionen.manaWiederherstellenUnter, 0.3),
      reichweitenPuffer: nichtnegativeZahl('reichweitenPuffer', optionen.reichweitenPuffer, 5),
      mindestensFreieInventarPlaetze: positiveGanzzahl('mindestensFreieInventarPlaetze', optionen.mindestensFreieInventarPlaetze, 1),
      stillstandNachMillisekunden: positiveZahl('stillstandNachMillisekunden', optionen.stillstandNachMillisekunden, 15000),
      rueckzugUnterLebensAnteil: rueckzug,
      kritischUnterLebensAnteil: kritisch,
      mindestensManaAnteilImKampf: anteil('mindestensManaAnteilImKampf', optionen.mindestensManaAnteilImKampf, 0.12),
      maximalAngreifer: positiveGanzzahl('maximalAngreifer', optionen.maximalAngreifer, 2),
      mindestAbstandFaktor: positiveZahl('mindestAbstandFaktor', optionen.mindestAbstandFaktor, 0.55),
      rueckzugDistanz: positiveZahl('rueckzugDistanz', optionen.rueckzugDistanz, 160),
      maxAktionsBereitschaftAlterMillisekunden: positiveZahl('maxAktionsBereitschaftAlterMillisekunden', optionen.maxAktionsBereitschaftAlterMillisekunden, 500),
      dauerMillisekunden: positiveZahl('dauerMillisekunden', optionen.dauerMillisekunden, STANDARD_DAUER),
      intervallMillisekunden: positiveZahl('intervallMillisekunden', optionen.intervallMillisekunden, STANDARD_INTERVALL),
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
        echtY: endlicheZahl(entity.real_y),
        ziel: kennungOderNull(entity.target)
      }))
      .sort((a, b) => a.kennung.localeCompare(b.kennung));
  }

  function leseSnapshot(zeitpunkt) {
    const charakter = holeSpielWert('character');
    const snapshot = {
      zeitpunkt,
      charakter: null,
      inventar: null,
      monster: leseMonster(holeSpielWert('entities'))
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

  function entfernung(a, b) {
    return Math.hypot(a[0] - b[0], a[1] - b[1]);
  }

  function istLebend(monster) {
    if (monster.tot === true) return false;
    if (monster.leben !== null && monster.leben <= 0) return false;
    return monster.tot === false || (monster.leben !== null && monster.leben > 0);
  }

  function lebensAnteil(charakter) {
    return charakter?.leben !== null && charakter?.lebenMaximal !== null && charakter?.lebenMaximal > 0
      ? charakter.leben / charakter.lebenMaximal : null;
  }

  function manaAnteil(charakter) {
    return charakter?.mana !== null && charakter?.manaMaximal !== null && charakter?.manaMaximal > 0
      ? charakter.mana / charakter.manaMaximal : null;
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
    const belegt = Array.isArray(snapshot.inventar)
      ? snapshot.inventar.reduce((summe, platz) => summe + (platz && platz !== undefined ? 1 : 0), 0)
      : 'inventar-unbekannt';
    const charakterTeil = [
      charakter.erfahrung, charakter.gold, charakter.leben, charakter.mana,
      charakter.echtX ?? charakter.x, charakter.echtY ?? charakter.y, belegt
    ].map((wert) => wert === null || wert === undefined ? 'unbekannt' : String(wert)).join(':');
    const monsterTeil = (snapshot.monster ?? []).map((monster) => [
      monster.kennung, monster.leben, monster.echtX ?? monster.x, monster.echtY ?? monster.y, monster.tot, monster.ziel
    ].map((wert) => wert === null || wert === undefined ? 'unbekannt' : String(wert)).join(':')).sort().join('|');
    return `${charakterTeil}#${monsterTeil}`;
  }

  function aktualisiereFarmFortschritt(snapshot, zustand, jetzt) {
    const kennung = fortschrittsKennung(snapshot);
    return {
      ...zustand,
      letzterFortschrittAm: kennung === zustand.letzteFortschrittsKennung ? zustand.letzterFortschrittAm : jetzt,
      letzteFortschrittsKennung: kennung
    };
  }

  function angreifer(snapshot) {
    const charakter = snapshot.charakter;
    if (!charakter || !Array.isArray(snapshot.monster)) return [];
    return snapshot.monster.filter((monster) =>
      istLebend(monster) &&
      monster.ziel !== null &&
      (monster.ziel === charakter.kennung || monster.ziel === charakter.name) &&
      (!charakter.karte || !monster.karte || charakter.karte === monster.karte)
    );
  }

  function planeSicherheit(snapshot, konfiguration, laufendeNummer, ablaufKennung, jetzt) {
    const charakter = snapshot.charakter;
    const leerBewertung = { stufe: 'unbekannt', gruende: [], angreiferKennungen: [], lebensAnteil: null, manaAnteil: null, naechsterAngreiferAbstand: null, mindestAbstand: null };
    if (!charakter) return { art: 'blockiert', grund: 'Charakterdaten fehlen.', normalAktionenErlaubt: false, bewertung: { ...leerBewertung, gruende: ['CHARAKTER_UNBEKANNT'] }, aktionsAnfrage: null, meldungsCode: 'KAMPF_SICHERHEIT_DATEN_FEHLEN' };
    if (charakter.tot !== false) return { art: 'blockiert', grund: 'Lebender Charakterzustand ist nicht bestaetigt.', normalAktionenErlaubt: false, bewertung: { ...leerBewertung, stufe: 'kritisch', gruende: ['CHARAKTER_NICHT_LEBEND_BESTAETIGT'] }, aktionsAnfrage: null, meldungsCode: 'KAMPF_CHARAKTER_NICHT_BEREIT' };

    const hp = lebensAnteil(charakter);
    const mp = manaAnteil(charakter);
    if (hp === null || mp === null) return { art: 'blockiert', grund: 'Lebens- oder Manaanteil ist unbekannt.', normalAktionenErlaubt: false, bewertung: { ...leerBewertung, lebensAnteil: hp, manaAnteil: mp, gruende: ['RESSOURCENDATEN_UNBEKANNT'] }, aktionsAnfrage: null, meldungsCode: 'KAMPF_SICHERHEIT_DATEN_FEHLEN' };

    const aktiveAngreifer = angreifer(snapshot);
    const charakterPosition = position(charakter);
    const bekannteAbstaende = charakterPosition
      ? aktiveAngreifer.map(position).filter(Boolean).map((wert) => entfernung(charakterPosition, wert))
      : [];
    const naechsterAbstand = bekannteAbstaende.length > 0 ? Math.min(...bekannteAbstaende) : null;
    const mindestAbstand = charakter.reichweite !== null ? charakter.reichweite * konfiguration.mindestAbstandFaktor : null;
    const gruende = [];
    if (aktiveAngreifer.length > 0 && hp <= konfiguration.kritischUnterLebensAnteil) gruende.push('LEBEN_KRITISCH');
    else if (aktiveAngreifer.length > 0 && hp <= konfiguration.rueckzugUnterLebensAnteil) gruende.push('LEBEN_NIEDRIG_IM_KAMPF');
    if (aktiveAngreifer.length > 0 && mp <= konfiguration.mindestensManaAnteilImKampf) gruende.push('MANA_NIEDRIG_IM_KAMPF');
    if (aktiveAngreifer.length > konfiguration.maximalAngreifer) gruende.push('ZU_VIELE_ANGREIFER');
    if (aktiveAngreifer.length > 0 && naechsterAbstand !== null && mindestAbstand !== null && naechsterAbstand < mindestAbstand) gruende.push('ABSTAND_ZU_KLEIN');

    let stufe = 'sicher';
    if (gruende.includes('ABSTAND_ZU_KLEIN')) stufe = 'angespannt';
    if (gruende.some((grund) => ['LEBEN_NIEDRIG_IM_KAMPF', 'MANA_NIEDRIG_IM_KAMPF', 'ZU_VIELE_ANGREIFER'].includes(grund))) stufe = 'gefaehrlich';
    if (gruende.includes('LEBEN_KRITISCH')) stufe = 'kritisch';
    const bewertung = {
      stufe,
      gruende,
      angreiferKennungen: aktiveAngreifer.map((monster) => monster.kennung),
      lebensAnteil: hp,
      manaAnteil: mp,
      naechsterAngreiferAbstand: naechsterAbstand,
      mindestAbstand
    };
    if (stufe === 'sicher') return { art: 'keine', grund: 'Keine aktive Kampfgefahr.', normalAktionenErlaubt: true, bewertung, aktionsAnfrage: null, meldungsCode: null };

    const positionen = aktiveAngreifer.map(position).filter(Boolean);
    if (!charakterPosition || positionen.length === 0) return { art: 'blockiert', grund: 'Sicherer Rueckzugsvektor kann nicht bestimmt werden.', normalAktionenErlaubt: false, bewertung, aktionsAnfrage: null, meldungsCode: 'KAMPF_RUECKZUG_ZIEL_UNBEKANNT' };
    const mittelX = positionen.reduce((summe, wert) => summe + wert[0], 0) / positionen.length;
    const mittelY = positionen.reduce((summe, wert) => summe + wert[1], 0) / positionen.length;
    const dx = charakterPosition[0] - mittelX;
    const dy = charakterPosition[1] - mittelY;
    const laenge = Math.hypot(dx, dy);
    if (laenge === 0) return { art: 'blockiert', grund: 'Rueckzugsvektor ist nicht eindeutig.', normalAktionenErlaubt: false, bewertung, aktionsAnfrage: null, meldungsCode: 'KAMPF_RUECKZUG_ZIEL_UNBEKANNT' };
    const ziel = [
      charakterPosition[0] + (dx / laenge) * konfiguration.rueckzugDistanz,
      charakterPosition[1] + (dy / laenge) * konfiguration.rueckzugDistanz
    ];
    const rueckzug = stufe === 'gefaehrlich' || stufe === 'kritisch';
    const art = rueckzug ? 'rueckzug' : 'abstand_herstellen';
    return {
      art,
      grund: rueckzug ? 'Gefahr erfordert sofortigen Rueckzug.' : 'Sicherheitsabstand soll hergestellt werden.',
      normalAktionenErlaubt: false,
      bewertung,
      meldungsCode: rueckzug ? 'KAMPF_RUECKZUG' : null,
      aktionsAnfrage: {
        kennung: `${ablaufKennung}:kampfsicherheit:${laufendeNummer}:${art}`,
        angefordertVon: 'kampfsicherheit',
        aktion: rueckzug ? 'KAMPF_RUECKZUG' : 'KAMPF_ABSTAND_HERSTELLEN',
        wichtigkeit: rueckzug ? 'notfall' : 'sicherheit',
        prioritaet: rueckzug ? 1000 : 700,
        angefordertAm: jetzt,
        gueltigBis: jetzt + AKTIONS_GUELTIGKEIT,
        benoetigteRessourcen: ['bewegung', 'kampfziel'],
        grund: rueckzug ? 'Kampfsicherheit fordert sofortigen Rueckzug an.' : 'Kampfsicherheit stellt sicheren Abstand her.',
        details: { x: ziel[0], y: ziel[1], grundCode: gruende[0] ?? 'ABSTAND_ZU_KLEIN', angreiferKennungen: bewertung.angreiferKennungen }
      }
    };
  }

  function istLebendesErlaubtesMonster(monster, erlaubteArten) {
    return Boolean(monster.kennung && monster.monsterArt && erlaubteArten.has(monster.monsterArt) && istLebend(monster));
  }

  function waehleZiel(charakter, monster, konfiguration) {
    const charakterPosition = position(charakter);
    if (!charakterPosition || !charakter.karte) return null;
    const erlaubteArten = new Set(konfiguration.monsterArten);
    const kandidaten = monster.filter((eintrag) =>
      istLebendesErlaubtesMonster(eintrag, erlaubteArten) && eintrag.karte === charakter.karte && position(eintrag) !== null
    );
    kandidaten.sort((a, b) => {
      const ad = entfernung(position(a), charakterPosition);
      const bd = entfernung(position(b), charakterPosition);
      return ad !== bd ? ad - bd : a.kennung.localeCompare(b.kennung);
    });
    return kandidaten[0] ?? null;
  }

  function farmAnfrage(laufendeNummer, ablaufKennung, jetzt, art, aktion, ressourcen, grund, details) {
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

  function planeFarm(snapshot, konfiguration, vorherigerZustand, laufendeNummer, ablaufKennung, jetzt) {
    let zustand = aktualisiereFarmFortschritt(snapshot, vorherigerZustand, jetzt);
    const charakter = snapshot.charakter;
    if (!charakter) return { art: 'blockiert', grund: 'Charakterzustand ist unbekannt.', zielKennung: null, aktionsAnfrage: null, meldungsCode: 'FARM_VORAUSSETZUNG_FEHLT', naechsterAblaufZustand: zustand };
    if (charakter.tot !== false) return { art: 'blockiert', grund: 'Lebender Charakterzustand ist nicht bestaetigt.', zielKennung: null, aktionsAnfrage: null, meldungsCode: 'FARM_CHARAKTER_NICHT_BEREIT', naechsterAblaufZustand: zustand };
    const hp = lebensAnteil(charakter);
    const mp = manaAnteil(charakter);
    if (hp === null || mp === null) return { art: 'blockiert', grund: 'Lebens- oder Manaanteil ist unbekannt.', zielKennung: null, aktionsAnfrage: null, meldungsCode: 'FARM_RESSOURCENDATEN_FEHLEN', naechsterAblaufZustand: zustand };
    if (hp < konfiguration.lebenWiederherstellenUnter) {
      const grund = 'Lebenswiederherstellung ist vor normalem Kampf erforderlich.';
      return { art: 'leben_wiederherstellen', grund, zielKennung: null, aktionsAnfrage: farmAnfrage(laufendeNummer, ablaufKennung, jetzt, 'leben_wiederherstellen', 'FARM_LEBEN_WIEDERHERSTELLEN', ['inventar'], grund, { anteil: hp, schwelle: konfiguration.lebenWiederherstellenUnter }), meldungsCode: null, naechsterAblaufZustand: zustand };
    }
    if (mp < konfiguration.manaWiederherstellenUnter) {
      const grund = 'Manawiederherstellung ist vor normalem Kampf erforderlich.';
      return { art: 'mana_wiederherstellen', grund, zielKennung: null, aktionsAnfrage: farmAnfrage(laufendeNummer, ablaufKennung, jetzt, 'mana_wiederherstellen', 'FARM_MANA_WIEDERHERSTELLEN', ['inventar'], grund, { anteil: mp, schwelle: konfiguration.manaWiederherstellenUnter }), meldungsCode: null, naechsterAblaufZustand: zustand };
    }
    const frei = freieInventarPlaetze(snapshot);
    if (frei === null) return { art: 'blockiert', grund: 'Freie Inventarplaetze sind unbekannt.', zielKennung: null, aktionsAnfrage: null, meldungsCode: 'FARM_INVENTAR_UNBEKANNT', naechsterAblaufZustand: zustand };
    if (frei < konfiguration.mindestensFreieInventarPlaetze) return { art: 'blockiert', grund: 'Inventargrenze erreicht.', zielKennung: null, aktionsAnfrage: null, meldungsCode: 'FARM_INVENTAR_VOLL', naechsterAblaufZustand: zustand };
    if (!Array.isArray(snapshot.monster)) return { art: 'blockiert', grund: 'Monsterdaten sind unbekannt.', zielKennung: null, aktionsAnfrage: null, meldungsCode: 'FARM_MONSTERDATEN_FEHLEN', naechsterAblaufZustand: zustand };

    if (zustand.letzteZielKennung !== null) {
      const erlaubteArten = new Set(konfiguration.monsterArten);
      const lebt = snapshot.monster.some((monster) => monster.kennung === zustand.letzteZielKennung && istLebendesErlaubtesMonster(monster, erlaubteArten));
      if (!lebt) {
        const vorherigeZielKennung = zustand.letzteZielKennung;
        zustand = { ...zustand, letzteZielKennung: null };
        const grund = 'Vorheriges Ziel ist verschwunden; vorhandene Beute wuerde aufgenommen.';
        return { art: 'beute_aufnehmen', grund, zielKennung: null, aktionsAnfrage: farmAnfrage(laufendeNummer, ablaufKennung, jetzt, 'beute_aufnehmen', 'FARM_BEUTE_AUFNEHMEN', ['inventar'], grund, { vorherigeZielKennung }), meldungsCode: null, naechsterAblaufZustand: zustand };
      }
    }

    const ziel = waehleZiel(charakter, snapshot.monster, konfiguration);
    if (!ziel) {
      const stillstand = jetzt - zustand.letzterFortschrittAm >= konfiguration.stillstandNachMillisekunden;
      return { art: 'warten', grund: 'Kein passendes sichtbares Farmziel.', zielKennung: null, aktionsAnfrage: null, meldungsCode: stillstand ? 'FARM_STILLSTAND' : 'FARM_KEIN_ZIEL', naechsterAblaufZustand: zustand };
    }
    const cp = position(charakter);
    const zp = position(ziel);
    if (!cp || !zp || charakter.reichweite === null || charakter.reichweite < 0) return { art: 'blockiert', grund: 'Position oder Reichweite ist unbekannt.', zielKennung: ziel.kennung, aktionsAnfrage: null, meldungsCode: 'FARM_POSITIONS_DATEN_FEHLEN', naechsterAblaufZustand: zustand };
    zustand = { ...zustand, letzteZielKennung: ziel.kennung };
    const abstand = entfernung(cp, zp);
    const sichereReichweite = Math.max(0, charakter.reichweite - konfiguration.reichweitenPuffer);
    const stillstand = jetzt - zustand.letzterFortschrittAm >= konfiguration.stillstandNachMillisekunden;
    if (abstand > sichereReichweite) {
      const grund = 'Farmziel liegt ausserhalb der sicheren Angriffsreichweite.';
      return { art: 'bewegen', grund, zielKennung: ziel.kennung, aktionsAnfrage: farmAnfrage(laufendeNummer, ablaufKennung, jetzt, 'bewegen', 'FARM_BEWEGEN', ['bewegung', 'kampfziel'], grund, { zielKennung: ziel.kennung, x: zp[0], y: zp[1] }), meldungsCode: stillstand ? 'FARM_STILLSTAND' : null, naechsterAblaufZustand: zustand };
    }
    const grund = 'Farmziel liegt innerhalb der sicheren Angriffsreichweite.';
    return { art: 'angreifen', grund, zielKennung: ziel.kennung, aktionsAnfrage: farmAnfrage(laufendeNummer, ablaufKennung, jetzt, 'angreifen', 'FARM_ANGREIFEN', ['kampfziel'], grund, { zielKennung: ziel.kennung }), meldungsCode: stillstand ? 'FARM_STILLSTAND' : null, naechsterAblaufZustand: zustand };
  }

  function liesAngriffsBereitschaft(zeitpunkt) {
    const spielFenster = holeSpielFenster();
    let funktion;
    try {
      funktion = spielFenster.ms_to_next_skill;
    } catch {
      funktion = undefined;
    }
    if (typeof funktion !== 'function') return { aufgenommenAm: zeitpunkt, aktionsName: 'attack', zustand: 'unbekannt', bereitAb: null, restMillisekunden: null, grund: 'ms_to_next_skill ist nicht verfuegbar.' };
    try {
      const rohwert = Reflect.apply(funktion, spielFenster, ['attack']);
      if (typeof rohwert !== 'number' || !Number.isFinite(rohwert)) return { aufgenommenAm: zeitpunkt, aktionsName: 'attack', zustand: 'unbekannt', bereitAb: null, restMillisekunden: null, grund: 'ms_to_next_skill lieferte keinen endlichen Zahlenwert.' };
      const rest = Math.max(0, rohwert);
      return { aufgenommenAm: zeitpunkt, aktionsName: 'attack', zustand: rest > 0 ? 'abklingzeit' : 'bereit', bereitAb: zeitpunkt + rest, restMillisekunden: rest, grund: rest > 0 ? 'Normaler Angriff ist noch in Abklingzeit.' : 'Normaler Angriff ist bereit.' };
    } catch (fehler) {
      return { aufgenommenAm: zeitpunkt, aktionsName: 'attack', zustand: 'unbekannt', bereitAb: null, restMillisekunden: null, grund: fehler instanceof Error ? fehler.message : String(fehler) };
    }
  }

  function planeSicherenSchritt(snapshot, konfiguration, farmZustand, laufendeNummer, ablaufKennung, jetzt) {
    const sicherheit = planeSicherheit(snapshot, konfiguration, laufendeNummer, ablaufKennung, jetzt);
    const bereitschaft = liesAngriffsBereitschaft(jetzt);
    if (!sicherheit.normalAktionenErlaubt) {
      return {
        art: sicherheit.art === 'rueckzug' ? 'kampfsicherheit_rueckzug' : sicherheit.art === 'abstand_herstellen' ? 'kampfsicherheit_abstand' : 'kampfsicherheit_blockiert',
        grund: sicherheit.grund,
        aktionsAnfrage: sicherheit.aktionsAnfrage,
        meldungsCode: sicherheit.meldungsCode,
        zielKennung: null,
        sicherheit,
        farm: null,
        bereitschaft,
        naechsterFarmZustand: farmZustand
      };
    }
    const farm = planeFarm(snapshot, konfiguration, farmZustand, laufendeNummer, ablaufKennung, jetzt);
    if (farm.art === 'angreifen') {
      if (bereitschaft.zustand === 'unbekannt') return { art: 'blockiert_bereitschaft', grund: bereitschaft.grund, aktionsAnfrage: null, meldungsCode: 'KAMPF_AKTIONSBEREITSCHAFT_UNBEKANNT', zielKennung: farm.zielKennung, sicherheit, farm, bereitschaft, naechsterFarmZustand: farmZustand };
      if (bereitschaft.bereitAb > jetzt) return { art: 'abklingzeit', grund: 'Normaler Angriff ist noch in Abklingzeit.', aktionsAnfrage: null, meldungsCode: null, zielKennung: farm.zielKennung, sicherheit, farm, bereitschaft, naechsterFarmZustand: farmZustand };
    }
    return { art: `farm_${farm.art}`, grund: farm.grund, aktionsAnfrage: farm.aktionsAnfrage, meldungsCode: farm.meldungsCode, zielKennung: farm.zielKennung, sicherheit, farm, bereitschaft, naechsterFarmZustand: farm.naechsterAblaufZustand };
  }

  function erhoehe(zaehler, schluessel) {
    const key = schluessel ?? 'null';
    zaehler[key] = (zaehler[key] ?? 0) + 1;
  }

  function fuegeEreignisHinzu(eintrag) {
    if (lauf.ereignisse.length >= MAX_EREIGNISSE) {
      lauf.ereignisse.shift();
      lauf.verloreneEreignisse += 1;
    }
    lauf.ereignisse.push(eintrag);
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

  function protokolliere(snapshot, plan) {
    lauf.anzahlSchritte += 1;
    lauf.farmZustand = plan.naechsterFarmZustand;
    erhoehe(lauf.aktionsZaehler, plan.art);
    erhoehe(lauf.sicherheitsZaehler, plan.sicherheit.art);
    erhoehe(lauf.bereitschaftZaehler, plan.bereitschaft.zustand);
    if (plan.farm) erhoehe(lauf.farmZaehler, plan.farm.art);
    for (const grund of plan.sicherheit.bewertung?.gruende ?? []) erhoehe(lauf.gefahrenGrundZaehler, grund);
    if (plan.meldungsCode) erhoehe(lauf.meldungsZaehler, plan.meldungsCode);
    if (plan.meldungsCode === 'FARM_STILLSTAND') lauf.stillstaende += 1;

    const signatur = `${plan.art}|${plan.zielKennung ?? ''}|${plan.meldungsCode ?? ''}|${(plan.sicherheit.bewertung?.gruende ?? []).join(',')}`;
    if (signatur === lauf.letzteEntscheidungsSignatur) return;
    lauf.letzteEntscheidungsSignatur = signatur;
    const ereignis = {
      zeitpunkt: snapshot.zeitpunkt,
      art: plan.art,
      grund: plan.grund,
      zielKennung: plan.zielKennung,
      meldungsCode: plan.meldungsCode,
      gefahrenStufe: plan.sicherheit.bewertung?.stufe ?? null,
      gefahrenGruende: plan.sicherheit.bewertung?.gruende ?? [],
      angriffsBereitschaft: plan.bereitschaft,
      schattenAnfrage: plan.aktionsAnfrage ? {
        aktion: plan.aktionsAnfrage.aktion,
        wichtigkeit: plan.aktionsAnfrage.wichtigkeit,
        ressourcen: plan.aktionsAnfrage.benoetigteRessourcen,
        details: plan.aktionsAnfrage.details
      } : null
    };
    fuegeEreignisHinzu(ereignis);
    holeKonsole().ausgeben(ereignis, `Block 7 Schatten · ${plan.art}`);
  }

  function laufBericht(zeitpunkt, status, grund) {
    const endeSnapshot = leseSnapshot(zeitpunkt);
    const startCharakter = lauf.startSnapshot.charakter;
    const endeCharakter = endeSnapshot.charakter;
    return {
      schemaVersion: 1,
      werkzeug: API_NAME,
      version: VERSION,
      status,
      grund,
      modus: 'block6_7_schatten',
      charakterKlasse: endeCharakter?.klasse ?? startCharakter?.klasse ?? null,
      gestartetAm: lauf.gestartetAm,
      beendetAm: zeitpunkt,
      dauerMillisekunden: zeitpunkt - lauf.gestartetAm,
      vorgesehenMillisekunden: lauf.konfiguration.dauerMillisekunden,
      konfiguration: { ...lauf.konfiguration },
      anzahlSchritte: lauf.anzahlSchritte,
      aktionsZaehler: { ...lauf.aktionsZaehler },
      sicherheitsZaehler: { ...lauf.sicherheitsZaehler },
      farmZaehler: { ...lauf.farmZaehler },
      bereitschaftZaehler: { ...lauf.bereitschaftZaehler },
      gefahrenGrundZaehler: { ...lauf.gefahrenGrundZaehler },
      meldungsZaehler: { ...lauf.meldungsZaehler },
      stillstaende: lauf.stillstaende,
      fehler: [...lauf.fehler],
      verloreneEreignisse: lauf.verloreneEreignisse,
      ereignisse: [...lauf.ereignisse],
      start: kompakterSnapshot(lauf.startSnapshot),
      ende: kompakterSnapshot(endeSnapshot),
      delta: {
        erfahrung: startCharakter?.erfahrung !== null && startCharakter?.erfahrung !== undefined && endeCharakter?.erfahrung !== null && endeCharakter?.erfahrung !== undefined ? endeCharakter.erfahrung - startCharakter.erfahrung : null,
        gold: startCharakter?.gold !== null && startCharakter?.gold !== undefined && endeCharakter?.gold !== null && endeCharakter?.gold !== undefined ? endeCharakter.gold - startCharakter.gold : null
      },
      sicherheit: {
        echteSpielaktionenAusgefuehrt: false,
        reihenfolge: 'Kampfsicherheit vor Farmplanung; Angriffsbereitschaft vor geplantem Angriff.',
        hinweis: 'Read-only: Sicherheits-, Farm- und Cooldown-Entscheidungen werden nur beobachtet und protokolliert.'
      }
    };
  }

  function beende(status, grund) {
    if (!lauf) return letzterBericht;
    clearInterval(lauf.intervalKennung);
    const zeitpunkt = Date.now();
    letzterBericht = Object.freeze(laufBericht(zeitpunkt, status, grund));
    lauf = null;
    aktualisiereTitel(`Block 7 · Schatten · ${status === 'abgeschlossen' ? 'beendet' : 'gestoppt'}`);
    holeKonsole().ausgeben(letzterBericht, `Block 7 Schattenlauf ${status}`);
    return letzterBericht;
  }

  function tick() {
    if (!lauf) return;
    const jetzt = Date.now();
    try {
      const snapshot = leseSnapshot(jetzt);
      const plan = planeSicherenSchritt(snapshot, lauf.konfiguration, lauf.farmZustand, lauf.laufendeNummer, lauf.ablaufKennung, jetzt);
      lauf.laufendeNummer += 1;
      protokolliere(snapshot, plan);
      if (jetzt >= lauf.naechsterZwischenberichtAm) {
        lauf.naechsterZwischenberichtAm = jetzt + lauf.konfiguration.zwischenberichtMillisekunden;
        holeKonsole().ausgeben({
          restMillisekunden: Math.max(0, lauf.vorgesehenBis - jetzt),
          anzahlSchritte: lauf.anzahlSchritte,
          aktionsZaehler: { ...lauf.aktionsZaehler },
          gefahrenGrundZaehler: { ...lauf.gefahrenGrundZaehler },
          fehlerAnzahl: lauf.fehler.length
        }, 'Block 7 Schatten · Zwischenbericht');
      }
    } catch (fehler) {
      const eintrag = { zeitpunkt: jetzt, meldung: fehler instanceof Error ? fehler.message : String(fehler), stapel: fehler instanceof Error ? fehler.stack ?? null : null };
      lauf.fehler.push(eintrag);
      fuegeEreignisHinzu({ art: 'fehler', ...eintrag });
      holeKonsole().ausgeben(eintrag, 'Block 7 Schatten · Fehler');
    }

    const rest = lauf.vorgesehenBis - jetzt;
    aktualisiereTitel(`Block 7 · Schatten Ranger · Restzeit ${formatiereRestzeit(rest)}`);
    if (rest <= 0) beende('abgeschlossen', `Die konfigurierte Schattenlaufzeit von ${formatDauer(lauf.konfiguration.dauerMillisekunden)} ist abgelaufen.`);
  }

  function starte(monsterArten, optionen = {}) {
    if (lauf) throw new Error('Es laeuft bereits ein Block-7-Ranger-Schattenlauf.');
    const konfiguration = erstelleKonfiguration(monsterArten, optionen);
    const gestartetAm = Date.now();
    const startSnapshot = leseSnapshot(gestartetAm);
    if (!startSnapshot.charakter) throw new Error('Adventure Land liefert aktuell keinen lesbaren Charakter.');
    if (startSnapshot.charakter.klasse !== 'ranger') throw new Error(`Dieses Werkzeug ist fuer den Block-7-Test auf einem Ranger vorgesehen; erkannt wurde ${String(startSnapshot.charakter.klasse)}.`);
    const ablaufKennung = `block7-schatten-ranger-${startSnapshot.charakter.kennung ?? 'unbekannt'}-${gestartetAm}`;
    lauf = {
      konfiguration,
      gestartetAm,
      vorgesehenBis: gestartetAm + konfiguration.dauerMillisekunden,
      naechsterZwischenberichtAm: gestartetAm + konfiguration.zwischenberichtMillisekunden,
      startSnapshot,
      ablaufKennung,
      laufendeNummer: 1,
      farmZustand: {
        schemaVersion: 1,
        gestartetAm,
        letzterFortschrittAm: gestartetAm,
        letzteFortschrittsKennung: fortschrittsKennung(startSnapshot),
        letzteZielKennung: null
      },
      anzahlSchritte: 0,
      aktionsZaehler: {},
      sicherheitsZaehler: {},
      farmZaehler: {},
      bereitschaftZaehler: {},
      gefahrenGrundZaehler: {},
      meldungsZaehler: {},
      stillstaende: 0,
      fehler: [],
      ereignisse: [],
      verloreneEreignisse: 0,
      letzteEntscheidungsSignatur: null,
      intervalKennung: null
    };
    letzterBericht = null;
    holeKonsole().ausgeben({
      modus: 'block6_7_schatten',
      charakter: startSnapshot.charakter.name,
      klasse: startSnapshot.charakter.klasse,
      monsterArten: konfiguration.monsterArten,
      dauerMillisekunden: konfiguration.dauerMillisekunden,
      intervallMillisekunden: konfiguration.intervallMillisekunden,
      reihenfolge: 'Kampfsicherheit -> Farmplanung -> Angriffsbereitschaft',
      hinweis: 'Read-only: Es werden keine Adventure-Land-Spielaktionen ausgefuehrt.'
    }, 'Block 7 Ranger-Schattenlauf gestartet');
    tick();
    if (lauf) lauf.intervalKennung = setInterval(tick, konfiguration.intervallMillisekunden);
    return status();
  }

  function status() {
    if (!lauf) return Object.freeze({ laeuft: false, letzterBerichtVorhanden: letzterBericht !== null });
    return Object.freeze({
      laeuft: true,
      modus: 'block6_7_schatten',
      gestartetAm: lauf.gestartetAm,
      vorgesehenBis: lauf.vorgesehenBis,
      restMillisekunden: Math.max(0, lauf.vorgesehenBis - Date.now()),
      anzahlSchritte: lauf.anzahlSchritte,
      monsterArten: lauf.konfiguration.monsterArten,
      aktionsZaehler: Object.freeze({ ...lauf.aktionsZaehler }),
      gefahrenGrundZaehler: Object.freeze({ ...lauf.gefahrenGrundZaehler }),
      fehlerAnzahl: lauf.fehler.length
    });
  }

  function sichtbareMonsterArten() {
    const monster = leseMonster(holeSpielWert('entities')) ?? [];
    const zaehler = {};
    for (const eintrag of monster) erhoehe(zaehler, eintrag.monsterArt ?? '[mtype fehlt]');
    const ergebnis = Object.entries(zaehler).map(([monsterArt, anzahl]) => ({ monsterArt, anzahl })).sort((a, b) => a.monsterArt.localeCompare(b.monsterArt));
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
    sichtbareMonster: 'V4Block7SchattenRanger.sichtbareMonsterArten()',
    start30Minuten: 'V4Block7SchattenRanger.starte(["goo"])',
    status: 'V4Block7SchattenRanger.status()',
    ergebnis: 'V4Block7SchattenRanger.ergebnis()',
    stop: 'V4Block7SchattenRanger.stoppe("Grund")',
    sicherheit: 'Read-only; Kampfsicherheit wird vor Farmen geplant.'
  }, 'Block-7-Ranger-Schattenlauf bereit');
})();
