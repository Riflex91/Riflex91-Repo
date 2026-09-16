# V4 Architektur

## Datenfluss

`Adventure Land -> Spielzustand -> Planung -> AktionsAnfrage -> AktionsAuswahl -> Sicherheit -> RessourcenVergabe -> Ausfuehrung -> Ergebnis -> Ereignisse -> Lernen`

Keine Ebene darf eine darunterliegende Sicherheitsstufe umgehen.

## Laufzeit

`laufzeit/quelle/` enthaelt ausschliesslich Code, der fuer die Bot-Laufzeit bestimmt ist.

- `vertraege/` – gemeinsame Datentypen
- `kern/` – zentrale Ereignis-, Aktions-, Ressourcen- und Kontingentsteuerung
- `spiel/` – spaetere Adventure-Land-Schnittstelle
- `welt/` – Wissen und Spielzustand
- `planung/` – Auswahl sinnvoller Ziele und Arbeit
- `sicherheit/` – unverhandelbare Schutzregeln
- `ausfuehrung/` – einzige Stelle fuer echte Adventure-Land-Aktionen
- `telemetrie/` – strukturierte Laufzeitdaten
- `wiederholung/` – Aufzeichnung und Offline-Wiederholung
- `lernen/` – spaetere Versuche und Lernergebnisse
- `spiellogik/` – Farmer, Gruppe, Haendler und weitere Spielfunktionen

V4 verwaltet keine Adventure-Land-Anmeldedaten. Die Laufzeit arbeitet innerhalb einer bereits bestehenden Adventure-Land-Sitzung.

## Plattform

`plattform/` laeuft ausserhalb von Adventure Land.

- `schnittstelle/` – HTTPS-Zugriff
- `web-oberflaeche/` – Bedienung, Analyse und Tagesberichte
- `archiv-abgleich/` – serverseitiger SFTP-Abgleich
- `entwicklungsdienst/` – spaetere Auswertung der Entwicklungswarteschlange

## Externe Dienste und KontingentWaechter

Supabase, Cloudflare und jeder spaeter angebundene externe Dienst werden als begrenzte Ressource behandelt.

Direkte externe Aufrufe aus Fachlogik sind verboten. Der vorgesehene Ablauf ist:

`Funktion -> DienstAnfrage -> KontingentWaechter -> Dienst-Tor -> externer Anbieter`

Der `KontingentWaechter` prueft vor dem Aufruf:

- existiert ein geprueftes DienstProfil?
- ist es noch gueltig?
- sind alle betroffenen Nutzungsgrenzen bekannt?
- ist der schlechteste Verbrauch der geplanten Aktion bekannt?
- reicht das sichere V4-Budget nach Abzug des Sicherheitspuffers?
- ist der lokale Verbrauch oder der vom Anbieter gemeldete Verbrauch hoeher?

Nur wenn alle Fragen sicher beantwortet sind, darf die externe Anfrage ausgefuehrt werden.

Die lokale Spiellogik und insbesondere Rueckzug, Heilen, Todes- und Verbindungsbehandlung duerfen niemals auf einen externen Dienst angewiesen sein. Ist ein Dienst nicht verfuegbar oder sein Kontingent blockiert, arbeitet der Bot lokal sicher weiter und reduziert oder puffert nur nicht kritische Daten.

Details stehen in `DIENSTGRENZEN_UND_FEHLBEDIENUNGSSICHERHEIT.md`.

## Tagesbericht

Die Adventure-Land-Laufzeit erzeugt keinen E-Mail-Bericht und besitzt keine E-Mail-Zugangsdaten. Sie liefert nur strukturierte Laufzeitdaten an die Plattform.

Die Plattform erstellt aus diesen Daten einmal taeglich einen `TagesBericht` ueber die vergangenen exakt 24 Stunden. Der Bericht wird gespeichert, in der Web-Oberflaeche angezeigt und kann zusaetzlich per E-Mail versendet werden.

Der Ablauf ist:

`Telemetrie -> gespeicherte Laufzeitdaten -> TagesBericht -> Web-Oberflaeche -> optional E-Mail`

Berichtserstellung und Zustellung sind getrennt. Ein Versandfehler darf weder den Bericht verlieren noch die Adventure-Land-Laufzeit beeinflussen.

Jeder automatische Berichtszeitraum besitzt eine eindeutige Kennung. Neustarts oder wiederholte Zeitgeberausloesung duerfen daher keinen doppelten Versand desselben Berichts verursachen.

## Gruppensteuerung

Mehrere eigene Charaktere koennen ihren Zustand in eine gemeinsame Gruppensicht melden. Die Gruppensteuerung verteilt Ziele und Aufgaben. Jede einzelne Laufzeit behaelt ihre lokale Sicherheitsentscheidung.

Dadurch gilt auch bei einem Plattformausfall:

- kein Charakter verliert seine lokale Notfalllogik
- keine Laufzeit wartet endlos auf einen anderen Charakter
- veraltete Gruppeninformationen werden nach Ablauf verworfen
- ein fehlender Heiler, Tank oder Haendler wird als nicht verfuegbar behandelt

## Wichtigste Invarianten

- Nur die Ausfuehrung darf das Spiel aktiv veraendern.
- Eine Ressource hat gleichzeitig hoechstens einen Besitzer.
- Mehrere benoetigte Ressourcen werden gemeinsam oder gar nicht vergeben.
- Notfall- und Sicherheitsarbeit hat festen Vorrang.
- Unbekanntes Wissen bleibt unbekannt; es wird nicht stillschweigend geraten.
- Menschliche Fehlermeldungen muessen ohne Quellcodekenntnis verstaendlich sein.
- Kein externer Aufruf ohne vorherige Kontingentpruefung.
- Kein unbekannter externer Verbrauch wird geraten.
- Kein abgelaufenes Dienstprofil wird weiterverwendet.
- Kein Anbietermaximum wird vollstaendig als V4-Budget freigegeben.
- Keine Warteschlange darf unbegrenzt wachsen.
- Lokale Spielsicherheit bleibt auch ohne Supabase, Cloudflare oder andere Dienste funktionsfaehig.
- SFTP-Zugangsdaten existieren nur serverseitig.
- E-Mail-Versandgeheimnisse existieren nur serverseitig.
- V4 speichert oder verarbeitet keine Adventure-Land-Kennwoerter.
- Ein Tagesbericht darf fehlende Daten nicht stillschweigend als Null ausgeben.
- Ein Versandfehler darf die sichere Spiellogik niemals blockieren.
