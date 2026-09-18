import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AdventureLandProduktionsBootstrap,
  PRODUKTIONS_GRUPPENZIEL_VORBEREITEN_TEXT,
  PRODUKTIONS_LIVE_SMOKE_INSTALLIEREN_TEXT
} from '../../erzeugt/ausfuehrung/adventure-land-produktions-bootstrap.js';
import { GRUPPEN_LEBENSNACHWEIS_PROTOKOLL } from '../../erzeugt/vertraege/gruppen-lebensnachweis.js';

const faehigkeiten = Object.freeze({ heilen: 0, schaden: 1, aggro: 0, schutz: 0, unterstuetzung: 0 });

function spiel() {
  const gesendet = [];
  const ziel = { id: 'goo-1', type: 'monster', mtype: 'goo', hp: 100, dead: false, target: null, real_x: 40, real_y: 0, map: 'main' };
  const parent = {
    character: {
      id: 'ranger-1', name: 'My_Ranger1', ctype: 'ranger', level: 80,
      hp: 900, max_hp: 1000, mp: 700, max_mp: 800, xp: 1, max_xp: 2, gold: 100,
      attack: 100, frequency: 1, speed: 40, range: 100, armor: 10, resistance: 10,
      map: 'main', in: 'main', x: 0, y: 0, real_x: 0, real_y: 0, moving: false,
      target: 'goo-1', rip: false, stand: false, items: [], slots: {}
    },
    entities: { 'goo-1': ziel },
    party: {},
    G: {},
    server_region: 'EU',
    server_identifier: 'I',
    is_on_cooldown: () => false,
    attack() { return true; },
    send_cm(name, daten) { gesendet.push({ name, daten }); return true; }
  };
  const code = { parent, character: parent.character, on_cm: undefined };
  return { parent, code, ziel, gesendet };
}

function remoteMeldung(zeit = 10_000, aenderungen = {}) {
  return Object.freeze({
    schemaVersion: 1,
    charakterKennung: 'ranger-2',
    charakterName: 'My_Ranger2',
    klasse: 'ranger',
    serverRegion: 'EU',
    serverKennung: 'I',
    karte: 'main',
    instanz: 'main',
    lebendig: true,
    lebensAnteil: 1,
    manaAnteil: 1,
    zielKennung: 'goo-1',
    gefahrenStufe: 'sicher',
    faehigkeiten: Object.freeze({ heilen: 0, schaden: 0.5, aggro: 0, schutz: 0, unterstuetzung: 0 }),
    gesendetAm: zeit,
    laufendeNummer: 1,
    ...aenderungen
  });
}

function bootstrap(u, { aktivFreigegeben = true, jetzt = () => 10_000 } = {}) {
  return new AdventureLandProduktionsBootstrap(u.code, u.parent, jetzt, {
    aktivFreigegeben,
    ablaufKennung: 'block8-produktions-bootstrap-test',
    vertrauensNamen: ['My_Ranger1', 'My_Ranger2'],
    faehigkeiten
  });
}

function liefereRemote(u, zeit = 10_000, aenderungen = {}) {
  const umschlag = Object.freeze({
    schemaVersion: 1,
    protokoll: GRUPPEN_LEBENSNACHWEIS_PROTOKOLL,
    absenderName: 'My_Ranger2',
    meldung: remoteMeldung(zeit, aenderungen)
  });
  assert.equal(u.code.on_cm('My_Ranger2', umschlag), true);
}

test('Block-8 Produktions-Bootstrap startet standardmaessig gesperrt und erzeugt keine zweite Aktion', async () => {
  const u = spiel();
  const b = bootstrap(u, { aktivFreigegeben: false });
  assert.equal(b.status().aktivFreigegeben, false);
  assert.equal(b.status().gruppenZielVorbereitungVerbraucht, false);
  assert.equal(b.status().gestoppt, false);
  assert.throws(() => b.bereiteGruppenZielVor(PRODUKTIONS_GRUPPENZIEL_VORBEREITEN_TEXT), /standardmaessig gesperrt/);
  await assert.rejects(() => b.sendeLokalenLebensnachweis(), /standardmaessig gesperrt/);
  assert.equal(b.holeZentraleAktionsSteuerung().listeAktionsZustaende().length, 0);
  assert.equal(u.gesendet.length, 0);
});

test('Block-8 Produktions-Bootstrap berechnet lokalen Lebensnachweis aus echter Produktions-Safety und sendet nur an Vertrauensnamen', async () => {
  const u = spiel();
  const b = bootstrap(u);
  const ergebnis = await b.sendeLokalenLebensnachweis();
  assert.equal(ergebnis.meldung.charakterKennung, 'ranger-1');
  assert.equal(ergebnis.meldung.charakterName, 'My_Ranger1');
  assert.equal(ergebnis.meldung.gefahrenStufe, 'sicher');
  assert.equal(ergebnis.meldung.zielKennung, 'goo-1');
  assert.equal(ergebnis.ergebnisse.length, 1);
  assert.equal(ergebnis.ergebnisse[0].zielName, 'My_Ranger2');
  assert.equal(ergebnis.ergebnisse[0].gesendet, true);
  assert.equal(u.gesendet.length, 1);
  assert.equal(u.gesendet[0].daten.protokoll, GRUPPEN_LEBENSNACHWEIS_PROTOKOLL);
});

test('Block-8 Produktions-Bootstrap nutzt vorhandenen vertrauensgebundenen Empfang fuer reale Gruppenplanung', () => {
  const u = spiel();
  const b = bootstrap(u);
  assert.equal(b.installiereLebensnachweisEmpfang(), true);
  liefereRemote(u);

  assert.throws(() => b.bereiteGruppenZielVor('JA'), /Falscher Produktions-Gruppenziel-Freigabetext/);
  const ergebnis = b.bereiteGruppenZielVor(PRODUKTIONS_GRUPPENZIEL_VORBEREITEN_TEXT);
  assert.equal(ergebnis.koordinationsBetriebsArt, 'normal');
  assert.equal(ergebnis.gemeinsamesZielKennung, 'goo-1');
  assert.equal(ergebnis.planStatus, 'geplant');
  assert.equal(ergebnis.uebersetzungsStatus, 'erzeugt');
  assert.equal(ergebnis.steuerungsStatus, 'verarbeitet');
  assert.equal(ergebnis.gestarteterAktionsName, 'GRUPPE_GEMEINSAMES_ZIEL_BEARBEITEN');

  const zustand = b.holeZentraleAktionsSteuerung().holeAktionsZustand(ergebnis.gestarteteAktionsKennung);
  assert.equal(zustand.phase, 'laeuft');
  assert.equal(b.status().ressourcenSperren.find((x) => x.ressource === 'gruppe')?.besitzer, ergebnis.gestarteteAktionsKennung);
  assert.equal(b.status().ressourcenSperren.find((x) => x.ressource === 'kampfziel')?.besitzer, ergebnis.gestarteteAktionsKennung);
});

test('Block-8 Produktions-Bootstrap verwirft replayte und zeitlich aeltere Remote-Meldungen', () => {
  const u = spiel();
  let jetzt = 10_001;
  const b = bootstrap(u, { jetzt: () => jetzt });
  b.installiereLebensnachweisEmpfang();

  liefereRemote(u, 10_001, { laufendeNummer: 2, zielKennung: 'bee-1' });
  liefereRemote(u, 10_000, { laufendeNummer: 1, zielKennung: 'goo-1' });
  liefereRemote(u, 10_001, { laufendeNummer: 1, zielKennung: 'goo-1' });

  const ergebnis = b.bereiteGruppenZielVor(PRODUKTIONS_GRUPPENZIEL_VORBEREITEN_TEXT);
  assert.equal(ergebnis.gemeinsamesZielKennung, 'bee-1');
  assert.equal(b.status().gruppenZielVorbereitungVerbraucht, true);
});

test('Block-8 Produktions-Bootstrap blockiert doppelte Teilnehmerkennungen statt einen Teilnehmer zu ueberschreiben', () => {
  const u = spiel();
  const b = bootstrap(u);
  b.installiereLebensnachweisEmpfang();
  liefereRemote(u, 10_000, { charakterKennung: 'ranger-1' });
  assert.throws(
    () => b.bereiteGruppenZielVor(PRODUKTIONS_GRUPPENZIEL_VORBEREITEN_TEXT),
    /Doppelte Gruppen-Teilnehmerkennung ranger-1/
  );
  assert.equal(b.status().gruppenZielVorbereitungVerbraucht, true);
});

test('Block-8 Produktions-Bootstrap verbraucht die Gruppenziel-Vorbereitung nach genau einem korrekten Versuch', () => {
  const u = spiel();
  const b = bootstrap(u);
  const erster = b.bereiteGruppenZielVor(PRODUKTIONS_GRUPPENZIEL_VORBEREITEN_TEXT);
  assert.ok(erster.gestarteteAktionsKennung);
  assert.throws(
    () => b.bereiteGruppenZielVor(PRODUKTIONS_GRUPPENZIEL_VORBEREITEN_TEXT),
    /one-shot Produktions-Gruppenziel-Vorbereitung wurde bereits verbraucht/
  );
});

test('Block-8 Produktions-Bootstrap erfindet ohne aktuelle Gruppenmeldungen keinen aktiven Zielauftrag', () => {
  const u = spiel();
  const b = bootstrap(u);
  const ergebnis = b.bereiteGruppenZielVor(PRODUKTIONS_GRUPPENZIEL_VORBEREITEN_TEXT);
  assert.equal(ergebnis.koordinationsBetriebsArt, 'normal');
  assert.equal(ergebnis.gemeinsamesZielKennung, 'goo-1');
  assert.equal(ergebnis.gestarteterAktionsName, 'GRUPPE_GEMEINSAMES_ZIEL_BEARBEITEN');
});

test('Block-8 Produktions-Bootstrap verwirft veraltete Remote-Meldung durch produktive Koordination', () => {
  const u = spiel();
  let jetzt = 20_000;
  const b = bootstrap(u, { jetzt: () => jetzt });
  assert.equal(b.installiereLebensnachweisEmpfang(), true);
  liefereRemote(u, 10_000);
  const ergebnis = b.bereiteGruppenZielVor(PRODUKTIONS_GRUPPENZIEL_VORBEREITEN_TEXT);
  assert.equal(ergebnis.gestarteterAktionsName, 'GRUPPE_GEMEINSAMES_ZIEL_BEARBEITEN');
  const status = b.status();
  assert.ok(status.bekannteTeilnehmer.includes('ranger-2'));
});

test('Block-8 Produktions-Bootstrap installiert Live-Smoke nur fuer den exakt vorbereiteten zentralen Zielauftrag', () => {
  const u = spiel();
  const b = bootstrap(u);
  const erwartung = Object.freeze({
    charakterName: 'My_Ranger1',
    serverRegion: 'EU',
    serverKennung: 'I',
    karte: 'main',
    instanz: 'main',
    zielKennung: 'goo-1',
    monsterArt: 'goo'
  });
  assert.throws(
    () => b.installiereGruppenZielLiveSmoke(erwartung, PRODUKTIONS_LIVE_SMOKE_INSTALLIEREN_TEXT),
    /genau eine laufende zentrale Gruppenzielanfrage/
  );
  const vorbereiten = b.bereiteGruppenZielVor(PRODUKTIONS_GRUPPENZIEL_VORBEREITEN_TEXT);
  assert.ok(vorbereiten.gestarteteAktionsKennung);

  assert.throws(() => b.installiereGruppenZielLiveSmoke(erwartung, 'JA'), /Falscher Produktions-Live-Smoke/);
  const fassade = b.installiereGruppenZielLiveSmoke(erwartung, PRODUKTIONS_LIVE_SMOKE_INSTALLIEREN_TEXT);
  assert.equal(fassade.quelleBereich, 'ausfuehrung');
  assert.equal(u.code.V4Block8GruppenZielLiveSmoke, fassade);
  assert.equal(b.status().liveSmokeInstalliert, true);
});

test('Block-8 Produktions-Bootstrap stoppt Empfang, Smoke und laufende Gruppenarbeit fail-safe', () => {
  const u = spiel();
  const b = bootstrap(u);
  b.installiereLebensnachweisEmpfang();
  const vorbereitet = b.bereiteGruppenZielVor(PRODUKTIONS_GRUPPENZIEL_VORBEREITEN_TEXT);
  const erwartung = Object.freeze({
    charakterName: 'My_Ranger1', serverRegion: 'EU', serverKennung: 'I',
    karte: 'main', instanz: 'main', zielKennung: 'goo-1', monsterArt: 'goo'
  });
  b.installiereGruppenZielLiveSmoke(erwartung, PRODUKTIONS_LIVE_SMOKE_INSTALLIEREN_TEXT);

  const status = b.stoppe();
  assert.equal(status.empfangInstalliert, false);
  assert.equal(status.liveSmokeInstalliert, false);
  assert.equal(status.gestoppt, true);
  assert.equal(b.holeZentraleAktionsSteuerung().holeAktionsZustand(vorbereitet.gestarteteAktionsKennung)?.phase, 'abgebrochen');
  assert.equal(b.holeZentraleAktionsSteuerung().listeRessourcenSperren().length, 0);
  assert.equal(Object.prototype.hasOwnProperty.call(u.code, 'V4Block8GruppenZielLiveSmoke'), false);
  assert.throws(() => b.installiereLebensnachweisEmpfang(), /bereits gestoppt/);
  assert.throws(
    () => b.bereiteGruppenZielVor(PRODUKTIONS_GRUPPENZIEL_VORBEREITEN_TEXT),
    /bereits gestoppt/
  );
});
