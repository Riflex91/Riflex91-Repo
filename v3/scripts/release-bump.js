'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const {
  DEFAULT_ROOT,
  readJson,
  writeJson,
  assertValidReleaseVersion,
  expectedReleaseVersionSource,
  listTestFiles,
  replaceExactReleaseLiteral
} = require('./version-contract');
const { runGuardian } = require('./release-guardian');

function nextPatchVersion(version) {
  assertValidReleaseVersion(version);
  const match = /^(3\.0\.0-alpha\.\d+\.)(\d+)$/.exec(version);
  if (!match) throw new Error(`cannot patch-bump ${version}`);
  return `${match[1]}${Number(match[2]) + 1}`;
}

function runCommand(command, args, root) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status}`);
  }
}

function preparePatchRelease(root = DEFAULT_ROOT) {
  root = path.resolve(root);
  const versionFile = path.join(root, 'version.json');
  const packageFile = path.join(root, 'package.json');
  const releaseVersionFile = path.join(root, 'src', 'release-version.js');
  const bundleFile = path.join(root, 'dist', 'aio-v3.js');
  const originalVersionDoc = readJson(versionFile);
  const fromVersion = assertValidReleaseVersion(originalVersionDoc.version);
  const toVersion = nextPatchVersion(fromVersion);

  const originals = new Map();
  const remember = (file) => {
    if (!originals.has(file)) originals.set(file, fs.existsSync(file) ? fs.readFileSync(file) : null);
  };
  const writeText = (file, content) => {
    remember(file);
    fs.writeFileSync(file, content);
  };
  const writeJsonTransactional = (file, value) => {
    remember(file);
    writeJson(file, value);
  };
  const rollback = () => {
    for (const [file, content] of originals) {
      if (content === null) fs.rmSync(file, { force: true });
      else fs.writeFileSync(file, content);
    }
  };

  try {
    const nextVersionDoc = {
      ...originalVersionDoc,
      version: toVersion,
      build: new Date().toISOString().slice(0, 10)
    };
    writeJsonTransactional(versionFile, nextVersionDoc);

    const packageDoc = readJson(packageFile);
    packageDoc.version = toVersion;
    writeJsonTransactional(packageFile, packageDoc);
    writeText(releaseVersionFile, expectedReleaseVersionSource(toVersion));

    for (const testFile of listTestFiles(root)) {
      const source = fs.readFileSync(testFile, 'utf8');
      const next = replaceExactReleaseLiteral(source, fromVersion, toVersion);
      if (next !== source) writeText(testFile, next);
    }

    remember(bundleFile);
    runCommand(process.execPath, ['scripts/build.js'], root);
    runGuardian({ root });
    runCommand(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'check:full'], root);

    process.stdout.write(`[release-bump] READY ${fromVersion} -> ${toVersion}\n`);
    process.stdout.write('[release-bump] Full checks passed. Review the git diff before committing.\n');
    return { fromVersion, toVersion };
  } catch (error) {
    rollback();
    throw new Error(`[release-bump] aborted and rolled back: ${error.message}`);
  }
}

if (require.main === module) {
  const mode = process.argv[2] || 'patch';
  if (mode !== 'patch') {
    process.stderr.write(`[release-bump] unsupported mode: ${mode}\n`);
    process.exitCode = 1;
  } else {
    try {
      preparePatchRelease();
    } catch (error) {
      process.stderr.write(`${error.message}\n`);
      process.exitCode = 1;
    }
  }
}

module.exports = { nextPatchVersion, preparePatchRelease };
