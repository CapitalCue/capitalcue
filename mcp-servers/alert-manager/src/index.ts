import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createLogger, format, transports } from 'winston';

import { AlertManager } from './alert-manager';
import { errorHandler } from './middleware/error-handler';
import alertRoutes from './routes/alerts';

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
    new transports.File({ filename: 'alert-manager.log' })
  ],
});

const app = express();
const port = process.env.PORT || 8003;

// Initialize alert manager
const alertManager = new AlertManager();

// Make alert manager available to routes
app.locals.alertManager = alertManager;

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
    service: 'alert-manager-mcp',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/alerts', alertRoutes);

// Error handling
app.use(errorHandler);

// Start server
app.listen(port, () => {
  logger.info(`Alert Manager MCP Server running on port ${port}`);
});

export { logger, alertManager };