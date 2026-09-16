import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const required = [
  'README.md',
  'version.json',
  'docs/ROADMAP.md',
  'docs/ARCHITECTURE.md',
  'docs/DEVELOPMENT_LOOP.md',
  'docs/STORAGE_AND_WEB.md',
  'docs/TEST_STRATEGY.md',
  'runtime/src/contracts/domain-event.ts',
  'runtime/src/contracts/intent.ts',
  'runtime/src/contracts/resource.ts',
  'runtime/src/kernel/event-bus.ts',
  'runtime/src/kernel/intent-arbiter.ts',
  'runtime/src/kernel/resource-manager.ts',
  'schemas/domain-event.schema.json',
  'schemas/incident.schema.json',
  'schemas/archive-manifest.schema.json',
  'schemas/development-task.schema.json'
];

for (const relative of required) await access(path.join(root, relative));

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'build') continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else files.push(absolute);
  }
  return files;
}

const files = await walk(root);
const forbiddenSecretFiles = files.filter((file) => {
  const name = path.basename(file);
  return name === '.env' || (name.startsWith('.env.') && name !== '.env.example');
});
if (forbiddenSecretFiles.length > 0) {
  throw new Error(`Secret env files must not be committed: ${forbiddenSecretFiles.join(', ')}`);
}

const archiveExample = await readFile(path.join(root, 'platform/archive-sync/.env.example'), 'utf8');
if (!archiveExample.includes('V4_ARCHIVE_SFTP_HOST')) throw new Error('Archive SFTP example is incomplete');

const runtimeExample = await readFile(path.join(root, '.env.example'), 'utf8');
if (/SFTP_(HOST|USER|PRIVATE_KEY)|FTP_PASSWORD/.test(runtimeExample)) {
  throw new Error('Runtime env example must not contain archive credentials');
}

console.log(`V4 structure verified (${required.length} required artifacts, ${files.length} tracked/visible files scanned).`);
