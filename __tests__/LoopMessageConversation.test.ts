import { jest } from '@jest/globals';
import { LoopMessageConversationService, CONVERSATION_EVENTS } from '../src/LoopMessageConversation';
import { LoopMessageService } from '../src/services/LoopMessageService';
import { MessageStatusChecker } from '../src/services/LoopMessageStatus';
import { WebhookHandler } from '../src/services/LoopMessageWebhooks';
import { LoopMessageError } from '../src/errors/LoopMessageError';
import type {
  ConversationServiceConfig,
  ConversationSendOptions,
} from '../src/LoopMessageConversation';

// Mock the dependencies
jest.mock('../src/services/LoopMessageService.js', () => ({
  LoopMessageService: jest.fn().mockImplementation(() => ({
    sendLoopMessage: jest.fn(),
    sendLoopAuthRequest: jest.fn(),
    sendAudioMessage: jest.fn(),
    sendReaction: jest.fn(),
    sendMessageWithEffect: jest.fn(),
    sendReply: jest.fn(),
  })),
  MESSAGE_EVENTS: {
    SEND_START: 'send_start',
    SEND_SUCCESS: 'send_success',
    SEND_ERROR: 'send_error',
  },
}));

jest.mock('../src/services/LoopMessageStatus.js', () => ({
  MessageStatusChecker: jest.fn().mockImplementation(() => ({
    checkStatus: jest.fn(),
    waitForStatus: jest.fn(),
  })),
  STATUS_EVENTS: {
    STATUS_CHANGE: 'status_change',
    STATUS_CHECK: 'status_check',
  },
}));

jest.mock('../src/services/LoopMessageWebhooks.js', () => ({
  WebhookHandler: jest.fn().mockImplementation(() => ({
    parseWebhook: jest.fn(),
    emit: jest.fn(),
    on: jest.fn(),
  })),
  WEBHOOK_EVENTS: {
    WEBHOOK_RECEIVED: 'webhook_received',
  },
}));

describe('LoopMessageConversationService', () => {
  let service: LoopMessageConversationService;
  let mockMessageService: jest.Mocked<LoopMessageService>;
  let mockStatusChecker: jest.Mocked<MessageStatusChecker>;
  let mockWebhookHandler: jest.Mocked<WebhookHandler>;

  const defaultConfig: ConversationServiceConfig = {
    loopAuthKey: 'test-auth-key',
    loopSecretKey: 'test-secret-key',
    senderName: 'test@sender.com',
    webhookAuthToken: 'test-webhook-token',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Create service instance
    service = new LoopMessageConversationService(defaultConfig);

    // Get the mocked instances
    mockMessageService = (service as any).messageService;
    mockStatusChecker = (service as any).statusChecker;
    mockWebhookHandler = (service as any).webhookHandler;
  });

  afterEach(() => {
    // Clean up any running timers/intervals
    if (service) {
      service.clearConversations();
      // Clear any message status tracking timers
      const statusTracking = (service as any).messageStatusTracking;
      if (statusTracking) {
        statusTracking.forEach((interval: any) => {
          if (typeof interval === 'number') {
            clearInterval(interval);
          }
        });
        statusTracking.clear();
      }
    }
  });

  describe('constructor', () => {
    it('should initialize with provided config', () => {
      // Just test that the service was created successfully
      expect(service).toBeDefined();
      expect(service.getConversations).toBeDefined();
    });
  });

  describe('sendMessage', () => {
    const mockSendResponse = {
      message_id: 'test-message-id',
      success: true,
      recipient: '+1234567890',
      text: 'Test message',
      group: undefined,
    };

    beforeEach(() => {
      mockMessageService.sendLoopMessage = jest.fn().mockResolvedValue(mockSendResponse);
    });

    it('should send a message successfully', async () => {
      const params = {
        recipient: '+1234567890',
        text: 'Test message',
      };

      const result = await service.sendMessage(params);

      expect(mockMessageService.sendLoopMessage).toHaveBeenCalledWith(params);
      expect(result).toEqual({
        messageId: 'test-message-id',
        success: true,
        recipient: '+1234567890',
        text: 'Test message',
        group: undefined,
      });
    });

    it('should track message status when trackStatus option is true', async () => {
      const params = {
        recipient: '+1234567890',
        text: 'Test message',
      };
      const options: ConversationSendOptions = {
        trackStatus: true,
      };

      await service.sendMessage(params, options);

      // Verify the message is added to a thread
      const thread = service.getConversation('+1234567890');
      expect(thread).toBeDefined();
      expect(thread?.messages).toHaveLength(1);
      expect(thread?.messages[0]).toMatchObject({
        messageId: 'test-message-id',
        direction: 'outbound',
        text: 'Test message',
        status: 'scheduled',
      });
    });

    it('should wait for delivery when waitForDelivery option is true', async () => {
      const mockStatusResponse = {
        status: 'sent' as const,
        recipient: '+1234567890',
        error_code: undefined,
      };

      mockStatusChecker.waitForStatus = jest.fn().mockResolvedValue(mockStatusResponse);

      const params = {
        recipient: '+1234567890',
        text: 'Test message',
      };
      const options: ConversationSendOptions = {
        waitForDelivery: true,
      };

      const result = await service.sendMessage(params, options);

      expect(mockStatusChecker.waitForStatus).toHaveBeenCalledWith(
        'test-message-id',
        ['sent', 'failed', 'timeout'],
        expect.objectContaining({
          maxAttempts: 10,
          delayMs: 2000,
        })
      );

      expect(result).toMatchObject({
        messageId: 'test-message-id',
        success: true,
        status: 'sent',
      });
    });

    it('should handle errors gracefully', async () => {
      // Add error listener to prevent unhandled error
      service.on('error', () => {});
      
      const error = new LoopMessageError({
        message: 'Failed to send',
        code: 400,
        cause: 'Bad request',
      });

      mockMessageService.sendLoopMessage = jest.fn().mockRejectedValue(error);

      const params = {
        recipient: '+1234567890',
        text: 'Test message',
      };

      const result = await service.sendMessage(params);

      expect(result).toMatchObject({
        messageId: '',
        success: false,
        text: 'Test message',
        errorCode: 400,
        errorMessage: 'Failed to send',
      });
    });
  });

  describe('conversation management', () => {
    it('should get all conversations', () => {
      // Start with empty conversations
      const conversations = service.getConversations();
      expect(conversations).toHaveLength(0);
    });

    it('should get a specific conversation', async () => {
      mockMessageService.sendLoopMessage = jest.fn().mockResolvedValue({
        message_id: 'msg-1',
        success: true,
        recipient: '+1234567890',
        text: 'Test message',
      });

      await service.sendMessage({ recipient: '+1234567890', text: 'Test message' });

      const thread = service.getConversation('+1234567890');
      expect(thread).toBeDefined();
      expect(thread?.recipient).toBe('+1234567890');
      expect(thread?.messages).toHaveLength(1);
    });

    it('should clear conversations', async () => {
      mockMessageService.sendLoopMessage = jest.fn().mockResolvedValue({
        message_id: 'msg-1',
        success: true,
        recipient: '+1234567890',
        text: 'Test message',
      });

      await service.sendMessage({ recipient: '+1234567890', text: 'Test message' });
      expect(service.getConversations()).toHaveLength(1);

      service.clearConversations();
      expect(service.getConversations()).toHaveLength(0);
    });
  });

  describe('webhook handling', () => {
    it('should return webhook middleware', () => {
      const middleware = service.getWebhookMiddleware();
      expect(typeof middleware).toBe('function');
    });

    it('should throw error when webhooks not initialized', () => {
      const serviceWithoutWebhook = new LoopMessageConversationService({
        ...defaultConfig,
        webhookAuthToken: undefined,
      });

      expect(() => serviceWithoutWebhook.getWebhookMiddleware()).toThrow(
        'Webhooks not initialized'
      );
    });
  });

  describe('event handling', () => {
    it('should emit MESSAGE_SENT event when sending a message', async () => {
      mockMessageService.sendLoopMessage = jest.fn().mockResolvedValue({
        message_id: 'test-id',
        success: true,
        recipient: '+1234567890',
        text: 'Test',
      });

      const listener = jest.fn();
      service.on(CONVERSATION_EVENTS.MESSAGE_SENT, listener);

      await service.sendMessage({ recipient: '+1234567890', text: 'Test' });

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          threadKey: '+1234567890',
          message: expect.objectContaining({
            messageId: 'test-id',
            text: 'Test',
          }),
        })
      );
    });

    it('should emit ERROR event on failure', async () => {
      const error = new Error('Test error');
      mockMessageService.sendLoopMessage = jest.fn().mockRejectedValue(error);

      const listener = jest.fn();
      service.on(CONVERSATION_EVENTS.ERROR, listener);

      await service.sendMessage({ recipient: '+1234567890', text: 'Test' });

      expect(listener).toHaveBeenCalledWith(error);
    });
  });

  describe('helper methods', () => {
    beforeEach(() => {
      mockMessageService.sendLoopMessage = jest.fn().mockResolvedValue({
        message_id: 'test-id',
        success: true,
        recipient: '+1234567890',
        text: 'Test',
      });
    });

    it('should send message with effect', async () => {
      await service.sendMessageWithEffect({
        recipient: '+1234567890',
        text: 'Test',
        effect: 'confetti',
      });

      expect(mockMessageService.sendLoopMessage).toHaveBeenCalledWith({
        recipient: '+1234567890',
        text: 'Test',
        effect: 'confetti',
      });
    });

    it('should send audio message', async () => {
      await service.sendAudioMessage({
        recipient: '+1234567890',
        text: 'Audio message',
        media_url: 'https://example.com/audio.mp3',
        audio_message: true,
      });

      expect(mockMessageService.sendLoopMessage).toHaveBeenCalledWith({
        recipient: '+1234567890',
        text: 'Audio message',
        media_url: 'https://example.com/audio.mp3',
        audio_message: true,
      });
    });

    it('should send reaction', async () => {
      await service.sendReaction({
        recipient: '+1234567890',
        text: '',
        message_id: 'original-message-id',
        reaction: 'heart',
      });

      expect(mockMessageService.sendLoopMessage).toHaveBeenCalledWith({
        recipient: '+1234567890',
        text: '',
        message_id: 'original-message-id',
        reaction: 'heart',
      });
    });

    it('should send reply', async () => {
      await service.sendReply({
        recipient: '+1234567890',
        text: 'This is a reply',
        reply_to_id: 'original-message-id',
      });

      expect(mockMessageService.sendLoopMessage).toHaveBeenCalledWith({
        recipient: '+1234567890',
        text: 'This is a reply',
        reply_to_id: 'original-message-id',
      });
    });
  });

  describe('auth and status methods', () => {
    it('should initiate auth request', async () => {
      mockMessageService.sendLoopAuthRequest = jest.fn().mockResolvedValue({
        request_id: 'auth-request-id',
        imessage_link: 'imessage://...',
      });

      const result = await service.initiateAuthRequest('test-passthrough');

      expect(mockMessageService.sendLoopAuthRequest).toHaveBeenCalledWith('test-passthrough');
      expect(result).toMatchObject({
        request_id: 'auth-request-id',
      });
    });

    it('should check message status', async () => {
      mockStatusChecker.checkStatus = jest.fn().mockResolvedValue({
        status: 'sent',
        recipient: '+1234567890',
      });

      const result = await service.checkMessageStatus('test-message-id');

      expect(mockStatusChecker.checkStatus).toHaveBeenCalledWith('test-message-id');
      expect(result).toMatchObject({
        status: 'sent',
      });
    });

    it('should wait for status', async () => {
      mockStatusChecker.waitForStatus = jest.fn().mockResolvedValue({
        status: 'sent',
        recipient: '+1234567890',
      });

      const result = await service.waitForStatus('test-message-id', 'sent', {
        maxAttempts: 5,
        delayMs: 1000,
      });

      expect(mockStatusChecker.waitForStatus).toHaveBeenCalledWith('test-message-id', 'sent', {
        maxAttempts: 5,
        delayMs: 1000,
      });
      expect(result).toMatchObject({
        status: 'sent',
      });
    });
  });
});
