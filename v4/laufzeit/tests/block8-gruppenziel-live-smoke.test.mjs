import test from 'node:test';
import assert from 'node:assert/strict';
import { AktionsSteuerung } from '../../erzeugt/kern/aktions-steuerung.js';
import {
  AdventureLandGruppenZielLiveSmoke,
  GRUPPEN_ZIEL_LIVE_SMOKE_FREIGABE_TEXT,
  installiereAdventureLandGruppenZielLiveSmoke
} from '../../erzeugt/ausfuehrung/adventure-land-gruppen-ziel-live-smoke.js';

function anfrage(aenderungen = {}) {
  return Object.freeze({
    kennung: 'gruppenplan:10000:gemeinsames_ziel_bearbeiten:My_Ranger1:goo-1:aktionsanfrage',
    angefordertVon: 'gruppen-aktionsplanung',
    aktion: 'GRUPPE_GEMEINSAMES_ZIEL_BEARBEITEN',
    wichtigkeit: 'normal',
    prioritaet: 400,
    angefordertAm: 10_000,
    gueltigBis: 11_500,
    benoetigteRessourcen: Object.freeze(['gruppe', 'kampfziel']),
    grund: 'Schadensaufgabe folgt dem gemeinsamen Ziel goo-1.',
    details: Object.freeze({
      planZeitpunkt: 10_000,
      planStatus: 'geplant',
      planSchrittKennung: 'gruppenplan:10000:gemeinsames_ziel_bearbeiten:My_Ranger1:goo-1',
      art: 'gemeinsames_ziel_bearbeiten',
      faehigkeit: 'schaden',
      ausfuehrenderTeilnehmerKennung: 'My_Ranger1',
      zielArt: 'gegner',
      zielKennung: 'goo-1'
    }),
    ...aenderungen
  });
}

function sicherheit(zeitpunkt = 10_050, aenderungen = {}) {
  return Object.freeze({
    schemaVersion: 1,
    entscheidungsKennung: `sicherheit-${zeitpunkt}`,
    zeitpunkt,
    art: 'keine',
    grund: 'Keine aktive Kampfgefahr erfordert eine Sicherheitsaktion.',
    normalAktionenErlaubt: true,
    gefahrenBewertung: Object.freeze({
      stufe: 'sicher',
      gruende: Object.freeze([]),
      angreiferKennungen: Object.freeze([]),
      lebensAnteil: 1,
      manaAnteil: 1,
      naechsterAngreiferAbstand: null,
      mindestAbstand: 55
    }),
    aktionsAnfrage: null,
    meldung: null,
    naechsterAblaufZustand: Object.freeze({
      schemaVersion: 1,
      gestartetAm: zeitpunkt,
      letztePositionKennung: '0:0',
      letzterPositionsFortschrittAm: zeitpunkt,
      sicherheitsBewegungAktivSeit: null
    }),
    ...aenderungen
  });
}

function zeiten(...werte) {
  let letzter = werte.at(-1) ?? 0;
  return () => {
    if (werte.length > 0) letzter = werte.shift();
    return letzter;
  };
}

function starte(req = anfrage()) {
  const steuerung = new AktionsSteuerung();
  steuerung.reicheAnfrageEin(req);
  const schritt = steuerung.verarbeiteNaechsteAktion(10_000);
  assert.equal(schritt.art, 'gestartet');
  return steuerung;
}

function umgebung({ attackFehler = false, charakterName = 'My_Ranger1', serverRegion = 'EU', serverKennung = 'I', karte = 'main', instanz = 'main', monsterArt = 'goo' } = {}) {
  const aufrufe = [];
  const zielKontext = {};
  const ziel = { id: 'goo-1', type: 'monster', mtype: monsterArt, hp: 100, dead: false, real_x: 50, real_y: 0, map: karte };
  const spielFenster = {
    character: { id: 'char-1', name: charakterName, hp: 500, max_hp: 500, mp: 300, max_mp: 300, rip: false, real_x: 0, real_y: 0, range: 100, map: karte, in: instanz },
    entities: { 'goo-1': ziel },
    server_region: serverRegion,
    server_identifier: serverKennung,
    is_on_cooldown: () => false,
    attack(wert) {
      aufrufe.push(['attack', wert]);
      if (attackFehler) throw new Error('attack-testfehler');
      return true;
    },
    move() { aufrufe.push(['move']); }
  };
  spielFenster.parent = spielFenster;
  return { aufrufe, zielKontext, ziel, spielFenster };
}

const erwartung = Object.freeze({
  charakterName: 'My_Ranger1',
  serverRegion: 'EU',
  serverKennung: 'I',
  karte: 'main',
  instanz: 'main',
  zielKennung: 'goo-1',
  monsterArt: 'goo'
});

test('Block-8 Gruppenziel Live-Smoke startet standardmaessig gesperrt und Vorschau ist read-only auf realer Zentralsteuerung', () => {
  const u = umgebung();
  const steuerung = starte();
  const smoke = new AdventureLandGruppenZielLiveSmoke(
    u.zielKontext, u.spielFenster, steuerung, () => sicherheit(10_050), () => 10_050, erwartung
  );
  const vorschau = smoke.vorschau();
  assert.equal(vorschau.aktionsKennung, anfrage().kennung);
  assert.equal(vorschau.zielKennung, 'goo-1');
  assert.equal(vorschau.angriffsBereitschaft, 'bereit');
  assert.equal(u.aufrufe.length, 0);
  assert.throws(() => smoke.freigeben(GRUPPEN_ZIEL_LIVE_SMOKE_FREIGABE_TEXT), /standardmaessig gesperrt/);
});

test('Block-8 Gruppenziel Live-Smoke bindet Charakter, Server, Karte, Instanz, Ziel und Monsterart exakt', () => {
  const faelle = [
    ['Charakter', { charakterName: 'Falsch' }, /Charakter stimmt nicht/],
    ['Region', { serverRegion: 'US' }, /Serverregion stimmt nicht/],
    ['Server', { serverKennung: 'II' }, /Serverkennung stimmt nicht/],
    ['Karte', { karte: 'cave' }, /Karte stimmt nicht/],
    ['Instanz', { instanz: 'cave' }, /Instanz stimmt nicht/],
    ['Monster', { monsterArt: 'bee' }, /Monsterart/]
  ];
  for (const [, aenderungen, muster] of faelle) {
    const u = umgebung(aenderungen);
    const smoke = new AdventureLandGruppenZielLiveSmoke(
      u.zielKontext, u.spielFenster, starte(), () => sicherheit(10_050), () => 10_050, erwartung, { aktivFreigegeben: true }
    );
    assert.throws(() => smoke.vorschau(), muster);
    assert.equal(u.aufrufe.length, 0);
  }
});

test('Block-8 Gruppenziel Live-Smoke verlangt genau eine laufende reale Gruppenanfrage und zentralen Ressourcenbesitz', () => {
  const u = umgebung();
  const leer = new AktionsSteuerung();
  const smokeLeer = new AdventureLandGruppenZielLiveSmoke(
    u.zielKontext, u.spielFenster, leer, () => sicherheit(10_050), () => 10_050, erwartung, { aktivFreigegeben: true }
  );
  assert.throws(() => smokeLeer.vorschau(), /genau eine laufende zentrale Gruppenzielanfrage/);

  const steuerung = starte();
  steuerung.listeRessourcenSperren = () => [];
  const smokeOhneRessource = new AdventureLandGruppenZielLiveSmoke(
    u.zielKontext, u.spielFenster, steuerung, () => sicherheit(10_050), () => 10_050, erwartung, { aktivFreigegeben: true }
  );
  assert.throws(() => smokeOhneRessource.vorschau(), /besitzt die Ressource gruppe nicht/);
});

test('Block-8 Gruppenziel Live-Smoke blockiert unsichere oder alte Produktions-Safety und unbekannte Angriffsbereitschaft', () => {
  {
    const u = umgebung();
    const smoke = new AdventureLandGruppenZielLiveSmoke(
      u.zielKontext, u.spielFenster, starte(),
      () => sicherheit(10_050, { normalAktionenErlaubt: false, art: 'rueckzug', gefahrenBewertung: Object.freeze({ ...sicherheit(10_050).gefahrenBewertung, stufe: 'gefaehrlich' }) }),
      () => 10_050, erwartung, { aktivFreigegeben: true }
    );
    assert.throws(() => smoke.vorschau(), /Produktions-Safety gibt den Live-Smoke nicht frei/);
  }
  {
    const u = umgebung();
    const smoke = new AdventureLandGruppenZielLiveSmoke(
      u.zielKontext, u.spielFenster, starte(), () => sicherheit(8_000), () => 10_050, erwartung, { aktivFreigegeben: true }
    );
    assert.throws(() => smoke.vorschau(), /Produktions-Safety ist fuer den Live-Smoke zu alt/);
  }
  {
    const u = umgebung();
    delete u.spielFenster.is_on_cooldown;
    const smoke = new AdventureLandGruppenZielLiveSmoke(
      u.zielKontext, u.spielFenster, starte(), () => sicherheit(10_050), () => 10_050, erwartung, { aktivFreigegeben: true }
    );
    assert.throws(() => smoke.vorschau(), /nicht explizit bereit: unbekannt/);
  }
});

test('Block-8 Gruppenziel Live-Smoke verlangt frische Vorschau und exakten Freigabetext', () => {
  const u = umgebung();
  let jetzt = 10_050;
  const smoke = new AdventureLandGruppenZielLiveSmoke(
    u.zielKontext, u.spielFenster, starte(), () => sicherheit(jetzt), () => jetzt, erwartung, { aktivFreigegeben: true }
  );
  assert.throws(() => smoke.freigeben(GRUPPEN_ZIEL_LIVE_SMOKE_FREIGABE_TEXT), /frische Produktionsvorschau/);
  smoke.vorschau();
  assert.throws(() => smoke.freigeben('JA'), /Falscher Live-Smoke-Freigabetext/);
  jetzt = 15_051;
  assert.throws(() => smoke.freigeben(GRUPPEN_ZIEL_LIVE_SMOKE_FREIGABE_TEXT), /Produktionsvorschau .* zu alt/);
});

test('Block-8 Gruppenziel Live-Smoke fuehrt exakt einen attack aus, entfernt Bruecke und gibt Ressourcen frei', async () => {
  const u = umgebung();
  const req = anfrage();
  const steuerung = starte(req);
  let sicherheitsZeit = 10_050;
  const smoke = new AdventureLandGruppenZielLiveSmoke(
    u.zielKontext,
    u.spielFenster,
    steuerung,
    () => sicherheit(sicherheitsZeit),
    zeiten(10_050, 10_051, 10_052, 10_053, 10_054, 10_055, 10_056),
    erwartung,
    { aktivFreigegeben: true }
  );
  smoke.vorschau();
  smoke.freigeben(GRUPPEN_ZIEL_LIVE_SMOKE_FREIGABE_TEXT);
  sicherheitsZeit = 10_052;
  const bericht = await smoke.starte();

  assert.equal(bericht.status, 'bestanden');
  assert.equal(bericht.echteSpielaktionen.attack, 1);
  assert.equal(bericht.echteSpielaktionen.sonstige, 0);
  assert.deepEqual(u.aufrufe, [['attack', u.ziel]]);
  assert.equal(bericht.ausfuehrungsBrueckeEntfernt, true);
  assert.equal(bericht.zentralePhase, 'abgeschlossen');
  assert.deepEqual(bericht.verbleibendeRessourcen, []);
  assert.equal(smoke.status().freigegeben, false);
  assert.equal(smoke.status().versuchVerbraucht, true);
  assert.equal(Object.prototype.hasOwnProperty.call(u.zielKontext, 'V4Block8GruppenZielAusfuehrungsBruecke'), false);
  await assert.rejects(() => smoke.starte(), /bereits verbraucht/);
});

test('Block-8 Gruppenziel Live-Smoke protokolliert attack-Versuch auch wenn Adventure Land attack fehlschlaegt', async () => {
  const u = umgebung({ attackFehler: true });
  const req = anfrage();
  const steuerung = starte(req);
  const smoke = new AdventureLandGruppenZielLiveSmoke(
    u.zielKontext,
    u.spielFenster,
    steuerung,
    () => sicherheit(10_052),
    zeiten(10_050, 10_051, 10_052, 10_053, 10_054, 10_055, 10_056, 10_057),
    erwartung,
    { aktivFreigegeben: true }
  );
  smoke.vorschau();
  smoke.freigeben(GRUPPEN_ZIEL_LIVE_SMOKE_FREIGABE_TEXT);
  await assert.rejects(
    () => smoke.starte(),
    (fehler) => {
      assert.match(fehler.message, /attack-testfehler/);
      assert.equal(fehler.bericht.status, 'fehlgeschlagen');
      assert.equal(fehler.bericht.echteSpielaktionen.attack, 1);
      assert.equal(fehler.bericht.ausfuehrungsBrueckeEntfernt, true);
      return true;
    }
  );
  assert.equal(steuerung.holeAktionsZustand(req.kennung)?.phase, 'abgebrochen');
  assert.equal(steuerung.listeRessourcenSperren().length, 0);
});

test('Block-8 Gruppenziel Live-Smoke-Fassade ist eingefroren und ueberschreibt keine bestehende Smoke-Autoritaet', () => {
  const u = umgebung();
  const smoke = new AdventureLandGruppenZielLiveSmoke(
    u.zielKontext, u.spielFenster, starte(), () => sicherheit(10_050), () => 10_050, erwartung, { aktivFreigegeben: true }
  );
  const fassade = installiereAdventureLandGruppenZielLiveSmoke(u.zielKontext, smoke);
  assert.equal(fassade.quelleBereich, 'ausfuehrung');
  assert.equal(fassade.modus, 'one-shot-live-smoke');
  assert.equal(Object.isFrozen(fassade), true);
  assert.equal(u.zielKontext.V4Block8GruppenZielLiveSmoke, fassade);
  assert.throws(() => installiereAdventureLandGruppenZielLiveSmoke(u.zielKontext, smoke), /bereits im Zielkontext vorhanden/);
});
