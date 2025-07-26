import { LoopMessageService } from './services/LoopMessageService.js';
import { LoopMessageError } from './errors/LoopMessageError.js';
import { MessageStatusChecker } from './services/LoopMessageStatus.js';
import { WebhookHandler as LoopMessageWebhooks } from './services/LoopMessageWebhooks.js';
import type {
  SendMessageParams,
  LoopMessageSendResponse,
  MessageEffect,
  MessageReaction,
  MessageStatusResponse,
  MessageStatus,
  WebhookPayload,
} from './types.js';

// WebhookEventHandler and WebhookHandlerOptions need to be defined
type WebhookEventHandler = (payload: WebhookPayload) => void | { typing?: number; read?: boolean };
interface WebhookHandlerOptions {
  authToken: string;
  debug?: boolean;
}
import EventEmitter from 'events';

/**
 * Configuration options for the conversation service
 */
export interface ConversationServiceConfig {
  // API credentials
  loopAuthKey: string;
  loopSecretKey: string;
  loopAuthSecretKey?: string;
  senderName: string;

  // Optional webhook configuration
  webhookAuthToken?: string;

  // Status checking configuration
  statusPollingIntervalMs?: number;
  statusMaxAttempts?: number;

  // Optional base API URL override
  baseApiUrl?: string;

  // Debug and logging options
  debug?: boolean;
}

/**
 * Represents a conversation thread with a recipient
 */
export interface ConversationThread {
  recipient?: string;
  group?: string;
  messages: ConversationMessage[];
  lastActivity: Date;
}

/**
 * Represents a message in a conversation
 */
export interface ConversationMessage {
  messageId: string;
  direction: 'inbound' | 'outbound';
  text: string;
  attachments?: string[];
  status?: MessageStatus;
  sentAt: Date;
  deliveredAt?: Date;
  subject?: string;
  effect?: MessageEffect;
  replyToId?: string;
  reaction?: MessageReaction;
  isAudioMessage?: boolean;
  mediaUrl?: string;
  errorCode?: number;
  errorMessage?: string;
}

/**
 * Options for sending a message through the conversation service
 */
export interface ConversationSendOptions {
  // Should the service automatically track message status
  trackStatus?: boolean;

  // Wait for message to reach a terminal status before resolving
  waitForDelivery?: boolean;

  // Terminal statuses to wait for (default: ['sent', 'failed', 'timeout'])
  terminalStatuses?: MessageStatus[];

  // Maximum time to wait for delivery in milliseconds
  deliveryTimeoutMs?: number;

  // Custom metadata
  metadata?: Record<string, any>;
}

/**
 * Result of a message send operation with the conversation service
 */
export interface ConversationSendResult {
  messageId: string;
  success: boolean;
  recipient?: string;
  group?: {
    group_id: string;
    name?: string;
    participants: string[];
  };
  text: string;
  status?: MessageStatus;
  deliveryTime?: number; // Time in ms it took for delivery
  errorCode?: number;
  errorMessage?: string;
}

/**
 * Events emitted by the conversation service
 */
export enum ConversationEvent {
  MESSAGE_SENT = 'messageSent',
  MESSAGE_DELIVERED = 'messageDelivered',
  MESSAGE_FAILED = 'messageFailed',
  MESSAGE_RECEIVED = 'messageReceived',
  TYPING_STARTED = 'typingStarted',
  TYPING_STOPPED = 'typingStopped',
  READ_RECEIPT = 'readReceipt',
  REACTION_RECEIVED = 'reactionReceived',
  GROUP_CREATED = 'groupCreated',
  STATUS_CHANGED = 'statusChanged',
  ERROR = 'error',
}

/**
 * Service for orchestrating conversations via the LoopMessage API
 *
 * This service ties together message sending, status checking, and webhook handling
 * to provide a unified interface for managing conversations.
 */
export class LoopMessageConversationService extends EventEmitter {
  private messageService: LoopMessageService;
  private statusChecker: MessageStatusChecker;
  private webhooks?: LoopMessageWebhooks;

  private readonly config: ConversationServiceConfig;
  private threads: Map<string, ConversationThread> = new Map();
  private messageStatusTracking: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Create a new conversation service
   *
   * @param config Service configuration
   */
  constructor(config: ConversationServiceConfig) {
    super();
    this.config = {
      statusPollingIntervalMs: 2000,
      statusMaxAttempts: 10,
      ...config,
    };

    // Initialize the core services
    this.messageService = new LoopMessageService({
      loopAuthKey: config.loopAuthKey,
      loopSecretKey: config.loopSecretKey,
      loopAuthSecretKey: config.loopAuthSecretKey,
      senderName: config.senderName,
    });

    this.statusChecker = new MessageStatusChecker({
      loopAuthKey: config.loopAuthKey,
      loopSecretKey: config.loopSecretKey,
      baseApiUrl: config.baseApiUrl,
    });

    // Only initialize webhooks if auth token is provided
    if (config.webhookAuthToken) {
      this.initializeWebhooks(config);
    }
  }

  /**
   * Initialize webhook handling if configured
   */
  private initializeWebhooks(config: ConversationServiceConfig): void {
    if (!config.webhookAuthToken) return;

    this.webhooks = new LoopMessageWebhooks({
      authToken: config.webhookAuthToken,
      debug: config.debug,
    });

    // Set up webhook event handlers to update conversation state
    this.webhooks.on('message_inbound', this.handleInboundMessage.bind(this));
    this.webhooks.on('message_reaction', this.handleReaction.bind(this));
    this.webhooks.on('group_created', this.handleGroupCreated.bind(this));
    this.webhooks.on('message_sent', this.handleMessageSent.bind(this));
    this.webhooks.on('message_failed', this.handleMessageFailed.bind(this));
    this.webhooks.on('message_scheduled', this.handleMessageScheduled.bind(this));
    this.webhooks.on('message_timeout', this.handleMessageTimeout.bind(this));
  }

  /**
   * Get the webhook middleware for use with Express
   *
   * @returns Express middleware function to handle webhooks
   */
  public getWebhookMiddleware() {
    if (!this.webhooks) {
      throw new LoopMessageError({
        message: 'Webhooks not initialized. Provide webhookAuthToken in config.',
        code: 400,
        cause: 'Missing webhook configuration',
      });
    }

    return this.webhooks.middleware();
  }

  /**
   * Register a custom handler for webhook events
   *
   * @param event Event type to handle
   * @param handler Handler function
   */
  public onWebhook(event: string, handler: WebhookEventHandler): void {
    if (!this.webhooks) {
      throw new LoopMessageError({
        message: 'Webhooks not initialized. Provide webhookAuthToken in config.',
        code: 400,
        cause: 'Missing webhook configuration',
      });
    }

    this.webhooks.on(event as any, handler);
  }

  /**
   * Send a message to a recipient or group
   *
   * @param params Message parameters
   * @param options Conversation options
   * @returns Promise resolving to the send result
   */
  public async sendMessage(
    params: SendMessageParams,
    options: ConversationSendOptions = {}
  ): Promise<ConversationSendResult> {
    try {
      // Send the message
      const response = await this.messageService.sendLoopMessage(params);

      // Store message in conversation thread
      this.addOutboundMessageToThread(response, params);

      // Track message status if requested
      if (options.trackStatus || options.waitForDelivery) {
        this.trackMessageStatus(
          response.message_id,
          options.terminalStatuses || ['sent', 'failed', 'timeout'],
          options.deliveryTimeoutMs
        );
      }

      // If we need to wait for delivery, poll until terminal status
      if (options.waitForDelivery) {
        const finalStatus = await this.statusChecker.waitForStatus(
          response.message_id,
          options.terminalStatuses || ['sent', 'failed', 'timeout'],
          {
            maxAttempts: this.config.statusMaxAttempts,
            delayMs: this.config.statusPollingIntervalMs,
            timeoutMs: options.deliveryTimeoutMs,
          }
        );

        // Update the message status in our thread store
        this.updateMessageStatus(response.message_id, finalStatus);

        return {
          messageId: response.message_id,
          success: finalStatus.status === 'sent',
          recipient: response.recipient,
          group: response.group,
          text: response.text,
          status: finalStatus.status,
          errorCode: finalStatus.error_code,
          // Note: error_message isn't in the standard MessageStatusResponse, but
          // might be provided by the API
          errorMessage: (finalStatus as any).error_message,
        };
      }

      // Return the initial response if not waiting for delivery
      return {
        messageId: response.message_id,
        success: response.success,
        recipient: response.recipient,
        group: response.group,
        text: response.text,
      };
    } catch (error) {
      this.emit(ConversationEvent.ERROR, error);

      if (error instanceof LoopMessageError) {
        return {
          messageId: '',
          success: false,
          text: params.text,
          errorCode: error.code,
          errorMessage: error.message,
        };
      }

      // Handle unknown error types
      const unknownError = error as Error;
      return {
        messageId: '',
        success: false,
        text: params.text,
        errorCode: 500,
        errorMessage: unknownError.message || 'Unknown error occurred',
      };
    }
  }

  /**
   * Send a message with an effect
   *
   * @param params Message parameters with effect
   * @param options Conversation options
   * @returns Promise resolving to the send result
   */
  public async sendMessageWithEffect(
    params: SendMessageParams & { effect: MessageEffect },
    options: ConversationSendOptions = {}
  ): Promise<ConversationSendResult> {
    return this.sendMessage(params, options);
  }

  /**
   * Send an audio message
   *
   * @param params Message parameters with media_url and audio_message flag
   * @param options Conversation options
   * @returns Promise resolving to the send result
   */
  public async sendAudioMessage(
    params: SendMessageParams & {
      media_url: string;
      audio_message: boolean;
    },
    options: ConversationSendOptions = {}
  ): Promise<ConversationSendResult> {
    return this.sendMessage(params, options);
  }

  /**
   * Send a reaction to a message
   *
   * @param params Message parameters with message_id and reaction
   * @param options Conversation options
   * @returns Promise resolving to the send result
   */
  public async sendReaction(
    params: SendMessageParams & {
      message_id: string;
      reaction: MessageReaction;
    },
    options: ConversationSendOptions = {}
  ): Promise<ConversationSendResult> {
    return this.sendMessage(params, options);
  }

  /**
   * Reply to a specific message
   *
   * @param params Message parameters with reply_to_id
   * @param options Conversation options
   * @returns Promise resolving to the send result
   */
  public async sendReply(
    params: SendMessageParams & { reply_to_id: string },
    options: ConversationSendOptions = {}
  ): Promise<ConversationSendResult> {
    return this.sendMessage(params, options);
  }

  /**
   * Initiate an iMessage authentication request
   *
   * @param passthrough Optional metadata to include with the request
   * @returns Promise resolving to the authentication response
   */
  public initiateAuthRequest(passthrough?: string) {
    return this.messageService.sendLoopAuthRequest(passthrough || '');
  }

  /**
   * Check the status of a message
   *
   * @param messageId The message ID to check
   * @returns Promise resolving to the message status
   */
  public checkMessageStatus(messageId: string): Promise<MessageStatusResponse> {
    return this.statusChecker.checkStatus(messageId);
  }

  /**
   * Wait for a message to reach a specific status
   *
   * @param messageId The message ID to check
   * @param targetStatus Status or array of statuses to wait for
   * @param options Options for the status polling
   * @returns Promise resolving to the final message status
   */
  public waitForStatus(
    messageId: string,
    targetStatus: MessageStatus | MessageStatus[],
    options?: {
      maxAttempts?: number;
      delayMs?: number;
      timeoutMs?: number;
    }
  ): Promise<MessageStatusResponse> {
    return this.statusChecker.waitForStatus(messageId, targetStatus, options);
  }

  /**
   * Get all conversation threads
   *
   * @returns All active conversation threads
   */
  public getConversations(): ConversationThread[] {
    return Array.from(this.threads.values());
  }

  /**
   * Get a specific conversation thread
   *
   * @param threadKey The recipient or group ID
   * @returns The conversation thread or undefined if not found
   */
  public getConversation(threadKey: string): ConversationThread | undefined {
    return this.threads.get(threadKey);
  }

  /**
   * Get a specific message by ID
   *
   * @param messageId The message ID to find
   * @returns The conversation message or undefined if not found
   */
  public getMessage(messageId: string): ConversationMessage | undefined {
    for (const thread of this.threads.values()) {
      const message = thread.messages.find(m => m.messageId === messageId);
      if (message) return message;
    }
    return undefined;
  }

  /**
   * Clear conversation history
   *
   * @param threadKey Optional thread key to clear; if omitted, clears all threads
   */
  public clearConversations(threadKey?: string): void {
    if (threadKey) {
      this.threads.delete(threadKey);
    } else {
      this.threads.clear();
    }
  }

  /**
   * Start a typing indicator for a recipient or group
   *
   * @param recipientOrGroup The recipient phone/email or group ID
   * @param durationSeconds How long to show typing (max 60 seconds)
   * @returns Whether the typing indicator was started successfully
   */
  public showTypingIndicator(recipientOrGroup: string, durationSeconds: number = 5): boolean {
    // NOTE: This is a placeholder. In a real implementation, this would need
    // to be coordinated with the webhook response mechanism.
    this.emit(ConversationEvent.TYPING_STARTED, {
      recipient: recipientOrGroup,
      duration: durationSeconds,
    });

    return true;
  }

  /**
   * Add an outbound message to the conversation thread
   */
  private addOutboundMessageToThread(
    response: LoopMessageSendResponse,
    params: SendMessageParams
  ): void {
    const threadKey = params.recipient || params.group || '';
    if (!threadKey) return;

    let thread = this.threads.get(threadKey);
    if (!thread) {
      thread = {
        recipient: params.recipient,
        group: params.group,
        messages: [],
        lastActivity: new Date(),
      };
      this.threads.set(threadKey, thread);
    }

    const message: ConversationMessage = {
      messageId: response.message_id,
      direction: 'outbound',
      text: params.text,
      attachments: params.attachments,
      sentAt: new Date(),
      status: 'scheduled',
      subject: params.subject,
      effect: params.effect as MessageEffect,
      replyToId: params.reply_to_id,
      isAudioMessage: params.audio_message,
      mediaUrl: params.media_url,
    };

    thread.messages.push(message);
    thread.lastActivity = new Date();

    this.emit(ConversationEvent.MESSAGE_SENT, {
      threadKey,
      message,
    });
  }

  /**
   * Update message status in the thread store
   */
  private updateMessageStatus(messageId: string, status: MessageStatusResponse): void {
    for (const [threadKey, thread] of this.threads.entries()) {
      const messageIndex = thread.messages.findIndex(m => m.messageId === messageId);
      if (messageIndex >= 0) {
        const message = thread.messages[messageIndex];
        if (!message) continue;

        message.status = status.status;
        message.errorCode = status.error_code;

        if (status.status === 'sent') {
          message.deliveredAt = new Date();
        }

        thread.lastActivity = new Date();

        this.emit(ConversationEvent.STATUS_CHANGED, {
          threadKey,
          messageId,
          status: status.status,
          previous: message.status,
        });

        if (status.status === 'sent') {
          this.emit(ConversationEvent.MESSAGE_DELIVERED, {
            threadKey,
            messageId,
            deliveryTime: message.deliveredAt
              ? message.deliveredAt.getTime() - message.sentAt.getTime()
              : undefined,
          });
        } else if (status.status === 'failed' || status.status === 'timeout') {
          this.emit(ConversationEvent.MESSAGE_FAILED, {
            threadKey,
            messageId,
            errorCode: status.error_code,
          });
        }

        return;
      }
    }
  }

  /**
   * Set up status tracking for a message
   */
  private trackMessageStatus(
    messageId: string,
    terminalStatuses: MessageStatus[],
    timeoutMs?: number
  ): void {
    // Clear any existing tracking for this message
    if (this.messageStatusTracking.has(messageId)) {
      clearTimeout(this.messageStatusTracking.get(messageId)!);
      this.messageStatusTracking.delete(messageId);
    }

    // Set up polling interval
    const pollInterval = setInterval(async () => {
      try {
        const status = await this.statusChecker.checkStatus(messageId);
        this.updateMessageStatus(messageId, status);

        if (terminalStatuses.includes(status.status)) {
          // Stop polling when we reach a terminal state
          clearInterval(pollInterval);
          this.messageStatusTracking.delete(messageId);
        }
      } catch (error) {
        // Log error but continue polling
        console.error(`Error checking status for ${messageId}:`, error);
      }
    }, this.config.statusPollingIntervalMs);

    // Set timeout to stop polling if requested
    if (timeoutMs) {
      setTimeout(() => {
        clearInterval(pollInterval);
        this.messageStatusTracking.delete(messageId);
      }, timeoutMs);
    }

    this.messageStatusTracking.set(messageId, pollInterval);
  }

  /**
   * Handle inbound messages from webhooks
   */
  private handleInboundMessage(payload: WebhookPayload): {
    typing?: number;
    read?: boolean;
  } {
    // Get thread key (either recipient or group)
    const threadKey = payload.group?.group_id || payload.recipient || '';
    if (!threadKey) return {};

    // Create or get the conversation thread
    let thread = this.threads.get(threadKey);
    if (!thread) {
      thread = {
        recipient: payload.recipient,
        group: payload.group?.group_id,
        messages: [],
        lastActivity: new Date(),
      };
      this.threads.set(threadKey, thread);
    }

    // Create a new message object
    const message: ConversationMessage = {
      messageId: payload.message_id,
      direction: 'inbound',
      text: payload.text || '',
      attachments: payload.attachments,
      sentAt: new Date(),
      status: 'sent',
      deliveredAt: new Date(),
      isAudioMessage: payload.message_type === 'audio',
      mediaUrl:
        payload.message_type === 'audio'
          ? payload.attachments && payload.attachments.length > 0
            ? payload.attachments[0]
            : undefined
          : undefined,
    };

    thread.messages.push(message);
    thread.lastActivity = new Date();

    this.emit(ConversationEvent.MESSAGE_RECEIVED, {
      threadKey,
      message,
      payload,
    });

    // Return typing indicator and read receipt
    return { typing: 3, read: true };
  }

  /**
   * Handle reaction webhooks
   */
  private handleReaction(payload: WebhookPayload): {
    typing?: number;
    read?: boolean;
  } {
    if (!payload.message_id || !payload.reaction) return {};

    const threadKey = payload.group?.group_id || payload.recipient || '';
    if (!threadKey) return {};

    // Update the target message with the reaction
    const originalMessage = this.getMessage(payload.message_id);
    if (originalMessage) {
      originalMessage.reaction = payload.reaction as MessageReaction;
    }

    this.emit(ConversationEvent.REACTION_RECEIVED, {
      threadKey,
      messageId: payload.message_id,
      reaction: payload.reaction,
    });

    return { read: true };
  }

  /**
   * Handle group created webhooks
   */
  private handleGroupCreated(payload: WebhookPayload): void {
    if (!payload.group || !payload.group.group_id) return;

    const threadKey = payload.group.group_id;
    let thread = this.threads.get(threadKey);

    if (!thread) {
      thread = {
        group: payload.group.group_id,
        messages: [],
        lastActivity: new Date(),
      };
      this.threads.set(threadKey, thread);
    }

    this.emit(ConversationEvent.GROUP_CREATED, {
      threadKey,
      group: payload.group,
    });
  }

  /**
   * Handle message sent webhooks
   */
  private handleMessageSent(payload: WebhookPayload): void {
    if (!payload.message_id) return;

    const message = this.getMessage(payload.message_id);
    if (message) {
      message.status = payload.success ? 'sent' : 'failed';
      message.deliveredAt = new Date();

      const threadKey = payload.group?.group_id || payload.recipient || '';
      if (threadKey) {
        this.emit(
          payload.success ? ConversationEvent.MESSAGE_DELIVERED : ConversationEvent.MESSAGE_FAILED,
          {
            threadKey,
            messageId: payload.message_id,
            success: payload.success,
          }
        );
      }
    }
  }

  /**
   * Handle message failed webhooks
   */
  private handleMessageFailed(payload: WebhookPayload): void {
    if (!payload.message_id) return;

    const message = this.getMessage(payload.message_id);
    if (message) {
      message.status = 'failed';
      message.errorCode = payload.error_code;

      const threadKey = payload.group?.group_id || payload.recipient || '';
      if (threadKey) {
        this.emit(ConversationEvent.MESSAGE_FAILED, {
          threadKey,
          messageId: payload.message_id,
          errorCode: payload.error_code,
        });
      }
    }
  }

  /**
   * Handle message scheduled webhooks
   */
  private handleMessageScheduled(payload: WebhookPayload): void {
    if (!payload.message_id) return;

    const message = this.getMessage(payload.message_id);
    if (message) {
      message.status = 'scheduled';

      const threadKey = payload.group?.group_id || payload.recipient || '';
      if (threadKey) {
        this.emit(ConversationEvent.STATUS_CHANGED, {
          threadKey,
          messageId: payload.message_id,
          status: 'scheduled',
          previous: message.status,
        });
      }
    }
  }

  /**
   * Handle message timeout webhooks
   */
  private handleMessageTimeout(payload: WebhookPayload): void {
    if (!payload.message_id) return;

    const message = this.getMessage(payload.message_id);
    if (message) {
      message.status = 'timeout';

      const threadKey = payload.group?.group_id || payload.recipient || '';
      if (threadKey) {
        this.emit(ConversationEvent.MESSAGE_FAILED, {
          threadKey,
          messageId: payload.message_id,
          errorCode: payload.error_code,
          timeout: true,
        });
      }
    }
  }
}
