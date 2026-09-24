export type Pr208WertmutationArt = "UPGRADE" | "COMPOUND" | "EXCHANGE";

export interface Pr208WertmutationResourceEpochen {
  readonly inventory: number;
  readonly q: number;
  readonly socketBudget: number;
  readonly actionChannel: number;
}

export interface Pr208WertmutationCurrentSnapshot {
  readonly schemaVersion: 1;
  readonly characterId: string;
  readonly sessionId: string;
  readonly serverRegion: string;
  readonly serverIdentifier: string;
  readonly prestateFingerprint: string;
  readonly inventoryFingerprint: string;
  readonly qFingerprint: string;
  readonly itemFingerprints: readonly string[];
  readonly resourceEpochen: Pr208WertmutationResourceEpochen;
  readonly offeneUpgradeAuthority: boolean;
  readonly offeneCompoundAuthority: boolean;
  readonly offeneExchangeAuthority: boolean;
  readonly offeneUpgradeTransaktionId: string | null;
  readonly offeneCompoundTransaktionId: string | null;
  readonly offeneExchangeTransaktionId: string | null;
}

export interface Pr208WertmutationCurrentFenceErgebnis {
  readonly schemaVersion: 1;
  readonly status: "BEREIT" | "BLOCKIERT";
  readonly gruende: readonly string[];
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
  readonly actionAuthority: false;
}

export interface Pr208WertmutationAuthorityBinding {
  readonly schemaVersion: 1;
  readonly aktivierungsId: string;
  readonly transaktionsId: string;
  readonly characterId: string;
  readonly sessionId: string;
  readonly serverRegion: string;
  readonly serverIdentifier: string;
  readonly prestateFingerprint: string;
  readonly inventoryFingerprint: string;
  readonly qFingerprint: string;
  readonly itemFingerprints: readonly string[];
  readonly resourceEpochen: Pr208WertmutationResourceEpochen;
  readonly ausgestelltAmMs: number;
  readonly gueltigBisMs: number;
  readonly maximaleVerwendungen: 1;
}

export interface Pr208WertmutationAuthorityDurableIntent {
  readonly schemaVersion: 1;
  readonly art:
    | "PR20_8_UPGRADE_AUTHORITY_VOR_WIRKUNG"
    | "PR20_8_COMPOUND_AUTHORITY_VOR_WIRKUNG"
    | "PR20_8_EXCHANGE_AUTHORITY_VOR_WIRKUNG";
  readonly actionContractId:
    | "AL-ACTION-UPGRADE"
    | "AL-ACTION-COMPOUND"
    | "AL-ACTION-EXCHANGE";
  readonly recoveryContractId:
    | "AL-RECOVERY-UPGRADE"
    | "AL-RECOVERY-COMPOUND"
    | "AL-RECOVERY-EXCHANGE";
  readonly verifierId:
    | "AL-VERIFIER-UPGRADE"
    | "AL-VERIFIER-COMPOUND"
    | "AL-VERIFIER-EXCHANGE";
  readonly binding: Pr208WertmutationAuthorityBinding;
  readonly sameIntentRetry: false;
  readonly gameplayWriteNochNichtAusgefuehrt: true;
  readonly rawWriteAutoritaet: false;
  readonly breiteRuntimeFreigabe: false;
}

export interface Pr208WertmutationAuthorityDurableBestaetigung {
  readonly durable: true;
  readonly bestaetigungsId: string;
  readonly aktivierungsId: string;
  readonly transaktionsId: string;
}

export interface Pr208WertmutationAuthorityProtokollPort {
  schreibeDurable(
    intent: Pr208WertmutationAuthorityDurableIntent,
  ): Promise<Pr208WertmutationAuthorityDurableBestaetigung>;
}

export interface Pr208WertmutationAuthorityErgebnis<T> {
  readonly schemaVersion: 1;
  readonly erfolgreich: boolean;
  readonly grund: string;
  readonly authority: T | null;
  readonly durableReadback: boolean;
  readonly maximaleVerwendungen: 1;
  readonly gameplayWrites: 0;
  readonly publicFunctionCalls: 0;
  readonly rawWriteCalls: 0;
  readonly normalRuntimeAllowed: false;
}

function text(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function epoche(wert: number, fehler: string): void {
  if (!Number.isSafeInteger(wert) || wert < 0) throw new Error(fehler);
}

function validiereResourceEpochen(e: Pr208WertmutationResourceEpochen): void {
  epoche(e.inventory, "PR20_8_INVENTORY_EPOCHE_UNGUELTIG");
  epoche(e.q, "PR20_8_Q_EPOCHE_UNGUELTIG");
  epoche(e.socketBudget, "PR20_8_SOCKET_EPOCHE_UNGUELTIG");
  epoche(e.actionChannel, "PR20_8_CHANNEL_EPOCHE_UNGUELTIG");
}

function validiereBinding(binding: Pr208WertmutationAuthorityBinding): void {
  if (!binding || binding.schemaVersion !== 1) {
    throw new Error("PR20_8_AUTHORITY_BINDING_SCHEMA_UNGUELTIG");
  }
  for (const x of [
    binding.aktivierungsId,
    binding.transaktionsId,
    binding.characterId,
    binding.sessionId,
    binding.serverRegion,
    binding.serverIdentifier,
    binding.prestateFingerprint,
    binding.inventoryFingerprint,
    binding.qFingerprint,
  ]) text(x, "PR20_8_AUTHORITY_BINDING_TEXT_UNGUELTIG");
  if (binding.itemFingerprints.length < 1 || binding.itemFingerprints.length > 16) {
    throw new Error("PR20_8_AUTHORITY_ITEM_FINGERPRINT_ANZAHL_UNGUELTIG");
  }
  for (const x of binding.itemFingerprints) {
    text(x, "PR20_8_AUTHORITY_ITEM_FINGERPRINT_UNGUELTIG");
  }
  if (new Set(binding.itemFingerprints).size !== binding.itemFingerprints.length) {
    throw new Error("PR20_8_AUTHORITY_ITEM_FINGERPRINT_DOPPELT");
  }
  if (!Number.isSafeInteger(binding.ausgestelltAmMs)
      || !Number.isSafeInteger(binding.gueltigBisMs)
      || binding.ausgestelltAmMs < 0
      || binding.gueltigBisMs < binding.ausgestelltAmMs
      || binding.gueltigBisMs - binding.ausgestelltAmMs > 1_500) {
    throw new Error("PR20_8_AUTHORITY_TTL_UNGUELTIG");
  }
  if (binding.maximaleVerwendungen !== 1) {
    throw new Error("PR20_8_AUTHORITY_MAX_USES_UNGUELTIG");
  }
  validiereResourceEpochen(binding.resourceEpochen);
}

function snapshotGruende(
  snapshot: Pr208WertmutationCurrentSnapshot,
): readonly string[] {
  if (!snapshot || snapshot.schemaVersion !== 1) {
    throw new Error("PR20_8_CURRENT_FENCE_SCHEMA_UNGUELTIG");
  }
  for (const x of [
    snapshot.characterId,
    snapshot.sessionId,
    snapshot.serverRegion,
    snapshot.serverIdentifier,
    snapshot.prestateFingerprint,
    snapshot.inventoryFingerprint,
    snapshot.qFingerprint,
  ]) text(x, "PR20_8_CURRENT_FENCE_TEXT_UNGUELTIG");
  if (snapshot.itemFingerprints.length < 1 || snapshot.itemFingerprints.length > 16) {
    throw new Error("PR20_8_CURRENT_FENCE_ITEM_FINGERPRINT_ANZAHL_UNGUELTIG");
  }
  for (const x of snapshot.itemFingerprints) {
    text(x, "PR20_8_CURRENT_FENCE_ITEM_FINGERPRINT_UNGUELTIG");
  }
  validiereResourceEpochen(snapshot.resourceEpochen);
  const g: string[] = [];
  if (snapshot.offeneUpgradeAuthority) g.push("PR20_8_UPGRADE_AUTHORITY_OFFEN");
  if (snapshot.offeneCompoundAuthority) g.push("PR20_8_COMPOUND_AUTHORITY_OFFEN");
  if (snapshot.offeneExchangeAuthority) g.push("PR20_8_EXCHANGE_AUTHORITY_OFFEN");
  if (snapshot.offeneUpgradeTransaktionId !== null) g.push("PR20_8_UPGRADE_TX_OFFEN");
  if (snapshot.offeneCompoundTransaktionId !== null) g.push("PR20_8_COMPOUND_TX_OFFEN");
  if (snapshot.offeneExchangeTransaktionId !== null) g.push("PR20_8_EXCHANGE_TX_OFFEN");
  return Object.freeze(g);
}

export function pruefePr208WertmutationVorAuthorityCurrentFence(
  snapshot: Pr208WertmutationCurrentSnapshot,
): Pr208WertmutationCurrentFenceErgebnis {
  const gruende = snapshotGruende(snapshot);
  return Object.freeze({
    schemaVersion: 1,
    status: gruende.length === 0 ? "BEREIT" : "BLOCKIERT",
    gruende,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
    actionAuthority: false,
  });
}

function gleich(
  a: Pr208WertmutationResourceEpochen,
  b: Pr208WertmutationResourceEpochen,
): boolean {
  return a.inventory === b.inventory
    && a.q === b.q
    && a.socketBudget === b.socketBudget
    && a.actionChannel === b.actionChannel;
}

function bindungPasst(
  binding: Pr208WertmutationAuthorityBinding,
  snapshot: Pr208WertmutationCurrentSnapshot,
  jetztMs: number,
): boolean {
  return Number.isSafeInteger(jetztMs)
    && jetztMs >= binding.ausgestelltAmMs
    && jetztMs <= binding.gueltigBisMs
    && binding.characterId === snapshot.characterId
    && binding.sessionId === snapshot.sessionId
    && binding.serverRegion === snapshot.serverRegion
    && binding.serverIdentifier === snapshot.serverIdentifier
    && binding.prestateFingerprint === snapshot.prestateFingerprint
    && binding.inventoryFingerprint === snapshot.inventoryFingerprint
    && binding.qFingerprint === snapshot.qFingerprint
    && binding.itemFingerprints.length === snapshot.itemFingerprints.length
    && binding.itemFingerprints.every(
      (x, i) => x === snapshot.itemFingerprints[i],
    )
    && gleich(binding.resourceEpochen, snapshot.resourceEpochen);
}

abstract class SeparateOneShotAuthority {
  readonly #binding: Pr208WertmutationAuthorityBinding;
  #verbraucht = false;
  #widerrufen = false;

  protected constructor(binding: Pr208WertmutationAuthorityBinding) {
    validiereBinding(binding);
    this.#binding = Object.freeze({
      ...binding,
      itemFingerprints: Object.freeze([...binding.itemFingerprints]),
      resourceEpochen: Object.freeze({ ...binding.resourceEpochen }),
    });
  }

  public daten(): Pr208WertmutationAuthorityBinding {
    return this.#binding;
  }

  public verbraucht(): boolean {
    return this.#verbraucht;
  }

  public widerrufen(): boolean {
    return this.#widerrufen;
  }

  public widerrufe(): void {
    this.#widerrufen = true;
  }

  public revalidiere(
    snapshot: Pr208WertmutationCurrentSnapshot,
    jetztMs: number,
  ): boolean {
    if (this.#verbraucht || this.#widerrufen
        || !bindungPasst(this.#binding, snapshot, jetztMs)) {
      this.#widerrufen = true;
      return false;
    }
    return true;
  }

  protected consume(
    snapshot: Pr208WertmutationCurrentSnapshot,
    jetztMs: number,
  ): boolean {
    if (!this.revalidiere(snapshot, jetztMs)) return false;
    this.#verbraucht = true;
    return true;
  }
}

export class Pr208UpgradeOneShotAuthority extends SeparateOneShotAuthority {
  public constructor(binding: Pr208WertmutationAuthorityBinding) {
    super(binding);
  }
  public verbrauche(
    snapshot: Pr208WertmutationCurrentSnapshot,
    jetztMs: number,
  ): boolean {
    return this.consume(snapshot, jetztMs);
  }
}

export class Pr208CompoundOneShotAuthority extends SeparateOneShotAuthority {
  public constructor(binding: Pr208WertmutationAuthorityBinding) {
    super(binding);
  }
  public verbrauche(
    snapshot: Pr208WertmutationCurrentSnapshot,
    jetztMs: number,
  ): boolean {
    return this.consume(snapshot, jetztMs);
  }
}

export class Pr208ExchangeOneShotAuthority extends SeparateOneShotAuthority {
  public constructor(binding: Pr208WertmutationAuthorityBinding) {
    super(binding);
  }
  public verbrauche(
    snapshot: Pr208WertmutationCurrentSnapshot,
    jetztMs: number,
  ): boolean {
    return this.consume(snapshot, jetztMs);
  }
}

async function durableIssue<T>(
  binding: Pr208WertmutationAuthorityBinding,
  snapshot: Pr208WertmutationCurrentSnapshot,
  protokoll: Pr208WertmutationAuthorityProtokollPort,
  spec: {
    art: Pr208WertmutationAuthorityDurableIntent["art"];
    actionContractId: Pr208WertmutationAuthorityDurableIntent["actionContractId"];
    recoveryContractId: Pr208WertmutationAuthorityDurableIntent["recoveryContractId"];
    verifierId: Pr208WertmutationAuthorityDurableIntent["verifierId"];
    create: (binding: Pr208WertmutationAuthorityBinding) => T;
    prefix: string;
  },
): Promise<Pr208WertmutationAuthorityErgebnis<T>> {
  validiereBinding(binding);
  const fence = pruefePr208WertmutationVorAuthorityCurrentFence(snapshot);
  const fail = (grund: string): Pr208WertmutationAuthorityErgebnis<T> =>
    Object.freeze({
      schemaVersion: 1,
      erfolgreich: false,
      grund,
      authority: null,
      durableReadback: false,
      maximaleVerwendungen: 1,
      gameplayWrites: 0,
      publicFunctionCalls: 0,
      rawWriteCalls: 0,
      normalRuntimeAllowed: false,
    });
  if (fence.status !== "BEREIT") return fail(spec.prefix + "_CURRENT_FENCE_BLOCKIERT");
  if (!bindungPasst(binding, snapshot, binding.ausgestelltAmMs)) {
    return fail(spec.prefix + "_BINDING_DRIFT");
  }
  let ack: Pr208WertmutationAuthorityDurableBestaetigung;
  try {
    ack = await protokoll.schreibeDurable(Object.freeze({
      schemaVersion: 1,
      art: spec.art,
      actionContractId: spec.actionContractId,
      recoveryContractId: spec.recoveryContractId,
      verifierId: spec.verifierId,
      binding: Object.freeze({
        ...binding,
        itemFingerprints: Object.freeze([...binding.itemFingerprints]),
        resourceEpochen: Object.freeze({ ...binding.resourceEpochen }),
      }),
      sameIntentRetry: false,
      gameplayWriteNochNichtAusgefuehrt: true,
      rawWriteAutoritaet: false,
      breiteRuntimeFreigabe: false,
    }));
  } catch {
    return fail(spec.prefix + "_DURABLE_WRITE_FEHLER");
  }
  if (!ack.durable
      || ack.aktivierungsId !== binding.aktivierungsId
      || ack.transaktionsId !== binding.transaktionsId) {
    return fail(spec.prefix + "_DURABLE_READBACK_FEHLER");
  }
  return Object.freeze({
    schemaVersion: 1,
    erfolgreich: true,
    grund: spec.prefix + "_AUTHORITY_BEREIT",
    authority: spec.create(binding),
    durableReadback: true,
    maximaleVerwendungen: 1,
    gameplayWrites: 0,
    publicFunctionCalls: 0,
    rawWriteCalls: 0,
    normalRuntimeAllowed: false,
  });
}

export function erteilePr208UpgradeOneShotAuthority(
  binding: Pr208WertmutationAuthorityBinding,
  snapshot: Pr208WertmutationCurrentSnapshot,
  protokoll: Pr208WertmutationAuthorityProtokollPort,
): Promise<Pr208WertmutationAuthorityErgebnis<Pr208UpgradeOneShotAuthority>> {
  return durableIssue(binding, snapshot, protokoll, {
    art: "PR20_8_UPGRADE_AUTHORITY_VOR_WIRKUNG",
    actionContractId: "AL-ACTION-UPGRADE",
    recoveryContractId: "AL-RECOVERY-UPGRADE",
    verifierId: "AL-VERIFIER-UPGRADE",
    create: x => new Pr208UpgradeOneShotAuthority(x),
    prefix: "PR20_8_UPGRADE",
  });
}

export function erteilePr208CompoundOneShotAuthority(
  binding: Pr208WertmutationAuthorityBinding,
  snapshot: Pr208WertmutationCurrentSnapshot,
  protokoll: Pr208WertmutationAuthorityProtokollPort,
): Promise<Pr208WertmutationAuthorityErgebnis<Pr208CompoundOneShotAuthority>> {
  return durableIssue(binding, snapshot, protokoll, {
    art: "PR20_8_COMPOUND_AUTHORITY_VOR_WIRKUNG",
    actionContractId: "AL-ACTION-COMPOUND",
    recoveryContractId: "AL-RECOVERY-COMPOUND",
    verifierId: "AL-VERIFIER-COMPOUND",
    create: x => new Pr208CompoundOneShotAuthority(x),
    prefix: "PR20_8_COMPOUND",
  });
}

export function erteilePr208ExchangeOneShotAuthority(
  binding: Pr208WertmutationAuthorityBinding,
  snapshot: Pr208WertmutationCurrentSnapshot,
  protokoll: Pr208WertmutationAuthorityProtokollPort,
): Promise<Pr208WertmutationAuthorityErgebnis<Pr208ExchangeOneShotAuthority>> {
  return durableIssue(binding, snapshot, protokoll, {
    art: "PR20_8_EXCHANGE_AUTHORITY_VOR_WIRKUNG",
    actionContractId: "AL-ACTION-EXCHANGE",
    recoveryContractId: "AL-RECOVERY-EXCHANGE",
    verifierId: "AL-VERIFIER-EXCHANGE",
    create: x => new Pr208ExchangeOneShotAuthority(x),
    prefix: "PR20_8_EXCHANGE",
  });
}
