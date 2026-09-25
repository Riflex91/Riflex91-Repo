# Compatibility mirror migration

## Why this phase exists

The pinned Adventure Land client does not keep gameplay state in a clean model
that is independent from rendering. Important entity state is stored directly
on PIXI sprite/container objects.

For example, the upstream `add_character` and `add_monster` paths create a
PIXI sprite first and then attach gameplay/network state such as:

- `real_x` / `real_y`
- movement state
- conditions
- entity ids/types
- targetable/clickable metadata
- combat/display state that other client functions read later

Replacing those functions with plain new objects in one step would therefore
be a gameplay rewrite, which violates the AL 2.5D project rule.

## Migration method

The 2.5D fork uses a mirror phase:

```text
Adventure Land socket + gameplay code
              |
              v
legacy compatibility entity objects
      (not the final visuals)
              |
        read-only snapshot
              v
       LegacyMirrorBridge
              |
              v
        RenderBridge
              |
              v
       new 2.5D renderer
```

The old entity objects temporarily remain as a compatibility state container.
The new renderer is the visible presentation.

## Input direction

Input travels the opposite direction:

```text
2.5D pointer
    |
inverse camera/projection
    v
original AL x/y coordinates
    |
    v
legacy map_click / on_map_click / socket logic
```

This preserves movement and CODE semantics.

## Asset rule

The compatibility state may depend on PIXI object types while the migration is
in progress, but the final visible renderer must use only the new AL 2.5D asset
registry. Original sprite sheets are not the target visual library.

Where the legacy code requires a texture merely to construct an object, the
migration will progressively replace that dependency with neutral compatibility
textures/proxies. This must be proven with parity tests before original visual
assets are removed.

## Exit criteria for the mirror phase

The hidden compatibility scene can be deleted only after tests prove parity for:

1. entity creation/update/removal
2. movement and collision
3. targeting and clicking
4. combat requests and skill requests
5. map transitions
6. inventory/equipment interactions
7. public CODE drawing/click callbacks
8. reconnect/resync behavior

Until then, preserving gameplay behavior takes priority over aggressively
removing the legacy object model.
