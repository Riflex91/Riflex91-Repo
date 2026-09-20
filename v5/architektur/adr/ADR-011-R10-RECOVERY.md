# ADR-011 – R10 Reconciliation- und Recovery-Kernel

**Status:** RATIFIZIERT  
**Datum:** 2026-09-20

## Kontext

R10 muss unklare, partielle und nach Restart wiedergefundene Arbeit so behandeln, dass kein unbekannter Ausgang zu einer doppelten irreversiblen Wirkung fuehrt. R9 hat Admission und Execution-Vertraege getrennt abgesichert; R10 darf diese Grenze nicht durch einen eigenen Send-/Retry-Pfad umgehen.

Das Gameplay-Runtime-Gesamtgate bleibt weiterhin `GESPERRT`. R10 implementiert daher ausschliesslich no-write Recovery-, Reconciliation-, Stop- und Restart-Vertraege.

## Entscheidung

1. Der Recovery-Kernel besitzt absichtlich keinen Send-Pfad und keine Execution-Adapter-Abhaengigkeit.
2. `UNBEKANNT` fuehrt ausschliesslich zu Beobachtung/Abgleich; Same-Intent-Send nach moeglichem Send ist immer verboten.
3. Ein Server-/Promise-Ergebnis ist nur Evidence. Fachlicher `COMMITTED`-Status entsteht erst durch passende Postcondition-/Reconciliation-Evidence.
4. `NICHT_GESENDET` kann ohne Reconciliation als `ABORTED` abgeschlossen werden.
5. `NICHT_AUSGEFUEHRT` erlaubt nur einen neuen Plan mit neuem Intent nach frischer Admission.
6. `TEILWEISE` erzeugt einen diff-basierten Restplan ausschliesslich fuer offene Effekt-Domaenen.
7. `NOCH_AUSSTEHEND` wird bounded erneut beobachtet; nach Ausschopfung endet die Recovery fail-safe.
8. `UNGEKLAERT` fuehrt zu `OPERATOR_REQUIRED`.
9. Jeder In-Flight-Recovery-Vorgang pinnt Knowledge-Commit/Quellenhashes, Config-Fingerprint, Prestate-Fingerprint sowie Action-/Recovery-/Verifier-Vertraege. Spaetere Updates duerfen diesen Kontext nicht still umdeuten.
10. Nichtterminale persistierte Arbeit wird nach Restart nur als `ABGLEICH_ERFORDERLICH` und immer ohne ExecutionAuthority geladen.
11. Stop/Shutdown sperrt zuerst neue Arbeit und reconciliert bereits laufende Transaktionen bounded.
12. Kann eine moeglicherweise irreversible In-Flight-Transaktion beim Stop nicht sicher terminalisiert werden, geht die Laufsteuerung auf `KRITISCH_GESPERRT`.
13. Fehler werden in der kleinsten bekannten Fehlerdomaene degradiert/gesperrt; unabhaengige gesunde Domaenen bleiben nutzbar.
14. Die kanonischen 60 Recovery Contracts werden maschinenlesbar geprueft. 59 sind produktiv verifiziert; `cave_buy` bleibt gemeinsam mit seinem Action Contract deaktiviert.
15. Fuer alle Recovery Contracts ist `sameIntentAfterPossibleSend = NEVER` verbindlich.
16. Disconnect-after-possible-send wird fuer alle 59 produktiven Action-Bindungen fault-injected; der Recovery-Kernel erzeugt dabei keinen erneuten Send und keine doppelte irreversible Wirkung.

## Alternativen

- **Timeout/Disconnect direkt retrien:** verworfen, weil der erste Send bereits committed haben kann.
- **Server-Antwort direkt als COMMIT werten:** verworfen; fachliche Postcondition bleibt Pflicht.
- **Partielle Aktion komplett erneut senden:** verworfen; nur offene Differenz darf neu geplant werden.
- **Restart setzt vorherigen LAEUFT/GESENDET-Zustand fort:** verworfen; Restart verleiht keine ExecutionAuthority.
- **Knowledge-/Config-Update auf In-Flight-Transaktion anwenden:** verworfen; Recovery bleibt an gepinnten Kontext gebunden.
- **Stop verwirft laufende In-Flight-Arbeit:** verworfen; zuerst Admission schließen, dann bounded reconciliieren.
- **Fehler einer Domaene stoppt pauschal alle anderen:** verworfen, solange keine globale Safety-Grenze betroffen ist.

## Konsequenzen

- UNKNOWN kann strukturell keinen Same-Intent-Blind-Retry ausloesen.
- API-/Promise-Erfolg allein kann keinen fachlichen Commit erzeugen.
- Partial Completion fuehrt nur zu einem neuen Restplan, nie zur Wiederholung des Originalintents.
- Persistierter nichtterminaler Zustand wird nach Restart fail-closed geladen.
- Stop verliert keine moeglicherweise irreversible In-Flight-Arbeit durch Zustandvergessen.
- Fehlerdomaenen koennen voneinander isoliert werden.
- Knowledge-/Config-Drift beeinflusst erst einen spaeteren neuen Plan, nicht die Interpretation der laufenden Transaktion.
- R11 kann Observability, Replay, Fault Injection und Operations auf eindeutigen Recovery-Abschluessen aufbauen.
- R10 selbst besitzt keine Gameplay- oder Raw-Write-Autoritaet.

## Invarianten

Betroffen sind insbesondere:

- V5-ALT-006 – jede Mutation besitzt explizite Outcome-/Postcondition-Reconciliation;
- V5-ALT-007 – API-/Promise-Erfolg ist kein fachlicher Commit;
- V5-ALT-008 – nichtterminale persistierte Arbeit wird nie blind fortgesetzt;
- V5-ALT-009 – Restart setzt langlebige Arbeit auf ABGLEICH_ERFORDERLICH;
- V5-ALT-017 – Stop sperrt zuerst neue Arbeit und reconciliert In-Flight bounded;
- V5-INV-023 – Fehler bleiben auf die kleinstmoegliche Domaene begrenzt;
- V5-INV-027 – Knowledge-/Config-Update wird nicht in laufende irreversible Transaktionen injiziert;
- V5-INV-002 – UNKNOWN/Recovery umgeht keine Mehrfach-Verriegelung.

## Migration

R10 erweitert nur die no-write Foundation unter `v5/grundlage/quelle/recovery/**`. Die bestehenden Action-/Recovery-Vertraege bleiben kanonisch. R10 fuehrt keine Runtime-Execution-Adapter und keine Adventure-Land-Schreibaufrufe ein.

Spaetere Runtime-Pfade muessen UNKNOWN an den Recovery-Kernel delegieren und duerfen keinen parallelen Same-Intent-Retry-Pfad einfuehren.

## Rollback

Ein Rollback auf R9 entfernt den Recovery-Kernel ohne Gameplay-Zustandsmigration, da R10 keine produktive Mutation autorisiert. Nichtterminale persisted Evidence bleibt beim Wiederanlauf weiterhin ohne ExecutionAuthority. Ein Rollback darf UNKNOWN nicht in einen direkten Retry-Pfad umwandeln.

## Nachweise

- `v5/grundlage/quelle/recovery/typen.ts`
- `v5/grundlage/quelle/recovery/recovery-kernel.ts`
- `v5/grundlage/quelle/recovery/laufsteuerung.ts`
- `v5/grundlage/quelle/recovery/fehlerdomaenen.ts`
- `v5/grundlage/quelle/recovery/wiederanlauf.ts`
- `v5/grundlage/tests/r10-recovery.test.mjs`
- `v5/grundlage/tests/r10-control.test.mjs`
- `v5/werkzeuge/r10-recovery-abdeckung.mjs`
- `v5/werkzeuge/r10-statische-guards.mjs`
- `v5/werkzeuge/r10-struktur-pruefen.mjs`
- `.github/workflows/v5-r10.yml`
