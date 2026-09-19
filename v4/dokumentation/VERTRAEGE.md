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

## BedienAnfrage

Eine `BedienAnfrage` beschreibt jede veraendernde oder freizugebende Nutzeraktion, bevor sie ausgefuehrt wird. Sie enthaelt Titel, Erklaerung, Auswirkung, `BedienRisiko` und alle benoetigten Voraussetzungen.

## BedienRisiko

V4 kennt drei Bedienrisiken:

- `unkritisch` – darf bei erfuellten Voraussetzungen direkt ausgefuehrt werden
- `vorsicht` – braucht eine ausdrueckliche Bestaetigung
- `kritisch` – braucht zusaetzlich einen exakt passenden Bestaetigungstext und darf niemals mit einem einzelnen Klick ausgefuehrt werden

## BedienSicherung

Die `BedienSicherung` ist die zentrale Freigabestelle fuer Nutzeraktionen. Fehlende Voraussetzungen, fehlende Erklaerungen oder fehlende Bestaetigungen fuehren zur Blockierung.

Eine Oberflaeche darf diese Sicherung nicht umgehen.

## NutzerAuftrag

Ein `NutzerAuftrag` beschreibt ein vom Nutzer vorgegebenes, eindeutig strukturiertes Ziel wie `sammeln` oder `herstellen`. Freitext darf nur beim Erfassen helfen und wird niemals direkt ausgefuehrt.

Der Auftrag nennt Gegenstand, Zielmenge, Mengenart und Zustand. Die Mengenart unterscheidet ausdruecklich zwischen `zusaetzlich` und `gesamtbestand`.

## AuftragsVorschlag

Ein `AuftragsVorschlag` ist eine sichere Eingabehilfe fuer die Web-Oberflaeche. Er zeigt nur bekannte Auftragsarten oder bekannte Gegenstaende und enthaelt Anzeigetext, Einfuegetext, Erklaerung und Suchwoerter.

Die Vorschlaege werden waehrend der Eingabe gefiltert. Direkte Wortanfaenge erhalten Vorrang vor einfachen Teiltreffern. Unbekannte Eingaben ergeben keinen scheinbar gueltigen Vorschlag.

Ein Vorschlag darf niemals selbst eine veraendernde Aktion starten.

## AuftragsPruefung

Die `AuftragsPruefung` kontrolliert vor jeder Planung, ob Auftragsart, Gegenstand, Zielmenge und Mengenart eindeutig und bekannt sind. Unbekannte oder mehrdeutige Angaben werden blockiert statt geraten.

## AuftragsPlan

Ein `AuftragsPlan` erklaert vor dem Start, was erreicht werden soll, was bereits vorhanden ist, was noch fehlt, welche Teilaufgaben geplant sind, welche Charaktere beteiligt sind und welche Gegenstaende oder Mittel verbraucht werden koennen.

## TagesBericht

Ein `TagesBericht` fasst die vergangenen exakt 24 Stunden aus strukturierten Laufzeitdaten zusammen. Er enthaelt Gesamtzustand, Charakterwerte, wichtige Vorfaelle, Entwicklungsstatus, Vergleich zum vorherigen 24-Stunden-Zeitraum und eine eindeutige Aussage, ob der Nutzer handeln muss.

Ein Bericht besitzt eine eindeutige `berichtKennung`, damit derselbe Zeitraum nach Neustarts oder wiederholter Zeitgeberausloesung nicht doppelt versendet wird.

## TagesBerichtEinstellung

Eine `TagesBerichtEinstellung` legt fest, ob der Bericht aktiviert ist, zu welcher lokalen Uhrzeit er versendet wird, welche Zeitzone gilt und ob die Ausgabe in der Web-Oberflaeche, per E-Mail oder ueber beide Wege erfolgt.

E-Mail-Versanddaten gehoeren ausschliesslich auf die Server-Seite. Adventure Land selbst versendet keine E-Mails.

## DienstProfil

Ein `DienstProfil` beschreibt die aktuell geprueften Grenzen eines externen Dienstes. Es enthaelt Tarif, offizielle Quelle, Pruefdatum, Gueltigkeitsende und alle fuer V4 relevanten Nutzungsgrenzen mit Sicherheitspuffer.

Ein abgelaufenes oder unvollstaendiges Dienstprofil darf nicht fuer neue externe Aufrufe verwendet werden.

## DienstGrenze

Eine `DienstGrenze` beschreibt genau eine Verbrauchsdimension, zum Beispiel Anfragen pro Tag, gelesene Zeilen, geschriebene Zeilen, Funktionsaufrufe, Nachrichten, Verbindungen, Speicher oder Operationen.

Das `anbieterMaximum` ist niemals automatisch das fuer V4 nutzbare Maximum. Der `sicherheitsPuffer` wird vorher abgezogen.

## DienstAnfrage

Eine `DienstAnfrage` muss vor dem externen Aufruf alle betroffenen Grenzen und den jeweils maximal moeglichen Verbrauch angeben. Unbekannter Maximalverbrauch fuehrt zur Blockierung statt zu einer Schaetzung.

## KontingentWaechter

Der `KontingentWaechter` entscheidet zentral, ob eine externe Anfrage sicher ausgefuehrt werden darf. Er reserviert den schlechtesten angegebenen Verbrauch vor dem Aufruf und verwendet fuer seine Rechnung den hoeheren Wert aus lokaler Reservierung und vom Anbieter gemeldetem Verbrauch.

## Vorfall

Ein Vorfall verweist auf Beweise und Wiederholungsdaten. Er ist kein freier Text ohne Zusammenhang.

## EntwicklungsAufgabe

Fakten und Vermutungen bleiben getrennt. Eine Entwicklungsaufgabe darf ausdruecklich weitere Daten verlangen, statt voreilig eine Codeaenderung zu fordern.

## SkillKatalog

Ein `SkillKatalog` ist die versionierte, normalisierte read-only Sicht auf Adventure Lands aktuell beobachtetes `G.skills`. Er traegt eine stabile Generation, einen fachlichen Fingerprint und genau einen der Zustaende `bereit`, `veraltet`, `drift` oder `blockiert`.

Der fachliche Fingerprint verwendet V4s zentrale `kanonisiereJson(...)`-Darstellung zusammen mit `berechneSha256(...)`. Der Skill-Katalog fuehrt keine eigene zweite Kanonisierung oder Hash-Funktion.

Live-Erkennung ist keine Automationsfreigabe: Das Feld `automationValidated` bleibt fuer neue oder unbekannte Skills `false`, bis ihre Semantik in V4 ausdruecklich validiert wurde. Unbekannte Daten erzeugen keine zusaetzliche Autoritaet.

Die `technischeReadiness` ist in Block 8.6.1 bewusst charakterunabhaengig `unbekannt` und besitzt `aktionsFreigabe: false`. Charakterbezogene Readiness aus Level, Equipment, Material, aktuellem Zustand und SkillPolicy wird erst in Block 8.6.4 abgeleitet.

Der Katalog selbst besitzt immer `spielAutoritaet: false`. Ein zweiter identischer Snapshot nach fachlicher Drift macht den Katalog nicht automatisch wieder produktionsbereit; die Revalidierung muss den exakt aktuellen Fingerprint bestaetigen.


## SkillKatalogAudit

Ein `SkillKatalogAudit` bindet den read-only Live-Katalog an eine konkrete Charakter-/Serveridentitaet und dokumentiert, warum ein Audit stattgefunden hat. Ausloeser sind mindestens Runtime-Start, periodische Kontrolle, Connection-Gap/Recovery, Serverwechsel, Charakterwechsel, Level-Aenderung, Skill-Drift und explizite Revalidierung.

Ein Connection-Gap macht einen bereits bekannten Katalog `veraltet`. Nach Recovery wird ein identischer Fingerprint nicht automatisch wieder `bereit`; die Revalidierung muss den exakt aktuellen Fingerprint bestaetigen.

Das `SkillKatalogRevalidierungsProfil` bindet einen bestaetigten Fingerprint an Charakterkennung, Serverregion und Serverkennung. Ein Neustart mit einem alten Profil und einem abweichenden Live-Fingerprint fuehrt fail-closed zu `drift`; eine abweichende Identitaet fuehrt zu `veraltet`.

`produktionsbereit` ist nur eine read-only Konsistenzaussage. Der Audit-Status besitzt immer `aktionsAutoritaet: false` und `automatischerNeustart: false`.
