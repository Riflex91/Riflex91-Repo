'use strict';

const CONTEXT = new WeakMap();
const DEFAULT_ALLOWED_ORIGINS = Object.freeze(['https://adventure.land']);
const MAX_CLAIM_IDS = 100;
const MAX_ID_LENGTH = 160;
const MAX_DEBUG_EVENTS = 200;
function finite(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function bounded(value, max = 256) { return String(value == null ? '' : value).slice(0, max); }

function browserDispatcher(payload) {
  const aio = globalThis.AIO_V3; const operations = aio && aio.operations;
  if (!operations || typeof operations !== 'object') throw new Error('AIO_V3_OPERATIONS_UNAVAILABLE');
  switch (payload && payload.operation) {
    case 'HOST_HEARTBEAT': if (typeof operations.hostHeartbeat !== 'function') throw new Error('HOST_HEARTBEAT_UNAVAILABLE'); return operations.hostHeartbeat();
    case 'PENDING_ALERTS': if (typeof operations.pendingAlerts !== 'function') throw new Error('PENDING_ALERTS_UNAVAILABLE'); return operations.pendingAlerts(payload.limit);
    case 'CLAIM_ALERTS': if (typeof operations.claimAlerts !== 'function') throw new Error('CLAIM_ALERTS_UNAVAILABLE'); return operations.claimAlerts(payload.ids);
    case 'RECONCILIATION_STATUS': if (typeof operations.reconciliationStatus !== 'function') throw new Error('RECONCILIATION_UNAVAILABLE'); return operations.reconciliationStatus();
    case 'DEBUG_SNAPSHOT': {
      if (typeof operations.status !== 'function') throw new Error('DEBUG_STATUS_UNAVAILABLE');
      const runtimeStatus = aio && typeof aio.status === 'function' ? aio.status() : {};
      const performance = aio && aio.performance && typeof aio.performance.status === 'function' ? aio.performance.status() : null;
      const farmer = aio && aio.farmer && typeof aio.farmer.status === 'function' ? aio.farmer.status() : null;
      const merchantService = aio && aio.merchantService && typeof aio.merchantService.status === 'function' ? aio.merchantService.status() : null;
      return { schemaVersion: 1, type: 'AIO_V3_DEBUG_SNAPSHOT', status: { ...operations.status(), runtime: runtimeStatus, performance, farmer, merchantService }, heartbeat: operations.hostHeartbeat(), reconciliation: operations.reconciliationStatus() };
    }
    case 'DEBUG_EVENTS': {
      const limit = Math.max(1, Math.min(200, Math.floor(Number(payload.limit) || 100))); const afterSeq = Math.max(0, Math.floor(Number(payload.afterSeq) || 0));
      const rows = operations.peekTelemetry(2000); const events = Array.isArray(rows) ? rows.filter(row => row && Number(row.seq) > afterSeq).slice(0, limit) : [];
      return { schemaVersion: 1, type: 'AIO_V3_DEBUG_EVENTS', afterSeq, events };
    }
    default: throw new Error('HOST_OPERATION_NOT_ALLOWED');
  }
}
function normalizeAllowedOrigins(values, allowInsecureLoopbackForTests) {
  const source = Array.isArray(values) && values.length ? values : DEFAULT_ALLOWED_ORIGINS; const result = new Set();
  for (const candidate of source.slice(0, 16)) { let parsed; try { parsed = new URL(String(candidate)); } catch (_) { throw new Error('BROWSER_BRIDGE_ORIGIN_INVALID'); } const loopback = ['127.0.0.1','::1','localhost'].includes(parsed.hostname); if (parsed.protocol !== 'https:' && !(allowInsecureLoopbackForTests === true && parsed.protocol === 'http:' && loopback)) throw new Error('BROWSER_BRIDGE_HTTPS_ORIGIN_REQUIRED'); result.add(parsed.origin); }
  if (!result.size) throw new Error('BROWSER_BRIDGE_ALLOWED_ORIGIN_REQUIRED'); return result;
}
function validateClaimIds(ids) { if (!Array.isArray(ids)) throw new Error('CLAIM_IDS_ARRAY_REQUIRED'); if (ids.length > MAX_CLAIM_IDS) throw new Error('CLAIM_IDS_LIMIT_EXCEEDED'); const seen = new Set(), output = []; for (const raw of ids) { if (typeof raw !== 'string' || raw.length < 1 || raw.length > MAX_ID_LENGTH) throw new Error('CLAIM_ID_INVALID'); if (seen.has(raw)) throw new Error('CLAIM_ID_DUPLICATE'); seen.add(raw); output.push(raw); } return output; }
class BrowserBotClient {
  constructor(options = {}) { const page = options.page || options.frame || options.context; if (!page || typeof page.evaluate !== 'function') throw new Error('BROWSER_EXECUTION_CONTEXT_REQUIRED'); CONTEXT.set(this,page); this.now=options.now||(()=>Date.now()); this.timeoutMs=Math.max(250,Math.min(30000,finite(options.timeoutMs,3000))); this.maxResultBytes=Math.max(4096,Math.min(1024*1024,Math.floor(finite(options.maxResultBytes,256*1024)))); this.allowedOrigins=normalizeAllowedOrigins(options.allowedOrigins,options.allowInsecureLoopbackForTests===true); this.inFlight=null; this.lastError=null; this.lastSuccessAt=null; this.stats={calls:0,successes:0,failures:0,timeouts:0,busyRejects:0,originRejects:0,inputRejects:0,resultRejects:0}; }
  _page(){return CONTEXT.get(this)||null;} _readOrigin(){const page=this._page();if(!page)throw new Error('BROWSER_CONTEXT_UNAVAILABLE');if(typeof page.isClosed==='function'&&page.isClosed())throw new Error('BROWSER_CONTEXT_CLOSED');let value=null;try{value=typeof page.url==='function'?page.url():page.url;}catch(_){throw new Error('BROWSER_CONTEXT_URL_UNAVAILABLE');}let parsed;try{parsed=new URL(String(value||''));}catch(_){throw new Error('BROWSER_CONTEXT_URL_INVALID');}return parsed.origin;}
  _assertOrigin(){const origin=this._readOrigin();if(!this.allowedOrigins.has(origin)){this.stats.originRejects+=1;throw new Error('BROWSER_CONTEXT_ORIGIN_REJECTED');}return origin;}
  _sanitizeResult(value){let json;try{json=JSON.stringify(value);}catch(_){this.stats.resultRejects+=1;throw new Error('BROWSER_RESULT_NOT_SERIALIZABLE');}if(json==null)throw new Error('BROWSER_RESULT_UNDEFINED');if(Buffer.byteLength(json,'utf8')>this.maxResultBytes){this.stats.resultRejects+=1;throw new Error('BROWSER_RESULT_TOO_LARGE');}return JSON.parse(json);}
  _recordError(error){this.stats.failures+=1;this.lastError={at:this.now(),code:bounded(error&&error.message||error||'BROWSER_BRIDGE_FAILED',128)};return new Error(this.lastError.code);}
  async _call(operation,payload={}){if(this.inFlight){this.stats.busyRejects+=1;throw this._recordError(new Error('BROWSER_BRIDGE_BUSY'));}try{this._assertOrigin();}catch(error){throw this._recordError(error);}const page=this._page(),request={operation,...payload};this.stats.calls+=1;const call={operation,startedAt:this.now()};this.inFlight=call;let timer=null;const evaluation=Promise.resolve().then(()=>page.evaluate(browserDispatcher,request)).then(value=>({ok:true,value}),error=>({ok:false,error})).then(settled=>{if(this.inFlight===call)this.inFlight=null;return settled;});const timeout=new Promise(resolve=>{timer=setTimeout(()=>resolve({timeout:true}),this.timeoutMs);});const settled=await Promise.race([evaluation,timeout]);if(timer)clearTimeout(timer);if(settled&&settled.timeout){this.stats.timeouts+=1;throw this._recordError(new Error('BROWSER_BRIDGE_TIMEOUT'));}if(!settled||settled.ok!==true)throw this._recordError(settled&&settled.error||new Error('BROWSER_BRIDGE_EVALUATION_FAILED'));try{const result=this._sanitizeResult(settled.value);this.stats.successes+=1;this.lastSuccessAt=this.now();this.lastError=null;return result;}catch(error){throw this._recordError(error);}}
  hostHeartbeat(){return this._call('HOST_HEARTBEAT');} pendingAlerts(limit=100){return this._call('PENDING_ALERTS',{limit:Math.max(1,Math.min(100,Math.floor(finite(limit,100))))});} async claimAlerts(ids=[]){let validated;try{validated=validateClaimIds(ids);}catch(error){this.stats.inputRejects+=1;throw this._recordError(error);}return validated.length?this._call('CLAIM_ALERTS',{ids:validated}):[];} reconciliationStatus(){return this._call('RECONCILIATION_STATUS');} debugSnapshot(){return this._call('DEBUG_SNAPSHOT');} debugEvents(afterSeq=0,limit=100){return this._call('DEBUG_EVENTS',{afterSeq:Math.max(0,Math.floor(finite(afterSeq,0))),limit:Math.max(1,Math.min(MAX_DEBUG_EVENTS,Math.floor(finite(limit,100))))});}
  status(){let origin=null;try{origin=this._readOrigin();}catch(_){}const allowedOperations=['HOST_HEARTBEAT','PENDING_ALERTS','CLAIM_ALERTS','RECONCILIATION_STATUS'];const readOnlyDebugOperations=['DEBUG_SNAPSHOT','DEBUG_EVENTS'];return{mode:'narrow-browser-bot-client',origin,originAllowed:origin==null?false:this.allowedOrigins.has(origin),timeoutMs:this.timeoutMs,maxResultBytes:this.maxResultBytes,inFlight:this.inFlight?{...this.inFlight}:null,allowedOperations,readOnlyDebugOperations,allAllowedOperations:allowedOperations.concat(readOnlyDebugOperations),arbitraryEvaluateExposed:false,genericInvokeExposed:false,gameplayActionAuthority:false,rawGameplayActionAuthority:false,lastSuccessAt:this.lastSuccessAt,lastError:this.lastError?{...this.lastError}:null,stats:{...this.stats}};}
}
module.exports={BrowserBotClient,DEFAULT_ALLOWED_ORIGINS,MAX_CLAIM_IDS,MAX_ID_LENGTH,MAX_DEBUG_EVENTS,browserDispatcher,validateClaimIds};
