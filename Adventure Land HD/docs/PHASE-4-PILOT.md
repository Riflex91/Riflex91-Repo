# Phase 4A – Erstes aktives 4×-HD-Asset

## Pilot

Original: `images/tiles/characters/jubchan_1.png`

Gepinnter Original-Blob: `fc464d13e76b2cc61838afdfb483043b3e31f406`

Originalgröße: **78×144 px**

Aktiver HD-Pilot: `hd-assets/characters/jubchan_1@4x.png`

HD-Größe: **312×576 px**

Damit ist die Quelldatei exakt **4× breiter und 4× höher**.

## Frame-Vertrag

Der Originalrenderer interpretiert den Standard-Character-Typ als **3 Spalten × 4 Zeilen**.

- Original-logische Zelle: `78 / 3 = 26` × `144 / 4 = 36`
- HD-physische Zelle: `312 / 3 = 104` × `576 / 4 = 144`
- Pixi-Resolution `@4x`: `104 / 4 = 26` × `144 / 4 = 36`

Die logische Frame-Geometrie bleibt exakt erhalten.

## Warum zuerst pixelgetreu?

Dieser erste aktive Pilot ist absichtlich ein **Fidelity-/Pipeline-Test**. Er erhöht die Quelldatei auf 4×, ohne Silhouette, Frames, Palette oder Timing neu zu interpretieren.

Damit isolieren wir zunächst HD-Dateiauslieferung, Manifest-Auflösung, `@4x`-Resolution, Original-Fallback, Frame-Slicing und A/B-Umschaltung.

Er ist **noch nicht der finale künstlerische Super-HD-Remaster**. Nach bestandenem Runtime-/CI-Gate kann dieselbe Datei auf derselben Schnittstelle durch einen detailreicheren 4×-Remaster ersetzt werden.

## A/B

HD: `?alhd=on`

Original: `?alhd=off`

Konsole: `ALHD.status()`

Bei aktivem HD-Modus soll `images/tiles/characters/jubchan_1.png` in der `paths`-Liste erscheinen.

## Sicherheitsgrenze

Keine Gameplay-, Netzwerk-, Persistenz- oder Serverdatei wurde für diesen Pilot verändert.
