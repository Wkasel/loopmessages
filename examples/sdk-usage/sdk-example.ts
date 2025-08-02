#!/usr/bin/env ts-node
/**
 * Loop Messages SDK - SDK Example
 *
 * This example demonstrates the unified SDK interface with event handling.
 * The LoopSdk class provides a single entry point to all SDK functionality.
 */
import { LoopSdk, EVENTS } from '../../src/index.js';
import type { MessageEffect, MessageReaction } from '../../src/index.js';
import {
  API_CREDENTIALS,
  SENDER_CONFIG,
  GROUP_CONFIG,
  LOGGER_CONFIG,
  printHeader,
  validateConfig,
} from '../config';
import { handleError } from '../utils';

// -----------------------------------------------------------------------------
// EXAMPLE-SPECIFIC CONFIGURATION
// -----------------------------------------------------------------------------
const SDK_CONFIG = {
  // Message Content
  basicMessage: 'Hello from the Loop Message SDK!',
  effectMessage: 'This message has a cool effect! 🎉',
  messageEffect: (process.env.MESSAGE_EFFECT as MessageEffect) || 'confetti',

  // Reply and reaction
  messageId: process.env.MESSAGE_ID || '', // ID of message to react to or reply to
  reactionType: (process.env.REACTION_TYPE as MessageReaction) || 'love',
  replyMessage: 'This is a reply to your previous message!',

  // Audio Message
  audioUrl: process.env.AUDIO_URL || 'https://example.com/audio.mp3',
};

// -----------------------------------------------------------------------------
// EVENT HANDLING
// -----------------------------------------------------------------------------

/**
 * Set up event listeners for the SDK
 */
function setupEventListeners(sdk: LoopSdk): void {
  printHeader('Setting Up Event Listeners');

  // Message sending events
  sdk.on(EVENTS.SEND_START, data => {
    console.log(`🚀 Starting to send message to ${data.params.recipient || data.params.group}`);
  });

  sdk.on(EVENTS.SEND_SUCCESS, data => {
    console.log(`✅ Message sent successfully with ID: ${data.response.message_id}`);
  });

  sdk.on(EVENTS.SEND_ERROR, data => {
    console.log(`❌ Error sending message: ${data.error.message}`);
  });

  // Status check events
  sdk.on(EVENTS.STATUS_CHECK, data => {
    console.log(`🔍 Checking status for message: ${data.messageId}`);
  });

  sdk.on(EVENTS.STATUS_CHANGE, data => {
    console.log(
      `📊 Status changed from ${data.oldStatus} to ${data.newStatus} for message: ${data.messageId}`
    );
  });

  // Auth events
  sdk.on(EVENTS.AUTH_START, () => {
    console.log(`🔒 Starting authentication request`);
  });

  sdk.on(EVENTS.AUTH_SUCCESS, data => {
    console.log(`🔑 Authentication request successful with ID: ${data.response.request_id}`);
  });

  // Generic error event
  sdk.on('error', error => {
    console.error(`🔥 SDK Error: ${error.message}`);
  });

  console.log('Event listeners set up successfully!');
}

// -----------------------------------------------------------------------------
// EXAMPLE FUNCTIONS
// -----------------------------------------------------------------------------

/**
 * Initialize the SDK
 */
function initializeSDK() {
  printHeader('Initializing SDK');

  try {
    // Create an instance of the unified SDK
    const sdk = new LoopSdk({
      loopAuthKey: API_CREDENTIALS.loopAuthKey,
      loopSecretKey: API_CREDENTIALS.loopSecretKey,
      senderName: SENDER_CONFIG.senderName,
      logLevel: LOGGER_CONFIG.defaultLogLevel,
      webhook: API_CREDENTIALS.webhookSecretKey
        ? {
            secretKey: API_CREDENTIALS.webhookSecretKey,
          }
        : undefined,
    });

    console.log('SDK initialized successfully!');

    // Set up event listeners
    setupEventListeners(sdk);

    return sdk;
  } catch (error) {
    handleError(error);
    process.exit(1);
  }
}

/**
 * Example: Send a basic message
 */
async function sendBasicMessage(sdk: LoopSdk) {
  printHeader('Sending Basic Message');

  try {
    const result = await sdk.sendMessage({
      recipient: SENDER_CONFIG.defaultRecipient,
      text: SDK_CONFIG.basicMessage,
    });

    console.log(`Message sent with ID: ${result.message_id}`);
    return result;
  } catch (error) {
    handleError(error);
    return null;
  }
}

/**
 * Example: Send a group message
 */
async function sendGroupMessage(sdk: LoopSdk) {
  printHeader('Sending Group Message');

  if (!GROUP_CONFIG.groupId) {
    console.log('No group ID provided, skipping group message example');
    return null;
  }

  try {
    const result = await sdk.sendMessage({
      group: GROUP_CONFIG.groupId,
      text: 'Hello group members!',
    });

    console.log(`Group message sent with ID: ${result.message_id}`);
    console.log(`Group ID: ${GROUP_CONFIG.groupId}`);
    console.log(`Participants: ${GROUP_CONFIG.participants.join(', ')}`);
    return result;
  } catch (error) {
    handleError(error);
    return null;
  }
}

/**
 * Example: Send a message with effect
 */
async function sendMessageWithEffect(sdk: LoopSdk) {
  printHeader('Sending Message with Effect');

  try {
    const result = await sdk.sendMessageWithEffect({
      recipient: SENDER_CONFIG.defaultRecipient,
      text: SDK_CONFIG.effectMessage,
      effect: SDK_CONFIG.messageEffect,
    });

    console.log(`Effect message sent with ID: ${result.message_id}`);
    console.log(`Effect: ${SDK_CONFIG.messageEffect}`);
    return result;
  } catch (error) {
    handleError(error);
    return null;
  }
}

/**
 * Example: Send a reaction to a message
 */
async function sendReaction(sdk: LoopSdk) {
  printHeader('Sending Reaction');

  if (!SDK_CONFIG.messageId) {
    console.log('No message ID provided, skipping reaction example');
    return null;
  }

  try {
    const result = await sdk.sendReaction({
      text: '', // Empty text is required for reactions
      recipient: SENDER_CONFIG.defaultRecipient,
      message_id: SDK_CONFIG.messageId,
      reaction: SDK_CONFIG.reactionType,
    });

    console.log(`Reaction sent with ID: ${result.message_id}`);
    console.log(`Reaction: ${SDK_CONFIG.reactionType}`);
    return result;
  } catch (error) {
    handleError(error);
    return null;
  }
}

/**
 * Example: Send a reply to a message
 */
async function sendReply(sdk: LoopSdk) {
  printHeader('Sending Reply');

  if (!SDK_CONFIG.messageId) {
    console.log('No message ID provided, skipping reply example');
    return null;
  }

  try {
    const result = await sdk.sendReply({
      recipient: SENDER_CONFIG.defaultRecipient,
      text: SDK_CONFIG.replyMessage,
      reply_to_id: SDK_CONFIG.messageId,
    });

    console.log(`Reply sent with ID: ${result.message_id}`);
    return result;
  } catch (error) {
    handleError(error);
    return null;
  }
}

/**
 * Example: Send an audio message
 */
async function sendAudioMessage(sdk: LoopSdk) {
  printHeader('Sending Audio Message');

  if (!SDK_CONFIG.audioUrl || SDK_CONFIG.audioUrl === 'https://example.com/audio.mp3') {
    console.log('No valid audio URL provided, skipping audio message example');
    return null;
  }

  try {
    const result = await sdk.sendAudioMessage({
      recipient: SENDER_CONFIG.defaultRecipient,
      text: 'Audio message',
      media_url: SDK_CONFIG.audioUrl,
    });

    console.log(`Audio message sent with ID: ${result.message_id}`);
    return result;
  } catch (error) {
    handleError(error);
    return null;
  }
}

/**
 * Example: Check message status
 */
async function checkMessageStatus(sdk: LoopSdk, messageId: string) {
  printHeader('Checking Message Status');

  try {
    const status = await sdk.checkMessageStatus(messageId);
    console.log(`Status for message ${messageId}: ${status.status}`);

    if (status.error_code) {
      console.log(`Error code: ${status.error_code}`);
    }

    return status;
  } catch (error) {
    handleError(error);
    return null;
  }
}

/**
 * Example: Wait for message status
 */
async function waitForMessageStatus(sdk: LoopSdk, messageId: string) {
  printHeader('Waiting for Message Status');

  try {
    console.log(`Waiting for message ${messageId} to be delivered...`);

    const status = await sdk.waitForMessageStatus(messageId, ['sent', 'failed', 'timeout'], {
      maxAttempts: 5,
      delayMs: 2000,
    });

    console.log(`Final status for message ${messageId}: ${status.status}`);

    if (status.status === 'sent') {
      console.log('Message was delivered successfully!');
    } else if (status.status === 'failed') {
      console.log(`Message delivery failed: ${status.error_code}`);
    } else if (status.status === 'timeout') {
      console.log('Message delivery timed out');
    }

    return status;
  } catch (error) {
    handleError(error);
    return null;
  }
}

/**
 * Example: Initiate authentication request
 */
async function initiateAuth(sdk: LoopSdk) {
  printHeader('Initiating Authentication Request');

  try {
    const passthrough = JSON.stringify({
      user_id: 'example_user',
      timestamp: new Date().toISOString(),
    });

    const result = await sdk.initiateAuth(passthrough);

    console.log(`Authentication request initiated with ID: ${result.request_id}`);
    console.log(`iMessage Link: ${result.imessage_link}`);
    console.log(
      'The user needs to click on this link and send the message to complete authentication'
    );

    return result;
  } catch (error) {
    handleError(error);
    return null;
  }
}

// -----------------------------------------------------------------------------
// MAIN FUNCTION
// -----------------------------------------------------------------------------
async function main() {
  printHeader('LOOP MESSAGES SDK - UNIFIED SDK EXAMPLE');

  // Validate configuration
  validateConfig();

  // Check if API keys are set
  if (
    API_CREDENTIALS.loopAuthKey === 'your-auth-key-here' ||
    API_CREDENTIALS.loopSecretKey === 'your-secret-key-here'
  ) {
    console.error(
      'Please set your Loop API credentials in the .env file or as environment variables'
    );
    process.exit(1);
  }

  // Initialize the SDK
  const sdk = initializeSDK();

  // Start with a basic message
  const basicResult = await sendBasicMessage(sdk);

  // Send a message with effect
  await sendMessageWithEffect(sdk);

  // If we have a message ID, send a reaction and reply
  if (SDK_CONFIG.messageId) {
    await sendReaction(sdk);
    await sendReply(sdk);
  } else if (basicResult) {
    // If we don't have a message ID but we sent a basic message, use that ID
    console.log(`\nUsing ID from basic message: ${basicResult.message_id}`);

    // Check the status of the message we just sent
    await checkMessageStatus(sdk, basicResult.message_id);

    // Wait for the message to be delivered
    await waitForMessageStatus(sdk, basicResult.message_id);
  }

  // Try sending a group message if we have a group ID
  await sendGroupMessage(sdk);

  // Try sending an audio message if we have an audio URL
  await sendAudioMessage(sdk);

  // Initiate authentication request
  await initiateAuth(sdk);

  printHeader('ALL EXAMPLES COMPLETED');
}

// Run the main function
main().catch(error => {
  console.error('Unexpected error in main function:');
  console.error(error);
  process.exit(1);
});
