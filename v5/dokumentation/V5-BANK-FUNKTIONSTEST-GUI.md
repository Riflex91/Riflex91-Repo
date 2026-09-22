# V5 Bank-Funktionstest-GUI

Dieses Paket testet die Adventure-Land-Public-Functions direkt im CODE-Runner.

Unterstuetzte Funktionen:

- `bank_retrieve(pack, bankSlot, inventorySlot)`
- `bank_store(inventorySlot, pack, bankSlot)`
- `bank_swap(pack, a, b)`
- `open_bank_pack(pack, currency, timeout_ms)` – **nur Shadow/read-only**, kein Live-/Spend-Button

## Grundsaetze

- Funktionale Wahrheit ist die direkte Ausfuehrung im Adventure-Land-Browser.
- Jeder Shadow-Test ist read-only und kann wiederholt werden.
- Jeder LIVE-Test hat einen frischen Stabilitaets- und Performance-Preflight.
- `performance_trick()` muss aktiv sein und Howler `playing() === true` melden.
- Vor dem Public-Function-Aufruf wird ein LocalStorage-Intent geschrieben und per Roundtrip bestaetigt.
- Pro Funktion sind maximal zwei echte LIVE-Aufrufe zulaessig.
- LIVE 2 wird nur nach sauberem `COMMITTED` von LIVE 1 freigeschaltet.
- Nach moeglichem Send mit offenem oder unklarem Ergebnis wird kein Retry freigegeben.
- Kein Raw-Socket-Emit ist Teil des Testpakets.
- Das Fenster zeigt strukturierte Diagnose und bietet **Ergebnis kopieren** sowie **Gesamtbericht kopieren**.
- `OPEN PACK · Shadow` liest den ersten gesperrten kostenpflichtigen Pack auf der aktuellen Bank, Gold-/Shell-Kosten und beide Guthaben. Der Shadow ruft `open_bank_pack()` niemals auf und setzt `liveMutationFreigegeben=false`.
- `OPEN PACK · Admission` fuehrt denselben stabilen Shadow erneut read-only aus und bewertet Gold- und Shell-Pfad getrennt als `BEREIT` oder `BLOCKIERT`. Auch bei `BEREIT` bleibt `liveMutationFreigegeben=false`.

## Bedienung

1. `werkzeuge/bank-function-test-paket.js` vollstaendig in Adventure Lands CODE-Fenster laden und ausfuehren.
2. Die gewuenschte Funktion zuerst ueber **Shadow** pruefen.
3. Fuer LIVE 1 den im Fenster angezeigten Bestaetigungstext exakt eingeben.
4. Nur wenn LIVE 1 **BESTANDEN / COMMITTED** ist, wird LIVE 2 freigeschaltet.
5. Bei **BLOCKIERT**, **NICHT BESTANDEN** oder **UNGEKLAERT** nicht erneut senden. Mit **Ergebnis kopieren** bzw. **Gesamtbericht kopieren** die Diagnose uebernehmen.

Das browserpersistente Testjournal liegt unter `AIO_V5_BANK_FUNCTION_TEST_STATE_V1`.
Es gibt absichtlich keinen GUI-Button zum Zuruecksetzen des Testbudgets.
