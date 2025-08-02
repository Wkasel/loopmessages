# Loop Messages SDK Examples

This directory contains examples demonstrating how to use the Loop Messages SDK.

## Directory Structure

### `/sdk-usage`

Pure SDK usage examples demonstrating core functionality:

- `messaging-example.ts` - Basic message sending with various features
- `status-example.ts` - Message status checking and monitoring
- `sdk-example.ts` - Comprehensive SDK usage with event handling
- `conversation-example.ts` - iMessage authentication and conversation management
- `events-example.ts` - Event handling patterns
- `webhook-example.ts` - Webhook handling for inbound messages

### `/server-apps`

Full-featured server applications built with the SDK:

- `/LLM` - AI-powered chatbot examples using OpenAI

## Getting Started

### Prerequisites

1. Loop Message API credentials
2. Node.js 18+ installed
3. TypeScript knowledge

### Setup

1. Install dependencies from the root directory:

   ```bash
   npm install
   ```

2. Set up your environment variables:

   ```bash
   export LOOP_SECRET_KEY="your-secret-key"
   export WEBHOOK_SECRET_KEY="your-webhook-secret-key"
   export SENDER_NAME="your.sender@imsg.co"
   export DEFAULT_RECIPIENT="+1234567890"
   ```

   Or create a `.env` file in the examples directory:

   ```env
   LOOP_AUTH_KEY=your_loop_auth_key_here
   LOOP_SECRET_KEY=your_loop_secret_key_here
   WEBHOOK_SECRET_KEY=your_webhook_secret_key_here
   SENDER_NAME=your.sender@imsg.co
   DEFAULT_RECIPIENT=+1234567890
   ```

### Running SDK Usage Examples

Navigate to the `sdk-usage` directory and run any example:

```bash
cd examples/sdk-usage
npx ts-node messaging-example.ts
```

### Running Server Applications

Server applications have their own setup instructions. See:

- [LLM Examples README](./server-apps/LLM/README.md)

## Common Configuration

All examples use shared configuration from `config.ts`:

- API credentials
- Default recipients
- Logger settings
- API endpoints

## Environment Variables

| Variable             | Description                    | Default       |
| -------------------- | ------------------------------ | ------------- |
| `LOOP_SECRET_KEY`    | Your Loop secret key           | -             |
| `WEBHOOK_SECRET_KEY` | Your webhook secret key        | -             |
| `SENDER_NAME`        | Your Loop sender name          | -             |
| `DEFAULT_RECIPIENT`  | Default recipient phone number | "+1234567890" |
| `LOG_LEVEL`          | Logging level                  | "info"        |

## Tips

1. Always use environment variables for credentials
2. Check the console output for detailed logging
3. Use the SDK event system for monitoring operations
4. Review error handling patterns in the examples
