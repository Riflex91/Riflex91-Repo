# P1A – CM Delivery, Server-Lokalitaet, Liveness und Restart

**Status:** GESCHLOSSEN  
**Stand:** 2026-09-20  
**Zielphase:** R14 – Multi-Character Coordination Foundation

## Revalidierte Fakten

Die aktuelle offizielle Adventure-Land-Dokumentation wurde fuer R14 erneut geprueft.

1. Character-Koordination ueber CODE Messages ist realm-/serverlokal. Characters, die zusammenarbeiten sollen, muessen auf demselben Server/Realm laufen.
2. Empfaenger duerfen eine Nachricht nicht allein wegen ihres Inhalts vertrauen. Der Sender muss explizit geprueft werden.
3. CODE Messages sind fuer kleine strukturierte Nachrichten zwischen explizit vertrauenswuerdigen Characters gedacht.
4. Nachrichten sind als untrusted, delayed und moeglicherweise stale zu behandeln; Wiederholungen muessen begrenzt werden.
5. Derselbe Character darf nicht parallel mehrfach geladen werden.
6. Die vorhandene V5-Recherche vom 2026-09-19 dokumentiert fuer den aktuellen CODE-Vertrag zusaetzlich die Transport-Evidence "receivers" und "locals". Eine bereits lokal zugestellte Nachricht darf nach einem partiellen Transportfehler nicht mit neuer semantischer Identitaet erneut gesendet werden.

Offizielle Referenzen:

- https://adventure.land/docs/guide/multi
- https://adventure.land/docs/guide/tracktrix/null/adventure-mcp
- `v5/wissensbasis/quellen/externe-recherche/2026-09-19-adventure-land-research.md`

## R14-Entscheidungen

### CM-Protokoll

Jede koordinationsrelevante Nachricht traegt mindestens:

- Protokoll- und Schemaversion;
- `nachrichtenId` und `dedupeSchluessel`;
- Sender und Empfaenger;
- Serverregion und Serveridentifier;
- Erzeugungszeit und absolute TTL;
- `workflowId` und monotone `workflowRevision`;
- aktuelle `rosterEpoche`;
- Nachrichtentyp;
- optionalen Bezug auf eine beantwortete Nachricht.

Die Inbox verarbeitet eine `nachrichtenId` oder denselben Dedupe-Schluessel innerhalb der TTL hoechstens einmal.

### Loss, Duplicate und Reordering

Transportreihenfolge ist keine Authority.

- Duplicate: wird ueber Message-ID/Dedupe verworfen.
- Out-of-order: eine spaeter ankommende niedrigere Workflow-Revision wird verworfen.
- Loss: eine neuere selbstenthaltene Revision darf ohne vorherige Revision verarbeitet werden.
- Delay: nach TTL wird die Nachricht verworfen.
- Retry: falls Wiederholung noch zulaessig ist, wird **dieselbe Nachrichten-ID** erneut verwendet. Ein Retry erzeugt keine neue semantische Nachricht.

### Server-Lokalitaet

CM-Umschlag, Roster-Ziel und Koordinationsfreigabe sind an `serverRegion + serverIdentifier` gebunden. Ein Serverwechsel invalidiert vorhandene Freigaben.

### Liveness und Roster

Character-Ziele tragen Session-ID und Roster-Epoche. Neue Roster-/Session-Evidence fenced alte Zielbindungen sofort.

Ein staler Character erhaelt keine neue Koordinationsfreigabe.

### Restart und Reload

Persistierte Roster- oder Liveness-Daten sind nach Restart keine frische Authority.

- Roster wird nur als Epoche-Floor importiert; vor neuer Freigabe ist eine frische Beobachtung Pflicht.
- Liveness wird als `RECOVERY_PENDING` importiert; erst ein neuer Heartbeat erzeugt eine neue Sitzungs-Epoche.
- Dedupe-Evidence darf bis zum Ablauf ihrer TTL importiert werden, damit ein Restart keine Duplicate-Verarbeitung oeffnet.

### Ownership

Der Account Coordinator besitzt Account-/Character-Koordination, gemeinsame Ressourcen und accountweite Leases. Er besitzt keine Raw-Game-Write-Authority.

Der Character Agent besitzt lokale Identitaet, Beobachtung und die Annahme gueltiger Koordinationsfreigaben. R14 fuehrt auch dort keine neue Raw-Write-Authority ein.

Transport, Message-Empfang und Koordinationsfreigabe sind keine Gameplay-ExecutionAuthority.

## P1A-Abschluss

Die vier offenen Punkte aus R1.2 sind damit fuer den R14-Kern geschlossen:

- CM delivery/retry: versioniert, TTL-/Dedupe-gebunden und bounded;
- server-local constraints: technisch in Envelope, Roster und Freigabe gebunden;
- Character liveness/freshness: Heartbeat + Sitzungs-Epoche + fail-closed Stale-Pruefung;
- Restart/Reload: Roster/Liveness werden fenced, Dedupe-Evidence bleibt bounded bis TTL.

Der produktive Transportadapter zu Adventure Land ist damit noch nicht freigegeben. R14 bleibt ein no-write Koordinationskern; die breite Gameplay-Runtime bleibt `GESPERRT`.
