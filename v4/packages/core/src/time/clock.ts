export interface Clock {
  now(): number;
}

export class SystemClock implements Clock {
  now(): number {
    return Date.now();
  }
}

export class ManualClock implements Clock {
  private currentTime: number;

  constructor(initialTime = 0) {
    this.currentTime = assertFiniteTime(initialTime);
  }

  now(): number {
    return this.currentTime;
  }

  set(time: number): void {
    this.currentTime = assertFiniteTime(time);
  }

  advance(milliseconds: number): number {
    if (!Number.isFinite(milliseconds)) {
      throw new TypeError('milliseconds must be finite');
    }
    this.currentTime = assertFiniteTime(this.currentTime + milliseconds);
    return this.currentTime;
  }
}

function assertFiniteTime(value: number): number {
  if (!Number.isFinite(value)) {
    throw new TypeError('clock time must be finite');
  }
  return value;
}
