/* Adventure Land AiO Bot 3.0.0-alpha.20.139 | generated | bootstrap loader */
(function(root){
'use strict';
const RELEASE_VERSION = "3.0.0-alpha.20.139";
var MODE='cloudflare-bootstrap-loader-v1';
var DEFAULT_BASE="https://aio-bot-dashboard.hansijuergenlul.workers.dev/v3";
var DEFAULT_MAX_RUNTIME_BYTES=32*1024*1024;
function text(value,max){return String(value==null?'':value).trim().slice(0,max||500);}
function finite(value,fallback){var n=Number(value);return Number.isFinite(n)?n:fallback;}
function report(level,message,data){
  var row='[AIO v3 bootstrap] '+message;
  try {
    var logger=root&&typeof root.game_log==='function'?root.game_log:(root&&root.parent&&typeof root.parent.game_log==='function'?root.parent.game_log:null);
    if(logger) logger(row,level==='error'?'red':level==='warn'?'orange':'#7ad');
  } catch (_) {}
  try { if(root&&root.console&&typeof root.console[level]==='function') root.console[level](row,data||''); else if(typeof console!=='undefined'&&console&&typeof console[level]==='function') console[level](row,data||''); } catch (_) {}
}
if(!root) return;
var parent=root.parent||root;
var cfg=root.AIO_V3_BOOTSTRAP_CONFIG&&typeof root.AIO_V3_BOOTSTRAP_CONFIG==='object'?root.AIO_V3_BOOTSTRAP_CONFIG:{};
var base=text(cfg.rawBaseUrl||DEFAULT_BASE,1000).replace(/\/+$/,'');
var runtimePath=text(cfg.runtimePath||'dist/aio-v3-runtime.js',300).replace(/^\/+/, '');
var maxRuntimeBytes=Math.max(1024*1024,Math.min(128*1024*1024,finite(cfg.maxRuntimeBytes,DEFAULT_MAX_RUNTIME_BYTES)));
var retryBaseMs=Math.max(10,finite(cfg.retryBaseMs,5000));
var retryMaxMs=Math.max(retryBaseMs,finite(cfg.retryMaxMs,300000));
var updaterConfig=root.AIO_V3_AUTO_UPDATE_CONFIG&&typeof root.AIO_V3_AUTO_UPDATE_CONFIG==='object'?root.AIO_V3_AUTO_UPDATE_CONFIG:{};
if(updaterConfig.reloadHandshakeTimeoutMs==null) updaterConfig.reloadHandshakeTimeoutMs=60000;
root.AIO_V3_AUTO_UPDATE_CONFIG=updaterConfig;
var state=root.AIO_V3_BOOTSTRAP&&typeof root.AIO_V3_BOOTSTRAP==='object'?root.AIO_V3_BOOTSTRAP:{};
state.schemaVersion=1;
state.mode=MODE;
state.loaderVersion=RELEASE_VERSION;
state.rawBaseUrl=base;
state.runtimePath=runtimePath;
state.startedAt=Date.now();
state.ready=false;
state.lastError=null;
state.nextRetryAt=null;
root.AIO_V3_BOOTSTRAP=state;
var existing=root.AIO_V3;
if(existing&&existing.__runtime&&existing.__aioV3BootstrapProxy!==true){
  state.ready=String(existing.version||'')===RELEASE_VERSION;
  state.loading=false;
  state.runtimeVersion=String(existing.version||'');
  if(state.ready) state.readyAt=Date.now();
  return;
}
if(state.loading&&state.proxy&&root.AIO_V3===state.proxy) return;
var owner=root&&typeof root.fetch==='function'?root:(parent&&typeof parent.fetch==='function'?parent:null);
var fetchFn=owner&&owner.fetch;
var setTimer=root&&typeof root.setTimeout==='function'?root.setTimeout:(parent&&typeof parent.setTimeout==='function'?parent.setTimeout:(typeof setTimeout==='function'?setTimeout:null));
var clearTimer=root&&typeof root.clearTimeout==='function'?root.clearTimeout:(parent&&typeof parent.clearTimeout==='function'?parent.clearTimeout:(typeof clearTimeout==='function'?clearTimeout:null));
var token={id:'bootstrap-'+Date.now()+'-'+Math.random().toString(36).slice(2),active:true};
state.activationToken=token.id;
state.attempts=0;
state.failures=0;
var proxyRuntime={startedAt:Date.now(),lastHeartbeat:Date.now(),bootstrap:true};
var proxy={
  version:RELEASE_VERSION,
  __runtime:proxyRuntime,
  __aioV3BootstrapProxy:true,
  status:function(){proxyRuntime.lastHeartbeat=Date.now();return {version:RELEASE_VERSION,running:token.active,mode:MODE,bootstrap:true,ready:state.ready===true};},
  start:function(){if(!token.active)return false;proxyRuntime.lastHeartbeat=Date.now();return true;},
  stop:function(){
    token.active=false;state.loading=false;state.stoppedAt=Date.now();
    if(state.retryTimer&&clearTimer){try{clearTimer.call(root,state.retryTimer);}catch(_){}}
    state.retryTimer=null;state.nextRetryAt=null;return true;
  }
};
state.proxy=proxy;
root.AIO_V3=proxy;
state.loading=true;
function isActive(){return token.active&&state.activationToken===token.id&&root.AIO_V3===proxy;}
function restoreProxy(candidate){
  if(candidate&&candidate!==proxy&&typeof candidate.stop==='function'){try{candidate.stop();}catch(_){}}
  if(token.active&&state.activationToken===token.id) root.AIO_V3=proxy;
}
function scheduleRetry(error){
  if(!isActive()||!setTimer) return null;
  state.failures+=1;
  var exponent=Math.min(8,state.failures-1);
  var delay=Math.min(retryMaxMs,retryBaseMs*Math.pow(2,exponent));
  state.nextRetryAt=Date.now()+delay;
  report('warn','runtime load retry scheduled in '+delay+'ms',{reason:state.lastError&&state.lastError.reason,attempts:state.attempts});
  state.retryTimer=setTimer.call(root,function(){
    state.retryTimer=null;state.nextRetryAt=null;
    if(isActive()) state.promise=attemptLoad();
  },delay);
  return null;
}
function attemptLoad(){
  if(!isActive()) return Promise.resolve(null);
  state.attempts+=1;
  proxyRuntime.lastHeartbeat=Date.now();
  var separator=runtimePath.indexOf('?')>=0?'&':'?';
  var url=base+'/'+runtimePath+separator+'release='+encodeURIComponent(RELEASE_VERSION)+'&attempt='+state.attempts+'&ts='+Date.now();
  state.url=url;
  if(typeof fetchFn!=='function'){
    state.lastError={reason:'FETCH_UNAVAILABLE'};state.failedAt=Date.now();report('error','fetch unavailable');
    return Promise.resolve(scheduleRetry(new Error('FETCH_UNAVAILABLE')));
  }
  return Promise.resolve(fetchFn.call(owner,url,{cache:'no-store'}))
    .then(function(response){
      if(!response||!response.ok) throw new Error('RUNTIME_HTTP_'+(response&&response.status));
      return response.text();
    })
    .then(function(code){
      code=String(code||'');
      state.downloadedBytes=code.length;
      if(code.length<10000) throw new Error('RUNTIME_TOO_SMALL');
      if(code.length>maxRuntimeBytes) throw new Error('RUNTIME_TOO_LARGE');
      if(code.indexOf('Adventure Land AiO Bot '+RELEASE_VERSION+' | generated')<0) throw new Error('RUNTIME_VERSION_MISMATCH');
      if(code.indexOf('AIO_V3')<0) throw new Error('RUNTIME_MARKER_MISSING');
      if(code.indexOf('bootstrap loader')>=0&&code.indexOf('aio-v3-runtime.js')>=0) throw new Error('RUNTIME_PATH_RETURNED_BOOTSTRAP');
      if(!isActive()) throw new Error('BOOTSTRAP_ACTIVATION_SUPERSEDED');
      state.validatedAt=Date.now();
      root.AIO_V3=null;
      try {
        if(root&&typeof root.eval==='function') root.eval(code);
        else (0,eval)(code);
      } catch(error) {
        restoreProxy(root.AIO_V3);
        throw error;
      }
      var api=root.AIO_V3;
      if(!api||api===proxy||String(api.version||'')!==RELEASE_VERSION){
        restoreProxy(api);
        throw new Error('RUNTIME_BOOT_VERSION_MISMATCH');
      }
      token.active=false;
      state.ready=true;
      state.loading=false;
      state.readyAt=Date.now();
      state.runtimeVersion=String(api.version||'');
      state.lastError=null;
      state.nextRetryAt=null;
      report('log','runtime ready '+state.runtimeVersion,{bytes:state.downloadedBytes,url:url,attempts:state.attempts});
      return api;
    })
    .catch(function(error){
      var reason=text(error&&error.message||error,240)||'BOOTSTRAP_FAILED';
      state.failedAt=Date.now();
      state.lastError={reason:reason};
      if(reason==='BOOTSTRAP_ACTIVATION_SUPERSEDED'||!token.active||state.activationToken!==token.id||root.AIO_V3!==proxy){
        token.active=false;state.loading=false;state.nextRetryAt=null;
        report('warn','runtime activation superseded',{reason:reason,url:url});
        return null;
      }
      state.ready=false;
      report('error','runtime load failed: '+reason,{url:url,attempts:state.attempts});
      return scheduleRetry(error);
    });
}
state.promise=attemptLoad();
})(typeof globalThis!=='undefined'?globalThis:(typeof window!=='undefined'?window:this));

/* bootstrap compatibility padding: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx */
