/**
 * Base EventService class for event-emitting services
 */
import EventEmitter from 'events';
import { createLogger } from './Logger.js';
import type { Logger, LogLevel } from './Logger.js';

/**
 * Base class for services that emit events
 * Extends EventEmitter with additional logging and utilities
 */
export abstract class EventService extends EventEmitter {
  protected readonly logger: Logger;

  /**
   * Create a new EventService
   * @param logLevel - Optional log level for the service
   */
  constructor(logLevel: LogLevel = 'info') {
    super();
    this.logger = createLogger(logLevel);

    // Setup listeners for special 'error' events
    this.on('error', error => {
      this.logger.error('Error event emitted:', error);
    });
  }

  /**
   * Set the log level for this service
   * @param level - New log level
   */
  setLogLevel(level: LogLevel): void {
    this.logger.setLevel(level);
  }

  /**
   * Emit an event with logging
   * @param event - Event name
   * @param data - Event data
   * @returns Whether there were any listeners
   */
  protected emitEvent<T>(event: string | symbol, data: T): boolean {
    this.logger.debug(`Emitting event: ${String(event)}`);
    const result = this.emit(event, data);

    if (!result && event !== 'error') {
      this.logger.debug(`No listeners for event: ${String(event)}`);
    }

    return result;
  }

  /**
   * Emit an error event
   * @param error - Error to emit
   * @returns Whether there were any listeners
   */
  protected emitError(error: Error): boolean {
    this.logger.error('Emitting error event:', error);
    return this.emit('error', error);
  }
}
