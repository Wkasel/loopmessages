#!/bin/bash

# Script to find and kill zombie ngrok processes

echo "🔍 Looking for ngrok processes..."

# Method 1: Find all ngrok processes
NGROK_PIDS=$(pgrep ngrok)

if [ -z "$NGROK_PIDS" ]; then
    echo "✅ No ngrok processes found."
else
    echo "Found ngrok process(es):"
    ps aux | grep ngrok | grep -v grep
    echo ""
    
    # Show which ports they're using
    echo "📍 Checking ports used by ngrok:"
    for pid in $NGROK_PIDS; do
        echo "Process $pid:"
        lsof -Pan -p $pid -i | grep LISTEN || echo "  No ports found"
    done
    echo ""
    
    # Kill them
    echo "💀 Killing all ngrok processes..."
    killall ngrok
    
    # Verify they're gone
    sleep 1
    if pgrep ngrok > /dev/null; then
        echo "⚠️  Some processes survived, using force kill..."
        killall -9 ngrok
    fi
    
    echo "✅ All ngrok processes killed."
fi

# Method 2: Check if ngrok API is still running on port 4040
echo ""
echo "🔍 Checking ngrok API port 4040..."
if lsof -i:4040 | grep -q LISTEN; then
    echo "Found process on port 4040:"
    lsof -i:4040
    
    # Get PID and kill it
    PID=$(lsof -t -i:4040)
    if [ ! -z "$PID" ]; then
        echo "Killing process $PID..."
        kill $PID
        sleep 1
        # Force kill if needed
        if lsof -i:4040 | grep -q LISTEN; then
            kill -9 $PID
        fi
    fi
    echo "✅ Port 4040 cleared."
else
    echo "✅ Port 4040 is free."
fi

echo ""
echo "✨ Cleanup complete!"