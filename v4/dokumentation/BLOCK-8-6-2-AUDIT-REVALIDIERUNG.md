# Block 8.6.2 – Audit, Drift und Recovery-Revalidierung

Status: **implementiert; noch nicht gemergt oder operativ freigegeben.**

## Ziel

Block 8.6.2 macht den Live-Skill-Katalog dauerhaft auditierbar und recovery-sicher.

Der Audit-Pfad ist read-only. Er darf weder Adventure-Land-Spielaktionen ausfuehren noch einen Browser-/Host-Neustart ausloesen. Er erweitert keine Aktionsautoritaet und ersetzt nicht die bestehende Block-8.5-Recovery-Architektur.

## Neue Laufzeitbausteine

Vertrag:

`v4/laufzeit/quelle/vertraege/skill-katalog-audit.ts`

Audit-Steuerung:

`v4/laufzeit/quelle/adventure-land/adventure-land-skill-katalog-audit.ts`

Regressionen:

`v4/laufzeit/tests/skill-katalog-audit.test.mjs`

Die bestehende Skill-Katalog-Lesequelle wurde nur so erweitert, dass derselbe bereits gelesene Adventure-Land-Rohdatensatz fuer Identitaets- und Katalogaudit gemeinsam verwendet werden kann. Damit entsteht innerhalb eines Audit-Zyklus keine zweite, zeitlich abweichende Live-Aufnahme.

## Audit-Ausloeser

Der Audit-Vertrag kennt explizit:

- `runtime_start`,
- `periodisch`,
- `connection_gap`,
- `recovery`,
- `serverwechsel`,
- `charakterwechsel`,
- `levelaenderung`,
- `skill_drift`,
- `revalidierung`.

Die Audit-Steuerung bietet einen periodischen Zeitgeber mit standardmaessig 30 Sekunden Intervall. Der Zeitgeber ist begrenzt auf 1 bis 300 Sekunden.

Der Audit-Zeitgeber ist rein lesend. Er startet keine Spielaktion und besitzt keine automatische Restart-Autoritaet.

## Connection-Gap und Recovery

Ein Connection-Gap liegt vor, wenn kritische Live-Daten fuer Charakter, `G`, Serverregion oder Serverkennung nicht sicher vorliegen oder die Charakter-/Serveridentitaet unvollstaendig ist.

Bei einem Gap gilt:

- ein bereits bekannter Katalog wird `veraltet`,
- ohne historische Katalogbasis bleibt der Zustand fail-closed `blockiert`,
- `produktionsbereit=false`,
- `aktionsAutoritaet=false`,
- `automatischerNeustart=false`.

Wenn die Live-Daten wieder verfuegbar sind, wird `recovery` erkannt. Ein identischer Katalog wird dadurch **nicht** automatisch wieder `bereit`. Er bleibt `veraltet`, bis der exakt aktuell beobachtete Fingerprint revalidiert wurde.

Damit kann eine alte Capability-/Kataloggeneration nach einer Verbindungsluecke nicht still weiterverwendet werden.

## Server- und Charakterwechsel

Server- oder Charakterwechsel invalidieren die bisherige Identitaetsbindung.

Auch wenn Adventure Lands globales `G.skills` denselben fachlichen Fingerprint liefert, bleibt der Katalog danach `veraltet`, bis er fuer die neue Identitaet explizit revalidiert wurde.

Charaktere derselben Klasse werden dadurch nicht als austauschbar behandelt.

## Level-Aenderung

Eine relevante Level-Aenderung loest einen Audit aus.

Wenn sich der fachliche Skill-Katalog dabei nicht geaendert hat, wird dessen Fingerprint oder Generation nicht kuenstlich veraendert. Die Level-Aenderung bleibt als Audit-Ausloeser sichtbar und kann in 8.6.4 die charakterbezogene technische Readiness neu ableiten.

## Skill-Drift

Aendert sich der normalisierte fachliche Skill-Katalog:

- steigt die Kataloggeneration,
- der Zustand wird `drift`,
- `skill_drift` wird als Audit-Ausloeser erfasst,
- ein zweiter identischer Audit hebt die Drift nicht auf,
- eine weitere widerspruechliche Aenderung erzeugt eine weitere Generation.

Bekannte Semantikdrift bleibt weiterhin durch die 8.6.1-`automationValidated`-Regeln zusaetzlich fail-closed.

## Revalidierungsprofil

Nach einer ausdruecklichen Revalidierung kann die Audit-Steuerung ein serialisierbares `SkillKatalogRevalidierungsProfil` ausgeben.

Es bindet:

- den exakt bestaetigten Katalog-Fingerprint,
- die beobachtete Kataloggeneration,
- Charakterkennung,
- Serverregion,
- Serverkennung,
- Bestaetigungszeitpunkt,
- `aktionsAutoritaet:false`.

Ein spaeterer Runtime-Neustart kann dieses Profil wieder einlesen.

Wenn beim Neustart ein neuer Live-Katalog einen anderen Fingerprint besitzt, geht der Katalog unmittelbar auf `drift` statt die alte Persistenz still als gueltig zu behandeln.

Wenn der Fingerprint passt, aber Charakter- oder Serveridentitaet nicht, bleibt der Katalog `veraltet`.

Das Profil ist kein SkillPolicy-Speicher. Persistente SkillPolicy und Slider folgen erst in 8.6.3.

## Produktionsbereitschaft

`produktionsbereit=true` ist in 8.6.2 nur eine read-only Aussage ueber Katalog-/Auditkonsistenz.

Sie setzt voraus:

- keinen aktiven Connection-Gap,
- vollstaendige Charakter-/Serveridentitaet,
- Katalogzustand `bereit`,
- keine offene Fingerprint-Bestaetigung.

Sie ist **keine** Adventure-Land-Aktionsfreigabe.

Der Audit-Status besitzt immer:

- `aktionsAutoritaet:false`,
- `automatischerNeustart:false`.

Die spaetere Ausfuehrungsautoritaet bleibt ausserhalb dieses Bausteins.

## Abnahmefaelle

Die Regressionen decken die im Block-8.6-Plan geforderten Faelle ab:

1. Runtime-Start und periodischer Audit,
2. stale/Connection-Gap -> Recovery -> explizite Revalidierung,
3. Server- und Charakterwechsel,
4. relevante Level-Aenderung,
5. echte Skill-Drift,
6. identischer zweiter Audit nach Drift,
7. widerspruechlicher Folge-Audit mit neuer Generation,
8. Neustart mit altem Revalidierungsprofil und neuem Katalog,
9. unvollstaendige Startidentitaet fail-closed,
10. keine Aktions- oder automatische Restart-Autoritaet.

## Keine Aenderung an Block 8.5

Block 8.6.2 veraendert nicht:

- den immutable Runtime-1.1.5-Release-Candidate aus Block 8.5,
- `RuntimeGesundheit`,
- `RecoveryCheckpointSpeicher`,
- `LaufzeitSteuerung`,
- bestehende Adventure-Land-Aktionspfade.

Die Audit-Steuerung ist ein neuer read-only Baustein fuer Block 8.6 und wird erst im Block-8.6-Freigabepfad operativ gebunden.

## Naechster Schritt

**8.6.3 – Per-Character SkillPolicy und Slider.**
