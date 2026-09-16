export class InvalidWorldObservationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidWorldObservationError';
  }
}
