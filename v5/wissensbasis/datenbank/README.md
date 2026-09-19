# Automatische Wissensdatenbank

Dieser Ordner ist der Standard-Ablageort fuer automatisch vom Windows-Bridge-Wissenswaechter erzeugte Daten.

Der Waechter ist **nicht** auf diesen Unterordner als Sicherheitsgrenze beschraenkt. Seine verbindliche Lese- und Schreibgrenze ist:

```text
v5/wissensbasis/**
```

Typische automatisch erzeugte Inhalte:

- `quellenstatus.json` – letzter bekannter Zustand registrierter Quellen;
- `kandidaten.json` – neu entdeckte, noch nicht bestaetigte Quellen;
- `aenderungsprotokoll.jsonl` – erkannte Inhaltsaenderungen;
- `letzter-lauf.json` – Zusammenfassung des letzten Wissenslaufs;
- `aktuell/**` – aktuelle Snapshots ueberwachter Textquellen;
- `live-verifiziert/manifest.json` – Manifest der vom lokalen Bot-Liveordner importierten Dateien;
- `live-verifiziert/aktuell/**` – rekursiver Spiegel der vom Bot gespeicherten Live-Wissensdateien.

Community- und unbekannte Quellen bleiben Kandidaten/Evidence, bis sie nach den Regeln der Wissensbasis revalidiert wurden.

Die Git-Historie ist Teil des Versionsverlaufs. Bestehende Informationen werden bei Aenderungen nicht still als historische Wahrheit geloescht.


## Maschinenlesbare Formatregeln

- `letzter-lauf.json` ist ein einzelnes JSON-Dokument.
- `quellenstatus.json` ist ein einzelnes JSON-Dokument.
- `kandidaten.json` ist ein einzelnes JSON-Dokument.
- `aenderungsprotokoll.jsonl` ist echtes JSONL: **genau ein vollstaendiges kompaktes JSON-Objekt pro Zeile**.
- `aktuell/<QUELLENKENNUNG>.txt` ist Roh-Evidence und darf nicht als typisierte Runtime-API missverstanden werden.

Kandidaten koennen false positives enthalten und duerfen weder Entwicklung noch Gameplay automatisch steuern.
