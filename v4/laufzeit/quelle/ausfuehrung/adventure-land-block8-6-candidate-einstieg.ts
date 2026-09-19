import {
  installiereAdventureLandProduktionsLaufzeit,
  type AdventureLandProduktionsLaufzeitApi,
  type AdventureLandProduktionsLaufzeitKonfiguration
} from './adventure-land-produktions-einstieg.js';
import {
  installiereAdventureLandCapabilityFreigabe
} from './adventure-land-capability-freigabe.js';
import type {
  CapabilityFreigabeApi,
  CapabilityFreigabeOptionen
} from '../vertraege/capability-freigabe.js';
import type { AdventureLandGruppenKommunikationsFenster } from './adventure-land-gruppen-lebensnachweis-austausch.js';

export const BLOCK86_RUNTIME_CANDIDATE_VERSION = '1.0.0' as const;
export const BLOCK86_RUNTIME_CANDIDATE_GLOBALER_NAME = 'V4Block86Candidate';

export interface AdventureLandBlock86CandidateApi {
  readonly version: typeof BLOCK86_RUNTIME_CANDIDATE_VERSION;
  readonly produktionsRuntime: AdventureLandProduktionsLaufzeitApi;
  readonly capabilityRuntime: CapabilityFreigabeApi;
  readonly spielAutoritaet: false;
  readonly neustartAutoritaet: false;
}

function eigenerWert(ziel: object, name: string): unknown {
  try {
    return Object.prototype.hasOwnProperty.call(ziel, name) ? Reflect.get(ziel, name) : undefined;
  } catch {
    return undefined;
  }
}

export function installiereAdventureLandBlock86Candidate(
  codeKontext: AdventureLandGruppenKommunikationsFenster & object,
  runtimeKonfiguration: Readonly<AdventureLandProduktionsLaufzeitKonfiguration>,
  capabilityKonfiguration: Readonly<CapabilityFreigabeOptionen>
): AdventureLandBlock86CandidateApi {
  if (eigenerWert(codeKontext, BLOCK86_RUNTIME_CANDIDATE_GLOBALER_NAME) !== undefined) {
    throw new Error(`${BLOCK86_RUNTIME_CANDIDATE_GLOBALER_NAME} ist im Codekontext bereits vorhanden.`);
  }

  const produktionsRuntime = installiereAdventureLandProduktionsLaufzeit(
    codeKontext,
    runtimeKonfiguration
  );
  const capabilityRuntime = installiereAdventureLandCapabilityFreigabe(
    codeKontext,
    produktionsRuntime,
    capabilityKonfiguration
  );

  const api: AdventureLandBlock86CandidateApi = Object.freeze({
    version: BLOCK86_RUNTIME_CANDIDATE_VERSION,
    produktionsRuntime,
    capabilityRuntime,
    spielAutoritaet: false as const,
    neustartAutoritaet: false as const
  });

  const installiert = Reflect.defineProperty(
    codeKontext,
    BLOCK86_RUNTIME_CANDIDATE_GLOBALER_NAME,
    {
      configurable: true,
      enumerable: true,
      writable: false,
      value: api
    }
  );
  if (!installiert) {
    throw new Error('V4Block86Candidate konnte nicht im Adventure-Land-Codekontext installiert werden.');
  }
  return api;
}
