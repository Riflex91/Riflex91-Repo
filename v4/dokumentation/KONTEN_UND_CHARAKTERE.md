# Konten und Charaktere in V4

## Ziel

V4 wird so aufgebaut, dass mehrere Konten technisch sauber getrennt verwaltet werden koennen und Charaktere aus unterschiedlichen Konten trotzdem in einem gemeinsamen Bot-Verbund zusammenarbeiten koennen.

Die Kontotrennung darf niemals dazu benutzt werden, Spielregeln, Charaktergrenzen, Netzsperren oder andere Begrenzungen zu umgehen. Vor einer aktiven Mehrkonten-Freigabe werden die jeweils aktuellen Adventure-Land-Regeln erneut geprueft. Der Bot besitzt dafuer ein eigenes Regelprofil und startet keine verbotene Zahl aktiver Charaktere.

## Drei getrennte Begriffe

### Konto

Ein Konto ist eine eigenstaendige Adventure-Land-Anmeldung. Konto-bezogene Daten wie Bankbestand und Anmeldesitzung gehoeren ausschliesslich zu diesem Konto.

### Charakter

Ein Charakter gehoert genau zu einem Konto. Jeder laufende Charakter meldet mindestens:

- `kontoKennung`
- `charakterName`
- Spielwelt und Server
- Klasse und aktuelle Faehigkeiten
- Laufzeitkennung
- letzten Lebensnachweis

### Verbund

Ein Verbund ist eine logische Gruppe von Charakteren, die zusammenarbeiten sollen. Ein Verbund darf Charaktere aus mehreren Konten enthalten. Der Verbund ist keine gemeinsame Bank und kein gemeinsames Inventar.

Beispiel:

```text
Verbund "Hauptgruppe"
├── Konto A
│   ├── Krieger
│   └── Priester
└── Konto B
    ├── Magier
    └── Haendler
```

Die vier Charaktere koennen gemeinsam Ziele verfolgen, sich heilen, schuetzen, Gegenstaende uebergeben oder einen Haendlerdienst anfordern. Besitz bleibt trotzdem immer dem tatsaechlichen Konto beziehungsweise Charakter zugeordnet.

## Kontouebergreifende Hilfe

Die Verbundsteuerung darf unter anderem folgende Aufgaben koordinieren:

- gleiche Spielwelt und gleichen Server herstellen
- Gruppe bilden oder wiederherstellen
- gemeinsames Kampfziel bestimmen
- Heilen, Schutz, Aggro und Schaden verteilen
- gefaehrdete Charaktere erkennen und absichern
- Haendler zu einem Charakter schicken
- Gegenstaende oder Gold nachvollziehbar uebergeben
- gemeinsame Ereignisse und Bosse bearbeiten
- nach Verbindungsabbruch die Gruppe wieder zusammensetzen

Wichtig: Bank und Konto-Bestand werden nie als gemeinsam angenommen. Ein Haendler aus Konto B kann nicht so behandelt werden, als duerfte er ohne Uebergabe auf den Bankbestand von Konto A zugreifen.

## Anmeldung

### Bevorzugter Weg

Jedes Konto erhaelt ein eigenes Kontoprofil und eine eigene isolierte Anmeldesitzung. Die Anmeldung wird einmal in dieser Sitzung durchgefuehrt. Danach kennt die Bot-Laufzeit nur die interne `kontoKennung` und den Anmeldezustand.

Die Laufzeit in Adventure Land erhaelt niemals das Kennwort des Kontos.

### Web-Oberflaeche

Die spaetere Kontoseite zeigt pro Konto zum Beispiel:

```text
Konto: Hauptkonto
E-Mail-Adresse: p***@beispiel.de
Anmeldung: gueltig
Charaktere: Krieger, Priester
Verbundteilnahme: erlaubt
Automatischer Start: aktiviert
```

Moegliche Schaltflaechen:

- `Konto hinzufuegen`
- `Anmeldung oeffnen`
- `Anmeldung erneuern`
- `Charaktere zuordnen`
- `Verbundteilnahme erlauben`
- `Konto voruebergehend sperren`

Ein dauerhaft gespeichertes Kennwortfeld in der normalen Web-Oberflaeche ist nicht vorgesehen.

## Unbeaufsichtigter Neustart

Falls spaeter ein vollstaendig unbeaufsichtigter Neustart eine erneute Anmeldung verlangt, wird das als eigener Sicherheitsbaustein umgesetzt.

Dann gelten mindestens diese Regeln:

- Kennwoerter nur in einem serverseitigen Geheimnisspeicher oder im Geheimnisspeicher des Betriebssystems
- niemals im Adventure-Land-Code
- niemals in Quellcode, GitHub, Telemetrie, Vorfallpaketen oder Wiederholungen
- niemals dauerhaft im Browserspeicher
- Eingabe nur ueber HTTPS
- Ausgabe niemals im Klartext
- getrennte Berechtigung pro Konto
- sofortige Loesch- und Erneuerungsmoeglichkeit

Bis dieser Baustein ausdruecklich gebaut und geprueft ist, erfolgt eine benoetigte erneute Kontoanmeldung manuell in der jeweiligen isolierten Sitzung.

## Regelprofil fuer Charaktergrenzen

Die Verbundsteuerung prueft vor jedem automatischen Start:

1. welche Spielart aktiv ist,
2. welche Charaktergrenze laut aktuellem Regelprofil gilt,
3. wie viele Charaktere dieser Installation bereits aktiv sind,
4. ob ein weiterer Start erlaubt ist.

Bei einer Verletzung wird nicht gestartet. Stattdessen entsteht eine klare Meldung, zum Beispiel:

```text
[FEHLER] CHARAKTERGRENZE_ERREICHT
Was ist passiert: Der geplante Charakter wurde nicht gestartet.
Warum: Die erlaubte Zahl gleichzeitig aktiver Charaktere ist bereits erreicht.
Bot-Reaktion: Der Start wurde blockiert.
Nutzer muss handeln: JA
Was soll ich tun: Pruefe die aktiven Charaktere und die aktuellen Adventure-Land-Regeln.
```

V4 implementiert keine Umgehung ueber wechselnde Netze, versteckte Sitzungen oder aehnliche Verfahren.

## Verhalten bei Ausfaellen

Faellt ein Konto oder eine Sitzung aus, duerfen die anderen Konten weiter sicher arbeiten. Die Verbundsteuerung muss dann:

- den fehlenden Charakter als nicht verfuegbar markieren
- Aufgaben neu verteilen, wenn das sicher moeglich ist
- keine veralteten Faehigkeiten des ausgefallenen Charakters einplanen
- keine Gegenstandsuebergabe als erfolgreich betrachten, bevor beide Seiten sie bestaetigt haben
- bei sicherheitskritischem Rollenverlust gegebenenfalls den gesamten Verbund zurueckziehen

## Pflichtpruefungen

Vor der Freigabe der Mehrkontenfunktion werden mindestens getestet:

- zwei Konten mit getrennten Sitzungen
- mehrere Charaktere aus unterschiedlichen Konten im selben Verbund
- gleicher Charaktername darf nicht zwei Konten vermischen
- Bank- und Inventardaten bleiben kontogebunden
- Ausfall eines einzelnen Kontos
- abgelaufene Anmeldung
- Serverwechsel eines einzelnen Charakters
- doppelte und verspätete Verbundmeldungen
- Gegenstandsuebergabe mit Abbruch zwischen Senden und Bestaetigung
- Neustart der Verbundzentrale
- Charaktergrenze erreicht
- Plattform nicht erreichbar: lokale Sicherheit funktioniert weiter
