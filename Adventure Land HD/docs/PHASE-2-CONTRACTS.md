# Phase 2 – Asset-Kompatibilitätsverträge

Basis: `kaansoral/adventureland_mongodb@90052162eb3ebda36c893e1eb4af643913c8f984`.

## Verifizierte Renderer-Fakten

- `design/sprites.js` definiert Sprite-Datei, Raster, Typ, Größe und teilweise Frameanzahl.
- `js/game.js` berechnet Sprite-Zellmaße aus der **geladenen Bildgröße** geteilt durch Originalraster und laufzeitabhängige Frame-Multiplikatoren.
- Figuren/Monster/NPCs werden mit Bottom-Center-Anker `(0.5, 1)` positioniert.
- Welt-Tiles werden über explizite `PIXI.Rectangle(x,y,width,height)`-Ausschnitte gelesen; animierte Tiles verschieben den Ausschnitt mit `frame_width`.
- `design/animations.js` definiert VFX-Datei, Frames sowie optionale Eigenschaften wie `directional`, `continuous` und `framefps`.
- Bitmap-Font-Deskriptoren binden Glyphenkoordinaten an konkrete Atlasgrößen.

## Konsequenz für Super HD

Ein größeres PNG unter demselben Pfad ist **nicht automatisch kompatibel**. Ohne Präsentations-Skalierung würden Sprite-Zellmaße größer; bei Tile-Atlanten würden Original-Rechtecke die falschen Pixelbereiche lesen.

Darum gilt für vorbereitete HD-Dateien:

1. X- und Y-Skalierung müssen identisch und ganzzahlig sein.
2. Zulässig sind zunächst 2× bis 8×.
3. Die logische Originalgröße muss erhalten bleiben.
4. Original-Fallback ist Pflicht.
5. World-Atlanten benötigen Scaled-Rect-Mapping.
6. Bis Phase 3 bleibt jeder Eintrag `state: "prepared"`; noch kein HD-Override wird aktiviert.

## Werkzeuge

- `lib/hd-contracts.mjs` – gemeinsame Vertragslogik.
- `tools/analyze-contracts.mjs` – liest echte Sprite-, VFX-, Tileset- und Fontdefinitionen aus dem gepinnten Original.
- `tools/validate-hd-assets.mjs` – validiert vorbereitete HD-Dateien gegen Originalabmessungen und Manifestregeln.
- `tests/contract-rules.test.mjs` – Regressionstests für Raster und Skalierung.
- `manifests/hd-assets.json` – kontrollierte Liste zukünftiger HD-Ersetzungen.

Der nächste Schritt ist Phase 3: ein minimaler **presentation-only Scale Bridge**, der höhere Pixelauflösung auf exakt dieselben logischen Sprite-/Tile-Maße zurückführt.
