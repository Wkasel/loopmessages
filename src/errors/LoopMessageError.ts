/**
 * Standardized error class for Loop API related errors
 */
export class LoopMessageError extends Error {
  /** HTTP status code or custom error code */
  code: number;

  /** Optional additional information about the error cause */
  cause?: string;

  /**
   * Create a new LoopMessageError
   *
   * @param params - Error parameters
   */
  constructor({ message, code, cause }: { message: string; code: number; cause?: string }) {
    super(message);
    this.name = 'LoopMessageError';
    this.code = code;
    this.cause = cause;

    // Set the prototype explicitly for proper instanceof behavior with transpiled code
    Object.setPrototypeOf(this, LoopMessageError.prototype);
  }

  /**
   * Create an error for authentication failures
   */
  static authError(details?: string): LoopMessageError {
    return new LoopMessageError({
      message: 'Authentication failed',
      code: 401,
      cause: details || 'Invalid API credentials',
    });
  }

  /**
   * Create an error for missing required parameters
   */
  static missingParamError(param: string): LoopMessageError {
    return new LoopMessageError({
      message: `Missing required parameter: ${param}`,
      code: 400,
      cause: 'Required parameter missing in request',
    });
  }

  /**
   * Create an error for invalid parameters
   */
  static invalidParamError(param: string, details?: string): LoopMessageError {
    return new LoopMessageError({
      message: `Invalid parameter: ${param}`,
      code: 400,
      cause: details || 'Parameter validation failed',
    });
  }

  /**
   * Create an error for resource not found
   */
  static notFoundError(resource: string): LoopMessageError {
    return new LoopMessageError({
      message: `${resource} not found`,
      code: 404,
      cause: 'The requested resource does not exist',
    });
  }

  /**
   * Create an error for rate limiting
   */
  static rateLimitError(retryAfter?: number): LoopMessageError {
    const message = retryAfter
      ? `Rate limit exceeded. Retry after ${retryAfter} seconds.`
      : 'Rate limit exceeded';

    return new LoopMessageError({
      message,
      code: 429,
      cause: 'Too many requests',
    });
  }

  /**
   * Create an error for server errors
   */
  static serverError(details?: string): LoopMessageError {
    return new LoopMessageError({
      message: 'Server error',
      code: 500,
      cause: details || 'An unexpected error occurred on the server',
    });
  }

  /**
   * Create an error for network failures
   */
  static networkError(details?: string): LoopMessageError {
    return new LoopMessageError({
      message: 'Network error',
      code: 0,
      cause: details || 'Failed to connect to the server',
    });
  }

  /**
   * Create an error for timeout
   */
  static timeoutError(details?: string): LoopMessageError {
    return new LoopMessageError({
      message: 'Request timeout',
      code: 408,
      cause: details || 'The request took too long to complete',
    });
  }
}
