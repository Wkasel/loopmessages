#!/usr/bin/env ts-node
/**
 * Loop Messages SDK - Messaging Example
 *
 * This example demonstrates how to send various types of messages using the LoopMessageService.
 * It shows basic message sending, messages with effects, group messages, audio messages,
 * and tracking message status.
 */
import { LoopMessageService, LoopMessageError, MessageStatusChecker } from '../src';
import type { MessageEffect } from '../src';
import {
  API_CREDENTIALS,
  SENDER_CONFIG,
  GROUP_CONFIG,
  LOGGER_CONFIG,
  printHeader,
  printDivider,
  validateConfig,
} from './config';

// -----------------------------------------------------------------------------
// EXAMPLE-SPECIFIC CONFIGURATION
// -----------------------------------------------------------------------------
const EXAMPLE_CONFIG = {
  // Example Message Content
  messageText: 'Hello from the LoopMessageService example!',
  groupMessageText: 'Hello group, from the example!',

  // Message with Effect Example
  effectMessage: 'This message has a special effect! 🎉',
  messageEffect: (process.env.MESSAGE_EFFECT || 'confetti') as MessageEffect,

  // Audio Message Example
  audioUrl: process.env.AUDIO_URL || 'https://example.com/audio-sample.mp3',
};

// -----------------------------------------------------------------------------
// HELPER FUNCTIONS
// -----------------------------------------------------------------------------

/**
 * Print the result of an API call
 */
function printResult(result: any): void {
  if (LOGGER_CONFIG.enableDebugMode) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`Success! Message ID: ${result.message_id}`);
  }
}

/**
 * Initialize the LoopMessage service
 */
function initService(): LoopMessageService {
  return new LoopMessageService({
    loopAuthKey: API_CREDENTIALS.loopAuthKey,
    loopSecretKey: API_CREDENTIALS.loopSecretKey,
    senderName: SENDER_CONFIG.senderName,
    logLevel: LOGGER_CONFIG.defaultLogLevel,
  });
}

// -----------------------------------------------------------------------------
// EXAMPLE FUNCTIONS
// -----------------------------------------------------------------------------

/**
 * Example 1: Send a basic message to an individual recipient
 */
async function sendBasicMessage(service: LoopMessageService): Promise<void> {
  printHeader('Basic Message');

  try {
    console.log(`Sending message to ${SENDER_CONFIG.defaultRecipient}...`);

    const result = await service.sendLoopMessage({
      recipient: SENDER_CONFIG.defaultRecipient,
      text: EXAMPLE_CONFIG.messageText,
    });

    printResult(result);
  } catch (error) {
    if (error instanceof LoopMessageError) {
      console.error(`Error (${error.code}): ${error.message}`);
      if (error.cause) console.error(`Cause: ${error.cause}`);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

/**
 * Example 2: Send a message with a visual effect
 */
async function sendMessageWithEffect(service: LoopMessageService): Promise<void> {
  printHeader('Message with Effect');

  try {
    console.log(`Sending message with effect '${EXAMPLE_CONFIG.messageEffect}'...`);

    const result = await service.sendMessageWithEffect({
      recipient: SENDER_CONFIG.defaultRecipient,
      text: EXAMPLE_CONFIG.effectMessage,
      effect: EXAMPLE_CONFIG.messageEffect,
    });

    printResult(result);
  } catch (error) {
    if (error instanceof LoopMessageError) {
      console.error(`Error (${error.code}): ${error.message}`);
      if (error.cause) console.error(`Cause: ${error.cause}`);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

/**
 * Example 3: Send a group message
 */
async function sendGroupMessage(service: LoopMessageService): Promise<void> {
  printHeader('Group Message');

  if (!GROUP_CONFIG.groupId) {
    console.log('Skipping: No group ID configured. Set GROUP_ID env var or update config.ts.');
    return;
  }

  try {
    console.log(`Sending message to group ${GROUP_CONFIG.groupId}...`);

    const result = await service.sendLoopMessage({
      group: GROUP_CONFIG.groupId,
      text: EXAMPLE_CONFIG.groupMessageText,
    });

    printResult(result);
  } catch (error) {
    if (error instanceof LoopMessageError) {
      console.error(`Error (${error.code}): ${error.message}`);
      if (error.cause) console.error(`Cause: ${error.cause}`);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

/**
 * Example 4: Send a message and monitor status until delivery
 */
async function sendAndTrackMessage(
  service: LoopMessageService,
  statusChecker: MessageStatusChecker
): Promise<void> {
  printHeader('Status Tracking');

  try {
    console.log('Sending message and tracking delivery status...');

    // Send the message
    const result = await service.sendLoopMessage({
      recipient: SENDER_CONFIG.defaultRecipient,
      text: `Status tracking test at ${new Date().toISOString()}`,
    });

    const messageId = result.message_id;
    console.log(`Message sent with ID: ${messageId}`);
    console.log('Checking status until delivered or failed...');

    // Set up status event listeners
    statusChecker.on('status_check', data => {
      console.log(`Status check: ${data.status}`);
    });

    statusChecker.on('status_change', data => {
      console.log(`Status changed to: ${data.status}`);
    });

    // Wait for final status
    const finalStatus = await statusChecker.waitForStatus(
      messageId,
      ['sent', 'failed', 'timeout'],
      { maxAttempts: 5, delayMs: 2000 }
    );

    console.log(`Final status: ${finalStatus.status}`);
    if (finalStatus.status === 'sent') {
      console.log('✅ Message delivered successfully!');
    } else {
      console.log(`❌ Message delivery failed or timed out: ${finalStatus.status}`);
      if (finalStatus.error_code) {
        console.log(`Error code: ${finalStatus.error_code}`);
      }
    }
  } catch (error) {
    if (error instanceof LoopMessageError) {
      console.error(`Error (${error.code}): ${error.message}`);
      if (error.cause) console.error(`Cause: ${error.cause}`);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

/**
 * Example 5: Send an audio message
 */
async function sendAudioMessage(service: LoopMessageService): Promise<void> {
  printHeader('Audio Message');

  if (EXAMPLE_CONFIG.audioUrl === 'https://example.com/audio-sample.mp3') {
    console.log('Skipping: No valid audio URL configured. Set AUDIO_URL env var.');
    return;
  }

  try {
    console.log(`Sending audio message with URL: ${EXAMPLE_CONFIG.audioUrl}`);

    const result = await service.sendAudioMessage({
      recipient: SENDER_CONFIG.defaultRecipient,
      text: 'Here is an audio message for you!',
      media_url: EXAMPLE_CONFIG.audioUrl,
    });

    printResult(result);
  } catch (error) {
    if (error instanceof LoopMessageError) {
      console.error(`Error (${error.code}): ${error.message}`);
      if (error.cause) console.error(`Cause: ${error.cause}`);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

// -----------------------------------------------------------------------------
// MAIN EXAMPLE RUNNER
// -----------------------------------------------------------------------------
async function main(): Promise<void> {
  printHeader('LOOP MESSAGES SDK - MESSAGING EXAMPLES');

  // Validate configuration
  validateConfig();

  // Initialize services
  const service = initService();
  const statusChecker = new MessageStatusChecker({
    loopAuthKey: API_CREDENTIALS.loopAuthKey,
    loopSecretKey: API_CREDENTIALS.loopSecretKey,
    logLevel: LOGGER_CONFIG.defaultLogLevel,
  });

  // Set up event listeners
  service.on('error', error => {
    console.error('Service error:', error.message);
  });

  // Run examples
  await sendBasicMessage(service);
  printDivider();

  await sendMessageWithEffect(service);
  printDivider();

  await sendGroupMessage(service);
  printDivider();

  await sendAndTrackMessage(service, statusChecker);
  printDivider();

  await sendAudioMessage(service);

  printHeader('ALL EXAMPLES COMPLETED');
}

// Run all examples
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

/* 
To run this example:

1. Configure your credentials in config.ts or set environment variables:
   - LOOP_AUTH_KEY - Your LoopMessage authorization key
   - LOOP_SECRET_KEY - Your LoopMessage secret key
   - DEFAULT_RECIPIENT - A valid phone number to receive test messages

2. Run with: npx ts-node examples/messaging-example.ts

Optional environment variables:
- GROUP_ID - For group messaging example
- AUDIO_URL - For audio message example
- MESSAGE_EFFECT - Visual effect to use (default: confetti)
- DEBUG - Set to 'true' for detailed API responses
*/
