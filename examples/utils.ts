/**
 * Loop Messages SDK - Shared Example Utilities
 *
 * This file contains shared utility functions for all examples.
 */
import { LoopMessageError } from '../src/errors/LoopMessageError';

/**
 * Handle errors consistently across examples
 */
export function handleError(error: any): void {
  if (error instanceof LoopMessageError) {
    console.error(`Error (${error.code}): ${error.message}`);
    if (error.cause) console.error(`Cause: ${error.cause}`);
  } else {
    console.error(`Unexpected error: ${error}`);
  }
}
