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
  let source = `${banner}\n(function(root){\n'use strict';\nconst RELEASE_VERSION = ${JSON.stringify(version)};\nvar MODE='cloudflare-bootstrap-loader-v1';\nvar DEFAULT_BASE=${JSON.stringify(DEFAULT_REMOTE_BASE_URL)};\nvar DEFAULT_MAX_RUNTIME_BYTES=32*1024*1024;\nfunction text(value,max){return String(value==null?'':value).trim().slice(0,max||500);}\nfunction finite(value,fallback){var n=Number(value);return Number.isFinite(n)?n:fallback;}\nfunction report(level,message,data){\n  var row='[AIO v3 bootstrap] '+message;\n  try {\n    var logger=root&&typeof root.game_log==='function'?root.game_log:(root&&root.parent&&typeof root.parent.game_log==='function'?root.parent.game_log:null);\n    if(logger) logger(row,level==='error'?'red':level==='warn'?'orange':'#7ad');\n  } catch (_) {}\n  try { if(root&&root.console&&typeof root.console[level]==='function') root.console[level](row,data||''); else if(typeof console!=='undefined'&&console&&typeof console[level]==='function') console[level](row,data||''); } catch (_) {}\n}\nif(!root) return;\nvar parent=root.parent||root;\nvar cfg=root.AIO_V3_BOOTSTRAP_CONFIG&&typeof root.AIO_V3_BOOTSTRAP_CONFIG==='object'?root.AIO_V3_BOOTSTRAP_CONFIG:{};\nvar base=text(cfg.rawBaseUrl||DEFAULT_BASE,1000).replace(/\\/+$/,'');\nvar runtimePath=text(cfg.runtimePath||'dist/aio-v3-runtime.js',300).replace(/^\\/+/, '');\nvar maxRuntimeBytes=Math.max(1024*1024,Math.min(128*1024*1024,finite(cfg.maxRuntimeBytes,DEFAULT_MAX_RUNTIME_BYTES)));\nvar retryBaseMs=Math.max(10,finite(cfg.retryBaseMs,5000));\nvar retryMaxMs=Math.max(retryBaseMs,finite(cfg.retryMaxMs,300000));\nvar updaterConfig=root.AIO_V3_AUTO_UPDATE_CONFIG&&typeof root.AIO_V3_AUTO_UPDATE_CONFIG==='object'?root.AIO_V3_AUTO_UPDATE_CONFIG:{};\nif(updaterConfig.reloadHandshakeTimeoutMs==null) updaterConfig.reloadHandshakeTimeoutMs=60000;\nroot.AIO_V3_AUTO_UPDATE_CONFIG=updaterConfig;\nvar state=root.AIO_V3_BOOTSTRAP&&typeof root.AIO_V3_BOOTSTRAP==='object'?root.AIO_V3_BOOTSTRAP:{};\nstate.schemaVersion=1;\nstate.mode=MODE;\nstate.loaderVersion=RELEASE_VERSION;\nstate.rawBaseUrl=base;\nstate.runtimePath=runtimePath;\nstate.startedAt=Date.now();\nstate.ready=false;\nstate.lastError=null;\nstate.nextRetryAt=null;\nroot.AIO_V3_BOOTSTRAP=state;\nvar existing=root.AIO_V3;\nif(existing&&existing.__runtime&&existing.__aioV3BootstrapProxy!==true){\n  state.ready=String(existing.version||'')===RELEASE_VERSION;\n  state.loading=false;\n  state.runtimeVersion=String(existing.version||'');\n  if(state.ready) state.readyAt=Date.now();\n  return;\n}\nif(state.loading&&state.proxy&&root.AIO_V3===state.proxy) return;\nvar owner=root&&typeof root.fetch==='function'?root:(parent&&typeof parent.fetch==='function'?parent:null);\nvar fetchFn=owner&&owner.fetch;\nvar setTimer=root&&typeof root.setTimeout==='function'?root.setTimeout:(parent&&typeof parent.setTimeout==='function'?parent.setTimeout:(typeof setTimeout==='function'?setTimeout:null));\nvar clearTimer=root&&typeof root.clearTimeout==='function'?root.clearTimeout:(parent&&typeof parent.clearTimeout==='function'?parent.clearTimeout:(typeof clearTimeout==='function'?clearTimeout:null));\nvar token={id:'bootstrap-'+Date.now()+'-'+Math.random().toString(36).slice(2),active:true};\nstate.activationToken=token.id;\nstate.attempts=0;\nstate.failures=0;\nvar proxyRuntime={startedAt:Date.now(),lastHeartbeat:Date.now(),bootstrap:true};\nvar proxy={\n  version:RELEASE_VERSION,\n  __runtime:proxyRuntime,\n  __aioV3BootstrapProxy:true,\n  status:function(){proxyRuntime.lastHeartbeat=Date.now();return {version:RELEASE_VERSION,running:token.active,mode:MODE,bootstrap:true,ready:state.ready===true};},\n  start:function(){if(!token.active)return false;proxyRuntime.lastHeartbeat=Date.now();return true;},\n  stop:function(){\n    token.active=false;state.loading=false;state.stoppedAt=Date.now();\n    if(state.retryTimer&&clearTimer){try{clearTimer.call(root,state.retryTimer);}catch(_){}}\n    state.retryTimer=null;state.nextRetryAt=null;return true;\n  }\n};\nstate.proxy=proxy;\nroot.AIO_V3=proxy;\nstate.loading=true;\nfunction isActive(){return token.active&&state.activationToken===token.id&&root.AIO_V3===proxy;}\nfunction restoreProxy(candidate){\n  if(candidate&&candidate!==proxy&&typeof candidate.stop==='function'){try{candidate.stop();}catch(_){}}\n  if(token.active&&state.activationToken===token.id) root.AIO_V3=proxy;\n}\nfunction scheduleRetry(error){\n  if(!isActive()||!setTimer) return null;\n  state.failures+=1;\n  var exponent=Math.min(8,state.failures-1);\n  var delay=Math.min(retryMaxMs,retryBaseMs*Math.pow(2,exponent));\n  state.nextRetryAt=Date.now()+delay;\n  report('warn','runtime load retry scheduled in '+delay+'ms',{reason:state.lastError&&state.lastError.reason,attempts:state.attempts});\n  state.retryTimer=setTimer.call(root,function(){\n    state.retryTimer=null;state.nextRetryAt=null;\n    if(isActive()) state.promise=attemptLoad();\n  },delay);\n  return null;\n}\nfunction attemptLoad(){\n  if(!isActive()) return Promise.resolve(null);\n  state.attempts+=1;\n  proxyRuntime.lastHeartbeat=Date.now();\n  var separator=runtimePath.indexOf('?')>=0?'&':'?';\n  var url=base+'/'+runtimePath+separator+'release='+encodeURIComponent(RELEASE_VERSION)+'&attempt='+state.attempts+'&ts='+Date.now();\n  state.url=url;\n  if(typeof fetchFn!=='function'){\n    state.lastError={reason:'FETCH_UNAVAILABLE'};state.failedAt=Date.now();report('error','fetch unavailable');\n    return Promise.resolve(scheduleRetry(new Error('FETCH_UNAVAILABLE')));\n  }\n  return Promise.resolve(fetchFn.call(owner,url,{cache:'no-store'}))\n    .then(function(response){\n      if(!response||!response.ok) throw new Error('RUNTIME_HTTP_'+(response&&response.status));\n      return response.text();\n    })\n    .then(function(code){\n      code=String(code||'');\n      state.downloadedBytes=code.length;\n      if(code.length<10000) throw new Error('RUNTIME_TOO_SMALL');\n      if(code.length>maxRuntimeBytes) throw new Error('RUNTIME_TOO_LARGE');\n      if(code.indexOf('Adventure Land AiO Bot '+RELEASE_VERSION+' | generated')<0) throw new Error('RUNTIME_VERSION_MISMATCH');\n      if(code.indexOf('AIO_V3')<0) throw new Error('RUNTIME_MARKER_MISSING');\n      if(code.indexOf('bootstrap loader')>=0&&code.indexOf('aio-v3-runtime.js')>=0) throw new Error('RUNTIME_PATH_RETURNED_BOOTSTRAP');\n      if(!isActive()) throw new Error('BOOTSTRAP_ACTIVATION_SUPERSEDED');\n      state.validatedAt=Date.now();\n      root.AIO_V3=null;\n      try {\n        if(root&&typeof root.eval==='function') root.eval(code);\n        else (0,eval)(code);\n      } catch(error) {\n        restoreProxy(root.AIO_V3);\n        throw error;\n      }\n      var api=root.AIO_V3;\n      if(!api||api===proxy||String(api.version||'')!==RELEASE_VERSION){\n        restoreProxy(api);\n        throw new Error('RUNTIME_BOOT_VERSION_MISMATCH');\n      }\n      token.active=false;\n      state.ready=true;\n      state.loading=false;\n      state.readyAt=Date.now();\n      state.runtimeVersion=String(api.version||'');\n      state.lastError=null;\n      state.nextRetryAt=null;\n      report('log','runtime ready '+state.runtimeVersion,{bytes:state.downloadedBytes,url:url,attempts:state.attempts});\n      return api;\n    })\n    .catch(function(error){\n      var reason=text(error&&error.message||error,240)||'BOOTSTRAP_FAILED';\n      state.failedAt=Date.now();\n      state.lastError={reason:reason};\n      if(reason==='BOOTSTRAP_ACTIVATION_SUPERSEDED'||!token.active||state.activationToken!==token.id||root.AIO_V3!==proxy){\n        token.active=false;state.loading=false;state.nextRetryAt=null;\n        report('warn','runtime activation superseded',{reason:reason,url:url});\n        return null;\n      }\n      state.ready=false;\n      report('error','runtime load failed: '+reason,{url:url,attempts:state.attempts});\n      return scheduleRetry(error);\n    });\n}\nstate.promise=attemptLoad();\n})(typeof globalThis!=='undefined'?globalThis:(typeof window!=='undefined'?window:this));\n`;

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
