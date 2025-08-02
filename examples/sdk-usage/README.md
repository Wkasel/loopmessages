# SDK Usage Examples

This directory contains examples demonstrating core Loop Messages SDK functionality.

## Examples Overview

### 📱 messaging-example.ts

**Basic message sending with various features**

- Send text messages
- Send audio messages
- Add visual effects (confetti, fireworks, etc.)
- Handle errors and retries

```bash
npx ts-node messaging-example.ts
```

### 📊 status-example.ts

**Message status checking and monitoring**

- Check message delivery status
- Wait for specific status changes
- Poll status with configurable intervals
- Handle status timeouts

```bash
npx ts-node status-example.ts
```

### 🎯 sdk-example.ts

**Comprehensive SDK usage with event handling**

- Initialize the unified SDK
- Set up event listeners for all operations
- Send messages with effects
- React to messages
- Handle authentication flows

```bash
npx ts-node sdk-example.ts
```

### 💬 conversation-example.ts

**iMessage authentication and conversation management**

- Manage conversation threads
- Track message delivery in real-time
- Auto-reply to incoming messages
- Handle reactions and tapbacks
- Webhook integration with Express

```bash
npx ts-node conversation-example.ts
```

### 📡 events-example.ts

**Event handling patterns and custom services**

- Create custom services extending EventService
- Implement event-driven architectures
- Handle errors with event emissions
- Build reactive applications

```bash
npx ts-node events-example.ts
```

### 🔗 webhook-example.ts

**Webhook handling for inbound messages**

- Set up Express server for webhooks
- Verify webhook signatures
- Handle different webhook event types
- Respond to incoming messages
- Process reactions and group events

```bash
npx ts-node webhook-example.ts
```

## Common Patterns

### Error Handling

All examples demonstrate proper error handling:

```typescript
try {
  const response = await sdk.sendMessage(params);
} catch (error) {
  if (error instanceof LoopMessageError) {
    console.error(`API Error (${error.code}): ${error.message}`);
  }
}
```

### Event Monitoring

Examples show how to monitor operations:

```typescript
sdk.on(EVENTS.SEND_SUCCESS, data => {
  console.log(`Message sent: ${data.response.message_id}`);
});

sdk.on(EVENTS.STATUS_CHANGE, data => {
  console.log(`Status: ${data.oldStatus} → ${data.newStatus}`);
});
```

### Async/Await Patterns

All examples use modern async/await syntax:

```typescript
async function sendAndWait() {
  const response = await sdk.sendMessage(params);
  const status = await sdk.waitForMessageStatus(response.message_id, 'sent');
  return status;
}
```

## Prerequisites

1. **Environment Variables** - Set these before running:

   ```bash
   export LOOP_SECRET_KEY="your-secret-key"
   export SENDER_NAME="your.sender@imsg.co"
   export DEFAULT_RECIPIENT="+1234567890"
   ```

2. **Dependencies** - Install from root directory:

   ```bash
   npm install
   ```

3. **TypeScript** - Examples use ts-node for direct execution

## Tips

- Start with `sdk-example.ts` for a comprehensive overview
- Use `webhook-example.ts` if you need to receive messages
- Check `events-example.ts` to understand the event system
- Review `conversation-example.ts` for advanced messaging flows

## Debugging

Enable debug logging in any example:

```typescript
const sdk = new LoopSdk({
  // ... your config
  logLevel: 'debug',
});
```

## Next Steps

After reviewing these examples:

1. Check the [main README](../../README.md) for API documentation
2. Explore the [server-apps](../server-apps) for full applications
3. Review the source code in [src](../../src) for implementation details
