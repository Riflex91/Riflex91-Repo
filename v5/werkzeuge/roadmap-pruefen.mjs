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
if (active.length !== 1 || active[0].id !== doc.currentPhase) fail('exactly one IN_PROGRESS phase must equal currentPhase');

console.log('[V5-ROADMAP] OK:', doc.phases.length, 'phases; current =', doc.currentPhase);
