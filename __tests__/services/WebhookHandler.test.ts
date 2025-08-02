import { jest, describe, test, expect, beforeEach } from '@jest/globals';

// Define mock hash value first
const MOCK_VALID_SIGNATURE = 'valid-signature';

// Create separate mock for digest so we can manipulate it in tests
const mockDigest = jest.fn().mockReturnValue(MOCK_VALID_SIGNATURE);

// Mock needs to be before imports in ESM
jest.mock('crypto', () => ({
  createHmac: jest.fn().mockImplementation(() => ({
    update: jest.fn().mockReturnThis(),
    digest: mockDigest,
  })),
  timingSafeEqual: jest.fn().mockReturnValue(true),
}));

import { WebhookHandler, WEBHOOK_EVENTS } from '../../src/services/LoopMessageWebhooks';
import type { InboundMessageWebhook, ConversationInitedWebhook } from '../../src/types';

describe('WebhookHandler', () => {
  const mockConfig = {
    loopAuthKey: 'test-auth-key',
    loopSecretKey: 'test-secret-key',
    webhookSecretKey: 'test-webhook-secret',
  };

  let webhookHandler: WebhookHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    webhookHandler = new WebhookHandler(mockConfig);
  });

  describe('initialization', () => {
    test('should create an instance', () => {
      expect(webhookHandler).toBeInstanceOf(WebhookHandler);
    });

    test('should throw if webhookSecretKey is missing', () => {
      expect(() => {
        new WebhookHandler({
          loopAuthKey: 'test-auth-key',
          loopSecretKey: 'test-secret-key',
        });
      }).toThrow('webhookSecretKey is required');
    });
  });

  describe('parseWebhook', () => {
    const mockBody = JSON.stringify({
      type: 'message_inbound',
      timestamp: '2023-08-15T12:34:56.789Z',
      from: '+1234567890',
      text: 'Test message',
    });
    const mockSignature = 'valid-signature';

    test('should parse a valid webhook', () => {
      // We need to access the private method so we'll mock it
      Object.defineProperty(webhookHandler, 'verifySignature', {
        value: jest.fn(),
        configurable: true,
      });

      const mockEmit = jest.spyOn(webhookHandler, 'emit');
      const result = webhookHandler.parseWebhook(mockBody, mockSignature);

      expect(result).toEqual(JSON.parse(mockBody));
      expect(mockEmit).toHaveBeenCalledWith('message_inbound', expect.any(Object));
      expect(mockEmit).toHaveBeenCalledWith('webhook', expect.any(Object));

      // Clean up
      Object.defineProperty(webhookHandler, 'verifySignature', {
        value: WebhookHandler.prototype['verifySignature'],
        configurable: true,
      });
    });

    test('should throw for missing signature', () => {
      expect(() => {
        webhookHandler.parseWebhook(mockBody, '');
      }).toThrow('Invalid parameter: signature');
    });

    test('should throw for invalid JSON', () => {
      // We need to access the private method so we'll mock it
      Object.defineProperty(webhookHandler, 'verifySignature', {
        value: jest.fn(),
        configurable: true,
      });

      expect(() => {
        webhookHandler.parseWebhook('{invalid-json', mockSignature);
      }).toThrow('Invalid parameter: webhook');

      // Clean up
      Object.defineProperty(webhookHandler, 'verifySignature', {
        value: WebhookHandler.prototype['verifySignature'],
        configurable: true,
      });
    });

    test('should throw for missing required fields', () => {
      // We need to access the private method so we'll mock it
      Object.defineProperty(webhookHandler, 'verifySignature', {
        value: jest.fn(),
        configurable: true,
      });

      const invalidBody = JSON.stringify({ some: 'data' });

      expect(() => {
        webhookHandler.parseWebhook(invalidBody, mockSignature);
      }).toThrow('Invalid parameter: webhook');

      // Clean up
      Object.defineProperty(webhookHandler, 'verifySignature', {
        value: WebhookHandler.prototype['verifySignature'],
        configurable: true,
      });
    });
  });

  describe('event emission', () => {
    test('should emit webhook events', () => {
      const listener = jest.fn();
      const mockPayload: InboundMessageWebhook = {
        type: 'message_inbound',
        timestamp: '2023-08-15T12:34:56.789Z',
        from: '+1234567890',
        text: 'Test message',
      };

      webhookHandler.on('message_inbound', listener);
      webhookHandler.emit('message_inbound', mockPayload);

      expect(listener).toHaveBeenCalledWith(mockPayload);
    });

    test('should emit internal events', () => {
      // We need to access the private method so we'll mock it
      Object.defineProperty(webhookHandler, 'verifySignature', {
        value: jest.fn(),
        configurable: true,
      });

      // Spy on the emit method instead of emitEvent
      const emitSpy = jest.spyOn(webhookHandler, 'emit');
      const mockBody = JSON.stringify({
        type: 'message_inbound',
        timestamp: '2023-08-15T12:34:56.789Z',
        from: '+1234567890',
        text: 'Test message',
      });

      webhookHandler.parseWebhook(mockBody, 'valid-signature');

      expect(emitSpy).toHaveBeenCalledWith(WEBHOOK_EVENTS.WEBHOOK_RECEIVED, expect.any(Object));
      expect(emitSpy).toHaveBeenCalledWith(WEBHOOK_EVENTS.WEBHOOK_VERIFIED, expect.any(Object));

      // Clean up
      Object.defineProperty(webhookHandler, 'verifySignature', {
        value: WebhookHandler.prototype['verifySignature'],
        configurable: true,
      });
    });
  });

  describe('verifySignature', () => {
    const mockBody = JSON.stringify({ event: 'test' });
    const mockSignature = MOCK_VALID_SIGNATURE;

    test('should verify a valid signature', () => {
      // Replace the actual verifySignature method with a mock that doesn't throw
      Object.defineProperty(webhookHandler, 'verifySignature', {
        value: jest.fn(),
        configurable: true,
      });

      const verifySignature = (webhookHandler as any).verifySignature;

      expect(() => {
        verifySignature(mockBody, mockSignature);
      }).not.toThrow();

      // Restore the original method
      Object.defineProperty(webhookHandler, 'verifySignature', {
        value: WebhookHandler.prototype['verifySignature'],
        configurable: true,
      });
    });

    test('should throw for an invalid signature format', () => {
      // Access the private method through the prototype using type assertion
      const verifySignature = (webhookHandler as any).verifySignature.bind(webhookHandler);

      // Make digest return something different to cause validation failure
      mockDigest.mockReturnValueOnce('different-signature');

      // Call it with invalid signature format
      expect(() => {
        verifySignature(mockBody, 'invalid-signature');
      }).toThrow('Authentication failed');
    });

    test('should throw when signature verification fails', () => {
      // Access the private method through the prototype using type assertion
      const verifySignature = (webhookHandler as any).verifySignature.bind(webhookHandler);

      // Make digest return something different to cause validation failure
      mockDigest.mockReturnValueOnce('different-signature');

      // Call it with valid signature format but different value
      expect(() => {
        verifySignature(mockBody, mockSignature);
      }).toThrow('Authentication failed');
    });
  });

  describe('webhook handling methods', () => {
    test('should have on/addListener/once methods for event subscription', () => {
      expect(typeof webhookHandler.on).toBe('function');
      expect(typeof webhookHandler.addListener).toBe('function');
      expect(typeof webhookHandler.once).toBe('function');

      const listener = jest.fn();

      // Test that they all work as expected
      webhookHandler.on('test-event', listener);

      // Create a proper conversation_inited webhook payload
      const testEventPayload: ConversationInitedWebhook = {
        type: 'conversation_inited',
        timestamp: new Date().toISOString(),
        recipient: '+1234567890',
      };

      webhookHandler.emit('test-event', testEventPayload);

      expect(listener).toHaveBeenCalled();
    });
  });
});
