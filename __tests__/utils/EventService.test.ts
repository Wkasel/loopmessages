import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { EventService } from '../../src/utils/EventService';

describe('EventService', () => {
  class TestEventService extends EventService {
    // Public method to expose protected emitEvent for testing
    public testEmitEvent(event: string, data?: unknown): void {
      this.emitEvent(event, data);
    }

    // Public method to expose protected emitError for testing
    public testEmitError(error: Error): void {
      this.emitError(error);
    }
  }

  let eventService: TestEventService;

  beforeEach(() => {
    eventService = new TestEventService('info');
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

    test('should emit events with emitEvent method', () => {
      // Create a listener
      const listener = jest.fn();
      eventService.on('test-event', listener);

      // Mock the logger debug method
      const debugSpy = jest.spyOn(eventService['logger'], 'debug');

      // Emit the event
      eventService.testEmitEvent('test-event', { data: 'test-data' });

      // Check that the listener was called with the right data
      expect(listener).toHaveBeenCalledWith({ data: 'test-data' });
      // Check that the logger was called
      expect(debugSpy).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    test('should emit error events with emitError method', () => {
      // Create a listener for error events
      const errorListener = jest.fn();
      eventService.on('error', errorListener);

      // Mock the logger error method
      const errorSpy = jest.spyOn(eventService['logger'], 'error');

      // Create an error to emit
      const testError = new Error('Test error');

      // Emit the error
      eventService.testEmitError(testError);

      // Check that the error listener was called with the right data
      expect(errorListener).toHaveBeenCalledWith(testError);
      // Check that the logger was called
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('log level settings', () => {
    test('should set log level', () => {
      // Mock the logger setLevel method
      const setLevelSpy = jest.spyOn(eventService['logger'], 'setLevel');

      // Set the log level
      eventService.setLogLevel('debug');

      // Check that the logger setLevel was called with the right level
      expect(setLevelSpy).toHaveBeenCalledWith('debug');
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
});
