(() => {
  'use strict';

  const API_NAME = 'V4Block7KampfsicherheitsQuelle';
  const VERSION = '1.0.0';
  const QUELL_BLOB_SHA = '7052173c43b7b1d6f46ff727ceb3c22d70768764';
  const STANDARD_KONFIGURATION = Object.freeze({
    rueckzugUnterLebensAnteil: 0.45,
    kritischUnterLebensAnteil: 0.25,
    mindestensManaAnteilImKampf: 0.12,
    maximalAngreifer: 2,
    mindestAbstandFaktor: 0.55
  });

  function holeElternFenster() {
    try {
      if (typeof parent !== 'undefined' && parent && parent !== globalThis) return parent;
    } catch {
      // Kein nutzbarer Parent-Kontext.
    }
    return null;
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

  function ausgeben(wert, titel) {
    try {
      const konsole = globalThis.V4Testkonsole ?? holeElternFenster()?.V4Testkonsole;
      if (konsole?.ausgeben) konsole.ausgeben(wert, titel);
      else console.log(titel, wert);
    } catch {
      // Diagnose darf die Sicherheitsbewertung nicht beeinflussen.
    }
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

  function position(objekt) {
    const x = endlicheZahl(objekt?.real_x) ?? endlicheZahl(objekt?.x);
    const y = endlicheZahl(objekt?.real_y) ?? endlicheZahl(objekt?.y);
    return x === null || y === null ? null : [x, y];
  }

  function entfernung(a, b) {
    return Math.hypot(a[0] - b[0], a[1] - b[1]);
  }

  function anteil(wert, maximal) {
    const a = endlicheZahl(wert);
    const b = endlicheZahl(maximal);
    if (a === null || b === null || b <= 0) return null;
    return Math.max(0, Math.min(1, a / b));
  }

  function istLebend(monster) {
    if (!monster || typeof monster !== 'object') return false;
    if (monster.dead === true) return false;
    const leben = endlicheZahl(monster.hp);
    if (leben !== null && leben <= 0) return false;
    return monster.dead === false || (leben !== null && leben > 0);
  }

  function leseMonster() {
    const entities = holeSpielWert('entities');
    if (!entities || typeof entities !== 'object') return [];
    return Object.entries(entities)
      .filter(([, entity]) => entity && typeof entity === 'object' && entity.type === 'monster')
      .map(([id, entity]) => ({ id: kennungOderNull(entity.id) ?? String(id), roh: entity }))
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  function angreiferFuerCharakter(charakter) {
    const charakterKennung = kennungOderNull(charakter?.id);
    const charakterName = textOderNull(charakter?.name);
    const charakterKarte = textOderNull(charakter?.map);
    if (!charakterKennung && !charakterName) return [];

    return leseMonster().filter(({ roh }) => {
      if (!istLebend(roh)) return false;
      const ziel = kennungOderNull(roh.target);
      if (ziel === null || (ziel !== charakterKennung && ziel !== charakterName)) return false;
      const karte = textOderNull(roh.map);
      if (charakterKarte !== null && karte !== null && karte !== charakterKarte) return false;
      return true;
    });
  }

  function leereBewertung(stufe, gruende, lebensAnteil = null, manaAnteil = null) {
    return Object.freeze({
      stufe,
      gruende: Object.freeze([...gruende]),
      angreiferKennungen: Object.freeze([]),
      lebensAnteil,
      manaAnteil,
      naechsterAngreiferAbstand: null,
      mindestAbstand: null
    });
  }

  function bewerteGefahr(charakter, konfiguration) {
    if (!charakter || typeof charakter !== 'object') {
      return leereBewertung('unbekannt', ['CHARAKTER_UNBEKANNT']);
    }

    if (charakter.rip !== false) {
      return leereBewertung(
        'kritisch',
        ['CHARAKTER_NICHT_LEBEND_BESTAETIGT'],
        anteil(charakter.hp, charakter.max_hp),
        anteil(charakter.mp, charakter.max_mp)
      );
    }

    const lebensAnteil = anteil(charakter.hp, charakter.max_hp);
    const manaAnteil = anteil(charakter.mp, charakter.max_mp);
    const charakterPosition = position(charakter);
    const reichweite = endlicheZahl(charakter.range);
    const angreifer = angreiferFuerCharakter(charakter);
    const angreiferKennungen = angreifer.map((eintrag) => eintrag.id);
    const abstaende = charakterPosition
      ? angreifer.map((eintrag) => position(eintrag.roh)).filter(Boolean).map((wert) => entfernung(charakterPosition, wert))
      : [];
    const naechsterAngreiferAbstand = abstaende.length > 0 ? Math.min(...abstaende) : null;
    const mindestAbstand = reichweite !== null ? reichweite * konfiguration.mindestAbstandFaktor : null;
    const gruende = [];

    if (angreifer.length > 0 && lebensAnteil !== null && lebensAnteil <= konfiguration.kritischUnterLebensAnteil) {
      gruende.push('LEBEN_KRITISCH');
    } else if (angreifer.length > 0 && lebensAnteil !== null && lebensAnteil <= konfiguration.rueckzugUnterLebensAnteil) {
      gruende.push('LEBEN_NIEDRIG_IM_KAMPF');
    }
    if (angreifer.length > 0 && manaAnteil !== null && manaAnteil <= konfiguration.mindestensManaAnteilImKampf) {
      gruende.push('MANA_NIEDRIG_IM_KAMPF');
    }
    if (angreifer.length > konfiguration.maximalAngreifer) gruende.push('ZU_VIELE_ANGREIFER');
    if (angreifer.length > 0 && naechsterAngreiferAbstand !== null && mindestAbstand !== null && naechsterAngreiferAbstand < mindestAbstand) {
      gruende.push('ABSTAND_ZU_KLEIN');
    }

    let stufe = 'sicher';
    if (lebensAnteil === null || manaAnteil === null) stufe = 'unbekannt';
    if (gruende.includes('ABSTAND_ZU_KLEIN')) stufe = 'angespannt';
    if (gruende.some((grund) => grund === 'LEBEN_NIEDRIG_IM_KAMPF' || grund === 'MANA_NIEDRIG_IM_KAMPF' || grund === 'ZU_VIELE_ANGREIFER')) stufe = 'gefaehrlich';
    if (gruende.includes('LEBEN_KRITISCH')) stufe = 'kritisch';

    return Object.freeze({
      stufe,
      gruende: Object.freeze(gruende),
      angreiferKennungen: Object.freeze(angreiferKennungen),
      lebensAnteil,
      manaAnteil,
      naechsterAngreiferAbstand,
      mindestAbstand
    });
  }

  function bewerte() {
    const ausgewertetAm = Date.now();
    const charakter = holeSpielWert('character');
    const gefahrenBewertung = bewerteGefahr(charakter, STANDARD_KONFIGURATION);
    return Object.freeze({
      schemaVersion: 1,
      werkzeug: API_NAME,
      version: VERSION,
      ausgewertetAm,
      quellDatei: 'v4/laufzeit/quelle/spiellogik/kampfsicherheit.ts',
      quellBlobSha: QUELL_BLOB_SHA,
      gefahrenBewertung,
      echteSpielaktionenAusgefuehrt: false
    });
  }

  const api = Object.freeze({
    version: VERSION,
    quellBlobSha: QUELL_BLOB_SHA,
    bewerte
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
    quellBlobSha: QUELL_BLOB_SHA,
    hinweis: 'Read-only Block-7-Kampfsicherheitsquelle fuer Block 8; keine Adventure-Land-Spielaktion wird ausgefuehrt.',
    pruefen: 'V4Block7KampfsicherheitsQuelle.bewerte()'
  }, 'Block-7-Kampfsicherheitsquelle bereit');
})();
