# V5 Wissensbasis – lebendes, versioniertes Wissen

Diese Wissensbasis ist ein **Entwicklungsbestandteil**, keine statische Dokumentation.

Adventure Land veraendert sich. Deshalb duerfen heutige Fakten niemals als ewige Konstanten behandelt werden.

## Ebenen

1. **Rohquelle / Snapshot** – unveraendert archivierte Evidence.
2. **Wissenseintrag / Fact** – stabile ID + Aussage + Herkunft + Confidence + Drift.
3. **Live Truth** – zur Laufzeit beobachtete Wahrheit; darf einen alten Snapshot ueberholen.
4. **Architekturentscheidung** – darf Facts referenzieren, ist aber selbst keine Spielwahrheit.
5. **Offene Frage** – bekannte Wissensluecke mit Prioritaet und Blockierungswirkung.

## Lebenszyklus

`ACTIVE -> NEEDS_REVALIDATION -> ACTIVE | SUPERSEDED | CONTRADICTED | RETIRED`

Ein Fact wird bei Spielaenderungen nicht still umgeschrieben. Neue Evidence wird archiviert; alte Facts werden markiert und ueber `supersedes` / `supersededBy` historisch verbunden.

## Stabile IDs

Code, Tests und ADRs duerfen IDs wie `AL-BANK-003` referenzieren. Sie duerfen nicht davon ausgehen, dass der Text eines Facts fuer immer unveraendert bleibt.

## Drift-Regel

Besonders volatile Inhalte sind Preise, Shopinventare, Eventzeiten, NPC-Platzierungen, Bank-Pack-Anzahl/Kosten, Skillwerte/Cooldowns, Marktregeln, Rate Limits, Serverwechselregeln und Quest-/Event-State.

Solche Werte werden soweit moeglich live aus `G`, `server.status`, Character-/World-State oder Serverresultaten bezogen.

Snapshots dienen Planung, Regression, Dokumentation, Fallback/Diagnose und Change Detection – nicht als ewige Execution Authority.

## Update-Prozess

1. neue Rohquelle als neuen Snapshot hinzufuegen;
2. Source Registry ergaenzen;
3. betroffene Facts anhand stabiler IDs finden;
4. Driftstatus setzen;
5. gegen aktuelle offizielle/Live-Quelle revalidieren;
6. Fact bestaetigen oder superseden;
7. betroffene Action Contracts aktualisieren; deployte Live-Contracts als `VERIFIED_LIVE_DEPLOYED_CONTRACT` kennzeichnen oder bei ungeklaerter Semantik explizit mit `EXPLICITLY_DISABLED_PENDING_EXACT_CONTRACT` / `LIVE_DOC_ONLY_NEEDS_EXACT_CONTRACT` sperren;
8. offene Fragen und Architekturfolgen aktualisieren;
9. Validator ausfuehren;
10. PR mit nachvollziehbarer Evidence.

Die Knowledge Base informiert Entscheidungen. Gameplay-Autoritaet entsteht erst durch frische Admission-/Live-State-Pruefungen im Runtime-Kern.


## Windows-Bridge-Wissenswaechter

Der automatische Wissenswaechter der Windows Bridge besitzt eine harte **Git-Bereichsgrenze**:

```text
v5/wissensbasis/**
```

Fuer Git gilt:

- **Lesen:** ausschliesslich innerhalb von `v5/wissensbasis/**`.
- **Schreiben:** ausschliesslich innerhalb von `v5/wissensbasis/**`.

Zusaetzlich darf die Bridge fuer den Live-Wissensimport genau den in der App konfigurierten Unterpfad auf `D:\` **read-only** lesen. Dieser lokale Pfad ist kein Git-Bereich und darf niemals als allgemeiner Dateisystemzugriff verstanden werden.
- **Git-Arbeitsbaum:** Sparse Checkout materialisiert nur `v5/wissensbasis/**`.
- **Commit-Pruefung:** vor jedem Commit und nach jedem Rebase werden alle geaenderten Pfade erneut gegen diese Grenze geprueft.
- **Kein Force-Push:** Konflikte oder unerwartete Pfade fuehren zum sicheren Abbruch.
- **Takt:** automatischer Lauf einmal pro Stunde; ein manueller Lauf darf jederzeit zusaetzlich gestartet werden.
- **GitHub-Anmeldung:** erfolgt ueber Git Credential Manager und Browser-OAuth; Zugangsdaten werden nicht in der Bridge-Konfiguration gespeichert.

Der Unterordner `datenbank/` ist der Standard-Ablageort fuer automatisch erzeugte Snapshots, Statusdaten, Kandidaten und Aenderungsprotokolle. Er ist **keine weitergehende Sicherheitsgrenze**: Die verbindliche Lese- und Schreibgrenze des Waechters ist die gesamte `v5/wissensbasis/**`.

Informationen aus Community- oder unbekannten Quellen werden nicht automatisch zu bestaetigten Spiel-Fakten. Sie bleiben Kandidaten/Evidence, bis die vorhandenen Vertrauens- und Revalidierungsregeln sie bestaetigen.

### Adventure-Land-Relevanzfilter

Der Wissenswaechter darf nur Webkandidaten speichern, deren Bezug zu **Adventure Land - The Code MMORPG** technisch bestaetigt wurde. Suchmaschinen-Query und Trefferposition gelten ausdruecklich nicht als Beweis. Offizielle Adventure-Land-Adressen werden direkt erkannt; andere Treffer muessen einen Vorfilter bestehen und anschliessend im tatsaechlich abgerufenen Seiteninhalt eindeutige Spielmerkmale enthalten. Unklare oder nicht erreichbare Ergebnisse werden fail-closed verworfen.

Jeder neu gespeicherte Kandidat traegt einen `ADVENTURE_LAND_...`-Relevanznachweis. Kandidaten aus aelteren, breiteren Suchlaeufen ohne diesen Nachweis werden automatisch aus der Kandidatenliste entfernt.


## Verbindlicher Zugriff fuer Entwicklung und spaetere Runtime

Der kanonische Einstiegspunkt ist immer:

```text
v5/wissensbasis/manifest.json
```

Der Manifest beschreibt sowohl die strukturierte Wissensschicht als auch die laufenden Daten des Wissenswaechters.

Pflichtreihenfolge fuer Entwicklung:

1. `manifest.json`;
2. `datenbank/letzter-lauf.json`;
3. `datenbank/quellenstatus.json`;
4. relevante Aenderungen aus `datenbank/aenderungsprotokoll.jsonl`;
5. Revalidierungsqueue/offene Fragen;
6. relevante Facts, Action Contracts und Recovery Contracts;
7. bei Bedarf die aktuellen Roh-Snapshots unter `datenbank/aktuell/**`.

Die vollstaendigen Regeln stehen in:

```text
v5/dokumentation/ENTWICKLUNGS-WISSENSGATE.md
v5/entwicklungsregeln/wissensnutzung.json
```

### Wichtige Autoritaetsgrenzen

- `datenbank/aktuell/**` = aktuelle Evidence, **keine direkte Gameplay-API**.
- `datenbank/kandidaten.json` = Recherchehinweise, **keine Entwicklungs- oder Gameplay-Autoritaet**, unabhaengig von ihrer Vertrauensklasse.
- Facts/Action Contracts/Recovery Contracts = kanonische Entwicklungsbasis nach Revalidierung.
- unmittelbar vor Game Writes gewinnt weiterhin frische Live Truth.

Spaetere Runtime-Module greifen nicht direkt auf GitHub-TXT-Dateien zu. Sie verwenden einen validierten, read-only `WissensZugriffPort` mit einem versionierten `WissensSnapshot`.


### Live-Wissen vom V5-Bot

Der spaetere V5-Bot persistiert fachlich verifizierte echte Spielbeobachtungen lokal auf der SSD. Standardpfad:

```text
D:\AdventureLand-V5\wissensdatenbank
```

Der GitHub-Spiegel liegt getrennt unter:

```text
v5/wissensbasis/live/snapshot/**
```

Der vollstaendige Vertrag steht in `v5/dokumentation/LIVE-WISSEN-SSD-VERTRAG.md`.

Live-Wissen ist besonders starke Evidence fuer den **konkret beobachteten Zustand**, darf aber nicht automatisch zu einer allgemeinen Spielregel verallgemeinert werden und bleibt ohne frische Runtime-Admission keine ExecutionAuthority.


## P0-03 Bank-Concurrency

Der kanonische maschinenlesbare Vertrag fuer accountweite Bankownership liegt unter:

```text
v5/wissensbasis/vertraege/bank-concurrency.json
```

Er bindet die serverseitige Single-Mount-Semantik an eine V5-`account:bank` Lease des Account Coordinators. Character-lokaler `bank`-Channel und accountweite Lease sind getrennte Pflichtschichten.
