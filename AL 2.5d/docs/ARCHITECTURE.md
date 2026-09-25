# AL 2.5D architecture

## Primary constraint

The rendering project must not become a stealth gameplay rewrite.

The authoritative game remains divided into:

```text
Adventure Land gameplay/network state
              |
              | immutable visual snapshot
              v
        RenderBridge
              |
              v
       2.5D renderer
```

The renderer is a consumer. It does not own combat, movement, loot, cooldowns, inventory, quests, events or persistence.

## Compatibility strategy

### Logic layer

The Adventure Land logic layer will be imported/pinned as a compatibility source and kept semantically equivalent.

Changes allowed without a gameplay review:
- adapter calls that expose read-only render state
- removal/replacement of direct drawing calls
- asset ID mapping
- pointer coordinate conversion
- visual-only timing interpolation

Changes requiring an explicit gameplay decision:
- cooldowns
- hit timing
- movement speed
- pathing rules
- aggro
- damage/healing
- drops
- economy
- inventory capacity
- class/skill behavior
- server protocol
- persistence

### Render layer

Responsible for:
- 2.5D projection
- depth sorting
- elevation
- sprites/animated sprites
- map layers
- shadows
- lighting
- particles/VFX
- HUD
- camera
- visual interpolation

### Input mapping

Pointer input is converted from screen coordinates back to the original Adventure Land world coordinate system before it enters gameplay logic.

This is critical: the player sees a 2.5D world, while movement/collision logic can remain in the original coordinate space.

## Parity testing

Each gameplay migration step must compare the original and 2.5D client for the same deterministic inputs.

Initial parity domains:
- movement destinations
- entity positions
- target selection
- attack requests
- skill requests
- inventory actions
- map transitions
- event state
- reconnect state

A visual change is accepted only when gameplay outputs remain equivalent.
