# Loop Messages SDK Examples

This directory contains example applications demonstrating how to use the Loop Messages SDK.

## Setup

Before running any examples:

1. Install dependencies from the root directory:
   ```
   npm install
   ```

2. Configure your environment variables or update the `config.ts` file:
   
   **Option 1: Environment Variables**
   ```bash
   export LOOP_AUTH_KEY="your-auth-key"
   export LOOP_SECRET_KEY="your-secret-key"
   export WEBHOOK_SECRET_KEY="your-webhook-secret-key"
   export LOOP_SENDER_NAME="your.sender@imsg.co"
   export DEFAULT_RECIPIENT="+1234567890"
   ```
   
   **Option 2: Create a .env file**
   Create a file named `.env` in the examples directory with your configuration:
   ```
   # API Credentials
   LOOP_AUTH_KEY=your_loop_auth_key_here
   LOOP_SECRET_KEY=your_loop_secret_key_here
   WEBHOOK_SECRET_KEY=your_webhook_secret_key_here
   
   # Sender & Recipients
   LOOP_SENDER_NAME=your.sender@imsg.co
   DEFAULT_RECIPIENT=+1234567890
   ```
   
   **Option 3: Update config.ts**
   Edit `examples/config.ts` and update the credential values directly.

3. Run an example using ts-node:
   ```
   npx ts-node examples/sdk-example.ts
   ```

4. Or run all examples sequentially with the provided script:
   ```
   ./examples/run-all-examples.sh
   ```

## Available Examples

| Example File | Description |
|--------------|-------------|
| **sdk-example.ts** | Demonstrates the basic usage of the LoopSdk class to initialize and access all services |
| **messaging-example.ts** | Shows how to send different types of messages (text, audio, effects) and handle responses |
| **conversation-example.ts** | Demonstrates how to use the conversation API for group messaging features |
| **status-example.ts** | Shows how to check message status and wait for specific delivery states |
| **webhook-example.ts** | Demonstrates setting up a webhook server to receive incoming messages and events |
| **events-example.ts** | Illustrates creating custom services using the EventService base class and working with events |

## Key Concepts

### Shared Configuration

All examples use the shared `config.ts` file for credentials and settings. Update this file with your own values before running examples.

### Environment Variables

The following environment variables are recognized by the examples:

| Variable | Description | Default |
|----------|-------------|---------|
| `LOOP_AUTH_KEY` | Your Loop authorization key | - |
| `LOOP_SECRET_KEY` | Your Loop secret key | - |
| `WEBHOOK_SECRET_KEY` | Your webhook secret key | - |
| `LOOP_SENDER_NAME` | Your sender name | "Example Sender" |
| `DEFAULT_RECIPIENT` | Default recipient phone number | "+1234567890" |
| `GROUP_ID` | ID for group messaging examples | - |
| `PORT` | Port for webhook server | 3000 |
| `HOST` | Host for webhook server | "localhost" |
| `AUDIO_URL` | URL to audio file for audio message example | - |
| `MESSAGE_EFFECT` | Effect to use in effect examples | "confetti" |
| `DEBUG` | Enable debug logging | false |

### Event-Based Architecture

The SDK uses an event-based architecture, allowing you to:
- Subscribe to events from any service
- Receive notifications when messages are sent, delivered, or fail
- Handle incoming webhooks as events
- Create custom services that emit their own events

### Error Handling

The examples demonstrate proper error handling practices, including:
- Checking for and responding to API errors
- Implementing retry logic
- Logging errors for debugging

## Running Webhook Examples

To run the webhook example, you'll need:

1. A publicly accessible URL (use a service like ngrok for development)
2. Configure this URL as a webhook endpoint in your Loop dashboard
3. Run the webhook example server:
   ```
   npx ts-node examples/webhook-example.ts
   ```

## Creating Your Own Services

See `events-example.ts` for a demonstration of how to create your own custom services that extend the EventService base class. 