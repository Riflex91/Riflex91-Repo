import test from 'node:test';
import assert from 'node:assert/strict';
import { AktionsSteuerung } from '../../erzeugt/kern/aktions-steuerung.js';
import {
  AdventureLandGruppenZielAusfuehrungsBruecke,
  GRUPPEN_ZIEL_AUSFUEHRUNGS_BRUECKEN_NAME
} from '../../erzeugt/ausfuehrung/adventure-land-gruppen-ziel-ausfuehrungs-bruecke.js';

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

function sicherheit(zeitpunkt = 10_060, aenderungen = {}) {
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

function auftrag(aenderungen = {}) {
  return Object.freeze({
    schemaVersion: 1,
    aktionsKennung: anfrage().kennung,
    aktionsName: 'GRUPPE_GEMEINSAMES_ZIEL_BEARBEITEN',
    zielKennung: 'goo-1',
    freigabeText: 'BLOCK8-GRUPPENZIEL-EINMAL-FREIGEBEN',
    freigegebenAm: 10_050,
    sicherheitsAuswertungAm: 10_055,
    angriffsBereitschaft: Object.freeze({ zustand: 'bereit', quelle: 'is_on_cooldown' }),
    zielPruefung: Object.freeze({ zielKennung: 'goo-1' }),
    ...aenderungen
  });
}

function spiel(aufrufe = []) {
  const ziel = { id: 'goo-1', hp: 100, real_x: 50, real_y: 0, map: 'main' };
  return {
    ziel,
    fenster: {
      character: { hp: 500, real_x: 0, real_y: 0, range: 100, map: 'main', rip: false },
      entities: { 'goo-1': ziel },
      is_on_cooldown: () => false,
      attack(wert) { aufrufe.push(['attack', wert]); }
    }
  };
}

function starte(req = anfrage()) {
  const steuerung = new AktionsSteuerung();
  steuerung.reicheAnfrageEin(req);
  const schritt = steuerung.verarbeiteNaechsteAktion(10_000);
  assert.equal(schritt.art, 'gestartet');
  return steuerung;
}

function zeiten(...werte) {
  let letzter = werte.at(-1) ?? 0;
  return () => {
    if (werte.length > 0) letzter = werte.shift();
    return letzter;
  };
}

test('feste Block-8-Gruppenziel-Bruecke ist standardmaessig gesperrt und besitzt den festen ausfuehrung-Vertrag', async () => {
  const aufrufe = [];
  const { fenster } = spiel(aufrufe);
  const steuerung = starte();
  const bruecke = new AdventureLandGruppenZielAusfuehrungsBruecke(
    fenster,
    steuerung,
    () => sicherheit(),
    () => 10_060
  );

  assert.deepEqual(bruecke.status(), {
    schemaVersion: 1,
    name: GRUPPEN_ZIEL_AUSFUEHRUNGS_BRUECKEN_NAME,
    version: '1.0.0',
    quelleBereich: 'ausfuehrung',
    aktionsName: 'GRUPPE_GEMEINSAMES_ZIEL_BEARBEITEN',
    aktivFreigegeben: false,
    versuchVerbraucht: false
  });
  await assert.rejects(() => bruecke.fuehreEinmalAus(auftrag()), /standardmaessig gesperrt/);
  assert.equal(aufrufe.length, 0);
  assert.equal(bruecke.status().versuchVerbraucht, false);
});

test('feste Block-8-Gruppenziel-Bruecke delegiert genau einen passenden Auftrag an den Produktionsadapter', async () => {
  const aufrufe = [];
  const { fenster, ziel } = spiel(aufrufe);
  const req = anfrage();
  const steuerung = starte(req);
  const bruecke = new AdventureLandGruppenZielAusfuehrungsBruecke(
    fenster,
    steuerung,
    () => sicherheit(10_060),
    zeiten(10_060, 10_061, 10_062),
    { aktivFreigegeben: true }
  );

  const ergebnis = await bruecke.fuehreEinmalAus(auftrag());
  assert.deepEqual(aufrufe, [['attack', ziel]]);
  assert.equal(ergebnis.brueckenName, 'V4Block8GruppenZielAusfuehrungsBruecke');
  assert.equal(ergebnis.quelleBereich, 'ausfuehrung');
  assert.equal(ergebnis.aktionsKennung, req.kennung);
  assert.equal(ergebnis.zielKennung, 'goo-1');
  assert.equal(ergebnis.versuchVerbraucht, true);
  assert.equal(bruecke.status().versuchVerbraucht, true);
  assert.equal(steuerung.holeAktionsZustand(req.kennung)?.phase, 'abgeschlossen');
  assert.equal(steuerung.listeRessourcenSperren().length, 0);
});

test('feste Block-8-Gruppenziel-Bruecke erlaubt pro Instanz auch nach Erfolg keinen zweiten Versuch', async () => {
  const aufrufe = [];
  const { fenster } = spiel(aufrufe);
  const req = anfrage();
  const steuerung = starte(req);
  const bruecke = new AdventureLandGruppenZielAusfuehrungsBruecke(
    fenster,
    steuerung,
    () => sicherheit(10_060),
    zeiten(10_060, 10_061, 10_062),
    { aktivFreigegeben: true }
  );

  await bruecke.fuehreEinmalAus(auftrag());
  await assert.rejects(() => bruecke.fuehreEinmalAus(auftrag()), /bereits verbraucht/);
  assert.equal(aufrufe.length, 1);
});

test('feste Block-8-Gruppenziel-Bruecke ignoriert Browser-Vorpruefungen als Autoritaet und blockiert mit aktueller Produktions-Safety', async () => {
  const aufrufe = [];
  const { fenster } = spiel(aufrufe);
  const req = anfrage();
  const steuerung = starte(req);
  const unsicher = sicherheit(10_060, {
    normalAktionenErlaubt: false,
    art: 'rueckzug',
    gefahrenBewertung: Object.freeze({ ...sicherheit(10_060).gefahrenBewertung, stufe: 'gefaehrlich' })
  });
  const bruecke = new AdventureLandGruppenZielAusfuehrungsBruecke(
    fenster,
    steuerung,
    () => unsicher,
    zeiten(10_060, 10_061, 10_062),
    { aktivFreigegeben: true }
  );

  await assert.rejects(
    () => bruecke.fuehreEinmalAus(auftrag({
      angriffsBereitschaft: { zustand: 'bereit' },
      zielPruefung: { angeblichSicher: true }
    })),
    /keine normale Gruppenzielaktion/
  );
  assert.equal(aufrufe.length, 0);
  assert.equal(bruecke.status().versuchVerbraucht, true);
  assert.equal(steuerung.holeAktionsZustand(req.kennung)?.phase, 'abgebrochen');
  assert.equal(steuerung.listeRessourcenSperren().length, 0);
});

test('feste Block-8-Gruppenziel-Bruecke verlangt Safety nach der expliziten One-shot-Freigabe', async () => {
  const aufrufe = [];
  const { fenster } = spiel(aufrufe);
  const req = anfrage();
  const steuerung = starte(req);
  const bruecke = new AdventureLandGruppenZielAusfuehrungsBruecke(
    fenster,
    steuerung,
    () => sicherheit(10_049),
    zeiten(10_060, 10_061),
    { aktivFreigegeben: true }
  );

  await assert.rejects(() => bruecke.fuehreEinmalAus(auftrag()), /aelter als die explizite One-shot-Freigabe/);
  assert.equal(aufrufe.length, 0);
  assert.equal(steuerung.holeAktionsZustand(req.kennung)?.phase, 'abgebrochen');
});

test('feste Block-8-Gruppenziel-Bruecke blockiert falsche Anfrage, falsches Ziel, alten Auftrag und falschen Freigabetext', async () => {
  const faelle = [
    ['falsche-kennung', auftrag({ aktionsKennung: 'nicht-die-laufende-anfrage' }), /aktuell laufende Anfrage/],
    ['falsches-ziel', auftrag({ zielKennung: 'goo-2' }), /passt nicht zum Ziel/],
    ['alter-auftrag', auftrag({ freigegebenAm: 1, sicherheitsAuswertungAm: 2 }), /zu alt/],
    ['falscher-text', auftrag({ freigabeText: 'JA' }), /exakten Block-8-Einmal-Freigabetext/]
  ];

  for (const [name, wert, muster] of faelle) {
    const aufrufe = [];
    const { fenster } = spiel(aufrufe);
    const req = anfrage({ kennung: `gruppe-${name}` });
    const steuerung = starte(req);
    const angepasst = name === 'falsche-kennung' ? wert : Object.freeze({ ...wert, aktionsKennung: req.kennung });
    const bruecke = new AdventureLandGruppenZielAusfuehrungsBruecke(
      fenster,
      steuerung,
      () => sicherheit(10_060),
      zeiten(10_060, 10_061),
      { aktivFreigegeben: true, auftragMaximalAlterMillisekunden: 1_000 }
    );

    await assert.rejects(() => bruecke.fuehreEinmalAus(angepasst), muster);
    assert.equal(aufrufe.length, 0);
    assert.equal(bruecke.status().versuchVerbraucht, true);
    if (name !== 'falsche-kennung') {
      assert.equal(steuerung.holeAktionsZustand(req.kennung)?.phase, 'abgebrochen');
      assert.equal(steuerung.listeRessourcenSperren().length, 0);
    }
  }
});

test('feste Block-8-Gruppenziel-Bruecke blockiert abgelaufene zentrale Anfrage vor attack', async () => {
  const aufrufe = [];
  const { fenster } = spiel(aufrufe);
  const req = anfrage({ gueltigBis: 10_050 });
  const steuerung = starte(req);
  const bruecke = new AdventureLandGruppenZielAusfuehrungsBruecke(
    fenster,
    steuerung,
    () => sicherheit(10_060),
    zeiten(10_060, 10_061),
    { aktivFreigegeben: true }
  );

  await assert.rejects(
    () => bruecke.fuehreEinmalAus(Object.freeze({ ...auftrag(), aktionsKennung: req.kennung })),
    /bereits abgelaufen/
  );
  assert.equal(aufrufe.length, 0);
  assert.equal(steuerung.holeAktionsZustand(req.kennung)?.phase, 'abgebrochen');
  assert.equal(steuerung.listeRessourcenSperren().length, 0);
});
