# Adventure Land AiO Bot V4

V4 wird bewusst neu und getrennt von V3 aufgebaut. Die wichtigsten Ziele sind ein leicht verständlicher Quellcode, eindeutige Zuständigkeiten, reproduzierbare Fehler, sichere 24/7-Ausführung, fehlbedienungssichere Nutzung und ein später weitgehend automatisierter Entwicklungsablauf.

## Verbindliche Grundregeln

- V4-eigene Klassen, Funktionen, Variablen, Zustände, Ereignisse, Fehler und Warnungen tragen deutsche Namen.
- Umlaute werden im Quellcode als `ae`, `oe`, `ue` und `ss` geschrieben, damit Werkzeuge und Dateisysteme zuverlässig bleiben.
- Eine Spielfunktion darf Adventure Land nicht direkt verändern. Sie stellt eine `AktionsAnfrage`; die zentrale Ausführung entscheidet.
- Gemeinsame Bereiche wie Bewegung, Inventar und Bank werden exklusiv gesperrt.
- Sicherheitsaktionen stehen immer über normaler Arbeit.
- Warnungen und Fehler erklären: Was ist passiert? Warum? Was hat der Bot getan? Muss der Nutzer handeln?
- Jede verändernde Bedienaktion läuft durch die zentrale `BedienSicherung`.
- Kritische Bedienaktionen können niemals mit einem einzelnen Klick ausgeführt werden.
- Ungültige oder unvollständige Einstellungen werden blockiert statt geraten.
- Nutzer können V4 konkrete Ziele wie Sammel- oder Herstellungsaufträge geben.
- Freitext für Nutzeraufträge ist nur Eingabehilfe und wird niemals direkt ausgeführt.
- Während der Eingabe werden nur bekannte und aktuell verfügbare Auftragsarten und Gegenstände vorgeschlagen.
- Supabase, Cloudflare und spätere externe Dienste werden vor jedem Aufruf durch den `KontingentWaechter` geprüft.
- Anbietergrenzen werden niemals voll ausgeschöpft; V4 arbeitet mit eigenen Sicherheitspuffern.
- Unbekannte oder abgelaufene Dienstgrenzen führen zur Blockierung externer Arbeit, nicht zur Schätzung.
- Lokale Spielsicherheit funktioniert auch dann weiter, wenn alle externen Dienste ausfallen oder blockiert sind.
- Keine Warteschlange darf unbegrenzt wachsen.
- Laufzeit und Server-Plattform bleiben getrennt.
- SFTP-Zugangsdaten gelangen niemals in Adventure Land oder die Web-Oberfläche.
- E-Mail-Versandgeheimnisse für Tagesberichte existieren ausschließlich serverseitig.
- Reale Probleme werden als reproduzierbare Vorfälle mit Wiederholungsdaten gespeichert.
- V4 verwaltet keine Adventure-Land-Anmeldedaten. Die Laufzeit arbeitet innerhalb einer bereits bestehenden Adventure-Land-Sitzung.
- Die Plattform kann später automatisch einen Bericht über die vergangenen exakt 24 Stunden erstellen, in der Web-Oberfläche speichern und optional per E-Mail versenden.

## Bedienprinzip

Die normale Oberfläche zeigt einen eindeutigen Zustand in deutscher Sprache: `GRUEN`, `GELB` oder `ROT`, immer zusammen mit einer Erklärung und einer Aussage, ob der Nutzer handeln muss.

Die sichere Standardbedienung soll ohne technisches Anbieterwissen möglich sein. Komplexe Werte werden soweit möglich automatisch verwaltet. Erweiterte Einstellungen sind getrennt und zeigen vor einer Änderung ihre Auswirkung.

Eine mathematisch absolute Garantie gegen jede denkbare Fehlbedienung ist bei Software nicht möglich. V4 wird deshalb nach dem Prinzip `sicher scheitern statt gefährlich raten` entwickelt und getestet.

## Nutzerauftraege

Die Web-Oberfläche soll später ein Feld `Was soll V4 erledigen?` anbieten. Beim Tippen erscheinen passende Vorschläge wie `Sammeln`, `Herstellen` und bekannte Gegenstände. Ein Vorschlag füllt nur die Auftragsmaske vor; er startet niemals selbst eine Aktion.

Vor dem Start zeigt V4 den strukturierten Auftragsplan, vorhandenen Bestand, fehlende Menge, geplante Teilaufgaben und mögliche Verbrauchsgüter. Mehrdeutige Angaben werden nicht stillschweigend interpretiert.

## Wichtige Dokumente

- `dokumentation/FAHRPLAN.md` – Entwicklungsreihenfolge und Abschlussprüfungen
- `dokumentation/ARCHITEKTUR.md` – technische Grundstruktur
- `dokumentation/VERTRAEGE.md` – feste Daten- und Verhaltensverträge
- `dokumentation/NAMEN_UND_MELDUNGEN.md` – deutsche Namens- und Meldungsregeln
- `dokumentation/BEDIENUNG_UND_FEHLBEDIENUNGSSICHERHEIT.md` – verbindliche Regeln für eine sichere, einfache Bedienung
- `dokumentation/DIENSTGRENZEN_UND_FEHLBEDIENUNGSSICHERHEIT.md` – Schutz vor Supabase-, Cloudflare- und späteren Dienstgrenzen
- `dokumentation/NUTZER_AUFTRAEGE.md` – sichere Sammel-, Herstellungs- und Vorschlagslogik fuer Nutzerauftraege
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
