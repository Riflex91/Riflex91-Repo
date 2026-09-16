import type { EntityObservation, PositionObservation, ResourceObservation } from './observation.js';
import type { WorldState } from './world-state.js';

export function findEntity(state: WorldState, entityId: string): EntityObservation | null {
  return state.entities[entityId] ?? null;
}

export function visibleMonsters(state: WorldState): readonly EntityObservation[] {
  return Object.values(state.entities)
    .filter((entity) => entity.kind === 'monster' && !entity.dead)
    .sort((left, right) => left.id.localeCompare(right.id));
}

export function entitiesTargetingSelf(state: WorldState): readonly EntityObservation[] {
  return Object.values(state.entities)
    .filter((entity) => !entity.dead && entity.targetId === state.self.name)
    .sort((left, right) => left.id.localeCompare(right.id));
}

export function resourceRatio(resource: ResourceObservation): number | null {
  if (resource.current === null || resource.max === null || resource.max <= 0) return null;
  return clamp(resource.current / resource.max, 0, 1);
}

export function distanceBetween(
  left: PositionObservation,
  right: PositionObservation,
): number | null {
  if (left.map === null || right.map === null || left.map !== right.map) return null;
  if (left.x === null || left.y === null || right.x === null || right.y === null) return null;
  return Math.hypot(left.x - right.x, left.y - right.y);
}

export function distanceToEntity(state: WorldState, entityId: string): number | null {
  const entity = findEntity(state, entityId);
  if (!entity) return null;
  return distanceBetween(state.self.position, entity.position);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
