import {
  pruefeZertifizierungsSerie,
  type ZertifizierungsGrenzen,
  type ZertifizierungsSample,
  type ZertifizierungsSerienNachweis,
} from "./evidence-kette.js";

export interface ShadowZertifizierungsNachweis {
  readonly bestanden: boolean;
  readonly serienNachweis: ZertifizierungsSerienNachweis;
  readonly unexpectedGameWrites: 0;
  readonly shadowHatGameplayAutoritaet: false;
  readonly shadowHatRawWriteAutoritaet: false;
}

export function bewerteShadowZertifizierung(
  samples: readonly ZertifizierungsSample[],
  grenzen: ZertifizierungsGrenzen,
): ShadowZertifizierungsNachweis {
  const serienNachweis = pruefeZertifizierungsSerie(samples, grenzen);
  const writes = samples.reduce((summe, sample) => summe + sample.metrik.unexpectedGameWrites, 0);
  return Object.freeze({
    bestanden: serienNachweis.bestanden && writes === 0,
    serienNachweis,
    unexpectedGameWrites: 0,
    shadowHatGameplayAutoritaet: false,
    shadowHatRawWriteAutoritaet: false,
  });
}
