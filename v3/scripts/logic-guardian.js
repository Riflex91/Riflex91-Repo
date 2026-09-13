'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CONTRACT = path.join(ROOT, 'logic', 'invariants.json');
const LOGIC_TESTS = Object.freeze([
  'test/logic-guardian-contract.test.js',
  'test/logic-guardian-liveness.test.js',
  'test/logic-guardian-property.test.js',
  'test/release-safety-invariants.test.js',
  'test/alpha20-23-idle-deadlock-recovery.test.js',
  'test/unknown-content-safety.test.js',
  'test/farmer-local-plan-priority.test.js',
  'test/alpha21-progression-liveness.test.js',
  'test/alpha27-combat-merchant-convergence.test.js',
  'test/alpha27-combat-merchant-convergence-economy.test.js'
]);

function fail(message) {
  throw new Error(`[logic-guardian] ${message}`);
}

function runNode(args, label = args.join(' ')) {
  const result = spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' });
  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    fail(`${label} failed${output ? `\n${output}` : ''}`);
  }
  return result;
}

function validateContract() {
  let contract;
  try {
    contract = JSON.parse(fs.readFileSync(CONTRACT, 'utf8'));
  } catch (error) {
    fail(`cannot read invariant contract: ${error.message}`);
  }
  if (contract.schemaVersion !== 1 || !Array.isArray(contract.invariants) || contract.invariants.length === 0) {
    fail('invariant contract must have schemaVersion=1 and at least one invariant');
  }
  return contract;
}

function runLogicGuardian() {
  const contract = validateContract();
  for (const file of ['scripts/logic-guardian.js', 'scripts/logic-guardian-model.js']) {
    runNode(['--check', file], `syntax check ${file}`);
  }
  runNode(['--test', ...LOGIC_TESTS], 'logic invariant + liveness + property suite');
  const hard = contract.invariants.filter((row) => row.severity === 'block').length;
  process.stdout.write(`[logic-guardian] PASS ${contract.invariants.length} invariants (${hard} blocking)\n`);
  return contract;
}

if (require.main === module) {
  try {
    runLogicGuardian();
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { LOGIC_TESTS, validateContract, runLogicGuardian };
