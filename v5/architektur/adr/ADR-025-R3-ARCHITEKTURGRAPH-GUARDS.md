# ADR-025 – R3 Architekturgraph-, Dependency- und Legacy-Guards

**Status:** RATIFIZIERT  
**Datum:** 2026-09-20

## Kontext

Die bestehenden V5-R3- und R7-Guards blockieren bereits Legacy-Runtime-Imports, Monkey-Patches, Raw Game Writes, direkte Netzwerk-/Dateisystemzugriffe, unbounded Collections und einzelne direkte Fremdmodul-Imports. CAP-046 verlangt zusätzlich einen V5-nativen ArchitectureRuleSet-Nachweis gegen die historischen Risiken Zyklen, Cross-Owner-Imports und alternative Runtime-/Legacy-Pfade.

Die ratifizierte V5-Verfassung fordert mit V5-INV-106 azyklische Layer-/Dependency-Grenzen. Gleichzeitig darf der Guard keine neue Gameplay-Authority erzeugen und keine historischen V3/V4-Runtime-Regeln kopieren.

## Entscheidung

1. Der vollständige relative Importgraph unter `v5/grundlage/quelle/**` wird in R3 statisch auf Zyklen geprüft.
2. Relative Core-Imports dürfen die Core-Quellwurzel nicht verlassen.
3. Produktionsquellen dürfen keine Tests, Werkzeuge, erzeugten Artefakte, Dist-Bundles oder V3/V4-Pfade als relative Produktionsabhängigkeit verwenden.
4. Account-Owner-Domänen sind für diesen Guard:
   - `merchant`
   - `produktion`
   - `koordination`
5. Character-Owner-Domänen sind:
   - `farmer`
   - `kampf`
   - `navigation`
   - `gruppe`
6. Value-Imports zwischen Account-Owner und Character-Owner werden blockiert. Reine Typimporte bleiben erlaubt, weil sie keine Runtime-Authority oder Laufzeitkopplung erzeugen.
7. `grundlage/quelle/runtime/produktions-runtime.ts` darf innerhalb des Cores nur aus der Runtime-Schicht selbst oder über den öffentlichen `index.ts`-Reexport referenziert werden. Fachdomänen dürfen keinen direkten alternativen Runtime-Einstieg erzeugen.
8. Der in `architektur/verfassung.json` deklarierte `layerGraph` wird separat auf eindeutige IDs, gültige Referenzen, Selbstzyklen und allgemeine Zyklen geprüft.
9. Der Guard wird in `npm run lint` integriert und läuft dadurch in R3 sowie allen späteren Phasen, die den gemeinsamen V5-Lint verwenden.
10. Der Guard besitzt ausschließlich Build-/CI-Authority und keine Gameplay- oder Runtime-Authority.

## Alternativen

- **Dependency-Cruiser aus V3 weiterverwenden:** verworfen, weil CAP-046 ausdrücklich V5-Neubau ohne Quellcodewiederverwendung verlangt.
- **Nur bestehende Regex-Guards erweitern:** verworfen, weil ein Zyklus eine Graph-Eigenschaft und keine lokale Dateieigenschaft ist.
- **Alle Cross-Domain-Imports verbieten:** verworfen, weil V5 bewusst typisierte Port-/Evidence-Verträge zwischen Domänen verwendet und reine Typkopplung keine Runtime-Authority erzeugt.
- **Ordner direkt auf alle abstrakten Verfassungs-Layer mappen:** verworfen, weil mehrere aktuelle V5-Ordner mehr als eine fachliche Rolle enthalten und eine künstliche 1:1-Zuordnung neue Architektursemantik erfinden würde.

## Konsequenzen

- Neue Importzyklen werden vor Merge blockiert.
- Neue direkte Account↔Character-Runtime-Kopplungen werden blockiert.
- Tests, Werkzeuge, Buildartefakte und Legacy-Runtime können nicht still Produktionsabhängigkeit werden.
- Die bereits ratifizierte LayerGraph-Azyklizität wird technisch geprüft.
- Typisierte Verträge bleiben über Owner-Grenzen möglich.
- Bestehende R3/R7-Schutzschichten bleiben zusätzlich aktiv.

## Invarianten

- V5-INV-001 – V3/V4-Runtimecode wird nicht still übernommen.
- V5-INV-018 – keine alternative Gameplay-Runtime vor/außerhalb der freigegebenen V5-Grenzen.
- V5-INV-022 – Host/Bridge ohne Gameplay-Authority.
- V5-INV-106 – azyklische Layer-/Dependency-Grenzen.
- Planung ist nicht Execution.
- Typimport erteilt keine Runtime-Authority.
- Build-/Guard-Code erteilt keine Gameplay-Authority.

## Migration

Bestehende R3- und R7-Guards werden nicht ersetzt. CAP-046 ergänzt einen eigenständigen Architekturgraph-Guard unter `v5/werkzeuge/**` und bindet ihn in die vorhandenen R3-Skripte ein.

Historische V3-Dateien `.dependency-cruiser.cjs`, `runtime-composition-guard.js` und `legacy-reliability-layer-guard.js` dienen nur als Verhaltenswissen. Ihr Quellcode und ihre Runtime-Struktur werden nicht übernommen.

## Rollback

Bei einem Fehler im neuen Guard kann ausschließlich der neue Architekturgraph-Guard samt Script-/Testverdrahtung zurückgenommen werden. Bestehende R3/R7-Schutzmechanismen bleiben bestehen.

Ein Rollback darf nicht:
- Legacy-Runtime-Imports erlauben,
- Cross-Owner-Value-Imports freigeben,
- Importzyklen als akzeptiert markieren,
- oder alternative Runtime-Pfade als neuen Standard etablieren.
