#!/bin/bash

# Run all Loop Message SDK examples
# This script runs all examples in sequence

# Colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print header
echo -e "${BLUE}Loop Messages SDK - Example Runner${NC}"
echo -e "${BLUE}==================================${NC}\n"

# Check if ts-node is installed
if ! command -v ts-node &> /dev/null; then
    echo "ts-node is not installed. Installing..."
    npm install -g ts-node typescript
fi

# Function to run an example
run_example() {
    local example=$1
    echo -e "\n${GREEN}Running $example...${NC}"
    echo -e "${GREEN}$(printf '=%.0s' {1..50})${NC}"
    npx ts-node examples/$example
    echo -e "\n${GREEN}Completed $example${NC}"
    echo -e "${GREEN}$(printf '=%.0s' {1..50})${NC}"
    
    # Pause between examples
    echo "Press Enter to continue to the next example..."
    read
}

# Run all examples
run_example "sdk-example.ts"
run_example "messaging-example.ts"
run_example "status-example.ts"
run_example "webhook-example.ts"
run_example "conversation-example.ts"
run_example "events-example.ts"

echo -e "\n${BLUE}All examples have been executed.${NC}" 