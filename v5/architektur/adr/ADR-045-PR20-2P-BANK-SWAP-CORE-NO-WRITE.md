# ADR-045 – PR20.2p Bank-Swap: Serversemantik und erster write-freier Kandidat

## Status

AKZEPTIERT – 2026-09-22

## Entscheidung

Der naechste separat vorbereitete Bankpfad ist `bank_swap`. Dieser Schritt
implementiert nur die write-freie Grundlage. Es existiert danach noch kein
Swap-Write-Adapter und kein Live-Runner.

Der aktuelle offizielle Adventure-Land-Stand wurde auf Commit
`f927df37da777eb7f048fd9209c039653a3406bd` verifiziert. Die Public Function
`bank_swap(pack,a,b)` verwendet den gemeinsamen FIFO-Deferred-Kanal `bank`
und sendet die Bankoperation `move`.

Die Serversemantik ist fuer den ersten Kandidaten entscheidend:

- der Pack muss existieren und zum aktuellen Bank-Map-Mount passen;
- der Server parst und klemmt `a` und `b` auf `0..41`;
- identische effektive Slots werden als `invalid` abgelehnt;
- `placeholder` in einem Zielslot wird abgelehnt;
- sind die beiden Items stackbar, wird **nicht getauscht**: A wird in B
  zusammengefuehrt und A geleert;
- nur wenn `can_stack` false ist, werden die beiden Slots vertauscht;
- der generische Server-Erfolg ist kein ausreichender Settlement-Nachweis.

V5 darf deshalb Server-Clamping niemals als Validierung verwenden. Der erste
Kandidat akzeptiert ausschliesslich zwei belegte Slots desselben Packs,
Integer-Indizes `0..41`, `a != b`, keine Placeholder und unterschiedliche
Itemnamen. Unterschiedliche Namen schliessen fuer diesen engsten Kandidaten
ein Stack-Merge aus.

Settlement ist nur `BESTAETIGT`, wenn ein frischer, identitaets- und
Lease-gebundener Snapshot exakt den Zwei-Slot-Tausch zeigt, waehrend der
restliche Pack, Inventory, Character-Gold und Bank-Gold unveraendert bleiben.
Ein unveraenderter Zustand bleibt `OFFEN`; widerspruechliche Deltas sind
`DRIFT`. In keinem Fall ist Same-Intent-Retry erlaubt.

## Authority und Fencing

`merchant.bank.intern_tauschen` wird unter `merchant-bank-core@1` nur
default-off registriert. Die eigene One-Shot-Authority:

- ist maximal 2 Sekunden gueltig;
- ist exakt einmal verbrauchbar;
- verlangt ein durable Audit vor Ausstellung;
- aktiviert die Capability nicht;
- erzeugt selbst keinen Gameplay-Write und keine Raw-Write-Authority.

Vor einer spaeteren Authority-Ausstellung muessen konkurrierende Equip-,
Deposit-, Withdraw- und Swap-Authorities/Current-Transaktionen sowie eine
bereits aktive Account-Bank-Lease ausgeschlossen sein. Die persistente
Account-Bank-Lease bleibt die accountweite Mutationsgrenze.

## Naechstes Gate

Als naechstes werden der read-only Browser-Observer und der read-only
Production-Preflight implementiert. Erst dann ist ein echter lokaler
Adventure-Land-CDP-Preflight erforderlich. Bis zu dessen Evidence bleiben
Admission-Shadow, Real-Browser-Shadow und jeder Swap-Write ausstehend.
