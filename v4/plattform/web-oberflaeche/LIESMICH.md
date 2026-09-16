# Web-Oberflaeche

Live-Zustand, Warnungen, Vorfaelle, Wiederholungen, Experimente, Entwicklungswarteschlange und Tagesberichte werden hier spaeter verstaendlich dargestellt.

Die Oberflaeche ist selbst ein Sicherheitsbereich. Veraendernde Aktionen muessen durch die zentrale `BedienSicherung` laufen.

## Nutzerauftraege

Die Oberflaeche bietet spaeter ein Feld `Was soll V4 erledigen?`.

Waehren der Eingabe erscheinen nur bekannte und aktuell verfuegbare Vorschlaege, zum Beispiel:

- `Sammeln`
- `Herstellen`
- bekannte Gegenstaende passend zum eingegebenen Namen oder Suchwort

Beispiele fuer die Vorschau:

```text
sam
  -> Sammeln

her
  -> Herstellen

bee
  -> Bienenfluegel
```

Direkte Wortanfaenge werden vor einfachen Teiltreffern angezeigt. Die Liste bleibt bewusst kurz und soll spaeter per Tastatur oder Beruehrung bedienbar sein.

Ein angeklickter Vorschlag fuellt nur die strukturierte Auftragsmaske vor. Er startet niemals direkt eine Spielaktion.

Vor dem Start zeigt die Oberflaeche den geprueften Auftragsplan mit Ziel, aktuellem Bestand, Restmenge, Teilaufgaben, beteiligten Charakteren, moeglichen Verbrauchsguetern, Warnungen und blockierenden Voraussetzungen.

Mehrdeutige Angaben wie `Sammle 200 Bienenfluegel` muessen sichtbar zwischen `200 zusaetzlich` und `Gesamtbestand auf 200` aufgeloest werden.

Neue Befehle erscheinen erst dann in der Vorschau, wenn die zugehoerigen Vertraege, Pruefungen und Spielfunktionen vorhanden und freigegeben sind.
