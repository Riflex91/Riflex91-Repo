# V5 – Entwicklungs-Wissensgate

**Status:** VERBINDLICH FUER JEDE V5-ENTWICKLUNG  
**Stand:** 2026-09-19

## 1. Zweck

Die lebende Wissensbasis unter `v5/wissensbasis/**` ist ab jetzt ein aktiver Bestandteil des Entwicklungsprozesses.

Kein Entwickler, kein KI-Assistent und spaeter kein Bot-Modul darf V5 gegen einen beliebigen oder veralteten Wissensstand entwickeln.

**Grundsatz:**

> Vor Planung, Implementierung, Review und Merge wird der aktuelle Wissensstand beruecksichtigt. Bei relevanter Drift wird nicht weiterprogrammiert, bis die Auswirkung verstanden und die strukturierte Wissensbasis revalidiert wurde.

## 2. Kanonischer Einstiegspunkt

Jeder Konsument beginnt bei:

```text
v5/wissensbasis/manifest.json
```

Der Manifest verweist auf:

### Strukturierte Wissensschicht

- Quellenregister;
- Facts mit stabilen Kennungen;
- Action Contracts;
- offene Fragen;
- Revalidierungsqueue;
- Schemas;
- externe Research-Snapshots.

### Laufende Waechterdaten

- `datenbank/letzter-lauf.json`;
- `datenbank/quellenstatus.json`;
- `datenbank/aenderungsprotokoll.jsonl`;
- `datenbank/kandidaten.json`;
- `datenbank/aktuell/**`.

Konsumenten duerfen keine dieser Pfade erraten. Sie lesen sie ueber den Manifest.

## 3. Autoritaetsstufen

### Stufe A0 – live verifizierte Bot-Evidence

Der GitHub-Spiegel unter `v5/wissensbasis/live/snapshot/**` ist die staerkste Evidence fuer **den exakt beobachteten konkreten Zustand** zu Zeitpunkt/Server/Map/Scope des Facts.

Er ist nicht automatisch die staerkste Quelle fuer allgemeine Definitionen, Formeln oder Action Contracts. Eine einzelne Beobachtung darf nicht zu einer universellen Spielregel generalisiert werden.

### Stufe A – frische offizielle Evidence

Aktuelle offizielle Live-/MCP-/CODE-Dokumentation, offizieller Source und offizielle Game-Daten.

Sie sind die staerkste externe Evidence fuer die aktuelle Spielversion.

### Stufe B – strukturierte V5-Wissensbasis

Facts, Contracts und revalidierte Entscheidungen.

Sie sind die kanonische Entwicklungsbasis, muessen aber bei Drift gegen Stufe A revalidiert werden.

### Stufe C – archivierte Research-Evidence

Externe Research-Snapshots und historische Quellen.

Sie erklaeren Entscheidungen und bekannte Risiken, sind aber nicht automatisch aktuelle Spielwahrheit.

### Stufe D – Community-Evidence

Community-Repositories und bestaetigte Community-Beobachtungen koennen Hinweise liefern.

Sie duerfen offizielle Evidence nicht still ueberstimmen.

### Stufe E – Kandidaten

`datenbank/kandidaten.json` besitzt **null Entwicklungs- und null Gameplay-Autoritaet**.

Die Kandidatensuche kann false positives enthalten. Ein Kandidat darf nur eine Recherche-/Verifikationsaufgabe erzeugen.

## 4. Pflichtreihenfolge vor jeder Entwicklungsarbeit

Vor einer fachlichen V5-Aenderung:

1. aktuellen `main` holen;
2. `manifest.json` lesen;
3. `datenbank/letzter-lauf.json` pruefen;
4. `datenbank/quellenstatus.json` pruefen;
5. seit dem letzten bekannten Entwicklungsstand relevante Eintraege im Aenderungsprotokoll pruefen;
6. Revalidierungsqueue und offene P0/P1/P2-Fragen fuer den Bereich pruefen;
7. relevante Facts und Action Contracts lesen;
8. relevante aktuelle Roh-Snapshots nur als Evidence hinzuziehen;
9. erst dann planen oder implementieren.

Bei Merchant-Arbeit gehoeren beispielsweise Items, Recipes, Functions, Server, CODE Functions und relevante Notes zur Pflichtsicht.

Bei Combat-Arbeit gehoeren Skills, Classes, Monsters, Maps und relevante Server-/Functions-Evidence zur Pflichtsicht.

## 5. Pflicht vor Merge

Unmittelbar vor Merge einer V5-Implementierung:

1. der Branch muss den aktuellen `main` enthalten;
2. der letzte Wissenswaechterlauf muss innerhalb des erlaubten Frischefensters liegen;
3. relevante offizielle Quellen duerfen keinen Abruffehler und keine unerklaerte Kuerzung besitzen;
4. seit Branch-/Planungsbeginn geaenderte relevante Quellen muessen erneut bewertet sein;
5. betroffene Facts/Contracts muessen revalidiert oder die Capability muss gesperrt sein;
6. der strenge Entwicklungs-Wissensgate muss gruen sein.

Ein vorher gruenes CI ersetzt diese letzte Wissenspruefung nicht, wenn `main` seitdem durch den Wissenswaechter weitergelaufen ist.

## 6. Frischefenster

Der Wissenswaechter soll alle 60 Minuten laufen.

Fuer echte V5-Implementierung gilt:

- bis 120 Minuten: normal;
- ueber 120 Minuten: Warnzustand;
- ueber 180 Minuten: **Implementierung/Merge gesperrt**, bis ein neuer erfolgreicher Lauf vorliegt.

Research-/Dokumentationsarbeit darf bei stale Waechter weitergehen, muss den stale Zustand aber sichtbar benennen und darf keine neue Gameplay-Autoritaet freigeben.

## 7. Relevante Drift

Nicht jede HTML-Aenderung besitzt dieselbe Bedeutung.

### Contract-kritisch

Aenderungen an folgenden Quellen blockieren betroffene Implementierung bis zur Bewertung:

- MCP-/AI-Guide;
- CODE Functions;
- runner_functions.js;
- functions.js;
- server.js;
- server_functions.js.

### Domaenenkritisch

Aenderungen an Game-Daten blockieren die jeweils betroffene Domaene:

- classes -> Klassen/Combat/UI;
- skills -> Skills/Combat/UI;
- items -> Inventory/Merchant/UI;
- monsters -> Combat/World/UI;
- maps -> Navigation/World;
- events -> Events/World;
- recipes -> Craft/Production/Merchant.

### Signal-/Review-Quellen

Update Notes, Docs-Hub und Repository-Metadaten koennen Aenderungsalarme erzeugen, ohne automatisch das gesamte Projekt zu blockieren. Ihre Aenderung muss auf fachliche Relevanz geprueft werden.

### Community

Aenderung erzeugt Hinweis, aber keine automatische Sperre oder Freigabe, solange kein bestehender verifizierter Contract davon abhaengt.

## 8. Roh-Snapshot ist keine Ausfuehrungs-API

Dateien unter:

```text
v5/wissensbasis/datenbank/aktuell/**
```

sind aktuelle Evidence-Snapshots.

Entwicklungslogik darf daraus Erkenntnisse ableiten.

Spaetere Runtime-Gameplay-Logik darf sie **nicht direkt parsen und daraus mutieren**.

## 9. Spaeterer Bot-Zugriff

Der Bot erhaelt einen typisierten, read-only `WissensZugriffPort`.

Zielpfad:

```text
GitHub / lokaler Knowledge Snapshot
  -> Schema- und Integritaetspruefung
  -> WissensSnapshot
  -> WissensZugriffPort
  -> Planung / Capability-Revalidierung
```

Nicht erlaubt:

```text
Merchant -> GitHub TXT laden -> Wert lesen -> sofort kaufen/verkaufen
```

Der `WissensSnapshot` traegt mindestens:

- Git-Commit des Wissensstands;
- Zeitpunkt des letzten Waechterlaufs;
- Hashes der relevanten Quellen;
- referenzierte Fact-/Contract-Kennungen;
- Drift-/Widerspruchsstatus.

## 10. Snapshot-Pinning

Ein laufender Workflow wird nicht still durch einen neuen GitHub-Wissensstand umgedeutet.

Bei Planung wird der verwendete Wissensstand referenziert.

Kommt waehrend einer irreversiblen Transaktion neues Wissen:

- laufende Transaktion behaelt ihre bisherigen Sicherheitsannahmen;
- Live-State und Postconditions entscheiden Recovery;
- neuer Wissensstand kann weitere neue Aktionen sperren;
- nach Settlement wird neu geplant.

## 11. Live Truth bleibt letzte Ausfuehrungsgrenze

Auch ein minutenaktueller, offiziell belegter Knowledge Snapshot ist keine ausreichende Mutationserlaubnis.

Unmittelbar vor einem Game Write gelten weiterhin:

- frische Live Preconditions;
- aktuelle Item-/Entity-/RID-Aufloesung;
- Owner/Capability;
- Locks/Fencing;
- Journalzustand;
- Operator Policy;
- Action Contract;
- Postcondition/Reconciliation.

## 12. Entwicklungsnachweis

Jede spaetere produktive Capability muss rueckverfolgbar festhalten:

- welche Fact-/Contract-Kennungen verwendet wurden;
- welcher Knowledge-Git-Commit zugrunde lag;
- welche aktuellen Quellen relevant waren;
- welche Driftpruefung erfolgt ist;
- welche Tests die Annahmen absichern.

## 13. Aktuell beobachtete Strukturhinweise

Beim ersten echten Wissenswaechter-Lauf wurden 21 automatisch ueberwachte Quellen geschrieben. Das Quellenregister enthaelt 22 Eintraege; der zusaetzliche Eintrag ist der manuell archivierte Research-Snapshot und muss nicht stuendlich ueberwacht werden.

Die Kandidatensuche hat beim ersten Lauf mehrere offensichtlich themenfremde Treffer geliefert. Das bestaetigt die Regel: Kandidaten sind ausschliesslich Recherchehinweise.

Das Aenderungsprotokoll muss technisch echtes JSONL sein: **genau ein kompaktes JSON-Objekt pro Zeile**. Mehrzeilig eingerueckte JSON-Objekte sind fuer den maschinellen Konsum nicht zulaessig.

## 14. Leitsatz

**Kein V5-Code gegen Erinnerung entwickeln. Immer gegen den aktuellen, validierten Wissensstand entwickeln – und vor jedem irreversiblen Write trotzdem die Live-Welt erneut beweisen.**


## 15. Lokale SSD-Live-Wissensquelle

Die Entwicklungsquelle fuer vom Bot live bestaetigte Beobachtungen ist der von der Bridge gespiegeltete Bereich `v5/wissensbasis/live/snapshot/**`.

Der lokale Primaerpfad `D:\AdventureLand-V5\wissensdatenbank` wird von Entwicklungswerkzeugen nicht direkt vorausgesetzt. Dadurch bleibt die Entwicklung reproduzierbar ueber GitHub, waehrend der laufende Bot lokal schneller persistieren kann.

Fuer Runtime gilt spaeter: In-Memory/Reconciled Live Truth > lokaler persistierter Live-Fakt > GitHub-Spiegel, jeweils nur innerhalb ihres exakten Freshness-/Scope-Vertrags. Keine dieser Evidenzebenen ersetzt die Mutation Admission.
