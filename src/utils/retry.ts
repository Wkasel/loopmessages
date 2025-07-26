/**
 * Retry operation utility with exponential backoff
 */

/**
 * Options for retry operation
 */
export interface RetryOptions<E = Error> {
  /** Maximum number of retry attempts */
  maxRetries?: number;

  /** Base delay in milliseconds (will be multiplied by 2^attempt) */
  baseDelay?: number;

  /** Array of error codes or types that should not trigger a retry */
  nonRetryableErrors?: Array<number | string>;

  /** Callback for each retry attempt */
  onRetry?: (attempt: number, delay: number, error: E) => void;

  /** Custom error handler that can transform errors */
  onError?: (error: E) => never;
}

/**
 * Execute an operation with retry logic and exponential backoff
 *
 * @param operation - The async operation to execute
 * @param options - Retry configuration options
 * @returns Promise resolving to the operation result
 * @throws The last error encountered if all retries fail
 */
export async function retryWithExponentialBackoff<T, E extends Error = Error>(
  operation: () => Promise<T>,
  options: RetryOptions<E> = {}
): Promise<T> {
  const { maxRetries = 3, baseDelay = 500, nonRetryableErrors = [], onRetry, onError } = options;

  let currentRetry = 0;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      const typedError = error as E;

      // Check if we've hit max retries
      if (currentRetry >= maxRetries) {
        if (onError) {
          onError(typedError);
        }
        throw typedError;
      }

      // Check if this error should not be retried
      if (isNonRetryableError(typedError, nonRetryableErrors)) {
        if (onError) {
          onError(typedError);
        }
        throw typedError;
      }

      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, currentRetry);

      // Call the retry callback if provided
      if (onRetry) {
        onRetry(currentRetry + 1, delay, typedError);
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));

      // Increment retry counter
      currentRetry++;
    }
  }
}

/**
 * Determine if an error should not be retried based on its type or code
 *
 * @param error - The error to check
 * @param nonRetryableErrors - Array of error codes or types that should not be retried
 * @returns True if the error should not be retried
 */
function isNonRetryableError(error: Error, nonRetryableErrors: Array<number | string>): boolean {
  // Check for error code property (common in API errors)
  const errorCode = (error as any).code || (error as any).status;

  if (errorCode !== undefined) {
    return nonRetryableErrors.includes(errorCode);
  }

  // Check for error type/name
  return (
    nonRetryableErrors.includes(error.name) || nonRetryableErrors.includes(error.constructor.name)
  );
}
