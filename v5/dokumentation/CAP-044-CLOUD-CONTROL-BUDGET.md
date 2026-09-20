# CAP-044 – Cloud Control / Free-tier Budget

**Status:** IMPLEMENTIERT / CORE-NO-WRITE  
**Stand:** 2026-09-20  
**Basis-main:** `843fbe9838f7aa31c6f03e1e3bb0b7245aaed5af`

## Ziel

CAP-044 implementiert die V5-nativen Vertraege `RemoteConfigEvidence` und `RequestBudget`, ohne V3/V4-Runtimecode oder Remote-Authority zu uebernehmen.

Historische Risiken:

- Remote-Config-Bypass;
- Quota-Storm;
- Retry nach unbekanntem Request-Ausgang;
- persistenter Budget-Drift.

## Remote Config

Implementierung:

- `v5/grundlage/quelle/control/remote-config.ts`

Remote-Konfiguration ist ausschließlich Planning Evidence und kann keine lokale Autoritaet erweitern.

Eine lokale `RemoteConfigPolicy` definiert vorab:

- vertrauenswuerdige Source-ID und Source-Fingerprint;
- Policy-Fingerprint;
- maximales Evidence-Alter;
- erlaubte Schluessel;
- Typ;
- Wertebereich bzw. Enum-Werte.

Jede Regel muss explizit sein:

- `authorityNeutral=true`;
- `safetyNeutral=true`;
- `secretFrei=true`.

Remote Evidence muss zusaetzlich beweisen:

- Transport verifiziert;
- Quelle authentifiziert;
- Policy-Fingerprint identisch;
- monotone Revision;
- frische Evidence;
- keine Gameplay-/Raw-Write-Authority.

## Nicht fernsteuerbar

Schluessel, die lokale Safety-/Authority-Grenzen beruehren, werden bereits beim lokalen Policy-Aufbau blockiert.

Dazu gehoeren insbesondere Begriffe rund um:

- Authority / Capability / Owner;
- Admission;
- Operator / Kill Switch;
- Raw Write / Mutation;
- Action-/Recovery-Contracts;
- Secrets / Tokens / Credentials / API Keys;
- Releases / Updates;
- Shell / Host Commands.

Ein Remote-System kann solche Felder deshalb nicht durch eine angeblich lokale Allowlist einschleusen.

## Revision und Restart

Ein RemoteConfig-Snapshot wird persistent gespeichert.

- gleiche oder kleinere Revision wird abgelehnt;
- Source-/Policy-Drift wird abgelehnt;
- stale Snapshot darf nach Restart als historischer Stand geladen werden;
- stale Snapshot ist jedoch nicht pinnbar und besitzt keine Execution-Authority;
- neue frische Evidence muss eine hoehere Revision tragen.

## Request Budget

Implementierung:

- `v5/grundlage/quelle/control/request-budget.ts`

Das Budget ist fensterbasiert und lokal konfiguriert.

Die Policy begrenzt:

- Provider-Limit;
- Sicherheitsreserve;
- engeres V5-Systemlimit;
- maximale persistierte Reservierungen;
- separate Limits je Request-Zweck.

Unterstuetzte Zwecke:

- `REMOTE_CONFIG`;
- `RUNTIME_TELEMETRIE`;
- `KNOWLEDGE_SYNC`;
- `UPDATE_CHECK`;
- `SONSTIGES_READONLY`.

## Durable Reservation before Request

Eine externe Anfrage darf erst nach `reserviere()` erfolgen.

Die Reservierung wird kritisch persistiert, bevor ein Permit zurueckgegeben wird.

Das Permit zeigt explizit:

- `durableReserviert=true`;
- `refundBeiUnbekanntemAusgang=false`;
- `automatischerRetry=false`;
- keine Execution-/Gameplay-/Raw-Write-Authority.

Damit wird ein Timeout oder unbekannter Request-Ausgang konservativ als verbrauchte Quota behandelt.

Es existiert bewusst kein automatischer Refund und kein Blind-Retry.

## Quota-Storm-Schutz

Ein Request wird blockiert, sobald eine der Grenzen erreicht wuerde:

- V5-Systemlimit;
- Provider-Limit minus Sicherheitsreserve;
- Zwecklimit;
- bounded Reservierungshistorie.

Request-IDs sind im aktiven Fenster eindeutig.

Ein Restart rekonstruiert den Verbrauch aus der persistenten Reservierungsliste und prueft Summen gegen die gespeicherten Aggregate.

Korruption oder Policy-Drift wird fail-closed abgelehnt.

## Fensterwechsel

Budgetfenster werden nur an der deterministischen harten Fenstergrenze gewechselt.

Zeitregression gegen einen bereits aktiven spaeteren Fensterstand wird blockiert.

Beim neuen Fenster beginnt ein neuer lokaler Budgetstand; alte Reservierungen werden nicht als Refund interpretiert.

## Keine Remote Execution

Die CAP-044-Core-Module enthalten bewusst keine:

- Netzwerk-Fetches;
- Adventure-Land-Public-Function-Aufrufe;
- Code-Upload-/Reload-Aufrufe;
- Shell-/Child-Process-Aufrufe;
- Windows-Bridge;
- Secret-Verwaltung.

Netzwerktransport und Credentials bleiben außerhalb dieses Cores und muessen ihre eigenen Host-/Secret-Grenzen einhalten.

RemoteConfigEvidence oder RequestBudgetPermit sind niemals Gameplay-/Safety-Authority.

## Tests

Neu:

- `v5/grundlage/tests/r11-cloud-control.test.mjs`

Abgedeckt werden insbesondere:

- authority-neutrale RemoteConfig-Allowlist;
- Safety-/Authority-/Secret-Key-Bypass;
- nicht erlaubte Remote-Schluessel;
- falsche Quelle;
- Wertebereichs-Drift;
- Revision-Replay;
- stale Snapshot nach Restart;
- durable Budget-Reservierung;
- Zwecklimit und Systemlimit;
- unbekannter Request-Ausgang bleibt verbraucht;
- Fensterwechsel;
- Zeitregression;
- korrupte Budget-Persistenz.

Die beiden neuen Corepfade sind zusaetzlich in
`grundlage/vertraege/r11/core-testabdeckung.json` mit Positiv- und Negativnachweisen registriert.

## Safety-Grenze

CAP-044 veraendert keine bestehenden V5-Grenzen:

- Operator-Deny / Kill Switch bleiben lokal und absolut;
- Capability-/Owner-Authority bleibt lokal;
- Admission bleibt unmittelbar vor Gameplay-Mutation Pflicht;
- Secrets bleiben außerhalb von RemoteConfig;
- RemoteConfig ist Planning Evidence;
- RequestBudget ist nur Request-Zulassungsbudget;
- UNKNOWN bedeutet kein automatischer Retry.

CAP-042 / Windows Host Adapter bleibt unveraendert geparkt.
