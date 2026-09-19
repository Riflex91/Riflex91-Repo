export interface UhrPort {
  jetztMs(): number;
}

export interface ZufallsPort {
  zufall01(): number;
}

export interface KennungsPort {
  naechsteId(art?: string): string;
}

export interface SequenzPort {
  naechsteSequenz(): number;
}
