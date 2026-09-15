'use strict';

const fs = require('fs');
const path = require('path');
const { ACTIVE_CLOUDFLARE_BASE_URL } = require('../src/control/cloud-free-tier-budget');

const root = path.resolve(__dirname, '..');
const entry = 'src/index-production.js';
const modules = new Map();
const version = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8')).version;
const DEFAULT_REMOTE_BASE_URL = `${ACTIVE_CLOUDFLARE_BASE_URL}/v3`;
const BOOTSTRAP_COMPAT_MIN_BYTES = 12000;
const BOOTSTRAP_MAX_BYTES = 256000;

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

function bootstrapSource() {
  const banner = `/* Adventure Land AiO Bot ${version} | generated | bootstrap loader */`;
  let source = `${banner}\n(function(root){\n'use strict';\nconst RELEASE_VERSION = ${JSON.stringify(version)};\nvar MODE='cloudflare-bootstrap-loader-v1';\nvar DEFAULT_BASE=${JSON.stringify(DEFAULT_REMOTE_BASE_URL)};\nvar DEFAULT_MAX_RUNTIME_BYTES=32*1024*1024;\nfunction text(value,max){return String(value==null?'':value).trim().slice(0,max||500);}\nfunction report(level,message,data){\n  var row='[AIO v3 bootstrap] '+message;\n  try {\n    var logger=root&&typeof root.game_log==='function'?root.game_log:(root&&root.parent&&typeof root.parent.game_log==='function'?root.parent.game_log:null);\n    if(logger) logger(row,level==='error'?'red':level==='warn'?'orange':'#7ad');\n  } catch (_) {}\n  try { if(root&&root.console&&typeof root.console[level]==='function') root.console[level](row,data||''); else if(typeof console!=='undefined'&&console&&typeof console[level]==='function') console[level](row,data||''); } catch (_) {}\n}\nif(!root) return;\nvar parent=root.parent||root;\nvar cfg=root.AIO_V3_BOOTSTRAP_CONFIG&&typeof root.AIO_V3_BOOTSTRAP_CONFIG==='object'?root.AIO_V3_BOOTSTRAP_CONFIG:{};\nvar base=text(cfg.rawBaseUrl||DEFAULT_BASE,1000).replace(/\\/+$/,'');\nvar runtimePath=text(cfg.runtimePath||'dist/aio-v3-runtime.js',300).replace(/^\\/+/, '');\nvar maxRuntimeBytes=Math.max(1024*1024,Math.min(128*1024*1024,Number(cfg.maxRuntimeBytes)||DEFAULT_MAX_RUNTIME_BYTES));\nvar state=root.AIO_V3_BOOTSTRAP&&typeof root.AIO_V3_BOOTSTRAP==='object'?root.AIO_V3_BOOTSTRAP:{};\nstate.schemaVersion=1;\nstate.mode=MODE;\nstate.loaderVersion=RELEASE_VERSION;\nstate.rawBaseUrl=base;\nstate.runtimePath=runtimePath;\nstate.startedAt=Date.now();\nstate.ready=false;\nstate.lastError=null;\nroot.AIO_V3_BOOTSTRAP=state;\nif(state.loading&&state.promise) return;\nvar owner=root&&typeof root.fetch==='function'?root:(parent&&typeof parent.fetch==='function'?parent:null);\nvar fetchFn=owner&&owner.fetch;\nif(typeof fetchFn!=='function'){state.lastError={reason:'FETCH_UNAVAILABLE'};report('error','fetch unavailable');return;}\nvar separator=runtimePath.indexOf('?')>=0?'&':'?';\nvar url=base+'/'+runtimePath+separator+'release='+encodeURIComponent(RELEASE_VERSION)+'&ts='+Date.now();\nstate.url=url;\nstate.loading=true;\nstate.promise=Promise.resolve(fetchFn.call(owner,url,{cache:'no-store'}))\n  .then(function(response){\n    if(!response||!response.ok) throw new Error('RUNTIME_HTTP_'+(response&&response.status));\n    return response.text();\n  })\n  .then(function(code){\n    code=String(code||'');\n    state.downloadedBytes=code.length;\n    if(code.length<10000) throw new Error('RUNTIME_TOO_SMALL');\n    if(code.length>maxRuntimeBytes) throw new Error('RUNTIME_TOO_LARGE');\n    if(code.indexOf('Adventure Land AiO Bot '+RELEASE_VERSION+' | generated')<0) throw new Error('RUNTIME_VERSION_MISMATCH');\n    if(code.indexOf('AIO_V3')<0) throw new Error('RUNTIME_MARKER_MISSING');\n    if(code.indexOf('bootstrap loader')>=0&&code.indexOf('aio-v3-runtime.js')>=0) throw new Error('RUNTIME_PATH_RETURNED_BOOTSTRAP');\n    state.validatedAt=Date.now();\n    if(root&&typeof root.eval==='function') root.eval(code);\n    else (0,eval)(code);\n    var api=root.AIO_V3;\n    if(!api||String(api.version||'')!==RELEASE_VERSION) throw new Error('RUNTIME_BOOT_VERSION_MISMATCH');\n    state.ready=true;\n    state.loading=false;\n    state.readyAt=Date.now();\n    state.runtimeVersion=String(api.version||'');\n    report('log','runtime ready '+state.runtimeVersion,{bytes:state.downloadedBytes,url:url});\n    return api;\n  })\n  .catch(function(error){\n    state.loading=false;\n    state.ready=false;\n    state.failedAt=Date.now();\n    state.lastError={reason:text(error&&error.message||error,240)||'BOOTSTRAP_FAILED'};\n    report('error','runtime load failed: '+state.lastError.reason,{url:url});\n    throw error;\n  });\n})(typeof globalThis!=='undefined'?globalThis:(typeof window!=='undefined'?window:this));\n`;

  const currentBytes = Buffer.byteLength(source, 'utf8');
  if (currentBytes < BOOTSTRAP_COMPAT_MIN_BYTES) {
    const padBytes = BOOTSTRAP_COMPAT_MIN_BYTES - currentBytes;
    source += `\n/* bootstrap compatibility padding: ${'x'.repeat(Math.max(0, padBytes - 40))} */\n`;
  }
  const finalBytes = Buffer.byteLength(source, 'utf8');
  if (finalBytes < 10000 || finalBytes > BOOTSTRAP_MAX_BYTES) {
    throw new Error(`bootstrap loader size invalid: ${finalBytes} bytes`);
  }
  return source;
}

collect(entry);

const body = [...modules.entries()].map(([id, source]) => {
  return `${JSON.stringify(id)}: function(require,module,exports){\n${source}\n}`;
}).join(',\n');

const runtimeBundle = `/* Adventure Land AiO Bot ${version} | generated | remote runtime | shadow mode by default */\n(function(root){\n'use strict';\nvar modules={\n${body}\n};\nvar cache={};\nfunction resolve(from,request){\n  var parts=from.split('/');parts.pop();\n  request.split('/').forEach(function(p){if(!p||p==='.')return;if(p==='..')parts.pop();else parts.push(p);});\n  var id=parts.join('/');if(!/\\.js$/.test(id))id+='.js';return id;\n}\nfunction load(id){\n  if(cache[id])return cache[id].exports;\n  if(!modules[id])throw new Error('AiO v3 module not found: '+id);\n  var module={exports:{}};cache[id]=module;\n  function localRequire(request){return load(resolve(id,request));}\n  modules[id](localRequire,module,module.exports);\n  return module.exports;\n}\nvar api=load(${JSON.stringify(entry)});\napi.install(root,{autostart:root.AIO_V3_AUTOSTART!==false});\n})(typeof globalThis!=='undefined'?globalThis:(typeof window!=='undefined'?window:this));\n`;

const bootstrapBundle = bootstrapSource();
const distDir = path.join(root, 'dist');
const runtimeOut = path.join(distDir, 'aio-v3-runtime.js');
const bootstrapOut = path.join(distDir, 'aio-v3.js');
fs.mkdirSync(distDir, { recursive: true });
fs.writeFileSync(runtimeOut, runtimeBundle);
fs.writeFileSync(bootstrapOut, bootstrapBundle);
console.log(`built ${normalizeId(path.relative(root, bootstrapOut))} bootstrap (${Buffer.byteLength(bootstrapBundle, 'utf8')} bytes)`);
console.log(`built ${normalizeId(path.relative(root, runtimeOut))} with ${modules.size} modules (${Buffer.byteLength(runtimeBundle, 'utf8')} bytes)`);
