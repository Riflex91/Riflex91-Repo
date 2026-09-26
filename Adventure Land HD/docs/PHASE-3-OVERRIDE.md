# Phase 3 – Presentation-only Asset Override / Resolution Bridge

## Ziel

Super-HD-Pixel laden, während Adventure Lands logische Sprite-, Tile- und Weltmaße unverändert bleiben.

## Integrationspunkt

Im gepinnten Original wird `/data.js` geladen, bevor der Dokument-Ready-Handler `first_things_first()` und darin `the_game()` startet. Die lokale HD-Schicht wird daher nach `data.js`, aber vor dem Original-Ressourcenload eingefügt.

Der Bootstrap ändert ausschließlich `.file`-Felder in `G.sprites`, `G.animations`, `G.tilesets` und `G.imagesets`.

## Resolution Bridge

Der Client verwendet PixiJS `4.8.2-roundpixels`. Aktive HD-Dateien müssen einen Resolution-Suffix wie `@4x` tragen. Dadurch kann Pixi physische Pixelauflösung und logische Texturgröße trennen; der Originalcode behält seine logischen Sprite-/Tile-Rechtecke.

## Fail-closed Regeln

Ein Runtime-Eintrag wird nur angewendet, wenn:

- `state === "active"`;
- `scale` zwischen 2 und 8 liegt;
- Dateiname und `@Nx` zum Scale passen;
- `preserveLogicalSize === true`;
- `originalFallback === true`.

Sonst bleibt der Originalpfad.

## A/B-Modus ohne UI-Umbau

Der Vergleich wird ausschließlich über die URL gesteuert:

```text
?alhd=on
?alhd=off
```

- `alhd=on` bzw. kein `alhd`-Parameter: validierte aktive HD-Assets dürfen geladen werden.
- `alhd=off`: alle HD-Overrides bleiben aus; die Originaldateireferenzen bleiben unangetastet.

Es wird bewusst **kein neuer Ingame-Button** hinzugefügt.

Der aktuelle Zustand kann in der Browser-Konsole gelesen werden:

```js
ALHD.status()
```

## Lokaler Overlay-Build

Nur Ziel prüfen:

```powershell
node tools/prepare-runtime-overlay.mjs --upstream "..\.upstream-adventureland" --check-only
```

Overlay anwenden:

```powershell
node tools/prepare-runtime-overlay.mjs --upstream "..\.upstream-adventureland"
```

Aktuell enthält das Manifest noch keine aktiven HD-Assets; deshalb bleibt die Darstellung trotz aktivem Bridge-Code vollständig original.

## Sicherheitsgrenze

Kein Gameplay-Write, kein Socket-Write und keine Serverlogik. Die Schicht arbeitet ausschließlich vor dem Original-Ressourcenload an visuellen Dateireferenzen.
