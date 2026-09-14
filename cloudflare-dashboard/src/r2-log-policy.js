const SECRET_KEY_PATTERN = /(write.?key|read.?key|admin.?key|authorization|api.?key|secret|token)/i;
const IMPORTANT_PATTERN = /(safety|unsafe|quarant|retreat|emergency|fatal|fail|error|circuit|rollback|bootstrap|transaction|death|dead|disconnect|content.?drift|target.?reject|threat)/i;
const IMPORTANT_SEVERITIES = new Set(['warn', 'warning', 'error', 'critical', 'fatal', 'emergency', 'alert']);

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function text(value, max = 300) {
  return String(value == null ? '' : value).trim().slice(0, max);
}

export function safeSegment(value, fallback = 'default', max = 100) {
  const raw = text(value || fallback, max);
  const clean = raw.replace(/[^A-Za-z0-9_.:@-]/g, '_').replace(/^\.+/, '_');
  return clean || fallback;
}

export function redactDeep(value, depth = 0) {
  if (depth > 8) return null;
  if (Array.isArray(value)) return value.slice(0, 500).map((entry) => redactDeep(entry, depth + 1));
  if (!value || typeof value !== 'object') return value;
  const out = {};
  for (const [key, entry] of Object.entries(value)) {
    if (SECRET_KEY_PATTERN.test(key)) {
      out[key] = '[REDACTED]';
      continue;
    }
    out[key] = redactDeep(entry, depth + 1);
  }
  return out;
}

export function eventTime(event, fallback) {
  const raw = event && (event.at || event.ts || event.time || event.createdAt);
  const numeric = Number(raw);
  if (Number.isFinite(numeric) && numeric > 1e12) return numeric;
  const parsed = Date.parse(String(raw || ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function eventKey(event, index, fallback) {
  return text(
    event && (event.seq != null ? event.seq : event.id)
      || `${fallback}-${index}-${event && event.component || 'x'}-${event && event.event || 'event'}`,
    160
  );
}

export function isImportantEvent(event) {
  if (!event || typeof event !== 'object') return false;
  const severity = text(event.severity || 'info', 24).toLowerCase();
  if (IMPORTANT_SEVERITIES.has(severity)) return true;
  const semantic = `${text(event.component, 100)} ${text(event.event, 160)} ${text(event.reason, 360)}`;
  return IMPORTANT_PATTERN.test(semantic);
}

export function filterImportantEvents(events) {
  return Array.isArray(events) ? events.filter(isImportantEvent) : [];
}

export async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(String(value || ''));
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function normalizedArchiveEvents(events, receivedAt) {
  const rows = Array.isArray(events) ? events : [];
  return rows.map((event, index) => {
    const clean = redactDeep(event && typeof event === 'object' ? event : {});
    return {
      ...clean,
      key: eventKey(event, index, receivedAt),
      eventAt: eventTime(event, receivedAt),
      severity: text(event && event.severity || 'info', 24),
      component: text(event && event.component, 100),
      event: text(event && event.event, 160),
      reason: text(event && event.reason, 500),
      data: redactDeep(event && event.data || {})
    };
  });
}

export function archiveNdjson({ account, character, receivedAt, events }) {
  const rows = normalizedArchiveEvents(events, receivedAt);
  const header = {
    type: 'aio-v3-r2-log-batch',
    schemaVersion: 1,
    account: safeSegment(account),
    character: safeSegment(character, 'unknown', 80),
    receivedAt: number(receivedAt, Date.now()),
    eventCount: rows.length
  };
  return [header, ...rows].map((row) => JSON.stringify(row)).join('\n') + '\n';
}

export function archiveObjectKey({ account, character, receivedAt, events, batchId }) {
  const rows = normalizedArchiveEvents(events, receivedAt);
  const eventTimes = rows.map((row) => number(row.eventAt)).filter((value) => value > 0);
  const anchor = eventTimes.length ? Math.max(...eventTimes) : number(receivedAt, Date.now());
  const date = new Date(anchor);
  const parts = [
    String(date.getUTCFullYear()),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
    String(date.getUTCHours()).padStart(2, '0')
  ];
  const firstAt = eventTimes.length ? Math.min(...eventTimes) : anchor;
  const lastAt = eventTimes.length ? Math.max(...eventTimes) : anchor;
  const id = safeSegment(batchId || `${firstAt}-${lastAt}`, 'batch', 64);
  return `logs/${safeSegment(account)}/${safeSegment(character, 'unknown', 80)}/${parts.join('/')}/${firstAt}-${lastAt}-${id}.ndjson`;
}
