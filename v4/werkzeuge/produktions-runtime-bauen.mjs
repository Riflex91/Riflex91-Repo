import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const wurzel = process.cwd();
const versionPfad = path.join(wurzel, 'version.json');
const ausgabe = path.join(wurzel, 'dist', 'aio-v4-runtime.js');
const tscPfad = path.join(wurzel, 'node_modules', 'typescript', 'bin', 'tsc');

function posix(wert) {
  return wert.split(path.sep).join('/');
}

function resolveRequire(vonId, anfrage) {
  if (!anfrage.startsWith('.')) throw new Error(`Externer Runtime-Import ist nicht erlaubt: ${anfrage} aus ${vonId}`);
  const basis = path.posix.dirname(vonId);
  let id = path.posix.normalize(path.posix.join(basis, anfrage));
  if (!path.posix.extname(id)) id += '.js';
  return id;
}

function requireAnfragen(source) {
  return [...source.matchAll(/require\((['"])(.+?)\1\)/g)].map((match) => match[2]);
}

async function kompiliereCommonJs(tempWurzel) {
  await execFileAsync(process.execPath, [
    tscPfad,
    '-p', path.join(wurzel, 'tsconfig.json'),
    '--module', 'commonjs',
    '--moduleResolution', 'node',
    '--outDir', tempWurzel,
    '--rootDir', path.join(wurzel, 'laufzeit', 'quelle'),
    '--declaration', 'false',
    '--sourceMap', 'false',
    '--noEmitOnError', 'true'
  ], { cwd: wurzel, maxBuffer: 10 * 1024 * 1024 });
}

async function sammle(tempWurzel, id, module) {
  if (module.has(id)) return;
  const datei = path.join(tempWurzel, ...id.split('/'));
  const source = await readFile(datei, 'utf8');
  module.set(id, source);
  for (const anfrage of requireAnfragen(source)) {
    await sammle(tempWurzel, resolveRequire(id, anfrage), module);
  }
}

function runtimeBundle(module, version, entryId) {
  const body = [...module.entries()].map(([id, source]) =>
    `${JSON.stringify(id)}: function(require,module,exports){\n${source}\n}`
  ).join(',\n');

  return `/* Adventure Land AiO Bot V4 | generated | production runtime | ${version} */\n(function(root){\n'use strict';\nvar modules={\n${body}\n};\nvar cache={};\nfunction resolve(from,request){var parts=from.split('/');parts.pop();request.split('/').forEach(function(p){if(!p||p==='.')return;if(p==='..')parts.pop();else parts.push(p);});var id=parts.join('/');if(!/\\.js$/.test(id))id+='.js';return id;}\nfunction load(id){if(cache[id])return cache[id].exports;if(!modules[id])throw new Error('V4 module not found: '+id);var module={exports:{}};cache[id]=module;function localRequire(request){return load(resolve(id,request));}modules[id](localRequire,module,module.exports);return module.exports;}\nvar entry=load(${JSON.stringify(entryId)});\nvar cfg=root.AIO_V4_RUNTIME_CONFIG&&typeof root.AIO_V4_RUNTIME_CONFIG==='object'?root.AIO_V4_RUNTIME_CONFIG:{};\nentry.installiereAdventureLandProduktionsLaufzeit(root,cfg);\n})(typeof globalThis!=='undefined'?globalThis:(typeof window!=='undefined'?window:this));\n`;
}

export async function baueProduktionsRuntime({ schreiben = true } = {}) {
  const version = JSON.parse(await readFile(versionPfad, 'utf8')).version;
  const tempWurzel = await mkdtemp(path.join(os.tmpdir(), 'aio-v4-runtime-'));
  try {
    await kompiliereCommonJs(tempWurzel);
    const entryId = 'ausfuehrung/adventure-land-produktions-einstieg.js';
    const module = new Map();
    await sammle(tempWurzel, entryId, module);
    const bundle = runtimeBundle(module, version, entryId);
    if (!bundle.includes('Adventure Land AiO Bot V4 | generated | production runtime')) throw new Error('Runtime-Marker fehlt.');
    if (!bundle.includes('V4ProduktionsLaufzeit')) throw new Error('Runtime enthaelt die Produktionslaufzeit nicht.');
    const bytes = Buffer.byteLength(bundle, 'utf8');
    if (bytes < 10_000 || bytes > 8 * 1024 * 1024) throw new Error(`V4-Produktionsruntime hat unplausible Groesse: ${bytes} Bytes.`);
    if (schreiben) {
      await mkdir(path.dirname(ausgabe), { recursive: true });
      await writeFile(ausgabe, bundle, 'utf8');
    }
    return Object.freeze({
      version,
      module: module.size,
      bytes,
      ausgabe: posix(path.relative(wurzel, ausgabe)),
      bundle
    });
  } finally {
    await rm(tempWurzel, { recursive: true, force: true });
  }
}

const direktGestartet = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (direktGestartet) {
  const pruefen = process.argv.includes('--pruefen');
  const ergebnis = await baueProduktionsRuntime({ schreiben: !pruefen });
  console.log(`V4 Produktionsruntime ${pruefen ? 'geprueft' : 'gebaut'}: ${ergebnis.module} Module, ${ergebnis.bytes} Bytes${pruefen ? '' : `, ${ergebnis.ausgabe}`}.`);
}
