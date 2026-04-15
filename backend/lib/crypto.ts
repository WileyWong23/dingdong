/**
 * crypto.ts — ID generation and utility functions.
 */

import { randomUUID } from 'crypto';

/** Generate a UUID v4 string. */
export function generateId(): string {
  return randomUUID();
}

/** Return current UTC timestamp in milliseconds. */
export function now(): number {
  return Date.now();
}
