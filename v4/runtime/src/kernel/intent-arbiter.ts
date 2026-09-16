import type { Intent, IntentClass } from '../contracts/intent.js';

const CLASS_RANK: Readonly<Record<IntentClass, number>> = {
  emergency: 4,
  safety: 3,
  normal: 2,
  background: 1
};

export class IntentArbiter {
  rank(intents: readonly Intent[], now: number): readonly Intent[] {
    return intents
      .filter((intent) => intent.expiresAt === undefined || intent.expiresAt > now)
      .slice()
      .sort((a, b) => {
        const classDelta = CLASS_RANK[b.class] - CLASS_RANK[a.class];
        if (classDelta !== 0) return classDelta;
        if (a.priority !== b.priority) return b.priority - a.priority;
        if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt;
        return a.id.localeCompare(b.id);
      });
  }

  select(intents: readonly Intent[], now: number): Intent | null {
    return this.rank(intents, now)[0] ?? null;
  }
}
