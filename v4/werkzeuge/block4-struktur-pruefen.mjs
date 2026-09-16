import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const wurzel = process.cwd();
const pflichtDateien = [
  'dokumentation/BLOCK-4-TELEMETRIE.md',
  'laufzeit/quelle/vertraege/telemetrie.ts',
  'laufzeit/quelle/telemetrie/begrenzter-ringpuffer.ts',
  'laufzeit/quelle/telemetrie/sha256.ts',
  'laufzeit/quelle/telemetrie/flugschreiber.ts',
  'laufzeit/quelle/telemetrie/fortlaufender-ereignis-schreiber.ts',
  'laufzeit/quelle/telemetrie/entscheidungs-aktions-spur.ts',
  'laufzeit/quelle/telemetrie/dienst-verbrauchs-telemetrie.ts',
  'laufzeit/quelle/telemetrie/telemetrie-speicher.ts',
  'laufzeit/quelle/telemetrie/vorfall-erkennung.ts',
  'laufzeit/quelle/telemetrie/vorfall-paket-sammler.ts',
  'laufzeit/quelle/telemetrie/telemetrie-zentrale.ts',
  'schemata/telemetrie-dauerzustand.schema.json',
  'schemata/wiederholungs-segment.schema.json',
  'schemata/vorfall.schema.json',
  'schemata/vorfall-paket.schema.json'
];

for (const relativ of pflichtDateien) await access(path.join(wurzel, relativ));

const dokument = await readFile(path.join(wurzel, 'dokumentation/BLOCK-4-TELEMETRIE.md'), 'utf8');
for (const pflichtRegel of [
  'Kein lokaler Puffer waechst unbegrenzt.',
  'Kein Telemetriefehler darf die lokale Spielsicherheit blockieren.',
  'Kein geschuetztes Wiederholungssegment und kein Vorfallpaket wird allein wegen Speicherknappheit automatisch geloescht.'
]) {
  if (!dokument.includes(pflichtRegel)) throw new Error(`Pflichtregel fuer Block 4 fehlt: ${pflichtRegel}`);
}

const verboteneSpielaktionen = ['attack', 'move', 'smart_move', 'use_skill', 'buy', 'sell', 'send_item', 'upgrade', 'compound'];
const telemetrieDateien = pflichtDateien.filter((datei) => datei.startsWith('laufzeit/quelle/telemetrie/') && datei.endsWith('.ts'));
for (const relativ of telemetrieDateien) {
  const inhalt = await readFile(path.join(wurzel, relativ), 'utf8');
  for (const aktionsName of verboteneSpielaktionen) {
    if (new RegExp(`\\b${aktionsName}\\s*\\(`).test(inhalt)) {
      throw new Error(`${relativ} darf keine Adventure-Land-Spielaktion direkt aufrufen: ${aktionsName}`);
    }
  }
  if (/\bDate\.now\s*\(/.test(inhalt)) throw new Error(`${relativ} darf keine versteckte Systemzeit verwenden.`);
  if (/\bMath\.random\s*\(/.test(inhalt)) throw new Error(`${relativ} darf keinen versteckten Zufall verwenden.`);
}

console.log(`Block-4-Struktur geprueft: ${pflichtDateien.length} Pflichtdateien und deterministische Telemetriegrenzen.`);
