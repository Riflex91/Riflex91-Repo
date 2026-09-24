# PR20.7 – Gear-Autonomie: belegter Slot / Swap Foundation

**Stand:** 2026-09-23  
**Status:** `REAL_SHADOW_BESTANDEN_NO_WRITE`

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

## Autonomer realer No-Write-Preflight

Die reale Evidence wird ueber den bereits vorhandenen V5-Test-Deploy-Kanal
ausgefuehrt. Das Paket `werkzeuge/pr20-7-gear-read-only-autonomous.js` ist
Merchant-only, auf einen exakten Source-Commit und SHA-256 gepinnt und besitzt
keine Worker-Konfiguration. Die Windows Bridge muss deshalb weder Farmer
starten noch disconnecten noch Worker installieren.

Der Test erwartet explizit:

- `startCalls=0`;
- `disconnectCalls=0`;
- `farmerWorkersInstalled=0`;
- `gameplayWrites=0`;
- `publicFunctionCalls=0`;
- `rawWriteCalls=0`;
- keine Authority und keinen Durable Intent.

Testplan:
`roadmap/pr20-7-gear-read-only-preflight-test-plan.json`.

Evidence:
`roadmap/pr20-7-gear-read-only-preflight-evidence.json`.

Der Evidence-Eintrag bleibt bis zu einem real beobachteten terminalen PASS
explizit `OFFEN`; der vorbereitete Deploy allein ratifiziert nichts.

## Reale Evidence – BESTANDEN

Der reale Browserlauf wurde am 2026-09-23 terminal als `BESTANDEN`
beobachtet und separat ratifiziert.

Beobachtet auf `My_Merchant`:

- Server `EU:I`, Map `main`;
- belegter sicherer Slot `helmet`;
- Kandidat am Inventarindex 7: `wcap +4`;
- vorheriges Slot-Item: `partyhat +5`;
- Kandidat und Altitem physisch, unlocked und nicht `b=true`;
- stabile Doppelbeobachtung mit 350 ms Abstand;
- `performance_trick()`: aktiv, `playing=true`,
  Verifikation `HOWLER_PLAYING_TRUE`.

Sicherheitszaehler des realen Laufs:

- `gameplayWrites=0`;
- `publicFunctionCalls=0`;
- `rawWriteCalls=0`;
- `startCalls=0`;
- `disconnectCalls=0`;
- `farmerWorkersInstalled=0`;
- `authorityIssued=false`;
- `durableIntentCreated=false`;
- `swapWriteRatification=false`;
- `sameIntentRetry=false`;
- `normalRuntimeAllowed=false`.

Damit ist ausschliesslich der reale **read-only Preflight** bestanden.
Es wurde kein Gear-Swap ausgefuehrt.

## One-Shot, Durable Intent und Reconcile – NO-WRITE

Nach dem read-only Preflight wurden die fuer einen belegten Nicht-Waffen-Slot
erforderlichen Sicherheitsbausteine separat implementiert:

- maximal eine Verwendung und maximal 1500 ms TTL;
- exakte Bindung an Recipient-Session, Roster-Epoche/-Fingerprint, Server,
  Slot, Kandidatenindex und Prestate;
- exklusive Equipment- und Inventory-Fencing-Claims;
- Fence-/Binding-Drift widerruft fail-closed;
- Durable Intent muss vor jeder moeglichen Mutation bestaetigt gespeichert sein;
- post-send Reobserve/Reconcile klassifiziert ohne Same-Intent-Retry;
- Waffen und Offhand bleiben ausgeschlossen.

Diese Foundations erteilen fuer sich weiterhin keine Gameplay-Authority.

## Reale Shadow-Evidence – BESTANDEN

Der Merchant-only Shadow
`pr20-7-gear-occupied-slot-shadow-no-write` wurde real terminal
`BESTANDEN` beobachtet und ratifiziert.

Beobachtet wurden derselbe sichere `helmet`-Kandidat, ein erfolgreicher
Shadow-Durable-Readback, vorbereitete Equipment-/Inventory-Fencing-Claims und
eine stabile Post-Intent-Reobservation. Die Send-Grenze blieb
`NICHT_GESENDET`; die Reconciliation war `NOT_APPLIED`.

Sicherheitswerte:

- `gameplayWrites=0`;
- `publicFunctionCalls=0`;
- `rawWriteCalls=0`;
- `startCalls=0`;
- `disconnectCalls=0`;
- `farmerWorkersInstalled=0`;
- `authorityIssued=false`;
- `swapWriteRatification=false`;
- `sameIntentRetry=false`;
- `normalRuntimeAllowed=false`.

Evidence:
`roadmap/pr20-7-gear-shadow-no-write-evidence.json`.

## Naechstes Gate

Nach dem bestandenen realen Shadow ist als naechster Schritt ein enger
produktiver One-Shot-Swap-Runner vorzubereiten. Er muss dieselben
One-Shot-/Fencing-/Durable-Intent-/Reconcile-Grenzen erzwingen und darf erst
nach eigener gruener Exact-Head-CI exakt einen sicheren belegten
Nicht-Waffen-Slot-Swap ausfuehren.

Danach ist fuer diese neue Mutationsklasse eine reale 5-Minuten-
Funktionsevidence erforderlich.

Waffen/Offhand sowie Farmer-Gear-Allokation bleiben separate spaetere Gates.
