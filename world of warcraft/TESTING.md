# ForeverGuide Data Tools — Testablauf

Dieses Paket enthält:

- `ForeverDataMiner` — Windows-Tool für Build-/Hotfix-/DB2-Daten.
- `ForeverGuideRecorder` — WoW-Addon für echte Gameplay-Evidenz.

## 1. ForeverDataMiner

1. WoW vollständig aktualisieren.
2. Für einen vollständigen DB2-Scan WoW schließen. Bei Nutzung von wow.tools.local sollte auch Battle.net idle bzw. geschlossen sein.
3. `ForeverDataMiner.exe` starten.
4. Falls der WoW-Hauptordner nicht automatisch erkannt wird, den Ordner auswählen, in dem `.build.info` liegt.
5. `Jetzt scannen` verwenden oder das automatische Monitoring laufen lassen.
6. Erzeugte Dateien liegen im in der Oberfläche angezeigten Exportordner.

Der relevante Rückgabe-Datensatz heißt:

`ForeverDataMiner-<build>-<zeit>.fgds.zip`

Wenn WoW während eines Scanversuchs läuft, überspringt der Miner den DB2-Provider aus Sicherheitsgründen. Nach dem Beenden von WoW erkennt das Monitoring den Zustandswechsel und führt den Datenscan erneut aus.

### DB2-Provider

Für vollständige DB2-/Hotfix-Daten nutzt der Miner lokal `wow.tools.local`.

Wenn dessen EXE an einem dieser Orte liegt, kann ForeverDataMiner den Provider automatisch starten und anschließend wieder beenden:

- direkt neben `ForeverDataMiner.exe`: `wow.tools.local.exe`
- `tools\wow.tools.local\wow.tools.local.exe` neben dem Miner
- `%LOCALAPPDATA%\ForeverGuide\Tools\wow.tools.local\wow.tools.local.exe`

Wenn bereits ein Provider unter `http://localhost:5000` läuft, verwendet der Miner diesen und beendet ihn nicht.

## 2. ForeverGuide Recorder v0.3

Den Ordner `ForeverGuideRecorder` nach:

`<WoW-Forever-Produktordner>\Interface\AddOns\ForeverGuideRecorder\`

kopieren und das Addon im Charakterbildschirm aktivieren.

Im Spiel:

`/fgr status`

zeigt Build und Anzahl aufgezeichneter Records.

Danach normal questen/leveln. Zusätzlich zeichnet v0.3 geöffnete Questdialoge inklusive Questtexten, Ziel-/Fortschrittstexten und Belohnungsdaten auf.

Optional:

- `/fgr danger`
- `/fgr wait`
- `/fgr bug`
- `/fgr good`
- `/fgr note <text>`

Vor dem Einsammeln der Daten einmal `/reload` ausführen oder normal ausloggen.

Der relevante Rückgabe-Datensatz liegt unter:

`WTF\Account\<account>\SavedVariables\ForeverGuideRecorder.lua`

## 3. Zur Analyse zurückgeben

Benötigt werden genau diese beiden Dateien:

1. die neueste `ForeverDataMiner-*.fgds.zip`
2. `ForeverGuideRecorder.lua`

Charaktername und Realm werden vom Recorder absichtlich nicht in die FGDS-Evidenz geschrieben.

## Testziel v0.3

Beim ersten echten Forever-Test prüfen wir insbesondere:

- korrekte Forever-Build-/Interface-Erkennung
- tatsächliche API-Verfügbarkeit für Quest-, Talent- und Itemdaten
- Questdialog-, Reward- und Objective-Erfassung
- korrekte NPC-/Quest-IDs
- Positionssampling
- Talent-/Build-Erkennung
- Inventar- und Gear-Ereignisse
- SavedVariables-Integrität
- DB2-Verfügbarkeit für den konkreten Forever-Build
- automatischen Start/Stop des lokalen DB2-Providers, falls vorhanden
