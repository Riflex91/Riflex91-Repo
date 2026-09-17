import test from 'node:test';
import assert from 'node:assert/strict';
import { AktionsSteuerung } from '../../erzeugt/kern/aktions-steuerung.js';
import { AdventureLandFarmAusfuehrung } from '../../erzeugt/ausfuehrung/adventure-land-farm-ausfuehrung.js';

function anfrage(aktion, details, ressourcen = ['kampfziel']) {
  return {
    kennung: `farm-${aktion}`,
    angefordertVon: 'grundlegendes-farmen',
    aktion,
    wichtigkeit: 'normal',
    prioritaet: 100,
    angefordertAm: 1,
    gueltigBis: 100,
    benoetigteRessourcen: ressourcen,
    grund: 'Block-6-Test',
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

test('Aktive Ausfuehrung ist standardmaessig gesperrt', async () => {
  let aufrufe = 0;
  const spiel = { entities: { m1: { id: 'm1' } }, attack() { aufrufe += 1; } };
  const { steuerung, schritt } = starte(anfrage('FARM_ANGREIFEN', { zielKennung: 'm1' }));
  const ausfuehrung = new AdventureLandFarmAusfuehrung(spiel);
  await assert.rejects(() => ausfuehrung.fuehreFreigegebeneAktionAus(schritt, steuerung, () => 11), /nicht ausdruecklich freigegeben/);
  assert.equal(aufrufe, 0);
});

test('Nur zentral gestarteter Angriff in aktueller Reichweite wird an Adventure Land weitergegeben', async () => {
  const aufrufe = [];
  const ziel = { id: 'm1', real_x: 50, real_y: 0 };
  const spiel = {
    character: { real_x: 0, real_y: 0, range: 100 },
    entities: { m1: ziel },
    attack(wert) { aufrufe.push(['attack', wert]); }
  };
  const { steuerung, schritt } = starte(anfrage('FARM_ANGREIFEN', { zielKennung: 'm1' }));
  const ausfuehrung = new AdventureLandFarmAusfuehrung(spiel, { aktivFreigegeben: true });
  const ergebnis = await ausfuehrung.fuehreFreigegebeneAktionAus(schritt, steuerung, () => 11);
  assert.deepEqual(aufrufe, [['attack', ziel]]);
  assert.equal(ergebnis.aktionsName, 'FARM_ANGREIFEN');
  assert.equal(steuerung.holeAktionsZustand('farm-FARM_ANGREIFEN')?.phase, 'abgeschlossen');
  assert.equal(steuerung.listeRessourcenSperren().length, 0);
});

test('Ziel ausserhalb der aktuellen Reichweite wird unmittelbar vor attack sicher abgebrochen', async () => {
  let angriffe = 0;
  const spiel = {
    character: { real_x: 0, real_y: 0, range: 100 },
    entities: { m1: { id: 'm1', real_x: 150, real_y: 0 } },
    attack() { angriffe += 1; }
  };
  const { steuerung, schritt } = starte(anfrage('FARM_ANGREIFEN', { zielKennung: 'm1' }));
  const ausfuehrung = new AdventureLandFarmAusfuehrung(spiel, { aktivFreigegeben: true });

  await assert.rejects(
    () => ausfuehrung.fuehreFreigegebeneAktionAus(schritt, steuerung, () => 11),
    /ausserhalb der aktuellen Angriffsreichweite/
  );
  assert.equal(angriffe, 0);
  assert.equal(steuerung.holeAktionsZustand('farm-FARM_ANGREIFEN')?.phase, 'abgebrochen');
  assert.equal(steuerung.listeRessourcenSperren().length, 0);
});

test('Unbekannte aktuelle Reichweite fuehrt nicht zu einem geratenen Angriff', async () => {
  let angriffe = 0;
  const spiel = {
    character: { real_x: 0, real_y: 0 },
    entities: { m1: { id: 'm1', real_x: 50, real_y: 0 } },
    attack() { angriffe += 1; }
  };
  const { steuerung, schritt } = starte(anfrage('FARM_ANGREIFEN', { zielKennung: 'm1' }));
  const ausfuehrung = new AdventureLandFarmAusfuehrung(spiel, { aktivFreigegeben: true });

  await assert.rejects(
    () => ausfuehrung.fuehreFreigegebeneAktionAus(schritt, steuerung, () => 11),
    /kann nicht sicher geprueft werden/
  );
  assert.equal(angriffe, 0);
});

test('Bewegung, Wiederherstellung und Loot verwenden nur ihre expliziten Block-6-Aufrufe', async () => {
  const aufrufe = [];
  const spiel = {
    entities: {},
    move(x, y) { aufrufe.push(['move', x, y]); },
    use_hp() { aufrufe.push(['use_hp']); },
    use_mp() { aufrufe.push(['use_mp']); },
    loot() { aufrufe.push(['loot']); }
  };
  const faelle = [
    anfrage('FARM_BEWEGEN', { zielKennung: 'm1', x: 12, y: 34 }, ['bewegung', 'kampfziel']),
    anfrage('FARM_LEBEN_WIEDERHERSTELLEN', { anteil: 0.2, schwelle: 0.5 }, ['inventar']),
    anfrage('FARM_MANA_WIEDERHERSTELLEN', { anteil: 0.1, schwelle: 0.3 }, ['inventar']),
    anfrage('FARM_BEUTE_AUFNEHMEN', { vorherigeZielKennung: 'm1' }, ['inventar'])
  ];
  for (let index = 0; index < faelle.length; index += 1) {
    const { steuerung, schritt } = starte({ ...faelle[index], kennung: `fall-${index}` });
    const ausfuehrung = new AdventureLandFarmAusfuehrung(spiel, { aktivFreigegeben: true });
    await ausfuehrung.fuehreFreigegebeneAktionAus(schritt, steuerung, () => 11 + index);
  }
  assert.deepEqual(aufrufe, [
    ['move', 12, 34],
    ['use_hp'],
    ['use_mp'],
    ['loot']
  ]);
});

test('Nicht freigegebene Aktionsnamen werden abgebrochen und geben Ressourcen frei', async () => {
  const { steuerung, schritt } = starte(anfrage('FARM_UNBEKANNT', {}, ['kampfziel']));
  const ausfuehrung = new AdventureLandFarmAusfuehrung({}, { aktivFreigegeben: true });
  await assert.rejects(() => ausfuehrung.fuehreFreigegebeneAktionAus(schritt, steuerung, () => 12), /Nicht freigegebene Farmaktion/);
  assert.equal(steuerung.holeAktionsZustand('farm-FARM_UNBEKANNT')?.phase, 'abgebrochen');
  assert.equal(steuerung.listeRessourcenSperren().length, 0);
});
