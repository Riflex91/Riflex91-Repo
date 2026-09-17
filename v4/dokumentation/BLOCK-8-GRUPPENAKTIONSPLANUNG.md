# Block 8 – Gruppenaktionsplanung

Status: **read-only Produktionsplanung in Arbeit**.

## Ziel

Die bestehende Block-8-Gruppenkoordination soll nicht bei abstrakten Faehigkeitszuordnungen stehen bleiben. Aus einer bereits geprueften `GruppenKoordinationsEntscheidung` werden deterministische, konkrete Gruppenschritte fuer:

- Heilen,
- Aggro,
- Schutz,
- Unterstuetzung,
- Bearbeitung des gemeinsamen Ziels

abgeleitet.

Diese Stufe fuehrt **keine Adventure-Land-Spielaktion** aus. Sie erzeugt bewusst noch keine `AktionsAnfrage`, weil fuer die einzelnen Gruppenschritte noch keine freigegebenen Adventure-Land-Ausfuehrungsadapter existieren. Erst eine spaetere, getrennt getestete Stufe darf eigene Plan-Schritte in Anfragen an `AktionsSteuerung` uebersetzen.

## Eingabe

`planeGruppenAktionen(...)` erhaelt:

1. die Teilnehmermeldungen,
2. die bereits erzeugte `GruppenKoordinationsEntscheidung`,
3. optional eine explizite Planungskonfiguration.

Die Gruppenaktionsplanung waehlt keine Rollen neu. Ausfuehrende Charaktere kommen ausschliesslich aus `entscheidung.aufgaben`. Damit bleibt die Faehigkeitswahl an einer Stelle gebuendelt und Klassenbezeichnungen beeinflussen die Planung nicht.

## Standard-Schwellen

Die ersten expliziten, konfigurierbaren Planungsgrenzen sind:

- Heilen unter Lebensanteil `0.70`,
- Schutz unter Lebensanteil `0.50`.

Schutz muss mindestens so streng wie Heilung bleiben; eine Schutzschwelle oberhalb der Heilungsschwelle wird abgelehnt.

Unter mehreren betroffenen aktiven Teilnehmern wird der niedrigste bekannte Lebensanteil gewaehlt. Bei gleichem Lebensanteil entscheidet die lexikographisch kleinere Charakterkennung. Unbekannte Lebensanteile werden nicht durch Schaetzungen ersetzt.

## Normalbetrieb

Bei `betriebsArt: normal` koennen folgende Schritte entstehen:

- `mitglied_heilen` fuer einen aktiven Teilnehmer unter der Heilungsschwelle,
- `mitglied_schuetzen` fuer einen aktiven Teilnehmer unter der Schutzschwelle,
- `ziel_aggro_binden`, wenn ein Aggro-Traeger und ein gemeinsames Ziel vorhanden sind,
- `gruppe_unterstuetzen`, wenn ein Unterstuetzungs-Traeger vorhanden ist,
- `gemeinsames_ziel_bearbeiten`, wenn ein Schadens-Traeger und ein gemeinsames Ziel vorhanden sind.

Aggro und Schadensbearbeitung verwenden ausschliesslich `entscheidung.gemeinsamesZielKennung`. Die Planung erfindet kein eigenes Kampfziel.

## Sicherheitsbetrieb

Bei `betriebsArt: sicherheit` hat Block 7 weiterhin Vorrang. Die Gruppenaktionsplanung darf dann nur:

- Heilung,
- Schutz

planen. Aggro, Unterstuetzung und Bearbeitung eines normalen gemeinsamen Ziels werden nicht erzeugt. `gemeinsamesZielKennung` bleibt im Plan `null`.

Bei `betriebsArt: blockiert` entsteht kein Aktionsschritt.

## Ressourcen fuer die spaetere Aktionssteuerung

Die Plan-Schritte tragen bereits deklarative Ressourcenanforderungen, ohne sie zu sperren oder auszufuehren:

- Heilung und Schutz: `gruppe`,
- Unterstuetzung: `gruppe`,
- Aggro und gemeinsames Ziel: `gruppe` + `kampfziel`.

Eine spaetere Adapterstufe kann diese Metadaten verwenden, um echte `AktionsAnfrage`-Objekte zu erzeugen. Bis dahin bleibt diese Planung rein beschreibend.

## Fail-safe

Die Planung blockiert, wenn eine Koordinationsentscheidung intern widerspruechlich ist, zum Beispiel wenn eine Aufgabe auf einen Teilnehmer verweist, der laut derselben Entscheidung nicht aktiv ist, oder wenn ein als aktiv markierter Teilnehmer in den Planungsdaten fehlt.

Veraltete oder ausgefallene Teilnehmer erhalten keine Schritte. Nach einem frischen Reconnect kann die vorgelagerte Gruppenkoordination die Aufgabe erneut zuweisen; die Gruppenaktionsplanung nimmt den Teilnehmer dann deterministisch wieder auf.

## Determinismus

- keine versteckte Uhrzeit,
- kein Zufall,
- keine Adventure-Land-Aufrufe,
- feste Schritt-Reihenfolge,
- deterministische Zielwahl bei Lebensanteil-Gleichstand,
- gleiche Meldungen und gleiche Koordinationsentscheidung ergeben denselben Plan.

Jeder Charakter kann mit `eigeneGruppenPlanSchritte(...)` aus dem gemeinsamen Plan nur die ihm zugewiesenen Schritte filtern. Dadurch koennen spaeter mehrere eigene Charaktere denselben Gruppenplan berechnen, ohne dass jeder Charakter eine eigene abweichende Gruppenstrategie erfindet.

## Automatisierte Abnahme dieser Stufe

`block8-gruppenaktionsplanung.test.mjs` prueft unter anderem:

1. konkrete Planung aller fuenf Gruppenaktionsarten,
2. Klassenunabhaengigkeit,
3. Sicherheitsvorrang vor Aggro, Support und Schaden,
4. fail-safe bei unbekannter Gruppensicherheit,
5. Aufgabenentzug bei stale Teilnehmer und Wiederaufnahme nach Reconnect,
6. deterministische Auswahl des niedrigsten Lebensanteils,
7. identische Ergebnisse bei anderer Eingabereihenfolge,
8. Blockierung inkonsistenter Aufgaben,
9. Filterung der eigenen Schritte,
10. Validierung der expliziten Schwellen.

## Naechster Schritt

Nach erfolgreicher CI folgt ein read-only Mehrcharakter-Schattennachweis mit echten `My_Ranger1`/`My_Ranger2`-Lebensnachweisen. Erst danach wird eine getrennte Adapterstufe entworfen, die einzelne freigegebene Gruppenplan-Schritte kontrolliert in `AktionsAnfrage` fuer `AktionsSteuerung` uebersetzt.
