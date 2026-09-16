import test from 'node:test';
import assert from 'node:assert/strict';
import { erstelleBotMeldung, formatiereBotMeldung } from '../../erzeugt/vertraege/bot-meldung.js';

test('Warnungen enthalten alle Erklaerungen und eine eindeutige Handlungsangabe', () => {
  const meldung = erstelleBotMeldung({
    kennung: 'meldung-1',
    zeitpunkt: 1,
    stufe: 'warnung',
    meldungsCode: 'BEWEGUNG_BLOCKIERT',
    titel: 'Merchant erreicht die Bank nicht',
    wasIstPassiert: 'Der Merchant hat sich seit 30 Sekunden nicht zur Bank bewegt.',
    warumIstEsPassiert: 'Die aktuelle Route hat keinen Fortschritt gemacht.',
    wasHatDerBotGetan: 'Die Bewegung wurde gestoppt. In 5 Sekunden wird eine neue Route versucht.',
    mussNutzerHandeln: false,
    wasSollDerNutzerTun: 'Nichts. Nur eingreifen, wenn diese Warnung wiederholt erscheint.'
  });

  const text = formatiereBotMeldung(meldung);
  assert.match(text, /Was ist passiert:/);
  assert.match(text, /Warum:/);
  assert.match(text, /Bot-Reaktion:/);
  assert.match(text, /Nutzer muss handeln: NEIN/);
  assert.match(text, /Was soll ich tun:/);
});

test('Meldungen ohne eine notwendige Erklaerung werden abgelehnt', () => {
  assert.throws(() => erstelleBotMeldung({
    kennung: 'meldung-2', zeitpunkt: 1, stufe: 'fehler', meldungsCode: 'TEST_FEHLER', titel: 'Fehler',
    wasIstPassiert: 'Eine Testaktion ist fehlgeschlagen.', warumIstEsPassiert: '', wasHatDerBotGetan: 'Die Aktion wurde gestoppt.',
    mussNutzerHandeln: true, wasSollDerNutzerTun: 'Den Vorfall pruefen.'
  }), /muessen erklaeren/);
});
