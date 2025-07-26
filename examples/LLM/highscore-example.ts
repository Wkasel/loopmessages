#!/usr/bin/env ts-node
import "dotenv/config";
/**
 * Loop Messages SDK - High Score Credit Repair AI Coach
 *
 * This example demonstrates Sam, an AI credit repair coach for High Score.
 * Sam provides 24/7 updates on credit repair journeys, answers questions about
 * credit scores, disputes, and billing.
 */
import express from 'express';
import type { Request, Response } from 'express';
import { WebhookHandler, LoopMessageService } from '../../src/index.js';
import type { InboundMessageWebhook, SendMessageParams, WebhookPayload } from '../../src/types.js';
import OpenAI from 'openai';

// --- Configuration ---
const LOOP_AUTH_KEY = process.env.LOOP_AUTH_KEY || 'YOUR_LOOP_AUTH_KEY';
const LOOP_SECRET_KEY = process.env.LOOP_SECRET_KEY || 'YOUR_LOOP_SECRET_KEY';
const WEBHOOK_SECRET_KEY = process.env.WEBHOOK_SECRET_KEY || 'YOUR_WEBHOOK_SECRET_KEY';
const SENDER_NAME = process.env.SENDER_NAME || 'your.sender@imsg.co';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY';
const PORT = process.env.PORT || 3030;
const EXPECTED_BEARER_TOKEN = 'highscore2024';

// Basic validation
if (
  LOOP_AUTH_KEY === 'YOUR_LOOP_AUTH_KEY' ||
  LOOP_SECRET_KEY === 'YOUR_LOOP_SECRET_KEY' ||
  SENDER_NAME === 'your.sender@imsg.co'
) {
  console.warn(
    'Please configure your LoopMessage credentials and Sender Name via environment variables.'
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
  senderName: SENDER_NAME,
  logLevel: 'info',
});

const webhooks = new WebhookHandler({
  loopAuthKey: LOOP_AUTH_KEY,
  loopSecretKey: LOOP_SECRET_KEY,
  webhookSecretKey: WEBHOOK_SECRET_KEY,
  logLevel: 'info',
});

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// --- User Data Store (Mock Database) ---
interface UserCreditData {
  name: string;
  currentScore: number;
  previousScore: number;
  scoreDate: string;
  disputesSubmitted: number;
  disputesResolved: number;
  disputesPending: number;
  lastActivityDate: string;
  lastActivity: string;
  nextBillDate: string;
  monthlyPayment: number;
  accountStatus: 'active' | 'paused' | 'cancelled';
  memberSince: string;
  estimatedCompletion: string;
}

// Mock user database - in production, this would be a real database
const userDatabase: Record<string, UserCreditData> = {};

// Function to get or create user data
function getUserData(contact: string): UserCreditData {
  if (!userDatabase[contact]) {
    // Generate random but realistic data for new users
    const baseScore = 520 + Math.floor(Math.random() * 80);
    const improvement = Math.floor(Math.random() * 30);
    
    userDatabase[contact] = {
      name: "there", // Default until they tell us their name
      currentScore: baseScore + improvement,
      previousScore: baseScore,
      scoreDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      disputesSubmitted: 3 + Math.floor(Math.random() * 5),
      disputesResolved: Math.floor(Math.random() * 3),
      disputesPending: 2 + Math.floor(Math.random() * 3),
      lastActivityDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      lastActivity: "Submitted dispute to Experian for Collections Account #4521",
      nextBillDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      monthlyPayment: 89.99,
      accountStatus: 'active',
      memberSince: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      estimatedCompletion: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toLocaleDateString()
    };
  }
  return userDatabase[contact];
}

// --- System Prompt for Sam ---
const SYSTEM_PROMPT = `You are Sam, an AI assistant working for Daniel at High Score Credit Repair. You're friendly, professional, and knowledgeable about credit repair. Your job is to provide 24/7 support to clients about their credit repair journey.

Key personality traits:
- Warm and encouraging, but professional
- Knowledgeable about credit repair processes
- Patient when explaining complex credit concepts
- Proactive in offering relevant information
- Always honest about timelines and expectations

Important context:
- High Score helps clients repair their credit by disputing inaccuracies with credit bureaus
- The process takes time (typically 3-6 months) because credit bureaus have 30-45 days to respond to each dispute
- Clients pay a monthly fee for the service
- Daniel is the founder and lead credit specialist

You have access to the client's data including their current score, dispute status, and billing information. Always personalize your responses with their specific information.

Keep responses concise and mobile-friendly (2-3 sentences when possible). Use emojis sparingly but effectively to maintain a friendly tone.`;

// --- Conversation History Store ---
interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'function';
  content: string;
  name?: string;
}
const conversationHistories: Record<string, ChatMessage[]> = {};

// Add middleware to log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// --- Webhook Endpoint ---
app.post(
  '/webhooks/loopmessage',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    console.log('[Webhook] POST /webhooks/loopmessage received');
    const authorizationHeader = req.headers['authorization'] as string;
    const rawBody = req.body.toString();

    // Auth validation
    let authorized = false;
    if (authorizationHeader) {
      const parts = authorizationHeader.split(' ');
      if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        authorized = parts[1] === EXPECTED_BEARER_TOKEN;
      } else if (parts.length === 1) {
        authorized = authorizationHeader === EXPECTED_BEARER_TOKEN;
      }
    }

    if (!authorized) {
      console.error('[Webhook] Unauthorized: Bearer token mismatch or missing.');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      console.log('[Webhook] Authorized. Processing webhook.');
      const parsedJson = JSON.parse(rawBody);
      
      // Adapt payload for SDK
      const payload: WebhookPayload = {
        type: parsedJson.alert_type,
        timestamp: parsedJson.timestamp || new Date().toISOString(),
        ...parsedJson,
        from: parsedJson.alert_type === 'message_inbound' ? parsedJson.recipient : undefined,
      } as any;

      webhooks.emit(payload.type, payload);
      webhooks.emit('webhook', payload);

      res.status(200).json({ typing: 3, read: true });
      console.log('[Webhook] Responded 200 OK');
    } catch (error: any) {
      console.error('[Webhook] Error:', error.message);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
);

// --- Webhook Event Handlers ---
webhooks.on('message_inbound', async (basePayload: WebhookPayload) => {
  console.log('[message_inbound] Handler triggered!');
  const payload = basePayload as InboundMessageWebhook;

  const userContact = payload.from;
  const messageText = payload.text;

  console.log(`[message_inbound] From: ${userContact}, Text: "${messageText}"`);

  if (!userContact || !messageText || messageText.trim() === '') {
    console.log('[message_inbound] No valid contact or message text.');
    return;
  }

  // Process message asynchronously
  processMessageAndReply(userContact, messageText, payload.group_id);
});

// --- Core AI Processing ---
async function processMessageAndReply(contact: string, text: string, groupId?: string) {
  console.log(`[AI] Processing message from ${contact}: "${text}"`);

  // Get user data
  const userData = getUserData(contact);
  
  // Check if user is introducing themselves
  const nameMatch = text.match(/(?:my name is|i'm|i am|call me)\s+(\w+)/i);
  if (nameMatch && nameMatch[1]) {
    userData.name = nameMatch[1];
    userDatabase[contact] = userData;
  }

  // Initialize conversation history
  if (!conversationHistories[contact]) {
    conversationHistories[contact] = [
      {
        role: 'system',
        content: SYSTEM_PROMPT
      },
      {
        role: 'system',
        content: `Current user data:
- Name: ${userData.name}
- Current Score: ${userData.currentScore} (was ${userData.previousScore} on ${userData.scoreDate})
- Disputes: ${userData.disputesSubmitted} submitted, ${userData.disputesResolved} resolved, ${userData.disputesPending} pending
- Last Activity: ${userData.lastActivity} on ${userData.lastActivityDate}
- Next Bill: $${userData.monthlyPayment} due ${userData.nextBillDate}
- Member Since: ${userData.memberSince}
- Estimated Completion: ${userData.estimatedCompletion}`
      }
    ];
  }

  // Add user message
  conversationHistories[contact].push({ role: 'user', content: text });

  // Keep history manageable
  if (conversationHistories[contact].length > 20) {
    conversationHistories[contact] = [
      conversationHistories[contact][0], // System prompt
      conversationHistories[contact][1], // User data
      ...conversationHistories[contact].slice(-18),
    ];
  }

  try {
    // Get AI response
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: conversationHistories[contact],
      temperature: 0.7,
      max_tokens: 200, // Keep responses concise
    });

    const assistantReply = chatCompletion.choices[0]?.message?.content?.trim() || 
      "I'm having a bit of trouble right now. Please try again in a moment!";
    
    console.log(`[AI] Response: "${assistantReply}"`);

    // Add to history
    conversationHistories[contact].push({ role: 'assistant', content: assistantReply });

    // Send reply
    const replyParams: Omit<SendMessageParams, 'sender_name'> = {
      text: assistantReply,
      recipient: groupId ? undefined : contact,
      group: groupId,
    };

    await loopService.sendLoopMessage(replyParams);
    console.log(`[Reply] Sent successfully to ${contact}`);

    // Simulate occasional score updates (10% chance)
    if (Math.random() < 0.1 && userData.currentScore < 750) {
      userData.previousScore = userData.currentScore;
      userData.currentScore += Math.floor(Math.random() * 15) + 5;
      userData.scoreDate = new Date().toLocaleDateString();
      userDatabase[contact] = userData;
      
      // Send proactive update
      setTimeout(async () => {
        const updateMessage = `🎉 Great news! Your credit score just updated to ${userData.currentScore} (up ${userData.currentScore - userData.previousScore} points)! The disputes we submitted are starting to show results. Keep up the great work!`;
        await loopService.sendLoopMessage({
          text: updateMessage,
          recipient: contact,
        });
      }, 5000);
    }

  } catch (error: any) {
    console.error('[AI] Error:', error.message);
    
    // Send error message
    try {
      await loopService.sendLoopMessage({
        text: "I'm having a technical issue right now. Please try again in a moment, or contact Daniel directly if urgent!",
        recipient: groupId ? undefined : contact,
        group: groupId,
      });
    } catch (sendError) {
      console.error('[Reply] Failed to send error message:', sendError);
    }
  }
}

// --- Landing Page ---
app.get('/', (req: Request, res: Response) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>High Score Credit Repair - AI Assistant</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          justify-content: center; 
          min-height: 100vh; 
          margin: 0; 
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          color: #fff; 
          text-align: center; 
          padding: 20px; 
        }
        .container { 
          background-color: rgba(255, 255, 255, 0.1); 
          backdrop-filter: blur(10px);
          padding: 40px; 
          border-radius: 20px; 
          box-shadow: 0 8px 32px rgba(0,0,0,0.1); 
          border: 1px solid rgba(255, 255, 255, 0.2);
          max-width: 500px;
        }
        h1 { 
          margin-bottom: 10px; 
          font-size: 2.5em;
        }
        .subtitle {
          font-size: 1.2em;
          opacity: 0.9;
          margin-bottom: 30px;
        }
        p { 
          margin-bottom: 30px; 
          font-size: 1.1em; 
          line-height: 1.6; 
          opacity: 0.95;
        }
        .button { 
          display: inline-block; 
          padding: 18px 40px; 
          background-color: #4CAF50; 
          color: white; 
          text-decoration: none; 
          font-size: 1.2em; 
          font-weight: bold; 
          border-radius: 50px; 
          transition: all 0.3s ease; 
          box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
        }
        .button:hover { 
          background-color: #45a049; 
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
        }
        .features {
          margin: 30px 0;
          text-align: left;
        }
        .feature {
          margin: 15px 0;
          display: flex;
          align-items: center;
        }
        .feature-icon {
          margin-right: 15px;
          font-size: 1.5em;
        }
        .logo {
          font-size: 3em;
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">📊</div>
        <h1>High Score Credit Repair</h1>
        <p class="subtitle">Meet Sam, Your 24/7 AI Credit Coach</p>
        <div class="features">
          <div class="feature">
            <span class="feature-icon">✅</span>
            <span>Real-time credit score updates</span>
          </div>
          <div class="feature">
            <span class="feature-icon">📋</span>
            <span>Dispute status tracking</span>
          </div>
          <div class="feature">
            <span class="feature-icon">💳</span>
            <span>Billing and account info</span>
          </div>
          <div class="feature">
            <span class="feature-icon">🤖</span>
            <span>24/7 instant support</span>
          </div>
        </div>
        <a href="imessage://${SENDER_NAME}" class="button">Text Sam Now</a>
      </div>
    </body>
    </html>
  `;
  res.send(htmlContent);
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'ok', 
    service: 'High Score AI Assistant',
    timestamp: new Date().toISOString() 
  });
});

// Test webhook endpoint
app.get('/webhooks/loopmessage', (req: Request, res: Response) => {
  res.status(200).json({ 
    message: 'High Score webhook endpoint is active',
    timestamp: new Date().toISOString() 
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  console.log(`[404] ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Not Found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`--- High Score Credit Repair AI Assistant ---`);
  console.log(`🤖 Sam is ready to help with credit repair!`);
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Webhook endpoint: http://localhost:${PORT}/webhooks/loopmessage`);
  console.log('');
  console.log('Example messages users can send:');
  console.log('  "What\'s my current credit score?"');
  console.log('  "Why is my score taking so long to improve?"');
  console.log('  "What\'s the status of my disputes?"');
  console.log('  "When is my next payment due?"');
  console.log('  "Tell me the latest updates"');
  console.log('');
});