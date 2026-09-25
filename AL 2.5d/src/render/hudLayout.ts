export type HudCandidate = Readonly<{
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  priority: number;
  always?: boolean;
}>;

function overlaps(
  a: HudCandidate,
  b: HudCandidate,
  padding: number
): boolean {
  return !(
    a.x + a.width + padding <= b.x ||
    b.x + b.width + padding <= a.x ||
    a.y + a.height + padding <= b.y ||
    b.y + b.height + padding <= a.y
  );
}

/**
 * Resolves dense nameplate visibility without moving gameplay objects.
 *
 * The algorithm is deterministic: priority first, then screen y and id.
 * Always-visible candidates (local player/current target) remain visible even
 * when they overlap lower-priority labels.
 */
export function resolveHudVisibility(
  candidates: readonly HudCandidate[],
  padding = 4
): ReadonlySet<string> {
  const accepted: HudCandidate[] = [];
  const visible = new Set<string>();

  const ordered = [...candidates].sort(
    (a, b) =>
      b.priority - a.priority ||
      a.y - b.y ||
      a.x - b.x ||
      a.id.localeCompare(b.id)
  );

  for (const candidate of ordered) {
    const collides = accepted.some((other) =>
      overlaps(candidate, other, padding)
    );

    if (collides && !candidate.always) {
      continue;
    }

    accepted.push(candidate);
    visible.add(candidate.id);
  }

  return visible;
}
