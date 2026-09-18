import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

async function ladeHudApi() {
  const code = await readFile(new URL('../../werkzeuge/block8-5-ingame-hud.js', import.meta.url), 'utf8');
  const kontext = vm.createContext({
    console,
    setInterval,
    clearInterval
  });
  vm.runInContext(code, kontext, { filename: 'block8-5-ingame-hud.js' });
  return kontext.V4IngameHud;
}

function statusWert(wert, aenderungen = {}) {
  return {
    zustand: 'bekannt',
    quelle: 'beobachtet',
    sicherheit: 1,
    wert,
    grund: null,
    ...aenderungen
  };
}

function status(aenderungen = {}) {
  return {
    schemaVersion: 1,
    erstelltAm: 10_000,
    spielzustandLaufendeNummer: 7,
    spielzustandAufgenommenAm: 9_900,
    ablaufKennung: 'ablauf-1',
    nurLesen: true,
    spielAutoritaet: false,
    bedienAutoritaet: false,
    neustartAutoritaet: false,
    charakter: {
      verfuegbar: true,
      kennung: statusWert('char-1'),
      name: statusWert('My_Ranger1'),
      klasse: statusWert('ranger'),
      stufe: statusWert(80),
      leben: statusWert(900),
      lebenMaximal: statusWert(1000),
      mana: statusWert(450),
      manaMaximal: statusWert(500),
      karte: statusWert('main'),
      instanz: statusWert('main'),
      tot: statusWert(false)
    },
    runtime: {
      recoveryStufe: 'normal',
      grund: 'Gesund.',
      gruende: ['Gesund.'],
      snapshotAlterMillisekunden: 100,
      heartbeatAlterMillisekunden: 200,
      fachlicherFortschrittAlterMillisekunden: 300,
      gruppenLiveness: 'gesund',
      sicherheitsStufe: 'sicher',
      offeneAktionsAnfragen: 1,
      abgebrocheneAktionsAnfragen: 0,
      mussNutzerHandeln: false,
      hostNeustartEmpfohlen: false,
      automatischerNeustart: false
    },
    gruppe: {
      verfuegbar: true,
      eigenerTeilnehmerKennung: 'char-1',
      betriebsArt: 'normal',
      grund: 'Gruppenarbeit ist freigegeben.',
      gemeinsameGefahrenStufe: 'sicher',
      gemeinsamesZielKennung: 'goo-1',
      aktiveTeilnehmerKennungen: ['char-1', 'char-2'],
      teilnehmer: [
        { charakterKennung: 'char-1', status: 'aktiv', grund: 'Aktuell.', alterMillisekunden: 100 },
        { charakterKennung: 'char-2', status: 'aktiv', grund: 'Aktuell.', alterMillisekunden: 200 }
      ],
      aufgaben: {
        heilen: null,
        schaden: 'char-1',
        aggro: null,
        schutz: null,
        unterstuetzung: 'char-2'
      }
    },
    entscheidung: {
      entscheidungKennung: 'entscheidung-1',
      art: 'gruppenkoordination',
      quelle: 'gruppen-koordination',
      gewaehlteEntscheidung: 'gruppenbetrieb:normal',
      grund: 'Normalbetrieb.',
      fachlicherFingerabdruck: 'a'.repeat(64),
      aktionsAnfrageKennungen: ['aktion-1']
    },
    aktionen: [
      {
        kennung: 'aktion-1',
        aktion: 'GRUPPE_GEMEINSAMES_ZIEL_BEARBEITEN',
        phase: 'laeuft',
        wichtigkeit: 'normal',
        prioritaet: 400,
        grund: 'Schattenlauf.',
        ressourcen: ['gruppe', 'kampfziel']
      }
    ],
    checkpoint: {
      ladeStatus: 'geladen',
      grund: 'Checkpoint geladen.',
      slot: 'A',
      fallbackVerwendet: false,
      sequenz: 3,
      gespeichertAm: 9_800,
      wiederaufnahmeErlaubt: false,
      abgleichErforderlich: true,
      aktionsAutoritaet: false,
      offeneAktionsAnfrageKennungen: ['aktion-1']
    },
    letzteMeldung: {
      kennung: 'meldung-1',
      zeitpunkt: 9_950,
      stufe: 'hinweis',
      meldungsCode: 'STATUS_OK',
      titel: 'Status',
      wasIstPassiert: 'Status wurde aktualisiert.',
      warumIstEsPassiert: 'Regelmaessige Beobachtung.',
      wasHatDerBotGetan: 'Nur gelesen.',
      mussNutzerHandeln: false,
      wasSollDerNutzerTun: 'Nichts.'
    },
    ...aenderungen
  };
}

function findeAbschnitt(modell, kennung) {
  return modell.abschnitte.find((eintrag) => eintrag.kennung === kennung);
}

function findeWert(abschnitt, label) {
  return abschnitt.zeilen.find((zeile) => zeile.label === label)?.wert;
}

test('Block 8.5.6: HUD-API ist vorhanden und bietet nur Anzeige-Helfer', async () => {
  const api = await ladeHudApi();

  assert.equal(api.version, '1.0.0');
  assert.equal(typeof api.pruefeStatusSicht, 'function');
  assert.equal(typeof api.formatiereStatusWert, 'function');
  assert.equal(typeof api.erstelleAnzeigeModell, 'function');
  assert.equal(typeof api.erstelleHud, 'function');
  assert.deepEqual(
    Object.keys(api).sort(),
    ['erstelleAnzeigeModell', 'erstelleHud', 'formatiereStatusWert', 'pruefeStatusSicht', 'version'].sort()
  );
});

test('Block 8.5.6: HUD akzeptiert nur die explizit read-only StatusSicht ohne Autoritaet', async () => {
  const api = await ladeHudApi();
  assert.equal(api.pruefeStatusSicht(status()), true);

  for (const aenderung of [
    { nurLesen: false },
    { spielAutoritaet: true },
    { bedienAutoritaet: true },
    { neustartAutoritaet: true }
  ]) {
    assert.throws(
      () => api.pruefeStatusSicht(status(aenderung)),
      /muss nurLesen|darf keine/
    );
  }
});

test('Block 8.5.6: AnzeigeModell zeigt Charakter Runtime Gruppe Entscheidung Aktion Checkpoint und Meldung', async () => {
  const api = await ladeHudApi();
  const modell = api.erstelleAnzeigeModell(status());

  assert.equal(modell.schemaVersion, 1);
  assert.equal(modell.charakterName, 'My_Ranger1');
  assert.equal(modell.recoveryStufe, 'normal');
  assert.deepEqual(
    Array.from(modell.abschnitte, (eintrag) => eintrag.kennung),
    ['charakter', 'runtime', 'gruppe', 'entscheidung', 'aktionen', 'checkpoint', 'meldung']
  );

  assert.equal(findeWert(findeAbschnitt(modell, 'charakter'), 'Name'), 'My_Ranger1');
  assert.equal(findeWert(findeAbschnitt(modell, 'runtime'), 'Heartbeat-Alter'), '200 ms');
  assert.equal(findeWert(findeAbschnitt(modell, 'gruppe'), 'Ziel'), 'goo-1');
  assert.equal(findeWert(findeAbschnitt(modell, 'entscheidung'), 'Entscheidung'), 'gruppenbetrieb:normal');
  assert.match(findeWert(findeAbschnitt(modell, 'aktionen'), 'aktion-1'), /laeuft/);
  assert.equal(findeWert(findeAbschnitt(modell, 'checkpoint'), 'Aktionsautoritaet'), 'nein');
  assert.equal(findeWert(findeAbschnitt(modell, 'meldung'), 'Titel'), 'Status');
});

test('Block 8.5.6: bekanntes null fehlend und unbekannt bleiben in der Anzeige unterscheidbar', async () => {
  const api = await ladeHudApi();
  const basis = status();
  basis.charakter.tot = statusWert(null);
  basis.charakter.karte = {
    zustand: 'fehlend',
    quelle: 'beobachtet',
    sicherheit: null,
    wert: null,
    grund: 'Karte fehlt.'
  };
  basis.charakter.instanz = {
    zustand: 'unbekannt',
    quelle: 'abgeleitet',
    sicherheit: null,
    wert: null,
    grund: 'Instanz unklar.'
  };

  const modell = api.erstelleAnzeigeModell(basis);
  const charakter = findeAbschnitt(modell, 'charakter');

  assert.equal(findeWert(charakter, 'Tot'), 'null');
  assert.equal(findeWert(charakter, 'Karte'), 'fehlend: Karte fehlt.');
  assert.equal(findeWert(charakter, 'Instanz'), 'unbekannt: Instanz unklar.');
});

test('Block 8.5.6: fehlende optionale Statusbereiche erzeugen nur Anzeigehinweise und keine Ersatzlogik', async () => {
  const api = await ladeHudApi();
  const basis = status({
    gruppe: { verfuegbar: false },
    entscheidung: null,
    aktionen: [],
    letzteMeldung: null
  });

  const modell = api.erstelleAnzeigeModell(basis);

  assert.equal(
    findeWert(findeAbschnitt(modell, 'gruppe'), 'Status'),
    'keine Gruppenentscheidung verfuegbar'
  );
  assert.equal(
    findeWert(findeAbschnitt(modell, 'entscheidung'), 'Status'),
    'keine aktuelle Entscheidung'
  );
  assert.equal(
    findeWert(findeAbschnitt(modell, 'aktionen'), 'Status'),
    'keine beobachtete AktionsAnfrage'
  );
  assert.equal(
    findeWert(findeAbschnitt(modell, 'meldung'), 'Status'),
    'keine aktuelle Meldung'
  );
});

test('Block 8.5.6: AnzeigeModell veraendert die gelieferte StatusSicht nicht', async () => {
  const api = await ladeHudApi();
  const quelle = status();
  const vorher = JSON.stringify(quelle);

  api.erstelleAnzeigeModell(quelle);

  assert.equal(JSON.stringify(quelle), vorher);
});

test('Block 8.5.6: HUD verweigert unvollstaendigen Runtime- oder Charakterstatus fail-safe', async () => {
  const api = await ladeHudApi();

  assert.throws(
    () => api.erstelleAnzeigeModell(status({ runtime: null })),
    /Runtime-Status/
  );
  assert.throws(
    () => api.erstelleAnzeigeModell(status({ charakter: null })),
    /Charakterstatus/
  );
});

test('Block 8.5.6: ohne Dokument kann kein HUD erzeugt werden aber die Bot-Statuslogik bleibt nutzbar', async () => {
  const api = await ladeHudApi();

  assert.throws(
    () => api.erstelleHud(),
    /kein nutzbares Dokument/
  );
  assert.doesNotThrow(() => api.erstelleAnzeigeModell(status()));
});
