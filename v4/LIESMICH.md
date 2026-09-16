# Adventure Land AiO Bot V4

V4 wird bewusst neu und getrennt von V3 aufgebaut. Die wichtigsten Ziele sind ein leicht verständlicher Quellcode, eindeutige Zuständigkeiten, reproduzierbare Fehler, sichere 24/7-Ausführung und ein später weitgehend automatisierter Entwicklungsablauf.

## Verbindliche Grundregeln

- V4-eigene Klassen, Funktionen, Variablen, Zustände, Ereignisse, Fehler und Warnungen tragen deutsche Namen.
- Umlaute werden im Quellcode als `ae`, `oe`, `ue` und `ss` geschrieben, damit Werkzeuge und Dateisysteme zuverlässig bleiben.
- Eine Spielfunktion darf Adventure Land nicht direkt verändern. Sie stellt eine `AktionsAnfrage`; die zentrale Ausführung entscheidet.
- Gemeinsame Bereiche wie Bewegung, Inventar und Bank werden exklusiv gesperrt.
- Sicherheitsaktionen stehen immer über normaler Arbeit.
- Warnungen und Fehler erklären: Was ist passiert? Warum? Was hat der Bot getan? Muss der Nutzer handeln?
- Laufzeit und Server-Plattform bleiben getrennt.
- SFTP-Zugangsdaten gelangen niemals in Adventure Land oder die Web-Oberfläche.
- E-Mail-Versandgeheimnisse fuer Tagesberichte existieren ausschliesslich serverseitig.
- Reale Probleme werden als reproduzierbare Vorfälle mit Wiederholungsdaten gespeichert.
- V4 verwaltet keine Adventure-Land-Anmeldedaten. Die Laufzeit arbeitet innerhalb einer bereits bestehenden Adventure-Land-Sitzung.
- Die Plattform kann spaeter automatisch einen Bericht ueber die vergangenen exakt 24 Stunden erstellen, in der Web-Oberflaeche speichern und optional per E-Mail versenden.

## Wichtige Dokumente

- `dokumentation/FAHRPLAN.md` – Entwicklungsreihenfolge und Abschlusspruefungen
- `dokumentation/ARCHITEKTUR.md` – technische Grundstruktur
- `dokumentation/VERTRAEGE.md` – feste Daten- und Verhaltensvertraege
- `dokumentation/NAMEN_UND_MELDUNGEN.md` – deutsche Namens- und Meldungsregeln
- `dokumentation/ENTWICKLUNGSABLAUF.md` – Weg vom Vorfall bis zum Pull Request
- `dokumentation/SPEICHER_UND_WEB.md` – Web, Cloud und SFTP-Archiv
- `dokumentation/TAGESBERICHT.md` – automatischer 24-Stunden-Bericht und Versandregeln
- `dokumentation/TESTPLAN.md` – Teststufen bis zum 7-Tage-Dauertest

## Lokale Pruefung

```bash
npm install
npm run pruefen
```

V4 enthaelt in dieser Grundlage noch keine aktive Farmer-, Haendler- oder Kampfsteuerung.
