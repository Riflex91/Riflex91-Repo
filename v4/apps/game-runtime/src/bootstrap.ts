export interface V4BootstrapOptions {
  readonly mode?: 'shadow' | 'active';
}

/**
 * V4 composition entrypoint placeholder.
 * Runtime assembly will be added incrementally while V3 remains the reference implementation.
 */
export function bootstrapV4(_options: V4BootstrapOptions = {}): void {
  // Intentionally empty in the architecture scaffold.
}
