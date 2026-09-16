export interface ActionResult<TData = unknown> {
  readonly intentId: string;
  readonly traceId: string;
  readonly ok: boolean;
  readonly reason: string;
  readonly startedAt: number;
  readonly finishedAt: number;
  readonly data?: TData;
}
