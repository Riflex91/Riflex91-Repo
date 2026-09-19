# P0-07 – Call-Cost- und Rate-Limit-Modell

**Status:** DONE  
**Stand:** 2026-09-19

## Ziel

P0-07 trennt alle Begriffe, die im Adventure-Land-Umfeld als "Call Cost", Queue-Grenze oder Rate Limit auftreten. Sie duerfen in V5 weder denselben Zaehler noch denselben Recovery-Pfad erhalten.

Verbindlich getrennt sind:

1. Game-Socket-Aufrufbudget des Characters;
2. Client Deferred Queues;
3. eingebaute Client-Safeties;
4. externe MCP/HTTP-Rate-Limits;
5. Mainframe Worker-CPU-Auslastung.

Der maschinenlesbare Vertrag ist:

`v5/wissensbasis/vertraege/call-budget.json`

## Game-Socket-Aufrufbudget

Der offizielle Server-Source modelliert `socket.calls` als gewichtetes Sliding Window.

Verifizierter Stand:

- normales Character-Limit: **200 gewichtete Punkte**;
- Fenster: **4000 ms**;
- jeder eingehende Socket-Request erzeugt mindestens Basiskosten;
- Handler und interne Pfade koennen weitere `add_call_cost`-Kosten erzeugen;
- bei `get_call_cost() > climit` sendet der Server `limitdcreport`, setzt `disconnect_reason = "limitdc"` und trennt den Socket.

V5-Ressource:

`character:socket_call_budget`

Diese Ressource gilt **global fuer alle Action-Channels desselben Characters**. Combat, Movement, Merchant, Bank, Craft und andere Domaenen erhalten keine separaten 200er Budgets.

## V5 Safety Policy

Der Servergrenzwert bleibt 200/4000 ms. V5 verwendet fuer die spaetere Runtime initial:

- geplantes Budget: **100 gewichtete Punkte / 4000 ms**;
- unverplante Reserve: **100 Punkte**;
- automatische Optimierung bis zum Servermaximum: **verboten**, solange keine Safety-/Certification-Evidence dies explizit freigibt.

100/4000 ms ist keine Adventure-Land-Spielregel, sondern eine konservative V5-Policy.

Die Reserve schuetzt insbesondere gegen:

- interne Zusatzkosten;
- dynamische Cost-Pfade;
- Burst;
- Latenz;
- Recovery;
- Diagnosecalls;
- noch nicht vollstaendig modellierte Effekte.

## Kosten-Evidence

Verifizierte konfigurierte CC-Evidence umfasst unter anderem:

| Event | CC-Evidence |
|---|---:|
| auth | 2 |
| move | 1.5 |
| players | 12 |
| secondhands | 16 |
| friend | 24 |
| send_updates | 12 |
| cruise | 10 |
| random_look | 10 |
| equip | 3 |
| unequip | 6 |
| tracker | 50 |
| ccreport | 3 |

Diese Werte werden **nicht** blind als vollstaendige Gesamtkosten eines Requests interpretiert.

Dynamische Sonderfaelle:

- `equip_batch`: Zusatz-Evidence `CC.equip * (0.5 + data.length / 2)`;
- `cm`: dynamische Kosten nach Nachrichtenlaenge und Recipient-Anzahl; die Source-Reihenfolge der Laengenbedingungen bleibt massgeblich;
- `target`: Wrapper-Modifier 0.5 plus `reduce_call_cost()` im Handler;
- `call_modifier`: `open_chest=0.1`, `skill=0.05`, `target=0.5`, sonst 1.

Verifizierte interne Zusatzkosten umfassen unter anderem:

- Transport: +8;
- Bank Mount: +32;
- Bank Unmount: +16;
- Resend/State-Recalculation kann ebenfalls Zusatzkosten erzeugen.

Daraus folgt: V5 zaehlt keine Requests pro Sekunde, sondern plant ein **gewichtetes globales Budget mit Unknown/Internal Reserve**.

## limitdc und Recovery

`limitdc` ist ein Transport-/Betriebsereignis.

Fuer wertveraendernde Actions gilt nach moeglichem Send:

`limitdc -> UNKNOWN -> Reconnect -> Reobserve -> Reconcile`

Verboten:

`limitdc -> Request erneut senden`

Ein Disconnect beweist nicht, dass die Mutation serverseitig nicht angewendet wurde.

## Deferred Queues

`push_deferred(name)` verwendet channelbezogene FIFO-Queues.

Der technische Client-Outbreak-Guard liegt bei **3200 Eintraegen**. Wird er ueberschritten, erhaelt der aelteste Promise `queue_overflow`.

Das ist **kein erlaubtes V5-Concurrency-Ziel**.

V5-Regel:

- mutierender FIFO-Channel: maximal **1 managed In-Flight-Request** je Channel;
- `queue_overflow` und `limitdc` bleiben unterschiedliche Fehlerklassen;
- FIFO-Korrelation ersetzt weder Ressourcenclaims noch das globale Socket-Budget.

## Client-Safeties

Der offizielle Runner hat `safeties = true`.

Verifizierte Beispiele:

- `use_hp_or_mp`: Safety-Fenster `min(200ms, ping*3)`;
- `loot`: Safety-Fenster `min(300ms, ping*3)`;
- Chest besitzt weitere Safeties.

V5 deaktiviert diese Safeties nicht, um Durchsatz zu erhoehen. Eigene Scheduler-Admission und Backpressure kommen zusaetzlich hinzu.

## ccreport

Der Server stellt `ccreport` bereit und liefert unter anderem:

- `socket.calls`;
- `climit`;
- `total_calls`.

`ccreport` besitzt selbst Call-Cost-Evidence und ist deshalb **Diagnose-/Kalibrierungs-Evidence**, kein Polling-Instrument pro Scheduler-Tick.

## Externe MCP/HTTP-Limits

Diese Limits sind **nicht** das Game-Socket-Aufrufbudget.

Verifizierte Token-Buckets:

| Klasse | Rate | Burst |
|---|---:|---:|
| standard | 120/min | 30 |
| bulk game data | 12/min | 4 |
| bank reads | 12/min | 4 |
| progression | 6/min | 2 |
| writes | 30/min | 10 |

Bank Reads teilen ihr Budget mit Bulk Game Data.

Bei HTTP 429 werden `Retry-After` und `retry_after_ms` respektiert. Aggressives sofortiges Retry ist verboten.

## Mainframe Call cost

Die Mainframe-Anzeige "Call cost" ist die CPU-Nutzung eines Workers als Prozent seines fixen CPU-Budgets.

Sie ist nicht:

- Game-Socket-Aufrufbudget;
- Shell-Kosten;
- MCP/API-Rate-Limit.

V5 verwendet dafuer getrennte Typen/Metriken, sinngemaess:

- `SpielSocketAufrufBudget`;
- `McpAnfrageBudget`;
- `WorkerCpuAuslastung`.

## Action Contracts

Direkte Socket-Actions erhalten:

- Ressource `character:socket_call_budget`;
- globalen Character-Scope;
- Basiskosten-Evidence;
- bekannte statische/dynamische Evidence, soweit belegt;
- `unknownInternalReserveRequired=true`;
- `limitdc`-Recovery als UNKNOWN/Reconcile.

Router wie `buy` werden nicht doppelt bepreist; die konkrete delegierte Socket-Action traegt das Budget. `cave_buy` bleibt wegen ungeklaerter interner Transportsemantik fuer Automation deaktiviert.

## Drift

Call-Cost-/Limit-Semantik ist volatile Source-Evidence.

Nach relevantem Adventure-Land-Update gilt:

1. betroffene Cost-Evidence auf NEEDS_REVALIDATION;
2. keine automatische Erhoehung des V5-Budgets;
3. betroffene Automation fail-closed, wenn die sichere Kostenobergrenze nicht mehr begruendbar ist;
4. erst nach Source-/Live-Revalidierung wieder freigeben.

## Abschluss

P0-07 ist DONE, weil:

- Serverfenster und Serverlimit dokumentiert sind;
- das character-globale gewichtete V5-Budget definiert ist;
- positive Reserve verpflichtend ist;
- Deferred-/Safety-/MCP-/CPU-Systeme getrennt sind;
- `limitdc` sicher in UNKNOWN/Reconciliation fuehrt;
- relevante Action Contracts Budget-Evidence tragen;
- Invarianten, Gefahren, Manifest, Revalidierung und Validator aktualisiert werden.

Dieser Abschluss oeffnet **nicht** das Gameplay-Runtime-Gate. Nach R1 folgt R2.
