# ADR-0001 – V5 als neuer Runtime-Kern

**Status:** ACCEPTED  
**Datum:** 2026-09-19

## Entscheidung

Die langfristige Zielarchitektur wird als **V5** neu aufgebaut.

V3 und V4 werden nicht geloescht und nicht entwertet:

- V3 = Wissens-, Fehler-, Test- und Produktionsbeobachtungsquelle.
- V4 = validierter Architekturprototyp, Capability-/Telemetry-/Replay-/Release-Gate-Erfahrung und Komponentenquelle.
- V5 = neuer Kern, dessen Grundprimitive von Beginn an auf den realen Adventure-Land-Transaktions- und Recovery-Eigenschaften basieren.

## Warum

Die aktuelle externe Recherche bestaetigt mehrere Systemeigenschaften, die fuer einen autonomen 24/7-Bot fundamental sind:

- Definition Truth und Live Truth sind getrennte Ebenen.
- Inventory-Indizes und Entity-Referenzen driften.
- mehrere Legacy-Actions teilen FIFO-Deferred-Kanaele.
- wertbewegende Aktionen wie `send_item`/`send_gold` sind nicht idempotent.
- Upgrade, Compound und Exchange sind mehrphasig.
- Batch-Aktionen koennen teilweise abgeschlossen sein.
- ein Disconnect kann den Kenntnisstand des Bots vom tatsaechlichen Serverzustand trennen.
- `UNKNOWN` ist deshalb ein legitimer Operationszustand.
- Reconciliation muss vor Retry kommen.

V4 kann diese Konzepte technisch nachruesten. Der bestehende Kern ist jedoch bereits stark um die kurzlebige `AktionsAnfrage` herum aufgebaut. Ein dauerhafter Zusatz aus Workflow-, Transaction-, Reconcile- und Compatibility-Schichten wuerde genau die historische Schichtbildung beguenstigen, die V5 vermeiden soll.

## V5-Grundfluss

```text
Knowledge / Definitions
  -> Observed Evidence
  -> Reconciled World Truth
  -> Demand / Goal
  -> Workflow Planning
  -> Global Scheduler
  -> Resource + Authority + Action-Channel Admission
  -> Transaction Intent / Journal
  -> Execution Adapter
  -> Server Result
  -> Postcondition Observation
  -> Commit | Unknown | Reconcile
```

`Workflow`, `Transaction`, `Action`, `Resource`, `Evidence`, `Outcome` und `Reconciliation` sind gleichrangige Kernkonzepte.

## Account- und Character-Ebene

V5 trennt:

- **Account Coordinator** fuer accountweite Ziele/Ressourcen wie Bank, Merchant, Production, gemeinsame Budgets und Gruppenkoordination.
- **Character Agents** fuer character-lokale Beobachtung, Movement, Combat, Skills und Ausfuehrung.

Accountweite Regeln werden dadurch nicht als zufaellige lokale Locks modelliert.

## Wiederverwendung

Kandidaten fuer Portierung oder gezielten Umbau:
- Capability Truth;
- kontrollierte `ausfuehrung/`-Grenze;
- Telemetrie- und Explainability-Prinzipien;
- Replay;
- Health-/Recovery-Diagnostik;
- Release-, Shadow-, Controlled-Live- und Soak-Gates;
- Wissensbasis und V3-Audit.

Nicht automatisch als V5-Kern zu portieren:
- heutige `AktionsSteuerung` als Top-Level-Orchestrator;
- heutiges Ressourcenmodell als vollstaendiges V5-Lockmodell;
- Checkpoints, die offene `AktionsAnfrage`-Kennungen als zentrale Recovery-Einheit behandeln;
- V4-Pfade, deren Grundannahme ein atomarer Side Effect als oberste Arbeitseinheit ist.

Jede Wiederverwendung braucht eine explizite Migrationsentscheidung.

## Konsequenz

Block 8.7 wird nicht als neuer V4-Runtime-Layer weiterimplementiert.

Vor V5-Runtime-Code werden Wissensbasis, P0-Research, V5-Verfassung, Kernvertraege, Migrationsmatrix und Master-Roadmap konsolidiert.
