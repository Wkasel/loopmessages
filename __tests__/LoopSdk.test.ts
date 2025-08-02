import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { LoopSdk } from '../src/LoopSdk';

// Mock all dependencies
jest.mock('../src/services/LoopMessageService.js');
jest.mock('../src/services/LoopMessageStatus.js');
jest.mock('../src/services/LoopMessageWebhooks.js');
jest.mock('../src/LoopMessageConversation.js');

describe('LoopSdk', () => {
  const testConfig = {
    loopAuthKey: 'test-auth-key',
    loopSecretKey: 'test-secret-key',
    loopAuthSecretKey: 'test-auth-secret-key',
    senderName: 'test-sender@example.com',
    logLevel: 'info' as const,
    webhook: {
      secretKey: 'test-webhook-secret',
      path: '/webhook',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    test('should create SDK instance with all services', () => {
      const sdk = new LoopSdk(testConfig);
      
      // Check that SDK instance has all expected properties
      expect(sdk).toBeDefined();
      expect(sdk.sendMessage).toBeDefined();
      expect(sdk.sendAudioMessage).toBeDefined();
      expect(sdk.sendMessageWithEffect).toBeDefined();
      expect(sdk.sendReaction).toBeDefined();
      expect(sdk.sendReply).toBeDefined();
      expect(sdk.checkMessageStatus).toBeDefined();
      expect(sdk.waitForMessageStatus).toBeDefined();
      expect(sdk.parseWebhook).toBeDefined();
    });

    test('should create SDK without webhook when webhook config is not provided', () => {
      const configWithoutWebhook = {
        loopAuthKey: 'test-auth-key',
        loopSecretKey: 'test-secret-key',
        senderName: 'test-sender@example.com',
      };

      const sdk = new LoopSdk(configWithoutWebhook);
      
      // Should still have all methods
      expect(sdk).toBeDefined();
      expect(sdk.sendMessage).toBeDefined();
      expect(sdk.checkMessageStatus).toBeDefined();
    });

    test('should create SDK with conversation service when enabled', () => {
      const configWithConversations = {
        ...testConfig,
        enableConversations: true,
      };

      const sdk = new LoopSdk(configWithConversations);
      
      // Check that conversation methods are available
      expect(sdk.getConversationService()).toBeDefined();
    });
  });

  describe('message sending methods', () => {
    let sdk: LoopSdk;

    beforeEach(() => {
      sdk = new LoopSdk(testConfig);
    });

    test('sendMessage should delegate to messageService', async () => {
      const mockResponse = { message_id: 'test-id', success: true };
      
      // Access the private messageService for mocking (using type assertion)
      const messageService = (sdk as any).messageService;
      messageService.sendLoopMessage = jest.fn().mockResolvedValue(mockResponse);

      const params = { recipient: '+1234567890', text: 'Test message' };
      const result = await sdk.sendMessage(params);

      expect(messageService.sendLoopMessage).toHaveBeenCalledWith(params);
      expect(result).toEqual(mockResponse);
    });

    test('sendAudioMessage should delegate to messageService', async () => {
      const mockResponse = { message_id: 'test-id', success: true };
      
      const messageService = (sdk as any).messageService;
      messageService.sendAudioMessage = jest.fn().mockResolvedValue(mockResponse);

      const params = { 
        recipient: '+1234567890', 
        text: 'Audio message',
        media_url: 'https://example.com/audio.mp3'
      };
      const result = await sdk.sendAudioMessage(params);

      expect(messageService.sendAudioMessage).toHaveBeenCalledWith(params);
      expect(result).toEqual(mockResponse);
    });

    test('sendMessageWithEffect should delegate to messageService', async () => {
      const mockResponse = { message_id: 'test-id', success: true };
      
      const messageService = (sdk as any).messageService;
      messageService.sendMessageWithEffect = jest.fn().mockResolvedValue(mockResponse);

      const params = { 
        recipient: '+1234567890', 
        text: 'Test message',
        effect: 'confetti' as const
      };
      const result = await sdk.sendMessageWithEffect(params);

      expect(messageService.sendMessageWithEffect).toHaveBeenCalledWith(params);
      expect(result).toEqual(mockResponse);
    });

    test('sendReaction should delegate to messageService', async () => {
      const mockResponse = { message_id: 'test-id', success: true };
      
      const messageService = (sdk as any).messageService;
      messageService.sendReaction = jest.fn().mockResolvedValue(mockResponse);

      const params = { 
        recipient: '+1234567890', 
        text: '',
        message_id: 'original-message-id',
        reaction: 'heart' as const
      };
      const result = await sdk.sendReaction(params);

      expect(messageService.sendReaction).toHaveBeenCalledWith(params);
      expect(result).toEqual(mockResponse);
    });

    test('sendReply should delegate to messageService', async () => {
      const mockResponse = { message_id: 'test-id', success: true };
      
      const messageService = (sdk as any).messageService;
      messageService.sendReply = jest.fn().mockResolvedValue(mockResponse);

      const params = { 
        recipient: '+1234567890', 
        text: 'This is a reply',
        reply_to_id: 'original-message-id'
      };
      const result = await sdk.sendReply(params);

      expect(messageService.sendReply).toHaveBeenCalledWith(params);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('status checking methods', () => {
    let sdk: LoopSdk;

    beforeEach(() => {
      sdk = new LoopSdk(testConfig);
    });

    test('checkMessageStatus should delegate to statusChecker', async () => {
      const mockResponse = { status: 'sent', recipient: '+1234567890' };
      
      const statusChecker = (sdk as any).statusChecker;
      statusChecker.checkStatus = jest.fn().mockResolvedValue(mockResponse);

      const result = await sdk.checkMessageStatus('test-message-id');

      expect(statusChecker.checkStatus).toHaveBeenCalledWith('test-message-id');
      expect(result).toEqual(mockResponse);
    });

    test('waitForMessageStatus should delegate to statusChecker', async () => {
      const mockResponse = { status: 'sent', recipient: '+1234567890' };
      
      const statusChecker = (sdk as any).statusChecker;
      statusChecker.waitForStatus = jest.fn().mockResolvedValue(mockResponse);

      const options = { maxAttempts: 5, delayMs: 1000 };
      const result = await sdk.waitForMessageStatus('test-message-id', 'sent', options);

      expect(statusChecker.waitForStatus).toHaveBeenCalledWith('test-message-id', 'sent', options);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('webhook methods', () => {
    test('parseWebhook should parse webhook when handler is configured', () => {
      const sdk = new LoopSdk(testConfig);
      const mockPayload = { alert_type: 'message_inbound', message_id: 'test-id' };
      
      const webhookHandler = (sdk as any).webhookHandler;
      webhookHandler.parseWebhook = jest.fn().mockReturnValue(mockPayload);

      const result = sdk.parseWebhook('body', 'signature');

      expect(webhookHandler.parseWebhook).toHaveBeenCalledWith('body', 'signature');
      expect(result).toEqual(mockPayload);
    });

    test('parseWebhook should throw error when webhooks are not configured', () => {
      const configWithoutWebhook = {
        loopAuthKey: 'test-auth-key',
        loopSecretKey: 'test-secret-key',
        senderName: 'test-sender@example.com',
      };

      const sdk = new LoopSdk(configWithoutWebhook);
      
      expect(() => {
        sdk.parseWebhook('body', 'signature');
      }).toThrow('Webhook handler not configured');
    });
  });

  describe('event handling', () => {
    test('should forward events from services', () => {
      const sdk = new LoopSdk(testConfig);
      const listener = jest.fn();

      sdk.on('send_success', listener);

      // Emit event from the messageService
      const messageService = (sdk as any).messageService;
      messageService.emit('send_success', { message_id: 'test-id' });

      expect(listener).toHaveBeenCalledWith({ message_id: 'test-id' });
    });
  });
});