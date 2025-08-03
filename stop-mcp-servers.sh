#!/bin/bash

# Stop all MCP servers for Financial Analyzer
echo "Stopping Financial Analyzer MCP Servers..."

# Kill any existing servers on these ports
echo "Stopping servers on ports 8001, 8002, 8003, 8004..."
lsof -ti:8001,8002,8003,8004 | xargs kill -9 2>/dev/null || true

# Wait a moment for processes to terminate
sleep 2

echo "All MCP servers stopped."