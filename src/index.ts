/**
 * Loop Message API SDK
 * A TypeScript library for interacting with the Loop Message API
 */

// Main SDK - Most users should just use this
export { LoopSdk, EVENTS } from './LoopSdk.js';

// Individual services for advanced use cases
export { LoopMessageService, MESSAGE_EVENTS } from './services/LoopMessageService.js';
export { MessageStatusChecker, STATUS_EVENTS } from './services/LoopMessageStatus.js';
export { WebhookHandler, WEBHOOK_EVENTS } from './services/LoopMessageWebhooks.js';
export { LoopMessageConversationService, CONVERSATION_EVENTS } from './LoopMessageConversation.js';

// Core Types
export type {
  // Configuration
  LoopSdkConfig,
} from './LoopCredentials.js';

export type {
  // Message Types
  MessageEffect,
  MessageReaction,
  MessageStatus,
  SendMessageParams,
  LoopMessageSendResponse,
  LoopMessageAuthResponse,
  MessageStatusResponse,

  // Webhook Types
  WebhookPayload,
  InboundMessageWebhook,
} from './types.js';

export type {
  // Conversation Types
  ConversationServiceConfig,
  ConversationThread,
  ConversationMessage,
  ConversationSendOptions,
  ConversationSendResult,
} from './LoopMessageConversation.js';

// Error
export { LoopMessageError } from './errors/LoopMessageError.js';

// Webhook Middleware helpers
export { createWebhookMiddleware, handleLoopWebhook } from './utils/webhookMiddleware.js';
export type { WebhookMiddlewareOptions, SimpleWebhookHandlers } from './utils/webhookMiddleware.js';

// Constants
export { MESSAGE_STATUS, MESSAGE_EFFECT, MESSAGE_REACTION } from './constants.js';
