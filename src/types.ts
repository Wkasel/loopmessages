/**
 * Centralized type definitions for the Loop Message SDK
 */

import { MESSAGE_EFFECT, MESSAGE_REACTION, MESSAGE_STATUS } from './constants.js';

// -----------------------------------------------------------------------------
// Message Types
// -----------------------------------------------------------------------------

/**
 * Visual effects for iMessage messages
 *
 * @example
 * ```typescript
 * // These values will auto-complete in your IDE:
 * await sdk.sendMessageWithEffect({
 *   recipient: '+1234567890',
 *   text: 'Party time!',
 *   effect: 'confetti' // <-- IDE will suggest all available effects
 * });
 * ```
 */
export type MessageEffect = (typeof MESSAGE_EFFECT)[keyof typeof MESSAGE_EFFECT];

/**
 * Reaction types for iMessage tapbacks
 * Use negative values (prefixed with '-') to remove reactions
 *
 * @example
 * ```typescript
 * // Add a love reaction
 * await sdk.sendReaction({
 *   recipient: '+1234567890',
 *   text: '',
 *   message_id: 'msg-123',
 *   reaction: 'love' // <-- IDE will auto-complete available reactions
 * });
 *
 * // Remove a love reaction
 * await sdk.sendReaction({
 *   recipient: '+1234567890',
 *   text: '',
 *   message_id: 'msg-123',
 *   reaction: '-love' // <-- Remove the reaction
 * });
 * ```
 */
export type MessageReaction = (typeof MESSAGE_REACTION)[keyof typeof MESSAGE_REACTION];

/**
 * Message delivery status values
 *
 * @example
 * ```typescript
 * const status = await sdk.checkMessageStatus('msg-123');
 * if (status.status === 'sent') { // <-- IDE knows all possible status values
 *   console.log('Message delivered!');
 * }
 * ```
 */
export type MessageStatus = (typeof MESSAGE_STATUS)[keyof typeof MESSAGE_STATUS];

/**
 * Parameters for sending a message via LoopMessage API
 *
 * @example
 * ```typescript
 * // Basic text message
 * await sdk.sendMessage({
 *   recipient: '+1234567890',
 *   text: 'Hello from LoopMessage!'
 * });
 *
 * // Message with effect and attachments
 * await sdk.sendMessage({
 *   recipient: '+1234567890',
 *   text: 'Check out this image!',
 *   effect: 'confetti', // <-- Auto-completes available effects
 *   attachments: ['https://example.com/image.jpg']
 * });
 *
 * // Reaction to a message
 * await sdk.sendMessage({
 *   recipient: '+1234567890',
 *   text: '',
 *   message_id: 'msg-to-react-to',
 *   reaction: 'love' // <-- Auto-completes available reactions
 * });
 * ```
 */
export interface SendMessageParams {
  // Core message routing parameters (one of these is required)
  /**
   * Phone number (with country code) or email for individual message
   * @example '+1234567890' or 'user@example.com'
   */
  recipient?: string;

  /**
   * Group ID for group message (mutually exclusive with recipient)
   * @example 'group-uuid-123'
   */
  group?: string;

  // Required message content
  /**
   * Message text content (required, max 10,000 characters)
   * @example 'Hello, how are you?'
   */
  text: string;

  /**
   * Your dedicated sender name from LoopMessage dashboard
   * @example 'your.sender@imsg.co'
   */
  sender_name: string;

  // Message content enhancements
  /**
   * Array of public HTTPS image URLs (max 3 attachments)
   * @example ['https://example.com/image1.jpg', 'https://example.com/image2.png']
   */
  attachments?: string[];

  /**
   * Subject line - displays as bold title before message text
   * @example 'Important Update'
   */
  subject?: string;

  /**
   * Visual effect for message delivery (iMessage only)
   * @example 'confetti' | 'fireworks' | 'balloons'
   */
  effect?: MessageEffect;

  // Audio message parameters
  /**
   * URL to audio file for voice messages
   * @example 'https://example.com/audio.mp3'
   */
  media_url?: string;

  /**
   * Flag to send as voice message (requires media_url)
   */
  audio_message?: boolean;

  // Reply and reaction parameters
  /**
   * Message ID to reply to (creates threaded reply)
   * @example 'msg-uuid-123'
   */
  reply_to_id?: string;

  /**
   * Message ID to react to (required for reactions)
   * @example 'msg-uuid-456'
   */
  message_id?: string;

  /**
   * Type of reaction to send (requires message_id)
   * Use negative values to remove reactions
   * @example 'love' | 'like' | '-love'
   */
  reaction?: MessageReaction;

  // Message delivery parameters
  /**
   * Timeout in seconds (minimum 5 seconds)
   * @example 30
   */
  timeout?: number;

  /**
   * Message service type (default: 'imessage')
   * Note: SMS has limitations (no effects, subjects, etc.)
   */
  service?: 'imessage' | 'sms';

  // Callback/webhook parameters
  /**
   * HTTPS URL for webhook status updates
   * @example 'https://yourapp.com/webhooks/status'
   */
  status_callback?: string;

  /**
   * Custom header for webhook requests
   * @example 'Bearer your-api-key'
   */
  status_callback_header?: string;

  /**
   * Custom metadata (max 1,000 chars, included in webhooks)
   * @example JSON.stringify({ userId: '123', campaign: 'welcome' })
   */
  passthrough?: string;
}

// -----------------------------------------------------------------------------
// Response Types
// -----------------------------------------------------------------------------

/**
 * Response from sending a message
 */
export interface LoopMessageSendResponse {
  message_id: string;
  success: boolean;
  recipient?: string;
  group?: {
    group_id: string;
    name?: string;
    participants: string[];
  };
  text: string;
  message?: string; // Error description on failure
}

/**
 * Response from requesting authentication
 */
export interface LoopMessageAuthResponse {
  imessage_link: string;
  request_id: string;
  success: boolean;
  message?: string; // Error description on failure
}

/**
 * Response from checking message status
 */
export interface MessageStatusResponse {
  message_id: string;
  status: MessageStatus;
  recipient?: string;
  text?: string;
  sandbox?: boolean;
  error_code?: number;
  sender_name?: string;
  passthrough?: string;
  last_update?: string; // ISO datetime string
}

// -----------------------------------------------------------------------------
// Webhook Types
// -----------------------------------------------------------------------------

/**
 * Types of webhook alerts from Loop API
 */
export type WebhookAlertType =
  | 'message_schedule'
  | 'message_sent'
  | 'message_failed'
  | 'message_inbound'
  | 'message_timeout'
  | 'message_reaction'
  | 'conversation_inited'
  | 'group_created';

/**
 * Base webhook payload from Loop API
 */
export interface WebhookBasePayload {
  type: WebhookAlertType;
  timestamp: string; // ISO datetime string
}

/**
 * Message status webhook payload
 */
export interface MessageStatusWebhook extends WebhookBasePayload {
  type: 'message_sent' | 'message_failed' | 'message_timeout' | 'message_schedule';
  message_id: string;
  recipient?: string;
  group_id?: string;
  text?: string;
  error_code?: number;
  error_message?: string;
  passthrough?: string;
}

/**
 * Message reaction webhook payload
 */
export interface MessageReactionWebhook extends WebhookBasePayload {
  type: 'message_reaction';
  message_id: string;
  recipient: string;
  reaction: MessageReaction;
  from?: string; // Phone/email of the person who sent the reaction
  passthrough?: string;
}

/**
 * Inbound message webhook payload
 */
export interface InboundMessageWebhook extends WebhookBasePayload {
  type: 'message_inbound';
  from: string; // Phone/email of the sender
  text: string;
  group_id?: string;
  attachments?: string[];
  reply_to_id?: string;
  passthrough?: string;
}

/**
 * Group created webhook payload
 */
export interface GroupCreatedWebhook extends WebhookBasePayload {
  type: 'group_created';
  group_id: string;
  group_name?: string;
  participants: string[];
  creator?: string;
  passthrough?: string;
}

/**
 * Conversation initialized webhook payload
 */
export interface ConversationInitedWebhook extends WebhookBasePayload {
  type: 'conversation_inited';
  recipient: string;
  passthrough?: string;
}

/**
 * Union type of all webhook payload types
 */
export type WebhookPayload =
  | MessageStatusWebhook
  | MessageReactionWebhook
  | InboundMessageWebhook
  | GroupCreatedWebhook
  | ConversationInitedWebhook;
