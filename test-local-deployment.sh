#!/bin/bash

# Test CapitalCue locally before Railway deployment
set -e

echo "🧪 Testing CapitalCue Local Deployment"
echo "====================================="

# Check if MCP servers are running
echo "🔍 Checking if MCP servers are running..."
if ! curl -s http://localhost:8001/health > /dev/null; then
    echo "Starting MCP servers first..."
    ./start-mcp-servers.sh &
    echo "⏳ Waiting for servers to start..."
    sleep 15
fi

# Install proxy dependencies
echo "📦 Installing proxy dependencies..."
npm install

# Start proxy server
echo "🚀 Starting proxy server..."
node proxy-server.js &
PROXY_PID=$!

# Wait for proxy to start
sleep 10

# Test endpoints
echo "🔍 Testing API endpoints..."

endpoints=(
    "http://localhost:8080/health"
    "http://localhost:8080/"
    "http://localhost:8080/constraints"
)

all_healthy=true

for endpoint in "${endpoints[@]}"; do
    echo "Testing $endpoint..."
    if curl -f -s "$endpoint" > /dev/null; then
        echo "✅ $endpoint is working"
    else
        echo "❌ $endpoint failed"
        all_healthy=false
    fi
done

# Stop proxy server
kill $PROXY_PID 2>/dev/null || true

if [ "$all_healthy" = true ]; then
    echo ""
    echo "🎉 Local deployment test PASSED!"
    echo "Your application is ready for Railway deployment."
    echo ""
    echo "Next steps:"
    echo "1. Follow the RAILWAY_DEPLOYMENT.md guide"
    echo "2. Deploy to Railway with: railway up"
    echo "3. Deploy frontend to Netlify"
else
    echo ""
    echo "❌ Local deployment test FAILED!"
    echo "Please check the MCP servers and try again."
    echo ""
    echo "Debug commands:"
    echo "- Check MCP servers: ./start-mcp-servers.sh"
    echo "- View logs: docker-compose -f docker-compose.prod.yml logs"
fi