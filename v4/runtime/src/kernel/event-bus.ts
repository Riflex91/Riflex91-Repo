import type { DomainEvent } from '../contracts/domain-event.js';

export type EventHandler = (event: DomainEvent) => void;

export interface PublishError {
  readonly handlerIndex: number;
  readonly error: unknown;
}

export interface PublishReport {
  readonly delivered: number;
  readonly errors: readonly PublishError[];
}

export class EventBus {
  private readonly handlers = new Map<string, EventHandler[]>();
  private readonly wildcardHandlers: EventHandler[] = [];
  private lastSequence = 0;

  subscribe(type: string, handler: EventHandler): () => void {
    if (type === '*') {
      this.wildcardHandlers.push(handler);
      return () => this.remove(this.wildcardHandlers, handler);
    }

    const list = this.handlers.get(type) ?? [];
    list.push(handler);
    this.handlers.set(type, list);
    return () => this.remove(list, handler);
  }

  publish(event: DomainEvent): PublishReport {
    if (!Number.isSafeInteger(event.sequence) || event.sequence <= this.lastSequence) {
      throw new Error(`Event sequence must increase monotonically: ${event.sequence} <= ${this.lastSequence}`);
    }

    this.lastSequence = event.sequence;
    const subscribers = [
      ...(this.handlers.get(event.type) ?? []),
      ...this.wildcardHandlers
    ];
    const errors: PublishError[] = [];

    subscribers.forEach((handler, handlerIndex) => {
      try {
        handler(event);
      } catch (error: unknown) {
        errors.push({ handlerIndex, error });
      }
    });

    return { delivered: subscribers.length, errors };
  }

  getLastSequence(): number {
    return this.lastSequence;
  }

  private remove(list: EventHandler[], handler: EventHandler): void {
    const index = list.indexOf(handler);
    if (index >= 0) list.splice(index, 1);
  }
}
