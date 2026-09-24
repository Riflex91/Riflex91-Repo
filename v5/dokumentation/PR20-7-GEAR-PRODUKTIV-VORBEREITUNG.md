# PR20.7 – Gear-Autonomie: belegter Slot / Swap Foundation

**Stand:** 2026-09-24  
**Status:** `WEAPON_OFFHAND_READ_ONLY_MANIFEST_CUTOVER_BEREIT_EVIDENCE_OFFEN`

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

## Produktiver belegter Nicht-Waffen-Slot – BESTANDEN

Der produktive Merchant-only One-Shot-Lauf
`pr20-7-gear-occupied-slot-live-5m` ist real terminal `BESTANDEN`.

Beobachtet:

- Recipient: `My_Merchant`, Server `EU:I`;
- Slot: `helmet`;
- Kandidat: Inventarindex 7, `wcap +4`;
- vorheriges Slot-Item: `partyhat +5`;
- Durable Intent mit Readback vor der moeglichen Send-Grenze;
- exakt eine One-Shot-Authority, einmal verbraucht;
- Equipment-/Inventory-Fencing aktiv;
- Reconciliation `COMMITTED`, Settlement `BESTAETIGT`;
- genau `gameplayWrites=1` und `publicFunctionCalls=1`;
- `rawWriteCalls=0`;
- `sameIntentRetry=false`;
- `startCalls=0`, `disconnectCalls=0`, `farmerWorkersInstalled=0`;
- `performance_trick()` aktiv und mit `HOWLER_PLAYING_TRUE` verifiziert;
- 60 stabile Postcondition-Samples ueber 300552 ms;
- `normalRuntimeAllowed=false`.

Die exakte Evidence liegt unter
`roadmap/pr20-7-gear-occupied-slot-live-5m-evidence.json`.

## Waffen-/Offhand-Foundation – NO-WRITE

Die naechste separate PR20.7-Mutationsklasse modelliert ausschliesslich
explizite `mainhand`-/`offhand`-Ziele. Die offizielle Serverlogik
`can_equip_item` wird dabei enger nachgebildet:

- kein generischer `weapon`-Auto-Slot; der Zielslot muss explizit sein;
- Kandidaten-WType muss in den gepinnten Klassenregeln fuer
  `mainhand`, `doublehand` oder `offhand` erlaubt sein;
- Item-`class`-Beschraenkung und erforderliches Level werden fail-closed
  geprueft;
- ein Doublehand-Kandidat wird blockiert, solange `offhand` belegt ist;
- ein Offhand-Kandidat wird blockiert, wenn die Gegenhand eine
  Doublehand-Waffe ist;
- die Gegenhand wird als eigener Fingerprint gepinnt und muss beim
  Settlement unveraendert bleiben;
- es gibt **kein automatisches unequip** und keinen mehrstufigen
  Waffenwechsel;
- belegte und leere Zielslots koennen als NO-WRITE-Plan modelliert werden;
- Settlement bindet Zielslot, Ursprungsindex, Gegenhand, Restinventar und
  Restequipment;
- UNKNOWN/TEILWEISE erlaubt keinen Same-Intent-Retry.

Foundation:
`grundlage/quelle/equipment/pr20-7-weapon-offhand-vorbereitung.ts`.

Maschinenlesbarer Vertrag:
`grundlage/vertraege/runtime/pr20-7-weapon-offhand-production-preparation.json`.

Diese Stufe besitzt weiterhin `gameplayAutoritaet=false`,
`rawWriteAutoritaet=false` und genau **0 Gameplay-Writes**.

## Waffen-/Offhand realer Read-only-Preflight – PAKET BEREIT

Der naechste reale Schritt ist weiterhin **NO-WRITE**. Das Merchant-only
Autonomous-Paket
`werkzeuge/pr20-7-weapon-offhand-read-only-autonomous.js` beobachtet:

- explizit nur `mainhand` oder `offhand`;
- die aktuellen `G.classes[ctype].mainhand`, `doublehand` und
  `offhand`-Regeln;
- Item-`class`- und Level-Beschraenkungen;
- Kandidatenindex und Kandidatenfingerprint;
- bisherigen Zielslot, falls belegt;
- die komplette Gegenhand als eigenen Fingerprint;
- das gesamte uebrige Equipment und Restinventar;
- zwei stabile Beobachtungen mit 350 ms Abstand;
- `performance_trick()` mit `HOWLER_PLAYING_TRUE`.

Ein Doublehand-Kandidat ist nur zulässig, wenn `offhand` leer ist.
Ein Offhand-Kandidat wird bei einer Doublehand-Hauptwaffe blockiert.
Es gibt keinen generischen `weapon`-Auto-Slot und **kein automatisches
unequip**.

Das Paket besitzt keine Worker-Konfiguration und keine Farmer-Verteilung.
Die Sicherheitsgrenze bleibt:

- `gameplayWrites=0`;
- `publicFunctionCalls=0`;
- `rawWriteCalls=0`;
- `authorityIssued=false`;
- `durableIntentCreated=false`;
- `sameIntentRetry=false`;
- `normalRuntimeAllowed=false`.

Testplan:
`roadmap/pr20-7-weapon-offhand-read-only-preflight-test-plan.json`.

Evidence:
`roadmap/pr20-7-weapon-offhand-read-only-preflight-evidence.json`.

Die Evidence bleibt bis zu einem real terminalen Lauf explizit `OFFEN`.
Das Paket ist auf Source-Commit `df4f23a4f633abaa62e817da0eb06ea1db3d94dd`
und SHA-256 `69e3bff8fa7d33c4f4038aff4635d89eebc0c397a2af77ad05486abbac04f562`
gepinnt; der Manifest-Cutover ist vorbereitet.

## Naechstes Gate

Der belegte Nicht-Waffen-Slot ist damit als eigene Mutationsklasse
produktiv ratifiziert. PR20.7 ist noch nicht abgeschlossen.

Die Waffen-/Offhand-Foundation ist NO-WRITE vorhanden und das reale
read-only Autonomous-Paket ist immutable gepinnt und der Manifest-Cutover
ist vorbereitet. Als naechstes wird der Cutover gemergt und der reale
Browserlauf ausgewertet. Erst nach ratifizierter Read-only-Evidence folgen
One-Shot-/Fencing-/Durable-Intent-Shadow und ein separater produktiver
5-Minuten-Nachweis.

Danach folgt die separate Gear-Allokation an Farmer.

UNKNOWN, TEILWEISE oder Restart erlauben weiterhin keinen Same-Intent-Resend;
zuerst ist immer Reobserve/Reconcile erforderlich.
