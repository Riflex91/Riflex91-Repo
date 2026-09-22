# PR20.2 Bank – NO-WRITE 5-Minuten-Stabilitaetstest

**Status:** REAL BESTANDEN / READ-ONLY / PR20.2 BLEIBT BLOCKIERT_FAIL_CLOSED  
**Stand:** 2026-09-22  
**Aktives Gate:** `PR20.2_BANK_PRODUKTIVIERUNG` bleibt `BLOCKIERT_FAIL_CLOSED`

## Zweck

Dieser Test sammelt die noch moegliche 5-Minuten-Stabilitaetsevidence fuer den
aktuellen Bankzustand, ohne einen weiteren Bank-Write auszufuehren. Er ersetzt
weder fehlende Withdraw-Live-Evidence noch einen Open-Pack-Live-Nachweis.

Die funktionale Wahrheit ist die direkte Ausfuehrung von
`werkzeuge/pr20-2-bank-no-write-5m-paket.js` im Adventure-Land-CODE-Runner.

## Harte NO-WRITE-Grenze

Der Harness:

- ruft keine mutierende Bank-Public-Function auf;
- besitzt keinen Raw-Socket-Pfad und keinen CODE-Bridge-Write;
- erzeugt keinen Gameplay-Intent und keine Authority;
- setzt `liveMutationFreigegeben=false`;
- liest `AIO_V5_BANK_FUNCTION_TEST_STATE_V1` nur und veraendert oder resetet
  das echte Funktionstestbudget nicht;
- schreibt ausschliesslich sein eigenes Evidence-Journal
  `AIO_V5_PR20_2_BANK_NO_WRITE_5M_V1` in Browser-LocalStorage;
- bleibt bei `sameIntentErneutSenden=false`.

Damit verbraucht dieser Test **keinen** der maximal zwei echten Live-Tests
einer Bankfunktion.

## Beobachtungen

Alle 15 Sekunden werden fuer mindestens 5 Minuten gebunden beobachtet:

- Account, Character, Session und Server;
- Merchant, Bank-Mount, Alive/Stationary und leere Queue;
- Inventory- und Bank-Fingerprint;
- Character-Gold, Shells und Bank-Gold;
- unveraendertes browserpersistentes Bank-Funktionstestjournal;
- erster gesperrter kostenpflichtiger Open-Pack-Kandidat;
- weiterhin fehlende Finanzierbarkeit beider Open-Pack-Pfade;
- `performance_trick()` mit `aktiv=true` und `playing=true`;
- keine alternative V3/V4-Runtime;
- lueckenlose Evidence-Kette und Sample-Gaps <= 45 Sekunden.

Jede Bindungs-, Bank-, Inventory-, Ressourcen- oder Journaldrift beendet den
Lauf fail-closed. Wird Gold oder Shells waehrenddessen fuer Open-Pack
finanzierbar, endet der Test ebenfalls ohne Send; dann ist der Ressourcenstand
neu zu bewerten.

## Bedienung

1. Das vollstaendige Paket
   `werkzeuge/pr20-2-bank-no-write-5m-paket.js` in Adventure Lands
   CODE-Fenster laden und ausfuehren.
2. Merchant in der Bank ruhig stehen lassen und keine andere Bankaktion
   ausfuehren.
3. **1 · Passive Vorpruefung** ausfuehren.
4. Nur bei `BESTANDEN` den Bestaetigungstext
   `PR20.2-BANK-NO-WRITE-5M-START` exakt eingeben und
   **2 · NO-WRITE 5M starten** ausfuehren.
5. Bis zum Abschluss nicht bewegen und keine Bank-/Inventory-Aktion starten.
6. Danach **Gesamtbericht kopieren** und als reale Evidence uebernehmen.

## Gate-Wirkung

Auch ein bestandener Lauf:

- schliesst Withdraw **nicht**;
- schliesst Open-Pack-Live **nicht**;
- erlaubt keine breite Bank-Aktivierung;
- erlaubt keinen Start von PR20.3;
- laesst PR20.2 weiterhin `BLOCKIERT_FAIL_CLOSED`.

Er ist ausschliesslich zusaetzliche read-only Stabilitaets-/Integrationsevidence
fuer die derzeit noch moegliche Arbeit innerhalb PR20.2.


## Preflight 1 – SERVER_BINDUNG_FEHLT, sicher blockiert

Der erste reale Preflight auf `8b1ba278b5d1026e6cb6afcbe7be59da62ac69cb`
wurde vor dem 5-Minuten-Lauf mit `SERVER_BINDUNG_FEHLT` blockiert.

Sicherheitsnachweis:

- `performance_trick()`: aktiv und `playing=true`;
- Merchant in `bank`, alive, stationary, Queue leer;
- Open-Pack weiterhin 15.993.820 / 75.000.000 Gold und 0 / 600 Shells;
- 0 Gameplay-Writes;
- 0 mutierende Public-Function-Aufrufe;
- kein Intent;
- keine Authority;
- kein Live-Testbudget verbraucht.

Die Ursache war ein Harness-Beobachtungsfehler in Controller 1.0.0: die
Serverbindung wurde nur ueber direkte `root.server_region` /
`root.server_identifier` gelesen.

Controller 1.0.1 liest fail-closed aus denselben Adventure-Land-Runner-Surfaces
wie die bestehenden produktiven Browserpfade:

- direkte Legacy-Globals;
- `server.region/server.id`;
- Parent-Legacy-Globals;
- Parent-`server.region/server.id`.

Fehlt danach weiterhin eine vollstaendige Serverbindung, bleibt der Preflight
weiterhin blockiert. Evidence:
`roadmap/pr20-2-bank-no-write-5m-preflight-blocked-evidence.json`.


## Realer 5-Minuten-Lauf – BESTANDEN

Der reale Lauf auf
`bb3d1d9108457acae36d30a896549f91598621aa` mit Controller 1.0.1 ist
vollstaendig **BESTANDEN**:

- Dauer: **300017 ms**;
- **21 Samples**;
- **0 Sample-Gaps**;
- **0 Drift-Samples**;
- Evidence-Kette gueltig;
- **0 performance_trick-Fehler**;
- **0 alternative Runtime-Samples**;
- **0 Gameplay-Writes**;
- **0 mutierende Public-Function-Aufrufe**;
- kein Intent;
- keine Authority;
- kein Live-Testbudget verbraucht;
- `sameIntentRetry=false`.

Open-Pack blieb ueber den Lauf ressourcenbedingt blockiert:
15.993.820 / 75.000.000 Gold und 0 / 600 Shells.

Evidence:
`roadmap/pr20-2-bank-no-write-5m-evidence.json`.

## Kein 15-Minuten-Lauf jetzt

Der ratifizierte Testzeit-Standard reserviert 15 Minuten fuer
Integrations-/Releasegates. PR20.2 ist aktuell wegen Withdraw-Testlimit und
Open-Pack-Ressourcen **nicht exit-faehig**. Ein weiterer read-only 15m-Lauf
koennte keinen dieser beiden Blocker schliessen und haette deshalb aktuell
keinen Gate-Nutzen.

Daher gilt jetzt:

- kein dritter Withdraw-Test;
- kein Open-Pack-Live ohne neue Finanzierbarkeit und neue read-only Admission;
- kein weiterer Bank-Ingame-Test nur zur Wiederholung derselben Stabilitaet;
- PR20.3 bleibt gesperrt;
- Reopen erst bei einem dokumentierten Zustands- oder Code-Trigger.

Maschinenlesbarer Closeout:
`roadmap/pr20-2-bank-blocker-closeout.json`.
