# Legacy compatibility layer

This folder is the boundary between the original Adventure Land client state
and the new AL 2.5D renderer.

Rules:

- read legacy gameplay state; do not own it
- never change combat/network/persistence semantics
- convert authoritative x/y into immutable renderer snapshots
- convert 2.5D pointer input back into original x/y before legacy handlers
- preserve public CODE callback signatures and return behavior
- during migration, legacy PIXI entity objects may remain as hidden
  compatibility state because upstream gameplay logic stores state on them
- visual assets are resolved separately through the new asset registry

See `docs/COMPATIBILITY_MIRROR.md`.
