#!/bin/bash

# Test webhook with a sample message
curl -X POST https://6215-2605-59c0-2057-7008-19fc-ebbe-688b-c08c.ngrok-free.app/webhooks/loopmessage \
  -H "Content-Type: application/json" \
  -H "Authorization: omnydeveloper" \
  -d '{
    "alert_type": "message_inbound",
    "delivery_type": "imessage",
    "language": {
      "code": "en",
      "name": "English"
    },
    "message_id": "test-message-123",
    "message_type": "text",
    "recipient": "+14158186348",
    "sender_name": "will@a.imsg.co",
    "text": "Hello from curl test!",
    "webhook_id": "test-webhook-123",
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
  }'

echo ""
echo "Webhook test sent! Check your server logs for the response."