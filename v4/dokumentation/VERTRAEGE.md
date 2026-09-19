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

## V3KontingentParitaet

Die `V3KontingentParitaet` bindet die in V3 verwendeten Cloudflare- und Supabase-Grenzen als versionierte Referenz. Die Hard-Limits duerfen in V4 nicht erhoeht werden.

`erstelleCloudflareV3ParitaetsProfil(...)` und `erstelleSupabaseV3ParitaetsProfil(...)` erzeugen nur gueltige `DienstProfil`-Objekte mit explizitem Pruefzeitpunkt, Gueltigkeitsende und Quelle.

Bereits in V3 reduzierte Budgets bleiben mindestens ebenso streng. Fuer V3-Dimensionen ohne eigenes kleineres Budget reserviert V4 einen zusaetzlichen Sicherheitspuffer. Geteilter Anbieter-Verbrauch muss ueber `aktualisiereVerbrauch(...)` konservativ in dieselbe Kontingententscheidung einfliessen.

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


## SkillPolicy

Eine `SkillPolicy` ist die versionierte, pro `charakterKennung` getrennte Nutzerkonfiguration fuer validierte Skills.

Neue Skill-Einstellungen starten immer mit `freigegeben=false`. `SkillPolicy AUS` ist eine harte Sperre und darf weder durch Sliderwerte noch durch Planner oder spaeteres Lernen uebergangen werden.

Nur Skills aus einem `bereit`en Live-`SkillKatalog` mit `automationValidated=true`, passender Klasse und erfuellter Level-Voraussetzung sind aktuell konfigurierbar.

Skill-spezifische Controls besitzen feste Min-/Max-/Schritt-Grenzen. Unbekannte Controls sowie ungueltige historische Werte sperren die aktuelle Automatikfreigabe fail-closed. Multi-Target-Controls koennen ihr Maximum aus der validierten `zielKapazitaet` ableiten.

Die Persistenz verwendet `SKILL_POLICY_SCHEMA_VERSION = 1` und den vorhandenen `SchluesselWertSpeicher`. Eine Aenderung wird erst aktiv, nachdem der komplette neue Zustand erfolgreich persistiert wurde.

Katalog-`drift`, `veraltet` oder `blockiert` loescht historische Nutzerwerte nicht, entzieht aber die aktuelle Policy-Freigabe. Auch eine positive Policy-Entscheidung besitzt immer `aktionsAutoritaet: false`.


## CharakterFaehigkeiten

`CharakterFaehigkeiten` ist die read-only Ableitung der aktuellen Character-Capability-Truth aus Live-`SkillKatalog`, technischer Skill-Readiness und `SkillPolicy`.

Pro Skill bleiben mindestens getrennt:

- `strukturellVorhanden`,
- `technischBereit`,
- `vomNutzerFreigegeben`,
- `automatisierungKonfiguriert`,
- `aktuellAutomatisierbar`.

Technische Readiness prueft Equipment, bekannte Materialien, Mana und die bestehende Adventure-Land-Kampfbereitschaft. Unbekannte Anforderungen werden nicht geraten.

Fuer jeden konkreten `SkillCapabilityTag` werden getrennte Zaehler und explizite Target-Capacities gefuehrt. Die bestehenden groben Gruppenfaehigkeiten `heilen`, `schaden`, `aggro`, `schutz` und `unterstuetzung` werden daraus als Anzahl aktuell automatisierbarer konkreter Skills abgeleitet; es gibt keine statische Klassenprioritaet.

`CharakterFaehigkeiten` besitzt einen kanonischen SHA-256-Fingerprint und eine charaktergebundene Generation. Reine Zeitstempel und Cooldown-Restmillisekunden veraendern den Fingerprint nicht.

Der Vertrag besitzt immer `aktionsAutoritaet: false`. Auch `aktuellAutomatisierbar=true` ist keine Ausfuehrungsfreigabe.


## CapabilitySync

`CapabilitySync` transportiert bounded, validierte `CharakterFaehigkeiten` zwischen vertrauten Adventure-Land-Clients ueber den bestehenden CM-Kommunikationspfad.

Der Sync besitzt **keinen eigenen Liveness-Timer und keinen eigenen Freshness-TTL**. Freshness wird ausschliesslich aus dem bestehenden Block-8-`GruppenLebensnachweis` und dessen `GruppenTeilnehmerBewertung` uebernommen.

Jeder Snapshot ist exakt an `lebensnachweisGesendetAm` und `lebensnachweisLaufendeNummer` gebunden. Ein anderer oder neuerer Lebensnachweis kann einen alten Capability-Snapshot nicht wieder frisch machen.

Ein Remote-Snapshot wird nur vertraut, wenn Sender-/Charakteridentitaet passt, der bestehende Lebensnachweis `aktiv` ist, lokaler und Remote-Katalog `bereit` sind und der fachliche Katalog-Fingerprint exakt uebereinstimmt.

Der bounded Snapshot enthaelt nur explizit validierte, strukturell vorhandene Skills. Feste Obergrenzen gelten fuer Skillanzahl, Capability-Tags und Sliderparameter. Uebergrosse oder unbekannte Strukturen werden fail-closed verworfen.

`CapabilitySync` und jede Remote-Vertrauensentscheidung besitzen immer `aktionsAutoritaet: false`. Ein vertrauter Snapshot ist Information fuer spaetere Gruppenlogik, keine Spielaktionsfreigabe.


## CapabilityGruppenwahl

`CapabilityGruppenwahl` ist die read-only Rollenentscheidung oberhalb der bestehenden Block-8-`GruppenKoordinationsEntscheidung`.

Sie darf die bestehende Safety-/Liveness-Entscheidung nicht aufweichen. Nur bei `betriebsArt=normal` koennen normaler Leader und normale Aufgaben vergeben werden.

Teilnehmer benoetigen gleichzeitig:

- aktive bestehende Block-8-Liveness,
- exakt dazu gebundenen lokalen oder in Block 8.6.5 vertrauten Capability-Snapshot,
- explizite `gruppenKoordinationErlaubt=true`-Autoritaet,
- fuer eine Aufgabe mindestens einen passenden `aktuellAutomatisierbar`en, `enabled`en und `configuredReady`en Skill.

Fehlende Capability-Daten werden nicht durch Klasse, Level oder alte grobe Lebensnachweis-`faehigkeiten` ersetzt.

Die Auswahl ist lexikographisch und nachvollziehbar. Safety kommt vor Capability-Eignung, Capability-Eignung vor Freshness und Charakterkennung/-name dienen nur als finale Tie-Breaker. Klasse und Level sind keine Ranking-Merkmale.

Auch die positive Rollenentscheidung besitzt immer `aktionsAutoritaet: false`. Die separate Koordinationsautoritaet ist keine Adventure-Land-Spielaktionsautoritaet.


## CapabilityStatus

`CapabilityStatusSicht` ist die read-only Diagnoseprojektion fuer Block 8.6.

Sie uebernimmt bestehende Ausgaben aus Skill-Katalog-Audit, `CharakterFaehigkeiten`, `SkillPolicy`, Capability-Sync und `CapabilityGruppenwahl` und macht sie oberflaechengeeignet sichtbar.

Die Projektion darf keine Skill-, Trust-, Safety-, Leader- oder Aufgabenentscheidung neu berechnen. Sie darf ausschliesslich bereits vorhandene Zustaende sortieren, zaehlen, vergleichen und erklaeren.

Sichtbar bleiben insbesondere:

- Katalogzustand, Generation und Fingerprint,
- letzte erfolgreiche Audit-/Revalidierungsevidenz,
- Drift-/Stale-/Blockiergrund,
- Skill aktiv/gesamt und relevante Slider,
- lokale Capability-Zaehler und Target-Capacities,
- Remote-Liveness/Freshness und Catalog-Agreement,
- Remote-/Gruppenausschlussgruende,
- capability-basierte Leader-/Aufgabenentscheidung,
- deterministische Diagnosecodes.

Remote-Diagnoseevidenz wird an Charakterkennung **und** Charaktername gebunden. Ein fremder oder gespoofter Empfang darf die Anzeige eines anderen Teilnehmers nicht ersetzen.

`CapabilityStatusSicht` besitzt immer `nurLesen: true`, `spielAutoritaet: false`, `bedienAutoritaet: false` und `neustartAutoritaet: false`.

Das separate Block-8.6-Capability-HUD ist eine reine Darstellungsschicht. Es darf keine Fachlogik, Spielaktion, Policy-Schreiboperation, Kommunikationssendung oder Neustartaktion enthalten.


## CapabilityWiederholung

`CapabilityWiederholungsMaschine` ist der deterministische Offline-Wiederholungsweg fuer Block 8.6.

Ein Replay-Datensatz enthaelt ausschliesslich serialisierbare aufgezeichnete Charakter-, Katalog-, Equipment-, Policy-, Liveness- und Remote-Snapshot-Eingaben. Die Maschine erzeugt daraus isolierte read-only Adventure-Land-Lesefenster und fuehrt die echten Block-8.6-Komponenten erneut aus.

Pro Charakter bleiben ueber Replay-Schritte erhalten:

- Skill-Katalog-Audit und Revalidierungsprofil,
- SkillPolicy-Persistenz,
- Capability-Generation/Fingerprint,
- letzter erfolgreicher Capability-Snapshot.

Remote-Snapshots koennen als `aktuell`, `vorheriger` oder `fehlend` eingespeist werden. Dadurch werden stale Snapshot-/Heartbeat-Kombinationen reproduzierbar durch denselben Block-8.6.5-Vertrauenspfad geprueft.

Jeder Lauf besitzt einen SHA-256-`eingabeFingerabdruck`, pro Schritt einen `schrittFingerabdruck` und einen `ausgabeFingerabdruck`, jeweils ueber kanonisches V4-JSON. Die Variantenkennung veraendert den Ausgabe-Fingerprint nicht.

Der Replay-Pfad besitzt keine Adventure-Land-Spielaktionsfunktionen und immer `aktionsAutoritaet: false`. Er darf weder `Date.now()` noch `Math.random()` als fachliche Eingabe verwenden.


## CapabilityFreigabe

`CapabilityFreigabe` ist die Block-8.6.9-Laufzeitgrenze fuer Schatten, kontrolliert live und Soak.

Sie kombiniert ausschliesslich bereits validierte Block-8.6-Komponenten und besitzt selbst immer `spielAutoritaet: false` sowie `neustartAutoritaet: false`.

Test-`policyVorgaben` werden nur in einem isolierten In-Memory-`SkillPolicySpeicher` angewendet. Dadurch veraendert der Freigabekandidat keine produktive Browser-Persistenz.

Remote-Freshness wird nicht neu erfunden. `AdventureLandAkzeptierterLebensnachweisBeobachter` ruft zuerst den bereits installierten Block-8-CM-Handler auf und uebernimmt eine Heartbeat-Evidenz nur dann, wenn dieser bestehende Handler sie bereits mit `true` akzeptiert hat. Der Beobachter sendet keine Lebensnachweise und besitzt keinen eigenen Liveness-Timer.

Im Schatten bleiben Remote-Beobachtung und Capability-Senden gesperrt. Kontrolliert live ist Capability-Senden nur als explizit bestaetigter One-Shot pro vertrautem Ziel zulaessig; eine automatische Capability-Sende-Schleife existiert nicht.

Der kombinierte `V4Block86Candidate` installiert die unveraenderte `V4ProduktionsLaufzeit` 1.1.5 und daneben `V4CapabilityLaufzeit` 1.0.0. Der Candidate startet keine der beiden Laufzeiten automatisch.
