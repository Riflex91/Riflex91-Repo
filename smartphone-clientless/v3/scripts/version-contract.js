'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_ROOT = path.resolve(__dirname, '..');
const RELEASE_VERSION_PATTERN = /^3\.0\.0-alpha\.\d+\.\d+$/;
const RELEASE_LITERAL_PATTERN = /\b3\.0\.0-alpha\.\d+\.\d+\b/g;

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function assertValidReleaseVersion(version) {
  if (!RELEASE_VERSION_PATTERN.test(String(version || ''))) {
    throw new Error(`invalid v3 release version: ${String(version || '<empty>')}`);
  }
  return version;
}

function expectedReleaseVersionSource(version) {
  assertValidReleaseVersion(version);
  return `'use strict';\n\nconst RELEASE_VERSION = '${version}';\n\nmodule.exports = { RELEASE_VERSION };\n`;
}

function listTestFiles(root = DEFAULT_ROOT) {
  const testDir = path.join(root, 'test');
  if (!fs.existsSync(testDir)) return [];
  return fs.readdirSync(testDir)
    .filter((name) => name.endsWith('.test.js'))
    .sort()
    .map((name) => path.join(testDir, name));
}

function inspectVersionContract(root = DEFAULT_ROOT, options = {}) {
  const includeBundle = options.includeBundle !== false;
  const failures = [];
  const versionFile = path.join(root, 'version.json');
  const packageFile = path.join(root, 'package.json');
  const releaseVersionFile = path.join(root, 'src', 'release-version.js');
  const bundleFile = path.join(root, 'dist', 'aio-v3.js');

  let versionDoc;
  try {
    versionDoc = readJson(versionFile);
    assertValidReleaseVersion(versionDoc.version);
  } catch (error) {
    failures.push(`version.json: ${error.message}`);
    return { ok: false, version: null, failures };
  }

  const version = versionDoc.version;

  try {
    const packageDoc = readJson(packageFile);
    if (packageDoc.version !== version) {
      failures.push(`package.json version ${packageDoc.version || '<missing>'} != ${version}`);
    }
  } catch (error) {
    failures.push(`package.json: ${error.message}`);
  }

  try {
    const actual = fs.readFileSync(releaseVersionFile, 'utf8');
    const expected = expectedReleaseVersionSource(version);
    if (actual !== expected) {
      failures.push('src/release-version.js is not generated from version.json');
    }
  } catch (error) {
    failures.push(`src/release-version.js: ${error.message}`);
  }

  if (includeBundle) {
    try {
      const fd = fs.openSync(bundleFile, 'r');
      const buffer = Buffer.alloc(256);
      const bytes = fs.readSync(fd, buffer, 0, buffer.length, 0);
      fs.closeSync(fd);
      const header = buffer.subarray(0, bytes).toString('utf8').split('\n', 1)[0];
      if (!header.includes(`Adventure Land AiO Bot ${version} | generated`)) {
        failures.push(`dist/aio-v3.js banner does not match ${version}`);
      }
    } catch (error) {
      failures.push(`dist/aio-v3.js: ${error.message}`);
    }
  }

  return { ok: failures.length === 0, version, failures };
}

function replaceExactReleaseLiteral(source, fromVersion, toVersion) {
  assertValidReleaseVersion(fromVersion);
  assertValidReleaseVersion(toVersion);
  return source.replace(RELEASE_LITERAL_PATTERN, (literal) => literal === fromVersion ? toVersion : literal);
}

module.exports = {
  DEFAULT_ROOT,
  RELEASE_VERSION_PATTERN,
  RELEASE_LITERAL_PATTERN,
  readJson,
  writeJson,
  assertValidReleaseVersion,
  expectedReleaseVersionSource,
  listTestFiles,
  inspectVersionContract,
  replaceExactReleaseLiteral
};
