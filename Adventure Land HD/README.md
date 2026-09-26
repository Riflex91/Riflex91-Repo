# Adventure Land HD

Adventure Land HD modernisiert Adventure Land ausschließlich über kompatible HD-Assets. Das Originalspiel bleibt die technische und spielerische Autorität.

> Alles, was das Spiel **tut**, bleibt original. Nur das, was das Spiel **anzeigt**, darf durch kompatible HD-Assets ersetzt werden.

Kein neuer Renderer, kein 2.5D/3D, keine Gameplay-, Movement-, Combat-, Loot-, Quest-, Event-, Netzwerk-, Persistenz- oder Serveränderungen. `AL 2.5d/` ist keine technische Basis.

## Originalbasis

`kaansoral/adventureland_mongodb@90052162eb3ebda36c893e1eb4af643913c8f984`

## Stand

- Phase 0 Foundation — fertig
- Phase 1 Asset-Inventar (2.311 Dateien) — fertig
- Phase 2 Kompatibilitätsverträge — fertig
- Phase 3 Asset-Override / Resolution-Bridge — fertig
- Phase 4 erstes echtes Super-HD-MVP — als Nächstes

HD-Dateien verwenden `@Nx`-Resolution-Suffixe. Der Bootstrap läuft nach Original-`data.js`, vor `the_game()`, und ändert nur visuelle Dateireferenzen.

Für A/B-Tests ohne neue Spieloberfläche:

```text
?alhd=on
?alhd=off
```

Status in der Konsole: `ALHD.status()`.

Siehe `docs/PHASE-3-OVERRIDE.md`.
