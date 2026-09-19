import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const lesen = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const fehler = (m) => { throw new Error('[V5-WISSENSGATE] ' + m); };
const warn = (m) => console.warn('[V5-WISSENSGATE][WARNUNG] ' + m);

const regeln = lesen('v5/entwicklungsregeln/wissensnutzung.json');
const freigaben = lesen('v5/entwicklungsregeln/quellenfreigaben.json');
const manifest = lesen(regeln.manifestPfad);
const kb = 'v5/wissensbasis/';
const lauf = lesen(kb + manifest.laufendeDatenbank.letzterLauf);
const status = lesen(kb + manifest.laufendeDatenbank.quellenstatus);
const kandidaten = lesen(kb + manifest.laufendeDatenbank.kandidaten);
const revalidierung = lesen(kb + manifest.revalidation);
const bereitschaft = lesen('v5/bereitschaft/laufzeit-bereitschaft.json');

const streng = process.env.V5_WISSENSGATE_STRIKT === '1';
const domaenen = new Set((process.env.V5_WISSENSGATE_DOMAENEN ?? '')
  .split(',').map(x => x.trim()).filter(Boolean));

const beendet = Date.parse(lauf.beendetAm);
if (!Number.isFinite(beendet)) fehler('beendetAm des letzten Wissenslaufs ist ungueltig.');
const alterMinuten = (Date.now() - beendet) / 60000;
if (alterMinuten < -10) fehler('Letzter Wissenslauf liegt unplausibel in der Zukunft.');

if (alterMinuten > regeln.frische.blockiereImplementierungNachMinuten) {
  const text = `Wissensstand ist ${alterMinuten.toFixed(1)} Minuten alt; Blockgrenze = ${regeln.frische.blockiereImplementierungNachMinuten}.`;
  if (streng) fehler(text); else warn(text);
} else if (alterMinuten > regeln.frische.warnNachMinuten) {
  warn(`Wissensstand ist ${alterMinuten.toFixed(1)} Minuten alt.`);
}

const statusMap = new Map(status.quellen.map(x => [x.kennung, x]));
for (const q of status.quellen.filter(x => x.vertrauen === 'OFFICIAL')) {
  if (q.httpStatus !== 200 || q.fehler || q.gekuerzt || !q.inhaltSha256) {
    const text = `Offizielle Quelle ${q.kennung} ist nicht gesund.`;
    if (streng) fehler(text); else warn(text);
  }
}

const relevanteQuellen = new Set(regeln.quellengruppen.vertragKritisch);
for (const id of regeln.quellengruppen.globaleReviewBlocker ?? []) relevanteQuellen.add(id);
if (domaenen.size === 0 && streng) {
  for (const ids of Object.values(regeln.domaenenQuellen)) for (const id of ids) relevanteQuellen.add(id);
} else {
  for (const d of domaenen) {
    const ids = regeln.domaenenQuellen[d];
    if (!ids) fehler('Unbekannte Wissensdomaene: ' + d);
    for (const id of ids) relevanteQuellen.add(id);
  }
}

const freigabeMap = new Map(freigaben.quellenfreigaben.map(x => [x.kennung, x]));
for (const id of relevanteQuellen) {
  const aktuell = statusMap.get(id);
  if (!aktuell) {
    const text = `Relevante Quelle fehlt im aktuellen Quellenstatus: ${id}`;
    if (streng) fehler(text); else warn(text);
    continue;
  }
  const basis = freigabeMap.get(id);
  if (!basis) {
    const text = `Keine bewertete Quellenbasis fuer ${id}`;
    if (streng) fehler(text); else warn(text);
    continue;
  }
  if (basis.letzterBewerteterSha256 !== aktuell.inhaltSha256) {
    const text = `Relevante Quelle ${id} ist seit der letzten Entwicklungsbewertung gedriftet.`;
    if (streng) fehler(text); else warn(text);
  }
  if (streng && basis.fuerImplementierung !== true) {
    fehler(`Relevante Quelle ${id} ist noch nicht fuer Implementierung freigegeben.`);
  }
}

for (const id of regeln.quellengruppen.signalNur ?? []) {
  const aktuell = statusMap.get(id);
  const basis = freigabeMap.get(id);
  if (aktuell && basis && aktuell.inhaltSha256 !== basis.letzterBewerteterSha256) {
    warn(`Signalquelle ${id} hat sich geaendert und sollte fachlich gesichtet werden.`);
  }
}

if (streng) {
  if (bereitschaft.status !== 'FREIGEGEBEN') {
    fehler(`Laufzeit-Bereitschaft ist ${bereitschaft.status}, nicht FREIGEGEBEN.`);
  }
  const offeneP0 = (revalidierung.p0Research ?? []).filter(x => !['DONE','CLOSED','COMPLETED'].includes(x.status));
  if (offeneP0.length) fehler(`P0-Research ist nicht geschlossen: ${offeneP0.map(x => x.id).join(', ')}`);
}

if (kandidaten.schemaVersion !== 2) {
  fehler('Kandidatenliste muss Schema 2 verwenden.');
}
for (const k of kandidaten.kandidaten ?? []) {
  if (k.status !== 'KANDIDAT') {
    fehler('Kandidatenliste enthaelt Eintrag mit unerlaubtem Status.');
  }
  if (!k.relevanznachweis?.startsWith('ADVENTURE_LAND_')) {
    fehler('Kandidatenliste enthaelt Eintrag ohne bestaetigten Adventure-Land-Relevanznachweis.');
  }
}

console.log('[V5-WISSENSGATE] OK');
console.log('[V5-WISSENSGATE] Modus:', streng ? 'STRENG_IMPLEMENTIERUNG' : 'STRUKTUR_RESEARCH');
console.log('[V5-WISSENSGATE] WissensalterMinuten:', alterMinuten.toFixed(1));
console.log('[V5-WISSENSGATE] Domaenen:', domaenen.size ? [...domaenen].join(',') : (streng ? 'ALLE' : 'KEINE_STRIKTE'));
console.log('[V5-WISSENSGATE] Kandidaten ohne Autoritaet:', kandidaten.kandidaten?.length ?? 0);
