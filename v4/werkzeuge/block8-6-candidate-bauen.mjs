import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';
import { baueProduktionsRuntime } from './produktions-runtime-bauen.mjs';

const execFileAsync = promisify(execFile);
const wurzel = process.cwd();
const ausgabe = path.join(wurzel, 'dist', 'aio-v4-block8-6-candidate.js');
const sha256Ausgabe = path.join(wurzel, 'dist', 'aio-v4-block8-6-candidate.sha256');
const tscPfad = path.join(wurzel, 'node_modules', 'typescript', 'bin', 'tsc');

const IMMUTABLE_115 = Object.freeze({
  module: 31,
  bytes: 228607,
  sha256: '95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f'
});

function posix(wert) {
  return wert.split(path.sep).join('/');
}

function resolveRequire(vonId, anfrage) {
  if (!anfrage.startsWith('.')) {
    throw new Error(`Externer Candidate-Import ist nicht erlaubt: ${anfrage} aus ${vonId}`);
  }
  const basis = path.posix.dirname(vonId);
  let id = path.posix.normalize(path.posix.join(basis, anfrage));
  if (!path.posix.extname(id)) id += '.js';
  return id;
}

function requireAnfragen(source) {
  return [...source.matchAll(/require\((['"])(.+?)\1\)/g)].map((match) => match[2]);
}

async function kompiliereCommonJs(tempWurzel) {
  const quelle = path.join(tempWurzel, 'quelle');
  const ausgabeWurzel = path.join(tempWurzel, 'ausgabe');
  await cp(path.join(wurzel, 'laufzeit', 'quelle'), quelle, { recursive: true });
  await writeFile(
    path.join(tempWurzel, 'package.json'),
    JSON.stringify({ type: 'commonjs' }) + '\n',
    'utf8'
  );
  const tempTsconfig = {
    compilerOptions: {
      target: 'ES2022',
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      rootDir: './quelle',
      outDir: './ausgabe',
      strict: true,
      noUncheckedIndexedAccess: true,
      exactOptionalPropertyTypes: true,
      useUnknownInCatchVariables: true,
      noImplicitOverride: true,
      noFallthroughCasesInSwitch: true,
      noEmitOnError: true,
      declaration: false,
      sourceMap: false,
      skipLibCheck: true
    },
    include: ['./quelle/**/*.ts']
  };
  const tsconfigPfad = path.join(tempWurzel, 'tsconfig.json');
  await writeFile(tsconfigPfad, JSON.stringify(tempTsconfig, null, 2) + '\n', 'utf8');
  try {
    await execFileAsync(process.execPath, [tscPfad, '-p', tsconfigPfad], {
      cwd: tempWurzel,
      maxBuffer: 10 * 1024 * 1024
    });
  } catch (fehler) {
    const stdout = typeof fehler?.stdout === 'string' ? fehler.stdout.trim() : '';
    const stderr = typeof fehler?.stderr === 'string' ? fehler.stderr.trim() : '';
    throw new Error(
      `Temporärer Block-8.6-CommonJS-Build fehlgeschlagen.` +
      (stdout ? ` stdout: ${stdout}` : '') +
      (stderr ? ` stderr: ${stderr}` : '')
    );
  }
  return ausgabeWurzel;
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

function candidateBundle(module, entryId) {
  const body = [...module.entries()].map(([id, source]) =>
    `${JSON.stringify(id)}: function(require,module,exports){\n${source}\n}`
  ).join(',\n');

  return `/* Adventure Land AiO Bot V4 | generated | Block 8.6 capability release candidate */\n(function(root){\n'use strict';\nvar modules={\n${body}\n};\nvar cache={};\nfunction resolve(from,request){var parts=from.split('/');parts.pop();request.split('/').forEach(function(p){if(!p||p==='.')return;if(p==='..')parts.pop();else parts.push(p);});var id=parts.join('/');if(!/\\.js$/.test(id))id+='.js';return id;}\nfunction load(id){if(cache[id])return cache[id].exports;if(!modules[id])throw new Error('V4 module not found: '+id);var module={exports:{}};cache[id]=module;function localRequire(request){return load(resolve(id,request));}modules[id](localRequire,module,module.exports);return module.exports;}\nvar entry=load(${JSON.stringify(entryId)});\nvar runtimeCfg=root.AIO_V4_RUNTIME_CONFIG&&typeof root.AIO_V4_RUNTIME_CONFIG==='object'?root.AIO_V4_RUNTIME_CONFIG:{};\nvar capabilityCfg=root.AIO_V4_CAPABILITY_CONFIG&&typeof root.AIO_V4_CAPABILITY_CONFIG==='object'?root.AIO_V4_CAPABILITY_CONFIG:null;\nif(!capabilityCfg)throw new Error('Block-8.6-Candidate benoetigt AIO_V4_CAPABILITY_CONFIG.');\nentry.installiereAdventureLandBlock86Candidate(root,runtimeCfg,capabilityCfg);\n})(typeof globalThis!=='undefined'?globalThis:(typeof window!=='undefined'?window:this));\n`;
}

export async function baueBlock86Candidate({ schreiben = true } = {}) {
  const alt = await baueProduktionsRuntime({ schreiben: false });
  if (
    alt.module !== IMMUTABLE_115.module ||
    alt.bytes !== IMMUTABLE_115.bytes ||
    alt.sha256 !== IMMUTABLE_115.sha256
  ) {
    throw new Error(
      'Immutable Runtime 1.1.5 wurde durch Block 8.6 veraendert; Candidate-Build bleibt gesperrt.'
    );
  }

  const tempWurzel = await mkdtemp(path.join(os.tmpdir(), 'aio-v4-block86-candidate-'));
  try {
    const commonJsWurzel = await kompiliereCommonJs(tempWurzel);
    const entryId = 'ausfuehrung/adventure-land-block8-6-candidate-einstieg.js';
    const module = new Map();
    await sammle(commonJsWurzel, entryId, module);
    const bundle = candidateBundle(module, entryId);

    for (const pflicht of [
      'Adventure Land AiO Bot V4 | generated | Block 8.6 capability release candidate',
      'V4ProduktionsLaufzeit',
      'V4CapabilityLaufzeit',
      'V4Block86Candidate',
      'BLOCK8-6-CAPABILITY-SENDEN:'
    ]) {
      if (!bundle.includes(pflicht)) {
        throw new Error(`Block-8.6-Candidate-Marker fehlt: ${pflicht}`);
      }
    }

    const bytes = Buffer.byteLength(bundle, 'utf8');
    if (bytes <= IMMUTABLE_115.bytes || bytes > 8 * 1024 * 1024) {
      throw new Error(`Block-8.6-Candidate hat unplausible Groesse: ${bytes} Bytes.`);
    }
    const sha256 = createHash('sha256').update(bundle, 'utf8').digest('hex');
    if (!/^[a-f0-9]{64}$/.test(sha256)) {
      throw new Error('Block-8.6-Candidate konnte keinen gueltigen SHA-256 erzeugen.');
    }

    if (schreiben) {
      await mkdir(path.dirname(ausgabe), { recursive: true });
      await writeFile(ausgabe, bundle, 'utf8');
      await writeFile(sha256Ausgabe, `${sha256}\n`, 'utf8');
    }

    return Object.freeze({
      candidateVersion: '1.0.0',
      module: module.size,
      bytes,
      sha256,
      ausgabe: posix(path.relative(wurzel, ausgabe)),
      sha256Ausgabe: posix(path.relative(wurzel, sha256Ausgabe)),
      immutableRuntime115: IMMUTABLE_115,
      bundle
    });
  } finally {
    await rm(tempWurzel, { recursive: true, force: true });
  }
}

const direktGestartet =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);

if (direktGestartet) {
  const pruefen = process.argv.includes('--pruefen');
  const ergebnis = await baueBlock86Candidate({ schreiben: !pruefen });
  console.log(
    `Block-8.6 Capability-Candidate ${pruefen ? 'geprueft' : 'gebaut'}: ` +
    `${ergebnis.module} Module, ${ergebnis.bytes} Bytes, SHA-256 ${ergebnis.sha256}; ` +
    `immutable Runtime 1.1.5 weiterhin ${ergebnis.immutableRuntime115.module} Module / ` +
    `${ergebnis.immutableRuntime115.bytes} Bytes / ${ergebnis.immutableRuntime115.sha256}.`
  );
}
