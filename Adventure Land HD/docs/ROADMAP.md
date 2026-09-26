# Roadmap – Adventure Land HD

## Phase 0 – Neustart / Scope Freeze — DONE
- [x] separater Projektbereich
- [x] 2.5D-Prototyp nicht als Laufzeitbasis
- [x] aktuellen offiziellen Upstream zum Neustart pinnen
- [x] Asset-only-Invariante dokumentieren
- [x] CI-Grundschutz

## Phase 1 – Vollständiger Asset-Audit — DONE
- [x] vollständigen Upstream-Git-Tree inventarisieren
- [x] Bilder erfassen
- [x] Sprite-/Font-/Atlas-Begleitdateien erfassen
- [x] Git-Blob-SHA und Bytegröße festhalten
- [x] Kategorien und Ersatzrisiken markieren
- [x] Deep-Audit mit Pixelmaßen und Blob-Verifikation bereitstellen

Hinweis: `images/misc/` ist absichtlich zunächst konservativ klassifiziert und wird in Phase 2 semantisch zerlegt.

## Phase 2 – Asset-Kompatibilitätsverträge — NEXT
- [ ] Sprite-Sheet-Raster je Familie ermitteln
- [ ] Pivot-/Anchor-Annahmen dokumentieren
- [ ] Tileset-Raster und Map-Abhängigkeiten dokumentieren
- [ ] UI-/Atlas-Verträge dokumentieren
- [ ] VFX-Framefolgen dokumentieren
- [ ] Font-/Glyph-Abhängigkeiten dokumentieren
- [ ] Validatoren für Ersatzassets bauen

Gate: inkompatible HD-Assets werden vor dem Live-Test abgelehnt.

## Phase 3 – Asset Override
- [ ] Originalpfad bleibt logische Asset-ID
- [ ] HD vorhanden und gültig -> HD
- [ ] sonst -> Original
- [ ] kein Gameplay-/Netzwerkpfad
- [ ] Original/HD-Schalter nur auf Asset-Ebene

## Phase 4 – Vertikales MVP
- [ ] 1 Charakterfamilie
- [ ] 5 repräsentative Monster/NPCs
- [ ] 1 Map-/Tileset-Bereich
- [ ] 10 Item-/UI-Assets
- [ ] 2–3 VFX
- [ ] A/B-Test Original gegen HD

## Phase 5 – Skalierung
Characters, Monster/NPCs, World/Tiles, Items/UI, VFX und Fonts systematisch abarbeiten.

## Phase 6 – Performance / Packaging
Auflösungsstufen, Texture-/Memory-Budget und reproduzierbaren HD-Pack-Build etablieren.
