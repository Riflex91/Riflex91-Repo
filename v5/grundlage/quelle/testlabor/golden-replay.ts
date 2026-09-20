import {
  serialisiereReplaySnapshot,
  validiereReplaySnapshot,
} from "./replay-format.js";
import type { ReplaySnapshot } from "./replay-aufzeichnung.js";

export interface GoldenReplayErgebnis {
  readonly stimmtUeberein: boolean;
  readonly erwartetZeichen: number;
  readonly istZeichen: number;
}

export function pruefeGoldenReplay(
  snapshot: ReplaySnapshot,
  goldenKanonischesJson: string,
): GoldenReplayErgebnis {
  validiereReplaySnapshot(snapshot);
  if (goldenKanonischesJson.trim().length === 0
      || goldenKanonischesJson.length > 100_000_000) {
    throw new Error("GOLDEN_REPLAY_FIXTURE_UNGUELTIG");
  }
  const ist = serialisiereReplaySnapshot(snapshot);
  return Object.freeze({
    stimmtUeberein: ist === goldenKanonischesJson,
    erwartetZeichen: goldenKanonischesJson.length,
    istZeichen: ist.length,
  });
}
