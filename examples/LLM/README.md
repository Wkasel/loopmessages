# Loop Messages LLM Examples

This directory contains AI-powered chatbot examples using the Loop Messages SDK with OpenAI:

1. **Omny** (`fullcircle-example.ts`) - A general-purpose AI assistant
2. **Sam** (`highscore-example.ts`) - An AI credit repair coach for High Score

## Features

- Receives inbound messages via webhooks
- Processes messages using OpenAI's GPT model
- Maintains conversation history per user
- Sends intelligent replies back through Loop Messages
- Includes onboarding flow for new users
- Supports transcribed audio messages

## Prerequisites

1. Loop Message API credentials
2. OpenAI API key
3. ngrok (for local development)

## Setup

1. **Configure your credentials** in the `.env` file:
   ```bash
   LOOP_AUTH_KEY=your_loop_auth_key
   LOOP_SECRET_KEY=your_loop_secret_key
   WEBHOOK_SECRET_KEY=your_webhook_secret
   SENDER_NAME=your.sender@imsg.co
   OPENAI_API_KEY=your_openai_api_key
   PORT=3030
   ```

2. **Run the examples**:
   
   For Omny (general assistant):
   ```bash
   ./run-example.sh
   ```
   
   For Sam (credit repair coach):
   ```bash
   ./run-highscore.sh
   ```

   This script will:
   - Install required dependencies (ngrok, dotenv, openai)
   - Start an ngrok tunnel
   - Display the webhook URL to configure in your Loop Message account
   - Start the Express server

3. **Configure the webhook** in your Loop Message account:
   - Copy the ngrok URL displayed by the script
   - Set it as your webhook endpoint in Loop Message settings
   - The webhook path is: `<ngrok-url>/webhook/loopmessage`

4. **Test the chatbot**:
   - Send a message to your Loop Message sender
   - The bot will respond using OpenAI
   - Try sending "reset" to clear conversation history

## How it Works

1. User sends a message to your Loop Message sender
2. Loop Message sends a webhook to your server
3. The server processes the message with OpenAI
4. The response is sent back to the user via Loop Message API

## Customization

- Edit `SYSTEM_PROMPT` to change the bot's personality
- Modify `onboardingScript` to customize the onboarding flow
- Adjust OpenAI parameters (model, temperature, etc.) in the code

## Security Notes

- Never commit your `.env` file to version control
- Use environment variables for all sensitive credentials
- The webhook uses Bearer token authentication for security

## Troubleshooting

- If ngrok fails to start, make sure no other ngrok instances are running: `killall ngrok`
- Check the console for any error messages
- Ensure your Loop Message webhook is configured correctly
- Verify your API keys are valid