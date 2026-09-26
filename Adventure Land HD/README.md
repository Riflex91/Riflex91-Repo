# Adventure Land HD

Dieses Projekt modernisiert Adventure Land ausschließlich über kompatible HD-Assets. Das Originalspiel bleibt die technische und spielerische Autorität.

## Harte Produktregel

> Alles, was das Spiel tut, bleibt original. Nur das, was das Spiel anzeigt, darf durch kompatible HD-Assets ersetzt werden.

Ausdrücklich außerhalb des Scopes: neuer Renderer, 2.5D/3D, Gameplay-, Movement-, Combat-, Loot-, Quest-, Event-, Netzwerk-, Persistenz- oder Serveränderungen.

Der bestehende Ordner `AL 2.5d/` bleibt historische Arbeit und ist keine technische Basis dieses Projekts.

## Gepinnte Originalbasis

- Repository: `kaansoral/adventureland_mongodb`
- Commit: `90052162eb3ebda36c893e1eb4af643913c8f984`
- Tree: `5c8c954fecc7cef1d8b72dac5f626f10835867f1`
- Commit-Datum: `2026-09-21T11:54:10Z`

Der Pin steht in `UPSTREAM.lock.json`.

## Phase 0

Erledigt: separater HD-Projektbereich, fester Upstream-Pin, Asset-only-Grenze und CI-Grundschutz.

## Phase 1

`manifests/upstream-assets.json` enthält die vollständige Git-Tree-Bestandsaufnahme der visuellen Quelldateien und relevanten Begleitdateien.

Aktueller Snapshot:

- **2028 Bilddateien**
- **283 visuelle Begleit-/Metadatendateien**
- **2311 Dateien insgesamt**

Jeder Eintrag enthält Originalpfad, Git-Blob-SHA, Größe, Typ, Kategorie, Runtime-Kandidat und Ersatzrisiko.

### Deep Audit

Mit einem lokalen Checkout des gepinnten Originals:

```powershell
git clone https://github.com/kaansoral/adventureland_mongodb.git .upstream-adventureland
git -C .upstream-adventureland checkout 90052162eb3ebda36c893e1eb4af643913c8f984

cd "Adventure Land HD"
node tools/audit-assets.mjs --upstream "..\.upstream-adventureland"
```

Der Deep Audit verlangt den exakten Commit und einen sauberen Checkout, verifiziert Pfad/Größe/Git-Blob und liest bei Rastergrafiken zusätzlich Breite/Höhe.

Nur prüfen:

```powershell
node tools/audit-assets.mjs --upstream "..\.upstream-adventureland" --check-only
```

Projektprüfung:

```powershell
npm run check
```

Als Nächstes folgt Phase 2: strikte Kompatibilitätsverträge für Sprite-Sheets, Tiles, UI, VFX und Fonts.
