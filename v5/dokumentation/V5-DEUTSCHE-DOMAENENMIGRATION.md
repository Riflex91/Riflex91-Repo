# V5 – Deutsche Domaenenmigration

**Status:** R2 RATIFIZIERT  
**Stand:** 2026-09-19  
**Runtime-Gate:** GESCHLOSSEN

## Ziel

V5 verwendet fuer alle von uns kontrollierten neuen Runtime-Domaenenbegriffe deutsche Namen. Gleichzeitig bleiben historische Research-/Evidence-Artefakte reproduzierbar und werden nicht durch eine unkontrollierte Massenumbenennung veraendert.

## Drei Namensklassen

### 1. Neue V5-Runtime-Domaene

Pflicht: deutsch.

Beispiele:

- `ActionRequest` → `AktionsAnfrage`
- `ActionResult` → `AktionsErgebnis`
- `ResourceClaim` → `RessourcenAnspruch`
- `Lease` → `Lease` nur an externer/technischer Boundary; fachlich `RessourcenPacht` bzw. eindeutig dokumentierter deutscher Typ
- `ExecutionChannel` → `AusfuehrungsKanal`
- `Postcondition` → `Nachbedingung`
- `ReconciliationResult` → `AbgleichErgebnis`
- `Capability` → `Faehigkeit`
- `Health` → `Gesundheitszustand`
- `Workflow` → `Arbeitsablauf`
- `Transaction` → `Transaktion` ist als etablierter deutscher Fachbegriff erlaubt.

Neue eigene Schemafelder, Statuswerte, Fehlergruende und Ereignisse folgen derselben Regel.

### 2. Externe Adventure-Land-/Systemgrenzen

Originalnamen duerfen unveraendert empfangen oder gesendet werden, wenn das externe Protokoll sie verlangt, z. B.:

- Socket-Events wie `trade_buy`, `equip`, `bank`;
- externe Payload-Felder wie `request_id`;
- HTTP-Header wie `Retry-After`;
- Git-/GitHub-Felder;
- Adventure-Land-G-Datenkennungen.

Sie werden am Boundary-Adapter sofort in interne deutsche Typen/Felder normalisiert. Externe Namen duerfen nicht unkontrolliert in UI oder Fachmodule leaken.

### 3. Historische V5-Research-/Evidence-Artefakte

Bereits ratifizierte P0-Vertraege und gespeicherte Evidence koennen englische historische Feldnamen enthalten. Diese bleiben lesbar, damit:

- alte Hashes und Evidence reproduzierbar bleiben;
- P0-Forschung nicht still umgeschrieben wird;
- Validatoren nicht durch kosmetische Migration Safety-Evidence verlieren.

Diese Ausnahme verleiht den historischen Feldnamen **keine** Berechtigung fuer neue Runtime-Schemas.

## Migrationsverfahren

Vor Nutzung eines historischen englischen V5-Schemas durch Runtime-Code muss eine versionierte Migration existieren:

1. historisches Schema identifizieren;
2. interne deutsche Zielstruktur definieren;
3. Boundary-/Migrationsmapping dokumentieren;
4. positive und negative Migrationstests definieren;
5. unbekannte oder nicht abbildbare Felder fail-closed behandeln;
6. keine automatische Bedeutungsableitung aus aehnlich klingenden Feldern;
7. Rollback-/Lesekompatibilitaet dokumentieren;
8. erst danach Runtime-Port freigeben.

Direktes Runtime-Lesen historischer Research-JSONs als Fachmodell ist verboten.

## Sichttexte

Alle von uns kontrollierten sichtbaren Texte sind deutsch. Fehlende Uebersetzung faellt nicht auf englischen Rohtext zurueck.

Einzige Inhaltsausnahme: Monster-Namen duerfen original angezeigt werden, solange Adventure Land selbst keine offizielle deutsche Monsterbezeichnung bereitstellt.

## Nachweis

Die Regeln werden spaeter durch Namensraum-, Schema-, UI-Rohtext- und Migrationstests technisch erzwungen. R2 ratifiziert den Vertrag; R3+ implementieren die Guards.
