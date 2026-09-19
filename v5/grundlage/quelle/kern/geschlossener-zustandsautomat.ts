export interface ZustandsUebergang<Zustand extends string> {
  readonly von: Zustand;
  readonly nach: Zustand;
}

export interface ZustandsautomatenDefinition<Zustand extends string> {
  readonly kennung: string;
  readonly start: Zustand;
  readonly zustaende: readonly Zustand[];
  readonly uebergaenge: readonly ZustandsUebergang<Zustand>[];
  readonly terminal: readonly Zustand[];
}

function pruefeDefinition<Zustand extends string>(
  definition: ZustandsautomatenDefinition<Zustand>,
): void {
  if (definition.kennung.trim().length === 0) throw new Error("AUTOMAT_KENNUNG_FEHLT");
  if (definition.zustaende.length === 0) throw new Error("AUTOMAT_OHNE_ZUSTAENDE");
  if (!definition.zustaende.includes(definition.start)) throw new Error("AUTOMAT_START_UNBEKANNT");

  const zustaende = [...definition.zustaende].sort();
  for (let index = 1; index < zustaende.length; index += 1) {
    if (zustaende[index] === zustaende[index - 1]) throw new Error("AUTOMAT_DOPPELTER_ZUSTAND");
  }

  for (const terminal of definition.terminal) {
    if (!definition.zustaende.includes(terminal)) throw new Error("AUTOMAT_TERMINAL_UNBEKANNT");
  }

  const kanten = definition.uebergaenge
    .map(uebergang => `${uebergang.von}->${uebergang.nach}`)
    .sort();
  for (let index = 1; index < kanten.length; index += 1) {
    if (kanten[index] === kanten[index - 1]) throw new Error("AUTOMAT_DOPPELTE_KANTE");
  }

  for (const uebergang of definition.uebergaenge) {
    if (!definition.zustaende.includes(uebergang.von)
        || !definition.zustaende.includes(uebergang.nach)) {
      throw new Error("AUTOMAT_KANTE_MIT_UNBEKANNTEM_ZUSTAND");
    }
  }
}

export class GeschlossenerZustandsautomat<Zustand extends string> {
  readonly #definition: ZustandsautomatenDefinition<Zustand>;
  #zustand: Zustand;

  public constructor(definition: ZustandsautomatenDefinition<Zustand>) {
    pruefeDefinition(definition);
    this.#definition = Object.freeze({
      ...definition,
      zustaende: Object.freeze([...definition.zustaende]),
      uebergaenge: Object.freeze(definition.uebergaenge.map(kante => Object.freeze({ ...kante }))),
      terminal: Object.freeze([...definition.terminal]),
    });
    this.#zustand = definition.start;
  }

  public aktuell(): Zustand {
    return this.#zustand;
  }

  public istTerminal(): boolean {
    return this.#definition.terminal.includes(this.#zustand);
  }

  public darfWechseln(nach: Zustand): boolean {
    return this.#definition.uebergaenge.some(
      kante => kante.von === this.#zustand && kante.nach === nach,
    );
  }

  public wechsle(nach: Zustand): Zustand {
    if (!this.#definition.zustaende.includes(nach)) {
      throw new Error("UNBEKANNTER_ZIELZUSTAND");
    }
    if (!this.darfWechseln(nach)) {
      throw new Error(`UNDEKLARIERTER_UEBERGANG:${this.#zustand}->${nach}`);
    }
    this.#zustand = nach;
    return this.#zustand;
  }
}
