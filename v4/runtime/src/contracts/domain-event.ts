export interface DomainEvent<TPayload = unknown> {
  readonly id: string;
  readonly sequence: number;
  readonly timestamp: number;
  readonly type: string;
  readonly source: string;
  readonly traceId: string;
  readonly payload: TPayload;
}
