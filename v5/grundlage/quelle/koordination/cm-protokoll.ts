export type CmNachrichtenTyp = "AUFTRAG" | "ACK" | "SETTLEMENT" | "HEARTBEAT" | "ROSTER";

export interface CmUmschlag<T = unknown> {
  readonly schemaVersion: 1;
  readonly protokollVersion: 1;
  readonly nachrichtenId: string;
  readonly dedupeSchluessel: string;
  readonly senderCharacterId: string;
  readonly empfaengerCharacterId: string;
  readonly serverRegion: string;
  readonly serverIdentifier: string;
  readonly erzeugtAmMs: number;
  readonly gueltigBisMs: number;
  readonly workflowId: string;
  readonly workflowRevision: number;
  readonly rosterEpoche: number;
  readonly typ: CmNachrichtenTyp;
  readonly antwortAuf: string | null;
  readonly inhalt: T;
}

export interface CmEmpfangKontext {
  readonly empfaengerCharacterId: string;
  readonly serverRegion: string;
  readonly serverIdentifier: string;
  readonly rosterEpoche: number;
  readonly vertrauenswuerdigeSender: readonly string[];
  readonly maximaleTtlMs: number;
  readonly maximalePayloadZeichen: number;
}

export type CmEmpfangStatus =
  | "ANGENOMMEN"
  | "DUPLIKAT"
  | "VERALTETE_REVISION"
  | "ABGELAUFEN"
  | "AUS_DER_ZUKUNFT"
  | "FALSCHE_PROTOKOLLVERSION"
  | "FALSCHER_EMPFAENGER"
  | "FALSCHER_SERVER"
  | "UNVERTRAUENSWUERDIGER_SENDER"
  | "FALSCHE_ROSTER_EPOCHE"
  | "UNGUELTIGER_UMSCHLAG"
  | "INHALT_NICHT_JSON"
  | "PAYLOAD_ZU_GROSS"
  | "INBOX_VOLL";

export interface CmEmpfangErgebnis {
  readonly status: CmEmpfangStatus;
  readonly nachrichtenId: string;
  readonly workflowId: string;
  readonly workflowRevision: number;
}

interface CmInboxEintrag {
  readonly nachrichtenId: string;
  readonly dedupeSchluessel: string;
  readonly senderCharacterId: string;
  readonly workflowId: string;
  readonly workflowRevision: number;
  readonly typ: CmNachrichtenTyp;
  readonly gueltigBisMs: number;
}

export interface CmInboxSnapshot {
  readonly schemaVersion: 1;
  readonly eintraege: readonly CmInboxEintrag[];
}

export interface CmZustellNachweis {
  readonly receivers: readonly string[];
  readonly locals: readonly string[];
  readonly transportFehler: boolean;
}

export type CmWiederholungsEntscheidung =
  | "KEINE_WIEDERHOLUNG_ZUGESTELLT"
  | "GLEICHE_NACHRICHTEN_ID_WIEDERHOLEN"
  | "NICHT_MEHR_WIEDERHOLEN_ABGELAUFEN"
  | "NICHT_MEHR_WIEDERHOLEN_VERSUCHSGRENZE";

export interface CmWiederholungsPlan {
  readonly entscheidung: CmWiederholungsEntscheidung;
  readonly nachrichtenId: string;
}

function istText(wert: unknown): wert is string {
  return typeof wert === "string" && wert.trim().length > 0 && wert.length <= 192;
}

function istZeit(wert: unknown): wert is number {
  return Number.isSafeInteger(wert) && (wert as number) >= 0;
}

function basisErgebnis<T>(umschlag: CmUmschlag<T>, status: CmEmpfangStatus): CmEmpfangErgebnis {
  return Object.freeze({
    status,
    nachrichtenId: typeof umschlag.nachrichtenId === "string" ? umschlag.nachrichtenId : "",
    workflowId: typeof umschlag.workflowId === "string" ? umschlag.workflowId : "",
    workflowRevision: Number.isSafeInteger(umschlag.workflowRevision) ? umschlag.workflowRevision : -1,
  });
}

function pruefeKontext(kontext: CmEmpfangKontext): void {
  for (const text of [kontext.empfaengerCharacterId, kontext.serverRegion, kontext.serverIdentifier]) {
    if (!istText(text)) throw new Error("CM_KONTEXT_TEXT_UNGUELTIG");
  }
  if (!Number.isSafeInteger(kontext.rosterEpoche) || kontext.rosterEpoche < 1) {
    throw new Error("CM_KONTEXT_ROSTER_EPOCHE_UNGUELTIG");
  }
  if (!Number.isSafeInteger(kontext.maximaleTtlMs)
      || kontext.maximaleTtlMs < 1
      || kontext.maximaleTtlMs > 300_000) {
    throw new Error("CM_KONTEXT_TTL_UNGUELTIG");
  }
  if (!Number.isSafeInteger(kontext.maximalePayloadZeichen)
      || kontext.maximalePayloadZeichen < 2
      || kontext.maximalePayloadZeichen > 65_536) {
    throw new Error("CM_KONTEXT_PAYLOAD_GRENZE_UNGUELTIG");
  }
  if (kontext.vertrauenswuerdigeSender.length > 64
      || kontext.vertrauenswuerdigeSender.some(x => !istText(x))) {
    throw new Error("CM_KONTEXT_SENDERLISTE_UNGUELTIG");
  }
}

function pruefeUmschlag<T>(
  umschlag: CmUmschlag<T>,
  kontext: CmEmpfangKontext,
  jetztMs: number,
): CmEmpfangStatus | null {
  pruefeKontext(kontext);
  if (!istZeit(jetztMs)) throw new Error("CM_ZEIT_UNGUELTIG");
  if (umschlag.schemaVersion !== 1 || umschlag.protokollVersion !== 1) {
    return "FALSCHE_PROTOKOLLVERSION";
  }
  if (![umschlag.nachrichtenId, umschlag.dedupeSchluessel, umschlag.senderCharacterId,
    umschlag.empfaengerCharacterId, umschlag.serverRegion, umschlag.serverIdentifier,
    umschlag.workflowId].every(istText)) {
    return "UNGUELTIGER_UMSCHLAG";
  }
  if (!istZeit(umschlag.erzeugtAmMs)
      || !istZeit(umschlag.gueltigBisMs)
      || umschlag.gueltigBisMs < umschlag.erzeugtAmMs
      || umschlag.gueltigBisMs - umschlag.erzeugtAmMs > kontext.maximaleTtlMs
      || !Number.isSafeInteger(umschlag.workflowRevision)
      || umschlag.workflowRevision < 0
      || !Number.isSafeInteger(umschlag.rosterEpoche)
      || umschlag.rosterEpoche < 1) {
    return "UNGUELTIGER_UMSCHLAG";
  }
  if (!(["AUFTRAG", "ACK", "SETTLEMENT", "HEARTBEAT", "ROSTER"] as const).includes(umschlag.typ)) {
    return "UNGUELTIGER_UMSCHLAG";
  }
  if ((umschlag.typ === "ACK" || umschlag.typ === "SETTLEMENT") && !istText(umschlag.antwortAuf)) {
    return "UNGUELTIGER_UMSCHLAG";
  }
  if (umschlag.antwortAuf !== null && !istText(umschlag.antwortAuf)) return "UNGUELTIGER_UMSCHLAG";
  if (umschlag.erzeugtAmMs > jetztMs) return "AUS_DER_ZUKUNFT";
  if (umschlag.gueltigBisMs < jetztMs) return "ABGELAUFEN";
  if (umschlag.empfaengerCharacterId !== kontext.empfaengerCharacterId) return "FALSCHER_EMPFAENGER";
  if (umschlag.serverRegion !== kontext.serverRegion
      || umschlag.serverIdentifier !== kontext.serverIdentifier) {
    return "FALSCHER_SERVER";
  }
  if (!kontext.vertrauenswuerdigeSender.includes(umschlag.senderCharacterId)) {
    return "UNVERTRAUENSWUERDIGER_SENDER";
  }
  if (umschlag.rosterEpoche !== kontext.rosterEpoche) return "FALSCHE_ROSTER_EPOCHE";
  let serialisiert: string | undefined;
  try { serialisiert = JSON.stringify(umschlag.inhalt); }
  catch { return "INHALT_NICHT_JSON"; }
  if (serialisiert === undefined) return "INHALT_NICHT_JSON";
  if (serialisiert.length > kontext.maximalePayloadZeichen) return "PAYLOAD_ZU_GROSS";
  return null;
}

export class CmInbox {
  readonly #maximaleEintraege: number;
  #eintraege: readonly CmInboxEintrag[] = Object.freeze([]);

  public constructor(maximaleEintraege = 512) {
    if (!Number.isInteger(maximaleEintraege) || maximaleEintraege < 1 || maximaleEintraege > 4096) {
      throw new Error("CM_INBOX_GRENZE_UNGUELTIG");
    }
    this.#maximaleEintraege = maximaleEintraege;
  }

  public empfange<T>(
    umschlag: CmUmschlag<T>,
    kontext: CmEmpfangKontext,
    jetztMs: number,
  ): CmEmpfangErgebnis {
    this.#entferneAbgelaufene(jetztMs);
    const ungueltig = pruefeUmschlag(umschlag, kontext, jetztMs);
    if (ungueltig !== null) return basisErgebnis(umschlag, ungueltig);
    const doppelt = this.#eintraege.some(x =>
      x.nachrichtenId === umschlag.nachrichtenId
      || x.dedupeSchluessel === umschlag.dedupeSchluessel);
    if (doppelt) return basisErgebnis(umschlag, "DUPLIKAT");
    const veraltet = this.#eintraege.some(x =>
      x.senderCharacterId === umschlag.senderCharacterId
      && x.workflowId === umschlag.workflowId
      && x.typ === umschlag.typ
      && x.workflowRevision >= umschlag.workflowRevision);
    if (veraltet) return basisErgebnis(umschlag, "VERALTETE_REVISION");
    if (this.#eintraege.length >= this.#maximaleEintraege) {
      return basisErgebnis(umschlag, "INBOX_VOLL");
    }
    const neu: CmInboxEintrag = Object.freeze({
      nachrichtenId: umschlag.nachrichtenId,
      dedupeSchluessel: umschlag.dedupeSchluessel,
      senderCharacterId: umschlag.senderCharacterId,
      workflowId: umschlag.workflowId,
      workflowRevision: umschlag.workflowRevision,
      typ: umschlag.typ,
      gueltigBisMs: umschlag.gueltigBisMs,
    });
    this.#eintraege = Object.freeze([...this.#eintraege, neu]);
    return basisErgebnis(umschlag, "ANGENOMMEN");
  }

  public snapshot(jetztMs: number): CmInboxSnapshot {
    this.#entferneAbgelaufene(jetztMs);
    return Object.freeze({
      schemaVersion: 1,
      eintraege: Object.freeze(this.#eintraege.map(x => Object.freeze({ ...x }))),
    });
  }

  public importiereNachRestart(snapshot: CmInboxSnapshot, jetztMs: number): void {
    if (!istZeit(jetztMs) || snapshot.schemaVersion !== 1
        || snapshot.eintraege.length > this.#maximaleEintraege) {
      throw new Error("CM_INBOX_RESTART_SNAPSHOT_UNGUELTIG");
    }
    const relevant = snapshot.eintraege.filter(x => x.gueltigBisMs >= jetztMs);
    for (let index = 0; index < relevant.length; index += 1) {
      const eintrag = relevant[index];
      if (eintrag === undefined
          || !istText(eintrag.nachrichtenId)
          || !istText(eintrag.dedupeSchluessel)
          || !istText(eintrag.senderCharacterId)
          || !istText(eintrag.workflowId)
          || !Number.isSafeInteger(eintrag.workflowRevision)
          || eintrag.workflowRevision < 0
          || !istZeit(eintrag.gueltigBisMs)) {
        throw new Error("CM_INBOX_RESTART_EINTRAG_UNGUELTIG");
      }
      if (relevant.slice(0, index).some(x =>
        x.nachrichtenId === eintrag.nachrichtenId
        || x.dedupeSchluessel === eintrag.dedupeSchluessel)) {
        throw new Error("CM_INBOX_RESTART_DUPLIKAT");
      }
    }
    this.#eintraege = Object.freeze(relevant.map(x => Object.freeze({ ...x })));
  }

  public sicht(): readonly Readonly<CmInboxEintrag>[] {
    return Object.freeze(this.#eintraege.map(x => Object.freeze({ ...x })));
  }

  #entferneAbgelaufene(jetztMs: number): void {
    if (!istZeit(jetztMs)) throw new Error("CM_ZEIT_UNGUELTIG");
    this.#eintraege = Object.freeze(this.#eintraege.filter(x => x.gueltigBisMs >= jetztMs));
  }
}

export function planeCmWiederholung<T>(
  umschlag: CmUmschlag<T>,
  nachweis: CmZustellNachweis,
  versuch: number,
  maximaleVersuche: number,
  jetztMs: number,
): CmWiederholungsPlan {
  if (!Number.isInteger(versuch) || versuch < 1
      || !Number.isInteger(maximaleVersuche) || maximaleVersuche < 1 || maximaleVersuche > 16
      || !istZeit(jetztMs)
      || nachweis.receivers.length > 64
      || nachweis.locals.length > 64) {
    throw new Error("CM_WIEDERHOLUNG_PARAMETER_UNGUELTIG");
  }
  const zugestellt = nachweis.receivers.includes(umschlag.empfaengerCharacterId)
    || nachweis.locals.includes(umschlag.empfaengerCharacterId);
  if (zugestellt) {
    return Object.freeze({
      entscheidung: "KEINE_WIEDERHOLUNG_ZUGESTELLT",
      nachrichtenId: umschlag.nachrichtenId,
    });
  }
  if (jetztMs > umschlag.gueltigBisMs) {
    return Object.freeze({
      entscheidung: "NICHT_MEHR_WIEDERHOLEN_ABGELAUFEN",
      nachrichtenId: umschlag.nachrichtenId,
    });
  }
  if (versuch >= maximaleVersuche) {
    return Object.freeze({
      entscheidung: "NICHT_MEHR_WIEDERHOLEN_VERSUCHSGRENZE",
      nachrichtenId: umschlag.nachrichtenId,
    });
  }
  return Object.freeze({
    entscheidung: "GLEICHE_NACHRICHTEN_ID_WIEDERHOLEN",
    nachrichtenId: umschlag.nachrichtenId,
  });
}
