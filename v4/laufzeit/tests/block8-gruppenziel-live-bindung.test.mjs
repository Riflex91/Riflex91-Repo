import test from 'node:test';
import assert from 'node:assert/strict';
import { AktionsSteuerung } from '../../erzeugt/kern/aktions-steuerung.js';
import {
  AdventureLandGruppenZielLiveBindung,
  GRUPPEN_ZIEL_LIVE_BINDUNG_FREIGABE_TEXT
} from '../../erzeugt/ausfuehrung/adventure-land-gruppen-ziel-live-bindung.js';

const GLOBAL = 'V4Block8GruppenZielAusfuehrungsBruecke';

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

function auftrag(kennung = anfrage().kennung, aenderungen = {}) {
  return Object.freeze({
    schemaVersion: 1,
    aktionsKennung: kennung,
    aktionsName: 'GRUPPE_GEMEINSAMES_ZIEL_BEARBEITEN',
    zielKennung: 'goo-1',
    freigabeText: 'BLOCK8-GRUPPENZIEL-EINMAL-FREIGEBEN',
    freigegebenAm: 10_050,
    sicherheitsAuswertungAm: 10_055,
    angriffsBereitschaft: Object.freeze({ zustand: 'bereit', quelle: 'browser-vorschau' }),
    zielPruefung: Object.freeze({ zielKennung: 'goo-1', angeblichSicher: true }),
    ...aenderungen
  });
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

function spiel(aufrufe, browserKontext) {
  const ziel = { id: 'goo-1', hp: 100, real_x: 50, real_y: 0, map: 'main' };
  return {
    ziel,
    fenster: {
      character: { hp: 500, real_x: 0, real_y: 0, range: 100, map: 'main', rip: false },
      entities: { 'goo-1': ziel },
      is_on_cooldown: () => false,
      attack(wert) {
        aufrufe.push(['attack', wert]);
        assert.equal(Object.prototype.hasOwnProperty.call(browserKontext, GLOBAL), false);
      }
    }
  };
}

test('Block-8-Gruppenziel-Live-Bindung ist standardmaessig gesperrt und exponiert nichts', () => {
  const browser = {};
  const aufrufe = [];
  const { fenster } = spiel(aufrufe, browser);
  const bindung = new AdventureLandGruppenZielLiveBindung(
    fenster,
    starte(),
    () => sicherheit(),
    () => 10_060
  );

  assert.throws(() => bindung.installiere(browser, GRUPPEN_ZIEL_LIVE_BINDUNG_FREIGABE_TEXT), /standardmaessig gesperrt/);
  assert.equal(Object.prototype.hasOwnProperty.call(browser, GLOBAL), false);
  assert.equal(bindung.status().installiert, false);
  assert.equal(aufrufe.length, 0);
});

test('Block-8-Gruppenziel-Live-Bindung verlangt exakten eigenen Freigabetext und ueberschreibt keine bestehende Autoritaet', () => {
  const browser = {};
  const { fenster } = spiel([], browser);
  const bindung = new AdventureLandGruppenZielLiveBindung(
    fenster,
    starte(),
    () => sicherheit(),
    () => 10_060,
    { aktivFreigegeben: true }
  );

  assert.throws(() => bindung.installiere(browser, 'JA'), /Falscher Live-Bindungs-Freigabetext/);
  browser[GLOBAL] = Object.freeze({ fremd: true });
  assert.throws(
    () => bindung.installiere(browser, GRUPPEN_ZIEL_LIVE_BINDUNG_FREIGABE_TEXT),
    /bestehende Laufzeitautoritaet wird nicht ueberschrieben/
  );
  assert.deepEqual(browser[GLOBAL], { fremd: true });
});

test('Block-8-Gruppenziel-Live-Bindung exponiert nur die feste eingefrorene ausfuehrung-Fassade und liest Safety noch nicht', () => {
  const browser = {};
  const aufrufe = [];
  const { fenster } = spiel(aufrufe, browser);
  let safetyAufrufe = 0;
  const bindung = new AdventureLandGruppenZielLiveBindung(
    fenster,
    starte(),
    () => { safetyAufrufe += 1; return sicherheit(); },
    () => 10_060,
    { aktivFreigegeben: true }
  );

  const fassade = bindung.installiere(browser, GRUPPEN_ZIEL_LIVE_BINDUNG_FREIGABE_TEXT);
  assert.equal(browser[GLOBAL], fassade);
  assert.equal(Object.isFrozen(fassade), true);
  assert.equal(fassade.quelleBereich, 'ausfuehrung');
  assert.equal(fassade.aktionsName, 'GRUPPE_GEMEINSAMES_ZIEL_BEARBEITEN');
  assert.equal(typeof fassade.fuehreEinmalAus, 'function');
  assert.equal(safetyAufrufe, 0);
  assert.equal(bindung.status().installiert, true);
  assert.equal(bindung.status().versuchVerbraucht, false);
  assert.equal(aufrufe.length, 0);
});

test('Block-8-Gruppenziel-Live-Bindung entfernt die globale Fassade vor Delegation und nutzt frische Produktions-Safety', async () => {
  const browser = {};
  const aufrufe = [];
  const { fenster, ziel } = spiel(aufrufe, browser);
  const req = anfrage();
  const steuerung = starte(req);
  let safetyAufrufe = 0;
  const bindung = new AdventureLandGruppenZielLiveBindung(
    fenster,
    steuerung,
    () => {
      safetyAufrufe += 1;
      assert.equal(Object.prototype.hasOwnProperty.call(browser, GLOBAL), false);
      return sicherheit(10_060);
    },
    zeiten(10_060, 10_061, 10_062, 10_063),
    { aktivFreigegeben: true }
  );

  const fassade = bindung.installiere(browser, GRUPPEN_ZIEL_LIVE_BINDUNG_FREIGABE_TEXT);
  const ergebnis = await fassade.fuehreEinmalAus(auftrag(req.kennung));

  assert.equal(safetyAufrufe, 1);
  assert.deepEqual(aufrufe, [['attack', ziel]]);
  assert.equal(Object.prototype.hasOwnProperty.call(browser, GLOBAL), false);
  assert.equal(bindung.status().installiert, false);
  assert.equal(bindung.status().versuchVerbraucht, true);
  assert.equal(ergebnis.versuchVerbraucht, true);
  assert.equal(steuerung.holeAktionsZustand(req.kennung)?.phase, 'abgeschlossen');
  assert.equal(steuerung.listeRessourcenSperren().length, 0);
});

test('Block-8-Gruppenziel-Live-Bindung bleibt nach fehlgeschlagener Produktions-Safety entfernt und bricht zentral ab', async () => {
  const browser = {};
  const aufrufe = [];
  const { fenster } = spiel(aufrufe, browser);
  const req = anfrage();
  const steuerung = starte(req);
  const unsicher = sicherheit(10_060, {
    normalAktionenErlaubt: false,
    art: 'rueckzug',
    gefahrenBewertung: Object.freeze({ ...sicherheit(10_060).gefahrenBewertung, stufe: 'gefaehrlich' })
  });
  const bindung = new AdventureLandGruppenZielLiveBindung(
    fenster,
    steuerung,
    () => unsicher,
    zeiten(10_060, 10_061, 10_062, 10_063),
    { aktivFreigegeben: true }
  );
  const fassade = bindung.installiere(browser, GRUPPEN_ZIEL_LIVE_BINDUNG_FREIGABE_TEXT);

  await assert.rejects(() => fassade.fuehreEinmalAus(auftrag(req.kennung)), /keine normale Gruppenzielaktion/);
  assert.equal(Object.prototype.hasOwnProperty.call(browser, GLOBAL), false);
  assert.equal(bindung.status().versuchVerbraucht, true);
  assert.equal(steuerung.holeAktionsZustand(req.kennung)?.phase, 'abgebrochen');
  assert.equal(steuerung.listeRessourcenSperren().length, 0);
  assert.equal(aufrufe.length, 0);
});

test('Block-8-Gruppenziel-Live-Bindung kann ueber eine behaltene Fassade niemals zweimal delegieren', async () => {
  const browser = {};
  const aufrufe = [];
  const { fenster } = spiel(aufrufe, browser);
  const req = anfrage();
  const steuerung = starte(req);
  const bindung = new AdventureLandGruppenZielLiveBindung(
    fenster,
    steuerung,
    () => sicherheit(10_060),
    zeiten(10_060, 10_061, 10_062, 10_063),
    { aktivFreigegeben: true }
  );
  const fassade = bindung.installiere(browser, GRUPPEN_ZIEL_LIVE_BINDUNG_FREIGABE_TEXT);

  await fassade.fuehreEinmalAus(auftrag(req.kennung));
  await assert.rejects(() => fassade.fuehreEinmalAus(auftrag(req.kennung)), /bereits verbraucht/);
  assert.equal(aufrufe.length, 1);
});

test('Block-8-Gruppenziel-Live-Bindung blockiert bei ersetzter globaler Fassade vor Adventure-Land-Aktion und gibt zentrale Ressourcen frei', async () => {
  const browser = {};
  const aufrufe = [];
  const { fenster } = spiel(aufrufe, browser);
  const req = anfrage();
  const steuerung = starte(req);
  const bindung = new AdventureLandGruppenZielLiveBindung(
    fenster,
    steuerung,
    () => sicherheit(10_060),
    zeiten(10_060, 10_061, 10_062),
    { aktivFreigegeben: true }
  );
  const fassade = bindung.installiere(browser, GRUPPEN_ZIEL_LIVE_BINDUNG_FREIGABE_TEXT);

  Object.defineProperty(browser, GLOBAL, {
    configurable: true,
    enumerable: true,
    writable: true,
    value: Object.freeze({ manipuliert: true })
  });

  await assert.rejects(() => fassade.fuehreEinmalAus(auftrag(req.kennung)), /unerwartet ersetzt/);
  assert.deepEqual(browser[GLOBAL], { manipuliert: true });
  assert.equal(steuerung.holeAktionsZustand(req.kennung)?.phase, 'abgebrochen');
  assert.equal(steuerung.listeRessourcenSperren().length, 0);
  assert.equal(aufrufe.length, 0);
});

test('Block-8-Gruppenziel-Live-Bindung kann vor einem Versuch manuell wieder gesperrt werden', async () => {
  const browser = {};
  const aufrufe = [];
  const { fenster } = spiel(aufrufe, browser);
  const req = anfrage();
  const steuerung = starte(req);
  const bindung = new AdventureLandGruppenZielLiveBindung(
    fenster,
    steuerung,
    () => sicherheit(10_060),
    () => 10_060,
    { aktivFreigegeben: true }
  );
  const fassade = bindung.installiere(browser, GRUPPEN_ZIEL_LIVE_BINDUNG_FREIGABE_TEXT);

  const status = bindung.sperre();
  assert.equal(status.installiert, false);
  assert.equal(status.versuchVerbraucht, false);
  assert.equal(Object.prototype.hasOwnProperty.call(browser, GLOBAL), false);
  await assert.rejects(() => fassade.fuehreEinmalAus(auftrag(req.kennung)), /keine vollstaendig installierte Produktionsbruecke/);
  assert.equal(aufrufe.length, 0);
});
