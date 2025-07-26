/**
 * Loop Message API SDK
 * A TypeScript library for interacting with the Loop Message API
 */

// Main SDK
export { LoopSdk, EVENTS } from './LoopSdk.js';

// Service Classes
export { LoopMessageService, MESSAGE_EVENTS } from './services/LoopMessageService.js';
export { MessageStatusChecker, STATUS_EVENTS } from './services/LoopMessageStatus.js';
export { WebhookHandler, WEBHOOK_EVENTS } from './services/LoopMessageWebhooks.js';

// Base Event Service
export { EventService } from './utils/EventService.js';

// Logger
export { createLogger } from './utils/Logger.js';
export type { Logger, LogLevel } from './utils/Logger.js';

// Types
export type {
  // Configuration Types
  LoopCredentials,
  MessageServiceConfig,
  StatusServiceConfig,
  WebhookConfig,
  LoopSdkConfig,
} from './LoopCredentials.js';

export type {
  // Message Types
  MessageEffect,
  MessageReaction,
  MessageStatus,
  SendMessageParams,

  // Response Types
  LoopMessageSendResponse,
  LoopMessageAuthResponse,
  MessageStatusResponse,

  // Webhook Types
  WebhookAlertType,
  WebhookBasePayload,
  MessageStatusWebhook,
  MessageReactionWebhook,
  InboundMessageWebhook,
  GroupCreatedWebhook,
  ConversationInitedWebhook,
  WebhookPayload,
} from './types.js';

// Error Types
export { LoopMessageError } from './errors/LoopMessageError.js';

// Constants
export {
  API,
  RETRY,
  LIMITS,
  MESSAGE_STATUS,
  MESSAGE_EFFECT,
  MESSAGE_REACTION,
  DEFAULTS,
} from './constants.js';

// HTTP Client
export { LoopHttpClient } from './utils/LoopHttpClient.js';
export type { LoopEndpointType, LoopRequestConfig } from './utils/LoopHttpClient.js';

// Validators
export * as validators from './utils/validators.js';

// Retry Utility
export { retryWithExponentialBackoff } from './utils/retry.js';
export type { RetryOptions } from './utils/retry.js';

/**
 * LoopMessage API TypeScript SDK
 *
 * This package provides a complete interface to the LoopMessage API:
 *
 * 1. Message Sending: The LoopMessageService class handles sending messages,
 *    including regular messages, audio messages, reactions, and iMessage auth.
 *
 * 2. Webhook Handling: The LoopMessageWebhooks class handles incoming webhooks,
 *    including message reception, reactions, group creation, etc.
 *
 * @example
 * // Basic usage for sending a message
 * import { LoopMessageService } from 'loop-message';
 *
 * const service = new LoopMessageService({
 *   loopAuthKey: 'YOUR_LOOP_AUTH_KEY',
 *   loopSecretKey: 'YOUR_LOOP_SECRET_KEY',
 *   senderName: 'your.sender@imsg.co'
 * });
 *
 * // Send a message
 * service.sendLoopMessage({
 *   recipient: '+1234567890',
 *   text: 'Hello from LoopMessage!'
 * });
 *
 * @example
 * // Basic webhook handling with Express
 * import express from 'express';
 * import { LoopMessageWebhooks } from 'loop-message';
 *
 * const app = express();
 * app.use(express.json());
 *
 * const webhooks = new LoopMessageWebhooks({
 *   authToken: 'your-webhook-auth-token'
 * });
 *
 * // Handle incoming messages
 * webhooks.on('message_inbound', (payload) => {
 *   console.log(`Message from ${payload.recipient}: ${payload.text}`);
 *   return { typing: 3, read: true }; // Show typing for 3s and mark as read
 * });
 *
 * // Register webhook endpoint
 * app.post('/webhooks/loopmessage', webhooks.middleware());
 *
 * app.listen(3000);
 */
