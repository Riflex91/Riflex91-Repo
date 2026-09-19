# V5 – Wissenswaechter-Vertrag

**Status:** VERBINDLICHE ZIELSPEZIFIKATION VOR IMPLEMENTIERUNG  
**Stand:** 2026-09-19  
**Host:** bestehende Windows Bridge unter `ops/windows-bridge/`

## Rolle

Der Wissenswaechter ist das externe Wahrnehmungssystem von V5.

Er darf Wissen beobachten, belegen, historisieren, vergleichen und als Knowledge-Aenderung fuer GitHub vorbereiten. Er besitzt **keine Gameplay-Autoritaet**.

Er darf niemals:
- V5-Runtime-, Safety-, Scheduler-, Execution- oder Recovery-Code automatisch aendern;
- V3/V4 automatisch veraendern;
- GitHub-Workflowdateien aus einem Recherchezyklus heraus veraendern;
- Webinhalte als ausfuehrbaren Code uebernehmen;
- Community-Hinweise automatisch zu offizieller Wahrheit erheben;
- roten CI umgehen;
- laufende irreversible Transaktionen beeinflussen.

## Zeitplan

Bekannte hochrelevante Quellen werden standardmaessig **einmal pro Stunde** geprueft.

Quellenentdeckung ist ein separater rotierender Suchraum. Sie kann GitHub, Suchmaschinen, Steam Discussions, Reddit, Foren, Blogs, Guides und neue Repositories/Webseiten erfassen.

Ein Recherchezyklus darf inkrementell arbeiten und ETag, Last-Modified, Inhaltshash, letzte Aenderung, Fehleranzahl und Aenderungsrate nutzen.

## Quellenautoritaet

- **A:** offizieller Adventure-Land-Source, offizielle Spiel-/G-Daten, offizielle Live-/MCP-/CODE-Dokumentation;
- **A:** offizielle Update Notes und offizielle Steam-Ankuendigungen;
- **B:** eindeutig zuordenbare Entwickler-Aussage / offizieller Discord nach Verifikation;
- **C:** bekannte Community-Projekte;
- **D:** Reddit, Foren, Steam Discussions als Hinweis;
- **E:** unbekannte Webseiten nur als Kandidat.

Niedrigere Autoritaet darf hoehere Autoritaet niemals still ueberschreiben.

Widersprechen sich hochautoritative Quellen, wird der Bereich als `WIDERSPRUCH` markiert. Betroffene Capabilities koennen dadurch in `QUARANTAENE` gehen.

## Wissens-Lebenszyklus

```text
GEFUNDEN
-> KANDIDAT
-> BESTAETIGT
-> AKTIV
-> NEU_PRUEFUNG_ERFORDERLICH
-> AKTIV | WIDERSPRUCH | VERAENDERT
-> VERALTET
-> ARCHIVIERT
```

Ein Fakt wird nicht still ueberschrieben. Jeder Fakt traegt stabile Kennung, Quelle, Abrufzeit, Hash, Vertrauen, Drift/Volatilitaet und Historie.

## Repo versus lokaler Cache

In Git gehoeren strukturierte, belegbare Erkenntnisse, Quellenregister, Fakten, Historie, Berichte, offene Widersprueche und der deutsche Anzeigekatalog.

Nicht in Git gehoeren unkontrolliert komplette HTML-Seiten, grosse Rohantworten oder Suchresultat-Caches. Diese bleiben lokal bounded in der Bridge.

## GitHub-Anmeldung

Bevorzugte Zielarchitektur: **GitHub App mit minimalen Repository-Rechten** und interaktiver Benutzeranmeldung fuer die Windows Bridge.

Minimal benoetigt:
- Repository-Metadaten lesen;
- Contents lesen/schreiben fuer erlaubte Knowledge-Pfade;
- Pull Requests lesen/schreiben;
- keine Administration;
- keine Secrets-/Environment-/Deployment-Verwaltung;
- keine allgemeinen Workflow-Schreibrechte.

Zugangsdaten:
- nie im Repo;
- nie in `settings.json`;
- nie in Logs/Telemetrie/Diagnosen;
- lokal fuer den Windows-Benutzer mit DPAPI schuetzen;
- widerrufbar und bei Logout lokal entfernbar.

## Git-Pfad-Allowlist

Automatische Knowledge-Aenderungen duerfen nur in explizit erlaubte Wissenspfade schreiben. Die engste aktuelle V5-Struktur gewinnt.

Diese Git-Grenze ist von der lokalen Live-Wissensquelle zu unterscheiden: ausserhalb des Git-Arbeitsbaums darf die Bridge genau einen konfigurierten Unterpfad auf Laufwerk `D:\` read-only als Bot-Live-Wissensquelle lesen. Kein anderer lokaler Dateisystembereich ist dadurch freigegeben.

Ziel-Allowlist:

```text
v5/wissensbasis/**
v5/wissen/**
v5/quellen/**
v5/historie/**
v5/berichte/**
v5/anzeigetexte/**
```

Explizit verboten:

```text
v5/laufzeit/**
v5/ausfuehrung/**
v5/sicherheit/**
v5/scheduler/**
v5/host/**
ops/windows-bridge/**
v3/**
v4/**
.github/workflows/**
```

Die Windows Bridge prueft die Allowlist vor Commit. CI prueft sie unabhaengig erneut.

## Git-Ablauf

```text
Aenderung erkannt
-> normalisieren
-> bestehendes Wissen vergleichen
-> Widerspruch pruefen
-> Knowledge-Aenderungssatz erstellen
-> Pfad-Allowlist
-> Schema-/Quellenpruefung
-> dedizierten Knowledge-Branch aktualisieren
-> Pull Request erstellen/aktualisieren
-> CI
-> UEBERNAHME_BEREIT
-> Merge gemaess definierter Policy
```

Kein Force-Push auf `main`.

Jeder automatische Knowledge-PR berichtet mindestens neue/geaenderte/veraltete Fakten, neue Quellen, Widersprueche, offene Uebersetzungen, Recherchezeitpunkt und Validatorstatus.

## Deutsche sichtbare Inhalte

Der Wissenswaechter pflegt spaeter einen versionierten deutschen Anzeigekatalog fuer Skills, Klassen, Items, NPCs, Events, Quests, Aktionen, Status und Beschreibungen.

**Monster-Sonderregel:**
- existiert im Spiel eine offizielle deutsche Monsterbezeichnung, muss sie verwendet werden;
- existiert keine offizielle deutsche Monsterbezeichnung, darf der originale Monstername sichtbar bleiben;
- V5 erfindet keine eigene Uebersetzung als angeblich offizielle Bezeichnung;
- erscheint spaeter eine offizielle deutsche Bezeichnung, wird sie nach Revalidierung uebernommen.

Neue uebersetzungspflichtige Inhalte ohne deutschen Sichttext erzeugen eine offene Uebersetzungsaufgabe und keinen englischen UI-Fallback.

## Grenze zur Runtime

Wissensupdate ist niemals Runtime-Freigabe.

Neues Wissen darf:
- Revalidierung anfordern;
- Planung beeinflussen;
- Tests/Entwicklungsaufgaben erzeugen;
- Capabilities quarantainen.

Es darf niemals:
- eine mutierende Capability aktivieren;
- Safety lockern;
- einen Action Contract ohne Verifikation freigeben;
- eine laufende irreversible Transaktion umdeuten.

## Fehlerverhalten

- Netzfehler: Recherchezyklus isoliert fehlgeschlagen.
- GitHub nicht erreichbar: bounded lokaler Pending-Spool.
- Auth ungueltig: `GITHUB_ANMELDUNG_ERFORDERLICH`, keine Pushes.
- Quelle zu gross/korrupt: Quelle quarantainen.
- Parser kennt Inhalt nicht: Kandidat/offene Aufgabe.
- Widerspruch: keine automatische Bestaetigung.
- CI rot: keine Uebernahme.

Keiner dieser Fehler darf laufendes Gameplay stoppen oder steuern.

## Abnahme vor automatischem Git-Sync

Pflichtnachweise:
- Pfad-Allowlist-Positiv-/Negativtests;
- kein Write auf Runtime/V3/V4/Workflows;
- DPAPI-Secret-Test;
- Logout/Tokenverlust fail-closed;
- Crash-Recovery waehrend Branch/PR-Sync;
- Zyklus- und Source-Hash-Dedupe;
- Widerspruchstest;
- Community->offiziell darf nicht ohne Evidence passieren;
- stündlicher Scheduler ueber injizierbare Uhr testbar;
- Cache/Spool bounded;
- UI-Uebersetzungsaufgaben und Monster-Ausnahme getestet.

**Leitsatz:** Der Wissenswaechter darf Wissen aktualisieren. Er darf niemals entscheiden, dass eine riskante Spielaktion erlaubt ist.


## Aktueller Implementierungsabgleich der Windows Bridge

Gegen den auf `main` vorhandenen Stand wurden bereits folgende positive Schutzmechanismen festgestellt:

- Git-Arbeitskopie verwendet Sparse Checkout auf `v5/wissensbasis/**`;
- lokale Pfadauflösung verhindert Verzeichnis-Ausbruch;
- gestagete Pfade werden vor Commit kontrolliert;
- der erzeugte Commit wird nach Rebase erneut auf erlaubte Pfade kontrolliert;
- Force-Push ist nicht vorgesehen;
- Wissenslauf ist auf 60 Minuten konfiguriert;
- Community-/unbekannte Quellen bleiben Kandidaten;
- GitHub-Anmeldung wird nicht als Klartexttoken in der Bridge-Konfiguration gespeichert.

Vor V5-Readiness bleiben aber zwei Haertungen offen:

1. **Kein direkter automatischer Push auf `main`.**  
   Der aktuelle `GitArbeitskopie.CommitUndPushAsync` pusht nach lokaler Pruefung direkt `HEAD:main`. Fuer V5-Zielniveau muss die automatische Wissensaktualisierung ueber einen dedizierten Knowledge-Branch und PR/CI-Gate laufen oder eine mindestens gleich starke serverseitig geschuetzte Alternative nachweisen.

2. **Least-Privilege-GitHub-Autorisierung nachweisen.**  
   Der aktuelle Login ueber Git Credential Manager und Browser-OAuth ist funktional und speichert das Token nicht selbst in der Bridge. Fuer V5-Readiness muss aber zusaetzlich bewiesen sein, dass die verwendete Authentisierung nur die minimal erforderlichen Repository-Rechte besitzt. Bevorzugt ist eine auf dieses Repository begrenzte GitHub App oder eine nachweislich gleich eng begrenzte Alternative.

Diese Punkte sind keine Aussage, dass die aktuelle Bridge unsicher sei. Sie markieren die Differenz zwischen einem bereits guten Schutz und dem absichtlich strengeren V5-Narrensicherheitsniveau.


## Konsumentenvertrag fuer Entwicklung und Runtime

Die Daten des Wissenswaechters werden nicht isoliert konsumiert.

Verbindliche Regeln:

- Einstieg immer ueber `v5/wissensbasis/manifest.json`;
- Frische zuerst ueber `datenbank/letzter-lauf.json` und `quellenstatus.json` pruefen;
- relevante Drift vor Codeaenderungen bewerten;
- Kandidaten besitzen null Autoritaet;
- Roh-Snapshots sind Evidence, keine Runtime-API;
- strukturierte Facts/Contracts muessen bei Drift revalidiert werden;
- echte V5-Implementierung benoetigt den strengen Entwicklungs-Wissensgate;
- spaetere Runtime liest Knowledge nur ueber einen typisierten read-only `WissensZugriffPort`;
- laufende irreversible Workflows pinnen ihren WissensSnapshot und werden durch neue GitHub-Daten nicht still umgedeutet.

Die vollstaendige Regel ist in `ENTWICKLUNGS-WISSENSGATE.md` und `entwicklungsregeln/wissensnutzung.json` festgelegt.


## Lokale Live-Wissensquelle auf D:

Verbindlicher Zielvertrag: `LIVE-WISSEN-SSD-VERTRAG.md`.

Standard:

```text
D:\AdventureLand-V5\wissensdatenbank
```

Rollen:
- V5-Bot = alleiniger fachlicher Writer;
- Windows Bridge = read-only Validator und GitHub-Spiegel;
- GitHub = versionierte Evidence;
- Runtime Admission = einzige Ebene, die zusammen mit frischer Live Truth Gameplay-Autoritaet erzeugen darf.

Die Bridge darf lokal nur `manifest.json`, `status.json` und `aktuell/**/*.json` importieren. Reparse Points, Traversal, falsches Spiel, nicht verifizierte Fakten, Geheimnisfelder, Oversize und unstabile Generationen werden fail-closed verweigert.

Ziel im Repo:

```text
v5/wissensbasis/live/snapshot/**
```

Ein lokaler Importfehler darf:
- den letzten gueltigen GitHub-Live-Snapshot nicht zerstoeren;
- externe Quellenrecherche nicht in Gameplay-Autoritaet verwandeln;
- laufendes Gameplay nicht stoppen oder steuern.
