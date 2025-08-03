const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Enable CORS for all routes
app.use(cors({
  origin: true,
  credentials: true
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    services: ['document-parser', 'constraint-engine', 'alert-manager', 'ai-analyzer']
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'CapitalCue API Gateway',
    version: '1.0.0',
    services: {
      documents: '/documents',
      constraints: '/constraints', 
      alerts: '/alerts',
      ai: '/ai'
    },
    health: '/health'
  });
});

// Start background services
function startService(name, command, args, port) {
  console.log(`🚀 Starting ${name} on port ${port}...`);
  
  const service = spawn(command, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PORT: port.toString() }
  });

  service.stdout.on('data', (data) => {
    console.log(`[${name}] ${data.toString().trim()}`);
  });

  service.stderr.on('data', (data) => {
    console.error(`[${name}] ${data.toString().trim()}`);
  });

  service.on('close', (code) => {
    console.log(`[${name}] Process exited with code ${code}`);
  });

  return service;
}

// Start all MCP services
const services = [];

// Document Parser (Python)
services.push(startService(
  'document-parser',
  'python',
  [path.join(__dirname, 'mcp-servers', 'document-parser', 'main.py')],
  8001
));

// Wait a bit for services to start
setTimeout(() => {
  // Use the simple constraint engine server instead
  services.push(startService(
    'constraint-engine',
    'node',
    [path.join(__dirname, 'mcp-servers', 'constraint-engine-simple', 'server.js')],
    8002
  ));

  // For now, we'll use a simple mock service for alert-manager and ai-analyzer
  console.log('⚠️  Alert Manager and AI Analyzer will use mock responses for now');
  
  // Create simple mock servers
  const express = require('express');
  
  // Mock Alert Manager
  const alertApp = express();
  alertApp.use(require('cors')());
  alertApp.use(express.json());
  alertApp.get('/health', (req, res) => res.json({ status: 'healthy', service: 'alert-manager-mock' }));
  alertApp.get('/api/alerts', (req, res) => res.json({ success: true, data: [], count: 0 }));
  alertApp.listen(8003, () => console.log('Mock Alert Manager running on port 8003'));
  
  // Mock AI Analyzer
  const aiApp = express();
  aiApp.use(require('cors')());
  aiApp.use(express.json());
  aiApp.get('/health', (req, res) => res.json({ status: 'healthy', service: 'ai-analyzer-mock' }));
  aiApp.post('/api/analyze', (req, res) => res.json({ 
    success: true, 
    data: { 
      insights: ['Financial analysis completed'], 
      recommendations: ['Review quarterly performance'] 
    }
  }));
  aiApp.listen(8004, () => console.log('Mock AI Analyzer running on port 8004'));
}, 2000);

// Set up proxy routes after services start
setTimeout(() => {
  console.log('🔗 Setting up proxy routes...');

  // Document Parser proxy
  app.use('/documents', createProxyMiddleware({
    target: 'http://localhost:8001',
    changeOrigin: true,
    pathRewrite: { '^/documents': '' },
    onError: (err, req, res) => {
      console.error('Document proxy error:', err.message);
      res.status(503).json({ error: 'Document service unavailable' });
    }
  }));

  // Constraint Engine proxy
  app.use('/constraints', createProxyMiddleware({
    target: 'http://localhost:8002',
    changeOrigin: true,
    pathRewrite: { '^/constraints': '/api/constraints' },
    onError: (err, req, res) => {
      console.error('Constraint proxy error:', err.message);
      res.status(503).json({ error: 'Constraint service unavailable' });
    }
  }));

  // Alert Manager proxy
  app.use('/alerts', createProxyMiddleware({
    target: 'http://localhost:8003',
    changeOrigin: true,
    pathRewrite: { '^/alerts': '/api/alerts' },
    onError: (err, req, res) => {
      console.error('Alert proxy error:', err.message);
      res.status(503).json({ error: 'Alert service unavailable' });
    }
  }));

  // AI Analyzer proxy
  app.use('/ai', createProxyMiddleware({
    target: 'http://localhost:8004',
    changeOrigin: true,
    pathRewrite: { '^/ai': '/api/analyze' },
    onError: (err, req, res) => {
      console.error('AI proxy error:', err.message);
      res.status(503).json({ error: 'AI service unavailable' });
    }
  }));

}, 5000);

// Start the proxy server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 CapitalCue API Gateway running on port ${PORT}`);
  console.log(`🔗 Available endpoints:`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Documents: http://localhost:${PORT}/documents`);
  console.log(`   Constraints: http://localhost:${PORT}/constraints`);
  console.log(`   Alerts: http://localhost:${PORT}/alerts`);
  console.log(`   AI: http://localhost:${PORT}/ai`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down services...');
  services.forEach(service => {
    if (service && !service.killed) {
      service.kill('SIGTERM');
    }
  });
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Shutting down services...');
  services.forEach(service => {
    if (service && !service.killed) {
      service.kill('SIGTERM');
    }
  });
  process.exit(0);
});