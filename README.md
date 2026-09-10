# Adventure Land – AiO Bot 2.14.2

Ein gemeinsamer Adventure-Land-Bot für Farmer-Klassen und Merchant. Version 2.14.0 erweitert die bisherige deterministische 24/7-Logik um ein selbstlernendes **Teacher/Student Brain v2** mit Cloudflare Workers AI, Experience Replay, Outcome-Rewards, einer **Champion/Challenger-Liga mit Auto-Rollback**, einem überprüfbaren **Gehirn-Tagebuch**, Lernqualitäts-Selbstkontrolle und der **AiO Research Bridge**. Die Research Bridge verdichtet reale Bot-Erfahrung zu sicheren, kompakten Analyse-Prompts für ChatGPT, ohne dafür zusätzliche Workers-AI-Aufrufe zu erzeugen.

> **2.14.2 Merchant-Freeze-Hotfix:** verhindert eine synchrone Rekursion zwischen Inventardruck, Compound-Prüfung und fehlendem Combine-Scroll. Inventarbereinigung läuft jetzt vor Compound, Scroll-Beschaffung ruft die Bereinigung nicht rekursiv auf und ein Re-Entry-Guard blockiert künftige Rückkopplungen.

> **2.14.1 Stabilitäts-Hotfix:** bündelt Farmer→Merchant-Goldtransfers erst ab dem konfigurierten Schwellwert, verhindert sofortige Wiederholungs-Services, drosselt übermäßige Merchant-Aktionsraten und reduziert CM-Auditlast. Brain/Teacher-Gewichte und Cloudflare-Dashboard bleiben unverändert.

> Aktueller Stand: **2.14.2** · Build **2026-09-10**

## Release-Dateien

- `bot.js` – gemeinsame CODE-Datei für Farmer und Merchant
- `BOT_README.md` – technische Bot-Dokumentation
- `cloudflare-dashboard/` – Cloudflare Worker, D1-Schema und Web-Dashboard
- `version.json` – Versions- und Self-Update-Metadaten
- `scripts/verify-release.js` – Regression-/Release-Prüfung

## Brain v2: Teacher + selbstlernender Student

Das strategische Gehirn ist zweigeteilt. **Qwen auf Cloudflare Workers AI** arbeitet als Teacher und beurteilt strategische Situationen. Parallel läuft im Merchant ein kleines neuronales Student-Netz mit 32 normalisierten Eingaben, 24 Hidden-Neuronen und fünf erlaubten Strategie-Ausgaben.

Der Student lernt aus zwei Quellen:

1. **Teacher-Distillation:** Die Wahrscheinlichkeitsverteilung des Teachers wird als Trainingsziel gespeichert.
2. **Outcome Learning:** Nach einer angewendeten Strategie misst der Bot nach einem konfigurierbaren Zeitfenster die tatsächliche Veränderung von EXP/h, Gold/h, freien Inventarplätzen, Farmsicherheit, Fehlern, Party-Zustand und Tod. Daraus entsteht ein Reward zwischen -1 und +1.

Die Erfahrungen landen in einem begrenzten Experience-Replay-Puffer. Kleine zufällige Replay-Batches trainieren das Netz fortlaufend per Backpropagation/SGD. Das Student-Modell wird lokal persistiert und über D1 zwischen Geräten synchronisiert.

### Champion / Challenger mit automatischem Rollback

Der Student läuft anfangs im **Shadow-Lernen** und darf noch keine eigene Strategie anwenden. Sobald genügend Lernbeispiele, Trainingsschritte und reale Outcomes vorliegen, wird ein stabiler Stand als **eingefrorener Champion** gespeichert. Der weiterlernende Student bleibt danach der Challenger.

Ein neuer Challenger muss zunächst auf dem Experience Replay einen niedrigeren Validierungs-Loss zeigen. Danach erhält er nur einen kleinen konfigurierbaren Canary-Anteil der autonomen Strategieentscheidungen. Champion und Challenger werden anhand real gemessener Rewards verglichen. Verursacht der Challenger einen starken Sicherheitsrückschritt oder ist sein Reward schlechter, wird er verworfen. Ist er messbar besser, wird er zum neuen Champion und läuft zunächst auf Bewährung. Fällt sein Reward dort deutlich unter die vorherige Basis oder tritt ein Sicherheitsvorfall auf, wird automatisch der vorherige Champion wiederhergestellt.

Kampf, Heilung, Kiten, Retreats, Party-Sicherheit und andere zeitkritische Schutzmechanismen bleiben unabhängig davon deterministisch und lokal.

## Gehirn-Tagebuch

Das Brain führt ein eigenes **deterministisches Lerntagebuch**. Dafür wird kein zusätzlicher Workers-AI-Aufruf ausgelöst. Stattdessen werden bereits vorhandene, überprüfbare Ereignisse in verständliche Einträge übersetzt:

- Teacher-Lektionen aus dem bereits zurückgegebenen `lesson`-Feld,
- positive, neutrale und negative Outcome-Rewards mit EXP/h-, Gold/h-, Sicherheits- und Inventarvergleich,
- eigenständige Student-/Champion-/Challenger-Entscheidungen,
- Challenger-Starts und -Verwerfungen, Promotions, Bestätigungen und automatische Rollbacks,
- UTC-Tageszusammenfassungen mit neuen Lernbeispielen, bewerteten Outcomes, Promotions und Rollbacks.

Standardmäßig bleiben die letzten 80 Einträge erhalten (`brainDiaryMaxEntries`, konfigurierbar 20–200). Der Verlauf wird zusammen mit dem Student-State über D1 synchronisiert. Der häufigere Charakterstatus überträgt nur wenige aktuelle Einträge für eine schnelle Live-Anzeige; die längere Historie kommt aus dem normalen Cloud-Sync.

## Cloudflare-Neuron-Budget

## Lernqualitäts-Wächter

Die Lernqualitäts-Selbstkontrolle ergänzt eine zweite Meta-Ebene über dem Student-Netz. Der **Lernqualitäts-Wächter** bewertet nicht nur, wie sicher sich das Netz fühlt, sondern ob diese Sicherheit durch reale Outcomes gerechtfertigt ist. Dafür vergleicht er rollierend Reward, Confidence, Loss, Reward-Streuung und Sicherheitsfolgen. Er erkennt insbesondere **Overconfidence ohne Reward-Fortschritt**, Reward-Drift, instabile Lernphasen und Sicherheitsrückschritte.

Der Wächter arbeitet in den Zuständen `warming`, `healthy`, `watch`, `degraded` und `quarantine`. Bei `watch` werden Challenger zurückgehalten, die Confidence-Schwelle angehoben, der Teacher häufiger konsultiert und vorsichtiger gelernt. Bei `degraded` oder `quarantine` werden autonome Brain-Strategien vorübergehend blockiert, die Lernrate deutlich reduziert und laufende Canary-/Bewährungsphasen gestoppt. Ein bestätigter gesunder Champion wird als zusätzlicher Rückfallpunkt gespeichert; ein frisch beförderter Champion darf diesen Snapshot erst nach genügend eigenen stabilen Outcomes ersetzen.

Die Qualitätsüberwachung verbraucht selbst **keine zusätzlichen Workers-AI-Neurons**. Sie nutzt die ohnehin gemessenen Outcome-Daten und verändert lediglich, wann der vorhandene Teacher konsultiert wird. Die harte 10.000-Neuron-Grenze und der Budget-Pacer bleiben aktiv.

## AiO Research Bridge

Die **AiO Research Bridge** macht aus gesammelter Bot-Erfahrung einen kompakten, direkt für ChatGPT nutzbaren Analysebrief. Sie ruft dafür **kein zusätzliches LLM** auf, sondern verdichtet vorhandene Audit-, Diary-, Outcome-, Qualitäts-, Farm-, Merchant- und Lerntelemetrie deterministisch. Dadurch bleiben die Inhalte nachvollziehbar und verbrauchen **0 zusätzliche Workers-AI-Neurons**.

Es gibt sechs Profile: **Gesamtanalyse**, **Fehleranalyse**, **Lernanalyse**, **Farmanalyse**, **Merchant-Analyse** und **Entwicklungsbrief**. Ein Relevanzfilter priorisiert wiederkehrende Fehler, Rollbacks, starke positive/negative Rewards, Qualitätswarnungen, wichtige Teacher-Lektionen und auffällige Farm-/Merchant-Signale, statt komplette Rohlogs in den Prompt zu kopieren. Der Standardzeitraum beträgt 24 Stunden und kann auf 1–168 Stunden gestellt werden.

Jeder Brief enthält zwei Ebenen: einen verständlichen Arbeitsauftrag für ChatGPT und einen strukturierten JSON-Datenblock. Der Prompt fordert ausdrücklich, nur die gelieferten Fakten zu verwenden, Unsicherheiten zu kennzeichnen und Empfehlungen nach **24/7-Stabilität und Sicherheit vor EXP/h und Gold/h** zu priorisieren. Codeänderungen an deterministischer Logik werden getrennt von Änderungen am neuronalen Brain betrachtet.

Vor dem Export werden bekannte Secrets wie `WRITE_KEY`, `READ_KEY`, API-Keys, Tokens und Authorization-Werte entfernt. Standardmäßig werden Charakternamen außerdem in Rollen wie `Merchant`, `Farmer1`, `Farmer2` usw. umbenannt. Im Ingame-Gehirnfenster kann der Brief angezeigt oder kopiert werden. Das Web-Dashboard bietet dieselben Profile über den mit `READ_KEY` geschützten Endpunkt `/api/research-brief`. Der lokale Brief kann reichhaltiger sein, weil dort die aktuelle Audit-Historie verfügbar ist; der Web-Brief verwendet ausschließlich sicher synchronisierte D1-/Statusdaten und benennt fehlende Datenquellen ausdrücklich.

`brainDailyNeuronLimit` ist auf maximal **10.000 Neurons/Tag** begrenzt. Standardmäßig plant der Budget-Pacer bis **99,5 %**, also 9.950 Neurons. Die verbleibenden 50 Neurons sind eine Sicherheitsreserve für Token-Schätzabweichungen.

Der Teacher wird nicht einfach in einem starren Intervall aufgerufen. Der Bot berücksichtigt:

- verbleibendes Tagesbudget,
- Zeit bis zum nächsten UTC-Tageswechsel,
- gemessene durchschnittliche Neurons pro Teacher-Aufruf,
- Student-Unsicherheit (Entropie),
- Neuigkeit der aktuellen Situation gegenüber Experience Replay.

Dadurch werden neue oder unsichere Situationen bevorzugt und zugleich versucht, das konfigurierte kostenlose Tagesziel möglichst vollständig auszuschöpfen. Beim UTC-Tageswechsel setzt der Bot seinen lokalen Budgetstand zurück; die Cloudflare-D1-Tageszählung ist weiterhin die maßgebliche serverseitige Quelle.

## Erlaubte Brain-Aktionen

Das KI-Modell erzeugt keinen ausführbaren JavaScript-Code. Sowohl Teacher als auch Student sind auf eine Whitelist begrenzt:

- `continue`
- `change_farm_target`
- `replan_merchant`
- `explore`
- `wait`

Jede Entscheidung enthält Confidence und Strategie-Scores. Ungültige Antworten oder Aktionen werden verworfen.

## Gehirn-Übersicht im Web-Dashboard

Das Cloudflare-Dashboard zeigt zusätzlich zu Charakter- und Kartendaten eine eigene **🧠 Gehirn**-Sektion. Angezeigt werden unter anderem:

- heutige Neurons / harte Grenze / Lernziel,
- Teacher-Aufrufe und durchschnittlicher Verbrauch,
- nächster UTC-Reset,
- Student-Samples, Replay-Größe und Trainingsschritte,
- aktuelle Confidence, Entropie und Neuigkeit,
- Loss-EMA, Reward-EMA und Teacher-Übereinstimmung,
- Shadow-/Champion-/Challenger-Status einschließlich Canary- und Bewährungsphase,
- Promotions, Rollbacks und verworfene Challenger,
- letzte Teacher-Entscheidung und die zuletzt gemessenen Outcome-Rewards,
- einen animierten neuronalen Puls, der sichtbar macht, ob das Brain beobachtet, denkt, lernt, Outcomes bewertet oder einen Challenger prüft.
- das Gehirn-Tagebuch mit echten Teacher-Lektionen, Rewards, League-Ereignissen und Tageszusammenfassungen.
- den Lernqualitäts-Score mit Reward-Trend, Overconfidence-Fehlerquote, Loss-Drift, Instabilität, Teacher-Verstärkung, adaptiver Lernrate und aktuellem Autonomie-/Canary-Gate.

Die Ansicht liest diese Daten aus D1 über `/api/brain-status` und benötigt wie der übrige Dashboard-Lesezugriff den `READ_KEY`.

## D1-Langzeitgedächtnis

Neben dem Charakterstatus speichert D1 geteilte Einstellungen, Lern-/Explorer-Daten, Student-Gewichte und Brain-Telemetrie. `brain_decisions` enthält Teacher-Entscheidungen und `brain_learning_events` die später bewerteten Outcomes. Der `WRITE_KEY` wird absichtlich nicht in D1 synchronisiert.

## Merchant und Farmer

Bestehende 2.9.x-Funktionen bleiben erhalten: Farmer prüfen regelmäßig ihr Inventar auf bessere klassengeeignete Ausrüstung; der Merchant priorisiert Compounds, verhindert Kauf-Loops bei vollem Inventar, räumt Inventardruck auf und kann überschüssige +4-Nicht-Compound-Ausrüstung verkaufen, sobald die notwendige Gruppenreserve gedeckt ist. Der Idle-Merchant erkundet bekannte Weltpunkte und speichert Beobachtungen für das Lernsystem.

## Web-Dashboard / Cloudflare einrichten

Bei einer bestehenden Installation reicht normalerweise ein Schema-Update und ein neuer Worker-Deploy:

```bash
cd cloudflare-dashboard
npm install
npx wrangler login
npx wrangler d1 execute aio-bot-dashboard --remote --file=schema.sql
npm run deploy
```

Bei einer Erstinstallation zusätzlich eine D1-Datenbank `aio-bot-dashboard` anlegen, deren `database_id` in `wrangler.jsonc` eintragen und `WRITE_KEY` sowie `READ_KEY` als Wrangler-Secrets setzen. Das Workers-AI-Binding ist bereits als `AI` in `wrangler.jsonc` konfiguriert.

## Self-Updater / kanonisches Bot-Repository

Das Bot-Repository für Releases und automatische Updates ist:

**Riflex91 / Adventure-Land---The-Code-MMORPG---Bot--public**

`version.json` und die Bot-Defaults zeigen auf:

`https://github.com/Riflex91/Adventure-Land---The-Code-MMORPG---Bot--public`

Eine laufende Bot-Kopie kann eine neuere `main/bot.js` laden und den Adventure-Land-CODE-Slot aktualisieren. Ein geschlossener Browser/Game-Client kann sich naturgemäß nicht selbst starten.

## Sicherheit

Das selbstlernende Netz darf ausschließlich strategische Whitelist-Aktionen empfehlen. Der Bot behält lokale Schutzmechanismen, die Inventar-/Gruppenreserve und die bestehenden Release-Regressionstests. Das Inventarfenster ruft weiterhin niemals `preview_item()` auf. Vor einem produktiven 24/7-Einsatz sollte eine längere Live-Soak-Phase durchgeführt und die Gehirn-Telemetrie beobachtet werden.
