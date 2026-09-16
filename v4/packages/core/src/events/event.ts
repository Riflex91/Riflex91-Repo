export type EventSeverity = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface EventInput<Payload = unknown> {
  readonly component: string;
  readonly type: string;
  readonly severity?: EventSeverity;
  readonly actorId?: string;
  readonly taskId?: string;
  readonly reason?: string;
  readonly payload?: Payload;
}

export interface EventRecord<Payload = unknown> {
  readonly sequence: number;
  readonly occurredAt: number;
  readonly runId: string;
  readonly component: string;
  readonly type: string;
  readonly severity: EventSeverity;
  readonly actorId?: string;
  readonly taskId?: string;
  readonly reason?: string;
  readonly payload: Payload;
}

export interface EventSink {
  write(event: EventRecord): void;
}

export interface EventWriter {
  append(input: EventInput): EventRecord;
}
