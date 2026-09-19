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
7. betroffene Action Contracts aktualisieren oder bei ungeklaerter Live-Semantik auf `LIVE_DOC_ONLY_NEEDS_EXACT_CONTRACT` sperren;
8. offene Fragen und Architekturfolgen aktualisieren;
9. Validator ausfuehren;
10. PR mit nachvollziehbarer Evidence.

Die Knowledge Base informiert Entscheidungen. Gameplay-Autoritaet entsteht erst durch frische Admission-/Live-State-Pruefungen im Runtime-Kern.
