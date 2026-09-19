# V5 Definition of Done

Diese Checkliste gilt fuer **jede** neue mutierende Capability und fuer jede Aenderung, die Safety, Recovery, Persistenz, Scheduling oder Authority beeinflusst.

## A. Wissen und Contract

- [ ] Betroffene Fact-/Knowledge-IDs bekannt.
- [ ] Quelle/Version/Freshness dokumentiert.
- [ ] Action Contract verifiziert.
- [ ] Bei Drift ist Capability fail-closed.
- [ ] ADR vorhanden, falls Architektursemantik geaendert wird.

## B. Ownership und Grenzen

- [ ] Genau ein mutierender Owner.
- [ ] Fachmodul kennt keine rohe Adventure-Land-Mutation.
- [ ] Port/Capability versioniert.
- [ ] Keine fremden Runtime-Objekte als implizite API.
- [ ] Disable-/Rollback-Pfad vorhanden.

## C. Workflow und Ressourcen

- [ ] Workflow/Action besitzt stabile ID.
- [ ] PriorityClass/Deadline definiert.
- [ ] Ressourcen und Lock-Reihenfolge definiert.
- [ ] Safe-Preemption-Points explizit.
- [ ] Lease/Fencing fuer langlebige Locks.
- [ ] Keine unbounded Retry-/Wait-Schleife.

## D. Transaktion und Recovery

- [ ] Persist-before-action fuer irreversible Mutation.
- [ ] Idempotency/Dedupe Strategy.
- [ ] Server Result Classification.
- [ ] Domain Postcondition.
- [ ] UNKNOWN Outcome.
- [ ] Reconcile Strategy.
- [ ] Partial Completion behandelt.
- [ ] Restart waehrend jeder kritischen Phase getestet.
- [ ] Operator Stop waehrend In-Flight getestet.

## E. Tests

- [ ] Static/Dependency Guards.
- [ ] Unit Tests.
- [ ] Property/Invariant Tests.
- [ ] State-Machine Tests.
- [ ] Deterministic Replay.
- [ ] Fault Injection.
- [ ] Negative Tests.
- [ ] Migration Tests, falls Persistenz betroffen.
- [ ] Memory/Queue Bounds geprueft.

## F. Observability

- [ ] Why/Owner/Evidence/Locks sichtbar.
- [ ] Workflowphase sichtbar.
- [ ] Transactionstate sichtbar.
- [ ] Retry/Circuit/Budget sichtbar.
- [ ] Failure/Unknown unterscheidbar.
- [ ] Kritische Alerts persistent gespult.

## G. Live-Freigabe

- [ ] Shadow: 0 unerwartete Writes.
- [ ] Controlled Live mit minimalem Scope.
- [ ] Postcondition-Evidence gespeichert.
- [ ] Fault-/Recovery-Nachweis fuer Live-Pfad.
- [ ] Soak passend zum Risiko.
- [ ] PR exakt auf Head gruen.
- [ ] Branch nicht hinter aktuellem main.
- [ ] Keine unbeabsichtigten V3/V4-Aenderungen.

**Nicht alle Checkboxen = nicht fertig.**


## H. Sprache und Narrensicherheit

- [ ] Alle von uns kontrollierten Funktions-, Typ-, Variablen-, Zustands-, Ereignis-, Fehler-, Capability-, Workflow- und Transaktionsnamen sind deutsch.
- [ ] Eigene Schema-/Persistenz-/Protokollfelder sind deutsch, sofern kein externer Standard ihre Schreibweise erzwingt.
- [ ] Adventure-Land-Rohnamen bleiben auf Adapter-/Normalisierungsgrenzen beschraenkt.
- [ ] Sicherheitskritische Funktionen verwenden keine gefaehrlichen stillen Standardwerte.
- [ ] Fehlende/unklare/veraltete Evidence fuehrt zu Sperre oder Quarantaene, nicht zu Best-Effort-Ausfuehrung.
- [ ] Riskante Mutation besitzt mehrere unabhaengige Verriegelungen.
- [ ] Ausfuehrung akzeptiert eine typisierte Freigabe statt eines einfachen Boolean.
- [ ] Negative Tests beweisen, dass Mutation ohne/mit abgelaufener/falscher Freigabe nicht moeglich ist.
- [ ] Operator, Host, Dashboard und Learning koennen harte Safety-Invarianten nicht umgehen.
- [ ] Kritische Zustandsmodelle sind geschlossen/exhaustiv und haben keinen ausfuehrenden Default-Zweig.


## I. Sichtbare Sprache

- [ ] Alle uebersetzungspflichtigen sichtbaren Texte sind deutsch.
- [ ] Skills und Skillbeschreibungen sind deutsch.
- [ ] Buttons, Menues, Tabs, Textfelder, Platzhalter, Tooltips, Tabellen, Dialoge, HUD, Dashboard, Konfiguration, Warnungen und sichtbare Diagnosen sind deutsch.
- [ ] Items, Klassen, NPC-Rollen, Events, Quests, Aktionen und sichtbare Statuswerte besitzen deutsche Anzeigenamen.
- [ ] Monster verwenden eine offizielle deutsche Spielbezeichnung, falls Adventure Land eine bereitstellt.
- [ ] Fehlt im Spiel eine offizielle deutsche Monsterbezeichnung, darf ausschliesslich fuer den Monster-Namen der originale Spielname sichtbar bleiben.
- [ ] V5 erfindet keine eigene Monster-Uebersetzung als angeblich offizielle Bezeichnung.
- [ ] Unerlaubte englische Rohtext-Leaks = 0.
- [ ] Fehlende erforderliche Uebersetzungen = 0.


## J. Aktueller Wissensstand

- [ ] Vor Planung wurde der aktuelle `v5/wissensbasis/manifest.json` gelesen.
- [ ] Letzter Waechterlauf und Quellenstatus wurden geprueft.
- [ ] Relevante Aenderungen seit dem Planungs-/Branchbeginn wurden bewertet.
- [ ] Revalidierungsqueue und offene Fragen fuer die Domaene wurden geprueft.
- [ ] Relevante Facts und Action Contracts wurden referenziert.
- [ ] Kandidaten wurden nicht als Wahrheit oder Freigabe verwendet.
- [ ] Roh-Snapshots wurden nur als Evidence verwendet, nicht als direkte Runtime-API.
- [ ] Der verwendete Wissens-Git-Commit beziehungsweise WissensSnapshot ist nachvollziehbar.
- [ ] Vor Merge wurde der Branch erneut auf aktuellen `main` inklusive Knowledge-Commits gebracht.
- [ ] Strenger Entwicklungs-Wissensgate ist fuer Implementierung gruen.


## K. Live-Wissensdatenbank

- [ ] Falls die Capability persistierbares Live-Wissen erzeugt, schreibt sie ausschliesslich ueber den `LiveWissensSpeicherPort`.
- [ ] `LIVE_VERIFIZIERT` wird erst nach fachlichem Verifier gesetzt.
- [ ] Lokaler Writer verwendet atomare Writes und `SCHREIBT -> BEREIT` derselben Generation.
- [ ] Restart waehrend jeder Schreibphase ist getestet.
- [ ] Disk Full, Access Denied, korrupte JSON-Datei und Clock-Anomalie sind getestet.
- [ ] Keine Secrets/Credentials koennen in Live-Wissen serialisiert werden.
- [ ] Ein konkreter Live-Fakt wird nicht unzulaessig als allgemeine Spielregel interpretiert.
- [ ] GitHub-Spiegel ist nicht Teil der unmittelbaren Mutationserlaubnis.
- [ ] Hochfrequente Rohtelemetrie bleibt ausserhalb des GitHub-Live-Snapshots.


## L. Lokales SSD-Datenfundament

Falls eine Capability persistente Daten erzeugt oder liest:

- [ ] HOT/WARM/COLD-Zuordnung ist festgelegt.
- [ ] Zeitkritischer Hot Path benoetigt keinen nichtkritischen SSD-Roundtrip.
- [ ] Fachmodul verwendet einen typisierten Speicherport statt beliebigem Dateisystemzugriff.
- [ ] Nichtkritische Writes sind bounded, asynchron, batchfaehig und besitzen Backpressure.
- [ ] Kritische wertveraendernde Mutation wartet auf bestaetigte durable Intent-Persistenz.
- [ ] Datenklasse besitzt Budget, Retention und Verhalten bei Speicherdruck.
- [ ] Kritische Transaction-/Recovery-Evidence wird niemals still geloescht.
- [ ] Disk Full, Access Denied, I/O-Fehler und falsches/fehlendes Volume sind getestet.
- [ ] Mindestens 15 Prozent Standard-Sicherheitsreserve beziehungsweise die konfigurierte strengere Reserve wird eingehalten.
- [ ] Kein stiller Fallback kritischer Persistenz auf ein anderes Laufwerk.
- [ ] Grosse Historien werden ausserhalb des Hot Path aggregiert; Runtime nutzt kompakte RAM-Working-Sets.
- [ ] SSD-Persistenz oder Speicherort verleiht keine Gameplay-Autoritaet.
- [ ] GitHub-/Bridge-Sync bleibt auf explizit erlaubte bounded Artefakte begrenzt.


## M. Recovery / UNKNOWN

Fuer jede wertveraendernde Capability:

- [ ] passender Action Contract ist vorhanden.
- [ ] genau ein passender Recovery Contract ist vorhanden.
- [ ] UNKNOWN-Trigger sind explizit modelliert.
- [ ] Same-Intent-Retry nach moeglichem Send ist technisch ausgeschlossen.
- [ ] NOT_APPLIED braucht positive frische Evidence.
- [ ] PARTIAL erzeugt Remainder-Replan statt Original-Retry.
- [ ] STILL_PENDING sendet nicht erneut.
- [ ] UNRESOLVED fuehrt zu Quarantaene/Operator-Policy.
- [ ] Restart setzt nicht-terminale Arbeit auf RECONCILE_REQUIRED.
- [ ] Disabled Action Contracts bleiben Recovery-seitig disabled.


## N. Bank-Concurrency

Fuer jede Bank-Capability:

- [ ] Account Coordinator ist alleiniger Authority-Owner.
- [ ] genau eine `account:bank` Lease je Account.
- [ ] Lease besitzt Epoch/Fencing und persistierbaren Recovery-State.
- [ ] Bank-Mount erfolgt nur unter aktiver Lease.
- [ ] Raw Bank Write braucht Account-Lease plus lokalen `bank`-Channel.
- [ ] BankSnapshot traegt aktuelle Mount-/Lease-Epoch.
- [ ] Disconnect/Crash fuehrt zu RECOVERY_PENDING statt Lease-Freigabe.
- [ ] `bank_opx`/already_in_bank wird als externes Fence behandelt.
- [ ] Handover ist bei UNKNOWN/PARTIAL/STILL_PENDING/UNRESOLVED verboten.
- [ ] Shell-Pack-Backend behaelt Lease/Channel bis Terminalresultat + Postcondition.
- [ ] unmanaged/manual Bankowner fuehrt zu Quarantaene.
