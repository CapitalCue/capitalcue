import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { createError } from './error-handler';

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    userType: 'VC' | 'INVESTOR';
  };
}

export interface JWTPayload {
  userId: string;
  email: string;
  userType: 'VC' | 'INVESTOR';
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next(createError('Authorization header is required', 401));
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return next(createError('Token is required', 401));
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return next(createError('JWT secret not configured', 500));
    }

    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        return next(createError('Token has expired', 401));
      } else if (jwtError instanceof jwt.JsonWebTokenError) {
        return next(createError('Invalid token', 401));
      } else {
        return next(createError('Token verification failed', 401));
      }
    }

    // Verify user still exists in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        userType: true,
      },
    });

    if (!user) {
      return next(createError('User not found', 401));
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    next(createError('Authentication failed', 401));
  }
};

export const requireUserType = (allowedTypes: ('VC' | 'INVESTOR')[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    if (!allowedTypes.includes(req.user.userType)) {
      return next(createError('Insufficient permissions', 403));
    }

    next();
  };
};

export const generateToken = (user: { id: string; email: string; userType: 'VC' | 'INVESTOR' }): string => {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

  if (!jwtSecret) {
    throw new Error('JWT secret not configured');
  }

  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    userType: user.userType,
  };

  return jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn } as jwt.SignOptions);
};

export const extractTokenPayload = (token: string): JWTPayload | null => {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) return null;

    return jwt.verify(token, jwtSecret) as JWTPayload;
  } catch (error) {
    return null;
  }
};