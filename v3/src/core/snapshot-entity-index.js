'use strict';

function snapshotEntities(snapshot) {
  return snapshot && Array.isArray(snapshot.entities) ? snapshot.entities : [];
}

function createSnapshotEntityIndex(snapshot) {
  const byId = new Map();
  for (const entity of snapshotEntities(snapshot)) {
    if (!entity || entity.id == null) continue;
    byId.set(String(entity.id), entity);
  }
  return { snapshot, byId, size: byId.size };
}

function entityById(index, id) {
  if (!index || !(index.byId instanceof Map) || id == null) return null;
  return index.byId.get(String(id)) || null;
}

module.exports = { snapshotEntities, createSnapshotEntityIndex, entityById };
