# Block 8 – Koordinationsschatten mit echten Lebensnachweisen

## Ziel

Dieser Nachweis verbindet die bereits live bestaetigte Ranger-zu-Ranger-Lebensnachweis-Kommunikation mit der produktiven V4-Gruppenkoordination.

Beobachtet werden die Zustaende:

1. beide Teilnehmer aktiv,
2. ein Teilnehmer wird nach mehr als 5 Sekunden ohne frischen Lebensnachweis `veraltet`,
3. seine Faehigkeitsaufgabe wird entfernt,
4. nach Reconnect wird der Teilnehmer wieder `aktiv`,
5. seine Aufgabe wird wieder zugeordnet.

Es werden weiterhin keine Kampf-, Bewegungs-, Skill-, Heil-, Loot-, Handels- oder Party-Aktionen ausgefuehrt. Eine Auswertung darf lediglich ueber den vorhandenen Lebensnachweis einmal `send_cm` ausloesen.

## Produktionskern im Browser

Adventure Land laedt die TypeScript-Laufzeit nicht als Node-ESM-Modul. Deshalb liegt fuer den Live-Test ein Browserkern unter

```text
v4/werkzeuge/block8-gruppenkoordination-kern.js
```

vor.

Dieser Kern ist an den exakten Git-Blob von

```text
v4/laufzeit/quelle/spiellogik/gruppen-koordination.ts
```

gebunden. Der Block-8-Strukturguard vergleicht den im Browserkern hinterlegten Quell-Blob mit `git hash-object` des aktuellen Produktionskerns. Wenn sich der Produktionskern aendert, ohne dass der Browserkern aktualisiert wird, wird CI rot.

Zusaetzlich vergleicht `block8-gruppenkoordination-schatten.test.mjs` die Browserentscheidungen fuer Aktiv, Stale, Reconnect, Safety, Serverabweichung und Ausfall mit der tatsaechlich kompilierten `koordiniereGruppe(...)`.

## Testprofil

Fuer den Nachweis werden bewusst explizite Testfaehigkeiten verwendet. Sie behaupten keine Klassenrolle und werden nicht automatisch aus `ranger` abgeleitet.

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
  gefahrenStufe: "sicher",
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
  gefahrenStufe: "sicher",
  intervallMillisekunden: 1000
})
```

`unterstuetzung: 1` auf Ranger2 dient nur dazu, den Aufgabenverlust und die Wiederaufnahme im Live-Nachweis eindeutig sichtbar zu machen.

Danach auf beiden:

```js
await V4Block8Lebensnachweis.starte()
```

## Koordinationswerkzeuge auf Ranger1 laden

Nach dem Lebensnachweis-Werkzeug werden auf Ranger1 geladen:

```text
v4/werkzeuge/block8-gruppenkoordination-kern.js
v4/werkzeuge/block8-gruppenkoordination-schatten.js
```

### Phase A – beide aktiv

Nach einigen Sekunden:

```js
await V4Block8Gruppenkoordination.pruefe()
```

Erwartung:

- `entscheidung.betriebsArt: "normal"`
- `aktiveTeilnehmerKennungen` enthaelt `My_Ranger1` und `My_Ranger2`
- beide Teilnehmerbewertungen sind `aktiv`
- `aufgaben.schaden: "My_Ranger1"`
- `aufgaben.unterstuetzung: "My_Ranger2"`
- `echteSpielaktionenAusgefuehrt: false`

### Phase B – Ranger2 wird stale

Auf Ranger2:

```js
V4Block8Lebensnachweis.stoppe()
```

Mehr als 5 Sekunden warten, empfohlen 7–8 Sekunden. Dann auf Ranger1:

```js
await V4Block8Gruppenkoordination.pruefe()
```

Erwartung:

- Bewertung fuer `My_Ranger2`: `veraltet`
- `aktiveTeilnehmerKennungen` enthaelt nur `My_Ranger1`
- `aufgaben.schaden: "My_Ranger1"`
- `aufgaben.unterstuetzung: null`
- keine Spielaktion.

### Phase C – Reconnect

Auf Ranger2:

```js
await V4Block8Lebensnachweis.starte()
```

Nach 2–3 Sekunden auf Ranger1:

```js
await V4Block8Gruppenkoordination.pruefe()
```

Erwartung:

- `My_Ranger2` wieder `aktiv`
- beide Teilnehmer wieder in `aktiveTeilnehmerKennungen`
- `aufgaben.unterstuetzung: "My_Ranger2"`
- `verworfen: 0`
- keine Spielaktion.

## Verlauf

Die letzten Auswertungen koennen ohne weitere Kommunikation gelesen werden:

```js
V4Block8Gruppenkoordination.status()
```

Das Werkzeug behaelt maximal 20 Auswertungen. Der Verlauf kann geloescht werden mit:

```js
V4Block8Gruppenkoordination.leereVerlauf()
```

## Sicherheitsgrenze

`gefahrenStufe: "sicher"` ist in diesem Nachweis ein expliziter Testwert, damit die produktive Koordination den Betriebsmodus `normal` zeigen kann. Fuer autonome Gruppenarbeit darf dieser Wert spaeter nicht manuell gesetzt werden; er muss aus der Block-7-Kampfsicherheitsentscheidung des jeweiligen Charakters stammen.
