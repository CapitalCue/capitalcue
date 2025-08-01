import { Request, Response, NextFunction } from 'express';
import { logger } from '../index';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: AppError | any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';

  // Handle Prisma errors by checking error properties
  if (error.code && typeof error.code === 'string') {
    switch (error.code) {
      case 'P2002':
        statusCode = 409;
        message = 'A record with this data already exists';
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Record not found';
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Foreign key constraint failed';
        break;
      default:
        if (error.code.startsWith('P')) {
          statusCode = 400;
          message = 'Database operation failed';
        }
    }
  } else if (error.name === 'PrismaClientValidationError') {
    statusCode = 400;
    message = 'Invalid data provided';
  } else {
    // Handle custom app errors
    statusCode = (error as AppError).statusCode || 500;
    message = error.message || 'Internal Server Error';
  }

  logger.error('Error occurred:', {
    error: message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    statusCode,
    user: (req as any).user?.id,
  });

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: error.stack,
      details: error.code ? {
        code: error.code,
        meta: error.meta,
      } : undefined
    }),
  });
};

export const createError = (message: string, statusCode: number = 500): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};