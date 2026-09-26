# Adventure Land HD

Adventure Land HD modernisiert Adventure Land ausschließlich über kompatible HD-Assets. Das Originalspiel bleibt die technische und spielerische Autorität.

> Alles, was das Spiel **tut**, bleibt original. Nur das, was das Spiel **anzeigt**, darf durch kompatible HD-Assets ersetzt werden.

Kein neuer Renderer, kein 2.5D/3D und keine Gameplay-, Movement-, Combat-, Loot-, Quest-, Event-, Netzwerk-, Persistenz- oder Serveränderungen. `AL 2.5d/` ist keine technische Basis.

## Originalbasis

`kaansoral/adventureland_mongodb@90052162eb3ebda36c893e1eb4af643913c8f984`

## HD-Standard

**8× ist ab jetzt der Standard für neue HD-Assets.**

- Standard: `@8x`
- andere Faktoren 2×–7× bleiben technisch möglich
- jede Abweichung von 8× braucht einen expliziten Ausnahmegrund im Manifest
- logische Größe und Original-Fallback bleiben Pflicht

## Stand

- Phase 0 Foundation — fertig
- Phase 1 Asset-Inventar — fertig
- Phase 2 Kompatibilitätsverträge — fertig
- Phase 3 Asset-Override / Resolution-Bridge — fertig
- Phase 4 — läuft
- erstes aktives künstlerisches 8×-Asset: `jubchan_1@8x.png`
- Original: 78×144 px
- HD: 624×1152 px
- logische Framegröße bleibt 26×36 bei 3×4 Frames

A/B: `?alhd=on` / `?alhd=off`

Status in der Browser-Konsole: `ALHD.status()`.

Siehe `docs/PHASE-4-PILOT.md`.
