# PR20.2 Bank – NO-WRITE 5-Minuten-Stabilitaetstest

**Status:** BEREIT FUER REALEN INGAME-READ-ONLY-LAUF  
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
