# Block 8.5 – Freigabestufen

Status: **8.5.9 Freigabe-Gate implementiert; Offline und realer Schattenlauf fuer den exakten Candidate bestanden. Kontrolliert live ist die naechste offene Stufe; Block 9 bleibt gesperrt.**

## Ziel

Neue oder wesentlich geaenderte V4-Laufzeitpfade duerfen nicht allein deshalb in den naechsten Entwicklungsblock uebergehen, weil Quellcode und Einheitstests gruen sind.

Die verbindliche Reihenfolge lautet:

1. deterministischer Offline-Test oder Wiederholung,
2. Schattenbetrieb ohne echte Spielaktion,
3. begrenzter kontrollierter Live-Test,
4. Soak-Test mit Telemetrie, Recovery-Nachweis und bestandener Gesamtauswertung.

Erst nach vier bestandenen Stufen fuer **denselben Laufzeitpfad und denselben Aenderungsstand** darf Block 9 freigegeben werden.

## Neue read-only Freigabeauswertung

Vertrag:

`v4/laufzeit/quelle/vertraege/freigabestufen.ts`

Auswertung:

`v4/laufzeit/quelle/telemetrie/freigabestufen.ts`

Funktion:

`werteFreigabestufenAus(...)`

Die Auswertung besitzt keine Spiel-, Laufzeit- oder Neustartautoritaet.

Das Ergebnis setzt fest:

- `spielAutoritaet: false`
- `neustartAutoritaet: false`

Sie fuehrt keine Adventure-Land-Aktion aus und startet keine Freigabestufe selbst.

## Bindung an den Aenderungsstand

Jeder `FreigabeNachweis` traegt:

- `laufzeitPfadKennung`
- `aenderungsKennung`
- `stufe`
- `nachweisKennung`
- Ergebnis und Durchfuehrungszeitpunkt
- die fuer die jeweilige Stufe benoetigten Sicherheitsmerkmale.

Alle Nachweise einer Auswertung muessen exakt zu derselben:

- Laufzeitpfad-Kennung,
- Aenderungs-Kennung

gehoeren.

Damit darf ein alter Block-8-Live-Smoke nicht als Nachweis fuer einen spaeter geaenderten Block-8.5-Bedienpfad verwendet werden.

Die `aenderungsKennung` ist bewusst ein externer unveraenderlicher Identifikator. Sie kann zum Beispiel auf einen exakt getesteten Git-Commit, Release-Stand oder einen anderen eindeutig gebundenen Build-Nachweis zeigen.

## Stufe 1 – Offline

Ein bestandener Offline-Nachweis wird nur anerkannt, wenn:

- `deterministisch: true`
- `spielAktionAusgefuehrt: false`

gilt.

CI, Einheitstests und Wiederholungen bilden die technische Grundlage dieser Stufe.

Ein gruener Offline-Test allein setzt:

`block9Freigegeben: false`

Die naechste Stufe bleibt `schatten`.

## Stufe 2 – Schatten

Ein Schattennachweis wird nur anerkannt, wenn:

`spielAktionAusgefuehrt: false`

gilt.

Eine echte Spielaktion macht diesen Nachweis fail-safe ungueltig.

Schattenbetrieb darf damit reale Laufzeitdaten beobachten und kontrollierte Laufzeitzustaende pruefen, aber keine Adventure-Land-Spielaktion als Schattennachweis ausgeben.

## Stufe 3 – kontrolliert live

Ein Live-Nachweis wird nur anerkannt, wenn:

`begrenzt: true`

gilt.

Damit kann kein unbegrenzter Produktionslauf versehentlich als kontrollierter Live-Test deklariert werden.

Die konkrete fachliche Live-Huelle eines Laufzeitpfades muss ihre eigenen engeren Safety-, Ressourcen- und Autoritaetsgrenzen weiterhin separat erzwingen.

## Stufe 4 – Soak

Ein Soak-Nachweis braucht gleichzeitig:

- `telemetrieNachweis: true`
- `recoveryNachweis: true`
- `gesamtauswertungBestanden: true`

Ein langer Lauf ohne auswertbare Telemetrie oder ohne Recovery-Nachweis ist damit keine bestandene Soak-Stufe.

Die uebergeordneten spaeteren 24-Stunden-, 72-Stunden- und 7-Tage-Systemkampagnen werden dadurch nicht ersetzt.

## Keine Stufe darf uebersprungen werden

Fehlt eine vorherige Stufe:

- bleibt diese Stufe `offen`,
- jede spaetere vorhandene Stufe wird nur als `blockiert` angezeigt,
- ihr Nachweis wird nicht als Freigabe anerkannt.

Ist eine vorherige Stufe `fehlgeschlagen`, gilt dasselbe.

Ein spaeter gruener Nachweis kann einen frueheren offenen oder fehlgeschlagenen Nachweis nicht ueberdecken.

## Zeitliche Reihenfolge

Ein Nachweis darf zeitlich nicht vor der zuletzt bestandenen vorherigen Stufe liegen.

Ein rueckwaertiger Nachweis wird als `fehlgeschlagen` bewertet.

Damit kann die Reihenfolge nicht durch nachtraegliches Einsetzen alter Nachweise umgangen werden.

## Mehrdeutige Nachweise

Pro Stufe ist genau ein Nachweis in einer Auswertung erlaubt.

Zwei Nachweise derselben Stufe werden als mehrdeutige Eingabe abgewiesen.

Falls eine Stufe erneut durchgefuehrt werden muss, wird fuer die neue Freigabeauswertung der alte Stufennachweis durch den neuen eindeutigen Nachweis ersetzt; beide werden nicht gleichzeitig als Autoritaet akzeptiert.

## Block-9-Gate

Nur wenn alle vier Eintraege:

`zustand: bestanden`

besitzen, setzt die Auswertung:

- `freigabeVollstaendig: true`
- `block9Freigegeben: true`
- `naechsteStufe: null`

In jedem anderen Zustand gilt:

`block9Freigegeben: false`

## Tests

`v4/laufzeit/tests/block8-5-freigabestufen.test.mjs`

prueft unter anderem:

- vier korrekte sequenzielle Nachweise geben Block 9 frei,
- Offline allein reicht nicht,
- fremder Aenderungsstand wird nicht wiederverwendet,
- Schatten mit echter Spielaktion wird nicht anerkannt,
- kontrollierter Live-Test muss begrenzt sein,
- Soak braucht Telemetrie, Recovery und Gesamtauswertung,
- spaetere Nachweise duerfen offene Stufen nicht ueberspringen,
- eine fehlgeschlagene Stufe blockiert alle spaeteren,
- rueckwaertige Zeitreihenfolge wird blockiert,
- doppelte Stufennachweise werden abgewiesen,
- leere Pfad-/Aenderungskennungen werden fail-safe abgewiesen.

## Aktueller Block-8.5-Freigabestand

Mit dieser Implementierung ist die **Freigabemechanik** von Schritt 8.5.9 vorhanden.

Das bedeutet noch nicht, dass die neuen Block-8.5-Laufzeitpfade bereits alle vier operativen Stufen durchlaufen haben.

Insbesondere duerfen historische Block-8-Nachweise nicht automatisch fuer den neuen Block-8.5-Aenderungsstand wiederverwendet werden.

Fuer den finalen Block-8.5-Aenderungsstand liegt inzwischen ein kanonischer Offline-Nachweis vor:

`BLOCK-8-5-OFFLINE-FREIGABE-NACHWEIS.json`

Zusaetzlich liegt jetzt der reale kanonische Schattennachweis vor:

`BLOCK-8-5-SCHATTEN-FREIGABE-NACHWEIS.json`

Die reale Freigabeauswertung ergibt damit:

- `offline: bestanden`
- `schatten: bestanden`
- `kontrolliert_live: offen`
- `soak: blockiert`
- `naechsteStufe: kontrolliert_live`
- `freigabeVollstaendig: false`
- `block9Freigegeben: false`

## Naechster operativer Schritt

Fuer Schatten, kontrolliert live und Soak ist inzwischen der getrennte Runner

`BLOCK-8-5-FREIGABE-LIVE-TEST.md`

vorbereitet.

Er akzeptiert ausschliesslich Runtime 1.1.5 und laedt oder veroeffentlicht selbst keinen Runtime-Build.

Fuer die reale Schattenausfuehrung ist zusaetzlich das source-locked Copy/Paste-Paket `block8-5-schatten-paket.js` vorbereitet. Es kombiniert Bootstrap, GUI und Runner, laedt den immutable Candidate mit `aktivFreigegeben: false`, ruft die Runtime nicht `starte()`-aktiv und entsperrt die Schattenaktion erst nach einem erneuten strikten Null-Heartbeat-Preflight.

Der Schattenmodus ist jetzt zusaetzlich fail-safe getrennt: Runtime `aktivFreigegeben: false`, nicht gestartet, kein CM-Empfang, kein `performance_trick()`-Aufruf und exakt 0 Heartbeat-Sendeversuche. Erst eine daraus erzeugte `schattenUebergabe` darf in einer **separaten aktiven Sitzung** den kontrollierten Live-Test freischalten. Live und Soak markieren `spielAktionAusgefuehrt: true`, weil der aktive Produktionsheartbeat ueber `send_cm(...)` laeuft; der Runner selbst besitzt weiterhin keinen direkten Adventure-Land-Spielaktionsaufruf.

Der Release-Candidate ist exakt `88185523c81687dc16f9647ca5e7568c5e2c228c` mit `aenderungsKennung: git:88185523c81687dc16f9647ca5e7568c5e2c228c`. Deployment und oeffentliche HTTPS-Verifikation sind durch Run `35402650432` fuer genau diesen Candidate bestaetigt. Ein erneuter Release ist fuer diesen Nachweis nicht erforderlich. Fuer zukuenftige V4-Releases ist der separate manuelle `release-v4-runtime.yml`-Workflow der vorgesehene Pfad.

Damit lautet die operative Reihenfolge fuer den finalen Block-8.5-Laufzeitstand:

1. finalen Aenderungsstand eindeutig festlegen,
2. Runtime-1.1.5-Build und immutable Deployment/HTTPS-Nachweis fuer diesen Stand bestaetigen — **ERFUELLT**,
3. Offline-Nachweis an denselben Aenderungsstand binden — **ERFUELLT**,
4. Schattenlauf im Adventure-Land-Kontext mit gesperrter, nicht gestarteter Runtime und 0 Heartbeat-/CM-Sendeversuchen — **ERFUELLT**,
5. separate aktive Sitzung mit kanonisch gebundener Schattenuebergabe und begrenztem kontrolliertem Live-Test ueber genau eine sichere Pause/Fortsetzung — **NAECHSTE STUFE**,
6. mindestens zehnminuetiger Soak-Lauf mit Telemetrie und Recovery-Auswertung,
7. erst danach Block 9 freigeben.


Fuer Schritt 5 steht das source-locked `BLOCK-8-5-LIVE-PAKET.md` / `block8-5-live-paket.js` bereit. Es entsperrt den kontrollierten Live-Test erst nach einem bestaetigten echten Produktionsheartbeat.
