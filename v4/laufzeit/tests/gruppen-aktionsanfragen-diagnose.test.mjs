import test from 'node:test';
import assert from 'node:assert/strict';
import { uebersetzeEigeneGruppenPlanSchritte } from '../../erzeugt/spiellogik/gruppen-aktionsanfragen.js';

const plan = Object.freeze({
  schemaVersion: 1,
  zeitpunkt: 10_000,
  status: 'geplant',
  grund: 'Diagnosetest.',
  betriebsArt: 'normal',
  gemeinsameGefahrenStufe: 'sicher',
  gemeinsamesZielKennung: null,
  schritte: Object.freeze([Object.freeze({
    kennung: 'gruppenplan:10000:gruppe_unterstuetzen:My_Ranger2:gruppe',
    art: 'gruppe_unterstuetzen',
    faehigkeit: 'unterstuetzung',
    ausfuehrenderTeilnehmerKennung: 'My_Ranger2',
    zielArt: 'gruppe',
    zielKennung: null,
    wichtigkeit: 'normal',
    prioritaet: 500,
    benoetigteRessourcen: Object.freeze(['gruppe']),
    grund: 'Support.'
  })])
});

test('Block 8 Gruppenaktionsanfragen: Default-Lock verwendet getrennte Diagnosearrays', () => {
  const ergebnis = uebersetzeEigeneGruppenPlanSchritte(plan, 'My_Ranger2');
  assert.equal(ergebnis.status, 'gesperrt');
  assert.deepEqual(ergebnis.eigeneSchrittKennungen, ergebnis.nichtFreigegebeneSchrittKennungen);
  assert.notEqual(ergebnis.eigeneSchrittKennungen, ergebnis.nichtFreigegebeneSchrittKennungen);
});
