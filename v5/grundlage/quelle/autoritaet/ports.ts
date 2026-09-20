export interface PortVertragsReferenz {
  readonly portId: string;
  readonly vertragsVersion: string;
}

export interface TypisierterPort<Anfrage, Antwort> extends PortVertragsReferenz {
  readonly schemaVersion: 1;
  bearbeite(anfrage: Anfrage): Promise<Antwort> | Antwort;
}

export function gleicherPortVertrag(
  links: PortVertragsReferenz,
  rechts: PortVertragsReferenz,
): boolean {
  return links.portId === rechts.portId
    && links.vertragsVersion === rechts.vertragsVersion;
}
