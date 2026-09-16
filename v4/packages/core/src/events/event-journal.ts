import type { Clock } from '../time/clock.js';
import type { EventInput, EventRecord, EventSink, EventWriter } from './event.js';
import { cloneSafe } from './sanitize.js';

export interface EventJournalOptions {
  readonly clock: Clock;
  readonly runId: string;
  readonly capacity?: number;
  readonly sink?: EventSink;
}

export interface EventQuery {
  readonly component?: string;
  readonly type?: string;
  readonly severity?: EventRecord['severity'];
  readonly actorId?: string;
  readonly taskId?: string;
  readonly reason?: string;
  readonly afterSequence?: number;
  readonly limit?: number;
}

export interface EventJournalSummary {
  readonly runId: string;
  readonly retained: number;
  readonly firstSequence: number | null;
  readonly lastSequence: number | null;
  readonly countsByType: Readonly<Record<string, number>>;
  readonly countsBySeverity: Readonly<Record<string, number>>;
  readonly countsByComponent: Readonly<Record<string, number>>;
}

export class EventJournal implements EventWriter {
  private readonly clock: Clock;
  private readonly runId: string;
  private readonly capacity: number;
  private readonly sink: EventSink | undefined;
  private readonly events: EventRecord[] = [];
  private sequence = 0;

  constructor(options: EventJournalOptions) {
    if (!options.runId.trim()) throw new TypeError('runId must not be empty');
    this.clock = options.clock;
    this.runId = options.runId;
    this.capacity = Math.max(1, Math.floor(options.capacity ?? 4000));
    this.sink = options.sink;
  }

  append(input: EventInput): EventRecord {
    if (!input.component.trim()) throw new TypeError('event component must not be empty');
    if (!input.type.trim()) throw new TypeError('event type must not be empty');

    const base: EventRecord = {
      sequence: ++this.sequence,
      occurredAt: this.clock.now(),
      runId: this.runId,
      component: input.component,
      type: input.type,
      severity: input.severity ?? 'info',
      payload: cloneSafe(input.payload ?? {}),
    };

    const event: EventRecord = {
      ...base,
      ...(input.actorId === undefined ? {} : { actorId: input.actorId }),
      ...(input.taskId === undefined ? {} : { taskId: input.taskId }),
      ...(input.reason === undefined ? {} : { reason: input.reason }),
    };

    this.events.push(event);
    if (this.events.length > this.capacity) {
      this.events.splice(0, this.events.length - this.capacity);
    }

    if (this.sink) {
      try {
        this.sink.write(copyEvent(event));
      } catch {
        // Diagnostics must never block the runtime.
      }
    }

    return copyEvent(event);
  }

  list(limit = 100): readonly EventRecord[] {
    const count = clampLimit(limit, this.events.length);
    return this.events.slice(this.events.length - count).map(copyEvent);
  }

  query(filters: EventQuery = {}): readonly EventRecord[] {
    let rows = this.events;
    if (filters.component !== undefined) rows = rows.filter((event) => event.component === filters.component);
    if (filters.type !== undefined) rows = rows.filter((event) => event.type === filters.type);
    if (filters.severity !== undefined) rows = rows.filter((event) => event.severity === filters.severity);
    if (filters.actorId !== undefined) rows = rows.filter((event) => event.actorId === filters.actorId);
    if (filters.taskId !== undefined) rows = rows.filter((event) => event.taskId === filters.taskId);
    if (filters.reason !== undefined) rows = rows.filter((event) => event.reason === filters.reason);
    if (filters.afterSequence !== undefined) rows = rows.filter((event) => event.sequence > filters.afterSequence!);

    const count = clampLimit(filters.limit ?? 100, rows.length);
    return rows.slice(rows.length - count).map(copyEvent);
  }

  replay(handler: (event: EventRecord) => void, afterSequence = 0): number {
    let replayed = 0;
    for (const event of this.events) {
      if (event.sequence <= afterSequence) continue;
      handler(copyEvent(event));
      replayed += 1;
    }
    return replayed;
  }

  summary(): EventJournalSummary {
    const countsByType: Record<string, number> = {};
    const countsBySeverity: Record<string, number> = {};
    const countsByComponent: Record<string, number> = {};

    for (const event of this.events) {
      countsByType[event.type] = (countsByType[event.type] ?? 0) + 1;
      countsBySeverity[event.severity] = (countsBySeverity[event.severity] ?? 0) + 1;
      countsByComponent[event.component] = (countsByComponent[event.component] ?? 0) + 1;
    }

    return {
      runId: this.runId,
      retained: this.events.length,
      firstSequence: this.events[0]?.sequence ?? null,
      lastSequence: this.events.at(-1)?.sequence ?? null,
      countsByType,
      countsBySeverity,
      countsByComponent,
    };
  }
}

function copyEvent(event: EventRecord): EventRecord {
  return {
    ...event,
    payload: cloneSafe(event.payload),
  };
}

function clampLimit(value: number, maximum: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(maximum, Math.floor(value)));
}
