'use strict';

const { createWebhookAlertTransport, validateWebhookUrl } = require('./alert-transports');

const WINDOWS_ALERT_SECRET_SCHEMA_VERSION = 1;
const ALERT_SECRET_ENV = 'AIO_V3_ALERT_SECRETS_JSON';
const BLOCKED_HEADER_NAMES = new Set([
  'host',
  'content-length',
  'connection',
  'transfer-encoding',
  'cookie',
  'set-cookie',
  'proxy-authorization',
  'proxy-authenticate',
  'upgrade'
]);

function bounded(value, max = 256) {
  return String(value == null ? '' : value).slice(0, max);
}

function sanitizeHeaders(value) {
  if (value == null) return {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('ALERT_HEADERS_INVALID');
  const out = {};
  const entries = Object.entries(value);
  if (entries.length > 8) throw new Error('ALERT_HEADERS_TOO_MANY');
  for (const [rawName, rawValue] of entries) {
    const name = String(rawName || '').trim();
    const lower = name.toLowerCase();
    if (!/^[A-Za-z0-9-]{1,64}$/.test(name) || BLOCKED_HEADER_NAMES.has(lower)) throw new Error('ALERT_HEADER_NOT_ALLOWED');
    const secret = String(rawValue == null ? '' : rawValue);
    if (!secret || secret.length > 2048 || /[\r\n]/.test(secret)) throw new Error('ALERT_HEADER_VALUE_INVALID');
    out[name] = secret;
  }
  return out;
}

function sanitizeRoute(value, name) {
  if (!value || typeof value !== 'object') throw new Error('ALERT_' + name.toUpperCase() + '_ROUTE_REQUIRED');
  const validation = validateWebhookUrl(value.url, false);
  if (!validation.valid || validation.secure !== true) throw new Error('ALERT_' + name.toUpperCase() + '_HTTPS_REQUIRED');
  const parsed = new URL(validation.url);
  if (parsed.username || parsed.password) throw new Error('ALERT_URL_USERINFO_FORBIDDEN');
  return {
    name,
    url: validation.url,
    hostname: parsed.hostname.toLowerCase(),
    headers: sanitizeHeaders(value.headers)
  };
}

function parseWindowsAlertSecrets(raw) {
  let value;
  try { value = typeof raw === 'string' ? JSON.parse(raw) : raw; }
  catch (_) { throw new Error('WINDOWS_ALERT_SECRETS_INVALID_JSON'); }
  if (!value || value.schemaVersion !== WINDOWS_ALERT_SECRET_SCHEMA_VERSION) throw new Error('WINDOWS_ALERT_SECRETS_SCHEMA_INVALID');
  const primary = sanitizeRoute(value.primary, 'primary');
  const fallback = sanitizeRoute(value.fallback, 'fallback');
  if (primary.hostname === fallback.hostname) throw new Error('WINDOWS_ALERT_ROUTES_NOT_INDEPENDENT');
  return { schemaVersion: WINDOWS_ALERT_SECRET_SCHEMA_VERSION, primary, fallback };
}

function createWindowsCriticalAlertTransports(secretBundle, options = {}) {
  const secrets = parseWindowsAlertSecrets(secretBundle);
  const common = {
    fetch: options.fetch,
    timeoutMs: options.timeoutMs,
    severities: ['CRITICAL'],
    required: true
  };
  const primary = createWebhookAlertTransport({
    ...common,
    name: 'critical-primary',
    url: secrets.primary.url,
    headers: secrets.primary.headers
  });
  const fallback = createWebhookAlertTransport({
    ...common,
    name: 'critical-fallback',
    url: secrets.fallback.url,
    headers: secrets.fallback.headers
  });
  return [primary, fallback];
}

async function canaryWindowsCriticalAlertRoutes(transports, options = {}) {
  const now = options.now || (() => Date.now());
  const routes = Array.isArray(transports) ? transports : [];
  if (routes.length !== 2) throw new Error('WINDOWS_ALERT_CANARY_TWO_ROUTES_REQUIRED');
  const canaryId = 'host-canary-' + now();
  const alert = {
    id: canaryId,
    severity: 'CRITICAL',
    type: 'HOST_ALERT_ROUTE_CANARY',
    reason: 'OPERATOR_INITIATED_DELIVERY_TEST',
    at: now(),
    source: 'windows-host',
    operatorCanary: true,
    gameplayActionAuthority: false,
    rawGameplayActionAuthority: false
  };
  const results = [];
  for (const transport of routes) {
    try {
      const result = await transport.send(alert);
      results.push({ name: bounded(transport.name, 64), ok: !!(result && result.ok !== false), error: null });
    } catch (error) {
      results.push({ name: bounded(transport && transport.name, 64), ok: false, error: bounded(error && error.message || error, 160) });
    }
  }
  return {
    schemaVersion: 1,
    type: 'WINDOWS_CRITICAL_ALERT_CANARY',
    at: now(),
    ok: results.length === 2 && results.every((row) => row.ok),
    routes: results,
    operatorAckAuthority: false,
    gameplayActionAuthority: false,
    rawGameplayActionAuthority: false
  };
}

function criticalAlertTransportStatus(transports) {
  return (Array.isArray(transports) ? transports : []).map((transport) => {
    const status = transport && typeof transport.status === 'function' ? transport.status() : {};
    return {
      name: bounded(transport && transport.name || status.name, 64),
      configured: status.configured === true,
      secure: status.secure === true,
      severities: Array.isArray(status.severities) ? status.severities.slice() : [],
      required: transport && transport.required !== false,
      credentialsExternal: true,
      secretsExposed: false,
      lastError: status.lastError || null,
      stats: status.stats || null
    };
  });
}

module.exports = {
  WINDOWS_ALERT_SECRET_SCHEMA_VERSION,
  ALERT_SECRET_ENV,
  parseWindowsAlertSecrets,
  createWindowsCriticalAlertTransports,
  canaryWindowsCriticalAlertRoutes,
  criticalAlertTransportStatus,
  sanitizeHeaders
};
