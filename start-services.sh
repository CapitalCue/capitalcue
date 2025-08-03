#!/bin/bash

# Start all MCP services for Railway deployment
set -e

echo "🚀 Starting CapitalCue services on Railway..."

# Start services in background
echo "Starting Document Parser on port 8001..."
cd /app/document-parser
python main.py &
PARSER_PID=$!

echo "Starting Constraint Engine on port 8002..."
cd /app/constraint-engine
PORT=8002 node dist/index.js &
CONSTRAINT_PID=$!

echo "Starting Alert Manager on port 8003..."
cd /app/alert-manager  
PORT=8003 node dist/index.js &
ALERT_PID=$!

echo "Starting AI Analyzer on port 8004..."
cd /app/ai-analyzer
PORT=8004 node dist/index.js &
AI_PID=$!

# Start main proxy server on PORT (Railway requirement)
echo "Starting proxy server on port ${PORT:-8080}..."
cd /app

# Create simple proxy server
node -e "
const http = require('http');
const httpProxy = require('http-proxy-middleware');
const express = require('express');

const app = express();
const port = process.env.PORT || 8080;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Proxy to services
app.use('/documents', httpProxy({ target: 'http://localhost:8001', changeOrigin: true, pathRewrite: { '^/documents': '' } }));
app.use('/constraints', httpProxy({ target: 'http://localhost:8002', changeOrigin: true, pathRewrite: { '^/constraints': '/api/constraints' } }));
app.use('/alerts', httpProxy({ target: 'http://localhost:8003', changeOrigin: true, pathRewrite: { '^/alerts': '/api/alerts' } }));
app.use('/ai', httpProxy({ target: 'http://localhost:8004', changeOrigin: true, pathRewrite: { '^/ai': '/api/analyze' } }));

app.listen(port, '0.0.0.0', () => {
  console.log(\`🌐 CapitalCue API Gateway running on port \${port}\`);
});
" &
PROXY_PID=$!

# Wait for services to start
sleep 10

echo "✅ All services started!"
echo "PIDs: Parser=$PARSER_PID, Constraint=$CONSTRAINT_PID, Alert=$ALERT_PID, AI=$AI_PID, Proxy=$PROXY_PID"

# Keep the container running and handle signals
trap 'echo "Shutting down..."; kill $PARSER_PID $CONSTRAINT_PID $ALERT_PID $AI_PID $PROXY_PID 2>/dev/null; exit 0' SIGTERM SIGINT

# Wait for any service to exit
wait