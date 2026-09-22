# PR20.3 – Markt/Kaufen/Verkaufen: NO-WRITE-Vorbereitung

**Status:** BUY-GOLD 7/7 + NPC-SELL 7/7 REAL BESTANDEN / EXIT-GATE BEREIT  
**Stand:** 2026-09-22  
**Voraussetzung:** PR20.2 breite Bankfreigabe erteilt; PR20.3 muss jetzt seine eigenen Safety-/Live-Gates bestehen  
**Basis-main:** `0c7bffa935d7055d074fa4a3b93d11c861515153`

## Zweck

PR20.2 ist fuer die Roadmap breit freigegeben. PR20.3 darf daher jetzt seine eigene Testkette starten. Diese Freigabe erteilt **noch keine Gameplay-Authority** und veraendert weder die produktive Komposition noch bestehende Bank-Local-Gates.

Nicht enthalten sind:

- keine produktive Buy-/Sell-/Trade-Mutations-Capability;
- kein Market-Write-Adapter;
- kein Live-Runner;
- keine produktive Authority;
- kein direkter `buy`, `sell`, `trade_buy` oder `trade_sell`-Aufruf;
- kein Gameplay-Write.

Maschinenlesbarer Vertrag:

`grundlage/vertraege/runtime/market-production-preparation.json`.

## Erster kontrollierter Kandidat

Als erster PR20.3-Mutationspfad ist jetzt **`buy_with_gold(item, 1)`**
ratifiziert. Bewusst wird nicht das generische `buy()` verwendet, weil dieses
bei geeigneten Cash-Items automatisch auf `buy_with_shells` routen kann.

Der erste Pfad ist deshalb:

- exakt Menge 1;
- explizite Goldroute;
- `AL-ACTION-BUY-WITH-GOLD` / `AL-RECOVERY-BUY-WITH-GOLD` /
  `AL-VERIFIER-BUY-WITH-GOLD`;
- FIFO-Deferred-Kanal `buy`;
- kein Same-Intent-Retry nach moeglichem Send;
- COMMIT nur bei gemeinsamem exaktem Gold- und Itemmengen-Delta;
- in diesem Schritt 0 Gameplay-Writes und keine produktive Authority.

Vertrag:
`grundlage/vertraege/runtime/market-buy-gold-production-candidate.json`

Settlement-Core:
`grundlage/quelle/merchant/market-buy-gold-settlement.ts`

## Vorhandene V5-Grundlagen

Die spaetere Implementierung kann bereits auf Folgendem aufbauen:

- R9 bindet Buy/Sell/Trade-Buy/Trade-Sell an Action-, Recovery- und Verifier-Vertraege;
- alle vier vorgesehenen Mutationen sind `NON_IDEMPOTENT`;
- nach moeglichem Send gilt `RECONCILE_NO_BLIND_RETRY`;
- `GoldBudgetLedger` reserviert Gold unter Beibehaltung einer Safety-Reserve;
- NPC-Verkauf besitzt eine eigene konservative Verkaufs-Sicherheitsbewertung;
- geschuetzte Quest-/Exchange-/Event-/Cash-/Soulbound-/Upgrade-/Compound-Items werden beim NPC-Verkauf blockiert;
- Item-Disposition und physische Itemidentitaet bleiben verpflichtend;
- Player-Market-Listings werden mit RID, Seite, Item, Level, Preis, Menge und Freshness gepinnt;
- `trade_sell` reproduziert die serverseitige Auswahl des ersten passenden Inventory-Kandidaten;
- nicht-fungible Mehrdeutigkeit wird dabei fail-closed blockiert.

## Vorbereiteter erster Mutationssatz

| Fachfunktion | Action | Recovery | Verifier |
|---|---|---|---|
| NPC kaufen | `AL-ACTION-BUY` | `AL-RECOVERY-BUY` | `AL-VERIFIER-BUY` |
| NPC verkaufen | `AL-ACTION-SELL` | `AL-RECOVERY-SELL` | `AL-VERIFIER-SELL` |
| Player Market kaufen | `AL-ACTION-TRADE-BUY` | `AL-RECOVERY-TRADE-BUY` | `AL-VERIFIER-TRADE-BUY` |
| Player Market verkaufen | `AL-ACTION-TRADE-SELL` | `AL-RECOVERY-TRADE-SELL` | `AL-VERIFIER-TRADE-SELL` |

`buy_secondhand` bleibt fuer den ersten Satz bewusst separat, weil dieser recovered-market-Pfad andere Correlation-/Request-ID-Eigenschaften besitzt.

## Besondere Safety-Regeln

### NPC Buy

Vor Send muessen Vendor-Erreichbarkeit, Inventory-Capacity, Currency und das zentrale Goldbudget inklusive Safety-Reserve frisch passen.

### NPC Sell

Verkauf wird nur zugelassen, wenn:

- die exakte physische Itemidentitaet frisch ist;
- die Disposition explizit `NPC_VERKAUF` lautet;
- Metadaten/Wert-Evidence frisch und widerspruchsfrei sind;
- kein Schutzsignal greift;
- das Item nicht gesperrt, blockiert oder speziell markiert ist;
- die Verkaufsrichtlinie den Gesamtwert explizit erlaubt.

### Player-Market Buy/Sell

Unmittelbar vor Send muessen RID und Listing erneut beobachtet und gepinnt werden. Dabei gilt:

- RID muss nichtleer sein;
- RID ist **kein** Idempotency-Key;
- RID ist **keine** Quantity-Version;
- Partial Fill kann dieselbe RID behalten;
- deshalb muessen Preis, Seite, Item, Level und Restmenge eigenstaendig frisch validiert werden;
- Drift => kein Send, sondern Replan.

### Trade-Sell und physische Itemauswahl

Der Server kann das erste passende Inventaritem waehlen. V5 muss deshalb die Serverauswahl unmittelbar vor Send reproduzieren.

Wenn mehrere server-eligible Items dieselben Name/Level-Kriterien erfuellen, aber nicht fungibel identisch sind, wird der Verkauf blockiert. Ein geplanter Index darf die tatsaechliche Serverauswahl nicht einfach voraussetzen.

## Recovery

Nach unklarem moeglichem Send wird **nicht** erneut gesendet. Stattdessen werden frisch beobachtet:

- Inventory und exakte physische Identitaeten/Mengen;
- Gold/Shells;
- Listing/Wishlist;
- Target/Map/Distance;
- bei `trade_sell` der server-selected Kandidat;
- bei `sell` Itemverlust und exakter Goldzuwachs.

Erst eine positive fachliche Postcondition erlaubt COMMIT. Widerspruch oder unzureichende Evidence bleibt fail-closed/operator-required.

## Bis zu den eigenen PR20.3-Gates weiterhin gesperrt

Trotz gestarteter Testkette bleiben bis zur eigenen PR20.3-Evidence verboten:

- produktive Market-/Sell-MUTIEREN-Capabilities;
- Market-One-Shot-/Dauer-Authority;
- Live-Write-Adapter;
- Live-Runner;
- Registrierung in der Produktionskomposition;
- echte Markt-/NPC-Writes.

## Naechste Arbeit nach den Vorstufen

1. einen einzigen ersten Market-Live-Kandidaten waehlen;
2. Capability + Single Owner ratifizieren;
3. genaue Authority/Admission bauen;
4. Transaktionsjournal + Current-Fence bauen;
5. read-only Preflight;
6. Fault-/RID-Drift-/Partial-Fill-/Restart-/UNKNOWN-Tests;
7. Shadow;
8. exakt einen kontrollierten realen Write.


## Ein Testpaket fuer die komplette erste Buy-Gold-Abnahme

Fuer den ersten PR20.3-Kandidaten existiert jetzt genau **ein**
selbstenthaltenes Ingame-Paket:

`werkzeuge/pr20-3-market-buy-gold-step-test-paket.js`

Nach dem einmaligen Merge dieses Pakets ist zwischen den Ingame-Schritten
**kein weiterer Merge erforderlich**. Der Fortschritt wird persistent unter

`AIO_V5_PR20_3_BUY_GOLD_STEP_TEST_V1`

gespeichert.

Die sieben Stufen sind:

1. Umgebung / Character-/Session-/Serverbindung read-only pruefen;
2. guenstigsten sicheren, aktuell erreichbaren Gold-NPC-Kandidaten stabil pinnen;
3. drei read-only Shadow-/Admission-Beobachtungen ohne Drift bestehen;
4. LIVE 1: exakt `buy_with_gold(item, 1)`;
5. nach dem ersten Commit eine komplett frische Re-Admission bestehen;
6. LIVE 2: erneut exakt ein frisch zugelassener `buy_with_gold(item, 1)`;
7. anschliessend 5 Minuten NO-WRITE-Stabilitaet.

Die Live-Bestaetigungen lauten exakt:

- `PR20.3-BUY-GOLD-LIVE-1`
- `PR20.3-BUY-GOLD-LIVE-2`

Das Live-Testbudget ist persistent auf **2** begrenzt und kann im GUI nicht
zurueckgesetzt werden. Ein moeglicher Send verbraucht den Versuch bereits vor
der Settlement-Entscheidung. Nach UNKNOWN/Drift/Timeout gilt weiterhin
`sameIntentRetry=false`.

Der Harness waehlt nur einen aktuell erreichbaren Nicht-Cash-/Nicht-P2W-
Goldkandidaten mit maximal 10.000 Gold Kosten und bewahrt mindestens
1.000.000 Gold Testreserve. Ein vorhandener nicht voller Stack wird
bevorzugt.

Erst nach Schritt 7 wird der Gesamtbericht einmalig in die Repo-Evidence
uebernommen.


## Naechster vorbereiteter Gesamttest: NPC Sell

Der Buy-Gold-Stufentest ist real 7/7 bestanden. Der direkt darauffolgende NPC-Sell-Test ist bereits komplett vorbereitet und jetzt das aktive Ingame-Gate.

Paket:

`werkzeuge/pr20-3-market-sell-step-test-paket.js`

Persistenter State:

`AIO_V5_PR20_3_SELL_STEP_TEST_V1`

Der Sell-Test startet **nicht**, solange
`AIO_V5_PR20_3_BUY_GOLD_STEP_TEST_V1` nicht Schritt 7 als
`BESTANDEN` und genau zwei `COMMITTED` Live-Settlements enthaelt.

Er verkauft ausschliesslich je eine Einheit aus den zwei durch den
Buy-Gold-Test bestaetigten Testkaeufen. Dadurch wird kein beliebiges
Alt-Inventar als Sell-Testobjekt verwendet.

Die sieben Stufen sind:

1. Buy-Gold-Evidence und Umgebung read-only pruefen;
2. exakten sicheren Sell-Slot fuer Buy-LIVE-1 stabil pinnen;
3. read-only Sell-Shadow/Admission;
4. LIVE 1: exakt `sell(index, 1)`;
5. Sell-Kandidat fuer Buy-LIVE-2 komplett frisch pinnen;
6. LIVE 2: exakt `sell(index, 1)`;
7. anschliessend 5 Minuten NO-WRITE-Stabilitaet.

Die Live-Bestaetigungen lauten:

- `PR20.3-SELL-LIVE-1`
- `PR20.3-SELL-LIVE-2`

Zwischen den sieben Stufen ist **kein Merge erforderlich**.

Fail-closed gilt insbesondere:

- nur normale stackbare Nicht-Cash-/Nicht-P2W-Items;
- keine Upgrade-/Compound-/Quest-/Exchange-/Event-/Soulbound-Definitionen;
- keine locked/blocked/gift/expiring/special/stat-modified physischen Items;
- NPC-Auszahlungswert wird unmittelbar vor Send read-only mit
  `item_value(item)` gepinnt;
- COMMIT nur bei exakt `-1` Gesamtitemmenge, exakt passendem Goldzuwachs
  und unveraendertem Restinventar;
- ein moeglicher Send verbraucht einen der zwei persistenten Live-Versuche;
- `sameIntentRetry=false`.


## Reale Buy-Gold-Evidence

Der erste PR20.3-Pfad `buy_with_gold(item, 1)` ist real Ingame
**BESTANDEN_REAL_INGAME_2_OF_2_PLUS_5M**.

Evidence:

`roadmap/pr20-3-market-buy-gold-evidence.json`

Ergebnis:

- alle sieben Stufen BESTANDEN;
- Kandidat `hpot0`, 20 Gold pro Testeinheit;
- LIVE 1: exakt -20 Gold / +1 Item, Settlement BESTAETIGT;
- LIVE 2: exakt -20 Gold / +1 Item, Settlement BESTAETIGT;
- Live-Testbudget damit 2/2 verbraucht; kein weiterer echter Buy-Gold-Test;
- anschliessender 5m-NO-WRITE-Lauf: 300002 ms, 21 Samples, 0 Sample-Gaps,
  0 Blocker-Samples und 0 weitere Gameplay-Writes;
- `sameIntentRetry=false` blieb durchgehend erhalten.

Die anfaenglichen Kandidaten-Blockaden waren reine read-only
Umwelt-/Reichweitenbedingungen und verbrauchten kein Live-Testbudget.

Der NPC-Sell-Stufentest wurde inzwischen ebenfalls real 7/7 bestanden.


## Operator-Abnahme Player-Market Trade

Die beiden Player-Market-Pfade `trade_buy` und `trade_sell` sind fuer die
PR20.3-Roadmap durch explizite Operatorentscheidung **vollstaendig
abgenommen**.

Maschinenlesbare Ratifikation:

`roadmap/pr20-3-trade-operator-acceptance.json`

Wichtig ist die Trennung zwischen Roadmap-Abnahme und Test-Evidence:

- `trade_buy`: `VOLL_ABGENOMMEN_OPERATOR`;
- `trade_sell`: `VOLL_ABGENOMMEN_OPERATOR`;
- beide zaehlen als abgeschlossen fuer die PR20.3-Sequenz;
- fuer beide wurde **kein eigener Live-Test ausgefuehrt**;
- `countsAsPassedEvidence=false`;
- daraus entsteht keine produktive Trade-Authority.

Die bestehenden Safety-Grenzen bleiben unveraendert: frische nichtleere RID,
Listing-Fingerprint, Seite/Item/Level/Preis/Menge, Target-/Distance-Kontext,
Partial-Fill-Reconciliation, Server-Selected-Item-Reproduktion bei
`trade_sell`, Variant-Ambiguity-Block und `sameIntentRetry=false`.

Nach Buy-Gold-, NPC-Sell- und Trade-Roadmap-Abnahme ist jetzt das formale PR20.3-Exit-Gate zu pruefen.


## Reale NPC-Sell-Evidence

Der persistente `V5 · PR20.3 Markt · NPC-Sell Stufentest` wurde real im
Adventure-Land-Browser vollstaendig ausgefuehrt und **7/7 BESTANDEN**.

Der GUI-Gesamtbericht wurde nach dem Test versehentlich nicht kopiert. Die
Repo-Evidence wurde deshalb transparent aus den vom Operator direkt
bestaetigten Testergebnissen rekonstruiert:

`roadmap/pr20-3-market-sell-evidence.json`

Es werden bewusst keine nicht mehr belegbaren Laufzeitdetails erfunden. Die
gespeicherten Fakten sind:

- LIVE 1: exakt `sell(index, 1)`, ein Gameplay-Write, Promise RESOLVED,
  +12 Gold / -1 Item, Restinventar unveraendert, Slot und Merchant-Gate OK,
  Settlement `BESTAETIGT`;
- LIVE 2: dieselben fachlichen Postconditions, erneut +12 Gold / -1 Item,
  Settlement `BESTAETIGT`;
- beide verkauften Einheiten stammen aus den zuvor bestaetigten
  Buy-Gold-Testeinheiten `hpot0`;
- Sell-Live-Testbudget 2/2 verbraucht; kein weiterer echter NPC-Sell-Test;
- 5M NO-WRITE: 300010 ms, 21 Samples, 0 Gaps, 0 Blocker-Samples,
  0 Gameplay-Writes und 0 mutierende Public-Function-Aufrufe;
- `sameIntentRetry=false`;
- keine Account-ID oder identifizierenden Tokens in der Evidence.

Die Rekonstruktion ist als solche maschinenlesbar markiert
(`rawGuiReportAvailable=false`) und ersetzt keinen erfundenen Rohbericht.
