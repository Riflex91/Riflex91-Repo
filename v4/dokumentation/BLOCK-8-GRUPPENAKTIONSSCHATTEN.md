# Block 8 – Gruppenaktionsschatten

Status: **read-only Mehrcharakter-Nachweis fuer die Gruppenaktionsplanung live bestanden**.

## Ziel

Diese Stufe verbindet die bereits live getestete Lebensnachweis-Kommunikation und Gruppenkoordination mit der produktiven `planeGruppenAktionen(...)`-Logik.

Die Kette lautet:

`echter Charakterzustand -> Block-7-Sicherheit -> Lebensnachweis -> Koordinationsschatten -> Gruppenaktionsplanung -> eigener Schattenplan`

Es wird weiterhin **keine Adventure-Land-Spielaktion ausgefuehrt** und **keine `AktionsAnfrage` erzeugt**.

## Source-Lock

`werkzeuge/block8-gruppenaktionsplanung-kern.js` ist die Browserfassung der produktiven Datei:

`v4/laufzeit/quelle/spiellogik/gruppen-aktionsplanung.ts`

Der Browserkern traegt den Git-Blob-SHA der Produktionsdatei. Der Strukturguard berechnet den Produktions-Blob-SHA in CI erneut und blockiert, wenn Browserkern und Produktionslogik auseinanderlaufen.

Der bestehende Koordinationsbrowserkern bleibt separat an `gruppen-koordination.ts` gebunden.

## Gleicher Snapshot

`V4Block8Gruppenkoordination.pruefe()` liefert ab Version `1.1.0` neben der Entscheidung auch `meldungen`: exakt den Heartbeat-Snapshot, der fuer diese Koordinationsentscheidung verwendet wurde.

Der Gruppenaktionsschatten verwendet genau diesen Snapshot weiter. Er liest nicht spaeter noch einmal separat aus dem Spiel. Dadurch gehoeren:

- Teilnehmermeldungen,
- Stale-Bewertung,
- Aufgabenverteilung,
- gemeinsame Sicherheitslage,
- gemeinsames Ziel,
- Gruppenaktionsplan

zu derselben Schattenauswertung.

## Ergebnis

`await V4Block8GruppenAktionsplanung.pruefe()` liefert unter anderem:

- `entscheidung`: die Gruppenkoordinationsentscheidung,
- `plan`: den vollstaendigen gemeinsamen Gruppenaktionsplan,
- `planSignatur`: zeitunabhaengige semantische Darstellung der geplanten Schritte,
- `eigeneSchritte`: nur die Schritte des lokalen Charakters,
- `aktionsAnfragenErzeugt: false`,
- `echteSpielaktionenAusgefuehrt: false`.

Die `planSignatur` enthaelt bewusst nicht die zeitabhaengige Schrittkennung. Zwei Charaktere mit demselben aktuellen Gruppensnapshot koennen deshalb ihre semantische Planung direkt vergleichen.

## Lade-Reihenfolge im Adventure-Land-Codekontext

Auf **jedem** beteiligten Charakter diese Dateien aus aktuellem `main` laden:

1. `v4/werkzeuge/block7-kampfsicherheits-quelle.js`
2. `v4/werkzeuge/block8-lebensnachweis-schatten.js`
3. `v4/werkzeuge/block8-gruppenkoordination-kern.js`
4. `v4/werkzeuge/block8-gruppenkoordination-schatten.js`
5. `v4/werkzeuge/block8-gruppenaktionsplanung-kern.js`
6. `v4/werkzeuge/block8-gruppenaktionsplanung-schatten.js`

Optional kann vorher `v4/werkzeuge/adventure-land-testkonsole.js` geladen werden.

## Zwei-Ranger-Konfiguration

Beispiel fuer `My_Ranger1`:

```js
V4Block8Lebensnachweis.konfiguriere({
  vertrauensNamen: ['My_Ranger1', 'My_Ranger2'],
  faehigkeiten: {
    heilen: 0,
    schaden: 1,
    aggro: 0,
    schutz: 0,
    unterstuetzung: 0
  },
  intervallMillisekunden: 1000
})
await V4Block8Lebensnachweis.starte()
```

Beispiel fuer `My_Ranger2`:

```js
V4Block8Lebensnachweis.konfiguriere({
  vertrauensNamen: ['My_Ranger1', 'My_Ranger2'],
  faehigkeiten: {
    heilen: 0,
    schaden: 0.7,
    aggro: 0,
    schutz: 0,
    unterstuetzung: 1
  },
  intervallMillisekunden: 1000
})
await V4Block8Lebensnachweis.starte()
```

Die Faehigkeitswerte sind in dieser Stufe nur deklarative Koordinationswerte. Der Gruppenaktionsschatten ruft daraus keine Skills oder andere Aktionen auf.

## Normaler Zwei-Ranger-Nachweis

Nach einigen Heartbeats auf **beiden** Charakteren ausfuehren:

```js
await V4Block8GruppenAktionsplanung.pruefe()
```

Erwartungen auf beiden Charakteren:

- `meldungsAnzahl: 2`,
- beide Teilnehmer in `entscheidung.aktiveTeilnehmerKennungen`,
- `aktionsAnfragenErzeugt: false`,
- `echteSpielaktionenAusgefuehrt: false`.

Wenn beide Charaktere dasselbe Ziel melden, sollen die `planSignatur`-Eintraege fuer den gemeinsamen Plan semantisch uebereinstimmen. `eigeneSchritte` darf sich unterscheiden, weil jeder Charakter nur seine eigenen zugewiesenen Schritte sieht.

## Stale- und Reconnect-Nachweis

1. Beide Lebensnachweise laufen lassen und einen normalen Plan pruefen.
2. Auf `My_Ranger2` stoppen:

```js
V4Block8Lebensnachweis.stoppe()
```

3. Mehr als `5000 ms` warten.
4. Auf `My_Ranger1` erneut ausfuehren:

```js
await V4Block8GruppenAktionsplanung.pruefe()
```

Erwartung:

- `My_Ranger2` steht in `entscheidung.teilnehmerBewertungen` auf `veraltet`,
- `My_Ranger2` ist nicht mehr in `aktiveTeilnehmerKennungen`,
- kein `plan.schritte`-Eintrag hat `ausfuehrenderTeilnehmerKennung: 'My_Ranger2'`.

Danach auf `My_Ranger2` wieder starten:

```js
await V4Block8Lebensnachweis.starte()
```

Nach mindestens einem frischen Heartbeat auf `My_Ranger1` erneut pruefen. `My_Ranger2` soll wieder `aktiv` sein und seine faehigkeitsbasierte Aufgabe wieder erhalten koennen.

## Live-Abnahme am 17.09.2026

Der echte Zwei-Ranger-Schatten wurde mit `My_Ranger1` und `My_Ranger2` auf `EU I`, Karte/Instanz `main` durchlaufen und hat die erwartete Kette bestaetigt.

### Phase A – beide Teilnehmer aktiv

Beide Charaktere meldeten `gefahrenStufe: 'sicher'`, waren aktiv und sahen dieselbe Aufgabenverteilung:

- `schaden: 'My_Ranger1'`,
- `unterstuetzung: 'My_Ranger2'`.

Da beide zu diesem Zeitpunkt `zielKennung: null` meldeten, entstand kein Schadensschritt. Der gemeinsame semantische Plan bestand auf beiden Seiten aus:

```text
gruppe_unterstuetzen|My_Ranger2|gruppe|-|normal|500
```

`My_Ranger1` hatte folgerichtig keine eigenen Schritte; `My_Ranger2` erhielt den Unterstuetzungsschritt. In allen Auswertungen blieben `aktionsAnfragenErzeugt: false` und `echteSpielaktionenAusgefuehrt: false`.

### Phase B – Teilnehmer wird stale

Nach dem Stoppen des Lebensnachweises auf `My_Ranger2` wurde auf `My_Ranger1` ein Alter von `19101 ms` beobachtet. `My_Ranger2` wechselte auf `status: 'veraltet'`, wurde aus `aktiveTeilnehmerKennungen` entfernt und verlor die Unterstuetzungsaufgabe.

Der nachgelagerte Aktionsplan wurde korrekt leer:

```text
status: leer
schritte: []
planSignatur: []
```

Damit ist live nachgewiesen, dass ein stale Teilnehmer nicht nur aus der Koordination, sondern auch aus der Gruppenaktionsplanung entfernt wird.

### Phase C – Reconnect

Nach erneutem Start des Lebensnachweises auf `My_Ranger2` wurde auf `My_Ranger1` wieder ein frischer Heartbeat mit `990 ms` Alter beobachtet. `My_Ranger2` wechselte zurueck auf `aktiv`, die Aufgabe `unterstuetzung` wurde wieder `My_Ranger2` zugewiesen und der gemeinsame Gruppenplan stellte den Unterstuetzungsschritt wieder her:

```text
gruppe_unterstuetzen|My_Ranger2|gruppe|-|normal|500
```

Der komplette Live-Zyklus ist damit bestaetigt:

`aktiv -> stale -> Aufgabe und Plan-Schritt entfernt -> reconnect -> aktiv -> Aufgabe und Plan-Schritt wiederhergestellt`

Zu keinem Zeitpunkt wurden `AktionsAnfrage` oder echte Adventure-Land-Spielaktionen erzeugt.

## Safety-Nachweis

Wenn die gemeinsame Block-7-Sicherheitslage `gefaehrlich` oder `kritisch` ist, muss der Plan `betriebsArt: 'sicherheit'` haben. Dann duerfen nur aktuell begruendete:

- `mitglied_heilen`,
- `mitglied_schuetzen`

entstehen. `ziel_aggro_binden`, `gruppe_unterstuetzen` und `gemeinsames_ziel_bearbeiten` sind im Sicherheitsbetrieb unterdrueckt. Bei unbekannter Sicherheit bleibt die Koordination und damit der Aktionsplan fail-safe blockiert.

## Automatisierte Abnahme

`block8-gruppenaktionsplanung-schatten.test.mjs` prueft:

1. Browserkern gegen die produktive Planung fuer Normal, Safety, Blockierung und Stale,
2. identischen gemeinsamen Plan aus demselben Snapshot fuer beide Ranger,
3. unterschiedliche `eigeneSchritte` pro Charakter,
4. die echte Schattenkette Heartbeat -> Koordination -> Planung,
5. Stale -> Aufgabenentzug -> Reconnect,
6. Safety-vor-Zielarbeit,
7. keine `AktionsAnfrage`,
8. keine Spielaktion.

## Naechster Schritt

Der reale Zwei-Ranger-Nachweis ist bestanden. Die naechste getrennte Stufe ist eine weiterhin standardmaessig gesperrte Uebersetzung einzelner freigegebener Gruppenplan-Schritte in `AktionsAnfrage` fuer die zentrale `AktionsSteuerung`. Vor jeder spaeteren echten Ausfuehrung bleiben Sicherheits-, Ressourcen- und Zielpruefungen zentral verbindlich.
