import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { EventService } from '../../src/utils/EventService.js';

describe('EventService', () => {
  class TestEventService extends EventService {
    // Simple test implementation
    constructor() {
      super();
    }

    // Public method to test event emission
    public testEmit(event: string, data?: unknown): void {
      this.emit(event, data);
    }
  }

  let eventService: TestEventService;

  beforeEach(() => {
    eventService = new TestEventService();
  });

  describe('event emission', () => {
    test('should emit events with standard emit method', () => {
      // Create a listener
      const listener = jest.fn();
      eventService.on('test-event', listener);

      // Emit the event
      eventService.emit('test-event', { data: 'test-data' });

      // Check that the listener was called with the right data
      expect(listener).toHaveBeenCalledWith({ data: 'test-data' });
    });

    test('should emit events through public test method', () => {
      // Create a listener
      const listener = jest.fn();
      eventService.on('test-event', listener);

      // Emit the event
      eventService.testEmit('test-event', { data: 'test-data' });

      // Check that the listener was called with the right data
      expect(listener).toHaveBeenCalledWith({ data: 'test-data' });
    });
  });

  describe('error handling', () => {
    test('should emit error events', () => {
      // Create a listener for error events
      const errorListener = jest.fn();
      eventService.on('error', errorListener);

      // Create an error to emit
      const testError = new Error('Test error');

      // Emit the error
      eventService.emit('error', testError);

      // Check that the error listener was called with the right data
      expect(errorListener).toHaveBeenCalledWith(testError);
    });
  });

  describe('listener management', () => {
    test('should add and remove listeners', () => {
      // Create a listener
      const listener = jest.fn();

      // Add the listener
      eventService.on('test-event', listener);

      // Emit the event to verify it works
      eventService.emit('test-event', { test: true });
      expect(listener).toHaveBeenCalledTimes(1);

      // Remove the listener
      eventService.removeListener('test-event', listener);

      // Emit again and verify the listener is no longer called
      eventService.emit('test-event', { test: true });
      expect(listener).toHaveBeenCalledTimes(1); // Still only called once
    });

    test('should support once listeners', () => {
      // Create a listener
      const listener = jest.fn();

      // Add the listener with once
      eventService.once('test-event', listener);

      // Emit the event twice
      eventService.emit('test-event', { test: true });
      eventService.emit('test-event', { test: true });

      // Verify the listener was only called once
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('inheritance', () => {
    test('should work as base class for other services', () => {
      // Create a spy to monitor event emission
      const emitSpy = jest.spyOn(eventService, 'emit');

      // Test that the EventService can be extended and used
      eventService.testEmit('custom-event', { custom: 'data' });

      expect(emitSpy).toHaveBeenCalledWith('custom-event', { custom: 'data' });
    });
  });
});