# Phase 4A – Erstes aktives 8×-Super-HD-Asset

## Pilot

Original: `images/tiles/characters/jubchan_1.png`

Gepinnter Original-Blob: `fc464d13e76b2cc61838afdfb483043b3e31f406`

Originalgröße: **78×144 px**

Aktiver HD-Pilot: `hd-assets/characters/jubchan_1@8x.png`

HD-Größe: **624×1152 px**

Damit ist die Quelldatei exakt **8× breiter und 8× höher**.

## Frame-Vertrag

Der Originalrenderer interpretiert dieses Character-Sheet als **3 Spalten × 4 Zeilen**.

- Original-logische Zelle: `78 / 3 = 26` × `144 / 4 = 36`
- HD-physische Zelle: `624 / 3 = 208` × `1152 / 4 = 288`
- Pixi-Resolution `@8x`: `208 / 8 = 26` × `288 / 8 = 36`

Die logische Frame-Geometrie bleibt exakt erhalten.

## Künstlerischer Pilot

Dieser Pilot ist nicht nur hochskaliert, sondern der freigegebene künstlerische 8×-Remaster. Silhouette, 3×4-Pose-Reihenfolge und logische Zellgeometrie bleiben kompatibel; Detailgrad, Kanten, Haar, Kleidung und Schattierung sind deutlich höher.

Datei-SHA-256:

`2e1fc37956ce559ffaf66acd8b234fe859279a8dd4f863aa254e7cd9d4e4bcd3`

## Projektstandard

8× ist ab diesem Slice der Standard für neue Assets. Andere Faktoren sind nur mit explizitem `scaleExceptionReason` zulässig.

## A/B

HD: `?alhd=on`

Original: `?alhd=off`

Konsole: `ALHD.status()`

## Sicherheitsgrenze

Keine Gameplay-, Netzwerk-, Persistenz- oder Serverdatei wurde für diesen Pilot verändert.
