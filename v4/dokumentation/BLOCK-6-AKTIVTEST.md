# Block 6 – Begrenzter Ranger-Aktivtest

## Zweck

Nach einem erfolgreichen 30-Minuten-Ranger-Schattenlauf darf Block 6 auf genau einem Ranger zeitlich begrenzt mit echten Adventure-Land-Aktionen geprueft werden.

Der Aktivtest ist kein 24/7-Betrieb und keine allgemeine Freigabe fuer andere Klassen oder MonsterArten. Er ist ein kontrollierter Browser-Smoke-Test fuer die bereits vorhandenen Block-6-Aktionen.

## Sicherheitsgrenzen

`werkzeuge/block6-aktivtest-ranger.js` erzwingt:

- Charakterklasse `ranger`,
- ausschliesslich MonsterArt `goo`,
- ausdrueckliche Startoption `aktivFreigegeben: true`,
- 10 Minuten Standarddauer,
- maximal 15 Minuten Laufzeit,
- mindestens einen freien Inventarplatz beim Start,
- mindestens ein sichtbares lebendes `goo` beim Start,
- automatischen Sicherheitsstopp bei Tod, vollem Inventar, Blockierung, `FARM_STILLSTAND`, verlorenen Planungsschritten oder Ausfuehrungsfehlern.

Der Aktivtest startet den read-only `V4Block6SchattenRanger` als Planer. Eine echte Spielaktion darf nur aus einer neuen Schatten-Planungsentscheidung entstehen und muss zusaetzlich die lokale Browser-Aktionssteuerung passieren. Es werden nur die fuenf Block-6-Aktionsnamen akzeptiert:

- `FARM_BEWEGEN`,
- `FARM_ANGREIFEN`,
- `FARM_LEBEN_WIEDERHERSTELLEN`,
- `FARM_MANA_WIEDERHERSTELLEN`,
- `FARM_BEUTE_AUFNEHMEN`.

Andere Bot-/Farmcodes duerfen waehrend des Tests auf diesem Ranger nicht parallel laufen.

## Dateien laden

In dieser Reihenfolge im Adventure-Land-Codekontext laden:

1. `v4/werkzeuge/adventure-land-testkonsole.js`
2. `v4/werkzeuge/block6-schattenlauf-ranger.js`
3. `v4/werkzeuge/block6-kompaktbericht.js`
4. `v4/werkzeuge/block6-aktivtest-ranger.js`

Der Kompaktbericht erweitert die bestehende Schatten-API um:

```js
V4Block6SchattenRanger.kompaktErgebnis()
```

Damit werden die grossen `ereignisse`- und `zielZaehler`-Felder fuer die normale Abnahmeausgabe weggelassen.

## Start – 10 Minuten

Vorher sicherstellen:

- Ranger steht in einem normalen `goo`-Gebiet,
- kein anderer Botcode steuert den Ranger,
- Charakter lebt,
- Inventar hat freien Platz.

Dann bewusst starten:

```js
V4Block6AktivRanger.starte({
  monsterArten: ["goo"],
  aktivFreigegeben: true
})
```

## Optional – 15 Minuten

15 Minuten sind die harte Obergrenze:

```js
V4Block6AktivRanger.starte({
  monsterArten: ["goo"],
  dauerMillisekunden: 15 * 60 * 1000,
  aktivFreigegeben: true
})
```

Eine groessere Dauer wird abgewiesen.

## Kontrolle und Stopp

Status:

```js
V4Block6AktivRanger.status()
```

Sofortiger kontrollierter Stopp:

```js
V4Block6AktivRanger.stoppe("Manueller Sicherheitsstopp")
```

Der Aktivtest stoppt dabei auch den von ihm gestarteten Schattenplaner.

## Ergebnis

Nach Ende oder Stopp:

```js
V4Block6AktivRanger.kompaktErgebnis()
```

Der Bericht enthaelt insbesondere:

- Status und Endgrund,
- ausgefuehrte Aktionszaehler,
- uebersprungene Aktionen, z. B. wegen Angriffscooldown oder verschwundenem Ziel,
- Fehler,
- Start-/Endzustand,
- XP- und Gold-Delta,
- die angewendeten Sicherheitsgrenzen.

## Abnahmekriterien

Der begrenzte Aktivtest gilt als technisch sauber, wenn:

- keine ungefangenen Fehler auftreten,
- kein Sicherheitsstopp wegen Architektur-/Datenfehlern erfolgt,
- der Ranger nur `goo` als Farmziel verwendet,
- Bewegung, Angriff und Loot plausibel auf die Planungsentscheidungen folgen,
- HP/MP-Wiederherstellung nur unter den konfigurierten Schwellen auftritt,
- der Test nach der vorgesehenen Zeit selbst beendet,
- XP-/Gold- und Zustandsdaten im Abschlussbericht plausibel sind.

Ein erfolgreicher 10- oder 15-Minuten-Test ersetzt keinen spaeteren Langzeit-Aktivtest fuer die 24/7-Abnahme.
