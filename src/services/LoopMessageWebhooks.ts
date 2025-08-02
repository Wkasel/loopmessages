/**
 * LoopMessageWebhooks - Service for handling Loop Message API webhooks
 */
import * as crypto from 'crypto';
import { LoopMessageError } from '../errors/LoopMessageError.js';
import type { WebhookConfig } from '../LoopCredentials.js';
import type { WebhookPayload } from '../types.js';
import { EventService } from '../utils/eventService.js';
import { EVENTS, ERROR_MESSAGES } from '../constants.js';

// Webhook event names - exported from constants
export const WEBHOOK_EVENTS = EVENTS.WEBHOOK;

/**
 * Service for handling Loop Message API webhooks
 * Extends EventService to provide structured event emission and logging
 */
export class WebhookHandler extends EventService {
  private readonly config: WebhookConfig;
  private readonly secretKey: string;

  /**
   * Creates a new WebhookHandler instance
   *
   * @param config - API credentials and webhook configuration
   * @throws {Error} If webhook secret key is missing
   */
  constructor(config: WebhookConfig) {
    // Initialize EventService base class
    super();

    if (!config.webhookSecretKey) {
      const error = new Error(ERROR_MESSAGES.MISSING_WEBHOOK_SECRET);
      this.emit('error', error);
      throw error;
    }

    this.config = config;
    this.secretKey = config.webhookSecretKey;
  }

  /**
   * Parse and verify a webhook payload
   *
   * @param body - The raw webhook body as a string
   * @param signature - The signature header from the webhook request
   * @returns The parsed webhook payload
   * @throws {LoopMessageError} If verification fails or the payload is invalid
   */
  parseWebhook(body: string, signature: string): WebhookPayload {
    this.emit(WEBHOOK_EVENTS.WEBHOOK_RECEIVED, {
      bodyLength: body.length,
      signaturePresent: !!signature,
    });

    // Verify the webhook signature
    this.verifySignature(body, signature);

    this.emit(WEBHOOK_EVENTS.WEBHOOK_VERIFIED, { signature });

    try {
      // Parse the webhook body
      const payload = JSON.parse(body) as WebhookPayload;

      // Validate the webhook payload has required fields
      if (!payload.type || !payload.timestamp) {
        const error = LoopMessageError.invalidParamError(
          'webhook',
          ERROR_MESSAGES.WEBHOOK_MISSING_FIELDS
        );
        this.emit(WEBHOOK_EVENTS.WEBHOOK_INVALID, {
          payload,
          reason: 'missing required fields',
        });
        throw error;
      }

      // Emit specific event for the webhook type
      this.emit(payload.type, {
        timestamp: payload.timestamp,
      });

      // Emit an event for the webhook type (retaining traditional event emission for backwards compatibility)
      // But using emitEvent for internal events with logging
      this.emit(payload.type, payload);

      // Emit a general 'webhook' event
      this.emit('webhook', payload);

      return payload;
    } catch (error) {
      if (error instanceof SyntaxError) {
        const loopError = LoopMessageError.invalidParamError(
          'webhook',
          ERROR_MESSAGES.WEBHOOK_INVALID_JSON
        );

        this.emit(WEBHOOK_EVENTS.WEBHOOK_PARSE_ERROR, { error });
        throw loopError;
      }

      if (error instanceof LoopMessageError) {
        this.emit(WEBHOOK_EVENTS.WEBHOOK_INVALID, { error });
      } else {
        this.emit('error', error as Error);
      }

      throw error;
    }
  }

  /**
   * Verify the webhook signature
   *
   * @param body - The raw webhook body
   * @param signature - The signature header
   * @throws {LoopMessageError} If verification fails
   */
  private verifySignature(body: string, signature: string): void {
    if (!signature) {
      const error = LoopMessageError.invalidParamError(
        'signature',
        ERROR_MESSAGES.MISSING_SIGNATURE
      );
      this.emit(WEBHOOK_EVENTS.SIGNATURE_ERROR, {
        reason: 'missing signature',
      });
      throw error;
    }

    try {
      // Create HMAC using the webhook secret key
      const hmac = crypto.createHmac('sha256', this.secretKey);

      // Update the HMAC with the webhook body
      hmac.update(body);

      // Generate the expected signature
      const expectedSignature = hmac.digest('hex');

      // Compare the expected signature with the provided one
      if (signature !== expectedSignature) {
        const error = LoopMessageError.authError(ERROR_MESSAGES.INVALID_SIGNATURE);
        this.emit(WEBHOOK_EVENTS.SIGNATURE_ERROR, {
          reason: 'invalid signature',
        });
        throw error;
      }
    } catch (error) {
      if (error instanceof LoopMessageError) {
        throw error;
      }

      const loopError = LoopMessageError.invalidParamError(
        'signature',
        ERROR_MESSAGES.WEBHOOK_VERIFICATION_FAILED
      );

      this.emit(WEBHOOK_EVENTS.SIGNATURE_ERROR, {
        reason: 'verification error',
        error,
      });
      throw loopError;
    }
  }

  /**
   * Subscribe to a specific webhook event type
   * Note: This maintains compatibility with the previous EventEmitter implementation
   *
   * @param event - The event type to subscribe to
   * @param listener - The callback function
   * @returns The WebhookHandler instance for chaining
   */
  on(event: string, listener: (payload: WebhookPayload) => void): this {
    return super.on(event, listener);
  }

  /**
   * Subscribe to a specific webhook event type (alias for on)
   * Note: This maintains compatibility with the previous EventEmitter implementation
   *
   * @param event - The event type to subscribe to
   * @param listener - The callback function
   * @returns The WebhookHandler instance for chaining
   */
  addListener(event: string, listener: (payload: WebhookPayload) => void): this {
    return super.addListener(event, listener);
  }

  /**
   * Subscribe to a specific webhook event type once
   * Note: This maintains compatibility with the previous EventEmitter implementation
   *
   * @param event - The event type to subscribe to
   * @param listener - The callback function
   * @returns The WebhookHandler instance for chaining
   */
  once(event: string, listener: (payload: WebhookPayload) => void): this {
    return super.once(event, listener);
  }
}
