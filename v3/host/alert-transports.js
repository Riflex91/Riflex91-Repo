'use strict';

function bounded(value, max = 256) {
  return String(value == null ? '' : value).slice(0, max);
}
function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}
function validateWebhookUrl(value, allowLoopbackHttp = false) {
  let url;
  try { url = new URL(String(value || '')); }
  catch (_) { return { valid: false, reason: 'INVALID_URL' }; }
  const host = url.hostname.toLowerCase();
  const loopback = host === '127.0.0.1' || host === '::1' || host === 'localhost';
  if (url.protocol === 'https:') return { valid: true, url: url.toString(), secure: true, loopback };
  if (allowLoopbackHttp && url.protocol === 'http:' && loopback) return { valid: true, url: url.toString(), secure: false, loopback: true };
  return { valid: false, reason: 'HTTPS_REQUIRED' };
}

function createWebhookAlertTransport(options = {}) {
  const fetchImpl = options.fetch || globalThis.fetch;
  const validation = validateWebhookUrl(options.url, options.allowLoopbackHttp === true);
  const name = bounded(options.name || 'webhook', 64) || 'webhook';
  const timeoutMs = Math.max(1000, Math.min(60000, Number(options.timeoutMs) || 10000));
  const severities = Array.isArray(options.severities) && options.severities.length
    ? options.severities.slice(0, 8).map((value) => String(value).toUpperCase())
    : ['CRITICAL'];
  const staticHeaders = options.headers && typeof options.headers === 'object' ? { ...options.headers } : {};
  const secretHeaderNames = new Set(Object.keys(staticHeaders).map((value) => value.toLowerCase()));
  const stats = { attempts: 0, successes: 0, failures: 0, timeouts: 0 };
  let lastError = null;

  async function send(alert) {
    stats.attempts += 1;
    if (!validation.valid) {
      stats.failures += 1;
      lastError = { code: validation.reason, at: Date.now() };
      throw new Error(validation.reason);
    }
    if (typeof fetchImpl !== 'function') {
      stats.failures += 1;
      lastError = { code: 'FETCH_UNAVAILABLE', at: Date.now() };
      throw new Error('FETCH_UNAVAILABLE');
    }

    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    try {
      const response = await fetchImpl(validation.url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...staticHeaders },
        body: JSON.stringify({ schemaVersion: 1, source: 'aio-v3-host', alert: clone(alert) }),
        signal: controller ? controller.signal : undefined,
        redirect: 'error'
      });
      if (!response || !response.ok) throw new Error(`HTTP_${response && response.status || 'UNKNOWN'}`);
      stats.successes += 1;
      lastError = null;
      return { ok: true, status: response.status };
    } catch (error) {
      if (error && error.name === 'AbortError') stats.timeouts += 1;
      stats.failures += 1;
      lastError = { code: error && error.name === 'AbortError' ? 'TRANSPORT_TIMEOUT' : 'TRANSPORT_FAILED', message: bounded(error && error.message || error), at: Date.now() };
      throw error;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  function status() {
    return {
      name,
      mode: 'https-json-webhook',
      configured: validation.valid,
      secure: validation.secure === true,
      loopback: validation.loopback === true,
      timeoutMs,
      severities: severities.slice(),
      credentialsExternal: true,
      headersExposed: false,
      headerCount: secretHeaderNames.size,
      gameplayActionAuthority: false,
      rawGameplayActionAuthority: false,
      lastError: clone(lastError),
      stats: { ...stats }
    };
  }

  return { name, severities, required: options.required !== false, send, status };
}

module.exports = { createWebhookAlertTransport, validateWebhookUrl };
