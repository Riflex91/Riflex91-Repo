# ADR-043 – PR20.2o Bank-Withdraw Write-Adapter und Live-Runner vorbereiten

**Status:** RATIFIZIERT  
**Datum:** 2026-09-21

## Kontext

Der source-locked Real-Browser-Shadow fuer `bank_withdraw(1)` ist real
bestanden. Settlement, default-off Capability, durable One-Shot-Authority,
Current-Fence, accountweite Bank-Lease, read-only Preflight und NO-WRITE
Admission-Shadow sind bereits vorhanden.

Der naechste Safety-Schritt darf deshalb den produktiven Write-Pfad technisch
vorbereiten, ohne die Mutation selbst auszufuehren.

## Entscheidung

PR20.2o fuehrt drei strikt Withdraw-spezifische Bausteine ein:

- `grundlage/quelle/merchant/bank-withdraw-produktions-transaktion.ts`;
- `werkzeuge/bank-withdraw-produktions-write-browser.mjs`;
- `werkzeuge/bank-withdraw-produktions-live.mjs`.

Der Browser-Adapter darf statisch genau einen moeglichen Adventure-Land-Write
enthalten: `root.bank_withdraw(1)`.

Direkte Socket-`.emit(...)`-Writes sowie `bank_deposit`, `bank_store`,
`bank_retrieve`, `bank_swap` und `open_bank_pack` sind in diesem Adapter
verboten. Unmittelbar vor dem moeglichen Send wird Character-/Bank-Gold sowie
Inventory/Fingerprint noch einmal read-only aus dem Browser revalidiert.

Vor dem moeglichen Send muessen weiterhin aktuell und konsistent sein:
Account, Character, Session und Server, stabiler Bank-Mount, `bank.gold >= 1`,
aktuelle Withdraw-One-Shot-Authority, aktuelle accountweite Bank-Lease-Epoche,
External Fence und Current-Fence, Operator-Deny/Nothalt negativ, alternative
V3/V4 Runtime inaktiv, FIFO-Mutationskanal `bank`, Socket-Budget und durable
Transaction Intent vor Mutation.

Ein Commit ist nur zulaessig, wenn eine frische Nachbeobachtung bei identischer
Account-/Character-/Session-/Server-/Lease-/Mount-Bindung gleichzeitig
Character-Gold exakt `+1`, Bank-Gold exakt `-1` und einen neuen Fingerprint
zeigt. Ein moeglicher Send mit unklarem Ausgang geht in Reobserve/Reconcile;
derselbe Intent wird niemals erneut gesendet.

Der Live-Runner ist source-locked. Auch sein read-only Write-Preflight verlangt
einen expliziten Source-SHA und muss mit dem lokalen `HEAD` uebereinstimmen.
Dieser PR fuehrt keinen echten `bank_withdraw(1)`-Write aus.

## Alternativen

- Deposit-Produktionspfad direkt wiederverwenden: verworfen, weil Withdraw eine
  eigene Capability-, Authority-, Journal-, Settlement- und Action-Bindung hat.
- Withdraw direkt im bestehenden Shadow-Runner senden: verworfen, weil Shadow-
  Evidence und produktive Write-Authority getrennte Safety-Gates bleiben muessen.
- Raw-Socket-`.emit(...)` statt offizieller Public Function nutzen: verworfen,
  weil damit die verifizierte Adventure-Land-Action-Grenze umgangen wuerde.
- Retry bei unklarem Ergebnis zulassen: verworfen, weil `bank_withdraw`
  non-idempotent ist und Duplicate-Wirkung nicht ausgeschlossen werden kann.
- Source-SHA-Pinning nur beim echten Send, nicht beim Preflight verlangen:
  verworfen, weil der Preflight sonst nicht exakt an den CI-geprueften Code
  gebunden waere.

## Konsequenzen

Nach vollstaendig gruener Exact-Head-CI und Merge folgt separat zuerst ein
source-locked read-only Write-Preflight auf exakt dem gruenen Head. Nur ein
Ergebnis `BEREIT` darf anschliessend zu einem separat explizit bestaetigten
One-Shot-Live-Lauf fuehren.

Persistierte Evidence verleiht keine spaetere Authority. Jeder echte Write
braucht eine neue aktuelle Ratifikation. UNKNOWN bleibt fail-closed und darf
nicht durch Blind-Retry aufgeloest werden. `open_bank_pack` bleibt wegen
Capacity-/Currency-Mutation und `ASYNC_BACKEND_TX` ausserhalb dieses Gates.

## Invarianten

- exakt `bank_withdraw(1)` als einziger erlaubter Public-Function-Write;
- maximal ein Adapter-Aufruf pro Intent;
- kein Same-Intent-Retry;
- kein Raw-Socket-`.emit(...)`;
- kein Deposit/Store/Retrieve/Swap/Open-Pack im Withdraw-Write-Adapter;
- eigene Withdraw-Action-/Recovery-/Verifier-Bindung;
- eigene Withdraw-One-Shot-Authority und eigenes Withdraw-Journal;
- Authority maximal einmal verwendbar und hoechstens 2000 ms gueltig;
- Bank-Gold vor Send mindestens 1;
- finaler read-only Character-/Bank-Gold- und Inventory-/Fingerprint-Recheck;
- durable Intent vor moeglichem Send;
- Commit nur bei frischem identisch gebundenem `+1/-1`-Settlement und neuem
  Fingerprint;
- UNKNOWN wird reconciliert und niemals blind erneut gesendet;
- source-locked Preflight und source-locked Live-Runner;
- in PR20.2o exakt 0 echte Withdraw-Gameplay-Writes.

## Migration

Nach gruener Exact-Head-CI wird PR20.2o gemerged. Danach wird auf exakt dem
gemergten, gruenen Source-SHA zuerst der read-only Write-Preflight ausgefuehrt.
Nur bei `BEREIT` folgt in einem separaten Schritt die explizite
Operatorbestaetigung `V5 BANK WITHDRAW 1 GOLD EINMAL AUSFUEHREN` und maximal
ein moeglicher `bank_withdraw(1)`-Send. Settlement-/Recovery-Evidence wird
anschliessend in einem eigenen Evidence-PR dokumentiert und erneut per
Exact-Head-CI geprueft.

## Rollback

Solange kein echter Withdraw-Live-Write ausgefuehrt wurde, koennen
Produktions-Transaktionscore, Browser-Write-Adapter, Live-Runner und deren
Runtime-/Host-Wiring entfernt werden, ohne Spielzustands-Rollback zu benoetigen.
Bereits vorhandene Withdraw-Shadow-, Authority-, Lease- und Settlement-Evidence
bleibt davon unberuehrt.
