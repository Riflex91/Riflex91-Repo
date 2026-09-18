import test from 'node:test';
import assert from 'node:assert/strict';
import { AktionsSteuerung } from '../../erzeugt/kern/aktions-steuerung.js';
import { RessourcenVergabe } from '../../erzeugt/kern/ressourcen-vergabe.js';
import {
  AdventureLandGruppenZielAusfuehrung,
  AdventureLandGruppenZielEinmalFreigabe,
  GRUPPEN_ZIEL_EINMAL_FREIGABE_TEXT
} from '../../erzeugt/ausfuehrung/adventure-land-gruppen-ziel-ausfuehrung.js';

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

function sicherheit(aenderungen = {}) {
  return Object.freeze({
    schemaVersion: 1,
    entscheidungsKennung: 'sicherheit-10000',
    zeitpunkt: 10_000,
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
      gestartetAm: 10_000,
      letztePositionKennung: '0:0',
      letzterPositionsFortschrittAm: 10_000,
      sicherheitsBewegungAktivSeit: null
    }),
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

function starte(anfrageWert = anfrage(), ressourcenVergabe = undefined) {
  const steuerung = new AktionsSteuerung(ressourcenVergabe ? { ressourcenVergabe } : {});
  steuerung.reicheAnfrageEin(anfrageWert);
  const schritt = steuerung.verarbeiteNaechsteAktion(10_000);
  assert.equal(schritt.art, 'gestartet');
  return { steuerung, schritt };
}

function mitEinmalFreigabe(fenster, aktionsKennung, erteiltAm = 10_000, optionen = {}) {
  const einmalFreigabe = new AdventureLandGruppenZielEinmalFreigabe(optionen.dauerMillisekunden);
  einmalFreigabe.erteile(GRUPPEN_ZIEL_EINMAL_FREIGABE_TEXT, aktionsKennung, erteiltAm);
  const ausfuehrung = new AdventureLandGruppenZielAusfuehrung(fenster, {
    aktivFreigegeben: true,
    einmalFreigabe,
    sicherheitsMaximalAlterMillisekunden: optionen.sicherheitsMaximalAlterMillisekunden
  });
  return { ausfuehrung, einmalFreigabe };
}

test('Block 8 Gruppenziel-Ausfuehrung: aktive Ausfuehrung ist standardmaessig gesperrt und bleibt Schatten', async () => {
  const aufrufe = [];
  const { fenster } = spiel(aufrufe);
  const { steuerung, schritt } = starte();
  const ausfuehrung = new AdventureLandGruppenZielAusfuehrung(fenster);
  await assert.rejects(
    () => ausfuehrung.fuehreFreigegebeneGruppenZielAktionAus(schritt, steuerung, sicherheit(), () => 10_050),
    /nicht ausdruecklich freigegeben/
  );
  assert.equal(aufrufe.length, 0);
  assert.equal(steuerung.holeAktionsZustand(anfrage().kennung)?.phase, 'laeuft');
  assert.equal(steuerung.listeSchattenProtokoll()[0]?.phase, 'laeuft');
});

test('Block 8 Gruppenziel-Ausfuehrung: aktiver Adapter ohne Einmal-Freigabe bricht zentral ab', async () => {
  const aufrufe = [];
  const { fenster } = spiel(aufrufe);
  const { steuerung, schritt } = starte();
  const ausfuehrung = new AdventureLandGruppenZielAusfuehrung(fenster, { aktivFreigegeben: true });
  const zeiten = [10_050, 10_051];
  await assert.rejects(
    () => ausfuehrung.fuehreFreigegebeneGruppenZielAktionAus(schritt, steuerung, sicherheit(), () => zeiten.shift()),
    /gebundene Einmal-Freigabe/
  );
  assert.equal(aufrufe.length, 0);
  assert.equal(steuerung.holeAktionsZustand(anfrage().kennung)?.phase, 'abgebrochen');
  assert.equal(steuerung.listeRessourcenSperren().length, 0);
});

test('Block 8 Gruppenziel-Ausfuehrung: Einmal-Freigabe verlangt exakten Text und bindet sich an genau eine Anfrage', () => {
  const gate = new AdventureLandGruppenZielEinmalFreigabe();
  assert.throws(() => gate.erteile('ja', anfrage().kennung, 10_000), /Falscher Einmal-Freigabetext/);
  const status = gate.erteile(GRUPPEN_ZIEL_EINMAL_FREIGABE_TEXT, anfrage().kennung, 10_000);
  assert.equal(status.freigegeben, true);
  assert.equal(status.aktionsKennung, anfrage().kennung);
  assert.equal(status.restMillisekunden, 30_000);
});

test('Block 8 Gruppenziel-Ausfuehrung: exakt freigegebener gemeinsamer Angriff erreicht attack genau einmal und sperrt vorher wieder', async () => {
  const aufrufe = [];
  const { fenster, ziel } = spiel(aufrufe);
  const req = anfrage();
  const { steuerung, schritt } = starte(req);
  const { ausfuehrung, einmalFreigabe } = mitEinmalFreigabe(fenster, req.kennung);
  const zeiten = [10_050, 10_060];
  const ergebnis = await ausfuehrung.fuehreFreigegebeneGruppenZielAktionAus(schritt, steuerung, sicherheit(), () => zeiten.shift());
  assert.deepEqual(aufrufe, [['attack', ziel]]);
  assert.equal(ergebnis.aktionsName, 'GRUPPE_GEMEINSAMES_ZIEL_BEARBEITEN');
  assert.equal(ergebnis.zielKennung, 'goo-1');
  assert.equal(einmalFreigabe.status(10_050).freigegeben, false);
  assert.equal(steuerung.holeAktionsZustand(req.kennung)?.phase, 'abgeschlossen');
  assert.equal(steuerung.listeRessourcenSperren().length, 0);
});

test('Block 8 Gruppenziel-Ausfuehrung: verbrauchte Einmal-Freigabe kann keine zweite Anfrage ausfuehren', async () => {
  const aufrufe = [];
  const { fenster } = spiel(aufrufe);
  const gate = new AdventureLandGruppenZielEinmalFreigabe();
  const req1 = anfrage({ kennung: 'gruppe-einmal-1' });
  gate.erteile(GRUPPEN_ZIEL_EINMAL_FREIGABE_TEXT, req1.kennung, 10_000);
  const ausfuehrung = new AdventureLandGruppenZielAusfuehrung(fenster, { aktivFreigegeben: true, einmalFreigabe: gate });

  const erster = starte(req1);
  const zeiten1 = [10_050, 10_051];
  await ausfuehrung.fuehreFreigegebeneGruppenZielAktionAus(erster.schritt, erster.steuerung, sicherheit(), () => zeiten1.shift());
  assert.equal(aufrufe.length, 1);

  const req2 = anfrage({ kennung: 'gruppe-einmal-2' });
  const zweiter = starte(req2);
  const zeiten2 = [10_060, 10_061];
  await assert.rejects(
    () => ausfuehrung.fuehreFreigegebeneGruppenZielAktionAus(zweiter.schritt, zweiter.steuerung, sicherheit(), () => zeiten2.shift()),
    /Keine aktive Einmal-Freigabe/
  );
  assert.equal(aufrufe.length, 1);
  assert.equal(zweiter.steuerung.holeAktionsZustand(req2.kennung)?.phase, 'abgebrochen');
});

test('Block 8 Gruppenziel-Ausfuehrung: abgelaufene oder falsch gebundene Einmal-Freigabe wird verbraucht und blockiert', async () => {
  for (const [name, gateAufbau, muster] of [
    ['abgelaufen', () => {
      const gate = new AdventureLandGruppenZielEinmalFreigabe(20);
      gate.erteile(GRUPPEN_ZIEL_EINMAL_FREIGABE_TEXT, 'gruppe-abgelaufen', 10_000);
      return gate;
    }, /abgelaufen/],
    ['falsch-gebunden', () => {
      const gate = new AdventureLandGruppenZielEinmalFreigabe();
      gate.erteile(GRUPPEN_ZIEL_EINMAL_FREIGABE_TEXT, 'andere-anfrage', 10_000);
      return gate;
    }, /andere AktionsAnfrage gebunden/]
  ]) {
    const aufrufe = [];
    const { fenster } = spiel(aufrufe);
    const req = anfrage({ kennung: `gruppe-${name}` });
    const { steuerung, schritt } = starte(req);
    const gate = gateAufbau();
    const ausfuehrung = new AdventureLandGruppenZielAusfuehrung(fenster, { aktivFreigegeben: true, einmalFreigabe: gate });
    const zeiten = [10_050, 10_051];
    await assert.rejects(
      () => ausfuehrung.fuehreFreigegebeneGruppenZielAktionAus(schritt, steuerung, sicherheit(), () => zeiten.shift()),
      muster
    );
    assert.equal(aufrufe.length, 0);
    assert.equal(gate.status(10_050).freigegeben, false);
  }
});

test('Block 8 Gruppenziel-Ausfuehrung: verlorener Ressourcenbesitz blockiert vor attack und Einmal-Freigabe bleibt verbraucht', async () => {
  const aufrufe = [];
  const { fenster } = spiel(aufrufe);
  const req = anfrage();
  const ressourcenVergabe = new RessourcenVergabe();
  const { steuerung, schritt } = starte(req, ressourcenVergabe);
  ressourcenVergabe.gibRessourcenFuerBesitzerFrei(req.kennung);
  const { ausfuehrung, einmalFreigabe } = mitEinmalFreigabe(fenster, req.kennung);
  const zeiten = [10_050, 10_051];
  await assert.rejects(
    () => ausfuehrung.fuehreFreigegebeneGruppenZielAktionAus(schritt, steuerung, sicherheit(), () => zeiten.shift()),
    /Ressource gruppe nicht mehr/
  );
  assert.equal(aufrufe.length, 0);
  assert.equal(einmalFreigabe.status(10_050).freigegeben, false);
  assert.equal(steuerung.holeAktionsZustand(req.kennung)?.phase, 'abgebrochen');
});

test('Block 8 Gruppenziel-Ausfuehrung: Safety-Wechsel oder stale Safety blockiert vor attack und sperrt one-shot', async () => {
  for (const [name, sicherheitsWert, jetzt, muster] of [
    ['gefahr', sicherheit({ normalAktionenErlaubt: false, art: 'rueckzug', gefahrenBewertung: Object.freeze({ ...sicherheit().gefahrenBewertung, stufe: 'gefaehrlich' }) }), 10_050, /keine normale Gruppenzielaktion/],
    ['stale', sicherheit({ zeitpunkt: 8_000 }), 10_050, /aelter als der Gruppenplan|zu alt/]
  ]) {
    const aufrufe = [];
    const { fenster } = spiel(aufrufe);
    const req = anfrage({ kennung: `gruppe-${name}` });
    const { steuerung, schritt } = starte(req);
    const { ausfuehrung, einmalFreigabe } = mitEinmalFreigabe(fenster, req.kennung);
    const zeiten = [jetzt, jetzt + 1];
    await assert.rejects(
      () => ausfuehrung.fuehreFreigegebeneGruppenZielAktionAus(schritt, steuerung, sicherheitsWert, () => zeiten.shift()),
      muster
    );
    assert.equal(aufrufe.length, 0);
    assert.equal(einmalFreigabe.status(jetzt).freigegeben, false);
    assert.equal(steuerung.holeAktionsZustand(req.kennung)?.phase, 'abgebrochen');
  }
});

test('Block 8 Gruppenziel-Ausfuehrung: unbekannte Angriffsbereitschaft blockiert fail-safe', async () => {
  const aufrufe = [];
  const { fenster } = spiel(aufrufe);
  delete fenster.is_on_cooldown;
  const req = anfrage();
  const { steuerung, schritt } = starte(req);
  const { ausfuehrung } = mitEinmalFreigabe(fenster, req.kennung);
  const zeiten = [10_050, 10_051];
  await assert.rejects(
    () => ausfuehrung.fuehreFreigegebeneGruppenZielAktionAus(schritt, steuerung, sicherheit(), () => zeiten.shift()),
    /nicht explizit bereit: unbekannt/
  );
  assert.equal(aufrufe.length, 0);
});

test('Block 8 Gruppenziel-Ausfuehrung: unsichtbares, totes oder zu weit entferntes Ziel erreicht attack nicht', async () => {
  const faelle = [
    ['unsichtbar', (fenster) => { fenster.entities = {}; }, /nicht mehr sichtbar/],
    ['tot', (fenster) => { fenster.entities['goo-1'].hp = 0; }, /nicht bestaetigt lebendig/],
    ['zu-weit', (fenster) => { fenster.entities['goo-1'].real_x = 150; }, /ausserhalb der aktuellen Angriffsreichweite/]
  ];
  for (const [name, aendere, muster] of faelle) {
    const aufrufe = [];
    const { fenster } = spiel(aufrufe);
    aendere(fenster);
    const req = anfrage({ kennung: `gruppe-ziel-${name}` });
    const { steuerung, schritt } = starte(req);
    const { ausfuehrung } = mitEinmalFreigabe(fenster, req.kennung);
    const zeiten = [10_050, 10_051];
    await assert.rejects(
      () => ausfuehrung.fuehreFreigegebeneGruppenZielAktionAus(schritt, steuerung, sicherheit(), () => zeiten.shift()),
      muster
    );
    assert.equal(aufrufe.length, 0);
  }
});

test('Block 8 Gruppenziel-Ausfuehrung: andere GRUPPE-Aktionen besitzen keinen aktiven Pfad', async () => {
  const aufrufe = [];
  const { fenster } = spiel(aufrufe);
  const req = anfrage({
    kennung: 'gruppe-support',
    aktion: 'GRUPPE_UNTERSTUETZEN',
    benoetigteRessourcen: Object.freeze(['gruppe'])
  });
  const { steuerung, schritt } = starte(req);
  const gate = new AdventureLandGruppenZielEinmalFreigabe();
  gate.erteile(GRUPPEN_ZIEL_EINMAL_FREIGABE_TEXT, req.kennung, 10_000);
  const ausfuehrung = new AdventureLandGruppenZielAusfuehrung(fenster, { aktivFreigegeben: true, einmalFreigabe: gate });
  const zeiten = [10_050, 10_051];
  await assert.rejects(
    () => ausfuehrung.fuehreFreigegebeneGruppenZielAktionAus(schritt, steuerung, sicherheit(), () => zeiten.shift()),
    /Nicht freigegebene Gruppenaktion/
  );
  assert.equal(aufrufe.length, 0);
  assert.equal(gate.status(10_050).freigegeben, true);
});
