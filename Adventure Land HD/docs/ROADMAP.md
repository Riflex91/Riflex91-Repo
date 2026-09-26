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

## Phase 3 – Asset Override / Resolution Bridge — DONE
- [x] Bootstrap nach data.js, vor the_game()
- [x] nur visuelle G.*.file-Overrides
- [x] Pixi-native @Nx Resolution Bridge
- [x] ungültig/fehlend -> Original
- [x] lokaler Overlay-Builder
- [x] CI gegen Originalclient
- [x] A/B über `?alhd=on` / `?alhd=off`

## Phase 4 – Vertikales Super-HD-MVP — IN PROGRESS
- [x] erstes aktives 4× Character-Asset: `jubchan_1@4x.png`
- [x] exakte 26×36 Logical-Frame-Geometrie bewahrt
- [x] CI-/Manifest-Gate für echte HD-Binärdatei
- [x] Overlay-Materialization-Smoke: Manifest + Bootstrap + HD-Datei werden in einen sauberen gepinnten Originalcheckout eingebaut
- [x] Byte-für-Byte-Prüfung des materialisierten HD-Piloten
- [ ] echter Browser-/Spiel-Live-A/B-Test
- [ ] künstlerischer 4×-Remaster desselben Pilot-Sheets
- [ ] 1 vollständige Charakterfamilie
- [ ] 5 Monster/NPCs
- [ ] 1 Map-/Tileset-Bereich
- [ ] 10 Item/UI-Assets
- [ ] 2–3 VFX

## Phase 5 – Skalierung
Characters, Monster/NPCs, World/Tiles, Items/UI, VFX und Fonts.

## Phase 6 – Performance / Packaging
Auflösungsstufen, Texture-/Memory-Budget, reproduzierbarer HD-Pack-Build.
