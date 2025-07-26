#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}High Score Credit Repair AI Assistant${NC}"
echo -e "${BLUE}=====================================>${NC}"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo "Please create a .env file with your API keys."
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check if required environment variables are set
if [ -z "$LOOP_AUTH_KEY" ] || [ "$LOOP_AUTH_KEY" = "YOUR_LOOP_AUTH_KEY" ]; then
    echo -e "${RED}Error: LOOP_AUTH_KEY not set in .env file${NC}"
    exit 1
fi

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo -e "${YELLOW}ngrok is not installed. Please install it first.${NC}"
    echo "Visit: https://ngrok.com/download"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "../../node_modules/dotenv" ]; then
    echo -e "${YELLOW}Installing dotenv...${NC}"
    cd ../.. && npm install dotenv && cd examples/LLM
fi

if [ ! -d "../../node_modules/openai" ]; then
    echo -e "${YELLOW}Installing openai...${NC}"
    cd ../.. && npm install openai && cd examples/LLM
fi

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down Sam...${NC}"
    # Kill ngrok
    if [ ! -z "$NGROK_PID" ]; then
        kill $NGROK_PID 2>/dev/null
    fi
    exit 0
}

# Set up trap to cleanup on script exit
trap cleanup EXIT INT TERM

# Start ngrok in the background
echo -e "${GREEN}Starting ngrok tunnel on port ${PORT:-3030}...${NC}"
ngrok http ${PORT:-3030} > /dev/null &
NGROK_PID=$!

# Wait for ngrok to start
sleep 3

# Get ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | grep -o 'https://[^"]*' | head -1)

if [ -z "$NGROK_URL" ]; then
    echo -e "${RED}Failed to get ngrok URL. Make sure ngrok is not already running.${NC}"
    echo "Try: killall ngrok"
    exit 1
fi

echo -e "${GREEN}✓ Ngrok tunnel created: ${NGROK_URL}${NC}"
echo ""
echo -e "${YELLOW}Configure webhook in your LoopMessage account:${NC}"
echo -e "${GREEN}1. Webhook URL: ${NGROK_URL}/webhooks/loopmessage${NC}"
echo -e "${GREEN}2. HTTP Authorization header value: highscore2024${NC}"
echo -e "   ${YELLOW}(Loop Message will send as 'Authorization: highscore2024')${NC}"
echo ""
echo -e "${BLUE}🤖 Sam is your AI credit repair coach who can:${NC}"
echo -e "   • Check current credit scores"
echo -e "   • Explain the dispute process"
echo -e "   • Track dispute status"
echo -e "   • Answer billing questions"
echo -e "   • Provide 24/7 support"
echo ""
echo -e "${YELLOW}Press Enter after you've configured the webhook...${NC}"
read

# Start the example
echo -e "${GREEN}Starting High Score AI Assistant...${NC}"
echo -e "${YELLOW}Landing page: http://localhost:${PORT:-3030}${NC}"
echo -e "${YELLOW}Webhook endpoint: ${NGROK_URL}/webhooks/loopmessage${NC}"
echo ""
echo -e "${GREEN}Sam is ready to help with credit repair!${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""

# Run the TypeScript file in foreground with error handling
echo -e "${YELLOW}Starting Sam...${NC}"
npx tsx highscore-example.ts || {
    echo -e "${RED}Error: Sam failed to start${NC}"
    echo -e "${YELLOW}Check that all dependencies are installed and your .env file is correct${NC}"
    exit 1
}