# Block 8 – Nachweis des bestandenen Adventure-Land-Live-Smoke

Status: **BESTANDEN**

Stand: 2026-09-18

## Exakter Produktions-Release

Der bestandene Live-Smoke lief mit dem immutable V4-Runtime-Release:

- Git-Commit: `6e63d2f8b12fd27bba3b9db50d91c4100bedc9ec`
- SHA-256: `d0c2893784891b971caf2cbaca495b62643ffa098009c49bd508781c2e014aa6`
- Runtime-Module: 27
- Runtime-Groesse: 197116 Bytes

Dieser Release enthaelt sowohl:

- die Korrektur der Produktions-Safety-Zeitordnung,
- als auch die reale Adventure-Land-Code-/Parent-Kontexttrennung fuer den auditierten `attack`-Aufruf.

## Live-Umgebung

Der erfolgreiche one-shot wurde im echten Adventure-Land-Kontext ausgefuehrt mit:

- Testleiter: `My_Ranger1`
- zweiter frischer Gruppenteilnehmer: `My_Ranger2`
- Serverregion: `EU`
- Serverkennung: `I`
- Karte: `main`
- Instanz: `main`
- Zielkennung: `2002152`
- Monsterart: `tortoise`

Der GUI-Abschlussbericht wurde am 2026-09-18 erzeugt.

## Passive Vorpruefung

Vor dem aktiven one-shot war die passive Vorpruefung erfolgreich und weiterhin ressourcenfrei:

- `pass === true`
- beide Teilnehmer bekannt,
- `laufendeGruppenAnfragen.length === 0`
- `ressourcenSperren.length === 0`
- `liveSmokeInstalliert === false`
- `gruppenZielVorbereitungVerbraucht === false`

Damit wurde vor der expliziten one-shot-Bestaetigung keine zentrale Gruppenarbeit und keine Adventure-Land-Kampfaktion gestartet.

## Finale Produktionskette

Der bestaetigte finale Klick fuehrte ohne menschliche Pause durch:

`Heartbeat -> Gruppenplanung -> Aktionsanfrage -> Smoke-Installation -> Produktionsvorschau -> one-shot`

Die erzeugte zentrale Aktionsanfrage war:

`gruppenplan:1789749278350:gemeinsames_ziel_bearbeiten:My_Ranger1:2002152:aktionsanfrage`

Die fachliche Aktion war:

`GRUPPE_GEMEINSAMES_ZIEL_BEARBEITEN`

Die finale Produktionsvorschau bestaetigte:

- Charakter `My_Ranger1`
- Server `EU I`
- Karte/Instanz `main/main`
- Ziel `2002152`
- Monsterart `tortoise`
- Angriffsbereitschaft `bereit`
- Ressourcen `gruppe` und `kampfziel`

## PASS-Kriterien

Der echte Produktionsbericht erfuellte alle definierten Live-Smoke-PASS-Kriterien gleichzeitig:

- `status === "bestanden"`
- `echteSpielaktionen.attack === 1`
- `echteSpielaktionen.sonstige === 0`
- `echteSpielaktionen.sonstigeNamen.length === 0`
- `automatischWiederGesperrt === true`
- `ausfuehrungsBrueckeEntfernt === true`
- `zentralePhase === "abgeschlossen"`
- `verbleibendeRessourcen.length === 0`
- `fehler === null`

Der Smoke startete bei `1789749278353` und war bei `1789749278367` abgeschlossen.

Damit ist fuer diesen Test nachgewiesen:

1. genau eine echte erlaubte Adventure-Land-Spielaktion wurde ausgefuehrt,
2. keine andere Adventure-Land-Aktion passierte die Produktionsgrenze,
3. die zentrale Gruppenanfrage wurde erfolgreich abgeschlossen,
4. die Ausfuehrungsbruecke wurde entfernt,
5. alle zentralen Ressourcen wurden wieder freigegeben,
6. der one-shot war danach automatisch wieder gesperrt.

## Zustand unmittelbar nach Erfolg

Die Produktionsruntime meldete nach dem erfolgreichen one-shot:

- keine laufende Gruppenanfrage,
- keine Ressourcensperre,
- `gruppenZielVorbereitungVerbraucht === true`,
- `gestoppt === false`.

Die installierte Smoke-Fassade blieb als bereits verbrauchte one-shot-Fassade vorhanden. Das ist kein zweiter aktiver Ausfuehrungspfad; der eigentliche one-shot und seine Ausfuehrungsbruecke waren bereits verbraucht bzw. entfernt. Vor einer neuen Testkampagne ist die Runtime trotzdem explizit ueber `stoppe()` aufzuraeumen und frisch zu starten.

## Ergebnis fuer Block 8

Der begrenzte echte Adventure-Land-one-shot Live-Smoke ist **bestanden**.

Damit ist die kontrollierte aktive Freigabe des ersten minimalen Gruppenpfads fuer Block 8 nachgewiesen.

Block 8 bleibt trotzdem formal offen, bis der auf **10 Minuten reduzierte Gruppentest** erfolgreich abgeschlossen und dokumentiert wurde. Dieser kurze Block-8-Test ersetzt nicht die spaeteren uebergeordneten V4-Langzeitkampagnen.
