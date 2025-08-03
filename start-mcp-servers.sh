#!/bin/bash

# Start all MCP servers for Financial Analyzer
echo "Starting Financial Analyzer MCP Servers..."

# Kill any existing servers on these ports
echo "Stopping existing servers..."
lsof -ti:8001,8002,8003,8004 | xargs kill -9 2>/dev/null || true

# Wait a moment for ports to be released
sleep 2

# Start AI Analyzer (Port 8004)
echo "Starting AI Analyzer on port 8004..."
cd mcp-servers/ai-analyzer
npm start &
AI_PID=$!
cd ../..

# Start Constraint Engine (Port 8002)
echo "Starting Constraint Engine on port 8002..."
cd mcp-servers/constraint-engine-simple
npm start &
CONSTRAINT_PID=$!
cd ../..

# Start Alert Manager (Port 8003)
echo "Starting Alert Manager on port 8003..."
cd mcp-servers/alert-manager
npm start &
ALERT_PID=$!
cd ../..

# Start Document Parser (Port 8001)
echo "Starting Document Parser on port 8001..."
cd mcp-servers/document-parser
python3 main.py &
PARSER_PID=$!
cd ../..

# Wait for servers to start
sleep 5

# Check if servers are running
echo "Checking server status..."
curl -s http://localhost:8004/health && echo "✅ AI Analyzer (8004) - Running" || echo "❌ AI Analyzer (8004) - Failed"
curl -s http://localhost:8002/health && echo "✅ Constraint Engine (8002) - Running" || echo "❌ Constraint Engine (8002) - Failed"
curl -s http://localhost:8003/health && echo "✅ Alert Manager (8003) - Running" || echo "❌ Alert Manager (8003) - Failed"
curl -s http://localhost:8001/health && echo "✅ Document Parser (8001) - Running" || echo "❌ Document Parser (8001) - Failed"

echo "All MCP servers started. PIDs: AI=$AI_PID, Constraint=$CONSTRAINT_PID, Alert=$ALERT_PID, Parser=$PARSER_PID"
echo "To stop all servers, run: kill $AI_PID $CONSTRAINT_PID $ALERT_PID $PARSER_PID"