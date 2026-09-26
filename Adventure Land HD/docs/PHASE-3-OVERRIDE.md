# Phase 3 – Presentation-only Asset Override / Resolution Bridge

## Ziel

Super-HD-Pixel laden, während Adventure Lands logische Sprite-, Tile- und Weltmaße unverändert bleiben.

## Verifizierter Integrationspunkt

Im gepinnten `htmls/index.html` wird `/data.js` geladen, bevor der Dokument-Ready-Handler `first_things_first()` und darin `the_game()` startet. Damit existiert `G` bereits, während Pixi seine Spielressourcen noch nicht geladen hat.

Die lokale HD-Schicht wird exakt in dieses Fenster eingefügt:

1. Original `data.js`
2. generiertes `adventure-land-hd-manifest.js`
3. `adventure-land-hd-bootstrap.js`
4. späterer Originalstart über `the_game()`

Der Bootstrap ändert ausschließlich `.file`-Felder in `G.sprites`, `G.animations`, `G.tilesets` und `G.imagesets`.

## Resolution Bridge

Der gepinnte Client verwendet PixiJS `4.8.2-roundpixels`. Die Pixi-4.x-Ladelogik erkennt Resolution-Suffixe wie `@2x`/`@4x` in Bild-URLs und speichert die physische Pixelauflösung getrennt von der logischen Texturgröße.

Darum müssen aktive HD-Dateien z. B. heißen:

```text
mchar16@4x.png
water_updated@4x.png
Fire0@4x.png
```

Der Originalcode darf weiterhin dieselben logischen Sprite- und Tile-Rechtecke verwenden.

## Fail-closed Regeln

Ein Runtime-Eintrag wird nur angewendet, wenn:

- `state === "active"`;
- `scale` zwischen 2 und 8 liegt;
- der Dateiname exakt zum `@Nx`-Faktor passt;
- `preserveLogicalSize === true`;
- `originalFallback === true`.

Alles andere bleibt beim Originalpfad.

## Lokaler Overlay-Build

Nur prüfen:

```powershell
node tools/prepare-runtime-overlay.mjs --upstream "..\.upstream-adventureland" --check-only
```

Auf einen sauberen gepinnten lokalen Checkout anwenden:

```powershell
node tools/prepare-runtime-overlay.mjs --upstream "..\.upstream-adventureland"
```

Dabei werden lediglich zwei HD-Skripte in den lokalen Client kopiert, der Script-Tag direkt nach `data.js` ergänzt und später aktive HD-Dateien unter `/images/alhd/` bereitgestellt.

Aktuell enthält das Manifest noch **keine aktiven HD-Assets**. Der Bridge-Code ist daher funktional, aber visuell noch ein No-op.

## Sicherheitsgrenze

Der Bootstrap enthält keine Gameplay-Aktion, keine Socket-Mutation und keine Serverlogik. Er ändert ausschließlich visuelle Dateireferenzen vor dem Original-Ressourcenload.
