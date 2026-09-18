import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import * as tsPaket from 'typescript';
const ts = tsPaket.default ?? tsPaket;

const wurzel = process.cwd();
const quelleWurzel = path.join(wurzel, 'laufzeit', 'quelle');
const einstieg = path.join(quelleWurzel, 'ausfuehrung', 'adventure-land-produktions-einstieg.ts');
const versionPfad = path.join(wurzel, 'version.json');
const ausgabe = path.join(wurzel, 'dist', 'aio-v4-runtime.js');

function posix(wert) {
  return wert.split(path.sep).join('/');
}

function modulKennung(datei) {
  return posix(path.relative(wurzel, datei)).replace(/\.ts$/, '.js');
}

function resolveImport(vonDatei, anfrage) {
  if (!anfrage.startsWith('.')) throw new Error(`Externer Runtime-Import ist nicht erlaubt: ${anfrage} aus ${posix(path.relative(wurzel, vonDatei))}`);
  let ziel = path.resolve(path.dirname(vonDatei), anfrage);
  if (ziel.endsWith('.js')) ziel = ziel.slice(0, -3) + '.ts';
  else if (!path.extname(ziel)) ziel += '.ts';
  if (!ziel.startsWith(quelleWurzel + path.sep) && ziel !== quelleWurzel) {
    throw new Error(`Runtime-Import verlaesst laufzeit/quelle: ${anfrage}`);
  }
  return ziel;
}

function relativeImporte(source, datei) {
  const ast = ts.createSourceFile(datei, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
  const importe = [];
  for (const statement of ast.statements) {
    if ((ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) && statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)) {
      const anfrage = statement.moduleSpecifier.text;
      if (anfrage.startsWith('.')) importe.push(resolveImport(datei, anfrage));
      else throw new Error(`Externer Runtime-Import ist nicht erlaubt: ${anfrage}`);
    }
  }
  return importe;
}

async function sammle(datei, module) {
  const id = modulKennung(datei);
  if (module.has(id)) return;
  const source = await readFile(datei, 'utf8');
  module.set(id, source);
  for (const importDatei of relativeImporte(source, datei)) await sammle(importDatei, module);
}

function transpiliere(source, datei) {
  const ergebnis = ts.transpileModule(source, {
    fileName: datei,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: false,
      sourceMap: false,
      declaration: false,
      removeComments: false
    },
    reportDiagnostics: true
  });
  const fehler = (ergebnis.diagnostics ?? []).filter((diagnose) => diagnose.category === ts.DiagnosticCategory.Error);
  if (fehler.length > 0) {
    throw new Error(`TypeScript-Transpilierung fehlgeschlagen: ${fehler.map((d) => ts.flattenDiagnosticMessageText(d.messageText, ' ')).join(' | ')}`);
  }
  return ergebnis.outputText;
}

function runtimeBundle(module, version) {
  const body = [...module.entries()].map(([id, source]) => {
    const kompiliert = transpiliere(source, id.replace(/\.js$/, '.ts'));
    return `${JSON.stringify(id)}: function(require,module,exports){\n${kompiliert}\n}`;
  }).join(',\n');

  const entryId = modulKennung(einstieg);
  return `/* Adventure Land AiO Bot V4 | generated | production runtime | ${version} */\n(function(root){\n'use strict';\nvar modules={\n${body}\n};\nvar cache={};\nfunction resolve(from,request){var parts=from.split('/');parts.pop();request.split('/').forEach(function(p){if(!p||p==='.')return;if(p==='..')parts.pop();else parts.push(p);});var id=parts.join('/');if(!/\\.js$/.test(id))id+='.js';return id;}\nfunction load(id){if(cache[id])return cache[id].exports;if(!modules[id])throw new Error('V4 module not found: '+id);var module={exports:{}};cache[id]=module;function localRequire(request){return load(resolve(id,request));}modules[id](localRequire,module,module.exports);return module.exports;}\nvar entry=load(${JSON.stringify(entryId)});\nvar cfg=root.AIO_V4_RUNTIME_CONFIG&&typeof root.AIO_V4_RUNTIME_CONFIG==='object'?root.AIO_V4_RUNTIME_CONFIG:{};\nentry.installiereAdventureLandProduktionsLaufzeit(root,cfg);\n})(typeof globalThis!=='undefined'?globalThis:(typeof window!=='undefined'?window:this));\n`;
}

export async function baueProduktionsRuntime({ schreiben = true } = {}) {
  const version = JSON.parse(await readFile(versionPfad, 'utf8')).version;
  const module = new Map();
  await sammle(einstieg, module);
  const bundle = runtimeBundle(module, version);
  if (!bundle.includes('Adventure Land AiO Bot V4 | generated | production runtime')) throw new Error('Runtime-Marker fehlt.');
  if (!bundle.includes('V4ProduktionsLaufzeit')) throw new Error('Runtime enthaelt die Produktionslaufzeit nicht.');
  const bytes = Buffer.byteLength(bundle, 'utf8');
  if (bytes < 10_000 || bytes > 8 * 1024 * 1024) throw new Error(`V4-Produktionsruntime hat unplausible Groesse: ${bytes} Bytes.`);
  if (schreiben) {
    await mkdir(path.dirname(ausgabe), { recursive: true });
    await writeFile(ausgabe, bundle, 'utf8');
  }
  return Object.freeze({ version, module: module.size, bytes, ausgabe: posix(path.relative(wurzel, ausgabe)), bundle });
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const pruefen = process.argv.includes('--pruefen');
  const ergebnis = await baueProduktionsRuntime({ schreiben: !pruefen });
  console.log(`V4 Produktionsruntime ${pruefen ? 'geprueft' : 'gebaut'}: ${ergebnis.module} Module, ${ergebnis.bytes} Bytes${pruefen ? '' : `, ${ergebnis.ausgabe}`}.`);
}
