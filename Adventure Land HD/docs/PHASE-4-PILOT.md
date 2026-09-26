# Phase 4A – Erstes aktives 8×-Super-HD-Asset

Original: `images/tiles/characters/jubchan_1.png`  
Original-Blob: `fc464d13e76b2cc61838afdfb483043b3e31f406`  
Originalgröße: **78×144 px**

Aktiver Pilot: `hd-assets/characters/jubchan_1@8x.svg`  
Physische Ausgabe: **624×1152 px**

## Vertrag

Der Character-Sheet bleibt **3 Spalten × 4 Zeilen**.

- Original-logische Zelle: **26×36**
- 8× physische Zelle: **208×288**
- mit Pixi-`@8x`: wieder exakt **26×36 logisch**
- SVG-`viewBox`: `0 0 78 144`

## Art Direction

Blau/goldener Chibi-Remaster mit detaillierterem Haar, Robe, Weiß-/Goldbesatz und klareren Augen. Vier Richtungsreihen und drei Animationsspalten bleiben erhalten.

## Standard

**8× ist der Standard für neue HD-Assets.** Ein kleinerer Faktor ist nur mit `scaleExceptionReason` zulässig.

## A/B

HD: `?alhd=on`  
Original: `?alhd=off`  
Konsole: `ALHD.status()`

Keine Gameplay-, Netzwerk-, Persistenz- oder Serverlogik wird verändert.
