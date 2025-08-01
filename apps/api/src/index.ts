import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createLogger, format, transports } from 'winston';

import { errorHandler } from './middleware/error-handler';
import { authMiddleware } from './middleware/auth';
import { rateLimiter } from './middleware/rate-limiter';

// Import routes
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import documentRoutes from './routes/documents';
import constraintRoutes from './routes/constraints';
import analysisRoutes from './routes/analysis';
import alertRoutes from './routes/alerts';
import privacyRoutes from './routes/privacy';
import securityRoutes from './routes/security';
import complianceRoutes from './routes/compliance';

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
    new transports.File({ filename: 'logs/api.log' })
  ],
});

const app = express();
const port = process.env.API_PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(rateLimiter);

// Public routes (no authentication required)
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);

// Protected routes (authentication required)
app.use('/api/user', authMiddleware, userRoutes);
app.use('/api/documents', authMiddleware, documentRoutes);
app.use('/api/constraints', authMiddleware, constraintRoutes);
app.use('/api/analysis', authMiddleware, analysisRoutes);
app.use('/api/alerts', authMiddleware, alertRoutes);
app.use('/api/privacy', privacyRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/compliance', complianceRoutes);

// Error handling
app.use(errorHandler);

// Start server
app.listen(port, () => {
  logger.info(`Financial Analyzer API running on port ${port}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { logger };