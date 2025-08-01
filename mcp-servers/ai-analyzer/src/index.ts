import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createLogger, format, transports } from 'winston';

import { AIAnalyzer } from './ai-analyzer';
import { errorHandler } from './middleware/error-handler';
import analyzerRoutes from './routes/analyzer';

// Load environment variables
dotenv.config();

// Configure logger
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    new transports.File({ filename: 'ai-analyzer.log' })
  ],
});

const app = express();
const port = process.env.PORT || 8004;

// Initialize AI analyzer
const aiAnalyzer = new AIAnalyzer(process.env.ANTHROPIC_API_KEY);

// Make AI analyzer available to routes
app.locals.aiAnalyzer = aiAnalyzer;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'ai-analyzer-mcp',
    timestamp: new Date().toISOString(),
    claude_api_configured: !!process.env.ANTHROPIC_API_KEY
  });
});

// Routes
app.use('/api/analyze', analyzerRoutes);

// Error handling
app.use(errorHandler);

// Start server
app.listen(port, () => {
  logger.info(`AI Analyzer MCP Server running on port ${port}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    logger.warn('ANTHROPIC_API_KEY not configured - AI features will be limited');
  }
});

export { logger, aiAnalyzer };