#!/usr/bin/env ts-node
/**
 * Loop Messages SDK - Conversation Example
 *
 * This example demonstrates using the LoopMessageConversationService
 * to manage conversations, track message delivery, and handle incoming messages.
 */
import { LoopMessageConversationService, ConversationEvent } from '../src/LoopMessageConversation';
import { LoopMessageError } from '../src/errors/LoopMessageError';
import express from 'express';
import {
  API_CREDENTIALS,
  SENDER_CONFIG,
  GROUP_CONFIG,
  SERVER_CONFIG,
  LOGGER_CONFIG,
  printHeader,
  validateConfig,
} from './config';

// -----------------------------------------------------------------------------
// SETUP EXPRESS SERVER & CONVERSATION SERVICE
// -----------------------------------------------------------------------------

// Initialize the conversation service
const conversationService = new LoopMessageConversationService({
  loopAuthKey: API_CREDENTIALS.loopAuthKey,
  loopSecretKey: API_CREDENTIALS.loopSecretKey,
  senderName: SENDER_CONFIG.senderName,
  webhookAuthToken: API_CREDENTIALS.webhookSecretKey,
  statusPollingIntervalMs: 2000,
  statusMaxAttempts: 10,
  debug: LOGGER_CONFIG.enableDebugMode,
});

// Initialize Express for handling webhooks
const app = express();
app.use(express.json());

// Basic server health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Register the conversation webhook handler
app.post('/webhooks/loopmessage', conversationService.getWebhookMiddleware());

// ANSI color codes for terminal output
const COLOR = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

// -----------------------------------------------------------------------------
// CONVERSATION SERVICE EVENT HANDLERS
// -----------------------------------------------------------------------------

// Handle events from the conversation service
conversationService.on(ConversationEvent.MESSAGE_SENT, data => {
  console.log(`${COLOR.cyan}[EVENT] Message sent to ${data.threadKey}${COLOR.reset}`);
});

conversationService.on(ConversationEvent.MESSAGE_DELIVERED, data => {
  console.log(
    `${COLOR.green}[EVENT] Message ${data.messageId} delivered to ${data.threadKey} (${data.deliveryTime}ms)${COLOR.reset}`
  );
});

conversationService.on(ConversationEvent.MESSAGE_FAILED, data => {
  console.log(
    `${COLOR.red}[EVENT] Message ${data.messageId} failed (error code: ${data.errorCode})${COLOR.reset}`
  );
});

conversationService.on(ConversationEvent.MESSAGE_RECEIVED, data => {
  console.log(
    `${COLOR.blue}[EVENT] New message received from ${data.threadKey}: "${data.message.text}"${COLOR.reset}`
  );

  // Auto-reply to incoming messages
  if (data.message.text) {
    setTimeout(() => {
      sendReplyToMessage(data.threadKey, `You said: "${data.message.text}"`);
    }, 1000);
  }
});

conversationService.on(ConversationEvent.REACTION_RECEIVED, data => {
  console.log(
    `${COLOR.magenta}[EVENT] Reaction received on message ${data.messageId}: ${data.reaction}${COLOR.reset}`
  );
});

conversationService.on(ConversationEvent.STATUS_CHANGED, data => {
  console.log(
    `${COLOR.yellow}[EVENT] Message ${data.messageId} status changed: ${data.previous} → ${data.status}${COLOR.reset}`
  );
});

conversationService.on(ConversationEvent.ERROR, error => {
  console.error(`${COLOR.red}[EVENT] Error: ${error.message}${COLOR.reset}`);
});

// -----------------------------------------------------------------------------
// EXAMPLE FUNCTIONS
// -----------------------------------------------------------------------------

/**
 * Send a basic message and wait for delivery
 */
async function sendBasicMessage(): Promise<void> {
  console.log(`\n${COLOR.bold}Sending basic message and waiting for delivery...${COLOR.reset}`);

  try {
    const result = await conversationService.sendMessage(
      {
        recipient: SENDER_CONFIG.defaultRecipient,
        text: 'Hello from the Loop Conversation Service!',
      } as any,
      {
        waitForDelivery: true,
        trackStatus: true,
      }
    );

    if (result.success) {
      console.log(`${COLOR.green}✓ Message delivered successfully!${COLOR.reset}`);
      console.log(`Message ID: ${result.messageId}`);
      if (result.deliveryTime) {
        console.log(`Delivery time: ${result.deliveryTime}ms`);
      }
    } else {
      console.log(`${COLOR.red}✗ Message delivery failed or timed out!${COLOR.reset}`);
      if (result.errorCode) {
        console.log(`Error code: ${result.errorCode}`);
      }
      if (result.errorMessage) {
        console.log(`Error message: ${result.errorMessage}`);
      }
    }
  } catch (error) {
    if (error instanceof LoopMessageError) {
      console.error(`${COLOR.red}Error (${error.code}): ${error.message}${COLOR.reset}`);
      if (error.cause) console.error(`Cause: ${error.cause}`);
    } else {
      console.error(`${COLOR.red}Unexpected error:${COLOR.reset}`, error);
    }
  }
}

/**
 * Send a message with a visual effect
 */
async function sendMessageWithEffect(): Promise<void> {
  console.log(`\n${COLOR.bold}Sending message with effect...${COLOR.reset}`);

  try {
    const result = await conversationService.sendMessageWithEffect(
      {
        recipient: SENDER_CONFIG.defaultRecipient,
        text: 'This message has a special effect! 🎉',
        effect: 'confetti',
      } as any,
      {
        trackStatus: true,
      }
    );

    console.log(`${COLOR.green}Message with effect sent!${COLOR.reset}`);
    console.log(`Message ID: ${result.messageId}`);
    console.log(`Status will be tracked in event handlers...`);
  } catch (error) {
    if (error instanceof LoopMessageError) {
      console.error(`${COLOR.red}Error (${error.code}): ${error.message}${COLOR.reset}`);
    } else {
      console.error(`${COLOR.red}Unexpected error:${COLOR.reset}`, error);
    }
  }
}

/**
 * Send a message to a group
 */
async function sendGroupMessage(): Promise<void> {
  if (!GROUP_CONFIG.groupId) {
    console.log(`${COLOR.yellow}Skipping group message: No group ID provided.${COLOR.reset}`);
    return;
  }

  console.log(`\n${COLOR.bold}Sending message to group...${COLOR.reset}`);

  try {
    const result = await conversationService.sendMessage({
      group: GROUP_CONFIG.groupId,
      text: 'Hello everyone in this group! This is a test from the conversation service.',
    } as any);

    console.log(`${COLOR.green}Group message sent!${COLOR.reset}`);
    console.log(`Message ID: ${result.messageId}`);
  } catch (error) {
    if (error instanceof LoopMessageError) {
      console.error(`${COLOR.red}Error (${error.code}): ${error.message}${COLOR.reset}`);
    } else {
      console.error(`${COLOR.red}Unexpected error:${COLOR.reset}`, error);
    }
  }
}

/**
 * Utility to send a reply to a recipient or group
 */
async function sendReplyToMessage(threadKey: string, text: string): Promise<void> {
  try {
    // Check if threadKey is a group ID or recipient
    const isGroup = threadKey.indexOf('+') !== 0 && threadKey.indexOf('@') === -1;

    await conversationService.sendMessage({
      ...(isGroup ? { group: threadKey } : { recipient: threadKey }),
      text: text,
    } as any);

    // No need to log here as the event handlers will log the message
  } catch (error) {
    if (error instanceof LoopMessageError) {
      console.error(
        `${COLOR.red}Error sending reply (${error.code}): ${error.message}${COLOR.reset}`
      );
    } else {
      console.error(`${COLOR.red}Error sending reply:${COLOR.reset}`, error);
    }
  }
}

/**
 * Display conversation thread info
 */
function displayConversations(): void {
  console.log(`\n${COLOR.bold}Current conversation threads:${COLOR.reset}`);

  const conversations = conversationService.getConversations();
  if (conversations.length === 0) {
    console.log(`${COLOR.gray}No active conversations${COLOR.reset}`);
    return;
  }

  conversations.forEach(thread => {
    const threadKey = thread.recipient || thread.group || 'unknown';
    console.log(`\n${COLOR.bold}Thread: ${threadKey}${COLOR.reset}`);
    console.log(`Last activity: ${thread.lastActivity.toISOString()}`);
    console.log(`Messages: ${thread.messages.length}`);

    // Display last 3 messages in reverse order (newest first)
    const lastMessages = [...thread.messages].reverse().slice(0, 3);
    if (lastMessages.length > 0) {
      console.log(`\n${COLOR.bold}Recent messages:${COLOR.reset}`);
      lastMessages.forEach(msg => {
        const direction = msg.direction === 'inbound' ? '←' : '→';
        const statusColor =
          msg.status === 'sent' ? COLOR.green : msg.status === 'failed' ? COLOR.red : COLOR.yellow;
        console.log(
          `${COLOR.gray}[${new Date(msg.sentAt).toLocaleTimeString()}] ${COLOR.reset}` +
            `${direction} ${msg.text.substring(0, 30)}${msg.text.length > 30 ? '...' : ''} ` +
            `${statusColor}(${msg.status})${COLOR.reset}`
        );
      });
    }
  });
}

// -----------------------------------------------------------------------------
// MAIN FUNCTION
// -----------------------------------------------------------------------------
async function main(): Promise<void> {
  printHeader('LOOP MESSAGES SDK - CONVERSATION EXAMPLE');

  // Validate configuration
  validateConfig();

  // Start the Express server for webhooks
  const server = app.listen(SERVER_CONFIG.port, () => {
    console.log(`${COLOR.green}Webhook server running on port ${SERVER_CONFIG.port}${COLOR.reset}`);
    console.log(
      `Webhook URL: http://${SERVER_CONFIG.host}:${SERVER_CONFIG.port}/webhooks/loopmessage`
    );
    console.log(`This needs to be configured in your LoopMessage dashboard.`);
  });

  // Handle cleanup on exit
  process.on('SIGINT', () => {
    console.log(`\n${COLOR.yellow}Shutting down...${COLOR.reset}`);
    server.close();
    process.exit(0);
  });

  // Start the examples
  await sendBasicMessage();
  await sendMessageWithEffect();
  await sendGroupMessage();

  // After messages have been sent, display the conversation state
  setTimeout(() => {
    displayConversations();
    console.log(`\n${COLOR.gray}Server is running. Press Ctrl+C to exit.${COLOR.reset}`);
    console.log(`The server will continue to handle incoming messages and events.`);
  }, 5000);
}

// Run the main function
main().catch(error => {
  console.error(`${COLOR.red}Fatal error:${COLOR.reset}`, error);
  process.exit(1);
});

/* 
To run this example:

1. Configure your credentials in config.ts or set environment variables:
   - LOOP_AUTH_KEY - Your LoopMessage authorization key
   - LOOP_SECRET_KEY - Your LoopMessage secret key
   - WEBHOOK_SECRET_KEY - Your webhook authentication token
   - DEFAULT_RECIPIENT - A valid phone number to receive test messages

2. Run with: npx ts-node examples/conversation-example.ts

3. Make your server publicly accessible:
   - Use a tool like ngrok: `ngrok http 3000`
   - Or deploy to a cloud provider
   
4. Configure the webhook URL in your LoopMessage dashboard:
   - Webhook URL: https://your-public-url/webhooks/loopmessage

*/
