# PR20.7 – Gear-Autonomie: belegter Slot / Swap Foundation

**Stand:** 2026-09-23  
**Status:** `OCCUPIED_SLOT_ONE_SHOT_AUTHORITY_FENCING_BEREIT_NO_WRITE`

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

Diese Preflight-Implementierung blieb bis zur realen exact-head Evidence
nicht ratifiziert. Die nachfolgend dokumentierte reale Evidence hat
ausschliesslich diesen read-only Schritt ratifiziert.

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

## One-Shot-Authority und Fencing – NO-WRITE vorbereitet

Auf Basis der bestandenen realen Evidence besitzt PR20.7 jetzt eine eigene,
vom PR20.1-Leer-Slot-Pfad getrennte Swap-Authority:

- `grundlage/quelle/equipment/pr20-7-gear-swap-einmal-authority.ts`;
- `grundlage/adapter/persistenz/node-pr20-7-gear-swap-einmal-authority-protokoll.mjs`;
- `grundlage/vertraege/runtime/pr20-7-gear-swap-one-shot-authority.json`.

Die Authority ist maximal 1500 ms gueltig, exakt einmal verwendbar und bindet
Account, Recipient-Character, Session, Server, sicheren belegten Slot,
Kandidatenindex, Kandidaten-/Altitem-Fingerprint, Rest-Inventar,
Rest-Equipment, Prestate und Evidence-Fingerprint.

Vor dem Authority-Objekt wird der komplette Scope inklusive der beiden
Fence-Epochen exklusiv durable gespeichert. Die Ressourcen

- `character:<recipient>:equipment`;
- `character:<recipient>:inventory`

werden als kurzlebige `LANGLEBIG`-Fences beansprucht. Ein konkurrierender
Ablauf wird blockiert. Nach Lease-Ablauf wechseln die Ressourcen in
`ABGELAUFEN_ABGLEICH`; eine stille Wiederverwendung ist verboten und
Reconciliation erforderlich.

Ein Restart rekonstruiert aus dem Audit **keine** RAM-Authority. PR20.1 und
dessen `ProduktiveEquipEinmalAuthority` bleiben unveraendert.

Dieser Schritt besitzt weiterhin:

- keine produktive Registrierung;
- kein Host-Exposure;
- kein Executor-Wiring;
- keinen Adapter-Send;
- `gameplayAutoritaet=false`;
- `rawWriteAutoritaet=false`;
- `swapWriteRatification=false`;
- `normalRuntimeAllowed=false`.

## Naechstes Gate

Vor einem echten belegten-Slot-Write sind nach read-only Preflight sowie
Authority/Fencing weiterhin separat erforderlich:

- durable Mutation-Intent fuer den exakten Swap vor moeglicher Send-Grenze;
- post-send Reobserve/Reconcile ohne Blind-Retry;
- Real-Browser-Shadow-Evidence fuer die komplette Authority/Fence/Reconcile-Kette;
- gruene Exact-Head-CI.

Waffen/Offhand bleiben auch danach ein eigenes Gate.
