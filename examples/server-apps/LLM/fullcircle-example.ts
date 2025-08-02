#!/usr/bin/env ts-node
import 'dotenv/config';
/**
 * Loop Messages SDK - Full Circle OpenAI Example
 *
 * This example demonstrates a full-circle interaction:
 * 1. Receives an inbound message via a LoopMessage webhook.
 * 2. (Placeholder) Processes the message using OpenAI.
 * 3. Sends a reply back to the user.
 *
 * It requires a publicly accessible webhook URL (e.g., using ngrok).
 */
import * as express from 'express';
import type { Request, Response } from 'express';
import { LoopMessageService } from '../../../src/index.js';
import type {
  InboundMessageWebhook,
  SendMessageParams,
  WebhookPayload,
} from '../../../src/types.js';
import OpenAI from 'openai'; // Added OpenAI import
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

// --- Configuration (Replace with your actual values or use environment variables) ---
const LOOP_AUTH_KEY = process.env.LOOP_AUTH_KEY || 'YOUR_LOOP_AUTH_KEY';
const LOOP_SECRET_KEY = process.env.LOOP_SECRET_KEY || 'YOUR_LOOP_SECRET_KEY';
// Webhook secret key not used in this example as we use bearer token auth
const SENDER_NAME = process.env.SENDER_NAME || 'your.sender@imsg.co';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY';
const PORT = process.env.PORT || 3000;
const EXPECTED_BEARER_TOKEN = process.env.WEBHOOK_BEARER_TOKEN || 'your-bearer-token'; // Your configured static token

// Basic validation
if (
  LOOP_AUTH_KEY === 'YOUR_LOOP_AUTH_KEY' ||
  LOOP_SECRET_KEY === 'YOUR_LOOP_SECRET_KEY' ||
  /* WEBHOOK_SECRET_KEY === 'YOUR_WEBHOOK_SECRET_KEY' || */
  SENDER_NAME === 'your.sender@imsg.co'
) {
  console.warn(
    'Please configure your LoopMessage credentials and Sender Name in fullcircle-example.ts or via environment variables.'
  );
}
if (OPENAI_API_KEY === 'YOUR_OPENAI_API_KEY') {
  console.warn('Please configure your OpenAI API key.');
}

// --- Initialize Services ---
const app = express();

const loopService = new LoopMessageService({
  loopAuthKey: LOOP_AUTH_KEY,
  loopSecretKey: LOOP_SECRET_KEY,
  senderName: SENDER_NAME, // Default sender for replies
  logLevel: 'info',
});

// Webhook handler not used in this example as we handle webhooks manually with bearer token auth

const openai = new OpenAI({ apiKey: OPENAI_API_KEY }); // Initialize OpenAI client

// --- Onboarding Script for Omny ---
// This script defines phases/topics Omny should try to cover.
// It's designed to be easily editable.
const ONBOARDING_SCRIPT_PHASES: string[] = [
  'Introduce yourself as Omny, a new proactive assistant, and warmly welcome the user.',
  'Briefly explain that Omny can help manage tasks, appointments, and communications proactively.',
  "Ask for the user's first name to personalize the experience (e.g., 'What should I call you?').",
  "Once the name is provided, confirm it and ask for their preferred email address to complete onboarding (explaining it's for account setup or notifications).",
  `After confirming their email, thank them, mention that your contact card (with avatar) should also be on its way`,
  'Then, let them know the initial onboarding is complete.',
  "Let them know they can ask any questions they have about Omny or just say 'hi' to start interacting.",
  'If the user asks questions or deviates, answer naturally then try to steer back to the current onboarding goal if appropriate.',
];

// --- Conversation History Store ---
const conversationHistories: Record<string, ChatCompletionMessageParam[]> = {}; // Key: userContact (e.g., phone number)

// Add middleware to log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  next();
});

// --- Webhook Endpoint ---
// This route handles incoming webhooks from LoopMessage.
// It uses express.raw() to get the raw request body for signature verification.
app.post(
  '/webhooks/loopmessage',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    console.log('[Webhook] POST /webhooks/loopmessage received');
    const authorizationHeader = req.headers['authorization'] as string;
    const rawBody = req.body.toString();

    console.log('[Webhook] Raw body received:', rawBody);
    console.log('[Webhook] All incoming headers:', JSON.stringify(req.headers, null, 2));
    console.log('[Webhook] Authorization header received:', authorizationHeader);

    let authorized = false;
    let authDebugInfo = '';

    if (authorizationHeader) {
      // Handle both "Bearer token" and just "token" formats
      const parts = authorizationHeader.split(' ');

      if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        // Format: "Bearer omnydeveloper"
        authorized = parts[1] === EXPECTED_BEARER_TOKEN;
        authDebugInfo = `Bearer format - Token: "${parts[1]}", Expected: "${EXPECTED_BEARER_TOKEN}", Match: ${authorized}`;
      } else if (parts.length === 1) {
        // Format: "omnydeveloper" (Loop Message sends just the value)
        authorized = authorizationHeader === EXPECTED_BEARER_TOKEN;
        authDebugInfo = `Direct format - Token: "${authorizationHeader}", Expected: "${EXPECTED_BEARER_TOKEN}", Match: ${authorized}`;
      } else {
        authDebugInfo = `Unexpected format - Full header: "${authorizationHeader}", Parts: ${parts.length}`;
      }
    } else {
      authDebugInfo = 'No Authorization header present';
    }

    console.log(`[Webhook] Auth Debug: ${authDebugInfo}`);

    if (!authorized) {
      console.error('[Webhook] Unauthorized: Bearer token mismatch or missing.');
      console.error(
        `[Webhook] Expected one of: "Bearer ${EXPECTED_BEARER_TOKEN}" or "${EXPECTED_BEARER_TOKEN}"`
      );
      console.error(`[Webhook] Received: "${authorizationHeader}"`);
      return res.status(401).json({
        error: 'Unauthorized',
        debug: {
          expected: [`Bearer ${EXPECTED_BEARER_TOKEN}`, EXPECTED_BEARER_TOKEN],
          received: authorizationHeader,
          authDebugInfo,
        },
      });
    }

    try {
      console.log('[Webhook] Authorized. Proceeding to parse and handle webhook.');
      const parsedJson = JSON.parse(rawBody); // Parse first without type assertion

      // Adapt the incoming JSON to the WebhookPayload structure expected by the SDK
      let adaptedFromField: string | undefined = undefined;
      if (parsedJson.alert_type === 'message_inbound') {
        adaptedFromField = parsedJson.recipient; // For inbound, 'recipient' is the sender
      }
      // For other types like 'message_reaction', 'recipient' might mean something else
      // or 'from' might already exist. This needs careful handling per event type if used.

      const payload: WebhookPayload = {
        type: parsedJson.alert_type,
        timestamp: parsedJson.timestamp || new Date().toISOString(),
        ...parsedJson, // Spread the rest of the properties first
        // Then explicitly set/override fields that need mapping or are crucial for SDK types
        from: adaptedFromField, // Add 'from' field, potentially undefined if not inbound
        // Ensure 'recipient' from original payload is not lost if needed by other types,
        // though for InboundMessageWebhook, 'from' is primary for sender.
        // If 'recipient' had a different meaning for inbound (e.g. your service's ID),
        // and SDK expected that too, then explicit mapping is better than just spreading.
      } as any; // Use 'as any' temporarily then refine to specific WebhookPayload subtypes

      // Cast to the most common expected type for logging, but handlers should assert specific types
      const specificPayload = payload as InboundMessageWebhook;

      if (!specificPayload.type /* || !specificPayload.timestamp */) {
        // Timestamp is now guaranteed
        console.error('[Webhook] Invalid payload: missing type after adaptation.');
        return res.status(400).json({ error: 'Invalid payload structure after adaptation' });
      }

      console.log(
        `[Webhook] Adapted & validated payload type: ${specificPayload.type}, from: ${specificPayload.from}`
      );

      // Note: Since we're using bearer token auth instead of signature verification,
      // we're handling webhooks manually rather than using WebhookHandler.parseWebhook

      // Handle the webhook based on type
      if (specificPayload.type === 'message_inbound') {
        await handleInboundMessageWithSpeech(specificPayload as InboundMessageWithSpeech);
      }
      await handleWebhook(specificPayload);

      res.status(200).json({ typing: 3, read: true });
      console.log('[Webhook] Responded 200 OK with typing/read indicators.');
    } catch (error: any) {
      console.error('[Webhook] Error processing webhook after auth:', error.message);
      if (error instanceof SyntaxError) {
        res.status(400).json({ error: 'Invalid JSON payload', message: error.message });
      } else {
        res.status(500).json({ error: 'Webhook processing failed', message: error.message });
      }
    }
  }
);

// --- Webhook Event Handlers ---
interface InboundMessageWithSpeech extends InboundMessageWebhook {
  speech?: {
    text: string;
    // Add other speech properties if needed, based on LoopMessage docs
  };
  // message_type might also be useful if it co-exists with speech
  message_type?: string;
}

// Log all webhook events
async function handleWebhook(payload: WebhookPayload) {
  console.log(`[Webhook Event] Received event type: ${payload.type}`);
  console.log(`[Webhook Event] Full payload:`, JSON.stringify(payload, null, 2));
}

async function handleInboundMessageWithSpeech(basePayload: WebhookPayload) {
  console.log('[message_inbound] Handler triggered!');
  const payload = basePayload as InboundMessageWithSpeech; // Use our extended type

  const userContact = payload.from;
  let messageText = payload.text;

  console.log(`[message_inbound] From: ${userContact}, GroupID: ${payload.group_id || 'N/A'}`);

  // Check for transcribed audio based on API docs (speech object)
  // The SDK's InboundMessageWebhook type might not include 'speech' or 'message_type' directly yet.
  if (payload.message_type === 'audio' && payload.speech?.text) {
    messageText = payload.speech.text;
    console.log(`[message_inbound] Using transcribed audio: "${messageText}"`);
  } else {
    console.log(`[message_inbound] Received text: "${messageText}"`);
  }

  if (!userContact || !messageText || messageText.trim() === '') {
    console.log('[message_inbound] No valid contact or message text to process.');
    return;
  }

  // Defer the actual processing and reply to avoid webhook timeouts
  processMessageAndReply(userContact, messageText, payload.group_id);
}

// --- Core Logic (OpenAI Interaction & Reply) ---
async function processMessageAndReply(contact: string, text: string, groupId?: string) {
  console.log(
    `[processMessageAndReply] Processing for contact: ${contact}, group: ${groupId || 'N/A'}, text: "${text}"`
  );

  // 1. Initialize or retrieve conversation history
  if (!conversationHistories[contact]) {
    conversationHistories[contact] = [
      {
        role: 'system',
        content: `You are Omny, a friendly and helpful proactive assistant. Your goal is to onboard new users for the Omny service. Guide the conversation loosely based on the following phases, adapting to user responses naturally. Be concise and conversational. User's contact (phone/email via iMessage) is ${contact}. Script phases: ${ONBOARDING_SCRIPT_PHASES.join(' | ')}`,
      },
    ];
  }
  conversationHistories[contact].push({ role: 'user', content: text });

  // Keep history to a reasonable length to manage token usage (e.g., last 10 messages)
  const maxHistoryLength = 20; // System prompt + 19 user/assistant messages
  if (conversationHistories[contact].length > maxHistoryLength) {
    conversationHistories[contact] = [
      conversationHistories[contact][0], // Keep the system prompt
      ...conversationHistories[contact].slice(-(maxHistoryLength - 1)),
    ];
  }

  try {
    console.log(
      `[processMessageAndReply] Sending to OpenAI with history:`,
      conversationHistories[contact]
    );
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Or gpt-4 if preferred and available
      messages: conversationHistories[contact],
      // stream: true, // Streaming can be implemented for faster perceived response
    });

    const assistantReply =
      chatCompletion.choices[0]?.message?.content?.trim() ||
      "I'm not sure how to respond to that right now.";
    console.log(`[processMessageAndReply] OpenAI response: "${assistantReply}"`);

    // Add AI's response to history
    conversationHistories[contact].push({ role: 'assistant', content: assistantReply });

    const replyParams: Omit<SendMessageParams, 'sender_name'> = {
      text: assistantReply,
    };

    if (groupId) {
      replyParams.group = groupId;
    } else {
      replyParams.recipient = contact;
    }

    await loopService.sendLoopMessage(replyParams);
    console.log(
      `[processMessageAndReply] Reply sent successfully to ${groupId ? 'group ' + groupId : contact}.`
    );
  } catch (error: any) {
    console.error(
      '[processMessageAndReply] Error during OpenAI call or sending reply:',
      error.message
    );
    const errorReplyParams: Omit<SendMessageParams, 'sender_name'> = {
      text: 'I encountered a little hiccup trying to process that. Please try again in a moment!',
      recipient: groupId ? undefined : contact,
      group: groupId ? groupId : undefined,
    };
    try {
      await loopService.sendLoopMessage(errorReplyParams);
    } catch (sendError) {
      console.error('[processMessageAndReply] Failed to send error message to user:', sendError);
    }
  }
}

// --- Landing Page & Health Check ---
app.get('/', (req: Request, res: Response) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Chat with Omny</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background-color: #f4f4f8; color: #333; text-align: center; padding: 20px; box-sizing: border-box; }
        .container { background-color: #fff; padding: 30px; border-radius: 12px; box-shadow: 0 8px 16px rgba(0,0,0,0.1); }
        h1 { color: #1a73e8; margin-bottom: 10px; }
        p { margin-bottom: 25px; font-size: 1.1em; line-height: 1.6; }
        .button { display: inline-block; padding: 15px 30px; background-color: #1a73e8; color: white; text-decoration: none; font-size: 1.2em; font-weight: bold; border-radius: 8px; transition: background-color 0.3s ease; }
        .button:hover, .button:focus { background-color: #1558b0; }
        .footer { margin-top: 30px; font-size: 0.9em; color: #777; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Meet Omny</h1>
        <p>Your new proactive assistant by LoopMessage. Ready to get started?</p>
        <a href="imessage://${SENDER_NAME}" class="button">Text Omny on iMessage</a>
      </div>
      <div class="footer">
        <p>Powered by LoopMessage & OpenAI</p>
      </div>
    </body>
    </html>
  `;
  res.send(htmlContent);
});

app.get('/health', (req: Request, res: Response) => {
  console.log('[Health] Health check requested');
  res
    .status(200)
    .json({ status: 'ok', timestamp: new Date().toISOString(), service: 'FullCircleExample' });
});

// Test endpoint to verify webhook URL
app.get('/webhooks/loopmessage', (req: Request, res: Response) => {
  console.log('[Test] GET request to webhook endpoint');
  res.status(200).json({
    message: 'Webhook endpoint is active. Use POST to send webhooks.',
    timestamp: new Date().toISOString(),
  });
});

// Catch-all route for debugging 404s - MUST be defined LAST
app.use((req: Request, res: Response) => {
  console.log('');
  console.log('=== 404 DEBUG: Unmatched Route ===');
  console.log(`[404] ${req.method} ${req.url}`);
  console.log('[404] Full URL:', req.protocol + '://' + req.get('host') + req.originalUrl);
  console.log('[404] Headers:', JSON.stringify(req.headers, null, 2));
  console.log('[404] Query params:', req.query);
  console.log('[404] Route params:', req.params);

  // Try to get body if it exists
  let bodyInfo = 'No body parser for this route';
  if (req.body) {
    if (Buffer.isBuffer(req.body)) {
      bodyInfo = `Buffer (${req.body.length} bytes): ${req.body.toString().substring(0, 200)}...`;
    } else {
      bodyInfo = JSON.stringify(req.body, null, 2);
    }
  }
  console.log('[404] Body:', bodyInfo);

  console.log('[404] Available routes:');
  console.log('  GET  /');
  console.log('  GET  /health');
  console.log('  GET  /webhooks/loopmessage');
  console.log('  POST /webhooks/loopmessage');
  console.log('=================================');
  console.log('');

  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
    availableRoutes: {
      'GET /': 'Landing page',
      'GET /health': 'Health check',
      'GET /webhooks/loopmessage': 'Webhook test endpoint',
      'POST /webhooks/loopmessage': 'Webhook receiver',
    },
    debug: {
      method: req.method,
      url: req.url,
      originalUrl: req.originalUrl,
      headers: req.headers,
    },
  });
});

app.listen(PORT, () => {
  console.log(`--- Full Circle OpenAI LoopMessage Example ---`);
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Webhook endpoint: http://localhost:${PORT}/webhooks/loopmessage`);
  console.log(`To make this publicly accessible, use ngrok:`);
  console.log(`  ngrok http ${PORT}`);
  console.log(
    `Then, configure the ngrok URL (e.g., https://xxxx.ngrok.io/webhooks/loopmessage) in your LoopMessage dashboard or Sender Name settings.`
  );
  console.log('Waiting for inbound messages...');
  console.log('');
  console.log('Available routes:');
  console.log(`  GET  http://localhost:${PORT}/`);
  console.log(`  GET  http://localhost:${PORT}/health`);
  console.log(`  GET  http://localhost:${PORT}/webhooks/loopmessage (test)`);
  console.log(`  POST http://localhost:${PORT}/webhooks/loopmessage (webhook)`);
  console.log('');
});

// Note: WebhookPayload was added to the import from '../../../src/types' at the top.
