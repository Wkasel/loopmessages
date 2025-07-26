/**
 * Centralized type definitions for the Loop Message SDK
 */

// -----------------------------------------------------------------------------
// Message Types
// -----------------------------------------------------------------------------

/**
 * Visual effects for iMessage
 */
export type MessageEffect =
  | 'slam'
  | 'loud'
  | 'gentle'
  | 'invisibleInk'
  | 'echo'
  | 'spotlight'
  | 'balloons'
  | 'confetti'
  | 'love'
  | 'lasers'
  | 'fireworks'
  | 'shootingStar'
  | 'celebration';

/**
 * Reaction types for iMessage
 * Prefixed with '-' to remove a reaction
 */
export type MessageReaction =
  | 'love'
  | 'like'
  | 'dislike'
  | 'laugh'
  | 'exclaim'
  | 'question'
  | '-love'
  | '-like'
  | '-dislike'
  | '-laugh'
  | '-exclaim'
  | '-question';

/**
 * Status values for messages
 */
export type MessageStatus =
  | 'processing' // Send request was successfully accepted and is being processed
  | 'scheduled' // Send request successfully processed and scheduled for sending
  | 'failed' // Failed to send or deliver a message
  | 'sent' // Message was successfully delivered to a recipient
  | 'timeout' // The minimum time required to send a message is timed out
  | 'unknown'; // Message status is currently unknown

/**
 * Parameters for sending a message
 */
export interface SendMessageParams {
  // Core message routing parameters (one of these is required)
  recipient?: string; // Phone number or email for individual message
  group?: string; // Group ID for group message

  // Required message content
  text: string; // Message text (required, max 10000 chars)
  sender_name: string; // Your dedicated sender name (required)

  // Message content enhancements
  attachments?: string[]; // Array of public HTTPS image URLs (max 3)
  subject?: string; // Displays as bold title before message text
  effect?: MessageEffect; // Visual effect for message delivery

  // Audio message parameters
  media_url?: string; // URL to audio file (for voice messages)
  audio_message?: boolean; // Flag to send as voice message

  // Reply and reaction parameters
  reply_to_id?: string; // Message ID to reply to
  message_id?: string; // Required for reactions - message to react to
  reaction?: MessageReaction; // Type of reaction to send (requires message_id)

  // Message delivery parameters
  timeout?: number; // In seconds, min 5
  service?: 'imessage' | 'sms'; // Default is "imessage"

  // Callback/webhook parameters
  status_callback?: string; // URL for webhook status updates
  status_callback_header?: string; // Custom header for webhook
  passthrough?: string; // Metadata (max 1000 chars, included in webhooks)
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
