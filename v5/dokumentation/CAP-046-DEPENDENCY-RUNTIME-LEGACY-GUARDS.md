# CAP-046 – Dependency / Runtime / Legacy Guards

**Status:** IMPLEMENTIERT / BUILD-ONLY  
**Stand:** 2026-09-20

## Ziel

CAP-046 schließt die verbliebene statische Architektur-Lücke der V5-R3-Guards:

- Dependency-Cycles;
- Cross-Owner-Value-Imports;
- alternative Runtime-Pfade;
- Legacy-/Test-/Tool-/Buildartefakt-Abhängigkeiten.

Die Implementierung ist ein reiner Build-/CI-Guard. Sie besitzt keine Gameplay-, Runtime- oder Raw-Write-Authority.

## Neue Artefakte

- `v5/werkzeuge/r3-architekturgraph-regeln.mjs`
- `v5/werkzeuge/r3-architekturgraph-pruefen.mjs`
- `v5/werkzeuge/tests/r3-architekturgraph.test.mjs`
- `v5/architektur/adr/ADR-025-R3-ARCHITEKTURGRAPH-GUARDS.md`

## Importgraph

Alle TypeScript-Coredateien unter `v5/grundlage/quelle/**` werden als gerichteter Importgraph ausgewertet.

Relative Imports werden auf konkrete V5-Coredateien aufgelöst. Der Guard blockiert:

- direkte oder indirekte Zyklen;
- nicht auflösbare relative Core-Imports;
- relative Imports, die die Core-Quellwurzel verlassen.

## Legacy- und Altpfade

Als Produktionsabhängigkeit verboten sind Importpfade in:

- V3;
- V4;
- Tests;
- Werkzeuge;
- erzeugte Buildartefakte;
- Dist-Bundles.

Damit kann historischer oder generierter Code nicht still zu einer V5-Runtime-Abhängigkeit werden.

## Cross-Owner

Die ratifizierte Authority-Grenze wird statisch abgebildet:

**Account-Owner:**
- Merchant;
- Produktion;
- Koordination.

**Character-Owner:**
- Farmer;
- Kampf;
- Navigation;
- Gruppe.

Ein **Value-Import** zwischen diesen Owner-Gruppen wird blockiert.

Gemeinsame ausführbare Verträge werden nicht über Owner-Grenzen gezogen, sondern in neutrale Core-Grenzen verschoben. Die generische Skill-Capability-Validierung lebt deshalb nun unter `grundlage/quelle/faehigkeiten/skill-capability.ts`; `kampf/skill-capability.ts` bleibt nur als kompatibler Reexport.

Reine Typimporte bleiben erlaubt. Dazu zählen:

- `import type { ... }`;
- `import { type A, type B }`.

Damit können Evidence-/Port-Verträge typisiert geteilt werden, ohne Runtime-Authority oder ausführbaren Code über Owner-Grenzen zu ziehen.

## Runtime-Altpfad

Der konkrete Produktionsruntime-Kern
`grundlage/quelle/runtime/produktions-runtime.ts`
darf nicht direkt aus einer Fachdomäne als alternativer Runtime-Einstieg importiert werden.

Zulässig bleiben:

- Runtime-interne Komposition;
- der öffentliche Index-Reexport.

## Ratifizierter LayerGraph

Zusätzlich wird `architektur/verfassung.json -> layerGraph` technisch geprüft auf:

- `azyklisch=true`;
- eindeutige Layer-IDs;
- nur bekannte Dependency-Referenzen;
- keine Selbstzyklen;
- keine allgemeinen Layer-Zyklen.

Der Guard erfindet bewusst **keine** künstliche 1:1-Zuordnung jedes aktuellen Ordners zu einem abstrakten Verfassungs-Layer.

## Bestehende Schutzschichten bleiben erhalten

CAP-046 ersetzt nicht:

- `r3-statische-guards.mjs`;
- `r7-statische-guards.mjs`;
- Capability-/Owner-Authority;
- Action Contracts;
- Admission;
- Operator-Deny / Kill Switch;
- Durable Intent;
- Recovery/Reconciliation.

Insbesondere bleiben weiterhin separat blockiert:

- Monkey-Patches;
- Raw Game Writes;
- direkter Netzwerkzugriff;
- direkter Dateisystemzugriff;
- direkte Systemzeit/Zufall;
- unbounded Collections;
- Knowledge-Writer-/Snapshot-Bypässe;
- Geheimnis-Literale.

## CI-Integration

`package.json` enthält jetzt:

- `architekturgraph:pruefen`;
- den Architekturgraph-Guard innerhalb von `lint`;
- die neuen Regressionstests innerhalb von `guards:test`.

Dadurch läuft CAP-046 nicht nur in R3, sondern automatisch auch in späteren V5-Phasen, die den gemeinsamen Lint aufrufen.

## Regressionstests

Abgedeckt werden:

- direkter Importzyklus;
- azyklischer positiver Fall;
- Account -> Character Value-Import;
- Character -> Account Value-Import;
- erlaubter `import type`;
- erlaubter `import { type ... }`;
- V3/V4-Altpfad;
- Test-/Werkzeug-/erzeugt-/dist-Abhängigkeit;
- Import außerhalb der Core-Quellwurzel;
- direkter Runtime-Nebenpfad;
- erlaubte Runtime-interne Komposition;
- Dynamic Import / Require als Value-Abhängigkeit;
- valider deklarierter LayerGraph;
- Layer-Zyklus;
- unbekannte Layer-Referenz.

## Legacy-Bezug

Die historischen V3-Artefakte:

- `v3/.dependency-cruiser.cjs`;
- `v3/scripts/runtime-composition-guard.js`;
- `v3/scripts/legacy-reliability-layer-guard.js`;

wurden nur als Verhaltenswissen ausgewertet.

Es wurde kein V3/V4-Guard- oder Runtimecode in V5 kopiert.
