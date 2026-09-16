import type { ResourceName } from './resource.js';

export const INTENT_CLASSES = ['emergency', 'safety', 'normal', 'background'] as const;
export type IntentClass = (typeof INTENT_CLASSES)[number];

export interface Intent<TPayload = unknown> {
  readonly id: string;
  readonly ownerId: string;
  readonly kind: string;
  readonly class: IntentClass;
  readonly priority: number;
  readonly createdAt: number;
  readonly expiresAt?: number;
  readonly requiredResources: readonly ResourceName[];
  readonly reason: string;
  readonly payload: TPayload;
}
