import { promoteLiveLabStage } from "./stage-authority.mjs";

const ACTION = Object.freeze({
  SMART_MOVE: Object.freeze({ stage: "PR23", port: "smartMove", scope: "movementAuthority" }),
  MOVE: Object.freeze({ stage: "PR23", port: "move", scope: "movementAuthority" }),
  ATTACK: Object.freeze({ stage: "PR23", port: "attack", scope: "combatAuthority" }),
  USE_SKILL: Object.freeze({ stage: "PR23", port: "useSkill", scope: "skillAuthority" }),
  LOOT: Object.freeze({ stage: "PR23", port: "loot", scope: "lootAuthority" }),
  RESPAWN: Object.freeze({ stage: "PR23", port: "respawn", scope: "respawnAuthority" }),

  SEND_CM: Object.freeze({ stage: "PR22", port: "sendCm", scope: "sendCmAuthority" }),

  BUY: Object.freeze({ stage: "PR21", port: "buy", scope: "merchantAuthority", irreversible: true }),
  SELL: Object.freeze({ stage: "PR21", port: "sell", scope: "merchantAuthority", irreversible: true }),
  EXCHANGE: Object.freeze({ stage: "PR21", port: "exchange", scope: "merchantAuthority", irreversible: true }),
  UPGRADE: Object.freeze({ stage: "PR21", port: "upgrade", scope: "merchantAuthority", irreversible: true }),
  COMPOUND: Object.freeze({ stage: "PR21", port: "compound", scope: "merchantAuthority", irreversible: true }),
  CRAFT: Object.freeze({ stage: "PR21", port: "craft", scope: "merchantAuthority", irreversible: true }),
  SEND_ITEM: Object.freeze({ stage: "PR21", port: "sendItem", scope: "merchantAuthority", irreversible: true }),
  SEND_GOLD: Object.freeze({ stage: "PR21", port: "sendGold", scope: "merchantAuthority", irreversible: true }),
  BANK_STORE: Object.freeze({ stage: "PR21", port: "bankStore", scope: "merchantAuthority", irreversible: true }),
  BANK_RETRIEVE: Object.freeze({ stage: "PR21", port: "bankRetrieve", scope: "merchantAuthority", irreversible: true }),
  BANK_SWAP: Object.freeze({ stage: "PR21", port: "bankSwap", scope: "merchantAuthority", irreversible: true }),

  SERVER_HOP: Object.freeze({ stage: "PR28", port: "changeServer", scope: "serverHopAuthority", irreversible: true }),
});

function boundedText(value, label, max = 192) {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > max) {
    throw new Error("LIVE_LAB_INVALID_" + label);
  }
  return value;
}

function freezeLog(entry) {
  return Object.freeze({ ...entry });
}

export class V5LiveLabRuntimeController {
  #ports;
  #clock;
  #logs = [];
  #maxLogEntries;
  #sequence = 0;
  #intentState = new Map();

  constructor({
    ports,
    clock = () => Date.now(),
    maxLogEntries = 1000,
  } = {}) {
    if (!ports || typeof ports !== "object") {
      throw new Error("LIVE_LAB_PORTS_REQUIRED");
    }
    if (typeof clock !== "function") {
      throw new Error("LIVE_LAB_CLOCK_REQUIRED");
    }
    if (!Number.isSafeInteger(maxLogEntries) || maxLogEntries < 100 || maxLogEntries > 10000) {
      throw new Error("LIVE_LAB_LOG_BOUND_INVALID");
    }

    this.#ports = ports;
    this.#clock = clock;
    this.#maxLogEntries = maxLogEntries;
  }

  #pushLog(entry) {
    this.#logs.push(freezeLog(entry));
    if (this.#logs.length > this.#maxLogEntries) {
      this.#logs.splice(0, this.#logs.length - this.#maxLogEntries);
    }
  }

  #operationId(kind) {
    this.#sequence += 1;
    return `live-lab-${kind.toLowerCase()}-${this.#clock()}-${this.#sequence}`;
  }

  #prepareIrreversible(intent, spec) {
    if (spec.irreversible !== true) return null;

    const intentId = boundedText(intent.intentId, "INTENT_ID");
    const prior = this.#intentState.get(intentId);
    if (prior) {
      throw new Error(
        "LIVE_LAB_DUPLICATE_OR_UNKNOWN_IRREVERSIBLE_INTENT:"
        + intentId
        + ":"
        + prior.status,
      );
    }

    const record = {
      intentId,
      kind: intent.kind,
      status: "IN_FLIGHT",
      startedAtMs: this.#clock(),
    };
    this.#intentState.set(intentId, record);
    return record;
  }

  #finishIrreversible(record, status, extra = {}) {
    if (!record) return;
    this.#intentState.set(record.intentId, Object.freeze({
      ...record,
      status,
      finishedAtMs: this.#clock(),
      ...extra,
    }));
  }

  async execute(intent, {
    shadowDecision,
    safety = {},
  } = {}) {
    if (!intent || typeof intent !== "object") {
      throw new Error("LIVE_LAB_INTENT_REQUIRED");
    }
    const kind = boundedText(intent.kind, "INTENT_KIND");
    const spec = ACTION[kind];
    if (!spec) throw new Error("LIVE_LAB_INTENT_KIND_UNSUPPORTED:" + kind);

    const promotion = promoteLiveLabStage({
      stage: spec.stage,
      shadowDecision,
      safety,
    });

    if (promotion.status !== "LIVE_STAGE_ADMITTED"
        || promotion.liveExecutionAllowed !== true
        || promotion.gameplayAuthority !== true
        || promotion.normalRuntimeAllowed !== true
        || promotion[spec.scope] !== true) {
      const error = new Error(
        "LIVE_LAB_INTENT_NOT_AUTHORIZED:"
        + kind
        + ":"
        + promotion.blocker.join(","),
      );
      error.promotion = promotion;
      throw error;
    }

    const port = this.#ports[spec.port];
    if (typeof port !== "function") {
      throw new Error("LIVE_LAB_PORT_NOT_AVAILABLE:" + spec.port);
    }

    const operationId = this.#operationId(kind);
    const args = Array.isArray(intent.args) ? intent.args : [];
    const irreversible = this.#prepareIrreversible(intent, spec);

    this.#pushLog({
      atMs: this.#clock(),
      operationId,
      event: "ACTION_BEGIN",
      stage: spec.stage,
      kind,
      intentId: irreversible?.intentId ?? null,
      liveExecutionAllowed: true,
      gameplayAuthority: true,
      normalRuntimeAllowed: true,
      rawWriteAuthority: false,
    });

    try {
      const result = await port(...args);
      this.#finishIrreversible(irreversible, "COMMITTED");
      this.#pushLog({
        atMs: this.#clock(),
        operationId,
        event: "ACTION_COMMIT",
        stage: spec.stage,
        kind,
        intentId: irreversible?.intentId ?? null,
      });
      return Object.freeze({
        ok: true,
        operationId,
        stage: spec.stage,
        kind,
        result,
        authority: promotion,
      });
    } catch (error) {
      // For an irreversible public-function call we cannot assume that a thrown
      // error means nothing happened on the server. Mark UNKNOWN and never
      // automatically retry the same intent.
      this.#finishIrreversible(
        irreversible,
        irreversible ? "UNKNOWN" : "FAILED",
        { error: String(error?.message ?? error) },
      );
      this.#pushLog({
        atMs: this.#clock(),
        operationId,
        event: irreversible ? "ACTION_UNKNOWN" : "ACTION_FAILED",
        stage: spec.stage,
        kind,
        intentId: irreversible?.intentId ?? null,
        error: String(error?.message ?? error),
      });
      throw error;
    }
  }

  getIntentState(intentId) {
    boundedText(intentId, "INTENT_ID");
    return this.#intentState.get(intentId) ?? null;
  }

  exportLogs() {
    return Object.freeze(this.#logs.map((entry) => freezeLog(entry)));
  }

  status() {
    const counts = {
      inFlight: 0,
      committed: 0,
      unknown: 0,
    };
    for (const row of this.#intentState.values()) {
      if (row.status === "IN_FLIGHT") counts.inFlight += 1;
      if (row.status === "COMMITTED") counts.committed += 1;
      if (row.status === "UNKNOWN") counts.unknown += 1;
    }

    return Object.freeze({
      schemaVersion: 1,
      liveLab: true,
      liveExecutionAllowed: true,
      gameplayAuthority: true,
      normalRuntimeAllowed: true,
      rawWriteAuthority: false,
      logEntries: this.#logs.length,
      irreversibleIntents: Object.freeze(counts),
    });
  }
}

export const LIVE_LAB_ACTIONS = ACTION;
