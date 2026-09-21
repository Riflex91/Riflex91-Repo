# ADR-036 – PR20.2c persistente Bank-Lease und No-Write-Admission-Shadow

**Status:** RATIFIZIERT  
**Datum:** 2026-09-21

## Kontext

PR20.2b hat den separaten Single Owner `merchant-bank-core@1`, die default-off
Capability `merchant.bank.gold_einlagern`, eine kurzlebige One-Shot-Authority,
einen durable Current-Fence und einen read-only Preflight eingefuehrt. Vor
einem realen Bank-Write fehlen weiterhin die restart-sichere Persistenz der
accountweiten Bank-Lease sowie der Nachweis, dass External Fence, lokaler
`bank`-Action-Channel, Socket-Budget, durable Intent und R9-Admission
gemeinsam funktionieren.

Der bestehende `BankLeaseKoordinator` besitzt bereits die fachlichen Regeln
fuer `RECOVERY_PENDING`, Epochen, External Fence, Snapshot-Bindung und
Freigabe. Diese Logik soll nicht dupliziert werden.

## Entscheidung

PR20.2c fuehrt einen `PersistenterBankLeaseController` ein. Persistiert werden
nur Lease-Metadaten und Epochen; Ressourcen-/Fencing-Tokens werden niemals
rehydriert oder als Authority gespeichert.

Nichtterminale persistierte Leases werden nach Neustart ausschliesslich als
`RECOVERY_PENDING` importiert. Ein neuer Bank-Intent bleibt gesperrt, bis ein
expliziter External-Fence-Abgleich die alte Epoche entweder `RELEASED` setzt
oder bei Konflikt in Quarantaene haelt.

Zusaetzlich wird eine `ProduktiveBankDepositShadowAdmission` eingefuehrt. Sie
erwirbt die persistente accountweite Lease, validiert External Fence und
leasegebundenen Snapshot, reserviert lokalen `bank`-Action-Channel und
Socket-Budget, persistiert den Transaction-Intent und durchlaeuft den normalen
R9-Admission-Kernel. Danach endet sie absichtlich mit terminalem
`ABBRUCH` und `send_boundary_state=NICHT_GESENDET`.

Die Shadow-Admission besitzt weder Ausfuehrungsadapter noch
`AusfuehrungsKernel` und kann deshalb keinen Gameplay-Write ausloesen.

## Alternativen

- Fencing-Tokens direkt persistieren und nach Restart wiederverwenden:
  verworfen; alte Tokens duerfen keine Authority ueber einen Prozessneustart
  hinweg konservieren.
- Einen zweiten Bank-Lease-Koordinator fuer den Produktionspfad bauen:
  verworfen; die bestehende R13-Fachlogik bleibt die einzige Quelle fuer
  Lease-/Fence-Regeln.
- Direkt einen `bank_deposit`-Adapter anbinden:
  verworfen; Fault-/Restart-/Shadow-Evidence muss vorher gruene CI besitzen.
- Restart-Leases automatisch freigeben:
  verworfen; External State kann nach Crash weiterhin belegt sein.

## Konsequenzen

- Bank-Lease-Metadaten werden durable unter
  `runtime/bank/lease-state-v1.json` gespeichert.
- Terminale Epoch-Floors bleiben ueber wiederholte Neustarts erhalten.
- Persistenzfehler sperren weitere Lease-Mutationen und Validierungen
  fail-closed.
- Der Node-Produktionshost laedt persistierte Lease-Evidence beim Aufbau.
- Nichtterminale Leases blockieren den Bank-Preflight zusaetzlich zum
  Transaction-`current.json`.
- Positiver Restart-Abgleich darf nur mit frischer External-Fence-Evidence
  erfolgen; negativer Abgleich quarantiniert.
- Shadow-Admission beweist Authority-/Fencing-/Budget-/Intent-/Admission-Kette,
  aber erzeugt exakt null Gameplay-Writes.

## Invarianten

- keine Persistenz oder Rehydrierung von Ressourcen-/Fencing-Tokens;
- Restart nichtterminal => `RECOVERY_PENDING`;
- alter Epoch-Floor bleibt monoton erhalten;
- Persistenzfehler => fail-closed;
- accountweite Lease und lokaler `bank`-Channel muessen denselben Ablauf
  binden;
- External Fence muss Owner, Serverregion und Serveridentifier exakt treffen;
- Snapshot muss Account, Owner und Lease-Epoche treffen und frisch sein;
- Socket-Budget wird vor Admission reserviert;
- durable Intent wird vor Admission geschrieben;
- Same-Intent-Retry bleibt false;
- Shadow endet mit `NICHT_GESENDET`;
- Shadow besitzt keinen Adapter und keinen `AusfuehrungsKernel`;
- Gameplay-Writes in PR20.2c: exakt 0.

## Migration

Beim Node-Host-Aufbau wird `runtime/bank/lease-state-v1.json` eingelesen.
Nichtterminale Eintraege werden als `RECOVERY_PENDING` importiert; terminale
Eintraege liefern nur den Epochen-Floor.

Der bestehende Bank-Preflight meldet offene persistierte Leases neben offenen
Transaction-Current-Eintraegen und bleibt read-only.

Nach gruener CI folgt ein separater Schritt fuer Fault-/Restart-Shadow gegen
den realen Browserzustand. Erst danach duerfen Write-Adapter und Live-Runner
eingefuehrt werden.

## Rollback

Der Code kann entfernt werden, ohne Gameplay-State rueckgaengig machen zu
muessen, da PR20.2c keine Spielmutation ausfuehrt. Persistierte nichtterminale
Lease-Evidence darf bei Rollback jedoch nicht geloescht oder als frei
interpretiert werden. Sie bleibt fuer eine spaetere Reconciliation
fail-closed erhalten.
