import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

async function ladeHudApi() {
  const code = await readFile(new URL('../../werkzeuge/block8-6-capability-hud.js', import.meta.url), 'utf8');
  const kontext = vm.createContext({
    console,
    setInterval,
    clearInterval
  });
  vm.runInContext(code, kontext, { filename: 'block8-6-capability-hud.js' });
  return kontext.V4CapabilityHud;
}

function status(aenderungen = {}) {
  return {
    schemaVersion: 1,
    erstelltAm: 2050,
    charakterKennung: 'R1',
    charakterName: 'RangerA',
    nurLesen: true,
    spielAutoritaet: false,
    bedienAutoritaet: false,
    neustartAutoritaet: false,
    katalog: {
      zustand: 'bereit',
      generation: 3,
      fingerprint: 'b'.repeat(64),
      letzterErfolgreicherAuditAm: 1900,
      letzteExpliziteValidierungAm: 1750,
      bestaetigungErforderlich: false,
      produktionsbereit: true,
      grund: 'bereit',
      katalogGrund: null
    },
    skills: {
      gesamt: 2,
      strukturellVorhanden: 2,
      validiert: 2,
      aktiv: 2,
      technischBereit: 1,
      automatisierungKonfiguriert: 2,
      aktuellAutomatisierbar: 1,
      skills: [
        {
          skillId: '3shot',
          skillName: '3shot',
          strukturellVorhanden: true,
          automationValidated: true,
          technischBereit: true,
          vomNutzerFreigegeben: true,
          automatisierungKonfiguriert: true,
          aktuellAutomatisierbar: true,
          zielKapazitaet: 3,
          slider: [{
            kennung: 'mindestensZiele',
            bezeichnung: 'Mindestens Ziele',
            art: 'ganzzahl',
            wert: 2,
            minimum: 1,
            maximum: 3,
            schritt: 1
          }],
          grund: 'bereit'
        },
        {
          skillId: '5shot',
          skillName: '5shot',
          strukturellVorhanden: true,
          automationValidated: true,
          technischBereit: false,
          vomNutzerFreigegeben: true,
          automatisierungKonfiguriert: true,
          aktuellAutomatisierbar: false,
          zielKapazitaet: 5,
          slider: [{
            kennung: 'mindestensZiele',
            bezeichnung: 'Mindestens Ziele',
            art: 'ganzzahl',
            wert: 4,
            minimum: 1,
            maximum: 5,
            schritt: 1
          }],
          grund: 'Equipment fehlt.'
        }
      ]
    },
    capabilities: [{
      capability: 'mehrziel-schaden',
      strukturellAnzahl: 2,
      validiertAnzahl: 2,
      technischBereitAnzahl: 1,
      nutzerFreigegebenAnzahl: 2,
      automatisierungKonfiguriertAnzahl: 2,
      aktuellAutomatisierbarAnzahl: 1,
      maximaleZielKapazitaetStrukturell: 5,
      maximaleZielKapazitaetAktuell: 3
    }],
    remote: [{
      charakterKennung: 'R2',
      charakterName: 'RangerB',
      vertrauensStatus: 'vertraut',
      lebensnachweisStatus: 'aktiv',
      lebensnachweisAlterMillisekunden: 200,
      catalogAgreement: 'stimmt',
      remoteKatalogFingerprint: 'b'.repeat(64),
      remoteGeneration: 4,
      remoteFingerprint: 'c'.repeat(64),
      aktuellAutomatisierbareSkills: 2,
      gruende: ['Remote-Capability ist vertraut.']
    }],
    gruppenwahl: {
      verfuegbar: true,
      betriebsArt: 'normal',
      leaderKennung: 'R2',
      leaderName: 'RangerB',
      leaderGrund: 'Mehr reale Capabilities.',
      aufgabenZuordnung: {
        heilen: null,
        schaden: 'R2',
        aggro: null,
        schutz: null,
        unterstuetzung: null
      },
      vertrauteTeilnehmerKennungen: ['R1', 'R2'],
      ausgeschlosseneTeilnehmer: []
    },
    diagnose: [{
      stufe: 'blockiert',
      code: 'SKILL_AKTIV_ABER_NICHT_AUTOMATISIERBAR',
      bereich: 'skill',
      bezug: '5shot',
      nachricht: 'Equipment fehlt.'
    }],
    ...aenderungen
  };
}

function findeAbschnitt(modell, kennung) {
  return modell.abschnitte.find((eintrag) => eintrag.kennung === kennung);
}

function findeWert(abschnitt, label) {
  return abschnitt.zeilen.find((zeile) => zeile.label === label)?.wert;
}

test('8.6.7: Capability-HUD API bietet nur read-only Anzeige-Helfer', async () => {
  const api = await ladeHudApi();

  assert.equal(api.version, '1.0.0');
  assert.equal(typeof api.pruefeStatusSicht, 'function');
  assert.equal(typeof api.erstelleAnzeigeModell, 'function');
  assert.equal(typeof api.erstelleHud, 'function');
  assert.deepEqual(
    Object.keys(api).sort(),
    ['erstelleAnzeigeModell', 'erstelleHud', 'pruefeStatusSicht', 'version'].sort()
  );
});

test('8.6.7: HUD akzeptiert nur read-only CapabilityStatus ohne Autoritaet', async () => {
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

test('8.6.7: AnzeigeModell zeigt Katalog Skills Slider Capabilities Remote Gruppenwahl und Diagnose', async () => {
  const api = await ladeHudApi();
  const modell = api.erstelleAnzeigeModell(status());

  assert.equal(modell.schemaVersion, 1);
  assert.equal(modell.charakterName, 'RangerA');
  assert.equal(modell.katalogZustand, 'bereit');
  assert.equal(modell.hatBlockierendeDiagnose, true);
  assert.deepEqual(
    Array.from(modell.abschnitte, (eintrag) => eintrag.kennung),
    ['katalog', 'skills', 'capabilities', 'remote', 'gruppenwahl', 'diagnose']
  );

  assert.equal(findeWert(findeAbschnitt(modell, 'katalog'), 'Zustand'), 'bereit');
  assert.equal(findeWert(findeAbschnitt(modell, 'skills'), 'Aktiv / Gesamt'), '2 / 2');
  assert.match(findeWert(findeAbschnitt(modell, 'skills'), '3shot'), /Mindestens Ziele=2/);
  assert.match(findeWert(findeAbschnitt(modell, 'capabilities'), 'mehrziel-schaden'), /aktuell=1/);
  assert.match(findeWert(findeAbschnitt(modell, 'remote'), 'RangerB [R2]'), /catalog=stimmt/);
  assert.equal(findeWert(findeAbschnitt(modell, 'gruppenwahl'), 'Leader'), 'RangerB [R2]');
  assert.match(
    findeWert(findeAbschnitt(modell, 'diagnose'), 'BLOCKIERT · SKILL_AKTIV_ABER_NICHT_AUTOMATISIERBAR'),
    /skill:5shot/
  );
});

test('8.6.7: Remote- und Gruppen-Leerzustand werden nur dargestellt und nicht ersetzt', async () => {
  const api = await ladeHudApi();
  const modell = api.erstelleAnzeigeModell(status({
    remote: [],
    gruppenwahl: {
      verfuegbar: false,
      betriebsArt: null,
      leaderKennung: null,
      leaderName: null,
      leaderGrund: null,
      aufgabenZuordnung: null,
      vertrauteTeilnehmerKennungen: [],
      ausgeschlosseneTeilnehmer: []
    },
    diagnose: []
  }));

  assert.equal(
    findeWert(findeAbschnitt(modell, 'remote'), 'Status'),
    'keine Remote-Capabilities beobachtet'
  );
  assert.equal(
    findeWert(findeAbschnitt(modell, 'gruppenwahl'), 'Status'),
    'keine capability-basierte Gruppenwahl verfuegbar'
  );
  assert.equal(
    findeWert(findeAbschnitt(modell, 'diagnose'), 'Status'),
    'keine Diagnoseeintraege'
  );
});

test('8.6.7: AnzeigeModell veraendert die gelieferte CapabilityStatusSicht nicht', async () => {
  const api = await ladeHudApi();
  const quelle = status();
  const vorher = JSON.stringify(quelle);

  api.erstelleAnzeigeModell(quelle);

  assert.equal(JSON.stringify(quelle), vorher);
});

test('8.6.7: unvollstaendige Pflichtbereiche werden fail-safe abgewiesen', async () => {
  const api = await ladeHudApi();

  assert.throws(() => api.erstelleAnzeigeModell(status({ katalog: null })), /Katalogstatus/);
  assert.throws(() => api.erstelleAnzeigeModell(status({ skills: null })), /Skillstatus/);
  assert.throws(() => api.erstelleAnzeigeModell(status({ remote: null })), /Remote-Liste/);
  assert.throws(() => api.erstelleAnzeigeModell(status({ diagnose: null })), /Diagnose/);
});

test('8.6.7: ohne Dokument bleibt AnzeigeModell nutzbar und HUD-Erzeugung scheitert kontrolliert', async () => {
  const api = await ladeHudApi();

  assert.doesNotThrow(() => api.erstelleAnzeigeModell(status()));
  assert.throws(() => api.erstelleHud({ status: status() }), /kein nutzbares Dokument/);
});
