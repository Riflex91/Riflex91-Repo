'use strict';

const fs = require('node:fs');
const crypto = require('node:crypto');
const {
  GATE_ORDER,
  HashChainedCertificationEvidence,
  assessHostCertificationStatus,
  evaluateCertification,
  verifyPassedEvidence,
  gateDefinition,
  previousGate
} = require('./unattended-certification');

function argsMap(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const value = String(argv[i]);
    if (!value.startsWith('--')) { out._.push(value); continue; }
    const key = value.slice(2);
    const next = argv[i + 1];
    if (next != null && !String(next).startsWith('--')) { out[key] = String(next); i += 1; }
    else out[key] = true;
  }
  return out;
}
function bounded(value, max = 512) {
  return String(value == null ? '' : value).slice(0, max);
}
function bool(value) {
  return value === true || /^(1|true|yes|on)$/i.test(String(value || ''));
}
function validateLoopbackEndpoint(value) {
  let url;
  try { url = new URL(String(value || 'http://127.0.0.1:8791')); }
  catch (_) { throw new Error('CERTIFICATION_API_URL_INVALID'); }
  const host = url.hostname.toLowerCase();
  if (url.protocol !== 'http:' || !['127.0.0.1','localhost','::1','[::1]'].includes(host)) throw new Error('CERTIFICATION_API_LOOPBACK_REQUIRED');
  url.pathname = '/v1/status';
  url.search = '';
  url.hash = '';
  return url.toString();
}
function existingFinal(rows) {
  const finals = rows.filter((row) => row.kind === 'FINAL' && row.payload && row.payload.result);
  return finals.length ? finals[finals.length - 1] : null;
}
function gateFromRows(rows, fallback) {
  const start = rows.find((row) => row.kind === 'START' && row.payload && row.payload.gate);
  return start ? String(start.payload.gate) : String(fallback || '');
}
function print(value, stream = process.stdout) {
  stream.write(JSON.stringify(value, null, 2) + '\n');
}

async function fetchStatus(endpoint, token, fetchImpl = globalThis.fetch) {
  if (typeof fetchImpl !== 'function') throw new Error('CERTIFICATION_FETCH_UNAVAILABLE');
  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), 10000) : null;
  try {
    const response = await fetchImpl(endpoint, {
      method: 'GET',
      headers: { authorization: 'Bearer ' + token, accept: 'application/json' },
      cache: 'no-store',
      redirect: 'error',
      signal: controller ? controller.signal : undefined
    });
    if (!response || !response.ok) throw new Error('CERTIFICATION_HOST_API_HTTP_' + (response && response.status || 'UNKNOWN'));
    const text = await response.text();
    if (text.length > 2 * 1024 * 1024) throw new Error('CERTIFICATION_HOST_API_RESPONSE_TOO_LARGE');
    return JSON.parse(text);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function initialize(store, gateName, prerequisitePath = null, now = Date.now()) {
  const rows = store.readVerified();
  const final = existingFinal(rows);
  if (final) return { initialized: false, final: final.payload.result, store: store.status() };
  const existingGate = gateFromRows(rows, null);
  if (existingGate && existingGate !== gateName) throw new Error('CERTIFICATION_EVIDENCE_GATE_MISMATCH');
  const gate = gateDefinition(gateName);
  if (!existingGate) store.append('START', {
    gate: gate.name,
    certificationId: crypto.randomUUID(),
    durationMs: gate.durationMs,
    pollMs: gate.pollMs,
    maxGapMs: gate.maxGapMs,
    gameplayActionAuthority: false,
    rawGameplayActionAuthority: false,
    restartAuthority: false,
    operatorAckAuthority: false
  }, now);

  const refreshed = store.readVerified();
  if (gate.prerequisite) {
    const markerType = 'prerequisite:' + gate.prerequisite;
    const already = refreshed.some((row) => row.kind === 'MARKER' && row.payload && row.payload.type === markerType && row.payload.ok === true);
    if (!already) {
      if (!prerequisitePath) throw new Error('CERTIFICATION_PREREQUISITE_EVIDENCE_REQUIRED:' + gate.prerequisite);
      const proof = verifyPassedEvidence(prerequisitePath, gate.prerequisite);
      store.append('MARKER', { type: markerType, ok: true, proof }, now);
    }
  }
  return { initialized: true, gate: gate.name, store: store.status() };
}

async function collect(options = {}) {
  const store = new HashChainedCertificationEvidence({ filePath: options.evidencePath, now: options.now });
  const gateName = String(options.gate || '');
  initialize(store, gateName, options.prerequisitePath, options.now ? options.now() : Date.now());
  let rows = store.readVerified();
  const final = existingFinal(rows);
  if (final) return final.payload.result;

  const gate = gateDefinition(gateName);
  const endpoint = validateLoopbackEndpoint(options.endpoint);
  const token = String(options.token || '');
  if (token.length < 32) throw new Error('CERTIFICATION_HOST_API_TOKEN_REQUIRED');
  const sleep = options.sleep || ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const nowFn = options.now || (() => Date.now());
  const maxIterations = Number.isFinite(Number(options.maxIterations)) ? Math.max(1, Number(options.maxIterations)) : Infinity;

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    const before = store.readVerified();
    const beforeResult = evaluateCertification(before, gate, nowFn());
    if (beforeResult.reasons.some((reason) => /^INITIAL_SAMPLE_GAP_EXCEEDED|^SAMPLE_GAP_EXCEEDED/.test(reason))) {
      store.append('FINAL', { result: beforeResult }, nowFn());
      return beforeResult;
    }

    let assessment;
    let apiError = null;
    try {
      const payload = await fetchStatus(endpoint, token, options.fetch);
      assessment = assessHostCertificationStatus(payload, nowFn());
    } catch (error) {
      apiError = bounded(error && error.message || error, 220);
      assessment = { ok: false, reasons: ['HOST_API_SAMPLE_FAILED'], facts: { error: apiError } };
    }
    store.append('SAMPLE', { assessment, endpoint: 'loopback-host-api' }, nowFn());

    rows = store.readVerified();
    const result = evaluateCertification(rows, gate, nowFn());
    if (!assessment.ok) {
      store.append('FINAL', { result }, nowFn());
      return result;
    }
    if (result.passed) {
      store.append('FINAL', { result }, nowFn());
      return result;
    }

    if (iteration + 1 >= maxIterations) return result;
    await sleep(gate.pollMs);
  }
  return evaluateCertification(store.readVerified(), gate, nowFn());
}

async function main(argv = process.argv.slice(2), env = process.env) {
  const parsed = argsMap(argv);
  const command = parsed._[0] || 'status';
  const evidencePath = parsed.evidence;
  if (!evidencePath) throw new Error('CERTIFICATION_EVIDENCE_PATH_REQUIRED');

  if (command === 'init') {
    const gate = String(parsed.gate || '');
    const store = new HashChainedCertificationEvidence({ filePath: evidencePath });
    const result = initialize(store, gate, parsed.prerequisite || null);
    print(result);
    return result;
  }

  if (command === 'mark') {
    const store = new HashChainedCertificationEvidence({ filePath: evidencePath });
    const type = bounded(parsed.type, 120);
    if (!type) throw new Error('CERTIFICATION_MARKER_TYPE_REQUIRED');
    let data = null;
    if (parsed.json) {
      try { data = JSON.parse(parsed.json); }
      catch (_) { throw new Error('CERTIFICATION_MARKER_JSON_INVALID'); }
    }
    const row = store.append('MARKER', { type, ok: bool(parsed.ok), data });
    print({ marked: true, seq: row.seq, type, ok: bool(parsed.ok), terminalHash: row.hash });
    return row;
  }

  const store = new HashChainedCertificationEvidence({ filePath: evidencePath });
  const rows = store.readVerified();
  const gateName = gateFromRows(rows, parsed.gate);
  if (!GATE_ORDER.includes(gateName)) throw new Error('CERTIFICATION_GATE_INVALID');
  const gate = gateDefinition(gateName);

  if (command === 'status') {
    const result = evaluateCertification(rows, gate, Date.now());
    const final = existingFinal(rows);
    const output = { evidence: store.status(), result, final: final ? final.payload.result : null };
    print(output);
    return output;
  }

  if (command === 'finalize') {
    const result = evaluateCertification(rows, gate, Date.now());
    if (!existingFinal(rows)) store.append('FINAL', { result });
    print(result);
    process.exitCode = result.passed ? 0 : 2;
    return result;
  }

  if (command === 'verify') {
    const proof = verifyPassedEvidence(evidencePath, gateName);
    print({ verified: true, ...proof });
    return proof;
  }

  if (command === 'collect') {
    const result = await collect({
      gate: gateName,
      evidencePath,
      prerequisitePath: parsed.prerequisite || null,
      endpoint: parsed.endpoint || 'http://127.0.0.1:8791',
      token: env.AIO_V3_HOST_API_TOKEN
    });
    print(result);
    process.exitCode = result.passed ? 0 : 2;
    return result;
  }

  throw new Error('CERTIFICATION_COMMAND_INVALID');
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(bounded(error && error.message || error || 'CERTIFICATION_FATAL', 240) + '\n');
    process.exitCode = 1;
  });
}

module.exports = { argsMap, validateLoopbackEndpoint, fetchStatus, initialize, collect, main };
