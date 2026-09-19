# V5 – Deutsche Namen und extreme Narrensicherheit

> **Status:** VERBINDLICHER V5-ARCHITEKTURSTANDARD  
> **Gilt fuer:** alle V5-eigenen Quelltexte, Typen, Klassen, Funktionen, Variablen, Zustaende, Ereignisse, Fehlergruende, Capabilities, Workflows, Transaktionen, Schemafelder, interne Protokolle, Ordner, Dateien, Meldungen und Dokumentation.  
> **Ausgangspunkt:** V4 `dokumentation/NAMEN_UND_MELDUNGEN.md`. V5 uebernimmt diesen Standard als Mindestniveau und verschaerft ihn.

## 1. Deutsche Sprache ist Architekturregel

Alle von uns kontrollierten V5-Bezeichnungen sind deutsch.

Dazu gehoeren insbesondere:

- Klassen und Typen;
- Schnittstellen und Ports;
- Funktionen und Methoden;
- Variablen und Parameter;
- Enum-/Union-Zustaende;
- Workflow- und Transaktionsphasen;
- Ereignisse;
- Fehler- und Abbruchgruende;
- Capability-Namen;
- Ressourcenbezeichnungen;
- interne Nachrichtenfelder;
- eigene JSON-/Persistenz-Schemafelder;
- Ordner und Dateien;
- Nutzer- und Diagnosemeldungen.

Beispiele:

```ts
beobachteSpielZustand()
erstelleVersorgungsAuftrag()
planeBankEinlagerung()
kannAusfuehrungFreigeben()
fuehreGegenstandTransferAus()
gleicheUnklareTransaktionAb()
```

Beispiele fuer V5-Zustaende:

```text
ANGELEGT
GEPLANT
WARTET_AUF_VORAUSSETZUNG
BEREIT
LAEUFT
WARTET_AUF_BEOBACHTUNG
SICHER_UNTERBRECHBAR
PAUSIERT
ABGLEICH_ERFORDERLICH
ABGESCHLOSSEN
ABGEBROCHEN
SICHER_FEHLGESCHLAGEN
BEDIENER_ERFORDERLICH
UNBEKANNT
```

Englische Begriffe in bestehenden V5-Planungsdokumenten oder fruehen Wissensartefakten sind **kein Freibrief fuer Runtime-Code**. Vor R2-Abschluss werden alle von V5 kontrollierten maschinenlesbaren Kernschemata und Runtime-Namen in die verbindliche deutsche Domaenensprache ueberfuehrt.

## 2. Erlaubte Ausnahmen

Englische oder externe Namen sind nur erlaubt, wenn wir sie nicht kontrollieren.

Beispiele:

- Adventure-Land-Rohfunktionen wie `send_item`, `upgrade`, `smart_move`;
- Adventure-Land-Rohfelder wie `ctype`, `q`, `rid`;
- TypeScript-/JavaScript-/Node.js-APIs;
- standardisierte Dateinamen wie `package.json`, `tsconfig.json`;
- GitHub-Actions-Schluessel;
- externe Protokoll- oder Bibliotheksfelder, wenn deren Schreibweise vorgeschrieben ist.

Diese Namen duerfen nur an der jeweiligen Systemgrenze existieren.

Beispiel:

```ts
// Adventure-Land-Adapter
await send_item(zielName, inventarIndex, menge);

// V5-Domaene
await gegenstandTransferAusfuehrer.fuehreGegenstandTransferAus(freigabe);
```

Adventure-Land-Rohsprache darf nicht durch Fachmodule, Scheduler, Persistenz oder Domaenentypen sickern.

## 3. V4-Namensstandard bleibt Mindeststandard

Die V4-Regeln bleiben fuer V5 mindestens erhalten:

- `ist...` fuer reine Zustandsfragen;
- `hat...` fuer Besitz/Vorhandensein;
- `kann...` fuer Berechtigungs-/Machbarkeitspruefung ohne Ausfuehrung;
- `soll...` fuer Strategie-/Regelentscheidung;
- `lies...` fuer reines Lesen;
- `finde...` fuer Suche;
- `liste...` fuer Sammlungen;
- `erstelle...` fuer Daten/Planaufbau;
- `berechne...` fuer deterministische Berechnung;
- `schaetze...` fuer Unsicherheit/Prognose;
- `beurteile...` fuer fachliche Klassifikation;
- `waehle...` fuer Auswahl;
- `plane...` fuer Planung ohne Seiteneffekt;
- `fordere...An` fuer Anfragen;
- `beobachte...` fuer Weltaufnahme;
- `erfasse...` fuer Evidence/Ergebnis;
- `fuehre...Aus` ausschliesslich fuer echte Ausfuehrung;
- `gleiche...Ab` fuer Reconciliation;
- `validiere...` prueft und repariert niemals still;
- `speichere...` / `lade...` fuer Persistenz;
- `lerne...` nur fuer tatsaechliche Modell-/Wissensaenderung.

Generische Namen wie `process`, `handle`, `manage`, `do`, `run`, `data`, `helper`, `util` oder unpraezise deutsche Entsprechungen sind im Fachkern verboten.

## 4. V5 geht bei Narrensicherheit ueber V4 hinaus

"Narrensicherheit" bedeutet in V5 technisch:

> Ein einzelner Bedienfehler, Planungsfehler, stale Wert, falsch aufgerufener Fachpfad oder einfacher Implementierungsfehler soll nicht allein genuegen, um eine riskante Spielmutation freizugeben.

Das wird durch **mehrere unabhaengige Verriegelungen** erreicht.

### Verriegelung 1 – Typen

Unmoegliche oder ungepruefte Zustaende sollen moeglichst nicht darstellbar sein.

Beispiel:

```ts
type AusfuehrungsFreigabe =
  | { art: 'NICHT_FREIGEGEBEN'; grund: FreigabeSperrGrund }
  | {
      art: 'FREIGEGEBEN';
      auftragKennung: string;
      capabilityKennung: string;
      eigentuemerKennung: string;
      gueltigBis: number;
      zustandsEpoche: number;
      ressourcenNachweise: readonly RessourcenNachweis[];
      voraussetzungsNachweise: readonly VoraussetzungsNachweis[];
    };
```

Der Ausfuehrer akzeptiert nicht "true", sondern nur eine gueltige, typisierte Freigabe.

### Verriegelung 2 – Default-Deny

Neue mutierende Capabilities sind standardmaessig deaktiviert.

Fehlende, unbekannte, veraltete, widerspruechliche oder nicht validierbare Information bedeutet:

```text
NICHT AUSFUEHREN
```

Nicht:

```text
best effort
wahrscheinlich okay
Fallback auf alten Wert
```

### Verriegelung 3 – Unabhaengige Berechtigungspruefung

Ein Planer darf keine Game-Write-Autoritaet besitzen.

Eine Mutation benoetigt mindestens:

1. fachlich gueltigen Auftrag;
2. Capability-/Owner-Freigabe;
3. aktuelle Ressourcen-/Lock-Freigabe;
4. frische Live-Voraussetzungen;
5. gueltigen Transaktions-/Journalzustand;
6. Execution-Adapter, der die Freigabe nochmals strukturell prueft.

Bei hohem Risiko darf keine einzelne dieser Stufen durch eine andere ersetzt werden.

### Verriegelung 4 – Frische unmittelbar vor Write

Zwischen Planung und Game Write wird erneut geprueft:

- Ziel/Entity;
- physischer Gegenstand;
- Inventar-/Bankzustand;
- RID/Listing;
- Ressourcen/Fencing-Epoche;
- Deadline/TTL;
- Operator-Sperre;
- Content-/Contract-Version.

Ein Plan von vor wenigen Sekunden ist keine Ausfuehrungsberechtigung.

### Verriegelung 5 – Persist-before-action

Irreversible oder wertveraendernde Operationen schreiben ihren Intent vor der Raw Action persistent.

Kein Journalnachweis -> kein Write.

### Verriegelung 6 – Ergebnis ist nicht Commit

Ein Promise-/Server-Ergebnis ist Action-Evidence.

Fachlicher Commit entsteht erst nach der erforderlichen Postcondition beziehungsweise dem Domain Settlement.

### Verriegelung 7 – UNKNOWN stoppt Blindheit

Timeout, Disconnect oder Restart waehrend einer moeglichen Mutation fuehrt zu:

```text
UNBEKANNT -> BEOBACHTEN -> ABGLEICHEN
```

niemals direkt zu:

```text
FEHLER -> NOCHMAL SENDEN
```

### Verriegelung 8 – Sicherer Stopp gewinnt

Wenn V5 nicht beweisen kann, dass eine riskante Fortsetzung sicher ist, wird die betroffene Capability, Transaktion oder Domaene begrenzt angehalten.

Liveness darf niemals durch Aufweichen einer Safety-Regel gekauft werden.

### Verriegelung 9 – Operator kann nur begrenzen, nicht Safety umgehen

Ein Bediener darf:

- Arbeit stoppen;
- Capabilities deaktivieren;
- Budgets reduzieren;
- Quarantaene setzen;
- einen neuen verifizierten Auftrag ausloesen.

Ein Bedienerkommando darf **keine harte Systeminvariante deaktivieren** und keinen ungeprueften Raw Game Write erzwingen.

### Verriegelung 10 – Kein einzelner UI-/Host-Pfad besitzt Gameplay-Autoritaet

Dashboard, Host, Alerting oder Debug-Werkzeuge duerfen keine rohe Adventure-Land-Mutation ausloesen.

Sie koennen nur typisierte Anforderungen an die Runtime stellen.

### Verriegelung 11 – Explizite Zustandsmaschinen

Sicherheitskritische Zustaende werden als geschlossene, exhaustive Zustandsmodelle implementiert.

Kein generischer Stringstatus, kein "sonst weitermachen".

Unbekannter neuer Zustand -> Compile-/Runtime-Fehler oder fail-closed Quarantaene.

### Verriegelung 12 – Negative Bypass-Tests

Wir testen nicht nur, dass der erlaubte Pfad funktioniert.

Wir testen explizit, dass folgende Umgehungen **nicht** funktionieren:

- Raw Action ausserhalb der Ausfuehrungsschicht;
- Mutation ohne Freigabe;
- Mutation mit abgelaufener Freigabe;
- Mutation mit falscher Ressourcen-Epoche;
- Mutation bei stale Evidence;
- Mutation nach Operator-Deny;
- Mutation mit unbekanntem Contract;
- zweiter mutierender Owner;
- blindes Resume nach Restart;
- blindes Retry nach UNKNOWN;
- Safety-Lockerung durch Learning;
- Host-/Dashboard-Direktwrite.

## 5. Mehrfach-Verriegelungsregel fuer hohe Risiken

Fuer wertveraendernde, destruktive oder accountweite Aktionen gilt:

**Mindestens zwei voneinander unabhaengige Schutzstufen muessen dieselbe unerlaubte Mutation verhindern koennen.**

Beispiel `verkaufeGegenstand`:

- Ledger-Disposition sagt nicht VERKAUFEN -> Planer erzeugt keinen Auftrag.
- Selbst bei fehlerhaftem Plan: Admission prueft Reservation/Disposition erneut.
- Selbst bei fehlerhafter Admission: Execution-Freigabe ist abgelaufen/falsch -> Adapter verweigert.
- Vor Raw `sell`: physischer Gegenstand wird erneut aufgeloest.
- Nach Raw `sell`: Delta-/Gold-Nachweis entscheidet den Commit.

Das Ziel ist keine mathematische Fehlerfreiheit, sondern **kein Single-Point-of-Failure zwischen einfachem Fachfehler und irreversiblem Side Effect**.

## 6. Keine gefaehrlichen Komfort-Fallbacks

Verboten sind insbesondere:

- unbekannter Zustand -> Standardzustand;
- fehlende Capability -> alte Implementierung;
- unbekannter Content -> trotzdem probieren;
- fehlende Evidence -> Cache verwenden und mutieren;
- Fehler in Guard -> Guard ueberspringen;
- Lock verloren -> einfach neu anfordern und fortsetzen;
- Timeout -> Action erneut senden;
- Schemafehler -> teilweise parsen und weiterarbeiten;
- fehlender Health-Port -> gesund annehmen;
- unbekannter Enum-Wert -> Default-Branch mit Ausfuehrung.

Fallbacks duerfen nur Autoritaet reduzieren.

## 7. Explizite Werte statt gefaehrlicher Defaults

Sicherheitskritische Funktionen erhalten keine stillen Standardwerte fuer:

- Ziel;
- Menge;
- Preis;
- Gegenstandsidentitaet;
- Empfaenger;
- Ressourcen;
- Deadline;
- Retry-Budget;
- Safety-Klasse;
- Capability;
- Owner;
- Server/Realm.

Fehlt ein solcher Wert, ist der Auftrag ungueltig.

## 8. Fehler- und Meldungssprache

Maschinenlesbare V5-Fehlergruende sind deutsch und eindeutig:

```text
VORAUSSETZUNG_VERALTET
AUSFUEHRUNGS_FREIGABE_ABGELAUFEN
RESSOURCEN_EPOCHE_UNGUELTIG
GEGENSTAND_NICHT_EINDEUTIG
TRANSAKTIONS_ERGEBNIS_UNBEKANNT
VERTRAG_NICHT_VERIFIZIERT
BEDIENER_SPERRE_AKTIV
DOPPELTER_CAPABILITY_EIGENTUEMER
```

Eine Nutzerwarnung beantwortet immer:

1. Was ist passiert?
2. Warum?
3. Was hat V5 automatisch getan?
4. Ist etwas sicherheitskritisch?
5. Muss der Nutzer handeln?
6. Wenn ja: genau was?

## 9. Bestehende englische V5-Artefakte

Die bisherigen Research-/Roadmap-Artefakte wurden teilweise vor dieser verbindlichen Regel mit englischen Schemafeldern und Statuswerten angelegt.

Sie bleiben als historische Evidence gueltig, aber:

- neue Runtime-Domaenentypen duerfen sie nicht direkt uebernehmen;
- R2 enthaelt eine explizite Sprach-/Schema-Migration fuer alle von uns kontrollierten Kernartefakte;
- externe Roh-Snapshots werden niemals fuer kosmetische Umbenennung veraendert;
- externe Adventure-Land-Bezeichner bleiben in Source Evidence originalgetreu.

## 10. R2-/R3-Abnahme

R2 darf nicht abgeschlossen werden, solange:

- die deutsche V5-Domaenensprache nicht festgelegt ist;
- bestehende eigene Kernschemata noch ungeplante englische Runtime-Bezeichner in die Implementierung tragen wuerden;
- kritische Zustaende nicht als geschlossene Modelle definiert sind;
- die Mehrfach-Verriegelungsregeln nicht als Invarianten festgeschrieben sind.

R3 muss mindestens Guards besitzen fuer:

- rohe Adventure-Land-Writes ausserhalb der Ausfuehrungsschicht;
- verbotene Runtime-Imports aus V3/V4;
- Monkey-/Prototype-Patches;
- bekannte englische generische Kernbegriffe in neuen V5-Runtime-Namen;
- nicht-exhaustive kritische Zustandsbehandlung soweit technisch pruefbar;
- mutierende Capabilities ohne Default-Off;
- Ausfuehrer ohne typisierte Freigabe;
- verbotene Host-/Dashboard-Autoritaet.

## 11. Leitbild

V5-Code soll sich wie eine deutsche fachliche Beschreibung lesen:

```ts
const beobachtung = spielWeltBeobachter.beobachteSpielWelt();
const weltZustand = weltZustandsAbgleich.gleicheBeobachtungMitErwartungAb(beobachtung);
const auftrag = versorgungsPlaner.planeKritischeVersorgung(weltZustand);
const freigabe = ausfuehrungsBerechtigung.pruefeVersorgungsAuftrag(auftrag, weltZustand);

if (freigabe.art === 'FREIGEGEBEN') {
  const ergebnis = await versorgungsAusfuehrer.fuehreVersorgungsAuftragAus(freigabe);
  transaktionsAbgleich.gleicheVersorgungsErgebnisAb(ergebnis);
}
```

Wer den Code liest, soll ohne mentale Uebersetzung erkennen:

- was beobachtet wurde;
- was daraus abgeleitet wurde;
- wer entscheiden durfte;
- warum eine Aktion freigegeben oder gesperrt wurde;
- was tatsaechlich ausgefuehrt wurde;
- wie das Ergebnis bewiesen und gegebenenfalls abgeglichen wird.

**V4 ist der Mindeststandard. V5 muss bei Sprache, Verriegelung, Fehlbedienungsresistenz und Fail-Closed-Verhalten strenger sein.**
