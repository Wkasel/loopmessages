#!/usr/bin/env ts-node
/**
 * Loop Messages SDK - Status Checking Example
 *
 * This example demonstrates how to check the status of sent messages,
 * how to track message delivery, and how to implement polling for status updates.
 */
import { MessageStatusChecker, LoopMessageService, LoopMessageError } from '../../src';
import type { MessageStatusResponse } from '../../src';
import { API_CREDENTIALS, SENDER_CONFIG, LOGGER_CONFIG, printHeader } from '../config';

// Custom interface extending MessageStatusResponse with additional properties
interface ExtendedMessageStatus extends MessageStatusResponse {
  delivered_at?: string;
  error_message?: string;
}

// -----------------------------------------------------------------------------
// CONFIGURATION
// -----------------------------------------------------------------------------
const STATUS_CONFIG = {
  // Optional: Message ID to check (if not sending a test message)
  messageId: process.env.MESSAGE_ID || '',

  // Status polling options
  pollIntervalMs: process.env.POLL_INTERVAL_MS ? parseInt(process.env.POLL_INTERVAL_MS) : 2000,
  maxAttempts: process.env.MAX_ATTEMPTS ? parseInt(process.env.MAX_ATTEMPTS) : 10,

  // Color output (can disable for CI environments)
  colorOutput: process.env.NO_COLOR !== 'true',
};

// -----------------------------------------------------------------------------
// COLOR FORMATTING
// -----------------------------------------------------------------------------
const COLOR = {
  reset: STATUS_CONFIG.colorOutput ? '\x1b[0m' : '',
  bold: STATUS_CONFIG.colorOutput ? '\x1b[1m' : '',
  red: STATUS_CONFIG.colorOutput ? '\x1b[31m' : '',
  green: STATUS_CONFIG.colorOutput ? '\x1b[32m' : '',
  yellow: STATUS_CONFIG.colorOutput ? '\x1b[33m' : '',
  blue: STATUS_CONFIG.colorOutput ? '\x1b[34m' : '',
  magenta: STATUS_CONFIG.colorOutput ? '\x1b[35m' : '',
  cyan: STATUS_CONFIG.colorOutput ? '\x1b[36m' : '',
  grey: STATUS_CONFIG.colorOutput ? '\x1b[90m' : '',
};

// -----------------------------------------------------------------------------
// HELPER FUNCTIONS
// -----------------------------------------------------------------------------

/**
 * Initialize the StatusChecker service
 */
function initStatusChecker(): MessageStatusChecker {
  return new MessageStatusChecker({
    loopAuthKey: API_CREDENTIALS.loopAuthKey,
    loopSecretKey: API_CREDENTIALS.loopSecretKey,
    logLevel: LOGGER_CONFIG.defaultLogLevel,
  });
}

/**
 * Initialize the LoopMessage service (for sending test messages)
 */
function initMessageService(): LoopMessageService {
  return new LoopMessageService({
    loopAuthKey: API_CREDENTIALS.loopAuthKey,
    loopSecretKey: API_CREDENTIALS.loopSecretKey,
    senderName: SENDER_CONFIG.senderName,
    logLevel: LOGGER_CONFIG.defaultLogLevel,
  });
}

/**
 * Format and display a status object
 */
function displayStatus(status: ExtendedMessageStatus, prefix = ''): void {
  const statusColor = getStatusColor(status.status);

  console.log(`${prefix}Status: ${statusColor}${status.status}${COLOR.reset}`);

  if (status.delivered_at) {
    console.log(`${prefix}Delivered at: ${COLOR.green}${status.delivered_at}${COLOR.reset}`);
  }

  if (status.error_code) {
    console.log(`${prefix}Error code: ${COLOR.red}${status.error_code}${COLOR.reset}`);
  }

  if (status.error_message) {
    console.log(`${prefix}Error message: ${COLOR.red}${status.error_message}${COLOR.reset}`);
  }
}

/**
 * Get color for message status
 */
function getStatusColor(status: string): string {
  switch (status) {
    case 'queued':
    case 'processing':
      return COLOR.yellow;
    case 'sent':
      return COLOR.green;
    case 'failed':
    case 'timeout':
      return COLOR.red;
    default:
      return COLOR.reset;
  }
}

// -----------------------------------------------------------------------------
// EXAMPLE FUNCTIONS
// -----------------------------------------------------------------------------

/**
 * Example 1: Check status of a specific message ID
 */
async function checkSpecificMessageStatus(
  statusChecker: MessageStatusChecker,
  messageId: string
): Promise<void> {
  printHeader('Checking Status for Specific Message ID');

  try {
    console.log(`Checking status for message ID: ${COLOR.bold}${messageId}${COLOR.reset}`);

    const status = await statusChecker.checkStatus(messageId);
    displayStatus(status as ExtendedMessageStatus);
  } catch (error) {
    if (error instanceof LoopMessageError) {
      console.error(`${COLOR.red}Error (${error.code}): ${error.message}${COLOR.reset}`);
    } else {
      console.error(`${COLOR.red}Unexpected error:${COLOR.reset}`, error);
    }
  }
}

/**
 * Example 2: Send a test message and track its status until completion
 */
async function sendAndTrackMessage(
  messageService: LoopMessageService,
  statusChecker: MessageStatusChecker
): Promise<void> {
  printHeader('Sending and Tracking New Message');

  try {
    // Send a test message
    console.log(
      `Sending test message to ${COLOR.bold}${SENDER_CONFIG.defaultRecipient}${COLOR.reset}...`
    );

    const result = await messageService.sendLoopMessage({
      recipient: SENDER_CONFIG.defaultRecipient,
      text: `Status test message sent at ${new Date().toISOString()}`,
    });

    const messageId = result.message_id;
    console.log(
      `${COLOR.green}✓${COLOR.reset} Message sent with ID: ${COLOR.bold}${messageId}${COLOR.reset}`
    );

    // Track status changes
    console.log(
      `\nTracking status changes (polling every ${STATUS_CONFIG.pollIntervalMs}ms, max ${STATUS_CONFIG.maxAttempts} attempts):`
    );
    console.log(`${COLOR.grey}Press Ctrl+C to stop tracking${COLOR.reset}`);

    // Keep track of status changes
    let lastStatus: string | null = null;
    let attempts = 0;

    // Do initial check
    console.log(`\n${COLOR.grey}Checking initial status...${COLOR.reset}`);
    attempts++;

    try {
      const initialStatus = await statusChecker.checkStatus(messageId);
      const extendedInitialStatus = initialStatus as ExtendedMessageStatus;

      const timestamp = new Date().toISOString().substring(11, 19);
      console.log(`\n${COLOR.grey}[${timestamp}] Initial check:${COLOR.reset}`);
      displayStatus(extendedInitialStatus, '  ');
      lastStatus = initialStatus.status;

      // Check if the status is terminal already
      if (['sent', 'failed', 'timeout'].includes(initialStatus.status)) {
        console.log(
          `\n${COLOR.bold}Message already reached terminal status: ${getStatusColor(
            initialStatus.status
          )}${initialStatus.status}${COLOR.reset}`
        );
        return;
      }
    } catch (error) {
      console.error(`\n${COLOR.red}Error checking initial status:${COLOR.reset}`, error);
    }

    // If we get here, we need to poll for status changes
    console.log(`\n${COLOR.grey}Waiting for status updates...${COLOR.reset}`);

    // Track the latest status we've received
    let finalStatus: MessageStatusResponse | null = null;

    // Manually poll until terminal status or max attempts
    while (attempts < STATUS_CONFIG.maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, STATUS_CONFIG.pollIntervalMs));
      attempts++;

      try {
        const status = await statusChecker.checkStatus(messageId);
        finalStatus = status;

        // Only display if status changed
        if (lastStatus !== status.status) {
          const timestamp = new Date().toISOString().substring(11, 19);
          console.log(`\n${COLOR.grey}[${timestamp}] Status changed:${COLOR.reset}`);
          displayStatus(status as ExtendedMessageStatus, '  ');
          lastStatus = status.status;
        } else {
          process.stdout.write('.');
        }

        // Exit loop if we reach a terminal status
        if (['sent', 'failed', 'timeout'].includes(status.status)) {
          break;
        }
      } catch (error) {
        console.error(`\n${COLOR.red}Error checking status:${COLOR.reset}`, error);
      }
    }

    // Show final result if we have one
    if (finalStatus) {
      console.log(`\n\n${COLOR.bold}Final Status:${COLOR.reset}`);
      displayStatus(finalStatus as ExtendedMessageStatus, '  ');

      if (finalStatus.status === 'sent') {
        console.log(`\n${COLOR.green}✓ Message delivered successfully!${COLOR.reset}`);
      } else {
        console.log(`\n${COLOR.red}✗ Message delivery failed or timed out!${COLOR.reset}`);
      }
    } else {
      console.log(
        `\n${COLOR.red}✗ Failed to determine message status after ${STATUS_CONFIG.maxAttempts} attempts${COLOR.reset}`
      );
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
 * Example 3: Bulk check multiple message statuses
 */
async function bulkCheckStatuses(
  statusChecker: MessageStatusChecker,
  messageIds: string[]
): Promise<void> {
  printHeader('Bulk Status Check for Multiple Messages');

  if (messageIds.length === 0) {
    console.log(`${COLOR.yellow}No message IDs provided for bulk check.${COLOR.reset}`);
    return;
  }

  console.log(`Checking status for ${messageIds.length} message IDs...`);

  try {
    const results = await Promise.allSettled(messageIds.map(id => statusChecker.checkStatus(id)));

    console.log(`\n${COLOR.bold}Results:${COLOR.reset}`);

    results.forEach((result, index) => {
      const messageId = messageIds[index];
      console.log(`\n${COLOR.bold}Message ID: ${messageId}${COLOR.reset}`);

      if (result.status === 'fulfilled') {
        displayStatus(result.value as ExtendedMessageStatus, '  ');
      } else {
        console.log(`  ${COLOR.red}Error: ${result.reason.message}${COLOR.reset}`);
      }
    });
  } catch (error) {
    console.error(`${COLOR.red}Unexpected error during bulk check:${COLOR.reset}`, error);
  }
}

// -----------------------------------------------------------------------------
// MAIN SCRIPT
// -----------------------------------------------------------------------------
async function main(): Promise<void> {
  console.log(`${COLOR.bold}${COLOR.cyan}LoopMessage Status Checking Example${COLOR.reset}`);
  console.log(`${COLOR.grey}==================================${COLOR.reset}`);

  // Check for valid configuration
  if (
    API_CREDENTIALS.loopAuthKey === 'YOUR_LOOP_AUTH_KEY' ||
    API_CREDENTIALS.loopSecretKey === 'YOUR_LOOP_SECRET_KEY'
  ) {
    console.error(
      `${COLOR.red}❌ Please configure your API credentials in the CONFIG object or set environment variables.${COLOR.reset}`
    );
    process.exit(1);
  }

  // Initialize services
  const statusChecker = initStatusChecker();

  // Example 1: Check status of specific message if provided
  if (STATUS_CONFIG.messageId) {
    await checkSpecificMessageStatus(statusChecker, STATUS_CONFIG.messageId);
  } else {
    console.log(
      `${COLOR.yellow}No MESSAGE_ID provided, skipping specific message check.${COLOR.reset}`
    );
    console.log('You can set MESSAGE_ID environment variable to check a specific message.');
  }

  // Example 2: Send and track a new message
  const messageService = initMessageService();
  await sendAndTrackMessage(messageService, statusChecker);

  // Example 3: Bulk status check (if we have message IDs to check)
  // This would be used in a real application where you're tracking multiple messages
  // For this example, we'll use the message ID we just created
  // In a real app, you might store these IDs in a database
  const messageIdsForBulkCheck: string[] = [];

  // If we have a specific message ID from config, add it
  if (STATUS_CONFIG.messageId) {
    messageIdsForBulkCheck.push(STATUS_CONFIG.messageId);
  }

  // If we have enough message IDs for a meaningful bulk check
  if (messageIdsForBulkCheck.length > 0) {
    await bulkCheckStatuses(statusChecker, messageIdsForBulkCheck);
  }

  console.log(`\n${COLOR.green}All examples completed!${COLOR.reset}`);
}

// Run the main function
main().catch(error => {
  console.error(`${COLOR.red}Fatal error:${COLOR.reset}`, error);
  process.exit(1);
});

/* 
To run this example:

1. Install dependencies:
   npm install axios typescript @types/node ts-node

2. Configure your API credentials:
   - Set LOOP_AUTH_KEY and LOOP_SECRET_KEY environment variables
   - Or update the CONFIG object above

3. Run with: ts-node examples/status-example.ts

Optional environment variables:
- MESSAGE_ID - Check status of a specific message
- TEST_RECIPIENT - Phone number to send test message to
- POLL_INTERVAL_MS - Milliseconds between status checks (default: 2000)
- MAX_ATTEMPTS - Maximum number of status checks (default: 10)
- NO_COLOR - Set to 'true' to disable colored output
*/
