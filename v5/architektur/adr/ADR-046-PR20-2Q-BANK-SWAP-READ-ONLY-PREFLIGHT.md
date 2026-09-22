# ADR-046 – PR20.2q Bank-Swap Read-only Preflight

## Status

AKZEPTIERT – 2026-09-22

## Entscheidung

Vor jedem Admission-Shadow wird fuer `bank_swap` ein eigener realer,
source-exakter Read-only-Preflight verlangt. Der Preflight verbindet sich nur
mit Loopback-CDP und bindet sich an den Adventure-Land-Page-Kontext, in dem
`call_code_function_f` vorhanden ist.

Der Preflight startet **keinen** CODE-Runner. Insbesondere ruft er weder
`call_code_function_f('eval','void 0')` noch `bank_swap` auf. Er beobachtet
nur, ob die offizielle Bridge vorhanden ist. Damit bleiben sowohl
`gameplayWrites` als auch mutierende Public-Function-Aufrufe bei 0.

## Browser-Gate

Der beobachtete Zustand muss gleichzeitig zeigen:

- Merchant, alive, idle, leere Queue;
- keine aktive alternative V3/V4-Runtime;
- Bank gemountet;
- lesbare Character- und Bank-Gold-Baselines, wobei Bank-Gold auch 0 sein darf;
- mindestens einen gemounteten Bank-Pack, dessen `bank_packs[pack][0]` exakt
  der aktuellen Map entspricht;
- darin zwei belegte, nicht-placeholder Slots mit unterschiedlichen Itemnamen.

Unterschiedliche Namen verhindern beim ersten Kandidaten den serverseitigen
`can_stack`-Pfad. Die Indizes stammen ausschliesslich aus beobachteten
Arraypositionen 0..41; Server-Clamping wird nie als Validierung benutzt.

## Current-Fence

Der Node-Host kennt jetzt den Swap-Current-Journal read-only. Deposit,
Withdraw und Swap blockieren sich gegenseitig bereits auf Journal-Ebene.
Der Swap-Preflight verlangt zusaetzlich eine freie persistente
Account-Bank-Lease und keine offene Equip-/Deposit-/Withdraw-Authority.
Eine Swap-Authority wird in diesem Schritt nicht in den Host integriert und
nicht ausgestellt.

## Source-Lock

Der Runner verlangt `--source-sha <40-HEX>` und vergleicht diesen Wert mit
dem lokalen `git rev-parse HEAD`. Eine Abweichung blockiert vor der
Browserbeobachtung.

## Wirkung

Dieser Schritt besitzt keinen Write-Adapter und keinen Live-Runner.
Der lokale Preflight ist eine read-only Diagnose und kein Funktionstest.
Nach einem erfolgreichen realen Preflight darf als naechster Schritt der
NO-WRITE-Admission-Shadow entwickelt werden; nicht vorher.
