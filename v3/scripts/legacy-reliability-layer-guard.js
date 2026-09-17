'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_ROOT = path.join(ROOT, 'src');
const SCAN_ROOTS = [SOURCE_ROOT, path.join(ROOT, 'test')];

const LEGACY_RELIABILITY_MODULES = Object.freeze([
  'reliability/alpha20-15-combat-logistics-hotfix',
  'reliability/alpha20-15-logistics-fairness-hotfix',
  'reliability/alpha20-19-account-transport-hotfix',
  'reliability/alpha20-19-logistics-stabilization',
  'reliability/content-drift-semantic-recovery',
  'reliability/content-drift-storage-hotfix',
  'reliability/controlled-party-logistics',
  'reliability/dangerous-content-hotfix',
  'reliability/farm-area-pressure-hotfix',
  'reliability/farmer-local-plan-priority',
  'reliability/farmer-resource-topoff-hotfix',
  'reliability/farmer-target-efficiency-hotfix',
  'reliability/farmer-terrain-navigation-hotfix',
  'reliability/farmer-travel-safety-hotfix',
  'reliability/live-navigation-hotfix',
  'reliability/party-account-communication',
  'reliability/party-bootstrap-farmer-gate',
  'reliability/party-bootstrap-merchant-discovery-hotfix-base',
  'reliability/party-bootstrap-merchant-discovery-hotfix',
  'reliability/party-focus-fire-hotfix',
  'reliability/party-persistence-quota-hotfix',
  'reliability/team-combat-cohesion-hotfix-base',
  'reliability/team-combat-cohesion-hotfix'
]);

const LEGACY_FILES = new Set(LEGACY_RELIABILITY_MODULES.map((modulePath) =>
  path.normalize(path.join(SOURCE_ROOT, `${modulePath.replace(/^reliability\//, 'reliability/')}.js`))
));

function walk(root, rows = []) {
  if (!fs.existsSync(root)) return rows;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) walk(full, rows);
    else if (entry.isFile() && entry.name.endsWith('.js')) rows.push(full);
  }
  return rows;
}

function resolveRelativeModule(fromFile, request) {
  if (!request || !request.startsWith('.')) return null;
  const base = path.resolve(path.dirname(fromFile), request);
  for (const candidate of [base, `${base}.js`, path.join(base, 'index.js')]) {
    const normalized = path.normalize(candidate);
    if (LEGACY_FILES.has(normalized)) return normalized;
  }
  return null;
}

function references(source) {
  const rows = [];
  const patterns = [
    /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\bfrom\s+['"]([^'"]+)['"]/g,
    /\bimport\s+['"]([^'"]+)['"]/g
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(source)) !== null) rows.push(match[1]);
  }
  return rows;
}

function legacyReliabilityFindings() {
  const findings = [];
  for (const legacyFile of LEGACY_FILES) {
    if (fs.existsSync(legacyFile)) {
      findings.push({ type: 'legacy-file-exists', file: path.relative(ROOT, legacyFile) });
    }
  }
  for (const file of SCAN_ROOTS.flatMap((root) => walk(root))) {
    const source = fs.readFileSync(file, 'utf8');
    for (const request of references(source)) {
      const target = resolveRelativeModule(file, request);
      if (!target) continue;
      findings.push({
        type: 'legacy-import',
        file: path.relative(ROOT, file),
        request,
        target: path.relative(ROOT, target)
      });
    }
  }
  return findings;
}

function main() {
  const findings = legacyReliabilityFindings();
  if (!findings.length) {
    console.log(`legacy reliability layer guard: OK (${LEGACY_RELIABILITY_MODULES.length} retired paths)`);
    return;
  }
  console.error('legacy reliability layer guard: FAILED');
  for (const finding of findings) console.error(`- ${JSON.stringify(finding)}`);
  process.exitCode = 1;
}

if (require.main === module) main();

module.exports = {
  LEGACY_RELIABILITY_MODULES,
  legacyReliabilityFindings,
  resolveRelativeModule
};
