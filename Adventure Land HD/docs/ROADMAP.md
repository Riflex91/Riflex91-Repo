# Roadmap – Adventure Land HD

## Phase 0 – Scope Freeze — DONE
- [x] separater Projektbereich
- [x] Originalspiel bleibt Autorität
- [x] Upstream gepinnt
- [x] Asset-only-CI

## Phase 1 – Asset-Audit — DONE
- [x] 2.311 visuelle Dateien inventarisiert
- [x] Deep-Audit gegen Originalcheckout

## Phase 2 – Kompatibilitätsverträge — DONE
- [x] Sprite-/Tile-/VFX-/Font-Verträge
- [x] Logical-Size-Erhalt
- [x] Original-Fallback

## Phase 3 – Resolution Bridge — DONE
- [x] nur visuelle G.*.file-Overrides
- [x] Pixi-native @Nx Resolution
- [x] A/B über `?alhd=on` / `?alhd=off`
- [x] Overlay-Materialization + Byte-Prüfung
- [x] keine Gameplay-/Netzwerk-/Serverwrites

## Phase 4 – Vertikales Super-HD-MVP — IN PROGRESS
- [x] **8× als Standard**
- [x] erstes aktives 8× Character-Asset: `jubchan_1@8x.svg`
- [x] 624×1152 physisch / 78×144 logisch
- [x] 3×4 Raster / 26×36 Logical-Frame
- [x] Nicht-8× nur mit dokumentierter Ausnahme
- [ ] Browser-/Spiel-Live-A/B-Test
- [ ] vollständige Charakterfamilie
- [ ] 5 Monster/NPCs
- [ ] 1 Map-/Tileset-Bereich
- [ ] 10 Item/UI-Assets
- [ ] 2–3 VFX

## Phase 5 – Skalierung
Characters, Monster/NPCs, World/Tiles, Items/UI, VFX, Fonts.

## Phase 6 – Performance / Packaging
Memory-/Texture-Budget, begründete Ausnahmen, reproduzierbarer HD-Pack-Build.
