# ADR-010 – R9 Admission- und Execution-Grenze

**Status:** RATIFIZIERT  
**Datum:** 2026-09-20

## Kontext

R9 verbindet die bis R8 getrennt aufgebauten Sicherheitsnachweise zu einer einzigen Admission-Grenze unmittelbar vor einer spaeteren Mutation. Die Phase muss beweisen, dass ein Ausfuehrer weder durch einen Planer, noch durch einen einzelnen Boolean, noch durch einen stale Lock, stale Preconditions oder fehlende Persistenz autorisiert werden kann.

Gleichzeitig bleibt das Gameplay-Runtime-Gesamtgate weiterhin `GESPERRT`. R9 darf die Execution-Grenze spezifizieren und no-write testen, aber noch keine produktive Adventure-Land-Runtime oder Raw-Write-Adapter unter dem gesperrten Top-Level-Runtime-Pfad bereitstellen.

## Entscheidung

1. Riskante Ausfuehrung akzeptiert ausschliesslich eine nominal typisierte `ErteilteAusfuehrungsFreigabe`.
2. Die Freigabe besitzt einen privaten Konstruktor und kann nur ueber die zentrale Admission erteilt werden.
3. Admission verlangt ein explizit freigegebenes Laufzeit-Gate. Solange Readiness `GESPERRT` ist, kann die produktive Admission nicht erfolgreich sein.
4. Capability-/Owner-Authority und Operator-Deny sind unabhaengige Verriegelungen.
5. Action Contract, Recovery Contract und Postcondition-Verifier werden gemeinsam geprueft und an die Freigabe gebunden.
6. Die fuer die Aktion geforderten Sicherheitsinvarianten muessen im Vertragsnachweis vorhanden sein.
7. Durable Transaction Intent wird an Auftrag, Workflow, Capability, Owner, Action Contract, Recovery Contract und Verifier gebunden.
8. Ohne bestaetigtes durable Intent entsteht keine wertveraendernde Ausfuehrungsfreigabe.
9. Ressourcen-/Lease-Fencing, Action-Channel-Fencing und character-globales Socket-Budget werden unmittelbar bei Admission revalidiert.
10. Live-Preconditions werden unmittelbar bei Admission frisch revalidiert und muessen die gesamte kurze Freigabegueltigkeit abdecken.
11. Freigaben sind kurzlebig und werden im Execution-Kernel direkt vor Adapteraufruf erneut auf Ablaufzeit und Adapter-Vertragsbindung geprueft.
12. Ein loses Objekt oder ein selbstgebauter Boolean ist keine Ausfuehrungsfreigabe.
13. Adapterergebnisse unterscheiden Server-Ergebnis, nicht gesendet und unbekannten Ausgang. UNKNOWN wird nie in Erfolg umgedeutet.
14. Raw Game Writes bleiben statisch nur unter `ausfuehrung/quelle/adapter/**` erlaubt. Solange das Gameplay-Gate gesperrt ist, bleibt dieser Top-Level-Runtime-Pfad absent.
15. Der R9-Vertragskatalog bindet alle 60 wertrelevanten Action Contracts an Recovery und Verifier. 59 sind produktiv verifiziert; `cave_buy` bleibt explizit deaktiviert.

## Alternativen

- **Planer darf direkt Adapter aufrufen:** verworfen, weil Planungswissen keine Write-Authority ist.
- **Ein einzelnes `allowed=true` reicht als Freigabe:** verworfen, weil dadurch unabhaengige Verriegelungen zusammenfallen.
- **Durable Intent erst nach Send persistieren:** verworfen, weil Crash/Timeout dann keine belastbare Transaktionsprovenienz besitzen.
- **Stale Fencing oder stale Live-State tolerieren:** verworfen; unklare Frische ist Default-Deny.
- **Adapter entscheidet selbst ueber Recovery/Verifier:** verworfen; Action/Recovery/Verifier werden vor Send explizit gebunden.
- **Execution-Top-Level trotz gesperrtem Runtime-Gate anlegen:** verworfen; R9 bleibt no-write und respektiert die R3-Struktursperre.
- **UNKNOWN wie Failure behandeln und direkt wiederholen:** verworfen; unbekannter Ausgang muss in R10 reconciled werden.

## Konsequenzen

- Ohne Laufzeitfreigabe ist produktive Admission technisch blockiert.
- Jede fehlende Verriegelung blockiert unabhaengig.
- Abgelaufene Freigaben, falsche Adaptervertraege, stale Live-Preconditions und stale Fencing werden vor Send abgelehnt.
- Persistenzfehler vor durable Intent verhindern Admission.
- Die 59 produktiv verifizierten Action-Familien besitzen eine maschinenlesbare Action/Recovery/Verifier/Invarianten-Bindung.
- Die unvollstaendig bekannte `cave_buy`-Semantik bleibt fail-closed deaktiviert.
- R10 kann UNKNOWN, Reconciliation, Partial Settlement und Restart Recovery auf einem klaren Admission-/Execution-Vertrag aufbauen.
- R9 selbst besitzt weiterhin keine Gameplay- oder Raw-Write-Autoritaet.

## Invarianten

Betroffen sind insbesondere:

- V5-ALT-002 – direkte Writes nur in der Execution-Schicht;
- V5-ALT-003 – Domain-Policy bleibt ausserhalb des Execution-Adapters;
- V5-INV-002 – riskante Mutationen benoetigen mehrere unabhaengige Verriegelungen;
- V5-INV-004 – riskante Ausfuehrung benoetigt typisierte, nicht abgelaufene Freigabe;
- V5-INV-005 – Ausfuehrer revalidiert die Freigabe direkt vor Write;
- V5-ALT-024 – Live-Preconditions werden unmittelbar vor Mutation frisch geprueft.

## Migration

R9 erweitert weiterhin ausschliesslich die no-write Foundation unter `v5/grundlage/**`. Es wird kein produktiver Top-Level-`v5/ausfuehrung/`-Runtimepfad angelegt. Spaetere freigegebene Execution-Adapter muessen die hier definierten typisierten Ports und Freigaben verwenden und duerfen die Admission nicht umgehen.

Die vorhandenen 60 Action- und Recovery-Contracts bleiben kanonische Wissensquellen. R9 ergaenzt daraus den Verifier-Katalog und die maschinenlesbaren Action/Recovery/Verifier/Invarianten-Bindungen.

## Rollback

Ein Rollback auf R8 entfernt den Admission-/Execution-Kernel ohne Gameplay-Zustandsmigration, da R9 keine produktive Mutation autorisiert. Bereits erzeugte Testfreigaben oder In-Memory-Nachweise duerfen nach Rollback nicht weiterverwendet werden. Bei unklarer Authority bleibt das System fail-closed.

## Nachweise

- `v5/grundlage/quelle/ausfuehrung/ports.ts`
- `v5/grundlage/quelle/ausfuehrung/intent-bindung.ts`
- `v5/grundlage/quelle/ausfuehrung/admission.ts`
- `v5/grundlage/quelle/ausfuehrung/ausfuehrungs-kernel.ts`
- `v5/grundlage/vertraege/r9/verifier-katalog.json`
- `v5/grundlage/vertraege/r9/action-bindungen.json`
- `v5/grundlage/tests/r9-admission-execution.test.mjs`
- `v5/werkzeuge/r9-vertragsabdeckung.mjs`
- `v5/werkzeuge/r9-statische-guards.mjs`
- `v5/werkzeuge/r9-struktur-pruefen.mjs`
- `.github/workflows/v5-r9.yml`
