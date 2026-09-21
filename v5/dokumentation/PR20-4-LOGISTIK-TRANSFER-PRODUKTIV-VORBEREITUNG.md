# PR20.4 – Logistik/Transfers: NO-WRITE-Vorbereitung

**Status:** VORBEREITET / NO-WRITE  
**Stand:** 2026-09-21  
**Produktive Freigabe blockiert bis:** PR20.1, PR20.2 und PR20.3 abgeschlossen  
**Basis-main:** `8acff88298c4f6d3c76a5fdfe0540aad9bef2249`

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

## Goldtransfer – bewusst erkannte Restluecke

Der Action-/Verifier-Vertrag fuer `send_gold` verlangt bereits:

- Sender-Gold-Delta;
- Recipient Settlement Evidence.

Im aktuellen Core existiert aber noch kein gleich konkret typisierter Gold-Empfaenger-Settlement-Vertrag wie fuer Item-Inventory-Settlement.

Das wird **nicht** als erledigt angenommen.

Vor jeder produktiven `send_gold`-Freigabe muss deshalb mindestens ein eigener Vertrag gebaut werden mit:

- exakter Empfaenger-Character-/Session-/Server-/Roster-Bindung;
- gepinntem Empfaenger-Gold-Baselinewert + Fingerprint;
- frischem Empfaenger-Gold-Nachzustand;
- passendem Sender-Gold-Delta;
- Korrelationsfingerprint;
- Evidence nach Transferbeginn.

Bis dieser Vertrag existiert und getestet ist, bleibt produktives `send_gold` gesperrt.

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

1. Gold-Recipient-Settlement-Luecke schliessen;
2. einen einzigen ersten Transfer-Live-Kandidaten waehlen;
3. Capability/Owner/Authority ratifizieren;
4. durables Journal + Current-Fence;
5. read-only Rendezvous-/Transfer-Preflight;
6. Fault-/Disconnect-/Restart-/Stale-Recipient-/Partial-Settlement-Tests;
7. Shadow;
8. exakt einen kontrollierten realen Transfer-Write.
