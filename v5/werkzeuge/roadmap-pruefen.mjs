import fs from 'node:fs';

const path = 'v5/roadmap/gates.json';
const doc = JSON.parse(fs.readFileSync(path,'utf8'));
const fail = (m) => { throw new Error('[V5-ROADMAP] ' + m); };

if (doc.schemaVersion !== 1) fail('schemaVersion');
if (!Array.isArray(doc.phases) || !doc.phases.length) fail('no phases');

const ids = new Set();
for (const p of doc.phases) {
  if (!p.id || ids.has(p.id)) fail('duplicate/invalid phase ' + p.id);
  ids.add(p.id);
  if (!Array.isArray(p.requires) || !Array.isArray(p.exit) || !p.exit.length) fail(p.id + ': missing gates');
}
for (const p of doc.phases) for (const dep of p.requires) if (!ids.has(dep)) fail(p.id + ': unknown dependency ' + dep);
if (!ids.has(doc.currentPhase)) fail('unknown currentPhase');

const testzeit = JSON.parse(fs.readFileSync('v5/roadmap/testzeit-standard.json','utf8'));
if (testzeit.schemaVersion !== 1 || testzeit.status !== 'RATIFIZIERT' || testzeit.kennung !== 'V5_TESTZEIT_STANDARD_V1') fail('testzeit-standard ungueltig');
if (testzeit.funktion?.testdauerMs !== 300000 || testzeit.funktion?.ausreichendFuerFunktionsabnahme !== true) fail('Funktionsabnahme muss 5 Minuten betragen');
if (testzeit.integrationRelease?.testdauerMs !== 900000 || testzeit.integrationRelease?.ausreichendFuerIntegrationsReleaseAbnahme !== true) fail('Integrations-/Release-Abnahme muss 15 Minuten betragen');
if (testzeit.breiteRuntimeFreigabe !== false) fail('Testzeitstandard darf breite Runtime nicht freigeben');

const visiting = new Set(), visited = new Set(), byId = new Map(doc.phases.map(p=>[p.id,p]));
function visit(id){
  if (visiting.has(id)) fail('cycle at ' + id);
  if (visited.has(id)) return;
  visiting.add(id);
  for (const dep of byId.get(id).requires) visit(dep);
  visiting.delete(id); visited.add(id);
}
for (const id of ids) visit(id);

const active = doc.phases.filter(p=>p.status==='IN_PROGRESS');
const terminal = doc.currentPhase === 'R19'
  && byId.get('R19')?.status === 'DONE'
  && doc.phases.every(p=>p.status === 'DONE');
if (!terminal && (active.length !== 1 || active[0].id !== doc.currentPhase)) {
  fail('exactly one IN_PROGRESS phase must equal currentPhase unless terminal R19 is DONE');
}
if (terminal && active.length !== 0) fail('terminal R19 darf keine aktive Phase mehr besitzen');

console.log('[V5-ROADMAP] OK:', doc.phases.length, 'phases; current =', doc.currentPhase, '/ terminal =', terminal, '/ Funktionsgate = 5m / Integration-Release = 15m');
