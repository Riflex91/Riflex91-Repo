export function roadmapGateRang(gate) {
  const match = /^PR(\d+)(?:\.(\d+))?/.exec(String(gate ?? ""));
  if (!match) return -1;
  const major = Number(match[1]);
  const minor = match[2] === undefined ? 0 : Number(match[2]);
  if (!Number.isSafeInteger(major) || !Number.isSafeInteger(minor)) return -1;
  return major * 100 + minor;
}

export function roadmapIstMindestens(currentGate, requiredGate) {
  const current = roadmapGateRang(currentGate);
  const required = roadmapGateRang(requiredGate);
  return current >= 0 && required >= 0 && current >= required;
}
