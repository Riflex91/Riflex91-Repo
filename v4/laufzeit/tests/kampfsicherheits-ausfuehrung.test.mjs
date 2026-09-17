import test from 'node:test';
import assert from 'node:assert/strict';
import { AktionsSteuerung } from '../../erzeugt/kern/aktions-steuerung.js';
import { AdventureLandKampfSicherheitsAusfuehrung } from '../../erzeugt/ausfuehrung/adventure-land-kampfsicherheits-ausfuehrung.js';

function anfrage({ kennung = 'sicherheit-1', aktion = 'KAMPF_RUECKZUG', details = { x: 12, y: 34 } } = {}) {
  return {
    kennung,
    angefordertVon: 'kampfsicherheit',
    aktion,
    wichtigkeit: 'notfall',
    prioritaet: 1000,
    angefordertAm: 1,
    gueltigBis: 100,
    benoetigteRessourcen: ['bewegung', 'kampfziel'],
    grund: 'Block-7-Test',
    details
  };
}

function starte(anfrageWert) {
  const steuerung = new AktionsSteuerung();
  steuerung.reicheAnfrageEin(anfrageWert);
  const schritt = steuerung.verarbeiteNaechsteAktion(10);
  assert.equal(schritt.art, 'gestartet');
  return { steuerung, schritt };
}

test('aktive Kampfsicherheitsausfuehrung ist standardmaessig gesperrt', async () => {
  let bewegt = false;
  const spiel = { move() { bewegt = true; } };
  const { steuerung, schritt } = starte(anfrage());
  const ausfuehrung = new AdventureLandKampfSicherheitsAusfuehrung(spiel);

  await assert.rejects(
    () => ausfuehrung.fuehreFreigegebeneSicherheitsAktionAus(schritt, steuerung, () => 11),
    /nicht ausdruecklich freigegeben/
  );
  assert.equal(bewegt, false);
});

test('zentral gestarteter Notfall-Rueckzug wird genau als move ausgefuehrt', async () => {
  const aufrufe = [];
  const spiel = { move(x, y) { aufrufe.push(['move', x, y]); } };
  const { steuerung, schritt } = starte(anfrage());
  const ausfuehrung = new AdventureLandKampfSicherheitsAusfuehrung(spiel, { aktivFreigegeben: true });

  const ergebnis = await ausfuehrung.fuehreFreigegebeneSicherheitsAktionAus(schritt, steuerung, () => 11);

  assert.deepEqual(aufrufe, [['move', 12, 34]]);
  assert.equal(ergebnis.aktionsName, 'KAMPF_RUECKZUG');
  assert.equal(ergebnis.bewegungGestartetAm, 10);
  assert.equal(steuerung.holeAktionsZustand('sicherheit-1')?.phase, 'abgeschlossen');
  assert.equal(steuerung.listeRessourcenSperren().length, 0);
});

test('Abstandhalten verwendet dieselbe kontrollierte Bewegungsgrenze', async () => {
  const aufrufe = [];
  const spiel = { move(x, y) { aufrufe.push(['move', x, y]); } };
  const { steuerung, schritt } = starte(anfrage({ kennung: 'abstand-1', aktion: 'KAMPF_ABSTAND_HERSTELLEN', details: { x: -5, y: 22 } }));
  const ausfuehrung = new AdventureLandKampfSicherheitsAusfuehrung(spiel, { aktivFreigegeben: true });

  await ausfuehrung.fuehreFreigegebeneSicherheitsAktionAus(schritt, steuerung, () => 12);
  assert.deepEqual(aufrufe, [['move', -5, 22]]);
});

test('fremde Aktionsnamen werden an der Kampfsicherheitsgrenze abgebrochen', async () => {
  const { steuerung, schritt } = starte(anfrage({ aktion: 'FARM_BEWEGEN' }));
  const ausfuehrung = new AdventureLandKampfSicherheitsAusfuehrung({ move() {} }, { aktivFreigegeben: true });

  await assert.rejects(
    () => ausfuehrung.fuehreFreigegebeneSicherheitsAktionAus(schritt, steuerung, () => 13),
    /Nicht freigegebene Kampfsicherheitsaktion/
  );
  assert.equal(steuerung.holeAktionsZustand('sicherheit-1')?.phase, 'abgebrochen');
  assert.equal(steuerung.listeRessourcenSperren().length, 0);
});

test('ungueltige Rueckzugskoordinaten fuehren zu sicherem Abbruch', async () => {
  const { steuerung, schritt } = starte(anfrage({ details: { x: Number.NaN, y: 4 } }));
  const ausfuehrung = new AdventureLandKampfSicherheitsAusfuehrung({ move() {} }, { aktivFreigegeben: true });

  await assert.rejects(
    () => ausfuehrung.fuehreFreigegebeneSicherheitsAktionAus(schritt, steuerung, () => 14),
    /endliche x-\/y-Koordinaten/
  );
  assert.equal(steuerung.holeAktionsZustand('sicherheit-1')?.phase, 'abgebrochen');
});
