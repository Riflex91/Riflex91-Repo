#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { validateLiveSessionSet } = require('../src/ops/live-recovery-log-validator');

function usage() {
  return [
    'Usage:',
    '  node scripts/validate-live-recovery-logs.js [--json] <session-log.json> <session-log.json> ...',
    '',
    'Requires one Merchant session and three farmer sessions. The validation intentionally',
    'fails if the alpha.20.56 recovery paths were not exercised by the supplied logs.'
  ].join('\n');
}

function readSession(filePath) {
  const absolute = path.resolve(process.cwd(), filePath);
  let text;
  try {
    text = fs.readFileSync(absolute, 'utf8');
  } catch (error) {
    throw new Error(`${filePath}: unable to read (${error.message})`);
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${filePath}: invalid JSON (${error.message})`);
  }
}

function render(result) {
  const lines = [];
  lines.push(`LIVE RECOVERY VALIDATION: ${result.passed ? 'PASS' : 'FAIL'}`);
  lines.push(`minimum version: ${result.minimumVersion}`);
  lines.push(`sessions: ${result.group.farmers} farmer(s), ${result.group.merchants} merchant(s)`);
  lines.push(`regroup: ${result.group.regroupScenarioExercised ? 'exercised' : 'not exercised'}; split followers: ${result.group.splitFollowers.join(', ') || 'none'}`);
  for (const session of result.sessions) {
    lines.push(`- ${session.name || '<unknown>'} [${session.role}] ${session.passed ? 'PASS' : 'FAIL'} (${session.version || 'unknown version'})`);
    for (const item of session.checks) {
      lines.push(`    ${item.ok ? 'PASS' : 'FAIL'} ${item.id}`);
    }
  }
  if (result.failures.length) {
    lines.push('failures:');
    for (const failure of result.failures) {
      lines.push(`  - [${failure.scope}] ${failure.id}${failure.details == null ? '' : `: ${JSON.stringify(failure.details)}`}`);
    }
  }
  return lines.join('\n');
}

function main(argv) {
  const args = argv.slice(2);
  const json = args.includes('--json');
  const files = args.filter((arg) => arg !== '--json');

  if (!files.length) {
    process.stderr.write(`${usage()}\n`);
    return 2;
  }

  let sessions;
  try {
    sessions = files.map(readSession);
  } catch (error) {
    process.stderr.write(`LIVE RECOVERY VALIDATION: ERROR\n${error.message}\n`);
    return 2;
  }

  const result = validateLiveSessionSet(sessions);
  process.stdout.write(json ? `${JSON.stringify(result, null, 2)}\n` : `${render(result)}\n`);
  return result.passed ? 0 : 1;
}

if (require.main === module) process.exitCode = main(process.argv);

module.exports = { main, readSession, render };
