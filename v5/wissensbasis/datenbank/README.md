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
- `aktuell/**` – aktuelle Snapshots ueberwachter Textquellen.

Community- und unbekannte Quellen bleiben Kandidaten/Evidence, bis sie nach den Regeln der Wissensbasis revalidiert wurden.

Die Git-Historie ist Teil des Versionsverlaufs. Bestehende Informationen werden bei Aenderungen nicht still als historische Wahrheit geloescht.
