# Web-Oberflaeche

Live-Zustand, Warnungen, Vorfaelle, Wiederholungen, Experimente, Entwicklungswarteschlange und Tagesberichte werden hier spaeter verstaendlich dargestellt.

Die Oberflaeche ist selbst ein Sicherheitsbereich. Veraendernde Aktionen muessen durch die zentrale `BedienSicherung` laufen.

## Nutzerauftraege

Die Oberflaeche bietet spaeter ein Feld `Was soll V4 erledigen?`.

Waehren der Eingabe erscheinen nur bekannte und aktuell verfuegbare Vorschlaege, zum Beispiel:

- `Sammeln`
- `Herstellen`
- bekannte Gegenstaende passend zum eingegebenen Namen oder Suchwort

Ein angeklickter Vorschlag fuellt nur die strukturierte Auftragsmaske vor. Er startet niemals direkt eine Spielaktion.

Vor dem Start zeigt die Oberflaeche den geprueften Auftragsplan mit Ziel, aktuellem Bestand, Restmenge, Teilaufgaben, beteiligten Charakteren, moeglichen Verbrauchsguetern, Warnungen und blockierenden Voraussetzungen.

Mehrdeutige Angaben wie `Sammle 200 Bienenfluegel` muessen sichtbar zwischen `200 zusaetzlich` und `Gesamtbestand auf 200` aufgeloest werden.
