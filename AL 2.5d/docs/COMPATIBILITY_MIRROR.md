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

## Live compatibility runtime

AL25D-03 now has an explicit `LegacyCompatibilityRuntime` boundary.

It supports two deployment modes:

1. **Attached mode** — AL 2.5D is loaded into the same window as an already
   running original Adventure Land client. The new renderer gets its own
   overlay host, legacy canvases are made invisible, and the original
   character/entities/socket/gameplay objects remain alive.
2. **Embedded mode** — AL 2.5D loads a legacy client in an invisible iframe.
   The iframe must be same-origin so the read-only mirror can access
   `character`, `entities`, `current_map`, `G` and `map_click`.

The embedded deployment route is expected to serve the pinned upstream client:

`ddcf7222c3264f1404382e1ff5dea8e73f6cb4b4`

A deployment may advertise that pin through
`window.__AL25D_UPSTREAM_COMMIT__`; if it advertises a different commit the
runtime refuses to attach.

A same-origin legacy route can be selected before AL 2.5D boots with
`window.AL25D_LEGACY_URL` or with the `?legacy=/same-origin/path` query
parameter. Cross-origin iframe URLs are rejected because browser isolation
would prevent safe access to the authoritative client state.

Once attached, `LegacyMirrorBridge` starts automatically. It mirrors:

- `character`
- `entities` (including character/monster/NPC ids and world x/y)
- `current_map`
- primitive `G.maps[current_map]` metadata
- a read-only summary of `G.geometry[current_map]`

The geometry summary intentionally contains counts rather than mutable legacy
arrays/objects. This keeps the renderer unable to mutate authoritative map
topology.

## Pointer handoff to the original client

The new canvas never implements movement itself.

For a 2.5D pointer target, AL 2.5D:

1. reverses the camera/projection into original world x/y,
2. creates the PIXI-style `event.data.global` coordinates that the pinned
   original `map_click(event)` expects,
3. calls that original `map_click`.

That means the original client still performs its own
`call_code_function("on_map_click", x, y)`. A truthy CODE callback therefore
still cancels the default movement path before the original socket movement
request is emitted.

