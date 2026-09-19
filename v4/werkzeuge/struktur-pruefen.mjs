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
  'dokumentation/DIENSTGRENZEN_UND_FEHLBEDIENUNGSSICHERHEIT.md',
  'dokumentation/BEDIENUNG_UND_FEHLBEDIENUNGSSICHERHEIT.md',
  'dokumentation/NUTZER_AUFTRAEGE.md',
  'dokumentation/TESTPLAN.md',
  'dokumentation/BLOCK-2-LESEZUGRIFF.md',
  'dokumentation/BLOCK-3-AKTIONSSTEUERUNG.md',
  'laufzeit/quelle/vertraege/bot-ereignis.ts',
  'laufzeit/quelle/vertraege/aktions-anfrage.ts',
  'laufzeit/quelle/vertraege/aktions-steuerung.ts',
  'laufzeit/quelle/vertraege/ressourcen-sperre.ts',
  'laufzeit/quelle/vertraege/spielzustand.ts',
  'laufzeit/quelle/vertraege/bot-meldung.ts',
  'laufzeit/quelle/vertraege/tages-bericht.ts',
  'laufzeit/quelle/vertraege/dienst-kontingent.ts',
  'laufzeit/quelle/vertraege/bedien-anfrage.ts',
  'laufzeit/quelle/vertraege/nutzer-auftrag.ts',
  'laufzeit/quelle/vertraege/speicher-lern-zyklus.ts',
  'laufzeit/quelle/adventure-land/adventure-land-lesezugriff.ts',
  'laufzeit/quelle/kern/spielzustand-erstellung.ts',
  'laufzeit/quelle/kern/spielzustand-aufzeichnung.ts',
  'laufzeit/quelle/kern/ereignis-zentrale.ts',
  'laufzeit/quelle/kern/aktions-auswahl.ts',
  'laufzeit/quelle/kern/aktions-steuerung.ts',
  'laufzeit/quelle/kern/schatten-ausfuehrung.ts',
  'laufzeit/quelle/kern/ressourcen-vergabe.ts',
  'laufzeit/quelle/kern/kontingent-waechter.ts',
  'laufzeit/quelle/kern/v3-kontingent-paritaet.ts',
  'laufzeit/tests/v3-kontingent-paritaet.test.mjs',
  'dokumentation/V3-KONTINGENT-PARITAET.md',
  'laufzeit/quelle/kern/bedien-sicherung.ts',
  'laufzeit/quelle/kern/auftrags-pruefung.ts',
  'laufzeit/quelle/kern/auftrags-vorschlaege.ts',
  'laufzeit/quelle/lernen/speicher-lern-zyklus.ts',
  'schemata/bot-ereignis.schema.json',
  'schemata/bot-meldung.schema.json',
  'schemata/vorfall.schema.json',
  'schemata/archiv-verzeichnis.schema.json',
  'schemata/entwicklungs-aufgabe.schema.json',
  'schemata/tages-bericht.schema.json',
  'schemata/tages-bericht-einstellung.schema.json',
  'schemata/dienst-profil.schema.json',
  'schemata/bedien-anfrage.schema.json',
  'schemata/nutzer-auftrag.schema.json',
  'schemata/spielzustand.schema.json',
  'schemata/spielzustand-aufzeichnung.schema.json',
  'werkzeuge/block2-beobachtung.js'
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
for (const pflichtWert of [
  'V4_ARCHIV_ANBIETER',
  'V4_ARCHIV_S3_ENDPUNKT',
  'V4_ARCHIV_S3_REGION',
  'V4_ARCHIV_S3_BUCKET',
  'V4_ARCHIV_S3_ZUGRIFFSSCHLUESSEL_ID',
  'V4_ARCHIV_S3_GEHEIMSCHLUESSEL'
]) {
  if (!archivBeispiel.includes(pflichtWert)) throw new Error(`Das Beispiel fuer den Archiv-Abgleich ist unvollstaendig: ${pflichtWert} fehlt.`);
}

const laufzeitBeispiel = await readFile(path.join(wurzel, '.env.example'), 'utf8');
if (/V4_ARCHIV_(S3|ANBIETER|STAMMPFAD)/.test(laufzeitBeispiel)) throw new Error('Die Laufzeit-Konfiguration darf keine Objektspeicher-Konfiguration enthalten.');
if (/ARCHIV_SFTP_(RECHNER|BENUTZER|SCHLUESSEL)/.test(laufzeitBeispiel)) throw new Error('Die Laufzeit-Konfiguration darf keine alten SFTP-Archiv-Zugangsdaten enthalten.');
if (/EMAIL_(PASSWORT|SCHLUESSEL|TOKEN)|SMTP_(PASSWORT|SCHLUESSEL|TOKEN)/i.test(laufzeitBeispiel)) throw new Error('Die Adventure-Land-Laufzeit darf keine E-Mail-Versandgeheimnisse enthalten.');

const dienstDokument = await readFile(path.join(wurzel, 'dokumentation/DIENSTGRENZEN_UND_FEHLBEDIENUNGSSICHERHEIT.md'), 'utf8');
for (const pflichtRegel of [
  'Kein Modul darf einen externen Dienst direkt aufrufen.',
  'Kein unbekannter Verbrauch wird geraten.',
  'Keine Warteschlange darf unbegrenzt wachsen.',
  'Verbindliche V3-Paritaet fuer Cloudflare und Supabase',
  'V4 darf ein gemeinsames Limit niemals als exklusiv eigenes Budget behandeln.'
]) {
  if (!dienstDokument.includes(pflichtRegel)) throw new Error(`Pflichtregel fuer externe Dienste fehlt: ${pflichtRegel}`);
} 

const paritaetsQuelle = await readFile(path.join(wurzel, 'laufzeit/quelle/kern/v3-kontingent-paritaet.ts'), 'utf8');
for (const pflichtRegel of [
  "V3_KONTINGENT_PARITAET_VERSION = '1.0.0'",
  'freiAnfragenProTag: 100_000',
  'botBudgetProTag: 90_000',
  'proCharakterProTag: 22_500',
  'geleseneZeilenProTag: 5_000_000',
  'geschriebeneZeilenProTag: 100_000',
  'klasseABudgetProMonat: 950_000',
  'klasseBBudgetProMonat: 9_500_000',
  'liveSpeicherBudgetBytes: 9_500_000_000',
  'edgeFunktionsaufrufeProMonat: 500_000',
  'V4_STANDARD_SICHERHEITSANTEIL = 0.05',
  'erstelleCloudflareV3ParitaetsProfil',
  'erstelleSupabaseV3ParitaetsProfil'
]) {
  if (!paritaetsQuelle.includes(pflichtRegel)) throw new Error(`V3-Kontingent-Paritaet fehlt: ${pflichtRegel}`);
}

const paritaetsDokument = await readFile(path.join(wurzel, 'dokumentation/V3-KONTINGENT-PARITAET.md'), 'utf8');
for (const pflichtRegel of [
  '100000 Requests/Tag',
  '90000 Requests/Tag',
  '22500 Requests/Tag',
  '5000000 gelesene Zeilen/Tag',
  '950000/Monat',
  '9500000/Monat',
  '500000/Monat',
  'V4 niemals lockerer als V3',
  'Bereits durch V3 oder Infrastruktur verbrauchtes Kontingent steht V4 nicht noch einmal zur Verfuegung.'
]) {
  if (!paritaetsDokument.includes(pflichtRegel)) throw new Error(`V3-Kontingent-Paritaetsdokument fehlt: ${pflichtRegel}`);
}

const speicherDokument = await readFile(path.join(wurzel, 'dokumentation/SPEICHER_UND_WEB.md'), 'utf8');
for (const pflichtRegel of [
  'Fehlt nur einer dieser Nachweise, bleibt die automatische Datenfreigabe gesperrt.',
  'Goldene Wiederholungen, ausgewaehlte seltene Situationen und wichtige Vorfaelle werden unabhaengig vom normalen Rohdaten-Zyklus geschuetzt.',
  'Die Spiellogik wartet niemals auf den Objektspeicher.'
]) {
  if (!speicherDokument.includes(pflichtRegel)) throw new Error(`Pflichtregel fuer den Speicher-Lern-Zyklus fehlt: ${pflichtRegel}`);
}

const bedienDokument = await readFile(path.join(wurzel, 'dokumentation/BEDIENUNG_UND_FEHLBEDIENUNGSSICHERHEIT.md'), 'utf8');
for (const pflichtRegel of [
  'Keine kritische Aktion mit einem einzigen Klick.',
  'Keine veraendernde Aktion ohne zentrale BedienSicherung.',
  'Keine ungueltige Eingabe kann gespeichert werden.',
  'Kein Doppelklick darf denselben Vorgang doppelt ausfuehren.'
]) {
  if (!bedienDokument.includes(pflichtRegel)) throw new Error(`Pflichtregel fuer sichere Bedienung fehlt: ${pflichtRegel}`);
}

const auftragsDokument = await readFile(path.join(wurzel, 'dokumentation/NUTZER_AUFTRAEGE.md'), 'utf8');
for (const pflichtRegel of [
  'Kein Freitext wird direkt ausgefuehrt.',
  'Kein Vorschlag startet direkt eine veraendernde Aktion.',
  'Kein unbekannter Befehl wird als verfuegbar dargestellt.',
  'Keine mehrdeutige Menge wird stillschweigend interpretiert.',
  'Kein Auftrag umgeht die BedienSicherung.'
]) {
  if (!auftragsDokument.includes(pflichtRegel)) throw new Error(`Pflichtregel fuer Nutzerauftraege fehlt: ${pflichtRegel}`);
}

const verboteneSpielaktionen = ['attack', 'move', 'smart_move', 'use_skill', 'buy', 'sell', 'send_item', 'upgrade', 'compound'];

async function pruefeKeineSpielaktion(relativerPfad, bezeichnung) {
  const inhalt = await readFile(path.join(wurzel, relativerPfad), 'utf8');
  for (const aktionsName of verboteneSpielaktionen) {
    const aufruf = new RegExp(`\\b${aktionsName}\\s*\\(`);
    if (aufruf.test(inhalt)) throw new Error(`${bezeichnung} darf keine Spielaktion aufrufen: ${aktionsName}`);
  }
}

await pruefeKeineSpielaktion('laufzeit/quelle/adventure-land/adventure-land-lesezugriff.ts', 'AdventureLandLesezugriff');
await pruefeKeineSpielaktion('laufzeit/quelle/kern/aktions-steuerung.ts', 'AktionsSteuerung');
await pruefeKeineSpielaktion('laufzeit/quelle/kern/schatten-ausfuehrung.ts', 'SchattenAusfuehrung');

const block2Dokument = await readFile(path.join(wurzel, 'dokumentation/BLOCK-2-LESEZUGRIFF.md'), 'utf8');
for (const pflichtRegel of [
  'Ein beobachtetes `null` ist ein bekannter Wert und wird nicht mit `fehlend` gleichgesetzt.',
  'die Adventure-Land-Leseschnittstelle ruft keine Aktionsfunktion auf'
]) {
  if (!block2Dokument.includes(pflichtRegel)) throw new Error(`Pflichtregel fuer Block 2 fehlt: ${pflichtRegel}`);
}

const block3Dokument = await readFile(path.join(wurzel, 'dokumentation/BLOCK-3-AKTIONSSTEUERUNG.md'), 'utf8');
for (const pflichtRegel of [
  'Keine Spielfunktion darf die zentrale AktionsSteuerung umgehen.',
  'Ressourcen werden immer gemeinsam oder gar nicht vergeben.',
  'Die Schattenausfuehrung fuehrt keine Adventure-Land-Aktion aus.'
]) {
  if (!block3Dokument.includes(pflichtRegel)) throw new Error(`Pflichtregel fuer Block 3 fehlt: ${pflichtRegel}`);
}

console.log(`V4-Struktur geprueft: ${pflichtDateien.length} Pflichtdateien, ${dateien.length} sichtbare Dateien.`);
