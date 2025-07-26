/**
 * Logger interface for SDK logging
 */

/**
 * Available log levels
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

/**
 * Logger interface to standardize logging across the SDK
 */
export interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  setLevel(level: LogLevel): void;
}

/**
 * Default console logger implementation
 */
export class ConsoleLogger implements Logger {
  private level: LogLevel;

  /**
   * Create a new console logger
   * @param level - Initial log level
   */
  constructor(level: LogLevel = 'info') {
    this.level = level;
  }

  /**
   * Set the log level
   * @param level - New log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Log a debug message
   * @param message - Message to log
   * @param args - Additional arguments
   */
  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  /**
   * Log an info message
   * @param message - Message to log
   * @param args - Additional arguments
   */
  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  /**
   * Log a warning message
   * @param message - Message to log
   * @param args - Additional arguments
   */
  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  /**
   * Log an error message
   * @param message - Message to log
   * @param args - Additional arguments
   */
  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }

  /**
   * Check if the given level should be logged
   * @param level - Level to check
   * @returns Whether the level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    if (this.level === 'none') return false;

    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.level);
    const targetLevelIndex = levels.indexOf(level);

    return targetLevelIndex >= currentLevelIndex;
  }
}

/**
 * NoOp logger that doesn't log anything
 */
export class NoOpLogger implements Logger {
  debug(): void {}
  info(): void {}
  warn(): void {}
  error(): void {}
  setLevel(): void {}
}

/**
 * Create a logger based on the given log level
 * @param level - Log level to use
 * @returns Logger instance
 */
export function createLogger(level: LogLevel = 'info'): Logger {
  if (level === 'none') {
    return new NoOpLogger();
  }
  return new ConsoleLogger(level);
}
