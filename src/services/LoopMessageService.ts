/**
 * LoopMessageService - Service for sending messages via the Loop Message API
 */
import { API, LIMITS } from '../constants.js';
import { LoopMessageError } from '../errors/LoopMessageError.js';
import type { MessageServiceConfig } from '../LoopCredentials.js';
import type {
  LoopMessageAuthResponse,
  LoopMessageSendResponse,
  MessageEffect,
  MessageReaction,
  SendMessageParams,
} from '../types.js';
import { LoopHttpClient } from '../utils/LoopHttpClient.js';
import { EventService } from '../utils/EventService.js';
import * as validators from '../utils/validators.js';

// Message event names
export const MESSAGE_EVENTS = {
  SEND_START: 'send_start',
  SEND_SUCCESS: 'send_success',
  SEND_ERROR: 'send_error',
  AUTH_START: 'auth_start',
  AUTH_SUCCESS: 'auth_success',
  AUTH_ERROR: 'auth_error',
  PARAM_VALIDATION_FAIL: 'param_validation_fail',
};

/**
 * Service for sending messages via the Loop Message API
 */
export class LoopMessageService extends EventService {
  private readonly config: MessageServiceConfig;
  private readonly messageClient: LoopHttpClient;
  private readonly authClient: LoopHttpClient;

  /**
   * Creates a new LoopMessageService instance to interact with the LoopMessage API.
   *
   * @param config - Configuration object with API keys and sender name
   * @throws {Error} If required configuration is missing
   */
  constructor(config: MessageServiceConfig) {
    // Initialize EventService base class
    super(config.logLevel || 'info');

    if (!config.loopAuthKey || !config.loopSecretKey || !config.senderName) {
      const error = new Error(
        'Missing required config: loopAuthKey, loopSecretKey, and senderName are required.'
      );
      this.emitError(error);
      throw error;
    }

    this.config = config;

    // Create HTTP clients
    this.messageClient = new LoopHttpClient(config, 'message');
    this.authClient = new LoopHttpClient(
      {
        ...config,
        baseApiUrl: config.loopApiAuthHost || config.baseApiUrl,
      },
      'auth'
    );

    this.logger.debug('LoopMessageService initialized');
  }

  /**
   * Validates message parameters to ensure a valid request.
   *
   * @param params - The parameters to validate
   * @throws {LoopMessageError} If validation fails
   */
  private validateMessageParams(params: SendMessageParams): void {
    try {
      // Check recipient/group requirement (mutually exclusive)
      if (!params.recipient && !params.group) {
        throw LoopMessageError.missingParamError('recipient or group');
      }

      if (params.recipient && params.group) {
        throw LoopMessageError.invalidParamError(
          'recipient and group',
          'Provide either recipient or group, not both'
        );
      }

      // Check text requirement
      validators.validateMessageText(params.text);

      // Validate recipient if provided
      if (params.recipient) {
        validators.validateRecipient(params.recipient);
      }

      // Validate attachments
      if (params.attachments) {
        validators.validateAttachments(params.attachments);
      }

      // Validate audio message
      if (params.audio_message && !params.media_url) {
        throw LoopMessageError.missingParamError('media_url for audio message');
      }

      // Validate reaction
      if (params.reaction && !params.message_id) {
        throw LoopMessageError.missingParamError('message_id for reaction');
      }

      // Cannot use both effect and reaction
      if (params.effect && params.reaction) {
        throw LoopMessageError.invalidParamError(
          'effect and reaction',
          'Cannot use both effect and reaction in the same request'
        );
      }

      // Validate effect if provided
      if (params.effect) {
        validators.validateMessageEffect(params.effect);
      }

      // Validate reaction if provided
      if (params.reaction) {
        validators.validateMessageReaction(params.reaction);
      }

      // SMS limitations
      if (params.service === 'sms') {
        if (params.subject || params.effect || params.reply_to_id) {
          throw LoopMessageError.invalidParamError(
            'service',
            'SMS does not support subject, effect, or reply_to_id parameters'
          );
        }

        if (params.recipient && params.recipient.includes('@')) {
          throw LoopMessageError.invalidParamError(
            'recipient',
            'Cannot send SMS to an email address'
          );
        }

        if (params.group) {
          throw LoopMessageError.invalidParamError('group', 'Cannot send SMS to a group');
        }
      }

      // Validate timeout if provided
      if (params.timeout !== undefined && params.timeout < LIMITS.MIN_TIMEOUT) {
        throw LoopMessageError.invalidParamError(
          'timeout',
          `Timeout must be at least ${LIMITS.MIN_TIMEOUT} seconds`
        );
      }

      // Validate status callback URL if provided
      if (params.status_callback) {
        validators.validateUrl(params.status_callback, 'status_callback');
      }

      // Validate passthrough if provided
      if (params.passthrough) {
        validators.validatePassthrough(params.passthrough);
      }
    } catch (error) {
      if (error instanceof LoopMessageError) {
        this.emitEvent(MESSAGE_EVENTS.PARAM_VALIDATION_FAIL, {
          error,
          params: {
            ...params,
            // Redact sensitive info for logging
            sender_name: params.sender_name ? '[REDACTED]' : undefined,
          },
        });
      }
      throw error;
    }
  }

  /**
   * Sends a message via the Loop API.
   *
   * @param params - The message parameters (without sender_name as it's in the config)
   * @returns Promise resolving to the API response
   * @throws {LoopMessageError} If the request fails
   */
  async sendLoopMessage(
    params: Omit<SendMessageParams, 'sender_name'>
  ): Promise<LoopMessageSendResponse> {
    // Create a new object with all params plus the sender_name
    const fullParams: SendMessageParams = {
      ...params,
      sender_name: this.config.senderName,
    };

    // Validate the parameters
    this.validateMessageParams(fullParams);

    const logSafeParams = {
      ...params,
      text: params.text?.length > 100 ? `${params.text.substring(0, 100)}...` : params.text,
    };

    this.logger.debug('Sending message', logSafeParams);
    this.emitEvent(MESSAGE_EVENTS.SEND_START, { params: logSafeParams });

    try {
      // Make the API request
      const response = await this.messageClient.post<LoopMessageSendResponse>(
        API.ENDPOINTS.SEND,
        fullParams
      );

      this.logger.debug('Message sent successfully', {
        messageId: response.message_id,
        success: response.success,
      });
      this.emitEvent(MESSAGE_EVENTS.SEND_SUCCESS, { response });

      return response;
    } catch (error) {
      this.logger.error('Error sending message', error);
      this.emitEvent(MESSAGE_EVENTS.SEND_ERROR, {
        error,
        params: logSafeParams,
      });

      // The HTTP client already handles and transforms errors
      throw error;
    }
  }

  /**
   * Sends an audio message via the Loop API.
   *
   * @param params - The message parameters (with required media_url)
   * @returns Promise resolving to the API response
   * @throws {LoopMessageError} If the request fails
   */
  async sendAudioMessage(
    params: Omit<SendMessageParams, 'sender_name' | 'audio_message'> & {
      media_url: string;
    }
  ): Promise<LoopMessageSendResponse> {
    this.logger.debug('Sending audio message', {
      recipient: params.recipient,
      group: params.group,
      mediaUrl: params.media_url,
    });

    return this.sendLoopMessage({
      ...params,
      audio_message: true,
    });
  }

  /**
   * Sends a reaction to a message.
   *
   * @param params - The reaction parameters (with required message_id and reaction)
   * @returns Promise resolving to the API response
   * @throws {LoopMessageError} If the request fails
   */
  async sendReaction(
    params: Omit<SendMessageParams, 'sender_name'> & {
      message_id: string;
      reaction: MessageReaction;
    }
  ): Promise<LoopMessageSendResponse> {
    this.logger.debug('Sending reaction', {
      messageId: params.message_id,
      reaction: params.reaction,
    });

    return this.sendLoopMessage(params);
  }

  /**
   * Sends a message with a visual effect.
   *
   * @param params - The message parameters (with required effect)
   * @returns Promise resolving to the API response
   * @throws {LoopMessageError} If the request fails
   */
  async sendMessageWithEffect(
    params: Omit<SendMessageParams, 'sender_name'> & {
      effect: MessageEffect;
    }
  ): Promise<LoopMessageSendResponse> {
    this.logger.debug('Sending message with effect', {
      recipient: params.recipient,
      group: params.group,
      effect: params.effect,
    });

    return this.sendLoopMessage(params);
  }

  /**
   * Sends a reply to a message.
   *
   * @param params - The message parameters (with required reply_to_id)
   * @returns Promise resolving to the API response
   * @throws {LoopMessageError} If the request fails
   */
  async sendReply(
    params: Omit<SendMessageParams, 'sender_name'> & {
      reply_to_id: string;
    }
  ): Promise<LoopMessageSendResponse> {
    this.logger.debug('Sending reply', {
      replyToId: params.reply_to_id,
      recipient: params.recipient,
      group: params.group,
    });

    return this.sendLoopMessage(params);
  }

  /**
   * Initiates an iMessage authentication request.
   *
   * @param passthrough - Optional metadata to include with the request
   * @returns Promise resolving to the API response
   * @throws {LoopMessageError} If the request fails
   */
  async sendLoopAuthRequest(passthrough: string): Promise<LoopMessageAuthResponse> {
    try {
      // Validate passthrough if provided
      if (passthrough) {
        validators.validatePassthrough(passthrough);
      }

      this.logger.debug('Initiating auth request');
      this.emitEvent(MESSAGE_EVENTS.AUTH_START, { passthrough });

      // Make the API request
      const response = await this.authClient.post<LoopMessageAuthResponse>(API.ENDPOINTS.AUTH, {
        passthrough,
      });

      this.logger.debug('Auth request successful', {
        requestId: response.request_id,
        success: response.success,
      });
      this.emitEvent(MESSAGE_EVENTS.AUTH_SUCCESS, { response });

      return response;
    } catch (error) {
      this.logger.error('Error initiating auth request', error);
      this.emitEvent(MESSAGE_EVENTS.AUTH_ERROR, { error, passthrough });

      // The HTTP client already handles and transforms errors
      throw error;
    }
  }
}
