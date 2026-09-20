# V5 – Separate Gesamtfreigabe

**Stand:** 2026-09-20  
**Status:** BEREIT_FUER_BETREIBERBESTAETIGUNG

## Zweck

Die technische V5-Readiness und die breite Gameplay-Runtime-Freigabe sind zwei getrennte Zustände.

Technische Readiness bedeutet:
- 10/10 Pflichtbereiche erfüllt;
- 119/119 Anforderungen nachgewiesen;
- 119/119 Traceability vollständig;
- R0-R19 abgeschlossen;
- R19-Zertifizierungs-Ladder vollständig bestanden;
- realer Windows-Bridge-/WISSEN-012-Nachweis geschlossen;
- maßgebliche Post-Merge-CI auf dem technischen Basisstand grün.

Das allein setzt die breite Runtime **nicht** auf aktiv.

## Stufe 1 – Freigabevorbereitung

Maschinenlesbar:

`v5/roadmap/gesamtfreigabe-vorbereitung.json`

Erwarteter Zustand:
- `status = BEREIT_FUER_BETREIBERBESTAETIGUNG`;
- `laufzeit-bereitschaft.status = GESPERRT`;
- `gesamtfreigabe = BETREIBERBESTAETIGUNG_AUSSTEHEND`;
- `breiteRuntimeFreigabe = false`.

Die Vorbereitung darf weder durch CI noch durch Formulierungen wie „ok“, „mach weiter“, „weiter“ oder eine fachfremde Bestätigung in eine Runtime-Freigabe übergehen.

## Stufe 2 – Explizite Betreiberfreigabe

Die breite Runtime darf erst freigegeben werden, wenn der Betreiber ausdrücklich bestätigt:

`V5 GESAMTFREIGABE ERTEILEN`

Danach wird in einem separaten Änderungssatz:
1. `v5/roadmap/gesamtfreigabe.json` als Betreiber-Evidence angelegt;
2. `laufzeit-bereitschaft.status` auf `FREIGEGEBEN` gesetzt;
3. `gesamtfreigabe` auf `ERTEILT` gesetzt;
4. `breiteRuntimeFreigabe` auf `true` gesetzt;
5. die offenen Gesamtfreigabe-Blocker werden entfernt;
6. alle Release-/Readiness-/R19-/Wissens-/Windows-Bridge-Gates erneut auf dem exakten Head geprüft.

Die Freigabe gilt erst nach grünem CI und Merge des exakten geprüften Heads.

## Was die Gesamtfreigabe nicht lockert

Auch nach einer Gesamtfreigabe bleiben verbindlich:
- Capability- und Owner-Authority;
- Operator-Deny und Kill Switch;
- Action Contracts, Verifier und Recovery Contracts;
- Admission unmittelbar vor jeder Mutation;
- Freshness-, Fencing-, Lock- und Resource-Gates;
- durable Intent vor wertverändernder Mutation;
- UNKNOWN/Reconciliation statt Blind Retry;
- Quarantäne und Unknown-Content-Sperren;
- Learning ohne Safety-/Authority-Rechte.

Die Gesamtfreigabe öffnet nur das globale Runtime-Gate. Sie ersetzt keine lokale Aktionsfreigabe.

## Validierung

`v5/werkzeuge/gesamtfreigabe-pruefen.mjs` validiert beide Zustände fail-closed.

CI:

`.github/workflows/v5-gesamtfreigabe.yml`

Ohne finales Freigabeartefakt muss der Validator zwingend den Zustand `BEREIT_FUER_BETREIBERBESTAETIGUNG` mit gesperrter Runtime melden.
