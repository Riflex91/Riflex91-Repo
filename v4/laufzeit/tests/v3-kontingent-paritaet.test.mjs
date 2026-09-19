import test from 'node:test';
import assert from 'node:assert/strict';
import { KontingentWaechter } from '../../erzeugt/kern/kontingent-waechter.js';
import {
  V3_CLOUDFLARE_KONTINGENTE,
  V3_KONTINGENT_PARITAET_VERSION,
  V3_SUPABASE_KONTINGENTE,
  V4_STANDARD_SICHERHEITSANTEIL,
  erstelleCloudflareV3ParitaetsProfil,
  erstelleSupabaseV3ParitaetsProfil
} from '../../erzeugt/kern/v3-kontingent-paritaet.js';

const optionen = Object.freeze({
  geprueftAm: 100,
  gueltigBis: 1_000,
  quelle: 'repository-v3-plus-offizielle-anbieterpruefung'
});

function grenze(profil, kennung) {
  const wert = profil.grenzen.find((eintrag) => eintrag.kennung === kennung);
  assert.ok(wert, 'Grenze fehlt: ' + kennung);
  return wert;
}

test('V3-Kontingentparitaet bindet die aktuell in V3 verwendeten Cloudflare-Werte exakt', () => {
  assert.equal(V3_KONTINGENT_PARITAET_VERSION, '1.0.0');
  assert.deepEqual(V3_CLOUDFLARE_KONTINGENTE.workers, {
    freiAnfragenProTag: 100000,
    internesTagesziel: 95000,
    infrastrukturReserveProTag: 5000,
    botBudgetProTag: 90000,
    maximaleGruppenGroesse: 4,
    proCharakterProTag: 22500
  });
  assert.deepEqual(V3_CLOUDFLARE_KONTINGENTE.d1, {
    geleseneZeilenProTag: 5000000,
    geschriebeneZeilenProTag: 100000
  });
  assert.deepEqual(V3_CLOUDFLARE_KONTINGENTE.r2, {
    klasseAProMonat: 1000000,
    klasseABudgetProMonat: 950000,
    klasseBProMonat: 10000000,
    klasseBBudgetProMonat: 9500000,
    speicherBytes: 10000000000,
    liveSpeicherBudgetBytes: 9500000000,
    speicherFensterTage: 8,
    archivMindestSchreibabstandMs: 15000,
    objektMaxBytes: 262144,
    lebenszyklusTage: 7
  });
});

test('V3-Kontingentparitaet bindet das Supabase-Limit und V4 bleibt darunter', () => {
  assert.equal(V3_SUPABASE_KONTINGENTE.edgeFunktionsaufrufeProMonat, 500000);
  assert.equal(V4_STANDARD_SICHERHEITSANTEIL, 0.05);
  const profil = erstelleSupabaseV3ParitaetsProfil(optionen);
  const edge = grenze(profil, 'edge_funktionsaufrufe_pro_monat');
  assert.equal(edge.anbieterMaximum, 500000);
  assert.equal(edge.anbieterMaximum - edge.sicherheitsPuffer, 475000);
});

test('Cloudflare-Profil verwendet V3-Hard-Limits und V3-Budgets ohne sie zu lockern', () => {
  const profil = erstelleCloudflareV3ParitaetsProfil(optionen);
  const workers = grenze(profil, 'workers_anfragen_pro_tag');
  const d1Lesen = grenze(profil, 'd1_zeilen_gelesen_pro_tag');
  const d1Schreiben = grenze(profil, 'd1_zeilen_geschrieben_pro_tag');
  const r2A = grenze(profil, 'r2_operationen_a_pro_monat');
  const r2B = grenze(profil, 'r2_operationen_b_pro_monat');
  const r2Speicher = grenze(profil, 'r2_speicher_bytes');

  assert.equal(workers.anbieterMaximum, 100000);
  assert.equal(workers.anbieterMaximum - workers.sicherheitsPuffer, 90000);
  assert.equal(d1Lesen.anbieterMaximum, 5000000);
  assert.equal(d1Lesen.anbieterMaximum - d1Lesen.sicherheitsPuffer, 4750000);
  assert.equal(d1Schreiben.anbieterMaximum, 100000);
  assert.equal(d1Schreiben.anbieterMaximum - d1Schreiben.sicherheitsPuffer, 95000);
  assert.equal(r2A.anbieterMaximum, 1000000);
  assert.equal(r2A.anbieterMaximum - r2A.sicherheitsPuffer, 950000);
  assert.equal(r2B.anbieterMaximum, 10000000);
  assert.equal(r2B.anbieterMaximum - r2B.sicherheitsPuffer, 9500000);
  assert.equal(r2Speicher.anbieterMaximum, 10000000000);
  assert.equal(r2Speicher.anbieterMaximum - r2Speicher.sicherheitsPuffer, 9500000000);
});

test('Cloudflare-Workerbudget blockiert nach exakt dem V3-Botbudget von 90000 pro Tag', () => {
  const waechter = new KontingentWaechter();
  waechter.setzeDienstProfil(erstelleCloudflareV3ParitaetsProfil(optionen));
  const fenster = {
    workers_anfragen_pro_tag: '2026-09-19',
    d1_zeilen_gelesen_pro_tag: '2026-09-19',
    d1_zeilen_geschrieben_pro_tag: '2026-09-19',
    r2_operationen_a_pro_monat: '2026-09',
    r2_operationen_b_pro_monat: '2026-09',
    r2_speicher_bytes: 'dauerhaft'
  };
  const erste = waechter.pruefeUndReserviere({
    dienstKennung: 'cloudflare',
    vorgangKennung: 'v3-paritaet-worker',
    angefordertAm: 200,
    reservierungen: [{ grenzeKennung: 'workers_anfragen_pro_tag', maximalerVerbrauch: 90000 }]
  }, fenster, 200);
  assert.equal(erste.erlaubt, true);

  const zweite = waechter.pruefeUndReserviere({
    dienstKennung: 'cloudflare',
    vorgangKennung: 'v3-paritaet-worker-zu-viel',
    angefordertAm: 201,
    reservierungen: [{ grenzeKennung: 'workers_anfragen_pro_tag', maximalerVerbrauch: 1 }]
  }, fenster, 201);
  assert.equal(zweite.erlaubt, false);
});

test('gemeinsam gemeldeter Anbieter-Verbrauch verhindert dass V4 V3-Nutzung ignoriert', () => {
  const waechter = new KontingentWaechter();
  waechter.setzeDienstProfil(erstelleCloudflareV3ParitaetsProfil(optionen));
  waechter.aktualisiereVerbrauch('cloudflare', 'workers_anfragen_pro_tag', '2026-09-19', 89999);
  const ergebnis = waechter.pruefeUndReserviere({
    dienstKennung: 'cloudflare',
    vorgangKennung: 'shared-account',
    angefordertAm: 200,
    reservierungen: [{ grenzeKennung: 'workers_anfragen_pro_tag', maximalerVerbrauch: 2 }]
  }, { workers_anfragen_pro_tag: '2026-09-19' }, 200);
  assert.equal(ergebnis.erlaubt, false);
});

test('Paritaetsprofile verlangen eine explizite aktuelle Quellenpruefung', () => {
  assert.throws(() => erstelleCloudflareV3ParitaetsProfil({ ...optionen, quelle: '   ' }), /Quelle/);
  assert.throws(() => erstelleSupabaseV3ParitaetsProfil({ ...optionen, gueltigBis: 100 }), /gueltig/);
});
