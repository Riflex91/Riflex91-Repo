# Block 3 – Zentrale Aktionssteuerung und Ressourcensperren

## Ziel

Block 3 sorgt dafuer, dass keine Spielfunktion eigenmaechtig handeln kann. Jede geplante Arbeit wird als `AktionsAnfrage` an die zentrale `AktionsSteuerung` gegeben. Die Steuerung entscheidet ueber Reihenfolge, Ressourcen, Unterbrechung, Abbruch und den Schattenbetrieb.

## Zentrale Regel

**Keine Spielfunktion darf die zentrale AktionsSteuerung umgehen.**

Block 3 besitzt noch keinen aktiven Adventure-Land-Aktionsausfuehrer. Die einzige Ausfuehrung ist `SchattenAusfuehrung`: Sie protokolliert, was ausgefuehrt worden waere, ruft aber keine Spielaktion auf.

## Vorrang

Die vier Vorrangstufen bleiben:

1. `notfall`
2. `sicherheit`
3. `normal`
4. `hintergrund`

Die Vorrangstufe wird immer vor der numerischen `prioritaet` ausgewertet. Eine normale Anfrage mit einer sehr hohen Zahl kann deshalb niemals eine Notfallanfrage ueberstimmen. Innerhalb derselben Vorrangstufe entscheidet die numerische Prioritaet; danach folgen Anforderungszeitpunkt und Kennung deterministisch.

## Ressourcen

Exklusiv verwaltet werden:

- `bewegung`
- `inventar`
- `bank`
- `handel`
- `kampfziel`
- `gruppe`
- `ausruestung`

**Ressourcen werden immer gemeinsam oder gar nicht vergeben.** Eine Anfrage, die zum Beispiel `bewegung` und `inventar` benoetigt, erhaelt nicht nur eine der beiden Ressourcen, wenn die andere blockiert ist.

Jede Sperre speichert zusaetzlich den Wichtigkeitsrang. Dadurch kann eine niedrigere Vorrangstufe eine hoehere nicht allein durch eine grosse numerische Prioritaet verdraengen.

## Unterbrechung

Laufende `hintergrund`-, `normal`- und `sicherheit`-Arbeit ist fuer wichtigere Arbeit unterbrechbar. `notfall`-Arbeit ist waehrend ihres Laufs nicht durch eine andere Anfrage unterbrechbar.

Wird eine laufende Anfrage unterbrochen:

- werden alle ihre Ressourcen freigegeben
- wechselt ihr Laufzustand auf `abgebrochen`
- wird der Unterbrechungsgrund gespeichert
- wechselt der zugehoerige Schatteneintrag auf `unterbrochen`
- kann die wichtigere Anfrage ihre benoetigten Ressourcen atomar uebernehmen

Damit ist insbesondere garantiert, dass Notfallarbeit normale Arbeit sicher unterbrechen kann.

## Blockierte Arbeit

Eine blockierte wichtige Anfrage verhindert keine unabhaengige niedrigere Arbeit auf anderen Ressourcen. Die Steuerung versucht die Anfragen in Vorrangreihenfolge und darf eine niedrigere Anfrage starten, wenn die wichtigere Anfrage aktuell nicht alle benoetigten Ressourcen erhalten kann und die niedrigere Anfrage keine dieser Sperren benoetigt.

## Abbruch und Abschluss

`brecheAktionAb(...)` beendet wartende, blockierte oder laufende Arbeit kontrolliert. Bei laufender Arbeit werden alle Sperren freigegeben und der Abbruch im Schattenprotokoll dokumentiert.

`schliesseAktionAb(...)` ist nur fuer laufende Arbeit zulaessig. Auch beim normalen Abschluss werden alle Ressourcen freigegeben.

Bereits abgeschlossene, abgebrochene oder abgelaufene Anfragen werden nicht erneut gestartet. Eine AktionsAnfrage-Kennung darf innerhalb einer `AktionsSteuerung` nicht wiederverwendet werden.

## Schattenausfuehrung

**Die Schattenausfuehrung fuehrt keine Adventure-Land-Aktion aus.**

Jeder Schatteneintrag enthaelt mindestens:

- fortlaufende Nummer
- AktionsAnfrage-Kennung
- anfordernde Funktion
- geplante Aktion
- Vorrang und numerische Prioritaet
- benoetigte Ressourcen
- Begruendung
- Planungszeitpunkt
- aktuellen Abschlusszustand
- Abschluss- oder Unterbrechungsgrund

Damit kann spaeter nachvollzogen werden, welche Aktion geplant war und warum sie gestartet, unterbrochen, abgebrochen oder abgeschlossen wurde.

## Abgelaufene Anfragen

Eine Anfrage mit `gueltigBis` wird nach Ablauf nicht gestartet. Sie wechselt stattdessen auf `abgelaufen` und erzeugt keinen Schatteneintrag.

## Abschlusspruefungen

Die automatischen Tests pruefen insbesondere:

- Notfallarbeit unterbricht normale Arbeit selbst dann, wenn die normale Arbeit eine viel hoehere numerische Prioritaet besitzt
- konkurrierende Funktionen besitzen niemals dieselbe Ressource gleichzeitig
- mehrere benoetigte Ressourcen werden gemeinsam oder gar nicht vergeben
- eine blockierte wichtige Anfrage verhindert keine unabhaengige Arbeit auf freien Ressourcen
- expliziter Abbruch gibt alle Sperren frei
- normaler Abschluss gibt alle Sperren frei
- abgelaufene Arbeit wird nicht gestartet
- Schattenbetrieb erzeugt ein nachvollziehbares Protokoll
- selbst vorhandene Testfunktionen `attack` und `move` werden von der Schattenausfuehrung nicht aufgerufen

Da Block 3 noch keine Verbindung zu einem aktiven Adventure-Land-Aktionsadapter besitzt, ist fuer diesen Block kein aktiver Spieltest erforderlich. Die spaetere aktive Anbindung muss ausschliesslich hinter der zentralen `AktionsSteuerung` erfolgen.
