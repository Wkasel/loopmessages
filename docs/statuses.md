### **Statuses**Checking the status of submitted send requests

## **Request for check message status**

`GET` `https://server.loopmessage.com/api/v1/message/status/{id}/`

You can check the status of each individual message based on the message id.

### **Path Parameters**

**Name**

**Type**

**Description**

id*

String

ID that you received after a successful request to send a message

### **Headers**

**Name**

**Type**

**Description**

Authorization*

String

Authorization Key

Loop-Secret-Key*

String

API Secret Key

**200: OK Request for send received400: Bad Request Request for send failed404: Not Found Unable to find a message with this ID**

**Some fields in JSON may be optional**

Copy

```
{
    "message_id": "2BC4FD6A-CE49-439F-81DF-E895C09CA49C",
    "status": "processing",
    "recipient": "+13231112233",
    "text": "text",
    "sandbox": false,
    "error_code": 100,
    "sender_name": "string",
    "passthrough": "string",
    "last_update": "2021-12-31T23:59:59.809Z"
}
```

**error_code** - optional field for cases when sending was unsuccessful.

**sender_name** - optional field that is only displayed if a message was sent from a dedicated sender name. For sandbox sender names, this field will not be present.

**passthrough** - optional field that is displayed only if a value was passed in the send message request.

### **Available statuses**

All values will be in lowercase format

**Value**

**Description**

processing

Send request was successfully accepted and is being processed

scheduled

Send request successfully processed and scheduled for sending

failed

Failed to send or deliver a message

sent

Message was successfully delivered to a recipient

timeout

The minimum time required to send a message is timed out.

unknown

Message status is currently unknown
