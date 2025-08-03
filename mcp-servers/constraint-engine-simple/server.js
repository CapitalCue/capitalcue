const express = require('express');
const cors = require('cors');

const app = express();
const port = 8002;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'constraint-engine-mcp',
    timestamp: new Date().toISOString()
  });
});

// Get all constraints
app.get('/api/constraints', (req, res) => {
  res.json({
    success: true,
    data: [],
    count: 0
  });
});

// Add constraint
app.post('/api/constraints/add', (req, res) => {
  res.json({
    success: true,
    message: 'Constraint added successfully',
    data: req.body
  });
});

// Evaluate constraints
app.post('/api/constraints/evaluate', (req, res) => {
  const { constraints = [], metrics = [] } = req.body;
  
  res.json({
    success: true,
    data: {
      violations: [],
      totalConstraints: constraints.length,
      violationsCount: 0,
      criticalCount: 0,
      warningCount: 0,
      infoCount: 0
    }
  });
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Constraint Engine MCP Server running on http://0.0.0.0:${port}`);
  console.log(`✅ Health check: http://localhost:${port}/health`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});

server.on('listening', () => {
  console.log(`🚀 Server successfully bound to port ${port}`);
});

module.exports = app;