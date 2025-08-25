#!/bin/bash

# Test webhook with a sample message
curl -X POST https://your-ngrok-url.ngrok-free.app/webhooks/loopmessage \
  -H "Content-Type: application/json" \
  -H "Authorization: your-bearer-token" \
  -d '{
    "alert_type": "message_inbound",
    "delivery_type": "imessage",
    "language": {
      "code": "en",
      "name": "English"
    },
    "message_id": "test-message-123",
    "message_type": "text",
    "recipient": "+1234567890",
    "sender_name": "sender@example.imsg.co",
    "text": "Hello from curl test!",
    "webhook_id": "test-webhook-123",
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
  }'

echo ""
echo "Webhook test sent! Check your server logs for the response."