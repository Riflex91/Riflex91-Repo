'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { DEFAULT_ROOT, readJson, assertValidReleaseVersion } = require('./version-contract');
const { preparePatchRelease } = require('./release-bump');

function versionNumbers(version) {
  assertValidReleaseVersion(version);
  const match = /^3\.0\.0-alpha\.(\d+)\.(\d+)$/.exec(version);
  if (!match) throw new Error(`unsupported release version ${version}`);
  return [Number(match[1]), Number(match[2])];
}

function compareReleaseVersions(a, b) {
  const aa = versionNumbers(a);
  const bb = versionNumbers(b);
  for (let i = 0; i < aa.length; i += 1) {
    if (aa[i] > bb[i]) return 1;
    if (aa[i] < bb[i]) return -1;
  }
  return 0;
}

function decideAutoBump(beforeVersion, afterVersion) {
  const comparison = compareReleaseVersions(afterVersion, beforeVersion);
  if (comparison > 0) {
    return { shouldBump: false, reason: 'MERGE_ALREADY_ADVANCED_VERSION' };
  }
  if (comparison < 0) {
    throw new Error(`release version regressed in main push: ${beforeVersion} -> ${afterVersion}`);
  }
  return { shouldBump: true, reason: 'MERGE_LEFT_VERSION_UNCHANGED' };
}

function versionAtRef(repoRoot, ref) {
  if (!ref || !/^[0-9a-f]{40}$/i.test(String(ref))) throw new Error(`invalid git ref ${ref || '<empty>'}`);
  const result = spawnSync('git', ['show', `${ref}:v3/version.json`], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  if (result.status !== 0) {
    const details = String(result.stderr || result.stdout || '').trim();
    throw new Error(`cannot read v3/version.json at ${ref}${details ? `: ${details}` : ''}`);
  }
  let document;
  try {
    document = JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(`invalid v3/version.json at ${ref}: ${error.message}`);
  }
  return assertValidReleaseVersion(document.version);
}

function writeOutput(name, value) {
  const output = process.env.GITHUB_OUTPUT;
  if (output) fs.appendFileSync(output, `${name}=${String(value)}\n`);
}

function run(options = {}) {
  const root = path.resolve(options.root || DEFAULT_ROOT);
  const repoRoot = path.resolve(root, '..');
  const beforeRef = options.beforeRef || process.env.BEFORE_SHA;
  const afterRef = options.afterRef || process.env.AFTER_SHA;
  const beforeVersion = versionAtRef(repoRoot, beforeRef);
  const afterVersion = versionAtRef(repoRoot, afterRef);
  const currentVersion = assertValidReleaseVersion(readJson(path.join(root, 'version.json')).version);
  const decision = decideAutoBump(beforeVersion, afterVersion);

  process.stdout.write(`[auto-version] main push ${beforeVersion} -> ${afterVersion}; checkout=${currentVersion}; ${decision.reason}\n`);

  if (!decision.shouldBump) {
    writeOutput('bumped', 'false');
    writeOutput('from_version', currentVersion);
    writeOutput('to_version', currentVersion);
    writeOutput('reason', decision.reason);
    return { ...decision, beforeVersion, afterVersion, currentVersion, bumped: false };
  }

  const release = preparePatchRelease(root);
  writeOutput('bumped', 'true');
  writeOutput('from_version', release.fromVersion);
  writeOutput('to_version', release.toVersion);
  writeOutput('reason', decision.reason);
  process.stdout.write(`[auto-version] automatic release bump ready: ${release.fromVersion} -> ${release.toVersion}\n`);
  return { ...decision, beforeVersion, afterVersion, currentVersion, bumped: true, ...release };
}

if (require.main === module) {
  try {
    run();
  } catch (error) {
    process.stderr.write(`[auto-version] ${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  compareReleaseVersions,
  decideAutoBump,
  versionAtRef,
  run
};
