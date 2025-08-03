import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createLogger, format, transports } from 'winston';

import { ConstraintEngine } from './constraint-engine';
import { errorHandler } from './middleware/error-handler';
import constraintRoutes from './routes/constraints';

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
    new transports.File({ filename: 'constraint-engine.log' })
  ],
});

const app = express();
const port = process.env.PORT || 8002;

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
    service: 'constraint-engine-mcp',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/constraints', constraintRoutes);

// Error handling
app.use(errorHandler);

// Start server
const server = app.listen(port, () => {
  logger.info(`Constraint Engine MCP Server running on port ${port}`);
});

server.on('error', (err: any) => {
  logger.error('Server error:', err);
  process.exit(1);
});

export { logger };