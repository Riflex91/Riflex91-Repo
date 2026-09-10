# Adventure Land – AiO Bot 2.14.5 · technische Notizen


## 2.14.5 Merchant-Reliability / Dashboard / GUI

- Merchant-Routen besitzen Prioritäten; Explorer darf Service, Bank, Scroll-/NPC-Wege und Upgrade-/Compound-Exits nicht mehr verdrängen.
- `buy()` und `sell()` werden erst bei <= 75 Einheiten NPC-Distanz und nach vollständigem Bewegungsstopp ausgelöst.
- Sicherer Max-Level-Upgrade-Überschuss darf verkauft werden, sobald Gruppenreserve, Rezeptschutz und Drop-Seltenheit dies zulassen.
- Unter Inventardruck erhält sicherer NPC-Verkauf eine echte Ausführungschance vor weiteren Bank-/Compound-Schleifen.
- Dashboard-Kategorien sind einklappbar; Charaktere stehen oben, Gruppeninformationen unten; jede Charakterkarte besitzt eine Mini-Live-Map.
- Das Ingame-Hauptfenster ist viewport-sicher scrollbar; Gruppeneinstellungen zeigen animierte HP-/MP-Balken.

## 2.14.4 Merchant-Ökonomie, Party-Realm und GUI-Collapse

- NPC-Verkauf ist nicht mehr an `S.bankFull` gekoppelt. Vor einem Verkauf werden Schutzstatus, Gruppenreserve, aktueller Merchant-Plan, Rezeptnutzung, theoretische/empirische Drop-Häufigkeit und NPC-Wert geprüft. Upgrade-/Compound-Kandidaten protokollieren zusätzlich Scrollkosten und den über `item_value()` projizierten NPC-Wert der nächsten Stufe. Profit-only-Upgrades werden ohne echten Gruppennutzen nicht erzwungen.
- Wirtschaftlich sicher verkäuflicher Überschuss wird nicht zuerst in die Bank verschoben; bei Bedarf fährt der Merchant kontrolliert zum NPC-Händler. Seltene Drops, aktuelle Craft-/Quest-/Exchange-Bedarfe, Scrolls, geschützte Items und benötigte Gruppenexemplare bleiben erhalten.
- Upgrade und Compound besitzen einen harten Bank-Location-Guard. In `bank*` wird zuerst nach `main` gewechselt; erst danach darf `upgrade()` bzw. `compound()` aufgerufen werden.
- Bot-Peer-Reports enthalten `realm.region`, `realm.id` und `realm.pvp`. Bei unterschiedlichen Servern unterdrückt die Party-Reparatur Einladungen und wählt den Mehrheitsserver der eigenen Bot-Gruppe; dadurch wechselt bei drei Farmern auf EU1 und einem Merchant auf EU2 nur der Merchant. Ein automatischer Wechsel zu PvP bleibt ohne bestehende PvP-Bestätigung blockiert.
- Beim Einklappen der Haupt-GUI wird auch `.body` ausgeblendet und `min-height` aufgehoben. Sichtbar bleibt nur die Titelleiste.
- Keine Änderung an Brain-Gewichten, Teacher-Strategie, D1-Schema oder Cloudflare-Worker/Dashboard (weiter 2.14.0).

## 2.14.3 Scroll-/Bank-Loop-Hotfix

- `scroll0`–`scroll4` und `cscroll0`–`cscroll4` sind für die Bankbereinigung geschützt.
- Ein für Upgrade/Compound gekaufter Scroll darf dadurch nicht mehr unmittelbar als entbehrliches Bank-Item verschwinden.
- Der Merchant wartet mit `buy()` bis er höchstens 180 Einheiten vom Scroll-Händler entfernt ist, um Range-Races während `smart_move` zu reduzieren.

## 2.14.2 Merchant-Freeze-Hotfix

Behebt einen synchronen Merchant-Freeze bei vollem Inventar: Inventardruck wird vor Compound behandelt, fehlende Combine-Scrolls lösen keine rekursive Inventarbereinigung mehr aus und ein Re-Entry-Guard verhindert Rückkopplungen. Brain/Teacher und Cloudflare bleiben unverändert.

## 2.14.1 Stabilitäts-Hotfix

Merchant-Fokus: Goldtransfers beachten `merchantCollectGoldOver`, Farmer-Service erhält Hysterese, Party-`invalid` erhält Backoff, Report-CM-Audits werden gedrosselt/komprimiert und ein Merchant-Watchdog begrenzt ungewöhnliche Aktionsspitzen. Das neuronale Brain bleibt unverändert.


`bot.js` ist die gemeinsame Adventure-Land-CODE-Datei für Merchant und Farmer. 2.14.0 baut auf den Sicherheits-, Merchant-, Explorer-, Cloud-Sync- und GUI-Funktionen auf und ergänzt das selbsttrainierende Teacher/Student-Brain um Champion/Challenger, Lernqualitäts-Selbstkontrolle, Gehirn-Tagebuch und die **AiO Research Bridge** zur sicheren Übergabe verdichteter Erfahrung an ChatGPT.

## Architektur

Die Steuerung bleibt zweistufig. Zeitkritische Aktionen wie Combat, Heal, Sustain, Kiting, Retreat, Bewegungsschutz und Inventarsicherheit laufen lokal und deterministisch. Das Brain darf nur langfristige strategische Entscheidungen beeinflussen.

Der Cloudflare-Teacher nutzt fest `@cf/qwen/qwen3-30b-a3b-fp8` und darf nur `continue`, `change_farm_target`, `replan_merchant`, `explore` oder `wait` zurückgeben. Zusätzlich liefert er Confidence, Scores für alle fünf Aktionen, eine kurze Begründung, eine wiederverwendbare Lesson und erwartete Ergebnisänderungen.

## Student-Netz

Das lokale Netz verwendet aktuell:

- 32 normalisierte strategische Eingabefeatures,
- eine Hidden-Schicht mit 24 `tanh`-Neuronen,
- fünf Softmax-Ausgaben für die erlaubten Aktionen,
- Xavier-artige Initialisierung,
- Online-SGD/Backpropagation mit Gradient Clipping und leichter L2-Regularisierung,
- priorisiertes Experience Replay mit konfigurierbarer Größe; Samples mit hohem Loss bzw. starkem Reward erhalten eine höhere Wiederholungswahrscheinlichkeit.

Features bilden unter anderem HP/MP, Inventarbelegung, Gold, Party-Vollständigkeit, EXP/h, Gold/h, sichtbare Monster, Konkurrenz, Farmsicherheit, Gruppenstärke, kürzliche Action-Fehler, Circuit-Breaker, Explorer-Frische, Lern-Samples, Map-/Monster-Hash und UTC-Tageszeit ab.

## Training und Reward

Teacher-Antworten werden unmittelbar als Distillation-Samples in das Replay aufgenommen. Wird eine Strategie tatsächlich angewendet, speichert der Bot einen Ausgangszustand und bewertet den Zustand nach `brainOutcomeSeconds` erneut.

Der Reward berücksichtigt positiv EXP-/Gold-Verbesserungen, zusätzliche freie Inventarplätze, bessere Farmsicherheit und Party-Recovery. Fehlerzuwachs, Tod oder der Verlust einer vollständigen Party werden negativ gewichtet. Der Reward wird auf `[-1, 1]` begrenzt und verschiebt das Trainingsziel der ausgeführten Aktion entsprechend.

## Champion/Challenger-Liga

Der Student bleibt zunächst im Shadow-Modus. Erst nach mindestens 80 Samples, 120 Trainingsupdates, mindestens 60 % Teacher-Übereinstimmung, akzeptablem Loss und genügend realen Outcome-Messungen wird ein Modellstand als **Champion** eingefroren. Der weitertrainierte Student bleibt der **Challenger**.

Ein Challenger startet nur, wenn sein Replay-Validierungs-Loss gegenüber dem Champion messbar besser ist und Reward/Teacher-Übereinstimmung stabil bleiben. Während eines Canary-Tests erhält er standardmäßig nur 20 % der autonomen Strategieentscheidungen und benötigt eine etwas höhere Confidence. Reale Rewards werden getrennt für Champion und Challenger gesammelt. Sicherheitsvorfälle verwerfen den Challenger sofort; ein klar schlechterer Canary-Reward verwirft ihn ebenfalls.

Ein erfolgreicher Challenger wird neuer Champion **auf Bewährung**. Der vorige Champion bleibt als Rollback-Snapshot erhalten. Nach genügend Bewährungs-Outcomes wird der neue Champion bestätigt; fällt der Reward dagegen standardmäßig mehr als 12 Prozentpunkte unter die Vergleichsbasis oder tritt ein Sicherheitsvorfall auf, wird automatisch auf den vorherigen Champion zurückgerollt.

Die Freigabe ist bewusst konservativ: Ein junges oder nur theoretisch besseres Modell darf beobachten und lernen, aber nicht unkontrolliert den 24/7-Betrieb übernehmen.

## Lernqualitäts-Überwachung

`brainQualityV213` hält einen rollierenden Qualitätsverlauf und einen optionalen eingefrorenen **healthyChampion**-Snapshot. Standardwerte: 24 Outcomes Fenster, mindestens 12 Outcomes vor einer belastbaren Bewertung, Overconfidence-Schwelle 88 %, Reward-Abfall-Schwelle 15 Prozentpunkte und 20 Minuten Quarantäne-Cooldown.

`v213QualityEvaluate()` vergleicht die jüngere Hälfte des Fensters mit der vorherigen Hälfte. Ausgewertet werden Reward-Trend, Confidence-Trend, Fehlerrate hoch-konfidenter negativer Entscheidungen, Reward-Standardabweichung, Loss-Drift sowie Tod/Party-/Sicherheitsrückschritte. Daraus entstehen ein Qualitätsscore von 0–100 und einer der Zustände `warming`, `healthy`, `watch`, `degraded` oder `quarantine`.

Die Reaktion ist adaptiv: `watch` erhöht die effektive Student-Confidence-Schwelle, blockiert neue Canary-Starts, reduziert die Lernrate auf 75 % und erhöht den Teacher-Takt auf ×1,3. `degraded` blockiert autonome Policy-Anwendung, reduziert die Lernrate auf ×0,42 und erhöht den Teacher-Takt auf ×1,8. `quarantine` nutzt ×0,18 Lernrate und ×2,4 Teacher-Takt. Laufende Challenger-/Probation-Phasen werden beendet bzw. zurückgerollt. Ein älterer gesunder Champion bleibt erhalten, bis der neue Champion genügend eigene stabile Outcomes gesammelt hat.

Der Qualitätsstatus wird mit `v210StudentExport()` über D1 synchronisiert. Das Dashboard erhält nur `v213QualitySummary()`; der Worker gibt dabei keine Gewichtsmatrizen aus.

## Gehirn-Tagebuch

`brainDiaryV212` speichert einen begrenzten Ringpuffer verständlicher Lernereignisse. Das Tagebuch generiert keine zusätzlichen LLM-Texte, sondern übersetzt bestehende Audit-/Brain-Daten deterministisch. Dadurch bleibt jeder Eintrag auf ein konkretes Ereignis zurückführbar und kostet keine zusätzlichen Neurons.

Erfasste Klassen sind unter anderem `teacher`, `outcome`, `autonomy`, `challenge`, `promotion`, `confirmed`, `reject`, `rollback`, `error`, `budget` und `day_summary`. Outcome-Einträge enthalten den real gemessenen Reward sowie Vorher-/Nachherwerte für EXP/h, Gold/h, Farmsicherheit und freie Inventarplätze.

`brainDiaryEnabled` aktiviert/deaktiviert die Anzeige und `brainDiaryMaxEntries` begrenzt die lokale sowie synchronisierte Historie auf 20–200 Einträge (Standard 80). `v210StudentExport()` transportiert die längere Historie über `/api/state`; `v210BrainTelemetry()` gibt nur die letzten Einträge in den häufigeren Status-Push. Beim Import werden Einträge per ID zusammengeführt und chronologisch begrenzt.

## AiO Research Bridge

Die Research Bridge wird vollständig aus bereits vorhandenen Botdaten erzeugt und löst selbst **keinen Workers-AI-Aufruf** aus. Kernfunktionen sind `v214ResearchData()`, `v214ResearchPrompt()`, `v214ResearchSummary()`, `v214ResearchShow()` und `v214ResearchCopy()`.

Profile:

```text
overall      Gesamtanalyse
errors       Fehleranalyse
learning     Lernanalyse
farm         Farmanalyse
merchant     Merchant-Analyse
development  Entwicklungsbrief
```

Standardwerte:

```text
brainResearchBridgeEnabled = true
brainResearchProfile       = development
brainResearchHours         = 24
brainResearchMaxHighlights = 20
brainResearchAnonymize     = true
```

`v214ResearchData()` sammelt für das gewählte Zeitfenster gruppierte Audit-Fehler, relevanzgewichtete Diary-Highlights, Teacher-Lektionen, die stärksten Outcome-Rewards, Farm-/Merchant-Zustand, Student-/League-/Qualitätsmetriken und kompaktes Monster-/Zonenlernen. Vollständige Gewichtsmatrizen werden bewusst nicht exportiert. `v214ResearchPrompt()` kombiniert eine profilbezogene Analyseanweisung mit einem strukturierten JSON-Block.

`v214ResearchSafeText()` entfernt den aktuell konfigurierten Dashboard-Schreibschlüssel sowie typische Schlüssel-/Token-/Authorization-Muster. Bei aktivierter Anonymisierung werden bekannte Account-Charaktere vor der Ausgabe in `Merchant` bzw. `FarmerN` umbenannt. Die kompakte `research.summary` wird zusammen mit dem Student-State synchronisiert; sie enthält keine Gewichte und keine Secrets.

Der Web-Worker stellt zusätzlich `GET /api/research-brief` bereit. Dieser Endpunkt ist wie `/api/brain-status` mit `READ_KEY` geschützt und erzeugt den Brief ausschließlich aus D1-/Statusdaten. Er ruft `env.AI` nicht auf. Die Web-Variante weist explizit darauf hin, dass lokale Roh-Auditdaten dort nicht vollständig vorhanden sind.

## Budget-Pacer

Standardwerte:

```text
brainDailyNeuronLimit       = 10000
brainBudgetTargetPct        = 99.5
brainWorkPct                = 100
brainStudentConfidencePct   = 82
brainOutcomeSeconds         = 180
brainReplaySize             = 512
brainStudentLearningRate    = 0.012
brainTeacherMinInterval     = 30 s
brainTeacherMaxInterval     = 600 s
brainLeagueEnabled           = true
brainChallengerTrafficPct    = 20
brainChallengeMinOutcomes    = 8
brainRollbackRewardDropPct   = 12
brainDiaryEnabled             = true
brainDiaryMaxEntries          = 80
brainResearchBridgeEnabled    = true
brainResearchProfile          = development
brainResearchHours            = 24
brainResearchMaxHighlights    = 20
brainResearchAnonymize        = true
```

Das effektive Standard-Tagesziel beträgt 9.950 Neurons. Der adaptive Teacher-Abstand wird aus verbleibendem Budget, verbleibender UTC-Tageszeit, gemessenem Durchschnittsverbrauch, Student-Entropie und Novelty berechnet. Das lokale Tagesbudget wird bei einem neuen UTC-Tag zurückgesetzt.

## Cloud-Synchronisierung

Über `/api/state` synchronisiert der Bot wichtige Einstellungen, Monster-/Zonenlernen, Explorer-Beobachtungen und beim Merchant zusätzlich das Student-Modell. Die Gewichte werden gerundet übertragen. Ein neueres oder weiter trainiertes Remote-Modell kann übernommen werden. Der `webDashboardWriteKey` wird nicht in der Cloud-Konfiguration gespeichert.

Outcome-Feedback wird über `/api/brain-feedback` an D1 geschickt. `/api/brain-status` liefert dem Web-Dashboard zusammengefasste Brain-Telemetrie ohne die vollständigen Gewichtsmatrizen. Die Research Bridge legt zusätzlich eine bereinigte `research.summary` in den Student-State und kann daraus über `/api/research-brief` einen Analysebrief erzeugen.
Das Gehirn-Tagebuch wird im Student-State mitgespeichert; die Dashboard-Antwort sanitisiert Titel, Detailtext, Typ, Reward und Metadaten und liefert weiterhin keine Gewichte aus.

## Gehirn-Dashboard und „Lebendig“-Effekt

Die Webansicht zeigt Budget, Teacher-Verbrauch, Student-Lernzahlen, Confidence/Entropie/Novelty, Loss, Reward, Teacher-Übereinstimmung, Champion/Challenger-Canary, Bewährung, Promotions/Rollbacks sowie die letzten Entscheidungen und Outcome-Rewards. Ein animierter neuronaler Puls visualisiert zusätzlich den aktuellen Aktivitätszustand.

Auch im Adventure-Land-UI erscheint in der Hauptleiste ein kleiner pulsierender Brain-Indikator. Im Gehirn-Fenster zeigt eine größere Animation Zustände wie **beobachtet**, **denkt mit dem Teacher**, **lernt**, **beobachtet die Folgen**, **prüft einen Challenger** und **bewacht einen neuen Champion**. Die Animation ist rein visuell und beeinflusst keinerlei Entscheidungslogik; `prefers-reduced-motion` wird berücksichtigt. Die Daten sind mit dem vorhandenen `READ_KEY` geschützt.

## Weiterhin geschützte 2.9.x-Funktionen

- Cloudflare-D1-State-Sync und Merchant-Explorer
- periodische Farmer-Auto-Equip-Prüfung
- Inventardruck-Circuit-Breaker vor Scrollkäufen
- Compound-Priorität und Gruppenreserve
- Verkauf von überschüssigem +4-Nicht-Compound-Gear nur oberhalb der benötigten Gruppenreserve
- GUI-Launcher als Toggle mit Open-State
- Inventar ohne `preview_item()`
- Feature-Contract vor Self-Updates

## Update-Repository

Kanonisches Release-Repository:

`https://github.com/Riflex91/Adventure-Land---The-Code-MMORPG---Bot--public`

Raw Bot:

`https://raw.githubusercontent.com/Riflex91/Adventure-Land---The-Code-MMORPG---Bot--public/main/bot.js`

Gespeicherte Altwerte sollen den kanonischen Update-Pfad nicht zurück auf ein altes Repository umbiegen.

## Testgrenze

Syntax- und Mock-Tests können die Release- und API-Logik prüfen. Sie ersetzen keinen Adventure-Land-Live-Test. Vor einer 24/7-Freigabe sollte das Brain mehrere Stunden zunächst überwacht bzw. im Shadow-Modus laufen und die Reward-/Loss-Telemetrie kontrolliert werden.
