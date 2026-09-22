# V5 – Verbindlicher automatischer Test-Masterplan

**Stand:** 2026-09-22  
**Status:** AKTIV / VERBINDLICH  
**Maschinenlesbare Quelle:** `v5/roadmap/v5-verbindlicher-testplan.json`

Dieser Plan ist fuer alle weiteren V5-Testlaeufe verbindlich. Ein neuer Chat/Agent soll die Gates in der festgelegten Reihenfolge selbststaendig abarbeiten und nach einem bestandenen Gate direkt mit dem naechsten Gate fortfahren. Ein Gate darf nicht uebersprungen werden.

## Ausfuehrungsregel

- Nach **BESTANDEN** automatisch zum naechsten Gate wechseln.
- Bei **NICHT_BESTANDEN**, Hang, Stillstand, unerwartetem Verhalten oder fehlender Evidence: sofort stoppen, Ursache eingrenzen, Fix umsetzen und das betroffene Gate erneut ausfuehren.
- Kein produktionsnaher Normalbetrieb vor Abschluss aller Gates.
- Nach PR21 automatisch den finalen 24h-Abnahmelauf mit **Merchant + Ranger + Priest + Mage** starten.
- Supabase bleibt fuer Telemetrie, Teststatus und Anomalie-Erkennung aktiv.
- **Ein Supabase-Ausfall darf nicht simuliert oder getestet werden.**

## Verbindliche Reihenfolge

1. **PR20.5 – Merchant Scheduler-Stabilitaet / Pingpong- und Starvation-Schutz**  
   15-Minuten-AUTO_ON_LOAD-Test mit Merchant + Ranger + Priest + Mage.

2. **PR20.6 – MLuck**  
   Korrekte Zielwahl, Reichweite, Mana/Cooldown/Freshness, keine Scheduler-Konflikte oder Spam-Loops.

3. **PR20.7 – Gear-Autonomie**  
   Gear-Auswahl, Verteilung, Schutzregeln und Settlement.

4. **PR20.8 – Upgrade / Compound / Exchange**  
   Funktion, Safety, Idempotenz und Reconciliation.

5. **PR20.9 – Craft / Production**  
   Materialfluss, Produktion, Recipient Settlement, Scheduler-Integration.

6. **PR20.10 – Farmer Combat, Class Skills und Farmer↔Merchant-Logistik**  
   Ranger, Priest und Mage einzeln und gemeinsam testen. Klassen-Skills muessen unter realen Bedingungen korrekt verwendet werden. Cooldown, Mana, Reichweite, Ziele, Single-Target/AoE, Heal-/Support-Priorisierung, Death/Respawn/Rejoin und Combat-Recovery sind Pflicht.  
   Zusaetzlich: Farmer muessen Items und Gold korrekt an den Merchant uebergeben, geschuetzte/benoetigte Items sowie Goldreserve behalten, HP-/MP-Trankbedarf rechtzeitig erkennen und richtige Art/Menge anfordern. Mehrere gleichzeitige Farmer-Anforderungen duerfen weder Starvation noch Merchant-Pingpong verursachen. End-to-End muss Farming -> Bedarf -> Merchant-Service -> Handoff/Lieferung -> Rueckkehr -> Farming funktionieren.

7. **PR20.11 – 24/7 Reliability & Recovery**  
   Prozess-/Crash-Recovery, Netzwerkstoerungen, Adventure-Land/API-Fehler, Race Conditions, Idempotenz, Restart mitten in Aktionen, Inventar-/Bank-Grenzfaelle, Ressourcenwachstum, Scheduler-Liveness, Death-/Respawn-Loops, Movement-Recovery, Potion-Notfaelle, Gold-/Item-Konsistenz, Auto-Update/Version-Wechsel, Clock/Suspend und Alerting testen.  
   **Ausnahme:** Kein Supabase-Ausfalltest. Supabase muss waehrend dieser Tests als Monitoring aktiv bleiben.

8. **PR21 – Vier-Charakter-Gesamtintegration**  
   Alle zuvor bestandenen Systeme gleichzeitig mit Merchant + Ranger + Priest + Mage. Jeder Charakter muss messbaren Fortschritt machen; keine Deadlocks, Starvation, Pingpong-Loops oder unerwarteten Gameplay-Writes.

## Finaler 24h-Abnahmelauf

Erst nach bestandenem PR21:

- 24 Stunden ununterbrochener Betrieb mit Merchant + Ranger + Priest + Mage.
- Keine manuellen Betriebseingriffe.
- Nicht nur Prozess-Liveness, sondern fachlichen Fortschritt pruefen: Combat, Skills, Healing, Movement, Loot, Potion-Versorgung, Item-/Gold-Transfers und Merchant-Aufgaben.
- Keine stillen Hangs, Deadlocks, Starvation, Restart-Loops oder unbounded RAM-/Queue-/Timer-/Listener-Entwicklung.
- Keine unaufgeloesten oder doppelten irreversiblen Wirkungen.
- Death/Respawn/Disconnect/Recovery muessen selbststaendig zurueck in einen gesunden Zustand fuehren.
- Supabase muss laufend Telemetrie und Anomalie-Signale liefern; ein Supabase-Ausfall wird nicht provoziert.

Nur wenn dieser Lauf besteht, ist der Status **V5_24_7_BETRIEBSBEREIT**.
