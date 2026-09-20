export type RessourcenArt = "EXKLUSIV" | "LANGLEBIG" | "ACTION_KANAL";

export interface RessourcenAnspruch {
  readonly ressourcenId: string;
  readonly art: RessourcenArt;
  readonly leaseDauerMs: number | null;
}

export interface FencingToken {
  readonly schemaVersion: 1;
  readonly ressourcenId: string;
  readonly ablaufId: string;
  readonly epoche: number;
  readonly art: RessourcenArt;
  readonly leaseBisMs: number | null;
}

export type RessourcenStatus = "FREI" | "AKTIV" | "ABGELAUFEN_ABGLEICH";

export interface RessourcenSicht {
  readonly ressourcenId: string;
  readonly art: RessourcenArt;
  readonly status: RessourcenStatus;
  readonly eigentuemerAblaufId: string | null;
  readonly epoche: number;
  readonly leaseBisMs: number | null;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function friereSicht(sicht: RessourcenSicht): RessourcenSicht {
  return Object.freeze({ ...sicht });
}

function friereToken(token: FencingToken): FencingToken {
  return Object.freeze({ ...token });
}

export function actionKanalRessourcenId(characterId: string, kanalId: string): string {
  pruefeText(characterId, "CHARACTER_KENNUNG_UNGUELTIG");
  pruefeText(kanalId, "ACTION_KANAL_KENNUNG_UNGUELTIG");
  return "character:" + characterId + ":action_channel:" + kanalId;
}

export function socketBudgetRessourcenId(characterId: string): string {
  pruefeText(characterId, "CHARACTER_KENNUNG_UNGUELTIG");
  return "character:" + characterId + ":socket_call_budget";
}

export class RessourcenVerwalter {
  readonly #maximaleRessourcen: number;
  #slots: readonly RessourcenSicht[] = Object.freeze([]);

  public constructor(maximaleRessourcen = 1024) {
    if (!Number.isInteger(maximaleRessourcen)
        || maximaleRessourcen < 1
        || maximaleRessourcen > 8192) {
      throw new Error("RESSOURCEN_GRENZE_UNGUELTIG");
    }
    this.#maximaleRessourcen = maximaleRessourcen;
  }

  public beanspruche(
    ablaufId: string,
    ansprueche: readonly RessourcenAnspruch[],
    jetztMs: number,
  ): readonly FencingToken[] {
    pruefeText(ablaufId, "RESSOURCEN_ABLAUF_KENNUNG_UNGUELTIG");
    this.#pruefeZeit(jetztMs);
    if (ansprueche.length < 1 || ansprueche.length > 128) {
      throw new Error("RESSOURCEN_ANSPRUCH_ANZAHL_UNGUELTIG");
    }

    this.markiereAbgelaufeneLeases(jetztMs);
    const sortiert = [...ansprueche].sort((a, b) => a.ressourcenId.localeCompare(b.ressourcenId));
    for (let index = 0; index < sortiert.length; index += 1) {
      const anspruch = sortiert[index];
      if (anspruch === undefined) throw new Error("RESSOURCEN_ANSPRUCH_FEHLT");
      this.#pruefeAnspruch(anspruch);
      if (index > 0 && sortiert[index - 1]?.ressourcenId === anspruch.ressourcenId) {
        throw new Error("RESSOURCEN_ANSPRUCH_DOPPELT");
      }
      const vorhanden = this.#slots.find(slot => slot.ressourcenId === anspruch.ressourcenId);
      if (vorhanden?.status === "ABGELAUFEN_ABGLEICH") {
        throw new Error("RESSOURCE_ABGLEICH_ERFORDERLICH:" + anspruch.ressourcenId);
      }
      if (vorhanden?.status === "AKTIV" && vorhanden.eigentuemerAblaufId !== ablaufId) {
        throw new Error("RESSOURCE_BELEGT:" + anspruch.ressourcenId);
      }
      if (vorhanden !== undefined && vorhanden.art !== anspruch.art) {
        throw new Error("RESSOURCEN_ART_WIDERSPRUCH:" + anspruch.ressourcenId);
      }
    }

    const neueIds = sortiert.filter(
      anspruch => !this.#slots.some(slot => slot.ressourcenId === anspruch.ressourcenId),
    ).length;
    if (this.#slots.length + neueIds > this.#maximaleRessourcen) {
      throw new Error("RESSOURCEN_REGISTER_VOLL");
    }

    const tokens = sortiert.map(anspruch => {
      const vorhanden = this.#slots.find(slot => slot.ressourcenId === anspruch.ressourcenId);
      if (vorhanden?.status === "AKTIV" && vorhanden.eigentuemerAblaufId === ablaufId) {
        return friereToken({
          schemaVersion: 1,
          ressourcenId: vorhanden.ressourcenId,
          ablaufId,
          epoche: vorhanden.epoche,
          art: vorhanden.art,
          leaseBisMs: vorhanden.leaseBisMs,
        });
      }

      const epoche = (vorhanden?.epoche ?? 0) + 1;
      const leaseBisMs = anspruch.art === "LANGLEBIG"
        ? jetztMs + (anspruch.leaseDauerMs ?? 0)
        : null;
      const neu = friereSicht({
        ressourcenId: anspruch.ressourcenId,
        art: anspruch.art,
        status: "AKTIV",
        eigentuemerAblaufId: ablaufId,
        epoche,
        leaseBisMs,
      });
      this.#slots = Object.freeze(
        vorhanden === undefined
          ? [...this.#slots, neu]
          : this.#slots.map(slot => slot.ressourcenId === neu.ressourcenId ? neu : slot),
      );
      return friereToken({
        schemaVersion: 1,
        ressourcenId: neu.ressourcenId,
        ablaufId,
        epoche: neu.epoche,
        art: neu.art,
        leaseBisMs: neu.leaseBisMs,
      });
    });

    return Object.freeze(tokens);
  }

  public verlaengereLease(
    token: FencingToken,
    jetztMs: number,
    leaseDauerMs: number,
  ): FencingToken {
    this.#pruefeZeit(jetztMs);
    if (!Number.isSafeInteger(leaseDauerMs) || leaseDauerMs < 1 || leaseDauerMs > 86_400_000) {
      throw new Error("LEASE_DAUER_UNGUELTIG");
    }
    this.markiereAbgelaufeneLeases(jetztMs);
    const slot = this.#slots.find(x => x.ressourcenId === token.ressourcenId);
    if (!this.#tokenPasst(slot, token) || slot?.art !== "LANGLEBIG") {
      throw new Error("FENCING_TOKEN_UNGUELTIG");
    }
    const neu = friereSicht({ ...slot, leaseBisMs: jetztMs + leaseDauerMs });
    this.#slots = Object.freeze(this.#slots.map(x => x.ressourcenId === neu.ressourcenId ? neu : x));
    return friereToken({
      ...token,
      leaseBisMs: neu.leaseBisMs,
    });
  }

  public validiereFencing(token: FencingToken, jetztMs: number): boolean {
    this.#pruefeZeit(jetztMs);
    this.markiereAbgelaufeneLeases(jetztMs);
    const slot = this.#slots.find(x => x.ressourcenId === token.ressourcenId);
    return this.#tokenPasst(slot, token);
  }

  public gibFrei(token: FencingToken, jetztMs: number): void {
    this.#pruefeZeit(jetztMs);
    this.markiereAbgelaufeneLeases(jetztMs);
    const slot = this.#slots.find(x => x.ressourcenId === token.ressourcenId);
    if (!this.#tokenPasst(slot, token)) throw new Error("FENCING_TOKEN_UNGUELTIG");
    const frei = friereSicht({
      ...slot,
      status: "FREI",
      eigentuemerAblaufId: null,
      leaseBisMs: null,
    });
    this.#slots = Object.freeze(this.#slots.map(x => x.ressourcenId === frei.ressourcenId ? frei : x));
  }

  public markiereAbgelaufeneLeases(jetztMs: number): readonly string[] {
    this.#pruefeZeit(jetztMs);
    const abgelaufen = this.#slots.filter(slot =>
      slot.status === "AKTIV"
      && slot.art === "LANGLEBIG"
      && slot.leaseBisMs !== null
      && slot.leaseBisMs < jetztMs);
    if (abgelaufen.length === 0) return Object.freeze([]);

    const ids = Object.freeze(abgelaufen.map(slot => slot.ressourcenId).sort());
    this.#slots = Object.freeze(this.#slots.map(slot => {
      if (!ids.includes(slot.ressourcenId)) return slot;
      return friereSicht({ ...slot, status: "ABGELAUFEN_ABGLEICH" });
    }));
    return ids;
  }

  public schliesseAbgleichAb(
    ressourcenId: string,
    ablaufId: string,
    epoche: number,
  ): void {
    const slot = this.#slots.find(x => x.ressourcenId === ressourcenId);
    if (slot === undefined
        || slot.status !== "ABGELAUFEN_ABGLEICH"
        || slot.eigentuemerAblaufId !== ablaufId
        || slot.epoche !== epoche) {
      throw new Error("RESSOURCEN_ABGLEICH_TOKEN_UNGUELTIG");
    }
    const frei = friereSicht({
      ...slot,
      status: "FREI",
      eigentuemerAblaufId: null,
      leaseBisMs: null,
    });
    this.#slots = Object.freeze(this.#slots.map(x => x.ressourcenId === ressourcenId ? frei : x));
  }

  public sicht(): readonly RessourcenSicht[] {
    return Object.freeze(
      this.#slots
        .map(slot => friereSicht(slot))
        .sort((a, b) => a.ressourcenId.localeCompare(b.ressourcenId)),
    );
  }

  #tokenPasst(slot: RessourcenSicht | undefined, token: FencingToken): boolean {
    return slot !== undefined
      && token.schemaVersion === 1
      && slot.status === "AKTIV"
      && slot.eigentuemerAblaufId === token.ablaufId
      && slot.epoche === token.epoche
      && slot.art === token.art;
  }

  #pruefeAnspruch(anspruch: RessourcenAnspruch): void {
    pruefeText(anspruch.ressourcenId, "RESSOURCEN_KENNUNG_UNGUELTIG");
    if (anspruch.art === "LANGLEBIG") {
      if (!Number.isSafeInteger(anspruch.leaseDauerMs)
          || (anspruch.leaseDauerMs ?? 0) < 1
          || (anspruch.leaseDauerMs ?? 0) > 86_400_000) {
        throw new Error("LEASE_DAUER_UNGUELTIG");
      }
    } else if (anspruch.leaseDauerMs !== null) {
      throw new Error("LEASE_NUR_FUER_LANGLEBIG_ERLAUBT");
    }
  }

  #pruefeZeit(jetztMs: number): void {
    if (!Number.isSafeInteger(jetztMs) || jetztMs < 0) {
      throw new Error("RESSOURCEN_ZEIT_UNGUELTIG");
    }
  }
}
