# V3 Datei-Audit – vollständiger Rohbestand

Quelle: `main@94e3a9962c1cba757e4d39b8e53f9ba4d8f4a376`

Dieser Ordner enthält den vollständigen maschinenlesbaren Datei-/Roh-Audit aller **535** Blob-Dateien unter `v3/**`:

- 238 Source-Dateien
- 205 Tests
- 23 Host-Dateien
- 15 Scripts
- 12 Dateien unter `docs/`
- 5 Supabase-Dateien
- 2 Dist-Build-Artefakte
- 35 Root-/sonstige Dateien

## Wichtige Abgrenzung

`535/535` bedeutet hier: jede Datei wurde vollständig eingelesen und in einem Audit-Shard erfasst.

Es bedeutet **nicht**, dass die semantische V3→V4-Konsolidierung bereits vollständig abgeschlossen ist. Die nächsten Schritte sind insbesondere:

1. Tests als Verhaltens- und Fehlervertrag konsolidieren.
2. V3-Systemabläufe und Ownership rekonstruieren.
3. historische Fehler und Patch-Schichten auf ihre eigentliche Ursache reduzieren.
4. V3-Funktionen in die V3→V4-Funktionsmatrix einordnen.
5. daraus V4-Architektur-Invarianten und Block 8.7 ableiten.
6. Merchant-Zielarchitektur vertiefen.

## Dist

`v3/dist/**` ist ausdrücklich als Build-Artefakt klassifiziert und keine unabhängige Wissensquelle. Bei Konflikten gilt die jeweilige Source-/Test-/Dokumentationsquelle.

## Unveränderlichkeit

Dieser Audit verändert keine Datei unter `v3/**`. Die Shards sind an den oben genannten Source-Commit gebunden.
