# Block 8.6.5 – Cross-Client Capability Sync

Status: **implementiert; noch nicht gemergt oder operativ freigegeben.**

## Ziel

Block 8.6.5 synchronisiert bounded Capability-Snapshots zwischen den Adventure-Land-Clients einer vertrauten Gruppe.

Er erweitert den bestehenden Block-8-Kommunikationspfad, fuehrt aber **kein zweites Liveness-Protokoll** ein.

Remote-Capability-Daten werden nur dann vertraut, wenn der bereits bestehende Block-8-Lebensnachweis fuer denselben Charakter aktiv und exakt mit dem Capability-Snapshot gebunden ist.

## Neue Laufzeitbausteine

Vertrag:

`v4/laufzeit/quelle/vertraege/capability-sync.ts`

Snapshot-/Vertrauenslogik:

`v4/laufzeit/quelle/spiellogik/capability-sync.ts`

Adventure-Land-CM-Austausch:

`v4/laufzeit/quelle/ausfuehrung/adventure-land-capability-sync-austausch.ts`

Regressionen:

- `v4/laufzeit/tests/capability-sync.test.mjs`
- `v4/laufzeit/tests/capability-sync-austausch.test.mjs`

## Kein zweites Liveness-Protokoll

Der Capability-Sync besitzt:

- keinen eigenen Heartbeat,
- keinen eigenen Liveness-Timer,
- keinen eigenen Freshness-TTL,
- keine eigene Teilnehmer-Aktivitaetsbewertung.

Die Freshness-Quelle bleibt:

`block8-gruppen-lebensnachweis`

Die bestehende Gruppenkoordination entscheidet weiterhin, ob ein Teilnehmer `aktiv`, `veraltet`, `ausgefallen`, `falsche_welt` oder `falsche_instanz` ist.

8.6.5 akzeptiert Remote-Capabilities nur, wenn die bereits vorhandene `GruppenTeilnehmerBewertung` fuer dieselbe Charakterkennung `aktiv` meldet.

## Exakte Lebensnachweis-Bindung

Jeder Capability-Snapshot speichert:

- `lebensnachweisGesendetAm`,
- `lebensnachweisLaufendeNummer`.

Diese beiden Werte muessen beim Empfaenger exakt mit dem aktuell bewerteten `GruppenLebensnachweisEmpfang` uebereinstimmen.

Dadurch kann ein alter Capability-Snapshot nicht versehentlich durch einen neueren Heartbeat wieder als frisch gelten.

Ein neuer Lebensnachweis ohne dazu passenden Capability-Snapshot fuehrt deshalb fail-closed zu keiner vertrauten Remote-Capability.

## Snapshot-Inhalt

Ein Snapshot enthaelt mindestens:

- Charakterkennung,
- Charaktername,
- Klasse,
- Level,
- Capability-Generation,
- Capability-Fingerprint,
- Katalogzustand,
- Kataloggeneration,
- Katalog-Fingerprint,
- Bindung an den Lebensnachweis,
- validierte und strukturell vorhandene Skills,
- Nutzerfreigabe,
- `configuredReady`,
- `aktuellAutomatisierbar`,
- bounded Sliderparameter,
- Target-Capacity,
- Capability-Tags,
- grobe abgeleitete Gruppenfaehigkeiten.

Unbekannte oder nicht validierte Skills werden nicht in den Remote-Snapshot aufgenommen.

## Bounded Payload

Schema:

`CAPABILITY_SYNC_SCHEMA_VERSION = 1`

Pro Snapshot gelten feste Obergrenzen:

- maximal 64 Skills,
- maximal 16 Capability-Tags pro Skill,
- maximal 8 Parameter pro Skill.

Ungueltige oder uebergrosse Daten werden nicht still gekuerzt, sondern fail-closed blockiert.

Skill-IDs und Parameternamen muessen nicht leer sein.

Parameterwerte muessen endlich sein.

Target-Capacity muss, sofern vorhanden, eine positive sichere Ganzzahl sein.

## Senderidentitaet

Der Transport verwendet denselben Adventure-Land-`send_cm`/`on_cm`-Kanal wie die bestehende Gruppenkommunikation.

Ein eingehender Umschlag wird nur angenommen, wenn:

1. der rohe Adventure-Land-Absendername in der bestehenden Vertrauensliste steht,
2. der rohe Absendername mit `absenderName` im Umschlag uebereinstimmt,
3. der Snapshot-`charakterName` mit diesem Absendernamen uebereinstimmt,
4. die Struktur des bounded Snapshots gueltig ist.

Die eigentliche Capability-Vertrauensfreigabe erfolgt danach zusaetzlich gegen den Block-8-Lebensnachweis.

## Remote-Vertrauensregeln

Ein Remote-Snapshot ist nur `vertraut`, wenn **alle** Bedingungen erfuellt sind:

- Capability-Absender und Snapshot-Charaktername stimmen ueberein,
- ein passender Block-8-Lebensnachweis ist vorhanden,
- Lebensnachweis-Absender und Capability-Absender stimmen ueberein,
- Charakterkennung stimmt ueberein,
- Charaktername stimmt ueberein,
- Klasse stimmt ueberein,
- Lebensnachweis-Zeitpunkt und Laufnummer stimmen exakt mit der Snapshot-Bindung ueberein,
- die bestehende Lebensnachweisbewertung gehoert zu derselben Charakterkennung,
- die bestehende Lebensnachweisbewertung ist `aktiv`,
- der lokale Skill-Katalog ist `bereit`,
- lokal ist keine Katalogbestaetigung offen,
- der lokale Katalog besitzt einen Fingerprint,
- der Remote-Katalog ist `bereit`,
- lokaler und Remote-Katalog-Fingerprint stimmen exakt ueberein.

Missing, stale oder mismatch -> fail-closed.

## Gleiche Klasse, unterschiedliche Charaktere

Die Identitaet wird niemals nur aus der Klasse abgeleitet.

Zwei Ranger bleiben durch:

- `charakterKennung`,
- `charakterName`,
- Lebensnachweis-Bindung,
- Capability-Fingerprint/Generation

vollstaendig getrennt.

Ein Snapshot von Ranger A kann nicht mit dem Lebensnachweis von Ranger B vertraut werden.

## Katalog-Agreement

Eine unterschiedliche Kataloggeneration allein blockiert nicht, wenn beide Seiten denselben fachlichen Katalog-Fingerprint besitzen.

Der Fingerprint ist die fachliche Identitaet.

Ein unterschiedlicher Fingerprint blockiert immer fail-closed.

Dadurch kann ein Client keine Capability aufgrund eines semantisch anderen Skill-Katalogs in die Gruppenentscheidung einspeisen.

## Transport

`AdventureLandCapabilitySyncAustausch` besitzt eine explizite `aktivFreigegeben`-Grenze.

Senden ist nur erlaubt an Namen der bestehenden Vertrauensliste.

`send_cm` muss den Zielcharakter in seiner Rueckgabe explizit als Empfaenger bestaetigen.

Der Empfaenger wird als Chain vor einen bereits existierenden `on_cm`-Handler gesetzt. Fremde CM-Protokolle werden an den vorherigen Handler weitergereicht.

Damit ersetzt der Capability-Sync den bestehenden Lebensnachweis-Austausch nicht und zerstoert andere CM-Protokolle nicht.

## Sicherheitsgrenzen

8.6.5 erzeugt keine Adventure-Land-Spielaktionsautoritaet.

Alle Snapshot- und Vertrauensvertraege enthalten:

`aktionsAutoritaet=false`

Ein `vertraut`er Remote-Snapshot bedeutet nur:

> Diese Capability-Daten duerfen von spaeterer Gruppenlogik als aktuelle, identitaets- und katalogkonsistente Information betrachtet werden.

Er bedeutet nicht, dass eine Aktion ausgefuehrt werden darf.

## Abnahme

Die Regressionen pruefen mindestens:

1. bounded Snapshot mit nur validierten strukturellen Skills,
2. exakte Bindung an Lebensnachweis-Zeitpunkt und Laufnummer,
3. Blockade bei lokal nicht bereitem Katalog,
4. Blockade bei falscher Heartbeat-Identitaet,
5. Vertrauen nur bei bestehender Liveness-Bewertung `aktiv`,
6. stale Lebensnachweis blockiert ohne eigenen Capability-TTL,
7. neuer Heartbeat macht alten Snapshot nicht frisch,
8. lokaler Katalog stale -> blockiert,
9. Catalog-Fingerprint-Mismatch -> blockiert,
10. Sender-Spoof -> blockiert,
11. Charakterkennungs-Mismatch -> blockiert,
12. zwei Ranger derselben Klasse bleiben getrennt,
13. unbekannte Autoritaet oder unbounded Daten werden verworfen,
14. Transport besitzt keinen eigenen Liveness-Timer,
15. Senden nur an vertrauensgebundene bestaetigte Empfaenger,
16. fremde CM-Protokolle werden weitergereicht,
17. bestehender `on_cm`-Handler wird beim Entfernen wiederhergestellt.

## Nicht Bestandteil von 8.6.5

Noch nicht umgesetzt werden:

- capability-basierte Leader-/Aufgabenwahl,
- Aenderung der bestehenden Block-8-Aufgabenwahl,
- automatische Rolleneskalation,
- HUD-/Diagnose-Rendering,
- Smart AoE,
- Lernen,
- neue Spielaktionsautoritaet.

## Naechster Schritt

**8.6.6 – Capability-basierte Leader- und Aufgabenwahl.**
