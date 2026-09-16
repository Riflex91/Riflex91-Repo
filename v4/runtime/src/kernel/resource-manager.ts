import type { ResourceLease, ResourceName, ResourceRequest } from '../contracts/resource.js';

export interface AcquisitionResult {
  readonly granted: boolean;
  readonly blockedBy: readonly ResourceLease[];
  readonly preemptedOwners: readonly string[];
  readonly leases: readonly ResourceLease[];
}

export class ResourceManager {
  private readonly leases = new Map<ResourceName, ResourceLease>();

  acquire(request: ResourceRequest): AcquisitionResult {
    const resources = [...new Set(request.resources)].sort() as ResourceName[];
    if (resources.length === 0) throw new Error('At least one resource is required');

    const blockedBy: ResourceLease[] = [];
    const preemptedOwners = new Set<string>();

    for (const resource of resources) {
      const current = this.leases.get(resource);
      if (!current || current.ownerId === request.ownerId) continue;

      if (!current.preemptible || request.priority <= current.priority) {
        blockedBy.push(current);
      } else {
        preemptedOwners.add(current.ownerId);
      }
    }

    if (blockedBy.length > 0) {
      return {
        granted: false,
        blockedBy: [...blockedBy].sort((a, b) => a.resource.localeCompare(b.resource)),
        preemptedOwners: [],
        leases: []
      };
    }

    for (const ownerId of [...preemptedOwners].sort()) this.releaseOwner(ownerId);

    const grantedLeases = resources.map((resource): ResourceLease => ({
      resource,
      ownerId: request.ownerId,
      priority: request.priority,
      preemptible: request.preemptible,
      acquiredAt: request.now
    }));

    for (const lease of grantedLeases) this.leases.set(lease.resource, lease);

    return {
      granted: true,
      blockedBy: [],
      preemptedOwners: [...preemptedOwners].sort(),
      leases: grantedLeases
    };
  }

  releaseOwner(ownerId: string): number {
    let released = 0;
    for (const [resource, lease] of this.leases.entries()) {
      if (lease.ownerId === ownerId) {
        this.leases.delete(resource);
        released += 1;
      }
    }
    return released;
  }

  getLease(resource: ResourceName): ResourceLease | null {
    return this.leases.get(resource) ?? null;
  }

  snapshot(): readonly ResourceLease[] {
    return [...this.leases.values()].sort((a, b) => a.resource.localeCompare(b.resource));
  }
}
