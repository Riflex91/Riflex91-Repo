'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const entry = 'src/index.js';
const modules = new Map();
const version = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8')).version;

function normalizeId(p) { return p.split(path.sep).join('/'); }

function resolve(fromId, request) {
  if (!request.startsWith('.')) throw new Error(`external require not supported: ${request} from ${fromId}`);
  const base = path.posix.dirname(fromId);
  let resolved = path.posix.normalize(path.posix.join(base, request));
  if (!path.posix.extname(resolved)) resolved += '.js';
  return resolved;
}

function collect(id) {
  if (modules.has(id)) return;
  const abs = path.join(root, id);
  const source = fs.readFileSync(abs, 'utf8');
  modules.set(id, source);
  for (const match of source.matchAll(/require\((['"])(.+?)\1\)/g)) collect(resolve(id, match[2]));
}

collect(entry);

const body = [...modules.entries()].map(([id, source]) => {
  return `${JSON.stringify(id)}: function(require,module,exports){\n${source}\n}`;
}).join(',\n');

const bundle = `/* Adventure Land AiO Bot ${version} | generated | shadow mode by default */\n(function(root){\n'use strict';\nvar modules={\n${body}\n};\nvar cache={};\nfunction resolve(from,request){\n  var parts=from.split('/');parts.pop();\n  request.split('/').forEach(function(p){if(!p||p==='.')return;if(p==='..')parts.pop();else parts.push(p);});\n  var id=parts.join('/');if(!/\\.js$/.test(id))id+='.js';return id;\n}\nfunction load(id){\n  if(cache[id])return cache[id].exports;\n  if(!modules[id])throw new Error('AiO v3 module not found: '+id);\n  var module={exports:{}};cache[id]=module;\n  function localRequire(request){return load(resolve(id,request));}\n  modules[id](localRequire,module,module.exports);\n  return module.exports;\n}\nvar api=load(${JSON.stringify(entry)});\napi.install(root,{autostart:root.AIO_V3_AUTOSTART!==false});\n})(typeof globalThis!=='undefined'?globalThis:(typeof window!=='undefined'?window:this));\n`;

const out = path.join(root, 'dist', 'aio-v3.js');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, bundle);
console.log(`built ${normalizeId(path.relative(root, out))} with ${modules.size} modules (${bundle.length} bytes)`);
