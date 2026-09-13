'use strict';

const path = require('path');
const { spawnSync } = require('child_process');
const { DEFAULT_ROOT, inspectVersionContract } = require('./version-contract');

const FAST_SAFETY_TESTS = Object.freeze([
  'test/release-guardian.test.js',
  'test/release-safety-invariants.test.js',
  'test/alpha20-23-idle-deadlock-recovery.test.js',
  'test/unknown-content-safety.test.js'
]);

function fail(message) {
  throw new Error(`[release-guardian] ${message}`);
}

function runNode(args, root = DEFAULT_ROOT, label = args.join(' ')) {
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    encoding: 'utf8',
    stdio: 'pipe'
  });
  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    fail(`${label} failed${output ? `\n${output}` : ''}`);
  }
  return result;
}

function runGuardian(options = {}) {
  const root = options.root ? path.resolve(options.root) : DEFAULT_ROOT;
  const versionOnly = options.versionOnly === true;
  const includeBundle = options.includeBundle !== false;
  const state = inspectVersionContract(root, { includeBundle });
  if (!state.ok) fail(`version contract failed:\n- ${state.failures.join('\n- ')}`);

  if (!versionOnly) {
    const syntaxFiles = [
      'scripts/version-contract.js',
      'scripts/release-guardian.js',
      'scripts/release-bump.js'
    ];
    for (const file of syntaxFiles) runNode(['--check', file], root, `syntax check ${file}`);
    runNode(['--test', ...FAST_SAFETY_TESTS], root, 'fast safety regression suite');
  }

  process.stdout.write(`[release-guardian] PASS ${state.version}${versionOnly ? ' (version contract)' : ' (version + safety)'}\n`);
  return state;
}

if (require.main === module) {
  try {
    runGuardian({ versionOnly: process.argv.includes('--version-only') });
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { FAST_SAFETY_TESTS, runGuardian };
