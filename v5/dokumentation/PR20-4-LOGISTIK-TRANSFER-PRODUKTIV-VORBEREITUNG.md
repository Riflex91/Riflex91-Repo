# PR20.4 – Logistik/Transfers: NO-WRITE-Vorbereitung

**Status:** INGAME-GESAMTSTUFENTEST BEREIT / PRODUKTIVE AUTHORITY WEITER DEFAULT-OFF  
**Stand:** 2026-09-22  
**Vorstufen:** PR20.1, PR20.2 und PR20.3 abgeschlossen; produktive PR20.4-Mutation bleibt bis zu den eigenen Capability-/Authority-/Journal-/Admission-/Shadow-/Live-Gates gesperrt  
**Basis-main:** `9c96d54c51b664e3cc67181ef6c88582f87c224e`

## Zweck

Supply, Collection, Gear-Delivery und Rendezvous koennen bereits jetzt fuer die spaetere produktive Ausfuehrung vorbereitet werden, ohne einen echten Transfer freizugeben.

Diese Vorbereitung erzeugt:

- keine Transfer-MUTIEREN-Capability;
- keine Transfer-Authority;
- keinen `send_item`- oder `send_gold`-Adapter;
- keinen Live-Runner;
- keinen Gameplay-Write;
- keine Aenderung an der produktiven Komposition.

Maschinenlesbar:

`grundlage/vertraege/runtime/logistics-transfer-production-preparation.json`.

## Vorhandene Grundlagen

Bereits vorhanden sind:

- `MerchantLogistikLedger` fuer Supply Delivery, Collection und Gear Delivery;
- exakte Bindung des Empfaengers an Character, Session, Server und Roster-Epoche;
- frische Rendezvous-Evidence inklusive Distanz und Freshness-Fingerprint;
- physische Posten-IDs statt nur Itemname;
- gepinnte Empfaenger-Inventory-Baseline;
- `sameTransferErneutSenden=false`;
- Restart nichtterminaler Workflows als `RECOVERY_PENDING`;
- Settlement erst nach neuem Empfaenger-Inventarstand und nachgewiesener Mengenzunahme;
- allgemeines Production Recipient Settlement mit Session-/Roster-/Serverbindung;
- R9 Action/Recovery/Verifier fuer `send_item` und `send_gold`.

## Vorbereitete Transfer-Actions

| Fachfunktion | Action | Recovery | Verifier |
|---|---|---|---|
| Itemtransfer | `AL-ACTION-SEND-ITEM` | `AL-RECOVERY-SEND-ITEM` | `AL-VERIFIER-SEND-ITEM` |
| Goldtransfer | `AL-ACTION-SEND-GOLD` | `AL-RECOVERY-SEND-GOLD` | `AL-VERIFIER-SEND-GOLD` |

Beide Actions sind non-idempotent und laufen ueber den gemeinsamen FIFO-`send`-Channel. Nach moeglichem Send gilt deshalb immer Reobserve/Reconcile statt Blind-Retry.

`send_cx` und `send_mail` bleiben ausserhalb des ersten Merchant-Logistik-Satzes. Insbesondere `send_mail` besitzt einen eigenen asynchronen Backend-/Mixed-Correlation-Risikopfad.

## Rendezvous-Gate

Vor jedem spaeteren Transfer muessen unmittelbar frisch passen:

1. Character-ID;
2. Session-ID;
3. Server Region/Identifier;
4. Roster-Epoche;
5. Freshness-Fingerprint;
6. Distanz <= geplante Maximaldistanz;
7. Empfaenger ist online/frisch;
8. keine V3/V4-Alternativruntime.

Ein alter Rendezvous-Erfolg darf nicht als dauerhafte Transferfreigabe dienen.

## Itemtransfer

Vor `send_item` braucht V5 zusaetzlich:

- exakte frische physische Gegenstandsidentitaet;
- passende physischeKennung aus genau einem Logistikposten;
- korrekte Name-/Level-/Mengenbindung;
- passende Disposition/Reservierung fuer Supply, Collection oder Gear;
- Empfaenger-Baseline und konservative Capacity;
- durable Intent **vor Send**.

COMMIT ist erst erlaubt, wenn der Empfaenger in derselben gebundenen Session/Roster-Epoche einen neuen Inventory-Fingerprint und die erwartete Mengenzunahme nachweist.

Der Sender-Delta allein beweist keinen erfolgreichen Transfer.

## Goldtransfer – Settlement-Core jetzt vorbereitet

Der Action-/Verifier-Vertrag fuer `send_gold` verlangt bereits:

- Sender-Gold-Delta;
- Recipient Settlement Evidence.

Diese zuvor offene Core-Luecke ist jetzt **NO-WRITE geschlossen**. `grundlage/quelle/merchant/gold-transfer-settlement.ts` validiert vor einem fachlichen Settlement gemeinsam:

- exakter Empfaenger-Character-/Session-/Server-/Roster-Bindung;
- gepinntem Empfaenger-Gold-Baselinewert + Fingerprint;
- frischem Empfaenger-Gold-Nachzustand;
- passendem Sender-Gold-Delta;
- Korrelationsfingerprint;
- Evidence nach Transferbeginn.

Der zugehoerige Test `grundlage/tests/pr20-gold-transfer-settlement.test.mjs` beweist insbesondere, dass ein Sender-Delta allein nicht genuegt sowie Session-/Server-/Roster-Drift und unpassende Deltas fail-closed bleiben.

**Produktives `send_gold` bleibt trotzdem gesperrt.** Der Settlement-Core verleiht keine ExecutionAuthority; Capability/Owner, Authority, Journal, Admission, Preflight, Fault-/Shadow- und Live-Gates fehlen absichtlich weiterhin.

## Recovery

Nach moeglichem Send gilt:

- kein Same-Intent-Retry;
- Sender und Empfaenger frisch beobachten;
- bei Itemtransfer exakte Mengen-/Identity-/Inventory-Fingerprints reconciliieren;
- bei Goldtransfer spaeter Sender- und Empfaenger-Gold gemeinsam reconciliieren;
- Session-/Roster-Drift => kein Commit;
- unzureichende oder widerspruechliche Evidence => fail-closed/operator-required;
- Restart => `RECOVERY_PENDING`, nie Blind-Resume.

## Naechste Arbeit nach den Vorstufen

1. einen einzigen ersten Transfer-Live-Kandidaten waehlen;
2. Capability/Owner/Authority ratifizieren;
3. durables Journal + Current-Fence;
4. read-only Rendezvous-/Transfer-Preflight;
5. Fault-/Disconnect-/Restart-/Stale-Recipient-/Partial-Settlement-Tests;
6. Shadow;
7. exakt einen kontrollierten realen Transfer-Write.


## PR20.3-Transition abgeschlossen

Das formale Market-Exit-Gate liegt unter
`roadmap/pr20-3-market-exit-gate-status.json`.

PR20.4 darf damit repo-seitig und read-only vollstaendig vorbereitet werden.
Diese Transition erteilt **keine** Transfer-Mutation, keine breite
`send_item`-/`send_gold`-Authority und keinen Raw-Socket-Pfad. Das persistente Gesamttestpaket ist jetzt gebaut. Es besitzt 16 sequenzielle Stufen, gemeinsame persistente Browser-Storage-Evidence und harte 2/2-Live-Budgets fuer `send_item` und `send_gold`; zwischen den Stufen ist kein Merge erforderlich.


## Persistentes PR20.4-Gesamttestpaket

Paket:

`werkzeuge/pr20-4-logistics-transfer-step-test-paket.js`

Plan:

`roadmap/pr20-4-logistics-transfer-step-test-plan.json`

Dasselbe Paket wird auf **genau zwei** Charakteren geladen: einem Merchant
und einem Partner. Beide Instanzen teilen ausschließlich Testzustand ueber
Browser-`localStorage`; produktive V5-Authority wird nicht registriert.

Der reale Ablauf prueft nacheinander:

1. Pair-/Rendezvous-Bindung, Same-Account, Server, Map, Session, Distanz und
   `performance_trick()`;
2. Item-Source-Pinning, Recipient-Baseline, Capacity sowie stale/offline,
   Restart/UNKNOWN/Partial/Duplicate fail-closed;
3. `send_item(..., 1)` als Supply Merchant -> Partner;
4. Recipient-Settlement auf dem Partner;
5. frisches Collection-Pinning;
6. `send_item(..., 1)` Partner -> Merchant;
7. Recipient-Settlement und Item-Roundtrip;
8. ITEM 5M NO-WRITE;
9. Gold-Baselines + Safety-Reserve + Fault-Matrix;
10. `send_gold(..., 1)` Merchant -> Partner;
11. Recipient-Gold-Settlement;
12. frische Reverse-Baselines;
13. `send_gold(..., 1)` Partner -> Merchant;
14. Recipient-Gold-Settlement und Gold-Roundtrip;
15. GOLD 5M NO-WRITE;
16. Gesamt-Closeout ohne offene/duplizierte Transfers.

Nach jedem moeglichen Send wird das Live-Budget **vor** Settlement verbraucht.
Ein Reload eines nichtterminalen Transfers wird zu `RECOVERY_PENDING`;
`sameIntentRetry=false` bleibt zwingend.

Die Report-Ausgaben enthalten keine Account-ID und keine Session-ID. Interne
Browser-Testbindung darf solche Werte fuer Drift-Erkennung temporaer nutzen,
sie werden aber nicht in die zu commit­tende Evidence ausgegeben.
