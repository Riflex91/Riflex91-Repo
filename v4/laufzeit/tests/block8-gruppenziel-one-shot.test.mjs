import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const datei = new URL('../../werkzeuge/block8-gruppenziel-one-shot.js', import.meta.url);

async function lade({ mitBruecke = true } = {}) {
  const code = await readFile(datei, 'utf8');
  let jetzt = 10_000;
  let sicherheitsStufe = 'sicher';
  let cooldown = false;
  let resetAufrufe = 0;
  const pruefOptionen = [];
  const brueckenAufrufe = [];
  const ausgaben = [];

  class TestDate extends Date {
    static now() { return jetzt; }
  }

  const anfrage = Object.freeze({
    kennung: 'gruppenplan:10000:gemeinsames_ziel_bearbeiten:My_Ranger1:goo-1:aktionsanfrage',
    angefordertVon: 'gruppen-aktionsplanung',
    aktion: 'GRUPPE_GEMEINSAMES_ZIEL_BEARBEITEN',
    wichtigkeit: 'normal',
    prioritaet: 400,
    angefordertAm: 10_000,
    gueltigBis: 11_500,
    benoetigteRessourcen: Object.freeze(['gruppe', 'kampfziel']),
    details: Object.freeze({
      planZeitpunkt: 10_000,
      planStatus: 'geplant',
      art: 'gemeinsames_ziel_bearbeiten',
      faehigkeit: 'schaden',
      zielArt: 'gegner',
      zielKennung: 'goo-1'
    })
  });

  const parent = {
    character: { id: 'char-1', name: 'My_Ranger1', hp: 500, max_hp: 500, mp: 300, max_mp: 300, rip: false, range: 100, real_x: 0, real_y: 0, map: 'main' },
    entities: { 'goo-1': { id: 'goo-1', type: 'monster', mtype: 'goo', hp: 100, dead: false, real_x: 50, real_y: 0, map: 'main' } },
    is_on_cooldown(name) {
      assert.equal(name, 'attack');
      return cooldown;
    },
    V4Block7KampfsicherheitsQuelle: {
      bewerte() {
        return Object.freeze({
          schemaVersion: 1,
          ausgewertetAm: jetzt,
          quellBlobSha: 'test-sha',
          gefahrenBewertung: Object.freeze({ stufe: sicherheitsStufe })
        });
      }
    },
    V4Block8GruppenAktionsSteuerung: {
      setzeSteuerungZurueck() {
        resetAufrufe += 1;
        return {};
      },
      async pruefe(optionen) {
        pruefOptionen.push(optionen);
        return Object.freeze({
          lokalerCharakter: 'My_Ranger1',
          steuerungsErgebnis: Object.freeze({
            verarbeitung: Object.freeze({
              art: 'gestartet',
              gestarteteAnfrage: anfrage
            }),
            laufZustaende: Object.freeze([
              Object.freeze({ anfrage, phase: 'laeuft' })
            ])
          })
        });
      }
    },
    V4Testkonsole: { ausgeben(wert, titel) { ausgaben.push({ wert, titel }); } }
  };
  parent.parent = parent;

  if (mitBruecke) {
    parent.V4Block8GruppenZielAusfuehrungsBruecke = {
      quelleBereich: 'ausfuehrung',
      aktionsName: 'GRUPPE_GEMEINSAMES_ZIEL_BEARBEITEN',
      async fuehreEinmalAus(auftrag) {
        brueckenAufrufe.push(auftrag);
        return Object.freeze({ ok: true, aktionsKennung: auftrag.aktionsKennung });
      }
    };
  }

  const kontext = vm.createContext({
    console,
    parent,
    globalThis: null,
    Date: TestDate,
    Math,
    Object,
    Reflect,
    Set,
    String,
    Number,
    Error,
    Promise
  });
  kontext.globalThis = kontext;
  vm.runInContext(code, kontext, { filename: 'block8-gruppenziel-one-shot.js' });

  return {
    code,
    kontext,
    parent,
    brueckenAufrufe,
    pruefOptionen,
    ausgaben,
    resetAufrufe: () => resetAufrufe,
    setJetzt(wert) { jetzt = wert; },
    setSicherheit(wert) { sicherheitsStufe = wert; },
    setCooldown(wert) { cooldown = wert; }
  };
}

test('Block-8-Gruppenziel-One-shot startet gesperrt und Vorschau bleibt read-only im zentralen Schattenpfad', async () => {
  const u = await lade();
  assert.equal(u.kontext.V4Block8GruppenZielOneShot.status().freigegeben, false);
  const vorschau = await u.kontext.V4Block8GruppenZielOneShot.vorschau();
  assert.equal(vorschau.aktionsName, 'GRUPPE_GEMEINSAMES_ZIEL_BEARBEITEN');
  assert.equal(vorschau.zielKennung, 'goo-1');
  assert.equal(vorschau.zentraleSchattenPhase, 'laeuft');
  assert.equal(vorschau.echteSpielaktionenAusgefuehrt, false);
  assert.equal(u.resetAufrufe(), 1);
  assert.deepEqual(JSON.parse(JSON.stringify(u.pruefOptionen[0])), {
    uebersetzungAktiviert: true,
    freigegebeneArten: ['gemeinsames_ziel_bearbeiten'],
    einreichungAktiviert: true,
    freigegebeneAktionen: ['GRUPPE_GEMEINSAMES_ZIEL_BEARBEITEN'],
    verarbeiten: true
  });
  assert.equal(u.brueckenAufrufe.length, 0);
});

test('Block-8-Gruppenziel-One-shot verlangt exakten Freigabetext und frische Vorschau', async () => {
  const u = await lade();
  assert.throws(() => u.kontext.V4Block8GruppenZielOneShot.freigeben('ja'), /Falscher Freigabetext/);
  const text = u.kontext.V4Block8GruppenZielOneShot.freigabeText();
  assert.throws(() => u.kontext.V4Block8GruppenZielOneShot.freigeben(text), /frische read-only Vorschau/);

  await u.kontext.V4Block8GruppenZielOneShot.vorschau();
  u.setJetzt(15_001);
  assert.throws(() => u.kontext.V4Block8GruppenZielOneShot.freigeben(text), /Vorschau ist zu alt/);
});

test('Block-8-Gruppenziel-One-shot delegiert genau einmal und ist vor der Delegation wieder gesperrt', async () => {
  const u = await lade();
  await u.kontext.V4Block8GruppenZielOneShot.vorschau();

  const original = u.parent.V4Block8GruppenZielAusfuehrungsBruecke.fuehreEinmalAus;
  u.parent.V4Block8GruppenZielAusfuehrungsBruecke.fuehreEinmalAus = async (auftrag) => {
    assert.equal(u.kontext.V4Block8GruppenZielOneShot.status().freigegeben, false);
    return original(auftrag);
  };

  const text = u.kontext.V4Block8GruppenZielOneShot.freigabeText();
  const freigabe = u.kontext.V4Block8GruppenZielOneShot.freigeben(text);
  assert.equal(freigabe.freigegeben, true);

  const ergebnis = await u.kontext.V4Block8GruppenZielOneShot.starte();
  assert.equal(ergebnis.status, 'delegiert');
  assert.equal(ergebnis.delegierteAusfuehrungen, 1);
  assert.equal(ergebnis.automatischWiederGesperrt, true);
  assert.equal(ergebnis.echteSpielaktionenDurchWerkzeug, false);
  assert.equal(u.brueckenAufrufe.length, 1);
  assert.equal(u.brueckenAufrufe[0].freigabeText, 'BLOCK8-GRUPPENZIEL-EINMAL-FREIGEBEN');
  assert.equal(u.kontext.V4Block8GruppenZielOneShot.status().freigegeben, false);

  await assert.rejects(() => u.kontext.V4Block8GruppenZielOneShot.starte(), /gesperrt/);
  assert.equal(u.brueckenAufrufe.length, 1);
});

test('Block-8-Gruppenziel-One-shot sperrt auch bei Safety-Wechsel vor jeder Brueckendelegation', async () => {
  const u = await lade();
  await u.kontext.V4Block8GruppenZielOneShot.vorschau();
  u.kontext.V4Block8GruppenZielOneShot.freigeben(u.kontext.V4Block8GruppenZielOneShot.freigabeText());
  u.setSicherheit('gefaehrlich');

  await assert.rejects(() => u.kontext.V4Block8GruppenZielOneShot.starte(), /nicht sicher/);
  assert.equal(u.kontext.V4Block8GruppenZielOneShot.status().freigegeben, false);
  assert.equal(u.brueckenAufrufe.length, 0);
  assert.equal(u.kontext.V4Block8GruppenZielOneShot.ergebnis().automatischWiederGesperrt, true);
});

test('Block-8-Gruppenziel-One-shot sperrt auch wenn die ausfuehrung-Bruecke fehlt', async () => {
  const u = await lade({ mitBruecke: false });
  await u.kontext.V4Block8GruppenZielOneShot.vorschau();
  u.kontext.V4Block8GruppenZielOneShot.freigeben(u.kontext.V4Block8GruppenZielOneShot.freigabeText());

  await assert.rejects(() => u.kontext.V4Block8GruppenZielOneShot.starte(), /ist nicht geladen/);
  assert.equal(u.kontext.V4Block8GruppenZielOneShot.status().freigegeben, false);
  assert.equal(u.kontext.V4Block8GruppenZielOneShot.ergebnis().delegierteAusfuehrungen, 0);
});

test('Block-8-Gruppenziel-One-shot blockiert Cooldown, Zielverlust und Reichweitenverlust read-only', async () => {
  const cooldownFall = await lade();
  cooldownFall.setCooldown(true);
  await assert.rejects(() => cooldownFall.kontext.V4Block8GruppenZielOneShot.vorschau(), /Cooldown/);
  assert.equal(cooldownFall.brueckenAufrufe.length, 0);

  const zielFall = await lade();
  delete zielFall.parent.entities['goo-1'];
  await assert.rejects(() => zielFall.kontext.V4Block8GruppenZielOneShot.vorschau(), /nicht mehr sichtbar/);
  assert.equal(zielFall.brueckenAufrufe.length, 0);

  const reichweiteFall = await lade();
  reichweiteFall.parent.entities['goo-1'].real_x = 150;
  await assert.rejects(() => reichweiteFall.kontext.V4Block8GruppenZielOneShot.vorschau(), /ausserhalb/);
  assert.equal(reichweiteFall.brueckenAufrufe.length, 0);
});

test('Block-8-Gruppenziel-One-shot besitzt selbst keinen Adventure-Land-Aktionsaufruf', async () => {
  const u = await lade();
  for (const name of ['attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp', 'use_hp_or_mp', 'loot', 'send_cm', 'command_character', 'send_party_invite']) {
    assert.doesNotMatch(u.code, new RegExp(`\\b${name}\\s*\\(`));
  }
  assert.match(u.code, /bruecke\.fuehreEinmalAus\(auftrag\)/);
  assert.match(u.code, /quelleBereich !== 'ausfuehrung'/);
});
