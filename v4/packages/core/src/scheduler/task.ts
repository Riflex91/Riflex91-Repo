export type TaskState =
  | 'queued'
  | 'running'
  | 'waiting'
  | 'succeeded'
  | 'failed-retryable'
  | 'failed-fatal'
  | 'cancelled';

export interface TaskSnapshot {
  readonly id: string;
  readonly key: string | null;
  readonly type: string;
  readonly owner: string;
  readonly priority: number;
  readonly state: TaskState;
  readonly retries: number;
  readonly maxRetries: number;
  readonly createdAt: number;
  readonly startedAt: number | null;
  readonly updatedAt: number;
  readonly lastProgressAt: number | null;
  readonly reason: string | null;
  readonly stableWait: boolean;
  readonly waitingSince: number | null;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export type TaskStepResult =
  | {
      readonly state?: 'running';
      readonly reason?: string;
      readonly progressToken?: unknown;
    }
  | {
      readonly state: 'waiting';
      readonly reason?: string;
      readonly stable?: boolean;
      readonly progressToken?: unknown;
    }
  | {
      readonly state: 'succeeded' | 'failed-retryable' | 'failed-fatal' | 'cancelled';
      readonly reason?: string;
      readonly progressToken?: unknown;
    };

export interface TaskDefinition<Context = unknown> {
  readonly id: string;
  readonly type: string;
  readonly owner?: string;
  readonly key?: string;
  readonly priority?: number;
  readonly interruptible?: boolean;
  readonly maxRetries?: number;
  readonly stallMs?: number;
  readonly timeoutMs?: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly precondition?: (context: Context) => boolean;
  readonly step: (context: Context, task: TaskSnapshot) => TaskStepResult;
  readonly onCancel?: (reason: string) => void;
}

export interface SchedulerSnapshot {
  readonly queued: readonly TaskSnapshot[];
  readonly active: readonly TaskSnapshot[];
  readonly completed: readonly TaskSnapshot[];
}
