const SECRET_KEY = /(token|secret|password|passwd|write[_-]?key|api[_-]?key|authorization|cookie|session)/i;

export function cloneSafe(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
  if (value === null) return null;
  if (value === undefined) return null;
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.length > 4000 ? `${value.slice(0, 4000)}…` : value;
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'function') return '[function]';
  if (typeof value === 'symbol') return value.toString();
  if (depth > 6) return '[depth-limit]';

  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack ? cloneSafe(value.stack, depth + 1, seen) : null,
    };
  }

  if (typeof value === 'object') {
    if (seen.has(value)) return '[circular]';
    seen.add(value);

    if (Array.isArray(value)) {
      return value.slice(0, 100).map((child) => cloneSafe(child, depth + 1, seen));
    }

    const output: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value).slice(0, 100)) {
      output[key] = SECRET_KEY.test(key) ? '[redacted]' : cloneSafe(child, depth + 1, seen);
    }
    return output;
  }

  return String(value);
}
