import type {
  CharacterObservation,
  EntityObservation,
  GameDataObservation,
  PartyMemberObservation,
  WorldObjectObservation,
} from './observation.js';

export interface WorldState {
  readonly revision: number;
  readonly lastObservationSequence: number;
  readonly observedAt: number;
  readonly self: CharacterObservation;
  readonly entities: Readonly<Record<string, EntityObservation>>;
  readonly objects: Readonly<Record<string, WorldObjectObservation>>;
  readonly party: Readonly<Record<string, PartyMemberObservation>>;
  readonly gameData: GameDataObservation;
}

export type WorldStateUpdate =
  | {
      readonly accepted: true;
      readonly state: WorldState;
    }
  | {
      readonly accepted: false;
      readonly reason: 'duplicate-or-out-of-order';
      readonly state: WorldState;
    };
