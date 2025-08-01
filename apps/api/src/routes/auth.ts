import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, createError } from '../middleware/error-handler';
import { generateToken } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rate-limiter';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().min(2).max(100).required(),
  password: Joi.string().min(8).required(),
  userType: Joi.string().valid('VC', 'INVESTOR').required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Validation middleware
const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: Function) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return next(createError(error.details[0].message, 400));
    }
    next();
  };
};

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', 
  authRateLimiter,
  validateBody(registerSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, name, password, userType } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw createError('User with this email already exists', 409);
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        userType,
      },
      select: {
        id: true,
        email: true,
        name: true,
        userType: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      userType: user.userType,
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token,
      },
    });
  })
);

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login',
  authRateLimiter,
  validateBody(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw createError('Invalid credentials', 401);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw createError('Invalid credentials', 401);
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      userType: user.userType,
    });

    // Return user data (excluding password)
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token,
      },
    });
  })
);

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
router.post('/refresh',
  authRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;

    if (!token) {
      throw createError('Token is required', 400);
    }

    // In a production app, you might want to implement refresh tokens
    // For now, we'll just validate the existing token and issue a new one
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        userType: true,
      },
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    const newToken = generateToken({
      id: user.id,
      email: user.email,
      userType: user.userType,
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        user,
        token: newToken,
      },
    });
  })
);

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal)
 */
router.post('/logout', (req: Request, res: Response) => {
  // In a stateless JWT implementation, logout is handled client-side
  // In production, you might want to maintain a blacklist of invalidated tokens
  res.json({
    success: true,
    message: 'Logout successful',
  });
});

/**
 * GET /api/auth/me
 * Get current user info from token
 */
router.get('/me',
  asyncHandler(async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw createError('Authorization header is required', 401);
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          name: true,
          userType: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw createError('User not found', 404);
      }

      res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      throw createError('Invalid token', 401);
    }
  })
);

export default router;