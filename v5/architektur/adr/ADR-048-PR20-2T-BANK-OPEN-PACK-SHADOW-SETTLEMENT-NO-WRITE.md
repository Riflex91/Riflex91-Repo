# ADR-048 – PR20.2t Open-Bank-Pack Shadow + Mixed-Path Settlement, NO-WRITE

**Status:** ANGENOMMEN  
**Stand:** 2026-09-22

## Kontext

`open_bank_pack(pack, currency, timeout_ms)` ist kein normaler einzelner Bankpfad. Der Goldpfad nutzt den FIFO-`bank`-Deferred-Kanal; der Shellpfad kann nach dem Bank-Acknowledge `in_progress` liefern und wird danach per Request-ID/Backend-Ergebnis abgeschlossen. Beide Pfade sind wertveraendernd und nicht idempotent.

Der direkte Ingame-Shadow auf `a5b010be412ee69d2402a0a4f1f427a2f1a44a34` hat `items2` als ersten gesperrten kostenpflichtigen Pack beobachtet: 75.000.000 Gold oder 600 Shells. Vorhanden waren 15.993.820 Gold und 0 Shells. Damit ist ein Live-Unlock aktuell fachlich nicht admissible.

## Entscheidung

1. Es gibt **keinen** Open-Pack-Live-Button und keine Gameplay-Authority.
2. Der reale Shadow wird als zero-write Evidence persistiert.
3. Der Settlement-Core bindet den Zahlungsweg **vor** einem spaeteren Send durable.
4. Gold COMMIT erfordert Pack-Unlock + exakt negatives Gold-Kostendelta + unveraenderte Shells.
5. Shell COMMIT erfordert Pack-Unlock + exakt negatives Shell-Kostendelta + unveraendertes Gold.
6. Shell-`IN_PROGRESS` ist `AUSSTEHEND`: warten/reobserve, niemals Same-Intent-Retry.
7. Teilwirkung, Restbank-Drift oder unklare Pfadidentitaet bleibt fail-closed.
8. Live bleibt gesperrt, solange weder Gold noch Shells den beobachteten Preis decken.

## Folge

PR20.2 gewinnt belastbare Mixed-Path-Recovery-Semantik, ohne Gold/Shells auszugeben und ohne den Testzähler einer mutierenden Open-Pack-Funktion zu berühren.
