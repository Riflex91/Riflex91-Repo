# Block 8 – Koordinationsschatten mit echten Lebensnachweisen

Status: **Live-Abnahme bestanden am 2026-09-17**.

## Ziel

Dieser Nachweis verbindet die echte Ranger-zu-Ranger-Lebensnachweis-Kommunikation mit der produktiven V4-Gruppenkoordination.

Beobachtet werden:

1. beide Teilnehmer aktiv,
2. ein Teilnehmer wird nach mehr als 5 Sekunden ohne frischen Lebensnachweis `veraltet`,
3. seine Faehigkeitsaufgabe wird entfernt,
4. nach Reconnect wird der Teilnehmer wieder `aktiv`,
5. seine Aufgabe wird wieder zugeordnet.

Es werden keine Kampf-, Bewegungs-, Skill-, Heil-, Loot-, Handels- oder Party-Aktionen ausgefuehrt. Eine Auswertung darf lediglich ueber den vorhandenen Lebensnachweis einmal `send_cm` ausloesen.

## Live-Abnahme vom 2026-09-17

Der komplette Zyklus wurde mit `My_Ranger1` und `My_Ranger2` erfolgreich nachgewiesen.

### Phase A – beide aktiv

Beobachtet:

- `betriebsArt: "normal"`
- `gemeinsameGefahrenStufe: "sicher"`
- `My_Ranger1`: `aktiv`, Alter 0 ms
- `My_Ranger2`: `aktiv`, Alter 730 ms
- `aufgaben.schaden: "My_Ranger1"`
- `aufgaben.unterstuetzung: "My_Ranger2"`
- `verworfen: 0`
- `echteSpielaktionenAusgefuehrt: false`

Ergebnis: **bestanden**.

### Phase B – Ranger2 veraltet

Nach Stoppen des Lebensnachweises auf `My_Ranger2`:

- `My_Ranger2`: `veraltet`, Alter 18.061 ms
- aktive Teilnehmer: nur `My_Ranger1`
- `aufgaben.schaden: "My_Ranger1"`
- `aufgaben.unterstuetzung: null`
- `verworfen: 0`
- `echteSpielaktionenAusgefuehrt: false`

Ergebnis: **bestanden**.

### Phase C – Reconnect

Nach erneutem Start auf `My_Ranger2`:

- `My_Ranger1`: `aktiv`, Alter 1 ms
- `My_Ranger2`: wieder `aktiv`, Alter 806 ms
- `aufgaben.schaden: "My_Ranger1"`
- `aufgaben.unterstuetzung: "My_Ranger2"`
- `verworfen: 0`
- `echteSpielaktionenAusgefuehrt: false`

Ergebnis: **bestanden**.

Der nachgewiesene Zyklus lautet damit:

```text
aktiv -> veraltet -> Aufgabe entzogen -> Reconnect -> aktiv -> Aufgabe wieder zugeordnet
```

## Produktionskern im Browser

Adventure Land laedt die TypeScript-Laufzeit nicht als Node-ESM-Modul. Deshalb liegt fuer den Live-Test ein Browserkern unter

```text
v4/werkzeuge/block8-gruppenkoordination-kern.js
```

Dieser Kern ist an den exakten Git-Blob von

```text
v4/laufzeit/quelle/spiellogik/gruppen-koordination.ts
```

gebunden. Der Strukturguard wird rot, wenn sich der Produktionskern aendert, ohne dass der Browserkern nachgezogen wird. `block8-gruppenkoordination-schatten.test.mjs` vergleicht Browserentscheidungen gegen die kompilierte Produktionslogik.

## Aktuelles Testprofil ab Lebensnachweis 1.1.0

Vor dem Lebensnachweis wird auf **beiden** Charakteren geladen:

```text
v4/werkzeuge/block7-kampfsicherheits-quelle.js
v4/werkzeuge/block8-lebensnachweis-schatten.js
```

Die Gefahrenstufe wird nicht mehr konfiguriert. Sie kommt automatisch aus Block 7.

### My_Ranger1

```js
V4Block8Lebensnachweis.konfiguriere({
  vertrauensNamen: ["My_Ranger1", "My_Ranger2"],
  faehigkeiten: {
    heilen: 0,
    schaden: 1,
    aggro: 0,
    schutz: 0,
    unterstuetzung: 0
  },
  intervallMillisekunden: 1000
})
```

### My_Ranger2

```js
V4Block8Lebensnachweis.konfiguriere({
  vertrauensNamen: ["My_Ranger1", "My_Ranger2"],
  faehigkeiten: {
    heilen: 0,
    schaden: 0.7,
    aggro: 0,
    schutz: 0,
    unterstuetzung: 1
  },
  intervallMillisekunden: 1000
})
```

`unterstuetzung: 1` dient weiterhin nur dazu, Aufgabenentzug und Wiederaufnahme eindeutig sichtbar zu machen. Es ist keine aus der Ranger-Klasse abgeleitete Rolle.

Danach auf beiden:

```js
await V4Block8Lebensnachweis.starte()
```

Auf Ranger1 werden anschliessend geladen:

```text
v4/werkzeuge/block8-gruppenkoordination-kern.js
v4/werkzeuge/block8-gruppenkoordination-schatten.js
```

Auswertung:

```js
await V4Block8Gruppenkoordination.pruefe()
```

## Sicherheitsverhalten ab 1.1.0

`V4Block8Lebensnachweis` akzeptiert keine manuelle `gefahrenStufe` mehr. Jeder Sendevorgang benoetigt eine frische `V4Block7KampfsicherheitsQuelle`-Bewertung.

Dadurch gilt fuer die Gruppenkoordination automatisch:

- Block 7 `sicher` oder `angespannt` -> entsprechende Gruppenlage,
- Block 7 `gefaehrlich` oder `kritisch` -> Gruppenbetrieb `sicherheit`,
- Block 7 `unbekannt` -> Gruppenbetrieb fail-safe `blockiert`.

Block 8 kann die Sicherheitslage damit im Live-Pfad nicht mehr manuell auf `sicher` setzen.
