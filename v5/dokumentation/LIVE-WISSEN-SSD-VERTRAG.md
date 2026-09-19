# V5 – Live-Wissensdatenbank auf SSD

**Status:** VERBINDLICHER ZIELVERTRAG FUER V5-RUNTIME UND WINDOWS BRIDGE  
**Stand:** 2026-09-19

## 1. Ziel

V5 fuehrt neben der versionierten GitHub-Wissensbasis eine lokale, vom Bot selbst erzeugte **live verifizierte Wissensdatenbank**.

Standardpfad:

```text
D:\AdventureLand-V5\wissensdatenbank
```

Die lokale SSD-Datenbank dient als persistente Evidence fuer im echten Adventure-Land-Spiel beobachtete Tatsachen.

Sie ist ein besonders geschuetzter Teil des groesseren lokalen Datenfundaments unter `D:\\AdventureLand-V5`. Der uebergeordnete Vertrag ist `LOKALES-SSD-DATENFUNDAMENT.md`. Der bestehende Standardpfad `D:\\AdventureLand-V5\\wissensdatenbank` bleibt fuer Bridge-Kompatibilitaet unveraendert.

Sie ist nicht identisch mit aktuellem Character-/World-State und besitzt keine direkte ExecutionAuthority.

## 2. Rollen

### V5-Bot

Der Bot ist spaeter der **alleinige fachliche Writer** der lokalen Live-Wissensdatenbank.

Er:
- legt den Ordner an, falls er fehlt;
- erzeugt `manifest.json`, `status.json` und `aktuell/**`;
- schreibt nur Fakten, die im echten Spiel beobachtet und nach dem jeweiligen Beobachtungsvertrag verifiziert wurden;
- benutzt atomare Temp-Datei-zu-Rename-Schreibvorgaenge;
- verwaltet die Snapshot-Generation;
- entfernt/supersediert stale aktuelle Fakten kontrolliert;
- schreibt keinerlei Secrets.

### Windows Bridge

Die Bridge:
- darf den konfigurierten D:-Pfad nur lesen;
- erstellt keine Gameplay-Fakten;
- bewertet keine fachliche Wahrheit neu;
- validiert Struktur, Schema, Spielkennung, Live-Status, Generation, Pfade, Dateigroessen und Geheimnisfelder;
- liest nur einen stabilen `BEREIT`-Snapshot;
- spiegelt ihn nach `v5/wissensbasis/live/snapshot/**`;
- laedt ihn gemeinsam mit dem Wissenswaechterlauf nach GitHub;
- besitzt keinen Zugriff auf Runtime-Journale, Replay-, Telemetrie-, Learning-, Testlabor- oder Recovery-Bereiche des SSD-Datenfundaments;
- behaelt bei fehlerhaftem/neuem unvollstaendigem lokalen Snapshot den letzten gueltigen GitHub-Snapshot.

### GitHub

GitHub ist:
- versionierter Spiegel;
- Entwicklungs-Evidence;
- Drift-/Historienquelle;
- Eingabe fuer spaetere Wissensrevalidierung.

GitHub ist nicht:
- Millisekunden-Live-State;
- direkte Gameplay-Autoritaet.

## 3. Lokale Struktur

```text
D:\AdventureLand-V5\wissensdatenbank\
  manifest.json
  status.json
  aktuell\
    server\
    monster\
    item\
    markt\
    ...
  temporaer\
  quarantaene\
```

Nur `manifest.json`, `status.json` und `aktuell/**/*.json` sind importierbar.

`temporaer/**` und `quarantaene/**` bleiben immer lokal.

## 4. Manifest

Minimal:

```json
{
  "schemaVersion": 1,
  "format": "ADVENTURE_LAND_V5_LIVE_WISSEN",
  "spiel": "Adventure Land - The Code MMORPG",
  "aktuellVerzeichnis": "aktuell"
}
```

## 5. Status und Generation

Minimal:

```json
{
  "schemaVersion": 1,
  "spiel": "Adventure Land - The Code MMORPG",
  "generation": 42,
  "zustand": "BEREIT",
  "aktualisiertAm": "2026-09-19T19:00:00Z"
}
```

Zulaessige Zustaende:

- `SCHREIBT`
- `BEREIT`

### Schreibprotokoll

1. naechste Generation bestimmen;
2. `status.json` atomar auf `SCHREIBT` setzen;
3. alle neuen/veraenderten Facts atomar schreiben;
4. nicht mehr aktuelle Facts kontrolliert entfernen;
5. interne Konsistenz pruefen;
6. `status.json` atomar auf `BEREIT` derselben Generation setzen.

Die Bridge liest den Status vor und nach dem Snapshot. Aendert sich auch nur ein Byte oder die Generation, wird nicht importiert.

## 6. Live-Fakt

Minimal:

```json
{
  "schemaVersion": 1,
  "spiel": "Adventure Land - The Code MMORPG",
  "kennung": "monster.frog.main.beobachtung",
  "domaene": "MONSTER",
  "status": "LIVE_VERIFIZIERT",
  "beobachtetAm": "2026-09-19T19:00:00Z",
  "verifiziertAm": "2026-09-19T19:00:01Z",
  "quelle": {
    "art": "LIVE_SPIEL",
    "methode": "reconciled-world-observation"
  },
  "wert": {}
}
```

Erlaubte Domaenen:

```text
KERN
CHARAKTER
INVENTAR
SKILL
MONSTER
MAP
EVENT
QUEST
MARKT
BANK
HANDWERK
KAMPF
NAVIGATION
GRUPPE
SERVER
ITEM
NPC
```

## 7. Was "LIVE_VERIFIZIERT" bedeutet

`LIVE_VERIFIZIERT` darf nur gesetzt werden, wenn ein fachlicher Verifier den beobachteten Zustand bestaetigt hat.

Beispiele:

- Itembestand: nach Inventory-Reobserve;
- Kauf: Serverresultat plus beobachteter Gold-/Item-Postcondition;
- Monsterposition: frische Entity-Beobachtung mit Server/Map/ObservedAt;
- Eventstatus: frischer Server-/World-State, nicht nur `G.events`;
- Bankzustand: frisch beobachteter Bankinhalt bei gueltiger Bank-Session;
- Skillverfuegbarkeit: aktuelle Definition + Character-State + `can_use`/Cooldown-Evidence.

Nicht ausreichend:

- Planerannahme;
- alter Cache;
- Community-Behauptung;
- API-Definition ohne Live-State;
- einzelner Promise-Return ohne benoetigte Postcondition.

## 8. Keine unzulässige Verallgemeinerung

Ein live verifizierter konkreter Fakt darf nicht automatisch zu einer globalen Spielregel hochgestuft werden.

Beispiel:

```text
Beobachtet:
frog auf Server EU I, Map main, Zeitpunkt T, Position X/Y

zulaessig:
konkrete Live-Evidence fuer diese Beobachtung

nicht zulaessig:
"Frogs spawnen immer exakt dort"
```

Allgemeine Formeln, Action Contracts und dauerhafte Spielregeln benoetigen die dafuer definierte Evidence-Klasse und Revalidierung.

## 9. Bridge-Sicherheitsregeln

Die Bridge akzeptiert nur:

- absoluten Pfad auf Laufwerk `D:\`;
- keinen Laufwerksroot selbst;
- keine Reparse Points/Junctions/Symlinks innerhalb des importierten Baums;
- maximal konfigurierte Dateianzahl;
- maximal konfigurierte Einzeldatei- und Gesamtgroesse;
- ausschließlich JSON unter `aktuell/**`;
- exakt Adventure Land als Spielkennung;
- exakt `LIVE_VERIFIZIERT`;
- plausible Zeitordnung;
- `quelle.art=LIVE_SPIEL`;
- keine secret-/token-/password-/credential-/cookie-/session-artigen Property-Namen.

## 10. GitHub-Spiegel

Ziel:

```text
v5/wissensbasis/live/snapshot/
  manifest.json
  status.json
  import.json
  aktuell/**
```

`import.json` enthaelt:

- Importzeit;
- Generation;
- Dateianzahl;
- Gesamtbytes;
- Snapshot-SHA256;
- Spielkennung.

Der lokale SSD-Pfad wird nicht in GitHub geschrieben.

## 11. Zugriff des spaeteren Bots

Der Bot verwendet spaeter einen typisierten read-only Wissenszugriff fuer persistiertes Wissen.

Die lokale Live-Wissensdatenbank ist eine seiner Evidence-Quellen.

Unmittelbar vor mutierenden Aktionen gilt weiterhin:

```text
persistiertes Live-Wissen
+ aktuelle Beobachtung
+ Action Contract
+ Authority
+ Resource/Lock/Fencing
+ Operator Policy
+ Postcondition/Reconciliation
= moegliche Execution-Freigabe
```

Persistiertes Wissen allein reicht niemals.

## 12. Retention

GitHub soll keine hochfrequente Rohtelemetrie aufnehmen.

Deshalb:
- `aktuell/**` enthaelt nur den jeweils aktuellen verifizierten Stand;
- Git-Historie liefert grobe Versionshistorie;
- hochfrequente Rohbeobachtungen bleiben in dafuer vorgesehenen bounded Telemetrie-/Diagnosepfaden;
- lokale Quarantaene und temporaere Zwischenstaende werden nicht gespiegelt.

## 13. Runtime-Umsetzung

Die konkrete Bot-Writer-Implementierung wird erst gebaut, wenn das allgemeine V5-Laufzeit-Bereitschaftsgate freigegeben ist.

Pflichtkomponenten in R5/R6:

- `LiveWissensSpeicherPort`;
- atomarer Dateispeicher auf D:;
- Generation-/Status-Writer;
- typed Live-Fact-Serializer;
- Domain-Verifier-Anbindung;
- bounded Retention;
- Restart-/Crash-Recovery;
- Tests fuer torn writes, corrupted JSON, Disk Full, Zugriffsfehler und Clock-Anomalien.

**Leitsatz:** Der Bot beobachtet und verifiziert. Die SSD persistiert. Die Bridge validiert und spiegelt. GitHub versioniert. Execution prueft trotzdem nochmals live.


## R2-Ratifizierung

**R2-Status:** RATIFIZIERT am 2026-09-19.  
Dieser Vertrag ist Bestandteil der V5-Verfassung. Die Ratifizierung ist eine Architektur-/Vorbereitungsfreigabe und **keine Gameplay-Runtime-Freigabe**. Technische Umsetzung und Live-Nachweise folgen ausschliesslich in den dafuer vorgesehenen Roadmap-Phasen.
