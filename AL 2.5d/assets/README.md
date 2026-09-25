# AL 2.5D asset library

Only newly produced visual assets belong here.

Planned namespaces:

```text
assets/
  characters/
  monsters/
  maps/
  props/
  items/
  skills/
  vfx/
  ui/
```

## Runtime contract

Every renderable asset gets a stable logical ID. Gameplay code refers to that ID; the renderer resolves the current visual representation.

Examples:

```text
character/warrior/male/base
monster/goo/green
monster/phoenix/base
prop/main/merchant_stall
skill/mage/fireball
```

This allows art to be replaced or upgraded without modifying gameplay behavior.

## Required animation states

Character baseline:
- idle
- walk
- attack
- cast
- hit
- death

Monster baseline:
- idle
- move
- attack
- hit
- death

Additional states are asset-specific and must not introduce gameplay timing changes unless explicitly approved.
