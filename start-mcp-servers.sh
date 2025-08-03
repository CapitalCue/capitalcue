#!/bin/bash

# Start all MCP servers for CapitalCue
set -e

echo "🚀 Starting CapitalCue MCP Servers..."

# Kill any existing servers on these ports
echo "🛑 Stopping existing servers..."
lsof -ti:8001,8002,8003,8004 | xargs kill -9 2>/dev/null || true

# Wait a moment for ports to be released
sleep 3

# Install dependencies for Node.js services (if needed)
echo "📦 Installing dependencies..."
cd mcp-servers/constraint-engine && npm install --silent 2>/dev/null || true && cd ../..
cd mcp-servers/alert-manager && npm install --silent 2>/dev/null || true && cd ../..
cd mcp-servers/ai-analyzer && npm install --silent 2>/dev/null || true && cd ../..

# Start Document Parser (Port 8001) - Python
echo "🐍 Starting Document Parser on port 8001..."
cd mcp-servers/document-parser
python3 main.py &
PARSER_PID=$!
cd ../..

sleep 3

# Start Constraint Engine (Port 8002) - Node.js
echo "⚖️  Starting Constraint Engine on port 8002..."
cd mcp-servers/constraint-engine
node server.js &
CONSTRAINT_PID=$!
cd ../..

sleep 2

# Start Alert Manager (Port 8003) - Node.js
echo "🚨 Starting Alert Manager on port 8003..."
cd mcp-servers/alert-manager
node server.js &
ALERT_PID=$!
cd ../..

sleep 2

# Start AI Analyzer (Port 8004) - Node.js
echo "🤖 Starting AI Analyzer on port 8004..."
cd mcp-servers/ai-analyzer
node server.js &
AI_PID=$!
cd ../..

# Wait for all services to initialize
echo "⏳ Waiting for services to initialize..."
sleep 10

# Health check with better formatting
echo "🔍 Performing health checks..."
echo ""

services=("8001:Document Parser" "8002:Constraint Engine" "8003:Alert Manager" "8004:AI Analyzer")
all_healthy=true

for service in "${services[@]}"; do
    port=${service%%:*}
    name=${service#*:}
    
    if curl -s -f "http://localhost:$port/health" > /dev/null; then
        echo "✅ $name (port $port) - Healthy"
    else
        echo "❌ $name (port $port) - Not responding"
        all_healthy=false
    fi
done

echo ""
if [ "$all_healthy" = true ]; then
    echo "🎉 All MCP servers started successfully!"
    echo ""
    echo "📊 Server URLs:"
    echo "   Document Parser: http://localhost:8001"
    echo "   Constraint Engine: http://localhost:8002" 
    echo "   Alert Manager: http://localhost:8003"
    echo "   AI Analyzer: http://localhost:8004"
    echo ""
    echo "📋 API Documentation:"
    echo "   Document Parser Swagger: http://localhost:8001/docs"
    echo "   Constraint Engine API: http://localhost:8002/api/constraints"
    echo "   Alert Manager API: http://localhost:8003/api/alerts"
    echo "   AI Analyzer API: http://localhost:8004/api/analyze"
    echo ""
    echo "🛑 To stop all servers: kill $PARSER_PID $CONSTRAINT_PID $ALERT_PID $AI_PID"
    
    # Save PIDs for easy cleanup
    echo "$PARSER_PID $CONSTRAINT_PID $ALERT_PID $AI_PID" > .mcp-pids
else
    echo "❌ Some servers failed to start. Stopping all services..."
    kill $PARSER_PID $CONSTRAINT_PID $ALERT_PID $AI_PID 2>/dev/null || true
    exit 1
fi