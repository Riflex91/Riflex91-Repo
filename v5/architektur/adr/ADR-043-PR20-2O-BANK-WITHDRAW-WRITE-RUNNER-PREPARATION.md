# ADR-043: PR20.2o Bank-Withdraw Write-Adapter und Live-Runner vorbereiten

## Status

ANGENOMMEN — Implementierungsgate, **kein echter Live-Write in diesem PR**.

## Kontext

Der source-locked Real-Browser-Shadow fuer `bank_withdraw(1)` ist real bestanden.
Settlement, Default-off Capability, durable One-Shot-Authority, Current-Fence,
accountweite Bank-Lease, read-only Preflight und NO-WRITE Admission-Shadow sind
bereits vorhanden.

Der naechste Safety-Schritt darf deshalb den produktiven Write-Pfad technisch
vorbereiten, ohne die Mutation selbst auszufuehren.

## Entscheidung

PR20.2o fuehrt drei strikt Withdraw-spezifische Bausteine ein:

- `grundlage/quelle/merchant/bank-withdraw-produktions-transaktion.ts`
- `werkzeuge/bank-withdraw-produktions-write-browser.mjs`
- `werkzeuge/bank-withdraw-produktions-live.mjs`

Der Browser-Adapter darf statisch genau einen moeglichen Adventure-Land-Write
enthalten:

`root.bank_withdraw(1)`

Direkte Socket-`.emit(...)`-Writes sowie `bank_deposit`, `bank_store`,
`bank_retrieve`, `bank_swap` und `open_bank_pack` sind in diesem Adapter
verboten.

## Admission unmittelbar vor Send

Vor dem moeglichen Send muessen weiterhin aktuell und konsistent sein:

- Account, Character, Session und Server,
- stabiler Bank-Mount,
- `bank.gold >= 1`,
- Character-Gold und Inventory/Fingerprint,
- aktuelle Withdraw-One-Shot-Authority,
- aktuelle accountweite Bank-Lease-Epoche,
- External Fence und Current-Fence,
- Operator-Deny/Nothalt negativ,
- alternative V3/V4 Runtime inaktiv,
- FIFO-Mutationskanal `bank` und Socket-Budget,
- durable Transaction Intent vor Mutation.

Die Authority darf maximal einmal verwendet werden und bleibt auf hoechstens
2000 ms begrenzt.

## Settlement und Recovery

Ein Commit ist nur zulaessig, wenn eine frische Nachbeobachtung bei identischer
Account-/Character-/Session-/Server-/Lease-/Mount-Bindung gleichzeitig zeigt:

- Character-Gold exakt `+1`,
- Bank-Gold exakt `-1`,
- neuen Fingerprint.

Kein exaktes Delta bedeutet keinen Erfolg. Ein moeglicher Send mit unklarem
Ausgang geht in Reobserve/Reconcile. Derselbe Intent wird niemals erneut
gesendet.

## Source-Lock und Staging

Der Live-Runner ist source-locked. Auch sein read-only Write-Preflight verlangt
einen expliziten Source-SHA und muss mit dem lokalen `HEAD` uebereinstimmen.

Dieser PR fuehrt **keinen** echten `bank_withdraw(1)`-Write aus. Nach
vollstaendig gruener Exact-Head-CI und Merge folgt separat:

1. source-locked read-only Write-Preflight auf dem gruenen Head,
2. Ergebnis `BEREIT`,
3. explizite Benutzerbestaetigung
   `V5 BANK WITHDRAW 1 GOLD EINMAL AUSFUEHREN`,
4. exakt ein moeglicher `bank_withdraw(1)`-Send,
5. Settlement/Recovery-Evidence,
6. eigener Evidence-PR und erneut Exact-Head-CI.

## Konsequenzen

Persistierte Evidence verleiht keine spaetere Authority. Jeder echte Write
braucht eine neue, aktuelle Ratifikation. UNKNOWN bleibt fail-closed und darf
nicht durch einen Blind-Retry aufgeloest werden. `open_bank_pack` bleibt
wegen Capacity/Currency-Mutation und `ASYNC_BACKEND_TX` ausserhalb dieses
Gates.
