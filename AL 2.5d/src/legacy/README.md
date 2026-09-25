# Legacy compatibility layer

This folder is the only place where the original Adventure Land client state is translated into the new 2.5D presentation model.

Rules:

1. read legacy game state; never mutate it
2. preserve original world coordinates
3. preserve public CODE/API semantics
4. convert visual references into stable 2.5D asset IDs
5. keep renderer interpolation out of gameplay state
6. keep input projection conversion at the boundary before legacy movement logic

The first adapter is `LegacySnapshotAdapter`, which converts the legacy `character` and `entities` structures into immutable render snapshots.
