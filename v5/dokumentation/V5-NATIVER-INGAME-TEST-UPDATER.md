# V5 nativer Ingame-Test-Updater

Der V5-Testpfad kann unabhängig von der Windows Bridge arbeiten.

## Ablauf

1. Auf dem **Merchant** läuft einmalig `v5/werkzeuge/v5-autonomous-test-ingame-updater.js`.
2. Der Updater fragt alle 60 Sekunden den bestehenden öffentlichen Cloudflare/R2-Release-Mirror ab.
3. Er lädt `v5/roadmap/v5-autonomous-test-manifest.json`.
4. Nur ein Manifest für `Riflex91/Riflex91-Repo`, Branch `main`, Coordinator `merchant` und `PACKAGE_OWNED_COMMAND_CHARACTER` wird akzeptiert.
5. Ein anderer nichtterminaler V5-Test blockiert jeden Wechsel.
6. Das Paket wird ausschließlich unter `v5/werkzeuge/<datei>.js` geladen, größenbegrenzt und vor dem Speichern gegen die im Manifest festgelegte SHA-256 geprüft.
7. Direkt vor dem Apply werden Testzustand und Merchant-Sicherheit erneut geprüft.
8. Der Updater baut einen persistierenden Slot-Inhalt aus **Updater + geprüftem Testpaket**, speichert ihn über Adventure Lands `upload_code(...)` im aktuell aktiven Code-Slot und startet denselben Slot mit `load_code(...)` neu.
9. Dadurch ist der Updater nach dem Reload wieder vorhanden und kann nach einem terminalen Gate den nächsten manifestierten Test laden.
10. Das Testpaket selbst verteilt seinen Worker über `command_character(...)` an Ranger, Priest und Mage.

## Sicherheitsgrenzen

- kein `eval` und kein `new Function`;
- kein Raw-Socket-Write;
- keine frei konfigurierbare Download-URL;
- nur der feste Cloudflare-Endpunkt `https://aio-bot-dashboard.hansijuergenlul.workers.dev`;
- Manifest bleibt commit- und SHA-256-gebunden;
- `normalRuntimeAllowed` muss `false` bleiben;
- fremde nichtterminale V5-Tests werden niemals ersetzt;
- Download-/Hash-/Slot-/Reload-Fehler bleiben fail-closed;
- die Windows-Bridge-Auto-Deploy-Funktion aus PR #636 bleibt unverändert als zusätzlicher Fallback bestehen.

## Cloudflare/R2-Publikation

Der bestehende Workflow `.github/workflows/deploy-cloudflare.yml` publiziert das durch das Manifest bezeichnete Testpaket aus exakt `sourceCommit`. Die SHA-256 wird vor dem Upload geprüft. Updater und Paket werden zuerst veröffentlicht; das Manifest wird als Pointer zuletzt geschrieben. Danach werden alle drei Artefakte aus R2 zurückgelesen und erneut verifiziert.

Damit ist nach der einmaligen Ingame-Installation des Updaters kein manuelles Nachladen von Test-JavaScript auf Merchant, Ranger, Priest oder Mage nötig.
