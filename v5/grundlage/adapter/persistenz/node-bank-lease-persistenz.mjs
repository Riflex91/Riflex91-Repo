const PFAD = "runtime/bank/lease-state-v1.json";
const MAX_BYTES = 500_000;

export class NodeBankLeasePersistenz {
  #dateisystem;

  constructor(dateisystem) {
    if (!dateisystem
        || typeof dateisystem.liesText !== "function"
        || typeof dateisystem.schreibeAtomarDurable !== "function") {
      throw new Error("BANK_LEASE_NODE_PERSISTENZ_DATEISYSTEM_UNGUELTIG");
    }
    this.#dateisystem = dateisystem;
  }

  async lies() {
    const text = await this.#dateisystem.liesText(PFAD);
    if (text !== undefined && (text.length < 2 || text.length > MAX_BYTES)) {
      throw new Error("BANK_LEASE_NODE_PERSISTENZ_GROESSE_UNGUELTIG");
    }
    return text;
  }

  async schreibeDurable(inhalt, tempKennung) {
    if (typeof inhalt !== "string"
        || inhalt.length < 2
        || inhalt.length > MAX_BYTES) {
      throw new Error("BANK_LEASE_NODE_PERSISTENZ_INHALT_UNGUELTIG");
    }
    if (typeof tempKennung !== "string"
        || tempKennung.trim().length === 0
        || tempKennung.length > 120) {
      throw new Error("BANK_LEASE_NODE_PERSISTENZ_TEMP_ID_UNGUELTIG");
    }
    await this.#dateisystem.schreibeAtomarDurable(
      PFAD,
      inhalt,
      tempKennung,
    );
  }

  pfad() {
    return PFAD;
  }
}

export const BANK_LEASE_NODE_PERSISTENZ_PFAD = PFAD;
