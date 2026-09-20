import type { SpeicherPort } from "../persistenz/speicher-port.js";

export interface BankKatalogEintrag {
  readonly pack: string;
  readonly slot: number;
  readonly name: string;
  readonly level: number;
  readonly menge: number;
  readonly variantenFingerprint: string;
}

export interface BankKatalogSnapshot {
  readonly schemaVersion: 1;
  readonly accountId: string;
  readonly beobachtetAmMs: number;
  readonly gueltigBisMs: number;
  readonly mountEpoche: number;
  readonly leaseEpoche: number;
  readonly fingerprint: string;
  readonly eintraege: readonly BankKatalogEintrag[];
}

export interface BankKatalogPin {
  readonly schemaVersion: 1;
  readonly accountId: string;
  readonly mountEpoche: number;
  readonly leaseEpoche: number;
  readonly fingerprint: string;
  readonly gueltigBisMs: number;
  readonly planningEvidence: true;
  readonly executionAuthority: false;
}

export interface BankKatalogInvalidierung {
  readonly schemaVersion: 1;
  readonly invalidiertAmMs: number;
  readonly grund: string;
}

export interface PersistenterBankKatalogLadeStatus {
  readonly schemaVersion: 1;
  readonly geladen: boolean;
  readonly verwendbar: boolean;
  readonly invalidiert: boolean;
  readonly planningEvidence: true;
  readonly executionAuthority: false;
}

interface PersistierterBankKatalog {
  readonly schemaVersion: 1;
  readonly gespeichertAmMs: number;
  readonly snapshot: BankKatalogSnapshot | null;
  readonly invalidierung: BankKatalogInvalidierung | null;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function friereSnapshot(
  snapshot: BankKatalogSnapshot,
): BankKatalogSnapshot {
  return Object.freeze({
    ...snapshot,
    eintraege: Object.freeze(
      snapshot.eintraege.map(x => Object.freeze({ ...x })),
    ),
  });
}

export function pinneBankKatalog(
  snapshot: BankKatalogSnapshot,
  jetztMs: number,
): BankKatalogPin {
  if (snapshot.schemaVersion !== 1) throw new Error("BANK_KATALOG_SCHEMA_UNGUELTIG");
  for (const text of [snapshot.accountId, snapshot.fingerprint]) {
    pruefeText(text, "BANK_KATALOG_TEXT_UNGUELTIG");
  }
  if (!Number.isSafeInteger(jetztMs)
      || !Number.isSafeInteger(snapshot.beobachtetAmMs)
      || !Number.isSafeInteger(snapshot.gueltigBisMs)
      || snapshot.beobachtetAmMs < 0
      || snapshot.gueltigBisMs < snapshot.beobachtetAmMs
      || jetztMs < snapshot.beobachtetAmMs
      || jetztMs > snapshot.gueltigBisMs
      || !Number.isSafeInteger(snapshot.mountEpoche)
      || snapshot.mountEpoche < 1
      || !Number.isSafeInteger(snapshot.leaseEpoche)
      || snapshot.leaseEpoche < 1) {
    throw new Error("BANK_KATALOG_NICHT_FRISCH");
  }
  if (snapshot.eintraege.length > 2048) throw new Error("BANK_KATALOG_ZU_GROSS");
  for (let index = 0; index < snapshot.eintraege.length; index += 1) {
    const eintrag = snapshot.eintraege[index];
    if (eintrag === undefined) throw new Error("BANK_KATALOG_EINTRAG_FEHLT");
    for (const text of [eintrag.pack, eintrag.name, eintrag.variantenFingerprint]) {
      pruefeText(text, "BANK_KATALOG_EINTRAG_TEXT_UNGUELTIG");
    }
    if (!Number.isInteger(eintrag.slot)
        || eintrag.slot < 0
        || eintrag.slot > 255
        || !Number.isInteger(eintrag.level)
        || eintrag.level < 0
        || eintrag.level > 99
        || !Number.isInteger(eintrag.menge)
        || eintrag.menge < 1
        || eintrag.menge > 1_000_000) {
      throw new Error("BANK_KATALOG_EINTRAG_UNGUELTIG");
    }
    if (snapshot.eintraege.slice(0, index).some(x =>
      x.pack === eintrag.pack && x.slot === eintrag.slot)) {
      throw new Error("BANK_KATALOG_SLOT_DOPPELT");
    }
  }
  return Object.freeze({
    schemaVersion: 1,
    accountId: snapshot.accountId,
    mountEpoche: snapshot.mountEpoche,
    leaseEpoche: snapshot.leaseEpoche,
    fingerprint: snapshot.fingerprint,
    gueltigBisMs: snapshot.gueltigBisMs,
    planningEvidence: true,
    executionAuthority: false,
  });
}

export function istBankKatalogPinFrisch(pin: BankKatalogPin, jetztMs: number): boolean {
  return pin.schemaVersion === 1
    && pin.planningEvidence === true
    && pin.executionAuthority === false
    && Number.isSafeInteger(jetztMs)
    && jetztMs >= 0
    && jetztMs <= pin.gueltigBisMs;
}

function validierePersistiertenSnapshot(
  snapshot: BankKatalogSnapshot,
): BankKatalogSnapshot {
  pinneBankKatalog(snapshot, snapshot.beobachtetAmMs);
  return friereSnapshot(snapshot);
}

function parsePersistenz(text: string): PersistierterBankKatalog {
  let roh: unknown;
  try {
    roh = JSON.parse(text);
  } catch {
    throw new Error("BANK_KATALOG_PERSISTENZ_UNGUELTIG");
  }
  if (typeof roh !== "object" || roh === null || Array.isArray(roh)) {
    throw new Error("BANK_KATALOG_PERSISTENZ_UNGUELTIG");
  }
  const obj = roh as Readonly<Record<string, unknown>>;
  if (obj["schemaVersion"] !== 1) {
    throw new Error("BANK_KATALOG_PERSISTENZ_UNGUELTIG");
  }
  const gespeichertAmMs = obj["gespeichertAmMs"];
  if (typeof gespeichertAmMs !== "number"
      || !Number.isSafeInteger(gespeichertAmMs)
      || gespeichertAmMs < 0) {
    throw new Error("BANK_KATALOG_PERSISTENZ_UNGUELTIG");
  }

  let snapshot: BankKatalogSnapshot | null = null;
  if (obj["snapshot"] !== null) {
    if (typeof obj["snapshot"] !== "object"
        || obj["snapshot"] === null
        || Array.isArray(obj["snapshot"])) {
      throw new Error("BANK_KATALOG_PERSISTENZ_UNGUELTIG");
    }
    snapshot = validierePersistiertenSnapshot(
      obj["snapshot"] as BankKatalogSnapshot,
    );
  }

  let invalidierung: BankKatalogInvalidierung | null = null;
  if (obj["invalidierung"] !== null) {
    if (typeof obj["invalidierung"] !== "object"
        || obj["invalidierung"] === null
        || Array.isArray(obj["invalidierung"])) {
      throw new Error("BANK_KATALOG_PERSISTENZ_UNGUELTIG");
    }
    const row = obj["invalidierung"] as Readonly<Record<string, unknown>>;
    const invalidiertAmMs = row["invalidiertAmMs"];
    const grund = row["grund"];
    if (row["schemaVersion"] !== 1
        || typeof invalidiertAmMs !== "number"
        || !Number.isSafeInteger(invalidiertAmMs)
        || invalidiertAmMs < 0
        || typeof grund !== "string") {
      throw new Error("BANK_KATALOG_PERSISTENZ_UNGUELTIG");
    }
    pruefeText(grund, "BANK_KATALOG_INVALIDIERUNG_GRUND_UNGUELTIG");
    invalidierung = Object.freeze({
      schemaVersion: 1,
      invalidiertAmMs,
      grund,
    });
  }

  return Object.freeze({
    schemaVersion: 1,
    gespeichertAmMs,
    snapshot,
    invalidierung,
  });
}

export class PersistenterBankKatalog {
  public readonly planningEvidence = true as const;
  public readonly executionAuthority = false as const;
  public readonly gameplayAutoritaet = false as const;
  public readonly rawWriteAutoritaet = false as const;

  readonly #speicher: SpeicherPort;
  readonly #pfad: string;
  #snapshot: BankKatalogSnapshot | null = null;
  #invalidierung: BankKatalogInvalidierung | null = null;

  public constructor(
    speicher: SpeicherPort,
    pfad = "produktion/bank-katalog-v1.json",
  ) {
    pruefeText(pfad, "BANK_KATALOG_PFAD_UNGUELTIG");
    this.#speicher = speicher;
    this.#pfad = pfad;
  }

  public async lade(
    jetztMs: number,
  ): Promise<PersistenterBankKatalogLadeStatus> {
    if (!Number.isSafeInteger(jetztMs) || jetztMs < 0) {
      throw new Error("BANK_KATALOG_ZEIT_UNGUELTIG");
    }
    const text = await this.#speicher.lies(this.#pfad);
    if (text === undefined) {
      return Object.freeze({
        schemaVersion: 1,
        geladen: false,
        verwendbar: false,
        invalidiert: false,
        planningEvidence: true,
        executionAuthority: false,
      });
    }
    const persistiert = parsePersistenz(text);
    if (persistiert.gespeichertAmMs > jetztMs) {
      throw new Error("BANK_KATALOG_PERSISTENZ_AUS_ZUKUNFT");
    }
    this.#snapshot = persistiert.snapshot;
    this.#invalidierung = persistiert.invalidierung;
    return Object.freeze({
      schemaVersion: 1,
      geladen: true,
      verwendbar: this.istVerwendbar(jetztMs),
      invalidiert: this.#istInvalidiert(),
      planningEvidence: true,
      executionAuthority: false,
    });
  }

  public async beobachte(
    snapshot: BankKatalogSnapshot,
    jetztMs: number,
  ): Promise<BankKatalogPin> {
    const pin = pinneBankKatalog(snapshot, jetztMs);
    this.#snapshot = friereSnapshot(snapshot);
    this.#invalidierung = null;
    await this.#persistiere(jetztMs);
    return pin;
  }

  public async invalidiere(
    grund: string,
    jetztMs: number,
  ): Promise<void> {
    pruefeText(grund, "BANK_KATALOG_INVALIDIERUNG_GRUND_UNGUELTIG");
    if (!Number.isSafeInteger(jetztMs) || jetztMs < 0) {
      throw new Error("BANK_KATALOG_ZEIT_UNGUELTIG");
    }
    this.#invalidierung = Object.freeze({
      schemaVersion: 1,
      invalidiertAmMs: jetztMs,
      grund,
    });
    await this.#persistiere(jetztMs);
  }

  public pinne(jetztMs: number): BankKatalogPin {
    if (this.#snapshot === null) {
      throw new Error("BANK_KATALOG_SNAPSHOT_FEHLT");
    }
    if (this.#istInvalidiert()) {
      throw new Error("BANK_KATALOG_INVALIDIERT");
    }
    return pinneBankKatalog(this.#snapshot, jetztMs);
  }

  public istVerwendbar(jetztMs: number): boolean {
    if (this.#snapshot === null || this.#istInvalidiert()) return false;
    try {
      pinneBankKatalog(this.#snapshot, jetztMs);
      return true;
    } catch {
      return false;
    }
  }

  public snapshot(): BankKatalogSnapshot | null {
    return this.#snapshot === null
      ? null
      : friereSnapshot(this.#snapshot);
  }

  public invalidierung(): BankKatalogInvalidierung | null {
    return this.#invalidierung === null
      ? null
      : Object.freeze({ ...this.#invalidierung });
  }

  #istInvalidiert(): boolean {
    return this.#snapshot !== null
      && this.#invalidierung !== null
      && this.#invalidierung.invalidiertAmMs >= this.#snapshot.beobachtetAmMs;
  }

  async #persistiere(jetztMs: number): Promise<void> {
    const persistiert: PersistierterBankKatalog = Object.freeze({
      schemaVersion: 1,
      gespeichertAmMs: jetztMs,
      snapshot: this.#snapshot === null
        ? null
        : friereSnapshot(this.#snapshot),
      invalidierung: this.#invalidierung === null
        ? null
        : Object.freeze({ ...this.#invalidierung }),
    });
    const inhalt = JSON.stringify(persistiert);
    if (inhalt.length > 1_000_000) {
      throw new Error("BANK_KATALOG_PERSISTENZ_ZU_GROSS");
    }
    await this.#speicher.schreibe({
      relativerPfad: this.#pfad,
      inhalt,
      kritisch: true,
    });
  }
}
