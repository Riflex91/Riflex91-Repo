import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const quellOrdner = path.join(process.cwd(), 'laufzeit', 'quelle');
const verboteneBegriffe = [
  ['Intent', 'AktionsAnfrage'],
  ['Arbiter', 'AktionsAuswahl'],
  ['DomainEvent', 'BotEreignis'],
  ['ResourceLease', 'RessourcenSperre'],
  ['ResourceManager', 'RessourcenVergabe'],
  ['EventBus', 'EreignisZentrale'],
  ['WorldSnapshot', 'Spielzustand'],
  ['Manager', 'eine konkrete deutsche Aufgabe'],
  ['Handler', 'Empfaenger, Bearbeiter oder eine konkrete Aufgabe'],
  ['process', 'eine konkrete deutsche Taetigkeit'],
  ['handleData', 'eine konkrete deutsche Taetigkeit'],
  ['doStuff', 'eine konkrete deutsche Taetigkeit']
];

async function sammleDateien(ordner) {
  const eintraege = await readdir(ordner, { withFileTypes: true });
  const dateien = [];
  for (const eintrag of eintraege) {
    const absolut = path.join(ordner, eintrag.name);
    if (eintrag.isDirectory()) dateien.push(...await sammleDateien(absolut));
    else if (eintrag.name.endsWith('.ts')) dateien.push(absolut);
  }
  return dateien;
}

const verstoesse = [];
for (const datei of await sammleDateien(quellOrdner)) {
  const inhalt = await readFile(datei, 'utf8');
  const relativ = path.relative(process.cwd(), datei);
  for (const [begriff, ersatz] of verboteneBegriffe) {
    if (inhalt.includes(begriff)) verstoesse.push(`${relativ}: "${begriff}" vermeiden; stattdessen ${ersatz} verwenden.`);
  }
}

if (verstoesse.length > 0) throw new Error(`Deutsche V4-Namenspruefung fehlgeschlagen:\n${verstoesse.join('\n')}`);
console.log('Deutsche V4-Namenspruefung bestanden.');
