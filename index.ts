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
 * 3. Status Checking: The MessageStatusChecker allows tracking message status,
 *    and waiting for specific delivery states.
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
 *
 * @example
 * // Check message status
 * import { MessageStatusChecker } from 'loop-message';
 *
 * const statusChecker = new MessageStatusChecker({
 *   loopAuthKey: 'YOUR_LOOP_AUTH_KEY',
 *   loopSecretKey: 'YOUR_LOOP_SECRET_KEY'
 * });
 *
 * // Check status of a specific message
 * const status = await statusChecker.checkStatus('message-id-123');
 * console.log(`Message status: ${status.status}`);
 *
 * // Wait for message to be delivered
 * const result = await statusChecker.waitForStatus('message-id-123', 'sent');
 * console.log(`Message delivered to ${result.recipient}`);
 */

// Re-export everything from the src directory
export * from "./src/index";
