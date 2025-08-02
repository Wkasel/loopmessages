/**
 * Express middleware helper for Loop Message webhooks
 */
import type { Request, Response, NextFunction } from 'express';
import { WebhookHandler } from '../services/LoopMessageWebhooks.js';
import type { WebhookPayload } from '../types.js';
import { WEBHOOK_TYPES, DEFAULTS } from '../constants.js';

export interface WebhookMiddlewareOptions {
  /**
   * Webhook secret key for signature verification
   */
  webhookSecretKey: string;

  /**
   * Path to match for webhook requests (default: current path)
   */
  path?: string;

  /**
   * Whether to automatically respond with 200 OK (default: true)
   */
  autoRespond?: boolean;

  /**
   * Callback for handling verified webhooks
   */
  onWebhook?: (payload: WebhookPayload, req: Request, res: Response) => void | Promise<void>;

  /**
   * Callback for handling errors
   */
  onError?: (error: Error, req: Request, res: Response) => void;

  /**
   * Log level for the webhook handler
   */
  logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'none';
}

/**
 * Create Express middleware for handling Loop Message webhooks
 *
 * @example
 * ```typescript
 * import express from 'express';
 * import { createWebhookMiddleware } from 'loop-messages';
 *
 * const app = express();
 *
 * app.use('/webhooks/loop', createWebhookMiddleware({
 *   webhookSecretKey: 'your-webhook-secret',
 *   onWebhook: async (payload) => {
 *     console.log('Received webhook:', payload.alert_type);
 *
 *     // Handle different webhook types
 *     switch (payload.alert_type) {
 *       case 'message_inbound':
 *         console.log('New message from:', payload.from);
 *         break;
 *       case 'message_sent':
 *         console.log('Message delivered:', payload.message_id);
 *         break;
 *     }
 *   }
 * }));
 * ```
 */
export function createWebhookMiddleware(options: WebhookMiddlewareOptions) {
  const {
    webhookSecretKey,
    path,
    autoRespond = DEFAULTS.WEBHOOK_AUTO_RESPOND,
    onWebhook,
    onError,
    logLevel = DEFAULTS.LOG_LEVEL,
  } = options;

  // Create webhook handler instance
  const handler = new WebhookHandler({
    loopAuthKey: '', // Not needed for webhook verification
    loopSecretKey: '', // Not needed for webhook verification
    webhookSecretKey,
    logLevel,
  });

  // Set up event listeners if callback provided
  if (onWebhook) {
    // Listen for all webhook event types
    const eventTypes = Object.values(WEBHOOK_TYPES);

    eventTypes.forEach(eventType => {
      handler.on(eventType as any, (payload: WebhookPayload) => {
        // Call the callback with request and response for context
        const req = (payload as any).__req;
        const res = (payload as any).__res;
        if (req && res) {
          onWebhook(payload, req, res);
        }
      });
    });
  }

  // Return the middleware function
  return async (req: Request, res: Response, next: NextFunction) => {
    // Check if path matches (if specified)
    if (path && req.path !== path) {
      return next();
    }

    try {
      // Get raw body and signature
      const rawBody = req.body;
      const signature = req.headers['loop-signature'] as string;

      if (!signature) {
        throw new Error('Missing loop-signature header');
      }

      // Parse and verify the webhook
      const payload = handler.parseWebhook(
        typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody),
        signature
      );

      // Attach request and response to payload for callback context
      (payload as any).__req = req;
      (payload as any).__res = res;

      // Emit the webhook event (this will trigger the callback if set)
      // The webhook payload includes alert_type field
      const alertType = (payload as any).alert_type;
      if (alertType) {
        handler.emit(alertType, payload);
      }

      // Auto-respond if enabled
      if (autoRespond && !res.headersSent) {
        res.status(200).json({ success: true });
      }

      // Clean up the attached request/response
      delete (payload as any).__req;
      delete (payload as any).__res;

      // Continue to next middleware if response not sent
      if (!res.headersSent) {
        next();
      }
    } catch (error) {
      if (onError) {
        onError(error as Error, req, res);
      } else {
        // Default error handling
        console.error('Webhook error:', error);
        if (!res.headersSent) {
          res.status(400).json({
            error: 'Invalid webhook',
            message: (error as Error).message,
          });
        }
      }
    }
  };
}

/**
 * Simple webhook handler for common use cases
 *
 * @example
 * ```typescript
 * app.post('/webhooks/loop', express.raw({ type: 'application/json' }), handleLoopWebhook({
 *   secretKey: 'your-webhook-secret',
 *   onMessage: async (message) => {
 *     console.log('New message:', message.text);
 *     // Return response to show typing indicator and mark as read
 *     return { typing: 3, read: true };
 *   },
 *   onReaction: async (reaction) => {
 *     console.log('Reaction received:', reaction.reaction);
 *   }
 * }));
 * ```
 */
export interface SimpleWebhookHandlers {
  secretKey: string;
  onMessage?: (
    payload: WebhookPayload
  ) => void | Promise<void> | { typing?: number; read?: boolean };
  onReaction?: (payload: WebhookPayload) => void | Promise<void>;
  onMessageSent?: (payload: WebhookPayload) => void | Promise<void>;
  onMessageFailed?: (payload: WebhookPayload) => void | Promise<void>;
  onGroupCreated?: (payload: WebhookPayload) => void | Promise<void>;
}

export function handleLoopWebhook(handlers: SimpleWebhookHandlers) {
  return createWebhookMiddleware({
    webhookSecretKey: handlers.secretKey,
    autoRespond: true,
    onWebhook: async (payload, req, res) => {
      let response: any;

      const alertType = (payload as any).alert_type;
      switch (alertType) {
        case WEBHOOK_TYPES.MESSAGE_INBOUND:
          if (handlers.onMessage) {
            response = await handlers.onMessage(payload);
          }
          break;
        case WEBHOOK_TYPES.MESSAGE_REACTION:
          if (handlers.onReaction) {
            await handlers.onReaction(payload);
          }
          break;
        case WEBHOOK_TYPES.MESSAGE_SENT:
          if (handlers.onMessageSent) {
            await handlers.onMessageSent(payload);
          }
          break;
        case WEBHOOK_TYPES.MESSAGE_FAILED:
          if (handlers.onMessageFailed) {
            await handlers.onMessageFailed(payload);
          }
          break;
        case WEBHOOK_TYPES.GROUP_CREATED:
          if (handlers.onGroupCreated) {
            await handlers.onGroupCreated(payload);
          }
          break;
      }

      // Override response if handler returned something
      if (response && !res.headersSent) {
        res.status(200).json(response);
      }
    },
  });
}
