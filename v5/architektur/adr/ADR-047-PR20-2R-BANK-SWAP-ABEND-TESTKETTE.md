# ADR-047 – PR20.2r Bank-Swap Abend-Testkette

## Status

AKZEPTIERT – 2026-09-22

## Entscheidung

`bank_swap` wird lokal in sieben strikt getrennten Stufen validiert. Keine Stufe
startet die folgende automatisch.

1. Read-only Preflight.
2. Read-only Kandidaten-Stabilitaet.
3. CODE-Bridge-Probe / gegebenenfalls No-op-Runner-Bootstrap, 0 Gameplay-Writes.
4. Real-Browser Admission-Shadow, 0 Gameplay-Writes.
5. Write-Preflight, 0 Gameplay-Writes.
6. Echter Funktionstest 1, maximal ein Adapter-Aufruf und ein Gameplay-Write.
7. Echter Funktionstest 2 nur als neuer Reverse-Intent nach eindeutig sauberem Test 1.

Jede Stufe ist an exakt denselben lokalen Git-HEAD gebunden. Evidence der
Vorgaengerstufe wird persistent verlangt.

## Zwei-Test-Limit

Das Limit von zwei echten Funktionstests ist persistent. Nach stabilem realem
Bank-Mount wird ein Testplatz durable verbraucht. Unmittelbar vor der
moeglichen Send-Grenze wird `MOEGLICHER_SEND_ARMED` durable geschrieben.
Ein Prozessabsturz an jeder dieser Grenzen bleibt damit fail-closed.

Test 2 ist nur zulaessig, wenn Test 1 durable als
`COMMITTED_BESTAETIGT` finalisiert wurde. Sein Prestate muss exakt den
umgekehrten Slotzustand von Test 1 zeigen; dadurch ist Test 2 ein neuer
expliziter Intent und zugleich der Ruecktausch des ersten Kandidaten.

## Write-Pfad

Der Browseradapter revalidiert unmittelbar vor der Wirkung Account, Character,
Session, Server, Merchant, Idle/Queue, alternative Runtime, Bank-Mount,
Pack/Slots, beide Item-Identitaeten, Inventory, Character-Gold und Bank-Gold.
Er verwendet ausschliesslich die offizielle Page->CODE-Bridge und genau einen
`maincode.contentWindow.bank_swap(pack,a,b)`-Aufruf. Raw-Socket-`.emit`
ist verboten.

Durable Intent, Capability/Authority, Current-Fence, persistente Account-Bank-
Lease, FIFO-Bank-Kanal, Settlement und Recovery bleiben unveraendert Pflicht.
Nach moeglichem Send gibt es keinen Same-Intent-Retry.

## Freigabe

Die Implementierung der Testkette ist keine Produktivfreigabe.
`productionWideActivationAllowed` bleibt false, bis reale Evidence die
jeweiligen Gates bestaetigt.
