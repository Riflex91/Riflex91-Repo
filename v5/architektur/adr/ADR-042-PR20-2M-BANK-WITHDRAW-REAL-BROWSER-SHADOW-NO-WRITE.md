# ADR-042 – PR20.2m Bank Withdraw Real-Browser-Shadow NO-WRITE

**Status:** RATIFIZIERT  
**Datum:** 2026-09-21

## Kontext

PR20.2l hat den read-only Withdraw-Preflight und den NO-WRITE
Admission-Shadow implementiert. Vor einem spaeteren Write-Adapter muss dieselbe
Kette gegen einen realen Adventure-Land-Browser source-locked nachweisbar sein.

## Entscheidung

PR20.2m fuegt einen eigenen Withdraw-Real-Browser-Shadow-Runner hinzu. Er
verlangt den exakten Git-Source-SHA und die explizite Operatorbestaetigung
`V5 BANK WITHDRAW SHADOW OHNE WRITE AUSFUEHREN`.

Der Runner startet ausserhalb der Bank, beansprucht die accountweite Bank-Lease,
wartet auf einen manuell beobachteten stabilen Bank-Mount, stellt die eng
gebundene Withdraw-One-Shot-Authority aus, durchlaeuft den bestehenden
Withdraw-Admission-Shadow und verlangt anschliessend einen stabilen manuellen
Bank-Exit. Der Shadow endet mit `ABBRUCH` und `NICHT_GESENDET`.

## Alternativen

- Deposit-Real-Shadow direkt wiederverwenden: verworfen wegen getrennter
  Capability-, Authority-, Journal- und Action-Bindung.
- Write-Adapter bereits mit dem Shadow kombinieren: verworfen, weil die
  Browser-/Lease-/Admission-Evidence vor jedem Send separat bewiesen werden muss.
- Source-SHA-Pinning weglassen: verworfen, weil Evidence sonst nicht eindeutig
  an den CI-geprueften Code gebunden ist.

## Konsequenzen

Nach gruener CI kann der Runner lokal gegen den echten Browser ausgefuehrt
werden. Das Ergebnis darf nur als bestanden gelten, wenn Admission
`ADMISSION_BESTANDEN_KEIN_SEND`, Journal `ABBRUCH`, Lease `RELEASED`,
Gameplay-Writes 0 und Adapter-Aufrufe 0 sind.

## Invarianten

- exakter Source-SHA erforderlich;
- explizite Withdraw-Shadow-Bestaetigung erforderlich;
- Start ausserhalb der Bank;
- stabiler manueller Mount nach Lease;
- Withdraw-Bank-Gold-Budget mindestens 1;
- Character-/Session-/Serverbindung bleibt stabil;
- eigenes Withdraw-Admission-Gate;
- eigener Withdraw-Current-Fence und Journal;
- terminal `ABBRUCH` / `NICHT_GESENDET`;
- Same-Intent-Retry `false`;
- kein `bank_withdraw(...)`-Aufruf;
- kein Raw-Socket-`.emit(...)`;
- kein Write-Adapter;
- exakt 0 Gameplay-Writes und 0 Adapter-Aufrufe.

## Migration

Nach gruener Exact-Head-CI muss der Real-Browser-Shadow auf genau diesem
Source-SHA lokal ausgefuehrt werden. Erst die dokumentierte bestandene Evidence
oeffnet den naechsten separaten Write-Adapter/Live-Runner-Vorbereitungsschritt.

## Rollback

Admission-Gate, Host-Fassade und Real-Shadow-Runner koennen ohne
Spielzustands-Rollback entfernt werden, da dieser Schritt keinen Send ausfuehrt.
