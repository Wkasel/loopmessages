/**
 * LoopMessageWebhooks - Service for handling Loop Message API webhooks
 */
import crypto from 'crypto';
import { LoopMessageError } from '../errors/LoopMessageError.js';
import type { WebhookConfig } from '../LoopCredentials.js';
import type { WebhookPayload } from '../types.js';
import { EventService } from '../utils/EventService.js';

// Webhook event names
export const WEBHOOK_EVENTS = {
  WEBHOOK_RECEIVED: 'webhook_received',
  WEBHOOK_VERIFIED: 'webhook_verified',
  WEBHOOK_INVALID: 'webhook_invalid',
  WEBHOOK_PARSE_ERROR: 'webhook_parse_error',
  SIGNATURE_ERROR: 'signature_error',
};

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
    super(config.logLevel || 'info');

    if (!config.webhookSecretKey) {
      const error = new Error(
        'Missing required config: webhookSecretKey is required for webhook verification'
      );
      this.emitError(error);
      throw error;
    }

    this.config = config;
    this.secretKey = config.webhookSecretKey;

    this.logger.debug('WebhookHandler initialized');
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
    this.logger.debug('Received webhook', {
      bodyLength: body.length,
      signatureLength: signature?.length,
    });
    this.emitEvent(WEBHOOK_EVENTS.WEBHOOK_RECEIVED, {
      bodyLength: body.length,
      signaturePresent: !!signature,
    });

    // Verify the webhook signature
    this.verifySignature(body, signature);

    this.logger.debug('Webhook signature verified');
    this.emitEvent(WEBHOOK_EVENTS.WEBHOOK_VERIFIED, { signature });

    try {
      // Parse the webhook body
      const payload = JSON.parse(body) as WebhookPayload;

      // Validate the webhook payload has required fields
      if (!payload.type || !payload.timestamp) {
        const error = LoopMessageError.invalidParamError(
          'webhook',
          'Invalid webhook payload: missing required fields'
        );
        this.emitEvent(WEBHOOK_EVENTS.WEBHOOK_INVALID, {
          payload,
          reason: 'missing required fields',
        });
        throw error;
      }

      this.logger.info(`Webhook received: ${payload.type}`, {
        type: payload.type,
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
          'Invalid webhook payload: invalid JSON'
        );
        this.logger.error('Failed to parse webhook payload', { error });
        this.emitEvent(WEBHOOK_EVENTS.WEBHOOK_PARSE_ERROR, { error });
        throw loopError;
      }

      if (error instanceof LoopMessageError) {
        this.emitEvent(WEBHOOK_EVENTS.WEBHOOK_INVALID, { error });
      } else {
        this.emitError(error as Error);
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
        'Missing webhook signature header'
      );
      this.emitEvent(WEBHOOK_EVENTS.SIGNATURE_ERROR, {
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
        const error = LoopMessageError.authError('Invalid webhook signature');
        this.logger.warn('Invalid webhook signature', {
          expected: expectedSignature.substring(0, 10) + '...',
          received: signature.substring(0, 10) + '...',
        });
        this.emitEvent(WEBHOOK_EVENTS.SIGNATURE_ERROR, {
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
        'Failed to verify webhook signature'
      );
      this.logger.error('Failed to verify webhook signature', { error });
      this.emitEvent(WEBHOOK_EVENTS.SIGNATURE_ERROR, {
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
