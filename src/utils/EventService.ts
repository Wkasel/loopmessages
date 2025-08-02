/**
 * Base EventService class for event-emitting services
 */
import { EventEmitter } from 'events';

/**
 * Base class for services that emit events
 * Extends EventEmitter for consistent event handling
 */
export class EventService extends EventEmitter {
  /**
   * Create a new EventService
   */
  constructor() {
    super();
  }
}
