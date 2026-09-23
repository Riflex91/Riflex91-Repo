# PR20.7 – Gear-Autonomie: belegter Slot / Swap Foundation

**Stand:** 2026-09-23  
**Status:** `READ_ONLY_BROWSER_PREFLIGHT_IMPLEMENTIERT_NO_WRITE`

## Zweck

PR20.7 darf nach dem bestandenen PR20.6-Gate vorbereitet werden, erhaelt
dadurch aber keine neue Gameplay-Authority. Dieser Schritt modelliert nur
den bislang absichtlich gesperrten Fall eines belegten, nicht-Waffen-
Equipment-Slots.

Der bestehende PR20.1-Pfad fuer leere Slots bleibt unveraendert.

## Gepinnte Adventure-Land-Semantik

Der verifizierte Server-Snapshot
`ddcf7222c3264f1404382e1ff5dea8e73f6cb4b4` fuehrt normales
`equip` als direkten Austausch aus:

- das bisherige Slot-Item wird als `existing` gelesen;
- das Kandidaten-Item vom Inventarindex wird in den Slot gesetzt;
- `existing` wird an exakt denselben Inventarindex geschrieben.

Ein `existing.b === true` wird serverseitig stattdessen zu `null`.
PR20.7 blockiert diesen Sonderfall deshalb komplett.

## Dieser Schritt erlaubt

Read-only Planung, Settlement-Klassifikation und einen exact-head gepinnten
Recipient-Browser-Preflight fuer belegte Slots:

`cape`, `belt`, `amulet`, `orb`, `helmet`, `gloves`,
`shoes`, `pants`, `chest`.

Ein spaeteres Commit darf nur bestaetigt werden, wenn ein frischer,
session-/account-/servergebundener Snapshot gleichzeitig zeigt:

1. Kandidaten-Fingerprint im Zielslot;
2. Fingerprint des vorherigen Slot-Items am urspruenglichen Kandidatenindex;
3. unveraenderten Rest-Inventar-Fingerprint;
4. unveraenderten Rest-Equipment-Fingerprint.

## Weiter gesperrt

- jeder echte Swap-Write;
- `mainhand` und `offhand`;
- leere Slots ueber diesen neuen Pfad;
- virtuelle / `b=true`-Altobjekte;
- generisches `equip` oder `unequip`;
- Same-Intent-Retry nach moeglichem Send;
- automatische neue Intents nach UNKNOWN/TEILWEISE.

Der Foundation-Code besitzt explizit
`ausfuehrungsAutoritaet=false`,
`gameplayAutoritaet=false`,
`rawWriteAutoritaet=false` und
`swapWriteRatification=false`.

## Read-only Browser-Preflight

Der neue Preflight besteht aus:

- `werkzeuge/pr20-7-gear-swap-produktions-browser.mjs`;
- `werkzeuge/pr20-7-gear-swap-produktions-preflight.mjs`;
- `grundlage/tests/pr20-gear-swap-browser-preflight.test.mjs`.

Er bindet einen expliziten Adventure-Land-Character an einen Same-Origin-CDP-
Kontext, verlangt den lokalen exakten Git-HEAD, aktiviert und verifiziert
`performance_trick()`, beobachtet Recipient und Kandidat zweimal stabil und
akzeptiert nur einen belegten sicheren Nicht-Waffen-Slot. Kandidat und
vorheriges Slot-Item muessen physisch, unlocked, nicht `b=true` und anhand
ihrer Beobachtungsfingerprints unterscheidbar sein.

`performance_trick()` ist dabei eine Browser-Performance-Voraussetzung und
kein Gameplay-Write. Der Preflight selbst ruft keine Equip-/Unequip-/Socket-
oder sonstige Gameplay-Mutation auf. Er erzeugt weder Authority noch Durable
Intent und trifft keine Gear-Progressionsentscheidung.

Bis reale exact-head Browser-Evidence vorliegt, bleibt dieser Schritt
**implementiert, aber nicht live ratifiziert**.

## Naechstes Gate

Vor einem echten belegten-Slot-Write sind separat erforderlich:

- reale exact-head Evidence aus dem read-only Browser-Preflight am Recipient;
- kurzlebige, exakt gebundene One-Shot-Authority;
- Equipment-/Inventory-Fencing am Recipient;
- durable Intent vor moeglicher Send-Grenze;
- post-send Reobserve/Reconcile ohne Blind-Retry;
- Real-Browser-Shadow-Evidence;
- gruene Exact-Head-CI.

Waffen/Offhand bleiben auch danach ein eigenes Gate.
