import { rm } from 'node:fs/promises';
await rm(new URL('../erzeugt', import.meta.url), { recursive: true, force: true });
