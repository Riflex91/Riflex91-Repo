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
- [x] erstes aktives 8× Character-Asset: `jubchan_1@8x.png`
- [x] 624×1152 physisch / 78×144 logisch
- [x] 3×4 Raster / 26×36 Logical-Frame
- [x] Row 0 Front/Down, Row 3 Back/Up live mit Mira bestätigt
- [x] Browser-/Spiel-Live-Test des PNG-Piloten mit originalem `aniv2`-Hat
- [x] Nicht-8× nur mit dokumentierter Ausnahme
- [x] vollständigen `main`-/Mainland-Scope gepinnt: 14 Tilesets / 30 NPC-Platzierungen / 38 Monster-Typen / 48 Quelldateien
- [x] Multi-Asset Runtime/Overlay-Smoke für gleichzeitige Terrain-, NPC- und Monster-Overrides vorbereitet
- [x] Mainland-Terrain-Produktionsvertrag gepinnt: 14 Tilesets mit Original-Blob, Originalmaß, exaktem 8×-Zielmaß und Animationsmetadaten
- [x] `doors.png` als erster aktiver deterministischer 8×-Terrain-Technikpilot erzeugt, per SHA-256 gepinnt und in Runtime/Overlay verdrahtet (noch kein finaler Art-Remaster)
- [x] Mainland-Terrain-Memory-Profil gepinnt: globales `G.tilesets`-Preloading verifiziert; sichere Startstufe `doors@8x + 13×4x` = 396,84 MiB statt 1551,38 MiB bei 14×8x
- [x] vollständige Mainland-Staging-Pipeline vorbereitet: 14 Terrain + 34 Entity-Quellen -> Candidate-Evidence -> Promotion -> temporäres 48-Asset-HD-Manifest -> Standardvalidator
- [x] 48 Mainland-Candidate-SHAs aus erfolgreicher Dev-CI-Evidence gepinnt; 46 neue Kandidaten bleiben durch Isolationstest inaktiv
- [x] Windows-sicherer Mainland-Staging-Updater vorbereitet: sauberer temporärer Worktree, 48 Assets, transaktionales Copy/Verify, keine Reset/Clean-Operationen
- [ ] Mainland Terrain/Tilesets vollständig auf HD umstellen
- [x] Mainland NPC-/Monster-Produktionsscope gepinnt: 34 Entity-Sheets / 7 Cosmetics / 18 Character-Sheets / 9 Monster-Sheets; sicherer Start `jubchan@8x + 33×4x`
- [ ] Mainland NPC-Sheets vollständig auf HD umstellen
- [ ] Mainland Monster-/Tier-/Target-Sheets vollständig auf HD umstellen
- [ ] vollständige Charakterfamilie außerhalb Mainland
- [ ] 10 Item/UI-Assets
- [ ] 2–3 VFX

## Phase 5 – Skalierung
Characters, Monster/NPCs, World/Tiles, Items/UI, VFX, Fonts.

## Phase 6 – Performance / Packaging
Memory-/Texture-Budget, begründete Ausnahmen, reproduzierbarer HD-Pack-Build.
