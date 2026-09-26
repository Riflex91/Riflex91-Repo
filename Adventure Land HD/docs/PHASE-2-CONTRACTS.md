# Phase 2 – Asset-Kompatibilitätsverträge

Basis: `kaansoral/adventureland_mongodb@90052162eb3ebda36c893e1eb4af643913c8f984`.

Verifiziert wurden Sprite-Raster, laufzeitabhängige Frame-Multiplikatoren, Entity-Anker `(0.5,1)`, Tile-Rechtecke/`frame_width`, VFX-Frame-Semantik und Bitmap-Font-Atlasbindungen.

Ein HD-Asset muss eine uniforme ganzzahlige Skalierung von 2× bis 8× besitzen, seine logische Originalgröße erhalten und jederzeit auf das Original zurückfallen können. Fractionale logische Sprite-Zellen, die bereits im Original vorkommen, bleiben zulässig; entscheidend ist die exakte Skalierung des gesamten Quellbildes.

Phase 3 konkretisiert den Scale-Bridge: Für Pixi-Assets wird der native `@Nx`-Resolution-Mechanismus genutzt. Dadurch bleiben die vom Originalcode verwendeten Sprite- und Tile-Rechtecke in **logischen Koordinaten**. Manuelles Multiplizieren der Original-Rechtecke ist nicht vorgesehen.
