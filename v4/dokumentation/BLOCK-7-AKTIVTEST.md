# Block 7 – kontrollierter Aktivtest

## Zweck

Der Live-Test ist der letzte kleine Spielclient-Nachweis fuer Block 7. Er ersetzt **keine** Produktionslogik und schaltet den Bot nicht allgemein aktiv. Die vollstaendige Fehlereinspritzung gegen die echten V4-Produktionsklassen liegt in `laufzeit/tests/block7-abnahme.test.mjs`.

Diese automatisierte Abnahmesuite prueft gemeinsam:

- kritische HP unter Beschuss -> `KAMPF_RUECKZUG`,
- Notfall-Rueckzug verdraengt eine laufende normale Farmbewegung ueber die zentrale `AktionsSteuerung`,
- zu kleiner Abstand -> `KAMPF_ABSTAND_HERSTELLEN`,
- niedriges Mana -> Rueckzug,
- fehlendes Mana -> fail-safe Blockierung,
- gestartete Sicherheitsbewegung ohne Positionsfortschritt -> `KAMPF_RUECKZUG_BLOCKIERT`,
- Ziel ausserhalb der aktuellen Reichweite -> Abbruch vor `attack(...)`, wobei `attack` nicht erreicht wird,
- aktive Sicherheitsbewegung bleibt ohne explizite Freigabe gesperrt.

## Grenze des Live-Smoke-Tests

`V4Block7Aktivtest` darf als einzige echte Spielaktion **genau einen `move`-Aufruf pro Freigabe** ausloesen. Es besitzt keinen Pfad zu Angriff, Skill, Heilung, Mana-Wiederherstellung, Loot oder `smart_move`.

Weitere Grenzen:

- standardmaessig gesperrt,
- Ranger-only,
- Charakter muss leben und stillstehen,
- ein sichtbares Monster muss den Ranger aktuell angreifen,
- ohne bekannte Angreiferposition wird keine Richtung erfunden,
- Testbewegung geht vom Schwerpunkt der aktuellen Angreifer weg,
- maximal 20 Einheiten pro Freigabe,
- Freigabe gilt hoechstens 120 Sekunden,
- nach dem einen `move` wird automatisch wieder gesperrt,
- innerhalb von 5 Sekunden wird beobachtet, ob sich die Position mindestens 1 Einheit veraendert hat.

Der Live-Test senkt keine HP kuenstlich und startet keinen Kampf. Fuer Low-HP-/Low-Mana-/Missing-Data-Fault-Injection ist ausschliesslich die automatisierte Abnahmesuite zustaendig.

## Vorbereitung in Adventure Land

Im Ranger-Codekontext laden:

1. `v4/werkzeuge/adventure-land-testkonsole.js`
2. `v4/werkzeuge/block7-kontrollierter-aktivtest.js`

Danach Status pruefen:

```js
V4Block7Aktivtest.status()
```

Der Test soll zunaechst `freigegeben: false` melden.

## Read-only-Vorschau

Einen `goo` den Ranger angreifen lassen. Volle HP sind ausreichend; es ist nicht notwendig, den Charakter absichtlich in Lebensgefahr zu bringen.

Dann zuerst nur die geplante kurze Bewegung ansehen:

```js
V4Block7Aktivtest.vorschau("abstand", 8)
```

Die Vorschau fuehrt keine Spielaktion aus. Ohne aktuellen Angreifer muss sie blockieren.

## Einmalige aktive Freigabe

Exakte Freigabe:

```js
V4Block7Aktivtest.freigeben("BLOCK7-AKTIVTEST-FREIGEBEN")
```

Danach genau eine kleine Abstandbewegung starten:

```js
await V4Block7Aktivtest.starte("abstand", 8)
```

Erwartet wird:

- `echteSpielaktionen.move: 1`,
- `echteSpielaktionen.sonstige: 0`,
- `automatischWiederGesperrt: true`,
- im Normalfall `status: "bestanden"` und `bewegungBeobachtet: true`.

Wenn die Karte oder Kollisionsgeometrie den kurzen Schritt verhindert, darf `status: "blockiert_oder_unbeobachtet"` erscheinen. Das Werkzeug versucht **keinen zweiten move**.

## Optionaler Rueckzug-Smoke-Test

Wenn weiterhin ein Monster den Ranger angreift, kann nach einer neuen expliziten Freigabe derselbe Ausfuehrungspfad mit dem Rueckzug-Label geprueft werden:

```js
V4Block7Aktivtest.freigeben("BLOCK7-AKTIVTEST-FREIGEBEN")
await V4Block7Aktivtest.starte("rueckzug", 12)
```

Auch dieser Aufruf darf maximal 20 Einheiten und genau einen `move` ausloesen.

## Ergebnis

Der letzte Live-Bericht ist abrufbar mit:

```js
V4Block7Aktivtest.ergebnis()
```

Manuelles sofortiges Sperren:

```js
V4Block7Aktivtest.sperren()
```

## Block-7-Abschluss

Der kontrollierte Live-Smoke-Test wird zusammen mit folgenden Nachweisen bewertet:

1. erfolgreicher 10-Minuten-Schattenlauf mit 601/601 Schritten und ausreichender Sampling-Qualitaet,
2. bekannte reale Angriffsbereitschaft aus Adventure Lands Cooldown-API,
3. gruene integrierte Produktionscode-Abnahmesuite `block7-abnahme.test.mjs`,
4. erfolgreicher one-shot Live-Smoke-Test fuer die aktive Sicherheitsbewegungsgrenze.

Erst diese Kombination bildet den Block-7-Abschlussnachweis; der Live-Smoke-Test allein reicht nicht aus.
