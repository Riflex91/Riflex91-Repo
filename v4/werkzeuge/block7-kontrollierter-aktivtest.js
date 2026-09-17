(() => {
  'use strict';

  const API_NAME = 'V4Block7Aktivtest';
  const VERSION = '1.0.0';
  const FREIGABE_TEXT = 'BLOCK7-AKTIVTEST-FREIGEBEN';
  const FREIGABE_DAUER_MS = 120000;
  const MAXIMALE_TESTDISTANZ = 20;
  const BEOBACHTUNGS_DAUER_MS = 5000;
  const BEOBACHTUNGS_INTERVALL_MS = 250;
  const MINDEST_BEWEGUNG = 1;

  let freigegebenBis = 0;
  let letzterBericht = null;

  function holeElternFenster() {
    try {
      if (typeof parent !== 'undefined' && parent && parent !== globalThis) return parent;
    } catch {
      // Kein nutzbarer Parent-Kontext.
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
      // Fallback auf lokalen Codekontext.
    }
    try {
      if (name in globalThis) return globalThis[name];
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
      // Diagnose darf den Test nicht beeinflussen.
    }
  }

  function endlicheZahl(wert) {
    return typeof wert === 'number' && Number.isFinite(wert) ? wert : null;
  }

  function position(objekt) {
    if (!objekt || typeof objekt !== 'object') return null;
    const x = endlicheZahl(objekt.real_x) ?? endlicheZahl(objekt.x);
    const y = endlicheZahl(objekt.real_y) ?? endlicheZahl(objekt.y);
    return x === null || y === null ? null : [x, y];
  }

  function charakter() {
    return holeSpielWert('character') ?? null;
  }

  function istRangerBereit() {
    const c = charakter();
    return Boolean(c && c.ctype === 'ranger' && c.rip !== true && position(c));
  }

  function aktiveAngreifer() {
    const c = charakter();
    const entities = holeSpielWert('entities');
    if (!c || !entities || typeof entities !== 'object') return [];
    const zielKennungen = new Set([c.id, c.name].filter((wert) => wert !== null && wert !== undefined).map(String));
    const liste = [];
    for (const entity of Object.values(entities)) {
      if (!entity || typeof entity !== 'object') continue;
      if (entity.type !== 'monster' && !entity.mtype) continue;
      if (entity.dead === true || Number(entity.hp) <= 0) continue;
      if (!zielKennungen.has(String(entity.target ?? ''))) continue;
      if (c.map && entity.map && c.map !== entity.map) continue;
      const pos = position(entity);
      if (!pos) continue;
      liste.push({
        id: String(entity.id ?? ''),
        mtype: entity.mtype ?? null,
        position: pos,
        hp: endlicheZahl(entity.hp)
      });
    }
    liste.sort((a, b) => a.id.localeCompare(b.id));
    return liste;
  }

  function normalisiereArt(art) {
    if (art === 'rueckzug' || art === 'abstand') return art;
    throw new Error('Testart muss "rueckzug" oder "abstand" sein.');
  }

  function normalisiereDistanz(distanz) {
    const wert = Number(distanz);
    if (!Number.isFinite(wert) || wert <= 0 || wert > MAXIMALE_TESTDISTANZ) {
      throw new Error(`Testdistanz muss groesser 0 und hoechstens ${MAXIMALE_TESTDISTANZ} sein.`);
    }
    return wert;
  }

  function baueVorschau(art = 'rueckzug', distanz = 12) {
    const testArt = normalisiereArt(art);
    const testDistanz = normalisiereDistanz(distanz);
    const c = charakter();
    if (!c) throw new Error('Adventure Land liefert aktuell keinen Charakter.');
    if (c.ctype !== 'ranger') throw new Error(`Der Block-7-Aktivtest ist fuer Ranger vorgesehen; erkannt wurde ${String(c.ctype)}.`);
    if (c.rip === true) throw new Error('Der Charakter ist nicht lebend testbereit.');
    if (c.moving === true) throw new Error('Der Charakter bewegt sich bereits; Aktivtest wird nicht gestartet.');
    const cPos = position(c);
    if (!cPos) throw new Error('Charakterposition ist nicht sicher lesbar.');

    const angreifer = aktiveAngreifer();
    if (angreifer.length === 0) {
      throw new Error('Kein sichtbares Monster greift den Ranger aktuell an; es wird keine Testbewegung erfunden.');
    }

    const mittelX = angreifer.reduce((summe, eintrag) => summe + eintrag.position[0], 0) / angreifer.length;
    const mittelY = angreifer.reduce((summe, eintrag) => summe + eintrag.position[1], 0) / angreifer.length;
    const dx = cPos[0] - mittelX;
    const dy = cPos[1] - mittelY;
    const laenge = Math.hypot(dx, dy);
    if (!Number.isFinite(laenge) || laenge <= 0) throw new Error('Rueckzugsrichtung ist nicht eindeutig; Aktivtest wird blockiert.');

    const ziel = [
      cPos[0] + (dx / laenge) * testDistanz,
      cPos[1] + (dy / laenge) * testDistanz
    ];
    return Object.freeze({
      art: testArt,
      distanz: testDistanz,
      startPosition: Object.freeze([...cPos]),
      zielPosition: Object.freeze(ziel),
      angreifer: Object.freeze(angreifer.map((eintrag) => Object.freeze({ ...eintrag, position: Object.freeze([...eintrag.position]) })))
    });
  }

  function istFreigegeben() {
    return Date.now() <= freigegebenBis;
  }

  function status() {
    const c = charakter();
    return Object.freeze({
      version: VERSION,
      freigegeben: istFreigegeben(),
      freigabeRestMillisekunden: Math.max(0, freigegebenBis - Date.now()),
      rangerBereit: istRangerBereit(),
      charakter: c ? { name: c.name ?? null, klasse: c.ctype ?? null, rip: c.rip === true, bewegung: c.moving === true, position: position(c) } : null,
      aktiveAngreifer: aktiveAngreifer(),
      maximaleTestdistanz: MAXIMALE_TESTDISTANZ,
      echteSpielaktionenMoeglich: ['move'],
      letzterBerichtVorhanden: letzterBericht !== null
    });
  }

  function freigeben(text) {
    if (text !== FREIGABE_TEXT) throw new Error(`Falscher Freigabetext. Erwartet wird exakt: ${FREIGABE_TEXT}`);
    if (!istRangerBereit()) throw new Error('Ranger ist aktuell nicht sicher fuer den Aktivtest bereit.');
    const move = holeSpielWert('move');
    if (typeof move !== 'function') throw new Error('Adventure-Land-Funktion move ist nicht verfuegbar.');
    freigegebenBis = Date.now() + FREIGABE_DAUER_MS;
    const ergebnis = status();
    ausgeben(ergebnis, 'Block 7 Aktivtest · freigegeben');
    return ergebnis;
  }

  function sperren() {
    freigegebenBis = 0;
    const ergebnis = status();
    ausgeben(ergebnis, 'Block 7 Aktivtest · gesperrt');
    return ergebnis;
  }

  function vorschau(art = 'rueckzug', distanz = 12) {
    const ergebnis = baueVorschau(art, distanz);
    ausgeben(ergebnis, 'Block 7 Aktivtest · Vorschau (read-only)');
    return ergebnis;
  }

  function warte(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function starte(art = 'rueckzug', distanz = 12) {
    if (!istFreigegeben()) throw new Error('Block-7-Aktivtest ist gesperrt oder die Freigabe ist abgelaufen.');
    const plan = baueVorschau(art, distanz);
    const move = holeSpielWert('move');
    if (typeof move !== 'function') throw new Error('Adventure-Land-Funktion move ist nicht verfuegbar.');

    // One-shot: Nach genau einem freigegebenen Bewegungsaufruf sofort wieder sperren.
    freigegebenBis = 0;
    const gestartetAm = Date.now();
    Reflect.apply(move, holeSpielFenster(), [plan.zielPosition[0], plan.zielPosition[1]]);

    let beobachtetePosition = plan.startPosition;
    let bewegungBeobachtet = false;
    while (Date.now() - gestartetAm < BEOBACHTUNGS_DAUER_MS) {
      await warte(BEOBACHTUNGS_INTERVALL_MS);
      const aktuell = position(charakter());
      if (!aktuell) continue;
      beobachtetePosition = aktuell;
      if (Math.hypot(aktuell[0] - plan.startPosition[0], aktuell[1] - plan.startPosition[1]) >= MINDEST_BEWEGUNG) {
        bewegungBeobachtet = true;
        break;
      }
    }

    letzterBericht = Object.freeze({
      schemaVersion: 1,
      werkzeug: API_NAME,
      version: VERSION,
      art: plan.art,
      status: bewegungBeobachtet ? 'bestanden' : 'blockiert_oder_unbeobachtet',
      gestartetAm,
      beendetAm: Date.now(),
      startPosition: plan.startPosition,
      zielPosition: plan.zielPosition,
      beobachtetePosition: Object.freeze([...beobachtetePosition]),
      angeforderteDistanz: plan.distanz,
      beobachteteBewegung: Math.hypot(beobachtetePosition[0] - plan.startPosition[0], beobachtetePosition[1] - plan.startPosition[1]),
      bewegungBeobachtet,
      angreifer: plan.angreifer,
      echteSpielaktionen: Object.freeze({ move: 1, sonstige: 0 }),
      automatischWiederGesperrt: true,
      hinweis: bewegungBeobachtet
        ? 'Eine einzelne, vom Angreifer weg gerichtete Sicherheitsbewegung wurde beobachtet.'
        : 'Es wurde genau ein move angefordert, aber innerhalb des Beobachtungsfensters keine ausreichende Positionsaenderung erkannt.'
    });
    ausgeben(letzterBericht, 'Block 7 Aktivtest · Ergebnis');
    return letzterBericht;
  }

  function ergebnis() {
    return letzterBericht;
  }

  const api = Object.freeze({
    version: VERSION,
    status,
    freigeben,
    sperren,
    vorschau,
    starte,
    ergebnis,
    freigabeText() { return FREIGABE_TEXT; }
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
    status: 'V4Block7Aktivtest.status()',
    vorschau: 'V4Block7Aktivtest.vorschau("rueckzug", 12)',
    freigabe: `V4Block7Aktivtest.freigeben("${FREIGABE_TEXT}")`,
    start: 'await V4Block7Aktivtest.starte("rueckzug", 12)',
    sperren: 'V4Block7Aktivtest.sperren()',
    sicherheit: `One-shot; maximal ${MAXIMALE_TESTDISTANZ} Einheiten; nur move; kein Angriff, Skill, Heal oder Loot.`
  }, 'Block-7-kontrollierter Aktivtest bereit');
})();
