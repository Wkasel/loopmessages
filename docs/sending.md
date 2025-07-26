## **Send single message**

An example between sent iMessage and regular Text Message (SMS)

[](https://docs.loopmessage.com/~gitbook/image?url=https%3A%2F%2F119477745-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F-Mk3R2LHrqWic_8rX_Bp%252Fuploads%252FeokaYaPS3Nf9Tklx1b4W%252Fiphone-imessage-vs-sms-4.png%3Falt%3Dmedia%26token%3D42b95560-0d59-417a-bdcb-dfc6bffdafba&width=768&dpr=4&quality=100&sign=2758a188&sv=2)

## **Request to send a text in iMessage to an individual recipient**

`POST` `https://server.loopmessage.com/api/v1/message/send/`

Use this endpoint to submit a message request to the sending queue.

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

Content-Type*

String

application/json

### **Request Body**

**Name**

**Type**

**Description**

recipient*

String

Phone number or Email.

text*

String

Your message text

attachments

Array

Optional. An array of strings. The string must be a full URL of your image. URL should start with `https://...`, `http` links (without SSL) are not supported. This must be a publicly accessible URL: we will not be able to reach any URLs that are hidden or that require authentication. Max length of each URL: 256 characters, max elements in the array: 3.

timeout

Integer

Value in seconds. If sending takes longer than the specified seconds, the request will be canceled. The value can't be less than 5 sec.

sender_name*

String

Your dedicated sender name. This parameter will be ignored if you send a request to a recipient who is added as a sandbox contact. If you've connected a phone number, you'll need to keep passing your original sender name. DON'T use a phone number as a value for this parameter.

passthrough

String

A string of metadata you wish to store in the request. Will be sent alongside all webhooks associated with the outbound message. Max length: 1000 characters.

status_callback

String

The URL where you want to receive the status updates of the message. Check the [Webhooks](https://docs.loopmessage.com/imessage-conversation-api/webhooks) section for details. Max length: 256 characters.

status_callback_header

String

The custom Authorization header will be contained in the callback. Max length: 256 characters.

reply_to_id

String

The `message_id` that you got from the webhook.

You can check the [Apple guide](https://support.apple.com/HT211303) about the `reply to` feature.

subject

String

Your message subject. A recipient will see this subject as a bold title before the text.

effect

String

Add effect to your message. Possible values: `slam`, `loud`, `gentle`, `invisibleInk`, `echo`, `spotlight`, `balloons`, `confetti`, `love`, `lasers`, `fireworks`, `shootingStar`, `celebration`.

You can check the [Apple guide](https://support.apple.com/HT206894#:~:text=Send%20a%20message%20with%20effects) about `expressive messages`.

service

Optional. You can choose which service to use to deliver the message.

Possible values: `imessage` or `sms`. The default value is `imessage`. Your sender name must have an active SMS feature.

SMS does not support `subject`, `effect`, or `reply_to_id` parameters. `attachments` in SMS - only support pictures (MMS).

**200: OK Request for send received400: Bad Request Request for send failed402: Payment Required No available request. Need purchase additional requests.**

Copy

```
{
    "message_id": "2BC4FD6A-CE49-439F-81DF-E895C09CA49C",
    "success": true,
    "recipient": "+13231112233",
    "text": "text"
}
```

Phone number will be converted to the next format `+13231112233`, without spaces and brackets. Email will be converted into a lowercase format.

**Important**

When you receive success response with code 200 from send request, it means that the server accepted your request for send and added it to the queue. But this does not mean that the message was delivered to the recipient or will be sent.

To handle messages status for this request, need to observe [Webhooks](https://docs.loopmessage.com/imessage-conversation-api/webhooks) or use [API method](https://docs.loopmessage.com/imessage-conversation-api/statuses) to check the status by message ID which you received in JSON response.

We recommend using webhooks to track statuses, as you will receive a callback as soon as an event occurs.

**Supported phone number formats**

Recipient phone numbers should be only in international formats with a country code. Otherwise will be impossible to verify a phone number.

Plus prefix `+` is optional. Spaces, dashes '`-`', brackets '`(123)`' - also optional.

Valid phone number format examples:

- 13231234567
- +13231111111
- +1 (323) 1111111
- +1 323 123 4567
- 1 (323)-123-4567

### **Text limits**

Max text length must be less than 10000 characters. Otherwise, all extra characters will be truncated. If you have larger requirements we recommend breaking the message up into several, smaller messages.

## **Send single message to iMessage group**

An example of how group chats look like in iMessage

[](https://docs.loopmessage.com/~gitbook/image?url=https%3A%2F%2F119477745-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F-Mk3R2LHrqWic_8rX_Bp%252Fuploads%252F4Yxz76kFOVRMJYZKVEQr%252Fgroup_chat.png%3Falt%3Dmedia%26token%3D3d333a3a-93b4-4762-af78-a8f416ef62e2&width=768&dpr=4&quality=100&sign=2630a0ac&sv=2)

## **Request to send a message to an iMessage group**

`POST` `https://server.loopmessage.com/api/v1/message/send/`

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

Content-Type*

String

application/json

### **Request Body**

**Name**

**Type**

**Description**

group*

String

iMessage group ID. You can only get this ID from the webhook `group_created` or `message_inbound`.

text*

String

Your message text

attachments

Array

Optional. An array of strings. The string must be a full URL of your image. URL should start with `https://...`, `http` links (without SSL) are not supported. This must be a publicly accessible URL: we will not be able to reach any URLs that are hidden or that require authentication. Max length of each URL: 256 characters, max elements in the array: 3.

timeout

Integer

Value in seconds. If sending takes longer than the specified seconds, the request will be canceled. The value can't be less than 5 sec.

sender_name*

String

Your dedicated sender name. This parameter will be ignored if you send a request to a recipient who is added as a sandbox contact. DON'T use a phone number as a value for this parameter.

passthrough

String

A string of metadata you wish to store with the checkout. Will be sent alongside all webhooks associated with the outbound message. Max length: 1000 characters.

status_callback

String

The URL where you want to receive the status updates of the message. Check the [Webhooks](https://docs.loopmessage.com/imessage-conversation-api/webhooks) section for details. Max length: 256 characters.

status_callback_header

String

The custom Authorization header will be contained in the callback. Max length: 256 characters.

**200: OK Request for send received400: Bad Request Request for send failed402: Payment Required No available request. Need purchase additional requests.**

Copy

```
{
    "message_id": "2BC4FD6A-CE49-439F-81DF-E895C09CA49C",
    "success": true,
    "group": {
        "group_id": "2BC4FD6A-CE49-439F-81DF-E895C09CA49C",
        "name": "String",  # Optinal field
        "participants": ["+13231112233", "+13232223344"]
    },
    "text": "text"
}
```

You can't create an iMessage Group, change its name, or add/remove participants to it via the API. You can only receive and reply to incoming messages/attachments.

## **Send audio message**

An example of how voice/audio messages look in iMessage

[](https://docs.loopmessage.com/~gitbook/image?url=https%3A%2F%2F119477745-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F-Mk3R2LHrqWic_8rX_Bp%252Fuploads%252FsLVVgANu67w8sYGfsvQY%252Fvoice_message.jpeg%3Falt%3Dmedia%26token%3D37bf9a74-72dd-4273-89e2-83353bfc51eb&width=768&dpr=4&quality=100&sign=9bbceb4e&sv=2)

## **Request to send an audio file as voice message**

`POST` `https://server.loopmessage.com/api/v1/message/send/`

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

Content-Type*

String

application/json

### **Request Body**

**Name**

**Type**

**Description**

recipient*

String

Phone number or Email.

text*

String

Your message text

media_url*

String

The string must be a full URL of your audio file. URL should start with `https://...`, `http` links (without SSL) are not supported. This must be a publicly accessible URL: we will not be able to reach any URLs that are hidden or that require authentication. Max length of each URL: 256 characters.

Audio files of the following formats are supported: `mp3`, `wav`, `m4a`, `caf`, `aac`.

sender_name*

String

Your dedicated sender name. This parameter will be ignored if you send a request to a recipient who is added as a sandbox contact. DON'T use a phone number as a value for this parameter.

status_callback

String

The URL where you want to receive the status updates of the message. Check the [Webhooks](https://docs.loopmessage.com/imessage-conversation-api/webhooks) section for details. Max length: 256 characters.

status_callback_header

String

The custom Authorization header will be contained in the callback. Max length: 256 characters.

passthrough

String

A string of metadata you wish to store in the request. Will be sent alongside all webhooks associated with the outbound message. Max length: 1000 characters.

audio_message*

Bool

Specifying that the message will be delivered as voice/audio.

**200: OK Request for send received400: Bad Request Request for send failed402: Payment Required No available request. Need purchase additional requests.**

Copy

```
{
    "message_id": "2BC4FD6A-CE49-439F-81DF-E895C09CA49C",
    "success": true,
    "recipient": "+13231112233",
    "text": "text"
}
```

Phone number will be converted to the next format `+13231112233`, without spaces and brackets. Email will be converted into a lowercase format.

This feature is under the beta. If you find any issues with this feature, please contact support.

To send audio message to an iMessage group you will need to use **group** field instead **recipient**.

## **Send a reaction**

An example of how tapback reactions looks like in iMessage

[](https://docs.loopmessage.com/~gitbook/image?url=https%3A%2F%2F119477745-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F-Mk3R2LHrqWic_8rX_Bp%252Fuploads%252FeZnpkv7KIDhV4FQaUFK1%252Fsend_reactions.png%3Falt%3Dmedia%26token%3Df75e947d-31e9-4b3e-a114-3e70a186e282&width=768&dpr=4&quality=100&sign=14f06298&sv=2)

## **Request to send reaction to iMessage**

`POST` `https://server.loopmessage.com/api/v1/message/send/`

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

Content-Type*

String

application/json

### **Request Body**

**Name**

**Type**

**Description**

recipient*

String

Phone number or Email.

text*

String

Your message text

message_id*

String

The `message_id` that you got from the webhook.

sender_name*

String

Your dedicated sender name. This parameter will be ignored if you send a request to a recipient who is added as a sandbox contact.

status_callback

String

The URL where you want to receive the status updates of the message. Check the [Webhooks](https://docs.loopmessage.com/imessage-conversation-api/webhooks) section for details. Max length: 256 characters.

status_callback_header

String

The custom Authorization header will be contained in the callback. Max length: 256 characters.

passthrough

String

A string of metadata you wish to store in the request. Will be sent alongside all webhooks associated with the outbound message. Max length: 1000 characters.

reaction*

String

Possible values:

`love`, `like`, `dislike`, `laugh`, `exclaim`, `question`, `-love`, `-like`, `-dislike`, `-laugh`, `-exclaim`, `-question`. Reactions that started with `-` mean "remove" it from the message.

You can check the [Apple guide](https://support.apple.com/HT206894#:~:text=Respond%20to%20a%20message%20with%20expressions) about reactions and tapbacks.

**200: OK Request for send received400: Bad Request Request for send failed402: Payment Required No available request. Need purchase additional requests.**

Copy

```
{
    "message_id": "2BC4FD6A-CE49-439F-81DF-E895C09CA49C",
    "success": true,
    "recipient": "+13231112233",
    "text": "text"
}
```

Phone number will be converted to the next format `+13231112233`, without spaces and brackets. Email will be converted into a lowercase format.

To send reactions to an iMessage group you will need to use **group** field instead **recipient**.

## **Failed requests**

If your request has a failed status, you will receive a JSON response with the following content:

Copy

```
{
    "success": false,
    "code": 100,
    "message": "string"
}
```

The "message" field is optional and is intended to briefly inform the developer about the cause of the error. Please do not pass this to the destination users who initiated the message request. Use the "code" field to map errors and show localized error text to them.

### **Error codes**

**Code**

**Description**

100

Bad request

110

Missing credentials in request

120

One or more required parameters for the request are missing

125

Authorization key is invalid or does not exist

130

Secret key is invalid or does not exist

140

No "text" parameter in request

150

No "recipient" parameter in request

160

Invalid recipient

170

Invalid recipient email

180

Invalid recipient phone number

190

A phone number is not mobile

210

Sender name not specified in request parameters

220

Invalid sender name

230

An internal error occurred while trying to use the specified sender name.

240

Sender name is not activated or unpaid

270

This recipient blocked any type of messages

300

Unable to send this type of message without dedicated sender name

330

You send messages too frequently to recipients you haven't contacted for a long time. You need to keep intervals between such messages to prevent suspension of your sender name by Apple.

400

No available requests/credits on your balance

500

Your account is suspended

510

Your account is blocked

530

Your account is suspended due to debt

540

No active purchased sender name to send message

545

Your sender name has been suspended by Apple

550

Requires a dedicated sender name or need to add this recipient as sandbox contact

560

Unable to send outbound messages until this recipient initiates a conversation with your sender.

570

This API request is deprecated and not supported

580

Invalid `effect` parameter

590

Invalid `message_id` for reply

595

Invalid or non-existent `message_id`

600

Invalid `reaction` parameter

610

`reaction` or `message_id` is invalid or does not exist

620

Unable to use `effect` and `reaction` parameters in the same request.

630

Need to set up a vCard file for this sender name in the dashboard

640

No media file URL - `media_url`

1110

Unable to send SMS if the recipient is an email address

1120

Unable to send SMS if the recipient is group

1130

Unable to send SMS with marketing content

1140

Unable to send audio messages through SMS

This list only describes the error codes you may receive when using endpoints from this page. Webhooks have separate error codes, which you can find in the [Webhooks Error Codes](https://docs.loopmessage.com/imessage-conversation-api/webhooks#error-codes) section.

## **Best Practices**

### **Handling failed cases**

There may be cases when impossible to deliver your text via iMessage, this can happen if, for example, your recipient is an Android user. We recommend that you handle the following cases to determine when failed to send a text via iMessage:

- If the response code for sending message is **not equal** `200`. In most cases, this means that the send request is incorrect.
- You receive a [webhook](https://docs.loopmessage.com/imessage-conversation-api/webhooks#alert-types) with the type `message_failed` or message [status](https://docs.loopmessage.com/imessage-conversation-api/statuses) is `failed`.
This means that the message can't be delivered to this recipient. Check the `error_code` [JSON field](https://docs.loopmessage.com/imessage-conversation-api/webhooks#error-codes) to better understand your case.
- You receive a [webhook](https://docs.loopmessage.com/imessage-conversation-api/webhooks#alert-types) with the type `message_sent`, but the `success` JSON field contains the `false` value.
That means a message was successfully sent, but it was unsuccessfully delivered on the recipient side. Examples: your recipient blocked you or uses filters from unknown senders. This case equal to "Not delivered" status in the Messages app.
- You receive a [webhook](https://docs.loopmessage.com/imessage-conversation-api/webhooks#alert-types) with the type `message_timeout` or message [status](https://docs.loopmessage.com/imessage-conversation-api/statuses) is `timeout`.
This happens if you passed the `timeout` parameter in the request to send a [single message](https://docs.loopmessage.com/imessage-conversation-api/send-message#send-single-message). In this case, this means that we failed to deliver a message within the specified time and it was assigned the timeout status.

### **Typing indicator and read status**

You can use these features to make chatting more interactive while a recipient waiting for a response.

- Show typing indicator

    [](https://docs.loopmessage.com/~gitbook/image?url=https%3A%2F%2F119477745-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F-Mk3R2LHrqWic_8rX_Bp%252Fuploads%252FQR6Fu66munYvfdXN9KBd%252Ftyping_animation.gif%3Falt%3Dmedia%26token%3D9b2c6692-4b51-49c9-8ffb-7f3285bad37f&width=768&dpr=4&quality=100&sign=72e47dc7&sv=2)

    You can show a typing indicator to let your contact know that you are processing their message. Check the "[Show typing indicator](https://docs.loopmessage.com/imessage-conversation-api/webhooks#show-typing-indicator)" section in the Webooks/Callbacks for details. **Please note that there is no separate request to show a read status or typing indicator. You can only implement this via webhooks.**

- Send read status

    [](https://docs.loopmessage.com/~gitbook/image?url=https%3A%2F%2F119477745-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F-Mk3R2LHrqWic_8rX_Bp%252Fuploads%252FfdOsyzbBKOWVu1NK6SR0%252Fread_status.jpg%3Falt%3Dmedia%26token%3D48bfad9d-d0a5-4eb3-89ff-055d19effa62&width=768&dpr=4&quality=100&sign=52ac64f9&sv=2)

    You can send a read status to a chat to let your contacts know that you have accepted the message and are processing it. Check the "[Send read status](https://docs.loopmessage.com/imessage-conversation-api/webhooks#send-read-status)" section in the Webooks/Callbacks for details. **Please note that there is no separate request to show a read status or typing indicator. You can only implement this via webhooks.**

### **Performance**

The queue for sending goes according to the [FIFO](https://en.wikipedia.org/wiki/FIFO_(computing_and_electronics)) principle. This means that every time you send a request, you add a new operation to the queue. All these operations in the queue work synchronously. Duration for each operation could take up to 1 seconds.

Each dedicated sender name has its own send queue. If you need to reach asynchronous messaging, you need to use multiple dedicated sender names equivalent to the number of queues required.

### **Attachment's cache**

Each sender name has its own cache. When you send an attachment for the first time, it takes some time for it to download into the cache before being sent to the recipient. If your attachments have a large size (more than a couple of megabytes), it will take some time until it is delivered to your contact. To minimize this delay between sending the text and attachments, you can send yourself a test message with an attachment. Thus, your files will be downloaded into the cache and all your subsequent requests will be instantly delivered.
