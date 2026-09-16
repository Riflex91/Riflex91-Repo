import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const wurzel = process.cwd();
const pflichtDateien = [
  'dokumentation/BLOCK-5-WIEDERHOLUNG.md',
  'laufzeit/quelle/vertraege/wiederholung.ts',
  'laufzeit/quelle/wiederholung/kanonisches-json.ts',
  'laufzeit/quelle/wiederholung/segment-lader.ts',
  'laufzeit/quelle/wiederholung/wiederholungs-lader.ts',
  'laufzeit/quelle/wiederholung/wiederholungs-maschine.ts',
  'laufzeit/quelle/wiederholung/wiederholungs-vergleich.ts',
  'laufzeit/quelle/wiederholung/goldener-wiederholungssatz.ts',
  'laufzeit/tests/wiederholung.test.mjs',
  'laufzeit/tests/wiederholung-schemata.test.mjs',
  'schemata/wiederholungs-datensatz.schema.json',
  'schemata/wiederholungs-lauf.schema.json',
  'schemata/goldener-wiederholungseintrag.schema.json'
];

for (const relativ of pflichtDateien) await access(path.join(wurzel, relativ));

async function sammleTsDateien(ordner) {
  const eintraege = await readdir(ordner, { withFileTypes: true });
  const dateien = [];
  for (const eintrag of eintraege) {
    const absolut = path.join(ordner, eintrag.name);
    if (eintrag.isDirectory()) dateien.push(...await sammleTsDateien(absolut));
    else if (eintrag.name.endsWith('.ts')) dateien.push(absolut);
  }
  return dateien;
}

const replayOrdner = path.join(wurzel, 'laufzeit/quelle/wiederholung');
const replayDateien = await sammleTsDateien(replayOrdner);
const verboteneSpielaktionen = ['attack', 'move', 'smart_move', 'use_skill', 'buy', 'sell', 'send_item', 'upgrade', 'compound'];

for (const datei of replayDateien) {
  const inhalt = await readFile(datei, 'utf8');
  for (const aktionsName of verboteneSpielaktionen) {
    if (new RegExp(`\\b${aktionsName}\\s*\\(`).test(inhalt)) {
      throw new Error(`Block 5 darf keine Adventure-Land-Aktion aufrufen: ${path.relative(wurzel, datei)} -> ${aktionsName}`);
    }
  }
  if (/\bDate\.now\s*\(/.test(inhalt)) throw new Error(`Block 5 darf keine versteckte aktuelle Uhrzeit verwenden: ${path.relative(wurzel, datei)}`);
  if (/\bMath\.random\s*\(/.test(inhalt)) throw new Error(`Block 5 darf keine versteckte Zufallsquelle verwenden: ${path.relative(wurzel, datei)}`);
}

const dokument = await readFile(path.join(wurzel, 'dokumentation/BLOCK-5-WIEDERHOLUNG.md'), 'utf8');
for (const regel of [
  'Die Wiederholungsmaschine fuehrt keine Adventure-Land-Aktion aus.',
  'Zwei Laeufe duerfen nur verglichen werden, wenn `datensatzKennung` und `eingabeFingerabdruck` identisch sind.',
  'Normale Speicherbereinigung entfernt keinen goldenen Eintrag.',
  'Eine neue Sicherheitsverletzung hat immer Vorrang vor einem hoeheren Bewertungswert.'
]) {
  if (!dokument.includes(regel)) throw new Error(`Pflichtregel fuer Block 5 fehlt: ${regel}`);
}

console.log(`Block 5 geprueft: ${pflichtDateien.length} Pflichtdateien, ${replayDateien.length} Replay-TypeScript-Dateien.`);
