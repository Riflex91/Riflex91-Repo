# V4 Wissensbasis

Diese Wissensbasis trennt Rohinventur, semantische V3-Erkenntnisse und V4-Zielverträge.

## Aktueller Stand

- `v3-datei-audit/`: vollständiger maschinenlesbarer Audit aller 535 V3-Dateien.
- `v3-system/V3-GESAMTSYSTEM-WISSENSBASIS.md`: konsolidierte V3-Systemsemantik.
- `v3-system/V3-ZU-V4-FUNKTIONSMATRIX-ROH.json`: vollständiger Source-/Symbol-/Methoden-Rohindex für 238/238 Source-Dateien.
- `v3-system/V3-ZU-V4-FUNKTIONSMATRIX.md|json`: semantische Capability-Migrationsmatrix.
- `v3-fehler/V3-FEHLERKATALOG.md`: historische Fehlerklassen und V4-Prävention.
- `V4-ARCHITEKTUR-INVARIANTEN.md`: verbindliche, aus V3 abgeleitete Strukturregeln.
- `merchant/MERCHANT-V4-ZIELARCHITEKTUR.md`: Merchant-Orchestrator-Zielbild.

## Vollständigkeitsbegriffe

**Datei-/Roh-Audit vollständig** bedeutet: alle 535 V3-Blobs wurden eingelesen und inventarisiert.

**Source-/Symbolinventur vollständig** bedeutet: alle 238 Source-Dateien sind mit erkannten Symbolen/Methoden im Rohindex enthalten.

**Semantische Migration vollständig** bedeutet zusätzlich: jede relevante Capability und jedes für V4 relevante Verhalten wurde gegen Tests/Fehlerwissen einem endgültigen V4-Owner und Vertrag zugeordnet. Diese Ebene wird während der konkreten V4-Modulimplementierung weiter bis auf Symbol-/Test-Ebene verifiziert.

Heuristische Zuordnungen im Rohindex sind keine Portierungsfreigabe.

## Grundregel

V3 ist Wissens-, Fehler-, Test- und Produktionsbeobachtungsquelle. Die Zielarchitektur wird nicht aus der historischen Patch-Reihenfolge übernommen.
