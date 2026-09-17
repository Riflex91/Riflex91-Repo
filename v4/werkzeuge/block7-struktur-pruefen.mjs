import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const wurzel = process.cwd();
const pflichtDateien = [
  'dokumentation/BLOCK-7-KAMPFSICHERHEIT.md',
  'laufzeit/quelle/vertraege/kampfsicherheit.ts',
  'laufzeit/quelle/vertraege/kampf-aktionsbereitschaft.ts',
  'laufzeit/quelle/vertraege/sicheres-farmen.ts',
  'laufzeit/quelle/spiellogik/kampfsicherheit.ts',
  'laufzeit/quelle/spiellogik/sicheres-farmen.ts',
  'laufzeit/quelle/adventure-land/adventure-land-kampf-bereitschaft.ts',
  'laufzeit/quelle/ausfuehrung/adventure-land-kampfsicherheits-ausfuehrung.ts',
  'laufzeit/quelle/wiederholung/kampfsicherheit-wiederholung.ts',
  'laufzeit/tests/kampfsicherheit.test.mjs',
  'laufzeit/tests/kampfsicherheit-wiederholung.test.mjs',
  'laufzeit/tests/adventure-land-kampf-bereitschaft.test.mjs',
  'laufzeit/tests/sicheres-farmen.test.mjs',
  'laufzeit/tests/kampfsicherheits-ausfuehrung.test.mjs',
  'laufzeit/tests/block7-schattenlauf-kontextbruecke.test.mjs',
  'werkzeuge/block7-schattenlauf-kontextbruecke.js'
];

for (const relativ of pflichtDateien) await access(path.join(wurzel, relativ));

const logik = await readFile(path.join(wurzel, 'laufzeit/quelle/spiellogik/kampfsicherheit.ts'), 'utf8');
for (const pflichtText of [
  'KAMPF_SICHERHEITS_AKTIONS_NAMEN.rueckzug',
  'KAMPF_SICHERHEITS_AKTIONS_NAMEN.abstandHerstellen',
  "wichtigkeit: notfall ? 'notfall' : 'sicherheit'",
  "benoetigteRessourcen: Object.freeze(['bewegung', 'kampfziel'] as const)",
  'markiereSicherheitsBewegungGestartet',
  'KAMPF_RUECKZUG_BLOCKIERT',
  'pruefeAngriffsReichweite'
]) {
  if (!logik.includes(pflichtText)) throw new Error(`Block-7-Kampfsicherheit ist unvollstaendig: ${pflichtText}`);
}

for (const aktionsName of ['attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp', 'loot']) {
  if (new RegExp(`\\b${aktionsName}\\s*\\(`).test(logik)) {
    throw new Error(`Block-7-Kampfsicherheit darf Adventure Land nicht direkt aufrufen: ${aktionsName}.`);
  }
}
for (const muster of [/\bDate\.now\s*\(/, /\bMath\.random\s*\(/]) {
  if (muster.test(logik)) throw new Error('Block-7-Kampfsicherheit muss ohne versteckte Uhrzeit und Zufallsquelle deterministisch bleiben.');
}

const sichereFarmLogik = await readFile(path.join(wurzel, 'laufzeit/quelle/spiellogik/sicheres-farmen.ts'), 'utf8');
for (const pflichtText of [
  'pruefeAngriffsBereitschaft',
  'maxAktionsBereitschaftAlterMillisekunden',
  "farm.art !== 'angreifen'",
  "bereitschaft.ergebnis === 'abklingzeit' ? 'abklingzeit' : 'blockiert'",
  "bereitschaft.zustand === 'abklingzeit'"
]) {
  if (!sichereFarmLogik.includes(pflichtText)) throw new Error(`Block-7-Sicher-vor-Farm-Logik ist unvollstaendig: ${pflichtText}`);
}
const sicherheitsAufruf = sichereFarmLogik.indexOf('const sicherheit = planeKampfSicherheitsSchritt(');
const farmAufruf = sichereFarmLogik.indexOf('const farm = planeGrundlegendenFarmSchritt(');
if (sicherheitsAufruf < 0 || farmAufruf < 0 || sicherheitsAufruf >= farmAufruf) {
  throw new Error('Block 7 muss Kampfsicherheit verbindlich vor dem normalen Farmplan auswerten.');
}
for (const aktionsName of ['attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp', 'loot']) {
  if (new RegExp(`\\b${aktionsName}\\s*\\(`).test(sichereFarmLogik)) {
    throw new Error(`Der sichere Farm-Orchestrator darf Adventure Land nicht direkt aufrufen: ${aktionsName}.`);
  }
}
for (const muster of [/\bDate\.now\s*\(/, /\bMath\.random\s*\(/]) {
  if (muster.test(sichereFarmLogik)) throw new Error('Der sichere Farm-Orchestrator muss ohne versteckte Uhrzeit und Zufallsquelle deterministisch bleiben.');
}

const bereitschaftLeser = await readFile(path.join(wurzel, 'laufzeit/quelle/adventure-land/adventure-land-kampf-bereitschaft.ts'), 'utf8');
for (const pflichtText of ['is_on_cooldown', 'can_use', 'next_skill', 'liesNormalenAngriff', "zustand: 'unbekannt'"]) {
  if (!bereitschaftLeser.includes(pflichtText)) throw new Error(`Block-7-Aktionsbereitschaft ist unvollstaendig: ${pflichtText}`);
}
for (const aktionsName of ['attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp', 'loot']) {
  if (new RegExp(`\\b${aktionsName}\\s*\\(`).test(bereitschaftLeser)) {
    throw new Error(`Der Bereitschaftsleser darf keine Adventure-Land-Spielaktion aufrufen: ${aktionsName}.`);
  }
}

const schattenAdapter = await readFile(path.join(wurzel, 'werkzeuge/block7-schattenlauf-kontextbruecke.js'), 'utf8');
for (const pflichtText of ['is_on_cooldown', 'next_skill', 'ms_to_next_skill', 'boolescher_cooldown']) {
  if (!schattenAdapter.includes(pflichtText)) throw new Error(`Block-7-Schatten-Bereitschaftsadapter ist unvollstaendig: ${pflichtText}`);
}
for (const aktionsName of ['attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp', 'loot']) {
  if (new RegExp(`\\b${aktionsName}\\s*\\(`).test(schattenAdapter)) {
    throw new Error(`Der Schatten-Bereitschaftsadapter darf keine Adventure-Land-Spielaktion aufrufen: ${aktionsName}.`);
  }
}

const sicherheitsAusfuehrung = await readFile(path.join(wurzel, 'laufzeit/quelle/ausfuehrung/adventure-land-kampfsicherheits-ausfuehrung.ts'), 'utf8');
for (const pflichtText of [
  'aktivFreigegeben',
  'KAMPF_SICHERHEITS_AKTIONS_NAMEN.rueckzug',
  'KAMPF_SICHERHEITS_AKTIONS_NAMEN.abstandHerstellen',
  "Reflect.get(this.spielFenster, 'move')",
  'holeAktionsZustand'
]) {
  if (!sicherheitsAusfuehrung.includes(pflichtText)) throw new Error(`Block-7-Ausfuehrungsgrenze ist unvollstaendig: ${pflichtText}`);
}
for (const unerlaubt of ['attack', 'smart_move', 'use_skill', 'use_hp', 'use_mp', 'loot']) {
  if (new RegExp(`\\b${unerlaubt}\\s*\\(`).test(sicherheitsAusfuehrung)) {
    throw new Error(`Die Kampfsicherheits-Ausfuehrungsgrenze darf ${unerlaubt} nicht aufrufen.`);
  }
}

const farmAusfuehrung = await readFile(path.join(wurzel, 'laufzeit/quelle/ausfuehrung/adventure-land-farm-ausfuehrung.ts'), 'utf8');
for (const pflichtText of [
  'pruefeAktuelleAngriffsReichweite',
  'Math.hypot',
  'ausserhalb der aktuellen Angriffsreichweite',
  'kann nicht sicher geprueft werden'
]) {
  if (!farmAusfuehrung.includes(pflichtText)) throw new Error(`Block-7-Reichweiten-Haertung fehlt: ${pflichtText}`);
}

const wiederholung = await readFile(path.join(wurzel, 'laufzeit/quelle/wiederholung/kampfsicherheit-wiederholung.ts'), 'utf8');
for (const pflichtText of ['erstelleKampfSicherheitsWiederholungsEntscheider', 'aktionsWichtigkeit']) {
  if (!wiederholung.includes(pflichtText)) throw new Error(`Block-7-Wiederholungsanbindung ist unvollstaendig: ${pflichtText}`);
}

const tests = await readFile(path.join(wurzel, 'laufzeit/tests/kampfsicherheit.test.mjs'), 'utf8');
for (const pflichtText of [
  'kritische Lebenspunkte unter Beschuss erzeugen Notfall-Rueckzug',
  'niedriges Mana unter Beschuss fuehrt konservativ zum Rueckzug',
  'Reichweitenpruefung unterscheidet erreichbar, zu weit und unbekannt',
  'gestartete Sicherheitsbewegung ohne Positionsfortschritt wird als blockiert erkannt',
  'Notfall-Rueckzug unterbricht eine laufende normale Farmbewegung zentral'
]) {
  if (!tests.includes(pflichtText)) throw new Error(`Block-7-Fehlereinspritztest fehlt: ${pflichtText}`);
}

const sichereFarmTests = await readFile(path.join(wurzel, 'laufzeit/tests/sicheres-farmen.test.mjs'), 'utf8');
for (const pflichtText of [
  'Kampfsicherheit wird vor dem normalen Farmplan ausgewertet',
  'Attack-Cooldown verhindert einen geplanten Angriff ohne den Farmzustand vorzutreiben',
  'beobachteter Attack-Cooldown ohne bekannte Restdauer bleibt sicher blockiert',
  'unbekannte Angriffsbereitschaft erzeugt keinen geratenen Angriff',
  'veraltete Angriffsbereitschaft wird blockiert',
  'Attack-Cooldown blockiert keine notwendige Bewegung zum Ziel'
]) {
  if (!sichereFarmTests.includes(pflichtText)) throw new Error(`Block-7-Sicher-vor-Farm-Test fehlt: ${pflichtText}`);
}

const bereitschaftTests = await readFile(path.join(wurzel, 'laufzeit/tests/adventure-land-kampf-bereitschaft.test.mjs'), 'utf8');
for (const pflichtText of [
  'Adventure-Land-Bereitschaft liest Attack-Cooldown ohne Spielaktion',
  'geteilter Adventure-Land-Cooldown wird ueber G.skills.share aufgeloest',
  'can_use ist nur positiver Fallback und erfindet bei false keinen Cooldown',
  'fehlende Cooldown-Schnittstelle wird nicht durch eine Annahme ersetzt'
]) {
  if (!bereitschaftTests.includes(pflichtText)) throw new Error(`Block-7-Bereitschaftstest fehlt: ${pflichtText}`);
}

const schattenAdapterTests = await readFile(path.join(wurzel, 'laufzeit/tests/block7-schattenlauf-kontextbruecke.test.mjs'), 'utf8');
for (const pflichtText of [
  'is_on_cooldown wird ohne Aktivierungsaufruf fuer den Schattenrunner adaptiert',
  'geteilter Cooldown folgt G.skills.share wie Adventure Land',
  'can_use ist nur positiver Fallback; false bleibt unbekannt'
]) {
  if (!schattenAdapterTests.includes(pflichtText)) throw new Error(`Block-7-Schatten-Bereitschaftstest fehlt: ${pflichtText}`);
}

const ausfuehrungsTests = await readFile(path.join(wurzel, 'laufzeit/tests/kampfsicherheits-ausfuehrung.test.mjs'), 'utf8');
for (const pflichtText of [
  'aktive Kampfsicherheitsausfuehrung ist standardmaessig gesperrt',
  'zentral gestarteter Notfall-Rueckzug wird genau als move ausgefuehrt',
  'fremde Aktionsnamen werden an der Kampfsicherheitsgrenze abgebrochen'
]) {
  if (!ausfuehrungsTests.includes(pflichtText)) throw new Error(`Block-7-Ausfuehrungstest fehlt: ${pflichtText}`);
}

const farmAusfuehrungsTests = await readFile(path.join(wurzel, 'laufzeit/tests/farm-ausfuehrung.test.mjs'), 'utf8');
for (const pflichtText of [
  'Ziel ausserhalb der aktuellen Reichweite wird unmittelbar vor attack sicher abgebrochen',
  'Unbekannte aktuelle Reichweite fuehrt nicht zu einem geratenen Angriff'
]) {
  if (!farmAusfuehrungsTests.includes(pflichtText)) throw new Error(`Block-7-Reichweiten-Ausfuehrungstest fehlt: ${pflichtText}`);
}

const replayTests = await readFile(path.join(wurzel, 'laufzeit/tests/kampfsicherheit-wiederholung.test.mjs'), 'utf8');
for (const pflichtText of ['ausgabeFingerabdruck', "['rueckzug', 'rueckzug']"]) {
  if (!replayTests.includes(pflichtText)) throw new Error(`Block-7-Replaytest fehlt: ${pflichtText}`);
}

const dokument = await readFile(path.join(wurzel, 'dokumentation/BLOCK-7-KAMPFSICHERHEIT.md'), 'utf8');
for (const regel of [
  'Kampfsicherheit Vorrang vor Farmleistung',
  '`wichtigkeit: "notfall"`',
  'keine Bewegungsrichtung erfunden',
  'Eine nur geplante Schattenbewegung gilt nicht automatisch als ausgefuehrte Sicherheitsbewegung.',
  'Kampfsicherheit wird vor jedem normalen Farmplan ausgewertet.',
  'Ein Angriff ohne frische und bekannte Aktionsbereitschaft wird nicht angefordert.',
  'Aktive Kampfsicherheitsausfuehrung bleibt standardmaessig gesperrt.',
  'Reichweite unmittelbar vor `attack(...)` erneut geprueft',
  '`is_on_cooldown("attack")`'
]) {
  if (!dokument.includes(regel)) throw new Error(`Pflichtregel fuer Block 7 fehlt: ${regel}`);
}

console.log(`Block 7 geprueft: ${pflichtDateien.length} Pflichtdateien, Gefahrenbewertung, zentral priorisierter Rueckzug, reale Adventure-Land-Cooldown-Beobachtung, Safety-vor-Farm, aktive Sicherheitsgrenze, Reichweiten-Recheck und Replay.`);
