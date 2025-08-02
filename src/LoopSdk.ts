/**
 * Main entry point for the LoopMessage SDK
 * Provides a unified interface to all Loop API services
 */
import type { LoopSdkConfig } from './LoopCredentials.js';
import type {
  SendMessageParams,
  LoopMessageSendResponse,
  LoopMessageAuthResponse,
  MessageStatusResponse,
  WebhookPayload,
  MessageStatus,
} from './types.js';
import { LoopMessageService, MESSAGE_EVENTS } from './services/LoopMessageService.js';
import { MessageStatusChecker, STATUS_EVENTS } from './services/LoopMessageStatus.js';
import { WebhookHandler, WEBHOOK_EVENTS } from './services/LoopMessageWebhooks.js';
import { LoopMessageConversationService, CONVERSATION_EVENTS } from './LoopMessageConversation.js';
import { EventService } from './utils/eventService.js';
import type { LogLevel } from './utils/logger.js';

// Export events from services for external use
export const EVENTS = {
  ...MESSAGE_EVENTS,
  ...STATUS_EVENTS,
  ...WEBHOOK_EVENTS,
  ...CONVERSATION_EVENTS,
};

/**
 * Unified SDK for Loop API services
 */
export class LoopSdk extends EventService {
  private readonly config: LoopSdkConfig;
  private readonly messageService: LoopMessageService;
  private readonly statusChecker: MessageStatusChecker;
  private readonly webhookHandler?: WebhookHandler;
  private readonly conversationService?: LoopMessageConversationService;

  /**
   * Create a new LoopSdk instance
   *
   * @param config - Configuration for the SDK
   */
  constructor(config: LoopSdkConfig) {
    // Initialize the EventService base class
    super();

    // Store config
    this.config = config;

    // Create message service
    this.messageService = new LoopMessageService({
      loopAuthKey: config.loopAuthKey,
      loopSecretKey: config.loopSecretKey,
      loopAuthSecretKey: config.loopAuthSecretKey,
      senderName: config.senderName || '',
      baseApiUrl: config.baseApiUrl,
      loopApiAuthHost: config.loopApiAuthHost,
      logLevel: config.logLevel,
    });

    // Forward events from message service to SDK
    this.forwardServiceEvents(
      this.messageService as unknown as EventService,
      Object.values(MESSAGE_EVENTS)
    );

    // Create status checker
    this.statusChecker = new MessageStatusChecker({
      loopAuthKey: config.loopAuthKey,
      loopSecretKey: config.loopSecretKey,
      baseApiUrl: config.baseApiUrl,
      logLevel: config.logLevel,
    });

    // Forward events from status checker to SDK
    this.forwardServiceEvents(
      this.statusChecker as unknown as EventService,
      Object.values(STATUS_EVENTS)
    );

    // Create webhook handler if webhook config is provided
    if (config.webhook?.secretKey) {
      this.webhookHandler = new WebhookHandler({
        loopAuthKey: config.loopAuthKey,
        loopSecretKey: config.loopSecretKey,
        webhookSecretKey: config.webhook.secretKey,
        baseApiUrl: config.baseApiUrl,
        webhookPath: config.webhook.path,
        logLevel: config.logLevel,
      });

      // Forward events from webhook handler to SDK
      this.forwardServiceEvents(
        this.webhookHandler as unknown as EventService,
        Object.values(WEBHOOK_EVENTS)
      );
    }

    // Create conversation service if enabled
    if (config.enableConversations) {
      this.conversationService = new LoopMessageConversationService({
        loopAuthKey: config.loopAuthKey,
        loopSecretKey: config.loopSecretKey,
        loopAuthSecretKey: config.loopAuthSecretKey,
        senderName: config.senderName || '',
        webhookAuthToken: config.webhook?.secretKey,
        baseApiUrl: config.baseApiUrl,
        debug: config.logLevel === 'debug',
      });

      // Forward conversation events
      this.forwardServiceEvents(
        this.conversationService as unknown as EventService,
        Object.values(CONVERSATION_EVENTS)
      );
    }

    // this.logger.info('LoopSdk initialized successfully');
  }

  /**
   * Set the log level for all services
   *
   * @param level - New log level
   * @deprecated Log levels are no longer supported in the simplified EventService
   */
  setLogLevel(_level: LogLevel): void {
    // Log levels are no longer supported
  }

  /**
   * Forward events from a service to the SDK
   *
   * @param service - Service to forward events from
   * @param eventNames - Event names to forward
   */
  private forwardServiceEvents(service: EventService, eventNames: string[]): void {
    eventNames.forEach(eventName => {
      service.on(eventName, (data: unknown) => {
        this.emit(eventName, data);
      });
    });

    // Always forward error events
    service.on('error', (error: Error) => {
      this.emit('error', error);
    });
  }

  /**
   * Send a message via the Loop API
   *
   * @param params - Message parameters
   * @returns Promise resolving to send response
   */
  async sendMessage(
    params: Omit<SendMessageParams, 'sender_name'>
  ): Promise<LoopMessageSendResponse> {
    return this.messageService.sendLoopMessage(params);
  }

  /**
   * Send an audio message via the Loop API
   *
   * @param params - Audio message parameters
   * @returns Promise resolving to send response
   */
  async sendAudioMessage(
    params: Omit<SendMessageParams, 'sender_name' | 'audio_message'> & {
      media_url: string;
    }
  ): Promise<LoopMessageSendResponse> {
    return this.messageService.sendAudioMessage(params);
  }

  /**
   * Send a reaction to a message
   *
   * @param params - Reaction parameters
   * @returns Promise resolving to send response
   */
  async sendReaction(
    params: Omit<SendMessageParams, 'sender_name'> & {
      message_id: string;
      reaction: string;
    }
  ): Promise<LoopMessageSendResponse> {
    return this.messageService.sendReaction(params);
  }

  /**
   * Send a message with visual effect
   *
   * @param params - Message parameters with effect
   * @returns Promise resolving to send response
   */
  async sendMessageWithEffect(
    params: Omit<SendMessageParams, 'sender_name'> & { effect: string }
  ): Promise<LoopMessageSendResponse> {
    return this.messageService.sendMessageWithEffect(params);
  }

  /**
   * Send a reply to a message
   *
   * @param params - Reply parameters
   * @returns Promise resolving to send response
   */
  async sendReply(
    params: Omit<SendMessageParams, 'sender_name'> & { reply_to_id: string }
  ): Promise<LoopMessageSendResponse> {
    return this.messageService.sendReply(params);
  }

  /**
   * Initiate authentication request
   *
   * @param passthrough - Optional metadata
   * @returns Promise resolving to auth response
   */
  async initiateAuth(passthrough?: string): Promise<LoopMessageAuthResponse> {
    return this.messageService.sendLoopAuthRequest(passthrough || '');
  }

  /**
   * Check status of a message
   *
   * @param messageId - ID of the message to check
   * @returns Promise resolving to status response
   */
  async checkMessageStatus(messageId: string): Promise<MessageStatusResponse> {
    return this.statusChecker.checkStatus(messageId);
  }

  /**
   * Wait for a message to reach a specific status
   *
   * @param messageId - ID of the message to check
   * @param targetStatus - Status or statuses to wait for
   * @param options - Polling options
   * @returns Promise resolving to status response
   */
  async waitForMessageStatus(
    messageId: string,
    targetStatus: MessageStatus | MessageStatus[],
    options?: {
      maxAttempts?: number;
      delayMs?: number;
      timeoutMs?: number;
    }
  ): Promise<MessageStatusResponse> {
    // Convert to array for type checking
    return this.statusChecker.waitForStatus(messageId, targetStatus, options);
  }

  /**
   * Parse a webhook payload
   * This requires the webhook handler to be configured
   *
   * @param body - Raw webhook body
   * @param signature - Webhook signature header
   * @returns Parsed webhook payload
   */
  parseWebhook(body: string, signature: string): WebhookPayload {
    if (!this.webhookHandler) {
      const error = new Error(
        'Webhook handler not configured. Please provide webhook.secretKey in the SDK config.'
      );
      this.emit('error', error);
      throw error;
    }

    return this.webhookHandler.parseWebhook(body, signature);
  }

  /**
   * Get the message service instance
   * For advanced use cases
   */
  getMessageService(): LoopMessageService {
    return this.messageService;
  }

  /**
   * Get the status checker instance
   * For advanced use cases
   */
  getStatusChecker(): MessageStatusChecker {
    return this.statusChecker;
  }

  /**
   * Get the webhook handler instance
   * For advanced use cases
   */
  getWebhookHandler(): WebhookHandler | undefined {
    return this.webhookHandler;
  }

  /**
   * Get the conversation service (if enabled)
   *
   * @returns The conversation service instance or undefined
   */
  getConversationService(): LoopMessageConversationService | undefined {
    return this.conversationService;
  }

  /**
   * Get the webhook middleware for Express (requires conversation service)
   *
   * @returns Express middleware function
   */
  getWebhookMiddleware() {
    if (!this.conversationService) {
      throw new Error('Conversation service not enabled. Set enableConversations: true in config.');
    }
    return this.conversationService.getWebhookMiddleware();
  }
}
