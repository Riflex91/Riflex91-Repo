# Mainland runtime coverage

The Mainland staging scope contains 48 unique source images. A generated HD file is useful only when the runtime bootstrap can actually reach the corresponding original file through an allowed presentation definition.

The coverage verifier checks the pinned original client directly:

- all 14 terrain sources must resolve through G.tilesets definitions and their .file fields;
- all 34 NPC, cosmetic, monster and target sources must resolve through G.sprites definitions and their .file fields;
- the combined activation plans must match the exact 48-source Mainland scope;
- the ALHD bootstrap must still apply both G.tilesets and G.sprites families.

The verifier does not inspect or modify gameplay data. It only proves that each staged visual source has a presentation-only runtime entry point.
