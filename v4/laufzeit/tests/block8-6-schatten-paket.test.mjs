import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  BLOCK86_SCHATTEN_CANDIDATE_BYTES,
  BLOCK86_SCHATTEN_CANDIDATE_SHA256,
  BLOCK86_SCHATTEN_CANDIDATE_URL,
  BLOCK86_SCHATTEN_RELEASE_SHA,
  baueBlock86SchattenPaket
} from '../../werkzeuge/block8-6-schatten-paket-bauen.mjs';

async function paket() {
  return readFile(new URL('../../werkzeuge/block8-6-schatten-paket.js', import.meta.url), 'utf8');
}

test('Block 8.6.9 Schattenpaket ist source-locked zum Builder', async () => {
  assert.equal(await paket(), await baueBlock86SchattenPaket());
});

test('Block 8.6.9 Schattenpaket pinnt exakt den immutable Candidate', async () => {
  const source = await paket();
  assert.equal(BLOCK86_SCHATTEN_RELEASE_SHA, 'ca0dfee7685563c8b6003469300c8fd08777b053');
  assert.equal(BLOCK86_SCHATTEN_CANDIDATE_SHA256, 'b5d39ac692157ec98c9c77cc7d4afca0b39a0b67abbabbcc31b863a6b0f77ea5');
  assert.equal(BLOCK86_SCHATTEN_CANDIDATE_BYTES, 396471);
  assert.equal(BLOCK86_SCHATTEN_CANDIDATE_URL, 'https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/ca0dfee7685563c8b6003469300c8fd08777b053/aio-v4-runtime.js');
  assert.ok(source.includes(BLOCK86_SCHATTEN_RELEASE_SHA));
  assert.ok(source.includes(BLOCK86_SCHATTEN_CANDIDATE_SHA256));
  assert.ok(source.includes(BLOCK86_SCHATTEN_CANDIDATE_URL));
  assert.ok(source.includes('CANDIDATE_BYTES = 396471'));
  assert.ok(source.includes('Adventure Land AiO Bot V4 | generated | Block 8.6 capability release candidate'));
});

test('Block 8.6.9 Schattenpaket laesst Runtime und Capability-Schicht gesperrt', async () => {
  const source = await paket();
  assert.ok(source.includes('AIO_V4_RUNTIME_CONFIG'));
  assert.ok(source.includes('AIO_V4_CAPABILITY_CONFIG'));
  assert.ok(source.includes('aktivFreigegeben: false'));
  assert.ok(source.includes("modus: 'schatten'"));
  assert.ok(source.includes('Heartbeat-Versuche=0'));
  assert.ok(source.includes('Capability-Sendeversuche=0'));
  assert.ok(source.includes('Candidate spielAutoritaet=false'));
  assert.ok(source.includes('Candidate neustartAutoritaet=false'));
});

test('Block 8.6.9 Schattenpaket evaluiert Runner erst nach erfolgreicher Candidate-Pruefung', async () => {
  const source = await paket();
  const hash = source.indexOf('const hash = await berechneSha256(candidateCode)');
  const candidateEval = source.indexOf('(0, eval)(candidateCode)');
  const runnerEval = source.indexOf('(0, eval)(RUNNER_SOURCE)');
  const freigabe = source.indexOf("test.setzeAktionAktiv('schatten', true)");
  assert.ok(hash >= 0);
  assert.ok(candidateEval > hash);
  assert.ok(runnerEval > candidateEval);
  assert.ok(freigabe > runnerEval);
});

test('Block 8.6.9 Schattenpaket exponiert nur den Schattenknopf und keine direkte Spielaktion', async () => {
  const source = await paket();
  assert.ok(source.includes("titel: '1 · Schattennachweis'"));
  assert.equal(source.includes("titel: '2 · Kontrolliert live'"), false);
  assert.equal(source.includes("titel: '3 · Soak starten'"), false);
  for (const name of [
    'attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp',
    'use_hp_or_mp', 'loot', 'send_cm', 'command_character', 'send_party_invite',
    'buy', 'sell', 'send_item', 'upgrade', 'compound'
  ]) {
    assert.equal(new RegExp('\\b' + name + '\\s*\\(').test(source), false, name);
  }
});

test('Block 8.6.9 Schattenbericht behaelt die spaetere Live-Uebergabe', async () => {
  const source = await paket();
  assert.ok(source.includes('bericht?.schattenUebergabe?.aenderungsKennung'));
  assert.ok(source.includes('runnerBericht: bericht'));
  assert.ok(source.includes('runtimeStatus'));
  assert.ok(source.includes('capabilityStatus'));
  assert.ok(source.includes('Gesamtbericht kopieren'));
});
