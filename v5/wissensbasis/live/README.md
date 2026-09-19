# Live verifizierte Wissensbasis

Dieser Bereich ist der **GitHub-Spiegel** der spaeter vom V5-Bot im echten Adventure-Land-Spiel beobachteten und verifizierten Wissensdaten.

Er ist bewusst getrennt von:

- `../datenbank/**` – Web-/Repo-/Dokumentations-Wissenswaechter;
- `../fakten/**` – kuratierte stabile Facts;
- `../vertraege/**` – Action Contracts.

## Lokale Primaerquelle

Der V5-Bot schreibt spaeter standardmaessig nach:

```text
D:\AdventureLand-V5\wissensdatenbank
```

Der Pfad ist in der Windows Bridge sichtbar konfigurierbar, muss aber auf Laufwerk `D:\` liegen.

Die lokale SSD-Datenbank ist die schnellere Quelle. GitHub wird durch die Bridge standardmaessig zusammen mit dem stuendlichen Wissenswaechterlauf gespiegelt.

## Lokale Struktur

```text
D:\AdventureLand-V5\wissensdatenbank\
  manifest.json
  status.json
  aktuell\
    <domaene>\
      <stabile-kennung>.json
  quarantaene\       # optional, bleibt lokal
  temporaer\         # optional, bleibt lokal
```

Nur `manifest.json`, `status.json` und validierte `aktuell/**/*.json` duerfen nach GitHub gespiegelt werden.

## Konsistenter Snapshot

Der Bot verwendet eine Generation:

1. `status.json -> zustand=SCHREIBT, generation=N+1`;
2. Dateien atomar ueber Temp-Datei + Rename aktualisieren;
3. veraltete aktuelle Dateien entfernen;
4. `status.json -> zustand=BEREIT, generation=N+1`.

Die Bridge liest den Status vor und nach dem Import. Nur wenn beide Bytes identisch sind, dieselbe Generation tragen und `BEREIT` melden, wird gespiegelt.

## Live-Fakt

Ein importierbarer Fakt muss mindestens enthalten:

```json
{
  "schemaVersion": 1,
  "spiel": "Adventure Land - The Code MMORPG",
  "kennung": "server.eu.i.monster.frog.spawn",
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

Der Wert darf beliebige fachliche JSON-Daten enthalten, aber keinerlei Secrets/Tokens/Credentials.

## GitHub-Ziel

Nach erfolgreichem Import:

```text
v5/wissensbasis/live/snapshot/
  manifest.json
  status.json
  import.json
  aktuell/**
```

`import.json` wird von der Bridge erzeugt und enthaelt Generation, Dateianzahl, Bytezahl und Snapshot-SHA256 – niemals den lokalen SSD-Pfad.

## Autoritaet

`LIVE_VERIFIZIERT` bedeutet: Der Fakt wurde im echten Spiel beobachtet und durch den Bot nach seinem fachlichen Beobachtungsvertrag bestaetigt.

Trotzdem gilt:

- GitHub-Livewissen ist Planning-/Evidence-Authority;
- es ist keine direkte ExecutionAuthority;
- unmittelbar vor Mutationen muss die Runtime weiterhin frische Live-Preconditions pruefen;
- ein stündlicher GitHub-Snapshot darf keine laufende irreversible Transaktion umdeuten.
