export const RESOURCE_NAMES = [
  'movement',
  'inventory',
  'bank',
  'economy',
  'combatTarget',
  'party',
  'equipment'
] as const;

export type ResourceName = (typeof RESOURCE_NAMES)[number];

export interface ResourceLease {
  readonly resource: ResourceName;
  readonly ownerId: string;
  readonly priority: number;
  readonly preemptible: boolean;
  readonly acquiredAt: number;
}

export interface ResourceRequest {
  readonly ownerId: string;
  readonly resources: readonly ResourceName[];
  readonly priority: number;
  readonly preemptible: boolean;
  readonly now: number;
}
