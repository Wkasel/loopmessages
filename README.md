# LoopMessage API Client

A TypeScript client for the LoopMessage API, enabling seamless integration of iMessage and SMS messaging within your Node.js applications.

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
npm install loop-message
```

## Quick Start with the Unified SDK

```typescript
import { LoopSdk, EVENTS } from 'loop-message';

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
import { LoopMessageService } from 'loop-message';

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
import { MessageStatusChecker, STATUS_EVENTS } from 'loop-message';

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

## Event-Based Architecture

LoopMessage SDK uses an event-based architecture with the `EventService` base class:

```typescript
import { EventService, createLogger, type LogLevel } from 'loop-message';

// Define your event types
const MY_EVENTS = {
  PROCESS_STARTED: 'process_started',
  PROCESS_COMPLETED: 'process_completed',
  PROCESS_FAILED: 'process_failed',
};

// Create a custom service with events
class MyService extends EventService {
  constructor(logLevel: LogLevel = 'info') {
    super(logLevel);
    this.logger.info('MyService initialized');
  }
  
  async processData(data: any) {
    this.logger.debug('Processing data', { data });
    
    try {
      // Emit start event
      this.emitEvent(MY_EVENTS.PROCESS_STARTED, { data });
      
      // Do processing...
      const result = await this.doProcessing(data);
      
      // Emit completion event
      this.emitEvent(MY_EVENTS.PROCESS_COMPLETED, { result });
      return result;
    } catch (error) {
      // Emit error event
      this.emitError(error);
      
      // Emit failure event
      this.emitEvent(MY_EVENTS.PROCESS_FAILED, { error, data });
      throw error;
    }
  }
  
  private async doProcessing(data: any) {
    // Your implementation here
    return { processed: true, data };
  }
}

// Using the service
const myService = new MyService('debug');

// Listen for events
myService.on(MY_EVENTS.PROCESS_STARTED, (data) => {
  console.log('Process started:', data);
});

myService.on(MY_EVENTS.PROCESS_COMPLETED, (data) => {
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

## License

MIT

## Links

- [LoopMessage API Documentation](https://docs.loopmessage.com/)
- [GitHub Repository](https://github.com/yourusername/loop-message)
