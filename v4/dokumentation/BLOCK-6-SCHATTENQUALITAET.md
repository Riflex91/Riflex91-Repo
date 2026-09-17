# Block 6 – Sampling-Qualitaet des 30-Minuten-Schattenlaufs

## Zweck

Ein Schattenlauf darf nicht allein anhand seiner Wall-Clock-Dauer als valide gelten. Browser-Tab-Throttling, Energiesparmodi oder ein ausgesetzter Adventure-Land-Codekontext koennen dazu fuehren, dass ein nominell 30-minuetiger Lauf nur einen Teil der geplanten Beobachtungsschritte ausfuehrt.

`v4/werkzeuge/block6-schattenlauf-qualitaet.js` legt deshalb eine read-only Qualitaetsschicht um den bestehenden `V4Block6SchattenRanger`. Die Farmplanung selbst wird nicht dupliziert oder veraendert.

## Browser-Throttling

Adventure Land weist selbst darauf hin, dass Browser den Spielcode bei einem unfokussierten Tab verlangsamen koennen und stellt dafuer `performance_trick()` bereit.

Der ueberwachte Schattenlauf ruft deshalb **vor jedem Start verpflichtend `performance_trick()` auf**. Ist die Funktion nicht verfuegbar oder wirft sie einen Fehler, wird der Schattenlauf nicht gestartet. So entsteht kein Lauf, dessen Sampling von Anfang an unzuverlaessig sein kann.

`performance_trick()` gilt hier nicht als Spielaktion. Der Schattenlauf bleibt read-only und ruft weiterhin weder `attack()`, `move()`, `loot()` noch andere Farmaktionen auf.

## Bewertete Kennzahlen

Der Qualitaetsbericht enthaelt mindestens:

- `erwarteteSchritte`: erwartete Anzahl Ticks fuer Dauer und Intervall; der direkte Start-Tick wird mitgezaehlt,
- `tatsaechlicheSchritte`: vom bestehenden Schattenrunner gemeldete Schritte,
- `abdeckungProzent`: tatsaechliche geteilt durch erwartete Schritte,
- `verpassteIntervalle`: Differenz zwischen erwarteten und tatsaechlichen Schritten,
- `maximaleTickLueckeMillisekunden`: groesste beobachtete Zeitluecke zwischen Schrittfortschritten,
- `langeTickLuecken`: Anzahl beobachteter Luecken oberhalb der erlaubten Grenze,
- `browserSamplingAusreichend`: abschliessende Ja/Nein-Bewertung,
- `performanceTrick`: bestaetigt, dass `performance_trick()` vor dem Lauf aktiviert wurde.

Standardmaessig gelten mindestens 95 % Abdeckung und maximal das Fuenffache des konfigurierten Tick-Intervalls als ausreichend.

## Statusregeln

Ein Quelllauf mit `status: "abgeschlossen"` wird nur dann auch von der Qualitaetsschicht als `abgeschlossen` ausgegeben, wenn Abdeckung und maximale Tick-Luecke ausreichend sind.

Ist die Laufzeit abgelaufen, aber die Sampling-Qualitaet unzureichend, lautet der Status `unvollstaendig`. Verpasste Ticks werden niemals kuenstlich nachgeholt, weil das denselben Spielzustand mehrfach auswerten und damit Daten erfinden wuerde.

## 30-Minuten-Ranger-Schattenlauf

Vor dem Test muessen geladen sein:

1. `v4/werkzeuge/adventure-land-testkonsole.js`
2. `v4/werkzeuge/block6-schattenlauf-ranger.js`
3. `v4/werkzeuge/block6-schattenlauf-qualitaet.js`

Start mit den Standardwerten:

```js
V4Block6SchattenQualitaet.starte(["goo"])
```

Das entspricht 30 Minuten Laufzeit, 1.000 ms Planungsintervall und 5-Minuten-Zwischenberichten. Einschliesslich des sofortigen Start-Ticks werden ungefaehr 1.801 Schritte erwartet.

Fruehe Kontrolle, zum Beispiel nach 10 Minuten:

```js
V4Block6SchattenQualitaet.status()
```

Die Schrittzahl sollte ungefaehr der verstrichenen Sekunden plus Start-Tick entsprechen und `samplingQualitaet.abdeckungProzent` nahe 100 liegen.

Finales kompaktes Ergebnis:

```js
V4Block6SchattenQualitaet.kompaktErgebnis()
```

## Sicherheit

Die Qualitaetsschicht aktiviert nur `performance_trick()` und beobachtet anschliessend den bereits read-only ausgelegten `V4Block6SchattenRanger`. Sie fuehrt keine Adventure-Land-Spielaktionen aus.
