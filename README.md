# LoopMessage SDK

An unofficial TypeScript SDK for the LoopMessage API, enabling seamless integration of iMessage and SMS messaging within your Node.js applications.

> **Note**: This is an unofficial, community-built SDK for [LoopMessage.com](https://loopmessage.com) - the iMessage API provider that lets you send blue bubble messages programmatically.

## Features

- **Complete API Coverage**: Full support for all LoopMessage API features
- **TypeScript Support**: Strongly typed for better developer experience
- **Event-Based Architecture**: Built on EventEmitter for reactive programming patterns
- **Unified SDK Interface**: A single entry point for all LoopMessage services
- **Message Sending**: Send text messages, audio messages, and reactions via iMessage or SMS
- **Status Tracking**: Check message delivery status and track message journey
- **Webhook Processing**: Handle incoming messages, reactions, and other events
- **Error Handling**: Robust error handling with specific error codes and retry logic
- **Logging System**: Configurable logging levels for debugging and monitoring
- **Retry Logic**: Built-in exponential backoff for failed requests

## Installation

```bash
npm install loopmessage-sdk
```

## Quick Start with the Unified SDK

```typescript
import { LoopSdk, EVENTS } from 'loopmessage-sdk';

// Initialize the SDK
const sdk = new LoopSdk({
  loopAuthKey: 'YOUR_LOOP_AUTH_KEY',
  loopSecretKey: 'YOUR_LOOP_SECRET_KEY',
  senderName: 'your.sender@imsg.co',
  logLevel: 'info',
  webhook: {
    secretKey: 'YOUR_WEBHOOK_SECRET_KEY'
  }
});

// Listen for events
sdk.on(EVENTS.SEND_SUCCESS, (data) => {
  console.log(`Message sent successfully with ID: ${data.response.message_id}`);
});

sdk.on(EVENTS.STATUS_CHANGE, (data) => {
  console.log(`Status changed from ${data.oldStatus} to ${data.newStatus}`);
});

// Send a message
async function sendMessage() {
  try {
    const response = await sdk.sendMessage({
      recipient: '+1234567890',
      text: 'Hello from LoopMessage SDK!'
    });
    
    // Wait for delivery
    await sdk.waitForMessageStatus(response.message_id, 'sent');
  } catch (error) {
    console.error('Error:', error.message);
  }
}
```

## Sending Messages

```typescript
// You can use either the unified SDK or direct service
import { LoopMessageService } from 'loopmessage-sdk';

// Initialize the service
const loopService = new LoopMessageService({
  loopAuthKey: 'YOUR_LOOP_AUTH_KEY',
  loopSecretKey: 'YOUR_LOOP_SECRET_KEY',
  senderName: 'your.sender@imsg.co',
  logLevel: 'info'
});

// Listen for events
loopService.on('send_success', (data) => {
  console.log(`Message sent with ID: ${data.response.message_id}`);
});

// Send a simple message
async function sendMessage() {
  try {
    const response = await loopService.sendLoopMessage({
      recipient: '+1234567890',
      text: 'Hello from LoopMessage!'
    });
    
    console.log(`Message sent with ID: ${response.message_id}`);
    return response;
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

// Send a message with an effect
async function sendMessageWithEffect() {
  try {
    const response = await loopService.sendMessageWithEffect({
      recipient: '+1234567890',
      text: 'This message has confetti! 🎉',
      effect: 'confetti'
    });
    
    console.log(`Message with effect sent with ID: ${response.message_id}`);
    return response;
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

// Send an audio message
async function sendAudioMessage() {
  try {
    const response = await loopService.sendAudioMessage({
      recipient: '+1234567890',
      text: 'Here is a voice message',
      media_url: 'https://example.com/audio.mp3'
    });
    
    console.log(`Audio message sent with ID: ${response.message_id}`);
    return response;
  } catch (error) {
    console.error('Error sending audio message:', error);
  }
}
```

## Checking Message Status

```typescript
import { MessageStatusChecker, STATUS_EVENTS } from 'loopmessage-sdk';

// Initialize the status checker
const statusChecker = new MessageStatusChecker({
  loopAuthKey: 'YOUR_LOOP_AUTH_KEY',
  loopSecretKey: 'YOUR_LOOP_SECRET_KEY',
  logLevel: 'info'
});

// Listen for status change events
statusChecker.on(STATUS_EVENTS.STATUS_CHANGE, (data) => {
  console.log(`Status changed: ${data.oldStatus} → ${data.newStatus} (Message: ${data.messageId})`);
});

// Check the status of a message
async function checkMessageStatus(messageId: string) {
  try {
    const status = await statusChecker.checkStatus(messageId);
    console.log(`Message status: ${status.status}`);
    
    /*
     * Possible status values:
     * - 'processing': Send request accepted and being processed
     * - 'scheduled': Processed and scheduled for sending
     * - 'failed': Failed to send or deliver
     * - 'sent': Successfully delivered to recipient
     * - 'timeout': Message timed out
     * - 'unknown': Status is unknown
     */
    
    if (status.error_code) {
      console.log(`Error code: ${status.error_code}`);
    }
    
    return status;
  } catch (error) {
    console.error('Error checking message status:', error);
  }
}

// Wait for a message to reach a specific status
async function waitForDelivery(messageId: string) {
  try {
    // Will poll the status API until message is sent or fails
    const status = await statusChecker.waitForStatus(messageId, 'sent', {
      maxAttempts: 10,     // Try up to 10 times
      delayMs: 2000,       // Wait 2 seconds between attempts
      timeoutMs: 30000     // Timeout after 30 seconds total
    });
    
    if (status.status === 'sent') {
      console.log(`Message delivered to ${status.recipient}`);
    } else {
      console.log(`Message not delivered, final status: ${status.status}`);
    }
    
    return status;
  } catch (error) {
    console.error('Error waiting for delivery:', error);
  }
}

// You can also wait for multiple possible statuses
async function waitForCompletion(messageId: string) {
  try {
    // Wait for any terminal status (sent or failed)
    const status = await statusChecker.waitForStatus(messageId, ['sent', 'failed']);
    
    return status;
  } catch (error) {
    console.error('Error waiting for completion:', error);
  }
}
```

## Handling Webhooks

### Using the Simple Webhook Middleware

```typescript
import express from 'express';
import { handleLoopWebhook } from 'loop-message';

const app = express();
app.use(express.json());

// Simple webhook handler
app.post('/webhooks/loopmessage', handleLoopWebhook({
  secretKey: 'YOUR_WEBHOOK_SECRET_KEY',
  onMessage: async (payload) => {
    console.log(`New message from ${payload.from}: ${payload.text}`);
    // Return response to show typing indicator and mark as read
    return { typing: 3, read: true };
  },
  onReaction: async (payload) => {
    console.log(`${payload.from} reacted with ${payload.reaction}`);
  },
  onMessageSent: async (payload) => {
    console.log(`Message ${payload.message_id} was delivered`);
  }
}));

app.listen(3000, () => {
  console.log('Webhook server running on port 3000');
});
```

### Using the Advanced Webhook Middleware

```typescript
import express from 'express';
import { createWebhookMiddleware, LoopSdk } from 'loop-message';

const app = express();
app.use(express.json());

// Initialize SDK for sending replies
const sdk = new LoopSdk({
  loopAuthKey: 'YOUR_LOOP_AUTH_KEY',
  loopSecretKey: 'YOUR_LOOP_SECRET_KEY',
  senderName: 'your.sender@imsg.co'
});

// Advanced webhook middleware with full control
app.use('/webhooks', createWebhookMiddleware({
  webhookSecretKey: 'YOUR_WEBHOOK_SECRET_KEY',
  path: '/loopmessage',
  onWebhook: async (payload, req, res) => {
    console.log(`Webhook received: ${payload.alert_type}`);
    
    if (payload.alert_type === 'message_inbound' && payload.text) {
      // Send a reply
      await sdk.sendMessage({
        recipient: payload.from || payload.recipient,
        text: `Echo: ${payload.text}`
      });
      
      // Custom response
      res.status(200).json({ typing: 5, read: true });
    }
  },
  onError: (error, req, res) => {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Invalid webhook' });
  }
}));

app.listen(3000, () => {
  console.log('Webhook server running on port 3000');
});
```

### Using the Manual Webhook Handler

```typescript
import express from 'express';
import { WebhookHandler, WEBHOOK_EVENTS, LoopMessageService } from 'loop-message';

const app = express();
app.use(express.json());

// Initialize webhook handler
const webhooks = new WebhookHandler({
  loopAuthKey: 'YOUR_LOOP_AUTH_KEY',
  loopSecretKey: 'YOUR_LOOP_SECRET_KEY',
  webhookSecretKey: 'YOUR_WEBHOOK_SECRET_KEY',
  logLevel: 'info'
});

// Initialize LoopMessage service for sending replies
const loopService = new LoopMessageService({
  loopAuthKey: 'YOUR_LOOP_AUTH_KEY',
  loopSecretKey: 'YOUR_LOOP_SECRET_KEY',
  senderName: 'your.sender@imsg.co',
  logLevel: 'info'
});

// Listen for webhook events
webhooks.on(WEBHOOK_EVENTS.WEBHOOK_RECEIVED, (data) => {
  console.log(`Received webhook with ${data.bodyLength} bytes of data`);
});

// Handle incoming messages
webhooks.on('message_inbound', async (payload) => {
  console.log(`New message from ${payload.from}: ${payload.text}`);
  
  // Send a reply
  if (payload.text && payload.from) {
    try {
      await loopService.sendLoopMessage({
        recipient: payload.from,
        text: `You said: "${payload.text}"`
      });
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  }
});

// Handle message reactions
webhooks.on('message_reaction', (payload) => {
  if (payload.reaction && payload.recipient) {
    console.log(`${payload.from || payload.recipient} reacted with ${payload.reaction}`);
  }
});

// Register webhook endpoint
app.post('/webhooks/loopmessage', (req, res) => {
  try {
    const signature = req.headers['loop-signature'] as string;
    const payload = webhooks.parseWebhook(JSON.stringify(req.body), signature);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(400).send('Invalid webhook');
  }
});

// Start the server
app.listen(3000, () => {
  console.log('Webhook server running on port 3000');
});
```

## Conversation Management

The SDK includes a powerful conversation management service that tracks message threads, handles webhooks, and manages the complete message lifecycle:

```typescript
import { LoopSdk } from 'loop-message';

// Initialize SDK with conversation support
const sdk = new LoopSdk({
  loopAuthKey: 'YOUR_LOOP_AUTH_KEY',
  loopSecretKey: 'YOUR_LOOP_SECRET_KEY',
  senderName: 'your.sender@imsg.co',
  enableConversations: true,
  webhook: {
    secretKey: 'YOUR_WEBHOOK_SECRET_KEY'
  }
});

// Get the conversation service
const conversations = sdk.getConversationService();

// Listen for conversation events
conversations.on('messageReceived', (data) => {
  console.log(`New message in thread ${data.threadKey}: ${data.message.text}`);
  
  // Auto-reply
  conversations.sendMessage({
    recipient: data.threadKey,
    text: 'Thanks for your message!'
  });
});

conversations.on('messageDelivered', (data) => {
  console.log(`Message ${data.messageId} delivered in ${data.deliveryTime}ms`);
});

conversations.on('reactionReceived', (data) => {
  console.log(`${data.reaction} reaction on message ${data.messageId}`);
});

// Send a message with delivery tracking
async function sendTrackedMessage() {
  const result = await conversations.sendMessage({
    recipient: '+1234567890',
    text: 'Hello! This message is being tracked.'
  }, {
    waitForDelivery: true,    // Wait for the message to be delivered
    deliveryTimeoutMs: 30000  // Timeout after 30 seconds
  });
  
  if (result.success) {
    console.log(`Message delivered in ${result.deliveryTime}ms`);
  } else {
    console.log(`Delivery failed: ${result.errorMessage}`);
  }
}

// Get conversation history
const thread = conversations.getConversation('+1234567890');
if (thread) {
  console.log(`Thread has ${thread.messages.length} messages`);
  console.log(`Last activity: ${thread.lastActivity}`);
  
  // Show recent messages
  thread.messages.slice(-5).forEach(msg => {
    console.log(`[${msg.direction}] ${msg.text} (${msg.status})`);
  });
}

// Use with Express for webhooks
import express from 'express';
const app = express();
app.use(express.json());

// Add the webhook middleware
app.post('/webhooks/loopmessage', sdk.getWebhookMiddleware());
```

### Conversation Features

- **Thread Management**: Automatically tracks conversations by recipient or group
- **Message History**: Maintains a complete history of sent and received messages
- **Status Tracking**: Automatically monitors message delivery status
- **Webhook Integration**: Built-in webhook handling with Express middleware
- **Event System**: Rich events for all conversation activities
- **Typing Indicators**: Show typing status to recipients
- **Read Receipts**: Mark messages as read

### Using the Standalone Conversation Service

You can also use the conversation service directly:

```typescript
import { LoopMessageConversationService, ConversationEvent } from 'loop-message';

const conversationService = new LoopMessageConversationService({
  loopAuthKey: 'YOUR_LOOP_AUTH_KEY',
  loopSecretKey: 'YOUR_LOOP_SECRET_KEY',
  senderName: 'your.sender@imsg.co',
  webhookAuthToken: 'YOUR_WEBHOOK_SECRET_KEY',
  statusPollingIntervalMs: 2000,
  statusMaxAttempts: 10
});

// Send message with automatic status tracking
const result = await conversationService.sendMessage({
  recipient: '+1234567890',
  text: 'Hello from the conversation service!'
}, {
  trackStatus: true,
  waitForDelivery: true
});

// Get all active conversations
const conversations = conversationService.getConversations();
conversations.forEach(thread => {
  console.log(`Thread: ${thread.recipient || thread.group}`);
  console.log(`Messages: ${thread.messages.length}`);
  console.log(`Last activity: ${thread.lastActivity}`);
});
```

## Event-Based Architecture

LoopMessage SDK uses an event-based architecture with the `EventService` base class, which extends Node.js EventEmitter:

```typescript
import { EventService } from 'loopmessage-sdk';

// Create a custom service with events  
class MyService extends EventService {
  constructor() {
    super();
  }
  
  async processData(data: any) {
    try {
      // Emit start event
      this.emit('process_started', { data });
      
      // Do processing...
      const result = await this.doProcessing(data);
      
      // Emit completion event
      this.emit('process_completed', { result });
      return result;
    } catch (error) {
      // Emit error event
      this.emit('error', error);
      throw error;
    }
  }
  
  private async doProcessing(data: any) {
    // Your implementation here
    return { processed: true, data };
  }
}

// Using the service
const myService = new MyService();

// Listen for events
myService.on('process_started', (data) => {
  console.log('Process started:', data);
});

myService.on('process_completed', (data) => {
  console.log('Process completed:', data.result);
});

myService.on('error', (error) => {
  console.error('Service error:', error.message);
});

// Use the service
myService.processData({ id: 123, value: 'test' });
```

## Advanced Features

### Reactions and Tapbacks

```typescript
// Send a reaction to a message
async function sendReaction() {
  try {
    const response = await sdk.sendReaction({
      recipient: '+1234567890',
      text: '',
      message_id: 'MESSAGE_ID_TO_REACT_TO',
      reaction: 'love'
    });
    
    console.log(`Reaction sent with ID: ${response.message_id}`);
  } catch (error) {
    console.error('Error sending reaction:', error);
  }
}
```

### Replying to Messages

```typescript
// Reply to a specific message
async function sendReply() {
  try {
    const response = await sdk.sendReply({
      recipient: '+1234567890',
      text: 'This is a reply to your message',
      reply_to_id: 'MESSAGE_ID_TO_REPLY_TO'
    });
    
    console.log(`Reply sent with ID: ${response.message_id}`);
  } catch (error) {
    console.error('Error sending reply:', error);
  }
}
```

### Authentication Requests

```typescript
// Initiate an iMessage authentication request
async function initiateAuth() {
  try {
    const passthrough = JSON.stringify({ userId: 'user-123', timestamp: Date.now() });
    const response = await sdk.initiateAuth(passthrough);
    
    console.log(`Auth request initiated with ID: ${response.request_id}`);
    console.log(`iMessage link: ${response.imessage_link}`);
  } catch (error) {
    console.error('Error initiating auth request:', error);
  }
}
```

## Error Handling and Logging

The package includes built-in error handling and a configurable logging system:

```typescript
import { LoopSdk, LoopMessageError } from 'loop-message';

// Initialize with a specific log level
const sdk = new LoopSdk({
  loopAuthKey: 'YOUR_LOOP_AUTH_KEY',
  loopSecretKey: 'YOUR_LOOP_SECRET_KEY',
  senderName: 'your.sender@imsg.co',
  logLevel: 'debug' // Options: 'debug', 'info', 'warn', 'error', 'none'
});

// Change log level during runtime
sdk.setLogLevel('warn');

async function sendWithErrorHandling() {
  try {
    const response = await sdk.sendMessage({
      recipient: '+1234567890',
      text: 'Hello from LoopMessage!'
    });
    
    console.log(`Message sent with ID: ${response.message_id}`);
  } catch (error) {
    if (error instanceof LoopMessageError) {
      console.error(`LoopMessage API Error (${error.code}): ${error.message}`);
      console.error(`Cause: ${error.cause || 'Unknown'}`);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}
```

## Complete Workflow Example with SDK

This example shows a complete messaging workflow using the unified SDK:

```typescript
import { LoopSdk, EVENTS, LoopMessageError } from 'loop-message';

async function completeWorkflow() {
  // Create SDK instance
  const sdk = new LoopSdk({
    loopAuthKey: 'YOUR_LOOP_AUTH_KEY',
    loopSecretKey: 'YOUR_LOOP_SECRET_KEY',
    senderName: 'your.sender@imsg.co',
    logLevel: 'info'
  });
  
  // Setup event listeners
  sdk.on(EVENTS.SEND_START, (data) => {
    console.log(`Starting to send message to ${data.params.recipient || data.params.group}`);
  });
  
  sdk.on(EVENTS.SEND_SUCCESS, (data) => {
    console.log(`Message sent successfully with ID: ${data.response.message_id}`);
  });
  
  sdk.on(EVENTS.STATUS_CHECK, (data) => {
    console.log(`Checking status for message: ${data.messageId}`);
  });
  
  sdk.on(EVENTS.STATUS_CHANGE, (data) => {
    console.log(`Status changed from ${data.oldStatus} to ${data.newStatus}`);
  });
  
  try {
    // Send a message
    const response = await sdk.sendMessage({
      recipient: '+1234567890',
      text: 'Testing the complete workflow!'
    });
    
    console.log(`Message sent with ID: ${response.message_id}`);
    const messageId = response.message_id;
    
    // Check initial status
    const initialStatus = await sdk.checkMessageStatus(messageId);
    console.log(`Initial status: ${initialStatus.status}`);
    
    // Wait for delivery
    console.log('Waiting for message delivery...');
    const finalStatus = await sdk.waitForMessageStatus(messageId, ['sent', 'failed'], {
      maxAttempts: 10,
      delayMs: 2000
    });
    
    if (finalStatus.status === 'sent') {
      console.log('Message delivered successfully!');
    } else {
      console.log(`Message delivery failed with status: ${finalStatus.status}`);
      if (finalStatus.error_code) {
        console.log(`Error code: ${finalStatus.error_code}`);
      }
    }
  } catch (error) {
    if (error instanceof LoopMessageError) {
      console.error(`Error: ${error.message} (Code: ${error.code})`);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}
```

## API Reference

### Unified SDK

The `LoopSdk` class provides access to all service functionality:

```typescript
const sdk = new LoopSdk({
  loopAuthKey: 'YOUR_LOOP_AUTH_KEY',
  loopSecretKey: 'YOUR_LOOP_SECRET_KEY',
  senderName: 'your.sender@imsg.co',
  logLevel: 'info',
  webhook: {
    secretKey: 'YOUR_WEBHOOK_SECRET_KEY',
    path: '/webhooks/loopmessage'
  }
});
```

Main methods:
- `sendMessage(params)`: Send a text message
- `sendAudioMessage(params)`: Send an audio message
- `sendReaction(params)`: Send a reaction to a message
- `sendMessageWithEffect(params)`: Send a message with visual effect
- `sendReply(params)`: Send a reply to a message
- `initiateAuth(passthrough?)`: Initiate authentication request
- `checkMessageStatus(messageId)`: Check status of a message
- `waitForMessageStatus(messageId, targetStatus, options?)`: Wait for status
- `parseWebhook(body, signature)`: Parse and verify a webhook payload

### Events

The SDK emits events you can listen for:

```typescript
// Message events
sdk.on(EVENTS.SEND_START, (data) => { /* ... */ });
sdk.on(EVENTS.SEND_SUCCESS, (data) => { /* ... */ });
sdk.on(EVENTS.SEND_ERROR, (data) => { /* ... */ });
sdk.on(EVENTS.AUTH_START, (data) => { /* ... */ });
sdk.on(EVENTS.AUTH_SUCCESS, (data) => { /* ... */ });
sdk.on(EVENTS.AUTH_ERROR, (data) => { /* ... */ });

// Status events
sdk.on(EVENTS.STATUS_CHECK, (data) => { /* ... */ });
sdk.on(EVENTS.STATUS_CHANGE, (data) => { /* ... */ });
sdk.on(EVENTS.STATUS_ERROR, (data) => { /* ... */ });
sdk.on(EVENTS.STATUS_TIMEOUT, (data) => { /* ... */ });

// Webhook events
sdk.on(EVENTS.WEBHOOK_RECEIVED, (data) => { /* ... */ });
sdk.on(EVENTS.WEBHOOK_VERIFIED, (data) => { /* ... */ });
sdk.on(EVENTS.WEBHOOK_INVALID, (data) => { /* ... */ });
sdk.on(EVENTS.WEBHOOK_PARSE_ERROR, (data) => { /* ... */ });
sdk.on(EVENTS.SIGNATURE_ERROR, (data) => { /* ... */ });

// LoopMessage API webhook event types
sdk.on('message_inbound', (payload) => { /* ... */ });
sdk.on('message_sent', (payload) => { /* ... */ });
sdk.on('message_failed', (payload) => { /* ... */ });
sdk.on('message_reaction', (payload) => { /* ... */ });
// etc.
```

## TypeScript Support

The package is fully typed, with detailed interfaces for all API parameters and responses:

```typescript
import type {
  // Configuration
  LoopSdkConfig,
  MessageServiceConfig,
  StatusServiceConfig,
  WebhookConfig,
  
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
  WebhookPayload,
  MessageStatusWebhook,
  MessageReactionWebhook,
  InboundMessageWebhook
} from 'loop-message';
```

## Troubleshooting

### Common Issues

#### Authentication Errors
```
Error: Authentication failed (401)
```
**Solution**: Verify your `loopAuthKey` and `loopSecretKey` are correct and not expired.

#### Message Not Delivered
```
Status: failed, Error code: 1009
```
**Solution**: Check that:
- The recipient number is correctly formatted with country code (e.g., `+1234567890`)
- Your sender name is properly configured in the Loop Message dashboard
- The recipient has iMessage enabled (for iMessage features)

#### Webhook Signature Validation Failed
```
Error: Invalid webhook signature
```
**Solution**: Ensure your `webhookSecretKey` matches the one configured in your Loop Message webhook settings.

#### Rate Limiting
```
Error: Rate limit exceeded (429)
```
**Solution**: The SDK includes automatic retry with exponential backoff. For high-volume applications, implement queuing.

### Debugging Tips

1. **Enable debug logging** to see detailed API requests and responses:
   ```typescript
   const sdk = new LoopSdk({
     // ... your config
     logLevel: 'debug'
   });
   ```

2. **Check message status** when delivery fails:
   ```typescript
   const status = await sdk.checkMessageStatus(messageId);
   console.log('Status:', status.status);
   console.log('Error code:', status.error_code);
   console.log('Error message:', status.error_message);
   ```

3. **Monitor events** to track the message lifecycle:
   ```typescript
   sdk.on('error', (error) => {
     console.error('SDK Error:', error);
   });
   ```

## Rate Limiting

The Loop Message API has rate limits to ensure service quality:

- **Default limits**: 100 requests per minute per API key
- **Burst capacity**: Short bursts above the limit are allowed
- **Status endpoint**: Not rate-limited for reliability

The SDK automatically handles rate limiting with:
- Exponential backoff retry logic
- Configurable retry attempts
- Rate limit headers parsing

Example of handling rate limits:
```typescript
import { retryWithExponentialBackoff } from 'loop-message';

const result = await retryWithExponentialBackoff(
  async () => sdk.sendMessage(params),
  {
    maxAttempts: 5,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    shouldRetry: (error) => error.code === 429 || error.code >= 500
  }
);
```

## Webhook Security Best Practices

### 1. Always Verify Signatures
The SDK automatically verifies webhook signatures when using the `parseWebhook` method:
```typescript
const payload = sdk.parseWebhook(requestBody, signature);
```

### 2. Use HTTPS
Always use HTTPS for your webhook endpoints in production.

### 3. Implement Idempotency
Store processed webhook IDs to handle potential duplicate deliveries:
```typescript
const processedWebhooks = new Set();

sdk.on('message_inbound', async (payload) => {
  if (processedWebhooks.has(payload.webhook_id)) {
    console.log('Duplicate webhook, skipping');
    return;
  }
  processedWebhooks.add(payload.webhook_id);
  
  // Process the webhook...
});
```

### 4. Set Appropriate Timeouts
Respond to webhooks quickly to avoid timeouts:
```typescript
app.post('/webhooks/loopmessage', async (req, res) => {
  // Respond immediately
  res.status(200).send('OK');
  
  // Process asynchronously
  setImmediate(() => {
    try {
      const payload = sdk.parseWebhook(req.body, req.headers['loop-signature']);
      // Handle the webhook...
    } catch (error) {
      console.error('Webhook processing error:', error);
    }
  });
});
```

## Migration Guide

### Migrating from Direct API Calls

If you're currently using direct HTTP calls to the Loop Message API, here's how to migrate:

#### Before (Direct API):
```typescript
const response = await fetch('https://server.loopmessage.com/api/v1/message/send/', {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${Buffer.from(`${authKey}:${secretKey}`).toString('base64')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    recipient: '+1234567890',
    text: 'Hello'
  })
});
```

#### After (SDK):
```typescript
const sdk = new LoopSdk({
  loopAuthKey: authKey,
  loopSecretKey: secretKey,
  senderName: 'your.sender@imsg.co'
});

const response = await sdk.sendMessage({
  recipient: '+1234567890',
  text: 'Hello'
});
```

### Benefits of Migration
- Automatic retry logic with exponential backoff
- Built-in error handling and typed errors
- Event emissions for monitoring
- Simplified webhook signature verification
- TypeScript support with full type safety
- Consistent API across all endpoints

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/loopmessage-sdk.git
cd loopmessage-sdk

# Install dependencies
npm install

# Run tests
npm test

# Build the project
npm run build
```

### Publishing

This project uses automated publishing via GitHub Actions:

#### For Maintainers

**Option 1: Manual Release (Recommended)**
1. Go to GitHub Actions → "Release" workflow
2. Click "Run workflow"
3. Choose version bump type (patch/minor/major)
4. The workflow will:
   - Run tests and linting
   - Bump version and update CHANGELOG.md
   - Create a GitHub release
   - Publish to NPM automatically

**Option 2: Tag-based Release**
```bash
# Create and push a version tag
npm run release:patch  # or release:minor, release:major
git push origin main --tags

# The publish workflow will trigger automatically
```

#### Required GitHub Secrets

To enable automated publishing, add these secrets to your GitHub repository:

- `NPM_TOKEN`: Your NPM automation token
  1. Go to [NPM Access Tokens](https://www.npmjs.com/settings/tokens)
  2. Generate a new "Automation" token
  3. Add it as `NPM_TOKEN` in GitHub repository secrets

#### Workflow Details

- **CI**: Runs on every push/PR (tests on Node 18, 20, 22)
- **Release**: Manual workflow for version bumps and releases  
- **Publish**: Automatic NPM publishing when version tags are pushed

## Support

- **Documentation**: [https://docs.loopmessage.com/](https://docs.loopmessage.com/)
- **API Status**: [https://status.loopmessage.com/](https://status.loopmessage.com/)
- **Support Email**: support@loopmessage.com

## License

MIT

## Links

- [LoopMessage API Documentation](https://docs.loopmessage.com/)
- [GitHub Repository](https://github.com/yourusername/loopmessage-sdk)
- [NPM Package](https://www.npmjs.com/package/loopmessage-sdk)
