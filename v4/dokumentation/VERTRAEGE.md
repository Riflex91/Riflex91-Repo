# V4 Vertraege

Die gleichen deutschen Begriffe werden in Laufzeit, Tests, Telemetrie, Wiederholung und Web-Oberflaeche verwendet.

## BotEreignis

Ein `BotEreignis` beschreibt etwas, das passiert ist. Es besitzt Kennung, laufende Nummer, Zeitpunkt, Namen, Quelle, Ablaufkennung und Details.

## AktionsAnfrage

Eine `AktionsAnfrage` beschreibt Arbeit, die der Bot gern ausfuehren moechte. Sie ist noch keine Erlaubnis, Adventure Land zu veraendern.

## RessourcenSperre

Eine `RessourcenSperre` gibt einem Besitzer exklusiven Zugriff auf Bewegung, Inventar, Bank, Handel, Kampfziel, Gruppe oder Ausruestung. Mehrere benoetigte Ressourcen werden atomar vergeben.

## Spielzustand

Ein `Spielzustand` ist eine unveraenderliche Momentaufnahme des Spiels. Unbekannte Fakten bleiben unbekannt.

## KontoProfil

Ein `KontoProfil` enthaelt nur nicht geheime Angaben zur Kontoerkennung und zum Anmeldezustand. Es enthaelt niemals ein Kontokennwort.

## CharakterZuordnung

Eine `CharakterZuordnung` verbindet einen Charakter eindeutig mit genau einem Konto und optional mit einem Verbund. Konto- und Charakterkennung werden gemeinsam betrachtet, damit Daten aus mehreren Konten nicht vermischt werden.

## VerbundTeilnehmer

Ein `VerbundTeilnehmer` beschreibt einen aktuell bekannten Charakter im gemeinsamen Verbund mit Konto, Charakter, Spielwelt, Server, Faehigkeiten und letztem Lebensnachweis. Veraltete Teilnehmer werden nicht weiter fuer Aufgaben oder Sicherheitsrollen eingeplant.

Ein Verbund kann Charaktere aus mehreren Konten enthalten. Daraus entsteht aber niemals ein gemeinsamer Bank- oder Inventarbesitz.

## AktionsErgebnis

Eine ausgefuehrte Aktion liefert ein `AktionsErgebnis` mit Erfolg, Grund, Zeitpunkten und Ablaufkennung statt nur `true` oder `false`.

## BotMeldung

Jede nutzersichtbare Warnung und jeder Fehler muss enthalten:

- Was ist passiert?
- Warum ist es passiert?
- Was hat der Bot getan?
- Muss der Nutzer handeln?
- Was soll der Nutzer tun?

Technische Details duerfen zusaetzlich gespeichert werden, ersetzen diese Erklaerungen aber niemals.

## Vorfall

Ein Vorfall verweist auf Beweise und Wiederholungsdaten. Er ist kein freier Text ohne Zusammenhang.

## EntwicklungsAufgabe

Fakten und Vermutungen bleiben getrennt. Eine Entwicklungsaufgabe darf ausdruecklich weitere Daten verlangen, statt voreilig eine Codeaenderung zu fordern.
