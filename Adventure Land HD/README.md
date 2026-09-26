# Adventure Land HD

Adventure Land HD modernisiert Adventure Land ausschließlich über kompatible HD-Assets. Das Originalspiel bleibt die technische und spielerische Autorität.

> Alles, was das Spiel **tut**, bleibt original. Nur das, was das Spiel **anzeigt**, darf durch kompatible HD-Assets ersetzt werden.

Kein neuer Renderer, kein 2.5D/3D, keine Gameplay-, Movement-, Combat-, Loot-, Quest-, Event-, Netzwerk-, Persistenz- oder Serveränderungen. Der alte Ordner `AL 2.5d/` ist keine technische Basis.

## Originalbasis

`kaansoral/adventureland_mongodb@90052162eb3ebda36c893e1eb4af643913c8f984`

## Aktueller Stand

- Phase 0: Foundation — fertig
- Phase 1: 2.311 visuelle Dateien inventarisiert — fertig
- Phase 2: Kompatibilitätsverträge/Validatoren — fertig
- Phase 3: presentation-only Asset-Override + Pixi-Resolution-Bridge — Core fertig
- erstes echtes Super-HD-Asset — noch nicht aktiviert

HD-Dateien verwenden einen Pixi-kompatiblen Resolution-Suffix wie `@4x`. Der Bootstrap läuft nach Original-`data.js`, aber vor `the_game()`, und darf ausschließlich visuelle `G.*.file`-Referenzen austauschen.

Siehe `docs/PHASE-3-OVERRIDE.md`.

## Projektprüfung

```powershell
cd "Adventure Land HD"
npm run check
```

## Lokalen Originalclient prüfen

```powershell
node tools/prepare-runtime-overlay.mjs --upstream "..\.upstream-adventureland" --check-only
```

## Overlay lokal anwenden

```powershell
node tools/prepare-runtime-overlay.mjs --upstream "..\.upstream-adventureland"
```
