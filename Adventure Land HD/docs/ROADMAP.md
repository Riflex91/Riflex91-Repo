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

## Phase 2 – Asset-Kompatibilitätsverträge — DONE
- [x] Sprite-Raster / Runtime-Frames
- [x] Entity-Anker
- [x] Tile-Rechtecke / frame_width
- [x] VFX- und Font-Verträge
- [x] uniforme 2×–8× Skalierung
- [x] Original-Fallback / Logical-Size-Erhalt

## Phase 3 – Asset Override / Resolution Bridge — DONE (ohne Produktionsasset)
- [x] Bootstrap nach data.js, vor the_game()
- [x] nur visuelle G.*.file-Overrides
- [x] Pixi-native @Nx Resolution Bridge
- [x] ungültig/fehlend -> Original
- [x] lokaler Overlay-Builder
- [x] CI gegen Injection-Anchor, url_factory und Pixi-Resolution
- [x] kein Gameplay-/Netzwerk-/Serverwrite
- [x] A/B-Modus über `?alhd=on` / `?alhd=off`, ohne UI-Umbau

## Phase 4 – Vertikales Super-HD-MVP — NEXT
- [ ] erstes echtes HD-Asset
- [ ] 1 Charakterfamilie
- [ ] 5 Monster/NPCs
- [ ] 1 Map-/Tileset-Bereich
- [ ] 10 Item/UI-Assets
- [ ] 2–3 VFX
- [ ] visueller A/B-Test

## Phase 5 – Skalierung
Characters, Monster/NPCs, World/Tiles, Items/UI, VFX und Fonts.

## Phase 6 – Performance / Packaging
Auflösungsstufen, Texture-/Memory-Budget, reproduzierbarer HD-Pack-Build.
