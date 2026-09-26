# Roadmap – Adventure Land HD

## Phase 0 – Neustart / Scope Freeze — DONE
- [x] separater Projektbereich
- [x] 2.5D-Prototyp nicht als Laufzeitbasis
- [x] offiziellen Upstream pinnen
- [x] Asset-only-Invariante und CI

## Phase 1 – Vollständiger Asset-Audit — DONE
- [x] kompletter visueller Git-Tree
- [x] Bilder + Begleitdateien
- [x] Blob-SHAs, Größen, Kategorien, Risiken
- [x] Deep-Audit gegen gepinnten Checkout

## Phase 2 – Asset-Kompatibilitätsverträge — DONE (Core)
- [x] Sprite-Raster und Runtime-Frame-Multiplikatoren
- [x] Entity-Anker `(0.5,1)`
- [x] Tile-Rechtecke / `frame_width`
- [x] VFX-Frame-Semantik
- [x] Bitmap-Font Descriptor/Atlas-Kopplung
- [x] uniforme Integer-HD-Skalierung 2×–8×
- [x] Logical-Size-Preservation + Original-Fallback
- [x] Scaled-Rect-Anforderung für World-Atlanten
- [x] Aktivierung bis Phase 3 blockiert

## Phase 3 – Asset Override / Scale Bridge — NEXT
- [ ] HD-Manifest vor Original-Fallback auflösen
- [ ] High-Res Texturen auf Original-Logical-Size zurückführen
- [ ] Sprite-Slicing bei Integer-Scale
- [ ] Tile-Rechtecke mit Scale-Faktor
- [ ] Originalpfad bleibt logische Asset-ID
- [ ] ungültig/fehlend -> Original
- [ ] Original/HD-Schalter nur Asset-Ebene
- [ ] keine Gameplay-/Netzwerk-/Servermutation

## Phase 4 – Vertikales MVP
- [ ] 1 Charakterfamilie
- [ ] 5 Monster/NPCs
- [ ] 1 Map-/Tileset-Bereich
- [ ] 10 Item/UI-Assets
- [ ] 2–3 VFX
- [ ] A/B-Test

## Phase 5 – Skalierung
Characters, Monster/NPCs, World/Tiles, Items/UI, VFX und Fonts.

## Phase 6 – Performance / Packaging
Auflösungsstufen, Texture-/Memory-Budget, reproduzierbarer HD-Pack-Build.
