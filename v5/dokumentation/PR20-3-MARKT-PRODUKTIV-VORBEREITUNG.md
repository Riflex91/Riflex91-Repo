# PR20.3 – Markt/Kaufen/Verkaufen: NO-WRITE-Vorbereitung

**Status:** ERSTER KANDIDAT RATIFIZIERT / BUY-WITH-GOLD CORE NO-WRITE  
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
