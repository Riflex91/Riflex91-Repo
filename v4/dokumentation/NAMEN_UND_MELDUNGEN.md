# Deutsche Namen und narrensichere Meldungen

## Verbindliche Namensregel

Alle von uns kontrollierten V4-Bezeichnungen sind deutsch. Dazu gehoeren Klassen, Funktionen, Variablen, Zustaende, Ereignisse, Fehlerkennungen, Warnungen, Ordner und Dokumente.

Technisch vorgegebene Namen externer Werkzeuge wie `package.json`, TypeScript-Schluesselwoerter oder GitHub-Actions-Felder sind davon ausgenommen.

Umlaute werden im Quellcode und in Dateinamen als `ae`, `oe`, `ue` und `ss` geschrieben. Nutzertexte duerfen normale Umlaute enthalten.

## Beispiele

Gut:

- `AktionsAnfrage`
- `AktionsAuswahl`
- `waehleNaechsteAktion()`
- `RessourcenVergabe`
- `versucheRessourcenZuSperren()`
- `gibRessourcenFuerBesitzerFrei()`
- `Spielzustand`
- `BotEreignis`
- `sendeEreignis()`

Nicht verwenden:

- `Intent`
- `Arbiter`
- `DomainEvent`
- `ResourceLease`
- `Manager`
- kryptische Kuerzel wie `mgr`, `ctx`, `cfg`
- nichtssagende Funktionen wie `handleData()`, `process()` oder `doStuff()`

## Regel fuer Warnungen und Fehler

Eine Meldung beantwortet immer diese Fragen:

1. **Was ist passiert?**
2. **Warum ist es passiert?**
3. **Was hat der Bot getan?**
4. **Muss ich etwas tun?**
5. **Was soll ich tun?**

Beispiel:

```text
[WARNUNG] BEWEGUNG_BLOCKIERT – Merchant erreicht die Bank nicht

Was ist passiert: Der Merchant hat sich seit 30 Sekunden nicht zur Bank bewegt.
Warum: Die aktuelle Route hat keinen Fortschritt gemacht.
Bot-Reaktion: Die Bewegung wurde gestoppt. In 5 Sekunden wird eine neue Route versucht.
Nutzer muss handeln: NEIN
Was soll ich tun: Nichts. Nur eingreifen, wenn diese Warnung wiederholt erscheint.
```

Eine Meldung wie `NAV_STALL_RETRY_3` allein ist in V4 verboten.

## Meldungsstufen

- `hinweis` – normale, hilfreiche Information
- `warnung` – etwas Ungewoehnliches ist passiert, der Bot kann aber weiterarbeiten oder hat sich erholt
- `fehler` – eine Aufgabe ist fehlgeschlagen und normale Arbeit ist beeintraechtigt
- `kritisch` – Sicherheit, Datenintegritaet oder autonomer Weiterbetrieb kann nicht garantiert werden

Die Stufe beschreibt die Auswirkung, nicht die Ueberraschung des Entwicklers.
