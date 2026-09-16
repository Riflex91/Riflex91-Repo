import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const wurzel = process.cwd();
const pflichtDateien = [
  'LIESMICH.md',
  'version.json',
  'dokumentation/FAHRPLAN.md',
  'dokumentation/ARCHITEKTUR.md',
  'dokumentation/VERTRAEGE.md',
  'dokumentation/NAMEN_UND_MELDUNGEN.md',
  'dokumentation/ENTWICKLUNGSABLAUF.md',
  'dokumentation/SPEICHER_UND_WEB.md',
  'dokumentation/TAGESBERICHT.md',
  'dokumentation/TESTPLAN.md',
  'laufzeit/quelle/vertraege/bot-ereignis.ts',
  'laufzeit/quelle/vertraege/aktions-anfrage.ts',
  'laufzeit/quelle/vertraege/ressourcen-sperre.ts',
  'laufzeit/quelle/vertraege/spielzustand.ts',
  'laufzeit/quelle/vertraege/bot-meldung.ts',
  'laufzeit/quelle/vertraege/tages-bericht.ts',
  'laufzeit/quelle/kern/ereignis-zentrale.ts',
  'laufzeit/quelle/kern/aktions-auswahl.ts',
  'laufzeit/quelle/kern/ressourcen-vergabe.ts',
  'schemata/bot-ereignis.schema.json',
  'schemata/bot-meldung.schema.json',
  'schemata/vorfall.schema.json',
  'schemata/archiv-verzeichnis.schema.json',
  'schemata/entwicklungs-aufgabe.schema.json',
  'schemata/tages-bericht.schema.json',
  'schemata/tages-bericht-einstellung.schema.json'
];

for (const relativ of pflichtDateien) await access(path.join(wurzel, relativ));

async function sammleDateien(ordner) {
  const eintraege = await readdir(ordner, { withFileTypes: true });
  const dateien = [];
  for (const eintrag of eintraege) {
    if (eintrag.name === 'node_modules' || eintrag.name === 'erzeugt') continue;
    const absolut = path.join(ordner, eintrag.name);
    if (eintrag.isDirectory()) dateien.push(...await sammleDateien(absolut));
    else dateien.push(absolut);
  }
  return dateien;
}

const dateien = await sammleDateien(wurzel);
const geheimeUmgebungsDateien = dateien.filter((datei) => {
  const name = path.basename(datei);
  return name === '.env' || (name.startsWith('.env.') && name !== '.env.example');
});
if (geheimeUmgebungsDateien.length > 0) throw new Error(`Geheime Umgebungsdateien duerfen nicht eingecheckt werden: ${geheimeUmgebungsDateien.join(', ')}`);

const archivBeispiel = await readFile(path.join(wurzel, 'plattform/archiv-abgleich/.env.example'), 'utf8');
if (!archivBeispiel.includes('V4_ARCHIV_SFTP_RECHNER')) throw new Error('Das Beispiel fuer den Archiv-Abgleich ist unvollstaendig.');

const laufzeitBeispiel = await readFile(path.join(wurzel, '.env.example'), 'utf8');
if (/ARCHIV_SFTP_(RECHNER|BENUTZER|SCHLUESSEL)/.test(laufzeitBeispiel)) throw new Error('Die Laufzeit-Konfiguration darf keine SFTP-Archiv-Zugangsdaten enthalten.');
if (/EMAIL_(PASSWORT|SCHLUESSEL|TOKEN)|SMTP_(PASSWORT|SCHLUESSEL|TOKEN)/i.test(laufzeitBeispiel)) throw new Error('Die Adventure-Land-Laufzeit darf keine E-Mail-Versandgeheimnisse enthalten.');

console.log(`V4-Struktur geprueft: ${pflichtDateien.length} Pflichtdateien, ${dateien.length} sichtbare Dateien.`);
