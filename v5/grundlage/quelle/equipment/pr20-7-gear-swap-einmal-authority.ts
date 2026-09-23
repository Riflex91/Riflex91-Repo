import {
  type FencingToken,
  type RessourcenVerwalter,
} from "../scheduler/ressourcen-verwalter.js";
import {
  PR20_7_GEAR_SWAP_SAFE_SLOTS,
  type Pr207GearSwapSafeSlot,
} from "./pr20-7-gear-swap-vorbereitung.js";

export const PR20_7_GEAR_SWAP_AUTHORITY_POLICY_ID =
  "PR20-7-GEAR-SWAP-OCCUPIED-ONE-SHOT-V1";
export const PR20_7_GEAR_SWAP_AUTHORITY_BESTAETIGUNG =
  "V5 PR20.7 BELEGTEN GEAR SWAP EINMAL VORBEREITEN";
export const PR20_7_GEAR_SWAP_AUTHORITY_MAX_TTL_MS = 1_500;
export const PR20_7_GEAR_SWAP_AUTHORITY_DURABLE_ART =
  "PR20_7_GEAR_SWAP_AUTHORITY_VOR_WIRKUNG";
export const PR20_7_GEAR_SWAP_REAL_EVIDENCE_STATUS =
  "BESTANDEN_REAL_BROWSER_NO_WRITE";

export interface Pr207GearSwapAuthorityScope {
  readonly schemaVersion: 1;
  readonly accountId: string;
  readonly characterId: string;
  readonly sessionId: string;
  readonly serverRegion: string;
  readonly serverIdentifier: string;
  readonly slot: Pr207GearSwapSafeSlot;
  readonly kandidatIndex: number;
  readonly kandidatFingerprint: string;
  readonly vorherigesSlotItemFingerprint: string;
  readonly restInventarFingerprint: string;
  readonly restEquipmentFingerprint: string;
  readonly prestateFingerprint: string;
  readonly evidenceFingerprint: string;
}

export interface Pr207GearSwapAuthorityAnforderung {
  readonly schemaVersion: 1;
  readonly aktivierungsId: string;
  readonly transaktionsId: string;
  readonly ablaufId: string;
  readonly evidenceId: string;
  readonly realEvidenceStatus:
    typeof PR20_7_GEAR_SWAP_REAL_EVIDENCE_STATUS;
  readonly policyId: typeof PR20_7_GEAR_SWAP_AUTHORITY_POLICY_ID;
  readonly bestaetigungText:
    typeof PR20_7_GEAR_SWAP_AUTHORITY_BESTAETIGUNG;
  readonly scope: Pr207GearSwapAuthorityScope;
  readonly jetztMs: number;
  readonly gueltigBisMs: number;
}

export interface Pr207GearSwapAuthorityFence {
  readonly ressourcenId: string;
  readonly ablaufId: string;
  readonly epoche: number;
  readonly art: "LANGLEBIG";
  readonly leaseBisMs: number;
}

export interface Pr207GearSwapAuthorityDurableIntent {
  readonly schemaVersion: 1;
  readonly art: typeof PR20_7_GEAR_SWAP_AUTHORITY_DURABLE_ART;
  readonly aktivierungsId: string;
  readonly transaktionsId: string;
  readonly ablaufId: string;
  readonly evidenceId: string;
  readonly realEvidenceStatus:
    typeof PR20_7_GEAR_SWAP_REAL_EVIDENCE_STATUS;
  readonly policyId: typeof PR20_7_GEAR_SWAP_AUTHORITY_POLICY_ID;
  readonly scope: Pr207GearSwapAuthorityScope;
  readonly fences: readonly Pr207GearSwapAuthorityFence[];
  readonly zeitMs: number;
  readonly gueltigBisMs: number;
  readonly maximaleVerwendungen: 1;
  readonly produktiveRegistrierungErlaubt: false;
  readonly breiteRuntimeFreigabe: false;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
  readonly swapWriteRatification: false;
  readonly gameplayWriteNochNichtAusgefuehrt: true;
}

export interface Pr207GearSwapAuthorityDurableBestaetigung {
  readonly durable: true;
  readonly bestaetigungsId: string;
  readonly aktivierungsId: string;
  readonly transaktionsId: string;
  readonly ablaufId: string;
}

export interface Pr207GearSwapAuthorityProtokollPort {
  schreibeDurable(
    intent: Pr207GearSwapAuthorityDurableIntent,
  ): Promise<Pr207GearSwapAuthorityDurableBestaetigung>;
}

export interface Pr207GearSwapAuthorityDaten {
  readonly schemaVersion: 1;
  readonly aktivierungsId: string;
  readonly transaktionsId: string;
  readonly ablaufId: string;
  readonly evidenceId: string;
  readonly realEvidenceStatus:
    typeof PR20_7_GEAR_SWAP_REAL_EVIDENCE_STATUS;
  readonly policyId: typeof PR20_7_GEAR_SWAP_AUTHORITY_POLICY_ID;
  readonly scope: Pr207GearSwapAuthorityScope;
  readonly fences: readonly FencingToken[];
  readonly ausgestelltAmMs: number;
  readonly gueltigBisMs: number;
  readonly maximaleVerwendungen: 1;
}

export interface Pr207GearSwapAuthorityPruefung {
  readonly schemaVersion: 1;
  readonly erlaubt: boolean;
  readonly grund:
    | "PR20_7_GEAR_SWAP_AUTHORITY_ERLAUBT"
    | "PR20_7_GEAR_SWAP_AUTHORITY_VERBRAUCHT"
    | "PR20_7_GEAR_SWAP_AUTHORITY_WIDERRUFEN"
    | "PR20_7_GEAR_SWAP_AUTHORITY_ABGELAUFEN"
    | "PR20_7_GEAR_SWAP_AUTHORITY_SCOPE_DRIFT"
    | "PR20_7_GEAR_SWAP_AUTHORITY_FENCE_UNGUELTIG";
  readonly verbraucht: boolean;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
  readonly swapWriteRatification: false;
}

export interface Pr207GearSwapAuthorityErgebnis {
  readonly schemaVersion: 1;
  readonly erfolgreich: boolean;
  readonly grund: string;
  readonly authority: Pr207GearSwapEinmalAuthority | null;
  readonly fences: readonly FencingToken[];
  readonly maximaleVerwendungen: 1;
  readonly produktiveRegistrierungErlaubt: false;
  readonly gameplayWriteAusgefuehrt: false;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
  readonly swapWriteRatification: false;
  readonly normalRuntimeAllowed: false;
}

function text(wert: string, maximum: number, fehler: string): void {
  if (typeof wert !== "string"
      || wert.trim().length === 0
      || wert.length > maximum) {
    throw new Error(fehler);
  }
}

function hash64(wert: string, fehler: string): void {
  if (!/^[0-9a-f]{64}$/i.test(wert)) throw new Error(fehler);
}

function zeit(wert: number, fehler: string): void {
  if (!Number.isSafeInteger(wert) || wert < 0) throw new Error(fehler);
}

export function pr207GearSwapEquipmentRessourcenId(
  characterId: string,
): string {
  text(characterId, 192, "PR20_7_GEAR_SWAP_CHARACTER_ID_UNGUELTIG");
  return "character:" + characterId + ":equipment";
}

export function pr207GearSwapInventoryRessourcenId(
  characterId: string,
): string {
  text(characterId, 192, "PR20_7_GEAR_SWAP_CHARACTER_ID_UNGUELTIG");
  return "character:" + characterId + ":inventory";
}

function friereScope(
  scope: Pr207GearSwapAuthorityScope,
): Pr207GearSwapAuthorityScope {
  return Object.freeze({ ...scope });
}

function friereToken(token: FencingToken): FencingToken {
  return Object.freeze({ ...token });
}

function scopeMaterial(scope: Pr207GearSwapAuthorityScope): string {
  return JSON.stringify({
    schemaVersion: scope.schemaVersion,
    accountId: scope.accountId,
    characterId: scope.characterId,
    sessionId: scope.sessionId,
    serverRegion: scope.serverRegion,
    serverIdentifier: scope.serverIdentifier,
    slot: scope.slot,
    kandidatIndex: scope.kandidatIndex,
    kandidatFingerprint: scope.kandidatFingerprint,
    vorherigesSlotItemFingerprint: scope.vorherigesSlotItemFingerprint,
    restInventarFingerprint: scope.restInventarFingerprint,
    restEquipmentFingerprint: scope.restEquipmentFingerprint,
    prestateFingerprint: scope.prestateFingerprint,
    evidenceFingerprint: scope.evidenceFingerprint,
  });
}

function validiereScope(scope: Pr207GearSwapAuthorityScope): void {
  if (scope.schemaVersion !== 1) {
    throw new Error("PR20_7_GEAR_SWAP_SCOPE_SCHEMA_UNGUELTIG");
  }
  for (const wert of [
    scope.accountId,
    scope.characterId,
    scope.sessionId,
    scope.serverRegion,
    scope.serverIdentifier,
  ]) {
    text(wert, 192, "PR20_7_GEAR_SWAP_SCOPE_BINDUNG_UNGUELTIG");
  }
  if (!PR20_7_GEAR_SWAP_SAFE_SLOTS.includes(scope.slot)) {
    throw new Error("PR20_7_GEAR_SWAP_SCOPE_SLOT_UNGUELTIG");
  }
  if (!Number.isInteger(scope.kandidatIndex)
      || scope.kandidatIndex < 0
      || scope.kandidatIndex >= 128) {
    throw new Error("PR20_7_GEAR_SWAP_SCOPE_INDEX_UNGUELTIG");
  }
  hash64(
    scope.kandidatFingerprint,
    "PR20_7_GEAR_SWAP_KANDIDAT_FINGERPRINT_UNGUELTIG",
  );
  hash64(
    scope.vorherigesSlotItemFingerprint,
    "PR20_7_GEAR_SWAP_ALTITEM_FINGERPRINT_UNGUELTIG",
  );
  hash64(
    scope.restInventarFingerprint,
    "PR20_7_GEAR_SWAP_REST_INVENTAR_FINGERPRINT_UNGUELTIG",
  );
  hash64(
    scope.restEquipmentFingerprint,
    "PR20_7_GEAR_SWAP_REST_EQUIPMENT_FINGERPRINT_UNGUELTIG",
  );
  hash64(
    scope.prestateFingerprint,
    "PR20_7_GEAR_SWAP_PRESTATE_FINGERPRINT_UNGUELTIG",
  );
  hash64(
    scope.evidenceFingerprint,
    "PR20_7_GEAR_SWAP_EVIDENCE_FINGERPRINT_UNGUELTIG",
  );
  if (scope.kandidatFingerprint === scope.vorherigesSlotItemFingerprint) {
    throw new Error("PR20_7_GEAR_SWAP_IDENTITAET_NICHT_EINDEUTIG");
  }
}

function validiereAnforderung(
  anforderung: Pr207GearSwapAuthorityAnforderung,
): void {
  if (anforderung.schemaVersion !== 1) {
    throw new Error("PR20_7_GEAR_SWAP_AUTHORITY_SCHEMA_UNGUELTIG");
  }
  for (const wert of [
    anforderung.aktivierungsId,
    anforderung.transaktionsId,
    anforderung.ablaufId,
    anforderung.evidenceId,
  ]) {
    text(wert, 192, "PR20_7_GEAR_SWAP_AUTHORITY_KENNUNG_UNGUELTIG");
  }
  if (anforderung.realEvidenceStatus
      !== PR20_7_GEAR_SWAP_REAL_EVIDENCE_STATUS) {
    throw new Error("PR20_7_GEAR_SWAP_REAL_EVIDENCE_NICHT_BESTANDEN");
  }
  if (anforderung.policyId !== PR20_7_GEAR_SWAP_AUTHORITY_POLICY_ID
      || anforderung.bestaetigungText
        !== PR20_7_GEAR_SWAP_AUTHORITY_BESTAETIGUNG) {
    throw new Error("PR20_7_GEAR_SWAP_AUTHORITY_POLICY_UNGUELTIG");
  }
  zeit(
    anforderung.jetztMs,
    "PR20_7_GEAR_SWAP_AUTHORITY_ZEIT_UNGUELTIG",
  );
  zeit(
    anforderung.gueltigBisMs,
    "PR20_7_GEAR_SWAP_AUTHORITY_ABLAUFZEIT_UNGUELTIG",
  );
  const ttl = anforderung.gueltigBisMs - anforderung.jetztMs;
  if (ttl < 1 || ttl > PR20_7_GEAR_SWAP_AUTHORITY_MAX_TTL_MS) {
    throw new Error("PR20_7_GEAR_SWAP_AUTHORITY_TTL_UNGUELTIG");
  }
  validiereScope(anforderung.scope);
}

function erwarteteRessourcenIds(
  characterId: string,
): readonly string[] {
  return Object.freeze([
    pr207GearSwapEquipmentRessourcenId(characterId),
    pr207GearSwapInventoryRessourcenId(characterId),
  ].sort());
}

function validiereFences(
  scope: Pr207GearSwapAuthorityScope,
  ablaufId: string,
  fences: readonly FencingToken[],
  gueltigBisMs: number,
): void {
  if (fences.length !== 2) {
    throw new Error("PR20_7_GEAR_SWAP_FENCE_ANZAHL_UNGUELTIG");
  }
  const ids = fences.map(x => x.ressourcenId).sort();
  const erwartet = erwarteteRessourcenIds(scope.characterId);
  if (ids[0] !== erwartet[0] || ids[1] !== erwartet[1]) {
    throw new Error("PR20_7_GEAR_SWAP_FENCE_SCOPE_UNGUELTIG");
  }
  for (const token of fences) {
    if (token.schemaVersion !== 1
        || token.ablaufId !== ablaufId
        || token.art !== "LANGLEBIG"
        || !Number.isSafeInteger(token.epoche)
        || token.epoche < 1
        || token.leaseBisMs !== gueltigBisMs) {
      throw new Error("PR20_7_GEAR_SWAP_FENCE_TOKEN_UNGUELTIG");
    }
  }
}

function durableFence(
  token: FencingToken,
): Pr207GearSwapAuthorityFence {
  if (token.art !== "LANGLEBIG" || token.leaseBisMs === null) {
    throw new Error("PR20_7_GEAR_SWAP_DURABLE_FENCE_UNGUELTIG");
  }
  return Object.freeze({
    ressourcenId: token.ressourcenId,
    ablaufId: token.ablaufId,
    epoche: token.epoche,
    art: "LANGLEBIG",
    leaseBisMs: token.leaseBisMs,
  });
}

function scopeGleich(
  links: Pr207GearSwapAuthorityScope,
  rechts: Pr207GearSwapAuthorityScope,
): boolean {
  return scopeMaterial(links) === scopeMaterial(rechts);
}

export class Pr207GearSwapEinmalAuthority {
  readonly #daten: Pr207GearSwapAuthorityDaten;
  #verbraucht = false;
  #widerrufen = false;

  public constructor(daten: Pr207GearSwapAuthorityDaten) {
    validiereScope(daten.scope);
    validiereFences(
      daten.scope,
      daten.ablaufId,
      daten.fences,
      daten.gueltigBisMs,
    );
    this.#daten = Object.freeze({
      ...daten,
      scope: friereScope(daten.scope),
      fences: Object.freeze(daten.fences.map(friereToken)),
    });
  }

  public daten(): Pr207GearSwapAuthorityDaten {
    return this.#daten;
  }

  public verbraucht(): boolean {
    return this.#verbraucht;
  }

  public widerrufen(): boolean {
    return this.#widerrufen;
  }

  public gueltigFuer(
    jetztMs: number,
    ressourcen: RessourcenVerwalter,
  ): boolean {
    if (!Number.isSafeInteger(jetztMs)
        || jetztMs < this.#daten.ausgestelltAmMs
        || jetztMs > this.#daten.gueltigBisMs
        || this.#verbraucht
        || this.#widerrufen) {
      return false;
    }
    return this.#daten.fences.every(
      token => ressourcen.validiereFencing(token, jetztMs),
    );
  }

  public pruefeUndVerbrauche(
    scope: Pr207GearSwapAuthorityScope,
    jetztMs: number,
    ressourcen: RessourcenVerwalter,
  ): Pr207GearSwapAuthorityPruefung {
    const block = (
      grund: Pr207GearSwapAuthorityPruefung["grund"],
    ): Pr207GearSwapAuthorityPruefung => Object.freeze({
      schemaVersion: 1,
      erlaubt: false,
      grund,
      verbraucht: this.#verbraucht,
      gameplayAutoritaet: false,
      rawWriteAutoritaet: false,
      swapWriteRatification: false,
    });

    if (this.#verbraucht) {
      return block("PR20_7_GEAR_SWAP_AUTHORITY_VERBRAUCHT");
    }
    if (this.#widerrufen) {
      return block("PR20_7_GEAR_SWAP_AUTHORITY_WIDERRUFEN");
    }
    if (!Number.isSafeInteger(jetztMs)
        || jetztMs < this.#daten.ausgestelltAmMs
        || jetztMs > this.#daten.gueltigBisMs) {
      return block("PR20_7_GEAR_SWAP_AUTHORITY_ABGELAUFEN");
    }
    try {
      validiereScope(scope);
    } catch {
      return block("PR20_7_GEAR_SWAP_AUTHORITY_SCOPE_DRIFT");
    }
    if (!scopeGleich(this.#daten.scope, scope)) {
      return block("PR20_7_GEAR_SWAP_AUTHORITY_SCOPE_DRIFT");
    }
    if (!this.#daten.fences.every(
      token => ressourcen.validiereFencing(token, jetztMs),
    )) {
      return block("PR20_7_GEAR_SWAP_AUTHORITY_FENCE_UNGUELTIG");
    }

    this.#verbraucht = true;
    return Object.freeze({
      schemaVersion: 1,
      erlaubt: true,
      grund: "PR20_7_GEAR_SWAP_AUTHORITY_ERLAUBT",
      verbraucht: true,
      gameplayAutoritaet: false,
      rawWriteAutoritaet: false,
      swapWriteRatification: false,
    });
  }

  public widerrufe(): void {
    this.#widerrufen = true;
  }
}

function blockiert(
  grund: string,
): Pr207GearSwapAuthorityErgebnis {
  return Object.freeze({
    schemaVersion: 1,
    erfolgreich: false,
    grund,
    authority: null,
    fences: Object.freeze([]),
    maximaleVerwendungen: 1,
    produktiveRegistrierungErlaubt: false,
    gameplayWriteAusgefuehrt: false,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
    swapWriteRatification: false,
    normalRuntimeAllowed: false,
  });
}

function gibAktiveFencesFrei(
  ressourcen: RessourcenVerwalter,
  fences: readonly FencingToken[],
  jetztMs: number,
): void {
  for (const token of [...fences].reverse()) {
    if (ressourcen.validiereFencing(token, jetztMs)) {
      ressourcen.gibFrei(token, jetztMs);
    }
  }
}

export async function bereitePr207GearSwapEinmalAuthorityVor(
  anforderung: Pr207GearSwapAuthorityAnforderung,
  protokoll: Pr207GearSwapAuthorityProtokollPort | null,
  ressourcen: RessourcenVerwalter,
): Promise<Pr207GearSwapAuthorityErgebnis> {
  try {
    validiereAnforderung(anforderung);
  } catch (error) {
    return blockiert(String((error as Error)?.message || error));
  }
  if (protokoll === null
      || typeof protokoll.schreibeDurable !== "function") {
    return blockiert("PR20_7_GEAR_SWAP_DURABLE_PROTOKOLL_FEHLT");
  }

  const leaseDauerMs =
    anforderung.gueltigBisMs - anforderung.jetztMs;
  let fences: readonly FencingToken[] = Object.freeze([]);
  try {
    fences = ressourcen.beanspruche(
      anforderung.ablaufId,
      erwarteteRessourcenIds(anforderung.scope.characterId).map(
        ressourcenId => Object.freeze({
          ressourcenId,
          art: "LANGLEBIG" as const,
          leaseDauerMs,
        }),
      ),
      anforderung.jetztMs,
    );
    validiereFences(
      anforderung.scope,
      anforderung.ablaufId,
      fences,
      anforderung.gueltigBisMs,
    );
  } catch (error) {
    return blockiert(
      "PR20_7_GEAR_SWAP_FENCING_BLOCKIERT:"
      + String((error as Error)?.message || error),
    );
  }

  const intent: Pr207GearSwapAuthorityDurableIntent = Object.freeze({
    schemaVersion: 1,
    art: PR20_7_GEAR_SWAP_AUTHORITY_DURABLE_ART,
    aktivierungsId: anforderung.aktivierungsId,
    transaktionsId: anforderung.transaktionsId,
    ablaufId: anforderung.ablaufId,
    evidenceId: anforderung.evidenceId,
    realEvidenceStatus: anforderung.realEvidenceStatus,
    policyId: PR20_7_GEAR_SWAP_AUTHORITY_POLICY_ID,
    scope: friereScope(anforderung.scope),
    fences: Object.freeze(fences.map(durableFence)),
    zeitMs: anforderung.jetztMs,
    gueltigBisMs: anforderung.gueltigBisMs,
    maximaleVerwendungen: 1,
    produktiveRegistrierungErlaubt: false,
    breiteRuntimeFreigabe: false,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
    swapWriteRatification: false,
    gameplayWriteNochNichtAusgefuehrt: true,
  });

  let bestaetigung: Pr207GearSwapAuthorityDurableBestaetigung;
  try {
    bestaetigung = await protokoll.schreibeDurable(intent);
  } catch {
    gibAktiveFencesFrei(
      ressourcen,
      fences,
      anforderung.jetztMs,
    );
    return blockiert("PR20_7_GEAR_SWAP_AUTHORITY_AUDIT_NICHT_DURABLE");
  }
  if (bestaetigung.durable !== true
      || bestaetigung.aktivierungsId !== anforderung.aktivierungsId
      || bestaetigung.transaktionsId !== anforderung.transaktionsId
      || bestaetigung.ablaufId !== anforderung.ablaufId
      || bestaetigung.bestaetigungsId.trim().length === 0
      || bestaetigung.bestaetigungsId.length > 192) {
    gibAktiveFencesFrei(
      ressourcen,
      fences,
      anforderung.jetztMs,
    );
    return blockiert(
      "PR20_7_GEAR_SWAP_AUTHORITY_DURABILITY_NICHT_BESTAETIGT",
    );
  }

  const authority = new Pr207GearSwapEinmalAuthority({
    schemaVersion: 1,
    aktivierungsId: anforderung.aktivierungsId,
    transaktionsId: anforderung.transaktionsId,
    ablaufId: anforderung.ablaufId,
    evidenceId: anforderung.evidenceId,
    realEvidenceStatus: anforderung.realEvidenceStatus,
    policyId: PR20_7_GEAR_SWAP_AUTHORITY_POLICY_ID,
    scope: friereScope(anforderung.scope),
    fences: Object.freeze(fences.map(friereToken)),
    ausgestelltAmMs: anforderung.jetztMs,
    gueltigBisMs: anforderung.gueltigBisMs,
    maximaleVerwendungen: 1,
  });

  return Object.freeze({
    schemaVersion: 1,
    erfolgreich: true,
    grund: "PR20_7_GEAR_SWAP_AUTHORITY_BEREIT_NO_WRITE",
    authority,
    fences: Object.freeze(fences.map(friereToken)),
    maximaleVerwendungen: 1,
    produktiveRegistrierungErlaubt: false,
    gameplayWriteAusgefuehrt: false,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
    swapWriteRatification: false,
    normalRuntimeAllowed: false,
  });
}

export function gibPr207GearSwapEinmalAuthorityFrei(
  authority: Pr207GearSwapEinmalAuthority,
  ressourcen: RessourcenVerwalter,
  jetztMs: number,
): void {
  if (!authority.gueltigFuer(jetztMs, ressourcen)) {
    throw new Error(
      "PR20_7_GEAR_SWAP_FREIGABE_ERFORDERT_GUELTIGE_FENCES_ODER_ABGLEICH",
    );
  }
  authority.widerrufe();
  gibAktiveFencesFrei(
    ressourcen,
    authority.daten().fences,
    jetztMs,
  );
}

export const PR20_7_GEAR_SWAP_AUTHORITY_GAMEPLAY_WRITES = 0;
export const PR20_7_GEAR_SWAP_AUTHORITY_PUBLIC_FUNCTION_CALLS = 0;
export const PR20_7_GEAR_SWAP_AUTHORITY_EXECUTOR_WIRED = false;
export const PR20_7_GEAR_SWAP_AUTHORITY_HOST_EXPOSED = false;
